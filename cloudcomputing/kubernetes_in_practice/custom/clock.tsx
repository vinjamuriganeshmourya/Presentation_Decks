import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useHeld } from '@/engine/figkit'

/*
 * ONE PLAYBACK CLOCK PER ANALOGY SLIDE, shared by its two cards (T21-AN, T22-AN; review 2026-11-18).
 *
 *  - It PLAYS AT ONCE: the cards fade in (opacity only) as soon as every person on BOTH cards has a first frame, and
 *    the loop starts from 0 at that moment, so nobody pops in after the room (a person used to appear 0.3 s late on a
 *    slow PC) and nothing is waited on after that (never longer than READY_CAP). (A first version held the
 *    opening frame until the people were built and then waited on any frame not built yet; on a slow PC that froze
 *    the scene for seconds, because the engine can switch to a re-sized frame set and stop building the old one.
 *    Removed on the user's word: "animation need to be played initially".)
 *  - THE TWO CARDS stay beat for beat: one clock, read once per animation frame (`document.timeline.currentTime`).
 *  - TAP TO PAUSE: a tap (or click) on either card pauses both, a second tap plays on; a small pause mark shows while
 *    paused. Leaving the slide resets it.
 *  - HELD FRAMES (`?still`, prefers-reduced-motion, thumbnails) are untouched: the stage asks for `holdT` and gets it.
 *
 * What made the people smooth is in the cards themselves: fixed-size frames (no re-sizing, which hid a person while
 * a new set was built: the flicker) and no idle breathing (a still pose is then one shared picture, so the frames that
 * move are built far sooner). See `STILL_IDLE` / `PX` in i.tsx and j.tsx.
 */

type Clock = { users: number; scenes: number; pending: number; ready: boolean; start: number; offset: number; lastNow: number; c: number }

/* the cards of one slide (everyday + concept) */
const CARDS = 2
const READY_CAP = 1500
const clocks = new Map<string, Clock>()
const shown = new Map<string, { on: boolean; fns: Set<(on: boolean) => void> }>()
const shownOf = (key: string) => {
  let p = shown.get(key)
  if (!p) shown.set(key, (p = { on: false, fns: new Set() }))
  return p
}
const setShown = (key: string, on: boolean) => {
  const p = shownOf(key)
  if (p.on === on) return
  p.on = on
  p.fns.forEach((f) => f(on))
}
const pause = new Map<string, { on: boolean; fns: Set<(on: boolean) => void> }>()

const frameNow = () => {
  const t = typeof document !== 'undefined' ? document.timeline?.currentTime : null
  return typeof t === 'number' ? t : performance.now()
}
const pauseOf = (key: string) => {
  let p = pause.get(key)
  if (!p) pause.set(key, (p = { on: false, fns: new Set() }))
  return p
}
const setPaused = (key: string, on: boolean) => {
  const p = pauseOf(key)
  if (p.on === on) return
  p.on = on
  p.fns.forEach((f) => f(on))
}

/**
 * In a card's `setup`: the slide's clock. `people` are the card's sprites (their `ready`: the first frame is on the
 * plane). `time(t)` turns the stage's `t` into loop time (`holdT` passes through).
 */
export function slideClock(key: string, scene: THREE.Scene, holdT: number, people: { ready: Promise<void> }[]) {
  let k = clocks.get(key)
  if (!k) {
    const now = frameNow()
    clocks.set(key, (k = { users: 0, scenes: 0, pending: 0, ready: false, start: now, offset: 0, lastNow: now, c: 0 }))
    const born = k
    setTimeout(() => go(born), READY_CAP)
  }
  const ck = k
  ck.users++
  ck.scenes++
  ck.pending += people.length
  function go(c: Clock) {
    if (c.ready || clocks.get(key) !== c) return
    c.ready = true
    c.start = c.lastNow = frameNow()
    c.offset = 0
    setShown(key, true)
  }
  for (const p of people) {
    p.ready.then(() => {
      ck.pending--
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  }
  /* the scene's teardown (disposeAll calls userData.dispose on every object): the last card out drops the clock */
  const anchor = new THREE.Object3D()
  anchor.userData.dispose = () => {
    ck.users--
    if (ck.users <= 0) {
      clocks.delete(key)
      setPaused(key, false)
      setShown(key, false)
    }
  }
  scene.add(anchor)
  return {
    time(t: number): number {
      if (t === holdT) return holdT
      /* until every person has a first frame: the start, unchanging, so each sprite builds only that frame first */
      if (!ck.ready) return 0
      const now = frameNow()
      if (now !== ck.lastNow) {
        if (pauseOf(key).on) ck.offset += Math.max(0, now - ck.lastNow)
        ck.lastNow = now
        ck.c = (now - ck.start - ck.offset) / 1000
      }
      return ck.c
    },
  }
}

let down: { x: number; y: number; t: number } | null = null

/** The card's box: the stage, a tap on it pauses / plays the slide's two cards, and the pause mark. */
export function ClockCard({ id, w, h, children }: { id: string; w: number; h: number; children: ReactNode }) {
  const held = useHeld()
  const [on, setOn] = useState(() => pauseOf(id).on)
  const [seen, setSeen] = useState(() => shownOf(id).on)
  useEffect(() => {
    const p = pauseOf(id)
    const v = shownOf(id)
    p.fns.add(setOn)
    v.fns.add(setSeen)
    setOn(p.on)
    setSeen(v.on)
    return () => {
      p.fns.delete(setOn)
      v.fns.delete(setSeen)
    }
  }, [id])
  return (
    <div
      onPointerDown={(e) => {
        down = { x: e.clientX, y: e.clientY, t: performance.now() }
      }}
      onPointerUp={(e) => {
        /* a tap, not a swipe (the deck's swipe still changes slides) and not a long press */
        const d = down
        down = null
        if (e.button > 0 || !d || performance.now() - d.t > 500 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
        setPaused(id, !pauseOf(id).on)
      }}
      style={{ position: 'relative', width: w, height: h, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* the scene fades in once its people are drawn (held frames: at once) */}
      <div style={{ display: 'grid', placeItems: 'center', opacity: held || seen ? 1 : 0, transition: held ? 'none' : 'opacity 320ms cubic-bezier(0.22,1,0.36,1)' }}>{children}</div>
      <span
        aria-hidden
        style={{ position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 99, background: 'rgba(255,255,255,0.92)', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: 'opacity 240ms cubic-bezier(0.22,1,0.36,1)', pointerEvents: 'none' }}
      >
        <svg width={14} height={14} viewBox="0 0 14 14">
          <rect x={2} y={1.5} width={3.6} height={11} rx={1.2} fill="#2D63FB" />
          <rect x={8.4} y={1.5} width={3.6} height={11} rx={1.2} fill="#2D63FB" />
        </svg>
      </span>
    </div>
  )
}
