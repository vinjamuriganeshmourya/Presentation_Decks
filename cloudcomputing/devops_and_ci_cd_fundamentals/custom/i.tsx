import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import gitUrl from '../images/tech-git.png'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER I · SESSION 22 (DevOps & CI/CD Fundamentals) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 21's i.tsx / j.tsx are (its helpers are copied below unchanged): a perspective camera on a real
 * place; people are Character Lab characters from the engine's `castSprite` (role clothing by `dress`) at a fixed
 * `px: 256` with no idle breathing, expressions keyed to the action; NO TEXT on either card; one wall-clock loop per
 * slide shared by both cards beat for beat and place for place (custom/clock.tsx, Session 16's, unchanged: the cards
 * fade in once every person has a first frame, a tap pauses both); each loop ends in the state it starts in; held
 * frames (`?still`, thumbnails) draw the telling moment at HOLD. Nobody walks toward or away from the camera.
 *
 * SLIDE 39 · T17-AN (TR 17): "A restaurant checks each dish before serving it to customers, rather than waiting until
 * the end of the day to discover problems: just as CI builds and tests every code change immediately to catch issues
 * early."
 *
 *   place (x)          everyday: a restaurant kitchen pass             concept: a CI check on every commit
 *   -0.85 (behind)     the cook, cap and apron                         the developer
 *   -0.98 / -0.72      two plated dishes on his station                two commits on his desk
 *   -1.6 -> -0.98      a fresh dish slid in from the hot line          a new commit out of his laptop
 *   -0.38              the pass, where he sets each dish               the start of the CI belt
 *    0.00              under the heat lamps: the check spot            under the scanner arch: the check
 *    0.12 (behind)     the head chef, who checks every plate           the CI server, its test rows on its screen
 *    0.62 -> 1.05      the pass's far end, the waiter                  the belt's end, the main repository (Git mark)
 *
 *   0.2 - 1.3    the cook sets dish A on the pass                     the developer puts commit A on the belt
 *   1.1 - 2.0    the head chef draws it under the lamps               it rides into the scanner arch
 *   2.0 - 3.3    he looks it over, nods: a green ring                 the scan, three green rows, a green ring
 *   3.0 - 5.0    he slides it on, the waiter takes it out             it rides on into the repository
 *   3.4 - 5.3    the cook sets dish B, it is drawn under the lamps    commit B goes on the belt, into the arch
 *   5.3 - 7.0    he shakes his head: an orange ring, sent back        a failed row, an orange ring and cross
 *   6.5 - 7.7    it goes back to the cook, onto his station           it rides back to the developer's desk
 *   7.3 - 8.35   the cook slides in a fresh dish (the loop's A)       a new commit comes out of the laptop
 *
 * SLIDE 50 · T21-AN (TR 21): "A software update is prepared and tested before reaching users. In continuous delivery,
 * it waits for a person's approval before going live; in continuous deployment, it goes live automatically after
 * passing all tests."
 *
 *   place              everyday: a young man in his room                concept: the same phone, in a dock on a desk
 *   centre             his phone at his waist: an update ready,          the phone on its dock: the same update, three
 *                      its approve button pulsing                         test rows where the button was
 *   0.3 - 1.3          he reads it, lifts his finger                     the three tests pass one by one
 *   1.3                he taps approve (a ripple)                         the last test passes: no one taps
 *   1.4 - 3.7          the update installs (the bar fills)                the same: it installs on its own
 *   3.8 - 5.3          a green tick; he smiles                            a green tick
 *   5.4 - 6.0          the next update arrives (back to the start)        the same
 *
 * The phone is in front of his body and his forearms and hands are in front of the phone (Session 21 slide 33's
 * lesson): his forearms and hands are drawn a second time in front of it (S21 i.tsx's masked copy of his sprite).
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


/* ================================================================== T17 · the kitchen pass, a CI check on every commit */

const L17 = 8.4
const F17 = 84
/* the head chef shaking his head over dish B, the orange ring round it; the cook worried; the waiter back at his post */
const HOLD17 = 6.15
const CAM17: V3 = [0.06, 2.0, 5.4]
const AT17: V3 = [0.06, 1.08, -0.1]
const FOV17 = 27.5
const PASS = { x0: -1.6, x1: 0.84, zf: 0.24, zb: -0.26, h: 0.92 }
const TOP17 = PASS.h + 0.002
const SLOT1 = -0.95
const SLOT2 = -0.68
const DROP = -0.34
const CHECK = 0.0
const OUT = 0.6
const FROM = -1.4
const COOK = { x: -0.8, z: -0.58, h: 1.62 }
const CHEF = { x: 0.14, z: -0.62, h: 1.7 }
const WAIT = { x: 1.08, z: 0.36, h: 1.7, out: 2.1 }
/* the dish in the waiter's left hand, from his feet (the hand on its right rim) */
const CARRY17: V3 = [-0.31, 1.0, 0.2]
const T17 = {
  aCook: [0.2, 0.55, 1.05, 1.35] as const, // reach slot 1, carry to the pass, hand back
  aPull: [1.1, 1.45, 1.95, 2.25] as const, // the chef draws it under the lamps
  aLook: [1.9, 2.15, 3.0, 3.25] as const,
  aOk: [2.55, 2.75, 3.15, 3.4] as const, // the green ring
  nod: [2.6, 3.1] as const,
  aPush: [3.0, 3.3, 3.7, 4.0] as const, // slides it on to the waiter
  wTake: [3.55, 3.85, 5.0, 5.15] as const, // the waiter's hand on it (lift 3.85 - 4.15)
  wOut: [4.2, 5.0] as const,
  wIn: [5.25, 6.05] as const,
  bCook: [3.4, 3.75, 4.25, 4.55] as const,
  bPull: [4.45, 4.8, 5.25, 5.55] as const,
  bLook: [5.2, 5.45, 6.5, 6.75] as const,
  bNo: [5.85, 6.05, 6.8, 7.05] as const, // the orange ring
  shake: [5.75, 6.5] as const,
  bBack: [6.5, 6.8, 7.2, 7.5] as const, // the chef sends it back
  bCook2: [7.0, 7.3, 7.7, 8.0] as const, // the cook takes it back to his station
  aNew: [7.3, 7.6, 8.05, 8.35] as const, // a fresh dish slid in from the left
}
const P17 = (x: number, y = TOP17, z = 0) => new THREE.Vector3(x, y, z)
const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, lift: number) => {
  const v = a.clone().lerp(b, k)
  v.y += Math.sin(k * Math.PI) * lift
  return v
}
const waitX = (c: number) =>
  along(c, [
    [0, 0, WAIT.x],
    [T17.wOut[0], T17.wOut[1], WAIT.out],
    [T17.wIn[0], T17.wIn[1], WAIT.x],
  ])
const carry17 = (c: number) => new THREE.Vector3(waitX(c).x, 0, WAIT.z).add(v3(CARRY17))
/** dish / commit A (and the loop's next A from 7.6): where it is; `concept` rides on into the repository instead */
function pathA(c: number, concept: boolean): THREE.Vector3 {
  if (c < 0.55) return P17(SLOT1)
  if (c < 1.05) return arc(P17(SLOT1), P17(DROP), seg(c, 0.55, 1.05), 0.22)
  if (c < 1.45) return P17(DROP)
  if (c < 1.95) return P17(DROP).lerp(P17(CHECK), seg(c, 1.45, 1.95))
  if (c < 3.3) return P17(CHECK)
  if (c < 3.7) return P17(CHECK).lerp(P17(OUT), seg(c, 3.3, 3.7))
  if (concept) {
    if (c < 3.85) return P17(OUT)
    if (c < 7.6) return P17(OUT).lerp(P17(1.05), seg(c, 3.85, 4.6))
  } else {
    if (c < 3.85) return P17(OUT)
    if (c < 4.15) return arc(P17(OUT), carry17(c), seg(c, 3.85, 4.15), 0.05)
    if (c < 7.6) return carry17(c)
  }
  if (c < 8.05) return P17(FROM).lerp(P17(SLOT1), seg(c, 7.6, 8.05))
  return P17(SLOT1)
}
const shownA = (c: number, concept: boolean) => (concept ? c < 4.6 : c < 5.05) || c >= 7.6
function pathB(c: number): THREE.Vector3 {
  if (c < 3.75) return P17(SLOT2)
  if (c < 4.25) return arc(P17(SLOT2), P17(DROP), seg(c, 3.75, 4.25), 0.16)
  if (c < 4.8) return P17(DROP)
  if (c < 5.25) return P17(DROP).lerp(P17(CHECK), seg(c, 4.8, 5.25))
  if (c < 6.8) return P17(CHECK)
  if (c < 7.2) return P17(CHECK).lerp(P17(DROP), seg(c, 6.8, 7.2))
  if (c < 7.3) return P17(DROP)
  if (c < 7.7) return arc(P17(DROP), P17(SLOT2), seg(c, 7.3, 7.7), 0.14)
  return P17(SLOT2)
}
/* hands on a dish: on its back rim (from behind the pass), or on its right rim (the waiter, from the right) */
const backRim = (p: THREE.Vector3) => p.clone().add(new THREE.Vector3(0, 0.05, -0.12))
const backLeft = (p: THREE.Vector3) => p.clone().add(new THREE.Vector3(-0.06, 0.05, -0.12))
const rightRim = (p: THREE.Vector3) => p.clone().add(new THREE.Vector3(0.12, 0.025, 0))

/** the cook's (and the developer's) arms: the same at both places, so the two cards move beat for beat */
function cookArms(b: Body, camera: THREE.Camera, concept: boolean) {
  const r = (p: THREE.Vector3) => reach(b, 'R', p, camera)
  const R = (c: number) =>
    armFrom(c, REST, [
      [T17.aCook[0], T17.aCook[1], T17.aCook[2], T17.aCook[3], (k) => r(backRim(pathA(k, concept)))],
      [T17.bCook[0], T17.bCook[1], T17.bCook[2], T17.bCook[3], (k) => r(backRim(pathB(k)))],
      [T17.bCook2[0], T17.bCook2[1], T17.bCook2[2], T17.bCook2[3], (k) => r(backRim(pathB(k)))],
    ])
  /* the fresh one: from the far left before it is in view */
  const L = (c: number) => armFrom(c, REST, [[T17.aNew[0], T17.aNew[1], T17.aNew[2], T17.aNew[3], (k) => reach(b, 'L', backLeft(k < 7.6 ? P17(FROM) : pathA(k, concept)), camera)]])
  const holdR = (c: number) => Math.max(hold(c, 0.5, 0.55, 1.05, 1.1), hold(c, 3.7, 3.75, 4.25, 4.3), hold(c, 7.25, 7.3, 7.7, 7.75))
  const holdL = (c: number) => hold(c, 7.55, 7.6, 8.05, 8.1)
  return { L, R, holdL, holdR }
}
const COOK_FACES: [number, string][] = [[0, 'neutral'], [0.3, 'happy'], [1.5, 'listening'], [3.4, 'happy'], [4.6, 'listening'], [5.9, 'worried'], [7.25, 'thinking'], [8.1, 'neutral']]
function cookPose(arms: ReturnType<typeof cookArms>) {
  return (p: Pose, c: number) => {
    setArms(p, arms.L(c), arms.R(c))
    grip(p, 'R', arms.holdR(c))
    grip(p, 'L', arms.holdL(c))
    /* he watches the pass; down at his station when he picks up or puts down */
    lookAt(p, 0.75, 1)
    const down = Math.max(hold(c, 0.15, 0.4, 0.6, 0.85), hold(c, 3.35, 3.6, 3.8, 4.05), hold(c, 7.4, 7.6, 7.9, 8.15))
    lookAt(p, -0.1, down, 0.7)
    to(p, 'headTilt', -4, hold(c, 6.0, 6.3, 7.0, 7.3))
  }
}

/** a plated dish: a white plate with a rim, a mound of rice, a curry, greens on the side */
function makeDish() {
  const g = new THREE.Group()
  const china = mat('#FBFCFE', { roughness: 0.22, emissive: new THREE.Color('#FBFCFE'), emissiveIntensity: 0.1 })
  g.add(cyl(0.11, 0.075, 0.016, china, [0, 0.008, 0], 40))
  const rim = mesh(new THREE.TorusGeometry(0.108, 0.009, 8, 44), china, [0, 0.018, 0])
  rim.rotation.x = Math.PI / 2
  g.add(rim)
  const rice = mesh(new THREE.SphereGeometry(0.048, 20, 12, 0, TAU, 0, Math.PI / 2), mat('#FBF6E6', { roughness: 0.9 }), [-0.03, 0.016, 0.0])
  rice.scale.set(1, 0.85, 1)
  const curry = mesh(new THREE.SphereGeometry(0.042, 20, 12, 0, TAU, 0, Math.PI / 2), mat('#D9822B', { roughness: 0.5 }), [0.04, 0.014, -0.01])
  curry.scale.set(1.1, 0.5, 1)
  const leaf = (x: number, z: number) => {
    const m = mesh(new THREE.SphereGeometry(0.016, 10, 8), mat('#3E9B4B', { roughness: 0.7 }), [x, 0.028, z])
    m.scale.set(1.3, 0.5, 0.8)
    return m
  }
  g.add(rice, curry, leaf(0.03, 0.035), leaf(0.055, 0.02), leaf(-0.01, 0.045))
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true))
  g.scale.setScalar(1.5)
  return g
}
/** a commit: a glossy blue block with the commit mark (a dot on a line) on its face */
function makeCommit() {
  const s = 0.17
  const g = new THREE.Group()
  g.add(box(s, s, s, mat(C.brand, { roughness: 0.25, metalness: 0.05, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.22 }), [0, s / 2, 0], s * 0.2))
  const face = canvasTex(64, 64, (k) => {
    k.strokeStyle = '#FFFFFF'
    k.lineWidth = 6
    k.lineCap = 'round'
    k.beginPath()
    k.moveTo(6, 32)
    k.lineTo(20, 32)
    k.moveTo(44, 32)
    k.lineTo(58, 32)
    k.stroke()
    k.beginPath()
    k.arc(32, 32, 11, 0, TAU)
    k.stroke()
  })
  const f = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.72, s * 0.72), basic(face))
  f.position.set(0, s / 2, s / 2 + 0.002)
  g.add(f)
  const top = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.72, s * 0.72), basic(face))
  top.rotation.x = -Math.PI / 2
  top.position.set(0, s + 0.002, 0)
  g.add(top)
  return g
}

/* role clothing, rig body frame 400 x 600 */
/** the head chef's tall pleated toque, head-local (skull centre 0,0) */
const TOQUE = (
  <g data-part="toque">
    <path d="M -50 -40 L -51 -72 C -20 -79 20 -79 51 -72 L 50 -40 C 20 -47 -20 -47 -50 -40 Z" fill="#FFFFFF" stroke="#D3DEF0" strokeWidth={3} />
    <path d="M -51 -72 C -80 -90 -76 -142 -42 -140 C -34 -170 34 -170 42 -140 C 76 -142 80 -90 51 -72 C 20 -79 -20 -79 -51 -72 Z" fill="#FFFFFF" stroke="#D3DEF0" strokeWidth={3} />
    <path d="M -22 -78 C -26 -110 -24 -132 -18 -150 M 0 -79 L 0 -158 M 22 -78 C 26 -110 24 -132 18 -150" stroke="#E2EAF6" strokeWidth={3} fill="none" />
  </g>
)
const chefDress = (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{TOQUE}</>, top: <>{k.top}{APRON('#2B3F86', '#1F2E63')}</> })
/** the waiter's black waistcoat and bow tie */
const VEST = (
  <g data-part="vest">
    <path d="M 160 228 L 196 238 L 199 300 L 198 428 L 156 428 C 150 360 150 292 160 228 Z" fill="#232A3A" stroke="#151A25" strokeWidth={2} />
    <path d="M 240 228 L 204 238 L 201 300 L 202 428 L 244 428 C 250 360 250 292 240 228 Z" fill="#232A3A" stroke="#151A25" strokeWidth={2} />
    {[322, 356, 390].map((y) => (
      <circle key={y} cx={207} cy={y} r={4} fill="#C9A94E" />
    ))}
    <path d="M 200 233 L 183 224 L 183 243 Z M 200 233 L 217 224 L 217 243 Z" fill="#232A3A" stroke="#151A25" strokeWidth={1.5} />
    <circle cx={200} cy={233} r={4.5} fill="#151A25" />
  </g>
)
const waiterDress = (k: Skin): Skin => ({ ...k, top: <>{k.top}{VEST}</> })

function room17(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#EEF3FB' : '#F3EEE6')
  scene.add(floorPlane(12, 8, mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [12, 8]) : tileTex('#E2DBCF', '#CFC4B2', 4, [12, 8]), roughness: 0.85 }), [0, 0, 1]))
  const BACK = -1.3
  if (concept) {
    scene.add(flat(box(12, 4.4, 0.05, mat('#E3ECFC', { roughness: 0.95, emissive: new THREE.Color('#E3ECFC'), emissiveIntensity: 0.5 }), [0, 2.2, BACK])))
    scene.add(flat(box(12, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0, 0.05, BACK + 0.04])))
  } else {
    /* white subway tiles to 1.6 m, warm paint above */
    scene.add(flat(box(12, 1.6, 0.05, mat('#ffffff', { map: tileTex('#F7F8F9', '#DCE0E6', 4, [30, 4]), roughness: 0.35, emissive: new THREE.Color('#F2F4F6'), emissiveIntensity: 0.35 }), [0, 0.8, BACK])))
    scene.add(flat(box(12, 2.8, 0.05, mat('#F3E3C8', { roughness: 0.95, emissive: new THREE.Color('#F3E3C8'), emissiveIntensity: 0.45 }), [0, 3.0, BACK])))
  }
}

/** the pass (everyday) or the developer's desk + the CI belt (concept): the same top at the same height */
function passCounter(scene: THREE.Scene, concept: boolean) {
  const steel = mat('#DCE1E8', { roughness: 0.3, metalness: 0.3, emissive: new THREE.Color('#DCE1E8'), emissiveIntensity: 0.15 })
  const steelD = mat(C.steelDark, { roughness: 0.4, metalness: 0.3 })
  const d = PASS.zf - PASS.zb
  const zc = (PASS.zf + PASS.zb) / 2
  if (!concept) {
    const w = PASS.x1 - PASS.x0
    const xc = (PASS.x0 + PASS.x1) / 2
    scene.add(box(w, PASS.h - 0.04, d, mat('#E4E8EE', { roughness: 0.4, metalness: 0.25, emissive: new THREE.Color('#E4E8EE'), emissiveIntensity: 0.15 }), [xc, (PASS.h - 0.04) / 2, zc]))
    scene.add(box(w + 0.02, 0.04, d + 0.04, steel, [xc, PASS.h - 0.02, zc], 0.01))
    scene.add(flat(box(w, 0.08, 0.02, steelD, [xc, 0.04, PASS.zf + 0.01])))
    for (let x = PASS.x0 + 0.6; x < PASS.x1; x += 0.6) scene.add(flat(box(0.008, PASS.h - 0.2, 0.004, steelD, [x, PASS.h / 2, PASS.zf + 0.002])))
    return
  }
  /* the developer's standing desk, to the belt's left */
  const deskX1 = -0.52
  const wood = mat('#E8D2B0', { roughness: 0.6 })
  const dw = deskX1 - PASS.x0
  const dx = (PASS.x0 + deskX1) / 2
  scene.add(box(dw, 0.04, d + 0.04, wood, [dx, PASS.h - 0.02, zc], 0.012))
  scene.add(box(dw - 0.06, 0.5, d - 0.06, mat('#F4F6FA', { roughness: 0.5 }), [dx, PASS.h - 0.3, zc], 0.02))
  for (const x of [PASS.x0 + 0.08, deskX1 - 0.08]) scene.add(box(0.05, PASS.h - 0.55, 0.05, mat('#9AA4B4', { roughness: 0.4, metalness: 0.3 }), [x, (PASS.h - 0.55) / 2, zc]))
  /* the belt: a dark band on a steel frame, rollers along its front, legs */
  const bx0 = -0.5
  const bx1 = 0.9
  const bw = bx1 - bx0
  const bxc = (bx0 + bx1) / 2
  scene.add(box(bw, 0.03, 0.4, mat('#2E3445', { roughness: 0.8 }), [bxc, PASS.h - 0.015, 0], 0.008))
  for (const z of [-0.215, 0.215]) scene.add(box(bw + 0.02, 0.07, 0.03, steel, [bxc, PASS.h - 0.03, z], 0.01))
  for (let x = bx0 + 0.06; x < bx1; x += 0.12) {
    const r = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14), steelD, [x, PASS.h - 0.035, 0.235])
    r.rotation.x = Math.PI / 2
    scene.add(r)
  }
  for (const x of [bx0 + 0.1, bxc, bx1 - 0.1]) for (const z of [-0.17, 0.17]) scene.add(box(0.04, PASS.h - 0.06, 0.04, steelD, [x, (PASS.h - 0.06) / 2, z]))
}

/* ------------------------------------------------------------------ T17 everyday: the kitchen pass */

function setupT17Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, CAM17, AT17, FOV17)
  lights(scene, [0, 1.0, -0.2])
  room17(scene, false)
  passCounter(scene, false)

  /* the hot line behind the cook: a range, a pan with steam; a steel shelf with pots */
  const steel = mat('#DCE1E8', { roughness: 0.3, metalness: 0.3, emissive: new THREE.Color('#DCE1E8'), emissiveIntensity: 0.15 })
  scene.add(box(1.2, 0.86, 0.6, mat('#C7CDD6', { roughness: 0.35, metalness: 0.35 }), [-1.35, 0.43, -0.98], 0.02))
  scene.add(flat(box(1.2, 0.02, 0.6, mat('#2B2F38', { roughness: 0.5 }), [-1.35, 0.87, -0.98])))
  const pan = new THREE.Group()
  pan.add(cyl(0.15, 0.13, 0.06, mat('#3A3F4A', { roughness: 0.35, metalness: 0.5 }), [0, 0.03, 0], 32))
  const handle = box(0.26, 0.022, 0.03, mat('#2B2F38', { roughness: 0.5 }), [-0.26, 0.05, 0])
  pan.add(handle)
  pan.position.set(-1.25, 0.88, -0.98)
  scene.add(pan)
  scene.add(box(2.6, 0.03, 0.26, steel, [-0.2, 1.92, -1.15], 0.008))
  const potM = mat('#D3D9E2', { roughness: 0.25, metalness: 0.35, emissive: new THREE.Color('#D3D9E2'), emissiveIntensity: 0.12 })
  for (const [x, r, h] of [[-1.15, 0.11, 0.16], [-0.8, 0.09, 0.13], [0.55, 0.12, 0.18], [0.9, 0.08, 0.12]] as const) scene.add(cyl(r, r * 0.95, h, potM, [x, 1.935 + h / 2, -1.15], 28))
  const steamT = haloTex('rgba(255,255,255,0.9)')
  const puffs = [0, 1, 2].map((j) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: steamT, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }))
    m.renderOrder = 4
    scene.add(m)
    return { m, ph: j / 3 }
  })

  /* the heat lamps over the check spot: a rail, two shades, warm bulbs, warm light on the pass */
  scene.add(box(1.0, 0.03, 0.05, steel, [CHECK, 2.2, -0.02], 0.01))
  for (const x of [CHECK - 0.24, CHECK + 0.24]) {
    scene.add(cyl(0.006, 0.006, 0.16, steel, [x, 2.11, -0.02], 8))
    const shade = mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.1, 28, 1, true), mat('#C9372C', { roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }), [x, 1.99, -0.02])
    scene.add(shade)
    scene.add(mesh(new THREE.SphereGeometry(0.045, 16, 10), new THREE.MeshBasicMaterial({ color: '#FFB46A', toneMapped: false }), [x, 1.95, -0.02]))
  }
  const warm = new THREE.PointLight('#FF9A4A', 1.6, 1.6, 2)
  warm.position.set(CHECK, 1.7, 0)
  scene.add(warm)
  const pool = picture(haloTex('rgba(255,170,90,0.55)'), 0.7, 0.42, [CHECK, TOP17 + 0.003, 0], { depthWrite: false })
  pool.rotation.x = -Math.PI / 2
  scene.add(pool)

  /* the dishes and the rings */
  const A = makeDish()
  const B = makeDish()
  scene.add(A, B)
  const okRing = flatRing(0.15, 0.185, C.green)
  okRing.position.set(CHECK, TOP17 + 0.004, 0)
  const noRing = flatRing(0.15, 0.185, C.orange)
  noRing.position.set(CHECK, TOP17 + 0.004, 0)
  scene.add(okRing, noRing)

  /* ---- the people ---- */
  const cook = body(who(CAST_PRESETS.kabir, { name: 'Cook', hair: { style: 'short', color: '#262B43' }, outfit: { top: 'tshirt', topColor: '#3E6FD8', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' } }), [COOK.x, 0, COOK.z], COOK.h)
  const chef = body(who(CAST_PRESETS.rohan, { name: 'Head Chef', outfit: { top: 'shirt', topColor: '#F7F8FB', bottom: 'trousers', bottomColor: '#2E3445', shoeColor: '#2A2A30' } }), [CHEF.x, 0, CHEF.z], CHEF.h)
  const wt = body(who(CAST_PRESETS.arjun, { name: 'Waiter', hair: { style: 'sidePart', color: '#2A2324' }, outfit: { top: 'shirt', topColor: '#F7F8FB', bottom: 'trousers', bottomColor: '#232A3A', shoeColor: '#1C1F28' }, accessories: { belt: false } }), [WAIT.x, 0, WAIT.z], WAIT.h)
  const arms = cookArms(cook, camera, false)

  /* the head chef: his left hand draws a dish in and sends one back, his right slides one on */
  const chefRest: Arm = { s: 10, e: 22 }
  const chefL = (c: number) =>
    armFrom(c, chefRest, [
      [T17.aPull[0], T17.aPull[1], T17.aPull[2], T17.aPull[3], (k) => reach(chef, 'L', backRim(pathA(k, false)), camera)],
      [T17.bPull[0], T17.bPull[1], T17.bPull[2], T17.bPull[3], (k) => reach(chef, 'L', backRim(pathB(k)), camera)],
      [T17.bBack[0], T17.bBack[1], T17.bBack[2], T17.bBack[3], (k) => reach(chef, 'L', backRim(pathB(k)), camera)],
    ])
  const chefR = (c: number) => armFrom(c, chefRest, [[T17.aPush[0], T17.aPush[1], T17.aPush[2], T17.aPush[3], (k) => reach(chef, 'R', backRim(pathA(k, false)), camera)]])
  const poseChef = (p: Pose, c: number) => {
    setArms(p, chefL(c), chefR(c))
    grip(p, 'L', Math.max(hold(c, 1.4, 1.45, 1.95, 2.0), hold(c, 4.75, 4.8, 5.25, 5.3), hold(c, 6.75, 6.8, 7.2, 7.25)))
    grip(p, 'R', hold(c, 3.25, 3.3, 3.7, 3.75))
    /* he watches the cook's side; down at the dish under the lamps while he checks it */
    lookAt(p, -0.55, 1, 0.15)
    const look = Math.max(hold(c, T17.aLook[0], T17.aLook[1], T17.aLook[2], T17.aLook[3]), hold(c, T17.bLook[0], T17.bLook[1], T17.bLook[2], T17.bLook[3]))
    lookAt(p, -0.25, look, 0.85)
    /* yes: two small nods; no: a shake of the head */
    const n = hold(c, T17.nod[0], T17.nod[0] + 0.1, T17.nod[1] - 0.1, T17.nod[1])
    to(p, 'headNod', 0.3 + 0.18 * Math.sin(((c - T17.nod[0]) / (T17.nod[1] - T17.nod[0])) * TAU * 2), n)
    const sk = hold(c, T17.shake[0], T17.shake[0] + 0.1, T17.shake[1] - 0.1, T17.shake[1])
    to(p, 'headTurn', -0.1 + 0.24 * Math.sin(((c - T17.shake[0]) / (T17.shake[1] - T17.shake[0])) * TAU * 2), sk)
  }

  /* the waiter: takes dish A off the far end and carries it out to the right, comes back for the next */
  const wtRest: Arm = { s: 6, e: 10 }
  const wtAt = (c: number): Body => ({ ...wt, root: new THREE.Vector3(waitX(c).x, 0, WAIT.z) })
  const wtL = (c: number) => armFrom(c, wtRest, [[T17.wTake[0], T17.wTake[1], T17.wTake[2], T17.wTake[3], (k) => reach(wtAt(k), 'L', rightRim(pathA(k, false)), camera)]])
  const poseWt = (p: Pose, c: number) => {
    const at = waitX(c)
    setArms(p, wtL(c), { s: 8, e: 34 })
    grip(p, 'L', hold(c, 3.8, 3.85, 5.0, 5.05))
    grip(p, 'R', 0.4)
    lookAt(p, -0.85, 1 - at.walking, 0.1)
    walkLegs(p, c, at.walking, at.dir)
  }

  const people = [
    person({ config: cook.cfg, dress: cookDress, seed: 2201, faces: COOK_FACES, pose: cookPose(arms), loop: L17, height: cook.h, frames: F17, redraw, holdT: devHold(HOLD17) }),
    person({ config: chef.cfg, dress: chefDress, seed: 2202, faces: [[0, 'neutral'], [2.0, 'thinking'], [2.6, 'happy'], [3.7, 'neutral'], [5.3, 'thinking'], [5.75, 'skeptical'], [7.3, 'neutral']], pose: poseChef, loop: L17, height: chef.h, frames: F17, redraw, holdT: devHold(HOLD17) }),
    person({ config: wt.cfg, dress: waiterDress, seed: 2203, faces: [[0, 'neutral'], [3.5, 'happy'], [5.25, 'neutral']], pose: poseWt, loop: L17, height: wt.h, frames: F17, redraw, holdT: devHold(HOLD17) }),
  ]
  people[0].object.position.copy(cook.root)
  people[1].object.position.copy(chef.root)
  scene.add(...people.map((s) => s.object))
  const clk = slideClock('T17', scene, devHold(HOLD17), people)

  return (t: number) => {
    const c = mod(clk.time(t), L17)
    const cq = frameT(c, L17, F17)
    const at = waitX(c)
    people[2].object.position.set(at.x, bob(at.walking, c), WAIT.z)
    people.forEach((s) => s.update(c, camera))
    /* a dish in a hand follows the drawn frame; on the pass it slides on the wall clock */
    const heldA = c < 1.05 || (c > 1.45 && c < 1.95) || (c > 3.3 && c < 4.15) || c > 7.6
    const heldB = (c > 3.75 && c < 4.25) || (c > 4.8 && c < 5.25) || (c > 6.8 && c < 7.2) || (c > 7.3 && c < 7.7)
    A.visible = shownA(c, false)
    A.position.copy(pathA(heldA && c < 4.15 ? cq : c, false))
    B.position.copy(pathB(heldB ? cq : c))
    const ok = hold(c, T17.aOk[0], T17.aOk[1], T17.aOk[2], T17.aOk[3])
    setOp(okRing, 0.85 * ok)
    okRing.scale.setScalar(0.9 + 0.1 * ok)
    const no = hold(c, T17.bNo[0], T17.bNo[1], T17.bNo[2], T17.bNo[3])
    setOp(noRing, 0.9 * no)
    noRing.scale.setScalar(0.9 + 0.1 * no)
    warm.intensity = 1.5 + 0.1 * Math.sin((c / L17) * TAU * 6)
    for (const s of puffs) {
      const k = mod((c / L17) * 4 + s.ph, 1)
      s.m.position.set(-1.25 + 0.03 * Math.sin(k * TAU + s.ph * 5), 0.98 + k * 0.32, -0.95)
      s.m.scale.setScalar(0.5 + k * 0.7)
      s.m.quaternion.copy(camera.quaternion)
      setOp(s.m, 0.45 * Math.sin(k * Math.PI))
    }
  }
}

/* ------------------------------------------------------------------ T17 concept: the developer, the CI belt */

function setupT17Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, CAM17, AT17, FOV17)
  lights(scene, [0, 1.0, -0.2])
  room17(scene, true)
  passCounter(scene, true)
  const white = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.25 })
  const navy = mat('#2B3F86', { roughness: 0.35, emissive: new THREE.Color('#2B3F86'), emissiveIntensity: 0.2 })

  /* the developer's laptop (the hot line): new commits come out of it */
  const lap = new THREE.Group()
  lap.add(box(0.36, 0.016, 0.24, mat('#B9C3D3', { roughness: 0.35, metalness: 0.4 }), [0, 0.008, 0], 0.008))
  const lid = box(0.36, 0.24, 0.012, mat('#AEB9CB', { roughness: 0.35, metalness: 0.4 }), [0, 0.12, -0.115], 0.008)
  lid.rotation.x = 0.22
  lap.add(lid)
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), new THREE.MeshBasicMaterial({ color: '#EAF1FF', toneMapped: false }))
  glow.position.set(0, 0.13, -0.098)
  glow.rotation.x = 0.22
  lap.add(glow)
  lap.position.set(-1.38, TOP17, -0.02)
  lap.rotation.y = 0.35
  scene.add(lap)

  /* the CI server (the head chef's place): a tower behind the belt, its screen of three test rows */
  const SV = { x: CHEF.x, z: CHEF.z, w: 0.5, h: 1.86 }
  scene.add(box(SV.w, SV.h, 0.4, navy, [SV.x, SV.h / 2, SV.z], 0.04))
  for (let k = 0; k < 4; k++) scene.add(flat(box(SV.w - 0.1, 0.035, 0.02, mat('#3E56A6', { roughness: 0.4 }), [SV.x, 0.3 + k * 0.08, SV.z + 0.205], 0.01)))
  scene.add(flat(box(0.42, 0.36, 0.02, white, [SV.x, 1.6, SV.z + 0.205], 0.03)))
  const ROW_Y = [1.7, 1.6, 1.5]
  const dots = ROW_Y.map((y) => {
    const m = new THREE.MeshBasicMaterial({ color: '#C8D3EA', toneMapped: false })
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.025, 24), m)
    d.position.set(SV.x - 0.14, y, SV.z + 0.218)
    scene.add(d)
    scene.add(flat(box(0.22, 0.022, 0.004, mat('#DCE4F4', { roughness: 0.6 }), [SV.x + 0.04, y, SV.z + 0.218], 0.008)))
    return m
  })
  /* the gantry over the belt (the heat lamps' place): two posts behind, a beam, the scanner head with its light fan */
  const GY = 1.27
  for (const x of [CHECK - 0.27, CHECK + 0.27]) scene.add(box(0.04, GY - PASS.h, 0.04, mat('#C9D6F2', { roughness: 0.4 }), [x, (GY + PASS.h) / 2, -0.24], 0.01))
  scene.add(box(0.62, 0.05, 0.06, mat('#C9D6F2', { roughness: 0.4 }), [CHECK, GY, -0.24], 0.015))
  scene.add(box(0.05, 0.05, 0.24, mat('#C9D6F2', { roughness: 0.4 }), [CHECK, GY, -0.12], 0.015))
  scene.add(box(0.16, 0.07, 0.12, white, [CHECK, GY - 0.03, 0.0], 0.02))
  const lampM = new THREE.MeshBasicMaterial({ color: C.brand, toneMapped: false })
  scene.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), lampM, [CHECK, GY - 0.07, 0.06]))
  const fanM = new THREE.MeshBasicMaterial({ color: '#7FA6FF', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const fanG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, GY - 0.07, 0.02), new THREE.Vector3(-0.15, PASS.h + 0.01, 0.02), new THREE.Vector3(0.15, PASS.h + 0.01, 0.02)])
  fanG.setIndex([0, 1, 2])
  const fan = new THREE.Mesh(fanG, fanM)
  fan.position.x = CHECK
  fan.renderOrder = 6
  scene.add(fan)
  const scanM = new THREE.MeshBasicMaterial({ color: '#BFD3FF', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.012), scanM)
  scan.renderOrder = 7
  scene.add(scan)

  /* the main repository (the waiter's place): a tall store at the belt's end, its Git mark, an intake light */
  const RP = { x: 1.12, w: 0.44, h: 1.86 }
  scene.add(box(RP.w, RP.h, 0.5, white, [RP.x, RP.h / 2, 0], 0.04))
  scene.add(flat(box(0.05, 0.3, 0.02, mat('#2E3445', { roughness: 0.6 }), [RP.x - RP.w / 2 + 0.05, PASS.h + 0.14, 0.255], 0.01)))
  const mark = picture(markTex(gitUrl, redraw), 0.26, 0.26, [RP.x, 1.5, 0.256], { transparent: false })
  scene.add(mark)
  scene.add(flat(box(0.3, 0.3, 0.01, mat('#D3DEF6', { roughness: 0.6 }), [RP.x, 1.5, 0.25], 0.03)))
  const inM = new THREE.MeshBasicMaterial({ color: '#C8D3EA', toneMapped: false })
  scene.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), inM, [RP.x - RP.w / 2 + 0.05, PASS.h + 0.33, 0.26]))
  for (let k = 0; k < 3; k++) scene.add(flat(box(RP.w - 0.12, 0.03, 0.02, mat('#E1E8F6', { roughness: 0.5 }), [RP.x, 0.32 + k * 0.08, 0.255], 0.01)))

  /* the commits, the rings, the cross */
  const A = makeCommit()
  const B = makeCommit()
  scene.add(A, B)
  const okRing = flatRing(0.15, 0.185, C.green)
  okRing.position.set(CHECK, TOP17 + 0.004, 0)
  const noRing = flatRing(0.15, 0.185, C.orange)
  noRing.position.set(CHECK, TOP17 + 0.004, 0)
  scene.add(okRing, noRing)
  const cross = picture(crossTex(), 0.12, 0.12, [CHECK + 0.2, 1.18, 0.12], { depthWrite: false, opacity: 0 })
  cross.renderOrder = 8
  scene.add(cross)

  /* the developer: the cook's place, the cook's moves */
  const dev = body(who(CAST_PRESETS.dev, { name: 'Developer', outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' } }), [COOK.x, 0, COOK.z], COOK.h)
  const arms = cookArms(dev, camera, true)
  const me = person({ config: dev.cfg, seed: 2204, faces: COOK_FACES, pose: cookPose(arms), loop: L17, height: dev.h, frames: F17, redraw, holdT: devHold(HOLD17) })
  me.object.position.copy(dev.root)
  scene.add(me.object)
  const clk = slideClock('T17', scene, devHold(HOLD17), [me])

  /* the test rows: A three green; B two green, the third orange */
  const ROWS_A = [2.15, 2.4, 2.65]
  const ROWS_B = [5.45, 5.7, 5.95]
  return (t: number) => {
    const c = mod(clk.time(t), L17)
    const cq = frameT(c, L17, F17)
    me.update(c, camera)
    const heldA = c < 1.05 || c > 7.6
    const heldB = (c > 3.75 && c < 4.25) || (c > 7.3 && c < 7.7)
    A.visible = shownA(c, true)
    A.position.copy(pathA(heldA ? cq : c, true))
    B.position.copy(pathB(heldB ? cq : c))
    /* the scan: the fan and a bright line going down over the commit at the check */
    const scanning = Math.max(hold(c, 1.95, 2.1, 2.7, 2.85), hold(c, 5.25, 5.4, 6.0, 6.15))
    fanM.opacity = 0.28 * scanning
    const sweep = mod(c * 2.2, 1)
    scan.position.set(CHECK, 1.17 - sweep * 0.22, 0.03)
    scanM.opacity = 0.9 * scanning
    const ok = hold(c, T17.aOk[0], T17.aOk[1], T17.aOk[2], T17.aOk[3])
    const no = hold(c, T17.bNo[0], T17.bNo[1], T17.bNo[2], T17.bNo[3])
    setOp(okRing, 0.85 * ok)
    okRing.scale.setScalar(0.9 + 0.1 * ok)
    setOp(noRing, 0.9 * no)
    noRing.scale.setScalar(0.9 + 0.1 * no)
    setOp(cross, no)
    cross.scale.setScalar(0.6 + 0.4 * no)
    cross.quaternion.copy(camera.quaternion)
    lampM.color.set(ok > 0.5 ? C.green : no > 0.5 ? C.orange : C.brand)
    dots.forEach((m, i) => {
      let col = '#C8D3EA'
      if (c >= ROWS_A[i] && c < 3.7) col = C.green
      if (c >= ROWS_B[i] && c < 7.05) col = i === 2 ? C.orange : C.green
      m.color.set(col)
    })
    /* the repository lights as commit A goes in */
    inM.color.set(hold(c, 4.35, 4.55, 5.0, 5.3) > 0.5 ? C.green : '#C8D3EA')
  }
}

/* ================================================================== T21 · an update: approved by a person, or automatic */

const L21 = 6
const F21 = 60
/* his finger on the approve button, the ripple out; on the concept phone the three tests just passed */
const HOLD21 = 1.36
const T21 = {
  lift: [0.55, 0.95] as const, // his hand comes up to the screen
  tap: 1.3, // he approves
  down: [2.0, 2.45] as const, // his hand goes back down while it installs
  tests: [0.4, 0.8, 1.2] as const, // the concept's three tests pass
  install: [1.45, 3.7] as const,
  done: [3.75, 3.95, 5.2, 5.45] as const, // the green tick
  reset: [5.3, 5.85] as const, // the next update arrives
}
const PERSON21 = new THREE.Vector3(-0.32, 0, 0)
const PERSON21_H = 1.68
const PHONE21 = new THREE.Vector3(-0.3, 0.88, -0.05)
const PW = 0.134
const PH = 0.28
const PS = 1.42
/** canvas (134 x 280) to screen-local coordinates */
const qx = (cx: number) => (cx / 134 - 0.5) * PW
const qy = (cy: number) => (0.5 - cy / 280) * PH
const BTN = { x: 67, y: 222 } // the approve button (the concept's third test row)

function frameCam21(camera: THREE.PerspectiveCamera) {
  camera.fov = 32.5
  camera.position.set(-0.16, 1.26, 2.3)
  camera.lookAt(-0.16, 1.12, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}
/** his room (and the concept's desk room): a wall with a window, a shelf, a plant */
function room21(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#E7EEFA' : '#E2EAF6')
  scene.add(floorPlane(8, 6, mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [8, 6]) : tileTex('#D9C4A6', '#C8B08F', 2, [10, 6]), roughness: 0.85 }), [0, 0, 1]))
  const wall = concept ? '#EAF0FA' : '#E6EEF5'
  scene.add(flat(box(8, 3.2, 0.1, mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.25 }), [0, 1.6, -0.8])))
  scene.add(flat(box(8, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0, 0.05, -0.74])))
  /* the window: a white frame, pale sky, a mullion */
  const sky = canvasTex(64, 64, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 64)
    g.addColorStop(0, '#A9CBFF')
    g.addColorStop(1, '#E4F0FF')
    k.fillStyle = g
    k.fillRect(0, 0, 64, 64)
  })
  scene.add(picture(sky, 0.56, 0.62, [0.48, 1.52, -0.744], { transparent: false }))
  for (const [w, h, x, y] of [[0.64, 0.04, 0.48, 1.85], [0.64, 0.04, 0.48, 1.19], [0.04, 0.7, 0.18, 1.52], [0.04, 0.7, 0.78, 1.52], [0.025, 0.62, 0.48, 1.52], [0.56, 0.025, 0.48, 1.52]] as const)
    scene.add(flat(box(w, h, 0.03, mat('#FFFFFF', { roughness: 0.5 }), [x, y, -0.73])))
  /* a plant in a pot */
  scene.add(cyl(0.09, 0.07, 0.2, mat('#E07B4F', { roughness: 0.6 }), [0.62, 0.1, -0.45], 24))
  for (let k = 0; k < 5; k++) {
    const leaf = mesh(new THREE.SphereGeometry(0.08, 14, 10), mat(k % 2 ? '#3E9B4B' : '#4FB45C', { roughness: 0.7 }), [0.62 + Math.sin(k * 1.3) * 0.06, 0.32 + k * 0.05, -0.45 + Math.cos(k * 1.3) * 0.04])
    leaf.scale.set(0.7, 1.2, 0.5)
    leaf.rotation.z = Math.sin(k * 1.3) * 0.5
    scene.add(leaf)
  }
}
/** the phone's static screen (134 x 280): the status bar, the update's app tile, the empty progress track */
function updateScreen() {
  return canvasTex(134, 280, (k) => {
    rr(k, 0, 0, 134, 280, 10, '#FFFFFF')
    rr(k, 10, 7, 22, 6, 3, '#C3CEE2')
    k.fillStyle = '#C3CEE2'
    for (let i = 0; i < 3; i++) k.fillRect(104 + i * 6, 12 - i * 2.5, 4, 2 + i * 2.5)
    /* the app tile: a blue square, a white package with a down arrow */
    const g = k.createLinearGradient(0, 34, 0, 112)
    g.addColorStop(0, '#5B88FF')
    g.addColorStop(1, '#1F47C4')
    rr(k, 31, 34, 72, 72, 18, '')
    k.fillStyle = g
    k.fill()
    rr(k, 47, 58, 40, 34, 6, '#FFFFFF')
    rr(k, 47, 58, 40, 9, 4, '#DCE6FF')
    /* the progress track */
    rr(k, 14, 150, 106, 10, 5, '#DCE4F4')
  })
}
/** a disc texture: a filled circle with a white tick */
const tickTex = (fill: string) =>
  canvasTex(64, 64, (k) => {
    k.fillStyle = fill
    k.beginPath()
    k.arc(32, 32, 30, 0, TAU)
    k.fill()
    k.strokeStyle = '#FFFFFF'
    k.lineWidth = 7
    k.lineCap = 'round'
    k.lineJoin = 'round'
    k.beginPath()
    k.moveTo(19, 33)
    k.lineTo(28, 42)
    k.lineTo(46, 23)
    k.stroke()
  })
/** a touch ripple: a ring that grows and fades on the glass */
function ripple21(r0: number, color: string) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0 * 0.7, r0, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
  m.renderOrder = 6
  return m
}
/** the phone: body, the screen, and the parts of the screen that change (bar, arrow, tick, and the button or tests) */
function makePhone(concept: boolean) {
  const ph = new THREE.Group()
  ph.add(box(PW + 0.016, PH + 0.022, 0.016, mat('#1C2233', { roughness: 0.3, metalness: 0.5 }), [0, 0, 0], 0.012))
  ph.add(flat(box(0.03, 0.006, 0.002, mat('#2E354A'), [0, PH / 2 + 0.004, 0.0085])))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), basic(updateScreen(), { depthWrite: false }))
  scr.position.z = 0.0086
  scr.renderOrder = 5
  ph.add(scr)
  const layer = (m: THREE.Mesh, z = 0.0092, order = 6) => {
    m.position.z = z
    m.renderOrder = order
    ph.add(m)
    return m
  }
  /* the bar's fill, grown from its left end */
  const fillG = new THREE.PlaneGeometry(qx(120) - qx(14), qy(150) - qy(160))
  fillG.translate((qx(120) - qx(14)) / 2, 0, 0)
  const fill = layer(new THREE.Mesh(fillG, new THREE.MeshBasicMaterial({ color: C.brand, transparent: true, toneMapped: false, depthWrite: false })))
  fill.position.set(qx(14), qy(155), 0.0092)
  /* the down arrow over the package: it slides down while the update installs */
  const arrowT = canvasTex(32, 32, (k) => {
    k.fillStyle = C.brand
    k.fillRect(13, 3, 6, 15)
    k.beginPath()
    k.moveTo(5, 16)
    k.lineTo(27, 16)
    k.lineTo(16, 29)
    k.closePath()
    k.fill()
  })
  const arrow = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(28) - qx(0), qy(0) - qy(28)), basic(arrowT, { depthWrite: false })))
  const ARROW = { x: qx(67), y: qy(76) }
  /* the green tick that says it is installed */
  const tick = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(64) - qx(0), qx(64) - qx(0)), basic(tickTex(C.green), { depthWrite: false, opacity: 0 })), 0.0094, 7)
  tick.position.set(qx(BTN.x), qy(BTN.y), 0.0094)
  /* everyday: the approve button (a blue disc with a tick); concept: three test rows, each a disc and a bar */
  const btn = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(56) - qx(0), qx(56) - qx(0)), basic(tickTex(C.brand), { depthWrite: false })))
  btn.position.set(qx(BTN.x), qy(BTN.y), 0.0092)
  btn.visible = !concept
  const rows = [0, 1, 2].map((i) => {
    const y = qy(BTN.y - 34 + i * 26)
    const dm = new THREE.MeshBasicMaterial({ color: '#C8D3EA', transparent: true, toneMapped: false, depthWrite: false })
    const d = layer(new THREE.Mesh(new THREE.CircleGeometry(qx(9) - qx(0), 24), dm))
    d.position.set(qx(30), y, 0.0092)
    const bar = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(64) - qx(0), qy(0) - qy(8)), new THREE.MeshBasicMaterial({ color: '#DCE4F4', transparent: true, toneMapped: false, depthWrite: false })))
    bar.position.set(qx(78), y, 0.0092)
    d.visible = bar.visible = concept
    return { dm, d, bar }
  })
  const rp = ripple21(0.04, C.brand)
  rp.position.set(qx(BTN.x), qy(BTN.y), 0.0098)
  ph.add(rp)
  ph.scale.setScalar(PS)
  /** the screen at loop time c */
  const update = (c: number) => {
    const inst = seg(c, T21.install[0], T21.install[1])
    const back = seg(c, T21.reset[0], T21.reset[1])
    /* the bar fills while it installs, then empties as the next update arrives */
    fill.scale.x = Math.max(0.001, inst * (1 - back))
    ;(fill.material as THREE.MeshBasicMaterial).opacity = 1 - back
    /* the arrow drops into the package again and again while it installs */
    const busy = hold(c, T21.install[0], T21.install[0] + 0.1, T21.install[1], T21.install[1] + 0.15)
    const drop = mod((c - T21.install[0]) * 1.6, 1)
    arrow.position.set(ARROW.x, ARROW.y - (qy(0) - qy(14)) * busy * (drop - 0.5) * 0.9, 0.0092)
    const done = hold(c, T21.done[0], T21.done[1], T21.done[2], T21.done[3])
    setOp(arrow, 1 - done)
    setOp(tick, done)
    tick.scale.setScalar(0.7 + 0.3 * done)
    /* the approve button pulses while it waits for him, goes once he taps, comes back with the next update */
    const wait = 1 - seg(c, T21.tap + 0.05, T21.tap + 0.35)
    const again = seg(c, T21.reset[0] + 0.1, T21.reset[1])
    const pulse = 1 + 0.06 * Math.sin(c * TAU * 1.5) * (c < T21.tap ? 1 : 0)
    btn.scale.setScalar(pulse * (c > T21.tap && c < T21.tap + 0.18 ? 0.9 : 1))
    setOp(btn, Math.max(wait, again) * (1 - done))
    /* concept: each test passes in turn, then they clear for the next update */
    rows.forEach((r, i) => {
      const on = seg(c, T21.tests[i], T21.tests[i] + 0.12) * (1 - seg(c, T21.done[0] - 0.2, T21.done[0]))
      r.dm.color.set(on > 0.5 ? C.green : '#C8D3EA')
      r.d.scale.setScalar(1 + 0.25 * Math.sin(Math.PI * clamp01((c - T21.tests[i]) / 0.3)))
      setOp(r.d, 1 - done)
      ;(r.bar.material as THREE.MeshBasicMaterial).opacity = 1 - done
    })
    /* the touch: his tap (everyday), the last test passing (concept) */
    /* no one taps the concept phone */
    const age = concept ? -1 : c - T21.tap
    const k = clamp01(age / 0.45)
    rp.scale.setScalar(0.4 + k * 1.3)
    setOp(rp, age >= 0 && age < 0.45 ? 0.85 * (1 - k) : 0)
  }
  return { ph, update }
}

/* ------------------------------------------------------------------ T21 everyday: he approves the update */

function setupT21Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam21(camera)
  lights(scene, [0, 1.1, 0], 3.2)
  room21(scene, false)
  const phone = makePhone(false)
  const ph = phone.ph
  scene.add(ph)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ map: haloTex('rgba(200,220,255,0.8)'), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.5 }))
  scene.add(glow)

  const cfg = who(CAST_PRESETS.kabir, { name: 'User', hair: { style: 'sidePart', color: '#2A2324' }, outfit: { top: 'hoodie', topColor: '#1FA7A0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 1.02, shoulders: 1 } })
  const b: Body = { cfg, root: PERSON21.clone(), h: PERSON21_H, sh: buildSkin(cfg).shoulderHalf }
  const yaw = Math.atan2(camera.position.x - PHONE21.x, camera.position.z - PHONE21.z)
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, yaw, 0))
  /* his L hand grips the phone's left edge, low (Session 21 slide 33's hold) */
  const gripP = new THREE.Vector3(-PW * 0.48, -PH * 0.47, 0).multiplyScalar(PS).applyQuaternion(q)
  /** of the two elbows, the one out at his side (a relaxed bend, never folded across his front) */
  const outward = (side: 'L' | 'R', w: THREE.Vector3): Arm => {
    const pt = worldToRig(w, b.root, b.h, camera)
    const a = ik2(side, b.sh, pt, false)
    const d = ik2(side, b.sh, pt, true)
    return Math.sin(a.s * DEG) >= Math.sin(d.s * DEG) ? a : d
  }
  const holdL = () => outward('L', PHONE21.clone().add(gripP))
  /* his R index finger on the approve button, coming down from above right */
  const tapW = (lift: number) => PHONE21.clone().add(new THREE.Vector3(qx(BTN.x), qy(BTN.y), 0).multiplyScalar(PS).applyQuaternion(q)).add(new THREE.Vector3(0.06, 0.01 + lift, 0))
  const restR: Arm = { s: 8, e: 18 }
  const press = (c: number) => hold(c, T21.tap - 0.14, T21.tap, T21.tap + 0.08, T21.tap + 0.22)
  const fingerR = (c: number) => mixArm(restR, outward('R', tapW(0.035 * (1 - press(c)))), hold(c, T21.lift[0], T21.lift[1], T21.down[0], T21.down[1]))
  const him = person({
    config: cfg,
    seed: 2211,
    faces: [[0, 'thinking'], [0.9, 'listening'], [1.4, 'happy'], [2.2, 'neutral'], [3.85, 'happy'], [5.3, 'thinking']],
    loop: L21,
    frames: F21,
    height: PERSON21_H,
    redraw,
    holdT: devHold(HOLD21),
    pose: (p, c) => {
      setArms(p, holdL(), fingerR(c))
      grip(p, 'L', 1)
      const point = hold(c, T21.lift[0], T21.lift[1], T21.down[0], T21.down[1])
      to(p, 'fR1', 0, point)
      to(p, 'fR2', 0.95, point)
      to(p, 'fR3', 1, point)
      to(p, 'fR4', 1, point)
      to(p, 'tR', 0.8, point)
      to(p, 'palmR', 0.2, point)
      /* he looks down at the phone; a small nod when it is done */
      to(p, 'headTurn', 0.05, 1)
      to(p, 'headNod', 0.5, 1)
      to(p, 'lookX', 0.1, 1)
      to(p, 'lookY', 1, 1)
      const n = hold(c, 3.9, 4.0, 4.6, 4.7)
      to(p, 'headNod', 0.5 - 0.15 * Math.sin(((c - 3.9) / 0.8) * TAU * 2), n)
    },
  })
  him.object.position.copy(PERSON21)
  scene.add(him.object)
  /* his forearms and hands again, in front of the phone (Session 21 slide 33: the same frame on a copy of his plane,
     scaled about the camera so it lands on the same pixels, keeping only each forearm capsule and the skin round each hand) */
  const plane = (him as unknown as { plane: THREE.Mesh }).plane
  const planeM = plane.material as THREE.MeshBasicMaterial
  const fore = { value: [new THREE.Vector4(), new THREE.Vector4()] }
  const hands = { value: [new THREE.Vector3(), new THREE.Vector3()] }
  const frontM = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false })
  frontM.map = planeM.map
  frontM.onBeforeCompile = (sh) => {
    sh.uniforms.uFore = fore
    sh.uniforms.uHand = hands
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec2 vPlaneUv;\nvoid main() {\n  vPlaneUv = uv;')
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec4 uFore[2];\nuniform vec3 uHand[2];\nvarying vec2 vPlaneUv;\nvoid main() {')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec2 r = vec2(vPlaneUv.x * 480.0 - 40.0, (1.0 - vPlaneUv.y) * 600.0);
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
  frontM.customProgramCacheKey = () => 't21-hands'
  const front = new THREE.Mesh(plane.geometry, frontM)
  front.matrixAutoUpdate = false
  front.renderOrder = 7
  scene.add(front)
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
  const camW = new THREE.Vector3()
  const alongRay = (p: THREE.Vector3, d: number) => {
    camera.getWorldPosition(camW)
    const dist = p.distanceTo(camW)
    return p.sub(camW).multiplyScalar(1 - d / dist).add(camW)
  }
  const scaleAbout = new THREE.Matrix4()
  const clk = slideClock('T21', scene, devHold(HOLD21), [him])
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L21)
    const cq = frameT(c, L21, F21)
    him.update(c, camera)
    rigToWorld(handPt('L', b.sh, holdL()), PERSON21_H, PERSON21, camera, hand)
    ph.quaternion.copy(q)
    ph.position.copy(hand).sub(gripP)
    glow.position.copy(ph.position).add(new THREE.Vector3(0, 0, -0.06))
    glow.quaternion.copy(q)
    alongRay(ph.position, 0.04)
    if (frontM.map !== planeM.map) frontM.map = planeM.map
    setArm(0, 'L', holdL())
    setArm(1, 'R', fingerR(cq))
    plane.updateWorldMatrix(true, false)
    camera.getWorldPosition(camW)
    const dist = camW.distanceTo(PERSON21)
    const k8 = 1 - 0.08 / dist
    scaleAbout.makeTranslation(camW.x, camW.y, camW.z).multiply(new THREE.Matrix4().makeScale(k8, k8, k8)).multiply(new THREE.Matrix4().makeTranslation(-camW.x, -camW.y, -camW.z))
    front.matrix.copy(scaleAbout).multiply(plane.matrixWorld)
    front.matrixWorldNeedsUpdate = true
    front.visible = plane.visible
    phone.update(c)
  }
}

/* ------------------------------------------------------------------ T21 concept: the same update, installed on its own */

function setupT21Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  frameCam21(camera)
  lights(scene, [0, 1.1, 0], 3.2)
  room21(scene, true)
  /* a desk where he stood, the phone in a dock at the same place on the screen */
  const wood = mat('#E8D2B0', { roughness: 0.6 })
  const DESK = { y: 0.62, x0: -0.95, x1: 0.32 }
  scene.add(box(DESK.x1 - DESK.x0, 0.04, 0.5, wood, [(DESK.x0 + DESK.x1) / 2, DESK.y - 0.02, -0.1], 0.012))
  for (const x of [DESK.x0 + 0.06, DESK.x1 - 0.06]) scene.add(box(0.045, DESK.y - 0.04, 0.4, mat('#9AA4B4', { roughness: 0.4, metalness: 0.3 }), [x, (DESK.y - 0.04) / 2, -0.1]))
  const phone = makePhone(true)
  const ph = phone.ph
  const yaw = Math.atan2(camera.position.x - PHONE21.x, camera.position.z - PHONE21.z)
  ph.position.copy(PHONE21)
  ph.quaternion.setFromEuler(new THREE.Euler(-0.08, yaw, 0))
  scene.add(ph)
  /* the dock: a white base on the desk, a back plate, a small lip under the phone, its charge light */
  const white = mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.2 })
  const bottom = PHONE21.y - (PH * PS) / 2
  scene.add(box(0.3, 0.035, 0.2, white, [PHONE21.x, DESK.y + 0.0175, -0.08], 0.012))
  scene.add(box(0.07, bottom - DESK.y + 0.04, 0.05, white, [PHONE21.x, (bottom + DESK.y) / 2, -0.09], 0.015))
  scene.add(box(0.22, 0.03, 0.06, white, [PHONE21.x, bottom - 0.012, -0.04], 0.01))
  const ledM = new THREE.MeshBasicMaterial({ color: '#7FA6FF', toneMapped: false })
  scene.add(mesh(new THREE.SphereGeometry(0.01, 12, 8), ledM, [PHONE21.x + 0.1, DESK.y + 0.036, 0.02]))
  /* a mug and a notebook on the desk (it is someone's desk; nobody needs to be at it) */
  scene.add(cyl(0.04, 0.036, 0.09, mat('#F6C531', { roughness: 0.4 }), [-0.62, DESK.y + 0.045, -0.2], 24))
  scene.add(box(0.2, 0.02, 0.15, mat('#5B88FF', { roughness: 0.6 }), [-0.8, DESK.y + 0.01, -0.06], 0.005))
  /* the pipeline's test runner beside the dock: a small server, one light per test, its cable into the dock */
  const RUN = { x: 0.08, w: 0.2, h: 0.26 }
  scene.add(box(RUN.w, RUN.h, 0.18, mat('#2B3F86', { roughness: 0.35, emissive: new THREE.Color('#2B3F86'), emissiveIntensity: 0.2 }), [RUN.x, DESK.y + RUN.h / 2, -0.14], 0.02))
  for (let k = 0; k < 2; k++) scene.add(flat(box(RUN.w - 0.06, 0.02, 0.01, mat('#3E56A6', { roughness: 0.4 }), [RUN.x, DESK.y + 0.05 + k * 0.035, -0.045], 0.005)))
  const testM = [0, 1, 2].map((k) => {
    const m = new THREE.MeshBasicMaterial({ color: '#7F95BF', toneMapped: false })
    scene.add(mesh(new THREE.SphereGeometry(0.016, 14, 10), m, [RUN.x - 0.05 + k * 0.05, DESK.y + 0.19, -0.045]))
    return m
  })
  const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(RUN.x - RUN.w / 2, DESK.y + 0.04, -0.12), new THREE.Vector3(-0.08, DESK.y + 0.006, -0.1), new THREE.Vector3(PHONE21.x + 0.15, DESK.y + 0.006, -0.08)])
  scene.add(mesh(new THREE.TubeGeometry(cable, 24, 0.006, 8), mat('#C9D0DA', { roughness: 0.5 })))
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ map: haloTex('rgba(200,220,255,0.8)'), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.5 }))
  glow.position.copy(PHONE21).add(new THREE.Vector3(0, 0, -0.08))
  glow.quaternion.copy(ph.quaternion)
  scene.add(glow)
  const clk = slideClock('T21', scene, devHold(HOLD21), [{ ready: Promise.resolve() }])
  return (t: number) => {
    const c = mod(clk.time(t), L21)
    phone.update(c)
    testM.forEach((m, i) => m.color.set(c >= T21.tests[i] && c < T21.done[0] ? C.green : '#7F95BF'))
    ledM.color.set(hold(c, T21.install[0], T21.install[0] + 0.1, T21.install[1], T21.install[1] + 0.1) > 0.5 ? (mod(c * 2, 1) < 0.5 ? C.brand : '#BFD2FF') : '#7FA6FF')
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
  I_T17Everyday: card('T17', setupT17Everyday, devHold(HOLD17)),
  I_T17Concept: card('T17', setupT17Concept, devHold(HOLD17)),
  I_T21Everyday: card('T21', setupT21Everyday, devHold(HOLD21)),
  I_T21Concept: card('T21', setupT21Concept, devHold(HOLD21)),
}
export const css = ''
