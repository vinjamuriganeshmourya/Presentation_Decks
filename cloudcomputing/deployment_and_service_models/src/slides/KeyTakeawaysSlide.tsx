import { motion } from 'framer-motion'
import { SlideBase, ZonedFrame, BulletList, Illustration } from '@/ui'
import type { KeyTakeawaysSlideProps } from './types'

/**
 * KEY TAKEAWAYS — closing recap. Star-marked accent bullets on the left,
 * Nova having an idea on the right over a soft brand glow.
 */
export function KeyTakeawaysSlide({
  kicker = 'Key Takeaways',
  title = 'Key takeaways',
  lead,
  points,
  lesson,
}: KeyTakeawaysSlideProps) {
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      {/* left: the takeaways, ZONED (content rule 32). The body box is narrowed
          to the old left column (1.3fr of 1152 less the 48px gap) so the list
          never runs under the mascot. */}
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone="nw" bodyWidth={624}>
        <BulletList items={points} marker="star" tone="nw" />
      </ZonedFrame>

        {/* right — mascot with soft glow */}
        {/* right: the mascot, in exactly the box its grid column used to give it
            (x 736..1216, y 48..656), so it renders where it always did. */}
        <motion.div
          className="absolute grid place-items-end justify-items-center"
          style={{ left: 736, top: 48, width: 480, height: 608 }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="absolute h-64 w-64 rounded-full bg-nw-blue/10 blur-2xl" />
          <Illustration name="nova-idea" className="relative h-[60%] w-auto" />
        </motion.div>
    </SlideBase>
  )
}
