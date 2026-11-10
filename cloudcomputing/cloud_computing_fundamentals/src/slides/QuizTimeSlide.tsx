import { motion } from 'framer-motion'
import { SlideBase, ZonedFrame } from '@/ui'
import { useInstant } from '@/motion/instant'
import type { QuizTimeSlideProps } from './types'

/**
 * QUIZ TIME — an announcement frame, not a question frame.
 *
 * This slide carries no question, no options and no answer. It exists to mark
 * the switch from "listen" to "answer", so the room looks up before anything is
 * asked. The question itself is asked from the quiz tool, which means the deck
 * never holds a second copy of it that can drift out of sync, and no answer is
 * ever sitting on a slide the room has already seen.
 *
 * LAYOUT
 * Two halves on one shared centre line: the announcement on the left, the
 * character on the right, each vertically centred in its own half. Nothing is
 * placed by eye. The character sits on a soft disc that anchors it to the
 * composition, rather than floating free in the corner.
 *
 * The character is given an EXPLICIT width. `Illustration name="quiz"` renders
 * an absolutely-positioned scene (question mark right, character left), so a
 * `w-auto` box collapses to zero width and the two pieces pile onto the same
 * spot, which is what made the art read as randomly scattered. The box below
 * fixes both width and height, so the scene composes the way it was drawn.
 */

const EASE = [0.16, 1, 0.3, 1] as const
/** Overshoots slightly, so a layer lands with a bit of weight instead of easing to a stop. */
/** The stage the character stands on: sized once, reused by the disc behind it. */
const STAGE_W = 540
const STAGE_H = 400

/**
 * THE FIGURE, IN FOUR LAYERS, ENTERING AS ONE.
 *
 * The art is one Canva illustration, but it is shipped as four separately keyed
 * PNGs — brain, bulb, bubble, question mark — that share ONE canvas. Because
 * every file is the same size and the same crop, stacking them with
 * `absolute inset-0` recomposes the original exactly; nothing has to be
 * positioned by hand, and nothing drifts when the stage is resized. That is the
 * only reason the split still exists.
 *
 * IT USED TO BE A SEQUENCE, AND IS NOT ANY MORE. Each layer had its own delay
 * and its own `from` offset, so the scene told a four-beat story: the brain is
 * there, a question arrives, the mark pops, the idea lights up. Four beats over
 * roughly 2.2s is a long time to hold a room on a slide whose entire message is
 * the two words in the heading, and the layers were arriving out of stacking
 * order, so the bulb appeared to slide out from behind the bubble. The figure
 * now enters as one composed image, carried by its stage container, which is
 * the single animation on this half of the slide.
 *
 * `z` is stacking order and is all these entries still need to carry.
 */
const LAYERS = [
  { key: 'brain', src: '/assets/quiz/brain.png', z: 1 },
  { key: 'bulb', src: '/assets/quiz/bulb.png', z: 2 },
  { key: 'bubble', src: '/assets/quiz/bubble.png', z: 3 },
  { key: 'mark', src: '/assets/quiz/mark.png', z: 4 },
] as const

/** Where the bulb's glass sits on the shared canvas, for the glow behind it. */
const BULB_GLOW = { left: '75%', top: '23%' }

export function QuizTimeSlide({
  title = 'Quiz Time!',
  subtitle,
  kicker = 'Your Turn',
  steps,
  lesson,
}: QuizTimeSlideProps) {
  const instant = useInstant()
  return (
    /*
      LIGHT, not the brand blue used by the dividers: the character is drawn in
      brand blue, so on a blue field it sank into the background and read as a
      silhouette.
    */
    <SlideBase variant="light" lesson={lesson} decor={false}>
      {/* A single wash, bottom left, clear of both halves of the content. It is
          kept inside the canvas so the frame overflow sweep stays clean. */}
      <div className="pointer-events-none absolute bottom-8 left-0 h-80 w-80 rounded-full bg-brand/[0.07] blur-3xl" />

      {steps && steps.length > 0 ? (
        /*
          WITH STEPS: the kicker and title go in the standard pinned header
          (content rules 19 and 22), the subtitle is the lead, and the steps are
          the body in Space-1. The 88px announcement title cannot share its half
          with three instructions without wrapping (rule 35), so this variant does
          not try: it is a content frame that happens to announce a quiz.
          Added for PF 14 "For Loop" (python_programming/for_loop).
        */
        <>
          <ZonedFrame kicker={kicker} title={title} lead={subtitle} mode="top" bodyWidth={560}>
            <ol className="flex flex-col gap-3">
              {steps.map((st, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-card bg-white px-5 py-3 text-body-lg text-ink shadow-card-soft ring-1 ring-line"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-heading text-body-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {st}
                </li>
              ))}
            </ol>
          </ZonedFrame>
          <div aria-hidden className="pointer-events-none absolute" style={{ left: 640, top: 180, width: 600, height: 500 }}>
        {/*
          right — the character on its stage.

          The stage is sized to fill the right half of the canvas. The top
          padding is what keeps it legal: the scene is tall enough that, centred,
          its question mark would reach into the rectangle reserved in the top
          right for the instructor video, so the whole half is pushed down until
          the tallest element starts below y=220.
        */}
        <motion.div
          className="relative z-10 flex h-full items-center justify-center pt-[160px]"
          /*
            THE ONE ANIMATION FOR THE WHOLE FIGURE. It used to carry only a
            fade and a slide, with the real entrance happening four times
            underneath it. Now it is the entrance, so it gains a little scale
            to have some presence on its own, and it has to honour `instant`
            like everything else that moves on this slide.
          */
          initial={instant ? false : { opacity: 0, x: 36, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={instant ? { duration: 0 } : { delay: 0.4, duration: 1.2, ease: EASE }}
        >
          <div className="relative" style={{ width: STAGE_W, height: STAGE_H }}>
            {/*
              NO DISC BEHIND THE FIGURE.

              There used to be a pale blue circle here, sized to the stage, that
              grounded the old flat character. The keyed art does not need it:
              the four layers carry their own soft shadows, and the circle read
              as a plate the illustration had been dropped onto rather than as
              part of the composition.
            */}
            {/*
              THE BULB'S GLOW.

              Drawn here rather than baked into the art. The export carried a
              blurred backdrop wash behind everything, which had to go when the
              layers were keyed out — it belonged to no single object and left a
              grey cast on the slide. A CSS radial glow tied to the bulb's own
              entrance says the same thing and costs nothing, and it can breathe
              after it lands, which a baked wash cannot.
            */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute z-[2] rounded-full"
              style={{
                left: BULB_GLOW.left,
                top: BULB_GLOW.top,
                width: 210,
                height: 210,
                background:
                  'radial-gradient(closest-side, rgba(255,196,60,0.42), rgba(255,196,60,0.12) 55%, rgba(255,196,60,0))',
              }}
              initial={instant ? false : { opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
              animate={
                instant
                  ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
                  : { opacity: [0, 1, 0.72, 1], scale: [0.5, 1.12, 1, 1.06], x: '-50%', y: '-50%' }
              }
              transition={
                instant
                  ? { duration: 0 }
                  : { delay: 1.5, duration: 2.6, times: [0, 0.22, 0.55, 1], ease: EASE, repeat: Infinity, repeatType: 'reverse' }
              }
            />

            {/*
              The four layers, stacked on one canvas to recompose the artwork.
              Static: the stage container above is what animates, so the scene
              arrives as one picture. See LAYERS.
            */}
            {LAYERS.map((layer) => (
              <img
                key={layer.key}
                src={layer.src}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain"
                style={{ zIndex: layer.z }}
              />
            ))}
          </div>
        </motion.div>
          </div>
        </>
      ) : (
      <div className="grid h-full grid-cols-2 items-center">
        {/* left — the announcement, centred against the character */}
        <div className="relative z-10">
          <motion.div
            className="inline-flex items-center gap-3 rounded-pill bg-brand-soft px-5 py-2 ring-1 ring-brand/15"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-body-sm font-bold uppercase tracking-[0.18em] text-brand-700">
              {kicker}
            </span>
          </motion.div>

          <motion.h2
            className="mt-6 font-tpl-title text-[88px] font-semibold leading-[0.98] text-ink"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 1.2, ease: EASE }}
          >
            {title}
          </motion.h2>

          {/* the rule draws itself, so the title lands on a beat */}
          <motion.div
            className="mt-6 h-1.5 rounded-full bg-gradient-to-r from-brand via-accent to-accent/30"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.1, ease: EASE }}
          />

          {subtitle && (
            <motion.p
              className="mt-7 max-w-md text-body-xl text-body"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.9, ease: EASE }}
            >
              {subtitle}
            </motion.p>
          )}

        </div>

        {/*
          right — the character on its stage.

          The stage is sized to fill the right half of the canvas. The top
          padding is what keeps it legal: the scene is tall enough that, centred,
          its question mark would reach into the rectangle reserved in the top
          right for the instructor video, so the whole half is pushed down until
          the tallest element starts below y=220.
        */}
        <motion.div
          className="relative z-10 flex h-full items-center justify-center pt-[160px]"
          /*
            THE ONE ANIMATION FOR THE WHOLE FIGURE. It used to carry only a
            fade and a slide, with the real entrance happening four times
            underneath it. Now it is the entrance, so it gains a little scale
            to have some presence on its own, and it has to honour `instant`
            like everything else that moves on this slide.
          */
          initial={instant ? false : { opacity: 0, x: 36, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={instant ? { duration: 0 } : { delay: 0.4, duration: 1.2, ease: EASE }}
        >
          <div className="relative" style={{ width: STAGE_W, height: STAGE_H }}>
            {/*
              NO DISC BEHIND THE FIGURE.

              There used to be a pale blue circle here, sized to the stage, that
              grounded the old flat character. The keyed art does not need it:
              the four layers carry their own soft shadows, and the circle read
              as a plate the illustration had been dropped onto rather than as
              part of the composition.
            */}
            {/*
              THE BULB'S GLOW.

              Drawn here rather than baked into the art. The export carried a
              blurred backdrop wash behind everything, which had to go when the
              layers were keyed out — it belonged to no single object and left a
              grey cast on the slide. A CSS radial glow tied to the bulb's own
              entrance says the same thing and costs nothing, and it can breathe
              after it lands, which a baked wash cannot.
            */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute z-[2] rounded-full"
              style={{
                left: BULB_GLOW.left,
                top: BULB_GLOW.top,
                width: 210,
                height: 210,
                background:
                  'radial-gradient(closest-side, rgba(255,196,60,0.42), rgba(255,196,60,0.12) 55%, rgba(255,196,60,0))',
              }}
              initial={instant ? false : { opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
              animate={
                instant
                  ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
                  : { opacity: [0, 1, 0.72, 1], scale: [0.5, 1.12, 1, 1.06], x: '-50%', y: '-50%' }
              }
              transition={
                instant
                  ? { duration: 0 }
                  : { delay: 1.5, duration: 2.6, times: [0, 0.22, 0.55, 1], ease: EASE, repeat: Infinity, repeatType: 'reverse' }
              }
            />

            {/*
              The four layers, stacked on one canvas to recompose the artwork.
              Static: the stage container above is what animates, so the scene
              arrives as one picture. See LAYERS.
            */}
            {LAYERS.map((layer) => (
              <img
                key={layer.key}
                src={layer.src}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain"
                style={{ zIndex: layer.z }}
              />
            ))}
          </div>
        </motion.div>
      </div>
      )}
    </SlideBase>
  )
}
