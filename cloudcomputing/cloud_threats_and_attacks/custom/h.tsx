import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import bucketUrl from '../images/res-s3-bucket.svg'
import objectUrl from '../images/res-s3-object.svg'

/**
 * BUILDER H · SESSION 16 (Cloud Threats & Attacks) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`
 * (generate-slides standing corrections 13-16, cloud R10-R13, "Low-end PCs"): perspective camera, real places,
 * Character Lab people through the engine's `castSprite` (adaptive frames, role clothing by `dress`, expressions keyed
 * to the action), no text on either card, ONE wall-clock loop per slide shared by both cards beat for beat and place
 * for place, every loop ending in the state it starts in (restart well within 0.3 s), held frames at HOLD.
 *
 * SLIDE 9 · T02-AN (TR 2): "A single person blocking a building's entrance by repeatedly entering and exiting is like a
 * DoS attack. If thousands of people, controlled by one organiser, crowd the same entrance at once, it is like a DDoS
 * attack."
 *
 *   place (x)     everyday: an office building entrance        concept: a server room
 *    0.6          the glass entrance (sliding doors)           the server rack (status beacon on top)
 *    0.6, front   the man who keeps going in and out           the one attacker laptop
 *    2.1          the customer who cannot get in               a user's laptop whose requests bounce back
 *   -0.25..-1.95  three more people who crowd the entrance     three compromised devices (camera, router, phone)
 *   -2.95, back   the organiser, pointing them in              the command-and-control server, sending orders
 *
 *   0.0 - 3.3   phase 1, DoS: the man goes in and comes out twice; each time the customer steps up he is in the way
 *   3.3 - 5.4   phase 2, DDoS: the crowd arrives, the organiser follows and directs; the customer is pushed back,
 *               the rack's beacon turns orange under the flood
 *   5.4 - 7.0   the crowd holds the entrance, the organiser keeps pointing
 *   6.8 - 8.9   the organiser and the crowd leave, the customer steps back up, the beacon turns green again
 *
 * SLIDE 26 · T13-AN (TR 13): "A shop owner accidentally leaves the front door unlocked, allowing anyone to walk in and
 * take products. This is like a public S3 bucket exposing stored data to anyone on the internet."
 *
 *   place (x)     everyday: a small shop                        concept: an S3 bucket
 *    0.3          the shop door, shelves of products inside      the bucket on its plinth, objects inside
 *    1.0          the owner, who walks away                      the account owner, who walks away
 *    door ajar    the door drifts open: it was not locked        the lid lifts: the bucket is public
 *    from right   a passer-by walks in, comes out with a box     an internet user reaches in, leaves with an object
 *    from left    a second passer-by takes a jar                 a second user takes another object
 *   -1.6, high    (the street)                                   the globe: anyone on the internet
 *
 *   0.0 - 1.6 the owner walks off; 1.6 - 2.0 the door / lid opens; 2.9 - 5.9 passer-by A; 4.0 - 7.9 passer-by B;
 *   7.5 - 8.75 the owner comes back, 8.55 - 8.95 the door / lid shuts and the shelf / bucket is whole again.
 */

const W = 470
const H = 390
const L = 9

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#00254B',
  steel: '#B7C3D6',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  brass: '#D4A24A',
  green: '#22C55E',
  red: '#E5484D',
  s3: '#7AA116',
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
const DEG = Math.PI / 180

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
/** paving: soft slabs with thin joints (a real surface, not a grid backdrop) */
const pavingTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 1.5
      g.strokeRect(1, 1, 126, 62)
      g.strokeRect(-63, 65, 126, 62)
      g.strokeRect(65, 65, 126, 62)
    },
    repeat,
  )
/** an official mark (svg url) rasterised at `px` on a white rounded tile, sharp, reading as the white tile (rule 54) */
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

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glow = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.castShadow = false
  return o
}

function lights(scene: THREE.Scene, target: THREE.Vector3Tuple) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 5, target[1] + 9, target[2] + 8)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -7
  key.shadow.camera.right = 7
  key.shadow.camera.top = 7
  key.shadow.camera.bottom = -7
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
}

/** a slide's two cards share one framing: `z` sets how wide a stage the card shows, `ly` keeps the feet low in the card */
function frame(camera: THREE.PerspectiveCamera, z: number, ly: number) {
  camera.fov = 34
  camera.position.set(0, 2.0, z)
  camera.lookAt(0, ly, -0.7)
}
const frame2 = (camera: THREE.PerspectiveCamera) => frame(camera, 7.3, 1.52)
const frame13 = (camera: THREE.PerspectiveCamera) => frame(camera, 6.75, 1.5)

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }

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
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; height: number; frames?: number; redraw: () => void }): Sprite {
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: L,
    frames: o.frames ?? 90,
    height: o.height,
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: CAST_IDLE, ...faceAt(c, o.faces) }),
    pose: o.pose,
  })
}
/** the walking layer: knees alternate, arms swing, head toward the way the person goes (dir -1 left, +1 right) */
function walkPose(p: Pose, c: number, w: number, dir: number, arms = true) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  if (arms) {
    to(p, 'shoulderL', 8 + 10 * stride, w)
    to(p, 'shoulderR', 8 - 10 * stride, w)
  }
  if (dir) {
    to(p, 'headTurn', 0.45 * dir, w)
    to(p, 'lookX', 0.8 * dir, w)
  }
}
const bob = (walking: number, c: number) => walking * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.035

/** a walk through key points [t, x, z]: smooth between keys, standing still where two keys share a place */
type Key = [number, number, number]
function along(c: number, keys: Key[]): { x: number; z: number; walking: number; dir: number } {
  if (c <= keys[0][0]) return { x: keys[0][1], z: keys[0][2], walking: 0, dir: 0 }
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, z1] = keys[i]
    const [t0, x0, z0] = keys[i - 1]
    if (c <= t1) {
      const k = seg(c, t0, t1)
      const moving = Math.hypot(x1 - x0, z1 - z0) > 0.01
      const walking = moving ? win(c, t0 + 0.04, t1 - 0.04, 0.06) : 0
      const dir = Math.abs(x1 - x0) > 0.25 ? Math.sign(x1 - x0) : 0
      return { x: lerp(x0, x1, k), z: lerp(z0, z1, k), walking, dir }
    }
  }
  const last = keys[keys.length - 1]
  return { x: last[1], z: last[2], walking: 0, dir: 0 }
}

/* arm solve in the rig's 400 x 600 frame (Session 13 k.tsx): shoulder and elbow angles that put the screen-left hand at
   p; the screen-right arm mirrors (the rig draws both sides from the same numbers) */
const SHOULDER_Y = 205
const UPPER = 95
const FORE = 99
type Pt = { x: number; y: number }
function solveL(sh: number, p: Pt): { s: number; e: number } {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const D = Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5)
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(clamp01((UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D)))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
}
/** both hands in front of the belly, holding something (w 0..1) */
function carryPose(p: Pose, sh: number, w: number) {
  if (w <= 0) return
  const a = solveL(sh, { x: 176, y: 318 })
  to(p, 'shoulderL', a.s, w)
  to(p, 'elbowL', a.e, w)
  to(p, 'shoulderR', a.s, w)
  to(p, 'elbowR', a.e, w)
  to(p, 'fL1', 0.7, w)
  to(p, 'fR1', 0.7, w)
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

/* role clothing, rig body frame 400 x 600 */
/** the shopkeeper's apron, drawn in the rig's own frames so it moves with him (Session 13 k.tsx) */
const SHOP_APRON = (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill="#2F7A5A" stroke="#1F5A41" strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke="#1F5A41" strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill="#3A8E6B" stroke="#1F5A41" strokeWidth={2.5} />
  </g>
)
/** a blazer: lapels and two buttons over the shirt */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
/** a shoulder bag strap across the body */
const BAG_STRAP = (color: string) => (
  <g data-part="strap">
    <path d="M 232 210 L 166 352" stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/* ------------------------------------------------------------------ packets (concept cards) */

type Stream = { from: THREE.Vector3; to: THREE.Vector3; t0: number; t1: number; dt: number; travel: number; bounce?: boolean; m: THREE.Material; r?: number; lift?: number }
/** a pool of small glowing spheres riding streams of requests: deterministic from the loop clock, so held frames and
    the loop wrap are exact */
function packetPool(scene: THREE.Scene, n: number) {
  const geo = new THREE.SphereGeometry(1, 16, 12)
  const pool = Array.from({ length: n }, () => {
    const m = new THREE.Mesh(geo, undefined as unknown as THREE.Material)
    m.visible = false
    scene.add(m)
    return m
  })
  const p = new THREE.Vector3()
  return (c: number, streams: Stream[]) => {
    let used = 0
    for (const s of streams) {
      for (let b = s.t0; b < s.t1 && used < n; b += s.dt) {
        const u = (c - b) / s.travel
        if (u < 0 || u > 1) continue
        let k = u
        let alpha = 1
        if (s.bounce) {
          /* out to just short of the target, then back, fading: refused */
          k = u < 0.6 ? (u / 0.6) * 0.86 : lerp(0.86, 0.55, (u - 0.6) / 0.4)
          alpha = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4
        }
        p.lerpVectors(s.from, s.to, k)
        p.y += (s.lift ?? 0.25) * Math.sin(Math.PI * k)
        const m = pool[used++]
        m.material = s.m
        m.position.copy(p)
        const r = (s.r ?? 0.055) * (s.bounce && u > 0.6 ? 0.6 + 0.4 * alpha : 1) * Math.min(1, u * 8, (1 - u) * 8 + (s.bounce ? 1 : 0))
        m.scale.setScalar(Math.max(0.001, r))
        m.visible = true
      }
    }
    for (let i = used; i < n; i++) pool[i].visible = false
  }
}

/* ================================================================== T02 · one man in the doorway, then a crowd */

const HOLD2 = 6.0 /* the crowd at the entrance, the organiser pointing, the customer pushed back, the beacon orange */
const P2 = {
  wallZ: -1.2,
  doorX: 0.9,
  doorW: 1.36,
  doorH: 2.3,
  front: 0.35,
  inside: -1.95,
  customer: 1.98,
  customerBack: 2.25,
  customerUp: 1.66,
  slots: [0.1, -0.7, -1.5],
  orgX: -2.58,
  orgZ: -0.9,
  off: -3.6,
}
/* the man who blocks the door: in and out twice (phase 1), then holds the door front with the crowd */
const blockerKeys: Key[] = [
  [0.15, P2.doorX, P2.front],
  [0.85, P2.doorX, P2.inside],
  [1.0, P2.doorX, P2.inside],
  [1.7, P2.doorX, P2.front],
  [1.85, P2.doorX, P2.front],
  [2.55, P2.doorX, P2.inside],
  [2.7, P2.doorX, P2.inside],
  [3.35, P2.doorX, P2.front],
]
const customerKeys: Key[] = [
  [0.72, P2.customer, P2.front],
  [1.0, P2.customerUp, P2.front],
  [1.3, P2.customerUp, P2.front],
  [1.6, P2.customer, P2.front],
  [2.42, P2.customer, P2.front],
  [2.7, P2.customerUp, P2.front],
  [2.9, P2.customerUp, P2.front],
  [3.2, P2.customer, P2.front],
  [4.75, P2.customer, P2.front],
  [5.15, P2.customerBack, P2.front],
  [8.3, P2.customerBack, P2.front],
  [8.85, P2.customer, P2.front],
]
/* the crowd: each walks in from the left along the front line, the farthest slot first so nobody passes anyone
   already standing; they leave nearest-the-edge first */
const crowdKeys: Key[][] = [
  [[3.3, P2.off, P2.front], [4.9, P2.slots[0], P2.front], [7.5, P2.slots[0], P2.front], [8.88, P2.off, P2.front]],
  [[3.6, P2.off, P2.front], [4.95, P2.slots[1], P2.front], [7.25, P2.slots[1], P2.front], [8.35, P2.off, P2.front]],
  [[3.9, P2.off, P2.front], [5.0, P2.slots[2], P2.front], [7.0, P2.slots[2], P2.front], [7.9, P2.off, P2.front]],
]
const organiserKeys: Key[] = [[4.6, P2.off, P2.orgZ], [5.4, P2.orgX, P2.orgZ], [6.8, P2.orgX, P2.orgZ], [7.5, P2.off, P2.orgZ]]
/** the organiser rallies the crowd: his screen-right arm raised high over his own head, pumping (kept above him so it
    never crosses the man beside him) */
const pointing = (c: number) => win(c, 5.35, 6.75, 0.2)
/** the flood: how hard the entrance / rack is hit (0 calm, 1 crowded) */
const flood = (c: number) => seg(c, 4.6, 5.3) * (1 - seg(c, 7.1, 7.9))
/** the doors slide open while the man passes the threshold */
function doorOpen(c: number) {
  const b = along(c, blockerKeys)
  return clamp01((0.0 - b.z) / 0.6) * clamp01((b.z - (P2.inside - 0.1)) / 0.3 + 0.6)
}

function setupT02Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF0F8')
  frame2(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P2.wallZ
  const stone = mat('#EDE6DA', { roughness: 0.92, emissive: new THREE.Color('#EDE6DA'), emissiveIntensity: 0.3 })
  const trim = mat('#3A4256', { roughness: 0.45, metalness: 0.35 })
  const glass = new THREE.MeshStandardMaterial({ color: '#BFD7F2', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.38, depthWrite: false })
  const sheen = canvasTex(128, 96, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 96)
    gr.addColorStop(0, '#6F8DBA')
    gr.addColorStop(1, '#3E5C8C')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 96)
    g.fillStyle = 'rgba(255,255,255,0.22)'
    g.beginPath()
    g.moveTo(18, 96)
    g.lineTo(58, 0)
    g.lineTo(80, 0)
    g.lineTo(40, 96)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.12)'
    g.beginPath()
    g.moveTo(62, 96)
    g.lineTo(96, 0)
    g.lineTo(106, 0)
    g.lineTo(72, 96)
    g.fill()
  })
  const darkGlass = mat('#ffffff', { map: sheen, roughness: 0.15, metalness: 0.2, emissive: new THREE.Color('#2B4A7A'), emissiveIntensity: 0.15 })

  /* the plaza in front */
  const fl = flat(mesh(new THREE.PlaneGeometry(9, 6), mat('#ffffff', { map: pavingTex('#E2DCD2', '#CFC6B8', [9, 6]), roughness: 0.85 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  /* the facade: stone around the entrance opening */
  const x0 = P2.doorX - P2.doorW / 2
  const x1 = P2.doorX + P2.doorW / 2
  const part = (a: number, b: number, y0: number, y1: number) => scene.add(flat(box(b - a, y1 - y0, 0.14, stone, [(a + b) / 2, (y0 + y1) / 2, wz - 0.07])))
  part(-4.4, x0 - 0.04, 0, 3.6)
  part(x1 + 0.04, 4.4, 0, 3.6)
  part(x0 - 0.06, x1 + 0.06, P2.doorH, 3.6)
  /* display windows, dark glass in thin frames */
  for (const [cx, w] of [[-1.35, 1.8], [2.55, 1.0]] as const) {
    scene.add(flat(box(w, 1.45, 0.02, darkGlass, [cx, 1.25, wz + 0.01])))
    scene.add(box(w + 0.08, 0.06, 0.08, trim, [cx, 0.5, wz + 0.03]), box(w + 0.08, 0.06, 0.08, trim, [cx, 2.0, wz + 0.03]))
  }
  /* the upper storey: a row of office windows above the canopy */
  for (const cx of [-2.45, -1.35, -0.25, 0.9, 2.05, 3.15]) {
    scene.add(flat(box(0.78, 0.55, 0.02, darkGlass, [cx, 3.2, wz + 0.01])))
    scene.add(box(0.84, 0.05, 0.06, trim, [cx, 2.9, wz + 0.02]))
  }
  /* the entrance frame and canopy */
  scene.add(box(0.08, P2.doorH, 0.18, trim, [x0 - 0.02, P2.doorH / 2, wz + 0.02]), box(0.08, P2.doorH, 0.18, trim, [x1 + 0.02, P2.doorH / 2, wz + 0.02]))
  scene.add(box(P2.doorW + 0.12, 0.1, 0.18, trim, [P2.doorX, P2.doorH + 0.05, wz + 0.02]))
  scene.add(box(2.2, 0.12, 0.95, mat('#2F3B57', { roughness: 0.4, metalness: 0.3 }), [P2.doorX, 2.62, wz + 0.42], 0.03))
  const canopyLight = glow('#FFE3A6', '#FFF6E2')
  scene.add(flat(box(1.6, 0.02, 0.5, canopyLight, [P2.doorX, 2.555, wz + 0.42])))
  canopyLight.emissiveIntensity = 0.7
  /* the lobby inside: floor, side walls, back wall, a warm ceiling light */
  const lobbyM = mat('#F6EFE2', { roughness: 0.9, emissive: new THREE.Color('#F6EFE2'), emissiveIntensity: 0.35 })
  scene.add(flat(box(P2.doorW + 0.6, 0.02, 1.9, mat('#D9CDBA', { roughness: 0.7 }), [P2.doorX, 0.01, wz - 0.95])))
  scene.add(flat(box(P2.doorW + 0.6, 2.4, 0.05, lobbyM, [P2.doorX, 1.2, wz - 1.9])))
  for (const sx of [x0 - 0.3, x1 + 0.3]) {
    const s = flat(mesh(new THREE.PlaneGeometry(1.9, 2.4), lobbyM, [sx, 1.2, wz - 0.95]))
    s.rotation.y = sx < P2.doorX ? Math.PI / 2 : -Math.PI / 2
    scene.add(s)
  }
  const lobbyLight = new THREE.PointLight(0xffe2b0, 2.2, 3.2, 1.3)
  lobbyLight.position.set(P2.doorX, 2.1, wz - 0.9)
  scene.add(lobbyLight)
  /* the sliding glass doors: two leaves that part sideways */
  const leaves = [-1, 1].map((s) => {
    const g = new THREE.Group()
    const lw = P2.doorW / 2 - 0.02
    g.add(flat(box(lw, P2.doorH - 0.06, 0.03, glass, [0, (P2.doorH - 0.06) / 2, 0])))
    g.add(box(lw, 0.05, 0.05, trim, [0, 0.03, 0]), box(lw, 0.05, 0.05, trim, [0, P2.doorH - 0.08, 0]))
    g.add(box(0.04, P2.doorH - 0.06, 0.05, trim, [(s * lw) / 2, (P2.doorH - 0.06) / 2, 0]))
    g.add(box(0.035, 0.4, 0.04, mat(C.steel, { metalness: 0.7, roughness: 0.25 }), [(-s * lw) / 2 + s * 0.06, 1.05, 0.04]))
    scene.add(g)
    return { g, s, lw }
  })
  /* people */
  const bCfg = who(CAST_PRESETS.kabir, { hair: { style: 'curly', color: '#262B43' }, outfit: { top: 'hoodie', topColor: '#6B7488', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' } })
  const cCfg = who(CAST_PRESETS.meera, { outfit: { top: 'blouse', topColor: '#14A3A8', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' } })
  const oCfg = who(CAST_PRESETS.rohan, { outfit: { top: 'shirt', topColor: '#2F3B57', bottom: 'trousers', bottomColor: '#1F2433', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', beard: 'short', watch: true } })
  const k1Cfg = who(CAST_PRESETS.dev, { outfit: { top: 'tshirt', topColor: '#E5484D', bottom: 'jeans', bottomColor: '#25366E', shoeColor: '#2A2A30' }, accessories: { glasses: 'none' } })
  const k2Cfg = who(CAST_PRESETS.ananya, { outfit: { top: 'hoodie', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#1F2A4A', shoeColor: '#F2F2F5' } })
  const k3Cfg = who(CAST_PRESETS.arjun, { hair: { style: 'buzz', color: '#2A2324' }, outfit: { top: 'polo', topColor: '#22A06B', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#5A3A2A' } })

  const blocker = person({
    config: bCfg,
    seed: 161,
    faces: [[0, 'grin'], [3.4, 'excited'], [5.2, 'grin'], [8.6, 'grin']],
    pose: (p, c) => {
      const b = along(c, blockerKeys)
      walkPose(p, c, b.walking, b.dir)
      /* in the doorway he spreads his arms a little: in the way */
      const stand = 1 - b.walking
      to(p, 'shoulderL', 22, stand * win(c, 1.65, 1.95, 0.1))
      to(p, 'shoulderR', 22, stand * win(c, 1.65, 1.95, 0.1))
      to(p, 'headTurn', 0.35, win(c, 1.65, 1.95, 0.1) + win(c, 3.3, 3.6, 0.1))
    },
    height: 1.74,
    redraw,
  })
  const customer = person({
    config: cCfg,
    dress: withNeck(BAG_STRAP('#8C5E38')),
    seed: 162,
    faces: [[0, 'neutral'], [0.75, 'happy'], [1.25, 'worried'], [2.45, 'happy'], [2.88, 'worried'], [4.7, 'shocked'], [5.6, 'worried'], [8.3, 'neutral']],
    pose: (p, c) => {
      const s = along(c, customerKeys)
      walkPose(p, c, s.walking, 0)
      /* she looks at the entrance (screen left) */
      to(p, 'headTurn', -0.4, 1)
      to(p, 'lookX', -0.85, 1)
      /* pushed back: hands up a little */
      const pushed = win(c, 4.8, 6.6, 0.3)
      to(p, 'shoulderL', 30, pushed)
      to(p, 'elbowL', 70, pushed)
      to(p, 'shoulderR', 18, pushed)
    },
    height: 1.64,
    redraw,
  })
  const organiser = person({
    config: oCfg,
    seed: 163,
    faces: [[0, 'neutral'], [5.3, 'angry'], [6.8, 'neutral']],
    pose: (p, c) => {
      const o = along(c, organiserKeys)
      walkPose(p, c, o.walking, o.dir)
      const pt = pointing(c)
      /* the screen-right arm out toward the entrance, pumping on each order */
      to(p, 'shoulderR', 168 + 6 * Math.sin(TAU * 2.2 * c), pt)
      to(p, 'elbowR', 14 + 10 * Math.sin(TAU * 2.2 * c + 0.6), pt)
      to(p, 'fR1', 0, pt)
      to(p, 'fR2', 1, pt)
      to(p, 'fR3', 1, pt)
      to(p, 'fR4', 1, pt)
      to(p, 'headTurn', 0.45, pt)
      to(p, 'lookX', 0.9, pt)
    },
    height: 1.8,
    frames: 72,
    redraw,
  })
  const crowd = [k1Cfg, k2Cfg, k3Cfg].map((cfg, i) =>
    person({
      config: cfg,
      seed: 170 + i,
      faces: [[0, 'neutral'], [4.6, i === 1 ? 'excited' : 'grin'], [7.0, 'neutral']],
      pose: (p, c) => {
        const k = along(c, crowdKeys[i])
        walkPose(p, c, k.walking, k.dir)
        /* standing at the entrance: facing it, jostling */
        const at = win(c, crowdKeys[i][1][0], crowdKeys[i][2][0], 0.15) * (1 - k.walking)
        to(p, 'headTurn', 0.3, at)
        to(p, 'lookX', 0.7, at)
        to(p, 'shoulderR', 26 + 8 * Math.sin(TAU * 1.5 * c + i), at)
        to(p, 'elbowR', 40, at)
      },
      height: [1.76, 1.62, 1.72][i],
      frames: 72,
      redraw,
    }),
  )
  scene.add(blocker.object, customer.object, organiser.object, ...crowd.map((s) => s.object))

  return (t) => {
    const c = mod(t, L)
    const op = doorOpen(c)
    leaves.forEach((l) => l.g.position.set(P2.doorX + l.s * (l.lw / 2 + 0.01 + op * (l.lw - 0.06)), 0, wz + 0.05))
    const place = (s: Sprite, q: { x: number; z: number; walking: number }) => {
      s.object.visible = q.x > P2.off + 0.05
      s.object.position.set(q.x, bob(q.walking, c), q.z)
      s.update(c, camera)
    }
    place(blocker, along(c, blockerKeys))
    place(customer, along(c, customerKeys))
    place(organiser, along(c, organiserKeys))
    crowd.forEach((s, i) => place(s, along(c, crowdKeys[i])))
  }
}

/* ------------------------------------------------------------------ T02 concept: the server room */

/** a small laptop on a pedestal, screen toward the rack; returns the screen material */
function laptopOn(scene: THREE.Scene, x: number, z: number, screenC: string, body = '#2E3A55') {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.add(box(0.42, 0.78, 0.36, mat('#C9D3E6', { roughness: 0.5 }), [0, 0.39, 0], 0.03))
  g.add(box(0.46, 0.03, 0.32, mat(body, { roughness: 0.35, metalness: 0.4 }), [0, 0.795, 0.02], 0.01))
  const scr = glow(screenC, '#1B2A55')
  const lid = new THREE.Group()
  lid.position.set(0, 0.81, -0.13)
  lid.rotation.x = -0.32
  lid.add(box(0.46, 0.3, 0.02, mat(body, { roughness: 0.35, metalness: 0.4 }), [0, 0.15, 0], 0.01))
  lid.add(box(0.4, 0.25, 0.005, scr, [0, 0.15, 0.012]))
  g.add(lid)
  scene.add(g)
  return scr
}

function setupT02Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#E8EEFB')
  frame2(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P2.wallZ
  const fl = flat(mesh(new THREE.PlaneGeometry(9, 6), mat('#ffffff', { map: pavingTex('#E1E8F5', '#CBD6EA', [9, 6]), roughness: 0.8 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  scene.add(flat(box(8.8, 3.6, 0.12, mat('#EEF2FA', { roughness: 0.9, emissive: new THREE.Color('#EEF2FA'), emissiveIntensity: 0.4 }), [0, 1.8, wz - 0.06])))
  scene.add(box(8.8, 0.08, 0.04, mat('#C9D3E6'), [0, 0.04, wz + 0.02]))

  /* the server rack at the entrance's place, its status beacon on top */
  const rx = P2.doorX
  const rack = new THREE.Group()
  rack.position.set(rx, 0, wz + 0.25)
  rack.add(box(1.05, 2.05, 0.6, mat(C.navy, { roughness: 0.45, metalness: 0.25 }), [0, 1.025, 0], 0.03))
  const leds: THREE.MeshStandardMaterial[] = []
  for (let k = 0; k < 7; k++) {
    rack.add(box(0.9, 0.2, 0.02, mat('#2A3A70', { roughness: 0.4 }), [0, 0.32 + k * 0.25, 0.31]))
    for (let j = 0; j < 3; j++) {
      const m = glow('#6EE7B7', '#14301F')
      rack.add(box(0.05, 0.03, 0.01, m, [-0.36 + j * 0.08, 0.32 + k * 0.25, 0.325]))
      leds.push(m)
    }
    rack.add(box(0.36, 0.035, 0.01, mat('#4C64A8'), [0.18, 0.32 + k * 0.25, 0.325]))
  }
  const beacon = glow(C.green, '#FFFFFF', { roughness: 0.25 })
  rack.add(cyl(0.11, 0.13, 0.08, mat('#3A4256'), [0, 2.09, 0]))
  rack.add(mesh(new THREE.SphereGeometry(0.12, 24, 16, 0, TAU, 0, Math.PI / 2), beacon, [0, 2.13, 0]))
  const beaconLight = new THREE.PointLight(C.green, 0.8, 2.2, 1.4)
  beaconLight.position.set(0, 2.35, 0.2)
  rack.add(beaconLight)
  scene.add(rack)

  /* the attacker's laptop in the doorway's place, the user's laptop where the customer stands */
  const atkScr = laptopOn(scene, rx, P2.front, C.orange, '#3B2A2A')
  const usrScr = laptopOn(scene, P2.customer, P2.front, '#7FB0FF')
  atkScr.emissiveIntensity = 0.9
  usrScr.emissiveIntensity = 0.7

  /* three compromised devices on pedestals, where the crowd stands: a camera, a router, a phone; each pops up as its
     person arrives and sinks as its person leaves */
  const devices: THREE.Group[] = []
  const devLeds: THREE.MeshStandardMaterial[] = []
  const devMat = mat('#E9EEF7', { roughness: 0.45 })
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group()
    g.position.set(P2.slots[i], 0, P2.front)
    g.add(box(0.4, 0.72, 0.34, mat('#C9D3E6', { roughness: 0.5 }), [0, 0.36, 0], 0.03))
    const led = glow(C.orange, '#3A1E10')
    devLeds.push(led)
    if (i === 0) {
      /* a security camera on a short arm */
      g.add(box(0.06, 0.2, 0.06, mat('#8792A8', { metalness: 0.5 }), [0, 0.82, -0.05]))
      const cam = box(0.3, 0.16, 0.18, devMat, [0.04, 0.96, 0.02], 0.04)
      cam.rotation.y = 0.5
      g.add(cam)
      g.add(cyl(0.05, 0.05, 0.03, mat('#1B2238'), [0.13, 0.96, 0.1]).rotateX(Math.PI / 2))
      g.add(mesh(new THREE.SphereGeometry(0.018, 10, 8), led, [-0.06, 1.02, 0.11]))
    } else if (i === 1) {
      /* a home router with two antennas */
      g.add(box(0.34, 0.08, 0.22, devMat, [0, 0.77, 0], 0.03))
      for (const ax of [-0.12, 0.12]) g.add(cyl(0.012, 0.012, 0.24, mat('#3A4256'), [ax, 0.93, -0.08]))
      for (let k = 0; k < 3; k++) g.add(mesh(new THREE.SphereGeometry(0.014, 10, 8), k === 0 ? led : glow('#6EE7B7', '#14301F'), [-0.08 + k * 0.06, 0.78, 0.115]))
    } else {
      /* a phone on a stand */
      g.add(box(0.12, 0.05, 0.12, mat('#3A4256'), [0, 0.745, 0]))
      const ph = box(0.13, 0.24, 0.015, mat('#1B1F2E', { roughness: 0.35 }), [0, 0.89, 0.02], 0.012)
      ph.rotation.x = -0.15
      g.add(ph)
      const s = box(0.11, 0.2, 0.004, led, [0, 0.89, 0.03])
      s.rotation.x = -0.15
      g.add(s)
    }
    scene.add(g)
    devices.push(g)
  }
  /* the command-and-control server where the organiser stands, with an antenna and its order rings */
  const c2 = new THREE.Group()
  c2.position.set(P2.orgX, 0, P2.orgZ)
  c2.add(box(0.5, 1.05, 0.5, mat('#1F2433', { roughness: 0.4, metalness: 0.3 }), [0, 0.525, 0], 0.03))
  for (let k = 0; k < 4; k++) c2.add(box(0.4, 0.04, 0.01, mat('#3A4256'), [0, 0.3 + k * 0.18, 0.255]))
  const c2Led = glow(C.red, '#3A1414')
  c2.add(mesh(new THREE.SphereGeometry(0.03, 12, 10), c2Led, [0.15, 0.95, 0.26]))
  c2.add(cyl(0.015, 0.015, 0.5, mat('#8792A8', { metalness: 0.6 }), [0, 1.3, 0]))
  c2.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), c2Led, [0, 1.56, 0]))
  scene.add(c2)
  const ringMat = new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  const rings = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 48), ringMat.clone())
    r.rotation.y = Math.PI / 2
    scene.add(r)
    return r
  })

  /* the streams: packets from the attacker laptop each time the man goes in (phase 1) and throughout the flood; the
     user's requests out to the rack and back, refused; the devices' floods */
  const orange = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false })
  const blue = new THREE.MeshBasicMaterial({ color: '#3B7BFF', toneMapped: false })
  const rackIn = (dx: number) => new THREE.Vector3(rx + dx, 1.25, wz + 0.6)
  const atkFrom = new THREE.Vector3(rx, 1.0, P2.front - 0.05)
  const usrFrom = new THREE.Vector3(P2.customer - 0.1, 1.0, P2.front - 0.05)
  const streams: Stream[] = [
    { from: atkFrom, to: rackIn(0), t0: 0.1, t1: 0.95, dt: 0.12, travel: 0.5, m: orange, lift: 0.1 },
    { from: atkFrom, to: rackIn(0), t0: 1.8, t1: 2.65, dt: 0.12, travel: 0.5, m: orange, lift: 0.1 },
    { from: atkFrom, to: rackIn(0), t0: 4.6, t1: 7.2, dt: 0.16, travel: 0.5, m: orange, lift: 0.1 },
    { from: usrFrom, to: rackIn(0.35), t0: 0.8, t1: 0.81, dt: 1, travel: 0.9, bounce: true, m: blue, r: 0.07 },
    { from: usrFrom, to: rackIn(0.35), t0: 2.5, t1: 2.51, dt: 1, travel: 0.9, bounce: true, m: blue, r: 0.07 },
    { from: usrFrom, to: rackIn(0.35), t0: 5.6, t1: 7.0, dt: 0.7, travel: 0.9, bounce: true, m: blue, r: 0.07 },
    ...P2.slots.map((sx, i) => ({ from: new THREE.Vector3(sx, 1.0, P2.front), to: rackIn(-0.3 + i * 0.05), t0: crowdKeys[i][1][0], t1: crowdKeys[i][2][0] - 0.4, dt: 0.13 + i * 0.02, travel: 0.7 + i * 0.12, m: orange, lift: 0.35 + i * 0.1 })),
  ]
  const pool = packetPool(scene, 64)
  const green = new THREE.Color(C.green)
  const amber = new THREE.Color(C.orange)

  return (t) => {
    const c = mod(t, L)
    const f = flood(c)
    /* the beacon: green, flickering to orange under each phase-1 burst, orange through the flood */
    const burst = Math.max(win(c, 0.3, 0.95, 0.15), win(c, 2.0, 2.65, 0.15)) * 0.45
    const hot = Math.max(f, burst)
    beacon.emissive.copy(green).lerp(amber, hot)
    beacon.color.copy(beacon.emissive)
    beacon.emissiveIntensity = 0.9 + 0.8 * hot * (0.6 + 0.4 * Math.sin(TAU * 4 * c))
    beaconLight.color.copy(beacon.emissive)
    beaconLight.intensity = 0.8 + 1.4 * hot
    leds.forEach((m, k) => {
      m.emissive.copy(green).lerp(amber, f)
      m.emissiveIntensity = 0.5 + 0.9 * Math.max(0, Math.sin(TAU * (1.5 + 5 * hot) * c + k * 1.7))
    })
    /* under the flood the rack trembles */
    rack.position.x = rx + 0.012 * f * Math.sin(TAU * 11 * c)
    usrScr.emissiveIntensity = 0.7
    /* devices pop up as their people arrive, sink as they leave */
    devices.forEach((g, i) => {
      const [, a, b, d] = crowdKeys[i]
      const up = seg(c, a[0] - 0.55, a[0]) * (1 - seg(c, b[0], b[0] + 0.5))
      g.visible = up > 0.01 && d[0] > 0
      g.scale.set(1, Math.max(0.001, up), 1)
      devLeds[i].emissiveIntensity = up * (0.6 + 0.8 * Math.max(0, Math.sin(TAU * 3 * c + i)))
    })
    const cUp = seg(c, organiserKeys[0][0], organiserKeys[1][0]) * (1 - seg(c, organiserKeys[2][0], organiserKeys[3][0]))
    c2.visible = cUp > 0.01
    c2.scale.set(1, Math.max(0.001, cUp), 1)
    c2Led.emissiveIntensity = cUp * (0.6 + 0.9 * Math.max(0, Math.sin(TAU * 2.2 * c)))
    /* the orders: rings that leave the antenna and travel toward the devices */
    const pt = pointing(c)
    rings.forEach((r, k) => {
      const u = mod(c * 1.1 + k / 3, 1)
      r.position.set(lerp(P2.orgX + 0.15, P2.slots[2] + 0.3, u), lerp(1.56, 1.1, u), lerp(P2.orgZ, P2.front, u))
      r.scale.setScalar(0.5 + 1.2 * u)
      ;(r.material as THREE.MeshBasicMaterial).opacity = pt * (1 - u) * 0.8
      r.visible = pt > 0.01
    })
    pool(c, streams)
  }
}

/* ================================================================== T13 · a shop door left unlocked */

const HOLD13 = 4.45 /* the first passer-by coming out with a box, the door open, the owner gone */
const P13 = {
  wallZ: -1.2,
  doorX: 0.3,
  doorW: 0.92,
  doorH: 2.05,
  front: 0.3,
  ownerX: 1.05,
  aX: 1.05,
  bX: -0.48,
  inZ: -2.05,
  sill: -0.45,
  offR: 3.85,
  offL: -3.85,
}
const ownerKeys: Key[] = [[0.35, P13.ownerX, P13.front], [1.6, P13.offR, P13.front], [7.5, P13.offR, P13.front], [8.75, P13.ownerX, P13.front]]
const aKeys: Key[] = [
  [1.7, P13.offR, P13.front],
  [2.9, P13.aX, P13.front],
  [3.15, P13.aX, P13.front],
  [3.45, P13.doorX, P13.sill],
  [3.75, P13.doorX, P13.inZ],
  [4.15, P13.doorX, P13.inZ],
  [4.45, P13.doorX, P13.sill],
  [4.7, P13.aX, P13.front],
  [5.9, P13.offR, P13.front],
]
const bKeys: Key[] = [
  [4.0, P13.offL, P13.front],
  [5.2, P13.bX, P13.front],
  [5.45, P13.doorX, P13.sill],
  [5.75, P13.doorX, P13.inZ],
  [6.15, P13.doorX, P13.inZ],
  [6.45, P13.doorX, P13.sill],
  [6.7, P13.bX, P13.front],
  [7.9, P13.offL, P13.front],
]
/** the door / lid: shut, drifting ajar when the owner has gone (it was never locked), wide while someone goes in */
function doorAngle13(c: number) {
  const ajar = 0.32 * seg(c, 1.6, 2.05) * (1 - seg(c, 8.55, 8.95))
  const wide = 1.25 * Math.max(seg(c, 3.05, 3.35) * (1 - seg(c, 6.55, 7.0)), 0)
  return Math.max(ajar, wide)
}
/* when each passer-by takes the thing, and how long it is carried */
const TAKE = [{ at: 3.95, out: 5.9 }, { at: 5.95, out: 7.9 }]
const restock = (c: number) => seg(c, 8.5, 8.95)

function setupT13Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F3EFE8')
  frame13(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P13.wallZ
  const fl = flat(mesh(new THREE.PlaneGeometry(9, 6), mat('#ffffff', { map: pavingTex('#DCD5CA', '#C8BEB0', [9, 6]), roughness: 0.85 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)

  /* the facade: cream shop front between two brick-red neighbours, a window, the door and a striped awning */
  const cream = mat('#F6EAD3', { roughness: 0.92, emissive: new THREE.Color('#F6EAD3'), emissiveIntensity: 0.3 })
  const brick = mat('#C98F6E', { roughness: 0.95, emissive: new THREE.Color('#C98F6E'), emissiveIntensity: 0.15 })
  const wood = mat('#8A5A3B', { roughness: 0.55 })
  const trim = mat('#5B3B26', { roughness: 0.5 })
  const dx0 = P13.doorX - P13.doorW / 2
  const dx1 = P13.doorX + P13.doorW / 2
  const win0 = -2.25
  const win1 = -0.55
  const part = (a: number, b: number, y0: number, y1: number, m: THREE.Material) => scene.add(flat(box(b - a, y1 - y0, 0.14, m, [(a + b) / 2, (y0 + y1) / 2, wz - 0.07])))
  part(-4.4, -2.55, 0, 3.6, brick)
  part(1.5, 4.4, 0, 3.6, brick)
  part(-2.55, win0, 0, 3.6, cream)
  part(win0, win1, 0, 0.55, cream)
  part(win0, win1, 1.9, 3.6, cream)
  part(win1, dx0, 0, 3.6, cream)
  part(dx0, dx1, P13.doorH, 3.6, cream)
  part(dx1, 1.5, 0, 3.6, cream)
  /* the window glass and frame */
  scene.add(flat(box(win1 - win0, 1.35, 0.02, new THREE.MeshStandardMaterial({ color: '#CFE3F7', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.25, depthWrite: false }), [(win0 + win1) / 2, 1.225, wz + 0.01])))
  scene.add(box(win1 - win0 + 0.1, 0.07, 0.12, trim, [(win0 + win1) / 2, 0.55, wz + 0.03]), box(win1 - win0 + 0.1, 0.07, 0.12, trim, [(win0 + win1) / 2, 1.9, wz + 0.03]))
  scene.add(box(0.06, 1.4, 0.12, trim, [win0, 1.225, wz + 0.03]), box(0.06, 1.4, 0.12, trim, [win1, 1.225, wz + 0.03]))
  /* the door frame */
  scene.add(box(0.08, P13.doorH + 0.05, 0.16, trim, [dx0 - 0.04, (P13.doorH + 0.05) / 2, wz + 0.02]), box(0.08, P13.doorH + 0.05, 0.16, trim, [dx1 + 0.04, (P13.doorH + 0.05) / 2, wz + 0.02]))
  scene.add(box(P13.doorW + 0.16, 0.08, 0.16, trim, [P13.doorX, P13.doorH + 0.04, wz + 0.02]))
  /* the sign band, blank (no words on an analogy card) */
  scene.add(box(3.6, 0.42, 0.06, mat('#2F7A5A', { roughness: 0.6 }), [-0.55, 2.82, wz + 0.04], 0.03))
  /* the striped awning, sloping out over the window and the door */
  const stripes = canvasTex(160, 40, (g) => {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? '#FFFFFF' : '#E8642A'
      g.fillRect(i * 16, 0, 16, 40)
    }
  })
  const awning = mesh(new THREE.BoxGeometry(3.7, 0.04, 0.85), mat('#ffffff', { map: stripes, roughness: 0.75 }), [-0.55, 2.38, wz + 0.4])
  awning.rotation.x = 0.32
  scene.add(awning)
  scene.add(box(3.7, 0.12, 0.03, mat('#E8642A', { roughness: 0.7 }), [-0.55, 2.18, wz + 0.82]))

  /* inside: floor, warm walls, a light, and shelves full of goods along the back */
  const inner = mat('#FBEBD3', { roughness: 0.9, emissive: new THREE.Color('#FBEBD3'), emissiveIntensity: 0.4 })
  scene.add(flat(box(3.8, 0.02, 1.7, mat('#C9A27A', { roughness: 0.7 }), [-0.55, 0.01, wz - 0.85])))
  scene.add(flat(box(3.8, 2.6, 0.05, inner, [-0.55, 1.3, wz - 1.72])))
  for (const sx of [-2.45, 1.35]) {
    const s = flat(mesh(new THREE.PlaneGeometry(1.7, 2.6), inner, [sx, 1.3, wz - 0.85]))
    s.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2
    scene.add(s)
  }
  const shopLight = new THREE.PointLight(0xffd9a0, 3.2, 4.5, 1.2)
  shopLight.position.set(-0.4, 2.2, wz - 0.9)
  scene.add(shopLight)
  const shZ = wz - 1.48
  const shelfM = mat('#B98A5C', { roughness: 0.7 })
  for (const y of [0.55, 1.0, 1.45, 1.9]) scene.add(box(3.6, 0.04, 0.36, shelfM, [-0.55, y, shZ]))
  for (const x of [-2.3, -0.55, 1.2]) scene.add(box(0.05, 1.9, 0.36, shelfM, [x, 0.95, shZ]))
  const goods = ['#E5484D', '#F2C14E', '#2D63FB', '#22A06B', '#FF8A3D', '#7C5CE0', '#14B8A6'].map((c) => mat(c, { roughness: 0.5 }))
  const jarGlass = mat('#CFE3F7', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })
  ;[0.55, 1.0, 1.45].forEach((y, li) => {
    let x = -2.22
    let n = 0
    while (x < 1.1) {
      if (Math.abs(x + 0.55) < 0.07) {
        x += 0.1
        continue
      }
      const c = goods[(n * 3 + li * 5) % goods.length]
      if ((n + li) % 3 === 2) {
        scene.add(cyl(0.07, 0.07, 0.2, jarGlass, [x + 0.07, y + 0.12, shZ + 0.02], 18), cyl(0.073, 0.073, 0.04, c, [x + 0.07, y + 0.24, shZ + 0.02], 18))
        x += 0.19
      } else {
        const w = 0.13 + ((n * 7) % 3) * 0.02
        const hh = 0.24 + ((n * 5 + li) % 3) * 0.04
        /* leave room for the two things that get taken (in front of the door) */
        if (!(li === 1 && x > 0.05 && x < 0.55) && !(li === 0 && x > 0.0 && x < 0.5)) scene.add(box(w, hh, 0.2, c, [x + w / 2, y + 0.02 + hh / 2, shZ + 0.02], 0.012))
        x += w + 0.04
      }
      n++
    }
  })
  /* the two goods that walk out of the door: a red box (passer-by A) and a honey jar (passer-by B) */
  const takenBox = box(0.28, 0.24, 0.2, goods[0], [0, 0, 0], 0.02)
  const jar = new THREE.Group()
  jar.add(cyl(0.085, 0.085, 0.22, mat('#F2B33D', { roughness: 0.25, transparent: true, opacity: 0.92 }), [0, 0, 0], 20), cyl(0.09, 0.09, 0.05, mat('#C0392B'), [0, 0.13, 0], 20))
  scene.add(takenBox, jar)
  const shelfSpot = [new THREE.Vector3(0.32, 1.0 + 0.14, shZ + 0.04), new THREE.Vector3(0.24, 0.55 + 0.13, shZ + 0.04)]

  /* the door: a wooden leaf with a glass panel, hinged on the left, swinging into the shop */
  const hinge = new THREE.Group()
  hinge.position.set(dx0, 0, wz + 0.02)
  const lw = P13.doorW - 0.02
  hinge.add(box(lw, P13.doorH - 0.02, 0.06, wood, [lw / 2 + 0.01, (P13.doorH - 0.02) / 2, 0], 0.012))
  hinge.add(flat(box(lw - 0.26, 0.8, 0.02, new THREE.MeshStandardMaterial({ color: '#CFE3F7', roughness: 0.06, transparent: true, opacity: 0.45 }), [lw / 2 + 0.01, 1.45, 0.035])))
  hinge.add(box(0.06, 0.2, 0.03, mat(C.brass, { metalness: 0.7, roughness: 0.3 }), [lw - 0.09, 1.0, 0.045], 0.01))
  hinge.add(box(0.11, 0.025, 0.03, mat(C.brass, { metalness: 0.7, roughness: 0.3 }), [lw - 0.13, 1.05, 0.07], 0.01))
  scene.add(hinge)

  /* people: the owner (an older shopkeeper in his apron), passer-by A (a young man), passer-by B (a young woman) */
  const ownCfg = who(CAST_PRESETS.rohan, { hair: { style: 'short', color: 'grey' }, outfit: { top: 'shirt', topColor: '#E8ECF5', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#5A3A2A' }, accessories: { glasses: 'round', beard: 'stubble', watch: true } })
  const aCfg = who(CAST_PRESETS.kabir, { hair: { style: 'quiff', color: '#2A2324' }, outfit: { top: 'tshirt', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2B2F3A', shoeColor: '#F2F2F5' } })
  const bCfg = who(CAST_PRESETS.riya, { hair: { style: 'ponytail', color: 'darkBrown' }, outfit: { top: 'kurta', topColor: '#C2477D', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' }, accessories: { earrings: true } })
  const shA = buildSkin(aCfg).shoulderHalf
  const shB = buildSkin(bCfg).shoulderHalf
  const owner = person({
    config: ownCfg,
    dress: withTop(SHOP_APRON),
    seed: 261,
    faces: [[0, 'happy'], [0.4, 'neutral'], [7.6, 'happy']],
    pose: (p, c) => {
      const o = along(c, ownerKeys)
      walkPose(p, c, o.walking, o.dir)
      /* at the start he has just pulled the door to (his screen-left hand off the handle), unaware */
      to(p, 'shoulderL', 34, win(c, 0, 0.25, 0.01) * (1 - seg(c, 0.15, 0.35)))
      to(p, 'headTurn', -0.25, win(c, 8.6, 9.0, 0.1))
    },
    height: 1.74,
    frames: 72,
    redraw,
  })
  const carrying = (i: number, c: number) => win(c, TAKE[i].at + 0.05, TAKE[i].out, 0.1)
  const passer = (cfg: CharacterConfig, keys: Key[], i: number, sh: number, seed: number, faces: [number, string][], h: number) =>
    person({
      config: cfg,
      seed,
      faces,
      pose: (p, c) => {
        const q = along(c, keys)
        const carry = carrying(i, c)
        walkPose(p, c, q.walking, q.dir, carry < 0.5)
        /* reaching up to the shelf, then both hands round the thing taken */
        const reach = win(c, TAKE[i].at - 0.25, TAKE[i].at + 0.05, 0.1)
        to(p, 'shoulderR', 70, reach)
        to(p, 'elbowR', 40, reach)
        carryPose(p, sh, carry)
        /* a glance at the open door before going in */
        const glance = win(c, keys[1][0] - 0.05, keys[2][0], 0.1)
        to(p, 'headTurn', i === 0 ? -0.45 : 0.45, glance)
        to(p, 'lookX', i === 0 ? -0.9 : 0.9, glance)
      },
      height: h,
      redraw,
    })
  const a = passer(aCfg, aKeys, 0, shA, 262, [[0, 'neutral'], [2.6, 'surprised'], [3.2, 'grin'], [4.5, 'happy'], [5.9, 'neutral']], 1.72)
  const b = passer(bCfg, bKeys, 1, shB, 263, [[0, 'neutral'], [4.9, 'surprised'], [5.3, 'grin'], [6.5, 'happy'], [7.9, 'neutral']], 1.62)
  scene.add(owner.object, a.object, b.object)
  const hands = new THREE.Vector3()
  const root = new THREE.Vector3()

  return (t) => {
    const c = mod(t, L)
    hinge.rotation.y = -doorAngle13(c)
    const place = (s: Sprite, q: { x: number; z: number; walking: number }) => {
      s.object.visible = q.x < P13.offR - 0.05 && q.x > P13.offL + 0.05
      s.object.position.set(q.x, bob(q.walking, c), q.z)
      s.update(c, camera)
    }
    place(owner, along(c, ownerKeys))
    const qa = along(c, aKeys)
    const qb = along(c, bKeys)
    place(a, qa)
    place(b, qb)
    /* the taken goods: on the shelf until taken, in the hands until gone, back on the shelf as the owner returns */
    const items: [THREE.Object3D, { x: number; z: number; walking: number }, number, number][] = [
      [takenBox, qa, 1.72, 0],
      [jar, qb, 1.62, 1],
    ]
    for (const [obj, q, h, i] of items) {
      const taken = c >= TAKE[i].at && c < TAKE[i].out + 0.05
      const gone = c >= TAKE[i].out + 0.05
      if (taken) {
        root.set(q.x, bob(q.walking, c), q.z)
        rigToWorld({ x: 200, y: 318 }, h, root, camera, hands)
        obj.position.set(hands.x, hands.y, hands.z + 0.16)
        obj.visible = true
        obj.scale.setScalar(1)
      } else {
        obj.position.copy(shelfSpot[i])
        const back = gone ? restock(c) : 1
        obj.visible = back > 0.02
        obj.scale.setScalar(Math.max(0.001, back))
      }
    }
  }
}

/* ------------------------------------------------------------------ T13 concept: the S3 bucket */

function setupT13Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E9EFFA')
  frame13(camera)
  lights(scene, [0, 1.4, -0.6])
  const wz = P13.wallZ
  const fl = flat(mesh(new THREE.PlaneGeometry(9, 6), mat('#ffffff', { map: pavingTex('#E1E8F5', '#CBD6EA', [9, 6]), roughness: 0.8 }), [0, 0, 1.6]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  scene.add(flat(box(8.8, 3.6, 0.12, mat('#EEF2FA', { roughness: 0.9, emissive: new THREE.Color('#EEF2FA'), emissiveIntensity: 0.4 }), [0, 1.8, wz - 0.06])))

  /* the globe: anyone on the internet, high on the wall behind, turning slowly */
  const land = canvasTex(256, 128, (g) => {
    g.fillStyle = '#5B8DEF'
    g.fillRect(0, 0, 256, 128)
    g.fillStyle = '#9BD17A'
    const blob = (x: number, y: number, rx: number, ry: number, r = 0) => {
      g.beginPath()
      g.ellipse(x, y, rx, ry, r, 0, TAU)
      g.fill()
    }
    blob(48, 40, 26, 18, 0.4)
    blob(62, 78, 14, 24, -0.2)
    blob(126, 36, 22, 14)
    blob(136, 70, 16, 26, 0.2)
    blob(190, 42, 34, 18, -0.1)
    blob(206, 88, 14, 10)
    blob(248, 44, 10, 8)
  })
  land.wrapS = THREE.RepeatWrapping
  const globe = mesh(new THREE.SphereGeometry(0.52, 48, 32), mat('#ffffff', { map: land, roughness: 0.55 }), [-1.1, 2.45, wz + 0.15])
  globe.rotation.z = 0.35
  scene.add(globe)

  /* the bucket on its plinth at the door's place: a green S3-style pail, its lid, and objects inside */
  const bx = P13.doorX
  const bz = -0.55
  const plinth = box(1.25, 0.62, 0.95, mat('#F4F7FC', { roughness: 0.5 }), [bx, 0.31, bz], 0.05)
  scene.add(plinth)
  const mark = flat(mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: markTex(bucketUrl, redraw), transparent: true, toneMapped: false }), [bx, 0.33, bz + 0.48]))
  scene.add(mark)
  const pailM = mat(C.s3, { roughness: 0.4, metalness: 0.1 })
  const pailIn = mat('#5E7F10', { roughness: 0.6, side: THREE.BackSide })
  const pail = new THREE.Group()
  pail.position.set(bx, 0.62, bz)
  pail.add(mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.72, 40, 1, true), pailM, [0, 0.36, 0]))
  pail.add(mesh(new THREE.CylinderGeometry(0.495, 0.375, 0.71, 40, 1, true), pailIn, [0, 0.36, 0]))
  pail.add(mesh(new THREE.CircleGeometry(0.38, 40).rotateX(-Math.PI / 2), mat('#5E7F10'), [0, 0.01, 0]))
  pail.add(mesh(new THREE.TorusGeometry(0.5, 0.025, 10, 48).rotateX(Math.PI / 2), mat('#6A8F12', { roughness: 0.35 }), [0, 0.72, 0]))
  scene.add(pail)
  /* the objects inside: white cubes with the S3 object mark, their tops above the rim */
  const objTex = markTex(objectUrl, redraw, 256)
  const cubeM = [mat('#FFFFFF', { roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: objTex, roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 })]
  const cubeAt: THREE.Vector3Tuple[] = [[-0.18, 1.32, bz + 0.12], [0.16, 1.34, bz + 0.1], [-0.02, 1.36, bz - 0.14], [0.22, 1.3, bz - 0.12], [-0.24, 1.28, bz - 0.1]]
  const cubes = cubeAt.map(([x, y, z], i) => {
    const m = mesh(new RoundedBoxGeometry(0.22, 0.22, 0.22, 3, 0.03), cubeM, [bx + x, y, z])
    m.rotation.y = (i - 2) * 0.25
    scene.add(m)
    return m
  })
  /* the two that are taken, the front ones (0, 1) */
  const takenIdx = [1, 0]
  /* the lid, hinged at the back of the rim: shut, lifting open once the owner has gone (public) */
  const lidHinge = new THREE.Group()
  lidHinge.position.set(bx, 1.34, bz - 0.5)
  const lidM = mat('#6A8F12', { roughness: 0.35 })
  lidHinge.add(cyl(0.53, 0.53, 0.05, lidM, [0, 0, 0.5], 48))
  lidHinge.add(box(0.18, 0.06, 0.08, mat('#4C6A0C'), [0, 0.05, 0.85], 0.02))
  scene.add(lidHinge)
  /* a padlock that would have locked it: it hangs open on its hasp at the front of the rim */
  const lockM = mat(C.gold, { metalness: 0.6, roughness: 0.3 })
  const lock = new THREE.Group()
  lock.position.set(bx, 1.2, bz + 0.52)
  lock.add(box(0.12, 0.1, 0.05, lockM, [0, 0, 0], 0.015))
  const shackle = mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 24, Math.PI), mat('#B7C3D6', { metalness: 0.8, roughness: 0.25 }), [0.0, 0.05, 0])
  lock.add(shackle)
  scene.add(lock)

  /* people: the account owner (a woman in a blazer), two internet users */
  const ownCfg = who(CAST_PRESETS.riya, { hair: { style: 'bun', color: '#2A2324' }, outfit: { top: 'shirt', topColor: '#F4F6FB', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true } })
  const aCfg = who(CAST_PRESETS.dev, { hair: { style: 'curly', color: 'brown' }, outfit: { top: 'polo', topColor: '#14A3A8', bottom: 'jeans', bottomColor: '#25366E', shoeColor: '#F2F2F5' }, accessories: { glasses: 'none', watch: false } })
  const bCfg = who(CAST_PRESETS.ananya, { outfit: { top: 'hoodie', topColor: '#FF8A3D', bottom: 'jeans', bottomColor: '#1F2A4A', shoeColor: '#2A2A30' } })
  const shA = buildSkin(aCfg).shoulderHalf
  const shB = buildSkin(bCfg).shoulderHalf
  const owner = person({
    config: ownCfg,
    dress: withNeck(BLAZER('#26304A', '#161D30')),
    seed: 361,
    faces: [[0, 'happy'], [0.4, 'neutral'], [7.6, 'happy']],
    pose: (p, c) => {
      const o = along(c, ownerKeys)
      walkPose(p, c, o.walking, o.dir)
      to(p, 'shoulderL', 34, win(c, 0, 0.25, 0.01) * (1 - seg(c, 0.15, 0.35)))
    },
    height: 1.66,
    frames: 72,
    redraw,
  })
  const carrying = (i: number, c: number) => win(c, TAKE[i].at + 0.05, TAKE[i].out, 0.1)
  /* in the concept the users reach into the bucket from beside it rather than walking inside */
  const reachKeys = (keys: Key[], side: number): Key[] => keys.map(([t, x, z]) => (z < P13.front - 0.1 ? [t, P13.doorX + side * 0.78, -0.2] : [t, x, z]) as Key)
  const aK = reachKeys(aKeys, 1)
  const bK = reachKeys(bKeys, -1)
  const user = (cfg: CharacterConfig, keys: Key[], i: number, sh: number, seed: number, faces: [number, string][], h: number, side: number) =>
    person({
      config: cfg,
      seed,
      faces,
      pose: (p, c) => {
        const q = along(c, keys)
        const carry = carrying(i, c)
        walkPose(p, c, q.walking, q.dir, carry < 0.5)
        /* the arm nearest the bucket reaches in */
        const reach = win(c, TAKE[i].at - 0.4, TAKE[i].at + 0.05, 0.12)
        to(p, side > 0 ? 'shoulderL' : 'shoulderR', 78, reach)
        to(p, side > 0 ? 'elbowL' : 'elbowR', 24, reach)
        to(p, 'headTurn', -0.4 * side, reach)
        to(p, 'lookX', -0.85 * side, reach)
        carryPose(p, sh, carry)
      },
      height: h,
      redraw,
    })
  const a = user(aCfg, aK, 0, shA, 362, [[0, 'neutral'], [2.6, 'surprised'], [3.2, 'grin'], [4.5, 'happy'], [5.9, 'neutral']], 1.74, 1)
  const b = user(bCfg, bK, 1, shB, 363, [[0, 'neutral'], [4.9, 'surprised'], [5.3, 'grin'], [6.5, 'happy'], [7.9, 'neutral']], 1.6, -1)
  scene.add(owner.object, a.object, b.object)
  const hands = new THREE.Vector3()
  const root = new THREE.Vector3()

  return (t) => {
    const c = mod(t, L)
    globe.rotation.y = (TAU * c) / L
    const open = doorAngle13(c) / 1.25
    lidHinge.rotation.x = -1.35 * Math.min(1, open * 1.6)
    /* the padlock hangs open the whole time the lid is up, swinging a little */
    lock.rotation.z = 0.12 * Math.sin(TAU * 1.2 * c) * Math.min(1, open * 3)
    shackle.position.y = 0.05 + 0.03 * Math.min(1, open * 3)
    const place = (s: Sprite, q: { x: number; z: number; walking: number }) => {
      s.object.visible = q.x < P13.offR - 0.05 && q.x > P13.offL + 0.05
      s.object.position.set(q.x, bob(q.walking, c), q.z)
      s.update(c, camera)
    }
    place(owner, along(c, ownerKeys))
    const qa = along(c, aK)
    const qb = along(c, bK)
    place(a, qa)
    place(b, qb)
    cubes.forEach((m, k) => (m.position.y = cubeAt[k][1] + 0.015 * Math.sin(TAU * 0.5 * c + k)))
    const users: [{ x: number; z: number; walking: number }, number][] = [
      [qa, 1.74],
      [qb, 1.6],
    ]
    users.forEach(([q, h], i) => {
      const m = cubes[takenIdx[i]]
      const at = cubeAt[takenIdx[i]]
      const lift = seg(c, TAKE[i].at - 0.2, TAKE[i].at + 0.1)
      const taken = c >= TAKE[i].at - 0.2 && c < TAKE[i].out + 0.05
      if (taken) {
        root.set(q.x, bob(q.walking, c), q.z)
        rigToWorld({ x: 200, y: 318 }, h, root, camera, hands)
        m.position.set(lerp(bx + at[0], hands.x, lift), lerp(at[1] + 0.25 * lift, hands.y, lift), lerp(at[2], hands.z + 0.16, lift))
        m.visible = true
        m.scale.setScalar(1)
      } else if (c >= TAKE[i].out + 0.05) {
        m.position.set(bx + at[0], at[1], at[2])
        const back = restock(c)
        m.visible = back > 0.02
        m.scale.setScalar(Math.max(0.001, back))
      } else {
        m.position.set(bx + at[0], at[1] + 0.015 * Math.sin(TAU * 0.5 * c + takenIdx[i]), at[2])
        m.visible = true
        m.scale.setScalar(1)
      }
    })
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
const T13Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT13Everyday} hold={HOLD13} />
const T13Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT13Concept} hold={HOLD13} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T02Everyday: T02Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T02Concept: T02Concept as (p: Record<string, unknown>) => ReactNode,
  H_T13Everyday: T13Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T13Concept: T13Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
