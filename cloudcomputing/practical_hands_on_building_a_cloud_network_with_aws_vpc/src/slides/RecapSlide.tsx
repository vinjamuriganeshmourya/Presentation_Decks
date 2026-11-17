import { motion } from 'framer-motion'
import { SlideBase, ZonedFrame, BulletList, Illustration } from '@/ui'
import type { RecapSlideProps } from './types'

/**
 * RECAP — a warm, quick-to-scan reminder of the previous session.
 * Success-toned checklist on the left (splits into two columns when long),
 * friendly mascot on the right.
 */
export function RecapSlide({
  kicker = 'Recap',
  title = 'Before we begin…',
  points,
  immediate = false,
  lesson,
}: RecapSlideProps) {
  const twoCols = points.length > 4
  const mid = Math.ceil(points.length / 2)
  const columns = twoCols ? [points.slice(0, mid), points.slice(mid)] : [points]

  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
        {/*
          left: the recap checklist, ZONED (content rule 32). The header sits in
          the header zone like every other content slide, so the heading does not
          jump between slides, and the list is centred in the body box. The box is
          narrowed to the old left column (1.3fr of 1152 less the 40px gap) so the
          list never runs under the mascot.
        */}
        <ZonedFrame kicker={kicker} title={title} tone="brand" bodyWidth={628}>
          <div className={`grid gap-x-10 gap-y-0 ${twoCols ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {columns.map((group, i) => (
              <BulletList key={i} items={group} marker="check" tone="success" immediate={immediate} />
            ))}
          </div>
        </ZonedFrame>

        {/*
          right — mascot

          BOTTOM ALIGNED, AND SMALLER THAN IT LOOKS LIKE IT SHOULD BE.
          This column straddles x=913, which is the left edge of the reserved
          instructor-video rectangle (x 913..1280, y 0..220). Centred at h-[78%]
          the mascot's head reached y≈115 and `video-safe.mjs` reported it 372px
          into the reserved area. Pinning the figure to the floor and capping it
          at 66% puts its top at roughly y=243, clear of the rectangle with room
          to spare. Do not re-centre it: the mascot is the only element in the
          kit tall enough to reach up there, and the harness is the only thing
          that would notice.
        */}
        <motion.div
          className="absolute grid place-items-end justify-items-center"
          style={{ left: 732, top: 48, width: 484, height: 608 }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="pointer-events-none absolute bottom-8 h-56 w-56 rounded-full bg-success/15 blur-2xl" />
          <Illustration name="recap" className="relative h-[66%] w-auto" />
        </motion.div>
    </SlideBase>
  )
}
