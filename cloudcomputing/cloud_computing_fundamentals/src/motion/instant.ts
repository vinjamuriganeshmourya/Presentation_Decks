import { createContext, useContext } from 'react'

/**
 * True while the deck is performing an "instant" navigation (Ctrl+←/→): the
 * slide swap plays no transition, and the slide's own entrance/build reveals
 * render at their final state with no animation. Reveal/RevealGroup/Step read
 * this to decide whether to animate.
 */
export const InstantContext = createContext(false)

export const useInstant = () => useContext(InstantContext)
