import { motion } from 'framer-motion'
import { SlideBase, Kicker, NumberBadge, Illustration } from '@/ui'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { Media } from './Media'
import type { SectionBreakerImageProps } from './types'

/**
 * SECTION BREAKER (with image) — night stage, copy on the header datum and the
 * hero visual in a centred band beneath it.
 *
 * THIS LAYOUT REPLACED A TWO-COLUMN ONE, AND THE REASON IS MEASURED
 *
 * It used to put the visual in the right-hand column of a
 * `grid-cols-[1.1fr_1fr]` row, vertically centred and capped at `max-h-[24rem]`,
 * with an `h-80 w-80` blurred disc behind it. On the 1280x720 stage that landed
 * the media at x=686..1216, y=160..544 and the disc at x=791..1111, y=192..512.
 *
 * The instructor-video rectangle is x=913..1280, y=0..220. **Both intruded, on
 * every slide of this type, by 303px at worst**, and no combination of props
 * could move them: the media's height follows the asset's aspect ratio, and the
 * disc was a fixed size in this file. `video-safe.mjs` reported all five
 * dividers of the OOPs Theory session 2 deck, which is where it was found:
 *
 *     slide  5  <State>  2 hit(s), worst 303px in
 *           img @686,160 530x384   "Toggle switches, each showing its current po"
 *           surface @791,192 320x320
 *
 * `align-check.mjs` then reported the same five a second time as DRIFT, because
 * a column starting at x=686 is neither on the header's left datum nor centred
 * on the stage, which is the exact geometry that harness exists to catch. A
 * slide type that cannot pass two of the four sweeps on any content is a kit
 * defect, so this is the kit's fix rather than a per-deck workaround.
 *
 * WHY THIS SHAPE, SPECIFICALLY
 *
 *   - **The copy keeps its position.** Hard rule 19: the kicker and title are
 *     the room's answer to "where am I in this session", and a divider is the
 *     one frame whose whole job is saying that. It stays on the header datum.
 *   - **The art is centred and height-capped.** Centred on the content area's
 *     centre is one of the two verdicts `align-check.mjs` accepts, and capping
 *     the HEIGHT rather than the width is what keeps the top edge below y=220
 *     whatever aspect ratio the next asset turns out to have. A portrait asset
 *     letterboxes inside the box rather than growing past it.
 *   - **The glow is `pointer-events-none`.** It is decoration, every other
 *     decorative blob in this kit already says so, and both `qa.mjs` and
 *     `video-safe.mjs` skip that class by name for exactly this reason. It is
 *     also now small enough and low enough to be clear regardless.
 *
 * `SectionBreakerSlide` next door is unchanged and is still the right choice
 * when there is no illustration that honestly depicts the concept. Hard rule 8:
 * a blank-but-honest divider beats a misleading picture.
 */
export function SectionBreakerImageSlide({
  index,
  kicker,
  title,
  subtitle,
  tone = 'brand',
  media,
  lesson,
}: SectionBreakerImageProps) {
  return (
    <SlideBase variant="night" lesson={lesson} footer>
      <div className="flex h-full flex-col">
        <RevealGroup className="max-w-3xl" stagger={0.12}>
          {(index != null || kicker) && (
            <Reveal dir="right">
              <div className="mb-5 flex items-center gap-4">
                {index != null && <NumberBadge n={index} tone={tone} />}
                {kicker && (
                  <Kicker tone={tone} onDark>
                    {kicker}
                  </Kicker>
                )}
              </div>
            </Reveal>
          )}
          <Reveal dir="up">
            <h1 className="font-heading text-slide-title-lg font-extrabold leading-[1.05] text-white">
              {title}
            </h1>
          </Reveal>
          {subtitle && (
            <Reveal dir="up" delay={0.05}>
              <p className="mt-4 max-w-2xl text-body-xl leading-relaxed text-white/75">
                {subtitle}
              </p>
            </Reveal>
          )}
        </RevealGroup>

        {/*
          THE ART BAND, AND ITS BOX IS DECLARED RATHER THAN INFERRED.

          The art sits in a fixed 460x264 box centred on the stage. Both numbers
          are load-bearing:

            - 264 tall, centred in the band under a 168px header, puts the top
              edge at about y=240. The reserved video rectangle ends at y=220,
              so the clearance holds for any asset rather than for the one that
              happened to be passed.
            - the box is CENTRED, which is one of the two verdicts
              `align-check.mjs` accepts. The old right-hand column at x=686 was
              neither aligned nor centred and was reported as DRIFT.

          The box is declared because neither thing that can go in it has a size
          of its own to infer one from. A `SlideMedia` illustration renders a
          `Scene`, which is a relative div positioning its parts absolutely and
          collapses to nothing without a width; and an `<svg>` asset with a
          viewBox and no `width`/`height` has an intrinsic RATIO but no intrinsic
          SIZE, so it resolves to zero inside a `w-auto` flex item. The first cut
          of this fix used `w-auto` and every divider in the gallery rendered
          with no art at all, which no harness saw: an image occupying no pixels
          is not an overflow, an intrusion or a misalignment.

          So the two branches take different classes, and that is not a tidiness
          failure: `max-*` scales a raster or a sized SVG down while keeping its
          ratio, and `h-full w-full` gives a `Scene` the box it needs.
        */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center pt-4">
          <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-nw-blue/25 blur-2xl" />
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {media && 'src' in media ? (
              /*
                PIXEL CAPS, NOT `max-h-full`, AND THE DIFFERENCE IS NOT COSMETIC.

                `max-h-full` is `max-height: 100%`, a percentage that has to
                resolve against a containing block. Inside a centred grid item it
                did not, and the 745x912 portrait asset on the `this Keyword`
                divider was capped on WIDTH only: 460 wide became 563 tall and
                `qa.mjs` reported it 163px through the bottom of the frame. The
                landscape assets all happened to be capped by width first, so four
                of the five dividers looked correct and the fifth did not.

                Absolute caps cannot be mis-resolved, and with width and height
                both auto the browser scales the asset proportionally inside them.
              */
              <Media media={media} className="max-h-[264px] max-w-[460px]" />
            ) : (
              /* A `Scene` has no size of its own, so it is given the box. */
              <div className="h-[264px] w-[460px]">
                <Illustration
                  name={media && 'illustration' in media ? media.illustration : 'concept-api'}
                  className="h-full w-full"
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </SlideBase>
  )
}
