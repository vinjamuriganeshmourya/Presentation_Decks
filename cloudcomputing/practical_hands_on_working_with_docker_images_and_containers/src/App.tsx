import { Deck } from './deck/Deck'
import { deck, meta } from './decks/activeDeck'

/**
 * App shell — KIT FILE, identical in every session.
 *
 * The deck it renders comes from `src/decks/activeDeck.ts`, which is the one
 * session-owned module under `src/`. That indirection is the whole reason this
 * file can be shared: it used to import each session's deck by name, so it was
 * the same twenty lines duplicated with one identifier changed.
 *
 * `sampleDeck` is kept in ./decks as the layout reference — it exercises every
 * slide type in the kit and is the right thing to open when a layout looks
 * wrong. Point `activeDeck.ts` at it to see them all.
 *
 * `deck-viewport` (in `index.css`) and not `h-screen w-screen`: `100vh` on a
 * phone is the LARGEST viewport, the one with the browser's address bar
 * scrolled away, so with the bar on screen the bottom of the player, and the
 * control bar with it, sat under the browser chrome. `100dvh` follows the bar.
 */
export function App() {
  return (
    <div className="deck-viewport">
      <Deck slides={deck} meta={meta} transition="slide" />
    </div>
  )
}
