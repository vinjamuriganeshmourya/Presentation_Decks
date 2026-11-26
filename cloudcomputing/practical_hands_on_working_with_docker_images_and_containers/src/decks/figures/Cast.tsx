import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { mo } from './motion'
import { useInstant } from '@/motion/instant'
import { Character } from './cast/rig/Character'
import { useCharacter } from './cast/rig/useCharacter'
import { buildSkin, PRESETS, type CharacterConfig } from './cast/skins/config'
import type { Action, Key, Tracks } from './cast/rig/track'
import { HAND_POSES, handKeys } from './cast/actions'

/**
 * THE CAST, copied from PF 22's Cast.tsx (2026-10-08) for PF 25. Originally: THE CAST OF PF 22, from the Character Lab (`slide-kit/characters-lab`,
 * vendored unchanged in `./cast`). User, 2026-10-07: slides 4 and 20 use the
 * lab's human characters as the base, adapted to each scene by pose,
 * expression, gesture and props, in the lab's art style, proportions and
 * colours.
 *
 *   Rahul   the lab's Arjun preset, unchanged (a friend at the party, the
 *           customer at the bakery)
 *   Riya    the lab's Riya preset, unchanged (a friend at the party)
 *   Teja    a lab config: the birthday friend, in the room and on the call's
 *           small self tile
 *   Amma    a lab config: on the video call
 *   Baker   a lab config, with two props the lab does not have: a chef's cap
 *           (head frame, so it moves with the head) and an apron (body frame)
 *
 * `Posed` draws one of them holding ONE frame of a lab gesture: on mount the
 * gesture plays from its start up to `at` seconds and stops there (movement
 * inside the press that mounted it); during an instant jump it is simply at
 * `at`. Nothing moves after that, so no frame changes on a timer (spec rule
 * 1). Key a `Posed` by its pose so a new pose plays from the start.
 *
 * `crop` is a window on the lab's 400 x 600 canvas (ground y 580, hips y 360,
 * head centre y 120), so a half-body figure is cut cleanly at the waist.
 */

export const TEJA: CharacterConfig = {
  name: 'Teja',
  gender: 'male',
  art: 'soft',
  shading: 'flat',
  skinTone: 'wheatish',
  hair: { style: 'curly', color: 'black' },
  face: { jaw: 'oval', brows: 'medium', eyes: 'oval', mouth: 'full' },
  outfit: { top: 'tshirt', topColor: '#12B5A8', bottom: 'jeans', bottomColor: '#1B2238' },
  accessories: {},
  build: { height: 0.98, shoulders: 0.98 },
}

export const AMMA: CharacterConfig = {
  name: 'Amma',
  gender: 'female',
  art: 'line',
  shading: 'flat',
  skinTone: 'wheatish',
  hair: { style: 'bun', color: 'darkBrown' },
  face: { jaw: 'round', brows: 'medium', eyes: 'dot', mouth: 'line' },
  outfit: { top: 'kurta', topColor: '#B24A7A', bottom: 'salwar', bottomColor: '#5B2A45' },
  accessories: { bindi: true, earrings: true },
  build: { height: 0.97, shoulders: 1 },
}

export const BAKER: CharacterConfig = {
  name: 'Baker',
  gender: 'male',
  art: 'soft',
  shading: 'clay',
  skinTone: '#F9AE7C',
  hair: { style: 'short', color: '#2A2324' },
  face: { jaw: 'round', brows: 'thick', eyes: 'big', mouth: 'full' },
  outfit: { top: 'tshirt', topColor: '#FFFFFF', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' },
  accessories: {},
  build: { height: 1, shoulders: 1.04 },
}

export const RAHUL = PRESETS.arjun
export const RIYA = PRESETS.riya

/** The baker's cap, head-local (skull centre at 0,0, rx 50 ry 56). */
const CAP = (
  <g data-part="cap">
    <path d="M -44 -50 C -70 -60 -66 -112 -34 -104 C -30 -134 30 -134 34 -104 C 66 -112 70 -60 44 -50 Z" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth={3} />
    <path d="M -46 -58 H 46 V -40 C 20 -46 -20 -46 -46 -40 Z" fill="#F5F8FF" stroke="#D8E3F5" strokeWidth={3} />
  </g>
)

/** The baker's apron, body space (shoulders y 205, hips y 360). */
const APRON = (
  <g data-part="apron">
    <path d="M 170 236 H 230 V 270 C 246 276 250 300 248 330 L 246 420 H 154 L 152 330 C 150 300 154 276 170 270 Z" fill="#FFF4EC" stroke="#FF8A3D" strokeWidth={3} />
    <path d="M 170 236 C 168 220 160 212 152 208 M 230 236 C 232 220 240 212 248 208" stroke="#FF8A3D" strokeWidth={3} fill="none" />
    <rect x={178} y={318} width={44} height={30} rx={6} fill="none" stroke="#FF8A3D" strokeWidth={2.5} />
  </g>
)

export type Crop = { x0: number; y0: number; x1: number; y1: number }
/** Half body: head to just under the hips. */
export const HALF: Crop = { x0: 90, y0: 30, x1: 310, y1: 392 }

export function Posed({
  cfg,
  props: withProps = false,
  expression = 'happy',
  intensity = 1,
  gesture,
  side,
  amplitude,
  at = 1.2,
  scale,
  crop = HALF,
  flip = false,
  seed = 3,
  say,
  children,
  alive = false,
  breathe = true,
}: {
  cfg: CharacterConfig
  /** the baker's cap and apron */
  props?: boolean
  /** motion layer 2026-10-16: a character breathes (the smallest scale from its base, CSS, off on harness URLs and in thumbnails); the pose is untouched */
  breathe?: boolean
  /** review 2026-10-16, slide 37: after the held frame the figure stays in its gesture and moves only its head, eyes and hands a little, on a seamless loop; still on harness URLs and in thumbnails */
  alive?: boolean
  expression?: string
  intensity?: number
  gesture?: string
  side?: 'L' | 'R'
  /** the lab's PlayOptions amplitude: a smaller reach keeps a hand inside the canvas */
  amplitude?: number
  /** the held frame, seconds into the gesture */
  at?: number
  /** px per lab unit */
  scale: number
  crop?: Crop
  flip?: boolean
  seed?: number
  /** words the mouth is saying in the held frame (singing, shouting) */
  say?: string
  /** drawn over the figure in the same cropped box (a held cake box) */
  children?: ReactNode
}) {
  const instant = useInstant()
  const key = JSON.stringify(cfg) + withProps
  const skin = useMemo(() => {
    const s = buildSkin(cfg)
    if (!withProps) return s
    return {
      ...s,
      hairFront: (
        <>
          {s.hairFront}
          {CAP}
        </>
      ),
      top: (
        <>
          {s.top}
          {APRON}
        </>
      ),
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const c = useCharacter({ clock: 'manual', seed, idle: alive ? ALIVE_IDLE : undefined })
  const { seek, setExpression, play, say: speak } = c
  useEffect(() => {
    seek(0)
    setExpression(expression, intensity)
    if (gesture) play(gesture, { side, amplitude, variation: 0 })
    if (say) speak(say)
    if (instant || (alive && STILL)) {
      seek(at)
      return
    }
    /* play up to the held frame once, then stop there; `alive`: at the held frame the gesture hands over to
       its hold (the same arm, drifting a degree) and the clock keeps running for the blinks and glances */
    let raf = 0
    let holding = false
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      if (!alive) {
        const u = Math.min(at, t)
        seek(u)
        if (u < at) raf = requestAnimationFrame(tick)
        return
      }
      if (!holding && t >= at) {
        holding = true
        const hold = gesture ? HOLDS[gesture] : undefined
        if (hold) play(hold, { side, amplitude, variation: 0 })
      }
      seek(t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const w = (crop.x1 - crop.x0) * scale
  const h = (crop.y1 - crop.y0) * scale
  const breath = breathe ? mo('breath', seed, { base: true }) : { className: '', style: {} }
  /* the breathing wrapper sits OUTSIDE the flip, whose inline transform a CSS animation would replace */
  return (
    <div className={`shrink-0 ${breath.className}`} style={{ width: w, height: h, ...breath.style }}>
      <div className="relative overflow-hidden" style={{ width: w, height: h, transform: flip ? 'scaleX(-1)' : undefined }}>
        <div className="absolute" style={{ left: -crop.x0 * scale, top: -crop.y0 * scale }}>
          <Character pose={c.pose} skin={skin} width={400 * scale} />
        </div>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ alive, subtly */

/** The idle layer a subtly alive figure runs: blinks and glances (eyes, a little head), no breath, no sway. */
const ALIVE_IDLE = { breath: false, sway: false, blink: true, saccades: true, liveliness: 0.6 }

/** Keys that wander `amp` around `rest` over `D` seconds and come home, so a loop has no seam. */
function drift(rest: number, amp: number, D: number, phase: number): Key[] {
  return [
    [0, rest],
    [D * (0.18 + phase * 0.08), rest + amp, 'inOut'],
    [D * (0.5 + phase * 0.05), rest - amp * 0.6, 'inOut'],
    [D * (0.76 + phase * 0.04), rest + amp * 0.4, 'inOut'],
    [D, rest, 'inOut'],
  ]
}

/**
 * The hold a presenting arm settles into after its gesture's held frame
 * (`present` in the lab's hands.ts: shoulder 62, elbow 28, wrist -20, the
 * hand open, the head turned and tilted toward what is shown): the same
 * pose, each joint drifting about a degree, the eyes and head glancing a
 * little, the other arm at rest with the same drift. Played through the same
 * amplitude as the gesture, so the two frames meet exactly and the handover
 * is a cross-fade between near-identical poses.
 */
function presentHold(side: 'L' | 'R'): Action {
  const D = 6.4
  const dir = side === 'R' ? 1 : -1
  const other = side === 'R' ? 'L' : 'R'
  const tracks: Tracks = {
    [`shoulder${side}`]: drift(62, 1.4, D, 0),
    [`elbow${side}`]: drift(28, 1.1, D, 1),
    [`wrist${side}`]: drift(-20, 2.4, D, 2),
    [`shoulder${other}`]: drift(8, 1.2, D, 3),
    [`elbow${other}`]: drift(6, 1.6, D, 4),
    [`wrist${other}`]: drift(0, 2.2, D, 5),
    headTurn: drift(0.35 * dir, 0.07, D, 1),
    headTilt: drift(1.8 * dir, 0.5, D, 3),
    lookX: drift(0.55 * dir, 0.14, D, 2),
    lookY: drift(0, 0.1, D, 4),
    ...handKeys(side, HAND_POSES.open, 0, 'out'),
  } as Tracks
  return { name: `presentHold${side}`, duration: D, loop: true, blendIn: 0.5, tracks }
}

/** The hold each gesture settles into when a `Posed` figure is `alive`. */
const HOLDS: Record<string, Action> = {
  presentRight: presentHold('R'),
  presentLeft: presentHold('L'),
}

/* ------------------------------------------------------------------ idling */


/**
 * A hand drift: the arms stay in the lab's rest pose (shoulder 8, elbow 6,
 * wrist 0) and wander a degree or two around it, on smooth in-out keys,
 * starting and ending at rest so the loop has no seam. Each side and each
 * person gets its own period and phase, so no two hands move together. The
 * elbow stays between 4 and 9 degrees: it only ever bends the way an elbow
 * bends, and never straightens past straight.
 */
function handDrift(seed: number): Action {
  const r = (n: number) => {
    const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const D = 6 + r(1) * 2 /* one pass, 6 to 8 s */
  const wave = (rest: number, amp: number, phase: number): Key[] => {
    const a = amp * (0.7 + 0.3 * r(phase))
    const p = 0.2 + 0.15 * r(phase + 1)
    return [
      [0, rest],
      [D * p, rest + a, 'inOut'],
      [D * (p + 0.3), rest - a * 0.6, 'inOut'],
      [D * (p + 0.55), rest + a * 0.4, 'inOut'],
      [D, rest, 'inOut'],
    ]
  }
  return {
    name: 'handDrift',
    duration: D,
    loop: true,
    blendIn: 0.6,
    tracks: {
      shoulderL: wave(8, 1.6, 2),
      elbowL: wave(6, 2.2, 4),
      wristL: wave(0, 3, 6),
      shoulderR: wave(8, 1.6, 8),
      elbowR: wave(6, 2.2, 10),
      wristR: wave(0, 3, 12),
    },
  }
}

/**
 * One person holding ONE base pose (the lab's rest pose and one expression)
 * for as long as the slide is up, alive with the lab's own idle layer:
 * breathing, blinks, eye movement and a slow weight-shift sway, at a gentle
 * liveliness, plus the hand drift above. No gesture, no pose change; the
 * lab's life layer keeps every joint on its springs, so nothing jumps.
 * User, 2026-10-07, slide 4's birthday-scene characters only.
 */
/**
 * PF 29: a harness holds the characters still. An idling character updates
 * its svg every frame, which keeps Chromium's `document.fonts.status` at
 * "loading" (layout is never clean when it checks), and every playwright
 * screenshot then waits for fonts for ever. The harnesses open the deck with
 * `?all`, the shot scripts with `?noauto`; on those URLs the character holds
 * one frame of its rest pose. The instructor's deck is untouched.
 */
const STILL = typeof window !== 'undefined' && /[?&](all|noauto|still)(=|&|$)/.test(window.location.search)

export function Idling({ cfg, expression = 'happy', scale, crop = HALF, seed = 3, head, alive = false, breathe = true }: { cfg: CharacterConfig; expression?: string; scale: number; crop?: Crop; seed?: number; /** a head-local prop drawn over the hair (PF 25: the DJ's headphones), so it moves with the head */ head?: ReactNode; /** review 2026-10-16, slide 37: blinks, glances and a little head and hand movement, on a seamless loop; still on harness URLs and in thumbnails */ alive?: boolean; /** motion layer 2026-10-16: breathing, the smallest scale from the base (CSS, off on harness URLs and in thumbnails) */ breathe?: boolean }) {
  const skin = useMemo(() => {
    const s = buildSkin(cfg)
    return head ? { ...s, hairFront: (<>{s.hairFront}{head}</>) } : s
  }, [JSON.stringify(cfg), !!head]) // eslint-disable-line react-hooks/exhaustive-deps
  /* a slide-picker thumbnail renders under InstantContext: 64 live rigs would drag the picker to 12fps (2026-10-15) */
  const thumb = useInstant()
  /* Review 2026-10-16 (A6, no animation unrelated to the content): a person
     no longer breathes, blinks or sways on a slide; every rig holds one frame,
     unless the slide asks for `alive` (the later review's slide 37: head, eyes
     and a little hand movement only). */
  const still = STILL || thumb || !alive
  const c = useCharacter({ id: `scene-${cfg.name}`, clock: still ? 'manual' : 'auto', seed, idle: ALIVE_IDLE })
  const { setExpression, play, seek } = c
  /* PF 25: the svg itself is cut to the crop (its viewBox and size), instead of
     a full 400 x 600 picture hanging out of a clipping box, so every layout
     check measures the figure the room sees. React never re-sets these: the
     rig's own props for them do not change between frames. */
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const svg = box.current?.querySelector('svg')
    if (!svg) return
    svg.setAttribute('viewBox', `${crop.x0} ${crop.y0} ${crop.x1 - crop.x0} ${crop.y1 - crop.y0}`)
    svg.setAttribute('width', String((crop.x1 - crop.x0) * scale))
    svg.setAttribute('height', String((crop.y1 - crop.y0) * scale))
  }, [crop.x0, crop.y0, crop.x1, crop.y1, scale])
  useEffect(() => {
    setExpression(expression)
    if (still) {
      seek(0.45)
      return
    }
    play(handDrift(seed), { variation: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const w = (crop.x1 - crop.x0) * scale
  const h = (crop.y1 - crop.y0) * scale
  const breath = breathe ? mo('breath', seed, { base: true }) : { className: '', style: {} }
  return (
    <div className={`shrink-0 ${breath.className}`} style={{ width: w, height: h, ...breath.style }}>
      <div ref={box} className="relative overflow-hidden" style={{ width: w, height: h }}>
        <Character pose={c.pose} skin={skin} width={400 * scale} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ PF 25 */

/**
 * PF 25's cast (G4, user 2026-10-08: every character is a lab character; a
 * beard is round or oval, or none). Neither of these has a beard.
 *
 *   TEJA   the DJ at the party (G1), the lab config from PF 22
 *   RAM    his friend sending requests (H1's chat)
 */
export const RAM: CharacterConfig = {
  name: 'Ram',
  gender: 'male',
  art: 'soft',
  shading: 'flat',
  skinTone: 'medium',
  hair: { style: 'short', color: 'black' },
  face: { jaw: 'round', brows: 'medium', eyes: 'oval', mouth: 'full' },
  outfit: { top: 'tshirt', topColor: '#FF8A3D', bottom: 'jeans', bottomColor: '#1B2238' },
  accessories: {},
  build: { height: 1, shoulders: 1 },
}

/** Head and shoulders: the face and the top of the shirt. */
export const BUST: Crop = { x0: 122, y0: 26, x1: 278, y1: 236 }
/** The head with headphones on, and the top of the shoulders: the band rises to y 36. */
export const HEADSET: Crop = { x0: 126, y0: 28, x1: 274, y1: 206 }
/** The head alone, for a chat avatar. */
export const FACE: Crop = { x0: 136, y0: 40, x1: 264, y1: 190 }
/** The head with its hair whole: the crop starts above every hairstyle's crown (review 2026-10-16, slide 37: no face cut at the top). */
export const FACE_WHOLE: Crop = { x0: 130, y0: 10, x1: 270, y1: 190 }

/**
 * Over-ear headphones, head-local (skull centre 0,0, rx 50 ry 56): a band
 * arching ABOVE the head and two cups over the ears. The cups lift and settle
 * by a pixel on a slow eased loop, out of step, so the DJ reads as listening;
 * the band rides the head's own idle movement.
 */
export const HEADPHONES = (
  <g data-part="headphones">
    <style>{`@keyframes pf25-cup { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }`}</style>
    <path d="M -56 2 C -60 -62 -30 -84 0 -84 C 30 -84 60 -62 56 2" fill="none" stroke="#1F2A44" strokeWidth={9} strokeLinecap="round" />
    <path d="M -50 -40 C -40 -70 -18 -78 0 -78 C 18 -78 40 -70 50 -40" fill="none" stroke="#3A4766" strokeWidth={3} strokeLinecap="round" />
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'pf25-cup 2.6s cubic-bezier(0.45,0,0.55,1) infinite' }}>
      <rect x={-68} y={-14} width={22} height={36} rx={10} fill="#2D63FB" />
      <rect x={-62} y={-8} width={10} height={24} rx={5} fill="#0146C7" />
    </g>
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'pf25-cup 2.6s cubic-bezier(0.45,0,0.55,1) -1.3s infinite' }}>
      <rect x={46} y={-14} width={22} height={36} rx={10} fill="#2D63FB" />
      <rect x={52} y={-8} width={10} height={24} rx={5} fill="#0146C7" />
    </g>
  </g>
)
