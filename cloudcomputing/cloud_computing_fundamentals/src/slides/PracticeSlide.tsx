import { motion } from 'framer-motion'
import { SlideBase, Kicker, BulletList, Illustration } from '@/ui'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import type { PracticeSlideProps } from './types'

/**
 * PRACTICE — brand stage inviting learners to build. Left column carries the
 * kicker, headline, prompt and an optional task checklist; the right column
 * spotlights Nova on a glowing pad.
 */
export function PracticeSlide({
  kicker = 'Practice',
  title = 'Time to practice!',
  prompt,
  tasks,
  lesson,
}: PracticeSlideProps) {
  return (
    <SlideBase variant="night" lesson={lesson}>
      <div className="grid h-full grid-cols-[1.15fr_1fr] items-center gap-10">
        {/* left — copy + tasks */}
        <RevealGroup className="flex flex-col" stagger={0.1}>
          <Reveal dir="up">
            <Kicker onDark>{kicker}</Kicker>
          </Reveal>
          <Reveal dir="up">
            <h1 className="mt-4 font-heading text-slide-title-lg font-extrabold leading-[1.04] text-white">
              {title}
            </h1>
          </Reveal>
          <Reveal dir="up" delay={0.05}>
            <p className="mt-4 max-w-xl text-body-xl text-white/80">{prompt}</p>
          </Reveal>
          {tasks && tasks.length > 0 && (
            <Reveal dir="up" delay={0.1}>
              <div className="mt-7 rounded-card bg-white/10 p-5 ring-1 ring-white/15">
                <BulletList items={tasks} tone="nw" marker="play" onDark />
              </div>
            </Reveal>
          )}
        </RevealGroup>

        {/* right — mascot on a glowing pad */}
        <motion.div
          className="relative grid h-full place-items-end justify-items-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="absolute h-64 w-64 rounded-full bg-nw-blue/40 blur-3xl" />
          <Illustration name="practice" className="char-lift relative h-[60%] w-auto" float />
        </motion.div>
      </div>
    </SlideBase>
  )
}
