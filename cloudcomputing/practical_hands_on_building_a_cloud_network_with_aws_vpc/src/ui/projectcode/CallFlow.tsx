import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveProject, type ProjectFigureProps } from './projectFigure'
import { RouteToggle, TOGGLE_CLEAR, TOGGLE_H, TOGGLE_W, useRoute } from './routeToggle'

/**
 * CALL FLOW — the handover is the subject, and the snippets are the evidence.
 *
 * THE ARGUMENT
 *
 * For a request path, WHAT HANDS TO WHAT is the lesson. A file map states
 * adjacency and calls it a day: it can say `urls.py` and `views.py` both exist
 * and are next to each other, and adjacency is not causation. This variant spends
 * the whole stage on the thing a map leaves out. Five compact cards in a chain,
 * each carrying its file, its `title` and its real snippet, and between every
 * consecutive pair a drawn connector with `via` riding it: "GET /api/products/",
 * "calls", "lazy queryset", "reads Product", "defines".
 *
 * The connector hops OVER the top of the cards rather than running between them,
 * for a measured reason: the gaps are 25px and "GET /api/products/" is about
 * 110px wide, so a label centred in a gap either overlaps the cards or gets
 * shrunk to illegibility. In the band above the cards it has 225px of clear room
 * per hop, and the label is the whole point of the variant, so the label wins the
 * geometry argument and the connector routes around it.
 *
 * TWO STOPS IN ONE FILE, WHICH THE FIXTURE HAS AND WHICH BROKE THE FIRST LAYOUT
 *
 * Stops 2 and 3 are both in `products/views.py`, one on the function and one on
 * the queryset line. Five equal cards in a row implies five files, and the room
 * would leave believing the project has five, which is a false statement about
 * the codebase. Three things say otherwise, and they are derived from the data
 * (`stops[i].file === stops[i + 1].file`), never hardcoded to index 1:
 *
 *   1. A tinted PLATE is drawn behind the pair, extending 8px past both cards, so
 *      the two read as one region. It costs no height because it sits behind.
 *   2. That plate is labelled "one file", left-aligned at x = the plate's left
 *      edge so it clears both connector legs, which stand at the card centres
 *      337 and 562.
 *   3. The connector across the pair is DASHED and carries no arrowhead. An
 *      arrowhead between two cards means control left one file and entered
 *      another, and here it did not: it moved two lines down the same function.
 *
 * WHAT IT IS WORST AT
 *
 * THE CODE. Every card is 200px wide, so the code column is 106px and
 * `    price = models.DecimalField(max_digits=8, decimal_places=2)` wraps to
 * three visual lines. Wrapped Python with a broken indent is genuinely harder to
 * read than the same lines in `TourStops`' 776px panel, and the worst card shows
 * ten visual lines for five real ones. Nothing is hidden, which is why wrapping
 * beat clipping, but this figure is for the room that needs the chain; anybody
 * who needs to READ the queryset line needs the other variant.
 *
 * Second, it answers "what happens next" and not "where does this live". There is
 * no persistent map here at all: the layer colour is the only clue to a file's
 * place in the project, and a chain cannot show that `serializers.py` sits beside
 * `models.py` rather than after it.
 *
 * DID IT USE THE KIT'S `CodeBlock`? NO. Two reasons, both fatal here. Its gutter
 * is hardcoded `{i + 1}`, and four of five stops do not start at line 1, so it
 * would tell the room the view body is at the top of its file. And it carries a
 * traffic-light title bar plus a language chip, which is about 40px of chrome per
 * card, five times over, on a figure whose entire budget is 400px. The local
 * renderer below is a `[gutter, code]` CSS grid, so a number cannot drift off its
 * own line.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x322 stage, and it was 384 while the cards still carried code. Each
 * handover owns a tier: 22, 36, 50, 64, with its `via` pill centred on its own line.
 * Cards are 200 wide on a 225 pitch (0, 225, 450, 675, 900, last right edge exactly
 * 1100), top 84, height 176, bottom 260. The plate reaches 268, its badge hangs
 * under that, and the caption is derived from the same expression rather than typed,
 * so it cannot go stale when the cards move: 84 + 176 + 8 + 26 = 294. The toggle
 * sits on that line, left, in its own reserved 210 x 28 box.
 *
 * PADDING IS A FLOOR, so CARD_H is checked against the fixture's worst card rather
 * than declared. Content width is 200 - 28 (px-14) = 172.
 *
 *   number and file chip             19px   (10px text on 1.3, plus 3px x 2)
 *   gap                               6px
 *   title, 3 lines allowed           48px   ("And the model is where it all
 *                                            resolves" is 37 chars at 12.5px
 *                                            semibold, about 259px, so 2 lines
 *                                            in 172; the third is headroom)
 *   gap                               6px
 *   body, 2 lines                    31px   (11.5px on 1.35; the fixture's longest
 *                                            body is 59 chars, about 348px, so 2)
 *   line range                       13px   (10px mono, pushed down by `mt-auto`)
 *   ------------------------------------
 *   content                         123px
 *   CARD_H 176 - 2 x 14 = 148       ->  25px of slack, which `mt-auto` puts above
 *                                       the range line rather than under the text,
 *                                       so the declared 14px stays real
 */

const W = 1100
/* Grown from 384: the same-file badge sits below the plate and the caption was
   landing on top of it. Both are derived below rather than pinned. */
const H = 322
const CARD_W = 200
const PITCH = 225
const CARDS_TOP = 84
const CARD_H = 176
/*
  ONE LEVEL PER HANDOVER, AND THIS WAS A REPORTED FAULT.

  Every connector used to run at the same y, which looked tidy and was not: an
  elbow ended by dropping into card i + 1 at its centre, and the next elbow left
  that same card from the same centre, so at every card the arrowhead coming in and
  the line going out were drawn on top of each other. Four hops, three collisions,
  and the arrows read as one continuous zig-zag rather than as four handovers.

  Two changes together, and neither works alone:

    1. **A TIER PER HOP.** Hop 0 runs at 22 and each one after it drops 14, so the
       staircase funnels down into the last card. No two horizontal runs share a y,
       and the labels that ride them cannot collide either.
    2. **THE LEGS STEP OFF CENTRE.** A hop leaves at `cx + 14` and arrives at
       `cx - 14`, so the outgoing leg and the incoming arrowhead at one card are
       28px apart instead of superimposed. This is the half that actually removes
       the overlap: tiers alone would still stack the legs.

  The lowest tier is 64 and the cards start at 84, so the shortest leg is 20px,
  which is enough for a 3px line and its arrowhead to read as a turn.
*/
const TIER_TOP = 22
const TIER_GAP = 14
const LEG_DX = 14
const LABEL_SLOT = 190
const PLATE_PAD = 8
/*
  BELOW THE SAME-FILE BADGE, NOT ON IT.

  `358` was set before the badge existed. The badge hangs off the bottom of the
  plate at `CARDS_TOP + CARD_H + PLATE_PAD - 2` and is about 18px tall, so the
  caption was printed straight through it. Derived from the same expression now,
  so it cannot go stale if the cards or the plate move.
*/
const CAPTION_Y = CARDS_TOP + CARD_H + PLATE_PAD + 26

const tierY = (i: number) => TIER_TOP + i * TIER_GAP
const left = (i: number) => i * PITCH
const cx = (i: number) => i * PITCH + CARD_W / 2

/**
 * THE CHAIN IS ONE COLOUR, AND IT USED TO BE FIVE.
 *
 * Every connector took its destination file's layer hue, which is right on a map
 * and wrong on a chain: five differently coloured 2px elbows read as five unrelated
 * arrows rather than as one path through the code, and that is exactly what came
 * back from the room. The layer hue still lives on each card's top rule, where it
 * identifies the file. The path is one weight and one colour, because it is one
 * path, and the stroke is 3px rather than 2. An SVG marker scales with
 * `strokeWidth` by default, so the arrowhead grew with it, which is the other half
 * of the same fix.
 */
const CHAIN = colors.brand

/** Same ramp, same order, in all three variants. See the note in `TourStops`. */
const RAMP = [colors.brand, colors.info, colors.teal, colors.accentDark, colors.success, colors.warning]

/** The hover aside, in idea from `NodeShell` in the sibling lab. */
function HoverAside({
  label,
  detail,
  paint,
  className = '',
  children,
}: {
  label: string
  detail?: ReactNode
  paint: string
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
        NEVER IN THE DOM UNLESS OPEN, because all three harnesses measure static
        rectangles. It opens downward and can reach past the figure's own bottom
        edge, which is safe precisely because it is never measured: the figure is
        centred on a 720px slide, so there is room below it on screen.

        0.18s is the documented UI-tier exception to the no-literals rule.
      */}
      <AnimatePresence>
        {open && detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[268px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{ color: colors.body, top: 'calc(100% + 10px)', transformOrigin: 'top center' }}
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

export function CallFlow({ files, stops, routes, caption, className = '' }: ProjectFigureProps) {
  const p = resolveProject({ files, stops, routes })
  /*
    WHICH ORDER. The chain rebuilds itself, connectors and `via` labels and all,
    because the mechanism of a handover has a direction: "GET /api/products/" is
    what reaches `urls.py` when a request arrives, and is not what `views.py` hands
    back when you are writing the code. Both routes are authored, and neither is the
    other one drawn backwards. See `TourRoute` in the contract.
  */
  const { route, index, pick, many } = useRoute(p)

  /*
    BEATS. Beat 0 is free and carries the first card, so the slide never opens on
    an empty stage. After that the chain builds along its own path: the edge out
    of card i, then card i + 1, which is the choreography rule from the sibling
    lab. Count is derived from `stops.length` and never from state.
  */
  const CARD = (i: number) => i * 2
  const EDGE = (i: number) => i * 2 + 1
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
          This chain cannot be drawn as authored.
        </span>
        {p.problems.map((m) => (
          <span key={m} className="text-body-sm" style={{ color: colors.body }}>
            {m}
          </span>
        ))}
      </figure>
    )
  }

  const paintOf = (path: string) => {
    const f = p.byPath[path]
    const i = p.layers.indexOf(f?.layer ?? 'unassigned')
    return RAMP[i % RAMP.length]
  }

  /* Two markers, not one per stop: the chain is one colour now. Named keys, because
     a layer name like "request handling" contains a space and would break the
     `url(#...)` reference. */
  const markers: Record<string, string> = { chain: CHAIN, tie: colors.muted }

  /** Consecutive stops in the SAME file. Derived, never an index literal. */
  const sameFile = (i: number) => route.stops[i] && route.stops[i + 1] && route.stops[i].file === route.stops[i + 1].file

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE PLATE BEHIND A SAME-FILE PAIR. First in the DOM, so it is behind the
          cards, and it costs the layout no height at all. */}
      {route.stops.map((_s, i) =>
        sameFile(i) ? (
          <FcNodeIn
            key={`plate${i}`}
            at={EDGE(i)}
            shown={shown[EDGE(i)]}
            className="absolute"
            style={{
              left: left(i) - PLATE_PAD,
              top: CARDS_TOP - PLATE_PAD,
              width: CARD_W + PITCH + PLATE_PAD * 2,
              height: CARD_H + PLATE_PAD * 2,
              zIndex: 0,
            }}
          >
            <span
              className="block h-full w-full rounded-xl2 border-2 border-dashed"
              style={{
                borderColor: `${paintOf(route.stops[i].file)}66`,
                background: `linear-gradient(${paintOf(route.stops[i].file)}0d, ${paintOf(route.stops[i].file)}0d), ${colors.white}`,
              }}
            />
          </FcNodeIn>
        ) : null,
      )}

      {/* CONNECTORS. One aria-hidden SVG layer: the lines are geometry, and every
          label on this figure is a real DOM element, per content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="callflow" colors={markers} />
        {route.stops.slice(0, -1).map((_s, i) => {
          const tie = sameFile(i)
          return (
            <FcEdgeDraw
              key={`e${i}`}
              /* Up off centre, across its own tier, down off centre into the next.
                 Each hop owns a level, and the two legs at a shared card are 28px
                 apart, so nothing is drawn on top of anything. */
              d={`M ${cx(i) + LEG_DX} ${CARDS_TOP} V ${tierY(i)} H ${cx(i + 1) - LEG_DX} V ${CARDS_TOP - (tie ? 0 : 6)}`}
              at={EDGE(i)}
              shown={shown[EDGE(i)]}
              stroke={tie ? colors.muted : CHAIN}
              width={tie ? 2 : 3}
              /* Dashed and headless across a same-file pair: an arrowhead here
                 would claim control crossed a file boundary that does not exist. */
              dashed={tie}
              markerEnd={tie ? undefined : 'url(#callflow-chain)'}
            />
          )
        })}
      </svg>

      {/* VIA LABELS. The mechanism of each handover, which is the argument of the
          whole variant, so it is set in the clearest room on the stage. */}
      {route.stops.slice(0, -1).map((s, i) =>
        s.via ? (
          <FcEdgeLabel
            key={`v${i}`}
            at={EDGE(i)}
            shown={shown[EDGE(i)]}
            className="absolute text-center"
            /* Centred on its own tier's line rather than parked in a shared band.
               The pill is opaque and painted after the SVG, so it masks the short
               stretch of wire behind it, which reads as a label ON the wire. */
            style={{
              left: (cx(i) + cx(i + 1)) / 2 - LABEL_SLOT / 2,
              width: LABEL_SLOT,
              top: tierY(i) - 13,
            }}
          >
            <span
              className="inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[11px] font-semibold"
              style={{
                background: `linear-gradient(${CHAIN}1a, ${CHAIN}1a), ${colors.white}`,
                color: CHAIN,
                border: `1px solid ${CHAIN}3d`,
              }}
            >
              {/* Its own tight-leading span: the pill is 27px tall from its own
                  padding against a 16.5px line, and `align-check.mjs` infers a
                  wrap by comparing the two. Measured, not guessed. Same false
                  positive the flow-chart lab hit on its token chips. */}
              <span className="leading-none">{s.via}</span>
            </span>
          </FcEdgeLabel>
        ) : null,
      )}

      {/* "one file", left-aligned at the plate's own left edge so it clears both
          connector legs, which stand at the card centres. */}
      {route.stops.map((_s, i) =>
        sameFile(i) ? (
          <FcEdgeLabel
            key={`tie${i}`}
            at={EDGE(i)}
            shown={shown[EDGE(i)]}
            className="absolute"
            style={{ left: left(i) - PLATE_PAD, top: CARDS_TOP + CARD_H + PLATE_PAD - 2 }}
          >
            <span
              className="inline-block rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: paintOf(route.stops[i].file), color: colors.white }}
            >
              one file, two stops
            </span>
          </FcEdgeLabel>
        ) : null,
      )}

      {/* THE STOPS */}
      {route.stops.map((s, i) => {
        const paint = paintOf(s.file)
        const snip = p.snippet(s)
        const continues = i > 0 && route.stops[i - 1].file === s.file
        return (
          <FcNodeIn
            key={s.id}
            at={CARD(i)}
            shown={shown[CARD(i)]}
            className="absolute"
            style={{ left: left(i), top: CARDS_TOP, width: CARD_W, height: CARD_H }}
          >
            <HoverAside label={`Stop ${i + 1}`} detail={s.detail} paint={paint} className="block h-full w-full">
              <div
                className="flex h-full w-full flex-col rounded-card border bg-white px-3.5 py-3.5 shadow-card-soft"
                style={{ borderColor: colors.line, borderTopColor: paint, borderTopWidth: 3 }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold"
                    style={{ background: paint, color: colors.white }}
                  >
                    {i + 1}
                  </span>
                  {/* The second stop in a file says so instead of repeating the
                      path, which is the third thing keeping the pair honest. */}
                  <span
                    className="min-w-0 truncate rounded-pill px-1.5 py-[3px] font-mono text-[10px] font-semibold"
                    style={{ background: `${paint}1a`, color: paint }}
                  >
                    {continues ? 'same file, below' : s.file}
                  </span>

                </span>

                <span
                  className="mt-1.5 block font-heading text-[12.5px] font-semibold leading-[1.28]"
                  style={{ color: colors.ink }}
                >
                  {s.title}
                </span>

                {/*
                  THE CODE CAME OUT, AND THAT IS THE FIX RATHER THAN A RETREAT.

                  A 106px code column at 10px wrapped nearly every line of this
                  fixture two to four times: `align-check.mjs` reported 28
                  wrapped tokens on this one slide, and
                  `price = models.DecimalField(max_digits=8, decimal_places=2)`
                  came out over four visual lines. Wrapping was the right call
                  against clipping, because a clipped line silently claims the
                  code ends where the card does. But the honest conclusion from
                  the measurement is that five snippets do not fit side by side
                  on a 1280px stage at any legible size, and a figure that shows
                  code the room cannot read is not showing code.

                  So this variant does what its own argument says it is for: the
                  HANDOVER. File, claim, and the mechanism on the line between.
                  The line range is still named, so the room knows where to look,
                  and `TourStops` is the variant that shows the lines themselves.
                  Two figures, two jobs, rather than one figure doing both badly.
                */}
                <span className="mt-1.5 block text-[11.5px] leading-[1.35]" style={{ color: colors.body }}>
                  {s.body}
                </span>

                <span
                  className="mt-auto block font-mono text-[10px]"
                  style={{ color: colors.muted }}
                >
                  {/*
                    "OF N" IS THE HALF THAT WAS MISSING, AND IT WAS REPORTED FROM
                    THE ROOM: a range with no total reads as the whole file, so
                    "lines 8 to 12" on a card with no code beside it looked like a
                    claim that the file has five lines. The total says out loud that
                    this is a POINTER at a window in a longer file, which is all
                    this variant claims to be now that the code has come out.
                  */}
                  lines {snip.from} to {snip.from + snip.lines.length - 1} of{' '}
                  {p.byPath[s.file]?.lines.length ?? '?'}
                </span>
              </div>
            </HoverAside>
          </FcNodeIn>
        )
      })}

      {/*
        THE TOGGLE SITS ON THE CAPTION LINE, LEFT, AND THE CAPTION IS INSET TO CLEAR
        IT. Every other band on this figure is spoken for: the label band carries
        `via`, the card band carries the cards, the plate band carries the same-file
        tie. Insetting the caption to 190..910 costs nothing, because it is one
        centred line of about 480px, and it keeps two rectangles from overlapping,
        which `align-check.mjs` measures and would otherwise flag.
      */}
      {many && (
        <span
          className="absolute"
          style={{ left: 0, top: CAPTION_Y - 4, width: TOGGLE_W, height: TOGGLE_H }}
        >
          <RouteToggle routes={p.routes} index={index} onPick={pick} />
        </span>
      )}

      {(route.claim ?? caption) && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          /* Inset past the toggle's reserved 210px box plus its 10px of clearance,
             and symmetrically on the right so the line stays centred on the stage. */
          style={{ left: TOGGLE_W + TOGGLE_CLEAR, width: W - 2 * (TOGGLE_W + TOGGLE_CLEAR), top: CAPTION_Y, color: colors.body }}
        >
          {route.claim ?? caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
