import { colors } from '@/design/tokens'
import { Card, BOX_W } from './scene'

/**
 * KEY TAKEAWAYS (user, 2026-10-22, a permanent rule for every session):
 * rebuilt to the reference build in `slidestraining/Untitled` (read only:
 * `Slide 16_9 - 102/103/104.png` are the design, `Frame*.png` the check
 * icon, `Cheerful Student with Books and Checklist.png` the illustration).
 *
 * What the reference shows, measured on its 1920 x 1080 frame and scaled to
 * this deck's 1280 x 720: the kit header with the session as the kicker and
 * `Key Takeaways` as the title; a single column of items at x 64, each a
 * 37px blue check disc (the reference's own `Frame.png`, here
 * `public/assets/takeaways/check.png`) beside one bold line, 24px, rows
 * 72px apart; and the cheerful student with her books standing at the lower
 * right, her shins running under the blue strip at the foot of the slide
 * (`student.png`, a 700px copy of the reference asset).
 *
 * THE LIST IS THE AGENDA'S TITLES AND NOTHING MORE (user, 2026-10-23: "I need
 * whatever is present in the agenda slide, do not add extra points"): the
 * five titles the agenda slide shows, one line each; the sub lines the
 * component still receives are not rendered. Content rule 20 holds: the
 * strings are the agenda's, word for word.
 *
 * THE STUDENT IS ANCHORED TO THE SLIDE'S FOOT, NOT TO THE LIST (user,
 * 2026-10-23: "check the placement of the illustration, it attaches to the
 * gradient strip in the reference, reposition it"). In the reference her
 * picture runs down into the strip (her feet are under it, cut mid-shin), her
 * head top at 42% of the frame, her right edge clear of the logo. Here the
 * picture's foot sits on the slide's bottom edge (y 720), so the foot band
 * crosses her shins; the body box is given the full height under the header
 * (`BODY_H`), so the deck's centring rule has no slack to move it and the
 * picture's `top` is a fixed number. 270 wide, 405 tall (the file's aspect),
 * right edge at 1160, clear of the mark at the bottom right and of the
 * reserved video area at the top right.
 */

/** The content column starts under the header at y 221 and x 64; the safe bottom is 640. */
const BODY_TOP = 221
const BODY_LEFT = 64
const BODY_H = 420
/** Her picture's box in slide coordinates: right edge 1160, foot on the slide's bottom edge. */
const STUDENT = { w: 270, h: 405, right: 1160 }

/** `kicker` and `title` override the frame for a recap of the previous session (Deployment & Service Models, reference slide 3): the same layout, the previous session's name as the title. */
export function Takeaways({ lesson, items, kicker, title = 'Key Takeaways', id = 'takeaways' }: { lesson: string; items: { title: string; sub?: string }[]; kicker?: string; title?: string; id?: string }) {
  return (
    <Card id={id} kicker={kicker ?? lesson} title={title} lesson={lesson}>
      <div className="relative" style={{ width: BOX_W, height: BODY_H }}>
        <ol className="flex flex-col" style={{ width: 800, gap: 38, paddingTop: 10 }}>
          {items.map((it) => (
            <li key={it.title} className="flex items-center gap-5">
              <img src="/assets/takeaways/check.png" alt="" draggable={false} className="h-[37px] w-[37px] shrink-0 select-none" />
              <p className="font-heading text-[24px] font-semibold leading-[1.3]" style={{ color: colors.ink }}>
                {it.title}
              </p>
            </li>
          ))}
        </ol>
        {/* her foot at the slide's bottom edge: 720 - 221 (the body's top) - her height */}
        <img
          src="/assets/takeaways/student.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={{ left: STUDENT.right - STUDENT.w - BODY_LEFT, top: 720 - BODY_TOP - STUDENT.h, width: STUDENT.w, height: STUDENT.h }}
        />
      </div>
    </Card>
  )
}
