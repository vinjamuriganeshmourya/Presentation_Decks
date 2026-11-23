import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import dockerUrl from '../images/tech-docker.svg'
import cmUrl from '../images/k8s-cm.svg'
import ingUrl from '../images/k8s-ing.svg'
import svcUrl from '../images/k8s-svc.svg'
import nsUrl from '../images/k8s-ns.svg'
import podUrl from '../images/k8s-pod.svg'
import k8sUrl from '../images/tech-kubernetes.svg'
import netUrl from '../images/res-internet.svg'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER H · SESSION 21 (Kubernetes in Practice) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`, built
 * the way Session 18's h/i/j.tsx are: a perspective camera on a real place, Character Lab people from the engine's
 * `castSprite` at a fixed `px: 256` with no idle breathing, expressions keyed to the action, NO TEXT on either card, ONE
 * wall-clock loop per slide shared by both cards (`./clock`: the cards fade in once every person has a first frame, a
 * tap pauses both), every loop ending in the state it starts in, held frames (`?still`, thumbnails) at HOLD. Kubernetes
 * objects carry their official marks (on white tiles); a mark never moves on its own, its tile or lamp does.
 *
 * SLIDE T01-AN (TR 1): "A college prints one common question paper for every centre, but each centre pastes a slip with
 * its room number: just as a ConfigMap attaches environment settings without changing the image."
 *
 *   place (x)     everyday: an exam hall office                    concept: a cluster's two environments
 *   0             the college copier, one stack of the SAME paper  the image registry, one stack of the SAME image
 *   -1.45 / 1.45  centre A / centre B: a desk with a paper stand   environment A / B: a platform for the image
 *   (behind)      the invigilator with her / his slip pad          the ConfigMap stand holding its settings card
 *   (back wall)   the room door, its colour plate (blue / green)   the environment's database, the same colour
 *
 *   0.3 - 1.8     a copy flies to each centre (A first, then B)    a copy of the image flies to each environment
 *   1.6 - 3.4     each invigilator pastes her own slip on top      each ConfigMap card clips onto the image
 *   3.4 - 6.6     the same paper, two slips (the rooms light)      the same image, two settings (each links its DB)
 *   6.6 - 7.6     the papers go into the exam packets             the images sink into their platforms (running)
 *
 * SLIDE T06-AN (TR 6): "An office receptionist directs each visitor to the right floor by name: just as Ingress routes
 * each request to the right service by hostname or path."
 *
 *   place (x)     everyday: an office lobby                        concept: the cluster's front
 *   -2.2          the receptionist behind her counter              the Ingress gate (its mark on the pedestal)
 *   (counter)     her screen with the visitor list                 the rule list (one row per service)
 *   -0.55         the glass entrance door                          the way in from the Internet
 *   -1.15         where a visitor stops at the counter             where a request stops at the gate
 *   0.3/1.1/1.9   three lifts (gold, teal, blue floors)            three Services (the same colours)
 *
 *   Every 3 s a visitor (request) comes in, stops, is shown the way (the arm / the gate's pointer turns to the lift
 *   / service, its lamp lights), walks over and steps in; the three visitors go to three different floors.
 *
 * SLIDE T08-AN (TR 8): "A school campus splits students into separate classrooms in one building, each keeping its own
 * attendance register: just as a namespace keeps names private within its own slice of one cluster."
 *
 *   place (x)     everyday: one school building                    concept: one cluster
 *   -1.65/0/1.65  three classrooms side by side                    three namespaces side by side
 *   (back wall)   each room's blackboard                           each namespace's mark
 *   (left)        the teacher with the room's register             the namespace's own name list
 *   (right)       two students at their desks (a name plate each)  two pods (a name plate each)
 *   star plate    a student with the SAME name in rooms 1 and 3    a pod with the SAME name in namespaces 1 and 3
 *
 *   0.5 - 2.3     each teacher calls the first name, the student   each list checks its first pod (it hops), a tick
 *                 raises a hand, a tick in that room's register   in that namespace's list; the two star pods at once
 *   2.5 - 4.3     the second name, the same                         the second pod, the same
 *   4.3 - 7.0     every register complete                          every list complete
 *   7.0 - 7.6     the pages turn (the ticks clear)                 the lists clear
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

/* ================================================================== T06 · the receptionist / Ingress */

const L06 = 9
const F06 = 108
const HOLD06 = 5.0 /* the receptionist points the second visitor to the gold lift; the first stands in the blue lift */
const CAM06: V3 = [-0.3, 1.78, 5.15]
const AT06: V3 = [-0.3, 1.3, -1.0]
const FOV06 = 37
const P06 = {
  wall: -1.6, // the back wall's face
  wallT: 0.12,
  rec: -2.05, // the receptionist (the gate)
  recZ: -1.32,
  counter: { x0: -2.45, x1: -1.65, z0: -1.12, z1: -0.8, h: 0.98 },
  stop: -0.98, // where a visitor stops beside the counter
  lane: -0.95,
  door: -0.45, // the entrance (the way in)
  doorW: 0.66,
  doorH: 2.0,
  lifts: [0.3, 1.0, 1.7] as const,
  liftW: 0.56,
  liftH: 1.92,
  inZ: -1.98, // where a visitor stands inside a lift
  ceil: 2.75,
  outZ: -2.6, // where a visitor starts, outside the door
}
/* the floors: gold, teal, blue (lift 0, 1, 2) */
const FLOOR_COL = [C.gold, C.teal, C.blue] as const
const FLOOR_DARK = [C.goldDark, C.tealDark, C.blueDark] as const
/* the visitors, one every 3 s; visitor k goes to lift LIFT_OF[k] */
const LIFT_OF = [2, 0, 1] as const
const V06 = { in: [0.05, 0.9] as const, toDesk: [0.9, 1.3] as const, ask: [1.3, 1.62] as const, check: [1.48, 1.82] as const, point: [1.75, 2.0, 2.3, 2.55] as const, leave: 2.35, speed: 1.5 }
const arrive06 = (k: number) => V06.leave + Math.abs(P06.lifts[LIFT_OF[k]] - P06.stop) / V06.speed
const local06 = (c: number, k: number) => mod(c - 3 * k, L06)
type Walk = { x: number; z: number; walking: number; dir: number; vis: boolean; atDesk: number; inside: number }
/** where visitor (request) k is at loop time c */
function visAt06(c: number, k: number): Walk {
  const u = local06(c, k)
  const tA = arrive06(k)
  const lx = P06.lifts[LIFT_OF[k]]
  const vis = u >= V06.in[0] - 0.02 && u < tA + 1.35
  let x = P06.door
  let z = P06.outZ
  let walking = 0
  let dir = 0
  if (u < V06.in[1]) {
    z = lerp(P06.outZ, P06.lane, seg(u, V06.in[0], V06.in[1]))
    walking = hold(u, V06.in[0], V06.in[0] + 0.1, V06.in[1] - 0.12, V06.in[1])
  } else if (u < V06.toDesk[1]) {
    z = P06.lane
    x = lerp(P06.door, P06.stop, seg(u, V06.toDesk[0], V06.toDesk[1]))
    walking = hold(u, V06.toDesk[0], V06.toDesk[0] + 0.08, V06.toDesk[1] - 0.1, V06.toDesk[1])
    dir = -1
  } else if (u < V06.leave) {
    z = P06.lane
    x = P06.stop
  } else if (u < tA) {
    z = P06.lane
    x = lerp(P06.stop, lx, seg(u, V06.leave, tA))
    walking = hold(u, V06.leave, V06.leave + 0.1, tA - 0.12, tA)
    dir = 1
  } else {
    x = lx
    const k2 = seg(u, tA + 0.05, tA + 0.55)
    z = lerp(P06.lane, P06.inZ, k2)
    walking = hold(u, tA + 0.05, tA + 0.12, tA + 0.45, tA + 0.55)
  }
  return { x, z, walking, dir, vis, atDesk: hold(u, V06.toDesk[1] - 0.1, V06.toDesk[1], V06.leave - 0.1, V06.leave + 0.1), inside: seg(u, tA + 0.05, tA + 0.55) }
}
/** how far lift i's doors are open at c (they open as its visitor arrives, close behind them) */
function liftOpen06(c: number, i: number) {
  const k = LIFT_OF.indexOf(i as 0 | 1 | 2)
  const u = local06(c, k)
  const tA = arrive06(k)
  return hold(u, tA - 0.32, tA, tA + 0.95, tA + 1.3)
}
/** lift i's lamp: lit from the moment the receptionist points to it until its doors have closed */
function liftCall06(c: number, i: number) {
  const k = LIFT_OF.indexOf(i as 0 | 1 | 2)
  const u = local06(c, k)
  const tA = arrive06(k)
  return hold(u, V06.point[0], V06.point[1], tA + 1.05, tA + 1.35)
}
/** the entrance doors: open while a visitor comes in */
const doorOpen06 = (c: number) => Math.max(...[0, 1, 2].map((k) => hold(local06(c, k), 0.0, 0.3, 0.75, 1.05)))
/** which visitor is at the counter (or about to be), and how far through the visit */
function deskVisitor06(c: number) {
  for (const k of [0, 1, 2]) {
    const u = local06(c, k)
    if (u >= 0.6 && u < 2.9) return { k, u }
  }
  return null
}
/* the receptionist's arm for each lift: raised up toward the floors, the farther the lift, the flatter the arm (kept above the visitor's head) */
const POINT_ARM: Arm[] = [
  { s: 150, e: 10 },
  { s: 140, e: 8 },
  { s: 130, e: 6 },
]
/* the gate's pointer for each service: the same directions */
const POINT_ANG = POINT_ARM.map((a) => (a.s - 90) * DEG)

/** the back wall with its openings (the entrance and three lifts) */
function lobbyShell(scene: THREE.Scene, o: { wall: string; floor: THREE.Texture; trim: string; outside: string; ground: string; ceiling: string; glow?: number }) {
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.28 })
  scene.add(floorPlane(9, 7, mat('#ffffff', { map: o.floor, roughness: 0.75 }), [0, 0, 1.6]))
  const Z = P06.wall - P06.wallT / 2
  const holes: [number, number, number][] = [[P06.door - P06.doorW / 2, P06.door + P06.doorW / 2, P06.doorH], ...P06.lifts.map((x) => [x - P06.liftW / 2, x + P06.liftW / 2, P06.liftH] as [number, number, number])]
  const TOP = P06.ceil
  let x = -4.5
  for (const [a, b, h] of holes) {
    scene.add(flat(box(a - x, TOP, P06.wallT, wallM, [(x + a) / 2, TOP / 2, Z])))
    scene.add(flat(box(b - a, TOP - h, P06.wallT, wallM, [(a + b) / 2, (h + TOP) / 2, Z])))
    x = b
  }
  scene.add(flat(box(4.5 - x, TOP, P06.wallT, wallM, [(x + 4.5) / 2, TOP / 2, Z])))
  scene.add(flat(box(9, 0.1, 0.03, mat(o.trim, { roughness: 0.6 }), [0, 0.05, P06.wall + 0.015])))
  /* the ceiling with its light strips */
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), mat(o.ceiling, { roughness: 0.9, emissive: new THREE.Color(o.ceiling), emissiveIntensity: 0.35 }))
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(0, P06.ceil, 1.9)
  scene.add(ceil)
  for (const z of [-0.9, 0.5, 1.9]) for (const x of [-1.8, 0, 1.8]) scene.add(flat(box(1.1, 0.02, 0.16, new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }), [x, P06.ceil - 0.012, z])))
  /* the outside, seen through the entrance */
  const outM = new THREE.MeshBasicMaterial({ color: o.outside, toneMapped: false })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), outM)
  sky.position.set(P06.door, 1.5, P06.wall - 2.6)
  scene.add(sky)
  scene.add(floorPlane(4, 2.6, mat(o.ground, { roughness: 0.9 }), [P06.door, 0.002, P06.wall - 1.3]))
  return { wallM }
}
/** a lift opening: the car behind it, two sliding doors, a steel frame, the floor lamp above */
function makeLift(scene: THREE.Scene, x: number, i: number, o: { car: string; door: string; frame: string }) {
  const w = P06.liftW
  const hgt = P06.liftH
  const back = P06.wall - P06.wallT
  /* the car: floor, back, sides, a ceiling light */
  const carM = mat(o.car, { roughness: 0.6, emissive: new THREE.Color(o.car), emissiveIntensity: 0.35 })
  const depth = 0.75
  scene.add(flat(box(w + 0.1, 0.02, depth, carM, [x, 0.01, back - depth / 2])))
  scene.add(flat(box(w + 0.1, hgt + 0.1, 0.04, carM, [x, hgt / 2, back - depth])))
  scene.add(flat(box(0.04, hgt + 0.1, depth, carM, [x - w / 2 - 0.05, hgt / 2, back - depth / 2])))
  scene.add(flat(box(0.04, hgt + 0.1, depth, carM, [x + w / 2 + 0.05, hgt / 2, back - depth / 2])))
  scene.add(flat(box(w + 0.1, 0.04, depth, carM, [x, hgt + 0.05, back - depth / 2])))
  /* the doors: two panels inside the wall's thickness, sliding behind the wall to open */
  const doorM = mat(o.door, { roughness: 0.3, metalness: 0.55 })
  const left = box(w / 2, hgt, 0.03, doorM, [x - w / 4, hgt / 2, P06.wall - 0.06], 0.01)
  const right = box(w / 2, hgt, 0.03, doorM, [x + w / 4, hgt / 2, P06.wall - 0.06], 0.01)
  scene.add(flat(left), flat(right))
  /* the frame */
  const frM = mat(o.frame, { roughness: 0.35, metalness: 0.5 })
  scene.add(box(0.05, hgt + 0.05, 0.05, frM, [x - w / 2 - 0.025, hgt / 2, P06.wall + 0.02]), box(0.05, hgt + 0.05, 0.05, frM, [x + w / 2 + 0.025, hgt / 2, P06.wall + 0.02]), box(w + 0.1, 0.05, 0.05, frM, [x, hgt + 0.025, P06.wall + 0.02]))
  return {
    set: (open: number) => {
      left.position.x = x - w / 4 - (w / 2) * open
      right.position.x = x + w / 4 + (w / 2) * open
    },
    floor: FLOOR_COL[i],
  }
}
/** the visitor list / the rule list: a row per floor (service), the row being read lights */
function drawList(g: CanvasRenderingContext2D, w: number, h: number, lit: number, kind: 'people' | 'rules') {
  rr(g, 0, 0, w, h, 8, '#13204A')
  const rowH = (h - 16) / 3
  for (let i = 0; i < 3; i++) {
    const y = 8 + i * rowH
    const on = lit === i
    rr(g, 8, y + 3, w - 16, rowH - 6, 6, on ? '#FFFFFF' : '#22356E')
    const cy = y + rowH / 2
    if (kind === 'people') {
      g.fillStyle = on ? FLOOR_DARK[i] : '#7E93C9'
      g.beginPath()
      g.arc(26, cy - 4, 6.5, 0, TAU)
      g.fill()
      g.beginPath()
      g.ellipse(26, cy + 9, 10, 6.5, 0, Math.PI, 0)
      g.fill()
    } else {
      /* a path: a page with a fold */
      g.fillStyle = on ? FLOOR_DARK[i] : '#7E93C9'
      g.beginPath()
      g.moveTo(18, cy - 11)
      g.lineTo(30, cy - 11)
      g.lineTo(36, cy - 5)
      g.lineTo(36, cy + 11)
      g.lineTo(18, cy + 11)
      g.closePath()
      g.fill()
    }
    rr(g, 46, cy - 4, w - 46 - 46, 8, 4, on ? '#C9D3E6' : '#3A4E8C')
    rr(g, w - 36, cy - 9, 18, 18, 5, FLOOR_COL[i])
  }
}

/* ------------------------------------------------------------------ T06 everyday: the office lobby */

const VIS_FACES: [number, string][] = [
  [0, 'neutral'],
  [1.2, 'happy'],
  [1.55, 'listening'],
  [2.15, 'happy'],
  [5.6, 'neutral'],
]
function setupT06Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F2EEE8')
  setCam(camera, CAM06, AT06, FOV06)
  lights(scene, [0, 1.0, -0.8])
  lobbyShell(scene, { wall: '#EDE6DA', floor: tileTex('#EFE8DC', '#DCD1BF', 2, [9, 7]), trim: '#B9A386', outside: '#CFE6F7', ground: '#C9D2DE', ceiling: '#F4F1EC' })

  /* the lifts */
  const lifts = P06.lifts.map((x, i) => makeLift(scene, x, i, { car: '#F4ECDF', door: '#C9D1DE', frame: '#8E98AA' }))
  /* above each: the floor lamp (the floor's colour) with an up arrow */
  const lamps = P06.lifts.map((x, i) => {
    scene.add(box(0.36, 0.2, 0.04, mat('#2A3348', { roughness: 0.4 }), [x, P06.liftH + 0.22, P06.wall + 0.02], 0.02))
    const m = glowM(FLOOR_COL[i], FLOOR_COL[i])
    m.emissiveIntensity = 0.25
    scene.add(flat(box(0.13, 0.11, 0.02, m, [x - 0.07, P06.liftH + 0.22, P06.wall + 0.045], 0.02)))
    const arrow = picture(canvasTex(32, 32, (g) => {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.moveTo(16, 5)
      g.lineTo(27, 19)
      g.lineTo(20, 19)
      g.lineTo(20, 28)
      g.lineTo(12, 28)
      g.lineTo(12, 19)
      g.lineTo(5, 19)
      g.closePath()
      g.fill()
    }), 0.1, 0.1, [x + 0.09, P06.liftH + 0.22, P06.wall + 0.045])
    scene.add(arrow)
    /* the call button beside the door */
    scene.add(box(0.06, 0.1, 0.02, mat('#8E98AA', { metalness: 0.5, roughness: 0.3 }), [x + P06.liftW / 2 + 0.12, 1.1, P06.wall + 0.01], 0.01))
    const btn = glowM(FLOOR_COL[i], '#E8ECF3')
    scene.add(flat(sphere(0.018, btn, [x + P06.liftW / 2 + 0.12, 1.1, P06.wall + 0.025])))
    return { m, btn }
  })

  /* the entrance: a steel frame and two glass panels that slide into the wall */
  const dw = P06.doorW
  const frM = mat('#5C6678', { roughness: 0.35, metalness: 0.5 })
  scene.add(box(0.05, P06.doorH, 0.06, frM, [P06.door - dw / 2 - 0.025, P06.doorH / 2, P06.wall + 0.02]), box(0.05, P06.doorH, 0.06, frM, [P06.door + dw / 2 + 0.025, P06.doorH / 2, P06.wall + 0.02]), box(dw + 0.1, 0.06, 0.06, frM, [P06.door, P06.doorH + 0.03, P06.wall + 0.02]))
  const glassM = new THREE.MeshStandardMaterial({ color: '#D6E8F7', transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.1, depthWrite: false })
  const glassL = new THREE.Group()
  const glassR = new THREE.Group()
  for (const gp of [glassL, glassR]) {
    gp.add(new THREE.Mesh(new THREE.PlaneGeometry(dw / 2 - 0.02, P06.doorH - 0.04), glassM))
    gp.add(box(dw / 2, 0.04, 0.03, frM, [0, P06.doorH / 2 - 0.02, 0]), box(dw / 2, 0.04, 0.03, frM, [0, -P06.doorH / 2 + 0.02, 0]))
    gp.position.set(0, P06.doorH / 2, P06.wall - 0.06)
    scene.add(gp)
  }
  /* a shrub outside, the street side */
  const shrub = new THREE.Group()
  const leaf = mat('#5DAE6B', { roughness: 0.7 })
  shrub.add(sphere(0.28, leaf, [0, 0.3, 0]), sphere(0.2, leaf, [0.2, 0.22, 0.05]), sphere(0.2, leaf, [-0.2, 0.24, -0.04]))
  shrub.position.set(P06.door + 0.55, 0, P06.wall - 1.9)
  scene.add(shrub)

  /* the counter and the receptionist's screen */
  const K = P06.counter
  const wood = mat('#8C5E3C', { roughness: 0.55 })
  scene.add(box(K.x1 - K.x0, K.h - 0.05, K.z1 - K.z0, wood, [(K.x0 + K.x1) / 2, (K.h - 0.05) / 2, (K.z0 + K.z1) / 2], 0.03))
  scene.add(box(K.x1 - K.x0 + 0.08, 0.05, K.z1 - K.z0 + 0.1, mat('#F4EDE2', { roughness: 0.35 }), [(K.x0 + K.x1) / 2, K.h - 0.025, (K.z0 + K.z1) / 2], 0.015))
  scene.add(flat(box(K.x1 - K.x0 - 0.12, 0.06, 0.01, mat('#C9A27A', { roughness: 0.5 }), [(K.x0 + K.x1) / 2, K.h - 0.2, K.z1 + 0.006])))
  const list = liveTex(120, 84, (g, n) => drawList(g, 120, 84, n - 1, 'people'))
  const mon = new THREE.Group()
  mon.add(box(0.07, 0.03, 0.07, mat('#3E4656'), [0, 0.015, 0]), box(0.025, 0.12, 0.025, mat('#3E4656'), [0, 0.09, 0]))
  mon.add(box(0.38, 0.27, 0.025, mat('#1F2E63', { roughness: 0.3 }), [0, 0.27, 0], 0.012))
  const scr = picture(list.tex, 0.35, 0.245, [0, 0.27, 0.014], { transparent: false })
  mon.add(scr)
  mon.position.set(K.x0 + 0.22, K.h, (K.z0 + K.z1) / 2 - 0.02)
  mon.rotation.y = 0.55
  scene.add(mon)
  /* the company emblem on the wall behind her (a shape, no name) */
  scene.add(picture(canvasTex(80, 80, (g) => {
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.arc(40, 40, 30, 0, TAU)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.moveTo(40, 18)
    g.lineTo(58, 52)
    g.lineTo(22, 52)
    g.closePath()
    g.fill()
  }), 0.42, 0.42, [P06.rec, 2.28, P06.wall + 0.012]))

  /* people */
  const Rb = body(who(CAST_PRESETS.riya, { name: 'Receptionist', skinTone: 'wheatish', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#F4F6FA', bottom: 'skirt', bottomColor: '#1F2E63', shoeColor: '#1F2E63' }, accessories: { earrings: true } }), [P06.rec, 0, P06.recZ], 1.6)
  const Vb = [
    body(who(CAST_PRESETS.ananya, { name: 'Visitor', skinTone: 'medium', hair: { style: 'long', color: 'black' }, outfit: { top: 'blouse', topColor: '#3B6FF0', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30' }, accessories: { earrings: true, watch: true } }), [P06.door, 0, P06.outZ], 1.6),
    body(who(CAST_PRESETS.rohan, { name: 'Visitor', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: '#F2B33D', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#5A3A2A' }, accessories: { beard: 'stubble', watch: true } }), [P06.door, 0, P06.outZ], 1.7),
    body(who(CAST_PRESETS.dev, { name: 'Visitor', skinTone: 'fair', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'polo', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#1F2A4A', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: false } }), [P06.door, 0, P06.outZ], 1.68),
  ]
  const recDress = both(withNeck(BLAZER('#1F2E63', '#121A3A')), withNeck(DESK_SCARF('#F2C14E', C.brand)))
  const visDress = [withTop(BAG('#5A3E2A', '#8C6440')), undefined, withTop(BAG('#2C3545', '#46516B'))]

  const recPose = (p: Pose, c: number) => {
    const d = deskVisitor06(c)
    let arm: Arm = REST
    if (d) {
      const u = d.u
      const pk = hold(u, ...V06.point)
      arm = mixArm(REST, POINT_ARM[LIFT_OF[d.k]], pk)
      pointHand(p, pk, 'R')
      /* she looks at the visitor as they come up, down at her screen (to her left), along her arm, back with a smile */
      const toV = Math.max(hold(u, 0.85, 1.1, 1.42, 1.52), hold(u, 2.3, 2.45, 2.65, 2.85))
      to(p, 'headTurn', 0.45, toV)
      to(p, 'lookX', 0.9, toV)
      const scr0 = hold(u, V06.check[0], V06.check[0] + 0.1, V06.check[1] - 0.05, V06.check[1] + 0.05)
      to(p, 'headTurn', -0.35, scr0)
      to(p, 'lookX', -0.8, scr0)
      to(p, 'headNod', 0.3, scr0)
      to(p, 'lookY', 0.8, scr0)
      const along = hold(u, V06.point[0], V06.point[1], V06.point[2] - 0.05, V06.point[2] + 0.05)
      to(p, 'headTurn', 0.6, along)
      to(p, 'lookX', 1, along)
      to(p, 'headNod', -0.1, along)
      to(p, 'lookY', -0.4, along)
      talk(p, c, Math.max(hold(u, 1.75, 1.85, 2.2, 2.3), hold(u, 0.95, 1.02, 1.18, 1.25)))
    }
    setArms(p, { s: 6, e: 10 }, arm)
  }
  const visPose = (k: number) => (p: Pose, c: number) => {
    const w = visAt06(c, k)
    const u = local06(c, k)
    setArms(p, { s: 5 + swing(c, w.walking), e: 8 }, { s: 5 - swing(c, w.walking), e: 8 })
    walkLegs(p, c, w.walking, w.dir)
    /* at the counter: turned to the receptionist, says the name, then looks where she points and nods */
    to(p, 'headTurn', -0.38, w.atDesk)
    to(p, 'lookX', -0.85, w.atDesk)
    to(p, 'headNod', -0.08, w.atDesk)
    talk(p, c, hold(u, V06.ask[0], V06.ask[0] + 0.06, V06.ask[1] - 0.06, V06.ask[1]))
    const look = hold(u, V06.point[0] + 0.1, V06.point[1] + 0.05, V06.leave - 0.05, V06.leave + 0.1)
    to(p, 'headTurn', 0.45, look)
    to(p, 'lookX', 0.9, look)
    to(p, 'headNod', 0.14, hold(u, 2.12, 2.2, 2.26, 2.34))
  }
  const HB = devHold(HOLD06)
  const rec = person({ config: Rb.cfg, dress: recDress, seed: 601, faces: [[0, 'happy'], [1.45, 'listening'], [1.7, 'happy'], [4.45, 'listening'], [4.7, 'happy'], [7.45, 'listening'], [7.7, 'happy']], pose: recPose, loop: L06, height: Rb.h, frames: F06, redraw, holdT: HB })
  rec.object.position.copy(Rb.root)
  scene.add(rec.object)
  const vis = Vb.map((b, k) => {
    const s = person({ config: b.cfg, dress: visDress[k], seed: 611 + k, faces: shiftKeys(VIS_FACES, 3 * k, L06), pose: visPose(k), loop: L06, height: b.h, frames: F06, redraw, holdT: HB })
    scene.add(s.object)
    return s
  })
  const clk = slideClock('T06', scene, HB, [rec, ...vis])

  return (t: number) => {
    const c = mod(clk.time(t), L06)
    rec.update(c, camera)
    vis.forEach((s, k) => {
      const w = visAt06(c, k)
      Vb[k].root.set(w.x, bob(w.walking, c), w.z)
      s.object.position.copy(Vb[k].root)
      s.object.visible = w.vis
      s.update(c, camera)
    })
    lifts.forEach((l, i) => l.set(liftOpen06(c, i)))
    lamps.forEach((l, i) => {
      const on = liftCall06(c, i)
      l.m.emissiveIntensity = 0.25 + 1.6 * on
      l.btn.emissiveIntensity = 1.4 * on
    })
    const dOpen = doorOpen06(c)
    glassL.position.x = P06.door - dw / 4 - (dw / 2) * dOpen
    glassR.position.x = P06.door + dw / 4 + (dw / 2) * dOpen
    /* her screen: the visitor's row lights while she checks it */
    const d = deskVisitor06(c)
    list.paint(d && d.u >= V06.check[0] && d.u < V06.leave + 0.2 ? LIFT_OF[d.k] + 1 : 0)
  }
}

/* ------------------------------------------------------------------ T06 concept: requests, the Ingress gate, three Services */

/** a request: a rounded token in its service's colour, a page glyph on its face */
function makeRequest06(i: number) {
  const g = new THREE.Group()
  g.add(box(0.26, 0.26, 0.12, mat(FLOOR_COL[i], { roughness: 0.3, emissive: new THREE.Color(FLOOR_COL[i]), emissiveIntensity: 0.12 }), [0, 0, 0], 0.035))
  const face = picture(canvasTex(64, 64, (q) => {
    q.fillStyle = '#FFFFFF'
    q.beginPath()
    q.moveTo(20, 12)
    q.lineTo(38, 12)
    q.lineTo(46, 20)
    q.lineTo(46, 52)
    q.lineTo(20, 52)
    q.closePath()
    q.fill()
    q.fillStyle = FLOOR_DARK[i]
    q.fillRect(25, 28, 16, 3.5)
    q.fillRect(25, 36, 12, 3.5)
  }), 0.2, 0.2, [0, 0, 0.062])
  g.add(face)
  return g
}
function setupT06Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM06, AT06, FOV06)
  lights(scene, [0, 1.0, -0.8])
  lobbyShell(scene, { wall: '#EEF2FA', floor: tileTex('#E3EAF8', '#C9D5EC', 2, [9, 7]), trim: '#1F2E63', outside: '#D7E6FB', ground: '#C3CFE6', ceiling: '#F3F6FC', glow: 0.5 })

  /* the three Services in the lifts' places: a cabinet behind sliding doors, the Service mark above, a lamp */
  const svc = P06.lifts.map((x, i) => makeLift(scene, x, i, { car: '#DCE5F6', door: '#B7C3D6', frame: '#1F2E63' }))
  const svcTex = markTex(svcUrl, redraw)
  const lamps = P06.lifts.map((x, i) => {
    scene.add(picture(svcTex, 0.3, 0.3, [x - 0.05, P06.liftH + 0.24, P06.wall + 0.02], { transparent: false }))
    const m = glowM(FLOOR_COL[i], FLOOR_COL[i])
    m.emissiveIntensity = 0.25
    scene.add(flat(box(0.07, 0.3, 0.03, m, [x + 0.16, P06.liftH + 0.24, P06.wall + 0.03], 0.015)))
    /* a server rack inside each Service (what a request reaches) */
    const rack = new THREE.Group()
    rack.add(box(0.36, 0.9, 0.3, mat('#1F2E63', { roughness: 0.3, metalness: 0.2 }), [0, 0.45, 0], 0.03))
    for (let r = 0; r < 4; r++) rack.add(flat(box(0.28, 0.035, 0.01, mat(FLOOR_COL[i], { emissive: new THREE.Color(FLOOR_COL[i]), emissiveIntensity: 0.6 }), [0, 0.2 + r * 0.17, 0.152])))
    rack.position.set(x, 0, P06.inZ - 0.15)
    scene.add(rack)
    return { m }
  })

  /* the way in from the Internet: the entrance's opening, glowing, the Internet mark above it */
  const dw = P06.doorW
  const frM = mat('#1F2E63', { roughness: 0.35, metalness: 0.4 })
  scene.add(box(0.05, P06.doorH, 0.06, frM, [P06.door - dw / 2 - 0.025, P06.doorH / 2, P06.wall + 0.02]), box(0.05, P06.doorH, 0.06, frM, [P06.door + dw / 2 + 0.025, P06.doorH / 2, P06.wall + 0.02]), box(dw + 0.1, 0.06, 0.06, frM, [P06.door, P06.doorH + 0.03, P06.wall + 0.02]))
  scene.add(picture(markTex(netUrl, redraw), 0.32, 0.32, [P06.door, P06.doorH + 0.3, P06.wall + 0.02], { transparent: false }))
  const portal = halo('rgba(91,141,239,0.85)', 1.3)
  portal.position.set(P06.door, 1.0, P06.wall - 1.2)
  scene.add(portal)

  /* the Ingress gate in the receptionist's place: a pedestal with the Ingress mark, the rule list, the pointer */
  const K = P06.counter
  scene.add(box(K.x1 - K.x0, K.h - 0.05, K.z1 - K.z0, mat('#FFFFFF', { roughness: 0.35 }), [(K.x0 + K.x1) / 2, (K.h - 0.05) / 2, (K.z0 + K.z1) / 2], 0.03))
  scene.add(box(K.x1 - K.x0 + 0.08, 0.05, K.z1 - K.z0 + 0.1, mat('#1F2E63', { roughness: 0.35 }), [(K.x0 + K.x1) / 2, K.h - 0.025, (K.z0 + K.z1) / 2], 0.015))
  scene.add(picture(markTex(ingUrl, redraw), 0.4, 0.4, [(K.x0 + K.x1) / 2 + 0.08, 0.5, K.z1 + 0.006], { transparent: false }))
  const list = liveTex(120, 84, (g, n) => drawList(g, 120, 84, n - 1, 'rules'))
  const mon = new THREE.Group()
  mon.add(box(0.07, 0.03, 0.07, mat('#3E4656'), [0, 0.015, 0]), box(0.025, 0.12, 0.025, mat('#3E4656'), [0, 0.09, 0]))
  mon.add(box(0.38, 0.27, 0.025, mat('#1F2E63', { roughness: 0.3 }), [0, 0.27, 0], 0.012))
  mon.add(picture(list.tex, 0.35, 0.245, [0, 0.27, 0.014], { transparent: false }))
  mon.position.set(K.x0 + 0.22, K.h, (K.z0 + K.z1) / 2 - 0.02)
  mon.rotation.y = 0.55
  scene.add(mon)
  /* the mast and pointer, where her arm is: it turns to the service the rule picks */
  const pivotY = 1.18
  scene.add(cyl(0.035, 0.045, pivotY - K.h, mat('#8E98AA', { metalness: 0.5, roughness: 0.35 }), [P06.rec + 0.12, K.h + (pivotY - K.h) / 2, P06.recZ + 0.2], 14))
  const hub = sphere(0.06, mat('#1F2E63', { roughness: 0.3 }), [P06.rec + 0.12, pivotY, P06.recZ + 0.2])
  scene.add(hub)
  const pointer = new THREE.Group()
  const ptrM = glowM(C.brand, C.brand, { roughness: 0.3 })
  const shaft = cyl(0.034, 0.034, 0.5, ptrM, [0.25, 0, 0], 14)
  shaft.rotation.z = Math.PI / 2
  const tip = cyl(0.0, 0.085, 0.17, ptrM, [0.58, 0, 0], 18)
  tip.rotation.z = -Math.PI / 2
  pointer.add(shaft, tip)
  flat(pointer)
  pointer.position.set(P06.rec + 0.12, pivotY, P06.recZ + 0.26)
  scene.add(pointer)
  const REST_ANG = -1.15

  /* the requests */
  const reqs = [0, 1, 2].map((k) => {
    const g = flat(makeRequest06(LIFT_OF[k]))
    scene.add(g)
    return g
  })
  const clk = slideClock('T06', scene, devHold(HOLD06), [{ ready: Promise.resolve() }])
  const QY = 1.02
  const tmpC = new THREE.Color()

  return (t: number) => {
    const c = mod(clk.time(t), L06)
    reqs.forEach((g, k) => {
      const w = visAt06(c, k)
      g.position.set(w.x, QY + 0.025 * Math.sin(c * TAU * (2 / L06) + k * 2.1), w.z)
      g.visible = w.vis
      g.rotation.y = 0.18 * w.dir
    })
    svc.forEach((l, i) => l.set(liftOpen06(c, i)))
    lamps.forEach((l, i) => (l.m.emissiveIntensity = 0.25 + 1.6 * liftCall06(c, i)))
    portal.quaternion.copy(camera.quaternion)
    setOp(portal, 0.35 + 0.45 * doorOpen06(c))
    /* the gate: reads the request (its rule row lights), turns its pointer to the service, back to rest */
    const d = deskVisitor06(c)
    let ang = REST_ANG
    let lit = 0
    if (d) {
      const pk = hold(d.u, ...V06.point)
      ang = lerp(REST_ANG, POINT_ANG[LIFT_OF[d.k]], pk)
      lit = pk
      ptrM.emissive.set(FLOOR_COL[LIFT_OF[d.k]])
      ptrM.color.set(C.brand).lerp(tmpC.set(FLOOR_COL[LIFT_OF[d.k]]), pk)
    } else ptrM.color.set(C.brand)
    pointer.rotation.z = ang
    ptrM.emissiveIntensity = 0.35 * lit
    list.paint(d && d.u >= V06.check[0] && d.u < V06.leave + 0.2 ? LIFT_OF[d.k] + 1 : 0)
  }
}

/* ================================================================== T01 · one question paper, a slip per centre / ConfigMap */

const L01 = 9
const F01 = 108
const HOLD01 = 4.8 /* both copies on their stands, each with its own slip; the stack in the middle unchanged */
const CAM01: V3 = [0, 1.85, 4.85]
const AT01: V3 = [0, 1.12, -0.8]
const FOV01 = 37
const P01 = {
  wall: -1.4,
  ceil: 2.75,
  centre: [-1.38, 1.38] as const, // centre A, centre B (environment A, B)
  personZ: -0.92,
  desk: { w: 1.18, d: 0.4, z: -0.42, h: 0.76 },
  stand: 0.42, // the paper stand / the image cradle, toward the middle from the centre (beside the person)
  pad: 0.0, // the slip pad, at the desk's front edge before the person
  packet: 0.38, // the exam packet / the node, toward the outside
  partition: 0.7,
  stack: new THREE.Vector3(0, 1.12, -0.72),
}
const ROOM_COL = [C.blue, C.teal] as const
const ROOM_DARK = [C.blueDark, C.tealDark] as const
/* side s (0 = A, left; 1 = B, right): +1 points toward the middle */
const inward = (s: number) => (s === 0 ? 1 : -1)
const T01 = {
  fly: [[0.4, 1.3], [0.9, 1.8]] as const,
  /* paste: to the pad, carry, press (B half a second after A) */
  paste: (s: number) => {
    const o = s * 0.5
    return { pad: [1.45 + o, 1.85 + o] as const, carry: [1.95 + o, 2.4 + o] as const, on: 2.4 + o, press: [2.4 + o, 2.95 + o] as const }
  },
  pack: [[6.45, 7.2], [6.8, 7.55]] as const,
}
/** a copy of the question paper: one header band, a crest, ruled rows (never words) */
const paperTex = () =>
  canvasTex(150, 200, (g) => {
    rr(g, 0, 0, 150, 200, 6, '#FFFFFF')
    rr(g, 0, 0, 150, 38, 6, '#2D63FB')
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(22, 19, 12, 0, TAU)
    g.fill()
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.moveTo(13, 18)
    g.lineTo(22, 13)
    g.lineTo(31, 18)
    g.lineTo(22, 22)
    g.closePath()
    g.fill()
    rr(g, 42, 12, 56, 6, 3, '#C9D8FF')
    rr(g, 42, 23, 38, 5, 2.5, '#C9D8FF')
    for (let i = 0; i < 6; i++) {
      rr(g, 12, 52 + i * 22, 10, 10, 2, '#9AA8C2')
      rr(g, 30, 54 + i * 22, i % 3 === 2 ? 70 : 104, 6, 3, '#D5DCE8')
    }
  })
/** a centre's slip: its room's colour and a door (no number, no words) */
const slipTex = (s: number) =>
  canvasTex(110, 44, (g) => {
    rr(g, 0, 0, 110, 44, 6, ROOM_COL[s])
    rr(g, 14, 7, 22, 31, 3, '#FFFFFF')
    g.fillStyle = ROOM_COL[s]
    g.beginPath()
    g.arc(31, 23, 2.4, 0, TAU)
    g.fill()
    rr(g, 46, 13, 50, 7, 3.5, 'rgba(255,255,255,0.85)')
    rr(g, 46, 25, 34, 7, 3.5, 'rgba(255,255,255,0.6)')
  })
/** the room / environment plate over the door: the same colour, the same door */
const plateDoorTex = (s: number) =>
  canvasTex(96, 64, (g) => {
    rr(g, 0, 0, 96, 64, 10, ROOM_COL[s])
    rr(g, 36, 10, 24, 44, 3, '#FFFFFF')
    g.fillStyle = ROOM_COL[s]
    g.beginPath()
    g.arc(55, 33, 2.8, 0, TAU)
    g.fill()
  })
/** a settings card (ConfigMap): its mark, a key row, a database glyph in the environment's colour */
function settingsCardTex(s: number, redraw: () => void) {
  const c = document.createElement('canvas')
  const SS = 3
  c.width = 120 * SS
  c.height = 72 * SS
  const g = c.getContext('2d')!
  g.scale(SS, SS)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const paint = (img?: HTMLImageElement) => {
    g.clearRect(0, 0, 120, 72)
    rr(g, 0, 0, 120, 72, 9, '#FFFFFF')
    rr(g, 0, 0, 120, 12, 6, ROOM_COL[s])
    if (img) g.drawImage(img, 8, 20, 40, 40)
    /* a database glyph in the environment's colour */
    g.fillStyle = ROOM_COL[s]
    g.beginPath()
    g.ellipse(84, 27, 16, 6, 0, 0, TAU)
    g.fill()
    g.fillRect(68, 27, 32, 24)
    g.beginPath()
    g.ellipse(84, 51, 16, 6, 0, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 2
    g.beginPath()
    g.ellipse(84, 27, 16, 6, 0, 0, Math.PI)
    g.moveTo(100, 39)
    g.ellipse(84, 39, 16, 6, 0, 0, Math.PI)
    g.stroke()
    t.needsUpdate = true
  }
  paint()
  const img = new Image()
  img.onload = () => {
    paint(img)
    redraw()
  }
  img.src = cmUrl
  return t
}

/** the shared room: back wall with two doors, the ceiling, the floor, the two partitions */
function hall01(scene: THREE.Scene, o: { wall: string; floor: THREE.Texture; trim: string; ceiling: string; glass: string; frame: string; door: string; glow?: number }) {
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.28 })
  scene.add(floorPlane(9, 7, mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0, 1.8]))
  scene.add(flat(box(9, P01.ceil, 0.1, wallM, [0, P01.ceil / 2, P01.wall - 0.05])))
  scene.add(flat(box(9, 0.1, 0.03, mat(o.trim, { roughness: 0.6 }), [0, 0.05, P01.wall + 0.015])))
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), mat(o.ceiling, { roughness: 0.9, emissive: new THREE.Color(o.ceiling), emissiveIntensity: 0.35 }))
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(0, P01.ceil, 2.1)
  scene.add(ceil)
  for (const z of [-0.7, 0.7]) for (const x of [-1.6, 0, 1.6]) scene.add(flat(box(1.0, 0.02, 0.16, new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }), [x, P01.ceil - 0.012, z])))
  /* the partitions: frosted glass in a frame, wall to the front */
  const glassM = new THREE.MeshStandardMaterial({ color: o.glass, transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false })
  const frM = mat(o.frame, { roughness: 0.45, metalness: 0.2 })
  for (const sx of [-1, 1]) {
    const x = sx * P01.partition
    const z0 = P01.wall
    const z1 = -0.78
    const PH = 1.55
    const g = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, PH - 0.1), glassM)
    g.rotation.y = Math.PI / 2
    g.position.set(x, PH / 2, (z0 + z1) / 2)
    scene.add(g)
    scene.add(flat(box(0.04, 0.04, z1 - z0, frM, [x, PH, (z0 + z1) / 2])), flat(box(0.04, 0.04, z1 - z0, frM, [x, 0.04, (z0 + z1) / 2])), box(0.045, PH, 0.045, frM, [x, PH / 2, z1]))
  }
  /* the two doors with their colour plates */
  const doorM = mat(o.door, { roughness: 0.55 })
  P01.centre.forEach((cx, s) => {
    scene.add(flat(box(0.66, 1.9, 0.04, doorM, [cx, 0.95, P01.wall + 0.02], 0.01)))
    scene.add(flat(box(0.74, 0.05, 0.05, frM, [cx, 1.925, P01.wall + 0.03])), flat(box(0.05, 1.9, 0.05, frM, [cx - 0.355, 0.95, P01.wall + 0.03])), flat(box(0.05, 1.9, 0.05, frM, [cx + 0.355, 0.95, P01.wall + 0.03])))
    scene.add(flat(sphere(0.025, mat('#C9D1DE', { metalness: 0.6, roughness: 0.3 }), [cx + inward(s) * 0.24, 0.95, P01.wall + 0.06])))
  })
  return { wallM }
}
/** the desk of a centre / the platform of an environment */
function desk01(scene: THREE.Scene, cx: number, top: string, leg: string) {
  const D = P01.desk
  scene.add(box(D.w, 0.04, D.d, mat(top, { roughness: 0.45 }), [cx, D.h - 0.02, D.z], 0.01))
  scene.add(box(D.w - 0.06, D.h - 0.04, 0.03, mat(leg, { roughness: 0.6 }), [cx, (D.h - 0.04) / 2, D.z + D.d / 2 - 0.03]))
  for (const lx of [cx - D.w / 2 + 0.04, cx + D.w / 2 - 0.04]) scene.add(box(0.04, D.h - 0.04, D.d - 0.04, mat(leg, { roughness: 0.6 }), [lx, (D.h - 0.04) / 2, D.z]))
}
/** where a copy sits on its stand at side s, and its tilt (leaning back, toward the camera) */
const standAt = (s: number) => new THREE.Vector3(P01.centre[s] + inward(s) * P01.stand, P01.desk.h + 0.24, P01.desk.z - 0.02)
const TILT = -0.42
/** a copy's place over the loop: the stack, the flight, the stand, the drop into the packet */
function copyAt01(c: number, s: number, out: THREE.Vector3): { vis: boolean; k: number } {
  const [f0, f1] = T01.fly[s]
  const [p0, p1] = T01.pack[s]
  const st = standAt(s)
  if (c < f0 || c >= p1) {
    out.copy(P01.stack)
    return { vis: false, k: 0 }
  }
  if (c < f1) {
    const k = seg(c, f0, f1)
    out.lerpVectors(P01.stack, st, k)
    out.y += Math.sin(k * Math.PI) * 0.75
    return { vis: true, k }
  }
  if (c < p0) {
    out.copy(st)
    return { vis: true, k: 1 }
  }
  /* into the packet: over, then down behind its front */
  const pk = new THREE.Vector3(P01.centre[s] - inward(s) * P01.packet, P01.desk.h + 0.5, P01.desk.z - 0.04)
  const k = seg(c, p0, p0 + (p1 - p0) * 0.55)
  out.lerpVectors(st, pk, k)
  out.y += Math.sin(k * Math.PI) * 0.25
  const d = seg(c, p0 + (p1 - p0) * 0.55, p1)
  out.y -= d * 0.42
  return { vis: true, k: 1 }
}

/* ------------------------------------------------------------------ T01 everyday: the exam centres */

function setupT01Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F2EEE8')
  setCam(camera, CAM01, AT01, FOV01)
  lights(scene, [0, 1.0, -0.6])
  hall01(scene, { wall: '#EFE7DA', floor: plankTex('#E2CDAE', '#CDB38E', [7, 5]), trim: '#B9A386', ceiling: '#F4F1EC', glass: '#E4EEF8', frame: '#8C6440', door: '#B5835A' })
  const plates = P01.centre.map((cx, s) => {
    const m = picture(plateDoorTex(s), 0.3, 0.2, [cx, 2.17, P01.wall + 0.03])
    scene.add(m)
    const glow = halo(s === 0 ? 'rgba(59,111,240,0.8)' : 'rgba(20,184,166,0.8)', 0.45)
    glow.position.set(cx, 2.17, P01.wall + 0.02)
    scene.add(glow)
    return glow
  })

  /* the college copier in the middle, its tray holding the one stack of the same paper */
  const cop = new THREE.Group()
  cop.add(box(0.62, 0.86, 0.52, mat('#E9EDF3', { roughness: 0.4 }), [0, 0.43, 0], 0.03))
  cop.add(box(0.64, 0.06, 0.54, mat('#5C6678', { roughness: 0.4 }), [0, 0.89, 0], 0.02))
  cop.add(flat(box(0.5, 0.03, 0.01, mat('#C9D1DE'), [0, 0.3, 0.261])))
  cop.add(flat(box(0.5, 0.03, 0.01, mat('#C9D1DE'), [0, 0.55, 0.261])))
  const scanM = glowM('#9CC2FF', '#AFC3E6')
  cop.add(flat(box(0.42, 0.02, 0.01, scanM, [0, 0.8, 0.262])))
  const ledM = glowM(C.green, '#BFF5D2')
  cop.add(flat(sphere(0.018, ledM, [0.24, 0.8, 0.262])))
  cop.position.set(0, 0, P01.stack.z - 0.3)
  scene.add(cop)
  const pTex = paperTex()
  const sheet = (o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.45), basic(pTex, { transparent: false, ...o }))
  const stack = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const m = sheet()
    m.position.set(i * 0.004, -i * 0.006, -i * 0.012)
    stack.add(m)
  }
  stack.add(box(0.34, 0.04, 0.14, mat('#5C6678', { roughness: 0.4 }), [0, -0.21, -0.03], 0.01))
  stack.position.copy(P01.stack)
  stack.rotation.x = TILT
  scene.add(stack)

  /* the two centres: desks, paper stands, slip pads, exam packets */
  const slipT = [slipTex(0), slipTex(1)]
  const copies = P01.centre.map((cx, s) => {
    desk01(scene, cx, '#C49A6C', '#8C6440')
    const st = standAt(s)
    const stand = new THREE.Group()
    stand.add(box(0.36, 0.49, 0.02, mat('#8C6440', { roughness: 0.5 }), [0, 0, -0.02], 0.01))
    stand.add(box(0.36, 0.04, 0.08, mat('#6B4A2E'), [0, -0.24, 0.02], 0.01))
    stand.position.copy(st)
    stand.rotation.x = TILT
    scene.add(stand)
    /* the slip pad: a little stack of this centre's slips */
    const pad = new THREE.Group()
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08), basic(slipT[s], { transparent: false }))
      m.rotation.x = -Math.PI / 2 + 0.35
      m.position.set(0, i * 0.008, 0)
      pad.add(m)
    }
    pad.position.set(cx + inward(s) * P01.pad, P01.desk.h + 0.02, P01.desk.z + 0.12)
    scene.add(pad)
    /* the exam packet: an upright brown packet the finished paper drops into */
    const pk = new THREE.Group()
    const brown = mat('#C79A5B', { roughness: 0.7 })
    pk.add(box(0.36, 0.46, 0.02, brown, [0, 0.23, -0.05], 0.01), box(0.36, 0.3, 0.02, mat('#B88A4D', { roughness: 0.7 }), [0, 0.15, 0.06], 0.01), box(0.02, 0.3, 0.11, brown, [-0.17, 0.15, 0]), box(0.02, 0.3, 0.11, brown, [0.17, 0.15, 0]))
    pk.position.set(cx - inward(s) * P01.packet, P01.desk.h, P01.desk.z - 0.04)
    scene.add(pk)
    /* the travelling copy and its slip */
    const g = new THREE.Group()
    g.add(sheet())
    const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.1), basic(slipT[s], { transparent: false }))
    slip.position.set(0.02, 0.15, 0.004)
    g.add(slip)
    g.rotation.x = TILT
    g.visible = false
    scene.add(g)
    /* the slip in the hand, before it is pasted */
    const inHand = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.1), basic(slipT[s], { transparent: false }))
    inHand.visible = false
    scene.add(inHand)
    return { g, slip, inHand, pad }
  })
  const glints = P01.centre.map((_, s) => {
    const b = badge(tickTex(), 0.14)
    const p = standAt(s)
    b.position.set(p.x + inward(s) * 0.21, p.y + 0.24, p.z + 0.1)
    scene.add(b)
    return b
  })

  /* the invigilators */
  const IA = body(who(CAST_PRESETS.meera, { name: 'Invigilator', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'kurta', topColor: '#B8486B', bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#7A4A2A' }, accessories: { earrings: true, bindi: true, watch: true } }), [P01.centre[0], 0, P01.personZ], 1.6)
  const IB = body(who(CAST_PRESETS.arjun, { name: 'Invigilator', skinTone: 'wheatish', hair: { style: 'sidePart', color: 'black' }, outfit: { top: 'shirt', topColor: '#DDE7F7', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', watch: true, belt: true } }), [P01.centre[1], 0, P01.personZ], 1.7)
  const bodies = [IA, IB]
  const sides: ('L' | 'R')[] = ['R', 'L']
  const padPt = (s: number) => new THREE.Vector3(P01.centre[s] + inward(s) * P01.pad, P01.desk.h + 0.05, P01.desk.z + 0.12)
  const paperTop = (s: number) => {
    const p = standAt(s)
    return new THREE.Vector3(p.x + 0.02, p.y + 0.15, p.z + 0.06)
  }
  /* each invigilator's working arm: rest, to the pad, carrying the slip, pressing it on (a small rub) */
  const workArm = (s: number) => (c: number): Arm => {
    const b = bodies[s]
    const T = T01.paste(s)
    const rest: Arm = REST
    const atPad = reach(b, sides[s], padPt(s), camera)
    const atPaper = reach(b, sides[s], paperTop(s), camera)
    let a = rest
    a = mixArm(a, atPad, hold(c, T.pad[0], T.pad[1], T.carry[0], T.carry[0] + 0.01))
    const carry = seg(c, T.carry[0], T.carry[1])
    if (c >= T.carry[0] && c < T.press[1] + 0.4) a = mixArm(atPad, atPaper, carry)
    if (c >= T.press[0] && c < T.press[1]) a = mixArm(atPaper, { s: atPaper.s + 4 * Math.sin((c - T.press[0]) * TAU * 3), e: atPaper.e }, 1)
    a = mixArm(a, rest, seg(c, T.press[1], T.press[1] + 0.4))
    return a
  }
  const arms = [workArm(0), workArm(1)]
  const invPose = (s: number) => (p: Pose, c: number) => {
    const side = sides[s]
    const other: Arm = { s: 6, e: 10 }
    if (side === 'R') setArms(p, other, arms[s](c))
    else setArms(p, arms[s](c), other)
    const T = T01.paste(s)
    const [f0, f1] = T01.fly[s]
    /* watches the copy arrive, then the pad, the paper, then looks up, pleased */
    const watch = hold(c, f0 - 0.1, f0 + 0.2, f1, f1 + 0.2)
    to(p, 'headTurn', inward(s) * 0.5, watch)
    to(p, 'lookX', inward(s) * 0.9, watch)
    to(p, 'headNod', -0.1, watch)
    const work = hold(c, T.pad[0] - 0.1, T.pad[0] + 0.1, T.press[1], T.press[1] + 0.25)
    to(p, 'headTurn', inward(s) * 0.3, work)
    to(p, 'lookX', inward(s) * 0.7, work)
    to(p, 'headNod', 0.32, work)
    to(p, 'lookY', 0.85, work)
    const pack = hold(c, T01.pack[s][0] - 0.1, T01.pack[s][0] + 0.15, T01.pack[s][1], T01.pack[s][1] + 0.2)
    to(p, 'headTurn', -inward(s) * 0.35, pack)
    to(p, 'lookX', -inward(s) * 0.8, pack)
    to(p, 'headNod', 0.2, pack)
    to(p, 'lookY', 0.6, pack)
  }
  const HB = devHold(HOLD01)
  const faces = (s: number): [number, string][] => {
    const T = T01.paste(s)
    return [[0, 'neutral'], [T.pad[0], 'thinking'], [T.press[1], 'happy'], [7.9, 'neutral']]
  }
  const sprites = bodies.map((b, s) => {
    const sp = person({ config: b.cfg, dress: withNeck(LANYARD(s === 0 ? '#2D63FB' : '#14B8A6')), seed: 101 + s, faces: faces(s), pose: invPose(s), loop: L01, height: b.h, frames: F01, redraw, holdT: HB })
    sp.object.position.copy(b.root)
    scene.add(sp.object)
    return sp
  })
  const clk = slideClock('T01', scene, HB, sprites)
  const hand = new THREE.Vector3()

  return (t: number) => {
    const c = mod(clk.time(t), L01)
    const cq = frameT(c, L01, F01)
    sprites.forEach((sp) => sp.update(c, camera))
    /* the copier scans as each copy leaves */
    const scan = Math.max(...T01.fly.map(([a]) => hold(c, a - 0.3, a - 0.15, a + 0.05, a + 0.2)))
    scanM.emissiveIntensity = 1.6 * scan
    ledM.emissiveIntensity = 0.6 + 0.9 * scan
    copies.forEach((o, s) => {
      const r = copyAt01(c, s, o.g.position)
      o.g.visible = r.vis
      const T = T01.paste(s)
      o.slip.visible = c >= T.on && c < T01.pack[s][1]
      /* the slip in the hand: from the pad to the top of the paper (it follows the drawn frame) */
      const held = c >= T.pad[1] - 0.05 && c < T.on
      o.inHand.visible = held
      if (held) {
        handWorld(sides[s], bodies[s].sh, arms[s](cq), bodies[s].h, bodies[s].root, camera, hand, 0.1)
        o.inHand.position.copy(hand)
        o.inHand.quaternion.copy(camera.quaternion)
        o.inHand.rotateZ(inward(s) * 0.25)
      }
      const lit = hold(c, T.on, T.on + 0.25, T01.pack[s][0], T01.pack[s][0] + 0.3)
      setOp(plates[s], 0.4 * lit * (0.75 + 0.25 * Math.sin(c * TAU * 0.8)))
      plates[s].quaternion.copy(camera.quaternion)
      showBadge(glints[s], c >= T.press[1] && c < T01.pack[s][0] ? pop(c, T.press[1]) * (1 - seg(c, T01.pack[s][0] - 0.3, T01.pack[s][0])) : 0, camera)
    })
  }
}

/* ------------------------------------------------------------------ T01 concept: one image, a ConfigMap per environment */

function makeImage01(redraw: () => void, s = 1) {
  const g = new THREE.Group()
  const m = mat(C.brand, { roughness: 0.28, metalness: 0.12 })
  g.add(box(0.3, 0.3, 0.3, m, [0, 0, 0], 0.035))
  /* the seal band round it: the image does not change */
  g.add(flat(box(0.306, 0.05, 0.306, mat(C.navy, { roughness: 0.4 }), [0, 0.1, 0], 0.01)))
  g.add(picture(markTex(dockerUrl, redraw), 0.2, 0.2, [0, -0.02, 0.153], { transparent: false }))
  g.scale.setScalar(s)
  return g
}
function setupT01Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCam(camera, CAM01, AT01, FOV01)
  lights(scene, [0, 1.0, -0.6])
  hall01(scene, { wall: '#EEF2FA', floor: tileTex('#E3EAF8', '#C9D5EC', 2, [9, 7]), trim: '#1F2E63', ceiling: '#F3F6FC', glass: '#DCE8FF', frame: '#1F2E63', door: '#C9D5EC', glow: 0.5 })
  /* each environment's database where the room plate is, on a shelf over the door */
  const dbs = P01.centre.map((cx, s) => {
    scene.add(box(0.44, 0.04, 0.26, mat('#FFFFFF', { roughness: 0.4 }), [cx, 2.0, P01.wall + 0.13], 0.01))
    const g = new THREE.Group()
    const dm = mat(ROOM_COL[s], { roughness: 0.3, emissive: new THREE.Color(ROOM_COL[s]), emissiveIntensity: 0.15 })
    for (let k = 0; k < 3; k++) g.add(cyl(0.13, 0.13, 0.08, dm, [0, k * 0.1, 0], 32))
    for (let k = 0; k < 3; k++) g.add(flat(cyl(0.132, 0.132, 0.014, mat('#FFFFFF', { roughness: 0.3 }), [0, k * 0.1 + 0.04, 0], 32)))
    g.position.set(cx, 2.07, P01.wall + 0.14)
    scene.add(g)
    const glow = halo(s === 0 ? 'rgba(59,111,240,0.8)' : 'rgba(20,184,166,0.8)', 0.5)
    glow.position.set(cx, 2.17, P01.wall + 0.3)
    scene.add(glow)
    return { dm, glow }
  })

  /* the registry in the copier's place: a cabinet with the one stack of the same image */
  const reg = new THREE.Group()
  reg.add(box(0.62, 0.86, 0.52, mat(C.navy, { roughness: 0.35, metalness: 0.2 }), [0, 0.43, 0], 0.03))
  for (let r = 0; r < 3; r++) reg.add(flat(box(0.5, 0.03, 0.01, mat('#3B5BB8', { emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.4 }), [0, 0.25 + r * 0.16, 0.262])))
  const ledM = glowM(C.green, '#BFF5D2')
  reg.add(flat(sphere(0.018, ledM, [0.24, 0.78, 0.262])))
  reg.position.set(0, 0, P01.stack.z - 0.3)
  scene.add(reg)
  const stack = new THREE.Group()
  for (let i = 0; i < 2; i++) {
    const im = makeImage01(redraw)
    im.position.set(i === 0 ? -0.09 : 0.1, 0.15, i === 0 ? 0.02 : -0.05)
    stack.add(im)
  }
  const top = makeImage01(redraw)
  top.position.set(0, 0.45, 0)
  stack.add(top)
  stack.position.set(0, 0.86, P01.stack.z - 0.28)
  scene.add(stack)

  /* the two environments: platforms, the cradle, the ConfigMap stand, a node */
  const copies = P01.centre.map((cx, s) => {
    desk01(scene, cx, '#FFFFFF', '#C9D5EC')
    const st = standAt(s)
    scene.add(flat(box(0.36, 0.03, 0.3, mat(ROOM_COL[s], { roughness: 0.4 }), [st.x, P01.desk.h + 0.015, P01.desk.z], 0.01)))
    /* the ConfigMap stand where the invigilator stands: a post, a holder, its card */
    const post = new THREE.Group()
    post.add(cyl(0.12, 0.14, 0.04, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [0, 0.02, 0], 24))
    post.add(cyl(0.025, 0.025, 1.3, mat('#8E98AA', { metalness: 0.5, roughness: 0.35 }), [0, 0.67, 0], 12))
    /* the ConfigMap itself (its mark), with its settings card in a holder under it */
    post.add(box(0.3, 0.3, 0.03, mat(C.navy, { roughness: 0.35 }), [0, 1.44, -0.01], 0.03))
    post.add(picture(markTex(cmUrl, redraw), 0.26, 0.26, [0, 1.44, 0.008], { transparent: false }))
    post.add(box(0.32, 0.03, 0.06, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [0, 1.03, 0.02], 0.01))
    post.position.set(cx, 0, P01.personZ)
    scene.add(post)
    const cardT = settingsCardTex(s, redraw)
    const holderCard = picture(cardT, 0.28, 0.17, [cx, 1.12, P01.personZ + 0.03], { transparent: false })
    scene.add(holderCard)
    /* the node the image is handed to (the packet's place) */
    const node = new THREE.Group()
    node.add(box(0.36, 0.34, 0.24, mat('#1F2E63', { roughness: 0.3, metalness: 0.2 }), [0, 0.17, 0], 0.025))
    node.add(flat(box(0.24, 0.02, 0.18, mat('#0E1636'), [0, 0.341, 0])))
    const lampM = glowM(C.green, '#3A4458')
    node.add(flat(sphere(0.02, lampM, [0.12, 0.08, 0.122])))
    for (let r = 0; r < 2; r++) node.add(flat(box(0.2, 0.02, 0.01, mat('#3B5BB8'), [-0.04, 0.12 + r * 0.08, 0.122])))
    node.position.set(cx - inward(s) * P01.packet, P01.desk.h, P01.desk.z - 0.04)
    scene.add(node)
    /* the travelling image and the card clipped to it */
    const g = new THREE.Group()
    g.add(makeImage01(redraw, 0.9))
    const card = picture(cardT, 0.2, 0.12, [0.02, 0.14, 0.15], { transparent: false })
    card.rotation.z = -inward(s) * 0.12
    g.add(card)
    g.visible = false
    scene.add(g)
    const flying = picture(cardT, 0.2, 0.12, [0, 0, 0], { transparent: false })
    flying.visible = false
    scene.add(flying)
    return { g, card, flying, holderCard, lampM }
  })
  /* the link from each image to its own database */
  const links = P01.centre.map((cx, s) => {
    const st = standAt(s)
    return dotArc(scene, new THREE.Vector3(st.x, st.y + 0.22, st.z + 0.05), new THREE.Vector3(cx + inward(s) * 0.05, 1.98, P01.wall + 0.3), 0.18, ROOM_COL[s], 10, 0.017)
  })
  const glints = P01.centre.map((_, s) => {
    const b = badge(tickTex(), 0.14)
    const p = standAt(s)
    b.position.set(p.x + inward(s) * 0.21, p.y + 0.24, p.z + 0.1)
    scene.add(b)
    return b
  })
  const clk = slideClock('T01', scene, devHold(HOLD01), [{ ready: Promise.resolve() }])
  const from = new THREE.Vector3()
  const toP = new THREE.Vector3()

  return (t: number) => {
    const c = mod(clk.time(t), L01)
    const scan = Math.max(...T01.fly.map(([a]) => hold(c, a - 0.3, a - 0.15, a + 0.05, a + 0.2)))
    ledM.emissiveIntensity = 0.6 + 0.9 * scan
    top.position.y = 0.45 + 0.04 * scan
    copies.forEach((o, s) => {
      const r = copyAt01(c, s, o.g.position)
      o.g.position.y -= 0.02
      o.g.visible = r.vis
      const T = T01.paste(s)
      o.card.visible = c >= T.on && c < T01.pack[s][1]
      /* the card leaves its holder (as the slip leaves the pad), travels, clips on */
      const fly = c >= T.carry[0] - 0.25 && c < T.on
      o.holderCard.visible = !(c >= T.carry[0] - 0.25 && c < T01.pack[s][1] + 0.3)
      o.flying.visible = fly
      if (fly) {
        from.set(P01.centre[s], 1.12, P01.personZ + 0.03)
        const st = standAt(s)
        toP.set(st.x + 0.02, st.y + 0.12, st.z + 0.16)
        const k = seg(c, T.carry[0] - 0.25, T.on)
        o.flying.position.lerpVectors(from, toP, k)
        o.flying.position.y += Math.sin(k * Math.PI) * 0.15
        o.flying.quaternion.copy(camera.quaternion)
      }
      const lit = hold(c, T.on, T.on + 0.25, T01.pack[s][0], T01.pack[s][0] + 0.3)
      /* the link runs once the settings are on: a dot path filling, again and again */
      const run = c >= T.on + 0.1 && c < T01.pack[s][0] ? mod(c - T.on - 0.1, 1.2) / 1.0 : 0
      links[s].set(Math.min(1, run), lit)
      dbs[s].dm.emissiveIntensity = 0.15 + 0.5 * lit * (0.6 + 0.4 * Math.sin(c * TAU * 0.8))
      dbs[s].glow.quaternion.copy(camera.quaternion)
      setOp(dbs[s].glow, 0.3 * lit)
      /* the node runs the image once it is handed over */
      o.lampM.emissiveIntensity = 1.6 * hold(c, T01.pack[s][1] - 0.1, T01.pack[s][1] + 0.1, 8.6, 8.95)
      showBadge(glints[s], c >= T.press[1] && c < T01.pack[s][0] ? pop(c, T.press[1]) * (1 - seg(c, T01.pack[s][0] - 0.3, T01.pack[s][0])) : 0, camera)
    })
  }
}

/* ================================================================== T08 · classrooms with their own registers / namespaces */

const L08 = 8
const F08 = 96
const HOLD08 = 1.75 /* the two star-named students answer at once, each ticked in their own room's register */
const CAM08: V3 = [0, 1.85, 6.5]
const AT08: V3 = [0, 1.2, -0.4]
const FOV08 = 37
const P08 = {
  rooms: [-1.46, 0, 1.46] as const,
  roomW: 1.4,
  back: -1.15,
  front: 0.42,
  ceil: 2.32,
  teacher: -0.42, // from the room's centre
  teacherZ: -0.62,
  students: [0.04, 0.44] as const,
  studentZ: -0.5,
  deskZ: -0.24,
  deskH: 0.56,
}
/* each room's two names (shapes): the star name is in room 1 AND room 3 */
const NAMES: [Shape, Shape][] = [
  ['star', 'circle'],
  ['triangle', 'square'],
  ['star', 'heart'],
]
const NS_COL = ['#3B6FF0', '#14B8A6', '#8B5CF6'] as const
const T08 = {
  call: [[0.45, 2.3], [2.5, 4.35]] as const,
  tick: [1.35, 3.4] as const,
  clear: [6.85, 7.4] as const,
}
const ticked08 = (c: number) => (c >= T08.clear[0] + 0.2 ? 0 : T08.tick.filter((a) => c >= a).length)
/** a register's open page: the room's two names (shapes) and their tick boxes */
function drawRegister(g: CanvasRenderingContext2D, w: number, h: number, names: [Shape, Shape], n: number, kind: 'book' | 'list') {
  if (kind === 'book') {
    rr(g, 0, 0, w, h, 6, '#7A2E45')
    rr(g, 5, 5, w / 2 - 6, h - 10, 4, '#FFFDF6')
    rr(g, w / 2 + 1, 5, w / 2 - 6, h - 10, 4, '#FFFDF6')
    for (let i = 0; i < 4; i++) rr(g, 14, 18 + i * 16, w / 2 - 26, 4, 2, '#D9D2C0')
  } else {
    rr(g, 0, 0, w, h, 8, '#FFFFFF')
  }
  const x0 = kind === 'book' ? w / 2 + 8 : 12
  const x1 = w - (kind === 'book' ? 12 : 12)
  const rowH = (h - 20) / 2
  for (let i = 0; i < 2; i++) {
    const cy = 10 + rowH * i + rowH / 2
    shapeGlyph(g, names[i], x0 + 12, cy, 10)
    rr(g, x0 + 28, cy - 3, x1 - x0 - 28 - 26, 6, 3, '#D5DCE8')
    const bx = x1 - 20
    g.strokeStyle = '#9AA8C2'
    g.lineWidth = 2.4
    g.beginPath()
    g.roundRect(bx, cy - 9, 18, 18, 4)
    g.stroke()
    if (i < n) {
      g.strokeStyle = C.greenDark
      g.lineWidth = 4
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.beginPath()
      g.moveTo(bx + 3.5, cy)
      g.lineTo(bx + 8, cy + 5)
      g.lineTo(bx + 16, cy - 7)
      g.stroke()
    }
  }
}
/** the building / the cluster: floor, back wall, partitions, ceiling, the front frame with its top band */
function building08(scene: THREE.Scene, o: { floor: THREE.Texture; wall: string; part: string; frame: string; band: string; ground: string; glass?: boolean; glow?: number }) {
  const X = P08.rooms[2] + P08.roomW / 2 + 0.06
  scene.add(floorPlane(14, 9, mat(o.ground, { roughness: 0.95 }), [0, -0.001, 1.5]))
  scene.add(floorPlane(2 * X, P08.front - P08.back, mat('#ffffff', { map: o.floor, roughness: 0.8 }), [0, 0.003, (P08.front + P08.back) / 2]))
  const wallM = mat(o.wall, { roughness: 0.95, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.25 })
  scene.add(flat(box(2 * X, P08.ceil, 0.08, wallM, [0, P08.ceil / 2, P08.back - 0.04])))
  const ceilM = mat('#F6F3EE', { roughness: 0.9, emissive: new THREE.Color('#F6F3EE'), emissiveIntensity: 0.3 })
  scene.add(flat(box(2 * X, 0.06, P08.front - P08.back, ceilM, [0, P08.ceil + 0.03, (P08.front + P08.back) / 2])))
  /* partitions and the two end walls */
  const partM = o.glass
    ? new THREE.MeshStandardMaterial({ color: o.part, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false })
    : mat(o.part, { roughness: 0.9, emissive: new THREE.Color(o.part), emissiveIntensity: 0.2 })
  for (const x of [-X, P08.rooms[0] + P08.roomW / 2 + 0.03, P08.rooms[1] + P08.roomW / 2 + 0.03, X]) {
    const end = Math.abs(Math.abs(x) - X) < 1e-6
    scene.add(flat(box(0.06, P08.ceil, P08.front - P08.back, end && !o.glass ? wallM : partM, [x, P08.ceil / 2, (P08.front + P08.back) / 2])))
  }
  /* the front frame: a base slab, the top band, the roof */
  const frameM = mat(o.frame, { roughness: 0.6 })
  scene.add(box(2 * X + 0.24, 0.12, P08.front - P08.back + 0.3, frameM, [0, -0.062, (P08.front + P08.back) / 2 + 0.05], 0.02))
  scene.add(box(2 * X + 0.24, 0.42, 0.12, mat(o.band, { roughness: 0.5 }), [0, P08.ceil + 0.27, P08.front], 0.02))
  scene.add(box(2 * X + 0.4, 0.08, P08.front - P08.back + 0.4, frameM, [0, P08.ceil + 0.52, (P08.front + P08.back) / 2], 0.02))
  for (const x of [-X, X]) scene.add(box(0.14, P08.ceil, 0.14, frameM, [x, P08.ceil / 2, P08.front], 0.02))
}
/** a desk (a student's) / a pedestal (a pod's), with its name plate on the front */
function desk08(scene: THREE.Scene, x: number, shape: Shape, top: string, leg: string) {
  const g = new THREE.Group()
  g.add(box(0.36, 0.035, 0.26, mat(top, { roughness: 0.45 }), [0, P08.deskH - 0.018, 0], 0.008))
  g.add(box(0.34, P08.deskH - 0.04, 0.025, mat(leg, { roughness: 0.6 }), [0, (P08.deskH - 0.04) / 2, 0.11]))
  for (const lx of [-0.16, 0.16]) g.add(box(0.025, P08.deskH - 0.04, 0.22, mat(leg, { roughness: 0.6 }), [lx, (P08.deskH - 0.04) / 2, 0]))
  g.add(picture(plateTex(shape), 0.22, 0.14, [0, 0.33, 0.126], { transparent: false }))
  g.position.set(x, 0, P08.deskZ)
  scene.add(g)
  return g
}

/* ------------------------------------------------------------------ T08 everyday: one school building, three classrooms */

function setupT08Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#DDEBF7')
  setCam(camera, CAM08, AT08, FOV08)
  lights(scene, [0, 1.0, -0.4], 2.0, 7)
  building08(scene, { floor: plankTex('#E2CDAE', '#CDB38E', [6, 2]), wall: '#F3EAD8', part: '#E9DEC8', frame: '#C46A4A', band: '#E8D9BE', ground: '#A6D49B' })
  /* the school's crest on the top band (a shape, no name) */
  scene.add(picture(canvasTex(80, 80, (g) => {
    g.fillStyle = '#1F2E63'
    g.beginPath()
    g.moveTo(40, 6)
    g.lineTo(70, 16)
    g.lineTo(66, 50)
    g.lineTo(40, 74)
    g.lineTo(14, 50)
    g.lineTo(10, 16)
    g.closePath()
    g.fill()
    g.fillStyle = '#F2C14E'
    g.beginPath()
    g.moveTo(24, 34)
    g.lineTo(40, 26)
    g.lineTo(56, 34)
    g.lineTo(40, 42)
    g.closePath()
    g.fill()
    g.fillRect(30, 38, 20, 12)
  }), 0.34, 0.34, [0, P08.ceil + 0.27, P08.front + 0.065]))
  /* each room: the blackboard, two desks with name plates */
  P08.rooms.forEach((cx, r) => {
    const bx = cx + 0.22
    scene.add(box(0.8, 0.54, 0.04, mat('#8C6440', { roughness: 0.5 }), [bx, 1.62, P08.back + 0.02], 0.01))
    scene.add(flat(box(0.72, 0.46, 0.01, mat('#3C7058', { roughness: 0.85, emissive: new THREE.Color('#3C7058'), emissiveIntensity: 0.15 }), [bx, 1.62, P08.back + 0.045])))
    scene.add(flat(box(0.72, 0.025, 0.05, mat('#8C6440'), [bx, 1.37, P08.back + 0.06])))
    NAMES[r].forEach((nm, i) => desk08(scene, cx + P08.students[i], nm, '#C49A6C', '#8C6440'))
  })
  /* the teachers and students */
  const T = [
    body(who(CAST_PRESETS.riya, { name: 'Teacher', skinTone: 'wheatish', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#5856DC', bottom: 'skirt', bottomColor: '#1B3F80', shoeColor: '#1B3F80' }, accessories: { earrings: true, glasses: 'round' } }), [P08.rooms[0] + P08.teacher, 0, P08.teacherZ], 1.6),
    body(who(CAST_PRESETS.dev, { name: 'Teacher', skinTone: 'medium', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: '#F2F5FA', bottom: 'trousers', bottomColor: '#3E4A66', shoeColor: '#2A2A30' }, accessories: { glasses: 'rect', beard: 'short', watch: true } }), [P08.rooms[1] + P08.teacher, 0, P08.teacherZ], 1.68),
    body(who(CAST_PRESETS.meera, { name: 'Teacher', skinTone: 'medium', hair: { style: 'braid', color: 'black' }, outfit: { top: 'kurta', topColor: '#C2477A', bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#7A4A2A' }, accessories: { earrings: true, bindi: true } }), [P08.rooms[2] + P08.teacher, 0, P08.teacherZ], 1.6),
  ]
  const UNI = { top: 'shirtTie' as const, topColor: '#F4F6FA' as const, accentColor: '#1F2E63' as const, shoeColor: '#1F2433' as const }
  const boy = (base: CharacterConfig, skin: CharacterConfig['skinTone'], hair: CharacterConfig['hair'], extra: Partial<CharacterConfig['accessories']> = {}) => who(base, { name: 'Student', gender: 'male', skinTone: skin, hair, outfit: { ...UNI, bottom: 'trousers', bottomColor: '#2C3C81' }, accessories: { beard: 'none', watch: false, glasses: 'none', belt: false, ...extra }, build: { shoulders: 0.92 } })
  const girl = (base: CharacterConfig, skin: CharacterConfig['skinTone'], hair: CharacterConfig['hair'], extra: Partial<CharacterConfig['accessories']> = {}) => who(base, { name: 'Student', gender: 'female', skinTone: skin, hair, outfit: { ...UNI, bottom: 'skirt', bottomColor: '#2C3C81' }, accessories: { earrings: false, bindi: false, watch: false, glasses: 'none', ...extra }, build: { shoulders: 0.92 } })
  const S: CharacterConfig[][] = [
    [boy(CAST_PRESETS.kabir, 'fair', { style: 'curly', color: 'black' }), girl(CAST_PRESETS.ananya, 'medium', { style: 'ponytail', color: 'black' })],
    [girl(CAST_PRESETS.riya, 'dusky', { style: 'braid', color: 'black' }), boy(CAST_PRESETS.rohan, 'wheatish', { style: 'buzz', color: 'black' })],
    [boy(CAST_PRESETS.arjun, 'dusky', { style: 'quiff', color: 'black' }, { glasses: 'round' }), girl(CAST_PRESETS.meera, 'fair', { style: 'bob', color: 'brown' })],
  ]
  const studentH = [
    [1.3, 1.26],
    [1.25, 1.32],
    [1.31, 1.27],
  ]
  /* the teacher's arms: the left holds the register at her chest, the right the pen (a flick at each tick) */
  const bookArm: Arm = { s: 30, e: 112 }
  const penArm = (c: number): Arm => {
    const flick = T08.tick.reduce((a, s0) => a + hold(c, s0 - 0.2, s0 - 0.07, s0 - 0.02, s0 + 0.15), 0)
    return { s: 24 + 5 * flick, e: 100 - 10 * flick }
  }
  const tPose = (r: number) => (p: Pose, c: number) => {
    setArms(p, bookArm, penArm(c))
    /* down at the register, up at each student as they are called, down again to tick */
    const down = 1 - Math.max(...T08.call.map(([a], i) => hold(c, a - 0.05, a + 0.15, T08.tick[i] - 0.3, T08.tick[i] - 0.15)), hold(c, 4.45, 4.7, 6.8, 7.1))
    to(p, 'headNod', 0.3, down)
    to(p, 'lookY', 0.75, down)
    to(p, 'headTurn', 0.15, down)
    T08.call.forEach(([a], i) => {
      const w = hold(c, a - 0.05, a + 0.15, T08.tick[i] - 0.3, T08.tick[i] - 0.15)
      to(p, 'headTurn', i === 0 ? 0.38 : 0.55, w)
      to(p, 'lookX', i === 0 ? 0.8 : 1, w)
      to(p, 'headNod', 0.06, w)
      to(p, 'lookY', 0.2, w)
      talk(p, c, hold(c, a + 0.05, a + 0.12, a + 0.5, a + 0.58))
    })
    const room = hold(c, 4.45, 4.7, 6.8, 7.1)
    to(p, 'headTurn', 0.45, room)
    to(p, 'lookX', 0.9, room)
    void r
  }
  /* the hand goes up with the elbow folded on the way (it never sweeps out across the next desk) */
  const raiseArm = (up: number): Arm => ({ s: 5 + 163 * up, e: lerp(8, 14, up) + 125 * Math.sin(Math.PI * up) })
  const sPose = (i: number) => (p: Pose, c: number) => {
    const [a, b] = T08.call[i]
    const up = hold(c, a + 0.35, a + 0.65, b - 0.5, b - 0.2)
    setArms(p, { s: 5, e: 8 }, raiseArm(up))
    openHand(p, up, 'R')
    /* everyone faces the teacher (to their left); the one called answers */
    to(p, 'headTurn', -0.35, 1)
    to(p, 'lookX', -0.85, 1)
    talk(p, c, hold(c, a + 0.6, a + 0.68, a + 1.0, a + 1.08))
  }
  const HB = devHold(HOLD08)
  const tFaces: [number, string][] = [[0, 'neutral'], [0.45, 'happy'], [1.3, 'neutral'], [2.5, 'happy'], [3.35, 'neutral'], [4.45, 'happy'], [7.2, 'neutral']]
  const sFaces = (i: number): [number, string][] => (i === 0 ? [[0, 'neutral'], [0.75, 'excited'], [1.9, 'happy'], [7.4, 'neutral']] : [[0, 'neutral'], [2.8, 'excited'], [3.95, 'happy'], [7.4, 'neutral']])
  const people: Sprite[] = []
  T.forEach((b, r) => {
    const sp = person({ config: b.cfg, seed: 801 + r, faces: tFaces, pose: tPose(r), loop: L08, height: b.h, frames: F08, redraw, holdT: HB })
    sp.object.position.copy(b.root)
    scene.add(sp.object)
    people.push(sp)
  })
  P08.rooms.forEach((cx, r) =>
    S[r].forEach((cfg, i) => {
      const sp = person({ config: cfg, dress: withTop(TIE('#1F2E63')), seed: 811 + r * 2 + i, faces: sFaces(i), pose: sPose(i), loop: L08, height: studentH[r][i], frames: F08, redraw, holdT: HB })
      sp.object.position.set(cx + P08.students[i], 0, P08.studentZ)
      scene.add(sp.object)
      people.push(sp)
    }),
  )
  /* the registers in the teachers' hands, a pen each, and the ticks over the desks */
  const regs = P08.rooms.map((_, r) => {
    const live = liveTex(160, 96, (g, n) => drawRegister(g, 160, 96, NAMES[r], n, 'book'))
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.228), basic(live.tex, { transparent: false }))
    scene.add(m)
    const pen = new THREE.Group()
    pen.add(cyl(0.008, 0.008, 0.13, mat(C.brand, { roughness: 0.3 }), [0, 0, 0], 10))
    pen.add(cyl(0.0, 0.008, 0.022, mat('#2C3545'), [0, -0.076, 0], 10))
    scene.add(pen)
    return { m, live, pen }
  })
  const ticks = P08.rooms.map((cx) =>
    P08.students.map((sx) => {
      /* on the desk / pedestal front, beside its name plate (clear of the person behind it) */
      const b = badge(tickTex(), 0.12)
      b.position.set(cx + sx + 0.12, 0.43, P08.deskZ + 0.17)
      scene.add(b)
      return b
    }),
  )
  const clk = slideClock('T08', scene, HB, people)
  const hL = new THREE.Vector3()
  const hR = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L08)
    const cq = frameT(c, L08, F08)
    people.forEach((sp) => sp.update(c, camera))
    const n = ticked08(c)
    regs.forEach((o, r) => {
      const b = T[r]
      handWorld('L', b.sh, bookArm, b.h, b.root, camera, hL, 0.16)
      o.m.position.copy(hL).add(new THREE.Vector3(0.13, 0.04, 0))
      o.m.quaternion.copy(camera.quaternion)
      o.m.rotateX(-0.3)
      o.live.paint(n)
      handWorld('R', b.sh, penArm(cq), b.h, b.root, camera, hR, 0.22)
      o.pen.position.copy(hR)
      o.pen.quaternion.copy(camera.quaternion)
      o.pen.rotateZ(0.5)
    })
    ticks.forEach((row) =>
      row.forEach((b, i) => {
        const k = c >= T08.tick[i] && c < T08.clear[1] ? pop(c, T08.tick[i]) * (1 - seg(c, T08.clear[0], T08.clear[1])) : 0
        showBadge(b, k, camera)
      }),
    )
  }
}

/* ------------------------------------------------------------------ T08 concept: one cluster, three namespaces */

function setupT08Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E6EEFA')
  setCam(camera, CAM08, AT08, FOV08)
  lights(scene, [0, 1.0, -0.4], 2.0, 7)
  building08(scene, { floor: tileTex('#EEF2FA', '#D6E0F2', 2, [10, 3]), wall: '#EEF2FA', part: '#C9D8F5', frame: '#1F2E63', band: '#FFFFFF', ground: '#D3DDEE', glass: true, glow: 0.5 })
  /* the cluster's mark on the top band, in the school crest's place */
  scene.add(picture(markTex(k8sUrl, redraw), 0.34, 0.34, [0, P08.ceil + 0.27, P08.front + 0.065], { transparent: false }))
  const nsTex = markTex(nsUrl, redraw)
  const podTex = markTex(podUrl, redraw)
  /* each namespace: its floor tint, its mark where the blackboard is, its name list where the teacher is */
  const lists = P08.rooms.map((cx, r) => {
    scene.add(flat(floorPlane(P08.roomW - 0.12, P08.front - P08.back - 0.12, mat(NS_COL[r], { transparent: true, opacity: 0.16, roughness: 0.8 }), [cx, 0.006, (P08.front + P08.back) / 2])))
    const bx = cx + 0.22
    scene.add(box(0.8, 0.54, 0.04, mat(NS_COL[r], { roughness: 0.45 }), [bx, 1.62, P08.back + 0.02], 0.02))
    scene.add(picture(nsTex, 0.4, 0.4, [bx, 1.62, P08.back + 0.045], { transparent: false }))
    const kiosk = new THREE.Group()
    kiosk.add(cyl(0.12, 0.14, 0.03, mat('#5C6678', { metalness: 0.5, roughness: 0.35 }), [0, 0.015, 0], 24))
    kiosk.add(cyl(0.025, 0.025, 0.9, mat('#8E98AA', { metalness: 0.5, roughness: 0.35 }), [0, 0.46, 0], 12))
    kiosk.add(box(0.44, 0.3, 0.03, mat(C.navy, { roughness: 0.35 }), [0, 1.05, 0], 0.02))
    const live = liveTex(140, 92, (g, n) => drawRegister(g, 140, 92, NAMES[r], n, 'list'))
    kiosk.add(picture(live.tex, 0.4, 0.263, [0, 1.05, 0.017], { transparent: false }))
    kiosk.position.set(cx + P08.teacher, 0, P08.teacherZ)
    scene.add(kiosk)
    return live
  })
  /* the pods on their pedestals, a name plate each */
  const pods = P08.rooms.map((cx, r) =>
    NAMES[r].map((nm, i) => {
      desk08(scene, cx + P08.students[i], nm, '#FFFFFF', '#C9D5EC')
      const g = new THREE.Group()
      const m = mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color(NS_COL[r]), emissiveIntensity: 0 })
      g.add(box(0.3, 0.3, 0.3, m, [0, 0, 0], 0.05))
      g.add(picture(podTex, 0.24, 0.24, [0, 0, 0.152], { transparent: false }))
      const base = new THREE.Vector3(cx + P08.students[i], P08.deskH + 0.17, P08.deskZ - 0.02)
      g.position.copy(base)
      scene.add(g)
      return { g, m, base }
    }),
  )
  /* the list checking each pod: a dotted path from the list to the pod */
  const scans = P08.rooms.map((cx, r) =>
    P08.students.map((sx) => dotArc(scene, new THREE.Vector3(cx + P08.teacher + 0.2, 1.08, P08.teacherZ + 0.05), new THREE.Vector3(cx + sx - 0.1, P08.deskH + 0.3, P08.deskZ - 0.02), 0.12, NS_COL[r], 8, 0.016)),
  )
  const ticks = P08.rooms.map((cx) =>
    P08.students.map((sx) => {
      /* on the desk / pedestal front, beside its name plate (clear of the person behind it) */
      const b = badge(tickTex(), 0.12)
      b.position.set(cx + sx + 0.12, 0.43, P08.deskZ + 0.17)
      scene.add(b)
      return b
    }),
  )
  void lists
  const clk = slideClock('T08', scene, devHold(HOLD08), [{ ready: Promise.resolve() }])
  return (t: number) => {
    const c = mod(clk.time(t), L08)
    const n = ticked08(c)
    lists.forEach((l) => l.paint(n))
    pods.forEach((row, r) =>
      row.forEach((o, i) => {
        const [a, b] = T08.call[i]
        const up = hold(c, a + 0.35, a + 0.65, b - 0.5, b - 0.2)
        o.g.position.copy(o.base)
        o.g.position.y += 0.16 * up
        o.g.rotation.y = 0.35 * Math.sin(up * Math.PI)
        o.m.emissiveIntensity = 0.55 * up
        scans[r][i].set(seg(c, a, a + 0.45), hold(c, a, a + 0.1, T08.tick[i], T08.tick[i] + 0.2))
        const k = c >= T08.tick[i] && c < T08.clear[1] ? pop(c, T08.tick[i]) * (1 - seg(c, T08.clear[0], T08.clear[1])) : 0
        showBadge(ticks[r][i], k, camera)
      }),
    )
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
  H_T06Everyday: card('T06', setupT06Everyday, devHold(HOLD06)),
  H_T06Concept: card('T06', setupT06Concept, devHold(HOLD06)),
  H_T08Everyday: card('T08', setupT08Everyday, devHold(HOLD08)),
  H_T08Concept: card('T08', setupT08Concept, devHold(HOLD08)),
}
export const css = ''
