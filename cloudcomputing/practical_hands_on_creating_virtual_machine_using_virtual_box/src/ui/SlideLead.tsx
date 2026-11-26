import type { ReactNode } from 'react'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { useContinuity } from '@/motion/continuity'
import { accentByTone, type Tone } from '@/design/tokens'
import { iconByName, type IconName } from './icons'

/**
 * THE POINT — the sentence under the heading that says what this slide is for.
 *
 * It used to be the `lead` of `SlideHeader`, rendered inside the header block. It
 * is now the first thing in the CONTENT well, above the bullets and any figure,
 * because it is content: the kicker and title NAME the slide, the lead makes its
 * argument. In the header it read as a subtitle of the heading; the heading block
 * is now the heading alone.
 *
 * The move is presentational only. `lead` is still a prop of the slide, still
 * authored in the deck file the same way, and continuity still compares it, so no
 * deck changes and no signed-off deck moves except in where that sentence is
 * drawn. Ported into the kit from `deployement_session_3`, which cut its whole
 * deck this way before the pattern was promoted; session 4 onward gets it by
 * default.
 *
 * WHY IT IS MARKED, AND WHY SO LIGHTLY.
 * Set as plain prose it was indistinguishable from the first bullet under it, and
 * a sentence that reads like a bullet stops doing the job of introducing them. So
 * it carries a single tone-coloured arrow, pointing into the sentence.
 *
 * The arrow is BARE: no tinted holder, no rounded chip behind it. A holder made
 * the mark a small object of its own that the eye stopped on before the words,
 * which is backwards for a line whose whole job is to hand the room the sentence.
 * A stroke on the flat page marks the line without becoming a thing on it.
 *
 * `Callout` is deliberately NOT reused, and this deliberately does not look like
 * one. A callout is a filled panel with a left border, a 40px solid icon block and
 * a bold label, and it interrupts: it is for the warning, the gotcha, the aside.
 * Several of these slides carry a real one in their body (`ContentNoteSlide`
 * always does), and a lead dressed the same way would compete with it and flatten
 * the difference between "here is the idea" and "here is the trap". This is the
 * lighter register: one glyph, no ground, no label line, and the deck's body-lg
 * type so the sentence still reads as the largest text in the well.
 *
 * WIDTH IS A HARD CONSTRAINT, NOT TASTE.
 * `max-w-3xl` (768px) keeps the text clear of the instructor video, which is
 * composited into `x 913..1280, y 0..220` later and is never drawn on the slide.
 * The header's floor now stops at y=168, so this is the first thing that could
 * reach that band, and an uncapped line at full slide width would run straight
 * through it. `node video-safe.mjs` fails the deck if it does.
 */
export function SlideLead({
  children,
  tone = 'brand',
  icon = 'arrow',
  onDark = false,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  /** Override where a slide's point is about something more specific than direction. */
  icon?: IconName
  /**
   * For a lead drawn on the navy stage. Only the glyph and the type change; the
   * geometry does not. Every slide type that renders a lead today is
   * `variant="light"`, so nothing in the kit passes this yet — it exists so that
   * a dark-ground type carrying a lead does not have to reinvent the treatment,
   * the same way `SlideHeader` and `Kicker` already take it.
   */
  onDark?: boolean
  className?: string
}) {
  const carry = useContinuity()
  const color = accentByTone[tone]

  /*
    THE GAP BELOW THE POINT IS THIS COMPONENT'S, NOT THE LAYOUT'S.

    It was an `mb-6` written at every call site, which is both a thing to forget on
    the next one and a number with a geometric consequence no call site can see.
    The header floor is 120px, so the well opens at y=168; one line of body-lg is
    33px; this gap decides where the first row of real content lands.

    At 24px it landed at 225, nine pixels below the y=216 the old 168px header
    produced, and `align-check.mjs` caught two dense slides whose last line had
    been pushed under the control bar. 16px lands it at 217. Change this and
    re-run `node align-check.mjs`.
  */
  const GAP = 'mb-4'
  const Icon = iconByName[icon]

  const body = (
    <div className="flex max-w-3xl items-start gap-2.5">
      {/*
        `mt-[6px]` optically centres the glyph on the FIRST line rather than on the
        block: body-lg is 22px at 1.5, so its first line box is 33px and a 20px
        icon sits 6px down inside it. Centring the arrow against a wrapped
        two-line sentence would leave it floating between the lines.
      */}
      <Icon
        width={20}
        height={20}
        className="mt-[6px] shrink-0"
        style={{ color: onDark ? '#fff' : color }}
      />
      <p className={`text-body-lg ${onDark ? 'text-white/80' : 'text-body'}`}>{children}</p>
    </div>
  )

  /*
    CONTINUITY, CARRIED OVER WITH THE LEAD.

    A concept spans several slides that often repeat the same point, so replaying
    the entrance meant the same sentence flew in again on every slide of the
    concept while only the body had changed. An unchanged lead renders as a plain
    div: same markup, same position, no animation. This is the treatment
    `SlideHeader` gives an unchanged kicker, and it has to live here now, because
    this is where the lead is drawn.
  */
  if (carry.lead) return <div className={`${GAP} ${className}`}>{body}</div>

  /*
    A `RevealGroup` of its own, rather than a bare `Reveal`.

    `Reveal` reads its animation from a parent `RevealGroup`'s variants, and the
    lead no longer has one: it left the header's group behind. Without a group here
    it would mount at the group's initial state and never be told to animate, so
    the point would simply never appear. A plain wrapper `<div>` between the two
    breaks propagation the same way.

    Nesting this inside a slide type's own `RevealGroup` (`ContentNoteSlide`,
    `ProceduralStepsSlide`) is safe: it declares its own `initial`/`animate`, so it
    runs its entrance itself rather than taking a slot in the outer stagger.
  */
  return (
    <RevealGroup className={`${GAP} ${className}`}>
      <Reveal dir="up">{body}</Reveal>
    </RevealGroup>
  )
}
