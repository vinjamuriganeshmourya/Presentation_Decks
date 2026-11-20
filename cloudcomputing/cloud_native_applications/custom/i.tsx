import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER I · SESSION 18 (Cloud-Native Applications) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * to the Sessions 14-16 standard: a perspective camera and a real place; people are Character Lab characters from the
 * engine's `castSprite` (role clothing by `dress`), each an individual with expressions keyed to the action; NO TEXT on
 * either card; one wall-clock loop per slide shared by both cards beat for beat and place for place (custom/clock.tsx:
 * the cards fade in once every person has a first frame, a tap pauses both); people at a fixed `px` with no idle
 * breathing (Session 16 round 3); each loop ends in the state it starts in; held frames (`?still`, thumbnails) draw the
 * telling moment at HOLD. Nobody walks toward or away from the camera: people step sideways.
 *
 * SLIDE 26 · T11-AN (TR 11): "A single school office manages admissions, fees and exams together, so a rush in
 * admissions slows everything. Separate offices handle each function independently, so the fees office can add staff
 * during fee week without changing the others. This is similar to monolithic and microservices architectures."
 * Colour is the function, never a word: admissions blue (a mortarboard), fees gold (coins), exams purple (a paper).
 *
 *   place (x)       everyday: a school corridor                      concept: the same places
 *   -2.0            ONE office window, one clerk, a sign carrying     ONE monolith block, its three modules on its band,
 *                   all three functions                               one core
 *   -1.47 .. -0.22  ONE queue: two parents with admission forms       the requests in one line: two blue, a gold
 *                   (the rush), a parent with a fee form
 *    0.48           the admissions office, its clerk at her register  the admissions service, turning steadily
 *    1.13 / 1.55    the fees office: its clerk, a second window       the fees service, the place its copy takes
 *    2.07           (the second clerk waits behind the wall) and      (the copy splits off the service)
 *                   a parent with a stack of fee forms                the stack of fee requests
 *    2.63           the exams office, its clerk at her register       the exams service, turning steadily
 *
 *   0.3 - 7.6      the one clerk takes ONE admission form and works  the monolith takes ONE blue request, its admissions
 *                  through it slowly (five stamps), hands it back;   module ringed orange, its core turning slowly; the
 *                  the fee parent checks his watch and sighs:        gold request and the second blue stack wait (orange
 *                  nobody behind admissions is served                rings)
 *   0.6 - 7.9      FEE WEEK: the calendar turns gold, a stack of     a burst of fee requests (the spike lights gold); a
 *                  forms comes in, a second clerk steps into the     copy of the fees service splits off into the second
 *                  second window, the two clear it, she steps back   place, the two clear it, the copy folds back in
 *
 * SLIDE 35 · T15-AN (TR 15): "In one hotel, guest details are stored in a central system, so any receptionist can assist
 * them (stateless). In another, each receptionist remembers guest details personally, so guests must return to the same
 * receptionist (stateful)."
 *
 *   place (x)       everyday: two hotel lobbies                       concept: the same places
 *   -2.45           hotel A: a receptionist busy on the phone         an instance busy with another request
 *   -2.0            the central computer, wired to both desks         ONE shared store, wired to both instances
 *   -1.55           a free receptionist                               a free instance
 *   -0.45 -> -1.0   a guest walks in, the free one serves her         a request goes to the free instance, which reads
 *                   from the central computer                         the shared store: answered at once
 *    0.75           hotel B: the receptionist who KNOWS the guest     the instance HOLDING the request's state (its chip),
 *                   (her face in a thought bubble), on the phone      busy
 *    1.65           a free receptionist who does not know her         a free instance holding other state
 *    2.75 -> 0.18   the guest walks past the free one and waits for   the sticky request passes the free instance and
 *                   the one who knows her; served only at the end     waits (orange ring) for its own; answered at the end
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
  /* the three functions */
  adm: '#2D63FB',
  admDark: '#1F47C4',
  fee: '#F2B33D',
  feeDark: '#C8891A',
  exam: '#8B5CF6',
  examDark: '#6A3FD6',
  /* the hotel guest and another guest */
  guest: '#E4578F',
  other: '#14B8A6',
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

/** the function pictograms (icons, never words): admissions a mortarboard, fees a coin stack, exams a ruled paper */
type Fn = 'adm' | 'fee' | 'exam'
function glyph(g: CanvasRenderingContext2D, fn: Fn, cx: number, cy: number, s: number, color: string) {
  g.fillStyle = color
  g.strokeStyle = color
  g.lineJoin = 'round'
  g.lineCap = 'round'
  if (fn === 'adm') {
    g.beginPath()
    g.moveTo(cx - s * 0.5, cy - s * 0.12)
    g.lineTo(cx, cy - s * 0.34)
    g.lineTo(cx + s * 0.5, cy - s * 0.12)
    g.lineTo(cx, cy + s * 0.1)
    g.closePath()
    g.fill()
    g.beginPath()
    g.moveTo(cx - s * 0.3, cy)
    g.lineTo(cx - s * 0.3, cy + s * 0.24)
    g.quadraticCurveTo(cx, cy + s * 0.4, cx + s * 0.3, cy + s * 0.24)
    g.lineTo(cx + s * 0.3, cy)
    g.lineTo(cx, cy + s * 0.14)
    g.closePath()
    g.fill()
    g.lineWidth = s * 0.06
    g.beginPath()
    g.moveTo(cx + s * 0.42, cy - s * 0.1)
    g.lineTo(cx + s * 0.42, cy + s * 0.26)
    g.stroke()
    g.beginPath()
    g.arc(cx + s * 0.42, cy + s * 0.3, s * 0.06, 0, TAU)
    g.fill()
  } else if (fn === 'fee') {
    for (let k = 0; k < 3; k++) {
      const y = cy + s * 0.3 - k * s * 0.16
      g.beginPath()
      g.ellipse(cx - s * 0.12, y, s * 0.3, s * 0.1, 0, 0, TAU)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.45)'
      g.beginPath()
      g.ellipse(cx - s * 0.12, y - s * 0.03, s * 0.22, s * 0.05, 0, 0, TAU)
      g.fill()
      g.fillStyle = color
    }
    g.beginPath()
    g.arc(cx + s * 0.22, cy - s * 0.12, s * 0.26, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = s * 0.05
    g.beginPath()
    g.arc(cx + s * 0.22, cy - s * 0.12, s * 0.16, 0, TAU)
    g.stroke()
  } else {
    rr(g, cx - s * 0.32, cy - s * 0.42, s * 0.56, s * 0.8, s * 0.07, color)
    g.fillStyle = '#FFFFFF'
    for (let k = 0; k < 4; k++) rr(g, cx - s * 0.22, cy - s * 0.28 + k * s * 0.15, s * (k === 3 ? 0.22 : 0.36), s * 0.06, s * 0.03, '#FFFFFF')
    g.save()
    g.translate(cx + s * 0.3, cy + s * 0.02)
    g.rotate(0.6)
    rr(g, -s * 0.06, -s * 0.42, s * 0.12, s * 0.62, s * 0.03, color)
    g.beginPath()
    g.moveTo(-s * 0.06, s * 0.2)
    g.lineTo(s * 0.06, s * 0.2)
    g.lineTo(0, s * 0.33)
    g.closePath()
    g.fill()
    g.restore()
  }
}
/** a white round plaque with a function's pictogram */
const plaqueTex = (fn: Fn, color: string) =>
  canvasTex(96, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(48, 48, 46, 0, TAU)
    g.fill()
    g.strokeStyle = color
    g.lineWidth = 4
    g.beginPath()
    g.arc(48, 48, 42, 0, TAU)
    g.stroke()
    glyph(g, fn, 48, 50, 54, color)
  })
/** a card with a person glyph (a guest's record: their face, no words) */
const guestCardTex = (color: string) =>
  canvasTex(96, 76, (g) => {
    rr(g, 2, 2, 92, 72, 10, '#FFFFFF')
    g.strokeStyle = color
    g.lineWidth = 3
    g.beginPath()
    g.roundRect(3.5, 3.5, 89, 69, 9)
    g.stroke()
    g.fillStyle = color
    g.beginPath()
    g.arc(30, 30, 11, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(30, 58, 18, 12, 0, Math.PI, 0)
    g.fill()
    rr(g, 52, 22, 32, 6, 3, '#C3CCDD')
    rr(g, 52, 34, 24, 6, 3, '#C3CCDD')
    rr(g, 52, 46, 28, 6, 3, '#C3CCDD')
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
function floorPlane(w: number, d: number, m: THREE.Material, pos: V3) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
  f.rotation.x = -Math.PI / 2
  f.position.set(...pos)
  f.receiveShadow = true
  return f
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

/** a folder: coloured covers round a sheaf of white pages; `mark` adds the green round stamp on its front */
function makeFolder(color: string, dark: string) {
  const g = new THREE.Group()
  g.add(box(0.15, 0.2, 0.022, mat(color, { roughness: 0.45 }), [0, 0, 0], 0.004))
  g.add(flat(box(0.14, 0.186, 0.014, mat('#FFFFFF', { roughness: 0.8 }), [0.008, -0.004, 0])))
  g.add(flat(box(0.15, 0.03, 0.026, mat(dark, { roughness: 0.45 }), [0, 0.085, 0])))
  const mark = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: 0, toneMapped: false }))
  mark.position.set(0.02, -0.03, 0.0125)
  g.add(mark)
  g.userData.mark = mark
  return g
}
const markOf = (f: THREE.Object3D) => f.userData.mark as THREE.Mesh
/** a stack of folders as one prop (n folders, the front one carries the stamp mark) */
function makeStack(n: number, color: string, dark: string) {
  const g = new THREE.Group()
  const items: THREE.Group[] = []
  for (let k = 0; k < n; k++) {
    const f = makeFolder(color, dark)
    f.position.set(k * 0.004, k * 0.006, -k * 0.024)
    g.add(f)
    items.push(f)
  }
  g.userData.items = items
  return g
}
/** a rubber stamp: a turned handle on an inked base */
function makeStamp(ink: string) {
  const g = new THREE.Group()
  g.add(cyl(0.016, 0.02, 0.07, mat('#8C5A34', { roughness: 0.5 }), [0, 0.05, 0], 16))
  g.add(mesh(new THREE.SphereGeometry(0.022, 16, 12), mat('#8C5A34', { roughness: 0.45 }), [0, 0.09, 0]))
  g.add(box(0.06, 0.022, 0.045, mat('#2F3A52', { roughness: 0.4 }), [0, 0.006, 0], 0.004))
  g.add(flat(box(0.056, 0.006, 0.041, mat(ink, { roughness: 0.6 }), [0, -0.007, 0])))
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

/* role clothing, rig body frame 400 x 600 */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
/** the staff ID on a lanyard (school office staff) */
const LANYARD = (strap: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={strap} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={strap} opacity={0.55} />
  </g>
)
/** a hotel's name badge on the blazer and a neck scarf */
const HOTEL_BADGE = (badge: string, scarf: string) => (
  <g data-part="hotel">
    <path d="M 184 206 C 192 222 208 222 216 206 L 210 232 L 200 226 L 190 232 Z" fill={scarf} />
    <rect x={160} y={262} width={26} height={10} rx={2.5} fill={badge} />
  </g>
)
/** a shoulder bag strap and the bag at the hip (a hotel guest) */
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
const both = (...fs: ((k: Skin) => Skin)[]) => (k: Skin): Skin => fs.reduce((a, f) => f(a), k)

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 99 to the grip; an angle is measured from hanging straight down, positive lifts away from the body, the
   forearm at shoulder minus elbow) and the inverse, so a hand lands on the thing it reaches for (Session 15) ---- */

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
/** a prop's place over time: [t0, t1, place] keys; between keys it moves (with a little arc) from the last place */
type Place = (out: THREE.Vector3) => THREE.Vector3
function track(c: number, keys: [number, number, Place][], out: THREE.Vector3, tmp: THREE.Vector3, arc = 0.05): number {
  let from = keys[keys.length - 1][2]
  for (let i = 0; i < keys.length; i++) {
    const [a, b, f] = keys[i]
    if (c < a) {
      from(out)
      return i
    }
    if (c <= b) {
      const k = seg(c, a, b)
      from(out)
      f(tmp)
      out.lerp(tmp, k)
      out.y += Math.sin(k * Math.PI) * arc
      return i + 0.5
    }
    from = f
  }
  from(out)
  return keys.length
}

/** a person standing at a place: everything their props need */
type Body = { cfg: CharacterConfig; root: THREE.Vector3; h: number; sh: number }
const body = (cfg: CharacterConfig, root: V3, h: number): Body => ({ cfg, root: v3(root), h, sh: buildSkin(cfg).shoulderHalf })
/** arm angles that put this person's hand on a world point */
const reach = (b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, dy = 0): Arm => {
  const p = worldToRig(k, b.root, b.h, camera)
  return ik(side, b.sh, { x: p.x, y: p.y + dy })
}
const REST: Arm = { s: 5, e: 8 }

/* ================================================================== T11 · one school office, or separate offices */

const L11 = 9
const F11 = 90
const HOLD11 = 4.35 /* fee week: both fees clerks at work; the one clerk still on the same admission form, the fee parent at his watch */
const CAM11: V3 = [0.31, 2.15, 7.5]
const AT11: V3 = [0.31, 1.45, -0.75]
const FOV11 = 34

/* the corridor: office fronts at FZ, clerks behind them, visitors in front */
const FZ = -0.75
const WALL_T = 0.08
const SILL = 0.86
const WTOP = 1.8
const FH = 2.3
const BAND = 0.6
const CZ = -1.12
const VZ = -0.36
const BACKZ = -1.62
const CEIL = 2.97

const LO = { x0: -2.3, x1: 0.1, win: -2.0, ww: 0.46 }
const LQ = { blue1: -1.47, blue2: -0.83, gold: -0.22 }
const RA = { x0: 0.18, x1: 0.78, win: 0.48, ww: 0.4 }
const RF = { x0: 0.83, x1: 2.28, win1: 1.13, win2: 1.55, ww: 0.4, hide: 2.07, vis: 2.02 }
const RE = { x0: 2.33, x1: 2.93, win: 2.63, ww: 0.4 }
/* the fee-week sign (the calendar; the request spike) */
const SPIKE_X = 2.02

/* the times */
const T11 = {
  /* the one office: ONE admission form, worked through slowly */
  lReach: [0.3, 0.7, 0.95, 1.2] as const, // the parent's hand out, the form leaves it at 0.7-0.95
  lTake: [0.55, 0.8, 0.95, 1.35] as const, // the clerk's hand comes for it and lays it on the sill
  lStamps: [1.8, 2.75, 3.7, 4.65, 5.6] as const,
  lBack: [6.2, 6.55, 6.75, 7.05] as const, // the clerk picks it up and hands it out
  lGet: [6.4, 6.75, 6.95, 7.35] as const, // the parent takes it back
  watch: [3.55, 3.85, 4.85, 5.15] as const, // the fee parent checks his watch
  sigh: [6.0, 6.3, 7.0, 7.3] as const,
  /* the admissions and exams offices: calm, each clerk writing up her own register, looking up now and then */
  aUp: [2.2, 2.5, 3.4, 3.7] as const,
  eUp: [5.6, 5.9, 6.8, 7.1] as const,
  /* the fees office in fee week */
  week: [0.6, 1.0, 7.6, 8.0] as const, // the calendar turns gold and back
  fGive: [1.15, 1.5, 1.6, 1.9] as const, // the parent's stack goes in
  fSlide: [1.6, 2.0] as const, // the stack slides onto the sill between the two windows
  fStamps: [
    [2.4, 'F1'],
    [3.2, 'F1'],
    [3.85, 'F2'],
    [4.05, 'F1'],
    [4.65, 'F2'],
  ] as [number, 'F1' | 'F2'][],
  f2In: [2.55, 3.5] as const,
  fBack: [5.0, 5.3, 5.55, 5.9] as const, // the second clerk lifts the done stack and hands it out
  fGet: [5.3, 5.6, 5.8, 6.15] as const,
  f2Out: [6.45, 7.4] as const,
}

/** a stamp's arm: the hand comes down on `at` at time t (a thump), from above it */
function stampSpans(times: readonly number[], up: Arm, down: Arm): Span[] {
  const s: Span[] = []
  for (const t of times) {
    s.push([t - 0.42, t - 0.2, t + 0.1, t + 0.32, up])
    s.push([t - 0.2, t - 0.02, t + 0.02, t + 0.14, down])
  }
  return s
}

/** an office front: a wall with window openings (sill to WTOP), the sill a counter through the wall, a sign band above,
 *  the booth behind (inner walls lit softly) */
function officeFront(scene: THREE.Scene, o: { x0: number; x1: number; wins: { x: number; w: number }[]; wall: string; band: string; inner: string; trim: string }) {
  const wallM = mat(o.wall, { roughness: 0.85, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.18 })
  const part = (a: number, b: number, y0: number, y1: number) => {
    if (b - a < 0.001) return
    scene.add(box(b - a, y1 - y0, WALL_T, wallM, [(a + b) / 2, (y0 + y1) / 2, FZ - WALL_T / 2]))
  }
  let x = o.x0
  for (const w of o.wins) {
    const a = w.x - w.w / 2
    const b = w.x + w.w / 2
    part(x, a, 0, FH)
    part(a, b, 0, SILL)
    part(a, b, WTOP, FH)
    x = b
  }
  part(x, o.x1, 0, FH)
  /* the sign band and the skirting */
  scene.add(box(o.x1 - o.x0 + 0.06, BAND, 0.14, mat(o.band, { roughness: 0.5 }), [(o.x0 + o.x1) / 2, FH + BAND / 2, FZ - 0.02], 0.02))
  scene.add(flat(box(o.x1 - o.x0, 0.09, 0.02, mat(o.trim, { roughness: 0.6 }), [(o.x0 + o.x1) / 2, 0.045, FZ + 0.01])))
  /* the counters through each window and the window frames */
  const sillM = mat('#F4EDE2', { roughness: 0.45 })
  const frameM = mat(o.trim, { roughness: 0.5 })
  for (const w of o.wins) {
    scene.add(box(w.w + 0.06, 0.04, 0.42, sillM, [w.x, SILL + 0.02, FZ - 0.12], 0.008))
    scene.add(flat(box(w.w + 0.04, 0.035, 0.03, frameM, [w.x, WTOP + 0.017, FZ + 0.01])))
    scene.add(flat(box(0.035, WTOP - SILL, 0.03, frameM, [w.x - w.w / 2 - 0.0, (SILL + WTOP) / 2, FZ + 0.01])))
    scene.add(flat(box(0.035, WTOP - SILL, 0.03, frameM, [w.x + w.w / 2 + 0.0, (SILL + WTOP) / 2, FZ + 0.01])))
  }
  /* the booth behind: back wall, side walls, floor, a ceiling light */
  const innerM = mat(o.inner, { roughness: 0.9, emissive: new THREE.Color(o.inner), emissiveIntensity: 0.35 })
  const cx = (o.x0 + o.x1) / 2
  scene.add(flat(box(o.x1 - o.x0, FH, 0.05, innerM, [cx, FH / 2, BACKZ + 0.04])))
  for (const sx of [o.x0 + 0.025, o.x1 - 0.025]) scene.add(flat(box(0.05, FH, FZ - BACKZ, innerM, [sx, FH / 2, (FZ + BACKZ) / 2])))
  scene.add(flat(box(o.x1 - o.x0, 0.05, FZ - BACKZ, innerM, [cx, FH - 0.03, (FZ + BACKZ) / 2])))
  return { wallM }
}

/** the corridor shared by both T11 cards' everyday look: floor, back wall */
function corridor(scene: THREE.Scene, wall: string, floor: [string, string]) {
  scene.add(floorPlane(12, 7, mat('#ffffff', { map: tileTex(floor[0], floor[1], 4, [12, 7]), roughness: 0.85 }), [0.2, 0, 1.6]))
  scene.add(flat(box(12, 4.6, 0.05, mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.25 }), [0.2, 2.3, BACKZ - 0.05])))
  /* the ceiling with its light panels */
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), mat('#F7F3EC', { roughness: 0.95, emissive: new THREE.Color('#F7F3EC'), emissiveIntensity: 0.35 }))
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(0.2, CEIL, 1.6)
  scene.add(ceil)
  const panel = new THREE.MeshBasicMaterial({ color: '#FFFDF6', toneMapped: false })
  for (const x of [-2.4, -0.6, 1.2, 3.0])
    for (const z of [-0.4, 1.0]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), panel)
      p.rotation.x = Math.PI / 2
      p.position.set(x, CEIL - 0.005, z)
      scene.add(p)
    }
}

/* ------------------------------------------------------------------ T11 everyday: the school corridor */

function setupT11Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F3EEE5')
  setCam(camera, CAM11, AT11, FOV11)
  lights(scene, [0.2, 1.0, -0.6])
  corridor(scene, '#EFE6D6', ['#E9DFCF', '#DACCB6'])

  /* the one office: cream front, navy sign band carrying all three functions */
  officeFront(scene, { x0: LO.x0, x1: LO.x1, wins: [{ x: LO.win, w: LO.ww }], wall: '#F7F1E6', band: C.navy, inner: '#E6EDF8', trim: '#B98A5C' })
  ;(['adm', 'fee', 'exam'] as Fn[]).forEach((fn, k) => {
    const col = fn === 'adm' ? C.adm : fn === 'fee' ? C.fee : C.exam
    scene.add(picture(plaqueTex(fn, col), 0.46, 0.46, [LO.x0 + 0.85 + k * 0.6, FH + BAND / 2, FZ + 0.056]))
  })
  /* the clock over the queue: its hand goes round once a loop (the wait) */
  const clockFace = canvasTex(80, 80, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(40, 40, 38, 0, TAU)
    g.fill()
    g.strokeStyle = C.navy
    g.lineWidth = 4
    g.beginPath()
    g.arc(40, 40, 36, 0, TAU)
    g.stroke()
    g.fillStyle = C.navy
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU
      g.beginPath()
      g.arc(40 + Math.sin(a) * 28, 40 - Math.cos(a) * 28, k % 3 === 0 ? 3 : 1.6, 0, TAU)
      g.fill()
    }
  })
  const CLK: V3 = [-0.85, 2.04, FZ + 0.012]
  scene.add(picture(clockFace, 0.3, 0.3, CLK))
  const handM = mat(C.navy, { roughness: 0.4 })
  const minute = new THREE.Group()
  minute.position.set(CLK[0], CLK[1], CLK[2] + 0.006)
  minute.add(flat(box(0.012, 0.11, 0.006, handM, [0, 0.045, 0])))
  scene.add(minute)
  const hourH = new THREE.Group()
  hourH.position.set(CLK[0], CLK[1], CLK[2] + 0.004)
  hourH.add(flat(box(0.016, 0.07, 0.006, handM, [0, 0.03, 0])))
  scene.add(hourH)
  /* the waiting pile of admission forms on the one counter (the rush) */
  const pileL = makeStack(5, C.adm, C.admDark)
  pileL.rotation.x = -Math.PI / 2
  pileL.position.set(LO.win - 0.15, SILL + 0.045, FZ - 0.2)
  pileL.rotation.z = 0.12
  scene.add(pileL)

  /* the separate offices: white fronts, each with its own coloured band and pictogram */
  const sep = [
    { o: RA, fn: 'adm' as Fn, col: C.adm, tint: '#DCE7FF', wins: [{ x: RA.win, w: RA.ww }] },
    { o: RF, fn: 'fee' as Fn, col: C.fee, tint: '#FFF1D4', wins: [{ x: RF.win1, w: RF.ww }, { x: RF.win2, w: RF.ww }] },
    { o: RE, fn: 'exam' as Fn, col: C.exam, tint: '#EDE4FF', wins: [{ x: RE.win, w: RE.ww }] },
  ]
  for (const s of sep) {
    officeFront(scene, { x0: s.o.x0, x1: s.o.x1, wins: s.wins, wall: '#FBF8F2', band: s.col, inner: s.tint, trim: '#B98A5C' })
    scene.add(picture(plaqueTex(s.fn, s.col), 0.46, 0.46, [s.fn === 'fee' ? RF.win1 : (s.o.x0 + s.o.x1) / 2, FH + BAND / 2, FZ + 0.056]))
  }
  /* the fees office calendar: a page whose top turns gold in fee week (drawn, no words) */
  const calTex = (on: boolean) =>
    canvasTex(80, 80, (g) => {
      rr(g, 4, 8, 72, 68, 8, '#FFFFFF')
      rr(g, 4, 8, 72, 18, 8, on ? C.fee : '#C3CCDD')
      g.fillStyle = '#7A869E'
      for (let k = 0; k < 2; k++) rr(g, 20 + k * 32, 2, 8, 14, 3, '#7A869E')
      for (let r = 0; r < 3; r++)
        for (let q = 0; q < 4; q++) {
          const hot = on && r === 1
          rr(g, 12 + q * 15, 34 + r * 13, 10, 8, 2, hot ? C.fee : '#D5DCE8')
        }
    })
  const calPos: V3 = [SPIKE_X, FH + BAND / 2, FZ + 0.06]
  const calOff = picture(calTex(false), 0.46, 0.46, calPos)
  const calOn = picture(calTex(true), 0.46, 0.46, [calPos[0], calPos[1], calPos[2] + 0.004])
  scene.add(calOff, calOn)
  const calGlow = halo('rgba(242,179,61,0.9)', 0.6)
  calGlow.position.set(calPos[0], calPos[1], calPos[2] - 0.01)
  scene.add(calGlow)

  /* ---- the people ---- */
  const clerkCfg = (base: CharacterConfig, name: string, top: string, o: Partial<Parameters<typeof who>[1]> = {}) => who(base, { name, ...o, outfit: { top: 'blouse', topColor: top as `#${string}`, bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30', ...(o.outfit ?? {}) } })
  const cL = body(clerkCfg(CAST_PRESETS.meera, 'Office Clerk', '#3F8F84', { hair: { style: 'bun', color: 'black' }, accessories: { glasses: 'rect', earrings: true } }), [LO.win, 0, CZ], 1.62)
  const vB1 = body(who(CAST_PRESETS.arjun, { name: 'Parent', hair: { style: 'short', color: 'black' }, outfit: { top: 'kurta', topColor: '#E8DFCC', bottom: 'trousers', bottomColor: '#4A4A55', shoeColor: '#4A3426' }, accessories: { beard: 'short', watch: false, belt: false }, build: { shoulders: 0.94 } }), [LQ.blue1, 0, VZ], 1.68)
  const vB2 = body(who(CAST_PRESETS.riya, { name: 'Parent', hair: { style: 'long', color: 'black' }, outfit: { top: 'kurta', topColor: '#4E8F5A', bottom: 'salwar', bottomColor: '#EDE3CF', shoeColor: '#6B4A2E' }, accessories: { earrings: true, bindi: true } }), [LQ.blue2, 0, VZ], 1.58)
  const vG = body(who(CAST_PRESETS.rohan, { name: 'Parent', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'polo', topColor: '#6B7488', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true, beard: 'none' }, build: { shoulders: 0.94 } }), [LQ.gold, 0, VZ], 1.7)
  const cA = body(clerkCfg(CAST_PRESETS.ananya, 'Clerk', '#C9D8F2', { hair: { style: 'bob', color: 'black' } }), [RA.win, 0, CZ], 1.6)
  const cF1 = body(clerkCfg(CAST_PRESETS.riya, 'Clerk', '#7D9B76', { hair: { style: 'ponytail', color: 'black' } }), [RF.win1, 0, CZ], 1.6)
  const cF2 = body(clerkCfg(CAST_PRESETS.meera, 'Clerk', '#D9824B', { hair: { style: 'wavy', color: 'brown' } }), [RF.hide, 0, CZ], 1.62)
  const vF = body(who(CAST_PRESETS.ananya, { name: 'Parent', hair: { style: 'long', color: 'black' }, outfit: { top: 'blouse', topColor: '#5A7BB5', bottom: 'skirt', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { earrings: true } }), [RF.vis, 0, VZ], 1.6)
  const cE = body(clerkCfg(CAST_PRESETS.ananya, 'Clerk', '#5856DC', { hair: { style: 'braid', color: 'black' } }), [RE.win, 0, CZ], 1.58)

  /* world points the hands go to */
  const lHand = v3([LO.win + LO.ww / 2 + 0.02, SILL + 0.16, FZ + 0.03]) // the parent's hand at the window's jamb
  const lTakeP = v3([LO.win + 0.16, SILL + 0.16, FZ - 0.06]) // the clerk's hand meets it just inside
  const lDesk = v3([LO.win + 0.05, SILL + 0.06, FZ - 0.16]) // the form on the counter in front of her
  const jamb = (x: number, w: number) => v3([x + w / 2 + 0.02, SILL + 0.16, FZ + 0.03])
  const inside = (x: number, w: number) => v3([x + w / 2 - 0.1, SILL + 0.16, FZ - 0.06])
  const fPile = v3([(RF.win1 + RF.win2) / 2, SILL + 0.045, FZ - 0.17])
  const fDone = v3([RF.win2 + 0.13, SILL + 0.045, FZ - 0.17])

  /* ---- arms ---- */
  const stampUp = (b: Body, k: THREE.Vector3, side: 'L' | 'R') => reach(b, side, k.clone().add(new THREE.Vector3(0, 0.16, 0)), camera)
  const stampDown = (b: Body, k: THREE.Vector3, side: 'L' | 'R') => reach(b, side, k.clone().add(new THREE.Vector3(0, 0.05, 0)), camera)
  const hidden: Arm = { s: 4, e: 6 } // below the sill

  /* the one clerk: R hand takes the form and hands it back, L hand stamps (slowly) */
  const cLR = (c: number) =>
    armFrom(c, hidden, [
      [T11.lTake[0], T11.lTake[1], T11.lTake[2], T11.lTake[3], reach(cL, 'R', lTakeP, camera)],
      [T11.lTake[2], T11.lTake[3], T11.lStamps[4] + 0.3, T11.lBack[0], reach(cL, 'R', lDesk.clone().add(new THREE.Vector3(0.12, 0.02, 0)), camera)],
      [T11.lBack[0], T11.lBack[1], T11.lBack[2], T11.lBack[3], reach(cL, 'R', lTakeP, camera)],
    ])
  const cLL = (c: number) => armFrom(c, hidden, stampSpans(T11.lStamps, stampUp(cL, lDesk, 'L'), stampDown(cL, lDesk, 'L')))
  /* the first parent: his L hand gives the form and takes it back; his R hand holds the rest of his forms */
  const b1L = (c: number) =>
    armFrom(c, REST, [
      [T11.lReach[0], T11.lReach[1], T11.lReach[2], T11.lReach[3], reach(vB1, 'L', lHand, camera)],
      [T11.lGet[0], T11.lGet[1], T11.lGet[2], T11.lGet[3], reach(vB1, 'L', lHand, camera)],
    ])
  const chestR = (b: Body, x = 228) => ik('R', b.sh, { x, y: 330 })
  const chestL = (b: Body) => ik('L', b.sh, { x: 172, y: 330 })
  /* the small offices: the clerk writes in her register (L hand, a pen), her R hand on the page */
  const register = (x: number) => v3([x - 0.02, SILL + 0.05, FZ - 0.06])
  const smallArms = (cl: Body, x: number, up: readonly number[]) => {
    const reg = register(x)
    const rest = reach(cl, 'R', reg.clone().add(new THREE.Vector3(0.1, 0.0, 0)), camera)
    return {
      reg,
      up,
      cR: (c: number) => mixArm(rest, hidden, hold(c, up[0], up[1], up[2], up[3])),
      cL: (c: number) => {
        const w = 1 - hold(c, up[0], up[1], up[2], up[3])
        const k = reg.clone().add(new THREE.Vector3(-0.05 + 0.035 * Math.sin((c * TAU * 13) / L11), 0.03 + 0.012 * Math.abs(Math.sin((c * TAU * 27) / L11)), 0))
        return mixArm(hidden, reach(cl, 'L', k, camera), w)
      },
    }
  }
  const aArms = smallArms(cA, RA.win, T11.aUp)
  const eArms = smallArms(cE, RE.win, T11.eUp)
  /* the fees office */
  const fJamb = jamb(RF.win2, RF.ww)
  const fIns = inside(RF.win2, RF.ww)
  const f2At = (c: number) =>
    along(c, [
      [0, 0, RF.hide],
      [T11.f2In[0], T11.f2In[1], RF.win2],
      [T11.f2Out[0], T11.f2Out[1], RF.hide],
    ])
  const f1Times = T11.fStamps.filter((s) => s[1] === 'F1').map((s) => s[0])
  const f2Times = T11.fStamps.filter((s) => s[1] === 'F2').map((s) => s[0])
  const vFL = (c: number) =>
    armFrom(c, chestL(vF), [
      [T11.fGive[0], T11.fGive[1], T11.fGive[2], T11.fGive[3], reach(vF, 'L', fJamb, camera)],
      [T11.fGet[0], T11.fGet[1], T11.fGet[2], T11.fGet[3], reach(vF, 'L', fJamb, camera)],
    ])
  const cF1R = (c: number) => armFrom(c, hidden, stampSpans(f1Times, stampUp(cF1, fPile, 'R'), stampDown(cF1, fPile, 'R')))
  const cF2at = (x: number) => ({ ...cF2, root: new THREE.Vector3(x, 0, CZ) })
  const f2Home = cF2at(RF.win2)
  const cF2L = (c: number) => armFrom(c, hidden, stampSpans(f2Times, stampUp(f2Home, fPile, 'L'), stampDown(f2Home, fPile, 'L')))
  const cF2R = (c: number) =>
    armFrom(c, hidden, [
      [T11.fBack[0] - 0.25, T11.fBack[0], T11.fBack[1] - 0.05, T11.fBack[1] + 0.05, reach(f2Home, 'R', fDone.clone().add(new THREE.Vector3(0, 0.04, 0)), camera)],
      [T11.fBack[1] - 0.05, T11.fBack[1] + 0.05, T11.fBack[2], T11.fBack[3], reach(f2Home, 'R', fIns, camera)],
    ])

  /* ---- poses ---- */
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
  const clerkLook = (p: Pose, _c: number, toVisitor: number, work: number) => {
    lookAt(p, 1, toVisitor)
    lookAt(p, 0, work, 1)
  }
  const poseCL = (p: Pose, c: number) => {
    setArms(p, cLL(c), cLR(c))
    clerkLook(p, c, Math.max(hold(c, 0.1, 0.4, 1.2, 1.5), hold(c, 6.0, 6.3, 7.4, 7.7)), hold(c, 1.4, 1.7, 5.9, 6.2))
  }
  const poseB1 = (p: Pose, c: number) => {
    setArms(p, b1L(c), chestR(vB1, 214))
    lookAt(p, -1, 1)
    lookAt(p, -1, hold(c, 1.6, 1.9, 5.8, 6.1), 0.6)
  }
  const poseB2 = (p: Pose, c: number) => {
    setArms(p, chestL(vB2), REST)
    lookAt(p, -1, 1)
    to(p, 'headTilt', -4, hold(c, 2.5, 3.0, 5.5, 6.0))
  }
  const watchArm = (b: Body) => ik('L', b.sh, { x: 196, y: 318 })
  const poseG = (p: Pose, c: number) => {
    const w = hold(c, T11.watch[0], T11.watch[1], T11.watch[2], T11.watch[3])
    setArms(p, mixArm(REST, watchArm(vG), w), REST)
    lookAt(p, -1, 1 - w)
    lookAt(p, -0.2, w, 1)
    const s = hold(c, T11.sigh[0], T11.sigh[1], T11.sigh[2], T11.sigh[3])
    to(p, 'headTilt', 6, s)
    to(p, 'mouthOpen', 0.25, s)
  }
  const poseSmallClerk = (arms: ReturnType<typeof smallArms>) => (p: Pose, c: number) => {
    setArms(p, arms.cL(c), arms.cR(c))
    const up = hold(c, arms.up[0], arms.up[1], arms.up[2], arms.up[3])
    lookAt(p, 0, 1 - up, 1)
    lookAt(p, 0.3, up)
  }
  const poseF1 = (p: Pose, c: number) => {
    setArms(p, hidden, cF1R(c))
    const busy = hold(c, 1.9, 2.1, 4.4, 4.7)
    clerkLook(p, c, hold(c, 1.0, 1.2, 1.9, 2.1), busy)
    to(p, 'headTurn', 0.3, busy)
    to(p, 'lookX', 0.6, busy)
  }
  const poseF2 = (p: Pose, c: number) => {
    const at = f2At(c)
    setArms(p, { s: cF2L(c).s + swing(c, at.walking), e: cF2L(c).e }, cF2R(c))
    walkLegs(p, c, at.walking, at.dir)
    const work = hold(c, 3.55, 3.7, 4.75, 4.9)
    lookAt(p, -0.6, work, 1)
    lookAt(p, 1, hold(c, 4.95, 5.1, 6.1, 6.3))
  }
  const poseVF = (p: Pose, c: number) => {
    setArms(p, vFL(c), REST)
    lookAt(p, -1, 0.9)
  }

  /* expressions */
  const people = [
    person({ config: cL.cfg, dress: withNeck(LANYARD(C.navy)), seed: 111, faces: [[0, 'listening'], [1.4, 'thinking'], [3.3, 'worried'], [6.2, 'neutral']], pose: poseCL, loop: L11, height: cL.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: vB1.cfg, seed: 112, faces: [[0, 'neutral'], [1.5, 'thinking'], [6.9, 'happy']], pose: poseB1, loop: L11, height: vB1.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: vB2.cfg, seed: 113, faces: [[0, 'neutral'], [2.6, 'bored'], [6.0, 'neutral']], pose: poseB2, loop: L11, height: vB2.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: vG.cfg, seed: 114, faces: [[0, 'neutral'], [2.0, 'skeptical'], [3.7, 'worried'], [6.1, 'sad'], [7.6, 'neutral']], pose: poseG, loop: L11, height: vG.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: cA.cfg, dress: withNeck(LANYARD(C.adm)), seed: 116, faces: [[0, 'thinking'], [2.3, 'happy'], [3.6, 'thinking']], pose: poseSmallClerk(aArms), loop: L11, height: cA.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: cF1.cfg, dress: withNeck(LANYARD(C.feeDark)), seed: 118, faces: [[0, 'happy'], [2.0, 'thinking'], [4.8, 'happy']], pose: poseF1, loop: L11, height: cF1.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: cF2.cfg, dress: withNeck(LANYARD(C.feeDark)), seed: 119, faces: [[0, 'happy'], [3.6, 'thinking'], [5.0, 'happy']], pose: poseF2, loop: L11, height: cF2.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: vF.cfg, seed: 120, faces: [[0, 'neutral'], [2.2, 'thinking'], [5.9, 'happy']], pose: poseVF, loop: L11, height: vF.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
    person({ config: cE.cfg, dress: withNeck(LANYARD(C.exam)), seed: 121, faces: [[0, 'thinking'], [5.7, 'happy'], [7.0, 'thinking']], pose: poseSmallClerk(eArms), loop: L11, height: cE.h, frames: F11, redraw, holdT: devHold(HOLD11) }),
  ]
  const bodies = [cL, vB1, vB2, vG, cA, cF1, cF2, vF, cE]
  people.forEach((s, k) => {
    s.object.position.copy(bodies[k].root)
    scene.add(s.object)
  })
  const f2Sprite = people[6]
  const clk = slideClock('T11', scene, devHold(HOLD11), people)

  /* ---- props ---- */
  const fLform = makeFolder(C.adm, C.admDark) // the one form the one clerk works on
  const stampL = makeStamp('#2F3A52')
  const b1Stack = makeStack(3, C.adm, C.admDark)
  const b2Stack = makeStack(3, C.adm, C.admDark)
  const gForm = makeFolder(C.fee, C.feeDark)
  /* the registers: an open book on each small counter, a pen in each clerk's hand */
  const makeRegister = (cover: string) => {
    const g = new THREE.Group()
    g.add(box(0.3, 0.014, 0.2, mat(cover, { roughness: 0.5 }), [0, 0, 0], 0.004))
    const pageTex = canvasTex(120, 80, (q) => {
      rr(q, 0, 0, 120, 80, 4, '#FFFFFF')
      q.fillStyle = '#E2E6EE'
      q.fillRect(59, 0, 2, 80)
      for (let r = 0; r < 6; r++) {
        rr(q, 8, 10 + r * 11, 44 - (r % 3) * 8, 3, 1.5, '#AEB8CC')
        rr(q, 68, 10 + r * 11, 40 - ((r + 1) % 3) * 8, 3, 1.5, '#AEB8CC')
      }
    })
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.186), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.85 }))
    page.rotation.x = -Math.PI / 2
    page.position.y = 0.0075
    g.add(page)
    return g
  }
  const regA = makeRegister(C.adm)
  regA.position.copy(aArms.reg)
  regA.position.y = SILL + 0.047
  regA.rotation.y = 0.08
  const regE = makeRegister(C.exam)
  regE.position.copy(eArms.reg)
  regE.position.y = SILL + 0.047
  regE.rotation.y = -0.06
  const makePen = () => {
    const g = new THREE.Group()
    g.add(cyl(0.008, 0.008, 0.12, mat(C.navy, { roughness: 0.3 }), [0, 0.05, 0], 10))
    g.add(cyl(0.002, 0.008, 0.02, mat('#C9D0DC', { metalness: 0.6, roughness: 0.3 }), [0, -0.02, 0], 10))
    return g
  }
  const penA = makePen()
  const penE = makePen()
  const stampF1 = makeStamp('#2F3A52')
  const stampF2 = makeStamp('#2F3A52')
  const fForms = Array.from({ length: 5 }, () => makeFolder(C.fee, C.feeDark))
  scene.add(fLform, stampL, b1Stack, b2Stack, gForm, regA, regE, penA, penE, stampF1, stampF2, ...fForms)

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const upright = (o: THREE.Object3D, tilt = 0) => {
    o.quaternion.copy(camera.quaternion)
    o.rotateZ(tilt)
  }
  const QFLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.1))
  const layFlat = (o: THREE.Object3D, k: number) => o.quaternion.slerp(QFLAT, k)
  const stampAt = (st: THREE.Object3D, bd: Body, arm: Arm, side: 'L' | 'R') => {
    handWorld(side, bd.sh, arm, bd.h, bd.root, camera, st.position)
    st.position.y -= 0.05
    st.quaternion.identity()
  }
  const penAt = (pen: THREE.Object3D, bd: Body, arm: Arm) => {
    handWorld('L', bd.sh, arm, bd.h, bd.root, camera, pen.position)
    pen.position.y -= 0.02
    pen.quaternion.copy(camera.quaternion)
    pen.rotateZ(0.5)
  }

  return (t: number) => {
    const c = mod(clk.time(t), L11)
    const cq = frameT(c, L11, F11)
    const f2 = f2At(c)
    cF2.root.set(f2.x, bob(f2.walking, c), CZ)
    f2Sprite.object.position.copy(cF2.root)
    people.forEach((s) => s.update(c, camera))

    /* the clock hand: once round a loop */
    minute.rotation.z = -(c / L11) * TAU
    hourH.rotation.z = -(c / L11) * (TAU / 12) - 1.2

    /* the one form: parent -> clerk -> counter (stamped, slowly) -> clerk -> parent */
    const b1H: Place = (o) => handWorld('L', vB1.sh, b1L(cq), vB1.h, vB1.root, camera, o)
    const cLH: Place = (o) => handWorld('R', cL.sh, cLR(cq), cL.h, cL.root, camera, o)
    const lD: Place = (o) => o.copy(lDesk)
    const keysL: [number, number, Place][] = [
      [T11.lReach[1] - 0.05, T11.lTake[2], cLH],
      [T11.lTake[2] + 0.02, T11.lTake[3], lD],
      [T11.lBack[0] + 0.05, T11.lBack[1], cLH],
      [T11.lBack[1] + 0.02, T11.lGet[2], b1H],
    ]
    const iL = track(c, keysL, fLform.position, tmp)
    upright(fLform, 0.1)
    layFlat(fLform, iL === 2 ? 1 : iL === 1.5 ? seg(c, keysL[1][0], keysL[1][1]) : iL === 2.5 ? 1 - seg(c, keysL[2][0], keysL[2][1]) : 0)
    ;(markOf(fLform).material as THREE.MeshBasicMaterial).opacity = seg(c, T11.lStamps[0] - 0.03, T11.lStamps[0]) * (1 - seg(c, 8.2, 8.7))
    stampAt(stampL, cL, cLL(cq), 'L')
    /* the parents' held forms */
    handWorld('R', vB1.sh, chestR(vB1, 214), vB1.h, vB1.root, camera, b1Stack.position)
    upright(b1Stack, -0.15)
    handWorld('L', vB2.sh, chestL(vB2), vB2.h, vB2.root, camera, b2Stack.position)
    upright(b2Stack, 0.15)
    handWorld('R', vG.sh, REST, vG.h, vG.root, camera, gForm.position)
    gForm.position.y += 0.06
    upright(gForm, 0.05)

    /* the small offices */
    penAt(penA, cA, aArms.cL(cq))
    penAt(penE, cE, eArms.cL(cq))

    /* fee week */
    const week = hold(c, T11.week[0], T11.week[1], T11.week[2], T11.week[3])
    setOp(calOn, week)
    setOp(calGlow, week * (0.55 + 0.25 * Math.sin(c * TAU * 1.1)))
    stampAt(stampF1, cF1, cF1R(cq), 'R')
    const f2arm = cF2L(cq)
    stampAt(stampF2, { ...cF2, root: cF2.root }, f2arm, 'L')
    /* the fee forms: in her arms, slid onto the sill as a pile, each stamped and moved to the done pile, handed back */
    const vFH = (o: THREE.Vector3) => handWorld('L', vF.sh, vFL(cq), vF.h, vF.root, camera, o)
    const f2H = (o: THREE.Vector3) => handWorld('R', cF2.sh, cF2R(cq), cF2.h, f2Home.root, camera, o)
    fForms.forEach((f, k) => {
      const ev = T11.fStamps[4 - k][0] // the top form (k=4) goes first
      const inPile = (o: THREE.Vector3) => o.copy(fPile).add(tmp.set(0, k * 0.024, 0))
      const inDone = (o: THREE.Vector3) => o.copy(fDone).add(tmp.set(0, (4 - k) * 0.024, 0))
      const inHand = (o: THREE.Vector3) => vFH(o).add(tmp.set(k * 0.004, k * 0.006, -k * 0.02))
      const inF2 = (o: THREE.Vector3) => f2H(o).add(tmp.set(k * 0.004, k * 0.006, -k * 0.02))
      const keys: [number, number, Place][] = [
        [T11.fSlide[0], T11.fSlide[1], inPile],
        [ev + 0.08, ev + 0.4, inDone],
        [T11.fBack[1] - 0.05, T11.fBack[1] + 0.05, inF2],
        [T11.fBack[2], T11.fGet[2], inHand],
      ]
      const i = track(c, keys, f.position, b, 0.07)
      upright(f, 0.08)
      const flatK = i === 1 || i === 2 ? 1 : i === 0.5 ? seg(c, keys[0][0], keys[0][1]) : i === 1.5 ? 1 : i === 2.5 ? 1 - seg(c, keys[2][0], keys[2][1]) : 0
      layFlat(f, flatK)
      ;(markOf(f).material as THREE.MeshBasicMaterial).opacity = seg(c, ev - 0.03, ev) * (1 - seg(c, T11.fGet[3], T11.fGet[3] + 0.5))
    })
    void a
  }
}

/* ------------------------------------------------------------------ T11 concept: one monolith, or separate services */

/** a token: a glossy rounded cube in a function's colour with its pictogram on the front (a request) */
const tokenTex = (fn: Fn) =>
  canvasTex(64, 64, (g) => {
    glyph(g, fn, 32, 34, 40, '#FFFFFF')
  })
function makeToken(fn: Fn, s = 0.15) {
  const col = fn === 'adm' ? C.adm : fn === 'fee' ? C.fee : C.exam
  const g = new THREE.Group()
  g.add(box(s, s, s, mat(col, { roughness: 0.25, metalness: 0.05, emissive: new THREE.Color(col), emissiveIntensity: 0.18 }), [0, 0, 0], s * 0.22))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.78, s * 0.78), basic(tokenTex(fn)))
  face.position.z = s / 2 + 0.002
  g.add(face)
  return g
}
/** a core: a navy porthole, a lit ring and a turning gear (the work a block does) */
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

const CORE_Y = 1.8

function setupT11Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM11, AT11, FOV11)
  lights(scene, [0.2, 1.0, -0.6])
  scene.add(floorPlane(12, 7, mat('#ffffff', { map: tileTex('#E3EAF8', '#C9D5EC', 4, [12, 7]), roughness: 0.8 }), [0.2, 0, 1.6]))
  scene.add(flat(box(12, 4.6, 0.05, mat('#EEF2FA', { roughness: 0.95, emissive: new THREE.Color('#EEF2FA'), emissiveIntensity: 0.3 }), [0.2, 2.3, BACKZ - 0.05])))
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), mat('#F4F7FD', { roughness: 0.95, emissive: new THREE.Color('#F4F7FD'), emissiveIntensity: 0.35 }))
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(0.2, CEIL, 1.6)
  scene.add(ceil)
  const panel = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false })
  for (const x of [-2.4, -0.6, 1.2, 3.0])
    for (const z of [-0.4, 1.0]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), panel)
      p.rotation.x = Math.PI / 2
      p.position.set(x, CEIL - 0.005, z)
      scene.add(p)
    }

  const ledgeM = mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.3 })
  const bodyOf = (tint: string) => mat(tint, { roughness: 0.35, metalness: 0.0, emissive: new THREE.Color(tint), emissiveIntensity: 0.22 })
  /** a block: a body from the floor to FH on the office's footprint, a coloured band, a ledge at sill height */
  const block = (x0: number, x1: number, band: string, tint: string, z = FZ - 0.3) => {
    const g = new THREE.Group()
    g.add(box(x1 - x0, FH, 0.6, bodyOf(tint), [(x0 + x1) / 2, FH / 2, z], 0.05))
    g.add(box(x1 - x0 + 0.02, BAND, 0.64, mat(band, { roughness: 0.4 }), [(x0 + x1) / 2, FH + BAND / 2, z], 0.05))
    scene.add(g)
    return g
  }
  const ledge = (x: number, w: number) => scene.add(box(w, 0.045, 0.34, ledgeM, [x, SILL + 0.022, FZ + 0.08], 0.012))

  /* the monolith: one block on the one office's footprint, its three modules on its band, one core */
  block(LO.x0, LO.x1, C.navy, '#9FB2E8')
  const mods: THREE.Mesh[] = []
  ;(['adm', 'fee', 'exam'] as Fn[]).forEach((fn, k) => {
    const col = fn === 'adm' ? C.adm : fn === 'fee' ? C.fee : C.exam
    const m = picture(plaqueTex(fn, col), 0.46, 0.46, [LO.x0 + 0.85 + k * 0.6, FH + BAND / 2, FZ + 0.022])
    scene.add(m)
    mods.push(m)
  })
  /* the admissions module overheating: an orange glow behind its plaque */
  const hot = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.285, 48), new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0, toneMapped: false }))
  hot.position.set(LO.x0 + 0.85, FH + BAND / 2, FZ + 0.03)
  scene.add(hot)
  const coreL = makeCore(0.25, C.adm)
  coreL.g.position.set(LO.win, CORE_Y, FZ + 0.005)
  scene.add(coreL.g)
  ledge(LO.win, LO.ww + 0.1)
  const backlog = new THREE.Group()
  for (let k = 0; k < 3; k++) {
    const tk = makeToken('adm', 0.13)
    tk.position.set(0, k * 0.135, 0)
    backlog.add(tk)
  }
  backlog.position.set(LO.win - 0.17, SILL + 0.11, FZ + 0.1)
  scene.add(backlog)
  /* the wait dial over the queue (in the clock's place): an orange arc that sweeps round once a loop */
  const dialTex = canvasTex(80, 80, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(40, 40, 38, 0, TAU)
    g.fill()
    g.strokeStyle = '#DCE4F4'
    g.lineWidth = 9
    g.beginPath()
    g.arc(40, 40, 26, 0, TAU)
    g.stroke()
  })
  const CLK: V3 = [-0.85, 2.04, FZ + 0.012]
  scene.add(picture(dialTex, 0.34, 0.34, CLK))
  const arcM = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false, side: THREE.DoubleSide })
  const arc = new THREE.Mesh(new THREE.RingGeometry(0.094, 0.128, 32, 1, Math.PI / 2 - 1.3, 1.3), arcM)
  arc.position.set(CLK[0], CLK[1], CLK[2] + 0.004)
  scene.add(arc)

  /* the separate services: one block per office, a core at each window */
  block(RA.x0, RA.x1, C.adm, '#8DB0FF')
  block(RF.x0, RF.win2 - RF.ww / 2 - 0.01, C.fee, '#FFD47E')
  block(RE.x0, RE.x1, C.exam, '#BB9CFF')
  scene.add(picture(plaqueTex('adm', C.adm), 0.46, 0.46, [(RA.x0 + RA.x1) / 2, FH + BAND / 2, FZ + 0.022]))
  scene.add(picture(plaqueTex('fee', C.fee), 0.46, 0.46, [RF.win1, FH + BAND / 2, FZ + 0.022]))
  scene.add(picture(plaqueTex('exam', C.exam), 0.46, 0.46, [(RE.x0 + RE.x1) / 2, FH + BAND / 2, FZ + 0.022]))
  const coreA = makeCore(0.2, C.adm)
  coreA.g.position.set(RA.win, CORE_Y, FZ + 0.005)
  const coreE = makeCore(0.2, C.exam)
  coreE.g.position.set(RE.win, CORE_Y, FZ + 0.005)
  const coreF = makeCore(0.2, C.fee)
  coreF.g.position.set(RF.win1, CORE_Y, FZ + 0.005)
  scene.add(coreA.g, coreE.g, coreF.g)
  ledge(RA.win, RA.ww)
  ledge(RE.win, RE.ww)
  ledge((RF.win1 + RF.win2) / 2, RF.ww * 2 + 0.04)
  /* the copy of the fees service: the same block, band, pictogram and core, splitting off into the second place */
  const copy = new THREE.Group()
  const cw = RF.ww + 0.02
  copy.add(box(cw, FH, 0.6, bodyOf('#FFD47E'), [0, FH / 2, 0], 0.05))
  copy.add(box(cw + 0.02, BAND, 0.64, mat(C.fee, { roughness: 0.4 }), [0, FH + BAND / 2, 0], 0.05))
  const copyPlaque = picture(plaqueTex('fee', C.fee), 0.46, 0.46, [0, FH + BAND / 2, 0.322])
  copy.add(copyPlaque)
  const coreF2 = makeCore(0.2, C.fee)
  coreF2.g.position.set(0, CORE_Y, 0.305)
  copy.add(coreF2.g)
  scene.add(copy)
  /* the burst, in the calendar's place: a request-count spike that lights gold in fee week */
  const spikeTex = (on: boolean) =>
    canvasTex(80, 80, (g) => {
      rr(g, 4, 4, 72, 72, 12, '#FFFFFF')
      g.strokeStyle = on ? C.feeDark : '#AEB8CC'
      g.lineWidth = 5
      g.lineJoin = 'round'
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(14, 58)
      g.lineTo(28, 54)
      g.lineTo(36, 57)
      g.lineTo(44, 20)
      g.lineTo(52, 50)
      g.lineTo(66, 54)
      g.stroke()
    })
  const spikePos: V3 = [SPIKE_X, FH + BAND / 2, FZ - 0.2]
  scene.add(box(0.46, 0.46, 0.06, mat('#DCE4F4', { roughness: 0.4 }), [SPIKE_X, FH + BAND / 2, FZ - 0.25], 0.03))
  const spikeOff = picture(spikeTex(false), 0.4, 0.4, spikePos)
  const spikeOn = picture(spikeTex(true), 0.4, 0.4, [spikePos[0], spikePos[1], spikePos[2] + 0.004])
  scene.add(spikeOff, spikeOn)

  /* the requests, where the people stand */
  const TY = 1.12 // a request floats at hand height
  const b1Stack = new THREE.Group()
  for (let k = 0; k < 2; k++) {
    const tk = makeToken('adm', 0.18)
    tk.position.set(0, k * 0.185, 0)
    b1Stack.add(tk)
  }
  b1Stack.position.set(LQ.blue1 + 0.05, TY - 0.05, VZ)
  const b2Stack = new THREE.Group()
  for (let k = 0; k < 3; k++) {
    const tk = makeToken('adm', 0.18)
    tk.position.set(0, k * 0.185, 0)
    b2Stack.add(tk)
  }
  b2Stack.position.set(LQ.blue2, TY - 0.05, VZ)
  const gTok = makeToken('fee', 0.22)
  gTok.position.set(LQ.gold, TY, VZ)
  const one = makeToken('adm', 0.18) // the one request the monolith works on
  scene.add(b1Stack, b2Stack, gTok, one)
  /* waiting: orange rings round the requests nobody serves */
  const waitRing = (x: number, s = 1) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.2 * s, 0.02, 10, 48), new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0.9, toneMapped: false }))
    r.position.set(x, TY + 0.0, VZ - 0.02)
    scene.add(r)
    return r
  }
  const wG = waitRing(LQ.gold)
  const wB2 = waitRing(LQ.blue2, 1.6)
  wB2.position.y = TY + 0.135
  /* the fee requests */
  const fToks = Array.from({ length: 5 }, () => makeToken('fee', 0.12))
  const PILE: [number, number][] = [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1]]
  fToks.forEach((f) => scene.add(f))

  /* a pseudo person: this card has none, the clock still waits for the other card's */
  const clk = slideClock('T11', scene, devHold(HOLD11), [{ ready: Promise.resolve() }])

  const tmp = new THREE.Vector3()
  const fPile = v3([RF.win1 + 0.03, SILL + 0.105, FZ + 0.1])
  const fDone = v3([RF.win2 + 0.03, SILL + 0.105, FZ + 0.1])
  const fHome = v3([RF.vis, TY - 0.2, VZ])
  const flash = (c: number, times: readonly number[]) => times.reduce((m, t) => Math.max(m, hold(c, t - 0.06, t, t + 0.05, t + 0.35)), 0)
  const f1Times = T11.fStamps.filter((s) => s[1] === 'F1').map((s) => s[0])
  const f2Times = T11.fStamps.filter((s) => s[1] === 'F2').map((s) => s[0])
  return (t: number) => {
    const c = mod(clk.time(t), L11)
    /* the monolith: its admissions module hot, its core turning slowly and pulsing on each step of the one request */
    const busy = hold(c, T11.lTake[2], T11.lTake[3], T11.lBack[0], T11.lBack[1])
    setOp(hot, (0.5 + 0.5 * busy) * (0.7 + 0.3 * Math.sin((c * TAU * 9) / L11)))
    coreL.gear.rotation.z = -(c / L11) * TAU - 0.1 * Math.sin((c * TAU * 18) / L11)
    coreL.ringM.color.set(C.adm).lerp(new THREE.Color(C.orange), 0.75 * busy)
    coreL.ringM.emissive.copy(coreL.ringM.color)
    coreL.ringM.emissiveIntensity = 0.5 + 1.2 * flash(c, T11.lStamps)
    /* the one request: from the first in the line into the core, held on the ledge, back */
    const out = v3([LQ.blue1 + 0.05, TY + 0.32, VZ])
    const inCore = v3([LO.win + 0.08, SILL + 0.135, FZ + 0.1])
    const keys: [number, number, Place][] = [
      [T11.lReach[1] - 0.05, T11.lTake[3], (o) => o.copy(inCore)],
      [T11.lBack[0] + 0.05, T11.lGet[2], (o) => o.copy(out)],
    ]
    track(c, keys, one.position, tmp, 0.12)
    one.rotation.y = 0.2 * Math.sin(c * TAU * (2 / L11))
    /* the queue: still, bobbing a little; the unserved ones ringed in orange */
    const bobY = (k: number) => 0.012 * Math.sin((c * TAU * 3) / L11 + k)
    b1Stack.position.y = TY - 0.05 + bobY(0)
    b2Stack.position.y = TY - 0.05 + bobY(1)
    gTok.position.y = TY + bobY(2)
    const pulse = 0.75 + 0.25 * Math.sin((c * TAU * 8) / L11)
    for (const r of [wG, wB2]) setOp(r, pulse)
    wG.position.y = gTok.position.y
    /* the wait dial: an orange arc that sweeps round once a loop (the clock's hand) */
    arc.rotation.z = -(c / L11) * TAU

    /* the small services: calm, turning steadily */
    coreA.gear.rotation.z = -(c / L11) * TAU * 4
    coreE.gear.rotation.z = -(c / L11) * TAU * 4 + 0.4
    coreA.ringM.emissiveIntensity = 0.6 + 0.5 * hold(c, T11.aUp[0], T11.aUp[1], T11.aUp[2], T11.aUp[3])
    coreE.ringM.emissiveIntensity = 0.6 + 0.5 * hold(c, T11.eUp[0], T11.eUp[1], T11.eUp[2], T11.eUp[3])

    /* fee week: the burst of requests, the copy splitting off, the two clearing them, the copy folding back */
    const split = seg(c, T11.f2In[0], T11.f2In[1]) * (1 - seg(c, T11.f2Out[0], T11.f2Out[1]))
    copy.visible = split > 0.01
    copy.position.set(lerp(RF.win1, RF.win2, split), 0, FZ - 0.3 + 0.001)
    copy.scale.set(lerp(0.4, 1, split), 1, 1)
    setOp(spikeOn, hold(c, T11.week[0], T11.week[1], T11.week[2], T11.week[3]))
    coreF.gear.rotation.z = -(c / L11) * TAU * 4
    coreF2.gear.rotation.z = -(c / L11) * TAU * 4 + 0.6
    coreF.ringM.emissiveIntensity = 0.6 + 1.2 * flash(c, f1Times)
    coreF2.ringM.emissiveIntensity = 0.6 + 1.2 * flash(c, f2Times)
    fToks.forEach((f, kk) => {
      const ev = T11.fStamps[4 - kk][0]
      const home = (o: THREE.Vector3) => o.copy(fHome).add(tmp.set(0, kk * 0.125, 0))
      const keysF: [number, number, Place][] = [
        [T11.fSlide[0], T11.fSlide[1], (o) => o.copy(fPile).add(tmp.set(PILE[kk][0] * 0.125, PILE[kk][1] * 0.122, 0))],
        [ev + 0.08, ev + 0.4, (o) => o.copy(fDone).add(tmp.set(PILE[4 - kk][0] * 0.125, PILE[4 - kk][1] * 0.122, 0))],
        [T11.fGet[0], T11.fGet[2], home],
      ]
      track(c, keysF, f.position, tmp.clone(), 0.08)
    })
  }
}

/* ================================================================== T15 · two hotels: a shared system, or a memory */

const L15 = 9
const F15 = 108
const HOLD15 = 4.2 /* hotel A's guest already helped; hotel B's guest waiting on the one who knows her, the free one ignored */
const CAM15: V3 = [0.06, 5.1, 7.25]
const AT15: V3 = [0.06, 1.12, -0.25]
const FOV15 = 34
const DESK = 0.86
const DZF = -0.72 // the desk's front
const DZB = -1.17 // its back
const RZ = -1.3 // the receptionists
const WALLZ = -1.72
const GZ = 1.1 // the guests' path through the lobby, well in front of the desks
const DIV = -0.1
const HA = { x0: -2.98, x1: -1.02, r1: -2.48, r2: -1.52, screen: -2.0 }
const HB = { x0: 0.44, x1: 2.4, r4: 0.9, r3: 1.94 }
const GA = { start: -0.45, stop: -1.08 }
const GB = { start: 2.32, stop: 0.42 }
const T15 = {
  aIn: [0.2, 1.05] as const,
  aRead: [1.25, 1.5, 2.5, 2.75] as const, // the free receptionist reads the central system
  pulse: [1.45, 2.05] as const,
  aHelp: [2.6, 2.85, 3.6, 3.85] as const, // she shows the way (palm out)
  aOut: [7.85, 8.75] as const,
  bIn: [0.2, 2.6] as const,
  offer: [0.9, 1.15, 1.75, 2.0] as const, // the free one offers, as she passes
  shake: [1.1, 1.75] as const,
  watch: [3.4, 3.7, 4.45, 4.75] as const,
  shrug: [2.6, 2.85, 3.3, 3.55] as const,
  hangUp: [5.15, 5.55] as const,
  bRead: [5.6, 5.85, 6.5, 6.75] as const, // she remembers (the bubble lights)
  bHelp: [6.55, 6.8, 7.4, 7.65] as const,
  bOut: [7.7, 8.95] as const,
  reCall: [8.55, 8.95] as const, // the phone again
}
const gAat = (c: number) => along(c, [[0, 0, GA.start], [T15.aIn[0], T15.aIn[1], GA.stop], [T15.aOut[0], T15.aOut[1], GA.start]])
const gBat = (c: number) => along(c, [[0, 0, GB.start], [T15.bIn[0], T15.bIn[1], GB.stop], [T15.bOut[0], T15.bOut[1], GB.start]])

/** a thought bubble with a guest card in it (what a receptionist remembers) */
const bubbleTex = (color: string) =>
  canvasTex(120, 120, (g) => {
    g.fillStyle = '#FFFFFF'
    g.strokeStyle = '#C9D3E6'
    g.lineWidth = 2.5
    const blobs: [number, number, number][] = [[60, 50, 40], [30, 56, 24], [90, 56, 24], [44, 30, 22], [78, 30, 22]]
    g.beginPath()
    for (const [x, y, r] of blobs) {
      g.moveTo(x + r, y)
      g.arc(x, y, r, 0, TAU)
    }
    g.fill()
    g.beginPath()
    g.arc(34, 98, 9, 0, TAU)
    g.moveTo(22, 113)
    g.arc(18, 113, 5, 0, TAU)
    g.fill()
    rr(g, 34, 30, 52, 40, 7, '#FFFFFF')
    g.strokeStyle = color
    g.lineWidth = 3
    g.beginPath()
    g.roundRect(35.5, 31.5, 49, 37, 6)
    g.stroke()
    g.fillStyle = color
    g.beginPath()
    g.arc(50, 45, 6.5, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(50, 62, 11, 7, 0, Math.PI, 0)
    g.fill()
    rr(g, 62, 40, 17, 4, 2, '#AEB8CC')
    rr(g, 62, 49, 13, 4, 2, '#AEB8CC')
    rr(g, 62, 58, 15, 4, 2, '#AEB8CC')
  })
/** the central computer's screen: its frame, and the guest's record when it is looked up */
const sysTex = (lit: boolean) =>
  canvasTex(160, 100, (g) => {
    g.fillStyle = '#13204A'
    g.fillRect(0, 0, 160, 100)
    for (let r = 0; r < 4; r++)
      for (let q = 0; q < 3; q++) rr(g, 12 + q * 48, 12 + r * 21, 40, 15, 4, lit && r === 1 && q === 1 ? C.guest : '#2E4A8C')
  })
/** a tube along an orthogonal path, and a point travelling it */
function cablePath(pts: V3[]) {
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(v3(pts[i]), v3(pts[i + 1])))
  return path
}
function cable(scene: THREE.Scene, pts: V3[], color: string, r = 0.016) {
  const path = cablePath(pts)
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: new THREE.Color(color), emissiveIntensity: 0.25 })
  for (let i = 0; i < pts.length - 1; i++) {
    const a = v3(pts[i])
    const b = v3(pts[i + 1])
    const len = a.distanceTo(b)
    const t = mesh(new THREE.CylinderGeometry(r, r, len, 10), m)
    t.position.copy(a).add(b).multiplyScalar(0.5)
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    g.add(t)
    g.add(mesh(new THREE.SphereGeometry(r * 1.05, 10, 8), m, pts[i + 1]))
  }
  scene.add(flat(g))
  return { path, m }
}

/** the lobby both T15 cards share: two halves, a pillar between them, the desks */
function lobbies(scene: THREE.Scene, o: { wallA: string; wallB: string; floorA: [string, string]; floorB: [string, string]; desk: string; top: string }) {
  const fa = floorPlane(5, 7, mat('#ffffff', { map: tileTex(o.floorA[0], o.floorA[1], 4, [5, 7]), roughness: 0.85 }), [DIV - 2.5, 0, 1.6])
  const fb = floorPlane(5, 7, mat('#ffffff', { map: tileTex(o.floorB[0], o.floorB[1], 4, [5, 7]), roughness: 0.85 }), [DIV + 2.5, 0, 1.6])
  scene.add(fa, fb)
  scene.add(flat(box(5, 4, 0.05, mat(o.wallA, { roughness: 0.95, emissive: new THREE.Color(o.wallA), emissiveIntensity: 0.25 }), [DIV - 2.5, 2, WALLZ])))
  scene.add(flat(box(5, 4, 0.05, mat(o.wallB, { roughness: 0.95, emissive: new THREE.Color(o.wallB), emissiveIntensity: 0.25 }), [DIV + 2.5, 2, WALLZ])))
  /* the pillar and the line on the floor between the two hotels */
  scene.add(box(0.2, 4, 0.2, mat('#FFFFFF', { roughness: 0.5 }), [DIV, 2, WALLZ + 0.1], 0.02))
  scene.add(flat(box(0.05, 0.006, 7, mat('#9AA6BC', { roughness: 0.6 }), [DIV, 0.003, 1.6])))
  const deskM = mat(o.desk, { roughness: 0.55 })
  const topM = mat(o.top, { roughness: 0.35 })
  for (const [x0, x1] of [[HA.x0, HA.x1], [HB.x0, HB.x1]]) {
    scene.add(box(x1 - x0, DESK - 0.04, DZF - DZB, deskM, [(x0 + x1) / 2, (DESK - 0.04) / 2, (DZF + DZB) / 2], 0.02))
    scene.add(box(x1 - x0 + 0.06, 0.045, DZF - DZB + 0.06, topM, [(x0 + x1) / 2, DESK - 0.02, (DZF + DZB) / 2], 0.012))
  }
}
/** a desk phone: its base on the desk and the handset (moved to the ear by the update) */
function makePhone() {
  const base = new THREE.Group()
  base.add(box(0.16, 0.05, 0.12, mat('#2F3A52', { roughness: 0.4 }), [0, 0.025, 0], 0.012))
  const hand = new THREE.Group()
  hand.add(box(0.035, 0.16, 0.035, mat('#2F3A52', { roughness: 0.4 }), [0, 0, 0], 0.012))
  hand.add(box(0.05, 0.04, 0.045, mat('#2F3A52', { roughness: 0.4 }), [0, 0.07, 0.01], 0.01))
  hand.add(box(0.05, 0.04, 0.045, mat('#2F3A52', { roughness: 0.4 }), [0, -0.07, 0.01], 0.01))
  return { base, hand }
}

/* ------------------------------------------------------------------ T15 everyday: two hotel lobbies */

function setupT15Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F1EDE6')
  setCam(camera, CAM15, AT15, FOV15)
  lights(scene, [0, 1.0, -0.4])
  lobbies(scene, { wallA: '#E7EEF9', wallB: '#E9F3EF', floorA: ['#EAE3D6', '#DCD2C0'], floorB: ['#EAE3D6', '#DCD2C0'], desk: '#8C5E3C', top: '#F4EDE2' })
  /* each hotel's emblem on its wall (a shape, no name) */
  const emblem = (color: string, star: boolean) =>
    canvasTex(80, 80, (g) => {
      g.fillStyle = color
      g.beginPath()
      if (star) {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU - Math.PI / 2
          const r = k % 2 ? 15 : 34
          g.lineTo(40 + Math.cos(a) * r, 42 + Math.sin(a) * r)
        }
      } else {
        g.ellipse(40, 40, 18, 32, 0.6, 0, TAU)
      }
      g.fill()
    })
  scene.add(picture(emblem('#2D63FB', true), 0.42, 0.42, [-0.6, 2.2, WALLZ + 0.03]))
  scene.add(picture(emblem('#14B8A6', false), 0.42, 0.42, [HB.x1 + 0.45, 2.2, WALLZ + 0.03]))

  /* hotel A: the central computer on the wall between the two receptionists, wired to a terminal at each end */
  const sx = HA.screen
  scene.add(box(0.62, 0.42, 0.05, mat('#1F2E63', { roughness: 0.3 }), [sx, 1.95, WALLZ + 0.05], 0.015))
  const sysOff = picture(sysTex(false), 0.56, 0.36, [sx, 1.95, WALLZ + 0.08])
  const sysOn = picture(sysTex(true), 0.56, 0.36, [sx, 1.95, WALLZ + 0.082])
  scene.add(sysOff, sysOn)
  const term = (x: number) => {
    const g = new THREE.Group()
    g.add(box(0.07, 0.04, 0.07, mat('#3E4656'), [0, 0.02, 0]))
    g.add(box(0.03, 0.1, 0.03, mat('#3E4656'), [0, 0.08, 0]))
    g.add(box(0.26, 0.18, 0.025, mat('#1F2E63', { roughness: 0.3 }), [0, 0.2, 0], 0.01))
    g.position.set(x, DESK, (DZF + DZB) / 2 - 0.05)
    g.rotation.y = x < sx ? 0.5 : -0.5
    scene.add(g)
    return g
  }
  term(HA.x0 + 0.18)
  term(HA.x1 - 0.18)
  const tScreen = (x: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ color: '#2E4A8C', toneMapped: false }))
    const g = new THREE.Group()
    g.position.set(x, DESK + 0.2, (DZF + DZB) / 2 - 0.05)
    g.rotation.y = x < sx ? 0.5 : -0.5
    m.position.z = 0.014
    g.add(m)
    scene.add(g)
    return m
  }
  tScreen(HA.x0 + 0.18)
  const t2 = tScreen(HA.x1 - 0.18)
  const CY = 2.32
  const cabL = cable(scene, [[sx - 0.18, 2.16, WALLZ + 0.04], [sx - 0.18, CY, WALLZ + 0.04], [HA.x0 + 0.18, CY, WALLZ + 0.04], [HA.x0 + 0.18, DESK + 0.02, WALLZ + 0.04], [HA.x0 + 0.18, DESK + 0.02, (DZF + DZB) / 2 - 0.05]], '#7FA6FF')
  const cabR = cable(scene, [[sx + 0.18, 2.16, WALLZ + 0.04], [sx + 0.18, CY, WALLZ + 0.04], [HA.x1 - 0.18, CY, WALLZ + 0.04], [HA.x1 - 0.18, DESK + 0.02, WALLZ + 0.04], [HA.x1 - 0.18, DESK + 0.02, (DZF + DZB) / 2 - 0.05]], '#7FA6FF')
  void cabL
  const dot = mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: C.guest, toneMapped: false }))
  scene.add(dot)
  const dotHalo = halo('rgba(228,87,143,0.9)', 0.3)
  scene.add(dotHalo)

  /* hotel B: no central computer; each receptionist's own memory, a bubble over her */
  const bubB4 = picture(bubbleTex(C.guest), 0.6, 0.6, [HB.r4 - 0.38, 2.18, RZ])
  const bubB3 = picture(bubbleTex(C.other), 0.6, 0.6, [HB.r3 + 0.38, 2.18, RZ])
  bubB3.scale.x = -1
  scene.add(bubB4, bubB3)
  const bubGlow = halo('rgba(228,87,143,0.85)', 0.75)
  bubGlow.position.set(HB.r4 - 0.38, 2.2, RZ - 0.02)
  scene.add(bubGlow)

  /* the phones */
  const p1 = makePhone()
  p1.base.position.set(HA.r1 - 0.26, DESK, DZF - 0.12)
  const p4 = makePhone()
  p4.base.position.set(HB.r4 - 0.26, DESK, DZF - 0.12)
  scene.add(p1.base, p1.hand, p4.base, p4.hand)

  /* people */
  const R1 = body(who(CAST_PRESETS.riya, { name: 'Receptionist', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#F4F6FA', bottom: 'skirt', bottomColor: '#1F2E63', shoeColor: '#1F2E63' }, accessories: { earrings: true } }), [HA.r1, 0, RZ], 1.6)
  const R2 = body(who(CAST_PRESETS.dev, { name: 'Receptionist', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#1F2E63', shoeColor: '#1F2433' }, accessories: { glasses: 'none', watch: false }, build: { shoulders: 0.95 } }), [HA.r2, 0, RZ], 1.68)
  const R4 = body(who(CAST_PRESETS.meera, { name: 'Receptionist', hair: { style: 'ponytail', color: 'brown' }, outfit: { top: 'blouse', topColor: '#F4F6FA', bottom: 'skirt', bottomColor: '#0F5F59', shoeColor: '#0F5F59' }, accessories: { earrings: true } }), [HB.r4, 0, RZ], 1.6)
  const R3 = body(who(CAST_PRESETS.arjun, { name: 'Receptionist', hair: { style: 'sidePart', color: 'black' }, outfit: { top: 'shirt', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#0F5F59', shoeColor: '#1F2433' }, accessories: { glasses: 'rect', belt: false }, build: { shoulders: 0.95 } }), [HB.r3, 0, RZ], 1.68)
  const GAb = body(who(CAST_PRESETS.ananya, { name: 'Guest', hair: { style: 'long', color: 'black' }, outfit: { top: 'blouse', topColor: C.guest as `#${string}`, bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { earrings: true } }), [GA.start, 0, GZ], 1.6)
  const GBb = body(who(CAST_PRESETS.meera, { name: 'Guest', hair: { style: 'braid', color: 'black' }, outfit: { top: 'kurta', topColor: C.guest as `#${string}`, bottom: 'salwar', bottomColor: '#F3E9D8', shoeColor: '#6B4A2E' }, accessories: { earrings: true, bindi: true } }), [GB.start, 0, GZ], 1.6)
  const blazerA = both(withNeck(BLAZER('#1F2E63', '#121A3A')), withNeck(HOTEL_BADGE('#F2C14E', C.brand)))
  const blazerB = both(withNeck(BLAZER('#0F766E', '#0A4F4A')), withNeck(HOTEL_BADGE('#F2C14E', '#14B8A6')))

  /* arms: the phone to the ear (rig: the ear at about (150, 140) for the viewer's left hand) */
  const phoneArm = (b: Body): Arm => ik('L', b.sh, { x: 146, y: 136 })
  /* an open hand raised beside the shoulder: "I can help" (kept above the desk, clear of anyone passing) */
  const palm = (_b: Body, _side: 'L' | 'R'): Arm => ({ s: 55, e: -105 })
  const hidden: Arm = { s: 5, e: 8 }
  const r1L = (_c: number) => phoneArm(R1)
  const r4L = (c: number) => mixArm(mixArm(phoneArm(R4), hidden, hold(c, T15.hangUp[0], T15.hangUp[1], T15.reCall[0], T15.reCall[1])), palm(R4, 'L'), hold(c, T15.bHelp[0], T15.bHelp[1], T15.bHelp[2], T15.bHelp[3]))
  const r2R = (c: number) => mixArm(hidden, palm(R2, 'R'), hold(c, T15.aHelp[0], T15.aHelp[1], T15.aHelp[2], T15.aHelp[3]))
  const r3R = (c: number) => mixArm(hidden, palm(R3, 'R'), hold(c, T15.offer[0], T15.offer[1], T15.offer[2], T15.offer[3]))
  const r4R = (_c: number) => hidden
  const setArms = (p: Pose, l: Arm, r: Arm) => {
    p.shoulderL = l.s
    p.elbowL = l.e
    p.shoulderR = r.s
    p.elbowR = r.e
  }
  /* a receptionist looks DOWN toward a guest in front of the desk */
  const look = (p: Pose, x: number, y: number, w: number) => {
    to(p, 'headTurn', 0.45 * x, w)
    to(p, 'lookX', 0.9 * x, w)
    to(p, 'headNod', 0.25 * y, w)
    to(p, 'lookY', 0.8 * y, w)
  }
  const talk = (p: Pose, c: number, w: number) => to(p, 'mouthOpen', 0.12 + 0.22 * Math.abs(Math.sin(c * 7.3)) * Math.abs(Math.sin(c * 2.1 + 1)), w)
  /* the raised hand open, palm out (the rig's open hand shape) */
  const openHand = (p: Pose, w: number, side: 'L' | 'R' = 'R') => {
    for (const k of [1, 2, 3, 4]) to(p, `f${side}${k}` as keyof Pose, 0, w)
    to(p, `spread${side}` as keyof Pose, 0.6, w)
    to(p, `palm${side}` as keyof Pose, 1, w)
  }
  const poseR1 = (p: Pose, c: number) => {
    setArms(p, r1L(c), hidden)
    p.wristL = -30
    look(p, -0.5, 0.2, 1)
    talk(p, c, 1)
  }
  const poseR2 = (p: Pose, c: number) => {
    setArms(p, hidden, r2R(c))
    openHand(p, hold(c, T15.aHelp[0], T15.aHelp[1], T15.aHelp[2], T15.aHelp[3]))
    const toG = Math.max(hold(c, 0.6, 0.9, 1.25, 1.45), hold(c, 2.5, 2.75, 7.9, 8.4))
    look(p, 0.75, 0.6, toG)
    /* up and back at the central computer, over her shoulder */
    const read = hold(c, T15.aRead[0], T15.aRead[1], T15.aRead[2], T15.aRead[3])
    look(p, -0.8, -0.6, read)
    to(p, 'headTilt', -5, read)
    talk(p, c, hold(c, 2.6, 2.8, 3.8, 4.0))
  }
  const poseR4 = (p: Pose, c: number) => {
    setArms(p, r4L(c), r4R(c))
    openHand(p, hold(c, T15.bHelp[0], T15.bHelp[1], T15.bHelp[2], T15.bHelp[3]), 'L')
    const onPhone = 1 - hold(c, T15.hangUp[0], T15.hangUp[1], T15.reCall[0], T15.reCall[1])
    p.wristL = -30 * onPhone
    look(p, 0.4, 0.15, onPhone)
    talk(p, c, onPhone)
    const toG = hold(c, T15.hangUp[1] - 0.1, T15.hangUp[1] + 0.15, 7.6, 7.9)
    look(p, -0.7, 0.6, toG)
    talk(p, c, hold(c, 6.5, 6.7, 7.4, 7.6))
  }
  const poseR3 = (p: Pose, c: number) => {
    setArms(p, hidden, r3R(c))
    openHand(p, hold(c, T15.offer[0], T15.offer[1], T15.offer[2], T15.offer[3]))
    /* follows the guest as she passes, then gives up (a small shrug) */
    const gx = gBat(c).x
    const follow = hold(c, 0.3, 0.6, 2.4, 2.7)
    look(p, clamp01((gx - HB.r3 + 1.2) / 2.4) * 2 - 1, 0.55, follow)
    const sh = hold(c, T15.shrug[0], T15.shrug[1], T15.shrug[2], T15.shrug[3])
    to(p, 'shoulderL', 22, sh)
    to(p, 'elbowL', 70, sh)
    to(p, 'shoulderR', 22, sh)
    to(p, 'elbowR', 70, sh)
    to(p, 'headTilt', 6, sh)
  }
  const watchArm = (b: Body) => ik('L', b.sh, { x: 196, y: 318 })
  const poseGA = (p: Pose, c: number) => {
    const at = gAat(c)
    setArms(p, { s: 5 + swing(c, at.walking), e: 8 }, { s: 5 - swing(c, at.walking), e: 8 })
    walkLegs(p, c, at.walking, at.dir)
    const toR = hold(c, T15.aIn[1] - 0.2, T15.aIn[1], T15.aOut[0] - 0.15, T15.aOut[0])
    to(p, 'headTurn', -0.4, toR)
    to(p, 'lookX', -0.85, toR)
    to(p, 'headNod', -0.2, toR)
    to(p, 'lookY', -0.7, toR)
    /* a nod of thanks */
    to(p, 'headNod', 0.15, hold(c, 3.9, 4.05, 4.2, 4.35))
  }
  const poseGB = (p: Pose, c: number) => {
    const at = gBat(c)
    const w = hold(c, T15.watch[0], T15.watch[1], T15.watch[2], T15.watch[3])
    setArms(p, mixArm({ s: 5 + swing(c, at.walking), e: 8 }, watchArm(GBb), w), { s: 5 - swing(c, at.walking), e: 8 })
    walkLegs(p, c, at.walking, at.dir)
    /* a shake of the head at the free one */
    const sh = hold(c, T15.shake[0], T15.shake[0] + 0.1, T15.shake[1] - 0.1, T15.shake[1])
    to(p, 'headTurn', 0.3 + 0.25 * Math.sin((c - T15.shake[0]) * TAU * 2.5), sh)
    to(p, 'lookX', 0.7, sh)
    /* waiting: eyes on the one who knows her, over her right shoulder */
    const wait = hold(c, T15.bIn[1] - 0.2, T15.bIn[1], T15.bOut[0] - 0.15, T15.bOut[0])
    to(p, 'headTurn', 0.4, wait * (1 - w))
    to(p, 'lookX', 0.85, wait * (1 - w))
    to(p, 'headNod', -0.2, wait * (1 - w))
    to(p, 'lookY', -0.7, wait * (1 - w))
    to(p, 'headNod', 0.3, w)
    to(p, 'lookY', 0.8, w)
    to(p, 'headTilt', -5, hold(c, 4.9, 5.1, 5.5, 5.7))
  }

  const HB15 = devHold(HOLD15)
  const people = [
    person({ config: R1.cfg, dress: blazerA, seed: 151, faces: [[0, 'listening'], [2.5, 'thinking'], [5.0, 'happy'], [7.0, 'listening']], pose: poseR1, loop: L15, height: R1.h, frames: F15, redraw, holdT: HB15 }),
    person({ config: R2.cfg, dress: blazerA, seed: 152, faces: [[0, 'neutral'], [0.8, 'happy'], [1.3, 'thinking'], [2.6, 'happy']], pose: poseR2, loop: L15, height: R2.h, frames: F15, redraw, holdT: HB15 }),
    person({ config: R4.cfg, dress: blazerB, seed: 153, faces: [[0, 'listening'], [2.0, 'thinking'], [5.4, 'happy'], [8.4, 'listening']], pose: poseR4, loop: L15, height: R4.h, frames: F15, redraw, holdT: HB15 }),
    person({ config: R3.cfg, dress: blazerB, seed: 154, faces: [[0, 'neutral'], [0.8, 'happy'], [2.5, 'confused'], [3.8, 'neutral']], pose: poseR3, loop: L15, height: R3.h, frames: F15, redraw, holdT: HB15 }),
    person({ config: GAb.cfg, seed: 155, faces: [[0, 'neutral'], [1.2, 'listening'], [2.7, 'happy']], pose: poseGA, loop: L15, height: GAb.h, frames: F15, redraw, holdT: HB15 }),
    person({ config: GBb.cfg, seed: 156, faces: [[0, 'neutral'], [1.1, 'skeptical'], [2.6, 'bored'], [3.6, 'worried'], [5.6, 'happy'], [8.0, 'neutral']], pose: poseGB, loop: L15, height: GBb.h, frames: F15, redraw, holdT: HB15 }),
  ]
  const bodies = [R1, R2, R4, R3, GAb, GBb]
  people.forEach((s, k) => {
    s.object.position.copy(bodies[k].root)
    scene.add(s.object)
  })
  const clk = slideClock('T15', scene, HB15, people)

  const hand = new THREE.Vector3()
  const pathPt = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L15)
    const cq = frameT(c, L15, F15)
    const a = gAat(c)
    GAb.root.set(a.x, bob(a.walking, c), GZ)
    people[4].object.position.copy(GAb.root)
    const b = gBat(c)
    GBb.root.set(b.x, bob(b.walking, c), GZ)
    people[5].object.position.copy(GBb.root)
    people.forEach((s) => s.update(c, camera))

    /* hotel A: the record lights on the central screen and runs down the wire to the free receptionist's terminal */
    const read = hold(c, T15.aRead[0], T15.aRead[1], T15.aRead[2], T15.aRead[3])
    setOp(sysOn, read)
    const pk = seg(c, T15.pulse[0], T15.pulse[1])
    const on = c > T15.pulse[0] && c < T15.pulse[1] + 0.1
    dot.visible = on
    cabR.path.getPointAt(Math.min(1, pk), pathPt)
    dot.position.copy(pathPt)
    dotHalo.position.copy(pathPt).add(new THREE.Vector3(0, 0, 0.03))
    dotHalo.quaternion.copy(camera.quaternion)
    setOp(dotHalo, on ? 0.8 : 0)
    cabR.m.emissiveIntensity = 0.25 + 0.6 * read
    ;(t2.material as THREE.MeshBasicMaterial).color.set('#2E4A8C').lerp(new THREE.Color(C.guest), hold(c, T15.pulse[1] - 0.05, T15.pulse[1] + 0.1, T15.aRead[2], T15.aRead[3]))

    /* hotel B: the one who knows her remembers (her bubble lights) once she is free */
    const mem = hold(c, T15.bRead[0], T15.bRead[1], T15.bRead[2], T15.bRead[3])
    setOp(bubGlow, mem * (0.7 + 0.3 * Math.sin(c * TAU * 1.5)))
    bubB4.scale.setScalar(1 + 0.08 * mem)
    bubB4.quaternion.copy(camera.quaternion)
    bubB3.quaternion.copy(camera.quaternion)
    bubB3.scale.set(-1, 1, 1)

    /* the handsets: at the ear while on the phone, in the cradle otherwise */
    const ear = (bd: Body, arm: Arm, ph: ReturnType<typeof makePhone>, k: number) => {
      handWorld('L', bd.sh, arm, bd.h, bd.root, camera, hand)
      const cradle = ph.base.position.clone().add(new THREE.Vector3(0, 0.07, 0))
      ph.hand.position.copy(cradle).lerp(hand, k)
      ph.hand.quaternion.copy(camera.quaternion)
      ph.hand.rotateZ(lerp(Math.PI / 2, -0.35, k))
      if (k < 0.5) ph.hand.rotateX(lerp(-Math.PI / 2, 0, k * 2))
    }
    ear(R1, r1L(cq), p1, 1)
    const k4 = 1 - hold(c, T15.hangUp[0], T15.hangUp[1] - 0.05, T15.reCall[0] + 0.05, T15.reCall[1])
    ear(R4, r4L(cq), p4, k4)
  }
}

/* ------------------------------------------------------------------ T15 concept: instances, a shared store, a sticky request */

/** a server instance: a navy block with light rows, a status lamp, and a work ring on its face */
function makeInstance() {
  const g = new THREE.Group()
  g.add(box(0.46, 0.56, 0.36, mat('#1F2E63', { roughness: 0.3, metalness: 0.2 }), [0, 0.28, 0], 0.04))
  for (let k = 0; k < 3; k++) g.add(flat(box(0.34, 0.035, 0.01, mat('#3B5BB8', { roughness: 0.4, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.5 }), [0, 0.46 - k * 0.07, 0.182])))
  const lampM = new THREE.MeshBasicMaterial({ color: C.green, toneMapped: false })
  g.add(mesh(new THREE.SphereGeometry(0.026, 14, 10), lampM, [0.16, 0.1, 0.18]))
  /* the work ring: a request being worked on (another request, grey) */
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.085, 0.105, 40, 1, 0, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: '#9CC2FF', toneMapped: false, transparent: true, side: THREE.DoubleSide }))
  ring.position.set(-0.04, 0.17, 0.185)
  g.add(ring)
  const busyTok = box(0.075, 0.075, 0.02, mat('#AEB8CC', { roughness: 0.4 }), [-0.04, 0.17, 0.185], 0.012)
  g.add(busyTok)
  return { g, lampM, ring, busyTok }
}
/** a request: a pink card-token with a person glyph (the guest), floating at chest height */
function makeRequest() {
  const g = new THREE.Group()
  g.add(box(0.4, 0.4, 0.1, mat(C.guest, { roughness: 0.3, emissive: new THREE.Color(C.guest), emissiveIntensity: 0.15 }), [0, 0, 0], 0.03))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), basic(canvasTex(64, 64, (q) => {
    q.fillStyle = '#FFFFFF'
    q.beginPath()
    q.arc(32, 24, 10, 0, TAU)
    q.fill()
    q.beginPath()
    q.ellipse(32, 50, 17, 11, 0, Math.PI, 0)
    q.fill()
  })))
  face.position.z = 0.052
  g.add(face)
  return g
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

function setupT15Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM15, AT15, FOV15)
  lights(scene, [0, 1.0, -0.4])
  lobbies(scene, { wallA: '#EEF2FA', wallB: '#EEF2FA', floorA: ['#E3EAF8', '#C9D5EC'], floorB: ['#E3EAF8', '#C9D5EC'], desk: '#C9D5EC', top: '#FFFFFF' })

  /* the instances, where the receptionists stand (on the platform) */
  const IZ = (DZF + DZB) / 2 - 0.05
  const inst = [HA.r1, HA.r2, HB.r4, HB.r3].map((x) => {
    const m = makeInstance()
    m.g.position.set(x, DESK, IZ)
    scene.add(m.g)
    return m
  })
  const [I1, I2, I4, I3] = inst
  /* hotel A: ONE shared store in the central computer's place, wired to both instances */
  const sx = HA.screen
  const store = new THREE.Group()
  const discM = mat('#2D63FB', { roughness: 0.3, metalness: 0.1, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.2 })
  for (let k = 0; k < 3; k++) store.add(cyl(0.2, 0.2, 0.1, discM, [0, k * 0.125, 0], 36))
  for (let k = 0; k < 3; k++) store.add(flat(cyl(0.202, 0.202, 0.018, mat('#9DB8FF', { roughness: 0.3 }), [0, k * 0.125 + 0.05, 0], 36)))
  store.position.set(sx, 1.82, WALLZ + 0.26)
  scene.add(store)
  scene.add(box(0.56, 0.04, 0.4, mat('#FFFFFF', { roughness: 0.4 }), [sx, 1.75, WALLZ + 0.22], 0.01))
  const recOn = picture(guestCardTex(C.guest), 0.28, 0.22, [sx, 2.25, WALLZ + 0.26])
  scene.add(recOn)
  const CY = 2.32
  cable(scene, [[sx - 0.18, 2.1, WALLZ + 0.04], [sx - 0.18, CY, WALLZ + 0.04], [HA.r1, CY, WALLZ + 0.04], [HA.r1, DESK + 0.3, WALLZ + 0.04], [HA.r1, DESK + 0.3, IZ - 0.19]], '#7FA6FF')
  const cabR = cable(scene, [[sx + 0.18, 2.1, WALLZ + 0.04], [sx + 0.18, CY, WALLZ + 0.04], [HA.r2, CY, WALLZ + 0.04], [HA.r2, DESK + 0.3, WALLZ + 0.04], [HA.r2, DESK + 0.3, IZ - 0.19]], '#7FA6FF')
  const dot = mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: C.guest, toneMapped: false }))
  scene.add(dot)
  /* hotel B: each instance holds its own state (a record chip over it, in the bubble's place) */
  const chip = (color: string, x: number) => {
    const g = new THREE.Group()
    g.add(box(0.52, 0.42, 0.05, mat('#FFFFFF', { roughness: 0.4 }), [0, 0, 0], 0.035))
    const p = picture(guestCardTex(color), 0.45, 0.36, [0, 0, 0.027])
    g.add(p)
    g.position.set(x, 2.12, RZ)
    scene.add(g)
    /* the link from the instance up to its chip */
    scene.add(flat(box(0.02, 2.12 - 0.21 - (DESK + 0.56), 0.02, mat('#9DB8FF', { roughness: 0.4 }), [x, (2.12 - 0.21 + DESK + 0.56) / 2, RZ])))
    return g
  }
  const chip4 = chip(C.guest, HB.r4)
  chip(C.other, HB.r3)
  const chipGlow = halo('rgba(228,87,143,0.85)', 0.7)
  chipGlow.position.set(HB.r4, 2.12, RZ - 0.04)
  scene.add(chipGlow)

  /* the two requests, on the guests' paths */
  const qA = makeRequest()
  const qB = makeRequest()
  scene.add(qA, qB)
  const tickA = picture(tickTex(), 0.22, 0.22, [0, 0, 0])
  const tickB = picture(tickTex(), 0.22, 0.22, [0, 0, 0])
  scene.add(tickA, tickB)
  const waitB = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.024, 10, 56), new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0, toneMapped: false }))
  scene.add(waitB)
  /* the answer: a beam from the serving instance down to its request */
  const beamM = (col: string) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, toneMapped: false })
  const beamA = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), beamM('#22C55E'))
  const beamB = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), beamM('#22C55E'))
  scene.add(beamA, beamB)
  const beam = (m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, o: number) => {
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.scale.set(1, a.distanceTo(b), 1)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    ;(m.material as THREE.MeshBasicMaterial).opacity = o
  }
  /* an offer from the free instance in hotel B, as the request passes (its lamp blinks) */

  const clk = slideClock('T15', scene, devHold(HOLD15), [{ ready: Promise.resolve() }])
  const QY = 1.05
  const pathPt = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L15)
    const a = gAat(c)
    const b = gBatC(c)
    qA.position.set(a.x, QY + 0.02 * Math.sin(c * TAU * (3 / L15)), GZ)
    qB.position.set(b.x, QY + 0.02 * Math.sin(c * TAU * (3 / L15) + 1), GZ)
    qA.rotation.y = 0.15 * a.dir
    qB.rotation.y = 0.15 * b.dir
    /* busy instances: the work ring turns; I4 finishes its other request at the hang-up */
    const busy4 = 1 - hold(c, T15.hangUp[0], T15.hangUp[1], T15.reCall[0], T15.reCall[1])
    I1.ring.rotation.z = -(c / L15) * TAU * 6
    I4.ring.rotation.z = -(c / L15) * TAU * 6 + 1
    I4.ring.scale.setScalar(Math.max(0.001, busy4))
    I4.busyTok.scale.setScalar(Math.max(0.001, busy4))
    I1.lampM.color.set(C.orange)
    I4.lampM.color.set(C.orange).lerp(new THREE.Color(C.green), 1 - busy4)
    for (const m of [I2, I3]) {
      m.ring.visible = false
      m.busyTok.visible = false
    }
    /* hotel A: the free instance reads the shared store, answers at once */
    const read = hold(c, T15.aRead[0], T15.aRead[1], T15.aRead[2], T15.aRead[3])
    setOp(recOn, read)
    const pk = seg(c, T15.pulse[0], T15.pulse[1])
    dot.visible = c > T15.pulse[0] && c < T15.pulse[1] + 0.05
    cabR.path.getPointAt(Math.min(1, pk), pathPt)
    dot.position.copy(pathPt)
    cabR.m.emissiveIntensity = 0.25 + 0.6 * read
    I2.lampM.color.set(C.green)
    const helpA = hold(c, T15.aHelp[0], T15.aHelp[1], T15.aHelp[2], T15.aHelp[3])
    beam(beamA, new THREE.Vector3(HA.r2, DESK + 0.2, IZ + 0.18), qA.position.clone().add(new THREE.Vector3(0.0, 0.12, 0)), 0.85 * helpA)
    const doneA = hold(c, T15.aHelp[1], T15.aHelp[1] + 0.2, T15.aOut[0], T15.aOut[0] + 0.2)
    tickA.position.copy(qA.position).add(new THREE.Vector3(0.22, 0.22, 0.08))
    tickA.scale.setScalar(Math.max(0.001, doneA))
    setOp(tickA, doneA)
    /* hotel B: the request passes the free instance (its lamp blinks an offer) and waits for its own */
    const offer = hold(c, T15.offer[0], T15.offer[1], T15.offer[2], T15.offer[3])
    I3.lampM.color.set(C.green).lerp(new THREE.Color('#FFFFFF'), offer * (0.5 + 0.5 * Math.sin(c * TAU * 4)))
    const waiting = hold(c, T15.bIn[1] - 0.1, T15.bIn[1] + 0.1, T15.bRead[0], T15.bRead[1])
    waitB.position.copy(qB.position)
    setOp(waitB, waiting * (0.7 + 0.3 * Math.sin(c * TAU * 1.4)))
    const mem = hold(c, T15.bRead[0], T15.bRead[1], T15.bRead[2], T15.bRead[3])
    setOp(chipGlow, mem * 0.85)
    chip4.scale.setScalar(1 + 0.08 * mem)
    const helpB = hold(c, T15.bHelp[0], T15.bHelp[1], T15.bHelp[2], T15.bHelp[3])
    beam(beamB, new THREE.Vector3(HB.r4, DESK + 0.2, IZ + 0.18), qB.position.clone().add(new THREE.Vector3(0, 0.12, 0)), 0.85 * helpB)
    const doneB = hold(c, T15.bHelp[1], T15.bHelp[1] + 0.2, T15.bOut[1] - 0.3, T15.bOut[1])
    tickB.position.copy(qB.position).add(new THREE.Vector3(0.22, 0.22, 0.08))
    tickB.scale.setScalar(Math.max(0.001, doneB))
    setOp(tickB, doneB)
    for (const o of [tickA, tickB, waitB]) o.quaternion.copy(camera.quaternion)
    void inst
  }
}
const gBatC = gBat

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
  I_T11Everyday: card('T11', setupT11Everyday, devHold(HOLD11)),
  I_T11Concept: card('T11', setupT11Concept, devHold(HOLD11)),
  I_T15Everyday: card('T15', setupT15Everyday, devHold(HOLD15)),
  I_T15Concept: card('T15', setupT15Concept, devHold(HOLD15)),
}
export const css = ''
