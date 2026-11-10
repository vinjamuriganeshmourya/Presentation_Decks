import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { BulletList } from '@/ui/content'
import { Callout } from '@/ui/Callout'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import type { ContentNoteSlideProps } from './types'
import { SLIDE_FAMILY } from '@/motion/continuity'

/**
 * CONTENT WITH A NOTE — header (+optional bullets) up top, with an emphasized
 * Callout anchored to the lower area as the key takeaway.
 */
export function ContentNoteSlide({
  kicker,
  title,
  lead,
  points,
  /**
   * Render the note ABOVE the points. Used where the note is the definition being
   * taught and the points are supporting evidence for it, so the thing being
   * defined should be read first.
   */
  noteFirst = false,
  tone = 'brand',
  note,
  children,
  lesson,
}: ContentNoteSlideProps) {
  const noteBlock = (
    <Callout
      kind={note.kind}
      title={note.title}
      icon={note.icon}
      className="max-w-none text-body-lg shadow-card ring-1 ring-black/[0.04]"
    >
      {note.body}
    </Callout>
  )
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      {/*
        ZONED (content rule 32). The header zone carries the kicker and title,
        the lead opens the body box, and the body group (points, children, note)
        is centred in C.png's band on y=434 by `ZonedFrame`. That replaced a
        `pb-20` bias and paired auto margins, which centred the group in whatever
        height the header happened to leave.

        The blocks share ONE `RevealGroup` with no wrapper between it and its
        `Reveal`s: a plain div there breaks framer's variant propagation and
        kills the stagger.
      */}
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        <RevealGroup className="flex flex-col" stagger={0.1}>
          {/* `noteFirst` puts the definition being taught above its evidence. */}
          {noteFirst && <Reveal dir="up">{noteBlock}</Reveal>}

          {points && (
            <Reveal dir="up" className={noteFirst ? 'mt-10' : undefined}>
              <BulletList items={points} tone={tone} />
            </Reveal>
          )}

          {children && (
            <Reveal dir="up" className={points || noteFirst ? 'mt-6' : undefined}>
              {children}
            </Reveal>
          )}

          {!noteFirst && (
            <Reveal dir="up" className={points || children ? 'mt-10' : undefined}>
              {noteBlock}
            </Reveal>
          )}
        </RevealGroup>
      </ZonedFrame>
    </SlideBase>
  )
}

/*
  Part of the light content family: these layouts can flow into one another
  inside a concept, so `SlideHeader` holds an unchanged kicker still instead of
  replaying its entrance. See `src/motion/continuity.ts`.
*/
ContentNoteSlide.family = SLIDE_FAMILY.content
