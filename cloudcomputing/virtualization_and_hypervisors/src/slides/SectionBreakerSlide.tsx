import { motion } from 'framer-motion'
import { SlideBase } from '@/ui/SlideBase'
import { Kicker } from '@/ui/primitives'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { useInstant } from '@/motion/instant'
import { easing } from '@/design/tokens'
import type { SectionBreakerProps } from './types'

/**
 * SECTION BREAKER — a vertically centered divider between deck chapters.
 * A huge translucent section index sits behind the kicker + title, giving the
 * transition a confident, editorial feel. No media.
 */
export function SectionBreakerSlide({
  index,
  kicker,
  title,
  subtitle,
  /**
   * Optional brand mark shown above the title, for a section named after a tool.
   * This stage is brand blue, so pass the WHITE variant of any logo. Docker's
   * guidelines allow the white mark and forbid recolouring, so use their asset
   * rather than tinting the blue one.
   */
  mark,
  markAlt = '',
  tone = 'nw',
  lesson,
}: SectionBreakerProps) {
  const indexLabel =
    typeof index === 'number' ? String(index).padStart(2, '0') : index

  /*
    Ctrl+left/right jumps mount every slide at its final state. `Reveal` and
    `RevealGroup` already honour that; the four raw `motion` elements below did
    not, so on a jump the mark was the only thing on a still slide still sailing
    in. That was survivable at 1.5s and is not at 2.5s, which is why the guard
    goes in on the same change that lengthens the entrance.
  */
  const instant = useInstant()

  return (
    <SlideBase variant="night" lesson={lesson} footer>
      <div className="relative grid h-full place-items-center text-center">
        {indexLabel != null && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute select-none font-heading text-[200px] font-extrabold leading-none text-white/15"
            /*
              The numeral is centred on the slide, and so is the text group, which
              is exactly where a mark would land on top of it. Nudging the numeral
              down by roughly half the mark's block height seats it behind the
              TITLE instead, which is how a markless divider already reads.
            */
            style={{ marginTop: mark ? 76 : 0 }}
            initial={instant ? false : { opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: easing.soft }}
          >
            {indexLabel}
          </motion.span>
        )}

        <RevealGroup className="relative z-10 flex flex-col items-center" stagger={0.18}>
          {mark && (
            /*
              MARK ENTRANCE
              The mark sails in from the left and settles, echoing the thing it
              stands for: a loaded ship arriving rather than a logo appearing. A
              halo swells behind it once, on the same beat it lands, to seat it
              against the flat brand field.

              The motion runs ONCE and stops. A divider is on screen while the
              presenter is talking, and a looping mark would keep pulling the
              room's eye back to it.
            */
            <motion.div className="relative mb-6 grid place-items-center">
              <motion.span
                aria-hidden
                className="pointer-events-none absolute h-52 w-52 rounded-full bg-white/20 blur-2xl"
                initial={instant ? false : { opacity: 0, scale: 0.35 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 2.4, ease: easing.soft }}
              />
              <motion.img
                /* Not scaled below 24px and never recolored or cropped, per the
                   logo owner's usage guidelines. */
                src={mark}
                alt={markAlt}
                draggable={false}
                className="relative h-20 w-auto select-none"
                initial={instant ? false : { opacity: 0, x: -110, y: 0, scale: 0.82 }}
                animate={{ opacity: 1, x: 0, y: [0, -10, 0], scale: 1 }}
                /*
                  A SECOND LONGER, AND FURTHER, ON THE HOUSE CURVE.

                  Every leg gains 1s over the original timing. The travel went
                  from 70px to 110px and the bob from 6px to 10px on the same
                  change: stretching a short glide only makes it look slow, so
                  the distance grows with the duration and the mark reads as
                  moving deliberately rather than dawdling. `easing.soft` is the
                  deck's house curve and lands softer than the sharper expo this
                  used before, which is where the smoothness comes from.
                */
                transition={{
                  delay: 0.1,
                  opacity: { duration: 1.9, ease: 'easeOut' },
                  x: { duration: 2.5, ease: easing.soft },
                  scale: { duration: 2.5, ease: easing.soft },
                  /* the bob rides out the tail of the glide, so the mark keeps
                     drifting for a moment after it has arrived */
                  y: { duration: 2.8, times: [0, 0.6, 1], ease: 'easeInOut' },
                }}
              />
            </motion.div>
          )}
          {kicker && (
            <Reveal dir="up" className="mb-4 inline-block">
              {/* The updated template (base template since 2026-10-14): DM Sans kicker, Sora title at the template's section-title size (101px on 1920 = 67px here), the same as the session-name slide: one size per slide type. */}
              <Kicker tone={tone} onDark className="font-tpl-body">
                {kicker}
              </Kicker>
            </Reveal>
          )}
          <Reveal dir="up">
            <motion.h2
              className="font-tpl-title text-[67px] font-semibold leading-[1.05] text-white"
              initial={instant ? false : { opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 1.1, ease: easing.soft }}
            >
              {title}
            </motion.h2>
          </Reveal>
          {subtitle && (
            <Reveal dir="up" delay={0.08}>
              <p className="mx-auto mt-5 max-w-3xl text-body-xl text-white/75">{subtitle}</p>
            </Reveal>
          )}
        </RevealGroup>
      </div>
    </SlideBase>
  )
}
