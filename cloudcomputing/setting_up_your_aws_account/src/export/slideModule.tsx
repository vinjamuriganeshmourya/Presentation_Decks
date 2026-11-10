/**
 * SLIDE MODULE — this deck packaged for the NewGen slide host.
 *
 * The host (see `testjs.js` in the NewGenSlideAssets bucket) loads a deck as an
 * ES module and drives it itself. That contract is:
 *
 *   globals in    globalThis.__slideReact         React
 *                 globalThis.__slideJsxRuntime    { Fragment, jsx, jsxs }
 *                 globalThis.__slideRevealStore   { get, set, subscribe }
 *
 *   exports out   default              Array of zero-prop slide components
 *                 design               palette / fonts / typeScale / radius
 *                 meta                 { title, theme }
 *                 pageRevealMaxSteps   build steps per slide
 *                 DeckRevealProvider   ({ step, children })
 *
 * The host owns navigation, so nothing here renders the player: no keyboard
 * handling, no progress rail, no slide counter. Each export is one 1920x1080
 * frame and nothing else.
 *
 * TWO DIFFERENCES FROM THE REFERENCE DECK, BOTH DELIBERATE
 *
 * 1. Size. This deck is authored on a 1280x720 canvas and every value in it is
 *    a fixed pixel on that canvas. Rather than rewrite ~50 components against a
 *    1920x1080 grid — a change that would touch every number in the project and
 *    could not be verified against the existing renders — each slide is scaled
 *    by exactly 1.5 into the host's frame. 1280x1.5 = 1920 and 720x1.5 = 1080,
 *    so the mapping is exact and nothing reflows.
 *
 * 2. Styling. The reference styles everything with inline objects. This deck is
 *    built on Tailwind, so the compiled stylesheet is injected once, the same
 *    way the reference injects its own <style> for keyframes and its <link>s for
 *    fonts. If the host needs literal inline styles instead, that is a full
 *    rewrite of the component layer rather than a change to this file.
 */
/* The session-owned seam. See src/decks/activeDeck.ts — this file is kit. */
import { deck, meta as deckMeta } from '@/decks/activeDeck'
import { Stepper } from '@/motion/Stepper'
import { colors, fonts } from '@/design/tokens'
import { DECK_CSS } from './deckCss'

/* ── host globals ─────────────────────────────────────────────────────── */

/*
  Taken from the host, with no fallback on purpose. A `?? require('react')`
  fallback looks harmless but makes the bundler pull a second, lazily-initialised
  copy of React into the file and drags its CommonJS interop preamble along with
  it. The reference module reads the global and nothing else; so does this.
*/
const React = (globalThis as any).__slideReact

interface RevealStore {
  get: () => number
  set: (n: number) => void
  subscribe: (fn: () => void) => () => void
}

const createRevealStore = (initial: number): RevealStore => {
  let step = initial
  const subs = new Set<() => void>()
  return {
    get: () => step,
    set: (n: number) => {
      if (step === n) return
      step = n
      subs.forEach((fn) => fn())
    },
    subscribe: (fn: () => void) => {
      subs.add(fn)
      return () => {
        subs.delete(fn)
      }
    },
  }
}

const SlideRevealStoreContext = React.createContext(null as RevealStore | null)
const hostRevealStore = (): RevealStore | null => (globalThis as any).__slideRevealStore ?? null

/** The host's current build step, from the context store, the global one, or 0. */
function useRevealStep(): number {
  const contextStore = React.useContext(SlideRevealStoreContext)
  const store: RevealStore | null = contextStore ?? hostRevealStore()
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    if (!store) return
    return store.subscribe(() => tick((n: number) => n + 1))
  }, [store])
  return store ? store.get() : 0
}

/** Matches the reference export of the same name. */
export const DeckRevealProvider = ({ step, children }: { step: number; children: unknown }) => {
  const storeRef = React.useRef(null as RevealStore | null)
  if (!storeRef.current) storeRef.current = createRevealStore(step)
  React.useEffect(() => {
    storeRef.current?.set(step)
  }, [step])
  return React.createElement(SlideRevealStoreContext.Provider, { value: storeRef.current }, children)
}

/* ── the stylesheet, injected once ────────────────────────────────────── */

let stylesInjected = false

function useDeckStyles() {
  React.useEffect(() => {
    if (stylesInjected || document.getElementById('nxtwave-deck-styles')) return
    const el = document.createElement('style')
    el.id = 'nxtwave-deck-styles'
    el.textContent = DECK_CSS
    document.head.appendChild(el)
    stylesInjected = true
  }, [])
}

/* ── the frame ────────────────────────────────────────────────────────── */

const HOST_W = 1920
const HOST_H = 1080
const DECK_W = 1280
const DECK_H = 720
const SCALE = HOST_W / DECK_W // 1.5, and 1080/720 is the same number

/**
 * One host frame: a 1920x1080 box containing the 1280x720 slide, scaled up.
 * The slide's own build steps are driven from the host's reveal store, so the
 * host's navigation controls the reveals without knowing anything about them.
 */
function Frame({ index }: { index: number }) {
  useDeckStyles()
  const step = useRevealStep()
  const slide = deck[index]

  return React.createElement(
    'div',
    {
      style: {
        width: HOST_W,
        height: HOST_H,
        position: 'relative',
        overflow: 'hidden',
        background: colors.surface,
        fontFamily: fonts.body,
      },
    },
    React.createElement(
      'div',
      {
        style: {
          width: DECK_W,
          height: DECK_H,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        },
      },
      React.createElement(Stepper, { step, onMax: () => {} }, slide.element),
    ),
  )
}

/* ── exports the host reads ───────────────────────────────────────────── */

export const design = {
  palette: { bg: colors.surface, text: colors.ink, accent: colors.nwBlue },
  fonts: { display: fonts.heading, body: fonts.body },
  typeScale: { hero: 96, body: 28 },
  radius: 18,
}

export const meta = {
  title: deckMeta.title,
  theme: 'NxtWaveEvolve',
}

/**
 * Build steps per slide, measured by mounting every slide and reading the step
 * count it claims. Regenerate with `workflow/export/build-slide-module.mjs`
 * rather than editing by hand — a wrong number here means the host either stops
 * early on a slide or clicks through empty steps.
 */
export { PAGE_REVEAL_MAX_STEPS as pageRevealMaxSteps } from './revealSteps'

const slides = deck.map((slide, i) => {
  const Component = () => React.createElement(Frame, { index: i })
  Component.displayName = slide.id
  return Component
})

export default slides
