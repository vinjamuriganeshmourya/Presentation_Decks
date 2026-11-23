import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import svcUrl from '../images/k8s-svc.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER J · SESSION 20 (Kubernetes Fundamentals) ANALOGY, real-time 3D on the engine's `@/engine/three-stage`, built
 * the way Session 18's j.tsx / i.tsx are: a perspective camera on a real place, Character Lab people from the engine's
 * `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO TEXT on either card, ONE
 * wall-clock loop shared by both cards (custom/clock.tsx, tap to pause), the loop ending in the state it starts in,
 * held frames (`?still`, thumbnails) at HOLD. Nobody walks toward or away from the camera: people step sideways.
 * The rig has no seated pose, so the desks are STANDING desks (generate-slides correction 14).
 *
 * SLIDE 43 · T19-AN (TR 19): "An office's internal landline extension stays the same even as different employees
 * rotate through that desk: just as a ClusterIP keeps one address while the pods answering it change."
 *
 *   place (x)        everyday: an office                              concept: inside the cluster
 *   -1.1             a colleague at his own desk, his phone           the caller pod on its rail, its port
 *   cable            the phone line along the desks and the floor     the cluster network wire, the same route
 *    0.82            the extension's desk phone (never moves)         the Service (ClusterIP): a fixed block, its mark
 *    0.9             whoever is standing at that desk                 whichever pod sits behind the Service
 *    1.42 ->         the cubicle partition: the way in and out        the same partition: pods come and go behind it
 *
 *   Three employees (teal, purple, gold) and three pods (the same three accents) take turns, one per 3 s, so the 9 s
 *   loop is one full rotation. Each 3 s turn, on both cards at the same moments:
 *   0.00 - 0.66      the last one walks out behind the partition      the old pod slides out behind it
 *   0.56 - 1.22      the next one walks in to the desk                a new pod slides in behind the Service
 *   0.10 - 0.92      the colleague lifts his handset and dials        the caller pod sends a request (to its port)
 *   0.94 - 1.34      the call runs along the line                     the request runs along the wire
 *   1.34 - 1.92      the SAME desk phone rings                        the SAME Service lights, rings spread from it
 *   1.62 - 2.12      whoever is there picks it up                     the request goes on to the pod behind it
 *   2.12 - 2.66      they talk: the answer runs back along the line   the answer runs back to the caller pod
 *   2.66 - 2.95      both hang up                                     the call ends
 */

const W = 470
const H = 390
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : d
}

const C = {
  brand: '#2D63FB',
  navy: '#1F2E63',
  k8s: '#326CE5',
  call: '#5B8CFF',
  answer: '#3BD16F',
  teal: '#14B8A6',
  purple: '#7C5CE0',
  gold: '#F2C14E',
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
    const pad = px * 0.12
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}

/* ------------------------------------------------------------------ modelling helpers */

type V3 = [number, number, number]
const v3 = (p: V3) => new THREE.Vector3(...p)
const box = (w: number, h: number, d: number, m: THREE.Material, pos: V3, r = 0) => mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
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
const setOp = (m: THREE.Mesh, o: number) => ((m.material as THREE.MeshBasicMaterial).opacity = o)

/** hemisphere, a key with soft shadows, a rim */
function lights(scene: THREE.Scene, target: V3) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 4, target[1] + 9, target[2] + 8)
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

/** a polyline a pulse runs along */
type Path = { pts: THREE.Vector3[]; cum: number[]; len: number }
function mkPath(pts: THREE.Vector3[]): Path {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]))
  return { pts, cum, len: cum[cum.length - 1] }
}
function pathAt(p: Path, s: number, out: THREE.Vector3) {
  const v = Math.min(p.len, Math.max(0, s))
  let i = 1
  while (i < p.cum.length - 1 && p.cum[i] < v) i++
  const a = p.cum[i - 1]
  const k = (v - a) / Math.max(1e-6, p.cum[i] - a)
  return out.lerpVectors(p.pts[i - 1], p.pts[i], k)
}
/** a round cable along an orthogonal path (rounded joints) */
function cable(scene: THREE.Scene, p: Path, m: THREE.Material, r: number) {
  const g = new THREE.Group()
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.pts[i - 1]
    const b = p.pts[i]
    const t = mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 10), m)
    t.position.copy(a).add(b).multiplyScalar(0.5)
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    g.add(t)
    if (i < p.pts.length - 1) g.add(mesh(new THREE.SphereGeometry(r * 1.02, 10, 8), m, [b.x, b.y, b.z]))
  }
  scene.add(flat(g))
  return g
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
/** face keys written in a person's own phase (phase = c - off), turned into loop time and sorted */
const facesIn = (keys: [number, string][], off: number, loop: number): [number, string][] => keys.map(([t, f]) => [mod(t + off, loop), f] as [number, string]).sort((a, b) => a[0] - b[0])
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}
const who = (base: CharacterConfig, o: { name: string; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})
/* Session 16's lesson: frames at one fixed size and no idle breathing (a still pose is one shared picture) */
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

/* role clothing (rig body frame 400 x 600): the office ID on a lanyard */
const LANYARD = (strap: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={strap} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={strap} opacity={0.55} />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 99 to the grip; an angle is measured from hanging straight down, positive lifts away from the body) ---- */

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
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180
/** for a hand raised to the ear: the elbow out to the side, never across the chest */
function ikOut(side: 'L' | 'R', sh: number, p: Pt): Arm {
  const a = ik2(side, sh, p, false)
  const b = ik2(side, sh, p, true)
  const na = { s: wrap(a.s), e: a.e }
  const nb = { s: wrap(b.s), e: b.e }
  return na.s >= 0 && (nb.s < 0 || na.s < nb.s) ? na : nb
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
const mixArm = (a: Arm, b: Arm, k: number): Arm => ({ s: lerp(a.s, b.s, clamp01(k)), e: lerp(a.e, b.e, clamp01(k)) })
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
const talk = (p: Pose, c: number, w: number) => to(p, 'mouthOpen', 0.12 + 0.22 * Math.abs(Math.sin(c * 7.3)) * Math.abs(Math.sin(c * 2.1 + 1)), w)

/* ================================================================== T19 · the office extension */

const L = 9
const S = 3 /* one turn at the desk; three employees, so the loop is one full rotation */
const N = 3
const F = 108
const FC = 36 /* the colleague's loop is ONE call: a third of the frames */
const HOLD = 2.35 /* employee A on the extension, the colleague on the line, the answer running back */
const E = {
  leave: [0.0, 0.66] as const,
  arrive: [0.56, 1.22] as const,
  cLift: [0.08, 0.22, 0.38] as const, // the colleague: hand to the cradle, handset to the ear
  dial: [0.42, 0.52, 0.86, 0.96] as const,
  taps: [0.57, 0.71, 0.84],
  run: [0.94, 1.34] as const,
  ring: [1.34, 1.92] as const,
  reach: [1.62, 1.88] as const,
  lift: [1.92, 2.12] as const,
  back: [2.2, 2.54] as const, // the answer along the line
  talkE: [2.14, 2.4] as const,
  talkC: [2.42, 2.66] as const,
  hang: [2.66, 2.84] as const,
  armDown: [2.84, 2.98] as const,
}
const P = {
  caller: -0.9,
  ext: 0.74,
  off: 1.98,
  lane: -0.98,
  deskH: 0.88,
  deskD: 0.45,
  deskW: 0.72,
  deskZ: -0.42,
  phoneDx: -0.08,
  phoneZ: -0.35,
  wallZ: -1.9,
  part: { x0: 1.22, x1: 3.0, z: -0.62, h: 1.95 },
  railY: 1.12,
  pod: 0.36,
}
const phoneX = (personX: number) => personX + P.phoneDx
/** the line both cards share: caller's phone (port) -> along the desk -> down its leg -> the floor -> up the other desk
    -> the extension phone (the Service) */
const Y = P.deskH + 0.014
const LINE: V3[] = [
  [phoneX(P.caller) + 0.06, Y, P.phoneZ - 0.07],
  [phoneX(P.caller) + 0.06, Y, -0.6],
  [P.caller + 0.3, Y, -0.6],
  [P.caller + 0.3, 0.016, -0.6],
  [P.ext - 0.3, 0.016, -0.6],
  [P.ext - 0.3, Y, -0.6],
  [phoneX(P.ext) - 0.02, Y, -0.6],
  [phoneX(P.ext) - 0.02, Y, P.phoneZ - 0.07],
]

/** employee / pod k's own phase: k arrives in turn k */
const phase = (c: number, k: number) => mod(c - k * S, L)
/** where employee / pod k is at its phase f; walking 0..1, direction, on screen */
function place(f: number): { x: number; walking: number; dir: number; shown: boolean } {
  const walkW = (a: number, b: number) => hold(f, a, a + 0.08, b - 0.08, b)
  if (f < E.arrive[0]) return { x: P.off, walking: 0, dir: 0, shown: false }
  if (f < E.arrive[1]) return { x: lerp(P.off, P.ext, seg(f, E.arrive[0], E.arrive[1])), walking: walkW(E.arrive[0], E.arrive[1]), dir: -1, shown: true }
  if (f < S) return { x: P.ext, walking: 0, dir: 0, shown: true }
  if (f < S + E.leave[1]) return { x: lerp(P.ext, P.off, seg(f, S + E.leave[0], S + E.leave[1])), walking: walkW(S + E.leave[0], S + E.leave[1]), dir: 1, shown: true }
  return { x: P.off, walking: 0, dir: 0, shown: false }
}

/** the shared camera (both cards) */
function cam19(camera: THREE.PerspectiveCamera) {
  camera.fov = 37
  camera.position.set(-0.02, 1.98, 3.1)
  camera.lookAt(-0.02, 1.06, -0.6)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

function floor(scene: THREE.Scene, a: string, b: string) {
  const fl = mesh(new THREE.PlaneGeometry(10, 8), mat('#ffffff', { map: tileTex(a, b, 4, [12, 10]), roughness: 0.85 }), [0, 0, 0.5])
  fl.rotation.x = -Math.PI / 2
  fl.castShadow = false
  scene.add(fl)
}
function backWall(scene: THREE.Scene, color: string, trim: string) {
  scene.add(flat(box(12, 4, 0.1, mat(color, { roughness: 0.95, emissive: new THREE.Color(color), emissiveIntensity: 0.75 }), [0, 2, P.wallZ - 0.05])))
  scene.add(flat(box(12, 0.1, 0.03, mat(trim, { roughness: 0.7 }), [0, 0.05, P.wallZ + 0.015])))
}
/** a standing desk (the rig has no seated pose): top, two T-legs; returns the top's material */
function desk(scene: THREE.Scene, x: number, top: string, legs: string) {
  const topM = mat(top, { roughness: 0.45 })
  const legM = mat(legs, { roughness: 0.4, metalness: 0.4 })
  scene.add(box(P.deskW, 0.04, P.deskD, topM, [x, P.deskH - 0.02, P.deskZ], 0.012))
  for (const sx of [-1, 1]) {
    scene.add(box(0.055, P.deskH - 0.04, 0.055, legM, [x + sx * 0.3, (P.deskH - 0.04) / 2, P.deskZ], 0.01))
    scene.add(box(0.07, 0.03, P.deskD - 0.04, legM, [x + sx * 0.3, 0.015, P.deskZ], 0.01))
  }
  return topM
}
/** the cubicle partition at the right: where the employees (the pods) come and go */
function partition(scene: THREE.Scene, panel: string, frame: string) {
  const Q = P.part
  const w = Q.x1 - Q.x0
  scene.add(box(w, Q.h, 0.06, mat(panel, { roughness: 0.9, emissive: new THREE.Color(panel), emissiveIntensity: 0.35 }), [Q.x0 + w / 2, Q.h / 2 + 0.03, Q.z], 0.01))
  scene.add(box(w + 0.02, 0.04, 0.08, mat(frame, { roughness: 0.35, metalness: 0.5 }), [Q.x0 + w / 2, Q.h + 0.05, Q.z], 0.01))
  scene.add(box(0.04, Q.h + 0.06, 0.08, mat(frame, { roughness: 0.35, metalness: 0.5 }), [Q.x0, (Q.h + 0.06) / 2, Q.z], 0.01))
}
/** ripples spreading over the top it stands on, from a ringing thing (both cards: the phone, the Service): flat on the
    desk, so they never cross the person (the pod) standing behind it */
function ringWaves(scene: THREE.Scene, color: string) {
  const list = Array.from({ length: 3 }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.118, 64), new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }))
    m.rotation.x = -Math.PI / 2
    m.renderOrder = 5
    scene.add(m)
    return m
  })
  return (at: THREE.Vector3, f: number, on: number) => {
    list.forEach((m, i) => {
      const k = mod((f - E.ring[0]) * 2.4 + i / 3, 1)
      m.position.copy(at)
      m.scale.set(1 + 1.3 * k, 1 + 0.55 * k, 1)
      setOp(m, on * (1 - k) * 0.95)
    })
  }
}
/** a glowing pulse that runs along the line */
function pulse(scene: THREE.Scene, color: string, glow: string, r: number) {
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false })
  const s = mesh(new THREE.SphereGeometry(r, 16, 12), m, [0, 0, 0])
  s.castShadow = false
  const h = halo(glow, r * 7)
  scene.add(s, h)
  return (pos: THREE.Vector3 | null, camera: THREE.Camera) => {
    s.visible = !!pos
    setOp(h, pos ? 0.85 : 0)
    if (!pos) return
    s.position.copy(pos)
    h.position.copy(pos)
    h.quaternion.copy(camera.quaternion)
  }
}

/* ------------------------------------------------------------------ T19 everyday: the office */

/** a desk phone: its base (keypad on the right, cradle on the left) and the handset (moved by the update) */
function makePhone(scene: THREE.Scene, x: number) {
  const base = new THREE.Group()
  const body = mat('#2F3A52', { roughness: 0.35 })
  base.add(box(0.2, 0.045, 0.15, body, [0, 0.0225, 0], 0.012))
  base.add(box(0.075, 0.02, 0.14, mat('#3A4660', { roughness: 0.35 }), [-0.055, 0.052, 0], 0.008))
  const pad = canvasTex(48, 60, (g) => {
    g.fillStyle = '#3A4660'
    g.fillRect(0, 0, 48, 60)
    for (let r = 0; r < 4; r++)
      for (let q = 0; q < 3; q++) {
        g.fillStyle = '#DCE3F0'
        g.beginPath()
        g.roundRect(5 + q * 14, 5 + r * 13.5, 10, 9, 2)
        g.fill()
      }
  })
  const padM = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.095), basic(pad, { transparent: false }))
  padM.rotation.x = -Math.PI / 2
  padM.position.set(0.045, 0.0462, 0.0)
  base.add(padM)
  /* the key being pressed lights; the extension's light blinks while it rings */
  const keyM = new THREE.MeshBasicMaterial({ color: '#8DB0FF', toneMapped: false, transparent: true, opacity: 0 })
  const key = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.018), keyM)
  key.rotation.x = -Math.PI / 2
  key.position.set(0.045, 0.047, 0.0)
  base.add(key)
  const ledM = new THREE.MeshBasicMaterial({ color: '#5B8CFF', toneMapped: false })
  base.add(mesh(new THREE.SphereGeometry(0.009, 12, 8), ledM, [0.075, 0.046, 0.06]))
  base.position.set(x, P.deskH, P.phoneZ)
  const hand = new THREE.Group()
  const hm = mat('#2F3A52', { roughness: 0.35 })
  hand.add(box(0.034, 0.18, 0.034, hm, [0, 0, 0], 0.012))
  hand.add(box(0.05, 0.045, 0.048, hm, [0, 0.078, 0.01], 0.01))
  hand.add(box(0.05, 0.045, 0.048, hm, [0, -0.078, 0.01], 0.01))
  scene.add(base, hand)
  const cradle = new THREE.Vector3(x - 0.055, P.deskH + 0.085, P.phoneZ)
  return { base, hand, cradle, key, keyM, ledM }
}
/** the handset: in the cradle (k 0) or in the hand (k 1); `buzz` rattles it while it rings */
function placeHandset(ph: ReturnType<typeof makePhone>, k: number, hand: THREE.Vector3, camera: THREE.Camera, buzz = 0) {
  ph.hand.position.copy(ph.cradle).lerp(hand, k)
  ph.hand.position.y += buzz * 0.012
  ph.hand.quaternion.copy(camera.quaternion)
  ph.hand.rotateZ(lerp(Math.PI / 2, -0.35, k) + buzz * 0.12)
  if (k < 0.5) ph.hand.rotateX(lerp(-Math.PI / 2, 0, k * 2))
}

function setupEveryday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F4EFE6')
  cam19(camera)
  lights(scene, [0, 1.0, -0.6])
  floor(scene, '#D9DEE8', '#C7CEDC')
  backWall(scene, '#F3EBDD', '#8C6440')
  /* two office windows on the back wall: daylight, the room is a real office */
  const sky = canvasTex(120, 80, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 80)
    gr.addColorStop(0, '#BFD7FF')
    gr.addColorStop(1, '#EAF2FF')
    g.fillStyle = gr
    g.fillRect(0, 0, 120, 80)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (const [x, y, r] of [[30, 30, 9], [42, 27, 11], [54, 31, 8], [86, 50, 7], [96, 47, 9]]) {
      g.beginPath()
      g.arc(x, y, r, 0, TAU)
      g.fill()
    }
  })
  for (const x of [-0.95, 0.2]) {
    scene.add(flat(box(0.96, 0.7, 0.05, mat('#FFFFFF', { roughness: 0.4 }), [x, 1.72, P.wallZ + 0.01], 0.01)))
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.6), basic(sky, { transparent: false }))
    glass.position.set(x, 1.72, P.wallZ + 0.04)
    scene.add(glass)
    scene.add(flat(box(0.03, 0.6, 0.02, mat('#FFFFFF'), [x, 1.72, P.wallZ + 0.05])))
    scene.add(flat(box(0.86, 0.03, 0.02, mat('#FFFFFF'), [x, 1.72, P.wallZ + 0.05])))
  }
  desk(scene, P.caller, '#E6D3B3', '#4A5468')
  desk(scene, P.ext, '#E6D3B3', '#4A5468')
  partition(scene, '#C9D5EA', '#8C97AD')

  /* the phone line along both desks and the floor */
  const line = mkPath(LINE.map(v3))
  cable(scene, line, mat('#3A4256', { roughness: 0.55 }), 0.009)
  const pC = makePhone(scene, phoneX(P.caller))
  const pE = makePhone(scene, phoneX(P.ext))
  const rings = ringWaves(scene, C.brand)
  const ringAt = new THREE.Vector3(phoneX(P.ext), P.deskH + 0.004, P.phoneZ)
  const callDot = pulse(scene, C.call, 'rgba(91,140,255,0.95)', 0.022)
  const backDot = pulse(scene, C.answer, 'rgba(59,209,111,0.95)', 0.022)

  /* people: the colleague who calls, and three employees who take turns at the extension's desk */
  const cCfg = who(CAST_PRESETS.arjun, { name: 'Colleague', skinTone: 'wheatish', hair: { style: 'sidePart', color: 'black' }, outfit: { top: 'shirtTie', topColor: '#DCE6FB', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true } })
  const eCfg = [
    who(CAST_PRESETS.riya, { name: 'Employee A', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: C.teal as `#${string}`, bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true } }),
    who(CAST_PRESETS.rohan, { name: 'Employee B', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: C.purple as `#${string}`, bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { beard: 'stubble', watch: true } }),
    who(CAST_PRESETS.ananya, { name: 'Employee C', skinTone: 'fair', hair: { style: 'ponytail', color: 'brown' }, outfit: { top: 'kurta', topColor: C.gold as `#${string}`, bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#7A4A2A' }, accessories: { earrings: true, glasses: 'round' } }),
  ]
  const hC = 1.72
  const hE = [1.62, 1.72, 1.63]
  const shC = buildSkin(cCfg).shoulderHalf
  const shE = eCfg.map((c) => buildSkin(c).shoulderHalf)
  const cRoot = new THREE.Vector3(P.caller, 0, P.lane)
  const eRoot = new THREE.Vector3(P.ext, 0, P.lane)

  /* the arms, solved to the cradle, the ear and the keys (rig: the ear at about (146, 136) for the viewer's left hand) */
  const rest: Arm = { s: 9, e: 10 }
  const restR: Arm = { s: 9, e: 10 }
  const ear = (sh: number) => ikOut('L', sh, { x: 140, y: 150 })
  const cCradle = ik('L', shC, worldToRig(pC.cradle, cRoot, hC, camera))
  const cEar = ear(shC)
  const keyPt = (i: number, up: number) => new THREE.Vector3(phoneX(P.caller) + 0.035 + (i % 2) * 0.02, P.deskH + 0.07 + up, P.phoneZ - 0.02 + i * 0.015)
  const cKey = [0, 1, 2].map((i) => ({ down: ik('R', shC, worldToRig(keyPt(i, 0), cRoot, hC, camera)), up: ik('R', shC, worldToRig(keyPt(i, 0.05), cRoot, hC, camera)) }))
  const eCradle = eCfg.map((_, k) => ik('L', shE[k], worldToRig(pE.cradle, eRoot, hE[k], camera)))
  const eEar = eCfg.map((_, k) => ear(shE[k]))

  /* the colleague: handset up, three keys, waits, talks, hangs up; one call every S */
  const cArmL = (f: number): Arm => {
    let a = mixArm(rest, cCradle, hold(f, E.cLift[0], E.cLift[1], E.armDown[0], E.armDown[1]))
    a = mixArm(a, cEar, hold(f, E.cLift[1], E.cLift[2], E.hang[0], E.hang[1]))
    return a
  }
  const cArmR = (f: number): Arm => {
    /* hovering over the key it is about to press, down on each tap */
    const i = f < (E.taps[0] + E.taps[1]) / 2 ? 0 : f < (E.taps[1] + E.taps[2]) / 2 ? 1 : 2
    const press = Math.max(...E.taps.map((t) => hold(f, t - 0.05, t, t, t + 0.05)))
    const at = mixArm(cKey[i].up, cKey[i].down, press)
    return mixArm(restR, at, hold(f, E.dial[0], E.dial[1], E.dial[2], E.dial[3]))
  }
  const cHandset = (f: number) => hold(f, E.cLift[1] - 0.02, E.cLift[1] + 0.02, E.hang[1] - 0.04, E.hang[1])
  const cPose = (p: Pose, c: number) => {
    const f = mod(c, S)
    const l = cArmL(f)
    const r = cArmR(f)
    p.shoulderL = l.s
    p.elbowL = l.e
    p.shoulderR = r.s
    p.elbowR = r.e
    p.wristL = -30 * hold(f, E.cLift[1], E.cLift[2], E.hang[0], E.hang[1])
    /* eyes on the keys while dialling, then across to the extension's desk while it rings and they talk */
    const keys = hold(f, E.cLift[0], E.dial[1], E.dial[2], E.run[0] + 0.1)
    to(p, 'headNod', 0.22, keys)
    to(p, 'lookY', 0.6, keys)
    to(p, 'lookX', 0.2, keys)
    const across = hold(f, E.run[0], E.run[0] + 0.25, E.hang[0], E.hang[1] + 0.1)
    to(p, 'headTurn', 0.38, across)
    to(p, 'lookX', 0.85, across)
    talk(p, c, hold(f, E.talkC[0], E.talkC[0] + 0.04, E.talkC[1] - 0.04, E.talkC[1]))
  }
  const C_FACES: [number, string][] = [
    [0, 'neutral'],
    [E.dial[0], 'thinking'],
    [E.run[0], 'listening'],
    [E.lift[1], 'grin'],
    [E.hang[1], 'happy'],
  ]

  /* an employee: walks in, the phone rings, picks it up, talks, puts it down, walks out */
  const eArmL = (k: number, f: number, walking: number): Arm => {
    let a: Arm = { s: rest.s + swing(f, walking), e: rest.e }
    a = mixArm(a, eCradle[k], hold(f, E.reach[0], E.reach[1], E.armDown[0], E.armDown[1]))
    a = mixArm(a, eEar[k], hold(f, E.lift[0], E.lift[1], E.hang[0], E.hang[1]))
    return a
  }
  const eHandset = (f: number) => hold(f, E.lift[0] - 0.02, E.lift[0] + 0.02, E.hang[1] - 0.04, E.hang[1])
  const ePose = (k: number) => (p: Pose, c: number) => {
    const f = phase(c, k)
    const at = place(f)
    const l = eArmL(k, f, at.walking)
    p.shoulderL = l.s
    p.elbowL = l.e
    p.shoulderR = restR.s - swing(f, at.walking)
    p.elbowR = restR.e
    p.wristL = -30 * hold(f, E.lift[0], E.lift[1], E.hang[0], E.hang[1])
    walkLegs(p, f, at.walking, at.dir)
    /* the ring: eyes down on the phone */
    const ph = hold(f, E.ring[0], E.ring[0] + 0.15, E.lift[0], E.lift[1])
    to(p, 'headTurn', -0.2, ph)
    to(p, 'lookX', -0.5, ph)
    to(p, 'headNod', 0.22, ph)
    to(p, 'lookY', 0.65, ph)
    /* on the phone: toward the colleague across the room */
    const line = hold(f, E.lift[0], E.lift[1], E.hang[0], E.hang[1])
    to(p, 'headTurn', -0.3, line)
    to(p, 'lookX', -0.8, line)
    talk(p, c, hold(f, E.talkE[0], E.talkE[0] + 0.04, E.talkE[1] - 0.04, E.talkE[1]))
  }
  const E_FACES: [number, string][] = [
    [0, 'neutral'],
    [E.arrive[0], 'happy'],
    [E.ring[0] + 0.05, 'surprised'],
    [E.reach[0], 'listening'],
    [E.lift[1], 'grin'],
    [E.hang[0], 'happy'],
    [S + 0.8, 'neutral'],
  ]

  const hold19 = devHold(HOLD)
  const colleague = person({ config: cCfg, dress: withNeck(LANYARD(C.navy)), seed: 1901, faces: C_FACES, pose: cPose, loop: S, height: hC, frames: FC, redraw, holdT: mod(hold19, S) })
  colleague.object.position.copy(cRoot)
  const staff = eCfg.map((cfg, k) => person({ config: cfg, dress: withNeck(LANYARD(C.navy)), seed: 1910 + k, faces: facesIn(E_FACES, k * S, L), pose: ePose(k), loop: L, height: hE[k], frames: F, redraw, holdT: hold19 }))
  scene.add(colleague.object, ...staff.map((s) => s.object))
  const clk = slideClock('J19', scene, hold19, [colleague, ...staff])

  const hand = new THREE.Vector3()
  const root = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L)
    const f = mod(c, S)
    const cqC = frameT(c, S, FC)
    colleague.update(mod(c, S), camera)
    /* the colleague's handset and the key light */
    handWorld('L', shC, cArmL(cqC), hC, cRoot, camera, hand)
    placeHandset(pC, cHandset(cqC), hand, camera)
    const press = Math.max(...E.taps.map((tp) => hold(f, tp - 0.03, tp, tp + 0.02, tp + 0.08)))
    pC.keyM.opacity = press
    const ki = f < (E.taps[0] + E.taps[1]) / 2 ? 0 : f < (E.taps[1] + E.taps[2]) / 2 ? 1 : 2
    pC.key.position.set(0.035 + (ki % 2) * 0.02 - 0.0, 0.047, -0.02 + ki * 0.015)
    pC.ledM.color.set(cHandset(f) > 0.5 ? C.answer : '#5B8CFF')

    /* the employees */
    let inHand = 0
    for (let k = 0; k < N; k++) {
      const fk = phase(c, k)
      const at = place(fk)
      const s = staff[k]
      root.set(at.x, bob(at.walking, fk), P.lane)
      s.object.position.copy(root)
      s.object.visible = at.shown
      s.update(c, camera)
      const cq = frameT(c, L, F)
      const fq = phase(cq, k)
      if (fq < S && eHandset(fq) > 0) {
        handWorld('L', shE[k], eArmL(k, fq, 0), hE[k], eRoot, camera, hand)
        inHand = eHandset(fq)
      }
    }
    /* the extension's handset: rattles while it rings, then in the hand of whoever is at the desk */
    const ringing = hold(f, E.ring[0], E.ring[0] + 0.05, E.lift[0] - 0.05, E.lift[0])
    const buzz = ringing * Math.sin(f * 70)
    placeHandset(pE, inHand, inHand > 0 ? hand : pE.cradle, camera, inHand > 0 ? 0 : buzz)
    pE.ledM.color.set(ringing > 0.5 && Math.sin(f * 30) > 0 ? '#FFFFFF' : inHand > 0.5 ? C.answer : '#5B8CFF')
    rings(ringAt, f, ringing)
    /* the call down the line, and the answer back */
    callDot(f >= E.run[0] && f < E.run[1] ? pathAt(line, seg(f, E.run[0], E.run[1]) * line.len, tmp) : null, camera)
    backDot(f >= E.back[0] && f < E.back[1] ? pathAt(line, (1 - seg(f, E.back[0], E.back[1])) * line.len, tmp) : null, camera)
  }
}

/* ------------------------------------------------------------------ T19 concept: the caller pod, the Service, the pods */

/** a pod: the Kubernetes-blue cube (the pod icon's own shape), its accent band, a status light */
function makePod(scene: THREE.Scene, accent: string) {
  const g = new THREE.Group()
  const s = P.pod
  g.add(box(s, s, s, mat(C.k8s, { roughness: 0.28, metalness: 0.1 }), [0, s / 2, 0], 0.05))
  g.add(box(s + 0.012, 0.05, s + 0.012, mat(accent, { roughness: 0.35 }), [0, s * 0.3, 0], 0.012))
  /* the white cube face of the pod icon, drawn on its front */
  const face = canvasTex(64, 64, (q) => {
    q.strokeStyle = '#FFFFFF'
    q.lineWidth = 4
    q.lineJoin = 'round'
    q.beginPath()
    q.moveTo(32, 10)
    q.lineTo(52, 21)
    q.lineTo(52, 43)
    q.lineTo(32, 54)
    q.lineTo(12, 43)
    q.lineTo(12, 21)
    q.closePath()
    q.moveTo(12, 21)
    q.lineTo(32, 32)
    q.lineTo(52, 21)
    q.moveTo(32, 32)
    q.lineTo(32, 54)
    q.stroke()
  })
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.5, s * 0.5), basic(face))
  fm.position.set(0, s * 0.64, s / 2 + 0.002)
  g.add(fm)
  const ledM = new THREE.MeshBasicMaterial({ color: '#8DB0FF', toneMapped: false })
  g.add(mesh(new THREE.SphereGeometry(0.018, 14, 10), ledM, [s * 0.36, s * 0.12, s / 2 + 0.004]))
  const glow = halo('rgba(59,209,111,0.9)', 0.7)
  scene.add(glow)
  scene.add(g)
  return { g, ledM, glow }
}
/** a request / an answer: a small rounded block with an envelope on its face */
function makeToken(scene: THREE.Scene, color: string, glow: string) {
  const g = new THREE.Group()
  g.add(box(0.11, 0.09, 0.07, mat(color, { roughness: 0.3, emissive: new THREE.Color(color), emissiveIntensity: 0.35 }), [0, 0, 0], 0.018))
  const env = canvasTex(64, 48, (x) => {
    x.fillStyle = '#FFFFFF'
    x.beginPath()
    x.roundRect(6, 8, 52, 34, 5)
    x.fill()
    x.strokeStyle = color
    x.lineWidth = 3.5
    x.lineJoin = 'round'
    x.beginPath()
    x.moveTo(9, 12)
    x.lineTo(32, 29)
    x.lineTo(55, 12)
    x.stroke()
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), basic(env))
  face.position.set(0, 0, 0.036)
  g.add(face)
  const h = halo(glow, 0.26)
  scene.add(g, h)
  return (pos: THREE.Vector3 | null, camera: THREE.Camera) => {
    g.visible = !!pos
    setOp(h, pos ? 0.7 : 0)
    if (!pos) return
    g.position.copy(pos)
    h.position.copy(pos)
    h.quaternion.copy(camera.quaternion)
  }
}

function setupConcept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  cam19(camera)
  lights(scene, [0, 1.0, -0.6])
  floor(scene, '#E3EAF8', '#C9D5EC')
  backWall(scene, '#E9EFFA', C.navy)
  desk(scene, P.caller, '#DDE6F7', C.navy)
  desk(scene, P.ext, '#DDE6F7', C.navy)
  partition(scene, '#D6E0F3', '#7F93BD')
  /* the light strip on each platform's front edge */
  for (const x of [P.caller, P.ext]) scene.add(flat(box(P.deskW - 0.1, 0.012, 0.01, new THREE.MeshBasicMaterial({ color: '#8DB0FF', toneMapped: false }), [x, P.deskH - 0.02, P.deskZ + P.deskD / 2 + 0.003])))

  /* the rails the pods ride (at the places the people stand): the caller's, and the one behind the Service that runs
     on behind the partition */
  const railM = mat('#9DB3E0', { roughness: 0.3, metalness: 0.4 })
  const rail = (x0: number, x1: number, posts: number[]) => {
    scene.add(box(x1 - x0, 0.035, 0.12, railM, [(x0 + x1) / 2, P.railY - 0.0175, P.lane], 0.01))
    for (const x of posts) scene.add(box(0.035, P.railY - 0.035, 0.035, railM, [x, (P.railY - 0.035) / 2, P.lane], 0.008))
  }
  rail(P.caller - 0.32, P.caller + 0.32, [P.caller - 0.26, P.caller + 0.26])
  rail(P.ext - 0.36, P.part.x1, [P.ext - 0.3, P.ext + 0.3])

  /* the wire along the same route as the phone line */
  const line = mkPath(LINE.map(v3))
  cable(scene, line, mat('#5B7FE0', { roughness: 0.4 }), 0.011)
  /* the caller's port at its phone's place */
  const portM = new THREE.MeshBasicMaterial({ color: '#5B8CFF', toneMapped: false })
  scene.add(box(0.16, 0.06, 0.12, mat('#3B4F86', { roughness: 0.35, metalness: 0.2 }), [phoneX(P.caller), P.deskH + 0.03, P.phoneZ], 0.012))
  scene.add(mesh(new THREE.SphereGeometry(0.011, 12, 8), portM, [phoneX(P.caller) + 0.05, P.deskH + 0.045, P.phoneZ + 0.06]))

  /* the Service (ClusterIP) at the extension phone's place: a fixed block, its mark, a beacon that rings */
  const SV = new THREE.Vector3(phoneX(P.ext), P.deskH, P.phoneZ)
  scene.add(box(0.28, 0.19, 0.16, mat(C.navy, { roughness: 0.3, metalness: 0.25 }), [SV.x, SV.y + 0.095, SV.z], 0.025))
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), basic(markTex(svcUrl, redraw), { transparent: false }))
  mark.position.set(SV.x, SV.y + 0.095, SV.z + 0.082)
  scene.add(mark)
  scene.add(cyl(0.035, 0.045, 0.03, mat('#5E6B86', { metalness: 0.5, roughness: 0.3 }), [SV.x, SV.y + 0.205, SV.z], 20))
  const beaconM = new THREE.MeshStandardMaterial({ color: '#BFD2FF', emissive: new THREE.Color(C.call), emissiveIntensity: 0.4, roughness: 0.3 })
  scene.add(mesh(new THREE.SphereGeometry(0.04, 24, 16, 0, TAU, 0, Math.PI / 2), beaconM, [SV.x, SV.y + 0.22, SV.z]))
  const beaconGlow = halo('rgba(91,140,255,0.95)', 0.4)
  beaconGlow.position.set(SV.x, SV.y + 0.25, SV.z + 0.05)
  scene.add(beaconGlow)
  const rings = ringWaves(scene, C.brand)
  const ringAt = new THREE.Vector3(SV.x, SV.y + 0.004, SV.z)

  /* the pods: the caller's (fixed), and three that take turns behind the Service */
  const caller = makePod(scene, C.brand)
  caller.g.position.set(P.caller, P.railY, P.lane)
  const pods = [C.teal, C.purple, C.gold].map((a) => makePod(scene, a))
  const req = makeToken(scene, C.call, 'rgba(91,140,255,0.95)')
  const ans = makeToken(scene, C.answer, 'rgba(59,209,111,0.95)')

  const clk = slideClock('J19', scene, devHold(HOLD), [])
  const podFront = (x: number, out: THREE.Vector3) => out.set(x, P.railY + P.pod * 0.5, P.lane + P.pod / 2 + 0.06)
  const portTop = new THREE.Vector3(phoneX(P.caller), P.deskH + 0.1, P.phoneZ)
  const svcTop = new THREE.Vector3(SV.x, SV.y + 0.3, SV.z + 0.04)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  /* a hop between two points on an arc */
  const arc = (from: THREE.Vector3, toP: THREE.Vector3, k: number, hgt: number) => tmp.lerpVectors(from, toP, k).setY(lerp(from.y, toP.y, k) + Math.sin(k * Math.PI) * hgt)
  return (t: number) => {
    const c = mod(clk.time(t), L)
    const f = mod(c, S)
    /* the caller pod: lit while it is in a call (the colleague's handset up) */
    const inCall = hold(f, E.cLift[1] - 0.02, E.cLift[1] + 0.02, E.hang[1] - 0.04, E.hang[1])
    caller.ledM.color.set(inCall > 0.5 ? C.answer : '#8DB0FF')
    caller.g.position.y = P.railY + 0.008 * Math.sin(c * TAU * (2 / S))
    portM.color.set(f > E.dial[0] && f < E.run[0] + 0.05 ? (Math.sin(f * 40) > 0 ? '#FFFFFF' : C.call) : '#5B8CFF')
    /* the pods behind the Service: one slides out as the next slides in, the Service never moves */
    let docked = -1
    for (let k = 0; k < N; k++) {
      const fk = phase(c, k)
      const at = place(fk)
      const pd = pods[k]
      pd.g.visible = at.shown
      pd.g.position.set(at.x, P.railY + 0.025 * Math.abs(Math.sin(fk * Math.PI * 2.2)) * at.walking + (at.walking ? 0 : 0.006 * Math.sin(c * TAU * (2 / S) + k)), P.lane)
      if (fk < S && fk >= E.arrive[1]) docked = k
      /* it takes the call: its light green, a glow, from the pick-up to the hang-up */
      const answering = fk < S ? hold(fk, E.lift[0], E.lift[1], E.hang[0], E.hang[1]) : 0
      pd.ledM.color.set(answering > 0.5 ? C.answer : '#8DB0FF')
      pd.glow.position.set(at.x, P.railY + P.pod * 0.5, P.lane + 0.05)
      pd.glow.quaternion.copy(camera.quaternion)
      setOp(pd.glow, answering * 0.55)
    }
    /* the Service rings: its beacon flashes, rings spread */
    const ringing = hold(f, E.ring[0], E.ring[0] + 0.05, E.lift[0] - 0.05, E.lift[0])
    beaconM.emissiveIntensity = 0.4 + 1.2 * ringing * (0.5 + 0.5 * Math.sin(f * 30))
    setOp(beaconGlow, 0.25 + 0.6 * ringing)
    beaconGlow.quaternion.copy(camera.quaternion)
    rings(ringAt, f, ringing)
    /* the request: out of the caller pod onto its port, along the wire into the Service, on to the docked pod */
    if (f >= E.dial[1] && f < E.run[0]) req(arc(podFront(P.caller, a), portTop, seg(f, E.dial[1], E.run[0]), 0.12), camera)
    else if (f >= E.run[0] && f < E.run[1]) req(pathAt(line, seg(f, E.run[0], E.run[1]) * line.len, tmp).setY(tmp.y + 0.05), camera)
    else if (f >= E.run[1] && f < E.lift[0]) req(b.copy(svcTop).setY(svcTop.y + 0.04 * Math.sin((f - E.run[1]) * TAU * 3)), camera)
    else if (f >= E.lift[0] && f < E.lift[1] && docked >= 0) req(arc(svcTop, podFront(P.ext, a), seg(f, E.lift[0], E.lift[1]), 0.1), camera)
    else req(null, camera)
    /* the answer: from the pod back to the Service, along the wire, up into the caller pod */
    if (f >= E.talkE[0] && f < E.back[0]) ans(arc(podFront(P.ext, a), svcTop, seg(f, E.talkE[0], E.back[0]), 0.08), camera)
    else if (f >= E.back[0] && f < E.back[1]) ans(pathAt(line, (1 - seg(f, E.back[0], E.back[1])) * line.len, tmp).setY(tmp.y + 0.05), camera)
    else if (f >= E.back[1] && f < E.talkC[1]) ans(arc(portTop, podFront(P.caller, a), seg(f, E.back[1], E.talkC[1]), 0.12), camera)
    else ans(null, camera)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
/* both cards on one clock (custom/clock.tsx): they fade in once their people are drawn; tap to pause */
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const Fg = ({ step = 0 }: Fig) => (
    <ClockCard id={id} w={W} h={H}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return Fg as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T19Everyday: card('J19', setupEveryday, devHold(HOLD)),
  J_T19Concept: card('J19', setupConcept, devHold(HOLD)),
}
export const css = ''
