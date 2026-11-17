import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { motion } from 'framer-motion'
import { revealVariants, type RevealDirection } from './presets'
import { useInstant } from './instant'

/**
 * Click-to-reveal fragment system ("build" animations).
 *
 * A slide's header/base content shows immediately (use <Reveal>), while body
 * content wrapped in <Step> is revealed one click at a time. The <Deck>
 * advances the step on ArrowRight / click; when all steps are shown, the next
 * click moves to the next slide.
 *
 * Each <Step> claims a monotonically-increasing order on first render (in
 * source/visual order). It becomes visible once the current step reaches it.
 */

interface StepContextValue {
  step: number
  claim: (id: string) => number
}

const StepContext = createContext<StepContextValue | null>(null)

/** When ?all is in the URL, every Step is shown at once (used for thumbnails/QA). */
let REVEAL_ALL =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('all')

/*
  A DECK WITH NO BUILDS (Cloud Computing Fundamentals, user 2026-10-15: "all of
  that content appears at once when the slide loads"). A session calls this once,
  at module load, before the first render. Every Step and claimed beat is then
  shown, and the Stepper reports ZERO steps, so a press never lands on a build
  that has nothing left to show: every press is a slide.
*/
let NO_STEPS = false
export function revealEveryStep() {
  REVEAL_ALL = true
  NO_STEPS = true
}
export const everyStepRevealed = () => NO_STEPS

export function Stepper({
  step,
  onMax,
  children,
}: {
  step: number
  onMax: (max: number) => void
  children: ReactNode
}) {
  const reg = useRef<{ map: Map<string, number>; next: number }>({
    map: new Map(),
    next: 0,
  })

  const claim = useCallback((id: string) => {
    const r = reg.current
    const existing = r.map.get(id)
    if (existing !== undefined) return existing
    const n = r.next + 1 // steps are 1-based; step 0 shows only the base content
    r.map.set(id, n)
    r.next = n
    return n
  }, [])

  // After children have rendered (and claimed), report the total step count.
  useLayoutEffect(() => {
    onMax(NO_STEPS ? 0 : reg.current.next)
  })

  const value = useMemo(() => ({ step, claim }), [step, claim])
  return <StepContext.Provider value={value}>{children}</StepContext.Provider>
}

/**
 * Claims a single build step and returns whether it has been revealed yet.
 *
 * Unlike <Step>, this does NOT mount/unmount or hide its subject — it lets a
 * slide restyle content that is already on screen once a click lands. The quiz
 * uses it to keep every option visible from the start and only highlight the
 * correct one after a click, so the answer is never shown before the class has
 * seen the full set of choices.
 *
 * Outside a <Stepper> (overview thumbnails) or with ?all, it returns true.
 */
export function useReveal(): boolean {
  const ctx = useContext(StepContext)
  const id = useId()
  const order = ctx ? ctx.claim(id) : 0
  return REVEAL_ALL || !ctx || ctx.step >= order
}

/**
 * Claim `count` build steps at once and get back which of them have been reached.
 *
 * WHY `useReveal()` IN A LOOP DOES NOT WORK
 *
 * `useReveal` calls `useId()` and claims that id. Called `count` times from one
 * component the ids do not come out distinct in the way the registry needs, so
 * every beat claimed the SAME order: the whole figure appeared on the first
 * click and the deck reported one step, which made the arrow key advance the
 * slide instead of the build.
 *
 * This calls exactly two hooks whatever `count` is, and derives `count` stable
 * ids from one base, so the registry gets `count` distinct claims in order.
 *
 * Used by the flow-chart lab, where a figure's parts are laid out by explicit
 * beat index rather than in render order, so it cannot rely on `<Step>` claiming
 * as it renders.
 */
export function useClaimedSteps(count: number): boolean[] {
  const ctx = useContext(StepContext)
  const base = useId()
  if (!ctx) return Array.from({ length: count }, () => true)
  const orders = Array.from({ length: count }, (_, i) => ctx.claim(`${base}-${i}`))
  return orders.map((order) => REVEAL_ALL || ctx.step >= order)
}

type Tag = 'div' | 'li' | 'span' | 'section' | 'p'

/**
 * A single click-revealed fragment. Outside a <Stepper> (e.g. overview
 * thumbnails) it renders fully visible.
 */
export function Step({
  children,
  dir = 'up',
  className,
  style,
  as = 'div',
}: {
  children: ReactNode
  dir?: RevealDirection
  className?: string
  style?: CSSProperties
  as?: Tag
}) {
  const ctx = useContext(StepContext)
  const instant = useInstant()
  const id = useId()
  const order = ctx ? ctx.claim(id) : 0
  const shown = REVEAL_ALL || !ctx || ctx.step >= order
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      style={style}
      // duration 0 when instant → the fragment snaps in with no build animation
      variants={revealVariants(dir, instant ? 0 : undefined)}
      initial={false}
      animate={shown ? 'show' : 'hidden'}
    >
      {children}
    </MotionTag>
  )
}
