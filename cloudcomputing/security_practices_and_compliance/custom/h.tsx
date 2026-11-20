import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { useHeld } from '@/engine/figkit'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'

/**
 * BUILDER H · SESSION 17 (Security Practices & Compliance) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`
 * (generate-slides standing corrections 13-17, deck-engine "3D scenes and people" and "Low-end PCs"), built the way
 * Sessions 15 and 16 built theirs: a perspective camera on a real place, Character Lab people through the engine's
 * `castSprite` (role clothing by `dress`, fixed 256 px frames and no breathing: Session 16 round 3), NO TEXT on either
 * card, ONE clock per slide shared by both cards (the cards fade in once every person has a first frame, a tap pauses
 * both), every loop ending in the state it starts in, held frames at HOLD. People step sideways, never toward or away
 * from the camera (a rig has no back view). Props in a hand follow the frame the sprite is showing, not the clock.
 *
 * SLIDE 15 · T04-AN (TR 4): "Setting up a new phone securely by changing default passwords, disabling unnecessary
 * permissions and enabling security settings before using it: just as hardening removes unnecessary access and applies
 * safe settings before a server goes live."
 *
 *   place          everyday: a young man at home, his new phone     concept: the same places as objects
 *   left           the owner (who uses it)                           the account tile (who logs in)
 *   centre         the new phone in his hand                         the server on its plinth
 *   right          the opened phone box on the side table            a bin the default account drops into
 *
 *   0.3 - 1.9   a new passcode: four dots fill, the open orange lock   the default (orange) account is dropped in the bin,
 *               closes blue                                            a new locked (blue) account rises in its place
 *   2.2 - 3.6   permissions: two of three app toggles switched off     two of three open ports on the server shut
 *   3.9 - 5.3   a security setting switched on, fingerprint set        the server's safe-setting switch flips on
 *   5.6 - 7.6   a green tick: the phone is ready                        a green shield: the server is ready to go live
 *   7.7 - 8.0   back to the start
 *
 * SLIDE 18 · T05-AN (TR 5): "A car's regular service inspection that checks brakes, tyres and engine condition every few
 * weeks instead of only checking the car when it is purchased: just as CSPM continuously checks cloud configurations
 * for security issues."
 *
 *   place          everyday: a garage, the car up on a lift         concept: a cloud floor of live resources
 *   wall, left     the service calendar                              a wall clock (the scan interval)
 *   rear wheel     tyres: one is low (orange), inflated (green)       a bucket left open (orange): flagged, closed (green)
 *   front wheel    brakes: the torch on the disc (green)              the security group: scanned (green)
 *   bonnet         engine: bonnet up, checked, closed (green)         the server: scanned (green)
 *   the mechanic   walks from check to check, then back               the scanner drone flies the same path
 *   7.0 - 7.6      the calendar turns a page                          the clock hand sweeps: the next regular check
 */

const W = 470
const H = 390
/* dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : d
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
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
/** a point on a lifted arc from a to b (k 0..1) */
const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, lift: number, out = new THREE.Vector3()) => out.copy(a).lerp(b, k).add(V(0, Math.sin(Math.PI * k) * lift, 0))

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
/** large soft floor slabs */
const slabTex = (base: string, joint: string, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = joint
      g.lineWidth = 1.2
      g.strokeRect(0.6, 0.6, 126.8, 126.8)
    },
    repeat,
  )
/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: THREE.Vector3Tuple, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)
  const o = mesh(geo, Array.isArray(m) ? m[0] : m, pos)
  if (Array.isArray(m)) (o as unknown as THREE.Mesh<THREE.BufferGeometry, THREE.Material[]>).material = m
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
/** a backdrop in its exact colour (no tone mapping greys it) */
const backdrop = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false })
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
/** a soft glow; `normal` blending for a coloured glow on a light surface (additive washes orange out to white there) */
function halo(color: string, w: number, h = w, normal = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}
const opa = (m: THREE.Mesh, v: number) => {
  ;(m.material as THREE.MeshBasicMaterial).opacity = v
  m.visible = v > 0.005
}
/** place a camera-facing glow just behind / in front of a point */
function glowAt(g: THREE.Mesh, p: THREE.Vector3, camera: THREE.Camera, o: number, toward = 0.02) {
  g.position.copy(p).addScaledVector(camera.position.clone().sub(p).normalize(), toward)
  g.quaternion.copy(camera.quaternion)
  opa(g, o)
}

function lights(scene: THREE.Scene, target: THREE.Vector3Tuple, spread = 6) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
  const key = new THREE.DirectionalLight(0xfff3e2, 2.0)
  key.position.set(target[0] + 5, target[1] + 9, target[2] + 8)
  key.target.position.set(...target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -spread
  key.shadow.camera.right = spread
  key.shadow.camera.top = spread
  key.shadow.camera.bottom = -spread
  key.shadow.bias = -0.0005
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
}
function floorPlane(scene: THREE.Scene, tex: THREE.Texture, z = 1.4, w = 12, d = 7) {
  const fl = flat(mesh(new THREE.PlaneGeometry(w, d), mat('#ffffff', { map: tex, roughness: 0.85 }), [0, 0, z]))
  fl.rotation.x = -Math.PI / 2
  fl.receiveShadow = true
  scene.add(fl)
  return fl
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
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT: number }): Sprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes */
  const quiet = (c: number) => Math.abs(c - o.holdT) < 0.35
  /* Session 16 round 3: a fixed frame size (1080p's adaptive size; a re-size hid the person while a new set was built)
     and no idle breathing (a still pose is one shared picture, so the frames that move are built far sooner) */
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
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/* role clothing, drawn in the rig's own frames (head-local for the cap, body frame 400 x 600 for the rest) */
const PEAK_CAP = (crown: string, band: string, badge: string) => (
  <g data-part="cap">
    <path d="M -64 -50 C -70 -104 70 -104 64 -50 Z" fill={crown} />
    <path d="M -50 -88 C -20 -100 20 -100 50 -88" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-65} y={-62} width={130} height={15} rx={4} fill={band} />
    <circle cx={0} cy={-80} r={9} fill={badge} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -60 -48 Q 0 -26 60 -48 L 56 -54 Q 0 -38 -56 -54 Z" fill="#141B2E" />
  </g>
)
/* ---- arms: forward and inverse kinematics in the rig's 400 x 600 frame (Arm.tsx: pivot 6 px inside the shoulder tip
   at y 205, upper arm 95, forearm 85 + 14 to the grip; angles from hanging straight down, positive lifts away from the
   body, forearm at shoulder minus elbow; the screen-right arm mirrors). Session 14 h.tsx. ---- */

type Pt = { x: number; y: number }
type Arm = { s: number; e: number }
type Side = 'L' | 'R'
const UPPER = 95
const FORE = 99
function handPt(side: Side, sh: number, a: Arm): Pt {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px + sg * (Math.sin(s) * UPPER + Math.sin(f) * FORE), y: 205 + Math.cos(s) * UPPER + Math.cos(f) * FORE }
}
/** shoulder and elbow angles that put the hand at p, elbow DOWN */
function solveArm(side: Side, sh: number, p: Pt, other = false): Arm {
  const q = side === 'L' ? p : { x: 400 - p.x, y: p.y }
  const px = 200 - (sh - 6)
  const dx = q.x - px
  const dy = q.y - 205
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(clamp01((UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D)))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  /* `other`: the second solution, for a hand brought back in toward the body (a sip, a drop in front of the chest) */
  return other ? { s: (ad + beta) / DEG, e: 180 - gamma / DEG } : { s: (ad - beta) / DEG, e: gamma / DEG - 180 }
}
const unitOf = (h: number) => h / 0.93 / 600
/** a rig-frame point on a billboarded sprite of height `h` at `root`, in the scene */
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = unitOf(h)
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
/** where a scene point falls on a person's picture plane, along the camera's ray, in rig units: aim a hand AT it */
function worldToRig(target: THREE.Vector3, h: number, root: THREE.Vector3, camera: THREE.Camera): Pt {
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const n = V(Math.sin(phi), 0, Math.cos(phi))
  const d = target.clone().sub(cam)
  const k = n.dot(root.clone().sub(cam)) / n.dot(d)
  const p = cam.clone().addScaledVector(d, k)
  const u = unitOf(h)
  const lx = (p.x - root.x) * Math.cos(phi) - (p.z - root.z) * Math.sin(phi)
  return { x: 200 + lx / u, y: 600 - (p.y - root.y) / u }
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the loop time of the frame a sprite of F frames is showing at c */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)
const mixA = (a: Arm, b: Arm, k: number): Arm => (k <= 0 ? a : { s: lerp(a.s, b.s, clamp01(k)), e: lerp(a.e, b.e, clamp01(k)) })

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
/** x along [t0, t1, xTo] keys (eased); before the first key, at the last key's x (the loop wraps) */
function along(c: number, keys: [number, number, number][]): { x: number; walking: number; dir: number } {
  let x = keys[keys.length - 1][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (c <= b) {
      const k = seg(c, a, b)
      return { x: lerp(x, xt, k), walking: hold(c, a, a + 0.08, b - 0.08, b), dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}
/** a hand-held reach: aim the arm of a sprite (height h, at root) at a scene point */
/** the elbow's x in the rig frame for an arm pose */
const elbowX = (side: Side, sh: number, a: Arm) => (side === 'L' ? 200 - (sh - 6) - Math.sin(a.s * DEG) * UPPER : 200 + (sh - 6) + Math.sin(a.s * DEG) * UPPER)
/**
 * Of the two arm solutions, the one with the elbow OUT from the body (`out`, a reach), or IN across the chest (`in`,
 * a glass brought up to the mouth: the other one would be an elbow raised over the head). Measured 2026-11-18: the
 * plain solution put a hand brought in front of the chest on an elbow crossing the face.
 */
function aimAt(side: Side, sh: number, h: number, root: THREE.Vector3, cam: THREE.Camera, p: THREE.Vector3, prefer: 'out' | 'in' = 'out'): Arm {
  const q = worldToRig(p, h, root, cam)
  const a = solveArm(side, sh, q)
  const b = solveArm(side, sh, q, true)
  const sg = side === 'L' ? -1 : 1
  const outA = sg * elbowX(side, sh, a) >= sg * elbowX(side, sh, b)
  return (prefer === 'out') === outA ? a : b
}

/** a white plinth (the deck's tile look, in 3D) */
const plinthM = () => mat('#FFFFFF', { roughness: 0.42, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.14 })
const plinth = (w: number, h: number, d: number, pos: THREE.Vector3Tuple) => box(w, h, d, plinthM(), [pos[0], pos[1] + h / 2, pos[2]], 0.03)

/* ================================================================== the slide clock (Session 16 `clock.tsx`, inline:
   a builder owns one file). One clock per analogy slide, shared by its two cards: they fade in once every person on
   both cards has a first frame (READY_CAP at most), the loop starts at 0 then, a tap on either card pauses both. Held
   frames (`?still`, thumbnails) are untouched: the stage asks for `holdT` and gets it. */

const PX = 256
type Clock = { users: number; scenes: number; pending: number; ready: boolean; start: number; offset: number; lastNow: number; c: number }
const CARDS = 2
const READY_CAP = 1500
const clocks = new Map<string, Clock>()
type Flag = { on: boolean; fns: Set<(on: boolean) => void> }
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
const shownF = new Map<string, Flag>()
const pauseF = new Map<string, Flag>()
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
    setFlag(shownF, key, true)
  }
  for (const p of people)
    p.ready.then(() => {
      ck.pending--
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  if (people.length === 0 && ck.scenes >= CARDS && ck.pending <= 0) queueMicrotask(() => go(ck))
  const anchor = new THREE.Object3D()
  anchor.userData.dispose = () => {
    ck.users--
    if (ck.users <= 0) {
      clocks.delete(key)
      setFlag(pauseF, key, false)
      setFlag(shownF, key, false)
    }
  }
  scene.add(anchor)
  return {
    time(t: number): number {
      if (t === holdT) return holdT
      if (!ck.ready) return 0
      const now = frameNow()
      if (now !== ck.lastNow) {
        if (flagOf(pauseF, key).on) ck.offset += Math.max(0, now - ck.lastNow)
        ck.lastNow = now
        ck.c = (now - ck.start - ck.offset) / 1000
      }
      return ck.c
    },
  }
}
let down: { x: number; y: number; t: number } | null = null
function ClockCard({ id, w, h, children }: { id: string; w: number; h: number; children: ReactNode }) {
  const held = useHeld()
  const [on, setOn] = useState(() => flagOf(pauseF, id).on)
  const [seen, setSeen] = useState(() => flagOf(shownF, id).on)
  useEffect(() => {
    const p = flagOf(pauseF, id)
    const v = flagOf(shownF, id)
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
        setFlag(pauseF, id, !flagOf(pauseF, id).on)
      }}
      style={{ position: 'relative', width: w, height: h, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
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

/* ================================================================== glyphs drawn on canvas (screens, tiles) */

type G = CanvasRenderingContext2D
function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}
function glyphLock(g: G, cx: number, cy: number, s: number, color: string, open: boolean) {
  g.lineWidth = s * 0.16
  g.strokeStyle = color
  g.lineCap = 'round'
  g.beginPath()
  const sx = cx - s * 0.32
  const top = cy - s * 0.05
  if (open) {
    g.moveTo(sx, top - s * 0.15)
    g.arc(cx - s * 0.32 + s * 0.32, top - s * 0.38, s * 0.32, Math.PI, Math.PI * 1.85, false)
  } else {
    g.moveTo(sx, top)
    g.lineTo(sx, top - s * 0.2)
    g.arc(cx, top - s * 0.2, s * 0.32, Math.PI, 0, false)
    g.lineTo(cx + s * 0.32, top)
  }
  g.stroke()
  g.fillStyle = color
  rr(g, cx - s * 0.5, cy - s * 0.08, s, s * 0.72, s * 0.14)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.beginPath()
  g.arc(cx, cy + s * 0.22, s * 0.09, 0, TAU)
  g.fill()
  g.fillRect(cx - s * 0.035, cy + s * 0.24, s * 0.07, s * 0.18)
}
function glyphCamera(g: G, cx: number, cy: number, s: number, c: string) {
  g.fillStyle = c
  rr(g, cx - s * 0.5, cy - s * 0.3, s, s * 0.66, s * 0.12)
  g.fill()
  rr(g, cx - s * 0.18, cy - s * 0.42, s * 0.36, s * 0.16, s * 0.05)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.arc(cx, cy + s * 0.03, s * 0.2, 0, TAU)
  g.fill()
  g.fillStyle = c
  g.beginPath()
  g.arc(cx, cy + s * 0.03, s * 0.11, 0, TAU)
  g.fill()
}
function glyphPin(g: G, cx: number, cy: number, s: number, c: string) {
  g.fillStyle = c
  g.beginPath()
  g.arc(cx, cy - s * 0.12, s * 0.34, Math.PI * 0.85, Math.PI * 2.15)
  g.lineTo(cx, cy + s * 0.48)
  g.closePath()
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.arc(cx, cy - s * 0.12, s * 0.13, 0, TAU)
  g.fill()
}
function glyphMic(g: G, cx: number, cy: number, s: number, c: string) {
  g.fillStyle = c
  rr(g, cx - s * 0.17, cy - s * 0.48, s * 0.34, s * 0.6, s * 0.17)
  g.fill()
  g.strokeStyle = c
  g.lineWidth = s * 0.09
  g.beginPath()
  g.arc(cx, cy - s * 0.06, s * 0.3, 0.1 * Math.PI, 0.9 * Math.PI)
  g.stroke()
  g.fillRect(cx - s * 0.045, cy + s * 0.22, s * 0.09, s * 0.18)
  g.fillRect(cx - s * 0.18, cy + s * 0.38, s * 0.36, s * 0.08)
}
function glyphShield(g: G, cx: number, cy: number, s: number, c: string, tick = false) {
  g.fillStyle = c
  g.beginPath()
  g.moveTo(cx, cy - s * 0.5)
  g.quadraticCurveTo(cx + s * 0.3, cy - s * 0.36, cx + s * 0.44, cy - s * 0.36)
  g.quadraticCurveTo(cx + s * 0.46, cy + s * 0.22, cx, cy + s * 0.52)
  g.quadraticCurveTo(cx - s * 0.46, cy + s * 0.22, cx - s * 0.44, cy - s * 0.36)
  g.quadraticCurveTo(cx - s * 0.3, cy - s * 0.36, cx, cy - s * 0.5)
  g.fill()
  if (tick) {
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = s * 0.1
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(cx - s * 0.17, cy + s * 0.0)
    g.lineTo(cx - s * 0.03, cy + s * 0.14)
    g.lineTo(cx + s * 0.2, cy - s * 0.14)
    g.stroke()
  }
}
function glyphFinger(g: G, cx: number, cy: number, s: number, c: string) {
  g.strokeStyle = c
  g.lineWidth = s * 0.07
  g.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const r = s * (0.12 + i * 0.11)
    g.beginPath()
    g.arc(cx, cy + s * 0.08, r, Math.PI * 1.08, Math.PI * (i === 0 ? 2.1 : 1.95))
    g.stroke()
  }
  g.beginPath()
  g.moveTo(cx, cy + s * 0.08)
  g.lineTo(cx, cy + s * 0.45)
  g.stroke()
}
function glyphUser(g: G, cx: number, cy: number, s: number, c: string) {
  g.fillStyle = c
  g.beginPath()
  g.arc(cx, cy - s * 0.18, s * 0.2, 0, TAU)
  g.fill()
  g.beginPath()
  g.ellipse(cx, cy + s * 0.36, s * 0.38, s * 0.3, 0, Math.PI, 0)
  g.fill()
}
function glyphTick(g: G, cx: number, cy: number, s: number, c: string) {
  g.strokeStyle = c
  g.lineWidth = s * 0.16
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx - s * 0.32, cy + s * 0.02)
  g.lineTo(cx - s * 0.08, cy + s * 0.26)
  g.lineTo(cx + s * 0.34, cy - s * 0.22)
  g.stroke()
}
/** a round coloured disc with a glyph, as a texture (for small 3D tiles) */
const discTex = (bg: string, draw: (g: G) => void, s = 64) =>
  canvasTex(s, s, (g) => {
    g.fillStyle = bg
    g.beginPath()
    g.arc(s / 2, s / 2, s / 2 - 1, 0, TAU)
    g.fill()
    draw(g)
  })
/** a flat picture plane; it writes no depth (a transparent corner must never hide what is drawn after it: the phone's
    overlays punched black squares through its pages until this), so stacked planes are ordered by `renderOrder` */
const planeOf = (w: number, h: number, map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(map, { depthWrite: false, ...o }))
  m.castShadow = false
  return m
}

/* ================================================================== T04 · the new phone, set up securely */

const L4 = 8
const F4 = 80
const HOLD4 = 6.4 /* the tick is on: the passcode set, two permissions off, the fingerprint on */
const T4 = {
  dots: [0.55, 0.85, 1.15, 1.45],
  lock: [1.55, 1.85] as const,
  page1: [2.05, 2.35] as const,
  off: [[2.55, 2.85], [3.05, 3.35]] as [number, number][],
  page2: [3.75, 4.05] as const,
  on: [4.25, 4.6] as const,
  finger: [4.7, 5.15] as const,
  page3: [5.45, 5.75] as const,
  tick: [5.75, 6.15] as const,
  back: [7.65, 7.95] as const,
}
/** taps on the screen (the thumb, shown as a ripple where it lands): [time, canvas x, canvas y] */
const TAPS4: [number, number, number][] = [
  [0.5, 34, 166], [0.8, 100, 195], [1.1, 67, 224], [1.4, 34, 195],
  [2.5, 98, 72], [3.0, 98, 200],
  [4.2, 98, 204],
]
const SW = 0.134
const SH = 0.28
/** canvas (134 x 280) to screen-local coordinates */
const sx = (cx: number) => (cx / 134 - 0.5) * SW
const sy = (cy: number) => (0.5 - cy / 280) * SH

const OWNER_H = 1.68
const OWNER = V(-0.4, 0, 0)
/* the phone sits just BEHIND his picture plane, so his hand is drawn over its lower corner: held, not floating */
const PHONE_AT = V(0.02, 1.12, -0.05)
/* parallel to his picture plane (which turns to face the camera), so no corner of it pokes through his hand */
const PHONE_YAW = Math.atan2(0.06 - -0.4, 2.86)
const PHONE_TILT = -0.1
const PHONE_S = 1.45

function frameCam4(camera: THREE.PerspectiveCamera) {
  /* framed (coordinator, 2026-11-20) so the whole person, head to hips, stands inside the card with margin, the phone
     at a readable size and the side table on the right */
  camera.fov = 30
  camera.position.set(0.06, 1.36, 2.86)
  camera.lookAt(0.06, 1.2, 0)
  camera.updateProjectionMatrix()
}

/** a soft room: pale wall with a skirting, a window with daylight on the right, a wooden floor */
function room(scene: THREE.Scene) {
  scene.background = new THREE.Color('#DCE7F7')
  floorPlane(scene, slabTex('#D9C4A6', '#C8B08F', [14, 8]))
  scene.add(flat(box(8, 3.2, 0.1, backdrop('#E3EBF8'), [0, 1.6, -0.75])))
  scene.add(flat(box(8, 0.1, 0.03, mat('#FFFFFF', { roughness: 0.6 }), [0, 0.05, -0.69])))
  /* the window: frame, glass with daylight, a sill */
  const wx = 0.5
  const trim = mat('#FFFFFF', { roughness: 0.5 })
  scene.add(box(0.72, 0.84, 0.05, trim, [wx, 1.62, -0.69]))
  scene.add(flat(box(0.62, 0.74, 0.02, mat('#BFD8F6', { roughness: 0.15, emissive: new THREE.Color('#D8E8FB'), emissiveIntensity: 0.55 }), [wx, 1.62, -0.66])))
  scene.add(flat(box(0.03, 0.74, 0.03, trim, [wx, 1.62, -0.645])))
  scene.add(flat(box(0.62, 0.03, 0.03, trim, [wx, 1.62, -0.645])))
  scene.add(box(0.8, 0.04, 0.12, trim, [wx, 1.2, -0.64]))
}

/** the phone screen layout, in canvas units (134 x 280): sized to read at card size */
const PH = {
  lock: { y: 66, s: 50 },
  dots: { y: 126, xs: [34, 56, 78, 100], r: 7 },
  keys: { x0: 34, y0: 166, dx: 33, dy: 29, r: 12 },
  rows: [72, 136, 200],
  rowH: 54,
  icon: 26,
  track: { x0: 76, w: 44, h: 24 },
  secRow: 204,
}
const knobX = (on: number) => PH.track.x0 + PH.track.h / 2 + on * (PH.track.w - PH.track.h)

/** the phone: a dark rounded body, its screen as stacked pages (one plane each) plus the moving parts on top */
function phone(scene: THREE.Scene) {
  const g = new THREE.Group()
  g.add(box(SW + 0.016, SH + 0.022, 0.016, mat('#1C2233', { roughness: 0.3, metalness: 0.5 }), [0, 0, 0], 0.012))
  g.add(flat(box(0.03, 0.006, 0.002, mat('#2E354A'), [0, SH / 2 + 0.004, 0.0085])))
  const scr = new THREE.Group()
  scr.position.z = 0.0086
  g.add(scr)
  const base = (draw: (g: G) => void) =>
    canvasTex(134, 280, (k) => {
      const gr = k.createLinearGradient(0, 0, 0, 280)
      gr.addColorStop(0, '#FFFFFF')
      gr.addColorStop(1, '#EAF1FD')
      k.fillStyle = gr
      k.fillRect(0, 0, 134, 280)
      /* status bar: a clock pill and signal bars (no words) */
      k.fillStyle = '#C3CEE2'
      rr(k, 10, 7, 22, 6, 3)
      k.fill()
      for (let i = 0; i < 3; i++) k.fillRect(104 + i * 6, 12 - i * 2.5, 4, 2 + i * 2.5)
      draw(k)
    })
  const track = (k: G, cy: number) => {
    k.fillStyle = '#CFD8E8'
    rr(k, PH.track.x0, cy - PH.track.h / 2, PH.track.w, PH.track.h, PH.track.h / 2)
    k.fill()
  }
  /* page 0: the passcode: four dot slots and the keypad */
  const p0 = planeOf(SW, SH, base((k) => {
    k.strokeStyle = '#8FA6D2'
    k.lineWidth = 2
    for (const x of PH.dots.xs) {
      k.beginPath()
      k.arc(x, PH.dots.y, PH.dots.r, 0, TAU)
      k.stroke()
    }
    k.fillStyle = '#DDE6F6'
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        if (r === 3 && c !== 1) continue
        k.beginPath()
        k.arc(PH.keys.x0 + c * PH.keys.dx, PH.keys.y0 + r * PH.keys.dy, PH.keys.r, 0, TAU)
        k.fill()
      }
  }))
  /* page 1: permissions: camera, location, microphone, each with a toggle track */
  const p1 = planeOf(SW, SH, base((k) => {
    const glyphs = [glyphCamera, glyphPin, glyphMic]
    PH.rows.forEach((y, i) => {
      k.fillStyle = '#FFFFFF'
      rr(k, 8, y - PH.rowH / 2, 118, PH.rowH, 12)
      k.fill()
      k.fillStyle = '#E6EDFA'
      rr(k, 14, y - 19, 38, 38, 10)
      k.fill()
      glyphs[i](k, 33, y, PH.icon, colors.brand)
      track(k, y)
    })
  }))
  /* page 2: security: a large shield, the fingerprint row with its toggle */
  const p2 = planeOf(SW, SH, base((k) => {
    glyphShield(k, 67, 92, 92, '#D6E2F8')
    k.fillStyle = '#FFFFFF'
    rr(k, 8, PH.secRow - PH.rowH / 2, 118, PH.rowH, 12)
    k.fill()
    track(k, PH.secRow)
  }))
  /* page 3: done */
  const p3 = planeOf(SW, SH, base(() => {}))
  for (const [i, p] of [p0, p1, p2, p3].entries()) {
    p.position.z = 0.0004 * i
    p.renderOrder = 1 + i
    scr.add(p)
  }
  const pages = [p0, p1, p2, p3]
  const front = (z: number) => 0.0022 + z * 0.0002
  const cw = (n: number) => (n / 134) * SW

  /* page 0's moving parts: the lock (open orange / closed blue), the filled dots, the tap ripple */
  const lockOpen = planeOf(cw(64), cw(64), canvasTex(64, 64, (k) => glyphLock(k, 32, 36, PH.lock.s, colors.accent, true)))
  const lockShut = planeOf(cw(64), cw(64), canvasTex(64, 64, (k) => glyphLock(k, 32, 36, PH.lock.s, colors.brand, false)))
  for (const m of [lockOpen, lockShut]) {
    m.position.set(sx(67), sy(PH.lock.y), front(1))
    scr.add(m)
  }
  const dotTex = discTex(colors.brand, () => {})
  const dots = PH.dots.xs.map((x) => {
    const m = planeOf(cw(PH.dots.r * 2 - 2), cw(PH.dots.r * 2 - 2), dotTex)
    m.position.set(sx(x), sy(PH.dots.y), front(2))
    scr.add(m)
    return m
  })
  const ripple = planeOf(cw(34), cw(34), canvasTex(40, 40, (k) => {
    k.strokeStyle = colors.brand
    k.lineWidth = 3
    k.beginPath()
    k.arc(20, 20, 16, 0, TAU)
    k.stroke()
    k.fillStyle = 'rgba(45,99,251,0.25)'
    k.beginPath()
    k.arc(20, 20, 14, 0, TAU)
    k.fill()
  }))
  ripple.position.z = front(6)
  scr.add(ripple)
  /* toggles: a blue track overlay and a white knob, per row (page 1 rows, page 2 row) */
  const trackTex = canvasTex(PH.track.w, PH.track.h, (k) => {
    k.fillStyle = colors.brand
    rr(k, 0, 0, PH.track.w, PH.track.h, PH.track.h / 2)
    k.fill()
  })
  const knobTex = canvasTex(24, 24, (k) => {
    k.fillStyle = 'rgba(20,40,90,0.2)'
    k.beginPath()
    k.arc(12, 13, 10, 0, TAU)
    k.fill()
    k.fillStyle = '#FFFFFF'
    k.beginPath()
    k.arc(12, 12, 9.5, 0, TAU)
    k.fill()
  })
  const toggle = (cy: number) => {
    const tr = planeOf(cw(PH.track.w), cw(PH.track.h), trackTex)
    tr.position.set(sx(PH.track.x0 + PH.track.w / 2), sy(cy), front(3))
    const kn = planeOf(cw(24), cw(24), knobTex)
    kn.position.set(sx(knobX(0)), sy(cy), front(4))
    scr.add(tr, kn)
    return {
      set(on: number, o: number) {
        kn.position.x = sx(knobX(on))
        opa(tr, on * o)
        opa(kn, o)
      },
    }
  }
  const tg1 = PH.rows.map((y) => toggle(y))
  const tg2 = toggle(PH.secRow)
  const fingerOff = planeOf(cw(40), cw(40), canvasTex(40, 40, (k) => glyphFinger(k, 20, 17, 34, '#9DB2D8')))
  const fingerOn = planeOf(cw(40), cw(40), canvasTex(40, 40, (k) => glyphFinger(k, 20, 17, 34, colors.brand)))
  for (const m of [fingerOff, fingerOn]) {
    m.position.set(sx(33), sy(PH.secRow), front(3))
    scr.add(m)
  }
  /* page 3: the tick in a green disc, and a blue shield beneath */
  const tick = planeOf(cw(96), cw(96), discTex(colors.success, (k) => glyphTick(k, 32, 32, 34, '#FFFFFF')))
  tick.position.set(0, sy(112), front(5))
  scr.add(tick)
  const tickShield = planeOf(cw(56), cw(56), canvasTex(50, 50, (k) => glyphShield(k, 25, 25, 42, colors.brand, true)))
  tickShield.position.set(0, sy(208), front(5))
  scr.add(tickShield)
  /* everything on the screen above the pages draws after them */
  scr.children.forEach((o) => {
    if (!(pages as THREE.Object3D[]).includes(o)) o.renderOrder = 10
  })
  const screenGlow = halo('#9FC0FF', 0.34, 0.5)
  scene.add(screenGlow)
  g.scale.setScalar(PHONE_S)
  scene.add(g)

  return {
    g,
    update(c: number, camera: THREE.Camera) {
      /* which page shows: crossfades at each page change, back to page 0 at the end */
      const w1 = hold(c, ...T4.page1, T4.page2[0], T4.page2[1])
      const w2 = hold(c, ...T4.page2, T4.page3[0], T4.page3[1])
      const w3 = hold(c, ...T4.page3, T4.back[0], T4.back[1])
      const w0 = clamp01(1 - seg(c, ...T4.page1) + seg(c, ...T4.back))
      const ws = [w0, w1, w2, w3]
      pages.forEach((p, i) => opa(p, i === 0 ? 1 : ws[i]))
      /* page 0 */
      const shut = seg(c, ...T4.lock) * (1 - seg(c, ...T4.back))
      opa(lockOpen, w0 * (1 - shut))
      opa(lockShut, w0 * shut)
      lockShut.scale.setScalar(1 + 0.12 * hold(c, T4.lock[0], T4.lock[1], T4.lock[1] + 0.05, T4.lock[1] + 0.3))
      dots.forEach((d, i) => {
        const f = seg(c, T4.dots[i], T4.dots[i] + 0.12) * (1 - seg(c, ...T4.back))
        opa(d, w0 * f)
        d.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * f))
      })
      /* page 1: all three on, then camera and microphone switched off; location stays on */
      const offs = [seg(c, ...T4.off[0]), 0, seg(c, ...T4.off[1])]
      tg1.forEach((t, i) => t.set(1 - offs[i] * (1 - seg(c, ...T4.back)), w1))
      /* page 2: the fingerprint switch turned on */
      const on = seg(c, ...T4.on) * (1 - seg(c, ...T4.back))
      tg2.set(on, w2)
      const fp = seg(c, ...T4.finger) * (1 - seg(c, ...T4.back))
      opa(fingerOff, w2 * (1 - fp))
      opa(fingerOn, w2 * fp)
      /* page 3 */
      const tk = seg(c, ...T4.tick)
      opa(tick, w3)
      tick.scale.setScalar(Math.max(0.001, tk * (1 + 0.15 * hold(c, T4.tick[1] - 0.1, T4.tick[1], T4.tick[1], T4.tick[1] + 0.35))))
      opa(tickShield, w3 * seg(c, T4.tick[1], T4.tick[1] + 0.3))
      /* the tap ripple */
      let rp = 0
      for (const [t0, x, y] of TAPS4) {
        const k = c - t0
        if (k >= 0 && k < 0.32) {
          rp = 1 - k / 0.32
          ripple.position.set(sx(x), sy(y), front(6))
          ripple.scale.setScalar(0.5 + 0.7 * (k / 0.32))
        }
      }
      opa(ripple, rp * 0.9)
      /* the screen's soft light, brighter at the tick */
      glowAt(screenGlow, g.position, camera, 0.32 + 0.35 * w3 * tk, -0.06)
    },
  }
}

/** the open phone box on the side table: the tray with its insert, the lid lying beside it, the default passcode slip */
function phoneBox(scene: THREE.Scene, at: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(at)
  const white = mat('#FFFFFF', { roughness: 0.45 })
  /* the tray, the phone-shaped hollow in its insert */
  g.add(box(0.2, 0.05, 0.3, white, [0, 0.025, 0], 0.01))
  g.add(flat(box(0.17, 0.006, 0.27, mat('#DCE4F2', { roughness: 0.6 }), [0, 0.052, 0])))
  g.add(flat(box(0.11, 0.004, 0.22, mat('#C3CEE2', { roughness: 0.6 }), [0, 0.056, 0], 0.008)))
  /* the lid, face up, a phone outline printed on it */
  const lid = new THREE.Group()
  lid.position.set(0.25, 0, -0.02)
  lid.rotation.y = 0.18
  lid.add(box(0.21, 0.055, 0.31, white, [0, 0.0275, 0], 0.012))
  const print = planeOf(0.12, 0.22, canvasTex(60, 110, (k) => {
    k.strokeStyle = '#1C2233'
    k.lineWidth = 3
    rr(k, 6, 4, 48, 102, 9)
    k.stroke()
    k.fillStyle = colors.brand
    rr(k, 12, 12, 36, 86, 5)
    k.fill()
  }))
  print.rotation.x = -Math.PI / 2
  print.position.y = 0.0565
  lid.add(print)
  g.add(lid)
  const slip = planeOf(0.09, 0.05, canvasTex(90, 50, (k) => {
    k.fillStyle = '#FFF6D8'
    rr(k, 1, 1, 88, 48, 5)
    k.fill()
    glyphLock(k, 22, 26, 22, colors.accent, true)
    k.fillStyle = '#C9A24A'
    for (let i = 0; i < 4; i++) {
      k.beginPath()
      k.arc(46 + i * 10, 28, 3, 0, TAU)
      k.fill()
    }
  }))
  slip.rotation.x = -Math.PI / 2
  slip.rotation.z = 0.25
  slip.position.set(-0.03, 0.002, 0.2)
  g.add(slip)
  scene.add(g)
}

function sideTable(scene: THREE.Scene, x: number, z: number, top = 0.74) {
  const wood = mat('#C8955C', { roughness: 0.55 })
  scene.add(box(0.62, 0.04, 0.52, wood, [x, top, z], 0.01))
  for (const [dx, dz] of [[-0.27, -0.21], [0.27, -0.21], [-0.27, 0.21], [0.27, 0.21]]) scene.add(cyl(0.018, 0.014, top, mat('#9C6C3E', { roughness: 0.5 }), [x + dx, top / 2, z + dz], 12))
}
/** a potted plant */
function plant(scene: THREE.Scene, at: THREE.Vector3, s = 1) {
  const g = new THREE.Group()
  g.position.copy(at)
  g.add(cyl(0.07, 0.055, 0.12, mat('#F2F4F8', { roughness: 0.4 }), [0, 0.06, 0]))
  const leaf = mat('#4F9A5A', { roughness: 0.7 })
  for (let i = 0; i < 7; i++) {
    const l = mesh(new THREE.SphereGeometry(0.05, 12, 8), leaf, [0, 0, 0])
    l.scale.set(0.5, 1.6, 0.25)
    l.position.set(Math.sin(i * 2.4) * 0.04, 0.2 + (i % 3) * 0.03, Math.cos(i * 2.4) * 0.03)
    l.rotation.z = Math.sin(i * 2.4) * 0.6
    g.add(l)
  }
  g.scale.setScalar(s)
  flat(g)
  scene.add(g)
  return g
}

const OWNER_FACES: [number, string][] = [[0, 'thinking'], [0.45, 'listening'], [1.75, 'happy'], [2.3, 'thinking'], [3.5, 'neutral'], [4.1, 'thinking'], [5.1, 'happy'], [5.9, 'proud'], [7.4, 'neutral'], [7.85, 'thinking']]

function setupT04Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam4(camera)
  lights(scene, [0, 1.1, 0], 4)
  room(scene)
  sideTable(scene, 0.6, 0.02)
  phoneBox(scene, V(0.5, 0.76, 0.08))
  plant(scene, V(0.74, 0.76, -0.12), 1.1)
  const ph = phone(scene)

  const cfg = who(CAST_PRESETS.kabir, { name: 'Owner', hair: { style: 'curly', color: '#262B43' }, outfit: { top: 'hoodie', topColor: '#3E6FD8', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, build: { height: 1, shoulders: 1 } })
  const sh = buildSkin(cfg).shoulderHalf
  /* the hand holds the phone's lower right edge; the arm is aimed so the phone sits at PHONE_AT */
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(PHONE_TILT, PHONE_YAW, 0))
  const grip = V(SW * 0.18, -SH * 0.48, 0).multiplyScalar(PHONE_S)
  const gripW = grip.clone().applyQuaternion(q)
  const armAt = (c: number): Arm => {
    /* a small lift of the wrist as the thumb taps */
    let tap = 0
    for (const [t0] of TAPS4) tap = Math.max(tap, hold(c, t0 - 0.12, t0 - 0.02, t0 + 0.02, t0 + 0.14))
    const target = PHONE_AT.clone().add(gripW).add(V(0, 0.008 * tap + 0.012 * hold(c, T4.tick[0], T4.tick[1], 7.2, 7.6), 0))
    return aimAt('R', sh, OWNER_H, OWNER, camera, target, 'in')
  }
  const owner = person({
    config: cfg,
    seed: 1701,
    faces: OWNER_FACES,
    loop: L4,
    frames: F4,
    height: OWNER_H,
    redraw,
    holdT: HOLD4,
    pose: (p, c) => {
      const a = armAt(c)
      p.shoulderR = a.s
      p.elbowR = a.e
      /* a closed grip round the phone's edge */
      p.fR1 = 0.8
      p.fR2 = 0.85
      p.fR3 = 0.9
      p.fR4 = 0.9
      p.tR = 0.55
      p.shoulderL = 9
      p.elbowL = 14
      to(p, 'headTurn', 0.42, 1)
      to(p, 'headNod', 0.32, 1)
      to(p, 'lookX', 0.78, 1)
      to(p, 'lookY', 0.55, 1)
      /* at the tick: he looks up, pleased */
      const up = hold(c, 6.0, 6.35, 7.2, 7.6)
      to(p, 'headNod', 0.05, up)
      to(p, 'lookY', 0.1, up)
      to(p, 'headTilt', 3, up)
    },
  })
  owner.object.position.copy(OWNER)
  scene.add(owner.object)
  const clk = slideClock('T04', scene, devHold(HOLD4), [owner])
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L4)
    owner.update(c, camera)
    rigToWorld(handPt('R', sh, armAt(frameT(c, L4, F4))), OWNER_H, OWNER, camera, hand)
    ph.g.quaternion.copy(q)
    ph.g.position.copy(hand).sub(gripW)
    towardCamera(ph.g.position, camera, -0.03)
    ph.update(c, camera)
  }
}

/* ------------------------------------------------------------------ T04 concept: the server is hardened */

/** a rack server on its plinth: front panel with three ports (open glows orange), status lights, a side switch */
function server(scene: THREE.Scene, at: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(at)
  const shell = mat('#F7F9FD', { roughness: 0.35 })
  const W_ = 0.46
  const H_ = 0.62
  const D_ = 0.4
  g.add(box(W_, H_, D_, shell, [0, H_ / 2, 0], 0.03))
  /* front: three drive bays with blue strips */
  const fz = D_ / 2 + 0.002
  for (let i = 0; i < 3; i++) {
    g.add(flat(box(W_ - 0.08, 0.075, 0.01, mat('#E3EAF7', { roughness: 0.5 }), [0, H_ - 0.09 - i * 0.095, fz], 0.01)))
    if (i < 2) g.add(flat(box(0.12, 0.016, 0.012, glowM(colors.brand, colors.brand), [-0.1, H_ - 0.09 - i * 0.095, fz + 0.004])))
  }
  /* the third bay holds the safe-setting switch: a track and a knob that slides across to on */
  const swY = H_ - 0.09 - 2 * 0.095
  const swTrack = glowM(colors.brand, '#AEB8CA')
  g.add(flat(box(0.13, 0.05, 0.012, swTrack, [0, swY, fz + 0.006], 0.024)))
  const swKnob = flat(box(0.048, 0.048, 0.02, mat('#FFFFFF', { roughness: 0.3 }), [-0.04, swY, fz + 0.014], 0.022))
  g.add(swKnob)
  /* status lights */
  const leds = [0, 1, 2].map((i) => {
    const m = glowM(colors.success, '#BFE9D2')
    g.add(flat(mesh(new THREE.SphereGeometry(0.012, 12, 8), m, [0.13 + i * 0.035, H_ - 0.09, fz + 0.006])))
    return m
  })
  /* three ports in a row; a shutter slides over two of them */
  const portY = 0.13
  const ports = [-0.12, 0, 0.12].map((x) => {
    g.add(flat(box(0.085, 0.07, 0.012, mat('#2A3145', { roughness: 0.5 }), [x, portY, fz])))
    const glow = glowM(colors.accent, '#3A2A22')
    g.add(flat(box(0.06, 0.045, 0.004, glow, [x, portY, fz + 0.007])))
    const shutter = box(0.092, 0.078, 0.014, mat('#C9D3E6', { roughness: 0.35, metalness: 0.3 }), [x, portY + 0.09, fz + 0.012], 0.006)
    g.add(flat(shutter))
    return { glow, shutter, x }
  })
  scene.add(g)
  return {
    g,
    ports,
    leds,
    H: H_,
    setSwitch(on: number) {
      swKnob.position.x = lerp(-0.04, 0.04, on)
      swTrack.color.set(on > 0.5 ? colors.brand : '#AEB8CA')
      swTrack.emissiveIntensity = 0.9 * on
    },
  }
}

/** an account tile on a stand: a user disc, four passcode dots, a padlock; default (orange) or hardened (blue) */
function accountTile(tint: string, locked: boolean) {
  return canvasTex(120, 150, (k) => {
    k.fillStyle = '#FFFFFF'
    rr(k, 2, 2, 116, 146, 18)
    k.fill()
    k.strokeStyle = tint
    k.lineWidth = 4
    rr(k, 2, 2, 116, 146, 18)
    k.stroke()
    k.fillStyle = tint
    k.globalAlpha = 0.14
    k.beginPath()
    k.arc(60, 44, 30, 0, TAU)
    k.fill()
    k.globalAlpha = 1
    glyphUser(k, 60, 46, 44, tint)
    k.strokeStyle = tint
    k.globalAlpha = 0.45
    k.lineWidth = 2
    for (const x of [30, 50, 70, 90]) {
      k.beginPath()
      k.arc(x, 88, 6, 0, TAU)
      k.stroke()
    }
    k.globalAlpha = 1
    glyphLock(k, 60, 120, 28, tint, !locked)
  })
}

function setupT04Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  frameCam4(camera)
  lights(scene, [0, 1.1, 0], 4)
  scene.background = new THREE.Color('#E6EDF9')
  floorPlane(scene, slabTex('#E1E8F5', '#CDD8EC', [12, 7]))
  scene.add(flat(box(8, 3.2, 0.1, backdrop('#E9EFF9'), [0, 1.6, -0.75])))
  scene.add(flat(box(8, 0.08, 0.03, mat('#C9D3E6', { roughness: 0.7 }), [0, 0.04, -0.69])))

  /* centre (the phone's place): the server on a plinth */
  const SRV_BASE = 0.55
  scene.add(plinth(0.62, SRV_BASE, 0.5, [0.08, 0, 0.12]))
  const srv = server(scene, V(0.08, SRV_BASE, 0.12))
  const shield = new THREE.Group()
  const shieldTex = canvasTex(120, 130, (k) => glyphShield(k, 60, 66, 116, colors.success, true))
  const shieldPlane = planeOf(0.34, 0.37, shieldTex)
  shieldPlane.renderOrder = 6
  shield.add(shieldPlane)
  shield.position.set(0.08, SRV_BASE + srv.H + 0.3, 0.36)
  scene.add(shield)
  const srvGlow = halo('#BFF2D6', 0.9, 0.9, true)
  scene.add(srvGlow)

  /* left (the owner's place): the account stand; the default tile, the hardened tile */
  const standX = -0.42
  scene.add(plinth(0.36, 0.86, 0.3, [standX, 0, 0.05]))
  scene.add(flat(box(0.03, 0.18, 0.03, mat('#C9D3E6', { metalness: 0.3, roughness: 0.4 }), [standX, 0.95, 0.05])))
  const tileOld = planeOf(0.3, 0.375, accountTile(colors.accent, false))
  const tileNew = planeOf(0.3, 0.375, accountTile(colors.brand, true))
  scene.add(tileOld, tileNew)
  const tileAt = V(standX, 1.25, 0.08)
  const tileGlow = halo('#8FB0FF', 0.6)
  scene.add(tileGlow)
  /* four passcode dots under the new tile's lock (the same four as on the phone) */
  const dotTex = discTex(colors.brand, () => {})
  const dots = [0, 1, 2, 3].map(() => {
    const m = planeOf(0.03, 0.03, dotTex)
    m.renderOrder = 6
    scene.add(m)
    return m
  })

  /* right (the box's place): a bin on a low stand where the default account goes */
  const binAt = V(0.6, 0, 0.05)
  scene.add(plinth(0.44, 0.52, 0.4, [binAt.x, 0, binAt.z]))
  binAt.y = 0.52
  const bin = new THREE.Group()
  bin.position.copy(binAt)
  bin.add(cyl(0.17, 0.13, 0.42, mat('#D7DEEA', { roughness: 0.45, metalness: 0.2 }), [0, 0.21, 0], 32))
  bin.add(flat(cyl(0.15, 0.15, 0.01, mat('#3A4256', { roughness: 0.8 }), [0, 0.418, 0], 32)))
  bin.add(flat(mesh(new THREE.TorusGeometry(0.168, 0.012, 10, 40).rotateX(Math.PI / 2), mat('#C2CBDB', { metalness: 0.4, roughness: 0.3 }), [0, 0.42, 0])))
  scene.add(bin)

  const clk = slideClock('T04', scene, devHold(HOLD4), [])
  const up = V(0, 1, 0)
  return (t: number) => {
    const c = mod(clk.time(t), L4)
    const back = seg(c, ...T4.back)
    /* beat 1: the four dots fill with the phone's taps; the default tile drops into the bin, the locked one rises */
    const drop = seg(c, T4.lock[0], T4.lock[1] + 0.35)
    const rise = seg(c, T4.lock[0] + 0.25, T4.lock[1] + 0.45)
    /* the four dots sit on the tile, between the person and the lock: typed on the default tile, kept on the new one */
    dots.forEach((d, i) => {
      const f = seg(c, T4.dots[i], T4.dots[i] + 0.12)
      const vis = f * (1 - seg(c, T4.lock[0], T4.lock[0] + 0.15)) + rise * (1 - back)
      d.position.copy(tileAt).add(V(-0.075 + i * 0.05, (0.5 - 88 / 150) * 0.375, 0.012))
      d.quaternion.copy(camera.quaternion)
      opa(d, clamp01(vis))
      d.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * clamp01(vis)))
    })
    /* the old tile: an arc over to the bin, shrinking into it; back on the stand at the loop's start */
    const binTop = V(binAt.x, binAt.y + 0.48, binAt.z)
    const oldPos = arc(tileAt, binTop, drop, 0.35)
    tileOld.position.copy(oldPos)
    tileOld.quaternion.copy(camera.quaternion)
    tileOld.rotateOnWorldAxis(up, 0)
    tileOld.rotateZ(-0.8 * drop)
    tileOld.scale.setScalar(Math.max(0.001, 1 - 0.75 * seg(c, T4.lock[0] + 0.15, T4.lock[1] + 0.35)))
    const oldBack = back
    opa(tileOld, drop < 0.98 ? 1 : oldBack)
    if (drop >= 0.98) {
      tileOld.position.copy(tileAt)
      tileOld.quaternion.copy(camera.quaternion)
      tileOld.scale.setScalar(Math.max(0.001, oldBack))
    }
    tileNew.position.copy(tileAt).add(V(0, -0.25 * (1 - rise), -0.02))
    tileNew.quaternion.copy(camera.quaternion)
    opa(tileNew, rise * (1 - back))
    glowAt(tileGlow, tileAt, camera, 0.55 * hold(c, T4.lock[1], T4.lock[1] + 0.3, T4.lock[1] + 0.6, T4.lock[1] + 1.0), -0.05)

    /* beat 2: two of three ports shut (the outer two), the middle one stays open for the service that needs it */
    const shutK = [seg(c, ...T4.off[0]), 0, seg(c, ...T4.off[1])].map((v) => v * (1 - back))
    srv.ports.forEach((p, i) => {
      p.shutter.position.y = 0.13 + 0.09 * (1 - shutK[i])
      p.glow.emissiveIntensity = (i === 1 ? 0.55 : 1.1) * (1 - shutK[i]) * (0.85 + 0.15 * Math.sin(TAU * 1.5 * c + i))
      p.glow.emissive.set(i === 1 ? colors.brand : colors.accent)
    })
    /* beat 3: the safe-setting switch flips on */
    const on = seg(c, ...T4.on) * (1 - back)
    srv.setSwitch(on)
    srv.leds.forEach((m, i) => (m.emissiveIntensity = 0.5 + 0.6 * Math.max(0, Math.sin(TAU * (c * 0.8 - i * 0.22)))))
    /* beat 4: the green shield rises in front of the server */
    const sk = seg(c, ...T4.tick) * (1 - back)
    shield.position.y = SRV_BASE + srv.H + 0.22 + 0.1 * sk + 0.015 * Math.sin(TAU * c * 0.6) * sk
    shield.quaternion.copy(camera.quaternion)
    shield.scale.setScalar(Math.max(0.001, sk * (1 + 0.12 * hold(c, T4.tick[1] - 0.1, T4.tick[1], T4.tick[1], T4.tick[1] + 0.35))))
    opa(shieldPlane, sk)
    glowAt(srvGlow, shield.position, camera, 0.6 * sk, -0.04)
  }
}

/* ================================================================== T05 · the car's regular service inspection */

const L5 = 9
const F5 = 108
const HOLD5 = 5.75 /* the bonnet is up, the engine is being checked; the tyre and the brakes are already green */
const X5 = { tyre: -0.98, brake: 0.42, engine: 1.58, start: -0.98 }
const T5 = {
  tyre: { reach: [0.25, 0.6] as const, low: [0.6, 0.9] as const, fill: [1.2, 2.05] as const, ok: [2.0, 2.3] as const, done: [2.3, 2.55] as const },
  walk1: [2.55, 3.35] as const,
  brake: { reach: [3.35, 3.7] as const, light: [3.7, 4.0] as const, ok: [4.2, 4.5] as const, done: [4.5, 4.7] as const },
  walk2: [4.7, 5.25] as const,
  engine: { lift: [5.25, 5.55] as const, look: [5.55, 6.4] as const, ok: [6.1, 6.4] as const, shut: [6.45, 6.8] as const },
  walk3: [6.8, 8.65] as const,
  page: [7.1, 7.7] as const,
  reset: [8.6, 8.95] as const,
}
const WALK5: [number, number, number][] = [
  [T5.walk1[0], T5.walk1[1], X5.brake],
  [T5.walk2[0], T5.walk2[1], X5.engine],
  [T5.walk3[0], T5.walk3[1], X5.start],
]
const MECH_H = 1.72
const MECH_Z = 0.62
/* the car is modelled in its own units (`len` 2.04) and drawn K times larger; `rearX` / `frontX` are wheel centres in
   the model's x (relative to CAR.x) */
const K5 = 1.15
const CAR = { x: 0.2, lift: 0.42, wr: 0.23, yw: 0.1, rearX: -0.64, frontX: 0.64, len: 2.04, bodyH: 0.4, z: -0.2 }
/** the lift platform's top: the tyres stand on it */
/** the bonnet: hinged at x0 (the windscreen end), `len` to its front edge, in model units */
const BON = { x0: 0.3, len: 0.7, y: CAR.wr + 0.05 + CAR.bodyH / 2 + 0.005 }
const DECK_Y = CAR.lift + K5 * (CAR.yw - CAR.wr)
/** a point of the car model, in the scene */
const carW = (x: number, y: number, z: number) => V(CAR.x + K5 * x, CAR.lift + K5 * y, CAR.z + K5 * z)


function frameCam5(camera: THREE.PerspectiveCamera) {
  camera.fov = 38
  camera.position.set(0.3, 1.42, 4.5)
  camera.lookAt(0.3, 1.06, 0)
  camera.updateProjectionMatrix()
}

/** the garage: concrete floor, a back wall with a roller door panel, a lift's two posts */
function garage(scene: THREE.Scene) {
  scene.background = new THREE.Color('#DDE6F3')
  floorPlane(scene, slabTex('#CFD3DA', '#BCC2CC', [10, 6]))
  scene.add(flat(box(9, 3.4, 0.1, backdrop('#E6ECF5'), [0, 1.7, -1.15])))
  /* the roller door behind the car: horizontal slats, a frame */
  const doorM = mat('#D3DCEA', { roughness: 0.6 })
  for (let i = 0; i < 9; i++) scene.add(flat(box(2.4, 0.2, 0.03, doorM, [0.55, 0.14 + i * 0.23, -1.08], 0.01)))
  scene.add(flat(box(2.56, 0.08, 0.06, mat('#FFFFFF', { roughness: 0.5 }), [0.55, 2.2, -1.06])))
  /* a floor line marking the bay */
  scene.add(flat(box(3.2, 0.004, 0.04, mat('#F2C14E', { roughness: 0.6 }), [0.3, 0.002, 0.95])))
  /* the scissor lift under the car: a platform under the sills, crossed arms down to a base plate */
  const liftM = mat('#3B5BA9', { roughness: 0.45, metalness: 0.25 })
  const baseM = mat('#2A3145', { roughness: 0.6 })
  scene.add(box(2.5, 0.06, 0.72, liftM, [CAR.x, DECK_Y - 0.03, CAR.z + 0.12], 0.02))
  scene.add(flat(box(2.0, 0.04, 0.76, baseM, [CAR.x, 0.02, CAR.z + 0.12], 0.01)))
  const armL = Math.hypot(1.3, DECK_Y - 0.1)
  const ang = Math.atan2(DECK_Y - 0.1, 1.3)
  for (const sgn of [-1, 1])
    for (const dz of [-0.26, 0.26]) {
      const a = box(armL, 0.05, 0.05, liftM, [CAR.x, (DECK_Y - 0.06) / 2 + 0.04, CAR.z + 0.12 + dz], 0.015)
      a.rotation.z = sgn * ang
      scene.add(a)
    }
  scene.add(cyl(0.035, 0.035, 0.6, mat('#C9D2E0', { metalness: 0.7, roughness: 0.25 }), [CAR.x, (DECK_Y - 0.06) / 2 + 0.04, CAR.z + 0.12], 16).rotateX(Math.PI / 2))
}

/** a small hatchback in side view (front to +x), up on the lift */
function car(scene: THREE.Scene) {
  const g = new THREE.Group()
  g.position.set(CAR.x, CAR.lift, CAR.z)
  g.scale.setScalar(K5)
  const paint = mat('#2F6BE8', { roughness: 0.28, metalness: 0.35 })
  const glass = mat('#BFD6F3', { roughness: 0.1, metalness: 0.3, emissive: new THREE.Color('#D4E4F8'), emissiveIntensity: 0.25 })
  const dark = mat('#20283A', { roughness: 0.6 })
  const L = CAR.len
  /* lower body */
  g.add(box(L, CAR.bodyH, 0.82, paint, [0, CAR.wr + 0.05, 0], 0.09))
  /* cabin */
  const cab = box(L * 0.56, 0.36, 0.76, paint, [-0.14, CAR.wr + 0.05 + CAR.bodyH / 2 + 0.17, 0], 0.11)
  g.add(cab)
  /* side windows */
  g.add(flat(box(L * 0.24, 0.24, 0.005, glass, [-0.36, CAR.wr + 0.05 + CAR.bodyH / 2 + 0.19, 0.383], 0.04)))
  g.add(flat(box(L * 0.22, 0.24, 0.005, glass, [0.12, CAR.wr + 0.05 + CAR.bodyH / 2 + 0.19, 0.383], 0.04)))
  g.add(flat(box(0.05, 0.36, 0.006, paint, [-0.115, CAR.wr + 0.05 + CAR.bodyH / 2 + 0.17, 0.385])))
  /* door line, handle, headlight, tail light, bumper */
  g.add(flat(box(0.006, 0.34, 0.006, dark, [-0.12, CAR.wr + 0.05, 0.412])))
  g.add(flat(box(0.08, 0.02, 0.01, mat('#DCE4F2', { metalness: 0.6, roughness: 0.25 }), [0.0, CAR.wr + 0.16, 0.414])))
  g.add(flat(box(0.05, 0.08, 0.34, glowM('#FFF1C2', '#FFF6DE'), [L / 2 - 0.01, CAR.wr + 0.13, 0.2], 0.02)))
  g.add(flat(box(0.05, 0.07, 0.3, glowM('#FF8A3D', '#E8642A'), [-L / 2 + 0.01, CAR.wr + 0.14, 0.22], 0.02)))
  g.add(flat(box(L + 0.04, 0.07, 0.84, dark, [0, CAR.wr - 0.1, 0], 0.03)))
  /* wheel arches */
  for (const x of [CAR.rearX, CAR.frontX]) g.add(flat(mesh(new THREE.CylinderGeometry(CAR.wr + 0.04, CAR.wr + 0.04, 0.02, 32, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), dark, [x, CAR.yw, 0.416])))
  /* wheels: tyre, rim with spokes, a brake disc behind the spokes */
  const tyreM = mat('#22252E', { roughness: 0.85 })
  const rimM = mat('#D3DAE6', { metalness: 0.75, roughness: 0.22 })
  const wheel = (x: number) => {
    const w = new THREE.Group()
    w.position.set(x, CAR.yw, 0.36)
    const tyre = mesh(new THREE.TorusGeometry(CAR.wr - 0.06, 0.065, 16, 40), tyreM, [0, 0, 0])
    w.add(tyre)
    const disc = glowM(colors.success, '#9AA3B2', { metalness: 0.6, roughness: 0.3 })
    w.add(flat(cyl(0.12, 0.12, 0.02, disc, [0, 0, -0.03]).rotateX(Math.PI / 2)))
    const spokes = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const s = box(0.035, CAR.wr - 0.06, 0.02, rimM, [0, (CAR.wr - 0.06) / 2, 0.015])
      const p = new THREE.Group()
      p.rotation.z = (i / 5) * TAU
      p.add(s)
      spokes.add(p)
    }
    spokes.add(flat(cyl(0.045, 0.045, 0.03, rimM, [0, 0, 0.02]).rotateX(Math.PI / 2)))
    w.add(flat(mesh(new THREE.TorusGeometry(CAR.wr - 0.065, 0.012, 10, 40), rimM, [0, 0, 0.02])))
    w.add(spokes)
    g.add(w)
    return { w, tyre, disc, spokes }
  }
  const rear = wheel(CAR.rearX)
  const front = wheel(CAR.frontX)
  /* the bonnet, hinged at the windscreen end, over the engine */
  const bonnet = new THREE.Group()
  bonnet.position.set(BON.x0, BON.y, 0)
  bonnet.add(box(BON.len, 0.035, 0.8, paint, [BON.len / 2, 0.0, 0], 0.015))
  g.add(bonnet)
  /* the engine under it: a block with a glowing cap (checked) */
  const engM = glowM(colors.success, '#7D879A', { metalness: 0.5, roughness: 0.35 })
  g.add(flat(box(0.34, 0.06, 0.5, engM, [0.66, CAR.wr + 0.05 + CAR.bodyH / 2 - 0.02, 0], 0.02)))
  g.add(flat(cyl(0.04, 0.04, 0.04, mat('#F2C14E', { roughness: 0.4 }), [0.56, CAR.wr + 0.05 + CAR.bodyH / 2 + 0.01, 0.12])))
  scene.add(g)
  return { g, rear, front, bonnet, engM }
}

/** the service calendar on the wall: a backing card with rings, and a page that flips up over the top */
function calendar(scene: THREE.Scene, at: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(at)
  g.scale.setScalar(1.3)
  const pageTex = (mark: number) =>
    canvasTex(100, 110, (k) => {
      k.fillStyle = '#FFFFFF'
      rr(k, 1, 1, 98, 108, 6)
      k.fill()
      k.fillStyle = colors.brand
      rr(k, 1, 1, 98, 24, 6)
      k.fill()
      k.fillRect(1, 14, 98, 11)
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 5; c++) {
          k.fillStyle = r * 5 + c === mark ? colors.accent : '#DCE4F2'
          k.beginPath()
          k.arc(16 + c * 17, 42 + r * 18, 5.5, 0, TAU)
          k.fill()
        }
    })
  g.add(flat(box(0.36, 0.4, 0.015, mat('#C8D2E4', { roughness: 0.6 }), [0, 0, -0.01], 0.01)))
  const under = planeOf(0.33, 0.36, pageTex(13))
  under.position.z = 0.002
  g.add(under)
  const pivot = new THREE.Group()
  pivot.position.set(0, 0.18, 0.006)
  const top = planeOf(0.33, 0.36, pageTex(6), { side: THREE.DoubleSide })
  top.position.y = -0.18
  pivot.add(top)
  g.add(pivot)
  for (const x of [-0.1, 0.1]) g.add(flat(mesh(new THREE.TorusGeometry(0.018, 0.005, 8, 16), mat('#8A94A8', { metalness: 0.6, roughness: 0.3 }), [x, 0.19, 0.01])))
  scene.add(g)
  return {
    /** k: the page turns up and over; `fresh`: the next page fades in, flat (never a page swinging back) */
    set(k: number, fresh: number) {
      if (fresh > 0) {
        pivot.rotation.x = 0
        opa(top, fresh)
        return
      }
      pivot.rotation.x = -Math.PI * 0.95 * k
      opa(top, 1 - seg(k, 0.85, 1))
    },
  }
}

/** a tick badge (green disc) that pops over a checked part */
function tickBadge(scene: THREE.Scene, color = colors.success) {
  const m = planeOf(0.18, 0.18, discTex(color, (k) => glyphTick(k, 32, 32, 34, '#FFFFFF')))
  m.renderOrder = 5
  scene.add(m)
  return m
}
function flagBadge(scene: THREE.Scene) {
  const m = planeOf(0.18, 0.18, discTex(colors.accent, (k) => {
    k.fillStyle = '#FFFFFF'
    k.fillRect(29, 14, 6, 26)
    k.beginPath()
    k.arc(32, 48, 4, 0, TAU)
    k.fill()
  }))
  m.renderOrder = 5
  scene.add(m)
  return m
}
function badgeAt(b: THREE.Mesh, p: THREE.Vector3, camera: THREE.Camera, k: number, c: number) {
  b.position.copy(p).add(V(0, 0.02 * Math.sin(TAU * c * 0.8), 0))
  b.quaternion.copy(camera.quaternion)
  b.scale.setScalar(Math.max(0.001, k * (1 + 0.15 * Math.max(0, 1 - Math.abs(k - 0.75) * 4) * 0)))
  opa(b, k)
}
/** badge visibility: pops at a, stays to the loop's end (reset fades it) */
const stay = (c: number, a: readonly [number, number]) => seg(c, ...a) * (1 - seg(c, ...T5.reset))

const MECH_FACES: [number, string][] = [[0, 'thinking'], [0.75, 'worried'], [1.3, 'thinking'], [2.05, 'happy'], [2.6, 'neutral'], [3.45, 'thinking'], [4.25, 'happy'], [4.75, 'neutral'], [5.4, 'thinking'], [6.15, 'proud'], [6.85, 'happy'], [8.0, 'neutral'], [8.6, 'thinking']]

/** the mechanic's overall bib and straps over the shirt, and a work cap (rig body frame 400 x 600, head-local cap) */
const OVERALL = (fill: string, edge: string) => (
  <g data-part="overall">
    <path d="M 160 250 H 240 V 300 C 250 306 252 320 252 340 L 250 420 H 150 L 148 340 C 148 320 150 306 160 300 Z" fill={fill} />
    <path d="M 160 250 L 150 210 M 240 250 L 250 210" stroke={fill} strokeWidth={14} strokeLinecap="round" />
    <rect x={180} y={270} width={40} height={26} rx={5} fill={edge} opacity={0.55} />
    <circle cx={163} cy={258} r={5} fill="#E8C25A" />
    <circle cx={237} cy={258} r={5} fill="#E8C25A" />
  </g>
)

/** what the mechanic holds: a tyre inflator gauge, a torch, then empty hands at the bonnet */
function tools(scene: THREE.Scene) {
  const gauge = new THREE.Group()
  gauge.add(cyl(0.022, 0.022, 0.12, mat('#2A3145', { roughness: 0.4 }), [0, 0, 0]).rotateZ(Math.PI / 2))
  gauge.add(flat(cyl(0.045, 0.045, 0.02, mat('#F2F4F8', { roughness: 0.3 }), [-0.06, 0.035, 0]).rotateX(Math.PI / 2)))
  const needleM = glowM(colors.accent, colors.accent)
  const needle = flat(box(0.006, 0.034, 0.004, needleM, [0, 0.012, 0]))
  const needlePivot = new THREE.Group()
  needlePivot.position.set(-0.06, 0.035, 0.012)
  needlePivot.add(needle)
  gauge.add(needlePivot)
  const torch = new THREE.Group()
  torch.add(cyl(0.022, 0.026, 0.14, mat('#F2C14E', { roughness: 0.35 }), [0, 0, 0]).rotateZ(Math.PI / 2))
  torch.add(flat(cyl(0.03, 0.026, 0.02, mat('#FFF6DE', { emissive: new THREE.Color('#FFF1C2'), emissiveIntensity: 1 }), [0.075, 0, 0]).rotateZ(Math.PI / 2)))
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 24, 1, true).rotateZ(Math.PI / 2).translate(0.33, 0, 0), new THREE.MeshBasicMaterial({ color: '#FFF3C4', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }))
  torch.add(beam)
  scene.add(gauge, torch)
  return { gauge, needlePivot, needleM, torch, beam }
}

function setupT05Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  frameCam5(camera)
  lights(scene, [0.3, 1, 0], 5)
  garage(scene)
  const cr = car(scene)
  const cal = calendar(scene, V(-1.3, 2.3, -1.08))
  const tl = tools(scene)
  const tick1 = tickBadge(scene)
  const tick2 = tickBadge(scene)
  const tick3 = tickBadge(scene)
  const flag1 = flagBadge(scene)
  const tyreGlow = halo(colors.accent, 0.7, 0.7, true)
  const okGlow = halo('#7FE0A8', 0.7, 0.7, true)
  scene.add(tyreGlow, okGlow)

  const cfg = who(CAST_PRESETS.rohan, { name: 'Mechanic', outfit: { top: 'shirt', topColor: '#E9EEF6', bottom: 'trousers', bottomColor: '#2C4C86', shoeColor: '#2A2A30' }, accessories: { beard: 'none', watch: false, belt: false } })
  const sh = buildSkin(cfg).shoulderHalf
  const rootAt = (c: number) => {
    const at = along(c, WALK5)
    return { at, root: V(at.x, bob(at.walking, c), MECH_Z) }
  }
  /* where each hand works: the rear tyre's valve, the front brake disc, the bonnet's edge */
  const VALVE = carW(CAR.rearX + 0.02, CAR.yw - 0.1, 0.44)
  const DISC = carW(CAR.frontX - 0.02, CAR.yw + 0.08, 0.44)
  const BONNET = carW(BON.x0 + BON.len, BON.y + 0.03, 0.3)
  const armR = (c: number): Arm => {
    const { at, root } = rootAt(c)
    let a: Arm = { s: 8 - swing(c, at.walking), e: 12 }
    a = mixA(a, aimAt('R', sh, MECH_H, root, camera, VALVE.clone().add(V(0.12, 0.02, 0))), hold(c, T5.tyre.reach[0], T5.tyre.reach[1], T5.tyre.done[0], T5.tyre.done[1]))
    a = mixA(a, aimAt('R', sh, MECH_H, root, camera, DISC.clone().add(V(-0.08, 0.16, 0))), hold(c, T5.brake.reach[0], T5.brake.reach[1], T5.brake.done[0], T5.brake.done[1]))
    return a
  }
  const armL = (c: number): Arm => {
    const { at, root } = rootAt(c)
    let a: Arm = { s: 8 + swing(c, at.walking), e: 12 }
    /* at the bonnet: he lifts it with his left hand (he stands to its right) and holds it up while he looks */
    const lift = hold(c, T5.engine.lift[0] - 0.15, T5.engine.lift[0], T5.engine.shut[1] - 0.05, T5.engine.shut[1] + 0.1)
    const raised = seg(c, ...T5.engine.lift) * (1 - seg(c, ...T5.engine.shut))
    const a5 = 0.95 * raised
    const edge = raised > 0.001 ? carW(BON.x0 + BON.len * Math.cos(a5), BON.y + BON.len * Math.sin(a5) + 0.03, 0.3) : BONNET
    a = mixA(a, aimAt('L', sh, MECH_H, root, camera, edge), lift)
    return a
  }
  const mech = person({
    config: cfg,
    dress: (k) => ({ ...withTop(OVERALL('#2C4C86', '#1D355F'))(k), hairFront: <>{k.hairFront}{PEAK_CAP('#2C4C86', '#1D355F', '#F2C14E')}</> }),
    seed: 1702,
    faces: MECH_FACES,
    loop: L5,
    frames: F5,
    height: MECH_H,
    redraw,
    holdT: HOLD5,
    pose: (p, c) => {
      const { at } = rootAt(c)
      const r = armR(c)
      const l = armL(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = l.s
      p.elbowL = l.e
      walkLegs(p, c, at.walking, at.dir)
      /* facing the car part he works on: toward screen-right at the tyre and the brake, toward the left at the bonnet */
      const atEngine = hold(c, T5.walk2[1] - 0.1, T5.walk2[1], T5.walk3[0], T5.walk3[0] + 0.15)
      const work = Math.max(hold(c, T5.tyre.reach[0], T5.tyre.reach[1], T5.tyre.done[0], T5.tyre.done[1]), hold(c, T5.brake.reach[0], T5.brake.reach[1], T5.brake.done[0], T5.brake.done[1]))
      to(p, 'headTurn', 0.32, work)
      to(p, 'lookX', 0.7, work)
      to(p, 'lookY', 0.55, work)
      to(p, 'headNod', 0.25, work)
      to(p, 'bow', 0.18, work)
      to(p, 'kneeL', 0.25, work)
      to(p, 'kneeR', 0.25, work)
      to(p, 'headTurn', -0.4, atEngine)
      to(p, 'lookX', -0.8, atEngine)
      to(p, 'lookY', 0.45, hold(c, ...T5.engine.look, T5.engine.shut[0], T5.engine.shut[1]))
      /* he glances at the calendar as it turns, on his way back */
      const glance = hold(c, T5.page[0] - 0.2, T5.page[0], T5.page[1], T5.page[1] + 0.3)
      to(p, 'lookY', -0.45, glance)
    },
  })
  scene.add(mech.object)
  const clk = slideClock('T05', scene, devHold(HOLD5), [mech])
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(clk.time(t), L5)
    const { root } = rootAt(c)
    mech.object.position.copy(root)
    mech.update(c, camera)
    const cq = frameT(c, L5, F5)
    const rq = rootAt(cq).root
    rigToWorld(handPt('R', sh, armR(cq)), MECH_H, rq, camera, hand)
    towardCamera(hand, camera, 0.1)

    /* the tyre: low (squashed, orange), the gauge's needle low, then inflated back to round, green */
    const T = T5.tyre
    const fill = seg(c, ...T.fill) + seg(c, ...T5.reset) * 0
    const low = 1 - fill * (1 - seg(c, ...T5.reset))
    const lowK = clamp01(low)
    cr.rear.tyre.scale.set(1 + 0.05 * lowK, 1 - 0.08 * lowK, 1)
    cr.rear.tyre.position.y = -0.018 * lowK
    const showGauge = hold(c, T.reach[0], T.reach[0] + 0.1, T.done[0], T.done[1])
    tl.gauge.visible = showGauge > 0.02
    tl.gauge.position.copy(hand)
    tl.gauge.rotation.set(0, 0, -0.5)
    tl.gauge.scale.setScalar(Math.max(0.001, showGauge))
    tl.needlePivot.rotation.z = lerp(1.0, -1.0, fill)
    tl.needleM.emissive.set(fill > 0.6 ? colors.success : colors.accent)
    tl.needleM.color.set(fill > 0.6 ? colors.success : colors.accent)
    const wheelR = carW(CAR.rearX, CAR.yw, 0.46)
    glowAt(tyreGlow, wheelR, camera, 0.75 * hold(c, ...T.low, T.fill[1] - 0.3, T.fill[1]) * (0.8 + 0.2 * Math.sin(TAU * 2 * c)), 0.05)
    badgeAt(flag1, wheelR.clone().add(V(0, 0.42, 0)), camera, hold(c, ...T.low, T.fill[0] + 0.3, T.fill[1] - 0.2), c)
    badgeAt(tick1, wheelR.clone().add(V(0, 0.42, 0)), camera, stay(c, T.ok), c)

    /* the brakes: the torch lights the disc through the spokes, the disc glows green */
    const B = T5.brake
    const showTorch = hold(c, B.reach[0], B.reach[0] + 0.1, B.done[0], B.done[1])
    tl.torch.visible = showTorch > 0.02
    tl.torch.position.copy(hand)
    const discAt = carW(CAR.frontX, CAR.yw, 0.36)
    const dir = discAt.clone().sub(hand).normalize()
    tl.torch.quaternion.setFromUnitVectors(V(1, 0, 0), dir)
    tl.torch.scale.setScalar(Math.max(0.001, showTorch))
    ;(tl.beam.material as THREE.MeshBasicMaterial).opacity = 0.28 * hold(c, ...B.light, B.done[0] - 0.1, B.done[0])
    tl.beam.scale.set(Math.min(1, hand.distanceTo(discAt) / 0.5), 1, 1)
    cr.front.disc.emissiveIntensity = 0.9 * hold(c, B.light[1], B.ok[0], B.ok[1], B.done[1] + 0.2)
    badgeAt(tick2, discAt.clone().add(V(0, 0.42, 0.1)), camera, stay(c, B.ok), c)

    /* the engine: the bonnet lifts with his hand, the engine block glows green while checked, the bonnet closes */
    const E = T5.engine
    const up = seg(c, ...E.lift) * (1 - seg(c, ...E.shut))
    cr.bonnet.rotation.z = 0.95 * up
    cr.engM.emissiveIntensity = 0.8 * hold(c, E.ok[0], E.ok[1], E.shut[0], E.shut[1])
    badgeAt(tick3, carW(0.66, CAR.wr + 0.95, 0.2), camera, stay(c, E.ok), c)
    glowAt(okGlow, carW(0.66, CAR.wr + 0.3, 0), camera, 0.5 * hold(c, E.ok[0], E.ok[1], E.shut[0], E.shut[1]), 0.3)

    /* the calendar: a page turns over (the next service date), and is back for the next loop */
    cal.set(seg(c, ...T5.page), seg(c, ...T5.reset))
  }
}

/* ------------------------------------------------------------------ T05 concept: CSPM scans the live resources */

/** a storage bucket: tapered body, a lid hinged at the back that lifts when the bucket is left open */
function bucket3d(at: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(at)
  const body = mat(colors.brand, { roughness: 0.3, metalness: 0.1 })
  g.add(cyl(0.2, 0.15, 0.34, body, [0, 0.17, 0], 40))
  g.add(flat(mesh(new THREE.TorusGeometry(0.2, 0.018, 10, 40).rotateX(Math.PI / 2), mat('#8DB0FF', { roughness: 0.3 }), [0, 0.34, 0])))
  for (const y of [0.1, 0.22]) g.add(flat(mesh(new THREE.TorusGeometry(0.18 - y * 0.12, 0.008, 8, 40).rotateX(Math.PI / 2), mat('#1640C8'), [0, y, 0])))
  const inner = glowM(colors.accent, '#2A3145')
  g.add(flat(cyl(0.18, 0.18, 0.005, inner, [0, 0.336, 0], 40)))
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 0.35, -0.2)
  lidPivot.add(cyl(0.215, 0.215, 0.03, mat('#2D63FB', { roughness: 0.25 }), [0, 0.0, 0.2], 40))
  lidPivot.add(flat(box(0.08, 0.03, 0.04, mat('#8DB0FF'), [0, 0.03, 0.2], 0.01)))
  g.add(lidPivot)
  return { g, lidPivot, inner }
}
/** the security group: a firewall wall of bricks with a shield on its face */
function firewall3d(at: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(at)
  const brickA = mat('#5B86F0', { roughness: 0.45 })
  const brickB = mat('#3F6EE6', { roughness: 0.45 })
  for (let r = 0; r < 4; r++)
    for (let i = 0; i < 4; i++) {
      const off = r % 2 ? 0.055 : 0
      const x = -0.165 + i * 0.11 + off
      if (x > 0.2) continue
      g.add(box(0.1, 0.075, 0.12, (r + i) % 2 ? brickA : brickB, [x, 0.04 + r * 0.082, 0], 0.012))
    }
  const shieldM = glowM(colors.success, '#FFFFFF')
  const s = planeOf(0.16, 0.17, canvasTex(60, 64, (k) => glyphShield(k, 30, 32, 56, '#FFFFFF', true)))
  s.position.set(0, 0.17, 0.065)
  g.add(s)
  return { g, shieldM }
}

function setupT05Concept(kit: StageKit): Update {
  const { scene, camera } = kit
  frameCam5(camera)
  lights(scene, [0.3, 1, 0], 5)
  scene.background = new THREE.Color('#E6EDF9')
  floorPlane(scene, slabTex('#E1E8F5', '#CDD8EC', [10, 6]))
  scene.add(flat(box(9, 3.4, 0.1, backdrop('#E9EFF9'), [0, 1.7, -1.15])))
  /* a long cloud platform under the three resources (where the car stands) */
  scene.add(box(3.3, 0.08, 1.0, mat('#FFFFFF', { roughness: 0.45, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.1 }), [0.3, 0.04, CAR.z], 0.03))
  /* three plinths: the bucket (the rear wheel's place), the security group (the front wheel's), the server (the engine's) */
  const P = [-0.62, 0.52, 1.58]
  const plH = 0.46
  for (const x of P) scene.add(plinth(0.78, plH, 0.62, [x, 0.08, CAR.z]))
  const top = 0.08 + plH
  const bk = bucket3d(V(P[0], top, CAR.z))
  bk.g.scale.setScalar(1.6)
  const fw = firewall3d(V(P[1], top, CAR.z))
  fw.g.scale.setScalar(1.75)
  const sv = server(scene, V(P[2], top, CAR.z))
  sv.g.scale.setScalar(1.05)
  sv.ports.forEach((p) => (p.shutter.position.y = 0.13))
  sv.setSwitch(1)
  scene.add(bk.g, fw.g)

  /* the wall clock where the calendar hangs: the scan interval */
  const clockG = new THREE.Group()
  clockG.position.set(-1.3, 2.3, -1.08)
  clockG.scale.setScalar(1.15)
  clockG.add(flat(cyl(0.2, 0.2, 0.04, mat('#FFFFFF', { roughness: 0.4 }), [0, 0, 0], 40).rotateX(Math.PI / 2)))
  clockG.add(flat(mesh(new THREE.TorusGeometry(0.2, 0.02, 10, 40), mat(colors.brand, { roughness: 0.35 }), [0, 0, 0.02])))
  for (let i = 0; i < 12; i++) {
    const m = flat(box(0.012, i % 3 ? 0.02 : 0.04, 0.004, mat('#5B6683'), [Math.sin((i / 12) * TAU) * 0.16, Math.cos((i / 12) * TAU) * 0.16, 0.024]))
    m.rotation.z = -(i / 12) * TAU
    clockG.add(m)
  }
  const hand = new THREE.Group()
  hand.position.z = 0.03
  hand.add(flat(box(0.016, 0.14, 0.006, mat(colors.accent), [0, 0.06, 0])))
  clockG.add(hand)
  clockG.add(flat(cyl(0.02, 0.02, 0.01, mat('#1D3563'), [0, 0, 0.034]).rotateX(Math.PI / 2)))
  scene.add(clockG)

  /* the scanner drone: a disc body with a lens, a scan cone down to the resource it is over */
  const drone = new THREE.Group()
  drone.add(cyl(0.16, 0.18, 0.06, mat('#FFFFFF', { roughness: 0.3 }), [0, 0, 0], 40))
  drone.add(flat(mesh(new THREE.TorusGeometry(0.17, 0.014, 10, 40).rotateX(Math.PI / 2), mat(colors.brand, { roughness: 0.3 }), [0, 0, 0])))
  const lensM = glowM('#7FA6FF', colors.brand)
  drone.add(flat(mesh(new THREE.SphereGeometry(0.06, 20, 14, 0, TAU, Math.PI / 2, Math.PI / 2), lensM, [0, -0.03, 0])))
  for (const s of [-1, 1]) {
    drone.add(flat(box(0.12, 0.012, 0.02, mat('#C9D3E6'), [s * 0.22, 0.03, 0])))
    const rotor = flat(cyl(0.08, 0.08, 0.006, mat('#9DB8FF', { transparent: true, opacity: 0.55 }), [s * 0.29, 0.045, 0], 24))
    rotor.name = 'rotor'
    drone.add(rotor)
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 32, 1, true).translate(0, -0.3, 0), new THREE.MeshBasicMaterial({ color: '#8FB0FF', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }))
  drone.add(cone)
  drone.scale.setScalar(1.35)
  scene.add(drone)
  const tick1 = tickBadge(scene)
  const tick2 = tickBadge(scene)
  const tick3 = tickBadge(scene)
  const flag1 = flagBadge(scene)
  const bkGlow = halo(colors.accent, 0.8, 0.8, true)
  scene.add(bkGlow)

  const clk = slideClock('T05', scene, devHold(HOLD5), [])
  /* the drone's x follows the mechanic's walk; its stops are over each resource */
  const stops: [number, number, number][] = [
    [T5.walk1[0], T5.walk1[1], P[1]],
    [T5.walk2[0], T5.walk2[1], P[2]],
    [T5.walk3[0], T5.walk3[1], P[0]],
  ]
  return (t: number) => {
    const c = mod(clk.time(t), L5)
    const at = along(c, stops)
    drone.position.set(at.x, 2.02 + 0.03 * Math.sin(TAU * c * 0.7), CAR.z + 0.05)
    drone.rotation.z = -0.12 * at.walking * at.dir
    drone.children.forEach((ch) => ch.name === 'rotor' && (ch.rotation.y = c * 40))
    const scanning = Math.max(
      hold(c, T5.tyre.reach[0], T5.tyre.low[0], T5.tyre.done[0], T5.tyre.done[1]),
      hold(c, T5.brake.reach[0], T5.brake.light[0], T5.brake.done[0], T5.brake.done[1]),
      hold(c, T5.engine.lift[0], T5.engine.look[0], T5.engine.shut[0], T5.engine.shut[1]),
    )
    ;(cone.material as THREE.MeshBasicMaterial).opacity = 0.22 * scanning * (0.85 + 0.15 * Math.sin(TAU * 3 * c))
    cone.scale.set(1, 1.32, 1)
    lensM.emissiveIntensity = 0.4 + 1.0 * scanning

    /* the bucket: left open (lid up, orange inside) is the drift; flagged, then closed: set right */
    const T = T5.tyre
    const fixed = seg(c, ...T.fill) * (1 - seg(c, ...T5.reset))
    bk.lidPivot.rotation.x = -0.85 * (1 - fixed)
    bk.inner.emissiveIntensity = 1.0 * (1 - fixed) * (0.8 + 0.2 * Math.sin(TAU * 2 * c))
    const bkAt = V(P[0], top + 0.3, CAR.z + 0.05)
    glowAt(bkGlow, bkAt, camera, 0.7 * hold(c, ...T.low, T.fill[1] - 0.3, T.fill[1]) * (0.8 + 0.2 * Math.sin(TAU * 2 * c)), 0.3)
    badgeAt(flag1, V(P[0], top + 0.9, CAR.z + 0.2), camera, hold(c, ...T.low, T.fill[0] + 0.3, T.fill[1] - 0.2), c)
    badgeAt(tick1, V(P[0], top + 0.9, CAR.z + 0.2), camera, stay(c, T.ok), c)
    /* the security group and the server: scanned, green */
    badgeAt(tick2, V(P[1], top + 0.9, CAR.z + 0.2), camera, stay(c, T5.brake.ok), c)
    badgeAt(tick3, V(P[2], top + 0.95, CAR.z + 0.2), camera, stay(c, T5.engine.ok), c)
    sv.leds.forEach((m, i) => (m.emissiveIntensity = 0.5 + 0.6 * Math.max(0, Math.sin(TAU * (c * 0.8 - i * 0.22)))))
    sv.ports.forEach((p, i) => (p.glow.emissiveIntensity = i === 1 ? 0.6 : 0))
    sv.ports.forEach((p) => p.glow.emissive.set(colors.brand))
    /* the clock hand sweeps once at the interval: the next regular scan */
    hand.rotation.z = -TAU * seg(c, ...T5.page)
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
  H_T04Everyday: card('T04', setupT04Everyday, devHold(HOLD4)),
  H_T04Concept: card('T04', setupT04Concept, devHold(HOLD4)),
  H_T05Everyday: card('T05', setupT05Everyday, devHold(HOLD5)),
  H_T05Concept: card('T05', setupT05Concept, devHold(HOLD5)),
}
export const css = ''
