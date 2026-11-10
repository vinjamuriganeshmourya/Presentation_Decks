import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { SlideBase } from '@/ui/SlideBase'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { motion } from 'framer-motion'

/**
 * THE QUIZ SLIDE (user, 2026-10-22, a permanent rule for every session):
 * a replica of slide 25 of `Reference ppt's/virtualization-and-hypervisors
 * 2.html`, "Quiz Time!", in its layout, structure and styling.
 *
 * Measured on the reference's 1280 x 720 frame: the light ground (the kit's
 * `brand-soft` gradient) with a soft brand blob at the bottom left (320px,
 * 7% brand, blurred 64px); a two-column grid centred on the page; on the
 * left, at x 64 and vertically centred, the pill (`Your turn`, 16px bold
 * uppercase, 0.18em tracking, brand-700 ink, a 1px brand ring at 15%, 8 x 20
 * padding), then the title `Quiz Time!` (88px, weight 800, line height 0.98,
 * 24px below the pill), then a 220 x 6 bar from brand through accent to
 * accent at 30% (24px below the title); on the right a 540 x 400 picture
 * stack at (658, 232): the brain, the bulb, the speech bubble and the
 * question mark layered in that order, with a 210px radial amber glow behind
 * the bulb at 75% / 23% of the stack, scaled 1.06. The four pictures are the
 * reference's own files (`public/assets/quiz/`, byte-identical).
 *
 * THE TIMER (user, same request): the reference's pill opens with a yellow
 * dot; the user asked for a small running timer in its place. The reference
 * deck holds no timer anywhere (every slide was searched for a clock or a
 * mm:ss readout), so the timer is built to the user's description: the dot's
 * 10px footprint becomes a 14px clock glyph whose hand sweeps once a minute,
 * followed by `mm:ss` counting up from the moment the slide opens, in the
 * dot's accent colour. It holds at 00:00 on harness URLs and in picker
 * thumbnails (`useInstant`), where nothing may run.
 *
 * The words: the deck's earlier quiz copy (three numbered steps) has no place
 * in the reference's structure and lives in the slide's speaker notes.
 *
 * Fonts follow content rule 34 (Sora for the title, DM Sans for the pill)
 * where the reference used Inter for the pill; colours are the template's
 * tokens, which are the reference's own brand blues and accent.
 */
const PILL = 'Your turn'
const TITLE = 'Quiz Time!'
const STACK = ['/assets/quiz/brain.png', '/assets/quiz/bulb.png', '/assets/quiz/bubble.png', '/assets/quiz/mark.png']

/** The reference's entrance: a short rise on the house curve, one piece after another. */
function In({ delay, y = 14, children, className = '', style }: { delay: number; y?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <motion.div
      className={className}
      style={style}
      initial={instant ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

if (typeof document !== 'undefined' && !document.querySelector('style[data-sm-quiz]')) {
  const el = document.createElement('style')
  el.dataset.smQuiz = ''
  el.textContent = `@keyframes qtSweep { to { transform: rotate(360deg) } }`
  document.head.appendChild(el)
}

/** Seconds since the slide opened, as mm:ss; 00:00 wherever nothing may run. */
function useElapsed(): string {
  const instant = useInstant()
  const still = typeof window !== 'undefined' && /[?&](all|noauto|still)(=|&|$)/.test(window.location.search)
  const held = instant || still
  const [s, setS] = useState(0)
  useEffect(() => {
    if (held) return
    const t0 = Date.now()
    const t = window.setInterval(() => setS(Math.floor((Date.now() - t0) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [held])
  const n = held ? 0 : s
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

/** The count, only mounted when a slide asks for it, so an unasked timer never runs. */
function Count() {
  const elapsed = useElapsed()
  return <span className="font-mono text-[13px] font-semibold tabular-nums leading-none" aria-label={`Time on this slide ${elapsed}`}>{elapsed}</span>
}

/**
 * The small timer that stands where the reference's yellow dot stood: a clock
 * glyph with a sweeping hand, and the count. `count` false (user, 2026-10-23,
 * the closing quiz, slide 64: "remove the time going, only the clock icon and
 * Your turn") keeps the glyph and drops the count.
 */
function Timer({ count = true }: { count?: boolean }) {
  const instant = useInstant()
  return (
    <span className="flex items-center gap-1.5" style={{ color: colors.accent }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <circle cx="12" cy="13" r="8.5" />
        <path d="M9 2h6" strokeLinecap="round" />
        <g style={{ transformOrigin: '12px 13px', transformBox: 'view-box', animation: instant ? undefined : 'qtSweep 60s linear infinite' }}>
          <path d="M12 13V7.5" strokeLinecap="round" />
        </g>
      </svg>
      {count && <Count />}
    </span>
  )
}

/** `timer` (default FALSE since 2026-10-23, user: "follow slide 64's design for all"): the pill shows the clock glyph and the words; true adds the running count. */
export function ClassroomQuiz({ lesson, timer = false }: { lesson: string; timer?: boolean }): ReactNode {
  const instant = useInstant()
  return (
    <SlideBase variant="light" lesson={lesson}>
      {/* the reference's soft brand blob, bottom left */}
      {/* the reference's blob runs past the bottom-left corner; here its box stays inside the slide's content area, 12px above the foot band
          (qa.mjs measures boxes, not what a clip shows), and the 64px blur carries its glow into the corner as the reference's does */}
      <div className="pointer-events-none absolute h-80 w-80 rounded-full" style={{ background: 'rgba(45,99,251,0.07)', filter: 'blur(64px)', left: 0, bottom: 12 }} aria-hidden />

      <div className="grid h-full grid-cols-2 items-center">
        {/* the announcement, left */}
        <div className="relative z-10">
          <In delay={0} y={12}>
            <span
              className="inline-flex items-center gap-3 rounded-pill px-5 py-2"
              style={{ background: 'linear-gradient(160deg, #EEF3FF 0%, #F5F8FF 100%)', boxShadow: 'inset 0 0 0 1px rgba(45,99,251,0.15)' }}
            >
              <Timer count={timer} />
              <span className="text-[16px] font-bold uppercase tracking-[0.18em]" style={{ color: '#013A9E' }}>
                {PILL}
              </span>
            </span>
          </In>
          <In delay={0.16} y={22}>
            <h2 className="mt-6 font-heading text-[88px] font-extrabold leading-[0.98]" style={{ color: colors.ink }}>
              {TITLE}
            </h2>
          </In>
          <In delay={0.32} y={10}>
            <div className="mt-6 h-1.5 w-[220px] rounded-full" style={{ background: `linear-gradient(to right, ${colors.brand}, ${colors.accent}, rgba(255,138,61,0.3))` }} />
          </In>
        </div>

        {/* the picture stack, right: the reference's own four pictures, layered, with the glow behind the bulb */}
        <div className="relative z-10 flex h-full items-center justify-center pt-[160px]">
          <motion.div
            className="relative"
            style={{ width: 540, height: 400 }}
            initial={instant ? false : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute z-[2] rounded-full"
              style={{
                left: '75%',
                top: '23%',
                width: 210,
                height: 210,
                background: 'radial-gradient(closest-side, rgba(255,196,60,0.42), rgba(255,196,60,0.12) 55%, rgba(255,196,60,0))',
                transform: 'translate(-50%, -50%) scale(1.06)',
              }}
            />
            {STACK.map((src, i) => (
              <img key={src} src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" style={{ zIndex: i + 1 }} />
            ))}
          </motion.div>
        </div>
      </div>
    </SlideBase>
  )
}
