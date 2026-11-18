import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'

/**
 * BUILDER H · SESSION 15 (Encryption & Key Management) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`
 * (generate-slides standing corrections 13-17, deck-engine "3D scenes and people" and "Low-end PCs"), built the way
 * Session 14's h.tsx is: a perspective camera on a real place, Character Lab people through the engine's `castSprite`
 * (role clothing by `dress`, `adaptive` frames, expressions keyed to the action), NO TEXT on either card, ONE
 * wall-clock loop per slide shared by both cards beat for beat and place for place, every loop ending in the state it
 * starts in, held frames at HOLD. Nobody walks toward or away from the camera (a rig has no back view): people step
 * sideways, props move. Props in a hand follow the frame the sprite is showing, not the clock.
 *
 * SLIDE 11 · T04-AN (TR 4): "A shared house key used by every family member is symmetric encryption, while a letterbox
 * anyone can post into but only the homeowner's key opens is asymmetric encryption: just as a public key locks data
 * for anyone while only the private key unlocks it."
 *
 *   place (x)   everyday: a house front and its gate          concept: the same places as objects
 *   -2.0        the father, a copy of the house key (blue)     laptop A, a copy of the one blue key
 *   -1.3        the double front door, its lock               the data block, its padlock (bars scramble when locked)
 *   -0.6        the daughter, the same key (blue)             laptop B, the same blue key
 *    0.38       the mother, the homeowner's key (gold)        the receiving laptop, the private key (gold)
 *    1.04       the letterbox on its post: top slot, lid       the receiving box: an OPEN padlock always at its slot
 *    1.7        the postman, then the neighbour, post a        sender laptops 1 and 2: each envelope is closed with a
 *               letter in turn                                 copy of the open padlock and drops into the box
 *
 *   0.15 - 3.7  father: key in, turn, the doors open, close, key turns back (the same key locks)   / key A, block
 *   4.15 - 7.7  daughter: the same                                                                 / key B, block
 *   0.0 - 2.9   the postman walks in, posts, walks out                          / sender 1's envelope is locked, drops in
 *   2.7 - 5.6   the neighbour: the same                                         / sender 2's
 *   5.4 - 7.9   the mother: her key opens the lid, she takes the letters, pockets them
 *               / the gold key opens the box, the padlocks spring open, the envelopes go to the receiving laptop
 *
 * SLIDE 13 · T05-AN (TR 5): "Blending fruits into juice is like hashing: the juice proves fruits were used, but nothing
 * turns juice back into whole fruits, just as a digest cannot be reversed into the original data."
 *
 *   place (x)   everyday: a kitchen island                     concept: a workbench
 *   -0.48       a crate of whole fruit                         a data source: blocks of data
 *    0.1        the blender                                    the hash machine (hopper, rotor window, lever)
 *    0.46       the glass                                      the tray the digest strip lands on
 *
 *   0.0 - 2.1   three fruits dropped in                        three data blocks into the hopper
 *   2.1 - 3.25  blend: the fruit swirls into juice             the rotor runs, the blocks are gone
 *   3.25 - 4.6  poured into the glass                          the digest strip slides out onto the tray
 *   4.6 - 5.8   the glass tipped back into the blender         the strip pushed back into the slot
 *   5.8 - 6.85  the reverse button: it spins the other way,    the reverse lever: the rotor runs backward, an orange
 *               nothing but juice (a puzzled look at the crate) flash at the empty hopper, no block comes back
 *   6.85 - 7.9  poured again                                   the same strip comes out again
 *   7.9 - 8.9   she drinks it                                  the strip glides off to be used
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
  navy: colors.brandDeep,
  orange: colors.accent,
  accentDark: colors.accentDark,
  green: colors.success,
  teal: colors.teal,
  white: colors.white,
  gold: '#F2C14E',
  brass: '#D4A24A',
  steel: '#B7C3D6',
  juice: '#F08A2E',
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
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
/** a point on a lifted arc from a to b (k 0..1) */
const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, lift: number, out = new THREE.Vector3()) => out.copy(a).lerp(b, k).add(V(0, Math.sin(Math.PI * k) * lift, 0))

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
/** large soft floor slabs */
const slabTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 1.2
      g.strokeRect(0.6, 0.6, 126.8, 126.8)
    },
    repeat,
  )
/** square wall tiles (kitchen splashback) */
const tileTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    64,
    64,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 64, 64)
      g.strokeStyle = joint
      g.lineWidth = 1.5
      g.strokeRect(0.75, 0.75, 62.5, 62.5)
    },
    repeat,
  )
/** horizontal siding boards on the house front */
const sidingTex = (base: string, line: string, repeat: [number, number]) =>
  canvasTex(
    64,
    64,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 64, 64)
      g.fillStyle = line
      g.fillRect(0, 0, 64, 2)
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.fillRect(0, 2, 64, 2)
    },
    repeat,
  )

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: THREE.Vector3Tuple, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)
  const o = mesh(geo, Array.isArray(m) ? m[0] : m, pos)
  if (Array.isArray(m)) o.material = m
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
/** a backdrop in its exact colour (no tone mapping greys it) */
const backdrop = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false })
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
/** a soft glow; `normal` blending for a coloured glow on a light surface (additive washes orange out to white there) */
function halo(color: string, w: number, h = w, normal = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}
const opa = (m: THREE.Mesh, v: number) => {
  ;(m.material as THREE.MeshBasicMaterial).opacity = v
  m.visible = v > 0.005
}
/** place a camera-facing glow just behind / in front of a point */
function glowAt(g: THREE.Mesh, p: THREE.Vector3, camera: THREE.Camera, o: number, toward = 0.02) {
  g.position.copy(p).addScaledVector(camera.position.clone().sub(p).normalize(), toward)
  g.quaternion.copy(camera.quaternion)
  opa(g, o)
}

function lights(scene: THREE.Scene, target: THREE.Vector3Tuple, spread = 6) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 5, target[1] + 9, target[2] + 8)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -spread
  key.shadow.camera.right = spread
  key.shadow.camera.top = spread
  key.shadow.camera.bottom = -spread
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
}
function floorPlane(scene: THREE.Scene, tex: THREE.Texture, z = 1.4, w = 12, d = 7) {
  const fl = flat(mesh(new THREE.PlaneGeometry(w, d), mat('#ffffff', { map: tex, roughness: 0.85 }), [0, 0, z]))
  fl.rotation.x = -Math.PI / 2
  fl.receiveShadow = true
  scene.add(fl)
  return fl
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
type Who = { name: string; gender?: CharacterConfig['gender']; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }
const who = (base: CharacterConfig, o: Who): CharacterConfig => ({
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
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/* role clothing, drawn in the rig's own frames (head-local for the cap, body frame 400 x 600 for the rest) */
const PEAK_CAP = (crown: string, band: string, badge: string) => (
  <g data-part="cap">
    <path d="M -64 -50 C -70 -104 70 -104 64 -50 Z" fill={crown} />
    <path d="M -50 -88 C -20 -100 20 -100 50 -88" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-65} y={-62} width={130} height={15} rx={4} fill={band} />
    <circle cx={0} cy={-80} r={9} fill={badge} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -60 -48 Q 0 -26 60 -48 L 56 -54 Q 0 -38 -56 -54 Z" fill="#141B2E" />
  </g>
)
/** the postman's satchel: a strap across the chest to a bag at the hip, and a pocket flap on the shirt */
const POST_BAG = (strap: string, bag: string) => (
  <g data-part="satchel">
    <path d="M 234 212 L 168 344" stroke={strap} strokeWidth={9} fill="none" strokeLinecap="round" />
    <rect x={140} y={334} width={58} height={50} rx={9} fill={bag} />
    <path d="M 140 346 Q 169 362 198 346 L 198 343 Q 169 356 140 343 Z" fill="#000000" opacity={0.18} />
    <circle cx={169} cy={356} r={4} fill={C.gold} />
    <rect x={214} y={248} width={26} height={18} rx={3} fill="#000000" opacity={0.12} />
  </g>
)
/** the cook's apron: bib, ties at the neck, a front pocket */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
  </g>
)
/** an open knit cardigan over the blouse (the neighbour) */
const CARDIGAN = (edge: string) => (
  <g data-part="cardigan">
    <path d="M 186 208 C 192 240 194 300 192 392 L 208 392 C 206 300 208 240 214 208 Z" fill="#F7F4EE" />
    <path d="M 186 208 C 192 240 194 300 192 392" fill="none" stroke={edge} strokeWidth={7} strokeLinecap="round" />
    <path d="M 214 208 C 208 240 206 300 208 392" fill="none" stroke={edge} strokeWidth={7} strokeLinecap="round" />
    {[266, 300, 334, 366].map((y) => (
      <circle key={y} cx={190} cy={y} r={3.4} fill="#EADBB8" />
    ))}
  </g>
)

/* ---- arms: forward and inverse kinematics in the rig's 400 x 600 frame (Arm.tsx: pivot 6 px inside the shoulder tip
   at y 205, upper arm 95, forearm 85 + 14 to the grip; angles from hanging straight down, positive lifts away from the
   body, forearm at shoulder minus elbow; the screen-right arm mirrors). Session 14 h.tsx. ---- */

type Pt = { x: number; y: number }
type Arm = { s: number; e: number }
type Side = 'L' | 'R'
const UPPER = 95
const FORE = 99
function handPt(side: Side, sh: number, a: Arm): Pt {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px + sg * (Math.sin(s) * UPPER + Math.sin(f) * FORE), y: 205 + Math.cos(s) * UPPER + Math.cos(f) * FORE }
}
/** shoulder and elbow angles that put the hand at p, elbow DOWN */
function solveArm(side: Side, sh: number, p: Pt, other = false): Arm {
  const q = side === 'L' ? p : { x: 400 - p.x, y: p.y }
  const px = 200 - (sh - 6)
  const dx = q.x - px
  const dy = q.y - 205
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(clamp01((UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D)))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  /* `other`: the second solution, for a hand brought back in toward the body (a sip, a drop in front of the chest) */
  return other ? { s: (ad + beta) / DEG, e: 180 - gamma / DEG } : { s: (ad - beta) / DEG, e: gamma / DEG - 180 }
}
const unitOf = (h: number) => h / 0.93 / 600
/** a rig-frame point on a billboarded sprite of height `h` at `root`, in the scene */
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = unitOf(h)
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
/** where a scene point falls on a person's picture plane, along the camera's ray, in rig units: aim a hand AT it */
function worldToRig(target: THREE.Vector3, h: number, root: THREE.Vector3, camera: THREE.Camera): Pt {
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const n = V(Math.sin(phi), 0, Math.cos(phi))
  const d = target.clone().sub(cam)
  const k = n.dot(root.clone().sub(cam)) / n.dot(d)
  const p = cam.clone().addScaledVector(d, k)
  const u = unitOf(h)
  const lx = (p.x - root.x) * Math.cos(phi) - (p.z - root.z) * Math.sin(phi)
  return { x: 200 + lx / u, y: 600 - (p.y - root.y) / u }
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the loop time of the frame a sprite of F frames is showing at c */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)
const mixA = (a: Arm, b: Arm, k: number): Arm => (k <= 0 ? a : { s: lerp(a.s, b.s, clamp01(k)), e: lerp(a.e, b.e, clamp01(k)) })

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
/** x along [t0, t1, xTo] keys (eased); before the first key, at the last key's x (the loop wraps) */
function along(c: number, keys: [number, number, number][]): { x: number; walking: number; dir: number } {
  let x = keys[keys.length - 1][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (c <= b) {
      const k = seg(c, a, b)
      return { x: lerp(x, xt, k), walking: hold(c, a, a + 0.08, b - 0.08, b), dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}
/** a hand-held reach: aim the arm of a sprite (height h, at root) at a scene point */
/** the elbow's x in the rig frame for an arm pose */
const elbowX = (side: Side, sh: number, a: Arm) => (side === 'L' ? 200 - (sh - 6) - Math.sin(a.s * DEG) * UPPER : 200 + (sh - 6) + Math.sin(a.s * DEG) * UPPER)
/**
 * Of the two arm solutions, the one with the elbow OUT from the body (`out`, a reach), or IN across the chest (`in`,
 * a glass brought up to the mouth: the other one would be an elbow raised over the head). Measured 2026-11-18: the
 * plain solution put a hand brought in front of the chest on an elbow crossing the face.
 */
function aimAt(side: Side, sh: number, h: number, root: THREE.Vector3, cam: THREE.Camera, p: THREE.Vector3, prefer: 'out' | 'in' = 'out'): Arm {
  const q = worldToRig(p, h, root, cam)
  const a = solveArm(side, sh, q)
  const b = solveArm(side, sh, q, true)
  const sg = side === 'L' ? -1 : 1
  const outA = sg * elbowX(side, sh, a) >= sg * elbowX(side, sh, b)
  return (prefer === 'out') === outA ? a : b
}

/* ------------------------------------------------------------------ shared props */

/**
 * A key, tip at the origin, the blade along +x to the bow at x = 0.2 (so a key "pointing out of" a lock is a key whose
 * +x points away from the door). The bow is a chunky coloured ring, readable at card size; the blade steel.
 */
function keyProp(bow: string, metal: string) {
  const g = new THREE.Group()
  const bowM = mat(bow, { roughness: 0.3, metalness: 0.35 })
  const bladeM = mat(metal, { roughness: 0.25, metalness: 0.8 })
  const ring = mesh(new THREE.TorusGeometry(0.038, 0.017, 14, 32), bowM, [0.2, 0, 0])
  g.add(ring)
  g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 24).rotateX(Math.PI / 2), bowM, [0.2, 0, 0]))
  g.add(box(0.15, 0.018, 0.01, bladeM, [0.09, 0, 0], 0.003))
  g.add(box(0.014, 0.022, 0.01, bladeM, [0.03, -0.018, 0]))
  g.add(box(0.014, 0.016, 0.01, bladeM, [0.06, -0.015, 0]))
  g.add(box(0.014, 0.024, 0.01, bladeM, [0.095, -0.019, 0]))
  return flat(g)
}
/** orient a key: +x along `out`, then turned about its own blade by `turn` */
const qKey = (out: THREE.Vector3, turn: number, q = new THREE.Quaternion()) => {
  q.setFromUnitVectors(V(1, 0, 0), out.clone().normalize())
  return q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), turn))
}

/** an envelope face (no words): white paper, the flap's V, a coloured stamp */
const envelopeTex = (paper: string, stamp: string) =>
  canvasTex(120, 76, (g) => {
    g.fillStyle = paper
    g.beginPath()
    g.roundRect(1, 1, 118, 74, 5)
    g.fill()
    g.strokeStyle = 'rgba(40,50,80,0.28)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(3, 4)
    g.lineTo(60, 44)
    g.lineTo(117, 4)
    g.stroke()
    g.fillStyle = stamp
    g.fillRect(94, 50, 16, 18)
    g.fillStyle = 'rgba(255,255,255,0.6)'
    g.fillRect(97, 53, 10, 12)
  })
function letterProp(tex: THREE.Texture, w = 0.2, h = 0.13) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.008), [mat('#EDEFF5'), mat('#EDEFF5'), mat('#EDEFF5'), mat('#EDEFF5'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), mat('#EDEFF5')])
  m.castShadow = false
  return m
}

/** a padlock: body with a keyhole, a shackle that lifts and swings open (`set(open 0..1)`) */
function padlockProp(body: string, scale = 1) {
  const g = new THREE.Group()
  const bodyM = mat(body, { roughness: 0.3, metalness: 0.45 })
  const steel = mat('#C9D2E0', { roughness: 0.22, metalness: 0.85 })
  g.add(box(0.15, 0.12, 0.06, bodyM, [0, 0, 0], 0.02))
  g.add(flat(mesh(new THREE.CircleGeometry(0.014, 18), mat('#1B2135'), [0, 0.008, 0.031])))
  g.add(flat(box(0.008, 0.026, 0.002, mat('#1B2135'), [0, -0.012, 0.031])))
  /* the shackle pivots on its left leg */
  const pivot = new THREE.Group()
  pivot.position.set(-0.045, 0.06, 0)
  const sh = mesh(new THREE.TorusGeometry(0.045, 0.011, 12, 28, Math.PI), steel, [0.045, 0.02, 0])
  pivot.add(sh)
  pivot.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 12), steel, [0, 0.005, 0]))
  pivot.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 12), steel, [0.09, 0.005, 0]))
  g.add(pivot)
  g.scale.setScalar(scale)
  flat(g)
  return {
    g,
    set(open: number) {
      /* up out of the body, then the free leg swings out to the side (in the picture plane, so it reads) */
      pivot.position.y = 0.06 + 0.04 * seg(open, 0, 0.5)
      pivot.rotation.z = 0.75 * seg(open, 0.45, 1)
    },
  }
}

/** a screen face for a laptop: a soft panel and a glyph (key / envelope), no words */
function screenTex(tint: string, glyph: 'key' | 'envelope' | 'none') {
  return canvasTex(160, 104, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 104)
    gr.addColorStop(0, '#F7FAFF')
    gr.addColorStop(1, '#E2EAFA')
    g.fillStyle = gr
    g.fillRect(0, 0, 160, 104)
    g.fillStyle = tint
    g.globalAlpha = 0.16
    g.fillRect(0, 0, 160, 14)
    g.globalAlpha = 1
    g.fillStyle = tint
    if (glyph === 'key') {
      g.beginPath()
      g.arc(58, 58, 17, 0, TAU)
      g.fill()
      g.fillStyle = '#F7FAFF'
      g.beginPath()
      g.arc(58, 58, 7, 0, TAU)
      g.fill()
      g.fillStyle = tint
      g.fillRect(72, 54, 46, 8)
      g.fillRect(100, 62, 6, 10)
      g.fillRect(110, 62, 6, 13)
    } else if (glyph === 'envelope') {
      g.beginPath()
      g.roundRect(48, 36, 64, 42, 5)
      g.fill()
      g.strokeStyle = '#F7FAFF'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(50, 39)
      g.lineTo(80, 60)
      g.lineTo(110, 39)
      g.stroke()
    }
  })
}
/** an open laptop on the floor plane of its group: base, a screen tilted back; returns the screen material */
function laptopProp(scr: THREE.Texture) {
  const g = new THREE.Group()
  const shell = mat('#C9D0DC', { roughness: 0.35, metalness: 0.55 })
  g.add(box(0.38, 0.02, 0.25, shell, [0, 0.01, 0], 0.008))
  g.add(flat(box(0.33, 0.004, 0.13, mat('#9AA3B4', { roughness: 0.6 }), [0, 0.021, -0.03])))
  const lid = new THREE.Group()
  lid.position.set(0, 0.02, -0.12)
  lid.rotation.x = -0.22
  lid.add(box(0.38, 0.25, 0.014, shell, [0, 0.125, 0], 0.008))
  const screenM = new THREE.MeshStandardMaterial({ map: scr, roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveMap: scr, emissiveIntensity: 0.35 })
  lid.add(flat(mesh(new THREE.PlaneGeometry(0.34, 0.22), screenM, [0, 0.128, 0.0075])))
  g.add(lid)
  return { g, screenM, lid }
}
/** a white plinth (the deck's tile look, in 3D) */
const plinthM = () => mat('#FFFFFF', { roughness: 0.42, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.14 })
const plinth = (w: number, h: number, d: number, pos: THREE.Vector3Tuple) => box(w, h, d, plinthM(), [pos[0], pos[1] + h / 2, pos[2]], 0.03)

/* ================================================================== T04 · house key and letterbox */

const L4 = 8
const F4 = 80
const HOLD4 = 1.3 /* the father's key has opened the doors; the postman's letter is going into the letterbox */
const P4 = {
  wallZ: -0.92,
  pz: -0.55,
  dadX: -2.02,
  dauX: -0.58,
  door: -1.3,
  doorW: 0.78,
  doorH: 1.96,
  lock: V(-1.3, 1.02, -0.88),
  mumX: 0.36,
  box: { x: 1.04, y0: 0.94, y1: 1.34, w: 0.36, d: 0.24, z: -0.44 },
  postX: 1.7,
  off: 3.4,
  hDad: 1.74,
  hDau: 1.5,
  hMum: 1.64,
  hPost: 1.72,
  hNb: 1.66,
}
const BOX4 = P4.box
const SLOT4 = V(BOX4.x, BOX4.y1 + 0.01, BOX4.z + 0.04)
const KEYHOLE4 = V(BOX4.x + 0.08, 1.12, BOX4.z + BOX4.d / 2 + 0.01)
/* one turn at the door, used twice (father at 0, daughter at 4) */
const TURN = { up: [0.15, 0.55] as const, ins: [0.45, 0.6] as const, turn: [0.6, 0.85] as const, out: [0.85, 1.0] as const, open: [0.95, 1.5] as const, close: [2.25, 2.8] as const, ins2: [2.75, 2.9] as const, turn2: [2.9, 3.12] as const, out2: [3.12, 3.28] as const, down: [3.28, 3.7] as const }
const T4 = {
  dad: 0,
  dau: 4,
  postWalk: [[0, 0.95, P4.postX], [1.95, 2.9, P4.off]] as [number, number, number][],
  post: [0.95, 1.3, 1.7, 1.95] as const,
  slot: [1.3, 1.7] as const,
  nbOff: 2.7,
  mum: { up: [5.4, 5.85] as const, turn: [5.85, 6.05] as const, out: [6.05, 6.25] as const, lid: [6.1, 6.45] as const, reach: [6.4, 6.8] as const, lift: [6.85, 7.2] as const, lidShut: [7.0, 7.4] as const, pocket: [7.3, 7.8] as const, down: [7.6, 8.0] as const },
}
/** the door-turn phases at loop time c for a turn starting at `t0` */
function turnAt(c: number, t0: number) {
  const k = c - t0
  const T = TURN
  return {
    reach: hold(k, T.up[0], T.up[1], T.down[0], T.down[1]),
    ins: Math.max(hold(k, T.ins[0], T.ins[1], T.out[0], T.out[1]), hold(k, T.ins2[0], T.ins2[1], T.out2[0], T.out2[1])),
    turn: Math.max(hold(k, T.turn[0], T.turn[0] + 0.15, T.turn[1] - 0.05, T.turn[1] + 0.05), hold(k, T.turn2[0], T.turn2[0] + 0.13, T.turn2[1] - 0.05, T.turn2[1] + 0.03)),
    /* the turn's direction: unlocking one way, locking the other */
    dir: k < 2 ? 1 : -1,
    open: hold(k, T.open[0], T.open[1], T.close[0], T.close[1]),
    unlocked: hold(k, T.turn[0] + 0.1, T.turn[1], T.turn2[0] + 0.1, T.turn2[1]),
  }
}
/** the way a key points out of the door lock toward the person standing on side `sg` (-1 left, +1 right) */
const keyOut = (sg: number) => V(0.62 * sg, 0.1, 0.78).normalize()
/** key scale on each card (readable at card size): the bow sits at 0.2 x scale from the tip */
const KEY_S4 = 1.3
const KEY_SC = 1.7

/* the people's arms */
type Rig4 = { cam: THREE.Camera; shDad: number; shDau: number; shMum: number; shPost: number; shNb: number }
const DAD_ROOT = V(P4.dadX, 0, P4.pz)
const DAU_ROOT = V(P4.dauX, 0, P4.pz)
const MUM_ROOT = V(P4.mumX, 0, P4.pz + 0.08)
function doorArm(c: number, t0: number, side: Side, sh: number, h: number, root: THREE.Vector3, cam: THREE.Camera, sg: number): Arm {
  const tn = turnAt(c, t0)
  let a: Arm = { s: 10, e: 14 }
  /* the hand holds the bow: at the lock while the key is in, a little back toward him while the doors swing */
  const atLock = P4.lock.clone().addScaledVector(keyOut(sg), 0.2 * KEY_S4)
  const back = atLock.clone().add(V(0.1 * sg, -0.04, 0.12))
  const target = back.clone().lerp(atLock, tn.ins)
  a = mixA(a, aimAt(side, sh, h, root, cam, target), tn.reach)
  return a
}
const postRoot = (c: number, off: number) => {
  const at = along(mod(c - off, L4), T4.postWalk)
  return { at, root: V(at.x, bob(at.walking, mod(c - off, L4)), P4.pz) }
}
function postArmL(c: number, off: number, sh: number, h: number, cam: THREE.Camera): Arm {
  const k = mod(c - off, L4)
  const { at, root } = postRoot(c, off)
  let a: Arm = { s: 10 + swing(k, at.walking), e: 22 }
  a = mixA(a, aimAt('L', sh, h, root, cam, SLOT4.clone().add(V(0.02, 0.1, 0.04))), hold(k, ...T4.post))
  return a
}
function mumArmR(c: number, r: Rig4): Arm {
  const M = T4.mum
  let a: Arm = { s: 12, e: 24 }
  const keyAt = KEYHOLE4.clone().addScaledVector(keyOut(-1), 0.2 * KEY_S4)
  a = mixA(a, aimAt('R', r.shMum, P4.hMum, MUM_ROOT, r.cam, keyAt), hold(c, M.up[0], M.up[1], M.reach[0], M.reach[1]))
  const inside = V(BOX4.x, 1.06, BOX4.z + 0.16)
  a = mixA(a, aimAt('R', r.shMum, P4.hMum, MUM_ROOT, r.cam, inside), hold(c, M.reach[0], M.reach[1], M.lift[0], M.lift[1]))
  const chest = V(P4.mumX + 0.3, 1.18, P4.pz + 0.2)
  a = mixA(a, aimAt('R', r.shMum, P4.hMum, MUM_ROOT, r.cam, chest), hold(c, M.lift[0], M.lift[1], M.pocket[0], M.pocket[1]))
  const pocket = V(P4.mumX + 0.12, 0.78, P4.pz + 0.2)
  a = mixA(a, aimAt('R', r.shMum, P4.hMum, MUM_ROOT, r.cam, pocket), hold(c, M.pocket[0], M.pocket[1], M.down[0], M.down[1]))
  return a
}

const DAD_FACES: [number, string][] = [[0, 'neutral'], [0.5, 'thinking'], [1.0, 'happy'], [2.4, 'neutral'], [3.7, 'listening'], [4.9, 'happy'], [6.6, 'neutral']]
const DAU_FACES: [number, string][] = [[0, 'listening'], [1.0, 'happy'], [2.7, 'neutral'], [4.5, 'thinking'], [5.0, 'grin'], [6.6, 'neutral'], [7.7, 'listening']]
const MUM_FACES: [number, string][] = [[0, 'neutral'], [1.1, 'happy'], [2.4, 'neutral'], [3.7, 'happy'], [4.8, 'neutral'], [5.75, 'thinking'], [6.3, 'happy'], [7.15, 'proud'], [7.85, 'neutral']]
const POST_FACES: [number, string][] = [[0, 'neutral'], [0.85, 'happy'], [2.05, 'neutral']]

/** the house front, the porch, the garden fence and gate: everything that does not move in the everyday card */
function houseFront(scene: THREE.Scene) {
  const wz = P4.wallZ
  scene.background = new THREE.Color('#D9E9F8')
  /* ground: paving slabs in front, a lawn behind the fence */
  floorPlane(scene, slabTex('#E4DED3', '#CFC7B8', [12, 7]))
  const lawn = flat(mesh(new THREE.PlaneGeometry(6, 4), mat('#9CC97A', { roughness: 0.95 }), [3, 0.002, -3.1]))
  lawn.rotation.x = -Math.PI / 2
  scene.add(lawn)
  /* the house front: siding in parts round the double door, a white frame, a roof eave */
  const sidM = mat('#ffffff', { map: sidingTex('#F2E6D3', '#DCCDB5', [4, 18]), roughness: 0.9 })
  const x0 = -4
  const x1 = -0.04
  const d0 = P4.door - P4.doorW / 2
  const d1 = P4.door + P4.doorW / 2
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a, y1 - y0, 0.14, sidM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.07])))
  part(x0, d0, 0, 2.95)
  part(d1, x1, 0, 2.95)
  part(d0, d1, P4.doorH, 2.95)
  const trim = mat('#FFFFFF', { roughness: 0.5 })
  scene.add(box(0.07, P4.doorH + 0.07, 0.04, trim, [d0 - 0.035, (P4.doorH + 0.07) / 2, wz + 0.01]))
  scene.add(box(0.07, P4.doorH + 0.07, 0.04, trim, [d1 + 0.035, (P4.doorH + 0.07) / 2, wz + 0.01]))
  scene.add(box(P4.doorW + 0.14, 0.07, 0.04, trim, [P4.door, P4.doorH + 0.035, wz + 0.01]))
  scene.add(box(0.06, 2.95, 0.06, trim, [x1 + 0.0, 1.475, wz - 0.01]))
  /* the hall behind the doors: warm light */
  scene.add(flat(box(P4.doorW + 0.2, P4.doorH, 0.04, mat('#F7DDB0', { roughness: 0.9, emissive: new THREE.Color('#F7DDB0'), emissiveIntensity: 0.35 }), [P4.door, P4.doorH / 2, wz - 0.8])))
  scene.add(flat(box(0.04, P4.doorH, 0.8, mat('#EBCB98', { roughness: 0.9 }), [d0 - 0.02, P4.doorH / 2, wz - 0.4])))
  scene.add(flat(box(0.04, P4.doorH, 0.8, mat('#EBCB98', { roughness: 0.9 }), [d1 + 0.02, P4.doorH / 2, wz - 0.4])))
  scene.add(flat(box(P4.doorW, 0.02, 0.8, mat('#B88A5A', { roughness: 0.7 }), [P4.door, 0.01, wz - 0.4])))
  /* roof eave and tiles along the top */
  scene.add(flat(box(x1 - x0 + 0.3, 0.12, 0.5, mat('#FFFFFF', { roughness: 0.6 }), [(x0 + x1) / 2, 3.0, wz + 0.1])))
  const roof = flat(box(x1 - x0 + 0.3, 1.2, 0.08, mat('#B5533C', { roughness: 0.75 }), [(x0 + x1) / 2, 3.5, wz + 0.05]))
  roof.rotation.x = -0.55
  scene.add(roof)
  /* a window left of the door */
  const wx = -2.82
  scene.add(box(0.64, 0.86, 0.05, trim, [wx, 1.55, wz + 0.01]))
  scene.add(flat(box(0.54, 0.76, 0.02, mat('#AFC9E8', { roughness: 0.15, metalness: 0.2, emissive: new THREE.Color('#CFE0F5'), emissiveIntensity: 0.25 }), [wx, 1.55, wz + 0.03])))
  scene.add(flat(box(0.03, 0.76, 0.03, trim, [wx, 1.55, wz + 0.04])))
  scene.add(flat(box(0.54, 0.03, 0.03, trim, [wx, 1.55, wz + 0.04])))
  scene.add(box(0.72, 0.05, 0.12, trim, [wx, 1.1, wz + 0.05]))
  /* the porch step and a doormat */
  scene.add(box(1.2, 0.07, 0.5, mat('#D6CFC2', { roughness: 0.8 }), [P4.door, 0.035, wz + 0.25], 0.01))
  scene.add(flat(box(0.6, 0.012, 0.3, mat('#8B6A48', { roughness: 0.95 }), [P4.door, 0.076, wz + 0.25])))
  /* the garden fence (white pickets) and the gate behind the letterbox */
  const fz = -1.05
  const picket = new THREE.InstancedMesh(new RoundedBoxGeometry(0.07, 0.86, 0.03, 2, 0.012), mat('#FFFFFF', { roughness: 0.55 }), 40)
  const o = new THREE.Object3D()
  let n = 0
  for (let x = 0.12; x < 3.4 && n < 40; x += 0.13) {
    if (x > 0.66 && x < 1.44) continue
    o.position.set(x, 0.43, fz)
    o.updateMatrix()
    picket.setMatrixAt(n++, o.matrix)
  }
  picket.count = n
  picket.receiveShadow = true
  scene.add(picket)
  scene.add(flat(box(3.4, 0.05, 0.03, mat('#F4F4F2', { roughness: 0.6 }), [1.75, 0.62, fz - 0.03])))
  scene.add(flat(box(3.4, 0.05, 0.03, mat('#F4F4F2', { roughness: 0.6 }), [1.75, 0.22, fz - 0.03])))
  const gateM = mat('#FFFFFF', { roughness: 0.5 })
  scene.add(box(0.1, 1.08, 0.1, gateM, [0.66, 0.54, fz], 0.015))
  scene.add(box(0.1, 1.08, 0.1, gateM, [1.44, 0.54, fz], 0.015))
  for (let i = 0; i < 6; i++) scene.add(flat(box(0.05, 0.8, 0.025, gateM, [0.78 + i * 0.105, 0.44, fz])))
  scene.add(flat(box(0.68, 0.05, 0.025, gateM, [1.05, 0.75, fz])))
  scene.add(flat(box(0.68, 0.05, 0.025, gateM, [1.05, 0.2, fz])))
  /* a hedge and two trees behind the fence */
  const hedgeM = mat('#5E9E52', { roughness: 0.95 })
  for (let i = 0; i < 6; i++) scene.add(flat(mesh(new THREE.SphereGeometry(0.42, 18, 14), hedgeM, [0.3 + i * 0.6, 0.55, -1.6])))
  const trunkM = mat('#7A5638', { roughness: 0.8 })
  const leafM = mat('#4F8F49', { roughness: 0.9 })
  for (const [x, z] of [[0.8, -2.8], [2.6, -2.5]]) {
    scene.add(flat(cyl(0.06, 0.08, 1.2, trunkM, [x, 0.6, z])))
    scene.add(flat(mesh(new THREE.SphereGeometry(0.62, 20, 16), leafM, [x, 1.65, z])))
  }
}

/** the letterbox on its post: shell, a top slot, a front lid with the homeowner's keyhole hinged at the bottom */
function letterbox(scene: THREE.Scene, body: string, edge: string) {
  const b = BOX4
  const m = mat(body, { roughness: 0.35, metalness: 0.25 })
  const yc = (b.y0 + b.y1) / 2
  const hh = b.y1 - b.y0
  scene.add(box(0.07, b.y0, 0.07, mat('#5B6170', { roughness: 0.5, metalness: 0.4 }), [b.x, b.y0 / 2, b.z]))
  scene.add(box(b.w, hh, 0.02, m, [b.x, yc, b.z - b.d / 2 + 0.01], 0.008))
  scene.add(box(0.02, hh, b.d, m, [b.x - b.w / 2 + 0.01, yc, b.z], 0.008))
  scene.add(box(0.02, hh, b.d, m, [b.x + b.w / 2 - 0.01, yc, b.z], 0.008))
  scene.add(box(b.w, 0.02, b.d, m, [b.x, b.y0 + 0.01, b.z], 0.006))
  /* the roof with the slot: two pieces either side of the slit, a lip over it */
  scene.add(box(b.w + 0.04, 0.03, 0.09, m, [b.x, b.y1, b.z - b.d / 2 + 0.045], 0.01))
  scene.add(box(b.w + 0.04, 0.03, 0.1, m, [b.x, b.y1, b.z + b.d / 2 - 0.05], 0.01))
  scene.add(flat(box(b.w - 0.06, 0.012, 0.035, mat('#14171F'), [b.x, b.y1 + 0.004, SLOT4.z])))
  scene.add(flat(box(b.w - 0.04, 0.012, 0.012, mat(edge, { roughness: 0.3, metalness: 0.4 }), [b.x, b.y1 + 0.02, SLOT4.z + 0.03])))
  /* the inside, dark */
  scene.add(flat(box(b.w - 0.05, hh - 0.04, 0.005, mat('#2A2F3C', { roughness: 0.9 }), [b.x, yc, b.z - b.d / 2 + 0.025])))
  /* the lid: hinged at the bottom front edge */
  const lid = new THREE.Group()
  lid.position.set(b.x, b.y0, b.z + b.d / 2)
  lid.add(box(b.w, hh - 0.01, 0.02, m, [0, (hh - 0.01) / 2, 0], 0.008))
  lid.add(flat(box(b.w - 0.08, 0.008, 0.004, mat(edge), [0, hh * 0.72, 0.012])))
  /* the keyhole: a brass escutcheon */
  const kh = new THREE.Group()
  kh.position.set(KEYHOLE4.x - b.x, KEYHOLE4.y - b.y0, 0.012)
  kh.add(flat(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24).rotateX(Math.PI / 2), mat(C.brass, { metalness: 0.7, roughness: 0.25 }), [0, 0, 0])))
  kh.add(flat(mesh(new THREE.CircleGeometry(0.007, 14), mat('#14171F'), [0, 0.004, 0.0035])))
  kh.add(flat(box(0.005, 0.014, 0.002, mat('#14171F'), [0, -0.006, 0.0035])))
  lid.add(kh)
  scene.add(lid)
  return lid
}

/** the two leaves of the double door, hinged at the outer edges, swinging inward; the lock on the left leaf's edge */
function doubleDoor(scene: THREE.Scene, leafColor: string) {
  const lw = P4.doorW / 2
  const leafM = mat(leafColor, { roughness: 0.45 })
  const panelM = mat(new THREE.Color(leafColor).multiplyScalar(0.86).getStyle(), { roughness: 0.5 })
  const make = (sg: number) => {
    const g = new THREE.Group()
    g.position.set(P4.door - sg * lw, 0, P4.wallZ - 0.02)
    const cx = (sg * lw) / 2
    g.add(box(lw - 0.006, P4.doorH - 0.01, 0.045, leafM, [cx, P4.doorH / 2, 0], 0.01))
    for (const y of [0.55, 1.4]) g.add(flat(box(lw - 0.12, 0.6, 0.012, panelM, [cx, y, 0.026], 0.01)))
    g.add(flat(box(lw - 0.14, 0.22, 0.01, mat('#CFE0F5', { roughness: 0.1, metalness: 0.2 }), [cx, 1.82, 0.026])))
    scene.add(g)
    return g
  }
  const L = make(1)
  const R = make(-1)
  /* the lock: a brass plate with a keyhole, on the left leaf where the leaves meet */
  const lock = new THREE.Group()
  lock.position.set(P4.lock.x - L.position.x - 0.03, P4.lock.y, 0.028)
  lock.add(flat(box(0.05, 0.13, 0.008, mat(C.brass, { metalness: 0.7, roughness: 0.25 }), [0, 0, 0], 0.003)))
  lock.add(flat(mesh(new THREE.CircleGeometry(0.008, 14), mat('#14171F'), [0, 0.012, 0.0045])))
  lock.add(flat(box(0.006, 0.016, 0.002, mat('#14171F'), [0, 0.0, 0.0045])))
  lock.add(flat(mesh(new THREE.SphereGeometry(0.02, 16, 12), mat(C.brass, { metalness: 0.7, roughness: 0.25 }), [0, -0.1, 0.018])))
  L.add(lock)
  return {
    set(open: number) {
      L.rotation.y = 1.25 * open
      R.rotation.y = -1.25 * open
    },
  }
}

function setupT04Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam4(camera)
  lights(scene, [0, 1.2, -0.6], 7)
  houseFront(scene)
  const door = doubleDoor(scene, '#2E5DA8')
  const lid = letterbox(scene, '#1F5E4A', C.brass)

  /* the keys: two copies of the one house key (blue bows), and the homeowner's own letterbox key (gold) */
  const keyDad = keyProp(C.brand, '#C9D2E0')
  const keyDau = keyProp(C.brand, '#C9D2E0')
  const keyMum = keyProp(C.gold, '#E2C77E')
  for (const k of [keyDad, keyDau, keyMum]) k.scale.setScalar(KEY_S4)
  scene.add(keyDad, keyDau, keyMum)
  const lockGlow = halo('#8FB0FF', 0.36)
  const boxGlow = halo('#FFE29A', 0.4)
  scene.add(lockGlow, boxGlow)

  /* the letters: the postman's (red stamp) and the neighbour's (green stamp) */
  const letterP = letterProp(envelopeTex('#FFFFFF', '#3B6FE0'))
  const letterN = letterProp(envelopeTex('#FFF7E8', '#1E9E6A'))
  scene.add(letterP, letterN)

  /* people */
  const dadCfg = who(CAST_PRESETS.rohan, { name: 'Father', outfit: { top: 'polo', topColor: '#2F7A55', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#5A3A2A' } })
  const dauCfg = who(CAST_PRESETS.ananya, { name: 'Daughter', hair: { style: 'ponytail', color: '#262B43' }, outfit: { top: 'tshirt', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#25366E', shoeColor: '#F2F2F5' }, build: { height: 0.92, shoulders: 0.94 } })
  const mumCfg = who(CAST_PRESETS.meera, { name: 'Mother' })
  const postCfg = who(CAST_PRESETS.arjun, { name: 'Postman', hair: { style: 'short' }, outfit: { top: 'shirt', topColor: '#3B5BA9', bottom: 'trousers', bottomColor: '#24314F', shoeColor: '#1E2230' }, accessories: { belt: true } })
  const nbCfg = who(CAST_PRESETS.riya, { name: 'Neighbour', hair: { style: 'bun', color: 'grey' }, outfit: { top: 'blouse', topColor: '#B8546F', bottom: 'skirt', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { glasses: 'round', earrings: true } })
  const r: Rig4 = { cam: camera, shDad: buildSkin(dadCfg).shoulderHalf, shDau: buildSkin(dauCfg).shoulderHalf, shMum: buildSkin(mumCfg).shoulderHalf, shPost: buildSkin(postCfg).shoulderHalf, shNb: buildSkin(nbCfg).shoulderHalf }
  const common = { loop: L4, frames: F4, redraw, holdT: HOLD4 }
  const dad = person({
    ...common,
    config: dadCfg,
    seed: 1501,
    faces: DAD_FACES,
    height: P4.hDad,
    pose: (p, c) => {
      const a = doorArm(c, T4.dad, 'R', r.shDad, P4.hDad, DAD_ROOT, r.cam, -1)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.shoulderL = 8
      p.elbowL = 10
      to(p, 'headTurn', 0.4, 1)
      to(p, 'lookX', 0.85, 1)
      to(p, 'lookY', 0.25, turnAt(c, T4.dad).reach)
      /* while it is his daughter's turn, he watches her */
      const watch = hold(c, 4.3, 4.6, 7.3, 7.6)
      to(p, 'headTurn', 0.5, watch)
    },
  })
  const dau = person({
    ...common,
    config: dauCfg,
    seed: 1502,
    faces: DAU_FACES,
    height: P4.hDau,
    pose: (p, c) => {
      const a = doorArm(c, T4.dau, 'L', r.shDau, P4.hDau, DAU_ROOT, r.cam, 1)
      p.shoulderL = a.s
      p.elbowL = a.e
      p.shoulderR = 8
      p.elbowR = 10
      to(p, 'headTurn', -0.4, 1)
      to(p, 'lookX', -0.85, 1)
      to(p, 'lookY', -0.1, turnAt(c, T4.dau).reach)
    },
  })
  const mum = person({
    ...common,
    config: mumCfg,
    seed: 1503,
    faces: MUM_FACES,
    height: P4.hMum,
    pose: (p, c) => {
      const a = mumArmR(c, r)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.shoulderL = 10
      p.elbowL = 14
      to(p, 'headTurn', 0.36, 1)
      to(p, 'lookX', 0.8, 1)
      const down = Math.max(hold(c, 5.5, 5.75, 6.0, 6.2), hold(c, 6.35, 6.55, 6.85, 7.05))
      to(p, 'lookY', 0.5, down)
    },
  })
  const postPose = (off: number, sh: number, h: number) => (p: Pose, c: number) => {
    const k = mod(c - off, L4)
    const a = postArmL(c, off, sh, h, r.cam)
    const at = postRoot(c, off).at
    p.shoulderL = a.s
    p.elbowL = a.e
    p.shoulderR = 8 - swing(k, at.walking)
    p.elbowR = 10
    to(p, 'headTurn', -0.38, 1)
    to(p, 'lookX', -0.85, 1)
    walkLegs(p, k, at.walking, at.dir)
    to(p, 'lookY', 0.35, hold(k, ...T4.post))
  }
  const post = person({ ...common, config: postCfg, dress: (k) => ({ ...withTop(POST_BAG('#5A3A22', '#7A4E2C'))(k), hairFront: <>{k.hairFront}{PEAK_CAP('#2C468A', '#E8B23A', C.gold)}</> }), seed: 1504, faces: POST_FACES, height: P4.hPost, pose: postPose(0, r.shPost, P4.hPost) })
  const nb = person({ ...common, config: nbCfg, dress: withTop(CARDIGAN('#7E3A50')), seed: 1505, faces: POST_FACES.map(([t, f]) => [mod(t + T4.nbOff, L4), f] as [number, string]).sort((a, b) => a[0] - b[0]), height: P4.hNb, pose: postPose(T4.nbOff, r.shNb, P4.hNb) })
  dad.object.position.copy(DAD_ROOT)
  dau.object.position.copy(DAU_ROOT)
  mum.object.position.copy(MUM_ROOT)
  scene.add(dad.object, dau.object, mum.object, post.object, nb.object)

  const hand = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const qRest = new THREE.Quaternion()
  /** a door key: in the hand at rest (bow up), pointing into the lock while reaching, in the lock (turned) when inserted */
  const placeDoorKey = (key: THREE.Object3D, c: number, t0: number, sg: number, hnd: THREE.Vector3) => {
    const tn = turnAt(c, t0)
    const out = keyOut(sg)
    qKey(out, tn.turn * tn.dir * 1.3, q)
    qRest.setFromEuler(new THREE.Euler(0, 0, sg > 0 ? -1.9 : -1.25))
    key.quaternion.copy(qRest).slerp(q, clamp01(tn.reach * 1.4))
    /* the hand holds the bow (key x = 0.2) */
    const inHand = hnd.clone().sub(V(0.2 * KEY_S4, 0, 0).applyQuaternion(key.quaternion))
    const inLock = P4.lock.clone().addScaledVector(out, -0.015)
    key.position.copy(inHand).lerp(inLock, tn.ins)
    return tn
  }

  return (t: number) => {
    const c = mod(t, L4)
    dad.update(c, camera)
    dau.update(c, camera)
    mum.update(c, camera)
    /* the postman and the neighbour walk in and out along the pavement */
    const pr = postRoot(c, 0)
    post.object.position.copy(pr.root)
    post.object.visible = pr.root.x < 3.05
    post.update(c, camera)
    const nr = postRoot(c, T4.nbOff)
    nb.object.position.copy(nr.root)
    nb.object.visible = nr.root.x < 3.05
    nb.update(c, camera)

    /* the door: either person's turn */
    const tD = turnAt(c, T4.dad)
    const tU = turnAt(c, T4.dau)
    door.set(Math.max(tD.open, tU.open))
    const cqD = frameT(c, L4, F4)
    rigToWorld(handPt('R', r.shDad, doorArm(cqD, T4.dad, 'R', r.shDad, P4.hDad, DAD_ROOT, camera, -1)), P4.hDad, DAD_ROOT, camera, hand)
    towardCamera(hand, camera, 0.08)
    placeDoorKey(keyDad, c, T4.dad, -1, hand)
    rigToWorld(handPt('L', r.shDau, doorArm(cqD, T4.dau, 'L', r.shDau, P4.hDau, DAU_ROOT, camera, 1)), P4.hDau, DAU_ROOT, camera, hand)
    towardCamera(hand, camera, 0.08)
    placeDoorKey(keyDau, c, T4.dau, 1, hand)
    glowAt(lockGlow, P4.lock, camera, 0.9 * Math.max(tD.ins * tD.turn, tU.ins * tU.turn) + 0.5 * Math.max(tD.open, tU.open) * 0)

    /* the letters: in the poster's hand, down through the slot, inside, taken by the mother, into her pocket */
    const M = T4.mum
    const cq = frameT(c, L4, F4)
    rigToWorld(handPt('R', r.shMum, mumArmR(cq, r)), P4.hMum, MUM_ROOT, camera, hand)
    towardCamera(hand, camera, 0.07)
    const mumHand = hand.clone()
    const placeLetter = (lt: THREE.Mesh, off: number, sh: number, h: number, i: number) => {
      const k = c - off
      const inside = V(BOX4.x - 0.05 + i * 0.08, BOX4.y0 + 0.1, BOX4.z + 0.0 - i * 0.03)
      lt.visible = true
      lt.scale.setScalar(1)
      lt.quaternion.copy(camera.quaternion)
      if (c >= M.reach[1] - 0.1) {
        /* the mother's part: out of the box in her hand, then into her pocket */
        const take = seg(c, M.reach[1] - 0.1, M.reach[1] + 0.05)
        lt.position.copy(inside).lerp(mumHand.clone().add(V(0.0, 0.02 + i * 0.03, 0.01 * i)), take)
        lt.rotateZ(0.25 + i * 0.25)
        const pk = seg(c, M.pocket[0] + 0.15, M.pocket[1])
        lt.scale.setScalar(Math.max(0.001, 1 - pk))
        lt.visible = pk < 0.99
      } else if (k >= T4.slot[1]) {
        /* posted: lying inside the box (seen only while the lid is open) */
        lt.position.copy(inside)
        lt.quaternion.setFromEuler(new THREE.Euler(-0.15, 0, Math.PI / 2 - 0.12 + i * 0.24))
      } else {
        /* in the poster's hand (the poster's own frame), then upright above the slot and down through it */
        const kq = mod(cq - off, L4)
        const pRoot = postRoot(cq, off).root
        rigToWorld(handPt('L', sh, postArmL(cq, off, sh, h, camera)), h, pRoot, camera, tmp)
        towardCamera(tmp, camera, 0.08)
        lt.position.copy(tmp)
        lt.rotateZ(-0.35 + 0.35 * hold(kq, ...T4.post))
        if (k >= T4.slot[0]) {
          const top = SLOT4.clone().add(V(0, 0.08, 0))
          const s = seg(k, T4.slot[0], T4.slot[0] + 0.12)
          lt.position.lerp(top, s)
          lt.quaternion.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2 * s))
          lt.position.y -= 0.22 * seg(k, T4.slot[0] + 0.1, T4.slot[1])
        }
      }
    }
    placeLetter(letterP, 0, r.shPost, P4.hPost, 0)
    placeLetter(letterN, T4.nbOff, r.shNb, P4.hNb, 1)

    /* the mother's key and the lid */
    const out = keyOut(-1)
    const reachK = hold(c, M.up[0], M.up[1], M.reach[0], M.reach[1])
    const insK = hold(c, M.up[1] - 0.12, M.up[1], M.out[0], M.out[1])
    const turnK = hold(c, M.turn[0], M.turn[0] + 0.12, M.turn[1], M.turn[1] + 0.05)
    qKey(out, -1.3 * turnK, q)
    qRest.setFromEuler(new THREE.Euler(0, 0, -1.9))
    keyMum.quaternion.copy(qRest).slerp(q, clamp01(reachK * 1.4))
    keyMum.position.copy(mumHand).sub(V(0.2 * KEY_S4, 0, 0).applyQuaternion(keyMum.quaternion)).lerp(KEYHOLE4.clone().addScaledVector(out, -0.015), insK)
    const lidOpen = hold(c, M.lid[0], M.lid[1], M.lidShut[0], M.lidShut[1])
    lid.rotation.x = 1.75 * lidOpen
    glowAt(boxGlow, KEYHOLE4, camera, 0.85 * insK * turnK)
  }
}

/* one camera for both T04 cards */
function frameCam4(camera: THREE.PerspectiveCamera) {
  camera.fov = 40
  camera.position.set(-0.16, 1.36, 4.85)
  camera.lookAt(-0.16, 1.12, -0.6)
  camera.updateProjectionMatrix()
}

/* ------------------------------------------------------------------ T04 concept */

const LOCKED_BAR = new THREE.Color('#B9C3D6')
const OPEN_BAR = new THREE.Color(colors.brand)
/** the data block: a white rounded block with rows of data bars on its face; locked they scramble and dim */
function dataBlock(scene: THREE.Scene, at: THREE.Vector3, w: number, h: number, d: number) {
  const g = new THREE.Group()
  g.position.copy(at)
  g.add(box(w, h, d, mat('#FFFFFF', { roughness: 0.35 }), [0, 0, 0], 0.05))
  g.add(flat(box(w - 0.08, h - 0.08, 0.01, mat('#EAF0FC', { roughness: 0.5 }), [0, 0, d / 2 + 0.002], 0.02)))
  const bars: { m: THREE.Mesh; mat: THREE.MeshStandardMaterial; a: { x: number; w: number }; s: { x: number; w: number }; y: number }[] = []
  const rows = 5
  const r = (n: number) => (Math.sin(n * 91.7) * 43758.5453) % 1
  for (let i = 0; i < rows; i++) {
    const y = h / 2 - 0.12 - i * ((h - 0.22) / (rows - 1))
    for (let j = 0; j < 3; j++) {
      const span = w - 0.2
      const aw = span / 3 - 0.02
      const a = { x: -span / 2 + aw / 2 + j * (aw + 0.03), w: aw }
      const s = { x: (Math.abs(r(i * 3 + j + 1)) - 0.5) * (span - 0.1), w: 0.04 + Math.abs(r(i * 7 + j + 5)) * 0.08 }
      const bm = glowM(C.brand, '#B9C3D6')
      const m = flat(box(1, 0.035, 0.012, bm, [0, y, d / 2 + 0.012], 0.006))
      g.add(m)
      bars.push({ m, mat: bm, a, s, y })
    }
  }
  scene.add(g)
  return {
    g,
    /** u: 0 locked (scrambled, dim), 1 unlocked (aligned, lit) */
    set(u: number, t: number) {
      bars.forEach((b, i) => {
        const jit = (1 - u) * 0.012 * Math.sin(t * 9 + i * 1.7)
        b.m.position.x = lerp(b.s.x, b.a.x, u) + jit
        b.m.scale.x = lerp(b.s.w, b.a.w, u)
        b.mat.color.copy(LOCKED_BAR).lerp(OPEN_BAR, u)
        b.mat.emissiveIntensity = 0.55 * u
      })
    },
  }
}

function setupT04Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#E9EFFA')
  frameCam4(camera)
  lights(scene, [0, 1.2, -0.6], 7)
  floorPlane(scene, slabTex('#E1E8F5', '#CDD8EC', [10, 6]))
  scene.add(flat(box(12, 4, 0.12, backdrop('#E9EEF8'), [0, 2, -1.6])))
  scene.add(flat(box(12, 0.08, 0.03, mat('#C9D3E6', { roughness: 0.7 }), [0, 0.04, -1.53])))
  /* a soft divide behind the two halves: a symmetric zone (blue) and an asymmetric one (gold), as wall panels */
  scene.add(flat(box(4.0, 3.6, 0.02, backdrop('#DCE6FA'), [-2.0, 1.95, -1.52])))
  scene.add(flat(box(4.0, 3.6, 0.02, backdrop('#F6ECD6'), [2.0, 1.95, -1.52])))

  /* LEFT: the data block where the door is, on a white plinth; its padlock where the lock is */
  const bH = 0.92
  const blockAt = V(P4.door, 0.5 + bH / 2, P4.wallZ + 0.1)
  scene.add(plinth(1.0, 0.5, 0.54, [P4.door, 0, P4.wallZ + 0.1]))
  const block = dataBlock(scene, blockAt, 0.86, bH, 0.42)
  const lockAt = V(P4.door, 0.72, blockAt.z + 0.21 + 0.05)
  const pad = padlockProp(C.brand, 1.5)
  pad.g.position.copy(lockAt)
  scene.add(pad.g)
  const lockGlow = halo('#8FB0FF', 0.42)
  scene.add(lockGlow)

  /* laptop A where the father stands, laptop B where the daughter stands: each with a copy of the one key */
  const lapAt = (x: number, z = P4.pz) => {
    scene.add(plinth(0.62, 0.8, 0.44, [x, 0, z]))
    const l = laptopProp(screenTex(C.brand, 'key'))
    l.g.position.set(x, 0.8, z)
    l.g.scale.setScalar(1.45)
    scene.add(l.g)
    return l
  }
  const lapA = lapAt(P4.dadX)
  const lapB = lapAt(P4.dauX)
  const keyA = keyProp(C.brand, '#C9D2E0')
  const keyB = keyProp(C.brand, '#C9D2E0')
  keyA.scale.setScalar(KEY_SC)
  keyB.scale.setScalar(KEY_SC)
  scene.add(keyA, keyB)

  /* RIGHT: the receiving laptop where the mother stands, its private key (gold) */
  const lapR = lapAt(P4.mumX, P4.pz + 0.08)
  ;(lapR.screenM.map as THREE.Texture).dispose()
  const goldScr = screenTex('#C99A2E', 'key')
  lapR.screenM.map = goldScr
  lapR.screenM.emissiveMap = goldScr
  const keyR = keyProp(C.gold, '#E2C77E')
  keyR.scale.setScalar(KEY_SC)
  scene.add(keyR)
  /* the receiving box where the letterbox is: same shell, an OPEN padlock hovering at its slot (the public key) */
  const lid = letterbox(scene, '#FFFFFF', C.brand)
  const pub = padlockProp(C.teal, 1.4)
  pub.set(1)
  const pubAt = SLOT4.clone().add(V(0, 0.34, 0.06))
  pub.g.position.copy(pubAt)
  scene.add(pub.g)
  const pubGlow = halo('#7FE0D6', 0.36)
  scene.add(pubGlow)
  const boxGlow = halo('#FFE29A', 0.42)
  scene.add(boxGlow)
  /* sender laptops where the postman and the neighbour post */
  const phoneAt = (x: number) => {
    scene.add(plinth(0.26, 0.92, 0.28, [x, 0, P4.pz]))
    const g = new THREE.Group()
    g.position.set(x, 0.92, P4.pz)
    g.add(box(0.1, 0.03, 0.12, mat('#C9D0DC', { roughness: 0.35, metalness: 0.5 }), [0, 0.015, 0], 0.01))
    const ph = new THREE.Group()
    ph.position.set(0, 0.03, -0.02)
    ph.rotation.x = -0.18
    ph.add(box(0.17, 0.32, 0.022, mat('#2B3040', { roughness: 0.3, metalness: 0.3 }), [0, 0.16, 0], 0.025))
    const e = canvasTex(80, 150, (g2) => {
      g2.fillStyle = '#F2F6FF'
      g2.fillRect(0, 0, 80, 150)
      g2.fillStyle = C.teal
      g2.beginPath()
      g2.roundRect(14, 52, 52, 36, 5)
      g2.fill()
      g2.strokeStyle = '#F2F6FF'
      g2.lineWidth = 3
      g2.beginPath()
      g2.moveTo(16, 55)
      g2.lineTo(40, 73)
      g2.lineTo(64, 55)
      g2.stroke()
    })
    const screenM = new THREE.MeshStandardMaterial({ map: e, roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveMap: e, emissiveIntensity: 0.35 })
    ph.add(flat(mesh(new THREE.PlaneGeometry(0.15, 0.29), screenM, [0, 0.16, 0.0115])))
    g.add(ph)
    scene.add(g)
    return { screenM }
  }
  const s1 = phoneAt(P4.postX - 0.2)
  const s2 = phoneAt(P4.postX + 0.13)
  /* the two envelopes, each with its own copy of the open padlock that closes on it */
  const envs = [
    { m: letterProp(envelopeTex('#FFFFFF', C.teal), 0.22, 0.14), lock: padlockProp(C.teal, 0.8), from: V(P4.postX - 0.2, 1.12, P4.pz + 0.02), off: 0, i: 0 },
    { m: letterProp(envelopeTex('#FFFFFF', C.teal), 0.22, 0.14), lock: padlockProp(C.teal, 0.8), from: V(P4.postX + 0.13, 1.12, P4.pz + 0.02), off: T4.nbOff, i: 1 },
  ]
  for (const e of envs) scene.add(e.m, e.lock.g)
  const keyHomeA = V(P4.dadX - 0.12, 1.4, P4.pz + 0.05)
  const keyHomeB = V(P4.dauX - 0.12, 1.4, P4.pz + 0.05)
  const keyHomeR = V(P4.mumX - 0.12, 1.4, P4.pz + 0.13)
  const q = new THREE.Quaternion()
  const qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + 0.25))
  const tmp = new THREE.Vector3()
  /** a key flying from its laptop to the padlock and back, synced to the person's turn */
  const flyKey = (key: THREE.Object3D, home: THREE.Vector3, t0: number, sg: number, c: number) => {
    const tn = turnAt(c, t0)
    const out = keyOut(sg)
    const inLock = lockAt.clone().add(V(0, 0.005, 0.035)).addScaledVector(out, -0.01)
    const near = inLock.clone().addScaledVector(out, 0.2)
    qKey(out, tn.turn * tn.dir * 1.3, q)
    key.quaternion.copy(qUp).slerp(q, clamp01(tn.reach * 1.4))
    arc(home, near, tn.reach, 0.25, tmp)
    key.position.copy(tmp).lerp(inLock, tn.ins)
    /* a gentle float while it waits on its laptop */
    key.position.y += 0.012 * Math.sin(TAU * (c / 2 + (sg > 0 ? 0.5 : 0))) * (1 - tn.reach)
    return tn
  }
  return (t: number) => {
    const c = mod(t, L4)
    const tA = flyKey(keyA, keyHomeA, T4.dad, -1, c)
    const tB = flyKey(keyB, keyHomeB, T4.dau, 1, c)
    const u = Math.max(tA.unlocked, tB.unlocked)
    pad.set(u)
    block.set(seg(u, 0.3, 1), t)
    glowAt(lockGlow, lockAt, camera, 0.9 * Math.max(tA.ins * tA.turn, tB.ins * tB.turn) + 0.4 * u)
    lapA.screenM.emissiveIntensity = 0.35 + 0.4 * tA.reach
    lapB.screenM.emissiveIntensity = 0.35 + 0.4 * tB.reach

    /* the envelopes: out of the sender's screen, up to the slot, a padlock copy drops on and snaps shut, down in */
    const M = T4.mum
    envs.forEach((e) => {
      const k = mod(c - e.off, L4)
      const inside = V(BOX4.x - 0.05 + e.i * 0.08, BOX4.y0 + 0.12, BOX4.z + 0.02 - e.i * 0.03)
      const arrive = SLOT4.clone().add(V(0, 0.12, 0.02))
      const fly = seg(k, T4.post[0], T4.slot[0])
      const snap = seg(k, T4.slot[0], T4.slot[0] + 0.18)
      const drop = seg(k, T4.slot[0] + 0.2, T4.slot[1] + 0.05)
      const posted = c >= e.off + T4.slot[0] + 0.2
      e.m.quaternion.copy(camera.quaternion)
      e.lock.g.quaternion.copy(camera.quaternion)
      let lockOn = 0
      if (c >= M.reach[1] - 0.15 && c <= M.down[1]) {
        /* the private key has opened the box: the padlocks spring open and fade, the envelopes go to the laptop */
        const go = seg(c, M.lift[0], M.pocket[1])
        const dest = V(P4.mumX, 1.08, P4.pz + 0.15)
        arc(inside.clone().add(V(0, 0.1, 0.05)), dest, go, 0.3, e.m.position)
        e.m.scale.setScalar(Math.max(0.001, 1 - seg(c, M.pocket[0] + 0.1, M.pocket[1])))
        e.m.visible = c < M.pocket[1] - 0.02
        e.lock.set(seg(c, M.reach[1] - 0.15, M.reach[1] + 0.15))
        e.lock.g.position.copy(e.m.position).add(V(0.0, 0.03 + 0.15 * seg(c, M.reach[1], M.lift[0] + 0.2), 0.02))
        lockOn = 1 - seg(c, M.reach[1] + 0.05, M.lift[0] + 0.15)
        e.m.position.y += 0.1 * seg(c, M.reach[0], M.reach[1]) * (1 - go)
      } else if (posted && c > e.off) {
        e.m.position.copy(inside)
        e.m.visible = lid.rotation.x > 0.05
        e.lock.set(0)
        e.lock.g.position.copy(inside).add(V(0, 0.03, 0.02))
        lockOn = e.m.visible ? 1 : 0
      } else {
        e.m.visible = true
        e.m.scale.setScalar(1)
        arc(e.from, arrive, fly, 0.18, e.m.position)
        if (k >= T4.slot[0]) e.m.position.copy(arrive).add(V(0, -0.22 * drop, -0.06 * drop))
        /* hidden once it is through the slot */
        e.m.visible = !(k >= T4.slot[0] && drop > 0.6)
        e.m.scale.setScalar(k < T4.post[0] ? Math.max(0.001, seg(k, T4.post[0] - 0.3, T4.post[0])) : 1)
        if (c < e.off) e.m.scale.setScalar(0.001)
        e.lock.set(1 - snap)
        e.lock.g.position.copy(pubAt).lerp(arrive.clone().add(V(0, 0.02, 0.025)), seg(k, T4.slot[0] - 0.2, T4.slot[0])).add(V(0, -0.22 * drop, -0.06 * drop))
        lockOn = k >= T4.slot[0] - 0.2 && e.m.visible ? 1 : 0
      }
      e.lock.g.visible = lockOn > 0.01
      e.lock.g.scale.setScalar(0.8 * Math.max(0.001, Math.min(1, lockOn * 1.5)))
    })
    glowAt(pubGlow, pubAt, camera, 0.35 + 0.15 * Math.sin(TAU * c / 2))
    pub.g.position.y = pubAt.y + 0.012 * Math.sin(TAU * c / 2)

    /* the private key: from the receiving laptop to the box's keyhole, turned, the lid opens, back with the envelopes */
    const outR = keyOut(-1)
    const go = seg(c, M.up[0] - 0.05, M.up[1])
    const ins = hold(c, M.up[1] - 0.12, M.up[1], M.out[0], M.out[1])
    const turn = hold(c, M.turn[0], M.turn[0] + 0.12, M.turn[1], M.turn[1] + 0.05)
    /* after the turn it steps aside, above the box, and goes home with the envelopes */
    const aside = seg(c, M.out[1] - 0.05, M.lid[1])
    const home = seg(c, M.lift[0], M.pocket[1] - 0.1)
    qKey(outR, -1.3 * turn, q)
    keyR.quaternion.copy(qUp).slerp(q, clamp01(go * 1.4) * (1 - aside))
    const inHole = KEYHOLE4.clone().addScaledVector(outR, -0.01)
    const hover = V(BOX4.x - 0.32, 1.62, BOX4.z + 0.1)
    arc(keyHomeR, inHole.clone().addScaledVector(outR, 0.2), go, 0.2, keyR.position)
    keyR.position.lerp(inHole, ins).lerp(hover, aside)
    if (home > 0) arc(hover, keyHomeR, home, 0.1, keyR.position)
    keyR.position.y += 0.012 * Math.sin(TAU * c / 2) * (1 - go)
    lid.rotation.x = 1.75 * hold(c, M.lid[0], M.lid[1], M.lidShut[0], M.lidShut[1])
    glowAt(boxGlow, KEYHOLE4, camera, 0.85 * ins * turn + 0.3 * hold(c, M.reach[0], M.reach[1], M.lift[1], M.pocket[0]))
    lapR.screenM.emissiveIntensity = 0.35 + 0.45 * hold(c, M.pocket[0], M.pocket[1] - 0.1, M.pocket[1], M.down[1])
    s1.screenM.emissiveIntensity = 0.35 + 0.4 * hold(c, T4.post[0] - 0.3, T4.post[0], T4.slot[0], T4.slot[1])
    s2.screenM.emissiveIntensity = 0.35 + 0.4 * hold(mod(c - T4.nbOff, L4), T4.post[0] - 0.3, T4.post[0], T4.slot[0], T4.slot[1])
  }
}

/* ================================================================== T05 · fruit into juice */

const L5 = 9
const F5 = 108
const HOLD5 = 4.15 /* the blended juice pouring into the glass, the fruit gone from the jar */
const P5 = {
  pX: 0,
  pZ: -0.66,
  h: 1.68,
  isle: { x0: -1.9, x1: 1.9, z0: -0.44, z1: -0.04, h: 0.74 },
  crate: V(-0.5, 0.74, -0.27),
  blender: V(0.02, 0.74, -0.26),
  glass: V(0.42, 0.74, -0.24),
  jarH: 0.2,
  baseH: 0.08,
}
const JAR_Y0 = P5.isle.h + P5.baseH
const T5 = {
  drops: [0.0, 0.7, 1.4] as const /* each: reach the crate 0-0.3, lift over the jar 0.3-0.55, let go 0.55 */,
  press1: [2.1, 2.35] as const,
  blend1: [2.35, 3.25] as const,
  pour1: { grab: [3.25, 3.5] as const, lift: [3.5, 3.85] as const, pour: [3.85, 4.4] as const, back: [4.4, 4.75] as const },
  tip: { grab: [4.75, 5.0] as const, lift: [5.0, 5.3] as const, pour: [5.3, 5.65] as const, back: [5.65, 5.95] as const },
  press2: [5.95, 6.2] as const,
  blend2: [6.2, 6.95] as const,
  pour2: { grab: [6.95, 7.15] as const, lift: [7.15, 7.4] as const, pour: [7.4, 7.75] as const, back: [7.75, 7.95] as const },
  drink: { grab: [7.95, 8.12] as const, up: [8.12, 8.36] as const, sip: [8.36, 8.6] as const, down: [8.6, 8.8] as const },
}
const DROP = { reach: 0.28, lift: 0.52, let: 0.56, back: 0.7 }
const PERSON5 = V(P5.pX, 0, P5.pZ)
/** where the left hand lets each fruit go (just above the rim) and the dial on the base's front */
const DROP_AT = V(P5.blender.x - 0.01, 0.74 + 0.08 + 0.2 + 0.07, P5.blender.z)
const DIAL5 = V(P5.blender.x - 0.04, 0.74 + 0.045, P5.blender.z + 0.092)
/** the jar's handle (right side) and the jar's pour lip, relative to the jar's bottom centre */
const HANDLE = V(0.115, 0.12, 0)
const LIP = V(0.085, P5.jarH, 0)
const GLASS_H = 0.15
/** how full the jar is (0..1) and how full the glass is, at loop time c */
function levels5(c: number) {
  const juiced = seg(c, T5.blend1[0] + 0.2, T5.blend1[1])
  const p1 = seg(c, T5.pour1.pour[0], T5.pour1.pour[1])
  const tb = seg(c, T5.tip.pour[0], T5.tip.pour[1])
  const p2 = seg(c, T5.pour2.pour[0], T5.pour2.pour[1])
  const dr = seg(c, T5.drink.up[1] - 0.05, T5.drink.sip[1])
  const jar = juiced * (1 - p1) + tb - p2
  const glass = p1 - tb + p2 - dr
  return { jar: clamp01(jar) * 0.62, glass: clamp01(glass) * 0.8, juiced }
}
/** which hand-held thing the right hand is on, and where (in the scene) */
type Hold5 = { jar: number; glass: number; tiltJar: number; tiltGlass: number }
function holds5(c: number): Hold5 {
  const p = (o: { grab: readonly [number, number]; lift: readonly [number, number]; pour: readonly [number, number]; back: readonly [number, number] }) => ({
    on: hold(c, o.grab[1] - 0.05, o.grab[1], o.back[1] - 0.05, o.back[1]),
    tilt: hold(c, o.lift[0] + 0.1, o.pour[0], o.pour[1], o.back[0] + 0.15),
  })
  const a = p(T5.pour1)
  const b = p(T5.pour2)
  const g = p(T5.tip)
  const dOn = hold(c, T5.drink.grab[1] - 0.05, T5.drink.grab[1], T5.drink.down[1] - 0.05, T5.drink.down[1])
  return { jar: Math.max(a.on, b.on), glass: Math.max(g.on, dOn), tiltJar: Math.max(a.tilt, b.tilt), tiltGlass: Math.max(g.tilt, hold(c, T5.drink.up[0], T5.drink.sip[0], T5.drink.sip[1], T5.drink.down[1])) }
}
/** the jar's bottom centre while held: lifted, moved over the glass */
function jarPlace(c: number, out: THREE.Vector3) {
  const lift = (o: { lift: readonly [number, number]; back: readonly [number, number] }) => hold(c, o.lift[0], o.lift[1], o.back[0], o.back[1])
  const k = Math.max(lift(T5.pour1), lift(T5.pour2))
  const over = P5.glass.clone().add(V(-0.17, 0.2 + GLASS_H, 0.02))
  return out.set(P5.blender.x, JAR_Y0, P5.blender.z).lerp(over, k)
}
/** the glass's bottom centre while held: tipped over the jar, or at her mouth */
function glassPlace(c: number, out: THREE.Vector3) {
  const tipK = hold(c, T5.tip.lift[0], T5.tip.lift[1], T5.tip.back[0], T5.tip.back[1])
  const drinkK = hold(c, T5.drink.up[0], T5.drink.up[1], T5.drink.down[0], T5.drink.down[1])
  const overJar = V(P5.blender.x + 0.15, JAR_Y0 + P5.jarH + 0.04, P5.blender.z + 0.02)
  const mouth = V(P5.pX + 0.07, 1.27, P5.pZ + 0.22)
  out.copy(P5.glass)
  out.lerp(overJar, tipK)
  return out.lerp(mouth, drinkK)
}
function personArmR5(c: number, cam: THREE.Camera, sh: number): Arm {
  let a: Arm = { s: 10, e: 18 }
  const aim = (p: THREE.Vector3) => aimAt('R', sh, P5.h, PERSON5, cam, p)
  const hd = holds5(c)
  const jp = jarPlace(c, new THREE.Vector3())
  const handleW = jp.clone().add(HANDLE.clone().applyAxisAngle(V(0, 0, 1), -1.9 * hd.tiltJar))
  const toJar = (o: { grab: readonly [number, number]; back: readonly [number, number] }) => hold(c, o.grab[0], o.grab[1], o.back[1], o.back[1] + 0.2)
  a = mixA(a, aim(handleW), Math.max(toJar(T5.pour1), toJar(T5.pour2)))
  const gp = glassPlace(c, new THREE.Vector3()).add(V(0.035, 0.07, 0.03))
  const toGlass = Math.max(hold(c, T5.tip.grab[0], T5.tip.grab[1], T5.tip.back[1], T5.tip.back[1] + 0.2), hold(c, T5.drink.grab[0], T5.drink.grab[1], T5.drink.down[1], 8.98))
  a = mixA(a, aim(gp), toGlass)
  /* the glass up to her mouth: the elbow in, across the chest */
  a = mixA(a, aimAt('R', sh, P5.h, PERSON5, cam, gp, 'in'), hold(c, T5.drink.up[0], T5.drink.up[1], T5.drink.down[0], T5.drink.down[1]))
  return a
}
function personArmL5(c: number, cam: THREE.Camera, sh: number): Arm {
  let a: Arm = { s: 10, e: 18 }
  const aim = (p: THREE.Vector3) => aimAt('L', sh, P5.h, PERSON5, cam, p)
  const pick = P5.crate.clone().add(V(0.02, 0.2, 0))
  for (const d of T5.drops) {
    const k = c - d
    if (k < -0.05 || k > DROP.back + 0.1) continue
    const p = pick.clone().lerp(DROP_AT, seg(k, DROP.reach, DROP.lift))
    a = mixA(a, aim(p), hold(k, 0, DROP.reach, DROP.let + 0.02, DROP.back))
  }
  /* the dial: forward for the first run, the other way for the reverse run */
  a = mixA(a, aim(DIAL5.clone().add(V(-0.01, 0.02, 0.03))), Math.max(hold(c, T5.press1[0] - 0.2, T5.press1[0] + 0.02, T5.press1[1], T5.press1[1] + 0.25), hold(c, T5.press2[0] - 0.2, T5.press2[0] + 0.02, T5.press2[1], T5.press2[1] + 0.25)))
  return a
}
const COOK_FACES: [number, string][] = [[0, 'happy'], [2.1, 'listening'], [2.5, 'grin'], [3.3, 'happy'], [4.75, 'thinking'], [6.1, 'confused'], [6.9, 'worried'], [7.4, 'neutral'], [8.2, 'happy']]

/** the kitchen island and the back wall (everyday) */
function kitchen(scene: THREE.Scene) {
  scene.background = new THREE.Color('#F3EEE6')
  floorPlane(scene, slabTex('#E7DED0', '#D3C7B5', [10, 6]))
  /* back wall with a tiled splashback, a back counter and upper cabinets */
  const wz = -1.35
  scene.add(flat(box(8, 4, 0.1, mat('#F6F0E6', { roughness: 0.95, emissive: new THREE.Color('#F6F0E6'), emissiveIntensity: 0.25 }), [0, 2, wz - 0.05])))
  scene.add(flat(box(8, 0.62, 0.02, mat('#ffffff', { map: tileTex('#E9F1F6', '#C9D7E2', [40, 3]), roughness: 0.4 }), [0, 1.22, wz + 0.01])))
  scene.add(box(8, 0.88, 0.55, mat('#8FB1A0', { roughness: 0.55 }), [0, 0.44, wz + 0.29]))
  scene.add(box(8, 0.04, 0.58, mat('#F4F1EA', { roughness: 0.35 }), [0, 0.9, wz + 0.29]))
  const cabM = mat('#8FB1A0', { roughness: 0.55 })
  for (let x = -3; x <= 3; x += 0.62) {
    scene.add(box(0.58, 0.62, 0.32, cabM, [x, 1.95, wz + 0.16], 0.02))
    scene.add(flat(box(0.03, 0.14, 0.02, mat('#E0C68A', { metalness: 0.6, roughness: 0.3 }), [x + 0.22, 1.74, wz + 0.33])))
  }
  /* a window over the back counter, at the right */
  scene.add(box(0.86, 0.6, 0.05, mat('#FFFFFF'), [1.25, 1.22, wz + 0.04]))
  scene.add(flat(box(0.76, 0.5, 0.02, mat('#BFD9F0', { emissive: new THREE.Color('#DCEBFA'), emissiveIntensity: 0.6 }), [1.25, 1.22, wz + 0.07])))
  /* the island: a wood worktop on painted cupboards */
  const k = P5.isle
  const cx = (k.x0 + k.x1) / 2
  const cz = (k.z0 + k.z1) / 2
  scene.add(box(k.x1 - k.x0, k.h - 0.04, k.z1 - k.z0, mat('#F1EDE4', { roughness: 0.6 }), [cx, (k.h - 0.04) / 2, cz], 0.02))
  scene.add(box(k.x1 - k.x0 + 0.06, 0.04, k.z1 - k.z0 + 0.08, mat('#C99D6E', { roughness: 0.45 }), [cx, k.h - 0.02, cz + 0.01], 0.012))
  for (let x = k.x0 + 0.32; x < k.x1 - 0.1; x += 0.6) scene.add(flat(box(0.52, 0.62, 0.012, mat('#E6E0D3', { roughness: 0.6 }), [x, 0.44, k.z1 + 0.006], 0.012)))
}

/** a whole fruit: apple / orange / pear */
function fruitMesh(kind: number) {
  const g = new THREE.Group()
  if (kind === 0) {
    g.add(mesh(new THREE.SphereGeometry(0.045, 24, 18).scale(1, 0.92, 1), mat('#D8352F', { roughness: 0.35 }), [0, 0, 0]))
    g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.025, 6), mat('#6B4A2A'), [0, 0.047, 0]))
    const leaf = mesh(new THREE.SphereGeometry(0.012, 10, 8).scale(1.8, 0.5, 1), mat('#4F9E3A'), [0.014, 0.05, 0])
    leaf.rotation.z = 0.5
    g.add(leaf)
  } else if (kind === 1) {
    g.add(mesh(new THREE.SphereGeometry(0.047, 24, 18), mat('#F39A1E', { roughness: 0.75 }), [0, 0, 0]))
    g.add(mesh(new THREE.SphereGeometry(0.008, 8, 6), mat('#5E8E2E'), [0, 0.045, 0]))
  } else {
    const pts = [0, 0.02, 0.038, 0.042, 0.036, 0.025, 0.017, 0.013, 0.006, 0].map((r, i) => new THREE.Vector2(r, -0.045 + i * 0.012))
    g.add(mesh(new THREE.LatheGeometry(pts, 24), mat('#A8C93A', { roughness: 0.5 }), [0, 0, 0]))
    g.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 6), mat('#6B4A2A'), [0, 0.07, 0]))
  }
  return flat(g)
}

/** the blender: base with a dial, a glass jar with a handle and lip, blades, juice and the fruit inside */
function blender(scene: THREE.Scene) {
  const at = P5.blender
  scene.add(box(0.2, P5.baseH, 0.18, mat('#2B3040', { roughness: 0.35, metalness: 0.3 }), [at.x, P5.isle.h + P5.baseH / 2, at.z], 0.025))
  const dial = new THREE.Group()
  dial.position.copy(DIAL5)
  dial.add(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.014, 24).rotateX(Math.PI / 2), mat('#E8ECF4', { metalness: 0.4, roughness: 0.3 }), [0, 0, 0]))
  dial.add(flat(box(0.006, 0.02, 0.004, mat('#2B3040'), [0, 0.01, 0.009])))
  scene.add(dial)
  const lamp = glowM(C.green, '#3A4256')
  scene.add(flat(mesh(new THREE.CircleGeometry(0.008, 12), lamp, [at.x + 0.06, P5.isle.h + 0.05, at.z + 0.091])))
  const jar = new THREE.Group()
  /* the glass */
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#EAF4FF', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide })
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.066, P5.jarH, 32, 1, true), glassM)
  shell.position.y = P5.jarH / 2
  shell.renderOrder = 6
  jar.add(shell)
  jar.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 28), mat('#2B3040', { roughness: 0.4 }), [0, 0.015, 0]))
  jar.add(flat(mesh(new THREE.TorusGeometry(0.085, 0.004, 8, 40).rotateX(Math.PI / 2), mat('#DDE6F3', { roughness: 0.1, transparent: true, opacity: 0.7 }), [0, P5.jarH, 0])))
  /* the handle */
  jar.add(box(0.02, 0.14, 0.03, mat('#2B3040', { roughness: 0.4 }), [0.108, 0.12, 0], 0.008))
  jar.add(box(0.03, 0.02, 0.03, mat('#2B3040', { roughness: 0.4 }), [0.09, 0.185, 0], 0.006))
  jar.add(box(0.03, 0.02, 0.03, mat('#2B3040', { roughness: 0.4 }), [0.09, 0.055, 0], 0.006))
  /* the blades */
  const blades = new THREE.Group()
  blades.position.y = 0.04
  for (let i = 0; i < 4; i++) {
    const b = box(0.07, 0.004, 0.014, mat('#C9D2E0', { metalness: 0.85, roughness: 0.2 }), [0.03, 0, 0])
    b.rotation.x = i % 2 ? 0.4 : -0.4
    const w = new THREE.Group()
    w.rotation.y = (i * Math.PI) / 2
    w.add(b)
    blades.add(w)
  }
  jar.add(flat(blades))
  /* the juice: a column whose height is the level, and a swirled top */
  const juiceM = mat(C.juice, { roughness: 0.25, emissive: new THREE.Color(C.juice), emissiveIntensity: 0.15, transparent: true, opacity: 0.95 })
  const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.079, 0.062, 1, 28).translate(0, 0.5, 0), juiceM)
  juice.position.y = 0.032
  jar.add(juice)
  const swirlTex = canvasTex(64, 64, (g) => {
    g.fillStyle = C.juice
    g.beginPath()
    g.arc(32, 32, 32, 0, TAU)
    g.fill()
    g.strokeStyle = 'rgba(255,230,180,0.85)'
    g.lineWidth = 3
    g.beginPath()
    for (let a = 0; a < TAU * 2.2; a += 0.1) g.lineTo(32 + Math.cos(a) * a * 2.2, 32 + Math.sin(a) * a * 2.2)
    g.stroke()
  })
  const swirl = flat(mesh(new THREE.CircleGeometry(0.078, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: swirlTex, roughness: 0.3 }), [0, 0.1, 0]))
  jar.add(swirl)
  jar.position.set(at.x, JAR_Y0, at.z)
  scene.add(jar)
  return { jar, blades, juice, juiceM, swirl, dial, lamp }
}

/** a tall glass with its juice column */
function glassProp() {
  const g = new THREE.Group()
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#EAF4FF', roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide })
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, GLASS_H, 28, 1, true), glassM)
  shell.position.y = GLASS_H / 2
  shell.renderOrder = 6
  g.add(shell)
  g.add(flat(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 24), new THREE.MeshPhysicalMaterial({ color: '#EAF4FF', roughness: 0.05, transparent: true, opacity: 0.5 }), [0, 0.006, 0])))
  const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.034, 1, 24).translate(0, 0.5, 0), mat(C.juice, { roughness: 0.25, emissive: new THREE.Color(C.juice), emissiveIntensity: 0.15 }))
  juice.position.y = 0.012
  g.add(juice)
  return { g, juice }
}

/** a stream of liquid between two points */
function stream(color: string, r = 0.012) {
  const geo = new THREE.CylinderGeometry(r, r * 0.8, 1, 12, 1, true)
  geo.translate(0, -0.5, 0)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.2, emissive: new THREE.Color(color), emissiveIntensity: 0.2 }))
  m.castShadow = false
  const up = V(0, -1, 0)
  const dir = new THREE.Vector3()
  return {
    m,
    set(a: THREE.Vector3, b: THREE.Vector3, on: number) {
      dir.copy(b).sub(a)
      const len = dir.length()
      m.position.copy(a)
      m.quaternion.setFromUnitVectors(up, dir.normalize())
      m.scale.set(Math.max(0.001, on), Math.max(0.001, len), Math.max(0.001, on))
      m.visible = on > 0.02
    },
  }
}

function setupT05Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam5(camera)
  lights(scene, [0, 1.1, -0.5], 4)
  kitchen(scene)

  /* the crate of whole fruit: a wooden crate, a heap on top (never runs out: each fruit comes from the heap) */
  const cr = P5.crate
  const crateM = mat('#B07A48', { roughness: 0.7 })
  scene.add(box(0.3, 0.12, 0.2, crateM, [cr.x, cr.y + 0.06, cr.z], 0.01))
  for (const y of [0.035, 0.085]) scene.add(flat(box(0.304, 0.012, 0.204, mat('#8E5E35', { roughness: 0.8 }), [cr.x, cr.y + y, cr.z])))
  const heap = [[-0.08, 0], [0.0, 2], [0.08, 1], [-0.04, 1], [0.05, 0]] as const
  heap.forEach(([dx, kind], i) => {
    const f = fruitMesh(kind)
    f.position.set(cr.x + dx, cr.y + 0.14 + (i > 2 ? 0.04 : 0), cr.z + (i > 2 ? 0.02 : -0.03))
    f.rotation.y = i
    scene.add(f)
  })
  const bl = blender(scene)
  const gl = glassProp()
  scene.add(gl.g)
  /* the three fruits that go in (apple, orange, pear), and the pour streams */
  const fruits = [0, 1, 2].map((k) => {
    const f = fruitMesh(k)
    scene.add(f)
    return f
  })
  const pour = stream(C.juice, 0.013)
  scene.add(pour.m)

  /* the cook: an adult in an apron */
  const cfg = who(CAST_PRESETS.ananya, { name: 'Cook', hair: { style: 'bun', color: '#262B43' }, outfit: { top: 'tshirt', topColor: '#2F6FB2', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, build: { height: 1.02, shoulders: 1 } })
  const sh = buildSkin(cfg).shoulderHalf
  const cook = person({
    config: cfg,
    dress: withTop(APRON('#F4F1EA', '#C9B99A')),
    seed: 1511,
    faces: COOK_FACES,
    loop: L5,
    frames: F5,
    height: P5.h,
    redraw,
    holdT: HOLD5,
    pose: (p, c) => {
      const r = personArmR5(c, camera, sh)
      const l = personArmL5(c, camera, sh)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = l.s
      p.elbowL = l.e
      /* eyes on the crate, the jar, the glass */
      const toCrate = Math.max(...T5.drops.map((d) => hold(c - d, 0, 0.12, 0.28, 0.4)))
      to(p, 'headTurn', -0.35, toCrate)
      to(p, 'lookX', -0.8, toCrate)
      to(p, 'lookY', 0.55, Math.max(toCrate, hold(c, 0.3, 0.5, 2.0, 2.2), hold(c, T5.blend1[0], T5.blend1[0] + 0.2, T5.blend1[1] - 0.2, T5.blend1[1])))
      const toGlass = Math.max(hold(c, T5.pour1.lift[0], T5.pour1.pour[0], T5.pour1.pour[1], T5.pour1.back[1]), hold(c, T5.pour2.lift[0], T5.pour2.pour[0], T5.pour2.pour[1], T5.pour2.back[1]))
      to(p, 'headTurn', 0.32, toGlass)
      to(p, 'lookX', 0.8, toGlass)
      to(p, 'lookY', 0.45, toGlass)
      /* the reverse run: a puzzled look into the jar, then at the empty place by the crate where whole fruit should come back */
      const puzzled = hold(c, T5.blend2[0], T5.blend2[0] + 0.2, T5.blend2[1], T5.blend2[1] + 0.2)
      to(p, 'headTilt', 8, puzzled)
      to(p, 'lookY', 0.4, puzzled)
      const back = hold(c, T5.blend2[1] - 0.25, T5.blend2[1], T5.pour2.grab[1], T5.pour2.lift[1])
      to(p, 'headTurn', -0.3, back)
      to(p, 'lookX', -0.7, back)
      /* the sip */
      const sip = hold(c, T5.drink.up[0], T5.drink.up[1], T5.drink.down[0], T5.drink.down[1])
      to(p, 'headNod', -0.15, sip)
      to(p, 'lookY', -0.2, sip)
    },
  })
  cook.object.position.copy(PERSON5)
  scene.add(cook.object)

  const hand = new THREE.Vector3()
  const lhand = new THREE.Vector3()
  const jp = new THREE.Vector3()
  const gp = new THREE.Vector3()
  const top = DROP_AT.clone().add(V(0, 0.04, 0))
  return (t: number) => {
    const c = mod(t, L5)
    const cq = frameT(c, L5, F5)
    cook.update(c, camera)
    rigToWorld(handPt('L', sh, personArmL5(cq, camera, sh)), P5.h, PERSON5, camera, lhand)
    towardCamera(lhand, camera, 0.1)
    rigToWorld(handPt('R', sh, personArmR5(cq, camera, sh)), P5.h, PERSON5, camera, hand)
    const hd = holds5(c)
    const lv = levels5(c)

    /* the jar: on its base, or lifted and tilted over the glass */
    jarPlace(c, jp)
    bl.jar.position.copy(jp)
    bl.jar.rotation.z = -1.9 * hd.tiltJar
    /* the glass: on the worktop, tipped over the jar, or at her mouth */
    glassPlace(c, gp)
    gl.g.position.copy(gp)
    /* while she drinks the glass is in her hand (the hand's own frame), wherever the arm is on its way */
    const dHeld = hold(c, T5.drink.up[0], T5.drink.up[0] + 0.12, T5.drink.down[1] - 0.15, T5.drink.down[1] - 0.02)
    if (dHeld > 0) gl.g.position.lerp(towardCamera(hand.clone(), camera, 0.1).add(V(-0.035, -0.07, -0.03)), dHeld)
    const tipK = hold(c, T5.tip.lift[0], T5.tip.lift[1], T5.tip.back[0], T5.tip.back[1])
    gl.g.rotation.z = 2.0 * hold(c, T5.tip.lift[0] + 0.1, T5.tip.pour[0], T5.tip.pour[1], T5.tip.back[0] + 0.1) * (tipK > 0 ? 1 : 0) + 0.9 * hold(c, T5.drink.up[0] + 0.1, T5.drink.sip[0], T5.drink.sip[1], T5.drink.down[1])

    /* levels */
    bl.juice.scale.y = Math.max(0.001, lv.jar * P5.jarH)
    bl.juice.visible = lv.jar > 0.004
    bl.swirl.position.y = 0.032 + lv.jar * P5.jarH + 0.001
    bl.swirl.visible = lv.jar > 0.004
    gl.juice.scale.y = Math.max(0.001, lv.glass * GLASS_H)
    gl.juice.visible = lv.glass > 0.004

    /* the blades and the swirl: forward on the first run, backward on the reverse run */
    const run1 = hold(c, T5.blend1[0], T5.blend1[0] + 0.1, T5.blend1[1] - 0.1, T5.blend1[1])
    const run2 = hold(c, T5.blend2[0], T5.blend2[0] + 0.1, T5.blend2[1] - 0.1, T5.blend2[1])
    const spin = c < 5 ? 1 : -1
    bl.blades.rotation.y = spin * 40 * (seg(c, T5.blend1[0], T5.blend1[1]) * 0.9) + -40 * seg(c, T5.blend2[0], T5.blend2[1]) * 0.75
    bl.swirl.rotation.y = 18 * seg(c, T5.blend1[0], T5.blend1[1]) - 14 * seg(c, T5.blend2[0], T5.blend2[1])
    bl.jar.position.x += 0.0025 * Math.sin(c * 90) * Math.max(run1, run2)
    bl.dial.rotation.z = -1.1 * hold(c, T5.press1[0], T5.press1[1], T5.blend1[1], T5.blend1[1] + 0.15) + 1.1 * hold(c, T5.press2[0], T5.press2[1], T5.blend2[1], T5.blend2[1] + 0.15)
    bl.lamp.emissiveIntensity = 1.6 * Math.max(run1, run2)

    /* the fruit: from the heap in her hand, over the jar, dropped in; swirled and gone in the first run */
    fruits.forEach((f, i) => {
      const k = c - T5.drops[i]
      const inJar = V(P5.blender.x + [-0.025, 0.03, 0.0][i], JAR_Y0 + 0.08 + i * 0.05, P5.blender.z + [0.01, -0.01, 0.02][i])
      if (k < 0 || c > T5.blend1[1]) {
        f.visible = false
        return
      }
      f.visible = true
      f.scale.setScalar(1)
      if (k < DROP.let) {
        const inHand = lhand.clone().add(V(0.0, -0.035, 0.02))
        f.position.copy(inHand)
        if (k < DROP.reach) f.scale.setScalar(Math.max(0.001, seg(k, DROP.reach - 0.12, DROP.reach)))
      } else if (k < DROP.let + 0.3) {
        const fall = seg(k, DROP.let, DROP.let + 0.25)
        f.position.copy(top).add(V(0, -0.05, 0)).lerp(inJar, fall * fall)
      } else f.position.copy(inJar)
      /* blending: round the jar, smaller and smaller into the juice */
      if (c > T5.blend1[0]) {
        const b = seg(c, T5.blend1[0], T5.blend1[1] - 0.15)
        const a = c * 18 + i * 2.1
        f.position.set(P5.blender.x + Math.cos(a) * 0.04, JAR_Y0 + 0.07 + 0.04 * Math.sin(a * 0.7 + i), P5.blender.z + Math.sin(a) * 0.04)
        f.scale.setScalar(Math.max(0.001, 1 - b))
        f.visible = b < 0.98
      }
      f.rotation.set(k * 3 + i, k * 2, 0)
    })

    /* the pour streams: jar lip to glass, glass rim to jar */
    const pourOn = Math.max(hold(c, T5.pour1.pour[0], T5.pour1.pour[0] + 0.08, T5.pour1.pour[1] - 0.08, T5.pour1.pour[1]), hold(c, T5.pour2.pour[0], T5.pour2.pour[0] + 0.08, T5.pour2.pour[1] - 0.08, T5.pour2.pour[1]))
    const tipOn = hold(c, T5.tip.pour[0], T5.tip.pour[0] + 0.08, T5.tip.pour[1] - 0.08, T5.tip.pour[1])
    if (pourOn > 0.02) {
      const lip = LIP.clone().applyAxisAngle(V(0, 0, 1), bl.jar.rotation.z).add(bl.jar.position)
      pour.set(lip, V(P5.glass.x, P5.glass.y + 0.02 + lv.glass * GLASS_H, P5.glass.z), pourOn)
    } else if (tipOn > 0.02) {
      const rim = V(-0.04, GLASS_H, 0).applyAxisAngle(V(0, 0, 1), gl.g.rotation.z).add(gl.g.position)
      pour.set(rim, V(P5.blender.x + 0.02, JAR_Y0 + 0.04 + lv.jar * P5.jarH, P5.blender.z), tipOn)
    } else pour.m.visible = false
  }
}

/* one camera for both T05 cards */
function frameCam5(camera: THREE.PerspectiveCamera) {
  camera.fov = 34
  camera.position.set(0, 1.58, 2.42)
  camera.lookAt(0, 1.07, -0.4)
  camera.updateProjectionMatrix()
}

/* ------------------------------------------------------------------ T05 concept: the hash machine */

/** a data block: a small rounded cube with a document face (lines, no words) */
function dataCube(tint: string) {
  const tex = canvasTex(64, 64, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = tint
    g.fillRect(0, 0, 64, 12)
    g.globalAlpha = 0.45
    for (let i = 0; i < 4; i++) g.fillRect(10, 20 + i * 10, i % 2 ? 34 : 44, 5)
    g.globalAlpha = 1
  })
  const m = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.1, 3, 0.018), [mat(tint, { roughness: 0.35 }), mat(tint, { roughness: 0.35 }), mat(tint, { roughness: 0.35 }), mat(tint, { roughness: 0.35 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), mat(tint, { roughness: 0.35 })])
  m.castShadow = true
  return m
}
/** the digest strip: a short bar of fixed length, eight cells in blue tones, glowing */
function digestStrip() {
  const tex = canvasTex(160, 24, (g) => {
    const tones = ['#2D63FB', '#4D7DFF', '#1F4FD8', '#7FA6FF', '#3B6FE0', '#5B8DEF', '#2C56C2', '#8FB0FF']
    tones.forEach((c, i) => {
      g.fillStyle = c
      g.beginPath()
      g.roundRect(3 + i * 19.5, 4, 16, 16, 3)
      g.fill()
    })
  })
  const g = new THREE.Group()
  g.add(box(0.3, 0.05, 0.03, mat('#FFFFFF', { roughness: 0.3, emissive: new THREE.Color('#DCE6FB'), emissiveIntensity: 0.3 }), [0, 0, 0], 0.01))
  g.add(flat(mesh(new THREE.PlaneGeometry(0.28, 0.042), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [0, 0, 0.0155])))
  flat(g)
  return g
}

function setupT05Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  /* the same view, closer in: no person stands behind this bench, so the bench fills the card */
  camera.fov = 34
  camera.position.set(0.02, 1.38, 1.95)
  camera.lookAt(0.02, 0.98, -0.4)
  camera.updateProjectionMatrix()
  lights(scene, [0, 1.1, -0.5], 4)
  scene.background = new THREE.Color('#E9EFFA')
  floorPlane(scene, slabTex('#E1E8F5', '#CDD8EC', [8, 5]))
  scene.add(flat(box(8, 4, 0.1, backdrop('#E4EBF8'), [0, 2, -1.4])))
  /* the workbench, where the island is */
  const k = P5.isle
  scene.add(box(k.x1 - k.x0, k.h - 0.04, k.z1 - k.z0, mat('#FFFFFF', { roughness: 0.45, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.12 }), [(k.x0 + k.x1) / 2, (k.h - 0.04) / 2, (k.z0 + k.z1) / 2], 0.02))
  scene.add(box(k.x1 - k.x0 + 0.06, 0.04, k.z1 - k.z0 + 0.08, mat('#F4F7FC', { roughness: 0.3, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.15 }), [(k.x0 + k.x1) / 2, k.h - 0.02, (k.z0 + k.z1) / 2 + 0.01], 0.012))
  scene.add(flat(box(k.x1 - k.x0, 0.025, 0.01, glowM(C.brand, '#DCE6FB'), [(k.x0 + k.x1) / 2, k.h - 0.1, k.z1 + 0.006])))

  /* the data source where the crate is: a white tray with a stack of data blocks (never runs out) */
  const cr = P5.crate
  scene.add(box(0.32, 0.08, 0.22, mat('#FFFFFF', { roughness: 0.4 }), [cr.x, cr.y + 0.04, cr.z], 0.02))
  const tints = [C.brand, C.teal, '#7C5CE0']
  ;[[-0.08, 0, 0], [0.04, 1, 0], [-0.02, 2, 1]].forEach(([dx, ti, up], i) => {
    const b = dataCube(tints[ti])
    b.position.set(cr.x + dx + (up ? 0.03 : 0), cr.y + 0.13 + up * 0.1, cr.z + (i === 1 ? -0.02 : 0.02))
    b.rotation.y = 0.2 - i * 0.15
    scene.add(b)
  })

  /* the hash machine where the blender is: body, a hopper on top, a round window with a rotor, a lever, an outlet */
  const bx = P5.blender.x - 0.02
  const by0 = k.h
  const mw = 0.44
  const mh = 0.4
  const md = 0.34
  const mz = P5.blender.z - 0.04
  const body = new THREE.Group()
  body.position.set(bx, by0, mz)
  body.add(box(mw, mh, md, mat('#FFFFFF', { roughness: 0.35 }), [0, mh / 2, 0], 0.05))
  body.add(flat(box(mw - 0.06, 0.03, 0.01, glowM(C.brand, '#DCE6FB'), [0, mh - 0.05, md / 2 + 0.003])))
  /* the hopper */
  const hopM = mat('#DCE6FB', { roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide })
  body.add(mesh(new THREE.CylinderGeometry(0.15, 0.06, 0.14, 32, 1, true), hopM, [0, mh + 0.07, 0]))
  body.add(flat(mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 40).rotateX(Math.PI / 2), mat('#9FB7EA', { metalness: 0.4, roughness: 0.3 }), [0, mh + 0.14, 0])))
  /* the window and its rotor */
  body.add(flat(mesh(new THREE.CircleGeometry(0.11, 40), mat('#1F2A4A', { roughness: 0.3 }), [0, 0.2, md / 2 + 0.003])))
  body.add(flat(mesh(new THREE.TorusGeometry(0.112, 0.01, 10, 40), mat('#C9D2E0', { metalness: 0.7, roughness: 0.25 }), [0, 0.2, md / 2 + 0.005])))
  const rotor = new THREE.Group()
  rotor.position.set(0, 0.2, md / 2 + 0.008)
  const rotorM = glowM(C.brand, '#7FA6FF')
  for (let i = 0; i < 6; i++) {
    const s = flat(box(0.085, 0.016, 0.004, rotorM, [0.045, 0, 0], 0.005))
    const w = new THREE.Group()
    w.rotation.z = (i * TAU) / 6
    w.add(s)
    rotor.add(w)
  }
  rotor.add(flat(mesh(new THREE.CircleGeometry(0.02, 20), mat('#FFFFFF'), [0, 0, 0.003])))
  body.add(rotor)
  /* the run lamp and the lever (where the blender's dial is) */
  const lamp = glowM(C.green, '#3A4256')
  body.add(flat(mesh(new THREE.CircleGeometry(0.012, 14), lamp, [-0.17, 0.08, md / 2 + 0.003])))
  const lever = new THREE.Group()
  lever.position.set(0.17, 0.08, md / 2 + 0.01)
  lever.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 20).rotateX(Math.PI / 2), mat('#2B3040', { roughness: 0.35 }), [0, 0, 0]))
  lever.add(box(0.014, 0.08, 0.014, mat('#C9D2E0', { metalness: 0.7, roughness: 0.25 }), [0, 0.04, 0.012], 0.005))
  lever.add(mesh(new THREE.SphereGeometry(0.018, 16, 12), mat(C.brand, { roughness: 0.3 }), [0, 0.085, 0.012]))
  body.add(lever)
  /* the outlet on the right side, at the height the strip leaves */
  body.add(flat(box(0.02, 0.07, 0.2, mat('#2B3040', { roughness: 0.5 }), [mw / 2 + 0.005, 0.11, 0.02], 0.008)))
  scene.add(body)
  const hopGlow = halo(C.orange, 0.42, 0.42, true)
  scene.add(hopGlow)
  const hopAt = V(bx, by0 + mh + 0.12, mz + 0.05)

  /* the tray where the glass is */
  const tray = V(P5.glass.x + 0.12, k.h, P5.glass.z)
  scene.add(box(0.36, 0.025, 0.16, mat('#FFFFFF', { roughness: 0.35 }), [tray.x, k.h + 0.0125, tray.z], 0.01))
  scene.add(flat(box(0.34, 0.006, 0.12, glowM(C.brand, '#DCE6FB'), [tray.x, k.h + 0.027, tray.z])))
  const strip = digestStrip()
  scene.add(strip)
  const stripGlow = halo('#7FA6FF', 0.46, 0.16, true)
  scene.add(stripGlow)

  /* the three blocks that go in */
  const cubes = tints.map((t) => {
    const b = dataCube(t)
    scene.add(b)
    return b
  })
  const outlet = V(bx + mw / 2 + 0.02, by0 + 0.11, mz + 0.06)
  const onTray = V(tray.x, k.h + 0.055, tray.z)
  const up = V(0, 1, 0)
  return (t: number) => {
    const c = mod(t, L5)
    const run1 = hold(c, T5.blend1[0], T5.blend1[0] + 0.1, T5.blend1[1] - 0.1, T5.blend1[1])
    const run2 = hold(c, T5.blend2[0], T5.blend2[0] + 0.1, T5.blend2[1] - 0.1, T5.blend2[1])
    rotor.rotation.z = -30 * seg(c, T5.blend1[0], T5.blend1[1]) + 24 * seg(c, T5.blend2[0], T5.blend2[1])
    rotorM.emissiveIntensity = 0.2 + 1.2 * Math.max(run1, run2)
    lamp.emissiveIntensity = 1.6 * Math.max(run1, run2)
    lever.rotation.z = -0.9 * hold(c, T5.press1[0], T5.press1[1], T5.blend1[1], T5.blend1[1] + 0.15) + 0.9 * hold(c, T5.press2[0], T5.press2[1], T5.blend2[1], T5.blend2[1] + 0.15)
    body.position.x = bx + 0.002 * Math.sin(c * 90) * Math.max(run1, run2)
    /* the reverse run: an orange flash at the hopper, where whole data would have to come back out, and nothing comes */
    glowAt(hopGlow, hopAt, camera, 0.8 * hold(c, T5.blend2[0] + 0.15, T5.blend2[0] + 0.35, T5.blend2[1] - 0.3, T5.blend2[1]) * (0.75 + 0.25 * Math.sin(TAU * 3 * c)), 0.05)

    /* the blocks: up from the source, over the hopper, down in; gone in the run */
    cubes.forEach((b, i) => {
      const kk = c - T5.drops[i]
      if (kk < 0 || c > T5.blend1[0] + 0.1) {
        b.visible = false
        return
      }
      b.visible = true
      const from = V(cr.x - 0.02, cr.y + 0.25, cr.z + 0.02)
      const over = hopAt.clone().add(V(0, 0.12, -0.04))
      if (kk < DROP.let) {
        arc(from, over, seg(kk, DROP.reach - 0.1, DROP.lift), 0.15, b.position)
        b.scale.setScalar(Math.max(0.001, seg(kk, 0, 0.2)))
      } else {
        const f = seg(kk, DROP.let, DROP.let + 0.3)
        b.position.copy(over).add(V(0, -0.24 * f * f, 0))
        b.scale.setScalar(Math.max(0.001, 1 - seg(kk, DROP.let + 0.1, DROP.let + 0.3)))
        b.visible = f < 0.99
      }
      b.rotation.set(0.2, kk * 2 + i, 0.1)
    })

    /* the strip: out onto the tray (pour), pushed back in (tip back), out again (pour 2), off to be used (drink) */
    const out1 = seg(c, T5.pour1.pour[0] - 0.1, T5.pour1.pour[1])
    const back = seg(c, T5.tip.lift[1], T5.tip.pour[1])
    const out2 = seg(c, T5.pour2.pour[0] - 0.1, T5.pour2.pour[1])
    const away = seg(c, T5.drink.up[0], T5.drink.down[1])
    const lifted = hold(c, T5.tip.grab[1], T5.tip.lift[1], T5.tip.pour[1] - 0.05, T5.tip.pour[1] + 0.05)
    const along = clamp01(out1 - back + out2)
    const inMachine = outlet.clone().add(V(-0.16, 0, 0))
    strip.position.copy(inMachine).lerp(onTray, along)
    strip.position.y += 0.03 * lifted
    strip.position.add(V(0.0, 0.3 * Math.sin((Math.PI * away) / 2), 0)).add(V(1.4 * away * away, 0, 0))
    strip.visible = c > T5.pour1.pour[0] - 0.05 && away < 0.98 && !(along < 0.05)
    strip.quaternion.copy(camera.quaternion)
    strip.rotateOnWorldAxis(up, 0)
    glowAt(stripGlow, strip.position, camera, strip.visible ? 0.55 * (0.8 + 0.2 * Math.sin(TAU * 1.5 * c)) : 0, -0.02)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
/* all four cards the same canvas size, so the shared renderer never resizes between them */
const card = (setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T04Everyday: card(setupT04Everyday, devHold(HOLD4)),
  H_T04Concept: card(setupT04Concept, devHold(HOLD4)),
  H_T05Everyday: card(setupT05Everyday, devHold(HOLD5)),
  H_T05Concept: card(setupT05Concept, devHold(HOLD5)),
}
export const css = ''
