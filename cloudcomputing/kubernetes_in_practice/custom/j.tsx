import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import type { Skin } from '@/decks/figures/cast/skins/types'
import podUrl from '../images/k8s-pod.svg'
import svcUrl from '../images/k8s-svc.svg'
import apiUrl from '../images/k8s-api.svg'
import etcdUrl from '../images/k8s-etcd.svg'
import nodeUrl from '../images/k8s-node.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER J · SESSION 21 (Kubernetes in Practice) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`, built
 * the way Session 18's h/i/j.tsx are: a perspective camera on a real place, Character Lab people from the engine's
 * `castSprite` at a fixed `px: 256` with no idle breathing, role clothing drawn on the rig, expressions keyed to the
 * action, NO TEXT on either card, ONE wall-clock loop per slide shared by both cards (custom/clock.tsx, tap to pause),
 * every loop ending in the state it starts in, held frames (`?still`, thumbnails) at HOLD. Nobody walks toward or away
 * from the camera: people step sideways or ride. Official marks sit only on things that never move.
 *
 * SLIDE 41 · T15-AN (TR 15): "A highway repaving crew closes one lane at a time and reroutes traffic rather than
 * shutting the whole road: just as a rolling update replaces pods lane by lane while the service stays reachable."
 *
 *   place                everyday: a three-lane highway                concept: a Service's three lanes
 *   lanes z -3.2/0/3.2   asphalt lanes, traffic left to right           lanes of pods (two pods a lane, six replicas)
 *   traffic              cars (ONE schedule, the same on both cards)    requests riding the same paths
 *   lane edge            a line of cones closes one lane                a line of orange bollards takes it out of service
 *   in the closed lane   the paver, its operator and screed hand        the Deployment's replacer, its beacon and arm
 *   behind the paver     fresh black asphalt, steaming, cooling         new pods, glowing, settling to the steady blue
 *   left roadside        the lane-closed arrow board                    the Service (its mark on a post)
 *
 *   Each lane in turn for 3 s (far, middle, near; the loop is 9 s): the cones go down, the cars due in that lane move
 *   over before the first cone, the paver crosses the lane laying new asphalt, the cones come up, the next lane closes.
 *   The road never shuts: two lanes carry traffic the whole time. New asphalt cools (new pods settle) before the crew
 *   is back, so every lane ends the loop as it began.
 *
 * SLIDE 50 · T20-AN (TR 20): "A rented flat's owner takes care of the building, lift and water supply, while you only
 * manage your own furniture and belongings, just as a managed Kubernetes service runs the control plane while your
 * team manages only its apps."
 *
 *   place                everyday: a block of flats                     concept: a managed cluster
 *   roof                 the owner's floor: lift machine room, tank     the control plane: API server, etcd
 *   roof walk            the owner, checking the lift, then the tank    the provider's engineer, the same rounds
 *   left bay             the glass lift shaft, its car                  the API channel, a message car up and down
 *   pipe                 tank -> riser beside the shaft -> flats        etcd -> API server -> down the channel
 *   upper floor          the tenant's flat, cut away: she moves her     a worker node, cut away: the team member moves
 *                        armchair to the window and back                his app crate along the node and back
 *   lower floor          a neighbour's flat behind its windows          another worker node behind its panel
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
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#22C55E',
  white: '#FFFFFF',
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

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const sphere = (r: number, m: THREE.Material, pos: THREE.Vector3Tuple) => mesh(new THREE.SphereGeometry(r, 20, 14), m, pos)
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
function halo(color: string, size: number, additive = true) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, opacity: 0 }),
  )
  m.renderOrder = 4
  return m
}
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
/** a flat decal lying on the ground (y up), its texture's top toward -z */
function decal(tex: THREE.Texture, w: number, d: number, pos: THREE.Vector3Tuple) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), basic(tex))
  m.rotation.x = -Math.PI / 2
  m.position.set(...pos)
  return m
}

/** hemisphere, a key with soft shadows, a rim */
function lights(scene: THREE.Scene, target: THREE.Vector3Tuple, span = 12) {
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 8, target[1] + 14, target[2] + 10)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -span
  key.shadow.camera.right = span
  key.shadow.camera.top = span
  key.shadow.camera.bottom = -span
  key.shadow.camera.far = 80
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 9, target[1] + 7, target[2] - 8)
  scene.add(rim)
  return { hemi, key, rim }
}

/** a polyline the water / the messages run along */
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
/** round pipe segments along a path, with a joint ball at each bend */
function pipe(scene: THREE.Scene, p: Path, m: THREE.Material, r = 0.07) {
  const g = new THREE.Group()
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.pts[i - 1]
    const b = p.pts[i]
    const len = a.distanceTo(b)
    const s = cyl(r, r, len, m, [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], 16)
    const d = b.clone().sub(a).normalize()
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)
    g.add(s)
    if (i < p.pts.length - 1) g.add(sphere(r * 1.25, m, [b.x, b.y, b.z]))
  }
  scene.add(g)
  return g
}
/** dots riding a path at a steady speed, `n` of them evenly spaced (a whole number of spacings per loop: seamless) */
function riders(scene: THREE.Scene, p: Path, n: number, r: number, m: THREE.Material) {
  const dots = Array.from({ length: n }, () => {
    const d = sphere(r, m, [0, 0, 0])
    d.castShadow = false
    scene.add(d)
    return d
  })
  return (c: number, loop: number, laps: number) => {
    const s0 = (c / loop) * laps
    dots.forEach((d, i) => pathAt(p, mod(s0 + i / n, 1) * p.len, d.position))
  }
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
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c), breath: false }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing, rig body frame 400 x 600 (head-local for the hats: skull centre 0,0) */
/** a hi-vis vest: two panels, two reflective bands */
const VEST = (
  <g data-part="vest">
    <path d="M 146 214 L 184 208 L 192 268 L 186 420 L 150 420 Z" fill="#D7EA3A" stroke="#A9BB22" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 254 214 L 216 208 L 208 268 L 214 420 L 250 420 Z" fill="#D7EA3A" stroke="#A9BB22" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 149 330 L 189 330 L 189 344 L 149 344 Z M 211 330 L 251 330 L 251 344 L 211 344 Z" fill="#E6EBF2" stroke="#B7C1CF" strokeWidth={1.5} />
    <path d="M 150 384 L 187 384 L 187 398 L 150 398 Z M 213 384 L 250 384 L 250 398 L 213 398 Z" fill="#E6EBF2" stroke="#B7C1CF" strokeWidth={1.5} />
  </g>
)
/** a hard hat: a dome with a ridge and a short brim all round */
const HARD_HAT = (fill: string, edge: string) => (
  <g data-part="hardhat">
    <path d="M -66 -44 C -70 -118 70 -118 66 -44 Z" fill={fill} stroke={edge} strokeWidth={2.5} />
    <path d="M -9 -110 C -11 -88 -11 -64 -9 -46 L 9 -46 C 11 -64 11 -88 9 -110 Z" fill={edge} fillOpacity={0.35} />
    <path d="M -82 -40 Q 0 -58 82 -40 L 80 -31 Q 0 -47 -80 -31 Z" fill={fill} stroke={edge} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M -44 -96 C -26 -106 -6 -108 12 -104" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
)
/** an ID lanyard: a cord round the neck and a card on the chest */
const LANYARD = (
  <g data-part="lanyard">
    <path d="M 178 214 L 196 300 M 222 214 L 204 300" stroke="#2D63FB" strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={298} width={32} height={40} rx={5} fill="#FFFFFF" stroke="#9DB2E8" strokeWidth={2} />
    <rect x={190} y={306} width={20} height={14} rx={3} fill="#2D63FB" />
    <rect x={190} y={325} width={20} height={4} rx={2} fill="#9DB2E8" />
  </g>
)
const crew = (hat: string, edge: string) => (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{HARD_HAT(hat, edge)}</>, top: <>{k.top}{VEST}</> })
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

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

/* ================================================================== T15 · repaving one lane at a time */

const L15 = 9
const LANE_T = 3 /* each lane is closed for its 3 s turn */
const HOLD15 = 1.5 /* the far lane closed, the paver mid-way, its left half new, a car in each of the two open lanes */
const LZ = [-3.2, 0, 3.2] /* lane centres: far, middle, near */
const LANE_W = 3.2
const ROAD_HW = 4.8
const V15 = 8 /* the traffic's speed */
const X0 = -12 /* where a car (a request) enters, off the card */
const MS: [number, number] = [-12.5, -5.0] /* a car due in the closed lane moves over across this stretch */
const DECIDE = -9 /* where a car finds its lane closed (the schedule was searched with this) */
const CONE_X = [-4.4, -2.2, 0, 2.2, 4.4, 6.6, 8.8]
const PAV = { xin: -9.8, xout: 9.8, len: 4.3, w: 2.1 }
const MAT = { x0: -13, x1: 13, n: 52, w: 2.9 }
/* the traffic: [enters at, its lane, the lane it moves to while its own is closed]; found by a search that keeps every car
   clear of the cones, the paver, each other, and the lane right behind the crew (so no car passes behind a person) on
   every frame of the loop (one schedule for both cards) */
const CARS15: [number, number, number][] = [
  [0.0, 2, 1],
  [0.8, 2, 1],
  [2.2, 1, 2],
  [3.9, 1, 0],
  [4.7, 1, 0],
  [5.4, 1, 0],
  [7.4, 2, 1],
  [8.2, 1, 0],
]
/** is lane k closed (cones down) at loop time c */
function closed15(k: number, c: number) {
  const u = mod(c - k * LANE_T, L15)
  return u <= LANE_T + 0.35 || u >= L15 - 0.45
}
/** how far lane k's cones are down at loop time c for the cone at x (they drop left to right, lift left to right) */
function coneOn(k: number, c: number, x: number) {
  const u = mod(c - k * LANE_T + 0.6, L15) - 0.6
  const d = (x + 4.4) * 0.03
  return seg(u, -0.45 + d, -0.2 + d) * (1 - seg(u, LANE_T + 0.05 + d, LANE_T + 0.3 + d))
}
/** where the paver (the replacer) is: lane and centre x, or null while it is off the card between lanes */
function paver15(c: number): { k: number; x: number; u: number } {
  const k = Math.floor(mod(c, L15) / LANE_T)
  const u = mod(c, L15) - k * LANE_T
  return { k, x: lerp(PAV.xin, PAV.xout, u / LANE_T), u }
}
/** the time (loop) at which the paver's screed passed x in lane k, as an age now (seconds since), or a large number */
function matAge(k: number, x: number, c: number) {
  const screedU = ((x + PAV.len / 2 - PAV.xin) / (PAV.xout - PAV.xin)) * LANE_T
  return mod(c - (k * LANE_T + screedU), L15)
}
/** car / request j at loop time c: position and heading, or null when off the card */
function car15(j: number, c: number): { x: number; z: number; yaw: number } | null {
  const [e, p, q] = CARS15[j]
  const dt = mod(c - e, L15)
  const x = X0 + V15 * dt
  if (x > 13) return null
  const tms = e + (DECIDE - X0) / V15
  if (!closed15(p, tms)) return { x, z: LZ[p], yaw: 0 }
  const k = (x - MS[0]) / (MS[1] - MS[0])
  const z = lerp(LZ[p], LZ[q], sm(k))
  /* the heading follows the lane change (the slope of the smoothstep) */
  const dz = (LZ[q] - LZ[p]) * (k > 0 && k < 1 ? 6 * k * (1 - k) : 0) / (MS[1] - MS[0])
  return { x, z, yaw: -Math.atan(dz) * 0.85 }
}

/** the shared camera of T15 (both cards): high over the near roadside, the three lanes across the card */
function cam15(camera: THREE.PerspectiveCamera) {
  camera.fov = 29
  camera.position.set(0, 13.0, 16.0)
  camera.lookAt(0, 0.4, -0.9)
  camera.updateProjectionMatrix()
}

/** a car (origin at its ground centre, nose toward +x): body, cabin, glass, wheels, lamps */
function makeCar(body: string) {
  const g = new THREE.Group()
  const bodyM = mat(body, { roughness: 0.3, metalness: 0.15 })
  const glass = mat('#2B3A5C', { roughness: 0.12, metalness: 0.45 })
  g.add(box(4.0, 0.72, 1.76, bodyM, [0, 0.66, 0], 0.26))
  g.add(box(2.1, 0.62, 1.58, bodyM, [-0.25, 1.24, 0], 0.24))
  g.add(box(1.92, 0.5, 1.6, glass, [-0.25, 1.26, 0], 0.18))
  const wheelM = mat('#23262E', { roughness: 0.7 })
  const hubM = mat('#C9D1DE', { roughness: 0.35, metalness: 0.5 })
  const wheels: THREE.Object3D[] = []
  for (const wx of [-1.28, 1.28])
    for (const wz of [-0.8, 0.8]) {
      const w = new THREE.Group()
      const tyre = cyl(0.36, 0.36, 0.28, wheelM, [0, 0, 0], 20)
      tyre.rotation.x = Math.PI / 2
      const hub = cyl(0.17, 0.17, 0.3, hubM, [0, 0, 0], 12)
      hub.rotation.x = Math.PI / 2
      const spoke = box(0.07, 0.42, 0.31, hubM, [0, 0, 0])
      w.add(tyre, hub, spoke)
      w.position.set(wx, 0.36, wz)
      g.add(w)
      wheels.push(w)
    }
  const headM = new THREE.MeshStandardMaterial({ color: '#FFF6DA', emissive: new THREE.Color('#FFF1C2'), emissiveIntensity: 0.6 })
  const tailM = new THREE.MeshStandardMaterial({ color: '#E5484D', emissive: new THREE.Color('#E5484D'), emissiveIntensity: 0.4 })
  for (const z of [-0.6, 0.6]) {
    g.add(flat(box(0.06, 0.16, 0.32, headM, [2.0, 0.78, z])))
    g.add(flat(box(0.06, 0.14, 0.3, tailM, [-2.0, 0.8, z])))
  }
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return { g, wheels }
}

/** a request (concept): a blue rounded block with an envelope on its camera-facing side, origin at its ground centre */
function makeRequest() {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: '#F7F9FC', emissive: new THREE.Color('#DCE8FF'), emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.1 })
  g.add(box(2.2, 1.15, 1.3, m, [0, 0.78, 0], 0.22))
  g.add(box(2.24, 0.12, 1.34, mat('#2D63FB', { roughness: 0.35 }), [0, 0.3, 0], 0.05))
  const env = canvasTex(96, 64, (x) => {
    x.fillStyle = '#FFFFFF'
    x.beginPath()
    x.roundRect(8, 8, 80, 48, 7)
    x.fill()
    x.strokeStyle = '#2D63FB'
    x.lineWidth = 5
    x.lineJoin = 'round'
    x.beginPath()
    x.moveTo(12, 13)
    x.lineTo(48, 38)
    x.lineTo(84, 13)
    x.stroke()
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), basic(env))
  face.position.set(0, 0.8, 0.66)
  g.add(face)
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), basic(env))
  top.rotation.x = -Math.PI / 2
  top.position.set(0, 1.36, 0)
  g.add(top)
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return g
}

/** a traffic cone (everyday) or a service bollard (concept), origin at its base */
function makeCone(kind: 'cone' | 'bollard') {
  const g = new THREE.Group()
  const or = mat(C.orange, { roughness: 0.45 })
  const wh = mat('#FFFFFF', { roughness: 0.4 })
  if (kind === 'cone') {
    g.add(box(0.5, 0.06, 0.5, mat('#2B2F38', { roughness: 0.7 }), [0, 0.03, 0], 0.02))
    g.add(cyl(0.04, 0.2, 0.74, or, [0, 0.43, 0], 20))
    g.add(cyl(0.106, 0.142, 0.15, wh, [0, 0.46, 0], 20))
  } else {
    g.add(cyl(0.22, 0.24, 0.08, mat('#2B2F38', { roughness: 0.6 }), [0, 0.04, 0], 20))
    g.add(cyl(0.12, 0.12, 0.8, or, [0, 0.48, 0], 20))
    g.add(cyl(0.125, 0.125, 0.16, wh, [0, 0.6, 0], 20))
    g.add(sphere(0.13, or, [0, 0.88, 0]))
  }
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return g
}

/** the cone (bollard) lines: one per closure, on the side(s) of the closed lane that face open lanes */
function coneSets(scene: THREE.Scene, kind: 'cone' | 'bollard') {
  const sets: { k: number; x: number; g: THREE.Group }[] = []
  for (let k = 0; k < 3; k++) {
    const sides = k === 0 ? [1] : k === 2 ? [-1] : [-1, 1]
    for (const s of sides)
      for (const x of CONE_X) {
        const g = makeCone(kind)
        g.position.set(x, 0, LZ[k] + s * (LANE_W / 2 - 0.2))
        scene.add(g)
        sets.push({ k, x, g })
      }
  }
  return (c: number) => {
    for (const s of sets) {
      const on = coneOn(s.k, c, s.x)
      s.g.visible = on > 0.001
      /* dropped in from a little above, set down, picked up the same way */
      s.g.position.y = 0.9 * (1 - on) * (1 - on)
      s.g.scale.setScalar(0.4 + 0.6 * on)
    }
  }
}

/** lane markings: dashed lines between lanes, solid edge lines */
function markings(scene: THREE.Scene, color: string) {
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false })
  for (const z of [-LANE_W / 2, LANE_W / 2])
    for (let x = -14; x < 14; x += 3.4) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.14), m)
      d.rotation.x = -Math.PI / 2
      d.position.set(x, 0.02, z)
      scene.add(d)
    }
  for (const z of [-ROAD_HW + 0.2, ROAD_HW - 0.2]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.16), m)
    l.rotation.x = -Math.PI / 2
    l.position.set(0, 0.02, z)
    scene.add(l)
  }
}

/** the traffic (cars or requests) on the shared schedule */
function traffic(scene: THREE.Scene, make: (j: number) => { g: THREE.Group; wheels?: THREE.Object3D[] }) {
  const cars = CARS15.map((_, j) => {
    const o = make(j)
    scene.add(o.g)
    return o
  })
  return (c: number) => {
    cars.forEach((o, j) => {
      const s = car15(j, c)
      o.g.visible = !!s
      if (!s) return
      o.g.position.set(s.x, 0, s.z)
      o.g.rotation.y = s.yaw
      o.wheels?.forEach((w) => (w.rotation.z = -(s.x / 0.36)))
    })
  }
}

/* ---- the paver crew (Character Lab): the operator at the console, the screed hand on the rear walkway ---- */

const OPER = { dx: -0.45, dy: 1.45, dz: 0.55, h: 1.72 }
const SCREED = { dx: -1.92, dy: 0.5, dz: 0.75, h: 1.68 }
const F_CREW = 36
function operPose(p: Pose, c: number) {
  /* both hands on the console ahead (screen right); a glance down the lane at the start, at the screed later */
  p.shoulderR = 46
  p.elbowR = 58
  p.shoulderL = 14
  p.elbowL = 30
  p.headTurn = 0.45
  p.lookX = 0.85
  const back = hold(c, 1.6, 1.9, 2.3, 2.6)
  to(p, 'headTurn', -0.3, back)
  to(p, 'lookX', -0.8, back)
  to(p, 'lookY', 0.4, back)
  p.elbowR += 6 * Math.sin(c * TAU * 2 / LANE_T)
}
const OPER_FACES: [number, string][] = [
  [0, 'thinking'],
  [1.6, 'listening'],
  [2.5, 'happy'],
]
function screedPose(p: Pose, c: number) {
  /* one hand on the screed's rail, eyes on the new mat behind */
  p.shoulderL = 24
  p.elbowL = 40
  p.shoulderR = 12
  p.elbowR = 18
  p.headTurn = -0.4
  p.lookX = -0.8
  p.headNod = 0.25
  p.lookY = 0.6
  const up = hold(c, 1.1, 1.4, 1.9, 2.2)
  to(p, 'headTurn', 0.25, up)
  to(p, 'lookX', 0.7, up)
  to(p, 'headNod', 0, up)
  to(p, 'lookY', 0, up)
}
const SCREED_FACES: [number, string][] = [
  [0, 'thinking'],
  [1.1, 'happy'],
  [2.2, 'proud'],
]

/** the paver (origin at its ground centre, travelling +x): tracks, tractor, hopper of asphalt, deck, console, screed */
function makePaver() {
  const g = new THREE.Group()
  const yel = mat('#F6C531', { roughness: 0.4 })
  const yelD = mat('#E2AE2E', { roughness: 0.45 })
  const dark = mat('#2B2F38', { roughness: 0.6 })
  const steel = mat('#7C8698', { roughness: 0.35, metalness: 0.5 })
  /* crawler tracks */
  for (const z of [-0.82, 0.82]) {
    g.add(box(2.7, 0.55, 0.42, dark, [0.15, 0.28, z], 0.12))
    for (const x of [-0.9, -0.3, 0.3, 0.9]) g.add(cyl(0.16, 0.16, 0.44, steel, [x + 0.15, 0.28, z], 14).rotateX(Math.PI / 2))
  }
  /* tractor body */
  g.add(box(2.5, 0.92, 1.95, yel, [0.1, 0.98, 0], 0.12))
  /* deck plate the operator stands on */
  g.add(box(1.6, 0.06, 1.95, mat('#5E6B86', { roughness: 0.5, metalness: 0.3 }), [-0.45, 1.46, 0]))
  /* engine hood with the exhaust stack and the beacon, back from the camera */
  g.add(box(1.0, 0.55, 1.0, yelD, [0.55, 1.72, -0.45], 0.1))
  g.add(cyl(0.07, 0.07, 0.6, dark, [0.2, 2.2, -0.8], 12))
  const beaconM = glowM('#FFB020', '#FFD27A')
  g.add(cyl(0.12, 0.14, 0.18, beaconM, [0.92, 2.1, -0.7], 18))
  /* the console the operator drives from (screen right of him) */
  g.add(box(0.36, 0.75, 0.6, dark, [0.28, 1.86, 0.5], 0.06))
  g.add(box(0.06, 0.32, 0.46, glowM('#7FB2FF', '#BFD2FF'), [0.47, 2.05, 0.5]))
  /* the hopper at the front, heaped with hot asphalt */
  const hop = new THREE.Group()
  hop.add(box(1.05, 0.14, 2.2, yelD, [0, 0.55, 0]))
  for (const z of [-1.08, 1.08]) {
    const wing = box(1.05, 0.62, 0.08, yel, [0, 0.9, z])
    wing.rotation.x = z > 0 ? 0.35 : -0.35
    hop.add(wing)
  }
  hop.add(box(0.08, 0.62, 2.1, yel, [0.5, 0.9, 0]))
  hop.add(box(0.95, 0.42, 1.95, mat('#22252C', { roughness: 0.95 }), [-0.02, 0.86, 0], 0.18))
  hop.position.x = 1.62
  g.add(hop)
  /* the screed at the rear: a wide bar the full lane, its walkway, the handrail */
  g.add(box(0.85, 0.42, 2.95, dark, [-1.75, 0.26, 0], 0.06))
  g.add(box(0.85, 0.05, 2.95, steel, [-1.75, 0.5, 0]))
  g.add(box(0.04, 0.5, 2.6, yel, [-2.17, 0.78, 0]))
  for (const z of [-1.3, 1.3]) g.add(box(0.04, 0.5, 0.04, yel, [-2.17, 0.77, z]))
  /* the screed's control box at the walkway's near end */
  g.add(box(0.3, 0.34, 0.26, yel, [-1.55, 0.72, 1.32], 0.04))
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return { g, beaconM }
}

/** the fresh-mat strips of each lane: colour by how long ago the screed passed */
function matStrips(scene: THREE.Scene, base: string, fresh: string, gloss = true) {
  const dx = (MAT.x1 - MAT.x0) / MAT.n
  const baseC = new THREE.Color(base)
  const freshC = new THREE.Color(fresh)
  const strips: { k: number; x: number; m: THREE.MeshStandardMaterial }[] = []
  for (let k = 0; k < 3; k++)
    for (let i = 0; i < MAT.n; i++) {
      const x = MAT.x0 + (i + 0.5) * dx
      const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.85 })
      const s = new THREE.Mesh(new THREE.PlaneGeometry(dx + 0.01, MAT.w), m)
      s.rotation.x = -Math.PI / 2
      s.position.set(x, 0.008, LZ[k])
      s.receiveShadow = true
      scene.add(s)
      strips.push({ k, x, m })
    }
  return (c: number) => {
    const pv = paver15(c)
    for (const s of strips) {
      /* not laid yet in the lane being paved: ahead of the screed */
      const ahead = s.k === pv.k && s.x > pv.x - PAV.len / 2
      const age = ahead ? 99 : matAge(s.k, s.x, c)
      const f = ahead ? 0 : 1 - seg(age, 0.6, 5.2)
      s.m.color.copy(baseC).lerp(freshC, f)
      if (gloss) s.m.roughness = lerp(0.85, 0.3, f)
    }
  }
}

function setupT15Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF2FB')
  cam15(camera)
  lights(scene, [0, 0, -0.5], 14)
  /* the verges: grass beyond both edges, the shoulders */
  const grass = mat('#9FD08E', { roughness: 0.9 })
  scene.add(flat(box(40, 0.1, 14, grass, [0, -0.06, -ROAD_HW - 7])))
  scene.add(flat(box(40, 0.1, 10, grass, [0, -0.06, ROAD_HW + 5])))
  const road = mat('#6E7482', { roughness: 0.9 })
  scene.add(flat(box(40, 0.02, ROAD_HW * 2 + 1.2, road, [0, -0.01, 0])))
  /* the guard rail on the far side, trees beyond */
  const railM = mat('#C9D1DE', { roughness: 0.3, metalness: 0.6 })
  scene.add(box(40, 0.28, 0.08, railM, [0, 0.62, -ROAD_HW - 0.9]))
  for (let x = -16; x <= 16; x += 2) scene.add(box(0.1, 0.62, 0.1, railM, [x, 0.31, -ROAD_HW - 0.85]))
  const leaf = mat('#5DAE6B', { roughness: 0.75 })
  const trunk = mat('#8C6440', { roughness: 0.8 })
  for (const [x, z, s] of [[-8.5, -8.0, 1.1], [-4.2, -9.2, 0.9], [0.6, -8.4, 1.15], [5.4, -9.0, 1.0], [9.6, -8.2, 1.1]] as const) {
    const g = new THREE.Group()
    g.add(cyl(0.16, 0.22, 1.4, trunk, [0, 0.7, 0], 10))
    g.add(sphere(1.0, leaf, [0, 2.0, 0]), sphere(0.75, leaf, [0.55, 1.7, 0.2]), sphere(0.7, leaf, [-0.5, 1.75, -0.1]))
    g.position.set(x, 0, z)
    g.scale.setScalar(s)
    g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
    scene.add(g)
  }
  const updMat = matStrips(scene, '#6E7482', '#16191F')
  markings(scene, '#FFFFFF')
  const updCones = coneSets(scene, 'cone')

  /* the lane-closed arrow board on the near roadside: its lamps chase toward the open lanes (no words) */
  const board = new THREE.Group()
  board.add(box(0.12, 2.2, 0.12, mat('#5E6B86', { metalness: 0.5, roughness: 0.4 }), [0, 1.1, 0]))
  board.add(box(1.7, 1.05, 0.12, mat('#1F2430', { roughness: 0.5 }), [0, 2.55, 0], 0.06))
  const lampMs: THREE.MeshBasicMaterial[] = []
  for (let i = 0; i < 5; i++) {
    const m = new THREE.MeshBasicMaterial({ color: '#FFB020', toneMapped: false, transparent: true, opacity: 0.3 })
    lampMs.push(m)
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.11, 18), m)
    d.position.set(-0.6 + i * 0.3, 2.55, 0.065)
    board.add(d)
  }
  board.position.set(-4.6, 0, -ROAD_HW - 0.45)
  board.rotation.y = 0.25
  board.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(board)

  /* the paver and its crew */
  const { g: paver, beaconM } = makePaver()
  scene.add(paver)
  const beaconGlow = halo('rgba(255,176,32,0.95)', 0.9)
  scene.add(beaconGlow)
  const steam = Array.from({ length: 6 }, () => {
    const h = halo('rgba(255,255,255,0.85)', 0.9, false)
    scene.add(h)
    return h
  })
  const hold15 = devHold(HOLD15)
  const operCfg = who(CAST_PRESETS.rohan, { name: 'Operator', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'polo', topColor: '#3E4A66', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { beard: 'stubble', watch: true } })
  const screedCfg = who(CAST_PRESETS.dev, { name: 'Screed hand', skinTone: 'deep', hair: { style: 'buzz', color: 'black' }, outfit: { top: 'tshirt', topColor: '#5E6B86', bottom: 'trousers', bottomColor: '#4A3F35', shoeColor: '#3A2A20' }, accessories: { beard: 'short' }, build: { height: 0.98, shoulders: 1.05 } })
  const oper = person({ config: operCfg, dress: crew('#F2F4F8', '#B9C2D0'), seed: 2101, faces: OPER_FACES, pose: operPose, loop: LANE_T, height: OPER.h, frames: F_CREW, redraw, holdT: mod(hold15, LANE_T) })
  const scr = person({ config: screedCfg, dress: crew('#F6C531', '#C99A1E'), seed: 2102, faces: SCREED_FACES, pose: screedPose, loop: LANE_T, height: SCREED.h, frames: F_CREW, redraw, holdT: mod(hold15, LANE_T) })
  scene.add(oper.object, scr.object)

  const updTraffic = traffic(scene, (j) => makeCar(['#E5484D', '#F7F9FC', '#3B6BFF', '#22A06B', '#5E6B86', '#F2C14E', '#7C5CE0', '#14B8A6', '#E8EDF6', '#2C3C81'][j % 10]))
  const clk = slideClock('J15', scene, hold15, [oper, scr])
  return (t: number) => {
    const c = mod(clk.time(t), L15)
    updMat(c)
    updCones(c)
    updTraffic(c)
    const pv = paver15(c)
    paver.position.set(pv.x, 0, LZ[pv.k])
    /* the screed's working shake */
    paver.position.y = 0.012 * Math.sin(c * TAU * 6)
    const u = mod(c, LANE_T)
    oper.object.position.set(pv.x + OPER.dx, OPER.dy, LZ[pv.k] + OPER.dz)
    scr.object.position.set(pv.x + SCREED.dx, SCREED.dy, LZ[pv.k] + SCREED.dz)
    oper.update(u, camera)
    scr.update(u, camera)
    /* the beacon turns: a pulse twice a second */
    const b = 0.5 + 0.5 * Math.sin(c * TAU * 2)
    beaconM.emissiveIntensity = 0.6 + 1.6 * b
    beaconGlow.position.set(pv.x + 0.92, 2.15, LZ[pv.k] - 0.45)
    ;(beaconGlow.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.45 * b
    /* steam off the new mat just behind the screed */
    steam.forEach((h, i) => {
      const a = mod(c * (14 / L15) + i / steam.length, 1)
      h.position.set(pv.x - PAV.len / 2 - 0.4 - a * 1.6, 0.25 + a * 1.4, LZ[pv.k] + (i % 3 - 1) * 0.7)
      h.scale.setScalar(0.6 + a * 0.9)
      ;(h.material as THREE.MeshBasicMaterial).opacity = 0.55 * Math.sin(Math.PI * a)
    })
    /* the arrow board: a chase of its lamps every 0.6 s */
    const chase = mod(c / 0.6, 1)
    lampMs.forEach((m, i) => (m.opacity = 0.25 + 0.75 * hold(chase * 6, i, i + 0.3, i + 1, i + 1.6)))
  }
}

/* ------------------------------------------------------------------ T15 concept: a rolling update */

/** the Deployment's replacer (origin at its ground centre, travelling +x), the paver's footprint and parts */
function makeReplacer() {
  const g = new THREE.Group()
  const navy = mat('#1F2E63', { roughness: 0.35, metalness: 0.2 })
  const blue = mat('#3B6BFF', { roughness: 0.3, metalness: 0.15 })
  const steel = mat('#9AA6BA', { roughness: 0.35, metalness: 0.5 })
  for (const z of [-0.82, 0.82]) g.add(box(2.7, 0.5, 0.42, navy, [0.15, 0.27, z], 0.14))
  g.add(box(2.5, 0.92, 1.95, blue, [0.1, 0.98, 0], 0.18))
  g.add(box(1.6, 0.06, 1.95, navy, [-0.45, 1.46, 0]))
  /* the beacon mast at the operator's place: a ring that turns (the controller watching) */
  g.add(cyl(0.06, 0.06, 0.8, steel, [-0.45, 1.86, 0.55], 12))
  const ringM = glowM('#7FB2FF', '#DCE8FF')
  const ring = mesh(new THREE.TorusGeometry(0.3, 0.06, 12, 36), ringM, [-0.45, 2.36, 0.55])
  g.add(ring)
  g.add(sphere(0.14, glowM('#7FB2FF', '#FFFFFF'), [-0.45, 2.36, 0.55]))
  /* the hopper at the front, stacked with new pods */
  const hop = new THREE.Group()
  hop.add(box(1.05, 0.14, 2.2, navy, [0, 0.55, 0]))
  for (const z of [-1.08, 1.08]) hop.add(box(1.05, 0.5, 0.08, blue, [0, 0.85, z]))
  hop.add(box(0.08, 0.5, 2.1, blue, [0.5, 0.85, 0]))
  const newM = glowM('#5B8CFF', '#C9DAFF')
  newM.emissiveIntensity = 0.6
  for (let i = 0; i < 3; i++) hop.add(box(0.8, 0.12, 1.8, newM, [0, 0.7 + i * 0.15, 0], 0.04))
  hop.position.x = 1.62
  g.add(hop)
  /* the rear bar the new pods come out of, its light strip */
  g.add(box(0.85, 0.42, 2.95, navy, [-1.75, 0.26, 0], 0.06))
  const barM = glowM('#7FB2FF', '#BFD2FF')
  g.add(box(0.06, 0.12, 2.8, barM, [-2.19, 0.3, 0]))
  /* the arm at the screed hand's place: a post and a pressing head */
  g.add(cyl(0.08, 0.1, 0.9, steel, [-1.75, 0.95, 0.85], 12))
  const head = new THREE.Group()
  head.add(box(0.6, 0.1, 0.12, steel, [-0.3, 0, 0]))
  head.add(box(0.14, 0.24, 0.14, navy, [-0.6, -0.12, 0], 0.03))
  head.position.set(-1.75, 1.36, 0.85)
  g.add(head)
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return { g, ring, ringM, head, barM }
}

function setupT15Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  cam15(camera)
  lights(scene, [0, 0, -0.5], 14)
  /* the cluster's floor beyond the lanes, the lanes' plate */
  scene.add(flat(box(40, 0.1, 14, mat('#E3EAF8', { roughness: 0.9 }), [0, -0.06, -ROAD_HW - 7])))
  scene.add(flat(box(40, 0.1, 10, mat('#E3EAF8', { roughness: 0.9 }), [0, -0.06, ROAD_HW + 5])))
  scene.add(flat(box(40, 0.02, ROAD_HW * 2 + 1.2, mat('#C9D5EC', { roughness: 0.85 }), [0, -0.01, 0])))
  /* far side: the cluster's edge rail (the guard rail's place), its nodes beyond (the trees' places) */
  const railM = mat('#9DB8FF', { roughness: 0.3, metalness: 0.4 })
  scene.add(box(40, 0.28, 0.08, railM, [0, 0.62, -ROAD_HW - 0.9]))
  for (let x = -16; x <= 16; x += 2) scene.add(box(0.1, 0.62, 0.1, railM, [x, 0.31, -ROAD_HW - 0.85]))
  const rackM = mat('#2C3E7E', { roughness: 0.4, metalness: 0.3 })
  const ledTex = canvasTex(64, 96, (g) => {
    g.fillStyle = '#25356E'
    g.fillRect(0, 0, 64, 96)
    for (let r = 0; r < 7; r++) {
      g.fillStyle = '#31457F'
      g.fillRect(5, 6 + r * 12.5, 54, 8)
      g.fillStyle = r % 3 === 0 ? '#7FE0A0' : '#8DB0FF'
      g.fillRect(48, 8 + r * 12.5, 6, 4)
    }
  })
  for (const [x, z] of [[-8.5, -8.0], [-4.2, -9.2], [0.6, -8.4], [5.4, -9.0], [9.6, -8.2]] as const) {
    scene.add(box(1.3, 2.4, 1.0, rackM, [x, 1.2, z], 0.06))
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.2), basic(ledTex, { transparent: false }))
    f.position.set(x, 1.2, z + 0.505)
    scene.add(f)
  }
  /* the pods: two to a lane (six replicas), their mark on top; the strips under them carry the replacement */
  const updMat = matStrips(scene, '#3B6BFF', '#9EC0FF', false)
  const podTex = markTex(podUrl, redraw)
  for (let k = 0; k < 3; k++)
    for (const x of [-3.0, 3.0]) {
      /* a pod: a slab outline on the strips (its edges), its mark on top */
      const edge = mat('#1F48C8', { roughness: 0.4 })
      for (const z of [-1, 1]) scene.add(flat(box(5.2, 0.06, 0.08, edge, [x, 0.04, LZ[k] + z * 1.42])))
      for (const dx of [-1, 1]) scene.add(flat(box(0.08, 0.06, 2.92, edge, [x + dx * 2.6, 0.04, LZ[k]])))
      scene.add(decal(podTex, 1.0, 1.0, [x, 0.03, LZ[k] - 0.55]))
    }
  markings(scene, '#E9F0FF')
  const updCones = coneSets(scene, 'bollard')

  /* the Service, on a post at the arrow board's place, its mark facing the same way; its lamps chase alike */
  const post = new THREE.Group()
  post.add(box(0.12, 2.2, 0.12, mat('#5E6B86', { metalness: 0.5, roughness: 0.4 }), [0, 1.1, 0]))
  post.add(box(1.7, 1.05, 0.12, mat('#1F2E63', { roughness: 0.5 }), [0, 2.55, 0], 0.06))
  const svc = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), basic(markTex(svcUrl, redraw), { transparent: false }))
  svc.position.set(-0.36, 2.55, 0.065)
  post.add(svc)
  const lampMs: THREE.MeshBasicMaterial[] = []
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({ color: '#7FB2FF', toneMapped: false, transparent: true, opacity: 0.3 })
    lampMs.push(m)
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.09, 18), m)
    d.position.set(0.3 + (i % 3) * 0.0, 2.85 - i * 0.3, 0.065)
    post.add(d)
  }
  post.position.set(-4.6, 0, -ROAD_HW - 0.45)
  post.rotation.y = 0.25
  post.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(post)

  const rep = makeReplacer()
  scene.add(rep.g)
  const sparks = Array.from({ length: 6 }, () => {
    const h = halo('rgba(120,170,255,0.9)', 0.8)
    scene.add(h)
    return h
  })
  const updTraffic = traffic(scene, () => ({ g: makeRequest() }))
  const clk = slideClock('J15', scene, devHold(HOLD15), [])
  return (t: number) => {
    const c = mod(clk.time(t), L15)
    updMat(c)
    updCones(c)
    updTraffic(c)
    const pv = paver15(c)
    rep.g.position.set(pv.x, 0.012 * Math.sin(c * TAU * 6), LZ[pv.k])
    rep.ring.rotation.y = c * TAU * 0.5
    rep.ringM.emissiveIntensity = 0.8 + 0.6 * Math.sin(c * TAU * 2)
    rep.head.position.y = 1.36 - 0.12 * Math.max(0, Math.sin(c * TAU * 2))
    rep.barM.emissiveIntensity = 1.2 + 0.5 * Math.sin(c * TAU * 4)
    sparks.forEach((h, i) => {
      const a = mod(c * (14 / L15) + i / sparks.length, 1)
      h.position.set(pv.x - PAV.len / 2 - 0.4 - a * 1.6, 0.25 + a * 1.2, LZ[pv.k] + (i % 3 - 1) * 0.7)
      h.scale.setScalar(0.5 + a * 0.6)
      ;(h.material as THREE.MeshBasicMaterial).opacity = 0.6 * Math.sin(Math.PI * a)
    })
    /* the Service's lamps: the lane each one stands for is lit while it is in service */
    lampMs.forEach((m, i) => (m.opacity = closed15(i, c) ? 0.2 : 0.95))
  }
}

/* ================================================================== T20 · the rented flat */

const L20 = 8
const HOLD20 = 1.7 /* the owner at the lift's machine room, the tenant pushing her armchair, the lift on its way up */
const F20 = 96
const B = { x0: -3.0, x1: 3.0, z0: -3.2, z1: 0, floor: 2.8, roof: 5.6, slab: 0.22 }
const SHAFT = { x0: -3.0, x1: -1.95 }
const LIFT = { w: 0.95, h: 2.25, d: 1.3 }
/** the lift car's floor height at loop time c: down, up to the flat's floor, and down again */
const liftY = (c: number) => B.floor * hold(c, 0.6, 2.8, 4.6, 6.8)
/* the owner's rounds: the lift's machine room, then the tank's valve */
const OWN = { lift: -1.05, tank: 0.8, z: -1.25, h: 1.7 }
const E20 = { walk1: [2.5, 3.7] as const, walk2: [6.5, 7.7] as const, panel: [0.4, 2.2] as const, valve: [4.0, 6.2] as const }
function ownerX(c: number) {
  return lerp(OWN.lift, OWN.tank, seg(c, E20.walk1[0], E20.walk1[1])) + (OWN.lift - OWN.tank) * seg(c, E20.walk2[0], E20.walk2[1])
}
const ownerWalk = (c: number) => Math.max(hold(c, E20.walk1[0], E20.walk1[0] + 0.15, E20.walk1[1] - 0.15, E20.walk1[1]), hold(c, E20.walk2[0], E20.walk2[0] + 0.15, E20.walk2[1] - 0.15, E20.walk2[1]))
function ownerPose(p: Pose, c: number) {
  const w = ownerWalk(c)
  const dir = c < 5 ? 1 : -1
  p.shoulderL = 9 + swing(c, w)
  p.elbowL = 10
  p.shoulderR = 9 - swing(c, w)
  p.elbowR = 10
  /* at the machine room (screen left): his left hand on the panel */
  const panel = hold(c, E20.panel[0] - 0.2, E20.panel[0] + 0.2, E20.panel[1], E20.panel[1] + 0.3)
  to(p, 'shoulderL', 62, panel)
  to(p, 'elbowL', 38 + 10 * Math.max(0, Math.sin(c * TAU * 1.6)), panel)
  const atLift = c < 5 ? 1 - seg(c, E20.walk1[0], E20.walk1[0] + 0.1) : seg(c, E20.walk2[1] - 0.1, E20.walk2[1])
  to(p, 'headTurn', -0.45, atLift)
  to(p, 'lookX', -0.85, atLift)
  /* at the tank (screen right): his right hand turning the valve wheel */
  const valve = hold(c, E20.valve[0] - 0.25, E20.valve[0] + 0.1, E20.valve[1], E20.valve[1] + 0.3)
  to(p, 'shoulderR', 58 + 8 * Math.sin((c - E20.valve[0]) * TAU * 0.9), valve)
  to(p, 'elbowR', 44 + 10 * Math.cos((c - E20.valve[0]) * TAU * 0.9), valve)
  to(p, 'headTurn', 0.42, valve)
  to(p, 'lookX', 0.8, valve)
  to(p, 'lookY', 0.2, valve)
  walkLegs(p, c, w, dir)
}
const OWNER_FACES: [number, string][] = [
  [0, 'thinking'],
  [1.7, 'happy'],
  [3.8, 'thinking'],
  [5.6, 'proud'],
  [7.4, 'neutral'],
]
/* the tenant: her armchair to the window and back */
const TEN = { z: -1.55, h: 1.62, chairA: -0.2, chairB: 0.85, off: 0.86, chairZ: -1.75 }
const E20T = { push: [0.7, 2.7] as const, pull: [4.6, 6.6] as const }
const chairX = (c: number) => lerp(TEN.chairA, TEN.chairB, seg(c, E20T.push[0], E20T.push[1])) + (TEN.chairA - TEN.chairB) * seg(c, E20T.pull[0], E20T.pull[1])
const tenWalk = (c: number) => Math.max(hold(c, E20T.push[0], E20T.push[0] + 0.15, E20T.push[1] - 0.15, E20T.push[1]), hold(c, E20T.pull[0], E20T.pull[0] + 0.15, E20T.pull[1] - 0.15, E20T.pull[1]))
function tenantPose(p: Pose, c: number) {
  const w = tenWalk(c)
  const dir = c < 4 ? 1 : -1
  p.shoulderL = 9 + swing(c, w) * 0.5
  p.elbowL = 12
  p.shoulderR = 10
  p.elbowR = 10
  /* both moves: her right hand (screen right) on the chair's arm, a lean into it */
  const onChair = Math.max(hold(c, E20T.push[0] - 0.3, E20T.push[0], E20T.push[1], E20T.push[1] + 0.3), hold(c, E20T.pull[0] - 0.3, E20T.pull[0], E20T.pull[1], E20T.pull[1] + 0.3))
  to(p, 'shoulderR', 48, onChair)
  to(p, 'elbowR', 36, onChair)
  to(p, 'shoulderL', 30, onChair * (c < 4 ? 1 : 0.4))
  to(p, 'elbowL', 60, onChair * (c < 4 ? 1 : 0.4))
  to(p, 'lean', 4 * dir, onChair)
  /* between the moves: she looks at it by the window, head on one side */
  const look = hold(c, E20T.push[1], E20T.push[1] + 0.3, E20T.pull[0] - 0.3, E20T.pull[0])
  to(p, 'headTurn', 0.35, look)
  to(p, 'lookX', 0.8, look)
  to(p, 'headTilt', 6, look)
  const back = hold(c, E20T.pull[1], E20T.pull[1] + 0.3, 7.7, 8)
  to(p, 'headTurn', 0.3, back)
  to(p, 'lookX', 0.7, back)
  walkLegs(p, c, w, dir)
}
const TENANT_FACES: [number, string][] = [
  [0, 'neutral'],
  [0.6, 'thinking'],
  [2.8, 'skeptical'],
  [4.5, 'thinking'],
  [6.6, 'happy'],
]

/** the shared camera of T20 (both cards): in front of the building, a little above the flat's floor */
function cam20(camera: THREE.PerspectiveCamera) {
  camera.fov = 34
  camera.position.set(0.25, 6.4, 13.2)
  camera.lookAt(0.05, 4.05, -1.4)
  camera.updateProjectionMatrix()
}

type Bldg = {
  wallM: THREE.MeshStandardMaterial
  trimM: THREE.MeshStandardMaterial
  floorM: THREE.MeshStandardMaterial
  backM: THREE.MeshStandardMaterial
}
/** the building's shell (both cards): slabs, the side and back walls of the cut-away floor, the lower floor's front,
 *  the glass shaft, the roof's parapet */
function shell(scene: THREE.Scene, m: Bldg) {
  const cx = (B.x0 + B.x1) / 2
  const dz = B.z1 - B.z0
  const cz = (B.z0 + B.z1) / 2
  /* the floor slab of the flat and the roof slab */
  scene.add(box(B.x1 - B.x0 + 0.2, B.slab, dz + 0.1, m.trimM, [cx, B.floor - B.slab / 2, cz]))
  scene.add(box(B.x1 - B.x0 + 0.2, B.slab, dz + 0.1, m.trimM, [cx, B.roof + B.slab / 2, cz]))
  /* the flat's floor finish */
  scene.add(flat(box(B.x1 - SHAFT.x1 - 0.1, 0.02, dz - 0.1, m.floorM, [(SHAFT.x1 + B.x1) / 2 + 0.05, B.floor + 0.01, cz])))
  /* back wall of the flat, side wall (right), the wall between flat and shaft */
  scene.add(box(B.x1 - SHAFT.x1, B.roof - B.floor, 0.14, m.backM, [(SHAFT.x1 + B.x1) / 2, (B.floor + B.roof) / 2, B.z0 + 0.07]))
  scene.add(box(0.16, B.roof - B.floor, dz, m.wallM, [B.x1 - 0.08, (B.floor + B.roof) / 2, cz]))
  scene.add(box(0.12, B.roof - B.floor, dz, m.wallM, [SHAFT.x1 + 0.06, (B.floor + B.roof) / 2, cz]))
  /* the lower floor: a front wall (its windows are each card's own) */
  scene.add(box(B.x1 - SHAFT.x1, B.floor - B.slab, 0.14, m.wallM, [(SHAFT.x1 + B.x1) / 2, (B.floor - B.slab) / 2, B.z1 - 0.07]))
  /* the roof's parapet along the front and the sides */
  scene.add(box(B.x1 - B.x0 + 0.2, 0.32, 0.14, m.wallM, [cx, B.roof + B.slab + 0.16, B.z1 - 0.02]))
  scene.add(box(0.14, 0.32, dz, m.wallM, [B.x1 + 0.03, B.roof + B.slab + 0.16, cz]))
  /* the shaft: a frame and glass on the front, the back of the shaft */
  const glass = new THREE.MeshStandardMaterial({ color: '#CFE2FF', transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.1, depthWrite: false })
  const sx = (SHAFT.x0 + SHAFT.x1) / 2
  const sw = SHAFT.x1 - SHAFT.x0
  scene.add(box(sw, B.roof, 0.1, mat('#8E9AB0', { roughness: 0.7 }), [sx, B.roof / 2, B.z0 + 1.0]))
  const gl = box(sw - 0.1, B.roof + 0.1, 0.03, glass, [sx, B.roof / 2, B.z1 - 0.05])
  gl.castShadow = false
  scene.add(gl)
  for (const x of [SHAFT.x0 + 0.04, SHAFT.x1 - 0.04]) scene.add(box(0.08, B.roof + B.slab, 0.1, m.trimM, [x, (B.roof + B.slab) / 2, B.z1 - 0.05]))
  scene.add(box(0.08, B.roof, B.z1 - B.z0 - 1.0, m.trimM, [SHAFT.x0 + 0.04, B.roof / 2, (B.z0 + 1.0 + B.z1) / 2]))
}

/** the lift car (or the message car), origin at its floor centre */
function makeLift(body: string, door: string) {
  const g = new THREE.Group()
  g.add(box(LIFT.w, LIFT.h, 0.08, mat(body, { roughness: 0.4, metalness: 0.3 }), [0, LIFT.h / 2, -LIFT.d / 2]))
  for (const x of [-1, 1]) g.add(box(0.06, LIFT.h, LIFT.d, mat(body, { roughness: 0.4, metalness: 0.3 }), [x * (LIFT.w / 2 - 0.03), LIFT.h / 2, 0]))
  g.add(box(LIFT.w, 0.08, LIFT.d, mat(body, { roughness: 0.4, metalness: 0.3 }), [0, LIFT.h - 0.04, 0]))
  g.add(box(LIFT.w, 0.08, LIFT.d, mat(door, { roughness: 0.4 }), [0, 0.04, 0]))
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return g
}

/** the lift's cable, from the car's roof to the machine room above the shaft */
function liftCable(scene: THREE.Scene, x: number, z: number) {
  const k = cyl(0.025, 0.025, 1, mat('#5E6B86', { metalness: 0.6, roughness: 0.3 }), [x, 0, z], 8)
  k.castShadow = false
  scene.add(k)
  return (y: number) => {
    const bot = y + LIFT.h
    k.scale.y = Math.max(0.01, B.roof - bot)
    k.position.y = (B.roof + bot) / 2
  }
}

/** the armchair (everyday) at its own origin: seat, back, arms, cushion */
function makeArmchair() {
  const g = new THREE.Group()
  const fab = mat('#E07B5A', { roughness: 0.8 })
  const fabD = mat('#C4643F', { roughness: 0.8 })
  g.add(box(0.95, 0.42, 0.85, fab, [0, 0.33, 0], 0.08))
  g.add(box(0.95, 0.72, 0.2, fabD, [0, 0.74, -0.34], 0.08))
  for (const x of [-1, 1]) g.add(box(0.18, 0.58, 0.85, fabD, [x * 0.43, 0.42, 0], 0.07))
  g.add(box(0.62, 0.14, 0.62, mat('#F2C14E', { roughness: 0.8 }), [0, 0.6, 0.04], 0.06))
  for (const x of [-0.38, 0.38]) for (const z of [-0.32, 0.32]) g.add(cyl(0.035, 0.03, 0.12, mat('#6B4A2E'), [x, 0.06, z], 8))
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  return g
}

function setupT20Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF2FB')
  cam20(camera)
  lights(scene, [0, 3.5, -1.5], 9)
  const m: Bldg = {
    wallM: mat('#F1E6D6', { roughness: 0.85 }),
    trimM: mat('#D9C9B2', { roughness: 0.8 }),
    floorM: mat('#D8B48A', { roughness: 0.7 }),
    backM: mat('#F7EFE4', { roughness: 0.9 }),
  }
  shell(scene, m)
  /* the street: pavement in front */
  scene.add(flat(box(30, 0.1, 10, mat('#D9DEE8', { roughness: 0.9 }), [0, -0.05, 3])))
  /* the lower flat's windows: warm light behind, a curtain */
  const winTex = canvasTex(96, 64, (g) => {
    g.fillStyle = '#FFE6B8'
    g.fillRect(0, 0, 96, 64)
    g.fillStyle = '#E9A86B'
    g.fillRect(0, 0, 26, 64)
    g.fillRect(70, 0, 26, 64)
    g.strokeStyle = '#B98A56'
    g.lineWidth = 4
    g.strokeRect(2, 2, 92, 60)
    g.beginPath()
    g.moveTo(48, 0)
    g.lineTo(48, 64)
    g.stroke()
  })
  for (const x of [-0.9, 1.5]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), basic(winTex, { transparent: false }))
    w.position.set(x, 1.65, 0.01)
    scene.add(w)
  }
  /* the flat: back window (sky), rug, armchair, floor lamp, shelf with a plant and books */
  const skyTex = canvasTex(128, 96, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 96)
    gr.addColorStop(0, '#9CC7F5')
    gr.addColorStop(1, '#DCEBFB')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 96)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.ellipse(40, 34, 22, 9, 0, 0, TAU)
    g.ellipse(58, 30, 16, 10, 0, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 5
    g.strokeRect(2, 2, 124, 92)
    g.beginPath()
    g.moveTo(64, 0)
    g.lineTo(64, 96)
    g.stroke()
  })
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.15), basic(skyTex, { transparent: false }))
  win.position.set(1.05, 4.35, B.z0 + 0.15)
  scene.add(win)
  scene.add(box(1.7, 0.08, 0.2, m.trimM, [1.05, 3.74, B.z0 + 0.2]))
  const rug = flat(box(2.4, 0.02, 1.5, mat('#7C9CE0', { roughness: 0.9 }), [0.35, B.floor + 0.03, -1.6], 0.01))
  scene.add(rug)
  const chair = makeArmchair()
  scene.add(chair)
  /* the floor lamp at the window's right */
  const lamp = new THREE.Group()
  lamp.add(cyl(0.18, 0.2, 0.04, mat('#3E4656'), [0, 0.02, 0], 18))
  lamp.add(cyl(0.02, 0.02, 1.45, mat('#3E4656', { metalness: 0.5 }), [0, 0.74, 0], 8))
  lamp.add(cyl(0.14, 0.24, 0.3, glowM('#FFD58A', '#FFF1D6'), [0, 1.5, 0], 20))
  lamp.position.set(2.15, B.floor, -2.4)
  lamp.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(lamp)
  /* the shelf on the wall by the shaft, a plant and books */
  scene.add(box(0.9, 0.06, 0.32, mat('#B98A56'), [-1.2, 4.2, B.z0 + 0.3]))
  const books = ['#2D63FB', '#E5484D', '#22A06B', '#F2C14E']
  books.forEach((b, i) => scene.add(box(0.07, 0.3, 0.22, mat(b, { roughness: 0.6 }), [-1.52 + i * 0.09, 4.38, B.z0 + 0.3])))
  scene.add(cyl(0.1, 0.08, 0.18, mat('#C4643F'), [-0.98, 4.32, B.z0 + 0.3], 14))
  const plantM = mat('#5DAE6B', { roughness: 0.7 })
  scene.add(sphere(0.16, plantM, [-0.98, 4.52, B.z0 + 0.3]))

  /* the roof: the lift's machine room over the shaft, the water tank on its stand, the pipe to the riser */
  const room = new THREE.Group()
  room.add(box(SHAFT.x1 - SHAFT.x0 + 0.25, 1.3, 1.8, mat('#E6DCCB', { roughness: 0.8 }), [0, 0.65, 0], 0.04))
  room.add(box(SHAFT.x1 - SHAFT.x0 + 0.4, 0.1, 1.95, m.trimM, [0, 1.35, 0]))
  room.add(box(0.5, 0.62, 0.04, mat('#5E6B86', { roughness: 0.5 }), [0.15, 0.62, 0.91], 0.02))
  const panelLeds = [0, 1, 2].map((i) => {
    const lm = new THREE.MeshBasicMaterial({ color: '#9AA3B5', toneMapped: false })
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.045, 14), lm)
    d.position.set(0.02 + i * 0.13, 0.8, 0.935)
    room.add(d)
    return lm
  })
  room.position.set((SHAFT.x0 + SHAFT.x1) / 2, B.roof + B.slab, -1.55)
  room.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(room)
  const tank = new THREE.Group()
  const tankM = mat('#4C6FD8', { roughness: 0.35 })
  for (const x of [-0.5, 0.5]) for (const z of [-0.45, 0.45]) tank.add(box(0.08, 0.55, 0.08, mat('#8A96AC', { metalness: 0.5 }), [x, 0.28, z]))
  tank.add(cyl(0.72, 0.72, 1.25, tankM, [0, 1.18, 0], 32))
  tank.add(cyl(0.74, 0.74, 0.06, mat('#3756B8'), [0, 0.86, 0], 32))
  tank.add(cyl(0.74, 0.74, 0.06, mat('#3756B8'), [0, 1.5, 0], 32))
  tank.add(cyl(0.7, 0.5, 0.12, mat('#3756B8'), [0, 1.86, 0], 32))
  tank.position.set(1.95, B.roof + B.slab, -1.75)
  tank.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(tank)
  /* the pipe: out of the tank's foot, along the roof, down the riser beside the shaft into the flat */
  const pipeM = mat('#9AA6BA', { roughness: 0.35, metalness: 0.5 })
  const ry = B.roof + B.slab + 0.12
  const water = mkPath([
    new THREE.Vector3(1.42, ry + 0.86, -1.3),
    new THREE.Vector3(1.42, ry + 0.86, -0.85),
    new THREE.Vector3(1.42, ry, -0.85),
    new THREE.Vector3(-1.72, ry, -0.85),
    new THREE.Vector3(-1.72, ry, -2.75),
    new THREE.Vector3(-1.72, B.floor + 0.2, -2.75),
  ])
  pipe(scene, water, pipeM, 0.06)
  /* the valve on the pipe, its wheel facing the camera */
  const wheel = new THREE.Group()
  wheel.add(mesh(new THREE.TorusGeometry(0.17, 0.025, 10, 28), mat('#E5484D', { roughness: 0.4 })))
  for (let i = 0; i < 3; i++) wheel.add(box(0.32, 0.03, 0.03, mat('#E5484D'), [0, 0, 0]).rotateZ((i * Math.PI) / 3))
  wheel.position.set(1.42, ry + 0.86, -0.85 + 0.14)
  scene.add(wheel)
  const dropM = new THREE.MeshStandardMaterial({ color: '#7FC8FF', emissive: new THREE.Color('#4FA8F5'), emissiveIntensity: 0.6, roughness: 0.2 })
  const updWater = riders(scene, water, 9, 0.05, dropM)

  /* the lift car */
  const car = makeLift('#F2C14E', '#B9C2D0')
  car.position.set((SHAFT.x0 + SHAFT.x1) / 2, 0, (B.z0 + 1.0 + B.z1) / 2 + 0.05)
  scene.add(car)
  const cable = liftCable(scene, car.position.x, car.position.z)

  /* people */
  const hold20 = devHold(HOLD20)
  const ownCfg = who(CAST_PRESETS.arjun, { name: 'Owner', skinTone: 'wheatish', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirt', topColor: '#E9E2CF', bottom: 'trousers', bottomColor: '#4A3F35', shoeColor: '#3A2A20' }, accessories: { glasses: 'rect', beard: 'short', watch: true }, build: { height: 1.0, shoulders: 1.04 } })
  const tenCfg = who(CAST_PRESETS.ananya, { name: 'Tenant', skinTone: 'medium', hair: { style: 'ponytail', color: 'black' }, outfit: { top: 'tshirt', topColor: '#22A06B', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { earrings: true } })
  const owner = person({ config: ownCfg, seed: 2001, faces: OWNER_FACES, pose: ownerPose, loop: L20, height: OWN.h, frames: F20, redraw, holdT: hold20 })
  const tenant = person({ config: tenCfg, seed: 2002, faces: TENANT_FACES, pose: tenantPose, loop: L20, height: TEN.h, frames: F20, redraw, holdT: hold20 })
  scene.add(owner.object, tenant.object)
  const clk = slideClock('J20', scene, hold20, [owner, tenant])
  return (t: number) => {
    const c = mod(clk.time(t), L20)
    car.position.y = liftY(c)
    cable(car.position.y)
    updWater(c, L20, 4)
    wheel.rotation.z = -TAU * seg(c, E20.valve[0], E20.valve[1])
    /* the panel: three lights step to green as he checks it */
    panelLeds.forEach((lm, i) => lm.color.set(c > E20.panel[0] + 0.4 + i * 0.45 && c < 7.6 ? '#3BD16F' : '#9AA3B5'))
    owner.object.position.set(ownerX(c), B.roof + B.slab + bob(ownerWalk(c), c), OWN.z)
    owner.update(c, camera)
    const cx = chairX(c)
    chair.position.set(cx, B.floor, TEN.chairZ)
    tenant.object.position.set(cx - TEN.off, B.floor + bob(tenWalk(c), c), TEN.z)
    tenant.update(c, camera)
  }
}

/* ------------------------------------------------------------------ T20 concept: the managed cluster */

function setupT20Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  cam20(camera)
  lights(scene, [0, 3.5, -1.5], 9)
  const m: Bldg = {
    wallM: mat('#D3DFF7', { roughness: 0.6, metalness: 0.1 }),
    trimM: mat('#3B6BFF', { roughness: 0.4, metalness: 0.15 }),
    floorM: mat('#E9EFFA', { roughness: 0.6 }),
    backM: mat('#F2F6FD', { roughness: 0.8 }),
  }
  shell(scene, m)
  scene.add(flat(box(30, 0.1, 10, mat('#E3EAF8', { roughness: 0.9 }), [0, -0.05, 3])))
  /* the lower node's panel (the windows' places): LED strips and its node mark */
  const ledTex = canvasTex(96, 64, (g) => {
    g.fillStyle = '#25356E'
    g.fillRect(0, 0, 96, 64)
    for (let r = 0; r < 4; r++) {
      g.fillStyle = '#31457F'
      g.fillRect(6, 6 + r * 14, 84, 9)
      g.fillStyle = r % 2 === 0 ? '#7FE0A0' : '#8DB0FF'
      g.fillRect(78, 8 + r * 14, 8, 5)
    }
  })
  const lowNode = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), basic(ledTex, { transparent: false }))
  lowNode.position.set(-0.9, 1.65, 0.01)
  scene.add(lowNode)
  const lowMark = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), basic(markTex(nodeUrl, redraw), { transparent: false }))
  lowMark.position.set(1.5, 1.65, 0.01)
  scene.add(lowMark)
  /* the upper node, cut away: its mark on the back wall (the window's place), the app crate, a tall app, a rack */
  const nodeMark = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), basic(markTex(nodeUrl, redraw), { transparent: false }))
  nodeMark.position.set(1.05, 4.35, B.z0 + 0.15)
  scene.add(nodeMark)
  scene.add(flat(box(2.4, 0.02, 1.5, mat('#BFD2FF', { roughness: 0.8 }), [0.35, B.floor + 0.03, -1.6], 0.01)))
  /* the app crate the team member moves (the armchair's place) */
  const crate = new THREE.Group()
  const crateM = new THREE.MeshStandardMaterial({ color: '#3B6BFF', roughness: 0.3, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.2 })
  crate.add(box(0.95, 0.9, 0.85, crateM, [0, 0.47, 0], 0.08))
  const appTex = canvasTex(96, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(8, 8, 80, 80, 12)
    g.fill()
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.roundRect(20, 22, 56, 12, 4)
    g.fill()
    g.fillStyle = '#9DB8FF'
    g.beginPath()
    g.roundRect(20, 42, 56, 12, 4)
    g.roundRect(20, 62, 56, 12, 4)
    g.fill()
  })
  const appFace = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), basic(appTex))
  appFace.position.set(0, 0.5, 0.43)
  crate.add(appFace)
  crate.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(crate)
  /* a tall app at the lamp's place, its light pulsing; a rack of the team's apps at the shelf's place */
  const tall = new THREE.Group()
  tall.add(box(0.42, 1.5, 0.42, mat('#2C3E7E', { roughness: 0.4 }), [0, 0.75, 0], 0.06))
  const tallLed = glowM('#7FE0A0', '#CFF5DC')
  tall.add(box(0.3, 0.08, 0.02, tallLed, [0, 1.3, 0.22]))
  tall.position.set(2.15, B.floor, -2.4)
  tall.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(tall)
  scene.add(box(0.9, 0.06, 0.32, mat('#9DB8FF'), [-1.2, 4.2, B.z0 + 0.3]))
  ;['#3B6BFF', '#7FA0F5', '#3B6BFF', '#9DB8FF'].forEach((b, i) => scene.add(box(0.16, 0.22, 0.22, mat(b, { roughness: 0.4 }), [-1.5 + i * 0.2, 4.34, B.z0 + 0.3], 0.03)))

  /* the control plane on the roof: the API server over the channel, etcd at the tank's place */
  const api = new THREE.Group()
  api.add(box(SHAFT.x1 - SHAFT.x0 + 0.25, 1.3, 1.8, mat('#3B6BFF', { roughness: 0.35 }), [0, 0.65, 0], 0.06))
  api.add(box(SHAFT.x1 - SHAFT.x0 + 0.4, 0.1, 1.95, m.trimM, [0, 1.35, 0]))
  const apiMark = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), basic(markTex(apiUrl, redraw), { transparent: false }))
  apiMark.position.set(0.0, 0.7, 0.91)
  api.add(apiMark)
  const apiLeds = [0, 1, 2].map((i) => {
    const lm = new THREE.MeshBasicMaterial({ color: '#9AA3B5', toneMapped: false })
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.045, 14), lm)
    d.position.set(-0.17 + i * 0.17, 0.25, 0.915)
    api.add(d)
    return lm
  })
  api.position.set((SHAFT.x0 + SHAFT.x1) / 2, B.roof + B.slab, -1.55)
  api.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(api)
  const etcd = new THREE.Group()
  for (const x of [-0.5, 0.5]) for (const z of [-0.45, 0.45]) etcd.add(box(0.08, 0.55, 0.08, mat('#8A96AC', { metalness: 0.5 }), [x, 0.28, z]))
  const discM = mat('#3567E8', { roughness: 0.3, metalness: 0.15 })
  for (let i = 0; i < 3; i++) {
    etcd.add(cyl(0.72, 0.72, 0.36, discM, [0, 0.76 + i * 0.42, 0], 40))
    etcd.add(cyl(0.725, 0.725, 0.05, mat('#9DB8FF'), [0, 0.96 + i * 0.42, 0], 40))
  }
  const etcdMark = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), basic(markTex(etcdUrl, redraw), { transparent: false }))
  etcdMark.position.set(0, 1.18, 0.73)
  etcd.add(etcdMark)
  etcd.position.set(1.95, B.roof + B.slab, -1.75)
  etcd.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  scene.add(etcd)
  /* the line: etcd -> along the roof -> the API server's side -> down the channel into the node (the pipe's route) */
  const lineM = mat('#7FA0F5', { roughness: 0.35, metalness: 0.3 })
  const ry = B.roof + B.slab + 0.12
  const line = mkPath([
    new THREE.Vector3(1.42, ry + 0.86, -1.3),
    new THREE.Vector3(1.42, ry + 0.86, -0.85),
    new THREE.Vector3(1.42, ry, -0.85),
    new THREE.Vector3(-1.72, ry, -0.85),
    new THREE.Vector3(-1.72, ry, -2.75),
    new THREE.Vector3(-1.72, B.floor + 0.2, -2.75),
  ])
  pipe(scene, line, lineM, 0.06)
  /* the dial at the valve's place: a ring the engineer turns (a backup taken) */
  const dial = new THREE.Group()
  dial.add(mesh(new THREE.TorusGeometry(0.17, 0.025, 10, 28), mat('#2D63FB', { roughness: 0.4 })))
  for (let i = 0; i < 3; i++) dial.add(box(0.32, 0.03, 0.03, mat('#2D63FB'), [0, 0, 0]).rotateZ((i * Math.PI) / 3))
  dial.position.set(1.42, ry + 0.86, -0.85 + 0.14)
  scene.add(dial)
  const msgM = new THREE.MeshStandardMaterial({ color: '#BFD2FF', emissive: new THREE.Color('#5B8CFF'), emissiveIntensity: 0.9, roughness: 0.2 })
  const updMsgs = riders(scene, line, 9, 0.05, msgM)
  /* the message car in the channel (the lift's place): a glowing cube in a frame */
  const car = new THREE.Group()
  car.add(makeLift('#9DB8FF', '#5B7FE0'))
  const cube = box(0.5, 0.5, 0.5, glowM('#5B8CFF', '#BFD2FF', { roughness: 0.25 }), [0, 0.9, 0], 0.08)
  ;(cube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8
  car.add(cube)
  car.position.set((SHAFT.x0 + SHAFT.x1) / 2, 0, (B.z0 + 1.0 + B.z1) / 2 + 0.05)
  scene.add(car)
  const cable = liftCable(scene, car.position.x, car.position.z)

  /* people: the provider's engineer (the owner's rounds), the team member (the tenant's moves) */
  const hold20 = devHold(HOLD20)
  const engCfg = who(CAST_PRESETS.meera, { name: 'Provider engineer', skinTone: 'dusky', hair: { style: 'bun', color: 'black' }, outfit: { top: 'polo', topColor: '#1F2E63', bottom: 'trousers', bottomColor: '#3E4656', shoeColor: '#2A2A30' }, accessories: { earrings: true, watch: true } })
  const devCfg = who(CAST_PRESETS.kabir, { name: 'Team member', skinTone: 'fair', hair: { style: 'curly', color: 'darkBrown' }, outfit: { top: 'hoodie', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3545', shoeColor: '#F2F2F5' }, accessories: { glasses: 'round' } })
  const eng = person({ config: engCfg, dress: withTop(LANYARD), seed: 2003, faces: OWNER_FACES, pose: ownerPose, loop: L20, height: OWN.h - 0.06, frames: F20, redraw, holdT: hold20 })
  const dev = person({ config: devCfg, seed: 2004, faces: TENANT_FACES, pose: tenantPose, loop: L20, height: TEN.h + 0.08, frames: F20, redraw, holdT: hold20 })
  scene.add(eng.object, dev.object)
  const clk = slideClock('J20', scene, hold20, [eng, dev])
  return (t: number) => {
    const c = mod(clk.time(t), L20)
    car.position.y = liftY(c)
    cable(car.position.y)
    cube.rotation.y = c * TAU * 0.25
    updMsgs(c, L20, 4)
    dial.rotation.z = -TAU * seg(c, E20.valve[0], E20.valve[1])
    apiLeds.forEach((lm, i) => lm.color.set(c > E20.panel[0] + 0.4 + i * 0.45 && c < 7.6 ? '#3BD16F' : '#9AA3B5'))
    tallLed.emissiveIntensity = 0.9 + 0.6 * Math.sin(c * TAU * 0.75)
    eng.object.position.set(ownerX(c), B.roof + B.slab + bob(ownerWalk(c), c), OWN.z)
    eng.update(c, camera)
    const cx = chairX(c)
    crate.position.set(cx, B.floor, TEN.chairZ)
    dev.object.position.set(cx - TEN.off, B.floor + bob(tenWalk(c), c), TEN.z)
    dev.update(c, camera)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
/* both cards of a slide on one clock (custom/clock.tsx): they fade in once their people are drawn; tap to pause */
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <ClockCard id={id} w={W} h={H}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T15Everyday: card('J15', setupT15Everyday, devHold(HOLD15)),
  J_T15Concept: card('J15', setupT15Concept, devHold(HOLD15)),
  J_T20Everyday: card('J20', setupT20Everyday, devHold(HOLD20)),
  J_T20Concept: card('J20', setupT20Concept, devHold(HOLD20)),
}
export const css = ''
