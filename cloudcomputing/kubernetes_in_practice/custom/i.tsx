import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import podUrl from '../images/k8s-pod.svg'
import nodeUrl from '../images/k8s-node.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER I · SESSION 21 (Kubernetes in Practice) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`, built
 * the way Session 18's h/i/j.tsx are: a perspective camera on a real place; people are Character Lab characters from
 * the engine's `castSprite` (role clothing by `dress`) at a fixed `px: 256` with no idle breathing, expressions keyed
 * to the action; NO TEXT on either card; one wall-clock loop per slide shared by both cards beat for beat and place for
 * place (custom/clock.tsx: the cards fade in once every person has a first frame, a tap pauses both); each loop ends
 * in the state it starts in; held frames (`?still`, thumbnails) draw the telling moment at HOLD. Nobody walks toward
 * or away from the camera: people step sideways, props move. Props in a hand follow the frame the sprite is showing.
 *
 * SLIDE 27 · T10-AN (TR 10): "A hostel mess guarantees every student one full plate, but no one can take more than two
 * plates. In the same way, a request guarantees a pod its minimum compute, and a limit caps the maximum it can use."
 *
 *   place (x)        everyday: a hostel mess counter                  concept: a node and a pod
 *   -0.78            the student (his tray on the rail beside him)    the pod (its compute bar beside it)
 *   -0.40            his tray: one plate, then two                    the bar: request part (dark), limit part (light)
 *   -0.22 / 0.04     two full plates on the pass shelf                two spare compute blocks on the node's shelf
 *    0.12            the plate warmer                                 the node's compute outlet
 *    0.50 (back)     the mess server, apron and cap                   the node (its own mark)
 *    0.80 / 1.10     the rice and dal pots, steaming                  the node's two compute pools, bubbling
 *
 *   0.15 - 1.20     the server gives him ONE full plate              a dark block fills the request part (guaranteed)
 *   1.60 - 2.70     he takes a second plate off the shelf            a spare block fills the limit part, to the ceiling
 *   2.80 - 4.30     he reaches for a third: her palm says stop,     the third block is stopped at the ceiling (orange
 *                   the plate is ringed orange, his hand comes back  ring, the ceiling flashes orange), it goes back
 *   4.45 - 5.90     he lifts his tray and walks off                   the pod glides off with its bar
 *   5.00 - 6.30     she puts a fresh plate on the shelf               the node puts a fresh block on its shelf
 *   7.00 - 8.40     he comes back with an empty tray, sets it down   the pod glides back, its bar empty
 *
 * SLIDE 33 · T12-AN (TR 12): "A frozen phone screen still looks switched on until you tap it, just as a hung container
 * still looks running until a probe checks if it actually responds."
 *
 *   place            everyday: a young woman in her room              concept: a node and its container
 *   left             the woman                                        the node (its own mark), its status ring
 *   centre           the phone in her hand, its screen lit, frozen    the container on the node's bracket, its panel
 *                    (the video, the buffering ring, the bar)          lit, frozen (the gear, the bar), its green light on
 *   her tapping hand  taps the pause button                           the probe arm taps the container's port
 *   upper right      the wall clock, ticking                          the probe period dial, ticking
 *
 *   1.0, 1.85        she taps: a ripple, nothing on the screen moves  a probe: a ping into the port, no answer comes
 *   2.4 - 3.2        she presses and holds: nothing                   a third probe: nothing; the expected answer path
 *                    her face falls                                    shows dashed with an orange cross, the ring orange
 *   3.6 - 4.4        she shakes the phone a little                     the node holds the container, still no answer
 *   4.6 - 6.0        she looks at it again, the screen still lit       the container's light still green: looks running
 */

const W = 470
const H = 390
/* dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : d
}

type V3 = [number, number, number]
const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#22304F',
  orange: '#FF8A3D',
  green: '#22C55E',
  white: '#FFFFFF',
  steel: '#C9D0DA',
  steelDark: '#9AA4B4',
  /* request (guaranteed, dark) and limit (light) */
  req: '#1F47C4',
  lim: '#8DB4FF',
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
const v3 = (p: V3) => new THREE.Vector3(...p)

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
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) => {
  g.fillStyle = fill
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
}
/** an official mark on a white rounded tile (Session 18 j.tsx) */
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
    g.fillRect(0, 0, px, px)
    const pad = px * 0.12
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}
/** a round white badge with an orange cross (failed), an icon not a word */
const crossTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(32, 32, 30, 0, TAU)
    g.fill()
    g.strokeStyle = C.orange
    g.lineWidth = 4
    g.beginPath()
    g.arc(32, 32, 27, 0, TAU)
    g.stroke()
    g.lineWidth = 8
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(22, 22)
    g.lineTo(42, 42)
    g.moveTo(42, 22)
    g.lineTo(22, 42)
    g.stroke()
  })
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: V3, r = 0) => {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)
  const o = new THREE.Mesh(g, m)
  o.position.set(...pos)
  o.castShadow = true
  o.receiveShadow = true
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
function picture(tex: THREE.Texture, w: number, h: number, pos: V3, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(tex, o))
  m.position.set(...pos)
  return m
}
const setOp = (m: THREE.Mesh, o: number) => ((m.material as THREE.MeshBasicMaterial).opacity = o)
function floorPlane(w: number, d: number, m: THREE.Material, pos: V3) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
  f.rotation.x = -Math.PI / 2
  f.position.set(...pos)
  f.receiveShadow = true
  return f
}
/** a flat ring lying on a surface (an orange "stopped" ring under a plate or round a block) */
function flatRing(r0: number, r1: number, color: string) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.renderOrder = 3
  return m
}

function lights(scene: THREE.Scene, target: V3, key = 2.6) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 1.45))
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 3, target[1] + 9, target[2] + 8)
  k.target.position.set(...target)
  k.castShadow = true
  k.shadow.mapSize.set(2048, 2048)
  k.shadow.camera.left = -5
  k.shadow.camera.right = 5
  k.shadow.camera.top = 5
  k.shadow.camera.bottom = -5
  k.shadow.bias = -0.0005
  k.shadow.radius = 4
  scene.add(k, k.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.5)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
}
function setCam(camera: THREE.PerspectiveCamera, pos: V3, at: V3, fov: number) {
  camera.fov = fov
  camera.position.set(...pos)
  camera.lookAt(...at)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
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
/* every person on these cards: frames at one fixed size and no idle breathing (Session 16 round 3, Session 18) */
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
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing, rig body frame 400 x 600 (Session 18 j.tsx apron; a mess cook's cap after Session 9's chef cap) */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
  </g>
)
/** a low cook's cap, head-local (skull centre 0,0) */
const COOK_CAP = (
  <g data-part="cap">
    <path d="M -50 -46 C -56 -86 -30 -104 0 -104 C 30 -104 56 -86 50 -46 C 20 -54 -20 -54 -50 -46 Z" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth={3} />
    <path d="M -52 -50 C -20 -60 20 -60 52 -50 L 52 -38 C 20 -48 -20 -48 -52 -38 Z" fill="#F2F6FD" stroke="#D8E3F5" strokeWidth={2.5} />
  </g>
)
const cookDress = (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{COOK_CAP}</>, top: <>{k.top}{APRON('#F4F7FD', '#2D63FB')}</> })

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 99 to the grip; an angle is measured from hanging straight down, positive lifts away from the body, the
   forearm at shoulder minus elbow) and the inverse, so a hand lands on the thing it reaches for (Session 15, 18) ---- */

type Pt = { x: number; y: number }
type Arm = { s: number; e: number }
const UA = 95
const FA = 99
function handPt(side: 'L' | 'R', sh: number, a: Arm): Pt {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px + sg * (Math.sin(s) * UA + Math.sin(f) * FA), y: 205 + Math.cos(s) * UA + Math.cos(f) * FA }
}
/** the arm angles that put this hand at rig point p: of the two elbow solutions, the one with the LOWER elbow */
function ik(side: 'L' | 'R', sh: number, p: Pt): Arm {
  const a = ik2(side, sh, p, false)
  const b = ik2(side, sh, p, true)
  return Math.cos(a.s * DEG) >= Math.cos(b.s * DEG) ? a : b
}
function ik2(side: 'L' | 'R', sh: number, p: Pt, down: boolean): Arm {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  let dx = (p.x - px) * sg
  let dy = p.y - 205
  let d = Math.hypot(dx, dy)
  const max = UA + FA - 3
  if (d > max) {
    dx *= max / d
    dy *= max / d
    d = max
  }
  d = Math.max(d, 8)
  const phi = Math.atan2(dx, dy)
  const a = Math.acos(Math.min(1, Math.max(-1, (UA * UA + d * d - FA * FA) / (2 * UA * d))))
  const s = down ? phi - a : phi + a
  const f = Math.atan2(dx - Math.sin(s) * UA, dy - Math.cos(s) * UA)
  return { s: s / DEG, e: (s - f) / DEG }
}
/** of the two elbow solutions: the lower elbow, unless it would cross his midline (then the other) */
function natural(side: 'L' | 'R', sh: number, a: Arm, b: Arm): Arm {
  void side
  const out = (x: Arm) => sh - 6 + Math.sin(x.s * DEG) * UA // the elbow's distance out from his midline, rig px
  const lo = Math.cos(a.s * DEG) >= Math.cos(b.s * DEG) ? a : b
  const hi = lo === a ? b : a
  return out(lo) >= 0 || out(hi) < 0 ? lo : hi
}
const mixArm = (a: Arm, b: Arm, k: number): Arm => ({ s: lerp(a.s, b.s, k), e: lerp(a.e, b.e, k) })
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
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the point on the camera ray through p at depth z (a prop seen exactly where p is, at another depth) */
function onRay(p: THREE.Vector3, camera: THREE.Camera, z: number) {
  const cam = camera.position
  const t = (z - cam.z) / (p.z - cam.z)
  return p.set(cam.x + (p.x - cam.x) * t, cam.y + (p.y - cam.y) * t, z)
}
/** the hand of the frame the sprite is showing, in the world (a prop in that hand goes here) */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.06)
}
/** the loop time of the frame a sprite of F frames is showing at c (props in a hand follow the drawn frame) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)

function walkLegs(p: Pose, c: number, w: number, dir: number) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  to(p, 'headTurn', 0.4 * dir, w)
  to(p, 'lookX', 0.8 * dir, w)
}
const bob = (w: number, c: number) => w * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.03
/** a place on a path of [t0, t1, xTo] keys (eased between keys); x and how much the person is walking */
function along(c: number, keys: [number, number, number][]): { x: number; walking: number; dir: number } {
  let x = keys[0][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (b > a && c <= b) {
      const k = seg(c, a, b)
      const walking = hold(c, a, a + 0.1, b - 0.1, b)
      return { x: lerp(x, xt, k), walking, dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}
/** an arm built from spans: each [a, b, c, d] eases from the arm so far to `target` and back */
type Span = [number, number, number, number, Arm | ((c: number) => Arm)]
function armFrom(c: number, base: Arm, spans: Span[]): Arm {
  let a = base
  for (const [t0, t1, t2, t3, f] of spans) {
    const w = hold(c, t0, t1, t2, t3)
    if (w > 0) a = mixArm(a, typeof f === 'function' ? f(c) : f, w)
  }
  return a
}
/** a person standing at a place: everything their props need */
type Body = { cfg: CharacterConfig; root: THREE.Vector3; h: number; sh: number }
const body = (cfg: CharacterConfig, root: V3, h: number): Body => ({ cfg, root: v3(root), h, sh: buildSkin(cfg).shoulderHalf })
/** arm angles that put this person's hand on a world point */
const reach = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, dx = 0, dy = 0): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  return ik(side, b.sh, { x: p.x + dx, y: p.y + dy })
}
const REST: Arm = { s: 5, e: 8 }
const setArms = (p: Pose, l: Arm, r: Arm) => {
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
}
const lookAt = (p: Pose, x: number, w: number, y = 0) => {
  to(p, 'headTurn', 0.42 * x, w)
  to(p, 'lookX', 0.85 * x, w)
  if (y) {
    to(p, 'headNod', 0.3 * y, w)
    to(p, 'lookY', 0.8 * y, w)
  }
}
const grip = (p: Pose, side: 'L' | 'R', k: number) => {
  if (side === 'L') {
    to(p, 'fL1', 0.75, k)
    to(p, 'fL2', 0.8, k)
    to(p, 'fL3', 0.85, k)
    to(p, 'fL4', 0.85, k)
    to(p, 'tL', 0.55, k)
  } else {
    to(p, 'fR1', 0.75, k)
    to(p, 'fR2', 0.8, k)
    to(p, 'fR3', 0.85, k)
    to(p, 'fR4', 0.85, k)
    to(p, 'tR', 0.55, k)
  }
}

/* ------------------------------------------------------------------ shared props */

/** a steel thali: a shallow dish with a rim; `food` (rice, dal and a vegetable) heaped on it */
function makePlate(withFood: boolean) {
  const g = new THREE.Group()
  const steel = mat('#E3E8EF', { roughness: 0.25, metalness: 0.35, emissive: new THREE.Color('#E3E8EF'), emissiveIntensity: 0.12 })
  g.add(cyl(0.1, 0.088, 0.014, steel, [0, 0.007, 0], 36))
  g.add(mesh(new THREE.TorusGeometry(0.098, 0.007, 8, 40), steel, [0, 0.015, 0]))
  ;(g.children[1] as THREE.Mesh).rotation.x = Math.PI / 2
  if (withFood) {
    const rice = mesh(new THREE.SphereGeometry(0.052, 20, 12, 0, TAU, 0, Math.PI / 2), mat('#FBF8EE', { roughness: 0.9 }), [-0.025, 0.014, 0.01])
    rice.scale.set(1, 0.75, 1)
    const dal = cyl(0.034, 0.03, 0.03, mat('#E9B33A', { roughness: 0.55 }), [0.045, 0.028, -0.02], 20)
    const veg = mesh(new THREE.SphereGeometry(0.026, 14, 10, 0, TAU, 0, Math.PI / 2), mat('#5FA046', { roughness: 0.8 }), [0.035, 0.014, 0.045])
    veg.scale.set(1, 0.7, 1)
    g.add(rice, dal, veg)
  }
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  g.scale.setScalar(1.25)
  return g
}
/** a glossy compute block (the concept's plate) */
function makeBlock(color: string, s = 0.17) {
  const g = new THREE.Group()
  g.add(box(s, s, s, mat(color, { roughness: 0.25, metalness: 0.05, emissive: new THREE.Color(color), emissiveIntensity: 0.22 }), [0, s / 2, 0], s * 0.2))
  /* a chip mark on the front: a white square with pins (compute, drawn not written) */
  const chip = canvasTex(64, 64, (k) => {
    k.fillStyle = '#FFFFFF'
    for (let i = 0; i < 4; i++) {
      k.fillRect(18 + i * 8, 8, 4, 8)
      k.fillRect(18 + i * 8, 48, 4, 8)
      k.fillRect(8, 18 + i * 8, 8, 4)
      k.fillRect(48, 18 + i * 8, 8, 4)
    }
    rr(k, 16, 16, 32, 32, 5, '#FFFFFF')
    rr(k, 24, 24, 16, 16, 3, color)
  })
  const f = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.7, s * 0.7), basic(chip))
  f.position.set(0, s / 2, s / 2 + 0.002)
  g.add(f)
  return g
}

/* ================================================================== T10 · the hostel mess, requests and limits */

const L10 = 8.4
const F10 = 84
const HOLD10 = 3.6 /* two plates on his tray, his hand out for a third, her palm up, the third plate ringed orange */
const CAM10: V3 = [-0.05, 1.72, 4.2]
const AT10: V3 = [-0.05, 1.06, -0.1]
const FOV10 = 30

const ST = { x: -0.6, z: 0.42, out: -2.5 } // the student
const SV = { x: 0.7, z: -0.76 } // the server
const CTR = { x0: -1.05, x1: 2.6, zf: 0.06, zb: -0.62, h: 0.9 }
const RAIL = { y: 0.86, z0: 0.1, z1: 0.27 }
const TRAY = { x: -0.17, z: 0.185, y: 0.885, w: 0.58, d: 0.34 }
const SLOT = { one: 0.14, two: -0.14 } // tray-local x of the two plates
const SHELF = { y: 1.3, z: -0.12, x0: -0.12, x1: 0.48, p2: 0.08, p3: 0.34 }
const WARM = { x: 0.3, z: -0.36, y: 1.12 }
const POTS = [1.02, 1.28]
/* the carried tray, relative to the student */
const CARRY: V3 = [0.15, 0.86, 0.2]
const T10 = {
  walkIn: [6.9, 7.9] as const,
  put: [7.85, 8.15] as const, // the tray from his hands to the rail (his hands back at his sides by 8.27, before the loop closes)
  give: { reach: [0.15, 0.5] as const, carry: [0.5, 1.0] as const, place: [0.95, 1.2] as const, back: [1.2, 1.55] as const },
  take: { reach: [1.6, 1.95] as const, carry: [1.95, 2.45] as const, back: [2.45, 2.7] as const },
  third: [2.8, 3.3, 3.9, 4.3] as const, // his hand out for the third, stopped short, back
  palm: [2.95, 3.25, 4.1, 4.45] as const, // her palm up over it
  shake: [3.25, 3.95] as const,
  ring: [3.2, 3.4, 4.3, 4.6] as const,
  lift: [4.45, 4.8] as const, // the tray from the rail to his hands
  walkOut: [4.8, 5.9] as const,
  refill: { reach: [5.0, 5.35] as const, carry: [5.35, 5.9] as const, place: [5.8, 5.98] as const, back: [5.95, 6.3] as const },
  stir: [6.5, 6.75, 7.6, 7.85] as const,
}
const stAt = (c: number) =>
  along(c, [
    [0, 0, ST.x],
    [T10.walkOut[0], T10.walkOut[1], ST.out],
    [T10.walkIn[0], T10.walkIn[1], ST.x],
  ])
/** how much the tray is in his hands (0 on the rail) */
const trayHeld = (c: number) => Math.max(seg(c, T10.lift[0], T10.lift[1]) * (1 - seg(c, T10.put[0], T10.put[1])), 0)

/** the mess: floor, a tiled wall with a tube light, the counter with its tray rail, the pass shelf, the warmer, pots */
function messRoom(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#EEF3FB' : '#F1ECE3')
  scene.add(floorPlane(12, 8, mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [12, 8]) : tileTex('#E4DCCD', '#D2C6B2', 4, [12, 8]), roughness: 0.85 }), [0, 0, 1]))
  const BACK = -1.35
  if (concept) {
    scene.add(flat(box(12, 4.4, 0.05, mat('#E3ECFC', { roughness: 0.95, emissive: new THREE.Color('#E3ECFC'), emissiveIntensity: 0.5 }), [0, 2.2, BACK])))
  } else {
    /* glazed white tiles to 1.5 m, a pale yellow wall above, a tube light */
    scene.add(flat(box(12, 1.5, 0.05, mat('#ffffff', { map: tileTex('#F6F7F8', '#DADFE6', 4, [24, 3]), roughness: 0.35, emissive: new THREE.Color('#F2F4F6'), emissiveIntensity: 0.35 }), [0, 0.75, BACK])))
    scene.add(flat(box(12, 2.9, 0.05, mat('#F6EBCF', { roughness: 0.95, emissive: new THREE.Color('#F6EBCF'), emissiveIntensity: 0.45 }), [0, 2.95, BACK])))
    scene.add(flat(box(1.1, 0.05, 0.06, new THREE.MeshBasicMaterial({ color: '#FFFDF4', toneMapped: false }), [0.3, 2.05, BACK + 0.06])))
    scene.add(flat(box(1.2, 0.03, 0.08, mat('#D9DDE3', { roughness: 0.4 }), [0.3, 2.02, BACK + 0.05])))
  }
}

/* ------------------------------------------------------------------ T10 everyday: the mess counter */

function setupT10Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, CAM10, AT10, FOV10)
  lights(scene, [0, 1.0, -0.2])
  messRoom(scene, false)

  /* the counter: stainless top and front, a kick strip, the tray rail along its front */
  const steel = mat('#DCE1E8', { roughness: 0.3, metalness: 0.3, emissive: new THREE.Color('#DCE1E8'), emissiveIntensity: 0.15 })
  const steelD = mat(C.steelDark, { roughness: 0.4, metalness: 0.3 })
  const cw = CTR.x1 - CTR.x0
  const cx = (CTR.x0 + CTR.x1) / 2
  scene.add(box(cw, CTR.h - 0.04, CTR.zf - CTR.zb, mat('#E4E8EE', { roughness: 0.4, metalness: 0.25, emissive: new THREE.Color('#E4E8EE'), emissiveIntensity: 0.15 }), [cx, (CTR.h - 0.04) / 2, (CTR.zf + CTR.zb) / 2]))
  scene.add(box(cw + 0.02, 0.04, CTR.zf - CTR.zb + 0.04, steel, [cx, CTR.h - 0.02, (CTR.zf + CTR.zb) / 2], 0.01))
  scene.add(flat(box(cw, 0.08, 0.02, steelD, [cx, 0.04, CTR.zf + 0.01])))
  /* front panel seams */
  for (let x = CTR.x0 + 0.6; x < CTR.x1; x += 0.6) scene.add(flat(box(0.008, CTR.h - 0.2, 0.004, steelD, [x, CTR.h / 2, CTR.zf + 0.002])))
  /* the rail: two tubes on brackets */
  for (const z of [RAIL.z0, RAIL.z1]) {
    const t = mesh(new THREE.CylinderGeometry(0.012, 0.012, cw, 12), steel, [cx, RAIL.y, z])
    t.rotation.z = Math.PI / 2
    scene.add(t)
  }
  for (let x = CTR.x0 + 0.1; x < CTR.x1; x += 0.7) scene.add(box(0.02, 0.025, RAIL.z1 - CTR.zf + 0.02, steelD, [x, RAIL.y - 0.012, (RAIL.z1 + CTR.zf) / 2]))
  /* the pass shelf on two posts */
  scene.add(box(SHELF.x1 - SHELF.x0, 0.025, 0.3, steel, [(SHELF.x0 + SHELF.x1) / 2, SHELF.y, SHELF.z], 0.008))
  for (const x of [SHELF.x0 + 0.03, SHELF.x1 - 0.03]) scene.add(cyl(0.012, 0.012, SHELF.y - CTR.h, steel, [x, (SHELF.y + CTR.h) / 2, SHELF.z - 0.1], 12))
  /* the plate warmer: a steel case with a glass front, plates stacked inside, the top plate in its opening */
  scene.add(box(0.3, 0.2, 0.26, steel, [WARM.x, CTR.h + 0.1, WARM.z], 0.02))
  scene.add(flat(box(0.24, 0.13, 0.005, mat('#BFD3EA', { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55 }), [WARM.x, CTR.h + 0.09, WARM.z + 0.132])))
  for (let k = 0; k < 6; k++) {
    const p = makePlate(false)
    p.position.set(WARM.x, CTR.h + 0.035 + k * 0.016, WARM.z)
    scene.add(p)
  }
  const warmTop = makePlate(true)
  warmTop.position.set(WARM.x, WARM.y, WARM.z)
  scene.add(warmTop)
  /* the pots, lids ajar, steam rising */
  const potM = mat('#D3D9E2', { roughness: 0.25, metalness: 0.35, emissive: new THREE.Color('#D3D9E2'), emissiveIntensity: 0.12 })
  const puffs: { m: THREE.Mesh; x: number; ph: number }[] = []
  const steamT = haloTex('rgba(255,255,255,0.9)')
  POTS.forEach((x, k) => {
    scene.add(cyl(0.13, 0.12, 0.24, potM, [x, CTR.h + 0.12, -0.3], 32))
    scene.add(mesh(new THREE.TorusGeometry(0.13, 0.008, 8, 36), potM, [x, CTR.h + 0.24, -0.3]))
    ;(scene.children[scene.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2
    scene.add(cyl(0.12, 0.12, 0.01, mat(k === 0 ? '#FBF8EE' : '#E9B33A', { roughness: 0.7 }), [x, CTR.h + 0.225, -0.3], 32))
    for (let j = 0; j < 3; j++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: steamT, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }))
      m.renderOrder = 4
      scene.add(m)
      puffs.push({ m, x, ph: j / 3 + k * 0.17 })
    }
  })
  /* the ladle in the rice pot (the server stirs with it) */
  const ladle = new THREE.Group()
  ladle.add(cyl(0.008, 0.008, 0.34, mat('#AEB7C4', { metalness: 0.35, roughness: 0.3 }), [0, 0.17, 0], 10))
  ladle.add(mesh(new THREE.SphereGeometry(0.035, 16, 10, 0, TAU, Math.PI / 2, Math.PI / 2), mat('#AEB7C4', { metalness: 0.35, roughness: 0.3 }), [0, 0, 0]))
  scene.add(ladle)

  /* the plates on the shelf, the plate she gives, the fresh one she puts out, the student's tray */
  const shelfTop = SHELF.y + 0.013
  const P2 = makePlate(true)
  const P3 = makePlate(true)
  P3.position.set(SHELF.p3, shelfTop, SHELF.z)
  const P1 = makePlate(true)
  const PR = makePlate(true)
  scene.add(P2, P3, P1, PR)
  const ring = flatRing(0.13, 0.17, C.orange)
  ring.position.set(SHELF.p3, shelfTop + 0.002, SHELF.z)
  scene.add(ring)
  const ringT = new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0, toneMapped: false })
  const torus = mesh(new THREE.TorusGeometry(0.135, 0.01, 10, 48), ringT, [SHELF.p3, shelfTop + 0.03, SHELF.z])
  torus.rotation.x = Math.PI / 2
  scene.add(torus)
  const tray = new THREE.Group()
  tray.add(box(TRAY.w, 0.016, TRAY.d, mat('#C7CED8', { roughness: 0.3, metalness: 0.3 }), [0, 0.008, 0], 0.006))
  for (const s of [-1, 1]) {
    tray.add(flat(box(TRAY.w, 0.014, 0.012, mat('#B3BBC7', { roughness: 0.3, metalness: 0.3 }), [0, 0.02, (s * TRAY.d) / 2])))
    tray.add(flat(box(0.012, 0.014, TRAY.d, mat('#B3BBC7', { roughness: 0.3, metalness: 0.3 }), [(s * TRAY.w) / 2, 0.02, 0])))
  }
  scene.add(tray)

  /* ---- the people ---- */
  const stu = body(who(CAST_PRESETS.kabir, { name: 'Student', hair: { style: 'curly', color: '#262B43' }, outfit: { top: 'tshirt', topColor: '#3E6FD8', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 1, shoulders: 0.97 } }), [ST.x, 0, ST.z], 1.68)
  const srv = body(who(CAST_PRESETS.meera, { name: 'Mess Server', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#7B5EA7', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { earrings: true, bindi: true }, build: { height: 1, shoulders: 1.02 } }), [SV.x, 0, SV.z], 1.6)

  /* world points */
  const railTray = v3([TRAY.x, TRAY.y, TRAY.z])
  const atS = (x: number) => new THREE.Vector3(x, 0, ST.z)
  const carryAt = (x: number) => atS(x).add(v3(CARRY))
  const slotW = (x: number) => railTray.clone().add(new THREE.Vector3(x, 0.017, 0))
  const warmP = v3([WARM.x, WARM.y, WARM.z])
  const shelfP = (x: number) => v3([x, shelfTop, SHELF.z])
  const handoff = v3([0.02, 1.2, -0.32]) // at the plate's depth, so her hand is drawn clear of the shelf and the warmer
  const PROP_Z = -0.32 // a plate in her hand is seen at her hand, over the counter
  const stuHome = { ...stu, root: atS(ST.x) }

  /* ---- arms ---- */
  /* his grips on the tray: its left end and just left of its middle (he can reach both while it sits on the rail beside him,
     and carries it low in front of him with nearly straight arms, as a 2D rig must: no forearm foreshortening) */
  const tEnds = (tp: THREE.Vector3, side: 'L' | 'R') => tp.clone().add(new THREE.Vector3(side === 'L' ? -TRAY.w / 2 + 0.03 : -0.04, 0.0, 0))
  const p2R = reach(stuHome, 'R', shelfP(SHELF.p2).add(new THREE.Vector3(0, 0.03, 0)), camera)
  const slot2R = reach(stuHome, 'R', slotW(SLOT.two).add(new THREE.Vector3(0, 0.05, 0)), camera)
  const p3R = reach(stuHome, 'R', shelfP(SHELF.p3 - 0.3).add(new THREE.Vector3(0, -0.06, 0)), camera)
  /** where the tray is at loop time c, for the student at x (bobbing y): on the rail, lifted, or carried */
  const trayAt = (c: number, x: number, y: number, o = new THREE.Vector3()) => {
    const held = trayHeld(c)
    o.copy(railTray).lerp(carryAt(x).add(new THREE.Vector3(0, y, 0)), held)
    o.y += Math.sin(held * Math.PI) * 0.02
    return o
  }
  /** a hand on an end of the tray, elbow out (the lower-elbow solution crossed his arms) */
  const onEnd = (c: number, side: 'L' | 'R'): Arm => {
    const at = stAt(c)
    const r = new THREE.Vector3(at.x, bob(at.walking, c), ST.z)
    const q = worldToRig(tEnds(trayAt(c, at.x, r.y), side), r, stu.h, camera)
    return natural(side, stu.sh, ik2(side, stu.sh, q, false), ik2(side, stu.sh, q, true))
  }
  /** his arms: the tray in both hands while walking (and lifting / setting it down), else rest and reach */
  const stuL = (c: number) => {
    const w = heldW(c)
    return w > 0 ? mixArm(REST, onEnd(c, 'L'), w) : REST
  }
  const stuR = (c: number) => {
    const base = armFrom(c, REST, [
      [T10.take.reach[0], T10.take.reach[1], T10.take.reach[1] + 0.02, T10.take.carry[0] + 0.1, p2R],
      [T10.take.carry[0], T10.take.carry[1] - 0.1, T10.take.carry[1], T10.take.back[1], slot2R],
      [T10.third[0], T10.third[1], T10.third[2], T10.third[3], p3R],
    ])
    const w = heldW(c)
    return w > 0 ? mixArm(base, onEnd(c, 'R'), w) : base
  }
  /* hands on the tray: from just before the lift to just after it is set down */
  function heldW(c: number) {
    return seg(c, T10.lift[0] - 0.15, T10.lift[0]) * (1 - seg(c, T10.put[1], T10.put[1] + 0.12))
  }

  const srvRest: Arm = { s: 12, e: 30 }
  const warmL = reach(srv, 'L', warmP.clone().add(new THREE.Vector3(0, 0.15, 0)), camera)
  const handL = reach(srv, 'L', handoff, camera)
  const shelfL = reach(srv, 'L', shelfP(SHELF.p2).add(new THREE.Vector3(0.04, 0.13, 0)), camera)
  const palmL = reach(srv, 'L', shelfP(SHELF.p3 - 0.08).add(new THREE.Vector3(0, 0.2, 0)), camera)
  const srvL = (c: number) =>
    armFrom(c, srvRest, [
      [T10.give.reach[0], T10.give.reach[1], T10.give.reach[1] + 0.02, T10.give.carry[0] + 0.1, warmL],
      [T10.give.carry[0], T10.give.carry[1], T10.give.place[1], T10.give.back[1], handL],
      [T10.palm[0], T10.palm[1], T10.palm[2], T10.palm[3], palmL],
      [T10.refill.reach[0], T10.refill.reach[1], T10.refill.reach[1] + 0.02, T10.refill.carry[0] + 0.1, warmL],
      [T10.refill.carry[0], T10.refill.carry[1] - 0.1, T10.refill.place[1], T10.refill.back[1], shelfL],
    ])
  /* her R hand on the ladle in the rice pot; it stirs when she is free */
  const potP = v3([POTS[0], CTR.h + 0.36, -0.3])
  const stirR = (c: number) => {
    const w = hold(c, T10.stir[0], T10.stir[1], T10.stir[2], T10.stir[3]) + hold(c, 1.65, 1.9, 2.55, 2.8)
    const a = c * TAU * 1.6
    return reach(srv, 'R', potP.clone().add(new THREE.Vector3(0.04 * Math.cos(a) * w - 0.04, 0.01 * Math.sin(a) * w, 0)), camera)
  }

  /* ---- poses ---- */
  const poseStu = (p: Pose, c: number) => {
    const at = stAt(c)
    const l = stuL(c)
    const r = stuR(c)
    setArms(p, { s: l.s, e: l.e }, { s: r.s, e: r.e })
    const held = heldW(c)
    grip(p, 'L', held)
    grip(p, 'R', Math.max(held, hold(c, T10.take.reach[1] - 0.05, T10.take.reach[1], T10.take.carry[1], T10.take.carry[1] + 0.05)))
    /* reaching for the third: fingers open toward it */
    const third = hold(c, T10.third[0], T10.third[1], T10.third[2], T10.third[3])
    to(p, 'fR1', 0.15, third)
    to(p, 'fR2', 0.3, third)
    to(p, 'fR3', 0.4, third)
    to(p, 'fR4', 0.45, third)
    to(p, 'palmR', 0.1, third)
    to(p, 'wristR', -15, third)
    /* he looks at the counter, the server, the shelf */
    const atCounter = 1 - Math.max(at.walking, seg(c, T10.walkOut[0] - 0.1, T10.walkOut[0]) * (1 - seg(c, T10.walkIn[1], T10.walkIn[1] + 0.2)))
    lookAt(p, 1, atCounter)
    lookAt(p, 0.6, atCounter * hold(c, T10.take.reach[0], T10.take.reach[1], T10.take.carry[0], T10.take.carry[1]), -0.4)
    lookAt(p, 0.5, atCounter * hold(c, T10.take.carry[0], T10.take.carry[1], T10.take.back[0], T10.take.back[1]), 0.8)
    walkLegs(p, c, at.walking, at.dir)
    /* stopped: a little lean back, then a sheepish tilt */
    to(p, 'headTilt', -5, hold(c, 3.6, 3.85, 4.3, 4.6))
  }
  const poseSrv = (p: Pose, c: number) => {
    const l = srvL(c)
    setArms(p, l, stirR(c))
    grip(p, 'R', 1)
    const plate = Math.max(hold(c, T10.give.reach[1] - 0.05, T10.give.reach[1], T10.give.place[0], T10.give.place[1]), hold(c, T10.refill.reach[1] - 0.05, T10.refill.reach[1], T10.refill.place[0], T10.refill.place[1]))
    grip(p, 'L', plate)
    /* the stop: an open palm toward him */
    const palm = hold(c, T10.palm[0], T10.palm[1], T10.palm[2], T10.palm[3])
    to(p, 'fL1', 0, palm)
    to(p, 'fL2', 0, palm)
    to(p, 'fL3', 0.05, palm)
    to(p, 'fL4', 0.1, palm)
    to(p, 'tL', 0.15, palm)
    to(p, 'spreadL', 0.5, palm)
    to(p, 'palmL', 1, palm)
    lookAt(p, -1, 1)
    /* down at the warmer and the pot when she works there */
    lookAt(p, -0.4, Math.max(hold(c, T10.give.reach[0], T10.give.reach[1], T10.give.carry[0], T10.give.carry[0] + 0.2), hold(c, T10.refill.reach[0], T10.refill.reach[1], T10.refill.carry[1], T10.refill.back[1])), 0.8)
    lookAt(p, 0.5, hold(c, T10.stir[0], T10.stir[1], T10.stir[2], T10.stir[3]), 1)
    /* a shake of the head */
    const sk = hold(c, T10.shake[0], T10.shake[0] + 0.1, T10.shake[1] - 0.1, T10.shake[1])
    to(p, 'headTurn', -0.42 + 0.22 * Math.sin(((c - T10.shake[0]) / (T10.shake[1] - T10.shake[0])) * TAU * 2), sk)
  }
  const people = [
    person({ config: stu.cfg, seed: 2101, faces: [[0, 'listening'], [0.9, 'happy'], [1.6, 'excited'], [3.15, 'surprised'], [3.85, 'shy'], [4.6, 'happy'], [7.0, 'listening']], pose: poseStu, loop: L10, height: stu.h, frames: F10, redraw, holdT: devHold(HOLD10) }),
    person({ config: srv.cfg, dress: cookDress, seed: 2102, faces: [[0, 'happy'], [2.9, 'neutral'], [4.4, 'happy'], [5.0, 'thinking'], [6.4, 'happy']], pose: poseSrv, loop: L10, height: srv.h, frames: F10, redraw, holdT: devHold(HOLD10) }),
  ]
  const stuSprite = people[0]
  people[0].object.position.copy(stu.root)
  people[1].object.position.copy(srv.root)
  scene.add(people[0].object, people[1].object)
  const clk = slideClock('T10', scene, devHold(HOLD10), people)

  const tmp = new THREE.Vector3()
  const hp = new THREE.Vector3()
  const root = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L10)
    const cq = frameT(c, L10, F10)
    const at = stAt(c)
    root.set(at.x, bob(at.walking, c), ST.z)
    stuSprite.object.position.copy(root)
    people.forEach((s) => s.update(c, camera))

    /* the tray: on the rail, or in his hands */
    trayAt(cq, at.x, root.y, tray.position)
    const onTray = (x: number, o: THREE.Vector3) => o.copy(tray.position).add(tmp.set(x, 0.017, 0))

    /* P1: from the warmer to her hand, onto his tray; away with him; hidden till the next loop */
    const g = T10.give
    P1.visible = c > g.reach[1] - 0.02 && c < T10.walkOut[1]
    if (c < g.carry[1]) {
      handWorld('L', srv.sh, srvL(cq), srv.h, srv.root, camera, hp)
      onRay(hp, camera, PROP_Z)
      hp.y -= 0.03
      P1.position.copy(warmP).lerp(hp, seg(c, g.carry[0] - 0.05, g.carry[0] + 0.1))
    } else {
      handWorld('L', srv.sh, srvL(frameT(g.carry[1], L10, F10)), srv.h, srv.root, camera, hp)
      onRay(hp, camera, PROP_Z)
      hp.y -= 0.03
      const k = seg(c, g.place[0], g.place[1] + 0.05)
      P1.position.copy(hp).lerp(onTray(SLOT.one, tmp.clone()), k)
      P1.position.y += Math.sin(k * Math.PI) * 0.04
    }
    /* P2: on the shelf, into his hand, onto his tray, away with him */
    const tk = T10.take
    P2.visible = c < T10.walkOut[1]
    if (c < tk.reach[1]) P2.position.copy(shelfP(SHELF.p2))
    else if (c < tk.carry[1] - 0.05) {
      handWorld('R', stu.sh, stuR(cq), stu.h, root, camera, hp)
      hp.y -= 0.04
      const k = seg(c, tk.reach[1], tk.reach[1] + 0.12)
      P2.position.copy(shelfP(SHELF.p2)).lerp(hp, k)
    } else {
      handWorld('R', stu.sh, stuR(frameT(tk.carry[1] - 0.05, L10, F10)), stu.h, root, camera, hp)
      hp.y -= 0.04
      P2.position.copy(hp).lerp(onTray(SLOT.two, tmp.clone()), seg(c, tk.carry[1] - 0.05, tk.carry[1] + 0.08))
    }
    /* once set on the tray, the plates ride with it */
    if (c >= g.place[1] + 0.05) onTray(SLOT.one, P1.position)
    if (c >= tk.carry[1] + 0.08) onTray(SLOT.two, P2.position)
    /* PR: the fresh plate she puts out (it is the next loop's P2) */
    const rf = T10.refill
    PR.visible = c > rf.reach[1] - 0.02
    if (c < rf.carry[1] - 0.05) {
      handWorld('L', srv.sh, srvL(cq), srv.h, srv.root, camera, hp)
      onRay(hp, camera, PROP_Z)
      hp.y -= 0.03
      PR.position.copy(warmP).lerp(hp, seg(c, rf.carry[0] - 0.05, rf.carry[0] + 0.1))
    } else {
      handWorld('L', srv.sh, srvL(frameT(rf.carry[1] - 0.05, L10, F10)), srv.h, srv.root, camera, hp)
      onRay(hp, camera, PROP_Z)
      hp.y -= 0.03
      PR.position.copy(hp).lerp(shelfP(SHELF.p2), seg(c, rf.place[0] - 0.05, rf.place[1]))
    }
    /* the stopped plate */
    const stopped = hold(c, T10.ring[0], T10.ring[1], T10.ring[2], T10.ring[3])
    setOp(ring, 0.7 * stopped)
    ringT.opacity = stopped
    /* the ladle in her right hand */
    handWorld('R', srv.sh, stirR(cq), srv.h, srv.root, camera, hp)
    onRay(hp, camera, -0.3)
    ladle.position.set(hp.x, Math.max(CTR.h + 0.06, hp.y - 0.26), -0.3)
    ladle.rotation.z = -0.18
    /* steam */
    for (const s of puffs) {
      const k = mod((c / L10) * 3 + s.ph * 3, 1)
      s.m.position.set(s.x + 0.03 * Math.sin(k * TAU + s.ph * 5), CTR.h + 0.27 + k * 0.26, -0.28)
      s.m.scale.setScalar(0.5 + k * 0.6)
      s.m.quaternion.copy(camera.quaternion)
      setOp(s.m, 0.4 * Math.sin(k * Math.PI))
    }
  }
}

/* ------------------------------------------------------------------ T10 concept: a node and a pod */

function setupT10Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, CAM10, AT10, FOV10)
  lights(scene, [0, 1.0, -0.2])
  messRoom(scene, true)
  const white = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.3 })
  const band = mat(C.brand, { roughness: 0.35, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 })

  /* the node's deck (the counter), its track (the rail), its shelf (the pass), its outlet (the warmer) */
  const cw = CTR.x1 - CTR.x0
  const cx = (CTR.x0 + CTR.x1) / 2
  scene.add(box(cw, CTR.h, CTR.zf - CTR.zb, white, [cx, CTR.h / 2, (CTR.zf + CTR.zb) / 2], 0.04))
  scene.add(flat(box(cw, 0.05, 0.02, band, [cx, CTR.h - 0.06, CTR.zf + 0.005])))
  for (let x = CTR.x0 + 0.6; x < CTR.x1; x += 0.6) scene.add(flat(box(0.008, CTR.h - 0.2, 0.004, mat('#D5E0F5', { roughness: 0.5 }), [x, CTR.h / 2 - 0.04, CTR.zf + 0.002])))
  const track = mat('#9DB9F5', { roughness: 0.3, emissive: new THREE.Color('#9DB9F5'), emissiveIntensity: 0.5 })
  for (const z of [RAIL.z0, RAIL.z1]) {
    const t = mesh(new THREE.CylinderGeometry(0.012, 0.012, cw, 12), track, [cx, RAIL.y, z])
    t.rotation.z = Math.PI / 2
    scene.add(t)
  }
  scene.add(box(SHELF.x1 - SHELF.x0, 0.025, 0.3, white, [(SHELF.x0 + SHELF.x1) / 2, SHELF.y, SHELF.z], 0.008))
  for (const x of [SHELF.x0 + 0.03, SHELF.x1 - 0.03]) scene.add(cyl(0.012, 0.012, SHELF.y - CTR.h, mat('#C9D6F2', { roughness: 0.4 }), [x, (SHELF.y + CTR.h) / 2, SHELF.z - 0.1], 12))
  /* the outlet: a white case with a glowing slot on top */
  scene.add(box(0.3, 0.2, 0.26, white, [WARM.x, CTR.h + 0.1, WARM.z], 0.03))
  const slotM = new THREE.MeshBasicMaterial({ color: '#7FA6FF', toneMapped: false })
  scene.add(flat(box(0.22, 0.006, 0.14, slotM, [WARM.x, CTR.h + 0.2, WARM.z])))
  /* the two compute pools (the pots): glass drums of blue, bubbles rising */
  const bubbles: { m: THREE.Mesh; x: number; ph: number }[] = []
  POTS.forEach((x) => {
    scene.add(cyl(0.13, 0.13, 0.24, new THREE.MeshPhysicalMaterial({ color: '#DCE7FF', roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.6 }), [x, CTR.h + 0.12, -0.3], 32))
    scene.add(cyl(0.118, 0.118, 0.17, mat('#4C7DFB', { roughness: 0.3, emissive: new THREE.Color('#4C7DFB'), emissiveIntensity: 0.35 }), [x, CTR.h + 0.09, -0.3], 32))
    scene.add(cyl(0.135, 0.135, 0.02, white, [x, CTR.h + 0.245, -0.3], 32))
    for (let j = 0; j < 3; j++) {
      const m = mesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshBasicMaterial({ color: '#CFE0FF', transparent: true, opacity: 0, toneMapped: false }))
      scene.add(m)
      bubbles.push({ m, x, ph: j / 3 })
    }
  })

  /* the node (the server's place): a white tower, its mark at head height, a status ring, lights */
  const node = new THREE.Group()
  node.position.set(SV.x, 0, SV.z)
  /* a server tower in the server's place: navy body, a white face carrying the node's mark at head height */
  node.add(box(0.52, 1.6, 0.36, mat('#2B3F86', { roughness: 0.35, emissive: new THREE.Color('#2B3F86'), emissiveIntensity: 0.2 }), [0, 0.8, 0], 0.05))
  node.add(flat(box(0.44, 0.44, 0.02, white, [0, 1.34, 0.18], 0.03)))
  const nodeMark = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), basic(markTex(nodeUrl, redraw), { transparent: false }))
  nodeMark.position.set(0, 1.34, 0.193)
  node.add(nodeMark)
  const ringM = new THREE.MeshBasicMaterial({ color: '#7FA6FF', toneMapped: false, transparent: true })
  const statusRing = mesh(new THREE.TorusGeometry(0.235, 0.014, 10, 48), ringM, [0, 1.34, 0.19])
  node.add(statusRing)
  const ringO = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })
  node.add(mesh(new THREE.TorusGeometry(0.235, 0.016, 10, 48), ringO, [0, 1.34, 0.193]))
  for (let k = 0; k < 2; k++) node.add(flat(box(0.36, 0.05, 0.02, mat('#3E56A6', { roughness: 0.4 }), [0, 1.0 - k * 0.08, 0.18], 0.01)))
  const leds = [0, 1, 2].map((k) => {
    const m = new THREE.MeshBasicMaterial({ color: '#7FA6FF', toneMapped: false })
    node.add(mesh(new THREE.SphereGeometry(0.018, 12, 8), m, [0.1 + k * 0.05, 1.0, 0.195]))
    return m
  })
  scene.add(node)

  /* the blocks: the spare two on the shelf, the dark one the node guarantees, the fresh spare it puts out */
  const shelfTop = SHELF.y + 0.013
  const shelfP = (x: number) => v3([x, shelfTop, SHELF.z])
  const B2 = makeBlock(C.lim)
  const B3 = makeBlock(C.lim)
  const B1 = makeBlock(C.req)
  const BR = makeBlock(C.lim)
  scene.add(B2, B3, B1, BR)
  const ring3 = flatRing(0.13, 0.15, C.orange)
  scene.add(ring3)

  /* the pod (the student's place): its mark on a white tile, on a post, on a glide base; its bar (the tray's place) */
  const pod = new THREE.Group()
  const BAR = { dx: TRAY.x - ST.x, y0: RAIL.y + 0.03, slot: 0.205, w: 0.24 }
  pod.add(cyl(0.3, 0.32, 0.05, white, [0.12, 0.025, 0], 40))
  pod.add(cyl(0.035, 0.035, 1.15, mat('#C9D6F2', { roughness: 0.4 }), [0, 0.6, 0], 16))
  pod.add(box(0.52, 0.52, 0.12, white, [0, 1.38, 0], 0.05))
  const podMark = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), basic(markTex(podUrl, redraw), { transparent: false }))
  podMark.position.set(0, 1.38, 0.062)
  pod.add(podMark)
  /* the arm and the bar: a glass column, the request line at the first slot, the limit ceiling on top */
  pod.add(box(BAR.dx, 0.03, 0.04, mat('#C9D6F2', { roughness: 0.4 }), [BAR.dx / 2, BAR.y0 - 0.02, 0]))
  const bar = new THREE.Group()
  bar.position.set(BAR.dx, BAR.y0, 0)
  const glass = new THREE.MeshPhysicalMaterial({ color: '#EAF1FF', roughness: 0.08, transmission: 0.3, transparent: true, opacity: 0.35, depthWrite: false })
  bar.add(box(BAR.w, BAR.slot, BAR.w, new THREE.MeshPhysicalMaterial({ color: '#5577DD', roughness: 0.1, transparent: true, opacity: 0.22, depthWrite: false }), [0, BAR.slot / 2, 0], 0.01))
  bar.add(box(BAR.w, BAR.slot, BAR.w, new THREE.MeshPhysicalMaterial({ color: '#A9C6FF', roughness: 0.1, transparent: true, opacity: 0.25, depthWrite: false }), [0, BAR.slot * 1.5, 0], 0.01))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bar.add(box(0.014, BAR.slot * 2, 0.014, white, [(sx * BAR.w) / 2, BAR.slot, (sz * BAR.w) / 2]))
  void glass
  bar.add(box(BAR.w + 0.04, 0.02, BAR.w + 0.04, white, [0, -0.01, 0], 0.008))
  const reqLine = mesh(new THREE.TorusGeometry(BAR.w * 0.72, 0.008, 8, 4), mat(C.req, { roughness: 0.3 }), [0, BAR.slot, 0])
  reqLine.rotation.set(Math.PI / 2, 0, Math.PI / 4)
  bar.add(reqLine)
  const capM = mat(C.navy, { roughness: 0.35, emissive: new THREE.Color(C.navy), emissiveIntensity: 0.1 })
  const cap = box(BAR.w + 0.08, 0.035, BAR.w + 0.08, capM, [0, BAR.slot * 2 + 0.018, 0], 0.01)
  bar.add(cap)
  /* the ceiling flashing orange: an orange cap over the navy one, faded in */
  const capO = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })
  bar.add(flat(box(BAR.w + 0.086, 0.04, BAR.w + 0.086, capO, [0, BAR.slot * 2 + 0.018, 0], 0.012)))
  pod.add(bar)
  scene.add(pod)

  const clk = slideClock('T10', scene, devHold(HOLD10), [{ ready: Promise.resolve() }])
  const tmp = new THREE.Vector3()
  const barSlot = (k: 0 | 1, o: THREE.Vector3) => bar.getWorldPosition(o).add(tmp.set(0, k * BAR.slot + 0.018, 0))
  const warmP = v3([WARM.x, WARM.y + 0.02, WARM.z])
  const up = (o: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, k: number, arc: number) => {
    o.copy(a).lerp(b, k)
    o.y += Math.sin(k * Math.PI) * arc
    return o
  }
  return (t: number) => {
    const c = mod(clk.time(t), L10)
    const at = stAt(c)
    pod.position.set(at.x, 0.012 * Math.sin(c * TAU * (2 / L10)) * (1 - at.walking), ST.z)
    pod.updateMatrixWorld(true)

    /* B1: out of the outlet, into the request part (the plate she gives) */
    const g = T10.give
    B1.visible = c > g.reach[1] - 0.05 && c < T10.walkOut[1]
    const b1a = warmP.clone()
    const b1b = barSlot(0, new THREE.Vector3())
    const k1 = seg(c, g.reach[1], g.place[1])
    if (c < g.place[1] + 0.01) up(B1.position, b1a, b1b, k1, 0.35)
    else B1.position.copy(b1b)
    B1.scale.setScalar(lerp(0.5, 1, seg(c, g.reach[1] - 0.05, g.reach[1] + 0.2)))
    /* B2: from the shelf into the limit part, up to the ceiling (the plate he takes) */
    const tk = T10.take
    B2.visible = c < T10.walkOut[1]
    if (c < tk.reach[1]) B2.position.copy(shelfP(SHELF.p2))
    else if (c < tk.carry[1] + 0.08) up(B2.position, shelfP(SHELF.p2), barSlot(1, tmp.clone()), seg(c, tk.reach[1], tk.carry[1] + 0.08), 0.12)
    else barSlot(1, B2.position)
    /* B3: toward the bar, stopped at the ceiling, back to the shelf (the third plate) */
    const s3 = shelfP(SHELF.p3)
    const stopAt = bar.getWorldPosition(new THREE.Vector3()).add(tmp.set(0, BAR.slot * 2 + 0.045, 0))
    const go = hold(c, T10.third[0], T10.third[1], T10.third[2], T10.third[3])
    B3.position.copy(s3).lerp(stopAt, go * 0.999)
    B3.position.y += Math.sin(go * Math.PI) * 0.03
    /* the bump: a small knock back when it meets the ceiling */
    B3.position.y += 0.03 * Math.sin(seg(c, T10.third[1] - 0.05, T10.third[1] + 0.25) * Math.PI)
    const stopped = hold(c, T10.ring[0], T10.ring[1], T10.ring[2], T10.ring[3])
    ring3.position.copy(B3.position).add(tmp.set(0, 0.003, 0))
    setOp(ring3, 0.95 * stopped)
    capO.opacity = stopped
    ringO.opacity = hold(c, T10.palm[0], T10.palm[1], T10.palm[2], T10.palm[3])
    ringM.opacity = 1 - ringO.opacity
    /* BR: the fresh spare block the node puts on the shelf (the next loop's B2) */
    const rf = T10.refill
    BR.visible = c > rf.reach[1] - 0.05
    up(BR.position, warmP, shelfP(SHELF.p2), seg(c, rf.reach[1], rf.place[1]), 0.3)
    BR.scale.setScalar(lerp(0.5, 1, seg(c, rf.reach[1] - 0.05, rf.reach[1] + 0.2)))
    /* the node's lights walk; the pools bubble */
    leds.forEach((m, k) => m.color.set(k === Math.floor(mod(c * 2.5, 3)) ? '#2D63FB' : '#BFD2FF'))
    for (const b of bubbles) {
      const k = mod((c / L10) * 4 + b.ph, 1)
      b.m.position.set(b.x + 0.05 * Math.sin(b.ph * 9), CTR.h + 0.03 + k * 0.17, -0.3 + 0.1)
      ;(b.m.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.sin(k * Math.PI)
    }
  }
}

/* ================================================================== T12 · a frozen phone, a hung container */

const L12 = 6
const F12 = 60
const HOLD12 = 3.0 /* her finger pressed on the pause button, the ripple out, nothing changed, her face fallen */
const T12 = {
  lift: [0.55, 0.95] as const, // her hand comes up to the screen
  taps: [1.0, 1.85] as const,
  press: [2.4, 3.2] as const, // press and hold
  down: [3.2, 3.6] as const,
  shake: [3.6, 4.4] as const,
  fail: [2.55, 2.85, 4.6, 5.0] as const, // the concept's no-answer path and cross
}
const PERSON12 = new THREE.Vector3(-0.32, 0, 0)
const PERSON_H = 1.66
/* the concept card's container (on the node's bracket) */
const PHONE_AT = new THREE.Vector3(0.04, 1.14, -0.05)
/* her phone: in front of her, at her waist, centred; both arms come to it from their own side, elbows relaxed out, so
   neither crosses the other (review 2026-11-23: held out beside her, the tapping arm had to pass under the holding one) */
const PHONE_HELD = new THREE.Vector3(-0.3, 0.87, -0.05)
const SW = 0.134
const SH = 0.28
const PHONE_S = 1.42
const CLOCK12: V3 = [0.44, 1.68, -0.72]
/** canvas (134 x 280) to screen-local coordinates */
const sx = (cx: number) => (cx / 134 - 0.5) * SW
const sy = (cy: number) => (0.5 - cy / 280) * SH
const TAP = { x: 67, y: 228 } // the pause button

function frameCam12(camera: THREE.PerspectiveCamera) {
  camera.fov = 30
  camera.position.set(-0.08, 1.34, 2.3)
  camera.lookAt(-0.08, 1.24, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}
function room12(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#E7EEFA' : '#DCE7F7')
  scene.add(floorPlane(8, 6, mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [8, 6]) : tileTex('#D9C4A6', '#C8B08F', 2, [10, 6]), roughness: 0.85 }), [0, 0, 1]))
  scene.add(flat(box(8, 3.2, 0.1, mat(concept ? '#EAF0FA' : '#E9E1F2', { roughness: 0.95, emissive: new THREE.Color(concept ? '#EAF0FA' : '#E9E1F2'), emissiveIntensity: 0.25 }), [0, 1.6, -0.8])))
  scene.add(flat(box(8, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0, 0.05, -0.74])))
}
/** the wall clock (and the concept's probe-period dial): a face, twelve marks, a hand that ticks once each half second */
function dial(scene: THREE.Scene, concept: boolean) {
  const g = new THREE.Group()
  g.position.set(...CLOCK12)
  const rim = concept ? C.brand : '#5A4636'
  g.add(cyl(0.17, 0.17, 0.035, mat(rim, { roughness: 0.4 }), [0, 0, 0], 48))
  ;(g.children[0] as THREE.Mesh).rotation.x = Math.PI / 2
  const face = canvasTex(96, 96, (k) => {
    k.fillStyle = '#FFFFFF'
    k.beginPath()
    k.arc(48, 48, 47, 0, TAU)
    k.fill()
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU
      k.fillStyle = concept ? (i % 3 === 0 ? C.brand : '#9DB9F5') : C.navy
      k.beginPath()
      k.arc(48 + Math.sin(a) * 38, 48 - Math.cos(a) * 38, i % 3 === 0 ? 4 : 2.4, 0, TAU)
      k.fill()
    }
    k.fillStyle = concept ? C.brand : C.navy
    k.beginPath()
    k.arc(48, 48, 4, 0, TAU)
    k.fill()
  })
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), basic(face, { transparent: false }))
  f.position.z = 0.019
  g.add(f)
  const hand = new THREE.Group()
  hand.position.z = 0.024
  hand.add(flat(box(0.008, 0.12, 0.004, mat(concept ? C.orange : '#D8352F', { roughness: 0.4 }), [0, 0.045, 0])))
  g.add(hand)
  const shortHand = flat(box(0.014, 0.07, 0.004, mat(concept ? C.navy : C.navy, { roughness: 0.4 }), [0, 0.03, 0.021]))
  shortHand.rotation.z = -1.1
  g.add(shortHand)
  scene.add(g)
  return {
    update(c: number) {
      /* a tick each 0.5 s: twelve a loop, so the loop closes on the same mark */
      const n = Math.floor(c / 0.5)
      const k = seg(c - n * 0.5, 0, 0.12)
      hand.rotation.z = -((n + k) / 12) * TAU
    },
  }
}

/** the phone screen, in canvas units (134 x 280): a video, its buffering ring, its progress bar, the pause button */
function frozenScreen() {
  return canvasTex(134, 280, (k) => {
    rr(k, 0, 0, 134, 280, 10, '#FFFFFF')
    /* status bar */
    rr(k, 10, 7, 22, 6, 3, '#C3CEE2')
    k.fillStyle = '#C3CEE2'
    for (let i = 0; i < 3; i++) k.fillRect(104 + i * 6, 12 - i * 2.5, 4, 2 + i * 2.5)
    /* the video: sky, sun, hills */
    const sky = k.createLinearGradient(0, 24, 0, 150)
    sky.addColorStop(0, '#7FB2FF')
    sky.addColorStop(1, '#CFE3FF')
    k.fillStyle = sky
    k.fillRect(6, 24, 122, 130)
    k.fillStyle = '#FFD35A'
    k.beginPath()
    k.arc(98, 52, 12, 0, TAU)
    k.fill()
    k.fillStyle = '#5FB06B'
    k.beginPath()
    k.moveTo(6, 154)
    k.quadraticCurveTo(40, 96, 76, 130)
    k.quadraticCurveTo(100, 108, 128, 126)
    k.lineTo(128, 154)
    k.closePath()
    k.fill()
    k.fillStyle = '#3F8F4F'
    k.beginPath()
    k.moveTo(6, 154)
    k.quadraticCurveTo(60, 120, 128, 146)
    k.lineTo(128, 154)
    k.closePath()
    k.fill()
    /* the buffering ring, stopped part way round */
    k.strokeStyle = 'rgba(255,255,255,0.95)'
    k.lineWidth = 5
    k.lineCap = 'round'
    k.beginPath()
    k.arc(67, 90, 16, -Math.PI / 2, Math.PI * 0.7)
    k.stroke()
    /* the progress bar, its knob */
    rr(k, 12, 172, 110, 6, 3, '#DCE4F4')
    rr(k, 12, 172, 46, 6, 3, C.brand)
    k.fillStyle = C.brand
    k.beginPath()
    k.arc(58, 175, 7, 0, TAU)
    k.fill()
    /* the controls: back, pause, forward */
    k.fillStyle = '#DCE4F4'
    k.beginPath()
    k.arc(TAP.x, TAP.y, 26, 0, TAU)
    k.fill()
    rr(k, TAP.x - 9, TAP.y - 11, 6, 22, 2, C.navy)
    rr(k, TAP.x + 3, TAP.y - 11, 6, 22, 2, C.navy)
    k.fillStyle = '#AEB8CC'
    for (const d of [-1, 1]) {
      k.beginPath()
      k.moveTo(TAP.x + d * 38, TAP.y - 8)
      k.lineTo(TAP.x + d * 50, TAP.y)
      k.lineTo(TAP.x + d * 38, TAP.y + 8)
      k.closePath()
      k.fill()
    }
  })
}
/** a touch ripple: a ring that grows and fades on the glass */
function ripple(r0: number, color: string) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0 * 0.7, r0, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
  m.renderOrder = 6
  return m
}
/** taps (tap times and the press) -> the newest ripple's age */
const tapAge = (c: number) => {
  const ts = [T12.taps[0], T12.taps[1], T12.press[0], T12.press[0] + 0.4]
  let age = 9
  for (const t0 of ts) if (c >= t0 && c - t0 < age) age = c - t0
  return age
}

/* ------------------------------------------------------------------ T12 everyday: the frozen phone */

function setupT12Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam12(camera)
  lights(scene, [0, 1.1, 0], 3.2)
  room12(scene, false)
  const clock = dial(scene, false)

  /* the phone: dark body, the lit (frozen) screen, a soft glow behind the glass */
  const ph = new THREE.Group()
  ph.add(box(SW + 0.016, SH + 0.022, 0.016, mat('#1C2233', { roughness: 0.3, metalness: 0.5 }), [0, 0, 0], 0.012))
  ph.add(flat(box(0.03, 0.006, 0.002, mat('#2E354A'), [0, SH / 2 + 0.004, 0.0085])))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), basic(frozenScreen(), { depthWrite: false }))
  scr.position.z = 0.0086
  scr.renderOrder = 5
  ph.add(scr)
  const rp = ripple(0.042, C.brand)
  rp.position.set(sx(TAP.x), sy(TAP.y), 0.0095)
  ph.add(rp)
  ph.scale.setScalar(PHONE_S)
  scene.add(ph)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ map: haloTex('rgba(200,220,255,0.8)'), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.5 }))
  scene.add(glow)

  const cfg = who(CAST_PRESETS.ananya, { name: 'Student', hair: { style: 'ponytail', color: '#2A2324' }, outfit: { top: 'hoodie', topColor: '#E4578F', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { earrings: true } })
  const b: Body = { cfg, root: PERSON12.clone(), h: PERSON_H, sh: buildSkin(cfg).shoulderHalf }
  const yaw = Math.atan2(camera.position.x - PHONE_HELD.x, camera.position.z - PHONE_HELD.z)
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, yaw, 0))
  /* her L hand grips the phone's left edge, low; the phone sits at PHONE_HELD, a small shake while she checks it */
  const gripP = new THREE.Vector3(-SW * 0.48, -SH * 0.47, 0).multiplyScalar(PHONE_S).applyQuaternion(q)
  const shakeOf = (c: number) => 0.012 * Math.sin(((c - T12.shake[0]) / (T12.shake[1] - T12.shake[0])) * TAU * 3) * hold(c, T12.shake[0], T12.shake[0] + 0.1, T12.shake[1] - 0.1, T12.shake[1])
  const phoneAt = (c: number) => PHONE_HELD.clone().add(new THREE.Vector3(shakeOf(c), 0.02 * hold(c, T12.shake[0], T12.shake[0] + 0.3, T12.shake[1], T12.shake[1] + 0.4), 0))
  /** of the two elbows, the one out at her side (a relaxed bend, never folded across her front) */
  const outward = (side: 'L' | 'R', w: THREE.Vector3): Arm => {
    const pt = worldToRig(w, b.root, b.h, camera)
    const a = ik2(side, b.sh, pt, false)
    const d = ik2(side, b.sh, pt, true)
    return Math.sin(a.s * DEG) >= Math.sin(d.s * DEG) ? a : d
  }
  const holdL = (c: number) => outward('L', phoneAt(c).add(gripP))
  /* her R index finger on the pause button: her forearm comes down from her right elbow, so the grip sits above right
     of the fingertip and the finger carries on along the forearm onto the button */
  const tapW = (lift: number) => PHONE_HELD.clone().add(new THREE.Vector3(sx(TAP.x), sy(TAP.y), 0).multiplyScalar(PHONE_S).applyQuaternion(q)).add(new THREE.Vector3(0.06, 0.01 + lift, 0))
  const restR: Arm = { s: 8, e: 18 }
  const fingerR = (c: number) => {
    /* down onto the glass at each tap, held for the press */
    let press = 0
    for (const t0 of T12.taps) press = Math.max(press, hold(c, t0 - 0.12, t0, t0 + 0.04, t0 + 0.18))
    press = Math.max(press, hold(c, T12.press[0] - 0.12, T12.press[0], T12.press[1], T12.press[1] + 0.1))
    const target = outward('R', tapW(0.03 * (1 - press)))
    return mixArm(restR, target, hold(c, T12.lift[0], T12.lift[1], T12.down[0], T12.down[1]))
  }
  const her = person({
    config: cfg,
    seed: 2121,
    faces: [[0, 'neutral'], [1.15, 'thinking'], [1.95, 'confused'], [2.6, 'worried'], [4.4, 'skeptical'], [5.2, 'neutral']],
    loop: L12,
    frames: F12,
    height: PERSON_H,
    redraw,
    holdT: devHold(HOLD12),
    pose: (p, c) => {
      setArms(p, holdL(c), fingerR(c))
      grip(p, 'L', 1)
      /* the R hand points: index straight, the rest curled */
      const point = hold(c, T12.lift[0], T12.lift[1], T12.down[0], T12.down[1])
      to(p, 'fR1', 0, point)
      to(p, 'fR2', 0.95, point)
      to(p, 'fR3', 1, point)
      to(p, 'fR4', 1, point)
      to(p, 'tR', 0.8, point)
      to(p, 'palmR', 0.2, point)
      /* she looks down at the phone the whole time; a small lean in when it fails */
      to(p, 'headTurn', 0.05, 1)
      to(p, 'headNod', 0.5, 1)
      to(p, 'lookX', 0.1, 1)
      to(p, 'lookY', 1, 1)
      to(p, 'headTilt', 5, hold(c, 2.6, 2.9, 4.3, 4.7))
    },
  })
  her.object.position.copy(PERSON12)
  scene.add(her.object)
  /* The phone is in front of her body, and her forearms and hands are in front of the phone, as they are in life. One
     sprite cannot layer that, so her forearms and hands are drawn a second time in front of the phone: the same frame
     on a copy of her plane, scaled about the camera (so it lands on exactly the same pixels), keeping only the pixels
     inside each forearm (a capsule from elbow to hand, just inside the sleeve's width) and the skin-coloured pixels
     round each hand. */
  const plane = (her as unknown as { plane: THREE.Mesh }).plane
  const planeM = plane.material as THREE.MeshBasicMaterial
  const fore = { value: [new THREE.Vector4(), new THREE.Vector4()] }
  const hands = { value: [new THREE.Vector3(), new THREE.Vector3()] }
  const frontM = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false })
  frontM.map = planeM.map
  frontM.onBeforeCompile = (sh) => {
    sh.uniforms.uFore = fore
    sh.uniforms.uHand = hands
    /* the plane's own uv (vMapUv carries the frame texture's transform) */
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec2 vPlaneUv;\nvoid main() {\n  vPlaneUv = uv;')
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec4 uFore[2];\nuniform vec3 uHand[2];\nvarying vec2 vPlaneUv;\nvoid main() {')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec2 r = vec2(vPlaneUv.x * 480.0 - 40.0, (1.0 - vPlaneUv.y) * 600.0); // rig px (person()'s wide: 40)
          vec3 k = diffuseColor.rgb;
          bool skin = k.r > 0.08 && k.g > 0.38 * k.r && k.g < 0.97 * k.r && k.b < 0.95 * k.g;
          bool keep = false;
          for (int i = 0; i < 2; i++) {
            vec2 pa = r - uFore[i].xy;
            vec2 ba = uFore[i].zw - uFore[i].xy;
            float u = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0), 0.0, 1.0);
            if (length(pa - ba * u) < 11.5) keep = true;
            if (skin && distance(r, uHand[i].xy) < uHand[i].z) keep = true;
          }
          if (!keep) discard;
        }`,
      )
  }
  frontM.customProgramCacheKey = () => 't12-hands'
  const front = new THREE.Mesh(plane.geometry, frontM)
  front.matrixAutoUpdate = false
  front.renderOrder = 7
  scene.add(front)
  /** the elbow of an arm, rig px (handPt's forward kinematics, upper arm only) */
  const elbowPt = (side: 'L' | 'R', a: Arm): Pt => {
    const sg = side === 'L' ? -1 : 1
    return { x: 200 + sg * (b.sh - 6) + sg * Math.sin(a.s * DEG) * UA, y: 205 + Math.cos(a.s * DEG) * UA }
  }
  const setArm = (i: number, side: 'L' | 'R', a: Arm) => {
    const e = elbowPt(side, a)
    const h = handPt(side, b.sh, a)
    fore.value[i].set(e.x, e.y, h.x, h.y)
    hands.value[i].set(h.x, h.y, 48)
  }
  /** p moved toward the camera along its own ray, by d */
  const camW = new THREE.Vector3()
  const alongRay = (p: THREE.Vector3, d: number) => {
    camera.getWorldPosition(camW)
    const dist = p.distanceTo(camW)
    return p.sub(camW).multiplyScalar(1 - d / dist).add(camW)
  }
  const scaleAbout = new THREE.Matrix4()
  const clk = slideClock('T12', scene, devHold(HOLD12), [her])
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L12)
    const cq = frameT(c, L12, F12)
    her.update(c, camera)
    /* the phone in her hand: where the drawn hand is */
    rigToWorld(handPt('L', b.sh, holdL(cq)), PERSON_H, PERSON12, camera, hand)
    ph.quaternion.copy(q)
    ph.position.copy(hand).sub(gripP)
    /* the glow stays behind her (light round the phone's edges), the phone comes in front of her */
    glow.position.copy(ph.position).add(new THREE.Vector3(0, 0, -0.06))
    glow.quaternion.copy(q)
    alongRay(ph.position, 0.04)
    /* her forearms and hands again, in front of the phone */
    if (frontM.map !== planeM.map) frontM.map = planeM.map
    setArm(0, 'L', holdL(cq))
    setArm(1, 'R', fingerR(cq))
    plane.updateWorldMatrix(true, false)
    camera.getWorldPosition(camW)
    const dist = camW.distanceTo(PERSON12)
    const k8 = 1 - 0.08 / dist
    scaleAbout.makeTranslation(camW.x, camW.y, camW.z).multiply(new THREE.Matrix4().makeScale(k8, k8, k8)).multiply(new THREE.Matrix4().makeTranslation(-camW.x, -camW.y, -camW.z))
    front.matrix.copy(scaleAbout).multiply(plane.matrixWorld)
    front.matrixWorldNeedsUpdate = true
    front.visible = plane.visible
    /* the screen stays lit and does not change; only the ripple of each touch shows */
    const age = tapAge(c)
    const k = clamp01(age / 0.45)
    rp.scale.setScalar(0.4 + k * 1.3)
    setOp(rp, age < 0.45 ? 0.85 * (1 - k) : 0)
    clock.update(c)
  }
}

/* ------------------------------------------------------------------ T12 concept: the hung container */

function setupT12Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam12(camera)
  lights(scene, [0, 1.1, 0], 3.2)
  room12(scene, true)
  const clock = dial(scene, true)
  const white = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.3 })

  /* the node (her place): a white tower, its mark at head height, a status ring that turns orange */
  const N = { x: PERSON12.x, top: 1.62, w: 0.36 }
  scene.add(box(N.w, N.top, 0.3, mat('#2B3F86', { roughness: 0.35, emissive: new THREE.Color('#2B3F86'), emissiveIntensity: 0.2 }), [N.x, N.top / 2, -0.06], 0.05))
  scene.add(flat(box(0.3, 0.3, 0.02, white, [N.x, 1.42, 0.09], 0.03)))
  for (let k = 0; k < 2; k++) scene.add(flat(box(0.26, 0.04, 0.02, mat('#3E56A6', { roughness: 0.4 }), [N.x, 1.06 - k * 0.07, 0.09], 0.01)))
  const nodeMark = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), basic(markTex(nodeUrl, redraw), { transparent: false }))
  nodeMark.position.set(N.x, 1.42, 0.102)
  scene.add(nodeMark)
  const ringM = new THREE.MeshBasicMaterial({ color: C.brand, toneMapped: false, transparent: true })
  scene.add(mesh(new THREE.TorusGeometry(0.168, 0.012, 10, 48), ringM, [N.x, 1.42, 0.1]))
  const ringO = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })
  scene.add(mesh(new THREE.TorusGeometry(0.168, 0.014, 10, 48), ringO, [N.x, 1.42, 0.103]))
  const leds = [0, 1, 2].map((k) => {
    const m = new THREE.MeshBasicMaterial({ color: '#7FA6FF', toneMapped: false })
    scene.add(mesh(new THREE.SphereGeometry(0.014, 12, 8), m, [N.x + 0.05 + k * 0.04, 1.2, 0.105]))
    return m
  })

  /* the container (the phone's place), on the node's bracket (her holding hand) */
  const yaw = Math.atan2(camera.position.x - PHONE_AT.x, camera.position.z - PHONE_AT.z)
  const ct = new THREE.Group()
  ct.position.copy(PHONE_AT)
  ct.quaternion.setFromEuler(new THREE.Euler(-0.08, yaw, 0))
  const CW = SW * PHONE_S + 0.04
  const CH = SH * PHONE_S + 0.02
  const blue = mat(C.brand, { roughness: 0.35, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.15 })
  ct.add(box(CW + 0.06, CH + 0.06, 0.16, blue, [0, 0, -0.08], 0.02))
  /* its corrugated sides (a container, drawn): ribs down both edges of the front */
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) ct.add(flat(box(0.008, CH + 0.02, 0.012, mat('#5B88FF', { roughness: 0.35 }), [sd * (CW / 2 + 0.01 + k * 0.014), 0, 0.001])))
  for (const sd of [-1, 1]) ct.add(flat(box(CW + 0.06, 0.016, 0.012, mat('#1F47C4', { roughness: 0.35 }), [0, sd * (CH / 2 + 0.022), 0.001])))
  /* the panel: lit, frozen: a gear that does not turn, a bar that does not fill, the port the probe taps */
  const panel = canvasTex(134, 280, (k) => {
    rr(k, 0, 0, 134, 280, 10, '#FFFFFF')
    /* the gear (the process), still */
    k.fillStyle = '#9DB9F5'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      k.save()
      k.translate(67 + Math.cos(a) * 30, 90 + Math.sin(a) * 30)
      k.rotate(a)
      rr(k, -7, -7, 14, 14, 3, '#9DB9F5')
      k.restore()
    }
    k.beginPath()
    k.arc(67, 90, 30, 0, TAU)
    k.fill()
    k.fillStyle = '#FFFFFF'
    k.beginPath()
    k.arc(67, 90, 12, 0, TAU)
    k.fill()
    /* the bar, stopped part way */
    rr(k, 12, 172, 110, 6, 3, '#DCE4F4')
    rr(k, 12, 172, 46, 6, 3, C.brand)
    /* the port */
    k.fillStyle = '#DCE4F4'
    k.beginPath()
    k.arc(TAP.x, TAP.y, 26, 0, TAU)
    k.fill()
    k.fillStyle = C.navy
    k.beginPath()
    k.arc(TAP.x, TAP.y, 12, 0, TAU)
    k.fill()
    k.fillStyle = '#FFFFFF'
    k.beginPath()
    k.arc(TAP.x, TAP.y, 5, 0, TAU)
    k.fill()
  })
  const pan = new THREE.Mesh(new THREE.PlaneGeometry(SW * PHONE_S, SH * PHONE_S), basic(panel, { depthWrite: false }))
  pan.position.z = 0.002
  pan.renderOrder = 5
  ct.add(pan)
  /* its green "running" light, on top */
  const greenM = new THREE.MeshBasicMaterial({ color: C.green, toneMapped: false })
  ct.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), greenM, [CW / 2 - 0.03, CH / 2 + 0.045, -0.06]))
  const greenGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ map: haloTex('rgba(34,197,94,0.9)'), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.6 }))
  greenGlow.position.set(CW / 2 - 0.03, CH / 2 + 0.045, -0.04)
  ct.add(greenGlow)
  const rp = ripple(0.042 * PHONE_S, C.brand)
  rp.position.set(sx(TAP.x) * PHONE_S, sy(TAP.y) * PHONE_S, 0.004)
  ct.add(rp)
  scene.add(ct)
  ct.updateMatrixWorld(true)
  /* the bracket: from the node's side to the container's lower right edge (her R hand's grip) */
  const brM = mat('#C9D6F2', { roughness: 0.4 })
  const gripW = ct.localToWorld(new THREE.Vector3(CW / 2 - 0.02, -CH / 2 + 0.02, -0.1))
  scene.add(box(Math.abs(gripW.x - (N.x + N.w / 2)) + 0.04, 0.035, 0.05, brM, [(gripW.x + N.x + N.w / 2) / 2, 0.86, -0.1], 0.01))
  scene.add(box(0.035, gripW.y - 0.86 + 0.02, 0.05, brM, [gripW.x, (gripW.y + 0.86) / 2, -0.1], 0.01))

  /* the probe arm (her tapping hand): a shoulder on the node, two links, a probe head */
  const tapPt = ct.localToWorld(new THREE.Vector3(sx(TAP.x) * PHONE_S, sy(TAP.y) * PHONE_S, 0.006))
  const SHO = new THREE.Vector3(N.x + N.w / 2 + 0.01, 1.3, 0.06)
  const L1 = 0.27
  const L2 = 0.27
  const armM = mat('#FFFFFF', { roughness: 0.35 })
  const jointM = mat(C.navy, { roughness: 0.35 })
  scene.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), jointM, [SHO.x, SHO.y, SHO.z]))
  const link1 = box(0.04, L1, 0.04, armM, [0, 0, 0], 0.018)
  const link2 = box(0.034, L2, 0.034, armM, [0, 0, 0], 0.015)
  const elbow = mesh(new THREE.SphereGeometry(0.03, 16, 12), jointM)
  const tip = new THREE.Group()
  tip.add(mesh(new THREE.SphereGeometry(0.024, 16, 12), mat(C.brand, { roughness: 0.3, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.3 })))
  scene.add(link1, link2, elbow, tip)
  const rest = SHO.clone().add(new THREE.Vector3(0.12, -0.42, 0))
  const place = (m: THREE.Object3D, a: THREE.Vector3, b2: THREE.Vector3) => {
    m.position.copy(a).add(b2).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b2.clone().sub(a).normalize())
  }
  /** the elbow for a tip at p (two links in the picture plane, the elbow below) */
  const elbowFor = (p: THREE.Vector3) => {
    const d = p.clone().sub(SHO)
    const len = Math.min(d.length(), L1 + L2 - 0.001)
    const a = Math.acos(clamp01((L1 * L1 + len * len - L2 * L2) / (2 * L1 * len)))
    const base = Math.atan2(d.y, d.x)
    return SHO.clone().add(new THREE.Vector3(Math.cos(base - a) * L1, Math.sin(base - a) * L1, d.z * (L1 / (L1 + L2))))
  }
  /* the ping (the probe's request) and the answer path that never comes: dashed, faded, an orange cross */
  const ping = mesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshBasicMaterial({ color: C.brand, toneMapped: false, transparent: true }))
  scene.add(ping)
  const from = ct.localToWorld(new THREE.Vector3(-CW / 2 + 0.03, CH / 2 - 0.03, 0.01))
  const toN = new THREE.Vector3(N.x + 0.17, 1.52, 0.1)
  const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + toN.x) / 2, 1.72, 0.1), toN)
  const dashes = new THREE.Group()
  const dashM = new THREE.MeshBasicMaterial({ color: '#7F95BF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
  for (let i = 0; i < 9; i++) {
    const a = curve.getPoint(i / 9 + 0.02)
    const b2 = curve.getPoint(i / 9 + 0.07)
    const d = mesh(new THREE.CylinderGeometry(0.006, 0.006, a.distanceTo(b2), 8), dashM)
    place(d, a, b2)
    dashes.add(d)
  }
  scene.add(dashes)
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), basic(crossTex(), { opacity: 0, depthWrite: false }))
  cross.position.copy(curve.getPoint(0.72)).add(new THREE.Vector3(0, 0, 0.02))
  cross.renderOrder = 7
  scene.add(cross)

  const clk = slideClock('T12', scene, devHold(HOLD12), [{ ready: Promise.resolve() }])
  const tipP = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L12)
    /* the arm: up to the port at the taps and the press, back to rest */
    let press = 0
    for (const t0 of T12.taps) press = Math.max(press, hold(c, t0 - 0.12, t0, t0 + 0.04, t0 + 0.18))
    press = Math.max(press, hold(c, T12.press[0] - 0.12, T12.press[0], T12.press[1], T12.press[1] + 0.1))
    const up = hold(c, T12.lift[0], T12.lift[1], T12.down[0], T12.down[1])
    const hover = tapPt.clone().add(new THREE.Vector3(-0.02, -0.02, 0.05 * (1 - press) + 0.012))
    tipP.copy(rest).lerp(hover, up)
    const el = elbowFor(tipP)
    place(link1, SHO, el)
    place(link2, el, tipP)
    elbow.position.copy(el)
    tip.position.copy(tipP)
    /* the ping: along the arm to the tip and into the port, at each touch; nothing comes back */
    const age = tapAge(c)
    const k = clamp01(age / 0.45)
    rp.scale.setScalar(0.4 + k * 1.3)
    setOp(rp, age < 0.45 ? 0.85 * (1 - k) : 0)
    const pk = clamp01((age + 0.3) / 0.3)
    ping.visible = age < 0.3 || (age > 8 && false)
    ping.position.copy(tipP).lerp(tapPt, pk)
    /* before each touch the ping rides the arm out */
    let lead = -1
    for (const t0 of [T12.taps[0], T12.taps[1], T12.press[0]]) if (c > t0 - 0.35 && c < t0) lead = (c - (t0 - 0.35)) / 0.35
    if (lead >= 0) {
      ping.visible = true
      if (lead < 0.5) ping.position.copy(SHO).lerp(el, lead * 2)
      else ping.position.copy(el).lerp(tipP, (lead - 0.5) * 2)
      ;(ping.material as THREE.MeshBasicMaterial).opacity = 1
    } else if (age < 0.3) {
      ping.position.copy(tipP).lerp(tapPt, clamp01(age / 0.15))
      ;(ping.material as THREE.MeshBasicMaterial).opacity = 1 - clamp01(age / 0.3)
    } else ping.visible = false
    /* no answer: the expected path dashed and faded, an orange cross before the node, the node's ring orange */
    const fail = hold(c, T12.fail[0], T12.fail[1], T12.fail[2], T12.fail[3])
    dashM.opacity = 0.7 * fail
    setOp(cross, fail)
    cross.scale.setScalar(0.6 + 0.4 * fail)
    cross.quaternion.copy(camera.quaternion)
    ringO.opacity = fail
    ringM.opacity = 1 - fail
    /* it still looks running: the green light steady, a soft breath of glow */
    setOp(greenGlow, 0.45 + 0.2 * Math.sin((c / L12) * TAU * 3))
    leds.forEach((m, i) => m.color.set(i === Math.floor(mod(c * 2, 3)) ? '#2D63FB' : '#BFD2FF'))
    clock.update(c)
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
  I_T10Everyday: card('T10', setupT10Everyday, devHold(HOLD10)),
  I_T10Concept: card('T10', setupT10Concept, devHold(HOLD10)),
  I_T12Everyday: card('T12', setupT12Everyday, devHold(HOLD12)),
  I_T12Concept: card('T12', setupT12Concept, devHold(HOLD12)),
}
export const css = ''
