import { motion } from 'framer-motion'
import { SlideBase } from '@/ui/SlideBase'
import { TPL, glassPill, heroSlab } from '@/design/ground'
import { fonts } from '@/design/tokens'
import type { BrandSlideProps } from './types'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * BRAND — the deck opener: the NxtWave mark and a welcome, nothing else.
 *
 * THE UPDATED TEMPLATE'S OPENER (user, 2026-10-12; the base template since
 * 2026-10-14). The frame is the template's
 * welcome slide (`updated_template/src/slides/WelcomeSlide.tsx`): the mesh
 * ground with its two rings, the mark reversed to white and centred with its
 * top at y=177 (266 on the 1920 frame), and the word in a glass pill centred
 * on y=458 (687 there), set in Sora SemiBold. The kit's own ground furniture
 * (the drifting discs, the star field, the vignette, the wave layers, the
 * rule under the word) went with the old ground.
 *
 * WHAT STAYS is the word's motion: the welcome arrives letter by letter in
 * its pill. The mark is STATIC (user, 2026-10-12): its entrance,
 * its float, the two halo rings and the four sparkles are deleted, not
 * hidden, so the frame holds exactly the reference's elements: the ground
 * with its two rings, the mark, the pill.
 */
export function BrandSlide({ greeting = 'Welcome!', lesson }: BrandSlideProps) {
  const letters = greeting.split('')
  const slab = heroSlab(TPL.heroWelcome)
  return (
    <SlideBase variant="night" ground="mesh" footer={Boolean(lesson)} footerLogo={false} lesson={lesson} padded={false}>
      {/* the mark, white, centred at the template's height; static */}
      <div className="absolute inset-x-2 flex justify-center" style={{ top: TPL.welcomeLogoTop }}>
        <img
          src="/assets/logo-nxtwave.png"
          alt="NxtWave"
          draggable={false}
          className="relative block select-none"
          style={{ width: TPL.heroLogoWidth, height: 'auto', filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* the welcome, in the template's glass pill, letter by letter */}
      <div
        className="absolute inset-x-2 flex justify-center"
        style={{ top: TPL.welcomeSlabCenter - Number(slab.height) / 2 }}
      >
        <motion.div
          style={{ ...glassPill, ...slab }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
        >
          <h1
            className="whitespace-nowrap leading-none text-white"
            style={{ fontFamily: fonts.tplTitle, fontWeight: 600, fontSize: TPL.heroWelcome }}
            aria-label={greeting}
          >
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 34, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.55 + i * 0.055, duration: 0.55, ease: EASE }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </h1>
        </motion.div>
      </div>
    </SlideBase>
  )
}
