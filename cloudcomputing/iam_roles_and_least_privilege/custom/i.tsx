import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'

/**
 * BUILDER I · SESSION 14 (IAM Roles & Least Privilege) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * to the Session 16 standard (generate-slides standing corrections 13-17): a perspective camera and a real place;
 * people are Character Lab characters from the engine's `castSprite` (role clothing by `dress`, frames at the size they
 * are drawn by `adaptive`), each an individual with expressions keyed to the action; NO TEXT on either card; one
 * wall-clock loop per slide shared by both cards beat for beat and place for place, each loop ending in the state it
 * starts in; held frames (`?still`, thumbnails) draw the key moment at HOLD. Nobody walks toward or away from the
 * camera: people step sideways, and a person "goes in" by walking behind a facade.
 *
 * SLIDE 20 · T09-AN (TR 9): "A building access card allows an employee to enter only approved floors, even if their
 * department's rules allow access to more floors: just as a permission boundary limits the maximum permissions an
 * identity can receive."
 *
 *   place (x)      everyday: a glass office lift                   concept: a permissions room
 *   -1.33          the department notice: 6 of 8 floors marked     the identity policy: 6 of 8 levels marked
 *   -0.3           the glass wall, the atrium floors behind it     the glass column of permission levels
 *    0.62          the employee with her access card               the identity with his boundary card
 *    1.15          the card reader                                 the boundary reader
 *    1.42 / 1.62   8 floor buttons / the car's position marker     (the column's levels / the stack's top)
 *
 *   0.15 - 1.05    she reads the notice (6 floors allowed)         he reads the policy (6 levels allowed)
 *   1.0 - 2.3      card on the reader: buttons 1-3 light,          card on the reader: the glass ceiling slab drops
 *                  4-8 stay dark                                   onto level 3, levels 1-3 light, 4-6 stay dim
 *   2.6 - 5.3      the lift rises floor 1 -> 3 and stops there     the block stack rises 1 -> 3 and stops at the slab
 *   5.3 - 6.5      she looks up at the dark buttons                he looks up at the dim levels above the slab
 *   6.5 - 8.0      back down, the buttons go out                   the stack sinks, the slab lifts away
 *
 * SLIDE 25 · T11-AN (TR 11): "A company ID card issued by the head office is accepted at every branch office without
 * a fresh check: just as a federated identity, once verified by the identity provider, is trusted across every
 * connected cloud application."
 *
 *   place (x)      everyday: a street of one company's offices     concept: a cloud deck of connected apps
 *   -1.95          the head office desk, its card printer and      the identity provider's tower and its issuing
 *                  the HR officer                                  kiosk
 *   -0.66          the alley before branch A                       the path before app A
 *    0.05          branch A's guard (cap, uniform)                 app A's verifier post
 *    0.8           the alley before branch B                       the path before app B
 *    1.5           branch B's guard                                app B's verifier post
 *
 *   0.0 - 1.5      the card prints, the officer hands it over      the user is verified, a signed token issues
 *   1.5 - 3.0      at branch A: the guard glances, waves him in    at app A: the post scans the token, the gate opens
 *   3.0 - 3.85     he walks through branch A                       he walks through app A
 *   3.85 - 5.5     at branch B: a glance, a wave, he goes in       at app B: a scan, the gate opens, he goes in
 *   5.6 - 8.0      back to the head office (unseen behind the      back to the tower
 *                  buildings, seen in the alleys)
 */

const W = 470
const H = 390
/* dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : d
}

const C = {
  brand: colors.brand,
  brandDark: colors.brandDark,
  navy: colors.nwNavy,
  orange: colors.accent,
  green: colors.success,
  teal: colors.teal,
  white: colors.white,
  gold: '#F2C14E',
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

/**
 * A sheet that shows a building's floors as 8 bars, bottom to top; the lowest `marked` in blue (the department's
 * notice and the identity policy are the same picture, so the two cards match). `fold` adds a document's folded corner.
 */
function floorsSheetTex(marked: number, fold: boolean) {
  return canvasTex(120, 156, (g) => {
    rr(g, 3, 3, 114, 150, 8, '#FFFFFF')
    if (fold) {
      g.fillStyle = '#DCE6F7'
      g.beginPath()
      g.moveTo(117 - 24, 3)
      g.lineTo(117, 27)
      g.lineTo(117 - 24, 27)
      g.closePath()
      g.fill()
    }
    /* the header: an emblem dot and a rule (no words) */
    g.fillStyle = C.navy
    g.beginPath()
    g.arc(22, 20, 8, 0, TAU)
    g.fill()
    rr(g, 36, 15, 44, 5, 2.5, '#C3CCDD')
    rr(g, 36, 23, 30, 4, 2, '#DCE2EE')
    for (let i = 0; i < 8; i++) {
      const y = 140 - i * 14.2
      const on = i < marked
      rr(g, 14, y - 8, 10, 10, 2.5, on ? C.brand : '#D6DCE8')
      rr(g, 30, y - 7, 76, 8, 4, on ? '#8FB0FF' : '#E6EAF2')
    }
  })
}
/** a card reader's face: a dark plate with the contactless arcs */
function readerTex() {
  return canvasTex(60, 84, (g) => {
    rr(g, 0, 0, 60, 84, 9, '#1E2A47')
    g.strokeStyle = '#9CC2FF'
    g.lineWidth = 3.2
    g.lineCap = 'round'
    for (const r of [8, 15, 22]) {
      g.beginPath()
      g.arc(22, 46, r, -0.75, 0.75)
      g.stroke()
    }
  })
}
/** an office floor seen across the atrium: windows, desks with monitors, a plant (no words) */
function officeTex() {
  return canvasTex(320, 170, (g) => {
    g.fillStyle = '#F3EEE6'
    g.fillRect(0, 0, 320, 170)
    for (let i = 0; i < 4; i++) {
      const x = 12 + i * 78
      const sky = g.createLinearGradient(0, 18, 0, 92)
      sky.addColorStop(0, '#A9D3FF')
      sky.addColorStop(1, '#E3F1FF')
      g.fillStyle = sky
      g.fillRect(x, 18, 64, 74)
      g.fillStyle = '#FFFFFF'
      g.fillRect(x + 30, 18, 4, 74)
    }
    /* desks with monitors */
    for (let i = 0; i < 3; i++) {
      const x = 30 + i * 100
      rr(g, x, 112, 74, 8, 2, '#C29A6B')
      g.fillStyle = '#8C6A48'
      g.fillRect(x + 6, 120, 5, 36)
      g.fillRect(x + 63, 120, 5, 36)
      rr(g, x + 22, 88, 30, 20, 2, '#2B3A5E')
      rr(g, x + 25, 91, 24, 14, 1, '#6FA0FF')
      g.fillStyle = '#2B3A5E'
      g.fillRect(x + 35, 108, 4, 5)
    }
    /* a plant */
    rr(g, 296, 132, 16, 22, 3, '#B7764A')
    g.fillStyle = '#3FA36B'
    for (const [dx, dy, r] of [[304, 120, 11], [296, 126, 8], [312, 126, 8]] as const) {
      g.beginPath()
      g.arc(dx, dy, r, 0, TAU)
      g.fill()
    }
    g.fillStyle = '#D9CFC0'
    g.fillRect(0, 156, 320, 14)
  })
}
/** the company's emblem: a blue rounded square with three white blocks of rising height (no words) */
function emblemTex(bg: string = C.brand) {
  return canvasTex(80, 80, (g) => {
    rr(g, 2, 2, 76, 76, 16, bg)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.moveTo(40, 13)
    g.lineTo(66, 28)
    g.lineTo(14, 28)
    g.closePath()
    g.fill()
    for (const x of [19, 31, 43, 55]) rr(g, x, 32, 6, 24, 1.5, '#FFFFFF')
    rr(g, 14, 58, 52, 8, 2, '#FFFFFF')
  })
}
/** an office facade's front: plaster with a row of upper windows (no words) */
function facadeTex(wall: string, glass: string, frame: string) {
  return canvasTex(200, 240, (g) => {
    g.fillStyle = wall
    g.fillRect(0, 0, 200, 240)
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const x = 16 + i * 62
        const y = 24 + r * 70
        rr(g, x - 3, y - 3, 50, 50, 4, frame)
        const sky = g.createLinearGradient(0, y, 0, y + 44)
        sky.addColorStop(0, glass)
        sky.addColorStop(1, '#EAF4FF')
        g.fillStyle = sky
        g.fillRect(x, y, 44, 44)
        g.fillStyle = 'rgba(255,255,255,0.55)'
        g.beginPath()
        g.moveTo(x + 6, y + 44)
        g.lineTo(x + 22, y)
        g.lineTo(x + 30, y)
        g.lineTo(x + 14, y + 44)
        g.fill()
      }
    }
    /* the ground floor: a wide glass shopfront */
    rr(g, 10, 172, 180, 62, 4, frame)
    const sh = g.createLinearGradient(0, 176, 0, 230)
    sh.addColorStop(0, glass)
    sh.addColorStop(1, '#DCEBFF')
    g.fillStyle = sh
    g.fillRect(14, 176, 172, 54)
    g.fillStyle = frame
    g.fillRect(98, 176, 4, 54)
  })
}
/** a soft skyline far behind the street */
function skylineTex(fill: string, sky: string) {
  return canvasTex(400, 120, (g) => {
    g.fillStyle = sky
    g.fillRect(0, 0, 400, 120)
    g.fillStyle = fill
    const blocks = [[0, 60, 38], [36, 34, 30], [64, 70, 40], [100, 46, 26], [124, 22, 34], [156, 58, 44], [198, 40, 30], [226, 66, 40], [264, 30, 34], [296, 52, 30], [324, 38, 42], [364, 62, 36]]
    for (const [x, y, w] of blocks) g.fillRect(x, y, w, 120 - y)
  })
}
/** an app's front tile: a chart (app A) or a document stack (app B), white on colour */
function appTex(kind: 'chart' | 'docs', bg: string) {
  return canvasTex(100, 100, (g) => {
    rr(g, 2, 2, 96, 96, 20, bg)
    g.fillStyle = '#FFFFFF'
    if (kind === 'chart') {
      ;[26, 44, 34, 58].forEach((h, i) => rr(g, 20 + i * 16, 78 - h, 11, h, 2, '#FFFFFF'))
      rr(g, 16, 80, 68, 4, 2, '#FFFFFF')
    } else {
      rr(g, 30, 18, 46, 58, 5, 'rgba(255,255,255,0.55)')
      rr(g, 24, 24, 46, 58, 5, '#FFFFFF')
      for (let i = 0; i < 4; i++) rr(g, 32, 36 + i * 10, i === 3 ? 18 : 30, 4, 2, bg)
    }
  })
}
/** the signed token: a gold card with a seal (a rosette with a tick, no words) */
function tokenTex() {
  return canvasTex(110, 74, (g) => {
    const gr = g.createLinearGradient(0, 0, 110, 74)
    gr.addColorStop(0, '#FFD873')
    gr.addColorStop(1, '#F2A93B')
    g.fillStyle = gr
    g.beginPath()
    g.roundRect(2, 2, 106, 70, 12)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 2.5
    g.stroke()
    /* the seal */
    g.fillStyle = C.orange
    g.beginPath()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU
      const r = i % 2 ? 15 : 18
      g.lineTo(76 + Math.cos(a) * r, 37 + Math.sin(a) * r)
    }
    g.closePath()
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 3.4
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(69, 37)
    g.lineTo(74, 43)
    g.lineTo(84, 31)
    g.stroke()
    /* two lines of the signed body */
    rr(g, 14, 22, 34, 6, 3, 'rgba(255,255,255,0.85)')
    rr(g, 14, 34, 26, 6, 3, 'rgba(255,255,255,0.7)')
    rr(g, 14, 46, 30, 6, 3, 'rgba(255,255,255,0.7)')
  })
}
/** an ID card: white with a blue band, a photo square and the company emblem (no words) */
function idCardTex(band: string) {
  return canvasTex(110, 70, (g) => {
    rr(g, 1, 1, 108, 68, 9, '#FFFFFF')
    g.save()
    g.beginPath()
    g.roundRect(1, 1, 108, 68, 9)
    g.clip()
    g.fillStyle = band
    g.fillRect(0, 0, 110, 18)
    g.restore()
    rr(g, 10, 26, 26, 32, 4, '#CFDDF7')
    g.fillStyle = '#7F9CCF'
    g.beginPath()
    g.arc(23, 37, 6, 0, TAU)
    g.fill()
    g.beginPath()
    g.ellipse(23, 54, 10, 6, 0, Math.PI, 0)
    g.fill()
    rr(g, 44, 30, 44, 6, 3, '#C3CCDD')
    rr(g, 44, 42, 32, 5, 2.5, '#DCE2EE')
    rr(g, 90, 46, 12, 12, 3, C.gold)
  })
}
/** a chevron on the floor (the concept's "this way") */
function chevronTex() {
  return canvasTex(64, 64, (g) => {
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 11
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(20, 12)
    g.lineTo(44, 32)
    g.lineTo(20, 52)
    g.stroke()
  })
}
/** a key glyph for a permission block's face */
function keyFaceTex() {
  return canvasTex(64, 40, (g) => {
    g.strokeStyle = '#FFFFFF'
    g.fillStyle = '#FFFFFF'
    g.lineWidth = 4.5
    g.beginPath()
    g.arc(22, 20, 8, 0, TAU)
    g.stroke()
    g.fillRect(29, 18, 22, 4.5)
    g.fillRect(43, 18, 4.5, 10)
    g.fillRect(36, 18, 4.5, 8)
  })
}

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: THREE.Vector3Tuple, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const flat = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
/** a picture on a wall: a plane facing +z */
function picture(tex: THREE.Texture, w: number, h: number, pos: THREE.Vector3Tuple, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(tex, o))
  m.position.set(...pos)
  return m
}
const haloTex = (color: string) =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, color)
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
function halo(color: string, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: haloTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}
function lights(scene: THREE.Scene, target: THREE.Vector3Tuple, key = 2.0) {
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95)
  scene.add(hemi)
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 4, target[1] + 9, target[2] + 8)
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
  return { hemi, key: k, rim }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
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
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT?: number }): Sprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes */
  const quiet = (c: number) => o.holdT !== undefined && Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 40,
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
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
/** a laptop bag on a strap across the chest (the user, rule 58: a person with a laptop) */
const LAPTOP_BAG = (
  <g data-part="laptop-bag">
    <path d="M 168 210 L 246 372" stroke="#2A3550" strokeWidth={9} strokeLinecap="round" fill="none" />
    <rect x={222} y={352} width={58} height={44} rx={7} fill="#2A3550" />
    <rect x={230} y={360} width={42} height={28} rx={4} fill="#3B4A72" />
    <circle cx={251} cy={374} r={4} fill="#9CC2FF" />
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
/** the arm angles that put this hand at rig point p: elbow above the line (the relaxed reach of the rig's own poses),
 *  or with `down` the elbow below it and the forearm raised (a card held up, a card on a reader) */
function ik(side: 'L' | 'R', sh: number, p: Pt, down = false): Arm {
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
function rigTarget(T: THREE.Vector3Tuple, root: THREE.Vector3Tuple, h: number, cam: THREE.Vector3Tuple): Pt {
  const k = (root[2] + 0.08 - cam[2]) / (T[2] - cam[2])
  const px = cam[0] + (T[0] - cam[0]) * k
  const py = cam[1] + (T[1] - cam[1]) * k
  const u = h / 0.93 / 600
  return { x: 200 + (px - root[0]) / u, y: 600 - (py - root[1]) / u }
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
/** the prop in a hand, placed at the hand of the frame the sprite is showing */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.08)
}
/** the loop time of the frame a sprite of F frames is showing at c (props follow the drawn frame, not the clock) */
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
  let x = keys[keys.length - 1][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (c <= b) {
      const k = seg(c, a, b)
      const walking = hold(c, a, a + 0.08, b - 0.08, b)
      return { x: lerp(x, xt, k), walking, dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}

/* ================================================================== T09 · the floor access card and the lift */

const L09 = 8
const HOLD09 = 5.45 /* the car at floor 3 and no further, buttons 1-3 lit and 4-8 dark, she looks up at the dark ones */
const F09 = 96
const CAM09: THREE.Vector3Tuple = [0.12, 1.42, 3.55]
const P09 = {
  wallZ: -1.0,
  left: -1.75,
  right: 1.95,
  ceil: 2.62,
  notice: [-1.33, 1.45] as const,
  glass: { x0: -0.9, x1: 0.3, y0: 0.12, y1: 2.45 },
  who: [0.67, 0, -0.55] as THREE.Vector3Tuple,
  hWho: 1.64,
  reader: [1.15, 1.02, -0.97] as THREE.Vector3Tuple,
  btnX: 1.42,
  btnY0: 0.72,
  btnDy: 0.155,
  trackX: 1.64,
  FH: 2.2, // one storey of the atrium
  LV: 0.25, // one permission level of the column
  col0: 0.1, // the column's floor
}
const T09 = {
  notice: [0.15, 0.4, 0.85, 1.05] as const,
  reach: [1.0, 1.5, 1.85, 2.3] as const,
  tap: 1.55,
  light: 1.65, // first of three, 0.2 s apart
  rise: [2.6, 4.9] as const,
  settle: 4.9,
  up: [5.3, 5.55, 6.2, 6.45] as const, // she looks up at the dark buttons
  down: [6.5, 7.6] as const,
  off: [7.6, 7.9] as const,
}
/** the car's height above floor 1, in storeys (0 .. 2), with a small settle when it stops */
function storey09(c: number) {
  const up = seg(c, T09.rise[0], T09.rise[1]) * (1 - seg(c, T09.down[0], T09.down[1]))
  const s = c > T09.settle && c < T09.settle + 0.7 ? 0.018 * Math.sin((c - T09.settle) * TAU * 2.2) * Math.exp(-(c - T09.settle) * 6) : 0
  return 2 * up + s
}
/** how lit the approved button / level i (0..2) is */
const lit09 = (c: number, i: number) => seg(c, T09.light + 0.2 * i, T09.light + 0.2 * i + 0.15) * (1 - seg(c, T09.off[0], T09.off[1]))

/** the card-holder's pose, shared by the employee and the identity: the notice, the reader, the ride, the dark buttons */
function holderPose09(sh: number) {
  const tap = ik('R', sh, rigTarget(P09.reader, P09.who, P09.hWho, CAM09), true)
  const rest: Arm = { s: 14, e: 34 }
  return {
    armR: (c: number): Arm => mixArm(rest, tap, hold(c, T09.reach[0], T09.reach[1], T09.reach[2], T09.reach[3])),
    pose: (p: Pose, c: number) => {
      const r = mixArm(rest, tap, hold(c, T09.reach[0], T09.reach[1], T09.reach[2], T09.reach[3]))
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = 8
      p.elbowL = 12
      /* the notice, at her left */
      const n = hold(c, T09.notice[0], T09.notice[1], T09.notice[2], T09.notice[3])
      to(p, 'headTurn', -0.55, n)
      to(p, 'lookX', -1, n)
      /* the reader and the panel, at her right */
      const pnl = hold(c, 0.95, 1.15, T09.up[0] - 0.1, T09.up[0])
      to(p, 'headTurn', 0.45, pnl)
      to(p, 'lookX', 0.9, pnl)
      to(p, 'lookY', 0.15, hold(c, 1.1, 1.3, 2.2, 2.5))
      /* the dark buttons above */
      const up = hold(c, T09.up[0], T09.up[1], T09.up[2], T09.up[3])
      to(p, 'headTurn', 0.35, up)
      to(p, 'lookX', 0.8, up)
      to(p, 'lookY', -0.85, up)
      to(p, 'headNod', -0.2, up)
      /* the knees give a little as the car starts and stops */
      const dip = 0.14 * (hold(c, T09.rise[0], T09.rise[0] + 0.15, T09.rise[0] + 0.25, T09.rise[0] + 0.45) + hold(c, T09.settle, T09.settle + 0.12, T09.settle + 0.2, T09.settle + 0.4))
      p.kneeL = dip
      p.kneeR = dip
      /* a small nod once she is there */
      to(p, 'headNod', 0.18, hold(c, 6.25, 6.4, 6.5, 6.7))
    },
  }
}
const HOLDER09_FACES: [number, string][] = [
  [0, 'neutral'],
  [0.2, 'thinking'],
  [1.05, 'listening'],
  [1.8, 'happy'],
  [2.7, 'neutral'],
  [4.95, 'happy'],
  [5.75, 'thinking'],
  [6.3, 'happy'],
  [7.7, 'neutral'],
]

/** the box both cards share: floor, ceiling, side walls, the back wall around the glass and the right-hand panel */
function room09(scene: THREE.Scene, o: { wall: string; panel: string; floor: [string, string]; ceil: string; trim: string; metal: number }) {
  const { left, right, wallZ, ceil, glass } = P09
  const wallM = mat(o.wall, { roughness: 0.5, metalness: o.metal, emissive: new THREE.Color(o.wall), emissiveIntensity: 0.22 })
  const fl = flat(mesh(new THREE.PlaneGeometry(right - left, 4), mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 4, [6, 6]), roughness: 0.6 }), [(left + right) / 2, 0, wallZ + 2]))
  fl.rotation.x = -Math.PI / 2
  scene.add(fl)
  /* side walls */
  for (const x of [left, right]) scene.add(flat(box(0.06, ceil, 3.6, wallM, [x, ceil / 2, wallZ + 1.8])))
  /* the ceiling with its light panel */
  scene.add(flat(box(right - left, 0.06, 3.6, mat(o.ceil, { roughness: 0.6, emissive: new THREE.Color(o.ceil), emissiveIntensity: 0.5 }), [(left + right) / 2, ceil + 0.03, wallZ + 1.8])))
  scene.add(flat(box(1.6, 0.02, 0.9, glowM('#FFF6E0', '#FFFFFF', { emissiveIntensity: 0.9 }), [0.1, ceil - 0.005, wallZ + 0.9])))
  /* the back wall around the glass */
  const part = (a: number, b: number, y0: number, y1: number, m: THREE.Material = wallM) => scene.add(flat(box(b - a, y1 - y0, 0.06, m, [(a + b) / 2, (y0 + y1) / 2, wallZ - 0.03])))
  part(left, glass.x0, 0, ceil)
  part(glass.x1, right, 0, ceil, mat(o.panel, { roughness: 0.4, metalness: 0.4, emissive: new THREE.Color(o.panel), emissiveIntensity: 0.15 }))
  part(glass.x0, glass.x1, 0, glass.y0)
  part(glass.x0, glass.x1, glass.y1, ceil)
  /* the frame round the glass, and a skirting */
  const trimM = mat(o.trim, { roughness: 0.35, metalness: 0.6 })
  scene.add(box(glass.x1 - glass.x0 + 0.08, 0.05, 0.06, trimM, [(glass.x0 + glass.x1) / 2, glass.y0, wallZ + 0.01]))
  scene.add(box(glass.x1 - glass.x0 + 0.08, 0.05, 0.06, trimM, [(glass.x0 + glass.x1) / 2, glass.y1, wallZ + 0.01]))
  for (const x of [glass.x0, glass.x1]) scene.add(box(0.05, glass.y1 - glass.y0, 0.06, trimM, [x, (glass.y0 + glass.y1) / 2, wallZ + 0.01]))
  scene.add(box(right - left, 0.08, 0.02, trimM, [(left + right) / 2, 0.04, wallZ + 0.01]))
  return { wallM, trimM }
}

/** the reader on the right-hand panel: a dark plate with the contactless arcs and a lamp */
function reader09(scene: THREE.Scene, face: string) {
  const g = new THREE.Group()
  g.position.set(...P09.reader)
  g.add(box(0.15, 0.2, 0.03, mat(face, { roughness: 0.35, metalness: 0.4 }), [0, 0, 0], 0.012))
  const pic = picture(readerTex(), 0.12, 0.168, [0, -0.005, 0.017])
  g.add(pic)
  const lamp = glowM(C.green, '#6E7A92')
  g.add(cyl(0.013, 0.013, 0.02, lamp, [0.045, 0.072, 0.018]).rotateX(Math.PI / 2))
  scene.add(g)
  return lamp
}

/* ------------------------------------------------------------------ T09 everyday: the glass lift */

function setupT09Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E9EEF6')
  camera.fov = 43
  camera.position.set(...CAM09)
  camera.lookAt(0.12, 1.04, -0.6)
  camera.updateProjectionMatrix()
  lights(scene, [0.2, 1.0, -0.5])
  room09(scene, { wall: '#D5DCE7', panel: '#B9C3D3', floor: ['#C9B79C', '#B9A688'], ceil: '#EEF1F6', trim: '#8F9BB0', metal: 0.35 })
  const { wallZ, glass, FH } = P09

  /* the atrium behind the glass: eight storeys of offices, the approved three warm and lit, the five above dim; the
     whole building slides down past the glass as the car rises */
  const atrium = new THREE.Group()
  scene.add(atrium)
  const office = officeTex()
  const slabM = mat('#F4F1EC', { roughness: 0.7 })
  const railM = new THREE.MeshStandardMaterial({ color: '#CFE6FF', transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 })
  for (let f = 0; f < 9; f++) {
    const y = f * FH
    atrium.add(flat(box(3.6, 0.24, 1.7, slabM, [-0.3, y - 0.12, wallZ - 1.15])))
    atrium.add(flat(box(3.6, 0.05, 0.05, mat('#B8C0CE', { metalness: 0.6, roughness: 0.3 }), [-0.3, y + 0.92, wallZ - 0.34])))
    atrium.add(box(3.6, 0.9, 0.02, railM, [-0.3, y + 0.47, wallZ - 0.34]))
    const dim = f >= 3
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(3.6, FH - 0.24), basic(office, { transparent: false, color: dim ? '#7E899C' : '#FFFFFF' }))
    wall.position.set(-0.3, y + (FH - 0.24) / 2, wallZ - 1.98)
    atrium.add(wall)
    /* a strip light under each slab, lit on the approved floors */
    atrium.add(flat(box(2.6, 0.03, 0.2, glowM('#FFE7B0', '#FFFFFF', { emissiveIntensity: dim ? 0.05 : 1.1 }), [-0.3, y + FH - 0.26, wallZ - 1.4])))
  }
  const glassM = new THREE.MeshStandardMaterial({ color: '#DDEEFF', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false })
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(glass.x1 - glass.x0, glass.y1 - glass.y0), glassM)
  pane.position.set((glass.x0 + glass.x1) / 2, (glass.y0 + glass.y1) / 2, wallZ + 0.005)
  scene.add(pane)
  /* the handrail along the back wall */
  const railSteel = mat('#AEB8C8', { metalness: 0.75, roughness: 0.25 })
  scene.add(cyl(0.02, 0.02, 3.4, railSteel, [0.1, 0.92, wallZ + 0.1]).rotateZ(Math.PI / 2))

  /* the department notice on a cork board: 6 of 8 floors marked */
  const [nx, ny] = P09.notice
  scene.add(box(0.66, 0.84, 0.03, mat('#C49A6C', { roughness: 0.9 }), [nx, ny, wallZ + 0.02], 0.01))
  scene.add(box(0.7, 0.88, 0.02, mat('#7A5A3A', { roughness: 0.6 }), [nx, ny, wallZ + 0.005], 0.01))
  scene.add(picture(floorsSheetTex(6, false), 0.48, 0.624, [nx, ny - 0.02, wallZ + 0.04]))
  scene.add(cyl(0.016, 0.016, 0.02, mat(C.brand), [nx, ny + 0.29, wallZ + 0.05]).rotateX(Math.PI / 2))
  const noticeGlow = halo('rgba(45,99,251,0.55)', 0.9)
  noticeGlow.position.set(nx, ny, wallZ + 0.06)
  scene.add(noticeGlow)

  /* the panel: the reader, eight floor buttons (bottom = floor 1) and the car's position marker */
  const readerLamp = reader09(scene, '#3A4560')
  const btns: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < 8; i++) {
    const y = P09.btnY0 + i * P09.btnDy
    scene.add(cyl(0.058, 0.058, 0.018, mat('#8E99AD', { metalness: 0.7, roughness: 0.3 }), [P09.btnX, y, wallZ + 0.01]).rotateX(Math.PI / 2))
    const m = glowM(C.brand, '#465068', { metalness: 0.3, roughness: 0.35 })
    btns.push(m)
    scene.add(cyl(0.042, 0.042, 0.03, m, [P09.btnX, y, wallZ + 0.02]).rotateX(Math.PI / 2))
  }
  const trackTop = P09.btnY0 + 7 * P09.btnDy
  scene.add(box(0.05, trackTop - P09.btnY0 + 0.1, 0.02, mat('#2B3550', { roughness: 0.5 }), [P09.trackX, (P09.btnY0 + trackTop) / 2, wallZ + 0.01], 0.01))
  const markM = glowM('#7FB0FF', '#FFFFFF', { emissiveIntensity: 1.2 })
  const marker = box(0.07, 0.05, 0.03, markM, [P09.trackX, P09.btnY0, wallZ + 0.03], 0.01)
  scene.add(flat(marker))
  const arrive = halo('rgba(127,176,255,0.95)', 0.32)
  arrive.position.set(P09.trackX, P09.btnY0 + 2 * P09.btnDy, wallZ + 0.05)
  scene.add(arrive)

  /* the access card */
  const card = picture(idCardTex(C.brand), 0.13, 0.083, [0, 0, 0], { side: THREE.DoubleSide })
  card.renderOrder = 6
  scene.add(card)

  /* the employee: a young woman in a navy blazer with her company lanyard */
  const cfg = who(CAST_PRESETS.meera, { name: 'Employee', skinTone: 'wheatish', hair: { style: 'wavy', color: 'darkBrown' }, outfit: { top: 'blouse', topColor: '#F3F6FC', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true, watch: true } })
  const sh = buildSkin(cfg).shoulderHalf
  const hp = holderPose09(sh)
  const emp = person({ config: cfg, dress: (k) => withNeck(LANYARD(C.brand, C.brand))(withTop(BLAZER('#2E3A5C', '#1A2340'))(k)), seed: 91, faces: HOLDER09_FACES, pose: hp.pose, loop: L09, height: P09.hWho, frames: F09, redraw, holdT: devHold(HOLD09) })
  scene.add(emp.object)
  const root = new THREE.Vector3(...P09.who)
  const hand = new THREE.Vector3()
  const readerP = new THREE.Vector3(P09.reader[0] - 0.01, P09.reader[1] - 0.01, P09.reader[2] + 0.05)
  return (t: number) => {
    const c = mod(t, L09)
    const cq = frameT(c, L09, F09)
    emp.object.position.copy(root)
    emp.update(c, camera)
    const st = storey09(c)
    atrium.position.y = -st * FH
    marker.position.y = P09.btnY0 + st * P09.btnDy
    ;(arrive.material as THREE.MeshBasicMaterial).opacity = 0.9 * hold(c, T09.settle - 0.1, T09.settle + 0.1, T09.settle + 0.4, T09.settle + 0.9)
    ;(noticeGlow.material as THREE.MeshBasicMaterial).opacity = 0.55 * hold(c, T09.notice[0], T09.notice[1], T09.notice[2], T09.notice[3])
    /* the approved buttons light in turn and pulse softly; the five above stay dark */
    btns.forEach((m, i) => {
      const k = i < 3 ? lit09(c, i) : 0
      m.emissiveIntensity = k * (0.75 + 0.2 * Math.sin(c * TAU * 0.8 + i))
      m.color.set('#465068').lerp(new THREE.Color(C.brand), k)
    })
    readerLamp.emissiveIntensity = 2.2 * hold(c, T09.tap, T09.tap + 0.08, T09.tap + 0.45, T09.tap + 0.7)
    /* the card: in her hand, flat on the reader at the tap */
    handWorld('R', sh, hp.armR(cq), P09.hWho, root, camera, hand)
    const onR = hold(c, T09.reach[1] - 0.05, T09.tap - 0.02, T09.reach[2] - 0.05, T09.reach[2] + 0.1)
    card.position.copy(hand).lerp(readerP, onR)
    card.quaternion.copy(camera.quaternion)
    card.rotateZ(lerp(-0.35, 0, onR))
  }
}

/* ------------------------------------------------------------------ T09 concept: the permission column and its ceiling */

function setupT09Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EAF1FC')
  camera.fov = 43
  camera.position.set(...CAM09)
  camera.lookAt(0.12, 1.04, -0.6)
  camera.updateProjectionMatrix()
  lights(scene, [0.2, 1.0, -0.5])
  room09(scene, { wall: '#E3EBF8', panel: '#C8D6EE', floor: ['#E1E9F7', '#C9D5EC'], ceil: '#F3F6FC', trim: '#2C3E7E', metal: 0.05 })
  const { wallZ, glass, LV, col0 } = P09
  const cx = (glass.x0 + glass.x1) / 2
  const cz = wallZ + 0.5

  /* the identity policy: the same 6 of 8 levels, on a document */
  const [nx, ny] = P09.notice
  scene.add(box(0.62, 0.8, 0.03, mat('#FFFFFF', { roughness: 0.4 }), [nx, ny, wallZ + 0.02], 0.02))
  scene.add(picture(floorsSheetTex(6, true), 0.5, 0.65, [nx, ny - 0.01, wallZ + 0.04]))
  const policyGlow = halo('rgba(45,99,251,0.55)', 0.9)
  policyGlow.position.set(nx, ny, wallZ + 0.06)
  scene.add(policyGlow)

  /* the column: a glass shaft of eight levels on a base, its four posts ticked at every level */
  const colW = 0.86
  const colD = 0.6
  const postM = mat('#3B5BB8', { roughness: 0.35, metalness: 0.3 })
  scene.add(box(colW + 0.2, col0, colD + 0.2, mat('#FFFFFF', { roughness: 0.35 }), [cx, col0 / 2, cz], 0.02))
  const topY = col0 + 8 * LV
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scene.add(box(0.035, topY - col0 + 0.06, 0.035, postM, [cx + (sx * colW) / 2, (col0 + topY) / 2 + 0.03, cz + (sz * colD) / 2]))
  scene.add(box(colW + 0.06, 0.035, colD + 0.06, postM, [cx, topY + 0.06, cz]))
  for (let i = 1; i < 8; i++) for (const sx of [-1, 1]) scene.add(flat(box(0.07, 0.012, 0.012, mat('#7F9CCF'), [cx + (sx * (colW + 0.02)) / 2, col0 + i * LV, cz + colD / 2])))
  const shaftM = new THREE.MeshStandardMaterial({ color: '#DDEBFF', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false })
  scene.add(box(colW, topY - col0, colD, shaftM, [cx, (col0 + topY) / 2, cz]))

  /* the six levels the policy allows, as ghost blocks; 1-3 brighten when the boundary is set, 4-6 stay dim */
  const bw = colW - 0.12
  const bh = LV - 0.04
  const bd = colD - 0.12
  const ghostGeo = new THREE.BoxGeometry(bw, bh, bd)
  const ghostEdges = new THREE.EdgesGeometry(ghostGeo)
  const ghosts = Array.from({ length: 6 }, (_, i) => {
    const y = col0 + i * LV + LV / 2
    const fillM = new THREE.MeshBasicMaterial({ color: '#B9C8E6', transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false })
    const lineM = new THREE.LineBasicMaterial({ color: '#8A9AB8', transparent: true, opacity: 0.8, toneMapped: false })
    const f = new THREE.Mesh(ghostGeo, fillM)
    f.position.set(cx, y, cz)
    const l = new THREE.LineSegments(ghostEdges, lineM)
    l.position.copy(f.position)
    scene.add(f, l)
    return { fillM, lineM }
  })

  /* the stack: six glossy permission blocks, a key on each face, rising top first out of the base */
  const blockM = mat(C.brand, { roughness: 0.25, metalness: 0.1, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.15 })
  const keyFace = keyFaceTex()
  const stack = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const b = box(bw - 0.02, bh - 0.02, bd - 0.02, blockM, [0, i * LV + LV / 2, 0], 0.03)
    stack.add(b)
    stack.add(picture(keyFace, 0.22, 0.137, [0, i * LV + LV / 2, (bd - 0.02) / 2 + 0.003]))
  }
  stack.position.set(cx, 0, cz)
  scene.add(stack)
  /* the base hides what is still below the floor: its top face is the column's floor */
  const capM = mat('#FFFFFF', { roughness: 0.35 })
  scene.add(box(colW + 0.2, 0.02, colD + 0.2, capM, [cx, col0 - 0.01, cz]))

  /* the boundary: a glass ceiling slab with bright edges; it drops onto level 3 when the card meets the reader */
  const slab = new THREE.Group()
  const slabM = new THREE.MeshStandardMaterial({ color: '#BFE0FF', transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2, emissive: new THREE.Color('#7FB0FF'), emissiveIntensity: 0.25 })
  slab.add(box(colW + 0.18, 0.045, colD + 0.18, slabM, [0, 0, 0], 0.01))
  const edgeM = new THREE.LineBasicMaterial({ color: '#FFFFFF', toneMapped: false })
  slab.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(colW + 0.18, 0.045, colD + 0.18)), edgeM))
  scene.add(slab)
  const slabY = col0 + 3 * LV + 0.0225
  const bump = halo('rgba(127,176,255,0.95)', 1.2)
  bump.position.set(cx, slabY, cz + colD / 2 + 0.1)
  scene.add(bump)

  const readerLamp = reader09(scene, '#24304F')
  /* the boundary card: glass, like the slab it sets */
  const card = new THREE.Group()
  card.add(box(0.13, 0.085, 0.008, slabM, [0, 0, 0], 0.008))
  card.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.13, 0.085, 0.008)), edgeM))
  card.add(box(0.09, 0.008, 0.01, mat('#FFFFFF', { emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.6 }), [0, 0.005, 0]))
  card.renderOrder = 6
  scene.add(card)

  /* the identity: a young man in a teal hoodie */
  const cfg = who(CAST_PRESETS.kabir, { name: 'Identity', skinTone: 'medium', hair: { style: 'curly', color: 'black' }, outfit: { top: 'hoodie', topColor: '#1F9E93', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { glasses: 'rect' } })
  const sh = buildSkin(cfg).shoulderHalf
  const hp = holderPose09(sh)
  const idn = person({ config: cfg, seed: 92, faces: HOLDER09_FACES, pose: hp.pose, loop: L09, height: P09.hWho, frames: F09, redraw, holdT: devHold(HOLD09) })
  scene.add(idn.object)
  const root = new THREE.Vector3(...P09.who)
  const hand = new THREE.Vector3()
  const readerP = new THREE.Vector3(P09.reader[0] - 0.01, P09.reader[1] - 0.01, P09.reader[2] + 0.05)
  return (t: number) => {
    const c = mod(t, L09)
    const cq = frameT(c, L09, F09)
    idn.object.position.copy(root)
    idn.update(c, camera)
    ;(policyGlow.material as THREE.MeshBasicMaterial).opacity = 0.55 * hold(c, T09.notice[0], T09.notice[1], T09.notice[2], T09.notice[3])
    /* the slab: drops from above the column onto level 3 at the tap, lifts away at the end */
    const set = seg(c, T09.tap, T09.tap + 0.32) * (1 - seg(c, T09.off[0], T09.off[1] + 0.05))
    slab.position.set(cx, lerp(topY + 0.5, slabY, set), cz)
    slab.visible = set > 0.01
    slabM.opacity = 0.55 * Math.min(1, set * 3)
    slabM.emissiveIntensity = 0.25 + 0.9 * hold(c, T09.tap + 0.28, T09.tap + 0.36, T09.tap + 0.45, T09.tap + 0.75) + 0.9 * hold(c, T09.settle - 0.08, T09.settle, T09.settle + 0.15, T09.settle + 0.5)
    ;(bump.material as THREE.MeshBasicMaterial).opacity = 0.85 * hold(c, T09.settle - 0.1, T09.settle + 0.05, T09.settle + 0.3, T09.settle + 0.8)
    /* the ghost levels: 1-3 lit, 4-6 dim */
    ghosts.forEach((g, i) => {
      const k = i < 3 ? lit09(c, i) : 0
      g.lineM.color.set('#8A9AB8').lerp(new THREE.Color(C.brand), k)
      g.lineM.opacity = 0.8 + 0.2 * k
      g.fillM.color.set('#B9C8E6').lerp(new THREE.Color('#7FB0FF'), k)
      g.fillM.opacity = 0.16 + 0.12 * k
    })
    /* the stack: its top at level 1, rising to level 3 against the slab, sinking back at the end */
    const st = storey09(c)
    stack.position.y = col0 - 5 * LV + st * LV
    blockM.emissiveIntensity = 0.15 + 0.12 * Math.sin(c * TAU * 0.8)
    readerLamp.emissiveIntensity = 2.2 * hold(c, T09.tap, T09.tap + 0.08, T09.tap + 0.45, T09.tap + 0.7)
    handWorld('R', sh, hp.armR(cq), P09.hWho, root, camera, hand)
    const onR = hold(c, T09.reach[1] - 0.05, T09.tap - 0.02, T09.reach[2] - 0.05, T09.reach[2] + 0.1)
    card.position.copy(hand).lerp(readerP, onR)
    card.quaternion.copy(camera.quaternion)
    card.rotateZ(lerp(-0.35, 0, onR))
  }
}

/* ================================================================== T11 · the head office card at every branch */

const L11 = 8
const HOLD11 = 2.8 /* the card held up at branch A, the guard's arm waving him in, the entrance lamp green */
const F11 = 96
const CAM11: THREE.Vector3Tuple = [-0.1, 1.62, 5.0]
const P11 = {
  P: -0.45, // the walking line, behind the facades' front
  F: 0.0, // the facades' front
  back: -1.5,
  hq: { x0: -3.0, x1: -1.1 },
  a: { x0: -0.42, x1: 0.42 },
  b: { x0: 1.0, x1: 1.95 },
  bh: 2.45, // a branch's height
  desk: [-2.14, 0, -0.85] as THREE.Vector3Tuple,
  issuer: [-2.32, 0, -1.18] as THREE.Vector3Tuple,
  printer: [-1.96, 0.79, -0.83] as THREE.Vector3Tuple,
  hand: [-1.82, 0.92, -0.78] as THREE.Vector3Tuple, // where the card changes hands, over the desk's front
  x0: -1.42, // the walker at the desk
  xA: -0.83, // before branch A
  xB: 0.66, // before branch B
  xIn: 1.55, // inside branch B
  gA: [0.0, 0, 0.28] as THREE.Vector3Tuple,
  gB: [1.55, 0, 0.28] as THREE.Vector3Tuple,
  hW: 1.64,
  hG: 1.68,
  hI: 1.6,
}
const T11 = {
  print: [0.0, 0.45] as const,
  give: [0.45, 0.8, 0.85, 1.15] as const, // reach, the card moves, he has it, arms down by 1.35
  swap: [1.15, 1.35, 1.45] as const, // both hands meet, the card to his right hand
  walks: [
    [1.5, 2.0, P11.xA],
    [3.05, 3.85, P11.xB],
    [4.85, 5.55, P11.xIn],
    [5.65, 7.55, P11.x0],
  ] as [number, number, number][],
  showA: [1.95, 2.2, 2.85, 3.05] as const,
  glanceA: [2.1, 2.3, 2.5, 2.65] as const,
  waveA: [2.45, 2.65, 3.1, 3.35] as const,
  showB: [3.8, 4.05, 4.7, 4.9] as const,
  glanceB: [3.95, 4.15, 4.35, 4.5] as const,
  waveB: [4.3, 4.5, 4.95, 5.2] as const,
}
const at11 = (c: number) => along(c, [[0, 0, P11.x0], ...T11.walks])
const gone11 = (c: number) => c > 5.45 && c < 7.0 /* the card is put away inside branch B, out of sight */

/** the walker's arms: the card received in the left hand, moved to the right, shown at each branch */
function walkerArms11(sh: number) {
  const rootAt = (x: number): THREE.Vector3Tuple => [x, 0, P11.P]
  const recv = ik('L', sh, rigTarget(P11.hand, rootAt(P11.x0), P11.hW, CAM11), true)
  const chestL = ik('L', sh, { x: 186, y: 318 })
  const chestR = ik('R', sh, { x: 214, y: 318 })
  /* the card shown out at the side, toward the guard, at chest height */
  const showA = ik('R', sh, { x: 200 + sh + 24, y: 238 }, true)
  const showB = showA
  return {
    L: (c: number): Arm => {
      const w = at11(c).walking
      let a: Arm = { s: 8 + swing(c, w), e: 10 }
      a = mixArm(a, recv, hold(c, T11.give[0], T11.give[1], T11.give[3], T11.give[3] + 0.15))
      a = mixArm(a, chestL, hold(c, T11.give[3], T11.swap[0], T11.swap[1], T11.swap[2]))
      return a
    },
    R: (c: number): Arm => {
      const w = at11(c).walking
      let a: Arm = { s: 12 - swing(c, w) * 0.4, e: 30 }
      if (gone11(c) || c > 7.0 || c < T11.swap[0]) a = { s: 8 - swing(c, w), e: 10 }
      a = mixArm(a, chestR, hold(c, T11.give[3] + 0.05, T11.swap[0], T11.swap[1], T11.swap[2]))
      a = mixArm(a, showA, hold(c, T11.showA[0], T11.showA[1], T11.showA[2], T11.showA[3]))
      a = mixArm(a, showB, hold(c, T11.showB[0], T11.showB[1], T11.showB[2], T11.showB[3]))
      return a
    },
  }
}
function walkerPose11(sh: number) {
  const arms = walkerArms11(sh)
  return {
    arms,
    pose: (p: Pose, c: number) => {
      const l = arms.L(c)
      const r = arms.R(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      p.shoulderR = r.s
      p.elbowR = r.e
      const at = at11(c)
      walkLegs(p, c, at.walking, at.dir)
      /* at the desk: toward the issuer (left); down at the new card; toward each guard (right) */
      const desk = Math.max(hold(c, 0, 0.02, 1.15, 1.3), hold(c, 7.4, 7.6, L11, L11 + 1))
      to(p, 'headTurn', -0.45, desk)
      to(p, 'lookX', -0.9, desk)
      const card = hold(c, 1.15, 1.25, 1.4, 1.5)
      to(p, 'headNod', 0.3, card)
      to(p, 'lookY', 0.8, card)
      const g = Math.max(hold(c, T11.showA[0] - 0.05, T11.showA[0] + 0.1, T11.showA[3] - 0.1, T11.showA[3] + 0.05), hold(c, T11.showB[0] - 0.05, T11.showB[0] + 0.1, T11.showB[3] - 0.1, T11.showB[3] + 0.05))
      to(p, 'headTurn', 0.45, g)
      to(p, 'lookX', 0.9, g)
      to(p, 'headNod', -0.05, g)
    },
  }
}
const WALKER11_FACES: [number, string][] = [
  [0, 'listening'],
  [0.85, 'happy'],
  [1.2, 'proud'],
  [1.6, 'neutral'],
  [2.0, 'happy'],
  [3.1, 'neutral'],
  [3.85, 'happy'],
  [5.0, 'neutral'],
  [7.35, 'listening'],
]

/** a guard: turns to the walker as he comes, glances at the card, waves him in with the left arm, back to the street */
function guardPose11(glance: readonly number[], wave: readonly number[], watch: [number, number]) {
  return (p: Pose, c: number) => {
    p.shoulderL = 10
    p.elbowL = 14
    p.shoulderR = 10
    p.elbowR = 14
    const look = hold(c, watch[0], watch[0] + 0.25, watch[1], watch[1] + 0.3)
    to(p, 'headTurn', -0.5, look)
    to(p, 'lookX', -0.95, look)
    const gl = hold(c, glance[0], glance[1], glance[2], glance[3])
    to(p, 'headNod', 0.22, gl)
    to(p, 'lookY', 0.55, gl)
    /* the wave: up and out toward the entrance, two sweeps */
    const w = hold(c, wave[0], wave[1], wave[2], wave[3])
    const sweep = Math.sin(clamp01((c - wave[1]) / (wave[2] - wave[1])) * TAU * 2) * 0.5 + 0.5
    to(p, 'shoulderL', 25 + 20 * sweep, w)
    to(p, 'elbowL', 22 - 6 * sweep, w)
    to(p, 'headNod', -0.08, w)
  }
}
const GUARD_FACES = (glance: number, wave: number, end: number): [number, string][] => [
  [0, 'neutral'],
  [glance - 0.4, 'listening'],
  [glance, 'thinking'],
  [wave, 'happy'],
  [end, 'neutral'],
]

/** a two-storey branch: front wall with its windows, roof band with the company emblem, and side walls with a door on
 *  the walking line under a canopy (its lamp turns green when the walker is let in) */
function branch11(scene: THREE.Scene, x0: number, x1: number, o: { front: THREE.Texture; wall: string; band: string; emblem: THREE.Texture | null; doorLeft: boolean; doorRight: boolean }) {
  const { F, back, P, bh } = P11
  const w = x1 - x0
  const cx = (x0 + x1) / 2
  const wallM = mat(o.wall, { roughness: 0.85 })
  const front = new THREE.Mesh(new THREE.BoxGeometry(w, bh, 0.1), [wallM, wallM, wallM, wallM, mat('#ffffff', { map: o.front, roughness: 0.8 }), wallM])
  front.position.set(cx, bh / 2, F - 0.05)
  front.castShadow = front.receiveShadow = true
  scene.add(front)
  scene.add(box(w + 0.08, 0.22, 0.16, mat(o.band, { roughness: 0.5 }), [cx, bh + 0.1, F - 0.06]))
  scene.add(flat(box(w, 0.1, F - back, wallM, [cx, bh + 0.05, (F + back) / 2])))
  if (o.emblem) scene.add(picture(o.emblem, 0.34, 0.34, [cx, bh - 0.32, F + 0.005]))
  const doorM = new THREE.MeshStandardMaterial({ color: '#CFE6FF', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2 })
  const lamps: THREE.MeshStandardMaterial[] = []
  const leaves: THREE.Mesh[] = []
  for (const [x, has, sg] of [[x0, o.doorLeft, -1], [x1, o.doorRight, 1]] as const) {
    /* the side wall: solid in front of and behind the door */
    const d0 = P + 0.32
    const d1 = P - 0.32
    scene.add(flat(box(0.08, bh, F - d0, wallM, [x, bh / 2, (F + d0) / 2])))
    scene.add(flat(box(0.08, bh, d1 - back, wallM, [x, bh / 2, (d1 + back) / 2])))
    scene.add(flat(box(0.08, bh - 2.0, d0 - d1, wallM, [x, 2.0 + (bh - 2.0) / 2, P])))
    if (!has) {
      scene.add(flat(box(0.08, 2.0, d0 - d1, wallM, [x, 1.0, P])))
      continue
    }
    /* the canopy over the door and its lamp */
    scene.add(box(0.36, 0.05, 0.8, mat(o.band, { roughness: 0.5 }), [x + sg * 0.18, 2.12, P]))
    const lamp = glowM(C.green, '#D7DEE9')
    lamps.push(lamp)
    scene.add(flat(box(0.16, 0.025, 0.08, lamp, [x + sg * 0.2, 2.085, P + 0.25])))
    /* a sliding glass leaf in the doorway */
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.98, 0.62), doorM)
    leaf.position.set(x, 0.99, P)
    scene.add(leaf)
    leaves.push(leaf)
    /* the mat outside */
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), mat('#56607A', { roughness: 0.95 }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x + sg * 0.24, 0.004, P)
    scene.add(m)
  }
  return { lamps, leaves }
}
/** open amount of the branch entrances (A, B) */
const doorA11 = (c: number) => hold(c, T11.waveA[1], T11.waveA[1] + 0.25, 3.75, 4.0)
const doorB11 = (c: number) => hold(c, T11.waveB[1], T11.waveB[1] + 0.25, 5.55, 5.85)
const doorAExit11 = (c: number) => hold(c, 3.35, 3.55, 3.95, 4.2)

/** the street both cards share: the pavement, a skyline, two branch buildings */
function street11(scene: THREE.Scene, o: { pave: [string, string]; sky: string; skyline: string; wall: [string, string]; band: [string, string]; front: [THREE.Texture, THREE.Texture]; emblem: [THREE.Texture | null, THREE.Texture | null] }) {
  const pave = flat(mesh(new THREE.PlaneGeometry(9, 7), mat('#ffffff', { map: tileTex(o.pave[0], o.pave[1], 4, [12, 9]), roughness: 0.85 }), [0, 0, 0]))
  pave.rotation.x = -Math.PI / 2
  scene.add(pave)
  const sky = picture(skylineTex(o.skyline, o.sky), 9, 2.7, [0, 1.35, -3.4], { transparent: false })
  scene.add(sky)
  const A = branch11(scene, P11.a.x0, P11.a.x1, { front: o.front[0], wall: o.wall[0], band: o.band[0], emblem: o.emblem[0], doorLeft: true, doorRight: true })
  const B = branch11(scene, P11.b.x0, P11.b.x1, { front: o.front[1], wall: o.wall[1], band: o.band[1], emblem: o.emblem[1], doorLeft: true, doorRight: false })
  return { A, B }
}
function setDoors11(c: number, A: ReturnType<typeof branch11>, B: ReturnType<typeof branch11>) {
  const a = doorA11(c)
  const ax = doorAExit11(c)
  const b = doorB11(c)
  if (A.leaves[0]) A.leaves[0].position.z = P11.P + 0.62 * a
  if (A.leaves[1]) A.leaves[1].position.z = P11.P + 0.62 * ax
  if (B.leaves[0]) B.leaves[0].position.z = P11.P + 0.62 * b
  A.lamps[0].emissiveIntensity = 2.0 * a
  if (A.lamps[1]) A.lamps[1].emissiveIntensity = 2.0 * ax
  B.lamps[0].emissiveIntensity = 2.0 * b
  /* the return walk (unseen) opens the doors again, quietly */
  const back = hold(c, 5.9, 6.05, 6.4, 6.55)
  const backA = Math.max(hold(c, 6.25, 6.4, 6.75, 6.9), hold(c, 6.75, 6.9, 7.15, 7.3))
  if (B.leaves[0]) B.leaves[0].position.z = Math.max(B.leaves[0].position.z, P11.P + 0.62 * back)
  if (A.leaves[1]) A.leaves[1].position.z = Math.max(A.leaves[1].position.z, P11.P + 0.62 * backA)
  if (A.leaves[0]) A.leaves[0].position.z = Math.max(A.leaves[0].position.z, P11.P + 0.62 * hold(c, 6.85, 7.0, 7.25, 7.4))
}

/* ------------------------------------------------------------------ T11 everyday: head office, two branches */

function setupT11Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#DCEBFB')
  camera.fov = 40
  camera.position.set(...CAM11)
  camera.lookAt(-0.1, 1.36, -0.5)
  camera.updateProjectionMatrix()
  lights(scene, [0, 1.0, -0.4])
  const emblem = emblemTex()
  const { A, B } = street11(scene, {
    pave: ['#E6E2DA', '#D3CDC2'],
    sky: '#DCEBFB',
    skyline: '#C3D3E8',
    wall: ['#F2E6D4', '#E6EEF8'],
    band: [C.navy, C.navy],
    front: [facadeTex('#F2E6D4', '#9CC9F5', '#8C6A48'), facadeTex('#E6EEF8', '#9CC9F5', '#5E6B86')],
    emblem: [emblem, emblem],
  })

  /* the head office: a tall lobby open to the street, its emblem large over the entrance; the HR desk with a card
     printer, the officer behind it */
  const { hq, F, back } = P11
  const hqW = hq.x1 - hq.x0
  const hcx = (hq.x0 + hq.x1) / 2
  const stoneM = mat('#ffffff', { map: tileTex('#EDE7DD', '#D9CFBF', 2, [4, 3]), roughness: 0.4 })
  const lob = flat(mesh(new THREE.PlaneGeometry(hqW, F - back), stoneM, [hcx, 0.003, (F + back) / 2]))
  lob.rotation.x = -Math.PI / 2
  scene.add(lob)
  const hqWall = mat('#E4E9F2', { roughness: 0.8 })
  scene.add(flat(box(hqW, 2.5, 0.1, hqWall, [hcx, 1.25, back - 0.05])))
  scene.add(picture(emblem, 0.3, 0.3, [hq.x1 - 0.62, 2.12, back + 0.01]))
  /* its upper storeys over the open lobby, taller than a branch, the fascia with the emblem */
  const upper = new THREE.Mesh(new THREE.BoxGeometry(hqW, 1.7, 0.12), [hqWall, hqWall, hqWall, hqWall, mat('#ffffff', { map: facadeTex('#E4E9F2', '#9CC9F5', '#5E6B86'), roughness: 0.8 }), hqWall])
  upper.position.set(hcx, 2.75 + 0.85, F - 0.06)
  scene.add(upper)
  scene.add(flat(box(hqW, 0.1, F - back, hqWall, [hcx, 2.5, (F + back) / 2])))
  scene.add(box(hqW + 0.1, 0.32, 0.18, mat(C.navy, { roughness: 0.45 }), [hcx, 2.6, F - 0.04]))
  scene.add(picture(emblem, 0.26, 0.26, [hq.x1 - 0.45, 2.6, F + 0.055]))
  scene.add(box(0.1, 2.45, 0.1, mat(C.navy, { roughness: 0.45 }), [hq.x1, 1.225, F - 0.05]))
  /* the right wall, with an opening onto the alley on the walking line */
  const d0 = P11.P + 0.34
  const d1 = P11.P - 0.34
  scene.add(flat(box(0.08, 2.5, d1 - back, hqWall, [hq.x1 + 0.03, 1.25, (d1 + back) / 2])))
  scene.add(flat(box(0.08, 0.5, d0 - d1, hqWall, [hq.x1 + 0.03, 2.25, P11.P])))
  /* the desk */
  const [dx, , dz] = P11.desk
  const wood = mat('#B98A5C', { roughness: 0.7 })
  scene.add(box(0.8, 0.73, 0.42, wood, [dx, 0.365, dz], 0.015))
  scene.add(box(0.86, 0.04, 0.48, mat('#F4EDE2', { roughness: 0.5 }), [dx, 0.75, dz], 0.01))
  scene.add(box(0.6, 0.28, 0.02, mat(C.navy, { roughness: 0.5 }), [dx, 0.45, dz + 0.22]))
  scene.add(picture(emblem, 0.2, 0.2, [dx, 0.45, dz + 0.232]))
  /* the card printer */
  const [px, py, pz] = P11.printer
  scene.add(box(0.24, 0.12, 0.2, mat('#3A4560', { roughness: 0.4, metalness: 0.3 }), [px, py + 0.02, pz], 0.02))
  scene.add(box(0.15, 0.012, 0.03, mat('#1A2235'), [px, py + 0.05, pz + 0.1]))
  const printLamp = glowM(C.green, '#6E7A92')
  scene.add(flat(cyl(0.012, 0.012, 0.02, printLamp, [px + 0.08, py + 0.06, pz + 0.1]).rotateX(Math.PI / 2)))

  /* the card */
  const cardTex = idCardTex(C.brand)
  const card = picture(cardTex, 0.16, 0.103, [0, 0, 0], { side: THREE.DoubleSide })
  card.renderOrder = 6
  scene.add(card)

  /* people */
  const iCfg = who(CAST_PRESETS.riya, { name: 'HR Officer', skinTone: 'medium', hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#F5F1FF', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true, glasses: 'round' } })
  const eCfg = who(CAST_PRESETS.dev, { name: 'Employee', skinTone: 'wheatish', hair: { style: 'sidePart', color: 'black' }, outfit: { top: 'shirtTie', topColor: '#DCE8FA', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#2A2A30', accentColor: '#2D63FB' }, accessories: { glasses: 'none', watch: true } })
  const gaCfg = who(CAST_PRESETS.rohan, { name: 'Guard A', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: '#43557F', bottom: 'trousers', bottomColor: '#26304D', shoeColor: '#1E1E24' }, accessories: { beard: 'stubble', watch: false } })
  const gbCfg = who(CAST_PRESETS.ananya, { name: 'Guard B', skinTone: 'fair', hair: { style: 'bun', color: 'darkBrown' }, outfit: { top: 'shirt', topColor: '#43557F', bottom: 'trousers', bottomColor: '#26304D', shoeColor: '#1E1E24' } })
  const shI = buildSkin(iCfg).shoulderHalf
  const shE = buildSkin(eCfg).shoulderHalf
  const issuerGive = ik('R', shI, rigTarget(P11.hand, P11.issuer, P11.hI, CAM11), true)
  const issuerPrinter = ik('R', shI, rigTarget([px, py + 0.1, pz + 0.12], P11.issuer, P11.hI, CAM11), true)
  const issuerArm = (c: number): Arm => {
    let a: Arm = mixArm({ s: 10, e: 18 }, issuerPrinter, Math.max(hold(c, -0.2, 0, 0.35, 0.5), seg(c, 7.6, 7.9)))
    a = mixArm(a, issuerGive, hold(c, T11.give[0], T11.give[1], T11.give[3], T11.give[3] + 0.25))
    return a
  }
  const issuer = person({
    config: iCfg,
    dress: withNeck(LANYARD(C.brand, C.brand)),
    seed: 111,
    faces: [[0, 'thinking'], [0.5, 'happy'], [1.6, 'neutral'], [7.3, 'happy']],
    pose: (p, c) => {
      const a = issuerArm(c)
      p.shoulderR = a.s
      p.elbowR = a.e
      p.shoulderL = 10
      p.elbowL = 16
      const toE = Math.max(hold(c, 0.3, 0.5, 1.5, 1.8), hold(c, 7.1, 7.4, L11, L11 + 1))
      to(p, 'headTurn', 0.4, toE)
      to(p, 'lookX', 0.85, toE)
      const pr = Math.max(hold(c, -0.1, 0, 0.3, 0.5), hold(c, 7.6, 7.8, L11, L11 + 1))
      to(p, 'headNod', 0.3, pr * (1 - toE))
      to(p, 'lookY', 0.7, pr * (1 - toE))
    },
    loop: L11,
    height: P11.hI,
    frames: F11,
    redraw,
    holdT: devHold(HOLD11),
  })
  issuer.object.position.set(...P11.issuer)
  const wp = walkerPose11(shE)
  const emp = person({ config: eCfg, dress: withNeck(LANYARD('#5E6B86', '#9CC2FF')), seed: 112, faces: WALKER11_FACES, pose: wp.pose, loop: L11, height: P11.hW, frames: F11, redraw, holdT: devHold(HOLD11) })
  const guardDress = (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{GUARD_CAP('#2A3550', '#141B2E')}</>, top: <>{k.top}{GUARD_UNIFORM('#141B2E')}</> })
  const gA = person({ config: gaCfg, dress: guardDress, seed: 113, faces: GUARD_FACES(T11.glanceA[0], T11.waveA[0], 3.6), pose: guardPose11(T11.glanceA, T11.waveA, [1.6, 3.3]), loop: L11, height: P11.hG, frames: F11, redraw, holdT: devHold(HOLD11) })
  const gB = person({ config: gbCfg, dress: guardDress, seed: 114, faces: GUARD_FACES(T11.glanceB[0], T11.waveB[0], 5.4), pose: guardPose11(T11.glanceB, T11.waveB, [3.2, 5.1]), loop: L11, height: 1.62, frames: F11, redraw, holdT: devHold(HOLD11) })
  gA.object.position.set(...P11.gA)
  gB.object.position.set(...P11.gB)
  scene.add(issuer.object, emp.object, gA.object, gB.object)

  const eRoot = new THREE.Vector3()
  const hI = new THREE.Vector3()
  const hL = new THREE.Vector3()
  const hR = new THREE.Vector3()
  const iRoot = new THREE.Vector3(...P11.issuer)
  const slot = new THREE.Vector3(px, py + 0.07, pz + 0.12)
  return (t: number) => {
    const c = mod(t, L11)
    const cq = frameT(c, L11, F11)
    const at = at11(c)
    eRoot.set(at.x, bob(at.walking, c), P11.P)
    emp.object.position.copy(eRoot)
    issuer.update(c, camera)
    emp.update(c, camera)
    gA.update(c, camera)
    gB.update(c, camera)
    setDoors11(c, A, B)
    printLamp.emissiveIntensity = 2 * hold(c, 7.85, 7.95, 0.25, 0.35) + 2 * hold(c, -0.1, 0, 0.25, 0.35)
    /* the card: out of the printer, the officer's hand, his left hand, his right hand; put away inside branch B */
    const atq = at11(cq)
    const rootQ = new THREE.Vector3(atq.x, bob(atq.walking, cq), P11.P)
    handWorld('R', shI, issuerArm(cq), P11.hI, iRoot, camera, hI)
    handWorld('L', shE, wp.arms.L(cq), P11.hW, rootQ, camera, hL)
    handWorld('R', shE, wp.arms.R(cq), P11.hW, rootQ, camera, hR)
    const out = seg(c, T11.print[0] + 0.05, T11.print[1] - 0.1)
    const toIssuer = seg(c, 0.3, 0.5)
    const toL = seg(c, T11.give[1], T11.give[2] + 0.05)
    const toR = seg(c, T11.swap[0], T11.swap[1])
    card.visible = c < 5.45 || c > 7.9
    if (c > 7.9) {
      card.position.copy(slot)
      ;(card.material as THREE.MeshBasicMaterial).opacity = seg(c, 7.9, 8.0)
    } else {
      ;(card.material as THREE.MeshBasicMaterial).opacity = 1
      card.position.copy(slot)
      card.position.y += 0.04 * out
      card.position.lerp(hI, toIssuer)
      if (toL > 0) card.position.lerp(hL, toL)
      if (toR > 0) card.position.lerp(hR, toR)
    }
    card.quaternion.copy(camera.quaternion)
    card.rotateZ(c < T11.swap[1] ? 0.25 : -0.2)
  }
}

/* ------------------------------------------------------------------ T11 concept: the identity provider and its apps */

function setupT11Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#D8E8FF')
  camera.fov = 40
  camera.position.set(...CAM11)
  camera.lookAt(-0.1, 1.36, -0.5)
  camera.updateProjectionMatrix()
  lights(scene, [0, 1.0, -0.4])
  const { A, B } = street11(scene, {
    pave: ['#EEF4FF', '#D3DFF4'],
    sky: '#D8E8FF',
    skyline: '#C2D5F2',
    wall: ['#FFFFFF', '#FFFFFF'],
    band: [C.brand, C.teal],
    front: [appFrontTex('chart', C.brand), appFrontTex('docs', C.teal)],
    emblem: [null, null],
  })
  /* clouds over the deck */
  const cloudM = mat('#FFFFFF', { roughness: 0.9, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.35 })
  for (const [x, y, s] of [[-1.2, 3.0, 1], [1.4, 3.25, 0.8], [0.2, 3.5, 0.6]] as const) {
    const g = new THREE.Group()
    for (const [dx, dy, r] of [[0, 0, 0.26], [0.26, -0.04, 0.2], [-0.26, -0.05, 0.19], [0.1, 0.12, 0.2]] as const) g.add(flat(mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, [dx, dy, 0])))
    g.position.set(x, y, -2.6)
    g.scale.setScalar(s)
    scene.add(g)
  }

  /* the identity provider: a tall tower with its shield-and-key emblem, and the issuing kiosk where the desk was */
  const { hq, F, back } = P11
  const hcx = (hq.x0 + hq.x1) / 2
  const tx = hq.x1 - 0.75
  const towerM = mat('#3F6BEA', { roughness: 0.3, metalness: 0.15, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.12 })
  scene.add(box(1.2, 3.9, 0.8, towerM, [tx, 1.95, back - 0.3], 0.06))
  for (let i = 0; i < 7; i++) scene.add(flat(box(1.22, 0.025, 0.82, mat('#BFD3FF', { roughness: 0.4 }), [tx, 0.45 + i * 0.5, back - 0.3])))
  const shield = shieldTex()
  scene.add(picture(shield, 0.5, 0.5, [tx, 2.35, back + 0.105]))
  const ring = halo('rgba(255,255,255,0.9)', 1.0)
  ring.position.set(tx, 2.35, back + 0.11)
  scene.add(ring)
  const deck = flat(mesh(new THREE.PlaneGeometry(hq.x1 - hq.x0, F - back), mat('#ffffff', { map: tileTex('#F5F8FF', '#DCE6F7', 2, [4, 3]), roughness: 0.4 }), [hcx, 0.003, (F + back) / 2]))
  deck.rotation.x = -Math.PI / 2
  scene.add(deck)
  /* the kiosk: a white pedestal with a lit slot (the issuer), its scan lamp */
  const [dx, , dz] = P11.desk
  scene.add(box(0.62, 0.76, 0.42, mat('#FFFFFF', { roughness: 0.35 }), [dx + 0.05, 0.38, dz], 0.04))
  scene.add(box(0.5, 0.04, 0.3, mat(C.brand, { roughness: 0.3, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.4 }), [dx + 0.05, 0.77, dz], 0.015))
  const slotM = glowM('#7FB0FF', '#2A3550', { emissiveIntensity: 0.6 })
  const [px, py, pz] = P11.printer
  scene.add(flat(box(0.18, 0.02, 0.06, slotM, [px, py + 0.0, pz + 0.04])))
  /* the scan: a ring of light that passes down over the user (he is verified before the token issues) */
  const scanM = new THREE.MeshBasicMaterial({ color: '#7FB0FF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  const scan = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 40), scanM)
  scan.rotation.x = Math.PI / 2
  scene.add(scan)
  /* the beam from the tower to the kiosk while it issues */
  const beamM = new THREE.MeshBasicMaterial({ color: '#9CC2FF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 10), beamM)
  scene.add(beam)
  const beamA = new THREE.Vector3(tx, 2.1, back + 0.2)
  const beamB = new THREE.Vector3(px, py + 0.05, pz)
  beam.position.copy(beamA).add(beamB).multiplyScalar(0.5)
  beam.scale.y = beamA.distanceTo(beamB)
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamB.clone().sub(beamA).normalize())

  /* the verifier posts, where the guards stand: a pedestal with an eye that turns to the token and scans it */
  const post = (pos: THREE.Vector3Tuple) => {
    const g = new THREE.Group()
    g.position.set(...pos)
    g.add(cyl(0.13, 0.15, 0.04, mat(C.navy, { roughness: 0.4 }), [0, 0.02, 0], 32))
    g.add(cyl(0.045, 0.055, 1.0, mat('#FFFFFF', { roughness: 0.35 }), [0, 0.52, 0], 24))
    const head = new THREE.Group()
    head.position.set(0, 1.1, 0)
    head.add(box(0.28, 0.2, 0.16, mat(C.navy, { roughness: 0.3, metalness: 0.3 }), [0, 0, 0], 0.05))
    const eyeM = glowM('#7FD8FF', '#BFE9FF', { emissiveIntensity: 0.8 })
    const eye = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 28), eyeM, [0, 0, 0.08])
    eye.rotation.x = Math.PI / 2
    head.add(eye)
    g.add(head)
    const coneM = new THREE.MeshBasicMaterial({ color: '#7FD8FF', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 24, 1, true), coneM)
    scene.add(g, cone)
    return { g, head, eyeM, cone, coneM }
  }
  const vA = post(P11.gA)
  const vB = post(P11.gB)
  /* chevrons on the floor from the user to each entrance, lit in turn (the "this way" wave) */
  const chev = chevronTex()
  const chevrons = (x0: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshBasicMaterial({ map: chev, color: C.green, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
      m.rotation.x = -Math.PI / 2
      m.position.set(x0 + i * 0.13, 0.006, P11.P + 0.3)
      scene.add(m)
      return m
    })
  const chA = chevrons(P11.xA + 0.04, 3)
  const chB = chevrons(P11.xB + 0.04, 2)

  /* the signed token */
  const token = picture(tokenTex(), 0.17, 0.115, [0, 0, 0], { side: THREE.DoubleSide })
  token.renderOrder = 6
  scene.add(token)
  const tokenGlow = halo('rgba(255,138,61,0.8)', 0.36)
  scene.add(tokenGlow)

  /* the user: a young man with his laptop bag */
  const uCfg = who(CAST_PRESETS.arjun, { name: 'User', skinTone: 'fair', hair: { style: 'buzz', color: 'brown' }, outfit: { top: 'tshirt', topColor: '#5856DC', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#F2F2F5' }, accessories: { belt: false, beard: 'stubble' } })
  const shU = buildSkin(uCfg).shoulderHalf
  const wp = walkerPose11(shU)
  const user = person({ config: uCfg, dress: withNeck(LAPTOP_BAG), seed: 115, faces: WALKER11_FACES, pose: wp.pose, loop: L11, height: P11.hW, frames: F11, redraw, holdT: devHold(HOLD11) })
  scene.add(user.object)

  const eRoot = new THREE.Vector3()
  const hL = new THREE.Vector3()
  const hR = new THREE.Vector3()
  const slot = new THREE.Vector3(px, py + 0.06, pz + 0.06)
  const lift = new THREE.Vector3(px - 0.05, py + 0.3, pz + 0.05)
  const aim = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L11)
    const cq = frameT(c, L11, F11)
    const at = at11(c)
    eRoot.set(at.x, bob(at.walking, c), P11.P)
    user.object.position.copy(eRoot)
    user.update(c, camera)
    setDoors11(c, A, B)
    /* verified, then issued */
    const sc = hold(c, -0.05, 0.02, 0.38, 0.45) + hold(c, 7.95, 8.0, 8.4, 8.5)
    const sk = c > 7.9 ? (c - 7.95) / 0.45 : (c + 0.05) / 0.45
    scanM.opacity = 0.85 * sc
    scan.position.set(at.x, lerp(1.75, 0.15, clamp01(sk)), P11.P)
    beamM.opacity = 0.55 * hold(c, 0.05, 0.15, 0.55, 0.75)
    slotM.emissiveIntensity = 0.6 + 1.6 * hold(c, 0.05, 0.15, 0.55, 0.75)
    ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(c * TAU * 0.5) + 0.4 * hold(c, 0.05, 0.15, 0.55, 0.75)
    /* the token: out of the slot, up, across to his left hand, to his right; put away inside app B */
    const atq = at11(cq)
    const rootQ = new THREE.Vector3(atq.x, bob(atq.walking, cq), P11.P)
    handWorld('L', shU, wp.arms.L(cq), P11.hW, rootQ, camera, hL)
    handWorld('R', shU, wp.arms.R(cq), P11.hW, rootQ, camera, hR)
    token.visible = c < 5.45 || c > 7.9
    if (c > 7.9) {
      token.position.copy(slot)
      ;(token.material as THREE.MeshBasicMaterial).opacity = seg(c, 7.9, 8.0)
    } else {
      ;(token.material as THREE.MeshBasicMaterial).opacity = 1
      const up = seg(c, 0.15, 0.55)
      const toL = seg(c, T11.give[0] + 0.1, T11.give[2] + 0.05)
      const toR = seg(c, T11.swap[0], T11.swap[1])
      token.position.copy(slot).lerp(lift, up)
      if (toL > 0) {
        token.position.lerp(hL, toL)
        token.position.y += Math.sin(toL * Math.PI) * 0.12
      }
      if (toR > 0) token.position.lerp(hR, toR)
    }
    token.quaternion.copy(camera.quaternion)
    token.rotateZ(c < T11.swap[1] ? 0.2 : -0.2)
    tokenGlow.position.copy(token.position).add(new THREE.Vector3(0, 0, -0.01))
    tokenGlow.quaternion.copy(camera.quaternion)
    ;(tokenGlow.material as THREE.MeshBasicMaterial).opacity = token.visible ? (0.55 + 0.25 * Math.sin(c * TAU * 1.1)) * (token.material as THREE.MeshBasicMaterial).opacity : 0
    /* the posts: turn to the user as he comes, scan the token, go green; then the chevrons lead to the entrance */
    for (const [v, glance, wave, watch, ch] of [[vA, T11.glanceA, T11.waveA, [1.6, 3.3], chA], [vB, T11.glanceB, T11.waveB, [3.2, 5.1], chB]] as const) {
      const look = hold(c, watch[0], watch[0] + 0.25, watch[1], watch[1] + 0.3)
      v.head.rotation.y = -0.75 * look + 0.08 * Math.sin(c * TAU * 0.3)
      const gl = hold(c, glance[0], glance[1], glance[2], glance[3])
      v.head.rotation.x = 0.25 * gl
      const ok = hold(c, glance[2], glance[3], wave[2], wave[3])
      v.eyeM.color.set('#BFE9FF').lerp(new THREE.Color('#B7F0C8'), ok)
      v.eyeM.emissive.set('#7FD8FF').lerp(new THREE.Color(C.green), ok)
      v.eyeM.emissiveIntensity = 0.8 + 0.8 * ok
      /* the scan cone, from the eye to the token */
      v.g.updateMatrixWorld()
      v.head.getWorldPosition(aim)
      const dir = hR.clone().sub(aim)
      const len = dir.length()
      v.cone.position.copy(aim).addScaledVector(dir, 0.5)
      v.cone.scale.set(1, len / 0.55, 1)
      v.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize())
      v.coneM.opacity = 0.35 * gl
      const w = hold(c, wave[0], wave[1], wave[2], wave[3])
      ch.forEach((m, i) => {
        const ph = mod((c - wave[1]) * 2.2 - i * 0.33, 1)
        ;(m.material as THREE.MeshBasicMaterial).opacity = w * (0.35 + 0.65 * (ph < 0.5 ? 1 - ph * 2 : 0))
      })
    }
  }
}
/** an app's facade: white with its glyph tile large on the front */
function appFrontTex(kind: 'chart' | 'docs', bg: string) {
  const glyph = appTex(kind, bg).image as HTMLCanvasElement
  return canvasTex(200, 240, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 200, 240)
    g.drawImage(glyph, 50, 30, 100, 100)
    for (let i = 0; i < 3; i++) rr(g, 40 + i * 44, 160, 32, 52, 6, '#E3ECFB')
    rr(g, 10, 222, 180, 6, 3, bg)
  })
}
/** the identity provider's emblem: a shield with a key (no words) */
function shieldTex() {
  return canvasTex(100, 100, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(50, 50, 48, 0, TAU)
    g.fill()
    g.fillStyle = C.brand
    g.beginPath()
    g.moveTo(50, 14)
    g.lineTo(80, 26)
    g.quadraticCurveTo(80, 70, 50, 88)
    g.quadraticCurveTo(20, 70, 20, 26)
    g.closePath()
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.fillStyle = '#FFFFFF'
    g.lineWidth = 5
    g.beginPath()
    g.arc(50, 40, 9, 0, TAU)
    g.stroke()
    g.fillRect(47.5, 48, 5, 26)
    g.fillRect(47.5, 62, 12, 5)
    g.fillRect(47.5, 70, 9, 4)
  })
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T09Everyday: card(setupT09Everyday, devHold(HOLD09)),
  I_T09Concept: card(setupT09Concept, devHold(HOLD09)),
  I_T11Everyday: card(setupT11Everyday, devHold(HOLD11)),
  I_T11Concept: card(setupT11Concept, devHold(HOLD11)),
}
export const css = ''
