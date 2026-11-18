import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import roleUrl from '../images/res-iam-role.svg'
import stsUrl from '../images/res-iam-aws-sts.svg'
import ec2Url from '../images/aws-ec2.svg'
import s3Url from '../images/aws-s3.svg'
import lambdaUrl from '../images/aws-lambda.svg'

/**
 * BUILDER H · SESSION 14 (IAM Roles & Least Privilege) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`
 * (generate-slides standing corrections 13-17, deck-engine "3D scenes and people" and "Low-end PCs"), built the way
 * Session 16's h/i files are: a perspective camera on a real place, Character Lab people through the engine's
 * `castSprite` (role clothing by `dress`, `adaptive` frames, expressions keyed to the action), NO TEXT on either card,
 * ONE wall-clock loop per slide shared by both cards beat for beat and place for place, every loop ending in the state
 * it starts in, held frames at HOLD. Nobody walks toward or away from the camera (a rig has no back view): people step
 * sideways, props move. Props in a hand follow the frame the sprite is showing, not the clock.
 *
 * SLIDE 8 · T02-AN (TR 2): "Borrowing a library book using a library card. You can use the book for a limited period
 * and must return it afterward, just as a role provides temporary permissions that expire after the session."
 *
 *   place (x)      everyday: a library counter                   concept: a role desk
 *   -2.3 .. 0.15   bookshelves on the back wall                  a rack of role badges on the back wall
 *   -0.65          the librarian (cardigan) behind the counter    the STS kiosk behind the desk (official STS mark)
 *   -0.28          her scanner in its cradle                      the kiosk's scanner eye
 *   -0.48 / -0.12  the book on the counter, slid to the member    the role badge, on its stand (IAM Role mark)
 *    0.06          the return slot in the counter top            (the badge's stand)
 *    0.38          the member, library card in hand              the caller (a boy with his laptop), ID card in hand
 *    1.42, high    the wall clock, an orange arc = the loan       the ring of light, an orange arc = the session
 *
 *   0.0 - 1.7   the card is held out and scanned; the scanner turns green / the kiosk's eye turns green
 *   1.6 - 2.8   the book slides across and is picked up / the badge lifts off its stand and is taken
 *   2.6 - 6.1   the loan / the session: the arc appears and the clock hand / light runs it down to nothing
 *   2.85 - 5.45 off under the clock and back again
 *   5.45 - 6.1  the book goes into the return slot / the badge goes back on its stand, the moment the arc runs out
 *   6.4 - 7.5   the book is back on the counter / the badge lights again, ready; the card comes out for the next loop
 *
 * SLIDE 18 · T08-AN (TR 8): "A building-wide access card that opens every room when only one room's access was needed:
 * just as a wildcard can grant access far beyond what a task requires."
 *
 *   place (x)      everyday: an office corridor                   concept: a cloud account
 *   -1.85          the employee, a building-wide card            the caller with her laptop, a badge with an asterisk
 *   -1.45          the card reader on the wall                    the same reader
 *   -0.95 .. 1.75  four doors: records, servers, HIS OFFICE,      four service cases: server, database, THE BUCKET,
 *                  the safe room                                  function (official marks on white tiles)
 *
 *   0.0 - 1.05  one tap; 0.6 - 2.05 EVERY door swings open in a wave / every case opens, orange light spills out
 *   1.15 - 2.55 he walks to the one room he needed; 2.55 - 3.95 he uses it (blue light) / the bucket's objects lift
 *   3.9 - 4.9   a worried look back along the corridor at all the open rooms
 *   4.95 - 6.55 back to the reader; the doors close in a wave behind him / the cases close
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
  red: '#E5484D',
  s3: '#7AA116',
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
/** floor boards: long planks with thin joints and staggered ends */
const plankTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 1.4
      for (let i = 0; i < 4; i++) {
        const y = i * 32
        g.beginPath()
        g.moveTo(0, y + 0.7)
        g.lineTo(128, y + 0.7)
        const x = (i * 47) % 128
        g.moveTo(x, y)
        g.lineTo(x, y + 32)
        g.stroke()
      }
    },
    repeat,
  )
/** large soft floor tiles */
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
/** an svg mark drawn into a canvas once it loads (rule 54 marks, on their white tile) */
function withImage(url: string, onload: (img: HTMLImageElement) => void) {
  const img = new Image()
  img.onload = () => onload(img)
  img.src = url
}
function markTex(url: string, redraw: () => void, px = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const g = c.getContext('2d')!
  const tile = () => {
    g.clearRect(0, 0, px, px)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, px, px, px * 0.16)
    g.fill()
  }
  tile()
  withImage(url, (img) => {
    tile()
    const pad = px * 0.14
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  })
  return t
}
/** a database glyph on the same white tile (no product mark exists for a generic database) */
function dbTileTex(): THREE.CanvasTexture {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, 128, 128, 20)
    g.fill()
    g.fillStyle = '#3B6FE0'
    for (let i = 2; i >= 0; i--) {
      const y = 38 + i * 22
      g.beginPath()
      g.ellipse(64, y + 16, 30, 9, 0, 0, TAU)
      g.fill()
      g.fillRect(34, y, 60, 16)
      g.fillStyle = i === 0 ? '#8FB0FF' : '#3B6FE0'
      g.beginPath()
      g.ellipse(64, y, 30, 9, 0, 0, TAU)
      g.fill()
      g.fillStyle = '#2C56C2'
    }
  })
}

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
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
/** a soft additive halo */
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

function lights(scene: THREE.Scene, target: THREE.Vector3Tuple) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
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
}

/** a row of things on a shelf / rail as ONE instanced mesh (one draw call: low-end PCs) */
function instanced(scene: THREE.Scene, geo: THREE.BufferGeometry, m: THREE.Material, items: { p: THREE.Vector3Tuple; s: THREE.Vector3Tuple; c: string; r?: number }[]) {
  const im = new THREE.InstancedMesh(geo, m, items.length)
  const o = new THREE.Object3D()
  const col = new THREE.Color()
  items.forEach((it, i) => {
    o.position.set(...it.p)
    o.scale.set(...it.s)
    o.rotation.set(0, 0, it.r ?? 0)
    o.updateMatrix()
    im.setMatrixAt(i, o.matrix)
    im.setColorAt(i, col.set(it.c))
  })
  im.castShadow = false
  im.receiveShadow = true
  scene.add(im)
  return im
}
/** a deterministic pseudo-random sequence (the same scene every build) */
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
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

/** the librarian's cardigan: open knit fronts over a white blouse, buttons, a ribbed hem (body frame 400 x 600) */
const CARDIGAN = (edge: string) => (
  <g data-part="cardigan">
    <path d="M 186 208 C 192 240 194 300 192 392 L 208 392 C 206 300 208 240 214 208 Z" fill="#F7F4EE" />
    <path d="M 192 214 L 200 236 L 208 214" fill="none" stroke="#E2DCD0" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 186 208 C 192 240 194 300 192 392" fill="none" stroke={edge} strokeWidth={7} strokeLinecap="round" />
    <path d="M 214 208 C 208 240 206 300 208 392" fill="none" stroke={edge} strokeWidth={7} strokeLinecap="round" />
    {[266, 300, 334, 366].map((y) => (
      <circle key={y} cx={190} cy={y} r={3.4} fill="#EADBB8" />
    ))}
    <rect x={148} y={380} width={104} height={16} rx={6} fill={edge} opacity={0.85} />
  </g>
)
/** a tie clip on the employee's tie */
const TIE_CLIP = (
  <g data-part="clip">
    <rect x={191} y={300} width={18} height={4} rx={2} fill="#C9CED8" />
  </g>
)
/** a hoodie's pocket and drawstrings over the base top */
const HOODIE_EXTRA = (shade: string) => (
  <g data-part="hoodie">
    <path d="M 160 340 L 240 340 L 232 384 L 168 384 Z" fill={shade} opacity={0.55} />
    <path d="M 192 214 L 190 268 M 208 214 L 210 268" stroke="#F2F2F5" strokeWidth={3} strokeLinecap="round" />
  </g>
)

/* ---- arms: forward and inverse kinematics in the rig's 400 x 600 frame (Arm.tsx: pivot 6 px inside the shoulder tip
   at y 205, upper arm 95, forearm 85 + 14 to the grip; angles from hanging straight down, positive lifts away from the
   body, forearm at shoulder minus elbow; the screen-right arm mirrors) ---- */

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
/** shoulder and elbow angles that put the hand at p, elbow DOWN (a reach seen from the front: the upper arm hangs
    out, the forearm goes to the thing; the elbow-up solution put elbows over heads) */
function solveArm(side: Side, sh: number, p: Pt): Arm {
  const q = side === 'L' ? p : { x: 400 - p.x, y: p.y }
  const px = 200 - (sh - 6)
  const dx = q.x - px
  const dy = q.y - 205
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(clamp01((UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D)))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad - beta) / DEG, e: gamma / DEG - 180 }
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

/* ------------------------------------------------------------------ shared props */

/** a card face (library card, ID card, master card, asterisk badge): a textured, double-sided plane */
function cardMesh(tex: THREE.Texture, w: number, h: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, side: THREE.DoubleSide, transparent: true, emissive: new THREE.Color('#FFFFFF'), emissiveMap: tex, emissiveIntensity: 0.25 }))
  m.renderOrder = 3
  return m
}
const cardShape = (g: CanvasRenderingContext2D, w: number, h: number, fill: string | CanvasGradient) => {
  g.fillStyle = fill
  g.beginPath()
  g.roundRect(2, 2, w - 4, h - 4, 12)
  g.fill()
}
/** the member's library card: green, a book glyph, a barcode (no words) */
const libraryCardTex = () =>
  canvasTex(160, 100, (g) => {
    cardShape(g, 160, 100, '#1E9E6A')
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(14, 16, 40, 30, 4)
    g.fill()
    g.fillStyle = '#1E9E6A'
    g.fillRect(33, 18, 2, 26)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(14, 60, 132, 26, 4)
    g.fill()
    g.fillStyle = '#1C2333'
    let x = 20
    const r = rng(7)
    while (x < 140) {
      const bw = 1 + Math.floor(r() * 3)
      g.fillRect(x, 64, bw, 18)
      x += bw + 1 + Math.floor(r() * 3)
    }
    g.fillStyle = 'rgba(255,255,255,0.75)'
    g.fillRect(66, 20, 70, 6)
    g.fillRect(66, 32, 50, 6)
  })
/** the caller's own ID card: white and blue, a photo silhouette, two lines */
const idCardTex = (tone: string) =>
  canvasTex(160, 100, (g) => {
    cardShape(g, 160, 100, '#FFFFFF')
    g.fillStyle = tone
    g.beginPath()
    g.roundRect(2, 2, 156, 22, [12, 12, 0, 0])
    g.fill()
    g.fillStyle = '#DCE6FB'
    g.beginPath()
    g.roundRect(14, 32, 44, 54, 6)
    g.fill()
    g.fillStyle = tone
    g.beginPath()
    g.arc(36, 52, 10, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(36, 80, 16, 10, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = '#C3CCDD'
    g.fillRect(68, 40, 76, 7)
    g.fillRect(68, 56, 56, 7)
    g.fillRect(68, 72, 66, 7)
  })
/** the building-wide card: gold, a chip, a contactless mark */
const masterCardTex = () =>
  canvasTex(160, 100, (g) => {
    const gr = g.createLinearGradient(0, 0, 160, 100)
    gr.addColorStop(0, '#F7D774')
    gr.addColorStop(1, '#D9A53A')
    cardShape(g, 160, 100, gr)
    g.fillStyle = '#E9E2C8'
    g.beginPath()
    g.roundRect(18, 30, 30, 24, 4)
    g.fill()
    g.strokeStyle = '#B48A2C'
    g.lineWidth = 1.5
    g.strokeRect(24, 36, 18, 12)
    g.strokeStyle = 'rgba(255,255,255,0.85)'
    g.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      g.beginPath()
      g.arc(118, 44, 8 + i * 8, -0.7, 0.7)
      g.stroke()
    }
  })
/** the badge with the wildcard: brand blue, a big asterisk drawn as six strokes (a symbol, no words) */
const asteriskBadgeTex = () =>
  canvasTex(110, 150, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 150)
    gr.addColorStop(0, '#4D7DFF')
    gr.addColorStop(1, C.brandDark)
    cardShape(g, 110, 150, gr)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.beginPath()
    g.roundRect(41, 10, 28, 8, 4)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineCap = 'round'
    g.lineWidth = 12
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 2
      g.beginPath()
      g.moveTo(55 - Math.cos(a) * 30, 84 - Math.sin(a) * 30)
      g.lineTo(55 + Math.cos(a) * 30, 84 + Math.sin(a) * 30)
      g.stroke()
    }
  })
/** the role badge: blue, the IAM Role mark on its white tile, a clip slot */
function roleBadgeTex(redraw: () => void): THREE.CanvasTexture {
  const t = canvasTex(110, 150, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 150)
    gr.addColorStop(0, '#4D7DFF')
    gr.addColorStop(1, C.brandDark)
    cardShape(g, 110, 150, gr)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.beginPath()
    g.roundRect(41, 10, 28, 8, 4)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(17, 40, 76, 76, 12)
    g.fill()
  })
  withImage(roleUrl, (img) => {
    const g = (t.image as HTMLCanvasElement).getContext('2d')!
    g.setTransform(TEX_SS, 0, 0, TEX_SS, 0, 0)
    g.drawImage(img, 27, 50, 56, 56)
    t.needsUpdate = true
    redraw()
  })
  return t
}
/** a closed laptop, held by its top edge (the caller's laptop) */
function laptopProp() {
  const g = new THREE.Group()
  const shell = mat('#C9D0DC', { roughness: 0.35, metalness: 0.55 })
  g.add(box(0.32, 0.22, 0.012, shell, [0, -0.11, 0.008], 0.006))
  g.add(box(0.32, 0.22, 0.012, mat('#AEB7C6', { roughness: 0.4, metalness: 0.5 }), [0, -0.11, -0.008], 0.006))
  g.add(flat(mesh(new THREE.CircleGeometry(0.02, 24), new THREE.MeshBasicMaterial({ color: '#EEF3FF', toneMapped: false }), [0, -0.11, 0.0145])))
  flat(g)
  return g
}
/** a light beam between two points (a scanner's), additive */
function beam(color: string) {
  const geo = new THREE.CylinderGeometry(0.005, 0.04, 1, 18, 1, true)
  geo.translate(0, 0.5, 0)
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }))
  m.renderOrder = 5
  const up = V(0, 1, 0)
  const dir = new THREE.Vector3()
  return {
    m,
    set(a: THREE.Vector3, b: THREE.Vector3, o: number) {
      dir.copy(b).sub(a)
      const len = dir.length()
      m.position.copy(a)
      m.quaternion.setFromUnitVectors(up, dir.normalize())
      m.scale.set(1, Math.max(0.001, len), 1)
      opa(m, o)
    },
  }
}
/** an arc band that can show any part of its circle (RingGeometry + drawRange): clockwise angles from 12 o'clock */
const ARC_N = 120
function arcBand(r0: number, r1: number, color: string) {
  const geo = new THREE.RingGeometry(r0, r1, ARC_N, 1, Math.PI / 2, TAU)
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, depthWrite: false }))
  m.renderOrder = 3
  return {
    m,
    /** show the arc from clockwise angle a to b (a < b), radians */
    set(a: number, b: number) {
      const s = Math.max(0, Math.floor(((TAU - b) / TAU) * ARC_N))
      const e = Math.min(ARC_N, Math.ceil(((TAU - a) / TAU) * ARC_N))
      geo.setDrawRange(s * 6, Math.max(0, e - s) * 6)
      m.visible = b - a > 0.01
    },
  }
}

/* ================================================================== T02 · the library card */

const L2 = 8
const F2 = 96
const HOLD2 = 3.12 /* the book under the member's arm on the way out under the clock, the loan arc running down */
const P2 = {
  wallZ: -1.25,
  libX: -0.72,
  libZ: -0.74,
  hLib: 1.62,
  memX: 0.55,
  memZ: 0.08,
  hMem: 1.66,
  off: 2.95,
  ctr: { x0: -1.8, x1: 0.18, z0: -0.56, z1: -0.02, h: 0.98 },
  pile: V(-0.36, 1.005, -0.24),
  pick: V(-0.03, 1.005, -0.18),
  slot: V(0.08, 0.98, -0.4),
  cradle: V(-0.44, 0.98, -0.44),
  scanAt: V(-0.2, 1.2, -0.46),
  aim: V(0.02, 1.1, -0.1),
  under: V(-0.42, 0.72, -0.5),
  clock: V(1.48, 2.2, -1.21),
  clockR: 0.3,
}
const T2 = {
  cardUp: [0.0, 0.4, 1.25, 1.65] as const,
  cradle: [0.1, 0.3, 0.3, 0.5] as const,
  scan: [0.3, 0.6, 1.3, 1.5] as const,
  cradleBack: [1.3, 1.5, 1.55, 1.75] as const,
  beam: [0.62, 0.72, 1.25, 1.35] as const,
  beep: 1.0,
  pocket: [1.5, 1.65] as const,
  slide: [1.6, 1.85, 2.3, 2.65] as const,
  pickReach: [2.2, 2.5] as const,
  carry: [2.5, 2.8, 5.45, 5.8] as const,
  loan: [2.6, 2.85, 6.1] as const,
  walks: [
    [2.85, 3.95, P2.off],
    [4.45, 5.45, P2.memX],
  ] as [number, number, number][],
  ret: [5.45, 5.8, 6.1, 6.45] as const,
  restock: [6.4, 6.75, 7.2, 7.5] as const,
  cardBack: [6.9, 7.4] as const,
}
const memAt2 = (c: number) => along(c, [[0, 0, P2.memX], ...T2.walks])
const handAngle2 = (c: number) => (TAU * c) / L2
/** the loan / session arc, clockwise from the hand to the due point (null when there is none) */
function loanArc2(c: number): [number, number] | null {
  if (c < T2.loan[0] || c >= T2.loan[2]) return null
  const a = handAngle2(c)
  const due = handAngle2(T2.loan[2])
  return [a, lerp(a, due, seg(c, T2.loan[0], T2.loan[1]))]
}

type Rig2 = { cam: THREE.Camera; shM: number; shL: number }
const memRoot2 = (c: number) => {
  const at = memAt2(c)
  return V(at.x, bob(at.walking, c), P2.memZ)
}
const LIB_ROOT = V(P2.libX, 0, P2.libZ)
/** the member's / caller's screen-left arm (toward the counter): card out, book in, carried, into the slot */
function memArmL2(c: number, r: Rig2): Arm {
  const root = memRoot2(c)
  const w = memAt2(c).walking
  const aimArm = (p: THREE.Vector3) => solveArm('L', r.shM, worldToRig(p, P2.hMem, root, r.cam))
  let a: Arm = { s: 8 + swing(c, w), e: 8 }
  a = mixA(a, aimArm(P2.aim), hold(c, ...T2.cardUp))
  a = mixA(a, aimArm(P2.pick.clone().add(V(0, 0.03, 0))), hold(c, T2.pickReach[0], T2.pickReach[1], T2.carry[0], T2.carry[1]))
  a = mixA(a, { s: 24, e: 86 }, hold(c, ...T2.carry))
  a = mixA(a, aimArm(P2.slot.clone().add(V(0, 0.14, 0.02))), hold(c, ...T2.ret))
  return a
}
const memArmR2 = (c: number): Arm => ({ s: 8 - swing(c, memAt2(c).walking), e: 8 })
/** the librarian's screen-right arm: scanner out of its cradle and back, the book slid across, restocked */
function libArmR2(c: number, r: Rig2): Arm {
  const aimArm = (p: THREE.Vector3) => solveArm('R', r.shL, worldToRig(p, P2.hLib, LIB_ROOT, r.cam))
  let a: Arm = { s: 10, e: 16 }
  const cradleUp = P2.cradle.clone().add(V(0, 0.08, 0))
  a = mixA(a, aimArm(cradleUp), Math.max(hold(c, ...T2.cradle), hold(c, ...T2.cradleBack)))
  a = mixA(a, aimArm(P2.scanAt), hold(c, ...T2.scan))
  const slideTo = P2.pile.clone().lerp(P2.pick, seg(c, T2.slide[1], T2.slide[2])).add(V(0, 0.05, 0))
  a = mixA(a, aimArm(slideTo), hold(c, ...T2.slide))
  const stockTo = P2.under.clone().lerp(P2.pile.clone().add(V(0, 0.06, 0)), seg(c, T2.restock[1] + 0.05, T2.restock[2]))
  a = mixA(a, aimArm(stockTo), hold(c, ...T2.restock))
  return a
}

/** the shared room of T02: floor, back wall, the counter / desk, the clock / ring plate */
function room2(scene: THREE.Scene, o: { floor: THREE.Texture; wall: string; ctr: THREE.Material; top: THREE.Material; kick: string }) {
  const fl = flat(mesh(new THREE.PlaneGeometry(10, 6), mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0, 1.4]))
  fl.rotation.x = -Math.PI / 2
  fl.receiveShadow = true
  scene.add(fl)
  scene.add(flat(box(10, 3.4, 0.12, mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.3 }), [0, 1.7, P2.wallZ - 0.06])))
  scene.add(flat(box(10, 0.1, 0.03, mat(o.kick, { roughness: 0.7 }), [0, 0.05, P2.wallZ + 0.015])))
  const k = P2.ctr
  const cx = (k.x0 + k.x1) / 2
  const cz = (k.z0 + k.z1) / 2
  scene.add(box(k.x1 - k.x0, k.h - 0.05, k.z1 - k.z0, o.ctr, [cx, (k.h - 0.05) / 2, cz], 0.02))
  scene.add(box(k.x1 - k.x0 + 0.06, 0.05, k.z1 - k.z0 + 0.08, o.top, [cx, k.h - 0.025, cz + 0.01], 0.015))
}

function setupT02Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F2ECE2')
  frameCam2(camera)
  lights(scene, [0, 1.3, -0.6])
  const wood = mat('#9A6A45', { roughness: 0.6 })
  room2(scene, { floor: plankTex('#D7B98F', '#BE9B6E', [10, 6]), wall: '#F4E9D8', ctr: wood, top: mat('#C79A6B', { roughness: 0.45 }), kick: '#8A5A3B' })
  /* counter front panels */
  const k = P2.ctr
  for (let x = k.x0 + 0.33; x < k.x1 - 0.1; x += 0.5) scene.add(flat(box(0.4, 0.66, 0.01, mat('#8A5C3B', { roughness: 0.6 }), [x, 0.48, k.z1 + 0.005], 0.01)))

  /* the bookshelves on the back wall, full of books (one instanced mesh) */
  const shelfM = mat('#8A5A3B', { roughness: 0.65 })
  const sx0 = -2.45
  const sx1 = 0.2
  const sz = P2.wallZ + 0.17
  const rows = [0.12, 0.55, 0.98, 1.41, 1.84]
  scene.add(flat(box(sx1 - sx0, 2.32, 0.03, mat('#6E4A31', { roughness: 0.8 }), [(sx0 + sx1) / 2, 1.16, P2.wallZ + 0.02])))
  for (const y of [...rows, 2.27]) scene.add(flat(box(sx1 - sx0, 0.04, 0.32, shelfM, [(sx0 + sx1) / 2, y, sz])))
  for (const x of [sx0, (sx0 + sx1) / 2, sx1]) scene.add(flat(box(0.05, 2.32, 0.32, shelfM, [x, 1.16, sz])))
  const spines = ['#C0392B', '#2D63FB', '#1E9E6A', '#E8A33D', '#7C5CE0', '#14A3A8', '#E5732A', '#2C3E66', '#B8546F', '#3A8E6B']
  const r = rng(11)
  const books: { p: THREE.Vector3Tuple; s: THREE.Vector3Tuple; c: string; r?: number }[] = []
  rows.forEach((y) => {
    let x = sx0 + 0.06
    while (x < sx1 - 0.08) {
      if (Math.abs(x - (sx0 + sx1) / 2) < 0.05) {
        x += 0.06
        continue
      }
      const w = 0.035 + r() * 0.03
      const hh = 0.25 + r() * 0.1
      const lean = r() < 0.06 ? 0.18 : 0
      books.push({ p: [x + w / 2, y + 0.02 + hh / 2, sz + 0.01], s: [w, hh, 0.22], c: spines[Math.floor(r() * spines.length)], r: lean })
      x += w + 0.006 + (lean ? 0.03 : 0)
    }
  })
  instanced(scene, new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', { roughness: 0.6 }), books)

  /* the wall clock: wooden rim, a face with ticks (no digits), hour hand at ten, a running minute hand, the loan arc */
  const ck = P2.clock
  const face = canvasTex(128, 128, (g) => {
    g.fillStyle = '#FFFDF7'
    g.beginPath()
    g.arc(64, 64, 63, 0, TAU)
    g.fill()
    g.strokeStyle = '#2B2F3A'
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU
      const big = i % 5 === 0
      g.lineWidth = big ? 3 : 1
      g.beginPath()
      g.moveTo(64 + Math.sin(a) * (big ? 46 : 50), 64 - Math.cos(a) * (big ? 46 : 50))
      g.lineTo(64 + Math.sin(a) * 56, 64 - Math.cos(a) * 56)
      g.stroke()
    }
  })
  const clock = new THREE.Group()
  clock.position.copy(ck)
  clock.add(mesh(new THREE.CylinderGeometry(P2.clockR + 0.04, P2.clockR + 0.04, 0.05, 48).rotateX(Math.PI / 2), mat('#7A4E30', { roughness: 0.5 }), [0, 0, 0]))
  clock.add(flat(mesh(new THREE.CircleGeometry(P2.clockR, 48), mat('#ffffff', { map: face, roughness: 0.6, emissive: new THREE.Color('#FFFDF7'), emissiveIntensity: 0.25 }), [0, 0, 0.026])))
  const loanArc = arcBand(P2.clockR * 0.62, P2.clockR * 0.86, C.orange)
  loanArc.m.position.z = 0.028
  clock.add(loanArc.m)
  const handM = mat('#1F2433', { roughness: 0.4 })
  const hourHand = new THREE.Group()
  hourHand.add(box(0.03, 0.15, 0.008, handM, [0, 0.06, 0], 0.004))
  hourHand.rotation.z = (2 / 12) * TAU
  hourHand.position.z = 0.032
  const minHand = new THREE.Group()
  minHand.add(box(0.018, 0.25, 0.008, handM, [0, 0.1, 0], 0.004))
  minHand.position.z = 0.04
  clock.add(hourHand, minHand, mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16).rotateX(Math.PI / 2), mat(C.brass, { metalness: 0.6, roughness: 0.3 }), [0, 0, 0.045]))
  flat(clock)
  scene.add(clock)

  /* the return slot in the counter top: a brass plate with a dark mouth */
  scene.add(flat(box(0.28, 0.012, 0.13, mat(C.brass, { metalness: 0.65, roughness: 0.3 }), [P2.slot.x, P2.ctr.h + 0.006, P2.slot.z], 0.004)))
  scene.add(flat(box(0.24, 0.014, 0.04, mat('#15181F', { roughness: 0.9 }), [P2.slot.x, P2.ctr.h + 0.008, P2.slot.z])))

  /* the scanner's cradle and the hand scanner */
  scene.add(box(0.12, 0.035, 0.1, mat('#2B2F3A', { roughness: 0.5 }), [P2.cradle.x, P2.ctr.h + 0.018, P2.cradle.z], 0.01))
  const scanner = new THREE.Group()
  const darkM = mat('#30343F', { roughness: 0.4 })
  scanner.add(box(0.06, 0.05, 0.13, darkM, [0, 0, 0], 0.012))
  scanner.add(box(0.035, 0.09, 0.04, darkM, [0, -0.06, -0.035], 0.01))
  const scanLed = glowM(C.red, '#3A1414')
  scanner.add(box(0.045, 0.03, 0.006, scanLed, [0, 0.002, 0.066]))
  scene.add(flat(scanner))
  const scanBeam = beam('#FF5A5A')
  scene.add(scanBeam.m)
  const okBeam = beam('#4ADE80')
  scene.add(okBeam.m)

  /* the book and the library card */
  const book = new THREE.Group()
  const cover = mat('#2D63FB', { roughness: 0.5 })
  book.add(box(0.22, 0.045, 0.16, [mat('#F3EBDD'), cover, cover, cover, mat('#F3EBDD'), mat('#F3EBDD')], [0, 0, 0], 0.006))
  book.add(box(0.012, 0.047, 0.162, mat('#1E46B8'), [-0.105, 0, 0]))
  /* props in a hand cast no shadow of their own (a carried book's shadow fell on the floor apart from her) */
  scene.add(flat(book))
  const card = cardMesh(libraryCardTex(), 0.12, 0.075)
  scene.add(card)
  const cardGlow = halo('#4ADE80', 0.3)
  scene.add(cardGlow)

  /* people: the librarian (older, glasses, a cardigan) and the member */
  const libCfg = who(CAST_PRESETS.riya, { name: 'Librarian', hair: { style: 'bun', color: 'grey' }, outfit: { top: 'blouse', topColor: '#2F7A78', bottom: 'skirt', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { glasses: 'round', earrings: true } })
  const memCfg = who(CAST_PRESETS.meera, { name: 'Member', outfit: { top: 'tshirt', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#25366E', shoeColor: '#F2F2F5' }, accessories: { earrings: false, watch: true } })
  const shL = buildSkin(libCfg).shoulderHalf
  const shM = buildSkin(memCfg).shoulderHalf
  const rr: Rig2 = { cam: camera, shM, shL }
  const lib = person({
    config: libCfg,
    dress: withTop(CARDIGAN('#245E5C')),
    seed: 1401,
    faces: [[0, 'listening'], [1.0, 'happy'], [3.0, 'neutral'], [4.0, 'thinking'], [5.4, 'happy'], [7.3, 'listening']],
    pose: (p, c) => {
      const a = libArmR2(c, rr)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.shoulderL = 12
      p.elbowL = 22
      to(p, 'headTurn', 0.32, 1)
      to(p, 'lookX', 0.75, 1)
      /* eyes down to the card under the scanner, to the book as she slides it, to the bin under the counter */
      const down = Math.max(hold(c, 0.5, 0.7, 1.2, 1.4), hold(c, 1.7, 1.9, 2.2, 2.4), hold(c, 6.45, 6.65, 7.0, 7.25))
      to(p, 'lookY', 0.6, down)
      to(p, 'headNod', 0.2, down)
      /* a glance up at the clock while the book is out */
      const ck = hold(c, 4.0, 4.25, 4.75, 5.0)
      to(p, 'headTurn', 0.55, ck)
      to(p, 'lookX', 1, ck)
      to(p, 'lookY', -0.7, ck)
    },
    loop: L2,
    height: P2.hLib,
    frames: F2,
    redraw,
    holdT: HOLD2,
  })
  const mem = person({
    config: memCfg,
    seed: 1402,
    faces: MEM_FACES2,
    pose: (p, c) => memPose2(p, c, rr),
    loop: L2,
    height: P2.hMem,
    frames: F2,
    redraw,
    holdT: HOLD2,
  })
  lib.object.position.copy(LIB_ROOT)
  scene.add(lib.object, mem.object)

  const hand = new THREE.Vector3()
  const lhand = new THREE.Vector3()
  const qCam = new THREE.Quaternion()
  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, 0))
  const qUp = new THREE.Quaternion()
  const rotUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L2)
    const cq = frameT(c, L2, F2)
    const mRoot = memRoot2(c)
    mem.object.position.copy(mRoot)
    mem.object.visible = mRoot.x < P2.off - 0.05
    lib.update(c, camera)
    mem.update(c, camera)
    qCam.copy(camera.quaternion)
    qUp.copy(qCam).multiply(rotUp)

    /* clock */
    minHand.rotation.z = -handAngle2(c)
    const arc = loanArc2(c)
    if (arc) loanArc.set(arc[0], arc[1])
    else loanArc.m.visible = false

    /* the member's hand (frame the sprite shows) and the librarian's */
    rigToWorld(handPt('L', shM, memArmL2(cq, rr)), P2.hMem, memRoot2(cq), camera, hand)
    towardCamera(hand, camera, 0.08)
    rigToWorld(handPt('R', shL, libArmR2(cq, rr)), P2.hLib, LIB_ROOT, camera, lhand)
    towardCamera(lhand, camera, 0.08)

    /* the card: in her hand, held out, scanned, pocketed, out again for the next visit */
    const shown = c < T2.pocket[1] ? 1 - seg(c, T2.pocket[0], T2.pocket[1]) : seg(c, T2.cardBack[0], T2.cardBack[1])
    card.visible = shown > 0.02
    card.position.copy(hand).add(V(-0.02, 0.03, 0.01))
    card.quaternion.copy(qCam)
    card.rotateZ(0.25 * (1 - hold(c, ...T2.cardUp)))
    card.scale.setScalar(Math.max(0.001, shown))
    const ok = hold(c, T2.beep, T2.beep + 0.06, 1.3, 1.5)
    cardGlow.position.copy(card.position).addScaledVector(camera.position.clone().sub(card.position).normalize(), -0.01)
    cardGlow.quaternion.copy(qCam)
    opa(cardGlow, 0.85 * ok)

    /* the scanner: cradle -> hand -> cradle, aimed at the card while scanning */
    const inHand = c >= T2.scan[0] && c < T2.cradleBack[2]
    const kIn = seg(c, T2.scan[0], T2.scan[0] + 0.2) * (1 - seg(c, T2.cradleBack[1], T2.cradleBack[2]))
    const rest = P2.cradle.clone().add(V(0, 0.07, 0))
    scanner.position.copy(rest).lerp(lhand, inHand ? kIn : 0)
    if (kIn > 0.05) scanner.lookAt(card.position)
    else scanner.rotation.set(0, -0.6, 0)
    scanLed.emissive.set(ok > 0.1 ? '#4ADE80' : C.red)
    scanLed.emissiveIntensity = 0.4 + 1.6 * Math.max(ok, hold(c, ...T2.beam))
    tmp.set(0, 0.002, 0.07).applyQuaternion(scanner.quaternion).add(scanner.position)
    const on = hold(c, ...T2.beam)
    scanBeam.set(tmp, card.position, 0.85 * on * (1 - ok))
    okBeam.set(tmp, card.position, 0.85 * on * ok)

    /* the book: pile -> slid across -> picked up -> carried -> into the slot -> back on the pile from the bin */
    let bp: THREE.Vector3
    let up = 0
    if (c < T2.slide[1]) bp = P2.pile.clone()
    else if (c < T2.carry[0]) bp = P2.pile.clone().lerp(P2.pick, seg(c, T2.slide[1], T2.slide[2]))
    else if (c < T2.ret[2]) {
      const k = seg(c, T2.carry[0], T2.carry[1])
      bp = P2.pick.clone().lerp(hand.clone().add(V(0, -0.02, 0.03)), k)
      up = k
      if (c >= T2.ret[1]) {
        /* down into the slot, spine first */
        const top = P2.slot.clone().add(V(0, 0.13, 0))
        bp = hand.clone().lerp(top, seg(c, T2.ret[1], T2.ret[1] + 0.12)).lerp(P2.slot.clone().add(V(0, -0.14, 0)), seg(c, T2.ret[1] + 0.1, T2.ret[2]))
      }
    } else if (c < T2.restock[1]) bp = P2.under.clone()
    else if (c < T2.restock[2]) bp = lhand.clone()
    else bp = lhand.clone().lerp(P2.pile, seg(c, T2.restock[2], T2.restock[2] + 0.15))
    book.visible = !(c >= T2.ret[2] && c < T2.restock[1])
    book.position.copy(bp)
    const lift = c >= T2.restock[1] && c < T2.restock[2] + 0.15 ? 1 - seg(c, T2.restock[2], T2.restock[2] + 0.15) : up
    book.quaternion.copy(qFlat).slerp(qUp, lift)
  }
}

const MEM_FACES2: [number, string][] = [
  [0, 'happy'],
  [0.5, 'listening'],
  [1.0, 'grin'],
  [2.5, 'happy'],
  [4.5, 'neutral'],
  [5.5, 'listening'],
  [6.0, 'proud'],
  [7.0, 'happy'],
]
function memPose2(p: Pose, c: number, r: Rig2) {
  const l = memArmL2(c, r)
  const rr = memArmR2(c)
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = rr.s
  p.elbowR = rr.e
  to(p, 'fL1', 0.75, hold(c, ...T2.carry))
  to(p, 'fL2', 0.8, hold(c, ...T2.carry))
  const at = memAt2(c)
  /* facing the counter (screen left) whenever she is not walking */
  to(p, 'headTurn', -0.38, 1)
  to(p, 'lookX', -0.85, 1)
  walkLegs(p, c, at.walking, at.dir)
  /* eyes on the card, the book, the slot */
  const down = Math.max(hold(c, 0.4, 0.6, 1.2, 1.4), hold(c, 2.1, 2.3, 2.6, 2.8), hold(c, 5.5, 5.7, 6.0, 6.2))
  to(p, 'lookY', 0.5, down)
}

/* ------------------------------------------------------------------ T02 concept: the role desk */

function setupT02Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E9EFFA')
  frameCam2(camera)
  lights(scene, [0, 1.3, -0.6])
  const deskM = mat('#F4F7FC', { roughness: 0.45 })
  room2(scene, { floor: slabTex('#E1E8F5', '#CDD8EC', [8, 5]), wall: '#EEF2FA', ctr: deskM, top: mat('#FFFFFF', { roughness: 0.35 }), kick: '#C9D3E6' })
  /* the IAM Role mark on the desk front (rule 54, white tile) */
  const k = P2.ctr
  const roleTile = flat(mesh(new THREE.PlaneGeometry(0.3, 0.3), basic(markTex(roleUrl, redraw)), [-1.05, 0.52, k.z1 + 0.006]))
  scene.add(roleTile)
  scene.add(flat(box(k.x1 - k.x0, 0.03, 0.01, glowM(C.brand, '#DCE6FB'), [(k.x0 + k.x1) / 2, 0.86, k.z1 + 0.005])))

  /* the rack of role badges on the back wall, where the bookshelves are (one instanced mesh) */
  const sx0 = -2.45
  const sx1 = 0.2
  scene.add(flat(box(sx1 - sx0, 2.32, 0.04, mat('#FFFFFF', { roughness: 0.6 }), [(sx0 + sx1) / 2, 1.16, P2.wallZ + 0.03], 0.02)))
  const rails = [0.62, 1.22, 1.82]
  const railM = mat('#B7C3D6', { metalness: 0.6, roughness: 0.3 })
  for (const y of rails) scene.add(flat(box(sx1 - sx0 - 0.12, 0.025, 0.04, railM, [(sx0 + sx1) / 2, y + 0.24, P2.wallZ + 0.08])))
  const tones = ['#2D63FB', '#4D7DFF', '#12B5A8', '#7C5CE0', '#1F4FD8', '#0E9285', '#5B8DEF']
  const r = rng(5)
  const badges: { p: THREE.Vector3Tuple; s: THREE.Vector3Tuple; c: string; r?: number }[] = []
  const tabs: { p: THREE.Vector3Tuple; s: THREE.Vector3Tuple; c: string; r?: number }[] = []
  const cords: { p: THREE.Vector3Tuple; s: THREE.Vector3Tuple; c: string; r?: number }[] = []
  rails.forEach((y, ri) => {
    for (let x = sx0 + 0.2 + ri * 0.06; x < sx1 - 0.12; x += 0.24) {
      const tilt = (r() - 0.5) * 0.12
      const tone = tones[Math.floor(r() * tones.length)]
      badges.push({ p: [x, y, P2.wallZ + 0.1], s: [0.13, 0.18, 0.012], c: tone, r: tilt })
      tabs.push({ p: [x - tilt * 0.01, y + 0.005, P2.wallZ + 0.108], s: [0.08, 0.08, 0.004], c: '#FFFFFF', r: tilt })
      cords.push({ p: [x + tilt * 0.12, y + 0.165, P2.wallZ + 0.095], s: [0.012, 0.15, 0.008], c: tone, r: tilt })
    }
  })
  instanced(scene, new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', { roughness: 0.5 }), cords)
  instanced(scene, new RoundedBoxGeometry(1, 1, 1, 2, 0.12), mat('#ffffff', { roughness: 0.4 }), badges)
  instanced(scene, new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', { roughness: 0.5 }), tabs)

  /* the STS kiosk where the librarian stands: a pillar, a tilted screen with the official STS mark, a scanner eye */
  const kx = P2.libX
  const kz = P2.libZ
  scene.add(box(0.3, 1.18, 0.28, mat('#DCE3F0', { roughness: 0.45 }), [kx, 0.59, kz], 0.04))
  const head = new THREE.Group()
  head.position.set(kx, 1.4, kz + 0.02)
  head.rotation.x = -0.18
  head.add(box(0.5, 0.42, 0.06, mat(C.navy, { roughness: 0.35, metalness: 0.2 }), [0, 0, 0], 0.03))
  const stsScreen = flat(mesh(new THREE.PlaneGeometry(0.3, 0.3), basic(markTex(stsUrl, redraw)), [0, 0, 0.032]))
  head.add(stsScreen)
  const kioskGlow = glowM(C.brand, C.navy)
  head.add(box(0.44, 0.015, 0.01, kioskGlow, [0, -0.19, 0.032]))
  scene.add(head)
  /* the scanner eye on its arm, at the place the librarian's scanner works */
  const eyeArm = flat(box(0.03, 0.03, 0.22, mat('#B7C3D6', { metalness: 0.5, roughness: 0.3 }), [P2.scanAt.x, P2.scanAt.y, P2.scanAt.z - 0.12]))
  scene.add(eyeArm)
  scene.add(flat(box(0.03, P2.scanAt.y - 1.0, 0.03, mat('#B7C3D6', { metalness: 0.5, roughness: 0.3 }), [P2.scanAt.x, (P2.scanAt.y + 1.0) / 2 - 0.01, P2.scanAt.z - 0.22])))
  const eye = new THREE.Group()
  eye.position.copy(P2.scanAt)
  eye.add(mesh(new THREE.SphereGeometry(0.045, 24, 16), mat('#30343F', { roughness: 0.35 }), [0, 0, 0]))
  const eyeLed = glowM(C.red, '#3A1414')
  eye.add(mesh(new THREE.CircleGeometry(0.026, 24), eyeLed, [0, 0, 0.046]))
  scene.add(eye)
  const scanBeam = beam('#FF5A5A')
  const okBeam = beam('#4ADE80')
  scene.add(scanBeam.m, okBeam.m)

  /* the ring of light where the clock hangs: a navy plate, a faint track, the session arc and its running head */
  const ring = new THREE.Group()
  ring.position.copy(P2.clock)
  ring.add(mesh(new THREE.CylinderGeometry(P2.clockR + 0.04, P2.clockR + 0.04, 0.05, 48).rotateX(Math.PI / 2), mat(C.navy, { roughness: 0.4 }), [0, 0, 0]))
  ring.add(flat(mesh(new THREE.CircleGeometry(P2.clockR, 48), mat('#FFFFFF', { roughness: 0.6, emissive: new THREE.Color('#F5F8FF'), emissiveIntensity: 0.3 }), [0, 0, 0.026])))
  const track = arcBand(P2.clockR * 0.62, P2.clockR * 0.86, '#C9D6F2')
  track.set(0, TAU)
  track.m.position.z = 0.027
  const sess = arcBand(P2.clockR * 0.62, P2.clockR * 0.86, C.orange)
  sess.m.position.z = 0.029
  const ringGlow = halo(C.orange, 0.85, 0.85, true)
  ringGlow.position.z = 0.03
  const headDot = mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: C.accentDark, toneMapped: false }), [0, 0, 0.035])
  ring.add(track.m, sess.m, ringGlow, headDot)
  flat(ring)
  scene.add(ring)

  /* the badge's stand on the desk, where the book is picked up, and the badge */
  scene.add(box(0.2, 0.025, 0.1, mat('#FFFFFF', { roughness: 0.3 }), [P2.pick.x, P2.ctr.h + 0.012, P2.pick.z - 0.02], 0.008))
  const standGlow = glowM(C.brand, '#DCE6FB')
  scene.add(flat(box(0.17, 0.012, 0.008, standGlow, [P2.pick.x, P2.ctr.h + 0.03, P2.pick.z + 0.032])))
  scene.add(box(0.14, 0.06, 0.012, new THREE.MeshStandardMaterial({ color: '#E6EEFF', roughness: 0.1, transparent: true, opacity: 0.6 }), [P2.pick.x, P2.ctr.h + 0.055, P2.pick.z - 0.05], 0.004))
  const badge = cardMesh(roleBadgeTex(redraw), 0.11, 0.15)
  scene.add(badge)
  const badgeGlow = halo('#7FA6FF', 0.42)
  scene.add(badgeGlow)
  const standAt = P2.pick.clone().add(V(0, 0.09, -0.02))

  const card = cardMesh(idCardTex(C.brand), 0.12, 0.075)
  scene.add(card)
  const cardGlow = halo('#4ADE80', 0.3)
  scene.add(cardGlow)
  const laptop = laptopProp()
  scene.add(laptop)

  /* the caller: a boy in a hoodie with his laptop */
  const cCfg = who(CAST_PRESETS.kabir, { name: 'Caller', outfit: { top: 'hoodie', topColor: '#3E6FD8', bottom: 'jeans', bottomColor: '#2B2F3A', shoeColor: '#F2F2F5' } })
  const shM = buildSkin(cCfg).shoulderHalf
  const rr: Rig2 = { cam: camera, shM, shL: 50 }
  const caller = person({
    config: cCfg,
    dress: withTop(HOODIE_EXTRA('#2C56B8')),
    seed: 1403,
    faces: MEM_FACES2,
    pose: (p, c) => memPose2(p, c, rr),
    loop: L2,
    height: P2.hMem,
    frames: F2,
    redraw,
    holdT: HOLD2,
  })
  scene.add(caller.object)

  const hand = new THREE.Vector3()
  const rhand = new THREE.Vector3()
  const qCam = new THREE.Quaternion()
  return (t: number) => {
    const c = mod(t, L2)
    const cq = frameT(c, L2, F2)
    const mRoot = memRoot2(c)
    caller.object.position.copy(mRoot)
    caller.object.visible = mRoot.x < P2.off - 0.05
    caller.update(c, camera)
    qCam.copy(camera.quaternion)

    /* the ring: the session arc runs down exactly as the loan does */
    const ang = handAngle2(c)
    const arc = loanArc2(c)
    if (arc) sess.set(arc[0], arc[1])
    else sess.m.visible = false
    const live = hold(c, T2.loan[0], T2.loan[1], T2.loan[2] - 0.3, T2.loan[2])
    headDot.visible = !!arc
    headDot.position.set(Math.sin(ang) * P2.clockR * 0.74, Math.cos(ang) * P2.clockR * 0.74, 0.035)
    opa(ringGlow, live * (0.35 + 0.1 * Math.sin(TAU * 1.5 * c)))

    const mq = memRoot2(cq)
    rigToWorld(handPt('L', shM, memArmL2(cq, rr)), P2.hMem, mq, camera, hand)
    towardCamera(hand, camera, 0.08)
    rigToWorld(handPt('R', shM, memArmR2(cq)), P2.hMem, mq, camera, rhand)
    towardCamera(rhand, camera, 0.06)
    laptop.position.copy(rhand).add(V(0, 0.02, 0))
    laptop.quaternion.copy(qCam)
    laptop.visible = caller.object.visible

    /* the ID card, as the library card */
    const shown = c < T2.pocket[1] ? 1 - seg(c, T2.pocket[0], T2.pocket[1]) : seg(c, T2.cardBack[0], T2.cardBack[1])
    card.visible = shown > 0.02
    card.position.copy(hand).add(V(-0.02, 0.03, 0.01))
    card.quaternion.copy(qCam)
    card.rotateZ(0.25 * (1 - hold(c, ...T2.cardUp)))
    card.scale.setScalar(Math.max(0.001, shown))
    const ok = hold(c, T2.beep, T2.beep + 0.06, 1.3, 1.5)
    cardGlow.position.copy(card.position).addScaledVector(camera.position.clone().sub(card.position).normalize(), -0.01)
    cardGlow.quaternion.copy(qCam)
    opa(cardGlow, 0.85 * ok)

    /* the kiosk's eye: turns to the card while scanning (the librarian's scanner), red beam then green */
    const look = hold(c, T2.scan[0], T2.scan[1], T2.cradleBack[0], T2.cradleBack[1])
    eye.rotation.set(0, lerp(-0.2, 0, look), 0)
    if (look > 0.05) {
      const q0 = eye.quaternion.clone()
      eye.lookAt(card.position)
      eye.quaternion.copy(q0.slerp(eye.quaternion.clone(), look))
    }
    eyeLed.emissive.set(ok > 0.1 ? '#4ADE80' : C.red)
    eyeLed.emissiveIntensity = 0.5 + 1.6 * Math.max(ok, hold(c, ...T2.beam))
    kioskGlow.emissiveIntensity = 0.6 + 1.2 * ok
    const from = V(0, 0, 0.05).applyQuaternion(eye.quaternion).add(eye.position)
    const on = hold(c, ...T2.beam)
    scanBeam.set(from, card.position, 0.85 * on * (1 - ok))
    okBeam.set(from, card.position, 0.85 * on * ok)

    /* the badge: on its stand, lifted as it is issued, taken, carried, set back as the session ends, lit again */
    let bp: THREE.Vector3
    if (c < T2.carry[0]) bp = standAt.clone().add(V(0, 0.07 * hold(c, ...T2.slide), 0))
    else if (c < T2.ret[1]) bp = standAt.clone().lerp(hand.clone().add(V(0, 0.0, 0.03)), seg(c, T2.carry[0], T2.carry[1]))
    else bp = hand.clone().lerp(standAt, seg(c, T2.ret[1], T2.ret[2]))
    badge.position.copy(bp)
    badge.quaternion.copy(qCam)
    if (c >= T2.carry[0] && c < T2.ret[2]) badge.rotateZ(0.12 * Math.sin(TAU * 0.6 * c) * hold(c, ...T2.carry))
    /* lit while it can be used: issued, carried; dark from the end of the session until it is ready again */
    const expired = hold(c, T2.ret[2] - 0.05, T2.ret[2] + 0.1, T2.restock[1], T2.restock[2] + 0.2)
    const lit = (0.55 + 0.45 * hold(c, ...T2.slide) + 0.25 * Math.sin(TAU * 1.2 * c) * hold(c, ...T2.carry)) * (1 - expired)
    ;(badge.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.12 + 0.3 * lit
    ;(badge.material as THREE.MeshStandardMaterial).color.setScalar(lerp(0.55, 1, 1 - expired))
    badgeGlow.position.copy(badge.position).addScaledVector(camera.position.clone().sub(badge.position).normalize(), -0.02)
    badgeGlow.quaternion.copy(qCam)
    opa(badgeGlow, 0.8 * lit)
    standGlow.emissiveIntensity = 1.4 * (1 - expired) * (c < T2.carry[1] || c > T2.ret[2] ? 1 : 0.25)
  }
}

/* one camera for both T02 cards */
function frameCam2(camera: THREE.PerspectiveCamera) {
  camera.fov = 43
  camera.position.set(0.12, 1.4, 3.25)
  camera.lookAt(0.12, 1.08, -0.6)
  camera.updateProjectionMatrix()
}

/* ================================================================== T08 · the building-wide card */

const L8 = 6.8
const F8 = 82
const HOLD8 = 3.2 /* every door open, the employee at the one room he needed, the others standing open behind him */
const P8 = {
  wallZ: -1.15,
  z: -0.35,
  h: 1.72,
  start: -1.85,
  atDoor: 0.4,
  reader: V(-1.45, 1.2, -1.1),
  doors: [-0.95, -0.05, 0.85, 1.75],
  dw: 0.62,
  dh: 1.98,
  need: 2,
}
const T8 = {
  tap: [0.0, 0.4, 0.75, 1.05] as const,
  beep: 0.5,
  walks: [
    [1.15, 2.55, P8.atDoor],
    [4.95, 6.55, P8.start],
  ] as [number, number, number][],
  use: [2.55, 2.8, 3.75, 3.95] as const,
  worryL: [3.9, 4.1, 4.45, 4.6] as const,
  worryR: [4.45, 4.6, 4.8, 4.95] as const,
}
/** door / case i: 0 shut, 1 open; open in a wave after the tap, shut in a wave (far end first) on the way back */
const openOf8 = (c: number, i: number) => {
  const o = 0.6 + 0.28 * i
  const s = 5.2 + 0.28 * (3 - i)
  return seg(c, o, o + 0.6) * (1 - seg(c, s, s + 0.6))
}
const empAt8 = (c: number) => along(c, [[0, 0, P8.start], ...T8.walks])
const empRoot8 = (c: number) => {
  const a = empAt8(c)
  return V(a.x, bob(a.walking, c), P8.z)
}
/** the screen-right arm: the card to the reader; then presented into the room he needed */
function empArmR8(c: number, cam: THREE.Camera, sh: number): Arm {
  const root = empRoot8(c)
  const w = empAt8(c).walking
  let a: Arm = { s: 8 - swing(c, w), e: 10 }
  a = mixA(a, solveArm('R', sh, worldToRig(P8.reader.clone().add(V(0, 0, 0.04)), P8.h, root, cam)), hold(c, ...T8.tap))
  a = mixA(a, { s: 66, e: 14 }, hold(c, ...T8.use))
  return a
}
const empArmL8 = (c: number): Arm => ({ s: 8 + swing(c, empAt8(c).walking), e: 10 })
function empPose8(p: Pose, c: number, cam: THREE.Camera, sh: number) {
  const r = empArmR8(c, cam, sh)
  const l = empArmL8(c)
  p.shoulderR = r.s
  p.elbowR = r.e
  p.shoulderL = l.s
  p.elbowL = l.e
  const at = empAt8(c)
  /* at the reader: facing it (screen right) */
  to(p, 'headTurn', 0.4, 1)
  to(p, 'lookX', 0.85, 1)
  walkLegs(p, c, at.walking, at.dir)
  /* the open palm into his room */
  const use = hold(c, ...T8.use)
  to(p, 'palmR', 1, use)
  to(p, 'fR1', 0, use)
  to(p, 'fR2', 0.05, use)
  to(p, 'fR3', 0.1, use)
  to(p, 'fR4', 0.15, use)
  to(p, 'headTurn', 0.55, use)
  /* the worried looks: back along the corridor at the doors he never needed, then at the one beyond */
  const wl = hold(c, ...T8.worryL)
  to(p, 'headTurn', -0.6, wl)
  to(p, 'lookX', -1, wl)
  const wr = hold(c, ...T8.worryR)
  to(p, 'headTurn', 0.6, wr)
  to(p, 'lookX', 1, wr)
  /* doors swinging along the corridor: his eyes follow the wave */
  const wave = hold(c, 0.8, 0.95, 1.1, 1.2)
  to(p, 'headTurn', 0.6, wave)
  to(p, 'lookX', 1, wave)
}
const EMP_FACES8: [number, string][] = [
  [0, 'neutral'],
  [0.5, 'happy'],
  [0.85, 'surprised'],
  [1.6, 'neutral'],
  [2.55, 'happy'],
  [3.9, 'worried'],
  [5.1, 'thinking'],
  [6.3, 'neutral'],
]

/** the wall of T08 (shared by both cards): openings at the door places, floor, skirting */
function wall8(scene: THREE.Scene, o: { wall: string; floor: THREE.Texture; kick: string; openings: boolean }) {
  const wz = P8.wallZ
  const fl = flat(mesh(new THREE.PlaneGeometry(10, 6), mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0, 1.4]))
  fl.rotation.x = -Math.PI / 2
  fl.receiveShadow = true
  scene.add(fl)
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.3 })
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a + 0.004, y1 - y0, 0.12, wallM, [(a + b) / 2, (y0 + y1) / 2, wz - 0.06])))
  if (!o.openings) part(-5, 5, 0, 3.4)
  else {
    let x = -5
    for (const dx of P8.doors) {
      part(x, dx - P8.dw / 2, 0, 3.4)
      part(dx - P8.dw / 2, dx + P8.dw / 2, P8.dh, 3.4)
      x = dx + P8.dw / 2
    }
    part(x, 5, 0, 3.4)
  }
  const kick = mat(o.kick, { roughness: 0.7 })
  scene.add(flat(box(10, 0.1, 0.03, kick, [0, 0.05, wz + 0.015])))
  return wallM
}
/** the card reader (both cards): a dark panel, a contactless pad, an LED */
function reader8(scene: THREE.Scene) {
  const g = new THREE.Group()
  g.position.copy(P8.reader).setZ(P8.wallZ + 0.02)
  g.add(box(0.14, 0.22, 0.04, mat('#2B2F3A', { roughness: 0.4 }), [0, 0, 0], 0.015))
  g.add(box(0.1, 0.1, 0.006, mat('#3A4256', { roughness: 0.3 }), [0, -0.02, 0.022], 0.01))
  const led = glowM(C.red, '#3A1414')
  g.add(box(0.06, 0.016, 0.006, led, [0, 0.075, 0.022], 0.004))
  scene.add(g)
  const glow = halo('#4ADE80', 0.4)
  glow.position.copy(g.position).add(V(0, 0, 0.05))
  scene.add(glow)
  return { led, glow }
}

function setupT08Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF0F4')
  frameCam8(camera)
  lights(scene, [0, 1.3, -0.6])
  wall8(scene, { wall: '#EFE6D6', floor: slabTex('#CBD3DF', '#B9C3D2', [10, 6]), kick: '#6B5444', openings: true })
  const wz = P8.wallZ
  const rd = reader8(scene)

  /* four rooms behind four doors: records, servers, HIS OFFICE (the one he needs), the safe room */
  const frameM = mat('#5B3B26', { roughness: 0.55 })
  const leafM = mat('#B07A4F', { roughness: 0.55 })
  const handleM = mat(C.steel, { metalness: 0.75, roughness: 0.25 })
  const doors = P8.doors.map((dx, i) => {
    const x0 = dx - P8.dw / 2
    const x1 = dx + P8.dw / 2
    /* frame */
    scene.add(box(0.06, P8.dh + 0.04, 0.16, frameM, [x0 - 0.03, (P8.dh + 0.04) / 2, wz + 0.02]), box(0.06, P8.dh + 0.04, 0.16, frameM, [x1 + 0.03, (P8.dh + 0.04) / 2, wz + 0.02]))
    scene.add(box(P8.dw + 0.12, 0.06, 0.16, frameM, [dx, P8.dh + 0.03, wz + 0.02]))
    /* the room: floor, walls, a ceiling light; lit as the door opens */
    const need = i === P8.need
    const inner = mat(need ? '#EAF1FF' : '#FBEBD8', { roughness: 0.9, emissive: new THREE.Color(need ? '#DCE8FF' : '#FFD9B0'), emissiveIntensity: 0.05 })
    const rz = wz - 0.7
    scene.add(flat(box(P8.dw + 0.5, 0.02, 1.3, mat('#C9B79E', { roughness: 0.8 }), [dx, 0.01, rz])))
    scene.add(flat(box(P8.dw + 0.5, 2.3, 0.04, inner, [dx, 1.15, wz - 1.33])))
    for (const s of [-1, 1]) scene.add(flat(box(0.04, 2.3, 1.3, inner, [dx + s * (P8.dw / 2 + 0.25), 1.15, rz])))
    /* the room's contents */
    const g = new THREE.Group()
    g.position.set(dx, 0, wz - 1.05)
    if (i === 0) {
      /* records: two filing cabinets */
      for (const ox of [-0.17, 0.17]) {
        g.add(box(0.3, 1.25, 0.4, mat('#9AA5B8', { roughness: 0.45, metalness: 0.3 }), [ox, 0.625, 0], 0.015))
        for (let k = 0; k < 4; k++) g.add(box(0.12, 0.02, 0.01, handleM, [ox, 0.3 + k * 0.3, 0.205]))
      }
    } else if (i === 1) {
      /* servers: a rack with lights */
      g.add(box(0.44, 1.6, 0.42, mat('#1F2E63', { roughness: 0.45, metalness: 0.25 }), [0, 0.8, 0], 0.02))
      for (let k = 0; k < 6; k++) g.add(box(0.36, 0.14, 0.01, mat('#2A3A70'), [0, 0.3 + k * 0.22, 0.215]), box(0.06, 0.025, 0.01, glowM('#6EE7B7', '#14301F', { emissiveIntensity: 1.2 }), [-0.12, 0.3 + k * 0.22, 0.222]))
    } else if (i === 2) {
      /* his office: a desk and a monitor */
      g.add(box(0.62, 0.05, 0.4, mat('#C79A6B', { roughness: 0.5 }), [0, 0.74, 0.05], 0.01))
      for (const ox of [-0.27, 0.27]) g.add(box(0.04, 0.72, 0.36, mat('#8A5C3B'), [ox, 0.36, 0.05]))
      g.add(box(0.04, 0.2, 0.04, mat('#2B2F3A'), [0, 0.87, 0]))
      g.add(box(0.42, 0.27, 0.03, mat('#2B2F3A', { roughness: 0.4 }), [0, 1.1, 0], 0.01))
    } else {
      /* the safe room: a heavy safe with a gold dial */
      g.add(box(0.56, 0.9, 0.5, mat('#4A5160', { roughness: 0.35, metalness: 0.4 }), [0, 0.45, 0], 0.03))
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24).rotateX(Math.PI / 2), mat(C.gold, { metalness: 0.7, roughness: 0.3 }), [0.08, 0.5, 0.26]))
      g.add(box(0.03, 0.2, 0.03, handleM, [-0.16, 0.5, 0.26]))
    }
    scene.add(g)
    const screen = i === 2 ? glowM('#7FB0FF', '#16203F') : null
    if (screen) {
      const s = box(0.38, 0.23, 0.004, screen, [dx, 1.1, wz - 1.05 + 0.017])
      scene.add(s)
    }
    const light = new THREE.PointLight(need ? 0xcfe0ff : 0xffc68a, 0, 2.4, 1.3)
    light.position.set(dx, 1.9, wz - 0.7)
    scene.add(light)
    /* the light that spills out on the corridor floor: orange from rooms nobody needed, blue from his */
    const spill = halo(need ? '#7FA6FF' : C.orange, 1.1, 1.0, true)
    spill.rotation.x = -Math.PI / 2
    spill.position.set(dx, 0.012, wz + 0.42)
    scene.add(spill)
    /* the door leaf, hinged at its left edge, swinging into the room; its lock LED on the frame */
    const hinge = new THREE.Group()
    hinge.position.set(x0 + 0.005, 0, wz - 0.03)
    const lw = P8.dw - 0.01
    hinge.add(box(lw, P8.dh - 0.02, 0.05, leafM, [lw / 2, (P8.dh - 0.02) / 2, 0], 0.01))
    hinge.add(flat(box(lw - 0.16, 0.6, 0.006, mat('#9C6A42', { roughness: 0.6 }), [lw / 2, 1.45, 0.028], 0.01)))
    hinge.add(flat(box(lw - 0.16, 0.6, 0.006, mat('#9C6A42', { roughness: 0.6 }), [lw / 2, 0.6, 0.028], 0.01)))
    hinge.add(box(0.12, 0.025, 0.04, handleM, [lw - 0.12, 1.0, 0.045], 0.008))
    scene.add(hinge)
    const led = glowM(C.red, '#3A1414')
    scene.add(box(0.05, 0.02, 0.01, led, [x1 + 0.03, P8.dh - 0.25, wz + 0.105]))
    return { hinge, inner, light, spill, led, screen, need }
  })

  const card = cardMesh(masterCardTex(), 0.12, 0.075)
  scene.add(card)

  const eCfg = who(CAST_PRESETS.arjun, { name: 'Employee', hair: { style: 'sidePart' }, outfit: { top: 'shirtTie', topColor: '#E8ECF5', bottom: 'trousers', bottomColor: '#2C3448', shoeColor: '#2A2A30', accentColor: '#2D63FB' }, accessories: { watch: true, belt: true } })
  const sh = buildSkin(eCfg).shoulderHalf
  const emp = person({
    config: eCfg,
    dress: withTop(TIE_CLIP),
    seed: 1801,
    faces: EMP_FACES8,
    pose: (p, c) => empPose8(p, c, camera, sh),
    loop: L8,
    height: P8.h,
    frames: F8,
    redraw,
    holdT: HOLD8,
  })
  scene.add(emp.object)

  const hand = new THREE.Vector3()
  const qCam = new THREE.Quaternion()
  const readerAt = P8.reader.clone().add(V(0, -0.02, 0.05))
  return (t: number) => {
    const c = mod(t, L8)
    const cq = frameT(c, L8, F8)
    emp.object.position.copy(empRoot8(c))
    emp.update(c, camera)
    qCam.copy(camera.quaternion)
    const ok = hold(c, T8.beep, T8.beep + 0.05, 1.0, 1.3)
    rd.led.emissive.set(ok > 0.1 ? '#4ADE80' : C.red)
    rd.led.emissiveIntensity = 0.5 + 1.5 * ok
    opa(rd.glow, 0.7 * ok)
    doors.forEach((d, i) => {
      const o = openOf8(c, i)
      d.hinge.rotation.y = 1.25 * o
      d.inner.emissiveIntensity = 0.05 + 0.45 * o
      d.light.intensity = 2.4 * o
      opa(d.spill, (d.need ? 0.55 : 0.5) * o * (0.88 + 0.12 * Math.sin(TAU * 1.4 * c + i)))
      d.led.emissive.set(o > 0.05 ? '#4ADE80' : C.red)
      d.led.emissiveIntensity = 0.5 + 1.2 * Math.min(1, o * 3)
      if (d.screen) d.screen.emissiveIntensity = 0.2 + 1.3 * hold(c, T8.use[0], T8.use[1] + 0.1, T8.walks[1][0], T8.walks[1][0] + 0.4)
    })
    /* the card in his hand, pressed flat to the reader at the tap */
    rigToWorld(handPt('R', sh, empArmR8(cq, camera, sh)), P8.h, empRoot8(cq), camera, hand)
    towardCamera(hand, camera, 0.08)
    const at = hold(c, T8.tap[0] + 0.25, T8.tap[1], T8.tap[2], T8.tap[2] + 0.15)
    card.position.copy(hand).add(V(0.02, 0.02, 0)).lerp(readerAt, at)
    card.quaternion.copy(qCam)
    card.rotateZ(-0.3 * (1 - at))
  }
}

/* ------------------------------------------------------------------ T08 concept: one badge opens every service */

function setupT08Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E9EFFA')
  frameCam8(camera)
  lights(scene, [0, 1.3, -0.6])
  wall8(scene, { wall: '#EEF2FA', floor: slabTex('#E1E8F5', '#CDD8EC', [8, 5]), kick: '#C9D3E6', openings: false })
  const rd = reader8(scene)
  scene.add(flat(box(10, 0.03, 0.01, glowM(C.brand, '#DCE6FB', { emissiveIntensity: 0.8 }), [0, 2.35, P8.wallZ + 0.005])))

  /* four service cases at the door places: a server (EC2), a database, THE BUCKET (S3, the one she needs), a function
     (Lambda); each a white plinth with its mark on a white tile, under a glass hood that lifts like the doors swing */
  const pz = P8.wallZ + 0.38
  const plinthH = 0.8
  /* narrower than a door, so she can stand between two cases without covering either */
  const PW = 0.46
  const tex = [markTex(ec2Url, redraw), dbTileTex(), markTex(s3Url, redraw), markTex(lambdaUrl, redraw)]
  const glassM = new THREE.MeshStandardMaterial({ color: '#DCEBFF', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false })
  const rimM = mat('#B7C3D6', { metalness: 0.6, roughness: 0.3 })
  const cubes: THREE.Mesh[] = []
  const pods = P8.doors.map((dx, i) => {
    const need = i === P8.need
    scene.add(box(PW, plinthH, 0.46, mat('#F7F9FD', { roughness: 0.4 }), [dx, plinthH / 2, pz], 0.03))
    scene.add(flat(mesh(new THREE.PlaneGeometry(0.24, 0.24), basic(tex[i]), [dx, plinthH / 2 + 0.02, pz + 0.232])))
    const led = glowM(C.red, '#3A1414')
    scene.add(box(0.12, 0.018, 0.01, led, [dx, plinthH - 0.08, pz + 0.232], 0.004))
    /* the service itself */
    const glowC = need ? '#7FA6FF' : C.orange
    const body = new THREE.Group()
    body.position.set(dx, plinthH, pz)
    const lit: THREE.MeshStandardMaterial[] = []
    if (i === 0) {
      body.add(box(0.3, 0.5, 0.3, mat('#1F2E63', { roughness: 0.45, metalness: 0.25 }), [0, 0.25, 0], 0.02))
      for (let k = 0; k < 4; k++) {
        const m = glowM('#6EE7B7', '#14301F')
        lit.push(m)
        body.add(box(0.24, 0.07, 0.01, mat('#2A3A70'), [0, 0.08 + k * 0.11, 0.155]), box(0.05, 0.02, 0.01, m, [-0.07, 0.08 + k * 0.11, 0.162]))
      }
    } else if (i === 1) {
      for (let k = 0; k < 3; k++) {
        const m = glowM('#8FB0FF', '#3B6FE0', { roughness: 0.35 })
        lit.push(m)
        body.add(cyl(0.14, 0.14, 0.13, m, [0, 0.08 + k * 0.155, 0], 36))
      }
    } else if (i === 2) {
      const pailM = glowM('#B5D94A', C.s3, { roughness: 0.4 })
      lit.push(pailM)
      body.add(mesh(new THREE.CylinderGeometry(0.18, 0.135, 0.3, 36, 1, true), pailM, [0, 0.15, 0]))
      body.add(mesh(new THREE.CylinderGeometry(0.178, 0.133, 0.29, 36, 1, true), mat('#5E7F10', { side: THREE.BackSide }), [0, 0.15, 0]))
      body.add(mesh(new THREE.CircleGeometry(0.135, 36).rotateX(-Math.PI / 2), mat('#5E7F10'), [0, 0.005, 0]))
      body.add(mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 40).rotateX(Math.PI / 2), mat('#6A8F12'), [0, 0.3, 0]))
      for (const [ox, oz] of [[-0.055, 0.03], [0.06, 0.02], [0, -0.05]]) {
        const cube = mesh(new RoundedBoxGeometry(0.09, 0.09, 0.09, 2, 0.015), mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#7FA6FF'), emissiveIntensity: 0 }), [ox, 0.3, oz])
        cube.rotation.y = ox * 4
        body.add(cube)
        cubes.push(cube)
      }
    } else {
      const m = glowM('#FFB061', '#F28C28', { roughness: 0.35 })
      lit.push(m)
      body.add(box(0.26, 0.26, 0.26, m, [0, 0.2, 0], 0.05))
      body.add(cyl(0.035, 0.035, 0.08, mat('#B7C3D6', { metalness: 0.5 }), [0, 0.03, 0]))
    }
    scene.add(body)
    const inner = halo(glowC, 0.8, 0.8, true)
    inner.position.set(dx, plinthH + 0.3, pz - 0.2)
    scene.add(inner)
    /* the glass hood and its rim */
    const hood = new THREE.Group()
    hood.add(flat(box(PW - 0.04, 0.6, 0.42, glassM, [0, 0.3, 0], 0.03)))
    hood.add(box(PW - 0.02, 0.03, 0.44, rimM, [0, 0.615, 0], 0.01))
    hood.position.set(dx, plinthH, pz)
    scene.add(flat(hood))
    const spill = halo(glowC, 1.1, 0.9, true)
    spill.rotation.x = -Math.PI / 2
    spill.position.set(dx, 0.012, pz + 0.55)
    scene.add(spill)
    return { hood, inner, spill, led, lit, need }
  })

  const badge = cardMesh(asteriskBadgeTex(), 0.09, 0.122)
  scene.add(badge)
  const badgeGlow = halo('#7FA6FF', 0.38)
  scene.add(badgeGlow)
  const laptop = laptopProp()
  scene.add(laptop)

  const cCfg = who(CAST_PRESETS.ananya, { name: 'Caller', hair: { style: 'ponytail', color: '#2A2324' }, skinTone: '#F4A077', outfit: { top: 'polo', topColor: '#12B5A8', bottom: 'jeans', bottomColor: '#25366E', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const sh = buildSkin(cCfg).shoulderHalf
  const caller = person({
    config: cCfg,
    seed: 1802,
    faces: EMP_FACES8,
    pose: (p, c) => empPose8(p, c, camera, sh),
    loop: L8,
    height: P8.h - 0.06,
    frames: F8,
    redraw,
    holdT: HOLD8,
  })
  scene.add(caller.object)

  const hand = new THREE.Vector3()
  const lhand = new THREE.Vector3()
  const qCam = new THREE.Quaternion()
  const readerAt = P8.reader.clone().add(V(0, -0.02, 0.05))
  const hC = P8.h - 0.06
  return (t: number) => {
    const c = mod(t, L8)
    const cq = frameT(c, L8, F8)
    caller.object.position.copy(empRoot8(c))
    caller.update(c, camera)
    qCam.copy(camera.quaternion)
    const ok = hold(c, T8.beep, T8.beep + 0.05, 1.0, 1.3)
    rd.led.emissive.set(ok > 0.1 ? '#4ADE80' : C.red)
    rd.led.emissiveIntensity = 0.5 + 1.5 * ok
    opa(rd.glow, 0.7 * ok)
    const use = hold(c, T8.use[0], T8.use[1] + 0.1, T8.walks[1][0], T8.walks[1][0] + 0.4)
    pods.forEach((d, i) => {
      const o = openOf8(c, i)
      d.hood.position.y = plinthH + 0.62 * o
      opa(d.inner, (d.need ? 0.75 : 0.6) * o * (0.85 + 0.15 * Math.sin(TAU * 1.4 * c + i)))
      opa(d.spill, 0.42 * o)
      d.led.emissive.set(o > 0.05 ? '#4ADE80' : C.red)
      d.led.emissiveIntensity = 0.5 + 1.2 * Math.min(1, o * 3)
      d.lit.forEach((m, k) => (m.emissiveIntensity = 0.1 + o * (0.45 + 0.3 * Math.max(0, Math.sin(TAU * 1.6 * c + k * 1.3 + i)))))
    })
    /* the bucket's objects lift toward her while she uses it */
    cubes.forEach((m, k) => {
      m.position.y = 0.3 + use * (0.1 + 0.03 * Math.sin(TAU * 1.2 * c + k * 2))
      ;(m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 * use
    })
    const root = empRoot8(cq)
    rigToWorld(handPt('R', sh, empArmR8(cq, camera, sh)), hC, root, camera, hand)
    towardCamera(hand, camera, 0.08)
    rigToWorld(handPt('L', sh, empArmL8(cq)), hC, root, camera, lhand)
    towardCamera(lhand, camera, 0.06)
    laptop.position.copy(lhand).add(V(0, 0.02, 0))
    laptop.quaternion.copy(qCam)
    const at = hold(c, T8.tap[0] + 0.25, T8.tap[1], T8.tap[2], T8.tap[2] + 0.15)
    badge.position.copy(hand).add(V(0.02, 0.03, 0)).lerp(readerAt, at)
    badge.quaternion.copy(qCam)
    badge.rotateZ(-0.25 * (1 - at))
    badgeGlow.position.copy(badge.position).addScaledVector(camera.position.clone().sub(badge.position).normalize(), -0.02)
    badgeGlow.quaternion.copy(qCam)
    opa(badgeGlow, 0.45 + 0.4 * ok + 0.1 * Math.sin((TAU * 8 * c) / L8))
  }
}

/* one camera for both T08 cards */
function frameCam8(camera: THREE.PerspectiveCamera) {
  camera.fov = 43
  camera.position.set(-0.08, 1.5, 4.2)
  camera.lookAt(-0.08, 1.08, -0.6)
  camera.updateProjectionMatrix()
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
  H_T02Everyday: card(setupT02Everyday, devHold(HOLD2)),
  H_T02Concept: card(setupT02Concept, devHold(HOLD2)),
  H_T08Everyday: card(setupT08Everyday, devHold(HOLD8)),
  H_T08Concept: card(setupT08Concept, devHold(HOLD8)),
}
export const css = ''
