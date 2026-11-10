import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { colors } from '@/design/tokens'
import { INKS, NIBS } from './types'
import type { ShapeKind, Tool } from './types'
import type { Annotate } from './useAnnotate'

/**
 * THE MARKER PALETTE, AS A RIGHT-EDGE RAIL THAT OPENS ON HOVER.
 *
 * Mounted by `Deck.tsx` only while marker mode is on, as a sibling of
 * `DeckControls` in the UNSCALED outer layer. Outer layer matters: a palette
 * inside `SlideStage` would be scaled with the slide, so its buttons would be 22px
 * on a laptop and 60px on a projector, and the one thing a presenter needs from a
 * tool palette is that the button is where it was last time and the size their hand
 * already knows.
 *
 * WHY IT IS NOT A WIDE BAR ANY MORE. It was a horizontal pill at bottom centre,
 * sixteen squares across, roughly 670px wide. Two problems, and the second is the
 * one that matters. It sat directly under the slide's own last line, so on any
 * slide whose content runs to the bottom the palette was on top of the thing being
 * annotated. And it was permanently on, which means for the whole of a session the
 * room was looking at the presenter's tools. A rail at the right edge is out of the
 * reading path (which finishes bottom-right at the mark, not on the right margin
 * mid-height) and it is only as large as the moment needs.
 *
 * SO THERE ARE TWO STATES, AND THE COLLAPSED ONE STATES THE MODE.
 *
 * Collapsed is one 32px square: the glyph of the tool that is CURRENTLY ARMED, with
 * a dot in the current ink colour at the current nib size. Not a generic "marker"
 * icon. The classic live-presentation failure with any modal drawing tool is a mode
 * error: the presenter last used area-erase, comes back to the slide two minutes
 * later, drags to circle a term and instead deletes the four strokes already there.
 * A resting state that says "marker" prevents none of that. A resting state that
 * shows the armed tool, its colour and its nib prevents all three variants of it,
 * costs no extra chrome, and is readable at a glance from a laptop.
 *
 * Expanded is the full palette as a compact vertical panel anchored to the same
 * right edge, growing up and to the left out of the collapsed button so it reads as
 * having come from there rather than as a second thing that appeared nearby.
 *
 * THE REVEAL IS THE SAME REVEAL `DeckControls` USES, for the same reasons, and its
 * three safety details are all needed again:
 *
 *   1. **Keyboard focus opens it**, through `focus-within`. A control only a mouse
 *      can summon is not reachable by Tab, and this panel is the only pointer route
 *      to the swatches.
 *   2. **A device with no fine pointer keeps it open.** No hover means no way to
 *      ask for it, and a deck opened on a tablet would have a palette that could
 *      never be opened at all. Same `(hover: hover) and (pointer: fine)` gate.
 *   3. **The transition is CSS, on opacity and transform only.** It is interrupted
 *      constantly as the pointer crosses the edge of the rail, and a transition
 *      retargets from wherever it currently is while a keyframe or a JS tween
 *      restarts from zero. `transition-[opacity,transform]` and never plain
 *      `transition`, so no layout property can be animated by accident.
 *
 * A CLICK ON THE COLLAPSED BUTTON PINS IT OPEN. Hover alone would make the palette
 * unusable with a trackpad on a projector, where the pointer wanders, and it would
 * leave the button doing nothing at all when pressed, which no button should.
 *
 * IT IS THE SAME OBJECT AS `DeckControls`, DELIBERATELY. Same pill, same
 * background, same ring, same blur, same shadow, same hairline dividers, same 32px
 * squares, same 17px glyphs at the same stroke weight. Two floating controls in one
 * deck that merely resemble each other read as two apps stitched together.
 *
 * The two hard rules from `DeckControls` are hard here too, and this bar has more
 * ways to break them because it has SELECTION as well as hover:
 *
 *   1. **Nothing changes size, ever.** Selection is a background tint plus ink
 *      colour, never a ring on the button and never a scale. A ring on a button in
 *      a grid shifts every button after it, so the tool the presenter was aiming
 *      for moves out from under the pointer as they select its neighbour. (The ink
 *      swatches DO carry a ring, on an inner span of fixed geometry, where a
 *      box-shadow costs no layout.)
 *   2. **Changing text lives in a fixed box.** Only the nib indicator changes, and
 *      it changes SIZE, so it sits in a fixed 16px box or the button beside it
 *      would step sideways every time the nib is cycled.
 *
 * THE TAILWIND TRAP, RESTATED BECAUSE IT BIT THIS FILE TOO. `text-body`,
 * `text-body-sm`, `text-code` and `text-kicker` are FONT SIZES in
 * `tailwind.config.ts`, not colours: `body` is a key in both `colors` and
 * `fontSize`, and the fontSize utility wins. For the grey, `style={{ color:
 * colors.body }}`. `text-muted` and `text-ink` are safe, because neither has a
 * `fontSize` entry.
 *
 * Glyphs are hand-written inline SVG and not lucide, because every glyph in
 * `DeckControls` is hand-written, on the same 24 grid, at the same weight. Mixing
 * an icon set into one of two matching controls is visible immediately in the
 * corners and the terminals of the strokes.
 *
 * EVERY LABEL NAMES ITS KEY. The palette is the discoverable surface and the
 * keyboard is what actually gets used mid-sentence, so the button is where a
 * presenter learns the shortcut. Bindings live in `useKeyboardNav.ts`; the labels
 * here must be kept in step with it.
 */

/**
 * WHERE THE RAIL IS ALLOWED TO BE, IN SLIDE PX, AND WHY EACH NUMBER IS THAT NUMBER.
 *
 * Three regions of the stage are already spoken for, and this component renders in
 * the unscaled outer layer, so at the harness viewport 1 px here is 1 slide px and
 * these are measurements rather than guesses:
 *
 *   - **The instructor video, x 913..1280, y 0..220.** Reserved, and `video-safe.mjs`
 *     fails the deck if anything lands in it. The rail shares the right edge with
 *     it, so this is the constraint that sets the ceiling: the expanded panel's TOP
 *     must stay below y=240, which is the reserved rect plus a 20px margin.
 *   - **The NxtWave mark, x 1172..1248, y 660..706.** Directly below the rail.
 *   - **The control bar, x 20..407, y 664..704.** Far left, but the same band.
 *
 * So the rail STARTS 108px off the bottom of the stage, which puts the collapsed
 * tab's bottom edge at y=612, comfortably the 96px clear of the bottom furniture
 * that was asked for, and leaves 372px of headroom above it for a panel that needs
 * 338. Anchoring by the BOTTOM and growing upward is what makes that safe: the
 * panel's height can change (a group gains a button) and it eats into the headroom
 * rather than sliding down over the mark.
 *
 * AND 108 IS ONLY A STARTING POINT NOW, BECAUSE THE RAIL IS DRAGGABLE. At a fixed
 * height it will sooner or later sit over the one thing on the slide the instructor
 * wants to point at, and no single height is right for every layout in a deck. See
 * `BOTTOM_KEEPOUT` for the limits, which of the two elements each one applies to,
 * and why they are measured rather than assumed.
 */
const RAIL_BOTTOM_OFFSET = 108

/**
 * THE DRAG LIMITS: THE TAB IS WHAT THE WALL CONSTRAINS, AND THE PANEL FOLLOWS IT.
 *
 * An earlier version clamped the TAB against the PANEL's height, reasoning that the
 * panel grows upward out of the tab so the tab may only rise as far as the panel's
 * top edge allows. That is arithmetically true, and it made the drag useless: driven
 * in a real browser at 1280x720 the tab went from 576 to 550 and stopped, about 74px
 * of travel, for a feature whose entire point is that the rail can be moved off
 * whatever the instructor wants to point at.
 *
 * So the two elements are clamped separately, against different things.
 *
 *   - **THE TAB IS WHAT THE WALL CONSTRAINS.** It is 36px tall and sits at
 *     x 1244..1280, which is inside the reserved video rect's own x range
 *     (913..1280), so the only rule on it is that its own TOP edge stays below the
 *     band:
 *
 *       tabMin = BOTTOM_KEEPOUT
 *       tabMax = H - H * VIDEO_BAND_FRACTION - VIDEO_MARGIN - TAB_H
 *
 *     At 1280x720 that is 60 to 444, which is most of the wall, and the 108 default
 *     sits low inside it.
 *
 *   - **THE PANEL FOLLOWS THE TAB AND PARKS.** It rides `PANEL_GAP` above the tab
 *     while there is room for it, and stops against the band when there is not:
 *
 *       panelCeil   = H - H * VIDEO_BAND_FRACTION - VIDEO_MARGIN - panelHeight
 *       panelBottom = clamp(tabOffset + PANEL_GAP, BOTTOM_KEEPOUT, panelCeil)
 *
 *     At 1280x720 with the 338px panel that ceiling is 142, so the panel tracks the
 *     tab from offset 60 up to about 106 and is parked with its top edge on y=240
 *     for the rest of the tab's travel to 444. It is rendered at
 *     `panelBottom - tabOffset`, because the wrapper is anchored at
 *     `bottom: tabOffset`: near the top of the travel that number is negative and
 *     the panel is simply a long way BELOW the wrapper's own bottom edge.
 *
 * WHY THE PANEL DOES NOT FLIP TO GROWING DOWNWARD INSTEAD. A flip needs a height at
 * which it flips, and around that height neither direction fits: a dead band where
 * there is too little room above to grow up and too little below to grow down, so
 * the palette overlaps either the video rect or the bottom furniture, and it does it
 * while the presenter is mid-drag with the thing jumping under their finger. Parking
 * has no such band, and it leaves the panel in the one place it is always legal.
 *
 * The floor is 60 and not 56 because the tab is 36px wide against the wall, so it
 * overlaps the NxtWave mark's x range (1172..1248) by a few px, and the mark's TOP
 * edge is y=660: 720 - 660 = 60 is the offset at which the tab's bottom edge is
 * exactly level with the top of the mark. 56 put a 4px corner of the tab over it.
 * The control bar (y 664..704) is further away and is not the binding constraint,
 * because it lives at x 20..407 and never comes near this wall.
 *
 * BOTH FORMULAS ARE MEASURED, NEVER DERIVED FROM A HARDCODED 720. This component
 * renders in the UNSCALED outer layer: at the harness viewport its container is
 * 720px tall and 1px is 1 slide px, but in a browser window of any other shape it is
 * not, and a limit hardcoded to 720 would let the palette into the video band on a
 * short window while refusing legal positions on a tall one. `H` is read from the
 * wrapper's offset parent and `panelHeight` from the panel ref, on every drag move
 * and on every window resize, because a deck goes fullscreen mid-session.
 *
 * WHEN THE TWO LIMITS CROSS, THE FLOOR WINS. A window short enough for that is a
 * window where something has to overlap, and overlapping the reserved video rect is
 * the one that fails `video-safe.mjs` and ships a broken deck, while a rail a little
 * close to the mark is merely untidy.
 */
const BOTTOM_KEEPOUT = 60
/** The reserved video band, as a fraction of stage height: y 0..220 of 720. */
const VIDEO_BAND_FRACTION = 220 / 720
const VIDEO_MARGIN = 20
/** `h-9` on the tab: the height the wall has to accommodate as the tab travels. */
const TAB_H = 36
/** How far the panel's bottom edge sits above the tab's while it is tracking it. */
const PANEL_GAP = 36
/** Used only before the panel has been laid out and measured once. */
const PANEL_HEIGHT_FALLBACK = 338
/**
 * Last resort only, for the render before the wrapper has an offset parent to
 * measure. Every real limit comes from a measurement; this exists so the first frame
 * has a number instead of a NaN, and it is the harness viewport's height because
 * that is the only size the deck is ever authored against.
 */
const STAGE_H_FALLBACK = 720
/**
 * How far a press must travel before it is a drag and not a click.
 *
 * The tab has to do both, because it is the only handle the rail has: a press that
 * stays put pins the panel open, a press that travels moves the rail. 4px is under
 * the tremor of a hand on a trackpad on a lectern and well under any deliberate
 * movement, and without it every reposition would also toggle the pin, which is the
 * bug where the panel flickers shut the moment the presenter lets go.
 */
const DRAG_THRESHOLD = 4

/** One hairline between groups. Horizontal here, because the rail is a column. */
function Divide() {
  return <span aria-hidden className="my-0.5 h-px w-5 shrink-0 bg-muted/25" />
}

/**
 * ONE GROUP OF TOOLS AS ITS OWN INSET SURFACE, WHICH A HAIRLINE COULD NOT DO.
 *
 * The seven drawing tools used to be one 3-wide grid, and that grid mixed two
 * different kinds of thing: three PEN TYPES, which are one gesture at three weights
 * and are what a presenter swaps between constantly mid-sentence, and four ELEMENTS,
 * which are drawn objects placed once. A presenter reaching for the marker was
 * reading past the rectangle tool to find it.
 *
 * A hairline between them was tried first and is not enough at this size. A 1px rule
 * across 20px of a 112px rail, between two blocks of identical 32px squares, is read
 * as decoration rather than as a boundary; what separates blocks of controls at a
 * glance is a change of GROUND. So each group sits on its own faint tint with a small
 * radius, the way a grouped segmented control does, and the hairlines are kept only
 * where there is no tint change to do the job (before the settings row, and before
 * the close button, which is not a tool at all).
 *
 * THE TINT IS NOT A NEW COLOUR. `bg-muted/5` is the palette the rail already uses
 * for hover and for the dividers, at the lightest step it has: enough to read as a
 * recessed panel against `bg-white/85` and not enough to become another box in a
 * deck whose whole chrome is one surface.
 *
 * NOTHING HERE MAY CHANGE SIZE. The group is a static frame: no hover, no selected
 * state, no ring. Selection lives on the buttons inside it as a background tint, for
 * the reason at the top of this file (a ring on a button in a grid moves every button
 * after it, so the tool being aimed at slides out from under the pointer).
 */
function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full shrink-0 justify-center rounded-[12px] bg-muted/5 p-0.5">
      {children}
    </div>
  )
}

function Btn({
  label,
  onClick,
  disabled,
  selected = false,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  selected?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      /* Selected and hover differ only in colour and background tint. Nothing in
         either branch touches padding, width, border or transform. */
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-25 ${
        selected ? 'bg-brand/10' : 'text-muted hover:bg-muted/10 hover:text-ink'
      }`}
      style={selected ? { color: colors.brand } : undefined}
    >
      {children}
    </button>
  )
}

/** The shared glyph frame: same grid, same weight, same caps as `DeckControls`. */
const g = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const PEN_GLYPH = <path d="M4 20.5l4.2-1 10.4-10.4a1.9 1.9 0 0 0-2.7-2.7L5.5 16.8z" />

/**
 * THE MARKER PEN, DRAWN AS THE SAME PEN WITH A CHISEL TIP.
 *
 * The two freehand tools are the pair a presenter switches between most often, so
 * the glyphs have to be tellable apart at 17px on a projector while still reading
 * as the same family. Same barrel and same angle as the pen, and the only
 * difference is the business end: the pen tapers to a point, the marker ends in a
 * flat blunt tip and carries a heavier barrel. Anything cleverer (a different
 * angle, a different object) breaks the family and makes the pair look like two
 * unrelated tools that happen to sit next to each other.
 */
const MARKER_GLYPH = (
  <>
    <path d="M5.2 19.8l3.6-.8 9.4-9.4-2.8-2.8L6 16.2z" />
    <path d="M7.6 14.2l2.8 2.8" />
  </>
)

const ERASER_GLYPH = (
  <>
    <path d="M7 20h11" />
    <path d="M9.5 20l-4.2-4.2a1.4 1.4 0 0 1 0-2L11.9 7.2a1.4 1.4 0 0 1 2 0l4.2 4.2a1.4 1.4 0 0 1 0 2L13.5 20z" />
  </>
)

const AREA_GLYPH = (
  <>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" strokeDasharray="3.5 3" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </>
)

/**
 * THE TWO INK SCOPES, AS A PAIR OF GLYPHS AND NOT AS A LABEL.
 *
 * `slide` is one sheet of ink per slide: it belongs to the slide it was drawn on,
 * and it is put away and brought back as the deck moves. `deck` is one single sheet
 * for the whole deck that stays put while the slides move underneath it, which is
 * what a running scratch area or a list of terms the class asked about needs.
 *
 * A TOGGLE THAT ONLY SAYS "SCOPE" IS WORSE THAN NO TOGGLE. The two states produce
 * completely different behaviour at the very next slide change, and the failure is
 * silent in the worst way: a presenter who thinks they are in deck scope changes
 * slide, their ink is put away exactly as designed, and what they conclude is that
 * the marker lost their work. So the glyph states WHICH scope is live rather than
 * that a toggle exists. A stack of sheets means a sheet per slide; one ruled sheet
 * means one sheet for everything. The label and the tint say the same thing again,
 * for anyone who reads either.
 */
const SCOPE_SLIDE_GLYPH = (
  <>
    <path d="M8.5 6.6V4.6h11.4v11.6" />
    <rect x="4" y="7.4" width="12.6" height="12.6" rx="1.6" />
  </>
)

const SCOPE_DECK_GLYPH = (
  <>
    <rect x="5.5" y="4" width="13" height="16" rx="1.6" />
    <path d="M9 9.5h6M9 13.5h6" />
  </>
)

/**
 * The seven shape tools, in the order the number keys pick them.
 *
 * ORDER IS A CONTRACT with `useKeyboardNav.ts`: 1 to 7, reading order in the grid,
 * no gaps, and `TOOL_KEYS` there must list the same kinds in the same order.
 * Reordering this array silently rebinds the number keys.
 *
 * The three FREEHAND tools come first and in weight order (pen, marker pen,
 * highlighter), because that is the order a presenter reaches for them: write a
 * value, circle the term, sweep the line. Then the two straight tools, then the two
 * enclosing ones.
 *
 * IT IS ONE ARRAY EVEN THOUGH IT RENDERS AS TWO GROUPS. The pens and the elements
 * are drawn from `PEN_TOOLS` and `ELEMENT_TOOLS` below, which are SLICES of this
 * array and not a second hand-written list, precisely so the contract above cannot
 * drift: a second list is a second place to reorder, and the failure it produces is
 * silent (the palette looks right and key 4 arms the wrong tool).
 */
const TOOLS: { kind: ShapeKind; name: string; key: string; glyph: React.ReactNode }[] = [
  { kind: 'pen', name: 'Pen', key: '1', glyph: PEN_GLYPH },
  { kind: 'marker', name: 'Marker pen', key: '2', glyph: MARKER_GLYPH },
  {
    kind: 'highlighter',
    name: 'Highlighter',
    key: '3',
    glyph: (
      <>
        <path d="M4.5 20.5h7" />
        <path d="M9 17.5l7.6-7.6 2.6 2.6-7.6 7.6H9z" />
        <path d="M16.6 9.9l1.9-1.9 2.6 2.6-1.9 1.9" />
      </>
    ),
  },
  { kind: 'line', name: 'Line', key: '4', glyph: <path d="M5 19L19 5" /> },
  {
    kind: 'arrow',
    name: 'Arrow',
    key: '5',
    glyph: (
      <>
        <path d="M5 19L19 5" />
        <path d="M12.5 5H19v6.5" />
      </>
    ),
  },
  {
    kind: 'rect',
    name: 'Rectangle',
    key: '6',
    glyph: <rect x="4" y="6.5" width="16" height="11" rx="1.5" />,
  },
  {
    kind: 'ellipse',
    name: 'Ellipse',
    key: '7',
    glyph: <ellipse cx="12" cy="12" rx="8.5" ry="6.5" />,
  },
]

/**
 * THE TWO GROUPS, AS SLICES OF THE ONE ORDERED ARRAY.
 *
 * `TOOLS` stays in the order `TOOL_KEYS` in `useKeyboardNav.ts` reads, keys '1'..'7'
 * in order, and the split point is a rendering decision layered on top of it rather
 * than a reordering: the first three are the freehand weights, the rest are the drawn
 * objects. Change the boundary here and the palette regroups; change `TOOLS` and the
 * number keys change with it, which is exactly the coupling that is wanted.
 *
 * The elements are 2x2 and not 4 across because the panel is 112px wide with 104px of
 * inner width, and a group's own 2px padding leaves 100px, which is 3 x 32 plus two
 * 2px gaps exactly. Three across fits the wall, four does not.
 */
const PEN_TOOLS = TOOLS.slice(0, 3)
const ELEMENT_TOOLS = TOOLS.slice(3)

/** What the collapsed button draws and says for whatever is armed. */
function armed(tool: Tool): { name: string; glyph: React.ReactNode } {
  if (tool === 'eraser') return { name: 'Eraser', glyph: ERASER_GLYPH }
  if (tool === 'area') return { name: 'Area erase', glyph: AREA_GLYPH }
  const t = TOOLS.find((x) => x.kind === tool)
  return { name: t?.name ?? 'Pen', glyph: t?.glyph ?? PEN_GLYPH }
}

/**
 * The nib dot's diameter in screen px, from the nib's slide-px width.
 *
 * Not the nib value itself. The nibs are 4, 7 and 12 slide px (they were 3, 5 and
 * 9, and the floor moved up because thin ink is what a screen-share encoder throws
 * away first), and a 12px dot inside a 32px button reads as a blob rather than as a
 * nib. This compresses the range to roughly 4, 6 and 9.5 px, which keeps the ORDER
 * honest and legible at a glance, which is all the indicator has to do, while
 * leaving clear air inside the 16px box it sits in.
 */
function dotSize(width: number): number {
  return 4 + (width - NIBS[0].value) * 0.7
}

/**
 * Whether this machine has a pointer that can hover.
 *
 * FALSE MEANS THE PANEL STAYS OPEN. On a tablet there is no hover, so there would
 * be no way to ask for the palette and the deck would ship with a marker mode whose
 * tools were unreachable. Same gate `DeckControls` uses for its own reveal and
 * `index.css` uses for the hover lift.
 */
function useCanHover(): boolean {
  const [can, setCan] = useState(true)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    setCan(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])
  return can
}

export function AnnotationToolbar({ ann }: { ann: Annotate }) {
  const ink = INKS.find((i) => i.value === ann.color)
  const nib = NIBS.find((n) => n.value === ann.width)
  const canHover = useCanHover()
  const [hovering, setHovering] = useState(false)
  /** Pinned by a click, so a trackpad user is not holding the pointer still. */
  const [pinned, setPinned] = useState(false)
  const cur = armed(ann.tool)

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  /**
   * Where the rail sits, as a distance from the bottom of its container.
   *
   * IN STATE AND NOT PERSISTED. `localStorage` is off limits in this repo: the
   * deliverable is a double-clicked HTML file, so it runs from a `file://` origin
   * where that API throws outright in some browsers, and every existing use of it in
   * the player is wrapped for exactly that reason. A remembered rail position is not
   * worth a load-time failure in front of a room, and the drag is cheap enough to
   * repeat that nobody will miss it.
   */
  const [offset, setOffset] = useState(RAIL_BOTTOM_OFFSET)
  const [dragging, setDragging] = useState(false)

  /**
   * Where the PANEL's bottom edge sits, in the same container coordinates.
   *
   * A SECOND NUMBER AND NOT A CSS OFFSET FROM THE TAB, because the two do not move
   * together for the whole of the tab's travel: the panel tracks the tab while there
   * is room above it and then parks against the video band while the tab carries on.
   * Expressed in container coordinates rather than as a delta so the parked case is
   * the same arithmetic as the tracking case, with one `clamp` deciding which it is.
   */
  const [panelBottom, setPanelBottom] = useState(RAIL_BOTTOM_OFFSET + PANEL_GAP)
  /**
   * Bumped on resize purely to re-run the effect that recomputes `panelBottom`.
   *
   * The panel's position depends on two MEASUREMENTS as well as on `offset`, and a
   * resize changes the measurements without changing `offset` at all (a taller window
   * makes the same tab position legal for a panel that was parked). Without this the
   * panel would keep the position it computed against the old window height, which is
   * how it gets into the reserved video band on a window that was made shorter.
   */
  const [resizeTick, setResizeTick] = useState(0)

  /**
   * The live drag. A ref, because every `pointermove` reads it and it must not be
   * one render behind the `pointerdown` that started it, and because `moved` has to
   * be readable from the click handler that fires after the release.
   */
  const dragRef = useRef<{ startY: number; startOffset: number; moved: boolean } | null>(null)
  /** Whether the release that just happened was the end of a drag. */
  const draggedRef = useRef(false)
  /** The panel's open state frozen for the duration of a drag. See `open` below. */
  const openAtDragRef = useRef(false)

  /**
   * The two live measurements every limit is derived from.
   *
   * READ ON EVERY MOVE, NOT ONCE ON MOUNT. The window can be resized and the deck can
   * go fullscreen mid-session, and a limit computed against the old height is a limit
   * that lets the palette into the reserved video band. `offsetParent` rather than
   * `parentElement` because the wrapper is `absolute`, so its offset parent is the
   * box its `bottom` is actually resolved against, which is the only height that
   * makes the arithmetic mean anything.
   */
  const measure = (): { H: number; panelH: number } => {
    const parent = (wrapRef.current?.offsetParent as HTMLElement | null) ?? null
    return {
      H: parent?.clientHeight ?? wrapRef.current?.parentElement?.clientHeight ?? STAGE_H_FALLBACK,
      panelH: panelRef.current?.offsetHeight ?? PANEL_HEIGHT_FALLBACK,
    }
  }

  /**
   * The TAB's own limits. Formula and its 1280x720 values are at `BOTTOM_KEEPOUT`.
   *
   * NOTE WHAT IS ABSENT: the panel's height. The tab is the thing the wall
   * constrains, and folding the panel into this clamp is exactly the bug that left the
   * rail with 74px of travel.
   */
  const clampTab = (want: number): number => {
    const { H } = measure()
    const max = H - H * VIDEO_BAND_FRACTION - VIDEO_MARGIN - TAB_H
    /* THE FLOOR WINS WHEN THE LIMITS CROSS. A window short enough for that is a
       window where something has to overlap, and overlapping the reserved video
       rect is the one that fails `video-safe.mjs` and ships a broken deck. */
    if (max <= BOTTOM_KEEPOUT) return BOTTOM_KEEPOUT
    return Math.min(max, Math.max(BOTTOM_KEEPOUT, want))
  }

  /**
   * Where the panel goes for a given tab position: follow, then park.
   *
   * One `clamp` does both jobs. `tabOffset + PANEL_GAP` is the following behaviour,
   * and the ceiling is the parking behaviour, so there is no branch and no threshold
   * height at which the palette changes how it behaves under the presenter's finger.
   */
  const panelBottomFor = (tabOffset: number): number => {
    const { H, panelH } = measure()
    const ceil = H - H * VIDEO_BAND_FRACTION - VIDEO_MARGIN - panelH
    if (ceil <= BOTTOM_KEEPOUT) return BOTTOM_KEEPOUT
    return Math.min(ceil, Math.max(BOTTOM_KEEPOUT, tabOffset + PANEL_GAP))
  }

  /**
   * Keep the panel with the tab, BEFORE the browser paints.
   *
   * `useLayoutEffect` and not `useEffect`: a drag calls `setOffset` on every
   * `pointermove`, and if the panel's position landed one paint later it would visibly
   * trail the tab it is supposed to be attached to, which is the same lag a CSS
   * transition on `bottom` would have caused and is the reason there is not one.
   */
  useLayoutEffect(() => {
    setPanelBottom(panelBottomFor(offset))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, resizeTick])

  /**
   * A resize re-clamps both, because both limits are fractions of the window.
   *
   * Without this a rail parked legally in a tall window is left sitting in the video
   * band the moment the window is made shorter or the deck leaves fullscreen, and
   * nothing would move it back until the presenter happened to drag it again.
   */
  useEffect(() => {
    const onResize = () => {
      setOffset((o) => clampTab(o))
      setResizeTick((t) => t + 1)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTabDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startOffset: offset, moved: false }
    draggedRef.current = false
    openAtDragRef.current = pinned || hovering || !canHover
  }

  const onTabMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    const dy = e.clientY - d.startY
    if (!d.moved) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return
      d.moved = true
      setDragging(true)
    }
    /* Up the screen is a LARGER bottom offset, hence the subtraction. */
    setOffset(clampTab(d.startOffset - dy))
  }

  /**
   * END OF DRAG, AND THE HOVER STATE HAS TO BE RE-ASKED RATHER THAN ASSUMED.
   *
   * A drag can move the rail OUT FROM UNDER THE POINTER: the tab stops at its clamp
   * while the finger keeps going, so at release the pointer is often nowhere near
   * the rail. While the pointer was captured the wrapper's `pointerleave` was
   * suppressed, and once capture is released the browser does not go back and fire
   * the boundary event that would have happened, so `hovering` was still true from
   * before the drag started. The result was a panel that stayed open for the rest of
   * the session unless the presenter happened to enter and leave the rail again,
   * which is a 112px panel parked over the slide with no obvious way to dismiss it.
   *
   * So the release measures where the pointer actually is against the wrapper's own
   * rectangle and sets `hovering` from that. It is the same question `pointerenter`
   * and `pointerleave` answer, asked once at the only moment their answer can have
   * been missed.
   */
  const onTabUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggedRef.current = dragRef.current?.moved ?? false
    dragRef.current = null
    setDragging(false)
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) {
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      setHovering(inside)
    }
  }

  /**
   * Freeze the panel's open state while the rail is being dragged.
   *
   * The pointer is captured by the tab, so the wrapper's `pointerenter` and
   * `pointerleave` should not fire during a drag, but leaning on that is leaning on
   * the exact corner of the pointer-capture spec that browsers have historically
   * disagreed about. Freezing it costs one ref and removes the whole failure mode:
   * a panel that opens and shuts under the pointer while the rail is moving is
   * unusable, and worse, its height feeds the clamp.
   */
  const open = dragging ? openAtDragRef.current : pinned || hovering || !canHover

  return (
    <div
      data-marker-toolbar
      /*
        `group` so KEYBOARD focus inside the rail can open the panel in CSS. The
        panel must not be `display: none` when closed, or nothing inside it could
        ever take focus in the first place, which is the bug that makes a hover-only
        menu unreachable by Tab. It is faded and non-interactive instead.

        `group-has-[:focus-visible]` AND NOT `group-focus-within`, and the difference
        is a bug that survived until a harness caught it. `:focus-within` is true for
        a MOUSE click as well as for Tab, because clicking a button focuses it. So
        pressing the tab (or dragging it, which starts with a press) left the tab
        focused, the panel forced open by CSS, and moving the pointer away did
        nothing: React's own state said closed while the computed opacity stayed 1.
        A 112px panel then sat over the slide with no visible way to dismiss it.
        `:focus-visible` is the same reveal for the keyboard and silent for the
        pointer, which is exactly the distinction this needs.
      */
      /*
        FLUSH TO THE RIGHT WALL, right-0 AND NOT right-5.

        The rail is docked furniture, not a floating chip: it belongs to the edge of
        the screen the way a tool rail belongs to the edge of a drawing app, and the
        20px inset it used to have made it read as a card that had drifted there. It
        also buys 20px back for the panel, which is the scarcest dimension here
        because the top-right of the stage is reserved for the instructor video.

        A docked rail is only rounded on the side that is not touching the wall, so
        both the button and the panel carry `rounded-l-*` and a square right edge:
        rounding the corners that are glued to the screen edge is what makes a
        docked element look accidentally offset by a pixel or two.
      */
      ref={wrapRef}
      className="group absolute right-0 z-40 flex flex-col items-end"
      /* NO TRANSITION ON `bottom`, EVER. The panel animates `opacity` and
         `transform` and nothing else, and the rail's position is set from a pointer
         that is already moving: a transition on it would make the rail lag behind
         the finger by its own duration, which reads as the drag being broken. */
      style={{ bottom: offset }}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      {/*
        THE PANEL IS ABSOLUTELY POSITIONED, ANCHORED TO THE BUTTON'S TOP EDGE.

        In flow it would be part of the rail's height, so opening it would move the
        collapsed button 300px down the screen and out from under the pointer that
        was hovering it, which then closes the panel, which moves the button back.
        That oscillation is not a hypothetical: it is what a flow layout does here.
        Out of flow, the button never moves and the panel grows into the headroom
        above it.

        ITS `bottom` IS COMPUTED, NOT `bottom-9`. It used to be a fixed 36px above
        the wrapper's bottom edge, which is right only while the panel has room to
        follow the tab. See `panelBottomFor`: the value here is the panel's own
        clamped position converted back into wrapper-relative coordinates, so it
        goes NEGATIVE once the panel has parked and the tab has kept climbing.
      */}
      <div
        ref={panelRef}
        /* Addressed by `marker-check.mjs`. The panel is no longer the only div in
           the rail that contains most of the buttons (each cluster is one too), so a
           harness cannot identify it by counting descendants: it needs to be told
           which element is the panel. */
        data-marker-panel
        className={`absolute right-0 flex w-28 flex-col items-center gap-0.5 rounded-l-[18px] rounded-r-none bg-white/85 px-1 py-1 ring-1 ring-muted/20 backdrop-blur transition-[opacity,transform] duration-200 ease-out group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:translate-x-0 group-has-[:focus-visible]:opacity-100 ${
          open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0'
        }`}
        /* One surface, one shadow. Same value as `DeckControls`, so the rail and the
           control bar sit at the same apparent height above the slide.

           NO TRANSITION ON `bottom` HERE EITHER, for the same reason as on the
           wrapper: this number is recomputed from a moving pointer, and a transition
           would make the panel swim after the tab by its own duration. */
        style={{
          boxShadow: '0 6px 24px -12px rgba(0, 37, 75, 0.28)',
          bottom: panelBottom - offset,
        }}
      >
        {/* THE THREE PEN TYPES, one row, in weight order: write, gesture, sweep.
            Their own surface because they are one gesture at three weights and are
            the swap a presenter makes mid-sentence, so they must be findable without
            reading past a rectangle tool. */}
        <Group>
          <div className="flex gap-0.5">
            {PEN_TOOLS.map((t) => (
              <Btn
                key={t.kind}
                label={`${t.name} (${t.key})`}
                onClick={() => ann.setTool(t.kind)}
                selected={ann.tool === t.kind}
              >
                <svg {...g}>{t.glyph}</svg>
              </Btn>
            ))}
          </div>
        </Group>

        {/* THE FOUR ELEMENTS, 2x2. Drawn objects rather than handwriting: placed
            once, deliberately, and read as a diagram afterwards. 2x2 and not one row
            of four because four 32px squares do not fit the 100px of usable width. */}
        <Group>
          <div className="grid grid-cols-2 gap-0.5">
            {ELEMENT_TOOLS.map((t) => (
              <Btn
                key={t.kind}
                label={`${t.name} (${t.key})`}
                onClick={() => ann.setTool(t.kind)}
                selected={ann.tool === t.kind}
              >
                <svg {...g}>{t.glyph}</svg>
              </Btn>
            ))}
          </div>
        </Group>

        {/* THE THREE WAYS TO REMOVE INK, one row, and the DESTRUCTIVE ONE IS LAST.
            Not because it is unimportant but because the pointer travelling to the
            eraser must not pass over it. Disabled with no ink, so pressing it can
            never be a no-op that looks like a broken button.

            Its own surface because erasing is not drawing: putting it in the same
            frame as the pens is how a presenter reaching for the highlighter lands on
            area-erase, which is the mode error the whole rail is designed against. */}
        <Group>
          <div className="flex gap-0.5">
            <Btn
              label="Eraser, removes a whole stroke (E)"
              onClick={() => ann.setTool('eraser')}
              selected={ann.tool === 'eraser'}
            >
              <svg {...g}>{ERASER_GLYPH}</svg>
            </Btn>

            <Btn
              label="Erase everything inside an area (Shift+E)"
              onClick={() => ann.setTool('area')}
              selected={ann.tool === 'area'}
            >
              <svg {...g}>{AREA_GLYPH}</svg>
            </Btn>

            <Btn
              label="Erase everything on this slide (Delete)"
              onClick={ann.clear}
              disabled={!ann.hasInk}
            >
              <svg {...g}>
                <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 12.2h9L17.5 7" />
              </svg>
            </Btn>
          </div>
        </Group>

        {/*
          THE SWATCH IS THE BUTTON. A colour needs no glyph, and putting the colour
          inside an icon (a pen tinted amber) hides it at the size a rail allows.

          Selection is a ring in the swatch's OWN colour, on an inner span whose
          geometry is fixed, so it is a box-shadow and costs no layout. Plus a
          permanent hairline inset on every swatch: white ink is the one colour a
          presenter needs on the navy slides and it is otherwise an invisible hole
          in a white panel.
        */}
        <div className="grid grid-cols-3 gap-0.5">
          {INKS.map((i) => {
            const on = ann.color === i.value
            return (
              <button
                key={i.name}
                aria-label={`${i.name} ink${on ? ', selected' : ''} (C cycles colour)`}
                title={`${i.name} ink (C cycles colour)`}
                aria-pressed={on}
                onClick={() => ann.setColor(i.value)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-muted/10"
              >
                <span
                  aria-hidden
                  className="block h-4 w-4 rounded-full"
                  style={{
                    background: i.value,
                    boxShadow: on
                      ? `inset 0 0 0 1px rgba(11, 26, 43, 0.18), 0 0 0 2px #FFFFFF, 0 0 0 4px ${i.value}`
                      : 'inset 0 0 0 1px rgba(11, 26, 43, 0.18)',
                  }}
                />
              </button>
            )
          })}
        </div>

        <Divide />

        <div className="flex gap-0.5">
          {/* ONE BUTTON THAT CYCLES, not three. Three nib buttons is three more
              targets in a rail that already has nineteen, to choose between values
              a presenter changes twice a session. The dot IS the readout: it shows
              the current nib at the matching size in the current ink, inside a
              FIXED 16px box so growing from fine to bold cannot shove the button
              beside it sideways. */}
          <Btn label={`Nib: ${nib?.name ?? 'custom'}. Press to cycle (T)`} onClick={ann.cycleWidth}>
            <span className="flex h-4 w-4 items-center justify-center">
              <span
                aria-hidden
                className="block rounded-full"
                style={{
                  width: dotSize(ann.width),
                  height: dotSize(ann.width),
                  background: ink?.value ?? colors.body,
                  boxShadow: 'inset 0 0 0 1px rgba(11, 26, 43, 0.18)',
                }}
              />
            </span>
          </Btn>

          {/*
            INK SCOPE. Third in this row rather than a row of its own, because the
            row was two buttons wide in a panel that fits three, so the whole
            control costs no height at all, which matters because the panel's height
            is what decides how high up the wall it can still follow the tab.

            Latched on `deck`, which is the state worth flagging: `slide` is the
            default and the behaviour everyone expects, and `deck` is the one where
            ink deliberately does not change with the slide. See the glyph comment
            for why the two states must be distinguishable without reading a word.
          */}
          <Btn
            label={
              ann.scope === 'deck'
                ? 'Ink scope: one sheet for the whole deck, so it stays put while the slides move. Press for one sheet per slide (A)'
                : 'Ink scope: one sheet per slide, so it changes as the deck moves. Press for one sheet across the whole deck (A)'
            }
            onClick={ann.toggleScope}
            selected={ann.scope === 'deck'}
          >
            <svg {...g}>{ann.scope === 'deck' ? SCOPE_DECK_GLYPH : SCOPE_SLIDE_GLYPH}</svg>
          </Btn>

          {/*
            HIDE IS THE REVERSIBLE VERSION OF ERASE-ALL, AND THAT IS THE WHOLE
            POINT OF IT.

            Instructors were reaching for erase-all to declutter: they had drawn
            over a diagram, wanted the clean diagram back for thirty seconds, and
            the only button that did that destroyed the annotation they had just
            spent two minutes building and would want again in the recap. Hiding
            takes the ink off the slide and keeps it. Latched like a tool, because
            it is a state the presenter needs to be able to SEE they are in: a
            hidden-ink deck where the marker appears to draw nothing is otherwise
            indistinguishable from a broken marker.
          */}
          <Btn
            label={ann.hidden ? 'Show the ink again (H)' : 'Hide the ink without erasing it (H)'}
            onClick={ann.toggleHidden}
            selected={ann.hidden}
          >
            {ann.hidden ? (
              <svg {...g}>
                <path d="M3 3l18 18" />
                <path d="M10.4 6.3A9.6 9.6 0 0 1 12 6.2c5 0 8.5 5.8 8.5 5.8a17 17 0 0 1-2.4 3.1M6.4 8.1A16.6 16.6 0 0 0 3.5 12s3.5 5.8 8.5 5.8a8.7 8.7 0 0 0 3.2-.6" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            ) : (
              <svg {...g}>
                <path d="M3.5 12S7 6.2 12 6.2s8.5 5.8 8.5 5.8-3.5 5.8-8.5 5.8S3.5 12 3.5 12z" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
            )}
          </Btn>
        </div>

        <div className="flex gap-0.5">
          <Btn label="Undo (Ctrl+Z)" onClick={ann.undo} disabled={!ann.canUndo}>
            <svg {...g}>
              <path d="M8.5 5.5L4 10l4.5 4.5" />
              <path d="M4 10h9.5a5.5 5.5 0 0 1 0 11H8" />
            </svg>
          </Btn>

          <Btn label="Redo (Ctrl+Shift+Z)" onClick={ann.redo} disabled={!ann.canRedo}>
            <svg {...g}>
              <path d="M15.5 5.5L20 10l-4.5 4.5" />
              <path d="M20 10h-9.5a5.5 5.5 0 0 0 0 11H16" />
            </svg>
          </Btn>
        </div>

        <Divide />

        <Btn label="Leave marker mode (Esc or M)" onClick={() => ann.setActive(false)}>
          <svg {...g}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Btn>
      </div>

      {/*
        THE COLLAPSED BUTTON, WHICH IS ALSO THE HANDLE THE PANEL IS ROOTED IN.

        It stays on screen while the panel is open, so the panel has something to
        have come out of and the pointer has somewhere to rest. Its glyph is the
        armed tool and its dot is the armed colour at the armed nib, which is the
        whole anti-mode-error argument at the top of this file. The label spells the
        same thing out in words for a screen reader and for a hover tooltip.
      */}
      <button
        /*
          A TEST HOOK, BECAUSE THE TAB CANNOT BE ADDRESSED ANY OTHER WAY.

          `marker-check.mjs` drives a real pointer over the BUILT html to prove the
          drag travels, and the only stable selector it had was
          `[data-marker-toolbar] button`, which matches the panel's first tool button
          rather than the tab: the panel is in the DOM even while closed (it has to
          be, or nothing inside it could take focus). So the tab names itself.

          On the element and not in the class list on purpose: a class used as a test
          hook is a class somebody restyles, and this one must survive any amount of
          visual work on the rail.
        */
        data-marker-tab
        aria-label={`Marker: ${cur.name}, ${ink?.name ?? 'custom'} ink, ${nib?.name ?? 'custom'} nib${
          ann.scope === 'deck' ? ', one sheet for the whole deck' : ''
        }${
          ann.hidden ? ', ink hidden (H)' : ''
        }. Press to keep the palette open, or drag up and down to move the rail`}
        title={`${cur.name}, ${ink?.name ?? 'custom'}, ${nib?.name ?? 'custom'}${
          ann.scope === 'deck' ? ', whole deck' : ''
        }${ann.hidden ? ', hidden' : ''}`}
        aria-expanded={open}
        /*
          THE TAB IS BOTH THE PIN AND THE DRAG HANDLE, AND THE THRESHOLD IS WHAT
          KEEPS THOSE TWO FROM FIGHTING.

          A press that does not travel `DRAG_THRESHOLD` is still a click and still
          pins the panel open. A press that does travel is a drag, and it must NOT
          pin or unpin on release, which is what `draggedRef` is for: the click
          event fires after the pointerup even when the pointer moved 200px, so
          without the guard every reposition would also toggle the pin and the panel
          would flick shut as the presenter let go.

          `setPointerCapture`, so a drag that leaves the 36px tab (which it does
          immediately, since the rail moves out from under the pointer as it goes)
          keeps tracking and still ends here.

          VERTICAL ONLY, AND THAT IS A DESIGN DECISION RATHER THAN A SHORTCUT. The
          rail is docked furniture: it is asked to be stuck to the right wall as a
          curved rectangle AND to be movable, and free 2D dragging satisfies the
          second by destroying the first, leaving a floating card adrift over the
          slide with a rounded-left edge that no longer means anything. So it slides
          up and down the wall it is docked to, which is also the only axis the
          complaint was about: the rail sitting over slide content is a question of
          height, never of which wall it is on.
        */
        onPointerDown={onTabDown}
        onPointerMove={onTabMove}
        onPointerUp={onTabUp}
        onPointerCancel={onTabUp}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false
            return
          }
          setPinned((was) => !was)
        }}
        /* A TAB, NOT A PILL: 36px wide, rounded on its left side only, with the
           right edge running flat into the wall. The extra 4px of width is the part
           that would have been the right-hand curve, so the glyph stays centred on
           the same optical centre it had as a pill. */
        className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-l-[14px] rounded-r-none bg-white/85 pr-0.5 ring-1 ring-muted/20 backdrop-blur transition-colors hover:bg-white ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        /* `touchAction: 'none'` or a touch drag on the tab scrolls the page instead
           of moving the rail, and the browser swallows the move events on the way. */
        style={{
          boxShadow: '0 6px 24px -12px rgba(0, 37, 75, 0.28)',
          color: colors.body,
          touchAction: 'none',
        }}
      >
        <svg {...g}>{cur.glyph}</svg>
        {/* The armed ink and nib, as one dot pinned to the corner. Absolutely
            positioned so changing nib size cannot nudge the glyph, and inside a
            fixed 32px button so it cannot nudge anything else either. */}
        <span
          aria-hidden
          className="absolute bottom-1 right-1 block rounded-full"
          style={{
            width: dotSize(ann.width),
            height: dotSize(ann.width),
            background: ink?.value ?? colors.body,
            boxShadow: 'inset 0 0 0 1px rgba(11, 26, 43, 0.18)',
            /* Dimmed rather than removed while the ink is hidden: the colour is
               still what is armed, it just is not currently on the slide. */
            opacity: ann.hidden ? 0.35 : 1,
          }}
        />
      </button>
    </div>
  )
}
