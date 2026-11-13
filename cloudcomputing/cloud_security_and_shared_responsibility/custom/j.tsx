import { useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'
import awsUrl from '../images/aws-logo.png'

/**
 * BUILDER J · SESSION 12 (Cloud Security & Shared Responsibility), SLIDE 12, TR 4 ANALOGY.
 *
 * TR: "A gated housing society's guard secures the main gate and compound walls; each resident still locks their own
 * flat door and safe: exactly as the cloud provider secures the data centre while the customer secures what is
 * configured inside their own account."
 *
 * Built to the Session 9-11 review rules from the first draft (generate-slides standing corrections 13-16, cloud course
 * R10-R13): real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera, a real place;
 * people are Character Lab characters on depth-tested planes (`rigSprite` below: the engine castSprite plus a `dress`
 * hook for role clothing and frames rebuilt at the person's real on-screen size, so they stay sharp up to 4K); no text
 * on either card; one loop of 7.2 s on wall-clock time that ends where it starts (no rest beat); held frames (`?still`,
 * thumbnails, reduced motion) draw the key moment at HOLD with nothing moving.
 *
 * The two cards share one ground plan, position for position (seen from the gate, so it is a different place from
 * slide 7's apartment block):
 *
 *   place                everyday (gated housing society)            concept (cloud data centre)
 *   left, the boundary   compound wall with the main gate            perimeter fence with the data-centre gate
 *   gate                 boom barrier, a car waits                   boom barrier, a hardware van waits
 *   beside the gate      the society guard (cap, uniform) stops       the data-centre security officer (cap, uniform)
 *                        the car, checks it, nods, lifts the barrier  does the same for the van        = security OF
 *   right, inside        a resident's flat (cut away)                the customer's own account space in the hall
 *   left of the person   his safe: door swings shut, dial spins       a storage bucket: lid closes, padlock snaps
 *   right of the person  his flat door: latch turns, bolt slides     a key vault door: wheel turns, bolts slide
 *                                                                                                   = security IN
 * Both vehicles leave behind the building, so the frame is empty of them at the loop's start and end (seamless). The
 * resident / customer then reopen both (the next day's routine) inside the last 1.3 s, so the loop restarts at once.
 */

const W = 470
const H = 390
const L = 7.2
const HOLD = 3.55 // barrier half up over the waiting vehicle, the guard's hand on it; the person turning the right-hand lock
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const HOLD_T = (() => {
  if (typeof window === 'undefined') return HOLD
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : HOLD
})()

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  white: '#FFFFFF',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  red: '#E5484D',
  green: '#3DBB7A',
}

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
/** 0 → 1 over [a0, a1], held, then 1 → 0 over [b0, b1] */
const hold = (t: number, a0: number, a1: number, b0: number, b1: number) => seg(t, a0, a1) * (1 - seg(t, b0, b1))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, seg = 32) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, pos)

/* drawn textures are rasterised at 3x so they stay crisp on a 4K screen (correction 15) */
const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  g.scale(TEX_SS, TEX_SS)
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** an official mark drawn into a texture, aspect kept (R8.5), contained in a w x h tile with padding */
function markTex(url: string, aspect: number, onLoad: () => void, pad = 0.14): THREE.CanvasTexture {
  const H0 = 512
  const W0 = Math.round(H0 * aspect)
  const c = document.createElement('canvas')
  c.width = W0
  c.height = H0
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const im = new Image()
  im.onload = () => {
    const iw = im.naturalWidth || 300
    const ih = im.naturalHeight || 150
    const k = Math.min((W0 * (1 - 2 * pad)) / iw, (H0 * (1 - 2 * pad)) / ih)
    const g = c.getContext('2d')!
    g.clearRect(0, 0, W0, H0)
    g.imageSmoothingQuality = 'high'
    g.drawImage(im, (W0 - iw * k) / 2, (H0 - ih * k) / 2, iw * k, ih * k)
    t.needsUpdate = true
    onLoad()
  }
  im.src = url
  return t
}
function markTile(url: string, w: number, h: number, redraw: () => void): THREE.Group {
  const g = new THREE.Group()
  g.add(box(w, h, 0.04, mat(C.white, { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.4 }), [0, 0, 0], Math.min(w, h) * 0.12))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: markTex(url, w / h, redraw), transparent: true, toneMapped: false }))
  face.position.z = 0.022
  g.add(face)
  return g
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
/** the texture width a person needs for its on-screen box height (device px); the rig box is 400 x 600 */
const spritePx = (boxPx: number) => Math.max(128, Math.min(1024, Math.ceil(((boxPx / 1.5) * 1.15) / 32) * 32))
/**
 * The engine's `castSprite` contract (rig loop pre-rendered into frame textures on a depth-tested, camera-facing plane)
 * with the two things this scene needs, as in Session 9's adaptive copy: `dress` (role clothing drawn in the rig's own
 * frames, so it moves with the body) and frames built at the size the person is drawn at on THIS screen (projected box
 * height x stage density), rebuilt when that changes a lot (fullscreen, a 4K projector), old frames freed.
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; density: () => number; redraw: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  const { density, redraw, ...rest } = o
  return castSprite({ ...rest, shadow: 0.2, adaptive: { density, stageH: H, floor: 128 }, onReady: redraw })
}

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping) */
function faceAt(c: number, keys: [number, string][]): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - L
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - L
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}
const who = (base: CharacterConfig, o: { name: string; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: CharacterConfig['accessories']; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone']; gender?: CharacterConfig['gender'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: o.accessories ?? base.accessories,
  build: { ...base.build, ...o.build },
})

/* ------------------------------------------------------------------ role clothing (rig: head-local / body frame 400 x 600) */

/** a peaked security cap, head-local (skull centre 0,0; crown about y -66), drawn over the hair */
const GUARD_CAP = (crown: string, band: string) => (
  <g data-part="guard-cap">
    <path d="M -64 -50 C -70 -104 70 -104 64 -50 Z" fill={crown} />
    <path d="M -50 -88 C -20 -100 20 -100 50 -88" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-65} y={-62} width={130} height={15} rx={4} fill={band} />
    <path d="M -10 -86 L 0 -94 L 10 -86 L 7 -74 L -7 -74 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -60 -48 Q 0 -26 60 -48 L 56 -54 Q 0 -38 -56 -54 Z" fill="#141B2E" />
  </g>
)
/** a guard's uniform details on the shirt: shoulder epaulettes, a chest badge, a whistle cord */
const GUARD_UNIFORM = (trim: string) => (
  <g data-part="uniform">
    <path d="M 140 212 L 178 206 L 180 218 L 142 224 Z" fill={trim} />
    <path d="M 260 212 L 222 206 L 220 218 L 258 224 Z" fill={trim} />
    <path d="M 226 246 L 231 236 L 236 246 L 247 247 L 239 254 L 241 265 L 231 259 L 221 265 L 223 254 L 215 247 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M 168 236 C 172 262 182 282 196 292" stroke="#E9EEF7" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    <rect x={190} y={288} width={14} height={8} rx={3} fill="#C9D3E6" />
    <rect x={150} y={250} width={30} height={22} rx={3} fill="none" stroke={trim} strokeWidth={2.5} />
  </g>
)
/** the data-centre officer's access badge on a lanyard (body frame) */
const BADGE = (
  <g data-part="badge">
    <path d="M 188 208 L 196 268 M 212 208 L 204 268" stroke={C.brand} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={186} y={266} width={28} height={36} rx={4} fill="#FFFFFF" stroke={C.brand} strokeWidth={2.5} />
    <rect x={192} y={273} width={16} height={12} rx={2} fill={C.brand} opacity={0.65} />
  </g>
)

/* ------------------------------------------------------------------ people */

const GUARD_E = who(CAST_PRESETS.rohan, {
  name: 'Society Guard',
  skinTone: 'dusky',
  hair: { style: 'short', color: 'black' },
  outfit: { top: 'shirt', topColor: '#43557F', bottom: 'trousers', bottomColor: '#26304D', shoeColor: '#1E1E24' },
  accessories: { beard: 'stubble', belt: true, watch: true },
  build: { height: 1.02, shoulders: 1.05 },
})
const RESIDENT = who(CAST_PRESETS.kabir, {
  name: 'Resident',
  skinTone: 'wheatish',
  hair: { style: 'curly', color: 'black' },
  outfit: { top: 'kurta', topColor: '#E9B949', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#5A3A2A' },
  accessories: { beard: 'short', watch: true },
})
const GUARD_C = who(CAST_PRESETS.ananya, {
  name: 'Data Centre Officer',
  gender: 'female',
  skinTone: 'medium',
  hair: { style: 'ponytail', color: 'black' },
  outfit: { top: 'shirt', topColor: '#1F2E63', bottom: 'trousers', bottomColor: '#1B2442', shoeColor: '#1E1E24' },
  accessories: { earrings: true, belt: true },
})
const CUSTOMER = who(CAST_PRESETS.dev, {
  name: 'Customer',
  skinTone: 'fair',
  hair: { style: 'sidePart', color: 'brown' },
  outfit: { top: 'polo', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#24324F', shoeColor: '#2A2A30' },
  accessories: { glasses: 'rect', watch: true },
})

/* ------------------------------------------------------------------ the shared ground plan */

const P = {
  wallZ: 0,
  gateL: -2.72, // left gate pillar centre
  gateR: -1.2, // right gate pillar centre
  lane: -1.96,
  postX: -0.9, // barrier post
  barZ: 0.32,
  guard: [-0.36, 0, 0.66] as THREE.Vector3Tuple,
  boothX: 0.5,
  bldX0: 0.55,
  bldX1: 3.55,
  bldZ0: -3.45,
  bldZ1: -0.9,
  plinth: 0.2,
  person: [2.58, 0, -2.25] as THREE.Vector3Tuple,
  lockL: [1.78, 0, -2.72] as THREE.Vector3Tuple, // the safe / the bucket
  doorX: 3.33, // inner face of the right wall: the flat door / the key vault door
  doorZ: -1.95,
}

/* the vehicle's run (one per loop): in from the front, wait at the barrier, through the gate, then a left turn along the
   inner road and out of the frame on the left (away from the raised barrier arm, so nothing crosses it on screen) */
const RUN = { inA: 0, inB: 1.3, outA: 3.75, outB: 5.85, z0: 5.6, zStop: 1.42, zTurn: -0.55, r: 0.8, xEnd: -6.2 }
const ROAD_Z = RUN.zTurn - RUN.r
/* the barrier and the guard */
const BAR = { upA: 3.15, upB: 3.75, downA: 5.95, downB: 6.55 }
/* the person's two locks and the next morning's reopening */
const LOCK = { closeA: 0.35, closeB: 1.05, spinA: 1.1, spinB: 2.3, turnA: 2.55, turnB: 2.95, latchA: 3.3, latchB: 3.75, boltA: 3.6, boltB: 4.1, reopenA: 5.95, reopenB: 6.95 }

function vehiclePose(c: number): { x: number; z: number; yaw: number; dist: number; visible: boolean } {
  const straight = RUN.zStop - RUN.zTurn
  const arcLen = (Math.PI / 2) * RUN.r
  const cx = P.lane - RUN.r
  const tail = cx - RUN.xEnd
  if (c < RUN.outA) {
    const k = c <= RUN.inB ? 1 - Math.pow(1 - clamp01(c / RUN.inB), 2.2) : 1
    const z = lerp(RUN.z0, RUN.zStop, k)
    return { x: P.lane, z, yaw: 0, dist: RUN.z0 - z, visible: true }
  }
  const u = clamp01((c - RUN.outA) / (RUN.outB - RUN.outA))
  const d = Math.pow(u, 1.5) * (straight + arcLen + tail)
  const base = RUN.z0 - RUN.zStop
  if (d < straight) return { x: P.lane, z: RUN.zStop - d, yaw: 0, dist: base + d, visible: true }
  if (d < straight + arcLen) {
    const a = (d - straight) / RUN.r
    return { x: cx + RUN.r * Math.cos(a), z: RUN.zTurn - RUN.r * Math.sin(a), yaw: a, dist: base + d, visible: true }
  }
  const e = d - straight - arcLen
  return { x: cx - e, z: ROAD_Z, yaw: Math.PI / 2, dist: base + d, visible: u < 1 }
}

/* ------------------------------------------------------------------ vehicles */

type Vehicle = { g: THREE.Group; wheels: THREE.Mesh[] }
function vehicle(kind: 'car' | 'van'): Vehicle {
  const g = new THREE.Group()
  const glass = new THREE.MeshStandardMaterial({ color: '#22324F', roughness: 0.12, metalness: 0.55, emissive: new THREE.Color('#0E1A33'), emissiveIntensity: 0.2 })
  const tyre = mat('#1C1F27', { roughness: 0.85 })
  const hub = mat('#C9D3E6', { roughness: 0.35, metalness: 0.6 })
  if (kind === 'car') {
    const paint = mat('#E2553A', { roughness: 0.32, metalness: 0.25 })
    g.add(box(0.96, 0.4, 1.94, paint, [0, 0.38, 0], 0.12))
    g.add(box(0.84, 0.36, 1.02, glass, [0, 0.74, 0.12], 0.1))
    g.add(box(0.86, 0.06, 0.92, paint, [0, 0.94, 0.14], 0.03))
    for (const s of [-1, 1]) g.add(box(0.05, 0.3, 0.92, paint, [s * 0.4, 0.74, 0.14], 0.02))
    for (const s of [-1, 1]) g.add(box(0.18, 0.08, 0.03, new THREE.MeshStandardMaterial({ color: '#FFF8E0', emissive: '#FFE7A8', emissiveIntensity: 0.9 }), [s * 0.3, 0.44, -0.975]))
    for (const s of [-1, 1]) g.add(box(0.18, 0.07, 0.03, new THREE.MeshStandardMaterial({ color: '#E5484D', emissive: '#E5484D', emissiveIntensity: 0.5 }), [s * 0.3, 0.46, 0.975]))
    g.add(box(0.5, 0.06, 0.03, mat('#2A2F3A'), [0, 0.26, -0.975]))
  } else {
    const paint = mat('#F4F7FC', { roughness: 0.35, metalness: 0.15 })
    g.add(box(1.0, 0.98, 2.15, paint, [0, 0.68, 0.05], 0.12))
    g.add(box(1.01, 0.12, 1.4, mat(C.brand, { roughness: 0.4 }), [0, 0.62, 0.38], 0.03))
    g.add(box(0.88, 0.34, 0.06, glass, [0, 0.92, -1.02], 0.03))
    for (const s of [-1, 1]) g.add(box(0.04, 0.3, 0.52, glass, [s * 0.5, 0.92, -0.66], 0.02))
    for (const s of [-1, 1]) g.add(box(0.18, 0.08, 0.03, new THREE.MeshStandardMaterial({ color: '#FFF8E0', emissive: '#FFE7A8', emissiveIntensity: 0.9 }), [s * 0.32, 0.4, -1.04]))
    for (const s of [-1, 1]) g.add(box(0.16, 0.08, 0.03, new THREE.MeshStandardMaterial({ color: '#E5484D', emissive: '#E5484D', emissiveIntensity: 0.5 }), [s * 0.36, 0.42, 1.13]))
  }
  const wheels: THREE.Mesh[] = []
  const wz = kind === 'car' ? 0.64 : 0.7
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const w = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.13, 24), tyre, [sx * 0.47, 0.18, sz * wz])
      w.rotation.z = Math.PI / 2
      w.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 16), hub, [0, 0, 0]))
      /* a spoke so the turning reads */
      w.add(mesh(new THREE.BoxGeometry(0.03, 0.15, 0.1), hub, [0, 0, 0]))
      g.add(w)
      wheels.push(w)
    }
  return { g, wheels }
}

/* ------------------------------------------------------------------ the boom barrier (shared) */

function barrier(scene: THREE.Scene, postMat: THREE.Material): THREE.Group {
  scene.add(box(0.2, 0.92, 0.2, postMat, [P.postX, 0.46, P.barZ], 0.03))
  scene.add(box(0.1, 0.62, 0.1, postMat, [P.gateL + 0.22, 0.31, P.barZ], 0.02))
  scene.add(box(0.18, 0.05, 0.12, postMat, [P.gateL + 0.22, 0.62, P.barZ], 0.02))
  const pivot = new THREE.Group()
  pivot.position.set(P.postX, 0.84, P.barZ)
  const len = P.postX - (P.gateL + 0.14)
  const stripes = canvasTex(256, 16, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#FFFFFF' : C.red
      g.fillRect(i * 32, 0, 32, 16)
    }
  })
  const arm = box(len, 0.075, 0.075, new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.45 }), [-len / 2 - 0.06, 0, 0], 0.03)
  pivot.add(arm)
  pivot.add(box(0.22, 0.16, 0.16, mat('#2A3550', { roughness: 0.5 }), [0.04, 0, 0], 0.03))
  scene.add(pivot)
  return pivot
}

/* ------------------------------------------------------------------ cameras and lights */

function frame(kit: StageKit) {
  const { camera, scene } = kit
  camera.fov = 32.5
  camera.position.set(0.12, 6.3, 9.4)
  camera.lookAt(0.26, 1.0, -1.35)
  lightRig(scene, [0, 0, -1])
}

/* ================================================================== EVERYDAY · the gated housing society */

function setupEveryday(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame(kit)
  scene.background = null

  /* ground: paving outside and inside, an asphalt lane through the gate */
  const ground = mesh(new THREE.PlaneGeometry(18, 16), mat('#E8DDC9', { roughness: 0.95 }), [0, 0, -1])
  ground.rotation.x = -Math.PI / 2
  ground.castShadow = false
  scene.add(ground)
  const lane = mesh(new THREE.PlaneGeometry(1.25, 5.8 - RUN.zTurn), mat('#8E939E', { roughness: 0.9 }), [P.lane, 0.006, (5.8 + RUN.zTurn) / 2])
  lane.rotation.x = -Math.PI / 2
  lane.castShadow = false
  scene.add(lane)
  const laneBack = mesh(new THREE.PlaneGeometry(5.0, 1.25), mat('#8E939E', { roughness: 0.9 }), [P.lane + 0.6 - 2.5, 0.006, ROAD_Z])
  laneBack.rotation.x = -Math.PI / 2
  laneBack.castShadow = false
  scene.add(laneBack)
  /* a strip of lawn along the inside of the wall */
  const lawn = mesh(new THREE.PlaneGeometry(2.4, 1.6), mat('#9CCB7C', { roughness: 0.95 }), [-3.6, 0.008, -4.15])
  lawn.rotation.x = -Math.PI / 2
  lawn.castShadow = false
  scene.add(lawn)

  /* the compound wall: cream plaster, terracotta coping, pillars with lamps at the gate */
  const plaster = mat('#F3E6CF', { roughness: 0.85 })
  const coping = mat('#C8693E', { roughness: 0.6 })
  const wallH = 0.95
  const wallSeg = (x0: number, x1: number) => {
    scene.add(box(x1 - x0, wallH, 0.2, plaster, [(x0 + x1) / 2, wallH / 2, P.wallZ]))
    scene.add(box(x1 - x0 + 0.04, 0.07, 0.26, coping, [(x0 + x1) / 2, wallH + 0.035, P.wallZ]))
  }
  wallSeg(-5.2, P.gateL - 0.17)
  wallSeg(P.gateR + 0.17, P.bldX0)
  /* the back compound wall */
  scene.add(box(10.4, wallH, 0.2, plaster, [-0.2, wallH / 2, -5.3]))
  scene.add(box(10.44, 0.07, 0.26, coping, [-0.2, wallH + 0.035, -5.3]))
  /* the side wall running back on the left, so the compound reads as enclosed */
  for (const [z0, z1] of [[-0.1, ROAD_Z + 0.75], [ROAD_Z - 0.75, -5.3]]) {
    scene.add(box(0.2, wallH, z0 - z1, plaster, [-4.85, wallH / 2, (z0 + z1) / 2]))
    scene.add(box(0.26, 0.07, z0 - z1 + 0.04, coping, [-4.85, wallH + 0.035, (z0 + z1) / 2]))
  }
  const lampGlow: THREE.MeshStandardMaterial[] = []
  for (const x of [P.gateL, P.gateR]) {
    scene.add(box(0.34, 1.32, 0.34, plaster, [x, 0.66, P.wallZ], 0.03))
    scene.add(box(0.42, 0.08, 0.42, coping, [x, 1.36, P.wallZ], 0.02))
    const gm = new THREE.MeshStandardMaterial({ color: '#FFF4D6', emissive: '#FFD27A', emissiveIntensity: 0.6, roughness: 0.3 })
    lampGlow.push(gm)
    scene.add(mesh(new THREE.SphereGeometry(0.11, 20, 16), gm, [x, 1.52, P.wallZ]))
  }
  /* the society's next apartment block behind the back wall, so the place reads as a housing society */
  {
    const g = new THREE.Group()
    const wallM = mat('#F2CFA8', { roughness: 0.85 })
    g.add(box(4.6, 4.6, 1.6, wallM, [0, 2.3, 0]))
    g.add(box(4.7, 0.16, 1.7, mat('#C8693E'), [0, 4.66, 0]))
    const glass = new THREE.MeshStandardMaterial({ color: '#CFE4FA', roughness: 0.1, metalness: 0.2, emissive: new THREE.Color('#DCEBFF'), emissiveIntensity: 0.3 })
    for (let f = 0; f < 3; f++)
      for (let i = 0; i < 4; i++) {
        const x = -1.65 + i * 1.1
        const y = 0.95 + f * 1.3
        g.add(box(0.62, 0.62, 0.03, glass, [x, y, 0.81]))
        g.add(box(0.8, 0.06, 0.14, mat('#C8693E'), [x, y - 0.38, 0.84]))
      }
    g.position.set(-2.6, 0, -7.0)
    scene.add(g)
  }
  /* two trees behind the wall on the left (the compound's garden) */
  for (const [x, z, s] of [[-4.05, -4.2, 1], [-3.0, -4.45, 0.85]] as const) {
    scene.add(cyl(0.07, 0.09, 1.0 * s, mat('#8B5E34'), [x, 0.5 * s, z], 12))
    scene.add(mesh(new THREE.SphereGeometry(0.55 * s, 24, 18), mat('#5FAE5C', { roughness: 0.9 }), [x, 1.25 * s, z]))
    scene.add(mesh(new THREE.SphereGeometry(0.38 * s, 20, 16), mat('#77C26E', { roughness: 0.9 }), [x + 0.25 * s, 1.55 * s, z + 0.1]))
  }

  /* the guard booth to the right of the guard: a small cabin with a window and a tiled roof */
  const booth = new THREE.Group()
  booth.add(box(0.6, 1.95, 0.72, plaster, [0, 0.975, 0], 0.03))
  booth.add(box(0.42, 0.5, 0.02, new THREE.MeshStandardMaterial({ color: '#BFD7F2', roughness: 0.15, metalness: 0.3 }), [0, 1.35, 0.37]))
  booth.add(box(0.76, 0.1, 0.9, coping, [0, 2.0, 0.02], 0.03))
  booth.add(box(0.3, 0.86, 0.02, mat('#8B5E34'), [-0.06, 0.45, 0.37]))
  booth.position.set(P.boothX, 0, 0.62)
  scene.add(booth)

  /* the barrier */
  const bar = barrier(scene, mat('#3A4566', { roughness: 0.5 }))

  /* the apartment block: a cut-away ground-floor flat with a closed upper floor above it */
  const bw = P.bldX1 - P.bldX0
  const bd = P.bldZ1 - P.bldZ0
  const cx = (P.bldX0 + P.bldX1) / 2
  const cz = (P.bldZ0 + P.bldZ1) / 2
  const outer = mat('#F6D9B8', { roughness: 0.85 })
  const inner = mat('#FBF3E4', { roughness: 0.9 })
  scene.add(box(bw, P.plinth, bd, mat('#D9C7A8'), [cx, P.plinth / 2, cz]))
  const floor = mesh(new THREE.PlaneGeometry(bw - 0.4, bd - 0.2), mat('#D8A873', { roughness: 0.7 }), [cx, P.plinth + 0.005, cz + 0.05])
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false
  scene.add(floor)
  const roomH = 2.35
  /* back wall with a window, left and right walls */
  scene.add(box(bw, roomH, 0.2, inner, [cx, P.plinth + roomH / 2, P.bldZ0 + 0.1]))
  scene.add(box(0.2, roomH, bd, inner, [P.bldX0 + 0.1, P.plinth + roomH / 2, cz]))
  scene.add(box(0.2, roomH, bd, inner, [P.bldX1 - 0.1, P.plinth + roomH / 2, cz]))
  const win = new THREE.MeshStandardMaterial({ color: '#CFE4FA', roughness: 0.1, metalness: 0.2, emissive: new THREE.Color('#DCEBFF'), emissiveIntensity: 0.35 })
  scene.add(box(0.8, 0.8, 0.03, win, [1.15, P.plinth + 1.45, P.bldZ0 + 0.215]))
  scene.add(box(0.9, 0.06, 0.08, mat('#B07A4A'), [1.15, P.plinth + 1.02, P.bldZ0 + 0.24]))
  /* a low sill along the cut-away front, and the slab and upper floor above */
  scene.add(box(bw, 0.18, 0.2, outer, [cx, P.plinth + 0.09, P.bldZ1 - 0.1]))
  scene.add(box(bw + 0.1, 0.22, bd + 0.1, mat('#E9C9A4'), [cx, P.plinth + roomH + 0.11, cz]))
  const up = 1.6
  scene.add(box(bw, up, bd, outer, [cx, P.plinth + roomH + 0.22 + up / 2, cz]))
  for (const x of [1.25, 2.85]) {
    scene.add(box(0.7, 0.75, 0.03, win, [x, P.plinth + roomH + 0.95, P.bldZ1 + 0.02]))
    scene.add(box(0.95, 0.06, 0.16, mat('#C8693E'), [x, P.plinth + roomH + 0.55, P.bldZ1 + 0.08]))
  }
  /* a soft rug under the resident */
  const rug = mesh(new THREE.CircleGeometry(0.62, 40), mat('#7FA6FF', { roughness: 0.95 }), [P.person[0], P.plinth + 0.01, P.person[2] + 0.05])
  rug.rotation.x = -Math.PI / 2
  rug.scale.set(1.25, 0.8, 1)
  rug.castShadow = false
  scene.add(rug)

  /* the safe on a low stand, its door hinged at its left edge; gold bars inside */
  const [sx, , sz] = P.lockL
  scene.add(box(0.66, 0.42, 0.56, mat('#8B5E34', { roughness: 0.6 }), [sx, P.plinth + 0.21, sz], 0.03))
  const safeBody = mat('#4A556E', { roughness: 0.35, metalness: 0.55 })
  const sy = P.plinth + 0.42
  const safe = new THREE.Group()
  safe.position.set(sx, sy, sz)
  safe.add(box(0.6, 0.62, 0.52, safeBody, [0, 0.31, 0], 0.04))
  safe.add(box(0.5, 0.52, 0.02, mat('#1E2433', { roughness: 0.8 }), [0, 0.31, 0.255]))
  for (let i = 0; i < 3; i++) safe.add(box(0.16, 0.07, 0.12, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [-0.12 + i * 0.11, 0.1 + (i === 1 ? 0.07 : 0), 0.05], 0.01))
  scene.add(safe)
  const hinge = new THREE.Group()
  hinge.position.set(sx - 0.3, sy + 0.31, sz + 0.27)
  const door = new THREE.Group()
  door.position.set(0.3, 0, 0)
  door.add(box(0.58, 0.6, 0.05, mat('#56627D', { roughness: 0.3, metalness: 0.6 }), [0, 0, 0.02], 0.03))
  const dial = new THREE.Group()
  dial.position.set(0.06, 0.06, 0.06)
  dial.rotation.x = Math.PI / 2
  dial.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.035, 32), mat('#C9D3E6', { roughness: 0.25, metalness: 0.8 }), [0, 0, 0]))
  dial.add(mesh(new THREE.BoxGeometry(0.02, 0.04, 0.07), mat('#1E2433'), [0, 0.02, 0.05]))
  door.add(dial)
  door.add(box(0.03, 0.14, 0.04, mat('#C9D3E6', { metalness: 0.8, roughness: 0.25 }), [0.2, -0.08, 0.06], 0.01))
  const lockLed = new THREE.MeshStandardMaterial({ color: '#B8F0CF', emissive: C.green, emissiveIntensity: 0.9 })
  door.add(box(0.04, 0.04, 0.02, lockLed, [0.2, 0.2, 0.05], 0.01))
  hinge.add(door)
  scene.add(hinge)

  /* the flat door in the right wall, seen from inside: frame, door leaf, a latch knob and a sliding deadbolt */
  const doorG = new THREE.Group()
  doorG.position.set(P.doorX, P.plinth, P.doorZ)
  doorG.add(box(0.05, 2.05, 1.0, mat('#B07A4A', { roughness: 0.6 }), [0, 1.025, 0]))
  doorG.add(box(0.04, 1.92, 0.86, mat('#8B5E34', { roughness: 0.55 }), [-0.03, 0.98, 0]))
  for (const y of [0.55, 1.4]) doorG.add(box(0.02, 0.5, 0.6, mat('#7A4F2A', { roughness: 0.6 }), [-0.06, y, 0]))
  const plate = box(0.02, 0.2, 0.12, mat('#D9B65C', { roughness: 0.3, metalness: 0.8 }), [-0.07, 1.05, 0.3], 0.01)
  doorG.add(plate)
  const knob = new THREE.Group()
  knob.position.set(-0.09, 1.05, 0.3)
  knob.add(box(0.03, 0.1, 0.035, mat('#F2D27A', { roughness: 0.25, metalness: 0.85 }), [0, 0, 0], 0.01))
  doorG.add(knob)
  /* the deadbolt slides from the door edge into the frame */
  const bolt = box(0.03, 0.05, 0.16, mat('#F2D27A', { roughness: 0.25, metalness: 0.85 }), [-0.07, 1.25, 0.36], 0.01)
  doorG.add(bolt)
  doorG.add(box(0.03, 0.09, 0.08, mat('#C9A34E', { roughness: 0.3, metalness: 0.8 }), [-0.07, 1.25, 0.5], 0.01))
  scene.add(doorG)

  /* the car */
  const car = vehicle('car')
  scene.add(car.g)

  /* people */
  const guard = rigSprite({
    config: GUARD_E,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{GUARD_CAP('#2A3550', '#141B2E')}</>, top: <>{k.top}{GUARD_UNIFORM('#141B2E')}</> }),
    loop: L,
    frames: 72,
    height: 1.74,
    density,
    redraw,
    timeline: (c) => ({ seed: 41, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [1.15, 'skeptical'], [2.55, 'happy'], [3.8, 'proud'], [6.3, 'neutral']]) }),
    pose: (p, c) => guardPose(p, c),
  })
  guard.object.position.set(...P.guard)
  scene.add(guard.object)
  const resident = rigSprite({
    config: RESIDENT,
    loop: L,
    frames: 72,
    height: 1.72,
    density,
    redraw,
    timeline: (c) => ({ seed: 17, idle: CAST_IDLE, ...faceAt(c, [[0, 'happy'], [0.3, 'thinking'], [2.45, 'listening'], [4.1, 'proud'], [5.9, 'happy']]) }),
    pose: (p, c) => personPose(p, c),
  })
  resident.object.position.set(P.person[0], P.plinth, P.person[2])
  scene.add(resident.object)

  return (t) => {
    const c = mod(t, L)
    vehicleUpdate(car, c)
    barUpdate(bar, c)
    /* the safe: closes, then the dial spins and the lamp turns from green to red (locked); reopened at the end */
    const shut = seg(c, LOCK.closeA, LOCK.closeB) * (1 - seg(c, LOCK.reopenA + 0.4, LOCK.reopenB))
    hinge.rotation.y = lerp(-1.75, 0, shut)
    const spin = seg(c, LOCK.spinA, LOCK.spinB) - seg(c, LOCK.reopenA, LOCK.reopenA + 0.4)
    dial.rotation.y = spin * Math.PI * 3.5
    const locked = spin > 0.95 ? 1 : 0
    lockLed.color.set(locked ? '#FFC9B0' : '#B8F0CF')
    lockLed.emissive.set(locked ? C.orange : C.green)
    /* the flat door: the latch knob turns a quarter, the bolt slides out; both back at the end */
    const turn = seg(c, LOCK.latchA, LOCK.latchB) * (1 - seg(c, LOCK.reopenA - 0.1, LOCK.reopenA + 0.3))
    knob.rotation.x = turn * (Math.PI / 2)
    const slide = seg(c, LOCK.boltA, LOCK.boltB) * (1 - seg(c, LOCK.reopenA - 0.1, LOCK.reopenA + 0.3))
    bolt.position.z = lerp(0.3, 0.46, slide)
    /* the gate lamps breathe softly (dusk) */
    lampGlow.forEach((m, i) => (m.emissiveIntensity = 0.55 + 0.15 * Math.sin((c / L) * Math.PI * 4 + i)))
    resident.object.position.x = P.person[0] + stepX(c)
    guard.update(c, camera)
    resident.update(c, camera)
  }
}

/* ================================================================== CONCEPT · the cloud data centre */

function setupConcept(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame(kit)

  const ground = mesh(new THREE.PlaneGeometry(18, 16), mat('#E3E9F3', { roughness: 0.95 }), [0, 0, -1])
  ground.rotation.x = -Math.PI / 2
  ground.castShadow = false
  scene.add(ground)
  const lane = mesh(new THREE.PlaneGeometry(1.25, 5.8 - RUN.zTurn), mat('#7D8596', { roughness: 0.9 }), [P.lane, 0.006, (5.8 + RUN.zTurn) / 2])
  lane.rotation.x = -Math.PI / 2
  lane.castShadow = false
  scene.add(lane)
  const laneBack = mesh(new THREE.PlaneGeometry(5.0, 1.25), mat('#7D8596', { roughness: 0.9 }), [P.lane + 0.6 - 2.5, 0.006, ROAD_Z])
  laneBack.rotation.x = -Math.PI / 2
  laneBack.castShadow = false
  scene.add(laneBack)
  /* a gravel strip inside the fence (where the everyday card has lawn) */
  const strip = mesh(new THREE.PlaneGeometry(2.4, 1.6), mat('#CBD3E0', { roughness: 0.95 }), [-3.6, 0.008, -4.15])
  strip.rotation.x = -Math.PI / 2
  strip.castShadow = false
  scene.add(strip)

  /* the perimeter fence: a concrete plinth with steel palisade bars and a top rail; gate posts with lamps */
  const concrete = mat('#D5DCE8', { roughness: 0.85 })
  const steel = mat('#3E4C6E', { roughness: 0.35, metalness: 0.6 })
  const fenceH = 1.05
  const fence = (x0: number, x1: number, z: number, along: 'x' | 'z') => {
    const len = Math.abs(x1 - x0)
    const mid = (x0 + x1) / 2
    if (along === 'x') {
      scene.add(box(len, 0.2, 0.22, concrete, [mid, 0.1, z]))
      scene.add(box(len, 0.05, 0.06, steel, [mid, fenceH, z]))
      scene.add(box(len, 0.04, 0.05, steel, [mid, 0.55, z]))
      for (let x = Math.min(x0, x1) + 0.06; x < Math.max(x0, x1); x += 0.14) scene.add(box(0.035, fenceH - 0.2, 0.035, steel, [x, 0.2 + (fenceH - 0.2) / 2, z]))
    } else {
      scene.add(box(0.22, 0.2, len, concrete, [z, 0.1, mid]))
      scene.add(box(0.06, 0.05, len, steel, [z, fenceH, mid]))
      for (let s = Math.min(x0, x1) + 0.06; s < Math.max(x0, x1); s += 0.14) scene.add(box(0.035, fenceH - 0.2, 0.035, steel, [z, 0.2 + (fenceH - 0.2) / 2, s]))
    }
  }
  fence(-5.2, P.gateL - 0.17, P.wallZ, 'x')
  fence(P.gateR + 0.17, P.bldX0, P.wallZ, 'x')
  fence(-5.3, ROAD_Z - 0.75, -4.85, 'z')
  fence(ROAD_Z + 0.75, -0.1, -4.85, 'z')
  fence(-4.85, 5.2, -5.3, 'x')
  const lampGlow: THREE.MeshStandardMaterial[] = []
  for (const x of [P.gateL, P.gateR]) {
    scene.add(box(0.3, 1.32, 0.3, concrete, [x, 0.66, P.wallZ], 0.03))
    scene.add(box(0.36, 0.06, 0.36, steel, [x, 1.35, P.wallZ], 0.02))
    const gm = new THREE.MeshStandardMaterial({ color: '#E6F0FF', emissive: '#7FB0FF', emissiveIntensity: 0.6, roughness: 0.3 })
    lampGlow.push(gm)
    scene.add(box(0.2, 0.08, 0.2, gm, [x, 1.42, P.wallZ], 0.03))
  }
  /* the provider's mark on the right gate pillar (a logo never moves) */
  const tile = markTile(awsUrl, 0.42, 0.26, redraw)
  tile.position.set(P.gateL, 1.1, P.wallZ + 0.17)
  scene.add(tile)
  /* the provider's next data hall behind the back fence (where the everyday card has the next apartment block) */
  {
    const g = new THREE.Group()
    g.add(box(4.6, 3.6, 1.6, mat('#D5DCE8', { roughness: 0.75 }), [0, 1.8, 0]))
    g.add(box(4.7, 0.14, 1.7, mat('#AEBBD3'), [0, 3.67, 0]))
    for (let i = 0; i < 7; i++) g.add(box(4.0, 0.06, 0.05, mat('#AEBBD3', { roughness: 0.4, metalness: 0.3 }), [0, 1.6 + i * 0.26, 0.82]))
    g.add(box(0.9, 1.4, 0.04, mat('#7C8BAA', { roughness: 0.35, metalness: 0.5 }), [1.5, 0.7, 0.81]))
    g.position.set(-2.6, 0, -7.0)
    scene.add(g)
  }
  /* two cooling units behind the fence on the left (where the everyday card has its garden trees) */
  const fanMats: THREE.Group[] = []
  for (const [x, z] of [[-4.05, -4.2], [-3.0, -4.45]] as const) {
    scene.add(box(0.9, 0.62, 0.8, mat('#C9D3E6', { roughness: 0.5, metalness: 0.3 }), [x, 0.31, z], 0.04))
    const fan = new THREE.Group()
    fan.position.set(x, 0.63, z)
    for (let i = 0; i < 3; i++) {
      const blade = box(0.5, 0.012, 0.09, mat('#5B6A8C', { metalness: 0.4, roughness: 0.4 }), [0, 0, 0], 0.005)
      blade.rotation.y = (i * Math.PI) / 3
      fan.add(blade)
    }
    fan.add(cyl(0.29, 0.29, 0.01, mat('#3E4C6E', { roughness: 0.6 }), [0, -0.004, 0]))
    fanMats.push(fan)
    scene.add(fan)
  }

  /* the security booth: a glass kiosk with a badge reader */
  const booth = new THREE.Group()
  booth.add(box(0.6, 0.2, 0.72, concrete, [0, 0.1, 0]))
  booth.add(box(0.56, 1.6, 0.68, new THREE.MeshStandardMaterial({ color: '#CFE3FF', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.55 }), [0, 1.0, 0]))
  for (const x of [-0.28, 0.28]) for (const z of [-0.34, 0.34]) booth.add(box(0.05, 1.7, 0.05, steel, [x, 0.95, z]))
  booth.add(box(0.74, 0.1, 0.88, mat(C.navy, { roughness: 0.5 }), [0, 1.85, 0.02], 0.03))
  booth.add(box(0.1, 0.16, 0.04, mat('#22324F'), [-0.18, 1.1, 0.36], 0.01))
  const readerLed = new THREE.MeshStandardMaterial({ color: '#BFD3FF', emissive: C.brand, emissiveIntensity: 0.8 })
  booth.add(box(0.05, 0.03, 0.02, readerLed, [-0.18, 1.15, 0.385]))
  booth.position.set(P.boothX, 0, 0.62)
  scene.add(booth)

  const bar = barrier(scene, mat('#3A4566', { roughness: 0.5 }))

  /* the data hall, cut away; the customer's account space marked out inside it */
  const bw = P.bldX1 - P.bldX0
  const bd = P.bldZ1 - P.bldZ0
  const cx = (P.bldX0 + P.bldX1) / 2
  const cz = (P.bldZ0 + P.bldZ1) / 2
  const outer = mat('#DDE5F2', { roughness: 0.75 })
  const inner = mat('#F3F6FB', { roughness: 0.85 })
  scene.add(box(bw, P.plinth, bd, mat('#C9D3E6'), [cx, P.plinth / 2, cz]))
  const floor = mesh(new THREE.PlaneGeometry(bw - 0.4, bd - 0.2), mat('#E9EEF6', { roughness: 0.6 }), [cx, P.plinth + 0.005, cz + 0.05])
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false
  scene.add(floor)
  const roomH = 2.35
  scene.add(box(bw, roomH, 0.2, inner, [cx, P.plinth + roomH / 2, P.bldZ0 + 0.1]))
  scene.add(box(0.2, roomH, bd, inner, [P.bldX0 + 0.1, P.plinth + roomH / 2, cz]))
  scene.add(box(0.2, roomH, bd, inner, [P.bldX1 - 0.1, P.plinth + roomH / 2, cz]))
  scene.add(box(bw, 0.18, 0.2, outer, [cx, P.plinth + 0.09, P.bldZ1 - 0.1]))
  scene.add(box(bw + 0.1, 0.22, bd + 0.1, mat('#C9D3E6'), [cx, P.plinth + roomH + 0.11, cz]))
  const up = 1.6
  scene.add(box(bw, up, bd, outer, [cx, P.plinth + roomH + 0.22 + up / 2, cz]))
  for (let i = 0; i < 5; i++) scene.add(box(bw - 0.5, 0.05, 0.05, mat('#AEBBD3', { roughness: 0.4, metalness: 0.3 }), [cx, P.plinth + roomH + 0.6 + i * 0.18, P.bldZ1 + 0.03]))
  /* the provider's server rack against the back wall, where the everyday flat has its window */
  const leds: THREE.MeshStandardMaterial[] = []
  const rack = new THREE.Group()
  rack.add(box(0.72, 1.9, 0.5, mat(C.navy, { roughness: 0.45, metalness: 0.35 }), [0, 0.95, 0], 0.03))
  for (let i = 0; i < 8; i++) {
    rack.add(box(0.6, 0.15, 0.02, mat('#2B3D7A', { roughness: 0.4 }), [0, 0.3 + i * 0.2, 0.26]))
    const lm = new THREE.MeshStandardMaterial({ color: '#9CC2FF', emissive: '#4C8DFF', emissiveIntensity: 1 })
    leds.push(lm)
    rack.add(box(0.05, 0.03, 0.02, lm, [0.22, 0.3 + i * 0.2, 0.275]))
  }
  rack.position.set(1.12, P.plinth, P.bldZ0 + 0.48)
  scene.add(rack)
  /* the account space: a glowing outline on the floor and a low glass partition on its left side */
  const ax0 = 1.42
  const ax1 = P.bldX1 - 0.22
  const az0 = P.bldZ0 + 0.24
  const az1 = P.bldZ1 - 0.28
  const glowEdge = new THREE.MeshStandardMaterial({ color: '#BFD3FF', emissive: C.brand, emissiveIntensity: 0.7, roughness: 0.4 })
  scene.add(box(ax1 - ax0, 0.02, 0.05, glowEdge, [(ax0 + ax1) / 2, P.plinth + 0.012, az1]))
  scene.add(box(0.05, 0.02, az1 - az0, glowEdge, [ax0, P.plinth + 0.012, (az0 + az1) / 2]))
  const zone = mesh(new THREE.PlaneGeometry(ax1 - ax0, az1 - az0), new THREE.MeshStandardMaterial({ color: '#DCE6FF', roughness: 0.8, transparent: true, opacity: 0.85 }), [(ax0 + ax1) / 2, P.plinth + 0.008, (az0 + az1) / 2])
  zone.rotation.x = -Math.PI / 2
  zone.castShadow = false
  scene.add(zone)
  scene.add(box(0.03, 0.9, az1 - az0, new THREE.MeshStandardMaterial({ color: '#CFE3FF', roughness: 0.08, transparent: true, opacity: 0.35 }), [ax0, P.plinth + 0.45, (az0 + az1) / 2]))
  scene.add(box(0.05, 0.04, az1 - az0, glowEdge, [ax0, P.plinth + 0.9, (az0 + az1) / 2]))

  /* the storage bucket on a stand (where the safe is): data blocks inside, a hinged lid and a padlock */
  const [sx, , sz] = P.lockL
  scene.add(box(0.66, 0.42, 0.56, mat('#AEBBD3', { roughness: 0.5, metalness: 0.3 }), [sx, P.plinth + 0.21, sz], 0.03))
  const by = P.plinth + 0.42
  const bucketMat = mat(C.brand, { roughness: 0.35, metalness: 0.2 })
  const bucket = new THREE.Group()
  bucket.position.set(sx, by, sz)
  const shell = mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.56, 40, 1, true), bucketMat, [0, 0.28, 0])
  ;(shell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
  bucket.add(shell)
  bucket.add(cyl(0.22, 0.22, 0.02, bucketMat, [0, 0.01, 0]))
  bucket.add(mesh(new THREE.TorusGeometry(0.3, 0.018, 10, 40), mat('#DCE6FF', { roughness: 0.3 }), [0, 0.56, 0]).rotateX(Math.PI / 2))
  bucket.add(mesh(new THREE.TorusGeometry(0.262, 0.012, 10, 40), mat('#DCE6FF', { roughness: 0.3 }), [0, 0.3, 0]).rotateX(Math.PI / 2))
  const blocks: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const bm = box(0.12, 0.12, 0.12, new THREE.MeshStandardMaterial({ color: '#FFE3A8', emissive: C.gold, emissiveIntensity: 0.45, roughness: 0.3 }), [-0.1 + i * 0.1, 0.48 + (i === 1 ? 0.06 : 0), i === 1 ? -0.04 : 0.03], 0.02)
    blocks.push(bm)
    bucket.add(bm)
  }
  scene.add(bucket)
  const lidHinge = new THREE.Group()
  lidHinge.position.set(sx, by + 0.57, sz - 0.3)
  const lid = new THREE.Group()
  lid.position.set(0, 0, 0.3)
  lid.add(cyl(0.32, 0.32, 0.05, mat(C.brandDark, { roughness: 0.35, metalness: 0.25 }), [0, 0.02, 0]))
  lid.add(box(0.12, 0.05, 0.05, mat('#DCE6FF', { roughness: 0.3 }), [0, 0.07, 0], 0.02))
  lidHinge.add(lid)
  scene.add(lidHinge)
  /* the padlock hangs on the front; its shackle drops shut */
  const padlock = new THREE.Group()
  padlock.position.set(sx, by + 0.42, sz + 0.31)
  padlock.add(box(0.13, 0.11, 0.05, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, 0, 0], 0.02))
  const shackle = mesh(new THREE.TorusGeometry(0.045, 0.012, 10, 24, Math.PI), mat('#C9D3E6', { roughness: 0.25, metalness: 0.85 }), [0, 0.06, 0])
  padlock.add(shackle)
  const padLed = new THREE.MeshStandardMaterial({ color: '#B8F0CF', emissive: C.green, emissiveIntensity: 0.9 })
  padlock.add(box(0.03, 0.03, 0.01, padLed, [0, -0.02, 0.03]))
  scene.add(padlock)

  /* the key vault door in the right wall (where the flat door is): a round steel door, a key emblem, a wheel, bolts */
  const vault = new THREE.Group()
  vault.position.set(P.doorX, P.plinth, P.doorZ)
  vault.add(box(0.05, 1.5, 1.05, mat('#AEBBD3', { roughness: 0.35, metalness: 0.5 }), [0, 1.0, 0], 0.03))
  const vdoor = mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 48), mat('#7C8BAA', { roughness: 0.3, metalness: 0.75 }), [-0.06, 1.0, 0])
  vdoor.rotation.z = Math.PI / 2
  vault.add(vdoor)
  vault.add(mesh(new THREE.TorusGeometry(0.4, 0.02, 10, 48), mat('#C9D3E6', { roughness: 0.25, metalness: 0.85 }), [-0.105, 1.0, 0]).rotateY(Math.PI / 2))
  /* the key emblem: a gold key laid on the door */
  const key = new THREE.Group()
  key.position.set(-0.11, 1.2, 0)
  key.add(mesh(new THREE.TorusGeometry(0.055, 0.018, 10, 24), mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, 0, -0.08]).rotateY(Math.PI / 2))
  key.add(box(0.025, 0.03, 0.16, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, 0, 0.03]))
  key.add(box(0.025, 0.05, 0.025, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, -0.035, 0.09]))
  vault.add(key)
  const wheel = new THREE.Group()
  wheel.position.set(-0.13, 0.92, 0)
  wheel.add(mesh(new THREE.TorusGeometry(0.14, 0.016, 10, 32), mat('#E6ECF6', { roughness: 0.25, metalness: 0.85 }), [0, 0, 0]).rotateY(Math.PI / 2))
  for (let i = 0; i < 3; i++) {
    const spoke = box(0.016, 0.28, 0.016, mat('#E6ECF6', { roughness: 0.25, metalness: 0.85 }), [0, 0, 0])
    spoke.rotation.x = (i * Math.PI) / 3
    wheel.add(spoke)
  }
  vault.add(wheel)
  const bolts: THREE.Mesh[] = []
  for (const y of [0.75, 1.0, 1.25]) {
    const b = box(0.04, 0.05, 0.16, mat('#E6ECF6', { roughness: 0.25, metalness: 0.85 }), [-0.07, y, 0.38], 0.01)
    bolts.push(b)
    vault.add(b)
  }
  const vaultLed = new THREE.MeshStandardMaterial({ color: '#B8F0CF', emissive: C.green, emissiveIntensity: 0.9 })
  vault.add(box(0.03, 0.05, 0.05, vaultLed, [-0.06, 1.62, 0.36], 0.01))
  scene.add(vault)

  const van = vehicle('van')
  scene.add(van.g)

  const officer = rigSprite({
    config: GUARD_C,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{GUARD_CAP('#1B2442', C.brand)}</>, top: <>{k.top}{GUARD_UNIFORM(C.brand)}{BADGE}</> }),
    loop: L,
    frames: 72,
    height: 1.68,
    density,
    redraw,
    timeline: (c) => ({ seed: 53, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [1.15, 'skeptical'], [2.55, 'happy'], [3.8, 'proud'], [6.3, 'neutral']]) }),
    pose: (p, c) => guardPose(p, c),
  })
  officer.object.position.set(...P.guard)
  scene.add(officer.object)
  const customer = rigSprite({
    config: CUSTOMER,
    loop: L,
    frames: 72,
    height: 1.74,
    density,
    redraw,
    timeline: (c) => ({ seed: 29, idle: CAST_IDLE, ...faceAt(c, [[0, 'happy'], [0.3, 'thinking'], [2.45, 'listening'], [4.1, 'proud'], [5.9, 'happy']]) }),
    pose: (p, c) => personPose(p, c),
  })
  customer.object.position.set(P.person[0], P.plinth, P.person[2])
  scene.add(customer.object)

  return (t) => {
    const c = mod(t, L)
    vehicleUpdate(van, c)
    barUpdate(bar, c)
    readerLed.emissiveIntensity = 0.5 + 0.9 * hold(c, 1.7, 1.9, 2.5, 2.7)
    readerLed.emissive.set(c > 1.7 && c < 2.7 ? C.green : C.brand)
    /* the bucket lid closes over the data, the padlock's shackle drops; both reopen at the end */
    const shut = seg(c, LOCK.closeA, LOCK.closeB) * (1 - seg(c, LOCK.reopenA + 0.4, LOCK.reopenB))
    lidHinge.rotation.x = lerp(-1.6, 0, shut)
    const snap = seg(c, LOCK.spinA + 0.4, LOCK.spinA + 0.8) * (1 - seg(c, LOCK.reopenA, LOCK.reopenA + 0.4))
    shackle.position.y = lerp(0.1, 0.055, snap)
    padLed.color.set(snap > 0.95 ? '#FFC9B0' : '#B8F0CF')
    padLed.emissive.set(snap > 0.95 ? C.orange : C.green)
    blocks.forEach((b, i) => ((b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + 0.25 * Math.sin((c / L) * Math.PI * 6 + i * 1.3)))
    /* the vault: the wheel turns, the bolts slide into the frame, the lamp turns orange (locked) */
    const turn = seg(c, LOCK.latchA, LOCK.latchB) * (1 - seg(c, LOCK.reopenA - 0.1, LOCK.reopenA + 0.3))
    wheel.rotation.x = turn * Math.PI
    const slide = seg(c, LOCK.boltA, LOCK.boltB) * (1 - seg(c, LOCK.reopenA - 0.1, LOCK.reopenA + 0.3))
    bolts.forEach((b) => (b.position.z = lerp(0.3, 0.48, slide)))
    vaultLed.color.set(slide > 0.95 ? '#FFC9B0' : '#B8F0CF')
    vaultLed.emissive.set(slide > 0.95 ? C.orange : C.green)
    /* the rack's lights and the cooling fans run the whole time; the gate lamps breathe */
    leds.forEach((m, i) => (m.emissiveIntensity = 0.5 + 0.6 * Math.max(0, Math.sin((c / L) * Math.PI * 2 * (3 + (i % 4)) + i * 1.7))))
    fanMats.forEach((f, i) => (f.rotation.y = (c / L) * Math.PI * 2 * (i ? 5 : 4)))
    lampGlow.forEach((m, i) => (m.emissiveIntensity = 0.55 + 0.15 * Math.sin((c / L) * Math.PI * 4 + i)))
    customer.object.position.x = P.person[0] + stepX(c)
    officer.update(c, camera)
    customer.update(c, camera)
  }
}

/* ------------------------------------------------------------------ shared motion */

function vehicleUpdate(v: Vehicle, c: number) {
  const vp = vehiclePose(c)
  v.g.visible = vp.visible
  v.g.position.set(vp.x, 0, vp.z)
  v.g.rotation.y = vp.yaw
  v.wheels.forEach((w) => (w.rotation.x = -vp.dist / 0.18))
  /* a soft settle as it brakes at the barrier */
  v.g.rotation.x = -0.025 * hold(c, RUN.inB - 0.25, RUN.inB, RUN.inB, RUN.inB + 0.35)
}
function barUpdate(bar: THREE.Group, c: number) {
  const up = seg(c, BAR.upA, BAR.upB) * (1 - seg(c, BAR.downA, BAR.downB))
  bar.rotation.z = -up * 1.53
}

/** the guard at the gate: a raised palm as the vehicle pulls up, a look over it, a nod, a reach to lift the barrier */
function guardPose(p: Pose, c: number) {
  /* the vehicle is on his right (the viewer's left): head and eyes go there while it is at the gate */
  const look = hold(c, 0.7, 1.1, 4.4, 5.0)
  to(p, 'headTurn', -0.5, look)
  to(p, 'lookX', -0.85, look)
  to(p, 'lookY', 0.1, look)
  /* stop: the viewer-left hand up, palm out */
  const stop = hold(c, 1.0, 1.35, 1.9, 2.25)
  /* forearm up beside the head (a negative elbow lifts it, hands.ts geometry), palm open to the vehicle */
  to(p, 'shoulderL', 62, stop)
  to(p, 'elbowL', -100, stop)
  to(p, 'wristL', 0, stop)
  for (const f of ['fL1', 'fL2', 'fL3', 'fL4'] as const) to(p, f, 0, stop)
  to(p, 'tL', 0.1, stop)
  to(p, 'spreadL', 0.25, stop)
  to(p, 'palmL', 1, stop)
  /* checks: a slight lean toward the windscreen */
  to(p, 'lean', -4, hold(c, 1.8, 2.2, 2.6, 3.0))
  /* the nod (cleared) */
  to(p, 'headNod', 0.35, hold(c, 2.55, 2.75, 2.75, 3.0))
  /* reaches to the barrier post at his side and lifts it */
  const reach = hold(c, 2.95, 3.25, 3.85, 4.25)
  to(p, 'shoulderL', 40, reach)
  to(p, 'elbowL', 22, reach)
  to(p, 'wristL', -12, reach)
}

/** the resident / the customer: the left-hand lock (safe, bucket), then the right-hand one (flat door, key vault) */
const leftW = (c: number) => hold(c, LOCK.closeA - 0.25, LOCK.closeA + 0.05, LOCK.spinB, LOCK.spinB + 0.3)
const rightW = (c: number) => hold(c, LOCK.turnA, LOCK.turnB, LOCK.boltB, LOCK.boltB + 0.35)
/** the small side-step toward each lock (scene units, added to the person's x) */
const stepX = (c: number) => -0.24 * leftW(c) + 0.26 * rightW(c)
function personPose(p: Pose, c: number) {
  const left = leftW(c)
  to(p, 'headTurn', -0.45, left)
  to(p, 'lookX', -0.8, left)
  to(p, 'lookY', 0.35, left)
  to(p, 'stance', -0.5, left)
  to(p, 'shoulderL', 52, left)
  to(p, 'elbowL', 38 + 10 * Math.sin(Math.max(0, c - LOCK.spinA) * Math.PI * 3) * hold(c, LOCK.spinA, LOCK.spinA + 0.2, LOCK.spinB - 0.2, LOCK.spinB), left)
  to(p, 'lean', -4, left)
  const right = rightW(c)
  to(p, 'stance', 0.5, right)
  to(p, 'headTurn', 0.5, right)
  to(p, 'lookX', 0.85, right)
  to(p, 'lookY', 0.1, right)
  to(p, 'shoulderR', 58, right)
  to(p, 'elbowR', 24, right)
  to(p, 'wristR', 18 * seg(c, LOCK.latchA, LOCK.latchB), right)
  to(p, 'lean', 4, right)
  /* the next day: a quick reach to open both again */
  const again = hold(c, LOCK.reopenA - 0.15, LOCK.reopenA + 0.2, LOCK.reopenB - 0.3, LOCK.reopenB - 0.05)
  to(p, 'shoulderR', 30, again)
  to(p, 'elbowR', 30, again)
  to(p, 'headTurn', 0.2, again)
}

/* ------------------------------------------------------------------ stage + exports */

function densityOf(ref: RefObject<HTMLDivElement | null>) {
  const el = ref.current
  const r = el?.getBoundingClientRect()
  const zoom = r && r.width > 0 ? r.width / W : 1
  return Math.max(2, Math.min(4, Math.max(zoom, 1) * (window.devicePixelRatio || 1)))
}

function Stage({ step, setup }: { step: number; setup: (k: StageKit, density: () => number) => Update }): ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={HOLD_T} setup={(k) => setup(k, () => densityOf(ref))} />
    </div>
  )
}

type Fig = { step?: number }
const T04Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupEveryday} />
const T04Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupConcept} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T04Everyday: T04Everyday as (p: Record<string, unknown>) => ReactNode,
  J_T04Concept: T04Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
