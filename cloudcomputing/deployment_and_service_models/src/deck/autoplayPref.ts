import { useSyncExternalStore } from 'react'

/**
 * THE DECK-WIDE AUTO-PLAY SETTING (pedagogy team, 2026-10-12, on PF 29).
 *
 * One On/Off for the whole deck, set from the slide menu (`SlidePicker`, the
 * "Jump to a slide" overlay). On, the slides the deck lists as auto-play (its
 * own `src/decks/figures/autoplay.ts`) play their steps when they open; Off,
 * every slide waits for Next. A deck first loads with it On.
 *
 * It is kept in localStorage under the deck's own path, so it survives a
 * reload of THIS deck and never reaches another deck opened from the same
 * `file://` origin (a `file://` origin is shared by every deck on the
 * machine). Which slides auto-play is the deck's call, never this file's.
 *
 * Session-local copy of a kit change (kit PR pending): the kit's own
 * `SlidePicker.tsx` does not carry the option yet.
 */
const KEY = `deck:autoplay:${typeof location === 'undefined' ? '' : location.pathname}`
let value: boolean | null = null
const subs = new Set<() => void>()

function read(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    return v === null ? true : v === 'on'
  } catch {
    return true
  }
}

export function getAutoplayPref(): boolean {
  if (value === null) value = read()
  return value
}

export function setAutoplayPref(on: boolean) {
  if (on === getAutoplayPref()) return
  value = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* storage blocked: the setting still holds while the deck is open */
  }
  subs.forEach((fn) => fn())
}

export function subscribeAutoplayPref(fn: () => void): () => void {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

/** The setting, live: a component re-renders when it changes. */
export function useAutoplayPref(): boolean {
  return useSyncExternalStore(subscribeAutoplayPref, getAutoplayPref, () => true)
}
