import type { ReactNode } from 'react'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { useContinuity } from '@/motion/continuity'
import { Kicker } from './primitives'
import { accentByTone, type Tone } from '@/design/tokens'

/**
 * The standard content-slide header: an accent rail + kicker + title + lead.
 * Self-animates its parts on slide entry, EXCEPT the parts that were already on
 * screen a moment ago.
 *
 * CONTINUITY
 * A concept spans several slides and every one of them repeats the concept's name
 * in its kicker, so replaying the entrance meant the same kicker flew in again on
 * every slide of the concept while only the body had changed. `useContinuity`
 * reports which parts are unchanged from the previous slide, and those render
 * through `Still` instead of `Reveal`: same markup, same position, no animation.
 * See `src/motion/continuity.ts` for how that is decided.
 *
 * VIDEO BOX RESERVATION
 * The top-right 367x220 of the 1280x720 canvas is kept clear for an instructor
 * video. Content slides centre their content in whatever height the header
 * leaves, so a tall payload creeps upward into that band. The header therefore
 * claims a minimum height (`min-h-[168px]`, which puts the content well's top
 * edge at y=216 given SlideBase's 48px top padding), so no content can begin
 * inside the reserved rows. Headers taller than that (a two-line title, a long
 * lead) simply grow as before.
 */
const HEADER_MIN_H = 'min-h-[168px]'

/**
 * The same floor for a header that has NO lead.
 *
 * A kicker and a one-line title measure about 68px, so the full 168px reserved a
 * lead's worth of space that nothing ever filled: the gap between the title and
 * the first line of body copy read as a hole in the slide. 120px keeps the well's
 * top edge at y=168 and hands the other 48px back to the content.
 *
 * The video reservation is NOT enforced by this number alone once it drops below
 * 172 — see the right-column guard in `ContentSlide`, which holds a side visual at
 * y>=220 regardless of how short the header is.
 */
const HEADER_MIN_H_NO_LEAD = 'min-h-[120px]'

/**
 * A `Reveal` that does not move: a plain div, so `RevealGroup`'s variants have
 * nothing to propagate into and the part simply exists at its final position.
 *
 * It takes and ignores `dir` and `delay` so it is a drop-in swap for `Reveal` at
 * the call site, which keeps the branching to one ternary per part rather than
 * two copies of every element.
 */
function Still({
  children,
  className,
}: {
  children: ReactNode
  dir?: string
  delay?: number
  className?: string
}) {
  return <div className={className}>{children}</div>
}
export function SlideHeader({
  kicker,
  title,
  lead,
  tone = 'brand',
  onDark = false,
  align = 'left',
  floor = true,
  className = '',
}: {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  tone?: Tone
  onDark?: boolean
  align?: 'left' | 'center'
  /**
   * The min-height floor above. `ZonedFrame` turns it off: there the body box
   * starts at a fixed y=221 whatever the header measures, so the floor only
   * padded the header past its own zone (y 0..148, content rule 22).
   */
  floor?: boolean
  className?: string
}) {
  const color = accentByTone[tone]
  const centered = align === 'center'
  const carry = useContinuity()
  const KickerPart = carry.kicker ? Still : Reveal
  const TitlePart = carry.title ? Still : Reveal
  const LeadPart = carry.lead ? Still : Reveal
  return (
    <RevealGroup
      className={`relative shrink-0 ${floor ? (lead ? HEADER_MIN_H : HEADER_MIN_H_NO_LEAD) : ''} ${
        centered ? 'text-center' : ''
      } ${className}`}
      stagger={0.08}
    >
      {!centered && (
        /*
          TWO BARS, SHORTER, PULLED IN TOWARDS THE TEXT (content rule 23). This
          replaced ONE full-height rail, `-left-16 top-1 h-full w-[6px]`.

          The geometry is measured off `Rules_beta/graphics.png` rather than
          chosen, and was judged on `Rules_beta/beta_testing_slides` first. That
          design was sampled pixel by pixel: a 24px bar occupying x 0..24, an 8px
          gap, then the 6px rail at x 32..37, both starting at the same y and both
          carrying the same fade. Each number below is one of those.

          THE EDGE BAR, x 0..24. `-left-16` is -64px, which cancels SlideBase's
          px-16 gutter exactly, so the bar lands on the frame edge. `w-6` is 24px.
          Only its right corners are rounded, and only by 2px. The left pair is
          off-canvas, and rounding a corner nobody can see is how a shape ends up
          looking lopsided at another aspect ratio. 2px rather than the 6 this
          first shipped with: the design's first row measures 0.8px narrower than
          its full width, which is a radius of about two, and it reads as a square
          bar with the corner taken off rather than as a rounded one. A LANCZOS
          side-by-side made 6px look right, which is what resampling does to a
          2px curve; the row-by-row measurement is the one to trust.

          THE GAP, 8px. -32px minus the edge bar's 24px width. It is the whole
          idea of the pair: two marks close enough to read as one object, with a
          seam that catches the light. Any wider and they are two unrelated bars.

          THE RAIL, x 32..38, within a pixel of the design's own.

          HEIGHT 80px for both (`h-20`), against the old rail's `h-full`. `h-full` is
          the header block's own height, so the rail ran the full 168px of a
          header WITH a lead and, because `top-1` offsets it 4px, finished at
          y=220 against the block's own 216: 4px longer than the thing it belongs
          to. At 80px both bars start with the kicker at y=52 and end at y=132,
          five pixels under the title's baseline, so they bracket exactly the pair
          rule 19 pins and stop before the description. The design measures 76 and
          74 of VISIBLE bar, which is the same box: the gradient has faded to
          nothing before the box ends.

          A fixed height no longer adapts to a two-line title, where the bars stop
          level with the first line. The gradient has faded by then, so it does
          not read as short. If it ever does, `h-24` is the next step up, and both
          bars have to move together.
        */
        /*
          THE UPDATED TEMPLATE'S HEADER (user, 2026-10-12; the base template
          since 2026-10-14). The two bars of content rule 33 are gone. In their
          place the template's GRADIENT DIVIDER runs BETWEEN the kicker and the
          title: 3px tall (4px on the 1920 frame), 400px long (600px there)
          from the text's left edge, solid deep blue for 13% of its run and
          faded to nothing by the end, the agenda reference's own rule. It is
          positioned absolutely, 33px below the header's top (y=48), which is
          the template's own y for it (115 on the 1920 frame) plus the 4px the
          kicker's line box grew when the kicker went from 15px to 22px (user,
          2026-10-13). Drawn only under a kicker.
        */
        kicker != null && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 h-[3px] w-[400px]"
            style={{
              top: 33,
              background: `linear-gradient(90deg, ${color} 0%, ${color} 13%, ${color}8C 68%, ${color}00 100%)`,
            }}
          />
        )
      )}
      {kicker && (
        <KickerPart dir="right" className={centered ? 'mb-3 inline-block' : 'mb-3 block'}>
          {/* The user's sheet: the kicker (header label) DM Sans Medium, the slide title DM Sans SemiBold. */}
          <Kicker tone={tone} onDark={onDark} className="font-tpl-body">
            {kicker}
          </Kicker>
        </KickerPart>
      )}
      <TitlePart dir="up">
        <h2
          className={`font-heading font-semibold leading-tight ${
            centered ? 'text-slide-title-lg' : 'text-slide-title'
          } ${onDark ? 'text-white' : 'text-ink'}`}
        >
          {title}
        </h2>
      </TitlePart>
      {lead && (
        <LeadPart dir="up" delay={0.05}>
          <p
            className={`mt-3 max-w-3xl text-body-lg ${
              centered ? 'mx-auto' : ''
            } ${onDark ? 'text-white/80' : 'text-body'}`}
          >
            {lead}
          </p>
        </LeadPart>
      )}
    </RevealGroup>
  )
}
