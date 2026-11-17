import { useRef, useState } from 'react'
import { HIGHLIGHT_ALPHA, isShape } from './types'
import type { ShapeKind, Stroke, Tool } from './types'
import { arrowHeadFor, hitsPoint, inRect, paintWidth, pathFor } from './geometry'
import type { Annotate } from './useAnnotate'

/**
 * THE INK SURFACE.
 *
 * One `<svg>` stretched over the slide, mounted by `Deck.tsx` INSIDE `SlideStage`
 * as a sibling of the slide itself. That position is the whole design, and it is
 * worth being explicit about why:
 *
 * `SlideStage` is a box that is exactly 1280x720 SLIDE px and is then fitted to the
 * screen with a CSS `transform: scale()`. An overlay inside that box therefore
 * shares the slide's coordinate system for free. A stroke stored as "x 640, y 360"
 * is the middle of the slide forever, in a small window, in fullscreen, on a 4K
 * projector, and in the built single-file HTML opened from `file://`. Nothing here
 * knows or cares what the current scale is.
 *
 * WHICH IS WHY THE POINTER IS CONVERTED FROM `getBoundingClientRect()` AND FROM
 * NOTHING ELSE. The svg's own on-screen rectangle already has every transform in
 * the chain baked into it, so `(clientX - rect.left) * (1280 / rect.width)` is the
 * slide coordinate under the pointer with no assumptions at all. An earlier
 * instinct is to reach for the scale factor `SlideStage` computed and divide by it:
 * that is a second copy of a number that already exists, it goes stale on a resize
 * that has not re-rendered yet, and it is wrong the moment anything above the stage
 * adds a transform of its own. `offsetX` is no better: it is measured against
 * whatever element the browser decided the event target was, which during a drag
 * over a slide full of cards is not this svg.
 *
 * POINTER CAPTURE, ALWAYS. A presenter circling something near the edge of the
 * slide will leave the stage mid-drag. Without capture the `pointerup` lands on
 * whatever is underneath, this component never hears it, and the draft stroke stays
 * glued to the pointer as a phantom that redraws on every later move. With capture
 * the drag is guaranteed to finish here.
 *
 * The draft stroke and a committed stroke render through the SAME `<Ink>`
 * component. What the presenter sees while drawing is exactly what lands, because
 * there is only one piece of code that can draw a stroke.
 */

/** Slide-space dimensions. Authored once, everywhere, in this deck. */
const SLIDE_W = 1280
const SLIDE_H = 720

/**
 * How far the pointer must travel before a freehand stroke stores another point,
 * in slide px.
 *
 * A modern pointer stream on a 240Hz-capable device fires far faster than the ink
 * moves, so a naive "push every move event" collected several thousand points for a
 * single circle round a word. Each one is roughly 12 characters of `d` attribute,
 * the deliverable is ONE self-contained HTML file, and a presenter who annotates
 * for an hour was building a path string measured in megabytes. 1.5px is below what
 * anyone can see at any projector size, and it typically drops four points in five.
 */
const MIN_STEP = 1.5
const MIN_STEP_SQ = MIN_STEP * MIN_STEP

/**
 * How far a press must travel before a line/rect/ellipse counts as drawn.
 *
 * Zero would be correct in theory and wrong in a room: a click that missed the
 * button it was aiming for would leave a 1px artefact on the slide that the
 * presenter then has to find and erase. A shape only exists if it was dragged.
 */
const MIN_DRAG = 2

/** The draft's id. Never committed: `commit` assigns the real one. */
const DRAFT_ID = '__draft__'

/**
 * THE HALO, AND WHY IT REPLACED A DROP SHADOW.
 *
 * Ink has to stay legible over both of the deck's grounds, because the marker does
 * not know whether the slide under it is the navy stage or a near-white content
 * slide, and an instructor mid-sentence is not going to check before drawing. The
 * first version gave the ink group a soft `feDropShadow`, which is the instinct
 * from UI work and is the wrong tool here: a shadow offset downwards separates a
 * shape from a surface, it does not raise contrast, so white ink on a white card
 * stayed invisible and merely acquired a grey edge below it.
 *
 * A halo does raise contrast. Each stroke is painted twice: once slightly wider in
 * the OPPOSITE luminance, once in its own colour on top. That gives every stroke a
 * hairline of guaranteed separation whatever it lands on, which is what WCAG's 3:1
 * for a graphical object you need in order to follow the content is asking for, and
 * it is why one six-colour palette can serve both grounds instead of the presenter
 * having to swap ink when the slide type changes.
 *
 * It also costs less than the filter did. A filter is an offscreen buffer; this is
 * one more path in the same layer.
 */
const HALO_LIGHT = '#FFFFFF'
const HALO_DARK = '#00254B'
/**
 * How much wider the halo is than the stroke, and WHY IT IS A PROPORTION.
 *
 * It was a flat 3.5px, which is right for a marker and wrong for the pen. The pen
 * paints at `PEN_SCALE` of its nib and is 1.8px at the fine nib: a flat 3.5px halo
 * round a 1.8px line is nearly three times the stroke's own width, so the mark on
 * screen reads as a fat pale smear with a thin dark core, which is the opposite of
 * the crisp hairline the pen exists to give.
 *
 * So the halo grows WITH the stroke, at half its width, and is then held between
 * 1.2 and 3.5px. The floor keeps a hairline from losing its edge entirely (which is
 * the whole reason the halo exists, since 1.8px of ink is exactly what a compressed
 * stream struggles with), and the ceiling keeps the bold marker from acquiring a
 * heavy outline that would start reading as a second colour.
 */
const HALO_MIN = 1.2
const HALO_MAX = 3.5
const haloGrow = (paint: number) => Math.min(HALO_MAX, Math.max(HALO_MIN, paint * 0.5))
const HALO_ALPHA = 0.55

/**
 * Which halo a colour needs: the perceptual midpoint, not the arithmetic one.
 *
 * sRGB relative luminance rather than an average of the channels, because green
 * carries most of the perceived brightness and blue almost none: `#2D63FB`
 * averages mid-grey and reads as dark, and averaging would have given the deck's
 * brand blue a dark halo it disappears into.
 */
function haloFor(hex: string): string {
  const h = hex.replace('#', '')
  const v = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * lin(v(0)) + 0.7152 * lin(v(2)) + 0.0722 * lin(v(4))
  return L > 0.45 ? HALO_DARK : HALO_LIGHT
}

/**
 * THE POINTER SHOWS WHICH INSTRUMENT IS IN THE PRESENTER'S HAND.
 *
 * A crosshair for every tool was the first version, and it is the setup for the
 * classic drawing-app failure: acting as if a different tool were selected. The
 * palette does say what is armed, but the palette is docked to the wall and the
 * presenter is looking at the slide, at the pointer, mid-sentence, in front of a
 * room. The one thing they ARE looking at should tell them.
 *
 * So the cursor is drawn per tool, in the ARMED INK COLOUR, as an inline SVG data
 * URI. Data URI and not a file, because the deliverable is one self-contained HTML
 * file opened from `file://`: an external cursor image would be a second request
 * that resolves to nothing, and the cursor would silently fall back.
 *
 * TWO PARTS, AND BOTH ARE LOAD-BEARING:
 *
 *   1. A small crosshair AT THE HOTSPOT. Ink lands where the hotspot is, not where
 *      the glyph is, and a glyph alone leaves the presenter guessing by a few px,
 *      which is the difference between underlining a word and striking through it.
 *   2. The tool's glyph, offset up and right of the hotspot so it never covers the
 *      point being aimed at. It is the same shape as the button in the palette, so
 *      the two read as one thing.
 *
 * The glyph is stroked in the ink colour over a white casing, so it stays visible
 * on the navy stage and on a light content slide, the same problem the ink's halo
 * solves and the same answer.
 *
 * SIZE IS CAPPED AT 32px. Browsers refuse a cursor larger than 128px and quietly
 * drop one they consider oversized, and a dropped cursor is a cursor that reverts
 * to an arrow, which is worse than the crosshair this replaced. 32 is comfortably
 * inside every engine's limit.
 *
 * `crosshair` is kept as the final fallback in the CSS value, so a browser that
 * rejects the data URI still gets a drawing pointer rather than a text arrow.
 */
const CURSOR_GLYPHS: Record<Tool, string> = {
  /* Every path is drawn on a 24 grid and then placed by the transform below, so
     these are the same shapes the palette buttons use. */
  pen: 'M9.5 20.5l3-.7 8.2-8.2a1.6 1.6 0 0 0-2.3-2.3l-8.2 8.2z',
  marker: 'M9.5 20.5l3.2-.8 8.3-8.3-2.5-2.5-8.3 8.3zM11.6 15.9l2.5 2.5',
  highlighter: 'M9 21.5h6.5M11 18.5l6.6-6.6 2.3 2.3-6.6 6.6zM17.9 11.6l1.7-1.7 2.3 2.3-1.7 1.7',
  line: 'M10 21L21 10',
  arrow: 'M10 21L21 10M15.5 10H21v5.5',
  rect: 'M11 11h10v10H11z',
  ellipse: 'M21 16a5 3.6 0 0 1-10 0 5 3.6 0 0 1 10 0z',
  eraser: 'M12 21.5h9M13.5 21.5l-2.6-2.6a1.2 1.2 0 0 1 0-1.7l5.3-5.3a1.2 1.2 0 0 1 1.7 0l2.6 2.6a1.2 1.2 0 0 1 0 1.7L16.5 21.5z',
  area: 'M11 10.5h10.5v9H11zM14 13l4.5 4.5M18.5 13L14 17.5',
}

/** Where the ink lands, in the cursor bitmap's own coordinates. */
const HOTSPOT = 6

function cursorFor(tool: Tool, color: string): string {
  const glyph = CURSOR_GLYPHS[tool]
  const casing = haloFor(color)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    /* The crosshair, cased first then inked, so it reads on any ground. */
    `<g stroke="${casing}" stroke-width="3.2" stroke-linecap="round" opacity="0.9">` +
    `<path d="M${HOTSPOT} 0.8V11M0.8 ${HOTSPOT}H11"/></g>` +
    `<g stroke="${color}" stroke-width="1.4" stroke-linecap="round">` +
    `<path d="M${HOTSPOT} 1.4V10.6M1.4 ${HOTSPOT}H10.6"/></g>` +
    /* The tool glyph, cased then inked, nudged clear of the hotspot. */
    `<g transform="translate(3 3) scale(1.05)" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${glyph}" stroke="${casing}" stroke-width="4" opacity="0.85"/>` +
    `<path d="${glyph}" stroke="${color}" stroke-width="1.9"/>` +
    `</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${HOTSPOT} ${HOTSPOT}, crosshair`
}

/**
 * One stroke, drawn.
 *
 * `paintWidth` is what decides how fat the highlighter is; this component never
 * multiplies a width itself, so pen and highlighter cannot drift apart.
 *
 * The highlighter differs in two ways beyond width, and both are deliberate:
 * `strokeOpacity` so the words underneath stay readable, and `butt` caps because a
 * round cap on a 25px-wide translucent stroke puts a visible darker lozenge at each
 * end of the highlight.
 */
function Ink({ stroke }: { stroke: Stroke }) {
  const isHi = stroke.kind === 'highlighter'
  const head = arrowHeadFor(stroke)
  const paint = {
    fill: 'none',
    stroke: stroke.color,
    strokeWidth: paintWidth(stroke.kind, stroke.width),
    strokeLinecap: isHi ? ('butt' as const) : ('round' as const),
    strokeLinejoin: 'round' as const,
    strokeOpacity: isHi ? HIGHLIGHT_ALPHA : undefined,
  }
  /*
    NO HALO UNDER A HIGHLIGHTER. The highlighter is a translucent multiplied wash,
    and a wider opaque band behind it would print a hard outline round every sweep
    and darken the words at its edges, which is the one thing the highlighter must
    not do. A 32px band does not need help being seen.
  */
  const halo = isHi
    ? null
    : {
        fill: 'none',
        stroke: haloFor(stroke.color),
        strokeWidth: paint.strokeWidth + haloGrow(paint.strokeWidth),
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeOpacity: HALO_ALPHA,
      }
  const d = pathFor(stroke)
  return (
    <>
      {halo ? <path d={d} {...halo} /> : null}
      {halo && head ? <path d={head} {...halo} /> : null}
      {/* `data-ink` marks the ONE path per stroke that carries the presenter's
          actual colour. The halo behind it and an arrow's head are paint, not
          strokes, so a harness counting ink counts this attribute rather than
          counting `<path>` elements and silently trebling when the halo landed. */}
      <path data-ink={stroke.id} d={d} {...paint} />
      {/* `arrowHeadFor` returns '' for everything that is not an arrow, so this is
          a single check rather than a branch per kind. */}
      {head ? <path d={head} {...paint} /> : null}
    </>
  )
}

/** Squared distance, because nothing here needs the square root. */
function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

/**
 * Where the second point of a two-point shape actually goes.
 *
 * Shift constrains, and what "constrain" means depends on the shape:
 *
 *   - A line or an arrow snaps to the nearest 45 degrees, keeping the length the
 *     pointer asked for. Snapping the axis instead (x or y, whichever moved more)
 *     is the cheaper trick and it cannot draw a diagonal, which is most of what an
 *     arrow on a slide is for.
 *   - A rect becomes a square and an ellipse a circle, grown from the ANCHOR corner
 *     using the larger of the two deltas, so the corner the presenter pressed on
 *     stays put and the shape only ever grows towards the pointer.
 */
function constrain(
  kind: ShapeKind,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): [number, number] {
  const dx = bx - ax
  const dy = by - ay
  if (kind === 'line' || kind === 'arrow') {
    const len = Math.hypot(dx, dy)
    const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
    return [ax + Math.cos(snapped) * len, ay + Math.sin(snapped) * len]
  }
  const side = Math.max(Math.abs(dx), Math.abs(dy))
  return [ax + Math.sign(dx || 1) * side, ay + Math.sign(dy || 1) * side]
}

export function AnnotationLayer({ ann }: { ann: Annotate }) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  /**
   * What the current drag is doing. A ref and not state: every `pointermove`
   * consults it, and it must never be one render behind the `pointerdown` that
   * set it.
   */
  const modeRef = useRef<'draw' | 'erase' | 'area' | null>(null)

  /**
   * The UNCONSTRAINED pointer position for a two-point shape, kept so that
   * pressing or releasing Shift mid-drag recomputes from the real pointer rather
   * than from an already-snapped point (which would ratchet: snap, re-snap, drift).
   */
  const rawRef = useRef<[number, number]>([0, 0])

  /** Ids the eraser has swept over during THIS drag, flushed once on release. */
  const doomedRef = useRef<string[]>([])

  const [draft, setDraft] = useState<Stroke | null>(null)
  const [marquee, setMarquee] = useState<[number, number, number, number] | null>(null)
  /**
   * The same doomed ids, as state, purely so the render can drop them.
   *
   * WHY BOTH. Erase has to LOOK immediate (the stroke vanishes under the pointer)
   * but must BEHAVE as one action (one drag, one undo entry). Calling `eraseIds`
   * per hit satisfies the first and destroys the second: undoing a single sweep
   * then took eleven presses of Ctrl+Z. So the strokes are hidden locally while the
   * drag runs and removed for real, in one call, on release.
   */
  const [doomed, setDoomed] = useState<string[]>([])

  /** Client point to slide point. The only conversion in the file. */
  const toSlide = (e: React.PointerEvent): [number, number] => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || r.width === 0 || r.height === 0) return [0, 0]
    return [(e.clientX - r.left) * (SLIDE_W / r.width), (e.clientY - r.top) * (SLIDE_H / r.height)]
  }

  /** The same conversion for a raw client point, used for coalesced samples. */
  const toSlidePoint = (cx: number, cy: number): [number, number] => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || r.width === 0 || r.height === 0) return [0, 0]
    return [(cx - r.left) * (SLIDE_W / r.width), (cy - r.top) * (SLIDE_H / r.height)]
  }

  /**
   * Sweep the eraser: anything under the point joins the doomed list.
   *
   * IT READS `ann.visible`, NOT `ann.strokes`, AND THAT IS A CORRECTNESS RULE
   * RATHER THAN AN OPTIMISATION. `strokes` is everything the slide holds, including
   * ink from a later build step and everything at all while the ink is hidden.
   * Erasing something the class cannot see is indistinguishable from a bug: nothing
   * happens on screen, the presenter erases again, and the loss is discovered two
   * slides later in front of the room. The eraser can only destroy what it can
   * currently point at.
   */
  const sweep = (x: number, y: number) => {
    const hit = ann.visible
      .filter((s) => !doomedRef.current.includes(s.id) && hitsPoint(s, x, y))
      .map((s) => s.id)
    if (hit.length === 0) return
    doomedRef.current = [...doomedRef.current, ...hit]
    setDoomed(doomedRef.current)
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ann.active) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [x, y] = toSlide(e)
    const tool = ann.tool

    if (isShape(tool)) {
      modeRef.current = 'draw'
      rawRef.current = [x, y]
      setDraft({
        id: DRAFT_ID,
        kind: tool,
        color: ann.color,
        width: ann.width,
        /* The draft carries the CURRENT build step so it renders through the same
           `<Ink>` path as a committed stroke, which is the whole point of there
           being one renderer: a draft that was not step-tagged would be filtered
           out of the visible set the instant anything read `step`, and the
           presenter would be drawing into nothing. `commit` stamps the real value,
           so this is only ever the value used for the draft's own paint. */
        step: ann.step,
        /* Freehand starts as a single point, which `pathFor` renders as a dot: a
           tap with no movement must still leave a mark, because tapping a term is
           how a presenter says "this one". A two-point shape starts degenerate and
           is discarded on release if it stayed that way. */
        pts: tool === 'pen' || tool === 'marker' || tool === 'highlighter' ? [x, y] : [x, y, x, y],
      })
      return
    }

    if (tool === 'eraser') {
      modeRef.current = 'erase'
      doomedRef.current = []
      setDoomed([])
      sweep(x, y)
      return
    }

    modeRef.current = 'area'
    setMarquee([x, y, x, y])
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const mode = modeRef.current
    if (!mode) return
    const [x, y] = toSlide(e)

    if (mode === 'erase') {
      sweep(x, y)
      return
    }
    if (mode === 'area') {
      setMarquee((m) => (m ? [m[0], m[1], x, y] : m))
      return
    }

    rawRef.current = [x, y]
    const shift = e.shiftKey
    /*
      COALESCED SAMPLES, BECAUSE ONE MOVE EVENT IS NOT ONE POINTER POSITION.

      The browser batches pointer samples and delivers at most one `pointermove`
      per animation frame. A pen or a fast trackpad reports far more often than
      that, so a circle drawn quickly arrives as eight or nine events, and taking
      only the event's own coordinate turns it into eight straight chords: a
      hand-drawn circle round a term came out as a visible polygon on the slide,
      and the faster the presenter moved the fewer sides it had.

      `getCoalescedEvents()` hands back the samples the browser discarded, in
      order, so the stroke follows the hand instead of following the frame clock.
      This does NOT undo the decimation: the same 1.5px gate runs over every
      sample, so the point count is still bounded by distance travelled rather
      than by device report rate, which is what keeps the single-file build small.

      AND AN EMPTY LIST IS NOT AN ANSWER, WHICH COST A WHOLE STROKE TO FIND OUT.

      The method is specified to return the events that were coalesced into this
      one, and for a plain `pointermove` with nothing coalesced browsers are
      entitled to return an empty array rather than the event itself. This code
      took the list at its word, so a move that reported no coalesced samples
      contributed NO POINTS: in the verification pass one stroke in four came out
      as a stub at the press position, with the rest of the drag simply gone. It
      is the worst class of bug this feature can have, because it loses the
      presenter's ink in front of a room and looks like a broken mouse.

      So the coalesced list is used only when it actually has something in it, and
      the event's own coordinate is the fallback. Belt and braces, and the braces
      are the ones that matter.

      Optional-chained through a `typeof` check rather than assumed, because this
      deck is opened by double-click from `file://` in whatever browser happens to
      be on the instructor's machine, and a missing method must degrade to the
      old single-sample behaviour rather than throw and lose the stroke.
    */
    const coalesced =
      typeof e.nativeEvent.getCoalescedEvents === 'function'
        ? e.nativeEvent.getCoalescedEvents()
        : []
    const samples: [number, number][] =
      coalesced.length > 0
        ? coalesced.map((c) => toSlidePoint(c.clientX, c.clientY))
        : [[x, y]]
    setDraft((d) => {
      if (!d) return d
      if (d.kind === 'pen' || d.kind === 'marker' || d.kind === 'highlighter') {
        const pts = [...d.pts]
        let added = false
        for (const [sx, sy] of samples) {
          const n = pts.length
          /* The decimation gate. Note it compares against the LAST STORED point,
             not against the last sample, so a slow drift still accumulates and
             eventually records rather than being thrown away forever. */
          if (distSq(pts[n - 2], pts[n - 1], sx, sy) < MIN_STEP_SQ) continue
          pts.push(sx, sy)
          added = true
        }
        /* Returning `d` unchanged when nothing was added matters: an identical new
           object would re-render the whole ink layer on every frame of a stroke
           that is standing still. */
        return added ? { ...d, pts } : d
      }
      const [ax, ay] = [d.pts[0], d.pts[1]]
      const [bx, by] = shift ? constrain(d.kind, ax, ay, x, y) : [x, y]
      return { ...d, pts: [ax, ay, bx, by] }
    })
  }

  const finish = () => {
    const mode = modeRef.current
    modeRef.current = null

    if (mode === 'draw') {
      if (draft) {
        const free = draft.kind === 'pen' || draft.kind === 'marker' || draft.kind === 'highlighter'
        const dragged =
          free || distSq(draft.pts[0], draft.pts[1], draft.pts[2], draft.pts[3]) >= MIN_DRAG * MIN_DRAG
        /* `draft` carries a placeholder `id` and its own `step`, and `commit` takes
           a stroke without either, because the hook stamps both. Passing a typed
           value (rather than a fresh object literal) is allowed to have the extra
           properties, so there is nothing to strip. */
        if (dragged) ann.commit(draft)
      }
      setDraft(null)
      return
    }

    if (mode === 'erase') {
      if (doomedRef.current.length > 0) ann.eraseIds(doomedRef.current)
      doomedRef.current = []
      setDoomed([])
      return
    }

    if (mode === 'area' && marquee) {
      const [ax, ay, bx, by] = marquee
      /* `visible` again, and for the same reason as `sweep`: a marquee dragged over
         a slide must take exactly the strokes it was drawn around, not also the ones
         belonging to a build step the room has not reached. */
      const ids = ann.visible.filter((s) => inRect(s, ax, ay, bx, by)).map((s) => s.id)
      if (ids.length > 0) ann.eraseIds(ids)
    }
    setMarquee(null)
  }

  const onCancel = () => {
    /* A cancelled pointer (a system gesture, a lost device) must not commit
       anything: the presenter never finished the stroke. */
    modeRef.current = null
    doomedRef.current = []
    setDraft(null)
    setDoomed([])
    setMarquee(null)
  }

  const visible =
    doomed.length === 0 ? ann.visible : ann.visible.filter((s) => !doomed.includes(s.id))
  const highlights = visible.filter((s) => s.kind === 'highlighter')
  const opaque = visible.filter((s) => s.kind !== 'highlighter')
  const draftIsHighlight = draft?.kind === 'highlighter'

  const rect = marquee
    ? {
        x: Math.min(marquee[0], marquee[2]),
        y: Math.min(marquee[1], marquee[3]),
        width: Math.abs(marquee[2] - marquee[0]),
        height: Math.abs(marquee[3] - marquee[1]),
      }
    : null

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 z-20 h-full w-full"
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      /* `touchAction: 'none'` or a stylus/finger drag scrolls the page instead of
         drawing, and the browser swallows the move events on the way.

         `pointerEvents` is gated on `active` rather than on the layer being
         unmounted, because ink must stay ON SCREEN after the presenter leaves
         marker mode to advance a build step. An always-mounted overlay that always
         ate clicks would make every slide unclickable, which is the one bug in this
         layer that would strand a session. */
      style={{
        touchAction: 'none',
        pointerEvents: ann.active ? 'auto' : 'none',
        /* Only while the marker is armed. With the pen down the layer is
           `pointer-events: none` and the cursor would not apply anyway, but stating
           it keeps the intent obvious: the pointer advertises a tool only when a
           tool is actually holding the pointer. */
        cursor: ann.active ? cursorFor(ann.tool, ann.color) : undefined,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={finish}
      onPointerCancel={onCancel}
    >

      {/*
        HIGHLIGHTS FIRST, SO THEY ARE UNDERNEATH.

        SVG paints in document order, so a highlight drawn AFTER a pen note would
        wash the note out, which is backwards: the presenter highlighted the words
        in order to point at them. Separating the two groups makes stacking a
        property of what a stroke IS rather than of when it was drawn.

        `mixBlendMode: multiply` on the group, not on each stroke: two overlapping
        highlighter passes at 0.35 alpha would otherwise composite towards opaque and
        the second pass over the same word turns it into a solid block. Multiply
        keeps the text underneath visible however many times it is swept.

        No halo on this group either, for the same reason `<Ink>` skips it: an
        opaque band behind a translucent wash prints a hard outline round every
        sweep, and a 32px band does not need help being seen.
      */}
      <g style={{ mixBlendMode: 'multiply' }}>
        {highlights.map((s) => (
          <Ink key={s.id} stroke={s} />
        ))}
        {draft && draftIsHighlight ? <Ink stroke={draft} /> : null}
      </g>

      {/* No group filter. Contrast is per stroke now, painted as a halo by `<Ink>`:
          see the halo comment at the top of this file for why a shadow was the wrong
          instrument and why one path costs less than one offscreen buffer. */}
      <g>
        {opaque.map((s) => (
          <Ink key={s.id} stroke={s} />
        ))}
        {draft && !draftIsHighlight ? <Ink stroke={draft} /> : null}
      </g>

      {/* The area-erase marquee. Dashed and unfilled, so it reads as a selection
          being made rather than as a rectangle being drawn: the rect tool's
          in-progress shape is solid, and confusing the two costs the presenter a
          stroke they then have to undo. */}
      {rect ? (
        <rect
          {...rect}
          fill="rgba(45, 99, 251, 0.06)"
          stroke="#2D63FB"
          strokeWidth={2}
          strokeDasharray="8 6"
        />
      ) : null}
    </svg>
  )
}
