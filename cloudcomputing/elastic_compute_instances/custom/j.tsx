import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { colors } from '@/design/tokens'
import { ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, castSprite, type CharacterConfig, type Pose, type StageKit, type Timeline } from './three-stage'
import type { Skin } from '@/decks/figures/cast/skins/types'

/**
 * BUILDER J · SLIDES 30 AND 38, THE ANALOGIES REBUILT AS REAL-TIME 3D SCENES (user, 2026-11-10: standing correction
 * 13 / cloud course R10: three.js, perspective camera, Character Lab people (round 3), real environments, no text, loops that
 * perform the analogy's action, each visual centred in its card). Overrides builder G's isometric rooms by name.
 *
 * Slide 29 (round 4, 2026-11-10, the user's analogy replacing TR 15's workbench): "A suitcase with a fixed size cannot
 * fit more clothes than its capacity, however fast you pack — just as a model larger than the VRAM cannot load,
 * regardless of how fast the GPU is."
 *   Everyday: a bedroom. A traveller (Character Lab) tosses clothes from an ottoman into an open suitcase very fast;
 *   the pile rises over the rim, the lid presses down and cannot close, springs open, the top clothes spill; she is
 *   shocked, frustrated, shrugs, and gathers everything back. Forever.
 *   Concept: a GPU server tray. The card's fans spin fast and a speed gauge sits in the red; a model block, bigger
 *   than the card's VRAM bay, drops onto it, cannot fit, the bay flashes red and the model bounces back out. One small
 *   tag: VRAM.
 *
 * Slide 38 (TR 19): "A machine image is like a recipe card with every ingredient pre-measured — just as every instance
 * launched from it starts in the exact same state, with nothing improvised."
 *   Everyday: a kitchen. A chef reads the recipe card, the pre-measured bowls go into the mixing bowl one by one, and an
 *   identical cake comes out onto the next plate, three in a row, then the bowls refill.
 *   Concept: a data-centre floor. An AMI (the template mark, modelled) holds the OS, software and configuration layers;
 *   each cycle stamps an identical copy of the three layers into the next instance (EC2 chip mark, modelled).
 *
 * Build (the analogy layout's one track, the same press on both cards): 0 the place and its people; 1 the job / model /
 * bowls / layers appear; 2 the loop runs; 3 the consequence is marked (red overhang, red bay, matched results glow).
 * Held frames (`?still`, thumbnails, reduced motion) draw one frame at a phase that shows the outcome.
 *
 * Round 3 (user, 2026-11-10): the carpenter and the chef are Character Lab characters (`rigSprite`, below: the rig
 * pre-rendered into frames on a depth-tested plane, with their role props drawn in the rig's own frames), animated by
 * rig expressions, a shrug gesture and pose edits; every loop's pause between passes is 0.3 s or less.
 */

const W = 470
const H = 390

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
/** 0..1 progress of `t` through [a, b], eased */
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const woodTex = (base: string, seed: number, planks = 6, repeat?: [number, number]) =>
  canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 256, 256)
      const r = rng(seed)
      for (let k = 0; k < 90; k++) {
        g.strokeStyle = `rgba(90,55,20,${0.05 + r() * 0.08})`
        g.lineWidth = 1 + r() * 1.5
        const y = r() * 256
        g.beginPath()
        g.moveTo(0, y)
        g.bezierCurveTo(80, y + (r() - 0.5) * 10, 170, y + (r() - 0.5) * 10, 256, y + (r() - 0.5) * 6)
        g.stroke()
      }
      g.strokeStyle = 'rgba(70,40,15,0.35)'
      g.lineWidth = 2
      for (let p = 1; p < planks; p++) {
        const y = (p * 256) / planks
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(256, y)
        g.stroke()
      }
    },
    repeat,
  )

const tileTex = (base: string, line: string, n: number, repeat: [number, number], brick = false) =>
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
        g.stroke()
        for (let j = 0; j <= n; j++) {
          const off = brick && i % 2 ? s / 2 : 0
          g.beginPath()
          g.moveTo(j * s + off, i * s)
          g.lineTo(j * s + off, (i + 1) * s)
          g.stroke()
        }
      }
    },
    repeat,
  )

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** a room: floor, back wall and left wall, all receiving shadows */
function room(scene: THREE.Scene, o: { floor: THREE.Material; back: THREE.Material; side: THREE.Material; w?: number; d?: number; h?: number }) {
  const w = o.w ?? 8
  const d = o.d ?? 6
  const h = o.h ?? 3.4
  const floor = mesh(new THREE.PlaneGeometry(w, d), o.floor, [0, 0, 0])
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false
  const back = mesh(new THREE.PlaneGeometry(w, h), o.back, [0, h / 2, -d / 2])
  back.castShadow = false
  const side = mesh(new THREE.PlaneGeometry(d, h), o.side, [-w / 2, h / 2, 0])
  side.rotation.y = Math.PI / 2
  side.castShadow = false
  scene.add(floor, back, side)
}

/** the step-and-time bookkeeping every scene shares: when the loop started (held frames start at `hold`) */
function clock(hold: number) {
  let first = true
  let start = Infinity
  return (t: number, step: number) => {
    if (first) {
      first = false
      start = step >= 2 ? t - hold : Infinity
    }
    if (step < 2) start = Infinity
    else if (start === Infinity) start = t
    return step >= 2 ? t - start : -1
  }
}

/** a reveal 0..1 that eases in over 0.5 s from the moment `on` turns true (held: 1 at once) */
function reveal() {
  let since = -Infinity
  let first = true
  return (t: number, on: boolean) => {
    if (first) {
      first = false
      since = on ? -1e9 : Infinity
    }
    if (!on) {
      since = Infinity
      return 0
    }
    if (since === Infinity) since = t
    return sm((t - since) / 0.5)
  }
}

/** a stage with an optional single small tag above the visual (R10: at most one) */

/* ------------------------------------------------------------------ Character Lab people (round 3, 2026-11-10) */

/**
 * The shared `castSprite` (three-stage.tsx) with one addition this file needs: `dress`, the role props the Character
 * Lab does not have, drawn in the rig's own frames so they move with it (the engine Cast.tsx way: a head-local prop
 * over `hairFront`, a body-frame prop over `top`). Same contract otherwise: the rig loop is pre-rendered once into
 * `frames` images on a depth-tested, camera-facing plane (furniture in front hides it), cycled by loop time.
 */
type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; onReady?: () => void }): Sprite {
  /* adaptive since 2026-11-10 ("adapt to the screen size"): the shared castSprite builds the frames at the size the
     person is drawn at on this screen and rebuilds them when that changes; `dress` is its own option now */
  return castSprite(o)
}

/** an expression clip that crossfades from the previous one at `start` */
function face(name: string, start: number, prev?: string, prevStart = 0): Pick<Timeline, 'expression' | 'prevExpression'> {
  return { expression: castClip(name, start, false), prevExpression: prev ? castClip(prev, prevStart, false) : undefined }
}
/** blend a channel toward a value by weight w */
function to(p: Pose, ch: keyof Pose, v: number, w: number) {
  if (w > 0) (p as Record<string, number>)[ch] = lerp((p as Record<string, number>)[ch], v, clamp01(w))
}

/** The chef's tall cap, head-local (skull centre 0,0), and white apron (body frame), from the engine's Cast.tsx baker. */
const CHEF_CAP = (
  <g data-part="cap">
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
const CHEF: CharacterConfig = {
  ...CAST_PRESETS.dev,
  name: 'Chef',
  outfit: { ...CAST_PRESETS.dev.outfit, top: 'shirt', topColor: '#FFFFFF', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' },
  accessories: { watch: true },
}

function Card({ tag, children }: { tag?: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', width: W, height: H, display: 'grid', placeItems: 'center' }}>
      {children}
      {tag && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            color: colors.brand,
            background: 'rgba(255,255,255,0.92)',
            boxShadow: `inset 0 0 0 1.5px ${colors.brand}, 0 6px 14px -10px rgba(16,32,58,0.5)`,
          }}
        >
          {tag}
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ shared props */

const C = {
  wood: '#C99A62',
  woodLight: '#E2BF8E',
  woodDark: '#8B5E34',
  steel: '#8FA3BF',
  navy: '#22346E',
  rack: '#1F2E63',
  orange: '#ED7100',
  brand: colors.brand,
  red: '#E5484D',
  green: '#3DBB7A',
  white: '#FFFFFF',
  cream: '#FFF4E3',
}

/** a server rack against a wall, with blue LED rows */
function rackAt(scene: THREE.Scene, x: number, z: number, t: { leds: THREE.Mesh[] }) {
  const g = new THREE.Group()
  g.add(box(0.8, 2.2, 0.7, mat(C.rack, { roughness: 0.5, metalness: 0.3 }), [0, 1.1, 0], 0.03))
  for (let i = 0; i < 9; i++) {
    g.add(box(0.66, 0.16, 0.02, mat('#2B3D7A', { roughness: 0.4 }), [0, 0.3 + i * 0.21, 0.36]))
    const led = box(0.05, 0.03, 0.02, new THREE.MeshStandardMaterial({ color: '#7FB0FF', emissive: '#4C8DFF', emissiveIntensity: 1 }), [0.24, 0.3 + i * 0.21, 0.375])
    g.add(led)
    t.leds.push(led)
  }
  g.position.set(x, 0, z)
  scene.add(g)
  return g
}

/** the data-centre room used by both concept cards */
function dataCentre(scene: THREE.Scene) {
  const floorTex = tileTex('#DCE4F2', '#C3CFE6', 4, [5, 4])
  const wallTex = tileTex('#EEF2FA', '#E2E8F4', 2, [3, 1.4])
  room(scene, { floor: mat('#FFFFFF', { map: floorTex, roughness: 0.75 }), back: mat('#FFFFFF', { map: wallTex, roughness: 0.9 }), side: mat('#E6ECF7', { roughness: 0.9 }) })
  const leds: THREE.Mesh[] = []
  for (const x of [-2.6, -1.7, 1.7, 2.6]) rackAt(scene, x, -2.55, { leds })
  /* a cable tray along the back wall */
  scene.add(box(7.6, 0.06, 0.4, mat('#B9C6DE', { metalness: 0.4, roughness: 0.4 }), [0, 2.75, -2.6]))
  return leds
}

/* ================================================================== SLIDE 29 · EVERYDAY: PACKING A SUITCASE (round 4) */

/* Round 4 (user, 2026-11-10): "A suitcase with a fixed size cannot fit more clothes than its capacity, however fast you
   pack." A bedroom: a clothes pile on an ottoman, an open suitcase on the floor. The traveller (Character Lab) tosses
   the clothes in very fast, the pile in the case rises far above its rim, the lid comes down and cannot close, springs
   back open and the top clothes spill onto the floor; she is shocked, frustrated, then shrugs and gathers everything
   back onto the ottoman. The last garment lands at 5.94 s and the next toss starts at 0.1 s of the next loop (0.26 s). */
const P29 = 6.1
const HOLD29 = 3.3 // the held frame: the lid pressing down on the over-full pile, unable to close
const N_CLOTH = 9
const TH = 0.05 // one folded garment's thickness
const CLOTH = ['#3DBB7A', '#F2C14E', '#E5484D', '#3DBB7A', '#FFFFFF', '#8B5CF6', '#FF8A3D', '#0EA5E9', '#F472B6', '#22346E']
const TOSS0 = 0.1
const TOSS_DT = 0.3 // a garment every 0.27 s: very fast packing
const FLIGHT = 0.34
const LID_OPEN = -1.95
const LID_STOP = -0.26 // pressed down onto the over-full pile: it stays this far open, the clothes bulging from the gap
const SPILL = 3 // the top three garments fall out

const TRAVELLER: CharacterConfig = {
  ...CAST_PRESETS.riya,
  name: 'Traveller',
  outfit: { ...CAST_PRESETS.riya.outfit, top: 'tshirt', topColor: '#FF8A3D', bottom: 'jeans', bottomColor: '#24324F' },
}

function garment(color: string): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.74, TH * 0.92, 0.48, mat(color, { roughness: 0.85 }), [0, 0, 0], 0.02))
  /* the fold: a slightly darker band across the front, and a collar line */
  const dark = new THREE.Color(color).multiplyScalar(0.82)
  g.add(box(0.74, 0.01, 0.07, mat(dark, { roughness: 0.9 }), [0, TH * 0.42, 0.12]))
  g.add(box(0.24, 0.008, 0.04, mat(dark, { roughness: 0.9 }), [0, TH * 0.46, -0.16]))
  return g
}

function setupPacking({ scene, camera, redraw }: StageKit) {
  camera.fov = 34
  camera.position.set(1.5, 2.85, 4.5)
  camera.lookAt(-0.3, 0.58, 0.0)
  lightRig(scene, [0, 0.8, 0])

  const floorTex = woodTex('#D9BC94', 9, 8, [3, 3])
  const wallTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#EAF0FB'
    g.fillRect(0, 0, 256, 256)
    const r = rng(5)
    for (let k = 0; k < 1500; k++) {
      g.fillStyle = `rgba(60,90,160,${r() * 0.05})`
      g.fillRect(r() * 256, r() * 256, 2, 2)
    }
  }, [2, 1])
  room(scene, { floor: mat('#FFFFFF', { map: floorTex, roughness: 0.8 }), back: mat('#FFFFFF', { map: wallTex }), side: mat('#DCE6F7', { roughness: 0.9 }) })

  /* the bedroom: a bed along the back wall and a round rug under the case */
  const bed = new THREE.Group()
  bed.add(box(2.0, 0.34, 1.4, mat('#B98A5A'), [0, 0.2, 0], 0.03))
  bed.add(box(1.94, 0.18, 1.34, mat('#FFFFFF', { roughness: 0.9 }), [0, 0.46, 0], 0.06))
  bed.add(box(1.96, 0.06, 0.9, mat('#9CB8F2', { roughness: 0.9 }), [0, 0.57, 0.22], 0.03))
  bed.add(box(0.6, 0.12, 0.34, mat('#FFFFFF', { roughness: 0.9 }), [-0.45, 0.62, -0.46], 0.05), box(0.6, 0.12, 0.34, mat('#FFFFFF', { roughness: 0.9 }), [0.45, 0.62, -0.46], 0.05))
  bed.add(box(2.06, 0.9, 0.08, mat('#8B5E34'), [0, 0.55, -0.72], 0.02))
  bed.position.set(0.9, 0, -2.2)
  scene.add(bed)
  const rug = mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.012, 48), mat('#C9D8F6', { roughness: 0.95 }), [0.45, 0.006, 0.45])
  rug.castShadow = false
  scene.add(rug)

  /* the ottoman the clothes start on */
  const otto = new THREE.Vector3(-1.45, 0, 0.45)
  scene.add(box(0.84, 0.4, 0.58, mat('#2C3C81', { roughness: 0.8 }), [otto.x, 0.2, otto.z], 0.06))
  const pileBase = 0.4 + TH / 2

  /* THE SUITCASE: a hard shell with a fixed size, the lid hinged at the back */
  const caseG = new THREE.Group()
  const CW = 0.98
  const CD = 0.66
  const CH = 0.26
  const shell = mat('#2D63FB', { roughness: 0.35, metalness: 0.15 })
  const lining = mat('#DCE6FA', { roughness: 0.9 })
  caseG.add(box(CW, 0.04, CD, shell, [0, 0.02, 0]))
  caseG.add(box(CW, CH, 0.035, shell, [0, CH / 2, -CD / 2 + 0.0175]), box(CW, CH, 0.035, shell, [0, CH / 2, CD / 2 - 0.0175]))
  caseG.add(box(0.035, CH, CD, shell, [-CW / 2 + 0.0175, CH / 2, 0]), box(0.035, CH, CD, shell, [CW / 2 - 0.0175, CH / 2, 0]))
  caseG.add(box(CW - 0.08, 0.01, CD - 0.08, lining, [0, 0.045, 0]))
  /* the rim that glows red once the pile is over capacity (step 3) */
  const rimMat = new THREE.MeshStandardMaterial({ color: C.red, emissive: C.red, emissiveIntensity: 0, transparent: true, opacity: 0 })
  for (const [w, d, x, z] of [[CW, 0.04, 0, -CD / 2], [CW, 0.04, 0, CD / 2], [0.04, CD, -CW / 2, 0], [0.04, CD, CW / 2, 0]] as const) {
    const r = box(w + 0.01, 0.02, d + 0.01, rimMat, [x, CH + 0.01, z])
    r.castShadow = false
    caseG.add(r)
  }
  const lid = new THREE.Group()
  lid.position.set(0, CH, -CD / 2)
  lid.add(box(CW, 0.05, CD, shell, [0, 0.025, CD / 2], 0.02))
  lid.add(box(CW - 0.08, 0.01, CD - 0.08, lining, [0, -0.002, CD / 2]))
  for (const x of [-0.3, 0, 0.3]) lid.add(box(0.03, 0.012, CD - 0.06, mat('#1F4ED8', { roughness: 0.4 }), [x, 0.055, CD / 2]))
  caseG.add(lid)
  /* the handle on the front, two latches */
  caseG.add(box(0.3, 0.04, 0.05, mat('#22346E'), [0, CH * 0.6, CD / 2 + 0.03], 0.015))
  for (const x of [-0.32, 0.32]) caseG.add(box(0.07, 0.05, 0.02, mat('#C7CEDB', { metalness: 0.8, roughness: 0.25 }), [x, CH - 0.04, CD / 2 + 0.01]))
  caseG.position.set(0.5, 0, 0.42)
  scene.add(caseG)
  const caseFloor = 0.05 + TH / 2

  /* THE CLOTHES: garment 0 lies on top of the pile and is packed first */
  const r = rng(29)
  const items = CLOTH.slice(0, N_CLOTH).map((c, i) => {
    const g = garment(c)
    scene.add(g)
    const jx = (r() - 0.5) * 0.05
    const jz = (r() - 0.5) * 0.04
    const ry = (r() - 0.5) * 0.18
    const pile = new THREE.Vector3(otto.x + jx, pileBase + (N_CLOTH - 1 - i) * TH, otto.z + jz)
    const inCase = new THREE.Vector3(caseG.position.x + jx * 1.4, caseFloor + i * TH, caseG.position.z + jz)
    const fallAt = i >= N_CLOTH - SPILL ? new THREE.Vector3(caseG.position.x + [0.7, -0.05, -0.8][i - (N_CLOTH - SPILL)], TH / 2 + 0.012, caseG.position.z + [0.5, 0.95, 0.62][i - (N_CLOTH - SPILL)]) : null
    return { g, pile, inCase, fallAt, ry, fallRy: (r() - 0.5) * 1.6 }
  })
  const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, hgt: number) => {
    const p = a.clone().lerp(b, k)
    p.y += Math.sin(Math.PI * k) * hgt
    return p
  }

  /* THE TRAVELLER: stands behind the case and the ottoman and tosses the clothes across in front of her */
  const work = (p: Pose, t: number) => {
    const pack = seg(t, 0.05, 0.25) * (1 - seg(t, TOSS0 + (N_CLOTH - 1) * TOSS_DT + 0.15, TOSS0 + (N_CLOTH - 1) * TOSS_DT + 0.45))
    const sw = 0.5 + 0.5 * Math.sin(((t - TOSS0) / TOSS_DT) * Math.PI)
    to(p, 'shoulderL', 52, pack * sw)
    to(p, 'shoulderR', 52, pack * (1 - sw))
    to(p, 'elbowL', -70, pack)
    to(p, 'elbowR', -70, pack)
    p.lean += pack * (sw - 0.5) * 8
    p.headTurn += pack * (sw - 0.5) * 0.35
    p.lookY = 0.55 * pack
    /* hurried: brows in, mouth set */
    to(p, 'browInnerL', -0.35, pack)
    to(p, 'browInnerR', -0.35, pack)
    to(p, 'squint', 0.35, pack)
    to(p, 'mouthWide', 0.35, pack)
    /* she presses the lid down: both arms forward and low */
    const press = seg(t, 2.95, 3.15) * (1 - seg(t, 3.4, 3.65))
    to(p, 'shoulderL', 34, press)
    to(p, 'shoulderR', 34, press)
    to(p, 'elbowL', -20, press)
    to(p, 'elbowR', -20, press)
    to(p, 'bow', 0.3, press)
    /* she gathers the clothes back */
    const gather = seg(t, 4.95, 5.15) * (1 - seg(t, 5.8, 6.05))
    const gw = 0.5 + 0.5 * Math.sin((t - 4.95) * 14)
    to(p, 'shoulderL', 50, gather * gw)
    to(p, 'shoulderR', 50, gather * (1 - gw))
    to(p, 'elbowL', -60, gather)
    to(p, 'elbowR', -60, gather)
    p.lookY = Math.max(p.lookY, 0.6 * (press + gather))
  }
  const traveller = rigSprite({
    config: TRAVELLER,
    loop: P29,
    frames: 66,
    height: 1.66,
    onReady: redraw,
    timeline: (t) => ({
      seed: 29,
      idle: CAST_IDLE,
      ...(t < 2.95
        ? face('neutral', 0, 'sad', 5.2 - P29)
        : t < 3.6
          ? face('shocked', 2.95, 'neutral', 0)
          : t < 4.3
            ? face('angry', 3.6, 'shocked', 2.95)
            : t < 5.2
              ? face('confused', 4.3, 'angry', 3.6)
              : face('sad', 5.2, 'confused', 4.3)),
      gesture: t >= 4.3 && t < 5.5 ? castClip('shrug', 4.3) : undefined,
    }),
    pose: work,
  })
  const wait = rigSprite({
    config: TRAVELLER,
    loop: 3,
    frames: 20,
    height: 1.66,
    onReady: redraw,
    timeline: () => ({ seed: 30, idle: CAST_IDLE, expression: castClip('neutral', 0, false) }),
    pose: (p) => {
      p.lookY = 0.4
    },
  })
  for (const c of [traveller, wait]) {
    c.object.position.set(-0.45, 0, -0.42)
    scene.add(c.object)
  }

  const loop = clock(HOLD29)
  const show = reveal()
  return (t: number, step: number) => {
    const k = show(t, step >= 1)
    const lt = loop(t, step)
    const ph = lt < 0 ? 0 : lt % P29
    traveller.object.visible = lt >= 0
    wait.object.visible = lt < 0
    if (lt >= 0) traveller.update(ph, camera)
    else wait.update(t, camera)

    /* the lid: open, pressed down onto the pile (it stops on it), springs back open with a small bounce */
    let lidA = LID_OPEN
    if (lt >= 0) {
      const down = seg(ph, 2.95, 3.3)
      const up = seg(ph, 3.4, 3.75)
      lidA = lerp(LID_OPEN, LID_STOP, down * (1 - up))
      if (ph > 3.75 && ph < 4.2) lidA += Math.sin(((ph - 3.75) / 0.45) * Math.PI * 2) * 0.06 * (1 - (ph - 3.75) / 0.45)
    }
    lid.rotation.x = lidA
    const squash = lt >= 0 ? seg(ph, 3.05, 3.3) * (1 - seg(ph, 3.4, 3.6)) : 0

    items.forEach((it, i) => {
      it.g.visible = k > 0.01
      let p = it.pile.clone()
      let ry = it.ry
      let rx = 0
      if (lt >= 0) {
        const go = TOSS0 + i * TOSS_DT
        const back = 4.95 + (N_CLOTH - 1 - i) * 0.06
        const inCase = it.inCase.clone()
        /* pressed: the clothes above the rim are squeezed into a wedge under the tilted lid and bulge out at the front */
        const above = clamp01((caseFloor + i * TH - CH) / (N_CLOTH * TH + caseFloor - CH))
        const y0 = caseFloor + i * TH
        if (y0 > CH) inCase.y = lerp(y0, CH + (y0 - CH) * 0.4, squash)
        inCase.z += squash * above * 0.12
        if (ph < go) p = it.pile.clone()
        else if (ph < go + FLIGHT) {
          const f = (ph - go) / FLIGHT
          p = arc(it.pile, inCase, sm(f), 0.55)
          ry = it.ry + f * Math.PI * 2
          rx = Math.sin(f * Math.PI) * 0.5
        } else {
          p = inCase
          rx = -squash * (above > 0 ? 0.26 : 0)
        }
        /* the top garments spill out as the lid springs back */
        let from = p.clone()
        if (it.fallAt && ph >= 3.55) {
          const j = i - (N_CLOTH - SPILL)
          const f = seg(ph, 3.55 + j * 0.07, 4.05 + j * 0.07)
          p = arc(inCase, it.fallAt, f, 0.18)
          ry = lerp(it.ry, it.fallRy, f)
          rx = Math.sin(f * Math.PI) * 0.9
          from = p.clone()
        }
        /* gathered back onto the ottoman, top first */
        if (ph >= back) {
          const f = seg(ph, back, back + 0.4)
          p = arc(from, it.pile, f, 0.45)
          ry = lerp(ry, it.ry, f)
          rx = rx * (1 - f)
        }
      }
      it.g.position.copy(p)
      it.g.rotation.set(rx, ry, 0)
      it.g.scale.setScalar(0.7 + 0.3 * k)
    })

    /* step 3: the rim glows red while the case holds more than it can */
    const over = lt >= 0 && ph > TOSS0 + 4 * TOSS_DT && ph < 4.95 ? 1 : 0
    const red = step >= 3 ? over * (0.55 + 0.3 * Math.sin(t * 6)) : 0
    rimMat.opacity = red * 0.85
    rimMat.emissiveIntensity = red * 0.7
  }
}

/* ================================================================== SLIDE 29 · CONCEPT: THE GPU AND ITS VRAM (round 4: a speed gauge added) */

const HOLD_GPU = 1.3 // the held frame: the model has just hit the too-small bay, red

function setupGpu({ scene, camera }: StageKit) {
  camera.fov = 34
  camera.position.set(2.3, 2.5, 5.2)
  camera.lookAt(0.3, 1.0, -0.25)
  lightRig(scene, [0, 0.8, 0])
  const leds = dataCentre(scene)

  /* a server bench the card sits on */
  scene.add(box(3.0, 0.08, 1.5, mat('#C9D3E6', { metalness: 0.3, roughness: 0.4 }), [0, 0.62, -0.3], 0.03))
  for (const [x, z] of [[-1.4, -0.95], [1.4, -0.95], [-1.4, 0.35], [1.4, 0.35]]) scene.add(box(0.07, 0.62, 0.07, mat('#8FA3BF', { metalness: 0.5 }), [x, 0.31, z]))

  /* THE GPU CARD: board, shroud, two fast fans, bracket, gold contacts */
  const card = new THREE.Group()
  card.add(box(2.3, 0.06, 1.0, mat('#1E2C5C', { roughness: 0.45 }), [0, 0, 0], 0.01))
  card.add(box(1.25, 0.22, 0.92, mat('#2B3D7A', { roughness: 0.35, metalness: 0.3 }), [-0.5, 0.14, 0], 0.05))
  const fans: THREE.Group[] = []
  for (const fx of [-0.82, -0.2]) {
    const ring = mesh(new THREE.TorusGeometry(0.24, 0.025, 10, 36), mat('#3E57A8', { metalness: 0.4 }), [fx, 0.26, 0])
    ring.rotation.x = -Math.PI / 2
    card.add(ring)
    const fan = new THREE.Group()
    fan.position.set(fx, 0.265, 0)
    for (let b = 0; b < 7; b++) {
      const blade = box(0.2, 0.01, 0.07, mat('#AFC3EE', { metalness: 0.2 }), [0.11, 0, 0])
      blade.rotation.x = 0.4
      const arm = new THREE.Group()
      arm.rotation.y = (b / 7) * Math.PI * 2
      arm.add(blade)
      fan.add(arm)
    }
    fan.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), mat(C.brand, { metalness: 0.3 })))
    card.add(fan)
    fans.push(fan)
  }
  /* the GPU die between the fans and the VRAM bay */
  card.add(box(0.3, 0.04, 0.3, mat('#9AA7B8', { metalness: 0.7, roughness: 0.25 }), [0.3, 0.05, 0]))
  /* gold edge contacts */
  for (let i = 0; i < 14; i++) card.add(box(0.05, 0.02, 0.06, mat('#F2C14E', { metalness: 0.8, roughness: 0.3 }), [-0.9 + i * 0.12, -0.035, 0.53]))
  /* the bracket */
  card.add(box(0.04, 0.5, 0.9, mat('#9AA7B8', { metalness: 0.7, roughness: 0.3 }), [-1.17, 0.2, 0]))

  /* THE VRAM BAY: a fixed-size bay of memory chips with a glass wall around it */
  const bay = new THREE.Group()
  bay.position.set(0.82, 0.03, 0)
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) bay.add(box(0.17, 0.05, 0.2, mat('#3B4C86', { roughness: 0.4 }), [-0.12 + i * 0.24, 0.03, -0.26 + j * 0.26]))
  const bayW = 0.56
  const bayH = 0.42
  const bayD = 0.84
  const glassMat = new THREE.MeshStandardMaterial({ color: '#BFD6FF', transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.1, depthWrite: false })
  const glassBox = mesh(new THREE.BoxGeometry(bayW, bayH, bayD), glassMat, [0, bayH / 2 + 0.02, 0])
  glassBox.castShadow = false
  bay.add(glassBox)
  const edgeMat = new THREE.LineBasicMaterial({ color: C.brand })
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(bayW, bayH, bayD)), edgeMat)
  edges.position.set(0, bayH / 2 + 0.02, 0)
  bay.add(edges)
  card.add(bay)
  card.position.set(-0.05, 0.7, -0.3)
  scene.add(card)

  /* round 4: THE SPEED GAUGE beside the card, its needle held in the red: the GPU is fast, and it still cannot load
     the model (no text: ticks, zones and a bolt only) */
  const dialTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(128, 128, 126, 0, Math.PI * 2)
    g.fill()
    const a0 = (135 * Math.PI) / 180
    const sweep = (270 * Math.PI) / 180
    const zones: [number, number, string][] = [[0, 0.5, '#3DBB7A'], [0.5, 0.75, '#F2C14E'], [0.75, 1, '#E5484D']]
    g.lineWidth = 22
    for (const [f0, f1, c] of zones) {
      g.strokeStyle = c
      g.beginPath()
      g.arc(128, 128, 96, a0 + sweep * f0, a0 + sweep * f1)
      g.stroke()
    }
    g.strokeStyle = '#22346E'
    for (let i = 0; i <= 10; i++) {
      const a = a0 + (sweep * i) / 10
      g.lineWidth = i % 5 ? 3 : 6
      g.beginPath()
      g.moveTo(128 + Math.cos(a) * 70, 128 + Math.sin(a) * 70)
      g.lineTo(128 + Math.cos(a) * (i % 5 ? 80 : 84), 128 + Math.sin(a) * (i % 5 ? 80 : 84))
      g.stroke()
    }
    /* a bolt: speed */
    g.fillStyle = '#FF8A3D'
    g.beginPath()
    g.moveTo(136, 150)
    g.lineTo(116, 186)
    g.lineTo(130, 186)
    g.lineTo(122, 214)
    g.lineTo(146, 174)
    g.lineTo(132, 174)
    g.closePath()
    g.fill()
  })
  const gauge = new THREE.Group()
  gauge.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 48), mat('#22346E', { metalness: 0.4, roughness: 0.35 }), [0, 0, -0.04]))
  gauge.children[0].rotation.x = Math.PI / 2
  const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.32, 48), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.5 }))
  dialFace.position.z = 0.002
  gauge.add(dialFace)
  const needle = new THREE.Group()
  needle.position.z = 0.02
  needle.add(mesh(new THREE.BoxGeometry(0.03, 0.25, 0.012), mat('#E5484D', { emissive: '#E5484D', emissiveIntensity: 0.25 }), [0, 0.11, 0]))
  needle.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20), mat('#22346E', { metalness: 0.5 }), [0, 0, 0.005]))
  needle.children[1].rotation.x = Math.PI / 2
  gauge.add(needle)
  gauge.position.set(-1.05, 1.36, -0.88)
  scene.add(gauge)
  scene.add(box(0.07, 0.62, 0.07, mat('#8FA3BF', { metalness: 0.5 }), [-1.05, 0.97, -0.92]))
  camera.updateMatrixWorld()
  gauge.lookAt(camera.position)

  /* THE MODEL: a block of stacked network layers, larger than the bay */
  const model = new THREE.Group()
  const modelMat = mat('#8B5CF6', { roughness: 0.35, metalness: 0.1, emissive: '#5B2BD6', emissiveIntensity: 0.15 })
  const layers: THREE.Mesh[] = []
  for (let l = 0; l < 4; l++) {
    const slab = box(0.98, 0.14, 1.12, modelMat, [0, l * 0.19, 0], 0.04)
    model.add(slab)
    layers.push(slab)
    for (let n = 0; n < 4; n++) model.add(mesh(new THREE.SphereGeometry(0.04, 12, 12), mat('#FFFFFF', { emissive: '#E9DDFF', emissiveIntensity: 0.6 }), [-0.33 + n * 0.22, l * 0.19 + 0.08, 0.57]))
  }
  scene.add(model)

  const loop = clock(HOLD_GPU)
  const show = reveal()
  const bayTop = new THREE.Vector3(0.77, 0.7 + 0.03 + bayH + 0.06, -0.3)
  const hover = new THREE.Vector3(1.3, 1.85, 0.15)
  /* round 3: 0.1 s in, the drop; the bounce settles at 2.85 s; the loop is 3.05 s, a 0.3 s gap */
  const P = 3.05

  return (t: number, step: number) => {
    /* the fans always spin fast: a fast GPU */
    for (const f of fans) f.rotation.y = t * 14
    /* the needle sits in the red zone, trembling: running flat out */
    needle.rotation.z = -((104 + 5 * Math.sin(t * 9) + 2.5 * Math.sin(t * 23)) * Math.PI) / 180
    for (let i = 0; i < leds.length; i++) (leds[i].material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.5 * Math.max(0, Math.sin(t * 3 + i * 1.7))
    const k = show(t, step >= 1)
    model.visible = k > 0.01
    model.scale.setScalar(0.4 + 0.6 * k)
    const lt = loop(t, step)
    const ph = lt < 0 ? 0 : lt % P
    let flash = 0
    const pos = hover.clone()
    let squash = 0
    if (lt >= 0) {
      const down = seg(ph, 0.1, 1.1)
      const hit = ph >= 1.1 && ph < 1.7 ? 1 - (ph - 1.1) / 0.6 : 0
      const back = seg(ph, 1.4, 2.85)
      pos.lerpVectors(hover, bayTop, down * (1 - back))
      /* it cannot drop in: it stops on the bay's rim and bounces */
      pos.y += Math.sin(Math.min(1, back) * Math.PI) * 0.35
      squash = hit * 0.12
      flash = hit
    } else {
      pos.y += Math.sin(t * 1.6) * 0.05
    }
    model.position.copy(pos)
    model.scale.y = (0.4 + 0.6 * k) * (1 - squash)
    model.rotation.y = -0.35 + Math.sin(t * 0.8) * 0.05
    /* red at the moment it hits; from step 3 the bay stays marked as too small */
    const red = Math.max(flash, step >= 3 ? 0.35 + 0.15 * Math.sin(t * 5) : 0)
    edgeMat.color.set(red > 0.05 ? C.red : C.brand)
    glassMat.color.set(red > 0.05 ? '#FFC2C2' : '#BFD6FF')
    glassMat.opacity = 0.22 + red * 0.3
    modelMat.emissive.set(flash > 0.05 ? '#E5484D' : '#5B2BD6')
    modelMat.emissiveIntensity = 0.15 + flash * 0.6
  }
}

/* ================================================================== SLIDE 38 · EVERYDAY: THE KITCHEN */

/* round 3 (user, 2026-11-10: a very short pause between loops): three 3 s cycles, one identical cake each; the last
   cake lands at 8.95 s and the next loop starts at 9.0 s, the three finished cakes fading during its first 0.3 s while
   the chef reads the card again */
const P38 = 9
const HOLD38 = 8.97

function cake(): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 32), mat('#E8B36A', { roughness: 0.7 }), [0, 0.05, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.03, 32), mat('#FFF4E3', { roughness: 0.5 }), [0, 0.115, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 32), mat('#E8B36A', { roughness: 0.7 }), [0, 0.17, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.04, 32), mat('#FFFFFF', { roughness: 0.4 }), [0, 0.23, 0]))
  g.add(mesh(new THREE.SphereGeometry(0.035, 14, 14), mat('#D63B3B', { roughness: 0.3 }), [0, 0.27, 0]))
  return g
}

function setupKitchen({ scene, camera, redraw }: StageKit) {
  camera.fov = 34
  camera.position.set(1.5, 2.3, 4.2)
  camera.lookAt(-0.3, 1.0, -0.85)
  lightRig(scene, [0, 0.9, -0.5])

  const floorTex = tileTex('#F1ECE4', '#D9D0C2', 4, [4, 3])
  const splash = tileTex('#FFFFFF', '#DCE3EE', 6, [3, 1.2], true)
  room(scene, { floor: mat('#FFFFFF', { map: floorTex, roughness: 0.6 }), back: mat('#FFFFFF', { map: splash, roughness: 0.5 }), side: mat('#EAF0FA', { roughness: 0.9 }) })
  /* wall cabinets, a hood, a window */
  for (const x of [-2.4, -1.5, 1.6, 2.5]) scene.add(box(0.85, 0.7, 0.4, mat('#DCE6F7', { roughness: 0.6 }), [x, 2.5, -2.78], 0.02))
  scene.add(box(1.0, 0.5, 0.6, mat('#B9C6DE', { metalness: 0.5, roughness: 0.3 }), [0.05, 2.6, -2.7], 0.03))
  const glass = new THREE.MeshStandardMaterial({ color: '#CFE3FF', emissive: '#BFD8FF', emissiveIntensity: 0.35, roughness: 0.1 })
  const win = box(0.04, 0.9, 1.2, glass, [-3.97, 1.9, -1.2])
  win.castShadow = false
  scene.add(win)

  /* the counter along the back, with a stove */
  const counter = mat('#FFFFFF', { map: woodTex('#B98A5A', 9, 5), roughness: 0.6 })
  scene.add(box(4.6, 0.86, 0.75, mat('#E7EDF8', { roughness: 0.6 }), [0, 0.43, -1.9], 0.02))
  scene.add(box(4.7, 0.06, 0.82, mat('#F7F7F4', { roughness: 0.3 }), [0, 0.89, -1.88], 0.02))
  for (let i = 0; i < 5; i++) scene.add(box(0.86, 0.7, 0.02, mat('#D6E0F2'), [-1.84 + i * 0.92, 0.45, -1.51]))
  /* the island in front where the plates are */
  scene.add(box(2.6, 0.82, 0.8, mat('#E7EDF8', { roughness: 0.6 }), [0.45, 0.41, 0.35], 0.02))
  scene.add(box(2.7, 0.06, 0.88, counter, [0.45, 0.85, 0.35], 0.02))

  /* THE RECIPE CARD on a little stand, its rows drawn as coloured ingredient dots and lines (no words) */
  const cardTex = canvasTex(256, 320, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 256, 320)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, 256, 34)
    const dots = ['#F5F1E6', '#F2C14E', '#F7D774', '#D63B3B']
    dots.forEach((c, i) => {
      g.fillStyle = c
      g.strokeStyle = '#8FA3BF'
      g.lineWidth = 3
      g.beginPath()
      g.arc(36, 74 + i * 52, 14, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.fillStyle = '#C3CFE6'
      g.fillRect(64, 68 + i * 52, 150 - i * 12, 12)
    })
    g.fillStyle = '#E8B36A'
    g.fillRect(36, 282, 60, 20)
  })
  const recipe = new THREE.Group()
  recipe.add(box(0.5, 0.62, 0.02, mat('#FFFFFF', { map: cardTex, roughness: 0.7 }), [0, 0, 0]))
  recipe.add(box(0.06, 0.4, 0.06, mat('#8B5E34'), [0, -0.2, -0.08]))
  recipe.position.set(-1.6, 1.3, -1.85)
  recipe.rotation.set(-0.15, 0.35, 0)
  scene.add(recipe)

  /* THE PRE-MEASURED BOWLS and the mixing bowl */
  const bowlMat = mat('#FFFFFF', { roughness: 0.35 })
  const contents = ['#F5F1E6', '#F2C14E', '#F7D774', '#D63B3B']
  const bowls: { g: THREE.Group; fill: THREE.Mesh; pos: THREE.Vector3 }[] = []
  contents.forEach((c, i) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.09, 0.1, 28, 1, true), bowlMat))
    g.add(mesh(new THREE.CircleGeometry(0.09, 24), bowlMat, [0, -0.05, 0]).rotateX(-Math.PI / 2))
    const fill = mesh(new THREE.CylinderGeometry(0.125, 0.1, 0.06, 28), mat(c, { roughness: 0.8 }), [0, 0.0, 0])
    g.add(fill)
    const pos = new THREE.Vector3(-1.1 + i * 0.42, 0.98, -1.72)
    g.position.copy(pos)
    g.scale.setScalar(1.3)
    scene.add(g)
    bowls.push({ g, fill, pos })
  })
  const mix = new THREE.Group()
  const mixBowl = mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#C9D6EE', { metalness: 0.5, roughness: 0.25, side: THREE.DoubleSide }))
  mix.add(mixBowl)
  const batter = mesh(new THREE.CircleGeometry(0.26, 32), mat('#EED3A2', { roughness: 0.9 }), [0, -0.1, 0])
  batter.rotation.x = -Math.PI / 2
  mix.add(batter)
  const whisk = new THREE.Group()
  whisk.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), mat('#9AA7B8', { metalness: 0.7 }), [0, 0.12, 0]))
  whisk.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#9AA7B8', { metalness: 0.7, wireframe: true }), [0, -0.06, 0]))
  whisk.rotation.z = 0.35
  mix.add(whisk)
  mix.position.set(0.55, 1.22, -1.75)
  scene.add(mix)

  /* THREE PLATES on the island, the identical cakes land on them */
  const plates: THREE.Vector3[] = []
  const cakes: THREE.Group[] = []
  const glows: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Vector3(-0.35 + i * 0.75, 0.9, 0.35)
    plates.push(p)
    scene.add(mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.03, 32), mat('#FFFFFF', { roughness: 0.3 }), [p.x, p.y, p.z]))
    const glow = mesh(new THREE.TorusGeometry(0.27, 0.018, 8, 40), new THREE.MeshStandardMaterial({ color: C.brand, emissive: C.brand, emissiveIntensity: 0.8, transparent: true, opacity: 0 }), [p.x, p.y + 0.02, p.z])
    glow.rotation.x = -Math.PI / 2
    glow.castShadow = false
    scene.add(glow)
    glows.push(glow)
    const c = cake()
    scene.add(c)
    cakes.push(c)
  }
  /* the flying spoonful from a bowl to the mixing bowl */
  const blob = mesh(new THREE.SphereGeometry(0.06, 16, 16), mat('#F5F1E6'))
  scene.add(blob)

  /* THE CHEF behind the counter (round 3: a Character Lab character, user 2026-11-10): a white shirt, the baker's tall
     cap and apron. Every 3 s cycle is the same, so one 3 s sprite loop plays it: he reads the recipe card (thinking),
     works through the measured bowls, whisks, then presents the cake to the island with a grin. A quiet sprite waits
     before the loop starts. The counter in front hides him below the waist. */
  const CAP_SHORT = <g transform="translate(0 -50) scale(1 0.8) translate(0 50)">{CHEF_CAP}</g>
  const chefDress = (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{CAP_SHORT}</>, top: <>{k.top}{CHEF_APRON}</> })
  const chefCycle = rigSprite({
    config: CHEF,
    dress: chefDress,
    loop: 3,
    frames: 48,
    height: 1.74,
    onReady: redraw,
    timeline: (c) => ({
      seed: 31,
      idle: CAST_IDLE,
      ...(c < 0.5 ? face('thinking', 0, 'grin', 2.2 - 3) : c < 2.2 ? face('happy', 0.5, 'thinking', 0) : face('grin', 2.2, 'happy', 0.5)),
    }),
    pose: (p, c) => {
      /* reads the card on the counter to his right on screen-left */
      const read = seg(c, 0, 0.12) * (1 - seg(c, 0.42, 0.6))
      to(p, 'headTurn', -0.45, read)
      to(p, 'lookX', -0.85, read)
      to(p, 'lookY', 0.15, read)
      /* works the bowls: the screen-left arm reaches along them, sweeping as each pours */
      const pour = seg(c, 0.4, 0.6) * (1 - seg(c, 1.5, 1.7))
      to(p, 'shoulderL', 34 + 10 * Math.sin((c - 0.4) * Math.PI * 2.5), pour)
      to(p, 'elbowL', 72, pour)
      to(p, 'lookX', -0.4, pour)
      to(p, 'lookY', 0.45, pour)
      to(p, 'headNod', 0.18, pour)
      /* whisks in the mixing bowl with the screen-right arm */
      const whisk = seg(c, 1.6, 1.72) * (1 - seg(c, 2.1, 2.25))
      to(p, 'shoulderR', 26 + 4 * Math.sin(c * Math.PI * 8), whisk)
      to(p, 'elbowR', 92 + 14 * Math.sin(c * Math.PI * 8), whisk)
      to(p, 'lookX', 0.35, whisk)
      to(p, 'lookY', 0.5, whisk)
      to(p, 'headNod', 0.22, whisk)
      /* presents the finished cake toward the island */
      const show = seg(c, 2.2, 2.45) * (1 - seg(c, 2.7, 2.98))
      to(p, 'shoulderR', 62, show)
      to(p, 'elbowR', 28, show)
      to(p, 'headTurn', 0.3, show)
      to(p, 'lookX', 0.6, show)
    },
  })
  const chefWait = rigSprite({
    config: CHEF,
    dress: chefDress,
    loop: 3,
    frames: 24,
    height: 1.74,
    onReady: redraw,
    timeline: () => ({ seed: 32, idle: CAST_IDLE, expression: castClip('happy', 0, false) }),
  })
  for (const c of [chefCycle, chefWait]) {
    c.object.position.set(-0.25, 0, -2.45)
    scene.add(c.object)
  }

  const loop = clock(HOLD38)
  const show = reveal()

  return (t: number, step: number) => {
    const k = show(t, step >= 1)
    const lt = loop(t, step)
    const ph = lt < 0 ? -1 : lt % P38
    const cyc = ph < 0 ? -1 : Math.floor(ph / 3)
    const c = ph < 0 ? 0 : ph - cyc * 3
    chefCycle.object.visible = cyc >= 0
    chefWait.object.visible = cyc < 0
    if (cyc >= 0) chefCycle.update(c, camera)
    else chefWait.update(t, camera)
    /* bowls: shown from step 1; in a cycle each pours in turn (its fill empties), refill at the end of the loop */
    bowls.forEach((b, i) => {
      b.g.visible = k > 0.01
      b.g.scale.setScalar(1.3 * (0.6 + 0.4 * k))
      let full = 1
      let tilt = 0
      if (cyc >= 0 && cyc < 3) {
        /* each cake uses one pre-measured set: bowl i pours in turn, then is measured out again for the next cake */
        const a = 0.4 + i * 0.3
        const pour = seg(c, a, a + 0.25)
        tilt = Math.sin(Math.PI * clamp01((c - a) / 0.3)) * 0.9
        full = 1 - pour + pour * seg(c, 2.45, 2.9)
      }
      b.fill.scale.set(1, Math.max(0.02, full), 1)
      b.fill.visible = full > 0.03
      b.g.rotation.z = -tilt
    })
    /* the spoonful arcs from the pouring bowl into the mixing bowl */
    blob.visible = false
    if (cyc >= 0 && cyc < 3) {
      for (let i = 0; i < 4; i++) {
        const a = 0.4 + i * 0.3
        const f = (c - a) / 0.3
        if (f >= 0 && f <= 1) {
          blob.visible = true
          ;(blob.material as THREE.MeshStandardMaterial).color.set(contents[i])
          blob.position.lerpVectors(bowls[i].pos, mix.position, f)
          blob.position.y += Math.sin(Math.PI * f) * 0.35
        }
      }
    }
    mix.visible = k > 0.01
    whisk.rotation.y = cyc >= 0 && cyc < 3 && c > 1.6 && c < 2.2 ? t * 18 : whisk.rotation.y
    batter.scale.setScalar(cyc >= 0 && cyc < 3 ? 0.6 + 0.4 * seg(c, 0.5, 1.6) : 0.6)
    /* cakes: cake i rises from the mixing bowl and lands on plate i in cycle i; the last pass's three fade out in the
       first 0.3 s of the next loop while the chef reads the card */
    cakes.forEach((ck, i) => {
      let vis = false
      if (cyc >= 0) {
        let f = -1
        let fade = 1
        if (cyc > i || (cyc === i && c >= 2.2)) f = cyc === i ? seg(c, 2.2, 2.95) : 1
        else if (lt >= P38 && cyc === 0 && c < 0.3) {
          f = 1
          fade = 1 - seg(c, 0, 0.3)
        }
        if (f >= 0 && fade > 0.02) {
          vis = true
          ck.position.lerpVectors(mix.position, plates[i], f)
          ck.position.y = lerp(mix.position.y + 0.1, plates[i].y + 0.015, f) + Math.sin(Math.PI * f) * 0.4
          ck.scale.setScalar(Math.max(0.01, (0.5 + 0.5 * f) * fade))
        }
      }
      ck.visible = vis
      /* step 3: the matched cakes glow together */
      const gm = glows[i].material as THREE.MeshStandardMaterial
      gm.opacity = step >= 3 && vis ? 0.55 + 0.35 * Math.sin(t * 3) : 0
    })
  }
}

/* ================================================================== SLIDE 38 · CONCEPT: THE AMI AND ITS INSTANCES */

const LAYERS = ['#2D63FB', '#ED7100', '#3DBB7A'] // OS, software, configuration

/** the AMI mark modelled in 3D: an orange tile with a raised 3 x 3 grid (the official mark's motif) */
function amiMark(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.5, 0.06, 0.5, mat(C.orange, { roughness: 0.4 }), [0, 0, 0], 0.04))
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.add(box(0.11, 0.03, 0.11, mat('#FFFFFF', { roughness: 0.4 }), [-0.14 + i * 0.14, 0.04, -0.14 + j * 0.14]))
  return g
}
/** the EC2 instance mark modelled: an orange chip with pins */
function chipMark(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.26, 0.05, 0.26, mat(C.orange, { roughness: 0.4 }), [0, 0, 0], 0.03))
  for (let i = 0; i < 4; i++)
    for (const s of [-1, 1]) {
      g.add(box(0.03, 0.02, 0.07, mat('#FFFFFF'), [-0.09 + i * 0.06, 0, s * 0.17]))
      g.add(box(0.07, 0.02, 0.03, mat('#FFFFFF'), [s * 0.17, 0, -0.09 + i * 0.06]))
    }
  return g
}

function setupAmi({ scene, camera }: StageKit) {
  camera.fov = 34
  camera.position.set(1.5, 2.75, 5.7)
  camera.lookAt(-0.35, 0.72, -0.1)
  lightRig(scene, [0, 0.8, -0.3])
  const leds = dataCentre(scene)

  /* THE AMI on its pedestal, its three layers above the mark */
  const ped = new THREE.Group()
  ped.add(mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.7, 40), mat('#E3EAF7', { roughness: 0.4 }), [0, 0.35, 0]))
  const mark = amiMark()
  mark.position.set(0, 0.74, 0)
  ped.add(mark)
  const amiLayers: THREE.Mesh[] = LAYERS.map((c, i) => {
    const m = box(0.62, 0.1, 0.62, mat(c, { roughness: 0.35, emissive: c, emissiveIntensity: 0.15 }), [0, 0.92 + i * 0.14, 0], 0.03)
    ped.add(m)
    return m
  })
  ped.position.set(-1.75, 0, -0.45)
  scene.add(ped)

  /* THREE INSTANCES, each a server unit with the instance chip on its front and three empty layer slots on top */
  const inst: { g: THREE.Group; slots: THREE.Mesh[]; led: THREE.Mesh; glow: THREE.Mesh; base: THREE.Vector3 }[] = []
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group()
    g.add(box(0.7, 0.55, 0.7, mat('#F4F7FD', { roughness: 0.45 }), [0, 0.275, 0], 0.05))
    const chip = chipMark()
    chip.rotation.x = Math.PI / 2
    chip.position.set(0, 0.3, 0.36)
    g.add(chip)
    const led = box(0.08, 0.04, 0.02, new THREE.MeshStandardMaterial({ color: '#C3CFE6', emissive: '#000000' }), [0.24, 0.08, 0.36])
    g.add(led)
    const slots = LAYERS.map((c, l) => {
      const s = box(0.54, 0.09, 0.54, mat(c, { roughness: 0.35, emissive: c, emissiveIntensity: 0.15, transparent: true, opacity: 0 }), [0, 0.6 + l * 0.12, 0], 0.03)
      g.add(s)
      return s
    })
    const glow = mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 40), new THREE.MeshStandardMaterial({ color: C.brand, emissive: C.brand, emissiveIntensity: 0.8, transparent: true, opacity: 0 }), [0, 0.02, 0])
    glow.rotation.x = -Math.PI / 2
    glow.castShadow = false
    g.add(glow)
    const base = new THREE.Vector3(-0.4 + i * 0.85, 0, 0.75 - i * 0.5)
    g.position.copy(base)
    g.rotation.y = -0.35
    scene.add(g)
    inst.push({ g, slots, led, glow, base })
  }
  /* the copy that flies from the AMI to an instance */
  const flyer = new THREE.Group()
  const flyLayers = LAYERS.map((c, l) => {
    const m = box(0.54, 0.09, 0.54, mat(c, { roughness: 0.35, emissive: c, emissiveIntensity: 0.3 }), [0, l * 0.12, 0], 0.03)
    flyer.add(m)
    return m
  })
  scene.add(flyer)
  void flyLayers

  const loop = clock(HOLD38)
  const show = reveal()

  return (t: number, step: number) => {
    for (let i = 0; i < leds.length; i++) (leds[i].material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.5 * Math.max(0, Math.sin(t * 3 + i * 1.7))
    const k = show(t, step >= 1)
    amiLayers.forEach((m, i) => {
      m.visible = k > 0.01
      m.scale.setScalar(0.5 + 0.5 * k)
      m.position.y = 0.92 + i * 0.14 + Math.sin(t * 1.5 + i) * 0.015
    })
    mark.rotation.y = Math.sin(t * 0.6) * 0.15
    const lt = loop(t, step)
    const ph = lt < 0 ? -1 : lt % P38
    const cyc = ph < 0 ? -1 : Math.floor(ph / 3)
    const c = ph < 0 ? 0 : ph - cyc * 3
    flyer.visible = false
    inst.forEach((it, i) => {
      let filled = 0
      if (cyc >= 0) {
        if (cyc > i) filled = 1
        else if (cyc === i) filled = seg(c, 2.2, 2.5)
        /* the last pass's three copies fade in the first 0.3 s of the next loop (round 3: no long pause) */
        if (lt >= P38 && cyc === 0 && c < 0.3) filled = Math.max(filled, 1 - seg(c, 0, 0.3))
      }
      it.slots.forEach((s) => {
        const m = s.material as THREE.MeshStandardMaterial
        m.opacity = filled
        s.visible = filled > 0.02
      })
      const lm = it.led.material as THREE.MeshStandardMaterial
      lm.emissive.set(filled > 0.9 ? C.green : '#000000')
      lm.color.set(filled > 0.9 ? C.green : '#C3CFE6')
      lm.emissiveIntensity = filled > 0.9 ? 1 : 0
      /* a stamped instance settles with a small bounce */
      const bump = cyc === i ? Math.sin(Math.PI * seg(c, 2.2, 2.7)) * 0.05 : 0
      it.g.position.y = it.base.y - bump
      ;(it.glow.material as THREE.MeshStandardMaterial).opacity = step >= 3 && filled > 0.9 ? 0.5 + 0.35 * Math.sin(t * 3) : 0
      /* the copy of the three layers flies from the AMI to instance i during cycle i */
      if (cyc === i && c >= 0.6 && c < 2.25) {
        flyer.visible = true
        const f = seg(c, 0.6, 2.2)
        const from = new THREE.Vector3(ped.position.x, 0.92, ped.position.z)
        const to = new THREE.Vector3(it.base.x, 0.6, it.base.z)
        flyer.position.lerpVectors(from, to, f)
        flyer.position.y += Math.sin(Math.PI * f) * 0.9
        flyer.rotation.y = -0.35 * f
      }
    })
    /* the AMI pulses as each copy leaves */
    const pulse = cyc >= 0 && cyc < 3 ? Math.sin(Math.PI * clamp01((c - 0.3) / 0.5)) : 0
    amiLayers.forEach((m) => ((m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + pulse * 0.6))
  }
}

/* ================================================================== exports */

type Fig = { step?: number }
const T15Everyday = ({ step = 0 }: Fig) => (
  <Card>
    <ThreeStage w={W} h={H} step={step} setup={setupPacking} holdT={HOLD29} />
  </Card>
)
const T15Concept = ({ step = 0 }: Fig) => (
  <Card tag="VRAM">
    <ThreeStage w={W} h={H} step={step} setup={setupGpu} holdT={HOLD_GPU} />
  </Card>
)
const T19Everyday = ({ step = 0 }: Fig) => (
  <Card>
    <ThreeStage w={W} h={H} step={step} setup={setupKitchen} holdT={HOLD38} />
  </Card>
)
const T19Concept = ({ step = 0 }: Fig) => (
  <Card>
    <ThreeStage w={W} h={H} step={step} setup={setupAmi} holdT={HOLD38} />
  </Card>
)

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  G_T15Everyday: T15Everyday as (p: Record<string, unknown>) => ReactNode,
  G_T15Concept: T15Concept as (p: Record<string, unknown>) => ReactNode,
  G_T19Everyday: T19Everyday as (p: Record<string, unknown>) => ReactNode,
  G_T19Concept: T19Concept as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}
export const css = ''
