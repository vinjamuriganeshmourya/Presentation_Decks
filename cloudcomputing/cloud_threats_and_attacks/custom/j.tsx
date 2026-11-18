import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { slideClock, ClockCard } from './clock'

/**
 * BUILDER J · SESSION 16 (Cloud Threats & Attacks), SLIDES 42 (T22-AN) AND 45 (T24-AN).
 *
 * TR 22: "A receptionist accidentally gives one visitor another visitor's confidential file because the files were not
 * properly separated. This is like sensitive information disclosure when an AI system exposes private data to the
 * wrong user."
 * TR 24: "Like a tap left running on a per-litre water bill: just as unmetered AI requests keep draining paid compute
 * until the bill itself becomes the damage."
 *
 * Built to standing corrections 13-16 and the low-end rules: real-time 3D on the engine's `@/engine/three-stage`,
 * people are Character Lab characters through `castSprite` (role clothing by `dress`, `adaptive` frames), no text on
 * any card (no digits either: meters are needles and tick marks), one wall-clock loop per slide that ends where it
 * starts (restart under 0.3 s), held frames (`?still`, thumbnails) draw the key moment.
 *
 * T22, one 7 s loop, the two cards on one ground plan, position for position:
 *
 *   place               everyday (a reception desk)                  concept (an AI assistant)
 *   back wall           a filing cabinet                             a server rack
 *   counter             the reception counter                        the assistant's plinth
 *   behind it           the receptionist (lanyard)                   the assistant (a glowing model orb)
 *   on top              two trays butted together, no divider:       two context stacks butted together: teal cards
 *                       teal folders (visitor A), purple (visitor B);  (user A), purple (user B); A's top card has
 *                       A's top folder has slid onto B's stack         slid onto B's stack
 *   left, in front      visitor A, teal polo                         user A at his laptop, teal
 *   right, in front     visitor B, purple kurta                      user B at her laptop, purple
 *   the mistake         she takes the top folder from B's side and   B asks; the orb picks the top card from B's side
 *                       hands it to B                                and drops it into B's answer on her screen
 *   the reveal          B opens it: A's ID page, a red stamp;        A's ID card on B's screen; B shocked,
 *                       B shocked, A worried                         A worried
 *   back                B hands it back, it goes back on the stack   the card flies back to the stack
 *
 * T24, one 6 s loop:
 *
 *   place               everyday (a kitchen)                         concept (a GPU server)
 *   wall pipe, left     the water meter, needle turning              the billing meter, needle turning
 *   the outlet          the tap, left running                        the API nozzle, requests pouring out
 *   below it            the sink filling with ripples                the GPU server swallowing requests, fans racing
 *   counter, right      the bill on its stand, rows adding up, the   the cloud bill on its stand, the same
 *                       total bar growing; the page lifts away and
 *                       the next one starts
 *   right, in front     the homeowner, worried, then shocked         the account owner, worried, then shocked
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
  brand: '#2D63FB',
  navy: '#1F2E63',
  ink: '#22304F',
  orange: '#FF8A3D',
  red: '#E5484D',
  teal: '#14B8A6',
  tealDark: '#0E8C7E',
  purple: '#7C5CE0',
  purpleDark: '#5B3FC0',
  white: '#FFFFFF',
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
const DEG = Math.PI / 180

/* ------------------------------------------------------------------ textures */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}
function floorTex(a: string, b: string, line: string) {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = a
    g.fillRect(0, 0, 256, 256)
    g.fillStyle = b
    g.fillRect(0, 0, 128, 128)
    g.fillRect(128, 128, 128, 128)
    g.fillStyle = line
    g.fillRect(0, 0, 256, 2)
    g.fillRect(0, 128, 256, 2)
    g.fillRect(0, 0, 2, 256)
    g.fillRect(128, 0, 2, 256)
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(8, 8)
  return t
}

/** a person's private ID page: a photo of visitor A (teal), bars of private detail, a red "confidential" stamp (a lock) */
function idPageTex(tone: string) {
  return canvasTex(480, 600, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 480, 600, 26)
    g.fill()
    g.fillStyle = tone
    rrect(g, 0, 0, 480, 92, 26)
    g.fill()
    g.fillRect(0, 60, 480, 32)
    /* the photo: head and shoulders in A's teal */
    g.fillStyle = '#E8F7F5'
    rrect(g, 40, 130, 170, 200, 18)
    g.fill()
    g.fillStyle = tone
    g.beginPath()
    g.arc(125, 205, 44, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.ellipse(125, 330, 74, 66, 0, Math.PI, 0)
    g.fill()
    /* private detail as bars */
    g.fillStyle = '#C9D3E6'
    for (const [y, w] of [[150, 200], [196, 160], [242, 190], [288, 130]] as [number, number][]) {
      rrect(g, 240, y, w, 20, 10)
      g.fill()
    }
    for (const [y, w] of [[380, 390], [424, 330], [468, 360]] as [number, number][]) {
      rrect(g, 40, y, w, 18, 9)
      g.fill()
    }
    /* the red confidential stamp: a ring with a padlock in it */
    g.save()
    g.translate(370, 520)
    g.rotate(-0.18)
    g.strokeStyle = '#E5484D'
    g.lineWidth = 10
    g.beginPath()
    g.arc(0, 0, 54, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = '#E5484D'
    rrect(g, -24, -6, 48, 38, 7)
    g.fill()
    g.lineWidth = 9
    g.beginPath()
    g.arc(0, -8, 15, Math.PI, 0)
    g.stroke()
    g.restore()
  })
}

/** a folder cover in a visitor's colour, with a tab and a label strip (no words) */
function folderTex(tone: string, dark: string) {
  return canvasTex(480, 600, (g) => {
    g.fillStyle = tone
    rrect(g, 0, 0, 480, 600, 22)
    g.fill()
    g.fillStyle = dark
    g.fillRect(0, 0, 480, 18)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    rrect(g, 120, 250, 240, 70, 14)
    g.fill()
    g.fillStyle = 'rgba(0,0,0,0.12)'
    rrect(g, 150, 278, 180, 14, 7)
    g.fill()
  })
}

/** a laptop chat screen, 320 x 200: the user's question bar; with `card`, the answer bubble carries A's ID card */
function chatTex(tone: string, card: string | null) {
  return canvasTex(320, 200, (g) => {
    g.fillStyle = '#F5F8FF'
    g.fillRect(0, 0, 320, 200)
    g.fillStyle = '#E3EAF8'
    g.fillRect(0, 0, 320, 22)
    for (const [x, c] of [[12, '#F2766E'], [26, '#F5C451'], [40, '#5BC48A']] as [number, string][]) {
      g.fillStyle = c
      g.beginPath()
      g.arc(x, 11, 4.5, 0, Math.PI * 2)
      g.fill()
    }
    /* the user's own message, right */
    g.fillStyle = tone
    rrect(g, 172, 32, 136, 30, 12)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.75)'
    rrect(g, 184, 43, 96, 8, 4)
    g.fill()
    /* the assistant's answer, left */
    if (card) {
      g.fillStyle = '#FFFFFF'
      rrect(g, 12, 72, 196, 116, 14)
      g.fill()
      g.strokeStyle = '#D5DEEF'
      g.lineWidth = 2
      rrect(g, 12, 72, 196, 116, 14)
      g.stroke()
      g.fillStyle = card
      rrect(g, 24, 84, 172, 92, 10)
      g.fill()
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.arc(58, 120, 16, 0, Math.PI * 2)
      g.fill()
      g.beginPath()
      g.ellipse(58, 166, 26, 22, 0, Math.PI, 0)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.8)'
      for (const [y, w] of [[104, 90], [122, 70], [140, 84]] as [number, number][]) {
        rrect(g, 92, y, w, 9, 4.5)
        g.fill()
      }
    } else {
      g.fillStyle = '#E3EAF8'
      rrect(g, 12, 72, 120, 26, 12)
      g.fill()
    }
  })
}

/** a meter face: white dial, tick ring, a brand arc (no digits) */
function dialTex(ring: string) {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(256, 256, 250, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = ring
    g.lineWidth = 18
    g.beginPath()
    g.arc(256, 256, 214, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = '#41506E'
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      const big = i % 5 === 0
      g.lineWidth = big ? 8 : 4
      g.beginPath()
      g.moveTo(256 + Math.cos(a) * (big ? 160 : 176), 256 + Math.sin(a) * (big ? 160 : 176))
      g.lineTo(256 + Math.cos(a) * 196, 256 + Math.sin(a) * 196)
      g.stroke()
    }
    g.fillStyle = '#E8EEF8'
    g.beginPath()
    g.arc(256, 256, 60, 0, Math.PI * 2)
    g.fill()
  })
}

/** the bill paper: a header band with a glyph (water drop or cloud), blank lines; rows and the total are meshes on it */
function billTex(kind: 'water' | 'cloud') {
  return canvasTex(400, 560, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 400, 560, 18)
    g.fill()
    g.fillStyle = '#EEF3FF'
    rrect(g, 0, 0, 400, 96, 18)
    g.fill()
    g.fillRect(0, 60, 400, 36)
    g.fillStyle = C.brand
    if (kind === 'water') {
      g.beginPath()
      g.moveTo(60, 20)
      g.bezierCurveTo(82, 46, 92, 58, 92, 70)
      g.arc(60, 70, 32, 0, Math.PI)
      g.bezierCurveTo(28, 58, 38, 46, 60, 20)
      g.fill()
    } else {
      g.beginPath()
      g.arc(48, 62, 18, Math.PI * 0.5, Math.PI * 1.5)
      g.arc(70, 42, 24, Math.PI, Math.PI * 1.9)
      g.arc(94, 58, 16, Math.PI * 1.4, Math.PI * 0.5)
      g.closePath()
      g.fill()
    }
    g.fillStyle = '#C9D3E6'
    rrect(g, 128, 34, 200, 18, 9)
    g.fill()
    rrect(g, 128, 62, 140, 14, 7)
    g.fill()
    /* the total line's frame at the foot */
    g.strokeStyle = '#DCE3F0'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(24, 448)
    g.lineTo(376, 448)
    g.stroke()
  })
}

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** static parts merged into one mesh per material (few draw calls) */
function bake(g: THREE.Group): THREE.Group {
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
    mm.castShadow = true
    mm.receiveShadow = true
    out.add(mm)
  }
  return out
}

const flat = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
const glow = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity })

/** back wall and left wall, floor */
function room(scene: THREE.Object3D, floor: THREE.Material, wall: string, backZ = -1.35) {
  const wm = mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.32 })
  const f = mesh(new THREE.BoxGeometry(14, 0.1, 12), floor, [0, -0.05, 2])
  f.castShadow = false
  scene.add(f)
  const back = mesh(new THREE.BoxGeometry(9, 3.4, 0.12), wm, [0, 1.7, backZ])
  back.castShadow = false
  scene.add(back)
  const left = mesh(new THREE.BoxGeometry(0.12, 3.4, 5), wm, [-2.6, 1.7, backZ + 2.45])
  left.castShadow = false
  scene.add(left)
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

/* T22 everyday */
const RECEPTIONIST = who(CAST_PRESETS.ananya, {
  name: 'Receptionist',
  gender: 'female',
  skinTone: 'wheatish',
  hair: { style: 'bun', color: 'black' },
  outfit: { top: 'blouse', topColor: '#2F4BA8', bottom: 'trousers', bottomColor: '#2A3150', shoeColor: '#2A2A30' },
  accessories: { earrings: true },
  build: { height: 1, shoulders: 1 },
})
const VISITOR_A = who(CAST_PRESETS.kabir, {
  name: 'Visitor A',
  gender: 'male',
  skinTone: 'medium',
  hair: { style: 'short', color: 'black' },
  outfit: { top: 'polo', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' },
  accessories: { beard: 'stubble', watch: true },
  build: { height: 1.04, shoulders: 1.04 },
})
const VISITOR_B = who(CAST_PRESETS.meera, {
  name: 'Visitor B',
  gender: 'female',
  skinTone: 'fair',
  hair: { style: 'ponytail', color: 'brown' },
  outfit: { top: 'kurta', topColor: '#7C5CE0', bottom: 'salwar', bottomColor: '#EDE6F7', shoeColor: '#5A3A2A' },
  accessories: { earrings: true, bindi: true },
  build: { height: 0.98, shoulders: 1 },
})
/* T22 concept: the two users, each at a laptop */
const USER_A = who(CAST_PRESETS.dev, {
  name: 'User A',
  gender: 'male',
  skinTone: 'dusky',
  hair: { style: 'quiff', color: 'black' },
  outfit: { top: 'hoodie', topColor: '#14B8A6', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' },
  accessories: { glasses: 'rect' },
  build: { height: 1.02, shoulders: 1.02 },
})
const USER_B = who(CAST_PRESETS.riya, {
  name: 'User B',
  gender: 'female',
  skinTone: 'wheatish',
  hair: { style: 'bob', color: 'black' },
  outfit: { top: 'shirt', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' },
  accessories: { earrings: true },
  build: { height: 0.98, shoulders: 1 },
})
/* T24: the homeowner and the account owner */
const HOMEOWNER = who(CAST_PRESETS.meera, {
  name: 'Homeowner',
  gender: 'female',
  skinTone: 'medium',
  hair: { style: 'long', color: 'black' },
  outfit: { top: 'kurta', topColor: '#E86A92', bottom: 'salwar', bottomColor: '#F4E3EA', shoeColor: '#6B4A3A' },
  accessories: { earrings: true, bindi: true, necklace: true },
  build: { height: 1, shoulders: 1 },
})
const OWNER = who(CAST_PRESETS.rohan, {
  name: 'Account Owner',
  gender: 'male',
  skinTone: 'wheatish',
  hair: { style: 'sidePart', color: 'grey' },
  outfit: { top: 'shirt', topColor: '#DDE6F7', bottom: 'trousers', bottomColor: '#34405E', shoeColor: '#2A2A30' },
  accessories: { glasses: 'round', watch: true, beard: 'short' },
  build: { height: 1.02, shoulders: 1.04 },
})

/** the receptionist's lanyard and ID card (body frame 400 x 600), drawn in the rig's own frames so it moves with her */
const LANYARD = (
  <g data-part="lanyard">
    <path d="M 178 196 L 196 300 M 222 196 L 204 300" stroke="#FF8A3D" strokeWidth={5} fill="none" strokeLinecap="round" />
    <rect x={182} y={298} width={36} height={46} rx={6} fill="#FFFFFF" stroke="#C9D3E6" strokeWidth={2.5} />
    <circle cx={200} cy={314} r={7} fill="#2F4BA8" />
    <rect x={190} y={327} width={20} height={4} rx={2} fill="#C9D3E6" />
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
/* T22's people only (T24 has its own timeline): no idle breathing, so a still pose is one shared frame and the frames
   that move are built far sooner (they play from the start) */
const timeline = (seed: number, L: number, keys: [number, string][]) => (t: number): Timeline => ({ seed, idle: { ...CAST_IDLE, saccades: false, sway: false, breath: false }, life: 0, ...faceAt(t, keys, L) })

/* ---- arms, solved in the rig's frame (Arm.tsx: the right arm is the left one mirrored about x 200) ---- */

const SHOULDER_Y = 205
const UPPER = 95
const FORE = 85 + 14 // to the middle of the grip
type Pt = { x: number; y: number }

/** two-link IK for the LEFT arm (the viewer's left): shoulder and elbow angles that put the grip at `p` */
function solveL(sh: number, p: Pt): { s: number; e: number } {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const D = Math.max(20, Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5))
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D))))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
}
/** the RIGHT arm (the viewer's right): the left arm's answer for the mirrored point */
const solveR = (sh: number, p: Pt) => solveL(sh, { x: 400 - p.x, y: p.y })
/** where a grip at `p` lands when the arm can reach no further (so a prop never floats off the hand) */
function reachL(sh: number, p: Pt): Pt {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const d = Math.hypot(dx, dy)
  const R = UPPER + FORE - 1
  return d <= R ? p : { x: px + (dx / d) * R, y: SHOULDER_Y + (dy / d) * R }
}
const reachR = (sh: number, p: Pt): Pt => {
  const q = reachL(sh, { x: 400 - p.x, y: p.y })
  return { x: 400 - q.x, y: q.y }
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
const lerpPt = (a: Pt, b: Pt, k: number): Pt => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k) })
/** a sprite's frame time for loop time c (the frame on screen), so a prop follows the hand that is drawn */
const frameTime = (c: number, L: number, F: number) => (Math.floor((c / L) * F) % F) * (L / F)
/** a person drawn over the furniture beside them (their plane would otherwise cut into a desk they stand at) */
function drawOver(o: THREE.Object3D, order = 5) {
  o.traverse((n) => {
    const m = (n as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (m && m.map !== undefined && m.alphaTest > 0) {
      m.depthTest = false
      n.renderOrder = order
    }
  })
}
function setCamera(camera: THREE.PerspectiveCamera, pos: [number, number, number], at: [number, number, number], fov = 40) {
  camera.fov = fov
  camera.position.set(...pos)
  camera.lookAt(...at)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

/* ================================================================== T22 · the wrong file */

const L22 = 7
const HOLD22 = 4.15
const F22 = 84
const T22 = {
  reachA: 0.45, // the receptionist reaches for the top folder
  reachB: 1.15,
  liftB: 1.5, // picked up, lifted
  outA: 1.55, // held out toward B
  outB: 2.35,
  give: 2.45, // B has it
  chestB: 3.0, // B holds it at her chest
  openA: 2.95,
  openB: 3.35,
  closeA: 4.5,
  closeB: 4.85,
  backA: 4.7, // B holds it out again
  backB: 5.2,
  take: 5.25, // the receptionist has it
  stackA: 5.3, // back onto the stack
  stackB: 6.1,
  restB: 6.75,
}

/* the moments the folder changes holder (stack -> clerk -> B -> clerk -> stack) */
const HANDOFFS22 = [T22.reachB + 0.05, T22.give, T22.take, T22.stackB]

/* one ground plan for both cards (metres) */
const P22 = {
  counter: { x0: -0.95, x1: 0.78, z: 0, d: 0.6, h: 0.95 },
  clerk: new THREE.Vector3(0.0, 0, -0.62),
  a: new THREE.Vector3(-0.98, 0, 0.66),
  b: new THREE.Vector3(0.92, 0, 0.7),
  hClerk: 1.62,
  hA: 1.7,
  hB: 1.6,
  /* the two stacks, butted together; A's top item has slid across onto B's side */
  trayA: new THREE.Vector3(0.02, 0.95, -0.12),
  trayB: new THREE.Vector3(0.3, 0.95, -0.12),
  /* where A's slid item lies: straddling the join, on B's side */
  slid: new THREE.Vector3(0.22, 0.95 + 0.075, -0.1),
  /* where the receptionist holds it out and B takes it */
  meet: new THREE.Vector3(0.52, 1.13, 0.18),
}
const CAM22 = { pos: [0.02, 1.72, 4.45] as [number, number, number], at: [0.0, 0.98, 0.0] as [number, number, number] }

/** the folder: a back board with A's ID page on it, and a cover that opens on its left edge */
type Folder = { group: THREE.Group; cover: THREE.Group }
function makeFolder(): Folder {
  const group = new THREE.Group()
  const Wf = 0.22
  const Hf = 0.28
  const back = new THREE.Mesh(new THREE.PlaneGeometry(Wf, Hf), new THREE.MeshBasicMaterial({ color: C.tealDark, toneMapped: false, side: THREE.DoubleSide }))
  group.add(back)
  const page = new THREE.Mesh(new THREE.PlaneGeometry(Wf * 0.9, Hf * 0.9), flat(idPageTex(C.teal)))
  page.position.z = 0.002
  group.add(page)
  const cover = new THREE.Group()
  cover.position.set(-Wf / 2, 0, 0.004)
  const front = new THREE.Mesh(new THREE.PlaneGeometry(Wf, Hf), flat(folderTex(C.teal, C.tealDark)))
  front.position.x = Wf / 2
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(Wf, Hf), new THREE.MeshBasicMaterial({ color: '#BFEDE6', toneMapped: false }))
  inner.position.x = Wf / 2
  inner.rotation.y = Math.PI
  inner.position.z = -0.0005
  cover.add(front, inner)
  group.add(cover)
  return { group, cover }
}

function setupReception(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#F2F4F8')
  setCamera(camera, CAM22.pos, CAM22.at)
  lightRig(scene, [0, 0, 0])
  const St = new THREE.Group()
  room(St, mat('#ffffff', { map: floorTex('#E7E3DC', '#DCD6CB', 'rgba(110,95,70,0.16)'), roughness: 0.75 }), '#EEF1F7')

  /* the filing cabinet on the back wall (the files have a home; the mix-up is on the counter) */
  const steel = mat('#C7D0DE', { roughness: 0.45, metalness: 0.35 })
  const steelDark = mat('#95A2B8', { roughness: 0.4, metalness: 0.4 })
  for (const x of [-1.55, -1.0]) {
    St.add(box(0.5, 1.32, 0.5, steel, [x, 0.66, -1.05], 0.02))
    for (let i = 0; i < 4; i++) {
      St.add(box(0.44, 0.27, 0.02, mat('#D7DEEA', { roughness: 0.4, metalness: 0.3 }), [x, 0.2 + i * 0.31, -0.795], 0.008))
      St.add(box(0.14, 0.025, 0.03, steelDark, [x, 0.27 + i * 0.31, -0.78], 0.008))
    }
  }

  /* the reception counter: white body, a blue stripe, a light top; open at the back where she stands */
  const K = P22.counter
  const cx = (K.x0 + K.x1) / 2
  const white = mat('#FFFFFF', { roughness: 0.4 })
  St.add(box(K.x1 - K.x0, K.h - 0.05, K.d, white, [cx, (K.h - 0.05) / 2, K.z], 0.02))
  St.add(box(K.x1 - K.x0 + 0.06, 0.05, K.d + 0.06, mat('#E5D3B3', { roughness: 0.5 }), [cx, K.h - 0.025, K.z], 0.015))
  St.add(box(K.x1 - K.x0 - 0.12, 0.05, 0.01, mat(C.brand, { roughness: 0.4, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 }), [cx, K.h - 0.22, K.z + K.d / 2 + 0.006]))

  /* the two trays, butted together: no divider between them */
  const trayM = mat('#5E6B86', { roughness: 0.4, metalness: 0.5 })
  const TW = 0.27
  const TD = 0.21
  for (const T of [P22.trayA, P22.trayB]) {
    St.add(box(TW, 0.012, TD, trayM, [T.x, T.y + 0.006, T.z]))
    St.add(box(TW, 0.07, 0.01, trayM, [T.x, T.y + 0.035, T.z - TD / 2]))
    St.add(box(TW, 0.04, 0.01, trayM, [T.x, T.y + 0.02, T.z + TD / 2]))
  }
  St.add(box(0.01, 0.07, TD, trayM, [P22.trayA.x - TW / 2, P22.trayA.y + 0.035, P22.trayA.z]))
  St.add(box(0.01, 0.07, TD, trayM, [P22.trayB.x + TW / 2, P22.trayB.y + 0.035, P22.trayB.z]))
  /* the stacks: teal folders (A), purple folders (B) */
  const tealM = mat(C.teal, { roughness: 0.55 })
  const purpleM = mat(C.purple, { roughness: 0.55 })
  for (let i = 0; i < 4; i++) {
    St.add(box(0.22, 0.012, 0.17, tealM, [P22.trayA.x + (i % 2 ? 0.006 : -0.004), P22.trayA.y + 0.02 + i * 0.014, P22.trayA.z + (i % 2 ? 0.004 : -0.003)], 0.003))
    St.add(box(0.22, 0.012, 0.17, purpleM, [P22.trayB.x + (i % 2 ? -0.005 : 0.004), P22.trayB.y + 0.02 + i * 0.014, P22.trayB.z + (i % 2 ? -0.004 : 0.003)], 0.003))
  }
  /* a desk bell and a pen cup at her left: a working reception */
  St.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), mat('#2F4BA8', { roughness: 0.5 }), [-0.62, K.h + 0.06, -0.08]))
  for (const [dx, c] of [[-0.015, C.orange], [0.012, C.brand], [0.0, '#22A06B']] as [number, string][]) St.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.17, 8), mat(c), [-0.62 + dx, K.h + 0.14, -0.08 + dx * 0.5]))
  scene.add(bake(St))

  /* A's folder that slid across: the one she picks up */
  const folder = makeFolder()
  scene.add(folder.group)

  /* the people */
  const shK = buildSkin(RECEPTIONIST).shoulderHalf
  const shB = buildSkin(VISITOR_B).shoulderHalf
  const REST_R: Pt = { x: 252, y: 392 }
  const REST_B: Pt = { x: 150, y: 392 }
  const GRIP_CHEST: Pt = { x: 212, y: 286 }
  const SLID = worldToRig(P22.slid.clone().setY(P22.slid.y + 0.01), P22.clerk, P22.hClerk, camera)
  const MEET_K = worldToRig(P22.meet, P22.clerk, P22.hClerk, camera)
  const MEET_B = worldToRig(P22.meet, P22.b, P22.hB, camera)
  /* her right hand (the viewer's right): rest → the slid folder → held out to B → rest; and the same back */
  const gripK = (c: number): Pt => {
    if (c < T22.reachB) return lerpPt(REST_R, SLID, seg(c, T22.reachA, T22.reachB))
    if (c < T22.liftB) return { x: SLID.x, y: SLID.y - seg(c, T22.reachB, T22.liftB) * 26 }
    const lifted = { x: SLID.x, y: SLID.y - 26 }
    if (c < T22.give) return lerpPt(lifted, MEET_K, seg(c, T22.outA, T22.outB))
    if (c < T22.backA) return lerpPt(MEET_K, REST_R, seg(c, T22.give, T22.give + 0.7))
    if (c < T22.take) return lerpPt(REST_R, MEET_K, seg(c, T22.backA - 0.1, T22.backB))
    if (c < T22.stackB) return lerpPt(MEET_K, SLID, seg(c, T22.stackA, T22.stackB))
    return lerpPt(SLID, REST_R, seg(c, T22.stackB + 0.05, T22.restB))
  }
  /* B's left hand (the viewer's left): rest → meet → chest → meet → rest */
  const gripB = (c: number): Pt => {
    if (c < T22.give) return lerpPt(REST_B, MEET_B, seg(c, T22.outA + 0.35, T22.outB + 0.05))
    if (c < T22.backA) return lerpPt(MEET_B, GRIP_CHEST, seg(c, T22.give, T22.chestB))
    if (c < T22.take) return lerpPt(GRIP_CHEST, MEET_B, seg(c, T22.backA, T22.backB))
    return lerpPt(MEET_B, REST_B, seg(c, T22.take, T22.take + 0.75))
  }

  const clerk = castSprite({
    config: RECEPTIONIST,
    dress: (k: Skin) => ({ ...k, top: <>{k.top}{LANYARD}</> }),
    loop: L22,
    frames: F22,
    height: P22.hClerk,
    wide: 70,
    shadow: 0.16,
    px: 256, // one fixed size (1080p's): no re-sizing, no rebuild, no flicker
    onReady: kit.redraw,
    timeline: timeline(41, L22, [
      [0, 'neutral'],
      [T22.reachA, 'thinking'],
      [T22.outA, 'happy'],
      [T22.chestB + 0.3, 'neutral'],
      [T22.openB + 0.15, 'surprised'],
      [T22.closeA, 'worried'],
      [T22.stackB, 'neutral'],
    ]),
    pose: (p: Pose, c: number) => {
      const a = solveR(shK, gripK(c))
      p.shoulderR = a.s
      p.elbowR = a.e
      p.wristR = -8
      const carrying = c > T22.reachB && c < T22.give + 0.05 ? 1 : c > T22.take - 0.05 && c < T22.stackB ? 1 : 0
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = mix(0.2, 0.62, carrying)
      p.tR = mix(0.2, 0.55, carrying)
      p.shoulderL = 9
      p.elbowL = 14
      /* down at the stack while she reaches, then across at B */
      const atStack = hold(c, T22.reachA - 0.1, T22.reachA + 0.3, T22.liftB - 0.1, T22.outA + 0.2) + hold(c, T22.stackA, T22.stackA + 0.3, T22.stackB, T22.restB)
      const atB = hold(c, T22.outA, T22.outA + 0.35, T22.closeB, T22.backB + 0.4)
      p.headNod = mix(0.06, 0.3, atStack)
      p.lookY = mix(mix(0.1, 0.65, atStack), 0.12, atB)
      p.headTurn = mix(mix(0.08, 0.22, atStack), 0.4, atB)
      p.lookX = mix(mix(0.1, 0.45, atStack), 0.85, atB)
    },
  })
  clerk.object.position.copy(P22.clerk)
  scene.add(clerk.object)

  const visitorB = castSprite({
    config: VISITOR_B,
    loop: L22,
    frames: F22,
    height: P22.hB,
    wide: 60,
    shadow: 0.2,
    px: 256, // one fixed size (1080p's): no re-sizing, no rebuild, no flicker
    onReady: kit.redraw,
    timeline: timeline(42, L22, [
      [0, 'neutral'],
      [T22.outA + 0.2, 'happy'],
      [T22.openB - 0.15, 'surprised'],
      [T22.openB + 0.35, 'shocked'],
      [T22.closeA, 'confused'],
      [T22.take + 0.3, 'neutral'],
    ]),
    pose: (p: Pose, c: number) => {
      const a = solveL(shB, gripB(c))
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -10
      const holding = c > T22.give - 0.05 && c < T22.take + 0.05 ? 1 : 0
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = mix(0.2, 0.66, holding)
      p.tL = mix(0.2, 0.5, holding)
      p.shoulderR = 9
      p.elbowR = 12
      /* at the receptionist, down at the open folder, across at A while it is open */
      const down = hold(c, T22.chestB - 0.2, T22.openA + 0.1, T22.closeA - 0.6, T22.closeA - 0.3)
      const toA = hold(c, T22.closeA - 0.6, T22.closeA - 0.3, T22.closeB, T22.backA + 0.2)
      p.headNod = mix(0.06, 0.32, down)
      p.lookY = mix(0.08, 0.7, down)
      p.headTurn = mix(mix(-0.32, -0.14, down), -0.5, toA)
      p.lookX = mix(mix(-0.7, -0.25, down), -0.95, toA)
      const jolt = hold(c, T22.openB, T22.openB + 0.2, T22.openB + 0.45, T22.openB + 0.8)
      p.bodyY -= jolt * 5
      p.lean = -jolt * 2
    },
  })
  visitorB.object.position.copy(P22.b)
  scene.add(visitorB.object)

  const visitorA = castSprite({
    config: VISITOR_A,
    loop: L22,
    frames: F22,
    height: P22.hA,
    wide: 30,
    shadow: 0.2,
    px: 256, // one fixed size (1080p's): no re-sizing, no rebuild, no flicker
    onReady: kit.redraw,
    timeline: timeline(43, L22, [
      [0, 'neutral'],
      [T22.openB + 0.1, 'surprised'],
      [T22.openB + 0.6, 'worried'],
      [T22.stackB, 'neutral'],
    ]),
    pose: (p: Pose, c: number) => {
      /* waiting at the counter, then turning to his own file in B's hands */
      const look = hold(c, T22.openA, T22.openB, T22.closeB, T22.backB + 0.4)
      p.headTurn = mix(0.18, 0.5, look)
      p.lookX = mix(0.4, 0.95, look)
      p.lookY = mix(0.15, 0.3, look)
      p.headNod = 0.06
      p.shoulderL = 8
      p.elbowL = 10
      /* a hand half raised toward it, a small "that's mine" */
      const raise = hold(c, T22.openB + 0.25, T22.openB + 0.7, T22.closeA, T22.closeB + 0.2)
      p.shoulderR = mix(8, 52, raise)
      p.elbowR = mix(12, 22, raise)
      p.wristR = mix(0, -12, raise)
      p.palmR = mix(0.2, 1, raise)
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = mix(0.3, 0.05, raise)
    },
  })
  visitorA.object.position.copy(P22.a)
  scene.add(visitorA.object)
  const clk = slideClock('T22', scene, devT(HOLD22), [clerk, visitorB, visitorA])

  const hand = new THREE.Vector3()
  const prevHand = new THREE.Vector3()
  const flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.12))
  const q = new THREE.Quaternion()
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
  return (t: number) => {
    const tt = clk.time(t)
    const c = ((tt % L22) + L22) % L22
    clerk.update(c, camera)
    visitorB.update(c, camera)
    visitorA.update(c, camera)
    const cq = frameTime(c, L22, F22)
    /* where the folder is: on the stack, in her hand, in B's hand, back in her hand, on the stack */
    const inClerk = (c >= T22.reachB + 0.05 && c < T22.give) || (c >= T22.take && c < T22.stackB)
    const inB = c >= T22.give && c < T22.take
    const holder = (x: number) => ((x >= T22.reachB + 0.05 && x < T22.give) || (x >= T22.take && x < T22.stackB) ? 1 : x >= T22.give && x < T22.take ? 2 : 0)
    const placeAt = (who: number, out: THREE.Vector3) => {
      if (who === 1) towardCamera(rigToWorld(reachR(shK, gripK(cq)), P22.hClerk, P22.clerk, camera, out), camera, 0.09)
      else if (who === 2) towardCamera(rigToWorld(reachL(shB, gripB(cq)), P22.hB, P22.b, camera, out), camera, 0.09)
      else out.copy(P22.slid)
      return out
    }
    placeAt(holder(c), hand)
    /* a hand-off glides over a fifth of a second from the last holder to the next (it was a jump of a few cm) */
    for (const sw of HANDOFFS22) {
      if (c >= sw && c < sw + 0.2) {
        placeAt(holder(sw - 0.001), prevHand)
        hand.lerpVectors(prevHand, hand, seg(c, sw, sw + 0.2))
      }
    }
    folder.group.position.copy(hand)
    /* flat on the stack, upright in a hand (turning over the first part of the lift and the last of the put-down) */
    const up = inClerk || inB ? (c < T22.give ? seg(c, T22.reachB, T22.outA + 0.2) : c >= T22.take ? 1 - seg(c, T22.stackA + 0.35, T22.stackB) : 1) : 0
    q.copy(flatQ).slerp(camera.quaternion, up)
    folder.group.quaternion.copy(q)
    /* a hand holds the folder by its spine (its left edge), so the hand stays in view */
    if (inClerk || inB) folder.group.position.addScaledVector(camRight, 0.1 * up)
    if (inB) folder.group.rotateZ(-0.08)
    if (inClerk) folder.group.rotateZ(0.1 * up)
    /* the cover opens to show A's ID page while B holds it */
    const open = hold(c, T22.openA, T22.openB, T22.closeA, T22.closeB)
    folder.cover.rotation.y = -open * 2.6
  }
}

/* ---- the concept: an AI assistant serving two users ---- */

const P22C = {
  plinth: P22.counter,
  orb: new THREE.Vector3(0.0, 1.32, -0.55),
  stackA: P22.trayA,
  stackB: P22.trayB,
  slid: P22.slid,
  a: new THREE.Vector3(-1.12, 0, 0.6),
  b: new THREE.Vector3(1.1, 0, 0.62),
  deskA: new THREE.Vector3(-0.7, 0, 0.82),
  deskB: new THREE.Vector3(0.68, 0, 0.84),
  hA: 1.7,
  hB: 1.6,
}

function makeLaptop(screen: THREE.Texture, yaw: number): { group: THREE.Group; screen: THREE.Mesh; lid: THREE.Group } {
  const laptop = new THREE.Group()
  laptop.rotation.y = yaw
  const shell = mat('#C9D0DC', { roughness: 0.35, metalness: 0.5 })
  laptop.add(box(0.34, 0.015, 0.23, shell, [0, 0.0075, 0], 0.005))
  laptop.add(box(0.3, 0.003, 0.1, mat('#2A2E3A'), [0, 0.016, 0.02]))
  const lid = new THREE.Group()
  lid.position.set(0, 0.015, -0.11)
  lid.rotation.x = -0.28
  lid.add(box(0.34, 0.22, 0.012, shell, [0, 0.11, 0], 0.005))
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.194), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }))
  sm.position.set(0, 0.11, 0.0065)
  lid.add(sm)
  laptop.add(lid)
  /* no shadow from the laptop: from the key light it fell as a dark slab across the plinth front */
  laptop.traverse((o) => (o.castShadow = false))
  return { group: laptop, screen: sm, lid }
}

/** a private ID card in 3D: A's teal card with his photo */
function makeIdCard(): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new RoundedBoxGeometry(0.2, 0.25, 0.012, 3, 0.012), mat(C.tealDark, { roughness: 0.5 })))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.225), flat(idPageTex(C.teal)))
  face.position.z = 0.0065
  g.add(face)
  /* it flies over the plinth: no shadow streaking across the front */
  g.traverse((o) => (o.castShadow = false))
  return g
}

function setupAssistant(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCamera(camera, CAM22.pos, CAM22.at)
  lightRig(scene, [0, 0, 0])
  const St = new THREE.Group()
  room(St, mat('#ffffff', { map: floorTex('#E6ECF6', '#DCE4F1', 'rgba(60,90,150,0.16)'), roughness: 0.4, metalness: 0.05 }), '#F1F5FC')

  /* the server rack on the back wall (the filing cabinet's place) */
  const rackM = mat('#1F2E63', { roughness: 0.45, metalness: 0.25 })
  const bladeM = mat('#2C3E7E', { roughness: 0.4, metalness: 0.3 })
  for (const x of [-1.55, -1.0]) {
    St.add(box(0.5, 1.32, 0.5, rackM, [x, 0.66, -1.05], 0.02))
    for (let i = 0; i < 6; i++) St.add(box(0.42, 0.15, 0.02, bladeM, [x, 0.2 + i * 0.19, -0.795]))
  }
  /* the plinth (the counter's place) */
  const K = P22C.plinth
  const cx = (K.x0 + K.x1) / 2
  const white = mat('#FFFFFF', { roughness: 0.35 })
  St.add(box(K.x1 - K.x0, K.h - 0.04, K.d, white, [cx, (K.h - 0.04) / 2, K.z], 0.02))
  St.add(box(K.x1 - K.x0 + 0.04, 0.04, K.d + 0.04, mat('#DCE6F7', { roughness: 0.3 }), [cx, K.h - 0.02, K.z], 0.012))
  St.add(box(K.x1 - K.x0 - 0.12, 0.03, 0.01, mat(C.brand, { roughness: 0.4, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 }), [cx, K.h - 0.12, K.z + K.d / 2 + 0.006]))
  /* the orb's pedestal behind the plinth (the receptionist's place) */
  St.add(box(0.36, 1.02, 0.36, white, [P22C.orb.x, 0.51, P22C.orb.z], 0.03))
  St.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 32), mat('#DCE6F7', { roughness: 0.3 }), [P22C.orb.x, 1.045, P22C.orb.z]))
  /* the two context stacks on the plinth, butted together: teal cards (A), purple cards (B) */
  const tealM = mat(C.teal, { roughness: 0.5 })
  const purpleM = mat(C.purple, { roughness: 0.5 })
  const baseM = mat('#5E6B86', { roughness: 0.4, metalness: 0.5 })
  St.add(box(0.56, 0.012, 0.22, baseM, [(P22C.stackA.x + P22C.stackB.x) / 2, K.h + 0.006, P22C.stackA.z]))
  for (let i = 0; i < 5; i++) {
    St.add(box(0.2, 0.012, 0.16, tealM, [P22C.stackA.x + (i % 2 ? 0.005 : -0.004), K.h + 0.02 + i * 0.014, P22C.stackA.z], 0.003))
    St.add(box(0.2, 0.012, 0.16, purpleM, [P22C.stackB.x + (i % 2 ? -0.004 : 0.005), K.h + 0.02 + i * 0.014, P22C.stackB.z], 0.003))
  }
  /* the two users' standing desks (the visitors' places) */
  const deskM = mat('#E8EDF6', { roughness: 0.4 })
  const legM = mat('#5E6B86', { metalness: 0.4, roughness: 0.4 })
  scene.add(bake(St))
  const Dk = new THREE.Group()
  for (const D of [P22C.deskA, P22C.deskB]) {
    Dk.add(box(0.5, 0.035, 0.42, deskM, [D.x, 0.9, D.z], 0.01))
    Dk.add(box(0.05, 0.88, 0.05, legM, [D.x, 0.44, D.z - 0.05]))
    Dk.add(box(0.36, 0.03, 0.3, legM, [D.x, 0.015, D.z - 0.05]))
  }
  const desks = bake(Dk)
  desks.traverse((o) => (o.castShadow = false))
  scene.add(desks)

  /* the assistant: a glowing orb with a turning ring (the model) */
  const orbMat = new THREE.MeshStandardMaterial({ color: '#5B86FF', emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.55, roughness: 0.18, metalness: 0.1 })
  const orb = mesh(new THREE.SphereGeometry(0.17, 40, 32), orbMat, [P22C.orb.x, P22C.orb.y, P22C.orb.z])
  scene.add(orb)
  const ring = mesh(new THREE.TorusGeometry(0.25, 0.012, 12, 64), mat('#9DB8FF', { emissive: new THREE.Color('#9DB8FF'), emissiveIntensity: 0.5, roughness: 0.3 }), [P22C.orb.x, P22C.orb.y, P22C.orb.z])
  ring.rotation.x = 1.2
  scene.add(ring)
  const haloMat = new THREE.MeshBasicMaterial({ color: '#7FA6FF', transparent: true, opacity: 0.0, depthWrite: false, toneMapped: false })
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), haloMat)
  halo.position.copy(P22C.orb)
  scene.add(halo)

  /* the laptops: A's on his right, B's on her left, screens toward each user and the camera */
  const scr = { a: chatTex(C.teal, null), b: chatTex(C.purple, null), bLeak: chatTex(C.purple, C.teal) }
  const lapA = makeLaptop(scr.a, -0.55)
  lapA.group.position.set(P22C.deskA.x + 0.02, 0.918, P22C.deskA.z + 0.02)
  scene.add(lapA.group)
  const lapB = makeLaptop(scr.b, 0.6)
  lapB.group.position.set(P22C.deskB.x - 0.02, 0.918, P22C.deskB.z + 0.02)
  scene.add(lapB.group)

  /* B's question: a purple packet; A's private card: the one that slid onto B's side */
  const packet = mesh(new RoundedBoxGeometry(0.08, 0.08, 0.08, 3, 0.02), new THREE.MeshStandardMaterial({ color: C.purple, emissive: new THREE.Color(C.purple), emissiveIntensity: 0.35, roughness: 0.3 }))
  scene.add(packet)
  const card = makeIdCard()
  scene.add(card)
  /* the pick-up beam from the orb to the card */
  const beamMat = new THREE.MeshBasicMaterial({ color: '#7FA6FF', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamMat)
  beam.renderOrder = 3
  scene.add(beam)

  /* the users, a hand on each keyboard */
  const shA = buildSkin(USER_A).shoulderHalf
  const shB = buildSkin(USER_B).shoulderHalf
  lapA.group.updateMatrixWorld(true)
  lapB.group.updateMatrixWorld(true)
  const keysOf = (lap: THREE.Group, local: THREE.Vector3, root: THREE.Vector3, h: number) => worldToRig(local.clone().applyMatrix4(lap.matrixWorld), root, h, camera)
  const KEYS_A = keysOf(lapA.group, new THREE.Vector3(-0.07, 0.02, 0.05), P22C.a, P22C.hA)
  const KEYS_B = keysOf(lapB.group, new THREE.Vector3(0.07, 0.02, 0.05), P22C.b, P22C.hB)
  const typing = (c: number, a: number, b: number) => hold(c, a, a + 0.1, b - 0.1, b) * Math.max(0, Math.sin(c * Math.PI * 2 * 5.5)) * 1.4

  const userB = castSprite({
    config: USER_B,
    loop: L22,
    frames: F22,
    height: P22C.hB,
    wide: 40,
    shadow: 0.2,
    px: 256, // one fixed size (1080p's): no re-sizing, no rebuild, no flicker
    onReady: kit.redraw,
    timeline: timeline(44, L22, [
      [0, 'thinking'],
      [1.1, 'neutral'],
      [T22.give + 0.05, 'surprised'],
      [T22.give + 0.45, 'shocked'],
      [T22.closeA, 'confused'],
      [T22.stackB, 'thinking'],
    ]),
    pose: (p: Pose, c: number) => {
      const k = { x: KEYS_B.x, y: KEYS_B.y - typing(c, 0.3, 1.0) - hold(c, 0.95, 1.02, 1.05, 1.15) * 4 }
      const a = solveL(shB, k)
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -62
      p.fL1 = p.fL2 = p.fL3 = p.fL4 = 0.05
      p.tL = 0.3
      p.spreadL = 0.1
      p.palmL = 0.1
      p.shoulderR = 9
      p.elbowR = 14
      const watch = hold(c, 1.1, 1.3, 2.3, 2.5)
      const toA = hold(c, T22.closeA - 0.5, T22.closeA - 0.2, T22.closeB, T22.backA + 0.3)
      p.headNod = mix(0.26, 0.08, watch)
      p.lookY = mix(0.55, 0.1, watch)
      p.headTurn = mix(mix(-0.3, -0.45, watch), -0.55, toA)
      p.lookX = mix(mix(-0.65, -0.9, watch), -0.95, toA)
      p.lean = -2
      const jolt = hold(c, T22.give + 0.4, T22.give + 0.6, T22.give + 0.85, T22.give + 1.2)
      p.bodyY -= jolt * 5
    },
  })
  userB.object.position.copy(P22C.b)
  drawOver(userB.object)
  scene.add(userB.object)

  const userA = castSprite({
    config: USER_A,
    loop: L22,
    frames: F22,
    height: P22C.hA,
    wide: 40,
    shadow: 0.2,
    px: 256, // one fixed size (1080p's): no re-sizing, no rebuild, no flicker
    onReady: kit.redraw,
    timeline: timeline(45, L22, [
      [0, 'neutral'],
      [T22.give + 0.5, 'surprised'],
      [T22.give + 0.9, 'worried'],
      [T22.stackB, 'neutral'],
    ]),
    pose: (p: Pose, c: number) => {
      const k = { x: KEYS_A.x, y: KEYS_A.y - typing(c, 5.6, 6.8) - typing(c, 0.0, 0.25) }
      const a = solveR(shA, k)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.wristR = -62
      p.fR1 = p.fR2 = p.fR3 = p.fR4 = 0.05
      p.tR = 0.3
      p.spreadR = 0.1
      p.palmR = 0.1
      p.shoulderL = 9
      p.elbowL = 14
      const look = hold(c, T22.give + 0.3, T22.give + 0.7, T22.closeB, T22.backB + 0.3)
      p.headNod = mix(0.24, 0.08, look)
      p.lookY = mix(0.5, 0.2, look)
      p.headTurn = mix(0.3, 0.55, look)
      p.lookX = mix(0.6, 0.95, look)
      p.lean = -2
    },
  })
  userA.object.position.copy(P22C.a)
  drawOver(userA.object)
  scene.add(userA.object)
  const clk = slideClock('T22', scene, devT(HOLD22), [userB, userA])

  const from = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const toScreen = new THREE.Vector3()
  const flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.12))
  const q = new THREE.Quaternion()
  const orbP = P22C.orb.clone()
  const slid = P22C.slid.clone()
  return (t: number) => {
    const tt = clk.time(t)
    const c = ((tt % L22) + L22) % L22
    userB.update(c, camera)
    userA.update(c, camera)
    /* the orb: a slow turn of its ring, a pulse while it answers */
    ring.rotation.z = (c / L22) * Math.PI * 2
    const think = hold(c, 1.55, 1.7, 2.25, 2.45)
    orbMat.emissiveIntensity = 0.55 + think * 0.45 + 0.08 * Math.sin((c / L22) * Math.PI * 8)
    haloMat.opacity = think * 0.28
    halo.scale.setScalar(1 + think * 0.12)
    /* B's question flies from her laptop to the orb */
    lapB.lid.updateMatrixWorld()
    lapB.screen.getWorldPosition(from)
    const fly = seg(c, 1.05, 1.6)
    packet.visible = c > 1.05 && c < 1.62
    if (packet.visible) {
      tmp.lerpVectors(from, orbP, fly)
      tmp.y += Math.sin(fly * Math.PI) * 0.22
      packet.position.copy(tmp)
      packet.rotation.set(c * 2, c * 3, 0)
      packet.scale.setScalar(1 - fly * 0.4)
    }
    /* the orb picks the top card from B's side (A's, slid across) and drops it into B's answer */
    toScreen.copy(from)
    towardCamera(toScreen, camera, 0.05)
    const go = seg(c, 2.0, T22.give)
    const ret = seg(c, T22.stackA - 0.1, T22.stackB)
    const onScreen = c >= T22.give && c < T22.stackA - 0.1
    if (c < T22.stackA - 0.1) tmp.lerpVectors(slid, toScreen, go)
    else tmp.lerpVectors(toScreen, slid, ret)
    const arc = c < T22.stackA ? Math.sin(go * Math.PI) : Math.sin(ret * Math.PI)
    tmp.y += arc * 0.35
    card.position.copy(tmp)
    const inAir = c < T22.stackA - 0.1 ? go : 1 - ret
    q.copy(flatQ).slerp(camera.quaternion, clamp01(inAir * 1.6))
    card.quaternion.copy(q)
    /* in flight it is full size; at the screen it shrinks into the answer bubble and the screen shows it */
    const shrink = c < T22.stackA - 0.1 ? seg(c, T22.give - 0.25, T22.give) : 1 - seg(c, T22.stackA - 0.1, T22.stackA + 0.2)
    card.scale.setScalar(mix(1, 0.15, shrink))
    card.visible = !onScreen
    const leak = c >= T22.give - 0.02 && c < T22.stackA - 0.08
    ;(lapB.screen.material as THREE.MeshBasicMaterial).map = leak ? scr.bLeak : scr.b
    /* the beam while the orb lifts it */
    const lift = hold(c, 1.9, 2.05, 2.25, 2.45)
    const mid = orbP.clone().lerp(slid, 0.5)
    beam.position.copy(mid)
    beam.quaternion.copy(camera.quaternion)
    const dir = slid.clone().sub(orbP).applyQuaternion(camera.quaternion.clone().invert())
    beam.rotateZ(Math.atan2(dir.y, dir.x))
    beam.scale.set(orbP.distanceTo(slid), 0.07, 1)
    beamMat.opacity = lift * 0.45
  }
}

/* ================================================================== T24 · the tap left running */

const L24 = 6
const HOLD24 = 4.8
const F24 = 48
const P24 = {
  counter: { x0: -1.35, x1: 0.52, z: -0.05, d: 0.6, h: 0.9 },
  sink: { x: -0.42, w: 0.56, d: 0.36, depth: 0.2 },
  spout: new THREE.Vector3(-0.42, 1.2, -0.13),
  wallZ: -0.4,
  meter: new THREE.Vector3(-1.02, 1.5, -0.33),
  bill: new THREE.Vector3(0.22, 0.9, -0.04),
  person: new THREE.Vector3(0.84, 0, -0.04),
  hP: 1.62,
}
const CAM24 = { pos: [-0.2, 2.02, 3.05] as [number, number, number], at: [-0.22, 1.02, -0.12] as [number, number, number] }
/* the bill's rows arrive while the meter turns; the page lifts away at the end and the next one starts */
const ROWS = [0.7, 1.55, 2.4, 3.25]
const LIFT = { a: 5.35, b: 5.85 }

/** the bill on a little stand: paper, rows (meshes), the total bar that grows; the top page lifts away at the end */
type Bill = { group: THREE.Group; update: (c: number) => void }
function makeBill(kind: 'water' | 'cloud'): Bill {
  const group = new THREE.Group()
  const BW = 0.34
  const BH = 0.47
  /* the stand: a back board leaning back, a ledge */
  const standM = mat('#8C6440', { roughness: 0.6 })
  group.add(box(BW + 0.04, 0.02, 0.06, standM, [0, 0.01, 0.03], 0.005))
  const lean = new THREE.Group()
  lean.rotation.x = -0.32
  group.add(lean)
  lean.add(box(BW + 0.04, BH + 0.04, 0.012, standM, [0, BH / 2 + 0.02, -0.004], 0.006))
  /* the next page, underneath: fresh */
  const paper = billTex(kind)
  const under = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: paper, toneMapped: false }))
  under.position.set(0, BH / 2 + 0.02, 0.004)
  lean.add(under)
  /* the page in use, its rows and total */
  const page = new THREE.Group()
  page.position.set(0, BH / 2 + 0.02, 0.008)
  lean.add(page)
  const pageMat = new THREE.MeshBasicMaterial({ map: paper, toneMapped: false, transparent: true })
  page.add(new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), pageMat))
  const px = BW / 400
  const rowMats: THREE.MeshBasicMaterial[] = []
  const rows = ROWS.map((_, i) => {
    const g = new THREE.Group()
    const y = BH / 2 - (140 + i * 66) * px
    const m1 = new THREE.MeshBasicMaterial({ color: '#C9D3E6', toneMapped: false, transparent: true, opacity: 0 })
    const m2 = new THREE.MeshBasicMaterial({ color: '#7D8BA8', toneMapped: false, transparent: true, opacity: 0 })
    rowMats.push(m1, m2)
    const a = new THREE.Mesh(new THREE.PlaneGeometry(170 * px, 16 * px), m1)
    a.position.set(-BW / 2 + (24 + 85) * px, y, 0.001)
    const b = new THREE.Mesh(new THREE.PlaneGeometry(80 * px, 16 * px), m2)
    b.position.set(BW / 2 - (24 + 40) * px, y, 0.001)
    g.add(a, b)
    page.add(g)
    return g
  })
  /* the total bar, orange: the damage, growing from the left */
  const totalMat = new THREE.MeshBasicMaterial({ color: C.orange, toneMapped: false, transparent: true })
  const TOTAL_W = 352 * px
  const totalGeo = new THREE.PlaneGeometry(TOTAL_W, 26 * px)
  totalGeo.translate(TOTAL_W / 2, 0, 0)
  const total = new THREE.Mesh(totalGeo, totalMat)
  total.position.set(-BW / 2 + 24 * px, BH / 2 - 486 * px, 0.001)
  page.add(total)
  return {
    group,
    update(c) {
      const away = seg(c, LIFT.a, LIFT.b)
      const op = 1 - away
      pageMat.opacity = op
      page.position.y = BH / 2 + 0.02 + away * 0.16
      page.position.z = 0.008 + away * 0.05
      page.rotation.x = -away * 0.5
      rows.forEach((r, i) => {
        const on = seg(c, ROWS[i], ROWS[i] + 0.3)
        r.scale.setScalar(0.85 + 0.15 * on)
        rowMats[i * 2].opacity = on * op
        rowMats[i * 2 + 1].opacity = on * op
      })
      const grow = seg(c, 0.25, 4.6) * 0.9 + seg(c, 4.6, 5.2) * 0.1
      total.scale.x = Math.max(0.0001, grow)
      totalMat.opacity = op
      total.visible = grow > 0.002
    },
  }
}

/** the meter: a round body on the wall pipe, its dial, a needle that turns once a loop and a small fast wheel */
function makeMeter(body: string, ring: string): { group: THREE.Group; update: (c: number) => void } {
  const group = new THREE.Group()
  const bodyM = mat(body, { roughness: 0.35, metalness: 0.6 })
  const cyl = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.07, 40), bodyM)
  cyl.rotation.x = Math.PI / 2
  group.add(cyl)
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.128, 48), new THREE.MeshBasicMaterial({ map: dialTex(ring), toneMapped: false }))
  face.position.z = 0.0365
  group.add(face)
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.13, 48), new THREE.MeshStandardMaterial({ color: '#DDE9FF', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 }))
  glass.position.z = 0.04
  group.add(glass)
  const needle = new THREE.Group()
  needle.position.z = 0.038
  const nGeo = new THREE.PlaneGeometry(0.012, 0.11)
  nGeo.translate(0, 0.045, 0)
  needle.add(new THREE.Mesh(nGeo, glow(C.red)))
  needle.add(new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), glow('#41506E')))
  group.add(needle)
  /* the small fast wheel at the foot of the dial: a star that spins while anything flows */
  const wheel = new THREE.Group()
  wheel.position.set(0, -0.06, 0.039)
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.04), glow(C.navy))
    b.rotation.z = (i * Math.PI) / 4
    wheel.add(b)
  }
  group.add(wheel)
  return {
    group,
    update(c) {
      needle.rotation.z = -(c / L24) * Math.PI * 2
      wheel.rotation.z = -(c / L24) * Math.PI * 2 * 12
    },
  }
}

const timeline24 = (seed: number) =>
  timeline(seed, L24, [
    [0, 'neutral'],
    [1.2, 'thinking'],
    [2.5, 'worried'],
    [3.9, 'shocked'],
    [5.45, 'worried'],
  ])
/** the person beside the counter: eyes on the bill, a glance at the meter, a step back in shock */
const pose24 = (p: Pose, c: number) => {
  const glance = hold(c, 1.9, 2.2, 2.8, 3.1)
  p.headTurn = mix(-0.32, -0.55, glance)
  p.lookX = mix(-0.7, -0.98, glance)
  p.headNod = mix(0.2, 0.0, glance)
  p.lookY = mix(0.55, -0.1, glance)
  const shock = hold(c, 3.9, 4.15, 5.1, 5.6)
  p.bodyY -= shock * 4
  p.lean = -shock * 3
  /* a hand to the chest when the total shoots up */
  p.shoulderL = mix(8, 28, shock)
  p.elbowL = mix(10, 118, shock)
  p.wristL = mix(0, -20, shock)
  p.palmL = mix(0.2, 0.9, shock)
  p.shoulderR = 9
  p.elbowR = 12
}

function kitchenBase(wall: string, floorA: string, floorB: string) {
  const St = new THREE.Group()
  const wm = mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.3 })
  const f = mesh(new THREE.BoxGeometry(14, 0.1, 12), mat('#ffffff', { map: floorTex(floorA, floorB, 'rgba(110,95,70,0.14)'), roughness: 0.7 }), [0, -0.05, 2])
  f.castShadow = false
  St.add(f)
  const back = mesh(new THREE.BoxGeometry(9, 3.4, 0.12), wm, [0, 1.7, P24.wallZ - 0.06])
  back.castShadow = false
  St.add(back)
  return St
}

function setupKitchen(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#F4EFE6')
  setCamera(camera, CAM24.pos, CAM24.at)
  lightRig(scene, [-0.2, 0, 0])
  const St = kitchenBase('#F6EBDA', '#E9DFCF', '#DDD0BC')
  /* a tiled splashback behind the counter */
  const tile = canvasTex(256, 256, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 256, 256)
    g.fillStyle = '#E3E8F0'
    for (let i = 0; i <= 256; i += 64) {
      g.fillRect(i - 2, 0, 4, 256)
      g.fillRect(0, i - 2, 256, 4)
    }
  })
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping
  tile.repeat.set(8, 2)
  const K = P24.counter
  const sb = mesh(new THREE.PlaneGeometry(K.x1 - K.x0, 0.5), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.4 }), [(K.x0 + K.x1) / 2, K.h + 0.25, P24.wallZ + 0.005])
  sb.castShadow = false
  St.add(sb)

  /* the counter with the sink cut into its top */
  const cab = mat('#F7F3EC', { roughness: 0.55 })
  const top = mat('#EDE7DC', { roughness: 0.45 })
  const S = P24.sink
  const cx = (K.x0 + K.x1) / 2
  St.add(box(K.x1 - K.x0, K.h - 0.05, K.d, cab, [cx, (K.h - 0.05) / 2, K.z], 0.015))
  const doorM = mat('#ECE4D6', { roughness: 0.5 })
  const handleM = mat(C.brand, { roughness: 0.35, metalness: 0.3 })
  const nDoors = 4
  const dw = (K.x1 - K.x0) / nDoors
  for (let i = 0; i < nDoors; i++) {
    const x = K.x0 + (i + 0.5) * dw
    St.add(box(dw - 0.05, K.h - 0.2, 0.012, doorM, [x, (K.h - 0.05) / 2 - 0.02, K.z + K.d / 2 + 0.006], 0.006))
    St.add(box(0.012, 0.12, 0.02, handleM, [x + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), K.h - 0.2, K.z + K.d / 2 + 0.018], 0.005))
  }
  const zf = K.z + K.d / 2
  const zb = K.z - K.d / 2
  const sz0 = K.z - S.d / 2
  const sz1 = K.z + S.d / 2
  const sx0 = S.x - S.w / 2
  const sx1 = S.x + S.w / 2
  const slab = (x0: number, x1: number, z0: number, z1: number) => St.add(box(x1 - x0, 0.05, z1 - z0, top, [(x0 + x1) / 2, K.h - 0.025, (z0 + z1) / 2]))
  slab(K.x0 - 0.02, sx0, zb - 0.02, zf + 0.02)
  slab(sx1, K.x1 + 0.02, zb - 0.02, zf + 0.02)
  slab(sx0, sx1, zb - 0.02, sz0)
  slab(sx0, sx1, sz1, zf + 0.02)
  /* the basin: steel walls and floor */
  const steel = mat('#C9D2DE', { roughness: 0.25, metalness: 0.7 })
  const by = K.h - S.depth
  St.add(box(S.w, 0.01, S.d, steel, [S.x, by, K.z]))
  St.add(box(S.w, S.depth, 0.01, steel, [S.x, by + S.depth / 2, sz0]))
  St.add(box(S.w, S.depth, 0.01, steel, [S.x, by + S.depth / 2, sz1]))
  St.add(box(0.01, S.depth, S.d, steel, [sx0, by + S.depth / 2, K.z]))
  St.add(box(0.01, S.depth, S.d, steel, [sx1, by + S.depth / 2, K.z]))
  /* the tap: a column behind the sink, a curved neck, a handle */
  const chrome = mat('#D9DEE6', { roughness: 0.15, metalness: 0.9 })
  const colZ = P24.spout.z - 0.14
  const armY = P24.spout.y + 0.07
  St.add(mesh(new THREE.CylinderGeometry(0.026, 0.036, armY - K.h, 24), chrome, [S.x, (armY + K.h) / 2, colZ]))
  St.add(mesh(new THREE.SphereGeometry(0.026, 18, 12), chrome, [S.x, armY, colZ]))
  St.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, P24.spout.z + 0.02 - colZ, 18), chrome, [S.x, armY, (P24.spout.z + 0.02 + colZ) / 2]).rotateX(Math.PI / 2))
  St.add(mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.07, 18), chrome, [S.x, P24.spout.y + 0.035, P24.spout.z + 0.02]))
  St.add(box(0.11, 0.02, 0.028, chrome, [S.x + 0.07, K.h + 0.16, colZ], 0.008))
  /* the supply pipe along the wall into the tap, the meter on it */
  const pipeM = mat('#B8875A', { roughness: 0.35, metalness: 0.7 })
  const pipeY = P24.meter.y
  const pipe1 = mesh(new THREE.CylinderGeometry(0.022, 0.022, S.x - (-1.6), 18), pipeM, [(S.x - 1.6) / 2, pipeY, P24.wallZ + 0.04])
  pipe1.rotation.z = Math.PI / 2
  St.add(pipe1)
  St.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, pipeY - K.h, 18), pipeM, [S.x, (pipeY + K.h) / 2, P24.wallZ + 0.04]))
  St.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, colZ - (P24.wallZ + 0.04), 14), pipeM, [S.x, K.h + 0.03, (colZ + P24.wallZ + 0.04) / 2]).rotateX(Math.PI / 2))
  St.add(mesh(new THREE.SphereGeometry(0.03, 16, 12), pipeM, [S.x, pipeY, P24.wallZ + 0.04]))
  /* a dish rack on the counter's left: a kitchen */
  const rackM = mat('#9AA6BA', { roughness: 0.4, metalness: 0.5 })
  St.add(box(0.34, 0.02, 0.26, rackM, [-1.06, K.h + 0.01, K.z + 0.04]))
  for (let i = 0; i < 4; i++) St.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 28), mat(['#FFFFFF', '#F2C14E', '#FFFFFF', '#9DB8FF'][i], { roughness: 0.4 }), [-1.16 + i * 0.07, K.h + 0.11, K.z + 0.04]).rotateZ(Math.PI / 2 - 0.15))
  scene.add(bake(St))

  /* the meter */
  const meter = makeMeter('#B8875A', C.brand)
  meter.group.position.copy(P24.meter)
  scene.add(meter.group)
  /* the water: a stream from the spout to the basin, falling drops in it, a pool and ripples in the basin */
  const waterM = new THREE.MeshStandardMaterial({ color: '#9CCBFF', emissive: new THREE.Color('#6FAFFF'), emissiveIntensity: 0.25, transparent: true, opacity: 0.62, roughness: 0.05 })
  const fall = P24.spout.y - (K.h - S.depth + 0.02)
  const stream = mesh(new THREE.CylinderGeometry(0.018, 0.024, fall, 16, 1, true), waterM, [S.x, P24.spout.y - fall / 2, P24.spout.z + 0.02])
  stream.castShadow = false
  scene.add(stream)
  const dropM = new THREE.MeshStandardMaterial({ color: '#CFE6FF', emissive: new THREE.Color('#9CCBFF'), emissiveIntensity: 0.4, transparent: true, opacity: 0.85, roughness: 0.05 })
  const drops = [0, 1, 2, 3].map(() => {
    const d = mesh(new THREE.SphereGeometry(0.024, 14, 10), dropM)
    d.scale.set(1, 1.9, 1)
    d.castShadow = false
    scene.add(d)
    return d
  })
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(S.w - 0.02, S.d - 0.02), new THREE.MeshStandardMaterial({ color: '#8EC3FF', transparent: true, opacity: 0.55, roughness: 0.05, emissive: new THREE.Color('#6FAFFF'), emissiveIntensity: 0.15 }))
  pool.rotation.x = -Math.PI / 2
  pool.position.set(S.x, K.h - S.depth + 0.012, K.z)
  scene.add(pool)
  const rippleM = [0, 1].map(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))
  const ripples = rippleM.map((m) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.062, 40), m)
    r.rotation.x = -Math.PI / 2
    r.position.set(S.x, K.h - S.depth + 0.016, P24.spout.z + 0.02)
    scene.add(r)
    return r
  })

  /* the bill on its stand, at the counter's right */
  const bill = makeBill('water')
  bill.group.position.copy(P24.bill)
  bill.group.rotation.y = -0.18
  scene.add(bill.group)

  /* the homeowner */
  const person = castSprite({ config: HOMEOWNER, loop: L24, frames: F24, height: P24.hP, wide: 40, shadow: 0.2, adaptive: true, onReady: kit.redraw, timeline: timeline24(51), pose: pose24 })
  person.object.position.copy(P24.person)
  scene.add(person.object)

  const spoutY = P24.spout.y
  return (t: number) => {
    const c = ((t % L24) + L24) % L24
    person.update(c, camera)
    meter.update(c)
    bill.update(c)
    /* drops ride the stream, a 0.5 s fall each, four in turn (12 falls a loop: seamless) */
    drops.forEach((d, i) => {
      const k = (((c / 0.5 + i / 4) % 1) + 1) % 1
      d.position.set(S.x, spoutY - k * k * fall, P24.spout.z + 0.02)
      d.visible = k > 0.04 && k < 0.97
    })
    stream.scale.x = stream.scale.z = 1 + 0.08 * Math.sin(c * Math.PI * 2 * 4)
    /* two ripples, 1 s each, half a second apart */
    ripples.forEach((r, i) => {
      const k = (c + i * 0.5) % 1
      r.scale.setScalar(1 + k * 2.6)
      rippleM[i].opacity = (1 - k) * 0.7
    })
  }
}

function setupGpu(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  setCamera(camera, CAM24.pos, CAM24.at)
  lightRig(scene, [-0.2, 0, 0])
  const St = kitchenBase('#F1F5FC', '#E6ECF6', '#DCE4F1')
  const K = P24.counter
  const S = P24.sink
  const cx = (K.x0 + K.x1) / 2
  /* the plinth (the counter's place) */
  const white = mat('#FFFFFF', { roughness: 0.35 })
  St.add(box(K.x1 - K.x0, K.h - 0.04, K.d, white, [cx, (K.h - 0.04) / 2, K.z], 0.02))
  St.add(box(K.x1 - K.x0 + 0.04, 0.04, K.d + 0.04, mat('#DCE6F7', { roughness: 0.3 }), [cx, K.h - 0.02, K.z], 0.012))
  St.add(box(K.x1 - K.x0 - 0.12, 0.03, 0.01, mat(C.brand, { roughness: 0.4, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 }), [cx, K.h - 0.12, K.z + K.d / 2 + 0.006]))
  /* the GPU server on it (the sink's place): a dark chassis, an intake slot on top, three GPU cards in front */
  const SW = 0.56
  const SH = 0.22
  const chassis = mat('#1F2E63', { roughness: 0.4, metalness: 0.35 })
  St.add(box(SW, SH, 0.4, chassis, [S.x, K.h + SH / 2, K.z - 0.04], 0.02))
  St.add(box(0.26, 0.012, 0.08, mat('#0B1430', { roughness: 0.6 }), [S.x, K.h + SH + 0.002, K.z - 0.06]))
  const cardM = mat('#2C3E7E', { roughness: 0.4, metalness: 0.3 })
  for (let i = 0; i < 3; i++) St.add(box(0.16, 0.22, 0.02, cardM, [S.x - 0.18 + i * 0.18, K.h + SH / 2, K.z + 0.165], 0.008))
  /* the supply cable along the wall into the nozzle (the pipe's place), the meter on it */
  const cableM = mat('#41506E', { roughness: 0.5, metalness: 0.2 })
  const y = P24.meter.y
  const c1 = mesh(new THREE.CylinderGeometry(0.02, 0.02, S.x + 1.6, 18), cableM, [(S.x - 1.6) / 2, y, P24.wallZ + 0.04])
  c1.rotation.z = Math.PI / 2
  St.add(c1)
  /* the API nozzle above the server (the tap's place): an arm off the wall, a funnel mouth turned down, a lit rim */
  const nozM = mat('#DCE6F7', { roughness: 0.25, metalness: 0.4 })
  const nozZ = P24.spout.z + 0.02
  St.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, nozZ - (P24.wallZ + 0.04), 18), nozM, [S.x, y, (nozZ + P24.wallZ + 0.04) / 2]).rotateX(Math.PI / 2))
  St.add(mesh(new THREE.SphereGeometry(0.04, 16, 12), nozM, [S.x, y, P24.wallZ + 0.04]))
  St.add(mesh(new THREE.SphereGeometry(0.034, 16, 12), nozM, [S.x, y, nozZ]))
  St.add(mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.1, 24, 1, true), nozM, [S.x, y - 0.07, nozZ]))
  scene.add(bake(St))

  /* fans on the GPU cards (they race), LEDs on the chassis */
  const fanM = mat('#9DB8FF', { roughness: 0.3, metalness: 0.4 })
  const fans: THREE.Group[] = []
  for (let i = 0; i < 3; i++) {
    for (const dy of [-0.05, 0.05]) {
      const fan = new THREE.Group()
      fan.position.set(S.x - 0.18 + i * 0.18, K.h + SH / 2 + dy, K.z + 0.177)
      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(new THREE.CircleGeometry(0.036, 12, 0, 0.7), fanM)
        blade.rotation.z = (b / 5) * Math.PI * 2
        fan.add(blade)
      }
      fan.add(new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), glow('#E8EEF8')))
      scene.add(fan)
      fans.push(fan)
    }
  }
  const ledOn = glow('#3DDC97')
  const ledOff = glow('#2E4A8A')
  const leds = [0, 1, 2, 3, 4].map((i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.005), ledOff)
    m.position.set(S.x + SW / 2 - 0.04, K.h + 0.04 + i * 0.05, K.z + 0.162)
    scene.add(m)
    return m
  })
  /* the meter: the billing meter, on the cable */
  const meter = makeMeter('#2C3E7E', C.orange)
  meter.group.position.copy(P24.meter)
  scene.add(meter.group)
  /* the requests: a light stream from the nozzle to the intake, request cards falling down it */
  const top = y - 0.13
  const fall = top - (K.h + SH)
  const rim = mesh(new THREE.TorusGeometry(0.073, 0.008, 10, 36), glow('#7FA6FF'), [S.x, y - 0.12, P24.spout.z + 0.02])
  rim.rotation.x = Math.PI / 2
  scene.add(rim)
  const streamM = new THREE.MeshBasicMaterial({ color: '#9DB8FF', transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false })
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, fall, 18, 1, true), streamM)
  stream.position.set(S.x, top - fall / 2, P24.spout.z + 0.02)
  scene.add(stream)
  const reqTex = canvasTex(128, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    rrect(g, 0, 0, 128, 96, 16)
    g.fill()
    g.fillStyle = C.brand
    rrect(g, 14, 18, 78, 14, 7)
    g.fill()
    g.fillStyle = '#C9D3E6'
    rrect(g, 14, 44, 100, 12, 6)
    g.fill()
    rrect(g, 14, 66, 64, 12, 6)
    g.fill()
  })
  const reqs = [0, 1, 2].map((i) => {
    const r = new THREE.Group()
    r.add(mesh(new RoundedBoxGeometry(0.096, 0.07, 0.014, 2, 0.01), mat(i % 2 ? '#2D63FB' : '#4B7BFF', { roughness: 0.4 })))
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.064), flat(reqTex))
    f.position.z = 0.0075
    r.add(f)
    scene.add(r)
    return r
  })

  const bill = makeBill('cloud')
  bill.group.position.copy(P24.bill)
  bill.group.rotation.y = -0.18
  scene.add(bill.group)

  const person = castSprite({ config: OWNER, loop: L24, frames: F24, height: P24.hP + 0.06, wide: 40, shadow: 0.2, adaptive: true, onReady: kit.redraw, timeline: timeline24(52), pose: pose24 })
  person.object.position.copy(P24.person)
  scene.add(person.object)

  return (t: number) => {
    const c = ((t % L24) + L24) % L24
    person.update(c, camera)
    meter.update(c)
    bill.update(c)
    /* requests pour one after another, 0.6 s each, three in flight evenly spaced (10 falls a loop: seamless) */
    reqs.forEach((r, i) => {
      const k = (((c / 0.6 + i / 3) % 1) + 1) % 1
      r.position.set(S.x + Math.sin((k + i) * 5) * 0.01, top - k * (0.55 + 0.45 * k) * fall, P24.spout.z + 0.02)
      r.quaternion.copy(camera.quaternion)
      r.rotateZ(Math.sin(k * Math.PI * 2 + i) * 0.25)
      r.visible = k > 0.03 && k < 0.97
      r.scale.setScalar(k > 0.85 ? 1 - (k - 0.85) * 4 : 1)
    })
    /* fans race (whole turns per loop: seamless), LEDs blink busy */
    fans.forEach((f, i) => (f.rotation.z = -(c / L24) * Math.PI * 2 * (30 + i)))
    leds.forEach((m, i) => (m.material = ((c * 4 + i * 0.37) % 1) < 0.55 ? ledOn : ledOff))
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

/* T22: both cards on one clock (custom/clock.tsx): held until the people are built, tap to pause */
const card22 = (setup: (k: StageKit) => Update, holdT: number) =>
  (({ step = 0 }: Fig) => (
    <ClockCard id="T22" w={W} h={H}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </ClockCard>
  )) as (p: Record<string, unknown>) => ReactNode

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T22Everyday: card22(setupReception, devT(HOLD22)),
  J_T22Concept: card22(setupAssistant, devT(HOLD22)),
  J_T24Everyday: card(setupKitchen, devT(HOLD24)),
  J_T24Concept: card(setupGpu, devT(HOLD24)),
}
export const css = ''
