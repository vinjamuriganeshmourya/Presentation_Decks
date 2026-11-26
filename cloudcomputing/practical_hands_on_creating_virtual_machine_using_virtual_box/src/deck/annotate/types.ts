import { colors } from '@/design/tokens'

/**
 * WHAT THE MARKER DRAWS, AND WHY IT IS VECTOR AND NOT A BITMAP.
 *
 * The obvious build for "let the instructor write on the slide" is a <canvas> the
 * width of the stage that you paint into. It is the wrong build here, twice over:
 *
 *   1. **The stage is scaled, not sized.** Every slide is authored at exactly
 *      1280×720 and `SlideStage` fits it to the screen with a `transform:
 *      scale()`. A bitmap authored at the on-screen size is resampled the moment
 *      the window changes or the deck goes fullscreen, so ink drawn in a window
 *      arrives blurred on the projector. Vector strokes are stored in SLIDE
 *      coordinates and are re-rendered by the browser at whatever scale the stage
 *      is currently at, so they are sharp on a 4K projector and correct after a
 *      fullscreen toggle mid-sentence.
 *   2. **Erase needs to know what it hit.** "Erase this arrow" on a bitmap means
 *      painting background over it, which is not possible on top of a slide that
 *      has its own artwork. With strokes as objects, the eraser is a hit test and
 *      undo is a snapshot.
 *
 * Everything here is plain data: no external library, nothing that reads from the
 * network. That is a hard requirement, because the deliverable is one
 * self-contained HTML file opened from `file://`.
 */

/** A drawable. Every one of these renders as SVG paint. */
export type ShapeKind =
  | 'pen'
  | 'marker'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'

/**
 * What the pointer currently does.
 *
 * `eraser` removes whole strokes it is dragged across; `area` removes everything
 * inside a rectangle the presenter drags. Both are object-level: there is no
 * partial erase, because half an arrow is never what anybody wanted.
 */
export type Tool = ShapeKind | 'eraser' | 'area'

export interface Stroke {
  id: string
  kind: ShapeKind
  color: string
  /** Nib width in SLIDE px. The highlighter multiplies this when it paints. */
  width: number
  /** Flat `[x0, y0, x1, y1, …]` in slide coordinates. Shapes keep two points. */
  pts: number[]
  /**
   * WHICH BUILD STEP THIS INK BELONGS TO.
   *
   * A stroke is drawn to explain whatever was on the slide when it was drawn, so it
   * is stored with that moment and is only painted once the build has reached it
   * again. Without this the ink is bound to the slide alone, and stepping back
   * through a build (or replaying it, which returns to step 0) leaves an arrow
   * pointing at a box that has not appeared yet: the annotation arrives before the
   * thing it annotates, which is the one arrangement guaranteed to confuse a room.
   *
   * It is also what makes replay honest. `R` restages the slide from the top, the
   * ink drawn at step 4 waits, and it comes back as the presenter reaches step 4
   * again, in the same order the class saw it the first time.
   */
  step: number
}

/** True for the tools that add a stroke rather than remove one. */
export function isShape(t: Tool): t is ShapeKind {
  return t !== 'eraser' && t !== 'area'
}

/**
 * THE SIX PENS, AND WHY WHITE IS ONE OF THEM.
 *
 * The deck has two grounds: the light content slides and the navy stage used by
 * section breakers and the welcome frame. A palette of dark inks alone would be
 * invisible on half the deck, so the last swatch is white — the only marker colour
 * that reads on navy.
 *
 * The rest are the deck's own semantic hues from `tokens.ts`, not fresh ones: a
 * red circle drawn round a term should be the same red the slides already use for
 * "this is the problem", or the annotation looks like it came from another deck.
 */
export const INKS = [
  { name: 'amber', value: colors.warning },
  { name: 'red', value: colors.danger },
  { name: 'green', value: colors.success },
  { name: 'blue', value: colors.brand },
  { name: 'ink', value: colors.ink },
  { name: 'white', value: colors.white },
] as const

/**
 * WHY AMBER IS FIRST, AND THEREFORE THE DEFAULT.
 *
 * Red was first, on the reasoning that red is what a teacher's pen is. Two things
 * are wrong with that here.
 *
 * The first is contrast. Half this deck is a navy stage (#00254B) and half is a
 * near-white content slide, and the marker does not know which one it is over. Of
 * the six, amber is the one that clears the 3:1 that WCAG asks of a graphical
 * object you need in order to follow the content on BOTH grounds. Red on navy is
 * the worst pairing in the set.
 *
 * The second is that roughly one man in twelve has a red/green colour vision
 * deficiency, and red and green are two of these six. That does not disqualify
 * either (this palette is the deck's own, and an instructor circling a term is not
 * encoding meaning in hue), but it does mean the DEFAULT should not be one of the
 * confusable pair, and it means nothing in a session should rest on red-versus-
 * green alone: cross a thing out, or label it, as well as colouring it.
 */

/**
 * Three nibs, in slide px: 4, 7, 12, and NOTHING THINNER THAN 4 EXISTS.
 *
 * These were 3, 5 and 9, chosen by eye. The floor is not an aesthetic question.
 * A session deck is projected AND screen-shared, and a screen-content video
 * encoder throws away exactly what thin ink is made of: spatially localised
 * high-frequency lines a pixel or two wide are the first thing quantised into
 * mush, so ink that looks crisp on the instructor's laptop can reach the class as
 * a grey smudge or as nothing at all. Type research says much the same about
 * stroke contrast, that a stroke below roughly a tenth of x-height stops reading.
 *
 * So `fine` is 4 rather than 3, because the thinnest option offered is the one
 * somebody will pick for underlining a word and it has to survive the stream, and
 * `bold` is 12 rather than 9, because a circle round a diagram read from the back
 * of a room is the case `bold` exists for and 9 was merely "a bit thicker".
 *
 * `medium` at 7 is the default: the mid nib is what almost every stroke in a
 * session is drawn with, so it is set at the width that survives compression
 * without being so fat that it covers the code it is pointing at.
 *
 * Named rather than numbered because the toolbar cycles them and a presenter
 * choosing "bold" is choosing a job, not a pixel count.
 */
export const NIBS = [
  { name: 'fine', value: 4 },
  { name: 'medium', value: 7 },
  { name: 'bold', value: 12 },
] as const

/**
 * THE THREE PENS ARE THREE JOBS, NOT THREE WIDTHS.
 *
 *   `pen`          thin opaque ink: writing a value into a blank, labelling a box,
 *                  ticking a line of code. It is read as SHAPE, as characters, so
 *                  it is the nib width and nothing more.
 *   `marker`       a felt-tip, the same opaque ink at 1.6x the nib (11px at the
 *                  default), which was 2.2x until the pen was thinned: 2.2 left the
 *                  three pens at 2.7, 15.4 and 32px, a ladder with a hole in the
 *                  middle where the marker was closer to the highlighter than to
 *                  the pen it is meant to be a heavier version of. This is what a
 *                  circle round a term or a bracket down the side of a code block
 *                  wants: those are read from the back of a room as a GESTURE, and
 *                  a gesture drawn at writing weight looks tentative on a projector
 *                  and is the first thing a compressed video stream throws away.
 *   `highlighter`  translucent and much wider, multiplied over the words so they
 *                  stay readable. It says WHERE, never what.
 *
 * A presenter could get the middle one by cycling the nib to `bold`, and that is
 * precisely why it is its own tool rather than a setting: the nib is a thing you
 * have to remember to put back, and both gestures live in the same sentence ("this
 * function, right here, is the one that blocks"), so moving between them has to
 * cost one key and leave no state behind.
 */
export const MARKER_SCALE = 1.6

/**
 * THE PEN WRITES THIN, AND THAT IS AN INSTRUCTION, NOT A GUESS.
 *
 * The nib scale below is set for the MARKER and for the shape tools, where a stroke
 * has to survive a projector and a compressed screen-share: the research on
 * screen-content encoders is unambiguous that a one or two px line is the first
 * thing quantised away, which is why nothing here is thinner than 4.
 *
 * A pen is a different instrument and the deck needs it to look like one. Writing a
 * value into a blank, ticking a line of code or annotating a variable name at 7px
 * does not read as handwriting, it reads as a marker, and a presenter who wants to
 * WRITE rather than to GESTURE has no tool. So the pen paints at 0.38 of the nib:
 * 1.5, 2.7 and 4.6 px across the three nibs.
 *
 * The scale is on the PEN rather than on the nib scale, so that the default nib can
 * stay `medium`. The nib is one setting shared by every tool, so dropping it to
 * `fine` to thin the pen would also have thinned the marker (to 8.8px) and the
 * highlighter (to 18px, narrower than the deck's own 22px body line), which is
 * three tools made worse to fix one.
 *
 * The honest trade-off, recorded because it will come up: at the `fine` nib the pen
 * is below the width that a heavily compressed stream reproduces reliably, so it
 * can soften on a bad connection in a way the marker does not. Three things make
 * that acceptable rather than a bug. The halo in `AnnotationLayer` gives even a
 * hairline a contrasting edge, which is most of what compression destroys. The nib
 * control is one key away, so `bold` (4.6px) is available the moment a room reports
 * it cannot see. And the marker pen exists precisely for the gestures that must
 * carry to the back of a room, so the thin pen never has to do that job.
 */
export const PEN_SCALE = 0.38

/**
 * How much wider the highlighter is than the pen at the same nib.
 *
 * 4.6, which puts the default nib at 32 slide px: a little taller than the deck's
 * 22px body line, so one sweep covers a line of text or a line of code with a
 * margin, and a presenter never has to trace a wobbly band along a sentence.
 */
export const HIGHLIGHT_SCALE = 4.6
/**
 * Highlighter alpha.
 *
 * 0.35, up from 0.3. It has to clear two opposing tests: the words under it stay
 * readable (highlighting a line of code in order to hide it is the one way this
 * tool can actively harm a lesson), and the band still reads as a band after video
 * compression, which flattens low-contrast washes. The `multiply` blend in
 * `AnnotationLayer` is what keeps a second sweep over the same words from
 * compounding towards opaque.
 */
export const HIGHLIGHT_ALPHA = 0.35
