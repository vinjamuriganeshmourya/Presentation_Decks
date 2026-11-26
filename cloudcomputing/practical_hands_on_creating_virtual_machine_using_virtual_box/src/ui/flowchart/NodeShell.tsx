import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import type { StationLogo } from '@/ui/flowFigure'
import { E, c4 } from '@/ui/figureTiming'
import type { FcNode } from './flowchartFigure'

/**
 * ONE CARD, ONE PADDING SCALE, ONE HOVER, FOR EVERY VARIANT.
 *
 * Three variants were each growing their own copy of the card chrome, and the
 * padding had already drifted between them by the second one. Six figures that
 * differ in geometry must not also differ in how much air is inside a box, or
 * the comparison measures the padding instead of the design.
 *
 * THE PADDING SCALE, AND WHY IT IS A FLOOR AND NOT A DECLARATION
 *
 * `py-3` declares 12px. What a card actually shows is `(slot height - content
 * height) / 2`, and if the content is taller than the slot minus its padding,
 * the declared value means nothing. Measured across all six variants, the real
 * vertical gap was:
 *
 *   LaneFlow, four of six cards          0px   text flush against the border
 *   CircuitMap, "Automated checks run"  -7px   content overflowing the card
 *   Spine / Gate / Track, tallest card   1px
 *
 * Declared 12px in every one of them. A two-line label plus an icon plus a
 * caption is about 89px of content, and the slots were 74 to 92.
 *
 * So two things had to change together, and neither works alone:
 *
 *   1. **The content got shorter here.** 24px icon (was 28), 14px label on 1.25
 *      leading (was 15px), 11px caption on 1.3 (was 11.5). Worst-case stacked
 *      content is now about 77px rather than 89px.
 *   2. **Every slot got taller in its variant.** A slot must be at least
 *      `CONTENT_MAX + 2 * PAD_Y`, which is the constant exported below so the
 *      variants size themselves from one number rather than from six guesses.
 *
 * | Slot         | Value  | Why                                              |
 * |--------------|--------|--------------------------------------------------|
 * | card, y      | 14px   | the floor, and slots are sized to honour it       |
 * | card, x      | 16px   | measured 16 to 27px real; horizontal was never    |
 * |              |        | the problem, because cards are wider than needed  |
 * | icon to text | 4px    | one step below the text's own leading             |
 * | popover      | 14/12  | denser than a card: it is an aside, not a step    |
 *
 * Horizontal padding was already honoured everywhere (16 to 27px real), which is
 * why this was a vertical problem only.
 *
 * WHY HOVER IS A DIFFERENT TIER FROM THE FIGURE'S ENTRANCE
 *
 * The figure assembles at the EXPLANATORY tier: 520ms entrances, because it is
 * read once from the back of a room. A hover is the opposite case. The presenter
 * triggers it deliberately, repeatedly, and is waiting for the answer, so it is
 * squarely in the `animate` skill's UI tier and takes UI numbers: 160ms for the
 * lift, 180ms for the popover. Reusing the figure's 520ms here would feel broken,
 * and it is the mistake to avoid when a slide gains an interaction.
 *
 * Two consequences, both deliberate:
 *
 *   - **The lift is a CSS transition, not framer.** It is interruptible, it
 *     retargets from wherever it is when the pointer leaves, and it runs off the
 *     main thread. Keyframes and JS both restart from zero on a fast in-out.
 *     `.fc-node` in `index.css` owns it, gated behind
 *     `@media (hover: hover) and (pointer: fine)` so a touch device does not fire
 *     a false hover on tap.
 *   - **The popover is framer**, because it mounts and unmounts and needs an exit.
 *
 * THE POPOVER IS NEVER IN THE DOM UNLESS IT IS OPEN
 *
 * `qa.mjs`, `video-safe.mjs` and `align-check.mjs` measure static DOM rectangles.
 * A detail panel parked at `opacity: 0` would be measured, would be reported as
 * overflowing the frame or intruding on the instructor-video rectangle, and would
 * be wrong every time. `AnimatePresence` keeps it out of the tree entirely until
 * a pointer is on the node.
 *
 * It also means the slide is complete without it. The room cannot hover a
 * projector, so `detail` is an aside for the presenter and never the teaching.
 */

/**
 * The vertical padding a card must actually show, and the tallest content a
 * stacked card can hold: a 24px icon, a 4px gap, a two-line 14px label on 1.25
 * leading, and a one-line 11px caption.
 *
 * `NODE_MIN_H` is what a variant's slot height must not go below. Every variant
 * imports it rather than picking its own number, because six independent guesses
 * is exactly how the padding came to be 0px in four cards and negative in one.
 */
export const PAD_Y = 14
export const CONTENT_MAX = 78
export const NODE_MIN_H = CONTENT_MAX + PAD_Y * 2 /* 106 */

export type NodeLook = 'step' | 'terminal' | 'decision'

export function lookOf(node: FcNode): NodeLook {
  if (node.kind === 'start' || node.kind === 'end') return 'terminal'
  if (node.kind === 'decision') return 'decision'
  return 'step'
}

/** Where the popover sits relative to the node it explains. */
type Side = 'top' | 'bottom'

/**
 * The same five-plus-two names as `BoundaryBridge`'s own map, and it is a second
 * copy on purpose rather than an import: `BoundaryBridge` is a different figure
 * family and importing across them would couple `flowchart/` to `flowFigure.ts`
 * for one record. The union in `flowFigure.ts` is the single source of the NAMES,
 * which is the part that can drift; a missing row here is a type error.
 */
const LOGO_SRC: Record<StationLogo, string> = {
  docker: '/assets/tech/docker.png',
  git: '/assets/tech/git.png',
  github: '/assets/tech/github.png',
  jenkins: '/assets/tech/jenkins.png',
  python: '/assets/tech/python.png',
  nodejs: '/assets/tech/nodejs.png',
  makefile: '/assets/tech/makefile.png',
}

export function NodeShell({
  node,
  look,
  paint,
  /** `row` puts the icon beside the text; `stack` puts it above. */
  layout = 'stack',
  /**
   * The silhouette. `card` is the house rounded rectangle; `pill` and `diamond`
   * exist for `CircuitMap`, which argues for the classic notation. Kept here
   * rather than in that variant so hover, padding and the detail popover behave
   * identically whatever shape a variant chooses.
   */
  shape = 'card',
  side = 'top',
  className = '',
  children,
}: {
  node: FcNode
  look: NodeLook
  paint: string
  layout?: 'row' | 'stack'
  shape?: 'card' | 'pill' | 'diamond'
  side?: Side
  className?: string
  /** Replaces the default body entirely, for a variant with its own shape. */
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = node.icon ? iconByName[node.icon as keyof typeof iconByName] : null
  /* A real mark wins over a house glyph. See `FcNode.logo`: rule 12 wants the
     vendor file, unrecoloured, and `object-contain` keeps a wide wordmark from
     being stretched into the square the glyphs occupy. */
  const logoSrc = node.logo ? LOGO_SRC[node.logo] : null
  const filled = look === 'terminal'
  const decision = look === 'decision'
  const hasDetail = Boolean(node.detail)

  const radius =
    shape === 'pill' ? 'rounded-pill' : shape === 'diamond' ? 'rounded-lg' : 'rounded-card'
  const chrome = filled
    ? `${radius} shadow-card`
    : decision
      ? `${shape === 'diamond' ? 'rounded-lg' : 'rounded-xl2'} shadow-card-soft`
      : `${radius} border border-line bg-white shadow-card-soft`

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node flex h-full w-full ${
          /*
            THE DIAMOND'S ROTATION IS NOT ON THIS ELEMENT, AND THAT IS THE FIX.

            It used to be: `rotate-45` here, `-rotate-45` on the content to put
            the text back level. But the hover rule sets
            `transform: translateY(-3px)` on this same element, and `transform`
            is ONE property. The hover value replaced the rotation outright, so
            pointing at the decision un-rotated the box while its content kept
            its counter-rotation: the card squared up and the text swung to 45
            degrees.

            The rotated square is now a separate absolutely-positioned layer
            below, so this element owns only the hover transform and the two can
            never collide. The content is not counter-rotated at all, because it
            is never rotated in the first place.
          */
          shape === 'diamond' ? 'relative items-center justify-center px-2 py-2' : 'px-4 py-3.5'
        } ${shape === 'diamond' ? '' : chrome} ${
          layout === 'row' ? 'items-center gap-2.5' : 'flex-col items-center justify-center gap-1 text-center'
        } ${hasDetail ? 'fc-node--hoverable' : ''} ${shape === 'diamond' ? 'fc-node--bare' : ''}`}
        style={
          shape === 'diamond'
            ? undefined
            : filled
            ? { background: paint }
            : decision
              ? {
                  /*
                    OPAQUE, and it was not before.

                    `${paint}12` is a 7% wash, so on `TrackSwitch` the main rail
                    ran straight through the decision card and out the other
                    side: the card looked like a hole in the figure. Every other
                    look is opaque (a terminal is a solid fill, a step is
                    `bg-white`), so the decision was the only one a connector
                    could show through.

                    Two background layers: the tint painted over an opaque white
                    base. Keeps the same colour and stops anything behind it
                    reading through.
                  */
                  background: `linear-gradient(${paint}12, ${paint}12), ${colors.white}`,
                  border: `2px solid ${paint}`,
                }
              : undefined
        }
        aria-describedby={open ? id : undefined}
      >
        {shape === 'diamond' && (
          <span
            aria-hidden
            className={`fc-node__shape absolute inset-[14%] rotate-45 rounded-lg ${filled ? 'shadow-card' : 'shadow-card-soft'}`}
            style={
              filled
                ? { background: paint }
                : {
                    background: `linear-gradient(${paint}12, ${paint}12), ${colors.white}`,
                    border: `2px solid ${paint}`,
                  }
            }
          />
        )}
        {children ?? (
          <span
            className={
              shape === 'diamond'
                ? 'relative flex flex-col items-center gap-1 px-1 text-center'
                : 'contents'
            }
          >
            {logoSrc ? (
              /*
                THE MARK SITS ON A WHITE TILE, always, on a filled card and a
                plain one alike. GitHub's mark is near black and Jenkins's is
                dark red on cream: dropped straight onto a `filled` brand-blue
                card they read as smudges, and the same tile that fixes that on
                blue keeps every mark on the identical ground everywhere else, so
                a row of them looks like one system. Tinting a vendor file to
                match the card is the other way to solve it and it is the
                forbidden one.
              */
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                style={{ background: '#FFFFFF', boxShadow: `0 1px 2px 0 ${colors.brandDeep}2e` }}
              >
                <img src={logoSrc} alt="" draggable={false} className="h-4 w-4 object-contain" />
              </span>
            ) : (
              Icon && (
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                  style={
                    filled
                      ? { background: 'rgba(255,255,255,0.22)', color: '#FFFFFF' }
                      : { background: `${paint}18`, color: paint }
                  }
                >
                  <Icon width={14} height={14} />
                </span>
              )
            )}
            <span className={layout === 'row' ? 'min-w-0' : ''}>
              <span
                className="block font-heading text-[14px] font-bold leading-[1.25]"
                style={{ color: filled ? '#FFFFFF' : decision ? paint : colors.ink }}
              >
                {node.label}
              </span>
              {node.caption && (
                <span
                  className="mt-1 block text-[11px] leading-[1.3]"
                  style={{ color: filled ? 'rgba(255,255,255,0.82)' : colors.body }}
                >
                  {node.caption}
                </span>
              )}
            </span>
          </span>
        )}

        {/* A hover affordance the room can see without a pointer: a small dot
            saying this node has more behind it. Without it, the detail is a
            secret only the person holding the mouse knows exists. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: filled ? 'rgba(255,255,255,0.55)' : `${paint}66` }}
          />
        )}
      </div>

      <AnimatePresence>
        {open && node.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[268px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              /* Scales from the edge nearest the node, so it reads as coming OUT
                 of the node rather than appearing beside it. The `animate`
                 skill's origin-aware rule; modals are the exception, not this. */
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
              {node.label}
            </span>
            {node.detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
