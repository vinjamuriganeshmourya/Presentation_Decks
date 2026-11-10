import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * THE STEP REGISTRY OF THE SLIDE ON SCREEN (user, 2026-11-03; session-local kit
 * change, the other half of `autoAnim.ts`).
 *
 * With auto animation OFF a slide is walked one animation step per press. The
 * steps come from two kinds of TRACK, in this order:
 *
 *   'entrance'   the entrance layer's units in reading order (`figures/entrance.ts`
 *                registers how many it holds back), always first;
 *   a figure     every `useCycle` in the slide registers its build length (its
 *                states minus the one it mounts in), in mount order.
 *
 * `at` is how many presses the slide has taken; a track reads its own progress
 * with `localStep`. `full` marks a slide the deck landed on "fully revealed" (a
 * jump, a press back): every track reads its end until a press moves `at`.
 *
 * The deck resets the registry on every navigation and replay, before the new
 * slide mounts, and asks `advanceStep` / `backStep` on the plain arrows; only
 * when neither has anything left does the press change slide.
 */

type Track = { key: string; n: number }

let tracks: Track[] = []
let at = 0
let full = false
let version = 0
/* which slide the registry belongs to: bumped by every reset, so a slide still on screen while it LEAVES
   (the smooth player's crossfade keeps it mounted ~0.6s) holds what it showed instead of un-building */
let gen = 0
export const stepGen = () => gen
const subs = new Set<() => void>()
const emit = () => {
  version++
  /* published for the harnesses and the review app, like `__DECK__` */
  if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__DECK_STEPS__ = { at: stepAt(), total: totalSteps(), tracks: tracks.map((t) => [t.key === 'entrance' ? 'entrance' : 'figure', t.n]) }
  subs.forEach((fn) => fn())
}

export function resetSteps(opts: { full?: boolean } = {}) {
  tracks = []
  at = 0
  full = !!opts.full
  gen++
  emit()
}

export function registerTrack(key: string, n: number, g = gen) {
  /* a leaving slide never registers into the next slide's registry */
  if (g !== gen) return
  const i = tracks.findIndex((t) => t.key === key)
  if (i >= 0) tracks[i] = { key, n }
  else if (key === 'entrance') tracks.unshift({ key, n })
  else tracks.push({ key, n })
  emit()
}

export function unregisterTrack(key: string) {
  if (!tracks.some((t) => t.key === key)) return
  tracks = tracks.filter((t) => t.key !== key)
  emit()
}

export const totalSteps = () => tracks.reduce((s, t) => s + t.n, 0)
export const isFull = () => full
export const stepAt = () => (full ? totalSteps() : Math.min(at, totalSteps()))

/** A track's own progress, 0 to its length. */
export function localStep(key: string): number {
  let off = 0
  const now = stepAt()
  for (const t of tracks) {
    if (t.key === key) return Math.max(0, Math.min(t.n, now - off))
    off += t.n
  }
  return 0
}

export const canAdvance = () => stepAt() < totalSteps()

export function advanceStep(): boolean {
  if (!canAdvance()) return false
  at = stepAt() + 1
  full = false
  emit()
  return true
}

export function backStep(): boolean {
  if (stepAt() <= 0) return false
  at = stepAt() - 1
  full = false
  emit()
  return true
}

/** Everything on this slide counts as shown (a toggle of auto animation mid-slide). */
export function revealAllSteps() {
  if (full) return
  full = true
  emit()
}

export function subscribeSteps(fn: () => void): () => void {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

const getVersion = () => version

/** Re-render on any change of the registry. */
export function useStepVersion(): number {
  return useSyncExternalStore(subscribeSteps, getVersion, () => 0)
}

/**
 * A figure's track: `n` steps registered while `active`, and the track's own
 * progress back. Inactive (a harness URL, a picker thumbnail) it registers
 * nothing and reads 0.
 */
export function useTrack(n: number, active: boolean): number {
  const key = useId()
  /* the registry this figure mounted into; once the deck resets it for the next slide, this one is leaving */
  const [mine] = useState(stepGen)
  useLayoutEffect(() => {
    if (!active || n <= 0) return
    registerTrack(key, n, mine)
    return () => {
      if (stepGen() === mine) unregisterTrack(key)
    }
  }, [key, n, active, mine])
  useStepVersion()
  const last = useRef(0)
  /* LEAVING: hold the last state read, so the figure does not rewind to step 0 while it crossfades out */
  if (stepGen() !== mine) return active ? last.current : 0
  last.current = active ? localStep(key) : 0
  return last.current
}
