import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import cacheUrl from '../images/aws-elasticache.svg'
import sqsUrl from '../images/aws-sqs.svg'
import rdsUrl from '../images/aws-rds.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER J · SESSION 18 (Cloud-Native Applications) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 16's i.tsx (T21-AN, round 3) is: a perspective camera on a real place, Character Lab people
 * from the engine's `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO TEXT
 * on either card, ONE wall-clock loop per slide shared by both cards (custom/clock.tsx, tap to pause), every loop
 * ending in the state it starts in, held frames (`?still`, thumbnails) at HOLD. Nobody walks toward or away from the
 * camera: people step sideways, props move. Props in a hand follow the frame the sprite is showing.
 *
 * SLIDE 47 · T21-AN (TR 21): "A supermarket keeps frequently purchased items near the checkout for quick access
 * (caching). During busy hours, customers wait in an orderly line instead of crowding the cashier (queuing)."
 *
 *   place (x)        everyday: a supermarket checkout                concept: an app with a cache and a queue
 *   -1.16 / -0.41    the line: two shoppers waiting, in order          the queue: two requests waiting on the rail
 *    0.34            the shopper at the head of the line               the request at the head of the queue
 *    0.77            the rack of popular items beside the checkout     the cache beside the app (popular data)
 *    0.97 - 1.88     the checkout counter: belt, scanner, register     the app: its belt, processing ring, screen
 *    1.42 (back)     the cashier                                       the worker (a robot arm)
 *    far back        the store's aisles                                the database, far away
 *
 *   One service every 2.2 s, four shoppers / requests, so the 8.8 s loop is one full turn of the line:
 *   0.0 - 0.5        the line steps up                                 the queue steps up
 *   0.4 - 1.0        the shopper takes an item off the rack beside    a popular item hops from the cache beside the
 *                    him (no walk down the aisles) onto the belt       app onto its belt (no trip to the database)
 *   1.0 - 1.7        the cashier scans it and hands it over            the worker takes it, processes it, hands it back
 *   1.8 - 2.95       he walks out with it; a new shopper joins         the answered request leaves; a new one joins
 *
 * SLIDE 50 · T23-AN (TR 23): "A household electrical breaker trips and cuts power the moment it senses a fault,
 * instead of letting wiring keep burning: just as the software pattern trips open and stops calls to a failing
 * service."
 *
 *   place (x)        everyday: a living room at night                concept: two services and a breaker
 *   -1.45            the electricity meter (the supply)                the caller service
 *   -0.42            the distribution board, the circuit's breaker     the breaker switch on the line
 *    1.05            the kettle on its table (the faulty appliance)    the failing service
 *   wiring           current along the wall wiring                     calls along the line
 *
 *   0.15 - 1.2       he switches the kettle on; all normal             calls flow, the service answers
 *   1.2 - 2.3        the kettle sparks, its wiring glows hot           the service fails, calls burst orange
 *   2.3              the breaker TRIPS: the room goes dark,            the switch TRIPS OPEN: calls stop at it,
 *                    the sparks stop, the wiring cools                 the service is left alone
 *   2.3 - 4.8        he steps to the board, waits a moment             a wait (the ring of dots fills)
 *   4.8              he resets it: the power comes back                the switch closes, calls flow, a green tick
 */

const W = 470
const H = 390
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : d
}

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#22C55E',
  white: '#FFFFFF',
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
/** a stable pseudo-random number in 0..1 */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
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
/** an official mark (svg url) rasterised at `px` on a white rounded tile (rule 54) */
function markTex(url: string, redraw: () => void, px = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const g = c.getContext('2d')!
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, px, px, px * 0.16)
    g.fill()
    const pad = px * 0.14
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}
/** a badge tile: an orange cross (failed) or a green tick (healthy), icons not words */
const badgeTex = (kind: 'cross' | 'tick') =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(32, 32, 29, 0, TAU)
    g.fill()
    g.strokeStyle = kind === 'cross' ? C.orange : C.green
    g.lineWidth = 9
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    if (kind === 'cross') {
      g.moveTo(21, 21)
      g.lineTo(43, 43)
      g.moveTo(43, 21)
      g.lineTo(21, 43)
    } else {
      g.moveTo(19, 33)
      g.lineTo(28, 42)
      g.lineTo(45, 23)
    }
    g.stroke()
  })

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
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
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })

/** hemisphere, a key with soft shadows, a rim (the loop may dim them) */
function lights(scene: THREE.Scene, target: THREE.Vector3Tuple) {
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 5, target[1] + 9, target[2] + 8)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
  return { hemi, key, rim }
}

/** a polyline the current / the calls run along */
type Path = { pts: THREE.Vector3[]; cum: number[]; len: number }
function mkPath(pts: THREE.Vector3[]): Path {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]))
  return { pts, cum, len: cum[cum.length - 1] }
}
function pathAt(p: Path, s: number, out: THREE.Vector3) {
  const v = Math.min(p.len, Math.max(0, s))
  let i = 1
  while (i < p.cum.length - 1 && p.cum[i] < v) i++
  const a = p.cum[i - 1]
  const k = (v - a) / Math.max(1e-6, p.cum[i] - a)
  return out.lerpVectors(p.pts[i - 1], p.pts[i], k)
}
/** the arc length of a path at its point `idx` */
const sAt = (p: Path, idx: number) => p.cum[idx]
/** square conduit / cable segments along a path */
function conduit(scene: THREE.Scene, p: Path, m: THREE.Material, t = 0.035) {
  const g = new THREE.Group()
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.pts[i - 1]
    const b = p.pts[i]
    const len = a.distanceTo(b)
    const s = box(t, t, t, m, [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2])
    const d = b.clone().sub(a)
    if (Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)) s.scale.x = (len + t) / t
    else if (Math.abs(d.y) >= Math.abs(d.z)) s.scale.y = (len + t) / t
    else s.scale.z = (len + t) / t
    g.add(s)
  }
  scene.add(flat(g))
  return g
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
/** face keys written in a person's own phase (phase = c + off), turned into loop time and sorted */
const facesIn = (keys: [number, string][], off: number, loop: number): [number, string][] => keys.map(([t, f]) => [mod(t - off, loop), f] as [number, string]).sort((a, b) => a[0] - b[0])
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
/* Session 16's lesson: frames at one fixed size and no idle breathing (a still pose is one shared picture) */
const PEOPLE = { px: 256, still: true }
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
    px: PEOPLE.px,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c), ...(PEOPLE.still ? { breath: false } : {}) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing, rig body frame 400 x 600 */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
    <rect x={212} y={250} width={22} height={12} rx={3} fill="#FFFFFF" />
  </g>
)
const CARDIGAN = (color: string, edge: string) => (
  <g data-part="cardigan">
    <path d="M 150 212 L 188 210 L 196 300 L 186 380 L 150 380 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 212 210 L 204 300 L 214 380 L 250 380 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <circle cx={193} cy={300} r={3} fill={edge} />
    <circle cx={194} cy={330} r={3} fill={edge} />
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
/** two-link IK for either arm: shoulder and elbow angles that put the grip at `p` (rig frame) */
function solveArm(side: 'L' | 'R', sh: number, p: Pt): Arm {
  const UPPER = 95
  const FORE = 99
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const dx = (p.x - px) * sg
  const dy = p.y - 205
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(dx, dy)
  const beta = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D))))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
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
/** the rig-frame point on a sprite (height `h`, at `root`, facing the camera) that the camera sees at world point `k` */
function worldToRig(k: THREE.Vector3, root: THREE.Vector3, h: number, camera: THREE.Camera): Pt {
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const n = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi))
  const ray = k.clone().sub(cam)
  const t = n.dot(root.clone().sub(cam)) / n.dot(ray)
  const q = cam.clone().addScaledVector(ray, t)
  const u = h / 0.93 / 600
  const lx = Math.cos(phi) * (q.x - root.x) - Math.sin(phi) * (q.z - root.z)
  return { x: 200 + lx / u, y: 600 - (q.y - root.y) / u }
}
/** move a point toward the camera along its view ray, so a prop sits in front of the sprite and projects onto the hand */
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3, d = 0.08) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, d)
}
/** the loop time of the frame a sprite of F frames is showing at c (props follow the drawn frame, not the clock) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)
const mixArm = (a: Arm, b: Arm, k: number): Arm => ({ s: lerp(a.s, b.s, clamp01(k)), e: lerp(a.e, b.e, clamp01(k)) })

/** the walking layer: knees alternate, head toward the way the person goes */
function walkLegs(p: Pose, c: number, w: number, dir: number) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  to(p, 'headTurn', 0.4 * dir, w)
  to(p, 'lookX', 0.8 * dir, w)
}
const swing = (c: number, w: number) => w * 10 * Math.sin(c * Math.PI * 4.4)
const bob = (w: number, c: number) => w * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.03

/* ================================================================== T21 · the supermarket checkout */

const L21 = 8.8
const S21 = 2.2 /* one service; four shoppers, so the loop is one full turn of the line */
const F21 = 106
const HOLD21 = 0.85 /* the head of the line has the item off the rack, two shoppers waiting behind, the cashier ready */
const N21 = 4
const P21 = {
  lane: -0.05,
  front: 0.26,
  q1: -0.5,
  q2: -1.26,
  exit: 2.75,
  entry: -2.95,
  wallZ: -4.6,
  cashier: new THREE.Vector3(1.52, 0, -1.08),
  hC: 1.6,
}
const RACK = { x: 0.86, z: -0.52, w: 0.36, d: 0.28, h: 1.32, tiers: [0.36, 0.62, 0.88, 1.14], cols: [-0.085, 0.085] }
const COUNTER = { x0: 1.06, x1: 1.98, z: -0.55, d: 0.5, h: 0.9 }
const BELT = { x0: 1.09, x1: 1.33, y: 0.92 }
const SCAN = new THREE.Vector3(1.43, 0.905, -0.55)
const HANDOFF = new THREE.Vector3(0.86, 1.06, -0.3)
/* each shopper's (column, tier) on the rack: the popular items at hand height */
const SLOT21: [number, number][] = [
  [0, 3],
  [1, 2],
  [1, 3],
  [0, 2],
]
const E21 = {
  step: [0, 0.5] as const,
  reach: [0.38, 0.66] as const,
  grab: 0.7,
  toBelt: [0.72, 0.95] as const,
  place: 0.98,
  armDown: [1.0, 1.2] as const,
  belt: [1.0, 1.26] as const,
  cPick: [1.14, 1.26] as const,
  cHas: 1.3,
  cScan: [1.32, 1.5] as const,
  beep: 1.42,
  cGive: [1.5, 1.68] as const,
  swap: 1.7,
  cBack: [1.72, 1.98] as const,
  sReach: [1.46, 1.66] as const,
  down: [1.72, 1.86] as const,
  exit: [1.86, 2.95] as const,
  enter: [4.0, 5.0] as const,
  q2q1: [6.6, 7.1] as const,
  restock: [1.1, 1.5] as const,
}
/** shopper / request k's own phase: k = 0 is at the head of the line at c = 0 */
const phase21 = (c: number, k: number) => mod(c + k * S21, L21)
/** where a shopper / request is on its phase, whether it is walking, whether it is on screen */
function place21(f: number): { x: number; walking: number; shown: boolean } {
  const walkW = (a: number, b: number) => hold(f, a, a + 0.08, b - 0.08, b)
  if (f < E21.step[1]) return { x: lerp(P21.q1, P21.front, seg(f, E21.step[0], E21.step[1])), walking: walkW(E21.step[0], E21.step[1]), shown: true }
  if (f < E21.exit[0]) return { x: P21.front, walking: 0, shown: true }
  if (f < E21.exit[1]) {
    /* eased in, then at a steady walk off the frame */
    const k = (f - E21.exit[0]) / (E21.exit[1] - E21.exit[0])
    const e = k < 0.25 ? (k * k) / 0.5 : 0.125 + (k - 0.25) * (0.875 / 0.75)
    return { x: lerp(P21.front, P21.exit, e), walking: hold(f, E21.exit[0], E21.exit[0] + 0.1, 9, 10), shown: true }
  }
  if (f < E21.enter[0]) return { x: P21.entry, walking: 0, shown: false }
  if (f < E21.enter[1]) {
    const k = (f - E21.enter[0]) / (E21.enter[1] - E21.enter[0])
    const e = k < 0.75 ? k * (0.875 / 0.75) : 0.875 + (1 - (1 - k) * (1 - k) / 0.0625) * 0.125
    return { x: lerp(P21.entry, P21.q2, Math.min(1, e)), walking: hold(f, E21.enter[0] - 1, E21.enter[0], E21.enter[1] - 0.1, E21.enter[1]), shown: true }
  }
  if (f < E21.q2q1[0]) return { x: P21.q2, walking: 0, shown: true }
  if (f < E21.q2q1[1]) return { x: lerp(P21.q2, P21.q1, seg(f, E21.q2q1[0], E21.q2q1[1])), walking: walkW(E21.q2q1[0], E21.q2q1[1]), shown: true }
  return { x: P21.q1, walking: 0, shown: true }
}
function slotWorld(k: number, depth: number, out: THREE.Vector3) {
  const [col, tier] = SLOT21[k]
  return out.set(RACK.x + RACK.cols[col], RACK.tiers[tier] + 0.012, RACK.z + RACK.d / 2 - 0.06 - depth * 0.075)
}

/** a popular item (origin at its base centre): 0 juice bottle, 1 milk carton, 2 can, 3 snack box */
function makeItem(type: number): THREE.Group {
  const g = new THREE.Group()
  if (type === 0) {
    g.add(cyl(0.045, 0.048, 0.14, mat('#FF9F2E', { roughness: 0.25 }), [0, 0.07, 0], 20))
    g.add(cyl(0.024, 0.04, 0.035, mat('#FFB85C', { roughness: 0.25 }), [0, 0.157, 0], 16))
    g.add(cyl(0.022, 0.022, 0.025, mat('#2D63FB', { roughness: 0.4 }), [0, 0.186, 0], 16))
    g.add(cyl(0.0485, 0.0485, 0.05, mat('#FFFFFF', { roughness: 0.5 }), [0, 0.07, 0], 20))
  } else if (type === 1) {
    g.add(box(0.085, 0.13, 0.085, mat('#F7F9FC', { roughness: 0.6 }), [0, 0.065, 0]))
    g.add(box(0.087, 0.045, 0.087, mat('#2D63FB', { roughness: 0.6 }), [0, 0.07, 0]))
    const roof = mesh(new THREE.CylinderGeometry(0.0001, 0.062, 0.04, 4, 1), mat('#F7F9FC', { roughness: 0.6 }), [0, 0.15, 0])
    roof.rotation.y = Math.PI / 4
    g.add(roof)
  } else if (type === 2) {
    g.add(cyl(0.038, 0.038, 0.12, mat('#E5484D', { roughness: 0.25, metalness: 0.4 }), [0, 0.06, 0], 20))
    g.add(cyl(0.039, 0.039, 0.03, mat('#FFFFFF', { roughness: 0.3, metalness: 0.4 }), [0, 0.07, 0], 20))
    g.add(cyl(0.032, 0.036, 0.01, mat('#C9D0DC', { metalness: 0.8, roughness: 0.25 }), [0, 0.125, 0], 20))
  } else {
    g.add(box(0.11, 0.13, 0.045, mat('#22A06B', { roughness: 0.5 }), [0, 0.065, 0], 0.006))
    g.add(box(0.112, 0.035, 0.047, mat('#F2C14E', { roughness: 0.5 }), [0, 0.085, 0]))
  }
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return g
}

/** the shared camera of T21 (both cards) */
function cam21(camera: THREE.PerspectiveCamera) {
  camera.fov = 42
  camera.position.set(0.15, 1.42, 4.15)
  camera.lookAt(0.15, 1.12, -0.6)
  camera.updateProjectionMatrix()
}

/** the arms of the shopper at the head of the line, solved to the rack, the belt and the hand-over (rig frame) */
type ShopArms = { rack: Arm; belt: Arm; take: Arm }
function shopArmR(f: number, A: ShopArms, walking: number): Arm {
  let a: Arm = { s: 8 - swing(f, walking), e: 8 }
  if (f < S21 + 0.8) {
    const toRack = hold(f, E21.reach[0], E21.reach[1], E21.grab, E21.grab + 0.12)
    const toBelt = hold(f, E21.grab, E21.toBelt[1] - 0.04, E21.armDown[0], E21.armDown[1])
    const take = hold(f, E21.sReach[0], E21.sReach[1], E21.swap + 0.02, E21.down[1])
    const carry = seg(f, E21.swap, E21.down[1]) * (1 - seg(f, E21.exit[1] - 0.1, E21.exit[1]))
    a = mixArm(a, A.rack, toRack)
    a = mixArm(a, A.belt, toBelt)
    a = mixArm(a, { s: 16 - swing(f, walking) * 0.4, e: 42 }, carry)
    a = mixArm(a, A.take, take)
  }
  return a
}
function shopArmL(f: number, walking: number): Arm {
  return { s: 9 + swing(f, walking), e: 10 }
}
function shopPose(A: ShopArms, k: number) {
  return (p: Pose, c: number) => {
    const f = phase21(c, k)
    const at = place21(f)
    const r = shopArmR(f, A, at.walking)
    const l = shopArmL(f, at.walking)
    p.shoulderR = r.s
    p.elbowR = r.e
    p.shoulderL = l.s
    p.elbowL = l.e
    /* waiting: eyes on the checkout ahead */
    const waiting = f >= E21.enter[1] - 0.1 || f < E21.step[0] + 0.05 ? 1 : 0
    to(p, 'headTurn', 0.3, waiting)
    to(p, 'lookX', 0.75, waiting)
    walkLegs(p, f, at.walking, 1)
    /* at the head of the line: to the rack, down to the belt, then to the cashier */
    const rack = hold(f, E21.reach[0] - 0.1, E21.reach[0] + 0.1, E21.toBelt[1], E21.armDown[1])
    to(p, 'headTurn', 0.32, rack)
    to(p, 'lookX', 0.8, rack)
    to(p, 'headNod', 0.22, rack)
    to(p, 'lookY', 0.55, rack)
    const cashier = hold(f, E21.armDown[0], E21.armDown[1], E21.exit[0], E21.exit[0] + 0.2)
    to(p, 'headTurn', 0.42, cashier)
    to(p, 'lookX', 0.9, cashier)
  }
}
const SHOP_FACES: [number, string][] = [
  [0, 'neutral'],
  [0.4, 'thinking'],
  [0.74, 'happy'],
  [1.6, 'grin'],
  [2.2, 'happy'],
  [4.6, 'listening'],
  [7.4, 'neutral'],
]

/** cashier: her left arm (toward the line) to the belt, over the scanner, out to the shopper; one service every S21 */
type CashArms = { pick: Arm; scan: Arm; give: Arm }
function cashArmL(c: number, A: CashArms): Arm {
  const f = mod(c, S21)
  let a: Arm = { s: 22, e: 46 }
  a = mixArm(a, A.pick, hold(f, E21.cPick[0], E21.cPick[1], E21.cScan[0], E21.cScan[0] + 0.06))
  a = mixArm(a, A.scan, hold(f, E21.cScan[0], E21.cScan[0] + 0.08, E21.cScan[1] - 0.04, E21.cGive[0] + 0.04))
  a = mixArm(a, A.give, hold(f, E21.cGive[0], E21.cGive[1], E21.swap + 0.04, E21.cBack[1]))
  return a
}
function cashPose(A: CashArms) {
  return (p: Pose, c: number) => {
    const f = mod(c, S21)
    const l = cashArmL(c, A)
    p.shoulderL = l.s
    p.elbowL = l.e
    /* her right hand rests on the register; a tap as the item is scanned */
    p.shoulderR = 24
    p.elbowR = 70 + 8 * hold(f, E21.beep - 0.06, E21.beep, E21.beep + 0.02, E21.beep + 0.1)
    p.headTurn = -0.42
    p.lookX = -0.85
    const scan = hold(f, E21.cPick[0], E21.cPick[1], E21.cScan[1], E21.cGive[0] + 0.05)
    to(p, 'headTurn', -0.2, scan)
    to(p, 'lookX', -0.5, scan)
    to(p, 'headNod', 0.28, scan)
    to(p, 'lookY', 0.7, scan)
  }
}
/* her loop is ONE service (her frames repeat four times a turn of the line: a quarter of the frames to build) */
const CASH_FACES: [number, string][] = [
  [0, 'happy'],
  [E21.cPick[0], 'listening'],
  [E21.cGive[0], 'grin'],
]
const FC21 = Math.round(F21 / N21)

/* ------------------------------------------------------------------ T21 everyday: the supermarket */

function aisles21(scene: THREE.Scene) {
  /* the store's aisles in the background: long shelf runs going away from the checkout, products on their faces */
  const wz = P21.wallZ
  scene.add(flat(box(12, 9, 0.1, mat('#F4EEE2', { roughness: 0.95, emissive: new THREE.Color('#F4EEE2'), emissiveIntensity: 0.5 }), [0, 4.5, wz - 0.05])))
  /* grocery shelving (never books): four shelves of wide product facings, each product repeated side by side as in
     a store, in the checkout rack's colours: bottles and jars on top, cereal boxes, cans, produce crates at the bottom */
  const prod = canvasTex(256, 128, (g) => {
    g.fillStyle = '#EFE7D8'
    g.fillRect(0, 0, 256, 128)
    const rr = (x: number, y: number, w: number, h: number, r: number, c: string) => {
      g.fillStyle = c
      g.beginPath()
      g.roundRect(x, y, w, h, r)
      g.fill()
    }
    const shelf = (base: number) => {
      rr(0, base, 256, 4, 0, '#C9B99C')
      rr(0, base + 4, 256, 1.5, 0, '#2D63FB')
    }
    /* top: juice bottles and jam jars */
    let x = 3
    const tops: [string, string][] = [['bottle', '#FF9F2E'], ['jar', '#E5484D'], ['bottle', '#2D63FB'], ['jar', '#F2C14E'], ['bottle', '#22A06B'], ['jar', '#7C5CE0']]
    for (let k = 0; x < 250; k++) {
      const [kind, c] = tops[k % tops.length]
      for (let n = 0; n < 3 && x < 250; n++) {
        if (kind === 'bottle') {
          rr(x + 1, 13, 8, 14, 2.5, c)
          rr(x + 3, 9, 4, 5, 1, c)
          rr(x + 3, 7, 4, 2.5, 1, '#3E4656')
          rr(x + 1, 18, 8, 4, 0, '#FFFFFF')
          x += 11
        } else {
          rr(x, 15, 12, 12, 3, c)
          rr(x + 1, 12, 10, 3.5, 1, '#3E4656')
          rr(x + 1.5, 19, 9, 4, 1, '#FFF6E5')
          x += 14
        }
      }
      x += 4
    }
    shelf(27)
    /* cereal boxes, front panels with a bowl */
    x = 2
    const boxes = ['#F2C14E', '#E5484D', '#2D63FB', '#22A06B', '#FF9F2E', '#14B8A6']
    for (let k = 0; x < 248; k++) {
      const c = boxes[k % boxes.length]
      for (let n = 0; n < 2 && x < 248; n++) {
        rr(x, 37, 17, 22, 1.5, c)
        rr(x + 2, 40, 13, 5, 1, 'rgba(255,255,255,0.85)')
        g.fillStyle = '#FFFFFF'
        g.beginPath()
        g.arc(x + 8.5, 52, 4.5, 0, Math.PI)
        g.fill()
        x += 19
      }
      x += 3
    }
    shelf(59)
    /* cans with rims and a label band */
    x = 3
    const cans = ['#E5484D', '#2D63FB', '#FF9F2E', '#22A06B', '#7C5CE0', '#F2C14E']
    for (let k = 0; x < 250; k++) {
      const c = cans[k % cans.length]
      for (let n = 0; n < 3 && x < 250; n++) {
        rr(x, 75, 12, 16, 2, c)
        rr(x, 74, 12, 2.5, 1, '#C9D0DC')
        rr(x, 89, 12, 2.5, 1, '#C9D0DC')
        rr(x, 80, 12, 5, 0, '#FFFFFF')
        x += 13
      }
      x += 4
    }
    shelf(91)
    /* produce crates: wooden crates heaped with apples, oranges, limes */
    x = 3
    const fruit = ['#E5484D', '#FF9F2E', '#7BC043', '#F2C14E']
    for (let k = 0; x < 244; k++) {
      const c = fruit[k % fruit.length]
      for (let f = 0; f < 5; f++) {
        g.fillStyle = c
        g.beginPath()
        g.arc(x + 4 + f * 5.5, 108 - (f % 2) * 2, 3.6, 0, Math.PI * 2)
        g.fill()
      }
      rr(x, 108, 30, 14, 1.5, '#B7864F')
      rr(x, 112, 30, 1.5, 0, '#8E6236')
      rr(x, 117, 30, 1.5, 0, '#8E6236')
      x += 34
    }
    rr(0, 123, 256, 5, 0, '#C9B99C')
  })
  const shelfM = mat('#ffffff', { map: prod, roughness: 0.75 })
  const frameM = mat('#D6DCE6', { roughness: 0.5, metalness: 0.3 })
  const signM = mat('#2D63FB', { roughness: 0.4 })
  for (const x of [-2.25, -0.85, 0.55, 1.95]) {
    const run = new THREE.Group()
    /* a gondola: two product faces back to back, 2.6 m long, its end toward the checkout */
    const z0 = -2.0
    const len = 2.4
    run.add(box(0.5, 1.55, len, frameM, [x, 0.775, z0 - len / 2]))
    for (const sx of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.45), shelfM)
      face.rotation.y = (sx * Math.PI) / 2
      face.position.set(x + sx * 0.252, 0.78, z0 - len / 2)
      run.add(face)
    }
    const end = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.45), shelfM)
    end.position.set(x, 0.78, z0 + 0.002)
    run.add(end)
    scene.add(flat(run))
  }
  /* the aisle signs hanging above the runs (blue panels with a pictogram, never words) */
  for (const [x, glyph] of [[-1.55, 0], [-0.15, 1], [1.25, 2]] as const) {
    const t = canvasTex(96, 48, (g) => {
      g.fillStyle = '#2D63FB'
      g.beginPath()
      g.roundRect(0, 0, 96, 48, 8)
      g.fill()
      g.fillStyle = '#FFFFFF'
      if (glyph === 0) {
        g.beginPath()
        g.roundRect(40, 10, 16, 30, 4)
        g.fill()
        g.fillRect(44, 6, 8, 6)
      } else if (glyph === 1) {
        g.beginPath()
        g.arc(48, 26, 13, 0, TAU)
        g.fill()
        g.fillStyle = '#2D63FB'
        g.fillRect(47, 8, 3, 8)
      } else {
        g.beginPath()
        g.roundRect(34, 16, 28, 20, 6)
        g.fill()
        g.fillRect(44, 10, 8, 8)
      }
    })
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), basic(t, { transparent: false }))
    sign.position.set(x, 2.32, -2.4)
    scene.add(sign)
    scene.add(box(0.01, 0.6, 0.01, signM, [x - 0.2, 2.75, -2.4]), box(0.01, 0.6, 0.01, signM, [x + 0.2, 2.75, -2.4]))
  }
}

function floor21(scene: THREE.Scene, a: string, b: string) {
  const fl = flat(mesh(new THREE.PlaneGeometry(10, 9), mat('#ffffff', { map: tileTex(a, b, 4, [12, 11]), roughness: 0.8 }), [0, 0, -0.5]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
}

/** the checkout counter (shared shape): body, top, the belt (its texture scrolls) */
function counter21(scene: THREE.Scene, body: string, top: string) {
  const K = COUNTER
  const cx = (K.x0 + K.x1) / 2
  scene.add(box(K.x1 - K.x0, K.h - 0.03, K.d, mat(body, { roughness: 0.55 }), [cx, (K.h - 0.03) / 2, K.z], 0.015))
  scene.add(box(K.x1 - K.x0 + 0.02, 0.03, K.d + 0.02, mat(top, { roughness: 0.3, metalness: 0.5 }), [cx, K.h - 0.015, K.z], 0.008))
  const beltTex = canvasTex(64, 16, (g) => {
    g.fillStyle = '#2B3040'
    g.fillRect(0, 0, 64, 16)
    g.fillStyle = '#3A4154'
    for (let i = 0; i < 8; i++) g.fillRect(i * 8, 0, 3, 16)
  }, [1, 1])
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(BELT.x1 - BELT.x0, 0.34), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.8 }))
  belt.rotation.x = -Math.PI / 2
  belt.position.set((BELT.x0 + BELT.x1) / 2, K.h + 0.002, K.z)
  scene.add(belt)
  return { beltTex }
}

function setupT21Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F4EFE6')
  cam21(camera)
  lights(scene, [0.1, 1.0, -0.6])
  floor21(scene, '#EFE9DE', '#DCD2C0')
  aisles21(scene)
  const { beltTex } = counter21(scene, '#3E4A66', '#D9DEE8')

  /* the scanner window on the counter, its line red, a green flash on each beep */
  scene.add(box(0.16, 0.012, 0.22, mat('#1C2233', { roughness: 0.15, metalness: 0.4 }), [SCAN.x, COUNTER.h + 0.006, SCAN.z]))
  const scanM = new THREE.MeshBasicMaterial({ color: '#FF5A4E', toneMapped: false })
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.012), scanM)
  scanLine.rotation.x = -Math.PI / 2
  scanLine.position.set(SCAN.x, COUNTER.h + 0.0135, SCAN.z)
  scene.add(scanLine)
  const beepGlow = halo('rgba(80,220,120,0.95)', 0.36)
  beepGlow.position.set(SCAN.x, COUNTER.h + 0.08, SCAN.z + 0.05)
  scene.add(beepGlow)
  /* the register: a screen on a post, turned toward the cashier */
  const reg = new THREE.Group()
  reg.add(box(0.03, 0.26, 0.03, mat('#5E6B86', { metalness: 0.5, roughness: 0.35 }), [0, 0.13, 0]))
  reg.add(box(0.3, 0.2, 0.03, mat('#1F2E63', { roughness: 0.3 }), [0, 0.33, 0], 0.01))
  const regScr = canvasTex(120, 80, (g) => {
    g.fillStyle = '#EAF1FF'
    g.fillRect(0, 0, 120, 80)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, 120, 12)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#C3CCDD'
      g.fillRect(10, 20 + i * 13, 60 + ((i * 17) % 30), 6)
      g.fillStyle = '#8A97B2'
      g.fillRect(96, 20 + i * 13, 14, 6)
    }
  })
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.17), basic(regScr, { transparent: false }))
  scr.position.set(0, 0.33, 0.016)
  reg.add(scr)
  reg.position.set(1.8, COUNTER.h, -0.48)
  reg.rotation.y = -0.35
  scene.add(reg)

  /* the impulse rack beside the checkout: four shelves of the most-bought items, a star on its header (no words) */
  const R = RACK
  const rackM = mat('#E8EDF6', { roughness: 0.4, metalness: 0.3 })
  for (const sx of [-1, 1]) scene.add(box(0.025, R.h, R.d, rackM, [R.x + (sx * R.w) / 2, R.h / 2, R.z]))
  scene.add(box(R.w, R.h, 0.015, mat('#C9D3E6', { roughness: 0.6 }), [R.x, R.h / 2, R.z - R.d / 2]))
  for (const y of R.tiers) {
    scene.add(box(R.w, 0.018, R.d, rackM, [R.x, y, R.z]))
    /* gold shelf edges, like the star: the store's rack of popular items */
    scene.add(box(R.w, 0.035, 0.012, mat(C.gold, { roughness: 0.4 }), [R.x, y + 0.02, R.z + R.d / 2]))
  }
  const starTex = canvasTex(96, 40, (g) => {
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.roundRect(0, 0, 96, 40, 8)
    g.fill()
    g.fillStyle = C.gold
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 15 : 6.5
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      g.lineTo(48 + r * Math.cos(a), 21 + r * Math.sin(a))
    }
    g.closePath()
    g.fill()
  })
  const header = new THREE.Mesh(new THREE.PlaneGeometry(R.w + 0.04, 0.15), basic(starTex, { transparent: false }))
  header.position.set(R.x, R.h + 0.075, R.z + R.d / 2)
  scene.add(header)
  /* the rack's stock: every slot three deep; the shoppers' slots slide forward after each take */
  const tmp = new THREE.Vector3()
  for (let col = 0; col < 2; col++)
    for (let tier = 0; tier < 4; tier++) {
      if (SLOT21.some(([c0, t0]) => c0 === col && t0 === tier)) continue
      for (let dpt = 0; dpt < 3; dpt++) {
        const it = makeItem((col * 3 + tier) % 4)
        it.position.set(R.x + R.cols[col], R.tiers[tier] + 0.012, R.z + R.d / 2 - 0.06 - dpt * 0.075)
        scene.add(it)
      }
    }
  const rows = SLOT21.map((_, k) =>
    Array.from({ length: 3 }, (_, dpt) => {
      const it = makeItem(k)
      it.position.copy(slotWorld(k, dpt, tmp))
      scene.add(it)
      return it
    }),
  )
  const carried = SLOT21.map((_, k) => {
    const it = makeItem(k)
    it.visible = false
    scene.add(it)
    return it
  })

  /* people: the cashier (store apron) and four shoppers, each their own person */
  const cCfg = who(CAST_PRESETS.meera, { name: 'Cashier', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'polo', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const sCfg = [
    who(CAST_PRESETS.rohan, { name: 'Shopper A', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'polo', topColor: '#1E9E8F', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { beard: 'stubble', watch: true } }),
    who(CAST_PRESETS.ananya, { name: 'Shopper B', skinTone: 'wheatish', hair: { style: 'bob', color: 'black' }, outfit: { top: 'tshirt', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' } }),
    who(CAST_PRESETS.arjun, { name: 'Shopper C', skinTone: 'fair', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirt', topColor: '#F2C14E', bottom: 'trousers', bottomColor: '#4A3F35', shoeColor: '#5A3A2A' }, accessories: { glasses: 'rect' }, build: { height: 1.0, shoulders: 1.04 } }),
    who(CAST_PRESETS.riya, { name: 'Shopper D', skinTone: 'medium', hair: { style: 'braid', color: 'black' }, outfit: { top: 'kurta', topColor: '#C2477A', bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#7A4A2A' }, accessories: { earrings: true, bindi: true } }),
  ]
  const hS = [1.72, 1.6, 1.68, 1.62]
  const shS = sCfg.map((c) => buildSkin(c).shoulderHalf)
  const shC = buildSkin(cCfg).shoulderHalf
  const frontRoot = new THREE.Vector3(P21.front, 0, P21.lane)
  const beltStart = new THREE.Vector3(BELT.x0 + 0.03, COUNTER.h + 0.07, COUNTER.z + 0.05)
  const beltEnd = new THREE.Vector3(BELT.x1 - 0.02, COUNTER.h + 0.07, COUNTER.z + 0.05)
  const shopArms: ShopArms[] = sCfg.map((_, k) => {
    const rk = slotWorld(k, 0, new THREE.Vector3()).add(new THREE.Vector3(0, 0.07, 0.03))
    return {
      rack: solveArm('R', shS[k], worldToRig(rk, frontRoot, hS[k], camera)),
      belt: solveArm('R', shS[k], worldToRig(beltStart, frontRoot, hS[k], camera)),
      take: solveArm('R', shS[k], worldToRig(HANDOFF, frontRoot, hS[k], camera)),
    }
  })
  const cashArms: CashArms = {
    pick: solveArm('L', shC, worldToRig(beltEnd, P21.cashier, P21.hC, camera)),
    scan: solveArm('L', shC, worldToRig(SCAN.clone().add(new THREE.Vector3(0, 0.12, 0.05)), P21.cashier, P21.hC, camera)),
    give: solveArm('L', shC, worldToRig(HANDOFF, P21.cashier, P21.hC, camera)),
  }
  const hold21 = devHold(HOLD21)
  const cashier = person({ config: cCfg, dress: withTop(APRON('#2D63FB', '#1F48C8')), seed: 1801, faces: CASH_FACES, pose: cashPose(cashArms), loop: S21, height: P21.hC, frames: FC21, redraw, holdT: mod(hold21, S21) })
  cashier.object.position.copy(P21.cashier)
  const shoppers = sCfg.map((cfg, k) =>
    person({ config: cfg, dress: k === 3 ? undefined : k === 2 ? withTop(CARDIGAN('#5E6B86', '#46516B')) : undefined, seed: 1810 + k, faces: facesIn(SHOP_FACES, k * S21, L21), pose: shopPose(shopArms[k], k), loop: L21, height: hS[k], frames: F21, redraw, holdT: hold21 }),
  )
  scene.add(cashier.object, ...shoppers.map((s) => s.object))
  const clk = slideClock('J21', scene, hold21, [cashier, ...shoppers])

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const root = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L21)
    const cq = frameT(c, L21, F21)
    const cqC = frameT(c, S21, FC21)
    cashier.update(mod(c, S21), camera)
    /* the belt runs while an item rides it: 1/4 of its pattern per service, so the loop meets itself */
    const fc = mod(c, S21)
    beltTex.offset.x = -(Math.floor(c / S21) * 0.25 + 0.25 * clamp01((fc - E21.belt[0]) / (E21.belt[1] - E21.belt[0])))
    const beep = hold(fc, E21.beep - 0.03, E21.beep, E21.beep + 0.12, E21.beep + 0.3)
    ;(beepGlow.material as THREE.MeshBasicMaterial).opacity = beep
    scanM.color.set('#FF5A4E').lerp(new THREE.Color('#3BD16F'), beep)
    for (let k = 0; k < N21; k++) {
      const f = phase21(c, k)
      const fq = phase21(cq, k)
      const at = place21(f)
      const s = shoppers[k]
      root.set(at.x, bob(at.walking, f), P21.lane)
      s.object.position.copy(root)
      s.object.visible = at.shown
      s.update(c, camera)
      /* the slot: its front item leaves with the take, the row slides forward again (gravity-fed) */
      /* after the take the row stands one place back (the front is empty), then slides forward and a new one
         comes in at the back */
      const taken = f >= E21.grab && f < E21.restock[1]
      const back = taken ? 1 - seg(f, E21.restock[0], E21.restock[1]) : 0
      rows[k].forEach((it, dpt) => {
        slotWorld(k, dpt + back, it.position)
        it.visible = !(taken && dpt === 2 && f < E21.restock[0])
      })
      /* the carried item, from the rack to the belt, to the cashier, back to the shopper, out of the door */
      const it = carried[k]
      it.visible = at.shown && f >= E21.grab && f < E21.exit[1]
      if (!it.visible) continue
      const sArm = shopArmR(fq, shopArms[k], place21(fq).walking)
      const sHand = handWorld('R', shS[k], sArm, hS[k], root, camera, a)
      sHand.y -= 0.07
      if (f < E21.toBelt[1]) {
        slotWorld(k, 0, b)
        it.position.lerpVectors(b, sHand, seg(f, E21.grab, E21.grab + 0.08))
      } else if (f < E21.belt[0]) {
        it.position.lerpVectors(sHand, beltStart.clone().setY(COUNTER.h + 0.003), seg(f, E21.toBelt[1], E21.belt[0]))
      } else if (f < E21.belt[1]) {
        it.position.set(lerp(beltStart.x, beltEnd.x, (f - E21.belt[0]) / (E21.belt[1] - E21.belt[0])), COUNTER.h + 0.003, beltStart.z)
      } else if (f < E21.swap) {
        const cHand = handWorld('L', shC, cashArmL(cqC, cashArms), P21.hC, P21.cashier, camera, b, 0.46)
        cHand.y -= 0.07
        it.position.lerpVectors(beltEnd.clone().setY(COUNTER.h + 0.003), cHand, seg(f, E21.belt[1], E21.cHas))
      } else {
        const cHand = handWorld('L', shC, cashArmL(cqC, cashArms), P21.hC, P21.cashier, camera, b, 0.46)
        cHand.y -= 0.07
        it.position.lerpVectors(cHand, sHand, seg(f, E21.swap, E21.swap + 0.06))
      }
    }
  }
}

/* ------------------------------------------------------------------ T21 concept: the app, its cache and its queue */

/** a request on the queue: a blue rounded block with an envelope on its face */
function makeRequest(): { g: THREE.Group; m: THREE.MeshStandardMaterial } {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: '#3B6BFF', emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.1 })
  g.add(box(0.28, 0.25, 0.25, m, [0, 0.125, 0], 0.04))
  const env = canvasTex(64, 48, (x) => {
    x.fillStyle = '#FFFFFF'
    x.beginPath()
    x.roundRect(6, 8, 52, 34, 5)
    x.fill()
    x.strokeStyle = '#2D63FB'
    x.lineWidth = 3.5
    x.lineJoin = 'round'
    x.beginPath()
    x.moveTo(9, 12)
    x.lineTo(32, 29)
    x.lineTo(55, 12)
    x.stroke()
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.143), basic(env))
  face.position.set(0, 0.125, 0.126)
  g.add(face)
  return { g, m }
}
/** a popular item of data: a small glowing cube */
function makeData(): { g: THREE.Mesh; m: THREE.MeshStandardMaterial } {
  const m = new THREE.MeshStandardMaterial({ color: '#FFB347', emissive: new THREE.Color('#FF9F2E'), emissiveIntensity: 0.55, roughness: 0.3 })
  const g = box(0.085, 0.085, 0.085, m, [0, 0, 0], 0.012)
  return { g, m }
}

/** the worker: a two-link robot arm, its wrist pointed down, the grip at the target */
function robotArm(scene: THREE.Scene, base: THREE.Vector3, l1: number, l2: number) {
  const bodyM = mat('#3B6BFF', { roughness: 0.35, metalness: 0.2 })
  const jointM = mat('#1F2E63', { roughness: 0.35, metalness: 0.3 })
  const root = new THREE.Group()
  root.position.copy(base)
  scene.add(root)
  root.add(cyl(0.11, 0.13, 0.08, jointM, [0, -0.04, 0], 32))
  const yaw = new THREE.Group()
  root.add(yaw)
  yaw.add(cyl(0.07, 0.07, 0.1, bodyM, [0, 0.05, 0], 24))
  const sh = new THREE.Group()
  sh.position.y = 0.1
  yaw.add(sh)
  const jS = mesh(new THREE.SphereGeometry(0.055, 24, 16), jointM, [0, 0, 0])
  sh.add(jS)
  sh.add(box(l1, 0.06, 0.07, bodyM, [l1 / 2, 0, 0], 0.025))
  const el = new THREE.Group()
  el.position.x = l1
  sh.add(el)
  el.add(mesh(new THREE.SphereGeometry(0.045, 24, 16), jointM, [0, 0, 0]))
  el.add(box(l2, 0.05, 0.06, bodyM, [l2 / 2, 0, 0], 0.02))
  const wr = new THREE.Group()
  wr.position.x = l2
  el.add(wr)
  wr.add(mesh(new THREE.SphereGeometry(0.035, 20, 14), jointM, [0, 0, 0]))
  wr.add(box(0.03, 0.06, 0.03, jointM, [0, -0.04, 0]))
  const fingers = [-1, 1].map((s) => {
    const f = box(0.012, 0.05, 0.03, mat('#5E6B86', { metalness: 0.6, roughness: 0.3 }), [s * 0.04, -0.09, 0])
    wr.add(f)
    return f
  })
  const top = new THREE.Vector3()
  return {
    /** put the grip (between the fingers) at p; `open` 0..1 */
    reach(p: THREE.Vector3, open: number) {
      top.copy(p).add(new THREE.Vector3(0, 0.09, 0)).sub(base)
      top.y -= 0.1
      const r = Math.max(0.05, Math.hypot(top.x, top.z))
      yaw.rotation.y = Math.atan2(-top.z, top.x)
      const D = Math.min(Math.hypot(r, top.y), l1 + l2 - 0.002)
      const e = Math.acos(Math.max(-1, Math.min(1, (D * D - l1 * l1 - l2 * l2) / (2 * l1 * l2))))
      const a1 = Math.atan2(top.y, r) + Math.atan2(l2 * Math.sin(e), l1 + l2 * Math.cos(e))
      sh.rotation.z = a1
      el.rotation.z = -e
      wr.rotation.z = -(a1 - e)
      fingers.forEach((f, i) => (f.position.x = (i ? 1 : -1) * lerp(0.03, 0.055, open)))
    },
  }
}

function setupT21Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  cam21(camera)
  lights(scene, [0.1, 1.0, -0.6])
  floor21(scene, '#E3EAF8', '#C9D5EC')
  scene.add(flat(box(12, 9, 0.1, mat('#E9EFFA', { roughness: 0.95, emissive: new THREE.Color('#E9EFFA'), emissiveIntensity: 0.5 }), [0, 4.5, P21.wallZ - 0.05])))

  /* far back, where the aisles are: the database (and the racks beside it) */
  const dbM = mat('#3567E8', { roughness: 0.3, metalness: 0.15 })
  const ringM = mat('#9DB8FF', { roughness: 0.3, metalness: 0.1 })
  const DB = new THREE.Vector3(-0.3, 0, -3.0)
  for (let i = 0; i < 3; i++) {
    scene.add(cyl(0.42, 0.42, 0.42, dbM, [DB.x, 0.24 + i * 0.47, DB.z], 48))
    scene.add(cyl(0.425, 0.425, 0.035, ringM, [DB.x, 0.47 + i * 0.47, DB.z], 48))
  }
  const dbMark = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), basic(markTex(rdsUrl, redraw), { transparent: false }))
  dbMark.position.set(DB.x, 0.95, DB.z + 0.43)
  scene.add(dbMark)
  const rackM = mat('#2C3E7E', { roughness: 0.4, metalness: 0.3 })
  const ledTex = canvasTex(64, 128, (g) => {
    g.fillStyle = '#25356E'
    g.fillRect(0, 0, 64, 128)
    for (let r = 0; r < 10; r++) {
      g.fillStyle = '#31457F'
      g.fillRect(4, 6 + r * 12, 56, 8)
      g.fillStyle = r % 3 === 0 ? '#7FE0A0' : '#8DB0FF'
      g.fillRect(48, 8 + r * 12, 6, 4)
    }
  })
  for (const x of [-2.1, -1.35, 0.95, 1.7]) {
    scene.add(flat(box(0.6, 1.6, 0.6, rackM, [x, 0.8, -3.2])))
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.5), basic(ledTex, { transparent: false }))
    f.position.set(x, 0.8, -2.895)
    scene.add(f)
  }

  /* the app: the counter's place, its belt, the processing ring at the scanner's place, a screen at the register's */
  const { beltTex } = counter21(scene, '#1F2E63', '#C9D3E6')
  const procRing = mesh(new THREE.TorusGeometry(0.1, 0.014, 12, 40), glowM('#3BD16F', '#D9F7E3'), [SCAN.x, COUNTER.h + 0.12, SCAN.z])
  scene.add(procRing)
  scene.add(cyl(0.012, 0.012, 0.05, mat('#5E6B86'), [SCAN.x - 0.1, COUNTER.h + 0.03, SCAN.z]), cyl(0.012, 0.012, 0.05, mat('#5E6B86'), [SCAN.x + 0.1, COUNTER.h + 0.03, SCAN.z]))
  const procGlow = halo('rgba(80,220,120,0.95)', 0.4)
  procGlow.position.set(SCAN.x, COUNTER.h + 0.12, SCAN.z + 0.05)
  scene.add(procGlow)
  const appScr = canvasTex(120, 80, (g) => {
    g.fillStyle = '#EAF1FF'
    g.fillRect(0, 0, 120, 80)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, 120, 12)
    g.fillStyle = '#C3CCDD'
    g.beginPath()
    g.roundRect(10, 20, 40, 48, 6)
    g.fill()
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i === 0 ? '#8A97B2' : '#C3CCDD'
      g.fillRect(58, 22 + i * 14, 50 - i * 8, 7)
    }
  })
  const scrG = new THREE.Group()
  scrG.add(box(0.03, 0.26, 0.03, mat('#5E6B86', { metalness: 0.5, roughness: 0.35 }), [0, 0.13, 0]))
  scrG.add(box(0.3, 0.2, 0.03, mat('#1F2E63', { roughness: 0.3 }), [0, 0.33, 0], 0.01))
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.17), basic(appScr, { transparent: false }))
  sc.position.set(0, 0.33, 0.016)
  scrG.add(sc)
  scrG.position.set(1.8, COUNTER.h, -0.48)
  scrG.rotation.y = -0.35
  scene.add(scrG)
  /* the app's front: LED strip */
  const ledM = glowM('#8DB0FF', '#8DB0FF')
  ledM.emissiveIntensity = 0.8
  scene.add(box(COUNTER.x1 - COUNTER.x0 - 0.12, 0.025, 0.01, ledM, [(COUNTER.x0 + COUNTER.x1) / 2, 0.68, COUNTER.z + COUNTER.d / 2 + 0.005]))
  /* a thin cable from the app back to the far database: connected, but far */
  const cable = mkPath([new THREE.Vector3(1.2, 0.02, COUNTER.z - COUNTER.d / 2), new THREE.Vector3(1.2, 0.02, -1.6), new THREE.Vector3(DB.x + 0.3, 0.02, -1.6), new THREE.Vector3(DB.x + 0.3, 0.02, DB.z + 0.35)])
  conduit(scene, cable, mat('#9AA6BA', { roughness: 0.5 }), 0.025)

  /* the cache beside the app, at the rack's place: a glass-fronted cabinet of popular data, its mark on the header */
  const R = RACK
  const cabM = mat('#E8EDF6', { roughness: 0.35, metalness: 0.35 })
  for (const sx of [-1, 1]) scene.add(box(0.03, R.h, R.d, cabM, [R.x + (sx * R.w) / 2, R.h / 2, R.z]))
  scene.add(box(R.w, R.h, 0.015, mat('#25356E', { roughness: 0.5 }), [R.x, R.h / 2, R.z - R.d / 2]))
  for (const y of R.tiers) scene.add(box(R.w, 0.018, R.d, cabM, [R.x, y, R.z]))
  const cacheMark = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), basic(markTex(cacheUrl, redraw), { transparent: false }))
  cacheMark.position.set(R.x, R.h + 0.12, R.z + R.d / 2)
  scene.add(cacheMark)
  scene.add(box(R.w + 0.04, 0.025, R.d, cabM, [R.x, R.h + 0.0125, R.z]))
  const tmp = new THREE.Vector3()
  for (let col = 0; col < 2; col++)
    for (let tier = 0; tier < 4; tier++) {
      if (SLOT21.some(([c0, t0]) => c0 === col && t0 === tier)) continue
      for (let dpt = 0; dpt < 3; dpt++) {
        const d = makeData()
        d.g.position.set(R.x + R.cols[col], R.tiers[tier] + 0.055, R.z + R.d / 2 - 0.06 - dpt * 0.075)
        scene.add(d.g)
      }
    }
  const rows = SLOT21.map((_, k) =>
    Array.from({ length: 3 }, (_, dpt) => {
      const d = makeData()
      d.g.position.copy(slotWorld(k, dpt, tmp)).add(new THREE.Vector3(0, 0.043, 0))
      scene.add(d.g)
      return d.g
    }),
  )
  const flying = SLOT21.map(() => {
    const d = makeData()
    d.g.visible = false
    scene.add(d.g)
    return d
  })
  const cacheGlow = halo('rgba(255,180,80,0.95)', 0.34)
  scene.add(cacheGlow)

  /* the queue: a rail along the line's places, its mark at the left */
  const railY = 0.86
  const railM = new THREE.MeshStandardMaterial({ color: '#BFD2FF', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.75 })
  scene.add(box(6.2, 0.04, 0.3, railM, [0.0, railY, P21.lane], 0.012))
  for (const sz of [-1, 1]) scene.add(box(6.2, 0.035, 0.02, mat('#7FA0F5', { roughness: 0.3, metalness: 0.3 }), [0.0, railY + 0.035, P21.lane + sz * 0.14]))
  for (const x of [-2.6, -1.62, -0.88, 0.0, 0.62, 2.5]) scene.add(box(0.04, railY, 0.04, mat('#7FA0F5', { metalness: 0.4, roughness: 0.3 }), [x, railY / 2, P21.lane]))
  const sqsMark = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), basic(markTex(sqsUrl, redraw), { transparent: false }))
  sqsMark.position.set((P21.q1 + P21.q2) / 2, railY - 0.16, P21.lane + 0.03)
  scene.add(sqsMark)
  scene.add(box(0.025, 0.12, 0.025, mat('#7FA0F5'), [(P21.q1 + P21.q2) / 2, railY - 0.04, P21.lane]))
  const reqs = Array.from({ length: N21 }, () => {
    const r = makeRequest()
    scene.add(r.g)
    return r
  })
  /* the answer each request leaves with: the processed (green) item riding on top */
  const answers = Array.from({ length: N21 }, () => {
    const d = makeData()
    d.g.visible = false
    scene.add(d.g)
    return d
  })

  /* the worker at the cashier's place */
  const armBase = new THREE.Vector3(1.58, COUNTER.h, COUNTER.z - 0.17)
  scene.add(box(0.26, 0.02, 0.2, mat('#1F2E63'), [armBase.x, COUNTER.h + 0.01, armBase.z]))
  const arm = robotArm(scene, armBase, 0.5, 0.48)
  const restP = new THREE.Vector3(1.4, 1.36, -0.55)
  const pickP = new THREE.Vector3(BELT.x1 - 0.02, COUNTER.h + 0.045, COUNTER.z + 0.05)
  const procP = new THREE.Vector3(SCAN.x, COUNTER.h + 0.12, SCAN.z)
  const giveP = HANDOFF.clone().add(new THREE.Vector3(0.06, 0.02, -0.1))

  const clk = slideClock('J21', scene, devHold(HOLD21), [])
  const beltStart = new THREE.Vector3(BELT.x0 + 0.03, COUNTER.h + 0.045, COUNTER.z + 0.05)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const grip = new THREE.Vector3()
  const green = new THREE.Color('#3BD16F')
  const amber = new THREE.Color('#FFB347')
  const amberE = new THREE.Color('#FF9F2E')
  const greenE = new THREE.Color('#22C55E')
  return (t: number) => {
    const c = mod(clk.time(t), L21)
    const fc = mod(c, S21)
    beltTex.offset.x = -(Math.floor(c / S21) * 0.25 + 0.25 * clamp01((fc - E21.belt[0]) / (E21.belt[1] - E21.belt[0])))
    /* the worker, beat for beat with the cashier: rest, take from the belt, through the ring, out to the request */
    const toPick = hold(fc, E21.cPick[0] - 0.08, E21.cPick[1], E21.cHas, E21.cScan[0] + 0.06)
    const toProc = hold(fc, E21.cHas, E21.cScan[0] + 0.06, E21.cScan[1] - 0.04, E21.cGive[0] + 0.04)
    const toGive = hold(fc, E21.cGive[0], E21.cGive[1], E21.swap + 0.04, E21.cBack[1])
    grip.copy(restP)
    grip.lerp(pickP, toPick)
    grip.lerp(procP, toProc)
    grip.lerp(giveP, toGive)
    grip.y += 0.03 * Math.sin(c * TAU * 0.5) * (1 - Math.max(toPick, toProc, toGive))
    const holding = fc >= E21.cHas && fc < E21.swap
    arm.reach(grip, holding ? 0 : 1 - 0.6 * toPick)
    const proc = hold(fc, E21.beep - 0.03, E21.beep, E21.beep + 0.12, E21.beep + 0.3)
    ;(procGlow.material as THREE.MeshBasicMaterial).opacity = proc
    ;(procRing.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + 0.9 * proc
    procRing.rotation.y = c * 1.2
    let glowAt = -1
    for (let k = 0; k < N21; k++) {
      const f = phase21(c, k)
      const at = place21(f)
      const r = reqs[k]
      r.g.visible = at.shown
      r.g.position.set(at.x, railY + 0.02 + 0.03 * Math.abs(Math.sin(f * Math.PI * 2.2)) * at.walking, P21.lane)
      /* the head of the queue glows while it is being served */
      const serving = hold(f, E21.step[1] - 0.1, E21.step[1] + 0.1, E21.exit[0], E21.exit[0] + 0.3)
      r.m.emissiveIntensity = 0.25 + 0.45 * serving
      /* the cache slot */
      const taken = f >= E21.grab && f < E21.restock[1]
      const back = taken ? 1 - seg(f, E21.restock[0], E21.restock[1]) : 0
      rows[k].forEach((d, dpt) => {
        slotWorld(k, dpt + back, d.position).add(new THREE.Vector3(0, 0.043, 0))
        d.visible = !(taken && dpt === 2 && f < E21.restock[0])
      })
      if (f >= E21.reach[0] && f < E21.grab + 0.2) glowAt = k
      /* the item: cache -> belt (a quick hop) -> worker -> processed -> onto the request -> out */
      const d = flying[k]
      const ans = answers[k]
      d.g.visible = at.shown && f >= E21.grab && f < E21.swap + 0.06
      ans.g.visible = at.shown && f >= E21.swap + 0.06 && f < E21.exit[1]
      if (d.g.visible) {
        if (f < E21.belt[0]) {
          slotWorld(k, 0, a).add(new THREE.Vector3(0, 0.043, 0))
          const kk = seg(f, E21.grab, E21.belt[0] - 0.02)
          d.g.position.lerpVectors(a, beltStart, kk)
          d.g.position.y += Math.sin(kk * Math.PI) * 0.16
        } else if (f < E21.belt[1]) {
          d.g.position.set(lerp(beltStart.x, pickP.x, (f - E21.belt[0]) / (E21.belt[1] - E21.belt[0])), beltStart.y, beltStart.z)
        } else if (f < E21.cHas) {
          d.g.position.copy(pickP)
        } else if (f < E21.swap) {
          d.g.position.copy(grip)
        } else {
          b.copy(r.g.position).add(new THREE.Vector3(0, 0.3, 0))
          d.g.position.lerpVectors(grip, b, seg(f, E21.swap, E21.swap + 0.06))
        }
        const done = seg(f, E21.beep - 0.02, E21.beep + 0.08)
        d.m.color.copy(amber).lerp(green, done)
        d.m.emissive.copy(amberE).lerp(greenE, done)
        d.g.rotation.y = f < E21.belt[0] ? (f - E21.grab) * 6 : 0
      }
      if (ans.g.visible) {
        ans.m.color.copy(green)
        ans.m.emissive.copy(greenE)
        ans.g.position.copy(r.g.position).add(new THREE.Vector3(0, 0.3, 0))
      }
    }
    /* the slot being read lights up */
    if (glowAt >= 0) {
      const f = phase21(c, glowAt)
      slotWorld(glowAt, 0, cacheGlow.position).add(new THREE.Vector3(0, 0.05, 0.06))
      ;(cacheGlow.material as THREE.MeshBasicMaterial).opacity = hold(f, E21.reach[0], E21.reach[1], E21.grab, E21.grab + 0.2)
    } else (cacheGlow.material as THREE.MeshBasicMaterial).opacity = 0
  }
}

/* ================================================================== T23 · the household breaker */

const L23 = 8
const F23 = 96
const HOLD23 = 2.95 /* just tripped: the lever down, the room dark, the wiring cooling, his relief */
const P23 = {
  wallZ: -1.0,
  man: 0.62,
  manAtBoard: 0.47,
  mz: -0.35,
  hM: 1.72,
  meter: new THREE.Vector3(-1.45, 1.55, -0.93),
  board: { x: -0.42, y: 1.12, w: 0.56, h: 0.5 },
  lever: new THREE.Vector3(-0.27, 1.12, -0.9),
  socket: new THREE.Vector3(0.98, 0.42, -0.985),
  table: { x: 1.3, z: -0.7, w: 0.6, h: 0.74, d: 0.44 },
  kettle: new THREE.Vector3(1.22, 0.74, -0.68),
  lamp: new THREE.Vector3(1.3, 2.08, -0.7),
}
const E23 = {
  press: [0.15, 0.42, 0.5, 0.8] as const,
  fault: [1.2, 2.3] as const,
  trip: 2.3,
  relief: [2.5, 2.75] as const,
  walkL: [3.0, 3.5] as const,
  reach: [4.4, 4.72] as const,
  reset: 4.8,
  armDown: [4.9, 5.15] as const,
  walkR: [5.55, 6.05] as const,
}
/** the breaker (and the switch) closed at loop time c */
const closed23 = (c: number) => {
  const m = mod(c, L23)
  return m < E23.trip || m >= E23.reset
}
const failing23 = (c: number) => {
  const m = mod(c, L23)
  return m >= E23.fault[0] && m < E23.trip
}
/** the one wiring route, both cards: supply -> board / switch -> socket -> the appliance / the service */
const ROUTE23 = [
  new THREE.Vector3(-1.45, 1.8, -0.95),
  new THREE.Vector3(-1.45, 1.98, -0.95),
  new THREE.Vector3(-0.42, 1.98, -0.95),
  new THREE.Vector3(-0.42, 1.38, -0.95),
  /* through the board / the switch */
  new THREE.Vector3(-0.42, 0.86, -0.95),
  new THREE.Vector3(-0.42, 0.42, -0.95),
  new THREE.Vector3(0.94, 0.42, -0.95),
]
const IDX_IN = 3 /* the route enters the board / the switch */
const V23 = 0.45
const GAP23 = 0.3 /* L23 * V23 / GAP23 = 12 launches a loop: the flow meets itself */

function cam23(camera: THREE.PerspectiveCamera) {
  camera.fov = 43
  camera.position.set(0.0, 1.42, 3.55)
  camera.lookAt(0.0, 1.1, -0.6)
  camera.updateProjectionMatrix()
}

function room23(scene: THREE.Scene, o: { wall: string; floor: [string, string]; trim: string }) {
  const wz = P23.wallZ
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.3 })
  scene.add(flat(box(8, 3.4, 0.12, wallM, [0, 1.7, wz - 0.06])))
  const fl = flat(mesh(new THREE.PlaneGeometry(8, 6), mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 4, [9, 6]), roughness: 0.8 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  scene.add(box(8, 0.1, 0.03, mat(o.trim, { roughness: 0.7 }), [0, 0.05, wz + 0.015]))
  return { wallM }
}

/** the pulses along the route: launched every GAP/V seconds, cut at the board when it is open at their arrival */
function pulses(scene: THREE.Scene, path: Path, n: number, r: number) {
  const list = Array.from({ length: n }, () => {
    const m = new THREE.MeshBasicMaterial({ color: '#FFE9A8', toneMapped: false, transparent: true })
    const s = mesh(new THREE.SphereGeometry(r, 14, 10), m, [0, 0, 0])
    s.castShadow = false
    s.visible = false
    scene.add(s)
    return { s, m }
  })
  const sIn = sAt(path, IDX_IN)
  const sOut = sAt(path, IDX_IN + 1)
  const dt = GAP23 / V23
  return {
    sIn,
    update(c: number, live: string, fault: string, cut?: (t: number) => void) {
      const j0 = Math.floor(c / dt)
      list.forEach((p, i) => {
        const tl = (j0 - i) * dt
        const sPos = (c - tl) * V23
        if (sPos < 0 || sPos > path.len) {
          p.s.visible = false
          return
        }
        /* when it reaches the board: open then, it stops there */
        const tIn = tl + sIn / V23
        if (sPos > sIn && !closed23(tIn)) {
          p.s.visible = false
          cut?.(c - tIn)
          return
        }
        p.s.visible = true
        pathAt(path, sPos, p.s.position)
        /* hidden while inside the board / the switch box */
        if (sPos > sIn + 0.02 && sPos < sOut - 0.02) p.s.visible = false
        const hot = sPos > sOut && failing23(c) ? 1 : 0
        p.m.color.set(hot ? fault : live)
      })
    },
  }
}

/* the man of the house: his right arm to the kettle switch, the fright, a hand to his chest, the reset with his left */
type ManArms = { kettle: Arm; lever: Arm }
const manX = (c: number) => {
  const a = seg(c, E23.walkL[0], E23.walkL[1])
  const b = seg(c, E23.walkR[0], E23.walkR[1])
  return lerp(lerp(P23.man, P23.manAtBoard, a), P23.man, b)
}
const manWalking = (c: number) => Math.max(hold(c, E23.walkL[0], E23.walkL[0] + 0.08, E23.walkL[1] - 0.08, E23.walkL[1]), hold(c, E23.walkR[0], E23.walkR[0] + 0.08, E23.walkR[1] - 0.08, E23.walkR[1]))
function manArmR(c: number, A: ManArms): Arm {
  let a: Arm = { s: 9 - swing(c, manWalking(c)), e: 10 }
  a = mixArm(a, A.kettle, hold(c, E23.press[0], E23.press[1], E23.press[2], E23.press[3]))
  a = mixArm(a, { s: 48, e: 112 }, hold(c, E23.fault[0] + 0.1, E23.fault[0] + 0.3, E23.trip + 0.1, E23.relief[0] + 0.1))
  a = mixArm(a, { s: 22, e: 118 }, hold(c, E23.relief[0], E23.relief[1], E23.walkL[0], E23.walkL[0] + 0.25))
  return a
}
function manArmL(c: number, A: ManArms): Arm {
  let a: Arm = { s: 9 + swing(c, manWalking(c)), e: 10 }
  a = mixArm(a, { s: 46, e: 108 }, hold(c, E23.fault[0] + 0.1, E23.fault[0] + 0.3, E23.trip + 0.1, E23.relief[0] + 0.1))
  const lev = hold(c, E23.reach[0], E23.reach[1], E23.armDown[0], E23.armDown[1])
  /* the flick: the hand rides the lever up */
  const flick = seg(c, E23.reach[1], E23.reset + 0.04)
  a = mixArm(a, { s: A.lever.s + 6 * flick, e: A.lever.e - 4 * flick }, lev)
  return a
}
function manPose(A: ManArms) {
  return (p: Pose, c: number) => {
    const r = manArmR(c, A)
    const l = manArmL(c, A)
    p.shoulderR = r.s
    p.elbowR = r.e
    p.shoulderL = l.s
    p.elbowL = l.e
    /* at the kettle, eyes down on it */
    const kettle = Math.max(hold(c, 0, 0.05, 1.9, 2.4), hold(c, 6.1, 6.4, L23, L23 + 1))
    to(p, 'headTurn', 0.45, kettle)
    to(p, 'lookX', 0.9, kettle)
    to(p, 'headNod', 0.2, kettle)
    to(p, 'lookY', 0.45, kettle)
    /* the fright: a jolt back */
    const fright = hold(c, E23.fault[0] + 0.05, E23.fault[0] + 0.25, E23.trip, E23.relief[1])
    to(p, 'lean', -5, fright)
    to(p, 'headY', -4, fright)
    to(p, 'pupil', 0.8, fright)
    /* relief: a breath out, the head tips */
    const relief = hold(c, E23.relief[0], E23.relief[1], E23.walkL[0] - 0.1, E23.walkL[0] + 0.2)
    to(p, 'headTilt', 5, relief)
    to(p, 'headNod', 0.12, relief)
    walkLegs(p, c, manWalking(c), c < 4.5 ? -1 : 1)
    /* at the board: looks at it, waits, resets */
    const board = hold(c, E23.walkL[0] + 0.2, E23.walkL[1], E23.armDown[1], E23.walkR[0])
    to(p, 'headTurn', -0.45, board)
    to(p, 'lookX', -0.9, board)
    to(p, 'headY', -3, board)
    /* a lean toward the board for the reach */
    to(p, 'lean', -4, hold(c, E23.reach[0] - 0.1, E23.reach[1], E23.armDown[0], E23.armDown[1]))
  }
}
const MAN_FACES: [number, string][] = [
  [0, 'happy'],
  [E23.fault[0] + 0.08, 'shocked'],
  [E23.relief[0], 'happy'],
  [3.6, 'thinking'],
  [E23.reset + 0.05, 'grin'],
  [6.2, 'happy'],
]

/* ------------------------------------------------------------------ T23 everyday: the living room at night */

function setupT23Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  const bgOn = new THREE.Color('#F1EADF')
  const bgOff = new THREE.Color('#7A8096')
  scene.background = bgOn.clone()
  cam23(camera)
  const L = lights(scene, [-0.1, 1.0, -0.6])
  const { wallM } = room23(scene, { wall: '#F3E6D2', floor: ['#C9A983', '#B8966E'], trim: '#8C6440' })
  const wallOn = new THREE.Color('#F3E6D2')

  /* the electricity meter: the supply, its cable coming down the wall */
  const M = P23.meter
  scene.add(box(0.3, 0.42, 0.12, mat('#E2E6EE', { roughness: 0.5 }), [M.x, M.y, M.z], 0.02))
  scene.add(box(0.2, 0.13, 0.01, mat('#1F2E63', { roughness: 0.3 }), [M.x, M.y + 0.07, M.z + 0.065]))
  const dial = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24), mat('#FFFFFF', { roughness: 0.4 }), [M.x, M.y - 0.09, M.z + 0.066])
  dial.rotation.x = Math.PI / 2
  scene.add(dial)
  const dialPtr = box(0.006, 0.034, 0.004, mat('#E8642A'), [0, 0.012, 0])
  const dialG = new THREE.Group()
  dialG.position.set(M.x, M.y - 0.09, M.z + 0.074)
  dialG.add(dialPtr)
  scene.add(dialG)
  const meterLed = halo('rgba(255,170,80,0.9)', 0.08)
  meterLed.position.set(M.x + 0.1, M.y + 0.15, M.z + 0.07)
  scene.add(meterLed)

  /* the wiring: white conduit on the wall along the route; the board-to-socket run is the one that heats */
  const path = mkPath(ROUTE23)
  const condM = mat('#FBFBF7', { roughness: 0.6 })
  conduit(scene, mkPath([new THREE.Vector3(-1.45, 3.4, -0.95), new THREE.Vector3(-1.45, 1.78, -0.95)]), condM)
  conduit(scene, mkPath(ROUTE23.slice(0, IDX_IN + 1)), condM)
  const hotM = new THREE.MeshStandardMaterial({ color: '#FBFBF7', roughness: 0.6, emissive: new THREE.Color('#FF6A1A'), emissiveIntensity: 0 })
  conduit(scene, mkPath(ROUTE23.slice(IDX_IN + 1)), hotM)
  /* the socket and the kettle's plug */
  const S = P23.socket
  scene.add(box(0.14, 0.14, 0.02, mat('#FFFFFF', { roughness: 0.4 }), [S.x, S.y, S.z + 0.01], 0.01))
  scene.add(box(0.05, 0.07, 0.06, mat('#3A3F4C', { roughness: 0.5 }), [S.x, S.y, S.z + 0.05], 0.01))
  /* the kettle's cord: from the plug down, along the floor, up the table leg to the kettle */
  const T = P23.table
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(S.x, S.y - 0.02, S.z + 0.08),
    new THREE.Vector3(S.x + 0.04, 0.12, -0.86),
    new THREE.Vector3(S.x + 0.14, 0.02, -0.8),
    new THREE.Vector3(T.x - T.w / 2 + 0.05, 0.04, -0.78),
    new THREE.Vector3(T.x - T.w / 2 + 0.03, 0.45, -0.82),
    new THREE.Vector3(T.x - 0.08, T.h + 0.01, -0.8),
    new THREE.Vector3(P23.kettle.x - 0.03, T.h + 0.02, P23.kettle.z - 0.05),
  ])
  const cordM = new THREE.MeshStandardMaterial({ color: '#30343F', roughness: 0.6, emissive: new THREE.Color('#FF6A1A'), emissiveIntensity: 0 })
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 64, 0.011, 8), cordM))
  /* the side table and the kettle */
  const wood = mat('#9C6B43', { roughness: 0.6 })
  scene.add(box(T.w, 0.04, T.d, wood, [T.x, T.h - 0.02, T.z], 0.01))
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) scene.add(box(0.04, T.h - 0.04, 0.04, mat('#7E5232'), [T.x + lx * (T.w / 2 - 0.05), (T.h - 0.04) / 2, T.z + lz * (T.d / 2 - 0.05)]))
  const K = P23.kettle
  const kettleM = mat('#E8EDF6', { roughness: 0.25, metalness: 0.55 })
  scene.add(cyl(0.085, 0.085, 0.025, mat('#2B2F3A', { roughness: 0.5 }), [K.x, K.y + 0.0125, K.z], 28))
  scene.add(cyl(0.07, 0.09, 0.2, kettleM, [K.x, K.y + 0.125, K.z], 32))
  scene.add(cyl(0.035, 0.05, 0.03, kettleM, [K.x, K.y + 0.235, K.z], 24))
  scene.add(cyl(0.015, 0.015, 0.02, mat('#2B2F3A'), [K.x, K.y + 0.26, K.z], 12))
  const spout = cyl(0.016, 0.026, 0.1, kettleM, [K.x - 0.1, K.y + 0.17, K.z], 14)
  spout.rotation.z = 0.9
  scene.add(spout)
  const handle = mesh(new THREE.TorusGeometry(0.06, 0.014, 10, 24, Math.PI), mat('#2B2F3A', { roughness: 0.4 }), [K.x + 0.085, K.y + 0.13, K.z])
  handle.rotation.z = -Math.PI / 2
  scene.add(handle)
  const kLedM = new THREE.MeshBasicMaterial({ color: '#5B8CFF', toneMapped: false, transparent: true, opacity: 0 })
  const kLed = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), kLedM)
  kLed.position.set(K.x + 0.05, K.y + 0.07, K.z + 0.075)
  scene.add(kLed)
  const steam = halo('rgba(255,255,255,0.9)', 0.22)
  scene.add(steam)
  /* sparks at the kettle's base and its plug */
  const sparkTex = canvasTex(32, 32, (g) => {
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    r.addColorStop(0, 'rgba(255,255,230,1)')
    r.addColorStop(0.35, 'rgba(255,190,80,0.95)')
    r.addColorStop(1, 'rgba(255,120,40,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 32, 32)
  })
  const sparks = Array.from({ length: 9 }, () => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
    s.renderOrder = 6
    scene.add(s)
    return s
  })
  const faultGlow = halo('rgba(255,140,60,0.9)', 0.5)
  faultGlow.position.set(K.x - 0.04, K.y + 0.06, K.z + 0.12)
  scene.add(faultGlow)

  /* the distribution board: a grey box, its door open, six breakers; the kettle circuit's is the fifth */
  const B = P23.board
  scene.add(box(B.w, B.h, 0.11, mat('#D9DEE8', { roughness: 0.45, metalness: 0.3 }), [B.x, B.y, -0.94], 0.015))
  scene.add(box(B.w - 0.06, B.h - 0.06, 0.01, mat('#3E4656', { roughness: 0.6 }), [B.x, B.y, -0.88]))
  const door = new THREE.Group()
  door.position.set(B.x - B.w / 2, B.y, -0.885)
  door.rotation.y = -1.95
  door.add(box(B.w, B.h, 0.015, mat('#CBD2DE', { roughness: 0.45, metalness: 0.3 }), [B.w / 2, 0, 0], 0.01))
  scene.add(door)
  scene.add(box(B.w - 0.1, 0.02, 0.012, mat('#9AA3B5', { metalness: 0.6 }), [B.x, B.y, -0.872]))
  let lever: THREE.Group | null = null
  let flagM: THREE.MeshBasicMaterial | null = null
  for (let i = 0; i < 6; i++) {
    const x = B.x - 0.2 + i * 0.075 + (i === 0 ? 0 : 0.02)
    const wide = i === 0
    scene.add(box(wide ? 0.09 : 0.06, 0.16, 0.05, mat('#F7F9FC', { roughness: 0.45 }), [x, B.y, -0.855], 0.006))
    const lv = new THREE.Group()
    lv.position.set(x, B.y, -0.83)
    lv.add(box(wide ? 0.05 : 0.028, 0.026, 0.055, mat(wide ? '#1F2E63' : '#2B2F3A', { roughness: 0.4 }), [0, 0, 0.022]))
    lv.rotation.x = -0.55
    scene.add(lv)
    if (i === 4) {
      lever = lv
      flagM = new THREE.MeshBasicMaterial({ color: '#2D63FB', toneMapped: false })
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.03), flagM)
      flag.position.set(x, B.y - 0.055, -0.829)
      scene.add(flag)
    }
  }

  /* the room's light: a pendant above the table */
  const Lp = P23.lamp
  scene.add(cyl(0.006, 0.006, 1.2, mat('#2B2F3A'), [Lp.x, Lp.y + 0.7, Lp.z], 8))
  scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.17, 32, 1, true), mat('#2D63FB', { roughness: 0.4, side: THREE.DoubleSide }), [Lp.x, Lp.y + 0.06, Lp.z]))
  const bulbM = new THREE.MeshBasicMaterial({ color: '#FFF1C9', toneMapped: false })
  scene.add(mesh(new THREE.SphereGeometry(0.05, 20, 14), bulbM, [Lp.x, Lp.y - 0.01, Lp.z]))
  const bulbGlow = halo('rgba(255,230,160,0.95)', 0.6)
  bulbGlow.position.set(Lp.x, Lp.y - 0.02, Lp.z + 0.05)
  scene.add(bulbGlow)
  const lampLight = new THREE.PointLight(0xffe2a8, 1.4, 4, 1.6)
  lampLight.position.set(Lp.x, Lp.y - 0.08, Lp.z + 0.1)
  scene.add(lampLight)

  /* the current */
  const flow = pulses(scene, path, 14, 0.022)

  /* the man of the house, at home in a cardigan */
  const mCfg = who(CAST_PRESETS.dev, { name: 'Homeowner', skinTone: 'medium', hair: { style: 'short', color: 'black' }, outfit: { top: 'tshirt', topColor: '#F2F5FA', bottom: 'trousers', bottomColor: '#3E4A66', shoeColor: '#5A3A2A' }, accessories: { glasses: 'rect', beard: 'none', watch: true } })
  const shM = buildSkin(mCfg).shoulderHalf
  const atKettle = new THREE.Vector3(P23.man, 0, P23.mz)
  const atBoard = new THREE.Vector3(P23.manAtBoard, 0, P23.mz)
  const arms: ManArms = {
    kettle: solveArm('R', shM, worldToRig(new THREE.Vector3(K.x + 0.06, K.y + 0.08, K.z + 0.06), atKettle, P23.hM, camera)),
    lever: solveArm('L', shM, worldToRig(P23.lever.clone().add(new THREE.Vector3(0, -0.02, 0.05)), atBoard, P23.hM, camera)),
  }
  const hold23 = devHold(HOLD23)
  const man = person({ config: mCfg, dress: withTop(CARDIGAN('#8A5A33', '#6B4426')), seed: 1831, faces: MAN_FACES, pose: manPose(arms), loop: L23, height: P23.hM, frames: F23, redraw, holdT: hold23 })
  scene.add(man.object)
  const clk = slideClock('J23', scene, hold23, [man])

  const dim = new THREE.Color()
  return (t: number) => {
    const c = mod(clk.time(t), L23)
    man.object.position.set(manX(c), bob(manWalking(c), c), P23.mz)
    man.update(c, camera)
    /* power: off from the trip to the reset, a flicker while the fault burns */
    const off = hold(c, E23.trip, E23.trip + 0.12, E23.reset, E23.reset + 0.1)
    const flick = failing23(c) ? 0.25 * Math.max(0, Math.sin(c * 47) * Math.sin(c * 23)) : 0
    const power = (1 - off) * (1 - flick)
    L.hemi.intensity = lerp(0.55, 0.95, power)
    L.key.intensity = lerp(0.75, 2.0, power)
    L.rim.intensity = lerp(0.35, 0.55, power)
    lampLight.intensity = 1.4 * power
    bulbM.color.set('#5A5E6B').lerp(new THREE.Color('#FFF1C9'), power)
    ;(bulbGlow.material as THREE.MeshBasicMaterial).opacity = 0.9 * power
    dim.copy(bgOff).lerp(bgOn, power)
    ;(scene.background as THREE.Color).copy(dim)
    wallM.emissiveIntensity = lerp(0.1, 0.3, power)
    wallM.color.copy(wallOn)
    /* the meter turns as long as current is drawn */
    dialG.rotation.z = -c * TAU * (2 / L23)
    ;(meterLed.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * Math.sin(c * TAU)
    /* the kettle: on from the press to the trip; steam while it boils */
    const kOn = hold(c, E23.press[1], E23.press[1] + 0.05, E23.trip, E23.trip + 0.05)
    kLedM.opacity = kOn
    steam.position.set(K.x - 0.15, K.y + 0.27 + 0.05 * mod(c * 2, 1), K.z + 0.05)
    ;(steam.material as THREE.MeshBasicMaterial).opacity = 0.5 * seg(c, 0.6, 1.1) * (1 - seg(c, E23.fault[0], E23.fault[0] + 0.4))
    /* the fault: sparks, the cord and the wiring heat up; after the trip they cool */
    const heat = seg(c, E23.fault[0] + 0.1, E23.trip) * (1 - seg(c, E23.trip, E23.trip + 1.0))
    cordM.emissiveIntensity = 1.6 * heat
    cordM.color.set('#30343F').lerp(new THREE.Color('#8A3A1A'), heat)
    hotM.emissiveIntensity = 0.9 * heat
    ;(faultGlow.material as THREE.MeshBasicMaterial).opacity = failing23(c) ? 0.55 + 0.35 * Math.sin(c * 40) : heat * 0.4
    const tick = Math.floor(c / 0.07)
    sparks.forEach((s, i) => {
      const on = failing23(c) && hash(tick * 9 + i) > 0.35
      const m = s.material as THREE.MeshBasicMaterial
      m.opacity = on ? 0.6 + 0.4 * hash(tick * 13 + i) : 0
      const nearPlug = i < 3
      const bx = nearPlug ? S.x : K.x - 0.02
      const by = nearPlug ? S.y : K.y + 0.03
      const bz = nearPlug ? S.z + 0.09 : K.z + 0.1
      s.position.set(bx + (hash(tick * 3 + i) - 0.5) * 0.18, by + hash(tick * 5 + i) * 0.14, bz)
      s.scale.setScalar(0.5 + hash(tick * 7 + i))
      s.quaternion.copy(camera.quaternion)
    })
    /* the breaker: up (on, blue flag) -> snapped down (tripped, orange flag) -> pushed back up by his hand */
    const down = seg(c, E23.trip, E23.trip + 0.06) * (1 - seg(c, E23.reset - 0.06, E23.reset + 0.02))
    if (lever) lever.rotation.x = lerp(-0.55, 0.55, down)
    if (flagM) flagM.color.set(down > 0.5 ? C.orange : C.brand)
    flow.update(c, '#FFE29A', '#FF8A3D')
  }
}

/* ------------------------------------------------------------------ T23 concept: the caller, the breaker, the service */

/** a service: a server cabinet, its face lit; returns the face's material */
function serviceBox(scene: THREE.Scene, x: number, z: number, w: number, h: number, faceColor: string) {
  scene.add(box(w, h, 0.4, mat('#1F2E63', { roughness: 0.35, metalness: 0.3 }), [x, h / 2, z], 0.02))
  const faceM = new THREE.MeshStandardMaterial({ color: '#25356E', emissive: new THREE.Color(faceColor), emissiveIntensity: 0.35, roughness: 0.4 })
  const rows = Math.max(3, Math.round(h / 0.16))
  for (let i = 0; i < rows; i++) {
    scene.add(box(w - 0.08, (h - 0.12) / rows - 0.03, 0.01, faceM, [x, 0.08 + ((i + 0.5) * (h - 0.12)) / rows, z + 0.205]))
  }
  const leds = Array.from({ length: rows }, (_, i) => {
    const m = new THREE.MeshBasicMaterial({ color: '#8DB0FF', toneMapped: false })
    const l = mesh(new THREE.CircleGeometry(0.014, 12), m, [x + w / 2 - 0.08, 0.08 + ((i + 0.5) * (h - 0.12)) / rows, z + 0.212])
    scene.add(l)
    return m
  })
  return { faceM, leds }
}

function setupT23Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  cam23(camera)
  lights(scene, [-0.1, 1.0, -0.6])
  room23(scene, { wall: '#E9EEF8', floor: ['#E3EAF8', '#C9D5EC'], trim: '#1F2E63' })

  /* the caller service at the supply's place: a tall cabinet, the line leaves from its top */
  const caller = serviceBox(scene, -1.45, -0.74, 0.46, 1.74, '#2D63FB')
  /* the line: a cable along the same route as the wiring; the stretch after the breaker can glow */
  const path = mkPath([new THREE.Vector3(-1.45, 1.66, -0.95), ...ROUTE23.slice(1)])
  const lineM = mat('#5B7FE0', { roughness: 0.4 })
  conduit(scene, mkPath([new THREE.Vector3(-1.45, 1.66, -0.95), ...ROUTE23.slice(1, IDX_IN + 1)]), lineM, 0.04)
  const after = new THREE.MeshStandardMaterial({ color: '#5B7FE0', roughness: 0.4, emissive: new THREE.Color('#FF6A1A'), emissiveIntensity: 0 })
  conduit(scene, mkPath(ROUTE23.slice(IDX_IN + 1)), after, 0.04)

  /* the failing service at the kettle's place: a cabinet, the line enters at its foot */
  const T = P23.table
  const svc = serviceBox(scene, T.x, T.z, 0.62, 1.0, '#2D63FB')
  conduit(scene, mkPath([new THREE.Vector3(0.94, 0.42, -0.95), new THREE.Vector3(T.x - 0.2, 0.42, -0.95)]), after, 0.04)
  const svcGlow = halo('rgba(255,140,60,0.9)', 0.9)
  svcGlow.position.set(T.x, 0.55, T.z + 0.25)
  scene.add(svcGlow)
  /* its status light at the pendant's place: lit while it is reached */
  const BY = 1.1
  scene.add(cyl(0.06, 0.07, 0.04, mat('#5E6B86', { metalness: 0.5 }), [T.x, 1.02, T.z], 20))
  const beaconM = new THREE.MeshStandardMaterial({ color: '#BFD2FF', emissive: new THREE.Color('#5B8CFF'), emissiveIntensity: 1, roughness: 0.3 })
  scene.add(mesh(new THREE.SphereGeometry(0.06, 24, 16, 0, TAU, 0, Math.PI / 2), beaconM, [T.x, 1.04, T.z]))
  const beaconGlow = halo('rgba(120,160,255,0.95)', 0.5)
  beaconGlow.position.set(T.x, BY, T.z + 0.08)
  scene.add(beaconGlow)
  /* badges over the service: failed (orange cross), then healthy again (green tick) */
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), basic(badgeTex('cross'), { opacity: 0 }))
  const tickB = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), basic(badgeTex('tick'), { opacity: 0 }))
  for (const b of [cross, tickB]) {
    b.position.set(T.x, 1.36, T.z + 0.1)
    b.renderOrder = 8
    scene.add(b)
  }

  /* the breaker switch at the board's place: a panel, two terminals, a knife blade hinged at the bottom */
  const B = P23.board
  scene.add(box(B.w, B.h + 0.08, 0.11, mat('#1F2E63', { roughness: 0.35, metalness: 0.3 }), [B.x, B.y, -0.94], 0.02))
  scene.add(box(B.w - 0.06, B.h + 0.02, 0.01, mat('#2C3E7E', { roughness: 0.5 }), [B.x, B.y, -0.88]))
  const termM = mat('#D4A24A', { metalness: 0.75, roughness: 0.3 })
  const topT = new THREE.Vector3(B.x, B.y + 0.15, -0.85)
  const botT = new THREE.Vector3(B.x, B.y - 0.15, -0.85)
  scene.add(box(0.07, 0.05, 0.05, termM, [topT.x, topT.y, topT.z]), box(0.07, 0.05, 0.05, termM, [botT.x, botT.y, botT.z]))
  const blade = new THREE.Group()
  blade.position.copy(botT).add(new THREE.Vector3(0, 0, 0.03))
  blade.add(box(0.03, 0.3, 0.014, mat('#E7B35A', { metalness: 0.8, roughness: 0.25 }), [0, 0.15, 0]))
  blade.add(box(0.05, 0.04, 0.05, mat('#2D63FB', { roughness: 0.4 }), [0, 0.31, 0.02], 0.01))
  scene.add(blade)
  const gapGlow = halo('rgba(255,140,60,0.95)', 0.34)
  gapGlow.position.copy(topT).add(new THREE.Vector3(0, 0, 0.06))
  scene.add(gapGlow)
  /* the wait: a ring of dots round the switch that fill one by one */
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = Math.PI / 2 - (i / 12) * TAU
    const m = new THREE.MeshBasicMaterial({ color: '#C9D5EC', toneMapped: false, transparent: true, opacity: 0 })
    const d = mesh(new THREE.CircleGeometry(0.016, 14), m, [B.x + Math.cos(a) * 0.22, B.y + Math.sin(a) * 0.22, -0.874])
    scene.add(d)
    return m
  })

  const flow = pulses(scene, path, 14, 0.03)
  const stopGlow = halo('rgba(255,140,60,0.95)', 0.3)
  stopGlow.position.copy(pathAt(path, flow.sIn, new THREE.Vector3())).add(new THREE.Vector3(0, -0.02, 0.06))
  scene.add(stopGlow)

  const clk = slideClock('J23', scene, devHold(HOLD23), [])
  const blue = new THREE.Color('#2D63FB')
  const orange = new THREE.Color('#FF6A1A')
  const grey = new THREE.Color('#5E6B86')
  return (t: number) => {
    const c = mod(clk.time(t), L23)
    const open = seg(c, E23.trip, E23.trip + 0.08) * (1 - seg(c, E23.reset - 0.08, E23.reset + 0.02))
    blade.rotation.z = -1.0 * open
    ;(gapGlow.material as THREE.MeshBasicMaterial).opacity = open * (0.55 + 0.25 * Math.sin(c * TAU * 1.5))
    const fail = hold(c, E23.fault[0], E23.fault[0] + 0.25, E23.trip, E23.trip + 0.5)
    const idle = hold(c, E23.trip, E23.trip + 0.3, E23.reset, E23.reset + 0.2)
    /* the service: blue when answering, orange while failing, grey while nobody calls it */
    svc.faceM.emissive.copy(blue).lerp(orange, fail).lerp(grey, idle * (1 - fail))
    svc.faceM.emissiveIntensity = 0.35 + 0.35 * fail * (0.6 + 0.4 * Math.sin(c * 30))
    svc.leds.forEach((m, i) => m.color.set(fail > 0.5 ? (Math.sin(c * 20 + i) > 0 ? '#FF8A3D' : '#FFC79A') : idle > 0.5 ? '#9AA3B5' : Math.sin(c * 6 + i * 1.7) > -0.2 ? '#7FE0A0' : '#8DB0FF'))
    caller.leds.forEach((m, i) => m.color.set(Math.sin(c * 5 + i * 2.1) > -0.3 ? '#7FE0A0' : '#8DB0FF'))
    ;(svcGlow.material as THREE.MeshBasicMaterial).opacity = fail * (0.5 + 0.3 * Math.sin(c * 33))
    after.emissiveIntensity = 0.9 * seg(c, E23.fault[0] + 0.1, E23.trip) * (1 - seg(c, E23.trip, E23.trip + 0.8))
    /* the status light: lit while calls reach the service, flickering orange while it fails, out while it is cut off */
    beaconM.emissive.copy(new THREE.Color('#5B8CFF')).lerp(orange, fail)
    beaconM.emissiveIntensity = (1 - idle) * (fail > 0.5 ? 0.6 + 0.5 * Math.max(0, Math.sin(c * 47)) : 1)
    ;(beaconGlow.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - idle) * (1 - 0.5 * fail)
    ;(cross.material as THREE.MeshBasicMaterial).opacity = hold(c, E23.fault[0] + 0.2, E23.fault[0] + 0.4, E23.trip + 0.15, E23.trip + 0.45)
    ;(tickB.material as THREE.MeshBasicMaterial).opacity = hold(c, E23.reset + 0.5, E23.reset + 0.7, 6.4, 6.7)
    cross.quaternion.copy(camera.quaternion)
    tickB.quaternion.copy(camera.quaternion)
    /* the wait */
    const fill = clamp01((c - (E23.trip + 0.2)) / (E23.reset - 0.1 - (E23.trip + 0.2)))
    dots.forEach((m, i) => {
      m.opacity = open * 0.95
      m.color.set(open > 0 && i < Math.floor(fill * 12 + 0.001) ? '#2D63FB' : '#C9D5EC')
    })
    /* the calls: cut at the open switch, a small orange flash where they stop */
    let since = 9
    flow.update(c, '#5B8CFF', '#FF8A3D', (dt) => (since = Math.min(since, dt)))
    ;(stopGlow.material as THREE.MeshBasicMaterial).opacity = open * Math.max(0, 1 - since / 0.35) * 0.9
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
/* both cards of a slide on one clock (custom/clock.tsx): they fade in once their people are drawn; tap to pause */
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <ClockCard id={id} w={W} h={H}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T21Everyday: card('J21', setupT21Everyday, devHold(HOLD21)),
  J_T21Concept: card('J21', setupT21Concept, devHold(HOLD21)),
  J_T23Everyday: card('J23', setupT23Everyday, devHold(HOLD23)),
  J_T23Concept: card('J23', setupT23Concept, devHold(HOLD23)),
}
export const css = ''
