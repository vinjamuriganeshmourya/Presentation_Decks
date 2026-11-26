import { motion } from 'framer-motion'
import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { BulletList } from '@/ui/content'
import { Media } from './Media'
import type { ContentImageSlideProps } from './types'
import { SLIDE_FAMILY } from '@/motion/continuity'

type Position = 'left' | 'right' | 'top' | 'bottom'

/** Framed media block with entrance animation. */
function MediaFrame({
  media,
  caption,
  className = '',
}: Pick<ContentImageSlideProps, 'media' | 'caption'> & { className?: string }) {
  const isIllustration = 'illustration' in media
  return (
    <motion.figure
      className={`relative flex flex-col ${className}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`relative flex-1 overflow-hidden rounded-card ${
          isIllustration
            ? 'grid place-items-center bg-brand-soft p-6'
            : 'bg-white shadow-card ring-1 ring-line'
        }`}
      >
        <span className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-2xl bg-accent-500/15" />
        <Media
          media={media}
          className={isIllustration ? 'h-full max-h-full w-auto' : 'h-full w-full'}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-body-sm text-body">{caption}</figcaption>
      )}
    </motion.figure>
  )
}

/**
 * THE HEADER IS OUTSIDE THE COLUMN LAYOUT, AND THAT IS THE POINT.
 *
 * The concept (`kicker`) and its sub-concept (`title`) sit at the slide's own
 * top-left datum on EVERY content slide, whatever the media is doing. They are
 * the room's answer to "where am I in this session", and an answer that moves
 * between slides is not an answer.
 *
 * It did move. The header used to live INSIDE the text column, so:
 *
 *   - `ContentLeftImageSlide` started its header at x=664, six hundred pixels
 *     right of where the previous slide's header was
 *   - `ContentTopImageSlide` put the media above the header, so the concept
 *     name appeared roughly halfway down the slide, after the picture
 *
 * `align-check.mjs` measures every slide against "the header left edge" as its
 * datum and had been reporting both as DRIFT for several sessions. The finding
 * was real and this is the fix: one header, one position, and the media and the
 * points arrange themselves in the well underneath it.
 *
 * So `left` / `right` / `top` / `bottom` now name where the media sits relative
 * to the POINTS, never relative to the header.
 *
 * ZONED (content rule 32), in `fill` mode. The media is sized as a percentage
 * of the well, so the well needs a definite height: it is exactly C.png's band,
 * y 221..647, less the lead. That band starts at the instructor-video
 * rectangle's floor, which retired the 52px lead-less guard this used to carry
 * for a right-hand or top media.
 */
function ContentWithImage({
  position,
  kicker,
  title,
  lead,
  points,
  tone = 'brand',
  media,
  caption,
  children,
  lesson,
}: ContentImageSlideProps & { position: Position }) {
  const body = (
    <div className="flex min-h-0 flex-col justify-center">
      {points && <BulletList items={points} tone={tone} immediate />}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )

  const horizontal = position === 'left' || position === 'right'
  const mediaFirst = position === 'left' || position === 'top'

  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone} mode="fill">

        {horizontal ? (
          /* `grid-rows-1` pins the one row to the well's definite height. Without
             it the row sizes to the media's own content, the media's 86%
             resolves against that, and the figure overran the band by 21px. */
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-1 items-center gap-12">
            {mediaFirst ? (
              <>
                <MediaFrame media={media} caption={caption} className="h-[86%]" />
                {body}
              </>
            ) : (
              <>
                {body}
                <MediaFrame media={media} caption={caption} className="h-[86%]" />
              </>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            {mediaFirst ? (
              <>
                <MediaFrame media={media} caption={caption} className="h-[46%] shrink-0" />
                <div className="flex min-h-0 flex-1 flex-col justify-center">{body}</div>
              </>
            ) : (
              <>
                <div className="flex min-h-0 flex-1 flex-col justify-center">{body}</div>
                <MediaFrame media={media} caption={caption} className="h-[46%] shrink-0" />
              </>
            )}
          </div>
        )}
      </ZonedFrame>
    </SlideBase>
  )
}

export const ContentLeftImageSlide = (p: ContentImageSlideProps) => (
  <ContentWithImage position="left" {...p} />
)
export const ContentRightImageSlide = (p: ContentImageSlideProps) => (
  <ContentWithImage position="right" {...p} />
)
export const ContentTopImageSlide = (p: ContentImageSlideProps) => (
  <ContentWithImage position="top" {...p} />
)
export const ContentBottomImageSlide = (p: ContentImageSlideProps) => (
  <ContentWithImage position="bottom" {...p} />
)

/*
  Part of the light content family: these layouts can flow into one another
  inside a concept, so `SlideHeader` holds an unchanged kicker still instead of
  replaying its entrance. See `src/motion/continuity.ts`.
*/
ContentLeftImageSlide.family = SLIDE_FAMILY.content
ContentRightImageSlide.family = SLIDE_FAMILY.content
ContentTopImageSlide.family = SLIDE_FAMILY.content
ContentBottomImageSlide.family = SLIDE_FAMILY.content
