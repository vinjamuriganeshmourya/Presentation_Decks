import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import kmsUrl from '../images/aws-kms.svg'

/**
 * BUILDER J · SESSION 15 (Encryption & Key Management), SLIDE 45 (T25-AN).
 *
 * TR 25: "Bringing your own key to a rented locker instead of using the key provided by the locker facility: just as
 * BYOK lets an organisation use its own generated key material in AWS KMS instead of relying on AWS-generated key
 * material."
 *
 * Built like Session 14's and Session 16's j.tsx (accepted): real-time 3D on the engine's `@/engine/three-stage`, a
 * perspective camera, people are Character Lab characters through the engine's `castSprite` (role clothing by `dress`,
 * `adaptive` frames, expressions keyed to the action), no text on either card, ONE wall-clock loop shared by both
 * cards beat for beat and place for place, ending in the state it starts in, held frames (`?still`, thumbnails) at
 * HOLD, the telling moment: the facility's key held out, the customer's own key held up.
 *
 * One 6.9 s loop, both cards on one ground plan:
 *
 *   place                 everyday (a locker facility)                 concept (BYOK into AWS KMS)
 *   left                  the customer (olive shirt, own key ring),    the on-premises building: a rack with the HSM
 *                         the street entrance behind him                appliance (padlock seal), the key material
 *   centre, back wall     the wall of rental lockers; his rented one   the KMS vault: a wall of key compartments; the
 *                         (a bag inside) on the left, middle row        imported key's compartment in the same place
 *   right                 the service counter, the attendant (navy     the KMS counter, a robot arm, the AWS key
 *                         uniform, teal scarf), the facility key on a  (teal fob) on a tray, a board of AWS keys
 *                         tray, a board of facility keys behind her     behind it
 *   0.25 - 1.05           she picks up the facility key, holds it out  the arm picks up the AWS key, holds it out
 *   1.05 - 1.95           he shakes his head with a smile and holds    the HSM lights, its own key material slides
 *                         up his own key ring                           out and is sealed in a capsule (import token)
 *   1.95 - 2.9            she puts her key back; his key goes into     the arm puts the AWS key back, unused; the
 *                         the locker's lock and turns                   capsule flies to the compartment, opens, the
 *                                                                       material turns in the lock
 *   3.0 - 4.6             the door swings open: his bag, safe; proud   the door swings open; the material settles in
 *                                                                       the compartment's slot, glowing
 *   4.6 - 6.2             he pushes the door shut, locks it with his   the door shuts; the lock turns and glows the
 *                         own key, the key ring back in his hand        imported key's blue
 */

const W = 470
const H = 390
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devT = (fallback: number) => {
  if (typeof window === 'undefined') return fallback
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : fallback
}

const C = {
  brand: colors.brand,
  navy: '#1F2E63',
  teal: colors.teal,
  white: colors.white,
  brass: '#D4A24A',
  keyBlue: '#5B8CFF',
  olive: '#5E7F3E' as `#${string}`,
}

/* ------------------------------------------------------------------ small maths */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a))
/** 1 between b and c, easing up from a and down to d */
const hold = (t: number, a: number, b: number, c: number, d: number) => seg(t, a, b) * (1 - seg(t, c, d))
const mod = (t: number, l: number) => ((t % l) + l) % l
const TAU = Math.PI * 2
const DEG = Math.PI / 180

/* ------------------------------------------------------------------ textures (drawn at 3x, crisp on a 4K screen) */

const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
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
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}
/** an official mark (svg url) rasterised on a white rounded tile, sharp, reading as the white tile (rule 54) */
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
      g.beginPath()
      g.roundRect(0, 0, px, px, px * 0.16)
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
/** square floor tiles with thin joints */
const tileTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 2
      g.strokeRect(1, 1, 126, 126)
    },
    repeat,
  )
/** a locker door's face: a lighter frame, three vent slits at the top, a round number disc left blank (no digits) */
const lockerDoorTex = (base: string, slit: string, disc: string) =>
  canvasTex(92, 100, (g) => {
    g.fillStyle = base
    g.fillRect(0, 0, 92, 100)
    g.strokeStyle = 'rgba(255,255,255,0.28)'
    g.lineWidth = 2
    g.strokeRect(5, 5, 82, 90)
    g.fillStyle = slit
    for (const y of [14, 22, 30]) {
      rrect(g, 24, y, 44, 3.5, 1.75)
      g.fill()
    }
    g.fillStyle = disc
    g.beginPath()
    g.arc(46, 52, 8, 0, TAU)
    g.fill()
  })
/** red-brown brick courses, for the on-premises building */
const brickTex = () =>
  canvasTex(
    128,
    64,
    (g) => {
      g.fillStyle = '#D9D2C8'
      g.fillRect(0, 0, 128, 64)
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 16 : 0
        for (let x = -32; x < 128; x += 32) {
          g.fillStyle = ['#B8674A', '#C2724F', '#AE5F44'][(r + x / 32 + 3) % 3 | 0]
          rrect(g, x + off + 1, r * 16 + 1, 30, 14, 2)
          g.fill()
        }
      }
    },
    [5, 6],
  )
/** a server's front: dark, a vent band, two status lights */
const serverFaceTex = () =>
  canvasTex(120, 20, (g) => {
    g.fillStyle = '#2E3448'
    g.fillRect(0, 0, 120, 20)
    g.fillStyle = '#20263A'
    for (let x = 8; x < 80; x += 5) g.fillRect(x, 5, 2.5, 10)
    g.fillStyle = '#3DDC97'
    g.beginPath()
    g.arc(100, 10, 2.4, 0, TAU)
    g.fill()
    g.fillStyle = '#7FA6FF'
    g.beginPath()
    g.arc(108, 10, 2.4, 0, TAU)
    g.fill()
  })
/** the HSM's front: rugged dark panel, a vent grill left, a small display, a row of lights, the key slot right */
const hsmFaceTex = () =>
  canvasTex(200, 72, (g) => {
    g.fillStyle = '#323A52'
    rrect(g, 0, 0, 200, 72, 6)
    g.fill()
    g.fillStyle = '#242A3E'
    for (let y = 12; y < 62; y += 7) {
      rrect(g, 14, y, 44, 3.5, 1.75)
      g.fill()
    }
    g.fillStyle = '#0E1A33'
    rrect(g, 126, 14, 44, 18, 3)
    g.fill()
    g.fillStyle = '#4FD1FF'
    g.fillRect(131, 18, 22, 2.5)
    g.fillRect(131, 25, 30, 2.5)
    g.fillStyle = '#141A2A'
    rrect(g, 176, 26, 8, 22, 2)
    g.fill()
  })

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: [number, number, number], segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)

/** static parts merged into one mesh per material (few draw calls) */
function bake(g: THREE.Group, shadows = true): THREE.Group {
  g.updateMatrixWorld(true)
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>()
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    let geo = m.geometry.clone().applyMatrix4(m.matrixWorld)
    if (geo.index) geo = geo.toNonIndexed()
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k)
    const mt = m.material as THREE.Material
    byMat.set(mt, [...(byMat.get(mt) ?? []), geo])
  })
  const out = new THREE.Group()
  for (const [mt, geos] of byMat) {
    const merged = mergeGeometries(geos, false)
    if (!merged) continue
    const mm = new THREE.Mesh(merged, mt)
    mm.castShadow = shadows
    mm.receiveShadow = true
    out.add(mm)
  }
  return out
}
const flat = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const glow = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity })
const noShadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => (n.castShadow = false))
  return o
}
/** a lit plane facing +z */
const plane = (w: number, h: number, m: THREE.Material, pos: [number, number, number]) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  p.position.set(...pos)
  return p
}
/** a soft round glow (a light's halo), facing +z */
function halo(color: string, r: number) {
  const t = canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 64, 64)
  })
  const m = new THREE.MeshBasicMaterial({ map: t, color, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })
  const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m)
  p.renderOrder = 4
  return { mesh: p, mat: m }
}
function setCamera(camera: THREE.PerspectiveCamera, pos: [number, number, number], at: [number, number, number], fov: number) {
  camera.fov = fov
  camera.position.set(...pos)
  camera.lookAt(...at)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

/* ------------------------------------------------------------------ Character Lab people */

const who = (base: CharacterConfig, o: { name: string; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: CharacterConfig['accessories']; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone']; gender?: CharacterConfig['gender'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, mouth: 'full', ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: o.accessories ?? base.accessories,
  build: { ...base.build, ...o.build },
})

/* the customer: an adult man, olive shirt, jeans, glasses and a short beard */
const CUSTOMER = who(CAST_PRESETS.rohan, {
  name: 'Customer',
  gender: 'male',
  skinTone: 'medium',
  hair: { style: 'sidePart', color: 'darkBrown' },
  outfit: { top: 'shirt', topColor: C.olive, bottom: 'jeans', bottomColor: '#34476E', shoeColor: '#4A3426' },
  accessories: { beard: 'short', glasses: 'rect', watch: true },
  build: { height: 1.03, shoulders: 1.04 },
})
/* the facility attendant: navy uniform polo, a teal neck scarf, a blank name badge */
const ATTENDANT = who(CAST_PRESETS.meera, {
  name: 'Attendant',
  gender: 'female',
  skinTone: 'wheatish',
  hair: { style: 'ponytail', color: 'black' },
  outfit: { top: 'polo', topColor: '#26365E', bottom: 'trousers', bottomColor: '#2A2F45', shoeColor: '#2A2A30' },
  accessories: { earrings: true },
  build: { height: 0.97, shoulders: 1 },
})
/** the uniform: a teal scarf knotted at the collar and a white badge on the chest (no words) */
const UNIFORM = (
  <g data-part="uniform">
    <path d="M 176 214 Q 200 236 224 214 L 222 226 Q 200 246 178 226 Z" fill="#1FA5A0" />
    <path d="M 196 230 L 186 262 L 198 256 Z M 204 230 L 214 262 L 202 256 Z" fill="#17837F" />
    <rect x={222} y={262} width={30} height={14} rx={3} fill="#FFFFFF" stroke="#C9D3E6" strokeWidth={1.5} />
    <rect x={226} y={266} width={8} height={6} rx={1.5} fill="#1FA5A0" />
  </g>
)
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping over loop `L`) */
function faceAt(c: number, keys: [number, string][], L: number): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - L
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - L
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
const timeline = (seed: number, L: number, keys: [number, string][]) => (t: number): Timeline => ({ seed, idle: { ...CAST_IDLE, saccades: false, sway: false }, life: 0, ...faceAt(t, keys, L) })

function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = mix((p as Record<string, number>)[ch], v, clamp01(w))
}

/* ---- arms, solved in the rig's frame (Arm.tsx: the right arm is the left one mirrored about x 200) ---- */

const SHOULDER_Y = 205
const UPPER = 95
const FORE = 85 + 14 // to the middle of the grip
type Pt = { x: number; y: number }
type Ang = { s: number; e: number }
/** two-link IK for the LEFT arm (the viewer's left): shoulder and elbow angles that put the grip at `p` */
function solveL(sh: number, p: Pt): Ang {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D))))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
}
/** the other answer: the elbow down and the forearm up beside it (the rig takes a negative elbow, as its wave does) */
function solveLDown(sh: number, p: Pt): Ang {
  const a = solveL(sh, p)
  const px = 200 - (sh - 6)
  const ad = Math.atan2(-(p.x - px), p.y - SHOULDER_Y) / DEG
  const beta = a.s - ad
  return { s: ad - beta, e: -a.e }
}
/** the RIGHT arm (the viewer's right): the left arm's answer for the mirrored point */
const solveR = (sh: number, p: Pt, down = false): Ang => (down ? solveLDown : solveL)(sh, { x: 400 - p.x, y: p.y })
/** where the LEFT hand's grip is for joint angles `a` (forward kinematics, the rig's own chain) */
function fkL(sh: number, a: Ang): Pt {
  const px = 200 - (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px - Math.sin(s) * UPPER - Math.sin(f) * FORE, y: SHOULDER_Y + Math.cos(s) * UPPER + Math.cos(f) * FORE }
}
/** the RIGHT hand's grip */
const fkR = (sh: number, a: Ang): Pt => {
  const q = fkL(sh, a)
  return { x: 400 - q.x, y: q.y }
}
/** joint angles at time c from keyed poses [t, angles], eased between keys, held before the first and after the last */
function angAt(c: number, keys: [number, Ang][]): Ang {
  if (c <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (c <= keys[i][0]) {
      const k = seg(c, keys[i - 1][0], keys[i][0])
      return { s: mix(keys[i - 1][1].s, keys[i][1].s, k), e: mix(keys[i - 1][1].e, keys[i][1].e, k) }
    }
  }
  return keys[keys.length - 1][1]
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
  const p = cam.clone().addScaledVector(ray, t)
  const u = h / 0.93 / 600
  const lx = Math.cos(phi) * (p.x - root.x) - Math.sin(phi) * (p.z - root.z)
  return { x: 200 + lx / u, y: 600 - (p.y - root.y) / u }
}
/** move a point toward the camera along its view ray, so a prop sits in front of the sprite and projects onto the hand */
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** a sprite's frame time for loop time c (the frame on screen), so a prop follows the hand that is drawn */
const frameTime = (c: number, L: number, F: number) => (Math.floor((c / L) * F) % F) * (L / F)

/* ================================================================== the shared ground plan and beats */

const L = 6.9
const HOLD = 1.75
const F = 96
const P = {
  wallZ: -0.6,
  /* the locker bank / the vault wall: four columns, three rows, against the back wall */
  bankX0: -0.86,
  colW: 0.38,
  pitch: 0.4,
  cols: 4,
  rowY: [0.12, 0.66, 1.2],
  rowH: 0.5,
  bankTop: 1.74,
  bankFront: -0.14,
  /* the rented locker / the imported key's compartment: column 0, the middle row */
  door: { col: 0, row: 1 },
  openAngle: 100 * DEG,
  /* the counter (everyday) / the KMS counter (concept) */
  counterX0: 0.88,
  counterX1: 1.68,
  counterZ0: -0.1,
  counterZ1: 0.34,
  counterH: 0.98,
  tray: new THREE.Vector3(1.05, 0.985, 0.13),
  offer: new THREE.Vector3(0.84, 1.17, 0.26),
  /* people (everyday) */
  customer: new THREE.Vector3(-1.02, 0, 0.3),
  attendant: new THREE.Vector3(1.34, 0, -0.36),
  hC: 1.74,
  hA: 1.6,
}
const colX = (i: number) => P.bankX0 + 0.02 + P.colW / 2 + i * P.pitch
const DOOR_X = colX(P.door.col)
const DOOR_Y = P.rowY[P.door.row] + P.rowH / 2
const HINGE_X = DOOR_X + P.colW / 2 // the hinge on the door's right edge
const LOCK = new THREE.Vector3(DOOR_X - P.colW / 2 + 0.06, DOOR_Y + 0.04, P.bankFront + 0.02)
const LOCK_FRONT = LOCK.clone().add(new THREE.Vector3(0, 0, 0.13))
const BANK_X1 = P.bankX0 + P.cols * P.pitch + 0.02
const CAM = { pos: [0.12, 1.8, 5.3] as [number, number, number], at: [0.08, 1.02, -0.3] as [number, number, number], fov: 34 }
/* the beats (seconds into the loop) */
const B = {
  pick: [0.25, 0.6] as [number, number], // her hand to the tray, the key in it
  offer: [0.6, 1.05] as [number, number], // held out
  decline: [1.05, 1.95] as [number, number], // he shakes his head and shows his own key
  back: [1.95, 2.55] as [number, number], // her key back on the tray
  rest: [2.55, 2.9] as [number, number], // her hand back down
  reach: [1.95, 2.55] as [number, number], // his key to the lock
  turn: [2.55, 2.85] as [number, number], // unlock
  out: [2.85, 3.1] as [number, number], // key out
  open: [3.0, 3.6] as [number, number], // the door swings open
  look: [3.6, 4.6] as [number, number], // inside: the bag / the material settles
  toDoor: [4.4, 4.75] as [number, number], // his hand to the door's edge
  shut: [4.8, 5.4] as [number, number], // the door swings shut
  lockIn: [5.4, 5.55] as [number, number], // key back in the lock
  lock: [5.6, 5.9] as [number, number], // lock
  home: [5.95, 6.5] as [number, number], // the key ring back at his side
}
const doorAngle = (c: number) => P.openAngle * seg(c, B.open[0], B.open[1]) * (1 - seg(c, B.shut[0], B.shut[1]))
/** the door's free edge (where the lock is), in the scene, for a swing angle */
function doorEdge(a: number, out: THREE.Vector3) {
  const w = P.colW - 0.06
  return out.set(HINGE_X - w * Math.cos(a), DOOR_Y + 0.04, P.bankFront + 0.02 + w * Math.sin(a))
}

/** the turn of the key in the lock (radians about its blade), unlock then lock */
const keyTurn = (c: number) => (Math.PI / 2) * (hold(c, B.turn[0], B.turn[1], B.out[0], B.out[0] + 0.12) + hold(c, B.lock[0], B.lock[1], B.home[0], B.home[0] + 0.12))

/* ------------------------------------------------------------------ shared props */

/** a key: a ring bow, a blade along +x, two teeth; the tip at x 0.118 */
function makeKey(m: THREE.Material, s = 1) {
  const g = new THREE.Group()
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 12, 28), m)
  g.add(bow)
  g.add(box(0.09, 0.013, 0.006, m, [0.064, 0, 0]))
  g.add(box(0.012, 0.016, 0.006, m, [0.086, -0.013, 0]), box(0.012, 0.012, 0.006, m, [0.104, -0.011, 0]))
  g.scale.setScalar(s)
  return noShadow(g)
}
/** the bank's back, frame and the closed doors (all but the one in `skip`), the same plan on both cards */
function bankShell(St: THREE.Group, body: THREE.Material, doorFace: (i: number, r: number) => THREE.Material, skip: { col: number; row: number }) {
  const x0 = P.bankX0
  const x1 = BANK_X1
  const back = P.wallZ
  const front = P.bankFront
  const d = front - back
  const zc = (front + back) / 2
  /* plinth, top cap, sides and the dividers between the columns */
  St.add(box(x1 - x0, 0.1, d, body, [(x0 + x1) / 2, 0.05, zc]))
  St.add(box(x1 - x0 + 0.04, 0.06, d + 0.03, body, [(x0 + x1) / 2, P.bankTop + 0.03, zc + 0.01], 0.01))
  for (let i = 0; i <= P.cols; i++) St.add(box(0.02, P.bankTop - 0.1, d, body, [x0 + 0.01 + i * P.pitch, (P.bankTop + 0.1) / 2, zc]))
  for (const y of [...P.rowY, P.rowY[2] + P.rowH + 0.02]) St.add(box(x1 - x0, 0.02, d, body, [(x0 + x1) / 2, y - 0.02, zc]))
  for (let i = 0; i < P.cols; i++)
    for (let r = 0; r < 3; r++) {
      if (i === skip.col && r === skip.row) continue
      St.add(plane(P.colW - 0.02, P.rowH - 0.02, doorFace(i, r), [colX(i), P.rowY[r] + P.rowH / 2, front + 0.002]))
    }
}
/** the open compartment behind the moving door: dark walls and floor */
function compartment(St: THREE.Group, inner: THREE.Material) {
  const y0 = P.rowY[P.door.row]
  const back = P.wallZ + 0.02
  const front = P.bankFront
  const d = front - back
  St.add(box(P.colW, 0.01, d, inner, [DOOR_X, y0 + 0.005, (front + back) / 2]))
  St.add(box(P.colW, P.rowH, 0.01, inner, [DOOR_X, y0 + P.rowH / 2, back]))
  St.add(box(P.colW, 0.01, d, inner, [DOOR_X, y0 + P.rowH - 0.005, (front + back) / 2]))
  St.add(box(0.01, P.rowH, d, inner, [DOOR_X - P.colW / 2 + 0.005, y0 + P.rowH / 2, (front + back) / 2]))
  St.add(box(0.01, P.rowH, d, inner, [DOOR_X + P.colW / 2 - 0.005, y0 + P.rowH / 2, (front + back) / 2]))
}
/** the moving door, hinged on its right edge: a leaf, a face, and what sits on it (the lock) */
function makeDoor(leaf: THREE.Material, face: THREE.Material) {
  const hinge = new THREE.Group()
  hinge.position.set(HINGE_X - 0.01, DOOR_Y, P.bankFront + 0.012)
  const w = P.colW - 0.02
  hinge.add(box(w, P.rowH - 0.02, 0.02, leaf, [-w / 2, 0, 0], 0.004))
  hinge.add(plane(w, P.rowH - 0.02, face, [-w / 2, 0, 0.0105]))
  return hinge
}
/** the service counter (or the KMS counter): a body, a top, a kick plate */
function counter(St: THREE.Group, body: THREE.Material, top: THREE.Material, front: THREE.Material) {
  const { counterX0: x0, counterX1: x1, counterZ0: z0, counterZ1: z1, counterH: h } = P
  St.add(box(x1 - x0, h - 0.05, z1 - z0 - 0.04, body, [(x0 + x1) / 2, (h - 0.05) / 2, (z0 + z1) / 2 - 0.02]))
  St.add(box(x1 - x0 + 0.06, 0.05, z1 - z0 + 0.04, top, [(x0 + x1) / 2, h - 0.025, (z0 + z1) / 2], 0.012))
  St.add(box(x1 - x0 - 0.08, h - 0.22, 0.012, front, [(x0 + x1) / 2, (h - 0.05) / 2 + 0.04, z1 - 0.035]))
}
/** the small tray on the counter */
function tray(St: THREE.Group, m: THREE.Material) {
  const T = P.tray
  St.add(box(0.2, 0.012, 0.14, m, [T.x, P.counterH + 0.006, T.z], 0.005))
  St.add(box(0.2, 0.02, 0.01, m, [T.x, P.counterH + 0.016, T.z - 0.065]), box(0.2, 0.02, 0.01, m, [T.x, P.counterH + 0.016, T.z + 0.065]))
}
/** the board of spare keys on the wall behind the counter: a panel, hooks, keys with teal fobs */
function keyBoard(St: THREE.Group, panel: THREE.Material, keyM: THREE.Material, fobM: THREE.Material) {
  const cx = P.attendant.x
  const cy = 1.98
  const z = P.wallZ + 0.015
  St.add(box(0.66, 0.34, 0.03, panel, [cx, cy, z], 0.02))
  for (let i = 0; i < 5; i++) {
    const x = cx - 0.24 + i * 0.12
    St.add(cyl(0.006, 0.006, 0.03, keyM, [x, cy + 0.1, z + 0.03], 8).rotateX(Math.PI / 2))
    if (i === 1) continue // this hook's key is the one on the counter
    St.add(box(0.012, 0.09, 0.006, keyM, [x, cy + 0.03, z + 0.03]))
    St.add(box(0.05, 0.07, 0.01, fobM, [x, cy - 0.06, z + 0.03], 0.01))
  }
}
/** the facility key (everyday) / the AWS-generated key (concept): a silver key on a teal fob */
function makeFobKey(keyM: THREE.Material, fobM: THREE.Material) {
  const g = new THREE.Group()
  const k = makeKey(keyM, 1.05)
  g.add(k)
  const fob = box(0.05, 0.075, 0.012, fobM, [-0.055, 0, 0], 0.012)
  fob.rotation.z = Math.PI / 2
  g.add(fob)
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 18), keyM).translateX(-0.026))
  return noShadow(g)
}

/* ================================================================== the everyday card: a locker facility */

function setupFacility(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F1EEE8')
  setCamera(camera, CAM.pos, CAM.at, CAM.fov)
  lightRig(scene, [0, 0, -0.4])
  const St = new THREE.Group()
  const wz = P.wallZ

  /* the floor (pale tiles), the back wall (warm white) with a grey skirting */
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: tileTex('#E3DED6', '#CFC8BD', [14, 12]), roughness: 0.45 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const wall = mat('#F6F1EA', { roughness: 0.95, emissive: new THREE.Color('#F6F1EA'), emissiveIntensity: 0.3 })
  St.add(box(10, 3.6, 0.1, wall, [0, 1.8, wz - 0.05]))
  St.add(box(10, 0.1, 0.03, mat('#9AA3B2', { roughness: 0.5 }), [0, 0.05, wz + 0.015]))

  /* the street entrance on the left, behind the customer: a glass door in a dark frame, daylight beyond */
  const ex = -1.86
  const frameM = mat('#3B4256', { roughness: 0.4, metalness: 0.5 })
  St.add(box(0.06, 2.1, 0.06, frameM, [ex - 0.43, 1.05, wz + 0.02]), box(0.06, 2.1, 0.06, frameM, [ex + 0.43, 1.05, wz + 0.02]))
  St.add(box(0.92, 0.06, 0.06, frameM, [ex, 2.1, wz + 0.02]))
  St.add(box(0.8, 2.04, 0.01, glow('#D6EBFA'), [ex, 1.02, wz + 0.004]))
  St.add(box(0.02, 2.04, 0.03, frameM, [ex, 1.02, wz + 0.02]))
  for (const sx of [-0.12, 0.12]) St.add(box(0.025, 0.3, 0.03, mat('#C9D3E6', { metalness: 0.7, roughness: 0.25 }), [ex + sx, 1.0, wz + 0.05], 0.01))
  /* a doormat */
  const matT = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), mat('#6B5E52', { roughness: 1 }))
  matT.rotation.x = -Math.PI / 2
  matT.position.set(ex, 0.003, wz + 0.4)
  matT.receiveShadow = true
  scene.add(matT)

  /* the wall of rental lockers: a light grey frame, blue doors with vents and a blank number disc */
  const body = mat('#D7DDE7', { roughness: 0.45, metalness: 0.35 })
  const doorFaces = ['#3F6FD8', '#4A79DE'].map((c) => new THREE.MeshStandardMaterial({ map: lockerDoorTex(c, '#2A4FA8', '#F5F7FB'), roughness: 0.45, metalness: 0.2 }))
  bankShell(St, body, (i, r) => doorFaces[(i + r) % 2], P.door)
  for (let i = 0; i < P.cols; i++)
    for (let r = 0; r < 3; r++) {
      if (i === P.door.col && r === P.door.row) continue
      const lx = colX(i) - P.colW / 2 + 0.06
      St.add(cyl(0.017, 0.017, 0.02, mat(C.brass, { metalness: 0.75, roughness: 0.3 }), [lx, P.rowY[r] + P.rowH / 2 + 0.04, P.bankFront + 0.012], 18).rotateX(Math.PI / 2))
    }
  compartment(St, mat('#4B5468', { roughness: 0.8, emissive: new THREE.Color('#4B5468'), emissiveIntensity: 0.25 }))

  /* the service counter: wood top, cream body, a teal band; the tray; the key board behind */
  const wood = mat('#B7835A', { roughness: 0.5 })
  counter(St, mat('#EFE7DA', { roughness: 0.7 }), wood, mat('#1FA5A0', { roughness: 0.5 }))
  tray(St, mat('#9AA3B2', { metalness: 0.6, roughness: 0.3 }))
  const silver = mat('#C9D0DB', { metalness: 0.85, roughness: 0.25 })
  const fobM = mat('#1FA5A0', { roughness: 0.4 })
  keyBoard(St, wood, silver, fobM)
  scene.add(bake(St))

  /* the customer's bag in his locker: a green backpack with a front pocket and a strap */
  const bagM = mat('#3E8E6A', { roughness: 0.75 })
  const Bg = new THREE.Group()
  Bg.add(box(0.26, 0.3, 0.16, bagM, [DOOR_X, P.rowY[1] + 0.16, -0.38], 0.06))
  Bg.add(box(0.18, 0.13, 0.04, mat('#357A5B', { roughness: 0.8 }), [DOOR_X, P.rowY[1] + 0.11, -0.29], 0.03))
  Bg.add(box(0.1, 0.03, 0.03, mat('#2C2F3A'), [DOOR_X, P.rowY[1] + 0.33, -0.38], 0.01))
  scene.add(bake(Bg))

  /* the rented locker's door: it swings open on its right hinge; its brass lock on the left edge */
  const hinge = makeDoor(mat('#2F5BC0', { roughness: 0.45, metalness: 0.2 }), doorFaces[(P.door.col + P.door.row) % 2])
  const lockM = mat(C.brass, { metalness: 0.75, roughness: 0.3 })
  const lockBody = cyl(0.019, 0.019, 0.02, lockM, [LOCK.x - (HINGE_X - 0.01), LOCK.y - DOOR_Y, 0.02], 18)
  lockBody.rotation.x = Math.PI / 2
  hinge.add(lockBody)
  hinge.add(box(0.004, 0.018, 0.004, mat('#2A2E3A'), [LOCK.x - (HINGE_X - 0.01), LOCK.y - DOOR_Y, 0.031]))
  noShadow(hinge)
  scene.add(hinge)

  /* the facility key on its tray */
  const fKey = makeFobKey(silver, fobM)
  scene.add(fKey)
  const onTray = new THREE.Vector3(P.tray.x + 0.02, P.counterH + 0.02, P.tray.z)

  /* the customer's own key ring: a ring, his key (blue cap), two more keys, a leather tag */
  const ring = new THREE.Group()
  const ringM = mat('#B9C2CF', { metalness: 0.85, roughness: 0.25 })
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0045, 10, 30), ringM))
  const mainKey = new THREE.Group()
  const mk = makeKey(mat('#D9DEE6', { metalness: 0.85, roughness: 0.22 }), 1.1)
  mainKey.add(mk)
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.011, 10, 24), mat(C.brand, { roughness: 0.35 }))
  cap.scale.setScalar(1.1)
  mainKey.add(cap)
  mainKey.position.x = 0.026
  ring.add(mainKey)
  const k2 = makeKey(mat(C.brass, { metalness: 0.8, roughness: 0.28 }), 0.85)
  k2.position.set(-0.02, -0.02, -0.004)
  k2.rotation.z = -2.0
  ring.add(k2)
  const k3 = makeKey(mat('#AEB6C2', { metalness: 0.8, roughness: 0.3 }), 0.8)
  k3.position.set(-0.024, 0.006, 0.004)
  k3.rotation.z = 2.5
  ring.add(k3)
  const tag = box(0.03, 0.05, 0.008, mat('#8A5A3B', { roughness: 0.7 }), [0.0, -0.05, 0.006], 0.008)
  ring.add(tag)
  noShadow(ring)
  scene.add(ring)

  /* ---- the customer ---- */
  const C_ = P.customer
  const shC = buildSkin(CUSTOMER).shoulderHalf
  const CARRY: Pt = { x: 252, y: 352 }
  const SHOW: Pt = { x: 300, y: 282 }
  const aCarry = solveR(shC, CARRY)
  const aShow = solveR(shC, SHOW, true)
  const aLock = solveR(shC, worldToRig(LOCK_FRONT, C_, P.hC, camera), true)
  const aOut = solveR(shC, worldToRig(LOCK_FRONT.clone().add(new THREE.Vector3(-0.05, -0.04, 0.08)), C_, P.hC, camera), true)
  const edge = new THREE.Vector3()
  /* his hand on the door's edge while it swings shut: solved per frame from the edge */
  const aEdge = (a: number) => solveR(shC, worldToRig(doorEdge(a, edge).clone().add(new THREE.Vector3(0, 0, 0.06)), C_, P.hC, camera), true)
  const armC = (c: number): Ang => {
    if (c >= B.toDoor[1] && c < B.shut[1]) return aEdge(doorAngle(c))
    if (c >= B.toDoor[0] && c < B.toDoor[1]) {
      const k = seg(c, B.toDoor[0], B.toDoor[1])
      const e = aEdge(P.openAngle)
      return { s: mix(aCarry.s, e.s, k), e: mix(aCarry.e, e.e, k) }
    }
    return angAt(c, [
      [B.decline[0] + 0.15, aCarry],
      [B.decline[0] + 0.5, aShow],
      [B.decline[1], aShow],
      [B.reach[1], aLock],
      [B.out[0], aLock],
      [B.out[1], aOut],
      [B.open[1], aCarry],
      [B.toDoor[0], aCarry],
      [B.shut[1], aLock],
      [B.lockIn[1], aLock],
      [B.home[0], aLock],
      [B.home[1], aCarry],
    ])
  }
  const FACES_C: [number, string][] = [
    [0, 'neutral'],
    [0.5, 'listening'],
    [B.decline[0] + 0.05, 'happy'],
    [B.reach[0] + 0.1, 'thinking'],
    [B.look[0] - 0.1, 'proud'],
    [B.toDoor[0] + 0.1, 'thinking'],
    [B.home[0], 'happy'],
  ]
  const customer = castSprite({
    config: CUSTOMER,
    loop: L,
    frames: F,
    height: P.hC,
    wide: 70,
    shadow: 0.2,
    adaptive: true,
    onReady: redraw,
    timeline: timeline(451, L, FACES_C),
    pose: (p: Pose, c: number) => {
      const a = armC(c)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.wristR = -6
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = 0.62
      p.tR = 0.55
      /* the left hand relaxed at his side */
      p.shoulderL = 6
      p.elbowL = 8
      /* eyes on the locker by default (to his right), toward her as she offers, a shake of the head */
      to(p, 'headTurn', 0.32, 1)
      to(p, 'lookX', 0.7, 1)
      const toHer = hold(c, 0.45, 0.75, B.decline[1] - 0.1, B.decline[1] + 0.15)
      to(p, 'headTurn', 0.5, toHer)
      to(p, 'lookX', 1, toHer)
      to(p, 'lookY', -0.1, toHer)
      const shake = hold(c, B.decline[0], B.decline[0] + 0.1, B.decline[0] + 0.6, B.decline[0] + 0.7)
      p.headTurn += shake * 0.22 * Math.sin((c - B.decline[0]) * TAU * 2.6)
      /* at the lock and the open locker: eyes down at it, a small lean in */
      const atLock = hold(c, B.reach[0] + 0.1, B.reach[1], B.look[1] + 0.3, B.home[1])
      to(p, 'headNod', 0.18, atLock)
      to(p, 'lookY', 0.35, atLock)
      to(p, 'lean', 2.5, atLock)
      /* looking into the open locker: a nod at the bag */
      const nod = hold(c, B.look[0], B.look[0] + 0.15, B.look[1] - 0.2, B.look[1])
      p.headNod += nod * 0.08 * Math.sin((c - B.look[0]) * TAU * 1.4)
    },
  })
  customer.object.position.copy(C_)
  scene.add(customer.object)

  /* ---- the attendant ---- */
  const A_ = P.attendant
  const shA = buildSkin(ATTENDANT).shoulderHalf
  const aRestA: Ang = { s: 10, e: 30 }
  const aTray = solveLDown(shA, worldToRig(onTray.clone().add(new THREE.Vector3(0, 0.07, 0)), A_, P.hA, camera))
  const aOffer = solveLDown(shA, worldToRig(P.offer, A_, P.hA, camera))
  const armKeysA: [number, Ang][] = [
    [B.pick[0], aRestA],
    [B.pick[1], aTray],
    [B.pick[1] + 0.05, aTray],
    [B.offer[1], aOffer],
    [B.back[0], aOffer],
    [B.back[1], aTray],
    [B.back[1] + 0.05, aTray],
    [B.rest[1], aRestA],
  ]
  const armA = (c: number) => angAt(c, armKeysA)
  const holdingA = (c: number) => c >= B.pick[1] && c < B.back[1]
  const FACES_A: [number, string][] = [
    [0, 'listening'],
    [B.pick[0], 'happy'],
    [B.decline[0] + 0.2, 'surprised'],
    [B.decline[0] + 0.6, 'happy'],
    [B.rest[1], 'listening'],
  ]
  const attendant = castSprite({
    config: ATTENDANT,
    dress: withTop(UNIFORM),
    loop: L,
    frames: F,
    height: P.hA,
    wide: 70,
    shadow: 0.18,
    adaptive: true,
    onReady: redraw,
    timeline: timeline(452, L, FACES_A),
    pose: (p: Pose, c: number) => {
      const a = armA(c)
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -6
      const g = holdingA(c) ? 1 : 0.3
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = 0.62 * g
      p.tL = 0.55 * g
      /* the other hand resting on the counter */
      p.shoulderR = 14
      p.elbowR = 40
      /* she looks at the customer; down at the tray as she picks the key up and puts it back */
      to(p, 'headTurn', -0.42, 1)
      to(p, 'lookX', -0.85, 1)
      const atTray = hold(c, B.pick[0], B.pick[0] + 0.15, B.pick[1], B.pick[1] + 0.15) + hold(c, B.back[1] - 0.25, B.back[1] - 0.1, B.back[1] + 0.05, B.back[1] + 0.2)
      to(p, 'headNod', 0.25, atTray)
      to(p, 'lookY', 0.6, atTray)
      /* a friendly nod once he shows his own key */
      const ok = hold(c, B.decline[0] + 0.6, B.decline[0] + 0.7, B.decline[1], B.decline[1] + 0.15)
      p.headNod += ok * 0.1 * Math.sin((c - B.decline[0] - 0.6) * TAU * 1.6)
    },
  })
  attendant.object.position.copy(A_)
  scene.add(attendant.object)

  const hand = new THREE.Vector3()
  const qCarry = new THREE.Quaternion()
  const qLock = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
  const qTmp = new THREE.Quaternion()
  return (t: number) => {
    const c = mod(t, L)
    customer.update(c, camera)
    attendant.update(c, camera)
    hinge.rotation.y = doorAngle(c)
    const cf = frameTime(c, L, F)
    /* the facility key: on the tray, or in her hand */
    if (holdingA(cf)) {
      rigToWorld(fkL(shA, armA(cf)), P.hA, A_, camera, hand)
      towardCamera(hand, camera, 0.1)
      fKey.position.copy(hand)
      fKey.quaternion.copy(camera.quaternion)
      fKey.rotateZ(Math.PI + 0.35)
    } else {
      fKey.position.copy(onTray)
      fKey.rotation.set(-Math.PI / 2, 0, 0.4)
    }
    /* his key ring: in his hand; into the lock (blade into the door) while it unlocks and locks */
    rigToWorld(fkR(shC, armC(cf)), P.hC, C_, camera, hand)
    towardCamera(hand, camera, 0.1)
    const inLock = hold(cf, B.reach[1] - 0.12, B.reach[1], B.out[0], B.out[1]) + hold(cf, B.lockIn[0], B.lockIn[1], B.home[0], B.home[0] + 0.2)
    const atDoor = hold(cf, B.toDoor[1] - 0.05, B.toDoor[1], B.shut[1], B.lockIn[0])
    qCarry.copy(camera.quaternion).multiply(qTmp.setFromEuler(new THREE.Euler(0, 0, -1.25 + 0.5 * hold(cf, B.decline[0] + 0.2, B.decline[0] + 0.5, B.decline[1], B.reach[1]))))
    ring.quaternion.slerpQuaternions(qCarry, qLock, inLock)
    ring.rotateX(keyTurn(cf))
    const lockSpot = LOCK.clone().add(new THREE.Vector3(0, 0, 0.026 + 0.118 * 1.1 + 0.026))
    ring.position.copy(hand).lerp(lockSpot, inLock)
    if (atDoor > 0) ring.position.z += 0.02 * atDoor
  }
}

/* ================================================================== the concept card: BYOK into AWS KMS */

/** the on-premises HSM: a rugged 2U appliance with bumpers and handles, its front panel, a padlock seal */
function makeHsm() {
  const g = new THREE.Group()
  const body = mat('#2E3448', { roughness: 0.4, metalness: 0.5 })
  g.add(box(0.5, 0.18, 0.4, body, [0, 0, 0], 0.02))
  g.add(plane(0.46, 0.165, flat(hsmFaceTex(), { transparent: false }), [0, 0, 0.2015]))
  const bump = mat('#F2C14E', { roughness: 0.55 })
  for (const sx of [-1, 1]) {
    g.add(box(0.04, 0.2, 0.06, bump, [sx * 0.255, 0, 0.18], 0.012))
    g.add(box(0.04, 0.2, 0.06, bump, [sx * 0.255, 0, -0.18], 0.012))
    /* carry handles */
    g.add(box(0.012, 0.12, 0.012, mat('#C9D0DB', { metalness: 0.8, roughness: 0.25 }), [sx * 0.22, 0, 0.225]))
    g.add(box(0.012, 0.012, 0.03, mat('#C9D0DB', { metalness: 0.8, roughness: 0.25 }), [sx * 0.22, 0.055, 0.212]))
    g.add(box(0.012, 0.012, 0.03, mat('#C9D0DB', { metalness: 0.8, roughness: 0.25 }), [sx * 0.22, -0.055, 0.212]))
  }
  /* the padlock seal on the front, centred: a brass body, a steel shackle */
  const lockG = new THREE.Group()
  lockG.position.set(-0.03, -0.012, 0.215)
  lockG.add(box(0.05, 0.042, 0.018, mat(C.brass, { metalness: 0.75, roughness: 0.3 }), [0, 0, 0], 0.008))
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0045, 10, 20, Math.PI), mat('#C9D0DB', { metalness: 0.85, roughness: 0.22 }))
  shackle.position.y = 0.021
  lockG.add(shackle)
  lockG.add(box(0.006, 0.012, 0.004, mat('#2A2E3A'), [0, -0.004, 0.0095]))
  g.add(lockG)
  return g
}

function setupKms(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCamera(camera, CAM.pos, CAM.at, CAM.fov)
  lightRig(scene, [0, 0, -0.4])
  const St = new THREE.Group()
  const wz = P.wallZ
  const SPLIT = -0.98 // where the on-premises building ends and AWS begins

  /* AWS: pale blue floor tiles and a cool white wall; the building: a warm concrete floor and a brick wall */
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: tileTex('#E4EAF4', '#C9D3E6', [14, 12]), roughness: 0.45 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const wall = mat('#EDF2FB', { roughness: 0.85, emissive: new THREE.Color('#EDF2FB'), emissiveIntensity: 0.45 })
  St.add(box(10, 3.6, 0.1, wall, [SPLIT + 5, 1.8, wz - 0.05]))
  St.add(box(10, 0.1, 0.03, mat('#5E6B86', { roughness: 0.4, metalness: 0.4 }), [SPLIT + 5, 0.05, wz + 0.015]))

  /* the on-premises building: a floor slab, a brick back wall with a gable, a roof edge, a corner pillar */
  const slabM = mat('#CFC6BA', { roughness: 0.85 })
  const bx0 = -1.95
  St.add(box(SPLIT - bx0, 0.05, 1.6, slabM, [(bx0 + SPLIT) / 2, 0.025, wz + 0.8]))
  const brick = new THREE.MeshStandardMaterial({ map: brickTex(), roughness: 0.9, emissive: new THREE.Color('#D9D2C8'), emissiveIntensity: 0.12 })
  const bw = SPLIT - bx0
  St.add(box(bw, 1.95, 0.08, brick, [(bx0 + SPLIT) / 2, 0.975, wz + 0.04]))
  const gable = new THREE.Shape()
  gable.moveTo(bx0, 1.95)
  gable.lineTo(SPLIT, 1.95)
  gable.lineTo(SPLIT, 1.95)
  gable.lineTo((bx0 + SPLIT) / 2, 2.36)
  gable.lineTo(bx0, 1.95)
  gable.closePath()
  const gableMesh = mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.08, bevelEnabled: false }), brick)
  gableMesh.position.z = wz
  St.add(gableMesh)
  const roofM = mat('#5A6478', { roughness: 0.6 })
  /* the roof: two slopes from the eaves to the ridge, reaching forward over the rack (a cut-away building) */
  const ridge = new THREE.Vector2((bx0 + SPLIT) / 2, 2.36)
  for (const ex of [bx0, SPLIT]) {
    const len = Math.hypot(ridge.x - ex, ridge.y - 1.95) + 0.12
    const r = box(len, 0.07, 0.8, roofM, [(ex + ridge.x) / 2 + Math.sign(ex - ridge.x) * 0.05, (1.95 + ridge.y) / 2 + 0.05, wz + 0.4], 0.02)
    r.rotation.z = Math.atan2(ridge.y - 1.95, ridge.x - ex)
    St.add(r)
  }
  St.add(box(0.1, 2.12, 0.1, mat('#B8674A', { roughness: 0.85 }), [SPLIT - 0.05, 1.06, wz + 0.09]))

  /* the rack in the building: posts, two plain servers, the HSM in the middle at hand height */
  const RX = -1.42
  const RZ = -0.02
  const rackM = mat('#2A3042', { roughness: 0.45, metalness: 0.5 })
  for (const sx of [-0.25, 0.25]) for (const sz of [-0.19, 0.19]) St.add(box(0.03, 1.45, 0.03, rackM, [RX + sx, 0.775, RZ + sz]))
  St.add(box(0.54, 0.04, 0.42, rackM, [RX, 1.5, RZ]), box(0.54, 0.05, 0.42, rackM, [RX, 0.075, RZ]))
  const sTex = serverFaceTex()
  for (const y of [0.42, 0.6, 1.3]) {
    St.add(box(0.46, 0.085, 0.36, mat('#3A4256', { roughness: 0.45, metalness: 0.4 }), [RX, y, RZ - 0.01]))
    St.add(plane(0.44, 0.075, flat(sTex, { transparent: false }), [RX, y, RZ + 0.171]))
  }
  scene.add(bake(St))
  const hsm = makeHsm()
  const HSM_Y = 0.97
  hsm.position.set(RX, HSM_Y, RZ - 0.02)
  hsm.scale.set(0.84, 1, 0.9)
  noShadow(hsm)
  scene.add(hsm)
  /* the HSM's lights (they come on as it makes the key) and its glow */
  const hsmLeds = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), glow('#3A4560'))
    m.position.set(RX + 0.025 + i * 0.022, HSM_Y - 0.05, RZ + 0.165)
    scene.add(m)
    return m
  })
  const ledOn = glow('#7FD8FF')
  const ledOff = glow('#3A4560')
  const hsmHalo = halo(C.keyBlue, 0.22)
  hsmHalo.mesh.position.set(RX + 0.14, HSM_Y, RZ + 0.2)
  scene.add(hsmHalo.mesh)
  const SLOT = new THREE.Vector3(RX + 0.15, HSM_Y - 0.002, RZ + 0.17)

  /* the KMS vault: a steel wall of key compartments (the lockers' plan), round-cornered doors with a dial */
  const steel = mat('#C3CBD8', { roughness: 0.4, metalness: 0.45 })
  const Vt = new THREE.Group()
  const vDoorTex = canvasTex(92, 100, (g) => {
    g.fillStyle = '#A9B4C6'
    g.fillRect(0, 0, 92, 100)
    g.strokeStyle = 'rgba(255,255,255,0.35)'
    g.lineWidth = 2.5
    rrect(g, 6, 6, 80, 88, 8)
    g.stroke()
    g.fillStyle = '#6F7C93'
    g.beginPath()
    g.arc(46, 50, 13, 0, TAU)
    g.fill()
    g.fillStyle = '#C9D0DB'
    g.beginPath()
    g.arc(46, 50, 7, 0, TAU)
    g.fill()
  })
  const vFace = new THREE.MeshStandardMaterial({ map: vDoorTex, roughness: 0.35, metalness: 0.5 })
  bankShell(Vt, steel, () => vFace, P.door)
  compartment(Vt, mat('#1F2E63', { roughness: 0.6, emissive: new THREE.Color('#1F2E63'), emissiveIntensity: 0.35 }))
  /* the slot inside the compartment, where the imported material settles: a dark cradle with a lit rim */
  const y0 = P.rowY[1]
  Vt.add(box(0.3, 0.06, 0.16, mat('#2C3E7E', { roughness: 0.5 }), [DOOR_X, y0 + 0.04, -0.4], 0.01))
  /* the KMS mark on its white tile, on the wall above the vault */
  const tileY = 2.08
  Vt.add(box(0.36, 0.36, 0.04, mat('#FFFFFF', { roughness: 0.35 }), [(P.bankX0 + BANK_X1) / 2, tileY, wz + 0.02], 0.05))

  /* the KMS counter beside the vault (the service counter's place): steel body, white top, a blue band; the tray; a
     board of AWS keys behind */
  counter(Vt, steel, mat('#FFFFFF', { roughness: 0.35 }), mat(C.brand, { roughness: 0.45, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.15 }))
  tray(Vt, mat('#7F8BA0', { metalness: 0.6, roughness: 0.3 }))
  const silver = mat('#C9D0DB', { metalness: 0.85, roughness: 0.25 })
  const fobM = mat('#1FA5A0', { roughness: 0.4 })
  keyBoard(Vt, steel, silver, fobM)
  scene.add(bake(Vt))
  const kms = plane(0.26, 0.26, flat(markTex(kmsUrl, redraw, 512, false)), [(P.bankX0 + BANK_X1) / 2, tileY, wz + 0.042])
  scene.add(kms)
  const slotRim = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), glow(C.keyBlue, 0))
  slotRim.rotation.x = -Math.PI / 2
  slotRim.position.set(DOOR_X, y0 + 0.072, -0.4)
  scene.add(slotRim)

  /* the compartment's door: steel, its keyhole lock on the left edge (a ring that turns and glows) */
  const hinge = makeDoor(mat('#8E9AAE', { roughness: 0.4, metalness: 0.45 }), vFace)
  const lx = LOCK.x - (HINGE_X - 0.01)
  const ly = LOCK.y - DOOR_Y
  const lockRing = new THREE.Group()
  lockRing.position.set(lx, ly, 0.022)
  lockRing.add(cyl(0.024, 0.024, 0.016, mat('#C9D0DB', { metalness: 0.8, roughness: 0.25 }), [0, 0, 0], 24).rotateX(Math.PI / 2))
  lockRing.add(box(0.005, 0.022, 0.004, mat('#1F2E63'), [0, 0, 0.0095]))
  hinge.add(lockRing)
  const ringGlowM = glow(C.keyBlue, 0)
  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.0045, 10, 36), ringGlowM)
  ringGlow.position.set(lx, ly, 0.03)
  hinge.add(ringGlow)
  const lockHalo = halo(C.keyBlue, 0.09)
  lockHalo.mesh.position.set(lx, ly, 0.035)
  hinge.add(lockHalo.mesh)
  noShadow(hinge)
  scene.add(hinge)

  /* the AWS-generated key on the tray (teal fob, the facility key's look) */
  const awsKey = makeFobKey(silver, fobM)
  scene.add(awsKey)
  const onTray = new THREE.Vector3(P.tray.x + 0.02, P.counterH + 0.02, P.tray.z)

  /* the robot arm (the attendant's place): a base on the counter, a turret, two links, a gripper */
  const armWhite = mat('#FFFFFF', { roughness: 0.3, metalness: 0.1 })
  const armDark = mat('#2C3E7E', { roughness: 0.35, metalness: 0.3 })
  const base = new THREE.Group()
  base.position.set(P.attendant.x, P.counterH, -0.02)
  base.add(cyl(0.11, 0.13, 0.05, armDark, [0, 0.025, 0], 32))
  const turret = new THREE.Group()
  turret.position.y = 0.05
  base.add(turret)
  turret.add(cyl(0.07, 0.08, 0.12, armWhite, [0, 0.06, 0], 28))
  const SH_Y = 0.15
  const L1 = 0.42
  const L2 = 0.4
  const upper = new THREE.Group()
  upper.position.y = SH_Y
  turret.add(upper)
  upper.add(mesh(new THREE.SphereGeometry(0.055, 20, 14), armDark))
  upper.add(box(L1, 0.07, 0.07, armWhite, [L1 / 2, 0, 0], 0.03))
  const fore = new THREE.Group()
  fore.position.x = L1
  upper.add(fore)
  fore.add(mesh(new THREE.SphereGeometry(0.048, 20, 14), armDark))
  fore.add(box(L2, 0.055, 0.055, armWhite, [L2 / 2, 0, 0], 0.025))
  const grip = new THREE.Group()
  grip.position.x = L2
  fore.add(grip)
  grip.add(cyl(0.035, 0.035, 0.03, armDark, [0, 0, 0], 20).rotateZ(Math.PI / 2))
  const fingers = [-1, 1].map((s) => {
    const f = box(0.05, 0.012, 0.012, armDark, [0.035, 0, s * 0.016], 0.004)
    grip.add(f)
    return f
  })
  const armLed = new THREE.Mesh(new THREE.CircleGeometry(0.014, 16), glow('#7FD8FF'))
  armLed.position.set(0, 0.11, 0.081)
  turret.add(armLed)
  noShadow(base)
  scene.add(base)
  const shoulderW = new THREE.Vector3(P.attendant.x, P.counterH + 0.05 + SH_Y, -0.02)
  const REST_PT = new THREE.Vector3(P.attendant.x - 0.14, 1.56, 0.0)
  const TRAY_PT = onTray.clone().add(new THREE.Vector3(0, 0.07, 0))
  /** aim the arm so the gripper is at `p` (elbow up) */
  const aim = (p: THREE.Vector3) => {
    const dx = p.x - shoulderW.x
    const dz = p.z - shoulderW.z
    const dy = p.y - shoulderW.y
    turret.rotation.y = Math.atan2(-dz, dx)
    const r = Math.hypot(dx, dz)
    const D = Math.min(Math.hypot(r, dy), L1 + L2 - 0.001)
    const a1 = Math.atan2(dy, r) + Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    const ex = L1 * Math.cos(a1)
    const ey = L1 * Math.sin(a1)
    const a2 = Math.atan2(dy - ey, r - ex)
    upper.rotation.z = a1
    fore.rotation.z = a2 - a1
    grip.rotation.z = -a2
  }
  const armPts: [number, THREE.Vector3][] = [
    [B.pick[0], REST_PT],
    [B.pick[1], TRAY_PT],
    [B.pick[1] + 0.05, TRAY_PT],
    [B.offer[1], P.offer],
    [B.back[0], P.offer],
    [B.back[1], TRAY_PT],
    [B.back[1] + 0.05, TRAY_PT],
    [B.rest[1], REST_PT],
  ]
  const armAt = (c: number, out: THREE.Vector3) => {
    if (c <= armPts[0][0]) return out.copy(armPts[0][1])
    for (let i = 1; i < armPts.length; i++)
      if (c <= armPts[i][0]) {
        const k = seg(c, armPts[i - 1][0], armPts[i][0])
        out.lerpVectors(armPts[i - 1][1], armPts[i][1], k)
        /* lift over the counter between the tray and the reach */
        out.y += Math.sin(k * Math.PI) * 0.06
        return out
      }
    return out.copy(armPts[armPts.length - 1][1])
  }

  /* the key material: a glowing key, and the capsule that wraps it in transit (the import token / wrapping key) */
  const keyMatM = new THREE.MeshStandardMaterial({ color: '#9DB8FF', emissive: new THREE.Color(C.keyBlue), emissiveIntensity: 1.1, roughness: 0.3 })
  const KS = 1.7
  const material = makeKey(keyMatM, KS)
  scene.add(material)
  const matHalo = halo(C.keyBlue, 0.17)
  scene.add(matHalo.mesh)
  const capsule = new THREE.Group()
  const glass = new THREE.MeshStandardMaterial({ color: '#CFE0FF', transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.1, depthWrite: false })
  const shell = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 8, 24), glass)
  shell.rotation.z = Math.PI / 2
  shell.renderOrder = 3
  capsule.add(shell)
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 10, 32), mat(C.brand, { roughness: 0.35, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.3 }))
  band.rotation.y = Math.PI / 2
  capsule.add(band)
  const clasp = box(0.03, 0.026, 0.012, mat(C.brass, { metalness: 0.75, roughness: 0.3 }), [0, 0.082, 0], 0.006)
  capsule.add(clasp)
  noShadow(capsule)
  scene.add(capsule)

  /* where the material is through the loop */
  const OUT = SLOT.clone().add(new THREE.Vector3(0.02, 0.0, 0.16)) // out of the HSM, in front of its slot
  const KEYHOLE = LOCK.clone().add(new THREE.Vector3(0, 0, 0.03 + 0.118 * KS * 0.5))
  const PULLED = LOCK_FRONT.clone().add(new THREE.Vector3(0.02, 0.03, 0.05))
  const INSLOT = new THREE.Vector3(DOOR_X - 0.1, y0 + 0.16, -0.36)
  const CTRL = new THREE.Vector3((OUT.x + KEYHOLE.x) / 2, 1.62, 0.25)
  const qFly = new THREE.Quaternion() // blade to the right
  const qIn = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)) // blade into the door
  const qLie = new THREE.Quaternion() // standing in the slot, its face to the room
  const T = {
    emerge: [B.decline[0], B.decline[0] + 0.4] as [number, number],
    wrap: [B.decline[0] + 0.45, B.decline[1] - 0.05] as [number, number],
    fly: [B.reach[0], B.reach[1]] as [number, number],
    unwrap: [B.reach[1] - 0.05, B.turn[0] + 0.15] as [number, number],
    settle: [B.open[0] + 0.3, B.look[0] + 0.3] as [number, number],
  }
  const p0 = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const grabbed = new THREE.Vector3()
  const bez = (k: number, out: THREE.Vector3) => {
    const a = (1 - k) * (1 - k)
    const b = 2 * (1 - k) * k
    const d = k * k
    return out.set(a * OUT.x + b * CTRL.x + d * KEYHOLE.x, a * OUT.y + b * CTRL.y + d * KEYHOLE.y, a * OUT.z + b * CTRL.z + d * KEYHOLE.z)
  }

  return (t: number) => {
    const c = mod(t, L)
    /* the arm and the AWS key */
    armAt(c, grabbed)
    aim(grabbed)
    const holding = c >= B.pick[1] && c < B.back[1]
    fingers.forEach((f, i) => (f.position.z = (i ? 1 : -1) * (holding ? 0.012 : 0.022)))
    if (holding) {
      awsKey.position.copy(grabbed).add(new THREE.Vector3(0, -0.035, 0.02))
      awsKey.rotation.set(0, 0, Math.PI + 0.35)
    } else {
      awsKey.position.copy(onTray)
      awsKey.rotation.set(-Math.PI / 2, 0, 0.4)
    }
    armLed.scale.setScalar(1 + 0.25 * Math.sin(c * TAU * 1.5))
    base.position.y = P.counterH

    /* the HSM makes its own key material: lights on, a glow, the key slides out of its slot */
    const making = hold(c, T.emerge[0] - 0.15, T.emerge[0], T.fly[0] + 0.1, T.fly[0] + 0.35)
    hsmLeds.forEach((m, i) => (m.material = making > 0.5 && ((c * 4 + i * 0.33) % 1) < 0.65 ? ledOn : ledOff))
    hsmHalo.mat.opacity = making * (0.55 + 0.15 * Math.sin(c * TAU * 3))

    /* the material's path */
    let vis = true
    let capS = 0
    let ringOn = 0
    if (c < T.emerge[0] || c >= B.shut[1] + 0.05) {
      vis = false
    } else if (c < T.emerge[1]) {
      p0.lerpVectors(SLOT, OUT, seg(c, T.emerge[0], T.emerge[1]))
      material.quaternion.copy(qFly)
    } else if (c < T.fly[0]) {
      p0.copy(OUT)
      p0.y += 0.012 * Math.sin((c - T.emerge[1]) * TAU * 1.5)
      material.quaternion.copy(qFly)
      capS = seg(c, T.wrap[0], T.wrap[1])
    } else if (c < T.fly[1]) {
      const k = seg(c, T.fly[0], T.fly[1])
      bez(k, p0)
      material.quaternion.slerpQuaternions(qFly, qIn, seg(c, T.fly[1] - 0.25, T.fly[1]))
      capS = 1
    } else if (c < B.out[1]) {
      /* at the lock: the capsule opens, the key turns, then out */
      const o = seg(c, B.out[0], B.out[1])
      p0.lerpVectors(KEYHOLE, PULLED, o)
      material.quaternion.copy(qIn)
      material.rotateX(keyTurn(c))
      capS = 1 - seg(c, T.unwrap[0], T.unwrap[1])
    } else if (c < T.settle[0]) {
      p0.copy(PULLED)
      material.quaternion.copy(qIn)
    } else {
      /* into the open compartment, settling in its slot */
      const k = seg(c, T.settle[0], T.settle[1])
      p0.copy(PULLED).lerp(INSLOT, k)
      p0.y += Math.sin(k * Math.PI) * 0.08
      material.quaternion.slerpQuaternions(qIn, qLie, k)
    }
    material.visible = vis
    if (vis) material.position.copy(p0)
    matHalo.mesh.visible = vis
    if (vis) {
      matHalo.mesh.position.copy(p0)
      matHalo.mesh.quaternion.copy(camera.quaternion)
      matHalo.mat.opacity = 0.75 + 0.2 * Math.sin(c * TAU * 2)
    }
    keyMatM.emissiveIntensity = 1.0 + 0.25 * Math.sin(c * TAU * 2)
    /* the capsule wraps the material in transit */
    capsule.visible = capS > 0.01 && vis
    if (capsule.visible) {
      capsule.position.copy(p0).add(tmp.set(0.059 * KS, 0, 0).applyQuaternion(material.quaternion))
      capsule.quaternion.copy(material.quaternion)
      capsule.scale.setScalar(Math.max(0.01, capS))
      band.rotation.x = c * 3
    }
    /* the slot's rim lights as the material settles; the lock glows the imported key's blue as it locks */
    slotRim.material.opacity = 0.85 * seg(c, T.settle[1] - 0.2, T.settle[1]) * (c < B.shut[1] + 0.05 ? 1 : 0)
    ringOn = hold(c, B.lock[0], B.lock[1], B.home[1], L - 0.1)
    ringGlowM.opacity = ringOn
    lockHalo.mat.opacity = ringOn * 0.9
    lockRing.rotation.z = -keyTurn(c)
    hinge.rotation.y = doorAngle(c)
    kms.scale.setScalar(1 + 0.04 * hold(c, T.settle[1] - 0.2, T.settle[1], T.settle[1] + 0.2, T.settle[1] + 0.5))
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (setup: (k: StageKit) => Update, holdT: number) =>
  (({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )) as (p: Record<string, unknown>) => ReactNode

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T25Everyday: card(setupFacility, devT(HOLD)),
  J_T25Concept: card(setupKms, devT(HOLD)),
}
export const css = ''
