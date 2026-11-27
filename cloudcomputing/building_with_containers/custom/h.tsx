import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { useHeld } from '@/engine/figkit'

/**
 * BUILDER H · SESSION 19 (Building with Containers) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built on Session 22's h.tsx helpers (copied below: the slide clock both cards share, Character Lab people from the
 * engine's `castSprite` at a fixed `px: 256` with no idle breathing, arm IK so a hand lands on what it holds). NO TEXT
 * on either card, one wall-clock loop per slide shared by both cards, each loop ending in the state it starts in (the
 * reset takes the last 0.3 s, standing correction 14), held frames (`?still`, thumbnails) at HOLD. Cards 470 x 390.
 *
 * SLIDE 9, T02-AN (TR 2): "Picking a base image is like choosing a house for your needs: a fully furnished house comes
 * with many facilities, while a basic house has only essential facilities, just as a full distro image includes many
 * pre-installed tools, while a slim or alpine image includes only the essentials."
 *
 *   place          everyday: two cut-away houses side by side      concept: two image stacks on plinths
 *   left           the furnished house: rug, sofa, TV, lamp,        the full distro image: seven layers, a tool
 *                  shelf, picture, plant (seven facilities)         on each (OS, shell, editor, build tools, ...)
 *   right          the basic house: bed, table, one chair           the slim image: three layers
 *   people         a woman settling into the furnished house;       a developer beside the slim image, who points
 *                  a man moving into the basic one with one box     at it once the app lands on it
 *
 *   0.40 - 3.10    the furniture arrives piece by piece (left 7,    the layers stack up in step (left 7, right 3)
 *                  right 3)
 *   4.10 - 4.90    the man sets his one box on the table            the app block drops onto the slim stack
 *   4.30 - 7.90    the woman presents her full house                the developer points at the slim image
 *   8.70 - 9.00    everything clears; the box is back in his hands  the stacks clear (0.3 s)
 *
 * SLIDE 24, T09-AN (TR 9): "Packing for a short trip requires only the clothes and items you need, not your entire
 * wardrobe, just as a minimal base image contains only the essential components needed to run an application, without
 * unnecessary tools and packages."
 *
 *   place          everyday: a bedroom                              concept: a developer's build room
 *   left           an open wardrobe full of clothes                 a rack full of tool blocks (shell, editor,
 *                                                                   compiler, ...) and three essential blocks
 *   centre         a small cabin bag, open on a bench               a small container image, open on a stand
 *   right          the traveller                                    the developer
 *
 *   0.50 - 5.75    three items, one at a time, shelf to bag         app + two library blocks, rack to container
 *                  (a shirt, a toothbrush, a charger)
 *   6.00 - 6.60    the bag's lid closes; the wardrobe stays full    the container's lid closes; the tools stay out
 *   8.70 - 9.00    the lid opens, the items are back on the shelf   the lid opens, the blocks are back on the rack (0.3 s)
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
/* ================================================================== shared for S19: glyphs, rounded blocks, ground */

/** a white tool glyph on a transparent tile (shapes only, never letters) */
type Glyph = 'os' | 'terminal' | 'pencil' | 'gear' | 'package' | 'chart' | 'search' | 'bolt' | 'lib' | 'app' | 'hammer' | 'wrench' | 'bug'
function drawGlyph(g: CanvasRenderingContext2D, k: Glyph, col = '#FFFFFF') {
  g.strokeStyle = col
  g.fillStyle = col
  g.lineWidth = 6
  g.lineCap = 'round'
  g.lineJoin = 'round'
  const P = (pts: number[][], close = false, fill = false) => {
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    if (close) g.closePath()
    if (fill) g.fill()
    else g.stroke()
  }
  if (k === 'os') {
    /* a penguin-free "system" mark: a stacked disc (the OS base) */
    g.beginPath()
    g.ellipse(32, 20, 20, 7, 0, 0, TAU)
    g.stroke()
    P([[12, 20], [12, 44]])
    P([[52, 20], [52, 44]])
    g.beginPath()
    g.ellipse(32, 44, 20, 7, 0, 0, Math.PI)
    g.stroke()
    g.beginPath()
    g.ellipse(32, 32, 20, 7, 0, 0, Math.PI)
    g.stroke()
  } else if (k === 'terminal') {
    g.beginPath()
    g.roundRect(8, 12, 48, 40, 6)
    g.stroke()
    P([[18, 26], [26, 32], [18, 38]])
    P([[31, 40], [44, 40]])
  } else if (k === 'pencil') {
    P([[16, 48], [44, 20], [50, 26], [22, 54], [14, 56]], true)
    P([[39, 25], [45, 31]])
  } else if (k === 'gear') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      P([[32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16], [32 + Math.cos(a) * 25, 32 + Math.sin(a) * 25]])
    }
    g.beginPath()
    g.arc(32, 32, 15, 0, TAU)
    g.stroke()
    g.beginPath()
    g.arc(32, 32, 5, 0, TAU)
    g.fill()
  } else if (k === 'package') {
    P([[32, 10], [54, 21], [54, 45], [32, 56], [10, 45], [10, 21]], true)
    P([[10, 21], [32, 32], [54, 21]])
    P([[32, 32], [32, 56]])
  } else if (k === 'chart') {
    P([[10, 12], [10, 52], [54, 52]])
    for (const [x, h] of [[20, 14], [31, 26], [42, 34]]) {
      g.beginPath()
      g.roundRect(x - 4, 48 - h, 8, h, 2)
      g.fill()
    }
  } else if (k === 'search') {
    g.beginPath()
    g.arc(27, 27, 14, 0, TAU)
    g.stroke()
    P([[37, 37], [52, 52]])
  } else if (k === 'bolt') {
    P([[36, 8], [16, 36], [30, 36], [26, 56], [48, 26], [34, 26], [36, 8]], true, true)
  } else if (k === 'lib') {
    for (const [x, h] of [[14, 40], [26, 44], [38, 36]]) {
      g.beginPath()
      g.roundRect(x, 54 - h, 9, h, 2)
      g.stroke()
    }
    P([[48, 22], [54, 52]])
  } else if (k === 'app') {
    g.beginPath()
    g.roundRect(8, 10, 48, 44, 7)
    g.stroke()
    P([[8, 22], [56, 22]])
    for (const [x, y] of [[16, 30], [34, 30], [16, 42], [34, 42]]) {
      g.beginPath()
      g.roundRect(x, y, 13, 8, 2)
      g.fill()
    }
  } else if (k === 'hammer') {
    P([[20, 52], [40, 30]])
    P([[30, 16], [46, 14], [52, 22], [42, 34], [32, 26]], true, true)
  } else if (k === 'wrench') {
    P([[16, 50], [38, 28]])
    g.beginPath()
    g.arc(44, 22, 10, 0.9, 0.9 + Math.PI * 1.55)
    g.stroke()
  } else {
    /* bug */
    g.beginPath()
    g.ellipse(32, 36, 12, 16, 0, 0, TAU)
    g.stroke()
    for (const y of [28, 38, 48]) {
      P([[20, y], [10, y - 4]])
      P([[44, y], [54, y - 4]])
    }
  }
}
const glyphCache = new Map<string, THREE.CanvasTexture>()
const glyphTex = (k: Glyph, col = '#FFFFFF') => {
  const key = k + col
  let t = glyphCache.get(key)
  if (!t || !t.image) glyphCache.set(key, (t = canvasTex(64, 64, (g) => drawGlyph(g, k, col))))
  return t
}
/** a rounded block with a glyph on its front face; pivot at its base centre so it pops up from where it stands */
function block(w: number, h: number, d: number, color: string, glyph?: Glyph, gs = 0.7) {
  const g = new THREE.Group()
  g.add(box(w, h, d, mat(color, { roughness: 0.35, metalness: 0.05 }), [0, h / 2, 0], Math.min(w, h, d) * 0.16))
  if (glyph) {
    const s = Math.min(w, h) * gs
    g.add(picture(glyphTex(glyph), s, s, [0, h / 2, d / 2 + 0.002]))
  }
  return g
}
const setScale = (o: THREE.Object3D, k: number) => {
  o.visible = k > 0.002
  o.scale.setScalar(Math.max(0.001, k))
}
/** a soft white plinth disc */
function plinth(scene: THREE.Scene, x: number, z: number, r: number) {
  scene.add(cyl(r, r + 0.03, 0.07, mat('#FFFFFF', { roughness: 0.4 }), [x, 0.035, z], 48))
  scene.add(flat(cyl(r - 0.04, r - 0.04, 0.004, mat('#E3EBFB', { roughness: 0.5 }), [x, 0.072, z], 48)))
}

/* ================================================================== T02 · furnished vs basic house / full vs slim image */

const L02 = 9
const F02 = 108
const HOLD02 = 6.6 /* both houses furnished, the box on the table, the woman presenting, the developer pointing */
const CAM02: V3 = [0, 1.6, 5.85] /* far enough that both whole houses, eaves included, sit inside the card */
const AT02: V3 = [0, 0.98, -0.55]
const FOV02 = 33
const HX = [-1.02, 1.02] as const /* a clear gap between the two gables */
const HZ = -0.6
const HW = 1.66
const HD = 1.2
const HH = 1.5
const BACK = HZ - HD / 2
const T02 = { full: [0.4, 0.85, 1.3, 1.75, 2.2, 2.65, 3.1], basic: [0.4, 1.3, 2.2], lower: [4.1, 4.9] as const, release: [5.0, 5.5] as const, gesture: [4.3, 4.85, 7.4, 7.95] as const, point: [4.9, 5.4, 7.6, 8.1] as const, clear: [8.7, 9.0] as const, back: [8.7, 9.0] as const, boxOut: [8.7, 8.85] as const, boxIn: [8.85, 9.0] as const }
/** an item's size over the loop: pops in at a, clears at the end */
const itemK = (c: number, a: number) => life(c, a, T02.clear[0], T02.clear[1])

/** a cut-away house: floor, back and side walls, a gable roof; the front is open to the camera */
function house(scene: THREE.Scene, x0: number, wall: string, roof: string, floorCol: string) {
  const wm = mat(wall, { roughness: 0.9 })
  scene.add(box(HW, 0.06, HD, mat(floorCol, { roughness: 0.7 }), [x0, 0.03, HZ], 0.01))
  scene.add(box(HW, HH, 0.06, wm, [x0, HH / 2 + 0.06, BACK + 0.03]))
  for (const s of [-1, 1]) scene.add(box(0.06, HH, HD, wm, [x0 + s * (HW / 2 - 0.03), HH / 2 + 0.06, HZ]))
  /* the gable: a triangular prism over the walls, its front face toward the camera */
  const sh = new THREE.Shape()
  sh.moveTo(-HW / 2 - 0.1, 0)
  sh.lineTo(HW / 2 + 0.1, 0)
  sh.lineTo(0, 0.52)
  sh.closePath()
  const geo = new THREE.ExtrudeGeometry(sh, { depth: HD + 0.12, bevelEnabled: false })
  const r = mesh(geo, mat(roof, { roughness: 0.6 }), [x0, HH + 0.06, BACK - 0.06])
  scene.add(r)
  /* a white fascia under the gable and a front trim on the walls */
  scene.add(flat(box(HW + 0.2, 0.05, 0.05, mat('#FFFFFF', { roughness: 0.5 }), [x0, HH + 0.06, HZ + HD / 2 + 0.06])))
  /* a round window in the gable */
  const ring = flat(cyl(0.09, 0.09, 0.02, mat('#FFFFFF'), [x0, HH + 0.24, HZ + HD / 2 + 0.065], 32))
  ring.rotation.x = Math.PI / 2
  scene.add(ring)
  const win = flat(cyl(0.065, 0.065, 0.02, mat('#BFE0F5', { emissive: new THREE.Color('#CFE8FA'), emissiveIntensity: 0.5 }), [x0, HH + 0.24, HZ + HD / 2 + 0.075], 32))
  win.rotation.x = Math.PI / 2
  scene.add(win)
}

/* --- furniture, each a group with its pivot on the floor (scaled from there as it arrives) --- */
function sofa() {
  const g = new THREE.Group()
  const m = mat('#3B6FF0', { roughness: 0.75 })
  const c = mat('#5E8BF5', { roughness: 0.8 })
  g.add(box(0.66, 0.16, 0.28, m, [0, 0.12, 0], 0.03))
  g.add(box(0.66, 0.26, 0.08, m, [0, 0.27, -0.11], 0.03))
  for (const s of [-1, 1]) g.add(box(0.07, 0.24, 0.28, m, [s * 0.33, 0.16, 0], 0.03))
  for (const s of [-1, 1]) g.add(box(0.27, 0.06, 0.22, c, [s * 0.145, 0.22, 0.02], 0.025))
  g.add(box(0.12, 0.12, 0.04, mat('#F2A93B', { roughness: 0.8 }), [-0.2, 0.3, -0.05], 0.02))
  return g
}
function tv() {
  const g = new THREE.Group()
  g.add(box(0.46, 0.2, 0.2, mat('#8C6440', { roughness: 0.5 }), [0, 0.1, 0], 0.015))
  g.add(box(0.44, 0.27, 0.025, mat('#1B1F2E', { roughness: 0.3 }), [0, 0.38, -0.04], 0.01))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.23), new THREE.MeshBasicMaterial({ map: screenTex(), toneMapped: false }))
  scr.position.set(0, 0.38, -0.026)
  g.add(scr)
  g.add(box(0.06, 0.03, 0.06, mat('#1B1F2E'), [0, 0.215, -0.04]))
  return g
}
const screenTex = () =>
  canvasTex(160, 92, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 92)
    gr.addColorStop(0, '#7FB2FF')
    gr.addColorStop(1, '#2D63FB')
    g.fillStyle = gr
    g.fillRect(0, 0, 160, 92)
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.beginPath()
    g.moveTo(0, 92)
    g.lineTo(46, 46)
    g.lineTo(80, 70)
    g.lineTo(112, 38)
    g.lineTo(160, 92)
    g.fill()
    g.fillStyle = '#FFE08A'
    g.beginPath()
    g.arc(124, 22, 10, 0, TAU)
    g.fill()
  })
function lamp() {
  const g = new THREE.Group()
  g.add(cyl(0.07, 0.08, 0.02, mat('#2C3545'), [0, 0.01, 0], 24))
  g.add(cyl(0.012, 0.012, 0.7, mat('#2C3545'), [0, 0.36, 0], 10))
  g.add(cyl(0.07, 0.12, 0.15, mat('#FFE7B0', { emissive: new THREE.Color('#FFD27A'), emissiveIntensity: 0.55, roughness: 0.6 }), [0, 0.76, 0], 28))
  return g
}
function shelf() {
  const g = new THREE.Group()
  const wood = mat('#B5835A', { roughness: 0.55 })
  g.add(box(0.38, 0.66, 0.03, wood, [0, 0.33, -0.08]))
  for (const s of [-1, 1]) g.add(box(0.025, 0.66, 0.18, wood, [s * 0.18, 0.33, 0]))
  for (const y of [0.02, 0.23, 0.44, 0.65]) g.add(box(0.38, 0.025, 0.18, wood, [0, y, 0]))
  const cols = ['#2D63FB', '#F2A93B', '#14B8A6', '#E4578F', '#8B5CF6', '#3B6FF0', '#FF8A3D']
  let i = 0
  for (const y of [0.035, 0.245, 0.455]) {
    let x = -0.15
    for (let k = 0; k < 5; k++) {
      const w = 0.035 + ((i * 7) % 3) * 0.01
      const h = 0.14 + ((i * 5) % 4) * 0.012
      g.add(box(w, h, 0.13, mat(cols[i % cols.length], { roughness: 0.6 }), [x + w / 2, y + h / 2 + 0.012, 0.0], 0.004))
      x += w + 0.012
      i++
    }
  }
  return g
}
const paintingTex = () =>
  canvasTex(120, 88, (g) => {
    g.fillStyle = '#DDEBFF'
    g.fillRect(0, 0, 120, 88)
    g.fillStyle = '#14B8A6'
    g.beginPath()
    g.moveTo(0, 88)
    g.lineTo(40, 40)
    g.lineTo(70, 66)
    g.lineTo(92, 46)
    g.lineTo(120, 88)
    g.fill()
    g.fillStyle = '#F2A93B'
    g.beginPath()
    g.arc(30, 24, 9, 0, TAU)
    g.fill()
  })
function painting() {
  const g = new THREE.Group()
  g.add(box(0.32, 0.24, 0.02, mat('#C49A6C', { roughness: 0.5 }), [0, 0, 0], 0.005))
  g.add(picture(paintingTex(), 0.27, 0.19, [0, 0, 0.012], { transparent: false }))
  return g
}
function plant() {
  const g = new THREE.Group()
  g.add(cyl(0.07, 0.055, 0.14, mat('#E4E8F0', { roughness: 0.4 }), [0, 0.07, 0], 24))
  const leaf = mat('#22A866', { roughness: 0.6 })
  for (const [x, y, z, r] of [[0, 0.24, 0, 0.08], [-0.06, 0.2, 0.02, 0.06], [0.06, 0.21, -0.01, 0.065], [0.01, 0.31, 0.01, 0.055]] as const) g.add(sphere(r, leaf, [x, y, z]))
  return g
}
const rugTex = () =>
  canvasTex(160, 90, (g) => {
    rr(g, 0, 0, 160, 90, 14, '#F2A93B')
    rr(g, 10, 10, 140, 70, 10, '#FFD9A0')
    g.strokeStyle = '#E4578F'
    g.lineWidth = 4
    g.beginPath()
    g.roundRect(22, 22, 116, 46, 8)
    g.stroke()
  })
function rug() {
  const g = new THREE.Group()
  const r = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.48), new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 0.9 }))
  r.rotation.x = -Math.PI / 2
  r.position.y = 0.064
  r.receiveShadow = true
  g.add(r)
  return g
}
function bed() {
  const g = new THREE.Group()
  const wood = mat('#B5835A', { roughness: 0.55 })
  g.add(box(0.6, 0.12, 0.44, wood, [0, 0.1, 0], 0.02))
  g.add(box(0.6, 0.3, 0.04, wood, [0, 0.2, -0.22], 0.015))
  g.add(box(0.56, 0.07, 0.4, mat('#FFFFFF', { roughness: 0.8 }), [0, 0.19, 0.01], 0.03))
  g.add(box(0.56, 0.045, 0.26, mat('#9FB8F0', { roughness: 0.85 }), [0, 0.235, 0.08], 0.02))
  g.add(box(0.22, 0.06, 0.1, mat('#F4F6FA', { roughness: 0.8 }), [0, 0.25, -0.14], 0.03))
  return g
}
function smallTable(w: number, d: number, h: number) {
  const g = new THREE.Group()
  const wood = mat('#C49A6C', { roughness: 0.5 })
  g.add(box(w, 0.035, d, wood, [0, h - 0.018, 0], 0.008))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.03, h - 0.035, 0.03, mat('#8C6440'), [sx * (w / 2 - 0.035), (h - 0.035) / 2, sz * (d / 2 - 0.035)]))
  return g
}
function chair() {
  const g = new THREE.Group()
  const wood = mat('#8C6440', { roughness: 0.55 })
  g.add(box(0.2, 0.025, 0.2, wood, [0, 0.27, 0], 0.006))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.022, 0.27, 0.022, wood, [sx * 0.085, 0.135, sz * 0.085]))
  g.add(box(0.025, 0.24, 0.2, wood, [0.09, 0.4, 0], 0.006))
  return g
}
function cardboard(w: number, h: number, d: number) {
  const g = new THREE.Group()
  g.add(box(w, h, d, mat('#C99A5B', { roughness: 0.85 }), [0, 0, 0], 0.008))
  g.add(flat(box(w + 0.004, 0.012, 0.035, mat('#E9D3A6', { roughness: 0.6 }), [0, h / 2 - 0.004, 0])))
  g.add(flat(box(0.035, h * 0.6, 0.004, mat('#E9D3A6', { roughness: 0.6 }), [0, h * 0.2, d / 2 + 0.001])))
  return g
}

function groundAndSky(scene: THREE.Scene, sky: string, ground: string) {
  scene.background = new THREE.Color(sky)
  scene.add(floorPlane(14, 10, mat(ground, { roughness: 0.95 }), [0, 0, 0.5]))
}

function setupT02Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  groundAndSky(scene, '#E8F1FC', '#D8EBCB')
  setCam(camera, CAM02, AT02, FOV02)
  lights(scene, [0, 0.9, -0.6], 2.0, 4)
  /* a path to each door, and a low hedge behind */
  for (const x of HX) scene.add(flat(box(0.5, 0.004, 1.2, mat('#EFE6D6', { roughness: 0.9 }), [x, 0.002, HZ + HD / 2 + 0.6])))
  scene.add(flat(box(9, 0.22, 0.2, mat('#7CC48A', { roughness: 0.9 }), [0, 0.11, BACK - 0.55], 0.08)))
  house(scene, HX[0], '#FFF6E8', '#E4578F', '#E2CDAE')
  house(scene, HX[1], '#F3F5FA', '#3B6FF0', '#DCD6CC')

  /* the furnished house: seven facilities, each arriving in turn */
  const fx = HX[0]
  const full: THREE.Object3D[] = []
  const put = (o: THREE.Object3D, x: number, y: number, z: number, ry = 0) => {
    o.position.set(x, y, z)
    o.rotation.y = ry
    o.visible = false
    scene.add(o)
    full.push(o)
  }
  put(rug(), fx + 0.02, 0, HZ + 0.05)
  put(sofa(), fx - 0.22, 0.06, BACK + 0.22)
  put(tv(), fx + 0.5, 0.06, BACK + 0.16)
  put(lamp(), fx - 0.66, 0.06, BACK + 0.16)
  put(shelf(), fx - 0.66, 0.06, HZ + 0.12, Math.PI / 2)
  put(painting(), fx - 0.22, 1.0, BACK + 0.075)
  put(plant(), fx + 0.66, 0.06, HZ + 0.4)
  const lampGlow = halo('rgba(255,210,122,0.9)', 0.5)
  lampGlow.position.set(fx - 0.66, 0.88, BACK + 0.2)
  scene.add(lampGlow)

  /* the basic house: the essentials only */
  const bx = HX[1]
  const basic: THREE.Object3D[] = []
  const put2 = (o: THREE.Object3D, x: number, y: number, z: number, ry = 0) => {
    o.position.set(x, y, z)
    o.rotation.y = ry
    o.visible = false
    scene.add(o)
    basic.push(o)
  }
  const CARRIER: V3 = [bx - 0.12, 0, HZ + 0.36]
  const TABLE = { x: CARRIER[0] + 0.32, z: HZ + 0.08, h: 0.5, w: 0.36, d: 0.3 }
  put2(bed(), bx - 0.36, 0.06, BACK + 0.28)
  put2(smallTable(TABLE.w, TABLE.d, TABLE.h), TABLE.x, 0.06, TABLE.z)
  put2(chair(), TABLE.x + 0.04, 0.06, TABLE.z - 0.3, -Math.PI / 2)

  /* the one box: carried in front of him, then set on the table */
  const BOX = { w: 0.2, h: 0.15, d: 0.16 }
  const cbox = cardboard(BOX.w, BOX.h, BOX.d)
  scene.add(cbox)
  const carryAt = new THREE.Vector3(CARRIER[0], 0.64, CARRIER[2] + 0.14)
  const placeAt = new THREE.Vector3(TABLE.x, 0.06 + TABLE.h + BOX.h / 2, TABLE.z)
  const boxAt = (c: number, out: THREE.Vector3) => out.lerpVectors(carryAt, placeAt, seg(c, T02.lower[0], T02.lower[1]))

  /* the people */
  const settler = body(who(CAST_PRESETS.meera, { name: 'Homeowner', gender: 'female', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'kurta', topColor: '#14B8A6', bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#6B4A33' }, accessories: { earrings: true, glasses: 'none', bindi: true } }), [fx + 0.2, 0.06, HZ + 0.42], 1.3)
  const carrier = body(who(CAST_PRESETS.kabir, { name: 'Mover', gender: 'male', skinTone: 'wheatish', hair: { style: 'short', color: 'black' }, outfit: { top: 'tshirt', topColor: '#F2A93B', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#1F2433' }, accessories: { beard: 'stubble', glasses: 'none', watch: true } }), [CARRIER[0], 0.06, CARRIER[2]], 1.32)
  const HB = devHold(HOLD02)
  /* she looks at each piece as it arrives: the item's side of her (screen x) gives the turn */
  const lookAtX = [fx + 0.02, fx - 0.22, fx + 0.5, fx - 0.66, fx - 0.66, fx - 0.22, fx + 0.66].map((x) => Math.max(-1, Math.min(1, (x - settler.root.x) / 0.6)))
  const present: { s: number; e: number } = { s: 62, e: 18 }
  const sPose = (p: Pose, c: number) => {
    T02.full.forEach((a, i) => {
      const w = hold(c, a - 0.15, a + 0.1, a + 0.35, a + 0.5)
      to(p, 'headTurn', lookAtX[i] * 0.5, w)
      to(p, 'lookX', lookAtX[i] * 0.9, w)
    })
    const g = hold(c, T02.gesture[0], T02.gesture[1], T02.gesture[2], T02.gesture[3])
    setArms(p, mixArm(REST, present, g), REST)
    openHand(p, g, 'L')
    to(p, 'headTurn', -0.25, g)
    to(p, 'lookX', -0.5, g)
    talk(p, c, hold(c, 4.9, 5.0, 6.0, 6.1))
  }
  const hx = BOX.w / 2 + 0.025
  const tmp = new THREE.Vector3()
  const boxArms = (c: number): [Arm, Arm] => {
    boxAt(c, tmp)
    const l = reach(carrier, 'L', tmp.clone().add(new THREE.Vector3(-hx, 0, 0)), camera)
    const r = reach(carrier, 'R', tmp.clone().add(new THREE.Vector3(hx, 0, 0)), camera)
    return [l, r]
  }
  const carryArms = boxArms(0)
  const cPose = (p: Pose, c: number) => {
    const [l, r] = boxArms(Math.min(c, T02.release[0]))
    const rel = seg(c, T02.release[0], T02.release[1])
    const back = seg(c, T02.back[0], T02.back[1])
    const L = c >= T02.back[0] ? mixArm(REST, carryArms[0], back) : mixArm(l, REST, rel)
    const R = c >= T02.back[0] ? mixArm(REST, carryArms[1], back) : mixArm(r, REST, rel)
    setArms(p, L, R)
    for (const s of ['L', 'R'] as const) {
      const grip = c < T02.release[0] ? 1 : c >= T02.back[0] ? back : 1 - rel
      to(p, `f${s}1` as keyof Pose, 0.55, grip)
      to(p, `f${s}2` as keyof Pose, 0.6, grip)
      to(p, `f${s}3` as keyof Pose, 0.65, grip)
      to(p, `f${s}4` as keyof Pose, 0.7, grip)
    }
    /* looks round his room as it fills, then down at the box he sets down */
    T02.basic.forEach((a, i) => {
      const dx = i === 0 ? -0.6 : 0.6
      const w = hold(c, a - 0.15, a + 0.1, a + 0.4, a + 0.55)
      to(p, 'headTurn', dx * 0.6, w)
      to(p, 'lookX', dx, w)
    })
    const down = hold(c, T02.lower[0] - 0.2, T02.lower[0], T02.lower[1], T02.release[1])
    to(p, 'headTurn', 0.35, down)
    to(p, 'lookX', 0.7, down)
    to(p, 'lookY', 0.5, down)
    to(p, 'headNod', 0.15, down)
  }
  const people: Sprite[] = []
  const add = (b: Body, seed: number, faces: [number, string][], pose: (p: Pose, c: number) => void) => {
    const sp = person({ config: b.cfg, seed, faces, pose, loop: L02, height: b.h, frames: F02, redraw, holdT: HB })
    sp.object.position.copy(b.root)
    scene.add(sp.object)
    people.push(sp)
  }
  add(settler, 1901, [[0, 'neutral'], [0.35, 'surprised'], [1.6, 'happy'], [T02.gesture[0], 'excited'], [7.9, 'happy'], [8.6, 'neutral']], sPose)
  add(carrier, 1902, [[0, 'neutral'], [0.6, 'happy'], [T02.lower[0] - 0.2, 'thinking'], [T02.release[0], 'proud'], [7.9, 'happy'], [8.6, 'neutral']], cPose)
  const clk = slideClock('S19T02', scene, HB, people)
  return (t: number) => {
    const c = mod(clk.time(t), L02)
    const cq = frameT(c, L02, F02)
    people.forEach((sp) => sp.update(c, camera))
    full.forEach((o, i) => setScale(o, itemK(c, T02.full[i])))
    basic.forEach((o, i) => setScale(o, itemK(c, T02.basic[i])))
    setOp(lampGlow, 0.5 * itemK(c, T02.full[3]) * (0.85 + 0.15 * Math.sin(c * TAU * 0.5)))
    lampGlow.quaternion.copy(camera.quaternion)
    /* the box follows the frame he is drawn in */
    if (cq < T02.clear[0]) {
      boxAt(Math.min(cq, T02.lower[1]), cbox.position)
      setScale(cbox, 1)
    } else if (cq < T02.boxIn[0]) {
      cbox.position.copy(placeAt)
      setScale(cbox, 1 - seg(cq, T02.boxOut[0], T02.boxOut[1]))
    } else {
      cbox.position.copy(carryAt)
      setScale(cbox, seg(cq, T02.boxIn[0], T02.boxIn[1]))
    }
  }
}

/* ------------------------------------------------------------------ T02 concept: a full image stack and a slim one */

const FULL_GLYPHS: Glyph[] = ['os', 'terminal', 'pencil', 'gear', 'package', 'chart', 'search']
const FULL_COLS = ['#1F3F99', '#2449B8', '#2D63FB', '#3B6FF0', '#4E83F5', '#6B98F7', '#86ACF8']
const SLIM_GLYPHS: Glyph[] = ['os', 'bolt', 'lib']
const SLIM_COLS = ['#0E8C7F', '#14B8A6', '#3CC7B7']
const LH = 0.16
const LG = 0.018

function setupT02Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  groundAndSky(scene, '#EEF3FC', '#E9EFF9')
  /* closer than the houses' camera: the stacks fill the card as the houses do */
  setCam(camera, [0.12, 1.42, 4.35], [0.12, 0.72, -0.55], 30)
  lights(scene, [0, 0.9, -0.6], 2.0, 4)
  const TX = -0.7
  const SX = 0.5
  plinth(scene, TX, HZ, 0.56)
  plinth(scene, SX, HZ, 0.48)
  const layer = (i: number, n: number, x: number, w: number, d: number, col: string, gl: Glyph) => {
    const o = block(w, LH, d, col, gl, 0.62)
    o.position.set(x, 0.075 + i * (LH + LG), HZ)
    o.visible = false
    scene.add(o)
    return o
  }
  const tall = FULL_GLYPHS.map((g, i) => layer(i, 7, TX, 0.9, 0.6, FULL_COLS[i], g))
  const slim = SLIM_GLYPHS.map((g, i) => layer(i, 3, SX, 0.72, 0.5, SLIM_COLS[i], g))
  /* the app block: drops onto the slim stack when the box goes on the table */
  const app = block(0.34, 0.22, 0.28, '#F2A93B', 'app', 0.66)
  scene.add(app)
  const appTop = 0.075 + 2 * (LH + LG) + LH
  const appFrom = appTop + 0.55
  const glow = halo('rgba(20,184,166,0.55)', 0.9)
  glow.position.set(SX, 0.08, HZ - 0.35)
  scene.add(glow)

  const dev = body(who(CAST_PRESETS.dev, { name: 'Developer', gender: 'male', skinTone: 'dusky', hair: { style: 'curly', color: 'black' }, outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2C3545', shoeColor: '#1F2433' }, accessories: { glasses: 'rect', beard: 'none', watch: false } }), [1.16, 0, HZ + 0.25], 1.32)
  const HB = devHold(HOLD02)
  const target = new THREE.Vector3(SX + 0.1, appTop + 0.05, HZ)
  const pointArm = reach(dev, 'L', target, camera)
  const dPose = (p: Pose, c: number) => {
    /* watches the stacks grow: the tall one, then the slim one */
    const watch = hold(c, 0.3, 0.6, 3.4, 3.8)
    to(p, 'headTurn', -0.55, watch)
    to(p, 'lookX', -1, watch)
    const drop = hold(c, T02.lower[0] - 0.2, T02.lower[0], T02.lower[1], T02.point[1])
    to(p, 'headTurn', -0.4, drop)
    to(p, 'lookX', -0.8, drop)
    to(p, 'lookY', 0.25, drop)
    const pt = hold(c, T02.point[0], T02.point[1], T02.point[2], T02.point[3])
    setArms(p, mixArm(REST, pointArm, pt), REST)
    pointHand(p, pt, 'L')
    to(p, 'headTurn', -0.35, pt)
    to(p, 'lookX', -0.7, pt)
    to(p, 'lookY', 0.2, pt)
  }
  const sp = person({ config: dev.cfg, seed: 1903, faces: [[0, 'neutral'], [0.5, 'thinking'], [T02.lower[1], 'happy'], [T02.point[1], 'proud'], [8.0, 'happy'], [8.6, 'neutral']], pose: dPose, loop: L02, height: dev.h, frames: F02, redraw, holdT: HB })
  sp.object.position.copy(dev.root)
  scene.add(sp.object)
  const clk = slideClock('S19T02', scene, HB, [sp])
  return (t: number) => {
    const c = mod(clk.time(t), L02)
    sp.update(c, camera)
    tall.forEach((o, i) => setScale(o, itemK(c, T02.full[i])))
    slim.forEach((o, i) => setScale(o, itemK(c, T02.basic[i])))
    const k = seg(c, T02.lower[0], T02.lower[1])
    const out = 1 - seg(c, T02.clear[0], T02.clear[1])
    app.position.set(SX, lerp(appFrom, appTop, k * k), HZ)
    setScale(app, c < T02.lower[0] - 0.25 ? 0 : seg(c, T02.lower[0] - 0.25, T02.lower[0] + 0.05) * out)
    const lit = hold(c, T02.lower[1], T02.lower[1] + 0.3, T02.clear[0], T02.clear[1])
    setOp(glow, 0.3 * lit * (0.8 + 0.2 * Math.sin(c * TAU * 0.6)))
    glow.quaternion.copy(camera.quaternion)
  }
}

/* ================================================================== T09 · packing for a short trip / minimal image */

const L09 = 9
const F09 = 108
const HOLD09 = 7.1 /* all three items in the bag, the lid shut, the wardrobe still full */
const CAM09: V3 = [-0.62, 1.5, 3.55]
const AT09: V3 = [-0.62, 0.86, -0.7]
const FOV09 = 34
const WALL09 = -1.35
const RACK = { x: -1.0, z: -1.02, w: 0.84, d: 0.34, h: 1.86 }
const PACKER: V3 = [-0.1, 0, -0.62]
const BAG = { x: -0.57, z: -0.3, w: 0.42, h: 0.2, d: 0.3, bench: 0.56 }
/* item k: picked at a, in the hand a+0.5 .. a+1.05, in the bag after */
const T09 = { a: [0.5, 2.4, 4.3], pick: 0.5, carry: 1.05, rest: 1.45, lid: [6.0, 6.6] as const, open: [8.7, 9.0] as const, gone: [8.7, 8.85] as const, back: [8.85, 9.0] as const }
/* where each item waits on the rack (the right column) and where it lies in the bag */
/* each resting ON its shelf board (board top = shelf y + 0.0125), clear of the posts, the piles and each other */
const HOME: V3[] = [[-0.715, 1.283, -0.92], [-0.715, 1.013, -1.0], [-0.775, 1.013, -0.9]]
/* three separate places inside the bag, none touching */
const SLOT: V3[] = [[BAG.x - 0.105, 0, BAG.z], [BAG.x + 0.09, 0, BAG.z + 0.075], [BAG.x + 0.035, 0, BAG.z - 0.055]]
const bagTop = BAG.bench + BAG.h

/** a hard-shell cabin bag (or a container image) open on its bench: body, inner lining, a lid hinged at the back */
function caseOpen(scene: THREE.Scene, kind: 'bag' | 'container') {
  const shell = kind === 'bag' ? mat('#14B8A6', { roughness: 0.35 }) : mat('#2D63FB', { roughness: 0.4, metalness: 0.1 })
  const g = new THREE.Group()
  g.position.set(BAG.x, BAG.bench, BAG.z)
  g.add(box(BAG.w, BAG.h, BAG.d, shell, [0, BAG.h / 2, 0], 0.03))
  g.add(flat(box(BAG.w - 0.04, 0.006, BAG.d - 0.04, mat(kind === 'bag' ? '#2C3545' : '#16245A', { roughness: 0.9 }), [0, BAG.h + 0.001, 0])))
  if (kind === 'container') {
    /* the ribs of a shipping container on its front, and corner posts */
    for (let i = -4; i <= 4; i++) g.add(flat(box(0.012, BAG.h - 0.05, 0.006, mat('#1F4FD6', { roughness: 0.5 }), [i * 0.042, BAG.h / 2, BAG.d / 2 + 0.002])))
    for (const sx of [-1, 1]) g.add(box(0.03, BAG.h + 0.004, 0.03, mat('#163DB0'), [sx * (BAG.w / 2 - 0.012), BAG.h / 2, BAG.d / 2 - 0.012], 0.006))
  } else {
    g.add(flat(box(0.06, 0.012, 0.006, mat('#0E8C7F'), [0, BAG.h - 0.04, BAG.d / 2 + 0.003])))
    for (const sx of [-1, 1]) g.add(cyl(0.018, 0.018, 0.02, mat('#2C3545'), [sx * (BAG.w / 2 - 0.05), -0.01, BAG.d / 2 - 0.05], 16))
  }
  /* the lid is hinged along the BACK edge: open, it lies back on the bench behind the bag, so it never covers the
     wardrobe / rack (and the items waiting there) */
  const hinge = new THREE.Group()
  hinge.position.set(0, BAG.h, -BAG.d / 2)
  const lid = box(BAG.w, 0.12, BAG.d, shell, [0, 0.06, BAG.d / 2], 0.03)
  hinge.add(lid)
  hinge.add(flat(box(BAG.w - 0.04, 0.006, BAG.d - 0.04, mat(kind === 'bag' ? '#2C3545' : '#16245A', { roughness: 0.9 }), [0, -0.002, BAG.d / 2])))
  if (kind === 'bag') hinge.add(box(0.12, 0.025, 0.03, mat('#2C3545'), [0, 0.06, BAG.d + 0.012], 0.01))
  else for (let i = -4; i <= 4; i++) hinge.add(flat(box(0.012, 0.006, BAG.d - 0.05, mat('#1F4FD6'), [i * 0.042, 0.121, BAG.d / 2])))
  g.add(hinge)
  scene.add(g)
  /* the bench under it */
  const bench = new THREE.Group()
  /* deep enough for the open lid lying behind the bag */
  const BD = 2 * BAG.d + 0.08
  const BZ = BAG.d / 2 + 0.04 - BD / 2 /* front edge 0.04 ahead of the bag, back edge under the open lid tip */
  bench.add(box(BAG.w + 0.1, 0.05, BD, mat(kind === 'bag' ? '#C49A6C' : '#E4E8F0', { roughness: 0.5 }), [0, BAG.bench - 0.025, BZ], 0.01))
  for (const sx of [-1, 1]) bench.add(box(0.04, BAG.bench - 0.05, BD - 0.06, mat(kind === 'bag' ? '#8C6440' : '#AEB8CC'), [sx * (BAG.w / 2 + 0.01), (BAG.bench - 0.05) / 2, BZ]))
  bench.position.set(BAG.x, 0, BAG.z)
  scene.add(bench)
  /* lid angle: open = flipped back past flat until its far edge rests on the bench; closed lies flat on the body */
  const OPEN = -(Math.PI + 0.27)
  return (k: number) => (hinge.rotation.x = lerp(OPEN, 0, k))
}

/** the wardrobe / rack frame: an open two-column unit; returns the shelf heights of the right column */
function rack(scene: THREE.Scene, wood: THREE.Material, back: THREE.Material) {
  const { x, z, w, d, h } = RACK
  const t = 0.035
  scene.add(box(w, h, 0.02, back, [x, h / 2, z - d / 2 + 0.01]))
  for (const s of [-1, 1]) scene.add(box(t, h, d, wood, [x + s * (w / 2 - t / 2), h / 2, z]))
  scene.add(box(w, t, d, wood, [x, h - t / 2, z]))
  scene.add(box(w, t, d, wood, [x, 0.06, z]))
  scene.add(box(t, h - 0.1, d, wood, [x, h / 2, z]))
  for (const y of [0.42, 0.72, 1.0, 1.27]) scene.add(box(w / 2 - t, 0.025, d, wood, [x + w / 4, y, z]))
  return { left: x - w / 4, right: x + w / 4 }
}

/** the pick-and-pack choreography both cards share: one person at PACKER moves three items from HOME to SLOT */
function packer(kit: StageKit, cfg: CharacterConfig, seed: number, items: THREE.Object3D[], setLid: (k: number) => void, key: string, faces: [number, string][]) {
  const { scene, camera, redraw } = kit
  const pb = body(cfg, PACKER, 1.48)
  const HB = devHold(HOLD09)
  const home = HOME.map((p) => v3(p))
  const slot = SLOT.map((p) => new THREE.Vector3(p[0], bagTop + 0.004, p[2]))
  const pickArm = home.map((p) => reach(pb, 'L', p, camera))
  const dropArm = slot.map((p) => reach(pb, 'L', p.clone().setY(p.y + 0.03), camera))
  const armOf = (c: number): Arm => {
    for (let k = 0; k < 3; k++) {
      const a = T09.a[k]
      if (c >= a - 0.05 && c < a + T09.rest + 0.4) {
        if (c < a + T09.pick) return mixArm(REST, pickArm[k], seg(c, a, a + T09.pick - 0.05))
        if (c < a + T09.carry) return mixArm(pickArm[k], dropArm[k], seg(c, a + T09.pick, a + T09.carry))
        return mixArm(dropArm[k], REST, seg(c, a + T09.carry + 0.05, a + T09.rest))
      }
    }
    return REST
  }
  const pose = (p: Pose, c: number) => {
    setArms(p, armOf(c), REST)
    /* fingers close on the item between pick and drop */
    let g = 0
    for (const a of T09.a) g = Math.max(g, hold(c, a + T09.pick - 0.12, a + T09.pick, a + T09.carry, a + T09.carry + 0.1))
    to(p, 'fL1', 0.6, g)
    to(p, 'fL2', 0.65, g)
    to(p, 'fL3', 0.7, g)
    to(p, 'fL4', 0.75, g)
    /* looks at the rack while picking, down at the bag while packing, at the shut bag after */
    for (const a of T09.a) {
      const up = hold(c, a - 0.1, a + 0.15, a + T09.pick - 0.05, a + T09.pick + 0.15)
      to(p, 'headTurn', -0.55, up)
      to(p, 'lookX', -1, up)
      to(p, 'lookY', -0.2, up)
      const dn = hold(c, a + T09.pick + 0.05, a + T09.pick + 0.25, a + T09.rest - 0.1, a + T09.rest + 0.15)
      to(p, 'headTurn', -0.45, dn)
      to(p, 'lookX', -0.9, dn)
      to(p, 'lookY', 0.55, dn)
      to(p, 'headNod', 0.12, dn)
    }
    const lid = hold(c, T09.lid[0] - 0.1, T09.lid[0] + 0.1, 7.6, 8.0)
    to(p, 'headTurn', -0.3, lid)
    to(p, 'lookX', -0.6, lid)
    to(p, 'lookY', 0.35, lid)
  }
  const sp = person({ config: pb.cfg, seed, faces, pose, loop: L09, height: pb.h, frames: F09, redraw, holdT: HB })
  sp.object.position.copy(pb.root)
  scene.add(sp.object)
  const clk = slideClock(key, scene, HB, [sp])
  const hand = new THREE.Vector3()
  items.forEach((o) => scene.add(o))
  return (t: number) => {
    const c = mod(clk.time(t), L09)
    const cq = frameT(c, L09, F09)
    sp.update(c, camera)
    items.forEach((o, k) => {
      const a = T09.a[k]
      if (cq < a + T09.pick - 0.04 || cq >= T09.back[0]) {
        /* on the rack (fading back in at the loop's end) */
        o.position.copy(home[k])
        setScale(o, cq >= T09.back[0] ? seg(cq, T09.back[0], T09.back[1]) : 1)
      } else if (cq < a + T09.carry) {
        /* in the hand: just behind the hand's plane, so the fingers are drawn over it */
        handWorld('L', pb.sh, armOf(cq), pb.h, pb.root, camera, hand, -0.035)
        o.position.copy(hand)
        o.position.y -= 0.02
        setScale(o, 1)
      } else {
        o.position.copy(slot[k])
        setScale(o, 1 - seg(cq, T09.gone[0], T09.gone[1]))
      }
    })
    setLid(hold(c, T09.lid[0], T09.lid[1], T09.open[0], T09.open[1]))
  }
}

/* --- the traveller's three items, pivot at the base --- */
function foldedShirt() {
  const g = new THREE.Group()
  g.add(box(0.19, 0.045, 0.14, mat('#3B6FF0', { roughness: 0.85 }), [0, 0.0225, 0], 0.012))
  g.add(flat(box(0.07, 0.014, 0.04, mat('#5E8BF5', { roughness: 0.85 }), [0, 0.05, -0.045], 0.005)))
  return g
}
function toothbrush() {
  const g = new THREE.Group()
  g.add(box(0.19, 0.022, 0.028, mat('#E4578F', { roughness: 0.4 }), [0, 0.011, 0], 0.009))
  g.add(box(0.05, 0.03, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0.07, 0.035, 0], 0.006))
  return g
}
function charger() {
  const g = new THREE.Group()
  g.add(box(0.085, 0.065, 0.07, mat('#F7F8FB', { roughness: 0.35 }), [0, 0.0325, 0], 0.01))
  const cable = cyl(0.008, 0.008, 0.12, mat('#E4E8F0'), [0.1, 0.014, 0], 8)
  cable.rotation.z = Math.PI / 2
  g.add(cable)
  for (const s of [-1, 1]) g.add(box(0.03, 0.008, 0.01, mat('#B7C1CF', { metalness: 0.6 }), [-0.055, 0.032, s * 0.014]))
  return g
}
/* a hanging shirt on a hanger */
function hanging(col: string) {
  const g = new THREE.Group()
  g.add(box(0.15, 0.4, 0.04, mat(col, { roughness: 0.85 }), [0, -0.24, 0], 0.015))
  g.add(box(0.2, 0.08, 0.04, mat(col, { roughness: 0.85 }), [0, -0.08, 0], 0.02))
  g.add(cyl(0.006, 0.006, 0.04, mat('#8C96A8'), [0, -0.02, 0], 8))
  return g
}
function pile(cols: string[]) {
  const g = new THREE.Group()
  cols.forEach((c, i) => g.add(box(0.15, 0.03, 0.12, mat(c, { roughness: 0.85 }), [((i * 13) % 5) * 0.004 - 0.008, 0.017 + i * 0.032, 0], 0.008)))
  return g
}

function setupT09Everyday(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#F2EEE8')
  setCam(camera, CAM09, AT09, FOV09)
  lights(scene, [-0.6, 0.9, -0.8], 2.0, 4)
  room(scene, { wall: '#EAF0FA', floor: plankTex('#E2CDAE', '#CDB38E', [8, 6]), trim: '#B9A386', wallZ: WALL09 })
  /* a window on the back wall to the right */
  scene.add(flat(box(0.62, 0.78, 0.03, mat('#FFFFFF', { roughness: 0.5 }), [0.35, 1.45, WALL09 + 0.02], 0.01)))
  scene.add(flat(box(0.54, 0.7, 0.01, mat('#BFE0F5', { roughness: 0.2, emissive: new THREE.Color('#CFE8FA'), emissiveIntensity: 0.6 }), [0.35, 1.45, WALL09 + 0.04])))
  scene.add(flat(box(0.02, 0.7, 0.015, mat('#FFFFFF'), [0.35, 1.45, WALL09 + 0.05])))
  /* the wardrobe, full: shirts on the rail, folded piles, shoes */
  const wood = mat('#B5835A', { roughness: 0.55 })
  const { left, right } = rack(scene, wood, mat('#E9DCC8', { roughness: 0.8 }))
  const inL = RACK.x - RACK.w / 2 + 0.035
  const inR = RACK.x - 0.0175
  const rail = cyl(0.01, 0.01, inR - inL + 0.01, mat('#8C96A8', { metalness: 0.5 }), [(inL + inR) / 2, 1.68, RACK.z], 10)
  rail.rotation.z = Math.PI / 2
  scene.add(rail)
  ;['#E4578F', '#F2A93B', '#14B8A6', '#8B5CF6', '#2C3C81'].forEach((col, i) => {
    const s = hanging(col)
    /* turned 1.2 rad and 0.06 apart: each shirt clears its neighbours and the posts, every hook on the rail */
    s.position.set(inL + 0.065 + i * 0.06, 1.68, RACK.z)
    s.rotation.y = 1.2
    scene.add(s)
  })
  const p1 = pile(['#F4F6FA', '#9FB8F0', '#F2A93B', '#14B8A6'])
  p1.position.set(left - 0.05, 0.08, RACK.z)
  scene.add(p1)
  scene.add(box(RACK.w / 2 - 0.035, 0.025, RACK.d, wood, [left, 0.78, RACK.z]))
  for (const [dx, cols] of [[-0.09, ['#2C3C81', '#E4578F', '#F4F6FA', '#8B5CF6']], [0.09, ['#14B8A6', '#F2A93B', '#3E4A66']]] as const) {
    const p = pile([...cols])
    p.position.set(left + dx, 0.793, RACK.z)
    scene.add(p)
  }
  /* a shelf for the storage box, which floated in mid-air before */
  scene.add(box(RACK.w / 2 - 0.035, 0.025, RACK.d, wood, [left, 0.4, RACK.z]))
  scene.add(box(0.22, 0.14, 0.2, mat('#E4578F', { roughness: 0.6 }), [left + 0.04, 0.4825, RACK.z], 0.02))
  scene.add(box(0.226, 0.03, 0.206, mat('#C2407A', { roughness: 0.6 }), [left + 0.04, 0.555, RACK.z], 0.01))
  for (const [y, cols] of [[0.44, ['#2C3C81', '#3E4A66', '#8B5CF6']], [0.74, ['#E4578F', '#F4F6FA', '#F2A93B']], [1.02, ['#14B8A6', '#9FB8F0']], [1.29, ['#F4F6FA', '#2D63FB']]] as const) {
    const p = pile([...cols])
    p.position.set(right - 0.11, y + 0.013, RACK.z)
    scene.add(p)
  }
  for (const sx of [0, 1]) {
    scene.add(box(0.07, 0.05, 0.14, mat('#2C3545', { roughness: 0.5 }), [right - 0.08 + sx * 0.09, 0.105, RACK.z + 0.02], 0.02))
  }
  /* a nightstand and lamp to the right */
  scene.add(box(0.36, 0.42, 0.3, mat('#C49A6C', { roughness: 0.5 }), [0.55, 0.21, -1.05], 0.015))
  scene.add(cyl(0.05, 0.06, 0.12, mat('#F4F6FA'), [0.55, 0.48, -1.05], 20))
  scene.add(cyl(0.07, 0.1, 0.12, mat('#FFE7B0', { emissive: new THREE.Color('#FFD27A'), emissiveIntensity: 0.5 }), [0.55, 0.6, -1.05], 24))
  const setLid = caseOpen(scene, 'bag')
  const cfg = who(CAST_PRESETS.ananya, { name: 'Traveller', gender: 'female', skinTone: 'wheatish', hair: { style: 'ponytail', color: 'darkBrown' }, outfit: { top: 'tshirt', topColor: '#F2A93B', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F4F6FA' }, accessories: { earrings: true, glasses: 'none', watch: true } })
  return packer(kit, cfg, 1911, [foldedShirt(), toothbrush(), charger()], setLid, 'S19T09', [[0, 'neutral'], [0.45, 'thinking'], [1.6, 'happy'], [2.35, 'thinking'], [3.5, 'happy'], [4.25, 'thinking'], [5.4, 'happy'], [T09.lid[1], 'proud'], [8.1, 'happy'], [8.6, 'neutral']])
}

function setupT09Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FC')
  setCam(camera, CAM09, AT09, FOV09)
  lights(scene, [-0.6, 0.9, -0.8], 2.0, 4)
  room(scene, { wall: '#E3EBFA', floor: tileTex('#EEF2F8', '#DCE3EE', 4, [10, 8]), trim: '#AEB8CC', wallZ: WALL09 })
  /* the rack, full of tool blocks: everything a full system ships with */
  const metal = mat('#AEB8CC', { roughness: 0.45, metalness: 0.3 })
  const { left, right } = rack(scene, metal, mat('#DCE3EE', { roughness: 0.8 }))
  const tools: [Glyph, string][] = [['terminal', '#4A5A7A'], ['pencil', '#5B6B8C'], ['hammer', '#4A5A7A'], ['wrench', '#66779A'], ['bug', '#5B6B8C'], ['search', '#4A5A7A'], ['chart', '#66779A'], ['package', '#5B6B8C'], ['gear', '#4A5A7A'], ['terminal', '#66779A']]
  /* the left column: a pile of tool blocks two wide, stacked */
  tools.forEach(([gl, col], i) => {
    const b = block(0.15, 0.15, 0.15, col, gl, 0.68)
    b.position.set(left - 0.085 + (i % 2) * 0.17, 0.08 + Math.floor(i / 2) * 0.165, RACK.z + 0.04)
    b.rotation.y = ((i * 37) % 7) * 0.02 - 0.06
    scene.add(b)
  })
  /* the right column: more tools on each shelf, beside the three essentials */
  for (const [y, gl, col] of [[0.43, 'gear', '#66779A'], [0.73, 'pencil', '#4A5A7A'], [1.01, 'hammer', '#5B6B8C'], [1.28, 'search', '#66779A']] as const) {
    const b = block(0.13, 0.13, 0.13, col, gl, 0.68)
    b.position.set(right - 0.1, y + 0.013, RACK.z + 0.02)
    scene.add(b)
  }
  const b2 = block(0.13, 0.13, 0.13, '#4A5A7A', 'terminal', 0.68)
  b2.position.set(right + 0.07, 0.453, RACK.z + 0.02)
  scene.add(b2)
  /* a floor pile of spare tools to the right (the nightstand's place) */
  for (const [x, y, gl] of [[0.45, 0, 'wrench'], [0.62, 0, 'bug'], [0.53, 0.15, 'chart']] as const) {
    const b = block(0.15, 0.15, 0.15, '#5B6B8C', gl, 0.68)
    b.position.set(x, y, -1.0)
    scene.add(b)
  }
  const setLid = caseOpen(scene, 'container')
  const cfg = who(CAST_PRESETS.rohan, { name: 'Developer', gender: 'male', skinTone: 'fair', hair: { style: 'quiff', color: 'darkBrown' }, outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2C3545', shoeColor: '#1F2433' }, accessories: { glasses: 'round', beard: 'none', watch: true } })
  const ess = [block(0.12, 0.1, 0.1, '#F2A93B', 'app', 0.7), block(0.1, 0.1, 0.1, '#14B8A6', 'lib', 0.7), block(0.1, 0.1, 0.1, '#14B8A6', 'lib', 0.7)]
  return packer(kit, cfg, 1912, ess, setLid, 'S19T09', [[0, 'neutral'], [0.45, 'thinking'], [1.6, 'happy'], [2.35, 'thinking'], [3.5, 'happy'], [4.25, 'thinking'], [5.4, 'happy'], [T09.lid[1], 'proud'], [8.1, 'happy'], [8.6, 'neutral']])
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
  H_T02Everyday: card('S19T02', setupT02Everyday, devHold(HOLD02)),
  H_T02Concept: card('S19T02', setupT02Concept, devHold(HOLD02)),
  H_T09Everyday: card('S19T09', setupT09Everyday, devHold(HOLD09)),
  H_T09Concept: card('S19T09', setupT09Concept, devHold(HOLD09)),
}
export const css = ''
