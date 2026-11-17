import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import bucketUrl from '../images/res-s3-bucket.svg'

/**
 * BUILDER I · SESSION 16 (Cloud Threats & Attacks) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built to the Session 9-13 review rules from the first draft (generate-slides standing corrections 13-17, cloud course
 * R10-R14, deck-engine "Low-end PCs"): a perspective camera and a real place; people are Character Lab characters from
 * the engine's `castSprite` (role clothing by `dress`, frames at the size they are drawn on this screen by `adaptive`),
 * each an individual with expressions keyed to the action; NO TEXT on either card; one wall-clock loop per slide shared
 * by both cards beat for beat and place for place, each loop ending in the state it starts in (a short reset, never a
 * rest beat); held frames (`?still`, thumbnails) draw the key moment at HOLD. Nobody walks toward or away from the
 * camera (a rig has no back view): people step sideways, props move.
 *
 * SLIDE 32 · T17-AN (TR 17): "A shop hands its most trusted employee the stockroom's master key; that employee can either
 * steal stock deliberately or accidentally leave the shutter open overnight: just as an insider threat comes from someone
 * whose legitimate access is misused, on purpose or by mistake."
 *
 *   place (x)      everyday: a shop's back room                  concept: a cloud account
 *   -1.05          the owner, his counter and ledger at left     the admin, her console desk at left
 *   -0.3           the employee's place                          the insider's place
 *    0.2           the key switch on the stockroom jamb          the badge reader on the data room jamb
 *    0.73          the stockroom behind a roller shutter         the data room (S3 bucket, files) behind a shutter
 *    1.78          the back door, open onto the dark lane        the account's exit, open onto the outside
 *
 *   0.0 - 1.2      the owner hands his master key over           the admin hands the access badge over
 *   1.2 - 3.1      key in the switch: the shutter rolls up       badge on the reader: the data room opens
 *   3.1 - 5.75     MALICIOUS: a box off the shelf, a sly look    MALICIOUS: a file is copied off the shelf, a sly
 *                  at the owner (busy with his ledger), out of   look at the admin (busy at her console), out of the
 *                  the back door                                 account's exit
 *   5.5 - 8.55     ACCIDENTAL: evening falls, he yawns, pulls    ACCIDENTAL: lights go down, he yawns, takes the
 *                  the key and hands it back WITHOUT shutting:   badge and hands it back WITHOUT closing: the data
 *                  the stockroom stays open and lit all night    room stays open, the bucket glowing, all night
 *   8.55 - 9.0     morning: the shutter comes down               the shutter comes down
 *
 * SLIDE 40 · T21-AN (TR 21): "An employee receives an official task from a manager, but a hidden message inside a
 * document tells them to ignore the manager's instructions and share confidential files. Following that hidden message
 * is like prompt injection."
 *
 *   place (x)      everyday: an office                           concept: an AI chat assistant
 *   -1.05          the manager, his desk at left                 the user at her laptop, a standing desk at left
 *   -0.3 / 0.0     the employee                                  the assistant (a chat screen and its AI core)
 *    0.9           the filing cabinet of confidential files      the data store of confidential files
 *    1.55          a stranger waiting in the doorway             an outsider waiting at the exit
 *
 *   0.1 - 1.1      the manager hands over a task folder          the task message and a document reach the chat
 *   1.1 - 2.8      a glowing slip rises out of the folder; she   one line of the document glows; the assistant reads
 *                  reads it and turns away from the manager      it and its core turns from the user to the exit
 *   2.8 - 5.8      the drawer opens, the confidential files go   the store opens, confidential files stream out to
 *                  to the stranger; the manager sees, shocked    the outsider; the expected answer never comes back
 *   5.8 - 8.0      the drawer shut, the folder handed back       the store shut, the chat clears
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
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#22304F',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  brass: '#D4A24A',
  green: '#22C55E',
  red: '#E5484D',
  white: '#FFFFFF',
  steel: '#B7C3D6',
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
/** horizontal ribs of a roller shutter */
const shutterTex = (base: string, rib: string, hi: string) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      for (let y = 0; y < 128; y += 16) {
        g.fillStyle = rib
        g.fillRect(0, y + 11, 128, 5)
        g.fillStyle = hi
        g.fillRect(0, y + 2, 128, 3)
      }
    },
    [1, 7],
  )
/** a padlock glyph (an icon, not a word) */
function lockGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = s * 0.16
  g.beginPath()
  g.arc(cx, cy - s * 0.1, s * 0.26, Math.PI, 0)
  g.stroke()
  g.beginPath()
  g.roundRect(cx - s * 0.38, cy - s * 0.1, s * 0.76, s * 0.6, s * 0.1)
  g.fill()
}
/** a document page with grey lines; `hot` lights one line in orange (the hidden instruction, drawn, never words) */
function docTex(hot: boolean, w = 120, h = 150) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(2, 2, w - 4, h - 4, 10)
    g.fill()
    g.strokeStyle = '#C9D5EC'
    g.lineWidth = 2
    g.stroke()
    const rows = [0.8, 0.95, 0.7, 0.9, 0.85, 0.6, 0.9]
    rows.forEach((k, i) => {
      const y = 22 + i * 17
      const hotRow = hot && i === 4
      g.fillStyle = hotRow ? C.orange : '#C3CCDD'
      g.beginPath()
      g.roundRect(14, y, (w - 28) * k, hotRow ? 9 : 7, 4)
      g.fill()
    })
  })
}

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
/** a soft additive halo (a radial glow) */
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

/** lights that the loop can dim for night: hemisphere, a key with soft shadows, a rim */
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

/** one key (bow, shaft, bit) */
function makeKey(m: THREE.Material, s = 1) {
  const k = new THREE.Group()
  k.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 24), m, [0, 0.13, 0]))
  k.add(box(0.016, 0.11, 0.016, m, [0, 0.065, 0]))
  k.add(box(0.034, 0.02, 0.016, m, [0.02, 0.025, 0]))
  k.add(box(0.026, 0.016, 0.016, m, [0.016, 0.05, 0]))
  k.scale.setScalar(s)
  return k
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
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
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT?: number }): Sprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes */
  const quiet = (c: number) => o.holdT !== undefined && Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 40,
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing, rig body frame 400 x 600 */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
  </g>
)
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
const LANYARD = (color: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={color} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={color} opacity={0.55} />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
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
/** move a point toward the camera along its view ray, so a prop sits in front of the sprite and projects onto the hand */
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the loop time of the frame a sprite of F frames is showing at c (props follow the drawn frame, not the clock) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)

/** the walking layer: knees alternate, the free arm swings, head toward the way the person goes */
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

/** a place on a path of [time, x] keys (eased between keys); returns x and how much the person is walking */
function along(c: number, keys: [number, number, number][]): { x: number; walking: number; dir: number } {
  /* keys: [t0, t1, xTo]; before the first, at the last key's x (the loop wraps) */
  let x = keys[keys.length - 1][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (c <= b) {
      const k = seg(c, a, b)
      const walking = hold(c, a, a + 0.08, b - 0.08, b)
      return { x: lerp(x, xt, k), walking, dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}

/* ------------------------------------------------------------------ shared camera */

function frameCam(camera: THREE.PerspectiveCamera) {
  camera.fov = 43
  camera.position.set(0.12, 1.42, 3.55)
  camera.lookAt(0.12, 1.04, -0.6)
  camera.updateProjectionMatrix()
}

/* ================================================================== T17 · the trusted employee and the stockroom key */

const L17 = 9
const HOLD17 = 4.3 /* the box held at his chest, the sly look back at the owner, the shutter up */
const F17 = 108
const P17 = {
  wallZ: -1.0,
  left: -3.2,
  right: 3.6,
  owner: new THREE.Vector3(-1.2, 0, -0.42),
  e0: -0.14, // the employee's place beside the owner
  e1: 1.27, // between the stockroom and the back door: the switch, the stock and the door all in reach
  ez: -0.45,
  open: { x0: -0.02, x1: 0.84, h: 1.72 },
  sw: new THREE.Vector3(0.95, 1.04, -0.93),
  door: { x0: 1.64, x1: 2.22, h: 1.9 },
  hO: 1.72,
  hE: 1.66,
}
const T17 = {
  oReach: [0.1, 0.45] as const,
  eReach: [0.22, 0.5] as const,
  give: [0.55, 0.85] as const,
  armsDown: [0.85, 1.15] as const,
  walks: [
    [1.0, 1.75, P17.e1],
    [6.62, 7.32, P17.e0],
  ] as [number, number, number][],
  insert: [1.75, 2.0, 2.1, 2.3] as const, // reach, key at switch, turned, arm down by 2.5
  shutterUp: [2.3, 3.1] as const,
  take: [3.4, 3.7, 4.0] as const, // reach into the stock, box off the shelf, at his chest
  sly: [4.0, 4.2, 4.5, 4.7] as const,
  out: [4.65, 5.05, 5.3] as const, // push, box at the door, gone
  dusk: [5.5, 6.4] as const,
  yawn: [5.85, 6.0, 6.3, 6.5] as const,
  pull: [6.2, 6.4, 6.6] as const, // reach, key out, arm down
  back: [7.32, 7.57, 7.77, 8.02] as const, // reach, key moves, owner has it, arms down
  dawn: [8.55, 9.0] as const,
}
/** night amount 0..1 */
const night17 = (c: number) => seg(c, T17.dusk[0], T17.dusk[1]) * (1 - seg(c, T17.dawn[0], T17.dawn[1]))
/** shutter open amount 0..1 */
const shutter17 = (c: number) => seg(c, T17.shutterUp[0], T17.shutterUp[1]) * (1 - seg(c, T17.dawn[0], T17.dawn[1] - 0.05))
const eAt17 = (c: number) => along(c, [[0, 0, P17.e0], ...T17.walks])

/* the arms of both people, as functions of loop time (the pose and the props read the same numbers) */
function ownerArmR17(c: number): Arm {
  const give = hold(c, T17.oReach[0], T17.oReach[1], T17.armsDown[0], T17.armsDown[1])
  const take = hold(c, T17.back[0], T17.back[1], T17.back[2], T17.back[3])
  const k = Math.max(give, take)
  return { s: lerp(10, 62, k), e: lerp(14, 26, k) }
}
function empArmL17(c: number): Arm {
  const rec = hold(c, T17.eReach[0], T17.eReach[1], T17.armsDown[0], T17.armsDown[1])
  const ins = hold(c, T17.insert[0], T17.insert[1], T17.insert[3], T17.insert[3] + 0.2)
  const pull = hold(c, T17.pull[0] - 0.1, T17.pull[0] + 0.12, T17.pull[1], T17.pull[2])
  const back = hold(c, T17.back[0], T17.back[1], T17.back[2], T17.back[3])
  const reachIn = hold(c, T17.take[0] - 0.15, T17.take[0] + 0.1, T17.take[1], T17.take[2])
  const carry = hold(c, T17.take[1], T17.take[2], T17.out[0], T17.out[0] + 0.15)
  const w = eAt17(c).walking
  let a: Arm = { s: 8 + swing(c, w), e: 8 }
  const mixA = (b: Arm, k: number) => {
    a = { s: lerp(a.s, b.s, k), e: lerp(a.e, b.e, k) }
  }
  mixA({ s: 60, e: 22 }, rec)
  mixA({ s: 72, e: 30 }, Math.max(ins, pull))
  mixA({ s: 62, e: 24 }, back)
  mixA({ s: 64, e: 18 }, reachIn)
  mixA({ s: 26, e: 82 }, carry)
  return a
}
function empArmR17(c: number): Arm {
  const carry = hold(c, T17.take[1] + 0.05, T17.take[2], T17.out[0], T17.out[0] + 0.1)
  const push = hold(c, T17.out[0], T17.out[0] + 0.2, T17.out[1], T17.out[2])
  const w = eAt17(c).walking
  let a: Arm = { s: 8 - swing(c, w), e: 8 }
  a = { s: lerp(a.s, 26, carry), e: lerp(a.e, 82, carry) }
  a = { s: lerp(a.s, 70, push), e: lerp(a.e, 12, push) }
  return a
}

/** where the key / badge is: 0 owner's right hand, 1 the employee's left hand, 2 the switch / reader */
function keyHolder17(c: number): { from: 0 | 1 | 2; to: 0 | 1 | 2; k: number } {
  if (c < T17.give[0]) return { from: 0, to: 0, k: 0 }
  if (c < T17.give[1]) return { from: 0, to: 1, k: seg(c, T17.give[0], T17.give[1]) }
  if (c < T17.insert[0] + 0.15) return { from: 1, to: 1, k: 0 }
  if (c < T17.insert[1]) return { from: 1, to: 2, k: seg(c, T17.insert[0] + 0.15, T17.insert[1]) }
  if (c < T17.pull[0] + 0.12) return { from: 2, to: 2, k: 0 }
  if (c < T17.pull[1]) return { from: 2, to: 1, k: seg(c, T17.pull[0] + 0.12, T17.pull[1]) }
  if (c < T17.back[1]) return { from: 1, to: 1, k: 0 }
  if (c < T17.back[2]) return { from: 1, to: 0, k: seg(c, T17.back[1], T17.back[2]) }
  return { from: 0, to: 0, k: 0 }
}

function ownerPose17(p: Pose, c: number) {
  const r = ownerArmR17(c)
  p.shoulderR = r.s
  p.elbowR = r.e
  p.shoulderL = 10
  p.elbowL = 16
  /* facing the employee while handing over; busy with the ledger at his left while the stock goes out */
  const toE = Math.max(hold(c, 0, 0.05, 1.2, 1.5), hold(c, T17.back[0] - 0.4, T17.back[0] - 0.1, L17, L17 + 1))
  to(p, 'headTurn', 0.35, toE)
  to(p, 'lookX', 0.8, toE)
  const ledger = hold(c, 1.6, 2.0, 6.6, 7.0)
  to(p, 'headTurn', -0.45, ledger)
  to(p, 'lookX', -0.9, ledger)
  to(p, 'headNod', 0.35, ledger)
  to(p, 'lookY', 0.8, ledger)
  to(p, 'bow', 0.12, ledger)
  /* a pen in the ledger: his left hand to the counter */
  to(p, 'shoulderL', 34, ledger)
  to(p, 'elbowL', 58, ledger)
}
function empPose17(p: Pose, c: number) {
  const l = empArmL17(c)
  const r = empArmR17(c)
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
  const at = eAt17(c)
  walkLegs(p, c, at.walking, at.dir)
  /* looks: at the owner for the key, at the switch, at the stock, the SLY look back at the owner, at the door */
  const toO = Math.max(hold(c, 0, 0.05, 1.0, 1.15), hold(c, 7.1, 7.3, L17, L17 + 1))
  to(p, 'headTurn', -0.4, toO)
  to(p, 'lookX', -0.85, toO)
  const toSw = Math.max(hold(c, 1.7, 1.85, 2.3, 2.5), hold(c, 6.1, 6.25, 6.55, 6.7))
  to(p, 'headTurn', -0.35, toSw)
  to(p, 'lookX', -0.8, toSw)
  const toStock = hold(c, 3.3, 3.45, 3.85, 4.0)
  to(p, 'headTurn', -0.3, toStock)
  to(p, 'lookX', -0.7, toStock)
  const sly = hold(c, T17.sly[0], T17.sly[1], T17.sly[2], T17.sly[3])
  to(p, 'headTurn', -0.8, sly)
  to(p, 'lookX', -1, sly)
  to(p, 'headNod', 0.12, sly)
  to(p, 'squint', 0.45, sly)
  to(p, 'mouthX', 0.45, sly)
  const toDoor = hold(c, 4.6, 4.75, 5.1, 5.3)
  to(p, 'headTurn', 0.45, toDoor)
  to(p, 'lookX', 0.9, toDoor)
  /* the yawn: a hand would hide the face, so the head tips back and the mouth opens */
  const yawn = hold(c, T17.yawn[0], T17.yawn[1], T17.yawn[2], T17.yawn[3])
  to(p, 'mouthOpen', 0.85, yawn)
  to(p, 'headTilt', -6, yawn)
  to(p, 'headNod', -0.18, yawn)
  to(p, 'squint', 0.8, yawn)
}

/* the employee's frames: proud with the key, focused at the switch, sly with the box, tired at dusk, careless after */
const EMP17_FACES: [number, string][] = [
  [0, 'listening'],
  [0.6, 'proud'],
  [1.7, 'thinking'],
  [3.3, 'neutral'],
  [3.85, 'grin'],
  [5.2, 'neutral'],
  [5.75, 'bored'],
  [6.9, 'happy'],
  [8.6, 'listening'],
]
const OWNER17_FACES: [number, string][] = [
  [0, 'happy'],
  [1.5, 'thinking'],
  [7.1, 'happy'],
]

type KeyCarrier = { owner: Sprite; emp: Sprite; shO: number; shE: number }
/** the prop in a hand, placed at the hand of the frame the sprite is showing */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.08)
}

/** the shared back room of T17: wall with the opening and the back door, floor, the window, the counter/desk */
function backRoom17(scene: THREE.Scene, o: { wall: string; floor: [string, string]; trim: string; frame: string; inner: string; innerFloor: string; outside: string }) {
  const wz = P17.wallZ
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.32 })
  const fl = flat(mesh(new THREE.PlaneGeometry(P17.right - P17.left, 6), mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 4, [9, 6]), roughness: 0.8 }), [(P17.left + P17.right) / 2, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a + 0.08, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.06])))
  const { x0, x1, h } = P17.open
  const D = P17.door
  part(P17.left, x0, 0, 3.2)
  part(x0, x1, h, 3.2)
  part(x1, D.x0, 0, 3.2)
  part(D.x0, D.x1, D.h, 3.2)
  part(D.x1, P17.right, 0, 3.2)
  const trimM = mat(o.trim, { roughness: 0.7 })
  scene.add(box(P17.right - P17.left, 0.1, 0.03, trimM, [(P17.left + P17.right) / 2, 0.05, wz + 0.015]))
  /* door and opening frames */
  const frameM = mat(o.frame, { roughness: 0.5, metalness: 0.2 })
  for (const [a, b, hh] of [[x0, x1, h], [D.x0, D.x1, D.h]] as const) {
    scene.add(box(0.06, hh, 0.16, frameM, [a - 0.03, hh / 2, wz + 0.02]))
    scene.add(box(0.06, hh, 0.16, frameM, [b + 0.03, hh / 2, wz + 0.02]))
    scene.add(box(b - a + 0.12, 0.06, 0.16, frameM, [(a + b) / 2, hh + 0.03, wz + 0.02]))
  }
  /* the room behind the opening */
  const innerM = mat(o.inner, { roughness: 0.9, emissive: new THREE.Color(o.inner), emissiveIntensity: 0.2 })
  const cx = (x0 + x1) / 2
  scene.add(flat(box(x1 - x0 + 0.4, 0.02, 1.0, mat(o.innerFloor, { roughness: 0.8 }), [cx, 0.01, wz - 0.55])))
  scene.add(flat(box(x1 - x0 + 0.4, h + 0.3, 0.05, innerM, [cx, (h + 0.3) / 2, wz - 1.05])))
  for (const sx of [x0 - 0.2, x1 + 0.2]) scene.add(flat(box(0.05, h + 0.3, 1.05, innerM, [sx, (h + 0.3) / 2, wz - 0.53])))
  /* the outside beyond the back door */
  const outM = new THREE.MeshBasicMaterial({ color: o.outside, toneMapped: false })
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(D.x1 - D.x0 + 0.4, D.h + 0.4), outM)
  outside.position.set((D.x0 + D.x1) / 2, D.h / 2, wz - 0.7)
  scene.add(outside)
  scene.add(flat(box(D.x1 - D.x0 + 0.2, 0.02, 0.7, mat('#5B6170', { roughness: 0.9 }), [(D.x0 + D.x1) / 2, 0.005, wz - 0.35])))
  /* the open door leaf, swung against the inside of the wall */
  const leaf = box(0.62, D.h - 0.04, 0.04, mat(o.frame, { roughness: 0.55 }), [0, 0, 0])
  leaf.position.set(D.x1 + 0.02, D.h / 2, wz - 0.3)
  leaf.rotation.y = -1.35
  scene.add(leaf)
  /* the window, left of the employee: its sky goes day -> dusk -> night */
  const skyM = new THREE.MeshBasicMaterial({ color: '#BFE3FF', toneMapped: false })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.62), skyM)
  sky.position.set(-0.55, 1.95, wz + 0.005)
  scene.add(sky)
  const winFrame = mat('#FFFFFF', { roughness: 0.4 })
  scene.add(box(0.8, 0.05, 0.05, winFrame, [-0.55, 2.28, wz + 0.02]), box(0.8, 0.05, 0.05, winFrame, [-0.55, 1.62, wz + 0.02]))
  scene.add(box(0.05, 0.7, 0.05, winFrame, [-0.93, 1.95, wz + 0.02]), box(0.05, 0.7, 0.05, winFrame, [-0.17, 1.95, wz + 0.02]), box(0.03, 0.62, 0.03, winFrame, [-0.55, 1.95, wz + 0.02]))
  const moonM = new THREE.MeshBasicMaterial({ color: '#FFF6D8', transparent: true, opacity: 0, toneMapped: false })
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.07, 28), moonM)
  moon.position.set(-0.36, 2.1, wz + 0.008)
  scene.add(moon)
  return { wallM, innerM, skyM, moonM, outM }
}

/** the roller shutter: ribbed slats that slide up behind the wall into a housing */
function shutter(scene: THREE.Scene, base: string, rib: string, hi: string, housing: string) {
  const { x0, x1, h } = P17.open
  const cx = (x0 + x1) / 2
  const sm0 = mat('#ffffff', { map: shutterTex(base, rib, hi), roughness: 0.45, metalness: 0.35 })
  const g = new THREE.Group()
  const plate = mesh(new THREE.BoxGeometry(x1 - x0 + 0.02, h, 0.02), sm0, [0, h / 2, 0])
  g.add(plate)
  g.add(box(x1 - x0 + 0.02, 0.05, 0.05, mat('#5E6B86', { metalness: 0.6, roughness: 0.3 }), [0, 0.025, 0.01]))
  g.position.set(cx, 0, P17.wallZ - 0.13)
  scene.add(g)
  scene.add(box(x1 - x0 + 0.16, 0.2, 0.22, mat(housing, { roughness: 0.4, metalness: 0.3 }), [cx, h + 0.16, P17.wallZ + 0.06], 0.02))
  return g
}

/* ------------------------------------------------------------------ T17 everyday: the shop's back room */

function setupT17Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  const bgDay = new THREE.Color('#F4EFE6')
  const bgNight = new THREE.Color('#2A3350')
  scene.background = bgDay.clone()
  frameCam(camera)
  const L = lights(scene, [0.2, 1.0, -0.5])
  const room = backRoom17(scene, { wall: '#F5E9D6', floor: ['#E9DFCF', '#DCCFBA'], trim: '#C9A27A', frame: '#8C6440', inner: '#E8D6B8', innerFloor: '#C9A983', outside: '#5D6C8C' })

  /* the stockroom: two shelves of cartons and a lamp */
  const { x0, x1 } = P17.open
  const cx = (x0 + x1) / 2
  const wood = mat('#B98A5C', { roughness: 0.7 })
  const sz = P17.wallZ - 0.85
  for (const y of [0.42, 0.95, 1.45]) scene.add(box(x1 - x0 + 0.3, 0.04, 0.34, wood, [cx, y, sz]))
  for (const sx of [x0 - 0.12, x1 + 0.12]) scene.add(box(0.04, 1.5, 0.34, wood, [sx, 0.75, sz]))
  const cartonM = mat('#C9965E', { roughness: 0.85 })
  const tapeM = mat('#E7C48F', { roughness: 0.6 })
  const cartons: THREE.Object3D[] = []
  const carton = (w: number, hh: number, pos: THREE.Vector3Tuple) => {
    const g = new THREE.Group()
    g.add(box(w, hh, 0.26, cartonM, [0, 0, 0], 0.01))
    g.add(box(w + 0.004, 0.025, 0.262, tapeM, [0, hh / 2 - 0.05, 0]))
    g.position.set(...pos)
    scene.add(g)
    cartons.push(g)
    return g
  }
  ;[[0.42, 0.2], [0.95, 0.2], [1.45, 0.18]].forEach(([y, hh]) => {
    let x = x0 - 0.04
    let n = 0
    while (x < x1 - 0.1) {
      const w = 0.2 + ((n * 7) % 3) * 0.03
      carton(w, hh, [x + w / 2, y + 0.02 + hh / 2, sz + 0.02])
      x += w + 0.05
      n++
    }
  })
  /* the carton he takes: the middle shelf's second one */
  const midShelf = cartons.filter((g) => Math.abs(g.position.y - 1.07) < 0.06)
  const taken = midShelf.reduce((a, g) => (g.position.x > a.position.x ? g : a), midShelf[0])
  const takenHome = taken.position.clone()
  const stockLamp = glowM('#FFD98A', '#FFF8EC')
  scene.add(flat(box(0.5, 0.04, 0.2, stockLamp, [cx, P17.open.h + 0.1, P17.wallZ - 0.6])))
  const stockLight = new THREE.PointLight(0xffd98a, 0, 3.2, 1.2)
  stockLight.position.set(cx, 1.6, P17.wallZ - 0.5)
  scene.add(stockLight)

  const sh = shutter(scene, '#C7CED9', '#8F99AA', '#E8EDF4', '#7D8798')

  /* the key switch on the left jamb: a brass plate with a lock cylinder and a lamp */
  const swG = new THREE.Group()
  swG.position.copy(P17.sw)
  swG.add(box(0.11, 0.17, 0.04, mat('#3E4656', { roughness: 0.4, metalness: 0.4 }), [0, 0, 0], 0.012))
  swG.add(cyl(0.025, 0.025, 0.03, mat(C.brass, { metalness: 0.8, roughness: 0.3 }), [0, -0.02, 0.025]).rotateX(Math.PI / 2))
  const swLamp = glowM(C.green, '#9AA4B5')
  swG.add(cyl(0.014, 0.014, 0.02, swLamp, [0, 0.05, 0.025]).rotateX(Math.PI / 2))
  scene.add(swG)

  /* the counter and the owner's ledger, at the left */
  const counterTop = mat('#E8D9BF', { roughness: 0.55 })
  scene.add(box(0.7, 0.86, 0.5, wood, [-1.78, 0.43, -0.74], 0.01))
  scene.add(box(0.76, 0.05, 0.56, counterTop, [-1.78, 0.885, -0.74], 0.015))
  scene.add(box(0.3, 0.025, 0.22, mat('#2F4BA8', { roughness: 0.6 }), [-1.62, 0.92, -0.7], 0.005))
  scene.add(box(0.27, 0.01, 0.2, mat('#F5F1E6', { roughness: 0.9 }), [-1.62, 0.937, -0.7]))
  /* a hanging lamp over the counter, lit at night */
  const hang = glowM('#FFD27A', '#FFF4DA')
  scene.add(cyl(0.004, 0.004, 0.6, mat('#333'), [-1.1, 2.62, -0.5], 6))
  scene.add(cyl(0.06, 0.2, 0.14, mat('#2F3A52', { roughness: 0.5 }), [-1.1, 2.28, -0.5]))
  scene.add(flat(cyl(0.12, 0.12, 0.02, hang, [-1.1, 2.21, -0.5])))
  const nightLight = new THREE.PointLight(0xffd27a, 0, 4.5, 1.1)
  nightLight.position.set(-0.6, 2.1, 0.2)
  scene.add(nightLight)

  /* the master key: brass, larger than life so it reads on a projector */
  const keyM = mat(C.brass, { roughness: 0.22, metalness: 0.85, emissive: new THREE.Color('#7A5A10'), emissiveIntensity: 0.3 })
  const key = makeKey(keyM, 1.25)
  scene.add(key)
  /* the carried carton follows his hands */
  const carried = new THREE.Group()
  carried.add(box(0.26, 0.2, 0.22, cartonM, [0, 0, 0], 0.01), box(0.264, 0.025, 0.222, tapeM, [0, 0.05, 0]))
  carried.visible = false
  scene.add(carried)

  /* people: the owner, an older man in a white kurta with grey hair and glasses; the employee, a young man in a polo
     with the shop's apron */
  const oCfg = who(CAST_PRESETS.rohan, { name: 'Shop Owner', skinTone: 'wheatish', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'kurta', topColor: '#F1ECE0', bottom: 'trousers', bottomColor: '#5A5560', shoeColor: '#4A3426' }, accessories: { beard: 'short', glasses: 'rect', watch: true }, build: { height: 1.02, shoulders: 1.04 } })
  const eCfg = who(CAST_PRESETS.dev, { name: 'Employee', skinTone: 'medium', hair: { style: 'quiff', color: 'black' }, outfit: { top: 'polo', topColor: '#3A7BD5', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', watch: false } })
  const owner = person({ config: oCfg, seed: 171, faces: OWNER17_FACES, pose: ownerPose17, loop: L17, height: P17.hO, frames: F17, redraw, holdT: devHold(HOLD17) })
  const emp = person({ config: eCfg, dress: withTop(APRON('#2F7A55', '#1E5A3D')), seed: 172, faces: EMP17_FACES, pose: empPose17, loop: L17, height: P17.hE, frames: F17, redraw, holdT: devHold(HOLD17) })
  scene.add(owner.object, emp.object)
  const shO = buildSkin(oCfg).shoulderHalf
  const shE = buildSkin(eCfg).shoulderHalf

  const eRoot = new THREE.Vector3()
  const hO = new THREE.Vector3()
  const hE = new THREE.Vector3()
  const hER = new THREE.Vector3()
  const swP = new THREE.Vector3(P17.sw.x, P17.sw.y - 0.02, P17.sw.z + 0.08)
  const doorP = new THREE.Vector3((P17.door.x0 + P17.door.x1) / 2, 0.95, P17.wallZ + 0.16)
  const doorOut = new THREE.Vector3((P17.door.x0 + P17.door.x1) / 2, 0.95, P17.wallZ - 0.62)
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L17)
    const cq = frameT(c, L17, F17)
    const at = eAt17(c)
    eRoot.set(at.x, bob(at.walking, c), P17.ez)
    emp.object.position.copy(eRoot)
    owner.object.position.copy(P17.owner)
    owner.update(c, camera)
    emp.update(c, camera)
    const atq = eAt17(cq)
    const eRootQ = tmp.set(atq.x, bob(atq.walking, cq), P17.ez).clone()

    /* night: sky, background, lights */
    const n = night17(c)
    const dusk = hold(c, T17.dusk[0], T17.dusk[0] + 0.45, T17.dusk[1] - 0.1, T17.dusk[1] + 0.2)
    room.skyM.color.set('#BFE3FF').lerp(new THREE.Color('#F6A96B'), dusk * (1 - n * 0.6)).lerp(new THREE.Color('#1C2A55'), n)
    room.moonM.opacity = seg(n, 0.6, 1)
    room.outM.color.set('#8FA3C4').lerp(new THREE.Color('#141B30'), n)
    ;(scene.background as THREE.Color).copy(bgDay).lerp(bgNight, n)
    L.hemi.intensity = lerp(0.95, 0.42, n)
    L.key.intensity = lerp(2.0, 0.35, n)
    room.wallM.emissiveIntensity = lerp(0.32, 0.06, n)
    hang.emissiveIntensity = 1.6 * n
    nightLight.intensity = 2.2 * n

    /* the shutter and the stockroom light */
    const op = shutter17(c)
    sh.position.y = op * (P17.open.h + 0.02)
    const lit = seg(c, T17.shutterUp[0] + 0.1, T17.shutterUp[0] + 0.6) * (1 - seg(c, T17.dawn[0], T17.dawn[1]))
    stockLamp.emissiveIntensity = 1.4 * lit
    stockLight.intensity = (1.6 + 2.0 * n) * lit
    room.innerM.emissiveIntensity = 0.2 + 0.35 * lit * n
    /* the switch lamp: green while the stockroom is unlocked */
    swLamp.emissiveIntensity = 2.0 * seg(c, T17.insert[2], T17.insert[2] + 0.1) * (1 - seg(c, T17.dawn[0], T17.dawn[0] + 0.15))

    /* the key: in a hand, or turned in the switch */
    const kh = keyHolder17(c)
    const posOf = (w: 0 | 1 | 2, out: THREE.Vector3) => {
      if (w === 0) return handWorld('R', shO, ownerArmR17(cq), P17.hO, P17.owner, camera, out)
      if (w === 1) return handWorld('L', shE, empArmL17(cq), P17.hE, eRootQ, camera, out)
      return out.copy(swP)
    }
    posOf(kh.from, hO)
    posOf(kh.to, hE)
    key.position.lerpVectors(hO, hE, kh.k)
    key.position.y += Math.sin(kh.k * Math.PI) * 0.05
    const inSw = kh.from === 2 && kh.to === 2 ? 1 : 0
    const turn = inSw * seg(c, T17.insert[1], T17.insert[2])
    key.quaternion.copy(camera.quaternion)
    key.rotateZ(Math.PI + (inSw ? Math.PI / 2 - turn * (Math.PI / 2) : 0.35))
    keyM.emissiveIntensity = 0.3 + 0.25 * Math.max(0, Math.sin(c * 6))

    /* the carton: on its shelf, in his hands, out of the door, gone; back on its shelf behind the closed shutter */
    const onShelf = c < T17.take[1] || c > T17.dawn[1] - 0.12
    taken.visible = onShelf
    if (c >= T17.take[1] && c < T17.out[2]) {
      carried.visible = true
      const chest = rigToWorld({ x: 200, y: 330 }, P17.hE, eRootQ, camera, hER)
      towardCamera(chest, camera, 0.16)
      const fromShelf = seg(c, T17.take[1], T17.take[2])
      const outK = seg(c, T17.out[0] + 0.1, T17.out[1])
      const gone = seg(c, T17.out[1], T17.out[2])
      carried.position.copy(takenHome).lerp(chest, fromShelf)
      if (outK > 0) carried.position.lerp(doorP, outK)
      if (gone > 0) carried.position.lerp(doorOut, gone)
      carried.position.y += Math.sin(fromShelf * Math.PI) * 0.06
      carried.scale.setScalar(1 - gone * 0.6)
      carried.rotation.y = 0.25 * (1 - fromShelf)
    } else carried.visible = false
  }
}

/* ------------------------------------------------------------------ T17 concept: the cloud account */

function setupT17Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  const bgDay = new THREE.Color('#EEF3FB')
  const bgNight = new THREE.Color('#1E2848')
  scene.background = bgDay.clone()
  frameCam(camera)
  const L = lights(scene, [0.2, 1.0, -0.5])
  const room = backRoom17(scene, { wall: '#EEF2FA', floor: ['#E3EAF8', '#C9D5EC'], trim: '#1F2E63', frame: '#2C3E7E', inner: '#DCE6F7', innerFloor: '#B8C6E0', outside: '#3B4A72' })

  const { x0, x1 } = P17.open
  const cx = (x0 + x1) / 2
  const sz = P17.wallZ - 0.85
  /* the data room: the S3 bucket on a white pedestal (official mark on a white tile above it), file cards on a rack */
  const white = mat('#FFFFFF', { roughness: 0.35 })
  scene.add(box(0.36, 0.5, 0.36, white, [cx - 0.16, 0.25, sz + 0.05], 0.02))
  const bucketM = mat('#7AA116', { roughness: 0.35, metalness: 0.1, emissive: new THREE.Color(C.orange), emissiveIntensity: 0 })
  const bucket = cyl(0.17, 0.12, 0.34, bucketM, [cx - 0.16, 0.67, sz + 0.05], 36)
  scene.add(bucket)
  scene.add(cyl(0.175, 0.175, 0.03, mat('#5E7E10', { roughness: 0.4 }), [cx - 0.16, 0.85, sz + 0.05], 36))
  const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), basic(markTex(bucketUrl, redraw)))
  tile.position.set(cx - 0.16, 1.22, sz + 0.05)
  scene.add(flat(tile))
  /* the file rack: three shelves of white file cards */
  const rackM = mat('#2C3E7E', { roughness: 0.45, metalness: 0.25 })
  scene.add(box(0.04, 1.5, 0.3, rackM, [cx + 0.14, 0.75, sz]), box(0.04, 1.5, 0.3, rackM, [x1 + 0.12, 0.75, sz]))
  const fileTex = docTex(false, 90, 110)
  const fileM = basic(fileTex, { side: THREE.DoubleSide })
  const files: THREE.Mesh[] = []
  for (const y of [0.45, 0.85, 1.25]) {
    scene.add(box(x1 - cx + 0.02, 0.03, 0.3, rackM, [(cx + 0.14 + x1 + 0.12) / 2, y, sz]))
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.16), fileM)
      f.position.set(cx + 0.28 + k * 0.16, y + 0.1, sz + 0.06 + k * 0.004)
      scene.add(f)
      files.push(f)
    }
  }
  const takenFile = files[5]
  const roomLamp = glowM('#9CC2FF', '#F4F8FF')
  scene.add(flat(box(0.5, 0.04, 0.2, roomLamp, [cx, P17.open.h + 0.1, P17.wallZ - 0.6])))
  const roomLight = new THREE.PointLight(0x9cc2ff, 0, 3.2, 1.2)
  roomLight.position.set(cx, 1.6, P17.wallZ - 0.5)
  scene.add(roomLight)
  /* the exposure glow: the open bucket, orange, at night */
  const expose = halo('rgba(255,138,61,0.9)', 0.9)
  expose.position.set(cx - 0.16, 0.72, sz + 0.25)
  scene.add(expose)

  const sh = shutter(scene, '#AFC2E6', '#6E86BD', '#DCE6F7', '#2C3E7E')

  /* the badge reader on the left jamb */
  const swG = new THREE.Group()
  swG.position.copy(P17.sw)
  swG.add(box(0.11, 0.17, 0.04, mat('#1F2E63', { roughness: 0.35, metalness: 0.3 }), [0, 0, 0], 0.012))
  swG.add(box(0.075, 0.08, 0.01, mat('#2D63FB', { roughness: 0.3, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.4 }), [0, -0.02, 0.022]))
  const swLamp = glowM(C.green, '#5C6B8C')
  swG.add(cyl(0.014, 0.014, 0.02, swLamp, [0, 0.055, 0.025]).rotateX(Math.PI / 2))
  scene.add(swG)

  /* the admin's console desk, at the left: a monitor with a dashboard (bars, no words) */
  const deskM = mat('#E8EDF6', { roughness: 0.4 })
  const legM = mat('#5E6B86', { metalness: 0.4, roughness: 0.4 })
  scene.add(box(0.72, 0.04, 0.5, deskM, [-1.9, 0.86, -0.76], 0.01))
  for (const lx of [-2.22, -1.58]) scene.add(box(0.04, 0.84, 0.44, legM, [lx, 0.42, -0.76]))
  scene.add(box(0.05, 0.16, 0.05, legM, [-1.86, 0.96, -0.86]))
  const dash = canvasTex(160, 100, (g) => {
    g.fillStyle = '#13204A'
    g.fillRect(0, 0, 160, 100)
    ;[34, 52, 40, 64, 48, 58].forEach((h, i) => {
      g.fillStyle = '#7FB0FF'
      g.fillRect(14 + i * 23, 86 - h, 14, h)
    })
  })
  scene.add(box(0.46, 0.3, 0.025, mat('#1F2E63', { roughness: 0.3 }), [-1.86, 1.18, -0.88], 0.01))
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), basic(dash, { transparent: false }))
  mon.position.set(-1.86, 1.18, -0.865)
  scene.add(mon)
  /* the ceiling strip, lit at night */
  const hang = glowM('#BFD6FF', '#F4F8FF')
  scene.add(flat(box(0.7, 0.03, 0.14, hang, [-1.0, 2.3, -0.5])))
  const nightLight = new THREE.PointLight(0xbfd6ff, 0, 4.5, 1.1)
  nightLight.position.set(-0.6, 2.1, 0.2)
  scene.add(nightLight)

  /* the access badge: a blue card with a chip */
  const badge = new THREE.Group()
  const badgeM = mat('#2D63FB', { roughness: 0.35, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.2 })
  badge.add(box(0.11, 0.075, 0.008, badgeM, [0, 0, 0], 0.008))
  badge.add(box(0.026, 0.022, 0.004, mat(C.gold, { metalness: 0.7, roughness: 0.3 }), [-0.026, 0.004, 0.005]))
  badge.add(box(0.04, 0.008, 0.003, mat('#FFFFFF'), [0.022, 0.012, 0.005]), box(0.03, 0.008, 0.003, mat('#FFFFFF'), [0.017, -0.006, 0.005]))
  badge.scale.setScalar(1.25)
  scene.add(badge)
  /* the copied file */
  const copy = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.22), basic(docTex(false, 90, 110), { side: THREE.DoubleSide }))
  copy.renderOrder = 6
  copy.visible = false
  scene.add(copy)
  const copyGlow = halo('rgba(255,138,61,0.85)', 0.42)
  scene.add(copyGlow)

  /* people: the admin, a woman in a navy blazer; the insider, a young man in a grey hoodie */
  const aCfg = who(CAST_PRESETS.riya, { name: 'Admin', skinTone: 'wheatish', hair: { style: 'bun', color: 'black' }, outfit: { top: 'shirt', topColor: '#2E3A5C', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const iCfg = who(CAST_PRESETS.kabir, { name: 'Insider', skinTone: 'fair', hair: { style: 'curly', color: 'brown' }, outfit: { top: 'hoodie', topColor: '#6B7488', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { glasses: 'rect' } })
  const owner = person({ config: aCfg, dress: withNeck(BLAZER('#26304A', '#121A2E')), seed: 173, faces: OWNER17_FACES, pose: ownerPose17, loop: L17, height: 1.66, frames: F17, redraw, holdT: devHold(HOLD17) })
  const emp = person({ config: iCfg, seed: 174, faces: EMP17_FACES, pose: empPose17, loop: L17, height: 1.7, frames: F17, redraw, holdT: devHold(HOLD17) })
  scene.add(owner.object, emp.object)
  const shO = buildSkin(aCfg).shoulderHalf
  const shE = buildSkin(iCfg).shoulderHalf

  const eRoot = new THREE.Vector3()
  const hO = new THREE.Vector3()
  const hE = new THREE.Vector3()
  const chestP = new THREE.Vector3()
  const swP = new THREE.Vector3(P17.sw.x, P17.sw.y - 0.02, P17.sw.z + 0.08)
  const doorP = new THREE.Vector3((P17.door.x0 + P17.door.x1) / 2, 0.95, P17.wallZ + 0.16)
  const doorOut = new THREE.Vector3((P17.door.x0 + P17.door.x1) / 2, 0.95, P17.wallZ - 0.62)
  const fileHome = takenFile.position.clone()
  return (t: number) => {
    const c = mod(t, L17)
    const cq = frameT(c, L17, F17)
    const at = eAt17(c)
    eRoot.set(at.x, bob(at.walking, c), P17.ez)
    emp.object.position.copy(eRoot)
    owner.object.position.copy(P17.owner)
    owner.update(c, camera)
    emp.update(c, camera)
    const atq = eAt17(cq)
    const eRootQ = new THREE.Vector3(atq.x, bob(atq.walking, cq), P17.ez)

    const n = night17(c)
    room.skyM.color.set('#CFE2FF').lerp(new THREE.Color('#16203F'), n)
    room.moonM.opacity = seg(n, 0.6, 1)
    room.outM.color.set('#7F93BE').lerp(new THREE.Color('#10172C'), n)
    ;(scene.background as THREE.Color).copy(bgDay).lerp(bgNight, n)
    L.hemi.intensity = lerp(0.95, 0.42, n)
    L.key.intensity = lerp(2.0, 0.35, n)
    room.wallM.emissiveIntensity = lerp(0.32, 0.06, n)
    hang.emissiveIntensity = 1.6 * n
    nightLight.intensity = 2.0 * n

    const op = shutter17(c)
    sh.position.y = op * (P17.open.h + 0.02)
    const lit = seg(c, T17.shutterUp[0] + 0.1, T17.shutterUp[0] + 0.6) * (1 - seg(c, T17.dawn[0], T17.dawn[1]))
    roomLamp.emissiveIntensity = 1.4 * lit
    roomLight.intensity = (1.6 + 1.6 * n) * lit
    room.innerM.emissiveIntensity = 0.2 + 0.3 * lit * n
    swLamp.emissiveIntensity = 2.0 * seg(c, T17.insert[2], T17.insert[2] + 0.1) * (1 - seg(c, T17.dawn[0], T17.dawn[0] + 0.15))
    /* left open overnight: the exposed bucket glows orange */
    const exposed = n * lit * (0.75 + 0.25 * Math.sin(c * TAU * 0.9))
    ;(expose.material as THREE.MeshBasicMaterial).opacity = exposed
    bucketM.emissiveIntensity = 0.5 * exposed

    /* the badge */
    const kh = keyHolder17(c)
    const posOf = (w: 0 | 1 | 2, out: THREE.Vector3) => {
      if (w === 0) return handWorld('R', shO, ownerArmR17(cq), 1.66, P17.owner, camera, out)
      if (w === 1) return handWorld('L', shE, empArmL17(cq), 1.7, eRootQ, camera, out)
      return out.copy(swP)
    }
    posOf(kh.from, hO)
    posOf(kh.to, hE)
    badge.position.lerpVectors(hO, hE, kh.k)
    badge.position.y += Math.sin(kh.k * Math.PI) * 0.05
    badge.quaternion.copy(camera.quaternion)
    badge.rotateZ(kh.from === 2 && kh.to === 2 ? 0 : 0.3)
    badgeM.emissiveIntensity = 0.2 + (kh.from === 2 && kh.to === 2 ? 0.5 * seg(c, T17.insert[2], T17.insert[2] + 0.1) : 0)

    /* the file: a COPY peels off its rack (the original stays), goes to his chest, out of the account's exit */
    if (c >= T17.take[1] && c < T17.out[2]) {
      copy.visible = true
      rigToWorld({ x: 200, y: 330 }, 1.7, eRootQ, camera, chestP)
      towardCamera(chestP, camera, 0.16)
      const fromRack = seg(c, T17.take[1], T17.take[2])
      const outK = seg(c, T17.out[0] + 0.1, T17.out[1])
      const gone = seg(c, T17.out[1], T17.out[2])
      copy.position.copy(fileHome).lerp(chestP, fromRack)
      if (outK > 0) copy.position.lerp(doorP, outK)
      if (gone > 0) copy.position.lerp(doorOut, gone)
      copy.position.y += Math.sin(fromRack * Math.PI) * 0.06
      copy.scale.setScalar((1 - gone * 0.6) * lerp(0.75, 1, fromRack))
      copy.quaternion.copy(camera.quaternion)
      copyGlow.position.copy(copy.position).add(new THREE.Vector3(0, 0, -0.01))
      ;(copyGlow.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - gone)
      copyGlow.quaternion.copy(camera.quaternion)
    } else {
      copy.visible = false
      ;(copyGlow.material as THREE.MeshBasicMaterial).opacity = 0
    }
  }
}

/* ================================================================== T21 · the hidden note in the task folder */

const L21 = 8
const HOLD21 = 4.95 /* the confidential files on their way from her hand to the stranger's, the manager seeing it */
const F21 = 96
const P21 = {
  wallZ: -1.0,
  left: -3.2,
  right: 3.6,
  mgr: new THREE.Vector3(-1.08, 0, -0.42),
  e0: -0.12,
  e1: 0.9,
  ez: -0.45,
  cab: { x: 0.36, z: -0.8, w: 0.42, h: 1.22, d: 0.34 },
  door: { x0: 1.5, x1: 2.12, h: 1.9 },
  str: new THREE.Vector3(1.8, 0, -0.74),
  hM: 1.74,
  hE: 1.6,
  hS: 1.7,
}
const T21 = {
  mReach: [0.1, 0.45] as const,
  eReach: [0.25, 0.5] as const,
  give: [0.5, 0.8] as const,
  toChest: [0.85, 1.1] as const,
  open: [1.1, 1.35] as const,
  slip: [1.35, 1.8] as const,
  read: [1.8, 2.5] as const,
  close: [2.5, 2.8] as const,
  walks: [
    [2.85, 3.55, P21.e1],
    [5.85, 6.55, P21.e0],
  ] as [number, number, number][],
  putDown: [3.5, 3.65, 3.8] as const, // reach to the cabinet top, folder on it, arm back
  drawer: [3.8, 4.05, 5.3, 5.55] as const, // out, shut
  lift: [4.05, 4.3] as const, // files up to her chest
  hand: [4.4, 4.7, 5.0] as const, // her right hand out, files leave it, the stranger has them
  tuck: [5.35, 5.7] as const, // the stranger tucks them away
  pickUp: [5.5, 5.65, 5.8] as const, // the folder back off the cabinet
  mgrSees: [4.35, 4.6] as const,
  ret: [6.6, 6.85, 7.15, 7.45] as const, // reach, folder moves, manager has it, arms down
}
const eAt21 = (c: number) => along(c, [[0, 0, P21.e0], ...T21.walks])
/** the cabinet top, where she sets the folder down */
const CAB_TOP = new THREE.Vector3(P21.cab.x + 0.04, P21.cab.h + 0.02, P21.cab.z + 0.02)

function mgrArmR21(c: number): Arm {
  const give = hold(c, T21.mReach[0], T21.mReach[1], T21.toChest[0], T21.toChest[1])
  const take = hold(c, T21.ret[0], T21.ret[1], T21.ret[2], T21.ret[3])
  const k = Math.max(give, take)
  return { s: lerp(14, 60, k), e: lerp(30, 26, k) }
}
function empArmL21(c: number): Arm {
  const rec = hold(c, T21.eReach[0], T21.eReach[1], T21.toChest[0], T21.toChest[1])
  const chest = Math.max(hold(c, T21.toChest[0], T21.toChest[1], T21.close[1], T21.close[1] + 0.2), hold(c, T21.lift[0], T21.lift[1], T21.hand[1], T21.hand[1] + 0.2))
  const put = Math.max(hold(c, T21.putDown[0] - 0.1, T21.putDown[0] + 0.1, T21.putDown[1], T21.putDown[2]), hold(c, T21.pickUp[0] - 0.1, T21.pickUp[0] + 0.1, T21.pickUp[1], T21.pickUp[2]))
  const drawer = Math.max(hold(c, T21.drawer[0] - 0.12, T21.drawer[0] + 0.05, T21.lift[0], T21.lift[0] + 0.1), hold(c, T21.drawer[2] - 0.12, T21.drawer[2], T21.drawer[3], T21.drawer[3] + 0.1))
  const ret = hold(c, T21.ret[0], T21.ret[1], T21.ret[2], T21.ret[3])
  const w = eAt21(c).walking
  let a: Arm = { s: 10 + swing(c, w), e: 12 }
  const mixA = (b: Arm, k: number) => {
    a = { s: lerp(a.s, b.s, k), e: lerp(a.e, b.e, k) }
  }
  mixA({ s: 58, e: 24 }, rec)
  mixA({ s: 26, e: 84 }, chest)
  mixA({ s: 78, e: 30 }, put)
  mixA({ s: 52, e: 26 }, drawer)
  mixA({ s: 60, e: 24 }, ret)
  return a
}
function empArmR21(c: number): Arm {
  const chest = Math.max(hold(c, T21.toChest[0] + 0.05, T21.toChest[1], T21.close[1], T21.close[1] + 0.2), hold(c, T21.lift[0] + 0.05, T21.lift[1], T21.hand[0], T21.hand[0] + 0.1))
  const hand = hold(c, T21.hand[0], T21.hand[1], T21.hand[2], T21.hand[2] + 0.3)
  const w = eAt21(c).walking
  let a: Arm = { s: 10 - swing(c, w), e: 12 }
  const mixA = (b: Arm, k: number) => {
    a = { s: lerp(a.s, b.s, k), e: lerp(a.e, b.e, k) }
  }
  mixA({ s: 26, e: 84 }, chest)
  mixA({ s: 72, e: 12 }, hand)
  return a
}
function strArmL21(c: number): Arm {
  const take = hold(c, T21.hand[0] + 0.1, T21.hand[1], T21.hand[2] + 0.05, T21.tuck[0])
  const tuck = hold(c, T21.hand[2], T21.tuck[0], T21.tuck[1] - 0.05, T21.tuck[1] + 0.25)
  let a: Arm = { s: 12, e: 16 }
  a = { s: lerp(a.s, 64, take), e: lerp(a.e, 16, take) }
  a = { s: lerp(a.s, 28, tuck * (1 - take)), e: lerp(a.e, 82, tuck * (1 - take)) }
  return a
}

/** where the folder is: 0 manager's right hand, 1 her left hand, 2 at her chest, 3 on the cabinet top */
type FH = 0 | 1 | 2 | 3
function folderHolder21(c: number): { from: FH; to: FH; k: number } {
  if (c < T21.give[0]) return { from: 0, to: 0, k: 0 }
  if (c < T21.give[1]) return { from: 0, to: 1, k: seg(c, T21.give[0], T21.give[1]) }
  if (c < T21.toChest[0]) return { from: 1, to: 1, k: 0 }
  if (c < T21.toChest[1]) return { from: 1, to: 2, k: seg(c, T21.toChest[0], T21.toChest[1]) }
  if (c < T21.close[1]) return { from: 2, to: 2, k: 0 }
  if (c < T21.close[1] + 0.2) return { from: 2, to: 1, k: seg(c, T21.close[1], T21.close[1] + 0.2) }
  if (c < T21.putDown[0] + 0.1) return { from: 1, to: 1, k: 0 }
  if (c < T21.putDown[1]) return { from: 1, to: 3, k: seg(c, T21.putDown[0] + 0.1, T21.putDown[1]) }
  if (c < T21.pickUp[0] + 0.1) return { from: 3, to: 3, k: 0 }
  if (c < T21.pickUp[1]) return { from: 3, to: 1, k: seg(c, T21.pickUp[0] + 0.1, T21.pickUp[1]) }
  if (c < T21.ret[1]) return { from: 1, to: 1, k: 0 }
  if (c < T21.ret[2]) return { from: 1, to: 0, k: seg(c, T21.ret[1], T21.ret[2]) }
  return { from: 0, to: 0, k: 0 }
}

function mgrPose21(p: Pose, c: number) {
  const r = mgrArmR21(c)
  p.shoulderR = r.s
  p.elbowR = r.e
  p.shoulderL = 10
  p.elbowL = 16
  const toE = Math.max(hold(c, 0, 0.05, 1.0, 1.3), hold(c, 6.3, 6.5, L21, L21 + 1))
  to(p, 'headTurn', 0.35, toE)
  to(p, 'lookX', 0.8, toE)
  /* at his monitor (left) while she reads and walks away */
  const screen = hold(c, 1.15, 1.45, T21.mgrSees[0] - 0.1, T21.mgrSees[0] + 0.1)
  to(p, 'headTurn', -0.45, screen)
  to(p, 'lookX', -0.9, screen)
  to(p, 'headNod', 0.15, screen)
  to(p, 'shoulderL', 30, screen)
  to(p, 'elbowL', 60, screen)
  /* he looks up and sees the files go out of the door */
  const sees = hold(c, T21.mgrSees[0], T21.mgrSees[1], 6.0, 6.3)
  to(p, 'headTurn', 0.8, sees)
  to(p, 'lookX', 1, sees)
  to(p, 'headY', -4, sees)
  to(p, 'lean', 3, sees)
}
function empPose21(p: Pose, c: number) {
  const l = empArmL21(c)
  const r = empArmR21(c)
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
  const at = eAt21(c)
  walkLegs(p, c, at.walking, at.dir)
  const toM = Math.max(hold(c, 0, 0.05, 0.85, 1.0), hold(c, 6.35, 6.55, L21, L21 + 1))
  to(p, 'headTurn', -0.4, toM)
  to(p, 'lookX', -0.85, toM)
  /* reading the slip in her hands */
  const read = hold(c, T21.slip[0], T21.slip[0] + 0.2, T21.read[1], T21.close[0] + 0.1)
  to(p, 'headNod', 0.32, read)
  to(p, 'lookY', 0.85, read)
  /* she turns AWAY from the manager, toward the cabinet and the door */
  const away = hold(c, T21.close[0], T21.close[0] + 0.25, 5.75, 5.9)
  to(p, 'headTurn', 0.7, away)
  to(p, 'lookX', 0.9, away)
  /* the cabinet is at her left: she looks down at it, then back at the stranger for the hand-over */
  const toCab = Math.max(hold(c, T21.putDown[0] - 0.1, T21.putDown[0] + 0.05, T21.lift[1], T21.lift[1] + 0.12), hold(c, T21.drawer[2] - 0.1, T21.drawer[2] + 0.05, T21.pickUp[2], T21.pickUp[2] + 0.1))
  to(p, 'headTurn', -0.4, toCab)
  to(p, 'lookX', -0.85, toCab)
  to(p, 'headNod', 0.2, toCab)
  to(p, 'lookY', 0.5, toCab)
}
function strPose21(p: Pose, c: number) {
  const l = strArmL21(c)
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = 10
  p.elbowR = 14
  /* waiting, eyes on her; a quick look round as he tucks the files away */
  p.headTurn = -0.35
  p.lookX = -0.85
  const look = hold(c, T21.tuck[0], T21.tuck[0] + 0.15, T21.tuck[1], T21.tuck[1] + 0.2)
  to(p, 'headTurn', 0.3, look)
  to(p, 'lookX', 0.7, look)
}
const EMP21_FACES: [number, string][] = [
  [0, 'listening'],
  [0.7, 'happy'],
  [1.5, 'surprised'],
  [2.0, 'thinking'],
  [2.6, 'skeptical'],
  [4.4, 'neutral'],
  [6.3, 'neutral'],
]
const MGR21_FACES: [number, string][] = [
  [0, 'happy'],
  [1.3, 'thinking'],
  [T21.mgrSees[0] + 0.15, 'shocked'],
  [5.6, 'worried'],
  [6.6, 'happy'],
]
const STR21_FACES: [number, string][] = [
  [0, 'neutral'],
  [3.6, 'skeptical'],
  [4.7, 'grin'],
  [6.0, 'neutral'],
]

/** the office of T21 (shared by both cards): wall with the doorway, floor, a cabinet/store place at the right */
function office21(scene: THREE.Scene, o: { wall: string; floor: [string, string]; trim: string; frame: string; outside: string }) {
  const wz = P21.wallZ
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.32 })
  const fl = flat(mesh(new THREE.PlaneGeometry(P21.right - P21.left, 6), mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 4, [9, 6]), roughness: 0.8 }), [(P21.left + P21.right) / 2, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a + 0.08, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.06])))
  const D = P21.door
  part(P21.left, D.x0, 0, 3.2)
  part(D.x0, D.x1, D.h, 3.2)
  part(D.x1, P21.right, 0, 3.2)
  scene.add(box(P21.right - P21.left, 0.1, 0.03, mat(o.trim, { roughness: 0.7 }), [(P21.left + P21.right) / 2, 0.05, wz + 0.015]))
  const frameM = mat(o.frame, { roughness: 0.5, metalness: 0.2 })
  scene.add(box(0.06, D.h, 0.16, frameM, [D.x0 - 0.03, D.h / 2, wz + 0.02]), box(0.06, D.h, 0.16, frameM, [D.x1 + 0.03, D.h / 2, wz + 0.02]), box(D.x1 - D.x0 + 0.12, 0.06, 0.16, frameM, [(D.x0 + D.x1) / 2, D.h + 0.03, wz + 0.02]))
  /* the corridor beyond the doorway */
  const outM = new THREE.MeshBasicMaterial({ color: o.outside, toneMapped: false })
  const out = new THREE.Mesh(new THREE.PlaneGeometry(D.x1 - D.x0 + 0.5, D.h + 0.4), outM)
  out.position.set((D.x0 + D.x1) / 2, D.h / 2, wz - 0.75)
  scene.add(out)
  scene.add(flat(box(D.x1 - D.x0 + 0.3, 0.02, 0.8, mat('#9AA3B5', { roughness: 0.9 }), [(D.x0 + D.x1) / 2, 0.005, wz - 0.38])))
  return { wallM }
}

/** a confidential file: an orange-banded folder with a padlock glyph */
function confTex() {
  return canvasTex(100, 120, (g) => {
    g.fillStyle = '#FFE7D3'
    g.beginPath()
    g.roundRect(2, 10, 96, 108, 8)
    g.fill()
    g.fillStyle = C.orange
    g.beginPath()
    g.roundRect(2, 2, 44, 18, 6)
    g.fill()
    g.beginPath()
    g.roundRect(2, 12, 96, 22, 6)
    g.fill()
    lockGlyph(g, 50, 74, 40, '#C85A1E')
  })
}

/* ------------------------------------------------------------------ T21 everyday: the office */

function setupT21Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF1F6')
  frameCam(camera)
  lights(scene, [0.2, 1.0, -0.5])
  office21(scene, { wall: '#F3EEE6', floor: ['#ECE4D6', '#DACDB8'], trim: '#C9A27A', frame: '#8C6440', outside: '#B9C3D6' })

  /* the manager's desk and monitor at the left */
  const deskTop = mat('#B07A4C', { roughness: 0.6 })
  scene.add(box(0.74, 0.05, 0.52, deskTop, [-1.8, 0.76, -0.74], 0.01))
  for (const lx of [-2.12, -1.48]) scene.add(box(0.05, 0.74, 0.46, mat('#8C5E38'), [lx, 0.37, -0.74]))
  scene.add(box(0.05, 0.16, 0.05, mat('#3E4656'), [-1.8, 0.86, -0.74]))
  scene.add(box(0.46, 0.3, 0.025, mat('#1F2E63', { roughness: 0.3 }), [-1.8, 1.08, -0.76], 0.01))
  const scr = canvasTex(160, 100, (g) => {
    g.fillStyle = '#EAF1FF'
    g.fillRect(0, 0, 160, 100)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, 160, 14)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#C3CCDD'
      g.fillRect(14, 26 + i * 16, 90 + ((i * 23) % 40), 7)
    }
  })
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), basic(scr, { transparent: false }))
  mon.position.set(-1.8, 1.08, -0.745)
  scene.add(mon)
  /* the filing cabinet: three drawers, the top one holds the confidential files */
  const K = P21.cab
  const cabM = mat('#8D99AE', { roughness: 0.4, metalness: 0.45 })
  scene.add(box(K.w, K.h, K.d, cabM, [K.x, K.h / 2, K.z], 0.015))
  const handleM = mat('#D9DEE8', { metalness: 0.8, roughness: 0.25 })
  for (let k = 0; k < 2; k++) {
    scene.add(box(K.w - 0.04, 0.36, 0.01, mat('#9AA6BA', { roughness: 0.4, metalness: 0.4 }), [K.x, 0.24 + k * 0.4, K.z + K.d / 2 + 0.004]))
    scene.add(box(0.12, 0.02, 0.03, handleM, [K.x, 0.36 + k * 0.4, K.z + K.d / 2 + 0.02]))
  }
  const drawer = new THREE.Group()
  drawer.add(box(K.w - 0.04, 0.36, 0.02, mat('#9AA6BA', { roughness: 0.4, metalness: 0.4 }), [0, 0, 0]))
  drawer.add(box(0.12, 0.02, 0.03, handleM, [0, 0.12, 0.02]))
  drawer.add(box(K.w - 0.06, 0.02, K.d - 0.04, cabM, [0, -0.16, -K.d / 2]))
  const confM = basic(confTex(), { side: THREE.DoubleSide })
  const inDrawer: THREE.Mesh[] = []
  for (let k = 0; k < 3; k++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), confM)
    f.position.set(-0.04 + k * 0.04, 0.02, -0.08 - k * 0.07)
    drawer.add(f)
    inDrawer.push(f)
  }
  drawer.position.set(K.x, 0.24 + 2 * 0.4, K.z + K.d / 2 + 0.004)
  scene.add(drawer)

  /* the task folder (blue), with its front cover on a hinge and the hidden slip inside */
  const folder = new THREE.Group()
  const fBack = box(0.24, 0.3, 0.01, mat('#2D63FB', { roughness: 0.45 }), [0, 0, 0], 0.006)
  folder.add(fBack)
  folder.add(flat(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), basic(docTex(false, 100, 130)))).translateZ(0.007))
  const cover = new THREE.Group()
  cover.position.set(-0.12, 0, 0.012)
  cover.add(box(0.24, 0.3, 0.01, mat('#3A73FF', { roughness: 0.45 }), [0.12, 0, 0], 0.006))
  folder.add(cover)
  folder.scale.setScalar(1.25)
  scene.add(folder)
  /* the slip: a small glowing paper with a few lines (never words) */
  const slipTex = canvasTex(80, 50, (g) => {
    g.fillStyle = '#FFF4D6'
    g.beginPath()
    g.roundRect(2, 2, 76, 46, 6)
    g.fill()
    ;[0.8, 0.6, 0.7].forEach((k, i) => {
      g.fillStyle = C.orange
      g.beginPath()
      g.roundRect(10, 12 + i * 11, 60 * k, 5, 3)
      g.fill()
    })
  })
  const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), basic(slipTex))
  slip.renderOrder = 7
  scene.add(slip)
  const slipGlow = halo('rgba(255,170,80,0.95)', 0.42)
  scene.add(slipGlow)
  /* the files in her hand, then the stranger's */
  const carried = new THREE.Group()
  for (let k = 0; k < 3; k++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), confM)
    f.position.set(k * 0.02, -k * 0.012, k * 0.006)
    f.renderOrder = 6 + k
    carried.add(f)
  }
  carried.visible = false
  scene.add(carried)

  /* people: the manager, an older man in a blazer and tie; the employee, a young woman with her staff lanyard; the
     stranger, a bearded man in a dark jacket, waiting in the doorway */
  const mCfg = who(CAST_PRESETS.arjun, { name: 'Manager', skinTone: 'fair', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirtTie', topColor: '#E8ECF5', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30', accentColor: '#9C2F3A' }, accessories: { glasses: 'rect', watch: true, belt: true }, build: { height: 1.02, shoulders: 1.04 } })
  const eCfg = who(CAST_PRESETS.meera, { name: 'Employee', skinTone: 'medium', hair: { style: 'ponytail', color: 'black' }, outfit: { top: 'blouse', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const sCfg = who(CAST_PRESETS.rohan, { name: 'Stranger', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'hoodie', topColor: '#3A3F4C', bottom: 'jeans', bottomColor: '#252A36', shoeColor: '#1B1F2A' }, accessories: { beard: 'short', watch: false } })
  const mgr = person({ config: mCfg, dress: withNeck(BLAZER('#26304A', '#161D30')), seed: 211, faces: MGR21_FACES, pose: mgrPose21, loop: L21, height: P21.hM, frames: F21, redraw, holdT: devHold(HOLD21) })
  const emp = person({ config: eCfg, dress: withNeck(LANYARD(C.brandDark)), seed: 212, faces: EMP21_FACES, pose: empPose21, loop: L21, height: P21.hE, frames: F21, redraw, holdT: devHold(HOLD21) })
  const str = person({ config: sCfg, seed: 213, faces: STR21_FACES, pose: strPose21, loop: L21, height: P21.hS, frames: F21, redraw, holdT: devHold(HOLD21) })
  scene.add(mgr.object, emp.object, str.object)
  const shM = buildSkin(mCfg).shoulderHalf
  const shE = buildSkin(eCfg).shoulderHalf
  const shS = buildSkin(sCfg).shoulderHalf

  const eRoot = new THREE.Vector3()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const chest = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L21)
    const cq = frameT(c, L21, F21)
    const at = eAt21(c)
    eRoot.set(at.x, bob(at.walking, c), P21.ez)
    emp.object.position.copy(eRoot)
    mgr.object.position.copy(P21.mgr)
    str.object.position.copy(P21.str)
    mgr.update(c, camera)
    emp.update(c, camera)
    str.update(c, camera)
    const atq = eAt21(cq)
    const eRootQ = new THREE.Vector3(atq.x, bob(atq.walking, cq), P21.ez)

    /* the folder */
    const fh = folderHolder21(c)
    const posOf = (w: FH, out: THREE.Vector3) => {
      if (w === 0) return handWorld('R', shM, mgrArmR21(cq), P21.hM, P21.mgr, camera, out)
      if (w === 1) return handWorld('L', shE, empArmL21(cq), P21.hE, eRootQ, camera, out)
      if (w === 3) return out.copy(CAB_TOP)
      rigToWorld({ x: 200, y: 318 }, P21.hE, eRootQ, camera, out)
      return towardCamera(out, camera, 0.16)
    }
    posOf(fh.from, a)
    posOf(fh.to, b)
    folder.position.lerpVectors(a, b, fh.k)
    folder.quaternion.copy(camera.quaternion)
    const atChest = fh.from === 2 || fh.to === 2 ? (fh.from === 2 && fh.to === 2 ? 1 : fh.to === 2 ? fh.k : 1 - fh.k) : 0
    folder.rotateZ(lerp(-0.25, 0, atChest))
    folder.rotateX(lerp(0, -0.5, atChest))
    /* lying flat on the cabinet top */
    const onTop = fh.from === 3 && fh.to === 3 ? 1 : fh.to === 3 ? fh.k : fh.from === 3 ? 1 - fh.k : 0
    if (onTop > 0) {
      folder.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.2)), onTop)
      folder.position.y += 0.012 * onTop
    }
    const open = hold(c, T21.open[0], T21.open[1], T21.close[0], T21.close[1])
    cover.rotation.y = -2.4 * open
    /* the slip rises out of the open folder, glowing, and sinks back as she closes it */
    const rise = hold(c, T21.slip[0], T21.slip[1], T21.close[0] - 0.05, T21.close[0] + 0.2)
    slip.visible = rise > 0.01
    if (slip.visible) {
      slip.position.copy(folder.position).add(new THREE.Vector3(0, 0.05 + 0.2 * rise, 0.03))
      slip.quaternion.copy(camera.quaternion)
      slip.rotateZ(0.08 * Math.sin(c * 3))
      slip.scale.setScalar(lerp(0.5, 1, rise))
    }
    slipGlow.position.copy(slip.position).add(new THREE.Vector3(0, 0, -0.01))
    slipGlow.quaternion.copy(camera.quaternion)
    ;(slipGlow.material as THREE.MeshBasicMaterial).opacity = rise * (0.7 + 0.3 * Math.sin(c * TAU * 1.2))

    /* the drawer and the confidential files */
    const dOut = hold(c, T21.drawer[0], T21.drawer[1], T21.drawer[2], T21.drawer[3])
    drawer.position.z = P21.cab.z + P21.cab.d / 2 + 0.004 + 0.26 * dOut
    const gone = c >= T21.lift[0] && c < L21 - 0.3
    inDrawer.forEach((f) => (f.visible = !gone))
    if (c >= T21.lift[0] && c < T21.tuck[1]) {
      carried.visible = true
      drawer.updateMatrixWorld()
      const src = new THREE.Vector3(0, 0.08, -0.1).applyMatrix4(drawer.matrixWorld)
      /* drawer -> her chest -> her outstretched right hand -> the stranger's hand */
      rigToWorld({ x: 200, y: 330 }, P21.hE, eRootQ, camera, chest)
      towardCamera(chest, camera, 0.18)
      const lift = seg(c, T21.lift[0], T21.lift[1])
      const out = seg(c, T21.hand[0], T21.hand[1])
      const hR = handWorld('R', shE, empArmR21(cq), P21.hE, eRootQ, camera, a)
      const hS = handWorld('L', shS, strArmL21(cq), P21.hS, P21.str, camera, b)
      const move = seg(c, T21.hand[1], T21.hand[2])
      carried.position.copy(src).lerp(chest, lift)
      if (out > 0) carried.position.lerp(hR, out)
      if (move > 0) carried.position.lerp(hS, move)
      carried.position.y += Math.sin(move * Math.PI) * 0.05 + Math.sin(lift * Math.PI) * 0.05
      const tuck = seg(c, T21.tuck[0], T21.tuck[1])
      carried.scale.setScalar(1 - tuck * 0.9)
      carried.quaternion.copy(camera.quaternion)
      carried.rotateZ(-0.2)
    } else carried.visible = false
  }
}

/* ------------------------------------------------------------------ T21 concept: the AI chat assistant */

function setupT21Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  frameCam(camera)
  lights(scene, [0.2, 1.0, -0.5])
  office21(scene, { wall: '#EEF2FA', floor: ['#E3EAF8', '#C9D5EC'], trim: '#1F2E63', frame: '#2C3E7E', outside: '#3B4A72' })
  void redraw

  /* the user's standing desk and laptop at the left */
  const deskM = mat('#E8EDF6', { roughness: 0.4 })
  const legM = mat('#5E6B86', { metalness: 0.4, roughness: 0.4 })
  const desk = new THREE.Vector3(-1.62, 0, -0.5)
  scene.add(box(0.56, 0.035, 0.44, deskM, [desk.x, 0.76, desk.z], 0.01))
  scene.add(box(0.05, 0.74, 0.05, legM, [desk.x, 0.37, desk.z - 0.05]), box(0.38, 0.03, 0.32, legM, [desk.x, 0.015, desk.z - 0.05]))
  const laptop = new THREE.Group()
  laptop.position.set(desk.x + 0.06, 0.778, desk.z + 0.04)
  laptop.rotation.y = 0.55
  const shell = mat('#C9D0DC', { roughness: 0.35, metalness: 0.5 })
  laptop.add(box(0.34, 0.015, 0.23, shell, [0, 0.0075, 0], 0.005))
  const lid = new THREE.Group()
  lid.position.set(0, 0.015, -0.11)
  lid.rotation.x = -0.28
  lid.add(box(0.34, 0.22, 0.012, shell, [0, 0.11, 0], 0.005))
  const lapScr = canvasTex(160, 100, (g) => {
    g.fillStyle = '#EAF1FF'
    g.fillRect(0, 0, 160, 100)
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.roundRect(70, 20, 76, 20, 8)
    g.fill()
    g.fillStyle = '#C3CCDD'
    g.beginPath()
    g.roundRect(14, 52, 70, 18, 8)
    g.fill()
  })
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.194), basic(lapScr, { transparent: false }))
  lapScreen.position.set(0, 0.11, 0.0065)
  lid.add(lapScreen)
  laptop.add(lid)
  scene.add(laptop)

  /* the assistant: a chat screen on a stand, its AI core above it (a glowing sphere in a ring) */
  const AX = -0.32
  const stand = mat('#1F2E63', { roughness: 0.35, metalness: 0.3 })
  scene.add(box(0.5, 0.04, 0.34, stand, [AX, 0.02, -0.55], 0.01), box(0.06, 0.7, 0.06, stand, [AX, 0.36, -0.55]))
  scene.add(box(0.8, 0.62, 0.05, stand, [AX, 1.0, -0.55], 0.02))
  const chatBase = canvasTex(220, 160, (g) => {
    g.fillStyle = '#F4F8FF'
    g.fillRect(0, 0, 220, 160)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, 220, 16)
    g.fillStyle = '#DCE4F4'
    g.beginPath()
    g.roundRect(12, 136, 196, 16, 8)
    g.fill()
  })
  const chat = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.56), basic(chatBase, { transparent: false }))
  chat.position.set(AX, 1.0, -0.522)
  scene.add(chat)
  /* layers on the chat: the task bubble, the pasted document, the hidden line's glow */
  const taskTex = canvasTex(110, 34, (g) => {
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.roundRect(2, 2, 106, 30, 12)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(14, 10, 60, 5, 3)
    g.fill()
    g.beginPath()
    g.roundRect(14, 19, 44, 5, 3)
    g.fill()
  })
  const taskOn = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.105), basic(taskTex, { opacity: 0 }))
  taskOn.position.set(AX - 0.14, 1.17, -0.519)
  scene.add(taskOn)
  const docOn = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.275), basic(docTex(true), { opacity: 0 }))
  docOn.position.set(AX + 0.18, 0.94, -0.518)
  scene.add(docOn)
  const lineGlow = halo('rgba(255,138,61,0.95)', 0.4)
  lineGlow.scale.set(1, 0.4, 1)
  lineGlow.position.set(AX + 0.17, 0.915, -0.515)
  scene.add(lineGlow)
  /* the core: blue while it serves the user, orange once the hidden line takes over; it turns toward the exit */
  const coreM = new THREE.MeshStandardMaterial({ color: '#3B6BFF', emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.8, roughness: 0.25, metalness: 0.1 })
  const core = mesh(new THREE.SphereGeometry(0.11, 32, 24), coreM, [AX, 1.52, -0.55])
  scene.add(core)
  const ring = mesh(new THREE.TorusGeometry(0.17, 0.014, 12, 48), mat('#C9D3E6', { metalness: 0.7, roughness: 0.25 }), [AX, 1.52, -0.55])
  scene.add(ring)
  const pupil = mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }), [AX, 1.52, -0.44])
  scene.add(pupil)
  const coreHalo = halo('rgba(120,160,255,0.9)', 0.6)
  coreHalo.position.set(AX, 1.52, -0.6)
  scene.add(coreHalo)

  /* the data store at the cabinet's place: a locked cylinder of confidential files with a lid */
  const K = P21.cab
  const storeM = mat('#3567E8', { roughness: 0.3, metalness: 0.15 })
  scene.add(cyl(0.22, 0.22, 0.9, storeM, [K.x, 0.45, K.z], 40))
  for (const y of [0.3, 0.6]) scene.add(cyl(0.226, 0.226, 0.03, mat('#9DB8FF', { roughness: 0.3, metalness: 0.1 }), [K.x, y, K.z], 40))
  const lidG = new THREE.Group()
  lidG.position.set(K.x - 0.22, 0.92, K.z)
  lidG.add(cyl(0.23, 0.23, 0.05, mat('#8DB0FF', { roughness: 0.3, metalness: 0.1 }), [0.22, 0, 0], 40))
  scene.add(lidG)
  /* its padlock plate (an icon, no words) */
  const lockTex = canvasTex(60, 60, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(2, 2, 56, 56, 10)
    g.fill()
    lockGlyph(g, 30, 32, 30, C.orange)
  })
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), basic(lockTex))
  plate.position.set(K.x, 0.45, K.z + 0.227)
  scene.add(plate)

  /* the files streaming out: four in a row, each from the store up and across to the outsider's hand */
  const confM = basic(confTex(), { side: THREE.DoubleSide })
  const stream = Array.from({ length: 4 }, (_, k) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.19), confM)
    f.renderOrder = 6 + k
    f.visible = false
    scene.add(f)
    return f
  })

  /* people: the user (a young woman at her laptop, rule 58) and the outsider at the exit (a man in a dark hoodie) */
  const uCfg = who(CAST_PRESETS.ananya, { name: 'User', skinTone: 'wheatish', hair: { style: 'bob', color: 'black' }, outfit: { top: 'tshirt', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' } })
  const oCfg = who(CAST_PRESETS.kabir, { name: 'Outsider', skinTone: 'fair', hair: { style: 'buzz', color: 'brown' }, outfit: { top: 'hoodie', topColor: '#2E3340', bottom: 'jeans', bottomColor: '#1F2430', shoeColor: '#14171F' }, accessories: { glasses: 'round', beard: 'stubble' } })
  const U = new THREE.Vector3(-1.08, 0, -0.42)
  const user = person({
    config: uCfg,
    seed: 214,
    faces: [[0, 'thinking'], [0.6, 'happy'], [2.6, 'listening'], [T21.mgrSees[0] + 0.15, 'confused'], [5.4, 'worried'], [6.9, 'thinking']],
    pose: (p, c) => {
      /* hands at the laptop: typing the task, then waiting for the answer, looking across at the assistant */
      /* her hand on the laptop's keyboard (forward kinematics: about 0.5 to her left at desk height) */
      p.shoulderL = 65
      p.elbowL = 45
      p.shoulderR = 12
      p.elbowR = 16
      const typing = (1 - hold(c, 0.5, 0.6, 7.4, 7.6)) * Math.max(0, Math.sin(c * TAU * 5)) * 3
      p.elbowL += typing
      const watch = hold(c, 0.6, 0.9, 7.2, 7.6)
      to(p, 'headTurn', 0.4, watch)
      to(p, 'lookX', 0.85, watch)
      to(p, 'headNod', 0.3, 1 - watch)
      to(p, 'lookY', 0.6, 1 - watch)
      const sees = hold(c, T21.mgrSees[0], T21.mgrSees[1], 6.0, 6.3)
      to(p, 'headTurn', 0.55, sees)
      to(p, 'lookX', 1, sees)
    },
    loop: L21,
    height: 1.6,
    frames: F21,
    redraw,
    holdT: devHold(HOLD21),
  })
  user.object.position.copy(U)
  const out = person({ config: oCfg, seed: 215, faces: STR21_FACES, pose: strPose21, loop: L21, height: P21.hS, frames: F21, redraw, holdT: devHold(HOLD21) })
  out.object.position.copy(P21.str)
  scene.add(user.object, out.object)
  const shO = buildSkin(oCfg).shoulderHalf

  const from = new THREE.Vector3()
  const hand = new THREE.Vector3()
  const toChat = new THREE.Vector3(AX - 0.14, 1.17, -0.48)
  const toDoc = new THREE.Vector3(AX + 0.18, 0.94, -0.48)
  const flyTask = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.093), basic(taskTex))
  flyTask.renderOrder = 8
  scene.add(flyTask)
  const flyDoc = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.24), basic(docTex(true)))
  flyDoc.renderOrder = 8
  scene.add(flyDoc)
  return (t: number) => {
    const c = mod(t, L21)
    const cq = frameT(c, L21, F21)
    user.update(c, camera)
    out.update(c, camera)
    /* the task and the document leave the laptop and land in the chat */
    lid.updateMatrixWorld()
    lapScreen.getWorldPosition(from)
    const k1 = seg(c, T21.give[0], T21.give[1] + 0.1)
    const k2 = seg(c, T21.open[0], T21.slip[0] + 0.1)
    const fly1 = c >= T21.give[0] && c < T21.give[1] + 0.12
    const fly2 = c >= T21.open[0] && c < T21.slip[0] + 0.12
    flyTask.visible = fly1
    if (fly1) {
      flyTask.position.lerpVectors(from, toChat, k1)
      flyTask.position.y += Math.sin(k1 * Math.PI) * 0.18
      flyTask.scale.setScalar(lerp(0.4, 1, k1))
      flyTask.quaternion.copy(camera.quaternion)
    }
    flyDoc.visible = fly2
    if (fly2) {
      flyDoc.position.lerpVectors(from, toDoc, k2)
      flyDoc.position.y += Math.sin(k2 * Math.PI) * 0.2
      flyDoc.scale.setScalar(lerp(0.4, 1, k2))
      flyDoc.quaternion.copy(camera.quaternion)
    }
    const clear = seg(c, 7.4, 7.9)
    ;(taskOn.material as THREE.MeshBasicMaterial).opacity = seg(c, T21.give[1] + 0.05, T21.give[1] + 0.15) * (1 - clear)
    ;(docOn.material as THREE.MeshBasicMaterial).opacity = seg(c, T21.slip[0] + 0.05, T21.slip[0] + 0.15) * (1 - clear)
    /* the hidden line glows while the assistant reads it, and pulses on while it obeys */
    const hot = seg(c, T21.slip[0] + 0.15, T21.slip[1]) * (1 - clear)
    ;(lineGlow.material as THREE.MeshBasicMaterial).opacity = hot * (0.65 + 0.35 * Math.sin(c * TAU * 1.2))
    /* the core: blue -> orange; its eye from the user (left) to the exit (right) */
    const hijack = seg(c, T21.read[0], T21.close[1]) * (1 - seg(c, 7.2, 7.8))
    coreM.color.set('#3B6BFF').lerp(new THREE.Color('#FF8A3D'), hijack)
    coreM.emissive.set('#2D63FB').lerp(new THREE.Color('#E8642A'), hijack)
    coreM.emissiveIntensity = 0.7 + 0.25 * Math.sin(c * TAU * 0.8)
    ;(coreHalo.material as THREE.MeshBasicMaterial).color.set('#7FA6FF').lerp(new THREE.Color('#FFB27A'), hijack)
    ;(coreHalo.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.2 * Math.sin(c * TAU * 0.8)
    const look = lerp(-1, 1, hijack)
    const reading = hold(c, T21.slip[1], T21.read[0], T21.read[1], T21.close[1])
    pupil.position.set(AX + 0.06 * look, 1.52 - 0.05 * reading, -0.44)
    ring.rotation.y = 0.35 * look
    ring.rotation.x = 0.2 * Math.sin(c * TAU * 0.4)
    /* the store opens and the files stream to the outsider */
    const lidOpen = hold(c, T21.drawer[0], T21.drawer[1], T21.drawer[2], T21.drawer[3])
    lidG.rotation.z = 1.2 * lidOpen
    const sHand = handWorld('L', shO, strArmL21(cq), P21.hS, P21.str, camera, hand)
    const src = new THREE.Vector3(K.x, 0.98, K.z + 0.05)
    stream.forEach((f, k) => {
      const a0 = T21.lift[0] + k * 0.28
      const a1 = a0 + 0.75
      const kk = seg(c, a0, a1)
      const tuck = seg(c, T21.tuck[0] + k * 0.03, T21.tuck[1])
      f.visible = c >= a0 && c < T21.tuck[1] + 0.05
      if (!f.visible) return
      f.position.lerpVectors(src, sHand, kk)
      f.position.y += Math.sin(kk * Math.PI) * 0.35
      f.position.x += k * 0.012
      f.position.z += k * 0.004
      f.scale.setScalar(lerp(0.5, 1, Math.min(1, kk * 2)) * (1 - tuck * 0.9))
      f.quaternion.copy(camera.quaternion)
      f.rotateZ(-0.15 + 0.3 * (1 - kk))
    })
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T17Everyday: card(setupT17Everyday, devHold(HOLD17)),
  I_T17Concept: card(setupT17Concept, devHold(HOLD17)),
  I_T21Everyday: card(setupT21Everyday, devHold(HOLD21)),
  I_T21Concept: card(setupT21Concept, devHold(HOLD21)),
}
export const css = ''
