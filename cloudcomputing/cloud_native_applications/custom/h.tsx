import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER H - SESSION 18 (Cloud-Native Applications) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`
 * (generate-slides standing corrections 13-17, deck-engine "3D scenes and people" and "Low-end PCs"), built the way
 * Session 16's i.tsx is: a perspective camera on a real place, Character Lab people through the engine's `castSprite`
 * at a fixed `px: 256` with no idle breathing, NO TEXT on either card, ONE clock per slide shared by both cards
 * (`./clock`: the cards fade in once every person has a first frame, tap to pause), every loop ending in the state it
 * starts in, held frames (`?still`, thumbnails) at HOLD.
 *
 * SLIDE 7 - T01-AN (TR 1): "An automatic traffic signal adjusts its timing based on traffic flow, handling busy and
 * quiet periods efficiently: just as cloud-native applications adjust resources based on demand and are designed to
 * handle failures."
 *
 *   place               everyday: a road junction                     concept: an application
 *   x < -0.5            the main road, two lanes, cars arrive          the request lane, two lanes, requests arrive
 *                       (the SAME arrival times on both cards, the same car-following model)
 *   (-0.86, -0.7)       the automatic signal, its green-time bar       the autoscaler pole, its capacity bar
 *   x 0 .. 1.9          the junction and the road beyond               the application platform: instance blocks
 *   (1.15, near lane)   the car that stalls, hazard lights on          the instance block that fails (orange cross)
 *
 *   0.0 - 1.7   BUSY: red, cars pile up at the stop line              requests pile up at the platform's edge
 *   1.4 - 2.2   green comes on and HOLDS 3.8 s (the bar is long)      blocks multiply 2 -> 6 (the bar fills), the queue drains
 *   2.75 - 5.7  one car stalls, hazards on; the rest change lane      2.75 one block fails; requests go to the others;
 *               and pass it; 5.7 it starts again and drives on        4.3 it sinks, 4.8 a fresh block rises in its place
 *   5.5 - 7.0   amber, red: the cross road's turn                     blocks fall back 6 -> 2 (the bar drains)
 *   7.0 - 8.0   QUIET: a SHORT green (the bar is short), two cars     two lone requests go straight in
 *   The traffic is a car-following model run seven loops from an empty road; the loop kept is one that ends exactly
 *   as it began (see `seamless`), so the cars cross the seam without a jump.
 *
 * SLIDE 16 - T05-AN (TR 5): "A travel checklist helps people prepare for different trips by covering essentials like
 * tickets, documents, luggage and transport. The Twelve-Factor App works similarly by providing a common set of
 * principles for building and running applications reliably across different environments."
 *
 *   place (x)   everyday: a hallway at home                     concept: a build room
 *   -1.42       the traveller with her clipboard checklist      the checklist panel (the same four rows)
 *   -0.52       tickets and passport on the console table       the config card and the dependency booklet
 *    0.12       the packed suitcase                             the app package (a crate with the app window)
 *    1.0 .. 2   the cab waiting outside the glass door          the deploy rocket waiting on its pad
 *   back wall   a world map: home, three destinations           three environments: laptop, server, cloud
 *
 *   0.6 - 3.3   four ticks, one item each (a green tick pops)   four ticks, one item each
 *   3.7 - 7.6   three trips: a plane flies home -> beach,       three deploys: a copy of the package flies to the
 *               -> mountains, -> city; each pin lights          laptop, the server, the cloud; each runs the same app
 *   8.1 - 9.0   ticks clear, the pins dim (back to the start)   ticks clear, the screens go dark
 */

const W = 470
const H = 390
/* dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : d
}

const C = {
  brand: colors.brand,
  brandDark: colors.brandDark,
  navy: '#1F2E63',
  ink: '#22304F',
  orange: colors.accent,
  green: '#22C55E',
  greenDark: colors.success,
  gold: '#F2C14E',
  white: '#FFFFFF',
  steel: '#B7C3D6',
  taxi: '#F6C531',
}

/* ------------------------------------------------------------------ small maths */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
/** 1 between b and c, easing up from a and down to d */
const hold = (t: number, a: number, b: number, c: number, d: number) => seg(t, a, b) * (1 - seg(t, c, d))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l
const TAU = Math.PI * 2
const DEG = Math.PI / 180
/** a quick pop: 0 -> overshoot -> 1 */
const pop = (t: number, a: number, d = 0.32) => {
  const k = clamp01((t - a) / d)
  if (k <= 0) return 0
  return 1 + Math.sin(k * Math.PI) * 0.28 * (1 - k * 0.4) - (1 - sm(k)) * 1
}

/* ------------------------------------------------------------------ textures (TEX_SS x logical size, 4K-sharp) */

const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  g.scale(TEX_SS, TEX_SS)
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}
/** a texture redrawn on demand (the checklists): `paint(state)` repaints only when the state changes */
function liveTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  let last = -1
  const paint = (s: number) => {
    if (s === last) return
    last = s
    g.setTransform(TEX_SS, 0, 0, TEX_SS, 0, 0)
    g.clearRect(0, 0, w, h)
    draw(g, s)
    t.needsUpdate = true
  }
  paint(0)
  return { tex: t, paint }
}
const tileTex = (base: string, line: string, n: number, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = line
      g.lineWidth = 2
      const s = 128 / n
      for (let i = 0; i <= n; i++) {
        g.beginPath()
        g.moveTo(0, i * s)
        g.lineTo(128, i * s)
        g.moveTo(i * s, 0)
        g.lineTo(i * s, 128)
        g.stroke()
      }
    },
    repeat,
  )
const plankTex = (base: string, line: string) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = line
      g.lineWidth = 2
      for (let i = 0; i <= 4; i++) {
        g.beginPath()
        g.moveTo(0, i * 32)
        g.lineTo(128, i * 32)
        g.stroke()
        const x = ((i * 53) % 128) + 10
        g.beginPath()
        g.moveTo(x, i * 32)
        g.lineTo(x, i * 32 + 32)
        g.stroke()
      }
    },
    [6, 4],
  )

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const sphere = (r: number, m: THREE.Material, pos: THREE.Vector3Tuple) => mesh(new THREE.SphereGeometry(r, 24, 16), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
function halo(color: string, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}

/** hemisphere, a key with soft shadows, a rim */
function lights(scene: THREE.Scene, target: THREE.Vector3Tuple, span = 6) {
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 5, target[1] + 9, target[2] + 8)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -span
  key.shadow.camera.right = span
  key.shadow.camera.top = span
  key.shadow.camera.bottom = -span
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
  return { hemi, key, rim }
}

/** a green tick badge (a symbol, not a word): a disc with a white check, billboarded */
const tickTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = C.greenDark
    g.beginPath()
    g.arc(32, 33, 29, 0, TAU)
    g.fill()
    g.fillStyle = C.green
    g.beginPath()
    g.arc(32, 31, 28, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(19, 32)
    g.lineTo(28, 41)
    g.lineTo(45, 22)
    g.stroke()
  })
/** an orange cross badge (failure: orange, never red) */
const crossTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = colors.accentDark
    g.beginPath()
    g.arc(32, 33, 29, 0, TAU)
    g.fill()
    g.fillStyle = C.orange
    g.beginPath()
    g.arc(32, 31, 28, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(21, 20)
    g.lineTo(43, 42)
    g.moveTo(43, 20)
    g.lineTo(21, 42)
    g.stroke()
  })
function badge(tex: THREE.Texture, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), basic(tex, { depthTest: false }))
  m.renderOrder = 9
  m.visible = false
  return m
}
/** the app window glyph: the SAME app on the package and on every environment's screen */
function appGlyph(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.roundRect(x, y, w, h, h * 0.1)
  g.fill()
  g.fillStyle = C.brand
  g.beginPath()
  g.roundRect(x, y, w, h * 0.2, [h * 0.1, h * 0.1, 0, 0])
  g.fill()
  g.fillStyle = '#FFFFFF'
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    g.arc(x + w * 0.08 + i * w * 0.07, y + h * 0.1, h * 0.035, 0, TAU)
    g.fill()
  }
  g.fillStyle = '#C9D7F7'
  g.beginPath()
  g.roundRect(x + w * 0.08, y + h * 0.32, w * 0.36, h * 0.56, h * 0.05)
  g.fill()
  g.fillStyle = '#D9E2F3'
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    g.roundRect(x + w * 0.52, y + h * 0.34 + i * h * 0.19, w * 0.4 * (i === 1 ? 0.7 : 1), h * 0.09, h * 0.04)
    g.fill()
  }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void; ready: Promise<void> }
function faceAt(c: number, keys: [number, string][], loop: number): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - loop
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - loop
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}
const who = (base: CharacterConfig, o: { name: string; gender?: CharacterConfig['gender']; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})
/* Session 16's lesson: fixed-size frames (no re-sizing flicker) and no idle breathing (a still pose is one frame) */
const PX = 256
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT: number }): Sprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes */
  const quiet = (c: number) => Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 40,
    px: PX,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c), breath: false }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* travel clothes, rig body frame 400 x 600: an open khaki jacket and a crossbody bag */
const JACKET = (color: string, edge: string) => (
  <g data-part="jacket">
    <path d="M 150 212 L 186 210 L 198 300 L 176 372 L 150 372 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 202 300 L 224 372 L 250 372 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 178 244 L 192 254 Z M 214 210 L 222 244 L 208 254 Z" fill={edge} opacity={0.5} />
    <rect x={158} y={318} width={22} height={18} rx={4} fill={edge} opacity={0.35} />
    <rect x={220} y={318} width={22} height={18} rx={4} fill={edge} opacity={0.35} />
  </g>
)
const BAG = (strap: string, bag: string) => (
  <g data-part="bag">
    <path d="M 168 212 L 236 352" stroke={strap} strokeWidth={6} strokeLinecap="round" fill="none" />
    <rect x={222} y={344} width={40} height={32} rx={7} fill={bag} stroke={strap} strokeWidth={2.5} />
    <rect x={222} y={344} width={40} height={11} rx={5} fill={strap} opacity={0.6} />
  </g>
)
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (Arm.tsx: pivot 6 px inside the shoulder tip at y 205,
   upper arm 95, forearm 85 + 14 to the grip; an angle is measured from hanging straight down, positive lifts away from
   the body, the forearm at shoulder minus elbow) ---- */

type Pt = { x: number; y: number }
type Arm = { s: number; e: number }
function handPt(side: 'L' | 'R', sh: number, a: Arm): Pt {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px + sg * (Math.sin(s) * 95 + Math.sin(f) * 99), y: 205 + Math.cos(s) * 95 + Math.cos(f) * 99 }
}
/** a rig-frame point on a billboarded sprite of height `h` at `root`, in the scene */
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = h / 0.93 / 600
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the loop time of the frame a sprite of F frames is showing at c (props follow the drawn frame, not the clock) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)

/** a dummy "person" for a card with nobody in it: the shared clock still waits for BOTH cards to be set up */
const NOBODY = () => [{ ready: Promise.resolve() }]

/* ================================================================== T01 - the automatic traffic signal */

const L01 = 9
const HOLD01 = 3.75 /* green held, the stalled car being passed; concept: six blocks, one failed */
const P01 = {
  /* lane centres 1.0 apart: from this camera a car is ~36 px tall on screen, so two lanes 0.42 apart (22 px) stacked
     one car over the other (review 2026-11-20); 1.0 apart puts a clear gap between the two lanes' cars on screen */
  laneZ: [0.5, -0.5] as const, // near, far
  roadW: 1.58,
  stopX: -0.5, // the main road's stop line
  crossX: 0.02, // the cross road's lane (one-way, toward the camera)
  crossStop: -1.05,
  carL: 0.5,
  stallX: 1.15, // where the stalled car stands (near lane)
  sig: new THREE.Vector3(-0.86, 0, -0.98),
}
/* main-road signal: G green, A amber, R red */
const MAIN_GREEN: [number, number][] = [
  [1.72, 5.5],
  [7.0, 8.0],
]
const MAIN_AMBER: [number, number][] = [
  [5.5, 5.9],
  [8.0, 8.35],
]
const CROSS_GREEN: [number, number][] = [
  [6.1, 6.62],
  [8.55, 9.0],
  [0.0, 1.25],
]
const CROSS_AMBER: [number, number][] = [
  [6.62, 6.92],
  [1.25, 1.55],
]
const inAny = (c: number, r: [number, number][]) => r.some(([a, b]) => c >= a && c < b)
const mainState = (c: number) => (inAny(c, MAIN_GREEN) ? 'G' : inAny(c, MAIN_AMBER) ? 'A' : 'R')
const crossState = (c: number) => (inAny(c, CROSS_GREEN) ? 'G' : inAny(c, CROSS_AMBER) ? 'A' : 'R')
/** the green-time bar: the share of 4 s of green left (a long green starts long, a short green starts short) */
const greenLeft = (c: number) => {
  for (const [a, b] of MAIN_GREEN) if (c >= a && c < b) return (b - c) / 4
  return 0
}
/* arrivals on the main road (time, lane 0 near / 1 far): a busy wave, then a quiet road */
/* (a car enters at x -4.2, off the card, about two seconds before it reaches the stop line) */
const MAIN_ARR: [number, number][] = [
  [8.1, 0], // <- the car that stalls (STALL_IDX): first in the near lane, first away on the green
  [8.3, 1],
  [8.7, 0],
  [8.9, 1],
  [0.3, 0],
  [0.5, 1],
  [1.0, 1],
  [2.0, 0],
  [2.6, 1],
  [4.55, 0], // quiet: one car meets the red and waits
  [5.45, 1], // quiet: one car rides the short green
]
const STALL_IDX = 0
const STALL: [number, number] = [2.2, 5.7]
/* (a cross-road car enters far up the road, off the card, about four seconds before its stop line) */
const CROSS_ARR = [4.7, 5.45]

/* the concept: requests ride the same model, held only until the platform has scaled out */
const GATE_OPEN = 1.45
/* blocks: [x, z] on the platform; the first two are always on */
const BLOCKS: [number, number][] = [
  [0.55, -0.5],
  [1.28, -0.5],
  [0.55, 0.25],
  [1.28, 0.25],
  [0.55, 1.0],
  [1.28, 1.0],
]
const BLOCK_ON: [number, number][] = [
  [-1, 99],
  [-1, 99],
  [1.4, 6.2],
  [1.58, 6.0],
  [1.76, 5.8],
  [1.94, 5.6],
]
const FAIL_IDX = 3 // the block where the car stalls (right of the entry, the near lane's side)
const FAIL = { at: 2.75, sink: [4.3, 4.7] as const, rise: [4.8, 5.3] as const }
const blockScale = (i: number, c: number) => {
  const [a, b] = BLOCK_ON[i]
  if (a < 0) return 1
  let k = seg(c, a, a + 0.32) * (1 - seg(c, b, b + 0.32))
  if (i === FAIL_IDX) k *= 1 - seg(c, FAIL.sink[0], FAIL.sink[1]) * (1 - seg(c, FAIL.rise[0], FAIL.rise[1]))
  return k
}
const blockFailed = (i: number, c: number) => i === FAIL_IDX && c >= FAIL.at && c < FAIL.sink[1]
const blockUp = (i: number, c: number) => blockScale(i, c) > 0.6 && !blockFailed(i, c)

type Track = { from: number; n: number; x: Float32Array; z: Float32Array; yaw: Float32Array }
type Sim = { cars: Track[]; stall: number; cross: Track[] }
const HZ = 120
/* "no lane change yet" (the model runs at negative times during its warm-up loops, so never a sentinel like -1) */
const NO_LC = -1e9
/* a lane change takes this long (the lanes are 1.0 apart) */
const LC_T = 0.8

/**
 * The traffic model (IDM, a car-following model): run for three loops from an empty road, then keep the fourth.
 * The same arrivals feed both cards; the everyday card stops at the signal, the concept card only at the gate.
 */
/** one run of the model from an empty road at -LOOPS loops; records loop `rec` (0 = the last) and the state at each loop's start */
function simulate(kind: 'road' | 'app', rec = 0, LOOPS = 7): Sim & { starts: string[] } {
  const L = L01
  const N = Math.round(L * HZ)
  const dt = 1 / HZ
  const V0 = 2.1
  const A = 3.6
  const B = 3.6
  const S0 = 0.15
  const T = 0.26
  const len = P01.carL
  type Car = { id: number; v0: number; passed: boolean; wants?: boolean; x: number; v: number; lane: number; lat: number; latFrom: number; latT: number; stall: boolean; rec: Track | null }
  const cars: Car[] = []
  const cross: Car[] = []
  const pending: number[][] = [[], []]
  const out: Track[] = []
  const outX: Track[] = []
  let stallTrack = -1
  let id = 0
  const t0 = -LOOPS * L
  const steps = Math.round((L - t0) * HZ)
  const r0 = -rec * L
  const starts: string[] = []
  const go = (c: number) => (kind === 'road' ? mainState(c) : c >= GATE_OPEN || c < 0.0 ? 'G' : 'R')
  const idm = (v: number, gap: number, dv: number, v0 = V0) => {
    const ss = S0 + Math.max(0, v * T + (v * dv) / (2 * Math.sqrt(A * B)))
    return A * (1 - Math.pow(v / v0, 4) - Math.pow(ss / Math.max(0.01, gap), 2))
  }
  for (let k = 0; k <= steps; k++) {
    const t = t0 + k * dt
    const c = mod(t, L)
    /* an arrival time is passed when the loop count since it changes between two steps */
    const crossed = (at: number) => Math.floor((t - at) / L + 1e-9) !== Math.floor((t - dt - at) / L + 1e-9)
    /* arrivals */
    for (let i = 0; i < MAIN_ARR.length; i++) {
      const [at, lane] = MAIN_ARR[i]
      if (crossed(at)) pending[lane].push(i)
    }
    /* a car enters only when its lane has room at the edge */
    for (const lane of [0, 1]) {
      if (!pending[lane].length) continue
      const room = cars.every((o) => o.lane !== lane || o.x > -4.2 + len + 0.25)
      if (!room) continue
      const i = pending[lane].shift()!
      const lz = P01.laneZ[lane]
      cars.push({ id: id++, v0: V0 * (0.9 + 0.2 * ((i * 0.618) % 1)), passed: false, x: -4.2, v: V0 * 0.8, lane, lat: lz, latFrom: lz, latT: NO_LC, stall: kind === 'road' && i === STALL_IDX, rec: null })
    }
    if (kind === 'road')
      for (const at of CROSS_ARR) {
        if (crossed(at)) cross.push({ id: id++, v0: V0, passed: false, x: -9, v: V0 * 0.8, lane: 0, lat: P01.crossX, latFrom: 0, latT: NO_LC, stall: false, rec: null })
      }
    /* main road */
    const st = go(c)
    const stallOn = c >= STALL[0] && c < STALL[1]
    const acc: number[] = []
    for (const car of cars) {
      let gap = 99
      let dv = 0
      for (const o of cars) {
        if (o === car || o.x < car.x || (o.x === car.x && o.id > car.id)) continue
        /* a car is in my way if it is bound for my lane, or still sits across it on its way out */
        const mine = P01.laneZ[car.lane]
        /* courtesy: a far-lane car leaves room for a near-lane car waiting to go round the stalled one */
        const yields = car.lane === 1 && o.lane === 0 && o.wants && o.x - car.x > 0.35
        /* and, whatever the lanes, any car my body still overlaps sideways (a car pulling out stays behind it) */
        const beside = Math.abs(o.lat - car.lat) < 0.36
        if (o.lane !== car.lane && Math.abs(o.lat - mine) > 0.3 && !yields && !beside) continue
        const g = o.x - car.x - len - (yields ? 0.2 : 0)
        if (g < gap) {
          gap = g
          dv = car.v - o.v
        }
      }
      let a = idm(car.v, gap, dv, car.v0)
      /* the stop line */
      const front = car.x + len / 2
      const toLine = P01.stopX - front
      /* never into the junction while a cross-road car is still in it */
      const boxBusy = cross.some((o) => o.x + len / 2 > -P01.roadW / 2 - 0.06 && o.x - len / 2 < P01.roadW / 2 + 0.06)
      if ((st !== 'G' || boxBusy) && toLine > -0.02) {
        const canStop = st === 'R' || boxBusy || toLine > (car.v * car.v) / (2 * B)
        if (canStop) a = Math.min(a, idm(car.v, toLine + S0 * 0.6, car.v))
      }
      /* the stalled car: it rolls to a stop at its place, and stays */
      if (car.stall && stallOn) {
        const toStall = P01.stallX - car.x
        if (toStall > -0.05) a = Math.min(a, idm(car.v, Math.max(0.005, toStall) + S0 * 0.4, car.v))
      }
      acc.push(a)
    }
    cars.forEach((car, i) => {
      car.v = Math.max(0, car.v + acc[i] * dt)
      car.x += car.v * dt
    })
    /* lane change round the stalled car (near lane -> far lane) */
    if (kind === 'road') {
      /* the stalled car: the latest one (a car keeps its flag only until it has driven on past its place) */
      for (const q of cars) if (q.stall && !stallOn && q.x > P01.stallX + 0.4) q.stall = false
      const s = cars.findLast((q) => q.stall)
      for (const car of cars) {
        car.wants = false
        if (!s || car === s || car.lane !== 0 || !stallOn) continue
        const ahead = s.x - car.x
        if (ahead > 0 && ahead < 2.2 && car.x > P01.stopX - 0.2) {
          car.wants = true
          const clear = cars.every((o) => o === car || o.lane !== 1 || o.x - car.x > 0.7 || car.x - o.x > 0.7)
          if (clear) {
            car.wants = false
            car.lane = 1
            car.passed = true
            car.latFrom = car.lat
            car.latT = t
          }
        }
        /* past it: back to the near lane */
      }
      for (const car of cars) {
        if (!s || !car.passed || car.lane !== 1 || car.x < P01.stallX + 1.0 || t - car.latT < LC_T + 0.05) continue
        const clear = cars.every((o) => o === car || o.lane !== 0 || Math.abs(o.x - car.x) > 0.75)
        if (clear) {
          car.lane = 0
          car.passed = false
          car.latFrom = car.lat
          car.latT = t
        }
      }
      for (const car of cars) {
        if (car.latT > NO_LC) {
          const k = sm((t - car.latT) / LC_T)
          car.lat = lerp(car.latFrom, P01.laneZ[car.lane], k)
        }
      }
    }
    /* cross road (toward the camera) */
    if (kind === 'road') {
      const cs = crossState(c)
      const cacc = cross.map((car) => {
        let gap = 99
        let dv = 0
        for (const o of cross) {
          if (o === car || o.x <= car.x) continue
          const g = o.x - car.x - len
          if (g < gap) {
            gap = g
            dv = car.v - o.v
          }
        }
        /* the cross road runs toward the camera: a queued car shows ABOVE the one in front on screen, so it keeps
           a longer gap (the car's on-screen height) */
        let a = idm(car.v, gap - 0.42, dv)
        const toLine = P01.crossStop - (car.x + len / 2)
        /* never into the junction while a main-road car is still crossing it (the box: the cross lane, both sides) */
        const boxBusy = cars.some((o) => o.x + len / 2 > P01.crossX - 0.32 && o.x - len / 2 < P01.crossX + 0.32)
        if ((cs !== 'G' || boxBusy) && toLine > -0.02) {
          const canStop = cs === 'R' || toLine > (car.v * car.v) / (2 * B)
          if (canStop) a = Math.min(a, idm(car.v, toLine + S0 * 0.6, car.v))
        }
        return a
      })
      cross.forEach((car, i) => {
        car.v = Math.max(0, car.v + cacc[i] * dt)
        car.x += car.v * dt
      })
    }
    /* record the last loop */
    /* the state at each loop start (positions to 1 mm, lanes), to find a loop that ends as it began */
    if (Math.abs(mod(t + 1e-7, L) - 1e-7) < 1e-6)
      starts.push(
        [...cars, ...cross]
          .map((q) => q.x.toFixed(2) + q.lane + (q.stall ? '*' : ''))
          .sort()
          .join(' '),
      )
    if (t >= r0 - 1e-9 && t <= r0 + L + 1e-9) {
      const n = Math.round((t - r0) * HZ)
      if (n <= N) {
        for (const [list, dest] of [
          [cars, out],
          [cross, outX],
        ] as const) {
          for (const car of list) {
            if (!car.rec) {
              car.rec = { from: n, n: 0, x: new Float32Array(N + 1 - n), z: new Float32Array(N + 1 - n), yaw: new Float32Array(N + 1 - n) }
              dest.push(car.rec)
              if (car.stall) stallTrack = dest.length - 1
            }
            const j = n - car.rec.from
            if (j < car.rec.x.length) {
              car.rec.n = j + 1
              car.rec.x[j] = car.x
              car.rec.z[j] = car.lat
              car.rec.yaw[j] = car.latT > NO_LC ? Math.max(-0.3, Math.min(0.3, -Math.atan2((P01.laneZ[car.lane] - car.latFrom) * Math.sin(Math.PI * clamp01((t - car.latT) / LC_T)) * 1.6, LC_T * car.v + 0.001) * 0.6)) : 0
            }
          }
        }
      }
    }
    /* off the road */
    for (let i = cars.length - 1; i >= 0; i--) if (cars[i].x > 4.6) cars.splice(i, 1)
    for (let i = cross.length - 1; i >= 0; i--) if (cross[i].x > 5.0) cross.splice(i, 1)
  }
  return { cars: out, stall: stallTrack, cross: outX, starts }
}
/**
 * A SEAMLESS loop: the model is run seven loops from an empty road, and the loop recorded is the latest one that ENDS
 * in the state it began in (merges round the stalled car are yes/no decisions, so a loop can differ from the next by a
 * hair; one that repeats exactly is picked, never a seam with a jump).
 */
function seamless(kind: 'road' | 'app'): Sim {
  const probe = simulate(kind, 0)
  const st = probe.starts
  for (let j = st.length - 2; j >= 1; j--) {
    if (st[j] === st[j + 1]) {
      const back = st.length - 2 - j
      return back === 0 ? probe : simulate(kind, back)
    }
  }
  if (typeof console !== 'undefined') console.warn('[h.tsx] T01: no loop of the traffic model repeats exactly; the seam may jump')
  return probe
}
const simCache: Partial<Record<'road' | 'app', Sim>> = {}
const simOf = (k: 'road' | 'app') => (simCache[k] ??= seamless(k))

/** a track's state at loop time c (between samples); null when the car is not on the road then */
function trackAt(tr: Track, c: number): { x: number; z: number; yaw: number } | null {
  const f = c * HZ - tr.from
  if (f < 0) return null
  const i = Math.floor(f)
  if (i >= tr.n - 1) return null
  const k = f - i
  return { x: lerp(tr.x[i], tr.x[i + 1], k), z: lerp(tr.z[i], tr.z[i + 1], k), yaw: lerp(tr.yaw[i], tr.yaw[i + 1], k) }
}
/**
 * A seamless loop: the cars on the road at loop time c are the cars of THIS loop's record at c, plus the cars of the
 * previous loop still on the road (the same record read at c + L): the model has settled, so loop n+1 = loop n.
 */
function carsAt(tracks: Track[], c: number, fn: (tr: Track, s: { x: number; z: number; yaw: number }, j: number) => void) {
  tracks.forEach((tr, j) => {
    const s = trackAt(tr, c)
    if (s) fn(tr, s, j)
  })
}

/**
 * A colour per car that holds across the loop's seam: a car still on the road when the loop starts is the same car as
 * one at the loop's end (the model ends where it began), so it takes that car's colour.
 */
function paintCars(tracks: Track[], palette: string[]): string[] {
  const end = Math.round(L01 * HZ)
  const tint = tracks.map((_, j) => palette[j % palette.length])
  tracks.forEach((tr, j) => {
    if (tr.from !== 0) return
    const k = tracks.findIndex((o) => o.from > 0 && end - o.from < o.n && Math.abs(o.x[end - o.from] - tr.x[0]) < 0.02 && Math.sign(o.z[end - o.from]) === Math.sign(tr.z[0]))
    if (k >= 0) tint[j] = tint[k]
  })
  return tint
}

/** a toy car: rounded body, cabin with windows, four wheels; lamps for the hazards */
function makeCar(body: string, o: { taxi?: boolean; s?: number } = {}) {
  const g = new THREE.Group()
  const bodyM = mat(body, { roughness: 0.32, metalness: 0.15 })
  const glass = mat('#2B3A5C', { roughness: 0.15, metalness: 0.4 })
  const L = 0.5
  g.add(box(L, 0.13, 0.27, bodyM, [0, 0.1, 0], 0.045))
  g.add(box(L * 0.52, 0.11, 0.24, bodyM, [-0.03, 0.205, 0], 0.04))
  g.add(box(L * 0.46, 0.085, 0.245, glass, [-0.03, 0.21, 0], 0.03))
  const wheelM = mat('#23262E', { roughness: 0.7 })
  const hubM = mat('#C9D1DE', { roughness: 0.35, metalness: 0.5 })
  const wheels: THREE.Object3D[] = []
  for (const wx of [-0.16, 0.16])
    for (const wz of [-0.135, 0.135]) {
      const w = new THREE.Group()
      const tyre = cyl(0.055, 0.055, 0.05, wheelM, [0, 0, 0], 18)
      tyre.rotation.x = Math.PI / 2
      const hub = cyl(0.026, 0.026, 0.052, hubM, [0, 0, 0], 12)
      hub.rotation.x = Math.PI / 2
      const spoke = box(0.012, 0.07, 0.054, hubM, [0, 0, 0])
      w.add(tyre, hub, spoke)
      w.position.set(wx, 0.055, wz)
      g.add(w)
      wheels.push(w)
    }
  /* lamps: two at each end (hazards blink all four) */
  const hazM = glowM(C.orange, '#E9B98E')
  const headM = glowM('#FFF4C8', '#F2F2EE')
  for (const z of [-0.09, 0.09]) {
    g.add(flat(box(0.02, 0.035, 0.05, hazM, [-L / 2 + 0.005, 0.12, z])))
    g.add(flat(box(0.02, 0.035, 0.05, headM, [L / 2 - 0.005, 0.12, z])))
  }
  if (o.taxi) g.add(box(0.12, 0.04, 0.08, glowM('#FFE9A6', '#FFF6DA'), [-0.03, 0.285, 0], 0.01))
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  g.scale.setScalar(o.s ?? 1)
  return { g, wheels, hazM, headM }
}

/* the camera: high over the near-left corner, the whole junction and its approach in view */
function frameCam01(camera: THREE.PerspectiveCamera) {
  camera.fov = 36
  camera.position.set(0.1, 4.15, 5.25)
  camera.lookAt(0.1, 0.0, -0.55)
  camera.updateProjectionMatrix()
}

/** the shared ground: a big plate and four corner blocks (grass or plate), with kerbs */
function corners(scene: THREE.Scene, top: THREE.Material, kerb: THREE.Material, opts: { crossW: number }) {
  const hw = P01.roadW / 2
  const cw = opts.crossW / 2
  const blocks: [number, number, number, number][] = [
    [-12, -cw, -24, -hw],
    [cw, 12, -24, -hw],
    [-12, -cw, hw, 8],
    [cw, 12, hw, 8],
  ]
  for (const [x0, x1, z0, z1] of blocks) {
    scene.add(box(x1 - x0, 0.06, z1 - z0, kerb, [(x0 + x1) / 2, 0.03, (z0 + z1) / 2]))
    scene.add(flat(box(x1 - x0 - 0.12, 0.012, z1 - z0 - 0.12, top, [(x0 + x1) / 2, 0.066, (z0 + z1) / 2])))
  }
}

function tree(scene: THREE.Scene, x: number, z: number, s = 1) {
  const g = new THREE.Group()
  g.add(cyl(0.035, 0.045, 0.32, mat('#8C6440', { roughness: 0.8 }), [0, 0.16, 0], 10))
  const leaf = mat('#5DAE6B', { roughness: 0.7 })
  g.add(sphere(0.2, leaf, [0, 0.42, 0]), sphere(0.15, leaf, [0.1, 0.36, 0.05]), sphere(0.14, leaf, [-0.09, 0.37, -0.04]))
  g.position.set(x, 0.06, z)
  g.scale.setScalar(s)
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(g)
}

/** the green-time / capacity bar: eight LED segments in a dark housing, each segment its own material */
function ledBar(color: string, n = 8) {
  const g = new THREE.Group()
  g.add(box(0.07, 0.36, 0.05, mat('#1E2638', { roughness: 0.4 }), [0, 0, 0], 0.012))
  const segs: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < n; i++) {
    const m = glowM(color, '#3A4458')
    segs.push(m)
    g.add(flat(box(0.046, 0.03, 0.012, m, [0, -0.15 + i * (0.3 / (n - 1)), 0.028])))
  }
  return {
    g,
    set: (v: number) => {
      segs.forEach((m, i) => {
        const on = clamp01(v * n - i)
        m.emissiveIntensity = 1.6 * on
        m.color.set(on > 0.5 ? '#FFFFFF' : '#3A4458')
      })
    },
  }
}

/* ------------------------------------------------------------------ T01 everyday: the junction */

function setupT01Everyday(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EAF2FB')
  frameCam01(camera)
  lights(scene, [0.3, 0, 0])
  const sim = simOf('road')

  /* ground: a soft plate, the road, four grass corners with pavements */
  const ground = flat(mesh(new THREE.PlaneGeometry(60, 60), mat('#E4ECF5', { roughness: 0.95, toneMapped: false, emissive: new THREE.Color('#E4ECF5'), emissiveIntensity: 0.3 }), [0, -0.002, 0]))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const asphalt = mat('#4A5266', { roughness: 0.85 })
  const road = flat(mesh(new THREE.PlaneGeometry(24, P01.roadW), asphalt, [0, 0.003, 0]))
  road.rotation.x = -Math.PI / 2
  road.receiveShadow = true
  scene.add(road)
  const cr = flat(mesh(new THREE.PlaneGeometry(0.56, 34), asphalt, [P01.crossX, 0.004, -9]))
  cr.rotation.x = -Math.PI / 2
  cr.receiveShadow = true
  scene.add(cr)
  corners(scene, mat('#A6DB9F', { roughness: 0.9, emissive: new THREE.Color('#A6DB9F'), emissiveIntensity: 0.18 }), mat('#E7EBF2', { roughness: 0.7, emissive: new THREE.Color('#E7EBF2'), emissiveIntensity: 0.2 }), { crossW: 0.56 })
  /* markings: the lane divider (dashed), the stop lines, a zebra crossing */
  const paint = mat('#F7F8FA', { roughness: 0.6 })
  for (let x = -11.9; x < 11.9; x += 0.42) {
    if (x > P01.stopX - 0.1 && x < 0.4) continue
    scene.add(flat(box(0.22, 0.004, 0.025, paint, [x, 0.008, 0])))
  }
  scene.add(flat(box(0.035, 0.004, P01.roadW - 0.06, paint, [P01.stopX - 0.02, 0.008, 0])))
  scene.add(flat(box(0.5, 0.004, 0.035, paint, [P01.crossX, 0.008, P01.crossStop - 0.02])))
  ;[-0.66, -0.396, -0.132, 0.132, 0.396, 0.66].forEach((z) => scene.add(flat(box(0.16, 0.004, 0.07, paint, [P01.stopX - 0.17, 0.009, z]))))
  /* trees on the far corners, a low hedge on the near-right */
  tree(scene, -1.7, -1.3, 1.1)
  tree(scene, -2.6, -1.5, 0.95)
  tree(scene, 1.5, -1.3, 1.05)
  tree(scene, 2.55, -1.55, 1.15)
  tree(scene, 2.4, 2.5, 0.9)
  /* the trees beyond, so the ground runs to the card's top edge */
  ;[[-3.3, -2.3, 1.0], [-1.1, -2.6, 0.95], [0.75, -2.5, 1.05], [1.9, -3.1, 1.0], [3.2, -2.6, 1.1], [-2.2, -3.6, 1.05], [-0.55, -4.1, 1.0], [1.2, -4.3, 1.1], [2.8, -4.6, 1.0], [-3.6, -4.8, 1.1]].forEach(([x, z, k]) => tree(scene, x, z, k))

  /* the automatic signal: pole, a head with three lamps turned to the approach and the camera, the green-time bar */
  const sigG = new THREE.Group()
  sigG.position.copy(P01.sig)
  const poleM = mat('#5C6678', { roughness: 0.4, metalness: 0.5 })
  sigG.add(cyl(0.025, 0.03, 1.0, poleM, [0, 0.56, 0], 14))
  sigG.add(cyl(0.07, 0.08, 0.06, poleM, [0, 0.09, 0], 16))
  const head = new THREE.Group()
  head.position.set(0, 1.26, 0)
  head.rotation.y = -0.3
  head.scale.setScalar(1.75)
  head.add(box(0.15, 0.42, 0.1, mat('#1E2638', { roughness: 0.4 }), [0, 0, 0], 0.02))
  const lampR = glowM('#FF5A4E', '#4A2A2A')
  const lampA = glowM('#FFB020', '#4A3A20')
  const lampG = glowM('#2EE27A', '#20402C')
  ;[lampR, lampA, lampG].forEach((m, i) => {
    const l = cyl(0.045, 0.045, 0.02, m, [0, 0.13 - i * 0.13, 0.055], 20)
    l.rotation.x = Math.PI / 2
    head.add(flat(l))
    const visor = cyl(0.055, 0.055, 0.04, mat('#1E2638'), [0, 0.13 - i * 0.13 + 0.03, 0.07], 20, )
    visor.rotation.x = Math.PI / 2
    visor.scale.set(1, 1, 0.4)
    head.add(flat(visor))
  })
  const glowG = halo('rgba(60,240,130,0.9)', 0.32)
  glowG.position.set(0, -0.13, 0.08)
  head.add(glowG)
  const glowR = halo('rgba(255,90,80,0.9)', 0.32)
  glowR.position.set(0, 0.13, 0.08)
  head.add(glowR)
  const glowA = halo('rgba(255,180,40,0.9)', 0.32)
  glowA.position.set(0, 0, 0.08)
  head.add(glowA)
  const bar = ledBar('#2EE27A')
  bar.g.position.set(0.15, -0.02, 0)
  head.add(bar.g)
  sigG.add(head)
  sigG.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(sigG)

  /* the cars: one per record, colours from the deck's warm-and-blue set; the stalled car is light grey */
  const palette = ['#2D63FB', '#FFFFFF', '#F2C14E', '#12B5A8', '#1F2E63', '#8FB3FF', '#E9EEF6', '#5B8DEF']
  const tint = paintCars(sim.cars, palette)
  /* the car that stalls in THIS loop: the one standing at its place in the middle of the stall */
  const stallJ = sim.cars.findIndex((tr) => {
    const s = trackAt(tr, (STALL[0] + STALL[1]) / 2)
    return !!s && s.z > 0 && Math.abs(s.x - P01.stallX) < 0.3
  })
  const cars = sim.cars.map((_, j) => {
    const car = makeCar(j === stallJ ? '#C9D1DE' : tint[j])
    scene.add(car.g)
    return car
  })
  const crossTint = paintCars(sim.cross, palette.slice(3).concat(palette.slice(0, 3)))
  const crossCars = sim.cross.map((_, j) => {
    const car = makeCar(crossTint[j])
    scene.add(car.g)
    return car
  })
  /* the stalled car's hazard glow, front and back */
  const hazGlow = [halo('rgba(255,150,70,0.95)', 0.3), halo('rgba(255,150,70,0.95)', 0.3)]
  hazGlow.forEach((h, i) => {
    h.position.set(i ? 0.26 : -0.26, 0.13, 0)
    cars[stallJ].g.add(h)
  })
  const clk = slideClock('T01', scene, devHold(HOLD01), NOBODY())

  const holdT = devHold(HOLD01)
  return (t: number) => {
    const c = mod(clk.time(t), L01)
    /* hazards blink; a held frame shows them on */
    const blink = t === holdT || Math.sin(c * TAU * 1.6) > 0
    /* the signal */
    const ms = mainState(c)
    lampG.emissiveIntensity = ms === 'G' ? 2.4 : 0
    lampA.emissiveIntensity = ms === 'A' ? 2.4 : 0
    lampR.emissiveIntensity = ms === 'R' ? 2.4 : 0
    ;(glowG.material as THREE.MeshBasicMaterial).opacity = ms === 'G' ? 0.75 : 0
    ;(glowR.material as THREE.MeshBasicMaterial).opacity = ms === 'R' ? 0.6 : 0
    ;(glowA.material as THREE.MeshBasicMaterial).opacity = ms === 'A' ? 0.6 : 0
    bar.set(greenLeft(c))
    /* the cars */
    cars.forEach((car) => (car.g.visible = false))
    carsAt(sim.cars, c, (_, s, j) => {
      const car = cars[j]
      car.g.visible = true
      car.g.position.set(s.x, 0.003, s.z)
      car.g.rotation.y = s.yaw
      car.wheels.forEach((w) => (w.rotation.z = -s.x / 0.055))
      const stalled = j === stallJ && c >= STALL[0] + 0.15 && c < STALL[1]
      car.hazM.emissiveIntensity = stalled ? (blink ? 2.6 : 0.1) : 0
      car.headM.emissiveIntensity = stalled ? (blink ? 1.2 : 0) : 0.35
      if (j === stallJ)
        hazGlow.forEach((h) => {
          ;(h.material as THREE.MeshBasicMaterial).opacity = stalled && blink ? 0.95 : 0
          h.quaternion.copy(camera.quaternion)
        })
    })
    crossCars.forEach((car) => (car.g.visible = false))
    carsAt(sim.cross, c, (_, s, j) => {
      const car = crossCars[j]
      car.g.visible = true
      car.g.position.set(P01.crossX, 0.003, s.x)
      car.g.rotation.y = -Math.PI / 2
      car.wheels.forEach((w) => (w.rotation.z = -s.x / 0.055))
      car.headM.emissiveIntensity = 0.35
    })
  }
}

/* ------------------------------------------------------------------ T01 concept: the application */

/*
 * The concept's request lane is the same 1D road as the junction's main road (same model, same queue), drawn on a
 * path that comes in from the card's lower left: straight from BEND to the platform, and before it a bend of radius
 * BEND_R turning BEND_A toward the camera, then straight again. `lat` is the lane offset (+ the near lane).
 */
const BEND = -0.95
const BEND_R = 1.0
const BEND_A = 1.12
function laneAt(sx: number, lat: number, out: THREE.Vector3): THREE.Vector3 {
  if (sx >= BEND) return out.set(sx, 0, lat)
  const d = BEND - sx
  const th = Math.min(d / BEND_R, BEND_A)
  /* the arc's centre is toward the camera; the normal (+lat) at angle th is (sin th, cos th) */
  let x = BEND - BEND_R * Math.sin(th)
  let z = BEND_R * (1 - Math.cos(th))
  const rest = d - BEND_R * th
  if (rest > 0) {
    x -= Math.cos(BEND_A) * rest
    z += Math.sin(BEND_A) * rest
  }
  return out.set(x + Math.sin(th) * lat, 0, z + Math.cos(th) * lat)
}
const laneYaw = (sx: number) => (sx >= BEND ? 0 : Math.min((BEND - sx) / BEND_R, BEND_A))

function setupT01Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  frameCam01(camera)
  lights(scene, [0.3, 0, 0])
  const sim = simOf('app')

  const ground = flat(mesh(new THREE.PlaneGeometry(60, 60), mat('#E6EDFA', { roughness: 0.95, toneMapped: false, emissive: new THREE.Color('#E6EDFA'), emissiveIntensity: 0.32 }), [0, -0.002, 0]))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  /* the request lane: two lanes of navy track, coming in from the lower left (a bend) and straight up to the platform */
  const trackM = mat('#26346B', { roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide })
  const edgeM = glowM('#7FA6FF', '#BFD3FF', { side: THREE.DoubleSide })
  edgeM.emissiveIntensity = 0.9
  const dashM = mat('#5C6FA8', { side: THREE.DoubleSide })
  const strip = (s0: number, s1: number, l0: number, l1: number, y: number, m: THREE.Material) => {
    const N = 64
    const pos: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= N; i++) {
      const sx = lerp(s0, s1, i / N)
      const a = laneAt(sx, l0, V1)
      const b = laneAt(sx, l1, V2)
      pos.push(a.x, y, a.z, b.x, y, b.z)
      if (i < N) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    const o = new THREE.Mesh(g, m)
    o.receiveShadow = true
    scene.add(o)
  }
  const V1 = new THREE.Vector3()
  const V2 = new THREE.Vector3()
  const hw = P01.roadW / 2
  strip(-9, 0.0, -hw, hw, 0.003, trackM)
  strip(-9, 0.0, -hw + 0.008, -hw + 0.032, 0.008, edgeM)
  strip(-9, 0.0, hw - 0.032, hw - 0.008, 0.008, edgeM)
  for (let x = -8.8; x < P01.stopX - 0.1; x += 0.42) strip(x, x + 0.22, -0.0125, 0.0125, 0.007, dashM)
  /* the platform's edge where requests wait: a glowing threshold (the stop line's place) */
  const gateM = glowM(C.brand, '#9BB6FF')
  scene.add(flat(box(0.04, 0.012, P01.roadW - 0.06, gateM, [P01.stopX - 0.02, 0.01, 0])))
  /* the platform: a white slab with a soft blue rim, holding the instance blocks */
  const plat = { x0: -0.05, x1: 1.9, z0: -0.92, z1: 1.42 }
  scene.add(box(plat.x1 - plat.x0, 0.1, plat.z1 - plat.z0, mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#F4F7FF'), emissiveIntensity: 0.3 }), [(plat.x0 + plat.x1) / 2, 0.05, (plat.z0 + plat.z1) / 2], 0.04))
  scene.add(flat(box(plat.x1 - plat.x0 + 0.04, 0.03, plat.z1 - plat.z0 + 0.04, mat('#C9D7F7', { roughness: 0.5 }), [(plat.x0 + plat.x1) / 2, 0.015, (plat.z0 + plat.z1) / 2], 0.02)))
  /* the autoscaler: a pole where the signal stands, a status lamp and the capacity bar */
  const poleG = new THREE.Group()
  poleG.position.copy(P01.sig)
  const poleM = mat('#5C6678', { roughness: 0.4, metalness: 0.5 })
  poleG.add(cyl(0.025, 0.03, 1.0, poleM, [0, 0.56, 0], 14))
  poleG.add(cyl(0.07, 0.08, 0.06, poleM, [0, 0.09, 0], 16))
  const head = new THREE.Group()
  head.position.set(0, 1.26, 0)
  head.rotation.y = -0.3
  head.scale.setScalar(1.75)
  head.add(box(0.15, 0.42, 0.1, mat('#1E2638', { roughness: 0.4 }), [0, 0, 0], 0.02))
  /* three small block glyphs stacked in the head: the scaler's face, lit blue when it adds or removes blocks */
  const scM = glowM('#5B8DEF', '#3A4458')
  for (let i = 0; i < 3; i++) head.add(flat(box(0.09, 0.07, 0.02, scM, [0, 0.12 - i * 0.12, 0.055], 0.012)))
  const bar = ledBar('#6FA0FF')
  bar.g.position.set(0.15, -0.02, 0)
  head.add(bar.g)
  poleG.add(head)
  poleG.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(poleG)

  /* the instance blocks: glossy blue rounded cubes with server slots and a status lamp */
  const blockM = mat(C.brand, { roughness: 0.22, metalness: 0.15, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.12 })
  const failM = mat(C.orange, { roughness: 0.3, metalness: 0.1, emissive: new THREE.Color(colors.accentDark), emissiveIntensity: 0.25 })
  const slotM = mat('#E9F0FF', { roughness: 0.4 })
  const blocks = BLOCKS.map(([x, z]) => {
    const g = new THREE.Group()
    const body = box(0.44, 0.44, 0.44, blockM, [0, 0.22, 0], 0.06)
    g.add(body)
    for (let i = 0; i < 3; i++) g.add(flat(box(0.3, 0.035, 0.01, slotM, [-0.02, 0.33 - i * 0.09, 0.222], 0.006)))
    const ledM = glowM(C.green, '#BFF5D2')
    g.add(flat(sphere(0.025, ledM, [0.15, 0.33, 0.225])))
    const flashM = glowM('#9CC2FF', '#FFFFFF')
    const top = flat(box(0.36, 0.012, 0.36, flashM, [0, 0.445, 0], 0.005))
    g.add(top)
    g.position.set(x, 0.1, z)
    g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
    scene.add(g)
    return { g, body, ledM, flashM }
  })
  const cross = badge(crossTex(), 0.26)
  scene.add(cross)

  /* the requests: glowing tokens on the lane, then routed into a block */
  const reqM = glowM(C.brand, '#7FA6FF')
  reqM.emissiveIntensity = 0.55
  const reqs = sim.cars.map(() => {
    const m = box(0.2, 0.12, 0.16, reqM, [0, 0, 0], 0.04)
    m.castShadow = true
    scene.add(m)
    return m
  })
  /* route: when each request crosses the platform's edge, the next working block (round robin) takes it */
  const ENTER = P01.stopX + 0.25
  const routes = sim.cars.map((tr) => {
    for (let i = 0; i < tr.x.length; i++) if (tr.x[i] >= ENTER) return { t: (tr.from + i) / HZ, z: tr.z[i] }
    return null
  })
  const order = routes
    .map((r, j) => ({ r, j }))
    .filter((q) => q.r)
    .sort((a, b) => a.r!.t - b.r!.t)
  const target = new Array<number>(sim.cars.length).fill(0)
  let rr = 0
  for (const q of order) {
    const tc = mod(q.r!.t, L01)
    const up = BLOCKS.map((_, i) => i).filter((i) => blockUp(i, tc))
    target[q.j] = up[rr++ % up.length]
  }
  const RIDE = 0.55
  const clk = slideClock('T01', scene, devHold(HOLD01), NOBODY())
  const tmp = new THREE.Vector3()
  const dst = new THREE.Vector3()

  return (t: number) => {
    const c = mod(clk.time(t), L01)
    /* blocks: scale in / out, the failed one orange, the fresh one rising */
    let active = 0
    blocks.forEach((b, i) => {
      const s = blockScale(i, c)
      active += s
      b.g.visible = s > 0.01
      b.g.scale.set(lerp(0.4, 1, s), s, lerp(0.4, 1, s))
      const failed = blockFailed(i, c)
      b.body.material = failed ? failM : blockM
      b.ledM.color.set(failed ? '#FFD3B0' : '#BFF5D2')
      b.ledM.emissive.set(failed ? C.orange : C.green)
      b.ledM.emissiveIntensity = failed ? (Math.sin(c * TAU * 1.6) > 0 ? 2.4 : 0.2) : 1.4 + 0.4 * Math.sin(c * TAU * 0.9 + i)
      b.flashM.emissiveIntensity = 0
    })
    bar.set(active / BLOCKS.length)
    const scaling = Math.max(hold(c, 1.3, 1.45, 2.0, 2.2), hold(c, 5.5, 5.65, 6.2, 6.4), hold(c, 3.75, 3.85, 4.3, 4.45))
    scM.emissiveIntensity = 0.3 + 1.8 * scaling * (0.6 + 0.4 * Math.sin(c * TAU * 3))
    /* the cross over the failed block */
    const fb = blocks[FAIL_IDX]
    const fk = blockFailed(FAIL_IDX, c) ? pop(c, FAIL.at) * (1 - seg(c, FAIL.sink[0], FAIL.sink[0] + 0.2)) : 0
    cross.visible = fk > 0.01
    if (cross.visible) {
      cross.position.set(fb.g.position.x, 0.88, fb.g.position.z)
      cross.quaternion.copy(camera.quaternion)
      cross.scale.setScalar(fk)
    }
    /* the requests */
    reqs.forEach((r) => (r.visible = false))
    carsAt(sim.cars, c, (_, s, j) => {
      const r = reqs[j]
      const rt = routes[j]
      const into = rt ? mod(c - mod(rt.t, L01), L01) : -1
      const routed = rt && s.x >= ENTER && into >= 0 && into < 3
      if (!routed) {
        r.visible = true
        const q = laneAt(s.x, s.z, tmp)
        r.position.set(q.x, 0.075 + 0.015 * Math.sin(c * TAU * 2 + j), q.z)
        r.scale.setScalar(1)
        r.rotation.set(0, laneYaw(s.x), 0)
        return
      }
      if (into > RIDE + 0.12) return
      const b = blocks[target[j]]
      const k = sm(into / RIDE)
      tmp.set(ENTER, 0.075, rt!.z).lerp(dst.set(b.g.position.x, 0.6, b.g.position.z), k)
      tmp.y += Math.sin(k * Math.PI) * 0.35
      r.visible = true
      r.position.copy(tmp)
      r.scale.setScalar(1 - seg(into, RIDE - 0.05, RIDE + 0.12) * 0.9)
      /* the block flashes as it takes the request */
      b.flashM.emissiveIntensity = Math.max(b.flashM.emissiveIntensity, 2.2 * hold(into, RIDE - 0.1, RIDE, RIDE + 0.05, RIDE + 0.3))
    })
  }
}

/* ================================================================== T05 - the travel checklist */

const L05 = 9
const HOLD05 = 7.35 /* every item ticked, all three trips (environments) lit */
const F05 = 108
const T05 = {
  pen: [0.25, 0.55] as const,
  ticks: [0.75, 1.5, 2.25, 3.0],
  trips: [3.8, 5.05, 6.3],
  fly: 0.85, // the plane / the copy in flight
  clear: [8.1, 8.6] as const,
}
/** how many rows are ticked at c (0..4) */
const ticked05 = (c: number) => (c >= T05.clear[0] + 0.25 ? 0 : T05.ticks.filter((a) => c >= a).length)
/** each trip's lit amount */
const tripOn = (c: number, i: number) => seg(c, T05.trips[i] + T05.fly - 0.1, T05.trips[i] + T05.fly + 0.15) * (1 - seg(c, T05.clear[0], T05.clear[1]))
const X05 = { who: -1.42, table: -0.52, bag: 0.12, cab: 1.3, door: [0.78, 1.86] as const }
const WALL = -1.0
/* the destinations (map pins / environments): same x on both cards */
/* (the map and the shelf of environments hang left of the doorway, with a clear gap to its frame) */
const DEST: [number, number][] = [
  [-0.88, 1.78],
  [-0.28, 1.87],
  [0.28, 1.72],
]
const HOME: [number, number] = [-0.32, 1.44]

/** a checklist: four rows, an icon each and a box that gets a green tick; `kind` picks the icons */
function drawChecklist(g: CanvasRenderingContext2D, w: number, h: number, n: number, kind: 'travel' | 'app', paper: string) {
  g.fillStyle = paper
  g.beginPath()
  g.roundRect(0, 0, w, h, 10)
  g.fill()
  const rowH = (h - 24) / 4
  for (let i = 0; i < 4; i++) {
    const y = 14 + i * rowH
    const cy = y + rowH / 2
    /* the tick box */
    const bx = 14
    const bs = rowH * 0.56
    g.strokeStyle = '#9AA8C2'
    g.lineWidth = 3
    g.beginPath()
    g.roundRect(bx, cy - bs / 2, bs, bs, 5)
    g.stroke()
    if (i < n) {
      g.strokeStyle = C.greenDark
      g.lineWidth = 6
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.beginPath()
      g.moveTo(bx + bs * 0.18, cy)
      g.lineTo(bx + bs * 0.42, cy + bs * 0.26)
      g.lineTo(bx + bs * 0.92, cy - bs * 0.42)
      g.stroke()
    }
    /* the row's icon */
    const ix = bx + bs + 16
    const s = rowH * 0.62
    drawRowIcon(g, kind, i, ix, cy - s / 2, s)
    /* a grey line for the row (never words) */
    g.fillStyle = '#D5DCE8'
    g.beginPath()
    g.roundRect(ix + s * 1.6 + 6, cy - 4, w - (ix + s * 1.6 + 6) - 16, 8, 4)
    g.fill()
  }
}
function drawRowIcon(g: CanvasRenderingContext2D, kind: 'travel' | 'app', i: number, x: number, y: number, s: number) {
  const W1 = s * 1.5
  g.save()
  if (kind === 'travel') {
    if (i === 0) {
      /* a ticket: blue stub with a notch */
      g.fillStyle = C.brand
      g.beginPath()
      g.roundRect(x, y + s * 0.15, W1, s * 0.7, 5)
      g.fill()
      g.fillStyle = '#FFFFFF'
      g.fillRect(x + W1 * 0.66, y + s * 0.2, 2.5, s * 0.6)
      g.beginPath()
      g.arc(x + W1 * 0.33, y + s * 0.5, s * 0.14, 0, TAU)
      g.fill()
    } else if (i === 1) {
      /* a passport: maroon booklet, gold emblem */
      g.fillStyle = '#7A2E45'
      g.beginPath()
      g.roundRect(x + W1 * 0.25, y, W1 * 0.5, s, 4)
      g.fill()
      g.strokeStyle = C.gold
      g.lineWidth = 2.5
      g.beginPath()
      g.arc(x + W1 * 0.5, y + s * 0.42, s * 0.16, 0, TAU)
      g.stroke()
    } else if (i === 2) {
      /* a suitcase */
      g.fillStyle = '#12B5A8'
      g.beginPath()
      g.roundRect(x + W1 * 0.18, y + s * 0.22, W1 * 0.64, s * 0.78, 5)
      g.fill()
      g.strokeStyle = '#0E9285'
      g.lineWidth = 3
      g.beginPath()
      g.roundRect(x + W1 * 0.38, y + s * 0.04, W1 * 0.24, s * 0.2, 3)
      g.stroke()
    } else {
      /* a cab */
      g.fillStyle = C.taxi
      g.beginPath()
      g.roundRect(x, y + s * 0.38, W1, s * 0.38, 5)
      g.fill()
      g.beginPath()
      g.roundRect(x + W1 * 0.22, y + s * 0.12, W1 * 0.5, s * 0.32, 5)
      g.fill()
      g.fillStyle = '#2B3A5C'
      g.beginPath()
      g.arc(x + W1 * 0.25, y + s * 0.8, s * 0.13, 0, TAU)
      g.arc(x + W1 * 0.75, y + s * 0.8, s * 0.13, 0, TAU)
      g.fill()
    }
  } else {
    if (i === 0) {
      /* a config card: a gear on a white card */
      g.fillStyle = '#E6EEFF'
      g.beginPath()
      g.roundRect(x, y + s * 0.1, W1, s * 0.8, 5)
      g.fill()
      gear(g, x + W1 * 0.5, y + s * 0.5, s * 0.3, C.brand)
    } else if (i === 1) {
      /* the dependency booklet: navy booklet, three small cubes */
      g.fillStyle = C.navy
      g.beginPath()
      g.roundRect(x + W1 * 0.25, y, W1 * 0.5, s, 4)
      g.fill()
      g.fillStyle = '#9CC2FF'
      g.fillRect(x + W1 * 0.36, y + s * 0.5, s * 0.18, s * 0.18)
      g.fillRect(x + W1 * 0.52, y + s * 0.5, s * 0.18, s * 0.18)
      g.fillRect(x + W1 * 0.44, y + s * 0.3, s * 0.18, s * 0.18)
    } else if (i === 2) {
      /* the app package */
      g.fillStyle = C.brand
      g.beginPath()
      g.roundRect(x + W1 * 0.14, y + s * 0.06, W1 * 0.72, s * 0.88, 6)
      g.fill()
      appGlyph(g, x + W1 * 0.26, y + s * 0.24, W1 * 0.48, s * 0.5)
    } else {
      /* the deploy rocket: white body, blue nose and fins, a window */
      const cx = x + W1 * 0.5
      g.fillStyle = C.brand
      g.beginPath()
      g.moveTo(cx - s * 0.16, y + s * 0.62)
      g.lineTo(cx - s * 0.34, y + s * 0.92)
      g.lineTo(cx + s * 0.34, y + s * 0.92)
      g.lineTo(cx + s * 0.16, y + s * 0.62)
      g.closePath()
      g.fill()
      g.fillStyle = '#FFFFFF'
      g.strokeStyle = C.brand
      g.lineWidth = 2.5
      g.beginPath()
      g.roundRect(cx - s * 0.17, y + s * 0.26, s * 0.34, s * 0.6, s * 0.06)
      g.fill()
      g.stroke()
      g.fillStyle = C.brand
      g.beginPath()
      g.moveTo(cx - s * 0.17, y + s * 0.28)
      g.quadraticCurveTo(cx, y - s * 0.06, cx + s * 0.17, y + s * 0.28)
      g.closePath()
      g.fill()
      g.beginPath()
      g.arc(cx, y + s * 0.48, s * 0.08, 0, TAU)
      g.fill()
    }
  }
  g.restore()
}
function gear(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  g.fillStyle = color
  g.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU
    const rr = i % 2 === 0 ? r : r * 0.78
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
  g.fillStyle = '#E6EEFF'
  g.beginPath()
  g.arc(cx, cy, r * 0.36, 0, TAU)
  g.fill()
}

/* the camera: eye level a little above, the room's four places and the back wall's map in view */
function frameCam05(camera: THREE.PerspectiveCamera) {
  camera.fov = 41
  camera.position.set(0.0, 1.5, 3.75)
  camera.lookAt(0.0, 1.06, -0.6)
  camera.updateProjectionMatrix()
}

/** the shared room of T05: back wall with a glass opening on the right, floor, skirting */
function room05(scene: THREE.Scene, o: { wall: string; floor: THREE.Texture; trim: string; frame: string; outside: string; ground: string; glow?: number; /** how far the outside runs behind the wall (the street with the cab: 5) */ deep?: number }) {
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.3 })
  const fl = flat(mesh(new THREE.PlaneGeometry(7, 6), mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  fl.receiveShadow = true
  scene.add(fl)
  const [d0, d1] = X05.door
  const dh = 2.05
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, WALL - 0.06])))
  part(-3.4, d0, 0, 3.2)
  part(d0, d1, dh, 3.2)
  part(d1, 3.6, 0, 3.2)
  scene.add(box(7, 0.1, 0.03, mat(o.trim, { roughness: 0.7 }), [0.1, 0.05, WALL + 0.015]))
  const frameM = mat(o.frame, { roughness: 0.5, metalness: 0.2 })
  scene.add(box(0.06, dh, 0.16, frameM, [d0 - 0.03, dh / 2, WALL + 0.02]), box(0.06, dh, 0.16, frameM, [d1 + 0.03, dh / 2, WALL + 0.02]), box(d1 - d0 + 0.12, 0.06, 0.16, frameM, [(d0 + d1) / 2, dh + 0.03, WALL + 0.02]))
  /* the outside: a ground strip and a sky plane */
  const outM = new THREE.MeshBasicMaterial({ color: o.outside, toneMapped: false })
  const deep = o.deep ?? 1.6
  const k = deep / 1.6
  const sky = new THREE.Mesh(new THREE.PlaneGeometry((d1 - d0 + 1.4) * k, (dh + 0.6) * k), outM)
  sky.position.set((d0 + d1) / 2, ((dh + 0.6) * k) / 2 - 0.1, WALL - deep)
  scene.add(sky)
  const gr = flat(mesh(new THREE.PlaneGeometry((d1 - d0 + 1.6) * k, deep), mat(o.ground, { roughness: 0.9 }), [(d0 + d1) / 2, 0.002, WALL - deep / 2]))
  gr.rotation.x = -Math.PI / 2
  gr.receiveShadow = true
  scene.add(gr)
  /* a pane of glass in the opening (very faint) */
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(d1 - d0, dh), new THREE.MeshBasicMaterial({ color: '#DDEBFF', transparent: true, opacity: 0.12, depthWrite: false }))
  glass.position.set((d0 + d1) / 2, dh / 2, WALL - 0.03)
  scene.add(glass)
  return { wallM }
}

/** the badges over the four items and the flight / deploy arcs, shared by both cards */
function tickBadges(scene: THREE.Scene, at: THREE.Vector3[]) {
  const tex = tickTex()
  return at.map((p) => {
    const b = badge(tex, 0.17)
    b.position.copy(p)
    scene.add(b)
    return b
  })
}
function setBadges(badges: THREE.Mesh[], c: number, camera: THREE.Camera) {
  badges.forEach((b, i) => {
    const on = c >= T05.ticks[i] && c < T05.clear[1]
    const out = seg(c, T05.clear[0], T05.clear[1])
    /* a little re-pulse at each trip: the same checklist, every trip */
    const pulse = T05.trips.reduce((a, s) => a + hold(c, s, s + 0.12, s + 0.12, s + 0.35) * 0.18, 0)
    const k = on ? pop(c, T05.ticks[i]) * (1 - out) * (1 + pulse) : 0
    b.visible = k > 0.01
    b.scale.setScalar(Math.max(0.001, k))
    b.quaternion.copy(camera.quaternion)
  })
}
/** an arc of dots from a to b that fills in as k goes 0 -> 1 (a flight path / a deploy path) */
function dotArc(scene: THREE.Scene, a: THREE.Vector3, b: THREE.Vector3, lift: number, color: string, n = 9, r = 0.016, ctrl?: THREE.Vector3) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false })
  const geo = new THREE.SphereGeometry(r, 10, 8)
  const pts: THREE.Mesh[] = []
  /* a sine lift between the ends, or (with `ctrl`) a curve that first rises from `a` toward `ctrl` */
  const curve = ctrl ? new THREE.QuadraticBezierCurve3(a, ctrl, b) : null
  const at = (k: number, out: THREE.Vector3) => {
    if (curve) return curve.getPoint(clamp01(k), out)
    out.lerpVectors(a, b, k)
    out.y += Math.sin(k * Math.PI) * lift
    return out
  }
  for (let i = 1; i < n; i++) {
    const d = new THREE.Mesh(geo, m)
    at(i / n, d.position)
    d.visible = false
    scene.add(d)
    pts.push(d)
  }
  return {
    at,
    set: (k: number, fade: number) => {
      m.opacity = 1 - fade
      pts.forEach((d, i) => (d.visible = fade < 0.99 && (i + 1) / n <= k))
    },
  }
}

/* ------------------------------------------------------------------ T05 everyday: the hallway */

const TRAV05_FACES: [number, string][] = [
  [0, 'neutral'],
  [0.5, 'thinking'],
  [3.15, 'happy'],
  [3.8, 'excited'],
  [7.8, 'happy'],
  [8.5, 'neutral'],
]
/* her arms: the left (screen-left) holds the clipboard at her chest, the right holds the pen */
function travArmL05(c: number): Arm {
  const up = seg(c, 0.0, 0.3) * (1 - seg(c, 8.55, 8.95))
  return { s: lerp(14, 30, up), e: lerp(16, 112, up) }
}
function travArmR05(c: number): Arm {
  const up = seg(c, T05.pen[0], T05.pen[1]) * (1 - seg(c, 8.55, 8.95))
  /* a small flick at each tick */
  const flick = T05.ticks.reduce((a, s) => a + hold(c, s - 0.18, s - 0.06, s - 0.02, s + 0.14), 0)
  /* each row sits a little lower on the clipboard */
  const row = T05.ticks.reduce((a, s) => a + seg(c, s + 0.15, s + 0.45), 0)
  const point = Math.max(...T05.trips.map((s) => hold(c, s - 0.2, s + 0.1, s + 0.7, s + 1.0)))
  return { s: lerp(10, 26 - row * 1.5, up) + 4 * flick + 26 * point, e: lerp(10, 104 + row * 2, up) - 8 * flick - 40 * point }
}
function travPose05(p: Pose, c: number) {
  const l = travArmL05(c)
  const r = travArmR05(c)
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
  /* looks: down at the list, then to each item as it is ticked, up at the map for the trips */
  const list = hold(c, 0.3, 0.5, 3.2, 3.45)
  to(p, 'headNod', 0.28, list)
  to(p, 'lookY', 0.7, list)
  const look = (s: number, turn: number, ly: number) => {
    const w = hold(c, s - 0.38, s - 0.24, s + 0.02, s + 0.18)
    to(p, 'headTurn', turn, w)
    to(p, 'lookX', 1, w)
    to(p, 'headNod', ly > 0 ? 0.18 : -0.1, w)
    to(p, 'lookY', ly, w)
  }
  look(T05.ticks[0], 0.38, 0.4)
  look(T05.ticks[1], 0.4, 0.4)
  look(T05.ticks[2], 0.45, 0.6)
  look(T05.ticks[3], 0.55, 0)
  const map = hold(c, 3.45, 3.75, 7.7, 8.0)
  to(p, 'headTurn', 0.42, map)
  to(p, 'lookX', 0.9, map)
  to(p, 'headNod', -0.22, map)
  to(p, 'lookY', -0.75, map)
  const nod = T05.trips.reduce((a, s) => a + hold(c, s + 0.85, s + 0.98, s + 1.0, s + 1.18), 0)
  to(p, 'headNod', -0.22 + 0.16, nod)
}

/* the cab's place: on the street beyond the glass door, far enough back that the whole car shows in the doorway
   (seen from the camera, the doorway looks out to the right, so the cab stands right of the door's centre) */
const CAB_Z = WALL - 4.2
const CAB_X = 3.1
/* turned three-quarters to the door: nose and headlights toward the room, the rest of the car running off behind the jamb */
const CAB_YAW = -0.62
/** a real-size cab seen nose on: 1.76 wide, 1.48 to the roof (the traveller is 1.64), roof sign, headlights */
function makeCab() {
  const g = new THREE.Group()
  const bodyM = mat(C.taxi, { roughness: 0.3, metalness: 0.15 })
  const glass = mat('#2B3A5C', { roughness: 0.12, metalness: 0.45 })
  const dark = mat('#23262E', { roughness: 0.7 })
  const chrome = mat('#C9D1DE', { roughness: 0.3, metalness: 0.6 })
  /* lower body, cabin, glass (the car's length runs along z, its nose toward the camera) */
  g.add(box(1.76, 0.62, 4.3, bodyM, [0, 0.62, 0], 0.16))
  g.add(box(1.58, 0.5, 2.3, bodyM, [0, 1.16, -0.25], 0.16))
  g.add(box(1.5, 0.4, 2.34, glass, [0, 1.17, -0.25], 0.1))
  g.add(box(1.6, 0.06, 2.0, bodyM, [0, 1.42, -0.25], 0.03))
  /* the roof sign */
  const signM = glowM('#FFE9A6', '#FFF6DA')
  signM.emissiveIntensity = 0.5
  g.add(box(0.62, 0.16, 0.26, signM, [0, 1.53, -0.1], 0.04))
  /* nose: grille, bumper, headlights */
  g.add(box(0.8, 0.16, 0.04, dark, [0, 0.66, 2.15], 0.03))
  g.add(box(1.8, 0.16, 0.2, chrome, [0, 0.36, 2.1], 0.06))
  const headM = glowM('#FFF4C8', '#F2F2EE')
  for (const x of [-0.62, 0.62]) {
    const l = cyl(0.13, 0.13, 0.04, headM, [x, 0.72, 2.15], 24)
    l.rotation.x = Math.PI / 2
    g.add(flat(l))
  }
  /* mirrors and the four wheels */
  for (const x of [-0.92, 0.92]) g.add(box(0.12, 0.1, 0.16, bodyM, [x, 1.0, 0.75], 0.03))
  for (const x of [-0.8, 0.8])
    for (const z of [-1.35, 1.35]) {
      const w = cyl(0.34, 0.34, 0.24, dark, [x, 0.34, z], 24)
      w.rotation.z = Math.PI / 2
      g.add(w)
    }
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return { g, headM }
}

function setupT05Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F4EFE6')
  frameCam05(camera)
  lights(scene, [0.0, 1.0, -0.5])
  room05(scene, { wall: '#F5E9D6', floor: plankTex('#E2CDAE', '#CDB38E'), trim: '#C9A27A', frame: '#8C6440', outside: '#BFE0F7', ground: '#C9D2DE', deep: 9 })

  /* the console table with the ticket and the passport */
  const wood = mat('#B07A4C', { roughness: 0.6 })
  const tx = X05.table
  scene.add(box(0.66, 0.04, 0.34, wood, [tx, 0.78, -0.62], 0.01))
  for (const lx of [tx - 0.29, tx + 0.29]) for (const lz of [-0.76, -0.48]) scene.add(box(0.035, 0.76, 0.035, mat('#8C5E38'), [lx, 0.38, lz]))
  const ticketTex = canvasTex(120, 56, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, 120, 56, 6)
    g.fill()
    g.fillStyle = C.brand
    g.beginPath()
    g.roundRect(0, 0, 120, 16, [6, 6, 0, 0])
    g.fill()
    g.fillStyle = '#D5DCE8'
    g.fillRect(10, 25, 56, 6)
    g.fillRect(10, 37, 40, 6)
    g.strokeStyle = '#B7C3D6'
    g.setLineDash([3, 3])
    g.beginPath()
    g.moveTo(84, 18)
    g.lineTo(84, 54)
    g.stroke()
    g.fillStyle = C.brand
    g.beginPath()
    g.moveTo(92, 34)
    g.lineTo(112, 28)
    g.lineTo(112, 40)
    g.closePath()
    g.fill()
  })
  const ticket = new THREE.Group()
  const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.12), basic(ticketTex, { transparent: false }))
  ticket.add(tk)
  ticket.position.set(tx - 0.15, 0.86, -0.6)
  ticket.scale.setScalar(1.35)
  ticket.rotation.set(-0.55, 0.15, 0)
  scene.add(ticket)
  const ppM = mat('#7A2E45', { roughness: 0.5 })
  const passport = new THREE.Group()
  passport.add(box(0.13, 0.18, 0.025, ppM, [0, 0, 0], 0.008))
  const emb = cyl(0.026, 0.026, 0.004, mat(C.gold, { metalness: 0.7, roughness: 0.3 }), [0, 0.02, 0.014], 20)
  emb.rotation.x = Math.PI / 2
  passport.add(emb)
  passport.position.set(tx + 0.17, 0.92, -0.6)
  passport.scale.setScalar(1.35)
  passport.rotation.set(-0.35, -0.2, 0.08)
  scene.add(passport)
  /* the packed suitcase: teal, upright, handle up, wheels */
  const caseM = mat('#12B5A8', { roughness: 0.35, metalness: 0.1, emissive: new THREE.Color('#12B5A8'), emissiveIntensity: 0 })
  const suitcase = new THREE.Group()
  suitcase.add(box(0.42, 0.56, 0.22, caseM, [0, 0.33, 0], 0.04))
  for (const x of [-0.1, 0, 0.1]) suitcase.add(flat(box(0.012, 0.5, 0.226, mat('#0E9285', { roughness: 0.4 }), [x, 0.33, 0])))
  const steelM = mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 })
  suitcase.add(box(0.012, 0.3, 0.012, steelM, [-0.08, 0.76, -0.05]), box(0.012, 0.3, 0.012, steelM, [0.08, 0.76, -0.05]), box(0.2, 0.03, 0.03, mat('#2C3545'), [0, 0.91, -0.05], 0.01))
  for (const x of [-0.15, 0.15]) {
    const wh = cyl(0.028, 0.028, 0.03, mat('#23262E'), [x, 0.03, 0.07], 12)
    wh.rotation.x = Math.PI / 2
    suitcase.add(wh)
  }
  /* a luggage tag */
  suitcase.add(box(0.06, 0.08, 0.008, mat(C.gold, { roughness: 0.5 }), [0.12, 0.6, 0.118], 0.005))
  suitcase.position.set(X05.bag, 0, -0.5)
  suitcase.rotation.y = -0.18
  suitcase.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(suitcase)
  /* the cab, outside the glass door, facing right */
  /* the cab: a real car (roof at about her shoulder height), parked on the street outside, nose to the door */
  const street = flat(mesh(new THREE.PlaneGeometry(9, 2.6), mat('#7C8597', { roughness: 0.85 }), [CAB_X, 0.004, CAB_Z - 0.4]))
  street.rotation.x = -Math.PI / 2
  street.scale.set(1, 1.9, 1)
  street.receiveShadow = true
  scene.add(street)
  scene.add(flat(box(9, 0.1, 0.18, mat('#E7EBF2', { roughness: 0.7 }), [CAB_X, 0.05, CAB_Z + 2.1])))
  const cab = makeCab()
  cab.g.position.set(CAB_X, 0, CAB_Z)
  cab.g.rotation.y = CAB_YAW
  scene.add(cab.g)

  /* the world map on the back wall: home and three destinations */
  const mapW = 1.6
  const mapH = 0.8
  const mapC = new THREE.Vector3(-0.3, 1.72, WALL + 0.012)
  const mapTex = canvasTex(324, 172, (g) => {
    g.fillStyle = '#CFE6F7'
    g.beginPath()
    g.roundRect(0, 0, 324, 172, 8)
    g.fill()
    g.fillStyle = '#F1E3C6'
    const blob = (pts: [number, number][]) => {
      g.beginPath()
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
      g.closePath()
      g.fill()
    }
    blob([[20, 34], [70, 22], [96, 40], [84, 70], [60, 78], [50, 100], [34, 86], [24, 60]])
    blob([[62, 104], [86, 100], [96, 128], [80, 160], [68, 150], [60, 124]])
    blob([[130, 30], [170, 22], [176, 46], [160, 58], [176, 84], [168, 120], [148, 128], [136, 96], [128, 64]])
    blob([[178, 26], [262, 18], [300, 40], [292, 70], [256, 76], [234, 96], [214, 84], [196, 60], [180, 52]])
    blob([[262, 112], [296, 108], [304, 132], [276, 140]])
  })
  const map = new THREE.Mesh(new THREE.PlaneGeometry(mapW, mapH), new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.8 }))
  map.position.copy(mapC)
  scene.add(map)
  const mframe = mat('#8C6440', { roughness: 0.5 })
  scene.add(box(mapW + 0.08, 0.04, 0.04, mframe, [mapC.x, mapC.y + mapH / 2 + 0.02, mapC.z]), box(mapW + 0.08, 0.04, 0.04, mframe, [mapC.x, mapC.y - mapH / 2 - 0.02, mapC.z]))
  scene.add(box(0.04, mapH, 0.04, mframe, [mapC.x - mapW / 2 - 0.02, mapC.y, mapC.z]), box(0.04, mapH, 0.04, mframe, [mapC.x + mapW / 2 + 0.02, mapC.y, mapC.z]))
  /* pins: a navy home pin, three destination pins that light; a glyph disc (sun, peaks, towers) for each place */
  const pinAt = (x: number, y: number, m: THREE.Material) => {
    const g = new THREE.Group()
    g.add(sphere(0.035, m, [0, 0.03, 0]))
    const cone = cyl(0.012, 0.0, 0.04, m, [0, 0.0, 0], 10)
    g.add(cone)
    g.position.set(x, y, WALL + 0.05)
    scene.add(g)
    return g
  }
  pinAt(HOME[0], HOME[1], mat(C.navy, { roughness: 0.3 }))
  const destColors = ['#FF8A3D', '#5B8DEF', '#12B5A8']
  const pins = DEST.map(([x, y], i) => {
    const m = glowM(destColors[i], '#D9DEE8')
    const p = pinAt(x, y, m)
    return { p, m }
  })
  const glyphs = DEST.map(([x, y], i) => {
    const tex = canvasTex(64, 64, (g) => {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.arc(32, 32, 30, 0, TAU)
      g.fill()
      g.strokeStyle = destColors[i]
      g.lineWidth = 3
      g.stroke()
      if (i === 0) {
        /* a beach: sun over waves */
        g.fillStyle = '#FFB020'
        g.beginPath()
        g.arc(32, 26, 10, 0, TAU)
        g.fill()
        g.strokeStyle = '#2D9CDB'
        g.lineWidth = 4
        g.beginPath()
        g.moveTo(12, 44)
        g.quadraticCurveTo(22, 38, 32, 44)
        g.quadraticCurveTo(42, 50, 52, 44)
        g.stroke()
      } else if (i === 1) {
        /* mountains with snow */
        g.fillStyle = '#5B8DEF'
        g.beginPath()
        g.moveTo(10, 48)
        g.lineTo(26, 20)
        g.lineTo(38, 40)
        g.lineTo(44, 30)
        g.lineTo(56, 48)
        g.closePath()
        g.fill()
        g.fillStyle = '#FFFFFF'
        g.beginPath()
        g.moveTo(21, 29)
        g.lineTo(26, 20)
        g.lineTo(31, 29)
        g.closePath()
        g.fill()
      } else {
        /* city towers */
        g.fillStyle = '#12B5A8'
        g.fillRect(16, 26, 9, 22)
        g.fillRect(28, 16, 9, 32)
        g.fillRect(40, 30, 9, 18)
      }
    })
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), basic(tex))
    m.position.set(x, y + 0.13, WALL + 0.07)
    m.renderOrder = 6
    m.visible = false
    scene.add(m)
    return m
  })
  const arcs = DEST.map(([x, y], i) => dotArc(scene, new THREE.Vector3(HOME[0], HOME[1] + 0.03, WALL + 0.04), new THREE.Vector3(x, y + 0.03, WALL + 0.04), 0.16, destColors[i]))
  /* a small plane glyph flying each arc */
  const planeTex = canvasTex(64, 64, (g) => {
    g.translate(32, 32)
    g.fillStyle = C.navy
    g.beginPath()
    g.moveTo(26, 0)
    g.lineTo(-18, -5)
    g.lineTo(-24, -16)
    g.lineTo(-28, -16)
    g.lineTo(-24, 0)
    g.lineTo(-28, 16)
    g.lineTo(-24, 16)
    g.lineTo(-18, 5)
    g.closePath()
    g.fill()
    g.beginPath()
    g.moveTo(6, -2)
    g.lineTo(-6, -26)
    g.lineTo(-12, -26)
    g.lineTo(-6, 0)
    g.lineTo(-12, 26)
    g.lineTo(-6, 26)
    g.lineTo(6, 2)
    g.closePath()
    g.fill()
  })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), basic(planeTex))
  plane.renderOrder = 7
  plane.visible = false
  scene.add(plane)

  /* the clipboard (with its four rows) and the pen */
  const list = liveTex(150, 200, (g, n) => {
    drawChecklist(g, 150, 200, n, 'travel', '#FFFFFF')
  })
  const clip = new THREE.Group()
  clip.add(box(0.27, 0.35, 0.012, mat('#A8774A', { roughness: 0.55 }), [0, 0, -0.008], 0.01))
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.31), basic(list.tex, { transparent: false }))
  paper.position.set(0, -0.012, 0.001)
  clip.add(paper)
  clip.add(box(0.1, 0.035, 0.02, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, 0.165, 0.006], 0.006))
  scene.add(clip)
  const pen = new THREE.Group()
  pen.add(cyl(0.009, 0.009, 0.15, mat(C.brand, { roughness: 0.3 }), [0, 0.0, 0], 10))
  pen.add(cyl(0.0, 0.009, 0.025, mat('#2C3545'), [0, -0.087, 0], 10))
  scene.add(pen)

  const badges = tickBadges(scene, [new THREE.Vector3(tx - 0.15, 1.1, -0.6), new THREE.Vector3(tx + 0.17, 1.17, -0.6), new THREE.Vector3(X05.bag, 1.12, -0.5), new THREE.Vector3(CAB_X - 0.35, 2.0, CAB_Z + 0.55)])

  /* the traveller: a young woman in travel clothes (khaki jacket, crossbody bag, jeans, trainers) */
  const tCfg = who(CAST_PRESETS.ananya, { name: 'Traveller', hair: { style: 'ponytail', color: '#2A2324' }, outfit: { top: 'tshirt', topColor: '#F4F1EA', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { watch: true, earrings: true } })
  const trav = person({
    config: tCfg,
    dress: (k) => withTop(BAG('#5A3E2A', '#8C6440'))(withTop(JACKET('#B59A64', '#7E6A40'))(k)),
    seed: 51,
    faces: TRAV05_FACES,
    pose: travPose05,
    loop: L05,
    height: 1.64,
    frames: F05,
    redraw,
    holdT: devHold(HOLD05),
  })
  const tRoot = new THREE.Vector3(X05.who, 0, -0.35)
  trav.object.position.copy(tRoot)
  scene.add(trav.object)
  const shT = buildSkin(tCfg).shoulderHalf
  const clk = slideClock('T05', scene, devHold(HOLD05), [trav, ...NOBODY()])

  const hL = new THREE.Vector3()
  const hR = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L05)
    const cq = frameT(c, L05, F05)
    trav.update(c, camera)
    /* the clipboard rides her left hand (as drawn on the frame on screen) */
    rigToWorld(handPt('L', shT, travArmL05(cq)), 1.64, tRoot, camera, hL)
    towardCamera(hL, camera, 0.16)
    clip.position.copy(hL).add(tmp.set(0.1, 0.06, 0))
    clip.quaternion.copy(camera.quaternion)
    clip.rotateX(-0.35)
    clip.rotateZ(-0.12)
    const lift = seg(cq, 0.0, 0.3) * (1 - seg(cq, 8.55, 8.95))
    clip.visible = true
    clip.scale.setScalar(1)
    if (lift < 0.5) clip.rotateX(-0.8 * (1 - lift * 2))
    list.paint(ticked05(c))
    rigToWorld(handPt('R', shT, travArmR05(cq)), 1.64, tRoot, camera, hR)
    towardCamera(hR, camera, 0.2)
    pen.position.copy(hR)
    pen.quaternion.copy(camera.quaternion)
    pen.rotateZ(0.5)

    setBadges(badges, c, camera)
    /* items glow as they are ticked */
    caseM.emissiveIntensity = 0.35 * hold(c, T05.ticks[2], T05.ticks[2] + 0.1, T05.ticks[2] + 0.3, T05.ticks[2] + 0.7)
    /* the cab: headlights flash at its tick and at each trip */
    const flash = Math.max(hold(c, T05.ticks[3], T05.ticks[3] + 0.06, T05.ticks[3] + 0.2, T05.ticks[3] + 0.3), hold(c, T05.ticks[3] + 0.35, T05.ticks[3] + 0.41, T05.ticks[3] + 0.55, T05.ticks[3] + 0.65), ...T05.trips.map((s) => hold(c, s, s + 0.06, s + 0.25, s + 0.35)))
    cab.headM.emissiveIntensity = 0.3 + 2.4 * flash
    /* the trips: a plane flies home -> each place, the pin lights, the place's glyph pops up */
    plane.visible = false
    DEST.forEach((_, i) => {
      const s = T05.trips[i]
      const k = seg(c, s, s + T05.fly)
      const fade = seg(c, T05.clear[0], T05.clear[1])
      arcs[i].set(c >= s ? k : 0, c >= s ? fade : 1)
      if (c >= s && c < s + T05.fly + 0.05) {
        plane.visible = true
        arcs[i].at(k, plane.position)
        plane.position.z = WALL + 0.09
        const ahead = arcs[i].at(Math.min(1, k + 0.02), tmp.set(0, 0, 0))
        plane.rotation.set(0, 0, Math.atan2(ahead.y - plane.position.y, ahead.x - plane.position.x + 1e-6))
      }
      const on = tripOn(c, i)
      pins[i].m.emissiveIntensity = 1.6 * on
      const gk = c >= s + T05.fly - 0.1 && c < T05.clear[1] ? pop(c, s + T05.fly - 0.1) * (1 - seg(c, T05.clear[0], T05.clear[1])) : 0
      glyphs[i].visible = gk > 0.01
      glyphs[i].scale.setScalar(Math.max(0.001, gk))
    })
  }
}

/* ------------------------------------------------------------------ T05 concept: the build room */

function setupT05Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  frameCam05(camera)
  lights(scene, [0.0, 1.0, -0.5])
  room05(scene, { wall: '#F1F5FC', floor: tileTex('#EAF0FB', '#D6E0F2', 4, [7, 6]), trim: '#1F2E63', frame: '#2C3E7E', outside: '#DCE8FA', ground: '#C3CFE6', glow: 0.62 })

  /* the checklist panel where the traveller stands: a white board on a stand, the same four rows */
  const list = liveTex(150, 200, (g, n) => {
    drawChecklist(g, 150, 200, n, 'app', '#FFFFFF')
  })
  const kiosk = new THREE.Group()
  kiosk.add(cyl(0.03, 0.035, 0.8, mat('#5C6678', { metalness: 0.5, roughness: 0.4 }), [0, 0.4, 0], 12))
  kiosk.add(cyl(0.16, 0.18, 0.03, mat('#5C6678', { metalness: 0.5, roughness: 0.4 }), [0, 0.015, 0], 24))
  kiosk.add(box(0.6, 0.78, 0.04, mat(C.navy, { roughness: 0.35 }), [0, 1.18, 0], 0.03))
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), basic(list.tex, { transparent: false }))
  board.position.set(0, 1.18, 0.022)
  kiosk.add(board)
  kiosk.position.set(X05.who, 0, -0.35)
  kiosk.rotation.y = 0.28
  kiosk.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(kiosk)

  /* the table: the config card and the dependency booklet */
  const tx = X05.table
  const deskM = mat('#FFFFFF', { roughness: 0.35 })
  scene.add(box(0.66, 0.04, 0.34, deskM, [tx, 0.78, -0.62], 0.01))
  for (const lx of [tx - 0.29, tx + 0.29]) for (const lz of [-0.76, -0.48]) scene.add(box(0.035, 0.76, 0.035, mat('#C9D5EC'), [lx, 0.38, lz]))
  const cfgTex = canvasTex(120, 56, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, 120, 56, 6)
    g.fill()
    g.fillStyle = '#E6EEFF'
    g.beginPath()
    g.roundRect(4, 4, 112, 48, 5)
    g.fill()
    gear(g, 30, 28, 15, C.brand)
    g.fillStyle = '#C3CCDD'
    g.fillRect(54, 18, 52, 6)
    g.fillRect(54, 32, 38, 6)
  })
  const cfg = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.12), basic(cfgTex, { transparent: false }))
  cfg.position.set(tx - 0.15, 0.86, -0.6)
  cfg.scale.setScalar(1.35)
  cfg.rotation.set(-0.55, 0.15, 0)
  scene.add(cfg)
  const dep = new THREE.Group()
  dep.add(box(0.13, 0.18, 0.025, mat(C.navy, { roughness: 0.45 }), [0, 0, 0], 0.008))
  const cubeM = mat('#9CC2FF', { roughness: 0.3, emissive: new THREE.Color('#5B8DEF'), emissiveIntensity: 0.2 })
  for (const [x, y] of [
    [-0.025, -0.02],
    [0.025, -0.02],
    [0, 0.025],
  ])
    dep.add(box(0.036, 0.036, 0.02, cubeM, [x, y, 0.02], 0.004))
  dep.position.set(tx + 0.17, 0.92, -0.6)
  dep.scale.setScalar(1.35)
  dep.rotation.set(-0.35, -0.2, 0.08)
  scene.add(dep)
  /* the app package: a royal-blue crate with the app window on its face */
  const crateM = mat(C.brand, { roughness: 0.28, metalness: 0.12, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.05 })
  const appTex = canvasTex(100, 80, (g) => appGlyph(g, 4, 4, 92, 72))
  const makeCrate = (s: number) => {
    const g = new THREE.Group()
    g.add(box(0.44, 0.44, 0.3, crateM, [0, 0.22, 0], 0.04))
    g.add(flat(box(0.446, 0.04, 0.306, mat(C.brandDark, { roughness: 0.4 }), [0, 0.36, 0], 0.01)))
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.24), basic(appTex, { transparent: false }))
    face.position.set(0, 0.2, 0.152)
    g.add(face)
    g.scale.setScalar(s)
    g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
    return g
  }
  const crate = makeCrate(1)
  crate.position.set(X05.bag, 0, -0.5)
  crate.rotation.y = -0.18
  scene.add(crate)
  /* the deploy rocket on its pad, outside the opening (where the cab waits) */
  const shuttle = new THREE.Group()
  const shellM = mat('#FFFFFF', { roughness: 0.25, metalness: 0.1, emissive: new THREE.Color('#EAF1FF'), emissiveIntensity: 0.2 })
  const blueM = mat(C.brand, { roughness: 0.3, metalness: 0.1 })
  shuttle.add(cyl(0.34, 0.38, 0.08, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [0, 0.04, 0], 32))
  shuttle.add(cyl(0.15, 0.15, 0.62, shellM, [0, 0.55, 0], 32))
  shuttle.add(cyl(0.0, 0.15, 0.3, blueM, [0, 1.01, 0], 32))
  shuttle.add(cyl(0.15, 0.11, 0.1, mat('#5C6678', { metalness: 0.5 }), [0, 0.19, 0], 24))
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    const fin = box(0.03, 0.24, 0.16, blueM, [0, 0, 0], 0.01)
    fin.position.set(Math.sin(a) * 0.17, 0.32, Math.cos(a) * 0.17)
    fin.rotation.y = a
    shuttle.add(fin)
  }
  const lampM = glowM('#BFD6FF', '#2C3E7E')
  const win = cyl(0.06, 0.06, 0.02, lampM, [0, 0.66, 0.15], 24)
  win.rotation.x = Math.PI / 2
  shuttle.add(flat(win))
  /* the engine glow: lights at its tick and at each deploy */
  const fire = halo('rgba(255,190,90,0.95)', 0.5)
  fire.position.set(0, 0.12, 0.2)
  shuttle.add(fire)
  shuttle.position.set(X05.cab, 0.0, WALL - 0.7)
  shuttle.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(shuttle)

  /* the three environments on a wall shelf where the map hangs: a laptop, a server, a cloud; each has a screen */
  const shelfY = 1.52
  scene.add(box(1.66, 0.04, 0.32, mat('#FFFFFF', { roughness: 0.4 }), [-0.3, shelfY - 0.02, WALL + 0.16], 0.01))
  const offTex = canvasTex(100, 80, (g) => {
    g.fillStyle = '#1E2848'
    g.fillRect(0, 0, 100, 80)
  })
  const screens: { on: THREE.Mesh; dot: THREE.MeshStandardMaterial }[] = []
  const screen = (parent: THREE.Group, w: number, h: number, pos: THREE.Vector3Tuple, rotX = 0) => {
    const off = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(offTex, { transparent: false }))
    off.position.set(...pos)
    off.rotation.x = rotX
    parent.add(off)
    const on = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(appTex, { opacity: 0 }))
    on.position.set(pos[0], pos[1], pos[2] + 0.002)
    on.rotation.x = rotX
    parent.add(on)
    /* the running lamp: the same green pulse on all three */
    const dot = glowM(C.green, '#BFF5D2')
    parent.add(flat(sphere(0.018, dot, [pos[0] + w / 2 + 0.035, pos[1] - h / 2 + 0.02, pos[2]])))
    screens.push({ on, dot })
  }
  const envs: THREE.Group[] = []
  /* 1: a laptop */
  {
    const g = new THREE.Group()
    const shell = mat('#C9D1DE', { metalness: 0.5, roughness: 0.3 })
    g.add(box(0.4, 0.02, 0.26, shell, [0, 0.01, 0.02], 0.008))
    const lid = new THREE.Group()
    lid.position.set(0, 0.02, -0.1)
    lid.rotation.x = -0.12
    lid.add(box(0.4, 0.27, 0.014, shell, [0, 0.135, 0], 0.008))
    screen(lid, 0.34, 0.22, [0, 0.14, 0.009])
    g.add(lid)
    envs.push(g)
  }
  /* 2: a server */
  {
    const g = new THREE.Group()
    g.add(box(0.36, 0.46, 0.26, mat('#2C3E7E', { roughness: 0.35, metalness: 0.3 }), [0, 0.23, 0], 0.025))
    for (let i = 0; i < 3; i++) g.add(flat(box(0.28, 0.025, 0.01, mat('#9CB3E8'), [-0.0, 0.08 + i * 0.05, 0.132], 0.005)))
    screen(g, 0.28, 0.17, [0, 0.34, 0.133])
    envs.push(g)
  }
  /* 3: a cloud */
  {
    const g = new THREE.Group()
    const cm = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#DCE8FF'), emissiveIntensity: 0.35 })
    for (const [x, y, r] of [
      [-0.15, 0.16, 0.13],
      [0.0, 0.25, 0.17],
      [0.16, 0.17, 0.13],
      [0.06, 0.12, 0.13],
      [-0.06, 0.12, 0.12],
    ] as const)
      g.add(sphere(r, cm, [x, y, -0.06]))
    screen(g, 0.26, 0.16, [0, 0.18, 0.11])
    envs.push(g)
  }
  envs.forEach((g, i) => {
    g.position.set(DEST[i][0], shelfY, WALL + 0.16)
    g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
    scene.add(g)
  })
  /* deploy arcs from the package up to each environment, and the copy that rides each */
  const src = new THREE.Vector3(X05.bag, 0.92, -0.5)
  const envColors = ['#FF8A3D', '#5B8DEF', '#12B5A8']
  /* each arc rises from the package to the shelf's front edge under its environment (below the shelf, so no arc crosses another environment) */
  const arcs = DEST.map(([x], i) => dotArc(scene, src, new THREE.Vector3(x, shelfY - 0.07, WALL + 0.34), 0, envColors[i], 11, 0.018, new THREE.Vector3(X05.bag + (x - X05.bag) * 0.6, shelfY + 0.06, -0.55)))
  const copy = makeCrate(0.32)
  copy.visible = false
  scene.add(copy)

  const badges = tickBadges(scene, [new THREE.Vector3(tx - 0.15, 1.1, -0.6), new THREE.Vector3(tx + 0.17, 1.17, -0.6), new THREE.Vector3(X05.bag, 0.78, -0.5), new THREE.Vector3(X05.cab, 1.4, WALL - 0.7)])
  const clk = slideClock('T05', scene, devHold(HOLD05), NOBODY())

  return (t: number) => {
    const c = mod(clk.time(t), L05)
    list.paint(ticked05(c))
    setBadges(badges, c, camera)
    crateM.emissiveIntensity = 0.05 + 0.4 * hold(c, T05.ticks[2], T05.ticks[2] + 0.1, T05.ticks[2] + 0.3, T05.ticks[2] + 0.7)
    const flash = Math.max(hold(c, T05.ticks[3], T05.ticks[3] + 0.06, T05.ticks[3] + 0.2, T05.ticks[3] + 0.3), hold(c, T05.ticks[3] + 0.35, T05.ticks[3] + 0.41, T05.ticks[3] + 0.55, T05.ticks[3] + 0.65), ...T05.trips.map((s) => hold(c, s, s + 0.06, s + 0.25, s + 0.35)))
    lampM.emissiveIntensity = 0.3 + 2.4 * flash
    ;(fire.material as THREE.MeshBasicMaterial).opacity = 0.9 * flash
    fire.quaternion.copy(camera.quaternion)
    cubeM.emissiveIntensity = 0.2 + 0.8 * hold(c, T05.ticks[1], T05.ticks[1] + 0.1, T05.ticks[1] + 0.3, T05.ticks[1] + 0.7)
    copy.visible = false
    DEST.forEach((_, i) => {
      const s = T05.trips[i]
      const k = seg(c, s, s + T05.fly)
      const fade = seg(c, T05.clear[0], T05.clear[1])
      arcs[i].set(c >= s ? k : 0, c >= s ? fade : 1)
      if (c >= s && c < s + T05.fly + 0.05) {
        copy.visible = true
        arcs[i].at(k, copy.position)
        copy.position.y -= 0.07
        copy.rotation.y = -0.18 + k * 0.4
      }
      const on = tripOn(c, i)
      ;(screens[i].on.material as THREE.MeshBasicMaterial).opacity = on
      /* the same running pulse on every environment */
      screens[i].dot.emissiveIntensity = on * (1.2 + 0.8 * Math.sin(c * TAU * 1.1))
    })
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <ClockCard id={id} w={W} h={H}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T01Everyday: card('T01', setupT01Everyday, devHold(HOLD01)),
  H_T01Concept: card('T01', setupT01Concept, devHold(HOLD01)),
  H_T05Everyday: card('T05', setupT05Everyday, devHold(HOLD05)),
  H_T05Concept: card('T05', setupT05Concept, devHold(HOLD05)),
}
export const css = ''
