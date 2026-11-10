import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveProject, type ProjectFigureProps } from './projectFigure'
import { RouteToggle, TOGGLE_CLEAR, TOGGLE_H, TOGGLE_W, useRoute } from './routeToggle'

/**
 * LAYER MAP — the project by architectural layer, with the tour plotted onto it.
 *
 * THE ARGUMENT
 *
 * Some questions are "where does this live", not "what happens next", and a chain
 * cannot answer them. `CallFlow` can tell the room that the view calls the
 * serializer and still leave them unable to say which of the four files they
 * would open to add a field, because a chain has no place: it only has order.
 *
 * This draws the place. One band per `layer` in the fixture's own order, routing
 * at the top and data at the bottom, each band naming its file and its `role` and
 * holding one colour for the whole deck. Colour per layer is the single most
 * useful aid the walkthrough literature names, on the grounds that it is how a
 * reader identifies a module WITHOUT re-reading its name, and the colour here is
 * a function of the layer's index in `resolveProject().layers`, so routing is the
 * same blue in all three variants of this lab.
 *
 * The tour is then plotted across the bands, left to right in stop order, joined
 * by a drawn line. The shape of that line IS the lesson: the fixture descends
 * from the URL to the table, so the line steps steadily downward and the room can
 * see that a GET request is a descent through the stack. The router draws a
 * return leg the same way when a later stop sits in a higher band, so a tour that
 * comes back up, a serializer reaching for a model it has already visited, draws
 * as a climb rather than being flattened.
 *
 * Two stops in the same file need no special case here, and that is a real
 * property of this layout rather than luck: stops 2 and 3 are both
 * `products/views.py`, so they plot on the SAME band and the segment between them
 * is horizontal. A horizontal move means "still in this file", a vertical one
 * means "you have changed layer", and the room learns that distinction from the
 * geometry without being told.
 *
 * WHAT IT IS WORST AT
 *
 * THE CODE, almost entirely. A stop is a 62px chip carrying its number and its
 * line range. There is no snippet on this figure at all, so it cannot teach a
 * single line of Python: it is a map to be read before or after the code, never
 * instead of it. Put it on the slide that introduces the app and leave the
 * teaching to `TourStops`.
 *
 * Second, it collapses to nothing when a project has one file per layer and one
 * stop per file, because then the band and the chip say the same thing twice. It
 * needs a layer that is visited more than once to earn its height, which the
 * fixture only just provides.
 *
 * Third, it is honest about `via` and therefore silent about it: the segments are
 * unlabelled. Labelling five segments at four different heights puts text in the
 * gaps between bands, where there are 10px, so the mechanism of the handover is
 * `CallFlow`'s job and this figure does not pretend to it.
 *
 * DID IT USE THE KIT'S `CodeBlock`? NO, and unlike the other two variants it did
 * not want to. There is no snippet on this figure. `resolveProject().snippet` is
 * still called, for the one thing this layout does show about the code: the chip
 * reads the sliced snippet's own `from` and length, so "L8 to L12" is derived
 * from the same slice the other variants render rather than from the raw range,
 * and a chip can never disagree with a panel about which lines a stop is.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x398 stage. The toggle owns a reserved 230 x 28 box at the top left,
 * and the column headers it cannot reach sit at y=6. Four bands 74px tall on an
 * 82px pitch (42, 124, 206, 288), so the last band ends at 362 and the caption sits
 * at 374. The 14px between the toggle and the first band is air OUTSIDE the
 * control, which is the same floor the cards inside the bands honour: a control is
 * not exempt from the padding rule. The layer name column is 168px, the band body starts at 178. Stop chips
 * are 62 wide on an 84 pitch starting at x=660, so the fifth chip ends at 1058,
 * inside the 1084 the band's own 16px padding allows.
 *
 * PADDING IS A FLOOR. A box shows `(box - content) / 2`, so BAND_H is checked
 * against the fixture's longest strings rather than declared:
 *
 *   Band text block is 440px wide (194 to 634), which is what keeps it clear of
 *   the plot area at 660. `products/serializers.py` is 23 chars at 12px mono
 *   (0.6em = 7.2px) = 166px, one line. The longest role, "What a product IS, and
 *   the table behind it", is 42 chars at 11px (about 5.4px) = 227px, comfortably
 *   one line in 440. So content = 15.6 + 4 + 14.85 = 35px, and BAND_H 74 shows
 *   (74 - 35) / 2 = 19.5px of real vertical padding against 14px declared.
 *
 *   The 30px chip is shorter than the 35px text block, so it never sets the band
 *   height and the padding cannot be squeezed from that side. The layer name is
 *   the other candidate: "request handling" is 16 chars at 13px bold (about
 *   8px) = 128px against 152px of column, so it stays one line and contributes
 *   16px, under the 35px the text block already claims.
 */

const W = 1100
const H = 398
const HEAD_Y = 6
/* THE TOGGLE OWNS THE TOP-LEFT CORNER AND IS PAID FOR: 28 tall plus a 10px clear
   gap, so the first band starts at 38 rather than 30. The pitch drops from 84 to
   82 to buy it back, which takes the band gap from 10px to 8px. */
const BANDS_TOP = TOGGLE_H + TOGGLE_CLEAR
const BAND_H = 74
const BAND_PITCH = 82
const LAYER_COL = 168
const BODY_X = 178
const TEXT_W = 440
const PLOT_X0 = 660
const CHIP_W = 62
const CHIP_H = 30
const CHIP_PITCH = 84
const CAPTION_Y = 374

/** Same ramp, same order, in all three variants. See the note in `TourStops`. */
const RAMP = [colors.brand, colors.info, colors.teal, colors.accentDark, colors.success, colors.warning]

const bandTop = (i: number) => BANDS_TOP + i * BAND_PITCH
const chipLeft = (i: number) => PLOT_X0 + i * CHIP_PITCH

/** The hover aside, in idea from `NodeShell` in the sibling lab. */
function HoverAside({
  label,
  detail,
  paint,
  side,
  /** Keeps a 268px popover inside the figure at the right-hand end of the plot. */
  dx = 0,
  className = '',
  children,
}: {
  label: string
  detail?: ReactNode
  paint: string
  side: 'top' | 'bottom'
  dx?: number
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const has = Boolean(detail)
  return (
    <span
      className={`relative ${className}`}
      onPointerEnter={() => has && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <span
        className={`fc-node block h-full w-full ${has ? 'fc-node--hoverable' : ''}`}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </span>
      {/*
        NEVER IN THE DOM UNLESS OPEN. The harnesses measure static rectangles, so
        a panel parked at `opacity: 0` reads as a permanent frame overflow.
        0.18s is the documented UI-tier exception to the no-literals rule: a hover
        is triggered by the presenter and they are waiting for it.
      */}
      <AnimatePresence>
        {open && detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[268px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              marginLeft: dx,
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

export function LayerMap({ files, stops, routes, caption, className = '' }: ProjectFigureProps) {
  const p = resolveProject({ files, stops, routes })
  /*
    WHICH ORDER, AND THIS IS THE VARIANT THE TOGGLE PAYS OFF ON.

    The bands never move: routing stays at the top and data stays at the bottom,
    because that is where those layers ARE. Only the plotted line changes, so
    switching from the request order to the writing order turns a descent into a
    climb, in place, on one press. The room sees the two orders as the same four
    files walked in opposite directions, which is the whole claim, and no other
    variant here can show it without redrawing itself.
  */
  const { route, index, pick, many } = useRoute(p)

  /*
    BEATS. Beat 0 is free and carries the BANDS AND THE FIRST CHIP, so the slide
    opens on the whole map with the tour's starting point already on it, and the
    first click moves the tour rather than filling an empty frame.

    Then, per stop, the segment into it and the chip itself, in that order, which
    is the sibling lab's choreography rule: the figure assembles along the path
    rather than fading in as a finished picture. Count is derived from
    `stops.length` and never from state.
  */
  const SEG = (i: number) => i * 2 - 1
  const CHIP = (i: number) => (i === 0 ? 0 : i * 2)
  /* FROM `stopCount`, THE LONGEST ROUTE, NEVER FROM THE ACTIVE ONE: the number of
     build steps a slide registers cannot change while the slide is up. */
  const CAPTION = Math.max(0, (p.stopCount - 1) * 2 + 1)
  const shown = useBeats(CAPTION + 1)

  if (p.problems.length > 0) {
    return (
      <figure
        className={`mx-auto flex flex-col justify-center gap-2 rounded-card border-2 px-8 ${className}`}
        style={{ width: W, height: H, borderColor: colors.danger, background: colors.surface }}
      >
        <span className="font-heading text-[16px] font-bold" style={{ color: colors.danger }}>
          This project cannot be drawn as authored.
        </span>
        {p.problems.map((m) => (
          <span key={m} className="text-body-sm" style={{ color: colors.body }}>
            {m}
          </span>
        ))}
      </figure>
    )
  }

  /*
    COLOUR COMES FROM `layers`, POSITION COMES FROM THE ROUTE, AND THEY ARE NOT THE
    SAME ORDER.

    `p.layers` is first-appearance order in `files`, which is what keeps a layer the
    same hue in all three variants of this lab. It is a terrible band order: the
    fixture declares its files bottom up, models first, so the bands came out with
    data at the top and routing at the bottom, and the figure drew the request as a
    CLIMB while this file's own doc comment promised a descent.

    So the bands are ordered by first appearance along `routes[0]`, the request
    path, which puts routing at the top and data at the bottom and makes the descent
    real. Deliberately `routes[0]` and not the active route: the bands are where the
    layers ARE, so they must not move when the toggle flips. Only the plotted line
    changes, which is the whole point of the toggle on this variant, and the writing
    order then draws as the climb back up.
  */
  const bands: string[] = []
  for (const st of p.routes[0].stops) {
    const l = p.byPath[st.file]?.layer ?? 'unassigned'
    if (!bands.includes(l)) bands.push(l)
  }
  /* Any layer no stop visits still gets a band, at the bottom, rather than being
     silently dropped from a figure that claims to show the project. */
  for (const l of p.layers) if (!bands.includes(l)) bands.push(l)

  const paintOfLayer = (layer: string) => RAMP[p.layers.indexOf(layer) % RAMP.length]
  const bandOf = (path: string) => bands.indexOf(p.byPath[path]?.layer ?? 'unassigned')
  const paintOfPath = (path: string) => paintOfLayer(p.byPath[path]?.layer ?? 'unassigned')

  /* One marker per band colour. Index keys, because a layer name like "request
     handling" contains a space and would break the `url(#...)` reference. */
  const markers: Record<string, string> = {}
  p.layers.forEach((l, i) => {
    markers[`l${i}`] = paintOfLayer(l)
  })
  /* Keyed by the layer's RAMP index, not its band position, so a marker can never
     be a different colour from the line it caps. */
  const markerOf = (path: string) =>
    `url(#layermap-l${p.layers.indexOf(p.byPath[path]?.layer ?? 'unassigned')})`

  const chipCy = (i: number) => bandTop(Math.max(0, bandOf(route.stops[i].file))) + BAND_H / 2
  const chipCx = (i: number) => chipLeft(i) + CHIP_W / 2

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* COLUMN HEADERS. Real DOM, like every other piece of text here. */}
      <FcNodeIn at={0} shown={shown[0]} className="absolute" style={{ left: 0, top: HEAD_Y, width: W }}>
        <span className="block">
          {(
            [
              /*
                THE TOGGLE TAKES THIS ROW WHEN THERE IS ONE, AND BOTH LEFT HEADERS
                COME OUT.

                "Layer" is said four times over by the band labels underneath it,
                and "File, and what it is for" starts at 194, which is inside the
                toggle's 210px box: the first pass printed the pill straight through
                that header. `align-check.mjs` does not look for a collision like
                that, so it took a screenshot to find. The header the toggle cannot
                reach stays.
              */
              ...(many
                ? ([] as const)
                : ([
                    ['Layer', 0],
                    ['File, and what it is for', BODY_X + 16],
                  ] as const)),
              ['The tour, in order', PLOT_X0],
            ] as const
          ).map(([text, x]) => (
            <span
              key={text}
              className="absolute font-heading text-[11px] font-bold uppercase tracking-wider"
              style={{ left: x, color: colors.muted }}
            >
              {text}
            </span>
          ))}
        </span>
      </FcNodeIn>

      {many && (
        <span className="absolute" style={{ left: 0, top: 0, width: TOGGLE_W, height: TOGGLE_H }}>
          <RouteToggle routes={p.routes} index={index} onPick={pick} />
        </span>
      )}

      {/* THE BANDS. One per layer, in the fixture's own order, top to bottom. */}
      {bands.map((layer, li) => {
        const paint = paintOfLayer(layer)
        const inLayer = p.files.filter((f) => (f.layer ?? 'unassigned') === layer)
        return (
          <FcNodeIn
            key={layer}
            at={0}
            shown={shown[0]}
            className="absolute"
            style={{ left: 0, top: bandTop(li), width: W, height: BAND_H, zIndex: 0 }}
          >
            <div
              className="flex h-full w-full items-center rounded-card border px-0 py-3.5"
              style={{
                /* Two background layers, opaque base under the tint, so a segment
                   crossing a band cannot read through it as a hole. */
                background: `linear-gradient(${paint}0f, ${paint}0f), ${colors.white}`,
                borderColor: `${paint}33`,
                borderLeftColor: paint,
                borderLeftWidth: 5,
              }}
            >
              <span className="shrink-0 px-3.5" style={{ width: LAYER_COL }}>
                <span
                  className="block font-heading text-[13px] font-bold uppercase leading-[1.2] tracking-wide"
                  style={{ color: paint }}
                >
                  {layer}
                </span>
              </span>

              <span className="shrink-0 px-4" style={{ width: TEXT_W }}>
                {inLayer.map((f) => (
                  <span key={f.path} className="block">
                    <span
                      className="block font-mono text-[12px] font-semibold leading-[1.3]"
                      style={{ color: colors.ink }}
                    >
                      {f.path}
                    </span>
                    {f.role && (
                      <span className="mt-1 block text-[11px] leading-[1.35]" style={{ color: colors.body }}>
                        {f.role}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          </FcNodeIn>
        )
      })}

      {/* THE DESCENT. One aria-hidden SVG layer over the bands and under the
          chips: the segments are geometry, and every label is a DOM element, per
          content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="layermap" colors={markers} />
        {route.stops.slice(1).map((s, k) => {
          const i = k + 1
          const from = Math.max(0, bandOf(route.stops[i - 1].file))
          const to = Math.max(0, bandOf(s.file))
          const paint = paintOfLayer(bands[to])
          /*
            SAME BAND MEANS SAME FILE, so the move is horizontal and stays inside
            the band. `views.py` holds stops 2 and 3, and a straight run between
            them says "still in this file" without a word of copy.

            A CHANGE OF BAND turns out of the chip, runs through the 10px gutter
            between the bands, and drops or climbs into the next chip. `to < from`
            is the return leg and needs no separate branch: the same path
            expression draws it upward.
          */
          const down = to > from
          const d =
            to === from
              ? `M ${chipLeft(i - 1) + CHIP_W} ${chipCy(i - 1)} H ${chipLeft(i) - 6}`
              : `M ${chipCx(i - 1)} ${chipCy(i - 1) + (down ? CHIP_H / 2 : -CHIP_H / 2)} ` +
                `V ${chipCy(i) + (down ? -CHIP_H / 2 - 12 : CHIP_H / 2 + 12)} ` +
                `H ${chipCx(i)} ` +
                `V ${chipCy(i) + (down ? -CHIP_H / 2 - 6 : CHIP_H / 2 + 6)}`
          return (
            <FcEdgeDraw
              key={s.id}
              d={d}
              at={SEG(i)}
              shown={shown[SEG(i)]}
              stroke={paint}
              /*
                3px AND NOT 2, BECAUSE THE ARROWS WERE REPORTED AS UNCLEAR.

                An SVG marker scales with `strokeWidth` by default, so the
                arrowhead grew with the line: at 2px a 6px marker on a projector is
                a smudge at the end of a hairline. The segments also run through a
                10px gutter between two tinted bands, which is the least contrasted
                place on the figure, so the line has to carry its own weight.
              */
              width={3}
              markerEnd={markerOf(s.file)}
            />
          )
        })}
      </svg>

      {/* THE STOPS, PLOTTED. Left to right in tour order, at the height of the
          layer they are in. */}
      {route.stops.map((s, i) => {
        const paint = paintOfPath(s.file)
        const snip = p.snippet(s)
        const last = snip.from + Math.max(0, snip.lines.length - 1)
        const centre = chipCx(i)
        /* Keep the 268px popover inside the 1100px stage at either end. */
        const dx = Math.min(0, W - 14 - (centre + 134)) + Math.max(0, 14 - (centre - 134))
        return (
          <FcNodeIn
            key={s.id}
            at={CHIP(i)}
            shown={shown[CHIP(i)]}
            className="absolute"
            style={{
              left: chipLeft(i),
              top: chipCy(i) - CHIP_H / 2,
              width: CHIP_W,
              height: CHIP_H,
            }}
          >
            <HoverAside
              label={`Stop ${i + 1}: ${s.title}`}
              detail={s.detail}
              paint={paint}
              side={bandOf(s.file) < bands.length / 2 ? 'bottom' : 'top'}
              dx={dx}
              className="block h-full w-full"
            >
              <span
                className="flex h-full w-full items-center justify-center gap-1 rounded-pill shadow-card-soft"
                style={{ background: paint, color: colors.white }}
              >
                <span className="font-heading text-[13px] font-bold leading-none">{i + 1}</span>
                <span className="font-mono text-[9px] leading-none" style={{ opacity: 0.85 }}>
                  L{snip.from}
                  {last !== snip.from ? `-${last}` : ''}
                </span>
              </span>
            </HoverAside>
          </FcNodeIn>
        )
      })}

      {/* THE ROUTE'S OWN CLAIM WINS THE CAPTION SLOT, as in the other two variants:
          when the room has just changed the order, what that order claims IS the
          sentence under the figure. */}
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
