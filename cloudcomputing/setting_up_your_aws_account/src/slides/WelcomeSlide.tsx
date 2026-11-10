import { motion } from 'framer-motion'
import { SlideBase } from '@/ui/SlideBase'
import { Logo } from '@/ui/Logo'
import { Illustration } from '@/ui/characters/Illustration'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { Chip } from '@/ui/primitives'
import type { WelcomeSlideProps } from './types'

/**
 * WELCOME — the opening hero. Night gradient stage, mascot waving, big
 * course/lesson title, presenter + meta.
 */
export function WelcomeSlide({
  course,
  title,
  subtitle,
  presenter,
  meta,
  lesson,
  minimal = false,
}: WelcomeSlideProps) {
  if (minimal) {
    // Bare-body hero: kicker + session name only. The footer carries the one
    // logo — nothing else competes with the session name.
    return (
      <SlideBase variant="night" lesson={lesson} footer>
        <RevealGroup className="relative z-10 flex h-full flex-col items-center justify-center text-center" stagger={0.12}>
          {/* THE UPDATED TEMPLATE'S SESSION NAME (user, 2026-10-12; the base template
              since 2026-10-14): the template's section-breaker type, the kicker in
              DM Sans at 72% white, the name in Sora SemiBold 67px (101px on the 1920
              frame); the closing gradient and its rings come from the frame. The
              reveals are the kit's. The kicker follows the header kicker: 22px title
              case at 0.02em (`text-kicker`), was 15px capitals at 0.16em. */}
          <Reveal dir="up">
            <p data-kicker className="mb-4 font-tpl-body text-kicker text-white/70">
              Welcome to Today’s Session
            </p>
          </Reveal>
          <Reveal dir="up">
            <h1 className="max-w-4xl font-tpl-title text-[67px] font-semibold leading-[1.05] text-white">
              {title}
            </h1>
          </Reveal>
        </RevealGroup>
      </SlideBase>
    )
  }

  return (
    <SlideBase variant="night" lesson={lesson} footer>
      <div className="relative z-10 grid h-full grid-cols-[1.35fr_1fr] items-center gap-8">
        {/* left — copy */}
        <RevealGroup className="max-w-2xl" stagger={0.1}>
          <Reveal dir="right">
            <div className="mb-6 flex items-center gap-3">
              <Logo className="h-8" onDark />
              {course && (
                <Chip tone="nw" className="!bg-white/10 !text-white">
                  {course}
                </Chip>
              )}
            </div>
          </Reveal>
          <Reveal dir="up">
            <p className="mb-2 text-kicker text-white/70">Welcome to Today’s Session</p>
          </Reveal>
          <Reveal dir="up">
            <h1 className="font-heading text-hero font-extrabold leading-[1.02] text-white">
              {title}
            </h1>
          </Reveal>
          {subtitle && (
            <Reveal dir="up" delay={0.05}>
              <p className="mt-5 max-w-xl text-body-xl text-white/75">{subtitle}</p>
            </Reveal>
          )}
          {(presenter || meta) && (
            <Reveal dir="up" delay={0.1}>
              <div className="mt-8 flex items-center gap-4 text-body-sm text-white/60">
                {presenter && (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/70" />
                    {presenter}
                  </span>
                )}
                {meta && <span>{meta}</span>}
              </div>
            </Reveal>
          )}
        </RevealGroup>

        {/* right — mascot */}
        <motion.div
          className="relative grid h-full place-items-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="absolute h-72 w-72 rounded-full bg-nw-blue/30 blur-2xl" />
          <Illustration name="nova-wave" className="relative h-[26rem] w-auto" />
        </motion.div>
      </div>
    </SlideBase>
  )
}
