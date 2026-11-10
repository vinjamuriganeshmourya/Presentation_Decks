import { motion } from 'framer-motion'
import { SlideBase } from '@/ui'
import { Reveal } from '@/motion/Reveal'
import { Media } from './Media'
import type { OnlyImageSlideProps } from './types'

/**
 * ONLY IMAGE — a full-bleed figure that owns the slide. Plain stage, no decor.
 * Optional small title (top-left) and centered caption below the framed media.
 */
export function OnlyImageSlide({ media, title, caption, lesson }: OnlyImageSlideProps) {
  const isIllustration = 'illustration' in media

  return (
    <SlideBase variant="plain" decor={false} footer lesson={lesson}>
      <div className="flex h-full flex-col">
        {title && (
          <Reveal
            dir="down"
            as="h2"
            className="mb-5 font-heading text-slide-title font-bold leading-tight text-ink"
          >
            {title}
          </Reveal>
        )}

        <motion.figure
          className="flex min-h-0 flex-1 flex-col items-center"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className={`relative min-h-0 w-full max-w-4xl flex-1 ${
              isIllustration
                ? 'grid place-items-center'
                : 'flex items-center justify-center overflow-hidden rounded-card bg-white shadow-card ring-1 ring-line'
            }`}
          >
            {!isIllustration && (
              <span className="pointer-events-none absolute -right-3 -top-3 z-10 h-16 w-16 rounded-2xl bg-accent-500/15" />
            )}
            <Media
              media={media}
              className={isIllustration ? 'max-h-full w-auto' : 'h-full w-full'}
            />
          </div>

          {caption && (
            <figcaption className="mt-4 max-w-3xl text-center text-body-sm text-body">
              {caption}
            </figcaption>
          )}
        </motion.figure>
      </div>
    </SlideBase>
  )
}
