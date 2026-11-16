import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import bucketUrl from '../images/res-s3-bucket.svg'
import permUrl from '../images/res-iam-permissions.svg'

/**
 * BUILDER K · SESSION 13 (IAM Fundamentals), SLIDE 41, TR 21 ANALOGY (T21-AN).
 *
 * TR: "A failed UPI payment shows who paid, how much, to whom and the reason, such as insufficient balance: just as an
 * AWS denial message shows who made the request, the action, the resource and why it was denied."
 *
 * Built to the Session 9-12 review rules from the first draft (generate-slides standing corrections 13-16, cloud course
 * R10-R13; low-end pass of 2026-11-13): real-time 3D on the engine's `@/engine/three-stage`, perspective camera, a real
 * place; people are Character Lab characters through the engine's `castSprite` (role clothing by `dress`, frames at
 * the size they are drawn on this screen by `adaptive`); no text on either card; one 6 s loop on wall-clock time that
 * ends exactly where it starts (restart under 0.3 s, no rest beat); held frames (`?still`, thumbnails, reduced motion)
 * draw the key moment at HOLD: the failed card up with its four icons lit, nothing moving.
 *
 * The two cards share one ground plan, position for position:
 *
 *   place                 everyday (a kirana shop)                    concept (a cloud resource)
 *   back wall             shelves of goods                            server racks
 *   counter               the shop counter                            the resource plinth
 *   behind the counter    the shopkeeper (apron)                      the S3 bucket (official mark), locked
 *   counter, right end    the shop's QR standee (scanned)             the policy check gate (IAM permissions mark)
 *   right, in front       the customer with her phone                 the developer with his laptop (rule 58)
 *   the attempt           she reaches out and scans the QR            he sends a request: a packet flies to the gate
 *   the refusal           "payment failed" on the phone               the gate flashes orange, the packet bounces
 *   the card that rises   failed card: payer, amount, shop, warning   denial card: principal, action, resource, reason
 *                         lit one by one; she is worried, glances     lit one by one; he is worried, glances at the
 *                         at the shopkeeper, he gestures at the QR    gate; the card sinks back, the loop restarts
 *
 * The phone and the laptop hand are kept on the drawn hand: the arm is solved by two-link IK in the rig's own 400 x 600
 * frame (Arm.tsx: pivot 6 px inside the shoulder tip at y 205, upper arm 95, forearm 85), and the prop is placed at the
 * same hand point projected into the scene, at the frame time the sprite is showing (k / F x loop).
 */

const W = 470
const H = 390
const L = 6
const HOLD = 4.3
/* dev only: `?kt=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const HOLD_T = (() => {
  if (typeof window === 'undefined') return HOLD
  const v = Number(new URLSearchParams(window.location.search).get('kt'))
  return Number.isFinite(v) && v > 0 ? v : HOLD
})()

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#22304F',
  orange: '#FF8A3D',
  red: '#E5484D',
  green: '#22A06B',
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

/* ------------------------------------------------------------------ the shared timing (one 6 s loop, both cards) */

const T = {
  reachA: 0.45, // she lifts the phone toward the QR / he presses Enter
  reachB: 1.05,
  scanA: 1.1, // the scan / the packet in flight
  scanB: 1.95,
  backA: 2.0, // the phone comes back to her chest
  backB: 2.55,
  fail: 2.4, // the screen turns to failed
  riseA: 2.6, // the card rises
  riseB: 3.05,
  icon0: 3.15, // icons light one by one, 0.3 s apart
  glanceA: 3.85, // a glance at the shopkeeper / the gate
  glanceB: 4.65,
  sinkA: 4.95, // the card sinks back into the phone
  sinkB: 5.45,
  idle: 5.4, // the screen back to its idle state
}

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

/** an SVG asset rasterised at a size that stays sharp at 4K (an image tag draws an SVG as vectors at any size) */
function svgTex(url: string, px: number, redraw: () => void, pad = 0) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const g = c.getContext('2d')!
    g.clearRect(0, 0, px, px)
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}

type IconNode = [string, Record<string, string>][]
/* lucide 1.24 icon geometry (ISC licence, the engine's own icon set), on its 24-unit grid */
const ICON: Record<string, IconNode> = {
  user: [['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }], ['circle', { cx: '12', cy: '7', r: '4' }]],
  coins: [['path', { d: 'M13.744 17.736a6 6 0 1 1-7.48-7.48' }], ['path', { d: 'M15 6h1v4' }], ['path', { d: 'm6.134 14.768.866-.5 2 3.464' }], ['circle', { cx: '16', cy: '8', r: '6' }]],
  store: [
    ['path', { d: 'M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5' }],
    ['path', { d: 'M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244' }],
    ['path', { d: 'M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05' }],
  ],
  alert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4' }], ['path', { d: 'M12 17h.01' }]],
  trash: [['path', { d: 'M10 11v6' }], ['path', { d: 'M14 11v6' }], ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }], ['path', { d: 'M3 6h18' }], ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]],
  file: [
    ['path', { d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z' }],
    ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5' }],
    ['path', { d: 'M10 9H8' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }],
  ],
  shieldX: [
    ['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }],
    ['path', { d: 'm14.5 9.5-5 5' }],
    ['path', { d: 'm9.5 9.5 5 5' }],
  ],
}

function drawIcon(g: CanvasRenderingContext2D, node: IconNode, x: number, y: number, size: number, color: string, lw = 2) {
  g.save()
  g.translate(x, y)
  g.scale(size / 24, size / 24)
  g.strokeStyle = color
  g.lineWidth = lw
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const [kind, a] of node) {
    if (kind === 'path') g.stroke(new Path2D(a.d))
    else if (kind === 'circle') {
      g.beginPath()
      g.arc(+a.cx, +a.cy, +a.r, 0, Math.PI * 2)
      g.stroke()
    }
  }
  g.restore()
}

function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

/** the red "failed" disc with a white cross (a status mark, not a highlight) */
function failDisc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.fillStyle = 'rgba(229,72,77,0.14)'
  g.beginPath()
  g.arc(cx, cy, r * 1.38, 0, Math.PI * 2)
  g.fill()
  const grd = g.createLinearGradient(cx, cy - r, cx, cy + r)
  grd.addColorStop(0, '#F26468')
  grd.addColorStop(1, '#D63B40')
  g.fillStyle = grd
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#FFFFFF'
  g.lineWidth = r * 0.2
  g.lineCap = 'round'
  const k = r * 0.38
  g.beginPath()
  g.moveTo(cx - k, cy - k)
  g.lineTo(cx + k, cy + k)
  g.moveTo(cx + k, cy - k)
  g.lineTo(cx - k, cy + k)
  g.stroke()
}

/* the card: 720 x 500 px for 0.62 x 0.43 scene units; four icon slots along the bottom */
const CARD = { pw: 720, ph: 500, w: 0.8, h: 0.555, tile: 132, gap: 28, y: 318 }
const slotX = (i: number) => (CARD.pw - (4 * CARD.tile + 3 * CARD.gap)) / 2 + i * (CARD.tile + CARD.gap)

function cardBaseTex(icons: IconNode[]) {
  return canvasTex(CARD.pw, CARD.ph, (g) => {
    g.shadowColor = 'rgba(20,40,90,0.18)'
    g.shadowBlur = 18
    g.shadowOffsetY = 6
    g.fillStyle = '#FFFFFF'
    rrect(g, 14, 10, CARD.pw - 28, CARD.ph - 30, 44)
    g.fill()
    g.shadowColor = 'transparent'
    g.strokeStyle = '#DCE3F0'
    g.lineWidth = 3
    rrect(g, 14, 10, CARD.pw - 28, CARD.ph - 30, 44)
    g.stroke()
    /* a soft red band behind the disc */
    g.save()
    rrect(g, 14, 10, CARD.pw - 28, 270, 44)
    g.clip()
    const band = g.createLinearGradient(0, 10, 0, 280)
    band.addColorStop(0, '#FFF1F1')
    band.addColorStop(1, '#FFFFFF')
    g.fillStyle = band
    g.fillRect(14, 10, CARD.pw - 28, 270)
    g.restore()
    failDisc(g, CARD.pw / 2, 150, 82)
    /* the four slots, unlit: a grey tile and a grey icon */
    icons.forEach((n, i) => {
      const x = slotX(i)
      g.fillStyle = '#F2F5FA'
      rrect(g, x, CARD.y, CARD.tile, CARD.tile, 30)
      g.fill()
      drawIcon(g, n, x + 30, CARD.y + 30, CARD.tile - 60, '#A9B4C8', 2)
    })
  })
}

/** one lit icon tile: white, an orange ring (the highlight), the icon in navy; drawn at the tile size plus the ring */
function litTileTex(n: IconNode) {
  const P = 180
  return canvasTex(P, P, (g) => {
    g.fillStyle = C.orange
    rrect(g, 6, 6, P - 12, P - 12, 40)
    g.fill()
    g.fillStyle = '#FFFFFF'
    rrect(g, 16, 16, P - 32, P - 32, 32)
    g.fill()
    drawIcon(g, n, 46, 46, P - 92, C.navy, 2.1)
  })
}

/** phone screen states, 160 x 320 */
function phoneTex(kind: 'idle' | 'scan' | 'wait' | 'fail') {
  return canvasTex(160, 320, (g) => {
    if (kind === 'scan') {
      g.fillStyle = '#182238'
      g.fillRect(0, 0, 160, 320)
      g.strokeStyle = '#FFFFFF'
      g.lineWidth = 7
      g.lineCap = 'round'
      const b = 34
      for (const [x, y, dx, dy] of [[30, 100, 1, 1], [130, 100, -1, 1], [30, 220, 1, -1], [130, 220, -1, -1]] as const) {
        g.beginPath()
        g.moveTo(x, y + dy * b)
        g.lineTo(x, y)
        g.lineTo(x + dx * b, y)
        g.stroke()
      }
      g.strokeStyle = '#3DDC97'
      g.lineWidth = 5
      g.beginPath()
      g.moveTo(36, 160)
      g.lineTo(124, 160)
      g.stroke()
      return
    }
    const bg = g.createLinearGradient(0, 0, 0, 320)
    bg.addColorStop(0, kind === 'idle' ? '#3B74FF' : '#FFFFFF')
    bg.addColorStop(1, kind === 'idle' ? '#1F4FD8' : '#F2F5FA')
    g.fillStyle = bg
    g.fillRect(0, 0, 160, 320)
    if (kind === 'idle') {
      /* an app grid */
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 3; c++) {
          g.fillStyle = r === 1 && c === 1 ? '#FFFFFF' : 'rgba(255,255,255,0.55)'
          rrect(g, 22 + c * 44, 56 + r * 52, 30, 30, 9)
          g.fill()
        }
      return
    }
    if (kind === 'wait') {
      g.strokeStyle = '#DCE3F0'
      g.lineWidth = 10
      g.beginPath()
      g.arc(80, 150, 34, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = C.brand
      g.beginPath()
      g.arc(80, 150, 34, -Math.PI / 2, Math.PI * 0.35)
      g.stroke()
      return
    }
    failDisc(g, 80, 140, 36)
    for (let i = 0; i < 3; i++) {
      g.fillStyle = '#DCE3F0'
      rrect(g, 30, 214 + i * 22, i === 2 ? 64 : 100, 10, 5)
      g.fill()
    }
  })
}

/** laptop screen states, 320 x 200 */
function laptopTex(kind: 'code' | 'send' | 'fail') {
  return canvasTex(320, 200, (g) => {
    g.fillStyle = kind === 'fail' ? '#FFFFFF' : '#1B2440'
    g.fillRect(0, 0, 320, 200)
    if (kind === 'fail') {
      failDisc(g, 160, 92, 40)
      g.fillStyle = '#DCE3F0'
      rrect(g, 100, 160, 120, 10, 5)
      g.fill()
      return
    }
    /* code lines as coloured bars (no text) */
    const cols = ['#7AA2FF', '#F2C14E', '#3DDC97', '#FF8A3D', '#C9D3E6']
    for (let i = 0; i < 8; i++) {
      const ind = [0, 1, 2, 2, 2, 1, 0, 0][i] * 18
      g.fillStyle = cols[(i * 3) % cols.length]
      rrect(g, 18 + ind, 18 + i * 20, 60 + ((i * 47) % 110), 9, 4)
      g.fill()
      g.fillStyle = 'rgba(201,211,230,0.55)'
      rrect(g, 90 + ind + ((i * 47) % 110), 18 + i * 20, 40 + ((i * 31) % 60), 9, 4)
      g.fill()
    }
    if (kind === 'send') {
      g.fillStyle = C.brand
      rrect(g, 228, 158, 76, 28, 10)
      g.fill()
      g.strokeStyle = '#FFFFFF'
      g.lineWidth = 4
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(252, 172)
      g.lineTo(280, 172)
      g.moveTo(270, 164)
      g.lineTo(280, 172)
      g.lineTo(270, 180)
      g.stroke()
    }
  })
}

/** a QR code: three finder squares and seeded modules (a picture of a code, nothing to read) */
function qrTex() {
  return canvasTex(300, 300, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 300, 300)
    const N = 25
    const m = 260 / N
    const o = 20
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    g.fillStyle = '#141B2E'
    const finder = (cx: number, cy: number) => cx < 8 && cy < 8
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (finder(x, y) || finder(N - 1 - x, y) || finder(x, N - 1 - y)) continue
        if (rnd() < 0.48) g.fillRect(o + x * m, o + y * m, m + 0.5, m + 0.5)
      }
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      g.fillStyle = '#141B2E'
      g.fillRect(o + fx * m, o + fy * m, 7 * m, 7 * m)
      g.fillStyle = '#FFFFFF'
      g.fillRect(o + (fx + 1) * m, o + (fy + 1) * m, 5 * m, 5 * m)
      g.fillStyle = '#141B2E'
      g.fillRect(o + (fx + 2) * m, o + (fy + 2) * m, 3 * m, 3 * m)
    }
  })
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

/** back wall and left wall, floor */
function room(scene: THREE.Object3D, floor: THREE.Material, wall: string) {
  const wm = mat(wall, { roughness: 0.95, emissive: new THREE.Color(wall), emissiveIntensity: 0.32 })
  const f = mesh(new THREE.BoxGeometry(14, 0.1, 12), floor, [0, -0.05, 2])
  f.castShadow = false
  scene.add(f)
  const back = mesh(new THREE.BoxGeometry(9, 3.4, 0.12), wm, [0, 1.7, -1.35])
  back.castShadow = false
  scene.add(back)
  const left = mesh(new THREE.BoxGeometry(0.12, 3.4, 5), wm, [-2.6, 1.7, 1.1])
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
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: o.accessories ?? base.accessories,
  build: { ...base.build, ...o.build },
})

const SHOPKEEPER = who(CAST_PRESETS.rohan, {
  name: 'Shopkeeper',
  skinTone: 'wheatish',
  hair: { style: 'short', color: 'grey' },
  outfit: { top: 'shirt', topColor: '#EDE6D6', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' },
  accessories: { beard: 'short', watch: true },
  build: { height: 1, shoulders: 1.04 },
})
const CUSTOMER = who(CAST_PRESETS.meera, {
  name: 'Customer',
  gender: 'female',
  skinTone: 'medium',
  hair: { style: 'ponytail', color: 'black' },
  outfit: { top: 'kurta', topColor: '#14B8A6', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#5A3A2A' },
  accessories: { earrings: true, bindi: true },
  build: { height: 1, shoulders: 1 },
})
const DEVELOPER = who(CAST_PRESETS.kabir, {
  name: 'Developer',
  skinTone: 'fair',
  hair: { style: 'curly', color: 'brown' },
  outfit: { top: 'hoodie', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' },
  accessories: { glasses: 'rect' },
  build: { height: 1, shoulders: 1 },
})

/** the shopkeeper's apron (body frame 400 x 600), drawn in the rig's own frames so it moves with him */
const SHOP_APRON = (
  <g data-part="apron">
    <path d="M 168 232 H 232 V 268 C 248 274 252 300 250 330 L 248 430 H 152 L 150 330 C 148 300 152 274 168 268 Z" fill="#2F4BA8" stroke="#22377E" strokeWidth={3} />
    <path d="M 168 232 C 166 218 158 210 150 206 M 232 232 C 234 218 242 210 250 206" stroke="#22377E" strokeWidth={4} fill="none" />
    <rect x={176} y={322} width={48} height={34} rx={7} fill="#3B5BC4" stroke="#22377E" strokeWidth={2.5} />
    <path d="M 186 330 H 214" stroke={C.orange} strokeWidth={3} strokeLinecap="round" />
  </g>
)

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping) */
function faceAt(c: number, keys: [number, string][]): Pick<Timeline, 'expression' | 'prevExpression'> {
  let i = keys.length - 1
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= c) i = k
  const cur = keys[i]
  const curStart = cur[0] <= c ? cur[0] : cur[0] - L
  const prev = keys[(i - 1 + keys.length) % keys.length]
  const prevStart = prev[0] <= curStart ? prev[0] : prev[0] - L
  return { expression: castClip(cur[1], curStart, false), prevExpression: castClip(prev[1], prevStart, false) }
}
const timeline = (seed: number, keys: [number, string][]) => (t: number): Timeline => ({ seed, idle: { ...CAST_IDLE, saccades: false, sway: false }, life: 0, ...faceAt(t, keys) })

/* ---- the arm, solved in the rig's frame (Arm.tsx) ---- */

const SHOULDER_Y = 205
const UPPER = 95
const FORE = 85 + 14 // to the middle of the grip
type Pt = { x: number; y: number }

/** two-link IK for the LEFT arm (the viewer's left): shoulder and elbow angles that put the grip at `p` */
function solveL(sh: number, p: Pt): { s: number; e: number } {
  const px = 200 - (sh - 6)
  const dx = p.x - px
  const dy = p.y - SHOULDER_Y
  const D = Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.5)
  const ad = Math.atan2(-dx, dy)
  const beta = Math.acos(clamp01((UPPER * UPPER + D * D - FORE * FORE) / (2 * UPPER * D)))
  const gamma = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE))))
  return { s: (ad + beta) / DEG, e: 180 - gamma / DEG }
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
/** move a point toward the camera along its view ray, so a prop sits in front of the sprite and projects onto the hand */
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}

/* ------------------------------------------------------------------ the failed / denial card (shared by both cards) */

type Card = { group: THREE.Group; update: (t: number, from: THREE.Vector3, camera: THREE.Camera) => void }
const CARD_AT = new THREE.Vector3(0.32, 1.52, 0.55)

function makeCard(icons: IconNode[]): Card {
  const group = new THREE.Group()
  const base = new THREE.Mesh(new THREE.PlaneGeometry(CARD.w, CARD.h), flat(cardBaseTex(icons), { depthWrite: false }))
  base.renderOrder = 10
  group.add(base)
  const pxu = CARD.w / CARD.pw
  const lit = icons.map((n, i) => {
    const s = (CARD.tile + 2 * 22) * pxu * (180 / 180)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), flat(litTileTex(n), { depthWrite: false, opacity: 0 }))
    const cx = slotX(i) + CARD.tile / 2
    const cy = CARD.y + CARD.tile / 2
    m.position.set((cx - CARD.pw / 2) * pxu, (CARD.ph / 2 - cy) * pxu, 0.002)
    m.renderOrder = 11
    group.add(m)
    return m
  })
  group.visible = false
  const target = new THREE.Vector3()
  return {
    group,
    update(t, from, camera) {
      const up = seg(t, T.riseA, T.riseB)
      const down = seg(t, T.sinkA, T.sinkB)
      const k = up * (1 - down)
      group.visible = k > 0.002
      if (!group.visible) return
      /* from the phone / laptop up to its place, growing; a slow float while it is up */
      target.copy(CARD_AT)
      target.y += Math.sin(((t - T.riseB) / 2.2) * Math.PI * 2) * 0.008 * up * (1 - down)
      group.position.lerpVectors(from, target, k)
      group.scale.setScalar(mix(0.12, 1, k))
      group.quaternion.copy(camera.quaternion)
      ;(base.material as THREE.MeshBasicMaterial).opacity = clamp01(k * 1.6)
      lit.forEach((m, i) => {
        const on = seg(t, T.icon0 + i * 0.3, T.icon0 + i * 0.3 + 0.18) * (1 - down)
        ;(m.material as THREE.MeshBasicMaterial).opacity = on * clamp01(k * 1.6)
        const pop = Math.sin(clamp01((t - (T.icon0 + i * 0.3)) / 0.32) * Math.PI) * 0.14
        m.scale.setScalar(1 + pop)
      })
    },
  }
}

/* ------------------------------------------------------------------ EVERYDAY: the kirana shop */

const SHOP = {
  counter: { x0: -1.5, x1: 0.85, z: 0, d: 0.56, h: 0.78 },
  keeper: new THREE.Vector3(-0.72, 0, -0.5),
  qr: new THREE.Vector3(0.5, 0.78, 0.1),
  customer: new THREE.Vector3(1.3, 0, 0.62),
  hC: 1.62,
  hK: 1.68,
}
/* her grip: at the chest, and out at the QR (rig frame) */
const GRIP_CHEST: Pt = { x: 214, y: 272 }

function setupShop(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#F4EFE6')
  camera.fov = 40
  camera.position.set(0.42, 1.58, 3.55)
  camera.lookAt(0.36, 0.95, -0.1)
  camera.updateProjectionMatrix()
  lightRig(scene, [0.2, 0, 0])
  const St = new THREE.Group()
  room(St, mat('#ffffff', { map: floorTex('#E9DFCF', '#DDD0BC', 'rgba(120,95,60,0.18)'), roughness: 0.85 }), '#F7EBD6')

  /* the shelves of goods along the back wall */
  const wood = mat('#B98A5C', { roughness: 0.7 })
  const woodDark = mat('#8C6440', { roughness: 0.7 })
  const goods = ['#E5484D', '#F2C14E', '#2D63FB', '#22A06B', '#FF8A3D', '#7C5CE0', '#14B8A6', '#F6D365'].map((c) => mat(c, { roughness: 0.5 }))
  const glass = mat('#CFE3F7', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })
  const SH = { x0: -2.4, x1: 1.4, z: -1.12, h: 2.2 }
  St.add(box(SH.x1 - SH.x0, SH.h, 0.04, woodDark, [(SH.x0 + SH.x1) / 2, SH.h / 2, SH.z - 0.18]))
  for (const x of [SH.x0, -0.5, SH.x1]) St.add(box(0.05, SH.h, 0.36, wood, [x, SH.h / 2, SH.z]))
  const levels = [0.62, 1.08, 1.54, 2.0]
  for (const y of levels) St.add(box(SH.x1 - SH.x0, 0.04, 0.36, wood, [(SH.x0 + SH.x1) / 2, y, SH.z]))
  levels.slice(0, 3).forEach((y, li) => {
    let x = SH.x0 + 0.08
    let n = 0
    while (x < SH.x1 - 0.12) {
      if (Math.abs(x + 0.5) < 0.06) {
        x += 0.1
        continue
      }
      const kind = (n + li) % 3
      const c = goods[(n * 3 + li * 5) % goods.length]
      if (kind === 2) {
        /* a jar */
        const r = 0.07
        St.add(mesh(new THREE.CylinderGeometry(r, r, 0.2, 18), glass, [x + r, y + 0.12, SH.z + 0.02]))
        St.add(mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.04, 18), c, [x + r, y + 0.24, SH.z + 0.02]))
        x += 2 * r + 0.05
      } else {
        const w = 0.13 + ((n * 7) % 3) * 0.02
        const hh = 0.24 + ((n * 5 + li) % 3) * 0.04
        St.add(box(w, hh, 0.2, c, [x + w / 2, y + 0.02 + hh / 2, SH.z + 0.02], 0.012))
        x += w + 0.04
      }
      n++
    }
  })

  /* the counter: a wooden body with a light top, open at the back where the shopkeeper stands */
  const K = SHOP.counter
  const top = mat('#E8D9BF', { roughness: 0.55 })
  const cx = (K.x0 + K.x1) / 2
  St.add(box(K.x1 - K.x0, K.h - 0.05, K.d, wood, [cx, (K.h - 0.05) / 2, K.z]))
  St.add(box(K.x1 - K.x0 + 0.06, 0.05, K.d + 0.06, top, [cx, K.h - 0.025, K.z], 0.015))
  /* front panels */
  for (let i = 0; i < 4; i++) St.add(box((K.x1 - K.x0) / 4 - 0.08, K.h - 0.22, 0.02, woodDark, [K.x0 + (i + 0.5) * ((K.x1 - K.x0) / 4), (K.h - 0.05) / 2, K.z + K.d / 2 + 0.005]))
  /* the purchase on the counter: a paper grocery bag */
  St.add(box(0.2, 0.26, 0.13, mat('#C79A63', { roughness: 0.9 }), [0.16, K.h + 0.13, 0.08], 0.01))
  St.add(box(0.06, 0.16, 0.05, goods[0], [0.12, K.h + 0.3, 0.08], 0.01), box(0.07, 0.12, 0.05, goods[3], [0.21, K.h + 0.28, 0.07], 0.01))
  scene.add(bake(St))

  /* the QR standee: an acrylic stand on a small base, turned toward her */
  const qr = new THREE.Group()
  qr.position.copy(SHOP.qr)
  qr.rotation.y = 0.42
  qr.add(box(0.2, 0.025, 0.1, mat('#1F2E63'), [0, 0.0125, 0], 0.008))
  qr.add(box(0.2, 0.26, 0.012, mat('#FFFFFF', { roughness: 0.4 }), [0, 0.155, -0.01], 0.006))
  const qrFace = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: qrTex(), toneMapped: false }))
  qrFace.position.set(0, 0.165, -0.0035)
  qr.add(qrFace)
  /* the scan glow on the standee */
  const glowMat = new THREE.MeshBasicMaterial({ color: '#3DDC97', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), glowMat)
  glow.position.set(0, 0.165, -0.016)
  glow.renderOrder = 2
  qr.add(glow)
  scene.add(qr)

  /* the phone in her hand */
  const phone = new THREE.Group()
  phone.add(mesh(new RoundedBoxGeometry(0.08, 0.16, 0.012, 3, 0.01), mat('#1B1F2E', { roughness: 0.35, metalness: 0.3 })))
  const screens = { idle: phoneTex('idle'), scan: phoneTex('scan'), wait: phoneTex('wait'), fail: phoneTex('fail') }
  const screenMat = new THREE.MeshBasicMaterial({ map: screens.idle, toneMapped: false })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.142), screenMat)
  screen.position.z = 0.0065
  phone.add(screen)
  scene.add(phone)

  /* the scan beam from the phone to the QR */
  const beamMat = new THREE.MeshBasicMaterial({ color: '#3DDC97', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamMat)
  beam.renderOrder = 3
  scene.add(beam)

  const card = makeCard([ICON.user, ICON.coins, ICON.store, ICON.alert])
  scene.add(card.group)

  /* the people */
  const shC = buildSkin(CUSTOMER).shoulderHalf
  const gripOut: Pt = { x: -26, y: 232 }
  const grip = (c: number): Pt => {
    const out = hold(c, T.reachA, T.reachB, T.backA, T.backB)
    /* the hand dips a little as it swings out and back, so the elbow never folds up at the shoulder */
    const arc = Math.sin(out * Math.PI) * 34
    return { x: mix(GRIP_CHEST.x, gripOut.x, out), y: mix(GRIP_CHEST.y, gripOut.y, out) + arc }
  }
  const customer = castSprite({
    config: CUSTOMER,
    loop: L,
    frames: 72,
    height: SHOP.hC,
    wide: 60,
    shadow: 0.2,
    adaptive: true,
    onReady: kit.redraw,
    timeline: timeline(31, [
      [0, 'happy'],
      [T.reachA, 'neutral'],
      [T.fail - 0.05, 'surprised'],
      [T.riseA + 0.15, 'worried'],
      [T.glanceA, 'confused'],
      [T.glanceB, 'worried'],
      [T.sinkB - 0.1, 'neutral'],
      [5.75, 'happy'],
    ]),
    pose: (p: Pose, c: number) => {
      const a = solveL(shC, grip(c))
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = -10
      p.fL1 = 0.55
      p.fL2 = 0.65
      p.fL3 = 0.7
      p.fL4 = 0.72
      p.tL = 0.5
      p.shoulderR = 9
      p.elbowR = 12
      const out = hold(c, T.reachA, T.reachB, T.backA, T.backB)
      const glance = hold(c, T.glanceA, T.glanceA + 0.3, T.glanceB - 0.3, T.glanceB)
      /* looking down at the phone, out to the QR while scanning, across at the shopkeeper in the glance */
      p.headNod = mix(mix(0.32, 0.06, out), 0.02, glance)
      p.lookY = mix(mix(0.6, 0.1, out), -0.05, glance)
      p.headTurn = mix(mix(-0.12, -0.38, out), -0.46, glance)
      p.lookX = mix(mix(-0.25, -0.85, out), -0.95, glance)
      /* a small shrug of worry when it fails */
      const shrug = hold(c, T.fail, T.fail + 0.25, T.fail + 0.55, T.fail + 0.85)
      p.bodyY -= shrug * 4
      p.shoulderR += shrug * 6
    },
  })
  customer.object.position.copy(SHOP.customer)
  scene.add(customer.object)

  const keeper = castSprite({
    config: SHOPKEEPER,
    dress: (k: Skin) => ({ ...k, top: <>{k.top}{SHOP_APRON}</> }),
    loop: L,
    frames: 36,
    height: SHOP.hK,
    wide: 30,
    shadow: 0.18,
    adaptive: true,
    onReady: kit.redraw,
    timeline: timeline(32, [
      [0, 'happy'],
      [T.scanA, 'listening'],
      [T.fail, 'surprised'],
      [T.riseA + 0.3, 'thinking'],
      [T.glanceA + 0.1, 'listening'],
      [T.glanceB + 0.2, 'happy'],
    ]),
    pose: (p: Pose, c: number) => {
      /* he faces her and the QR; in her glance he turns an open palm toward the QR (try again) */
      p.headTurn = 0.34
      p.lookX = 0.75
      p.lookY = 0.05
      const g = hold(c, T.glanceA, T.glanceA + 0.35, T.glanceB - 0.2, T.glanceB + 0.2)
      p.shoulderR = mix(8, 42, g)
      p.elbowR = mix(8, 58, g)
      p.wristR = mix(0, -14, g)
      p.fR1 = mix(0.25, 0, g)
      p.fR2 = mix(0.3, 0, g)
      p.fR3 = mix(0.35, 0.05, g)
      p.fR4 = mix(0.4, 0.08, g)
      p.palmR = mix(0.3, 1, g)
      p.headTilt = g * 5
      p.shoulderL = 10
      p.elbowL = 14
    },
  })
  keeper.object.position.copy(SHOP.keeper)
  scene.add(keeper.object)

  const hand = new THREE.Vector3()
  const qrPoint = new THREE.Vector3()
  return (t: number) => {
    const c = ((t % L) + L) % L
    customer.update(c, camera)
    keeper.update(c, camera)
    /* the phone follows the hand of the frame on screen */
    const cq = (Math.floor((c / L) * 72) % 72) * (L / 72)
    rigToWorld(grip(cq), SHOP.hC, SHOP.customer, camera, hand)
    towardCamera(hand, camera, 0.07)
    phone.position.copy(hand)
    phone.quaternion.copy(camera.quaternion)
    const out = hold(cq, T.reachA, T.reachB, T.backA, T.backB)
    phone.rotateZ(mix(-0.12, 0.35, out))
    phone.rotateY(mix(0.15, 0.55, out))
    /* the screen: idle, the scanner while held out, a wait, then failed until the card has sunk back */
    const scr = c < T.reachA + 0.25 ? screens.idle : c < T.backA ? screens.scan : c < T.fail ? screens.wait : c < T.idle ? screens.fail : screens.idle
    if (screenMat.map !== scr) screenMat.map = scr
    /* the beam and the QR glow while scanning */
    const scan = hold(c, T.scanA, T.scanA + 0.15, T.scanB - 0.15, T.scanB)
    const pulse = 0.55 + 0.45 * Math.sin((c - T.scanA) * Math.PI * 2 * 2.2)
    qrPoint.set(SHOP.qr.x, SHOP.qr.y + 0.165, SHOP.qr.z)
    const mid = hand.clone().lerp(qrPoint, 0.5)
    const len = hand.distanceTo(qrPoint)
    beam.position.copy(mid)
    beam.quaternion.copy(camera.quaternion)
    const dir = qrPoint.clone().sub(hand)
    const ang = Math.atan2(dir.clone().applyQuaternion(camera.quaternion.clone().invert()).y, dir.clone().applyQuaternion(camera.quaternion.clone().invert()).x)
    beam.rotateZ(ang)
    beam.scale.set(len, 0.06, 1)
    beamMat.opacity = scan * 0.4 * pulse
    glowMat.opacity = scan * 0.55 * pulse
    card.update(c, phone.position, camera)
  }
}

/* ------------------------------------------------------------------ CONCEPT: the request refused at a resource */

const CLOUD = {
  plinth: { x0: -1.5, x1: 0.85, z: 0, d: 0.56, h: 0.78 },
  bucket: new THREE.Vector3(-0.72, 0, -0.5),
  gate: new THREE.Vector3(0.5, 0.78, 0.1),
  desk: new THREE.Vector3(0.84, 0, 0.66),
  dev: new THREE.Vector3(1.34, 0, 0.46),
  hD: 1.66,
}

function setupCloud(kit: StageKit): Update {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  camera.fov = 40
  camera.position.set(0.42, 1.58, 3.55)
  camera.lookAt(0.36, 0.95, -0.1)
  camera.updateProjectionMatrix()
  lightRig(scene, [0.2, 0, 0])
  const St = new THREE.Group()
  room(St, mat('#ffffff', { map: floorTex('#E6ECF6', '#DCE4F1', 'rgba(60,90,150,0.16)'), roughness: 0.4, metalness: 0.05 }), '#F1F5FC')

  /* server racks along the back wall */
  const rackM = mat('#1F2E63', { roughness: 0.45, metalness: 0.25 })
  const bladeM = mat('#2C3E7E', { roughness: 0.4, metalness: 0.3 })
  const racks = [-2.05, -1.35, 0.35, 1.05]
  for (const x of racks) {
    St.add(box(0.6, 2.0, 0.5, rackM, [x, 1.0, -1.02], 0.02))
    for (let i = 0; i < 9; i++) St.add(box(0.5, 0.14, 0.02, bladeM, [x, 0.3 + i * 0.19, -0.765]))
  }
  /* the plinth (the counter's place) */
  const K = CLOUD.plinth
  const cx = (K.x0 + K.x1) / 2
  const white = mat('#FFFFFF', { roughness: 0.35 })
  const blueTrim = mat(C.brand, { roughness: 0.4, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 })
  St.add(box(K.x1 - K.x0, K.h - 0.04, K.d, white, [cx, (K.h - 0.04) / 2, K.z], 0.02))
  St.add(box(K.x1 - K.x0 + 0.04, 0.04, K.d + 0.04, mat('#DCE6F7', { roughness: 0.3 }), [cx, K.h - 0.02, K.z], 0.012))
  St.add(box(K.x1 - K.x0 - 0.1, 0.03, 0.01, blueTrim, [cx, K.h - 0.12, K.z + K.d / 2 + 0.006]))
  /* the bucket's pedestal behind the plinth (the shopkeeper's place) */
  St.add(box(0.5, 0.92, 0.5, white, [CLOUD.bucket.x, 0.46, CLOUD.bucket.z], 0.03))
  /* the developer's standing desk (the phone's place) */
  const deskM = mat('#E8EDF6', { roughness: 0.4 })
  const legM = mat('#5E6B86', { metalness: 0.4, roughness: 0.4 })
  St.add(box(0.5, 0.035, 0.42, deskM, [CLOUD.desk.x, 0.76, CLOUD.desk.z], 0.01))
  St.add(box(0.05, 0.74, 0.05, legM, [CLOUD.desk.x, 0.37, CLOUD.desk.z - 0.05]))
  St.add(box(0.36, 0.03, 0.3, legM, [CLOUD.desk.x, 0.015, CLOUD.desk.z - 0.05]))
  scene.add(bake(St))

  /* rack lights: a slow walk of LEDs (inside the scene, drawn by WebGL) */
  const ledOn = new THREE.MeshBasicMaterial({ color: '#3DDC97', toneMapped: false })
  const ledOff = new THREE.MeshBasicMaterial({ color: '#2E4A8A', toneMapped: false })
  const leds: THREE.Mesh[] = []
  const ledGeo = new THREE.BoxGeometry(0.03, 0.03, 0.01)
  racks.forEach((x, ri) => {
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(ledGeo, ledOff)
      m.position.set(x + 0.19, 0.3 + i * 0.19, -0.75)
      m.userData.phase = (i * 0.37 + ri * 0.23) % 1
      scene.add(m)
      leds.push(m)
    }
  })

  /* the bucket: the official S3 bucket mark on a white tile, with a padlock in front */
  const tile = new THREE.Group()
  tile.position.set(CLOUD.bucket.x, 1.24, CLOUD.bucket.z)
  tile.add(mesh(new RoundedBoxGeometry(0.5, 0.5, 0.08, 4, 0.06), mat('#FFFFFF', { roughness: 0.3 })))
  const bFace = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.41), flat(svgTex(bucketUrl, 512, kit.redraw)))
  bFace.position.z = 0.041
  tile.add(bFace)
  scene.add(tile)
  const lock = new THREE.Group()
  const lockBody = mesh(new RoundedBoxGeometry(0.12, 0.1, 0.05, 3, 0.015), mat('#F2B233', { roughness: 0.35, metalness: 0.4 }))
  const shackle = mesh(new THREE.TorusGeometry(0.04, 0.011, 10, 24, Math.PI), mat('#AEB7C8', { roughness: 0.3, metalness: 0.8 }), [0, 0.05, 0])
  lock.add(lockBody, shackle)
  lock.position.set(CLOUD.bucket.x + 0.21, 1.02, CLOUD.bucket.z + 0.1)
  lock.scale.setScalar(1.2)
  scene.add(lock)

  /* the policy gate on the plinth (the QR's place): two posts, a scanning panel, the IAM permissions mark on top */
  const gate = new THREE.Group()
  gate.position.copy(CLOUD.gate)
  gate.rotation.y = 0.42
  const post = mat(C.brand, { roughness: 0.35, metalness: 0.2, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.2 })
  gate.add(box(0.03, 0.34, 0.04, post, [-0.12, 0.17, 0], 0.01), box(0.03, 0.34, 0.04, post, [0.12, 0.17, 0], 0.01), box(0.28, 0.025, 0.08, post, [0, 0.012, 0], 0.008))
  const panelMat = new THREE.MeshBasicMaterial({ color: '#7FA6FF', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.3), panelMat)
  panel.position.set(0, 0.18, 0)
  panel.renderOrder = 2
  gate.add(panel)
  const permTile = new THREE.Group()
  permTile.position.set(0, 0.18, 0.012)
  permTile.add(mesh(new RoundedBoxGeometry(0.15, 0.15, 0.02, 3, 0.025), mat('#FFFFFF', { roughness: 0.3 })))
  const pFace = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), flat(svgTex(permUrl, 384, kit.redraw)))
  pFace.position.z = 0.011
  permTile.add(pFace)
  gate.add(permTile)
  scene.add(gate)

  /* the laptop on the desk, its screen toward the developer and the camera */
  const laptop = new THREE.Group()
  laptop.position.set(CLOUD.desk.x - 0.02, 0.778, CLOUD.desk.z + 0.02)
  laptop.rotation.y = 0.62
  const shell = mat('#C9D0DC', { roughness: 0.35, metalness: 0.5 })
  laptop.add(box(0.34, 0.015, 0.23, shell, [0, 0.0075, 0], 0.005))
  laptop.add(box(0.3, 0.003, 0.1, mat('#2A2E3A'), [0, 0.016, 0.02]))
  const lid = new THREE.Group()
  lid.position.set(0, 0.015, -0.11)
  lid.rotation.x = -0.28
  lid.add(box(0.34, 0.22, 0.012, shell, [0, 0.11, 0], 0.005))
  const lapScreens = { code: laptopTex('code'), send: laptopTex('send'), fail: laptopTex('fail') }
  const lapMat = new THREE.MeshBasicMaterial({ map: lapScreens.code, toneMapped: false })
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.194), lapMat)
  lapScreen.position.set(0, 0.11, 0.0065)
  lid.add(lapScreen)
  laptop.add(lid)
  scene.add(laptop)

  /* the request: a glowing packet with a trail */
  const packetMat = new THREE.MeshStandardMaterial({ color: C.brand, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.35, roughness: 0.3 })
  const packet = mesh(new RoundedBoxGeometry(0.1, 0.1, 0.1, 3, 0.022), packetMat)
  scene.add(packet)
  const trailMat = new THREE.MeshBasicMaterial({ color: C.brand, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false })
  const trail = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), trailMat)
    scene.add(m)
    return m
  })

  const card = makeCard([ICON.user, ICON.trash, ICON.file, ICON.shieldX])
  scene.add(card.group)

  /* the developer, at the right of his desk, his left hand on the laptop */
  const shD = buildSkin(DEVELOPER).shoulderHalf
  const KEYS: Pt = { x: 30, y: 333 }
  const keys = (c: number): Pt => {
    /* typing: small taps; Enter pressed hard just before the request leaves */
    const typing = (1 - hold(c, 0.9, 1.0, 5.45, 5.55)) * Math.max(0, Math.sin(c * Math.PI * 2 * 5.5)) * 5
    const enter = hold(c, 0.75, 0.88, 0.92, 1.05) * 14
    return { x: KEYS.x, y: KEYS.y - enter - typing }
  }
  const dev = castSprite({
    config: DEVELOPER,
    loop: L,
    frames: 72,
    height: CLOUD.hD,
    wide: 40,
    shadow: 0.2,
    adaptive: true,
    onReady: kit.redraw,
    timeline: timeline(33, [
      [0, 'thinking'],
      [T.scanB - 0.1, 'surprised'],
      [T.riseA + 0.15, 'worried'],
      [T.glanceA, 'confused'],
      [T.glanceB, 'worried'],
      [T.sinkB - 0.1, 'thinking'],
    ]),
    pose: (p: Pose, c: number) => {
      const a = solveL(shD, keys(c))
      p.shoulderL = a.s
      p.elbowL = a.e
      p.wristL = 18
      p.shoulderR = 9
      p.elbowR = 14
      const glance = hold(c, T.glanceA, T.glanceA + 0.3, T.glanceB - 0.3, T.glanceB)
      const watch = hold(c, T.reachB, T.reachB + 0.15, T.scanB, T.scanB + 0.3)
      /* eyes on the screen; following the packet to the gate; across at the gate in the glance */
      p.headNod = mix(mix(0.28, 0.08, watch), 0.04, glance)
      p.lookY = mix(mix(0.55, 0.15, watch), 0.05, glance)
      p.headTurn = mix(mix(-0.32, -0.45, watch), -0.5, glance)
      p.lookX = mix(mix(-0.7, -0.9, watch), -0.95, glance)
      p.lean = -2
      const shrug = hold(c, T.fail, T.fail + 0.25, T.fail + 0.55, T.fail + 0.85)
      p.bodyY -= shrug * 4
      p.shoulderR += shrug * 6
    },
  })
  dev.object.position.copy(CLOUD.dev)
  scene.add(dev.object)

  const from = new THREE.Vector3()
  const gateP = new THREE.Vector3(CLOUD.gate.x, CLOUD.gate.y + 0.18, CLOUD.gate.z + 0.02)
  const tmp = new THREE.Vector3()
  return (t: number) => {
    const c = ((t % L) + L) % L
    dev.update(c, camera)
    /* the packet: leaves the laptop, arcs to the gate, stops, flashes, bounces back and fades */
    laptop.updateMatrixWorld()
    from.set(0, 0.12, -0.06).applyMatrix4(laptop.matrixWorld)
    const fly = seg(c, T.scanA, T.scanA + 0.6)
    const hit = c >= T.scanA + 0.6 && c < T.scanB + 0.35
    const back = seg(c, T.scanB - 0.1, T.scanB + 0.35)
    const show = c >= T.scanA && c < T.scanB + 0.35
    packet.visible = show
    if (show) {
      const p = tmp.lerpVectors(from, gateP, fly)
      p.y += Math.sin(fly * Math.PI) * 0.26
      if (back > 0) p.lerp(from, back * 0.25).setY(p.y - back * 0.12)
      packet.position.copy(p)
      packet.rotation.set(c * 2, c * 3, 0)
      const s = hit ? 1 - back * 0.7 : 1
      packet.scale.setScalar(s)
    }
    trail.forEach((m, i) => {
      const f = seg(c, T.scanA + 0.06 * (i + 1), T.scanA + 0.6 + 0.06 * (i + 1))
      m.visible = show && fly < 1 && f > 0
      if (m.visible) {
        m.position.lerpVectors(from, gateP, f)
        m.position.y += Math.sin(f * Math.PI) * 0.26
        m.scale.setScalar(1 - i * 0.25)
      }
    })
    /* the gate: blue while it reads the request, orange when it refuses it */
    const read = hold(c, T.scanA + 0.35, T.scanA + 0.55, T.scanA + 0.6, T.scanA + 0.7)
    const refuse = hold(c, T.scanA + 0.6, T.scanA + 0.7, T.backB - 0.1, T.backB + 0.25)
    panelMat.color.set(refuse > 0.02 ? C.orange : '#7FA6FF')
    panelMat.opacity = 0.45 + read * 0.25 + refuse * (0.32 + 0.12 * Math.sin((c - T.scanA) * Math.PI * 2 * 3))
    /* the bucket's padlock gives one firm click */
    const click = Math.sin(clamp01((c - (T.scanA + 0.65)) / 0.3) * Math.PI)
    lock.scale.setScalar(1.2 * (1 + click * 0.18))
    lock.rotation.z = click * 0.12
    /* the laptop screen: code, sent, then the error until the card has sunk back */
    const scr = c < 0.9 ? lapScreens.code : c < T.fail ? lapScreens.send : c < T.idle ? lapScreens.fail : lapScreens.code
    if (lapMat.map !== scr) lapMat.map = scr
    /* rack LEDs */
    for (const m of leds) m.material = (c / 1.5 + (m.userData.phase as number)) % 1 < 0.5 ? ledOn : ledOff
    lid.updateMatrixWorld()
    lapScreen.getWorldPosition(from)
    card.update(c, from, camera)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const T21Everyday = ({ step = 0 }: Fig) => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} holdT={HOLD_T} setup={setupShop} />
  </div>
)
const T21Concept = ({ step = 0 }: Fig) => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} holdT={HOLD_T} setup={setupCloud} />
  </div>
)

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  K_T21Everyday: T21Everyday as (p: Record<string, unknown>) => ReactNode,
  K_T21Concept: T21Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
