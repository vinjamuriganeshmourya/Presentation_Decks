import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CastSprite, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { useHeld } from '@/engine/figkit'

/**
 * BUILDER J · SESSION 17 (Security Practices & Compliance) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * built to the Session 9-16 review rules from the first draft (generate-slides standing corrections 13-17, cloud course
 * R10-R14, deck-engine "Low-end PCs"): a perspective camera and a real place; people are Character Lab characters from
 * the engine's `castSprite`, each an individual with role clothing and expressions keyed to the action; NO TEXT on either
 * card (every document, board and screen carries bars and icons, never words); one wall-clock loop per slide shared by
 * both cards beat for beat and place for place (one clock per slide, Session 16 round 3: the cards fade in once every
 * person has a first frame, fixed-size frames `px: 256`, no idle breathing), each loop ending in the state it starts in;
 * held frames (`?still`, thumbnails) draw the telling moment at HOLD.
 *
 * SLIDE 42 · T17-AN (TR 17): "A restaurant's hygiene certificate assures diners of safe food without them inspecting the
 * kitchen themselves: just as ISO 27001 and SOC 2 assure customers of a cloud vendor's security practices without
 * customers auditing every control themselves."
 *
 *   place            everyday: a restaurant's order counter         concept: a cloud vendor's service counter
 *   left             two diners                                     two business customers
 *   back wall        the framed hygiene certificate (gold seal)     the ISO 27001 certificate and the SOC 2 report
 *   counter          a covered dish under a silver cloche           the vendor's service (a cloud) under a glass dome
 *   behind counter   the server in an apron                         the vendor's representative (navy, lanyard)
 *   right            the kitchen door, SHUT all loop                the data centre door, SHUT all loop
 *   0.3 - 1.7        she points to the certificate; it glows, its   she points to the certificate and the report; they
 *                    seal turns; the diners look up and nod          glow in turn; the customers look up and nod
 *   2.2 - 3.2        she lifts the cloche: a steaming dish          she lifts the dome: the cloud service lights up
 *   3.2 - 5.6        the diners are delighted (nobody went into     the customers are delighted (nobody opened the
 *                    the kitchen)                                    data centre)
 *   5.6 - 6.6        the cloche goes back down                      the dome goes back down
 *
 * SLIDE 46 · T19-AN (TR 19): "A library allows members to access, borrow or renew books under clearly defined rules,
 * while keeping their personal details secure: just as data privacy laws define how organisations can collect, use and
 * protect personal information."
 *
 *   place            everyday: a library's issue desk               concept: an organisation's data desk
 *   left             the member                                     the person whose data it is
 *   back wall        bookshelves; the rules board                   the data shelves; the policy board (a shield)
 *   desk             the book, the date stamp, a locked card drawer the person's data file, the consent stamp, a
 *                                                                    locked vault drawer
 *   behind desk      the librarian                                  the organisation's data handler
 *   0.0 - 1.0        the rules board lights                         the policy board lights
 *   0.3 - 1.6        she stamps the book                            she stamps the file with consent
 *   1.6 - 2.9        she hands it over: the member borrows it       she hands it over: the person accesses the data
 *   3.0 - 4.6        she opens the card drawer, his card glows      she opens the vault drawer, his ID record glows
 *                    safe inside, the drawer shuts and locks         safe inside, the drawer shuts and locks
 *   4.7 - 6.4        he hands it back to renew; it goes back down   he hands it back; it goes back on the desk
 */

const W = 470
const H = 390
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devT = (fallback: number) => {
  if (typeof window === 'undefined') return fallback
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : fallback
}

/* ------------------------------------------------------------------ small maths */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a))
/** 1 between b and c, easing up from a and down to d */
const hold = (t: number, a: number, b: number, c: number, d: number) => seg(t, a, b) * (1 - seg(t, c, d))
const mod = (t: number, l: number) => ((t % l) + l) % l
const TAU = Math.PI * 2
const DEG = Math.PI / 180

/* ------------------------------------------------------------------ textures (drawn at 3x, crisp on a 4K screen) */

const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
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
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}
/** text-free "writing": rounded bars of a document */
function bars(g: CanvasRenderingContext2D, x: number, y: number, w: number, rows: number, gap: number, color: string, hgt = 3) {
  g.fillStyle = color
  for (let i = 0; i < rows; i++) {
    const ww = w * (i % 3 === 2 ? 0.62 : i % 2 ? 0.86 : 1)
    rrect(g, x, y + i * gap, ww, hgt, hgt / 2)
    g.fill()
  }
}
function check(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, lw = 3) {
  g.strokeStyle = color
  g.lineWidth = lw
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(x - s * 0.5, y)
  g.lineTo(x - s * 0.12, y + s * 0.38)
  g.lineTo(x + s * 0.55, y - s * 0.42)
  g.stroke()
}
/** a rosette seal: scalloped disc, inner ring, two ribbon tails (drawn separately so the disc can turn) */
const rosetteTex = (fill: string, rim: string, mark: 'check' | 'globe') =>
  canvasTex(64, 64, (g) => {
    g.fillStyle = rim
    g.beginPath()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU
      const r = i % 2 ? 29 : 31.5
      g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r)
    }
    g.closePath()
    g.fill()
    g.fillStyle = fill
    g.beginPath()
    g.arc(32, 32, 24, 0, TAU)
    g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.7)'
    g.lineWidth = 1.6
    g.beginPath()
    g.arc(32, 32, 20, 0, TAU)
    g.stroke()
    if (mark === 'check') check(g, 32, 32, 20, '#FFFFFF', 4)
    else {
      g.strokeStyle = '#FFFFFF'
      g.lineWidth = 2.2
      g.beginPath()
      g.arc(32, 32, 11, 0, TAU)
      g.moveTo(21, 32)
      g.lineTo(43, 32)
      g.stroke()
      g.beginPath()
      g.ellipse(32, 32, 5, 11, 0, 0, TAU)
      g.stroke()
    }
  })
const floorPlanks = (a: string, b: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i % 2 ? a : b
        g.fillRect(0, i * 32, 128, 32)
        g.fillStyle = joint
        g.fillRect(0, i * 32, 128, 1.5)
        g.fillRect((i * 47) % 128, i * 32, 1.5, 32)
      }
    },
    repeat,
  )
const tileTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 2
      g.strokeRect(1, 1, 126, 126)
    },
    repeat,
  )

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: [number, number, number], segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)

/** static parts merged into one mesh per material (few draw calls) */
function bake(g: THREE.Group, shadows = true): THREE.Group {
  g.updateMatrixWorld(true)
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>()
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    let geo = m.geometry.clone().applyMatrix4(m.matrixWorld)
    if (geo.index) geo = geo.toNonIndexed()
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k)
    const mt = m.material as THREE.Material
    byMat.set(mt, [...(byMat.get(mt) ?? []), geo])
  })
  const out = new THREE.Group()
  for (const [mt, geos] of byMat) {
    const merged = mergeGeometries(geos, false)
    if (!merged) continue
    const mm = new THREE.Mesh(merged, mt)
    mm.castShadow = shadows
    mm.receiveShadow = true
    out.add(mm)
  }
  return out
}
const flat = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const glow = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity })
const noShadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => (n.castShadow = false))
  return o
}
/** a plane facing +z */
const plane = (w: number, h: number, m: THREE.Material, pos: [number, number, number]) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  p.position.set(...pos)
  return p
}
let haloTexCache: THREE.Texture | null = null
/** a soft round glow, facing +z */
function halo(color: string, r: number) {
  haloTexCache ??= canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 64, 64)
  })
  const m = new THREE.MeshBasicMaterial({ map: haloTexCache, color, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })
  const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m)
  p.renderOrder = 4
  return { mesh: p, mat: m }
}
function setCamera(camera: THREE.PerspectiveCamera, pos: [number, number, number], at: [number, number, number], fov: number) {
  camera.fov = fov
  camera.position.set(...pos)
  camera.lookAt(...at)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

/* ------------------------------------------------------------------ Character Lab people */

const who = (base: CharacterConfig, o: { name: string; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: CharacterConfig['accessories']; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone']; gender?: CharacterConfig['gender'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, mouth: 'full', ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: o.accessories ?? base.accessories,
  build: { ...base.build, ...o.build },
})
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
const both = (a: (k: Skin) => Skin, b: (k: Skin) => Skin) => (k: Skin) => b(a(k))

/* role clothing, rig body frame 400 x 600 (Session 16's drawings) */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
  </g>
)
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
const CARDIGAN = (color: string, edge: string) => (
  <g data-part="cardigan">
    <path d="M 150 212 L 190 212 L 196 300 L 192 372 L 150 372 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 210 212 L 204 300 L 208 372 L 250 372 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    {[262, 292, 322, 352].map((y) => (
      <circle key={y} cx={190} cy={y} r={3} fill={edge} />
    ))}
  </g>
)
const LANYARD = (color: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={184} y={288} width={32} height={40} rx={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
    <circle cx={200} cy={302} r={6} fill={color} opacity={0.65} />
    <rect x={190} y={312} width={20} height={4} rx={2} fill={color} opacity={0.55} />
  </g>
)

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping over loop `L`) */
function faceAt(c: number, keys: [number, string][], L: number): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - L
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - L
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = mix((p as Record<string, number>)[ch], v, clamp01(w))
}
/** a person on the engine's castSprite: fixed 256 px frames (Session 16 round 3: no re-size flicker), no breathing (a
 *  still pose is one shared frame), no blink near the held moment (a ?still frame never shows closed eyes) */
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT: number }): CastSprite {
  const quiet = (c: number) => Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 60,
    px: 256,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* ---- arms, solved in the rig's frame (Arm.tsx: the right arm is the left one mirrored about x 200) ---- */

const SHOULDER_Y = 205
const UPPER = 95
const FORE = 85 + 14
type Pt = { x: number; y: number }
type Ang = { s: number; e: number }
function solveL(sh: number, p: Pt): Ang {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D))))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
}
function solveLDown(sh: number, p: Pt): Ang {
  const a = solveL(sh, p)
  const px = 200 - (sh - 6)
  const ad = Math.atan2(-(p.x - px), p.y - SHOULDER_Y) / DEG
  const beta = a.s - ad
  return { s: ad - beta, e: -a.e }
}
const solveR = (sh: number, p: Pt, down = false): Ang => (down ? solveLDown : solveL)(sh, { x: 400 - p.x, y: p.y })
const solveLx = (sh: number, p: Pt, down = false): Ang => (down ? solveLDown : solveL)(sh, p)
function fkL(sh: number, a: Ang): Pt {
  const px = 200 - (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px - Math.sin(s) * UPPER - Math.sin(f) * FORE, y: SHOULDER_Y + Math.cos(s) * UPPER + Math.cos(f) * FORE }
}
const fkR = (sh: number, a: Ang): Pt => {
  const q = fkL(sh, a)
  return { x: 400 - q.x, y: q.y }
}
function angAt(c: number, keys: [number, Ang][]): Ang {
  if (c <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (c <= keys[i][0]) {
      const k = seg(c, keys[i - 1][0], keys[i][0])
      return { s: mix(keys[i - 1][1].s, keys[i][1].s, k), e: mix(keys[i - 1][1].e, keys[i][1].e, k) }
    }
  }
  return keys[keys.length - 1][1]
}
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = h / 0.93 / 600
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
function worldToRig(k: THREE.Vector3, root: THREE.Vector3, h: number, camera: THREE.Camera): Pt {
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const n = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi))
  const ray = k.clone().sub(cam)
  const t = n.dot(root.clone().sub(cam)) / n.dot(ray)
  const p = cam.clone().addScaledVector(ray, t)
  const u = h / 0.93 / 600
  const lx = Math.cos(phi) * (p.x - root.x) - Math.sin(phi) * (p.z - root.z)
  return { x: 200 + lx / u, y: 600 - (p.y - root.y) / u }
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** a sprite's frame time for loop time c (the frame on screen), so a prop follows the hand that is drawn */
const frameTime = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)
const REST_L: Ang = { s: 8, e: 14 }
const REST_R: Ang = { s: 8, e: 14 }

/* ================================================================== one playback clock per slide (Session 16's clock.tsx,
   kept private to this file): both cards on one clock, the cards fade in once every person has a first frame, tap to pause */

type Clock = { users: number; scenes: number; pending: number; ready: boolean; start: number; offset: number; lastNow: number; c: number }
const CARDS = 2
const READY_CAP = 1500
const clocks = new Map<string, Clock>()
type Flag = { on: boolean; fns: Set<(on: boolean) => void> }
const shownM = new Map<string, Flag>()
const pauseM = new Map<string, Flag>()
const flagOf = (m: Map<string, Flag>, key: string) => {
  let p = m.get(key)
  if (!p) m.set(key, (p = { on: false, fns: new Set() }))
  return p
}
const setFlag = (m: Map<string, Flag>, key: string, on: boolean) => {
  const p = flagOf(m, key)
  if (p.on === on) return
  p.on = on
  p.fns.forEach((f) => f(on))
}
const frameNow = () => {
  const t = typeof document !== 'undefined' ? document.timeline?.currentTime : null
  return typeof t === 'number' ? t : performance.now()
}
function slideClock(key: string, scene: THREE.Scene, holdT: number, people: { ready: Promise<void> }[]) {
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
    setFlag(shownM, key, true)
  }
  for (const p of people)
    p.ready.then(() => {
      ck.pending--
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  const anchor = new THREE.Object3D()
  anchor.userData.dispose = () => {
    ck.users--
    if (ck.users <= 0) {
      clocks.delete(key)
      setFlag(pauseM, key, false)
      setFlag(shownM, key, false)
    }
  }
  scene.add(anchor)
  return {
    time(t: number): number {
      if (t === holdT) return holdT
      if (!ck.ready) return 0
      const now = frameNow()
      if (now !== ck.lastNow) {
        if (flagOf(pauseM, key).on) ck.offset += Math.max(0, now - ck.lastNow)
        ck.lastNow = now
        ck.c = (now - ck.start - ck.offset) / 1000
      }
      return ck.c
    },
  }
}
let down: { x: number; y: number; t: number } | null = null
function ClockCard({ id, children }: { id: string; children: ReactNode }) {
  const held = useHeld()
  const [on, setOn] = useState(() => flagOf(pauseM, id).on)
  const [seen, setSeen] = useState(() => flagOf(shownM, id).on)
  useEffect(() => {
    const p = flagOf(pauseM, id)
    const v = flagOf(shownM, id)
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
        const d = down
        down = null
        if (e.button > 0 || !d || performance.now() - d.t > 500 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
        setFlag(pauseM, id, !flagOf(pauseM, id).on)
      }}
      style={{ position: 'relative', width: W, height: H, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
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

/* ================================================================== shared camera */

const CAM = { pos: [0.1, 1.7, 4.5] as [number, number, number], at: [0.08, 1.08, -0.3] as [number, number, number], fov: 33 }
const WALL_Z = -0.6

/* ================================================================== T17: the counter, the certificate, the shut door */

const L17 = 7.2
const F17 = 96
const HOLD17 = 3.95
const P17 = {
  /* the counter */
  cx0: 0.16,
  cx1: 1.3,
  cz0: -0.22,
  cz1: 0.2,
  ch: 1.0,
  /* the covered dish on the counter, the diners' side */
  dish: new THREE.Vector3(0.42, 1.0, 0.02),
  lift: 0.38,
  /* people */
  dinerW: new THREE.Vector3(-1.2, 0, 0.22),
  dinerM: new THREE.Vector3(-0.47, 0, 0.4),
  server: new THREE.Vector3(0.86, 0, -0.4),
  hW: 1.6,
  hM: 1.74,
  hS: 1.62,
  /* the certificate on the back wall, above the diners' heads */
  cert: new THREE.Vector3(-0.5, 2.04, WALL_Z + 0.03),
  /* the door at the right */
  doorX: 1.66,
}
const B17 = {
  point: [0.3, 0.75] as [number, number],
  glow: [0.6, 1.8] as [number, number],
  unpoint: [1.7, 2.2] as [number, number],
  grip: [2.2, 2.4] as [number, number],
  up: [2.45, 3.15] as [number, number],
  downS: [5.6, 6.3] as [number, number],
  release: [6.35, 6.95] as [number, number],
}
const domeUp = (c: number) => seg(c, B17.up[0], B17.up[1]) * (1 - seg(c, B17.downS[0], B17.downS[1]))

type T17Look = {
  bg: string
  floor: THREE.Texture
  wall: string
  trim: string
  counterBody: string
  counterTop: string
  counterBand: string
  /** the wall documents: centre x, width, height, texture, and whether a rosette sits on it */
  docs: { x: number; w: number; h: number; tex: THREE.Texture; frame: string; seal?: { tex: THREE.Texture; dx: number; dy: number; r: number; ribbon: string } }[]
  door: (St: THREE.Group, scene: THREE.Scene) => void
  dome: () => { group: THREE.Group; knobH: number }
  dish: (scene: THREE.Scene) => { group: THREE.Group; tick: (c: number, up: number) => void }
  extras: (St: THREE.Group, scene: THREE.Scene) => { tick: (c: number) => void }
  diners: [CharacterConfig, ((s: Skin) => Skin) | undefined, CharacterConfig, ((s: Skin) => Skin) | undefined]
  server: [CharacterConfig, (s: Skin) => Skin]
  clock: string
}

function setupT17(kit: StageKit, look: T17Look): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color(look.bg)
  setCamera(camera, CAM.pos, CAM.at, CAM.fov)
  lightRig(scene, [0.1, 0.6, -0.3])
  const St = new THREE.Group()

  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: look.floor, roughness: 0.5 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  St.add(box(12, 3.8, 0.1, mat(look.wall, { roughness: 0.95, emissive: new THREE.Color(look.wall), emissiveIntensity: 0.28 }), [0, 1.9, WALL_Z - 0.05]))
  St.add(box(12, 0.12, 0.03, mat(look.trim, { roughness: 0.6 }), [0, 0.06, WALL_Z + 0.015]))
  St.add(box(12, 0.04, 0.03, mat(look.trim, { roughness: 0.6 }), [0, 1.0, WALL_Z + 0.015]))

  /* the counter: body, top, a band; the server stands behind it (the body hides her below the waist) */
  const { cx0, cx1, cz0, cz1, ch } = P17
  St.add(box(cx1 - cx0, ch - 0.05, cz1 - cz0, mat(look.counterBody, { roughness: 0.7 }), [(cx0 + cx1) / 2, (ch - 0.05) / 2, (cz0 + cz1) / 2]))
  St.add(box(cx1 - cx0 + 0.08, 0.05, cz1 - cz0 + 0.08, mat(look.counterTop, { roughness: 0.35 }), [(cx0 + cx1) / 2, ch - 0.025, (cz0 + cz1) / 2], 0.015))
  St.add(box(cx1 - cx0 + 0.005, 0.07, 0.01, mat(look.counterBand, { roughness: 0.5 }), [(cx0 + cx1) / 2, ch - 0.2, cz1 + 0.003]))

  /* the wall documents in their frames */
  const certHalo = halo('#FFE7A3', 0.62)
  certHalo.mesh.position.set(P17.cert.x, P17.cert.y, WALL_Z + 0.01)
  scene.add(certHalo.mesh)
  const seals: { mesh: THREE.Mesh; i: number }[] = []
  const docGlow: { mat: THREE.MeshBasicMaterial; i: number }[] = []
  look.docs.forEach((d, i) => {
    const y = P17.cert.y
    const z = WALL_Z + 0.02
    St.add(box(d.w + 0.06, d.h + 0.06, 0.03, mat(d.frame, { roughness: 0.4, metalness: 0.3 }), [d.x, y, z], 0.01))
    St.add(plane(d.w, d.h, flat(d.tex, { transparent: false }), [d.x, y, z + 0.0155]))
    if (look.docs.length > 1) {
      const hl = halo('#BFD3FF', Math.max(d.w, d.h) * 0.75)
      hl.mesh.position.set(d.x, y, WALL_Z + 0.008)
      scene.add(hl.mesh)
      docGlow.push({ mat: hl.mat, i })
    }
    if (d.seal) {
      const s = d.seal
      /* the ribbon tails under the seal */
      const rib = mat(s.ribbon, { roughness: 0.5 })
      for (const sx of [-1, 1]) {
        const tail = box(s.r * 0.42, s.r * 1.1, 0.004, rib, [d.x + s.dx + sx * s.r * 0.32, y + s.dy - s.r * 0.75, z + 0.019])
        tail.rotation.z = sx * 0.28
        St.add(tail)
      }
      const sm = new THREE.Mesh(new THREE.CircleGeometry(s.r, 40), flat(s.tex))
      sm.position.set(d.x + s.dx, y + s.dy, z + 0.024)
      scene.add(sm)
      seals.push({ mesh: sm, i })
    }
  })

  look.door(St, scene)
  const extras = look.extras(St, scene)
  scene.add(bake(St))

  /* the dish (food / the cloud service) and the cover over it */
  const dish = look.dish(scene)
  dish.group.position.copy(P17.dish)
  scene.add(dish.group)
  const dome = look.dome()
  noShadow(dome.group)
  scene.add(dome.group)

  /* ---- the server ---- */
  const S_ = P17.server
  const [srvCfg, srvDress] = look.server
  const shS = buildSkin(srvCfg).shoulderHalf
  const knobAt = P17.dish.clone().add(new THREE.Vector3(0, dome.knobH, 0))
  const aKnob = solveLx(shS, worldToRig(knobAt, S_, P17.hS, camera), true)
  const aLift = solveLx(shS, worldToRig(knobAt.clone().add(new THREE.Vector3(0.02, P17.lift, 0.06)), S_, P17.hS, camera), true)
  const aPoint = solveLx(shS, worldToRig(P17.cert, S_, P17.hS, camera))
  const armS = (c: number) =>
    angAt(c, [
      [B17.point[0], REST_L],
      [B17.point[1], aPoint],
      [B17.unpoint[0], aPoint],
      [B17.grip[0], aKnob],
      [B17.grip[1], aKnob],
      [B17.up[1], aLift],
      [B17.downS[0], aLift],
      [B17.downS[1], aKnob],
      [B17.release[0], aKnob],
      [B17.release[1], REST_L],
    ])
  const server = person({
    config: srvCfg,
    dress: srvDress,
    seed: 1701,
    loop: L17,
    frames: F17,
    height: P17.hS,
    redraw,
    holdT: HOLD17,
    faces: [
      [0, 'happy'],
      [B17.unpoint[0], 'listening'],
      [B17.up[0], 'proud'],
      [B17.downS[1], 'happy'],
    ],
    pose: (p, c) => {
      const a = armS(c)
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -4
      const pointing = hold(c, B17.point[0], B17.point[1], B17.unpoint[0], B17.unpoint[1])
      const gripping = c >= B17.grip[0] && c < B17.release[0] + 0.1 ? 1 : 0
      p.fL1 = mix(0.62 * gripping + 0.25 * (1 - gripping), 0.02, pointing)
      p.fL2 = p.fL3 = p.fL4 = mix(0.62 * gripping + 0.3 * (1 - gripping), 0.9, pointing)
      p.tL = 0.55 * gripping + 0.6 * pointing
      /* the other hand resting on the counter edge */
      p.shoulderR = 14
      p.elbowR = 44
      /* she faces the diners; up at the certificate while she points; down at the dish as she lifts it */
      to(p, 'headTurn', -0.42, 1)
      to(p, 'lookX', -0.9, 1)
      to(p, 'lookY', -0.45, pointing)
      to(p, 'headNod', -0.08, pointing)
      const atDish = hold(c, B17.grip[0] - 0.2, B17.grip[0], B17.up[0] + 0.3, B17.up[1]) + hold(c, B17.downS[1] - 0.3, B17.downS[1], B17.release[0], B17.release[1])
      to(p, 'lookY', 0.55, atDish)
      to(p, 'headNod', 0.2, atDish)
    },
  })
  server.object.position.copy(S_)
  scene.add(server.object)

  /* ---- the diners ---- */
  const [wCfg, wDress, mCfg, mDress] = look.diners
  const W_ = P17.dinerW
  const M_ = P17.dinerM
  const shW = buildSkin(wCfg).shoulderHalf
  const shM = buildSkin(mCfg).shoulderHalf
  /* her hands come together at her chest in delight; his right hand opens toward the dish */
  const wChest = solveR(shW, { x: 296, y: 340 }, true)
  const mOpen = solveR(shM, { x: 330, y: 262 }, true)
  const delight = (c: number) => hold(c, B17.up[1] - 0.1, B17.up[1] + 0.35, B17.downS[0] - 0.1, B17.downS[0] + 0.4)
  const lookUp = (c: number) => hold(c, B17.point[0] + 0.15, B17.point[1] + 0.1, B17.glow[1] - 0.1, B17.glow[1] + 0.3)
  const diner = (cfg: CharacterConfig, dress: ((s: Skin) => Skin) | undefined, seed: number, h: number, isW: boolean) =>
    person({
      config: cfg,
      dress,
      seed,
      loop: L17,
      frames: F17,
      height: h,
      redraw,
      holdT: HOLD17,
      faces: [
        [0, 'neutral'],
        [B17.point[0] + 0.1, 'thinking'],
        [B17.glow[0] + 0.5, isW ? 'happy' : 'proud'],
        [B17.up[1] - 0.1, isW ? 'excited' : 'happy'],
        [B17.downS[1], 'happy'],
        [B17.release[1], 'neutral'],
      ],
      pose: (p, c) => {
        const d = delight(c)
        if (isW) {
          /* an open palm toward the dish: delighted */
          p.shoulderR = mix(REST_R.s, wChest.s, d)
          p.elbowR = mix(REST_R.e, wChest.e, d)
          p.fR1 = p.fR2 = p.fR3 = p.fR4 = mix(0.3, 0.06, d)
          p.palmR = mix(0.3, 0.9, d)
          p.shoulderL = REST_L.s
          p.elbowL = REST_L.e
        } else {
          p.shoulderR = mix(REST_R.s, mOpen.s, d)
          p.elbowR = mix(REST_R.e, mOpen.e, d)
          p.fR1 = p.fR2 = p.fR3 = p.fR4 = mix(0.3, 0.05, d)
          p.palmR = mix(0.3, 0.9, d)
          p.shoulderL = REST_L.s
          p.elbowL = REST_L.e
        }
        /* both face the counter (to their right), look up at the certificate, then at the dish */
        const base = isW ? 0.4 : 0.34
        to(p, 'headTurn', base, 1)
        to(p, 'lookX', 0.85, 1)
        const u = lookUp(c)
        to(p, 'headTurn', isW ? 0.28 : 0.06, u)
        to(p, 'lookX', isW ? 0.45 : 0.05, u)
        to(p, 'lookY', -0.75, u)
        to(p, 'headNod', -0.16, u)
        /* a nod once the certificate has glowed */
        const nod = hold(c, B17.glow[1] - 0.45, B17.glow[1] - 0.35, B17.glow[1] + 0.05, B17.glow[1] + 0.2)
        p.headNod += nod * 0.1 * Math.sin((c - B17.glow[1] + 0.45) * TAU * 1.6)
        to(p, 'lookY', 0.25, d)
      },
    })
  const dinerW = diner(wCfg, wDress, 1702, P17.hW, true)
  const dinerM = diner(mCfg, mDress, 1703, P17.hM, false)
  dinerW.object.position.copy(W_)
  dinerM.object.position.copy(M_)
  scene.add(dinerW.object, dinerM.object)

  const clk = slideClock(look.clock, scene, devT(HOLD17), [server, dinerW, dinerM])
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L17)
    server.update(c, camera)
    dinerW.update(c, camera)
    dinerM.update(c, camera)
    /* the cover rides her hand from the grip to the release, otherwise it sits on the dish */
    const cf = frameTime(c, L17, F17)
    const held = cf >= B17.grip[1] - 0.04 && cf < B17.release[0] + 0.02
    if (held) {
      rigToWorld(fkL(shS, armS(cf)), P17.hS, S_, camera, hand)
      towardCamera(hand, camera, 0.12)
      /* the knob in her hand; never below the dish */
      dome.group.position.set(hand.x, Math.max(P17.dish.y, hand.y - dome.knobH), hand.z)
      dome.group.rotation.z = -0.1 * domeUp(cf)
    } else {
      dome.group.position.copy(P17.dish)
      dome.group.rotation.z = 0
    }
    dish.tick(c, domeUp(cf))
    /* the certificate (and the report) glow in turn and the seal turns once */
    const gl = hold(c, B17.glow[0], B17.glow[0] + 0.35, B17.glow[1] - 0.35, B17.glow[1])
    certHalo.mat.opacity = docGlow.length ? 0 : 0.75 * gl
    for (const g of docGlow) {
      const off = g.i * 0.45
      g.mat.opacity = 0.8 * hold(c, B17.glow[0] + off, B17.glow[0] + off + 0.3, B17.glow[0] + off + 0.75, B17.glow[0] + off + 1.05)
    }
    for (const s of seals) s.mesh.rotation.z = -TAU * seg(c, B17.glow[0] + s.i * 0.45, B17.glow[0] + s.i * 0.45 + 0.9)
    extras.tick(c)
  }
}

/* ---- T17 everyday: a restaurant ---- */

const hygieneCertTex = () =>
  canvasTex(140, 100, (g) => {
    g.fillStyle = '#FFFCF3'
    g.fillRect(0, 0, 140, 100)
    g.strokeStyle = '#2F8F5B'
    g.lineWidth = 2.4
    g.strokeRect(5, 5, 130, 90)
    g.strokeStyle = '#B7D9C3'
    g.lineWidth = 1
    g.strokeRect(9, 9, 122, 82)
    /* a heading bar, a fork-and-knife emblem, lines of "text", a signature stroke */
    g.fillStyle = '#2F8F5B'
    rrect(g, 34, 15, 72, 6, 3)
    g.fill()
    g.strokeStyle = '#2F8F5B'
    g.lineWidth = 2
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(20, 18)
    g.lineTo(20, 32)
    g.moveTo(17, 18)
    g.lineTo(17, 23)
    g.moveTo(23, 18)
    g.lineTo(23, 23)
    g.moveTo(17, 23)
    g.quadraticCurveTo(20, 26, 23, 23)
    g.stroke()
    g.beginPath()
    g.moveTo(121, 18)
    g.lineTo(121, 32)
    g.stroke()
    g.beginPath()
    g.ellipse(121, 21, 2.4, 4, 0, 0, TAU)
    g.fillStyle = '#2F8F5B'
    g.fill()
    bars(g, 22, 32, 70, 6, 8, '#A9B6AD')
    g.strokeStyle = '#33415F'
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(24, 84)
    g.bezierCurveTo(30, 76, 36, 90, 42, 80)
    g.bezierCurveTo(46, 74, 50, 86, 58, 82)
    g.stroke()
  })

function restaurantDoor(St: THREE.Group, scene: THREE.Scene) {
  const x = P17.doorX
  const frameM = mat('#7A5434', { roughness: 0.55 })
  const leafM = mat('#B07A4C', { roughness: 0.6 })
  St.add(box(0.06, 2.12, 0.06, frameM, [x - 0.36, 1.06, WALL_Z + 0.03]), box(0.06, 2.12, 0.06, frameM, [x + 0.36, 1.06, WALL_Z + 0.03]))
  St.add(box(0.78, 0.06, 0.06, frameM, [x, 2.12, WALL_Z + 0.03]))
  /* two swing leaves, shut, each a round porthole and a brass kick plate */
  for (const sx of [-1, 1]) {
    St.add(box(0.33, 2.04, 0.04, leafM, [x + sx * 0.168, 1.02, WALL_Z + 0.03], 0.01))
    St.add(box(0.26, 0.16, 0.012, mat('#C9A24A', { metalness: 0.7, roughness: 0.3 }), [x + sx * 0.168, 0.2, WALL_Z + 0.056]))
    St.add(cyl(0.085, 0.085, 0.05, mat('#5B3D24', { roughness: 0.5 }), [x + sx * 0.168, 1.5, WALL_Z + 0.035], 32).rotateX(Math.PI / 2))
  }
  /* the portholes: warm kitchen light, a little steam drifting behind the glass */
  for (const sx of [-1, 1]) {
    const pm = new THREE.Mesh(new THREE.CircleGeometry(0.068, 32), glow('#FFD58A'))
    pm.position.set(x + sx * 0.168, 1.5, WALL_Z + 0.062)
    scene.add(pm)
  }
}
function cloche() {
  const g = new THREE.Group()
  const steel = mat('#D9DEE6', { metalness: 0.9, roughness: 0.18 })
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 18, 0, TAU, 0, Math.PI / 2), steel)
  dome.scale.y = 0.82
  dome.castShadow = true
  g.add(dome)
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 10, 48), steel).rotateX(Math.PI / 2))
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 12), mat('#B9C2CF', { metalness: 0.85, roughness: 0.2 }))
  knob.position.y = 0.17 * 0.82 + 0.018
  g.add(knob)
  return { group: g, knobH: 0.17 * 0.82 + 0.03 }
}
function foodDish(scene: THREE.Scene) {
  const g = new THREE.Group()
  g.add(cyl(0.2, 0.17, 0.018, mat('#FFFFFF', { roughness: 0.3 }), [0, 0.009, 0], 40))
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 14, 0, TAU, 0, Math.PI / 2), mat('#FBF3DE', { roughness: 0.8 }))
  rice.scale.y = 0.75
  rice.position.set(-0.04, 0.018, 0)
  g.add(rice)
  const curry = cyl(0.068, 0.07, 0.03, mat('#E88A2E', { roughness: 0.55 }), [0.065, 0.032, 0.02], 28)
  g.add(curry)
  g.add(cyl(0.072, 0.06, 0.03, mat('#FFFFFF', { roughness: 0.3 }), [0.065, 0.02, 0.02], 28))
  for (const [x, z] of [[-0.08, 0.06], [-0.02, 0.08], [-0.1, 0.0]]) {
    const leaf = box(0.03, 0.006, 0.016, mat('#3E9B4F', { roughness: 0.6 }), [x, 0.05, z], 0.003)
    leaf.rotation.y = x * 10
    g.add(leaf)
  }
  /* steam: three soft puffs rising while the cover is up */
  const puffs = [0, 1, 2].map(() => {
    const h = halo('#FFFFFF', 0.07)
    scene.add(h.mesh)
    return h
  })
  return {
    group: g,
    tick: (c: number, up: number) => {
      puffs.forEach((h, i) => {
        const ph = mod(c * 0.7 + i / 3, 1)
        h.mesh.position.set(P17.dish.x - 0.05 + i * 0.05 + 0.02 * Math.sin(c * 2 + i), P17.dish.y + 0.1 + ph * 0.42, P17.dish.z + 0.05)
        h.mat.opacity = 0.75 * up * Math.sin(Math.PI * ph)
      })
    },
  }
}
function restaurantExtras(St: THREE.Group, scene: THREE.Scene) {
  /* two warm pendant lamps over the counter (no shadow: they would print a blot on the wall), a plant at the far left */
  const shades: THREE.MeshBasicMaterial[] = []
  const Lp = new THREE.Group()
  for (const x of [0.45, 1.02]) {
    Lp.add(cyl(0.004, 0.004, 0.6, mat('#3B3B44'), [x, 2.86, -0.02], 8))
    Lp.add(cyl(0.07, 0.15, 0.13, mat('#2F3A4F', { roughness: 0.4, metalness: 0.4 }), [x, 2.52, -0.02], 32))
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.1, 28), glow('#FFE3A6'))
    bulb.rotation.x = -Math.PI / 2
    bulb.position.set(x, 2.452, -0.02)
    scene.add(bulb)
    const hl = halo('#FFD98C', 0.32)
    hl.mesh.position.set(x, 2.4, 0.02)
    scene.add(hl.mesh)
    shades.push(hl.mat)
  }
  scene.add(bake(Lp, false))
  St.add(cyl(0.16, 0.12, 0.34, mat('#C46A3C', { roughness: 0.7 }), [-1.62, 0.17, -0.34], 24))
  const leafM = mat('#3E8E4F', { roughness: 0.7 })
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU
    const leaf = box(0.06, 0.5, 0.02, leafM, [-1.62 + Math.cos(a) * 0.08, 0.58, -0.34 + Math.sin(a) * 0.06], 0.02)
    leaf.rotation.z = Math.cos(a) * 0.4
    leaf.rotation.x = Math.sin(a) * 0.3
    St.add(leaf)
  }
  return {
    tick: (c: number) => {
      for (const m of shades) m.opacity = 0.42 + 0.04 * Math.sin(c * TAU / L17)
    },
  }
}

const DINER_W = who(CAST_PRESETS.meera, {
  name: 'Diner W',
  gender: 'female',
  hair: { style: 'long', color: '#3B2417' },
  outfit: { top: 'blouse', topColor: '#E9A93B', bottom: 'skirt', bottomColor: '#2C3C81', shoeColor: '#7A3E2A' },
  accessories: { earrings: true, necklace: true },
  build: { height: 0.98, shoulders: 0.98 },
})
const DINER_M = who(CAST_PRESETS.dev, {
  name: 'Diner M',
  gender: 'male',
  hair: { style: 'quiff', color: '#2A2324' },
  outfit: { top: 'shirt', topColor: '#3FA7A2', bottom: 'trousers', bottomColor: '#C9B38A', shoeColor: '#5A3A2A' },
  accessories: { watch: true, beard: 'none' },
  build: { height: 1.03, shoulders: 1.04 },
})
const SERVER = who(CAST_PRESETS.ananya, {
  name: 'Server',
  gender: 'female',
  hair: { style: 'bun', color: '#2A2324' },
  outfit: { top: 'polo', topColor: '#F4F1EA', bottom: 'trousers', bottomColor: '#2A2F45', shoeColor: '#2A2A30' },
  accessories: { earrings: true },
  build: { height: 0.97, shoulders: 1 },
})

function setupT17Everyday(kit: StageKit): Update {
  return setupT17(kit, {
    bg: '#F3EEE6',
    floor: floorPlanks('#C99E73', '#BF9367', '#A57A52', [12, 12]),
    wall: '#F7EFE2',
    trim: '#B07A4C',
    counterBody: '#EBDCC4',
    counterTop: '#6E4A30',
    counterBand: '#3FA7A2',
    docs: [{ x: P17.cert.x, w: 0.62, h: 0.44, tex: hygieneCertTex(), frame: '#7A5434', seal: { tex: rosetteTex('#E2A92E', '#C68A17', 'check'), dx: 0.2, dy: -0.11, r: 0.072, ribbon: '#2F8F5B' } }],
    door: restaurantDoor,
    dome: cloche,
    dish: foodDish,
    extras: restaurantExtras,
    diners: [DINER_W, undefined, DINER_M, undefined],
    server: [SERVER, withTop(APRON('#2F8F5B', '#1F6B42'))],
    clock: 'T17',
  })
}

/* ---- T17 concept: a cloud vendor's assurance ---- */

const isoCertTex = () =>
  canvasTex(120, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 120, 96)
    g.strokeStyle = '#2D63FB'
    g.lineWidth = 2.6
    g.strokeRect(5, 5, 110, 86)
    g.strokeStyle = '#C9D7FF'
    g.lineWidth = 1
    g.strokeRect(9, 9, 102, 78)
    g.fillStyle = '#2D63FB'
    rrect(g, 28, 15, 64, 6, 3)
    g.fill()
    /* a globe emblem, top left */
    g.strokeStyle = '#2D63FB'
    g.lineWidth = 1.6
    g.beginPath()
    g.arc(19, 20, 6, 0, TAU)
    g.moveTo(13, 20)
    g.lineTo(25, 20)
    g.stroke()
    g.beginPath()
    g.ellipse(19, 20, 2.8, 6, 0, 0, TAU)
    g.stroke()
    bars(g, 18, 32, 60, 5, 8, '#AEB9D3')
    g.strokeStyle = '#1D3563'
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(20, 80)
    g.bezierCurveTo(26, 72, 32, 86, 38, 76)
    g.bezierCurveTo(42, 70, 46, 82, 54, 78)
    g.stroke()
  })
const socReportTex = () =>
  canvasTex(84, 112, (g) => {
    g.fillStyle = '#F4F7FE'
    g.fillRect(0, 0, 84, 112)
    g.fillStyle = '#1D3563'
    g.fillRect(0, 0, 84, 26)
    g.fillStyle = '#FFFFFF'
    rrect(g, 10, 9, 40, 5, 2.5)
    g.fill()
    rrect(g, 10, 17, 24, 3, 1.5)
    g.fill()
    /* a bar chart and rows of "text" */
    const hs = [16, 26, 20, 32]
    hs.forEach((h, i) => {
      g.fillStyle = i === 3 ? '#FF8A3D' : '#2D63FB'
      rrect(g, 14 + i * 15, 66 - h, 10, h, 2)
      g.fill()
    })
    g.fillStyle = '#C8D1DF'
    g.fillRect(10, 67, 64, 1.5)
    bars(g, 10, 76, 64, 4, 8, '#AEB9D3')
    /* page edges on the right */
    g.fillStyle = '#DCE4F4'
    g.fillRect(80, 0, 4, 112)
  })
function dataCentreDoor(St: THREE.Group, scene: THREE.Scene) {
  const x = P17.doorX
  const frameM = mat('#5E6A80', { roughness: 0.35, metalness: 0.6 })
  const leafM = mat('#AEB8C8', { roughness: 0.35, metalness: 0.55 })
  St.add(box(0.06, 2.12, 0.06, frameM, [x - 0.36, 1.06, WALL_Z + 0.03]), box(0.06, 2.12, 0.06, frameM, [x + 0.36, 1.06, WALL_Z + 0.03]))
  St.add(box(0.78, 0.06, 0.06, frameM, [x, 2.12, WALL_Z + 0.03]))
  St.add(box(0.66, 2.04, 0.04, leafM, [x, 1.02, WALL_Z + 0.03], 0.01))
  /* a horizontal push bar, a keypad with a green light, a porthole onto the racks */
  St.add(box(0.46, 0.04, 0.04, mat('#5E6A80', { metalness: 0.7, roughness: 0.3 }), [x, 1.0, WALL_Z + 0.07], 0.015))
  St.add(box(0.1, 0.16, 0.02, mat('#2E3448', { roughness: 0.4 }), [x + 0.46, 1.26, WALL_Z + 0.02], 0.01))
  St.add(cyl(0.12, 0.12, 0.05, mat('#5E6A80', { roughness: 0.4, metalness: 0.5 }), [x, 1.56, WALL_Z + 0.035], 36).rotateX(Math.PI / 2))
  const rackTex = canvasTex(64, 64, (g) => {
    g.fillStyle = '#16203A'
    g.fillRect(0, 0, 64, 64)
    for (let r = 0; r < 6; r++) {
      g.fillStyle = '#25304E'
      g.fillRect(8, 6 + r * 9, 48, 7)
      g.fillStyle = r % 2 ? '#4FD1FF' : '#3DDC97'
      g.fillRect(46, 8 + r * 9, 4, 3)
    }
  })
  const pm = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), flat(rackTex, { transparent: false }))
  pm.position.set(x, 1.56, WALL_Z + 0.062)
  scene.add(pm)
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), glow('#3DDC97'))
  led.position.set(x + 0.46, 1.31, WALL_Z + 0.031)
  scene.add(led)
}
function glassDome() {
  const g = new THREE.Group()
  const glass = new THREE.MeshPhysicalMaterial({ color: '#DDE9FF', roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.32, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false })
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 18, 0, TAU, 0, Math.PI / 2), glass)
  dome.scale.y = 0.95
  dome.renderOrder = 3
  g.add(dome)
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.007, 10, 48), mat('#AEB8C8', { metalness: 0.8, roughness: 0.25 })).rotateX(Math.PI / 2))
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 12), mat('#AEB8C8', { metalness: 0.85, roughness: 0.2 }))
  knob.position.y = 0.17 * 0.95 + 0.016
  g.add(knob)
  return { group: g, knobH: 0.17 * 0.95 + 0.028 }
}
/** the vendor's service: a glossy blue cloud on a white plinth, which lights and lifts when the dome comes off */
function cloudService(scene: THREE.Scene) {
  const g = new THREE.Group()
  g.add(cyl(0.16, 0.18, 0.03, mat('#FFFFFF', { roughness: 0.3 }), [0, 0.015, 0], 40))
  const cloud = new THREE.Group()
  const cm = mat('#2D63FB', { roughness: 0.28, metalness: 0.1, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.15 })
  for (const [x, y, r] of [[-0.055, 0, 0.045], [0, 0.02, 0.06], [0.06, 0.004, 0.046], [0.02, -0.01, 0.045], [-0.025, -0.012, 0.042]] as [number, number, number][]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), cm)
    s.position.set(x, y, 0)
    s.scale.z = 0.7
    cloud.add(s)
  }
  cloud.position.y = 0.1
  g.add(cloud)
  const hl = halo('#8DB0FF', 0.2)
  scene.add(hl.mesh)
  const sparks = [0, 1, 2, 3].map(() => {
    const h = halo('#BFD3FF', 0.025)
    scene.add(h.mesh)
    return h
  })
  return {
    group: g,
    tick: (c: number, up: number) => {
      cloud.position.y = 0.1 + 0.06 * up + 0.008 * Math.sin(c * TAU / 1.8)
      cloud.rotation.y = 0.35 * Math.sin(c * TAU / L17)
      cm.emissiveIntensity = 0.15 + 0.5 * up
      hl.mesh.position.set(P17.dish.x, P17.dish.y + 0.12 + 0.06 * up, P17.dish.z + 0.06)
      hl.mat.opacity = 0.7 * up
      sparks.forEach((h, i) => {
        const ph = mod(c * 0.6 + i / 4, 1)
        h.mesh.position.set(P17.dish.x + Math.cos(i * 1.9 + c) * 0.11, P17.dish.y + 0.12 + ph * 0.36, P17.dish.z + 0.07)
        h.mat.opacity = 0.9 * up * Math.sin(Math.PI * ph)
      })
    },
  }
}
function vendorExtras(St: THREE.Group, scene: THREE.Scene) {
  /* a light strip over the counter, a cloud mark on the counter's band, a plant at the far left */
  const strips: THREE.MeshBasicMaterial[] = []
  scene.add(noShadow(box(1.4, 0.03, 0.08, mat('#C8D1DF', { metalness: 0.6, roughness: 0.3 }), [0.73, 2.5, -0.05])))
  const hl = halo('#DDE7FF', 0.5)
  hl.mesh.scale.x = 2.2
  hl.mesh.position.set(0.73, 2.44, -0.02)
  scene.add(hl.mesh)
  strips.push(hl.mat)
  St.add(cyl(0.16, 0.12, 0.34, mat('#FFFFFF', { roughness: 0.4 }), [-1.62, 0.17, -0.34], 24))
  const leafM = mat('#3E8E4F', { roughness: 0.7 })
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU
    const leaf = box(0.06, 0.5, 0.02, leafM, [-1.62 + Math.cos(a) * 0.08, 0.58, -0.34 + Math.sin(a) * 0.06], 0.02)
    leaf.rotation.z = Math.cos(a) * 0.4
    leaf.rotation.x = Math.sin(a) * 0.3
    St.add(leaf)
  }
  return {
    tick: (c: number) => {
      for (const m of strips) m.opacity = 0.5 + 0.05 * Math.sin(c * TAU / L17)
    },
  }
}

const CLIENT_W = who(CAST_PRESETS.riya, {
  name: 'Client W',
  gender: 'female',
  hair: { style: 'bob', color: '#262B43' },
  outfit: { top: 'blouse', topColor: '#F4F7FE', bottom: 'trousers', bottomColor: '#1F2A4A', shoeColor: '#1F2A4A' },
  accessories: { earrings: true },
  build: { height: 0.99, shoulders: 1 },
})
const CLIENT_M = who(CAST_PRESETS.rohan, {
  name: 'Client M',
  gender: 'male',
  hair: { style: 'sidePart', color: '#483032' },
  outfit: { top: 'shirtTie', topColor: '#D5D8EB', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30', accentColor: '#2D63FB' },
  accessories: { beard: 'none', glasses: 'rect', watch: true },
  build: { height: 1.04, shoulders: 1.05 },
})
const REP = who(CAST_PRESETS.meera, {
  name: 'Vendor Rep',
  gender: 'female',
  hair: { style: 'ponytail', color: '#2A2324' },
  outfit: { top: 'polo', topColor: '#1D3563', bottom: 'trousers', bottomColor: '#2A2F45', shoeColor: '#2A2A30' },
  accessories: { earrings: true },
  build: { height: 0.97, shoulders: 1 },
})

function setupT17Concept(kit: StageKit): Update {
  return setupT17(kit, {
    bg: '#EEF3FB',
    floor: tileTex('#E6ECF5', '#D3DCEA', [14, 12]),
    wall: '#F5F8FD',
    trim: '#9DB8FF',
    counterBody: '#FFFFFF',
    counterTop: '#DCE4F4',
    counterBand: '#2D63FB',
    docs: [
      { x: P17.cert.x - 0.33, w: 0.52, h: 0.42, tex: isoCertTex(), frame: '#1D3563', seal: { tex: rosetteTex('#2D63FB', '#E69C0E', 'globe'), dx: 0.17, dy: -0.1, r: 0.066, ribbon: '#E69C0E' } },
      { x: P17.cert.x + 0.27, w: 0.33, h: 0.44, tex: socReportTex(), frame: '#1D3563' },
    ],
    door: dataCentreDoor,
    dome: glassDome,
    dish: cloudService,
    extras: vendorExtras,
    diners: [CLIENT_W, withTop(BLAZER('#2D63FB', '#1640C8')), CLIENT_M, undefined],
    server: [REP, withNeck(LANYARD('#FF8A3D'))],
    clock: 'T17',
  })
}

/* ================================================================== T19: the desk, the rules board, the locked drawer */

const L19 = 7.2
const F19 = 96
const HOLD19 = 3.7
const P19 = {
  dx0: 0.14,
  dx1: 1.42,
  dz0: -0.2,
  dz1: 0.2,
  dh: 0.88,
  item: new THREE.Vector3(0.4, 0.88, 0.07), // the book / the data file, lying on the desk
  stamp: new THREE.Vector3(0.64, 0.88, -0.02),
  drawerBox: new THREE.Vector3(1.12, 0.88, -0.06), // base centre of the card box / vault
  offer: new THREE.Vector3(0.02, 1.08, 0.36), // where the item changes hands
  member: new THREE.Vector3(-0.46, 0, 0.36),
  staff: new THREE.Vector3(0.8, 0, -0.38),
  hMb: 1.7,
  hSt: 1.6,
  board: new THREE.Vector3(0.8, 2.0, WALL_Z + 0.03),
}
const B19 = {
  board: [0.05, 1.05] as [number, number],
  toStamp: [0.3, 0.65] as [number, number],
  press: [0.7, 1.05] as [number, number],
  stampBack: [1.1, 1.5] as [number, number],
  toItem: [1.5, 1.85] as [number, number],
  give: [1.9, 2.55] as [number, number],
  pass: 2.6,
  restS: [2.6, 3.0] as [number, number],
  toDrawer: [3.0, 3.35] as [number, number],
  open: [3.35, 3.7] as [number, number],
  shut: [4.25, 4.6] as [number, number],
  lockGlow: [4.6, 5.2] as [number, number],
  drawerRest: [4.6, 4.95] as [number, number],
  hold: [3.0, 4.6] as [number, number], // he looks at the book
  back: [4.8, 5.4] as [number, number], // he holds it out to renew
  pass2: 5.45,
  place: [5.5, 6.3] as [number, number],
  rest2: [6.35, 6.9] as [number, number],
}
/** the drawer box is drawn at 1 and shown DRAWER_K larger, about its base centre */
const DRAWER_K = 1.3
function scaleAbout<T extends THREE.Object3D>(o: T, at: THREE.Vector3, k: number): T {
  o.scale.setScalar(k)
  o.position.copy(at).multiplyScalar(1 - k)
  return o
}
const drawerOut = (c: number) => seg(c, B19.open[0], B19.open[1]) * (1 - seg(c, B19.shut[0], B19.shut[1]))

type T19Look = {
  bg: string
  floor: THREE.Texture
  wall: string
  trim: string
  deskBody: string
  deskTop: string
  shelves: (St: THREE.Group, scene: THREE.Scene) => void
  boardTex: THREE.Texture
  boardFrame: string
  boardGlow: string
  item: () => THREE.Group
  stamp: () => { group: THREE.Group; inkTex: THREE.Texture }
  drawer: (St: THREE.Group) => { drawer: THREE.Group; slide: (z: number) => void; card: THREE.Mesh; cardGlow: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }; lockGlow: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } }
  member: [CharacterConfig, ((s: Skin) => Skin) | undefined]
  staff: [CharacterConfig, (s: Skin) => Skin]
  clock: string
}

function setupT19(kit: StageKit, look: T19Look): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color(look.bg)
  setCamera(camera, CAM.pos, CAM.at, CAM.fov)
  lightRig(scene, [0.1, 0.6, -0.3])
  const St = new THREE.Group()

  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: look.floor, roughness: 0.5 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  St.add(box(12, 3.8, 0.1, mat(look.wall, { roughness: 0.95, emissive: new THREE.Color(look.wall), emissiveIntensity: 0.28 }), [0, 1.9, WALL_Z - 0.05]))
  St.add(box(12, 0.12, 0.03, mat(look.trim, { roughness: 0.6 }), [0, 0.06, WALL_Z + 0.015]))

  look.shelves(St, scene)

  /* the rules board (no words: icon rows) */
  const b = P19.board
  St.add(box(0.74, 0.54, 0.03, mat(look.boardFrame, { roughness: 0.5 }), [b.x, b.y, b.z], 0.012))
  St.add(plane(0.68, 0.48, flat(look.boardTex, { transparent: false }), [b.x, b.y, b.z + 0.0155]))
  const boardHalo = halo(look.boardGlow, 0.62)
  boardHalo.mesh.position.set(b.x, b.y, WALL_Z + 0.008)
  scene.add(boardHalo.mesh)

  /* the desk: a front panel and a top; the staff stands behind it */
  const { dx0, dx1, dz0, dz1, dh } = P19
  St.add(box(dx1 - dx0, dh - 0.05, dz1 - dz0, mat(look.deskBody, { roughness: 0.6 }), [(dx0 + dx1) / 2, (dh - 0.05) / 2, (dz0 + dz1) / 2]))
  St.add(box(dx1 - dx0 + 0.08, 0.05, dz1 - dz0 + 0.08, mat(look.deskTop, { roughness: 0.4 }), [(dx0 + dx1) / 2, dh - 0.025, (dz0 + dz1) / 2], 0.015))
  const dr = look.drawer(St)
  scene.add(bake(St))
  scene.add(noShadow(dr.drawer))
  scene.add(dr.cardGlow.mesh, dr.lockGlow.mesh)

  const item = look.item()
  noShadow(item)
  scene.add(item)
  const stamp = look.stamp()
  noShadow(stamp.group)
  scene.add(stamp.group)
  /* the stamp's mark on the item: appears at the press, stays until it goes back on the desk */
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), flat(stamp.inkTex, { opacity: 0 }))
  ink.material.depthWrite = false
  item.add(ink)

  /* ---- the staff ---- */
  const S_ = P19.staff
  const [stCfg, stDress] = look.staff
  const shS = buildSkin(stCfg).shoulderHalf
  const stampTop = P19.stamp.clone().add(new THREE.Vector3(0, 0.13, 0))
  const pressAt = P19.item.clone().add(new THREE.Vector3(0, 0.14, 0))
  const itemGrip = P19.item.clone().add(new THREE.Vector3(0.02, 0.04, 0))
  const aStamp = solveLx(shS, worldToRig(stampTop, S_, P19.hSt, camera), true)
  const aAbove = solveLx(shS, worldToRig(pressAt.clone().add(new THREE.Vector3(0, 0.1, 0)), S_, P19.hSt, camera), true)
  const aPress = solveLx(shS, worldToRig(pressAt, S_, P19.hSt, camera), true)
  const aItem = solveLx(shS, worldToRig(itemGrip, S_, P19.hSt, camera), true)
  const aOffer = solveLx(shS, worldToRig(P19.offer, S_, P19.hSt, camera), true)
  const drawerFront = P19.drawerBox.clone().add(new THREE.Vector3(0, 0.15 * DRAWER_K, 0.17 * DRAWER_K))
  const aDrawer = solveR(shS, worldToRig(drawerFront, S_, P19.hSt, camera), true)
  const aDrawerOut = solveR(shS, worldToRig(drawerFront.clone().add(new THREE.Vector3(0, 0, 0.2 * DRAWER_K)), S_, P19.hSt, camera), true)
  const armSL = (c: number) =>
    angAt(c, [
      [B19.toStamp[0], REST_L],
      [B19.toStamp[1], aStamp],
      [B19.press[0], aAbove],
      [B19.press[0] + 0.17, aPress],
      [B19.press[1], aAbove],
      [B19.stampBack[0] + 0.25, aStamp],
      [B19.stampBack[1], aStamp],
      [B19.toItem[1], aItem],
      [B19.give[0], aItem],
      [B19.give[1], aOffer],
      [B19.restS[0], aOffer],
      [B19.restS[1], REST_L],
      [B19.back[0], REST_L],
      [B19.back[1], aOffer],
      [B19.place[0], aOffer],
      [B19.place[1], aItem],
      [B19.rest2[0], aItem],
      [B19.rest2[1], REST_L],
    ])
  const armSR = (c: number) =>
    angAt(c, [
      [B19.toDrawer[0], { s: 14, e: 44 }],
      [B19.toDrawer[1], aDrawer],
      [B19.open[1], aDrawerOut],
      [B19.shut[0], aDrawerOut],
      [B19.shut[1], aDrawer],
      [B19.drawerRest[1], { s: 14, e: 44 }],
    ])
  const stampInHand = (c: number) => c >= B19.toStamp[1] && c < B19.stampBack[1]
  const itemWithStaff = (c: number) => (c >= B19.toItem[1] && c < B19.pass) || (c >= B19.pass2 && c < B19.place[1])
  const itemWithMember = (c: number) => c >= B19.pass && c < B19.pass2
  const staff = person({
    config: stCfg,
    dress: stDress,
    seed: 1901,
    loop: L19,
    frames: F19,
    height: P19.hSt,
    redraw,
    holdT: HOLD19,
    faces: [
      [0, 'happy'],
      [B19.toStamp[0], 'thinking'],
      [B19.give[0], 'happy'],
      [B19.toDrawer[0], 'thinking'],
      [B19.shut[1], 'proud'],
      [B19.back[0], 'happy'],
    ],
    pose: (p, c) => {
      const a = armSL(c)
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -4
      const g = stampInHand(c) || itemWithStaff(c) ? 1 : 0
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = 0.3 + 0.32 * g
      p.tL = 0.2 + 0.35 * g
      const r = armSR(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.wristR = -4
      const atDrawer = hold(c, B19.toDrawer[0], B19.toDrawer[1], B19.shut[1], B19.drawerRest[1])
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = 0.3 + 0.32 * atDrawer
      to(p, 'headTurn', -0.4, 1)
      to(p, 'lookX', -0.85, 1)
      /* eyes on the work: the stamp and the item, then the drawer (to her left on screen) */
      const desk = hold(c, B19.toStamp[0], B19.toStamp[1], B19.toItem[1], B19.give[0] + 0.1) + hold(c, B19.place[0] + 0.2, B19.place[1] - 0.2, B19.rest2[0], B19.rest2[1])
      to(p, 'lookY', 0.6, desk)
      to(p, 'headNod', 0.2, desk)
      to(p, 'headTurn', -0.2, desk)
      const dw = hold(c, B19.toDrawer[0], B19.toDrawer[1], B19.shut[1], B19.drawerRest[1])
      to(p, 'headTurn', 0.32, dw)
      to(p, 'lookX', 0.7, dw)
      to(p, 'lookY', 0.55, dw)
      to(p, 'headNod', 0.18, dw)
    },
  })
  staff.object.position.copy(S_)
  scene.add(staff.object)

  /* ---- the member ---- */
  const M_ = P19.member
  const [mbCfg, mbDress] = look.member
  const shM = buildSkin(mbCfg).shoulderHalf
  const aTake = solveR(shM, worldToRig(P19.offer, M_, P19.hMb, camera), true)
  const aChest = solveR(shM, { x: 232, y: 340 }, true)
  const armM = (c: number) =>
    angAt(c, [
      [B19.give[0] + 0.2, REST_R],
      [B19.give[1], aTake],
      [B19.pass + 0.05, aTake],
      [B19.pass + 0.55, aChest],
      [B19.back[0], aChest],
      [B19.back[1], aTake],
      [B19.pass2 + 0.05, aTake],
      [B19.pass2 + 0.6, REST_R],
    ])
  const member = person({
    config: mbCfg,
    dress: mbDress,
    seed: 1902,
    loop: L19,
    frames: F19,
    height: P19.hMb,
    redraw,
    holdT: HOLD19,
    faces: [
      [0, 'listening'],
      [B19.board[0] + 0.2, 'thinking'],
      [B19.give[0], 'happy'],
      [B19.pass + 0.2, 'excited'],
      [B19.hold[0] + 0.4, 'happy'],
      [B19.back[0] + 0.3, 'proud'],
      [B19.rest2[0], 'listening'],
    ],
    pose: (p, c) => {
      const a = armM(c)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.wristR = -6
      const g = itemWithMember(c) ? 1 : 0
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = 0.3 + 0.32 * g
      p.tR = 0.2 + 0.35 * g
      p.shoulderL = REST_L.s
      p.elbowL = REST_L.e
      to(p, 'headTurn', 0.42, 1)
      to(p, 'lookX', 0.88, 1)
      /* up at the rules board first */
      const bd = hold(c, B19.board[0], B19.board[0] + 0.3, B19.board[1] - 0.1, B19.board[1] + 0.25)
      to(p, 'lookY', -0.7, bd)
      to(p, 'headNod', -0.14, bd)
      /* down at the book he holds */
      const bk = hold(c, B19.pass + 0.4, B19.pass + 0.7, B19.back[0] - 0.2, B19.back[0])
      to(p, 'lookY', 0.55, bk)
      to(p, 'headNod', 0.16, bk)
      to(p, 'headTurn', 0.24, bk)
    },
  })
  member.object.position.copy(M_)
  scene.add(member.object)

  const clk = slideClock(look.clock, scene, devT(HOLD19), [staff, member])
  const hand = new THREE.Vector3()
  const restItemQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.35))
  const restStampPos = P19.stamp.clone()
  const tmpQ = new THREE.Quaternion()
  return (t: number) => {
    const c = mod(clk.time(t), L19)
    staff.update(c, camera)
    member.update(c, camera)
    const cf = frameTime(c, L19, F19)
    /* the stamp: in her hand from pick-up to put-back */
    if (stampInHand(cf)) {
      rigToWorld(fkL(shS, armSL(cf)), P19.hSt, S_, camera, hand)
      towardCamera(hand, camera, 0.1)
      stamp.group.position.set(hand.x, Math.max(P19.dh, hand.y - 0.11), hand.z)
    } else stamp.group.position.copy(restStampPos)
    /* the item: on the desk, in her hand, in his */
    if (itemWithStaff(cf) || itemWithMember(cf)) {
      if (itemWithStaff(cf)) {
        rigToWorld(fkL(shS, armSL(cf)), P19.hSt, S_, camera, hand)
      } else {
        rigToWorld(fkR(shM, armM(cf)), P19.hMb, M_, camera, hand)
      }
      towardCamera(hand, camera, 0.12)
      item.position.copy(hand)
      /* upright, facing the room, a little tilted; lying down as it reaches the desk */
      const k = itemWithStaff(cf) ? Math.max(seg(cf, B19.toItem[1], B19.toItem[1] + 0.35) * (cf < B19.pass ? 1 : 0), cf >= B19.pass2 ? 1 - seg(cf, B19.place[1] - 0.35, B19.place[1]) : 0) : 1
      tmpQ.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12)))
      item.quaternion.slerpQuaternions(restItemQ, tmpQ, k)
      item.position.y = Math.max(item.position.y, P19.dh + 0.02)
    } else {
      item.position.copy(P19.item).add(new THREE.Vector3(0, 0.022, 0))
      item.quaternion.copy(restItemQ)
    }
    /* the stamp's mark: from the press to the put-down at the end */
    const inkOn = cf >= B19.press[0] + 0.17 && cf < B19.place[1] ? 1 : 0
    ;(ink.material as THREE.MeshBasicMaterial).opacity = inkOn * seg(cf, B19.press[0] + 0.15, B19.press[0] + 0.3)
    ink.position.set(0.03, -0.04, 0.026)
    /* the drawer slides out and back; the record glows inside it; the lock glows as it shuts */
    dr.slide(0.2 * drawerOut(c))
    const cg = hold(c, B19.open[1] - 0.1, B19.open[1] + 0.1, B19.shut[0] - 0.05, B19.shut[0] + 0.1)
    dr.cardGlow.mat.opacity = 0.85 * cg
    dr.cardGlow.mesh.position.set(P19.drawerBox.x, P19.drawerBox.y + 0.24 * DRAWER_K, P19.drawerBox.z + (0.2 * drawerOut(c) + 0.1) * DRAWER_K)
    /* she lifts his record up out of the drawer to check it, then drops it back */
    dr.card.position.y = 0.06 + 0.15 * cg
    dr.lockGlow.mat.opacity = 0.9 * hold(c, B19.lockGlow[0], B19.lockGlow[0] + 0.15, B19.lockGlow[1] - 0.2, B19.lockGlow[1])
    boardHalo.mat.opacity = 0.8 * hold(c, B19.board[0], B19.board[0] + 0.3, B19.board[1] - 0.3, B19.board[1])
  }
}

/* ---- T19 everyday: a library ---- */

const SPINES = ['#2D63FB', '#E8642A', '#25BC6E', '#FFC53A', '#6E93F5', '#C46A3C', '#1D3563', '#3FA7A2', '#F0428E', '#8A5A3B']
function bookshelf(St: THREE.Group) {
  const wood = mat('#8C6440', { roughness: 0.6 })
  const x0 = -1.95
  const x1 = -0.12
  const top = 2.36
  const z = WALL_Z + 0.16
  St.add(box(x1 - x0, 0.04, 0.32, wood, [(x0 + x1) / 2, top, z]))
  St.add(box(0.04, top, 0.32, wood, [x0, top / 2, z]), box(0.04, top, 0.32, wood, [x1, top / 2, z]))
  St.add(box(x1 - x0, top, 0.02, mat('#6E4A30', { roughness: 0.7 }), [(x0 + x1) / 2, top / 2, WALL_Z + 0.01]))
  const shelfYs = [0.06, 0.62, 1.18, 1.74]
  let s = 7
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const spineM = SPINES.map((c) => mat(c, { roughness: 0.55 }))
  for (const y of shelfYs) {
    St.add(box(x1 - x0, 0.035, 0.32, wood, [(x0 + x1) / 2, y, z]))
    let x = x0 + 0.05
    while (x < x1 - 0.08) {
      const w = 0.04 + rnd() * 0.035
      const h = 0.32 + rnd() * 0.14
      const lean = rnd() < 0.08
      const b = box(w, h, 0.24, spineM[Math.floor(rnd() * spineM.length)], [x + w / 2, y + 0.02 + h / 2, z + 0.01], 0.006)
      if (lean) b.rotation.z = -0.18
      St.add(b)
      x += w + 0.006 + (lean ? 0.04 : 0)
    }
  }
}
const libraryRulesTex = () =>
  canvasTex(136, 96, (g) => {
    g.fillStyle = '#E9D7B8'
    g.fillRect(0, 0, 136, 96)
    /* three pinned notes, each an icon and "text" bars: a book, a clock, a tick */
    const rows = [16, 46, 76]
    rows.forEach((y, i) => {
      g.fillStyle = '#FFFFFF'
      rrect(g, 10, y - 11, 116, 22, 3)
      g.fill()
      g.fillStyle = ['#2D63FB', '#E8642A', '#25BC6E'][i]
      g.beginPath()
      g.arc(14, y - 8, 2.4, 0, TAU)
      g.fill()
      const ix = 26
      g.strokeStyle = ['#2D63FB', '#E8642A', '#25BC6E'][i]
      g.lineWidth = 2
      if (i === 0) {
        g.strokeRect(ix - 6, y - 6, 12, 12)
        g.beginPath()
        g.moveTo(ix, y - 6)
        g.lineTo(ix, y + 6)
        g.stroke()
      } else if (i === 1) {
        g.beginPath()
        g.arc(ix, y, 6.5, 0, TAU)
        g.moveTo(ix, y)
        g.lineTo(ix, y - 4)
        g.moveTo(ix, y)
        g.lineTo(ix + 3.5, y + 1)
        g.stroke()
      } else check(g, ix, y, 12, '#25BC6E', 2.4)
      bars(g, 40, y - 4, 76, 2, 7, '#9AA3B2', 2.6)
    })
  })
function libraryBook() {
  const g = new THREE.Group()
  /* a hardback: cover, page block; lies in the xy plane facing +z (cover toward the room) */
  g.add(box(0.17, 0.23, 0.035, mat('#2D63FB', { roughness: 0.45 }), [0, 0, 0], 0.006))
  g.add(box(0.155, 0.215, 0.037, mat('#FBF6EA', { roughness: 0.8 }), [0.006, 0, 0]))
  g.add(box(0.12, 0.012, 0.002, mat('#FFC53A', { roughness: 0.4 }), [0, 0.06, 0.019]))
  g.add(box(0.08, 0.008, 0.002, mat('#BFD3FF', { roughness: 0.4 }), [0, 0.04, 0.019]))
  return g
}
const inkTex = (color: string, mark: 'check' | 'date') =>
  canvasTex(48, 48, (g) => {
    g.strokeStyle = color
    g.lineWidth = 3
    g.beginPath()
    g.arc(24, 24, 20, 0, TAU)
    g.stroke()
    if (mark === 'check') check(g, 24, 24, 20, color, 4)
    else bars(g, 13, 17, 22, 3, 7, color, 3)
  })
function dateStamp() {
  const g = new THREE.Group()
  g.add(box(0.07, 0.03, 0.05, mat('#2F3A4F', { roughness: 0.5 }), [0, 0.015, 0], 0.006))
  g.add(cyl(0.012, 0.016, 0.06, mat('#8C6440', { roughness: 0.5 }), [0, 0.06, 0], 16))
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 18, 12), mat('#B07A4C', { roughness: 0.45 })).translateY(0.1))
  return { group: g, inkTex: inkTex('#1640C8', 'date') }
}
/** a wooden card-catalogue box with one drawer and a brass padlock; the member's card inside */
function cardDrawer(St: THREE.Group) {
  const shG = new THREE.Group()
  const b = P19.drawerBox
  const wood = mat('#A4734A', { roughness: 0.55 })
  /* the box's shell (top, sides, back) with an open front where the drawer sits */
  shG.add(box(0.3, 0.025, 0.3, wood, [b.x, b.y + 0.22, b.z]))
  shG.add(box(0.025, 0.22, 0.3, wood, [b.x - 0.1375, b.y + 0.11, b.z]), box(0.025, 0.22, 0.3, wood, [b.x + 0.1375, b.y + 0.11, b.z]))
  shG.add(box(0.3, 0.22, 0.02, wood, [b.x, b.y + 0.11, b.z - 0.14]))
  shG.add(box(0.3, 0.02, 0.3, wood, [b.x, b.y + 0.01, b.z]))
  St.add(scaleAbout(shG, P19.drawerBox, DRAWER_K))
  const drawer = new THREE.Group()
  drawer.position.set(0, 0, 0)
  const dg = new THREE.Group()
  dg.position.set(b.x, b.y, b.z)
  const dm = mat('#B9855A', { roughness: 0.5 })
  dg.add(box(0.245, 0.17, 0.02, dm, [0, 0.11, 0.15], 0.006))
  dg.add(box(0.235, 0.02, 0.27, dm, [0, 0.03, 0.01]))
  dg.add(box(0.02, 0.1, 0.27, dm, [-0.11, 0.08, 0.01]), box(0.02, 0.1, 0.27, dm, [0.11, 0.08, 0.01]))
  /* the handle and the brass padlock on the drawer's face */
  dg.add(box(0.07, 0.016, 0.02, mat('#C9A24A', { metalness: 0.75, roughness: 0.3 }), [0, 0.15, 0.165], 0.006))
  const lockG = new THREE.Group()
  lockG.position.set(0, 0.085, 0.168)
  lockG.add(box(0.045, 0.038, 0.016, mat('#D4A24A', { metalness: 0.75, roughness: 0.3 }), [0, 0, 0], 0.007))
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.004, 10, 20, Math.PI), mat('#C9D0DB', { metalness: 0.85, roughness: 0.22 }))
  shackle.position.y = 0.019
  lockG.add(shackle)
  dg.add(lockG)
  /* index cards standing in the drawer; the member's (blue tab) in front */
  const cardM = mat('#FFFDF6', { roughness: 0.8 })
  for (let i = 0; i < 6; i++) dg.add(box(0.2, 0.11, 0.004, cardM, [0, 0.09, -0.08 + i * 0.022]))
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.004), mat('#FFFFFF', { roughness: 0.7 }))
  card.position.set(0, 0.06, 0.07)
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.005), mat('#2D63FB'))
  tab.position.set(0.05, 0.07, 0)
  card.add(tab)
  dg.add(card)
  drawer.add(dg)
  scaleAbout(drawer, P19.drawerBox, DRAWER_K)
  const cardGlow = halo('#FFE7A3', 0.2)
  const lockGlow = halo('#FFD58A', 0.07)
  lockGlow.mesh.position.set(b.x, b.y + 0.085 * DRAWER_K, b.z + 0.19 * DRAWER_K)
  return { drawer, slide: (z: number) => (dg.position.z = b.z + z), card, cardGlow, lockGlow }
}

const MEMBER = who(CAST_PRESETS.kabir, {
  name: 'Member',
  gender: 'male',
  hair: { style: 'curly', color: '#262B43' },
  outfit: { top: 'hoodie', topColor: '#3FA7A2', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' },
  accessories: { glasses: 'round' },
  build: { height: 1.0, shoulders: 1.0 },
})
const LIBRARIAN = who(CAST_PRESETS.riya, {
  name: 'Librarian',
  gender: 'female',
  hair: { style: 'bun', color: '#6B6B73' },
  outfit: { top: 'blouse', topColor: '#F4F1EA', bottom: 'skirt', bottomColor: '#5A3A2A', shoeColor: '#5A3A2A', accentColor: '#C46A3C' },
  accessories: { glasses: 'round', necklace: true },
  build: { height: 0.97, shoulders: 1 },
})

function setupT19Everyday(kit: StageKit): Update {
  return setupT19(kit, {
    bg: '#F3EEE6',
    floor: floorPlanks('#B98D63', '#AF8459', '#946C47', [12, 12]),
    wall: '#F4EBDD',
    trim: '#8C6440',
    deskBody: '#8C6440',
    deskTop: '#B07A4C',
    shelves: (St) => bookshelf(St),
    boardTex: libraryRulesTex(),
    boardFrame: '#6E4A30',
    boardGlow: '#FFE7A3',
    item: libraryBook,
    stamp: dateStamp,
    drawer: cardDrawer,
    member: [MEMBER, undefined],
    staff: [LIBRARIAN, withTop(CARDIGAN('#C46A3C', '#8F4A26'))],
    clock: 'T19',
  })
}

/* ---- T19 concept: an organisation's data desk ---- */

function dataShelves(St: THREE.Group, scene: THREE.Scene) {
  /* a white cabinet with glass-fronted shelves holding data folders and blocks, small status lights */
  const body = mat('#E3E9F4', { roughness: 0.4, metalness: 0.2 })
  const x0 = -1.95
  const x1 = -0.12
  const top = 2.36
  const z = WALL_Z + 0.16
  St.add(box(x1 - x0, 0.04, 0.32, body, [(x0 + x1) / 2, top, z]))
  St.add(box(0.04, top, 0.32, body, [x0, top / 2, z]), box(0.04, top, 0.32, body, [x1, top / 2, z]))
  St.add(box(x1 - x0, top, 0.02, mat('#C8D1DF', { roughness: 0.6 }), [(x0 + x1) / 2, top / 2, WALL_Z + 0.01]))
  /* each shelf holds storage drives: rounded slabs in rows, a status light on each (no books: this is a data store) */
  const shelfYs = [0.06, 0.62, 1.18, 1.74]
  const unitM = [mat('#2D63FB', { roughness: 0.3, metalness: 0.2 }), mat('#1D3563', { roughness: 0.3, metalness: 0.2 }), mat('#6E93F5', { roughness: 0.3, metalness: 0.2 })]
  const ledG = new THREE.Group()
  const ledM = [glow('#3DDC97'), glow('#4FD1FF')]
  let k = 0
  for (const y of shelfYs) {
    St.add(box(x1 - x0, 0.035, 0.32, body, [(x0 + x1) / 2, y, z]))
    const n = 4
    const uw = (x1 - x0 - 0.1 - (n - 1) * 0.03) / n
    for (let i = 0; i < n; i++)
      for (let r = 0; r < 4; r++) {
        const ux = x0 + 0.05 + uw / 2 + i * (uw + 0.03)
        const uy = y + 0.07 + r * 0.115
        St.add(box(uw, 0.09, 0.24, unitM[(i + r + k) % 3], [ux, uy, z + 0.02], 0.014))
        const led = new THREE.Mesh(new THREE.CircleGeometry(0.011, 12), ledM[(i + r) % 2])
        led.position.set(ux + uw / 2 - 0.04, uy, z + 0.142)
        ledG.add(led)
        St.add(box(uw * 0.5, 0.012, 0.004, mat('#FFFFFF', { roughness: 0.4 }), [ux - uw * 0.12, uy, z + 0.141]))
      }
    k++
  }
  scene.add(ledG)
}
const policyBoardTex = () =>
  canvasTex(136, 96, (g) => {
    g.fillStyle = '#F4F7FE'
    g.fillRect(0, 0, 136, 96)
    /* a shield on the left, three ticked rows on the right */
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.moveTo(26, 16)
    g.lineTo(44, 22)
    g.lineTo(44, 42)
    g.quadraticCurveTo(44, 62, 26, 72)
    g.quadraticCurveTo(8, 62, 8, 42)
    g.lineTo(8, 22)
    g.closePath()
    g.fill()
    check(g, 26, 42, 18, '#FFFFFF', 3.4)
    ;[22, 46, 70].forEach((y) => {
      g.fillStyle = '#FFFFFF'
      rrect(g, 56, y - 9, 70, 18, 3)
      g.fill()
      check(g, 66, y, 9, '#25BC6E', 2.2)
      bars(g, 76, y - 3, 44, 2, 6, '#AEB9D3', 2.4)
    })
  })
const dataFileTex = () =>
  canvasTex(80, 108, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 80, 108, 8)
    g.fill()
    g.fillStyle = '#2D63FB'
    rrect(g, 0, 0, 80, 30, 8)
    g.fill()
    g.fillRect(0, 20, 80, 10)
    /* a person silhouette, then rows */
    g.fillStyle = '#DCE4F4'
    g.beginPath()
    g.arc(40, 50, 11, 0, TAU)
    g.fill()
    g.fillStyle = '#6E93F5'
    g.beginPath()
    g.arc(40, 47, 5, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(40, 58, 8, 4.5, 0, Math.PI, TAU)
    g.fill()
    bars(g, 14, 70, 52, 4, 8, '#AEB9D3')
  })
function dataFile() {
  const g = new THREE.Group()
  g.add(box(0.17, 0.23, 0.012, mat('#DCE4F4', { roughness: 0.4 }), [0, 0, 0], 0.01))
  g.add(plane(0.164, 0.222, flat(dataFileTex(), { transparent: false }), [0, 0, 0.0065]))
  return g
}
function consentStamp() {
  const g = new THREE.Group()
  g.add(box(0.07, 0.03, 0.05, mat('#1D3563', { roughness: 0.4 }), [0, 0.015, 0], 0.006))
  g.add(cyl(0.012, 0.016, 0.06, mat('#9DB8FF', { roughness: 0.4 }), [0, 0.06, 0], 16))
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 18, 12), mat('#2D63FB', { roughness: 0.35 })).translateY(0.1))
  return { group: g, inkTex: inkTex('#128A4E', 'check') }
}
/** a steel vault drawer with a keypad; the person's ID record inside */
function vaultDrawer(St: THREE.Group) {
  const shG = new THREE.Group()
  const b = P19.drawerBox
  const steel = mat('#AEB8C8', { roughness: 0.35, metalness: 0.6 })
  shG.add(box(0.3, 0.025, 0.3, steel, [b.x, b.y + 0.22, b.z]))
  shG.add(box(0.025, 0.22, 0.3, steel, [b.x - 0.1375, b.y + 0.11, b.z]), box(0.025, 0.22, 0.3, steel, [b.x + 0.1375, b.y + 0.11, b.z]))
  shG.add(box(0.3, 0.22, 0.02, steel, [b.x, b.y + 0.11, b.z - 0.14]))
  shG.add(box(0.3, 0.02, 0.3, steel, [b.x, b.y + 0.01, b.z]))
  St.add(scaleAbout(shG, P19.drawerBox, DRAWER_K))
  const drawer = new THREE.Group()
  const dg = new THREE.Group()
  dg.position.set(b.x, b.y, b.z)
  const dm = mat('#C8D1DF', { roughness: 0.3, metalness: 0.55 })
  dg.add(box(0.245, 0.17, 0.02, dm, [0, 0.11, 0.15], 0.006))
  dg.add(box(0.235, 0.02, 0.27, dm, [0, 0.03, 0.01]))
  dg.add(box(0.02, 0.1, 0.27, dm, [-0.11, 0.08, 0.01]), box(0.02, 0.1, 0.27, dm, [0.11, 0.08, 0.01]))
  dg.add(box(0.07, 0.016, 0.02, mat('#5E6A80', { metalness: 0.7, roughness: 0.3 }), [0, 0.165, 0.165], 0.006))
  /* the keypad and its light */
  dg.add(box(0.06, 0.06, 0.012, mat('#2E3448', { roughness: 0.4 }), [0, 0.095, 0.164], 0.006))
  const cardM = mat('#F4F7FE', { roughness: 0.6 })
  for (let i = 0; i < 6; i++) dg.add(box(0.2, 0.11, 0.004, cardM, [0, 0.09, -0.08 + i * 0.022]))
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.004), mat('#FFFFFF', { roughness: 0.6 }))
  card.position.set(0, 0.06, 0.07)
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.005), mat('#2D63FB'))
  tab.position.set(0.05, 0.07, 0)
  card.add(tab)
  dg.add(card)
  drawer.add(dg)
  scaleAbout(drawer, P19.drawerBox, DRAWER_K)
  const cardGlow = halo('#BFD3FF', 0.2)
  const lockGlow = halo('#3DDC97', 0.07)
  lockGlow.mesh.position.set(b.x, b.y + 0.095 * DRAWER_K, b.z + 0.19 * DRAWER_K)
  return { drawer, slide: (z: number) => (dg.position.z = b.z + z), card, cardGlow, lockGlow }
}

const PERSON = who(CAST_PRESETS.kabir, {
  name: 'Person',
  gender: 'male',
  hair: { style: 'short', color: '#2A2324' },
  outfit: { top: 'tshirt', topColor: '#FCC82B', bottom: 'jeans', bottomColor: '#1F4FD8', shoeColor: '#1F4FD8' },
  accessories: {},
  build: { height: 0.99, shoulders: 0.97 },
})
const HANDLER = who(CAST_PRESETS.ananya, {
  name: 'Data Handler',
  gender: 'female',
  hair: { style: 'wavy', color: '#532921' },
  outfit: { top: 'blouse', topColor: '#F4F7FE', bottom: 'trousers', bottomColor: '#1F2A4A', shoeColor: '#2A2A30' },
  accessories: { earrings: true },
  build: { height: 0.98, shoulders: 1 },
})

function setupT19Concept(kit: StageKit): Update {
  return setupT19(kit, {
    bg: '#EEF3FB',
    floor: tileTex('#E6ECF5', '#D3DCEA', [14, 12]),
    wall: '#F5F8FD',
    trim: '#9DB8FF',
    deskBody: '#FFFFFF',
    deskTop: '#DCE4F4',
    shelves: dataShelves,
    boardTex: policyBoardTex(),
    boardFrame: '#1D3563',
    boardGlow: '#BFD3FF',
    item: dataFile,
    stamp: consentStamp,
    drawer: vaultDrawer,
    member: [PERSON, undefined],
    staff: [HANDLER, both(withTop(BLAZER('#1D3563', '#122447')), withNeck(LANYARD('#2D63FB')))],
    clock: 'T19',
  })
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const Fc = ({ step = 0 }: Fig) => (
    <ClockCard id={id}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return Fc as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T17Everyday: card('T17', setupT17Everyday, devT(HOLD17)),
  J_T17Concept: card('T17', setupT17Concept, devT(HOLD17)),
  J_T19Everyday: card('T19', setupT19Everyday, devT(HOLD19)),
  J_T19Concept: card('T19', setupT19Concept, devT(HOLD19)),
}
export const css = ''
