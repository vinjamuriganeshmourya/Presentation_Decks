import { HIGHLIGHT_SCALE, MARKER_SCALE, PEN_SCALE, type ShapeKind, type Stroke } from './types'

/**
 * ALL THE MATHS FOR THE MARKER, IN SLIDE COORDINATES, WITH NO REACT IN SIGHT.
 *
 * Two jobs live here and they are deliberately separate functions rather than one
 * clever one: turning a stroke into paint (`pathFor`, `arrowHeadFor`) and turning
 * a stroke into a shape you can ask questions of (`outlineOf`, `boundsOf`,
 * `hitsPoint`, `inRect`).
 *
 * WHY HIT TESTING GOES THROUGH A POLYLINE AND NOT THROUGH THE SVG PATH.
 *
 * The browser will hit test a `<path>` for free, so the naive eraser listens for
 * `pointerover` on the paths themselves. That fails three ways in this deck. A
 * hairline `fine` pen is 3 slide px wide, which at a windowed stage scale is
 * barely two device px, so the presenter has to hit it exactly; an unfilled
 * rectangle or ellipse reports a hit only on its outline, but only if the paint is
 * under the cursor, so a fast drag skips between events entirely; and the ink
 * layer has to stay `pointer-events: none` anyway, because the moment it accepts
 * events it eats the clicks that advance the build. So every test here is
 * arithmetic on the stroke's own points, run against the pointer position we
 * already converted into slide coordinates, and the eraser gets a generous slop
 * that the paint does not have to grow to match.
 *
 * EVERY NUMBER IS IN SLIDE SPACE (the authored 1280x720), never in screen px.
 * `SlideStage` scales the stage with a transform, so a threshold expressed in
 * screen px would mean a different physical tolerance in a window than on a
 * projector, and ink drawn in one would land wrong in the other.
 */

/** Two decimals is under a tenth of a slide px, and keeps the `d` strings short. */
function n(v: number): string {
  return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '0'
}

/**
 * Effective paint width for a kind at a nib width.
 *
 * The highlighter is not a separate nib scale, it is the pen's nib multiplied, so
 * that switching pen to highlighter keeps the presenter's chosen fine/medium/bold
 * relationship instead of resetting it to one fixed slab.
 */
export function paintWidth(kind: ShapeKind, width: number): number {
  if (kind === 'highlighter') return width * HIGHLIGHT_SCALE
  /* The felt-tip. Opaque like the pen, so the scale is the ONLY difference and it
     lives here: nothing downstream needs a marker branch for alpha, caps or halo,
     which is why adding it did not touch the renderer. */
  if (kind === 'marker') return width * MARKER_SCALE
  /* The pen paints THINNER than its nib, so that it writes rather than gestures.
     See `PEN_SCALE`, which also records what it costs on a compressed stream. */
  if (kind === 'pen') return width * PEN_SCALE
  /* Line, arrow, rectangle and ellipse paint at the nib itself. They are drawn to
     be seen across a room rather than read up close, and they are the tools whose
     job the marker would otherwise have to do. */
  return width
}

/**
 * SVG path `d` for a stroke, in slide coordinates.
 *
 * FREEHAND IS SMOOTHED WITH MIDPOINT QUADRATICS, NOT DRAWN AS RAW SEGMENTS.
 * A pointer at 60Hz across a 1280px stage lands points a few px apart, and
 * joining them with `L` prints every one of those corners: at `bold` width a
 * circle drawn round a word comes out visibly faceted, and the round joins pile up
 * into lumps at the slow parts of the gesture. Threading a quadratic through each
 * point with the segment midpoints as anchors costs one `Q` per point, needs no
 * curve-fitting pass, and never overshoots the presenter's own line the way a
 * cubic spline through the raw points does.
 *
 * A ONE-POINT STROKE MUST STILL BE VISIBLE. A tap with the pen is a full-stop the
 * presenter meant to make, and an empty `d` would silently swallow it. It is
 * emitted as a zero-length line, which the renderer's round caps turn into a dot
 * of exactly the nib's diameter.
 *
 * The shapes are one closed path each, because the renderer only ever draws what
 * this returns (plus `arrowHeadFor`); anything that needs two subpaths has to say
 * so with an `M` inside the same string.
 */
/**
 * IS THIS KIND FREEHAND? ASKED IN ONE PLACE, FOR A REASON THAT COST REAL IIME.
 *
 * `pathFor` and `outlineOf` each used to test `kind === 'pen' || kind ===
 * 'highlighter'` inline, and `pathFor` then FELL THROUGH to the ellipse case as its
 * default rather than testing for `ellipse`. When the marker pen was added as a
 * third freehand kind, both inline tests missed it, so every marker stroke was
 * drawn as an ellipse inscribed in its own bounding box: a drag across the slide
 * came out as a 40px lozenge at the press point, and nothing anywhere errored.
 *
 * Two changes make that unrepeatable. The question is asked once, here, so a new
 * freehand kind is added in one place. And the ellipse case is now an explicit test
 * with an exhaustiveness check after it, so a `ShapeKind` this file does not handle
 * is a TYPE ERROR rather than a silently mis-drawn stroke.
 *
 * It is a TYPE PREDICATE and not a plain boolean, which is what makes the
 * exhaustiveness check work: after an early return on `isFreehand`, TypeScript knows
 * the kind is one of the remaining four, and once those four are tested it knows
 * there is nothing left, so `unhandled` can demand `never`.
 */
function isFreehand(kind: ShapeKind): kind is 'pen' | 'marker' | 'highlighter' {
  return kind === 'pen' || kind === 'marker' || kind === 'highlighter'
}

/**
 * The compiler's proof that every kind is handled.
 *
 * `never` accepts nothing, so if `ShapeKind` grows a member that the branches above
 * do not cover, the call below stops compiling and names the file to fix. It also
 * returns a usable value at runtime rather than throwing, because a deck losing one
 * stroke in front of a room is better than a deck going blank.
 */
function unhandled(kind: never): string {
  if (typeof console !== 'undefined') console.warn(`annotate: unhandled kind ${String(kind)}`)
  return ''
}

export function pathFor(s: Stroke): string {
  const p = s.pts
  if (p.length < 2) return ''

  if (isFreehand(s.kind)) {
    /* A tap: zero-length line, drawn as a dot by the caller's round caps. */
    if (p.length < 4) return `M ${n(p[0])} ${n(p[1])} L ${n(p[0])} ${n(p[1])}`
    let d = `M ${n(p[0])} ${n(p[1])}`
    const last = p.length - 2
    for (let i = 2; i < last; i += 2) {
      const mx = (p[i] + p[i + 2]) / 2
      const my = (p[i + 1] + p[i + 3]) / 2
      d += ` Q ${n(p[i])} ${n(p[i + 1])} ${n(mx)} ${n(my)}`
    }
    d += ` L ${n(p[last])} ${n(p[last + 1])}`
    return d
  }

  if (p.length < 4) return ''
  const [x0, y0, x1, y1] = p

  if (s.kind === 'line' || s.kind === 'arrow') {
    return `M ${n(x0)} ${n(y0)} L ${n(x1)} ${n(y1)}`
  }

  if (s.kind === 'rect') {
    /* Corners in drag order, so no normalising: H/V close it either way round. */
    return `M ${n(x0)} ${n(y0)} L ${n(x1)} ${n(y0)} L ${n(x1)} ${n(y1)} L ${n(x0)} ${n(y1)} Z`
  }

  if (s.kind === 'ellipse') {
    /* Inscribed in the dragged box, as two half-arcs so it stays ONE path. */
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const rx = Math.abs(x1 - x0) / 2
    const ry = Math.abs(y1 - y0) / 2
    if (rx === 0 || ry === 0) return `M ${n(x0)} ${n(y0)} L ${n(x1)} ${n(y1)}`
    return (
      `M ${n(cx - rx)} ${n(cy)}` +
      ` A ${n(rx)} ${n(ry)} 0 1 1 ${n(cx + rx)} ${n(cy)}` +
      ` A ${n(rx)} ${n(ry)} 0 1 1 ${n(cx - rx)} ${n(cy)} Z`
    )
  }

  return unhandled(s.kind)
}

/**
 * The two head segments of an arrow, as an SVG path `d`; '' for other kinds.
 *
 * It is a SEPARATE path from the shaft rather than a third subpath appended to
 * `pathFor`, because the head is the one part that must not be dashed, scaled or
 * closed along with the shaft, and because the renderer needs the freedom to give
 * it its own line join.
 *
 * The head is sized off the PAINT width and floored at 14 slide px. Scaling it
 * purely off the nib gives a `fine` arrow a head three px across, which from the
 * back of a room is not an arrow at all, just a line.
 */
export function arrowHeadFor(s: Stroke): string {
  if (s.kind !== 'arrow' || s.pts.length < 4) return ''
  const [x0, y0, x1, y1] = s.pts
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  /* A click without a drag has no direction, so there is no head to draw. */
  if (len === 0) return ''

  const head = Math.max(14, paintWidth(s.kind, s.width) * 3.2)
  const a = Math.atan2(dy, dx)
  const spread = (26 * Math.PI) / 180
  const b1x = x1 - head * Math.cos(a - spread)
  const b1y = y1 - head * Math.sin(a - spread)
  const b2x = x1 - head * Math.cos(a + spread)
  const b2y = y1 - head * Math.sin(a + spread)
  return `M ${n(b1x)} ${n(b1y)} L ${n(x1)} ${n(y1)} L ${n(b2x)} ${n(b2y)}`
}

/**
 * Flat `[x, y, ...]` polyline approximating the stroke's visible outline, for hit
 * tests.
 *
 * ONE REPRESENTATION FOR EVERY KIND, so `hitsPoint` and `inRect` have a single
 * code path and cannot disagree about what a shape covers. The freehand kinds are
 * their own points (the smoothing in `pathFor` never leaves the corridor between
 * them, so testing against the raw points is accurate to well under the slop);
 * a rect is its four corners closed back to the first, which is what makes its
 * EMPTY MIDDLE correctly un-hittable; an ellipse is sampled at 32 points, which
 * at the largest circle a 1280px stage can hold leaves a chord error of about a
 * slide px, an order of magnitude inside the eraser's tolerance.
 */
export function outlineOf(s: Stroke): number[] {
  const p = s.pts
  if (isFreehand(s.kind)) return p.slice()
  if (p.length < 4) return p.slice()
  const [x0, y0, x1, y1] = p

  if (s.kind === 'line' || s.kind === 'arrow') return [x0, y0, x1, y1]
  if (s.kind === 'rect') return [x0, y0, x1, y0, x1, y1, x0, y1, x0, y0]

  if (s.kind === 'ellipse') {
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const rx = Math.abs(x1 - x0) / 2
    const ry = Math.abs(y1 - y0) / 2
    const out: number[] = []
    const steps = 32
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2
      out.push(cx + rx * Math.cos(t), cy + ry * Math.sin(t))
    }
    return out
  }

  unhandled(s.kind)
  return p.slice()
}

/**
 * Axis-aligned bounds.
 *
 * Taken from the OUTLINE and not from `pts`, so an ellipse reports the box it
 * actually paints and a two-corner drag reports a normalised rectangle whichever
 * direction it was dragged. Callers use this for cheap rejection and for placing
 * the selection affordances, so it has to agree with the hit tests exactly.
 */
export function boundsOf(s: Stroke): { x1: number; y1: number; x2: number; y2: number } {
  const o = outlineOf(s)
  if (o.length < 2) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  let x1 = o[0]
  let y1 = o[1]
  let x2 = o[0]
  let y2 = o[1]
  for (let i = 2; i < o.length; i += 2) {
    if (o[i] < x1) x1 = o[i]
    if (o[i] > x2) x2 = o[i]
    if (o[i + 1] < y1) y1 = o[i + 1]
    if (o[i + 1] > y2) y2 = o[i + 1]
  }
  return { x1, y1, x2, y2 }
}

/** Squared distance from (px, py) to the segment (ax, ay)-(bx, by). */
function distSqToSeg(
  px: number, py: number, ax: number, ay: number, bx: number, by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  /* A degenerate segment is a point, which is the 1-point pen stroke case. */
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const qx = ax + t * dx
  const qy = ay + t * dy
  return (px - qx) * (px - qx) + (py - qy) * (py - qy)
}

/**
 * True when the point is within `slop` slide px of the stroke.
 *
 * THE THRESHOLD IS SLOP PLUS HALF THE PAINT, not slop alone. Half the paint is
 * what makes the test agree with what the presenter can see: the centreline of a
 * `bold` highlighter is 22 slide px from its own visible edge, so a cursor
 * sitting squarely on the ink would otherwise fail to erase it. The slop on top is
 * the forgiveness a 3px hairline needs, and it is the caller's to widen for a
 * touch pointer.
 *
 * A single-point pen stroke stays erasable, because `distSqToSeg` treats a
 * zero-length segment as a point rather than dividing by its length.
 */
export function hitsPoint(s: Stroke, x: number, y: number, slop = 6): boolean {
  const o = outlineOf(s)
  if (o.length < 2) return false
  const r = slop + paintWidth(s.kind, s.width) / 2
  const r2 = r * r
  if (o.length === 2) return distSqToSeg(x, y, o[0], o[1], o[0], o[1]) <= r2
  for (let i = 0; i + 3 < o.length; i += 2) {
    if (distSqToSeg(x, y, o[i], o[i + 1], o[i + 2], o[i + 3]) <= r2) return true
  }
  return false
}

/**
 * True when any part of the stroke falls inside the rectangle (corners in any
 * order).
 *
 * ANY POINT INSIDE COUNTS, rather than requiring the whole stroke to be enclosed.
 * The area eraser exists for the case where the slide has been written over
 * heavily and picking off strokes one at a time is too slow, so a lasso that
 * refused to take a scribble whose tail pokes out by two px would be worse than
 * the plain eraser it is meant to beat. Partially-caught strokes still vanish
 * whole: there is no partial erase anywhere in this layer.
 *
 * The fully-enclosed case is checked first through `boundsOf`, which is a cheap
 * reject for the common "drag a box over a corner of the slide" gesture and does
 * not have to walk 33 ellipse samples to say yes.
 */
export function inRect(s: Stroke, ax: number, ay: number, bx: number, by: number): boolean {
  const rx1 = Math.min(ax, bx)
  const rx2 = Math.max(ax, bx)
  const ry1 = Math.min(ay, by)
  const ry2 = Math.max(ay, by)

  const b = boundsOf(s)
  if (b.x1 >= rx1 && b.x2 <= rx2 && b.y1 >= ry1 && b.y2 <= ry2) {
    /* Wholly enclosed. Implied by the point walk below, but free to answer here. */
    return s.pts.length >= 2
  }

  const o = outlineOf(s)
  for (let i = 0; i + 1 < o.length; i += 2) {
    if (o[i] >= rx1 && o[i] <= rx2 && o[i + 1] >= ry1 && o[i + 1] <= ry2) return true
  }
  return false
}
