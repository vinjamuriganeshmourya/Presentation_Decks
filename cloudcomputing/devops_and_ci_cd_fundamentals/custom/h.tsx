import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { useHeld } from '@/engine/figkit'

/**
 * BUILDER H · SESSION 22 (DevOps & CI/CD Fundamentals) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 21's h/i/j.tsx are (and with their helpers): a perspective camera on a real place, Character Lab
 * people from the engine's `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO
 * TEXT on either card, ONE wall-clock loop per slide shared by both cards (the clock below, copied from S21's
 * `clock.tsx`: the cards fade in once every person has a first frame, a tap pauses both), every loop ending in the
 * state it starts in (the reset takes the last 0.6 s), held frames (`?still`, thumbnails) at HOLD.
 *
 * SLIDE T01-AN (TR 1): "In a group project where everyone gets the same grade, no one says 'my part was fine': just as
 * in DevOps, Dev and Ops share the result, so both work together to make the software run well."
 *
 *   place          everyday: a classroom project table             concept: the team's operations room
 *   centre         the one poster board on the table               the one running app on its screen
 *   sides          four students, two at each end                  the developer (laptop desk) and ops (server rack)
 *   behind         the teacher with the one grade card (a star)    the one shared status lamp on the screen
 *
 *   0.3 - 3.6      each student adds a piece to the poster         code and server pieces join the app, in turn
 *   3.9 - 5.0      the teacher holds up the star, sets it on top   the status lamp turns green
 *   5.0 - 8.2      all four cheer together                         both look at the lamp, pleased together
 *   8.3 - 8.9      the pieces and the star clear                   the pieces clear, the lamp dims
 *
 * SLIDE T06-AN (TR 6): "A construction project needs an architect's blueprint before workers lay a single brick: just
 * as the plan stage fixes requirements before the code stage starts building."
 *
 *   place          everyday: a construction site                    concept: the team's office
 *   left           the architect at the drawing table               the planner at the plan board
 *   table / board  the blueprint, unrolled, the wall drawn on it    the plan card, opened, the stack drawn on it
 *   right          two workers lay the wall course by course        the developer's code blocks stack the same way
 *
 *   0.2 - 2.4      the blueprint opens, the architect points        the plan opens, the planner hands it over
 *   2.4 - 7.2      the bricks go down, matching the drawing         the code blocks stack, matching the plan
 *   7.2 - 8.3      the wall stands complete                         the stack stands complete
 *   8.3 - 8.9      the wall clears, the blueprint rolls up          the stack clears, the plan closes
 *
 * SLIDE T12-AN (TR 12): "A commit is like a photograph of the project at one moment, and a branch is a separate photo
 * album started to try a new idea without touching the main album: just as a Git branch lets commits diverge safely
 * before rejoining the original history."
 *
 *   place          everyday: a living room table                    concept: a developer's studio
 *   left           the photographer with her camera                 the developer at her laptop
 *   table          the main album (two photos)                      the main line (two commits)
 *   (appears)      a second album for the new idea (two photos)     a branch line diverging (two commits)
 *   (move back)    one new-idea photo goes into the main album      the branch rejoins main: a merge commit
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
  green: '#22C55E',
  greenDark: '#169C47',
  white: '#FFFFFF',
  gold: '#F2B33D',
  goldDark: '#C8891A',
  teal: '#14B8A6',
  tealDark: '#0E8C7F',
  blue: '#3B6FF0',
  blueDark: '#2449B8',
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
  return 1 + Math.sin(k * Math.PI) * 0.22 * (1 - k * 0.4) - (1 - sm(k))
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
/** a texture redrawn on demand (registers, rule lists): `paint(state)` repaints only when the state changes */
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
/** an official mark on a white rounded tile (the mark itself never moves) */
const markCache = new Map<string, THREE.CanvasTexture>()
function markTex(url: string, redraw: () => void, px = 384): THREE.CanvasTexture {
  const key = url + px
  const hit = markCache.get(key)
  if (hit && (hit.userData as { ok?: boolean }).ok) return hit
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g0 = c.getContext('2d')!
  g0.fillStyle = '#FFFFFF'
  g0.beginPath()
  g0.roundRect(0, 0, px, px, px * 0.18)
  g0.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const pad = px * 0.13
    const r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
    const s = px - 2 * pad
    const dw = r >= 1 ? s : s * r
    const dh = r >= 1 ? s / r : s
    g0.drawImage(img, (px - dw) / 2, (px - dh) / 2, dw, dh)
    t.needsUpdate = true
    ;(t.userData as { ok?: boolean }).ok = true
    redraw()
  }
  img.src = url
  markCache.set(key, t)
  return t
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
/** a green tick badge (a symbol, not a word) */
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

/** a name, drawn as a shape (never letters): the same shape is the same name */
type Shape = 'star' | 'circle' | 'triangle' | 'square' | 'heart' | 'diamond'
const SHAPE_COL: Record<Shape, string> = { star: '#F2A93B', circle: '#2D63FB', triangle: '#14B8A6', square: '#8B5CF6', heart: '#E4578F', diamond: '#FF8A3D' }
function shapeGlyph(g: CanvasRenderingContext2D, s: Shape, cx: number, cy: number, r: number, color = SHAPE_COL[s]) {
  g.fillStyle = color
  g.beginPath()
  if (s === 'star') {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU - Math.PI / 2
      const q = k % 2 ? r * 0.45 : r
      g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * 1.0 + r * 0.06)
    }
  } else if (s === 'circle') {
    g.arc(cx, cy, r * 0.85, 0, TAU)
  } else if (s === 'triangle') {
    g.moveTo(cx, cy - r * 0.9)
    g.lineTo(cx + r * 0.95, cy + r * 0.72)
    g.lineTo(cx - r * 0.95, cy + r * 0.72)
  } else if (s === 'square') {
    g.roundRect(cx - r * 0.78, cy - r * 0.78, r * 1.56, r * 1.56, r * 0.18)
  } else if (s === 'heart') {
    g.moveTo(cx, cy + r * 0.85)
    g.bezierCurveTo(cx - r * 1.25, cy - r * 0.05, cx - r * 0.65, cy - r * 1.05, cx, cy - r * 0.38)
    g.bezierCurveTo(cx + r * 0.65, cy - r * 1.05, cx + r * 1.25, cy - r * 0.05, cx, cy + r * 0.85)
  } else {
    g.moveTo(cx, cy - r)
    g.lineTo(cx + r * 0.75, cy)
    g.lineTo(cx, cy + r)
    g.lineTo(cx - r * 0.75, cy)
  }
  g.closePath()
  g.fill()
}
/** a white name plate with its shape */
const plateTex = (s: Shape) =>
  canvasTex(96, 60, (g) => {
    rr(g, 0, 0, 96, 60, 10, '#FFFFFF')
    g.strokeStyle = '#C9D3E6'
    g.lineWidth = 3
    g.beginPath()
    g.roundRect(1.5, 1.5, 93, 57, 9)
    g.stroke()
    shapeGlyph(g, s, 48, 30, 21)
  })

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: V3, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)
  const o = new THREE.Mesh(geo, m)
  o.position.set(...pos)
  o.castShadow = true
  o.receiveShadow = true
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const sphere = (r: number, m: THREE.Material, pos: V3) => mesh(new THREE.SphereGeometry(r, 24, 16), m, pos)
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
/** a badge plane (tick), always facing the camera, drawn over everything near it */
function badge(tex: THREE.Texture, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), basic(tex, { depthTest: false }))
  m.renderOrder = 9
  m.visible = false
  return m
}
const showBadge = (b: THREE.Mesh, k: number, camera: THREE.Camera) => {
  b.visible = k > 0.01
  b.scale.setScalar(Math.max(0.001, k))
  b.quaternion.copy(camera.quaternion)
}

function lights(scene: THREE.Scene, target: V3, key = 2.0, span = 6) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 1.0))
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 3, target[1] + 9, target[2] + 8)
  k.target.position.set(...target)
  k.castShadow = true
  k.shadow.mapSize.set(2048, 2048)
  k.shadow.camera.left = -span
  k.shadow.camera.right = span
  k.shadow.camera.top = span
  k.shadow.camera.bottom = -span
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
/** a dotted path from a to b (rising by `lift` in the middle) that fills in as k goes 0 -> 1 */
function dotArc(scene: THREE.Scene, a: THREE.Vector3, b: THREE.Vector3, lift: number, color: string, n = 9, r = 0.016) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false })
  const geo = new THREE.SphereGeometry(r, 10, 8)
  const pts: THREE.Mesh[] = []
  const at = (k: number, out: THREE.Vector3) => {
    out.lerpVectors(a, b, k)
    out.y += Math.sin(k * Math.PI) * lift
    return out
  }
  for (let i = 1; i < n; i++) {
    const d = new THREE.Mesh(geo, m)
    at(i / n, d.position)
    d.visible = false
    scene.add(d)
    pts.push(d)
  }
  return {
    at,
    m,
    set: (k: number, o: number) => {
      m.opacity = o
      pts.forEach((d, i) => (d.visible = o > 0.01 && (i + 1) / n <= k + 1e-6))
    },
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
/* every person: frames at one fixed size (no re-sizing flicker) and no idle breathing (a still pose is one picture) */
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
/** a staff ID on a lanyard (invigilators, the receptionist) */
const LANYARD = (strap: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={strap} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={strap} opacity={0.55} />
  </g>
)
/** a reception scarf and name badge */
const DESK_SCARF = (badgeCol: string, scarf: string) => (
  <g data-part="scarf">
    <path d="M 184 206 C 192 222 208 222 216 206 L 210 232 L 200 226 L 190 232 Z" fill={scarf} />
    <rect x={160} y={262} width={26} height={10} rx={2.5} fill={badgeCol} />
  </g>
)
/** a laptop bag on a strap (a visitor) */
const BAG = (strap: string, bag: string) => (
  <g data-part="bag">
    <path d="M 168 212 L 236 352" stroke={strap} strokeWidth={6} strokeLinecap="round" fill="none" />
    <rect x={222} y={344} width={40} height={32} rx={7} fill={bag} stroke={strap} strokeWidth={2.5} />
    <rect x={222} y={344} width={40} height={11} rx={5} fill={strap} opacity={0.6} />
  </g>
)
/** a school tie (students' uniform) */
const TIE = (col: string) => (
  <g data-part="tie">
    <path d="M 194 212 L 206 212 L 209 226 L 204 300 L 200 308 L 196 300 L 191 226 Z" fill={col} />
  </g>
)
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
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
/** the hand of the frame the sprite is showing, in the world (a prop in that hand goes here) */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3, near = 0.06) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, near)
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
const setArms = (p: Pose, l: Arm, r: Arm) => {
  p.shoulderL = l.s
  p.elbowL = l.e
  p.shoulderR = r.s
  p.elbowR = r.e
}
const talk = (p: Pose, c: number, w: number) => to(p, 'mouthOpen', 0.12 + 0.22 * Math.abs(Math.sin(c * 7.3)) * Math.abs(Math.sin(c * 2.1 + 1)), w)
const pointHand = (p: Pose, w: number, side: 'L' | 'R') => {
  to(p, `f${side}1` as keyof Pose, 0, w)
  for (const k of [2, 3, 4]) to(p, `f${side}${k}` as keyof Pose, 1, w)
  to(p, `t${side}` as keyof Pose, 0.6, w)
  to(p, `spread${side}` as keyof Pose, 0, w)
  to(p, `palm${side}` as keyof Pose, 0.2, w)
}
const openHand = (p: Pose, w: number, side: 'L' | 'R') => {
  for (const k of [1, 2, 3, 4]) to(p, `f${side}${k}` as keyof Pose, 0, w)
  to(p, `spread${side}` as keyof Pose, 0.6, w)
  to(p, `palm${side}` as keyof Pose, 1, w)
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

/** shift a face-key list by `off` seconds round a loop of L (each person in a staggered queue has the same faces) */
function shiftKeys(keys: [number, string][], off: number, L: number): [number, string][] {
  return keys.map(([t, f]) => [mod(t + off, L), f] as [number, string]).sort((a, b) => a[0] - b[0])
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
const crew = (hat: string, edge: string) => (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{HARD_HAT(hat, edge)}</>, top: <>{k.top}{VEST}</> })
type Clock = { users: number; scenes: number; pending: number; ready: boolean; start: number; offset: number; lastNow: number; c: number }

/* the cards of one slide (everyday + concept) */
const CARDS = 2
const READY_CAP = 1500
const clocks = new Map<string, Clock>()
const shown = new Map<string, { on: boolean; fns: Set<(on: boolean) => void> }>()
const shownOf = (key: string) => {
  let p = shown.get(key)
  if (!p) shown.set(key, (p = { on: false, fns: new Set() }))
  return p
}
const setShown = (key: string, on: boolean) => {
  const p = shownOf(key)
  if (p.on === on) return
  p.on = on
  p.fns.forEach((f) => f(on))
}
const pause = new Map<string, { on: boolean; fns: Set<(on: boolean) => void> }>()

const frameNow = () => {
  const t = typeof document !== 'undefined' ? document.timeline?.currentTime : null
  return typeof t === 'number' ? t : performance.now()
}
const pauseOf = (key: string) => {
  let p = pause.get(key)
  if (!p) pause.set(key, (p = { on: false, fns: new Set() }))
  return p
}
const setPaused = (key: string, on: boolean) => {
  const p = pauseOf(key)
  if (p.on === on) return
  p.on = on
  p.fns.forEach((f) => f(on))
}

/**
 * In a card's `setup`: the slide's clock. `people` are the card's sprites (their `ready`: the first frame is on the
 * plane). `time(t)` turns the stage's `t` into loop time (`holdT` passes through).
 */
export function slideClock(key: string, scene: THREE.Scene, holdT: number, people: { ready: Promise<void> }[]) {
  let k = clocks.get(key)
  if (!k) {
    const now = frameNow()
    clocks.set(key, (k = { users: 0, scenes: 0, pending: 0, ready: false, start: now, offset: 0, lastNow: now, c: 0 }))
    const born = k
    setTimeout(() => go(born), READY_CAP)
  }
  const ck = k
  ck.users++
  ck.scenes++
  ck.pending += people.length
  function go(c: Clock) {
    if (c.ready || clocks.get(key) !== c) return
    c.ready = true
    c.start = c.lastNow = frameNow()
    c.offset = 0
    setShown(key, true)
  }
  for (const p of people) {
    p.ready.then(() => {
      ck.pending--
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  }
  /* the scene's teardown (disposeAll calls userData.dispose on every object): the last card out drops the clock */
  const anchor = new THREE.Object3D()
  anchor.userData.dispose = () => {
    ck.users--
    if (ck.users <= 0) {
      clocks.delete(key)
      setPaused(key, false)
      setShown(key, false)
    }
  }
  scene.add(anchor)
  return {
    time(t: number): number {
      if (t === holdT) return holdT
      /* until every person has a first frame: the start, unchanging, so each sprite builds only that frame first */
      if (!ck.ready) return 0
      const now = frameNow()
      if (now !== ck.lastNow) {
        if (pauseOf(key).on) ck.offset += Math.max(0, now - ck.lastNow)
        ck.lastNow = now
        ck.c = (now - ck.start - ck.offset) / 1000
      }
      return ck.c
    },
  }
}

let down: { x: number; y: number; t: number } | null = null

/** The card's box: the stage, a tap on it pauses / plays the slide's two cards, and the pause mark. */
export function ClockCard({ id, w, h, children }: { id: string; w: number; h: number; children: ReactNode }) {
  const held = useHeld()
  const [on, setOn] = useState(() => pauseOf(id).on)
  const [seen, setSeen] = useState(() => shownOf(id).on)
  useEffect(() => {
    const p = pauseOf(id)
    const v = shownOf(id)
    p.fns.add(setOn)
    v.fns.add(setSeen)
    setOn(p.on)
    setSeen(v.on)
    return () => {
      p.fns.delete(setOn)
      v.fns.delete(setSeen)
    }
  }, [id])
  return (
    <div
      onPointerDown={(e) => {
        down = { x: e.clientX, y: e.clientY, t: performance.now() }
      }}
      onPointerUp={(e) => {
        /* a tap, not a swipe (the deck's swipe still changes slides) and not a long press */
        const d = down
        down = null
        if (e.button > 0 || !d || performance.now() - d.t > 500 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
        setPaused(id, !pauseOf(id).on)
      }}
      style={{ position: 'relative', width: w, height: h, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* the scene fades in once its people are drawn (held frames: at once) */}
      <div style={{ display: 'grid', placeItems: 'center', opacity: held || seen ? 1 : 0, transition: held ? 'none' : 'opacity 320ms cubic-bezier(0.22,1,0.36,1)' }}>{children}</div>
      <span
        aria-hidden
        style={{ position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 99, background: 'rgba(255,255,255,0.92)', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: 'opacity 240ms cubic-bezier(0.22,1,0.36,1)', pointerEvents: 'none' }}
      >
        <svg width={14} height={14} viewBox="0 0 14 14">
          <rect x={2} y={1.5} width={3.6} height={11} rx={1.2} fill="#2D63FB" />
          <rect x={8.4} y={1.5} width={3.6} height={11} rx={1.2} fill="#2D63FB" />
        </svg>
      </span>
    </div>
  )
}

/* ================================================================== shared for S22: rooms, faces, small props */

/** the room: floor, back wall (z = wall), a skirting trim, a ceiling strip of lamps */
function room(scene: THREE.Scene, o: { wall: string; floor: THREE.Texture; trim: string; wallZ: number; ceil?: number; glow?: number }) {
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.3 })
  scene.add(floorPlane(10, 8, mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0, 1.6]))
  scene.add(flat(box(10, 3.2, 0.1, wallM, [0, 1.6, o.wallZ - 0.05])))
  scene.add(flat(box(10, 0.1, 0.03, mat(o.trim, { roughness: 0.6 }), [0, 0.05, o.wallZ + 0.015])))
  return { wallM }
}
/** a table: top + four legs */
function table(scene: THREE.Scene, x: number, z: number, w: number, d: number, h: number, top: string, leg: string) {
  scene.add(box(w, 0.045, d, mat(top, { roughness: 0.45 }), [x, h - 0.022, z], 0.012))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scene.add(box(0.04, h - 0.045, 0.04, mat(leg, { roughness: 0.55 }), [x + sx * (w / 2 - 0.05), (h - 0.045) / 2, z + sz * (d / 2 - 0.05)]))
}
/** 0 before a, a pop up to 1, held, then down to 0 between c and d (things that clear at the loop's end) */
const life = (t: number, a: number, c: number, d: number) => (t < a ? 0 : pop(t, a) * (1 - seg(t, c, d)))
/** a flat card (a picture on a thin white board) */
function cardMesh(tex: THREE.Texture, w: number, h: number) {
  const g = new THREE.Group()
  g.add(box(w + 0.012, h + 0.012, 0.008, mat('#FFFFFF', { roughness: 0.5 }), [0, 0, -0.005], 0.003))
  g.add(picture(tex, w, h, [0, 0, 0.0], { transparent: false }))
  return g
}
const cheerArm: Arm = { s: 166, e: 16 }
/** both arms up and a small bounce */
function cheer(p: Pose, w: number) {
  if (w <= 0) return
  p.shoulderL = lerp(p.shoulderL, cheerArm.s, w)
  p.elbowL = lerp(p.elbowL, cheerArm.e, w)
  p.shoulderR = lerp(p.shoulderR, cheerArm.s, w)
  p.elbowR = lerp(p.elbowR, cheerArm.e, w)
  openHand(p, w, 'L')
  openHand(p, w, 'R')
  to(p, 'headNod', -0.12, w)
  to(p, 'lookY', -0.3, w)
}
/** a gold star (the one grade) */
const starTex = () =>
  canvasTex(96, 96, (g) => {
    g.fillStyle = '#C8891A'
    g.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU - Math.PI / 2
      const q = k % 2 ? 19 : 44
      g.lineTo(48 + Math.cos(a) * q, 51 + Math.sin(a) * q)
    }
    g.closePath()
    g.fill()
    g.fillStyle = '#F7C548'
    g.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU - Math.PI / 2
      const q = k % 2 ? 17 : 40
      g.lineTo(48 + Math.cos(a) * q, 48 + Math.sin(a) * q)
    }
    g.closePath()
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.55)'
    g.beginPath()
    g.ellipse(40, 34, 9, 5, -0.5, 0, TAU)
    g.fill()
  })
/** a poster piece: a coloured panel with a simple drawing (a planet, a mountain, a leaf, a bar chart: shapes, no words) */
const PIECE_COL = ['#3B6FF0', '#14B8A6', '#F2A93B', '#8B5CF6'] as const
const pieceTex = (i: number) =>
  canvasTex(120, 90, (g) => {
    rr(g, 0, 0, 120, 90, 8, PIECE_COL[i])
    g.fillStyle = 'rgba(255,255,255,0.92)'
    if (i === 0) {
      g.beginPath()
      g.arc(60, 46, 22, 0, TAU)
      g.fill()
      g.strokeStyle = 'rgba(255,255,255,0.92)'
      g.lineWidth = 5
      g.beginPath()
      g.ellipse(60, 46, 38, 10, -0.3, 0, TAU)
      g.stroke()
    } else if (i === 1) {
      g.beginPath()
      g.moveTo(14, 76)
      g.lineTo(48, 24)
      g.lineTo(66, 50)
      g.lineTo(78, 36)
      g.lineTo(106, 76)
      g.closePath()
      g.fill()
    } else if (i === 2) {
      g.beginPath()
      g.ellipse(60, 45, 30, 18, -0.6, 0, TAU)
      g.fill()
      g.strokeStyle = PIECE_COL[2]
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(36, 62)
      g.lineTo(84, 28)
      g.stroke()
    } else {
      for (let k = 0; k < 4; k++) rr(g, 22 + k * 20, 70 - (16 + k * 12), 14, 16 + k * 12, 3, 'rgba(255,255,255,0.92)')
    }
  })
/** the poster board's face: a header band and four empty frames */
const posterTex = () =>
  canvasTex(240, 170, (g) => {
    rr(g, 0, 0, 240, 170, 8, '#FFFFFF')
    rr(g, 0, 0, 240, 24, 8, '#1F2E63')
    rr(g, 70, 8, 100, 8, 4, 'rgba(255,255,255,0.75)')
    g.strokeStyle = '#D5DCE8'
    g.lineWidth = 2.5
    g.setLineDash([7, 5])
    for (const [x, y] of [[20, 36], [128, 36], [20, 102], [128, 102]]) {
      g.beginPath()
      g.roundRect(x, y, 92, 58, 6)
      g.stroke()
    }
  })

/* ================================================================== T01 · a group project with one grade / DevOps */

const L01 = 9
const F01 = 108
const HOLD01 = 6.1 /* every piece on, the star on top, everyone cheering */
const CAM01: V3 = [0, 1.62, 4.35]
const AT01: V3 = [0, 1.02, -0.7]
const FOV01 = 35
const P01 = {
  wall: -1.75,
  table: { x: 0, z: -0.5, w: 1.5, d: 0.72, h: 0.74 },
  poster: new THREE.Vector3(0, 0.74 + 0.31, -0.6), // the centre panel's centre
  pw: 0.66,
  ph: 0.47,
  /* the four pieces' places on the poster (centre-panel local, x right, y up) */
  slot: [[-0.15, 0.03], [0.15, 0.03], [-0.15, -0.14], [0.15, -0.14]] as const,
  people: [[-1.14, -0.08], [1.14, -0.08], [-0.86, -1.12], [0.86, -1.12]] as const,
  teacher: [0, -1.38] as const,
}
/* piece i goes on at T01.add[i] (student i), the star at T01.star */
const T01 = { add: [0.5, 1.35, 2.2, 3.05], fly: 0.42, raise: [3.75, 4.25] as const, star: [4.45, 4.95] as const, cheer: [5.05, 5.4, 7.6, 8.05] as const, clear: [8.25, 8.85] as const }
const slotW = (i: number, out: THREE.Vector3) => out.set(P01.poster.x + P01.slot[i][0], P01.poster.y + P01.slot[i][1], P01.poster.z + 0.02)
const starAt = new THREE.Vector3(0, 0.74 + 0.31 + 0.235, -0.57)

function poster01(scene: THREE.Scene) {
  const g = new THREE.Group()
  const board = mat('#FFFFFF', { roughness: 0.6 })
  g.add(box(P01.pw, P01.ph, 0.012, board, [0, 0, -0.008], 0.004))
  g.add(picture(posterTex(), P01.pw - 0.02, P01.ph - 0.02, [0, 0, 0.0], { transparent: false }))
  /* the two side wings, angled forward */
  for (const sx of [-1, 1]) {
    const wing = new THREE.Group()
    wing.add(box(0.3, P01.ph, 0.012, board, [sx * 0.15, 0, 0], 0.004))
    wing.add(flat(box(0.22, 0.06, 0.002, mat(PIECE_COL[sx < 0 ? 0 : 1], { roughness: 0.6 }), [sx * 0.15, 0.12, 0.008])))
    wing.add(flat(box(0.22, 0.03, 0.002, mat('#D5DCE8'), [sx * 0.15, 0.0, 0.008])))
    wing.add(flat(box(0.18, 0.03, 0.002, mat('#D5DCE8'), [sx * 0.13, -0.07, 0.008])))
    wing.position.set(sx * P01.pw / 2, 0, -0.004)
    wing.rotation.y = -sx * 0.55
    g.add(wing)
  }
  g.position.copy(P01.poster)
  scene.add(g)
}

function setupT01Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F2EEE8')
  setCam(camera, CAM01, AT01, FOV01)
  lights(scene, [0, 1.0, -0.6])
  room(scene, { wall: '#EFE6D6', floor: plankTex('#E2CDAE', '#CDB38E', [8, 6]), trim: '#B9A386', wallZ: P01.wall })
  /* the classroom's green board behind the teacher, and a window to the left */
  scene.add(box(1.7, 0.86, 0.04, mat('#8C6440', { roughness: 0.5 }), [0, 1.86, P01.wall + 0.02], 0.01))
  scene.add(flat(box(1.6, 0.76, 0.01, mat('#3C7058', { roughness: 0.85, emissive: new THREE.Color('#3C7058'), emissiveIntensity: 0.15 }), [0, 1.86, P01.wall + 0.045])))
  scene.add(flat(box(1.6, 0.03, 0.06, mat('#8C6440'), [0, 1.47, P01.wall + 0.06])))
  for (const sx of [-1, 1]) {
    scene.add(flat(box(0.7, 0.9, 0.03, mat('#FFFFFF', { roughness: 0.5 }), [sx * 1.95, 1.75, P01.wall + 0.02], 0.01)))
    scene.add(flat(box(0.62, 0.82, 0.01, mat('#BFE0F5', { roughness: 0.2, emissive: new THREE.Color('#CFE8FA'), emissiveIntensity: 0.6 }), [sx * 1.95, 1.75, P01.wall + 0.04])))
    scene.add(flat(box(0.02, 0.82, 0.015, mat('#FFFFFF'), [sx * 1.95, 1.75, P01.wall + 0.05])))
  }
  const T = P01.table
  table(scene, T.x, T.z, T.w, T.d, T.h, '#C49A6C', '#8C6440')
  poster01(scene)
  /* a pencil cup and a glue stick on the table: the project's tools */
  scene.add(cyl(0.05, 0.05, 0.12, mat('#2D63FB', { roughness: 0.4 }), [-0.55, T.h + 0.06, T.z + 0.18], 20))
  for (const [dx, col] of [[-0.02, '#F2B33D'], [0.015, '#E4578F'], [0.0, '#14B8A6']] as const) scene.add(cyl(0.008, 0.008, 0.18, mat(col), [-0.55 + dx, T.h + 0.16, T.z + 0.18 + dx], 8))
  scene.add(cyl(0.025, 0.025, 0.1, mat('#F7F7F7'), [0.58, T.h + 0.05, T.z + 0.2], 16))
  scene.add(cyl(0.026, 0.026, 0.03, mat('#8B5CF6'), [0.58, T.h + 0.115, T.z + 0.2], 16))

  /* the pieces (each flies from its student's hand to its frame) and the star */
  const pieces = PIECE_COL.map((_, i) => {
    const g = cardMesh(pieceTex(i), 0.27, 0.15)
    g.visible = false
    scene.add(g)
    return g
  })
  const star = picture(starTex(), 0.27, 0.27, [0, 0, 0], { depthTest: true })
  star.visible = false
  scene.add(star)
  const starGlow = halo('rgba(247,197,72,0.9)', 0.6)
  starGlow.position.copy(starAt).add(new THREE.Vector3(0, 0, -0.01))
  scene.add(starGlow)

  /* the people: four students (two each end), the teacher behind the poster */
  const UNI = { topColor: '#F4F6FA' as const, accentColor: '#1F2E63' as const, shoeColor: '#1F2433' as const }
  const cfgs: CharacterConfig[] = [
    who(CAST_PRESETS.kabir, { name: 'Student', gender: 'male', skinTone: 'wheatish', hair: { style: 'curly', color: 'black' }, outfit: { ...UNI, top: 'hoodie', topColor: '#3B6FF0', bottom: 'jeans', bottomColor: '#2C3C81' }, accessories: { beard: 'none', glasses: 'none', watch: false } }),
    who(CAST_PRESETS.ananya, { name: 'Student', gender: 'female', skinTone: 'medium', hair: { style: 'ponytail', color: 'black' }, outfit: { ...UNI, top: 'tshirt', topColor: '#14B8A6', bottom: 'jeans', bottomColor: '#3E4A66' }, accessories: { earrings: true, glasses: 'none' } }),
    who(CAST_PRESETS.riya, { name: 'Student', gender: 'female', skinTone: 'dusky', hair: { style: 'braid', color: 'black' }, outfit: { ...UNI, top: 'kurta', topColor: '#F2A93B', bottom: 'salwar', bottomColor: '#F1E3C8' }, accessories: { glasses: 'round', earrings: false } }),
    who(CAST_PRESETS.rohan, { name: 'Student', gender: 'male', skinTone: 'fair', hair: { style: 'quiff', color: 'darkBrown' }, outfit: { ...UNI, top: 'polo', topColor: '#8B5CF6', bottom: 'trousers', bottomColor: '#2C3545' }, accessories: { beard: 'none', glasses: 'none', watch: true } }),
  ]
  const heights = [1.42, 1.38, 1.36, 1.44]
  const bodies = P01.people.map(([x, z], i) => body(cfgs[i], [x, 0, z], heights[i]))
  /* each student faces the poster: the left two look right, the right two look left */
  const dir = [1, -1, 1, -1]
  const side: ('L' | 'R')[] = ['R', 'L', 'R', 'L']
  const out = new THREE.Vector3()
  const reachArm = bodies.map((b, i) => reach(b, side[i], slotW(i, out).clone().lerp(b.root.clone().setY(1.05), 0.45), camera))
  const studentArm = (i: number) => (c: number): Arm => {
    const a = T01.add[i]
    return mixArm(REST, reachArm[i], hold(c, a - 0.32, a - 0.05, a + 0.25, a + 0.6))
  }
  const sArm = [0, 1, 2, 3].map(studentArm)
  const sPose = (i: number) => (p: Pose, c: number) => {
    const work = sArm[i](c)
    if (side[i] === 'R') setArms(p, REST, work)
    else setArms(p, work, REST)
    to(p, 'headTurn', dir[i] * 0.42, 1)
    to(p, 'lookX', dir[i] * 0.85, 1)
    /* watches the star go on, then the cheer */
    const up = hold(c, T01.raise[0], T01.raise[1], T01.star[1], T01.star[1] + 0.2)
    to(p, 'lookY', -0.5, up)
    const ch = hold(c, T01.cheer[0], T01.cheer[1], T01.cheer[2], T01.cheer[3])
    cheer(p, ch)
    to(p, 'mouthOpen', 0.35, ch)
  }
  const HB = devHold(HOLD01)
  const sFaces = (i: number): [number, string][] => [[0, 'neutral'], [T01.add[i] - 0.35, 'thinking'], [T01.add[i] + 0.6, 'happy'], [T01.cheer[0], 'excited'], [T01.cheer[3], 'happy'], [8.6, 'neutral']]
  const people: Sprite[] = bodies.map((b, i) => {
    const sp = person({ config: b.cfg, seed: 2201 + i, faces: sFaces(i), pose: sPose(i), loop: L01, height: b.h, frames: F01, redraw, holdT: HB })
    sp.object.position.copy(b.root)
    scene.add(sp.object)
    return sp
  })
  const tb = body(who(CAST_PRESETS.arjun, { name: 'Teacher', skinTone: 'medium', hair: { style: 'sidePart', color: 'black' }, outfit: { top: 'shirt', topColor: '#DDE7F7', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true, beard: 'short' } }), [P01.teacher[0], 0, P01.teacher[1]], 1.78)
  const raiseA: Arm = { s: 112, e: 78 }
  const tArm = (c: number): Arm => mixArm(REST, raiseA, hold(c, T01.raise[0], T01.raise[1], T01.star[0], T01.star[1]))
  const tPose = (p: Pose, c: number) => {
    setArms(p, REST, tArm(c))
    /* looks at each piece as it goes on, then up at the star, then smiles at the group */
    T01.add.forEach((a, i) => {
      const w = hold(c, a - 0.3, a - 0.1, a + 0.4, a + 0.6)
      to(p, 'headTurn', dir[i] * -0.5, w)
      to(p, 'lookX', dir[i] * -0.9, w)
      to(p, 'headNod', 0.18, w)
      to(p, 'lookY', 0.5, w)
    })
    const look = hold(c, T01.raise[0], T01.raise[1], T01.star[1], T01.star[1] + 0.3)
    to(p, 'headTurn', 0.2, look)
    to(p, 'lookX', 0.6, look)
    to(p, 'lookY', 0.2, look)
    talk(p, c, hold(c, T01.cheer[0], T01.cheer[0] + 0.1, T01.cheer[0] + 0.9, T01.cheer[0] + 1.0))
  }
  const tp = person({ config: tb.cfg, seed: 2209, faces: [[0, 'neutral'], [T01.raise[0], 'happy'], [T01.cheer[0], 'proud'], [8.5, 'neutral']], pose: tPose, loop: L01, height: tb.h, frames: F01, redraw, holdT: HB })
  tp.object.position.copy(tb.root)
  scene.add(tp.object)
  people.push(tp)
  const clk = slideClock('S22T01', scene, HB, people)
  const hand = new THREE.Vector3()
  const dst = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L01)
    const cq = frameT(c, L01, F01)
    people.forEach((sp) => sp.update(c, camera))
    /* the cheer's bounce */
    const ch = hold(c, T01.cheer[0], T01.cheer[1], T01.cheer[2], T01.cheer[3])
    people.slice(0, 4).forEach((sp, i) => (sp.object.position.y = ch * Math.abs(Math.sin((c - T01.cheer[0]) * Math.PI * 2.2 + i * 0.7)) * 0.05))
    const fade = 1 - seg(c, T01.clear[0], T01.clear[1])
    pieces.forEach((g, i) => {
      const a = T01.add[i]
      g.visible = c >= a - 0.05 && c < T01.clear[1]
      if (!g.visible) return
      slotW(i, dst)
      if (c < a + T01.fly) {
        handWorld(side[i], bodies[i].sh, sArm[i](cq), bodies[i].h, bodies[i].root, camera, hand, 0.08)
        const k = seg(c, a - 0.05, a + T01.fly)
        g.position.lerpVectors(hand, dst, k)
        g.position.y += Math.sin(k * Math.PI) * 0.1
        g.scale.setScalar(0.7 + 0.3 * k)
      } else {
        g.position.copy(dst)
        g.scale.setScalar(Math.max(0.001, fade * (1 + 0.08 * Math.sin(Math.min(1, (c - a - T01.fly) / 0.35) * Math.PI))))
      }
    })
    /* the star: in the teacher's raised hand, then onto the top of the poster */
    star.visible = c >= T01.raise[0] && c < T01.clear[1]
    if (star.visible) {
      handWorld('R', tb.sh, tArm(cq), tb.h, tb.root, camera, hand, 0.1)
      hand.y += 0.07
      if (c < T01.star[0]) star.position.copy(hand)
      else star.position.lerpVectors(hand, starAt, seg(c, T01.star[0], T01.star[1]))
      star.position.y += c >= T01.star[0] && c < T01.star[1] ? Math.sin(seg(c, T01.star[0], T01.star[1]) * Math.PI) * 0.12 : 0
      const k = c < T01.raise[0] + 0.3 ? pop(c, T01.raise[0]) : c >= T01.star[1] ? pop(c, T01.star[1], 0.4) : 1
      star.scale.setScalar(Math.max(0.001, k * fade))
      star.quaternion.copy(camera.quaternion)
    }
    const lit = hold(c, T01.star[1], T01.star[1] + 0.25, T01.clear[0], T01.clear[1])
    setOp(starGlow, 0.55 * lit * (0.75 + 0.25 * Math.sin(c * TAU * 0.9)))
    starGlow.quaternion.copy(camera.quaternion)
  }
}

/* ------------------------------------------------------------------ T01 concept: the developer and ops share one app */

const P01C = {
  screen: new THREE.Vector3(0, 1.38, -1.3), // the app screen's centre
  sw: 1.12,
  sh: 0.68,
  lamp: new THREE.Vector3(0, 1.84, -1.28),
  dev: [-1.28, -0.6] as const,
  rack: { x: 0.84, z: -0.95, w: 0.44, d: 0.5, h: 1.38 },
  ops: [1.34, -0.55] as const,
  /* the app window's four panels (screen-local) */
  slot: [[-0.255, 0.06], [0.255, 0.06], [-0.255, -0.18], [0.255, -0.18]] as const,
}
/* the same beats as the everyday card: piece i from dev (0, 2) or ops (1, 3) */
const OWN = [0, 1, 0, 1] as const
const appTex = () =>
  canvasTex(300, 184, (g) => {
    rr(g, 0, 0, 300, 184, 10, '#F4F7FD')
    rr(g, 0, 0, 300, 26, 10, '#1F2E63')
    for (const [i, col] of ['#FF8A3D', '#F2B33D', '#22C55E'].entries()) {
      g.fillStyle = col
      g.beginPath()
      g.arc(16 + i * 15, 13, 4.5, 0, TAU)
      g.fill()
    }
    g.strokeStyle = '#C9D5EC'
    g.lineWidth = 2.5
    g.setLineDash([7, 5])
    for (const [x, y] of [[22, 40], [158, 40], [22, 110], [158, 110]]) {
      g.beginPath()
      g.roundRect(x, y, 120, 60, 7)
      g.stroke()
    }
  })
/** an app panel: code (dev's, blue, code lines) or service (ops', teal, a gauge) */
const panelTex = (i: number) =>
  canvasTex(120, 60, (g) => {
    const col = OWN[i] === 0 ? '#2D63FB' : '#14B8A6'
    rr(g, 0, 0, 120, 60, 7, col)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    if (OWN[i] === 0) {
      const w = i === 0 ? [60, 82, 44] : [72, 50, 86]
      w.forEach((ww, k) => rr(g, 14 + (k === 1 ? 10 : 0), 12 + k * 14, ww, 7, 3.5, 'rgba(255,255,255,0.9)'))
    } else if (i === 1) {
      g.beginPath()
      g.arc(60, 44, 24, Math.PI, TAU)
      g.lineWidth = 7
      g.strokeStyle = 'rgba(255,255,255,0.9)'
      g.stroke()
      g.beginPath()
      g.moveTo(60, 44)
      g.lineTo(76, 28)
      g.lineWidth = 4
      g.stroke()
    } else {
      for (let k = 0; k < 3; k++) rr(g, 22, 10 + k * 15, 76, 11, 3, 'rgba(255,255,255,0.9)')
      g.fillStyle = col
      for (let k = 0; k < 3; k++) {
        g.beginPath()
        g.arc(88, 15.5 + k * 15, 3, 0, TAU)
        g.fill()
      }
    }
  })
const laptopScreenTex = () =>
  canvasTex(120, 76, (g) => {
    rr(g, 0, 0, 120, 76, 4, '#1F2E63')
    const rows = [[10, 50, '#7FA4FF'], [18, 64, '#F2B33D'], [18, 40, '#5EDB8E'], [10, 70, '#7FA4FF'], [18, 46, '#F2B33D'], [10, 30, '#7FA4FF']] as const
    rows.forEach(([x, w, col], k) => rr(g, x, 8 + k * 11, w, 5, 2.5, col))
  })

/** a laptop on a desk, its screen tilted toward the person behind or beside it; returns the keyboard centre */
function laptop(scene: THREE.Scene, x: number, y: number, z: number, rotY: number, screenTex: THREE.Texture) {
  const g = new THREE.Group()
  const body = mat('#C9D1DE', { metalness: 0.4, roughness: 0.35 })
  g.add(box(0.36, 0.016, 0.24, body, [0, 0.008, 0], 0.006))
  g.add(flat(box(0.3, 0.003, 0.14, mat('#5C6678', { roughness: 0.6 }), [0, 0.0175, 0.03])))
  const lid = new THREE.Group()
  lid.add(box(0.36, 0.23, 0.012, body, [0, 0.115, 0], 0.006))
  lid.add(picture(screenTex, 0.33, 0.2, [0, 0.118, 0.0075], { transparent: false }))
  lid.position.set(0, 0.016, -0.115)
  lid.rotation.x = -0.28
  g.add(lid)
  g.position.set(x, y, z)
  g.rotation.y = rotY
  scene.add(g)
  return g
}

function setupT01Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM01, AT01, FOV01)
  lights(scene, [0, 1.0, -0.6])
  room(scene, { wall: '#EEF2FA', floor: tileTex('#E3EAF8', '#C9D5EC', 2, [10, 8]), trim: '#1F2E63', wallZ: P01.wall, glow: 0.45 })
  /* the app screen on a stand, its frame, and the shared status lamp on top */
  const S = P01C
  scene.add(box(S.sw + 0.08, S.sh + 0.08, 0.05, mat('#1F2E63', { roughness: 0.35, metalness: 0.2 }), [S.screen.x, S.screen.y, S.screen.z - 0.03], 0.02))
  scene.add(picture(appTex(), S.sw, S.sh, [S.screen.x, S.screen.y, S.screen.z], { transparent: false }))
  scene.add(box(0.08, S.screen.y - S.sh / 2, 0.06, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [S.screen.x, (S.screen.y - S.sh / 2) / 2, S.screen.z - 0.05]))
  scene.add(box(0.5, 0.04, 0.34, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [S.screen.x, 0.02, S.screen.z + 0.04], 0.015))
  scene.add(cyl(0.08, 0.1, 0.05, mat('#2C3545', { roughness: 0.4 }), [S.lamp.x, S.lamp.y - 0.09, S.lamp.z], 24))
  const lampM = new THREE.MeshStandardMaterial({ color: '#C9D1DE', emissive: new THREE.Color(C.green), emissiveIntensity: 0, roughness: 0.25, transparent: true, opacity: 0.95 })
  const lamp = mesh(new THREE.SphereGeometry(0.085, 28, 18, 0, TAU, 0, Math.PI / 2), lampM, [S.lamp.x, S.lamp.y - 0.065, S.lamp.z])
  scene.add(lamp)
  const lampGlow = halo('rgba(34,197,94,0.95)', 0.7)
  lampGlow.position.set(S.lamp.x, S.lamp.y - 0.03, S.lamp.z + 0.05)
  scene.add(lampGlow)
  /* the developer, and his desk at his right with the laptop on it, side-on, at his elbow height (review 2026-11-24) */
  const db = body(who(CAST_PRESETS.dev, { name: 'Developer', skinTone: 'wheatish', hair: { style: 'short', color: 'black' }, outfit: { top: 'hoodie', topColor: '#3B6FF0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', beard: 'stubble', watch: false } }), [S.dev[0], 0, S.dev[1]], 1.7)
  const ty = typistDesk(scene, db, camera, { top: '#FFFFFF', leg: '#8E98AA', screen: laptopScreenTex(), key: 't01' })
  /* the server rack (ops' side) with its lights */
  const R = S.rack
  scene.add(box(R.w, R.h, R.d, mat('#1F2E63', { roughness: 0.3, metalness: 0.25 }), [R.x, R.h / 2, R.z], 0.02))
  const leds: THREE.MeshStandardMaterial[] = []
  for (let r = 0; r < 5; r++) {
    scene.add(flat(box(R.w - 0.08, 0.16, 0.012, mat('#2C3E7A', { roughness: 0.4 }), [R.x, 0.3 + r * 0.22, R.z + R.d / 2 + 0.004], 0.01)))
    for (let k = 0; k < 3; k++) {
      const m = glowM(k === 0 ? C.green : '#7FA4FF', '#3A4458')
      leds.push(m)
      scene.add(flat(sphere(0.012, m, [R.x + R.w / 2 - 0.08 - k * 0.04, 0.3 + r * 0.22, R.z + R.d / 2 + 0.012])))
    }
  }
  /* the pieces: code panels (from the laptop) and service panels (from the rack) */
  const pieces = [0, 1, 2, 3].map((i) => {
    const g = cardMesh(panelTex(i), 0.42, 0.21)
    g.visible = false
    scene.add(g)
    return g
  })
  const slot = (i: number, out: THREE.Vector3) => out.set(S.screen.x + S.slot[i][0], S.screen.y + S.slot[i][1] - 0.025, S.screen.z + 0.02)
  const fromLap = ty.center
  const fromRack = new THREE.Vector3(R.x - 0.05, 1.05, R.z + R.d / 2 + 0.05)

  /* the developer (laptop) and the operations engineer (rack) */
  const ob = body(who(CAST_PRESETS.meera, { name: 'Operations', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'polo', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { earrings: true, watch: true, glasses: 'none' } }), [S.ops[0], 0, S.ops[1]], 1.62)
  const devTyping = (c: number) => Math.max(...[0, 2].map((i) => hold(c, T01.add[i] - 0.6, T01.add[i] - 0.4, T01.add[i] + 0.1, T01.add[i] + 0.3)))
  const cheerW = (c: number) => hold(c, T01.cheer[0], T01.cheer[1], T01.cheer[2], T01.cheer[3])
  const atRack = reach(ob, 'L', new THREE.Vector3(R.x + 0.12, 1.05, R.z + R.d / 2), camera)
  const devPose = (p: Pose, c: number) => {
    /* hands on the keyboard all the time, typing for each of his pieces */
    const typing = devTyping(c)
    ty.pose(p, c, typing)
    to(p, 'headTurn', 0.35, 1)
    to(p, 'lookX', 0.7, 1)
    to(p, 'headNod', 0.22, typing)
    to(p, 'lookY', 0.6, typing)
    const look = hold(c, T01.raise[0], T01.raise[1] + 0.3, T01.cheer[2], T01.cheer[3])
    to(p, 'headTurn', 0.45, look)
    to(p, 'lookX', 0.9, look)
    to(p, 'lookY', -0.45, look)
    to(p, 'headNod', -0.1, look)
    const ch = cheerW(c)
    p.shoulderR = lerp(p.shoulderR, cheerArm.s, ch * 0.92)
    p.elbowR = lerp(p.elbowR, 20, ch * 0.92)
    openHand(p, ch, 'R')
  }
  const opsPose = (p: Pose, c: number) => {
    const press = Math.max(...[1, 3].map((i) => hold(c, T01.add[i] - 0.5, T01.add[i] - 0.25, T01.add[i] + 0.05, T01.add[i] + 0.35)))
    setArms(p, mixArm(REST, atRack, press), REST)
    to(p, 'headTurn', -0.4, 1)
    to(p, 'lookX', -0.8, 1)
    to(p, 'headNod', 0.12, press)
    const look = hold(c, T01.raise[0], T01.raise[1] + 0.3, T01.cheer[2], T01.cheer[3])
    to(p, 'headTurn', -0.5, look)
    to(p, 'lookX', -0.95, look)
    to(p, 'lookY', -0.45, look)
    to(p, 'headNod', -0.1, look)
    const ch = hold(c, T01.cheer[0], T01.cheer[1], T01.cheer[2], T01.cheer[3])
    p.shoulderL = lerp(p.shoulderL, cheerArm.s, ch * 0.92)
    p.elbowL = lerp(p.elbowL, 20, ch * 0.92)
    openHand(p, ch, 'L')
  }
  const HB = devHold(HOLD01)
  const faces: [number, string][] = [[0, 'neutral'], [0.1, 'thinking'], [T01.raise[0], 'listening'], [T01.cheer[0], 'excited'], [T01.cheer[3], 'happy'], [8.6, 'neutral']]
  const dp = person({ config: db.cfg, seed: 2211, faces, pose: devPose, loop: L01, height: db.h, frames: F01, redraw, holdT: HB })
  const op = person({ config: ob.cfg, dress: withNeck(LANYARD('#14B8A6')), seed: 2212, faces, pose: opsPose, loop: L01, height: ob.h, frames: F01, redraw, holdT: HB })
  dp.object.position.copy(db.root)
  op.object.position.copy(ob.root)
  scene.add(dp.object, op.object)
  const people = [dp, op]
  const devFront = ty.front(dp)
  const clk = slideClock('S22T01', scene, HB, people)
  const dst = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L01)
    people.forEach((sp) => sp.update(c, camera))
    /* his forearms and hands again, in front of the laptop (the right one leaves the keys for the cheer) */
    const cq = frameT(c, L01, F01)
    const [al, ar] = ty.arms(cq, devTyping(cq))
    devFront(al, cheerW(cq) > 0.02 ? null : ar, TWIST)
    const fade = 1 - seg(c, T01.clear[0], T01.clear[1])
    pieces.forEach((g, i) => {
      const a = T01.add[i]
      g.visible = c >= a - 0.05 && c < T01.clear[1]
      if (!g.visible) return
      slot(i, dst)
      if (c < a + T01.fly) {
        const k = seg(c, a - 0.05, a + T01.fly)
        g.position.lerpVectors(OWN[i] === 0 ? fromLap : fromRack, dst, k)
        g.position.y += Math.sin(k * Math.PI) * 0.22
        g.scale.setScalar(0.45 + 0.55 * k)
      } else {
        g.position.copy(dst)
        g.scale.setScalar(Math.max(0.001, fade * (1 + 0.06 * Math.sin(Math.min(1, (c - a - T01.fly) / 0.35) * Math.PI))))
      }
    })
    /* the rack's lights blink while ops works; the lamp turns green when the app runs */
    const busy = Math.max(...[1, 3].map((i) => hold(c, T01.add[i] - 0.4, T01.add[i] - 0.2, T01.add[i] + 0.2, T01.add[i] + 0.4)))
    leds.forEach((m, k) => (m.emissiveIntensity = 0.5 + (k % 3 === 0 ? 0.9 : 0.6 * busy * (0.5 + 0.5 * Math.sin(c * 18 + k)))))
    const lit = hold(c, T01.star[0] + 0.1, T01.star[1], T01.clear[0], T01.clear[1])
    lampM.emissiveIntensity = 2.2 * lit
    lampM.color.set(lit > 0.5 ? '#BFF5D2' : '#C9D1DE')
    lamp.scale.setScalar(1 + 0.12 * (c >= T01.star[1] ? pop(c, T01.star[1], 0.4) - 1 : 0) + 0.04 * lit * Math.sin(c * TAU * 0.9))
    setOp(lampGlow, 0.6 * lit * (0.75 + 0.25 * Math.sin(c * TAU * 0.9)))
    lampGlow.quaternion.copy(camera.quaternion)
  }
}

/* ================================================================== S22 review (2026-11-24): typing at a laptop, hands in front */

/*
 * The 2D rig faces the camera and cannot foreshorten, so a hand sent "into" the picture folds the arm, and a laptop in
 * front of a person hides the keyboard behind its lid. So a typist stands at the LEFT end of a desk, the laptop sits ON
 * the desk top at the typist's front-right, turned side-on with its screen toward the typist (the keyboard deck faces
 * the camera's side, the lid beyond it), at the typist's elbow height. Both hands land on the keys by IK in the picture
 * plane: elbows down and a little out at the sides, forearms coming in across the body to the keyboard (elbow bend
 * 90-110 degrees), wrists low, fingers curled on the keys, a small alternating tap. The shoulders slide a little toward
 * the desk (`twist`) and the head turns to the screen: a three-quarter turn the rig can draw.
 *
 * The laptop is in front of the typist's body, and the forearms and hands are in front of the laptop. One sprite cannot
 * layer that, so the forearms and hands are drawn a second time in front (Session 21 slide 33's technique): the same
 * frame on a copy of the sprite plane scaled about the camera (exactly the same pixels, only nearer), keeping only the
 * pixels inside each forearm (a capsule from elbow to hand, the sleeve's width) and the skin pixels round each hand.
 */

/** the rig point of an arm's elbow and hand, with the shoulders slid by `twist` px */
const elbowAt = (side: 'L' | 'R', sh: number, a: Arm, twist = 0): Pt => {
  const sg = side === 'L' ? -1 : 1
  return { x: 200 + sg * (sh - 6) + twist + sg * Math.sin(a.s * DEG) * UA, y: 205 + Math.cos(a.s * DEG) * UA }
}
const handAt = (side: 'L' | 'R', sh: number, a: Arm, twist = 0): Pt => {
  const p = handPt(side, sh, a)
  return { x: p.x + twist, y: p.y }
}
type ArmMode = 'low' | 'out' | 'straight'
/** the arm that puts this hand on world point k: 'low' the lower elbow, 'out' the elbow out at the side, 'straight' the
 *  least bend (a reach) */
function armAt(b: Body, side: 'L' | 'R', k: THREE.Vector3, camera: THREE.Camera, mode: ArmMode = 'low', twist = 0): Arm {
  const p = worldToRig(k, b.root, b.h, camera)
  const q = { x: p.x - twist, y: p.y }
  const a = ik2(side, b.sh, q, false)
  const d = ik2(side, b.sh, q, true)
  if (mode === 'low') return Math.cos(a.s * DEG) >= Math.cos(d.s * DEG) ? a : d
  if (mode === 'out') return Math.sin(a.s * DEG) >= Math.sin(d.s * DEG) ? a : d
  return Math.abs(a.e) <= Math.abs(d.e) ? a : d
}

/**
 * The forearms and hands of `sp` drawn again `d` metres nearer the camera (in front of a prop). Call the returned
 * function every frame with the arms of the frame the sprite is showing; `null` hides that arm's copy.
 */
function frontArms(scene: THREE.Scene, sp: Sprite, b: Body, camera: THREE.Camera, key: string, d: number) {
  const plane = (sp as unknown as { plane: THREE.Mesh }).plane
  const planeM = plane.material as THREE.MeshBasicMaterial
  const fore = { value: [new THREE.Vector4(), new THREE.Vector4()] }
  const hands = { value: [new THREE.Vector3(), new THREE.Vector3()] }
  const frontM = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false })
  frontM.map = planeM.map
  frontM.onBeforeCompile = (shd) => {
    shd.uniforms.uFore = fore
    shd.uniforms.uHand = hands
    shd.vertexShader = shd.vertexShader.replace('void main() {', 'varying vec2 vPlaneUv;\nvoid main() {\n  vPlaneUv = uv;')
    shd.fragmentShader = shd.fragmentShader
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
            if (length(pa - ba * u) < 12.5) keep = true;
            if (skin && distance(r, uHand[i].xy) < uHand[i].z) keep = true;
          }
          if (!keep) discard;
        }`,
      )
  }
  frontM.customProgramCacheKey = () => 's22-front-' + key
  const front = new THREE.Mesh(plane.geometry, frontM)
  front.matrixAutoUpdate = false
  front.renderOrder = 7
  scene.add(front)
  const camW = new THREE.Vector3()
  const scaleAbout = new THREE.Matrix4()
  const set = (i: number, side: 'L' | 'R', a: Arm | null, twist: number) => {
    if (!a) {
      fore.value[i].set(-999, -999, -999, -999)
      hands.value[i].set(-999, -999, 0)
      return
    }
    const e = elbowAt(side, b.sh, a, twist)
    const h = handAt(side, b.sh, a, twist)
    fore.value[i].set(e.x, e.y, h.x, h.y)
    hands.value[i].set(h.x, h.y, 34)
  }
  return (armL: Arm | null, armR: Arm | null, twist = 0) => {
    if (frontM.map !== planeM.map) frontM.map = planeM.map
    set(0, 'L', armL, twist)
    set(1, 'R', armR, twist)
    plane.updateWorldMatrix(true, false)
    camera.getWorldPosition(camW)
    const dist = camW.distanceTo(b.root.clone().setY(b.h * 0.55))
    const k = 1 - d / dist
    scaleAbout.makeTranslation(camW.x, camW.y, camW.z).multiply(new THREE.Matrix4().makeScale(k, k, k)).multiply(new THREE.Matrix4().makeTranslation(-camW.x, -camW.y, -camW.z))
    front.matrix.copy(scaleAbout).multiply(plane.matrixWorld)
    front.matrixWorldNeedsUpdate = true
    front.visible = plane.visible
  }
}

/** a typing hand: fingers curled onto the keys, the back of the hand up (side-on) */
function typingHand(p: Pose, side: 'L' | 'R', w: number, tap: number) {
  to(p, `f${side}1` as keyof Pose, 0.42 + 0.25 * tap, w)
  to(p, `f${side}2` as keyof Pose, 0.5 - 0.2 * tap, w)
  to(p, `f${side}3` as keyof Pose, 0.55, w)
  to(p, `f${side}4` as keyof Pose, 0.6, w)
  to(p, `t${side}` as keyof Pose, 0.45, w)
  to(p, `spread${side}` as keyof Pose, 0.15, w)
  to(p, `palm${side}` as keyof Pose, 0.05, w)
}

const TWIST = 8
/* the three-quarter typing arms (rig angles): the near arm (L) hangs from the shoulder and its forearm crosses in front
   of the body to the keys; the far arm (R) hangs straight down and its forearm reaches forward to the keys, the elbow
   bent ~90 degrees the way a side view shows it (the rig's negative bend is that projection) */
const TYPE_L: Arm = { s: -12, e: 66 }
const TYPE_R: Arm = { s: 6, e: -80 }
/**
 * A typist's desk and laptop: the desk at the typist's right, its top at the typist's elbow height, the laptop on it
 * with its screen turned to the typist and its keyboard under both hands. Returns the arms for loop time c (typing
 * weight), the pose layer, the laptop's centre, and the per-frame overlay of the forearms in front of the laptop.
 */
function typistDesk(scene: THREE.Scene, b: Body, camera: THREE.Camera, o: { top: string; leg: string; screen: THREE.Texture; key: string; deskW?: number }) {
  const tapOf = (c: number, side: 0 | 1) => Math.max(0, Math.sin(c * 26 + side * Math.PI))
  /** the arms at loop time c: the fingers tap (a small lift of each forearm, alternately) while `typing` is on */
  const arms = (c: number, typing: number): [Arm, Arm] => {
    const tl = tapOf(c, 0) * typing
    const tr = tapOf(c, 1) * typing
    return [{ s: TYPE_L.s, e: TYPE_L.e + 4 * tl }, { s: TYPE_R.s, e: TYPE_R.e - 4 * tr }]
  }
  /* the keyboard sits under the two resting hands, a little nearer the camera than the body */
  const hL = rigToWorld(handAt('L', b.sh, TYPE_L, TWIST), b.h, b.root, camera, new THREE.Vector3())
  const hR = rigToWorld(handAt('R', b.sh, TYPE_R, TWIST), b.h, b.root, camera, new THREE.Vector3())
  const mid = hL.clone().add(hR).multiplyScalar(0.5)
  towardCamera(mid, camera, 0.16)
  const rotY = -Math.PI / 2 + 1.0
  const kb = new THREE.Vector3(0, 0.022, 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
  const deskH = mid.y - 0.035
  const lapX = mid.x - kb.x
  const lapZ = mid.z - kb.z
  const W = o.deskW ?? 0.56
  table(scene, lapX + W / 2 - 0.2, lapZ - 0.04, W, 0.46, deskH, o.top, o.leg)
  const lap = laptop(scene, lapX, deskH, lapZ, rotY, o.screen)
  lap.updateMatrixWorld(true)
  /** the pose layer: arms on the keys (blended by `on`), the shoulders turned to the desk, fingers on the keys */
  const pose = (p: Pose, c: number, typing: number, on = 1) => {
    const [l, r] = arms(c, typing)
    setArms(p, mixArm(REST, l, on), mixArm(REST, r, on))
    p.twist += TWIST * on
    typingHand(p, 'L', on, tapOf(c, 0) * typing)
    typingHand(p, 'R', on, tapOf(c, 1) * typing)
    to(p, 'headTurn', 0.42, on)
    to(p, 'lookX', 0.85, on)
    to(p, 'headNod', 0.22, on)
    to(p, 'lookY', 0.55, on)
  }
  return { lap, deskH, arms, pose, front: (sp: Sprite) => frontArms(scene, sp, b, camera, o.key, 0.34), center: lap.localToWorld(new THREE.Vector3(0, 0.12, -0.02)) }
}

/** a hand closed round something held (a brick) */
function grip(p: Pose, side: 'L' | 'R', w: number) {
  for (const k of [1, 2, 3, 4]) to(p, `f${side}${k}` as keyof Pose, 0.82, w)
  to(p, `t${side}` as keyof Pose, 0.65, w)
  to(p, `spread${side}` as keyof Pose, 0.1, w)
  to(p, `palm${side}` as keyof Pose, 0.15, w)
}

/* ================================================================== T06 · the architect's blueprint / the plan stage */

const L06 = 9
const F06 = 108
const HOLD06 = 7.6 /* the drawing open on the table, the wall complete in its likeness */
const CAM06: V3 = [0, 1.42, 4.2]
const AT06: V3 = [0, 0.98, -0.7]
const FOV06 = 35
const COURSES = 4
const PER = 4
const P06 = {
  table: { x: -0.86, z: -0.42, w: 0.78, d: 0.54, h: 0.88 },
  sheet: { w: 0.64, h: 0.43 },
  /* the architect stands at the table's left end, in FRONT of the drawing (review 2026-11-24: his hand on top of it) */
  arch: [-1.4, -0.24] as const,
  wall: { x0: 0.2, z: -0.55, bw: 0.27, bh: 0.12, bd: 0.12, gap: 0.012 },
  workers: [[0.4, -1.0], [1.16, -1.0]] as const,
  /* the brick stand between the two workers, at their hand height */
  stand: [0.78, -1.12] as const,
  standH: 0.6,
}
/* each worker lays his two bricks of each course, both at once: pick from the stand, carry, set it on the wall (review
   2026-11-24: every brick comes from a worker's hand) */
const T06 = { unroll: [0.25, 1.25] as const, pointPlan: [1.3, 1.85] as const, pointSite: [1.9, 2.45] as const, b0: 2.55, done: 7.25, clear: [8.25, 8.85] as const }
const CY = (T06.done - T06.b0) / 8
const LAY = { pick: 0.17, grab: 0.22, carry: 0.42, set: 0.52 }
/** worker w's j-th brick (0..7): its course and column (worker 0: columns 0, 1; worker 1: columns 3, 2) */
const brickOf = (w: number, j: number) => {
  const row = Math.floor(j / 2)
  const col = w === 0 ? j % 2 : 3 - (j % 2)
  return row * PER + col
}
/** brick k's worker and turn */
const turnOf = (k: number) => {
  const row = Math.floor(k / PER)
  const col = k % PER
  return col < 2 ? { w: 0, j: row * 2 + col } : { w: 1, j: row * 2 + (3 - col) }
}
const brickT = (k: number) => T06.b0 + turnOf(k).j * CY
/** brick k's centre: course by course, bottom up, odd courses set half a brick along (a stretcher bond) */
function brickAt(k: number, out: THREE.Vector3) {
  const W = P06.wall
  const row = Math.floor(k / PER)
  const col = k % PER
  const pitch = W.bw + W.gap
  out.set(W.x0 + col * pitch + (row % 2 ? pitch / 2 : 0) + W.bw / 2, 0.06 + row * (W.bh + W.gap) + W.bh / 2, W.z)
  return out
}
/** the drawing: the wall in the same bond, white lines on blueprint blue; courses already built filled pale */
function drawPlan(g: CanvasRenderingContext2D, w: number, h: number, done: number, kind: 'blueprint' | 'plan') {
  const bg = kind === 'blueprint' ? '#1F5FC8' : '#FFFFFF'
  const line = kind === 'blueprint' ? 'rgba(255,255,255,0.92)' : '#2D63FB'
  const fill = kind === 'blueprint' ? 'rgba(170,205,255,0.55)' : 'rgba(45,99,251,0.22)'
  rr(g, 0, 0, w, h, 6, bg)
  if (kind === 'blueprint') {
    g.strokeStyle = 'rgba(255,255,255,0.22)'
    g.lineWidth = 1
    for (let x = 10; x < w; x += 16) {
      g.beginPath()
      g.moveTo(x, 6)
      g.lineTo(x, h - 6)
      g.stroke()
    }
    for (let y = 10; y < h; y += 16) {
      g.beginPath()
      g.moveTo(6, y)
      g.lineTo(w - 6, y)
      g.stroke()
    }
  } else {
    rr(g, 0, 0, w, 18, 6, '#1F2E63')
    for (let k = 0; k < 3; k++) {
      rr(g, w - 64, 28 + k * 22, 14, 14, 3, done > k + 1 ? '#22C55E' : '#D5DCE8')
      rr(g, w - 44, 32 + k * 22, 34, 6, 3, '#C9D5EC')
    }
  }
  const per = kind === 'blueprint' ? PER : 5
  const rows = kind === 'blueprint' ? COURSES : 4
  const area = kind === 'blueprint' ? { x: 22, y: 20, w: w - 44, h: h - 46 } : { x: 16, y: 30, w: w - 96, h: h - 46 }
  const bw = area.w / (per + 0.5)
  const bh = area.h / rows
  g.lineWidth = 2
  g.strokeStyle = line
  for (let r = 0; r < rows; r++) {
    const y = area.y + area.h - (r + 1) * bh
    for (let c2 = 0; c2 < per; c2++) {
      const x = area.x + c2 * bw + (r % 2 ? bw / 2 : 0)
      if (r < done) {
        g.fillStyle = fill
        g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3)
      }
      g.strokeRect(x + 1.5, y + 1.5, bw - 3, bh - 3)
    }
  }
  if (kind === 'blueprint') {
    /* dimension ticks under the wall */
    g.beginPath()
    g.moveTo(area.x, h - 14)
    g.lineTo(area.x + area.w, h - 14)
    g.moveTo(area.x, h - 19)
    g.lineTo(area.x, h - 9)
    g.moveTo(area.x + area.w, h - 19)
    g.lineTo(area.x + area.w, h - 9)
    g.stroke()
  }
}
const coursesDone = (c: number, n: number, per: number, t: (k: number) => number, after = 0.15) => {
  let d = 0
  for (let r = 0; r < n; r++) {
    let last = 0
    for (let k = r * per; k < (r + 1) * per; k++) last = Math.max(last, t(k))
    if (c >= last + after) d = r + 1
  }
  return d
}

function setupT06Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#D9EAF8')
  setCam(camera, CAM06, AT06, FOV06)
  lights(scene, [0, 1.0, -0.6])
  /* the site: packed earth, a hoarding of planks along the back, scaffolding of the building behind */
  scene.add(floorPlane(10, 8, mat('#ffffff', { map: tileTex('#D9C29E', '#CDB38E', 1, [6, 5]), roughness: 0.95 }), [0, 0, 1.6]))
  scene.add(flat(box(10, 1.2, 0.06, mat('#ffffff', { map: plankTex('#C9A273', '#A9824F', [10, 1.2]), roughness: 0.9 }), [0, 0.6, -2.0])))
  const pole = mat('#9AA3B2', { metalness: 0.5, roughness: 0.4 })
  for (let i = 0; i < 6; i++) scene.add(flat(cyl(0.025, 0.025, 2.6, pole, [-2.0 + i * 0.8, 1.3, -2.5], 10)))
  for (let j = 0; j < 3; j++) scene.add(flat(box(4.2, 0.04, 0.04, pole, [0, 1.25 + j * 0.62, -2.5])))
  for (let j = 0; j < 2; j++) scene.add(flat(box(4.2, 0.03, 0.4, mat('#B5835A', { roughness: 0.8 }), [0, 1.27 + j * 0.62, -2.35])))
  /* a traffic cone, and the brick stand the workers take from */
  scene.add(cyl(0.0, 0.11, 0.3, mat('#FF8A3D', { roughness: 0.5 }), [-1.95, 0.15, -0.1], 20))
  scene.add(flat(cyl(0.035, 0.07, 0.04, mat('#FFFFFF'), [-1.95, 0.18, -0.1], 20)))
  const brickM = mat('#C4573A', { roughness: 0.75 })
  const W = P06.wall
  const brickGeo = new RoundedBoxGeometry(W.bw, W.bh, W.bd, 2, 0.008)
  {
    const [sx, sz] = P06.stand
    const wood = mat('#B5835A', { roughness: 0.75 })
    scene.add(box(0.5, 0.04, 0.3, wood, [sx, P06.standH - 0.02, sz], 0.008))
    for (const dx of [-0.21, 0.21]) for (const dz of [-0.11, 0.11]) scene.add(box(0.035, P06.standH - 0.04, 0.035, wood, [sx + dx, (P06.standH - 0.04) / 2, sz + dz]))
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
      const b = new THREE.Mesh(brickGeo, brickM)
      b.scale.set(0.62, 1, 1)
      b.position.set(sx + (k - 0.5) * 0.18, P06.standH + W.bh / 2 + r * (W.bh + 0.003), sz)
      b.castShadow = b.receiveShadow = true
      scene.add(b)
    }
  }
  /* the footing the wall stands on */
  scene.add(box(PER * (W.bw + W.gap) + 0.22, 0.06, W.bd + 0.12, mat('#A7AFBD', { roughness: 0.9 }), [W.x0 + (PER * (W.bw + W.gap)) / 2 + 0.08, 0.03, W.z], 0.01))
  /* the drawing table and the blueprint on it (it unrolls from its left edge; the roll travels right) */
  const T = P06.table
  table(scene, T.x, T.z, T.w, T.d, T.h, '#C49A6C', '#8C6440')
  const live = liveTex(240, 160, (g, d) => drawPlan(g, 240, 160, d, 'blueprint'))
  const S = P06.sheet
  const sheetPivot = new THREE.Group()
  sheetPivot.position.set(T.x - S.w / 2, T.h + 0.012, T.z + 0.02)
  sheetPivot.rotation.x = -Math.PI / 2 + 0.95
  scene.add(sheetPivot)
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(S.w, S.h), basic(live.tex, { transparent: false, side: THREE.DoubleSide }))
  sheet.position.set(S.w / 2, 0, 0)
  const sheetG = new THREE.Group()
  sheetG.add(sheet)
  sheetPivot.add(sheetG)
  const roll = cyl(0.028, 0.028, S.h + 0.02, mat('#2F6FD6', { roughness: 0.6 }), [0, 0, 0.026], 20)
  sheetPivot.add(roll)
  /* the bricks of the wall */
  const bricks = Array.from({ length: COURSES * PER }, (_, k) => {
    const b = new THREE.Mesh(brickGeo, brickM)
    b.castShadow = b.receiveShadow = true
    b.visible = false
    brickAt(k, b.position)
    scene.add(b)
    return b
  })
  /* the architect and the two workers */
  const ab = body(who(CAST_PRESETS.arjun, { name: 'Architect', skinTone: 'medium', hair: { style: 'quiff', color: 'black' }, outfit: { top: 'shirt', topColor: '#F2F5FA', bottom: 'trousers', bottomColor: '#3E4A66', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true, beard: 'none' } }), [P06.arch[0], 0, P06.arch[1]], 1.72)
  const wb = [
    body(who(CAST_PRESETS.rohan, { name: 'Worker', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'tshirt', topColor: '#3B6FF0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#5A4632' }, accessories: { beard: 'short', glasses: 'none', watch: false } }), [P06.workers[0][0], 0, P06.workers[0][1]], 1.72),
    body(who(CAST_PRESETS.kabir, { name: 'Worker', skinTone: 'wheatish', hair: { style: 'buzz', color: 'black' }, outfit: { top: 'tshirt', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#4A4A52', shoeColor: '#5A4632' }, accessories: { beard: 'stubble', glasses: 'none', watch: true } }), [P06.workers[1][0], 0, P06.workers[1][1]], 1.66),
  ]
  /* his right hand gives the roll a push (it rolls on by itself), then points on the drawing, then out to the site; he
     stands in front of the drawing, so his hand is drawn over it */
  sheetPivot.updateMatrixWorld(true)
  const onSheet = (x: number, y: number) => sheetPivot.localToWorld(new THREE.Vector3(x, y, 0.03))
  const openK = (c: number) => lerp(0.04, 1, seg(c, T06.unroll[0], T06.unroll[1]))
  const pointAtPlan = armAt(ab, 'R', onSheet(0.17, 0.04), camera, 'low')
  const pointAtSite: Arm = { s: 96, e: 6 }
  const archPose = (p: Pose, c: number) => {
    const push = hold(c, T06.unroll[0] - 0.12, T06.unroll[0] + 0.05, 0.62, 0.8)
    const onRoll = armAt(ab, 'R', onSheet(S.w * Math.min(openK(c), 0.42), -0.06), camera, 'low')
    let r = mixArm(REST, onRoll, push)
    r = mixArm(r, pointAtPlan, hold(c, T06.pointPlan[0] - 0.1, T06.pointPlan[0] + 0.1, T06.pointSite[0], T06.pointSite[0] + 0.1))
    r = mixArm(r, pointAtSite, hold(c, T06.pointSite[0], T06.pointSite[0] + 0.2, T06.pointSite[1], T06.pointSite[1] + 0.3))
    setArms(p, REST, r)
    pointHand(p, hold(c, T06.pointPlan[0], T06.pointPlan[0] + 0.1, T06.pointSite[1], T06.pointSite[1] + 0.2), 'R')
    /* looks down at the drawing, then over at the wall as it rises */
    const down = hold(c, 0.1, 0.3, T06.pointSite[0], T06.pointSite[0] + 0.15)
    to(p, 'headTurn', 0.3, 1)
    to(p, 'lookX', 0.6, 1)
    to(p, 'headNod', 0.3, down)
    to(p, 'lookY', 0.8, down)
    const site = hold(c, T06.pointSite[0], T06.pointSite[0] + 0.2, T06.clear[0], T06.clear[1])
    to(p, 'headTurn', 0.5, site)
    to(p, 'lookX', 0.95, site)
    to(p, 'lookY', 0.25, site)
    talk(p, c, hold(c, T06.pointPlan[0], T06.pointPlan[0] + 0.08, T06.pointSite[1] - 0.1, T06.pointSite[1]))
  }
  /* worker w lays his bricks: hand to the stand, takes a brick, carries it over its place, sets it down, and the next */
  const side: ('L' | 'R')[] = ['R', 'L']
  const pileP = (w: number) => new THREE.Vector3(P06.stand[0] + (w === 0 ? -0.09 : 0.09), P06.standH + 0.16, P06.stand[1] + 0.06)
  const slotP = (k: number) => brickAt(k, new THREE.Vector3())
  const aboveP = (k: number) => {
    const q = slotP(k)
    return new THREE.Vector3(q.x, Math.max(q.y + 0.2, 0.7), -0.9)
  }
  const setP = (k: number) => {
    const q = slotP(k)
    return new THREE.Vector3(q.x, Math.max(q.y + 0.1, 0.64), -0.86)
  }
  const armsCache = wb.map((b, w) => ({
    pile: armAt(b, side[w], pileP(w), camera, 'low'),
    above: Array.from({ length: 8 }, (_, j) => armAt(b, side[w], aboveP(brickOf(w, j)), camera, 'low')),
    set: Array.from({ length: 8 }, (_, j) => armAt(b, side[w], setP(brickOf(w, j)), camera, 'low')),
  }))
  /** worker w's working arm at loop time c, and whether a brick is in his hand */
  const layArm = (w: number, c: number): Arm => {
    const A = armsCache[w]
    if (c < T06.b0 - 0.05) return REST
    const j = Math.max(0, Math.min(7, Math.floor((c - T06.b0) / CY)))
    const u = c - (T06.b0 + j * CY)
    const from = j === 0 ? REST : A.set[j - 1]
    if (j === 7 && u > LAY.set) return mixArm(A.set[7], REST, seg(u, LAY.set + 0.05, LAY.set + 0.45))
    if (u < LAY.pick) return mixArm(from, A.pile, seg(u, 0, LAY.pick))
    if (u < LAY.grab) return A.pile
    if (u < LAY.carry) return mixArm(A.pile, A.above[j], seg(u, LAY.grab, LAY.carry))
    return mixArm(A.above[j], A.set[j], seg(u, LAY.carry, LAY.set))
  }
  const otherArm: Arm = { s: 10, e: 34 }
  const wPose = (i: number) => (p: Pose, c: number) => {
    const work = hold(c, T06.b0 - 0.3, T06.b0, T06.done + 0.3, T06.done + 0.6)
    const arm = layArm(i, c)
    const arm2 = mixArm(REST, otherArm, work)
    if (side[i] === 'R') setArms(p, arm2, arm)
    else setArms(p, arm, arm2)
    grip(p, side[i], work)
    to(p, 'headNod', 0.32, work)
    to(p, 'lookY', 0.85, work)
    to(p, 'headTurn', i === 0 ? 0.15 : -0.15, work)
    /* they look across to the drawing as the architect points */
    const listen = hold(c, T06.pointPlan[0], T06.pointPlan[0] + 0.2, T06.pointSite[1], T06.pointSite[1] + 0.2)
    to(p, 'headTurn', -0.5, listen)
    to(p, 'lookX', -0.95, listen)
    to(p, 'headNod', 0.1, listen)
  }
  const HB = devHold(HOLD06)
  const archFaces: [number, string][] = [[0, 'neutral'], [0.2, 'thinking'], [T06.pointPlan[0], 'happy'], [T06.done, 'proud'], [8.6, 'neutral']]
  const wFaces: [number, string][] = [[0, 'neutral'], [T06.pointPlan[0], 'listening'], [T06.b0, 'thinking'], [T06.done, 'proud'], [8.6, 'neutral']]
  const ap = person({ config: ab.cfg, dress: hatOnly('#FFFFFF', '#B7C1CF'), seed: 2231, faces: archFaces, pose: archPose, loop: L06, height: ab.h, frames: F06, redraw, holdT: HB })
  ap.object.position.copy(ab.root)
  scene.add(ap.object)
  const people = [ap]
  wb.forEach((b, i) => {
    const sp = person({ config: b.cfg, dress: crew(i === 0 ? '#F2B33D' : '#FF8A3D', i === 0 ? '#C8891A' : '#C8641A'), seed: 2232 + i, faces: wFaces, pose: wPose(i), loop: L06, height: b.h, frames: F06, redraw, holdT: HB })
    sp.object.position.copy(b.root)
    scene.add(sp.object)
    people.push(sp)
  })
  /* the working forearm and hand drawn again in front of the brick it carries (the brick is in front of the body) */
  const wFront = wb.map((b, w) => frontArms(scene, people[1 + w], b, camera, 'w' + w, 0.16))
  const clk = slideClock('S22T06', scene, HB, people)
  const hand = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L06)
    people.forEach((sp) => sp.update(c, camera))
    /* the drawing opens and rolls up again at the end */
    const open = seg(c, T06.unroll[0], T06.unroll[1]) * (1 - seg(c, T06.clear[0], T06.clear[1]))
    const k = lerp(0.04, 1, open)
    sheetG.scale.x = k
    roll.position.x = S.w * k
    live.paint(c < T06.clear[0] ? coursesDone(c, COURSES, PER, brickT, LAY.set) : 0)
    /* each brick: in its worker's hand (just behind the fingers, so the hand is over it), then set on its course */
    const sink = seg(c, T06.clear[0], T06.clear[1])
    const cq = frameT(c, L06, F06)
    wb.forEach((_, w) => {
      let carrying = false
      for (let j = 0; j < 8; j++) {
        const a = T06.b0 + j * CY
        if (cq >= a + LAY.grab - 0.03 && cq < a + LAY.set) carrying = true
      }
      const arm = carrying ? layArm(w, cq) : null
      if (side[w] === 'R') wFront[w](null, arm)
      else wFront[w](arm, null)
    })
    bricks.forEach((b, i) => {
      const { w } = turnOf(i)
      const a = brickT(i)
      b.visible = c >= a + LAY.grab - 0.02 && sink < 0.999
      if (!b.visible) return
      const inHand = c < a + LAY.set
      if (inHand) {
        const bw = wb[w]
        handWorld(side[w], bw.sh, layArm(w, cq), bw.h, bw.root, camera, hand, 0.08)
        hand.y -= 0.035
        if (c < a + LAY.carry) b.position.copy(hand)
        else {
          const q = seg(c, a + LAY.carry, a + LAY.set)
          b.position.lerpVectors(hand, brickAt(i, tmp), q)
        }
      } else brickAt(i, b.position)
      b.position.y -= sink * 0.6
      b.scale.setScalar(1 - sink * 0.4)
    })
  }
}

/* ------------------------------------------------------------------ T06 concept: the plan before the code */

const hatOnly = (hat: string, edge: string) => (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{HARD_HAT(hat, edge)}</> })
const BPER = 5
const BROWS = 4
const T06C = { open: [0.25, 1.25] as const, point: [1.3, 1.85] as const, hand: [1.9, 2.5] as const, b0: 2.75, dt: 0.22, done: 7.25 }
const blockT = (k: number) => T06C.b0 + k * T06C.dt
const P06C = {
  board: new THREE.Vector3(-0.86, 1.18, -0.5),
  bw: 0.62,
  bh: 0.44,
  /* the planner stands beside the easel and in FRONT of it (review 2026-11-24: her hand over the card) */
  planner: [-1.42, -0.3] as const,
  dev: [0.5, -1.08] as const,
  wall: { x0: 0.27, z: -0.5, bw: 0.215, bh: 0.11, bd: 0.12, gap: 0.014 },
}
function blockAt(k: number, out: THREE.Vector3) {
  const W = P06C.wall
  const row = Math.floor(k / BPER)
  const col = k % BPER
  const pitch = W.bw + W.gap
  out.set(W.x0 + col * pitch + (row % 2 ? pitch / 2 : 0) + W.bw / 2, 0.02 + row * (W.bh + W.gap) + W.bh / 2, W.z)
  return out
}
/** a code block's face: code lines in three colours (no characters) */
const codeFaceTex = (v: number) =>
  canvasTex(108, 56, (g) => {
    rr(g, 0, 0, 108, 56, 7, '#1F2E63')
    const rows = [[8, 46, '#7FA4FF'], [16, 60, '#F2B33D'], [16, 36, '#5EDB8E'], [8, 54, '#7FA4FF']] as const
    rows.forEach(([x, w, col], k) => rr(g, x + ((k + v) % 2) * 4, 8 + k * 11, w - ((k * 7 + v * 11) % 18), 5, 2.5, col))
  })

function setupT06Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM06, AT06, FOV06)
  lights(scene, [0, 1.0, -0.6])
  room(scene, { wall: '#EEF2FA', floor: tileTex('#E3EAF8', '#C9D5EC', 2, [10, 8]), trim: '#1F2E63', wallZ: -1.9, glow: 0.45 })
  /* a window strip and a shelf, so it reads as the team's office */
  scene.add(flat(box(1.6, 0.7, 0.02, mat('#A9D2F5', { roughness: 0.2, emissive: new THREE.Color('#B9DBF8'), emissiveIntensity: 0.35 }), [0.3, 1.9, -1.88])))
  for (const x of [-0.5, 0.3, 1.1]) scene.add(flat(box(0.03, 0.7, 0.03, mat('#FFFFFF'), [x, 1.9, -1.86])))
  /* the plan board on its easel; the plan card on it opens like the blueprint */
  const B = P06C
  const easel = mat('#5C6678', { metalness: 0.4, roughness: 0.4 })
  for (const sx of [-1, 1]) {
    const leg = cyl(0.016, 0.016, 1.45, easel, [B.board.x + sx * 0.26, 0.7, B.board.z - 0.06], 10)
    leg.rotation.z = sx * 0.08
    scene.add(leg)
  }
  scene.add(box(B.bw + 0.1, B.bh + 0.1, 0.03, mat('#FFFFFF', { roughness: 0.5 }), [B.board.x, B.board.y, B.board.z - 0.02], 0.01))
  scene.add(flat(box(B.bw + 0.12, 0.03, 0.06, easel, [B.board.x, B.board.y - B.bh / 2 - 0.07, B.board.z])))
  const live = liveTex(220, 156, (g, d) => drawPlan(g, 220, 156, d, 'plan'))
  const cardPivot = new THREE.Group()
  cardPivot.position.set(B.board.x - B.bw / 2, B.board.y, B.board.z + 0.002)
  scene.add(cardPivot)
  const planCard = new THREE.Mesh(new THREE.PlaneGeometry(B.bw, B.bh), basic(live.tex, { transparent: false }))
  planCard.position.set(B.bw / 2, 0, 0)
  const cardG = new THREE.Group()
  cardG.add(planCard)
  cardPivot.add(cardG)
  /* the copy handed to the developer: it flies to the desk and lies beside the laptop */
  const handed = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.156), basic(live.tex, { transparent: false, side: THREE.DoubleSide }))
  handed.visible = false
  scene.add(handed)
  /* the developer types at a laptop on the desk at his right (review 2026-11-24: hands on the keys) */
  const db = body(who(CAST_PRESETS.dev, { name: 'Developer', skinTone: 'medium', hair: { style: 'curly', color: 'black' }, outfit: { top: 'hoodie', topColor: '#14B8A6', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', beard: 'short', watch: false } }), [B.dev[0], 0, B.dev[1]], 1.7)
  const ty = typistDesk(scene, db, camera, { top: '#FFFFFF', leg: '#8E98AA', screen: laptopScreenTex(), key: 't06' })
  const deskCard = ty.lap.localToWorld(new THREE.Vector3(0.32, -0.01, 0.06)).setY(ty.deskH + 0.006)
  /* the code blocks (the wall of code), each its own face */
  const W = B.wall
  const blockGeo = new RoundedBoxGeometry(W.bw, W.bh, W.bd, 2, 0.012)
  const faces = [0, 1, 2].map(codeFaceTex)
  const blocks = Array.from({ length: BPER * BROWS }, (_, k) => {
    const g = new THREE.Group()
    const m = new THREE.Mesh(blockGeo, mat('#2D63FB', { roughness: 0.3, metalness: 0.1 }))
    m.castShadow = m.receiveShadow = true
    g.add(m)
    g.add(picture(faces[k % 3], W.bw - 0.03, W.bh - 0.03, [0, 0, W.bd / 2 + 0.002], { transparent: false }))
    g.visible = false
    scene.add(g)
    return g
  })
  const fromLap = ty.center
  /* the planner and the developer */
  const pb = body(who(CAST_PRESETS.riya, { name: 'Planner', skinTone: 'wheatish', hair: { style: 'bob', color: 'black' }, outfit: { top: 'blouse', topColor: '#5856DC', bottom: 'trousers', bottomColor: '#1B3F80', shoeColor: '#1B3F80' }, accessories: { earrings: true, glasses: 'round', watch: true } }), [B.planner[0], 0, B.planner[1]], 1.62)
  /* her right hand opens the card from its left edge (it unfolds the rest of the way itself), points at the drawing on
     it, then offers it to the developer (palm up, toward him) */
  const onCard = (x: number, y: number) => new THREE.Vector3(B.board.x - B.bw / 2 + x, B.board.y + y, B.board.z + 0.01)
  const pointAtCard = armAt(pb, 'R', onCard(0.17, 0.02), camera, 'low')
  const offer: Arm = { s: 32, e: -38 }
  const openW = (c: number) => lerp(0.04, 1, seg(c, T06C.open[0], T06C.open[1]))
  const planPose = (p: Pose, c: number) => {
    const open = hold(c, T06C.open[0] - 0.12, T06C.open[0] + 0.05, 0.62, 0.8)
    let r = mixArm(REST, armAt(pb, 'R', onCard(B.bw * Math.min(openW(c), 0.36), -0.08), camera, 'low'), open)
    r = mixArm(r, pointAtCard, hold(c, T06C.point[0] - 0.1, T06C.point[0] + 0.1, T06C.hand[0], T06C.hand[0] + 0.1))
    r = mixArm(r, offer, hold(c, T06C.hand[0], T06C.hand[0] + 0.2, T06C.hand[1], T06C.hand[1] + 0.3))
    setArms(p, REST, r)
    pointHand(p, hold(c, T06C.point[0], T06C.point[0] + 0.1, T06C.hand[0], T06C.hand[0] + 0.1), 'R')
    openHand(p, hold(c, T06C.hand[0], T06C.hand[0] + 0.1, T06C.hand[1], T06C.hand[1] + 0.2), 'R')
    to(p, 'headTurn', 0.3, 1)
    to(p, 'lookX', 0.65, 1)
    const site = hold(c, T06C.hand[0], T06C.hand[0] + 0.2, 8.25, 8.85)
    to(p, 'headTurn', 0.5, site)
    to(p, 'lookX', 0.95, site)
    talk(p, c, hold(c, T06C.point[0], T06C.point[0] + 0.08, T06C.hand[1] - 0.1, T06C.hand[1]))
  }
  const devTyping = (c: number) => hold(c, T06C.b0 - 0.4, T06C.b0 - 0.1, T06C.done, T06C.done + 0.3)
  const devPose = (p: Pose, c: number) => {
    ty.pose(p, c, devTyping(c))
    const listen = hold(c, T06C.point[0], T06C.point[0] + 0.2, T06C.b0 - 0.4, T06C.b0 - 0.2)
    to(p, 'headTurn', -0.5, listen)
    to(p, 'lookX', -0.95, listen)
    const look = hold(c, T06C.done, T06C.done + 0.3, 8.25, 8.85)
    to(p, 'headNod', 0.15, look)
    to(p, 'lookY', 0.6, look)
  }
  const HB = devHold(HOLD06)
  const pp = person({ config: pb.cfg, dress: withTop(BLAZER('#1F2E63', '#121C40')), seed: 2241, faces: [[0, 'neutral'], [0.2, 'thinking'], [T06C.point[0], 'happy'], [T06C.done, 'proud'], [8.6, 'neutral']], pose: planPose, loop: L06, height: pb.h, frames: F06, redraw, holdT: HB })
  const dp = person({ config: db.cfg, seed: 2242, faces: [[0, 'neutral'], [T06C.point[0], 'listening'], [T06C.b0, 'thinking'], [T06C.done, 'proud'], [8.6, 'neutral']], pose: devPose, loop: L06, height: db.h, frames: F06, redraw, holdT: HB })
  pp.object.position.copy(pb.root)
  dp.object.position.copy(db.root)
  scene.add(pp.object, dp.object)
  const people = [pp, dp]
  const devFront = ty.front(dp)
  const clk = slideClock('S22T06', scene, HB, people)
  const dst = new THREE.Vector3()
  const from = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L06)
    people.forEach((sp) => sp.update(c, camera))
    const cq = frameT(c, L06, F06)
    const [al, ar] = ty.arms(cq, devTyping(cq))
    devFront(al, ar, TWIST)
    const open = seg(c, T06C.open[0], T06C.open[1]) * (1 - seg(c, 8.25, 8.85))
    cardG.scale.x = lerp(0.04, 1, open)
    live.paint(c < 8.25 ? coursesDone(c, BROWS, BPER, blockT) : 0)
    /* the handed copy: from the board to the desk, then lying there */
    handed.visible = c >= T06C.hand[0] + 0.1 && c < 8.85
    if (handed.visible) {
      from.set(B.board.x, B.board.y, B.board.z + 0.05)
      const k = seg(c, T06C.hand[0] + 0.1, T06C.hand[1] + 0.2)
      handed.position.lerpVectors(from, deskCard, k)
      handed.position.y += Math.sin(k * Math.PI) * 0.3
      handed.rotation.set(lerp(0, -Math.PI / 2 + 0.25, k), 0, lerp(0, 0.15, k))
      handed.scale.setScalar(Math.max(0.001, lerp(0.6, 1, k) * (1 - seg(c, 8.25, 8.85))))
    }
    const sink = seg(c, 8.25, 8.85)
    blocks.forEach((g, i) => {
      const a = blockT(i)
      g.visible = c >= a - 0.25 && sink < 0.999
      if (!g.visible) return
      blockAt(i, dst)
      const k = seg(c, a - 0.25, a)
      g.position.lerpVectors(fromLap, dst, k)
      g.position.y += Math.sin(k * Math.PI) * 0.18 - sink * 0.6
      g.scale.setScalar(lerp(0.4, 1, k) * (1 - sink * 0.4))
    })
  }
}

/* ================================================================== T12 · photographs and a second album / commits and a branch */

const L12 = 9
const F12 = 108
const HOLD12 = 7.3 /* two photos and the moved-back one in the main album, one left in the second album */
const CAM12: V3 = [0.15, 1.38, 3.65]
const AT12: V3 = [0.15, 0.97, -0.7]
const FOV12 = 34
/* shots 0, 1 go to the main album (slots 0, 1); shots 2, 3 to the second (slots 0, 1); photo of shot 2 moves to main slot 2 */
const T12 = { shot: [0.9, 1.9, 3.75, 4.65], fly: 0.55, album2: [2.55, 3.05] as const, idea: [2.85, 3.3] as const, back: [5.6, 6.5] as const, clear: [8.25, 8.85] as const }
const BLUE_F = '#3B6FF0'
const TEAL_F = '#14B8A6'
const P12 = {
  table: { x: 0.35, z: -0.5, w: 1.56, d: 0.62, h: 0.72 },
  album: [new THREE.Vector3(-0.02, 0.742 + 0.21 * Math.sin(0.62), -0.46), new THREE.Vector3(0.8, 0.742 + 0.21 * Math.sin(0.62), -0.46)] as const,
  aw: 0.66,
  ah: 0.42,
  vase: new THREE.Vector3(1.48, 0, -0.98),
  photographer: [-1.0, -0.36] as const,
}
/* an album page's slot k (0..5: two rows of three across both pages), in album-local x, y */
const slotXY = (k: number): [number, number] => [-0.22 + (k % 3) * 0.22, 0.083 - Math.floor(k / 3) * 0.166]
const ALBUM_TILT = -Math.PI / 2 + 0.62
/** a photograph: a white border, a sky, the vase with flowers in its colour */
const photoTex = (flower: string) =>
  canvasTex(80, 62, (g) => {
    rr(g, 0, 0, 80, 62, 3, '#FFFFFF')
    rr(g, 5, 5, 70, 52, 2, '#DCEBFA')
    rr(g, 5, 42, 70, 15, 0, '#E9DCC4')
    rr(g, 33, 30, 14, 18, 3, '#7E8AA3')
    g.strokeStyle = '#3E8E50'
    g.lineWidth = 2
    for (const dx of [-7, 0, 7]) {
      g.beginPath()
      g.moveTo(40, 31)
      g.lineTo(40 + dx, 19)
      g.stroke()
    }
    g.fillStyle = flower
    for (const [dx, dy] of [[-7, 16], [0, 13], [7, 16]]) {
      g.beginPath()
      g.arc(40 + dx, dy, 5, 0, TAU)
      g.fill()
    }
    /* review round 2 (2026-11-24): the bird caught in flight, wings spread, in the photo's sky */
    g.strokeStyle = BIRD.body
    g.lineWidth = 2.4
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(10, 15)
    g.quadraticCurveTo(14.5, 8.5, 19, 14)
    g.quadraticCurveTo(23.5, 8.5, 28, 15)
    g.stroke()
    g.fillStyle = BIRD.body
    g.beginPath()
    g.ellipse(19, 14.5, 3, 2, 0, 0, TAU)
    g.fill()
  })
/** review round 2 (2026-11-24, user: "a moving subject ... captured at a single moment"): a bird flies round the vase and
 * freezes mid-flight at each flash, its motion trail gone, then flies on. Colours and the loop are the scene's own. */
const BIRD = { body: '#2D63FB', belly: '#F5F7FF', beak: '#F2A93B', c: [0.92, 1.52, -1.05] as const, rx: 0.38, rz: 0.19, ry: 0.06, freeze: 0.45, laps: 2, flaps: 36 }
/** the bird's own clock: wall time minus the frozen spells at each shot, so its path still closes over the loop */
const birdT = (c: number) => c - T12.shot.reduce((a, s) => a + Math.min(BIRD.freeze, Math.max(0, c - s)), 0)
const BIRD_SPAN = L12 - T12.shot.length * BIRD.freeze
/** a small bird, flying along local +x: body, head, beak, tail, and two wings on hinges (opacity < 1 = a trail ghost) */
function bird(opacity = 1) {
  const o = opacity < 1 ? { transparent: true, opacity, depthWrite: false } : {}
  const bodyM = mat(BIRD.body, { roughness: 0.4, ...o })
  const bellyM = mat(BIRD.belly, { roughness: 0.5, ...o })
  const beakM = mat(BIRD.beak, { roughness: 0.4, ...o })
  const g = new THREE.Group()
  const b = sphere(0.034, bodyM, [0, 0, 0])
  b.scale.set(1.9, 0.95, 1)
  g.add(b)
  const belly = sphere(0.028, bellyM, [0.006, -0.012, 0])
  belly.scale.set(1.7, 0.7, 0.9)
  g.add(belly)
  g.add(sphere(0.026, bodyM, [0.064, 0.016, 0]))
  const beak = mesh(new THREE.ConeGeometry(0.009, 0.026, 12), beakM, [0.097, 0.012, 0])
  beak.rotation.z = -Math.PI / 2
  g.add(beak)
  for (const s of [-1, 1]) g.add(sphere(0.005, mat('#1A1F2B', o), [0.083, 0.024, s * 0.016]))
  const tail = box(0.06, 0.006, 0.042, bodyM, [-0.084, 0.006, 0])
  tail.rotation.z = 0.18
  g.add(tail)
  /* a swept wing: broad at the shoulder, a pointed tip trailing back (a flat shape, both faces drawn) */
  const sh = new THREE.Shape()
  sh.moveTo(0.032, 0)
  sh.quadraticCurveTo(0.036, 0.1, -0.02, 0.19)
  sh.quadraticCurveTo(-0.04, 0.11, -0.05, 0.08)
  sh.lineTo(-0.042, 0)
  sh.lineTo(0.032, 0)
  const wingM = mat(BIRD.body, { roughness: 0.45, side: THREE.DoubleSide, ...o })
  const wing = (s: number) => {
    const hinge = new THREE.Group()
    hinge.position.set(0.004, 0.014, s * 0.018)
    const geo = new THREE.ShapeGeometry(sh, 12)
    geo.rotateX(Math.PI / 2)
    if (s < 0) geo.scale(1, 1, -1)
    hinge.add(mesh(geo, wingM))
    g.add(hinge)
    return hinge
  }
  const wl = wing(-1)
  const wr = wing(1)
  if (opacity < 1) g.traverse((m) => ((m as THREE.Mesh).castShadow = false))
  g.scale.setScalar(1.5)
  return { g, wl, wr }
}
/** the bird's place and heading at bird time tb */
function birdAt(tb: number, out: THREE.Vector3) {
  const th = (TAU * BIRD.laps * tb) / BIRD_SPAN
  out.set(BIRD.c[0] + BIRD.rx * Math.cos(th), BIRD.c[1] + BIRD.ry * Math.sin(2 * th), BIRD.c[2] + BIRD.rz * Math.sin(th))
  /* heading: the path's tangent (d/dth of cos, sin) */
  return Math.atan2(-(BIRD.rz * Math.cos(th)), -BIRD.rx * Math.sin(th))
}
/** an open album: a cover (its colour) and two cream pages with six empty photo corners */
function album(cover: string) {
  const g = new THREE.Group()
  g.add(box(P12.aw + 0.04, 0.02, P12.ah + 0.04, mat(cover, { roughness: 0.5 }), [0, -0.012, 0], 0.008))
  const pages = canvasTex(240, 152, (c) => {
    rr(c, 0, 0, 240, 152, 4, '#FBF6EA')
    c.fillStyle = 'rgba(120,100,70,0.18)'
    c.fillRect(118, 0, 4, 152)
    c.strokeStyle = 'rgba(160,140,110,0.5)'
    c.lineWidth = 1.5
    c.setLineDash([4, 3])
    for (let k = 0; k < 6; k++) {
      const [x, y] = slotXY(k)
      const px = 120 + (x / P12.aw) * 240
      const py = 76 - (y / P12.ah) * 152
      c.strokeRect(px - 30, py - 23, 60, 46)
    }
  })
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(P12.aw, P12.ah), basic(pages, { transparent: false }))
  pg.rotation.x = -Math.PI / 2
  pg.position.y = 0.002
  g.add(pg)
  g.rotation.x = ALBUM_TILT + Math.PI / 2
  /* the album rests on a little wooden reading stand */
  const stand = new THREE.Group()
  const sa = ALBUM_TILT + Math.PI / 2
  const backH = P12.ah * Math.sin(sa)
  stand.add(box(P12.aw * 0.8, backH + 0.01, 0.025, mat('#8C6440', { roughness: 0.5 }), [0, -(P12.ah / 2) * Math.sin(sa) + (backH + 0.01) / 2 - 0.025, -(P12.ah / 2) * Math.cos(sa) - 0.02], 0.006))
  stand.add(box(P12.aw + 0.06, 0.03, 0.05, mat('#8C6440', { roughness: 0.5 }), [0, -(P12.ah / 2) * Math.sin(sa) - 0.012, (P12.ah / 2) * Math.cos(sa) + 0.012], 0.006))
  const holder = new THREE.Group()
  holder.add(g)
  holder.add(stand)
  return holder
}
/** where album a's slot k is, in the world */
function slotWorld(a: number, k: number, out: THREE.Vector3) {
  const [x, y] = slotXY(k)
  const base = P12.album[a]
  /* the page is tilted toward the camera about its centre: up the page goes up and back; the photo sits just off it */
  const ang = ALBUM_TILT + Math.PI / 2
  out.set(base.x + x, base.y + Math.sin(ang) * y + Math.cos(ang) * 0.006, base.z - Math.cos(ang) * y + Math.sin(ang) * 0.006)
  return out
}

function setupT12Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F2EEE8')
  setCam(camera, CAM12, AT12, FOV12)
  lights(scene, [0, 1.0, -0.6])
  room(scene, { wall: '#F1E7D5', floor: plankTex('#E2CDAE', '#CDB38E', [8, 6]), trim: '#B9A386', wallZ: -1.7 })
  /* a framed picture and a lamp: a living room */
  scene.add(box(0.62, 0.44, 0.03, mat('#8C6440', { roughness: 0.5 }), [-0.1, 1.85, -1.67], 0.01))
  scene.add(flat(picture(canvasTex(120, 84, (g) => {
    rr(g, 0, 0, 120, 84, 0, '#CFE3F5')
    g.fillStyle = '#7FB37A'
    g.beginPath()
    g.moveTo(0, 84)
    g.lineTo(40, 40)
    g.lineTo(70, 64)
    g.lineTo(92, 46)
    g.lineTo(120, 84)
    g.fill()
    g.fillStyle = '#F7C548'
    g.beginPath()
    g.arc(94, 22, 9, 0, TAU)
    g.fill()
  }), 0.54, 0.36, [-0.1, 1.85, -1.65], { transparent: false })))
  const T = P12.table
  table(scene, T.x, T.z, T.w, T.d, T.h, '#C49A6C', '#8C6440')
  /* the subject: a vase of flowers on a stand (its flowers change colour for the new idea) */
  const V = P12.vase
  scene.add(cyl(0.16, 0.18, 0.62, mat('#FFFFFF', { roughness: 0.5 }), [V.x, 0.31, V.z], 28))
  scene.add(cyl(0.07, 0.05, 0.22, mat('#7E8AA3', { roughness: 0.35 }), [V.x, 0.73, V.z], 24))
  const stemM = mat('#3E8E50', { roughness: 0.6 })
  const flowerM = mat(BLUE_F, { roughness: 0.45, emissive: new THREE.Color(BLUE_F), emissiveIntensity: 0.15 })
  for (const [dx, dy, dz] of [[-0.07, 0.24, 0.0], [0, 0.29, 0.02], [0.07, 0.24, -0.01], [0.03, 0.2, 0.05]] as const) {
    const st = cyl(0.006, 0.006, dy, stemM, [V.x + dx / 2, 0.84 + dy / 2, V.z + dz], 6)
    st.rotation.z = -dx * 2
    scene.add(st)
    scene.add(sphere(0.045, flowerM, [V.x + dx, 0.84 + dy, V.z + dz]))
  }
  /* the two albums: the main one, and the second one that appears for the new idea */
  const a0 = album('#2D63FB')
  a0.position.copy(P12.album[0])
  scene.add(a0)
  const a1 = album(TEAL_F)
  a1.position.copy(P12.album[1])
  scene.add(a1)
  /* the photos (one per shot), and the camera's flash */
  const tex = [photoTex(BLUE_F), photoTex(TEAL_F)]
  const photos = T12.shot.map((_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.165, 0.128), basic(tex[i < 2 ? 0 : 1], { transparent: false, side: THREE.DoubleSide }))
    m.visible = false
    scene.add(m)
    return m
  })
  const flash = halo('rgba(255,255,255,1)', 0.55)
  scene.add(flash)
  /* the moving subject: a bird in flight with a fading trail; at each flash it holds still, a moment frozen */
  const bd = bird()
  scene.add(bd.g)
  const ghosts = [0.32, 0.18, 0.08].map((o) => {
    const gh = bird(o)
    scene.add(gh.g)
    return gh
  })
  const bp = new THREE.Vector3()
  const placeBird = (bb: ReturnType<typeof bird>, tb: number, snap = false) => {
    const yaw = birdAt(tb, bp)
    bb.g.position.copy(bp)
    bb.g.rotation.set(0, yaw, 0.06 * Math.sin((TAU * BIRD.laps * tb) / BIRD_SPAN * 2))
    /* in flight the wings beat (biased upward, so they read from the side); frozen, they hold a raised V, mid-beat */
    const f = snap ? 0.7 : 0.2 + 0.65 * Math.sin((TAU * BIRD.flaps * tb) / BIRD_SPAN)
    bb.wl.rotation.x = f
    bb.wr.rotation.x = -f
  }
  /* the photographer, holding her camera in both hands */
  const pb = body(who(CAST_PRESETS.ananya, { name: 'Photographer', skinTone: 'medium', hair: { style: 'wavy', color: 'darkBrown' }, outfit: { top: 'blouse', topColor: '#F2A93B', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#7A4A2A' }, accessories: { earrings: true, watch: true, glasses: 'none' } }), [P12.photographer[0], 0, P12.photographer[1]], 1.62)
  const camAt = (up: number) => new THREE.Vector3(pb.root.x + 0.16, lerp(1.08, 1.28, up), pb.root.z + 0.16)
  const camArms = (up: number): [Arm, Arm] => {
    const k = camAt(up)
    return [reach(pb, 'L', k.clone().add(new THREE.Vector3(-0.09, -0.01, 0)), camera), reach(pb, 'R', k.clone().add(new THREE.Vector3(0.09, -0.01, 0)), camera)]
  }
  const upAt = (c: number) => Math.max(...T12.shot.map((s) => hold(c, s - 0.5, s - 0.2, s + 0.15, s + 0.45)))
  const photoPose = (p: Pose, c: number) => {
    const [l, r] = camArms(upAt(c))
    setArms(p, l, r)
    to(p, 'headTurn', 0.45, 1)
    to(p, 'lookX', 0.95, 1)
    /* she watches the photo go back into the main album */
    const back = hold(c, T12.back[0] - 0.2, T12.back[0] + 0.1, T12.back[1], T12.back[1] + 0.3)
    to(p, 'headTurn', 0.3, back)
    to(p, 'lookY', 0.6, back)
    to(p, 'headNod', 0.18, back)
    to(p, 'squint', 0.4, upAt(c))
  }
  const HB = devHold(HOLD12)
  const pp = person({ config: pb.cfg, seed: 2251, faces: [[0, 'neutral'], [0.4, 'thinking'], [T12.shot[1] + 0.3, 'happy'], [T12.idea[0], 'excited'], [T12.back[0], 'thinking'], [T12.back[1], 'proud'], [8.6, 'neutral']], pose: photoPose, loop: L12, height: pb.h, frames: F12, redraw, holdT: HB })
  pp.object.position.copy(pb.root)
  scene.add(pp.object)
  /* the camera prop: a body and a lens toward the vase, set between her hands (drawn behind the hands' plane) */
  const cam = new THREE.Group()
  cam.add(box(0.13, 0.085, 0.06, mat('#2C3545', { roughness: 0.35, metalness: 0.2 }), [0, 0, 0], 0.012))
  cam.add(box(0.04, 0.02, 0.04, mat('#2C3545', { roughness: 0.35 }), [-0.03, 0.052, 0], 0.005))
  const lens = cyl(0.03, 0.032, 0.06, mat('#1A1F2B', { roughness: 0.25, metalness: 0.4 }), [0.085, 0, 0], 24)
  lens.rotation.z = Math.PI / 2
  cam.add(lens)
  cam.add(flat(cyl(0.022, 0.022, 0.004, mat('#5D7BD8', { roughness: 0.1, metalness: 0.6 }), [0.117, 0, 0], 20)))
  cam.children[cam.children.length - 1].rotation.z = Math.PI / 2
  scene.add(cam)
  const people = [pp]
  const clk = slideClock('S22T12', scene, HB, people)
  const from = new THREE.Vector3()
  const dst = new THREE.Vector3()
  const cA = new THREE.Color(BLUE_F)
  const cB = new THREE.Color(TEAL_F)
  return (t: number) => {
    const c = mod(clk.time(t), L12)
    const cq = frameT(c, L12, F12)
    people.forEach((sp) => sp.update(c, camera))
    /* the camera follows her hands (the frame shown), a little behind them */
    const k = camAt(upAt(cq))
    cam.position.copy(k)
    towardCamera(cam.position, camera, -0.02)
    /* the flash at each shot */
    const fl = Math.max(...T12.shot.map((s) => hold(c, s - 0.04, s, s + 0.04, s + 0.22)))
    flash.position.copy(k).add(new THREE.Vector3(0.12, 0.02, 0.05))
    flash.quaternion.copy(camera.quaternion)
    setOp(flash, fl)
    /* the bird: flying, or frozen for a spell from each shot (its trail drops away while it is frozen) */
    /* the held frame (thumbnails, ?still at HOLD12) shows the key moment: the bird frozen as at the first shot */
    const heldBird = Math.abs(c - HOLD12) < 1e-6
    const tb = birdT(heldBird ? T12.shot[0] + 0.1 : c)
    const frozen = heldBird || T12.shot.some((s) => c >= s && c < s + BIRD.freeze)
    placeBird(bd, tb, frozen)
    ghosts.forEach((gh, i) => {
      gh.g.visible = !frozen
      if (!frozen) placeBird(gh, tb - 0.055 * (i + 1))
    })
    /* the new idea: the flowers change colour, and change back as the loop ends */
    const idea = seg(c, T12.idea[0], T12.idea[1]) * (1 - seg(c, T12.clear[0], T12.clear[1]))
    flowerM.color.copy(cA).lerp(cB, idea)
    flowerM.emissive.copy(flowerM.color)
    /* the second album appears for the new idea and leaves at the end */
    const a1k = c < T12.album2[0] ? 0 : (c < T12.album2[1] ? pop(c, T12.album2[0], T12.album2[1] - T12.album2[0]) : 1) * (1 - seg(c, T12.clear[0], T12.clear[1]))
    a1.visible = a1k > 0.01
    a1.scale.setScalar(Math.max(0.001, a1k))
    const fade = 1 - seg(c, T12.clear[0], T12.clear[1])
    photos.forEach((m, i) => {
      const s = T12.shot[i]
      m.visible = c >= s && c < T12.clear[1]
      if (!m.visible) return
      const toAlbum = i < 2 ? 0 : 1
      slotWorld(toAlbum, i % 2, dst)
      from.copy(k).add(new THREE.Vector3(0.05, 0.08, 0.05))
      if (i === 2 && c >= T12.back[0]) {
        /* moved back: from the second album's slot to the main album's third slot */
        slotWorld(1, 0, from)
        slotWorld(0, 2, dst)
        const q = seg(c, T12.back[0], T12.back[1])
        m.position.lerpVectors(from, dst, q)
        m.position.y += Math.sin(q * Math.PI) * 0.22
      } else {
        const q = seg(c, s, s + T12.fly)
        m.position.lerpVectors(from, dst, q)
        m.position.y += Math.sin(q * Math.PI) * 0.3
      }
      /* face the camera in flight, lie on the page once placed */
      const flying = i === 2 && c >= T12.back[0] ? hold(c, T12.back[0], T12.back[0] + 0.15, T12.back[1] - 0.15, T12.back[1]) : 1 - seg(c, s + T12.fly - 0.15, s + T12.fly)
      m.quaternion.copy(camera.quaternion)
      m.rotation.set(lerp(ALBUM_TILT, m.rotation.x, flying), m.rotation.y * flying, m.rotation.z * flying)
      m.scale.setScalar(Math.max(0.001, fade))
    })
  }
}

/* ------------------------------------------------------------------ T12 concept: commits on main, a branch, a merge */

const P12C = {
  dev: [-1.04, -0.46] as const,
  z: -0.62,
  mainY: 1.02,
  branchY: 1.42,
  x0: -0.24,
  x1: 1.5,
  mainC: [-0.18, 0.14] as const, // commits on main (shots 0, 1)
  split: 0.14, // the branch leaves after commit 2
  branchC: [0.6, 0.92] as const, // commits on the branch (shots 2, 3)
  merge: 1.3, // the merge commit on main
}
function tube(path: THREE.Curve<THREE.Vector3>, r: number, m: THREE.Material, segs = 80) {
  const geo = new THREE.TubeGeometry(path, segs, r, 12, false)
  const o = new THREE.Mesh(geo, m)
  o.castShadow = true
  o.geometry.setDrawRange(0, 0)
  const total = segs * 12 * 6
  return { o, set: (k: number) => o.geometry.setDrawRange(0, Math.floor(total * clamp01(k) / 6) * 6) }
}

function setupT12Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM12, AT12, FOV12)
  lights(scene, [0, 1.0, -0.6])
  room(scene, { wall: '#EEF2FA', floor: tileTex('#E3EAF8', '#C9D5EC', 2, [10, 8]), trim: '#1F2E63', wallZ: -1.7, glow: 0.45 })
  const S = P12C
  /* the developer and her laptop (where the camera was), on the desk at her right, her hands on its keys (review
     2026-11-24) */
  const db = body(who(CAST_PRESETS.meera, { name: 'Developer', skinTone: 'wheatish', hair: { style: 'ponytail', color: 'black' }, outfit: { top: 'hoodie', topColor: '#3B6FF0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#2A2A30' }, accessories: { earrings: true, glasses: 'rect', watch: false, bindi: false } }), [S.dev[0], 0, S.dev[1]], 1.62)
  const tyd = typistDesk(scene, db, camera, { top: '#FFFFFF', leg: '#8E98AA', screen: laptopScreenTex(), key: 't12', deskW: 0.44 })
  const lapFlash = halo('rgba(127,164,255,1)', 0.5)
  scene.add(lapFlash)
  /* the history's stage: a long low white plinth under the lines (the table's place) */
  scene.add(box(1.9, 0.4, 0.42, mat('#FFFFFF', { roughness: 0.45 }), [0.58, 0.2, S.z - 0.02], 0.03))
  scene.add(flat(box(1.92, 0.03, 0.44, mat('#C9D5EC', { roughness: 0.4 }), [0.58, 0.4, S.z - 0.02], 0.01)))
  /* the history's backboard behind the lines (the album's page) */
  scene.add(box(1.96, 0.72, 0.03, mat('#FBFCFF', { roughness: 0.5, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.2 }), [0.58, 1.2, S.z - 0.2], 0.02))
  /* the main line (it grows with its commits; its last stretch arrives with the merge) and the branch */
  const lineM = mat(C.brand, { roughness: 0.3, metalness: 0.15 })
  const branchM = mat(TEAL_F, { roughness: 0.3, metalness: 0.15 })
  const v = (x: number, y: number) => new THREE.Vector3(x, y, S.z)
  const main1 = tube(new THREE.LineCurve3(v(S.x0, S.mainY), v(S.split, S.mainY)), 0.02, lineM, 40)
  const main2 = tube(new THREE.LineCurve3(v(S.split, S.mainY), v(S.x1, S.mainY)), 0.02, lineM, 60)
  const out = new THREE.CubicBezierCurve3(v(S.split, S.mainY), v(S.split + 0.2, S.mainY), v(S.split + 0.12, S.branchY), v(S.split + 0.32, S.branchY))
  const run = new THREE.LineCurve3(v(S.split + 0.32, S.branchY), v(S.merge - 0.32, S.branchY))
  const back = new THREE.CubicBezierCurve3(v(S.merge - 0.32, S.branchY), v(S.merge - 0.12, S.branchY), v(S.merge - 0.2, S.mainY), v(S.merge, S.mainY))
  const br1 = tube(out, 0.018, branchM, 40)
  const br2 = tube(run, 0.018, branchM, 40)
  const br3 = tube(back, 0.018, branchM, 40)
  for (const t of [main1, main2, br1, br2, br3]) scene.add(t.o)
  /* the commits (one per shot) and the merge commit */
  const dotM = (col: string) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.1, emissive: new THREE.Color(col), emissiveIntensity: 0.12 })
  const commitPos = [v(S.mainC[0], S.mainY), v(S.mainC[1], S.mainY), v(S.branchC[0], S.branchY), v(S.branchC[1], S.branchY)]
  const commits = commitPos.map((p, i) => {
    const g = new THREE.Group()
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.062, 28, 18), dotM(i < 2 ? C.brand : TEAL_F))
    m.castShadow = true
    g.add(m)
    g.add(flat(new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.009, 10, 32), mat('#FFFFFF', { roughness: 0.3 }))))
    g.position.copy(p)
    g.visible = false
    scene.add(g)
    return g
  })
  const mergeG = new THREE.Group()
  const mm = new THREE.Mesh(new THREE.SphereGeometry(0.076, 28, 18), dotM(C.brand))
  mm.castShadow = true
  mergeG.add(mm)
  mergeG.add(flat(new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.014, 10, 36), mat(TEAL_F, { roughness: 0.3 }))))
  mergeG.position.copy(v(S.merge, S.mainY))
  mergeG.visible = false
  scene.add(mergeG)
  /* the token in flight (laptop to its place), and the one riding the branch home */
  const tokens = commitPos.map((_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 14), dotM(i < 2 ? C.brand : TEAL_F))
    m.visible = false
    scene.add(m)
    return m
  })
  const rider = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), dotM(TEAL_F))
  rider.visible = false
  scene.add(rider)
  const typingAt = (c: number) => Math.max(...T12.shot.map((s) => hold(c, s - 0.55, s - 0.35, s - 0.02, s + 0.15)))
  const devPose = (p: Pose, c: number) => {
    tyd.pose(p, c, typingAt(c))
    const back = hold(c, T12.back[0] - 0.2, T12.back[0] + 0.1, T12.back[1], T12.back[1] + 0.3)
    to(p, 'headTurn', 0.5, back)
    to(p, 'lookX', 0.95, back)
    to(p, 'lookY', -0.1, back)
  }
  const HB = devHold(HOLD12)
  const dp = person({ config: db.cfg, seed: 2261, faces: [[0, 'neutral'], [0.4, 'thinking'], [T12.shot[1] + 0.3, 'happy'], [T12.idea[0], 'excited'], [T12.back[0], 'thinking'], [T12.back[1], 'proud'], [8.6, 'neutral']], pose: devPose, loop: L12, height: db.h, frames: F12, redraw, holdT: HB })
  dp.object.position.copy(db.root)
  scene.add(dp.object)
  const people = [dp]
  const devFront = tyd.front(dp)
  const clk = slideClock('S22T12', scene, HB, people)
  const from = tyd.center.clone()
  const flashAt = tyd.lap.localToWorld(new THREE.Vector3(0, 0.12, -0.05))
  return (t: number) => {
    const c = mod(clk.time(t), L12)
    people.forEach((sp) => sp.update(c, camera))
    const cq = frameT(c, L12, F12)
    const [al, ar] = tyd.arms(cq, typingAt(cq))
    devFront(al, ar, TWIST)
    const fade = 1 - seg(c, T12.clear[0], T12.clear[1])
    const fl = Math.max(...T12.shot.map((s) => hold(c, s - 0.04, s, s + 0.04, s + 0.22)))
    lapFlash.position.copy(flashAt)
    lapFlash.quaternion.copy(camera.quaternion)
    setOp(lapFlash, 0.8 * fl)
    /* the lines: main grows to each new commit; the branch appears with the second album; main's last stretch and the
       branch's way home arrive with the merge */
    const f0 = (S.mainC[0] - S.x0) / (S.split - S.x0)
    main1.set((seg(c, T12.shot[0], T12.shot[0] + T12.fly) * f0 + seg(c, T12.shot[1], T12.shot[1] + T12.fly) * (1 - f0)) * fade)
    br1.set(seg(c, T12.album2[0], T12.album2[1]) * fade)
    br2.set(Math.max(seg(c, T12.shot[2], T12.shot[2] + T12.fly) * 0.45, seg(c, T12.shot[3], T12.shot[3] + T12.fly) * 0.85, seg(c, T12.back[0], T12.back[0] + 0.25)) * fade)
    br3.set(seg(c, T12.back[0] + 0.2, T12.back[1] - 0.15) * fade)
    main2.set(seg(c, T12.back[0] + 0.2, T12.back[1] - 0.15) * ((S.merge - S.split) / (S.x1 - S.split)) * fade + seg(c, T12.back[1], T12.back[1] + 0.4) * ((S.x1 - S.merge) / (S.x1 - S.split)) * fade)
    commits.forEach((g, i) => {
      const s = T12.shot[i]
      const land = s + T12.fly
      g.visible = c >= land - 0.05 && c < T12.clear[1]
      g.scale.setScalar(Math.max(0.001, (c < land + 0.35 ? pop(c, land - 0.05) : 1) * fade))
      const m = tokens[i]
      m.visible = c >= s && c < land
      if (m.visible) {
        const q = seg(c, s, land)
        m.position.lerpVectors(from, commitPos[i], q)
        m.position.y += Math.sin(q * Math.PI) * 0.28
      }
    })
    /* the branch's work rides home and becomes the merge commit */
    rider.visible = c >= T12.back[0] && c < T12.back[1] - 0.1
    if (rider.visible) {
      const q = seg(c, T12.back[0], T12.back[1] - 0.1)
      if (q < 0.4) run.getPoint(lerp(0.75, 1, q / 0.4), rider.position)
      else back.getPoint((q - 0.4) / 0.6, rider.position)
    }
    mergeG.visible = c >= T12.back[1] - 0.15 && c < T12.clear[1]
    mergeG.scale.setScalar(Math.max(0.001, (c < T12.back[1] + 0.3 ? pop(c, T12.back[1] - 0.15, 0.4) : 1) * fade))
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
  H_T01Everyday: card('S22T01', setupT01Everyday, devHold(HOLD01)),
  H_T01Concept: card('S22T01', setupT01Concept, devHold(HOLD01)),
  H_T06Everyday: card('S22T06', setupT06Everyday, devHold(HOLD06)),
  H_T06Concept: card('S22T06', setupT06Concept, devHold(HOLD06)),
  H_T12Everyday: card('S22T12', setupT12Everyday, devHold(HOLD12)),
  H_T12Concept: card('S22T12', setupT12Concept, devHold(HOLD12)),
}
export const css = ''
