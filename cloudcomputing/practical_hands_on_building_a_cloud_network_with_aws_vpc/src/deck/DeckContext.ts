import { createContext, useContext, type ReactNode } from 'react'

/** One agenda point's stretch of the ACTIVE deck, read from its section breaker slide (see `SectionBar`). */
export interface DeckSegment {
  name: string
  start: number
  end: number
  /** the active index to land on when the segment is pressed: the breaker, or slide 1 for the opening */
  target: number
  /** the slide the segment lands on, for the bar's hover preview (user, 2026-10-23) */
  element?: ReactNode
}

export interface DeckContextValue {
  index: number
  total: number
  direction: number
  goTo: (i: number) => void
  next: () => void
  prev: () => void
  isFirst: boolean
  isLast: boolean
  /** the segmented progress bar's data (user, 2026-10-22); absent outside a deck that computes it */
  segments?: DeckSegment[]
  /** jump to an active index landing fully revealed, the picker's way */
  jump?: (i: number) => void
}

export const DeckContext = createContext<DeckContextValue | null>(null)

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used within <Deck>')
  return ctx
}
