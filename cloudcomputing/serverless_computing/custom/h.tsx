import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'
import lambdaUrl from './h-lambda.svg'
import apigwUrl from './h-apigw.svg'

/**
 * BUILDER H · SESSION 10 ANALOGIES ON SLIDES 16 (TR 6, handler contract ↔ a service counter), 23 (TR 11, cold start ↔
 * a food stall's stove) AND 31 (TR 15, execution timeout ↔ booked time in a gaming zone), built from the first draft to
 * Session 9's review rules (generate-slides standing corrections 13-14, cloud course R10-R11):
 *  - real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera, a real place;
 *  - people are Character Lab characters (rig frames pre-rendered onto depth-tested planes, `rigSprite` below with a
 *    `dress` hook for role clothing: the clerk's lanyard, the cook's cap and apron, the gamer's headset), each an
 *    individual, expressions synced to the action, minimal joint movement for standing roles;
 *  - no text, digits or labels on either card; the concept card mirrors the everyday card position for position;
 *  - every loop is wall-clock driven, plays the whole action and ends on its first frame (no rest beat);
 *  - build: press 1 plays the everyday scene, press 2 the concept scene; held frames (`?still`, thumbnails, reduced
 *    motion) draw the key moment at `HOLD` with nothing moving.
 *
 *   S16 everyday  a service hall: the visitor hands a filled form across the counter, a token slip with a time-left
 *                 dial prints from the token machine and slides to the clerk, the clerk writes the reply on a fresh
 *                 sheet and hands it back; the visitor reads it pleased, pockets it and holds the next form.
 *   S16 concept   a data-centre floor, same places: the caller (API Gateway) sends an event document into the handler
 *                 block (Lambda), the platform pillar sends the context slip (ID tag + timer dial) in beside it, the
 *                 handler works and the return-value document travels back; the caller lights green.
 *   S23 everyday  a street food stall: no customers, stove off; a customer arrives and orders, the cook lights the
 *                 stove and heats the pan while the customer waits, then serves; the next customer is served at once
 *                 on the hot pan; the stall empties and the stove goes off.
 *   S23 concept   the same places: request one arrives, no environment: the platform builds one (init) while the
 *                 request waits with a spinner, then it runs (invoke) and answers; request two runs at once on the
 *                 warm environment; idle, the environment is reclaimed.
 *   S31 everyday  a gaming zone: the player at the arcade station mid-level, the booked-time ring running down; the
 *                 ring empties and the screen switches off mid-level; the player is shocked; the ring is re-booked.
 *   S31 concept   the same places: a function block working (progress filling), a timer puck runs along the time track
 *                 into the red timeout gate, the run stops unfinished and the caller receives the error.
 */

const W = 470
const H = 390

/* palette: engine tokens (royal blue dominant, small warm accents) */
const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandSoft: '#DCE6FF',
  navy: '#1F2E63',
  ink: '#00254B',
  steel: '#C9D3E6',
  steelDark: '#8E9BB5',
  wall: '#F3F6FC',
  floor: '#E6ECF6',
  wood: '#C99A6A',
  woodDark: '#9C6E45',
  white: '#FFFFFF',
  paper: '#FBFCFF',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#16A34A',
  red: '#E5484D',
  lambda: '#ED7100',
  dcFloor: '#DDE4F0',
  dcWall: '#EEF2FA',
}

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
/** 0..1 progress of `t` through [a, b], eased */
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
/** 1 inside [a, b] with eased edges of `e` s */
const win = (t: number, a: number, b: number, e = 0.2) => seg(t, a - e, a) * (1 - seg(t, b, b + e))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerp3 = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple, k: number): THREE.Vector3Tuple => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]
/** an arc between two points, lifted by `lift` at the middle */
const arc = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple, k: number, lift: number): THREE.Vector3Tuple => {
  const p = lerp3(a, b, k)
  p[1] += Math.sin(k * Math.PI) * lift
  return p
}

/* every drawn texture is rasterised at TEX_SS x its logical size, so papers, tiles and stripes stay crisp on a 4K
   screen (Session 10 correction 15); the draw code keeps its logical coordinates */
const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g2 = c.getContext('2d')!
  g2.scale(TEX_SS, TEX_SS)
  draw(g2)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

/** an SVG / image file drawn into a canvas texture once it loads (an AWS mark), then a held frame redraws */
function imgTex(url: string, onLoad: () => void, size = 768, pad = 0): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const im = new Image()
  im.onload = () => {
    c.getContext('2d')!.drawImage(im, pad, pad, size - pad * 2, size - pad * 2)
    t.needsUpdate = true
    onLoad()
  }
  im.src = url
  return t
}

const tileTex = (base: string, line: string, n: number, repeat: [number, number]) =>
  canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 256, 256)
      g.strokeStyle = line
      g.lineWidth = 3
      const s = 256 / n
      for (let i = 0; i <= n; i++) {
        g.beginPath()
        g.moveTo(0, i * s)
        g.lineTo(256, i * s)
        g.moveTo(i * s, 0)
        g.lineTo(i * s, 256)
        g.stroke()
      }
    },
    repeat,
  )

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** a room: floor, back wall and left wall, all receiving shadows */
function room(scene: THREE.Scene, o: { floor: THREE.Material; back: THREE.Material; side: THREE.Material; w?: number; d?: number; h?: number; x?: number }) {
  const w = o.w ?? 9
  const d = o.d ?? 7
  const h = o.h ?? 3.6
  const x = o.x ?? 0
  const floor = mesh(new THREE.PlaneGeometry(w, d), o.floor, [x, 0, 0])
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false
  for (const m of [o.back, o.side] as THREE.MeshStandardMaterial[]) if (m.emissive) {
    m.emissive = m.color.clone()
    m.emissiveIntensity = 0.32
  }
  const back = mesh(new THREE.PlaneGeometry(w, h), o.back, [x, h / 2, -d / 2 + 1.2])
  back.castShadow = false
  const side = mesh(new THREE.PlaneGeometry(d, h), o.side, [x - w / 2, h / 2, 0])
  side.rotation.y = Math.PI / 2
  side.castShadow = false
  scene.add(floor, back, side)
}

/** a flat sheet (paper, slip) as a thin box so it casts a soft shadow; its texture faces +z */
function sheet(w: number, h: number, tex: THREE.Texture): THREE.Mesh {
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })
  const edge = mat('#EEF2FA')
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), [edge, edge, edge, edge, face, face])
  m.castShadow = true
  return m
}

/** a white rounded tile carrying an AWS mark (rule 54: the official mark on a white tile) */
function markTile(url: string, size: number, redraw: () => void): THREE.Group {
  const g = new THREE.Group()
  g.add(box(size, size, 0.06, mat(C.white, { roughness: 0.4 }), [0, 0, 0], 0.025))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.78, size * 0.78), new THREE.MeshBasicMaterial({ map: imgTex(url, redraw), transparent: true, toneMapped: false }))
  face.position.z = 0.032
  g.add(face)
  return g
}

/** an emissive material whose glow a scene drives (`emissiveIntensity`) */
const glowMat = (color: string, base = C.white, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })

/** the loop clock: -1 while the card's press has not come; held frames start at `hold` */
function clock(hold: number) {
  let first = true
  let start = Infinity
  return (t: number, on: boolean) => {
    if (first) {
      first = false
      start = on ? t - hold : Infinity
    }
    if (!on) {
      start = Infinity
      return -1
    }
    if (start === Infinity) start = t
    return t - start
  }
}

/** a ring that empties: an indexed RingGeometry whose draw range is cut to the remaining fraction */
function dialRing(r: number, w: number, color: string, segs = 64): { mesh: THREE.Mesh; set: (frac: number) => void } {
  const geo = new THREE.RingGeometry(r - w, r, segs, 1, Math.PI / 2, Math.PI * 2)
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.55, roughness: 0.4, side: THREE.DoubleSide }))
  const total = geo.index!.count
  return {
    mesh: m,
    set: (frac) => {
      const k = Math.round(clamp01(frac) * segs)
      geo.setDrawRange(0, (total / segs) * k)
    },
  }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
/**
 * The engine's `castSprite` with Session 9 j.tsx's `dress` hook (role props drawn in the rig's own frames, so they move
 * with it): the rig loop is pre-rendered once into `frames` images on a depth-tested, camera-facing plane (furniture in
 * front hides it) and the plane shows the frame for the scene's loop time.
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; /** extra rig units drawn on each side of the 400-wide box (outstretched arms never clip) */ wide?: number; onReady?: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 480 })
}

/** the expression at loop time c from a list of [start, name] keys, crossfading from the key before (wrapping) */
function faceAt(c: number, keys: [number, string][], loop: number): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - loop
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - loop
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
/** blend a channel toward a value by weight w */
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}
/**
 * REAL PHYSICS, AS A CLOSED FORM OF LOOP TIME: a mass-spring-damper (natural frequency `w` rad/s, damping ratio `z`)
 * driven by a target that jumps by `d` at each loop time `at`. The exact solution is the target minus each jump's
 * decaying residual r(tau) = e^(-z w tau) (cos(wd tau) + z w / wd sin(wd tau)), tau = time since that jump (mod the
 * loop, so a jump late in the loop still rings into the next one): deterministic per frame, seamless at the wrap, and
 * the same on every replay. Jumps sum to zero over a loop.
 */
function spring(c: number, base: number, jumps: [at: number, d: number][], loop: number, w = 8.5, z = 0.42): number {
  const wd = w * Math.sqrt(1 - z * z)
  let x = base
  for (const [at, d] of jumps) {
    if (c >= at) x += d
    const tau = (((c - at) % loop) + loop) % loop
    x -= d * Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau))
  }
  return x
}
/** the spring's acceleration (central difference), for the body's lag: a walker leans against a start, into a stop */
const springAcc = (c: number, base: number, jumps: [number, number][], loop: number, w?: number, z?: number) => {
  const h = 1 / 240
  return (spring(c + h, base, jumps, loop, w, z) - 2 * spring(c, base, jumps, loop, w, z) + spring(c - h, base, jumps, loop, w, z)) / (h * h)
}
const springVel = (c: number, base: number, jumps: [number, number][], loop: number, w?: number, z?: number) => {
  const h = 1 / 240
  return (spring(c + h, base, jumps, loop, w, z) - spring(c - h, base, jumps, loop, w, z)) / (2 * h)
}

/** a person, built from a preset with their own face, hair and clothes */
const who = (base: CharacterConfig, o: { hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})

/* role clothing, in the rig's frames (body frame 400 x 600; head-local around the skull centre 0,0) */
/** the clerk's lanyard and ID card */
const LANYARD = (
  <g data-part="lanyard">
    <path d="M 186 214 L 196 292 M 214 214 L 204 292" stroke="#2D63FB" strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={186} y={290} width={28} height={36} rx={4} fill="#FFFFFF" stroke="#2D63FB" strokeWidth={2.5} />
    <rect x={192} y={297} width={16} height={12} rx={2} fill="#9DB7FF" />
    <rect x={191} y={314} width={18} height={3} rx={1.5} fill="#2D63FB" />
  </g>
)
const CHEF_CAP = (
  <g data-part="cap" transform="translate(0 -50) scale(1 0.8) translate(0 50)">
    <path d="M -44 -50 C -70 -60 -66 -112 -34 -104 C -30 -134 30 -134 34 -104 C 66 -112 70 -60 44 -50 Z" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth={3} />
    <path d="M -46 -58 H 46 V -40 C 20 -46 -20 -46 -46 -40 Z" fill="#F5F8FF" stroke="#D8E3F5" strokeWidth={3} />
  </g>
)
const CHEF_APRON = (
  <g data-part="apron">
    <path d="M 170 236 H 230 V 270 C 246 276 250 300 248 330 L 246 420 H 154 L 152 330 C 150 300 154 276 170 270 Z" fill="#FFF4EC" stroke="#FF8A3D" strokeWidth={3} />
    <path d="M 170 236 C 168 220 160 212 152 208 M 230 236 C 232 220 240 212 248 208" stroke="#FF8A3D" strokeWidth={3} fill="none" />
    <rect x={178} y={318} width={44} height={30} rx={6} fill="none" stroke="#FF8A3D" strokeWidth={2.5} />
  </g>
)
/** the gamer's headset over the hair */
const HEADSET = (
  <g data-part="headset">
    <path d="M -66 6 C -72 -62 -40 -96 0 -96 C 40 -96 72 -62 66 6" stroke="#1F2E63" strokeWidth={10} fill="none" strokeLinecap="round" />
    <rect x={-80} y={-14} width={22} height={40} rx={9} fill="#2D63FB" stroke="#1F2E63" strokeWidth={4} />
    <rect x={58} y={-14} width={22} height={40} rx={9} fill="#2D63FB" stroke="#1F2E63" strokeWidth={4} />
    <path d="M -70 24 C -64 50 -40 60 -22 58" stroke="#1F2E63" strokeWidth={4} fill="none" strokeLinecap="round" />
    <circle cx={-20} cy={58} r={6} fill="#1F2E63" />
  </g>
)

/* ------------------------------------------------------------------ paper textures (no text: lines, boxes, a dial) */

/** a filled form: header band, ruled rows with filled lines and ticked boxes */
const formTex = () =>
  canvasTex(192, 256, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 192, 256)
    g.fillStyle = C.brand
    g.fillRect(0, 0, 192, 30)
    for (let i = 0; i < 6; i++) {
      const y = 52 + i * 32
      g.strokeStyle = '#C9D3E6'
      g.lineWidth = 2
      g.strokeRect(16, y, 16, 16)
      g.strokeStyle = C.brandDark
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(19, y + 8)
      g.lineTo(24, y + 13)
      g.lineTo(30, y + 3)
      g.stroke()
      g.fillStyle = '#AEB9D0'
      g.fillRect(42, y + 6, 120 - (i % 3) * 22, 5)
    }
  })
/** the token slip: a time-left dial and a row of marks */
const slipTex = () =>
  canvasTex(128, 192, (g) => {
    g.fillStyle = '#FFF7E8'
    g.fillRect(0, 0, 128, 192)
    g.strokeStyle = '#E9D5B0'
    g.lineWidth = 4
    g.strokeRect(2, 2, 124, 188)
    g.lineWidth = 10
    g.strokeStyle = '#F2E3C6'
    g.beginPath()
    g.arc(64, 80, 36, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = C.orange
    g.beginPath()
    g.arc(64, 80, 36, -Math.PI / 2, Math.PI * 0.9)
    g.stroke()
    g.fillStyle = C.navy
    g.fillRect(62, 52, 4, 30)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#B9A37E'
      g.fillRect(24 + i * 22, 140, 14, 14)
    }
  })
/** the reply sheet: lines are drawn on it in the scene (ink bars), so the texture is the blank sheet with a tick box */
const replyTex = () =>
  canvasTex(192, 256, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 192, 256)
    g.fillStyle = '#E9EFFB'
    g.fillRect(0, 0, 192, 22)
    g.strokeStyle = '#E3E8F2'
    g.lineWidth = 2
    for (let i = 0; i < 7; i++) {
      g.beginPath()
      g.moveTo(14, 50 + i * 28)
      g.lineTo(178, 50 + i * 28)
      g.stroke()
    }
  })
/** an event document for the concept side: braces-free JSON look as nested coloured rows */
const docTex = (accent: string) =>
  canvasTex(192, 256, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 192, 256)
    g.fillStyle = accent
    g.fillRect(0, 0, 192, 26)
    const rows: [number, number, string][] = [
      [18, 90, '#9DB7FF'],
      [34, 110, '#C9D3E6'],
      [34, 80, accent],
      [34, 120, '#C9D3E6'],
      [18, 70, '#9DB7FF'],
      [34, 100, '#C9D3E6'],
    ]
    rows.forEach(([x, w, col], i) => {
      g.fillStyle = col
      g.fillRect(x, 48 + i * 30, w, 10)
    })
  })
/** the context slip: an ID tag shape with a timer dial */
const ctxTex = () =>
  canvasTex(128, 192, (g) => {
    g.fillStyle = '#F2F6FF'
    g.fillRect(0, 0, 128, 192)
    g.strokeStyle = C.brand
    g.lineWidth = 5
    g.strokeRect(3, 3, 122, 186)
    g.fillStyle = C.brand
    g.beginPath()
    g.arc(64, 22, 7, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 9
    g.strokeStyle = '#D6E0FA'
    g.beginPath()
    g.arc(64, 86, 32, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = C.brand
    g.beginPath()
    g.arc(64, 86, 32, -Math.PI / 2, Math.PI * 0.8)
    g.stroke()
    g.fillStyle = C.navy
    g.fillRect(62, 62, 4, 26)
    g.fillStyle = '#9DB7FF'
    g.fillRect(22, 138, 84, 9)
    g.fillRect(22, 156, 60, 9)
  })

/* ------------------------------------------------------------------ the data-centre setting (concept side) */

function dataCentre(scene: THREE.Scene, o: { racksX: number[]; z: number }) {
  room(scene, {
    floor: mat('#ffffff', { map: tileTex(C.dcFloor, '#CCD5E5', 4, [9, 7]), roughness: 0.8 }),
    back: mat(C.dcWall, { roughness: 0.95 }),
    side: mat('#E6ECF7', { roughness: 0.95 }),
  })
  const rackM = mat('#2A3558', { roughness: 0.5, metalness: 0.2 })
  const led: THREE.MeshStandardMaterial[] = []
  for (const x of o.racksX) {
    scene.add(box(0.8, 2.3, 0.6, rackM, [x, 1.15, o.z], 0.03))
    for (let r = 0; r < 6; r++) {
      scene.add(box(0.66, 0.26, 0.02, mat('#38456E', { roughness: 0.6 }), [x, 0.35 + r * 0.33, o.z + 0.305]))
      const lm = glowMat(r % 3 === 0 ? C.green : '#5B8CFF', '#0F1A33')
      led.push(lm)
      scene.add(box(0.05, 0.05, 0.02, lm, [x + 0.24, 0.35 + r * 0.33, o.z + 0.318]))
    }
  }
  return (t: number) => led.forEach((m, i) => (m.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * (2.2 + (i % 5) * 0.7) + i))))
}

/* ================================================================== S16 · the service counter (TR 6) */

const L6 = 7
const HOLD6 = 2.05
/* places shared by both cards (position for position) */
const P6 = {
  clerk: [-0.72, 0, -0.36] as THREE.Vector3Tuple,
  visitor: [1.15, 0, 0.18] as THREE.Vector3Tuple,
  /* the token machine stands at the counter's LEFT end, on the clerk's side: its slip glides to the clerk's desk
     without passing over the visitor (the first build flew it over her head) */
  machine: [-1.68, 0, -0.62] as THREE.Vector3Tuple,
  /* where the papers travel */
  hand: [0.88, 1.2, 0.42] as THREE.Vector3Tuple,
  desk: [-0.16, 1.07, 0.05] as THREE.Vector3Tuple,
  deskSlip: [-1.14, 1.06, 0.06] as THREE.Vector3Tuple,
  deskReply: [-0.84, 1.07, 0.05] as THREE.Vector3Tuple,
  slot: [-1.68, 1.2, -0.38] as THREE.Vector3Tuple,
}
/* the visitor's steps: a spring-mass body that steps up to the counter to hand the form over, back to wait, up again
   for the reply and back to read it (x offsets from P6.visitor; real damped-spring physics, see `spring`) */
const STEP6: [number, number][] = [[0.12, -0.11], [1.5, 0.11], [4.0, -0.11], [5.3, 0.11]]
const visitorDx = (c: number) => spring(c, 0, STEP6, L6, 7.5, 0.5)
function frame6(camera: THREE.PerspectiveCamera) {
  /* centred on the whole group (counter / dais left edge -1.35 to the machine / pillar right edge 1.97), with a margin */
  /* centred on the whole group (machine / pillar left edge -1.93 to the visitor / caller right edge ~1.45) */
  camera.fov = 30
  camera.position.set(-0.22, 2.2, 6.2)
  camera.lookAt(-0.22, 1.08, -0.25)
}

/* the timeline both cards follow (s in the 7 s loop) */
const T6 = { give: [0.25, 1.35], slip: [0.9, 2.15], write: [2.2, 4.1], back: [4.2, 5.2], tuck: [5.5, 6.2], next: [6.25, 6.95] }

function setupT06E(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  frame6(camera)
  lightRig(scene, [0.3, 0.5, -0.3])
  room(scene, {
    floor: mat('#ffffff', { map: tileTex('#EEF1F6', '#DCE2EC', 4, [9, 7]), roughness: 0.85 }),
    back: mat('#F5F1EA', { roughness: 0.95 }),
    side: mat('#EFEAE2', { roughness: 0.95 }),
  })
  /* a blue band and a service window frame on the back wall behind the clerk */
  scene.add(box(9, 0.32, 0.04, mat(C.brand, { roughness: 0.6 }), [0, 2.25, -2.28]))
  /* the counter: wood top, blue front panel */
  const wood = mat(C.wood, { roughness: 0.6 })
  scene.add(box(1.9, 0.07, 0.72, wood, [-0.3, 0.99, 0.02], 0.02))
  scene.add(box(1.8, 0.95, 0.56, mat(C.brandDark, { roughness: 0.55 }), [-0.3, 0.48, 0.04], 0.04))
  scene.add(box(1.8, 0.06, 0.02, mat(C.gold), [-0.3, 0.78, 0.33]))
  /* the token machine: a pedestal with a little screen and a paper slot */
  const machine = new THREE.Group()
  machine.position.set(...P6.machine)
  machine.add(box(0.5, 1.15, 0.42, mat('#FFFFFF', { roughness: 0.4 }), [0, 0.58, 0], 0.05))
  machine.add(box(0.4, 0.06, 0.38, mat(C.brand), [0, 1.18, 0], 0.02))
  const screenM = glowMat('#7FA6FF', '#14224A')
  machine.add(box(0.3, 0.2, 0.02, screenM, [0, 0.92, 0.215]))
  machine.add(box(0.22, 0.03, 0.03, mat('#1F2E63'), [0, 0.68, 0.215]))
  scene.add(machine)

  /* papers */
  const form = sheet(0.34, 0.46, formTex())
  const slip = sheet(0.2, 0.3, slipTex())
  const reply = sheet(0.34, 0.46, replyTex())
  scene.add(form, slip, reply)
  /* the reply's ink lines, drawn while the clerk writes (children of the reply sheet) */
  const ink: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.25 - (i % 2) * 0.06, 0.02), new THREE.MeshBasicMaterial({ color: C.brandDark }))
    l.geometry.translate((0.25 - (i % 2) * 0.06) / 2, 0, 0)
    l.position.set(-0.125, 0.13 - i * 0.064, 0.008)
    reply.add(l)
    ink.push(l)
  }
  const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ color: C.green }))
  tick.position.set(0.1, -0.18, 0.008)
  reply.add(tick)
  const pen = box(0.02, 0.2, 0.02, mat(C.navy), [0, 0, 0])
  scene.add(pen)

  /* people: the clerk (her own look: bun, glasses, blue blouse, lanyard), the visitor (bearded, checked shirt) */
  const clerkCfg = who(CAST_PRESETS.riya, { hair: { style: 'bun' }, outfit: { topColor: '#4B6BE0' }, accessories: { glasses: 'rect', earrings: true } })
  /* the visitor: Meera (Character Lab), long brown waves, a teal kurta, gold hoops; nobody else on the slide shares it */
  const visitorCfg = who(CAST_PRESETS.meera, { outfit: { top: 'kurta', topColor: '#1E9E8F', bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#5A3A2A' }, accessories: { earrings: true, necklace: true, watch: true } })
  const clerk = rigSprite({
    config: clerkCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{LANYARD}</> }),
    loop: L6,
    frames: 70,
    height: 1.68,
    onReady: redraw,
    timeline: (c) => ({
      seed: 61,
      idle: CAST_IDLE,
      ...faceAt(c, [[0, 'listening'], [T6.slip[1] - 0.3, 'thinking'], [T6.back[0], 'happy'], [T6.next[0], 'listening']], L6),
    }),
    pose: (p, c) => {
      /* receives the form: the screen-right arm reaches to the desk */
      const take = win(c, T6.give[1] - 0.3, T6.give[1] + 0.3, 0.25)
      to(p, 'shoulderR', 40, take)
      to(p, 'elbowR', 50, take)
      to(p, 'headTurn', 0.35, win(c, 0.2, T6.give[1] + 0.3))
      to(p, 'lookX', 0.6, win(c, 0.2, T6.give[1] + 0.3))
      /* glances at the token slip arriving */
      to(p, 'lookX', -0.9, win(c, T6.slip[1] - 0.4, T6.slip[1] + 0.1))
      to(p, 'headTurn', -0.3, win(c, T6.slip[1] - 0.4, T6.slip[1] + 0.1))
      /* writes: head down over the sheet, the screen-left (writing) arm working */
      const wr = win(c, T6.write[0], T6.write[1], 0.25)
      to(p, 'headNod', 0.35, wr)
      to(p, 'lookY', 0.8, wr)
      to(p, 'shoulderL', 30 + 4 * Math.sin(c * 9), wr)
      to(p, 'elbowL', 70 + 8 * Math.sin(c * 9 + 1), wr)
      /* hands the reply across */
      const hand = win(c, T6.back[0], T6.back[1] - 0.3, 0.3)
      to(p, 'shoulderR', 62, hand)
      to(p, 'elbowR', 24, hand)
      to(p, 'headTurn', 0.4, hand)
      to(p, 'lookX', 0.7, hand)
    },
  })
  clerk.object.position.set(...P6.clerk)
  const visitor = rigSprite({
    config: visitorCfg,
    loop: L6,
    frames: 70,
    height: 1.68,
    onReady: redraw,
    timeline: (c) => ({
      seed: 64,
      idle: CAST_IDLE,
      ...faceAt(c, [[0, 'neutral'], [T6.give[1], 'listening'], [T6.write[0] + 0.6, 'thinking'], [T6.back[1] - 0.3, 'happy'], [T6.next[1] - 0.2, 'neutral']], L6),
    }),
    pose: (p, c) => {
      /* the body follows the spring: it lags (leans back) as the step starts and tips forward as it stops; each
         step lifts the body on the stepping foot */
      const acc = springAcc(c, 0, STEP6, L6, 7.5, 0.5)
      const vel = springVel(c, 0, STEP6, L6, 7.5, 0.5)
      p.lean += Math.max(-5, Math.min(5, acc * 0.9))
      p.bodyY += -Math.min(10, Math.abs(vel) * 22)
      p.stance = lerp(p.stance, vel < 0 ? -0.6 : 0.6, Math.min(1, Math.abs(vel) * 3))
      /* faces the clerk, screen-left */
      to(p, 'headTurn', -0.45, 1)
      to(p, 'lookX', -0.7, 1)
      /* holds the form out, then hands it over (screen-left arm) */
      const hold = 1 - seg(c, T6.give[0], T6.give[1])
      const give = win(c, T6.give[0], T6.give[1], 0.3)
      to(p, 'shoulderL', 26, hold + seg(c, T6.next[0], T6.next[1]))
      to(p, 'elbowL', 70, hold + seg(c, T6.next[0], T6.next[1]))
      to(p, 'shoulderL', 64, give)
      to(p, 'elbowL', 18, give)
      /* receives the reply */
      const rec = win(c, T6.back[1] - 0.45, T6.tuck[0] + 0.1, 0.3)
      to(p, 'shoulderL', 58, rec)
      to(p, 'elbowL', 26, rec)
      /* tucks it into the bag on the screen-right side */
      /* reads it, then pockets it (the same hand to the shirt pocket) */
      const tuck = win(c, T6.tuck[0], T6.tuck[1], 0.25)
      to(p, 'shoulderL', 18, tuck)
      to(p, 'elbowL', 112, tuck)
      to(p, 'lookY', 0.35, win(c, T6.back[1] - 0.2, T6.tuck[0] + 0.2))
      to(p, 'headNod', 0.15, win(c, T6.back[1] - 0.2, T6.tuck[0] + 0.2))
    },
  })
  visitor.object.position.set(...P6.visitor)
  scene.add(clerk.object, visitor.object)

  const clk = clock(HOLD6)
  const flat = new THREE.Euler(-1.05, 0, 0)
  const up = new THREE.Euler(-0.1, -0.35, 0)
  const q1 = new THREE.Quaternion()
  const q2 = new THREE.Quaternion()
  const orient = (o: THREE.Object3D, a: THREE.Euler, b: THREE.Euler, k: number) => {
    q1.setFromEuler(a)
    q2.setFromEuler(b)
    o.quaternion.slerpQuaternions(q1, q2, k)
  }
  const bagPos: THREE.Vector3Tuple = [P6.visitor[0] + 0.05, 1.32, P6.visitor[2] + 0.15]
  const handAt = (dx: number): THREE.Vector3Tuple => [P6.hand[0] + dx, P6.hand[1], P6.hand[2]]
  return (t, step) => {
    const lt = clk(t, step >= 1)
    const c = lt < 0 ? 0 : lt % L6
    const dx = visitorDx(c)
    visitor.object.position.set(P6.visitor[0] + dx, 0, P6.visitor[2])
    const hand = handAt(dx)
    /* the form: in the visitor's hand → across to the desk; a new one appears in the hand at the end */
    const g = seg(c, T6.give[0], T6.give[1])
    const fresh = seg(c, T6.next[0], T6.next[1])
    if (c < T6.next[0]) {
      form.position.set(...arc(handAt(visitorDx(Math.min(c, T6.give[0]))), P6.desk, g, 0.25))
      orient(form, up, flat, g)
      /* cleared from the desk with the slip once the reply is handed over */
      form.visible = c < T6.tuck[0] + 0.2
      form.scale.setScalar(1 - seg(c, T6.tuck[0] - 0.2, T6.tuck[0] + 0.2))
    } else {
      form.visible = true
      form.position.set(...hand)
      orient(form, up, up, 0)
      form.scale.setScalar(fresh)
    }
    /* the token slip: rises out of the machine's slot, glides to the desk beside the form */
    const s = seg(c, T6.slip[0] + 0.35, T6.slip[1])
    const rise = seg(c, T6.slip[0], T6.slip[0] + 0.35)
    slip.visible = c > T6.slip[0] && c < T6.tuck[0] + 0.2
    slip.scale.setScalar(1 - seg(c, T6.tuck[0] - 0.2, T6.tuck[0] + 0.2))
    const slotOut: THREE.Vector3Tuple = [P6.slot[0], P6.slot[1] + 0.1 * rise, P6.slot[2] + 0.02]
    slip.position.set(...arc(slotOut, P6.deskSlip, s, 0.45))
    orient(slip, new THREE.Euler(0, 0, 0), flat, s)
    /* the reply: a blank sheet on the desk, written line by line, then handed across and tucked into the bag */
    const b = seg(c, T6.back[0], T6.back[1])
    const tk = seg(c, T6.tuck[0], T6.tuck[1])
    reply.visible = c > T6.write[0] - 0.3 && c < T6.tuck[1]
    reply.scale.setScalar(seg(c, T6.write[0] - 0.3, T6.write[0]) * (1 - seg(c, T6.tuck[1] - 0.25, T6.tuck[1])))
    if (c < T6.back[0]) {
      reply.position.set(...P6.deskReply)
      orient(reply, flat, flat, 0)
    } else if (c < T6.tuck[0]) {
      reply.position.set(...arc(P6.deskReply, hand, b, 0.3))
      orient(reply, flat, up, b)
    } else {
      reply.position.set(...lerp3(hand, [bagPos[0] + dx, bagPos[1], bagPos[2]], tk))
      orient(reply, up, up, 0)
    }
    ink.forEach((l, i) => (l.scale.x = Math.max(0.001, seg(c, T6.write[0] + 0.2 + i * 0.32, T6.write[0] + 0.5 + i * 0.32))))
    tick.visible = c > T6.write[1] - 0.3
    /* the pen follows the line being written */
    const wr = win(c, T6.write[0], T6.write[1], 0.2)
    const line = Math.min(4, Math.max(0, Math.floor((c - T6.write[0] - 0.2) / 0.32)))
    const along = clamp01((c - T6.write[0] - 0.2 - line * 0.32) / 0.3)
    pen.visible = wr > 0.05
    pen.position.set(P6.deskReply[0] - 0.12 + along * 0.22, P6.deskReply[1] + 0.12 - line * 0.03, P6.deskReply[2] + 0.04 + line * 0.05)
    pen.rotation.set(0.5, 0, -0.5 + Math.sin(c * 30) * 0.08)
    /* the machine's screen pulses as it prints */
    screenM.emissiveIntensity = 0.5 + 0.9 * win(c, T6.slip[0] - 0.1, T6.slip[0] + 0.5)
    clerk.update(c, camera)
    visitor.update(c, camera)
  }
}

function setupT06C(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDF2FB')
  frame6(camera)
  lightRig(scene, [0.3, 0.5, -0.3])
  const leds = dataCentre(scene, { racksX: [-1.45, -0.6, 0.25, 2.45], z: -2.0 })
  /* the platform dais where the counter was */
  scene.add(box(1.9, 0.16, 0.9, mat('#C9D3E6', { roughness: 0.5 }), [-0.4, 0.08, -0.15], 0.04))
  /* THE HANDLER where the clerk stood: a royal blue block carrying the Lambda mark */
  const handlerM = glowMat(C.brand, C.brand, { roughness: 0.35 })
  const handler = new THREE.Group()
  handler.position.set(P6.clerk[0] + 0.12, 0.16, P6.clerk[2] + 0.35)
  handler.add(box(1.0, 1.1, 0.8, handlerM, [0, 0.55, 0], 0.08))
  const tile = markTile(lambdaUrl, 0.52, redraw)
  tile.position.set(0, 0.6, 0.42)
  handler.add(tile)
  /* its working ring round the mark */
  const work = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 48, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: C.white, emissive: new THREE.Color('#BFD3FF'), emissiveIntensity: 0.8 }))
  work.position.set(0, 0.6, 0.43)
  handler.add(work)
  scene.add(handler)
  /* the intake stand beside the handler (where the desk was): the event and the context land on it */
  scene.add(box(0.66, 0.05, 0.5, mat('#E6ECF7', { roughness: 0.4 }), [0.2, 0.92, 0.12], 0.02))
  scene.add(box(0.1, 0.76, 0.1, mat('#C9D3E6'), [0.2, 0.54, 0.12]))
  scene.add(box(0.4, 0.04, 0.4, mat('#C9D3E6'), [0.2, 0.18, 0.12], 0.01))
  /* THE CALLER where the visitor stood: a kiosk with the API Gateway mark */
  const caller = new THREE.Group()
  caller.position.set(...P6.visitor)
  const callerM = glowMat(C.green, '#FFFFFF', { roughness: 0.4 })
  caller.add(box(0.5, 1.0, 0.42, callerM, [0, 0.5, 0], 0.06))
  const gw = markTile(apigwUrl, 0.4, redraw)
  gw.position.set(0, 1.26, 0.05)
  caller.add(gw)
  caller.add(box(0.08, 0.1, 0.08, mat('#C9D3E6'), [0, 1.04, 0.05]))
  const okRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 40), new THREE.MeshStandardMaterial({ color: C.green, emissive: new THREE.Color(C.green), emissiveIntensity: 1, transparent: true, opacity: 0 }))
  okRing.position.set(0, 1.26, 0.1)
  caller.add(okRing)
  scene.add(caller)
  /* THE PLATFORM PILLAR where the token machine stood: it issues the context slip */
  const pillar = new THREE.Group()
  pillar.position.set(...P6.machine)
  const pillarM = glowMat('#7FA6FF', '#FFFFFF')
  pillar.add(box(0.5, 1.15, 0.42, pillarM, [0, 0.58, 0], 0.05))
  pillar.add(box(0.4, 0.06, 0.38, mat(C.brand), [0, 1.18, 0], 0.02))
  const pTile = markTile(lambdaUrl, 0.26, redraw)
  pTile.position.set(0, 0.88, 0.22)
  pillar.add(pTile)
  scene.add(pillar)

  /* documents */
  const event = sheet(0.32, 0.44, docTex(C.brand))
  const ctx = sheet(0.2, 0.3, ctxTex())
  const ret = sheet(0.32, 0.44, docTex(C.green))
  scene.add(event, ctx, ret)

  const clk = clock(HOLD6)
  const flat = new THREE.Euler(-1.05, 0, 0)
  const up = new THREE.Euler(-0.1, -0.35, 0)
  const q1 = new THREE.Quaternion()
  const q2 = new THREE.Quaternion()
  const orient = (o: THREE.Object3D, a: THREE.Euler, b: THREE.Euler, k: number) => {
    q1.setFromEuler(a)
    q2.setFromEuler(b)
    o.quaternion.slerpQuaternions(q1, q2, k)
  }
  const callerOut: THREE.Vector3Tuple = [P6.visitor[0] - 0.34, 1.15, P6.visitor[2] + 0.3]
  const inbox: THREE.Vector3Tuple = [0.08, 1.02, 0.18]
  /* the context slip lands beside the handler on the pillar's side (the pillar now stands at the left end) */
  const inboxSlip: THREE.Vector3Tuple = [-1.2, 0.2, 0.3]
  const outbox: THREE.Vector3Tuple = [0.12, 1.08, 0.28]
  const into: THREE.Vector3Tuple = [-0.5, 0.8, 0.34]
  return (t, step) => {
    const lt = clk(t, step >= 2)
    const c = lt < 0 ? 0 : lt % L6
    leds(t)
    /* the event: caller → the handler's intake, then drawn into the handler while it works */
    const g = seg(c, T6.give[0], T6.give[1])
    const pull = seg(c, T6.write[0] - 0.1, T6.write[0] + 0.4)
    const fresh = seg(c, T6.next[0], T6.next[1])
    if (c < T6.next[0]) {
      event.visible = pull < 1
      event.position.set(...(c < T6.write[0] - 0.1 ? arc(callerOut, inbox, g, 0.3) : lerp3(inbox, into, pull)))
      orient(event, up, flat, g)
      event.scale.setScalar(1 - pull)
    } else {
      event.visible = true
      event.position.set(...callerOut)
      orient(event, up, up, 0)
      event.scale.setScalar(fresh)
    }
    /* the context slip: out of the pillar → beside the event → into the handler with it */
    const s = seg(c, T6.slip[0] + 0.35, T6.slip[1])
    const rise = seg(c, T6.slip[0], T6.slip[0] + 0.35)
    ctx.visible = c > T6.slip[0] && pull < 1
    const slotOut: THREE.Vector3Tuple = [P6.slot[0], P6.slot[1] + 0.1 * rise, P6.slot[2] + 0.02]
    ctx.position.set(...(c < T6.write[0] - 0.1 ? arc(slotOut, inboxSlip, s, 0.45) : lerp3(inboxSlip, into, pull)))
    orient(ctx, new THREE.Euler(0, 0, 0), flat, s)
    ctx.scale.setScalar(1 - pull)
    /* the handler works: glow, the ring turns */
    const wk = win(c, T6.write[0], T6.write[1], 0.3)
    handlerM.emissiveIntensity = 0.15 + 0.55 * wk
    work.rotation.z = -c * 2.4
    ;(work.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 1.2 * wk
    /* the return value: out of the handler → back to the caller, which lights green and takes it in */
    const out = seg(c, T6.write[1] - 0.4, T6.write[1])
    const b = seg(c, T6.back[0], T6.back[1])
    const tk = seg(c, T6.tuck[0], T6.tuck[1])
    ret.visible = c > T6.write[1] - 0.4 && c < T6.tuck[1]
    if (c < T6.back[0]) {
      ret.position.set(...lerp3(into, outbox, out))
      orient(ret, flat, flat, 0)
      ret.scale.setScalar(out)
    } else if (c < T6.tuck[0]) {
      ret.position.set(...arc(outbox, callerOut, b, 0.35))
      orient(ret, flat, up, b)
      ret.scale.setScalar(1)
    } else {
      ret.position.set(...lerp3(callerOut, [P6.visitor[0], 1.0, P6.visitor[2] + 0.1], tk))
      ret.scale.setScalar(1 - tk)
    }
    const ok = win(c, T6.back[1] - 0.1, T6.tuck[1] + 0.3, 0.3)
    callerM.emissiveIntensity = 0.45 * ok
    ;(okRing.material as THREE.MeshStandardMaterial).opacity = ok
    okRing.scale.setScalar(1 + 0.15 * Math.sin(c * 8) * ok)
    pillarM.emissiveIntensity = 0.6 * win(c, T6.slip[0] - 0.1, T6.slip[0] + 0.5)
  }
}

/* ================================================================== S23 · the food stall's stove (TR 11) */

const L11 = 8
const HOLD11 = 2.7
/* the cart (and the platform on the concept card): centre x and width. Customers stand BESIDE its ends, not in front
   of it, so no one overlaps the cart, its poles or each other at any moment of the loop (correction 15) */
const CART = { x: 0, w: 1.62 }
const P11 = {
  cook: [-0.4, 0, -0.72] as THREE.Vector3Tuple,
  stove: [0.36, 0.98, -0.14] as THREE.Vector3Tuple,
  /* where each customer stands, and where they come from (outside the frame) */
  c1: [1.27, 0, 0.28] as THREE.Vector3Tuple,
  c1From: 2.9,
  c2: [-1.27, 0, 0.28] as THREE.Vector3Tuple,
  c2From: -2.9,
  plate1: [0.62, 1.0, 0.16] as THREE.Vector3Tuple,
  plate2: [-0.62, 1.0, 0.16] as THREE.Vector3Tuple,
}
const T11 = { arr1: [0, 0.7], order1: [0.75, 1.3], light: [1.35, 1.75], flame: [1.6, 2.5], heat: [1.8, 3.1], cook1: [3.1, 4.1], serve1: [4.1, 4.7], leave1: [4.95, 5.6], arr2: [4.85, 5.5], order2: [5.5, 5.8], cook2: [5.8, 6.35], serve2: [6.35, 6.85], leave2: [7.0, 7.6], off: [7.05, 7.45], cool: [7.05, 7.95] }
function frame11(camera: THREE.PerspectiveCamera) {
  camera.fov = 31
  camera.position.set(0, 2.12, 6.15)
  camera.lookAt(0, 1.06, -0.15)
}
/* how far a walker has come: 0 out of frame, 1 at the spot (slide + small step bob) */
const walkIn = (c: number, a: number, b: number) => seg(c, a, b)
const stepBob = (c: number, a: number, b: number) => (c > a && c < b ? Math.abs(Math.sin(((c - a) / (b - a)) * Math.PI * 3)) * 0.035 : 0)

function setupT11E(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF1FB')
  frame11(camera)
  lightRig(scene, [0.2, 0.6, -0.2])
  /* the street: paving, a shop wall behind with a shuttered front */
  room(scene, {
    floor: mat('#ffffff', { map: tileTex('#E4DED3', '#CFC6B6', 3, [8, 6]), roughness: 0.9 }),
    back: mat('#F2E9DC', { roughness: 0.95 }),
    side: mat('#EDE3D4', { roughness: 0.95 }),
  })
  scene.add(box(9, 0.18, 0.05, mat('#D9CBB5'), [0, 0.09, -2.27]))
  /* the cart: wooden counter on a blue body with wheels */
  const cart = new THREE.Group()
  cart.add(box(CART.w, 0.08, 0.9, mat(C.wood, { roughness: 0.6 }), [CART.x, 0.94, -0.1], 0.02))
  cart.add(box(CART.w - 0.1, 0.72, 0.78, mat(C.brand, { roughness: 0.55 }), [CART.x, 0.54, -0.1], 0.04))
  cart.add(box(CART.w - 0.09, 0.06, 0.02, mat(C.gold), [CART.x, 0.74, 0.3]))
  for (const x of [CART.x - CART.w * 0.32, CART.x + CART.w * 0.32]) {
    const wheel = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 24), mat('#2A3558', { roughness: 0.6 }), [x, 0.17, 0.32])
    wheel.rotation.x = Math.PI / 2
    cart.add(wheel)
  }
  /* the awning: two poles at the back corners (nothing in front for a hand or a plate to pass), a striped canopy high
     above the cook's cap */
  const pole = mat('#C9D3E6', { metalness: 0.4, roughness: 0.35 })
  for (const x of [CART.x - CART.w / 2 + 0.06, CART.x + CART.w / 2 - 0.06]) cart.add(box(0.05, 1.45, 0.05, pole, [x, 1.68, -0.5]))
  const stripes = canvasTex(256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#FFFFFF' : C.brand
      g.fillRect(i * 32, 0, 32, 64)
    }
  })
  const canopy = box(CART.w + 0.16, 0.08, 1.05, mat('#ffffff', { map: stripes, roughness: 0.7 }), [CART.x, 2.42, -0.12], 0.02)
  canopy.rotation.x = 0.12
  cart.add(canopy)
  const valance = canvasTex(256, 32, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#FFFFFF' : C.brand
      g.beginPath()
      g.moveTo(i * 32, 0)
      g.lineTo(i * 32 + 32, 0)
      g.lineTo(i * 32 + 32, 18)
      g.arc(i * 32 + 16, 18, 16, 0, Math.PI)
      g.fill()
    }
  })
  cart.add(mesh(new THREE.PlaneGeometry(CART.w + 0.16, 0.2), new THREE.MeshStandardMaterial({ map: valance, transparent: true, side: THREE.DoubleSide }), [CART.x, 2.28, 0.42]))
  scene.add(cart)
  /* the stove: burner box with a knob, the burner ring, the pan */
  const stove = new THREE.Group()
  stove.position.set(...P11.stove)
  stove.add(box(0.62, 0.1, 0.48, mat('#3A4466', { roughness: 0.5, metalness: 0.3 }), [0, 0.05, 0], 0.02))
  const knob = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 16), mat('#D8352F'), [0.22, 0.05, 0.25])
  knob.rotation.x = Math.PI / 2
  stove.add(knob)
  stove.add(mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 32), mat('#1B1F2E', { metalness: 0.6 }), [0, 0.11, 0]).rotateX(Math.PI / 2))
  /* the flame: a ring of small cones */
  const flame = new THREE.Group()
  flame.position.y = 0.1
  const flameM = new THREE.MeshStandardMaterial({ color: '#FFB547', emissive: new THREE.Color('#FF7A1A'), emissiveIntensity: 1.6, transparent: true, opacity: 0.92 })
  const flameB = new THREE.MeshStandardMaterial({ color: '#7FA6FF', emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 1.4, transparent: true, opacity: 0.9 })
  const cones: THREE.Mesh[] = []
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    /* flames lick up round the pan's rim, so they read from the front */
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.15, 8), i % 3 === 0 ? flameB : flameM)
    cone.geometry.translate(0, 0.075, 0)
    cone.position.set(Math.cos(a) * 0.205, 0, Math.sin(a) * 0.205)
    flame.add(cone)
    cones.push(cone)
  }
  stove.add(flame)
  const fire = new THREE.PointLight('#FF8A3D', 0, 2.2, 2)
  fire.position.set(0, 0.3, 0.1)
  stove.add(fire)
  /* the pan: it glows as it heats */
  const panM = new THREE.MeshStandardMaterial({ color: '#2E3448', metalness: 0.6, roughness: 0.35, emissive: new THREE.Color('#FF5A1F'), emissiveIntensity: 0 })
  /* the pan sits ON the burner ring (it used to float above it); the handle points back toward the cook's hand */
  const pan = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.05, 32), panM, [0, 0.155, 0])
  stove.add(pan)
  stove.add(box(0.24, 0.03, 0.05, mat('#1B1F2E'), [-0.31, 0.165, -0.04]))
  /* the food on the pan, and the steam over it */
  const foodM = mat('#E8A93C', { roughness: 0.6 })
  const food = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 28), foodM, [0, 0.188, 0])
  stove.add(food)
  const steamM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, roughness: 1, depthWrite: false })
  const puffs = [0, 1, 2].map((i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), steamM.clone())
    s.castShadow = false
    stove.add(s)
    return s
  })
  scene.add(stove)
  /* the plates (each customer's) */
  const plateFor = () => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.03, 28), mat('#FFFFFF', { roughness: 0.3 }), [0, 0, 0]))
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 28), foodM, [0, 0.022, 0]))
    scene.add(g)
    return g
  }
  const plate1 = plateFor()
  const plate2 = plateFor()

  /* people: the cook (cap, apron, stubble), two customers each their own look */
  const cookCfg = who(CAST_PRESETS.arjun, { outfit: { topColor: '#FFFFFF', bottomColor: '#2E3A55' }, accessories: { beard: 'stubble' } })
  const c1Cfg = who(CAST_PRESETS.ananya, { hair: { style: 'ponytail' }, outfit: { topColor: '#FC963C', bottom: 'jeans', bottomColor: '#2C3C81' }, accessories: { earrings: true } })
  const c2Cfg = who(CAST_PRESETS.dev, { outfit: { top: 'polo', topColor: '#5B8CFF', bottomColor: '#3E3D45' } })
  const cook = rigSprite({
    config: cookCfg,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{CHEF_CAP}</>, top: <>{k.top}{CHEF_APRON}</> }),
    loop: L11,
    frames: 80,
    height: 1.72,
    onReady: redraw,
    timeline: (c) => ({ seed: 111, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T11.order1[0], 'listening'], [T11.light[0], 'thinking'], [T11.serve1[0], 'happy'], [T11.order2[0], 'happy'], [T11.leave2[1], 'neutral']], L11) }),
    pose: (p, c) => {
      /* looks at whoever is ordering */
      to(p, 'headTurn', 0.5, win(c, T11.order1[0] - 0.2, T11.light[0]))
      to(p, 'lookX', 0.8, win(c, T11.order1[0] - 0.2, T11.light[0]))
      to(p, 'headTurn', -0.45, win(c, T11.order2[0] - 0.3, T11.cook2[0]))
      to(p, 'lookX', -0.8, win(c, T11.order2[0] - 0.3, T11.cook2[0]))
      /* lights the stove, works the pan: the screen-right arm to the stove */
      const work = Math.max(win(c, T11.light[0], T11.cook1[1], 0.25), win(c, T11.cook2[0] - 0.1, T11.cook2[1], 0.2))
      to(p, 'shoulderR', 38 + 4 * Math.sin(c * 7), work)
      to(p, 'elbowR', 44 + 10 * Math.sin(c * 7 + 0.6), work)
      to(p, 'lookX', 0.55, work)
      to(p, 'lookY', 0.55, work)
      to(p, 'headNod', 0.22, work)
      /* serves: the arm sweeps toward the customer's end */
      /* (a short sweep that stays inside the stall's back poles) */
      to(p, 'shoulderR', 46, win(c, T11.serve1[0], T11.serve1[1], 0.2))
      to(p, 'elbowR', 30, win(c, T11.serve1[0], T11.serve1[1], 0.2))
      to(p, 'shoulderL', 40, win(c, T11.serve2[0], T11.serve2[1], 0.2))
      to(p, 'elbowL', 34, win(c, T11.serve2[0], T11.serve2[1], 0.2))
    },
  })
  cook.object.position.set(...P11.cook)
  const cust1 = rigSprite({
    config: c1Cfg,
    loop: L11,
    frames: 80,
    height: 1.64,
    onReady: redraw,
    timeline: (c) => ({ seed: 112, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T11.light[0] + 0.2, 'worried'], [T11.cook1[0] + 0.4, 'bored'], [T11.serve1[0] + 0.1, 'happy'], [T11.leave1[1], 'neutral']], L11) }),
    pose: (p, c) => {
      to(p, 'headTurn', -0.45, 1)
      to(p, 'lookX', -0.7, 1)
      p.bodyY += -stepBob(c, T11.arr1[0], T11.arr1[1]) * 400 - stepBob(c, T11.leave1[0], T11.leave1[1]) * 400
      /* orders: points at the stall */
      to(p, 'shoulderL', 44, win(c, T11.order1[0], T11.order1[1], 0.15))
      to(p, 'elbowL', 22, win(c, T11.order1[0], T11.order1[1], 0.15))
      /* waits: shifts weight foot to foot, arms crossed-ish, glances at the cold pan */
      const wait = win(c, T11.light[0] + 0.2, T11.serve1[0], 0.3)
      p.stance = lerp(p.stance, Math.sin(c * 4.5) * 0.7, wait)
      to(p, 'shoulderL', 6, wait)
      to(p, 'elbowL', 98, wait)
      to(p, 'shoulderR', 6, wait)
      to(p, 'elbowR', 98, wait)
      to(p, 'lookY', 0.35, wait)
      /* takes the plate */
      to(p, 'shoulderL', 46, win(c, T11.serve1[1] - 0.2, T11.leave1[1], 0.2))
      to(p, 'elbowL', 52, win(c, T11.serve1[1] - 0.2, T11.leave1[1], 0.2))
    },
  })
  const cust2 = rigSprite({
    config: c2Cfg,
    loop: L11,
    frames: 80,
    height: 1.76,
    onReady: redraw,
    timeline: (c) => ({ seed: 113, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T11.order2[0], 'listening'], [T11.cook2[1] - 0.1, 'happy'], [T11.leave2[1], 'neutral']], L11) }),
    pose: (p, c) => {
      to(p, 'headTurn', 0.45, 1)
      to(p, 'lookX', 0.7, 1)
      p.bodyY += -stepBob(c, T11.arr2[0], T11.arr2[1]) * 400 - stepBob(c, T11.leave2[0], T11.leave2[1]) * 400
      to(p, 'shoulderR', 36, win(c, T11.order2[0], T11.order2[1], 0.12))
      to(p, 'elbowR', 22, win(c, T11.order2[0], T11.order2[1], 0.12))
      to(p, 'shoulderR', 46, win(c, T11.serve2[1] - 0.2, T11.leave2[1], 0.2))
      to(p, 'elbowR', 52, win(c, T11.serve2[1] - 0.2, T11.leave2[1], 0.2))
    },
  })
  scene.add(cook.object, cust1.object, cust2.object)

  const clk = clock(HOLD11)
  return (t, step) => {
    const lt = clk(t, step >= 1)
    const c = lt < 0 ? 0 : lt % L11
    /* the customers walk in from outside the frame and out again */
    const x1 = lerp(P11.c1From, P11.c1[0], walkIn(c, T11.arr1[0], T11.arr1[1])) + (P11.c1From - P11.c1[0]) * seg(c, T11.leave1[0], T11.leave1[1])
    cust1.object.position.set(x1, 0, P11.c1[2])
    const x2 = lerp(P11.c2From, P11.c2[0], walkIn(c, T11.arr2[0], T11.arr2[1])) + (P11.c2From - P11.c2[0]) * seg(c, T11.leave2[0], T11.leave2[1])
    cust2.object.position.set(c < T11.arr2[0] ? P11.c2From : x2, 0, P11.c2[2])
    /* the stove: knob turns, flame grows, the pan heats; off once the stall is empty */
    const on = seg(c, T11.flame[0], T11.flame[1]) * (1 - seg(c, T11.off[0], T11.off[1]))
    knob.rotation.z = -1.4 * (seg(c, T11.light[0], T11.light[1]) * (1 - seg(c, T11.off[0], T11.off[0] + 0.25)))
    flame.visible = on > 0.02
    cones.forEach((k, i) => {
      const f = 0.75 + 0.35 * Math.sin(t * 13 + i * 1.7) + 0.15 * Math.sin(t * 29 + i)
      k.scale.set(on, on * f, on)
    })
    fire.intensity = 1.8 * on * (0.85 + 0.15 * Math.sin(t * 17))
    const heat = seg(c, T11.heat[0], T11.heat[1]) * (1 - seg(c, T11.cool[0], T11.cool[1]))
    panM.emissiveIntensity = 0.85 * heat
    /* the food on the pan: first order cooks after the heat-up, the second at once */
    const f1 = win(c, T11.cook1[0] - 0.15, T11.serve1[0] + 0.05, 0.12)
    const f2 = win(c, T11.cook2[0] - 0.05, T11.serve2[0] + 0.05, 0.1)
    const fk = Math.max(f1, f2)
    food.visible = fk > 0.02
    food.scale.set(fk, 1, fk)
    foodM.color.set(c < T11.serve1[0] ? '#F0C060' : '#E8A93C').lerp(new THREE.Color('#D48A2A'), clamp01((c - T11.cook1[0]) / 1) * (c < T11.serve1[0] ? 1 : 0))
    puffs.forEach((s, i) => {
      const ph = (t * 0.9 + i / 3) % 1
      s.position.set(Math.sin(i * 2.1 + t) * 0.06, 0.24 + ph * 0.5, 0)
      s.scale.setScalar(0.6 + ph * 1.2)
      ;(s.material as THREE.MeshStandardMaterial).opacity = 0.55 * (1 - ph) * fk
    })
    /* the plates: slide from the stove along the counter to the customer, who carries it away */
    const sv1 = seg(c, T11.serve1[0], T11.serve1[1])
    const pStove: THREE.Vector3Tuple = [P11.stove[0], 1.0, P11.stove[2] + 0.3]
    plate1.visible = c > T11.serve1[0] && c < T11.leave1[1]
    plate1.position.set(...(c < T11.serve1[1] ? lerp3(pStove, P11.plate1, sv1) : lerp3(P11.plate1, [x1 - 0.3, 1.02, P11.c1[2] + 0.12], seg(c, T11.serve1[1], T11.serve1[1] + 0.3))))
    const sv2 = seg(c, T11.serve2[0], T11.serve2[1])
    plate2.visible = c > T11.serve2[0] && c < T11.leave2[1]
    plate2.position.set(...(c < T11.serve2[1] ? lerp3(pStove, P11.plate2, sv2) : lerp3(P11.plate2, [x2 + 0.3, 1.02, P11.c2[2] + 0.12], seg(c, T11.serve2[1], T11.serve2[1] + 0.3))))
    cook.update(c, camera)
    cust1.update(c, camera)
    cust2.update(c, camera)
  }
}

/** a request: a small glowing cube carrying an event document on its face */
function requestCube(): { g: THREE.Group; m: THREE.MeshStandardMaterial } {
  const g = new THREE.Group()
  const m = glowMat(C.brand, '#FFFFFF', { roughness: 0.35 })
  g.add(box(0.36, 0.36, 0.36, m, [0, 0, 0], 0.06))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.29), new THREE.MeshBasicMaterial({ map: docTex(C.brand), toneMapped: false }))
  face.position.z = 0.185
  g.add(face)
  return { g, m }
}

function setupT11C(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDF2FB')
  frame11(camera)
  lightRig(scene, [0.2, 0.6, -0.2])
  const leds = dataCentre(scene, { racksX: [-1.55, -0.7, 1.4, 2.25], z: -2.0 })
  /* the platform where the cart stood */
  scene.add(box(CART.w, 0.08, 0.9, mat('#E6ECF7', { roughness: 0.4 }), [CART.x, 0.94, -0.1], 0.02))
  scene.add(box(CART.w - 0.1, 0.9, 0.78, mat(C.brandDark, { roughness: 0.55 }), [CART.x, 0.45, -0.1], 0.04))
  scene.add(box(CART.w - 0.09, 0.06, 0.02, mat(C.gold), [CART.x, 0.74, 0.3]))
  /* the Lambda service pillar where the cook stood: it builds the environment */
  const pillar = new THREE.Group()
  pillar.position.set(P11.cook[0], 0, P11.cook[2])
  const pillarM = glowMat('#7FA6FF', '#FFFFFF')
  pillar.add(box(0.62, 1.95, 0.5, pillarM, [0, 0.98, 0], 0.06))
  const pt = markTile(lambdaUrl, 0.42, redraw)
  pt.position.set(0, 1.62, 0.27)
  pillar.add(pt)
  scene.add(pillar)
  /* the build beam from the pillar to the environment */
  const beamM = new THREE.MeshStandardMaterial({ color: '#BFD3FF', emissive: new THREE.Color('#5B8CFF'), emissiveIntensity: 1.4, transparent: true, opacity: 0 })
  const beamGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 8)
  beamGeo.rotateZ(Math.PI / 2)
  const beam = new THREE.Mesh(beamGeo, beamM)
  scene.add(beam)
  /* THE ENVIRONMENT where the stove stood: three slabs (runtime, code, init) that drop in and glow when warm */
  const env = new THREE.Group()
  env.position.set(P11.stove[0], 0.98, P11.stove[2])
  const slabM = [glowMat(C.brand, '#C9D8FF'), glowMat(C.brand, '#9DB7FF'), glowMat(C.brand, '#5B8CFF')]
  const slabs = slabM.map((m, i) => {
    const s = box(0.62, 0.15, 0.5, m, [0, 0.08 + i * 0.17, 0], 0.03)
    env.add(s)
    return s
  })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 8, 48, Math.PI * 1.4), new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#9DB7FF'), emissiveIntensity: 1.2, transparent: true, opacity: 0 }))
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.28
  env.add(ring)
  scene.add(env)
  /* requests where the customers stood; the first waits with a spinner */
  const r1 = requestCube()
  const r2 = requestCube()
  scene.add(r1.g, r2.g)
  const spin = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 8, 40, Math.PI * 1.2), new THREE.MeshStandardMaterial({ color: C.orange, emissive: new THREE.Color(C.orange), emissiveIntensity: 1, transparent: true, opacity: 0 }))
  scene.add(spin)
  /* the responses: green packets from the environment to each request */
  const resp = [0, 1].map(() => {
    const m = mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshStandardMaterial({ color: C.green, emissive: new THREE.Color(C.green), emissiveIntensity: 0.9 }))
    scene.add(m)
    return m
  })

  const clk = clock(HOLD11)
  const H1 = 1.25
  return (t, step) => {
    const lt = clk(t, step >= 2)
    const c = lt < 0 ? 0 : lt % L11
    leds(t)
    /* request one comes in from the right, request two from the left; each leaves once answered */
    const x1 = lerp(P11.c1From, P11.c1[0], walkIn(c, T11.arr1[0], T11.arr1[1])) + (P11.c1From - P11.c1[0]) * seg(c, T11.leave1[0], T11.leave1[1])
    const x2 = c < T11.arr2[0] ? P11.c2From : lerp(P11.c2From, P11.c2[0], walkIn(c, T11.arr2[0], T11.arr2[1])) + (P11.c2From - P11.c2[0]) * seg(c, T11.leave2[0], T11.leave2[1])
    const bob = Math.sin(t * 2.4) * 0.03
    r1.g.position.set(x1, H1 + bob, P11.c1[2])
    r2.g.position.set(x2, H1 - bob, P11.c2[2])
    r1.g.rotation.y = -0.35
    r2.g.rotation.y = 0.35
    /* request one waits: the spinner turns round it while the environment is built */
    const wait = win(c, T11.order1[1], T11.serve1[0], 0.2)
    spin.position.set(x1, H1, P11.c1[2])
    spin.rotation.z = -t * 5
    ;(spin.material as THREE.MeshStandardMaterial).opacity = wait
    r1.m.emissiveIntensity = 0.25 + 0.3 * Math.max(win(c, T11.order1[0], T11.order1[1], 0.1), 0) + 0.6 * win(c, T11.serve1[1] - 0.1, T11.leave1[1], 0.2)
    r1.m.emissive.set(c > T11.serve1[1] - 0.1 ? C.green : C.brand)
    r2.m.emissiveIntensity = 0.25 + 0.6 * win(c, T11.serve2[1] - 0.1, T11.leave2[1], 0.2)
    r2.m.emissive.set(c > T11.serve2[1] - 0.1 ? C.green : C.brand)
    /* init: the slabs drop in one by one along the beam; warm: they glow; reclaimed: they lift away */
    const build = (i: number) => seg(c, T11.light[0] + i * 0.4, T11.light[0] + 0.45 + i * 0.4)
    const gone = seg(c, T11.cool[0], T11.cool[1] - 0.2)
    slabs.forEach((s, i) => {
      const k = build(i)
      s.visible = k > 0.01 && gone < 0.99
      s.position.y = 0.08 + i * 0.17 + (1 - k) * 0.7 + gone * (0.5 + i * 0.15)
      s.scale.setScalar(Math.max(0.01, k * (1 - gone)))
    })
    const warm = seg(c, T11.heat[0], T11.heat[1]) * (1 - seg(c, T11.cool[0], T11.cool[1]))
    slabM.forEach((m) => (m.emissiveIntensity = 0.55 * warm))
    const building = win(c, T11.light[0], T11.light[0] + 1.3, 0.15)
    const from = new THREE.Vector3(P11.cook[0] + 0.32, 1.35, P11.cook[2] + 0.2)
    const toP = new THREE.Vector3(P11.stove[0], 1.3, P11.stove[2])
    beam.position.copy(from).lerp(toP, 0.5)
    beam.scale.set(from.distanceTo(toP), 1, 1)
    beam.lookAt(toP)
    beam.rotateY(Math.PI / 2)
    beamM.opacity = 0.85 * building
    pillarM.emissiveIntensity = 0.7 * building
    /* invoke: the ring sweeps round the environment */
    const inv = Math.max(win(c, T11.cook1[0], T11.cook1[1], 0.15), win(c, T11.cook2[0], T11.cook2[1], 0.12))
    ring.rotation.z = -t * 4
    ;(ring.material as THREE.MeshStandardMaterial).opacity = inv
    /* the answers travel back */
    const a1 = seg(c, T11.serve1[0], T11.serve1[1])
    resp[0].visible = c > T11.serve1[0] && c < T11.serve1[1]
    resp[0].position.set(...arc([P11.stove[0], 1.4, P11.stove[2]], [x1, H1, P11.c1[2]], a1, 0.35))
    const a2 = seg(c, T11.serve2[0], T11.serve2[1])
    resp[1].visible = c > T11.serve2[0] && c < T11.serve2[1]
    resp[1].position.set(...arc([P11.stove[0], 1.4, P11.stove[2]], [x2, H1, P11.c2[2]], a2, 0.35))
  }
}

/* ================================================================== S31 · booked time in a gaming zone (TR 15) */

const L15 = 7
const HOLD15 = 5.3
const T15 = { play: [0, 4.6], cut: [4.6, 4.92], shock: [4.75, 6.0], rebook: [6.05, 6.75], on: [6.45, 6.95] }
const P15 = {
  cab: [-0.42, 0, -0.42] as THREE.Vector3Tuple,
  player: [0.86, 0, 0.26] as THREE.Vector3Tuple,
  ring: [-0.42, 2.18, -0.02] as THREE.Vector3Tuple,
}
function frame15(camera: THREE.PerspectiveCamera) {
  camera.fov = 31
  camera.position.set(0.25, 1.95, 5.1)
  camera.lookAt(0.25, 1.22, -0.3)
}

/** the game on the station's screen: a scrolling level, the hero jumping coins and gaps, a level-progress bar */
function gameScreen(): { tex: THREE.CanvasTexture; draw: (c: number, power: number) => void } {
  const cv = document.createElement('canvas')
  cv.width = 256 * 2
  cv.height = 192 * 2
  const g = cv.getContext('2d')!
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const draw = (c: number, power: number) => {
    /* drawn at 2x its logical 256 x 192 so the game stays sharp at 4K */
    g.setTransform(2, 0, 0, 2, 0, 0)
    g.fillStyle = '#05091A'
    g.fillRect(0, 0, 256, 192)
    if (power <= 0.001) {
      tex.needsUpdate = true
      return
    }
    g.save()
    /* a CRT switching off collapses to a line, a switching-on one opens from it */
    const sy = Math.max(0.02, Math.min(1, power * 1.4))
    g.translate(0, 96 * (1 - sy))
    g.scale(1, sy)
    const sky = g.createLinearGradient(0, 0, 0, 192)
    sky.addColorStop(0, '#2D63FB')
    sky.addColorStop(1, '#9DC1FF')
    g.fillStyle = sky
    g.fillRect(0, 0, 256, 192)
    const scroll = (c * 70) % 64
    /* far hills */
    g.fillStyle = '#7FA6FF'
    for (let i = -1; i < 6; i++) {
      g.beginPath()
      g.arc(i * 64 - scroll * 0.5 + 32, 150, 46, Math.PI, 0)
      g.fill()
    }
    /* ground with gaps */
    for (let i = -1; i < 6; i++) {
      const x = i * 64 - scroll
      g.fillStyle = i % 3 === 1 ? 'rgba(0,0,0,0)' : '#16A34A'
      if (i % 3 !== 1) g.fillRect(x, 150, 64, 42)
      g.fillStyle = '#0E7A36'
      if (i % 3 !== 1) g.fillRect(x, 150, 64, 6)
    }
    /* coins */
    g.fillStyle = '#F2C14E'
    for (let i = 0; i < 6; i++) {
      const x = i * 64 - scroll + 20
      g.beginPath()
      g.arc(x, 104 + Math.sin(c * 6 + i) * 4, 6, 0, Math.PI * 2)
      g.fill()
    }
    /* the hero: jumps on a beat */
    const jp = (c * 1.6) % 1
    const hy = 130 - Math.sin(jp * Math.PI) * 46
    g.fillStyle = '#FF8A3D'
    g.fillRect(70, hy, 20, 20)
    g.fillStyle = '#FFFFFF'
    g.fillRect(82, hy + 5, 5, 5)
    /* the level-progress bar along the top */
    g.fillStyle = 'rgba(255,255,255,0.35)'
    g.fillRect(16, 12, 224, 8)
    g.fillStyle = '#FFFFFF'
    g.fillRect(16, 12, 224 * Math.min(1, 0.15 + (c / 4.6) * 0.6), 8)
    g.restore()
    if (power < 1) {
      g.fillStyle = `rgba(255,255,255,${(1 - power) * 0.5})`
      g.fillRect(0, 95, 256, 2)
    }
    tex.needsUpdate = true
  }
  return { tex, draw }
}

/** an arcade station: body, angled screen, control deck, marquee and the booked-time ring on top */
function station(scene: THREE.Scene, at: THREE.Vector3Tuple, body: string, screenTex?: THREE.Texture, idleGlow = '#2D63FB') {
  const g = new THREE.Group()
  g.position.set(...at)
  g.add(box(0.95, 1.95, 0.75, mat(body, { roughness: 0.45 }), [0, 0.98, 0], 0.06))
  g.add(box(0.97, 0.08, 0.77, mat(C.orange, { roughness: 0.5 }), [0, 1.98, 0], 0.02))
  const marquee = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color(idleGlow), emissiveIntensity: 0.9 })
  g.add(box(0.8, 0.22, 0.05, marquee, [0, 1.8, 0.38], 0.02))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.58), screenTex ? new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: '#0B1430', emissive: new THREE.Color(idleGlow), emissiveIntensity: 0.35 }))
  scr.position.set(0, 1.38, 0.39)
  scr.rotation.x = -0.12
  g.add(scr)
  /* the control deck with a stick and buttons */
  const deck = box(0.95, 0.1, 0.42, mat('#1F2E63', { roughness: 0.5 }), [0, 1.0, 0.52], 0.03)
  deck.rotation.x = 0.18
  g.add(deck)
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), mat('#C9D3E6'), [-0.22, 1.12, 0.55]))
  g.add(mesh(new THREE.SphereGeometry(0.045, 12, 12), mat('#E5484D'), [-0.22, 1.2, 0.55]))
  for (const [x, col] of [[0.08, '#F2C14E'], [0.2, '#16A34A'], [0.32, '#2D63FB']] as const) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), mat(col), [x, 1.08, 0.56]))
  scene.add(g)
  return { group: g, screen: scr, marquee }
}

/*
 * THE PLAYER, SEATED AND FACING THE MACHINE (user, Session 10 review: "turn him to face the arcade machine and seat him
 * in front of it, in a realistic pose"). The Character Lab rig draws people from the front only (no back or profile
 * view), so the machine is a sit-down COCKTAIL arcade table: its screen lies in the table top between him and the
 * camera, and he sits on a gaming chair on the far side, looking down at it with both hands on the stick and buttons
 * at his edge. He faces the machine AND the room. The table top hides him from the waist down (seated); the chair back
 * frames his shoulders. The booked-time ring hangs over the table, where the concept card's timeout ring is.
 */
const P15E = {
  table: [-0.3, 0, 0.12] as THREE.Vector3Tuple,
  /* root lowered: seated, the hips at the chair's seat height */
  player: [-0.3, -0.1, -0.5] as THREE.Vector3Tuple,
  chair: [-0.3, 0, -0.78] as THREE.Vector3Tuple,
  ring: [-0.3, 2.0, -0.42] as THREE.Vector3Tuple,
}
function frame15E(camera: THREE.PerspectiveCamera) {
  /* framed so the whole table (to its foot), the player and the hanging ring sit inside the card */
  camera.fov = 32
  camera.position.set(-0.3, 2.25, 5.1)
  camera.lookAt(-0.3, 1.04, -0.3)
}

/** the sit-down cocktail arcade table: cabinet body, the game screen in the top, the player's stick and buttons */
function cocktailTable(scene: THREE.Scene, at: THREE.Vector3Tuple, screenTex: THREE.Texture) {
  const g = new THREE.Group()
  g.position.set(...at)
  g.add(box(1.24, 0.62, 0.84, mat(C.brand, { roughness: 0.45 }), [0, 0.31, 0], 0.05))
  g.add(box(1.25, 0.05, 0.02, mat(C.orange, { roughness: 0.5 }), [0, 0.5, 0.425]))
  g.add(box(0.5, 0.18, 0.02, mat('#1F2E63', { roughness: 0.5 }), [0, 0.26, 0.425], 0.02))
  /* the black glass top with the screen set into it (the game faces the room) */
  g.add(box(1.28, 0.05, 0.88, mat('#0B1022', { roughness: 0.25, metalness: 0.2 }), [0, 0.645, 0], 0.02))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.5), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }))
  scr.rotation.x = -Math.PI / 2
  scr.position.set(0, 0.672, 0.07)
  g.add(scr)
  /* the player's control edge: a ledge with the stick and three buttons */
  g.add(box(1.0, 0.06, 0.16, mat('#1F2E63', { roughness: 0.5 }), [0, 0.7, -0.33], 0.02))
  g.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), mat('#C9D3E6'), [-0.2, 0.78, -0.33]))
  const knob = mesh(new THREE.SphereGeometry(0.04, 14, 14), mat('#E5484D'), [-0.2, 0.85, -0.33])
  g.add(knob)
  const buttons = ([[0.08, '#F2C14E'], [0.2, '#16A34A'], [0.32, '#2D63FB']] as const).map(([x, col]) => {
    const b = mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.03, 16), mat(col, { emissive: new THREE.Color(col), emissiveIntensity: 0 }), [x, 0.74, -0.33])
    g.add(b)
    return b
  })
  scene.add(g)
  return { group: g, screen: scr, knob, buttons }
}

/** a gaming chair: the seat (under the table edge) and a tall back with orange side bolsters */
function gamingChair(scene: THREE.Scene, at: THREE.Vector3Tuple) {
  const g = new THREE.Group()
  g.position.set(...at)
  const navy = mat('#1F2E63', { roughness: 0.6 })
  g.add(box(0.58, 0.1, 0.52, navy, [0, 0.44, 0.18], 0.04))
  g.add(box(0.06, 0.44, 0.06, mat('#8E9BB5', { metalness: 0.5, roughness: 0.3 }), [0, 0.22, 0.18]))
  g.add(box(0.64, 0.92, 0.12, navy, [0, 0.98, -0.02], 0.06))
  for (const x of [-0.28, 0.28]) g.add(box(0.08, 0.86, 0.14, mat(C.orange, { roughness: 0.55 }), [x, 0.98, 0], 0.035))
  scene.add(g)
  return g
}

function setupT15E(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#1A2350')
  frame15E(camera)
  lightRig(scene, [0.2, 0.8, -0.3])
  /* the gaming zone: a dark carpet with a pattern, deep blue walls with neon strips */
  const carpet = canvasTex(256, 256, (g) => {
    g.fillStyle = '#2A3466'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 18; i++) {
      g.fillStyle = ['#3B4A8A', '#5B3D8A', '#2D63FB'][i % 3]
      g.beginPath()
      g.arc((i * 71) % 256, (i * 43) % 256, 6 + (i % 4) * 3, 0, Math.PI * 2)
      g.fill()
    }
  }, [6, 5])
  room(scene, { floor: mat('#ffffff', { map: carpet, roughness: 0.95 }), back: mat('#26306A', { roughness: 0.9 }), side: mat('#222B5E', { roughness: 0.9 }) })
  const neonA = new THREE.MeshStandardMaterial({ color: '#BFD3FF', emissive: new THREE.Color('#5B8CFF'), emissiveIntensity: 1.6 })
  const neonB = new THREE.MeshStandardMaterial({ color: '#FFD2B0', emissive: new THREE.Color('#FF8A3D'), emissiveIntensity: 1.4 })
  scene.add(box(9, 0.05, 0.03, neonA, [0, 2.7, -2.28]), box(9, 0.04, 0.03, neonB, [0, 0.5, -2.28]))
  /* upright stations along the back, as a gaming zone has, well clear of the player */
  station(scene, [1.18, 0, -1.75], '#3B4A8A', undefined, '#9B6BFF')
  station(scene, [-1.78, 0, -1.75], '#3B4A8A', undefined, '#16A34A')
  /* the player's machine: the cocktail table, its screen running the game */
  const game = gameScreen()
  const table = cocktailTable(scene, P15E.table, game.tex)
  gamingChair(scene, P15E.chair)
  /* the booked-time display hanging over the table: a disc on a rod from the ceiling, the ring running down */
  scene.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), mat('#8E9BB5', { metalness: 0.5 }), [P15E.ring[0], P15E.ring[1] + 0.92, P15E.ring[2] - 0.05]))
  const ringBack = new THREE.Mesh(new THREE.CircleGeometry(0.21, 48), new THREE.MeshStandardMaterial({ color: '#1F2E63', emissive: new THREE.Color('#1F2E63'), emissiveIntensity: 0.4 }))
  ringBack.position.set(...P15E.ring)
  scene.add(ringBack)
  const ringRim = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.018, 10, 48), mat('#C9D3E6', { metalness: 0.4, roughness: 0.3 }))
  ringRim.position.set(...P15E.ring)
  scene.add(ringRim)
  const dial = dialRing(0.17, 0.055, C.orange)
  dial.mesh.position.set(P15E.ring[0], P15E.ring[1], P15E.ring[2] + 0.01)
  scene.add(dial.mesh)
  /* the screen's light on the player's face and chest */
  const glow = new THREE.PointLight('#7FA6FF', 1.6, 2.4, 2)
  glow.position.set(P15E.table[0], 1.0, P15E.table[2] - 0.1)
  scene.add(glow)

  /* the player: Kabir with curly hair, an orange hoodie and a headset; focused on the game, shocked, then let down */
  const playerCfg = who(CAST_PRESETS.kabir, { hair: { style: 'curly' }, outfit: { top: 'hoodie', topColor: '#FF8A3D', bottom: 'jeans', bottomColor: '#2C3C81' }, build: { height: 1, shoulders: 1 } })
  const stop = T15.cut[0] + 0.05
  const player = rigSprite({
    config: playerCfg,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{HEADSET}</> }),
    loop: L15,
    frames: 84,
    height: 1.7,
    /* drawn 120 rig units wider on each side: the let-down shrug's outstretched hands never clip */
    wide: 120,
    onReady: redraw,
    timeline: (c) => ({
      seed: 151,
      idle: CAST_IDLE,
      ...faceAt(c, [[0, 'thinking'], [1.5, 'excited'], [2.6, 'thinking'], [3.7, 'excited'], [stop, 'shocked'], [T15.shock[1] - 0.35, 'sad'], [T15.on[0], 'excited']], L15),
      gesture: c > stop + 0.25 && c < T15.rebook[1] ? castClip('shrug', stop + 0.3) : undefined,
    }),
    pose: (p, c) => {
      /* plays: head down over the table screen, both hands at the control edge (the stick hand circling, the
         button hand tapping), a small lean into the game */
      const play = 1 - win(c, stop, T15.rebook[1] + 0.15, 0.22)
      to(p, 'headNod', 0.42, play)
      to(p, 'lookY', 0.95, play)
      to(p, 'lookX', 0, play)
      to(p, 'shoulderL', 20 + 3 * Math.sin(c * 9), play)
      to(p, 'elbowL', 84 + 6 * Math.cos(c * 9), play)
      to(p, 'shoulderR', 18, play)
      to(p, 'elbowR', 82 + 7 * Math.max(0, Math.sin(c * 15)), play)
      p.lean += 1.5 * Math.sin(c * 1.4) * play
      p.bow = lerp(p.bow, 0.12, play)
      /* the screen goes black: the head snaps up to it, then the let-down shrug (the clip lifts the arms) */
      const up = win(c, stop, T15.rebook[0] + 0.2, 0.18)
      to(p, 'headNod', -0.08, up)
      to(p, 'lookY', 0.55, up)
    },
  })
  player.object.position.set(...P15E.player)
  scene.add(player.object)

  const clk = clock(HOLD15)
  return (t, step) => {
    const lt = clk(t, step >= 1)
    const c = lt < 0 ? 0 : lt % L15
    /* booked time runs down while playing, re-booked at the end */
    const left = c < T15.cut[0] ? 1 - c / T15.cut[0] : seg(c, T15.rebook[0], T15.rebook[1])
    dial.set(left)
    const mt = dial.mesh.material as THREE.MeshStandardMaterial
    mt.color.set(left < 0.2 && c < T15.cut[0] + 0.3 ? C.red : C.orange)
    mt.emissive.copy(mt.color)
    /* the screen: on, switched off mid-level, on again for the next booking */
    const power = c < T15.cut[0] ? 1 : c < T15.on[0] ? 1 - seg(c, T15.cut[0], T15.cut[1]) : seg(c, T15.on[0], T15.on[1])
    game.draw(c < T15.cut[0] ? c : 0, power)
    glow.intensity = 1.6 * power
    /* the controls answer his hands while the game runs */
    const playing = c < T15.cut[0] ? 1 : 0
    table.knob.position.x = -0.2 + 0.025 * Math.sin(c * 9) * playing
    table.knob.position.z = -0.33 + 0.02 * Math.cos(c * 9) * playing
    table.buttons.forEach((b, i) => {
      const hit = Math.max(0, Math.sin(c * 15 - i * 2.1)) * playing
      b.position.y = 0.74 - 0.008 * hit
      ;((b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 * hit)
    })
    neonA.emissiveIntensity = 1.4 + 0.25 * Math.sin(t * 2)
    neonB.emissiveIntensity = 1.2 + 0.25 * Math.sin(t * 2 + 1.5)
    player.update(c, camera)
  }
}

function setupT15C(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDF2FB')
  frame15(camera)
  lightRig(scene, [0.2, 0.8, -0.3])
  const leds = dataCentre(scene, { racksX: [-1.85, 1.7, 2.55], z: -1.7 })
  /* THE FUNCTION where the station stood: a blue block with the Lambda mark and its work-progress bar */
  const fn = new THREE.Group()
  fn.position.set(...P15.cab)
  const fnM = glowMat(C.brand, C.brand, { roughness: 0.35 })
  fn.add(box(0.95, 1.95, 0.75, fnM, [0, 0.98, 0], 0.08))
  const tile = markTile(lambdaUrl, 0.46, redraw)
  tile.position.set(0, 1.42, 0.4)
  fn.add(tile)
  /* the progress bar on its face: a track and a fill that grows while the code runs */
  fn.add(box(0.76, 0.1, 0.04, mat('#1F2E63'), [0, 0.92, 0.39], 0.02))
  const fillM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#9DC1FF'), emissiveIntensity: 0.9 })
  const fillGeo = new THREE.BoxGeometry(0.72, 0.06, 0.03)
  fillGeo.translate(0.36, 0, 0)
  const fill = new THREE.Mesh(fillGeo, fillM)
  fill.position.set(-0.36, 0.92, 0.415)
  fn.add(fill)
  /* the stop plate: a red octagon that drops over the mark when the timeout arrives */
  const stopM = new THREE.MeshStandardMaterial({ color: C.red, emissive: new THREE.Color(C.red), emissiveIntensity: 0.5, transparent: true, opacity: 0 })
  const stop = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), stopM)
  stop.rotation.z = Math.PI / 8
  stop.position.set(0, 1.42, 0.45)
  fn.add(stop)
  const barM = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 })
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.08), barM)
  bar.position.set(0, 1.42, 0.46)
  fn.add(bar)
  scene.add(fn)
  /* the timeout ring where the booked-time ring was */
  const ringBack = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.3 }))
  ringBack.position.set(...P15.ring)
  scene.add(ringBack)
  const dial = dialRing(0.16, 0.05, C.orange)
  dial.mesh.position.set(P15.ring[0], P15.ring[1], P15.ring[2] + 0.01)
  scene.add(dial.mesh)
  /* THE CALLER where the player stood: a kiosk with the API Gateway mark; it gets the error back */
  const caller = new THREE.Group()
  caller.position.set(...P15.player)
  const callerM = glowMat(C.red, '#FFFFFF', { roughness: 0.4 })
  caller.add(box(0.5, 1.0, 0.42, callerM, [0, 0.5, 0], 0.06))
  const gw = markTile(apigwUrl, 0.4, redraw)
  gw.position.set(0, 1.26, 0.05)
  caller.add(gw)
  caller.add(box(0.08, 0.1, 0.08, mat('#C9D3E6'), [0, 1.04, 0.05]))
  scene.add(caller)
  /* the packets: the event that starts the run (at the loop's end, for the next run) and the error back */
  const event = mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshStandardMaterial({ color: C.brand, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.9 }))
  const err = mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshStandardMaterial({ color: C.red, emissive: new THREE.Color(C.red), emissiveIntensity: 0.9 }))
  scene.add(event, err)

  const clk = clock(HOLD15)
  const fnIn: THREE.Vector3Tuple = [P15.cab[0] + 0.3, 1.2, P15.cab[2] + 0.42]
  const callerTop: THREE.Vector3Tuple = [P15.player[0] - 0.05, 1.3, P15.player[2] + 0.1]
  return (t, step) => {
    const lt = clk(t, step >= 2)
    const c = lt < 0 ? 0 : lt % L15
    leds(t)
    const left = c < T15.cut[0] ? 1 - c / T15.cut[0] : seg(c, T15.rebook[0], T15.rebook[1])
    dial.set(left)
    const mt = dial.mesh.material as THREE.MeshStandardMaterial
    mt.color.set(left < 0.2 && c < T15.cut[0] + 0.3 ? C.red : C.orange)
    mt.emissive.copy(mt.color)
    /* the run: progress grows, but only part way before the timeout cuts it */
    const running = c < T15.cut[0]
    fill.scale.x = Math.max(0.001, running ? (c / T15.cut[0]) * 0.67 : 0.67 * (1 - seg(c, T15.rebook[0], T15.rebook[0] + 0.3)) + 0.001)
    fillM.emissive.set(running ? '#9DC1FF' : C.red)
    fnM.emissiveIntensity = running ? 0.25 + 0.15 * Math.sin(t * 6) : 0.05 * (1 - seg(c, T15.on[0], T15.on[1])) + 0.25 * seg(c, T15.on[0], T15.on[1])
    fnM.color.set(running || c > T15.on[1] ? C.brand : '#6E7FA8')
    const st = win(c, T15.cut[0], T15.rebook[0] + 0.2, 0.15)
    stopM.opacity = st
    barM.opacity = st
    stop.scale.setScalar(0.6 + 0.4 * seg(c, T15.cut[0], T15.cut[1]))
    /* the mark breathes while the code runs */
    tile.scale.setScalar(running ? 1 + 0.04 * Math.sin(t * 5) : 1)
    /* the error travels back to the caller, which flushes red */
    const e = seg(c, T15.cut[1], T15.cut[1] + 0.6)
    err.visible = c > T15.cut[1] && c < T15.cut[1] + 0.62
    err.position.set(...arc(fnIn, callerTop, e, 0.35))
    callerM.emissiveIntensity = 0.55 * win(c, T15.cut[1] + 0.55, T15.shock[1], 0.2)
    /* the next event goes in: the next run starts */
    const n = seg(c, T15.rebook[0], T15.on[1] - 0.05)
    event.visible = c > T15.rebook[0] && c < T15.on[1] - 0.05
    event.position.set(...arc(callerTop, fnIn, n, 0.35))
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
const Stage = ({ step, setup, holdT }: { step: number; setup: (k: StageKit) => Update; holdT: number }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={holdT} />
  </div>
)

const T06Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT06E} holdT={HOLD6} />
const T06Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT06C} holdT={HOLD6} />
const T11Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT11E} holdT={HOLD11} />
const T11Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT11C} holdT={HOLD11} />
const T15Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT15E} holdT={HOLD15} />
const T15Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT15C} holdT={HOLD15} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T06Everyday: T06Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T06Concept: T06Concept as (p: Record<string, unknown>) => ReactNode,
  H_T11Everyday: T11Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T11Concept: T11Concept as (p: Record<string, unknown>) => ReactNode,
  H_T15Everyday: T15Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T15Concept: T15Concept as (p: Record<string, unknown>) => ReactNode,
}
export const slides: Record<string, (p: Record<string, unknown>) => ReactNode> = {}
export const css = ''
