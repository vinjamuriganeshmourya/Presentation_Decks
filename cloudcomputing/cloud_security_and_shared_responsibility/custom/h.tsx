import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'

/**
 * BUILDER H · SESSION 12 (Cloud Security & Shared Responsibility) ANALOGY ON SLIDE 7 (TR 1): "A housing society gives
 * each flat a locked door, a sealed power meter nobody can tamper with, and a backup generator that keeps the lift
 * running: just as cloud systems lock access, detect tampering and keep running through failure."
 *
 * Built to the Session 9 / 10 / 11 review rules from the first draft (generate-slides standing corrections 13-16,
 * cloud course R10-R13): real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera,
 * real places; Character Lab people (rig frames on depth-tested planes, `rigSprite` with a `dress` hook), each an
 * individual, expressions synced to the action, minimal joints (they stand; one arm reaches); no text on either card;
 * one 9 s wall-clock loop shared by both cards, every beat ending where it started (no rest beat, seamless); held
 * frames (`?still`, thumbnails) draw the key moment at HOLD with nothing moving.
 *
 * The two cards share one layout, position for position, and one timeline, beat for beat:
 *
 *   place (x)          everyday: a cutaway two-storey block       concept: a two-level cloud data hall
 *   -2.25 .. -1.35     the flat's locked door (and the one        a rack behind a vault door with a badge reader
 *                      upstairs)                                  (and the tenant rack upstairs)
 *   -2.05 / -0.90      a stranger, then the resident with her     a person with no badge, then the engineer with
 *                      key                                        her badge
 *   -0.05              the sealed power meter, dial turning       the sealed data block, hash scan running
 *    0.55 .. 1.65      the lift, running between the floors       zone A, the workload riding between its levels
 *    2.0  .. 3.0       the backup generator in the yard           zone B, the standby zone
 *
 *   0.15 - 1.95  the stranger tries the handle: it jiggles, the     the stranger taps an empty hand on the reader: red,
 *                door stays shut, he shrugs                         the vault stays shut, he shrugs
 *   1.95 - 2.85  (the meter's seal hangs intact, dial turning)      one slab of the data block is pushed out: the seal
 *                                                                   flashes, the slab snaps back
 *   2.15 - 4.75  the resident turns her key, the door opens,        the engineer taps her badge: green, the vault
 *                she smiles, it closes                              opens on lit drives, it closes
 *   4.90 - 8.95  the mains flicker out; the generator starts and    zone A goes dark; the workload moves to zone B and
 *                the lights come back; the lift never stops; the    keeps running; zone A comes back and the workload
 *                mains return and the generator winds down          returns
 */

const W = 470
const H = 390
const L = 9
/* the held frame: the resident's door open with the key turned, the vault open for the engineer */
const HOLD = 3.45

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandSoft: '#DCE6FF',
  navy: '#1F2E63',
  ink: '#00254B',
  white: '#FFFFFF',
  steel: '#B7C3D6',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  brass: '#D4A24A',
  green: '#22C55E',
  red: '#E5484D',
}

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
const win = (t: number, a: number, b: number, e = 0.2) => seg(t, a - e, a) * (1 - seg(t, b, b + e))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l
/* every shimmer runs a whole number of cycles per loop, so the loop wraps without a jump */
const TAU = Math.PI * 2

/* drawn textures are rasterised at TEX_SS x their logical size so they stay crisp on a 4K screen (correction 15) */
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

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, seg = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, pos)
const glow = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })

/** hemisphere + key + rim, returned so a scene can dim them (the mains flicker) */
function lights(scene: THREE.Scene, target: THREE.Vector3Tuple) {
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3e2, 2.1)
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
  return { hemi, key }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
/**
 * The engine's `castSprite` with a `dress` hook (role clothing drawn in the rig's own frames), as in Sessions 10 and
 * 11: the rig loop is pre-rendered on demand into `frames` images on a depth-tested, camera-facing plane. `px` is the
 * texture width, sized to the person's on-screen height (about 130 CSS px here: 300 px wide = 450 tall, ~3.5x).
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; onReady?: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 300 })
}

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping) */
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
const who = (base: CharacterConfig, o: { hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})

/* role clothing, rig body frame 400 x 600 */
/** a data-centre engineer's lanyard and photo badge (concept card) */
const LANYARD = (color: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={color} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={color} opacity={0.55} />
    <rect x={190} y={319} width={14} height={3} rx={1.5} fill={color} opacity={0.4} />
  </g>
)
/** the resident's shoulder bag strap and bag (everyday card): she has come home */
const SHOULDER_BAG = (
  <g data-part="bag">
    <path d="M 168 206 L 252 352" stroke="#7A4B2A" strokeWidth={6} fill="none" strokeLinecap="round" />
    <rect x={236} y={340} width={50} height={40} rx={8} fill="#A8683A" stroke="#7A4B2A" strokeWidth={2.5} />
    <rect x={244} y={350} width={34} height={6} rx={3} fill="#7A4B2A" opacity={0.6} />
  </g>
)

/* ------------------------------------------------------------------ shared layout and timeline */

/** places, shared by both cards (position for position) */
const P = {
  backZ: -1.2,
  floorH: 2.3,
  slab: 0.1,
  left: -3.1,
  door: { x0: -2.25, x1: -1.35, h: 1.95 },
  handleX: -1.5,
  lockY: 1.02,
  stranger: [-2.02, 0, -0.42] as THREE.Vector3Tuple,
  resident: [-0.86, 0, -0.42] as THREE.Vector3Tuple,
  meterX: -0.05,
  meterY: 1.5,
  shaft: { x0: 0.55, x1: 1.65 },
  wallX: 1.77,
  yardX: 2.52,
  roofY: 4.7,
}
const CONCEPT_Z = 0.02
const LIFT_TRAVEL = P.floorH
/** the lift / workload height: one smooth round trip per loop, never stopping */
const liftY = (t: number) => LIFT_TRAVEL * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / L))

const T = {
  /* the stranger */
  sReach: [0.15, 0.5] as const,
  sTry: [0.5, 1.25] as const,
  sDown: [1.25, 1.55] as const,
  sShrug: [1.4, 1.95] as const,
  /* he walks off to the left after the shrug and back in for the next loop, so the door is clear for the resident */
  sOut: [1.95, 2.75] as const,
  sIn: [8.15, 8.95] as const,
  /* the tamper on the data block (concept) */
  tamper: [1.95, 2.85] as const,
  /* the resident / engineer */
  rReach: [2.15, 2.5] as const,
  key: [2.55, 2.95] as const,
  open: [3.0, 3.55] as const,
  shut: [4.0, 4.45] as const,
  rDown: [4.35, 4.75] as const,
  /* the outage */
  flicker: [4.9, 5.3] as const,
  genStart: [5.15, 5.45] as const,
  mainsBack: 8.6,
  genStop: [8.6, 8.95] as const,
}

function frame(camera: THREE.PerspectiveCamera) {
  camera.fov = 34
  camera.position.set(0.1, 2.55, 8.25)
  camera.lookAt(0.1, 2.22, -0.6)
}

/** the door angle (radians, swings into the flat) for loop time c */
const doorOpen = (c: number) => 1.15 * seg(c, T.open[0], T.open[1]) * (1 - seg(c, T.shut[0], T.shut[1]))
/** the lights' level: 1 on, 0 off; the mains flicker, then the generator restores them */
const lampLevel = (c: number) => {
  if (c < T.flicker[0] || c > T.flicker[1]) return 1
  if (c < 4.98) return 0.08
  if (c < 5.05) return 0.85
  return lerp(0.08, 1, seg(c, 5.22, T.flicker[1]))
}
/** the generator running (0..1): starts after the flicker, winds down once the mains are back */
const genRun = (c: number) => seg(c, T.genStart[0], T.genStart[1]) * (1 - seg(c, T.genStop[0], T.genStop[1]))

/* ------------------------------------------------------------------ the people */

const OFF_X = -3.75
/** the stranger's x: at his place for the try, walking off left, away, walking back in */
const strangerX = (c: number) => (c < T.sOut[1] ? lerp(P.stranger[0], OFF_X, seg(c, T.sOut[0], T.sOut[1])) : lerp(OFF_X, P.stranger[0], seg(c, T.sIn[0], T.sIn[1])))
const strangerWalking = (c: number) => (c > T.sOut[0] + 0.05 && c < T.sOut[1]) || (c > T.sIn[0] && c < T.sIn[1] - 0.05)
const strangerBob = (c: number) => (strangerWalking(c) ? Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.04 : 0)
/** place the stranger for loop time c (hidden while off frame) */
function placeStranger(sp: Sprite, c: number, z = P.stranger[2]) {
  const x = strangerX(c)
  sp.object.visible = x > OFF_X + 0.15
  sp.object.position.set(x, strangerBob(c), z)
}

function stranger(cfg: CharacterConfig, seed: number, redraw: () => void, dress?: (s: Skin) => Skin): Sprite {
  return rigSprite({
    config: cfg,
    dress,
    loop: L,
    frames: 96,
    height: 1.72,
    onReady: redraw,
    timeline: (c) => ({ seed, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [0.3, 'thinking'], [0.85, 'confused'], [1.45, 'skeptical'], [2.4, 'neutral'], [4.95, 'surprised'], [5.6, 'neutral']], L) }),
    pose: (p, c) => {
      /* faces the door (screen-right) while he tries it, then turns to the room and shrugs */
      const at = win(c, T.sReach[0] - 0.05, T.sDown[0] + 0.1, 0.2)
      to(p, 'headTurn', 0.42, at)
      to(p, 'lookX', 0.8, at)
      /* his screen-right arm reaches the handle / the reader and jiggles it */
      const reach = seg(c, T.sReach[0], T.sReach[1]) * (1 - seg(c, T.sDown[0], T.sDown[1]))
      to(p, 'shoulderR', 52, reach)
      to(p, 'elbowR', 34, reach)
      to(p, 'wristR', 10 * Math.sin(((c - T.sTry[0]) / (T.sTry[1] - T.sTry[0])) * Math.PI * 4) * win(c, T.sTry[0], T.sTry[1], 0.08), 1)
      /* the shrug: palms up, head tilted */
      const sh = win(c, T.sShrug[0] + 0.1, T.sShrug[1] - 0.15, 0.15)
      to(p, 'shoulderL', 26, sh)
      to(p, 'elbowL', 92, sh)
      to(p, 'palmL', 1, sh)
      to(p, 'shoulderR', 26, sh)
      to(p, 'elbowR', 92, sh)
      to(p, 'palmR', 1, sh)
      to(p, 'headTilt', 7, sh)
      to(p, 'bodyY', -4, sh)
      /* walking: head toward the way he goes (off left, back in from the left), knees alternate */
      const wOut = win(c, T.sOut[0] + 0.05, T.sOut[1], 0.1)
      const wIn = win(c, T.sIn[0], T.sIn[1] - 0.05, 0.1)
      to(p, 'headTurn', -0.5, wOut)
      to(p, 'lookX', -0.8, wOut)
      to(p, 'headTurn', 0.4, wIn)
      to(p, 'lookX', 0.7, wIn)
      const stride = Math.sin(c * Math.PI * 4.4)
      const walk = Math.max(wOut, wIn)
      to(p, 'kneeL', Math.max(0, stride) * 0.55, walk)
      to(p, 'kneeR', Math.max(0, -stride) * 0.55, walk)
      to(p, 'shoulderL', 8 + 10 * stride, walk)
      to(p, 'shoulderR', 8 - 10 * stride, walk)
    },
  })
}

function resident(cfg: CharacterConfig, seed: number, redraw: () => void, dress?: (s: Skin) => Skin): Sprite {
  return rigSprite({
    config: cfg,
    dress,
    loop: L,
    frames: 72,
    height: 1.62,
    onReady: redraw,
    timeline: (c) => ({ seed, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [2.1, 'listening'], [2.95, 'happy'], [4.8, 'neutral'], [4.95, 'surprised'], [5.6, 'neutral']], L) }),
    pose: (p, c) => {
      /* faces the door (screen-left) from 2.0 to 4.8 */
      const at = win(c, 2.0, 4.75, 0.25)
      to(p, 'headTurn', -0.42, at)
      to(p, 'lookX', -0.8, at)
      /* her screen-left arm reaches the lock / the reader, holds through the turn, comes down as the door swings */
      const reach = seg(c, T.rReach[0], T.rReach[1]) * (1 - seg(c, T.open[0] + 0.25, T.open[1] + 0.15))
      to(p, 'shoulderL', 50, reach)
      to(p, 'elbowL', 30, reach)
      to(p, 'wristL', -24 * seg(c, T.key[0], T.key[1]), reach)
      /* a small lean in and a pleased nod as the door opens */
      to(p, 'headNod', 0.12, win(c, T.open[0] + 0.1, T.open[1] + 0.3, 0.15))
      to(p, 'lookY', -0.7, win(c, 4.95, 5.5, 0.15))
    },
  })
}

/* ================================================================== everyday: the housing society (cutaway block) */

function setupEveryday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E7F0FB')
  frame(camera)
  const L0 = lights(scene, [0, 1.6, -0.6])

  const wallM = mat('#F6EFE4', { roughness: 0.95, emissive: new THREE.Color('#F6EFE4'), emissiveIntensity: 0.4 })
  const trimM = mat('#E2D6C3', { roughness: 0.8 })
  const slabM = mat('#D9DEE8', { roughness: 0.75 })
  const white = mat('#FFFFFF', { roughness: 0.5 })
  const steel = mat(C.steel, { roughness: 0.35, metalness: 0.4 })
  const brass = mat(C.brass, { roughness: 0.3, metalness: 0.7 })

  /* ground: the corridor floor (tiles) and the yard (paving) */
  const fl = mesh(new THREE.PlaneGeometry(P.wallX - P.left + 0.4, 6), mat('#ffffff', { map: tileTex('#EFE7DA', '#DED2BF', 4, [8, 6]), roughness: 0.8 }), [(P.left + P.wallX) / 2, 0, 0.8])
  fl.rotation.x = -Math.PI / 2
  fl.castShadow = false
  const yard = mesh(new THREE.PlaneGeometry(4, 6), mat('#ffffff', { map: tileTex('#DDE6D3', '#C9D6BC', 3, [4, 6]), roughness: 0.9 }), [P.wallX + 2, -0.002, 0.8])
  yard.rotation.x = -Math.PI / 2
  yard.castShadow = false
  scene.add(fl, yard)

  /* the back wall of both floors, with the flat's doorway cut out downstairs */
  const { x0, x1, h: dh } = P.door
  const wz = P.backZ
  const wallPart = (a: number, b: number, y0: number, y1: number) => {
    const m = box(b - a, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.06])
    m.castShadow = false
    scene.add(m)
  }
  wallPart(P.left, x0, 0, P.floorH)
  wallPart(x1, P.shaft.x0, 0, P.floorH)
  wallPart(x0, x1, dh, P.floorH)
  wallPart(P.left, P.shaft.x0, P.floorH, P.roofY)
  /* a skirting band and the floor slab between the storeys, the roof slab on top */
  scene.add(box(P.shaft.x0 - P.left, 0.12, 0.03, trimM, [(P.left + P.shaft.x0) / 2, 0.06, wz + 0.015]))
  scene.add(box(P.shaft.x0 - P.left, 0.12, 0.03, trimM, [(P.left + P.shaft.x0) / 2, P.floorH + P.slab + 0.06, wz + 0.015]))
  scene.add(box(P.shaft.x0 - P.left, P.slab, 1.05, slabM, [(P.left + P.shaft.x0) / 2, P.floorH + P.slab / 2, wz + 0.52]))
  scene.add(box(P.wallX + 0.12 - P.left, 0.14, 1.05, slabM, [(P.left + P.wallX + 0.12) / 2, P.roofY + 0.07, wz + 0.52]))

  /* inside the flat, seen through the open door: a warm hallway with a lamp */
  const flat = new THREE.Group()
  flat.add(box(x1 - x0 + 0.6, 0.02, 1.4, mat('#C9A27A', { roughness: 0.7 }), [(x0 + x1) / 2, 0.01, wz - 0.82]))
  flat.add(box(x1 - x0 + 0.6, dh + 0.2, 0.05, mat('#FFE9C7', { roughness: 0.9, emissive: new THREE.Color('#FFE2B0'), emissiveIntensity: 0.5 }), [(x0 + x1) / 2, (dh + 0.2) / 2, wz - 1.5]))
  for (const sx of [x0 - 0.3, x1 + 0.3]) flat.add(box(0.05, dh + 0.2, 1.4, mat('#FBE3C0', { roughness: 0.9 }), [sx, (dh + 0.2) / 2, wz - 0.82]))
  const flatLamp = glow('#FFC46B', '#FFF4DE')
  flat.add(mesh(new THREE.SphereGeometry(0.11, 20, 16), flatLamp, [(x0 + x1) / 2 + 0.1, 1.55, wz - 1.42]))
  scene.add(flat)

  /* the door: frame, the leaf on its hinge (left edge), a lever handle and a lock plate with the keyhole */
  scene.add(box(0.08, dh + 0.06, 0.16, trimM, [x0 - 0.04, (dh + 0.06) / 2, wz + 0.02]))
  scene.add(box(0.08, dh + 0.06, 0.16, trimM, [x1 + 0.04, (dh + 0.06) / 2, wz + 0.02]))
  scene.add(box(x1 - x0 + 0.16, 0.08, 0.16, trimM, [(x0 + x1) / 2, dh + 0.04, wz + 0.02]))
  const doorM = mat('#8A5A3B', { roughness: 0.55 })
  const panelM = mat('#7A4E33', { roughness: 0.6 })
  const makeDoor = (y0: number) => {
    const hinge = new THREE.Group()
    hinge.position.set(x0, y0, wz + 0.02)
    const leafW = x1 - x0 - 0.02
    hinge.add(box(leafW, dh - 0.02, 0.06, doorM, [leafW / 2 + 0.01, (dh - 0.02) / 2, 0], 0.012))
    for (const py of [0.55, 1.35]) hinge.add(box(leafW - 0.24, 0.6, 0.02, panelM, [leafW / 2 + 0.01, py, 0.035], 0.01))
    /* the lock plate, keyhole and the lever */
    const hx = P.handleX - x0
    hinge.add(box(0.07, 0.24, 0.02, brass, [hx, P.lockY, 0.04], 0.008))
    hinge.add(box(0.012, 0.03, 0.01, mat('#2A2324'), [hx, P.lockY - 0.06, 0.052]))
    const lever = new THREE.Group()
    lever.position.set(hx, P.lockY + 0.06, 0.06)
    lever.add(box(0.13, 0.025, 0.025, brass, [-0.055, 0, 0.02], 0.01))
    hinge.add(lever)
    scene.add(hinge)
    return { hinge, lever }
  }
  const door = makeDoor(0)
  /* the upstairs flat's door: each flat has its own locked door (it stays shut) */
  wallPart(x0, x1, P.floorH + P.slab, P.floorH + P.slab + 0.001)
  const up = makeDoor(P.floorH + P.slab)
  void up
  /* the key: turns in the lock in the resident's hand */
  const key = new THREE.Group()
  key.add(mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 20), brass, [0, 0, 0.09]))
  key.add(box(0.012, 0.012, 0.07, brass, [0, 0, 0.045]))
  key.position.set(P.handleX, P.lockY - 0.06, wz + 0.06)
  scene.add(key)

  /* ceiling lamps, one per floor, and a wall window upstairs */
  const lampM = glow('#FFF1C9', '#FFFDF5')
  for (const y of [P.floorH - 0.02, P.roofY - 0.02]) {
    scene.add(cyl(0.22, 0.26, 0.05, lampM, [-1.15, y, wz + 0.55]))
    scene.add(cyl(0.22, 0.26, 0.05, lampM, [0.05, y, wz + 0.55]))
  }
  const sky = mat('#BFD8F7', { roughness: 0.2, emissive: new THREE.Color('#CFE3FB'), emissiveIntensity: 0.6 })
  scene.add(box(0.9, 0.9, 0.02, sky, [-0.35, P.floorH + 1.35, wz + 0.01]))
  scene.add(box(0.98, 0.06, 0.06, white, [-0.35, P.floorH + 0.88, wz + 0.03]))
  scene.add(box(0.98, 0.06, 0.06, white, [-0.35, P.floorH + 1.82, wz + 0.03]))
  scene.add(box(0.06, 0.98, 0.06, white, [-0.82, P.floorH + 1.35, wz + 0.03]))
  scene.add(box(0.06, 0.98, 0.06, white, [0.12, P.floorH + 1.35, wz + 0.03]))
  scene.add(box(0.04, 0.9, 0.04, white, [-0.35, P.floorH + 1.35, wz + 0.03]))

  /* THE SEALED POWER METER on the corridor wall: a box with a glass window, a spinning disc and a dial needle; a
     seal on a wire through the cover screw, hanging intact */
  const meter = new THREE.Group()
  meter.position.set(P.meterX, P.meterY, wz + 0.02)
  meter.scale.setScalar(1.35)
  meter.add(box(0.46, 0.62, 0.16, mat('#EEF1F6', { roughness: 0.5 }), [0, 0, 0.08], 0.03))
  meter.add(box(0.34, 0.24, 0.01, mat('#1F2E63', { roughness: 0.3 }), [0, 0.12, 0.165], 0.02))
  const dialFace = cyl(0.085, 0.085, 0.01, white, [-0.07, 0.12, 0.172])
  dialFace.rotation.x = Math.PI / 2
  meter.add(dialFace)
  const needle = new THREE.Group()
  needle.position.set(-0.07, 0.12, 0.18)
  needle.add(box(0.008, 0.07, 0.006, mat(C.red), [0, 0.03, 0]))
  meter.add(needle)
  /* the disc, seen edge on through a slot, with its mark sweeping round */
  meter.add(box(0.16, 0.03, 0.01, mat('#0E1733'), [0.0, -0.08, 0.166]))
  const disc = new THREE.Group()
  disc.position.set(0.0, -0.08, 0.12)
  const discM = mat('#C9D3E6', { roughness: 0.25, metalness: 0.7 })
  disc.add(cyl(0.075, 0.075, 0.01, discM, [0, 0, 0]))
  disc.add(box(0.02, 0.012, 0.03, mat('#111111'), [0.06, 0, 0]))
  meter.add(disc)
  const ledM = glow(C.red, '#552222')
  meter.add(mesh(new THREE.SphereGeometry(0.014, 12, 10), ledM, [0.11, 0.12, 0.175]))
  /* the seal: a screw on the cover, a twisted wire loop, a round seal hanging on it */
  meter.add(cyl(0.016, 0.016, 0.02, brass, [0.15, -0.24, 0.17]).rotateX(Math.PI / 2))
  const seal = new THREE.Group()
  seal.position.set(0.15, -0.24, 0.185)
  seal.add(mesh(new THREE.TorusGeometry(0.035, 0.004, 6, 20), steel, [0, -0.035, 0]))
  const sealDisc = cyl(0.03, 0.03, 0.016, mat('#C2412D', { roughness: 0.45 }), [0, -0.085, 0])
  sealDisc.rotation.x = Math.PI / 2
  seal.add(sealDisc)
  seal.add(cyl(0.014, 0.014, 0.018, mat('#9C2F20'), [0, -0.085, 0.002]).rotateX(Math.PI / 2))
  meter.add(seal)
  /* the cable from the meter up into the ceiling */
  meter.add(box(0.035, 0.5, 0.035, mat('#5B6478'), [-0.15, 0.56, 0.03]))
  scene.add(meter)

  /* THE LIFT: a shaft of steel posts and glass spanning both floors, the car running between them on its ropes */
  const { x0: s0, x1: s1 } = P.shaft
  const shaftBack = box(s1 - s0, P.roofY, 0.08, mat('#C8D1E0', { roughness: 0.7 }), [(s0 + s1) / 2, P.roofY / 2, wz - 0.04])
  shaftBack.castShadow = false
  scene.add(shaftBack)
  for (const sx of [s0 + 0.03, s1 - 0.03]) for (const sz of [wz + 0.05, -0.25]) scene.add(box(0.06, P.roofY, 0.06, steel, [sx, P.roofY / 2, sz]))
  for (const y of [0.02, P.floorH + P.slab / 2, P.roofY - 0.02]) scene.add(box(s1 - s0, 0.06, 0.06, steel, [(s0 + s1) / 2, y, -0.25]))
  const glass = new THREE.MeshStandardMaterial({ color: '#DCEBFF', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false })
  scene.add(box(s1 - s0 - 0.08, P.roofY - 0.1, 0.01, glass, [(s0 + s1) / 2, P.roofY / 2, -0.24]))
  /* landing doors stand open at each floor's edge (the corridor meets the shaft) */
  const car = new THREE.Group()
  const cw = s1 - s0 - 0.16
  const cd = 0.78
  const carM = mat('#E9EEF6', { roughness: 0.4, metalness: 0.2 })
  const carLight = glow('#FFF1C9', '#FFFDF5')
  car.add(box(cw, 0.06, cd, mat('#8C96A8'), [0, 0.03, 0]))
  car.add(box(cw, 0.06, cd, carM, [0, 1.98, 0]))
  car.add(box(cw, 1.98, 0.04, carM, [0, 0.99, -cd / 2 + 0.02]))
  for (const sx of [-cw / 2 + 0.02, cw / 2 - 0.02]) car.add(box(0.04, 1.98, cd, carM, [sx, 0.99, 0]))
  car.add(box(cw * 0.6, 0.03, cd * 0.5, carLight, [0, 1.94, 0]))
  car.add(box(cw - 0.1, 0.05, 0.03, steel, [0, 1.0, -cd / 2 + 0.06]))
  car.add(mesh(new THREE.BoxGeometry(cw, 1.98, 0.01), new THREE.MeshStandardMaterial({ color: '#CFE0F2', transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false }), [0, 0.99, cd / 2]))
  const carZ = (wz + 0.1 + -0.3) / 2
  car.position.set((s0 + s1) / 2, 0, carZ)
  scene.add(car)
  const rope = box(0.02, 1, 0.02, mat('#4A5266', { metalness: 0.6, roughness: 0.4 }), [(s0 + s1) / 2, 0, carZ])
  scene.add(rope)

  /* the outside wall, and THE GENERATOR in the yard: a yellow set on skids, a control panel with a run lamp, an
     exhaust stack that puffs while it runs, a cable into the building */
  scene.add(box(0.12, P.roofY + 0.14, 1.05, mat('#EADFCF', { roughness: 0.85 }), [P.wallX + 0.06, (P.roofY + 0.14) / 2, wz + 0.52]))
  const gen = new THREE.Group()
  gen.position.set(P.yardX, 0, -0.55)
  gen.scale.setScalar(1.25)
  const genBody = new THREE.Group()
  genBody.add(box(0.92, 0.08, 0.6, mat('#3A4256'), [0, 0.04, 0]))
  genBody.add(box(0.86, 0.56, 0.56, mat(C.gold, { roughness: 0.45 }), [0, 0.37, 0], 0.05))
  for (let i = 0; i < 5; i++) genBody.add(box(0.03, 0.3, 0.01, mat('#C99A2E'), [-0.36 + i * 0.05, 0.38, 0.285]))
  genBody.add(box(0.28, 0.24, 0.02, mat('#2E3A55'), [0.2, 0.4, 0.285], 0.02))
  const runM = glow(C.green, '#1E4D2E')
  genBody.add(mesh(new THREE.SphereGeometry(0.03, 14, 12), runM, [0.14, 0.45, 0.3]))
  const gauge = cyl(0.045, 0.045, 0.01, white, [0.25, 0.4, 0.297])
  gauge.rotation.x = Math.PI / 2
  genBody.add(gauge)
  const gNeedle = new THREE.Group()
  gNeedle.position.set(0.25, 0.4, 0.305)
  gNeedle.add(box(0.006, 0.04, 0.004, mat(C.red), [0, 0.018, 0]))
  genBody.add(gNeedle)
  genBody.add(cyl(0.04, 0.04, 0.3, mat('#5B6478', { metalness: 0.5 }), [-0.28, 0.8, -0.12]))
  gen.add(genBody)
  scene.add(gen)
  /* the cable from the generator to the building */
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(P.yardX - 0.54, 0.3, -0.62), new THREE.Vector3(P.yardX - 0.68, 0.05, -0.7), new THREE.Vector3(P.wallX + 0.14, 0.05, -0.75), new THREE.Vector3(P.wallX + 0.13, 0.5, -0.75)]), 24, 0.022, 8), mat('#2E3A55', { roughness: 0.6 }))
  scene.add(cable)
  /* exhaust puffs: four soft spheres rising from the stack and fading, staggered */
  const puffs = Array.from({ length: 4 }, () => {
    const m = new THREE.MeshStandardMaterial({ color: '#B8BFCC', transparent: true, opacity: 0, roughness: 1, depthWrite: false })
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), m)
    scene.add(o)
    return { o, m }
  })

  /* people. The stranger: a lean man in a grey hoodie, stubble; the resident: a woman in a kurta with her bag */
  const sCfg = who(CAST_PRESETS.rohan, { outfit: { top: 'hoodie', topColor: '#5E6677', bottom: 'jeans', bottomColor: '#2C3550', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', beard: 'stubble' }, build: { height: 1.03, shoulders: 1 } })
  const rCfg = who(CAST_PRESETS.meera, { hair: { style: 'braid' }, outfit: { top: 'kurta', topColor: '#1E9E8F', bottom: 'salwar', bottomColor: '#F2E6D0', shoeColor: '#5A3A2A' }, accessories: { earrings: true, bindi: true } })
  const sp = stranger(sCfg, 51, redraw)
  const rp = resident(rCfg, 52, redraw, (k) => ({ ...k, neckExtras: <>{k.neckExtras}{SHOULDER_BAG}</> }))
  rp.object.position.set(...P.resident)
  scene.add(sp.object, rp.object)

  const keyLight = L0.key.intensity
  const hemiLight = L0.hemi.intensity
  return (t) => {
    const c = mod(t, L)
    /* the door: shut while the stranger rattles the handle, opened by the resident's key */
    door.hinge.rotation.y = doorOpen(c)
    const jig = win(c, T.sTry[0], T.sTry[1], 0.08) * Math.abs(Math.sin(((c - T.sTry[0]) / (T.sTry[1] - T.sTry[0])) * Math.PI * 4))
    const turn = seg(c, T.open[0] - 0.15, T.open[0] + 0.1) * (1 - seg(c, T.shut[1], T.shut[1] + 0.2))
    door.lever.rotation.z = 0.45 * Math.max(jig, turn)
    door.hinge.position.x = P.door.x0 + 0.006 * jig * Math.sin(c * 60)
    /* the key: in the resident's hand from her reach to the door shutting; it turns a quarter */
    const keyIn = win(c, T.rReach[1] - 0.02, T.rDown[0], 0.08)
    key.visible = keyIn > 0.02
    key.scale.setScalar(Math.max(0.001, keyIn))
    key.rotation.z = (Math.PI / 2) * seg(c, T.key[0], T.key[1]) * (1 - seg(c, T.shut[1], T.rDown[0] + 0.1))
    /* the key rides with the door while it is open */
    const a = door.hinge.rotation.y
    const r = P.handleX - P.door.x0
    key.position.set(P.door.x0 + r * Math.cos(a), P.lockY - 0.06, P.backZ + 0.06 - r * Math.sin(a))
    key.rotation.y = a

    /* the meter: the disc and the needle turn without pause; the seal hangs and sways a little, intact */
    disc.rotation.y = (2 * Math.PI * 3 * c) / L
    needle.rotation.z = -((2 * Math.PI * c) / L)
    seal.rotation.z = 0.12 * Math.sin((2 * Math.PI * 2 * c) / L)
    ledM.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin((2 * Math.PI * 9 * c) / L))

    /* the outage: lamps flicker out and back on generator power; the lift runs on throughout */
    const lv = lampLevel(c)
    lampM.emissiveIntensity = 1.1 * lv
    carLight.emissiveIntensity = 1.1 * Math.max(lv, 0.55)
    flatLamp.emissiveIntensity = 1.2 * lv
    L0.key.intensity = keyLight * (0.55 + 0.45 * lv)
    L0.hemi.intensity = hemiLight * (0.6 + 0.4 * lv)
    const y = liftY(c)
    car.position.y = y
    rope.scale.y = Math.max(0.01, P.roofY - (y + 2.0))
    rope.position.y = (P.roofY + y + 2.0) / 2

    /* the generator: cranks (a shudder), runs (a steady hum, the lamp on, the needle up, puffs), winds down */
    const run = genRun(c)
    const crank = win(c, T.genStart[0], T.genStart[1], 0.05)
    genBody.position.x = (0.006 * run + 0.014 * crank) * Math.sin(c * 95)
    genBody.position.y = (0.004 * run + 0.01 * crank) * Math.abs(Math.sin(c * 70))
    runM.emissiveIntensity = 1.6 * run
    gNeedle.rotation.z = -1.1 * run
    puffs.forEach((p, i) => {
      const u = mod(c * 1.25 + i * 0.25, 1)
      p.o.position.set(P.yardX - 0.35 + u * 0.2, 1.22 + u * 0.75, -0.7)
      p.o.scale.setScalar(0.6 + u * 1.4)
      p.m.opacity = 0.5 * run * Math.sin(u * Math.PI)
    })

    placeStranger(sp, c)
    sp.update(c, camera)
    rp.update(c, camera)
  }
}

/* ================================================================== concept: the cloud data hall */

function setupConcept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E7EEFB')
  frame(camera)
  const L0 = lights(scene, [0, 1.6, -0.6])

  const wallM = mat('#EEF3FB', { roughness: 0.95, emissive: new THREE.Color('#EEF3FB'), emissiveIntensity: 0.45 })
  const steel = mat(C.steel, { roughness: 0.35, metalness: 0.4 })
  const white = mat('#FFFFFF', { roughness: 0.5 })
  const rackM = mat(C.navy, { roughness: 0.45, metalness: 0.25 })
  const vaultM = mat('#C5CEDD', { roughness: 0.3, metalness: 0.65 })
  const wz = P.backZ

  /* two zones on the raised floor: zone A (left, cool blue tiles) and zone B (right of the partition, lavender) */
  const fa = mesh(new THREE.PlaneGeometry(P.wallX - P.left + 0.4, 6), mat('#ffffff', { map: tileTex('#E4ECFA', '#C9D6EE', 4, [8, 6]), roughness: 0.75 }), [(P.left + P.wallX) / 2, 0, 0.8])
  fa.rotation.x = -Math.PI / 2
  fa.castShadow = false
  const fb = mesh(new THREE.PlaneGeometry(4, 6), mat('#ffffff', { map: tileTex('#ECE6FA', '#D6CCEF', 4, [4, 6]), roughness: 0.75 }), [P.wallX + 2, -0.002, 0.8])
  fb.rotation.x = -Math.PI / 2
  fb.castShadow = false
  scene.add(fa, fb)
  const back = box(P.wallX + 2.4 - P.left, P.roofY, 0.12, wallM, [(P.left + P.wallX + 2.4) / 2, P.roofY / 2, wz - 0.06])
  back.castShadow = false
  scene.add(back)
  /* the mezzanine (grated deck) where the hall's upper level stands, and the ceiling */
  const deckM = mat('#C9D3E6', { roughness: 0.55, metalness: 0.4 })
  scene.add(box(P.shaft.x0 - P.left, P.slab, 1.05, deckM, [(P.left + P.shaft.x0) / 2, P.floorH + P.slab / 2, wz + 0.52]))
  for (let i = 0; i < 12; i++) scene.add(box(0.02, 0.012, 1.0, mat('#A7B3C9'), [P.left + 0.15 + i * 0.3, P.floorH + P.slab + 0.006, wz + 0.52]))
  scene.add(box(P.shaft.x0 - P.left, 0.04, 0.04, steel, [(P.left + P.shaft.x0) / 2, P.floorH + P.slab + 0.5, -0.2]))
  scene.add(box(P.wallX + 2.6 - P.left, 0.12, 1.05, mat('#D9E1EE', { roughness: 0.75 }), [(P.left + P.wallX + 2.6) / 2, P.roofY + 0.06, wz + 0.52]))
  /* the zone partition: a glass wall with a steel frame at the zone boundary */
  scene.add(box(0.06, P.roofY, 0.06, steel, [P.wallX + 0.03, P.roofY / 2, -0.2]))
  scene.add(box(0.03, P.roofY, 1.0, new THREE.MeshStandardMaterial({ color: '#D7E4FA', transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false }), [P.wallX + 0.03, P.roofY / 2, wz + 0.5]))

  /* hall lamps (same places as the corridor lamps) */
  const lampM = glow('#EAF2FF', '#FFFFFF')
  for (const y of [P.floorH - 0.02, P.roofY - 0.02]) {
    scene.add(box(0.6, 0.04, 0.12, lampM, [-1.15, y, wz + 0.55]))
    scene.add(box(0.6, 0.04, 0.12, lampM, [0.05, y, wz + 0.55]))
  }

  /* THE VAULT RACK (where the flat's door is): a rack with a heavy steel vault door and a round wheel, a badge reader
     beside the handle; behind the door, rows of lit drives. And the tenant rack upstairs, locked */
  const { x0, x1, h: dh } = P.door
  const drives: THREE.MeshStandardMaterial[] = []
  const makeVault = (y0: number) => {
    const g = new THREE.Group()
    g.add(box(x1 - x0 + 0.12, dh + 0.08, 0.7, rackM, [(x0 + x1) / 2, y0 + (dh + 0.08) / 2, wz + 0.35 - 0.02]))
    /* the interior: drive bays (lit) */
    for (let r = 0; r < 8; r++) {
      const m = glow('#5B8CFF', '#16224A')
      drives.push(m)
      g.add(box(x1 - x0 - 0.16, 0.13, 0.02, m, [(x0 + x1) / 2, y0 + 0.24 + r * 0.2, wz + 0.695]))
    }
    scene.add(g)
    const hinge = new THREE.Group()
    hinge.position.set(x0, y0, wz + 0.765)
    const leafW = x1 - x0 - 0.02
    hinge.add(box(leafW, dh - 0.04, 0.07, vaultM, [leafW / 2 + 0.01, (dh - 0.04) / 2 + 0.02, 0], 0.02))
    const wheel = new THREE.Group()
    wheel.position.set(leafW / 2 + 0.01, dh * 0.52, 0.06)
    wheel.add(mesh(new THREE.TorusGeometry(0.17, 0.018, 10, 32), mat('#7E8AA3', { metalness: 0.7, roughness: 0.3 })))
    for (let i = 0; i < 3; i++) {
      const sp = box(0.32, 0.02, 0.02, mat('#7E8AA3', { metalness: 0.7, roughness: 0.3 }), [0, 0, 0])
      sp.rotation.z = (i * Math.PI) / 3
      wheel.add(sp)
    }
    wheel.add(cyl(0.04, 0.04, 0.04, mat('#5B6478', { metalness: 0.7 }), [0, 0, 0]).rotateX(Math.PI / 2))
    hinge.add(wheel)
    for (const by of [0.3, dh - 0.3]) hinge.add(box(0.05, 0.16, 0.05, mat('#7E8AA3', { metalness: 0.7 }), [0.02, by, 0.04]))
    scene.add(hinge)
    return { hinge, wheel }
  }
  const vault = makeVault(0)
  makeVault(P.floorH + P.slab)
  /* the badge reader, on the vault door where a flat door has its lock (hand height), with its two status lamps; it
     rides with the door */
  const reader = new THREE.Group()
  reader.position.set(P.handleX - P.door.x0, P.lockY, 0.06)
  reader.add(box(0.11, 0.17, 0.04, mat('#2E3A55', { roughness: 0.4 }), [0, 0, 0], 0.015))
  reader.add(box(0.07, 0.07, 0.01, mat('#4A5878', { roughness: 0.3 }), [0, -0.02, 0.022], 0.008))
  const okM = glow(C.green, '#1E3A2A')
  const noM = glow(C.red, '#3A1E22')
  reader.add(mesh(new THREE.SphereGeometry(0.014, 12, 10), okM, [-0.025, 0.055, 0.025]))
  reader.add(mesh(new THREE.SphereGeometry(0.014, 12, 10), noM, [0.025, 0.055, 0.025]))
  vault.hinge.add(reader)

  /* THE SEALED DATA BLOCK (where the meter is): a wall case with a glass front holding a block of stacked data slabs
     bound by a seal band; a scan ring sweeps it without pause; one slab pushed out makes the seal flash */
  const caseG = new THREE.Group()
  caseG.position.set(P.meterX, P.meterY, wz + 0.02)
  caseG.scale.setScalar(1.35)
  /* an open-fronted case: a back panel, four side walls, a dark interior so the lit block reads */
  const caseM = mat('#E6ECF6', { roughness: 0.5 })
  caseG.add(box(0.5, 0.66, 0.04, caseM, [0, 0, 0.02], 0.01))
  caseG.add(box(0.42, 0.58, 0.01, mat('#0E1733', { roughness: 0.6 }), [0, 0, 0.045]))
  for (const sx of [-0.23, 0.23]) caseG.add(box(0.04, 0.66, 0.36, caseM, [sx, 0, 0.18], 0.01))
  for (const sy of [-0.31, 0.31]) caseG.add(box(0.5, 0.04, 0.36, caseM, [0, sy, 0.18], 0.01))
  const slabs: THREE.Mesh[] = []
  const slabM = glow('#5B8CFF', '#2D63FB', { roughness: 0.3 })
  slabM.emissiveIntensity = 0.35
  for (let i = 0; i < 4; i++) {
    const s = box(0.26, 0.075, 0.2, slabM, [0, -0.15 + i * 0.09, 0.2], 0.015)
    slabs.push(s)
    caseG.add(s)
  }
  const sealM = glow(C.orange, C.gold, { metalness: 0.5, roughness: 0.3 })
  const band = box(0.04, 0.4, 0.23, sealM, [0, -0.015, 0.2], 0.01)
  caseG.add(band)
  const clasp = box(0.07, 0.07, 0.03, sealM, [0, -0.015, 0.32], 0.012)
  caseG.add(clasp)
  const scanM = new THREE.MeshBasicMaterial({ color: '#9FC2FF', transparent: true, opacity: 0.55, depthWrite: false })
  const scan = box(0.32, 0.008, 0.26, scanM, [0, 0, 0.2])
  caseG.add(scan)
  caseG.add(box(0.44, 0.6, 0.01, new THREE.MeshStandardMaterial({ color: '#CFE0F2', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }), [0, 0, 0.365]))
  caseG.add(box(0.035, 0.5, 0.035, mat('#5B6478'), [-0.18, 0.58, 0.03]))
  scene.add(caseG)

  /* ZONE A (where the lift runs) and ZONE B (where the generator stands): two tall racks, servers on both levels,
     the workload block riding a rail between the levels the way the lift runs between floors */
  const zone = (cx: number, w: number) => {
    const g = new THREE.Group()
    const leds: THREE.MeshStandardMaterial[] = []
    g.add(box(w, P.roofY - 0.04, 0.7, rackM, [cx, (P.roofY - 0.04) / 2, wz + 0.35]))
    for (let lv = 0; lv < 2; lv++)
      for (let r = 0; r < 6; r++) {
        const y = lv * (P.floorH + P.slab) + 0.3 + r * 0.3
        g.add(box(w - 0.12, 0.2, 0.05, mat('#2A3A70', { roughness: 0.4 }), [cx, y, wz + 0.72]))
        const m = glow('#6EE7B7', '#14301F')
        leds.push(m)
        g.add(box(0.05, 0.03, 0.01, m, [cx - w / 2 + 0.14, y, wz + 0.75]))
        const m2 = glow('#5B8CFF', '#16224A')
        leds.push(m2)
        g.add(box(w * 0.42, 0.03, 0.01, m2, [cx + 0.05, y - 0.04, wz + 0.75]))
      }
    /* the rail the workload rides, in front of the servers */
    for (const sx of [cx - 0.22, cx + 0.22]) g.add(box(0.03, P.roofY - 0.1, 0.03, steel, [sx, (P.roofY - 0.1) / 2, -0.32]))
    scene.add(g)
    return leds
  }
  const ax = (P.shaft.x0 + P.shaft.x1) / 2
  const bx = P.yardX - 0.06
  const ledsA = zone(ax, P.shaft.x1 - P.shaft.x0)
  const ledsB = zone(bx, P.shaft.x1 - P.shaft.x0 - 0.1)
  /* the workload: a lit block with an app window face, on a carriage between the rails */
  const job = new THREE.Group()
  const jobM = glow('#8FB3FF', C.brand, { roughness: 0.3 })
  jobM.emissiveIntensity = 0.45
  job.add(box(0.5, 0.42, 0.34, jobM, [0, 0.21, 0], 0.05))
  job.add(box(0.36, 0.22, 0.01, white, [0, 0.24, 0.175], 0.02))
  for (let i = 0; i < 3; i++) job.add(box(0.2 - i * 0.04, 0.025, 0.012, mat(C.brand), [-0.03 + i * 0.02, 0.29 - i * 0.05, 0.182]))
  job.add(box(0.5, 0.03, 0.03, steel, [0, 0.0, -0.08]))
  job.scale.setScalar(1.2)
  scene.add(job)
  /* the hand-over path between the zones: a dotted light trail while the workload moves across */
  const trail = Array.from({ length: 6 }, () => {
    const m = new THREE.MeshBasicMaterial({ color: '#9FC2FF', transparent: true, opacity: 0, depthWrite: false })
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), m)
    scene.add(o)
    return { o, m }
  })

  /* people. The badge-less stranger: a man in a maroon jacket-hoodie; the engineer: a woman with a bob, glasses and
     her lanyard badge. Neither is any of the everyday card's people */
  const sCfg = who(CAST_PRESETS.dev, { hair: { style: 'short', color: 'black' }, outfit: { top: 'hoodie', topColor: '#8A3B4B', bottom: 'jeans', bottomColor: '#28324E', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', beard: 'short' }, build: { height: 1.02, shoulders: 1.02 } })
  const eCfg = who(CAST_PRESETS.ananya, { outfit: { top: 'polo', topColor: C.brand, bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', earrings: true } })
  const sp = stranger(sCfg, 61, redraw)
  const ep = resident(eCfg, 62, redraw, (k) => ({ ...k, neckExtras: <>{k.neckExtras}{LANYARD(C.brandDark)}</> }))
  /* the racks stand 0.7 deep off the back wall, so the concept's people stand in front of the rack faces (same x) */
  ep.object.position.set(P.resident[0], 0, CONCEPT_Z)
  scene.add(sp.object, ep.object)

  const keyLight = L0.key.intensity
  return (t) => {
    const c = mod(t, L)
    /* the reader: red twice for the empty hand, green for the badge; the vault opens only for the badge */
    const deny = win(c, T.sTry[0] + 0.05, T.sTry[1], 0.05) * (Math.sin(((c - T.sTry[0]) / (T.sTry[1] - T.sTry[0])) * Math.PI * 4) > 0 ? 1 : 0.15)
    noM.emissiveIntensity = 2.2 * deny
    okM.emissiveIntensity = 2.2 * win(c, T.key[0], T.shut[0], 0.1)
    vault.hinge.rotation.y = -doorOpen(c)
    vault.wheel.rotation.z = -Math.PI * 0.75 * seg(c, T.key[0], T.key[1] + 0.05) * (1 - seg(c, T.shut[1], T.shut[1] + 0.3))
    const lit = 0.25 + 0.9 * seg(c, T.open[0], T.open[1]) * (1 - seg(c, T.shut[0], T.shut[1]))
    drives.forEach((m, i) => (m.emissiveIntensity = lit * (0.75 + 0.25 * Math.sin(TAU * 9 * c / L + i))))

    /* the data block: the scan ring sweeps up and down three times a loop; the tamper pushes slab 2 out, the seal
       flashes, the slab snaps back into place */
    const sweep = 0.5 - 0.5 * Math.cos((2 * Math.PI * 3 * c) / L)
    scan.position.y = -0.2 + sweep * 0.38
    const out = seg(c, T.tamper[0], T.tamper[0] + 0.25) * (1 - seg(c, T.tamper[1] - 0.35, T.tamper[1]))
    slabs[2].position.x = 0.1 * out
    const flash = win(c, T.tamper[0] + 0.2, T.tamper[1] - 0.2, 0.1)
    sealM.emissiveIntensity = flash * (0.8 + 0.8 * Math.abs(Math.sin(c * 14)))
    scanM.color.set(flash > 0.1 ? '#FFB27A' : '#9FC2FF')

    /* the outage: zone A's servers go dark, the hall lights dip; the workload moves to zone B and keeps running */
    const lv = lampLevel(c)
    lampM.emissiveIntensity = 1.0 * lv
    L0.key.intensity = keyLight * (0.7 + 0.3 * lv)
    const aDown = seg(c, T.flicker[0], T.flicker[0] + 0.12) * (1 - seg(c, T.mainsBack - 0.05, T.mainsBack + 0.15))
    const aFlick = c > T.flicker[0] && c < T.flicker[1] ? (Math.sin(c * 70) > 0 ? 1 : 0.2) : 1
    ledsA.forEach((m, i) => (m.emissiveIntensity = (1 - aDown) * aFlick * (0.7 + 0.5 * Math.max(0, Math.sin(TAU * 7 * c / L + i * 1.3)))))
    const bBusy = seg(c, T.genStart[0], T.genStart[1] + 0.1) * (1 - seg(c, T.genStop[0], T.genStop[1]))
    ledsB.forEach((m, i) => (m.emissiveIntensity = 0.25 + (0.45 + 0.9 * bBusy) * Math.max(0, Math.sin(TAU * (7 + 4 * bBusy) * c / L + i * 1.3))))
    /* where the workload is: in A, crossing to B, in B, crossing back */
    const toB = seg(c, T.genStart[0] - 0.05, T.genStart[1] + 0.15)
    const toA = seg(c, T.mainsBack - 0.05, T.genStop[1])
    const k = toB * (1 - toA)
    const y = liftY(c)
    const jx = lerp(ax, bx, k)
    const hop = Math.sin(Math.PI * k) * 0.25
    job.position.set(jx, y + 0.65 + hop, -0.32)
    jobM.emissiveIntensity = 0.45 + 0.25 * Math.sin(TAU * 6 * c / L)
    const moving = Math.min(1, 4 * k * (1 - k))
    trail.forEach((p, i) => {
      const u = i / trail.length
      const kk = clamp01(k + (toA > 0 && toA < 1 ? u : -u) * 0.18)
      p.o.position.set(lerp(ax, bx, kk), y + 0.86 + Math.sin(Math.PI * kk) * 0.25, -0.32)
      p.m.opacity = 0.6 * moving * (1 - u)
    })

    placeStranger(sp, c, CONCEPT_Z)
    sp.update(c, camera)
    ep.update(c, camera)
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
/* both cards the same canvas size, so the shared renderer never resizes between them (Session 10 lesson) */
const Stage = ({ step, setup }: { step: number; setup: (k: StageKit) => Update }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={HOLD} />
  </div>
)
const T01Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupEveryday} />
const T01Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupConcept} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T01Everyday: T01Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T01Concept: T01Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
