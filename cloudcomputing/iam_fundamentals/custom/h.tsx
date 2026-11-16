import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import type { Skin } from '@/decks/figures/cast/skins/types'
import ec2Url from '../images/h-aws-ec2.svg'
import s3Url from '../images/aws-s3.svg'
import mfaUrl from '../images/res-iam-mfa-token.svg'
import credUrl from '../images/res-iam-long-term-security-credential.svg'
import iamUrl from '../images/aws-iam.svg'

/**
 * BUILDER H · SESSION 13 (IAM Fundamentals) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`, built to
 * Sessions 9-12 as reviewed (generate-slides standing corrections 13-16, cloud R10-R13, "Low-end PCs"): perspective
 * camera, real places, Character Lab people through the engine's `castSprite` (adaptive frames, role clothing by
 * `dress`, expressions keyed to the action), no text on either card, one wall-clock loop per slide shared by both
 * cards beat for beat and place for place, every loop ending in the state it starts in, held frames at HOLD.
 *
 * SLIDE 8 · T02-AN (TR 2): "A company owner's master key opens every office and controls all important operations, so
 * it is kept secure and used only when necessary: just as the root account has complete control over AWS resources and
 * should not be used for daily tasks."
 *
 *   place (x)   everyday: an office corridor                 concept: an AWS account
 *   -2.35       door A, the office (desk, monitor)            glass bay A, an EC2 server rack
 *   -0.85       door B, the control room (panel, screen)      glass bay B, the billing console
 *    0.65       door C, the records room (cabinets)           glass bay C, an S3 bucket
 *    2.35       the wall safe                                 the vault sealed with an MFA token
 *
 *   0.0 - 1.45  the owner opens the safe and takes the        the admin opens the MFA vault and takes the root key
 *               master key; meanwhile a worker's card opens   out; meanwhile an IAM user's card opens bay A only
 *               her own office (door A) and she goes in
 *   1.45 - 7.25 the master key opens door C, B, A in turn,    the root key unlocks bay C, B, A in turn, each
 *               each room's lights come up                    resource lights up
 *   7.25 - 9.0  the key goes back in the safe, it is shut     the root key goes back into the vault, the MFA token
 *               and the dial spun                             seals it (green)
 *
 * SLIDE 15 · T06-AN (TR 6): "At an exam hall, the invigilator checks the hall ticket and ID card to confirm the student
 * is who they claim to be: just as authentication checks credentials to confirm the caller's identity."
 *
 *   place (x)   everyday: the exam hall entrance             concept: an authentication gate
 *   -1.0 / 0.15 the queue spot / the check spot              the same two spots
 *    0.15       the hall door (desks inside)                  the gate's glass flaps (the cloud room inside)
 *    1.0        the invigilator's table                       the scanner kiosk
 *    1.75       the invigilator                               (the kiosk's screen stands where she stands)
 *
 *   student A's ticket and ID match: a tick, she goes in; student B's do not: a cross, the invigilator holds up her
 *   palm, B shrugs and leaves. Concept: caller A's credential matches, the flaps open, she walks into the cloud room;
 *   caller B's does not, the flaps stay shut, he leaves.
 */

const W = 470
const H = 390

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#00254B',
  white: '#FFFFFF',
  steel: '#B7C3D6',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  brass: '#D4A24A',
  green: '#22C55E',
  red: '#E5484D',
  awsInk: '#232F3E',
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
const TAU = Math.PI * 2

/* drawn textures at TEX_SS x their logical size, crisp on a 4K screen (correction 15) */
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
/** an official mark (svg url) rasterised at `px` on a white rounded tile, so it stays sharp and reads as the white tile */
function markTex(url: string, redraw: () => void, px = 512, tile = true): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const g = c.getContext('2d')!
    if (tile) {
      g.fillStyle = '#FFFFFF'
      const r = px * 0.16
      g.beginPath()
      g.roundRect(0, 0, px, px, r)
      g.fill()
    }
    const pad = tile ? px * 0.14 : 0
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glow = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = (o: THREE.Mesh) => {
  o.castShadow = false
  return o
}

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
  return { hemi, key }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }

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
/** one person: the engine's sprite, frames built at the size it is drawn on this screen (Session 9 rule) */
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames?: number; redraw: () => void }): Sprite {
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames ?? 96,
    height: o.height,
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: CAST_IDLE, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}
/** the walking layer: knees alternate, arms swing, head toward the way the person goes (dir -1 left, +1 right) */
function walkPose(p: Pose, c: number, w: number, dir: number) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  to(p, 'shoulderL', 8 + 10 * stride, w)
  to(p, 'shoulderR', 8 - 10 * stride, w)
  to(p, 'headTurn', 0.45 * dir, w)
  to(p, 'lookX', 0.8 * dir, w)
}
const bob = (walking: number, c: number) => walking * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.035

/* role clothing, rig body frame 400 x 600 */
/** a staff lanyard and photo badge */
const LANYARD = (color: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={color} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={color} opacity={0.55} />
    <rect x={190} y={319} width={14} height={3} rx={1.5} fill={color} opacity={0.4} />
  </g>
)
/** an owner's blazer: lapels and two buttons over the shirt and tie */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
/** a student's backpack straps */
const STRAPS = (color: string) => (
  <g data-part="straps">
    <path d="M 168 210 L 160 330 M 232 210 L 240 330" stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })

/* ================================================================== T02 · the master key */

const L2 = 9
const HOLD2 = 4.5 /* door B open for the master key */
const P2 = {
  backZ: -1.2,
  left: -3.4,
  right: 3.3,
  doors: [-2.35, -0.85, 0.65],
  dw: 0.86,
  dh: 1.95,
  safeX: 2.35,
  safeZ: -0.78,
  standZ: -0.42,
}
/** where the owner stands: right of a door's lock, or in front of the safe */
const atDoor = (i: number) => P2.doors[i] + 0.66
const atSafe = P2.safeX - 0.75
const T2 = {
  safeOpen: [0.25, 0.55] as const,
  keyOut: [0.55, 0.9] as const,
  safeShut: [1.05, 1.4] as const,
  walks: [
    [1.45, 2.1, atSafe, atDoor(2)],
    [3.45, 3.95, atDoor(2), atDoor(1)],
    [5.35, 5.85, atDoor(1), atDoor(0)],
    [7.25, 8.1, atDoor(0), atSafe],
  ] as const,
  /* per door C, B, A: [reach, key turned, open, shut] */
  door: [
    { i: 2, reach: 2.1, turn: [2.25, 2.45] as const, open: [2.45, 2.85] as const, shut: [3.1, 3.45] as const },
    { i: 1, reach: 3.95, turn: [4.1, 4.3] as const, open: [4.3, 4.7] as const, shut: [4.95, 5.3] as const },
    { i: 0, reach: 5.85, turn: [6.0, 6.2] as const, open: [6.2, 6.6] as const, shut: [6.85, 7.2] as const },
  ],
  safe2Open: [8.1, 8.35] as const,
  keyIn: [8.35, 8.6] as const,
  safe2Shut: [8.6, 8.88] as const,
  dial: [[0.0, 0.25], [8.82, 9.0]] as const,
  /* the worker at door A */
  wCard: [0.15, 0.45] as const,
  wOpen: [0.5, 0.85] as const,
  wIn: [0.85, 1.55] as const,
  wShut: [1.45, 1.8] as const,
  wBack: [8.1, 8.95] as const,
}
/** the owner's x at loop time c */
function ownerX(c: number) {
  for (const [a, b, x0, x1] of T2.walks) {
    if (c < a) return x0
    if (c <= b) return lerp(x0, x1, seg(c, a, b))
  }
  return atSafe
}
const ownerWalking = (c: number) => Math.max(...T2.walks.map(([a, b]) => win(c, a + 0.04, b - 0.04, 0.06)))
const ownerDir = (c: number) => {
  for (const [a, b, x0, x1] of T2.walks) if (c >= a - 0.05 && c <= b + 0.05) return Math.sign(x1 - x0)
  return 0
}
/** door angle (swings into the room) for door i at loop time c */
function doorAngle(i: number, c: number) {
  const d = T2.door.find((q) => q.i === i)!
  let a = 1.2 * seg(c, d.open[0], d.open[1]) * (1 - seg(c, d.shut[0], d.shut[1]))
  if (i === 0) a = Math.max(a, 1.2 * seg(c, T2.wOpen[0], T2.wOpen[1]) * (1 - seg(c, T2.wShut[0], T2.wShut[1])))
  return a
}
/** how lit a room is (0..1): up while its door is open */
const roomLit = (i: number, c: number) => Math.min(1, doorAngle(i, c) / 0.6)
/** the safe door angle */
const safeAngle = (c: number) => 1.5 * Math.max(seg(c, T2.safeOpen[0], T2.safeOpen[1]) * (1 - seg(c, T2.safeShut[0], T2.safeShut[1])), seg(c, T2.safe2Open[0], T2.safe2Open[1]) * (1 - seg(c, T2.safe2Shut[0], T2.safe2Shut[1])))
/** where the key is: 'safe' (inside), a door index (in its lock), or hidden (in the owner's pocket) */
function keyAt(c: number): { where: 'safe' | 'lock' | 'hand'; i?: number; turn?: number; vis: number } {
  if (c < T2.keyOut[1]) return { where: 'safe', vis: 1 - seg(c, T2.keyOut[1] - 0.12, T2.keyOut[1]) }
  for (const d of T2.door) if (c >= d.reach && c <= d.shut[0]) return { where: 'lock', i: d.i, turn: seg(c, d.turn[0], d.turn[1]) * (1 - seg(c, d.open[1] + 0.1, d.shut[0])), vis: win(c, d.reach + 0.05, d.shut[0] - 0.05, 0.1) }
  if (c >= T2.keyIn[0]) return { where: 'safe', vis: seg(c, T2.keyIn[0], T2.keyIn[0] + 0.12) }
  return { where: 'hand', vis: 0 }
}
/** the worker: at door A's reader, steps through the door into the office, hidden, then walks back in from the left */
/* right of door A's reader (the reader sits 0.17 right of the frame), so her body never hides it */
const W_AT = P2.doors[0] + P2.dw / 2 + 0.5
const W_OFF = -4.1
function workerPlace(c: number): { x: number; z: number; vis: boolean; walking: number; dir: number } {
  if (c < T2.wIn[0]) return { x: W_AT, z: P2.standZ, vis: true, walking: 0, dir: 0 }
  if (c < T2.wIn[1]) {
    const k = seg(c, T2.wIn[0], T2.wIn[1])
    const x = lerp(W_AT, P2.doors[0] + 0.1, Math.min(1, k * 1.8))
    const z = lerp(P2.standZ, P2.backZ - 1.0, Math.max(0, (k - 0.35) / 0.65))
    return { x, z, vis: z > P2.backZ - 0.9, walking: 1, dir: -1 }
  }
  if (c < T2.wBack[0]) return { x: W_OFF, z: P2.standZ, vis: false, walking: 0, dir: 0 }
  const k = seg(c, T2.wBack[0], T2.wBack[1])
  return { x: lerp(W_OFF, W_AT, k), z: P2.standZ, vis: true, walking: win(c, T2.wBack[0], T2.wBack[1] - 0.05, 0.08), dir: 1 }
}

function frame2(camera: THREE.PerspectiveCamera) {
  camera.fov = 34
  camera.position.set(-0.15, 1.95, 7.35)
  camera.lookAt(-0.15, 1.28, -1.0)
}

function ownerPose(p: Pose, c: number) {
  /* facing the lock while at a door (the lock is screen-left of where the owner stands), the safe on the right */
  const atLock = Math.max(...T2.door.map((d) => win(c, d.reach - 0.1, d.shut[0], 0.15)))
  to(p, 'headTurn', -0.4, atLock)
  to(p, 'lookX', -0.8, atLock)
  const atS = Math.max(win(c, 0, T2.safeShut[1], 0.01), win(c, T2.safe2Open[0] - 0.1, L2, 0.05))
  to(p, 'headTurn', 0.4, atS)
  to(p, 'lookX', 0.8, atS)
  /* the reach: screen-left arm to the lock, screen-right arm to the safe */
  const reachL = Math.max(...T2.door.map((d) => seg(c, d.reach, d.reach + 0.2) * (1 - seg(c, d.open[1], d.open[1] + 0.25))))
  to(p, 'shoulderL', 50, reachL)
  to(p, 'elbowL', 30, reachL)
  const turnL = Math.max(...T2.door.map((d) => seg(c, d.turn[0], d.turn[1]) * (1 - seg(c, d.open[1], d.open[1] + 0.25))))
  to(p, 'wristL', -24, turnL)
  const reachR = Math.max(seg(c, 0, 0.15) * (1 - seg(c, T2.safeShut[0], T2.safeShut[1])), seg(c, T2.safe2Open[0], T2.safe2Open[0] + 0.15))
  to(p, 'shoulderR', 46, reachR)
  to(p, 'elbowR', 34, reachR)
  to(p, 'wristR', 18 * Math.sin(TAU * 3 * mod(c + 0.2, L2) / L2), win(c, 0, 0.25, 0.01))
  to(p, 'headNod', 0.1, Math.max(...T2.door.map((d) => win(c, d.open[0] + 0.1, d.open[1] + 0.2, 0.12))))
  walkPose(p, c, ownerWalking(c), ownerDir(c))
}
function workerPose(p: Pose, c: number) {
  const atR = win(c, 0, T2.wIn[0], 0.01)
  to(p, 'headTurn', -0.4, atR)
  to(p, 'lookX', -0.8, atR)
  const reach = seg(c, T2.wCard[0] - 0.1, T2.wCard[0] + 0.1) * (1 - seg(c, T2.wOpen[0], T2.wOpen[1]))
  to(p, 'shoulderL', 52, reach)
  to(p, 'elbowL', 28, reach)
  const w = workerPlace(c)
  walkPose(p, c, w.walking, w.dir)
  /* coming back in from the left: she is reaching for her card again as she arrives */
  const re = seg(c, T2.wBack[1] - 0.1, L2)
  to(p, 'shoulderL', 52 * 0.5, re)
}

/** one key shape (bow, shaft, bit) in a material */
function makeKey(m: THREE.Material, s = 1) {
  const k = new THREE.Group()
  k.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 24), m, [0, 0, 0.13]))
  k.add(box(0.016, 0.016, 0.11, m, [0, 0, 0.065]))
  k.add(box(0.016, 0.034, 0.02, m, [0, -0.02, 0.025]))
  k.add(box(0.016, 0.026, 0.016, m, [0, -0.016, 0.05]))
  k.scale.setScalar(s)
  return k
}

type DoorSet = { hinge: THREE.Group; lever?: THREE.Group }
/** the corridor/bay back wall with three openings, plus the slab on top */
function backWall(scene: THREE.Scene, wallM: THREE.Material) {
  const wz = P2.backZ
  /* `lap`: the piece over an opening runs 0.04 into its neighbours, a hair behind them, so the seam where two boxes
     meet never opens a hairline onto the background (it showed as a thin vertical line above each door) */
  const part = (a: number, b: number, y0: number, y1: number, lap = 0) => scene.add(flat(box(b - a + 2 * lap, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.06 - (lap ? 0.002 : 0)])))
  let x = P2.left
  for (const dx of P2.doors) {
    part(x, dx - P2.dw / 2, 0, 3.3)
    part(dx - P2.dw / 2, dx + P2.dw / 2, P2.dh, 3.3, 0.04)
    x = dx + P2.dw / 2
  }
  part(x, P2.right, 0, 3.3)
}
/** a room behind opening i (floor, walls, back, a lamp); returns the lamp material */
function room(scene: THREE.Scene, i: number, wall: string, floorC: string, lampC: string) {
  const dx = P2.doors[i]
  const wz = P2.backZ
  const g = new THREE.Group()
  const rw = 1.25
  g.add(flat(box(rw, 0.02, 1.5, mat(floorC, { roughness: 0.75 }), [dx, 0.01, wz - 0.85])))
  g.add(flat(box(rw, 2.4, 0.05, mat(wall, { roughness: 0.9, emissive: new THREE.Color(wall), emissiveIntensity: 0.25 }), [dx, 1.2, wz - 1.6])))
  /* side walls are single planes set back from the corridor wall: as boxes, their edges showed through the corridor
     wall as a thin vertical line (found 2026-11-13 by hiding parts one by one) */
  for (const [sx, face] of [[dx - rw / 2, 1], [dx + rw / 2, -1]] as const) {
    const side = flat(mesh(new THREE.PlaneGeometry(1.25, 2.3), mat(wall, { roughness: 0.9 }), [sx, 1.15, wz - 0.975]))
    side.rotation.y = (face * Math.PI) / 2
    g.add(side)
  }
  const lamp = glow(lampC, '#FFF8EC')
  g.add(flat(box(0.5, 0.04, 0.3, lamp, [dx, 2.25, wz - 0.9])))
  const light = new THREE.PointLight(new THREE.Color(lampC), 0, 3.0, 1.2)
  light.position.set(dx, 1.9, wz - 0.8)
  g.add(light)
  scene.add(g)
  return { lamp, light }
}

/* ------------------------------------------------------------------ T02 everyday: the office corridor */

function setupT02Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E9F0FA')
  frame2(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P2.backZ
  const wallM = mat('#F3EEE6', { roughness: 0.95, emissive: new THREE.Color('#F3EEE6'), emissiveIntensity: 0.35 })
  const trimM = mat('#DCCFBC', { roughness: 0.8 })
  const brass = mat(C.brass, { roughness: 0.3, metalness: 0.7 })

  const fl = flat(mesh(new THREE.PlaneGeometry(P2.right - P2.left, 5), mat('#ffffff', { map: tileTex('#ECE4D6', '#DACDB8', 4, [9, 5]), roughness: 0.8 }), [(P2.left + P2.right) / 2, 0, 1.2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  backWall(scene, wallM)
  scene.add(box(P2.right - P2.left, 0.12, 0.03, trimM, [(P2.left + P2.right) / 2, 0.06, wz + 0.015]))

  /* three rooms: the office (desk, monitor, chair), the control room (a panel of lamps and a wall screen with a chart),
     the records room (filing cabinets) */
  const rooms = [room(scene, 0, '#FBEBD3', '#C9A27A', '#FFC46B'), room(scene, 1, '#E3ECFB', '#B8C4D8', '#9CC2FF'), room(scene, 2, '#EAF3E6', '#BFA88A', '#FFD98A')]
  const [ax, bx, cx] = P2.doors
  /* office */
  scene.add(box(0.8, 0.05, 0.42, mat('#B07A4C', { roughness: 0.6 }), [ax, 0.74, wz - 1.25]))
  for (const lx of [ax - 0.36, ax + 0.36]) scene.add(box(0.04, 0.72, 0.38, mat('#8C5E38'), [lx, 0.37, wz - 1.25]))
  scene.add(box(0.38, 0.26, 0.03, mat('#1F2E63', { roughness: 0.3 }), [ax, 1.0, wz - 1.38]))
  const officeScreen = glow('#7FB0FF', '#2D4A8C')
  scene.add(box(0.34, 0.22, 0.01, officeScreen, [ax, 1.0, wz - 1.36]))
  scene.add(box(0.04, 0.14, 0.04, mat('#3A4256'), [ax, 0.82, wz - 1.38]))
  /* control room: a console with lamps and a wall screen whose bars rise */
  scene.add(box(0.9, 0.85, 0.36, mat('#2E3A55', { roughness: 0.4 }), [bx, 0.43, wz - 1.3], 0.03))
  const panelLeds = Array.from({ length: 8 }, (_, k) => {
    const m = glow(k % 3 === 0 ? C.orange : k % 3 === 1 ? C.green : '#6EA8FF', '#1A2238')
    scene.add(mesh(new THREE.SphereGeometry(0.025, 12, 10), m, [bx - 0.3 + (k % 4) * 0.2, 0.92 - Math.floor(k / 4) * 0.0, wz - 1.18 + Math.floor(k / 4) * 0.08]))
    return m
  })
  scene.add(box(0.86, 0.5, 0.03, mat('#13204A', { roughness: 0.3 }), [bx, 1.55, wz - 1.56]))
  const bars = Array.from({ length: 5 }, (_, k) => {
    const b = box(0.1, 0.3, 0.01, glow('#7FB0FF', '#3A6BE0'), [bx - 0.28 + k * 0.14, 1.4, wz - 1.54])
    scene.add(b)
    return b
  })
  /* records room: two filing cabinets with drawers */
  for (const ox of [-0.3, 0.3]) {
    scene.add(box(0.46, 1.25, 0.42, mat('#9AA7BC', { roughness: 0.45, metalness: 0.3 }), [cx + ox, 0.63, wz - 1.3], 0.02))
    for (let d = 0; d < 4; d++) {
      scene.add(box(0.4, 0.26, 0.02, mat('#B7C3D6', { roughness: 0.4, metalness: 0.3 }), [cx + ox, 0.18 + d * 0.3, wz - 1.08]))
      scene.add(box(0.12, 0.025, 0.03, brass, [cx + ox, 0.24 + d * 0.3, wz - 1.06]))
    }
  }

  /* the doors: frame, leaf on its left hinge, brass lock plate and lever; door A also has a card reader */
  const doors: DoorSet[] = P2.doors.map((dx) => {
    const x0 = dx - P2.dw / 2
    const x1 = dx + P2.dw / 2
    scene.add(box(0.08, P2.dh + 0.06, 0.16, trimM, [x0 - 0.04, (P2.dh + 0.06) / 2, wz + 0.02]))
    scene.add(box(0.08, P2.dh + 0.06, 0.16, trimM, [x1 + 0.04, (P2.dh + 0.06) / 2, wz + 0.02]))
    scene.add(box(P2.dw + 0.16, 0.08, 0.16, trimM, [dx, P2.dh + 0.04, wz + 0.02]))
    const hinge = new THREE.Group()
    hinge.position.set(x0, 0, wz + 0.02)
    const lw = P2.dw - 0.02
    hinge.add(box(lw, P2.dh - 0.02, 0.06, mat('#8A5A3B', { roughness: 0.55 }), [lw / 2 + 0.01, (P2.dh - 0.02) / 2, 0], 0.012))
    for (const py of [0.55, 1.35]) hinge.add(box(lw - 0.24, 0.6, 0.02, mat('#7A4E33', { roughness: 0.6 }), [lw / 2 + 0.01, py, 0.035], 0.01))
    const hx = lw - 0.1
    hinge.add(box(0.07, 0.24, 0.02, brass, [hx, 1.0, 0.04], 0.008))
    hinge.add(box(0.012, 0.03, 0.01, mat('#2A2324'), [hx, 0.94, 0.052]))
    const lever = new THREE.Group()
    lever.position.set(hx, 1.06, 0.06)
    lever.add(box(0.13, 0.025, 0.025, brass, [-0.055, 0, 0.02], 0.01))
    hinge.add(lever)
    scene.add(hinge)
    return { hinge, lever }
  })
  /* door A's card reader on the wall right of its frame */
  const readerX = P2.doors[0] + P2.dw / 2 + 0.17
  scene.add(box(0.1, 0.16, 0.04, mat('#2E3A55', { roughness: 0.4 }), [readerX, 1.12, wz + 0.02], 0.015))
  const readerOk = glow(C.green, '#1E3A2A')
  scene.add(mesh(new THREE.SphereGeometry(0.015, 12, 10), readerOk, [readerX, 1.17, wz + 0.045]))

  /* the wall safe on a stand: a steel box, a hinged door with a big dial and a handle, gold shelf lit inside */
  const sx = P2.safeX
  const sz = P2.safeZ
  const safe = new THREE.Group()
  safe.position.set(sx, 0, sz)
  safe.add(box(0.95, 0.3, 0.7, mat('#5B6478', { roughness: 0.5 }), [0, 0.15, 0]))
  const shell = mat('#7E8AA3', { roughness: 0.35, metalness: 0.6 })
  safe.add(box(0.95, 0.06, 0.7, shell, [0, 0.33, 0]))
  safe.add(box(0.95, 0.06, 0.7, shell, [0, 1.27, 0]))
  safe.add(box(0.06, 0.94, 0.7, shell, [-0.445, 0.8, 0]))
  safe.add(box(0.06, 0.94, 0.7, shell, [0.445, 0.8, 0]))
  safe.add(box(0.95, 0.94, 0.06, shell, [0, 0.8, -0.32]))
  const inner = glow('#FFE2A0', '#FFF6E0')
  safe.add(box(0.8, 0.02, 0.5, inner, [0, 0.68, -0.05]))
  const safeLight = new THREE.PointLight(0xffd88a, 0, 1.2, 1.5)
  safeLight.position.set(0, 0.95, 0.05)
  safe.add(safeLight)
  const sHinge = new THREE.Group()
  sHinge.position.set(-0.47, 0.8, 0.36)
  sHinge.add(box(0.92, 0.9, 0.08, mat('#8F9BB3', { roughness: 0.3, metalness: 0.7 }), [0.46, 0, 0], 0.02))
  const dial = new THREE.Group()
  dial.position.set(0.46, 0.08, 0.06)
  dial.add(cyl(0.12, 0.12, 0.04, mat('#C9D3E6', { metalness: 0.75, roughness: 0.25 }), [0, 0, 0]).rotateX(Math.PI / 2))
  for (let k = 0; k < 12; k++) {
    const tick = box(0.008, 0.03, 0.01, mat('#2A3044'), [Math.sin((k * TAU) / 12) * 0.095, Math.cos((k * TAU) / 12) * 0.095, 0.025])
    tick.rotation.z = -(k * TAU) / 12
    dial.add(tick)
  }
  dial.add(box(0.03, 0.06, 0.02, mat('#2A3044'), [0, 0.06, 0.03]))
  sHinge.add(dial)
  sHinge.add(box(0.05, 0.22, 0.05, mat('#5B6478', { metalness: 0.6 }), [0.78, -0.12, 0.05]))
  safe.add(sHinge)
  scene.add(safe)

  /* the master key: brass, a little larger than life so it reads on a projector, with a soft glint */
  const keyM = mat(C.brass, { roughness: 0.22, metalness: 0.85, emissive: new THREE.Color('#7A5A10'), emissiveIntensity: 0.25 })
  const key = makeKey(keyM, 1.6)
  scene.add(key)
  /* the worker's card at the reader */
  const card = box(0.07, 0.1, 0.008, mat('#2D63FB', { roughness: 0.4 }), [0, 0, 0], 0.01)
  scene.add(card)

  /* people. The owner: an older man in a navy shirt and tie with a blazer drawn on, grey hair; the worker: a young
     woman in a teal blouse with her staff lanyard */
  const oCfg = who(CAST_PRESETS.arjun, { hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirtTie', topColor: '#E8ECF5', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30', accentColor: '#9C2F3A' }, accessories: { glasses: 'rect', watch: true, belt: true }, build: { height: 1.02, shoulders: 1.04 } })
  const wCfg = who(CAST_PRESETS.riya, { hair: { style: 'ponytail', color: 'darkBrown' }, outfit: { top: 'blouse', topColor: '#1E9E8F', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const owner = person({
    config: oCfg,
    dress: withNeck(BLAZER('#26304A', '#161D30')),
    seed: 81,
    faces: [[0, 'thinking'], [0.6, 'neutral'], [2.45, 'proud'], [3.3, 'neutral'], [4.3, 'proud'], [5.1, 'neutral'], [6.2, 'proud'], [7.0, 'neutral'], [8.35, 'listening']],
    pose: ownerPose,
    loop: L2,
    height: 1.74,
    redraw,
  })
  const worker = person({
    config: wCfg,
    dress: withNeck(LANYARD(C.brandDark)),
    seed: 82,
    faces: [[0, 'neutral'], [0.5, 'happy'], [1.6, 'neutral']],
    pose: workerPose,
    loop: L2,
    height: 1.6,
    frames: 72,
    redraw,
  })
  scene.add(owner.object, worker.object)

  return (t) => {
    const c = mod(t, L2)
    doors.forEach((d, i) => {
      d.hinge.rotation.y = -doorAngle(i, c)
      const turned = T2.door.find((q) => q.i === i)!
      d.lever!.rotation.z = 0.45 * seg(c, turned.turn[1], turned.open[0] + 0.1) * (1 - seg(c, turned.shut[1], turned.shut[1] + 0.2))
      const lit = roomLit(i, c)
      rooms[i].lamp.emissiveIntensity = 0.2 + 1.2 * lit
      rooms[i].light.intensity = 2.6 * lit
    })
    officeScreen.emissiveIntensity = 0.3 + 0.9 * roomLit(0, c)
    panelLeds.forEach((m, k) => (m.emissiveIntensity = roomLit(1, c) * (0.6 + 0.8 * Math.max(0, Math.sin((TAU * 6 * c) / L2 + k * 1.1)))))
    bars.forEach((b, k) => {
      const h = 0.12 + 0.3 * roomLit(1, c) * (0.55 + 0.45 * Math.sin((TAU * 3 * c) / L2 + k))
      b.scale.y = h / 0.3
      b.position.y = 1.32 + h / 2
      ;(b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 0.8 * roomLit(1, c)
    })
    /* the safe */
    sHinge.rotation.y = -safeAngle(c)
    /* one whole turn at the start and one at the end: the dial's mark is back where it began when the loop wraps */
    dial.rotation.z = -TAU * (seg(c, T2.dial[0][0], T2.dial[0][1]) + seg(c, T2.dial[1][0], T2.dial[1][1]))
    const open = safeAngle(c) / 1.5
    inner.emissiveIntensity = 0.9 * open
    safeLight.intensity = 1.2 * open
    /* the key */
    const k = keyAt(c)
    key.visible = k.vis > 0.02
    key.scale.setScalar(1.6 * Math.max(0.001, k.vis))
    if (k.where === 'safe') {
      key.position.set(sx, 0.74, sz + 0.05)
      key.rotation.set(-Math.PI / 2, 0, 0.3 + 0.15 * Math.sin((TAU * 2 * c) / L2))
      keyM.emissiveIntensity = 0.35
    } else if (k.where === 'lock') {
      const dx = P2.doors[k.i!]
      const a = doorAngle(k.i!, c)
      const r = P2.dw - 0.11
      key.position.set(dx - P2.dw / 2 + r * Math.cos(a), 0.94, wz + 0.08 + r * Math.sin(a))
      key.rotation.set(0, -a, (Math.PI / 2) * (k.turn ?? 0))
      keyM.emissiveIntensity = 0.25 + 0.25 * Math.max(0, Math.sin(c * 9))
    }
    /* the worker's card and the reader light */
    const cardOn = win(c, T2.wCard[0], T2.wOpen[0] + 0.05, 0.08)
    card.visible = cardOn > 0.02
    card.position.set(readerX - 0.02, 1.12, wz + 0.09 + 0.06 * (1 - cardOn))
    readerOk.emissiveIntensity = 2.2 * win(c, T2.wCard[1] - 0.05, T2.wIn[0] + 0.2, 0.08)

    const ox = ownerX(c)
    owner.object.position.set(ox, bob(ownerWalking(c), c), P2.standZ + 0.02)
    owner.update(c, camera)
    const w = workerPlace(c)
    worker.object.visible = w.vis
    worker.object.position.set(w.x, bob(w.walking, c), w.z)
    worker.update(c, camera)
  }
}

/* ------------------------------------------------------------------ T02 concept: the AWS account */

function setupT02Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E8EEFB')
  frame2(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P2.backZ
  const wallM = mat('#EEF2FA', { roughness: 0.9, emissive: new THREE.Color('#EEF2FA'), emissiveIntensity: 0.4 })
  const steel = mat(C.steel, { roughness: 0.35, metalness: 0.45 })
  const fl = flat(mesh(new THREE.PlaneGeometry(P2.right - P2.left, 5), mat('#ffffff', { map: tileTex('#E3EAF8', '#C9D5EC', 4, [9, 5]), roughness: 0.75 }), [(P2.left + P2.right) / 2, 0, 1.2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  backWall(scene, wallM)
  /* the account boundary: the AWS account group colour as a band along the wall top and the floor edge */
  scene.add(box(P2.right - P2.left, 0.05, 0.04, mat(C.awsInk), [(P2.left + P2.right) / 2, 2.2, wz + 0.02]))
  scene.add(box(P2.right - P2.left, 0.06, 0.03, mat(C.awsInk), [(P2.left + P2.right) / 2, 0.03, wz + 0.02]))

  const bays = [room(scene, 0, '#E3EAFB', '#C9D3E6', '#9CC2FF'), room(scene, 1, '#EAF0FA', '#C9D3E6', '#B9D2FF'), room(scene, 2, '#E6F2E1', '#C9D3E6', '#B6E3A0')]
  const [ax, bx, cx] = P2.doors
  /* bay A: an EC2 server rack, the EC2 mark on its top */
  scene.add(box(0.62, 1.55, 0.42, mat(C.navy, { roughness: 0.45, metalness: 0.25 }), [ax, 0.78, wz - 1.25], 0.02))
  const rackLeds = Array.from({ length: 6 }, (_, k) => {
    scene.add(box(0.5, 0.15, 0.02, mat('#2A3A70', { roughness: 0.4 }), [ax, 0.3 + k * 0.22, wz - 1.03]))
    const m = glow('#6EE7B7', '#14301F')
    scene.add(box(0.06, 0.03, 0.01, m, [ax - 0.18, 0.3 + k * 0.22, wz - 1.02]))
    return m
  })
  const ec2 = markTex(ec2Url, redraw)
  scene.add(flat(mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: ec2, transparent: true, toneMapped: false }), [ax, 1.78, wz - 1.25])))
  /* bay B: the billing console, a card and a bar chart on its screen (drawn, no words) */
  scene.add(box(0.86, 0.8, 0.36, mat('#2E3A55', { roughness: 0.4 }), [bx, 0.4, wz - 1.3], 0.03))
  const billTex = canvasTex(200, 120, (g) => {
    g.fillStyle = '#13204A'
    g.fillRect(0, 0, 200, 120)
    g.fillStyle = '#F2C14E'
    g.beginPath()
    g.roundRect(14, 24, 70, 46, 6)
    g.fill()
    g.fillStyle = '#C79A2E'
    g.fillRect(14, 34, 70, 9)
    g.fillStyle = '#FFFFFF'
    g.fillRect(22, 54, 30, 5)
    const hs = [30, 52, 40, 70, 58]
    hs.forEach((h, i) => {
      g.fillStyle = i === 3 ? '#FF8A3D' : '#7FB0FF'
      g.fillRect(104 + i * 18, 100 - h, 12, h)
    })
    g.fillStyle = '#9FB4DA'
    g.fillRect(100, 101, 92, 2)
  })
  const billM = new THREE.MeshStandardMaterial({ map: billTex, emissive: new THREE.Color('#FFFFFF'), emissiveMap: billTex, emissiveIntensity: 0.2, roughness: 0.4 })
  scene.add(box(0.86, 0.52, 0.03, billM, [bx, 1.5, wz - 1.56]))
  /* bay C: an S3 bucket, the S3 mark on its front */
  const bucketM = mat('#7AA116', { roughness: 0.4 })
  scene.add(cyl(0.34, 0.26, 0.7, bucketM, [cx, 0.36, wz - 1.15], 40))
  scene.add(cyl(0.355, 0.355, 0.05, mat('#5F7F10', { roughness: 0.4 }), [cx, 0.72, wz - 1.15], 40))
  const s3 = markTex(s3Url, redraw)
  const s3Plane = mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: s3, transparent: true, toneMapped: false }), [cx, 1.18, wz - 1.15])
  scene.add(flat(s3Plane))
  const objs = Array.from({ length: 3 }, (_, k) => {
    const m = glow('#FFFFFF', '#E7F2D3')
    const o = box(0.13, 0.17, 0.02, m, [cx - 0.16 + k * 0.16, 0.9, wz - 1.15], 0.015)
    scene.add(o)
    return { o, m }
  })

  /* glass bay doors: frosted leaf on the left hinge, a small padlock plate where a door has its lock */
  const doors: DoorSet[] = P2.doors.map((dx) => {
    const x0 = dx - P2.dw / 2
    for (const fx of [x0 - 0.03, dx + P2.dw / 2 + 0.03]) scene.add(box(0.06, P2.dh + 0.06, 0.12, steel, [fx, (P2.dh + 0.06) / 2, wz + 0.02]))
    scene.add(box(P2.dw + 0.12, 0.06, 0.12, steel, [dx, P2.dh + 0.03, wz + 0.02]))
    const hinge = new THREE.Group()
    hinge.position.set(x0, 0, wz + 0.02)
    const lw = P2.dw - 0.02
    hinge.add(box(lw, P2.dh - 0.02, 0.03, new THREE.MeshStandardMaterial({ color: '#CFE0F7', transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.1, depthWrite: false }), [lw / 2 + 0.01, (P2.dh - 0.02) / 2, 0]))
    hinge.add(box(lw, 0.04, 0.04, steel, [lw / 2 + 0.01, 0.02, 0]))
    hinge.add(box(lw, 0.04, 0.04, steel, [lw / 2 + 0.01, P2.dh - 0.04, 0]))
    hinge.add(box(0.1, 0.18, 0.03, mat('#2E3A55', { roughness: 0.4 }), [lw - 0.1, 1.0, 0.03], 0.015))
    scene.add(hinge)
    return { hinge }
  })
  /* bay A's IAM user card reader (where door A's reader is) */
  const readerX = P2.doors[0] + P2.dw / 2 + 0.17
  scene.add(box(0.1, 0.16, 0.04, mat('#2E3A55', { roughness: 0.4 }), [readerX, 1.12, wz + 0.02], 0.015))
  const readerOk = glow(C.green, '#1E3A2A')
  scene.add(mesh(new THREE.SphereGeometry(0.015, 12, 10), readerOk, [readerX, 1.17, wz + 0.045]))

  /* the MFA vault (where the safe is): a steel vault, the MFA token mark on its door, a seal lamp that turns green */
  const sx = P2.safeX
  const sz = P2.safeZ
  const vault = new THREE.Group()
  vault.position.set(sx, 0, sz)
  vault.add(box(0.95, 0.3, 0.7, mat('#3A4256', { roughness: 0.5 }), [0, 0.15, 0]))
  const shell = mat('#5B6E9A', { roughness: 0.3, metalness: 0.6 })
  vault.add(box(0.95, 0.06, 0.7, shell, [0, 0.33, 0]))
  vault.add(box(0.95, 0.06, 0.7, shell, [0, 1.27, 0]))
  vault.add(box(0.06, 0.94, 0.7, shell, [-0.445, 0.8, 0]))
  vault.add(box(0.06, 0.94, 0.7, shell, [0.445, 0.8, 0]))
  vault.add(box(0.95, 0.94, 0.06, shell, [0, 0.8, -0.32]))
  const inner = glow('#FFE2A0', '#FFF6E0')
  vault.add(box(0.8, 0.02, 0.5, inner, [0, 0.68, -0.05]))
  const vHinge = new THREE.Group()
  vHinge.position.set(-0.47, 0.8, 0.36)
  vHinge.add(box(0.92, 0.9, 0.08, mat('#7C8FB8', { roughness: 0.28, metalness: 0.7 }), [0.46, 0, 0], 0.02))
  const mfa = markTex(mfaUrl, redraw)
  vHinge.add(flat(mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: mfa, transparent: true, toneMapped: false }), [0.46, 0.04, 0.045])))
  const seal = glow(C.green, '#1E3A2A')
  vHinge.add(mesh(new THREE.SphereGeometry(0.03, 14, 12), seal, [0.46, -0.3, 0.05]))
  vault.add(vHinge)
  scene.add(vault)

  /* the root key: gold and lit, larger than the everyday key (the 3D key object of the slide) */
  const keyM = mat(C.gold, { roughness: 0.2, metalness: 0.8, emissive: new THREE.Color('#E0A21E'), emissiveIntensity: 0.5 })
  const key = makeKey(keyM, 1.7)
  scene.add(key)
  /* the IAM user's card: blue, with the IAM mark */
  const iam = markTex(iamUrl, redraw, 256)
  const card = new THREE.Group()
  card.add(box(0.075, 0.105, 0.008, mat('#2D63FB', { roughness: 0.4 }), [0, 0, 0], 0.01))
  card.add(flat(mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ map: iam, transparent: true, toneMapped: false }), [0, 0.012, 0.006])))
  scene.add(card)

  /* people. The admin holding the root key: a woman with a bob, glasses, a navy shirt; the IAM user: a man in a polo
     with his lanyard. Neither is either everyday person */
  const aCfg = who(CAST_PRESETS.ananya, { outfit: { top: 'shirt', topColor: '#1F2E63', bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', earrings: true, watch: true } })
  const uCfg = who(CAST_PRESETS.dev, { hair: { style: 'curly', color: 'black' }, outfit: { top: 'polo', topColor: '#F2A93B', bottom: 'jeans', bottomColor: '#28324E', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', beard: 'stubble' }, build: { height: 1.0, shoulders: 1.0 } })
  const admin = person({
    config: aCfg,
    seed: 83,
    faces: [[0, 'thinking'], [0.6, 'neutral'], [2.45, 'proud'], [3.3, 'neutral'], [4.3, 'proud'], [5.1, 'neutral'], [6.2, 'proud'], [7.0, 'neutral'], [8.35, 'listening']],
    pose: ownerPose,
    loop: L2,
    height: 1.62,
    redraw,
  })
  const user = person({
    config: uCfg,
    dress: withNeck(LANYARD('#1F2E63')),
    seed: 84,
    faces: [[0, 'neutral'], [0.5, 'happy'], [1.6, 'neutral']],
    pose: workerPose,
    loop: L2,
    height: 1.7,
    frames: 72,
    redraw,
  })
  scene.add(admin.object, user.object)

  return (t) => {
    const c = mod(t, L2)
    doors.forEach((d, i) => {
      d.hinge.rotation.y = -doorAngle(i, c)
      const lit = roomLit(i, c)
      bays[i].lamp.emissiveIntensity = 0.2 + 1.2 * lit
      bays[i].light.intensity = 2.6 * lit
    })
    rackLeds.forEach((m, k) => (m.emissiveIntensity = 0.25 + roomLit(0, c) * (0.6 + 0.8 * Math.max(0, Math.sin((TAU * 6 * c) / L2 + k * 1.3)))))
    billM.emissiveIntensity = 0.15 + 0.75 * roomLit(1, c)
    const lc = roomLit(2, c)
    objs.forEach((o, k) => {
      o.o.position.y = 0.88 + lc * (0.12 + 0.04 * Math.sin((TAU * 3 * c) / L2 + k))
      o.m.emissiveIntensity = 0.5 * lc
    })
    vHinge.rotation.y = -safeAngle(c)
    const open = safeAngle(c) / 1.5
    inner.emissiveIntensity = 0.9 * open
    /* the MFA seal: green while the vault is shut (sealed), dark while it is open */
    seal.emissiveIntensity = 1.8 * (1 - Math.min(1, open * 3))
    const k = keyAt(c)
    key.visible = k.vis > 0.02
    key.scale.setScalar(1.7 * Math.max(0.001, k.vis))
    if (k.where === 'safe') {
      key.position.set(sx, 0.74, sz + 0.05)
      key.rotation.set(-Math.PI / 2, 0, 0.3)
    } else if (k.where === 'lock') {
      const dx = P2.doors[k.i!]
      const a = doorAngle(k.i!, c)
      const r = P2.dw - 0.11
      key.position.set(dx - P2.dw / 2 + r * Math.cos(a), 1.0, wz + 0.1 + r * Math.sin(a))
      key.rotation.set(0, -a, (Math.PI / 2) * (k.turn ?? 0))
    }
    keyM.emissiveIntensity = 0.45 + 0.25 * Math.max(0, Math.sin(c * 6))
    const cardOn = win(c, T2.wCard[0], T2.wOpen[0] + 0.05, 0.08)
    card.visible = cardOn > 0.02
    card.position.set(readerX - 0.02, 1.12, wz + 0.09 + 0.06 * (1 - cardOn))
    readerOk.emissiveIntensity = 2.2 * win(c, T2.wCard[1] - 0.05, T2.wIn[0] + 0.2, 0.08)

    admin.object.position.set(ownerX(c), bob(ownerWalking(c), c), P2.standZ + 0.02)
    admin.update(c, camera)
    const w = workerPlace(c)
    user.object.visible = w.vis
    user.object.position.set(w.x, bob(w.walking, c), w.z)
    user.update(c, camera)
  }
}

/* ================================================================== T06 · the exam hall */

const L6 = 8.7
const HOLD6 = 2.55 /* student A matched: the tick shown, the invigilator gesturing her in */
const P6 = {
  backZ: -1.2,
  left: -3.6,
  right: 3.4,
  doorX: 0.15,
  doorW: 1.0,
  doorH: 2.05,
  check: 0.15,
  queue: -1.05,
  standZ: 0.25,
  tableX: 1.0,
  invX: 1.78,
  invZ: -0.25,
  off: -4.2,
}
const T6 = {
  aIn: [0.0, 1.0] as const,
  aCards: [1.0, 1.35] as const,
  aCheck: [1.35, 2.35] as const,
  aOk: [2.35, 2.95] as const,
  aBack: [2.75, 3.0] as const,
  aGo: [2.95, 4.15] as const,
  bIn: [0.8, 1.75] as const,
  bStep: [4.0, 4.55] as const,
  bCards: [4.55, 4.9] as const,
  bCheck: [4.9, 6.0] as const,
  bNo: [6.0, 6.6] as const,
  bBack: [6.35, 6.6] as const,
  bShrug: [6.55, 7.15] as const,
  bOut: [7.2, 8.65] as const,
}
/** student A: in from the left, checked, then through the door into the hall and away to the right, out of sight */
function aPlace(c: number) {
  if (c < T6.aIn[1]) return { x: lerp(P6.off, P6.check, seg(c, T6.aIn[0], T6.aIn[1])), z: P6.standZ, vis: c > 0.02, walking: win(c, 0, T6.aIn[1] - 0.05, 0.06), dir: 1 }
  if (c < T6.aGo[0]) return { x: P6.check, z: P6.standZ, vis: true, walking: 0, dir: 0 }
  if (c < T6.aGo[1]) {
    const k = (c - T6.aGo[0]) / (T6.aGo[1] - T6.aGo[0])
    const z = lerp(P6.standZ, P6.backZ - 0.6, sm(Math.min(1, k / 0.65)))
    const x = lerp(P6.check, P6.check + 1.4, sm(Math.max(0, (k - 0.6) / 0.4)))
    return { x, z, vis: true, walking: 1, dir: k > 0.6 ? 1 : 0 }
  }
  return { x: P6.check + 1.4, z: P6.backZ - 0.6, vis: false, walking: 0, dir: 0 }
}
/** student B: in from the left to the queue spot, steps up, checked, shrugs and walks back off to the left */
function bPlace(c: number) {
  if (c < T6.bIn[0]) return { x: P6.off, z: P6.standZ, vis: false, walking: 0, dir: 0 }
  if (c < T6.bIn[1]) return { x: lerp(P6.off, P6.queue, seg(c, T6.bIn[0], T6.bIn[1])), z: P6.standZ, vis: true, walking: win(c, T6.bIn[0], T6.bIn[1] - 0.05, 0.06), dir: 1 }
  if (c < T6.bStep[0]) return { x: P6.queue, z: P6.standZ, vis: true, walking: 0, dir: 0 }
  if (c < T6.bStep[1]) return { x: lerp(P6.queue, P6.check, seg(c, T6.bStep[0], T6.bStep[1])), z: P6.standZ, vis: true, walking: win(c, T6.bStep[0], T6.bStep[1] - 0.05, 0.06), dir: 1 }
  if (c < T6.bOut[0]) return { x: P6.check, z: P6.standZ, vis: true, walking: 0, dir: 0 }
  const x = lerp(P6.check, P6.off, seg(c, T6.bOut[0], T6.bOut[1]))
  return { x, z: P6.standZ, vis: x > P6.off + 0.15, walking: win(c, T6.bOut[0], T6.bOut[1], 0.06), dir: -1 }
}
/** the two cards on the table: slide in from the student side, lie there, slide back */
const cardsOn = (c: number) => Math.max(win(c, T6.aCards[0], T6.aBack[1], 0.25), win(c, T6.bCards[0], T6.bBack[1], 0.25))
const tickOn = (c: number) => win(c, T6.aOk[0], T6.aOk[1] + 0.1, 0.15)
const crossOn = (c: number) => win(c, T6.bNo[0], T6.bNo[1] + 0.1, 0.15)

function frame6(camera: THREE.PerspectiveCamera) {
  camera.fov = 34
  camera.position.set(0.0, 1.9, 6.6)
  camera.lookAt(0.0, 1.22, -1.0)
}

function studentPose(which: 'a' | 'b') {
  return (p: Pose, c: number) => {
    const pl = which === 'a' ? aPlace(c) : bPlace(c)
    const cards = which === 'a' ? T6.aCards : T6.bCards
    const back = which === 'a' ? T6.aBack : T6.bBack
    /* faces the invigilator (screen-right) while at the table */
    const atT = which === 'a' ? win(c, T6.aCards[0] - 0.1, T6.aGo[0], 0.15) : win(c, T6.bCards[0] - 0.1, T6.bOut[0], 0.15)
    to(p, 'headTurn', 0.35, atT)
    to(p, 'lookX', 0.75, atT)
    /* the screen-right arm lays the cards on the table, and takes them back */
    const lay = Math.max(win(c, cards[0], cards[1], 0.12), win(c, back[0], back[1], 0.12))
    to(p, 'shoulderR', 48, lay)
    to(p, 'elbowR', 30, lay)
    if (which === 'b') {
      const sh = win(c, T6.bShrug[0] + 0.05, T6.bShrug[1] - 0.05, 0.12)
      to(p, 'shoulderL', 26, sh)
      to(p, 'elbowL', 92, sh)
      to(p, 'palmL', 1, sh)
      to(p, 'shoulderR', 26, sh)
      to(p, 'elbowR', 92, sh)
      to(p, 'palmR', 1, sh)
      to(p, 'headTilt', 7, sh)
    }
    walkPose(p, c, pl.walking, pl.dir)
  }
}
function invigilatorPose(p: Pose, c: number) {
  /* she looks down at the cards, up at the face, down again: twice per student */
  const cmp = (a: number, b: number) => {
    const k = (c - a) / (b - a)
    if (k < 0 || k > 1) return { down: 0, face: 0 }
    const ph = Math.sin(k * Math.PI * 2)
    return { down: Math.max(0, ph), face: Math.max(0, -ph) }
  }
  const A = cmp(T6.aCheck[0], T6.aCheck[1])
  const B = cmp(T6.bCheck[0], T6.bCheck[1])
  const down = Math.max(A.down, B.down)
  const face = Math.max(A.face, B.face)
  to(p, 'headNod', 0.35, down)
  to(p, 'lookY', 0.8, down)
  to(p, 'headTurn', -0.25 - 0.2 * face, Math.max(down, face, win(c, T6.aCards[0], T6.bBack[1], 0.2)))
  to(p, 'lookX', -0.85, face)
  /* the yes: a nod and the screen-left arm sweeps toward the door */
  const yes = win(c, T6.aOk[0], T6.aOk[1], 0.15)
  to(p, 'headNod', 0.15 * Math.sin((c - T6.aOk[0]) * 12), yes)
  to(p, 'shoulderL', 64, yes)
  to(p, 'elbowL', 12, yes)
  to(p, 'palmL', 1, yes)
  /* the no: a head shake, then the screen-left palm up (stop) */
  const shake = win(c, T6.bCheck[1] - 0.45, T6.bNo[0] + 0.2, 0.1)
  to(p, 'headTurn', -0.3 + 0.18 * Math.sin((c - T6.bCheck[1]) * 18), shake)
  const stop = win(c, T6.bNo[0], T6.bNo[1], 0.15)
  to(p, 'shoulderL', 40, stop)
  to(p, 'elbowL', 110, stop)
  to(p, 'palmL', 1, stop)
}

/** a glossy tick or cross status mark over the table */
function statusMark(kind: 'tick' | 'cross') {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: kind === 'tick' ? C.green : C.red, emissive: new THREE.Color(kind === 'tick' ? C.green : C.red), emissiveIntensity: 0.5, roughness: 0.3, transparent: true, opacity: 1 })
  g.add(mesh(new THREE.CircleGeometry(0.17, 40), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4, transparent: true }), [0, 0, -0.005]))
  if (kind === 'tick') {
    const a = box(0.06, 0.13, 0.03, m, [-0.04, -0.02, 0])
    a.rotation.z = 0.75
    const b = box(0.06, 0.24, 0.03, m, [0.045, 0.02, 0])
    b.rotation.z = -0.62
    g.add(a, b)
  } else {
    const a = box(0.055, 0.24, 0.03, m, [0, 0, 0])
    a.rotation.z = 0.785
    const b = box(0.055, 0.24, 0.03, m, [0, 0, 0])
    b.rotation.z = -0.785
    g.add(a, b)
  }
  return g
}

/** the back wall with the hall doorway (or gateway), and the room behind it */
function hallShell(scene: THREE.Scene, wallM: THREE.Material, inside: { wall: string; floor: THREE.Material; lamp: string }) {
  const wz = P6.backZ
  const d0 = P6.doorX - P6.doorW / 2
  const d1 = P6.doorX + P6.doorW / 2
  /* the piece over the doorway laps into its neighbours, a hair behind them (no hairline seam above the door) */
  const part = (a: number, b: number, y0: number, y1: number, lap = 0) => scene.add(flat(box(b - a + 2 * lap, y1 - y0, 0.14, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.07 - (lap ? 0.002 : 0)])))
  part(P6.left, d0, 0, 3.4)
  part(d1, P6.right, 0, 3.4)
  part(d0, d1, P6.doorH, 3.4, 0.04)
  const g = new THREE.Group()
  const fl = flat(mesh(new THREE.PlaneGeometry(6, 2.85), inside.floor, [P6.doorX + 1.2, 0.005, wz - 1.6]))
  fl.rotation.x = -Math.PI / 2
  g.add(fl)
  g.add(flat(box(6, 3.2, 0.06, mat(inside.wall, { roughness: 0.9, emissive: new THREE.Color(inside.wall), emissiveIntensity: 0.3 }), [P6.doorX + 1.2, 1.6, wz - 3.05])))
  /* a single plane, set back from the front wall (a box edge here showed through the wall as a thin line) */
  const side = flat(mesh(new THREE.PlaneGeometry(2.6, 3.2), mat(inside.wall, { roughness: 0.9 }), [P6.doorX - 1.3, 1.6, wz - 1.75]))
  side.rotation.y = Math.PI / 2
  g.add(side)
  const lamp = glow(inside.lamp, '#FFFFFF')
  g.add(flat(box(1.2, 0.04, 0.2, lamp, [P6.doorX + 0.4, 2.9, wz - 1.6])))
  const pl = new THREE.PointLight(new THREE.Color(inside.lamp), 2.2, 5, 1.4)
  pl.position.set(P6.doorX + 0.4, 2.6, wz - 1.6)
  g.add(pl)
  scene.add(g)
  return { lamp }
}

/* ------------------------------------------------------------------ T06 everyday: the exam hall entrance */

function setupT06Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF0F8')
  frame6(camera)
  lights(scene, [0, 1.4, -0.4])
  const wz = P6.backZ
  const wallM = mat('#F1EADF', { roughness: 0.95, emissive: new THREE.Color('#F1EADF'), emissiveIntensity: 0.35 })
  const trimM = mat('#D8CAB4', { roughness: 0.8 })
  const fl = flat(mesh(new THREE.PlaneGeometry(P6.right - P6.left, 5), mat('#ffffff', { map: tileTex('#E9E1D3', '#D6C9B3', 4, [9, 5]), roughness: 0.85 }), [(P6.left + P6.right) / 2, 0, 1.2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  hallShell(scene, wallM, { wall: '#F6F1E6', floor: mat('#ffffff', { map: tileTex('#EFE6D6', '#DCCFB9', 3, [6, 4]), roughness: 0.85 }), lamp: '#FFF1D2' })
  /* the door frame and two open leaves pushed back into the hall */
  const d0 = P6.doorX - P6.doorW / 2
  const d1 = P6.doorX + P6.doorW / 2
  scene.add(box(0.09, P6.doorH + 0.06, 0.2, trimM, [d0 - 0.045, (P6.doorH + 0.06) / 2, wz]))
  scene.add(box(0.09, P6.doorH + 0.06, 0.2, trimM, [d1 + 0.045, (P6.doorH + 0.06) / 2, wz]))
  scene.add(box(P6.doorW + 0.18, 0.09, 0.2, trimM, [P6.doorX, P6.doorH + 0.045, wz]))
  for (const [hx, dir] of [[d0, 1], [d1, -1]] as const) {
    const leaf = box(P6.doorW / 2 - 0.02, P6.doorH - 0.04, 0.05, mat('#8A5A3B', { roughness: 0.55 }), [0, 0, 0], 0.01)
    leaf.position.set(hx + dir * 0.03, (P6.doorH - 0.04) / 2, wz - 0.07 - (P6.doorW / 4))
    leaf.rotation.y = dir * Math.PI / 2
    scene.add(leaf)
  }
  /* inside the hall: rows of desks with question papers, a wall clock and a board */
  const deskM = mat('#C79A68', { roughness: 0.6 })
  const legM = mat('#6B4A2E')
  const paperM = mat('#FFFFFF', { roughness: 0.6 })
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 4; k++) {
      const x = P6.doorX - 0.7 + k * 0.85
      const z = wz - 1.15 - r * 0.95
      scene.add(box(0.62, 0.04, 0.38, deskM, [x, 0.72, z]))
      for (const lx of [-0.27, 0.27]) scene.add(box(0.035, 0.7, 0.035, legM, [x + lx, 0.35, z]))
      scene.add(box(0.2, 0.004, 0.27, paperM, [x - 0.08, 0.745, z]))
      scene.add(box(0.36, 0.42, 0.04, mat('#5E7BB8', { roughness: 0.6 }), [x, 0.66, z + 0.32]))
    }
  scene.add(box(1.5, 0.75, 0.03, mat('#2F4A3A', { roughness: 0.8 }), [P6.doorX + 0.5, 1.75, wz - 3.0]))
  const clock = new THREE.Group()
  clock.position.set(P6.doorX - 0.25, 2.5, wz - 3.0)
  clock.add(cyl(0.18, 0.18, 0.03, mat('#FFFFFF'), [0, 0, 0]).rotateX(Math.PI / 2))
  clock.add(mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 32), mat('#2A3044'), [0, 0, 0.01]))
  const hand = new THREE.Group()
  hand.position.set(0, 0, 0.025)
  hand.add(box(0.012, 0.13, 0.006, mat('#E5484D'), [0, 0.055, 0]))
  clock.add(hand)
  clock.add(box(0.016, 0.09, 0.006, mat('#2A3044'), [0.03, 0.03, 0.02]).rotateZ(-0.7))
  scene.add(clock)
  /* a notice board beside the door, plain sheets pinned */
  scene.add(box(0.7, 0.55, 0.03, mat('#B88A5A', { roughness: 0.8 }), [-1.8, 1.55, wz + 0.02]))
  for (let k = 0; k < 3; k++) scene.add(box(0.16, 0.22, 0.005, mat('#FFFFFF'), [-2.0 + k * 0.2, 1.57 + (k % 2) * 0.04, wz + 0.04]))

  /* the invigilator's table and the two cards on it */
  const tx = P6.tableX
  scene.add(box(0.72, 0.05, 0.5, mat('#B07A4C', { roughness: 0.55 }), [tx, 0.76, -0.05], 0.01))
  for (const lx of [-0.32, 0.32]) for (const lz of [-0.2, 0.15]) scene.add(box(0.04, 0.74, 0.04, mat('#7A5234'), [tx + lx, 0.37, -0.05 + lz]))
  scene.add(box(0.26, 0.012, 0.34, mat('#F5F2EA'), [tx + 0.18, 0.79, -0.12]))
  scene.add(box(0.03, 0.03, 0.18, mat('#2D63FB'), [tx + 0.24, 0.8, -0.1]).rotateY(0.4))
  const ticketTex = canvasTex(80, 110, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 80, 110)
    g.strokeStyle = '#2D63FB'
    g.lineWidth = 3
    g.strokeRect(2, 2, 76, 106)
    g.fillStyle = '#DCE6FF'
    g.fillRect(10, 12, 26, 32)
    g.fillStyle = '#F4A077'
    g.beginPath()
    g.arc(23, 25, 7, 0, TAU)
    g.fill()
    g.fillStyle = '#9FB0CF'
    for (let i = 0; i < 6; i++) g.fillRect(10, 54 + i * 8, i % 2 ? 44 : 58, 3)
    g.fillStyle = '#2D63FB'
    g.fillRect(44, 14, 26, 4)
    g.fillRect(44, 24, 20, 4)
  })
  const idTex = canvasTex(110, 70, (g) => {
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.roundRect(0, 0, 110, 70, 8)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.fillRect(8, 10, 30, 38)
    g.fillStyle = '#F4A077'
    g.beginPath()
    g.arc(23, 25, 8, 0, TAU)
    g.fill()
    g.fillStyle = '#CFDDFF'
    for (let i = 0; i < 4; i++) g.fillRect(46, 14 + i * 9, i % 2 ? 40 : 54, 4)
  })
  const ticket = mesh(new THREE.PlaneGeometry(0.16, 0.22), new THREE.MeshStandardMaterial({ map: ticketTex, roughness: 0.6 }))
  ticket.rotation.x = -Math.PI / 2
  const idc = mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ map: idTex, roughness: 0.5 }))
  idc.rotation.x = -Math.PI / 2
  scene.add(ticket, idc)
  const tick = statusMark('tick')
  const cross = statusMark('cross')
  scene.add(tick, cross)

  /* people. The invigilator: a woman in a maroon kurta with glasses and her staff lanyard; student A: a girl in a
     yellow t-shirt with a backpack; student B: a boy in a green hoodie */
  const iCfg = who(CAST_PRESETS.meera, { hair: { style: 'bun', color: 'black' }, outfit: { top: 'kurta', topColor: '#8A2F4B', bottom: 'salwar', bottomColor: '#EFE4D2', shoeColor: '#5A3A2A' }, accessories: { glasses: 'round', earrings: true, bindi: true, watch: true } })
  const aCfg = who(CAST_PRESETS.riya, { hair: { style: 'braid', color: 'black' }, outfit: { top: 'tshirt', topColor: '#FCC82B', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 0.96, shoulders: 0.95 } })
  const bCfg = who(CAST_PRESETS.kabir, { hair: { style: 'short', color: 'darkBrown' }, outfit: { top: 'hoodie', topColor: '#2F8F5B', bottom: 'jeans', bottomColor: '#28324E', shoeColor: '#2A2A30' }, build: { height: 0.98, shoulders: 0.97 } })
  const inv = person({
    config: iCfg,
    dress: withNeck(LANYARD(C.brandDark)),
    seed: 91,
    faces: [[0, 'neutral'], [1.35, 'thinking'], [2.35, 'happy'], [3.1, 'neutral'], [4.9, 'thinking'], [5.5, 'skeptical'], [6.0, 'confused'], [6.7, 'neutral']],
    pose: invigilatorPose,
    loop: L6,
    height: 1.62,
    redraw,
  })
  const sa = person({
    config: aCfg,
    dress: withNeck(STRAPS('#2D4A8C')),
    seed: 92,
    faces: [[0, 'neutral'], [1.3, 'listening'], [2.4, 'happy'], [3.4, 'neutral']],
    pose: studentPose('a'),
    loop: L6,
    height: 1.5,
    frames: 72,
    redraw,
  })
  const sb = person({
    config: bCfg,
    dress: withNeck(STRAPS('#7A2F2F')),
    seed: 93,
    faces: [[0, 'neutral'], [4.8, 'listening'], [5.6, 'worried'], [6.5, 'sad'], [7.4, 'neutral']],
    pose: studentPose('b'),
    loop: L6,
    height: 1.56,
    frames: 72,
    redraw,
  })
  inv.object.position.set(P6.invX, 0, P6.invZ)
  scene.add(inv.object, sa.object, sb.object)

  return (t) => {
    const c = mod(t, L6)
    /* the cards: slide in from the student's side of the table, lie side by side, slide back */
    const on = cardsOn(c)
    const slide = 1 - on
    ticket.visible = idc.visible = on > 0.02
    ticket.position.set(P6.tableX - 0.12 - 0.3 * slide, 0.79 + 0.002, 0.02)
    idc.position.set(P6.tableX + 0.06 - 0.3 * slide, 0.792, 0.05)
    const tk = tickOn(c)
    tick.visible = tk > 0.02
    tick.scale.setScalar(Math.max(0.001, tk))
    tick.position.set(P6.tableX - 0.04, 1.25 + 0.04 * Math.sin(c * 5), 0.0)
    const cr = crossOn(c)
    cross.visible = cr > 0.02
    cross.scale.setScalar(Math.max(0.001, cr))
    cross.position.set(P6.tableX - 0.04, 1.25, 0.0)
    hand.rotation.z = -(TAU * c) / L6
    const a = aPlace(c)
    sa.object.visible = a.vis
    sa.object.position.set(a.x, bob(a.walking, c), a.z)
    sa.update(c, camera)
    const b = bPlace(c)
    sb.object.visible = b.vis
    sb.object.position.set(b.x, bob(b.walking, c), b.z)
    sb.update(c, camera)
    inv.update(c, camera)
  }
}

/* ------------------------------------------------------------------ T06 concept: the authentication gate */

function setupT06Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E8EEFB')
  frame6(camera)
  lights(scene, [0, 1.4, -0.4])
  const wz = P6.backZ
  const wallM = mat('#EDF2FB', { roughness: 0.9, emissive: new THREE.Color('#EDF2FB'), emissiveIntensity: 0.4 })
  const steel = mat(C.steel, { roughness: 0.3, metalness: 0.5 })
  const fl = flat(mesh(new THREE.PlaneGeometry(P6.right - P6.left, 5), mat('#ffffff', { map: tileTex('#E3EAF8', '#C9D5EC', 4, [9, 5]), roughness: 0.75 }), [(P6.left + P6.right) / 2, 0, 1.2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  hallShell(scene, wallM, { wall: '#DCE7FF', floor: mat('#ffffff', { map: tileTex('#DCE6FA', '#BFD0F0', 3, [6, 4]), roughness: 0.7 }), lamp: '#CFE0FF' })
  /* inside the cloud room: protected resources as official marks on lit plinths (S3, EC2, IAM) */
  const marks = [s3Url, ec2Url, iamUrl].map((u, k) => {
    /* on the far wall, inside the strip of it the doorway shows above a caller's head (y 1.4 - 2.1 from this camera) */
    const x = P6.doorX - 0.34 + k * 0.34
    const tex = markTex(u, redraw)
    const pl = mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }), [x, 1.66, wz - 2.98])
    scene.add(flat(pl))
    return pl
  })
  /* the gateway frame with a status strip, and two glass flaps across it */
  const d0 = P6.doorX - P6.doorW / 2
  const d1 = P6.doorX + P6.doorW / 2
  for (const fx of [d0 - 0.05, d1 + 0.05]) scene.add(box(0.1, P6.doorH + 0.06, 0.24, steel, [fx, (P6.doorH + 0.06) / 2, wz]))
  scene.add(box(P6.doorW + 0.2, 0.1, 0.24, steel, [P6.doorX, P6.doorH + 0.05, wz]))
  const strip = glow(C.green, '#1F2E63')
  scene.add(box(P6.doorW - 0.1, 0.05, 0.02, strip, [P6.doorX, P6.doorH - 0.08, wz + 0.13]))
  const flapM = new THREE.MeshStandardMaterial({ color: '#BFD6FF', transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1, depthWrite: false })
  /* waist-high posts and flaps, so the people's heads and shoulders stay clear above them */
  for (const px of [d0 + 0.06, d1 - 0.06]) scene.add(box(0.12, 0.95, 0.42, mat('#2E3A55', { roughness: 0.4 }), [px, 0.475, wz + 0.15], 0.03))
  const flaps = [d0 + 0.12, d1 - 0.12].map((hx, k) => {
    const g = new THREE.Group()
    g.position.set(hx, 0.6, wz + 0.15)
    const dir = k === 0 ? 1 : -1
    g.add(box(0.37, 0.5, 0.025, flapM, [dir * 0.185, 0, 0], 0.02))
    scene.add(g)
    return { g, dir }
  })
  /* the scanner kiosk (where the table is) with a tall screen (where the invigilator stands) */
  const tx = P6.tableX
  scene.add(box(0.5, 0.95, 0.42, mat('#2E3A55', { roughness: 0.4 }), [tx, 0.475, -0.05], 0.04))
  scene.add(box(0.42, 0.04, 0.34, mat('#3E4C6E', { roughness: 0.3 }), [tx, 0.97, -0.05], 0.01))
  const pad = glow('#7FB0FF', '#1F2E63')
  scene.add(box(0.28, 0.012, 0.2, pad, [tx, 0.995, -0.03]))
  scene.add(box(0.12, 1.1, 0.12, mat('#2E3A55'), [P6.invX, 0.55, P6.invZ - 0.1]))
  scene.add(box(0.7, 0.62, 0.06, mat('#1F2E63', { roughness: 0.3 }), [P6.invX, 1.45, P6.invZ - 0.1], 0.03))
  /* the screen: a face outline and a key, matched (green ring) or not (red ring) */
  const screenTex = (ring: string) =>
    canvasTex(140, 120, (g) => {
      g.fillStyle = '#13204A'
      g.fillRect(0, 0, 140, 120)
      g.strokeStyle = ring
      g.lineWidth = 6
      g.beginPath()
      g.arc(46, 54, 30, 0, TAU)
      g.stroke()
      g.fillStyle = '#CFDDFF'
      g.beginPath()
      g.arc(46, 46, 10, 0, TAU)
      g.fill()
      g.beginPath()
      g.ellipse(46, 72, 17, 10, 0, Math.PI, 0)
      g.fill()
      g.fillStyle = '#F2C14E'
      g.beginPath()
      g.arc(100, 44, 10, 0, TAU)
      g.fill()
      g.fillRect(97, 50, 6, 30)
      g.fillRect(103, 66, 9, 5)
      g.fillRect(103, 75, 7, 5)
    })
  const idle = screenTex('#5B7BC4')
  const ok = screenTex(C.green)
  const no = screenTex(C.red)
  const scrM = new THREE.MeshStandardMaterial({ map: idle, emissive: new THREE.Color('#FFFFFF'), emissiveMap: idle, emissiveIntensity: 0.55, roughness: 0.4 })
  scene.add(box(0.62, 0.53, 0.01, scrM, [P6.invX, 1.45, P6.invZ - 0.065]))
  /* the credential card on the pad: the long-term credential mark on a white card */
  const cred = markTex(credUrl, redraw, 256)
  const cardG = new THREE.Group()
  cardG.add(box(0.2, 0.012, 0.13, mat('#FFFFFF', { roughness: 0.4 }), [0, 0, 0], 0.01))
  const cp = mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ map: cred, transparent: true, toneMapped: false }), [-0.04, 0.008, 0])
  cp.rotation.x = -Math.PI / 2
  cardG.add(cp)
  scene.add(cardG)
  const tick = statusMark('tick')
  const cross = statusMark('cross')
  scene.add(tick, cross)

  /* people: caller A, a woman in a blue blouse with a laptop bag strap; caller B, a man in a grey hoodie with a beard */
  const aCfg = who(CAST_PRESETS.ananya, { hair: { style: 'long', color: 'darkBrown' }, outfit: { top: 'blouse', topColor: '#3D6FE0', bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', earrings: true } })
  const bCfg = who(CAST_PRESETS.rohan, { outfit: { top: 'hoodie', topColor: '#6B7385', bottom: 'jeans', bottomColor: '#2C3550', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', beard: 'short' } })
  const ca = person({
    config: aCfg,
    dress: withNeck(STRAPS('#3A2E28')),
    seed: 94,
    faces: [[0, 'neutral'], [1.3, 'listening'], [2.4, 'happy'], [3.4, 'neutral']],
    pose: studentPose('a'),
    loop: L6,
    height: 1.6,
    frames: 72,
    redraw,
  })
  const cb = person({
    config: bCfg,
    seed: 95,
    faces: [[0, 'neutral'], [4.8, 'listening'], [5.6, 'worried'], [6.5, 'confused'], [7.4, 'neutral']],
    pose: studentPose('b'),
    loop: L6,
    height: 1.72,
    frames: 72,
    redraw,
  })
  scene.add(ca.object, cb.object)

  return (t) => {
    const c = mod(t, L6)
    const on = cardsOn(c)
    cardG.visible = on > 0.02
    cardG.position.set(P6.tableX - 0.3 * (1 - on), 1.01, -0.03)
    /* the scan: the pad pulses while a card is on it; the screen rings green for A, red for B */
    const scanning = Math.max(win(c, T6.aCheck[0], T6.aCheck[1], 0.1), win(c, T6.bCheck[0], T6.bCheck[1], 0.1))
    pad.emissiveIntensity = 0.3 + 1.2 * scanning * (0.5 + 0.5 * Math.sin(c * 14))
    const tk = tickOn(c)
    const cr = crossOn(c)
    const tex = tk > 0.3 ? ok : cr > 0.3 ? no : idle
    if (scrM.map !== tex) {
      scrM.map = tex
      scrM.emissiveMap = tex
      scrM.needsUpdate = true
    }
    tick.visible = tk > 0.02
    tick.scale.setScalar(Math.max(0.001, tk))
    tick.position.set(P6.tableX - 0.04, 1.32 + 0.04 * Math.sin(c * 5), 0.0)
    cross.visible = cr > 0.02
    cross.scale.setScalar(Math.max(0.001, cr))
    cross.position.set(P6.tableX - 0.04, 1.32, 0.0)
    /* the flaps swing open into the room for A only, and close behind her */
    const openF = seg(c, T6.aOk[0], T6.aOk[0] + 0.35) * (1 - seg(c, T6.aGo[1] - 0.35, T6.aGo[1]))
    flaps.forEach((f) => (f.g.rotation.y = f.dir * openF * 1.35))
    strip.emissive.set(cr > 0.1 ? C.red : C.green)
    strip.emissiveIntensity = 0.4 + 1.4 * Math.max(tk, cr, openF)
    marks.forEach((m, k) => (m.position.y = 1.66 + 0.03 * Math.sin((TAU * 2 * c) / L6 + k * 2)))
    const a = aPlace(c)
    ca.object.visible = a.vis
    ca.object.position.set(a.x, bob(a.walking, c), a.z)
    ca.update(c, camera)
    const b = bPlace(c)
    cb.object.visible = b.vis
    cb.object.position.set(b.x, bob(b.walking, c), b.z)
    cb.update(c, camera)
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
/* all four cards the same canvas size, so the shared renderer never resizes between them (Session 10 lesson) */
const Stage = ({ step, setup, hold }: { step: number; setup: (k: StageKit) => Update; hold: number }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={hold} />
  </div>
)
const T02Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT02Everyday} hold={HOLD2} />
const T02Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT02Concept} hold={HOLD2} />
const T06Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT06Everyday} hold={HOLD6} />
const T06Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT06Concept} hold={HOLD6} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T02Everyday: T02Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T02Concept: T02Concept as (p: Record<string, unknown>) => ReactNode,
  H_T06Everyday: T06Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T06Concept: T06Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
