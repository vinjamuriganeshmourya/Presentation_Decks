import { motion } from 'framer-motion'
import { SlideBase } from '@/ui'
import { colors, fonts } from '@/design/tokens'
import { Card, BOX_W } from './scene'

/**
 * SECOND LAYOUTS FOR REVIEW (user, 2026-10-28): agenda1, quiz1 and feedback1,
 * built beside the deck's current agenda, quiz and feedback frames so the
 * user can compare the pairs and delete one of each. Designs (read only):
 * `slidestraining/agendaslides` (`Agenda_finaloutput.png`),
 * `slidestraining/quizslide` (`Slide 16_9 - 108.png`, the cube `image 44931.png`),
 * `slidestraining/Feedbackslide` (`Slide 16_9 - 110.png`, the art `image 44932.png`).
 * Measured on the 1920 x 1080 designs and scaled by 2/3 to this 1280 x 720 deck.
 *
 * Session-local for now: if the user keeps a layout it becomes a kit slide type
 * through a PR (generate-slides section 6).
 */

const EASE = [0.22, 1, 0.36, 1] as const

/* ------------------------------------------------------------------ agenda1 */

/**
 * The kit header (session as the kicker, `Agenda` as the title), then the
 * items as equal columns: a two-digit number in brand blue, the title in bold
 * ink, the line under it in ink; a thin vertical brand rule fading at both ends
 * on the left of every column but the first.
 */
export function AgendaColumns({ lesson, kicker, items }: { lesson: string; kicker: string; items: { title: string; sub?: string }[] }) {
  const gap = 0
  const w = Math.floor((BOX_W - gap * (items.length - 1)) / items.length)
  return (
    <Card id="agenda-columns" kicker={kicker} title="Agenda" lesson={lesson}>
      <ol className="flex items-stretch" style={{ width: BOX_W }}>
        {items.map((it, i) => (
          <motion.li
            key={it.title}
            className="relative flex flex-col"
            style={{ width: w, paddingLeft: i === 0 ? 0 : 20, paddingRight: 16 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: EASE }}
          >
            {i > 0 && (
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-px"
                style={{ background: `linear-gradient(180deg, ${colors.brandDark} 0%, ${colors.brand} 55%, rgba(45,99,251,0) 100%)` }}
              />
            )}
            <span className="font-heading text-[40px] font-normal leading-none" style={{ color: colors.brandDark }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="mt-6 font-heading text-[22px] font-bold leading-[1.3]" style={{ color: colors.ink }}>
              {it.title}
            </span>
            {it.sub && (
              <span className="mt-3 text-[16px] leading-[1.45]" style={{ color: colors.ink }}>
                {it.sub}
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </Card>
  )
}

/* ------------------------------------------------------------------ quiz1 and feedback1 */

/**
 * The shared frame of quiz1 and feedback1: the closing gradient with its rings
 * (the kit's `night` ground, the design's blue), one illustration centred with
 * its top at y 138, the word in white Sora under it, its centre on y 528
 * (207 and 792 on the 1920 design), the mark reversed to white in the footer.
 */
function TitleCard({ art, artW, title, id }: { art: string; artW: number; title: string; id: string }) {
  return (
    <SlideBase variant="night" padded={false}>
      <div data-slide-id={id} className="absolute inset-x-0 flex flex-col items-center" style={{ top: 138 }}>
        <motion.img
          src={art}
          alt=""
          draggable={false}
          className="block select-none"
          style={{ width: artW, height: 'auto' }}
          initial={{ opacity: 0, scale: 0.86, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.34, 1.4, 0.64, 1] }}
        />
      </div>
      <motion.h2
        className="absolute inset-x-0 text-center leading-none text-white"
        style={{ top: 528 - 40, fontFamily: fonts.tplTitle, fontWeight: 600, fontSize: 80 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
      >
        {title}
      </motion.h2>
    </SlideBase>
  )
}

/** quiz1: the yellow question cube (267 px wide, 400 on the 1920 design) over `Quiz Time`. */
export function QuizCard({ lesson, title = 'Quiz Time' }: { lesson: string; title?: string }) {
  void lesson
  return <TitleCard id="quiz-card" art="/assets/quiz/quiz-cube.png" artW={267} title={title} />
}

/** feedback1: the rating bubble with three faces (474 px wide, 711 on the 1920 design) over `Feedback`. */
export function FeedbackCard({ lesson }: { lesson: string }) {
  void lesson
  return <TitleCard id="feedback-card" art="/assets/feedback/feedback-rating.png" artW={474} title="Feedback" />
}
