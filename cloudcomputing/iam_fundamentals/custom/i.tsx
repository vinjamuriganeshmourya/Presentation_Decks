import { useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import type { Skin } from '@/decks/figures/cast/skins/types'
import bucketUrl from '../images/res-s3-bucket.svg'

/**
 * BUILDER I · SESSION 13 (IAM Fundamentals), the two 3D analogies of TR 7 and TR 10.
 *
 * T07-AN, TR 7: "A housing society guard who already confirmed a visitor's identity still checks the visitor pass for
 * permitted floors: just as authorization checks a verified identity's permissions before allowing a specific action."
 * T10-AN, TR 10: "A train ticket states exactly what is allowed: travel on one train, in one seat, on one date: just as
 * a policy states the effect, the action, the resource and the condition for a request."
 *
 * Built to the Session 9-12 review rules from the first draft (generate-slides standing corrections 13-16, cloud R10-R13):
 * real-time 3D through the engine's `@/engine/three-stage` (no renderer here), perspective camera, a real place; people
 * are Character Lab characters placed with the engine's `castSprite` (role clothing through `dress`, frames built at the
 * size they are drawn at, `adaptive`); no text on either card (icons only: lamps, ticks, a lock, the official S3 bucket
 * mark); one wall-clock loop per scene that ends where it starts; held frames (`?still`, thumbnails) draw the key moment.
 *
 * Each pair shares one ground plan, position for position:
 *
 *   T07     everyday (society lobby, a glass lift)            concept (a resource tower, a glass lift)
 *   desk    the guard reads the visitor pass                  the authorization gate scans the policy card
 *   press   he enables ONE floor on the lift console (green), the gate enables ONE level (green), the other
 *           the other floor stays locked (orange)             level stays locked (orange)
 *   lift    the visitor rides to the permitted floor only     the verified user rides to the allowed resource only
 *   floor 1 the flat she may visit, its lamp turns green      the S3 bucket, it opens and glows
 *   floor 2 a flat with an orange lock: never reached         a database with an orange lock: never reached
 *
 *   T10       everyday (railway platform)                     concept (a row of resource bays)
 *   examiner  the ticket examiner                             the policy checkpoint (a kiosk with four lamps)
 *   in hand   the passenger's ticket                          the user's policy card (toggle, play, target, filter)
 *   action    the train board on the coach (train icon)       the action plate on the bay (read icon)
 *   resource  the one seat through the window                 the one bucket inside the bay
 *   condition the platform date board (calendar icon)         the condition post (globe: the source IP)
 *   effect    the examiner stamps the ticket: tick            the card's effect switch turns to Allow: tick
 *   result    the coach door opens to that seat; the seat     the bay door opens to that bucket; the bay next to it
 *             next to it stays dim                            stays locked
 */

const W = 470
const H = 390

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  white: '#FFFFFF',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#3DBB7A',
  ink: '#22304F',
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

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, s = 32) => mesh(new THREE.CylinderGeometry(rt, rb, h, s), m, pos)
const flat = (m: THREE.Mesh) => {
  m.castShadow = false
  return m
}
const glow = (color: string, k = 0.9) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: k, roughness: 0.35 })

/* ------------------------------------------------------------------ icon textures (lucide paths, drawn at 3x so a 4K screen stays sharp) */

const ICON: Record<string, string> = {
  train: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
  seat: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  toggle: '<circle cx="15" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/>',
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
  target: '<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>',
  filter: '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  read: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
  idcard: '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
}
const imgCache = new Map<string, Promise<HTMLImageElement>>()
function loadImg(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src)
  if (!p) {
    p = new Promise((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.onerror = () => res(im)
      im.src = src
    })
    imgCache.set(src, p)
  }
  return p
}
const iconSrc = (name: string, color: string, sw = 2) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="192" height="192" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`)

type Pic = (src: string) => HTMLImageElement | null
const SS = 3
/** a drawn texture; `paint` runs once at once (shapes only) and again when every picture it names has loaded */
function paintTex(w: number, h: number, srcs: string[], paint: (g: CanvasRenderingContext2D, pic: Pic) => void, redraw: () => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * SS
  c.height = h * SS
  const g = c.getContext('2d')!
  g.scale(SS, SS)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  paint(g, () => null)
  Promise.all(srcs.map(loadImg)).then((ims) => {
    const map = new Map(srcs.map((s, i) => [s, ims[i]]))
    g.clearRect(0, 0, w, h)
    paint(g, (s) => map.get(s) ?? null)
    t.needsUpdate = true
    redraw()
  })
  return t
}
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
/** a round disc with an icon: the lamps, the ticks, the locks */
function discTex(icon: string, bg: string, fg: string, redraw: () => void, ring?: string): THREE.CanvasTexture {
  const src = iconSrc(icon, fg, 2.6)
  return paintTex(128, 128, [src], (g, pic) => {
    g.beginPath()
    g.arc(64, 64, 60, 0, Math.PI * 2)
    g.fillStyle = bg
    g.fill()
    if (ring) {
      g.lineWidth = 5
      g.strokeStyle = ring
      g.stroke()
    }
    const im = pic(src)
    if (im) g.drawImage(im, 30, 30, 68, 68)
  }, redraw)
}
/** a flat icon plate (a sign) */
function plateTex(icon: string, bg: string, fg: string, w: number, h: number, redraw: () => void): THREE.CanvasTexture {
  const src = iconSrc(icon, fg, 2)
  return paintTex(w, h, [src], (g, pic) => {
    rr(g, 2, 2, w - 4, h - 4, 14)
    g.fillStyle = bg
    g.fill()
    const s = Math.min(w, h) * 0.66
    const im = pic(src)
    if (im) g.drawImage(im, (w - s) / 2, (h - s) / 2, s, s)
  }, redraw)
}
const texMat = (t: THREE.Texture, lit = false) =>
  lit ? new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }) : new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })
const plane = (w: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple) => flat(mesh(new THREE.PlaneGeometry(w, h), m, pos))
const disc = (r: number, m: THREE.Material, pos: THREE.Vector3Tuple) => flat(mesh(new THREE.CircleGeometry(r, 48), m, pos))

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; density: () => number; redraw: () => void }): Sprite {
  const { density, redraw, ...rest } = o
  return castSprite({ ...rest, shadow: 0.2, adaptive: { density, stageH: H, floor: 128 }, onReady: redraw })
}
function faceAt(L: number, c: number, keys: [number, string][]): Pick<Timeline, 'expression' | 'prevExpression'> {
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
const GUARD_UNIFORM = (trim: string) => (
  <g data-part="uniform">
    <path d="M 140 212 L 178 206 L 180 218 L 142 224 Z" fill={trim} />
    <path d="M 260 212 L 222 206 L 220 218 L 258 224 Z" fill={trim} />
    <path d="M 226 246 L 231 236 L 236 246 L 247 247 L 239 254 L 241 265 L 231 259 L 221 265 L 223 254 L 215 247 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M 168 236 C 172 262 182 282 196 292" stroke="#E9EEF7" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    <rect x={190} y={288} width={14} height={8} rx={3} fill="#C9D3E6" />
    <rect x={150} y={250} width={30} height={22} rx={3} fill="none" stroke={trim} strokeWidth={2.5} />
  </g>
)
/** the ticket examiner's black coat over a white shirt and tie: two lapelled front panels and a brass name plate */
const TTE_COAT = (
  <g data-part="coat">
    <path d="M 138 214 L 186 206 L 200 300 L 196 392 L 142 392 C 136 330 134 270 138 214 Z" fill="#1E2230" />
    <path d="M 262 214 L 214 206 L 200 300 L 204 392 L 258 392 C 264 330 266 270 262 214 Z" fill="#1E2230" />
    <path d="M 186 206 L 172 250 L 196 286 Z" fill="#2B3044" />
    <path d="M 214 206 L 228 250 L 204 286 Z" fill="#2B3044" />
    <rect x={222} y={262} width={28} height={8} rx={2} fill={C.gold} />
    <circle cx={194} cy={330} r={4} fill={C.gold} />
    <circle cx={194} cy={364} r={4} fill={C.gold} />
  </g>
)
/** an access badge on a lanyard (the verified identity) */
const BADGE = (strap: string) => (
  <g data-part="badge">
    <path d="M 188 208 L 196 268 M 212 208 L 204 268" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={186} y={266} width={28} height={36} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <circle cx={200} cy={279} r={5} fill={strap} opacity={0.7} />
    <rect x={192} y={288} width={16} height={4} rx={2} fill={strap} opacity={0.6} />
  </g>
)

const GUARD = who(CAST_PRESETS.arjun, {
  name: 'Society Guard',
  skinTone: 'medium',
  hair: { style: 'short', color: 'black' },
  outfit: { top: 'shirt', topColor: '#3D5C93', bottom: 'trousers', bottomColor: '#1F2A44', shoeColor: '#1E1E24' },
  accessories: { beard: 'short', belt: true, watch: true },
  build: { height: 1.02, shoulders: 1.06 },
})
const VISITOR = who(CAST_PRESETS.meera, {
  name: 'Visitor',
  skinTone: 'wheatish',
  hair: { style: 'long', color: 'black' },
  outfit: { top: 'kurta', topColor: '#C8417A', bottom: 'salwar', bottomColor: '#F1DCC2', shoeColor: '#8A4B2D' },
  accessories: { earrings: true, bindi: true },
})
const IAM_USER = who(CAST_PRESETS.dev, {
  name: 'Verified User',
  skinTone: 'fair',
  hair: { style: 'quiff', color: 'darkBrown' },
  outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#24324F', shoeColor: '#F2F2F5' },
  accessories: { glasses: 'round', watch: true },
})
const EXAMINER = who(CAST_PRESETS.rohan, {
  name: 'Ticket Examiner',
  skinTone: 'dusky',
  hair: { style: 'short', color: 'grey' },
  outfit: { top: 'shirtTie', topColor: '#F4F6FA', bottom: 'trousers', bottomColor: '#1E2230', shoeColor: '#141418', accentColor: '#1F2E63' },
  accessories: { beard: 'short', watch: true },
})
const PASSENGER = who(CAST_PRESETS.riya, {
  name: 'Passenger',
  skinTone: 'fair',
  hair: { style: 'braid', color: 'black' },
  outfit: { top: 'kurta', topColor: '#1F9E89', bottom: 'salwar', bottomColor: '#F4E3C3', shoeColor: '#7A4A2A' },
  accessories: { earrings: true },
})
const REQUESTER = who(CAST_PRESETS.ananya, {
  name: 'Requester',
  skinTone: 'medium',
  hair: { style: 'ponytail', color: 'black' },
  outfit: { top: 'shirt', topColor: '#7C5CFF', bottom: 'trousers', bottomColor: '#232B45', shoeColor: '#2A2A30' },
  accessories: { earrings: true, watch: true },
})

/* ------------------------------------------------------------------ the card in a hand */

/** the visitor pass / policy card / ticket: a small card held toward the reader, from low (resting) to raised */
type Held = { g: THREE.Group; set: (raise: number) => void }
function heldCard(tex: THREE.Texture, w: number, h: number, low: THREE.Vector3Tuple, high: THREE.Vector3Tuple, tilt = 0): Held {
  const g = new THREE.Group()
  const card = flat(mesh(new RoundedBoxGeometry(w, h, 0.012, 2, 0.02), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 }), [0, 0, 0]))
  g.add(card)
  const face = plane(w * 0.98, h * 0.98, texMat(tex), [0, 0, 0.008])
  g.add(face)
  g.rotation.z = tilt
  return {
    g,
    set: (k) => {
      g.position.set(lerp(low[0], high[0], k), lerp(low[1], high[1], k), lerp(low[2], high[2], k))
      g.rotation.x = lerp(-0.5, -0.12, k)
    },
  }
}

/* ------------------------------------------------------------------ stage + exports */

function densityOf(ref: RefObject<HTMLDivElement | null>) {
  const el = ref.current
  const r = el?.getBoundingClientRect()
  const zoom = r && r.width > 0 ? r.width / W : 1
  return Math.max(2, Math.min(4, Math.max(zoom, 1) * (window.devicePixelRatio || 1)))
}
/** dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devT = (fallback: number) => {
  if (typeof window === 'undefined') return fallback
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : fallback
}
function Stage({ step, holdT, setup }: { step: number; holdT: number; setup: (k: StageKit, density: () => number) => Update }): ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={devT(holdT)} setup={(k) => setup(k, () => densityOf(ref))} />
    </div>
  )
}

/* ================================================================== T07 · THE LIFT (shared ground plan) */

const LT = 7.5
/* phases of the loop: the pass goes up, the reader checks it, one floor is enabled, the lift rides up and back */
const T7 = { raiseA: 0, raiseB: 0.5, checkA: 0.5, checkB: 1.8, nodA: 1.8, nodB: 2.1, pressA: 2.1, pressB: 2.75, on1: 2.5, on2: 2.62, lowerA: 2.5, lowerB: 2.95, closeA: 2.95, closeB: 3.35, upA: 3.35, upB: 4.6, openA: 4.6, openB: 5.0, close2A: 5.85, close2B: 6.25, downA: 6.25, downB: 7.1, open3A: 7.1, open3B: 7.45, resetA: 6.9, resetB: 7.3 }
const HOLD7 = 1.3 // the pass held up, the reader checking it

const F1 = 2.35 // floor 1 level
const F2 = 4.7 // floor 2 level
const SLAB = 0.18
const LX0 = 0.95
const LX1 = 2.35
const LX = (LX0 + LX1) / 2
const LZ0 = -1.25
const LZ1 = 0.15
const BX0 = -3.9
const BX1 = 3.2
const BZ0 = -1.7
const BZ1 = 1.05

function carY(c: number) {
  return F1 * (seg(c, T7.upA, T7.upB) * (1 - seg(c, T7.downA, T7.downB)))
}
function doorOpen(c: number) {
  /* open at the lobby at the loop's start and end, open at floor 1 between */
  return 1 - seg(c, T7.closeA, T7.closeB) + seg(c, T7.openA, T7.openB) - seg(c, T7.close2A, T7.close2B) + seg(c, T7.open3A, T7.open3B)
}

function frame7(kit: StageKit) {
  const { camera, scene } = kit
  camera.fov = 31
  camera.position.set(-0.2, 3.2, 11.7)
  camera.lookAt(-0.2, 3.02, 0)
  lightRig(scene, [-0.2, 2.4, -0.5])
}

type Tower = {
  car: THREE.Group
  leafL: THREE.Object3D
  leafR: THREE.Object3D
  btn1: THREE.MeshBasicMaterial
  btn2: THREE.MeshBasicMaterial
  lamp1: THREE.Mesh
  lamp2: THREE.Mesh
  console: THREE.Group
}

/** the building both T07 cards stand in: lobby, two floors cut open, a glass lift shaft through all three */
function tower(kit: StageKit, look: 'society' | 'cloud'): Tower {
  const { scene, redraw, camera } = kit
  const S = look === 'society'
  const wallM = mat(S ? '#F6E9D3' : '#EEF3FB', { roughness: 0.85 })
  const backM = mat(S ? '#F1DEC0' : '#E1E9F7', { roughness: 0.9 })
  const floorM = mat(S ? '#D9B48A' : '#CDD8EC', { roughness: 0.75 })
  const slabM = mat(S ? '#E7D4B5' : '#D6DFEE', { roughness: 0.8 })
  const edgeM = mat(S ? '#C8693E' : C.brand, { roughness: 0.5 })

  /* the ground outside */
  const ground = flat(mesh(new THREE.PlaneGeometry(20, 10), mat(S ? '#E9DDC6' : '#E6ECF6', { roughness: 0.95 }), [0, -0.001, 0]))
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  /* three storeys: a back wall, a side wall at each end, a slab with its coloured edge, a hole for the shaft */
  for (const [lvl, top] of [[0, F1 - SLAB], [F1, F2 - SLAB], [F2, F2 + 2.3]] as const) {
    const h = top - lvl
    scene.add(flat(box(BX1 - BX0, h, 0.2, backM, [(BX0 + BX1) / 2, lvl + h / 2, BZ0])))
    scene.add(flat(box(0.2, h, BZ1 - BZ0, wallM, [BX0 + 0.1, lvl + h / 2, (BZ0 + BZ1) / 2])))
    scene.add(flat(box(0.2, h, BZ1 - BZ0, wallM, [BX1 - 0.1, lvl + h / 2, (BZ0 + BZ1) / 2])))
  }
  const fl = flat(mesh(new THREE.PlaneGeometry(BX1 - BX0, BZ1 - BZ0), floorM, [(BX0 + BX1) / 2, 0.004, (BZ0 + BZ1) / 2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  for (const lv of [F1, F2]) {
    const y = lv - SLAB / 2
    scene.add(flat(box(LX0 - BX0, SLAB, BZ1 - BZ0, slabM, [(BX0 + LX0) / 2, y, (BZ0 + BZ1) / 2])))
    scene.add(flat(box(BX1 - LX1, SLAB, BZ1 - BZ0, slabM, [(LX1 + BX1) / 2, y, (BZ0 + BZ1) / 2])))
    scene.add(flat(box(LX1 - LX0, SLAB, BZ1 - LZ1, slabM, [LX, y, (LZ1 + BZ1) / 2])))
    scene.add(flat(box(LX1 - LX0, SLAB, LZ0 - BZ0, slabM, [LX, y, (BZ0 + LZ0) / 2])))
    scene.add(box(BX1 - BX0 + 0.02, 0.05, 0.04, edgeM, [(BX0 + BX1) / 2, y - SLAB / 2 + 0.025, BZ1 + 0.02]))
    const f = flat(mesh(new THREE.PlaneGeometry(BX1 - BX0 - 0.4, BZ1 - BZ0 - 0.2), floorM, [(BX0 + BX1) / 2, lv + 0.004, (BZ0 + BZ1) / 2 + 0.05]))
    f.rotation.x = -Math.PI / 2
    scene.add(f)
  }
  /* the roof slab over floor 2 (its top is out of frame) */
  scene.add(flat(box(BX1 - BX0, SLAB, BZ1 - BZ0, slabM, [(BX0 + BX1) / 2, F2 + 2.3 + SLAB / 2, (BZ0 + BZ1) / 2])))

  /* the shaft: four steel posts and frosted side glass, the full height */
  const steel = mat(S ? '#9AA4B5' : '#8EA0C2', { roughness: 0.3, metalness: 0.6 })
  const glass = new THREE.MeshStandardMaterial({ color: '#CFE2F7', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.22 })
  const topY = F2 + 2.3
  for (const x of [LX0, LX1]) for (const z of [LZ0, LZ1]) scene.add(flat(box(0.08, topY, 0.08, steel, [x, topY / 2, z], 0.02)))
  for (const x of [LX0, LX1]) scene.add(flat(box(0.02, topY, LZ1 - LZ0 - 0.08, glass, [x, topY / 2, (LZ0 + LZ1) / 2])))

  /* the car: floor, back and sides, roof with a lamp, a handrail, two sliding front leaves */
  const car = new THREE.Group()
  const cw = LX1 - LX0 - 0.14
  const cd = LZ1 - LZ0 - 0.16
  const ch = 2.15
  const panel = mat(S ? '#E8E2D6' : '#E6EDF9', { roughness: 0.5, metalness: 0.1 })
  car.add(box(cw, 0.08, cd, mat('#5A6275', { roughness: 0.6 }), [0, 0.04, 0]))
  car.add(box(cw, ch, 0.04, panel, [0, ch / 2, -cd / 2 + 0.02]))
  for (const s of [-1, 1]) car.add(box(0.04, ch, cd, panel, [s * (cw / 2 - 0.02), ch / 2, 0]))
  car.add(box(cw, 0.06, cd, mat('#C9D0DC', { roughness: 0.4 }), [0, ch + 0.03, 0]))
  car.add(box(cw * 0.6, 0.02, 0.3, glow('#FFF6DD', 0.8), [0, ch - 0.01, 0]))
  car.add(box(cw - 0.12, 0.04, 0.04, steel, [0, 0.95, -cd / 2 + 0.08], 0.015))
  const leafW = cw / 2
  const leafM = new THREE.MeshStandardMaterial({ color: S ? '#D8C79F' : '#B9CCF0', roughness: 0.25, metalness: 0.45, transparent: true, opacity: 0.38 })
  const leafFrame = mat(S ? '#B08A4E' : '#5A7AC8', { roughness: 0.35, metalness: 0.5 })
  const leaf = (sx: number) => {
    const g = new THREE.Group()
    g.add(flat(box(leafW, ch - 0.02, 0.025, leafM, [0, ch / 2, 0])))
    g.add(box(0.035, ch - 0.02, 0.04, leafFrame, [-sx * (leafW / 2 - 0.018), ch / 2, 0]))
    g.position.set(sx * (leafW / 2), 0, cd / 2 + 0.03)
    car.add(g)
    return g
  }
  const leafL = leaf(-1)
  const leafR = leaf(1)
  scene.add(car)
  car.position.set(LX, 0, (LZ0 + LZ1) / 2)

  /* the floor lamps beside the shaft, one per upper floor: green (permitted) or an orange lock (never reached) */
  const lampMat1 = new THREE.MeshBasicMaterial({ map: discTex('check', C.green, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const lampMat2 = new THREE.MeshBasicMaterial({ map: discTex('lock', C.orange, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const lamp1 = disc(0.17, lampMat1, [LX0 - 0.28, F1 + 0.95, 0.3])
  const lamp2 = disc(0.17, lampMat2, [LX0 - 0.28, F2 + 0.95, 0.3])
  scene.add(lamp1, lamp2)
  for (const l of [lamp1, lamp2]) l.lookAt(camera.position)

  /* the desk console (lobby): a tilted panel of three buttons, ground floor, floor 1, floor 2 */
  const con = new THREE.Group()
  con.add(box(0.5, 0.06, 0.34, mat('#2A3550', { roughness: 0.45 }), [0, 0, 0], 0.02))
  const b0 = new THREE.MeshBasicMaterial({ color: '#AFC0DD', toneMapped: false })
  const btn1 = new THREE.MeshBasicMaterial({ color: '#7D8BA6', toneMapped: false })
  const btn2 = new THREE.MeshBasicMaterial({ color: '#7D8BA6', toneMapped: false })
  ;[b0, btn1, btn2].forEach((m, i) => {
    const b = cyl(0.045, 0.045, 0.03, m, [-0.13 + i * 0.13, 0.04, 0.02], 24)
    b.castShadow = false
    con.add(b)
  })
  con.rotation.x = 0.55

  return { car, leafL, leafR, btn1, btn2, lamp1, lamp2, console: con }
}

function towerUpdate(T: Tower, c: number) {
  T.car.position.y = carY(c)
  const o = clamp01(doorOpen(c))
  const leafW = (LX1 - LX0 - 0.14) / 2
  T.leafL.position.x = -leafW / 2 - o * (leafW - 0.06)
  T.leafR.position.x = leafW / 2 + o * (leafW - 0.06)
  /* the console: the floor-1 button lights green, the floor-2 one flashes orange (no access) then stays orange */
  const on1 = seg(c, T7.on1, T7.on1 + 0.12) * (1 - seg(c, T7.resetA, T7.resetB))
  T.btn1.color.set(on1 > 0.5 ? C.green : '#7D8BA6')
  const on2 = seg(c, T7.on2, T7.on2 + 0.12) * (1 - seg(c, T7.resetA, T7.resetB))
  const flash = on2 * (0.75 + 0.25 * Math.cos((c - T7.on2) * Math.PI * 6) * (1 - seg(c, T7.on2 + 0.5, T7.on2 + 0.9)))
  T.btn2.color.set(flash > 0.5 ? C.orange : '#7D8BA6')
  /* the floor lamps: floor 1 lights as the car arrives and stays while it is there; floor 2 shows its lock from the
     moment it is refused until the reset, breathing softly */
  const l1 = hold(c, T7.upB - 0.3, T7.openA, T7.close2B, T7.downA + 0.4)
  T.lamp1.scale.setScalar(0.001 + l1 * (1 + 0.05 * Math.sin(c * 6)))
  const l2 = seg(c, T7.on2, T7.on2 + 0.3) * (1 - seg(c, T7.resetA, T7.resetB))
  T.lamp2.scale.setScalar(0.001 + l2 * (1 + 0.04 * Math.sin(c * 5 + 1)))
}

/* ---------------------------------------------- T07 everyday: the society lobby */

function setup7Everyday(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame7(kit)
  scene.background = null
  const T = tower(kit, 'society')

  /* lobby: the guard's desk to the left of the lift, a potted plant, the society's mailboxes on the back wall */
  const wood = mat('#9B6A3F', { roughness: 0.55 })
  const desk = new THREE.Group()
  desk.add(box(1.5, 0.95, 0.6, wood, [0, 0.475, 0], 0.04))
  desk.add(box(1.6, 0.06, 0.7, mat('#C99A63', { roughness: 0.4 }), [0, 0.98, 0], 0.02))
  desk.add(box(1.3, 0.5, 0.02, mat('#7D5230', { roughness: 0.6 }), [0, 0.5, 0.31]))
  desk.position.set(-0.75, 0, 0.45)
  scene.add(desk)
  T.console.position.set(-0.3, 1.04, 0.42)
  scene.add(T.console)
  /* a register on the desk (identity already confirmed) */
  scene.add(box(0.36, 0.04, 0.26, mat('#2D63FB', { roughness: 0.5 }), [-1.2, 1.03, 0.45], 0.01))
  scene.add(box(0.33, 0.02, 0.23, mat('#FBF7EE'), [-1.2, 1.055, 0.45], 0.005))
  /* mailboxes */
  const mb = mat('#B9C3D3', { roughness: 0.35, metalness: 0.5 })
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) scene.add(box(0.3, 0.22, 0.06, mb, [-3.4 + k * 0.34, 1.5 + r * 0.26, BZ0 + 0.13], 0.02))
  /* the plant */
  scene.add(cyl(0.2, 0.15, 0.4, mat('#C8693E'), [-3.05, 0.2, -1.05], 20))
  scene.add(mesh(new THREE.SphereGeometry(0.38, 20, 16), mat('#5FAE5C', { roughness: 0.9 }), [-3.05, 0.75, -1.05]))
  scene.add(mesh(new THREE.SphereGeometry(0.26, 20, 16), mat('#77C26E', { roughness: 0.9 }), [-2.88, 1.0, -0.97]))
  /* the society's entrance (glass door) at the far left */
  scene.add(box(0.05, 2.0, 1.0, mat('#B08A4E', { roughness: 0.4 }), [BX0 + 0.22, 1.0, -0.2]))
  scene.add(flat(box(0.03, 1.85, 0.86, new THREE.MeshStandardMaterial({ color: '#CFE2F7', roughness: 0.08, transparent: true, opacity: 0.45 }), [BX0 + 0.24, 0.98, -0.2])))

  /* floor 1: the flat she may visit (a warm lamp over its door, a door mat) */
  const flatDoor = (x: number, lv: number, col: string) => {
    scene.add(box(1.0, 2.05, 0.06, mat('#B07A4A', { roughness: 0.6 }), [x, lv + 1.025, BZ0 + 0.13]))
    scene.add(box(0.86, 1.92, 0.05, mat(col, { roughness: 0.55 }), [x, lv + 0.98, BZ0 + 0.17]))
    scene.add(box(0.05, 0.12, 0.04, mat('#F2D27A', { roughness: 0.25, metalness: 0.85 }), [x + 0.3, lv + 1.0, BZ0 + 0.21], 0.01))
  }
  flatDoor(-1.4, F1, '#8B5E34')
  const warm = glow('#FFE3A3', 0.25)
  scene.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), warm, [-1.4, F1 + 2.18, BZ0 + 0.25]))
  const mat1 = flat(mesh(new THREE.PlaneGeometry(0.8, 0.45), mat('#C8417A', { roughness: 0.95 }), [-1.4, F1 + 0.008, BZ0 + 0.55]))
  mat1.rotation.x = -Math.PI / 2
  scene.add(mat1)
  scene.add(cyl(0.16, 0.12, 0.32, mat('#C8693E'), [-2.6, F1 + 0.16, -1.1], 20))
  scene.add(mesh(new THREE.SphereGeometry(0.3, 20, 16), mat('#5FAE5C', { roughness: 0.9 }), [-2.6, F1 + 0.6, -1.1]))
  /* floor 2: another flat, its door carries an orange lock (not on her pass) */
  flatDoor(-1.4, F2, '#6E4A2A')
  const lockMat = new THREE.MeshBasicMaterial({ map: discTex('lock', C.orange, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const lockOnDoor = disc(0.15, lockMat, [-1.4, F2 + 1.3, BZ0 + 0.21])
  scene.add(lockOnDoor)

  /* the visitor pass: a white card with an id icon and a blue band */
  const passSrc = iconSrc('idcard', C.brand, 2)
  const passTex = paintTex(120, 80, [passSrc], (g, pic) => {
    rr(g, 2, 2, 116, 76, 10)
    g.fillStyle = '#FFFFFF'
    g.fill()
    g.fillStyle = C.brand
    g.fillRect(2, 2, 116, 16)
    const im = pic(passSrc)
    if (im) g.drawImage(im, 34, 20, 52, 52)
  }, redraw)

  /* people */
  const guard = person({
    config: GUARD,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{PEAK_CAP('#22305A', '#141B2E', C.gold)}</>, top: <>{k.top}{GUARD_UNIFORM('#141B2E')}</> }),
    loop: LT,
    frames: 76,
    height: 1.76,
    density,
    redraw,
    timeline: (c) => ({ seed: 71, idle: CAST_IDLE, ...faceAt(LT, c, [[0, 'neutral'], [0.5, 'thinking'], [1.8, 'happy'], [2.7, 'proud'], [3.5, 'listening'], [6.4, 'neutral']]) }),
    pose: (p, c) => readerPose(p, c),
  })
  guard.object.position.set(-0.55, 0, -0.15)
  scene.add(guard.object)

  const visitor = person({
    config: VISITOR,
    loop: LT,
    frames: 76,
    height: 1.64,
    density,
    redraw,
    timeline: (c) => ({ seed: 23, idle: CAST_IDLE, ...faceAt(LT, c, [[0, 'neutral'], [0.35, 'listening'], [2.0, 'happy'], [4.7, 'excited'], [6.0, 'happy'], [7.1, 'neutral']]) }),
    pose: (p, c) => riderPose(p, c),
  })
  T.car.add(visitor.object)
  visitor.object.position.set(0.05, 0.08, -0.3)
  const pass = heldCard(passTex, 0.26, 0.17, [-0.28, 0.88, 0.05], [-0.42, 1.16, 0.12], 0.08)
  T.car.add(pass.g)

  return (t) => {
    const c = mod(t, LT)
    towerUpdate(T, c)
    pass.set(seg(c, T7.raiseA, T7.raiseB) * (1 - seg(c, T7.lowerA, T7.lowerB)))
    warm.emissiveIntensity = 0.25 + 0.85 * hold(c, T7.openA, T7.openB, T7.close2A, T7.close2B)
    lockOnDoor.scale.setScalar(1 + 0.05 * Math.sin(c * 4))
    guard.update(c, camera)
    visitor.update(c, camera)
  }
}

/** the guard / (unused in the concept) : looks at the pass, nods, presses the console, watches the lift go */
function readerPose(p: Pose, c: number) {
  const look = hold(c, T7.checkA - 0.2, T7.checkA + 0.15, T7.pressA, T7.pressA + 0.2)
  to(p, 'headTurn', 0.5, look)
  to(p, 'lookX', 0.85, look)
  to(p, 'lookY', 0.15, look)
  to(p, 'lean', 3, hold(c, T7.checkA, T7.checkA + 0.4, T7.checkB - 0.2, T7.checkB + 0.2))
  to(p, 'headNod', 0.35, hold(c, T7.nodA, T7.nodA + 0.15, T7.nodA + 0.15, T7.nodB))
  /* the press: the viewer-right arm reaches forward and down to the console, eyes on it */
  const press = hold(c, T7.pressA, T7.pressA + 0.3, T7.pressB - 0.1, T7.pressB + 0.25)
  to(p, 'shoulderR', 34, press)
  to(p, 'elbowR', 58, press)
  to(p, 'wristR', 10, press)
  to(p, 'fR1', 0, press)
  to(p, 'headTurn', 0.25, press)
  to(p, 'lookX', 0.4, press)
  to(p, 'lookY', 0.7, press)
  /* watches the lift rise and come back */
  const watch = hold(c, T7.upA, T7.upA + 0.4, T7.downB - 0.2, T7.open3B)
  to(p, 'headTurn', 0.55, watch)
  to(p, 'lookX', 0.8, watch)
  to(p, 'lookY', lerp(-0.1, -0.7, carY(c) / F1), watch)
}
/** the visitor / the user in the car: holds the card out to the reader, then looks toward the floor she is let onto */
function riderPose(p: Pose, c: number) {
  const up = seg(c, T7.raiseA, T7.raiseB) * (1 - seg(c, T7.lowerA, T7.lowerB))
  to(p, 'shoulderL', 64, up)
  to(p, 'elbowL', 46, up)
  to(p, 'wristL', -8, up)
  to(p, 'fL1', 0.6, up)
  to(p, 'fL2', 0.7, up)
  to(p, 'tL', 0.7, up)
  to(p, 'headTurn', -0.45, hold(c, 0, 0.25, T7.closeA, T7.closeB))
  to(p, 'lookX', -0.8, hold(c, 0, 0.25, T7.closeA, T7.closeB))
  /* riding: eyes up to the floor lamps */
  const ride = hold(c, T7.upA, T7.upA + 0.3, T7.upB - 0.2, T7.openB)
  to(p, 'lookY', -0.5, ride)
  /* at floor 1: turns to the permitted door on the left, a small open-hand gesture */
  const arrive = hold(c, T7.openA, T7.openB, T7.close2A, T7.close2B)
  to(p, 'headTurn', -0.55, arrive)
  to(p, 'lookX', -0.85, arrive)
  to(p, 'shoulderL', 40, arrive)
  to(p, 'elbowL', 30, arrive)
  to(p, 'palmL', 0.9, arrive)
  to(p, 'stance', -0.4, arrive)
}

/* ---------------------------------------------- T07 concept: the resource tower */

function setup7Concept(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame7(kit)
  scene.background = null
  const T = tower(kit, 'cloud')

  /* the authorization gate where the guard stood: a kiosk with a reader screen and a scanning arch over the lift door */
  const kiosk = new THREE.Group()
  const navy = mat('#22305A', { roughness: 0.4, metalness: 0.3 })
  kiosk.add(box(1.5, 0.95, 0.6, mat('#DCE5F5', { roughness: 0.5 }), [0, 0.475, 0], 0.05))
  kiosk.add(box(1.6, 0.06, 0.7, navy, [0, 0.98, 0], 0.02))
  kiosk.add(box(1.2, 0.08, 0.02, glow(C.brand, 0.6), [0, 0.6, 0.31]))
  kiosk.position.set(-0.75, 0, 0.45)
  scene.add(kiosk)
  T.console.position.set(-0.3, 1.04, 0.42)
  scene.add(T.console)
  /* the reader: a screen on a stand that shows the shield of authorization, where the guard's head was */
  const screen = new THREE.Group()
  screen.add(box(0.07, 0.8, 0.07, navy, [0, 0.4, 0], 0.02))
  screen.add(box(0.78, 0.56, 0.06, navy, [0, 1.02, 0], 0.04))
  const shieldTex = plateTex('shield', '#0F1D44', '#9CC0FF', 200, 140, redraw)
  const shieldFace = plane(0.7, 0.49, texMat(shieldTex), [0, 1.02, 0.035])
  screen.add(shieldFace)
  screen.position.set(-0.75, 1.01, 0.05)
  screen.rotation.y = 0.35
  scene.add(screen)
  /* the scan beam: a thin blue light fan from the reader to the card */
  const beamM = new THREE.MeshBasicMaterial({ color: '#5B8CFF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })
  const beam = flat(mesh(new THREE.ConeGeometry(0.22, 1.0, 24, 1, true), beamM, [0, 0, 0]))
  scene.add(beam)

  /* floor 1: the S3 bucket the user may read (official mark on a white tile, a 3D bucket that opens and glows) */
  const bucket = new THREE.Group()
  const bucketM = mat('#7AA116', { roughness: 0.4 })
  const body = cyl(0.42, 0.32, 0.72, bucketM, [0, 0.36, 0], 40)
  bucket.add(body)
  bucket.add(cyl(0.44, 0.44, 0.05, mat('#5F7F10', { roughness: 0.4 }), [0, 0.72, 0], 40))
  const lidHinge = new THREE.Group()
  lidHinge.position.set(0, 0.75, -0.42)
  lidHinge.add(cyl(0.45, 0.45, 0.06, mat('#8DB52A', { roughness: 0.35 }), [0, 0.03, 0.42], 40))
  bucket.add(lidHinge)
  const dataGlow = glow('#BFE7FF', 0.2)
  bucket.add(cyl(0.38, 0.38, 0.02, dataGlow, [0, 0.7, 0], 40))
  const blocks = [0, 1, 2].map((i) => {
    const m = glow(i === 1 ? '#7FA8FF' : '#9FE3C1', 0.8)
    const b = box(0.14, 0.14, 0.14, m, [-0.16 + i * 0.16, 0.6, 0.02], 0.03)
    b.castShadow = false
    bucket.add(b)
    return b
  })
  bucket.position.set(-1.4, F1, -0.85)
  scene.add(bucket)
  const tileTex = paintTex(160, 160, [bucketUrl], (g, pic) => {
    rr(g, 4, 4, 152, 152, 22)
    g.fillStyle = '#FFFFFF'
    g.fill()
    const im = pic(bucketUrl)
    if (im) g.drawImage(im, 26, 26, 108, 108)
  }, redraw)
  const tile = plane(0.62, 0.62, texMat(tileTex), [-1.4, F1 + 1.75, BZ0 + 0.12])
  scene.add(tile)
  /* floor 2: a database the user is NOT allowed onto, with an orange lock */
  const db = new THREE.Group()
  const dbM = mat('#4C6FD8', { roughness: 0.35, metalness: 0.2 })
  for (let i = 0; i < 3; i++) {
    db.add(cyl(0.4, 0.4, 0.26, dbM, [0, 0.15 + i * 0.3, 0], 40))
    db.add(cyl(0.405, 0.405, 0.03, mat('#9DB6F5'), [0, 0.29 + i * 0.3, 0], 40))
  }
  db.position.set(-1.4, F2, -0.85)
  scene.add(db)
  const lockMat = new THREE.MeshBasicMaterial({ map: discTex('lock', C.orange, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const dbLock = disc(0.17, lockMat, [-1.4, F2 + 1.25, -0.2])
  dbLock.lookAt(camera.position)
  scene.add(dbLock)
  /* racks along the back walls so each level reads as a data hall */
  const rackM = mat('#2A3550', { roughness: 0.45, metalness: 0.3 })
  const leds: THREE.MeshStandardMaterial[] = []
  for (const lv of [0, F1, F2])
    for (const x of [-3.15, -2.5]) {
      scene.add(box(0.55, 1.7, 0.5, rackM, [x, lv + 0.85, BZ0 + 0.4], 0.03))
      for (let k = 0; k < 4; k++) {
        const m = glow(k % 2 ? '#7BE0A6' : '#7FA8FF', 0.6)
        leds.push(m)
        scene.add(box(0.36, 0.035, 0.01, m, [x, lv + 0.45 + k * 0.32, BZ0 + 0.655]))
      }
    }

  /* the policy card: a white card with the IAM permissions look (a document, a shield tick) */
  const docSrc = iconSrc('read', C.brand, 2)
  const okSrc = iconSrc('shield', C.green, 2.2)
  const cardTex = paintTex(120, 80, [docSrc, okSrc], (g, pic) => {
    rr(g, 2, 2, 116, 76, 10)
    g.fillStyle = '#FFFFFF'
    g.fill()
    g.fillStyle = '#E8EEFF'
    rr(g, 8, 8, 104, 64, 8)
    g.fill()
    const a = pic(docSrc)
    const b = pic(okSrc)
    if (a) g.drawImage(a, 16, 16, 46, 46)
    if (b) g.drawImage(b, 62, 16, 46, 46)
  }, redraw)

  const user = person({
    config: IAM_USER,
    dress: (k) => ({ ...k, top: <>{k.top}{BADGE(C.brandDark)}</> }),
    loop: LT,
    frames: 76,
    height: 1.7,
    density,
    redraw,
    timeline: (c) => ({ seed: 37, idle: CAST_IDLE, ...faceAt(LT, c, [[0, 'neutral'], [0.35, 'listening'], [2.0, 'happy'], [4.7, 'excited'], [6.0, 'happy'], [7.1, 'neutral']]) }),
    pose: (p, c) => riderPose(p, c),
  })
  T.car.add(user.object)
  user.object.position.set(0.05, 0.08, -0.3)
  const card = heldCard(cardTex, 0.26, 0.17, [-0.28, 0.9, 0.05], [-0.42, 1.18, 0.12], 0.08)
  T.car.add(card.g)

  const from = new THREE.Vector3()
  const toV = new THREE.Vector3()
  return (t) => {
    const c = mod(t, LT)
    towerUpdate(T, c)
    const k = seg(c, T7.raiseA, T7.raiseB) * (1 - seg(c, T7.lowerA, T7.lowerB))
    card.set(k)
    /* the scan beam from the reader screen to the card while it is checked, a sweep across it */
    const scan = hold(c, T7.checkA, T7.checkA + 0.25, T7.checkB - 0.25, T7.checkB)
    beamM.opacity = 0.32 * scan
    beam.visible = scan > 0.01
    if (beam.visible) {
      screen.localToWorld(from.set(0, 1.02, 0.06))
      card.g.getWorldPosition(toV)
      toV.y += 0.04 * Math.sin((c - T7.checkA) * 7)
      const len = from.distanceTo(toV)
      beam.scale.set(1, len, 1)
      beam.position.copy(from).add(toV).multiplyScalar(0.5)
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), toV.clone().sub(from).normalize())
    }
    shieldFace.scale.setScalar(1 + 0.06 * hold(c, T7.nodA, T7.nodA + 0.15, T7.nodA + 0.15, T7.nodB + 0.2))
    /* floor 1: the bucket opens and glows while the user is there */
    const open = hold(c, T7.openA, T7.openB + 0.2, T7.close2A, T7.close2B)
    lidHinge.rotation.x = 0.55 * open
    lidHinge.position.y = 0.75 + 0.12 * open
    blocks.forEach((b, i) => {
      b.position.y = 0.6 + open * (0.42 + 0.12 * i + 0.05 * Math.sin(c * 3 + i * 2))
      b.rotation.y = open * (c * 0.8 + i)
      b.visible = open > 0.02
    })
    dataGlow.emissiveIntensity = 0.2 + 1.1 * open
    tile.scale.setScalar(1 + 0.06 * open)
    dbLock.scale.setScalar(1 + 0.05 * Math.sin(c * 4))
    leds.forEach((m, i) => (m.emissiveIntensity = 0.45 + 0.5 * Math.max(0, Math.sin((c / LT) * Math.PI * 2 * (3 + (i % 4)) + i * 1.3))))
    user.update(c, camera)
  }
}

/* ================================================================== T10 · THE PLATFORM (shared ground plan) */

const LP = 7.8
const T10 = { raiseA: 0, raiseB: 0.5, readA: 0.5, readB: 1.2, a: 1.8, r: 2.6, cnd: 3.4, eff: 4.1, openA: 4.35, openB: 4.95, closeA: 6.45, closeB: 7.05, fadeA: 6.6, fadeB: 7.1 }
const HOLD10 = 5.4 // every check ticked, the door open on the one seat

/* the plan, shared: the coach (or the bay wall) along the back, the door, the seat, the board on the platform */
const PZ = -1.0 // the coach / bay wall front face
const DOOR_X = 0.35
const SEAT_X = 1.55
const NEXT_X = -1.15 // the neighbouring seat / bay
const WINDOWS = [-3.6, NEXT_X, SEAT_X, 2.75]
const PLATE: THREE.Vector3Tuple = [DOOR_X, 2.53, PZ + 0.03] // the train board / the action plate, over the door
const BOARD: THREE.Vector3Tuple = [-2.75, 2.1, 0.25] // the date board / the condition post
const READER: THREE.Vector3Tuple = [-1.7, 0, 0.55] // the examiner / the checkpoint
const HOLDER: THREE.Vector3Tuple = [-0.4, 0, 0.9] // the passenger / the requester

function frame10(kit: StageKit) {
  const { camera, scene } = kit
  camera.fov = 31
  camera.position.set(-0.4, 2.05, 8.5)
  camera.lookAt(-0.4, 1.6, -0.5)
  lightRig(scene, [-0.4, 1.2, -0.4])
}

/** a green tick disc that pops in over a checked thing */
function tickDisc(kit: StageKit, pos: THREE.Vector3Tuple, r = 0.17): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({ map: discTex('check', C.green, '#FFFFFF', kit.redraw, '#FFFFFF'), transparent: true, toneMapped: false })
  const d = disc(r, m, pos)
  d.lookAt(kit.camera.position)
  d.renderOrder = 2
  kit.scene.add(d)
  return d
}
const tickScale = (c: number, at: number) => {
  const k = seg(c, at, at + 0.28) * (1 - seg(c, T10.fadeA, T10.fadeB))
  return 0.001 + k * (1 + 0.12 * Math.sin(clamp01((c - at) / 0.28) * Math.PI))
}

/** the examiner / the checkpoint's gaze: the ticket, then the board on the coach, the seat, the date board */
function examinerPose(p: Pose, c: number) {
  const tk = hold(c, T10.readA - 0.15, T10.readA + 0.15, T10.a - 0.6, T10.a - 0.4)
  to(p, 'headTurn', 0.5, tk)
  to(p, 'lookX', 0.85, tk)
  to(p, 'lookY', 0.25, tk)
  const brd = hold(c, T10.a - 0.6, T10.a - 0.3, T10.r - 0.6, T10.r - 0.4)
  to(p, 'headTurn', 0.45, brd)
  to(p, 'lookX', 0.7, brd)
  to(p, 'lookY', -0.75, brd)
  to(p, 'headNod', -0.25, brd)
  const st = hold(c, T10.r - 0.6, T10.r - 0.3, T10.cnd - 0.6, T10.cnd - 0.4)
  to(p, 'headTurn', 0.75, st)
  to(p, 'lookX', 1, st)
  to(p, 'lookY', -0.3, st)
  const dt = hold(c, T10.cnd - 0.6, T10.cnd - 0.3, T10.eff - 0.55, T10.eff - 0.35)
  to(p, 'headTurn', -0.6, dt)
  to(p, 'lookX', -0.9, dt)
  to(p, 'lookY', -0.45, dt)
  /* the stamp: the viewer-right hand reaches to the ticket and taps it */
  const stp = hold(c, T10.eff - 0.45, T10.eff - 0.15, T10.eff + 0.15, T10.eff + 0.45)
  to(p, 'shoulderR', 58, stp)
  to(p, 'elbowR', 40, stp)
  to(p, 'wristR', -10, stp)
  to(p, 'headTurn', 0.45, stp)
  to(p, 'lookX', 0.8, stp)
  to(p, 'lookY', 0.3, stp)
  to(p, 'headNod', 0.3, hold(c, T10.eff + 0.15, T10.eff + 0.3, T10.eff + 0.3, T10.eff + 0.5))
  /* the door opens: an open hand toward the coach */
  const go = hold(c, T10.openA, T10.openB, T10.closeA - 0.3, T10.closeA)
  to(p, 'shoulderR', 46, go)
  to(p, 'elbowR', 18, go)
  to(p, 'palmR', 1, go)
  to(p, 'fR1', 0, go)
  to(p, 'fR2', 0, go)
  to(p, 'fR3', 0.05, go)
  to(p, 'fR4', 0.1, go)
  to(p, 'headTurn', 0.35, go)
  to(p, 'lookX', 0.6, go)
}
/** the passenger / the requester: the card held out to the reader, then a look at the open door and the seat */
const raise10 = (c: number) => seg(c, T10.raiseA, T10.raiseB) * (1 - seg(c, T10.closeB - 0.1, LP - 0.05))
function holderPose(p: Pose, c: number) {
  const up = raise10(c)
  to(p, 'shoulderL', 60, up)
  to(p, 'elbowL', 48, up)
  to(p, 'wristL', -6, up)
  to(p, 'fL1', 0.6, up)
  to(p, 'fL2', 0.7, up)
  to(p, 'tL', 0.7, up)
  const watch = hold(c, 0.1, 0.4, T10.openA, T10.openA + 0.3)
  to(p, 'headTurn', -0.45, watch)
  to(p, 'lookX', -0.75, watch)
  const sees = hold(c, T10.openA, T10.openB, T10.closeA, T10.closeB)
  to(p, 'headTurn', 0.35, sees)
  to(p, 'lookX', 0.8, sees)
  to(p, 'lookY', -0.1, sees)
  to(p, 'stance', 0.45, sees)
}
const examinerFace = (c: number) => faceAt(LP, c, [[0, 'neutral'], [0.5, 'thinking'], [1.75, 'listening'], [3.4, 'thinking'], [4.15, 'happy'], [4.9, 'proud'], [6.8, 'neutral']])
const holderFace = (c: number) => faceAt(LP, c, [[0, 'neutral'], [0.4, 'listening'], [4.15, 'happy'], [4.9, 'excited'], [6.5, 'happy'], [7.3, 'neutral']])

/* ---------------------------------------------- the coach / the bay wall, shared by both T10 cards */

type Wall = { seat: THREE.MeshStandardMaterial; hinge: THREE.Group; inside: THREE.MeshStandardMaterial }
/**
 * A long body along the back with inset windows and one door. Everything that must be SEEN through the skin (the lit
 * interior, the seat, the glass) is built just in front of the skin, so the body can stay one solid box; the door leaf
 * swings inward on a hinge at its left edge, into the body, uncovering the lit doorway.
 */
function backWall(kit: StageKit, look: 'coach' | 'bays', fill: (x: number, z: number) => void): Wall {
  const { scene } = kit
  const coach = look === 'coach'
  const cz = PZ - 0.55
  scene.add(box(11.5, 2.5, 1.1, mat(coach ? '#3563C9' : '#22305A', { roughness: 0.4, metalness: 0.15 }), [-0.5, 1.5, cz], 0.12))
  scene.add(box(11.52, coach ? 0.2 : 0.08, 1.12, coach ? mat('#F3E7C8', { roughness: 0.5 }) : glow(C.brand, 0.5), [-0.5, 0.95, cz]))
  scene.add(box(11.4, 0.3, 1.0, mat('#3C4458', { roughness: 0.6 }), [-0.5, 0.15, cz]))
  scene.add(box(11.3, 0.1, 1.05, mat('#C4CBD8', { roughness: 0.4, metalness: 0.4 }), [-0.5, 2.78, cz], 0.04))
  const rim = mat(coach ? '#1D2C4F' : '#0B1430', { roughness: 0.5 })
  const glassM = new THREE.MeshStandardMaterial({ color: '#A9C8EE', roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false })
  let seat: THREE.MeshStandardMaterial | null = null
  for (const x of WINDOWS) {
    scene.add(plane(0.92, 0.72, rim, [x, 1.62, PZ + 0.003]))
    scene.add(plane(0.82, 0.62, mat(coach ? '#F4EAD3' : '#13204A', { roughness: 0.8 }), [x, 1.62, PZ + 0.006]))
    if (coach) {
      const m = new THREE.MeshStandardMaterial({ color: '#4A6CD1', roughness: 0.5, emissive: new THREE.Color('#FFB23D'), emissiveIntensity: 0 })
      scene.add(flat(box(0.46, 0.36, 0.02, m, [x, 1.52, PZ + 0.02], 0.04)))
      scene.add(flat(box(0.4, 0.07, 0.02, mat('#E9EEF7'), [x, 1.74, PZ + 0.03], 0.02)))
      if (x === SEAT_X) seat = m
    } else fill(x, PZ + 0.02)
    scene.add(plane(0.82, 0.62, glassM, [x, 1.62, PZ + 0.05]))
  }
  /* the doorway: a dark rim, the interior (lit when the door opens), the leaf on its hinge */
  scene.add(plane(1.0, 2.1, rim, [DOOR_X, 1.3, PZ + 0.003]))
  const inside = new THREE.MeshStandardMaterial({ color: coach ? '#E9DCC0' : '#1A2A5C', roughness: 0.7, emissive: new THREE.Color(coach ? '#FFE3A3' : '#9CC0FF'), emissiveIntensity: 0 })
  scene.add(plane(0.9, 2.0, inside, [DOOR_X, 1.3, PZ + 0.006]))
  /* inside the doorway: a grab pole and the step */
  scene.add(plane(0.05, 1.7, mat('#C4CBD8', { roughness: 0.3, metalness: 0.6 }), [DOOR_X + 0.3, 1.35, PZ + 0.009]))
  scene.add(plane(0.9, 0.12, mat(coach ? '#8E939E' : '#2A3550', { roughness: 0.7 }), [DOOR_X, 0.36, PZ + 0.009]))
  const hinge = new THREE.Group()
  hinge.position.set(DOOR_X - 0.45, 1.3, PZ + 0.03)
  const leaf = new THREE.Group()
  leaf.position.x = 0.45
  leaf.add(box(0.9, 2.0, 0.04, mat(coach ? '#2F5CC2' : '#3A5BB8', { roughness: 0.38, metalness: 0.2 }), [0, 0, 0], 0.03))
  leaf.add(box(0.48, 0.5, 0.012, mat(coach ? '#1D2C4F' : '#0B1430', { roughness: 0.2 }), [0, 0.38, 0.022], 0.02))
  leaf.add(box(0.04, 0.38, 0.04, mat('#C4CBD8', { roughness: 0.3, metalness: 0.6 }), [0.33, -0.1, 0.04], 0.015))
  hinge.add(leaf)
  scene.add(hinge)
  return { seat: seat ?? new THREE.MeshStandardMaterial(), hinge, inside }
}

/** the platform / the hall floor, the canopy over it (no shadow: it would darken the whole coach) */
function ground10(kit: StageKit, look: 'coach' | 'bays') {
  const { scene } = kit
  const coach = look === 'coach'
  scene.add(mesh(new THREE.BoxGeometry(14, 0.5, 4.4), mat(coach ? '#C9CCD3' : '#DCE4F2', { roughness: 0.9 }), [-0.5, -0.25, 1.2]))
  scene.add(flat(box(14, 0.012, coach ? 0.22 : 0.1, mat(coach ? '#F2C14E' : C.brand, { roughness: 0.7 }), [-0.5, 0.006, PZ + 0.4])))
  if (coach) scene.add(flat(box(14, 0.4, 3, mat('#7C756C', { roughness: 0.95 }), [-0.5, -0.75, -2.5])))
  const steel = mat(coach ? '#7E8A9E' : '#8EA0C2', { roughness: 0.35, metalness: 0.5 })
  for (const x of [-3.5, 2.35]) scene.add(flat(cyl(0.07, 0.07, 3.6, steel, [x, 1.8, 1.6], 16)))
  /* the station's far wall behind the coach / the hall's back wall behind the bays, so nothing reads as a void */
  scene.add(flat(box(16, 5, 0.2, mat(coach ? '#EFE6D6' : '#E3EAF6', { roughness: 0.9 }), [-0.5, 2.0, -3.6])))
  for (const x of [-4.2, -1.4, 1.4]) scene.add(flat(box(1.6, 0.9, 0.04, mat(coach ? '#CFE0F2' : '#C7D6F0', { roughness: 0.3 }), [x, 3.25, -3.48])))
  /* the canopy: a light underside, a coloured fascia along its front edge */
  scene.add(flat(box(14, 0.08, 3.4, mat(coach ? '#F2EEE8' : '#EEF2FA', { roughness: 0.8 }), [-0.5, 3.66, 0.6])))
  scene.add(flat(box(14, 0.26, 0.08, mat(coach ? '#B7323A' : '#1F2E63', { roughness: 0.55 }), [-0.5, 3.78, 2.3])))
  const lightM = glow(coach ? '#FFF2CC' : '#CFE0FF', 0.7)
  for (const x of [-2.6, -0.4, 1.8]) scene.add(flat(box(1.2, 0.03, 0.12, lightM, [x, 3.59, 1.0], 0.01)))
  return steel
}

/* ---------------------------------------------- T10 everyday: the railway platform */

function setup10Everyday(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame10(kit)
  scene.background = null
  const steel = ground10(kit, 'coach')
  const wall = backWall(kit, 'coach', () => {})

  /* the train board over the door (train icon) */
  const plateT = plateTex('train', '#14203F', '#FFFFFF', 180, 100, redraw)
  scene.add(plane(0.72, 0.4, texMat(plateT, true), PLATE))
  /* the platform date board on its post (calendar icon) */
  scene.add(cyl(0.05, 0.05, 2.0, steel, [BOARD[0], 1.0, BOARD[2]], 16))
  scene.add(box(0.86, 0.62, 0.06, mat('#14203F', { roughness: 0.5 }), [BOARD[0], BOARD[1], BOARD[2] - 0.035], 0.04))
  const calT = plateTex('calendar', '#14203F', '#FFFFFF', 160, 116, redraw)
  scene.add(plane(0.8, 0.58, texMat(calT, true), [BOARD[0], BOARD[1], BOARD[2] + 0.002]))

  const tA = tickDisc(kit, [PLATE[0] + 0.52, PLATE[1], PLATE[2] + 0.1])
  const tR = tickDisc(kit, [SEAT_X, 2.2, PZ + 0.12])
  const tC = tickDisc(kit, [BOARD[0] + 0.56, BOARD[1] + 0.24, BOARD[2] + 0.1])

  /* the ticket: cream, a train, a seat and a calendar; a green tick is stamped on it */
  const srcs = [iconSrc('train', C.ink, 2.2), iconSrc('seat', C.ink, 2.2), iconSrc('calendar', C.ink, 2.2)]
  const ticketTex = paintTex(150, 84, srcs, (g, pic) => {
    rr(g, 2, 2, 146, 80, 10)
    g.fillStyle = '#FFF4DA'
    g.fill()
    g.fillStyle = '#E2553A'
    g.fillRect(2, 2, 12, 80)
    srcs.forEach((s, i) => {
      const im = pic(s)
      if (im) g.drawImage(im, 24 + i * 38, 26, 32, 32)
    })
  }, redraw)
  const ticket = heldCard(ticketTex, 0.32, 0.18, [-0.3, 0.86, 0.12], [-0.48, 1.15, 0.2], 0.06)
  const root = new THREE.Group()
  root.position.set(...HOLDER)
  root.add(ticket.g)
  scene.add(root)
  const stampM = new THREE.MeshBasicMaterial({ map: discTex('check', C.green, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const stamp = disc(0.045, stampM, [0.11, 0, 0.012])
  ticket.g.add(stamp)

  const examiner = person({
    config: EXAMINER,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{PEAK_CAP('#1E2230', '#2B3044', C.gold)}</>, top: <>{k.top}{TTE_COAT}</> }),
    loop: LP,
    frames: 80,
    height: 1.74,
    density,
    redraw,
    timeline: (c) => ({ seed: 83, idle: CAST_IDLE, ...examinerFace(c) }),
    pose: examinerPose,
  })
  examiner.object.position.set(...READER)
  scene.add(examiner.object)
  const passenger = person({
    config: PASSENGER,
    loop: LP,
    frames: 80,
    height: 1.62,
    density,
    redraw,
    timeline: (c) => ({ seed: 19, idle: CAST_IDLE, ...holderFace(c) }),
    pose: holderPose,
  })
  passenger.object.position.set(...HOLDER)
  scene.add(passenger.object)

  return (t) => {
    const c = mod(t, LP)
    ticket.set(raise10(c))
    tA.scale.setScalar(tickScale(c, T10.a))
    tR.scale.setScalar(tickScale(c, T10.r))
    tC.scale.setScalar(tickScale(c, T10.cnd))
    stamp.scale.setScalar(tickScale(c, T10.eff))
    const open = hold(c, T10.openA, T10.openB, T10.closeA, T10.closeB)
    wall.hinge.rotation.y = 1.45 * open
    wall.inside.emissiveIntensity = 0.75 * open
    /* the one seat glows from its check on, brighter while the door is open */
    wall.seat.emissiveIntensity = 0.75 * seg(c, T10.r, T10.r + 0.3) * (1 - seg(c, T10.fadeA, T10.fadeB)) + 0.35 * open * (0.85 + 0.15 * Math.sin(c * 5))
    examiner.update(c, camera)
    passenger.update(c, camera)
  }
}

/* ---------------------------------------------- T10 concept: the resource bays and the policy checkpoint */

function setup10Concept(kit: StageKit, density: () => number): Update {
  const { scene, camera, redraw } = kit
  frame10(kit)
  scene.background = null
  const steel = ground10(kit, 'bays')

  /* what each bay window shows: the allowed bucket (official mark) where the seat was, a locked database next door,
     racks with LEDs in the others */
  const leds: THREE.MeshStandardMaterial[] = []
  let bucketGlow: THREE.MeshStandardMaterial | null = null
  let bucketFace: THREE.Mesh | null = null
  let nextLock: THREE.Mesh | null = null
  const bucketTex = paintTex(160, 160, [bucketUrl], (g, pic) => {
    rr(g, 6, 6, 148, 148, 22)
    g.fillStyle = '#FFFFFF'
    g.fill()
    const im = pic(bucketUrl)
    if (im) g.drawImage(im, 22, 22, 116, 116)
  }, redraw)
  const dbTex = plateTex('database', '#13204A', '#7F9AE0', 160, 120, redraw)
  const lockMat = new THREE.MeshBasicMaterial({ map: discTex('lock', C.orange, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const wall = backWall(kit, 'bays', (x, z) => {
    if (x === SEAT_X) {
      bucketGlow = glow('#BFE7FF', 0)
      scene.add(plane(0.8, 0.6, bucketGlow, [x, 1.62, z - 0.01]))
      bucketFace = plane(0.46, 0.46, texMat(bucketTex), [x, 1.62, z + 0.005])
      scene.add(bucketFace)
    } else if (x === NEXT_X) {
      scene.add(plane(0.66, 0.5, texMat(dbTex), [x, 1.62, z]))
      nextLock = disc(0.12, lockMat, [x + 0.3, 1.86, z + 0.04])
      scene.add(nextLock)
    } else
      for (let k = 0; k < 3; k++) {
        const m = glow(k % 2 ? '#7BE0A6' : '#7FA8FF', 0.5)
        leds.push(m)
        scene.add(plane(0.5, 0.04, m, [x, 1.46 + k * 0.17, z]))
      }
  })

  /* the action plate over the bay door (read: s3:GetObject), where the train board was */
  const plateT = plateTex('read', '#0B1430', '#FFFFFF', 180, 100, redraw)
  scene.add(plane(0.72, 0.4, texMat(plateT, true), PLATE))
  /* the condition post (globe: the source IP), where the date board was */
  scene.add(cyl(0.05, 0.05, 2.0, steel, [BOARD[0], 1.0, BOARD[2]], 16))
  scene.add(box(0.86, 0.62, 0.06, mat('#0B1430', { roughness: 0.5 }), [BOARD[0], BOARD[1], BOARD[2] - 0.035], 0.04))
  const globeT = plateTex('globe', '#0B1430', '#9CC0FF', 160, 116, redraw)
  scene.add(plane(0.8, 0.58, texMat(globeT, true), [BOARD[0], BOARD[1], BOARD[2] + 0.002]))

  /* the checkpoint where the examiner stood: a kiosk, a screen on a stand with the policy's four parts as lamps */
  const kiosk = new THREE.Group()
  const navy = mat('#22305A', { roughness: 0.4, metalness: 0.3 })
  kiosk.add(box(0.52, 1.0, 0.42, mat('#E3EAF7', { roughness: 0.5 }), [0, 0.5, 0], 0.05))
  kiosk.add(box(0.44, 0.06, 0.02, glow(C.brand, 0.6), [0, 0.8, 0.215]))
  kiosk.add(box(0.08, 0.36, 0.08, navy, [0, 1.18, -0.04], 0.02))
  kiosk.add(box(0.74, 0.74, 0.07, navy, [0, 1.68, -0.02], 0.05))
  kiosk.position.set(READER[0], 0, READER[2] - 0.05)
  kiosk.rotation.y = 0.28
  scene.add(kiosk)
  const parts = ['toggle', 'play', 'target', 'filter'] as const
  const lampOff = parts.map((n) => new THREE.MeshBasicMaterial({ map: discTex(n, '#2E3D6B', '#9CB0D9', redraw), transparent: true, toneMapped: false }))
  const lampOn = parts.map((n) => new THREE.MeshBasicMaterial({ map: discTex(n, C.green, '#FFFFFF', redraw), transparent: true, toneMapped: false }))
  const lamps = parts.map((_, i) => {
    const d = disc(0.12, lampOff[i], [-0.16 + (i % 2) * 0.32, 1.84 - Math.floor(i / 2) * 0.32, 0.02])
    kiosk.add(d)
    return d
  })
  const beamM = new THREE.MeshBasicMaterial({ color: '#5B8CFF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })
  const beam = flat(mesh(new THREE.ConeGeometry(0.18, 1.0, 24, 1, true), beamM, [0, 0, 0]))
  scene.add(beam)

  const tA = tickDisc(kit, [PLATE[0] + 0.52, PLATE[1], PLATE[2] + 0.1])
  const tR = tickDisc(kit, [SEAT_X, 2.2, PZ + 0.12])
  const tC = tickDisc(kit, [BOARD[0] + 0.56, BOARD[1] + 0.24, BOARD[2] + 0.1])

  /* the policy card: effect switch, action, resource, condition; the switch turns green (Allow) */
  const srcs = [iconSrc('toggle', '#9AA7C2', 2.2), iconSrc('play', C.ink, 2.2), iconSrc('target', C.ink, 2.2), iconSrc('filter', C.ink, 2.2)]
  const cardTex = paintTex(160, 84, srcs, (g, pic) => {
    rr(g, 2, 2, 156, 80, 10)
    g.fillStyle = '#FFFFFF'
    g.fill()
    g.fillStyle = C.brand
    g.fillRect(2, 2, 156, 12)
    srcs.forEach((s, i) => {
      const im = pic(s)
      if (im) g.drawImage(im, 12 + i * 36, 30, 30, 30)
    })
  }, redraw)
  const card = heldCard(cardTex, 0.34, 0.18, [-0.3, 0.88, 0.12], [-0.48, 1.17, 0.2], 0.06)
  const root = new THREE.Group()
  root.position.set(...HOLDER)
  root.add(card.g)
  scene.add(root)
  const allowM = new THREE.MeshBasicMaterial({ map: discTex('toggle', C.green, '#FFFFFF', redraw), transparent: true, toneMapped: false })
  const allow = disc(0.038, allowM, [-0.115, -0.005, 0.012])
  card.g.add(allow)

  const requester = person({
    config: REQUESTER,
    dress: (k) => ({ ...k, top: <>{k.top}{BADGE(C.brandDark)}</> }),
    loop: LP,
    frames: 80,
    height: 1.64,
    density,
    redraw,
    timeline: (c) => ({ seed: 47, idle: CAST_IDLE, ...holderFace(c) }),
    pose: holderPose,
  })
  requester.object.position.set(...HOLDER)
  scene.add(requester.object)

  const from = new THREE.Vector3()
  const toV = new THREE.Vector3()
  const ats = [T10.eff, T10.a, T10.r, T10.cnd]
  return (t) => {
    const c = mod(t, LP)
    card.set(raise10(c))
    tA.scale.setScalar(tickScale(c, T10.a))
    tR.scale.setScalar(tickScale(c, T10.r))
    tC.scale.setScalar(tickScale(c, T10.cnd))
    allow.scale.setScalar(tickScale(c, T10.eff))
    lamps.forEach((d, i) => {
      const on = seg(c, ats[i], ats[i] + 0.2) * (1 - seg(c, T10.fadeA, T10.fadeB)) > 0.5
      d.material = on ? lampOn[i] : lampOff[i]
      d.scale.setScalar(on ? 1 + 0.06 * Math.sin(c * 5 + i) : 1)
    })
    const scan = hold(c, T10.readA, T10.readA + 0.2, T10.a - 0.5, T10.a - 0.3) + hold(c, T10.eff - 0.45, T10.eff - 0.25, T10.eff + 0.1, T10.eff + 0.3)
    beamM.opacity = 0.32 * clamp01(scan)
    beam.visible = scan > 0.01
    if (beam.visible) {
      kiosk.localToWorld(from.set(0, 1.68, 0.06))
      card.g.getWorldPosition(toV)
      toV.y += 0.03 * Math.sin(c * 8)
      beam.scale.set(1, from.distanceTo(toV), 1)
      beam.position.copy(from).add(toV).multiplyScalar(0.5)
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), toV.clone().sub(from).normalize())
    }
    const open = hold(c, T10.openA, T10.openB, T10.closeA, T10.closeB)
    wall.hinge.rotation.y = 1.45 * open
    wall.inside.emissiveIntensity = 0.75 * open
    if (bucketGlow) (bucketGlow as THREE.MeshStandardMaterial).emissiveIntensity = 0.55 * seg(c, T10.r, T10.r + 0.3) * (1 - seg(c, T10.fadeA, T10.fadeB)) + 0.6 * open * (0.85 + 0.15 * Math.sin(c * 5))
    if (bucketFace) (bucketFace as THREE.Mesh).scale.setScalar(1 + 0.05 * open)
    if (nextLock) (nextLock as THREE.Mesh).scale.setScalar(1 + 0.05 * Math.sin(c * 4))
    leds.forEach((m, i) => (m.emissiveIntensity = 0.4 + 0.5 * Math.max(0, Math.sin((c / LP) * Math.PI * 2 * (3 + (i % 4)) + i * 1.3))))
    requester.update(c, camera)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const T07Everyday = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD7} setup={setup7Everyday} />
const T07Concept = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD7} setup={setup7Concept} />
const T10Everyday = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD10} setup={setup10Everyday} />
const T10Concept = ({ step = 0 }: Fig) => <Stage step={step} holdT={HOLD10} setup={setup10Concept} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T07Everyday: T07Everyday as (p: Record<string, unknown>) => ReactNode,
  I_T07Concept: T07Concept as (p: Record<string, unknown>) => ReactNode,
  I_T10Everyday: T10Everyday as (p: Record<string, unknown>) => ReactNode,
  I_T10Concept: T10Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
