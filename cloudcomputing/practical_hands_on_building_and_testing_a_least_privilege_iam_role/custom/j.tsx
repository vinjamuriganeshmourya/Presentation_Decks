import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import ec2InstanceUrl from '../images/res-ec2-instance.svg'
import roleUrl from '../images/res-iam-role.svg'
import s3Url from '../images/aws-s3.svg'
import s3BucketUrl from '../images/res-s3-bucket.svg'
import lambdaUrl from '../images/aws-lambda.svg'

/**
 * BUILDER J · SESSION 14 (IAM Roles & Least Privilege), SLIDES 31 (T15-AN) AND 37 (T19-AN).
 *
 * TR 15: "A hotel gives a room its own access card for housekeeping services, regardless of which staff member performs
 * the work: just as an instance role gives the EC2 instance its own identity to access AWS services."
 * TR 19: "A delivery worker receives a temporary access card that opens only the assigned delivery area and expires
 * after the shift: just as an AI agent receives limited, short-lived credentials for its assigned task."
 *
 * Built like Session 16's j.tsx (accepted): real-time 3D on the engine's `@/engine/three-stage`, a perspective camera,
 * people are Character Lab characters through the engine's `castSprite` (role clothing by `dress`, `adaptive` frames,
 * expressions keyed to the action), no text on either card, ONE wall-clock loop per slide shared by both cards beat for
 * beat and place for place, every loop ending in the state it starts in, held frames (`?still`, thumbnails) at HOLD.
 *
 * T15, one 9 s loop, two turns of 4.5 s; both cards on one ground plan:
 *
 *   place                 everyday (a hotel corridor)                   concept (a server room)
 *   back wall, centre     the room door (brass plaque on it)            the EC2 instance's cabinet door (EC2 mark on it)
 *   behind it             the room: bed, lamp, window                   the instance: server sleds, a compute board
 *   on the door           the card lock (its light blinks green)        the cabinet lock (its light blinks green)
 *   beside the door       the room's own card in its wall holder        the instance's own role badge in its dock
 *   left                  housekeeper A (plum tunic, apron), her cart    workload A (blue app block) on its pedestal
 *   right                 housekeeper B (a different man), his caddy     workload B (teal app block) on its pedestal
 *   one turn              walks up, takes the room's card, taps the      glides up, the role badge docks on it, taps the
 *                         lock, the door opens, steps in, makes the      lock, the door opens, it slides in and runs: a
 *                         bed, steps out, the door shuts, the card       dot rides from the badge to the AWS service (S3)
 *                         goes back in the holder, back to the cart      and back; out, shut, the badge back in its dock
 *   then                  housekeeper B does the same with the SAME     workload B does the same with the SAME badge
 *                         card
 *
 * T19, one 9 s loop:
 *
 *   place                 everyday (a delivery depot)                   concept (a cloud API wall)
 *   back wall, left       delivery area A: roller shutter, blue band    API door A: sliding panel, blue band, S3 mark
 *   back wall, right      delivery area B: roller shutter, purple band  API door B: sliding panel, purple band, Lambda mark
 *   beside each           a card reader                                 a token socket
 *   between them          the shift clock: a green shift band, a hand   the token timer: a green band, a hand
 *   the person            the delivery worker (vest, cap, a parcel),     the AI agent robot (a task cube), a glowing
 *                         a temporary card with a light on it            token in its hand
 *   0.0 - 2.7             taps at A: green, the shutter rolls up        taps at A: green, the panel slides up
 *   2.6 - 4.9             taps at B: orange, the shutter stays shut     taps at B: orange, the panel stays shut
 *   6.05                  the clock leaves the shift band: the card's   the timer leaves its band: the token dims
 *                         light goes out
 *   6.4 - 7.6             taps at A again: orange, stays shut           taps at A again: orange, stays shut
 *   8.9 - 9.0             the next shift: the card lights again          a new token lifetime: the token lights again
 */

const W = 470
const H = 390
/* dev only: `?jt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devT = (fallback: number) => {
  if (typeof window === 'undefined') return fallback
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : fallback
}

const C = {
  brand: colors.brand,
  brandDark: colors.brandDark,
  navy: '#1F2E63',
  accent: colors.accent,
  green: '#22C55E',
  teal: colors.teal,
  purple: '#7C5CE0',
  white: colors.white,
  plum: '#7A4A86' as `#${string}`,
  brass: '#D4A24A',
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
/** an official mark (svg url) rasterised on a white rounded tile, sharp, reading as the white tile (rule 54) */
function markTex(url: string, redraw: () => void, px = 512, tile = true): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const g = c.getContext('2d')!
    if (tile) {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.roundRect(0, 0, px, px, px * 0.16)
      g.fill()
    }
    const pad = tile ? px * 0.14 : 0
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}
/** wood planks along x */
const planksTex = (a: string, b: string, line: string) =>
  canvasTex(
    256,
    128,
    (g) => {
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i % 2 ? a : b
        g.fillRect(0, i * 32, 256, 32)
        g.fillStyle = line
        g.fillRect(0, i * 32, 256, 1.5)
        g.fillRect(((i * 97) % 256) + 0, i * 32, 1.5, 32)
      }
    },
    [6, 10],
  )
/** the corridor carpet runner: a deep red field, a gold border, a diamond pattern */
const carpetTex = () =>
  canvasTex(
    256,
    96,
    (g) => {
      g.fillStyle = '#8E2F3C'
      g.fillRect(0, 0, 256, 96)
      g.fillStyle = '#D9A94E'
      g.fillRect(0, 6, 256, 5)
      g.fillRect(0, 85, 256, 5)
      g.fillStyle = '#A8414F'
      for (let x = 0; x < 256; x += 32) {
        g.beginPath()
        g.moveTo(x + 16, 22)
        g.lineTo(x + 30, 48)
        g.lineTo(x + 16, 74)
        g.lineTo(x + 2, 48)
        g.closePath()
        g.fill()
      }
      g.fillStyle = '#D9A94E'
      for (let x = 0; x < 256; x += 32) {
        g.beginPath()
        g.arc(x + 16, 48, 3.5, 0, TAU)
        g.fill()
      }
    },
    [3, 1],
  )
/** square floor tiles with thin joints */
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
/** roller shutter slats */
const slatsTex = (base: string, rib: string) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      for (let y = 0; y < 128; y += 16) {
        g.fillStyle = rib
        g.fillRect(0, y + 12, 128, 3)
        g.fillStyle = 'rgba(255,255,255,0.35)'
        g.fillRect(0, y + 1, 128, 2)
      }
    },
    [1, 10],
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
/** a lit plane facing +z */
const plane = (w: number, h: number, m: THREE.Material, pos: [number, number, number]) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  p.position.set(...pos)
  return p
}
/** a soft round glow (a light's halo), facing +z */
function halo(color: string, r: number) {
  const t = canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 64, 64)
  })
  const m = new THREE.MeshBasicMaterial({ map: t, color, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })
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

/* T15: two housekeepers, the same hotel uniform (plum tunic, cream apron), two different people */
const HOUSEKEEPER_A = who(CAST_PRESETS.ananya, {
  name: 'Housekeeper A',
  gender: 'female',
  skinTone: 'wheatish',
  hair: { style: 'bun', color: 'black' },
  outfit: { top: 'blouse', topColor: C.plum, bottom: 'trousers', bottomColor: '#2A2F45', shoeColor: '#2A2A30' },
  accessories: { earrings: true, bindi: true },
  build: { height: 0.98, shoulders: 1 },
})
const HOUSEKEEPER_B = who(CAST_PRESETS.kabir, {
  name: 'Housekeeper B',
  gender: 'male',
  skinTone: 'deep',
  hair: { style: 'curly', color: 'black' },
  outfit: { top: 'polo', topColor: C.plum, bottom: 'trousers', bottomColor: '#2A2F45', shoeColor: '#2A2A30' },
  accessories: { beard: 'short', glasses: 'rect', watch: true },
  build: { height: 1.04, shoulders: 1.04 },
})
/* T19: the delivery worker */
const COURIER = who(CAST_PRESETS.arjun, {
  name: 'Delivery Worker',
  gender: 'male',
  skinTone: 'medium',
  hair: { style: 'short', color: 'black' },
  outfit: { top: 'polo', topColor: '#26365E', bottom: 'trousers', bottomColor: '#3B3F4A', shoeColor: '#2A2A30' },
  accessories: { beard: 'stubble', watch: true },
  build: { height: 1.02, shoulders: 1.04 },
})

/* role clothing, rig body frame 400 x 600 (head-local for the cap) */
const APRON = (fill: string, edge: string) => (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill={fill} stroke={edge} strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke={edge} strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill={fill} stroke={edge} strokeWidth={2.5} />
    <rect x={212} y={240} width={20} height={9} rx={2} fill="#FFFFFF" stroke={edge} strokeWidth={1.5} />
  </g>
)
/** a hi-vis delivery vest: two panels, two reflective bands */
const VEST = (
  <g data-part="vest">
    <path d="M 146 214 L 184 208 L 192 268 L 186 420 L 150 420 Z" fill="#D7EA3A" stroke="#A9BB22" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 254 214 L 216 208 L 208 268 L 214 420 L 250 420 Z" fill="#D7EA3A" stroke="#A9BB22" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 149 330 L 189 330 L 189 344 L 149 344 Z M 211 330 L 251 330 L 251 344 L 211 344 Z" fill="#E6EBF2" stroke="#B7C1CF" strokeWidth={1.5} />
    <path d="M 150 384 L 187 384 L 187 398 L 150 398 Z M 213 384 L 250 384 L 250 398 L 213 398 Z" fill="#E6EBF2" stroke="#B7C1CF" strokeWidth={1.5} />
  </g>
)
/** a delivery cap, head-local (skull centre 0,0) */
const DELIVERY_CAP = (
  <g data-part="cap">
    <path d="M -60 -42 C -62 -98 62 -98 60 -42 Z" fill="#26365E" />
    <path d="M -46 -84 C -20 -96 20 -96 46 -84" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-61} y={-52} width={122} height={12} rx={4} fill="#D7EA3A" />
    <path d="M -58 -42 Q 0 -22 58 -42 L 54 -48 Q 0 -34 -54 -48 Z" fill="#18233F" />
  </g>
)
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })

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
const timeline = (seed: number, L: number, keys: [number, string][]) => (t: number): Timeline => ({ seed, idle: { ...CAST_IDLE, saccades: false, sway: false }, life: 0, ...faceAt(t, keys, L) })
/** face keys of one turn, moved `off` seconds round the loop and sorted */
const shiftKeys = (keys: [number, string][], off: number, L: number): [number, string][] => keys.map(([t, n]) => [mod(t + off, L), n] as [number, string]).sort((a, b) => a[0] - b[0])

function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = mix((p as Record<string, number>)[ch], v, clamp01(w))
}
/** the walking layer: knees alternate, arms swing, head toward the way the person goes (dir -1 left, +1 right) */
function walkPose(p: Pose, c: number, w: number, dir: number, arms = true) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  if (arms) {
    to(p, 'shoulderL', 8 + 10 * stride, w)
    to(p, 'shoulderR', 8 - 10 * stride, w)
  }
  if (dir) {
    to(p, 'headTurn', 0.45 * dir, w)
    to(p, 'lookX', 0.8 * dir, w)
  }
}
const bob = (walking: number, c: number) => walking * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.035
/** a walk through key points [t, x, z]: smooth between keys, standing still where two keys share a place */
type Key = [number, number, number]
type Place = { x: number; z: number; walking: number; dir: number }
function along(c: number, keys: Key[]): Place {
  if (c <= keys[0][0]) return { x: keys[0][1], z: keys[0][2], walking: 0, dir: 0 }
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, z1] = keys[i]
    const [t0, x0, z0] = keys[i - 1]
    if (c <= t1) {
      const k = seg(c, t0, t1)
      const moving = Math.hypot(x1 - x0, z1 - z0) > 0.01
      const walking = moving ? hold(c, t0, t0 + 0.12, t1 - 0.12, t1) : 0
      const dir = Math.abs(x1 - x0) > 0.25 ? Math.sign(x1 - x0) : 0
      return { x: mix(x0, x1, k), z: mix(z0, z1, k), walking, dir }
    }
  }
  const last = keys[keys.length - 1]
  return { x: last[1], z: last[2], walking: 0, dir: 0 }
}

/* ---- arms, solved in the rig's frame (Arm.tsx: the right arm is the left one mirrored about x 200) ---- */

const SHOULDER_Y = 205
const UPPER = 95
const FORE = 85 + 14 // to the middle of the grip
type Pt = { x: number; y: number }
/** two-link IK for the LEFT arm (the viewer's left): shoulder and elbow angles that put the grip at `p` */
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
/** the other answer: the elbow down and the forearm up beside it (the rig takes a negative elbow, as its wave does).
    A reach to a reader or a holder close beside the shoulder uses it; the first answer put the elbow up by the ear. */
function solveLDown(sh: number, p: Pt): Ang {
  const a = solveL(sh, p)
  const px = 200 - (sh - 6)
  const ad = Math.atan2(-(p.x - px), p.y - SHOULDER_Y) / DEG
  const beta = a.s - ad
  return { s: ad - beta, e: -a.e }
}
type Ang = { s: number; e: number }
/** the RIGHT arm (the viewer's right): the left arm's answer for the mirrored point */
const solveR = (sh: number, p: Pt, down = false): Ang => (down ? solveLDown : solveL)(sh, { x: 400 - p.x, y: p.y })
/** where the right hand's grip is for joint angles `a` (forward kinematics, the rig's own chain) */
function fkR(sh: number, a: Ang): Pt {
  const px = 200 - (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  const x = px - Math.sin(s) * UPPER - Math.sin(f) * FORE
  const y = SHOULDER_Y + Math.cos(s) * UPPER + Math.cos(f) * FORE
  return { x: 400 - x, y }
}
/** joint angles at time c from keyed poses [t, angles], eased between keys, held before the first and after the last */
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
function reachL(sh: number, p: Pt): Pt {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const d = Math.hypot(dx, dy)
  const R = UPPER + FORE - 1
  return d <= R ? p : { x: px + (dx / d) * R, y: SHOULDER_Y + (dy / d) * R }
}
/** a rig-frame point on a billboarded sprite of height `h` at `root`, in the scene */
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
  const p = cam.clone().addScaledVector(ray, t)
  const u = h / 0.93 / 600
  const lx = Math.cos(phi) * (p.x - root.x) - Math.sin(phi) * (p.z - root.z)
  return { x: 200 + lx / u, y: 600 - (p.y - root.y) / u }
}
/** move a point toward the camera along its view ray, so a prop sits in front of the sprite and projects onto the hand */
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** a sprite's frame time for loop time c (the frame on screen), so a prop follows the hand that is drawn */
const frameTime = (c: number, L: number, F: number) => (Math.floor((c / L) * F) % F) * (L / F)

/* ------------------------------------------------------------------ shared props */

/** the room key card / the role badge: a rounded card, a printed face */
function makeCard(face: THREE.Texture, w: number, h: number, body: string) {
  const g = new THREE.Group()
  g.add(mesh(new RoundedBoxGeometry(w, h, 0.01, 3, 0.012), mat(body, { roughness: 0.35, metalness: 0.1 })))
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.94), flat(face))
  f.position.z = 0.0056
  g.add(f)
  return noShadow(g)
}
/** the hotel key card's face: brand blue, a white wave band, a gold chip, a key glyph (no words) */
const keyCardTex = () =>
  canvasTex(110, 170, (g) => {
    g.fillStyle = C.brand
    rrect(g, 0, 0, 110, 170, 12)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.moveTo(0, 104)
    g.bezierCurveTo(40, 86, 70, 124, 110, 104)
    g.lineTo(110, 128)
    g.bezierCurveTo(70, 148, 40, 110, 0, 128)
    g.closePath()
    g.fill()
    g.fillStyle = '#F2C14E'
    rrect(g, 16, 18, 30, 24, 5)
    g.fill()
    g.strokeStyle = '#B98A1C'
    g.lineWidth = 1.5
    g.strokeRect(22, 24, 18, 12)
    /* a key */
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 6
    g.beginPath()
    g.arc(74, 58, 12, 0, TAU)
    g.stroke()
    g.beginPath()
    g.moveTo(74, 70)
    g.lineTo(74, 94)
    g.moveTo(74, 82)
    g.lineTo(84, 82)
    g.moveTo(74, 92)
    g.lineTo(82, 92)
    g.stroke()
  })

/* ================================================================== T15 · the room's own card */

const L15 = 9
const TURN = 4.5
const HOLD15 = 2.8
const F15 = 108
const P15 = {
  wallZ: -0.6,
  wallT: 0.12,
  doorX: -0.32,
  doorW: 0.94,
  doorH: 2.06,
  holder: new THREE.Vector3(0.36, 1.2, -0.6 + 0.03),
  rest: [[-1.22, 0.32], [1.08, 0.32]] as [number, number][],
  tap: [-0.22, -0.14] as [number, number],
  inside: [-0.02, -1.02] as [number, number],
  cart: new THREE.Vector3(-1.9, 0, 0.1),
  caddy: new THREE.Vector3(1.56, 0, 0.0),
  roomZ: -3.0,
  hA: 1.6,
  hB: 1.72,
}
const CAM15 = { pos: [0.18, 1.95, 5.9] as [number, number, number], at: [-0.2, 1.08, -0.5] as [number, number, number], fov: 34 }
/* one turn, in its own time u (worker A's turn starts at 0, worker B's at 4.5) */
const B15 = { arrive: 0.8, take: 1.05, tap: 1.45, open: [1.5, 1.95], inA: 1.85, inB: 2.35, work: [2.4, 3.1], outA: 3.15, outB: 3.55, close: [3.5, 3.85], put: 3.96, backA: 4.05, backB: 4.75 }
const turnKeys = (rest: [number, number]): Key[] => [
  [0, rest[0], rest[1]],
  [B15.arrive, P15.tap[0], P15.tap[1]],
  [B15.inA, P15.tap[0], P15.tap[1]],
  [B15.inB, P15.inside[0], P15.inside[1]],
  [B15.outA, P15.inside[0], P15.inside[1]],
  [B15.outB, P15.tap[0], P15.tap[1]],
  [B15.backA, P15.tap[0], P15.tap[1]],
  [B15.backB, rest[0], rest[1]],
]
const doorOpen15 = (u: number) => seg(u, B15.open[0], B15.open[1]) * (1 - seg(u, B15.close[0], B15.close[1]))
/** the active worker's own time: whoever's turn it is (0 or 1), and u */
const turnU = (c: number, k: number) => mod(c - k * TURN, L15)
const FACES15: [number, string][] = [
  [0, 'neutral'],
  [B15.arrive, 'thinking'],
  [B15.open[0], 'happy'],
  [B15.inB, 'thinking'],
  [B15.work[1], 'proud'],
  [B15.put, 'happy'],
  [B15.backB, 'listening'],
]

/** the cart: a frame on wheels, two shelves of folded towels, spray bottles on top, a linen bag at the end */
function housekeepingCart(): THREE.Group {
  const g = new THREE.Group()
  const frameM = mat('#5E6B86', { roughness: 0.35, metalness: 0.6 })
  const shelfM = mat('#E8E2D6', { roughness: 0.6 })
  const W_ = 0.62
  const D_ = 0.36
  for (const y of [0.16, 0.5, 0.86]) g.add(box(W_, 0.025, D_, shelfM, [0, y, 0], 0.008))
  for (const x of [-W_ / 2 + 0.015, W_ / 2 - 0.015]) for (const z of [-D_ / 2 + 0.015, D_ / 2 - 0.015]) g.add(box(0.022, 0.86, 0.022, frameM, [x, 0.5, z]))
  for (const x of [-W_ / 2 + 0.05, W_ / 2 - 0.05]) for (const z of [-D_ / 2 + 0.05, D_ / 2 - 0.05]) g.add(cyl(0.045, 0.045, 0.03, mat('#2A2E3A'), [x, 0.045, z], 16).rotateX(Math.PI / 2))
  /* the push handle */
  g.add(box(0.025, 0.25, 0.025, frameM, [W_ / 2 + 0.02, 0.98, -0.12]), box(0.025, 0.25, 0.025, frameM, [W_ / 2 + 0.02, 0.98, 0.12]))
  g.add(cyl(0.016, 0.016, 0.28, frameM, [W_ / 2 + 0.02, 1.1, 0], 12).rotateX(Math.PI / 2))
  /* folded towels: white and pale blue stacks */
  const towelW = mat('#FFFFFF', { roughness: 0.85 })
  const towelB = mat('#BFD6F6', { roughness: 0.85 })
  for (const [x, y, m, n] of [[-0.18, 0.53, towelW, 4], [0.0, 0.53, towelB, 3], [0.18, 0.53, towelW, 4], [-0.14, 0.19, towelB, 4], [0.12, 0.19, towelW, 5]] as [number, number, THREE.Material, number][])
    for (let i = 0; i < n; i++) g.add(box(0.16, 0.05, 0.24, m, [x, y + 0.03 + i * 0.055, 0], 0.02))
  /* spray bottles and a tissue box on top */
  for (const [x, c] of [[-0.18, '#2D9CDB'], [-0.08, '#22A06B']] as [number, string][]) {
    g.add(cyl(0.035, 0.035, 0.16, mat(c, { roughness: 0.3 }), [x, 0.96, 0.05], 16))
    g.add(box(0.03, 0.05, 0.05, mat('#FFFFFF'), [x, 1.06, 0.06]))
  }
  g.add(box(0.16, 0.08, 0.1, mat('#F7F3EC', { roughness: 0.5 }), [0.12, 0.92, 0.0], 0.01))
  /* the linen bag hanging at the cart's left end */
  g.add(box(0.06, 0.62, D_ * 0.9, mat('#6E4A78', { roughness: 0.9 }), [-W_ / 2 - 0.05, 0.56, 0], 0.03))
  return g
}

/** the caddy: a plastic tote with a handle and three bottles */
function cleaningCaddy(): THREE.Group {
  const g = new THREE.Group()
  const tote = mat('#2D63FB', { roughness: 0.4 })
  g.add(box(0.36, 0.14, 0.22, tote, [0, 0.07, 0], 0.02))
  g.add(box(0.02, 0.22, 0.02, tote, [-0.16, 0.2, 0]), box(0.02, 0.22, 0.02, tote, [0.16, 0.2, 0]))
  g.add(box(0.34, 0.025, 0.03, tote, [0, 0.31, 0], 0.01))
  for (const [x, c] of [[-0.1, '#F2C14E'], [0.0, '#FFFFFF'], [0.1, '#22A06B']] as [number, string][]) g.add(cyl(0.032, 0.032, 0.2, mat(c, { roughness: 0.3 }), [x, 0.2, 0.04], 14))
  return g
}

/** the corridor wall with its door opening (and the room behind), the same frame for both cards */
function corridorWall(St: THREE.Group, wall: THREE.Material, trim: THREE.Material) {
  const { wallZ: wz, wallT: T, doorX, doorW, doorH } = P15
  const zc = wz - T / 2
  const dx0 = doorX - doorW / 2
  const dx1 = doorX + doorW / 2
  St.add(box(dx0 + 4.6, 3.4, T, wall, [(dx0 - 4.6) / 2, 1.7, zc]))
  St.add(box(4.6 - dx1, 3.4, T, wall, [(dx1 + 4.6) / 2, 1.7, zc]))
  St.add(box(doorW, 3.4 - doorH, T, wall, [doorX, (doorH + 3.4) / 2, zc]))
  /* the frame round the opening */
  St.add(box(0.07, doorH + 0.07, T + 0.04, trim, [dx0 - 0.035, (doorH + 0.07) / 2, zc]))
  St.add(box(0.07, doorH + 0.07, T + 0.04, trim, [dx1 + 0.035, (doorH + 0.07) / 2, zc]))
  St.add(box(doorW + 0.14, 0.07, T + 0.04, trim, [doorX, doorH + 0.035, zc]))
}

function setupHotel(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F3EEE6')
  setCamera(camera, CAM15.pos, CAM15.at, CAM15.fov)
  lightRig(scene, [-0.2, 0, -0.4])
  const { wallZ: wz, doorX, doorW, doorH } = P15
  const dx0 = doorX - doorW / 2
  const St = new THREE.Group()

  /* the corridor: a wood floor, a carpet runner, a cream wall with a plum wainscot, a chair rail, skirting */
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: planksTex('#C9A47E', '#BE9872', 'rgba(80,50,20,0.25)'), roughness: 0.55 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.25), new THREE.MeshStandardMaterial({ map: carpetTex(), roughness: 0.95 }))
  runner.rotation.x = -Math.PI / 2
  runner.position.set(0, 0.004, 0.2)
  runner.receiveShadow = true
  scene.add(runner)
  const wall = mat('#F4E9D8', { roughness: 0.95, emissive: new THREE.Color('#F4E9D8'), emissiveIntensity: 0.3 })
  const trim = mat('#FFFFFF', { roughness: 0.45 })
  corridorWall(St, wall, trim)
  const wains = mat('#B98FA4', { roughness: 0.7, emissive: new THREE.Color('#B98FA4'), emissiveIntensity: 0.15 })
  for (const [a, b] of [[-4.6, dx0 - 0.07], [doorX + doorW / 2 + 0.07, 4.6]]) {
    St.add(box(b - a, 0.88, 0.02, wains, [(a + b) / 2, 0.46, wz + 0.01]))
    St.add(box(b - a, 0.04, 0.04, trim, [(a + b) / 2, 0.92, wz + 0.02]))
    St.add(box(b - a, 0.1, 0.03, trim, [(a + b) / 2, 0.05, wz + 0.015]))
  }
  /* two wall lights (no shadow: the shade's shadow read as a smudge on the wall) */
  const Lt = new THREE.Group()
  for (const x of [-1.5, 1.75]) {
    Lt.add(box(0.06, 0.16, 0.03, mat(C.brass, { metalness: 0.7, roughness: 0.3 }), [x, 1.78, wz + 0.015]))
    Lt.add(cyl(0.06, 0.09, 0.16, glow('#FFE2B0'), [x, 1.84, wz + 0.09], 24))
  }
  scene.add(noShadow(bake(Lt, false)))
  /* the card holder beside the door: a white wall pocket with a dark slot */
  const H0 = P15.holder
  St.add(box(0.2, 0.22, 0.05, mat('#FFFFFF', { roughness: 0.35 }), [H0.x, H0.y, H0.z], 0.012))
  St.add(box(0.16, 0.012, 0.03, mat('#2A2E3A'), [H0.x, H0.y + 0.111, H0.z]))
  St.add(box(0.12, 0.05, 0.004, mat(C.brand, { roughness: 0.4 }), [H0.x, H0.y - 0.05, H0.z + 0.026], 0.004))

  /* the room behind: a warm floor and walls, a bed, a lamp on a side table, a window with curtains */
  const roomWall = mat('#FCEBD6', { roughness: 0.9, emissive: new THREE.Color('#FCEBD6'), emissiveIntensity: 0.55 })
  const rz0 = wz - P15.wallT
  const rz1 = P15.roomZ
  St.add(box(4.2, 0.02, rz0 - rz1, mat('#D8C3A5', { roughness: 0.9, emissive: new THREE.Color('#D8C3A5'), emissiveIntensity: 0.25 }), [-0.5, 0.01, (rz0 + rz1) / 2]))
  St.add(box(4.2, 2.8, 0.05, roomWall, [-0.5, 1.4, rz1]))
  St.add(box(0.05, 2.8, rz0 - rz1, roomWall, [1.6, 1.4, (rz0 + rz1) / 2]))
  St.add(box(0.05, 2.8, rz0 - rz1, roomWall, [-2.6, 1.4, (rz0 + rz1) / 2]))
  const wood = mat('#8A5A3B', { roughness: 0.55 })
  const bedX0 = -1.75
  const bedX1 = -0.42
  const bx = (bedX0 + bedX1) / 2
  const bw = bedX1 - bedX0
  St.add(box(bw + 0.04, 0.3, 1.95, wood, [bx, 0.15, rz1 + 1.0], 0.02))
  St.add(box(bw, 0.18, 1.9, mat('#FFFFFF', { roughness: 0.7, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.15 }), [bx, 0.39, rz1 + 1.0], 0.04))
  St.add(box(bw + 0.16, 1.1, 0.08, mat('#6E4A78', { roughness: 0.8 }), [bx, 0.75, rz1 + 0.06], 0.03))
  /* the bedside table and lamp, the window */
  St.add(box(0.36, 0.5, 0.34, wood, [-0.12, 0.25, rz1 + 0.25], 0.02))
  St.add(cyl(0.025, 0.05, 0.22, mat(C.brass, { metalness: 0.6, roughness: 0.3 }), [-0.12, 0.61, rz1 + 0.25], 16))
  St.add(cyl(0.1, 0.15, 0.18, glow('#FFE7BE'), [-0.12, 0.8, rz1 + 0.25], 24))
  St.add(box(0.9, 1.0, 0.03, glow('#CFE6FF'), [0.55, 1.45, rz1 + 0.03]))
  St.add(box(0.94, 0.04, 0.05, trim, [0.55, 1.95, rz1 + 0.05]), box(0.04, 1.0, 0.05, trim, [0.55, 1.45, rz1 + 0.05]))
  for (const x of [0.02, 1.08]) St.add(box(0.22, 1.5, 0.05, mat('#C9A0B4', { roughness: 0.95, emissive: new THREE.Color('#C9A0B4'), emissiveIntensity: 0.25 }), [x, 1.3, rz1 + 0.08], 0.02))
  scene.add(bake(St))

  /* the bed linen, which the housekeeper puts right: a duvet, two pillows, a plum bed scarf; rumpled lumps that smooth out */
  const linen = mat('#FFFFFF', { roughness: 0.8, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.12 })
  const duvet = box(bw + 0.04, 0.07, 1.3, linen, [bx, 0.51, rz1 + 1.3], 0.03)
  scene.add(duvet)
  const pillows = [-0.32, 0.32].map((dx) => {
    const p = box(0.5, 0.12, 0.28, linen, [bx + dx * (bw / 1.3), 0.54, rz1 + 0.3], 0.05)
    scene.add(p)
    return p
  })
  const scarf = box(bw + 0.06, 0.075, 0.26, mat('#7A4A86', { roughness: 0.8 }), [bx, 0.515, rz1 + 1.72], 0.02)
  scene.add(scarf)
  const lumps = [
    [bx - 0.3, rz1 + 1.05, 0.26],
    [bx + 0.2, rz1 + 1.45, 0.22],
    [bx + 0.35, rz1 + 0.95, 0.18],
    [bx - 0.15, rz1 + 1.65, 0.2],
  ].map(([x, z, r]) => {
    const l = mesh(new THREE.SphereGeometry(r, 20, 12), linen, [x, 0.53, z])
    l.scale.set(1, 0.28, 0.8)
    scene.add(l)
    return l
  })

  /* the door: a wood leaf hinged on the left, swinging into the room; a brass plaque, a peephole, the lever and the
     card lock with its light */
  const hinge = new THREE.Group()
  hinge.position.set(dx0 + 0.01, 0, wz - 0.06)
  const lw = doorW - 0.02
  const leafM = mat('#7B4B30', { roughness: 0.5 })
  hinge.add(box(lw, doorH - 0.02, 0.05, leafM, [lw / 2, (doorH - 0.02) / 2, 0], 0.01))
  for (const [y, h] of [[0.55, 0.7], [1.45, 0.8]] as [number, number][]) hinge.add(box(lw - 0.22, h, 0.012, mat('#8A5839', { roughness: 0.5 }), [lw / 2, y, 0.028], 0.01))
  const brass = mat(C.brass, { metalness: 0.75, roughness: 0.3 })
  const plaque = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 32), brass, [lw / 2, 1.62, 0.04])
  plaque.rotation.x = Math.PI / 2
  plaque.scale.set(1.3, 1, 0.8)
  hinge.add(plaque)
  hinge.add(cyl(0.012, 0.012, 0.02, mat('#2A2E3A'), [lw / 2, 1.42, 0.035], 12).rotateX(Math.PI / 2))
  const LOCK_LX = lw - 0.1
  hinge.add(box(0.075, 0.17, 0.025, mat('#2E3448', { roughness: 0.35, metalness: 0.4 }), [LOCK_LX, 1.1, 0.035], 0.008))
  hinge.add(box(0.14, 0.022, 0.03, brass, [LOCK_LX - 0.04, 0.98, 0.06], 0.008))
  const ledOff = glow('#3A4560')
  const ledGreen = glow(C.green)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.016, 0.008), ledOff)
  led.position.set(LOCK_LX, 1.165, 0.05)
  hinge.add(led)
  const ledHalo = halo(C.green, 0.06)
  ledHalo.mesh.position.set(LOCK_LX, 1.165, 0.056)
  hinge.add(ledHalo.mesh)
  noShadow(hinge)
  scene.add(hinge)
  const lockWorld = new THREE.Vector3(dx0 + 0.01 + LOCK_LX, 1.1, wz - 0.02)

  /* the room's own card */
  const card = makeCard(keyCardTex(), 0.11, 0.17, C.brand)
  scene.add(card)
  const inHolder = new THREE.Vector3(H0.x, H0.y + 0.1, H0.z)

  /* the cart (housekeeper A's) and the caddy (housekeeper B's) */
  const cart = bake(housekeepingCart())
  cart.position.copy(P15.cart)
  scene.add(cart)
  const caddy = bake(cleaningCaddy())
  caddy.position.copy(P15.caddy)
  scene.add(caddy)

  /* the two housekeepers, the same turn half a loop apart */
  const cfgs = [HOUSEKEEPER_A, HOUSEKEEPER_B]
  const heights = [P15.hA, P15.hB]
  const tapRoot = new THREE.Vector3(P15.tap[0], 0, P15.tap[1])
  const REST: Ang = { s: 8, e: 6 }
  const CARRY: Pt = { x: 236, y: 330 }
  const rigs = cfgs.map((cfg, k) => {
    const sh = buildSkin(cfg).shoulderHalf
    const h = heights[k]
    const HOLD_PT = worldToRig(inHolder.clone().setY(inHolder.y + 0.02), tapRoot, h, camera)
    const LOCK_PT = worldToRig(lockWorld, tapRoot, h, camera)
    const keys = turnKeys(P15.rest[k])
    const aHold = solveR(sh, HOLD_PT, true)
    const aLock = solveR(sh, LOCK_PT, true)
    const aCarry = solveR(sh, CARRY)
    const armKeys: [number, Ang][] = [
      [B15.arrive, REST],
      [B15.take, aHold],
      [1.12, aHold],
      [B15.tap - 0.03, aLock],
      [1.6, aLock],
      [1.9, aCarry],
      [B15.outB + 0.03, aCarry],
      [B15.put - 0.04, aHold],
      [4.0, aHold],
      [4.3, REST],
    ]
    const arm = (u: number) => angAt(u, armKeys)
    const armW = (u: number) => seg(u, B15.arrive - 0.06, B15.arrive) * (1 - seg(u, 4.25, 4.35))
    const holding = (u: number) => u >= B15.take + 0.02 && u < B15.put
    return { sh, h, keys, arm, armW, holding }
  })
  const people = rigs.map((r, k) =>
    castSprite({
      config: cfgs[k],
      dress: withTop(APRON('#F6F3EE', '#C9BCD3')),
      loop: L15,
      frames: F15,
      height: r.h,
      wide: 60,
      shadow: 0.2,
      adaptive: true,
      onReady: redraw,
      timeline: timeline(151 + k, L15, shiftKeys(FACES15, k * TURN, L15)),
      pose: (p: Pose, c: number) => {
        const u = turnU(c, k)
        const q = along(u, r.keys)
        walkPose(p, u, q.walking, q.dir)
        const w = r.armW(u)
        if (w > 0) {
          const a = r.arm(u)
          to(p, 'shoulderR', a.s, w)
          to(p, 'elbowR', a.e, w)
          to(p, 'wristR', -8, w)
          const g = r.holding(u) ? 1 : 0
          to(p, 'fR1', 0.62, g)
          to(p, 'fR2', 0.62, g)
          to(p, 'fR3', 0.62, g)
          to(p, 'fR4', 0.62, g)
          to(p, 'tR', 0.55, g)
        }
        /* at the door: eyes on the holder and the lock */
        const atDoor = hold(u, B15.arrive - 0.1, B15.arrive + 0.1, B15.inA, B15.inA + 0.2) + hold(u, B15.outB - 0.1, B15.outB + 0.05, B15.backA, B15.backA + 0.15)
        to(p, 'headTurn', 0.28, atDoor)
        to(p, 'lookX', 0.7, atDoor)
        to(p, 'lookY', 0.15, atDoor)
        /* making the bed: the free hand smooths the duvet, eyes down at it */
        const wk = hold(u, B15.inB - 0.05, B15.work[0] + 0.05, B15.work[1], B15.outA + 0.05)
        to(p, 'shoulderL', 40 + 14 * Math.sin(u * TAU * 1.7), wk)
        to(p, 'elbowL', 30 + 10 * Math.sin(u * TAU * 1.7 + 0.8), wk)
        to(p, 'palmL', 0.2, wk)
        to(p, 'headTurn', -0.45, wk)
        to(p, 'lookX', -0.85, wk)
        to(p, 'headNod', 0.3, wk)
        to(p, 'lookY', 0.55, wk)
        /* waiting: watching the door */
        const wait = seg(u, B15.backB, B15.backB + 0.3) * (1 - seg(u, L15 - 0.25, L15))
        to(p, 'headTurn', k === 0 ? 0.3 : -0.3, wait)
        to(p, 'lookX', k === 0 ? 0.7 : -0.7, wait)
      },
    }),
  )
  for (const s of people) scene.add(s.object)

  const hand = new THREE.Vector3()
  const root = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L15)
    let open = 0
    let blink = 0
    let neat = 0
    let holder = -1
    people.forEach((s, k) => {
      const u = turnU(c, k)
      const q = along(u, rigs[k].keys)
      s.object.position.set(q.x, bob(q.walking, u), q.z)
      s.update(c, camera)
      open = Math.max(open, doorOpen15(u))
      blink = Math.max(blink, hold(u, B15.tap - 0.04, B15.tap, 1.85, 2.05))
      if (u < 4.2) neat = Math.max(neat, seg(u, B15.work[0], B15.work[1]))
      const uq = turnU(frameTime(c, L15, F15), k)
      if (rigs[k].holding(uq)) holder = k
    })
    hinge.rotation.y = open * 1.75
    led.material = blink > 0.5 ? ledGreen : ledOff
    ledHalo.mat.opacity = blink * 0.9
    /* the bed: lumps and a skewed duvet while rumpled, smooth once made (reset only while the door is shut) */
    const r = 1 - neat
    lumps.forEach((l) => l.scale.set(r, 0.28 * r + 0.001, 0.8 * r))
    duvet.rotation.y = r * 0.12
    duvet.position.x = bx + r * 0.08
    scarf.rotation.y = -r * 0.25
    pillows.forEach((p, i) => {
      p.rotation.z = r * (i ? 0.35 : -0.25)
      p.rotation.y = r * (i ? -0.4 : 0.3)
    })
    /* the card: in its holder, or in the hand of whoever holds it now */
    if (holder >= 0) {
      const k = holder
      const u = turnU(frameTime(c, L15, F15), k)
      const q = along(u, rigs[k].keys)
      root.set(q.x, bob(q.walking, u), q.z)
      rigToWorld(fkR(rigs[k].sh, rigs[k].arm(u)), rigs[k].h, root, camera, hand)
      towardCamera(hand, camera, 0.08)
      card.position.copy(hand)
      card.quaternion.copy(camera.quaternion)
      card.rotateZ(-0.25)
    } else {
      card.position.copy(inHolder)
      card.rotation.set(0, 0, 0)
    }
  }
}

/* ---- the concept: the EC2 instance and its role badge ---- */

/** an app block's face: a window with a title bar and lines (workload A) or a gear (workload B), white on colour */
const appTex = (kind: 'app' | 'gear', base: string) =>
  canvasTex(128, 128, (g) => {
    g.fillStyle = base
    rrect(g, 0, 0, 128, 128, 18)
    g.fill()
    g.fillStyle = '#FFFFFF'
    if (kind === 'app') {
      rrect(g, 22, 26, 84, 76, 10)
      g.fill()
      g.fillStyle = base
      rrect(g, 30, 46, 68, 48, 5)
      g.fill()
      g.fillStyle = '#FFFFFF'
      for (const x of [32, 42, 52]) {
        g.beginPath()
        g.arc(x, 36, 3.5, 0, TAU)
        g.fill()
      }
      for (const [y, w] of [[56, 48], [68, 36], [80, 44]] as [number, number][]) {
        rrect(g, 38, y, w, 6, 3)
        g.fill()
      }
    } else {
      g.save()
      g.translate(64, 64)
      for (let i = 0; i < 8; i++) {
        g.rotate(TAU / 8)
        rrect(g, -9, -42, 18, 18, 4)
        g.fill()
      }
      g.beginPath()
      g.arc(0, 0, 30, 0, TAU)
      g.fill()
      g.fillStyle = base
      g.beginPath()
      g.arc(0, 0, 13, 0, TAU)
      g.fill()
      g.restore()
    }
  })

function setupInstance(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCamera(camera, CAM15.pos, CAM15.at, CAM15.fov)
  lightRig(scene, [-0.2, 0, -0.4])
  const { wallZ: wz, doorX, doorW, doorH } = P15
  const dx0 = doorX - doorW / 2
  const St = new THREE.Group()

  /* the server room: raised-floor tiles, a guide strip (the runner's place), a pale blue panelled wall */
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: tileTex('#E4EAF4', '#C9D3E6', [14, 12]), roughness: 0.45 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.06), glow('#9DB8FF'))
  strip.rotation.x = -Math.PI / 2
  strip.position.set(0, 0.005, 0.85)
  scene.add(strip)
  const wall = mat('#EDF2FB', { roughness: 0.8, emissive: new THREE.Color('#EDF2FB'), emissiveIntensity: 0.5 })
  const trim = mat('#C9D3E6', { roughness: 0.4, metalness: 0.3 })
  corridorWall(St, wall, trim)
  const panelLine = mat('#D3DCEC', { roughness: 0.6 })
  for (const x of [-3.2, -2.2, -1.2, 0.9, 1.9, 2.9]) St.add(box(0.015, 3.4, 0.01, panelLine, [x, 1.7, wz + 0.006]))
  St.add(box(9.2, 0.1, 0.03, mat('#5E6B86', { roughness: 0.4, metalness: 0.4 }), [0, 0.05, wz + 0.015]))
  /* status light strips where the wall lights are */
  for (const x of [-1.5, 1.75]) St.add(box(0.05, 0.3, 0.03, glow('#9DB8FF'), [x, 1.8, wz + 0.015]))
  /* the badge dock beside the cabinet (the card holder's place) */
  const H0 = P15.holder
  St.add(box(0.24, 0.24, 0.05, mat('#5E6B86', { roughness: 0.35, metalness: 0.4 }), [H0.x, H0.y, H0.z], 0.012))
  St.add(box(0.19, 0.012, 0.03, mat('#1F2E63'), [H0.x, H0.y + 0.121, H0.z]))
  /* the conduit from the cabinet's top to the AWS service (S3) on the wall */
  const S3P = new THREE.Vector3(1.12, 2.42, wz + 0.04)
  const cz = wz + 0.035
  const cableM = mat('#8FA3C7', { roughness: 0.4, metalness: 0.4 })
  const c0 = new THREE.Vector3(doorX, doorH + 0.09, cz)
  const c1 = new THREE.Vector3(doorX, S3P.y, cz)
  const c2 = new THREE.Vector3(S3P.x - 0.2, S3P.y, cz)
  St.add(cyl(0.022, 0.022, c1.y - c0.y, cableM, [doorX, (c0.y + c1.y) / 2, cz], 12))
  St.add(cyl(0.022, 0.022, c2.x - c1.x, cableM, [(c1.x + c2.x) / 2, S3P.y, cz], 12).rotateZ(Math.PI / 2))
  St.add(mesh(new THREE.SphereGeometry(0.03, 14, 10), cableM, [c1.x, c1.y, cz]))

  /* inside the instance (the room's place): a dark cabinet, server sleds stacked on the left, the compute board */
  const inner = mat('#1F2E63', { roughness: 0.6, emissive: new THREE.Color('#1F2E63'), emissiveIntensity: 0.35 })
  const rz0 = wz - P15.wallT
  const rz1 = P15.roomZ
  St.add(box(4.2, 0.02, rz0 - rz1, mat('#2C3E7E', { roughness: 0.6, emissive: new THREE.Color('#2C3E7E'), emissiveIntensity: 0.3 }), [-0.5, 0.01, (rz0 + rz1) / 2]))
  St.add(box(4.2, 2.8, 0.05, inner, [-0.5, 1.4, rz1]))
  St.add(box(0.05, 2.8, rz0 - rz1, inner, [1.6, 1.4, (rz0 + rz1) / 2]))
  St.add(box(0.05, 2.8, rz0 - rz1, inner, [-2.6, 1.4, (rz0 + rz1) / 2]))
  const sled = mat('#3A4E92', { roughness: 0.45, metalness: 0.35 })
  for (let i = 0; i < 9; i++) St.add(box(0.9, 0.14, 0.5, sled, [0.55, 0.2 + i * 0.2, rz1 + 0.3], 0.01))
  scene.add(bake(St))
  /* the compute board (the bed's place): a board on a frame; its chips light while a workload runs */
  const bedX0 = -1.75
  const bedX1 = -0.42
  const bx = (bedX0 + bedX1) / 2
  const bw = bedX1 - bedX0
  const Bd = new THREE.Group()
  Bd.add(box(bw + 0.04, 0.3, 1.95, mat('#5E6B86', { roughness: 0.4, metalness: 0.5 }), [bx, 0.15, rz1 + 1.0], 0.02))
  Bd.add(box(bw, 0.05, 1.9, mat('#1E7A55', { roughness: 0.5 }), [bx, 0.33, rz1 + 1.0], 0.01))
  scene.add(bake(Bd))
  const chipOff = mat('#2A2E3A', { roughness: 0.3, metalness: 0.4 })
  const chipOn = new THREE.MeshStandardMaterial({ color: '#9DB8FF', emissive: new THREE.Color(C.brand), emissiveIntensity: 0.9, roughness: 0.3 })
  const chips = [
    [bx - 0.3, rz1 + 1.05, 0.34],
    [bx + 0.22, rz1 + 1.45, 0.26],
    [bx + 0.3, rz1 + 0.75, 0.22],
    [bx - 0.2, rz1 + 1.62, 0.24],
    [bx - 0.25, rz1 + 0.45, 0.22],
  ].map(([x, z, s]) => {
    const m = box(s, 0.05, s, chipOff, [x, 0.38, z], 0.01)
    scene.add(m)
    return m
  })
  const sledLeds = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), glow('#2E4A8A'))
    m.position.set(0.2, 0.2 + i * 0.2, rz1 + 0.56)
    scene.add(m)
    return m
  })
  const sledOn = glow('#3DDC97')
  const sledOff = glow('#2E4A8A')

  /* the cabinet door (the room door's place): navy, perforated panels, the EC2 instance mark where the plaque is,
     the lock with its light */
  const hinge = new THREE.Group()
  hinge.position.set(dx0 + 0.01, 0, wz - 0.06)
  const lw = doorW - 0.02
  hinge.add(box(lw, doorH - 0.02, 0.05, mat('#2C3E7E', { roughness: 0.4, metalness: 0.35 }), [lw / 2, (doorH - 0.02) / 2, 0], 0.01))
  const perf = canvasTex(64, 64, (g) => {
    g.fillStyle = '#25356E'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#16224A'
    for (let y = 4; y < 64; y += 10) for (let x = 4 + ((y / 10) % 2) * 5; x < 64; x += 10) {
      g.beginPath()
      g.arc(x, y, 2.6, 0, TAU)
      g.fill()
    }
  }, [6, 5])
  const perfB = canvasTex(64, 64, (g) => {
    g.fillStyle = '#25356E'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#16224A'
    for (let y = 4; y < 64; y += 10) for (let x = 4 + ((y / 10) % 2) * 5; x < 64; x += 10) {
      g.beginPath()
      g.arc(x, y, 2.6, 0, TAU)
      g.fill()
    }
  }, [6, 6])
  hinge.add(plane(lw - 0.22, 0.7, new THREE.MeshStandardMaterial({ map: perf, roughness: 0.6 }), [lw / 2, 0.55, 0.027]))
  hinge.add(plane(lw - 0.22, 0.8, new THREE.MeshStandardMaterial({ map: perfB, roughness: 0.6 }), [lw / 2, 1.45, 0.027]))
  const markPlate = box(0.24, 0.24, 0.02, mat('#FFFFFF', { roughness: 0.35 }), [lw / 2, 1.62, 0.04], 0.03)
  hinge.add(markPlate)
  hinge.add(plane(0.22, 0.22, flat(markTex(ec2InstanceUrl, redraw, 512, false)), [lw / 2, 1.62, 0.052]))
  const LOCK_LX = lw - 0.1
  hinge.add(box(0.075, 0.17, 0.025, mat('#E2E8F3', { roughness: 0.35, metalness: 0.4 }), [LOCK_LX, 1.1, 0.035], 0.008))
  hinge.add(box(0.14, 0.022, 0.03, mat('#C9D3E6', { metalness: 0.6, roughness: 0.3 }), [LOCK_LX - 0.04, 0.98, 0.06], 0.008))
  const ledOff = glow('#3A4560')
  const ledGreen = glow(C.green)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.016, 0.008), ledOff)
  led.position.set(LOCK_LX, 1.165, 0.05)
  hinge.add(led)
  const ledHalo = halo(C.green, 0.06)
  ledHalo.mesh.position.set(LOCK_LX, 1.165, 0.056)
  hinge.add(ledHalo.mesh)
  noShadow(hinge)
  scene.add(hinge)
  const lockWorld = new THREE.Vector3(dx0 + 0.01 + LOCK_LX, 1.1, wz - 0.02)

  /* the AWS service: S3 on a white tile on the wall, at the conduit's end */
  const s3 = new THREE.Group()
  s3.position.copy(S3P)
  s3.add(box(0.4, 0.4, 0.04, mat('#FFFFFF', { roughness: 0.35 }), [0, 0, 0], 0.05))
  s3.add(plane(0.36, 0.36, flat(markTex(s3Url, redraw, 512, false)), [0, 0, 0.022]))
  noShadow(s3)
  scene.add(s3)
  const s3Halo = halo('#7FA6FF', 0.34)
  s3Halo.mesh.position.set(S3P.x, S3P.y, S3P.z + 0.01)
  scene.add(s3Halo.mesh)

  /* the instance's own role badge: white face with the IAM Role mark, brand edge */
  const badgeTex = canvasTex(110, 170, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 110, 170, 12)
    g.fill()
    g.fillStyle = C.brand
    rrect(g, 0, 0, 110, 34, 12)
    g.fill()
    g.fillRect(0, 20, 110, 14)
    g.fillStyle = '#FFFFFF'
    rrect(g, 40, 12, 30, 8, 4)
    g.fill()
  })
  const badge = makeCard(badgeTex, 0.15, 0.22, '#FFFFFF')
  const roleFace = plane(0.12, 0.12, flat(markTex(roleUrl, redraw, 256, false)), [0, -0.025, 0.0062])
  badge.add(roleFace)
  scene.add(badge)
  const badgeHalo = halo('#7FA6FF', 0.16)
  scene.add(badgeHalo.mesh)
  const inHolder = new THREE.Vector3(H0.x, H0.y + 0.09, H0.z + 0.005)

  /* the two workloads and their pedestals (the cart's and the caddy's places) */
  const pedM = mat('#FFFFFF', { roughness: 0.35 })
  const ringM = glow('#9DB8FF')
  for (const [x, z] of P15.rest) {
    scene.add(cyl(0.16, 0.24, 0.72, pedM, [x, 0.36, z], 40))
    scene.add(cyl(0.22, 0.22, 0.04, pedM, [x, 0.74, z], 40))
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 8, 48), ringM)
    ring.rotation.x = Math.PI / 2
    ring.position.set(x, 0.76, z)
    scene.add(ring)
  }
  const blockS = 0.36
  const blocks = [appTex('app', C.brand), appTex('gear', C.teal)].map((tex, k) => {
    const g = new THREE.Group()
    const body = mesh(new RoundedBoxGeometry(blockS, blockS, blockS, 4, 0.06), new THREE.MeshStandardMaterial({ color: k ? C.teal : C.brand, roughness: 0.3, metalness: 0.1, emissive: new THREE.Color(k ? C.teal : C.brand), emissiveIntensity: 0.15 }))
    body.castShadow = false
    g.add(body)
    g.add(plane(blockS * 0.86, blockS * 0.86, flat(tex), [0, 0, blockS / 2 + 0.002]))
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: 0x0b1530, transparent: true, opacity: 0.16, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    scene.add(sh)
    scene.add(g)
    return { g, body, sh }
  })
  const keys = P15.rest.map((r) => turnKeys(r))
  const BY = 0.98 // block centre height, the hands' height

  /* the call: a dot from the badge (on the running block) up to the lintel, through the wall, along the conduit to S3
     and back */
  const dot = mesh(new THREE.SphereGeometry(0.045, 18, 12), glow('#2D63FB'))
  const dotBack = glow(C.green)
  const dotOut = dot.material as THREE.Material
  noShadow(dot)
  scene.add(dot)
  const inside = new THREE.Vector3(P15.inside[0], BY, P15.inside[1])
  const lintelIn = new THREE.Vector3(P15.inside[0], doorH - 0.12, P15.inside[1])
  const path = [lintelIn, c0, c1, c2]
  const along3 = (k: number, out: THREE.Vector3) => {
    /* k 0..1 over: block → lintel (0.3), hidden in the wall (0.1), conduit up (0.25), across (0.35) */
    const cut = [0.3, 0.4, 0.62, 1]
    if (k < cut[0]) return out.lerpVectors(inside.clone().setY(BY + 0.12), lintelIn, k / cut[0])
    if (k < cut[1]) return out.lerpVectors(lintelIn, c0, (k - cut[0]) / (cut[1] - cut[0]))
    if (k < cut[2]) return out.lerpVectors(c0, c1, (k - cut[1]) / (cut[2] - cut[1]))
    return out.lerpVectors(c1, c2, (k - cut[2]) / (cut[3] - cut[2]))
  }
  void path

  const tmp = new THREE.Vector3()
  const lockTouch = lockWorld.clone().add(new THREE.Vector3(-0.08, 0, 0.24))
  return (t: number) => {
    const c = mod(t, L15)
    let open = 0
    let blink = 0
    let run = 0
    let holderK = -1
    blocks.forEach((b, k) => {
      const u = turnU(c, k)
      const q = along(u, keys[k])
      /* at the lock: the block leans in so its badge touches the lock */
      const touch = hold(u, 1.12, B15.tap - 0.03, B15.tap + 0.05, 1.7)
      const x = mix(q.x, lockTouch.x - 0.06, touch * 0.6)
      const z = mix(q.z, lockTouch.z, touch * 0.6)
      const resting = u > B15.backB || u < 0.02 ? 1 : 0
      const y = BY + 0.03 * Math.sin((c / L15) * TAU * 3 + k * 1.7) + q.walking * 0.02 * Math.sin(u * TAU * 2.2)
      b.g.position.set(x, y, z)
      b.g.rotation.set(0, 0, -q.dir * q.walking * 0.08)
      b.g.rotation.y = resting * 0.12 * Math.sin((c / L15) * TAU * 2 + k)
      const working = hold(u, B15.work[0] - 0.05, B15.work[0] + 0.1, B15.work[1] - 0.1, B15.work[1])
      b.g.scale.setScalar(1 + 0.05 * working * Math.sin(u * TAU * 3))
      ;(b.body.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + 0.35 * working
      b.sh.position.set(x, 0.006, z)
      open = Math.max(open, doorOpen15(u))
      blink = Math.max(blink, hold(u, B15.tap - 0.04, B15.tap, 1.85, 2.05))
      if (u < 4.2) run = Math.max(run, hold(u, B15.work[0] - 0.1, B15.work[0], B15.work[1], B15.work[1] + 0.25))
      if (u >= B15.take && u < B15.put) holderK = k
    })
    hinge.rotation.y = open * 1.75
    led.material = blink > 0.5 ? ledGreen : ledOff
    ledHalo.mat.opacity = blink * 0.9
    chips.forEach((m) => (m.material = run > 0.5 ? chipOn : chipOff))
    sledLeds.forEach((m, i) => (m.material = run > 0.5 && ((c * 5 + i * 0.37) % 1) < 0.6 ? sledOn : sledOff))
    /* the badge: in its dock, flying to the block, riding on the block's face, flying back */
    if (holderK >= 0) {
      const k = holderK
      const u = turnU(c, k)
      const front = blocks[k].g.position.clone().add(new THREE.Vector3(-0.08, 0.06, blockS / 2 + 0.03))
      const go = seg(u, B15.arrive, B15.take + 0.07)
      const back = seg(u, B15.outB + 0.03, B15.put)
      if (u < 1.2) tmp.lerpVectors(inHolder, front, go)
      else if (u < B15.outB + 0.03) tmp.copy(front)
      else tmp.lerpVectors(front, inHolder, back)
      const arc = u < 1.2 ? Math.sin(go * Math.PI) : u >= B15.outB + 0.03 ? Math.sin(back * Math.PI) : 0
      tmp.y += arc * 0.18
      badge.position.copy(tmp)
      badge.rotation.set(0, 0, 0)
      badgeHalo.mesh.position.copy(tmp).add(new THREE.Vector3(0, 0, -0.01))
      badgeHalo.mat.opacity = 0.55
    } else {
      badge.position.copy(inHolder)
      badge.rotation.set(0, 0, 0)
      badgeHalo.mat.opacity = 0
    }
    /* the call: out (blue) and back (green), while a block runs */
    let ride = -1
    let backward = false
    blocks.forEach((_, k) => {
      const u = turnU(c, k)
      if (u >= B15.work[0] && u < B15.work[1]) {
        const m = (B15.work[0] + B15.work[1]) / 2
        backward = u >= m
        ride = backward ? 1 - (u - m) / (B15.work[1] - m) : (u - B15.work[0]) / (m - B15.work[0])
      }
    })
    dot.visible = ride >= 0 && !(ride > 0.3 && ride < 0.4)
    if (ride >= 0) {
      along3(ride, dot.position)
      if (ride > 0.4) dot.position.z = c0.z + 0.03
      dot.material = backward ? dotBack : dotOut
    }
    /* S3 answers when the call arrives */
    let hit = 0
    blocks.forEach((_, k) => {
      const u = turnU(c, k)
      const m = (B15.work[0] + B15.work[1]) / 2
      hit = Math.max(hit, hold(u, m - 0.08, m, m + 0.05, m + 0.3))
    })
    s3.scale.setScalar(1 + 0.08 * hit)
    s3Halo.mat.opacity = hit * 0.7
  }
}

/* ================================================================== T19 · the shift card */

const L19 = 9
const HOLD19 = 1.45
const F19 = 108
const SHIFT_END = 6.05 // the clock's hand leaves the shift band; the card's light goes out
const P19 = {
  wallZ: -0.6,
  bayA: -1.04,
  bayB: 1.04,
  bayW: 1.12,
  gateH: 1.95,
  readerA: new THREE.Vector3(-0.3, 1.12, -0.6 + 0.035),
  readerB: new THREE.Vector3(1.78, 1.12, -0.6 + 0.035),
  clock: new THREE.Vector3(0.0, 2.24, -0.6 + 0.035),
  clockR: 0.25,
  rest: [0.3, 0.36] as [number, number],
  tapA: [-0.76, -0.1] as [number, number],
  tapB: [1.32, -0.1] as [number, number],
  h: 1.72,
}
const CAM19 = { pos: [0.1, 1.95, 5.9] as [number, number, number], at: [0.05, 1.08, -0.5] as [number, number, number], fov: 34 }
const T19 = {
  tapA1: 0.9,
  openA: [1.0, 1.5],
  closeA: [2.3, 2.7],
  tapB: 3.95,
  tapA2: 6.7,
}
const KEYS19: Key[] = [
  [0, P19.rest[0], P19.rest[1]],
  [0.6, P19.tapA[0], P19.tapA[1]],
  [2.55, P19.tapA[0], P19.tapA[1]],
  [3.65, P19.tapB[0], P19.tapB[1]],
  [4.9, P19.tapB[0], P19.tapB[1]],
  [5.95, P19.tapA[0], P19.tapA[1]],
  [7.55, P19.tapA[0], P19.tapA[1]],
  [8.3, P19.rest[0], P19.rest[1]],
]
/** the card's (token's) light: on through the shift, out after it, back on as the next shift starts */
const valid19 = (c: number) => (c < SHIFT_END ? 1 : c < SHIFT_END + 0.25 ? 1 - seg(c, SHIFT_END, SHIFT_END + 0.25) : seg(c, 8.88, 9.0))
const gateA19 = (c: number) => seg(c, T19.openA[0], T19.openA[1]) * (1 - seg(c, T19.closeA[0], T19.closeA[1]))
/** a reader's verdict: green after the tap at A in the shift, orange after the tap at B, orange after the late tap at A */
const verdict19 = (c: number) => ({
  aGreen: hold(c, T19.tapA1 - 0.03, T19.tapA1, 2.2, 2.4),
  aDeny: hold(c, T19.tapA2 - 0.03, T19.tapA2, 7.3, 7.5),
  bDeny: hold(c, T19.tapB - 0.03, T19.tapB, 4.55, 4.75),
})
/** a shut gate rattles once when it refuses */
const rattle19 = (c: number, t: number) => hold(c, t, t + 0.05, t + 0.3, t + 0.4) * Math.sin((c - t) * TAU * 9)
const FACES19: [number, string][] = [
  [0, 'happy'],
  [0.55, 'thinking'],
  [1.05, 'happy'],
  [2.6, 'neutral'],
  [3.7, 'thinking'],
  [4.0, 'confused'],
  [5.0, 'neutral'],
  [6.05, 'worried'],
  [6.75, 'sad'],
  [7.7, 'worried'],
  [8.85, 'happy'],
]

/** the shift clock face: white, a tick ring, the shift band in green from twelve to the shift's end (no digits) */
function clockTex(face: string, tick: string, band: string) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = face
    g.beginPath()
    g.arc(128, 128, 126, 0, TAU)
    g.fill()
    g.strokeStyle = band
    g.lineWidth = 20
    g.lineCap = 'butt'
    g.beginPath()
    g.arc(128, 128, 100, -Math.PI / 2, -Math.PI / 2 + TAU * (SHIFT_END / L19))
    g.stroke()
    g.strokeStyle = tick
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU
      const big = i % 5 === 0
      g.lineWidth = big ? 5 : 2
      g.beginPath()
      g.moveTo(128 + Math.cos(a) * (big ? 74 : 82), 128 + Math.sin(a) * (big ? 74 : 82))
      g.lineTo(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88)
      g.stroke()
    }
  })
}
/** the clock or the token timer: a round body on the wall, the face, one hand that turns once a loop */
function makeClock(body: string, face: THREE.Texture, handC: string) {
  const g = new THREE.Group()
  const cyl_ = mesh(new THREE.CylinderGeometry(P19.clockR, P19.clockR, 0.06, 48), mat(body, { roughness: 0.35, metalness: 0.4 }))
  cyl_.rotation.x = Math.PI / 2
  g.add(cyl_)
  g.add(plane(P19.clockR * 1.84, P19.clockR * 1.84, new THREE.MeshBasicMaterial({ map: face, toneMapped: false, transparent: true }), [0, 0, 0.031]))
  const hand = new THREE.Group()
  hand.position.z = 0.036
  const hg = new THREE.PlaneGeometry(0.018, P19.clockR * 0.78)
  hg.translate(0, P19.clockR * 0.33, 0)
  hand.add(new THREE.Mesh(hg, glow(handC)))
  hand.add(new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), glow(handC)))
  g.add(hand)
  noShadow(g)
  return { g, hand }
}

/** the back wall with two gated openings, the same frame for both cards */
function gatedWall(St: THREE.Group, wall: THREE.Material, trim: THREE.Material) {
  const wz = P19.wallZ
  const T = 0.12
  const zc = wz - T / 2
  const xs = [-4.6, P19.bayA - P19.bayW / 2, P19.bayA + P19.bayW / 2, P19.bayB - P19.bayW / 2, P19.bayB + P19.bayW / 2, 4.6]
  St.add(box(xs[1] - xs[0], 3.4, T, wall, [(xs[0] + xs[1]) / 2, 1.7, zc]))
  St.add(box(xs[3] - xs[2], 3.4, T, wall, [(xs[2] + xs[3]) / 2, 1.7, zc]))
  St.add(box(xs[5] - xs[4], 3.4, T, wall, [(xs[4] + xs[5]) / 2, 1.7, zc]))
  for (const bx of [P19.bayA, P19.bayB]) {
    St.add(box(P19.bayW, 3.4 - P19.gateH, T, wall, [bx, (P19.gateH + 3.4) / 2, zc]))
    St.add(box(0.07, P19.gateH + 0.07, T + 0.05, trim, [bx - P19.bayW / 2 - 0.035, (P19.gateH + 0.07) / 2, zc]))
    St.add(box(0.07, P19.gateH + 0.07, T + 0.05, trim, [bx + P19.bayW / 2 + 0.035, (P19.gateH + 0.07) / 2, zc]))
  }
}

/** the area behind each opening: floor, walls, shelves; `stock` fills the shelves */
function bayRoom(St: THREE.Group, bx: number, wallM: THREE.Material, floorM: THREE.Material, shelfM: THREE.Material, stock: (x: number, y: number, z: number, i: number) => void) {
  const z0 = P19.wallZ - 0.12
  const z1 = -2.2
  St.add(box(P19.bayW + 0.4, 0.02, z0 - z1, floorM, [bx, 0.01, (z0 + z1) / 2]))
  St.add(box(P19.bayW + 0.4, 2.6, 0.05, wallM, [bx, 1.3, z1]))
  St.add(box(0.05, 2.6, z0 - z1, wallM, [bx - P19.bayW / 2 - 0.2, 1.3, (z0 + z1) / 2]))
  St.add(box(0.05, 2.6, z0 - z1, wallM, [bx + P19.bayW / 2 + 0.2, 1.3, (z0 + z1) / 2]))
  const sz = z1 + 0.3
  for (const y of [0.35, 0.85, 1.35]) St.add(box(P19.bayW + 0.2, 0.04, 0.45, shelfM, [bx, y, sz]))
  for (const x of [-1, 1]) St.add(box(0.05, 1.6, 0.45, shelfM, [bx + x * (P19.bayW / 2 + 0.08), 0.8, sz]))
  let i = 0
  for (const y of [0.37, 0.87, 1.37]) for (let x = bx - P19.bayW / 2 + 0.12; x < bx + P19.bayW / 2 - 0.05; x += 0.27) stock(x, y, sz, i++)
}

/** a roller shutter in an opening: slats hanging from a header box, rolled up by `scale.y` (anchored at the top) */
function makeShutter(bx: number, tex: THREE.Texture) {
  const g = new THREE.Group()
  g.position.set(bx, P19.gateH, P19.wallZ - 0.07)
  const geo = new THREE.PlaneGeometry(P19.bayW, P19.gateH)
  geo.translate(0, -P19.gateH / 2, 0)
  const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }))
  g.add(s)
  const bar = mesh(new THREE.BoxGeometry(P19.bayW, 0.05, 0.04), mat('#5E6B86', { metalness: 0.5, roughness: 0.4 }), [0, -P19.gateH + 0.025, 0.01])
  g.add(bar)
  const handle = mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), mat('#2A2E3A'), [0, -P19.gateH + 0.12, 0.03])
  g.add(handle)
  noShadow(g)
  return {
    g,
    set(open: number, shake: number) {
      const k = Math.max(0.02, 1 - open)
      s.scale.y = k
      bar.position.y = -P19.gateH * k + 0.025
      handle.position.y = -P19.gateH * k + 0.12
      g.position.x = bx + shake * 0.012
    },
  }
}

/** a reader on the wall beside an opening: a dark body, a light panel that shows the verdict */
function makeReader(pos: THREE.Vector3, body: string, idle: string) {
  const g = new THREE.Group()
  g.position.copy(pos)
  g.add(box(0.13, 0.2, 0.05, mat(body, { roughness: 0.35, metalness: 0.4 }), [0, 0, 0], 0.012))
  g.add(box(0.08, 0.06, 0.006, mat('#141B2E', { roughness: 0.2 }), [0, -0.035, 0.027], 0.006))
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.008), glow(idle))
  lamp.position.set(0, 0.06, 0.028)
  g.add(lamp)
  const h = halo(C.green, 0.12)
  h.mesh.position.set(0, 0.06, 0.04)
  g.add(h.mesh)
  noShadow(g)
  const mats = { idle: glow(idle), green: glow(C.green), deny: glow(C.accent) }
  return {
    g,
    set(green: number, deny: number) {
      lamp.material = green > 0.5 ? mats.green : deny > 0.5 ? mats.deny : mats.idle
      h.mat.color.set(green >= deny ? C.green : C.accent)
      h.mat.opacity = Math.max(green, deny) * 0.9
    },
  }
}

/** the temporary card: white, a blue band (the colour of area A), a light that is on while the shift lasts */
function makeShiftCard() {
  const tex = canvasTex(170, 110, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 170, 110, 12)
    g.fill()
    g.fillStyle = C.brand
    rrect(g, 0, 0, 170, 30, 12)
    g.fill()
    g.fillRect(0, 16, 170, 14)
    /* a photo square and lines */
    g.fillStyle = '#DCE6F7'
    rrect(g, 14, 42, 44, 52, 6)
    g.fill()
    g.fillStyle = '#26365E'
    g.beginPath()
    g.arc(36, 60, 9, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(36, 92, 16, 14, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = '#C9D3E6'
    for (const [y, w] of [[50, 70], [66, 54], [82, 62]] as [number, number][]) {
      rrect(g, 70, y, w, 8, 4)
      g.fill()
    }
  })
  const card = makeCard(tex, 0.17, 0.11, C.brand)
  const ledOn = glow(C.green)
  const ledOff = glow('#6B7488')
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), ledOn)
  led.position.set(0.062, 0.036, 0.0075)
  card.add(led)
  const h = halo(C.green, 0.06)
  h.mesh.position.set(0.062, 0.036, 0.009)
  card.add(h.mesh)
  return {
    card,
    set(v: number) {
      led.material = v > 0.5 ? ledOn : ledOff
      h.mat.opacity = v * 0.95
    },
  }
}

function setupDepot(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF0F3')
  setCamera(camera, CAM19.pos, CAM19.at, CAM19.fov)
  lightRig(scene, [0, 0, -0.4])
  const wz = P19.wallZ
  const St = new THREE.Group()
  /* polished concrete, a yellow walkway line, a corrugated grey wall with a yellow-black base band */
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: tileTex('#D9DCE1', '#C9CDD4', [7, 6]), roughness: 0.5 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const line = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.07), glow('#F2C14E'))
  line.rotation.x = -Math.PI / 2
  line.position.set(0, 0.005, 0.85)
  scene.add(line)
  const ribs = canvasTex(64, 64, (g) => {
    g.fillStyle = '#DDE2EA'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#CBD2DD'
    g.fillRect(0, 0, 10, 64)
    g.fillStyle = '#EEF1F6'
    g.fillRect(12, 0, 6, 64)
  }, [24, 1])
  const wall = new THREE.MeshStandardMaterial({ map: ribs, roughness: 0.7, emissive: new THREE.Color('#DDE2EA'), emissiveIntensity: 0.25 })
  gatedWall(St, wall, mat('#F2C14E', { roughness: 0.5 }))
  const hazard = canvasTex(64, 16, (g) => {
    g.fillStyle = '#F2C14E'
    g.fillRect(0, 0, 64, 16)
    g.fillStyle = '#2A2E3A'
    for (let x = -16; x < 64; x += 16) {
      g.beginPath()
      g.moveTo(x, 16)
      g.lineTo(x + 8, 16)
      g.lineTo(x + 16, 0)
      g.lineTo(x + 8, 0)
      g.closePath()
      g.fill()
    }
  }, [30, 1])
  const xs = [-4.6, P19.bayA - P19.bayW / 2 - 0.07, P19.bayA + P19.bayW / 2 + 0.07, P19.bayB - P19.bayW / 2 - 0.07, P19.bayB + P19.bayW / 2 + 0.07, 4.6]
  for (let i = 0; i < 6; i += 2) St.add(plane(xs[i + 1] - xs[i], 0.14, new THREE.MeshStandardMaterial({ map: hazard, roughness: 0.6 }), [(xs[i] + xs[i + 1]) / 2, 0.07, wz + 0.003]))
  /* the band over each opening: blue (area A, the card's colour), purple (area B) */
  for (const [bx, col] of [[P19.bayA, C.brand], [P19.bayB, C.purple]] as [number, string][]) St.add(box(P19.bayW + 0.14, 0.16, 0.04, mat(col, { roughness: 0.45, emissive: new THREE.Color(col), emissiveIntensity: 0.25 }), [bx, P19.gateH + 0.18, wz + 0.02], 0.02))
  /* the delivery areas behind: racks of parcels */
  const bayWall = mat('#F1F3F7', { roughness: 0.9, emissive: new THREE.Color('#F1F3F7'), emissiveIntensity: 0.45 })
  const bayFloor = mat('#C9CDD4', { roughness: 0.7, emissive: new THREE.Color('#C9CDD4'), emissiveIntensity: 0.2 })
  const shelfM = mat('#2F6FDB', { roughness: 0.45, metalness: 0.3 })
  const cardboard = [mat('#C99B62', { roughness: 0.8 }), mat('#B88650', { roughness: 0.8 }), mat('#D8AE78', { roughness: 0.8 })]
  for (const bx of [P19.bayA, P19.bayB])
    bayRoom(St, bx, bayWall, bayFloor, shelfM, (x, y, z, i) => {
      const w = 0.18 + (i % 3) * 0.03
      const h = 0.18 + ((i * 7) % 3) * 0.05
      St.add(box(w, h, 0.3, cardboard[i % 3], [x + 0.02, y + h / 2 + 0.02, z], 0.01))
    })
  scene.add(bake(St))
  /* parcels on a pallet inside A, by the opening: today's deliveries for this area */
  const Pl = new THREE.Group()
  Pl.add(box(0.7, 0.1, 0.5, mat('#B88650', { roughness: 0.8 }), [P19.bayA - 0.15, 0.05, -1.25]))
  for (const [x, y, s] of [[-0.3, 0.22, 0.24], [-0.02, 0.2, 0.2], [-0.18, 0.44, 0.2]] as [number, number, number][]) Pl.add(box(s + 0.04, s, s, cardboard[1], [P19.bayA + x, y, -1.25], 0.01))
  scene.add(bake(Pl))

  /* the shutters, the readers, the shift clock */
  const slats = slatsTex('#C9D2DE', '#9FAAB9')
  const shutA = makeShutter(P19.bayA, slats)
  const shutB = makeShutter(P19.bayB, slats)
  scene.add(shutA.g, shutB.g)
  for (const bx of [P19.bayA, P19.bayB]) scene.add(box(P19.bayW + 0.12, 0.14, 0.16, mat('#8D98AA', { metalness: 0.5, roughness: 0.4 }), [bx, P19.gateH + 0.0, wz - 0.02], 0.02))
  const rdA = makeReader(P19.readerA, '#2E3448', '#4C6FBF')
  const rdB = makeReader(P19.readerB, '#2E3448', '#4C6FBF')
  scene.add(rdA.g, rdB.g)
  const clock = makeClock('#2E3448', clockTex('#FFFFFF', '#41506E', '#22C55E'), '#1F2E63')
  clock.g.position.copy(P19.clock)
  scene.add(clock.g)

  /* the delivery worker: a parcel in one arm, the temporary card in the other hand */
  const card = makeShiftCard()
  scene.add(card.card)
  const parcel = box(0.3, 0.22, 0.24, cardboard[2], [0, 0, 0], 0.012)
  parcel.add(box(0.302, 0.04, 0.242, mat('#9A6A3A', { roughness: 0.6 }), [0, 0.02, 0]))
  noShadow(parcel)
  scene.add(parcel)
  const sh = buildSkin(COURIER).shoulderHalf
  const CARRY: Pt = { x: 240, y: 340 }
  const LOOK: Pt = { x: 250, y: 298 }
  const PALM: Pt = { x: 266, y: 330 }
  const PARCEL: Pt = { x: 176, y: 330 }
  const rootA = new THREE.Vector3(P19.tapA[0], 0, P19.tapA[1])
  const rootB = new THREE.Vector3(P19.tapB[0], 0, P19.tapB[1])
  const RD_A = worldToRig(P19.readerA, rootA, P19.h, camera)
  const RD_B = worldToRig(P19.readerB, rootB, P19.h, camera)
  const aCarry = solveR(sh, CARRY)
  const aA = solveR(sh, RD_A, true)
  const aB = solveR(sh, RD_B, true)
  const aLook = solveR(sh, LOOK)
  const aPalm = solveR(sh, PALM)
  /* the card hand: carried, out to reader A, to reader B (then palm up), raised to look at, out to reader A again */
  const armKeys: [number, Ang][] = [
    [T19.tapA1 - 0.3, aCarry],
    [T19.tapA1 - 0.02, aA],
    [T19.tapA1 + 0.08, aA],
    [T19.tapA1 + 0.38, aCarry],
    [T19.tapB - 0.3, aCarry],
    [T19.tapB - 0.02, aB],
    [T19.tapB + 0.08, aB],
    [T19.tapB + 0.4, aPalm],
    [4.45, aPalm],
    [4.75, aCarry],
    [5.95, aCarry],
    [6.15, aLook],
    [6.3, aLook],
    [T19.tapA2 - 0.02, aA],
    [T19.tapA2 + 0.08, aA],
    [T19.tapA2 + 0.38, aCarry],
  ]
  const arm = (c: number) => angAt(c, armKeys)
  const courier = castSprite({
    config: COURIER,
    dress: (k: Skin) => ({ ...k, hairFront: <>{k.hairFront}{DELIVERY_CAP}</>, top: <>{k.top}{VEST}</> }),
    loop: L19,
    frames: F19,
    height: P19.h,
    wide: 60,
    shadow: 0.2,
    adaptive: true,
    onReady: redraw,
    timeline: timeline(191, L19, FACES19),
    pose: (p: Pose, c: number) => {
      const q = along(c, KEYS19)
      walkPose(p, c, q.walking, q.dir, false)
      to(p, 'kneeL', p.kneeL, 1)
      const a = arm(c)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.wristR = -8
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = 0.6
      p.tR = 0.5
      const palm = hold(c, T19.tapB + 0.3, T19.tapB + 0.5, 4.4, 4.7)
      to(p, 'palmR', 1, palm)
      to(p, 'fR1', 0.1, palm)
      to(p, 'fR2', 0.1, palm)
      to(p, 'fR3', 0.1, palm)
      to(p, 'fR4', 0.1, palm)
      const b = solveL(sh, PARCEL)
      p.shoulderL = b.s
      p.elbowL = b.e
      p.wristL = -20
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = 0.5
      /* at a reader: eyes on it; at the open shutter: a look in and a nod */
      const atA = hold(c, 0.5, 0.65, 2.45, 2.6) + hold(c, 5.85, 6.0, 7.45, 7.6)
      const atB = hold(c, 3.55, 3.7, 4.8, 4.95)
      to(p, 'headTurn', 0.22, atA + atB)
      to(p, 'lookX', 0.6, atA + atB)
      const lookIn = hold(c, 1.3, 1.5, 2.1, 2.3)
      to(p, 'headTurn', -0.3, lookIn)
      to(p, 'lookX', -0.7, lookIn)
      to(p, 'headNod', 0.12 + 0.08 * Math.sin((c - 1.3) * TAU * 1.2), lookIn)
      /* at B: a puzzled tilt */
      const puzzled = hold(c, T19.tapB + 0.1, T19.tapB + 0.35, 4.6, 4.85)
      to(p, 'headTilt', 7, puzzled)
      /* the light goes out: eyes down at the card */
      const glance = hold(c, 5.95, 6.15, 6.3, 6.45)
      to(p, 'headNod', 0.3, glance)
      to(p, 'lookY', 0.7, glance)
      to(p, 'headTurn', 0.15, glance)
      /* refused at A: the shoulders drop, a small step back in the body */
      const sag = hold(c, T19.tapA2 + 0.15, T19.tapA2 + 0.4, 7.3, 7.6)
      p.bodyY += sag * 3
      to(p, 'headNod', 0.18, sag)
    },
  })
  scene.add(courier.object)

  const hand = new THREE.Vector3()
  const root = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L19)
    const q = along(c, KEYS19)
    courier.object.position.set(q.x, bob(q.walking, c), q.z)
    courier.update(c, camera)
    const v = verdict19(c)
    rdA.set(v.aGreen, v.aDeny)
    rdB.set(0, v.bDeny)
    shutA.set(gateA19(c), rattle19(c, T19.tapA2))
    shutB.set(0, rattle19(c, T19.tapB))
    clock.hand.rotation.z = -(c / L19) * TAU
    card.set(valid19(c))
    /* the card and the parcel follow the hands that are drawn */
    const cf = frameTime(c, L19, F19)
    const qf = along(cf, KEYS19)
    root.set(qf.x, bob(qf.walking, cf), qf.z)
    rigToWorld(fkR(sh, arm(cf)), P19.h, root, camera, hand)
    towardCamera(hand, camera, 0.1)
    card.card.position.copy(hand)
    card.card.quaternion.copy(camera.quaternion)
    card.card.rotateZ(0.2)
    rigToWorld(reachL(sh, PARCEL), P19.h, root, camera, hand)
    towardCamera(hand, camera, 0.16)
    parcel.position.copy(hand).add(new THREE.Vector3(0.06, 0.04, 0))
    parcel.quaternion.copy(camera.quaternion)
    parcel.rotateZ(-0.08)
  }
}

/* ---- the concept: an AI agent with a scoped, short-lived token ---- */

type Robot = { root: THREE.Group; armR: THREE.Group; armL: THREE.Group; head: THREE.Group; eyes: THREE.Mesh[]; antenna: THREE.Mesh; shoulderR: THREE.Vector3; shoulderL: THREE.Vector3; armLen: number }
/** the AI agent: a glossy white robot on a hover base, a visor with two eyes, an antenna, two arms */
function makeRobot(): Robot {
  const root = new THREE.Group()
  const shell = mat('#FFFFFF', { roughness: 0.25, metalness: 0.05 })
  const dark = mat('#1F2E63', { roughness: 0.3, metalness: 0.2 })
  const accent = mat(C.brand, { roughness: 0.35, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.3 })
  root.add(cyl(0.2, 0.24, 0.07, dark, [0, 0.2, 0], 36))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 40), glow('#7FA6FF'))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.165
  root.add(ring)
  root.add(cyl(0.12, 0.2, 0.18, shell, [0, 0.32, 0], 32))
  root.add(box(0.5, 0.56, 0.36, shell, [0, 0.68, 0], 0.12))
  root.add(box(0.26, 0.16, 0.02, accent, [0, 0.74, 0.18], 0.03))
  root.add(cyl(0.06, 0.07, 0.08, dark, [0, 0.99, 0], 20))
  const head = new THREE.Group()
  head.position.set(0, 1.18, 0)
  head.add(box(0.46, 0.34, 0.36, shell, [0, 0, 0], 0.12))
  head.add(box(0.38, 0.2, 0.02, dark, [0, -0.01, 0.175], 0.08))
  const eyes = [-0.08, 0.08].map((x) => {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), glow('#7FD8FF'))
    e.position.set(x, 0, 0.188)
    head.add(e)
    return e
  })
  head.add(cyl(0.01, 0.01, 0.12, dark, [0.12, 0.22, 0], 8))
  const antenna = mesh(new THREE.SphereGeometry(0.03, 16, 12), glow(C.green), [0.12, 0.29, 0])
  head.add(antenna)
  for (const x of [-0.24, 0.24]) head.add(cyl(0.05, 0.05, 0.04, accent, [x, 0, 0], 20).rotateZ(Math.PI / 2))
  root.add(head)
  const armLen = 0.5
  const arm = (x: number) => {
    const g = new THREE.Group()
    g.position.set(x, 0.88, 0)
    g.add(mesh(new THREE.SphereGeometry(0.065, 16, 12), shell))
    g.add(mesh(new THREE.CapsuleGeometry(0.05, armLen - 0.1, 6, 12), shell, [0, -armLen / 2, 0]))
    g.add(mesh(new THREE.SphereGeometry(0.055, 16, 12), dark, [0, -armLen, 0]))
    root.add(g)
    return g
  }
  const armR = arm(0.31)
  const armL = arm(-0.31)
  noShadow(head)
  return { root, armR, armL, head, eyes, antenna, shoulderR: new THREE.Vector3(0.31, 0.88, 0), shoulderL: new THREE.Vector3(-0.31, 0.88, 0), armLen }
}
/** point an arm (hanging along -y) at a world point; returns where its hand ends */
function aimArm(arm: THREE.Group, root: THREE.Group, target: THREE.Vector3, len: number, out: THREE.Vector3) {
  root.updateMatrixWorld(true)
  const sw = arm.getWorldPosition(new THREE.Vector3())
  const dir = target.clone().sub(sw)
  const d = dir.length()
  dir.normalize()
  const local = dir.clone().applyQuaternion(root.quaternion.clone().invert())
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), local)
  out.copy(sw).addScaledVector(dir, Math.min(d, len))
  return out
}

function setupAgent(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCamera(camera, CAM19.pos, CAM19.at, CAM19.fov)
  lightRig(scene, [0, 0, -0.4])
  const wz = P19.wallZ
  const St = new THREE.Group()
  const floor = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: tileTex('#E4EAF4', '#C9D3E6', [14, 12]), roughness: 0.45 }), [0, -0.05, 2])
  floor.castShadow = false
  scene.add(floor)
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.06), glow('#9DB8FF'))
  strip.rotation.x = -Math.PI / 2
  strip.position.set(0, 0.005, 0.85)
  scene.add(strip)
  const wall = mat('#E9EFF9', { roughness: 0.8, emissive: new THREE.Color('#E9EFF9'), emissiveIntensity: 0.3 })
  gatedWall(St, wall, mat('#9DB8FF', { roughness: 0.4, emissive: new THREE.Color('#9DB8FF'), emissiveIntensity: 0.5 }))
  St.add(box(9.2, 0.1, 0.03, mat('#5E6B86', { roughness: 0.4, metalness: 0.4 }), [0, 0.05, wz + 0.015]))
  for (const [bx, col] of [[P19.bayA, C.brand], [P19.bayB, C.purple]] as [number, string][]) St.add(box(P19.bayW + 0.14, 0.16, 0.04, mat(col, { roughness: 0.45, emissive: new THREE.Color(col), emissiveIntensity: 0.25 }), [bx, P19.gateH + 0.18, wz + 0.02], 0.02))
  /* behind A: the API's data (green S3-coloured objects on racks); behind B: the other API's functions (orange) */
  const bayWall = mat('#1F2E63', { roughness: 0.6, emissive: new THREE.Color('#1F2E63'), emissiveIntensity: 0.35 })
  const bayFloor = mat('#2C3E7E', { roughness: 0.6, emissive: new THREE.Color('#2C3E7E'), emissiveIntensity: 0.3 })
  const shelfM = mat('#3A4E92', { roughness: 0.45, metalness: 0.35 })
  const objM = [mat('#7AA116', { roughness: 0.4 }), mat('#8DB52A', { roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 })]
  const fnM = [mat('#ED7100', { roughness: 0.4 }), mat('#F59A3D', { roughness: 0.4 }), mat('#FFFFFF', { roughness: 0.4 })]
  bayRoom(St, P19.bayA, bayWall, bayFloor, shelfM, (x, y, z, i) => St.add(box(0.18, 0.18, 0.18, objM[i % 3], [x + 0.04, y + 0.11, z], 0.03)))
  bayRoom(St, P19.bayB, bayWall, bayFloor, shelfM, (x, y, z, i) => St.add(box(0.18, 0.18, 0.18, fnM[i % 3], [x + 0.04, y + 0.11, z], 0.03)))
  scene.add(bake(St))
  /* the S3 bucket mark on a stand inside A (the pallet's place), the marks over each door */
  const tileS3 = new THREE.Group()
  tileS3.position.set(P19.bayA - 0.15, 0.42, -1.25)
  tileS3.add(box(0.36, 0.36, 0.04, mat('#FFFFFF', { roughness: 0.35 }), [0, 0, 0], 0.05))
  tileS3.add(plane(0.32, 0.32, flat(markTex(s3BucketUrl, redraw, 512, false)), [0, 0, 0.022]))
  tileS3.add(box(0.06, 0.24, 0.06, mat('#5E6B86'), [0, -0.3, -0.02]))
  scene.add(tileS3)
  for (const [bx, url] of [[P19.bayA, s3Url], [P19.bayB, lambdaUrl]] as [number, string][]) {
    const g = new THREE.Group()
    g.position.set(bx + P19.bayW / 2 - 0.2, P19.gateH + 0.48, wz + 0.04)
    g.add(box(0.3, 0.3, 0.04, mat('#FFFFFF', { roughness: 0.35 }), [0, 0, 0], 0.04))
    g.add(plane(0.26, 0.26, flat(markTex(url, redraw, 512, false)), [0, 0, 0.022]))
    noShadow(g)
    scene.add(g)
  }

  /* the API doors: light panels sliding up into the wall */
  const panelTex = canvasTex(128, 224, (g) => {
    g.fillStyle = '#DCE6F7'
    g.fillRect(0, 0, 128, 224)
    g.strokeStyle = '#B9C8E4'
    g.lineWidth = 3
    for (let y = 28; y < 224; y += 56) {
      g.beginPath()
      g.moveTo(10, y)
      g.lineTo(118, y)
      g.stroke()
    }
    g.fillStyle = '#9DB8FF'
    rrect(g, 54, 96, 20, 20, 4)
    g.fill()
  })
  const doors = [P19.bayA, P19.bayB].map((bx) => {
    const d = new THREE.Mesh(new RoundedBoxGeometry(P19.bayW, P19.gateH, 0.04, 3, 0.02), new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.35, metalness: 0.2 }))
    d.position.set(bx, P19.gateH / 2, wz - 0.07)
    noShadow(d)
    scene.add(d)
    return { d, bx }
  })
  /* the token sockets (the readers' places), the token timer (the clock's place) */
  const skA = makeReader(P19.readerA, '#E2E8F3', '#7FA6FF')
  const skB = makeReader(P19.readerB, '#E2E8F3', '#7FA6FF')
  scene.add(skA.g, skB.g)
  const timer = makeClock('#1F2E63', clockTex('#16224A', '#7FA6FF', '#22C55E'), '#FFFFFF')
  timer.g.position.copy(P19.clock)
  scene.add(timer.g)

  /* the agent: the token in one hand, its task cube in the other */
  const bot = makeRobot()
  noShadow(bot.root.children[1] as THREE.Object3D)
  scene.add(bot.root)
  const tokenTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(64, 64, 34, 0, TAU)
    g.fill()
    g.fillStyle = C.brand
    g.beginPath()
    g.arc(64, 56, 10, 0, TAU)
    g.fill()
    g.fillRect(59, 62, 10, 30)
    g.fillRect(64, 76, 12, 6)
    g.fillRect(64, 86, 9, 6)
  })
  const token = new THREE.Group()
  const tokOn = new THREE.MeshStandardMaterial({ color: '#4B7BFF', emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 })
  const tokOff = new THREE.MeshStandardMaterial({ color: '#8A93A6', emissive: new THREE.Color('#000000'), emissiveIntensity: 0, roughness: 0.5, metalness: 0.2 })
  const hex = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 6), tokOn)
  hex.rotation.x = Math.PI / 2
  hex.rotation.y = Math.PI / 6
  token.add(hex)
  const tokFace = plane(0.12, 0.12, flat(tokenTex), [0, 0, 0.017])
  token.add(tokFace)
  const tokHalo = halo('#7FA6FF', 0.2)
  tokHalo.mesh.position.z = -0.01
  token.add(tokHalo.mesh)
  const tokRing = new THREE.Mesh(new THREE.RingGeometry(0.105, 0.122, 6, 1), glow(C.green))
  tokRing.rotation.z = Math.PI / 6
  tokRing.position.z = 0.016
  token.add(tokRing)
  noShadow(token)
  scene.add(token)
  const taskTex = canvasTex(96, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 96, 96, 14)
    g.fill()
    for (const [i, y] of [[0, 26], [1, 48], [2, 70]] as [number, number][]) {
      g.fillStyle = i < 2 ? C.green : '#C9D3E6'
      rrect(g, 16, y - 6, 12, 12, 3)
      g.fill()
      g.fillStyle = '#C9D3E6'
      rrect(g, 36, y - 4, 44, 8, 4)
      g.fill()
    }
  })
  const task = new THREE.Group()
  task.add(mesh(new RoundedBoxGeometry(0.22, 0.22, 0.22, 3, 0.04), mat(C.purple, { roughness: 0.35, emissive: new THREE.Color(C.purple), emissiveIntensity: 0.2 })))
  task.add(plane(0.18, 0.18, flat(taskTex), [0, 0, 0.112]))
  noShadow(task)
  scene.add(task)

  const hand = new THREE.Vector3()
  const target = new THREE.Vector3()
  const rest = new THREE.Vector3()
  const eyeN = new THREE.Color('#7FD8FF')
  return (t: number) => {
    const c = mod(t, L19)
    const q = along(c, KEYS19)
    const hover = 0.025 * Math.sin((c / L19) * TAU * 4)
    bot.root.position.set(q.x, hover, q.z)
    bot.root.rotation.z = -q.dir * q.walking * 0.08
    bot.root.rotation.y = 0.12 * q.dir * q.walking
    /* the right arm: down holding the token, out to a socket at each tap, the token raised to look at as it dims */
    bot.root.updateMatrixWorld(true)
    const sR = bot.armR.getWorldPosition(new THREE.Vector3())
    rest.copy(sR).add(new THREE.Vector3(0.12, -0.32, 0.26))
    const look = sR.clone().add(new THREE.Vector3(-0.05, 0.02, 0.36))
    const tap = (t0: number) => hold(c, t0 - 0.3, t0 - 0.02, t0 + 0.1, t0 + 0.4)
    const wA1 = tap(T19.tapA1)
    const wB = tap(T19.tapB)
    const wA2 = tap(T19.tapA2)
    const wLook = hold(c, 5.95, 6.15, 6.3, T19.tapA2 - 0.3)
    const sock = (r: THREE.Vector3) => r.clone().add(new THREE.Vector3(0, 0, 0.05))
    target.copy(rest)
    target.lerp(look, wLook)
    target.lerp(sock(P19.readerA), Math.max(wA1, wA2))
    target.lerp(sock(P19.readerB), wB)
    aimArm(bot.armR, bot.root, target, bot.armLen, hand)
    token.position.copy(hand).add(new THREE.Vector3(0, 0, 0.05))
    token.quaternion.copy(camera.quaternion)
    token.rotateZ(0.15 * Math.sin((c / L19) * TAU * 3))
    /* the token's light: on through its lifetime, dim after */
    const v = valid19(c)
    hex.material = v > 0.5 ? tokOn : tokOff
    tokFace.visible = true
    ;(tokFace.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.45 * v
    tokHalo.mat.opacity = v * (0.55 + 0.15 * Math.sin((c / L19) * TAU * 6))
    tokRing.visible = v > 0.05
    ;(tokRing.material as THREE.MeshBasicMaterial).opacity = v
    ;(tokRing.material as THREE.MeshBasicMaterial).transparent = true
    /* the left arm: the task cube held in front */
    const lt = bot.armL.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.1, -0.3, 0.3))
    aimArm(bot.armL, bot.root, lt, bot.armLen, hand)
    task.position.copy(hand).add(new THREE.Vector3(0.05, 0.05, 0.1))
    task.rotation.set(0.15, -0.2 + 0.1 * Math.sin((c / L19) * TAU * 2), 0)
    /* the doors, sockets, timer */
    const vd = verdict19(c)
    skA.set(vd.aGreen, vd.aDeny)
    skB.set(0, vd.bDeny)
    const oA = gateA19(c)
    doors[0].d.position.set(P19.bayA + rattle19(c, T19.tapA2) * 0.012, P19.gateH / 2 + oA * (P19.gateH - 0.06), wz - 0.07)
    doors[1].d.position.set(P19.bayB + rattle19(c, T19.tapB) * 0.012, P19.gateH / 2, wz - 0.07)
    timer.hand.rotation.z = -(c / L19) * TAU
    /* the agent's face: happy eyes when the door opens, a tilt when refused, dim and drooping when the token dies */
    const happy = hold(c, 1.0, 1.15, 2.2, 2.5) + hold(c, 8.85, 8.95, 9.0, 9.1) + hold(c, -0.1, 0, 0.35, 0.55)
    const puzzled = hold(c, T19.tapB + 0.1, T19.tapB + 0.35, 4.6, 4.85)
    const sad = hold(c, 6.0, 6.3, 7.7, 8.4)
    const blink = hold(mod(c, 3), 2.0, 2.05, 2.1, 2.15)
    bot.eyes.forEach((e, i) => {
      e.scale.set(1, Math.max(0.12, 1 - 0.6 * happy - 0.9 * blink - 0.35 * sad), 1)
      e.rotation.z = sad * (i ? -0.5 : 0.5)
      e.position.y = 0.02 * happy - 0.015 * sad
      ;(e.material as THREE.MeshBasicMaterial).color.copy(eyeN).multiplyScalar(1 - 0.3 * sad)
    })
    bot.head.rotation.z = 0.2 * puzzled
    bot.head.rotation.x = 0.18 * sad
    bot.head.rotation.y = -0.25 * hold(c, 1.3, 1.5, 2.1, 2.3)
    ;(bot.antenna.material as THREE.MeshBasicMaterial).color.set(vd.aDeny > 0.5 || vd.bDeny > 0.5 ? C.accent : C.green)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (setup: (k: StageKit) => Update, holdT: number) =>
  (({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )) as (p: Record<string, unknown>) => ReactNode

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T15Everyday: card(setupHotel, devT(HOLD15)),
  J_T15Concept: card(setupInstance, devT(HOLD15)),
  J_T19Everyday: card(setupDepot, devT(HOLD19)),
  J_T19Concept: card(setupAgent, devT(HOLD19)),
}
export const css = ''
