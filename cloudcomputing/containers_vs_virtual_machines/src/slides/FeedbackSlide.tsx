import { SlideBase, Kicker, Icons } from '@/ui'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { colors, fonts } from '@/design/tokens'
import type { FeedbackSlideProps } from './types'

/**
 * THE FEEDBACK SLIDE: the standard one, content rule 41 (user, 2026-10-06).
 *
 * Built and chosen in Python session 18 (that session's `CLAUDE.md`, decision
 * 23), carried by every deck since as `src/decks/figures/FeedbackForm.tsx` with
 * `public/assets/feedback-qr.png`, and folded into the kit from session 31 on
 * the user's word on 2026-10-14. The kit's earlier `FeedbackSlide` (a heading,
 * a prompt and a link, no way to reach the form) is gone; this one keeps the
 * name so every deck's `<FeedbackSlide lesson={SESSION} />` is the standard
 * slide, and `FeedbackEmbedSlide` is kept as an alias for the sessions' name.
 *
 * The night stage, the kicker, the title and one line at the header zone's
 * origin, and ONE white box across the body zone holding, side by side and
 * centred as a group: the QR code the user supplied (`public/assets/
 * feedback-qr.png`, the file as given, byte for byte) with the label "Scan to
 * open the feedback form" and the form's link (a new tab), a thin separator
 * line, and the Google Form itself in an iframe (`/viewform?embedded=true`).
 * The form scrolls inside its frame; the slide never scrolls. It needs the
 * network, which is the one thing the rest of a deck never does. The room
 * scans or taps; either lands on the same form.
 *
 * WHERE THINGS SIT. The header block is at x 64, y 48, like `ZonedFrame`'s;
 * the body is one block, x 64..1216, y 240..640, which is the white box. It
 * starts below the speaker box's floor (y 220, content rule 32) and ends above
 * the footer mark and the control bar (y 660). Inside it the QR block (300
 * wide), the separator and the frame (640 wide, the form's own full width)
 * are centred horizontally as a group and vertically on the box's middle.
 *
 * ON A PHONE HELD UPRIGHT the 16:9 canvas is letterboxed, so the box stacks
 * instead (`@media (orientation: portrait)`): the line under the title goes,
 * the box starts under the title, the QR block becomes a compact row, the
 * separator turns horizontal and the frame takes the full width below. Held
 * sideways, the box stops at y 576 so the summoned overlay bar covers nothing
 * on this slide; a docked bar sits below the stage, so the rule is harmless
 * there.
 *
 * The CSS is injected once at module load, as the foundations' `motion.tsx`
 * does, so the slide is one self-contained file. Every colour below is a token.
 */

export const FEEDBACK_FORM_ID = '1FAIpQLSdYcHF7SWfQWc6AQjn3BPIYLUpb1cED0nTTrcQ8k4WpIbFodg'
/** What the QR code encodes. Decoded from the supplied image, not typed. */
export const FEEDBACK_SHORT_URL = 'https://forms.gle/5d1Ru8geTKdC4Bcr7'
export const FEEDBACK_EMBED_URL = `https://docs.google.com/forms/d/e/${FEEDBACK_FORM_ID}/viewform?embedded=true`

const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const CSS = `
/* 760 wide (x 64..824, short of the speaker box) so the title sits on ONE line at 44px (user, 2026-10-06). */
.fb-header { position: absolute; left: 64px; top: 48px; width: 760px; }
.fb-title { white-space: nowrap; }
.fb-sub { margin-top: 14px; font: 400 19px/1.45 ${fonts.body}; color: rgba(255,255,255,0.78); }
.fb-body { position: absolute; left: 64px; top: 240px; width: 1152px; height: 400px; }

/* THE ONE WHITE BOX: QR block, separator, frame, centred as a group.
   Decorated as the kit decorates a card (user, 2026-10-06): the Card's hairline
   line border, the Callout's accent bar in the brand tone (here on the left,
   stopping short of the rounded corners), and a soft brand halo under the
   float shadow so the white lifts off the navy. None of it moves anything:
   the border is inside the box (border-box) and the bar is painted, not laid out. */
.fb-box { position: relative; display: flex; align-items: center; justify-content: center; gap: 32px; width: 100%; height: 100%; padding: 18px;
  border-radius: 18px; border: 1px solid ${colors.line}; background: ${colors.white};
  box-shadow: 0 0 0 6px ${colors.brand}1F, 0 26px 70px -24px rgba(45,99,251,0.5); }
.fb-box::before { content: ''; position: absolute; left: -1px; top: 28px; bottom: 28px; width: 5px; border-radius: 0 3px 3px 0;
  background: linear-gradient(${colors.brand}, ${colors.brandDark}); }

.fb-qr { display: flex; flex-direction: column; align-items: center; width: 300px; flex: none; }
.fb-qr-img { display: grid; place-items: center; padding: 10px; border-radius: 12px; background: ${colors.white}; box-shadow: inset 0 0 0 1px ${colors.line}; }
.fb-qr-img img { display: block; width: 216px; height: 216px; }
.fb-qr-text { display: flex; flex-direction: column; align-items: center; margin-top: 14px; min-width: 0; }
.fb-qr-label { font: 600 16px/1.35 ${fonts.body}; color: ${colors.ink}; text-align: center; }
.fb-qr-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 2px 4px; border-radius: 6px;
  font: 600 16px/1.3 ${fonts.body}; color: ${colors.brandDark}; text-decoration: none;
  transition: color 200ms ${HOUSE}; }
.fb-qr-link:hover { color: ${colors.brand}; }
.fb-qr-link:focus-visible { outline: none; box-shadow: 0 0 0 4px ${colors.brand}33; }
.fb-qr-link svg { width: 16px; height: 16px; flex: none; }
.fb-qr-cta { margin-top: 10px; font: 400 16px/1.35 ${fonts.body}; color: ${colors.body}; text-align: center; }

/* The separator: a hairline, about the QR panel's height, on the box's middle. */
.fb-sep { flex: none; width: 1px; height: 240px; border-radius: 1px; background: ${colors.line}; }

/* The frame: the form's own full width, the box's full height, framed like the QR panel. */
.fb-frame { flex: none; width: 640px; height: 100%; overflow: hidden; border-radius: 12px; border: 1px solid ${colors.line}; background: ${colors.white}; }
.fb-frame iframe { display: block; width: 100%; height: 100%; border: 0; background: ${colors.white}; }

/* A PHONE HELD SIDEWAYS: the control bar lies over the stage while it is shown
   (this session's overlay mode, decision 14) and its top edge lands near y 584
   of the canvas at 740x360. The box stops short of it, so even the summoned
   bar covers nothing. Desktop and portrait are untouched. */
@media (max-height: 480px) and (orientation: landscape) {
  .fb-body { height: 336px; }
  .fb-qr-img img { width: 160px; height: 160px; }
  .fb-sep { height: 200px; }
}

@media (orientation: portrait) {
  .fb-sub { display: none; }
  .fb-body { top: 192px; height: 448px; }
  .fb-box { flex-direction: column; gap: 14px; padding: 14px; }
  .fb-qr { flex-direction: row; align-items: center; gap: 12px; width: auto; }
  .fb-qr-img { padding: 6px; }
  .fb-qr-img img { width: 116px; height: 116px; }
  .fb-qr-text { margin-top: 0; align-items: flex-start; }
  .fb-qr-label, .fb-qr-cta { text-align: left; }
  .fb-qr-link { word-break: break-all; }
  .fb-sep { width: 60%; height: 1px; }
  .fb-frame { width: 100%; height: auto; flex: 1 1 0; min-height: 0; }
}
`

if (typeof document !== 'undefined' && !document.querySelector('style[data-fb-form]')) {
  const el = document.createElement('style')
  el.dataset.fbForm = ''
  el.textContent = CSS
  document.head.appendChild(el)
}

/**
 * The header is kept out of the body block so `align-check.mjs` reads the body
 * as one aligned block, the way it reads every `ZonedFrame` slide.
 */
export function FeedbackSlide({ lesson }: FeedbackSlideProps) {
  return (
    <SlideBase variant="night" lesson={lesson} footer padded={false}>
      <RevealGroup className="fb-header" stagger={0.1}>
        <Reveal dir="up">
          <Kicker onDark>Feedback</Kicker>
        </Reveal>
        <Reveal dir="up">
          <h1 className="fb-title mt-3 font-heading text-slide-title-lg font-extrabold leading-[1.05] text-white">
            We’d love your <span className="text-brand-200">feedback</span>
          </h1>
        </Reveal>
        <Reveal dir="up" delay={0.05}>
          <p className="fb-sub">Your thoughts help us improve this course</p>
        </Reveal>
      </RevealGroup>

      <RevealGroup className="fb-body" delayChildren={0.3}>
        <Reveal dir="up" className="fb-box">
          <div className="fb-qr">
            <div className="fb-qr-img">
              {/* The supplied QR, as given. Scaled for display only; the file is untouched. */}
              <img src="/assets/feedback-qr.png" alt="QR code for the feedback form" width={216} height={216} draggable={false} />
            </div>
            <div className="fb-qr-text">
              <span className="fb-qr-label">Scan to open the feedback form</span>
              <a className="fb-qr-link" href={FEEDBACK_SHORT_URL} target="_blank" rel="noopener noreferrer">
                forms.gle/5d1Ru8geTKdC4Bcr7
                <Icons.ArrowRight aria-hidden />
              </a>
              <span className="fb-qr-cta">Scan the code, click the link, or fill out the form right here</span>
            </div>
          </div>
          <span className="fb-sep" aria-hidden />
          <div className="fb-frame">
            <iframe src={FEEDBACK_EMBED_URL} title="Feedback form" loading="eager" />
          </div>
        </Reveal>
      </RevealGroup>
    </SlideBase>
  )
}

/** The sessions' name for the same slide. */
export const FeedbackEmbedSlide = FeedbackSlide
