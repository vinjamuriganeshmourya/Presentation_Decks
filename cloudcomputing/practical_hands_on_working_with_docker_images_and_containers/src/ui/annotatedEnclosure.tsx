import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { spanBox } from './annotatedOutput'
import { BOX_TONE, litBadge, type BoxTone } from './annotatedSurface'

/**
 * THE ENCLOSURE — a box drawn around the lines that belong together, IN PLACE,
 * with its label carried on the box's own edge.
 *
 * WHY THIS SHAPE, in the reviewer's words: *"it better highlight as box
 * included the required content instead of doing from the end."*
 *
 * The claim on session 6 slide 30 is *"count the lines between the first and the
 * last"*, which is a sentence about a GROUP. A box is the only form that states
 * a group without the reader doing any pairing work: the lines inside it are the
 * ones being talked about, and that is legible before a single word is read. A
 * numbered legend under the panel and a leader line out to a margin caption both
 * annotate from OUTSIDE, and both ask the eye to leave the output, read a label,
 * and carry it back.
 *
 * IT ALSO SOLVES THE `Mounted from` TRAP STRUCTURALLY RATHER THAN VERBALLY. A
 * box around the three `Pushed` lines VISIBLY EXCLUDES
 * `b7f7d2967507: Mounted from library/python`, which was not uploaded. A legend
 * can only assert that distinction in prose and hope the room maps it back to
 * the right line.
 *
 * THREE THINGS THIS COMPONENT HAS TO GET RIGHT.
 *
 * ONE, THE TEXT STAYS READABLE. The box paints OVER the panel, because
 * `Terminal` draws its own opaque ground and nothing can be slipped behind it.
 * So the fill is a 10% tint, which reads as a selection highlight and leaves the
 * monospace at full contrast. The job is to group the lines, not to tint them
 * into a different colour of text.
 *
 * TWO, IT IS LIT. `STYLE_GUIDE.md` section 9, adapted to a dark ground: the
 * highlight is a white radial parked top-left, the hairlines are white along the
 * top edge and the accent along the bottom. A flat 2px rectangle is a region,
 * not an object.
 *
 * THREE, EVERY BOX CARRIES A LABEL AND A NAMED TONE, NEVER A COLOUR.
 *
 * `tone` is `primary` or `secondary`, and the map behind it holds only
 * non-verdict hues. Two boxes in one panel must be different colours, because
 * the reviewer asked for it and because two boxes of one hue cannot be told
 * apart from the back of a room; but colour is never the ONLY difference, since
 * the label is a required prop. That is `StatusList`'s discipline — a verdict
 * there carries an icon AND a word — and it is what makes the distinction
 * survive a greyscale projector.
 *
 * FOUR, THE LABEL IS OPAQUE. `comparison-lab` recorded this one: `CallerView`'s
 * pill started at an 8% tint, the boundary rule ran straight through the words,
 * and it read as struck through. A label that sits ON a rule must mask it, so
 * the pill here is a solid lit surface.
 */

export function Enclosure({
  /** Flat-line indexes this box encloses, inclusive. */
  from,
  to,
  fontSize,
  total,
  /**
   * `primary` or `secondary`. A NAME, not a colour: the map behind it holds no
   * verdict hue, so a box cannot accidentally tell the room that a line failed.
   */
  tone = 'primary',
  /** The label on the box's edge. REQUIRED: colour is never the only cue. */
  label,
  /**
   * `solid` is the group being claimed; `dashed` is a group being excluded, and
   * the dash is doing real work — a solid box in a second colour still reads as
   * a peer of the first one.
   */
  stroke = 'solid',
  children,
}: {
  from: number
  to: number
  fontSize: number
  total: number
  tone?: BoxTone
  label: ReactNode
  stroke?: 'solid' | 'dashed'
  children?: ReactNode
}) {
  const accent = BOX_TONE[tone]
  const box = spanBox(fontSize, total, from, to)
  return (
    <div
      className="pointer-events-none absolute rounded-md"
      style={{
        /* Inset inside `Terminal`'s own `px-4` body padding, so the box has 8px
           of air between its edge and the first character of the output. */
        left: 8,
        right: 8,
        /* 1px in from the line box top and bottom, so two enclosures on
           adjacent lines cannot share a pixel and read as one box. */
        bottom: box.bottom + 1,
        height: box.height - 2,
        border: `2px ${stroke} ${accent}`,
        background: [
          'radial-gradient(120% 100% at 10% 0%, #FFFFFF1f 0%, #FFFFFF00 64%)',
          `linear-gradient(135deg, ${accent}1a 0%, ${accent}14 100%)`,
        ].join(', '),
        boxShadow:
          stroke === 'solid'
            ? ['inset 0 1px 0 0 #FFFFFF29', `inset 0 -1px 0 0 ${accent}66`].join(', ')
            : 'none',
      }}
    >
      {/* THE LABEL, on the box's own right edge and inside the panel, so the eye
          never leaves the output to read it. The output lines here are ~20
          characters, so the right half of every enclosure is empty ground and
          the label costs the transcript nothing. */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">{label}</div>
      {children}
    </div>
  )
}

/**
 * The label an enclosure carries. Never smaller than `body-sm`, which is the
 * kit's smallest body token: a label that names a group of output lines cannot
 * be harder to read than the output.
 *
 * TWO FILLS, AND THE CHOICE IS FORCED BY THE BOX'S HEIGHT, not by taste. A
 * solid pill is 34px tall and one output line is 23px, so a pill on a
 * SINGLE-LINE enclosure bursts out through the box's own border in both
 * directions. The first render of `TwoEnclosures` did exactly that and the two
 * dashed outlines collided into something that read as a rendering fault.
 *
 * So `quiet` is the fill for a one-line box: the same 16px, the same accent, set
 * as bare bold text with no chrome of its own to overflow. It is also the right
 * register for a group being EXCLUDED, which is what a one-line box has so far
 * always been.
 */
export function EnclosureLabel({
  tone = 'primary',
  children,
  fill = 'solid',
}: {
  tone?: BoxTone
  children: ReactNode
  /** `quiet` is the excluded group: the same size, in outline rather than fill. */
  fill?: 'solid' | 'quiet'
}) {
  const accent = BOX_TONE[tone]
  if (fill === 'quiet') {
    return (
      <span
        className="font-heading text-body-sm font-bold leading-none"
        style={{ color: accent, textShadow: `0 1px 2px ${colors.night}` }}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      className="rounded-pill px-3.5 py-1.5 font-heading text-body-sm font-bold leading-none"
      style={litBadge(accent)}
    >
      {children}
    </span>
  )
}
