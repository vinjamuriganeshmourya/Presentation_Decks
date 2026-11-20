import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CastSprite, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { useHeld } from '@/engine/figkit'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import guardDutyUrl from '../images/aws-guardduty.svg'
import secretsUrl from '../images/aws-secrets-manager.svg'

/**
 * BUILDER I · SESSION 17 (Security Practices & Compliance) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * to the Sessions 15 / 16 standard: a perspective camera and a real place; people are Character Lab characters from the
 * engine's `castSprite` (role clothing by `dress`), each an individual with expressions keyed to the action; NO TEXT on
 * either card; one wall-clock loop per slide shared by both cards beat for beat and place for place (the clock below,
 * Session 16's `custom/clock.tsx`: the cards fade in once every person has a first frame, tap pauses both), each loop
 * ending in the state it starts in; held frames (`?still`, thumbnails) draw the telling moment at HOLD.
 *
 * SLIDE 28 · T11-AN (TR 11): "A bank's fraud system watches every transaction and flags only an unusual withdrawal:
 * just as managed threat detection scans account activity and surfaces only what looks malicious."
 *
 *   place (x)      everyday: a bank hall                            concept: an AWS account and GuardDuty
 *   -1.15          the ATM against the wall                         the account's laptop on its pedestal
 *   -0.45          the customer at the ATM                          (the account's own activity)
 *   wall, top      the bank's network line: one line from the ATM,  the same two glass lines: the account's
 *                  one from the other branches (right)              calls, and the other log sources (right)
 *    0.75          the fraud monitor: transactions scroll up        the GuardDuty engine: activity scrolls up
 *    1.42          the fraud analyst                                the findings board
 *
 *   every 1 s      a transaction rides in from the branches and     a tile rides in and its row scrolls up,
 *                  its row scrolls up the monitor, ticked           passed
 *   0.5 - 2.0      the customer keys in a withdrawal                (the laptop is busy)
 *   2.6 - 3.6      the ATM pushes out a thick wad of notes          the laptop sends an unusual call (orange)
 *   2.7 - 4.0      that withdrawal rides the line to the monitor    that tile rides the line to the engine
 *   4.0 - 6.8      ITS row arrives flagged; the beacon flashes;     ITS row arrives flagged; it is lifted onto
 *                  the analyst looks up and points at it            the findings board under an orange flag
 *   6.2 - 7.0      the wad goes into the customer's bag             the finding is handled and clears
 *
 * SLIDE 33 · T13-AN (TR 13): "A bank does not print a locker's key inside the passbook anyone can read; the key is
 * handed over separately on a verified request, exactly as a secret store releases a credential only to an authorised
 * application at runtime."
 *
 *   place (x)      everyday: a bank counter                         concept: the application and the secret store
 *   -0.75          the customer                                     the application (a laptop on a pedestal)
 *   -0.25          the ID check pad on the counter                  the IAM check pad on the desk
 *    0.45          her passbook lying open: no key in it            the application's code lying open: no secret
 *    0.15 - 0.55   the bank officer behind the counter              a shuttle on a rail behind the desk
 *    1.02          the guarded key cabinet, her key on a hook       the Secrets Manager vault, the credential inside
 *
 *   0.2 - 1.45     the ID is laid on the pad; it scans green         the app's role badge on the pad; IAM check green
 *   1.7 - 4.1      the officer fetches her key from the cabinet     the shuttle fetches the credential from the vault
 *   4.1 - 4.65     the key is handed over                           the credential is handed to the application
 *   4.7 - 6.0      the customer holds the key (passbook: none)      the app uses it (its code still has none)
 *   6.0 - 8.85     the key is handed back and hung up again         the credential goes back into the vault
 *   8.3 - 8.6      the ID is taken back                              the badge goes back to the app
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
  brand: colors.brand,
  brandDark: colors.brandDark,
  navy: colors.nwNavy,
  orange: colors.accent,
  green: colors.success,
  teal: colors.teal,
  white: colors.white,
  gold: '#F2C14E',
  goldDark: '#C8962A',
  steel: '#C9D1DE',
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
/** an official mark (svg url) rasterised on a white rounded tile (rule 54) */
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
/** a data packet's face: rows of bits, blue on white (no words) */
function dataTex() {
  return canvasTex(96, 96, (g) => {
    rr(g, 0, 0, 96, 96, 14, '#FFFFFF')
    const rows = [
      [1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1],
      [1, 1, 0, 1, 0],
      [0, 1, 0, 1, 1],
    ]
    rows.forEach((row, j) =>
      row.forEach((b, i) => {
        if (b) rr(g, 14 + i * 14.5, 16 + j * 17, 10, 10, 3, C.brand)
        else {
          g.strokeStyle = C.brand
          g.lineWidth = 2.6
          g.beginPath()
          g.arc(19 + i * 14.5, 21 + j * 17, 4, 0, TAU)
          g.stroke()
        }
      }),
    )
  })
}
/** a laptop's screen: an app window with a header and three tiles (no words) */
function screenTex() {
  return canvasTex(160, 104, (g) => {
    rr(g, 0, 0, 160, 104, 4, '#0F1B3D')
    rr(g, 6, 6, 148, 92, 4, '#F4F7FD')
    rr(g, 6, 6, 148, 14, 4, C.brand)
    for (const x of [12, 20, 28]) {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.arc(x, 13, 2.4, 0, TAU)
      g.fill()
    }
    rr(g, 14, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 60, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 106, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 22, 36, 24, 14, 3, C.brand)
    rr(g, 68, 36, 24, 14, 3, C.teal)
    rr(g, 114, 36, 24, 14, 3, '#7C9CF5')
    rr(g, 14, 66, 132, 6, 3, '#C3CCDD')
    rr(g, 14, 78, 96, 6, 3, '#DCE2EE')
  })
}
/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: V3, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)
  const o = new THREE.Mesh(geo, m)
  o.position.set(...pos)
  o.castShadow = true
  o.receiveShadow = true
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
/** a white that reads white under the scene's light */
const WHITE_M = () => mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.32 })
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const noShadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
/** a picture: a plane facing +z */
function picture(tex: THREE.Texture, w: number, h: number, pos: V3, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(tex, o))
  m.position.set(...pos)
  return m
}
function floorPlane(w: number, d: number, m: THREE.Material, pos: V3) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
  p.rotation.x = -Math.PI / 2
  p.position.set(...pos)
  p.receiveShadow = true
  return p
}
const haloTex = () =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
function halo(color: string, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: haloTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}
const setOp = (m: THREE.Mesh, o: number) => ((m.material as THREE.MeshBasicMaterial).opacity = o)
function lights(scene: THREE.Scene, target: V3, key = 2.0) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
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
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
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

/** a data packet: a white rounded cube with its bits on the front */
function makePacket(size = 0.2) {
  const g = new THREE.Group()
  const bodyM = mat('#FFFFFF', { roughness: 0.3, metalness: 0.05, emissive: new THREE.Color('#7FB0FF'), emissiveIntensity: 0 })
  g.add(box(size, size, size, bodyM, [0, 0, 0], size * 0.16))
  const face = picture(dataTex(), size * 0.8, size * 0.8, [0, 0, size / 2 + 0.002])
  g.add(face)
  return { g, bodyM }
}

/* ------------------------------------------------------------------ Character Lab people */

/* people frames: the size the engine picks for a 1080p screen (Session 16 T21) */
const PX = 256
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
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT?: number }): CastSprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes. Session 16's
     round-3 lesson: frames at ONE fixed size (re-sizing after the slide's zoom-in hid a person while a new set was
     built) and no idle breathing (a still pose is one shared picture, so the moving frames are built sooner) */
  const quiet = (c: number) => o.holdT !== undefined && Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 60,
    px: PX,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing (rig body frame 400 x 600; head-local skull centre 0,0) */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
const LANYARD = (strap: string, card: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 194 266 M 214 206 L 206 266" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={185} y={264} width={30} height={38} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <rect x={191} y={270} width={18} height={13} rx={2} fill={card} opacity={0.75} />
    <rect x={191} y={287} width={18} height={3} rx={1.5} fill={card} opacity={0.45} />
    <rect x={191} y={293} width={12} height={3} rx={1.5} fill={card} opacity={0.45} />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 85 + 14 to the grip; an angle is measured from hanging straight down, positive lifts away from the body,
   the forearm at shoulder minus elbow) and the inverse, so a hand lands on the thing it reaches for ---- */

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
/** the arm angles that put this hand at rig point p: of the two elbow solutions, the one with the LOWER elbow (an
 *  arm holding something up in front), so a near target never lifts the elbow across the face */
function ik(side: 'L' | 'R', sh: number, p: Pt, _down = false): Arm {
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
/** a world point, seen from `cam`, carried onto the plane of a person standing at root (h tall): rig coordinates */
function rigTarget(T: THREE.Vector3, root: THREE.Vector3, h: number, cam: V3): Pt {
  const k = (root.z + 0.08 - cam[2]) / (T.z - cam[2])
  const px = cam[0] + (T.x - cam[0]) * k
  const py = cam[1] + (T.y - cam[1]) * k
  const u = h / 0.93 / 600
  return { x: 200 + (px - root.x) / u, y: 600 - (py - root.y) / u }
}
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = h / 0.93 / 600
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the hand of the frame the sprite is showing, in the world (a prop in that hand goes here) */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.08)
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
      const walking = hold(c, a, a + 0.08, b - 0.08, b)
      return { x: lerp(x, xt, k), walking, dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}

/* ================================================================== one clock per analogy slide (Session 16's custom/clock.tsx)
 * Both cards of a slide read one clock, so they stay beat for beat. The cards fade in (opacity only) once every person
 * on BOTH cards has a first frame, and the loop starts from 0 at that moment (never later than READY_CAP). A tap on
 * either card pauses both; leaving the slide resets it. Held frames (`?still`, thumbnails) get `holdT` untouched. */

type Clock = { users: number; scenes: number; pending: number; ready: boolean; start: number; offset: number; lastNow: number; c: number }
const CARDS = 2
const READY_CAP = 1500
const clocks = new Map<string, Clock>()
type Flag = { on: boolean; fns: Set<(on: boolean) => void> }
const shown = new Map<string, Flag>()
const paused = new Map<string, Flag>()
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

/** in a card's setup: the slide's clock; `time(t)` turns the stage's t into loop time (holdT passes through) */
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
    setFlag(shown, key, true)
  }
  for (const p of people)
    p.ready.then(() => {
      ck.pending--
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  if (people.length === 0)
    queueMicrotask(() => {
      if (ck.scenes >= CARDS && ck.pending <= 0) go(ck)
    })
  /* the scene's teardown calls userData.dispose on every object: the last card out drops the clock */
  const anchor = new THREE.Object3D()
  anchor.userData.dispose = () => {
    ck.users--
    if (ck.users <= 0) {
      clocks.delete(key)
      setFlag(paused, key, false)
      setFlag(shown, key, false)
    }
  }
  scene.add(anchor)
  return {
    time(t: number): number {
      if (t === holdT) return holdT
      if (!ck.ready) return 0
      const now = frameNow()
      if (now !== ck.lastNow) {
        if (flagOf(paused, key).on) ck.offset += Math.max(0, now - ck.lastNow)
        ck.lastNow = now
        ck.c = (now - ck.start - ck.offset) / 1000
      }
      return ck.c
    },
  }
}

let down: { x: number; y: number; t: number } | null = null
/** the card's box: the stage; a tap pauses / plays both cards of the slide; a small pause mark while paused */
function ClockCard({ id, children }: { id: string; children: ReactNode }) {
  const held = useHeld()
  const [on, setOn] = useState(() => flagOf(paused, id).on)
  const [seen, setSeen] = useState(() => flagOf(shown, id).on)
  useEffect(() => {
    const p = flagOf(paused, id)
    const v = flagOf(shown, id)
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
        setFlag(paused, id, !flagOf(paused, id).on)
      }}
      style={{ position: 'relative', width: W, height: H, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      <div style={{ display: 'grid', placeItems: 'center', opacity: held || seen ? 1 : 0, transition: held ? 'none' : 'opacity 320ms cubic-bezier(0.22,1,0.36,1)' }}>{children}</div>
      <span
        aria-hidden
        style={{ position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 99, background: 'rgba(255,255,255,0.92)', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: 'opacity 240ms cubic-bezier(0.22,1,0.36,1)', pointerEvents: 'none' }}
      >
        <svg width={14} height={14} viewBox="0 0 14 14">
          <rect x={2} y={1.5} width={3.6} height={11} rx={1.2} fill={C.brand} />
          <rect x={8.4} y={1.5} width={3.6} height={11} rx={1.2} fill={C.brand} />
        </svg>
      </span>
    </div>
  )
}

/* ================================================================== shared pieces of this file */

/** an orthogonal line on the wall: points, its length, and a point at distance d along it */
type Path = THREE.Vector3[]
const pathLen = (p: Path) => p.slice(1).reduce((s, q, i) => s + q.distanceTo(p[i]), 0)
function pathAt(p: Path, d: number, out: THREE.Vector3) {
  let r = Math.max(0, d)
  for (let i = 1; i < p.length; i++) {
    const l = p[i].distanceTo(p[i - 1])
    if (r <= l) return out.copy(p[i - 1]).lerp(p[i], l > 0 ? r / l : 0)
    r -= l
  }
  return out.copy(p[p.length - 1])
}
/** a conduit along a path: round tubes with round elbows */
function conduit(scene: THREE.Scene, p: Path, m: THREE.Material, r = 0.02) {
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]
    const b = p[i]
    const l = a.distanceTo(b)
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 14), m)
    t.position.copy(a).add(b).multiplyScalar(0.5)
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    t.castShadow = false
    scene.add(t)
  }
  for (const q of p) scene.add(noShadow(mesh(new THREE.SphereGeometry(r, 14, 10), m, [q.x, q.y, q.z])))
}
/** a flag on a pole: the cloth sways while it flies (`up` 0..1 raises it) */
function makeFlag(color: string, s = 1) {
  const g = new THREE.Group()
  const pole = mat('#C9D1DE', { metalness: 0.8, roughness: 0.25 })
  g.add(noShadow(cyl(0.008 * s, 0.008 * s, 0.34 * s, pole, [0, 0.17 * s, 0], 10)))
  g.add(noShadow(mesh(new THREE.SphereGeometry(0.014 * s, 12, 10), pole, [0, 0.345 * s, 0])))
  const clothM = mat(color, { roughness: 0.5, emissive: new THREE.Color(color), emissiveIntensity: 0.35, side: THREE.DoubleSide })
  const pivot = new THREE.Group()
  pivot.position.set(0, 0.27 * s, 0)
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.16 * s, 0.1 * s, 6, 1), clothM)
  cloth.position.x = 0.08 * s
  pivot.add(cloth)
  g.add(pivot)
  return {
    g,
    clothM,
    set: (up: number, c: number) => {
      g.scale.setScalar(Math.max(0.001, up))
      pivot.rotation.y = 0.28 * Math.sin(c * TAU * 1.1)
      pivot.rotation.z = 0.04 * Math.sin(c * TAU * 1.7)
    },
  }
}
/** a beacon lamp: a dome that flashes (`k` 0..1) */
function makeBeacon(color: string) {
  const g = new THREE.Group()
  g.add(cyl(0.05, 0.055, 0.025, mat('#3B4458', { metalness: 0.5, roughness: 0.4 }), [0, 0.012, 0], 20))
  const domeM = glowM(color, '#F7D2B8', { transparent: true, opacity: 0.95 })
  g.add(noShadow(mesh(new THREE.SphereGeometry(0.042, 20, 12, 0, TAU, 0, Math.PI / 2), domeM, [0, 0.025, 0])))
  const glow = halo(color, 0.34)
  glow.position.set(0, 0.05, 0.02)
  g.add(glow)
  return {
    g,
    set: (k: number) => {
      domeM.emissiveIntensity = 2.2 * k
      setOp(glow, 0.85 * k)
    },
  }
}
const ORANGE = C.orange
/** a bank emblem: a white rounded square with a blue building mark (no words) */
function emblemTex() {
  return canvasTex(80, 80, (g) => {
    rr(g, 2, 2, 76, 76, 16, '#FFFFFF')
    g.fillStyle = C.brand
    g.beginPath()
    g.moveTo(40, 13)
    g.lineTo(66, 28)
    g.lineTo(14, 28)
    g.closePath()
    g.fill()
    for (const x of [19, 31, 43, 55]) rr(g, x, 32, 6, 24, 1.5, C.brand)
    rr(g, 14, 58, 52, 8, 2, C.brand)
  })
}
/** one row of a monitor's feed (no words): a coin or a tile glyph, two bars, a green tick or an orange flag */
function rowTex(kind: 'ok' | 'flag', glyph: 'coin' | 'tile') {
  return canvasTex(300, 32, (g) => {
    const bad = kind === 'flag'
    rr(g, 1, 1, 298, 30, 7, bad ? '#FFE6D3' : '#FFFFFF')
    if (bad) {
      g.strokeStyle = ORANGE
      g.lineWidth = 2.5
      g.beginPath()
      g.roundRect(2, 2, 296, 28, 7)
      g.stroke()
    }
    if (glyph === 'coin') {
      g.fillStyle = bad ? ORANGE : '#E3B341'
      g.beginPath()
      g.arc(20, 16, 9, 0, TAU)
      g.fill()
      g.strokeStyle = '#FFFFFF'
      g.lineWidth = 2
      g.beginPath()
      g.arc(20, 16, 5, 0, TAU)
      g.stroke()
    } else {
      rr(g, 11, 7, 18, 18, 4, bad ? ORANGE : C.brand)
      rr(g, 15, 11, 4, 4, 1, '#FFFFFF')
      rr(g, 21, 17, 4, 4, 1, '#FFFFFF')
    }
    rr(g, 40, 9, bad ? 132 : 96, 6, 3, bad ? '#E08A55' : '#AFC0DD')
    rr(g, 40, 19, 70, 5, 2.5, bad ? '#F1B48C' : '#D3DCEC')
    rr(g, 190, 11, bad ? 64 : 40, 10, 5, bad ? '#F6A06A' : '#DCE6F7')
    if (bad) {
      /* a flag */
      g.fillStyle = '#9A4A1A'
      g.fillRect(274, 6, 2.5, 20)
      g.fillStyle = ORANGE
      g.beginPath()
      g.moveTo(276.5, 6)
      g.lineTo(292, 10.5)
      g.lineTo(276.5, 15)
      g.closePath()
      g.fill()
    } else {
      g.fillStyle = C.green
      g.beginPath()
      g.arc(282, 16, 9, 0, TAU)
      g.fill()
      g.strokeStyle = '#FFFFFF'
      g.lineWidth = 2.6
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(277.5, 16.5)
      g.lineTo(281, 20)
      g.lineTo(287, 12.5)
      g.stroke()
    }
  })
}
/** the screen behind a feed: a white page with a blue header strip (no words) */
function feedScreenTex(dark = false) {
  return canvasTex(320, 200, (g) => {
    rr(g, 0, 0, 320, 200, 6, dark ? '#16234A' : '#F1F5FC')
    rr(g, 0, 0, 320, 22, 6, C.brand)
    g.fillRect(0, 12, 320, 10)
    for (const x of [12, 22, 32]) {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.arc(x, 11, 3, 0, TAU)
      g.fill()
    }
    rr(g, 230, 7, 76, 8, 4, 'rgba(255,255,255,0.55)')
  })
}

/** a scrolling feed on a screen: rows enter at the bottom one a second and rise; row FLAG is the flagged one */
function makeFeed(parent: THREE.Object3D, o: { w: number; yBot: number; step: number; n: number; flagRow: number; glyph: 'coin' | 'tile'; z: number; show?: number }) {
  const okTex = rowTex('ok', o.glyph)
  const badTex = rowTex('flag', o.glyph)
  const rows: THREE.Mesh[] = []
  for (let k = 0; k < o.n; k++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.w * (32 / 300)), new THREE.MeshBasicMaterial({ map: k === o.flagRow ? badTex : okTex, transparent: true, toneMapped: false, opacity: 0, depthWrite: false }))
    m.position.z = o.z
    m.renderOrder = 3
    parent.add(m)
    rows.push(m)
  }
  const SHOW = o.show ?? 5
  /** the row's height on screen at loop time c (age 0 = just in), and its opacity */
  const rowAt = (k: number, c: number, L: number) => {
    const age = mod(c - k * (L / o.n), L)
    return { y: o.yBot + age * o.step, op: age < SHOW ? seg(age, 0, 0.3) * (1 - seg(age, SHOW - 0.45, SHOW)) : 0, age }
  }
  return {
    rowAt,
    update: (c: number, L: number) => {
      rows.forEach((m, k) => {
        const r = rowAt(k, c, L)
        m.position.y = r.y
        ;(m.material as THREE.MeshBasicMaterial).opacity = r.op
        m.visible = r.op > 0.001
      })
    },
  }
}

/** a coin token for the bank's line */
function makeCoin(color: string, emissive = 0.15) {
  const m = mat(color, { roughness: 0.25, metalness: 0.7, emissive: new THREE.Color(color), emissiveIntensity: emissive })
  const g = new THREE.Group()
  const c = cyl(0.036, 0.036, 0.012, m, [0, 0, 0], 24)
  c.rotation.x = Math.PI / 2
  g.add(c)
  const glow = halo(color, 0.18)
  glow.position.z = 0.012
  g.add(glow)
  return { g, m, glow }
}

/* ================================================================== T11 · the bank's fraud desk */

const L11 = 8
const F11 = 120
const HOLD11 = 4.9 /* the flagged row on the monitor, the beacon lit, the analyst pointing, the customer holding the wad */
const CAM11: V3 = [0.12, 1.45, 3.35]
const AT11: V3 = [0.12, 0.95, -0.6]
const P11 = {
  wallZ: -1.0,
  atm: { x: -1.05, z: -0.79, w: 0.62, d: 0.42, h: 1.5 },
  cust: { x: -0.4, z: -0.15, h: 1.74 },
  mon: { x: 0.66, y: 1.36, z: -0.55, w: 0.78, h: 0.52 },
  desk: { x0: 0.22, x1: 1.06, top: 0.86, z0: -0.78, z1: -0.36 },
  ana: { x: 1.22, z: -0.15, h: 1.66 },
  lineY: 2.0,
  lineZ: -0.95,
}
const ATM_FRONT = P11.atm.z + P11.atm.d / 2
const KEYPAD11 = new THREE.Vector3(-1.08, 1.06, ATM_FRONT + 0.05)
const SLOT11 = new THREE.Vector3(-0.94, 0.9, ATM_FRONT + 0.01)
/* the two lines into the monitor: from the ATM, and from the other branches (off to the right) */
const PATH_A: Path = [v3([-1.05, 1.62, P11.lineZ]), v3([-1.05, P11.lineY, P11.lineZ]), v3([P11.mon.x, P11.lineY, P11.lineZ]), v3([P11.mon.x, 1.6, P11.lineZ])]
const PATH_B: Path = [v3([2.6, P11.lineY, P11.lineZ]), v3([P11.mon.x, P11.lineY, P11.lineZ]), v3([P11.mon.x, 1.6, P11.lineZ])]
const SPEED11 = 2.4
const FEED_N = 8 /* one row a second */
const FLAG_ROW = 4 /* the ATM's withdrawal: its row enters at 4.0 */
const T11 = {
  type: [0.5, 0.7, 1.85, 2.05] as const, // hand to the keypad, keys, hand back
  slot: [2.55, 2.75] as const, // the cash slot lights
  wadOut: [2.7, 3.25] as const, // the wad slides out of the slot
  take: [3.1, 3.45, 3.55, 4.1] as const, // hand to the slot, at the wad, wad in hand, hand to the chest
  hold: [4.1, 6.15] as const,
  bag: [6.15, 6.55, 6.65, 7.05] as const, // hand to the bag, wad in, hand back
  flag: [4.0, 4.2, 6.6, 6.95] as const, // the flagged row's rim, the beacon
  point: [4.3, 4.65, 6.0, 6.4] as const,
}
const atmDepart = 4.0 - pathLen(PATH_A) / SPEED11

/** the bank hall: floor, wall and a skirting band */
function hall11(scene: THREE.Scene, o: { wall: string; floor: [string, string]; band: string; glow?: number }) {
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 2, [9, 6]), roughness: 0.5, emissive: new THREE.Color(o.floor[0]), emissiveIntensity: (o.glow ?? 0.2) * 0.4 }), [0, 0, 0.5]))
  scene.add(box(9, 3.6, 0.1, mat(o.wall, { roughness: 0.8, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.2 }), [0, 1.8, P11.wallZ - 0.05]))
  scene.add(noShadow(box(9, 0.1, 0.04, mat(o.band, { roughness: 0.6 }), [0, 0.05, P11.wallZ + 0.02])))
}

/* ------------------------------------------------------------------ T11 everyday: the bank hall */

/** an ATM's screen: a blue page with a coin and two buttons (no words) */
function atmScreenTex() {
  return canvasTex(180, 124, (g) => {
    const bg = g.createLinearGradient(0, 0, 0, 124)
    bg.addColorStop(0, '#2D63FB')
    bg.addColorStop(1, '#1A3FB8')
    g.fillStyle = bg
    g.beginPath()
    g.roundRect(0, 0, 180, 124, 6)
    g.fill()
    g.fillStyle = '#F2C14E'
    g.beginPath()
    g.arc(90, 46, 20, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 3
    g.beginPath()
    g.arc(90, 46, 12, 0, TAU)
    g.stroke()
    rr(g, 18, 82, 64, 22, 6, 'rgba(255,255,255,0.92)')
    rr(g, 98, 82, 64, 22, 6, 'rgba(255,255,255,0.55)')
  })
}
/** a keypad's face: a 3 x 4 grid of keys and a green / orange pair (no words) */
function keypadTex() {
  return canvasTex(120, 90, (g) => {
    rr(g, 0, 0, 120, 90, 6, '#3B4458')
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) rr(g, 8 + c * 24, 8 + r * 20, 20, 16, 3, '#DDE3EE')
    rr(g, 84, 8, 28, 16, 3, C.green)
    rr(g, 84, 28, 28, 16, 3, '#F2C14E')
    rr(g, 84, 48, 28, 16, 3, ORANGE)
  })
}
/** a banknote's face: pale green paper, a border, a round watermark (no words) */
function noteTex() {
  return canvasTex(160, 80, (g) => {
    rr(g, 0, 0, 160, 80, 4, '#CFE6CC')
    g.strokeStyle = '#7FAE7A'
    g.lineWidth = 3
    g.strokeRect(6, 6, 148, 68)
    g.fillStyle = '#A9CFA4'
    g.beginPath()
    g.arc(112, 40, 20, 0, TAU)
    g.fill()
    rr(g, 18, 20, 52, 6, 3, '#7FAE7A')
    rr(g, 18, 34, 40, 6, 3, '#9BC496')
    rr(g, 18, 48, 46, 6, 3, '#9BC496')
  })
}
/** the side of a stack of notes: thin green edges (no words) */
function stackSideTex() {
  return canvasTex(80, 40, (g) => {
    g.fillStyle = '#E4F1E1'
    g.fillRect(0, 0, 80, 40)
    g.fillStyle = '#A9CFA4'
    for (let y = 1; y < 40; y += 3) g.fillRect(0, y, 80, 1)
  })
}
/** a messenger bag on a strap across the chest, its flap at the left hip (rig frame) */
const BAG11 = (
  <g data-part="bag">
    <path d="M 236 208 L 160 368" stroke="#2C3545" strokeWidth={9} strokeLinecap="round" fill="none" />
    <rect x={122} y={350} width={64} height={50} rx={8} fill="#3A4A6B" />
    <rect x={122} y={350} width={64} height={18} rx={7} fill="#2C3A57" />
    <rect x={148} y={362} width={12} height={8} rx={2} fill="#F2C14E" />
  </g>
)
const BAG_PT: Pt = { x: 154, y: 352 }

function setupT11Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EFE8DC')
  setCam(camera, CAM11, AT11, 37)
  lights(scene, [0.2, 1.0, -0.6])
  hall11(scene, { wall: '#F1EADF', floor: ['#E9DFCF', '#D6C8B1'], band: '#8C6A48' })
  /* a wood wainscot along the wall */
  scene.add(box(9, 0.8, 0.03, mat('#C9A27A', { roughness: 0.6 }), [0, 0.5, P11.wallZ + 0.0]))
  scene.add(noShadow(box(9, 0.035, 0.05, mat('#8C6A48', { roughness: 0.5 }), [0, 0.91, P11.wallZ + 0.02])))

  /* the ATM */
  const { atm } = P11
  const steel = mat('#E6EBF2', { roughness: 0.32, metalness: 0.3, emissive: new THREE.Color('#E6EBF2'), emissiveIntensity: 0.12 })
  const dark = mat('#1A2235', { roughness: 0.6 })
  scene.add(box(atm.w, atm.h, atm.d, steel, [atm.x, atm.h / 2, atm.z], 0.03))
  scene.add(box(atm.w + 0.02, 0.2, atm.d + 0.02, mat(C.brand, { roughness: 0.35, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 }), [atm.x, atm.h + 0.09, atm.z], 0.03))
  scene.add(picture(emblemTex(), 0.14, 0.14, [atm.x, atm.h + 0.09, ATM_FRONT + 0.012]))
  scene.add(box(0.46, 0.34, 0.03, dark, [atm.x, 1.28, ATM_FRONT], 0.02))
  const scr = picture(atmScreenTex(), 0.4, 0.28, [atm.x, 1.28, ATM_FRONT + 0.017])
  scene.add(scr)
  const scrGlow = halo('#7FB0FF', 0.6)
  scrGlow.position.set(atm.x, 1.28, ATM_FRONT + 0.03)
  scene.add(scrGlow)
  /* the keypad shelf, tilted up toward the customer */
  const shelf = new THREE.Group()
  shelf.position.set(atm.x, 1.04, ATM_FRONT + 0.07)
  shelf.rotation.x = -0.5
  shelf.add(box(0.5, 0.03, 0.17, mat('#C9D1DE', { roughness: 0.35, metalness: 0.4 }), [0, 0, 0], 0.01))
  const pad = picture(keypadTex(), 0.18, 0.135, [-0.03, 0.017, 0])
  pad.rotation.x = -Math.PI / 2
  shelf.add(pad)
  scene.add(shelf)
  /* the card slot with its light, the cash slot with its light strip */
  scene.add(noShadow(box(0.1, 0.022, 0.02, dark, [atm.x + 0.17, 1.13, ATM_FRONT + 0.005])))
  const cardLed = glowM(C.green, '#9AA5B8')
  scene.add(noShadow(box(0.02, 0.012, 0.01, cardLed, [atm.x + 0.24, 1.13, ATM_FRONT + 0.012])))
  scene.add(noShadow(box(0.24, 0.05, 0.03, dark, [SLOT11.x, SLOT11.y, ATM_FRONT], 0.01)))
  const slotLight = glowM(C.green, '#C9D1DE')
  scene.add(noShadow(box(0.24, 0.012, 0.012, slotLight, [SLOT11.x, SLOT11.y - 0.04, ATM_FRONT + 0.01])))

  /* the bank's line: from the ATM and from the other branches into the monitor; a hub where they meet */
  const lineM = mat('#B8C4D8', { roughness: 0.35, metalness: 0.4 })
  conduit(scene, PATH_A, lineM)
  conduit(scene, PATH_B, lineM)
  scene.add(noShadow(box(0.09, 0.09, 0.05, mat('#8E99AD', { metalness: 0.5, roughness: 0.35 }), [P11.mon.x, P11.lineY, P11.lineZ + 0.02], 0.015)))

  /* the analyst's desk and the fraud monitor */
  const { desk, mon } = P11
  const wood = mat('#A9784F', { roughness: 0.55 })
  scene.add(box(desk.x1 - desk.x0, 0.05, desk.z1 - desk.z0, wood, [(desk.x0 + desk.x1) / 2, desk.top, (desk.z0 + desk.z1) / 2], 0.01))
  for (const x of [desk.x0 + 0.05, desk.x1 - 0.05]) scene.add(box(0.05, desk.top - 0.02, desk.z1 - desk.z0 - 0.06, mat('#8C6440', { roughness: 0.6 }), [x, (desk.top - 0.02) / 2, (desk.z0 + desk.z1) / 2]))
  scene.add(box(0.3, 0.015, 0.1, mat('#E6EAF0', { roughness: 0.4 }), [mon.x + 0.05, desk.top + 0.03, desk.z1 - 0.1], 0.006))
  scene.add(cyl(0.025, 0.03, mon.y - mon.h / 2 - desk.top, mat('#3B4458', { metalness: 0.5, roughness: 0.4 }), [mon.x, (desk.top + mon.y - mon.h / 2) / 2 + 0.02, mon.z - 0.04], 14))
  scene.add(box(0.2, 0.015, 0.14, mat('#3B4458', { metalness: 0.5, roughness: 0.4 }), [mon.x, desk.top + 0.03, mon.z - 0.04], 0.006))
  const monG = new THREE.Group()
  monG.position.set(mon.x, mon.y, mon.z)
  monG.add(box(mon.w, mon.h, 0.04, mat('#26304A', { roughness: 0.4, metalness: 0.3 }), [0, 0, -0.02], 0.02))
  const sw = mon.w - 0.06
  const sh = mon.h - 0.06
  monG.add(picture(feedScreenTex(), sw, sh, [0, 0, 0.002]))
  scene.add(monG)
  const feed = makeFeed(monG, { w: sw - 0.08, yBot: -sh / 2 + 0.05, step: 0.075, n: FEED_N, flagRow: FLAG_ROW, glyph: 'coin', z: 0.004 })
  const rim = halo(ORANGE, 0.5)
  rim.scale.set(1.7, 0.36, 1)
  rim.position.z = 0.003
  monG.add(rim)
  const beacon = makeBeacon(ORANGE)
  beacon.g.position.set(mon.x - mon.w / 2 + 0.08, mon.y + mon.h / 2, mon.z - 0.02)
  scene.add(beacon.g)

  /* tokens on the line: a coin a second from the branches; the ATM's withdrawal is the orange one */
  const coinsB = Array.from({ length: FEED_N }, () => makeCoin('#E3B341'))
  coinsB.forEach((t) => scene.add(t.g))
  const coinA = makeCoin(ORANGE, 0.5)
  scene.add(coinA.g)

  /* the wad of notes */
  const noteM = basic(noteTex(), { transparent: false })
  const sideM = new THREE.MeshStandardMaterial({ map: stackSideTex(), roughness: 0.7 })
  const wad = new THREE.Group()
  wad.add(box(0.17, 0.075, 0.085, [sideM, sideM, noteM, noteM, sideM, sideM], [0, 0, 0]))
  wad.add(noShadow(box(0.04, 0.081, 0.091, mat('#C8962A', { roughness: 0.5 }), [0, 0, 0])))
  scene.add(wad)

  /* people */
  const cuCfg = who(CAST_PRESETS.kabir, { name: 'Customer', skinTone: 'medium', hair: { style: 'short', color: 'black' }, outfit: { top: 'hoodie', topColor: '#4F6D8F', bottom: 'jeans', bottomColor: '#2C3545', shoeColor: '#E9EDF3' }, accessories: { glasses: 'none', beard: 'none', watch: true } })
  const aCfg = who(CAST_PRESETS.meera, { name: 'Fraud Analyst', skinTone: 'wheatish', hair: { style: 'bob', color: 'black' }, outfit: { top: 'blouse', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#1E1E24' }, accessories: { glasses: 'rect', earrings: true, watch: true } })
  const shC = buildSkin(cuCfg).shoulderHalf
  const shA = buildSkin(aCfg).shoulderHalf
  const cuRoot = new THREE.Vector3(P11.cust.x, 0, P11.cust.z)
  const aRoot = new THREE.Vector3(P11.ana.x, 0, P11.ana.z)

  /* the customer: keys in, takes the wad, holds it, puts it in his bag */
  const restC: Arm = { s: 8, e: 14 }
  const keyArm = ik('L', shC, rigTarget(KEYPAD11, cuRoot, P11.cust.h, CAM11))
  const slotArm = ik('L', shC, rigTarget(SLOT11.clone().add(new THREE.Vector3(0, 0.01, 0.06)), cuRoot, P11.cust.h, CAM11))
  const chestArm = ik('L', shC, { x: 172, y: 292 })
  const bagArm = ik('L', shC, { x: BAG_PT.x + 6, y: BAG_PT.y - 18 })
  const cL = (c: number): Arm => {
    let a = restC
    const tapK = hold(c, T11.type[0], T11.type[1], T11.type[2], T11.type[3])
    if (tapK > 0) a = mixArm(a, { s: keyArm.s + 3 * Math.max(0, Math.sin(c * TAU * 3.2)), e: keyArm.e - 6 * Math.max(0, Math.sin(c * TAU * 3.2)) }, tapK)
    a = mixArm(a, slotArm, hold(c, T11.take[0], T11.take[1], T11.take[2], T11.take[3]))
    a = mixArm(a, chestArm, hold(c, T11.take[2], T11.take[3], T11.bag[0], T11.bag[1]))
    a = mixArm(a, bagArm, hold(c, T11.bag[0], T11.bag[1], T11.bag[2], T11.bag[3]))
    return a
  }
  const customer = person({
    config: cuCfg,
    dress: withTop(BAG11),
    seed: 311,
    faces: [
      [0, 'neutral'],
      [0.5, 'thinking'],
      [2.6, 'happy'],
      [3.55, 'grin'],
      [4.3, 'excited'],
      [6.15, 'happy'],
      [7.1, 'neutral'],
    ],
    pose: (p, c) => {
      const l = cL(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      p.shoulderR = 7
      p.elbowR = 12
      /* he faces the ATM, then the wad in his hand */
      to(p, 'headTurn', -0.42, 1)
      to(p, 'lookX', -0.9, 1)
      to(p, 'lookY', 0.25, hold(c, T11.type[0], T11.type[1], T11.type[2], T11.type[3]) + hold(c, T11.take[0], T11.take[1], T11.take[2], T11.take[3]))
      const look = hold(c, T11.take[3] - 0.2, T11.take[3], T11.hold[1] - 0.3, T11.hold[1])
      to(p, 'headTurn', -0.18, look)
      to(p, 'lookX', -0.5, look)
      to(p, 'lookY', 0.55, look)
      to(p, 'headNod', 0.18, look)
    },
    loop: L11,
    height: P11.cust.h,
    frames: F11,
    redraw,
    holdT: devHold(HOLD11),
  })
  customer.object.position.copy(cuRoot)

  /* the analyst: watches the feed; looks up at the flag; points at the flagged row; settles */
  const restA: Arm = { s: 8, e: 14 }
  const ptTarget = new THREE.Vector3(mon.x + 0.24, mon.y - mon.h / 2 + 0.05 + 0.075 * 0.9, mon.z + 0.12)
  const pointArm = ik('L', shA, rigTarget(ptTarget, aRoot, P11.ana.h, CAM11))
  const aL = (c: number): Arm => mixArm(restA, pointArm, hold(c, T11.point[0], T11.point[1], T11.point[2], T11.point[3]))
  const analyst = person({
    config: aCfg,
    dress: (k) => withNeck(LANYARD('#1F2E63', C.brand))(withTop(BLAZER('#1F2E63', '#121B3D'))(k)),
    seed: 312,
    faces: [
      [0, 'listening'],
      [2.0, 'neutral'],
      [4.05, 'surprised'],
      [4.6, 'worried'],
      [5.4, 'thinking'],
      [6.3, 'proud'],
      [7.2, 'listening'],
    ],
    pose: (p, c) => {
      const l = aL(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      p.shoulderR = 8
      p.elbowR = 16
      to(p, 'headTurn', -0.45, 1)
      to(p, 'lookX', -0.9, 1)
      to(p, 'lookY', 0.1, 1)
      /* the flag: a start and a lean toward the screen */
      to(p, 'headY', -4, hold(c, 4.0, 4.12, 4.3, 4.6))
      to(p, 'lean', -3, hold(c, T11.point[0], T11.point[1], T11.point[2], T11.point[3]))
      to(p, 'headNod', 0.2, hold(c, 5.85, 5.95, 6.05, 6.2))
      to(p, 'headNod', 0.12, hold(c, 1.9, 2.0, 2.1, 2.25))
    },
    loop: L11,
    height: P11.ana.h,
    frames: F11,
    redraw,
    holdT: devHold(HOLD11),
  })
  analyst.object.position.copy(aRoot)
  scene.add(customer.object, analyst.object)
  const clk = slideClock('T11', scene, devHold(HOLD11), [customer, analyst])

  const hand = new THREE.Vector3()
  const bagW = new THREE.Vector3()
  const durB = pathLen(PATH_B) / SPEED11
  return (t: number) => {
    const c = mod(clk.time(t), L11)
    const cq = frameT(c, L11, F11)
    customer.update(c, camera)
    analyst.update(c, camera)
    /* the feed scrolls; the flagged row's rim; the beacon */
    feed.update(c, L11)
    const fr = feed.rowAt(FLAG_ROW, c, L11)
    const fl = hold(c, T11.flag[0], T11.flag[1], T11.flag[2], T11.flag[3])
    rim.position.y = fr.y
    setOp(rim, 0.55 * fl * fr.op)
    beacon.set(fl * (0.55 + 0.45 * Math.max(0, Math.sin(c * TAU * 2.2))))
    /* coins from the branches: one a second, arriving as its row enters */
    coinsB.forEach((tk, k) => {
      const arrive = (k * L11) / FEED_N
      const age = mod(c - (arrive - durB), L11)
      const on = k !== FLAG_ROW && age < durB
      tk.g.visible = on
      if (on) {
        pathAt(PATH_B, age * SPEED11, tk.g.position)
        tk.g.position.z += 0.03
        tk.g.rotation.z = c * 3
        setOp(tk.glow, 0.5)
      }
    })
    /* the ATM's withdrawal rides the other line */
    const aAge = c - atmDepart
    coinA.g.visible = aAge >= 0 && aAge < pathLen(PATH_A) / SPEED11
    if (coinA.g.visible) {
      pathAt(PATH_A, aAge * SPEED11, coinA.g.position)
      coinA.g.position.z += 0.03
      coinA.g.rotation.z = c * 3
      setOp(coinA.glow, 0.9)
    }
    /* the ATM: screen glow while in use; the slot light while it pays out; card light blinks */
    const use = hold(c, T11.type[0], T11.type[1], T11.take[1], T11.take[2])
    setOp(scrGlow, 0.25 + 0.45 * use)
    slotLight.emissiveIntensity = 1.8 * hold(c, T11.slot[0], T11.slot[1], T11.take[1], T11.take[2])
    cardLed.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(c * TAU * 0.9))
    /* the wad: out of the slot, in his hand, into his bag */
    const out = seg(c, T11.wadOut[0], T11.wadOut[1])
    const inHand = c >= T11.take[2] && c < T11.bag[2]
    if (c < T11.wadOut[0] || c >= T11.bag[2] + 0.02) wad.visible = false
    else {
      wad.visible = true
      if (!inHand) {
        wad.position.set(SLOT11.x, SLOT11.y + 0.005, ATM_FRONT - 0.04 + 0.12 * out)
        wad.quaternion.identity()
      } else {
        handWorld('L', shC, cL(cq), P11.cust.h, cuRoot, camera, hand)
        if (c > T11.bag[1]) {
          rigToWorld(BAG_PT, P11.cust.h, cuRoot, camera, bagW)
          towardCamera(bagW, camera, 0.1)
          hand.lerp(bagW, seg(c, T11.bag[1], T11.bag[2]))
        }
        wad.position.copy(hand).add(new THREE.Vector3(0, 0.01, 0))
        wad.quaternion.copy(camera.quaternion)
        wad.rotateX(-0.6)
      }
      const s = c > T11.bag[1] ? 1 - 0.6 * seg(c, T11.bag[1], T11.bag[2]) : 1
      wad.scale.setScalar(s)
    }
  }
}

/* ------------------------------------------------------------------ T11 concept: the account and GuardDuty */

/* the concept card is framed closer than the everyday one (coordinator, 2026-11-20: the actors were small over big
   white pedestals): the same three places left to right (the account where the ATM is, the engine where the monitor
   is, the findings board where the analyst stands), drawn closer together and larger, on slim stands */
const Q11 = {
  cam: [0.16, 1.64, 2.95] as V3,
  at: [0.16, 1.4, -0.6] as V3,
  fov: 37,
  lap: { x: -0.6, z: -0.45, top: 0.98, s: 1.65 },
  eng: { x: 0.25, y: 1.42, z: -0.6, w: 0.86, h: 0.86 },
  board: { x: 0.98, y: 1.42, z: -0.4, w: 0.54, h: 0.96 },
  lineY: 2.25,
}
/** a slim stand: a round foot, a column, and (for a table) a round top */
function stand(scene: THREE.Scene, x: number, z: number, h: number, top?: number) {
  const m = mat('#C9D5EC', { metalness: 0.45, roughness: 0.3 })
  scene.add(cyl(0.2, 0.22, 0.03, WHITE_M(), [x, 0.015, z], 36))
  scene.add(cyl(0.032, 0.036, h, m, [x, h / 2, z], 16))
  if (top) {
    scene.add(cyl(top, top, 0.035, WHITE_M(), [x, h + 0.017, z], 40))
    scene.add(noShadow(cyl(top + 0.005, top + 0.005, 0.012, mat(C.brand, { roughness: 0.3 }), [x, h + 0.04, z], 40)))
  }
}

function setupT11Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E3EDFC')
  setCam(camera, Q11.cam, Q11.at, Q11.fov)
  lights(scene, [0.2, 1.2, -0.6], 2.3)
  hall11(scene, { wall: '#DCE7FA', floor: ['#F2F6FD', '#DCE5F5'], band: '#C9D5EC', glow: 0.55 })

  /* the account: a laptop on a round table where the ATM stands */
  const { lap, eng, board } = Q11
  stand(scene, lap.x, lap.z, lap.top, 0.36)
  const laptop = new THREE.Group()
  laptop.position.set(lap.x, lap.top + 0.047, lap.z)
  laptop.rotation.y = 0.25
  laptop.scale.setScalar(lap.s)
  laptop.add(box(0.4, 0.018, 0.27, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.009, 0], 0.008))
  const lid = new THREE.Group()
  lid.position.set(0, 0.018, -0.13)
  lid.rotation.x = -0.18
  lid.add(box(0.4, 0.27, 0.014, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.135, -0.007], 0.008))
  const scr = picture(screenTex(), 0.37, 0.24, [0, 0.135, 0.002])
  lid.add(scr)
  const scrGlow = halo('#7FB0FF', 0.6)
  scrGlow.position.set(0, 0.135, 0.01)
  lid.add(scrGlow)
  laptop.add(lid)
  scene.add(laptop)

  /* the two glass lines into the engine: the account's (from behind the laptop) and the other sources' (right) */
  const top = eng.y + eng.h / 2
  const pathA: Path = [v3([lap.x - 0.08, 1.2, P11.lineZ]), v3([lap.x - 0.08, Q11.lineY, P11.lineZ]), v3([eng.x, Q11.lineY, P11.lineZ]), v3([eng.x, top - 0.02, P11.lineZ])]
  const pathB: Path = [v3([2.4, Q11.lineY, P11.lineZ]), v3([eng.x, Q11.lineY, P11.lineZ]), v3([eng.x, top - 0.02, P11.lineZ])]
  const lineM = new THREE.MeshStandardMaterial({ color: '#BFD3FA', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: new THREE.Color('#7FB0FF'), emissiveIntensity: 0.25 })
  conduit(scene, pathA, lineM, 0.024)
  conduit(scene, pathB, lineM, 0.024)
  scene.add(noShadow(box(0.1, 0.1, 0.05, mat('#AFC3E6', { metalness: 0.4, roughness: 0.3 }), [eng.x, Q11.lineY, P11.lineZ + 0.02], 0.015)))

  /* the GuardDuty engine where the monitor stands: a tall glass panel on a stand, its mark above */
  stand(scene, eng.x, eng.z - 0.04, eng.y - eng.h / 2)
  const monG = new THREE.Group()
  monG.position.set(eng.x, eng.y, eng.z)
  monG.add(box(eng.w, eng.h, 0.05, mat('#FFFFFF', { roughness: 0.25, emissive: new THREE.Color('#EAF1FF'), emissiveIntensity: 0.3 }), [0, 0, -0.025], 0.03))
  const sw = eng.w - 0.06
  const sh = eng.h - 0.06
  monG.add(picture(feedScreenTex(true), sw, sh, [0, 0, 0.002]))
  scene.add(monG)
  scene.add(picture(markTex(guardDutyUrl, redraw), 0.2, 0.2, [eng.x - eng.w / 2 + 0.12, top + 0.13, eng.z + 0.01]))
  const rowW = sw - 0.08
  const feed = makeFeed(monG, { w: rowW, yBot: -sh / 2 + 0.065, step: 0.1, n: FEED_N, flagRow: FLAG_ROW, glyph: 'tile', z: 0.004, show: 6 })
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.06, sh - 0.04), new THREE.MeshBasicMaterial({ map: haloTex(), color: '#7FB0FF', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))
  sweep.position.z = 0.006
  sweep.renderOrder = 4
  monG.add(sweep)
  const rim = halo(ORANGE, 0.6)
  rim.scale.set(1.75, 0.4, 1)
  rim.position.z = 0.003
  monG.add(rim)

  /* the findings board where the analyst stands: a tall white panel on a stand, four slots, a flag */
  const bTop = board.y + board.h / 2
  stand(scene, board.x, board.z - 0.04, board.y - board.h / 2)
  scene.add(box(board.w, board.h, 0.04, mat('#FFFFFF', { roughness: 0.25, emissive: new THREE.Color('#EAF1FF'), emissiveIntensity: 0.3 }), [board.x, board.y, board.z - 0.02], 0.03))
  scene.add(noShadow(box(board.w, 0.07, 0.045, mat(C.brand, { roughness: 0.3 }), [board.x, bTop - 0.035, board.z - 0.02], 0.02)))
  const slotM = mat('#E3EAF7', { roughness: 0.5 })
  const slotY = [bTop - 0.15, bTop - 0.31, bTop - 0.47, bTop - 0.63, bTop - 0.79]
  for (const y of slotY) scene.add(noShadow(box(board.w - 0.05, 0.075, 0.006, slotM, [board.x, y, board.z + 0.002], 0.025)))
  const FW = board.w - 0.06
  const findGlow = halo(ORANGE, 0.5)
  findGlow.scale.set(1.25, 0.3, 1)
  findGlow.position.set(board.x, slotY[0], board.z + 0.004)
  scene.add(findGlow)
  const finding = new THREE.Mesh(new THREE.PlaneGeometry(FW, FW * (32 / 300)), new THREE.MeshBasicMaterial({ map: rowTex('flag', 'tile'), transparent: true, toneMapped: false, opacity: 0, depthWrite: false }))
  finding.renderOrder = 4
  scene.add(finding)
  const flag = makeFlag(ORANGE, 1.25)
  flag.g.position.set(board.x + 0.06, bTop, board.z)
  scene.add(flag.g)

  /* tiles on the lines: one a second from the other sources; the account's unusual call is the orange one */
  const tiles = Array.from({ length: FEED_N }, () => makePacket(0.09))
  tiles.forEach((p) => scene.add(p.g))
  const bad = makePacket(0.1)
  bad.bodyM.color.set('#FFE6D3')
  bad.bodyM.emissive.set(ORANGE)
  bad.bodyM.emissiveIntensity = 0.55
  scene.add(bad.g)
  const badGlow = halo(ORANGE, 0.34)
  scene.add(badGlow)

  const clk = slideClock('T11', scene, devHold(HOLD11), [])
  const durB = pathLen(pathB) / SPEED11
  const durA = pathLen(pathA) / SPEED11
  const departA = 4.0 - durA
  const from = new THREE.Vector3()
  const to3 = new THREE.Vector3(board.x, slotY[0], board.z + 0.01)
  return (t: number) => {
    const c = mod(clk.time(t), L11)
    feed.update(c, L11)
    const fr = feed.rowAt(FLAG_ROW, c, L11)
    const fl = hold(c, T11.flag[0], T11.flag[1], T11.flag[2], T11.flag[3])
    rim.position.y = fr.y
    setOp(rim, 0.55 * fl * fr.op)
    sweep.position.x = (sw / 2 - 0.06) * Math.sin((c / L11) * TAU * 4)
    tiles.forEach((tk, k) => {
      const arrive = (k * L11) / FEED_N
      const age = mod(c - (arrive - durB), L11)
      const on = k !== FLAG_ROW && age < durB
      tk.g.visible = on
      if (on) {
        pathAt(pathB, age * SPEED11, tk.g.position)
        tk.g.position.z += 0.06
        tk.g.rotation.y = 0.4 * Math.sin(c * 2 + k)
      }
    })
    const aAge = c - departA
    bad.g.visible = aAge >= 0 && aAge < durA
    if (bad.g.visible) {
      pathAt(pathA, aAge * SPEED11, bad.g.position)
      bad.g.position.z += 0.06
      bad.g.rotation.y = 0.4 * Math.sin(c * 2)
    }
    badGlow.position.copy(bad.g.position).add(new THREE.Vector3(0, 0, 0.06))
    setOp(badGlow, bad.g.visible ? 0.8 : 0)
    /* the laptop is busy while its unusual call goes out */
    setOp(scrGlow, 0.3 + 0.4 * hold(c, departA - 0.6, departA - 0.3, departA + 0.2, departA + 0.5))
    /* the flagged row lifts out of the panel onto the findings board's top slot, under the flag; it clears once handled */
    const lift = seg(c, 4.3, 4.9)
    from.set(eng.x, eng.y + fr.y, eng.z + 0.02)
    finding.position.copy(from).lerp(to3, lift)
    finding.position.y += 0.14 * Math.sin(Math.PI * lift)
    finding.scale.setScalar(lerp(rowW / FW, 1, lift))
    const on = hold(c, 4.25, 4.4, T11.flag[2], T11.flag[3])
    ;(finding.material as THREE.MeshBasicMaterial).opacity = on
    finding.visible = c > 4.25 && c < T11.flag[3]
    setOp(findGlow, 0.5 * seg(c, 4.8, 5.0) * (1 - seg(c, T11.flag[2], T11.flag[3])))
    flag.set(seg(c, 4.75, 5.05) * (1 - seg(c, T11.flag[2], T11.flag[3])), c)
  }
}

/* ================================================================== T13 · the locker key the passbook never prints */

const L13 = 9
const F13 = 136
const HOLD13 = 5.3 /* she holds her locker key; her passbook lies open with no key in it; the ID pad is green */
const CAM13: V3 = [0.15, 1.45, 3.35]
const AT13: V3 = [0.15, 0.95, -0.6]
const P13 = {
  wallZ: -1.2,
  counter: { x0: -0.45, x1: 1.05, top: 1.0, z0: -0.5, z1: -0.18 },
  cust: { x: -0.74, z: -0.2, h: 1.7 },
  off: { home: 0.12, cab: 0.55, z: -0.68, h: 1.72 },
  cab: { x: 1.04, y: 1.35, w: 0.46, h: 0.82, z0: -1.18, z1: -0.96 },
  hooksX: [0.91, 1.04, 1.17],
  hooksY: [1.56, 1.3],
}
const PAD13 = new THREE.Vector3(-0.22, P13.counter.top + 0.02, -0.33)
const BOOK13 = new THREE.Vector3(0.52, P13.counter.top + 0.06, -0.33)
const HAND13 = new THREE.Vector3(-0.21, 1.26, -0.3)
const HOOK13 = new THREE.Vector3(P13.hooksX[1], P13.hooksY[0] - 0.03, P13.cab.z1 - 0.06)
const T13 = {
  card: [0.2, 0.68, 0.8, 1.2] as const, // her hand to the pad, the card down, hand back
  scan: [0.85, 1.45] as const,
  walk1: [1.7, 2.5] as const,
  door1: [2.45, 2.75, 3.15, 3.45] as const,
  take: [2.6, 2.85, 2.95, 3.2] as const,
  walk2: [3.3, 4.1] as const,
  swap1: [4.02, 4.17, 4.3, 4.45] as const, // both hands to the chest; the key passes right to left at SW1
  give: [4.3, 4.6, 4.7, 4.95] as const, // his left hand to the counter
  recv: [4.35, 4.62, 4.68, 4.95] as const, // her right hand to the counter
  show: [4.68, 5.0, 5.95, 6.1] as const, // she holds it up
  back: [6.0, 6.28, 6.34, 6.6] as const, // both hands to the counter again
  swap2: [6.5, 6.65, 6.78, 6.92] as const,
  walk3: [6.85, 7.55] as const,
  door2: [7.45, 7.7, 8.0, 8.25] as const,
  hang: [7.55, 7.75, 7.85, 8.05] as const,
  walk4: [8.15, 8.85] as const,
  pick: [8.25, 8.52, 8.6, 8.95] as const, // she takes her ID back
}
const SW1 = 4.24
const PASS1 = 4.65
const PASS2 = 6.31
const SW2 = 6.72
const green13 = (c: number) => seg(c, T13.scan[1] - 0.05, T13.scan[1] + 0.1) * (1 - seg(c, 8.4, 8.6))
const OFF13: [number, number, number][] = [
  [0, 0, P13.off.home],
  [T13.walk1[0], T13.walk1[1], P13.off.cab],
  [T13.walk2[0], T13.walk2[1], P13.off.home],
  [T13.walk3[0], T13.walk3[1], P13.off.cab],
  [T13.walk4[0], T13.walk4[1], P13.off.home],
]
const off13 = (c: number) => along(c, OFF13)
const door13 = (c: number) => Math.max(hold(c, ...T13.door1), hold(c, ...T13.door2))

/** an open passbook: two cream pages in a navy cover, an emblem, ruled rows of entries (no words, no key) */
function passbookTex() {
  return canvasTex(340, 230, (g) => {
    rr(g, 0, 0, 340, 230, 10, '#1F2E63')
    rr(g, 8, 8, 160, 214, 6, '#FBF6EA')
    rr(g, 172, 8, 160, 214, 6, '#FBF6EA')
    g.fillStyle = 'rgba(31,46,99,0.18)'
    g.fillRect(166, 8, 8, 214)
    /* left page: the emblem, the holder's lines */
    rr(g, 64, 26, 48, 48, 10, '#E7EEFB')
    g.fillStyle = C.brand
    g.beginPath()
    g.moveTo(88, 34)
    g.lineTo(104, 44)
    g.lineTo(72, 44)
    g.closePath()
    g.fill()
    for (const x of [75, 83, 91, 99]) rr(g, x, 47, 4, 14, 1, C.brand)
    rr(g, 72, 63, 32, 5, 1.5, C.brand)
    for (let i = 0; i < 6; i++) rr(g, 24, 92 + i * 20, i % 2 ? 96 : 128, 6, 3, '#C9C2B2')
    /* right page: a table of entries */
    g.strokeStyle = '#D8CFBD'
    g.lineWidth = 1.5
    for (let i = 0; i < 9; i++) {
      g.beginPath()
      g.moveTo(184, 30 + i * 21)
      g.lineTo(322, 30 + i * 21)
      g.stroke()
    }
    for (const x of [228, 276]) {
      g.beginPath()
      g.moveTo(x, 30)
      g.lineTo(x, 198)
      g.stroke()
    }
    for (let i = 0; i < 7; i++) {
      rr(g, 190, 36 + i * 21, 30, 6, 3, '#B9B0A0')
      rr(g, 234, 36 + i * 21, 34, 6, 3, i % 3 === 1 ? '#7FAE7A' : '#B9B0A0')
      rr(g, 282, 36 + i * 21, 32, 6, 3, '#9FB3D6')
    }
  })
}
/** an application's code lying open: a dark editor page with indented code bars (no words, no secret) */
function codeTex() {
  return canvasTex(340, 230, (g) => {
    rr(g, 0, 0, 340, 230, 10, '#16234A')
    rr(g, 0, 0, 340, 24, 10, '#22346A')
    g.fillRect(0, 14, 340, 10)
    for (const [x, col] of [[14, ORANGE], [26, '#F2C14E'], [38, C.green]] as [number, string][]) {
      g.fillStyle = col
      g.beginPath()
      g.arc(x, 12, 4, 0, TAU)
      g.fill()
    }
    const lines: [number, number, string][] = [
      [0, 90, '#7FB0FF'], [0, 140, '#C3CCDD'], [1, 60, '#F2C14E'], [1, 170, '#C3CCDD'], [1, 110, '#9FE3C0'], [2, 130, '#C3CCDD'],
      [2, 80, '#7FB0FF'], [1, 40, '#F2C14E'], [0, 30, '#C3CCDD'], [0, 120, '#7FB0FF'], [1, 150, '#C3CCDD'],
    ]
    lines.forEach(([ind, w, col], i) => {
      rr(g, 16, 38 + i * 17, 10, 6, 2, '#3D4F80')
      rr(g, 40 + ind * 22, 38 + i * 17, w, 6, 3, col)
    })
  })
}
/** an ID card (no words): a person card, or the application's role badge */
function idTex(kind: 'person' | 'role') {
  return canvasTex(150, 96, (g) => {
    const role = kind === 'role'
    rr(g, 0, 0, 150, 96, 10, role ? C.brand : '#FFFFFF')
    rr(g, 0, 0, 150, 22, 10, role ? '#1F2E63' : C.brand)
    g.fillRect(0, 12, 150, 10)
    rr(g, 12, 32, 46, 52, 8, role ? 'rgba(255,255,255,0.22)' : '#E7EEFB')
    g.fillStyle = role ? '#FFFFFF' : '#7C9CF5'
    g.beginPath()
    g.arc(35, 50, 10, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(35, 78, 17, 11, 0, Math.PI, TAU)
    g.fill()
    const bar = role ? 'rgba(255,255,255,0.75)' : '#C3CCDD'
    rr(g, 70, 36, 64, 8, 4, bar)
    rr(g, 70, 52, 48, 7, 3.5, bar)
    rr(g, 70, 66, 56, 7, 3.5, bar)
  })
}
/** a green disc with a white tick (no words) */
function tickTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = C.green
    g.beginPath()
    g.arc(32, 32, 28, 0, TAU)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(19, 33)
    g.lineTo(28, 42)
    g.lineTo(45, 23)
    g.stroke()
  })
}
/** a brass key (s scales it); `tag` hangs a coloured tag on its bow */
function makeKey13(s: number, tag?: string) {
  const k = new THREE.Group()
  const brass = mat('#D9B04A', { roughness: 0.25, metalness: 0.85, emissive: new THREE.Color('#D9B04A'), emissiveIntensity: 0.15 })
  k.add(new THREE.Mesh(new THREE.TorusGeometry(0.02 * s, 0.007 * s, 8, 20), brass))
  k.add(box(0.008 * s, 0.07 * s, 0.006 * s, brass, [0, -0.052 * s, 0]))
  k.add(box(0.018 * s, 0.008 * s, 0.006 * s, brass, [0.009 * s, -0.072 * s, 0]))
  k.add(box(0.014 * s, 0.008 * s, 0.006 * s, brass, [0.007 * s, -0.058 * s, 0]))
  if (tag) k.add(box(0.03 * s, 0.022 * s, 0.004 * s, mat(tag, { roughness: 0.5 }), [-0.026 * s, 0.006 * s, 0], 0.004 * s))
  return { g: k, brass }
}
/** the counter both cards share in shape: a front panel, a kick plate, a top slab */
function counter13(scene: THREE.Scene, o: { front: THREE.Material; top: THREE.Material; kick: THREE.Material }, ext = P13.counter) {
  const { x0, x1, top, z0, z1 } = ext
  scene.add(box(x1 - x0, top - 0.05, z1 - z0, o.front, [(x0 + x1) / 2, (top - 0.05) / 2, (z0 + z1) / 2], 0.02))
  scene.add(noShadow(box(x1 - x0 - 0.02, 0.08, 0.02, o.kick, [(x0 + x1) / 2, 0.04, z1 + 0.005])))
  scene.add(box(x1 - x0 + 0.08, 0.06, z1 - z0 + 0.1, o.top, [(x0 + x1) / 2, top - 0.02, (z0 + z1) / 2 + 0.02], 0.02))
}
/** the ID pad on the counter: a dark slab with a light ring (blue, sweeping, then green) and a tick */
function makePad13(scene: THREE.Scene, pos = PAD13, s = 1) {
  const g = new THREE.Group()
  g.position.copy(pos)
  g.scale.setScalar(s)
  g.add(box(0.24, 0.026, 0.18, mat('#26304A', { roughness: 0.4, metalness: 0.3 }), [0, 0, 0], 0.01))
  const ringM = glowM('#7FB0FF', '#9AA5B8', { emissiveIntensity: 0.8 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.007, 8, 40), ringM)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.014
  g.add(ring)
  const tick = picture(tickTex(), 0.1, 0.1, [0, 0.12, 0.02], { opacity: 0 })
  g.add(tick)
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.012), new THREE.MeshBasicMaterial({ color: '#9FC6FF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }))
  sweep.rotation.x = -Math.PI / 2
  sweep.position.y = 0.016
  g.add(sweep)
  scene.add(g)
  const blue = new THREE.Color('#7FB0FF')
  const green = new THREE.Color(C.green)
  return (c: number, camera: THREE.Camera) => {
    const gk = green13(c)
    ringM.emissive.copy(blue).lerp(green, gk)
    ringM.emissiveIntensity = 0.8 + 0.6 * gk + 0.2 * Math.sin(c * TAU * 0.8)
    const sc = hold(c, T13.scan[0], T13.scan[0] + 0.1, T13.scan[1] - 0.1, T13.scan[1])
    sweep.position.z = 0.06 * Math.sin((c - T13.scan[0]) * TAU * 1.6)
    ;(sweep.material as THREE.MeshBasicMaterial).opacity = 0.9 * sc
    tick.quaternion.copy(camera.quaternion)
    tick.position.y = 0.12 + 0.012 * Math.sin(c * TAU * 0.9)
    setOp(tick, gk)
  }
}

/* ------------------------------------------------------------------ T13 everyday: the bank counter */

function setupT13Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EFE8DC')
  setCam(camera, CAM13, AT13, 37)
  lights(scene, [0.2, 1.0, -0.6])
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex('#E9DFCF', '#D6C8B1', 2, [9, 6]), roughness: 0.5, emissive: new THREE.Color('#E9DFCF'), emissiveIntensity: 0.08 }), [0, 0, 0.3]))
  scene.add(box(9, 3.6, 0.1, mat('#F1EADF', { roughness: 0.8, emissive: new THREE.Color('#F1EADF'), emissiveIntensity: 0.2 }), [0, 1.8, P13.wallZ - 0.05]))
  scene.add(picture(emblemTex(), 0.26, 0.26, [-0.25, 1.95, P13.wallZ + 0.01]))
  counter13(scene, { front: mat('#A9784F', { roughness: 0.55 }), top: mat('#EDE7DC', { roughness: 0.35, emissive: new THREE.Color('#EDE7DC'), emissiveIntensity: 0.15 }), kick: mat('#6E4E33', { roughness: 0.6 }) })
  /* a wood panel line on the counter front */
  for (const x of [0.05, 0.55]) scene.add(noShadow(box(0.015, P13.counter.top - 0.2, 0.01, mat('#8C6440', { roughness: 0.6 }), [x, (P13.counter.top - 0.05) / 2, P13.counter.z1 + 0.006])))

  /* the passbook, lying open on the counter, tilted up to the room */
  const book = picture(passbookTex(), 0.44, 0.3, [BOOK13.x, BOOK13.y, BOOK13.z], { side: THREE.DoubleSide })
  book.rotation.x = -Math.PI / 2 + 0.95
  scene.add(book)
  scene.add(noShadow(box(0.44, 0.02, 0.05, mat('#1F2E63', { roughness: 0.5 }), [BOOK13.x, BOOK13.y - 0.05, BOOK13.z + 0.1])))
  const pad = makePad13(scene)

  /* the guarded key cabinet: a steel body, a keypad lock, a door hinged on the right; the keys on hooks */
  const { cab } = P13
  const steel = mat('#B9C3D2', { roughness: 0.3, metalness: 0.6, emissive: new THREE.Color('#B9C3D2'), emissiveIntensity: 0.1 })
  scene.add(box(cab.w + 0.04, cab.h + 0.04, 0.03, steel, [cab.x, cab.y, cab.z0 + 0.015]))
  for (const sx of [-1, 1]) scene.add(box(0.02, cab.h + 0.04, cab.z1 - cab.z0, steel, [cab.x + sx * (cab.w / 2 + 0.01), cab.y, (cab.z0 + cab.z1) / 2]))
  for (const sy of [-1, 1]) scene.add(box(cab.w + 0.04, 0.02, cab.z1 - cab.z0, steel, [cab.x, cab.y + sy * (cab.h / 2 + 0.01), (cab.z0 + cab.z1) / 2]))
  scene.add(box(cab.w, cab.h, 0.01, mat('#7A5638', { roughness: 0.6 }), [cab.x, cab.y, cab.z0 + 0.035]))
  for (const hx of P13.hooksX)
    for (const hy of P13.hooksY) {
      scene.add(noShadow(cyl(0.006, 0.006, 0.04, mat('#C9D1DE', { metalness: 0.8 }), [hx, hy, cab.z0 + 0.06], 8).rotateX(Math.PI / 2)))
      if (hx === HOOK13.x && hy === P13.hooksY[0]) continue
      const k = makeKey13(1.1, hy === P13.hooksY[0] ? '#9FB3D6' : '#C9D1DE')
      k.g.position.set(hx, hy - 0.03, cab.z0 + 0.07)
      scene.add(k.g)
    }
  const hinge = new THREE.Group()
  hinge.position.set(cab.x + cab.w / 2, cab.y, cab.z1 + 0.005)
  const doorM = mat('#C3CBD8', { roughness: 0.25, metalness: 0.7 })
  hinge.add(box(cab.w, cab.h, 0.02, doorM, [-cab.w / 2, 0, 0], 0.008))
  hinge.add(noShadow(box(0.025, 0.14, 0.025, mat('#8E99AD', { metalness: 0.8, roughness: 0.25 }), [-cab.w + 0.05, 0, 0.02], 0.008)))
  const lockLed = glowM(C.green, '#3B4458')
  hinge.add(noShadow(box(0.07, 0.1, 0.012, mat('#3B4458', { roughness: 0.4 }), [-cab.w + 0.06, 0.16, 0.014], 0.008)))
  hinge.add(noShadow(box(0.018, 0.012, 0.008, lockLed, [-cab.w + 0.06, 0.195, 0.022])))
  scene.add(hinge)
  /* the camera watching the cabinet */
  const camG = new THREE.Group()
  camG.position.set(cab.x + cab.w / 2 + 0.12, 1.98, P13.wallZ + 0.06)
  camG.add(box(0.05, 0.08, 0.05, mat('#E6EAF0', { roughness: 0.4 }), [0, 0.06, 0]))
  const camHead = new THREE.Group()
  camHead.add(box(0.18, 0.08, 0.09, mat('#F4F6F9', { roughness: 0.35 }), [-0.06, 0, 0.03], 0.02))
  camHead.add(noShadow(cyl(0.025, 0.025, 0.02, mat('#1A2235'), [-0.155, 0, 0.03], 16).rotateZ(Math.PI / 2)))
  const camLed = glowM('#7FB0FF', '#9AA5B8')
  camHead.add(noShadow(box(0.012, 0.012, 0.01, camLed, [-0.03, 0.02, 0.076])))
  camHead.rotation.z = 0.35
  camG.add(camHead)
  scene.add(camG)

  /* her key (the big one with the gold tag), her ID card */
  const key = makeKey13(1.7, '#F2C14E')
  scene.add(key.g)
  const keyGlow = halo('#FFE7A0', 0.22)
  scene.add(keyGlow)
  const card = picture(idTex('person'), 0.15, 0.096, [0, 0, 0], { side: THREE.DoubleSide })
  scene.add(card)

  /* people */
  const cuCfg = who(CAST_PRESETS.arjun, { name: 'Customer', skinTone: 'medium', hair: { style: 'short', color: 'grey' }, outfit: { top: 'kurta', topColor: '#2F7A6B', bottom: 'trousers', bottomColor: '#E9E1D0', shoeColor: '#6E4424' }, accessories: { glasses: 'round', beard: 'short', watch: true } })
  const oCfg = who(CAST_PRESETS.riya, { name: 'Bank Officer', skinTone: 'wheatish', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#F2F5FA', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#1E1E24' }, accessories: { glasses: 'none', earrings: true, watch: true } })
  const shC = buildSkin(cuCfg).shoulderHalf
  const shO = buildSkin(oCfg).shoulderHalf
  const cuRoot = new THREE.Vector3(P13.cust.x, 0, P13.cust.z)
  const offHome = new THREE.Vector3(P13.off.home, 0, P13.off.z)
  const offCab = new THREE.Vector3(P13.off.cab, 0, P13.off.z)

  /* the officer: right hand fetches and hangs the key; it passes to the left hand to go across the counter */
  const restO: Arm = { s: 9, e: 12 }
  const hookR = ik('R', shO, rigTarget(HOOK13.clone().add(new THREE.Vector3(0, -0.01, 0.04)), offCab, P13.off.h, CAM13))
  const carryR = ik('R', shO, { x: 236, y: 218 })
  const midR = ik('R', shO, { x: 212, y: 262 })
  const midL = ik('L', shO, { x: 188, y: 262 })
  const giveL = ik('L', shO, rigTarget(HAND13, offHome, P13.off.h, CAM13))
  const oR = (c: number): Arm => {
    const w = off13(c).walking
    let a: Arm = { s: restO.s - swing(c, w), e: restO.e }
    a = mixArm(a, carryR, Math.max(hold(c, T13.take[2], T13.take[3], T13.swap1[0], T13.swap1[1]), hold(c, T13.swap2[2], T13.swap2[3], T13.hang[0], T13.hang[1])))
    a = mixArm(a, hookR, Math.max(hold(c, ...T13.take), hold(c, ...T13.hang)))
    a = mixArm(a, midR, Math.max(hold(c, ...T13.swap1), hold(c, ...T13.swap2)))
    return a
  }
  const oL = (c: number): Arm => {
    const w = off13(c).walking
    let a: Arm = { s: restO.s + swing(c, w), e: restO.e }
    a = mixArm(a, midL, Math.max(hold(c, T13.swap1[0], T13.swap1[1], T13.swap1[2], T13.give[1] - 0.1), hold(c, T13.back[2], T13.swap2[1], T13.swap2[2], T13.swap2[3])))
    a = mixArm(a, giveL, Math.max(hold(c, ...T13.give), hold(c, T13.back[0], T13.back[1], T13.back[2], T13.back[3] - 0.08)))
    return a
  }
  const officer = person({
    config: oCfg,
    dress: (k) => withNeck(LANYARD('#7A2E3A', C.brand))(withTop(BLAZER('#1F2E63', '#121B3D'))(k)),
    seed: 331,
    faces: [
      [0, 'listening'],
      [0.9, 'thinking'],
      [1.45, 'happy'],
      [2.3, 'thinking'],
      [3.4, 'neutral'],
      [4.35, 'happy'],
      [6.0, 'listening'],
      [6.6, 'neutral'],
      [8.5, 'listening'],
    ],
    pose: (p, c) => {
      const r = oR(c)
      const l = oL(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = l.s
      p.elbowL = l.e
      const at = off13(c)
      walkLegs(p, c, at.walking, at.dir)
      const toCab = Math.max(hold(c, 1.6, 1.8, 3.25, 3.45), hold(c, 6.75, 6.95, 8.05, 8.25))
      const toCu = 1 - toCab
      to(p, 'headTurn', -0.45, toCu)
      to(p, 'lookX', -0.9, toCu)
      to(p, 'headTurn', 0.5, toCab)
      to(p, 'lookX', 0.95, toCab)
      to(p, 'lookY', 0.45, hold(c, 0.75, 0.9, 1.35, 1.5))
      to(p, 'headNod', 0.2, hold(c, 1.4, 1.5, 1.58, 1.7))
      to(p, 'lookY', 0.25, hold(c, 2.6, 2.8, 3.0, 3.2) + hold(c, 7.55, 7.7, 7.9, 8.05))
    },
    loop: L13,
    height: P13.off.h,
    frames: F13,
    redraw,
    holdT: devHold(HOLD13),
  })

  /* the customer: lays his ID on the pad, takes his key, holds it, hands it back, takes his ID */
  const restC: Arm = { s: 8, e: 14 }
  const padR = ik('R', shC, rigTarget(PAD13.clone().add(new THREE.Vector3(0, 0.03, 0)), cuRoot, P13.cust.h, CAM13))
  const takeR = ik('R', shC, rigTarget(HAND13, cuRoot, P13.cust.h, CAM13))
  const showR = ik('R', shC, { x: 230, y: 238 })
  const cR = (c: number): Arm => {
    let a = restC
    a = mixArm(a, padR, Math.max(hold(c, ...T13.card), hold(c, ...T13.pick)))
    a = mixArm(a, showR, hold(c, ...T13.show))
    a = mixArm(a, takeR, Math.max(hold(c, ...T13.recv), hold(c, ...T13.back)))
    return a
  }
  const customer = person({
    config: cuCfg,
    seed: 332,
    faces: [
      [0, 'happy'],
      [0.85, 'listening'],
      [1.5, 'happy'],
      [2.0, 'listening'],
      [4.6, 'happy'],
      [4.95, 'proud'],
      [6.0, 'happy'],
      [6.7, 'neutral'],
      [8.4, 'happy'],
    ],
    pose: (p, c) => {
      const r = cR(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = 7
      p.elbowL = 12
      to(p, 'headTurn', 0.42, 1)
      to(p, 'lookX', 0.88, 1)
      to(p, 'lookY', 0.4, hold(c, 0.3, 0.5, 1.3, 1.5) + hold(c, 8.25, 8.4, 8.6, 8.8))
      const look = hold(c, 4.75, 4.95, 5.85, 6.0)
      to(p, 'headTurn', 0.2, look)
      to(p, 'lookX', 0.45, look)
      to(p, 'lookY', 0.25, look)
      to(p, 'headTilt', 3, look)
    },
    loop: L13,
    height: P13.cust.h,
    frames: F13,
    redraw,
    holdT: devHold(HOLD13),
  })
  customer.object.position.copy(cuRoot)
  scene.add(officer.object, customer.object)
  const clk = slideClock('T13', scene, devHold(HOLD13), [officer, customer])

  const oRoot = new THREE.Vector3()
  const rq = new THREE.Vector3()
  const hA = new THREE.Vector3()
  const hB = new THREE.Vector3()
  const hookPos = HOOK13.clone()
  return (t: number) => {
    const c = mod(clk.time(t), L13)
    const cq = frameT(c, L13, F13)
    const at = off13(c)
    oRoot.set(at.x, bob(at.walking, c), P13.off.z)
    officer.object.position.copy(oRoot)
    officer.update(c, camera)
    customer.update(c, camera)
    pad(c, camera)
    hinge.rotation.y = 100 * DEG * door13(c)
    lockLed.emissiveIntensity = 0.6 + 1.2 * door13(c)
    camLed.emissiveIntensity = 0.8 + 0.8 * Math.sin(c * TAU * 1.2)
    camHead.rotation.y = 0.12 * Math.sin((c / L13) * TAU)
    /* the arms on screen are the frame's (cq); the officer's root is where his body is drawn */
    const aq = off13(cq)
    rq.set(aq.x, bob(aq.walking, cq), P13.off.z)
    const offR = (out: THREE.Vector3) => handWorld('R', shO, oR(cq), P13.off.h, rq, camera, out)
    const offL = (out: THREE.Vector3) => handWorld('L', shO, oL(cq), P13.off.h, rq, camera, out)
    const cuR = (out: THREE.Vector3) => handWorld('R', shC, cR(cq), P13.cust.h, cuRoot, camera, out)
    /* the key: hook → his right hand → his left hand → the customer's hand → back the same way */
    const k = key.g.position
    if (c < T13.take[2] || c >= T13.hang[2] + 0.1) k.copy(hookPos)
    else if (c < T13.take[2] + 0.1) k.copy(hookPos).lerp(offR(hA), seg(c, T13.take[2], T13.take[2] + 0.1))
    else if (c < SW1) offR(k)
    else if (c < SW1 + 0.1) offR(hA).lerp(offL(hB), seg(c, SW1, SW1 + 0.1)), k.copy(hA)
    else if (c < PASS1) offL(k)
    else if (c < PASS1 + 0.1) offL(hA).lerp(cuR(hB), seg(c, PASS1, PASS1 + 0.1)), k.copy(hA)
    else if (c < PASS2) cuR(k)
    else if (c < PASS2 + 0.1) cuR(hA).lerp(offL(hB), seg(c, PASS2, PASS2 + 0.1)), k.copy(hA)
    else if (c < SW2) offL(k)
    else if (c < SW2 + 0.1) offL(hA).lerp(offR(hB), seg(c, SW2, SW2 + 0.1)), k.copy(hA)
    else if (c < T13.hang[2]) offR(k)
    else k.copy(offR(hA)).lerp(hookPos, seg(c, T13.hang[2], T13.hang[2] + 0.1))
    const onHook = c < T13.take[2] || c >= T13.hang[2] + 0.1
    if (!onHook) k.y += 0.05
    key.g.quaternion.copy(camera.quaternion)
    key.g.rotateZ(onHook ? 0 : -0.5)
    keyGlow.position.copy(k).add(new THREE.Vector3(0, -0.04, 0.01))
    keyGlow.quaternion.copy(camera.quaternion)
    setOp(keyGlow, 0.3 + 0.12 * Math.sin(c * TAU * 1.1) + 0.3 * hold(c, ...T13.show))
    key.brass.emissiveIntensity = 0.15 + 0.35 * hold(c, ...T13.show)
    /* his ID: in his hand → on the pad → back in his hand */
    const onPadPos = hB.copy(PAD13).add(new THREE.Vector3(0, 0.016, 0))
    if (c >= T13.card[1] + 0.12 && c < T13.pick[2]) {
      card.position.copy(onPadPos)
      card.quaternion.identity()
      card.rotation.x = -Math.PI / 2
    } else {
      cuR(hA)
      if (c >= T13.card[1] && c < T13.card[1] + 0.12) hA.lerp(onPadPos, seg(c, T13.card[1], T13.card[1] + 0.12))
      if (c >= T13.pick[2] && c < T13.pick[2] + 0.1) hA.lerp(onPadPos, 1 - seg(c, T13.pick[2], T13.pick[2] + 0.1))
      card.position.copy(hA)
      card.quaternion.copy(camera.quaternion)
      card.rotateZ(-0.2)
    }
  }
}

/* ------------------------------------------------------------------ T13 concept: the application and Secrets Manager */

/* framed closer than the everyday card (coordinator, 2026-11-20): the same places left to right (the application where
   the customer stands, the IAM pad and the code where the ID pad and passbook lie, the shuttle where the officer walks,
   the vault where the cabinet stands), the desk shorter and the camera on the desk top */
const Q13 = {
  cam: [0.24, 1.68, 2.55] as V3,
  at: [0.24, 1.36, -0.6] as V3,
  fov: 38.5,
  desk: { x0: -0.25, x1: 0.95, top: 1.0, z0: -0.5, z1: -0.18 },
  lap: { x: -0.5, z: -0.3, top: 0.98, s: 1.5 },
  pad: new THREE.Vector3(0.0, 1.02, -0.33),
  book: new THREE.Vector3(0.5, 1.07, -0.33),
}

function setupT13Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E3EDFC')
  setCam(camera, Q13.cam, Q13.at, Q13.fov)
  lights(scene, [0.2, 1.2, -0.6], 2.3)
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex('#F2F6FD', '#DCE5F5', 2, [9, 6]), roughness: 0.5, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.22 }), [0, 0, 0.3]))
  scene.add(box(9, 3.6, 0.1, mat('#DCE7FA', { roughness: 0.8, emissive: new THREE.Color('#DCE7FA'), emissiveIntensity: 0.55 }), [0, 1.8, P13.wallZ - 0.05]))
  const dk = Q13.desk
  counter13(scene, { front: WHITE_M(), top: mat(C.brand, { roughness: 0.3, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.15 }), kick: mat('#C9D5EC', { roughness: 0.5 }) }, dk)
  for (const x of [0.15, 0.55]) scene.add(noShadow(box(0.012, dk.top - 0.2, 0.01, mat('#C9D5EC', { roughness: 0.5 }), [x, (dk.top - 0.05) / 2, dk.z1 + 0.006])))
  scene.add(noShadow(box(dk.x1 - dk.x0 - 0.1, 0.02, 0.01, glowM('#7FB0FF', '#DCE6F7', { emissiveIntensity: 0.6 }), [(dk.x0 + dk.x1) / 2, dk.top - 0.16, dk.z1 + 0.007])))

  /* the application: a laptop on a round table where the customer stands */
  const { lap } = Q13
  const ax = lap.x
  const az = lap.z
  stand(scene, ax, az, lap.top, 0.3)
  const laptop = new THREE.Group()
  laptop.position.set(ax, lap.top + 0.047, az)
  laptop.rotation.y = -0.25
  laptop.scale.setScalar(lap.s)
  laptop.add(box(0.4, 0.018, 0.27, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.009, 0], 0.008))
  const lid = new THREE.Group()
  lid.position.set(0, 0.018, -0.13)
  lid.rotation.x = -0.18
  lid.add(box(0.4, 0.27, 0.014, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.135, -0.007], 0.008))
  const scr = picture(screenTex(), 0.37, 0.24, [0, 0.135, 0.002])
  lid.add(scr)
  const scrGlow = halo('#7FB0FF', 0.6)
  scrGlow.position.set(0, 0.135, 0.01)
  lid.add(scrGlow)
  laptop.add(lid)
  scene.add(laptop)
  const APP = new THREE.Vector3(ax + 0.04, lap.top + 0.3, az + 0.12)

  /* its code lying open on the desk, where the passbook lies: no secret in it */
  const { book } = Q13
  const code = picture(codeTex(), 0.5, 0.34, [book.x, book.y, book.z], { side: THREE.DoubleSide })
  code.rotation.x = -Math.PI / 2 + 0.95
  scene.add(code)
  scene.add(noShadow(box(0.5, 0.02, 0.05, mat('#16234A', { roughness: 0.5 }), [book.x, book.y - 0.06, book.z + 0.11])))
  const pad = makePad13(scene, Q13.pad, 1.25)

  /* the shuttle's rail behind the desk, where the officer walks */
  const RAIL_Y = 1.34
  const railM = mat('#AFC3E6', { roughness: 0.3, metalness: 0.5 })
  for (const dz of [-0.04, 0.04]) scene.add(noShadow(cyl(0.009, 0.009, 0.82, railM, [0.34, RAIL_Y, P13.off.z + dz], 10).rotateZ(Math.PI / 2)))
  for (const x of [-0.04, 0.72]) scene.add(cyl(0.012, 0.014, RAIL_Y, mat('#C9D5EC', { metalness: 0.5, roughness: 0.3 }), [x, RAIL_Y / 2, P13.off.z], 12))
  const shuttle = new THREE.Group()
  shuttle.add(box(0.2, 0.09, 0.14, WHITE_M(), [0, 0.05, 0], 0.025))
  const shLed = glowM('#7FB0FF', '#DCE6F7', { emissiveIntensity: 0.6 })
  shuttle.add(noShadow(box(0.12, 0.012, 0.01, shLed, [0, 0.06, 0.066])))
  scene.add(shuttle)

  /* the Secrets Manager vault where the cabinet stands: a steel safe, a door hinged on the right, its mark above */
  const { cab } = P13
  const steel = mat('#C9D2E0', { roughness: 0.32, metalness: 0.35, emissive: new THREE.Color('#C9D2E0'), emissiveIntensity: 0.12 })
  scene.add(box(cab.w + 0.08, cab.h + 0.08, cab.z1 - cab.z0, steel, [cab.x, cab.y, (cab.z0 + cab.z1) / 2 - 0.005], 0.03))
  scene.add(box(cab.w - 0.02, cab.h - 0.02, 0.02, mat('#1F2E63', { roughness: 0.6, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.2 }), [cab.x, cab.y, cab.z1 + 0.001]))
  const cradle = HOOK13.clone().setZ(cab.z1 + 0.018)
  scene.add(noShadow(box(0.16, 0.02, 0.06, mat('#3A4A70', { metalness: 0.5, roughness: 0.3 }), [cradle.x, cradle.y - 0.1, cradle.z])))
  const hinge = new THREE.Group()
  /* a bezel round the opening, so the door stands proud of the body and the credential sits inside */
  for (const sx of [-1, 1]) scene.add(box(0.04, cab.h + 0.08, 0.07, steel, [cab.x + sx * (cab.w / 2 + 0.02), cab.y, cab.z1 + 0.035]))
  for (const sy of [-1, 1]) scene.add(box(cab.w + 0.08, 0.04, 0.07, steel, [cab.x, cab.y + sy * (cab.h / 2 + 0.02), cab.z1 + 0.035]))
  hinge.position.set(cab.x + cab.w / 2, cab.y, cab.z1 + 0.05)
  hinge.add(box(cab.w, cab.h, 0.04, steel, [-cab.w / 2, 0, 0], 0.012))
  const wheel = new THREE.Group()
  wheel.position.set(-cab.w / 2, 0, 0.03)
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 12, 40), mat('#D5DCE7', { metalness: 0.85, roughness: 0.22 })))
  for (let i = 0; i < 3; i++) {
    const sp = box(0.16, 0.014, 0.014, mat('#D5DCE7', { metalness: 0.85, roughness: 0.22 }), [0, 0, 0])
    sp.rotation.z = (i / 3) * Math.PI
    wheel.add(sp)
  }
  hinge.add(wheel)
  scene.add(hinge)
  scene.add(picture(markTex(secretsUrl, redraw), 0.2, 0.2, [cab.x, cab.y + cab.h / 2 + 0.2, P13.wallZ + 0.02]))

  /* the credential (a gold key), the role badge */
  const gold = mat('#F2C14E', { roughness: 0.22, metalness: 0.75, emissive: new THREE.Color('#F2C14E'), emissiveIntensity: 0.35 })
  const cred = new THREE.Group()
  cred.add(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 12, 28), gold))
  cred.add(box(0.11, 0.017, 0.014, gold, [0.085, 0, 0]))
  cred.add(box(0.017, 0.03, 0.014, gold, [0.122, -0.02, 0]))
  cred.add(box(0.014, 0.024, 0.014, gold, [0.097, -0.016, 0]))
  scene.add(cred)
  const credGlow = halo('#FFD873', 0.34)
  scene.add(credGlow)
  const badge = picture(idTex('role'), 0.15, 0.096, [0, 0, 0], { side: THREE.DoubleSide })
  scene.add(badge)

  const clk = slideClock('T13', scene, devHold(HOLD13), [])
  const SH_Y = RAIL_Y + 0.02
  const onShuttle = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const appHold = APP.clone().add(new THREE.Vector3(0.06, 0.36, 0.12))
  /** an arc from a to b at k */
  const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, hgt: number, out: THREE.Vector3) => out.copy(a).lerp(b, k).setY(lerp(a.y, b.y, k) + hgt * Math.sin(Math.PI * k))
  return (t: number) => {
    const c = mod(clk.time(t), L13)
    const at = off13(c)
    shuttle.position.set(at.x, SH_Y - 0.05, P13.off.z)
    shLed.emissiveIntensity = 0.6 + 0.8 * at.walking
    pad(c, camera)
    hinge.rotation.y = 100 * DEG * door13(c)
    wheel.rotation.z = -1.6 * door13(c)
    onShuttle.set(at.x, SH_Y + 0.11, P13.off.z + 0.02)
    /* the credential: cradle → shuttle → the application → shuttle → cradle */
    const p = cred.position
    if (c < T13.take[2] || c >= T13.hang[2] + 0.15) p.copy(cradle)
    else if (c < T13.take[2] + 0.2) arc(cradle, onShuttle, seg(c, T13.take[2], T13.take[2] + 0.2), 0.08, p)
    else if (c < T13.give[0]) p.copy(onShuttle)
    else if (c < PASS1) arc(onShuttle, appHold, seg(c, T13.give[0], PASS1), 0.22, p)
    else if (c < T13.back[0]) p.copy(appHold).setY(appHold.y + 0.012 * Math.sin((c - PASS1) * TAU))
    else if (c < PASS2 + 0.25) arc(appHold, onShuttle, seg(c, T13.back[0], PASS2 + 0.25), 0.22, p)
    else if (c < T13.hang[2]) p.copy(onShuttle)
    else arc(onShuttle, cradle, seg(c, T13.hang[2], T13.hang[2] + 0.15), 0.08, p)
    cred.quaternion.copy(camera.quaternion)
    cred.rotateZ(0.15 * Math.sin(c * TAU * 0.7))
    const use = hold(c, PASS1, PASS1 + 0.2, T13.back[0] - 0.2, T13.back[0])
    gold.emissiveIntensity = 0.35 + 0.6 * use
    credGlow.position.copy(p).add(tmp.set(0.05, 0, 0.03))
    credGlow.quaternion.copy(camera.quaternion)
    setOp(credGlow, 0.45 + 0.1 * Math.sin(c * TAU) + 0.35 * use)
    setOp(scrGlow, 0.3 + 0.55 * use)
    /* the role badge: from the application onto the pad, and back at the end */
    const padTop = tmp.copy(Q13.pad).add(new THREE.Vector3(0, 0.02, 0))
    if (c >= T13.card[1] + 0.12 && c < T13.pick[2]) {
      badge.position.copy(padTop)
      badge.quaternion.identity()
      badge.rotation.x = -Math.PI / 2
    } else {
      const k = c < 4 ? seg(c, T13.card[0], T13.card[1] + 0.12) : 1 - seg(c, T13.pick[1], T13.pick[2] + 0.1)
      arc(APP.clone().add(new THREE.Vector3(0.12, -0.12, 0.12)), padTop, k, 0.18, badge.position)
      badge.quaternion.copy(camera.quaternion)
      badge.rotateZ(-0.2 * (1 - k))
      if (k > 0.85) badge.rotateX(-(Math.PI / 2) * seg(k, 0.85, 1))
    }
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (id: string, setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <ClockCard id={id}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T11Everyday: card('T11', setupT11Everyday, devHold(HOLD11)),
  I_T11Concept: card('T11', setupT11Concept, devHold(HOLD11)),
  I_T13Everyday: card('T13', setupT13Everyday, devHold(HOLD13)),
  I_T13Concept: card('T13', setupT13Concept, devHold(HOLD13)),
}
export const css = ''
