import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER I · SESSION 20 (Kubernetes Fundamentals) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 18's h/i/j.tsx are: a perspective camera on a real place, Character Lab people from the
 * engine's `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO TEXT on
 * either card (a door's number plate is an object), ONE wall-clock loop per slide shared by both cards beat for beat
 * (custom/clock.tsx: the cards fade in once every person has a first frame, a tap pauses both), every loop ending in
 * the state it starts in (every periodic motion turns a whole number of times a loop), held frames (`?still`,
 * thumbnails) at HOLD. Nobody walks: people stand and reach. Props in a hand follow the frame the sprite is showing.
 *
 * SLIDE 24 · T09-AN (TR 9): "A pod is like one PG room shared by flatmates: they share the same address and same
 * kitchen, exactly as pod containers share one IP and one set of volumes."
 *
 *   place (x)        everyday: one PG room (cut away)                concept: one pod (its glass walls)
 *   -1.55            the room's ONE door, its number plate, the      the pod's ONE network port (its IP), the cable
 *                    letter slot and the letter box under it         from outside plugged into it
 *    0.0             flatmate 1 (blue tee, apron), stirring his pot   container 1 (blue), its work ring turning
 *    0.55            the ONE stove and the shared spice tin          the ONE shared volume, mounted into both
 *    1.1             flatmate 2 (teal hoodie), stirring his pan       container 2 (teal), its work ring turning
 *   counter          the kitchen counter both cook at                 the platform the volume stands on
 *
 *   1.3 - 2.7        flatmate 1 takes a pinch from the shared tin     container 1 reads from the shared volume
 *   4.3 - 5.7        flatmate 2 takes a pinch from the SAME tin       container 2 reads from the SAME volume
 *   6.1 / 6.55       two letters (blue, teal) come in through the     two packets (blue, teal) come in through the ONE
 *                    ONE door slot; both look round at the door       port and ride on to container 1 and container 2
 *
 * SLIDE 33 · T14-AN (TR 14): "A water tank with an automatic motor switch keeps checking the water level. When the
 * level drops, the motor turns on and refills it to full. In the same way, a Deployment keeps checking the pod count
 * and restores it whenever it drops."
 *
 *   place (x)        everyday: a house's rooftop terrace             concept: a Deployment keeping its pods
 *   -1.75            the pump motor on its pad (fan behind a grille)  the controller (a gear core) on the same pad
 *   pipe             the delivery pipe up and over to the tank        the glass tube up and over to the case
 *   -1.0             the motor switch box on its post (a lamp)        the controller's lamp box on its post
 *    0.1             the translucent tank on its brick stand, the    the glass case on the stand: three pods in a row,
 *                    water level inside, FULL                        each over its slot (the desired count, FULL)
 *   -0.22            the float switch riding the water level         the sensor on the lid, its beam sweeping the row
 *    1.1             the tap at the tank's outlet, a floor drain     the outlet chute, the drain where a failed pod goes
 *    1.52            a resident washing her hands at the tap         (none: the cause of the drop)
 *
 *   0.5 - 3.0        she opens the tap; water runs, the level drops   a pod fails (orange), slides out and is gone:
 *                    to two thirds; she closes the tap                the count drops from three to two
 *   3.05             the float is down: the switch trips (lamp on)    the sensor sees the gap (lamp on, slot glows)
 *   3.1 - 6.4        the motor runs: the fan spins, water climbs      the controller runs: a new pod is made, climbs
 *                    the pipe and pours in, the level rises to full   the tube and drops into the empty slot
 *   6.4              the float is up: the switch cuts the motor       the count is three: lamp off, a green tick
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
  brandDark: '#1F47C4',
  navy: '#1F2E63',
  orange: '#FF8A3D',
  green: '#22C55E',
  /* flatmate / container 1 and 2 */
  one: '#2D63FB',
  oneDark: '#1F47C4',
  two: '#14A89A',
  twoDark: '#0E7F74',
  water: '#3E8EF0',
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

/**
 * A turning part whose speed follows `speed(c)` over a loop of L seconds, as an angle that is continuous across the
 * seam: the integral of the speed, scaled so one loop is a whole number of `unit` turns (a fan blade, a gear tooth).
 */
function spinner(L: number, speed: (c: number) => number, turnsPerLoop: number, unit = TAU) {
  const N = 960
  const cum = new Float32Array(N + 1)
  for (let i = 0; i < N; i++) cum[i + 1] = cum[i] + speed(((i + 0.5) / N) * L)
  const total = cum[N] || 1
  const scale = (Math.max(1, Math.round(turnsPerLoop)) * unit) / total
  return (c: number) => {
    const x = (mod(c, L) / L) * N
    const i = Math.floor(x)
    const f = x - i
    return (cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * f) * scale
  }
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
/** wooden floor planks */
const plankTex = (base: string, line: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = line
      g.lineWidth = 2
      for (let r = 0; r < 4; r++) {
        g.beginPath()
        g.moveTo(0, r * 32)
        g.lineTo(128, r * 32)
        g.stroke()
        const off = (r % 2) * 64 + 20
        g.beginPath()
        g.moveTo(off, r * 32)
        g.lineTo(off, r * 32 + 32)
        g.stroke()
      }
    },
    repeat,
  )
/** bricks in mortar */
const brickTex = (repeat: [number, number]) =>
  canvasTex(
    128,
    64,
    (g) => {
      g.fillStyle = '#E4D7C6'
      g.fillRect(0, 0, 128, 64)
      const cols = ['#C7643F', '#BD5A37', '#CF6E47', '#B9563A']
      for (let r = 0; r < 4; r++)
        for (let k = -1; k < 3; k++) {
          const x = k * 64 + (r % 2) * 32 + 2
          g.fillStyle = cols[(r + k + 4) % 4]
          g.beginPath()
          g.roundRect(x, r * 16 + 2, 60, 12, 2)
          g.fill()
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
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
/** a soft glow; normal blending, so a coloured glow stays its colour on a light scene (additive goes white) */
function halo(color: string, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
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
const glass = (color: string, opacity: number, glow = 0.12) => new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.0, transparent: true, opacity, depthWrite: false, emissive: new THREE.Color(color), emissiveIntensity: glow })
/** a straight rod from a to b (a pipe run, a wire, a rail) */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, segs = 12) {
  const t = mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), segs), m)
  t.position.copy(a).add(b).multiplyScalar(0.5)
  t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return t
}
/** an orthogonal path with soft (rounded) elbows */
function roundPath(pts: V3[], rad = 0.08) {
  const P = pts.map(v3)
  const path = new THREE.CurvePath<THREE.Vector3>()
  let cur = P[0].clone()
  for (let i = 1; i < P.length; i++) {
    const b = P[i]
    if (i < P.length - 1) {
      const c = P[i + 1]
      const d1 = b.clone().sub(cur)
      const l1 = d1.length()
      d1.normalize()
      const d2 = c.clone().sub(b)
      const l2 = d2.length()
      d2.normalize()
      const r = Math.min(rad, l1 / 2, l2 / 2)
      const p1 = b.clone().addScaledVector(d1, -r)
      const p2 = b.clone().addScaledVector(d2, r)
      path.add(new THREE.LineCurve3(cur, p1))
      path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2))
      cur = p2
    } else path.add(new THREE.LineCurve3(cur, b.clone()))
  }
  return path
}
function tube(scene: THREE.Scene, pts: V3[], r: number, m: THREE.Material, rad = 0.1) {
  const path = roundPath(pts, rad)
  const o = new THREE.Mesh(new THREE.TubeGeometry(path, 240, r, 16, false), m)
  o.castShadow = true
  scene.add(o)
  return { path, o }
}

function lights(scene: THREE.Scene, target: V3, key = 2.0) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 1.0))
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 3, target[1] + 9, target[2] + 8)
  k.target.position.set(...target)
  k.castShadow = true
  k.shadow.mapSize.set(2048, 2048)
  k.shadow.camera.left = -6
  k.shadow.camera.right = 6
  k.shadow.camera.top = 6
  k.shadow.camera.bottom = -6
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
/* every person on these cards: frames at one fixed size (no re-sizing, which hid a person while a new set was built)
   and no idle breathing (a still pose is then one shared picture), Session 16 round 3 */
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
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
/** a cook's apron over the tee, rig body frame 400 x 600 */
const APRON = (cloth: string, edge: string) => (
  <g data-part="apron">
    <path d="M 184 206 L 180 240 M 216 206 L 220 240" stroke={edge} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 178 240 L 222 240 L 224 300 Q 244 304 248 316 L 252 440 Q 200 450 148 440 L 152 316 Q 156 304 176 300 Z" fill={cloth} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <rect x={180} y={346} width={40} height={28} rx={6} fill="none" stroke={edge} strokeWidth={2} />
  </g>
)

/* ---- hands: forward kinematics in the rig's 400 x 600 frame and the inverse, so a hand lands on the thing it
   reaches for (Session 15 / 18) ---- */

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
/** the hand of the frame the sprite is showing, in the world (a prop in that hand goes here) */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.06)
}
/** the loop time of the frame a sprite of F frames is showing at c (props in a hand follow the drawn frame) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)

/** an arm built from spans: each [a, b, c, d] eases from the arm so far to `target` and back */
type Span = [number, number, number, number, Arm | ((c: number) => Arm)]
function armFrom(c: number, base: Arm | ((c: number) => Arm), spans: Span[]): Arm {
  let a = typeof base === 'function' ? base(c) : base
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
const reach = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, dy = 0): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  return ik(side, b.sh, { x: p.x, y: p.y + dy })
}
/**
 * The same, for a hand that keeps moving round one place (stirring, shaking, rubbing): of the two elbow solutions, the
 * one nearest the arm at that place's centre, so the elbow never flips from one side to the other mid-motion (the
 * lower-elbow rule flipped it twice a stir).
 */
const reachNear = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, ref: Arm): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  const x = ik2(side, b.sh, p, false)
  const y = ik2(side, b.sh, p, true)
  const dist = (a: Arm) => Math.abs(a.s - ref.s) + Math.abs(a.e - ref.e)
  return dist(x) <= dist(y) ? x : y
}
const REST: Arm = { s: 5, e: 8 }
/**
 * Review 2026-11-23 (slide 24: "unnatural hand movements and distorted joints"). A cook's pot sits beside the shoulder
 * in the picture, so a hand sent to the pot itself could only get there with the upper arm folded across the chest.
 * A working hand is placed instead in the rig's frame a little ABOVE and OUTSIDE what it works on (it holds the
 * handle; the spoon hangs into the pot), with the elbow DOWN and out: of the two elbow solutions, never one whose
 * upper arm crosses the chest.
 */
const handOver = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, dx: number, dy: number): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  const sg = side === 'L' ? -1 : 1
  const q = { x: p.x + sg * dx, y: p.y + dy }
  const c = [ik2(side, b.sh, q, false), ik2(side, b.sh, q, true)].filter((a) => a.s >= -2 && a.s <= 150)
  if (!c.length) return ik(side, b.sh, q)
  return c.reduce((a, x) => (Math.cos(x.s * DEG) > Math.cos(a.s * DEG) ? x : a))
}
/** a relaxed arm at the counter: hanging, the elbow a little bent, the hand behind the counter's edge */
const AT_COUNTER: Arm = { s: 9, e: 14 }
/** a hand closed round a handle (side-on, fingers curled, thumb over them); `pinch` opens it toward a spice pinch */
function grip(p: Pose, side: 'L' | 'R', pinch: number) {
  const f = lerp(0.92, 0.62, pinch)
  if (side === 'R') {
    p.fR1 = lerp(f, 0.45, pinch)
    p.fR2 = p.fR3 = p.fR4 = f
    p.tR = lerp(0.75, 0.55, pinch)
    p.spreadR = 0.05
    p.palmR = 0.12
  } else {
    p.fL1 = lerp(f, 0.45, pinch)
    p.fL2 = p.fL3 = p.fL4 = f
    p.tL = lerp(0.75, 0.55, pinch)
    p.spreadL = 0.05
    p.palmL = 0.12
  }
}
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

/* ------------------------------------------------------------------ shared concept parts */

/** a container: an upright shipping container (ribbed sides, door bars), with a work ring on its front */
function makeContainer(color: string, dark: string, w: number, h: number, d: number) {
  const g = new THREE.Group()
  const bodyM = mat(color, { roughness: 0.35, emissive: new THREE.Color(color), emissiveIntensity: 0.14 })
  const darkM = mat(dark, { roughness: 0.4 })
  g.add(box(w, h, d, bodyM, [0, h / 2, 0], 0.03))
  /* ribs on the front */
  for (let k = 0; k < 5; k++) g.add(flat(box(0.022, h - 0.16, 0.02, darkM, [-w / 2 + 0.08 + (k * (w - 0.16)) / 4, h / 2, d / 2 + 0.008])))
  /* top and bottom rails */
  g.add(flat(box(w + 0.02, 0.05, d + 0.02, darkM, [0, h - 0.025, 0], 0.012)))
  g.add(flat(box(w + 0.02, 0.05, d + 0.02, darkM, [0, 0.025, 0], 0.012)))
  /* the work ring on a white disc (the container working) */
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.105, 40), mat('#FFFFFF', { roughness: 0.35 }))
  disc.position.set(0, h * 0.74, d / 2 + 0.024)
  g.add(disc)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.058, 0.082, 40, 1, 0, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide }))
  ring.position.set(0, h * 0.74, d / 2 + 0.03)
  g.add(ring)
  const lampM = new THREE.MeshBasicMaterial({ color: '#CFE0FF', toneMapped: false })
  const lamp = mesh(new THREE.SphereGeometry(0.03, 14, 10), lampM, [w / 2 - 0.09, h - 0.12, d / 2 + 0.02])
  g.add(lamp)
  return { g, ring, lampM }
}

/** a pod: a glossy blue rounded cube with a white container block set into its front */
function makePod(s = 0.28) {
  const g = new THREE.Group()
  const shellM = mat(C.brand, { roughness: 0.25, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.2 })
  g.add(box(s, s, s, shellM, [0, 0, 0], s * 0.18))
  const inner = box(s * 0.52, s * 0.42, 0.03, mat('#FFFFFF', { roughness: 0.35 }), [0, 0, s / 2 + 0.004], 0.01)
  g.add(flat(inner))
  for (let k = 0; k < 3; k++) g.add(flat(box(0.008, s * 0.3, 0.01, mat('#9DB8FF', { roughness: 0.4 }), [-s * 0.14 + k * s * 0.14, 0, s / 2 + 0.02])))
  return { g, shellM }
}

/** a packet / a data chip: a small glossy rounded tile */
function makeChip(color: string, s = 0.12) {
  const g = new THREE.Group()
  g.add(box(s, s * 0.8, s * 0.5, mat(color, { roughness: 0.25, emissive: new THREE.Color(color), emissiveIntensity: 0.35 }), [0, 0, 0], s * 0.18))
  g.add(flat(box(s * 0.6, s * 0.12, 0.01, mat('#FFFFFF', { roughness: 0.3 }), [0, s * 0.12, s * 0.26])))
  g.add(flat(box(s * 0.42, s * 0.12, 0.01, mat('#FFFFFF', { roughness: 0.3 }), [-s * 0.09, -s * 0.12, s * 0.26])))
  return g
}

/** a core: a navy porthole, a lit ring and a turning gear (the work the controller does) */
function makeCore(r: number, ringCol: string) {
  const g = new THREE.Group()
  g.add(flat(mesh(new THREE.CircleGeometry(r, 40), mat('#16224A', { roughness: 0.35 }), [0, 0, 0])))
  const ringM = new THREE.MeshStandardMaterial({ color: ringCol, emissive: new THREE.Color(ringCol), emissiveIntensity: 0.6, roughness: 0.3 })
  g.add(mesh(new THREE.TorusGeometry(r * 0.94, r * 0.07, 12, 48), ringM, [0, 0, 0.01]))
  const gear = new THREE.Group()
  const gm = mat('#C9D6F2', { roughness: 0.3, metalness: 0.5 })
  gear.add(mesh(new THREE.TorusGeometry(r * 0.42, r * 0.11, 10, 32), gm))
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    const t = box(r * 0.16, r * 0.2, r * 0.12, gm, [Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, 0])
    t.rotation.z = a
    gear.add(t)
  }
  gear.position.z = 0.03
  g.add(gear)
  return { g, ringM, gear }
}
const tickTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = C.green
    g.beginPath()
    g.arc(32, 32, 30, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(18, 33)
    g.lineTo(28, 43)
    g.lineTo(46, 22)
    g.stroke()
  })
/** the template's orange cross on a white disc (a failure) */
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
    g.lineWidth = 7
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(22, 22)
    g.lineTo(42, 42)
    g.moveTo(42, 22)
    g.lineTo(22, 42)
    g.stroke()
  })

/* ================================================================== T09 · one PG room, one pod */

const L9 = 8
const F9 = 96
const HOLD9 = 1.95 /* flatmate 1's hand at the shared tin, flatmate 2 stirring; the chip on its way to container 1 */
const CAM9: V3 = [-0.12, 2.7, 6.3]
const AT9: V3 = [-0.12, 1.02, -0.9]
const FOV9 = 30

/* the room, cut away: back wall, side walls, floor */
const BZ = -1.45
const RX0 = -2.3
const RX1 = 2.3
const RH = 2.7
const DOOR = { x: -1.55, w: 0.78, h: 2.02 }
const SLOT_Y = 1.1
const CNT = { x0: -0.62, x1: 1.74, z0: -0.74, z1: -0.24, h: 0.88 }
const CTOP = CNT.h + 0.04
const CZ9 = (CNT.z0 + CNT.z1) / 2
const PZ = -0.9
const AX = 0.0
const BX = 1.1
const POT_X = 0.31
const PAN_X = 0.79
const TIN_X = 0.55
const TIN_Z = -0.63
const POT_Z = -0.42
const PORT_Y = 1.15

const T9 = {
  /* flatmate 1 takes a pinch from the shared tin: spoon down, reach, back over his pot, two shakes, spoon up */
  aAway: [1.25, 1.4, 2.55, 2.7] as const,
  aTin: [1.3, 1.62, 1.82, 2.1] as const,
  aOver: [1.92, 2.2, 2.45, 2.72] as const,
  /* flatmate 2, the same tin */
  bAway: [4.25, 4.4, 5.55, 5.7] as const,
  bTin: [4.3, 4.62, 4.82, 5.1] as const,
  bOver: [4.92, 5.2, 5.45, 5.72] as const,
  /* the two letters through the one door slot (the two packets through the one port) */
  mail: [6.1, 6.55] as const,
  look: [6.05, 6.35, 7.05, 7.4] as const,
}

/* ------------------------------------------------------------------ T09 everyday: the PG room */

function roomShell(scene: THREE.Scene, wall: string, side: string, floor: THREE.Material) {
  scene.add(floorPlane(RX1 - RX0, 3.2, floor, [0, 0, BZ + 1.6]))
  const wallM = mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.22 })
  scene.add(flat(box(RX1 - RX0 + 0.1, RH, 0.08, wallM, [0, RH / 2, BZ - 0.04])))
  const sideM = mat(side, { roughness: 0.95, emissive: new THREE.Color(side), emissiveIntensity: 0.18 })
  for (const x of [RX0 - 0.04, RX1 + 0.04]) scene.add(flat(box(0.08, RH, 3.2, sideM, [x, RH / 2, BZ + 1.6])))
  /* the cut edge: a skirting along the walls */
  const skirt = mat('#B98A5C', { roughness: 0.6 })
  scene.add(flat(box(RX1 - RX0, 0.08, 0.02, skirt, [0, 0.04, BZ + 0.01])))
}

function setupT09Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F3EEE5')
  setCam(camera, CAM9, AT9, FOV9)
  lights(scene, [0, 1.0, -0.6])
  roomShell(scene, '#F3E6CF', '#EADBC0', mat('#ffffff', { map: plankTex('#D8B88E', '#C39C6E', [4, 3]), roughness: 0.8 }))

  /* ---- the ONE door: frame, leaf, handle, number plate, letter slot, the letter box inside ---- */
  const woodM = mat('#A86F43', { roughness: 0.55 })
  const frameM = mat('#7E4F2D', { roughness: 0.55 })
  const DZ = BZ + 0.02
  scene.add(box(DOOR.w, DOOR.h, 0.05, woodM, [DOOR.x, DOOR.h / 2, DZ + 0.02], 0.01))
  for (const [x, y, w, h] of [
    [DOOR.x - DOOR.w / 2 - 0.04, DOOR.h / 2 + 0.02, 0.08, DOOR.h + 0.04],
    [DOOR.x + DOOR.w / 2 + 0.04, DOOR.h / 2 + 0.02, 0.08, DOOR.h + 0.04],
    [DOOR.x, DOOR.h + 0.04, DOOR.w + 0.16, 0.08],
  ] as [number, number, number, number][])
    scene.add(flat(box(w, h, 0.07, frameM, [x, y, DZ + 0.03])))
  /* the panels on the leaf */
  const panelM = mat('#B97C4D', { roughness: 0.5 })
  scene.add(flat(box(DOOR.w - 0.2, 0.62, 0.02, panelM, [DOOR.x, 1.55, DZ + 0.055], 0.01)))
  scene.add(flat(box(DOOR.w - 0.2, 0.5, 0.02, panelM, [DOOR.x, 0.38, DZ + 0.055], 0.01)))
  /* handle */
  const steel = mat('#D9DEE7', { roughness: 0.25, metalness: 0.8 })
  scene.add(flat(box(0.05, 0.16, 0.02, steel, [DOOR.x + DOOR.w / 2 - 0.1, 1.0, DZ + 0.06], 0.008)))
  scene.add(flat(box(0.14, 0.03, 0.04, steel, [DOOR.x + DOOR.w / 2 - 0.14, 1.02, DZ + 0.08], 0.01)))
  /* the number plate: brass, the room's number (an object on the door) */
  const plate = canvasTex(96, 56, (g) => {
    rr(g, 2, 2, 92, 52, 10, '#C9A24A')
    rr(g, 6, 6, 84, 44, 8, '#E6C36A')
    g.fillStyle = '#5A3E12'
    g.font = '700 30px "DM Sans", Arial, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('204', 48, 30)
  })
  scene.add(picture(plate, 0.3, 0.175, [DOOR.x, 1.9, DZ + 0.07]))
  /* the letter slot (a brass flap) and the letter box under it, open at the top */
  scene.add(flat(box(0.3, 0.06, 0.02, mat('#C9A24A', { roughness: 0.3, metalness: 0.6 }), [DOOR.x - 0.06, SLOT_Y, DZ + 0.065], 0.01)))
  scene.add(flat(box(0.24, 0.016, 0.022, mat('#2A1D12', { roughness: 0.9 }), [DOOR.x - 0.06, SLOT_Y, DZ + 0.068])))
  const boxM = mat('#D9C7A6', { roughness: 0.6 })
  const LB = { x: DOOR.x - 0.06, y: 0.84, w: 0.34, h: 0.2, d: 0.12 }
  scene.add(box(LB.w, LB.h, 0.02, boxM, [LB.x, LB.y, DZ + 0.06 + LB.d], 0.008))
  scene.add(flat(box(0.02, LB.h, LB.d, boxM, [LB.x - LB.w / 2, LB.y, DZ + 0.06 + LB.d / 2])))
  scene.add(flat(box(0.02, LB.h, LB.d, boxM, [LB.x + LB.w / 2, LB.y, DZ + 0.06 + LB.d / 2])))
  scene.add(flat(box(LB.w, 0.02, LB.d, boxM, [LB.x, LB.y - LB.h / 2, DZ + 0.06 + LB.d / 2])))
  /* the doormat */
  scene.add(flat(box(0.7, 0.012, 0.34, mat('#7C8BA8', { roughness: 0.95 }), [DOOR.x, 0.006, BZ + 0.3], 0.004)))

  /* ---- the kitchen: shelf with jars, the counter, the ONE stove, the shared tin, a pot and a pan ---- */
  const shelfM = mat('#C79B6B', { roughness: 0.55 })
  scene.add(flat(box(1.9, 0.04, 0.24, shelfM, [0.56, 1.98, BZ + 0.12], 0.01)))
  const jarCols = ['#E0A43A', '#C2412D', '#7A9B3E', '#E0A43A', '#8A5A3C', '#C2412D']
  jarCols.forEach((col, k) => {
    const x = -0.22 + k * 0.3
    scene.add(cyl(0.06, 0.06, 0.16, glass('#F4F7FB', 0.55), [x, 2.08, BZ + 0.12], 20))
    scene.add(flat(cyl(0.052, 0.052, 0.1, mat(col, { roughness: 0.8 }), [x, 2.05, BZ + 0.12], 20)))
    scene.add(flat(cyl(0.064, 0.064, 0.03, mat('#B9C3D3', { roughness: 0.3, metalness: 0.6 }), [x, 2.175, BZ + 0.12], 20)))
  })
  /* the counter: cabinets with handles, a stone top */
  const cabM = mat('#F6F0E4', { roughness: 0.6 })
  const cw = CNT.x1 - CNT.x0
  scene.add(box(cw, CNT.h, CNT.z1 - CNT.z0, cabM, [(CNT.x0 + CNT.x1) / 2, CNT.h / 2, CZ9], 0.02))
  scene.add(box(cw + 0.06, 0.05, CNT.z1 - CNT.z0 + 0.06, mat('#5E6677', { roughness: 0.35 }), [(CNT.x0 + CNT.x1) / 2, CNT.h + 0.02, CZ9], 0.012))
  for (let k = 0; k < 4; k++) {
    const x = CNT.x0 + (cw / 4) * (k + 0.5)
    scene.add(flat(box(cw / 4 - 0.05, CNT.h - 0.16, 0.012, mat('#EFE6D3', { roughness: 0.6 }), [x, CNT.h / 2 - 0.02, CNT.z1 + 0.006], 0.006)))
    scene.add(flat(box(0.12, 0.022, 0.02, steel, [x, CNT.h - 0.16, CNT.z1 + 0.018], 0.008)))
  }
  /* the stove: a two-burner cooktop, its flames */
  scene.add(box(0.82, 0.05, 0.42, mat('#1E2230', { roughness: 0.2, metalness: 0.3 }), [TIN_X, CTOP + 0.02, -0.5], 0.015))
  const flames: THREE.Mesh[] = []
  for (const x of [POT_X, PAN_X]) {
    scene.add(flat(cyl(0.09, 0.09, 0.012, mat('#3A3F4D', { roughness: 0.4, metalness: 0.5 }), [x, CTOP + 0.05, POT_Z], 24)))
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 8), new THREE.MeshBasicMaterial({ color: k % 2 ? '#4C8DFF' : '#7FB0FF', toneMapped: false, transparent: true, opacity: 0.9 }))
      f.position.set(x + Math.cos(a) * 0.075, CTOP + 0.075, POT_Z + Math.sin(a) * 0.075)
      scene.add(f)
      flames.push(f)
    }
  }
  /* flatmate 1's pot (steel), flatmate 2's pan (a kadai) */
  const potM = mat('#C9D0DB', { roughness: 0.25, metalness: 0.75 })
  scene.add(cyl(0.12, 0.11, 0.15, potM, [POT_X, CTOP + 0.15, POT_Z], 32))
  scene.add(flat(cyl(0.105, 0.105, 0.01, mat('#C98A3A', { roughness: 0.6 }), [POT_X, CTOP + 0.215, POT_Z], 32)))
  const kadai = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2.6), mat('#3A3F4D', { roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide }))
  kadai.position.set(PAN_X, CTOP + 0.2, POT_Z)
  scene.add(kadai)
  scene.add(flat(cyl(0.12, 0.12, 0.01, mat('#7FA23A', { roughness: 0.7 }), [PAN_X, CTOP + 0.15, POT_Z], 32)))
  /* the shared spice tin (a round steel masala tin, lid off, its cups of spice) */
  const tinTop = canvasTex(80, 80, (g) => {
    g.fillStyle = '#E3E8EF'
    g.beginPath()
    g.arc(40, 40, 39, 0, TAU)
    g.fill()
    const sp = ['#E2B93B', '#C2412D', '#8A5A3C', '#E07A2E', '#6F8F3A', '#F2E6C9', '#A23B2A']
    sp.forEach((col, k) => {
      const a = (k / 6) * TAU
      const [x, y] = k === 6 ? [40, 40] : [40 + Math.cos(a) * 23, 40 + Math.sin(a) * 23]
      g.fillStyle = '#B7C0CC'
      g.beginPath()
      g.arc(x, y, 11.5, 0, TAU)
      g.fill()
      g.fillStyle = col
      g.beginPath()
      g.arc(x, y, 9.5, 0, TAU)
      g.fill()
    })
  })
  scene.add(cyl(0.095, 0.095, 0.07, potM, [TIN_X, CTOP + 0.08, TIN_Z], 32))
  const tinFace = new THREE.Mesh(new THREE.CircleGeometry(0.092, 40), new THREE.MeshStandardMaterial({ map: tinTop, roughness: 0.6 }))
  tinFace.rotation.x = -Math.PI / 2
  tinFace.position.set(TIN_X, CTOP + 0.117, TIN_Z)
  scene.add(tinFace)
  /* steam over the pot and the pan */
  const puff = haloTex('rgba(255,255,255,0.95)')
  const steam = Array.from({ length: 10 }, (_, k) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))
    m.userData.x = k < 5 ? POT_X : PAN_X
    m.userData.ph = (k % 5) / 5 + (k < 5 ? 0 : 0.1)
    scene.add(m)
    return m
  })
  /* the pinch of spice falling from a hand */
  const pinch = Array.from({ length: 6 }, () => {
    const m = mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: '#C2412D', transparent: true, opacity: 0, toneMapped: false }))
    scene.add(m)
    return m
  })

  /* ---- the two flatmates ---- */
  const fA = body(who(CAST_PRESETS.kabir, { name: 'Flatmate', skinTone: '#F4A077', hair: { style: 'curly', color: '#262B43' }, outfit: { top: 'tshirt', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#1F4FD8' }, build: { shoulders: 0.96 } }), [AX, 0, PZ], 1.66)
  const fB = body(who(CAST_PRESETS.dev, { name: 'Flatmate', skinTone: '#FBC499', hair: { style: 'short', color: '#2A2324' }, outfit: { top: 'hoodie', topColor: '#14A89A', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', beard: 'stubble', watch: false } }), [BX, 0, PZ], 1.7)

  /* world points */
  const potP = v3([POT_X - 0.02, CTOP + 0.24, POT_Z])
  const panP = v3([PAN_X + 0.02, CTOP + 0.22, POT_Z])
  const tinP = v3([TIN_X, CTOP + 0.16, TIN_Z])
  const stir = (centre: THREE.Vector3, ph: number) => (c: number) => centre.clone().add(new THREE.Vector3(Math.cos(c * TAU + ph) * 0.045, 0.012 * Math.sin(c * TAU * 2 + ph), Math.sin(c * TAU + ph) * 0.03))
  const stirA = stir(potP, 0)
  const stirB = stir(panP, 1.9)
  const shake = (centre: THREE.Vector3) => (c: number) => centre.clone().add(new THREE.Vector3(0, 0.025 * Math.sin(c * TAU * 3), 0))

  /* where each working hand holds its utensil, in rig px from the pot / pan (outward, up) */
  const HOLD_A = { dx: 6, dy: -50 }
  const HOLD_B = { dx: 38, dy: -60 }
  /* flatmate 1: his R hand stirs (spoon), goes to the tin, sprinkles; his L arm rests at the counter */
  const aR = (c: number) =>
    armFrom(c, (q) => handOver(fA, 'R', stirA(q), camera, HOLD_A.dx, HOLD_A.dy), [
      [T9.aTin[0], T9.aTin[1], T9.aTin[2], T9.aTin[3], reach(fA, 'R', tinP, camera)],
      [T9.aOver[0], T9.aOver[1], T9.aOver[2], T9.aOver[3], (q) => handOver(fA, 'R', shake(potP)(q), camera, HOLD_A.dx + 4, HOLD_A.dy - 6)],
    ])
  const aL: Arm = AT_COUNTER
  /* flatmate 2: his L hand stirs (spatula), goes to the tin, sprinkles; his R hand rests on the counter */
  const bL = (c: number) =>
    armFrom(c, (q) => handOver(fB, 'L', stirB(q), camera, HOLD_B.dx, HOLD_B.dy), [
      [T9.bTin[0], T9.bTin[1], T9.bTin[2], T9.bTin[3], reach(fB, 'L', tinP, camera)],
      [T9.bOver[0], T9.bOver[1], T9.bOver[2], T9.bOver[3], (q) => handOver(fB, 'L', shake(panP)(q), camera, HOLD_B.dx + 4, HOLD_B.dy - 6)],
    ])
  const bR: Arm = AT_COUNTER

  const lookDoor = (c: number) => hold(c, T9.look[0], T9.look[1], T9.look[2], T9.look[3])
  const poseA = (p: Pose, c: number) => {
    setArms(p, aL, aR(c))
    grip(p, 'R', hold(c, T9.aTin[0], T9.aTin[1], T9.aOver[2], T9.aOver[3]))
    /* eyes on his pot; to the tin and back; round to the door when the letters come */
    lookAt(p, 0.5, 1 - lookDoor(c), 1)
    lookAt(p, 0.9, hold(c, T9.aTin[0], T9.aTin[1], T9.aTin[2], T9.aTin[3]), 0.6)
    lookAt(p, -1, lookDoor(c))
    /* a glance at his flatmate when he takes from the same tin */
    lookAt(p, 1, hold(c, 4.35, 4.6, 5.0, 5.3))
  }
  const poseB = (p: Pose, c: number) => {
    setArms(p, bL(c), bR)
    grip(p, 'L', hold(c, T9.bTin[0], T9.bTin[1], T9.bOver[2], T9.bOver[3]))
    lookAt(p, -0.5, 1 - lookDoor(c), 1)
    lookAt(p, -0.9, hold(c, T9.bTin[0], T9.bTin[1], T9.bTin[2], T9.bTin[3]), 0.6)
    lookAt(p, -1, lookDoor(c))
    lookAt(p, -1, hold(c, 1.35, 1.6, 2.0, 2.3))
  }
  const holdT9 = devHold(HOLD9)
  const people = [
    person({ config: fA.cfg, dress: withNeck(APRON('#F4E9D2', '#C9B48C')), seed: 201, faces: [[0, 'happy'], [1.3, 'thinking'], [2.3, 'happy'], [6.1, 'surprised'], [6.6, 'grin']], pose: poseA, loop: L9, height: fA.h, frames: F9, redraw: kit.redraw, holdT: holdT9 }),
    person({ config: fB.cfg, seed: 202, faces: [[0, 'listening'], [1.4, 'happy'], [3.2, 'thinking'], [4.3, 'thinking'], [5.2, 'proud'], [6.15, 'surprised'], [6.65, 'happy']], pose: poseB, loop: L9, height: fB.h, frames: F9, redraw, holdT: holdT9 }),
  ]
  ;[fA, fB].forEach((b, k) => {
    people[k].object.position.copy(b.root)
    scene.add(people[k].object)
  })
  const clk = slideClock('T09', scene, holdT9, people)

  /* the utensils: his spoon, the other's spatula (each rests in its pot while the hand is at the tin) */
  const spoon = new THREE.Group()
  spoon.add(cyl(0.009, 0.009, 0.26, mat('#8C5A34', { roughness: 0.5 }), [0, -0.05, 0], 10))
  spoon.add(mesh(new THREE.SphereGeometry(0.03, 14, 10), mat('#8C5A34', { roughness: 0.5 }), [0, -0.18, 0]))
  const spat = new THREE.Group()
  spat.add(cyl(0.009, 0.009, 0.26, mat('#2F3A52', { roughness: 0.4 }), [0, -0.05, 0], 10))
  spat.add(box(0.07, 0.07, 0.008, mat('#C9D0DB', { roughness: 0.25, metalness: 0.75 }), [0, -0.2, 0], 0.006))
  scene.add(spoon, spat)

  /* the two letters (each flatmate's colour on its edge) */
  const letterTex = (col: string) =>
    canvasTex(80, 52, (g) => {
      rr(g, 1, 1, 78, 50, 4, '#FFFFFF')
      g.strokeStyle = col
      g.lineWidth = 4
      g.beginPath()
      g.roundRect(3, 3, 74, 46, 3)
      g.stroke()
      g.strokeStyle = '#C8CFDC'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(4, 5)
      g.lineTo(40, 30)
      g.lineTo(76, 5)
      g.stroke()
      rr(g, 58, 10, 12, 14, 2, col)
    })
  const letters = [C.one, C.two].map((col) => {
    const m = picture(letterTex(col), 0.2, 0.13, [0, 0, 0])
    scene.add(m)
    return m
  })

  const hA = new THREE.Vector3()
  const hB = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const camRight = new THREE.Vector3()
  const rest = (o: THREE.Object3D, at: THREE.Vector3, tilt: number) => {
    o.position.copy(at)
    o.quaternion.copy(camera.quaternion)
    o.rotateZ(tilt)
  }

  return (t: number) => {
    const c = mod(clk.time(t), L9)
    const cq = frameT(c, L9, F9)
    people.forEach((s) => s.update(c, camera))

    /* the utensils: in the hand, or resting in the pot while the hand is away */
    handWorld('R', fA.sh, aR(cq), fA.h, fA.root, camera, hA)
    const awayA = hold(c, T9.aAway[0], T9.aAway[1], T9.aAway[2], T9.aAway[3])
    rest(spoon, hA.clone().lerp(tmp.copy(potP).add(new THREE.Vector3(0.05, 0.02, 0.04)), awayA), lerp(0.35, 0.6, awayA))
    spoon.position.y -= 0.01 * (1 - awayA)
    /* the handle runs through the closed fist, which the rig draws a little outside the grip point */
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion)
    spoon.position.addScaledVector(camRight, 0.022 * (1 - awayA))
    handWorld('L', fB.sh, bL(cq), fB.h, fB.root, camera, hB)
    const awayB = hold(c, T9.bAway[0], T9.bAway[1], T9.bAway[2], T9.bAway[3])
    rest(spat, hB.clone().lerp(tmp.copy(panP).add(new THREE.Vector3(-0.05, 0.02, 0.04)), awayB), lerp(-0.35, -0.6, awayB))
    spat.position.y -= 0.01 * (1 - awayB)
    spat.position.addScaledVector(camRight, -0.022 * (1 - awayB))

    /* flames and steam */
    flames.forEach((f, k) => f.scale.set(1, 0.8 + 0.25 * Math.abs(Math.sin(c * TAU * 6 + k * 1.3)), 1))
    steam.forEach((m) => {
      const ph = mod(c / 2 + m.userData.ph, 1)
      m.position.set(m.userData.x + 0.03 * Math.sin(ph * TAU + m.userData.ph * 9), CTOP + 0.24 + ph * 0.3, POT_Z)
      m.scale.setScalar(0.09 + ph * 0.12)
      m.material.opacity = 0.55 * Math.sin(ph * Math.PI) * (1 - 0.5 * ph)
    })
    /* the pinch: falls during each sprinkle */
    const sA = hold(c, T9.aOver[1], T9.aOver[1] + 0.05, T9.aOver[2], T9.aOver[2] + 0.05)
    const sB = hold(c, T9.bOver[1], T9.bOver[1] + 0.05, T9.bOver[2], T9.bOver[2] + 0.05)
    const sp = sA > 0 ? { w: sA, x: POT_X } : { w: sB, x: PAN_X }
    pinch.forEach((m, k) => {
      const ph = mod(c * 4 + k / 6, 1)
      m.position.set(sp.x + ((k % 3) - 1) * 0.02, CTOP + 0.34 - ph * 0.14, POT_Z + 0.02)
      ;(m.material as THREE.MeshBasicMaterial).opacity = sp.w
    })

    /* the letters: each comes through the slot and drops into the letter box (out of sight inside it) */
    letters.forEach((m, k) => {
      const t0 = T9.mail[k]
      const inK = seg(c, t0, t0 + 0.22)
      const dropK = seg(c, t0 + 0.25, t0 + 0.55)
      const on = c > t0 && c < t0 + 0.7
      m.visible = on
      m.position.set(DOOR.x - 0.06 + (k ? 0.03 : -0.03), SLOT_Y - 0.065 * inK - 0.2 * dropK, BZ + 0.02 + 0.075 + 0.02 * inK)
      m.scale.set(1, Math.max(0.02, inK), 1)
      m.rotation.z = (k ? -0.08 : 0.08) * dropK
    })
  }
}

/* ------------------------------------------------------------------ T09 concept: one pod */

function setupT09Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM9, AT9, FOV9)
  lights(scene, [0, 1.0, -0.6])
  /* the pod: a floor slab, glass walls, a blue rim round its top edge and corners */
  scene.add(floorPlane(RX1 - RX0, 3.2, mat('#DCE7FB', { roughness: 0.6, emissive: new THREE.Color('#DCE7FB'), emissiveIntensity: 0.25 }), [0, 0, BZ + 1.6]))
  const wallG = glass('#D3E2FF', 0.6, 0.55)
  const back = box(RX1 - RX0, RH, 0.04, wallG, [0, RH / 2, BZ - 0.02])
  back.renderOrder = 1
  scene.add(flat(back))
  for (const x of [RX0, RX1]) {
    const s = box(0.04, RH, 3.2, wallG, [x, RH / 2, BZ + 1.6])
    s.renderOrder = 1
    scene.add(flat(s))
  }
  const rimM = mat(C.brand, { roughness: 0.3, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.35 })
  scene.add(flat(rod(v3([RX0, RH, BZ]), v3([RX1, RH, BZ]), 0.035, rimM)))
  scene.add(flat(rod(v3([RX0, 0.01, BZ]), v3([RX1, 0.01, BZ]), 0.035, rimM)))
  for (const x of [RX0, RX1]) {
    scene.add(flat(rod(v3([x, 0, BZ]), v3([x, RH, BZ]), 0.035, rimM)))
    scene.add(flat(rod(v3([x, RH, BZ]), v3([x, RH, BZ + 3.2]), 0.035, rimM)))
  }

  /* the ONE network port, in the door's place: a wall plate, its socket, the plug and the cable from outside */
  const PX9 = DOOR.x
  scene.add(box(0.5, 0.5, 0.05, mat('#FFFFFF', { roughness: 0.35 }), [PX9, PORT_Y, BZ + 0.03], 0.04))
  scene.add(flat(box(0.2, 0.16, 0.02, mat('#1E2A4A', { roughness: 0.5 }), [PX9, PORT_Y - 0.03, BZ + 0.06], 0.01)))
  const plug = box(0.16, 0.12, 0.12, glass('#9EC2FF', 0.85), [PX9, PORT_Y - 0.03, BZ + 0.12], 0.02)
  scene.add(plug)
  const portRing = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.3, 48), new THREE.MeshBasicMaterial({ color: C.brand, toneMapped: false, transparent: true, opacity: 0.35, side: THREE.DoubleSide }))
  portRing.position.set(PX9, PORT_Y, BZ + 0.06)
  scene.add(portRing)
  const portGlow = halo('rgba(45,99,251,0.9)', 0.9)
  portGlow.position.set(PX9, PORT_Y, BZ + 0.08)
  scene.add(portGlow)
  const cableM = mat('#7FA6FF', { roughness: 0.4, emissive: new THREE.Color('#7FA6FF'), emissiveIntensity: 0.25 })
  /* outside -> over the wall -> down to the plug */
  const outside = tube(scene, [[PX9, RH + 0.12, BZ - 0.45], [PX9, RH + 0.12, BZ + 0.16], [PX9, PORT_Y + 0.03, BZ + 0.16]], 0.022, cableM, 0.1)
  /* inside: the one port wired on to both containers (over their tops) */
  const WY = 1.92
  const toA = tube(scene, [[PX9 + 0.25, PORT_Y, BZ + 0.08], [PX9 + 0.4, PORT_Y, BZ + 0.08], [PX9 + 0.4, WY, BZ + 0.08], [AX, WY, BZ + 0.08], [AX, WY, PZ], [AX, 1.66, PZ]], 0.018, cableM, 0.09)
  const toB = tube(scene, [[AX, WY, BZ + 0.08], [BX, WY, BZ + 0.08], [BX, WY, PZ], [BX, 1.66, PZ]], 0.018, cableM, 0.09)

  /* the two containers, where the flatmates stand */
  const CW = 0.5
  const CH = 1.62
  const cA = makeContainer(C.one, C.oneDark, CW, CH, 0.4)
  cA.g.position.set(AX, 0, PZ)
  const cB = makeContainer(C.two, C.twoDark, CW, CH, 0.4)
  cB.g.position.set(BX, 0, PZ)
  scene.add(cA.g, cB.g)

  /* the platform in the counter's place, the ONE shared volume in the stove's place, mounted into both */
  const platM = mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.3 })
  scene.add(box(CNT.x1 - CNT.x0, CNT.h, CNT.z1 - CNT.z0, platM, [(CNT.x0 + CNT.x1) / 2, CNT.h / 2, CZ9], 0.03))
  scene.add(flat(box(CNT.x1 - CNT.x0 + 0.02, 0.03, CNT.z1 - CNT.z0 + 0.02, mat('#C9D8F5', { roughness: 0.4 }), [(CNT.x0 + CNT.x1) / 2, CNT.h + 0.015, CZ9], 0.01)))
  const VZ = -0.52
  const VR = 0.17
  const vol = new THREE.Group()
  const discM = mat(C.brand, { roughness: 0.3, metalness: 0.1, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.2 })
  for (let k = 0; k < 3; k++) vol.add(cyl(VR, VR, 0.12, discM, [0, 0.07 + k * 0.145, 0], 40))
  for (let k = 0; k < 3; k++) vol.add(flat(cyl(VR + 0.003, VR + 0.003, 0.02, mat('#9DB8FF', { roughness: 0.3 }), [0, 0.135 + k * 0.145, 0], 40)))
  vol.position.set(TIN_X, CNT.h + 0.03, VZ)
  scene.add(vol)
  const volGlow = halo('rgba(45,99,251,0.85)', 0.8)
  volGlow.position.set(TIN_X, CNT.h + 0.25, VZ - 0.05)
  scene.add(volGlow)
  /* the mounts: from the volume's sides into each container's front */
  const MY = CNT.h + 0.26
  const mountMA = mat('#9DB8FF', { roughness: 0.35, emissive: new THREE.Color(C.one), emissiveIntensity: 0.2 })
  const mountMB = mat('#9DB8FF', { roughness: 0.35, emissive: new THREE.Color(C.two), emissiveIntensity: 0.2 })
  const mA = tube(scene, [[TIN_X - VR, MY, VZ], [AX + 0.16, MY, VZ], [AX + 0.16, MY, PZ + 0.2]], 0.03, mountMA, 0.06)
  const mB = tube(scene, [[TIN_X + VR, MY, VZ], [BX - 0.16, MY, VZ], [BX - 0.16, MY, PZ + 0.2]], 0.03, mountMB, 0.06)

  /* the chips (data read from the volume) and the packets (traffic through the port) */
  const chipA = makeChip(C.one, 0.16)
  const chipB = makeChip(C.two, 0.16)
  const pkts = [makeChip(C.one, 0.17), makeChip(C.two, 0.17)]
  scene.add(chipA, chipB, ...pkts)

  const holdT9 = devHold(HOLD9)
  const clk = slideClock('T09', scene, holdT9, [{ ready: Promise.resolve() }])
  const p = new THREE.Vector3()
  const outLen = outside.path.getLength()
  const aLen = toA.path.getLength()
  return (t: number) => {
    const c = mod(clk.time(t), L9)
    /* the containers at work: their rings turn (two turns a second, like the stirring) */
    cA.ring.rotation.z = -c * TAU
    cB.ring.rotation.z = -c * TAU + 1.9
    /* reads from the shared volume, in step with each pinch from the tin */
    const ride = (chip: THREE.Object3D, path: THREE.CurvePath<THREE.Vector3>, a: number, b: number, lampM: THREE.MeshBasicMaterial, col: string) => {
      const k = seg(c, a, b)
      chip.visible = c > a - 0.05 && c < b + 0.12
      path.getPointAt(Math.min(1, k), p)
      chip.position.copy(p).add(new THREE.Vector3(0, 0.07, 0))
      chip.scale.setScalar(Math.max(0.001, hold(c, a - 0.05, a + 0.12, b, b + 0.12)))
      const lit = hold(c, b - 0.05, b + 0.05, b + 0.45, b + 0.6)
      lampM.color.set('#CFE0FF').lerp(new THREE.Color(col), lit)
      return hold(c, a - 0.1, a + 0.1, b - 0.1, b + 0.1)
    }
    const rA = ride(chipA, mA.path, T9.aTin[1], T9.aOver[1], cA.lampM, C.one)
    const rB = ride(chipB, mB.path, T9.bTin[1], T9.bOver[1], cB.lampM, C.two)
    mountMA.emissiveIntensity = 0.2 + 0.8 * rA
    mountMB.emissiveIntensity = 0.2 + 0.8 * rB
    setOp(volGlow, 0.55 * Math.max(rA, rB))
    vol.scale.setScalar(1 + 0.03 * Math.max(rA, rB))
    /* the two packets: down the outside cable, in through the one port, on to their container */
    let portHit = 0
    pkts.forEach((m, k) => {
      const t0 = T9.mail[k] - 0.45
      const kIn = seg(c, t0, t0 + 0.45)
      const kOn = seg(c, t0 + 0.55, t0 + 1.25)
      m.visible = c > t0 - 0.02 && c < t0 + 1.32
      if (kOn <= 0) outside.path.getPointAt(kIn, p)
      else if (k === 0) toA.path.getPointAt(kOn, p)
      else {
        const u = kOn * (aLen * 0.62 + toB.path.getLength())
        const s = aLen * 0.62
        if (u < s) toA.path.getPointAt(u / aLen, p)
        else toB.path.getPointAt(Math.min(1, (u - s) / toB.path.getLength()), p)
      }
      m.position.copy(p).add(new THREE.Vector3(0, 0, 0.04))
      m.scale.setScalar(Math.max(0.001, hold(c, t0 - 0.02, t0 + 0.08, t0 + 1.2, t0 + 1.3)))
      portHit = Math.max(portHit, hold(c, t0 + 0.38, t0 + 0.48, t0 + 0.55, t0 + 0.75))
    })
    void outLen
    setOp(portGlow, 0.8 * portHit)
    ;(portRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.55 * portHit
    portRing.scale.setScalar(1 + 0.08 * portHit)
    plug.scale.setScalar(1 + 0.04 * Math.sin(c * TAU))
  }
}

/* ================================================================== T14 · the water tank, the Deployment */

const L14 = 8
const F14 = 96
const HOLD14 = 4.75 /* the motor running, water climbing the pipe, the level part way back; a new pod in the tube */
const CAM14: V3 = [-0.1, 1.85, 7.6]
const AT14: V3 = [-0.1, 1.08, -0.85]
const FOV14 = 26

const TZ = -0.85 // the plane of the tank, the pump, the tap and the resident
const PIPEZ = -1.17 // the plane of the delivery pipe
const STAND = { x: 0.1, w: 1.5, h: 0.55, d: 1.1 }
const TANK = { r: 0.58, h: 1.25, y0: STAND.h }
const TTOP = TANK.y0 + TANK.h
const INLET_X = 0.46
const FLOAT_X = -0.24
const PUMP_X = -1.75
const RISER_X = -1.57 // the pump head's outlet (the motor is turned so its fan end faces us)
const BOX_X = -0.98
const BOX_Y = 1.18
const TAP_X = 1.1
const TAP_Y = 0.9
const RES_X = 1.45
const LOW = 0.6
const SLOTS = [-0.27, 0.1, 0.47]
const POD_Y = TANK.y0 + 0.36

const T14 = {
  handle: [0.4, 0.72, 0.85, 1.05] as const, // her hand to the tap's handle, opens it
  wash: [0.92, 1.15, 2.62, 2.85] as const, // her hand under the running water
  close: [2.62, 2.88, 3.0, 3.35] as const, // her hand back to the handle, closes it
  tapOpen: [0.78, 0.92, 2.9, 3.02] as const,
  drain: [1.0, 3.0] as const, // the level falls
  fill: [3.45, 6.3] as const, // the level rises
  lamp: [3.0, 3.1, 6.35, 6.45] as const,
  motor: [3.08, 3.4, 6.35, 6.85] as const,
  flow: [3.2, 3.5, 6.3, 6.5] as const,
  /* concept: the pod that fails, the pod that is made */
  fail: [1.0, 1.3] as const, // turns orange
  out: [1.45, 2.0] as const, // slides out of the case along the chute
  fall: [2.0, 2.55] as const, // drops to the drain and is gone
  make: [3.25, 3.75] as const, // forms at the controller
  climb: [3.75, 5.55] as const, // up the tube and over
  drop: [5.55, 6.2] as const, // down into the empty slot
  tick: [6.15, 6.35, 6.95, 7.2] as const,
}
const level14 = (c: number) => 1 - (1 - LOW) * seg(c, T14.drain[0], T14.drain[1]) + (1 - LOW) * seg(c, T14.fill[0], T14.fill[1])

/* the delivery pipe (the tube), the switch wire, the outlet */
const PIPE: V3[] = [
  [RISER_X, 0.56, PIPEZ],
  [RISER_X, 2.2, PIPEZ],
  [INLET_X, 2.2, PIPEZ],
  [INLET_X, TTOP - 0.02, PIPEZ],
]
const WIRE: V3[] = [
  [FLOAT_X, TTOP + 0.06, TZ],
  [FLOAT_X, 1.98, TZ],
  [BOX_X, 1.98, TZ],
  [BOX_X, BOX_Y + 0.2, TZ],
]
const WIRE2: V3[] = [
  [BOX_X, BOX_Y - 0.2, TZ],
  [BOX_X, 0.03, TZ],
  [PUMP_X + 0.26, 0.03, TZ],
  [PUMP_X + 0.26, 0.2, TZ],
]

/** the terrace both T14 cards share: floor, parapet, the stand, the pad, the switch post */
function terrace(scene: THREE.Scene, everyday: boolean) {
  if (everyday) {
    scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex('#D9C6B0', '#C4AE95', 4, [9, 6]), roughness: 0.85 }), [0, 0, 1.0]))
    /* the parapet: plaster with a coping */
    scene.add(box(6.4, 0.95, 0.16, mat('#F1E6D6', { roughness: 0.9 }), [0, 0.475, -1.75], 0.01))
    scene.add(box(6.5, 0.06, 0.24, mat('#D8C8B2', { roughness: 0.7 }), [0, 0.97, -1.75], 0.01))
    /* the neighbours' rooftops behind, one with its own tank */
    const blocks: [number, number, number, string][] = [
      [-3.1, 1.25, 2.0, '#EADFCF'],
      [-0.9, 1.05, 2.0, '#DCE5F0'],
      [1.3, 1.35, 1.9, '#EFE2E4'],
      [3.3, 1.1, 2.2, '#E3E8D6'],
    ]
    for (const [x, h, w, col] of blocks) {
      scene.add(flat(box(w, h + 2, 1.4, mat(col, { roughness: 0.95, emissive: new THREE.Color(col), emissiveIntensity: 0.35 }), [x, h - 1 - 0.2, -7])))
      scene.add(flat(box(w + 0.1, 0.08, 1.5, mat('#CFC3B2', { roughness: 0.8, emissive: new THREE.Color('#CFC3B2'), emissiveIntensity: 0.3 }), [x, h - 0.16, -7])))
    }
    /* the brick stand */
    scene.add(box(STAND.w, STAND.h, STAND.d, mat('#ffffff', { map: brickTex([2, 2]), roughness: 0.85 }), [STAND.x, STAND.h / 2, TZ], 0.01))
    scene.add(box(STAND.w + 0.04, 0.04, STAND.d + 0.04, mat('#CFC3B2', { roughness: 0.8 }), [STAND.x, STAND.h + 0.02, TZ], 0.01))
  } else {
    scene.add(floorPlane(9, 6, mat('#DCE7FB', { roughness: 0.6, emissive: new THREE.Color('#DCE7FB'), emissiveIntensity: 0.25 }), [0, 0, 1.0]))
    scene.add(box(6.4, 0.95, 0.16, mat('#F4F7FD', { roughness: 0.6, emissive: new THREE.Color('#F4F7FD'), emissiveIntensity: 0.45 }), [0, 0.475, -1.75], 0.02))
    scene.add(box(STAND.w, STAND.h, STAND.d, mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.3 }), [STAND.x, STAND.h / 2, TZ], 0.03))
  }
  /* the pad under the pump / controller */
  scene.add(box(0.8, 0.1, 0.62, mat(everyday ? '#BDB6AA' : '#FFFFFF', { roughness: 0.8 }), [PUMP_X, 0.05, TZ - 0.1], 0.01))
  /* the switch post and its box */
  scene.add(cyl(0.03, 0.03, BOX_Y, mat('#8D96A8', { roughness: 0.4, metalness: 0.5 }), [BOX_X, BOX_Y / 2, TZ - 0.06], 12))
  scene.add(box(0.32, 0.4, 0.14, mat(everyday ? '#E9ECF1' : '#FFFFFF', { roughness: 0.4 }), [BOX_X, BOX_Y, TZ], 0.025))
  const lampM = new THREE.MeshBasicMaterial({ color: '#9AA3B2', toneMapped: false })
  const lamp = mesh(new THREE.SphereGeometry(0.045, 18, 12), lampM, [BOX_X, BOX_Y + 0.08, TZ + 0.075])
  scene.add(lamp)
  const lampGlow = halo('rgba(34,197,94,0.9)', 0.42)
  lampGlow.position.set(BOX_X, BOX_Y + 0.08, TZ + 0.1)
  scene.add(lampGlow)
  /* the wires */
  const wireM = mat('#4A5266', { roughness: 0.5 })
  tube(scene, WIRE, 0.012, wireM, 0.07)
  tube(scene, WIRE2, 0.012, wireM, 0.07)
  return { lampM, lampGlow }
}

/* ------------------------------------------------------------------ T14 everyday: the rooftop tank */

function setupT14Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#DCEBFA')
  setCam(camera, CAM14, AT14, FOV14)
  lights(scene, [0, 1.0, -0.8], 2.1)
  const { lampM, lampGlow } = terrace(scene, true)
  /* the switch's rocker */
  const rocker = box(0.08, 0.12, 0.03, mat('#2F3A52', { roughness: 0.4 }), [BOX_X, BOX_Y - 0.08, TZ + 0.08], 0.01)
  scene.add(rocker)

  /* ---- the pump motor: a blue body with fins, a grille facing us with the fan behind it, the pump head behind ---- */
  const motor = new THREE.Group()
  motor.position.set(PUMP_X, 0, TZ - 0.1)
  motor.scale.setScalar(1.3)
  motor.rotation.y = -0.7
  scene.add(motor)
  const bodyM = mat('#2B59C3', { roughness: 0.35, metalness: 0.2 })
  const MY = 0.32
  const mb = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 32), bodyM, [0, MY, 0.05])
  mb.rotation.x = Math.PI / 2
  mb.castShadow = true
  motor.add(mb)
  for (let k = 0; k < 6; k++) {
    const f = mesh(new THREE.TorusGeometry(0.172, 0.01, 8, 36), bodyM, [0, MY, -0.1 + k * 0.05])
    motor.add(f)
  }
  motor.add(box(0.36, 0.06, 0.3, mat('#22325E', { roughness: 0.5 }), [0, 0.13, 0.05], 0.01))
  /* the cowl, the grille (rings and spokes) and the fan behind it */
  const cowlM = mat('#1F2E63', { roughness: 0.4, metalness: 0.3 })
  const cowl = mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.06, 32, 1, true), mat('#1F2E63', { roughness: 0.4, side: THREE.DoubleSide }), [0, MY, 0.28])
  cowl.rotation.x = Math.PI / 2
  motor.add(cowl)
  for (const r of [0.165, 0.11, 0.055]) motor.add(mesh(new THREE.TorusGeometry(r, 0.008, 8, 40), cowlM, [0, MY, 0.31]))
  for (let k = 0; k < 6; k++) {
    const s = box(0.008, 0.33, 0.008, cowlM, [0, MY, 0.31])
    s.rotation.z = (k / 6) * Math.PI
    motor.add(s)
  }
  const fan = new THREE.Group()
  fan.position.set(0, MY, 0.27)
  const bladeM = mat('#E9EEF6', { roughness: 0.4 })
  for (let k = 0; k < 5; k++) {
    const b = box(0.05, 0.14, 0.008, bladeM, [0, 0.08, 0], 0.004)
    const arm = new THREE.Group()
    arm.add(b)
    b.rotation.y = 0.5
    arm.rotation.z = (k / 5) * TAU
    fan.add(arm)
  }
  fan.add(mesh(new THREE.SphereGeometry(0.03, 12, 10), mat('#C9D0DB', { roughness: 0.3, metalness: 0.6 })))
  motor.add(fan)
  /* the pump head behind, its outlet up into the delivery pipe, the suction pipe down into the floor */
  const head = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 32), mat('#9AA3B2', { roughness: 0.3, metalness: 0.6 }), [0, MY, -0.22])
  head.rotation.x = Math.PI / 2
  motor.add(head)
  const pvcM = mat('#F2F2EE', { roughness: 0.4 })
  scene.add(rod(v3([RISER_X, 0.4, PIPEZ - 0.05]), v3([RISER_X, 0.57, PIPEZ - 0.05]), 0.045, pvcM))
  tube(scene, [[RISER_X + 0.12, 0.36, PIPEZ - 0.05], [RISER_X + 0.26, 0.36, PIPEZ - 0.05], [RISER_X + 0.26, 0.0, PIPEZ - 0.05]], 0.04, pvcM, 0.07)

  /* the delivery pipe: clear PVC, so the water can be seen climbing it */
  const pipeM = new THREE.MeshStandardMaterial({ color: '#F4F7FB', roughness: 0.2, transparent: true, opacity: 0.5, depthWrite: false })
  const pipe = tube(scene, PIPE, 0.05, pipeM, 0.12)
  pipe.o.renderOrder = 3
  const drops = Array.from({ length: 26 }, () => {
    const m = mesh(new THREE.SphereGeometry(0.032, 12, 8), mat(C.water, { roughness: 0.2, emissive: new THREE.Color(C.water), emissiveIntensity: 0.35 }))
    scene.add(m)
    return m
  })

  /* ---- the tank: translucent white plastic with ribs, a black lid; the water inside; the float on the water ---- */
  const TX = STAND.x
  const waterM = new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.25, transparent: true, opacity: 0.85, emissive: new THREE.Color(C.water), emissiveIntensity: 0.2 })
  const water = mesh(new THREE.CylinderGeometry(TANK.r - 0.03, TANK.r - 0.03, 1, 40), waterM)
  scene.add(water)
  const surf = new THREE.Mesh(new THREE.CircleGeometry(TANK.r - 0.03, 40), new THREE.MeshStandardMaterial({ color: '#8FC0FF', roughness: 0.15, transparent: true, opacity: 0.95 }))
  surf.rotation.x = -Math.PI / 2
  scene.add(surf)
  const shellM = new THREE.MeshStandardMaterial({ color: '#F6F3EC', roughness: 0.35, transparent: true, opacity: 0.38, depthWrite: false })
  const shell = mesh(new THREE.CylinderGeometry(TANK.r, TANK.r, TANK.h, 48, 1, true), shellM, [TX, TANK.y0 + TANK.h / 2, TZ])
  shell.renderOrder = 2
  scene.add(shell)
  const ribM = new THREE.MeshStandardMaterial({ color: '#E6E1D6', roughness: 0.4, transparent: true, opacity: 0.75 })
  for (const y of [0.04, 0.33, 0.62, 0.91]) {
    const rb = mesh(new THREE.TorusGeometry(TANK.r + 0.005, 0.018, 8, 56), ribM, [TX, TANK.y0 + 0.06 + y * TANK.h, TZ])
    rb.rotation.x = Math.PI / 2
    rb.renderOrder = 2
    scene.add(rb)
  }
  scene.add(cyl(TANK.r + 0.02, TANK.r + 0.02, 0.06, mat('#2B3140', { roughness: 0.5 }), [TX, TTOP + 0.03, TZ], 48))
  scene.add(cyl(0.2, 0.2, 0.06, mat('#3A4256', { roughness: 0.45 }), [TX + 0.05, TTOP + 0.08, TZ + 0.12], 32))
  scene.add(cyl(TANK.r, TANK.r, 0.03, mat('#E6E1D6', { roughness: 0.5 }), [TX, TANK.y0 + 0.015, TZ], 48))
  /* the inlet through the lid and the stream it pours */
  const streamM = new THREE.MeshStandardMaterial({ color: '#7FB4FF', roughness: 0.1, transparent: true, opacity: 0, emissive: new THREE.Color('#7FB4FF'), emissiveIntensity: 0.3 })
  const pour = mesh(new THREE.CylinderGeometry(0.03, 0.04, 1, 14), streamM)
  scene.add(pour)
  /* the float switch: a float riding the water, hung on its cable from the lid */
  const float = mesh(new THREE.SphereGeometry(0.07, 20, 14), mat('#F2C94C', { roughness: 0.3 }))
  scene.add(float)
  const cableM = mat('#4A5266', { roughness: 0.5 })
  const fcable = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 8), cableM)
  scene.add(fcable)

  /* ---- the outlet: a pipe from the tank's foot to the tap, the tap, the drain under it ---- */
  const OUT_Y = TANK.y0 + 0.1
  tube(scene, [[TX + TANK.r - 0.05, OUT_Y, TZ], [TAP_X, OUT_Y, TZ], [TAP_X, TAP_Y, TZ]], 0.035, pvcM, 0.08)
  const brass = mat('#C9A24A', { roughness: 0.3, metalness: 0.7 })
  scene.add(box(0.1, 0.1, 0.12, brass, [TAP_X, TAP_Y + 0.03, TZ + 0.03], 0.03))
  const spout = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 12), brass, [TAP_X, TAP_Y - 0.02, TZ + 0.12])
  spout.rotation.x = Math.PI / 2 - 0.5
  scene.add(spout)
  const handle = new THREE.Group()
  handle.position.set(TAP_X, TAP_Y + 0.1, TZ + 0.03)
  handle.add(cyl(0.012, 0.012, 0.06, brass, [0, 0.0, 0], 10))
  handle.add(box(0.16, 0.025, 0.025, brass, [0, 0.035, 0], 0.01))
  scene.add(handle)
  const SPOUT: V3 = [TAP_X, TAP_Y - 0.07, TZ + 0.17]
  const tapStream = mesh(new THREE.CylinderGeometry(0.018, 0.024, 1, 12), new THREE.MeshStandardMaterial({ color: '#7FB4FF', roughness: 0.1, transparent: true, opacity: 0, emissive: new THREE.Color('#7FB4FF'), emissiveIntensity: 0.3 }))
  scene.add(tapStream)
  const tapDrops = Array.from({ length: 8 }, () => {
    const m = mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.2, transparent: true, opacity: 0 }))
    scene.add(m)
    return m
  })
  scene.add(flat(cyl(0.11, 0.11, 0.012, mat('#9AA3B2', { roughness: 0.3, metalness: 0.7 }), [TAP_X, 0.006, SPOUT[2]], 28)))
  for (let k = -2; k <= 2; k++) scene.add(flat(box(0.17, 0.004, 0.012, mat('#4A5266', { roughness: 0.5 }), [TAP_X, 0.014, SPOUT[2] + k * 0.035])))
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.06, 28), new THREE.MeshBasicMaterial({ color: '#BFDBFF', transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide }))
  splash.rotation.x = -Math.PI / 2
  splash.position.set(TAP_X, 0.02, SPOUT[2])
  scene.add(splash)

  /* ---- the resident at the tap ---- */
  const res = body(who(CAST_PRESETS.meera, { name: 'Resident', skinTone: '#F4A077', hair: { style: 'braid', color: '#2A2324' }, outfit: { top: 'kurta', topColor: '#B8417A', bottom: 'salwar', bottomColor: '#EDE3CF', shoeColor: '#6B4A2E' }, accessories: { earrings: true, bindi: true } }), [RES_X, 0, TZ], 1.6)
  const handleP = v3([TAP_X + 0.06, TAP_Y + 0.14, TZ + 0.03])
  const washP = (c: number) => v3([TAP_X + 0.04 + 0.03 * Math.sin(c * TAU * 3), TAP_Y - 0.3 + 0.02 * Math.cos(c * TAU * 3), SPOUT[2]])
  const washRef = reach(res, 'L', washP(0), camera)
  const resL = (c: number) =>
    armFrom(c, REST, [
      [T14.handle[0], T14.handle[1], T14.handle[2], T14.handle[3], reach(res, 'L', handleP, camera)],
      [T14.wash[0], T14.wash[1], T14.wash[2], T14.wash[3], (q) => reachNear(res, 'L', washP(q), camera, washRef)],
      [T14.close[0], T14.close[1], T14.close[2], T14.close[3], reach(res, 'L', handleP, camera)],
    ])
  const resR: Arm = { s: 10, e: 30 }
  const poseRes = (p: Pose, c: number) => {
    setArms(p, resL(c), resR)
    const atTap = hold(c, 0.25, 0.5, 3.1, 3.4)
    lookAt(p, -1, atTap, 0.8)
    /* the motor: she looks round and up at the tank while it refills */
    const up = hold(c, 3.4, 3.8, 6.4, 6.9)
    lookAt(p, -1, up, -0.7)
    to(p, 'headTilt', -4, up)
  }
  const holdT14 = devHold(HOLD14)
  const people = [person({ config: res.cfg, seed: 301, faces: [[0, 'neutral'], [0.9, 'happy'], [3.1, 'neutral'], [3.5, 'listening'], [6.45, 'happy']], pose: poseRes, loop: L14, height: res.h, frames: F14, redraw, holdT: holdT14 })]
  people[0].object.position.copy(res.root)
  scene.add(people[0].object)
  const clk = slideClock('T14', scene, holdT14, people)

  const fanAngle = spinner(L14, (c) => 0.02 + hold(c, T14.motor[0], T14.motor[1], T14.motor[2], T14.motor[3]), 13, TAU / 5)
  const p = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L14)
    people.forEach((s) => s.update(c, camera))
    const lv = level14(c)
    const wh = 0.08 + (TANK.h - 0.14) * lv
    water.scale.set(1, wh, 1)
    water.position.set(TX, TANK.y0 + 0.03 + wh / 2, TZ)
    const pouring = hold(c, T14.flow[0] + 0.15, T14.flow[1] + 0.1, T14.flow[2], T14.flow[3])
    surf.position.set(TX, TANK.y0 + 0.03 + wh + 0.002, TZ)
    surf.scale.setScalar(1 + 0.004 * pouring * Math.sin(c * TAU * 8))
    /* the float on the water, its cable up to the lid */
    const fy = TANK.y0 + 0.03 + wh + 0.035 + 0.006 * Math.sin(c * TAU * 2)
    float.position.set(FLOAT_X, fy, TZ)
    const top = TTOP - 0.02
    fcable.scale.set(1, Math.max(0.01, top - fy - 0.06), 1)
    fcable.position.set(FLOAT_X, (top + fy + 0.06) / 2, TZ)
    /* the switch: lamp and rocker */
    const on = hold(c, T14.lamp[0], T14.lamp[1], T14.lamp[2], T14.lamp[3])
    lampM.color.set('#9AA3B2').lerp(new THREE.Color(C.green), on)
    setOp(lampGlow, 0.8 * on)
    rocker.rotation.x = lerp(0.35, -0.35, on)
    /* the motor: the fan turns, the body hums */
    const run = hold(c, T14.motor[0], T14.motor[1], T14.motor[2], T14.motor[3])
    fan.rotation.z = -fanAngle(c)
    motor.position.x = PUMP_X + 0.004 * run * Math.sin(c * TAU * 40)
    motor.position.y = 0.003 * run * Math.sin(c * TAU * 56) - 0.03
    /* the water climbing the pipe, pouring in */
    const flow = hold(c, T14.flow[0], T14.flow[1], T14.flow[2], T14.flow[3])
    drops.forEach((m, k) => {
      const u = mod(c * 0.5 + k / drops.length, 1)
      pipe.path.getPointAt(u, p)
      m.position.copy(p)
      m.scale.setScalar(Math.max(0.001, flow * (u < 0.04 ? u / 0.04 : 1)))
    })
    const surfY = TANK.y0 + 0.03 + wh
    pour.scale.set(1, Math.max(0.01, TTOP - 0.02 - surfY), 1)
    pour.position.set(INLET_X, (TTOP - 0.02 + surfY) / 2, PIPEZ)
    streamM.opacity = 0.75 * pouring
    /* the tap: the handle turns, the water runs into the drain */
    const open = hold(c, T14.tapOpen[0], T14.tapOpen[1], T14.tapOpen[2], T14.tapOpen[3])
    handle.rotation.y = open * (Math.PI / 2)
    const sy = SPOUT[1]
    tapStream.scale.set(1, sy - 0.02, 1)
    tapStream.position.set(SPOUT[0], (sy + 0.02) / 2, SPOUT[2])
    ;(tapStream.material as THREE.MeshStandardMaterial).opacity = 0.7 * open
    tapDrops.forEach((m, k) => {
      const u = mod(c * 2 + k / tapDrops.length, 1)
      m.position.set(SPOUT[0] + 0.012 * Math.sin(k * 2.1), sy - u * (sy - 0.03), SPOUT[2])
      ;(m.material as THREE.MeshStandardMaterial).opacity = 0.9 * open
    })
    ;(splash.material as THREE.MeshBasicMaterial).opacity = 0.7 * open * (0.6 + 0.4 * Math.sin(c * TAU * 6))
    splash.scale.setScalar(1 + 0.3 * Math.sin(c * TAU * 6))
  }
}

/* ------------------------------------------------------------------ T14 concept: the Deployment keeping its pods */

function setupT14Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM14, AT14, FOV14)
  lights(scene, [0, 1.0, -0.8], 2.1)
  const { lampM, lampGlow } = terrace(scene, false)

  /* the controller, in the pump's place: a white block, its gear core facing us (the motor's grille) */
  const ctl = new THREE.Group()
  ctl.position.set(PUMP_X, 0, TZ - 0.1)
  ctl.scale.setScalar(1.25)
  scene.add(ctl)
  ctl.add(box(0.46, 0.46, 0.5, mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.25 }), [0, 0.33, 0], 0.05))
  ctl.add(flat(box(0.48, 0.06, 0.52, mat(C.brand, { roughness: 0.35 }), [0, 0.53, 0], 0.02)))
  const core = makeCore(0.15, C.brand)
  core.g.position.set(0, 0.31, 0.255)
  ctl.add(core.g)
  /* the glass tube in the pipe's place, big enough for a pod */
  const tubeM = new THREE.MeshStandardMaterial({ color: '#DCE8FF', roughness: 0.1, transparent: true, opacity: 0.42, depthWrite: false, emissive: new THREE.Color('#DCE8FF'), emissiveIntensity: 0.15 })
  scene.add(rod(v3([RISER_X, 0.62, PIPEZ]), v3([RISER_X, 0.66, PIPEZ]), 0.08, tubeM))
  const pipe = tube(scene, PIPE, 0.08, tubeM, 0.14)
  pipe.o.renderOrder = 3

  /* the case, in the tank's place: glass, a blue rim, a lid; three slots (the desired count), three pods */
  const TX = STAND.x
  const CWID = 1.18
  const CDEP = 0.8
  const caseG = new THREE.Group()
  const cg = glass('#D6E4FF', 0.14, 0.3)
  const shell = box(CWID, TANK.h, CDEP, cg, [TX, TANK.y0 + TANK.h / 2, TZ], 0.05)
  shell.renderOrder = 2
  caseG.add(flat(shell))
  const rimM = mat(C.brand, { roughness: 0.3, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.3 })
  for (const y of [TANK.y0 + 0.02, TTOP]) {
    caseG.add(flat(rod(v3([TX - CWID / 2, y, TZ + CDEP / 2]), v3([TX + CWID / 2, y, TZ + CDEP / 2]), 0.022, rimM)))
  }
  for (const x of [TX - CWID / 2, TX + CWID / 2]) caseG.add(flat(rod(v3([x, TANK.y0, TZ + CDEP / 2]), v3([x, TTOP, TZ + CDEP / 2]), 0.022, rimM)))
  caseG.add(box(CWID + 0.04, 0.06, CDEP + 0.04, mat('#2B3A6B', { roughness: 0.45 }), [TX, TTOP + 0.03, TZ], 0.02))
  /* the shelf the pods stand on */
  caseG.add(flat(box(CWID - 0.1, 0.03, CDEP - 0.2, mat('#FFFFFF', { roughness: 0.4 }), [TX, POD_Y - 0.155, TZ])))
  scene.add(caseG)
  /* the slots: a pale outline box per pod of the desired count */
  const ghosts = SLOTS.map((x) => {
    const g = box(0.33, 0.33, 0.33, new THREE.MeshBasicMaterial({ color: '#B7CCFA', transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }), [x, POD_Y, TZ], 0.06)
    g.renderOrder = 1
    scene.add(flat(g))
    return g
  })
  const pods = SLOTS.map((x) => {
    const p = makePod(0.28)
    p.g.position.set(x, POD_Y, TZ)
    scene.add(p.g)
    return p
  })
  /* the one that fails, and the new one */
  const neo = makePod(0.28)
  scene.add(neo.g)
  const failX = SLOTS[2]
  const cross = picture(crossTex(), 0.2, 0.2, [0, 0, 0])
  scene.add(cross)
  const tick = picture(tickTex(), 0.2, 0.2, [failX + 0.17, POD_Y + 0.2, TZ + 0.2])
  scene.add(tick)
  /* the sensor on the lid (the float's place), its beam sweeping the row */
  scene.add(cyl(0.06, 0.08, 0.06, mat('#FFFFFF', { roughness: 0.3 }), [FLOAT_X, TTOP + 0.09, TZ], 24))
  const eye = mesh(new THREE.SphereGeometry(0.05, 20, 14, 0, TAU, 0, Math.PI / 2), mat(C.brand, { roughness: 0.2, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.5 }), [FLOAT_X, TTOP + 0.12, TZ])
  scene.add(eye)
  const beam = new THREE.Group()
  beam.position.set(FLOAT_X, TTOP - 0.02, TZ)
  const BL = TTOP - 0.02 - (POD_Y + 0.17)
  const beamM = new THREE.MeshBasicMaterial({ color: '#7FA6FF', transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const cone = mesh(new THREE.ConeGeometry(0.1, BL, 24, 1, true), beamM, [0, -BL / 2, 0])
  beam.add(cone)
  scene.add(beam)
  /* the outlet chute (the tap's pipe) and the drain where a failed pod goes */
  const chuteM = new THREE.MeshStandardMaterial({ color: '#DCE8FF', roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false })
  const chute = tube(scene, [[TX + CWID / 2 - 0.02, POD_Y, TZ], [TAP_X, POD_Y, TZ], [TAP_X, 0.12, TZ]], 0.08, chuteM, 0.14)
  chute.o.renderOrder = 3
  scene.add(flat(cyl(0.16, 0.16, 0.02, mat('#C9D6F2', { roughness: 0.4 }), [TAP_X, 0.01, TZ], 32)))
  scene.add(flat(cyl(0.11, 0.11, 0.024, mat('#2B3A6B', { roughness: 0.5 }), [TAP_X, 0.012, TZ], 32)))
  const drainGlow = halo('rgba(255,138,61,0.9)', 0.5)
  drainGlow.position.set(TAP_X, 0.15, TZ + 0.1)
  scene.add(drainGlow)
  const slotGlow = halo('rgba(45,99,251,0.9)', 0.7)
  slotGlow.position.set(failX, POD_Y, TZ + 0.2)
  scene.add(slotGlow)

  const holdT14 = devHold(HOLD14)
  const clk = slideClock('T14', scene, holdT14, [{ ready: Promise.resolve() }])
  const gearAngle = spinner(L14, (c) => 0.25 + 1.6 * hold(c, T14.motor[0], T14.motor[1], T14.motor[2], T14.motor[3]), 6, TAU / 8)
  const p = new THREE.Vector3()
  const orange = new THREE.Color(C.orange)
  const blue = new THREE.Color(C.brand)
  return (t: number) => {
    const c = mod(clk.time(t), L14)
    /* every pod breathes a little */
    pods.forEach((pd, k) => {
      pd.g.position.set(SLOTS[k], POD_Y + 0.012 * Math.sin(c * TAU * 1 + k * 2.1), TZ)
      pd.g.rotation.y = 0.08 * Math.sin(c * TAU * 0.5 + k)
    })
    /* the sensor keeps checking: the beam sweeps the row (four sweeps a loop), and holds on the gap while it is open */
    const gap = hold(c, T14.out[1], T14.out[1] + 0.3, T14.drop[1] - 0.1, T14.drop[1] + 0.2)
    const sweep = 18 * DEG + 28 * DEG * Math.sin(c * TAU * 0.5)
    const onGap = Math.atan2(failX - FLOAT_X, BL)
    beam.rotation.z = lerp(sweep, onGap, hold(c, T14.lamp[0] - 0.2, T14.lamp[1], T14.lamp[2], T14.lamp[3] + 0.3))
    beamM.opacity = 0.2 + 0.12 * gap
    /* the failing pod: orange, a cross, out along the chute, down to the drain, gone */
    const fp = pods[2]
    const fail = seg(c, T14.fail[0], T14.fail[1])
    const gone = seg(c, T14.fall[0], T14.fall[1])
    const back = c > T14.drop[1] - 0.001 || c < T14.fail[0] // the slot holds a pod (the old one before, the new one after)
    fp.shellM.color.copy(blue).lerp(orange, fail * (1 - seg(c, T14.drop[0], T14.drop[0] + 0.01)))
    fp.shellM.emissive.copy(fp.shellM.color)
    const outK = seg(c, T14.out[0], T14.out[1])
    if (c >= T14.fail[0] && c < T14.drop[0]) {
      if (outK < 1) {
        fp.g.position.set(failX + (TAP_X - failX) * outK, POD_Y + 0.02 * Math.sin(c * TAU * 6) * (1 - outK), TZ)
        fp.g.scale.setScalar(lerp(1, 0.55, outK))
      } else {
        fp.g.position.set(TAP_X, lerp(POD_Y, 0.12, gone), TZ)
        fp.g.scale.setScalar(Math.max(0.001, 0.55 * (1 - gone)))
      }
      fp.g.rotation.z = 0.6 * outK + 1.5 * gone
      fp.g.visible = gone < 0.999
    } else {
      fp.g.visible = back
      fp.g.scale.setScalar(1)
      fp.g.rotation.z = 0
    }
    cross.position.set(fp.g.position.x, fp.g.position.y + 0.24 * fp.g.scale.x + 0.04, TZ + 0.2)
    const crossOn = hold(c, T14.fail[0], T14.fail[1], T14.fall[0] + 0.2, T14.fall[1])
    cross.scale.setScalar(Math.max(0.001, crossOn))
    setOp(cross, crossOn)
    setOp(drainGlow, 0.7 * hold(c, T14.fall[0], T14.fall[0] + 0.15, T14.fall[1], T14.fall[1] + 0.25))
    /* the empty slot glows while the controller restores it */
    ;(ghosts[2].material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.35 * gap * (0.6 + 0.4 * Math.sin(c * TAU * 2))
    setOp(slotGlow, 0.45 * gap)
    /* the lamp: on while the controller works */
    const on = hold(c, T14.lamp[0], T14.lamp[1], T14.lamp[2], T14.lamp[3])
    lampM.color.set('#9AA3B2').lerp(new THREE.Color(C.green), on)
    setOp(lampGlow, 0.8 * on)
    /* the controller: its gear turns slowly, fast while it works */
    core.gear.rotation.z = -gearAngle(c)
    const run = hold(c, T14.motor[0], T14.motor[1], T14.motor[2], T14.motor[3])
    core.ringM.emissiveIntensity = 0.6 + 0.6 * run
    /* the new pod: forms at the controller, climbs the tube, drops into the slot (it is the slot's pod from then on) */
    const made = seg(c, T14.make[0], T14.make[1])
    const climb = seg(c, T14.climb[0], T14.climb[1])
    const drop = seg(c, T14.drop[0], T14.drop[1])
    neo.g.visible = c > T14.make[0] && c < T14.drop[1]
    if (climb <= 0) {
      neo.g.position.set(RISER_X, 0.72, PIPEZ)
      neo.g.scale.setScalar(Math.max(0.001, 0.42 * made))
    } else if (drop <= 0) {
      pipe.path.getPointAt(climb, p)
      neo.g.position.copy(p)
      neo.g.scale.setScalar(0.42)
    } else {
      neo.g.position.set(lerp(INLET_X, failX, drop), lerp(TTOP - 0.1, POD_Y, drop), lerp(PIPEZ, TZ, drop))
      neo.g.scale.setScalar(lerp(0.42, 1, drop))
    }
    neo.g.rotation.y = 0.6 * Math.sin(c * TAU * 0.5)
    const tk = hold(c, T14.tick[0], T14.tick[1], T14.tick[2], T14.tick[3])
    tick.scale.setScalar(Math.max(0.001, tk))
    setOp(tick, tk)
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
  I_T09Everyday: card('T09', setupT09Everyday, devHold(HOLD9)),
  I_T09Concept: card('T09', setupT09Concept, devHold(HOLD9)),
  I_T14Everyday: card('T14', setupT14Everyday, devHold(HOLD14)),
  I_T14Concept: card('T14', setupT14Concept, devHold(HOLD14)),
}
export const css = ''
