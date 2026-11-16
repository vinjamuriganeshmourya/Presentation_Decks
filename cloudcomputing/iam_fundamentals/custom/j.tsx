import { useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CastSprite, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import type { Skin } from '@/decks/figures/cast/skins/types'
import s3BucketUrl from '../images/res-s3-bucket.svg'
import s3ObjectUrl from '../images/res-s3-object.svg'
import permUrl from '../images/res-iam-permissions.svg'
import usersUrl from '../images/res-users.svg'
import accountUrl from '../images/j-aws-account.svg'

/**
 * BUILDER J · SESSION 13 (IAM Fundamentals), the TR 13 and TR 16 analogies.
 *
 * TR 13: "An office employee can carry an access card with assigned permissions, or a restricted room can have an
 * approved visitor list: just as an identity-based policy is attached to a user, while a resource-based policy is
 * attached to the resource."
 * TR 16: "A new phone app cannot touch the camera or contacts until the user grants each permission: exactly as IAM
 * blocks every request until an explicit allow statement is matched."
 *
 * Built to the Session 9-12 review rules from the first draft (generate-slides standing corrections 13-16, cloud course
 * R10-R13, deck-engine "Low-end PCs"): real-time 3D on the engine's stage (`@/engine/three-stage`), a perspective camera
 * and a real place; people are Character Lab characters from the engine's `castSprite` (role clothing through `dress`,
 * frames built at the size they are drawn on this screen), each an individual with expressions synced to the action;
 * no text on either card (the phone and the tablet show icons only, the visitor list shows faces and ticks); nobody
 * walks (a rig has no back view, so a person walking into a doorway would walk backwards): doors, lids and locks move,
 * people react; one wall-clock loop per card that ends where it starts; held frames draw the key moment.
 *
 * T13, one ground plan for both cards, position for position:
 *   place              everyday (office floor)                       concept (cloud account)
 *   left doorway       glass office door, a card reader beside it    glass server-room door, a reader beside it
 *   left person        employee taps HER access card: door opens     IAM user taps HER policy card: door opens on the
 *                                                                    rack        = identity-based (travels with her)
 *   middle             guard with the approved-visitor clipboard     the bucket policy board, bolted to the bucket
 *   right doorway      restricted room door (gold lock emblem)       an S3 bucket (official mark on it), lid shut
 *   right person       visitor: guard finds her face on the list,    principal from another account (on an AWS
 *                      ticks it, the restricted door swings open     account tile): her row on the board ticks, the lid
 *                                                                    opens, an object rises to her = resource-based
 * T16, one ground plan for both cards:
 *   behind the table   a young woman holding her phone               an IAM user holding a tablet
 *   the screen         camera and contacts both locked; a permission  two requests leave the tablet down two lanes;
 *                      prompt rises; allow on the camera only: the    padlocks stop both; an Allow statement card docks
 *                      viewfinder opens on her coffee, contacts stay  at lane 1, its lock opens, the request reaches the
 *                      locked                                         S3 bucket; lane 2 stays locked
 */

const W = 470
const H = 390
const HOLD13 = 5.85 // T13: the left door open again is past; the guard's tick on, the restricted door swinging open
const HOLD16 = 3.85 // T16: camera allowed (viewfinder on the coffee), contacts still locked / lane 1 open, lane 2 locked
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('jt'))
  return Number.isFinite(v) && v > 0 ? v : d
}

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  white: '#FFFFFF',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  red: '#E5484D',
  green: '#3DBB7A',
  ink: '#1B2140',
}

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
const hold = (t: number, a0: number, a1: number, b0: number, b1: number) => seg(t, a0, a1) * (1 - seg(t, b0, b1))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: THREE.Vector3Tuple, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d)
  if (Array.isArray(m)) {
    const o = new THREE.Mesh(geo, m)
    o.position.set(...pos)
    o.castShadow = true
    o.receiveShadow = true
    return o
  }
  return mesh(geo, m, pos)
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, n = 32) => mesh(new THREE.CylinderGeometry(rt, rb, h, n), m, pos)
const flat = (o: THREE.Mesh) => {
  o.rotation.x = -Math.PI / 2
  o.castShadow = false
  return o
}
const glow = (color: string, emissive: string, k = 0.8) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: k, roughness: 0.35 })

/* drawn textures are rasterised at 3x so they stay crisp on a 4K screen (correction 15) */
const TEX_SS = 3
function liveTex(w: number, h: number): { tex: THREE.CanvasTexture; paint: (draw: (g: CanvasRenderingContext2D) => void) => void } {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return {
    tex,
    paint(draw) {
      g.setTransform(TEX_SS, 0, 0, TEX_SS, 0, 0)
      draw(g)
      tex.needsUpdate = true
    },
  }
}
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const lt = liveTex(w, h)
  lt.paint(draw)
  return lt.tex
}
/** an official mark into a texture, aspect kept, contained with padding (an SVG with only a viewBox is drawn at full size) */
function markTex(url: string, aspect: number, onLoad: () => void, pad = 0.12, bg?: string): THREE.CanvasTexture {
  const H0 = 512
  const W0 = Math.round(H0 * aspect)
  const c = document.createElement('canvas')
  c.width = W0
  c.height = H0
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const im = new Image()
  im.onload = () => {
    const iw = im.naturalWidth || 300
    const ih = im.naturalHeight || 300
    const k = Math.min((W0 * (1 - 2 * pad)) / iw, (H0 * (1 - 2 * pad)) / ih)
    const g = c.getContext('2d')!
    g.clearRect(0, 0, W0, H0)
    if (bg) {
      g.fillStyle = bg
      g.fillRect(0, 0, W0, H0)
    }
    g.imageSmoothingQuality = 'high'
    g.drawImage(im, (W0 - iw * k) / 2, (H0 - ih * k) / 2, iw * k, ih * k)
    t.needsUpdate = true
    onLoad()
  }
  im.width = 512
  im.height = 512
  im.src = url
  return t
}
/** a mark on a white tile (the rule 54 white tile), never moving */
function markTile(url: string, w: number, h: number, redraw: () => void): THREE.Group {
  const g = new THREE.Group()
  g.add(box(w, h, 0.03, mat(C.white, { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.35 }), [0, 0, 0], Math.min(w, h) * 0.14))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: markTex(url, w / h, redraw), transparent: true, toneMapped: false }))
  face.position.z = 0.017
  g.add(face)
  return g
}

/* ---- canvas glyphs (icons only, no words) */
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
function camGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string) {
  g.fillStyle = col
  rr(g, cx - s * 0.5, cy - s * 0.3, s, s * 0.66, s * 0.12)
  g.fill()
  rr(g, cx - s * 0.2, cy - s * 0.42, s * 0.4, s * 0.16, s * 0.05)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.arc(cx, cy + s * 0.03, s * 0.2, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = col
  g.beginPath()
  g.arc(cx, cy + s * 0.03, s * 0.12, 0, Math.PI * 2)
  g.fill()
}
function contactGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string) {
  g.fillStyle = col
  rr(g, cx - s * 0.4, cy - s * 0.48, s * 0.8, s * 0.96, s * 0.1)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.arc(cx, cy - s * 0.12, s * 0.15, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.ellipse(cx, cy + s * 0.24, s * 0.26, s * 0.16, 0, Math.PI, 0)
  g.fill()
}
function lockGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, open: number, col: string) {
  g.strokeStyle = col
  g.lineWidth = s * 0.14
  g.lineCap = 'round'
  g.beginPath()
  const lift = open * s * 0.22
  g.arc(cx + open * s * 0.18, cy - s * 0.12 - lift, s * 0.22, Math.PI, 0)
  g.lineTo(cx + open * s * 0.18 + s * 0.22, cy + s * 0.02 - lift)
  g.moveTo(cx + open * s * 0.18 - s * 0.22, cy - s * 0.12 - lift)
  g.lineTo(cx + open * s * 0.18 - s * 0.22, cy - (open > 0.5 ? s * 0.2 : 0) - lift)
  g.stroke()
  g.fillStyle = col
  rr(g, cx - s * 0.34, cy - s * 0.04, s * 0.68, s * 0.5, s * 0.1)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.beginPath()
  g.arc(cx, cy + s * 0.18, s * 0.07, 0, Math.PI * 2)
  g.fill()
}
function tickGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string, k = 1) {
  g.strokeStyle = col
  g.lineWidth = s * 0.18
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx - s * 0.32, cy)
  const a = clamp01(k * 2)
  g.lineTo(cx - s * 0.32 + s * 0.22 * a, cy + s * 0.22 * a)
  if (k > 0.5) {
    const b = clamp01(k * 2 - 1)
    g.lineTo(cx - s * 0.1 + s * 0.44 * b, cy + s * 0.22 - s * 0.5 * b)
  }
  g.stroke()
}
function crossGlyph(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string) {
  g.strokeStyle = col
  g.lineWidth = s * 0.16
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(cx - s * 0.25, cy - s * 0.25)
  g.lineTo(cx + s * 0.25, cy + s * 0.25)
  g.moveTo(cx + s * 0.25, cy - s * 0.25)
  g.lineTo(cx - s * 0.25, cy + s * 0.25)
  g.stroke()
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = CastSprite
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; density: () => number; redraw: () => void }): Sprite {
  const { density, redraw, ...rest } = o
  return castSprite({ ...rest, shadow: 0.2, adaptive: { density, stageH: H, floor: 128 }, onReady: redraw })
}
function faceAt(c: number, L: number, keys: [number, string][]): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - L
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - L
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}
const who = (base: CharacterConfig, o: { name: string; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: CharacterConfig['accessories']; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone']; gender?: CharacterConfig['gender'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: o.accessories ?? base.accessories,
  build: { ...base.build, ...o.build },
})

/* ---- role clothing (rig body frame 400 x 600, head-local skull centre 0,0) */
const GUARD_CAP = (crown: string, band: string) => (
  <g data-part="guard-cap">
    <path d="M -64 -50 C -70 -104 70 -104 64 -50 Z" fill={crown} />
    <path d="M -50 -88 C -20 -100 20 -100 50 -88" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-65} y={-62} width={130} height={15} rx={4} fill={band} />
    <path d="M -10 -86 L 0 -94 L 10 -86 L 7 -74 L -7 -74 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -60 -48 Q 0 -26 60 -48 L 56 -54 Q 0 -38 -56 -54 Z" fill="#141B2E" />
  </g>
)
const GUARD_UNIFORM = (trim: string) => (
  <g data-part="uniform">
    <path d="M 140 212 L 178 206 L 180 218 L 142 224 Z" fill={trim} />
    <path d="M 260 212 L 222 206 L 220 218 L 258 224 Z" fill={trim} />
    <path d="M 226 246 L 231 236 L 236 246 L 247 247 L 239 254 L 241 265 L 231 259 L 221 265 L 223 254 L 215 247 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <rect x={150} y={250} width={30} height={22} rx={3} fill="none" stroke={trim} strokeWidth={2.5} />
  </g>
)
/** an ID card on a lanyard, body frame (staff blue, visitor orange, the other account teal) */
const LANYARD = (strap: string, card: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 194 266 M 214 206 L 206 266" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={185} y={264} width={30} height={38} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <rect x={191} y={270} width={18} height={13} rx={2} fill={card} opacity={0.75} />
    <rect x={191} y={287} width={18} height={3} rx={1.5} fill={card} opacity={0.45} />
    <rect x={191} y={293} width={12} height={3} rx={1.5} fill={card} opacity={0.45} />
  </g>
)

/* ---- the people of T13 */
const EMPLOYEE = who(CAST_PRESETS.meera, {
  name: 'Employee',
  skinTone: 'wheatish',
  hair: { style: 'bun', color: 'black' },
  outfit: { top: 'blouse', topColor: '#E8F0FF', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' },
  accessories: { earrings: true, watch: true },
})
const GUARD = who(CAST_PRESETS.rohan, {
  name: 'Office Guard',
  skinTone: 'dusky',
  hair: { style: 'short', color: 'black' },
  outfit: { top: 'shirt', topColor: '#43557F', bottom: 'trousers', bottomColor: '#26304D', shoeColor: '#1E1E24' },
  accessories: { beard: 'stubble', belt: true, watch: true },
  build: { height: 1.02, shoulders: 1.05 },
})
const VISITOR = who(CAST_PRESETS.riya, {
  name: 'Visitor',
  skinTone: 'fair',
  hair: { style: 'bob', color: 'brown' },
  outfit: { top: 'kurta', topColor: '#F6C531', bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#5A3A2A' },
  accessories: { glasses: 'round', earrings: true },
})
const IAM_USER = who(CAST_PRESETS.ananya, {
  name: 'IAM User',
  gender: 'female',
  skinTone: 'medium',
  hair: { style: 'ponytail', color: 'black' },
  outfit: { top: 'polo', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#24324F', shoeColor: '#2A2A30' },
  accessories: { earrings: true, watch: true },
})
const PRINCIPAL = who(CAST_PRESETS.kabir, {
  name: 'Principal From Another Account',
  skinTone: 'wheatish',
  hair: { style: 'curly', color: 'black' },
  outfit: { top: 'shirt', topColor: '#F28C38', bottom: 'jeans', bottomColor: '#2E3A55', shoeColor: '#5A3A2A' },
  accessories: { beard: 'short', glasses: 'rect' },
})
/* ---- the people of T16 */
const CAFE = who(CAST_PRESETS.riya, {
  name: 'Phone Owner',
  skinTone: 'medium',
  hair: { style: 'wavy', color: 'darkBrown' },
  outfit: { top: 'hoodie', topColor: '#F08A9C', bottom: 'jeans', bottomColor: '#2E3A55', shoeColor: '#FFFFFF' },
  accessories: { earrings: true },
})
const DEV = who(CAST_PRESETS.dev, {
  name: 'IAM User With Tablet',
  skinTone: 'fair',
  hair: { style: 'sidePart', color: 'brown' },
  outfit: { top: 'tshirt', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#24324F', shoeColor: '#2A2A30' },
  accessories: { glasses: 'rect', watch: true },
})

/* ------------------------------------------------------------------ stage plumbing */

function densityOf(ref: RefObject<HTMLDivElement | null>) {
  const r = ref.current?.getBoundingClientRect()
  const zoom = r && r.width > 0 ? r.width / W : 1
  return Math.max(2, Math.min(4, Math.max(zoom, 1) * (window.devicePixelRatio || 1)))
}
function Stage({ step, setup, holdT }: { step: number; holdT: number; setup: (k: StageKit, density: () => number) => Update }): ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={devHold(holdT)} setup={(k) => setup(k, () => densityOf(ref))} />
    </div>
  )
}

/* ================================================================== T13 · the shared plan */

const L13 = 8
const P13 = {
  wallZ: 0,
  wallH: 3.8,
  doorL: [-1.92, -1.06] as [number, number], // left opening, x
  doorR: [0.9, 1.76] as [number, number], // right opening, x
  doorH: 2.1,
  reader: [-0.82, 1.18, 0.12] as THREE.Vector3Tuple,
  left: [-0.46, 0, 0.62] as THREE.Vector3Tuple,
  mid: [0.38, 0, 0.66] as THREE.Vector3Tuple,
  right: [2.16, 0, 0.7] as THREE.Vector3Tuple,
}
/* the left beat (her own card opens the door) and the right beat (the room's list lets the visitor in) */
const T13 = {
  reachA: 0.25, reachB: 0.7, beep: 0.72, backA: 1.05, backB: 1.45,
  openA: 0.85, openB: 1.55, closeA: 3.3, closeB: 4.0,
  checkA: 3.95, checkB: 4.35, scanA: 4.35, scanB: 5.0, tick: 5.05, nodA: 5.1, nodB: 5.4, waveA: 5.25, waveB: 6.5,
  swingA: 5.35, swingB: 6.15, shutA: 7.05, shutB: 7.75, untickA: 7.6, untickB: 7.95,
}

function frame13(kit: StageKit) {
  const { camera, scene } = kit
  camera.fov = 32
  camera.position.set(0.3, 2.1, 7.0)
  camera.lookAt(0.3, 1.18, -0.2)
  lightRig(scene, [0, 0.8, -0.5])
}

/** the floor and the back wall with its two openings; returns nothing to animate */
function shell13(scene: THREE.Scene, o: { floor: string; wall: string; trim: string; inside: string; insideFloor: string }) {
  scene.add(flat(mesh(new THREE.PlaneGeometry(14, 10), mat(o.floor, { roughness: 0.9 }), [0, 0, 2])))
  scene.add(flat(mesh(new THREE.PlaneGeometry(14, 4), mat(o.insideFloor, { roughness: 0.8 }), [0, 0.002, -2])))
  const wm = mat(o.wall, { roughness: 0.85 })
  const t = 0.2
  const seg = (x0: number, x1: number, y0 = 0, y1 = P13.wallH) => scene.add(box(x1 - x0, y1 - y0, t, wm, [(x0 + x1) / 2, (y0 + y1) / 2, P13.wallZ]))
  seg(-6, P13.doorL[0])
  seg(P13.doorL[1], P13.doorR[0])
  seg(P13.doorR[1], 6)
  seg(P13.doorL[0], P13.doorL[1], P13.doorH, P13.wallH)
  seg(P13.doorR[0], P13.doorR[1], P13.doorH, P13.wallH)
  /* skirting along the wall, door frames */
  const trim = mat(o.trim, { roughness: 0.5 })
  scene.add(box(12, 0.1, 0.03, trim, [0, 0.05, P13.wallZ + 0.115]))
  for (const [x0, x1] of [P13.doorL, P13.doorR]) {
    scene.add(box(0.07, P13.doorH + 0.07, 0.26, trim, [x0 - 0.035, (P13.doorH + 0.07) / 2, P13.wallZ]))
    scene.add(box(0.07, P13.doorH + 0.07, 0.26, trim, [x1 + 0.035, (P13.doorH + 0.07) / 2, P13.wallZ]))
    scene.add(box(x1 - x0 + 0.14, 0.07, 0.26, trim, [(x0 + x1) / 2, P13.doorH + 0.035, P13.wallZ]))
  }
  /* the rooms behind: a back wall far enough to read as a room */
  scene.add(box(12, P13.wallH, 0.2, mat(o.inside, { roughness: 0.9 }), [0, P13.wallH / 2, -3.4]))
  /* a ceiling strip above the camera's view keeps the rooms lit from above */
}

/** the reader on the wall: a dark body, a pad, an LED that turns green */
function reader(scene: THREE.Scene): THREE.MeshStandardMaterial {
  const [x, y, z] = P13.reader
  scene.add(box(0.15, 0.24, 0.05, mat('#2A3550', { roughness: 0.4 }), [x, y, z], 0.02))
  scene.add(box(0.1, 0.1, 0.012, mat('#3E4C6E', { roughness: 0.3, metalness: 0.4 }), [x, y - 0.03, z + 0.03], 0.01))
  const led = glow('#BFD3FF', C.brand, 0.8)
  scene.add(box(0.06, 0.02, 0.012, led, [x, y + 0.08, z + 0.03], 0.005))
  return led
}
function setLed(m: THREE.MeshStandardMaterial, on: number) {
  m.color.set(on > 0.5 ? '#C7F5DA' : '#BFD3FF')
  m.emissive.set(on > 0.5 ? C.green : C.brand)
  m.emissiveIntensity = on > 0.5 ? 1.1 : 0.7
}

/** the card she holds: a little white card with her photo block, the concept's carries the policy mark */
function heldCard(face: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.15, 0.1, 0.008, [mat('#EEF2FA'), mat('#EEF2FA'), mat('#EEF2FA'), mat('#EEF2FA'), face, mat('#FFFFFF')], [0, 0, 0], 0))
  return g
}

/** the left person's arm: card held at her chest, raised to the reader, back */
function tapPose(p: Pose, c: number) {
  /* idle: the card held up in front of her (screen-left hand) */
  to(p, 'shoulderL', 16, 1)
  to(p, 'elbowL', 100, 1)
  const reach = hold(c, T13.reachA, T13.reachB, T13.backA, T13.backB)
  to(p, 'shoulderL', 70, reach)
  to(p, 'elbowL', 18, reach)
  to(p, 'wristL', -10, reach)
  to(p, 'lean', -3, reach)
  to(p, 'headTurn', -0.45, hold(c, T13.reachA - 0.15, T13.reachA + 0.2, T13.closeA, T13.closeA + 0.4))
  to(p, 'lookX', -0.8, hold(c, T13.reachA - 0.15, T13.reachA + 0.2, T13.closeA, T13.closeA + 0.4))
  /* she watches the right-hand beat too (the room the visitor waits at) */
  const watch = hold(c, T13.checkA, T13.checkB, T13.shutA, T13.shutB)
  to(p, 'headTurn', 0.35, watch)
  to(p, 'lookX', 0.75, watch)
}
/* the card's two places (scene units), measured against the rig: held at her chest, pressed on the reader */
const cardAt = (c: number, base: THREE.Vector3Tuple): THREE.Vector3Tuple => {
  const reach = hold(c, T13.reachA, T13.reachB, T13.backA, T13.backB)
  const heldPos: THREE.Vector3Tuple = [base[0] - 0.2, 1.06, base[2] + 0.14]
  const tapPos: THREE.Vector3Tuple = [P13.reader[0] + 0.02, P13.reader[1] - 0.03, P13.reader[2] + 0.06]
  return [lerp(heldPos[0], tapPos[0], reach), lerp(heldPos[1], tapPos[1], reach), lerp(heldPos[2], tapPos[2], reach)]
}

/** the guard / the board in the middle: looks down at the list, nods, opens a hand toward the right doorway */
function guardPose(p: Pose, c: number) {
  /* the clipboard held in front with both hands */
  to(p, 'shoulderR', 14, 1)
  to(p, 'elbowR', 104, 1)
  to(p, 'shoulderL', 14, 1)
  to(p, 'elbowL', 104, 1)
  const check = hold(c, T13.checkA, T13.checkB, T13.tick + 0.05, T13.tick + 0.35)
  to(p, 'headNod', 0.45, check)
  to(p, 'lookY', 0.85, check)
  /* the visitor is on his left (viewer's right) */
  const look = hold(c, T13.tick, T13.tick + 0.3, T13.shutA, T13.shutA + 0.4)
  to(p, 'headTurn', 0.45, look)
  to(p, 'lookX', 0.85, look)
  to(p, 'headNod', 0.3, hold(c, T13.nodA, T13.nodA + 0.15, T13.nodA + 0.15, T13.nodB))
  /* the welcoming open hand (screen-right arm) toward the door */
  const wave = hold(c, T13.waveA, T13.waveA + 0.4, T13.waveB - 0.4, T13.waveB)
  to(p, 'shoulderR', 64, wave)
  to(p, 'elbowR', 26, wave)
  to(p, 'wristR', 8, wave)
  to(p, 'palmR', 1, wave)
}
function visitorPose(p: Pose, c: number) {
  /* waits facing the guard (viewer's left) */
  to(p, 'headTurn', -0.35, 1)
  to(p, 'lookX', -0.7, 1)
  to(p, 'shoulderR', 12, 1)
  to(p, 'elbowR', 30, 1)
  /* looks at the door as it opens, a small thank-you nod */
  const door = hold(c, T13.swingA, T13.swingA + 0.3, T13.shutA, T13.shutA + 0.4)
  to(p, 'headTurn', -0.55, door)
  to(p, 'headNod', 0.2, hold(c, T13.tick + 0.2, T13.tick + 0.35, T13.tick + 0.35, T13.tick + 0.6))
}

/* ================================================================== T13 · EVERYDAY · office floor */

function setup13Everyday(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame13(kit)
  shell13(scene, { floor: '#D9CBB3', wall: '#F4EDE2', trim: '#B98D62', inside: '#EAF1FA', insideFloor: '#CDB89A' })

  /* LEFT · the office behind glass: two desks with monitors, a plant */
  for (const x of [-1.85, -1.15]) {
    scene.add(box(0.6, 0.06, 0.45, mat('#C99A6B', { roughness: 0.6 }), [x, 0.74, -1.6], 0.02))
    scene.add(box(0.05, 0.72, 0.4, mat('#8B6A4A'), [x - 0.26, 0.37, -1.6]))
    scene.add(box(0.05, 0.72, 0.4, mat('#8B6A4A'), [x + 0.26, 0.37, -1.6]))
    scene.add(box(0.34, 0.22, 0.03, glow('#BFD3FF', '#6E9BFF', 0.45), [x, 0.92, -1.72], 0.02))
  }
  scene.add(cyl(0.12, 0.1, 0.3, mat('#C8693E'), [-2.45, 0.15, -1.2]))
  scene.add(mesh(new THREE.SphereGeometry(0.24, 20, 16), mat('#5FAE5C', { roughness: 0.9 }), [-2.45, 0.5, -1.2]))
  const officeLight = glow('#FFF6DD', '#FFE3A0', 0.2)
  scene.add(box(1.4, 0.04, 0.4, officeLight, [-1.55, 2.4, -1.5]))
  /* the sliding glass doors */
  const glass = new THREE.MeshStandardMaterial({ color: '#D7E8F7', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.42 })
  const rail = mat('#9AA6BA', { roughness: 0.3, metalness: 0.7 })
  const dw = (P13.doorL[1] - P13.doorL[0]) / 2
  const panels = [0, 1].map((i) => {
    const g = new THREE.Group()
    g.add(box(dw, P13.doorH - 0.04, 0.03, glass, [0, (P13.doorH - 0.04) / 2, 0]))
    g.add(box(0.025, P13.doorH - 0.04, 0.04, rail, [i ? -dw / 2 + 0.012 : dw / 2 - 0.012, (P13.doorH - 0.04) / 2, 0]))
    g.add(box(0.02, 0.36, 0.05, rail, [i ? -dw / 2 + 0.07 : dw / 2 - 0.07, 1.05, 0.03]))
    scene.add(g)
    return g
  })
  const readerLed = reader(scene)
  /* her card: a blue staff card with a photo block */
  const cardFace = new THREE.MeshStandardMaterial({
    map: canvasTex(150, 100, (g) => {
      g.fillStyle = '#FFFFFF'
      g.fillRect(0, 0, 150, 100)
      g.fillStyle = C.brand
      g.fillRect(0, 0, 150, 24)
      g.fillStyle = '#C9D8FF'
      rr(g, 12, 34, 40, 50, 6)
      g.fill()
      g.fillStyle = '#7FA6FF'
      g.beginPath()
      g.arc(32, 52, 10, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#D5DCE8'
      for (const [y, w] of [[42, 70], [58, 56], [72, 40]]) {
        rr(g, 64, y, w, 7, 3.5)
        g.fill()
      }
    }),
    roughness: 0.5,
  })
  const card = heldCard(cardFace)
  scene.add(card)

  /* MIDDLE · a framed picture on the wall between the doors (the office's own) */
  scene.add(box(0.7, 0.5, 0.03, mat('#B98D62'), [0.0, 1.8, 0.12], 0.02))
  scene.add(box(0.6, 0.4, 0.01, mat('#CFE4FA', { roughness: 0.6 }), [0.0, 1.8, 0.14]))
  scene.add(mesh(new THREE.CircleGeometry(0.08, 24), mat(C.gold), [0.12, 1.88, 0.15]))
  /* the guard's clipboard: a board, the list of faces, the tick that lands on the visitor's row */
  const listTex = liveTex(120, 160)
  const paintList = (scan: number, tick: number) =>
    listTex.paint((g) => {
      g.fillStyle = '#FFFFFF'
      g.fillRect(0, 0, 120, 160)
      const faces = ['#7FA6FF', '#F6C531', '#3DBB7A', '#C99A6B']
      faces.forEach((col, i) => {
        const y = 22 + i * 34
        if (scan > 0 && Math.abs(scan - i) < 0.6) {
          g.fillStyle = 'rgba(45,99,251,0.14)'
          g.fillRect(4, y - 14, 112, 28)
        }
        g.fillStyle = col
        g.beginPath()
        g.arc(22, y - 3, 7, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.ellipse(22, y + 10, 11, 6, 0, Math.PI, 0)
        g.fill()
        g.fillStyle = '#D5DCE8'
        rr(g, 40, y - 4, 44, 7, 3.5)
        g.fill()
        if (i === 1 && tick > 0) tickGlyph(g, 100, y - 2, 22, C.green, tick)
      })
    })
  paintList(0, 0)
  const clip = new THREE.Group()
  clip.add(box(0.24, 0.32, 0.015, mat('#B07A4A', { roughness: 0.6 }), [0, 0, 0], 0.01))
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.27), new THREE.MeshStandardMaterial({ map: listTex.tex, roughness: 0.7 }))
  sheet.position.set(0, -0.015, 0.009)
  clip.add(sheet)
  clip.add(box(0.09, 0.03, 0.02, mat('#C9D3E6', { metalness: 0.7, roughness: 0.3 }), [0, 0.15, 0.012], 0.005))
  clip.position.set(P13.mid[0], 1.02, P13.mid[2] + 0.2)
  clip.rotation.x = -0.35
  scene.add(clip)

  /* RIGHT · the restricted room: a solid door with a gold lock emblem, a safe and a filing cabinet inside */
  scene.add(box(0.5, 0.9, 0.45, mat('#7C8BAA', { roughness: 0.4, metalness: 0.5 }), [1.25, 0.45, -1.7], 0.03))
  scene.add(box(0.55, 1.3, 0.45, mat('#5B6A8C', { roughness: 0.45, metalness: 0.4 }), [1.75, 0.65, -1.9], 0.03))
  for (let i = 0; i < 3; i++) scene.add(box(0.4, 0.03, 0.02, mat('#C9D3E6'), [1.75, 0.3 + i * 0.4, -1.67]))
  const roomLight = glow('#FFF6DD', '#FFE3A0', 0.1)
  scene.add(box(0.9, 0.04, 0.4, roomLight, [1.43, 2.4, -1.5]))
  const dW = P13.doorR[1] - P13.doorR[0]
  const hinge = new THREE.Group()
  hinge.position.set(P13.doorR[1], 0, P13.wallZ - 0.02)
  const leaf = new THREE.Group()
  leaf.position.set(-dW / 2, 0, 0)
  leaf.add(box(dW - 0.02, P13.doorH - 0.02, 0.05, mat('#8B5E34', { roughness: 0.55 }), [0, (P13.doorH - 0.02) / 2, 0]))
  for (const y of [0.6, 1.45]) leaf.add(box(dW - 0.24, 0.55, 0.012, mat('#7A4F2A', { roughness: 0.6 }), [0, y, 0.03]))
  /* the gold lock emblem: a restricted room, without a word */
  const emb = new THREE.Group()
  emb.position.set(0, 1.62, 0.045)
  emb.add(mesh(new THREE.CircleGeometry(0.12, 32), mat('#2A3550', { roughness: 0.4 }), [0, 0, 0]))
  emb.add(box(0.1, 0.08, 0.02, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, -0.02, 0.01], 0.01))
  emb.add(mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 20, Math.PI), mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, 0.03, 0.01]))
  leaf.add(emb)
  leaf.add(box(0.04, 0.04, 0.06, mat('#F2D27A', { roughness: 0.25, metalness: 0.85 }), [-dW / 2 + 0.1, 1.05, 0.04], 0.01))
  hinge.add(leaf)
  scene.add(hinge)

  /* people */
  const employee = rigSprite({
    config: EMPLOYEE,
    dress: (k) => ({ ...k, top: <>{k.top}{LANYARD(C.brand, C.brand)}</> }),
    loop: L13,
    frames: 80,
    height: 1.66,
    density,
    redraw,
    timeline: (c) => ({ seed: 31, idle: CAST_IDLE, ...faceAt(c, L13, [[0, 'neutral'], [0.25, 'thinking'], [0.8, 'happy'], [3.6, 'listening'], [5.1, 'happy'], [7.7, 'neutral']]) }),
    pose: tapPose,
  })
  employee.object.position.set(...P13.left)
  scene.add(employee.object)
  const guard = rigSprite({
    config: GUARD,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{GUARD_CAP('#2A3550', '#141B2E')}</>, top: <>{k.top}{GUARD_UNIFORM('#141B2E')}</> }),
    loop: L13,
    frames: 80,
    height: 1.76,
    density,
    redraw,
    timeline: (c) => ({ seed: 43, idle: CAST_IDLE, ...faceAt(c, L13, [[0, 'neutral'], [3.95, 'thinking'], [5.05, 'happy'], [6.6, 'proud'], [7.7, 'neutral']]) }),
    pose: guardPose,
  })
  guard.object.position.set(...P13.mid)
  scene.add(guard.object)
  const visitor = rigSprite({
    config: VISITOR,
    dress: (k) => ({ ...k, top: <>{k.top}{LANYARD(C.orange, C.orange)}</> }),
    loop: L13,
    frames: 80,
    height: 1.62,
    density,
    redraw,
    timeline: (c) => ({ seed: 57, idle: CAST_IDLE, ...faceAt(c, L13, [[0, 'neutral'], [3.95, 'worried'], [5.05, 'happy'], [6.2, 'excited'], [7.6, 'neutral']]) }),
    pose: visitorPose,
  })
  visitor.object.position.set(...P13.right)
  scene.add(visitor.object)

  let lastQ = -1
  return (t) => {
    const c = mod(t, L13)
    /* left: her own card opens the glass door */
    card.position.set(...cardAt(c, P13.left))
    setLed(readerLed, hold(c, T13.beep, T13.beep + 0.05, T13.closeB, T13.closeB + 0.05))
    const open = seg(c, T13.openA, T13.openB) * (1 - seg(c, T13.closeA, T13.closeB))
    panels[0].position.set(P13.doorL[0] + dw / 2 - open * dw * 0.92, 0, P13.wallZ + 0.02)
    panels[1].position.set(P13.doorL[1] - dw / 2 + open * dw * 0.92, 0, P13.wallZ + 0.04)
    officeLight.emissiveIntensity = 0.2 + 0.7 * open
    /* right: the list finds her face, the tick lands, the restricted door swings open */
    const scan = c > T13.scanA && c < T13.tick ? lerp(0, 1, seg(c, T13.scanA, T13.scanB)) : c >= T13.tick && c < T13.untickA ? 1 : 0
    const tick = seg(c, T13.tick, T13.tick + 0.3) * (1 - seg(c, T13.untickA, T13.untickB))
    const q = Math.round(scan * 20) * 100 + Math.round(tick * 20)
    if (q !== lastQ) {
      lastQ = q
      paintList(c > T13.scanA && c < T13.untickA ? scan : 0, tick)
    }
    const swing = seg(c, T13.swingA, T13.swingB) * (1 - seg(c, T13.shutA, T13.shutB))
    hinge.rotation.y = -swing * 1.35
    roomLight.emissiveIntensity = 0.1 + 0.8 * swing
    employee.update(c, camera)
    guard.update(c, camera)
    visitor.update(c, camera)
  }
}

/* ================================================================== T13 · CONCEPT · the cloud account */

function setup13Concept(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame13(kit)
  shell13(scene, { floor: '#DCE3EF', wall: '#EEF2F9', trim: '#9AA6BA', inside: '#E1E8F4', insideFloor: '#CBD5E5' })

  /* LEFT · the server room behind glass: a rack whose lights come up when her card opens the door */
  const leds: THREE.MeshStandardMaterial[] = []
  for (const x of [-1.86, -1.26]) {
    const rack = new THREE.Group()
    rack.add(box(0.5, 1.7, 0.45, mat(C.navy, { roughness: 0.45, metalness: 0.35 }), [0, 0.85, 0], 0.03))
    for (let i = 0; i < 7; i++) {
      rack.add(box(0.42, 0.13, 0.02, mat('#2B3D7A', { roughness: 0.4 }), [0, 0.3 + i * 0.19, 0.235]))
      const lm = glow('#9CC2FF', '#4C8DFF', 0.3)
      leds.push(lm)
      rack.add(box(0.04, 0.025, 0.02, lm, [0.15, 0.3 + i * 0.19, 0.25]))
    }
    rack.position.set(x, 0, -1.7)
    scene.add(rack)
  }
  const roomGlow = glow('#E6F0FF', '#7FB0FF', 0.15)
  scene.add(box(1.4, 0.04, 0.4, roomGlow, [-1.55, 2.4, -1.5]))
  const glass = new THREE.MeshStandardMaterial({ color: '#CFE3FF', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.42 })
  const edge = glow('#BFD3FF', C.brand, 0.5)
  const dw = (P13.doorL[1] - P13.doorL[0]) / 2
  const panels = [0, 1].map((i) => {
    const g = new THREE.Group()
    g.add(box(dw, P13.doorH - 0.04, 0.03, glass, [0, (P13.doorH - 0.04) / 2, 0]))
    g.add(box(0.025, P13.doorH - 0.04, 0.04, edge, [i ? -dw / 2 + 0.012 : dw / 2 - 0.012, (P13.doorH - 0.04) / 2, 0]))
    scene.add(g)
    return g
  })
  const readerLed = reader(scene)
  /* her policy card: the IAM permissions mark on a white card (the policy attached to HER) */
  const policyFace = new THREE.MeshStandardMaterial({ map: markTex(permUrl, 1.5, redraw, 0.14, '#FFFFFF'), roughness: 0.5 })
  const card = heldCard(policyFace)
  scene.add(card)

  /* MIDDLE · the bucket policy board, bolted to the bucket by a bracket: faces of the principals it names */
  const listTex = liveTex(120, 160)
  const paintList = (scan: number, tick: number) =>
    listTex.paint((g) => {
      g.fillStyle = '#FFFFFF'
      g.fillRect(0, 0, 120, 160)
      g.fillStyle = '#EEF3FF'
      g.fillRect(0, 0, 120, 160)
      const faces = ['#14B8A6', '#F28C38', '#7FA6FF']
      faces.forEach((col, i) => {
        const y = 30 + i * 46
        if (scan > 0 && Math.abs(scan * 1 - i) < 0.6) {
          g.fillStyle = 'rgba(45,99,251,0.16)'
          g.fillRect(4, y - 18, 112, 36)
        }
        g.fillStyle = col
        g.beginPath()
        g.arc(26, y - 4, 9, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.ellipse(26, y + 13, 14, 8, 0, Math.PI, 0)
        g.fill()
        g.fillStyle = '#C9D3E6'
        rr(g, 48, y - 4, 36, 8, 4)
        g.fill()
        if (i === 1 && tick > 0) tickGlyph(g, 100, y - 1, 26, C.green, tick)
      })
    })
  paintList(0, 0)
  const board = new THREE.Group()
  board.add(box(0.5, 0.66, 0.04, mat(C.white, { roughness: 0.45 }), [0, 0, 0], 0.03))
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: listTex.tex, toneMapped: false }))
  sheet.position.z = 0.022
  board.add(sheet)
  /* the IAM permissions mark on the board's top edge: this list IS a policy */
  const pm = markTile(permUrl, 0.16, 0.16, redraw)
  pm.position.set(0.25, 0.33, 0.03)
  board.add(pm)
  board.position.set(P13.mid[0] + 0.05, 1.12, 0.38)
  scene.add(board)
  scene.add(box(0.05, 0.8, 0.05, mat('#9AA6BA', { metalness: 0.6, roughness: 0.3 }), [P13.mid[0] + 0.05, 0.4, 0.36]))
  /* the bracket from the board to the bucket: attached to the resource */
  scene.add(box(0.95, 0.05, 0.05, mat('#9AA6BA', { metalness: 0.6, roughness: 0.3 }), [P13.mid[0] + 0.55, 1.0, 0.36]))

  /* RIGHT · the S3 bucket in the doorway (the room's place), lid shut; objects inside */
  const bx = (P13.doorR[0] + P13.doorR[1]) / 2
  const bz = 0.42
  const bucketMat = mat('#3F8624', { roughness: 0.4, metalness: 0.15 })
  const bucket = new THREE.Group()
  bucket.position.set(bx, 0, bz)
  const shell = mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.95, 48, 1, true), bucketMat, [0, 0.5, 0])
  ;(shell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
  bucket.add(shell)
  bucket.add(cyl(0.32, 0.32, 0.03, bucketMat, [0, 0.03, 0]))
  bucket.add(mesh(new THREE.TorusGeometry(0.42, 0.022, 10, 48), mat('#DDEFD3', { roughness: 0.3 }), [0, 0.97, 0]).rotateX(Math.PI / 2))
  bucket.add(mesh(new THREE.TorusGeometry(0.37, 0.016, 10, 48), mat('#DDEFD3', { roughness: 0.3 }), [0, 0.52, 0]).rotateX(Math.PI / 2))
  scene.add(bucket)
  /* the official S3 bucket mark on a white tile on its front */
  const tile = markTile(s3BucketUrl, 0.3, 0.3, redraw)
  tile.position.set(bx, 0.62, bz + 0.38)
  tile.rotation.x = -0.1
  scene.add(tile)
  const lidHinge = new THREE.Group()
  lidHinge.position.set(bx, 0.99, bz - 0.42)
  const lid = new THREE.Group()
  lid.position.set(0, 0, 0.42)
  lid.add(cyl(0.45, 0.45, 0.05, mat('#2F6B1A', { roughness: 0.35 }), [0, 0.02, 0]))
  lid.add(box(0.16, 0.05, 0.05, mat('#DDEFD3', { roughness: 0.3 }), [0, 0.07, 0], 0.02))
  lidHinge.add(lid)
  scene.add(lidHinge)
  /* the object that rises to her: the official S3 object mark on a white cube face */
  const objFace = new THREE.MeshStandardMaterial({ map: markTex(s3ObjectUrl, 1, redraw, 0.16, '#FFFFFF'), roughness: 0.45 })
  const objSide = mat('#FFFFFF', { roughness: 0.45 })
  const obj = box(0.2, 0.2, 0.2, [objSide, objSide, objSide, objSide, objFace, objSide], [bx, 0.7, bz])
  scene.add(obj)
  /* her tile: the AWS account group mark on the floor under her (she belongs to ANOTHER account) */
  const acct = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: '#E7F7F1', transparent: true, opacity: 0.95 })))
  acct.position.set(P13.right[0], 0.004, P13.right[2])
  scene.add(acct)
  const acctEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.8, 0.8)), new THREE.LineDashedMaterial({ color: '#E7157B', dashSize: 0.06, gapSize: 0.04 }))
  acctEdge.rotation.x = -Math.PI / 2
  acctEdge.position.set(P13.right[0], 0.006, P13.right[2])
  acctEdge.computeLineDistances()
  scene.add(acctEdge)
  const acctMark = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: markTex(accountUrl, 1, redraw, 0.04), transparent: true, toneMapped: false })))
  acctMark.position.set(P13.right[0] - 0.26, 0.007, P13.right[2] + 0.26)
  scene.add(acctMark)

  /* people */
  const user = rigSprite({
    config: IAM_USER,
    dress: (k) => ({ ...k, top: <>{k.top}{LANYARD(C.brand, C.brand)}</> }),
    loop: L13,
    frames: 80,
    height: 1.66,
    density,
    redraw,
    timeline: (c) => ({ seed: 61, idle: CAST_IDLE, ...faceAt(c, L13, [[0, 'neutral'], [0.25, 'thinking'], [0.8, 'happy'], [3.6, 'listening'], [5.1, 'happy'], [7.7, 'neutral']]) }),
    pose: tapPose,
  })
  user.object.position.set(...P13.left)
  scene.add(user.object)
  const principal = rigSprite({
    config: PRINCIPAL,
    dress: (k) => ({ ...k, top: <>{k.top}{LANYARD('#14A37F', '#14A37F')}</> }),
    loop: L13,
    frames: 80,
    height: 1.74,
    density,
    redraw,
    timeline: (c) => ({ seed: 67, idle: CAST_IDLE, ...faceAt(c, L13, [[0, 'neutral'], [3.95, 'thinking'], [5.05, 'happy'], [6.2, 'proud'], [7.6, 'neutral']]) }),
    pose: (p, c) => {
      /* looks at the board, then at the bucket, then holds out a hand for the object */
      to(p, 'headTurn', -0.45, 1)
      to(p, 'lookX', -0.8, 1)
      const reach = hold(c, 5.9, 6.3, 7.0, 7.4)
      to(p, 'shoulderL', 46, reach)
      to(p, 'elbowL', 50, reach)
      to(p, 'palmL', 1, reach)
      to(p, 'headNod', 0.2, hold(c, T13.tick + 0.2, T13.tick + 0.35, T13.tick + 0.35, T13.tick + 0.6))
    },
  })
  principal.object.position.set(...P13.right)
  scene.add(principal.object)

  let lastQ = -1
  return (t) => {
    const c = mod(t, L13)
    card.position.set(...cardAt(c, P13.left))
    setLed(readerLed, hold(c, T13.beep, T13.beep + 0.05, T13.closeB, T13.closeB + 0.05))
    const open = seg(c, T13.openA, T13.openB) * (1 - seg(c, T13.closeA, T13.closeB))
    panels[0].position.set(P13.doorL[0] + dw / 2 - open * dw * 0.92, 0, P13.wallZ + 0.02)
    panels[1].position.set(P13.doorL[1] - dw / 2 + open * dw * 0.92, 0, P13.wallZ + 0.04)
    roomGlow.emissiveIntensity = 0.15 + 0.6 * open
    leds.forEach((m, i) => (m.emissiveIntensity = 0.25 + open * (0.5 + 0.5 * Math.max(0, Math.sin((c / L13) * Math.PI * 2 * (4 + (i % 3)) + i * 1.3)))))
    edge.emissiveIntensity = 0.5 + 0.4 * open
    /* the board finds her row, ticks it; the lid opens; an object rises and floats to her hand */
    const scan = c > T13.scanA && c < T13.tick ? seg(c, T13.scanA, T13.scanB) : c >= T13.tick && c < T13.untickA ? 1 : 0
    const tick = seg(c, T13.tick, T13.tick + 0.3) * (1 - seg(c, T13.untickA, T13.untickB))
    const q = Math.round(scan * 20) * 100 + Math.round(tick * 20)
    if (q !== lastQ) {
      lastQ = q
      paintList(c > T13.scanA && c < T13.untickA ? scan : 0, tick)
    }
    const lidUp = seg(c, T13.swingA, T13.swingB) * (1 - seg(c, T13.shutA, T13.shutB))
    lidHinge.rotation.x = -lidUp * 1.5
    const rise = seg(c, 5.7, 6.1)
    const fly = seg(c, 6.1, 6.8)
    const gone = seg(c, 6.95, 7.25)
    obj.visible = c > 5.6 && c < 7.3
    const hand: THREE.Vector3Tuple = [P13.right[0] - 0.42, 1.12, P13.right[2] + 0.16]
    obj.position.set(lerp(bx, hand[0], fly), lerp(0.7, 1.35, rise) + (hand[1] - 1.35) * fly + Math.sin(fly * Math.PI) * 0.12, lerp(bz, hand[2], fly))
    obj.rotation.y = (1 - fly) * 0.6
    obj.scale.setScalar(lerp(1, 0.7, fly) * (1 - gone) + 0.001)
    principal.update(c, camera)
    user.update(c, camera)
  }
}

/* ================================================================== T16 · the shared plan */

const L16 = 7.6
const T16 = {
  tapA: 0.2, tapB: 0.45, // the app opens (her thumb taps)
  blockA: 0.55, blockB: 0.85, // camera and contacts both locked
  promptA: 1.75, promptB: 2.15,
  allowA: 2.7, allowB: 2.95, // allow pressed
  openA: 3.0, openB: 3.4, // camera unlocks, viewfinder on
  snapA: 5.2, snapB: 5.5, // the photo
  resetA: 6.95, resetB: 7.35,
}
function frame16(kit: StageKit) {
  const { camera, scene } = kit
  camera.fov = 32
  camera.position.set(0.12, 1.5, 2.85)
  camera.lookAt(0.12, 1.24, -0.1)
  lightRig(scene, [0, 1, -0.3])
}
const P16 = { person: [-0.46, 0, -0.36] as THREE.Vector3Tuple, tableY: 0.94, tableZ: 0.02, device: [-0.1, 1.27, 0.12] as THREE.Vector3Tuple }

/** the holding pose: the device up in front, the screen-right hand; looks at it, at the thing it points at */
function holdPose(p: Pose, c: number) {
  to(p, 'shoulderR', 22, 1)
  to(p, 'elbowR', 112, 1)
  to(p, 'headTurn', 0.32, 1)
  to(p, 'lookX', 0.6, 1)
  to(p, 'lookY', 0.45, 1)
  to(p, 'headNod', 0.12, 1)
  /* the other hand comes up to press Allow */
  const press = hold(c, T16.allowA - 0.35, T16.allowA, T16.allowB + 0.1, T16.allowB + 0.45)
  to(p, 'shoulderL', 34, press)
  to(p, 'elbowL', 118, press)
  /* at the block, a small shake of the head */
  to(p, 'headTilt', 6 * Math.sin((c - T16.blockA) * 9) * hold(c, T16.blockA, T16.blockA + 0.1, T16.blockB + 0.5, T16.blockB + 0.8), 1)
  /* she glances at the coffee she wants to photograph */
  const coffee = hold(c, 3.6, 3.9, 4.6, 4.9)
  to(p, 'headTurn', 0.55, coffee)
  to(p, 'lookX', 0.9, coffee)
  to(p, 'lookY', 0.65, coffee)
}

/** the café / desk table: a top, a pedestal; returns nothing */
function table16(scene: THREE.Scene, top: string, leg: string) {
  scene.add(box(2.6, 0.06, 0.8, mat(top, { roughness: 0.5 }), [0.1, P16.tableY, P16.tableZ], 0.02))
  scene.add(box(2.5, 0.9, 0.7, mat(leg, { roughness: 0.7 }), [0.1, P16.tableY - 0.48, P16.tableZ - 0.02]))
}

/* ================================================================== T16 · EVERYDAY · the phone at a café */

function setup16Everyday(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame16(kit)
  /* the café: a warm back wall, shelves of jars, a pendant lamp, a window with a plant */
  scene.add(flat(mesh(new THREE.PlaneGeometry(10, 8), mat('#CDB89A', { roughness: 0.9 }), [0, 0, 0])))
  scene.add(box(8, 3.2, 0.2, mat('#F1E4CF', { roughness: 0.9 }), [0, 1.6, -1.6]))
  scene.add(box(8, 1.0, 0.03, mat('#7A5A3E', { roughness: 0.7 }), [0, 0.5, -1.48]))
  for (const y of [1.55, 2.0]) {
    scene.add(box(1.3, 0.04, 0.24, mat('#8B5E34'), [0.75, y, -1.4]))
    for (let i = 0; i < 4; i++) {
      scene.add(cyl(0.07, 0.07, 0.18, new THREE.MeshStandardMaterial({ color: ['#F6C531', '#E07B39', '#9C6B3F', '#F08A9C'][(i + (y > 1.8 ? 2 : 0)) % 4], roughness: 0.2, transparent: true, opacity: 0.9 }), [0.25 + i * 0.32, y + 0.11, -1.4], 20))
      scene.add(cyl(0.075, 0.075, 0.03, mat('#5B3A22'), [0.25 + i * 0.32, y + 0.215, -1.4], 20))
    }
  }
  /* a window on the left with daylight and a plant */
  scene.add(box(0.9, 1.0, 0.03, glow('#E4F1FF', '#CFE4FA', 0.5), [-1.1, 1.75, -1.48]))
  scene.add(box(1.0, 0.06, 0.12, mat('#8B5E34'), [-1.1, 1.22, -1.44]))
  scene.add(cyl(0.1, 0.08, 0.2, mat('#C8693E'), [-0.85, 1.35, -1.42]))
  scene.add(mesh(new THREE.SphereGeometry(0.17, 20, 16), mat('#5FAE5C', { roughness: 0.9 }), [-0.85, 1.56, -1.42]))
  /* the pendant lamp */
  scene.add(box(0.01, 0.6, 0.01, mat('#2A2F3A'), [0.62, 2.3, -0.9]))
  scene.add(mesh(new THREE.ConeGeometry(0.14, 0.13, 28, 1, true), mat('#2A3550', { roughness: 0.4, side: THREE.DoubleSide }), [0.62, 1.96, -0.9]))
  scene.add(mesh(new THREE.SphereGeometry(0.05, 16, 12), glow('#FFF4D6', '#FFD27A', 1), [0.62, 1.91, -0.9]))
  table16(scene, '#C99A6B', '#8B6A4A')
  /* the coffee and a croissant on the table: what she wants to photograph */
  scene.add(cyl(0.16, 0.16, 0.012, mat('#FFFFFF', { roughness: 0.3 }), [0.62, P16.tableY + 0.04, 0.12], 32))
  scene.add(cyl(0.065, 0.05, 0.13, mat('#FFFFFF', { roughness: 0.25 }), [0.62, P16.tableY + 0.11, 0.12], 28))
  scene.add(cyl(0.058, 0.058, 0.005, mat('#7A4A2A', { roughness: 0.4 }), [0.62, P16.tableY + 0.175, 0.12], 28))
  const hnd = mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16), mat('#FFFFFF', { roughness: 0.25 }), [0.69, P16.tableY + 0.12, 0.12])
  scene.add(hnd)
  /* steam that rises from the cup (three soft wisps) */
  const steam = [0, 1, 2].map((i) => {
    const s = mesh(new THREE.SphereGeometry(0.025, 12, 10), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false }), [0.62 + (i - 1) * 0.025, P16.tableY + 0.2, 0.12])
    s.castShadow = false
    scene.add(s)
    return s
  })
  scene.add(cyl(0.14, 0.14, 0.01, mat('#FFFFFF', { roughness: 0.3 }), [0.98, P16.tableY + 0.035, 0.08], 32))
  const cro = mesh(new THREE.TorusGeometry(0.07, 0.035, 12, 24, Math.PI * 1.1), mat('#E3A857', { roughness: 0.6 }), [0.98, P16.tableY + 0.07, 0.08])
  cro.rotation.x = -Math.PI / 2
  scene.add(cro)

  /* the phone: a real handset, enlarged so its screen reads; icons only */
  const phone = new THREE.Group()
  phone.add(box(0.24, 0.46, 0.03, mat('#1B2140', { roughness: 0.3 }), [0, 0, 0], 0.03))
  const scr = liveTex(120, 220)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.212, 0.41), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }))
  screen.position.z = 0.017
  phone.add(screen)
  phone.position.set(...P16.device)
  phone.rotation.set(-0.08, 0.1, 0)
  scene.add(phone)
  const paintPhone = (s: { blocked: number; prompt: number; press: number; open: number; snap: number }) =>
    scr.paint((g) => {
      const w = 120
      const h = 220
      /* the viewfinder (behind everything): her coffee on the table, through the lens */
      if (s.open > 0) {
        g.fillStyle = '#3B2A20'
        g.fillRect(0, 0, w, h)
        g.globalAlpha = s.open
        const grd = g.createLinearGradient(0, 0, 0, h)
        grd.addColorStop(0, '#E9D3B4')
        grd.addColorStop(1, '#B58B5E')
        g.fillStyle = grd
        g.fillRect(0, 0, w, h)
        g.fillStyle = '#FFFFFF'
        g.beginPath()
        g.ellipse(60, 140, 44, 12, 0, 0, Math.PI * 2)
        g.fill()
        rr(g, 38, 88, 44, 52, 8)
        g.fill()
        g.strokeStyle = '#FFFFFF'
        g.lineWidth = 5
        g.beginPath()
        g.arc(86, 110, 9, -Math.PI / 2, Math.PI / 2)
        g.stroke()
        g.fillStyle = '#7A4A2A'
        g.beginPath()
        g.ellipse(60, 90, 20, 5, 0, 0, Math.PI * 2)
        g.fill()
        /* the frame corners and the shutter */
        g.strokeStyle = 'rgba(255,255,255,0.85)'
        g.lineWidth = 2.5
        for (const [x, y, dx, dy] of [[14, 30, 1, 1], [106, 30, -1, 1], [14, 170, 1, -1], [106, 170, -1, -1]]) {
          g.beginPath()
          g.moveTo(x, y + dy * 12)
          g.lineTo(x, y)
          g.lineTo(x + dx * 12, y)
          g.stroke()
        }
        g.fillStyle = 'rgba(0,0,0,0.35)'
        g.fillRect(0, 182, w, 38)
        g.fillStyle = '#FFFFFF'
        g.beginPath()
        g.arc(60, 201, 12, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#FFFFFF'
        g.lineWidth = 2
        g.beginPath()
        g.arc(60, 201, 15.5, 0, Math.PI * 2)
        g.stroke()
        /* the contacts tile, still locked, in the corner */
        g.fillStyle = 'rgba(14,26,51,0.75)'
        rr(g, 84, 8, 30, 30, 7)
        g.fill()
        contactGlyph(g, 99, 22, 17, '#AFC3EE')
        lockGlyph(g, 108, 31, 11, 0, C.orange)
        g.globalAlpha = 1
        if (s.snap > 0) {
          g.fillStyle = `rgba(255,255,255,${0.85 * s.snap})`
          g.fillRect(0, 0, w, h)
        }
        if (s.open >= 1) return
        g.globalAlpha = 1 - s.open
      }
      /* the app home: a clean screen with two big tiles, camera and contacts */
      g.fillStyle = '#0E1A33'
      g.fillRect(0, 0, w, h)
      const grd = g.createLinearGradient(0, 0, w, h)
      grd.addColorStop(0, '#1E3A8A')
      grd.addColorStop(1, '#0E1A33')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(255,255,255,0.5)'
      rr(g, 44, 8, 32, 5, 2.5)
      g.fill()
      const tiles: [number, (x: number, y: number) => void][] = [
        [62, (x, y) => camGlyph(g, x, y, 34, '#FFFFFF')],
        [132, (x, y) => contactGlyph(g, x, y, 34, '#FFFFFF')],
      ]
      tiles.forEach(([y, draw], i) => {
        g.fillStyle = i === 0 ? C.brand : '#14A37F'
        rr(g, 30, y - 30, 60, 60, 14)
        g.fill()
        draw(60, y)
        if (s.blocked > 0) {
          g.globalAlpha = (1 - s.open) * s.blocked
          g.fillStyle = 'rgba(14,26,51,0.55)'
          rr(g, 30, y - 30, 60, 60, 14)
          g.fill()
          g.fillStyle = '#FFFFFF'
          g.beginPath()
          g.arc(86, y - 26, 13, 0, Math.PI * 2)
          g.fill()
          lockGlyph(g, 86, y - 27, 17, 0, C.orange)
          g.globalAlpha = 1 - s.open
        }
      })
      /* the permission prompt: the camera glyph over an allow tick and a deny cross */
      if (s.prompt > 0) {
        const y0 = lerp(h, 92, s.prompt)
        g.fillStyle = 'rgba(0,0,0,0.35)'
        g.fillRect(0, 0, w, h)
        g.fillStyle = '#FFFFFF'
        rr(g, 8, y0, 104, 118, 14)
        g.fill()
        camGlyph(g, 60, y0 + 34, 34, C.brand)
        g.fillStyle = '#E3E8F2'
        rr(g, 16, y0 + 70, 40, 34, 10)
        g.fill()
        crossGlyph(g, 36, y0 + 87, 20, '#7C8BAA')
        g.fillStyle = s.press > 0 ? '#2FA866' : C.green
        rr(g, 64, y0 + 70, 40, 34, 10)
        g.fill()
        tickGlyph(g, 84, y0 + 87, 22, '#FFFFFF')
        if (s.press > 0) {
          g.strokeStyle = `rgba(61,187,122,${1 - s.press})`
          g.lineWidth = 3
          g.beginPath()
          g.arc(84, y0 + 87, 16 + 18 * s.press, 0, Math.PI * 2)
          g.stroke()
        }
      }
      g.globalAlpha = 1
    })

  const woman = rigSprite({
    config: CAFE,
    loop: L16,
    frames: 76,
    height: 1.64,
    density,
    redraw,
    timeline: (c) => ({ seed: 83, idle: CAST_IDLE, ...faceAt(c, L16, [[0, 'happy'], [0.55, 'confused'], [1.75, 'thinking'], [2.95, 'happy'], [5.2, 'excited'], [6.4, 'happy']]) }),
    pose: holdPose,
  })
  woman.object.position.set(...P16.person)
  scene.add(woman.object)

  let lastQ = ''
  return (t) => {
    const c = mod(t, L16)
    const reset = seg(c, T16.resetA, T16.resetB)
    const s = {
      blocked: seg(c, T16.blockA, T16.blockB) * (1 - reset),
      prompt: seg(c, T16.promptA, T16.promptB) * (1 - seg(c, T16.openA, T16.openB)),
      press: c > T16.allowA && c < T16.openB ? seg(c, T16.allowA, T16.openB) : 0,
      open: seg(c, T16.openA, T16.openB) * (1 - reset),
      snap: hold(c, T16.snapA, T16.snapA + 0.06, T16.snapA + 0.1, T16.snapB),
    }
    const q = [s.blocked, s.prompt, s.press, s.open, s.snap].map((v) => Math.round(v * 24)).join(',')
    if (q !== lastQ) {
      lastQ = q
      paintPhone(s)
    }
    /* a small lift of the phone when she presses Allow, a tilt toward the coffee for the photo */
    phone.position.y = P16.device[1] + 0.012 * hold(c, T16.allowA, T16.allowA + 0.1, T16.allowB, T16.allowB + 0.2)
    phone.rotation.y = 0.1 + 0.08 * hold(c, 4.6, 5.0, 5.7, 6.1)
    steam.forEach((m, i) => {
      const u = mod(c / 1.9 + i / 3, 1)
      m.position.y = P16.tableY + 0.2 + u * 0.22
      m.position.x = 0.62 + (i - 1) * 0.025 + Math.sin(u * Math.PI * 2 + i) * 0.015
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.45 * Math.sin(u * Math.PI)
      m.scale.setScalar(0.8 + u * 0.9)
    })
    woman.update(c, camera)
  }
}

/* ================================================================== T16 · CONCEPT · requests and the padlocks */

function setup16Concept(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame16(kit)
  scene.add(flat(mesh(new THREE.PlaneGeometry(10, 8), mat('#DCE3EF', { roughness: 0.9 }), [0, 0, 0])))
  scene.add(box(8, 3.2, 0.2, mat('#EEF2F9', { roughness: 0.9 }), [0, 1.6, -1.6]))
  /* a soft wall of rack fronts behind (the cloud, where the café has shelves) */
  for (let i = 0; i < 4; i++) {
    const x = -0.9 + i * 0.6
    scene.add(box(0.5, 1.6, 0.1, mat('#D5DCE8', { roughness: 0.6 }), [x, 1.3, -1.48], 0.02))
    for (let k = 0; k < 6; k++) scene.add(box(0.4, 0.05, 0.02, mat('#AEBBD3', { roughness: 0.4 }), [x, 0.75 + k * 0.2, -1.42]))
  }
  table16(scene, '#E9EEF6', '#C9D3E6')

  /* the tablet in his hands, where the phone is: one request glyph */
  const tab = new THREE.Group()
  tab.add(box(0.34, 0.25, 0.025, mat('#1B2140', { roughness: 0.3 }), [0, 0, 0], 0.025))
  const tabTex = canvasTex(170, 120, (g) => {
    const grd = g.createLinearGradient(0, 0, 170, 120)
    grd.addColorStop(0, '#1E3A8A')
    grd.addColorStop(1, '#0E1A33')
    g.fillStyle = grd
    g.fillRect(0, 0, 170, 120)
    /* two request arrows leaving */
    for (const [y, col] of [[44, '#7FA6FF'], [80, '#5EE0C1']] as const) {
      g.fillStyle = col
      g.beginPath()
      g.arc(46, y, 12, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = col
      g.lineWidth = 5
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(66, y)
      g.lineTo(122, y)
      g.moveTo(110, y - 10)
      g.lineTo(124, y)
      g.lineTo(110, y + 10)
      g.stroke()
    }
  })
  const tabScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.22), new THREE.MeshBasicMaterial({ map: tabTex, toneMapped: false }))
  tabScreen.position.z = 0.014
  tab.add(tabScreen)
  tab.position.set(P16.device[0], P16.device[1] - 0.06, P16.device[2])
  tab.rotation.set(-0.12, 0.12, 0)
  scene.add(tab)

  /* two lanes along the desk, each to a resource; a padlock gate halfway on each */
  /* two tiers so the two lanes read apart: lane 1 on a glass shelf, lane 2 on the desk in front */
  const x0 = 0.12
  const xGate = 0.4
  const xEnd = 0.64
  const tierY = [P16.tableY + 0.4, P16.tableY + 0.035]
  const tierZ = [-0.02, 0.22]
  scene.add(box(0.86, 0.025, 0.2, new THREE.MeshStandardMaterial({ color: '#E6F0FF', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.6 }), [0.5, tierY[0] - 0.02, tierZ[0]], 0.01))
  for (const x of [0.1, 0.9]) scene.add(box(0.025, 0.4, 0.025, mat('#9AA6BA', { metalness: 0.6, roughness: 0.3 }), [x, P16.tableY + 0.2, tierZ[0]]))
  const laneY = tierY[1]
  const lanes = tierZ.map((z, i) => {
    const ly = tierY[i]
    const strip = flat(mesh(new THREE.PlaneGeometry(xEnd - x0 + 0.1, 0.06), glow(i ? '#D7FAF1' : '#DCE6FF', i ? '#5EE0C1' : '#7FA6FF', 0.25), [(x0 + xEnd) / 2, ly + 0.003, z]))
    scene.add(strip)
    /* the padlock: a gold body on a post, a shackle that lifts */
    const lock = new THREE.Group()
    lock.position.set(xGate, ly + 0.13, z)
    lock.scale.setScalar(1.45)
    lock.add(box(0.14, 0.12, 0.06, mat(C.gold, { roughness: 0.25, metalness: 0.85 }), [0, 0, 0], 0.02))
    lock.add(mesh(new THREE.CircleGeometry(0.018, 16), mat('#5B4A1E'), [0, 0, 0.031]))
    const shackle = mesh(new THREE.TorusGeometry(0.045, 0.013, 10, 24, Math.PI), mat('#C9D3E6', { roughness: 0.25, metalness: 0.85 }), [0, 0.06, 0])
    lock.add(shackle)
    scene.add(lock)
    /* the request: a glowing orb */
    const orb = mesh(new THREE.SphereGeometry(0.045, 20, 16), glow(i ? '#C6FFF0' : '#DCE6FF', i ? '#2FD3A7' : '#4C7DFF', 1), [x0, ly + 0.08, z])
    orb.castShadow = false
    scene.add(orb)
    return { z, y: ly, lock, shackle, orb, strip }
  })
  /* the two resources at the lanes' ends: an S3 bucket (where the coffee is) and a second resource (users mark) */
  const bucket = new THREE.Group()
  const bm = mat('#3F8624', { roughness: 0.4, metalness: 0.15 })
  const bshell = mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.22, 36, 1, true), bm, [0, 0.11, 0])
  ;(bshell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
  bucket.add(bshell)
  bucket.add(cyl(0.085, 0.085, 0.01, bm, [0, 0.005, 0]))
  bucket.add(mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 36), mat('#DDEFD3', { roughness: 0.3 }), [0, 0.22, 0]).rotateX(Math.PI / 2))
  bucket.position.set(xEnd + 0.12, lanes[0].y, lanes[0].z)
  scene.add(bucket)
  const bTile = markTile(s3BucketUrl, 0.11, 0.11, redraw)
  bTile.position.set(xEnd + 0.12, lanes[0].y + 0.11, lanes[0].z + 0.105)
  scene.add(bTile)
  const bGlow = glow('#E9FBE2', '#7ED957', 0)
  const bRing = mesh(new THREE.TorusGeometry(0.12, 0.01, 8, 36), bGlow, [xEnd + 0.12, lanes[0].y + 0.225, lanes[0].z])
  bRing.rotation.x = Math.PI / 2
  scene.add(bRing)
  const uTile = markTile(usersUrl, 0.16, 0.16, redraw)
  uTile.position.set(xEnd + 0.12, laneY + 0.13, lanes[1].z)
  scene.add(uTile)
  scene.add(box(0.2, 0.04, 0.12, mat('#C9D3E6', { roughness: 0.4 }), [xEnd + 0.12, laneY + 0.02, lanes[1].z - 0.04], 0.01))
  /* the Allow statement card: the IAM permissions mark and a green tick, slides in and docks at lane 1's lock */
  const allowFace = new THREE.MeshStandardMaterial({
    map: (() => {
      const lt = liveTex(160, 110)
      lt.paint((g) => {
        g.fillStyle = '#FFFFFF'
        g.fillRect(0, 0, 160, 110)
        g.fillStyle = C.green
        g.beginPath()
        g.arc(118, 55, 30, 0, Math.PI * 2)
        g.fill()
        tickGlyph(g, 120, 55, 40, '#FFFFFF')
        g.fillStyle = '#D5DCE8'
        for (const [y, w] of [[60, 50], [74, 40], [88, 46]]) {
          rr(g, 14, y, w, 7, 3.5)
          g.fill()
        }
      })
      const im = new Image()
      im.onload = () => {
        lt.paint((g) => g.drawImage(im, 14, 10, 42, 42))
        redraw()
      }
      im.width = 256
      im.height = 256
      im.src = permUrl
      return lt.tex
    })(),
    roughness: 0.45,
  })
  const allowSide = mat('#FFFFFF')
  const allow = box(0.24, 0.165, 0.012, [allowSide, allowSide, allowSide, allowSide, allowFace, allowSide], [0, 0, 0])
  scene.add(allow)

  const dev = rigSprite({
    config: DEV,
    loop: L16,
    frames: 76,
    height: 1.72,
    density,
    redraw,
    timeline: (c) => ({ seed: 89, idle: CAST_IDLE, ...faceAt(c, L16, [[0, 'neutral'], [0.55, 'confused'], [1.75, 'thinking'], [2.95, 'happy'], [5.2, 'proud'], [6.4, 'neutral']]) }),
    pose: (p, c) => {
      holdPose(p, c)
      /* he watches the lanes rather than the coffee */
    },
  })
  dev.object.position.set(...P16.person)
  scene.add(dev.object)

  return (t) => {
    const c = mod(t, L16)
    const reset = seg(c, T16.resetA, T16.resetB)
    /* requests leave the tablet and stop at the locks (a small bounce) */
    const go = seg(c, T16.tapA, T16.blockB)
    lanes.forEach((ln, i) => {
      const atGate = xGate - 0.11
      let x = lerp(x0, atGate, go)
      const bump = Math.max(0, Math.sin((c - T16.blockB) * 6)) * 0.02 * hold(c, T16.blockB, T16.blockB + 0.1, T16.resetA - 0.4, T16.resetA)
      x -= bump
      let vis = 1
      if (i === 0) {
        /* lane 1: through the opened lock to the bucket, absorbed */
        const pass = seg(c, T16.openB, T16.openB + 0.9)
        x = lerp(x, xEnd + 0.07, pass)
        vis = 1 - seg(c, T16.openB + 0.85, T16.openB + 1.1)
      }
      vis *= 1 - reset
      ln.orb.position.set(x, ln.y + 0.08 + (i === 0 ? Math.sin(seg(c, T16.openB, T16.openB + 0.9) * Math.PI) * 0.06 : 0), ln.z)
      ln.orb.visible = vis > 0.02 && c > T16.tapA
      ln.orb.scale.setScalar(Math.max(0.001, vis))
    })
    /* the allow card slides in from the front, docks beside lane 1's lock; leaves at the reset */
    const dock = seg(c, T16.promptA, T16.allowB) * (1 - reset)
    allow.position.set(lerp(xGate + 0.05, xGate - 0.08, dock), lerp(lanes[0].y + 0.62, lanes[0].y + 0.47, dock), lerp(0.75, lanes[0].z + 0.04, dock))
    allow.rotation.set(-0.35, lerp(-0.4, 0, dock), lerp(0.2, 0, dock))
    allow.visible = c > T16.promptA - 0.05 && c < T16.resetB
    /* lane 1's shackle lifts and turns open */
    const open = seg(c, T16.openA, T16.openB) * (1 - reset)
    lanes[0].shackle.position.y = 0.06 + 0.035 * open
    lanes[0].shackle.rotation.y = open * 0.85
    ;(lanes[0].strip.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + 0.55 * open
    bGlow.emissiveIntensity = 1.2 * hold(c, T16.openB + 0.8, T16.openB + 1.0, T16.resetA - 0.6, T16.resetA)
    dev.update(c, camera)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const J_T13Everyday = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD13} setup={setup13Everyday} />
const J_T13Concept = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD13} setup={setup13Concept} />
const J_T16Everyday = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD16} setup={setup16Everyday} />
const J_T16Concept = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD16} setup={setup16Concept} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T13Everyday: J_T13Everyday as (p: Record<string, unknown>) => ReactNode,
  J_T13Concept: J_T13Concept as (p: Record<string, unknown>) => ReactNode,
  J_T16Everyday: J_T16Everyday as (p: Record<string, unknown>) => ReactNode,
  J_T16Concept: J_T16Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
