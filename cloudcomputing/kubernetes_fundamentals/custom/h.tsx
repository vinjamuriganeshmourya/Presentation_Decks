import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import cpUrl from '../images/k8s-control-plane.svg'
import nodeUrl from '../images/k8s-node.svg'
import podUrl from '../images/k8s-pod.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER H · SESSION 20 (Kubernetes Fundamentals) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 18's h.tsx / i.tsx / j.tsx are: a perspective camera on a real place, Character Lab people from
 * the engine's `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO TEXT on
 * either card, ONE wall-clock loop per slide shared by both cards (`./clock`: the cards fade in once every person has a
 * first frame, a tap pauses both), every loop ending in the state it starts in, held frames (`?still`, thumbnails) at
 * HOLD. Nobody walks toward or away from the camera: people step sideways.
 *
 * SLIDE 9 · T01-AN (TR 1): "A single traffic constable can direct cars at one junction by hand, but a whole city needs
 * a synchronised signal network: just as one engineer can run a few containers manually, but a fleet needs an
 * orchestrator deciding placement and recovery automatically."
 *
 *   place                    everyday: a city                               concept: a fleet of hosts
 *   front junction (0, Z0)   ONE traffic constable on his stand, directing  ONE engineer at his laptop, beside ONE host
 *                            its cars by hand                               with its two containers
 *   the grid beyond          eleven more junctions, each with a signal      eleven more hosts, each with its containers
 *                            pole                                           and a status beacon where the pole stands
 *   block (S/2, Z0-1.5S)     the traffic control centre and its mast        the orchestrator tower and its mast
 *   the roads                cars, stopping and going                       the cluster network
 *
 *   0.0 / 4.0   the control centre pulses: EVERY signal switches at once     the tower pulses: every beacon flashes, and
 *               (N-S green 0-3.3, E-W green 4-7.3), the cars of the whole    the tower places a fresh container on a
 *               city move one block in step                                  healthy host for each failed one, which sinks
 *   0.4 - 3.3   at the front junction the constable stops one road with      the engineer's container fails; he types
 *   4.4 - 7.3   a raised palm and waves the other through, by hand, each     at his laptop and restarts it by hand,
 *               time the roads change                                        slowly, one at a time
 *   2.5 / 3.1   (signals green in step)                                      two fleet containers fail (orange cross)
 *   6.5 / 7.1                                                                and wait for the next pulse
 *   The cars move one block per loop; a car keeps its colour as it goes (its colour is its place in the endless
 *   column, worked out from the loop count), so the city flows on with no seam.
 *
 * SLIDE 15 · T03-AN (TR 3): "A school principal decides which teacher takes which class, while teachers go into
 * classrooms and actually teach. In the same way, the control plane decides where work runs, and nodes do the actual
 * work."
 *
 *   place (x)        everyday: a school                                 concept: a cluster
 *   -2.15            classroom 1 (blue band): blackboard, two pupils    node 1 (its node mark): a screen, two server
 *                    at their desks                                     units in the desks' places
 *   -0.66            teacher A (teal) waits in the office               pod A (teal) waits by the control plane
 *    0               the principal, the timetable board above him       the control plane (its mark), the schedule
 *                                                                       screen above it
 *    0.66            teacher B (purple) waits in the office             pod B (purple) waits by the control plane
 *    2.15            classroom 2 (gold band)                            node 2 (its node mark)
 *
 *   0.3 - 1.0   the principal pins teacher A's card in class 1's row    the control plane writes pod A into node 1's row
 *   1.0 - 1.7   and teacher B's card in class 2's row                   and pod B into node 2's row
 *   1.2 - 3.4   each teacher walks into the class the card names        each pod rides into the node it was given
 *   3.4 - 6.9   they teach: drawings appear on the blackboard, the      the pods run: bars grow on the node's screen,
 *               pupils follow, one raises a hand                        the server units blink with the work
 *   6.9 - 8.7   the bell: the teachers walk back to the office, the     the work is done (a green tick): each node
 *               principal clears the timetable for the next period     reports back to the control plane, the pods are
 *                                                                       removed and new ones wait for the next round
 */

const W = 470
const H = 390
/* dev only: `?ht=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('ht'))
  return Number.isFinite(v) && v > 0 ? v : d
}

type V3 = [number, number, number]
const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#22304F',
  orange: '#FF8A3D',
  orangeDark: '#E0621A',
  green: '#22C55E',
  greenDark: '#16A34A',
  gold: '#F2B33D',
  goldDark: '#C8891A',
  teal: '#14B8A6',
  tealDark: '#0E8C7F',
  purple: '#8B5CF6',
  purpleDark: '#6A3FD6',
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
const DEG = Math.PI / 180
const v3 = (p: V3) => new THREE.Vector3(...p)
/** a quick pop: 0 -> overshoot -> 1 */
const pop = (t: number, a: number, d = 0.32) => {
  const k = clamp01((t - a) / d)
  if (k <= 0) return 0
  return 1 + Math.sin(k * Math.PI) * 0.28 * (1 - k * 0.4) - (1 - sm(k)) * 1
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
/** a texture redrawn on demand: `paint(state)` repaints only when the state changes */
function liveTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  let last = -1
  const paint = (s: number) => {
    if (s === last) return
    last = s
    g.setTransform(TEX_SS, 0, 0, TEX_SS, 0, 0)
    g.clearRect(0, 0, w, h)
    draw(g, s)
    t.needsUpdate = true
  }
  paint(0)
  return { tex: t, paint }
}
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) => {
  g.fillStyle = fill
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
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
const plankTex = (base: string, line: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = line
      g.lineWidth = 2
      for (let i = 0; i <= 4; i++) {
        g.beginPath()
        g.moveTo(0, i * 32)
        g.lineTo(128, i * 32)
        g.stroke()
        const x = ((i * 53) % 128) + 10
        g.beginPath()
        g.moveTo(x, i * 32)
        g.lineTo(x, i * 32 + 32)
        g.stroke()
      }
    },
    repeat,
  )
/** an official mark (svg url) rasterised on a white rounded tile (rule 54); the mark never moves */
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
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
/** a radio ring (the sync pulse): a soft stroked circle */
const ringTex = (color: string) =>
  canvasTex(128, 128, (g) => {
    g.strokeStyle = color
    g.lineWidth = 7
    g.beginPath()
    g.arc(64, 64, 56, 0, TAU)
    g.stroke()
    g.globalAlpha = 0.35
    g.lineWidth = 16
    g.beginPath()
    g.arc(64, 64, 52, 0, TAU)
    g.stroke()
  })
/** an orange cross badge (failure: orange, never red) */
const crossTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = C.orangeDark
    g.beginPath()
    g.arc(32, 33, 29, 0, TAU)
    g.fill()
    g.fillStyle = C.orange
    g.beginPath()
    g.arc(32, 31, 28, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(21, 20)
    g.lineTo(43, 42)
    g.moveTo(43, 20)
    g.lineTo(21, 42)
    g.stroke()
  })
/** a green tick badge */
const tickTex = () =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = C.greenDark
    g.beginPath()
    g.arc(32, 33, 29, 0, TAU)
    g.fill()
    g.fillStyle = C.green
    g.beginPath()
    g.arc(32, 31, 28, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(19, 32)
    g.lineTo(28, 41)
    g.lineTo(45, 22)
    g.stroke()
  })

/* ------------------------------------------------------------------ modelling helpers */

/* geometries are shared between parts of one size within a scene (each setup starts a fresh set: `freshGeos`) */
const GEOS = new Map<string, THREE.BufferGeometry>()
const freshGeos = () => GEOS.clear()
const geo = <T extends THREE.BufferGeometry>(key: string, make: () => T): T => {
  let g = GEOS.get(key)
  if (!g) GEOS.set(key, (g = make()))
  return g as T
}
const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: V3, r = 0) => {
  const g = geo(`b${w},${h},${d},${r}`, () => (r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)))
  const o = new THREE.Mesh(g, m)
  o.position.set(...pos)
  o.castShadow = true
  o.receiveShadow = true
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(geo(`c${rt},${rb},${h},${segs}`, () => new THREE.CylinderGeometry(rt, rb, h, segs)), m, pos)
const sphere = (r: number, m: THREE.Material, pos: V3) => mesh(geo(`s${r}`, () => new THREE.SphereGeometry(r, 24, 16)), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
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
function badge(tex: THREE.Texture, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), basic(tex, { depthTest: false }))
  m.renderOrder = 9
  m.visible = false
  return m
}
function floorPlane(w: number, d: number, m: THREE.Material, pos: V3) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
  f.rotation.x = -Math.PI / 2
  f.position.set(...pos)
  f.receiveShadow = true
  return f
}

/** hemisphere, a key with soft shadows, a rim */
function lights(scene: THREE.Scene, target: V3, span = 6, key = 2.0) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 1.0))
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 4, target[1] + 10, target[2] + 8)
  k.target.position.set(...target)
  k.castShadow = true
  k.shadow.mapSize.set(2048, 2048)
  k.shadow.camera.left = -span
  k.shadow.camera.right = span
  k.shadow.camera.top = span
  k.shadow.camera.bottom = -span
  k.shadow.camera.far = 60
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
function tree(scene: THREE.Scene, x: number, z: number, s = 1) {
  const g = new THREE.Group()
  g.add(cyl(0.07, 0.09, 0.62, mat('#8C6440', { roughness: 0.8 }), [0, 0.31, 0], 10))
  const leaf = mat('#5DAE6B', { roughness: 0.7 })
  g.add(sphere(0.4, leaf, [0, 0.84, 0]), sphere(0.3, leaf, [0.2, 0.72, 0.1]), sphere(0.28, leaf, [-0.18, 0.74, -0.08]))
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  scene.add(g)
  return g
}

/**
 * LOW-END PCs: the city and the rooms are hundreds of small static parts. Before the first frame, every mesh that never
 * moves (anything not under an object marked `userData.dyn`) is baked into one mesh per material, so a scene is a few
 * dozen draw calls instead of a thousand. A material's animated colour or glow still reaches every part that shares it.
 */
const dyn = <T extends THREE.Object3D>(o: T) => {
  o.userData.dyn = true
  return o
}
function mergeStatic(scene: THREE.Scene) {
  scene.updateMatrixWorld(true)
  const groups = new Map<string, THREE.Mesh[]>()
  const walk = (o: THREE.Object3D) => {
    if (o.userData.dyn) return
    for (const ch of o.children) walk(ch)
    const me = o as THREE.Mesh
    if (!me.isMesh || (me as THREE.InstancedMesh).isInstancedMesh || Array.isArray(me.material) || !me.visible) return
    const key = `${me.material.uuid}|${me.castShadow}|${me.receiveShadow}|${me.renderOrder}`
    const g = groups.get(key)
    if (g) g.push(me)
    else groups.set(key, [me])
  }
  walk(scene)
  for (const list of groups.values()) {
    if (list.length < 2) continue
    const geos = list.map((m) => {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
      g.applyMatrix4(m.matrixWorld)
      return g
    })
    const merged = mergeGeometries(geos)
    if (!merged) continue
    const first = list[0]
    const out = new THREE.Mesh(merged, first.material)
    out.castShadow = first.castShadow
    out.receiveShadow = first.receiveShadow
    out.renderOrder = first.renderOrder
    for (const m of list) m.removeFromParent()
    scene.add(out)
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
/* every person: frames at one fixed size (no re-sizing flicker) and no idle breathing (a still pose is one shared
   picture), Session 16 round 3 / Session 18 */
const PX = 256
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT: number; shadow?: number }): Sprite {
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
    shadow: o.shadow ?? 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })
const withHead = (part: ReactNode) => (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{part}</> })
const both = (...fs: ((k: Skin) => Skin)[]) => (k: Skin): Skin => fs.reduce((a, f) => f(a), k)

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 99 to the grip; an angle is measured from hanging straight down, positive lifts away from the body, the
   forearm at shoulder minus elbow) and the inverse, so a hand lands on the thing it reaches for ---- */

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
/** the loop time of the frame a sprite of F frames is showing at c (props in a hand follow the drawn frame) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)
const setArms = (p: Pose, l: Arm, r: Arm) => {
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
}
/** a person standing at a place: everything their props need */
type Body = { cfg: CharacterConfig; root: THREE.Vector3; h: number; sh: number }
const body = (cfg: CharacterConfig, root: V3, h: number): Body => ({ cfg, root: v3(root), h, sh: buildSkin(cfg).shoulderHalf })
/** arm angles that put this person's hand on a world point */
const reach = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, dy = 0): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  return ik(side, b.sh, { x: p.x, y: p.y + dy })
}

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

/** a dummy "person" for a card with nobody in it: the shared clock still waits for BOTH cards to be set up */
const NOBODY = () => [{ ready: Promise.resolve() }]

/* ================================================================== T01 · one constable, or a city of signals */

const L01 = 8
const F01 = 96
const HOLD01 = 0.62 /* the switch just made: N-S green, the constable stopping one road and waving the other; new
                       containers in flight from the tower; the engineer's container just failed */

/* the street grid: avenues (N-S, along z) at x = j*S, streets (E-W, along x) at z = Z0 + j*S */
const S01 = 6.6
const RW = 2.3 // road width
const LANE = 0.58 // lane centre from the road's centre
const Z0 = 1.6 // the front street
const CL = 1.7 // car length
const CW = 0.82 // car width
const STOP = RW / 2 + 0.3 + CL / 2 // a waiting car's centre from its junction's centre
const QGAP = CL + 0.45 // the second car in a queue
const AVES = [-2, -1, 0, 1, 2]
const STREETS = [0, -1, -2, -3]
/* the front junction (0, Z0) is the constable's / the engineer's */
const FRONT = new THREE.Vector3(0, 0, Z0)
/* where the constable / engineer stands: the front junction's near-left corner */
const POST = new THREE.Vector3(-RW / 2 - 0.78, 0, Z0 + RW / 2 + 0.5)
/* the control centre / orchestrator tower: the block right of the centre avenue, between the 2nd and 3rd streets */
const TOWER = new THREE.Vector3(S01 / 2, 0, Z0 - 1.5 * S01)
const TOWER_TOP = 3.9

/* the signals: N-S green 0-3.3 (amber to 3.8), E-W green 4-7.3 (amber to 7.8); both red in the gaps */
type Sig = 'G' | 'A' | 'R'
const nsSig = (c: number): Sig => (c < 3.3 ? 'G' : c < 3.8 ? 'A' : 'R')
const ewSig = (c: number): Sig => (c >= 4 && c < 7.3 ? 'G' : c >= 7.3 && c < 7.8 ? 'A' : 'R')
/** how far the cars of an axis have gone this loop (0..1 of one block): they pull away after the switch and stop at
    the next stop line before the amber ends */
const nsGo = (c: number) => seg(c, 0.3, 3.15)
const ewGo = (c: number) => seg(c, 4.3, 7.15)
/* the sync pulses from the control centre / tower */
const PULSES = [0, 4]
/* the loop is shifted so its seam falls two seconds after a switch, mid-flow, with nothing starting or stopping */
const OFF01 = 2.0
/** loop time from the clock: a held frame is drawn at its own time, a live one runs OFF01 ahead */
const loop01 = (T: number, t: number, holdT: number) => (t === holdT ? mod(T, L01) : mod(T + OFF01, L01))
/** dev only: `?hn=<n>` gives a held frame a loop count (to compare the frames either side of the seam) */
const devN = () => {
  if (typeof window === 'undefined') return 0
  return Number(new URLSearchParams(window.location.search).get('hn')) || 0
}
/** the sync pulse's glow: up over 0.15 s to the pulse, down over 0.6 s after it (smooth, no jump) */
const pulseK = (c: number) => Math.max(...PULSES.map((p) => { const d = mod(c - p + 0.15, L01); return d < 0.15 ? sm(d / 0.15) : 1 - sm((d - 0.15) / 0.6) }))

/* concept: the fleet's hosts at every junction but the front one; slots on each host (2 x 2) */
const SLOT: [number, number][] = [
  [-0.44, -0.44],
  [0.44, -0.44],
  [-0.44, 0.44],
  [0.44, 0.44],
]
/* the hosts (avenue j, street k) and their healthy containers' slots */
const HOSTS: { a: number; s: number; on: number[] }[] = [
  { a: -1, s: 0, on: [0, 1, 3] },
  { a: 1, s: 0, on: [0, 2] },
  { a: -1, s: -1, on: [0, 1, 2] },
  { a: 0, s: -1, on: [1, 2, 3] },
  { a: 1, s: -1, on: [0, 1, 3] },
  { a: -1, s: -2, on: [1, 3] },
  { a: 0, s: -2, on: [0, 2, 3] },
  { a: 1, s: -2, on: [0, 1] },
  { a: -2, s: -1, on: [0, 3] },
  { a: 2, s: -1, on: [1, 2] },
  { a: -2, s: -2, on: [0, 1, 2] },
  { a: 2, s: -2, on: [0, 3] },
  { a: -1, s: -3, on: [0, 1] },
  { a: 0, s: -3, on: [1, 2] },
  { a: 1, s: -3, on: [0, 2] },
]
/*
 * Recovery by the tower, seamless over the loop: each pair is a slot X and a slot Y on two different hosts. The
 * container in X fails at failX and at the next pulse (4) it sinks and the tower places a fresh one in Y; the one in Y
 * fails at failY and at the pulse at 0 (8) it sinks and a fresh one lands in X. So the loop ends as it begins.
 */
const PAIRS: { x: [number, number]; y: [number, number]; failX: number; failY: number }[] = [
  { x: [2, 3], y: [4, 2], failX: 3.1, failY: 7.1 },
  { x: [3, 0], y: [6, 1], failX: 2.5, failY: 6.5 },
]
const FLY = [0.12, 0.95] as const // a placement's flight, after its pulse
const SINK = [0.0, 0.42] as const // a failed container sinking, after the pulse
/* the engineer's host: two containers he restarts by hand, one at a time */
const MAN = [
  { slot: 0, fail: 0.4, type: [1.0, 2.5] as const, back: [2.6, 3.25] as const },
  { slot: 1, fail: 4.4, type: [5.0, 6.5] as const, back: [6.6, 7.25] as const },
]

/** the colour of a car from its place in the endless column (a hash, so neighbours differ) */
const CAR_COLS = ['#2D63FB', '#FFFFFF', '#F2C14E', '#12B5A8', '#1F2E63', '#8FB3FF', '#E9EEF6', '#E4578F', '#5B8DEF', '#F4A261']
const carCol = (lane: number, id: number, q: number) => {
  const h = Math.imul(lane * 92821 + id * 68917 + q * 1193, 0x45d9f3b) >>> 0
  return CAR_COLS[((h ^ (h >>> 15)) >>> 0) % CAR_COLS.length]
}

/** is there a car at this place of the column? (about half the places; the second in a queue less often; the
    front junction's own approaches always have one waiting, so the constable always has traffic to direct) */
const carHere = (ln: { id: number }, id: number, q: number) => {
  const h = ((Math.imul(ln.id * 7919 + id * 104729 + q * 31, 0x2c1b3c6d) >>> 0) % 1000) / 1000
  return q === 0 ? h < 0.62 : h < 0.3
}

/* lanes: N-S lanes along z on each avenue (+z keeps to +x, -z keeps to -x: traffic keeps left), E-W lanes along x on
   each street (+x keeps to -z, -x keeps to +z) */
type Lane = { ns: boolean; d: 1 | -1; off: number; base: number; id: number; lo: number; hi: number; single?: boolean }
function lanes01(): Lane[] {
  const out: Lane[] = []
  let id = 0
  for (const a of AVES) {
    out.push({ ns: true, d: 1, off: a * S01 + LANE, base: Z0, id: id++, lo: Z0 - 4 * S01, hi: Z0 + 6 })
    out.push({ ns: true, d: -1, off: a * S01 - LANE, base: Z0, id: id++, lo: Z0 - 4 * S01, hi: Z0 + 6, single: a === 0 })
  }
  for (const s of STREETS) {
    /* the front street is one-way (toward -x): nothing waits behind the constable's corner */
    if (s !== 0) out.push({ ns: false, d: 1, off: Z0 + s * S01 - LANE, base: 0, id: id++, lo: -3 * S01, hi: 3 * S01 })
    else id++
    out.push({ ns: false, d: -1, off: Z0 + s * S01 + LANE, base: 0, id: id++, lo: -3 * S01, hi: 3 * S01, single: s === 0 })
  }
  return out
}

/** a car's geometry: body + cabin (coloured), the glass band, the wheels; three instanced meshes for every car */
function carGeos() {
  const body = new RoundedBoxGeometry(CL, 0.36, CW, 3, 0.1)
  body.translate(0, 0.31, 0)
  const cabin = new RoundedBoxGeometry(0.92, 0.32, CW * 0.84, 3, 0.1)
  cabin.translate(-0.1, 0.6, 0)
  const paint = mergeGeometries([body, cabin])!
  const glass = new RoundedBoxGeometry(0.96, 0.19, CW * 0.87, 2, 0.06)
  glass.translate(-0.1, 0.62, 0)
  const wheels: THREE.BufferGeometry[] = []
  for (const wx of [-0.52, 0.52])
    for (const wz of [-CW / 2 + 0.05, CW / 2 - 0.05]) {
      const w = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16)
      w.rotateX(Math.PI / 2)
      w.translate(wx, 0.16, wz)
      wheels.push(w)
    }
  const lampsF: THREE.BufferGeometry[] = []
  for (const z of [-0.28, 0.28]) {
    const l = new THREE.BoxGeometry(0.04, 0.08, 0.16)
    l.translate(CL / 2 - 0.01, 0.36, z)
    lampsF.push(l)
  }
  return { paint, glass, wheel: mergeGeometries(wheels)!, lamps: mergeGeometries(lampsF)! }
}

/* the camera: high behind the front junction, looking up the centre avenue into the city */
function frameCam01(camera: THREE.PerspectiveCamera) {
  setCam(camera, [-0.7, 6.0, Z0 + 7.9], [0.25, 0.2, Z0 - 4.6], 44)
}
const SKY01 = '#EAF2FB'

/** the street grid: asphalt roads, kerbed blocks, the dashed lane lines and stop lines */
function streets01(scene: THREE.Scene, o: { road: THREE.Material; block: THREE.Material; kerb: THREE.Material; paint: THREE.Material; zebra: boolean }) {
  const LONG = 80
  for (const a of AVES.concat([-3, 3])) {
    const r = floorPlane(RW, LONG, o.road, [a * S01, 0.003, Z0 - 20])
    scene.add(r)
  }
  for (const s of STREETS.concat([-4, -5, 1])) {
    const r = floorPlane(LONG, RW, o.road, [0, 0.004, Z0 + s * S01])
    scene.add(r)
  }
  /* the blocks between: a kerb and a top */
  const bw = S01 - RW
  for (let a = -4; a <= 3; a++)
    for (let s = -6; s <= 1; s++) {
      const cx = (a + 0.5) * S01
      const cz = Z0 + (s + 0.5) * S01
      scene.add(flat(box(bw, 0.08, bw, o.kerb, [cx, 0.04, cz])))
      scene.add(flat(box(bw - 0.2, 0.012, bw - 0.2, o.block, [cx, 0.086, cz])))
    }
  /* the lane dividers (dashed) */
  for (const a of AVES)
    for (let z = Z0 + 8; z > Z0 - 30; z -= 0.9) {
      const near = STREETS.some((s) => Math.abs(z - (Z0 + s * S01)) < RW / 2 + 0.3)
      if (!near) scene.add(flat(box(0.05, 0.004, 0.44, o.paint, [a * S01, 0.008, z])))
    }
  for (const s of STREETS)
    for (let x = -16; x < 16; x += 0.9) {
      const near = AVES.some((a) => Math.abs(x - a * S01) < RW / 2 + 0.3)
      if (!near) scene.add(flat(box(0.44, 0.004, 0.05, o.paint, [x, 0.008, Z0 + s * S01])))
    }
  /* stop lines and zebra crossings at each junction */
  for (const a of AVES)
    for (const s of STREETS) {
      const x = a * S01
      const z = Z0 + s * S01
      scene.add(flat(box(RW / 2 - 0.08, 0.004, 0.07, o.paint, [x + RW / 4, 0.009, z - RW / 2 - 0.24])))
      scene.add(flat(box(RW / 2 - 0.08, 0.004, 0.07, o.paint, [x - RW / 4, 0.009, z + RW / 2 + 0.24])))
      scene.add(flat(box(0.07, 0.004, RW / 2 - 0.08, o.paint, [x - RW / 2 - 0.24, 0.009, z - RW / 4])))
      scene.add(flat(box(0.07, 0.004, RW / 2 - 0.08, o.paint, [x + RW / 2 + 0.24, 0.009, z + RW / 4])))
      if (o.zebra && s === 0 && a === 0)
        for (let i = -3; i <= 3; i++) scene.add(flat(box(0.16, 0.004, 0.34, o.paint, [x + i * 0.32, 0.009, z + RW / 2 + 0.07 + 0.0])))
    }
}

/** the cars: every lane's endless column, drawn from the loop count (`n`) and the loop time */
function traffic01(scene: THREE.Scene, o: { lamps: boolean }) {
  const lanes = lanes01()
  const geo = carGeos()
  const MAX = 220
  const paintM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.32, metalness: 0.15 })
  const paint = new THREE.InstancedMesh(geo.paint, paintM, MAX)
  const glass = new THREE.InstancedMesh(geo.glass, mat('#2B3A5C', { roughness: 0.15, metalness: 0.4 }), MAX)
  const wheel = new THREE.InstancedMesh(geo.wheel, mat('#23262E', { roughness: 0.7 }), MAX)
  const lamp = new THREE.InstancedMesh(geo.lamps, glowM('#FFF4C8', '#F2F2EE'), MAX)
  ;(lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6
  for (const m of [paint, glass, wheel]) {
    m.castShadow = true
    m.receiveShadow = true
  }
  paint.setColorAt(0, new THREE.Color('#FFFFFF'))
  scene.add(paint, glass, lamp)
  scene.add(wheel)
  lamp.visible = o.lamps
  const M = new THREE.Matrix4()
  const Q = new THREE.Quaternion()
  const P = new THREE.Vector3()
  const SC = new THREE.Vector3(1, 1, 1)
  const Y = new THREE.Vector3(0, 1, 0)
  const col = new THREE.Color()
  return (c: number, n: number) => {
    let k = 0
    for (const ln of lanes) {
      const go = ln.ns ? nsGo(c) : ewGo(c)
      /* junction j sits at base + j*S along the lane; a car waits before it (on the side it comes from) */
      const shift = ln.d * S01 * go
      const j0 = Math.floor((ln.lo - ln.base) / S01) - 1
      const j1 = Math.ceil((ln.hi - ln.base) / S01) + 1
      const yaw = ln.ns ? (ln.d > 0 ? -Math.PI / 2 : Math.PI / 2) : ln.d > 0 ? 0 : Math.PI
      Q.setFromAxisAngle(Y, yaw)
      for (let j = j0; j <= j1; j++)
        for (let q = 0; q < 2; q++) {
          const u = ln.base + j * S01 - ln.d * (STOP + q * QGAP) + shift
          if (u < ln.lo || u > ln.hi) continue
          if (k >= MAX) break
          if ((q === 1 && ln.single) || !carHere(ln, j - ln.d * n, q)) continue
          if (ln.ns) P.set(ln.off, 0.002, u)
          else P.set(u, 0.002, ln.off)
          M.compose(P, Q, SC)
          paint.setMatrixAt(k, M)
          glass.setMatrixAt(k, M)
          wheel.setMatrixAt(k, M)
          lamp.setMatrixAt(k, M)
          /* the car's place in the endless column: block j at loop n holds the car that was at j - d*n at loop 0 */
          paint.setColorAt(k, col.set(carCol(ln.id, j - ln.d * n, q)))
          k++
        }
    }
    for (const m of [paint, glass, wheel, lamp]) {
      m.count = k
      m.instanceMatrix.needsUpdate = true
    }
    if (paint.instanceColor) paint.instanceColor.needsUpdate = true
  }
}

/** a traffic signal head: three lamps on a dark housing; the lamp materials are shared by every head of an axis */
type Lamps = { r: THREE.MeshStandardMaterial; a: THREE.MeshStandardMaterial; g: THREE.MeshStandardMaterial; hr: THREE.MeshBasicMaterial; ha: THREE.MeshBasicMaterial; hg: THREE.MeshBasicMaterial }
function lampSet(): Lamps {
  const hm = (color: string) => new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })
  return { r: glowM('#FF5A4E', '#4A2A2A'), a: glowM('#FFB020', '#4A3A20'), g: glowM('#2EE27A', '#20402C'), hr: hm('rgba(255,90,80,0.95)'), ha: hm('rgba(255,180,40,0.95)'), hg: hm('rgba(60,240,130,0.95)') }
}
function signalHead(L: Lamps, camera: THREE.Camera) {
  const head = new THREE.Group()
  head.add(box(0.24, 0.66, 0.16, mat('#1E2638', { roughness: 0.4 }), [0, 0, 0], 0.035))
  const ms = [L.r, L.a, L.g]
  const hs = [L.hr, L.ha, L.hg]
  ms.forEach((m, i) => {
    const y = 0.2 - i * 0.2
    const l = cyl(0.07, 0.07, 0.03, m, [0, y, 0.085], 20)
    l.rotation.x = Math.PI / 2
    head.add(flat(l))
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), hs[i])
    hl.renderOrder = 4
    hl.position.set(0, y, 0.12)
    head.add(hl)
    hl.userData.bill = true
  })
  head.userData.face = () => head.traverse((n) => n.userData.bill && (n as THREE.Mesh).quaternion.copy(camera.quaternion).premultiply(head.getWorldQuaternion(new THREE.Quaternion()).invert()))
  return head
}
function setLamps(L: Lamps, s: Sig) {
  L.g.emissiveIntensity = s === 'G' ? 2.6 : 0
  L.a.emissiveIntensity = s === 'A' ? 2.6 : 0
  L.r.emissiveIntensity = s === 'R' ? 2.6 : 0
  L.hg.opacity = s === 'G' ? 0.8 : 0
  L.ha.opacity = s === 'A' ? 0.7 : 0
  L.hr.opacity = s === 'R' ? 0.6 : 0
}

/** the corner a signal pole / a status beacon stands on: each junction's near-left corner */
const cornerOf = (a: number, s: number) => new THREE.Vector3(a * S01 - RW / 2 - 0.4, 0, Z0 + s * S01 + RW / 2 + 0.4)

/** the sync rings from a mast's tip: three rings a pulse, expanding and fading */
function pulseRings(scene: THREE.Scene, at: THREE.Vector3, color: string, camera: THREE.Camera) {
  const tex = ringTex(color)
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }))
    m.position.copy(at)
    m.quaternion.copy(camera.quaternion)
    m.renderOrder = 6
    scene.add(dyn(m))
    return m
  })
  return (c: number) => {
    rings.forEach((r, i) => {
      let best = -1
      for (const p of PULSES) {
        const k = mod(c - p - i * 0.18, L01)
        if (k < 1.3) best = k
      }
      if (best < 0) {
        r.visible = false
        return
      }
      const k = best / 1.3
      r.visible = true
      r.scale.setScalar(0.4 + k * 2.4)
      setOp(r, 0.9 * (1 - k) * sm(k / 0.12))
    })
  }
}

/** the city's blocks: building footprints (two or four a block, taller further back) and the park trees; the same
    places hold racks and cooling units on the concept card */
type Bldg = { x: number; z: number; w: number; d: number; rows: number; tone: number }
const CITY = (() => {
  const bw = S01 - RW - 0.6
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const bldgs: Bldg[] = []
  for (let a = -4; a <= 3; a++)
    for (let s = -6; s <= -1; s++) {
      const cx = (a + 0.5) * S01
      const cz = Z0 + (s + 0.5) * S01
      if (Math.abs(cx - TOWER.x) < 0.1 && Math.abs(cz - TOWER.z) < 0.1) continue
      const four = rnd() > 0.45
      const parts: [number, number, number, number][] = four
        ? [
            [-bw / 4, -bw / 4, bw / 2 - 0.25, bw / 2 - 0.25],
            [bw / 4, -bw / 4, bw / 2 - 0.25, bw / 2 - 0.25],
            [-bw / 4, bw / 4, bw / 2 - 0.25, bw / 2 - 0.25],
            [bw / 4, bw / 4, bw / 2 - 0.25, bw / 2 - 0.25],
          ]
        : [
            [-bw / 4, 0, bw / 2 - 0.25, bw - 0.4],
            [bw / 4, 0, bw / 2 - 0.25, bw - 0.4],
          ]
      /* the row of blocks just behind the front street is a park (the front junction stays in view) */
      if (s === -1) continue
      for (const [dx, dz, w, d] of parts) bldgs.push({ x: cx + dx, z: cz + dz, w, d, rows: s === -2 ? 1 : 1 + Math.floor(rnd() * 3), tone: Math.floor(rnd() * 5) })
    }
  const trees: V3[] = [[-4.6, Z0 - 3.0, 1.1], [-2.6, Z0 - 4.2, 1.0], [-5.2, Z0 - 5.0, 0.9], [2.8, Z0 - 2.6, 1.05], [4.6, Z0 - 4.6, 1.15], [3.6, Z0 - 5.4, 0.9], [-4.2, Z0 + 3.4, 1.0], [3.4, Z0 + 3.2, 1.1], [5.2, Z0 + 4.4, 0.95], [-5.6, Z0 + 4.6, 1.05]]
  return { bldgs, trees }
})()

/** low city buildings with rows of windows, and the park's trees */
function buildings01(scene: THREE.Scene) {
  const winTex = (wall: string, glassC: string, rows: number) =>
    canvasTex(64, 64 * rows, (g) => {
      g.fillStyle = wall
      g.fillRect(0, 0, 64, 64 * rows)
      for (let r = 0; r < rows; r++) for (let q = 0; q < 3; q++) rr(g, 6 + q * 20, 14 + r * 64, 13, 30, 2, glassC)
    })
  const walls = ['#F4F1EA', '#DCE7FF', '#FCE3CC', '#E6F4EA', '#FFFFFF']
  const mats = new Map<string, THREE.Material>()
  const matFor = (wall: string, rows: number) => {
    const key = wall + rows
    let m = mats.get(key)
    if (!m) {
      m = new THREE.MeshStandardMaterial({ map: winTex(wall, '#8FB3E8', rows), roughness: 0.6 })
      mats.set(key, m)
    }
    return m
  }
  const roofM = mat('#C9D3E6', { roughness: 0.6 })
  for (const b of CITY.bldgs) {
    const h = b.rows * 0.95 + 0.25
    scene.add(box(b.w, h, b.d, matFor(walls[b.tone], b.rows), [b.x, 0.09 + h / 2, b.z]))
    scene.add(box(b.w + 0.06, 0.08, b.d + 0.06, roofM, [b.x, 0.09 + h + 0.04, b.z]))
  }
  for (const [x, z, k] of CITY.trees) tree(scene, x, z, k)
}

/** the concept's mirror of the city's blocks: server racks where the buildings stand, cooling units where the trees
    stand (their fans turn: a whole number of turns a loop) */
function racks01(scene: THREE.Scene) {
  const rackTex = (rows: number) =>
    canvasTex(64, 64 * rows, (g) => {
      g.fillStyle = '#2B3A5C'
      g.fillRect(0, 0, 64, 64 * rows)
      for (let r = 0; r < rows * 4; r++) {
        rr(g, 5, 4 + r * 16, 54, 11, 2, '#3D4F78')
        g.fillStyle = r % 3 === 0 ? '#6FA0FF' : '#4ADE80'
        g.beginPath()
        g.arc(52, 9.5 + r * 16, 2, 0, TAU)
        g.fill()
      }
    })
  const mats = new Map<number, THREE.Material>()
  const top = mat('#E9EEF6', { roughness: 0.5 })
  for (const b of CITY.bldgs) {
    let m = mats.get(b.rows)
    if (!m) {
      const tex = rackTex(b.rows)
      m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, emissive: new THREE.Color('#FFFFFF'), emissiveMap: tex, emissiveIntensity: 0.15 })
      mats.set(b.rows, m)
    }
    const h = b.rows * 0.62 + 0.2
    scene.add(box(b.w * 0.86, h, b.d * 0.86, m, [b.x, 0.09 + h / 2, b.z], 0))
    scene.add(box(b.w * 0.86 + 0.04, 0.05, b.d * 0.86 + 0.04, top, [b.x, 0.09 + h + 0.025, b.z]))
  }
  const fans: THREE.Object3D[] = []
  const unitM = mat('#F4F6FA', { roughness: 0.4 })
  const fanM = mat('#5C6678', { roughness: 0.4, metalness: 0.4 })
  for (const [x, z, k] of CITY.trees) {
    const g = new THREE.Group()
    g.position.set(x, 0.09, z)
    g.scale.setScalar(k)
    g.add(box(0.9, 0.5, 0.9, unitM, [0, 0.25, 0], 0.06))
    g.add(flat(cyl(0.34, 0.34, 0.02, mat('#2B3A5C', { roughness: 0.6 }), [0, 0.505, 0], 28)))
    const fan = new THREE.Group()
    fan.position.set(0, 0.52, 0)
    for (let i = 0; i < 3; i++) {
      const bl = flat(box(0.3, 0.012, 0.09, fanM, [0.15, 0, 0], 0.02))
      const arm = new THREE.Group()
      arm.rotation.y = (i / 3) * TAU
      arm.add(bl)
      fan.add(arm)
    }
    fan.add(flat(cyl(0.05, 0.05, 0.03, fanM, [0, 0.005, 0], 12)))
    g.add(fan)
    fans.push(dyn(fan))
    scene.add(g)
  }
  return (c: number) => fans.forEach((f, i) => (f.rotation.y = (c / L01) * TAU * 3 + i))
}

/* ------------------------------------------------------------------ T01 everyday: the constable and the city */

/** the traffic constable's white peaked cap (head-local, skull centre 0,0; crown about y -66), drawn over the hair */
const CONSTABLE_CAP = (
  <g data-part="constable-cap">
    <path d="M -66 -50 C -74 -108 74 -108 66 -50 Z" fill="#F7F8FA" stroke="#C9D1DE" strokeWidth={2} />
    <path d="M -50 -92 C -20 -104 20 -104 50 -92" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={6} fill="none" />
    <rect x={-67} y={-64} width={134} height={16} rx={4} fill="#1F2E63" />
    <rect x={-67} y={-58} width={134} height={3} fill="#F2C14E" opacity={0.8} />
    <path d="M -10 -88 L 0 -97 L 10 -88 L 7 -75 L -7 -75 Z" fill="#F2C14E" stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -62 -48 Q 0 -24 62 -48 L 58 -55 Q 0 -37 -58 -55 Z" fill="#141B2E" />
  </g>
)
/** his uniform details: navy epaulettes, a brass badge, a whistle on a white cord, a reflective cross-belt */
const CONSTABLE_UNIFORM = (
  <g data-part="constable-uniform">
    <path d="M 140 212 L 178 206 L 180 218 L 142 224 Z" fill="#1F2E63" />
    <path d="M 260 212 L 222 206 L 220 218 L 258 224 Z" fill="#1F2E63" />
    <path d="M 176 210 L 248 372" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" />
    <path d="M 176 210 L 248 372" stroke="#FF8A3D" strokeWidth={6} strokeLinecap="round" />
    <path d="M 226 246 L 231 236 L 236 246 L 247 247 L 239 254 L 241 265 L 231 259 L 221 265 L 223 254 L 215 247 Z" fill="#F2C14E" stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M 166 232 C 170 260 180 282 194 294" stroke="#E9EEF7" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    <rect x={186} y={290} width={16} height={8} rx={3} fill="#C9D3E6" />
  </g>
)
/** the engineer's ID on a lanyard */
const LANYARD = (strap: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={strap} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={strap} opacity={0.55} />
  </g>
)

const PERSON01 = 1.5
const STAND_H = 0.22 // the constable's stand

/* the constable: one arm out flat, palm to the road he stops; the other waving the open road through. They change
   over at each switch (screen-left arm stops the E-W street while the avenue goes, then the other way). */
const STOP_ARM: Arm = { s: 92, e: 4 }
const WAVE_ARM = (c: number): Arm => ({ s: 58 + 6 * Math.sin(c * TAU * 1.5), e: 62 + 46 * (0.5 + 0.5 * Math.sin(c * TAU * 1.5)) })
function constablePose(p: Pose, c: number) {
  /* 0..1: 0 = the avenue goes (L stops the street, R waves the avenue on), 1 = the street goes (the other way) */
  const kk = c >= 7.55 ? 1 - seg(c, 7.55, 8.25) : c < 0.25 ? 1 - seg(c + L01, 7.55, 8.25) : seg(c, 3.55, 4.25)
  /* at each change-over both arms come down a little */
  const mid = hold(c, 3.4, 3.65, 4.05, 4.3) + seg(c, 7.4, 7.65) + (c < 0.3 ? 1 - seg(c, 0.05, 0.3) : 0)
  const down: Arm = { s: 22, e: 30 }
  const l = mixArm(mixArm(WAVE_ARM(c), STOP_ARM, kk), down, clamp01(mid) * 0.7)
  const r = mixArm(mixArm(STOP_ARM, WAVE_ARM(c), kk), down, clamp01(mid) * 0.7)
  setArms(p, l, r)
  p.palmL = lerp(0.4, 1, kk)
  p.palmR = lerp(1, 0.4, kk)
  p.fL1 = p.fL2 = p.fL3 = p.fL4 = lerp(0.3, 0, kk)
  p.fR1 = p.fR2 = p.fR3 = p.fR4 = lerp(0, 0.3, kk)
  /* he looks at the road he waves on */
  to(p, 'headTurn', lerp(0.35, -0.35, kk), 1)
  to(p, 'lookX', lerp(0.7, -0.7, kk), 1)
  to(p, 'headNod', 0.06, 1)
  to(p, 'stance', lerp(0.4, -0.4, kk), 1)
}
const CONSTABLE_FACES: [number, string][] = [
  [0, 'proud'],
  [2.6, 'listening'],
  [3.7, 'skeptical'],
  [4.4, 'proud'],
  [6.6, 'listening'],
  [7.7, 'skeptical'],
]

function setupT01Everyday(kit: StageKit): Update {
  freshGeos()
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color(SKY01)
  scene.fog = new THREE.Fog(SKY01, 18, 42)
  frameCam01(camera)
  lights(scene, [0, 0, Z0 - 6], 16)
  const ground = floorPlane(200, 200, mat('#E4ECF5', { roughness: 0.95 }), [0, -0.002, 0])
  scene.add(ground)
  streets01(scene, {
    road: mat('#4A5266', { roughness: 0.85 }),
    block: mat('#A6DB9F', { roughness: 0.9, emissive: new THREE.Color('#A6DB9F'), emissiveIntensity: 0.15 }),
    kerb: mat('#E7EBF2', { roughness: 0.7 }),
    paint: mat('#F7F8FA', { roughness: 0.6 }),
    zebra: true,
  })
  buildings01(scene)

  /* the signals: one pole a junction (not the constable's), a head facing the avenue and one facing the street */
  const NS = lampSet()
  const EW = lampSet()
  const poleM = mat('#5C6678', { roughness: 0.4, metalness: 0.5 })
  const heads: THREE.Group[] = []
  for (const a of AVES)
    for (const s of STREETS) {
      if (a === 0 && s === 0) continue
      const p = cornerOf(a, s)
      const g = new THREE.Group()
      g.position.copy(p)
      g.add(cyl(0.05, 0.06, 1.9, poleM, [0, 0.95, 0], 12))
      g.add(cyl(0.12, 0.14, 0.1, poleM, [0, 0.05, 0], 14))
      const h1 = signalHead(NS, camera)
      h1.position.set(0, 2.1, 0)
      g.add(h1)
      const h2 = signalHead(EW, camera)
      h2.position.set(0.22, 1.55, 0)
      h2.rotation.y = Math.PI / 2 - 0.35
      g.add(h2)
      heads.push(h1, h2)
      scene.add(g)
    }

  /* the traffic control centre: a white building with a blue band, a mast and its dish */
  const cc = new THREE.Group()
  cc.position.copy(TOWER)
  const bw = S01 - RW - 0.8
  cc.add(box(bw, 1.6, bw, mat('#FFFFFF', { roughness: 0.45 }), [0, 0.89, 0], 0.08))
  cc.add(flat(box(bw + 0.02, 0.22, bw + 0.02, mat(C.brand, { roughness: 0.4 }), [0, 1.45, 0], 0.04)))
  for (let i = 0; i < 4; i++) cc.add(flat(box(0.5, 0.42, 0.02, mat('#8FB3E8', { roughness: 0.2, metalness: 0.3 }), [-1.2 + i * 0.8, 0.8, bw / 2 + 0.01])))
  cc.add(cyl(0.06, 0.1, TOWER_TOP - 1.7, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, 1.7 + (TOWER_TOP - 1.7) / 2, 0], 10))
  for (const y of [2.6, 3.4]) cc.add(box(0.5, 0.04, 0.04, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, y, 0]))
  const dish = mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, TAU, 0, Math.PI / 2.6), mat('#F4F6FA', { roughness: 0.35, side: THREE.DoubleSide }), [0.42, 2.9, 0.25])
  dish.rotation.z = Math.PI / 2 + 0.5
  dish.rotation.y = -0.6
  cc.add(dish)
  const tipM = glowM(C.brand, '#BFD3FF')
  cc.add(flat(sphere(0.1, tipM, [0, TOWER_TOP, 0])))
  scene.add(cc)
  const rings = pulseRings(scene, new THREE.Vector3(TOWER.x, TOWER_TOP, TOWER.z), 'rgba(45,99,251,0.95)', camera)

  /* the cars */
  const traffic = traffic01(scene, { lamps: true })

  /* the constable on his stand at the front junction's near-left corner */
  const stand = new THREE.Group()
  stand.position.copy(POST)
  stand.add(cyl(0.42, 0.46, STAND_H, mat('#FFFFFF', { roughness: 0.4 }), [0, STAND_H / 2, 0], 32))
  stand.add(flat(cyl(0.465, 0.465, 0.07, mat(C.brand, { roughness: 0.4 }), [0, STAND_H * 0.45, 0], 32)))
  scene.add(stand)
  const cCfg = who(CAST_PRESETS.rohan, {
    name: 'Traffic Constable',
    skinTone: 'medium',
    hair: { style: 'short', color: 'black' },
    outfit: { top: 'shirt', topColor: '#F5F6F8', bottom: 'trousers', bottomColor: '#24304F', shoeColor: '#1E1E24' },
    accessories: { beard: 'stubble', belt: true, watch: false },
    build: { height: 1.02, shoulders: 1.05 },
  })
  const cop = person({
    config: cCfg,
    dress: both(withHead(CONSTABLE_CAP), withTop(CONSTABLE_UNIFORM)),
    seed: 201,
    faces: CONSTABLE_FACES,
    pose: constablePose,
    loop: L01,
    height: PERSON01,
    frames: F01,
    redraw,
    holdT: devHold(HOLD01),
    shadow: 0,
  })
  cop.object.position.set(POST.x, STAND_H, POST.z)
  scene.add(cop.object)
  const clk = slideClock('T01', scene, devHold(HOLD01), [cop])
  heads.forEach((h) => (h.userData.face as () => void)())
  dyn(cop.object)
  mergeStatic(scene)
  freshGeos()

  const holdT = devHold(HOLD01)
  return (t: number) => {
    const T = clk.time(t)
    const c = loop01(T, t, holdT)
    const n = t === holdT ? devN() : Math.floor((T + OFF01) / L01)
    setLamps(NS, nsSig(c))
    setLamps(EW, ewSig(c))
    rings(c)
    tipM.emissiveIntensity = 0.4 + 2.2 * pulseK(c)
    traffic(c, n)
    cop.update(c, camera)
  }
}

/* ------------------------------------------------------------------ T01 concept: the engineer and the fleet */

/** a shipping-container texture: vertical ribs, a door end */
const ribTex = (base: string, rib: string) =>
  canvasTex(96, 64, (g) => {
    g.fillStyle = base
    g.fillRect(0, 0, 96, 64)
    g.fillStyle = rib
    for (let i = 0; i < 12; i++) g.fillRect(4 + i * 7.6, 6, 3, 52)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    g.fillRect(0, 0, 96, 4)
  })
type Box = { g: THREE.Group; body: THREE.Mesh }
function containerBox(m: THREE.Material[]): Box {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.48, 0.66), m)
  body.position.y = 0.24
  body.castShadow = true
  body.receiveShadow = true
  g.add(body)
  return { g, body }
}
/** a host machine: a white slab with a blue light strip, four container bays on top */
function hostSlab(scene: THREE.Scene, at: THREE.Vector3, stripM: THREE.Material) {
  const g = new THREE.Group()
  g.position.copy(at)
  g.add(box(1.86, 0.34, 1.86, mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F4F7FF'), emissiveIntensity: 0.25 }), [0, 0.17, 0], 0.08))
  g.add(flat(box(1.5, 0.05, 0.02, stripM, [0, 0.17, 0.935])))
  for (const [sx, sz] of SLOT) g.add(flat(box(0.74, 0.012, 0.74, mat('#DCE5F7', { roughness: 0.5 }), [sx, 0.346, sz], 0.02)))
  scene.add(g)
  return g
}

const ENGINEER_FACES: [number, string][] = [
  [0, 'neutral'],
  [0.45, 'worried'],
  [1.0, 'thinking'],
  [2.7, 'happy'],
  [3.6, 'neutral'],
  [4.45, 'worried'],
  [5.0, 'thinking'],
  [6.7, 'happy'],
  [7.6, 'neutral'],
]

function setupT01Concept(kit: StageKit): Update {
  freshGeos()
  const { scene, camera, redraw } = kit
  const BG = '#EEF3FB'
  scene.background = new THREE.Color(BG)
  scene.fog = new THREE.Fog(BG, 18, 42)
  frameCam01(camera)
  lights(scene, [0, 0, Z0 - 6], 16)
  const ground = floorPlane(200, 200, mat('#E6EDFA', { roughness: 0.95 }), [0, -0.002, 0])
  scene.add(ground)
  /* the cluster network in the roads' places: navy lanes with soft blue edges; floor tiles in the blocks' places */
  streets01(scene, {
    road: mat('#26346B', { roughness: 0.5, metalness: 0.2 }),
    block: new THREE.MeshStandardMaterial({ map: tileTex('#F4F7FD', '#DCE4F3', 4, [3, 3]), roughness: 0.6 }),
    kerb: mat('#C9D7F7', { roughness: 0.5 }),
    paint: glowM('#7FA6FF', '#5C6FA8'),
    zebra: false,
  })

  const fans = racks01(scene)
  /* the hosts: one at every junction; the front one is the engineer's */
  const stripM = glowM(C.brand, '#9BB6FF')
  stripM.emissiveIntensity = 0.9
  const blueM = [new THREE.MeshStandardMaterial({ map: ribTex('#2D63FB', '#1F4FD8'), roughness: 0.3, metalness: 0.15 })]
  blueM.push(blueM[0], mat('#5B8DEF', { roughness: 0.3 }), mat('#1F47C4'), blueM[0], blueM[0])
  const orangeM = [new THREE.MeshStandardMaterial({ map: ribTex('#FF8A3D', '#E0621A'), roughness: 0.3 })]
  orangeM.push(orangeM[0], mat('#FFA766', { roughness: 0.3 }), mat(C.orangeDark), orangeM[0], orangeM[0])
  const hostAt = (a: number, s: number) => new THREE.Vector3(a * S01, 0, Z0 + s * S01)
  hostSlab(scene, FRONT, stripM)
  const hosts = HOSTS.map((h) => hostSlab(scene, hostAt(h.a, h.s), stripM))
  /* the steady containers (every slot that no pair uses) */
  const pairSlots = new Set(PAIRS.flatMap((p) => [p.x.join(), p.y.join()]))
  const bob = (i: number, c: number) => 0.015 * Math.sin(c * TAU * 0.5 + i * 1.3)
  const steady: { b: Box; i: number }[] = []
  HOSTS.forEach((h, hi) =>
    h.on.forEach((si) => {
      if (pairSlots.has([hi, si].join())) return
      const b = containerBox(blueM)
      b.g.position.set(SLOT[si][0], 0.35, SLOT[si][1])
      hosts[hi].add(dyn(b.g))
      steady.push({ b, i: steady.length })
    }),
  )
  /* each pair: the box in X and the box in Y */
  const slotPos = (hs: [number, number], out: THREE.Vector3) => {
    const h = HOSTS[hs[0]]
    return out.set(h.a * S01 + SLOT[hs[1]][0], 0.35, Z0 + h.s * S01 + SLOT[hs[1]][1])
  }
  const pairBoxes = PAIRS.map(() => [containerBox(blueM), containerBox(blueM)])
  pairBoxes.flat().forEach((b) => scene.add(dyn(b.g)))
  const crosses = PAIRS.map(() => [badge(crossTex(), 0.8), badge(crossTex(), 0.8)])
  crosses.flat().forEach((b) => scene.add(dyn(b)))

  /* the status beacons in the signals' places: a pole and a lamp that flashes at every pulse */
  const beaconM = glowM(C.green, '#BFF5D2')
  const poleM = mat('#5C6678', { roughness: 0.4, metalness: 0.5 })
  const beaconHalo = new THREE.MeshBasicMaterial({ map: haloTex('rgba(60,240,130,0.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })
  for (const a of AVES)
    for (const s of STREETS) {
      if (a === 0 && s === 0) continue
      const p = cornerOf(a, s)
      const g = new THREE.Group()
      g.position.copy(p)
      g.add(cyl(0.05, 0.06, 1.9, poleM, [0, 0.95, 0], 12))
      g.add(cyl(0.12, 0.14, 0.1, poleM, [0, 0.05, 0], 14))
      g.add(box(0.26, 0.26, 0.26, mat('#1E2638', { roughness: 0.4 }), [0, 2.05, 0], 0.05))
      g.add(flat(sphere(0.12, beaconM, [0, 2.05, 0.1])))
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), beaconHalo)
      hl.position.set(0, 2.05, 0.2)
      hl.quaternion.copy(camera.quaternion)
      hl.renderOrder = 4
      g.add(hl)
      scene.add(g)
    }

  /* the orchestrator tower in the control centre's place: a shaft, a glass cab with a blue band, a mast */
  const tw = new THREE.Group()
  tw.position.copy(TOWER)
  const bw = S01 - RW - 0.8
  tw.add(box(bw, 0.5, bw, mat('#FFFFFF', { roughness: 0.45 }), [0, 0.34, 0], 0.08))
  tw.add(cyl(0.55, 0.75, 2.2, mat('#F4F6FA', { roughness: 0.4 }), [0, 1.65, 0], 28))
  tw.add(cyl(1.15, 0.85, 0.75, mat('#2B3A5C', { roughness: 0.15, metalness: 0.45 }), [0, 3.1, 0], 28))
  tw.add(flat(cyl(1.18, 1.18, 0.12, mat(C.brand, { roughness: 0.4 }), [0, 2.78, 0], 28)))
  tw.add(cyl(1.2, 1.2, 0.12, mat('#FFFFFF', { roughness: 0.4 }), [0, 3.52, 0], 28))
  tw.add(cyl(0.05, 0.08, TOWER_TOP - 3.55, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, 3.55 + (TOWER_TOP - 3.55) / 2, 0], 10))
  const tipM = glowM(C.brand, '#BFD3FF')
  tw.add(flat(sphere(0.1, tipM, [0, TOWER_TOP, 0])))
  const cabM = glowM('#6FA0FF', '#2B3A5C', { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.0 })
  const cabGlow = flat(cyl(1.16, 0.86, 0.6, cabM, [0, 3.1, 0], 28))
  tw.add(cabGlow)
  scene.add(tw)
  const rings = pulseRings(scene, new THREE.Vector3(TOWER.x, TOWER_TOP, TOWER.z), 'rgba(45,99,251,0.95)', camera)
  /* a placement's flight starts at the cab */
  const CAB = new THREE.Vector3(TOWER.x, 3.1, TOWER.z)

  /* the engineer's host: two containers he restarts by hand */
  const manBoxes = MAN.map((m) => {
    const b = containerBox(blueM)
    b.g.position.set(FRONT.x + SLOT[m.slot][0], 0.35, FRONT.z + SLOT[m.slot][1])
    scene.add(dyn(b.g))
    return b
  })
  const manCross = MAN.map(() => {
    const b = badge(crossTex(), 0.8)
    scene.add(dyn(b))
    return b
  })

  /* the engineer at his standing desk, on the constable's corner */
  const desk = new THREE.Group()
  desk.position.set(POST.x, 0, POST.z + 0.42)
  desk.add(box(0.86, 0.05, 0.46, mat('#F4F6FA', { roughness: 0.4 }), [0, 0.84, 0], 0.02))
  desk.add(cyl(0.035, 0.035, 0.82, mat('#8C96A8', { metalness: 0.5, roughness: 0.3 }), [0, 0.41, 0], 10))
  desk.add(box(0.5, 0.03, 0.34, mat('#8C96A8', { metalness: 0.5, roughness: 0.3 }), [0, 0.015, 0], 0.01))
  /* the laptop: base on the desk, the lid toward him (its back to the camera) */
  desk.add(box(0.46, 0.025, 0.3, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, 0.88, 0.02], 0.01))
  const lid = new THREE.Group()
  lid.position.set(0, 0.89, -0.12)
  lid.rotation.x = 0.28
  lid.add(box(0.46, 0.3, 0.02, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [0, 0.15, 0], 0.01))
  const logoM = glowM('#9CC2FF', '#E9F0FF')
  lid.add(flat(sphere(0.03, logoM, [0, 0.16, 0.012])))
  desk.add(lid)
  scene.add(desk)
  const eCfg = who(CAST_PRESETS.dev, {
    name: 'Engineer',
    skinTone: 'wheatish',
    hair: { style: 'curly', color: 'black' },
    outfit: { top: 'hoodie', topColor: '#3E5BA9', bottom: 'jeans', bottomColor: '#2C3545', shoeColor: '#F2F2F5' },
    accessories: { glasses: 'rect', watch: true, beard: 'stubble' },
  })
  const eng = body(eCfg, [POST.x, 0, POST.z], PERSON01 + STAND_H * 0.6)
  const keys = new THREE.Vector3(POST.x, 0.93, POST.z + 0.42)
  const typeL = reach(eng, 'L', keys.clone().add(new THREE.Vector3(-0.1, 0, 0)), camera)
  const typeR = reach(eng, 'R', keys.clone().add(new THREE.Vector3(0.1, 0, 0)), camera)
  const restL: Arm = { s: 10, e: 40 }
  const restR: Arm = { s: 10, e: 40 }
  const typing = (c: number) => Math.max(...MAN.map((m) => hold(c, m.type[0] - 0.25, m.type[0], m.type[1], m.type[1] + 0.25)))
  const tap = (c: number, ph: number) => 4 * Math.max(0, Math.sin(c * TAU * 3 + ph))
  const engPose = (p: Pose, c: number) => {
    const w = typing(c)
    setArms(p, mixArm(restL, { s: typeL.s + tap(c, 0) * 0.5, e: typeL.e + tap(c, 0) }, w), mixArm(restR, { s: typeR.s + tap(c, 1.7) * 0.5, e: typeR.e + tap(c, 1.7) }, w))
    to(p, 'headNod', 0.32, w)
    to(p, 'lookY', 0.8, w)
    /* when a container fails: he looks round at his host (right of him) */
    for (const m of MAN) {
      const lk = hold(c, m.fail + 0.05, m.fail + 0.3, m.type[0] - 0.3, m.type[0] - 0.05) + hold(c, m.back[0], m.back[0] + 0.2, m.back[1] + 0.2, m.back[1] + 0.5)
      to(p, 'headTurn', 0.45, lk)
      to(p, 'lookX', 0.9, lk)
      to(p, 'headNod', 0.12, lk)
      to(p, 'lookY', 0.2, lk)
    }
  }
  const engS = person({ config: eCfg, dress: withTop(LANYARD('#2D63FB')), seed: 202, faces: ENGINEER_FACES, pose: engPose, loop: L01, height: eng.h, frames: F01, redraw, holdT: devHold(HOLD01) })
  engS.object.position.copy(eng.root)
  scene.add(engS.object)
  const clk = slideClock('T01', scene, devHold(HOLD01), [engS])
  dyn(engS.object)
  mergeStatic(scene)
  freshGeos()

  const P = new THREE.Vector3()
  const Q = new THREE.Vector3()
  const CR = new THREE.Vector3()
  const holdT = devHold(HOLD01)
  /** a box in a slot: state at loop time c given its fail time and the pulse that removes it / brings it */
  return (t: number) => {
    const c = loop01(clk.time(t), t, holdT)
    rings(c)
    fans(c)
    const pulse = pulseK(c)
    tipM.emissiveIntensity = 0.4 + 2.2 * pulse
    cabM.opacity = 0.55 * pulse
    cabM.emissiveIntensity = 1.6 * pulse
    beaconM.emissiveIntensity = 1.0 + 2.2 * pulse
    beaconHalo.opacity = 0.25 + 0.6 * pulse
    stripM.emissiveIntensity = 0.7 + 0.25 * Math.sin(c * TAU * 0.5)
    steady.forEach(({ b, i }) => (b.g.position.y = 0.35 + bob(i, c)))
    /* the pairs */
    PAIRS.forEach((pr, pi) => {
      const [bx, by] = pairBoxes[pi]
      const [cx, cy] = crosses[pi]
      /* X: lands from the tower after the pulse at 0, fails at failX, sinks after the pulse at 4 */
      const slotState = (box: Box, cross: THREE.Mesh, hs: [number, number], arrive: number, fail: number, leave: number) => {
        slotPos(hs, P)
        /* loop time from the pulse that brings it: flight, healthy, failed (orange), sinking after the pulse that takes it, empty */
        const d = mod(c - arrive, L01)
        const dFail = mod(fail - arrive, L01)
        const dLeave = mod(leave - arrive, L01)
        cross.visible = false
        box.g.visible = d >= FLY[0] && d < dLeave + SINK[1]
        if (!box.g.visible) return
        if (d < FLY[1]) {
          const k = sm((d - FLY[0]) / (FLY[1] - FLY[0]))
          Q.copy(CAB).lerp(P, k)
          Q.y = lerp(CAB.y, P.y, k) + Math.sin(k * Math.PI) * 1.6
          box.g.position.copy(Q)
          box.g.scale.setScalar(lerp(0.5, 1, k))
          box.body.material = blueM
          return
        }
        box.g.scale.setScalar(1)
        box.g.position.copy(P)
        box.g.position.y += bob(pi * 3 + (hs[1] + 1), c)
        if (d >= dLeave) {
          box.g.scale.set(1, Math.max(0.001, 1 - sm((d - dLeave) / SINK[1])), 1)
          box.body.material = orangeM
          /* the cross shrinks away as the box goes */
          const k = 1 - sm((d - dLeave) / 0.25)
          cross.visible = k > 0.01
          cross.position.set(P.x, 1.35, P.z)
          cross.quaternion.copy(camera.quaternion)
          cross.scale.setScalar(Math.max(0.001, k))
          return
        }
        const failed = d >= dFail
        box.body.material = failed ? orangeM : blueM
        if (failed) {
          const k = pop(d - dFail, 0)
          cross.visible = k > 0.01
          cross.position.set(P.x, 1.35, P.z)
          cross.quaternion.copy(camera.quaternion)
          cross.scale.setScalar(Math.max(0.001, k))
        }
      }
      slotState(bx, cx, pr.x, 0, pr.failX, 4)
      slotState(by, cy, pr.y, 4, pr.failY, 0)
    })
    /* the engineer's host */
    MAN.forEach((m, i) => {
      const b = manBoxes[i]
      const x = manCross[i]
      const failed = c >= m.fail && c < m.back[0] + 0.15
      const sinkK = seg(c, m.back[0], m.back[0] + 0.3)
      const riseK = seg(c, m.back[0] + 0.3, m.back[1])
      const down = c >= m.back[0] && c < m.back[0] + 0.3
      b.body.material = failed || down ? orangeM : blueM
      b.g.scale.set(1, c >= m.back[0] && c < m.back[1] ? (down ? 1 - sinkK : riseK) : 1, 1)
      b.g.position.y = 0.35 + bob(20 + i, c)
      x.visible = failed && c < m.back[0]
      if (x.visible) {
        const k = pop(c, m.fail) * (1 - seg(c, m.back[0] - 0.25, m.back[0]))
        CR.set(FRONT.x + SLOT[m.slot][0], 1.35, FRONT.z + SLOT[m.slot][1])
        x.position.copy(CR)
        x.quaternion.copy(camera.quaternion)
        x.scale.setScalar(Math.max(0.001, k))
      }
    })
    /* the laptop's light flickers while he types */
    logoM.emissiveIntensity = 0.3 + 1.2 * typing(c) * (0.6 + 0.4 * Math.sin(c * TAU * 4))
    engS.update(c, camera)
  }
}

/* ================================================================== T03 · the principal and the teachers */

const L03 = 9
const F03 = 90
const HOLD03 = 5.25 /* both teachers at their boards, a pupil's hand up; both cards on the timetable */

/* the building, front to back: the open front at z 0.9, the walk line, the back wall */
const BACK = -1.9
const WALLH = 3.3
const WALKZ = -0.72 // the line every teacher (and pod) moves along
const PART = 0.95 // the partitions between the office and the rooms (x = +-PART); they stop short of the walk line
const OUTER = 2.8 // the outer walls
const PART_FRONT = -1.06
const PRIN = new THREE.Vector3(0.3, 0, -1.58)
const DESK = { x: 0.28, z: -1.18, w: 0.58, d: 0.42, h: 0.76 }
const BOARD = { x0: -0.58, x1: 0.04, y0: 1.2, y1: 1.86 } // the timetable (on the back wall)
const ROW_Y = [1.68, 1.39] // class 1's row, class 2's row
const SLOT_X = BOARD.x1 - 0.11 // the period's slot on each row (where a card is pinned)
const WAIT_X = 0.86 // the teachers wait at -+WAIT_X (at the rooms' edges)
const TEACH_X = 1.5 // and teach at -+TEACH_X
const BB = { x0: 1.84, x1: 2.62, y0: 1.32, y1: 1.94 } // the blackboard in room 2 (room 1 mirrors it)
const PUPIL_X = [1.93, 2.41]
const PUPIL_Z = 0.62
const PDESK_Z = 0.92
/* slide 15 everyday, review 2026-11-23: the pupils sit facing their board, seen from behind; each desk is in front of
   its pupil (board side), a chair under the pupil (camera side). The concept card keeps PUPIL_Z. */
const SEAT_Z = 0.74
const SDESK_Z = 0.42
const SEAT_H = 0.42 // the chair seat's top
const SEAT_SINK = 0.06 // a seated pupil's sprite drops so the hips meet the seat
const CROP_Y = 375 // the rig row the seated pupil's picture stops at (just under the hips, inside the seat)
const BELL = new THREE.Vector3(0.6, 2.3, BACK + 0.06)

const T03 = {
  pinA: { tray: [0.2, 0.5] as const, up: [0.55, 0.95] as const },
  pinB: { tray: [1.05, 1.3] as const, up: [1.35, 1.75] as const },
  walkA: [1.25, 2.55] as const,
  walkB: [1.95, 3.25] as const,
  drawA: [3.0, 3.8, 4.6, 5.4],
  drawB: [3.7, 4.5, 5.3, 6.1],
  handA: [4.9, 5.15, 5.65, 5.9] as const, // the pupil next to teacher A raises a hand
  handB: [5.6, 5.85, 6.35, 6.6] as const,
  bell: [6.9, 7.35] as const,
  backA: [7.25, 8.45] as const,
  backB: [7.5, 8.7] as const,
  erase: [8.2, 8.75] as const,
  unpin: { up: [7.55, 7.95] as const, tray: [8.05, 8.55] as const },
}
const teachAt = (side: -1 | 1) => (c: number) => {
  const w = side < 0 ? T03.walkA : T03.walkB
  const b = side < 0 ? T03.backA : T03.backB
  return along(c, [
    [0, 0, side * WAIT_X],
    [w[0], w[1], side * TEACH_X],
    [b[0], b[1], side * WAIT_X],
  ])
}
/** how many drawings are on a board at c (0..4) */
const drawn = (c: number, at: number[]) => (c >= T03.erase[1] ? 0 : at.filter((a) => c >= a).length)
const eraseK = (c: number) => seg(c, T03.erase[0], T03.erase[1])

/** the timetable: two rows (a classroom glyph in the room's colour, then the period's slot) */
function drawTimetable(g: CanvasRenderingContext2D, w: number, h: number, kind: 'school' | 'cluster') {
  rr(g, 0, 0, w, h, 10, kind === 'school' ? '#FFFFFF' : '#1E2638')
  g.strokeStyle = kind === 'school' ? '#C9D3E6' : '#3A4A70'
  g.lineWidth = 3
  g.beginPath()
  g.roundRect(1.5, 1.5, w - 3, h - 3, 9)
  g.stroke()
  const rowH = (h - 24) / 2
  for (let r = 0; r < 2; r++) {
    const y = 12 + r * rowH
    const col = r === 0 ? C.brand : C.gold
    if (kind === 'school') {
      /* a little classroom: a blackboard on a coloured band */
      rr(g, 12, y + 6, 46, rowH - 12, 6, col)
      rr(g, 18, y + 12, 34, rowH - 30, 3, '#2F5D4E')
      rr(g, 24, y + rowH - 16, 22, 4, 2, '#FFFFFF')
    } else {
      rr(g, 12, y + 6, 46, rowH - 12, 6, '#2B3A5C')
      rr(g, 14, y + 8, 42, 6, 3, col)
    }
    /* the period's slot: a dashed outline */
    g.save()
    g.setLineDash([6, 5])
    g.strokeStyle = kind === 'school' ? '#AFBBD1' : '#5C6FA8'
    g.lineWidth = 2.5
    g.beginPath()
    g.roundRect(w - 76, y + 4, 62, rowH - 8, 7)
    g.stroke()
    g.restore()
    /* the arrow between them (the assignment) */
    g.fillStyle = kind === 'school' ? '#C9D3E6' : '#3A4A70'
    g.beginPath()
    g.moveTo(68, y + rowH / 2 - 7)
    g.lineTo(w - 86, y + rowH / 2 - 7)
    g.lineTo(w - 86, y + rowH / 2 - 13)
    g.lineTo(w - 80, y + rowH / 2)
    g.lineTo(w - 86, y + rowH / 2 + 13)
    g.lineTo(w - 86, y + rowH / 2 + 7)
    g.lineTo(68, y + rowH / 2 + 7)
    g.closePath()
    g.fill()
  }
}
/** a teacher's card: the teacher's colour, a head-and-shoulders glyph */
const teacherCardTex = (color: string) =>
  canvasTex(64, 52, (g) => {
    rr(g, 1, 1, 62, 50, 8, color)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(32, 20, 9, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(32, 44, 16, 11, 0, Math.PI, 0)
    g.fill()
  })
/** a pod's card on the schedule screen: the pod's colour, the pod glyph (a cube) */
const podCardTex = (color: string) =>
  canvasTex(64, 52, (g) => {
    rr(g, 1, 1, 62, 50, 8, color)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.moveTo(32, 10)
    g.lineTo(46, 17)
    g.lineTo(46, 34)
    g.lineTo(32, 42)
    g.lineTo(18, 34)
    g.lineTo(18, 17)
    g.closePath()
    g.fill()
    g.strokeStyle = color
    g.lineWidth = 2.5
    g.beginPath()
    g.moveTo(18, 17)
    g.lineTo(32, 25)
    g.lineTo(46, 17)
    g.moveTo(32, 25)
    g.lineTo(32, 42)
    g.stroke()
  })
/** a blackboard's chalk drawings, one more each stage (geometry in room 1, the sun and a plant in room 2): no words */
function drawChalk(g: CanvasRenderingContext2D, w: number, h: number, n: number, room: 1 | 2, fade: number) {
  rr(g, 0, 0, w, h, 6, '#2F5D4E')
  g.strokeStyle = `rgba(255,255,255,${0.92 * (1 - fade)})`
  g.fillStyle = `rgba(255,255,255,${0.92 * (1 - fade)})`
  g.lineWidth = 4
  g.lineCap = 'round'
  g.lineJoin = 'round'
  const cx = (i: number) => 22 + i * ((w - 44) / 3)
  for (let i = 0; i < n; i++) {
    const x = cx(i)
    const y = h / 2
    g.beginPath()
    if (room === 1) {
      if (i === 0) g.arc(x, y, 15, 0, TAU)
      else if (i === 1) {
        g.moveTo(x - 16, y + 14)
        g.lineTo(x, y - 15)
        g.lineTo(x + 16, y + 14)
        g.closePath()
      } else if (i === 2) g.rect(x - 14, y - 14, 28, 28)
      else {
        g.moveTo(x - 16, y)
        g.lineTo(x + 16, y)
        g.moveTo(x, y - 16)
        g.lineTo(x, y + 16)
        g.moveTo(x - 11, y - 11)
        g.lineTo(x + 11, y + 11)
      }
    } else {
      if (i === 0) {
        g.arc(x, y, 9, 0, TAU)
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU
          g.moveTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13)
          g.lineTo(x + Math.cos(a) * 19, y + Math.sin(a) * 19)
        }
      } else if (i === 1) {
        g.moveTo(x - 18, y + 6)
        g.quadraticCurveTo(x - 9, y - 10, x, y + 6)
        g.quadraticCurveTo(x + 9, y + 20, x + 18, y + 6)
      } else if (i === 2) {
        g.moveTo(x, y + 18)
        g.lineTo(x, y - 6)
        g.moveTo(x, y + 2)
        g.quadraticCurveTo(x - 14, y - 4, x - 12, y - 14)
        g.moveTo(x, y - 2)
        g.quadraticCurveTo(x + 14, y - 8, x + 12, y - 18)
      } else {
        g.moveTo(x - 16, y + 14)
        g.lineTo(x - 16, y - 2)
        g.lineTo(x, y - 16)
        g.lineTo(x + 16, y - 2)
        g.lineTo(x + 16, y + 14)
        g.closePath()
      }
    }
    g.stroke()
  }
}
/** a node's screen: one more bar each stage (the pod's work), a green tick when it is done */
function drawNodeScreen(g: CanvasRenderingContext2D, w: number, h: number, n: number, color: string, fade: number) {
  rr(g, 0, 0, w, h, 6, '#13203F')
  g.globalAlpha = 1 - fade
  const bh = [0.45, 0.7, 0.55, 0.85]
  for (let i = 0; i < n; i++) {
    const bw = (w - 50) / 4
    const x = 18 + i * (bw + 5)
    const hh = (h - 30) * bh[i]
    rr(g, x, h - 15 - hh, bw, hh, 4, i % 2 ? color : '#6FA0FF')
  }
  g.globalAlpha = 1
}

/* the school's people: role clothing */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
    <rect x={222} y={250} width={18} height={4} rx={2} fill="#F2C14E" />
  </g>
)
const STAFF_ID = (strap: string) => (
  <g data-part="staff-id">
    <path d="M 186 206 L 196 282 M 214 206 L 204 282" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={186} y={280} width={28} height={34} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={293} r={5} fill={strap} opacity={0.65} />
  </g>
)
/** a pupil's school tie */
/** a pupil seen from BEHIND (the rig has no back view): the back of the head in the pupil's own hair over the face,
    the hair falling to the nape, and the shirt's back (a collar band and a yoke seam) in place of its front */
const FROM_BEHIND = (k: Skin): Skin => {
  const p = k.palette
  return {
    ...k,
    faceExtras: undefined,
    hairFront: (
      <>
        <path d={k.head} fill={p.skin} />
        <path d="M-53 12 C-54 30 -40 44 -20 49 C-7 52 7 52 20 49 C40 44 54 30 53 12 C40 20 22 24 0 24 C-22 24 -40 20 -53 12 Z" fill={p.hair} />
        <path d="M-53 14 C-62 -19 -53 -58 -25 -72 C-9 -79 11 -79 27 -72 C55 -58 62 -19 53 14 C40 22 22 26 0 26 C-22 26 -40 22 -53 14 Z" fill={p.hair} />
        {k.hairBack}
        <path d="M-30 30 C-18 37 18 37 30 30" fill="none" stroke={p.hairShade} strokeWidth={2.4} strokeLinecap="round" opacity={0.35} />
      </>
    ),
    top: (
      <g data-part="shirt-back">
        <path d="M 176 200 C 186 210 214 210 224 200 L 226 208 C 214 219 186 219 174 208 Z" fill={p.topLight} />
        <path d="M 160 236 C 182 242 218 242 240 236" fill="none" stroke={p.topShade} strokeWidth={1.6} opacity={0.7} />
        <path d="M 200 242 L 200 352" stroke={p.topShade} strokeWidth={1.2} opacity={0.45} />
      </g>
    ),
  }
}
const SCHOOL_TIE = (
  <g data-part="school-tie">
    <path d="M 194 208 L 206 208 L 203 220 L 209 268 L 200 280 L 191 268 L 197 220 Z" fill="#1F2E63" />
    <path d="M 193 236 L 207 228 M 192 252 L 208 244" stroke="#F2C14E" strokeWidth={3} />
  </g>
)

/** the rooms: back wall, partitions with a doorway, outer walls, floors, a ceiling with lights */
function rooms03(scene: THREE.Scene, o: { wallRoom: string; wallOffice: string; floorRoom: THREE.Material; floorOffice: THREE.Material; trim: string; ceil: string; glass: string }) {
  const wallM = (c: string) => mat(c, { roughness: 0.85 })
  /* floors: the rooms' floors run out to the front (the cut-away) */
  const FRONT_Z = 3.2
  scene.add(floorPlane(OUTER - PART + 0.05, FRONT_Z - BACK, o.floorRoom, [-(PART + OUTER) / 2, 0.001, (BACK + FRONT_Z) / 2]))
  scene.add(floorPlane(OUTER - PART + 0.05, FRONT_Z - BACK, o.floorRoom, [(PART + OUTER) / 2, 0.001, (BACK + FRONT_Z) / 2]))
  scene.add(floorPlane(2 * PART, FRONT_Z - BACK, o.floorOffice, [0, 0.002, (BACK + FRONT_Z) / 2]))
  /* the rooms' boundaries on the floor, where the partitions would run on */
  for (const sx of [-1, 1]) scene.add(flat(box(0.06, 0.008, FRONT_Z - PART_FRONT, mat(o.trim, { roughness: 0.6 }), [sx * PART, 0.004, (PART_FRONT + FRONT_Z) / 2])))
  scene.add(floorPlane(30, 12, mat('#E8EDF5', { roughness: 0.95 }), [0, -0.004, 4]))
  /* back walls */
  scene.add(box(OUTER - PART, WALLH, 0.1, wallM(o.wallRoom), [-(PART + OUTER) / 2, WALLH / 2, BACK - 0.05]))
  scene.add(box(OUTER - PART, WALLH, 0.1, wallM(o.wallRoom), [(PART + OUTER) / 2, WALLH / 2, BACK - 0.05]))
  scene.add(box(2 * PART, WALLH, 0.1, wallM(o.wallOffice), [0, WALLH / 2, BACK - 0.05]))
  /* skirting */
  scene.add(flat(box(2 * OUTER, 0.12, 0.02, mat(o.trim, { roughness: 0.6 }), [0, 0.06, BACK + 0.01])))
  /* partitions: from the back wall to just short of the walk line (the rooms open onto it) */
  for (const sx of [-1, 1]) {
    const len = PART_FRONT - BACK
    scene.add(box(0.1, WALLH, len, wallM(o.wallRoom), [sx * PART, WALLH / 2, BACK + len / 2]))
    scene.add(flat(box(0.13, WALLH, 0.04, mat(o.trim, { roughness: 0.5 }), [sx * PART, WALLH / 2, PART_FRONT])))
    /* outer walls */
    scene.add(box(0.1, WALLH, 1.6, wallM(o.wallRoom), [sx * OUTER, WALLH / 2, BACK + 0.8]))
  }
  /* high windows on the back wall, one pair a room and one in the office */
  const glassM = mat(o.glass, { roughness: 0.15, metalness: 0.2, emissive: new THREE.Color(o.glass), emissiveIntensity: 0.25 })
  const frameM = mat(o.trim, { roughness: 0.5 })
  const wins: [number, number][] = [
    [-(PART + OUTER) / 2 - 0.45, 0.62],
    [-(PART + OUTER) / 2 + 0.45, 0.62],
    [0, 0.7],
    [(PART + OUTER) / 2 - 0.45, 0.62],
    [(PART + OUTER) / 2 + 0.45, 0.62],
  ]
  for (const [x, w] of wins) {
    scene.add(flat(box(w + 0.08, 0.5, 0.03, frameM, [x, 2.86, BACK + 0.015])))
    scene.add(flat(box(w, 0.42, 0.02, glassM, [x, 2.86, BACK + 0.03])))
    scene.add(flat(box(0.03, 0.42, 0.025, frameM, [x, 2.86, BACK + 0.04])))
  }
  /* the walls' top edge */
  scene.add(flat(box(2 * OUTER + 0.1, 0.06, 0.14, mat(o.ceil, { roughness: 0.7 }), [0, WALLH + 0.03, BACK - 0.03])))
}

/* the camera: in front of the building, a little above head height, the three rooms in view */
function frameCam03(camera: THREE.PerspectiveCamera) {
  setCam(camera, [0, 4.4, 8.6], [0, 0.92, -0.4], 31.5)
}

/* ------------------------------------------------------------------ T03 everyday: the school */

function setupT03Everyday(kit: StageKit): Update {
  freshGeos()
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF0F8')
  frameCam03(camera)
  lights(scene, [0, 1, -0.4], 6, 1.6)
  rooms03(scene, {
    wallRoom: '#FBF5E6',
    wallOffice: '#E9F0FB',
    floorRoom: new THREE.MeshStandardMaterial({ map: plankTex('#D9B98C', '#C29E6E', [4, 5]), roughness: 0.7 }),
    floorOffice: new THREE.MeshStandardMaterial({ map: tileTex('#C9D3E6', '#B7C3D6', 2, [6, 4]), roughness: 0.9 }),
    trim: '#B98A5C',
    ceil: '#F4F1EA',
    glass: '#BFD9F2',
  })
  /* each room's colour band along the top of its back wall (the timetable's row colour) */
  scene.add(flat(box(OUTER - PART - 0.1, 0.16, 0.02, mat(C.brand, { roughness: 0.5 }), [-(PART + OUTER) / 2, 2.42, BACK + 0.01])))
  scene.add(flat(box(OUTER - PART - 0.1, 0.16, 0.02, mat(C.gold, { roughness: 0.5 }), [(PART + OUTER) / 2, 2.42, BACK + 0.01])))

  /* the timetable on the office wall */
  const ttTex = canvasTex(240, 260, (g) => drawTimetable(g, 240, 260, 'school'))
  const ttW = BOARD.x1 - BOARD.x0
  const ttH = BOARD.y1 - BOARD.y0
  scene.add(box(ttW + 0.06, ttH + 0.06, 0.03, mat('#B98A5C', { roughness: 0.5 }), [(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BACK + 0.015]))
  scene.add(picture(ttTex, ttW, ttH, [(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BACK + 0.035]))
  /* the principal's desk, a tray of cards on it, a plant */
  const wood = mat('#8C6440', { roughness: 0.55 })
  scene.add(box(DESK.w, 0.06, DESK.d, wood, [DESK.x, DESK.h - 0.03, DESK.z], 0.02))
  scene.add(box(DESK.w - 0.06, DESK.h - 0.08, 0.04, mat('#7A5634', { roughness: 0.6 }), [DESK.x, (DESK.h - 0.06) / 2, DESK.z + DESK.d / 2 - 0.03]))
  for (const sx of [-1, 1]) scene.add(box(0.05, DESK.h - 0.06, DESK.d - 0.04, wood, [DESK.x + sx * (DESK.w / 2 - 0.04), (DESK.h - 0.06) / 2, DESK.z]))
  const TRAY = new THREE.Vector3(DESK.x - 0.2, DESK.h + 0.02, DESK.z + 0.05)
  scene.add(box(0.22, 0.03, 0.17, mat('#2F3A52', { roughness: 0.5 }), [TRAY.x, DESK.h + 0.015, TRAY.z], 0.01))
  scene.add(cyl(0.05, 0.04, 0.09, mat('#E8E2D6', { roughness: 0.5 }), [DESK.x + 0.26, DESK.h + 0.045, DESK.z - 0.05], 14))
  scene.add(sphere(0.08, mat('#5DAE6B', { roughness: 0.7 }), [DESK.x + 0.26, DESK.h + 0.15, DESK.z - 0.05]))
  /* the school bell, on the office wall */
  const bell = new THREE.Group()
  bell.position.copy(BELL)
  dyn(bell)
  /* an electric school bell: a red mount, a brass gong facing the room, the striker below */
  bell.add(box(0.12, 0.12, 0.05, mat('#C8323C', { roughness: 0.45 }), [0, 0, 0.025], 0.02))
  const cup = mesh(new THREE.SphereGeometry(0.15, 24, 12, 0, TAU, 0, Math.PI / 2.2), mat('#E2B33C', { metalness: 0.65, roughness: 0.25, side: THREE.DoubleSide }), [0, 0, 0.06])
  cup.rotation.x = Math.PI / 2
  bell.add(cup)
  bell.add(sphere(0.025, mat('#8C96A8', { metalness: 0.6, roughness: 0.3 }), [0, -0.17, 0.12]))
  scene.add(bell)

  /* the classrooms: blackboards, pupils' desks */
  const boards = ([-1, 1] as const).map((sx) => {
    const room = sx < 0 ? 1 : 2
    const bbW = BB.x1 - BB.x0
    const bbH = BB.y1 - BB.y0
    const cx = sx * (BB.x0 + BB.x1) / 2
    scene.add(box(bbW + 0.08, bbH + 0.08, 0.03, mat('#B98A5C', { roughness: 0.5 }), [cx, (BB.y0 + BB.y1) / 2, BACK + 0.015]))
    scene.add(flat(box(bbW, 0.03, 0.06, mat('#B98A5C'), [cx, BB.y0 - 0.04, BACK + 0.05])))
    const lt = liveTex(200, 136, (g, s) => drawChalk(g, 200, 136, Math.floor(s / 10), room as 1 | 2, (s % 10) / 9))
    scene.add(picture(lt.tex, bbW, bbH, [cx, (BB.y0 + BB.y1) / 2, BACK + 0.033]))
    for (const px of PUPIL_X) {
      const x = sx * px
      /* the desk, turned to face the board: its front panel on the board side */
      scene.add(box(0.44, 0.05, 0.36, wood, [x, 0.62, SDESK_Z], 0.015))
      scene.add(box(0.4, 0.5, 0.03, mat("#7A5634", { roughness: 0.6 }), [x, 0.35, SDESK_Z - 0.16]))
      for (const dx of [-0.18, 0.18]) scene.add(box(0.03, 0.6, 0.3, mat('#8C96A8', { metalness: 0.4, roughness: 0.4 }), [x + dx, 0.3, SDESK_Z]))
      scene.add(flat(box(0.18, 0.012, 0.13, mat('#FFFFFF', { roughness: 0.6 }), [x - 0.06, 0.651, SDESK_Z + 0.04])))
      /* the pupil's chair, in the desk's wood and steel, its back toward the camera */
      const steel = mat('#8C96A8', { metalness: 0.4, roughness: 0.4 })
      scene.add(box(0.36, 0.035, 0.3, wood, [x, SEAT_H - 0.0175, SEAT_Z], 0.01))
      for (const dx of [-0.15, 0.15]) for (const dz of [-0.12, 0.12]) scene.add(box(0.025, SEAT_H - 0.035, 0.025, steel, [x + dx, (SEAT_H - 0.035) / 2, SEAT_Z + dz]))
      for (const dx of [-0.15, 0.15]) scene.add(box(0.025, 0.24, 0.025, steel, [x + dx, SEAT_H + 0.12, SEAT_Z + 0.135]))
      scene.add(box(0.36, 0.17, 0.03, mat("#7A5634", { roughness: 0.6 }), [x, SEAT_H + 0.155, SEAT_Z + 0.15], 0.012))
    }
    return lt
  })

  /* ---- the people ---- */
  const principal = body(
    who(CAST_PRESETS.arjun, { name: 'Principal', skinTone: 'medium', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirtTie', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30', accentColor: '#8C2F39' }, accessories: { glasses: 'rect', watch: true, belt: false, beard: 'none' }, build: { height: 1.0, shoulders: 1.03 } }),
    [PRIN.x, 0, PRIN.z],
    1.72,
  )
  const tA = body(who(CAST_PRESETS.riya, { name: 'Teacher A', skinTone: 'wheatish', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: C.teal as `#${string}`, bottom: 'skirt', bottomColor: '#2C3C81', shoeColor: '#2C3C81' }, accessories: { earrings: true, bindi: true, glasses: 'none' } }), [-WAIT_X, 0, WALKZ], 1.6)
  const tB = body(who(CAST_PRESETS.dev, { name: 'Teacher B', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: C.purple as `#${string}`, bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', beard: 'short', watch: true } }), [WAIT_X, 0, WALKZ], 1.66)
  const pupilCfg = (base: CharacterConfig, name: string, skin: CharacterConfig['skinTone'], hair: CharacterConfig['hair'], girl: boolean) =>
    who(base, { name, skinTone: skin, hair, outfit: { top: 'shirt', topColor: '#F7F8FA', bottom: girl ? 'skirt' : 'shorts', bottomColor: '#1F2E63', shoeColor: '#1E1E24' }, accessories: { glasses: 'none', beard: 'none', watch: false, earrings: false, bindi: false, belt: false } })
  const pupils = [
    body(pupilCfg(CAST_PRESETS.ananya, 'Pupil', 'fair', { style: 'ponytail', color: 'black' }, true), [-PUPIL_X[1], 0, SEAT_Z], 1.16),
    body(pupilCfg(CAST_PRESETS.kabir, 'Pupil', 'medium', { style: 'curly', color: 'black' }, false), [-PUPIL_X[0], 0, SEAT_Z], 1.2),
    body(pupilCfg(CAST_PRESETS.rohan, 'Pupil', 'dusky', { style: 'short', color: 'black' }, false), [PUPIL_X[0], 0, SEAT_Z], 1.18),
    body(pupilCfg(CAST_PRESETS.riya, 'Pupil', 'wheatish', { style: 'braid', color: 'black' }, true), [PUPIL_X[1], 0, SEAT_Z], 1.15),
  ]

  /* the principal: his right hand takes a card from the tray and pins it; at the end both come down */
  const trayP = TRAY.clone().add(new THREE.Vector3(0, 0.06, 0))
  const slotP = (r: number) => new THREE.Vector3(SLOT_X, ROW_Y[r], BACK + 0.06)
  const toTray = reach(principal, 'L', trayP, camera)
  const toSlot = (r: number) => reach(principal, 'L', slotP(r), camera)
  const P_REST: Arm = { s: 8, e: 14 }
  type Span = [number, number, number, number, Arm]
  const armFrom = (c: number, base: Arm, spans: Span[]) => spans.reduce((a, [t0, t1, t2, t3, f]) => mixArm(a, f, hold(c, t0, t1, t2, t3)), base)
  const prinL = (c: number) =>
    armFrom(c, P_REST, [
      [T03.pinA.tray[0], T03.pinA.tray[1], T03.pinA.up[0], T03.pinA.up[0] + 0.02, toTray],
      [T03.pinA.up[0], T03.pinA.up[1], T03.pinB.tray[0] - 0.05, T03.pinB.tray[0], toSlot(0)],
      [T03.pinB.tray[0], T03.pinB.tray[1], T03.pinB.up[0], T03.pinB.up[0] + 0.02, toTray],
      [T03.pinB.up[0], T03.pinB.up[1], T03.pinB.up[1] + 0.25, T03.pinB.up[1] + 0.55, toSlot(1)],
      [T03.unpin.up[0], T03.unpin.up[1], T03.unpin.tray[0], T03.unpin.tray[0] + 0.02, toSlot(1)],
      [T03.unpin.tray[0], T03.unpin.tray[1], T03.unpin.tray[1] + 0.1, T03.unpin.tray[1] + 0.35, toTray],
    ])
  /* his right hand: an open hand toward each teacher as she / he sets off ("your class") */
  const prinR = (c: number): Arm => {
    const wA = hold(c, T03.walkA[0] - 0.3, T03.walkA[0], T03.walkA[0] + 0.5, T03.walkA[0] + 0.8)
    const wB = hold(c, T03.walkB[0] - 0.3, T03.walkB[0], T03.walkB[0] + 0.5, T03.walkB[0] + 0.8)
    return mixArm(mixArm(P_REST, { s: 48, e: 40 }, wB), { s: 30, e: 70 }, wA)
  }
  const prinPose = (p: Pose, c: number) => {
    setArms(p, prinL(c), prinR(c))
    p.palmR = 1
    /* he looks at the board when he pins, at each teacher as they set off, at the rooms while they teach */
    const atBoard = Math.max(hold(c, T03.pinA.up[0] - 0.1, T03.pinA.up[0] + 0.1, T03.pinB.up[1], T03.pinB.up[1] + 0.2), hold(c, T03.unpin.up[0] - 0.1, T03.unpin.up[0] + 0.1, T03.unpin.tray[0], T03.unpin.tray[0] + 0.2))
    to(p, 'headTurn', -0.4, atBoard)
    to(p, 'lookX', -0.9, atBoard)
    to(p, 'headNod', -0.2, atBoard)
    to(p, 'lookY', -0.6, atBoard)
    const atA = hold(c, T03.walkA[0] - 0.1, T03.walkA[0] + 0.1, T03.walkA[1] - 0.4, T03.walkA[1])
    to(p, 'headTurn', -0.45, atA)
    to(p, 'lookX', -0.9, atA)
    const atB = hold(c, T03.walkB[0] - 0.1, T03.walkB[0] + 0.1, T03.walkB[1] - 0.4, T03.walkB[1])
    to(p, 'headTurn', 0.45, atB)
    to(p, 'lookX', 0.9, atB)
    const atTray = Math.max(hold(c, T03.pinA.tray[0], T03.pinA.tray[1], T03.pinA.up[0], T03.pinA.up[0] + 0.1), hold(c, T03.pinB.tray[0], T03.pinB.tray[1], T03.pinB.up[0], T03.pinB.up[0] + 0.1))
    to(p, 'headNod', 0.3, atTray)
    to(p, 'lookY', 0.7, atTray)
  }
  /* a teacher: walks in, points at the board (the outer arm) while teaching, looks at the pupils */
  const pointAt = [tA, tB].map((t, i) => {
    const sx = i === 0 ? -1 : 1
    const at = body(t.cfg, [sx * TEACH_X, 0, WALKZ], t.h)
    return reach(at, sx < 0 ? 'L' : 'R', new THREE.Vector3(sx * (BB.x0 + 0.1), 1.66, BACK), camera)
  })
  const teacherPose = (side: -1 | 1) => {
    const at = teachAt(side)
    const draws = side < 0 ? T03.drawA : T03.drawB
    const w = side < 0 ? T03.walkA : T03.walkB
    const b = side < 0 ? T03.backA : T03.backB
    return (p: Pose, c: number) => {
      const a = at(c)
      const teach = hold(c, w[1] - 0.05, w[1] + 0.25, b[0] - 0.35, b[0] - 0.05)
      /* the arm on the board's side points at it; each new drawing, a little tap */
      const tap = draws.reduce((s, d) => s + hold(c, d - 0.25, d - 0.1, d + 0.05, d + 0.25), 0)
      const point: Arm = { s: pointAt[side < 0 ? 0 : 1].s - 6 * tap, e: pointAt[side < 0 ? 0 : 1].e + 8 * tap }
      const outer = mixArm({ s: 5 + swing(c, a.walking), e: 8 }, point, teach)
      const inner = mixArm({ s: 5 - swing(c, a.walking), e: 8 }, { s: 22, e: 70 }, teach)
      if (side < 0) setArms(p, outer, inner)
      else setArms(p, inner, outer)
      if (side < 0) p.palmL = teach
      else p.palmR = teach
      walkLegs(p, c, a.walking, a.dir)
      /* teaching: looking toward the pupils (away from the board), now and then at the board */
      const atBoard = draws.reduce((s, d) => s + hold(c, d - 0.35, d - 0.15, d + 0.1, d + 0.3), 0)
      to(p, 'headTurn', side * 0.42, teach * (1 - atBoard))
      to(p, 'lookX', side * 0.85, teach * (1 - atBoard))
      to(p, 'headTurn', -side * 0.0, teach * atBoard)
      to(p, 'headNod', -0.18, teach * atBoard)
      to(p, 'lookY', -0.6, teach * atBoard)
      /* in the office, waiting: eyes on the principal */
      const wait = 1 - seg(c, w[0] - 0.2, w[0]) + seg(c, b[1] - 0.2, b[1])
      to(p, 'headTurn', -side * 0.35, clamp01(wait))
      to(p, 'lookX', -side * 0.8, clamp01(wait))
      to(p, 'lookY', -0.25, clamp01(wait))
    }
  }
  /* pupils: look toward their teacher (inward), follow the board at each drawing, one raises a hand */
  const pupilPose = (side: -1 | 1, k: number) => (p: Pose, c: number) => {
    const w = side < 0 ? T03.walkA : T03.walkB
    const b = side < 0 ? T03.backA : T03.backB
    const draws = side < 0 ? T03.drawA : T03.drawB
    /* seen from behind: the head tips a little toward the teacher, rises to the board, dips to write each drawing down */
    const there = hold(c, w[1] - 0.6, w[1], b[0], b[0] + 0.4)
    to(p, 'headTilt', -side * 5, there)
    to(p, 'headNod', -0.12, there)
    const nod = draws.reduce((s, d) => s + hold(c, d + 0.15 + k * 0.1, d + 0.3 + k * 0.1, d + 0.45 + k * 0.1, d + 0.6 + k * 0.1), 0)
    to(p, 'headNod', 0.3, nod)
    const hk = side < 0 ? T03.handA : T03.handB
    const raise = (side < 0 && k === 0) || (side > 0 && k === 1) ? hold(c, hk[0], hk[1], hk[2], hk[3]) : 0
    const upArm: Arm = { s: 158, e: 8 }
    /* from behind, the arms reach forward to the desk: only the upper arms show beside the back */
    const deskArm: Arm = { s: 13, e: 24 }
    if (side > 0) setArms(p, deskArm, mixArm(deskArm, upArm, raise))
    else setArms(p, mixArm(deskArm, upArm, raise), deskArm)
    if (raise > 0) {
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = lerp(p.fR1, 0, raise)
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = lerp(p.fL1, 0, raise)
      p.palmL = p.palmR = raise
    }
  }

  const HB = devHold(HOLD03)
  const pp = (b: Body, seed: number, faces: [number, string][], pose: (p: Pose, c: number) => void, dress?: (s: Skin) => Skin) =>
    person({ config: b.cfg, dress, seed, faces, pose, loop: L03, height: b.h, frames: F03, redraw, holdT: HB })
  const people = [
    pp(principal, 301, [[0, 'thinking'], [1.1, 'happy'], [3.4, 'listening'], [6.9, 'proud'], [7.9, 'thinking']], prinPose, withTop(BLAZER('#1F2E63', '#141B2E'))),
    pp(tA, 302, [[0, 'listening'], [1.2, 'happy'], [3.0, 'excited'], [4.3, 'happy'], [5.3, 'listening'], [6.0, 'happy']], teacherPose(-1), withTop(STAFF_ID('#0E8C7F'))),
    pp(tB, 303, [[0, 'listening'], [1.9, 'happy'], [3.7, 'excited'], [5.0, 'happy'], [6.5, 'proud'], [7.4, 'happy']], teacherPose(1), withTop(STAFF_ID('#6A3FD6'))),
    pp(pupils[0], 304, [[0, 'neutral']], pupilPose(-1, 0), FROM_BEHIND),
    pp(pupils[1], 305, [[0, 'neutral']], pupilPose(-1, 1), FROM_BEHIND),
    pp(pupils[2], 306, [[0, 'neutral']], pupilPose(1, 0), FROM_BEHIND),
    pp(pupils[3], 307, [[0, 'neutral']], pupilPose(1, 1), FROM_BEHIND),
  ]
  const bodies = [principal, tA, tB, ...pupils]
  people.forEach((s, k) => {
    s.object.position.copy(bodies[k].root)
    scene.add(s.object)
  })
  /* the seated pupils: lowered onto their chairs, the picture stopped just under the hips (inside the seat), so no
     legs show under a chair */
  people.slice(3).forEach((s, k) => {
    s.object.position.y = -SEAT_SINK
    const plane = s.object.children[0] as THREE.Mesh
    const g = plane.geometry
    const H = pupils[k].h / 0.93
    const yc = ((600 - CROP_Y) / 600) * H
    const pos = g.attributes.position as THREE.BufferAttribute
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 1e-6) {
      pos.setY(i, yc)
      uv.setY(i, yc / H)
    }
    pos.needsUpdate = true
    uv.needsUpdate = true
    g.computeBoundingSphere()
  })
  const clk = slideClock('T03', scene, HB, people)

  /* the two cards: in the tray, in his hand, on the board */
  const cards = [C.teal, C.purple].map((col) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.138), basic(teacherCardTex(col)))
    m.renderOrder = 3
    scene.add(dyn(m))
    return m
  })
  people.forEach((p) => dyn(p.object))
  mergeStatic(scene)
  freshGeos()
  const hand = new THREE.Vector3()
  const aAt = teachAt(-1)
  const bAt = teachAt(1)
  return (t: number) => {
    const c = mod(clk.time(t), L03)
    const cq = frameT(c, L03, F03)
    const a = aAt(c)
    tA.root.set(a.x, bob(a.walking, c), WALKZ)
    people[1].object.position.copy(tA.root)
    const b = bAt(c)
    tB.root.set(b.x, bob(b.walking, c), WALKZ)
    people[2].object.position.copy(tB.root)
    people.forEach((s) => s.update(c, camera))
    /* the principal's hand, as drawn on the frame on screen */
    rigToWorld(handPt('L', principal.sh, prinL(cq)), principal.h, principal.root, camera, hand)
    towardCamera(hand, camera, 0.05)
    cards.forEach((m, r) => {
      const pin = r === 0 ? T03.pinA : T03.pinB
      const inHand = (cq >= pin.tray[1] && cq < pin.up[1]) || (cq >= T03.unpin.up[1] && cq < T03.unpin.tray[1])
      const onBoard = cq >= pin.up[1] && cq < T03.unpin.up[1]
      if (inHand) {
        m.position.copy(hand).add(new THREE.Vector3(r * 0.02, -r * 0.03, 0.01 * r))
        m.quaternion.copy(camera.quaternion)
      } else if (onBoard) {
        m.position.set(SLOT_X, ROW_Y[r] - 0.02, BACK + 0.045)
        m.quaternion.identity()
      } else {
        m.position.set(TRAY.x + r * 0.015, TRAY.y + 0.02 + r * 0.006, TRAY.z + r * 0.01)
        m.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.25, 0, 0))
      }
    })
    /* the bell rings */
    const ring = hold(c, T03.bell[0], T03.bell[0] + 0.05, T03.bell[1] - 0.05, T03.bell[1])
    bell.rotation.z = ring * 0.25 * Math.sin(c * TAU * 9)
    /* chalk drawings */
    boards[0].paint(drawn(c, T03.drawA) * 10 + Math.round(eraseK(c) * 9))
    boards[1].paint(drawn(c, T03.drawB) * 10 + Math.round(eraseK(c) * 9))
  }
}

/* ------------------------------------------------------------------ T03 concept: the cluster */

function setupT03Concept(kit: StageKit): Update {
  freshGeos()
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#ECF1FA')
  frameCam03(camera)
  lights(scene, [0, 1, -0.4], 6, 1.6)
  rooms03(scene, {
    wallRoom: '#EEF2FA',
    wallOffice: '#E3EAF8',
    floorRoom: new THREE.MeshStandardMaterial({ map: tileTex('#F4F7FD', '#DCE4F3', 3, [5, 3]), roughness: 0.6 }),
    floorOffice: new THREE.MeshStandardMaterial({ map: tileTex('#DCE5F7', '#C9D3E6', 3, [5, 3]), roughness: 0.6 }),
    trim: '#9BB0D6',
    ceil: '#F1F4FA',
    glass: '#BFD3FF',
  })
  /* each node's mark on its back wall (where the classroom's colour band runs), the band in the row colour */
  scene.add(flat(box(OUTER - PART - 0.1, 0.06, 0.02, mat(C.brand, { roughness: 0.5 }), [-(PART + OUTER) / 2, 2.42, BACK + 0.01])))
  scene.add(flat(box(OUTER - PART - 0.1, 0.06, 0.02, mat(C.gold, { roughness: 0.5 }), [(PART + OUTER) / 2, 2.42, BACK + 0.01])))
  const nodeM = markTex(nodeUrl, redraw)
  for (const sx of [-1, 1]) scene.add(picture(nodeM, 0.34, 0.34, [sx * ((BB.x0 + BB.x1) / 2), 2.42, BACK + 0.03], { transparent: false }))

  /* the schedule screen in the timetable's place */
  const ttW = BOARD.x1 - BOARD.x0
  const ttH = BOARD.y1 - BOARD.y0
  scene.add(box(ttW + 0.06, ttH + 0.06, 0.04, mat('#2F3A52', { roughness: 0.35, metalness: 0.3 }), [(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BACK + 0.02]))
  scene.add(picture(canvasTex(240, 260, (g) => drawTimetable(g, 240, 260, 'cluster')), ttW, ttH, [(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BACK + 0.043]))
  /* the console in the desk's place, the pod tray (the queue of new pods) on it */
  scene.add(box(DESK.w, DESK.h, DESK.d, mat('#F4F6FA', { roughness: 0.4 }), [DESK.x, DESK.h / 2, DESK.z], 0.04))
  scene.add(flat(box(DESK.w - 0.1, 0.03, 0.02, glowM(C.brand, '#9BB6FF', { emissiveIntensity: 0.9 }), [DESK.x, DESK.h - 0.12, DESK.z + DESK.d / 2 + 0.002])))
  const TRAY = new THREE.Vector3(DESK.x - 0.2, DESK.h + 0.02, DESK.z + 0.05)
  scene.add(box(0.22, 0.03, 0.17, mat('#2F3A52', { roughness: 0.5 }), [TRAY.x, DESK.h + 0.015, TRAY.z], 0.01))
  /* the control plane in the principal's place: a tall cabinet with its mark at head height */
  const cp = new THREE.Group()
  cp.position.copy(PRIN)
  cp.add(box(0.56, 1.7, 0.4, mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F4F7FF'), emissiveIntensity: 0.2 }), [0, 0.85, 0], 0.05))
  const cpLed = glowM(C.brand, '#9BB6FF')
  for (let i = 0; i < 4; i++) cp.add(flat(box(0.4, 0.035, 0.02, cpLed, [0, 0.95 - i * 0.14, 0.201])))
  scene.add(cp)
  scene.add(picture(markTex(cpUrl, redraw), 0.36, 0.36, [PRIN.x, 1.42, PRIN.z + 0.215], { transparent: false }))
  /* the status lamp in the bell's place */
  const lampM = glowM(C.green, '#BFF5D2')
  scene.add(box(0.22, 0.22, 0.06, mat('#2F3A52', { roughness: 0.4 }), [BELL.x, BELL.y, BACK + 0.03], 0.04))
  scene.add(flat(sphere(0.07, lampM, [BELL.x, BELL.y, BACK + 0.07])))

  /* the nodes: a screen in the blackboard's place, two server units in the pupils' places */
  const screens = ([-1, 1] as const).map((sx) => {
    const bbW = BB.x1 - BB.x0
    const bbH = BB.y1 - BB.y0
    const cx = (sx * (BB.x0 + BB.x1)) / 2
    scene.add(box(bbW + 0.08, bbH + 0.08, 0.04, mat('#2F3A52', { roughness: 0.35, metalness: 0.3 }), [cx, (BB.y0 + BB.y1) / 2, BACK + 0.02]))
    const lt = liveTex(200, 136, (g, s) => drawNodeScreen(g, 200, 136, Math.floor(s / 10), sx < 0 ? C.teal : C.purple, (s % 10) / 9))
    scene.add(picture(lt.tex, bbW, bbH, [cx, (BB.y0 + BB.y1) / 2, BACK + 0.043]))
    return lt
  })
  const unitLeds: THREE.MeshStandardMaterial[] = []
  for (const sx of [-1, 1])
    PUPIL_X.forEach((px) => {
      const x = sx * px
      const u = new THREE.Group()
      u.position.set(x, 0, PUPIL_Z + 0.08)
      u.add(box(0.5, 0.98, 0.42, mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F4F7FF'), emissiveIntensity: 0.2 }), [0, 0.49, 0], 0.04))
      for (let i = 0; i < 4; i++) {
        u.add(flat(box(0.4, 0.13, 0.02, mat('#DCE5F7', { roughness: 0.5 }), [0, 0.82 - i * 0.18, 0.211], 0.01)))
        const led = glowM(C.green, '#BFF5D2')
        unitLeds.push(led)
        u.add(flat(sphere(0.022, led, [0.15, 0.82 - i * 0.18, 0.225])))
      }
      scene.add(u)
    })

  /* the pods in the teachers' places: glossy cubes in the teacher's colour, the pod glyph on the front */
  const podM = markTex(podUrl, redraw, 256)
  const pods = [C.teal, C.purple].map((col) => {
    const g = new THREE.Group()
    g.add(box(0.44, 0.44, 0.44, mat(col, { roughness: 0.25, metalness: 0.1 }), [0, 0, 0], 0.07))
    g.add(picture(podM, 0.26, 0.26, [0, 0, 0.225], { transparent: false }))
    scene.add(dyn(g))
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: '#1F2E63', transparent: true, opacity: 0.16, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    scene.add(dyn(sh))
    return { g, sh }
  })
  /* the pod tiles that go on the schedule (the cards' places) and the tokens that carry them */
  const tiles = [C.teal, C.purple].map((col) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.138), basic(podCardTex(col)))
    m.renderOrder = 3
    scene.add(dyn(m))
    return m
  })
  const beamM = glowM('#6FA0FF', '#FFFFFF')
  beamM.emissiveIntensity = 1.6
  const beam = flat(sphere(0.04, beamM, [0, 0, 0]))
  scene.add(dyn(beam))
  /* the status reports back (green ticks), in the walking-back teachers' places */
  const ticks = [0, 1].map(() => {
    const b = badge(tickTex(), 0.26)
    scene.add(dyn(b))
    return b
  })
  const doneTick = [0, 1].map(() => {
    const b = badge(tickTex(), 0.3)
    scene.add(dyn(b))
    return b
  })
  const clk = slideClock('T03', scene, devHold(HOLD03), NOBODY())
  mergeStatic(scene)
  freshGeos()

  const aAt = teachAt(-1)
  const bAt = teachAt(1)
  const P = new THREE.Vector3()
  const slotWorld = (r: number) => new THREE.Vector3(SLOT_X, ROW_Y[r] - 0.02, BACK + 0.05)
  return (t: number) => {
    const c = mod(clk.time(t), L03)
    /* the control plane's lights pulse while it schedules */
    const sched = Math.max(hold(c, T03.pinA.tray[0], T03.pinA.tray[1], T03.pinB.up[1], T03.pinB.up[1] + 0.2), hold(c, T03.unpin.up[0], T03.unpin.up[1], T03.unpin.tray[1], T03.unpin.tray[1] + 0.2))
    cpLed.emissiveIntensity = 0.6 + 1.6 * sched * (0.6 + 0.4 * Math.sin(c * TAU * 3))
    /* the tiles: in the tray, carried by the beam to the screen, on it; cleared at the end */
    beam.visible = false
    tiles.forEach((m, r) => {
      const pin = r === 0 ? T03.pinA : T03.pinB
      const onScreen = c >= pin.up[1] && c < T03.unpin.up[1]
      const fly = c >= pin.up[0] && c < pin.up[1]
      const back = c >= T03.unpin.up[1] && c < T03.unpin.tray[1]
      if (fly || back) {
        const k = fly ? seg(c, pin.up[0], pin.up[1]) : 1 - seg(c, T03.unpin.tray[0], T03.unpin.tray[1])
        P.copy(TRAY).add(new THREE.Vector3(0, 0.05, 0)).lerp(slotWorld(r), k)
        P.z += Math.sin(k * Math.PI) * 0.25
        m.position.copy(P)
        m.quaternion.copy(camera.quaternion)
        beam.visible = true
        beam.position.copy(P).add(new THREE.Vector3(0, 0, 0.02))
      } else if (onScreen || (c >= T03.unpin.up[0] && c < T03.unpin.up[1])) {
        m.position.copy(slotWorld(r))
        m.quaternion.identity()
      } else {
        m.position.set(TRAY.x + r * 0.015, TRAY.y + 0.02 + r * 0.006, TRAY.z + r * 0.01)
        m.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.25, 0, 0))
      }
    })
    /* the pods ride to their nodes as the teachers walk; done, they fold away and new ones wait at the start */
    ;[aAt(c), bAt(c)].forEach((a, i) => {
      const side = i === 0 ? -1 : 1
      const back = i === 0 ? T03.backA : T03.backB
      const fold = seg(c, back[0], back[0] + 0.45)
      const grow = seg(c, back[1] - 0.5, back[1])
      const goingBack = c >= back[0]
      const x = goingBack ? side * TEACH_X : a.x
      const s = goingBack ? (c < back[1] - 0.5 ? 1 - fold : grow) : 1
      const xs = goingBack && c >= back[1] - 0.5 ? side * WAIT_X : x
      const hover = 0.95 + 0.04 * Math.sin((c * TAU * 7) / L03 + i * 2)
      pods[i].g.position.set(xs, hover, WALKZ)
      pods[i].g.scale.setScalar(Math.max(0.001, s))
      pods[i].g.visible = s > 0.01
      pods[i].sh.position.set(xs, 0.004, WALKZ)
      pods[i].sh.scale.setScalar(Math.max(0.001, s))
      /* the report back: a green tick rides the walk line from the node to the control plane */
      const tk = ticks[i]
      const r = c >= back[0] && c < back[1] - 0.3
      tk.visible = r
      if (r) {
        const k = seg(c, back[0], back[1] - 0.3)
        tk.position.set(lerp(side * TEACH_X, PRIN.x + side * 0.42, k), 1.05 + Math.sin(k * Math.PI) * 0.15, WALKZ + 0.05)
        tk.quaternion.copy(camera.quaternion)
      }
      /* the work done: a tick over the node's screen at the bell */
      const dt = doneTick[i]
      const dk = hold(c, T03.bell[0], T03.bell[0] + 0.2, back[0] + 0.3, back[0] + 0.5)
      dt.visible = dk > 0.01
      if (dt.visible) {
        dt.position.set(side * BB.x1 - side * 0.12, BB.y1 - 0.1, BACK + 0.12)
        dt.quaternion.copy(camera.quaternion)
        dt.scale.setScalar(dk)
      }
    })
    /* the node screens fill with the work; the server units blink while it runs */
    screens[0].paint(drawn(c, T03.drawA) * 10 + Math.round(eraseK(c) * 9))
    screens[1].paint(drawn(c, T03.drawB) * 10 + Math.round(eraseK(c) * 9))
    unitLeds.forEach((m, i) => {
      const side = i < 8 ? 0 : 1
      const run = side === 0 ? hold(c, T03.walkA[1], T03.walkA[1] + 0.2, T03.backA[0], T03.backA[0] + 0.2) : hold(c, T03.walkB[1], T03.walkB[1] + 0.2, T03.backB[0], T03.backB[0] + 0.2)
      m.emissiveIntensity = 0.5 + run * (Math.sin(c * TAU * 2 + i * 1.7) > 0 ? 2.0 : 0.3)
    })
    /* the status lamp flashes when the work is done (the bell's moment) */
    const ring = hold(c, T03.bell[0], T03.bell[0] + 0.05, T03.bell[1] - 0.05, T03.bell[1])
    lampM.emissiveIntensity = 0.5 + ring * (Math.sin(c * TAU * 6) > 0 ? 2.6 : 0.6)
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
  H_T01Everyday: card('T01', setupT01Everyday, devHold(HOLD01)),
  H_T01Concept: card('T01', setupT01Concept, devHold(HOLD01)),
  H_T03Everyday: card('T03', setupT03Everyday, devHold(HOLD03)),
  H_T03Concept: card('T03', setupT03Concept, devHold(HOLD03)),
}
export const css = ''
