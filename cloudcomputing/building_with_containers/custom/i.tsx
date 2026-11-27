import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CastSprite, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { useHeld } from '@/engine/figkit'

/**
 * BUILDER I · SESSION 19 (Building with Containers) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built the way Session 22's i.tsx is (its helpers and its custom/clock.tsx are copied below unchanged): a perspective
 * camera on a real place; people are Character Lab characters from the engine's `castSprite` at a fixed `px: 256` with
 * no idle breathing, expressions keyed to the action; NO TEXT on either card (screens and boards carry shapes, never
 * words); one wall-clock loop per slide shared by both cards beat for beat and place for place; each loop ends in the
 * state it starts in; held frames (`?still`, thumbnails) draw the telling moment. Nobody walks toward or away from the
 * camera. `?it=<seconds>` with `?still` holds any loop time (dev check).
 *
 * SLIDE 34 · T14-AN (TR 14): "A mobile phone comes with default settings, but each user can change the language or
 * brightness based on their preference: just as the same container image can use different environment variable values
 * in different environments."
 *
 *   place (x)     everyday: two people with the same new phone        concept: one image, two running containers
 *   0             a small table, the open phone box                   the same table, the image (three layer slabs)
 *   -0.62         she holds her phone (default screen)                container 1, the same default screen on its door
 *   +0.62         he holds his phone (the same default screen)        container 2, the same default screen
 *   0.1 - 0.7     -                                                   a copy of the image rides into each container
 *   1.0 - 2.2     she drags the brightness slider up: her screen      a brightness value rides in from the left: the
 *                 brightens, the glow round it grows                  same slider moves, container 1's screen brightens
 *   2.4 - 3.6     he taps another language: his screen's writing      a language value rides in from the right: the
 *                 changes to another script                           same row is picked, the writing changes script
 *   3.6 - 6.2     both pleased with their own phone                   both run, each with its own values
 *   6.2 - 6.9     both screens back to the defaults (the loop)        the values leave, both back to the defaults
 *
 * SLIDE 45 · T19-AN (TR 19): "A school timetable coordinates different classes and teachers to run together smoothly:
 * just as Docker Compose manages multiple services from one file."
 *
 *   place (x)     everyday: a school corridor, two classrooms         concept: one compose file, two services
 *   0             the timetable board on the corridor wall, a bell    the compose file on its stand, a start button
 *   -1.3          classroom 1: whiteboard, lamp, two pupils           service 1 (web: a globe on its container)
 *   +1.3          classroom 2: whiteboard, lamp, two pupils           service 2 (db: a database stack on its container)
 *   0 - 1.0       both teachers read the board                        the file waits
 *   1.0           the bell rings, the period's row lights             the start button pulses, the same row lights
 *   1.25 - 3.0    both teachers walk out to their rooms together      two start signals ride out to both services
 *   3.0 - 6.6     both rooms light up, both classes run               both services start together; a request rides
 *                                                                     the link between web and db
 *   6.8 - 8.6     the period ends, both walk back to the board        both signals ride back, both services stop
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


/*
 * ONE PLAYBACK CLOCK PER ANALOGY SLIDE, shared by its two cards (T21-AN, T22-AN; review 2026-11-18).
 *
 *  - It PLAYS AT ONCE: the cards fade in (opacity only) as soon as every person on BOTH cards has a first frame, and
 *    the loop starts from 0 at that moment, so nobody pops in after the room (a person used to appear 0.3 s late on a
 *    slow PC) and nothing is waited on after that (never longer than READY_CAP). (A first version held the
 *    opening frame until the people were built and then waited on any frame not built yet; on a slow PC that froze
 *    the scene for seconds, because the engine can switch to a re-sized frame set and stop building the old one.
 *    Removed on the user's word: "animation need to be played initially".)
 *  - THE TWO CARDS stay beat for beat: one clock, read once per animation frame (`document.timeline.currentTime`).
 *  - TAP TO PAUSE: a tap (or click) on either card pauses both, a second tap plays on; a small pause mark shows while
 *    paused. Leaving the slide resets it.
 *  - HELD FRAMES (`?still`, prefers-reduced-motion, thumbnails) are untouched: the stage asks for `holdT` and gets it.
 *
 * What made the people smooth is in the cards themselves: fixed-size frames (no re-sizing, which hid a person while
 * a new set was built: the flicker) and no idle breathing (a still pose is then one shared picture, so the frames that
 * move are built far sooner). See `STILL_IDLE` / `PX` in i.tsx and j.tsx.
 */

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

/* ================================================================== shared: the masked front copy of a sprite's arms */

/**
 * A holder's forearms and hands drawn a second time IN FRONT of the prop they hold (Session 21 slide 33, Session 22
 * T21): the same frame on a copy of the person's plane, scaled about the camera so it lands on the same pixels, keeping
 * only each forearm capsule and the skin round each hand. Call `update(armL, armR)` every frame after the sprite's.
 */
function frontArms(scene: THREE.Scene, camera: THREE.Camera, sprite: Sprite, b: Body, key: string) {
  const plane = (sprite as unknown as { plane: THREE.Mesh }).plane
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
  frontM.customProgramCacheKey = () => key
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
  const scaleAbout = new THREE.Matrix4()
  return (l: Arm, r: Arm) => {
    if (frontM.map !== planeM.map) frontM.map = planeM.map
    setArm(0, 'L', l)
    setArm(1, 'R', r)
    plane.updateWorldMatrix(true, false)
    camera.getWorldPosition(camW)
    const dist = camW.distanceTo(b.root)
    const k8 = 1 - 0.08 / dist
    scaleAbout.makeTranslation(camW.x, camW.y, camW.z).multiply(new THREE.Matrix4().makeScale(k8, k8, k8)).multiply(new THREE.Matrix4().makeTranslation(-camW.x, -camW.y, -camW.z))
    front.matrix.copy(scaleAbout).multiply(plane.matrixWorld)
    front.matrixWorldNeedsUpdate = true
    front.visible = plane.visible
  }
}

const halo = (color: string, w: number, h: number, opacity = 0.5) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, toneMapped: false, opacity }))
  m.renderOrder = 2
  return m
}

/* ================================================================== T14 · the same phone, set per user */

const L14 = 7
const F14 = 70
/* both phones changed: hers bright, his in another script; both pleased */
const HOLD14 = 4.9
const T14 = {
  copy: [0.1, 0.7] as const, // concept: the image copied into both containers
  aLift: [0.45, 0.95] as const, // her finger comes up to the slider
  drag: [1.0, 2.2] as const, // the knob slides up
  aDown: [2.4, 2.85] as const,
  bLift: [2.35, 2.85] as const, // his finger comes up to the list
  tap: 3.15, // he picks another language
  swap: [3.2, 3.55] as const, // the writing changes script
  bDown: [3.75, 4.2] as const,
  reset: [6.2, 6.85] as const, // back to the defaults (the loop)
}
const CAM14: V3 = [0, 1.18, 3.25]
const AT14: V3 = [0, 0.98, 0]
const FOV14 = 33
const SIDE14 = 0.62
const PH14_H = [1.66, 1.72]
/* the phone, its screen canvas 134 x 280 drawn at PS14 */
const PW = 0.134
const PH = 0.28
const PS14 = 1.36
const qx = (cx: number) => (cx / 134 - 0.5) * PW
const qy = (cy: number) => (0.5 - cy / 280) * PH
const SLIDE = { x0: 44, x1: 118, y: 56 }
const KNOB0 = 0.14
const KNOB1 = 0.92
const ROWS = [136, 162, 188]
const RADIO_X = 112

/** wavy marks that read as writing in one script or another, never as words */
function script(k: CanvasRenderingContext2D, x: number, y: number, w: number, kind: 'a' | 'b', color: string, seed: number) {
  k.strokeStyle = color
  k.fillStyle = color
  k.lineCap = 'round'
  let px = x
  let i = seed
  while (px < x + w - 6) {
    const ww = Math.min(x + w - px, 8 + ((i * 37) % 13))
    if (kind === 'a') {
      /* short rounded strokes of x-height, a tall one now and then */
      k.lineWidth = 2.2
      for (let j = 0; j < ww - 3; j += 4.2) {
        const tall = (i + Math.round(j)) % 5 === 0
        k.beginPath()
        k.moveTo(px + j, y + 3)
        k.lineTo(px + j + 1.4, tall ? y - 4 : y - 1)
        k.stroke()
      }
    } else {
      /* a head line over each word with loops hanging under it */
      k.lineWidth = 1.8
      k.beginPath()
      k.moveTo(px, y - 3)
      k.lineTo(px + ww, y - 3)
      k.stroke()
      for (let j = 2; j < ww - 2; j += 5) {
        k.beginPath()
        k.arc(px + j + 1.5, y + 1.2, 1.9, Math.PI * 1.1, Math.PI * 2.6)
        k.stroke()
      }
    }
    px += ww + 6
    i++
  }
}
/** the settings screen every new phone opens on (134 x 280): brightness, language list, the dock */
function settingsScreen(kind: 'a' | 'b') {
  return canvasTex(134, 280, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 280)
    g.addColorStop(0, '#FFFFFF')
    g.addColorStop(1, '#EAF0FC')
    k.fillStyle = g
    k.fillRect(0, 0, 134, 280)
    rr(k, 10, 7, 22, 6, 3, '#C3CEE2')
    k.fillStyle = '#C3CEE2'
    for (let i = 0; i < 3; i++) k.fillRect(104 + i * 6, 12 - i * 2.5, 4, 2 + i * 2.5)
    /* brightness card: a sun and the slider's track */
    rr(k, 8, 34, 118, 44, 11, '#F1F5FD')
    k.fillStyle = '#F6B400'
    k.beginPath()
    k.arc(24, SLIDE.y, 5, 0, TAU)
    k.fill()
    k.strokeStyle = '#F6B400'
    k.lineWidth = 1.6
    for (let r = 0; r < 8; r++) {
      const a = (r / 8) * TAU
      k.beginPath()
      k.moveTo(24 + Math.cos(a) * 7.5, SLIDE.y + Math.sin(a) * 7.5)
      k.lineTo(24 + Math.cos(a) * 10, SLIDE.y + Math.sin(a) * 10)
      k.stroke()
    }
    rr(k, SLIDE.x0, SLIDE.y - 3, SLIDE.x1 - SLIDE.x0, 6, 3, '#DCE4F4')
    /* language card: a globe, a heading line, three languages with their radio rings */
    rr(k, 8, 88, 118, 116, 11, '#F1F5FD')
    k.strokeStyle = '#2D63FB'
    k.lineWidth = 1.6
    k.beginPath()
    k.arc(24, 108, 7, 0, TAU)
    k.stroke()
    k.beginPath()
    k.ellipse(24, 108, 3, 7, 0, 0, TAU)
    k.moveTo(17, 108)
    k.lineTo(31, 108)
    k.stroke()
    script(k, 38, 109, 52, kind, '#22304F', 3)
    ROWS.forEach((y, i) => {
      if (i) {
        k.fillStyle = '#E1E8F5'
        k.fillRect(14, y - 13, 106, 1)
      }
      script(k, 18, y, 62 - i * 8, kind, '#5A6B8F', 7 + i * 5)
      k.strokeStyle = '#9AAAC8'
      k.lineWidth = 1.6
      k.beginPath()
      k.arc(RADIO_X, y, 5.5, 0, TAU)
      k.stroke()
    })
    /* the dock: four app tiles */
    ;['#5B88FF', '#22C55E', '#F6B400', '#8B5CF6'].forEach((c, i) => rr(k, 14 + i * 28, 236, 22, 22, 6, c))
  })
}
const discTex = (fill: string, rim?: string) =>
  canvasTex(32, 32, (k) => {
    k.fillStyle = fill
    k.beginPath()
    k.arc(16, 16, rim ? 13 : 15, 0, TAU)
    k.fill()
    if (rim) {
      k.strokeStyle = rim
      k.lineWidth = 3
      k.stroke()
    }
  })
/** the screen and the parts of it that change; `mode` 'bright' (she changes brightness) or 'lang' (he changes language) */
function makeScreen(mode: 'bright' | 'lang') {
  const g = new THREE.Group()
  const layer = (m: THREE.Mesh, z: number, order: number) => {
    m.position.z = z
    m.renderOrder = order
    g.add(m)
    return m
  }
  const base = layer(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), basic(settingsScreen('a'), { depthWrite: false })), 0, 5)
  void base
  /* the other script, faded in over the first when he picks another language */
  const other = layer(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), basic(settingsScreen('b'), { depthWrite: false, opacity: 0 })), 0.0002, 5)
  /* the slider's fill, from its left end to the knob */
  const fillG = new THREE.PlaneGeometry(qx(SLIDE.x1) - qx(SLIDE.x0), qy(0) - qy(6))
  fillG.translate((qx(SLIDE.x1) - qx(SLIDE.x0)) / 2, 0, 0)
  const fill = layer(new THREE.Mesh(fillG, new THREE.MeshBasicMaterial({ color: '#2D63FB', transparent: true, toneMapped: false, depthWrite: false })), 0.0004, 6)
  fill.position.x = qx(SLIDE.x0)
  fill.position.y = qy(SLIDE.y)
  const knob = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(15) - qx(0), qx(15) - qx(0)), basic(discTex('#FFFFFF', '#2D63FB'), { depthWrite: false })), 0.0006, 7)
  /* the chosen language: a filled dot in its ring */
  const dot = layer(new THREE.Mesh(new THREE.PlaneGeometry(qx(9) - qx(0), qx(9) - qx(0)), basic(discTex('#2D63FB'), { depthWrite: false })), 0.0006, 7)
  /* the screen's brightness: a dark veil over it, lifted as the knob goes up */
  const veil = layer(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ color: '#0B1230', transparent: true, toneMapped: false, depthWrite: false, opacity: 0.4 })), 0.0008, 8)
  /* a touch ripple */
  const rp = layer(new THREE.Mesh(new THREE.RingGeometry(0.012, 0.018, 36), new THREE.MeshBasicMaterial({ color: '#2D63FB', transparent: true, opacity: 0, toneMapped: false, depthWrite: false })), 0.001, 9)
  rp.position.set(qx(RADIO_X), qy(ROWS[2]), 0.001)
  /** how far up her knob is (0 default, 1 dragged), and the language swap (0, 1), at loop time c */
  const state = (c: number) => {
    const back = seg(c, T14.reset[0], T14.reset[1])
    const up = mode === 'bright' ? seg(c, T14.drag[0], T14.drag[1]) * (1 - back) : 0
    const sw = mode === 'lang' ? seg(c, T14.swap[0], T14.swap[1]) * (1 - back) : 0
    const picked = mode === 'lang' && c >= T14.tap && c < T14.reset[0] + 0.35 ? 1 : 0
    return { up, sw, picked }
  }
  const knobX = (up: number) => SLIDE.x0 + (SLIDE.x1 - SLIDE.x0) * lerp(KNOB0, KNOB1, up)
  const update = (c: number) => {
    const { up, sw, picked } = state(c)
    const kx = knobX(up)
    knob.position.x = qx(kx)
    knob.position.y = qy(SLIDE.y)
    fill.scale.x = Math.max(0.001, (kx - SLIDE.x0) / (SLIDE.x1 - SLIDE.x0))
    setOp(veil, 0.4 * (1 - up))
    setOp(other, sw)
    dot.position.set(qx(RADIO_X), qy(ROWS[picked ? 2 : 0]), 0.0006)
    dot.scale.setScalar(picked ? 1 + 0.35 * Math.sin(Math.PI * clamp01((c - T14.tap) / 0.3)) : 1)
    const age = mode === 'lang' ? c - T14.tap : -1
    const k = clamp01(age / 0.45)
    rp.scale.setScalar(0.5 + k * 1.4)
    setOp(rp, age >= 0 && age < 0.45 ? 0.85 * (1 - k) : 0)
    return up
  }
  return { g, update, knobX: (c: number) => knobX(state(c).up) }
}
function makePhone(mode: 'bright' | 'lang') {
  const ph = new THREE.Group()
  ph.add(box(PW + 0.016, PH + 0.022, 0.016, mat('#1C2233', { roughness: 0.3, metalness: 0.5 }), [0, 0, 0], 0.012))
  ph.add(flat(box(0.03, 0.006, 0.002, mat('#2E354A'), [0, PH / 2 + 0.004, 0.0085])))
  const s = makeScreen(mode)
  s.g.position.z = 0.0086
  ph.add(s.g)
  ph.scale.setScalar(PS14)
  return { ph, ...s }
}
/** her room with his: a wall with a window, the small table with the phone box (everyday) or the image (concept) */
function room14(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#E7EEFA' : '#E2EAF6')
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [9, 6]) : tileTex('#D9C4A6', '#C8B08F', 2, [11, 6]), roughness: 0.85 }), [0, 0, 1]))
  const wall = concept ? '#EAF0FA' : '#E9EFF6'
  scene.add(flat(box(9, 3.2, 0.1, mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.25 }), [0, 1.6, -0.9])))
  scene.add(flat(box(9, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0, 0.05, -0.84])))
  if (!concept) {
    const sky = canvasTex(64, 64, (k) => {
      const g = k.createLinearGradient(0, 0, 0, 64)
      g.addColorStop(0, '#A9CBFF')
      g.addColorStop(1, '#E4F0FF')
      k.fillStyle = g
      k.fillRect(0, 0, 64, 64)
    })
    scene.add(picture(sky, 0.62, 0.56, [0, 1.62, -0.844], { transparent: false }))
    for (const [w, h, x, y] of [[0.7, 0.04, 0, 1.92], [0.7, 0.04, 0, 1.32], [0.04, 0.64, -0.33, 1.62], [0.04, 0.64, 0.33, 1.62], [0.025, 0.56, 0, 1.62]] as const)
      scene.add(flat(box(w, h, 0.03, mat('#FFFFFF', { roughness: 0.5 }), [x, y, -0.83])))
  }
  /* the small round table between them */
  const top = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.15 })
  scene.add(cyl(0.26, 0.26, 0.035, top, [0, 0.7, -0.3], 40))
  scene.add(cyl(0.025, 0.025, 0.68, mat('#9AA4B4', { roughness: 0.4, metalness: 0.3 }), [0, 0.35, -0.3], 16))
  scene.add(cyl(0.14, 0.16, 0.025, mat('#9AA4B4', { roughness: 0.4, metalness: 0.3 }), [0, 0.012, -0.3], 32))
}
const TABLE_TOP = 0.7175

function setupT14Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, CAM14, AT14, FOV14)
  lights(scene, [0, 1.0, 0], 3.0)
  room14(scene, false)
  /* the open phone box on the table: a white tray, its lid leaning on it, two empty phone wells (both phones came from it) */
  const white = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.12 })
  scene.add(box(0.3, 0.05, 0.2, white, [-0.05, TABLE_TOP + 0.025, -0.38], 0.01))
  for (const x of [-0.12, 0.02]) scene.add(flat(box(0.09, 0.004, 0.15, mat('#DCE4F4', { roughness: 0.6 }), [x, TABLE_TOP + 0.051, -0.38], 0.002)))
  const lid = box(0.3, 0.04, 0.2, mat('#2D63FB', { roughness: 0.4 }), [0.07, TABLE_TOP + 0.02, -0.18], 0.01)
  lid.rotation.y = -0.35
  scene.add(lid)

  const cast: { cfg: CharacterConfig; x: number; h: number; mode: 'bright' | 'lang'; seed: number; faces: [number, string][] }[] = [
    {
      cfg: who(CAST_PRESETS.meera, { name: 'Her', hair: { style: 'ponytail', color: '#3A2316' }, outfit: { top: 'blouse', topColor: '#1FA7A0', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' } }),
      x: -SIDE14,
      h: PH14_H[0],
      mode: 'bright',
      seed: 1401,
      faces: [[0, 'neutral'], [0.6, 'thinking'], [1.6, 'happy'], [3.2, 'proud'], [6.2, 'neutral']],
    },
    {
      cfg: who(CAST_PRESETS.kabir, { name: 'Him', hair: { style: 'sidePart', color: '#2A2324' }, outfit: { top: 'hoodie', topColor: '#6D5BD0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 1.02, shoulders: 1 } }),
      x: SIDE14,
      h: PH14_H[1],
      mode: 'lang',
      seed: 1402,
      faces: [[0, 'neutral'], [2.3, 'thinking'], [3.3, 'happy'], [4.6, 'proud'], [6.2, 'neutral']],
    },
  ]
  const users = cast.map((u) => {
    const root = new THREE.Vector3(u.x, 0, 0)
    const target = new THREE.Vector3(u.x + 0.02, 0.9 * (u.h / 1.68), -0.05)
    const phone = makePhone(u.mode)
    scene.add(phone.ph)
    const glow = halo('rgba(210,228,255,0.9)', 0.6, 0.75, 0.35)
    scene.add(glow)
    const b: Body = { cfg: u.cfg, root, h: u.h, sh: buildSkin(u.cfg).shoulderHalf }
    const yaw = Math.atan2(camera.position.x - target.x, camera.position.z - target.z)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, yaw, 0))
    const gripP = new THREE.Vector3(-PW * 0.48, -PH * 0.47, 0).multiplyScalar(PS14).applyQuaternion(q)
    const outward = (side: 'L' | 'R', w: THREE.Vector3): Arm => {
      const pt = worldToRig(w, b.root, b.h, camera)
      const a = ik2(side, b.sh, pt, false)
      const d = ik2(side, b.sh, pt, true)
      return Math.sin(a.s * DEG) >= Math.sin(d.s * DEG) ? a : d
    }
    const holdL = outward('L', target.clone().add(gripP))
    /* the fingertip on the screen point (cx, cy), a little above it while it hovers */
    const tipW = (cx: number, cy: number, lift: number) => target.clone().add(new THREE.Vector3(qx(cx), qy(cy), 0).multiplyScalar(PS14).applyQuaternion(q)).add(new THREE.Vector3(0.06, 0.01 + lift, 0))
    const restR: Arm = { s: 8, e: 18 }
    const lift = u.mode === 'bright' ? T14.aLift : T14.bLift
    const down = u.mode === 'bright' ? T14.aDown : T14.bDown
    const press = (c: number) => (u.mode === 'bright' ? hold(c, T14.drag[0] - 0.12, T14.drag[0], T14.drag[1], T14.drag[1] + 0.12) : hold(c, T14.tap - 0.14, T14.tap, T14.tap + 0.08, T14.tap + 0.22))
    const point = (c: number) => (u.mode === 'bright' ? { x: phone.knobX(c), y: SLIDE.y } : { x: RADIO_X, y: ROWS[2] })
    const fingerR = (c: number) => {
      const p = point(c)
      return mixArm(restR, outward('R', tipW(p.x, p.y, 0.035 * (1 - press(c)))), hold(c, lift[0], lift[1], down[0], down[1]))
    }
    const sp = person({
      config: u.cfg,
      seed: u.seed,
      faces: u.faces,
      loop: L14,
      frames: F14,
      height: u.h,
      redraw,
      holdT: devHold(HOLD14),
      pose: (p, c) => {
        setArms(p, holdL, fingerR(c))
        grip(p, 'L', 1)
        const pt = hold(c, lift[0], lift[1], down[0], down[1])
        to(p, 'fR1', 0, pt)
        to(p, 'fR2', 0.95, pt)
        to(p, 'fR3', 1, pt)
        to(p, 'fR4', 1, pt)
        to(p, 'tR', 0.8, pt)
        to(p, 'palmR', 0.2, pt)
        to(p, 'headTurn', 0.05 * Math.sign(-u.x), 1)
        to(p, 'headNod', 0.5, 1)
        to(p, 'lookY', 1, 1)
        /* pleased: a small nod once the phone is set */
        const t0 = u.mode === 'bright' ? 2.5 : 3.7
        const n = hold(c, t0, t0 + 0.1, t0 + 0.7, t0 + 0.8)
        to(p, 'headNod', 0.5 - 0.15 * Math.sin(((c - t0) / 0.8) * TAU * 2), n)
      },
    })
    sp.object.position.copy(root)
    scene.add(sp.object)
    const arms = frontArms(scene, camera, sp, b, `t14-hands-${u.mode}`)
    const hand = new THREE.Vector3()
    return {
      sp,
      update: (c: number) => {
        const cq = frameT(c, L14, F14)
        sp.update(c, camera)
        rigToWorld(handPt('L', b.sh, holdL), u.h, root, camera, hand)
        phone.ph.quaternion.copy(q)
        phone.ph.position.copy(hand).sub(gripP)
        const camW = camera.position
        phone.ph.position.sub(camW).multiplyScalar(1 - 0.04 / phone.ph.position.distanceTo(camW)).add(camW)
        const up = phone.update(c)
        glow.position.copy(phone.ph.position).add(new THREE.Vector3(0, 0, -0.08))
        glow.quaternion.copy(q)
        setOp(glow, 0.22 + 0.55 * up)
        glow.scale.setScalar(0.85 + 0.35 * up)
        arms(holdL, fingerR(cq))
      },
    }
  })
  const clk = slideClock('S19T14', scene, devHold(HOLD14), users.map((u) => u.sp))
  return (t: number) => {
    const c = mod(clk.time(t), L14)
    users.forEach((u) => u.update(c))
  }
}

/* ------------------------------------------------------------------ T14 concept: one image, two containers */

/** a value carried into a container: a white rounded tile with its sign (a sun for brightness, a globe for language) */
const valueTex = (kind: 'sun' | 'globe') =>
  canvasTex(64, 64, (k) => {
    rr(k, 3, 3, 58, 58, 14, '#FFFFFF')
    k.strokeStyle = '#D3DEF6'
    k.lineWidth = 2
    k.beginPath()
    k.roundRect(3, 3, 58, 58, 14)
    k.stroke()
    if (kind === 'sun') {
      k.fillStyle = '#F6B400'
      k.beginPath()
      k.arc(32, 32, 10, 0, TAU)
      k.fill()
      k.strokeStyle = '#F6B400'
      k.lineWidth = 3.5
      k.lineCap = 'round'
      for (let r = 0; r < 8; r++) {
        const a = (r / 8) * TAU
        k.beginPath()
        k.moveTo(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15)
        k.lineTo(32 + Math.cos(a) * 20, 32 + Math.sin(a) * 20)
        k.stroke()
      }
    } else {
      k.strokeStyle = '#2D63FB'
      k.lineWidth = 3.5
      k.beginPath()
      k.arc(32, 32, 16, 0, TAU)
      k.stroke()
      k.beginPath()
      k.ellipse(32, 32, 7, 16, 0, 0, TAU)
      k.moveTo(16, 32)
      k.lineTo(48, 32)
      k.stroke()
    }
  })

function setupT14Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  setCam(camera, CAM14, AT14, FOV14)
  lights(scene, [0, 1.0, 0], 3.0)
  room14(scene, true)
  /* the image on the table: three layer slabs */
  const slabs = ['#1F47C4', '#2D63FB', '#5B88FF'].map((c, i) => {
    const s = box(0.3, 0.06, 0.22, mat(c, { roughness: 0.35, emissive: new THREE.Color(c), emissiveIntensity: 0.12 }), [0, TABLE_TOP + 0.04 + i * 0.075, -0.3], 0.015)
    scene.add(s)
    return s
  })
  /* two containers where the two people stand, each on a white plinth, its door holding the same default screen */
  const ribM = mat('#1F47C4', { roughness: 0.35 })
  const bodyM = mat('#2D63FB', { roughness: 0.35, metalness: 0.1, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.12 })
  const plinthM = mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.15 })
  const C14 = { w: 0.56, h: 0.86, d: 0.46, y0: 0.42 }
  const SCR_Y = 0.92
  const units = (['bright', 'lang'] as const).map((mode, i) => {
    const x = (i ? 1 : -1) * SIDE14
    scene.add(box(C14.w + 0.1, C14.y0, C14.d + 0.1, plinthM, [x, C14.y0 / 2, -0.12], 0.02))
    const ct = new THREE.Group()
    ct.add(box(C14.w, C14.h, C14.d, bodyM, [0, C14.h / 2, 0], 0.03))
    /* corrugated door ribs either side of the screen, and the frame rails */
    for (let r = 0; r < 3; r++) for (const sg of [-1, 1]) ct.add(flat(box(0.024, C14.h - 0.12, 0.012, ribM, [sg * (0.17 + r * 0.032), C14.h / 2, C14.d / 2 + 0.004], 0.006)))
    for (const y of [0.03, C14.h - 0.03]) ct.add(flat(box(C14.w + 0.004, 0.04, C14.d + 0.004, ribM, [0, y, 0], 0.01)))
    /* the running light on its top rail */
    const led = new THREE.MeshBasicMaterial({ color: C.green, toneMapped: false, transparent: true })
    ct.add(mesh(new THREE.SphereGeometry(0.016, 12, 8), led, [C14.w / 2 - 0.05, C14.h - 0.03, C14.d / 2 + 0.012]))
    ct.position.set(x, C14.y0, -0.12)
    scene.add(ct)
    const s = makeScreen(mode)
    const scr = new THREE.Group()
    scr.add(box(PW + 0.012, PH + 0.016, 0.008, mat('#1C2233', { roughness: 0.3, metalness: 0.4 }), [0, 0, -0.004], 0.006))
    s.g.position.z = 0.0005
    scr.add(s.g)
    scr.scale.setScalar(1.45)
    scr.position.set(x, SCR_Y, -0.12 + C14.d / 2 + 0.012)
    scene.add(scr)
    const glow = halo('rgba(210,228,255,0.9)', 0.55, 0.7, 0.3)
    glow.position.set(x, SCR_Y, -0.12 + C14.d / 2 + 0.006)
    scene.add(glow)
    /* the value carried in: from the card's edge on this container's side into the screen */
    const val = picture(valueTex(mode === 'bright' ? 'sun' : 'globe'), 0.16, 0.16, [x, SCR_Y, 0.3], { depthWrite: false })
    val.renderOrder = 9
    scene.add(val)
    /* the copy of the image arriving: a ghost of the three slabs riding from the table */
    const ghost = new THREE.Group()
    ;['#1F47C4', '#2D63FB', '#5B88FF'].forEach((c, k) => ghost.add(box(0.2, 0.04, 0.14, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), [0, k * 0.05, 0], 0.01)))
    scene.add(ghost)
    return { mode, x, s, glow, val, ghost, led }
  })
  const clk = slideClock('S19T14', scene, devHold(HOLD14), [{ ready: Promise.resolve() }])
  return (t: number) => {
    const c = mod(clk.time(t), L14)
    /* the image breathes: its top slab lifts a little and settles */
    slabs[2].position.y = TABLE_TOP + 0.04 + 0.15 + 0.012 * Math.sin(c * TAU / L14 * 2)
    for (const u of units) {
      const up = u.s.update(c)
      setOp(u.glow, 0.2 + 0.55 * up)
      u.glow.scale.setScalar(0.85 + 0.35 * up)
      /* the copy rides in at the start of the loop */
      const ck = seg(c, T14.copy[0], T14.copy[1])
      const from = new THREE.Vector3(0, TABLE_TOP + 0.06, -0.3)
      const toP = new THREE.Vector3(u.x, SCR_Y - 0.05, -0.12 + 0.24)
      u.ghost.position.copy(arcP(from, toP, ck, 0.35))
      u.ghost.children.forEach((m) => setOp(m as THREE.Mesh, 0.85 * hold(c, T14.copy[0], T14.copy[0] + 0.1, T14.copy[1] - 0.15, T14.copy[1])))
      /* its value: rides in from the edge while she drags / he taps, sinks into the screen, leaves at the reset */
      const [a, b] = u.mode === 'bright' ? [T14.aLift[0], T14.drag[0] + 0.15] : [T14.bLift[0], T14.tap]
      const k = seg(c, a, b)
      const edge = new THREE.Vector3(u.x + (u.mode === 'bright' ? -0.62 : 0.62), SCR_Y + 0.42, 0.3)
      const dock = new THREE.Vector3(u.x, C14.y0 + C14.h + 0.16, -0.02)
      const out = seg(c, T14.reset[0], T14.reset[1])
      u.val.position.copy(edge.clone().lerp(dock, k).lerp(edge, out))
      u.val.position.y += 0.015 * Math.sin(c * TAU * 0.9)
      setOp(u.val, hold(c, a - 0.2, a, T14.reset[0], T14.reset[1]))
      u.led.opacity = 0.7 + 0.3 * Math.sin(c * TAU * 1.2 + (u.mode === 'lang' ? 1 : 0))
    }
  }
}
const arcP = (a: THREE.Vector3, b: THREE.Vector3, k: number, lift: number) => {
  const v = a.clone().lerp(b, k)
  v.y += Math.sin(k * Math.PI) * lift
  return v
}

/* ================================================================== T19 · a school timetable, Docker Compose */

const L19 = 9
const F19 = 90
const FS19 = 30
/* both classes running: both rooms lit, both teachers at their boards, the pupils listening */
const HOLD19 = 4.6
const T19 = {
  bell: 1.0,
  out: [1.25, 3.0] as const,
  lamp: [3.0, 3.4] as const,
  write: [3.4, 4.4] as const,
  point: [3.5, 3.9, 6.1, 6.5] as const,
  back: [6.8, 8.6] as const,
  off: [6.7, 7.1] as const,
}
const CAM19: V3 = [0, 1.78, 5.0]
const AT19: V3 = [0, 1.05, -0.3]
const FOV19 = 38
const WALL19 = -1.2
const PART = 0.76 // the classroom walls at x = +-0.76
const ROOM = 1.43 // each classroom's centre
const TZ = -0.15 // the teachers' depth (they walk across, never toward the camera)
const TSTART = 0.57
const TEND = 1.0
const TCH_H = [1.66, 1.72]
const KID_H = 1.22
const KIDS = [-1.9, -1.6] // the two pupils of the left room, on its outer side (mirrored on the right)
const KZ = -0.62
const DESK = { w: 0.3, h: 0.6, d: 0.26, z: -0.44 }
/* the everyday card's own depth (user review 2026-11-27, slide 45 left card): whiteboard on the back wall, the teacher a
   clear step in front of it, the pupils' desks and chairs well forward with their backs to us; a higher camera so the
   floor between them reads. The concept card keeps CAM19 and the constants above. */
const E19 = {
  cam: [0, 2.3, 5.0] as V3,
  at: [0, 0.98, -0.45] as V3,
  tz: -0.74, // the teachers' depth: in front of the boards, through the doorways
  tStart: 0.6,
  tEnd: 0.95,
  stub: -0.9, // the classroom side walls end here, in front of them the teachers' path
  wbX: 1.72,
  kids: [1.3, 1.68],
  deskZ: -0.2,
  kidZ: 0.1,
}
/** a pupil seen from behind: the hair covers the whole head (the ponytail or bob over it), no face, no glasses, the
 *  shirt's plain back (the rig only draws people facing us; the face and front of the shirt are what a back lacks) */
const backView = (k: Skin): Skin => ({
  ...k,
  hairFront: (
    <g data-part="back-of-head">
      <path d={k.head} fill={k.palette.hair} transform="scale(1.07 1.05) translate(0 -3)" />
      <path d={k.head} fill={k.palette.hairLight} opacity={0.35} transform="scale(0.55 0.4) translate(-14 -95)" />
      {k.hairBack}
    </g>
  ),
  hairBack: undefined,
  faceExtras: undefined,
  top: <g data-part="shirt-back" />,
})
/** seated, seen from behind: nothing of the sprite below the hips is drawn (the legs are under the seat and the desk);
 *  the rig always draws legs, so its plane discards every pixel below rig y `cut` (400 is the hip line) */
function seated(sp: CastSprite, cut = 432) {
  const m = (sp as unknown as { plane: THREE.Mesh }).plane.material as THREE.MeshBasicMaterial
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n  if ((1.0 - vMapUv.y) * 600.0 > ${cut.toFixed(1)}) discard;`)
  }
  m.customProgramCacheKey = () => `s19-seated-${cut}`
}

/** the timetable (240 x 180): a header row and five columns of coloured period blocks; nothing written */
function timetableTex() {
  return canvasTex(240, 180, (k) => {
    rr(k, 0, 0, 240, 180, 10, '#FFFFFF')
    rr(k, 10, 10, 220, 22, 6, '#1F2E63')
    const cols = ['#5B88FF', '#22C55E', '#F6B400', '#8B5CF6', '#1FA7A0']
    for (let r = 0; r < 4; r++)
      for (let cc = 0; cc < 5; cc++) {
        const col = cols[(r * 2 + cc * 3) % 5]
        rr(k, 12 + cc * 44, 42 + r * 34, 38, 28, 5, col)
        k.fillStyle = 'rgba(255,255,255,0.75)'
        k.fillRect(18 + cc * 44, 52 + r * 34, 18 + ((r + cc) % 3) * 4, 3)
        k.fillRect(18 + cc * 44, 59 + r * 34, 12, 3)
      }
  })
}
/** the compose file's face (240 x 300): a folded corner, indented lines in the timetable's colours */
function composeTex() {
  return canvasTex(240, 300, (k) => {
    rr(k, 0, 0, 240, 300, 12, '#FFFFFF')
    k.fillStyle = '#DCE4F4'
    k.beginPath()
    k.moveTo(196, 0)
    k.lineTo(240, 44)
    k.lineTo(196, 44)
    k.closePath()
    k.fill()
    const lines: [number, number, string][] = [
      [0, 90, '#1F2E63'], [1, 60, '#5B88FF'], [2, 90, '#9AAAC8'], [2, 70, '#9AAAC8'], [2, 110, '#9AAAC8'], [1, 60, '#22C55E'], [2, 100, '#9AAAC8'], [2, 80, '#9AAAC8'], [2, 120, '#9AAAC8'],
    ]
    lines.forEach(([ind, w, col], i) => rr(k, 22 + ind * 24, 30 + i * 28, w, 10, 5, col))
  })
}
const ROW19 = 1 // the period that starts at the bell (row index on the board)

function corridor19(scene: THREE.Scene, concept: boolean) {
  scene.background = new THREE.Color(concept ? '#E7EEFA' : '#E4EBF5')
  const floorM = mat('#ffffff', { map: concept ? tileTex('#E3EAF8', '#CCD7EC', 4, [10, 6]) : tileTex('#D9C4A6', '#C8B08F', 2, [12, 7]), roughness: 0.85 })
  scene.add(floorPlane(10, 6, floorM, [0, 0, 0.6]))
}
/** a back-wall panel whose glow is the room's light; returns its material */
function wallPanel(scene: THREE.Scene, x0: number, x1: number, color: string) {
  const m = mat(color, { roughness: 0.95, emissive: new THREE.Color(color), emissiveIntensity: 0.12 })
  scene.add(flat(box(x1 - x0, 2.4, 0.1, m, [(x0 + x1) / 2, 1.2, WALL19])))
  scene.add(flat(box(x1 - x0, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [(x0 + x1) / 2, 0.05, WALL19 + 0.06])))
  return m
}

function setupT19Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  setCam(camera, E19.cam, E19.at, FOV19)
  lights(scene, [0, 1.0, -0.4], 2.8)
  corridor19(scene, false)
  /* the corridor wall with the timetable and the bell; the two classrooms either side, open to the front; their side
     walls are short stubs off the back wall, so the teachers pass in front of them a step out from the boards */
  wallPanel(scene, -PART, PART, '#DCE6F4')
  const roomWalls = [-1, 1].map((sg) => wallPanel(scene, sg < 0 ? -2.6 : PART, sg < 0 ? -PART : 2.6, '#F5EEDC'))
  const partM = mat('#F7F9FD', { roughness: 0.8 })
  for (const sg of [-1, 1]) scene.add(box(0.1, 2.4, E19.stub - WALL19, partM, [sg * PART, 1.2, (WALL19 + E19.stub) / 2], 0.01))
  const board = new THREE.Group()
  board.add(box(0.72, 0.57, 0.04, mat('#B88A5A', { roughness: 0.6 }), [0, 0, 0], 0.012))
  board.add(picture(timetableTex(), 0.66, 0.495, [0, 0, 0.022], { transparent: false }))
  board.position.set(0, 1.52, WALL19 + 0.07)
  scene.add(board)
  /* the period that starts now: a glow over its row */
  const rowGlow = picture(canvasTex(8, 8, (k) => rr(k, 0, 0, 8, 8, 2, '#FFE27A')), 0.64, 0.1, [0, 1.52 + 0.2475 - (0.495 * (42 + ROW19 * 34 + 14)) / 180, WALL19 + 0.094], { depthWrite: false, opacity: 0 })
  rowGlow.renderOrder = 4
  scene.add(rowGlow)
  /* the bell above it, on a bracket */
  scene.add(flat(box(0.04, 0.12, 0.08, mat('#9AA4B4', { roughness: 0.4, metalness: 0.4 }), [0, 2.17, WALL19 + 0.09])))
  const bell = new THREE.Group()
  bell.add(mesh(new THREE.SphereGeometry(0.1, 28, 14, 0, TAU, 0, Math.PI / 2), mat('#E8B33A', { roughness: 0.25, metalness: 0.7, side: THREE.DoubleSide }), [0, -0.1, 0]))
  bell.add(mesh(new THREE.SphereGeometry(0.022, 12, 8), mat('#8A6A2A', { roughness: 0.4, metalness: 0.5 }), [0, -0.12, 0]))
  bell.position.set(0, 2.15, WALL19 + 0.2)
  scene.add(bell)
  const waves = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.145, 40, 1, Math.PI * 0.05, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: '#E8B33A', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }))
    m.position.set(0, 2.08, WALL19 + 0.22)
    m.renderOrder = 5
    scene.add(m)
    return m
  })
  /* each classroom: a whiteboard on its back wall, a pendant lamp, and nearer the front two desks with a pupil on a chair
     at each, their backs to us, facing the whiteboard */
  const rooms = [-1, 1].map((sg, ri) => {
    const cx = sg * ROOM
    const wb = new THREE.Group()
    wb.add(box(0.7, 0.46, 0.03, mat('#C9D0DA', { roughness: 0.3, metalness: 0.4 }), [0, 0, 0], 0.01))
    wb.add(picture(canvasTex(8, 8, (k) => rr(k, 0, 0, 8, 8, 1, '#FFFFFF')), 0.64, 0.4, [0, 0, 0.017], { transparent: false }))
    const strokes = [[0.36, '#2D63FB'], [0.48, '#22C55E'], [0.28, '#2D63FB'], [0.42, '#F6B400']].map(([w, col], i) => {
      const g = new THREE.PlaneGeometry(w as number, 0.035)
      g.translate((w as number) / 2, 0, 0)
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col as string, transparent: true, toneMapped: false, depthWrite: false }))
      m.position.set(-0.27, 0.125 - i * 0.082, 0.019)
      m.renderOrder = 3
      wb.add(m)
      return m
    })
    wb.position.set(sg * E19.wbX, 1.66, WALL19 + 0.07)
    scene.add(wb)
    scene.add(cyl(0.008, 0.008, 0.3, mat('#5A6478'), [cx, 2.32, -0.55], 8))
    scene.add(mesh(new THREE.ConeGeometry(0.14, 0.12, 28, 1, true), mat('#2D63FB', { roughness: 0.4, side: THREE.DoubleSide }), [cx, 2.12, -0.55]))
    const bulbM = new THREE.MeshBasicMaterial({ color: '#FFF4D2', toneMapped: false })
    scene.add(mesh(new THREE.SphereGeometry(0.05, 16, 10), bulbM, [cx, 2.07, -0.55]))
    const lampGlow = halo('rgba(255,236,170,0.95)', 1.3, 1.1, 0)
    lampGlow.position.set(cx, 1.7, WALL19 + 0.12)
    scene.add(lampGlow)
    const deskM = mat('#E8D2B0', { roughness: 0.6 })
    const legM = mat('#9AA4B4', { roughness: 0.4, metalness: 0.3 })
    const chairM = mat(ri ? '#1F9D57' : '#2D63FB', { roughness: 0.45 })
    const kidXs = E19.kids.map((kx) => sg * kx)
    for (const x of kidXs) {
      /* the desk in front of the pupil (toward the whiteboard), a book open on it */
      const dz = E19.deskZ
      scene.add(box(0.36, 0.03, 0.3, deskM, [x, 0.6, dz], 0.008))
      for (const [lx, lz] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]) scene.add(cyl(0.012, 0.012, 0.59, legM, [x + lx, 0.295, dz + lz], 8))
      scene.add(flat(box(0.14, 0.012, 0.1, mat(ri ? '#22C55E' : '#5B88FF', { roughness: 0.5 }), [x, 0.621, dz - 0.03], 0.003)))
      /* the chair under the pupil: seat, its back toward us (it hides the waist: the pupil reads as sitting) */
      const cz = E19.kidZ
      scene.add(box(0.32, 0.04, 0.3, chairM, [x, 0.42, cz + 0.04], 0.01))
      scene.add(box(0.34, 0.34, 0.03, chairM, [x, 0.67, cz + 0.2], 0.012))
      for (const [lx, lz] of [[-0.13, -0.1], [0.13, -0.1], [-0.13, 0.18], [0.13, 0.18]]) scene.add(cyl(0.011, 0.011, 0.4, legM, [x + lx, 0.2, cz + 0.04 + lz], 8))
    }
    return { cx, sg, strokes, bulbM, lampGlow, kidXs }
  })
  /* the teachers: she takes the left room, he the right */
  const tcfg = [
    who(CAST_PRESETS.riya, { name: 'Teacher A' }),
    who(CAST_PRESETS.arjun, { name: 'Teacher B', accessories: { belt: true, glasses: 'rect' } }),
  ]
  const tx = (sg: number, c: number) =>
    along(c, [
      [0, 0, sg * E19.tStart],
      [T19.out[0], T19.out[1], sg * E19.tEnd],
      [T19.back[0], T19.back[1], sg * E19.tStart],
    ])
  const teachers = [-1, 1].map((sg, i) => {
    const h = TCH_H[i]
    const sp = person({
      config: tcfg[i],
      seed: 1901 + i,
      faces: [[0, 'thinking'], [1.1, 'surprised'], [1.6, 'happy'], [3.3, 'excited'], [4.6, 'happy'], [6.8, 'neutral']],
      loop: L19,
      frames: F19,
      height: h,
      redraw,
      holdT: devHold(HOLD19),
      pose: (p, c) => {
        const w = tx(sg, c)
        walkLegs(p, c, w.walking, w.dir)
        /* at the board: looking up at it (it is behind them, between them) */
        const atBoard = 1 - seg(c, T19.out[0] - 0.15, T19.out[0] + 0.15) + seg(c, T19.back[1] - 0.2, T19.back[1] + 0.1)
        lookAt(p, -sg * 0.6, clamp01(atBoard), -0.4)
        /* teaching: turned to the pupils, a hand up to the whiteboard */
        const tw = hold(c, T19.point[0], T19.point[1], T19.point[2], T19.point[3])
        lookAt(p, sg * 0.8, tw * 0.9, -0.3)
        /* the arm nearer the room's whiteboard (screen side toward the room's centre) */
        const side = sg < 0 ? 'L' : 'R'
        const arm: Arm = { s: 124 + 5 * Math.sin(c * TAU * 0.5), e: 16 }
        if (side === 'R') {
          to(p, 'shoulderR', arm.s, tw)
          to(p, 'elbowR', arm.e, tw)
          to(p, 'palmR', 0.7, tw)
        } else {
          to(p, 'shoulderL', arm.s, tw)
          to(p, 'elbowL', arm.e, tw)
          to(p, 'palmL', 0.7, tw)
        }
      },
    })
    sp.object.position.set(sg * E19.tStart, 0, E19.tz)
    scene.add(sp.object)
    return { sp, sg }
  })
  /* the pupils: each an individual, sitting at their desk, turning to their teacher once the class starts */
  const kidCfg = [
    who(CAST_PRESETS.kabir, { name: 'Pupil 1', build: { height: 0.92, shoulders: 0.9 } }),
    who(CAST_PRESETS.ananya, { name: 'Pupil 2', outfit: { top: 'tshirt', topColor: '#F27BA4', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 0.92, shoulders: 0.9 } }),
    who(CAST_PRESETS.riya, { name: 'Pupil 3', hair: { style: 'ponytail', color: '#2A2324' }, outfit: { top: 'tshirt', topColor: '#22C55E', bottom: 'jeans', bottomColor: '#1F2A4A', shoeColor: '#F2F2F5' }, build: { height: 0.92, shoulders: 0.9 } }),
    who(CAST_PRESETS.dev, { name: 'Pupil 4', hair: { style: 'buzz', color: '#262B43' }, accessories: { glasses: 'none', watch: false }, outfit: { top: 'polo', topColor: '#5B88FF', bottom: 'trousers', bottomColor: '#1F2A4A', shoeColor: '#2A2A30' }, build: { height: 0.92, shoulders: 0.9 } }),
  ]
  const kids = rooms.flatMap((r, ri) =>
    r.kidXs.map((x, k) => {
      const i = ri * 2 + k
      const sp = castSprite({
        config: kidCfg[i],
        dress: backView,
        loop: L19,
        frames: FS19,
        height: KID_H,
        wide: 40,
        px: PX,
        shadow: 0.2,
        onReady: redraw,
        timeline: (c) => ({ seed: 1910 + i, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false, blink: Math.abs(c - devHold(HOLD19)) > 0.35 }, life: 0, ...faceAt(c, [[0, 'neutral'], [3.1, 'listening'], [4.2, 'happy'], [6.8, 'neutral']], L19) }),
        pose: (p, c) => {
          /* seen from behind: the head turns and tilts a little toward the teacher once the class starts (the ears
             shift and the back of the head leans her way) */
          const on = hold(c, T19.lamp[0], T19.lamp[1], T19.off[0], T19.off[1])
          const tw = r.sg < 0 ? 1 : -1
          to(p, 'headTurn', 0.35 * tw, on)
          to(p, 'headTilt', 5 * tw, on)
          to(p, 'shoulderL', 12, 1)
          to(p, 'shoulderR', 12, 1)
          to(p, 'elbowL', 20, 1)
          to(p, 'elbowR', 20, 1)
        },
      })
      seated(sp)
      sp.object.position.set(x, 0, E19.kidZ)
      scene.add(sp.object)
      return sp
    }),
  )
  const clk = slideClock('S19T19', scene, devHold(HOLD19), [...teachers.map((t) => t.sp), ...kids])
  return (t: number) => {
    const c = mod(clk.time(t), L19)
    for (const tc of teachers) {
      const w = tx(tc.sg, c)
      tc.sp.object.position.x = w.x
      tc.sp.object.position.y = bob(w.walking, c)
      tc.sp.update(c, camera)
    }
    kids.forEach((k) => k.update(c, camera))
    /* the bell rings, the period's row lights until the period ends */
    const ring = hold(c, T19.bell, T19.bell + 0.05, T19.bell + 0.5, T19.bell + 0.6)
    bell.rotation.z = ring * 0.32 * Math.sin((c - T19.bell) * TAU * 6)
    waves.forEach((m, i) => {
      const k = clamp01((c - T19.bell - i * 0.22) / 0.6)
      m.scale.setScalar(1 + k * 1.2)
      setOp(m, c >= T19.bell + i * 0.22 && k < 1 ? 0.8 * (1 - k) : 0)
    })
    setOp(rowGlow, 0.55 * hold(c, T19.bell, T19.bell + 0.2, T19.back[1] - 0.3, T19.back[1]) * (0.85 + 0.15 * Math.sin(c * TAU * 0.8)))
    /* both rooms light up together and their whiteboards fill; both go dark when the period ends */
    const on = hold(c, T19.lamp[0], T19.lamp[1], T19.off[0], T19.off[1])
    for (const r of rooms) {
      r.bulbM.color.set(on > 0.5 ? '#FFE9A8' : '#E6E9F0')
      setOp(r.lampGlow, 0.55 * on)
      r.strokes.forEach((m, i) => {
        const k = seg(c, T19.write[0] + i * 0.22, T19.write[0] + i * 0.22 + 0.35)
        m.scale.x = Math.max(0.001, k)
        setOp(m, 1 - seg(c, T19.back[1] - 0.2, T19.back[1] + 0.2))
      })
    }
    roomWalls.forEach((m) => (m.emissiveIntensity = 0.12 + 0.22 * on))
  }
}

/* ------------------------------------------------------------------ T19 concept: one compose file starts two services */

function setupT19Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  setCam(camera, CAM19, AT19, FOV19)
  lights(scene, [0, 1.0, -0.4], 2.8)
  corridor19(scene, true)
  wallPanel(scene, -PART, PART, '#DCE6F4')
  const zoneWalls = [-1, 1].map((sg) => wallPanel(scene, sg < 0 ? -2.6 : PART, sg < 0 ? -PART : 2.6, '#E4ECFA'))
  const partM = mat('#F7F9FD', { roughness: 0.8 })
  for (const sg of [-1, 1]) scene.add(box(0.1, 2.4, 0.72, partM, [sg * PART, 1.2, WALL19 + 0.36], 0.01))
  /* the compose file where the timetable hangs: a white sheet on the wall, its folded corner, the same row lighting */
  const file = new THREE.Group()
  file.add(box(0.7, 0.86, 0.03, mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.1 }), [0, 0, 0], 0.012))
  file.add(picture(composeTex(), 0.66, 0.825, [0, 0, 0.017], { transparent: false }))
  file.position.set(0, 1.5, WALL19 + 0.07)
  scene.add(file)
  const rowGlow = picture(canvasTex(8, 8, (k) => rr(k, 0, 0, 8, 8, 2, '#FFE27A')), 0.62, 0.32, [0, 1.5 + 0.4125 - (0.825 * (30 + 1 * 28 + 5 + 56)) / 300, WALL19 + 0.09], { depthWrite: false, opacity: 0 })
  rowGlow.renderOrder = 4
  scene.add(rowGlow)
  /* the start button where the bell is: a round blue button with a play mark */
  const btn = picture(
    canvasTex(64, 64, (k) => {
      k.fillStyle = '#2D63FB'
      k.beginPath()
      k.arc(32, 32, 30, 0, TAU)
      k.fill()
      k.fillStyle = '#FFFFFF'
      k.beginPath()
      k.moveTo(25, 19)
      k.lineTo(46, 32)
      k.lineTo(25, 45)
      k.closePath()
      k.fill()
    }),
    0.22,
    0.22,
    [0, 2.12, WALL19 + 0.1],
    { depthWrite: false },
  )
  btn.renderOrder = 5
  scene.add(btn)
  const waves = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.135, 40), new THREE.MeshBasicMaterial({ color: '#2D63FB', transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
    m.position.set(0, 2.12, WALL19 + 0.11)
    m.renderOrder = 5
    scene.add(m)
    return m
  })
  /* the two services where the classrooms are: a container on a plinth, a globe on web, a database stack on db */
  const bodyM = (c: string) => mat(c, { roughness: 0.35, emissive: new THREE.Color(c), emissiveIntensity: 0.1 })
  const services = [-1, 1].map((sg, i) => {
    const cx = sg * ROOM
    const g = new THREE.Group()
    const col = i ? '#1F9D57' : '#2D63FB'
    const dark = i ? '#157A42' : '#1F47C4'
    g.add(box(0.98, 0.16, 0.66, mat('#FFFFFF', { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.15 }), [0, 0.08, 0], 0.02))
    const bm = bodyM(col)
    g.add(box(0.8, 0.78, 0.5, bm, [0, 0.16 + 0.39, 0], 0.03))
    for (let r = 0; r < 5; r++) g.add(flat(box(0.026, 0.66, 0.012, mat(dark, { roughness: 0.35 }), [-0.26 + r * 0.13, 0.55, 0.256], 0.006)))
    for (const y of [0.19, 0.91]) g.add(flat(box(0.804, 0.04, 0.504, mat(dark, { roughness: 0.35 }), [0, y, 0], 0.01)))
    /* what it runs, on top */
    if (!i) {
      const globe = new THREE.Group()
      globe.add(mesh(new THREE.SphereGeometry(0.16, 32, 20), mat('#5B88FF', { roughness: 0.3, emissive: new THREE.Color('#5B88FF'), emissiveIntensity: 0.15 })))
      for (const rx of [0, Math.PI / 2]) {
        const ring = mesh(new THREE.TorusGeometry(0.162, 0.008, 8, 48), mat('#FFFFFF', { roughness: 0.4 }))
        ring.rotation.y = rx
        globe.add(ring)
      }
      const eq = mesh(new THREE.TorusGeometry(0.162, 0.008, 8, 48), mat('#FFFFFF', { roughness: 0.4 }))
      eq.rotation.x = Math.PI / 2
      globe.add(eq)
      globe.position.set(0, 1.13, 0)
      g.add(globe)
    } else {
      for (let k = 0; k < 3; k++) g.add(cyl(0.15, 0.15, 0.08, mat(k % 2 ? '#22C55E' : '#2FB866', { roughness: 0.35, emissive: new THREE.Color('#22C55E'), emissiveIntensity: 0.12 }), [0, 1.0 + k * 0.095, 0], 36))
    }
    /* its status light and its front screen, whose lines fill as it starts (the whiteboard's place) */
    const ledM = new THREE.MeshBasicMaterial({ color: '#9AA4B4', toneMapped: false })
    g.add(mesh(new THREE.SphereGeometry(0.022, 12, 8), ledM, [0.32, 0.86, 0.262]))
    g.position.set(cx, 0, -0.62)
    scene.add(g)
    const glow = halo(i ? 'rgba(170,240,200,0.95)' : 'rgba(180,205,255,0.95)', 1.3, 1.1, 0)
    glow.position.set(cx, 0.62, WALL19 + 0.12)
    scene.add(glow)
    return { cx, g, sg, ledM, bm, glow }
  })
  /* the start signals where the teachers walk: a glowing orb in each service's colour */
  const orbs = [-1, 1].map((sg, i) => {
    const m = mesh(new THREE.SphereGeometry(0.075, 24, 16), new THREE.MeshBasicMaterial({ color: i ? '#22C55E' : '#2D63FB', toneMapped: false, transparent: true }))
    const g = halo(i ? 'rgba(120,230,160,0.9)' : 'rgba(120,160,255,0.9)', 0.36, 0.36, 0.7)
    m.add(g)
    scene.add(m)
    return { m, sg }
  })
  /* the link between web and db: a cable along the floor in front of the file, a request riding it */
  const linkPts = [new THREE.Vector3(-ROOM + 0.42, 0.06, -0.3), new THREE.Vector3(-0.3, 0.02, -0.05), new THREE.Vector3(0.3, 0.02, -0.05), new THREE.Vector3(ROOM - 0.42, 0.06, -0.3)]
  const link = new THREE.CatmullRomCurve3(linkPts)
  const linkM = mat('#9AA4B4', { roughness: 0.5, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0 })
  scene.add(mesh(new THREE.TubeGeometry(link, 40, 0.014, 8), linkM))
  const req = mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshBasicMaterial({ color: '#F6B400', toneMapped: false, transparent: true }))
  scene.add(req)
  const tx = (sg: number, c: number) =>
    along(c, [
      [0, 0, sg * TSTART],
      [T19.out[0], T19.out[1], sg * TEND],
      [T19.back[0], T19.back[1], sg * TSTART],
    ]).x
  const clk = slideClock('S19T19', scene, devHold(HOLD19), [{ ready: Promise.resolve() }])
  return (t: number) => {
    const c = mod(clk.time(t), L19)
    const press = hold(c, T19.bell, T19.bell + 0.05, T19.bell + 0.3, T19.bell + 0.5)
    btn.scale.setScalar(1 - 0.12 * press + 0.03 * Math.sin(c * TAU * 0.8))
    waves.forEach((m, i) => {
      const k = clamp01((c - T19.bell - i * 0.22) / 0.6)
      m.scale.setScalar(1 + k * 1.2)
      setOp(m, c >= T19.bell + i * 0.22 && k < 1 ? 0.8 * (1 - k) : 0)
    })
    setOp(rowGlow, 0.5 * hold(c, T19.bell, T19.bell + 0.2, T19.back[1] - 0.3, T19.back[1]) * (0.85 + 0.15 * Math.sin(c * TAU * 0.8)))
    /* the signals ride out with the period, sink into the services, come back when it ends */
    for (const o of orbs) {
      const x = tx(o.sg, c)
      o.m.position.set(x, 1.05 + 0.03 * Math.sin(c * TAU * 1.1), TZ)
      const away = hold(c, T19.out[1] - 0.05, T19.out[1] + 0.25, T19.back[0] - 0.25, T19.back[0] + 0.05)
      o.m.scale.setScalar(1 - 0.7 * away)
      setOp(o.m, 1 - 0.85 * away)
    }
    const on = hold(c, T19.lamp[0], T19.lamp[1], T19.off[0], T19.off[1])
    for (const s of services) {
      s.ledM.color.set(on > 0.5 ? C.green : '#9AA4B4')
      s.bm.emissiveIntensity = 0.1 + 0.22 * on
      setOp(s.glow, 0.5 * on)
      s.g.position.y = 0.012 * on * Math.sin(c * TAU * 0.5 + s.sg)
    }
    zoneWalls.forEach((m) => (m.emissiveIntensity = 0.12 + 0.18 * on))
    /* while both run, a request rides from web to db and back */
    linkM.emissiveIntensity = 0.5 * on
    const ride = mod((c - T19.lamp[1]) / 1.6, 1)
    const fwd = ride < 0.5 ? ride * 2 : 2 - ride * 2
    req.position.copy(link.getPointAt(clamp01(fwd))).add(new THREE.Vector3(0, 0.03, 0))
    setOp(req, hold(c, T19.lamp[1], T19.lamp[1] + 0.2, T19.off[0], T19.off[0] + 0.2))
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
  I_T14Everyday: card('S19T14', setupT14Everyday, devHold(HOLD14)),
  I_T14Concept: card('S19T14', setupT14Concept, devHold(HOLD14)),
  I_T19Everyday: card('S19T19', setupT19Everyday, devHold(HOLD19)),
  I_T19Concept: card('S19T19', setupT19Concept, devHold(HOLD19)),
}
export const css = ''
