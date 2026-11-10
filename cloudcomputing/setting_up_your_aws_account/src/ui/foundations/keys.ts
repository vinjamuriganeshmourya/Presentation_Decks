/**
 * THE SPEC'S KEYS, WITHOUT TOUCHING THE PLAYER.
 *
 * Build contract 3 of the session spec: "Right arrow or the clicker is one
 * press. Left arrow goes back one press. F goes full screen, A shows all the
 * cards, and End shows the whole card at once. The instructor guide tells the
 * instructor these keys, so they must work." The player (`src/deck/`, kit)
 * already has every one of these as an action; this file only binds the keys
 * the guide names to them:
 *
 *   → / ←, PageDown / PageUp   one press. The player's own `steps` arrow mode,
 *                               asked for through the URL on first open (its
 *                               documented `?nav=steps`), only when the URL
 *                               names no mode and this browser never chose
 *                               one. Nothing is written to storage: a
 *                               `file://` origin is shared by every deck on
 *                               the machine, and one deck must not change how
 *                               the others open. `S` still swaps the mode and
 *                               Ctrl + arrow still jumps a whole card.
 *   F                           the player's own full-screen button
 *   A                           the player's own slide picker: every card
 *   End                         the whole card at once: `StepControls`
 *                               (figures/controls.tsx), which knows the card's
 *                               press count
 *
 * Every key stands down while the marker is open (its own keys are letters and
 * digits) and while something is being typed. `?all`, the harnesses' flag, is
 * never touched: they read the player's default.
 */

const MODE_KEY = 'nxtwave.deck.arrowMode'

function markerOpen() {
  return !!document.querySelector('button[aria-label^="Close the marker"]')
}

export function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

/** True when a session key may act on this event: no modifier, nothing typed into, marker closed. */
export function keyFree(e: KeyboardEvent) {
  return !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e) && !markerOpen()
}

export function installSpecKeys() {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __pf20Keys?: boolean }
  if (w.__pf20Keys) return
  w.__pf20Keys = true

  /* One press per arrow, by default. */
  const params = new URLSearchParams(window.location.search)
  let saved: string | null = null
  try {
    saved = window.localStorage.getItem(MODE_KEY)
  } catch {
    /* file:// with site data blocked: nothing saved */
  }
  if (!params.has('nav') && !params.has('all') && !saved) {
    params.set('nav', 'steps')
    window.history.replaceState(null, '', `${window.location.pathname}?${params}${window.location.hash}`)
    /* The player reads the mode once, on mount; then the address goes back to
       what was opened, so a reload after the instructor presses S is theirs. */
    window.setTimeout(() => {
      const q = new URLSearchParams(window.location.search)
      if (q.get('nav') !== 'steps') return
      q.delete('nav')
      const s = q.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}${window.location.hash}`)
    }, 3000)
  }

  window.addEventListener('keydown', (e) => {
    if (!keyFree(e)) return
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Toggle fullscreen"]')
      if (btn) btn.click()
      else if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      else void document.documentElement.requestFullscreen?.().catch(() => {})
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault()
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Jump to a slide (G)"]')
      if (btn) btn.click()
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    }
  })
}
