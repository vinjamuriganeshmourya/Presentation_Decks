import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
/* three is the engine's dependency: a bare 'three' does not resolve from a session folder (only react is
   deduped to the engine root), so it is reached through the engine's own `@` alias */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { At, Label, REDUCED, STILL, type LabelTone } from '@/decks/figures/scene'
import { ISO, shade, mix } from '@/decks/figures/iso/iso'
import { Character } from '@/decks/figures/cast/rig/Character'
import { poseAt, type Timeline } from '@/decks/figures/cast/rig/compose'
import { buildSkin, PRESETS, type CharacterConfig } from '@/decks/figures/cast/skins/config'
import { ACTIONS, EXPRESSIONS } from '@/decks/figures/cast/actions'
import type { Pose } from '@/decks/figures/cast/rig/channels'
import type { Skin } from '@/decks/figures/cast/skins/types'

/**
 * BUILDER G · S53 [T20-AN], THE EVERYDAY SIDE, REBUILT IN 3D (user, 2026-11-06).
 *
 * TR 20: "A neighbourhood shop stocks popular items so customers need not travel to a distant factory every
 * time, just as an edge location holds popular content and only the first request travels to the origin."
 *
 * A real three.js scene: one fixed perspective camera, a low warm sun with soft shadow maps, a sky/ground
 * hemisphere fill, fog thickening toward the factory. Everything is modelled from primitives with canvas
 * textures (plaster, pavers, asphalt, corrugated sheet, the awning's stripes). The people are the Character
 * Lab rig (clay look), drawn as DOM billboards at the screen point of their feet, sized by the camera's own
 * projection of a 1.7 m body, each with a contact shadow on the ground in the 3D scene.
 *
 * Mapping to the concept side (F_T20Concept, unchanged): customers (left) = users, the shop (centre, near)
 * = the edge location, the factory (top right, far) = the origin, the same places on both stages.
 *
 * Build (the layout's one track, the same presses as the concept): 1 the shelves fill (Stocks Popular Items);
 * 2 the customers queue at the counter; 3 the scenario runs: the first customer's request sends the truck
 * down the long road to the factory and back (the miss), and from then on every customer is served at once
 * from the shop's stock (hits), a steady stream that never pauses. `?still`, thumbnails and reduced motion
 * hold one final frame with nothing moving.
 */

/* ------------------------------------------------------------------ stage and palette */

const W = 470
const H = 390
const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/* every colour is an engine token or a shade of one */
const PAL = {
  wall: shade(ISO.customer, 0.8),
  wallUp: shade(ISO.gold, 0.7),
  trim: colors.white,
  plinth: shade(ISO.slate, 0.25),
  inside: shade(ISO.customer, 0.62),
  shelf: shade(ISO.customer, -0.35),
  counter: shade(ISO.customer, -0.25),
  counterTop: shade(ISO.steel, 0.55),
  sign: colors.brandDark,
  awningA: colors.brand,
  awningB: colors.white,
  glass: ISO.glass,
  road: shade(ISO.slate, -0.42),
  lane: colors.white,
  paver: shade(ISO.steel, 0.62),
  kerb: shade(ISO.steel, 0.35),
  grass: ISO.grass,
  grassFar: shade(ISO.grass, 0.25),
  trunk: shade(ISO.customer, -0.6),
  leaf: shade(ISO.green, -0.28),
  leaf2: shade(ISO.grass, -0.18),
  facWall: shade(ISO.steel, 0.12),
  facDark: shade(ISO.slate, 0.05),
  facRoof: shade(ISO.slate, 0.05),
  chimney: shade(ISO.red, 0.12),
  tank: shade(ISO.steel, 0.6),
  cab: colors.brand,
  box: colors.white,
  tyre: shade(ISO.ink, -0.35),
  metal: shade(ISO.steel, 0.2),
  carton: shade(ISO.customer, 0.25),
  sky: shade(colors.brand, 0.55),
  haze: mix(colors.surface, colors.surface2, 0.5),
  ground: colors.surface2,
} as const

/* ------------------------------------------------------------------ the world plan (metres) */

/* the shop: one storey, its open front on z = 0, x from -2.6 to 2.6, 4 m deep */
const SHOP = { x0: -2.6, x1: 2.6, d: 4, h1: 3.7 }
const COUNTER = { x0: -2.15, x1: 0.3, z0: -0.72, z1: -0.1, h: 1.02 }
/* the road: a centre line that leaves the camera's right, runs past the shop's side and bends away to the
   factory; the shop side is the outbound lane (traffic keeps left) */
const ROAD_PTS: [number, number][] = [
  [7.4, 22],
  [7.0, 8],
  [7.6, -2],
  [10.6, -9],
  [17, -15],
  [27, -22],
  [38, -30],
  [49, -37.5],
]
const ROAD_W = 7
const LANE = 1.75
/* the factory, beyond the end of the road (front face on z = FAC.z + FAC.d / 2) */
const FAC = { cx: 57, z: -50.5, w: 15, d: 11, h: 8 }
/* the loading dock on the factory front (factory-local x), and where the truck stands beside it */
const DOCK_X = -2.5
const DOCK_STOP = new THREE.Vector3(FAC.cx + DOCK_X, 0, FAC.z + FAC.d / 2 + 3.45)

/* the camera: one fixed, clean angle from the front left, a little above head height */
const CAM_POS = new THREE.Vector3(-12, 5.3, 19)
const CAM_AIM = new THREE.Vector3(2.0, 3.0, -2)
const FOV = 31

/* ------------------------------------------------------------------ motion maths */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u)
const smooth = (u: number) => {
  const x = clamp01(u)
  return x * x * (3 - 2 * x)
}

/**
 * A trip of length L in time T with gentle sinusoidal speed ramps of Ta at each end (a real vehicle or walker:
 * it pulls away, cruises, brakes). Returns distance and acceleration at time t.
 */
function trip(L: number, T: number, Ta: number, t: number): { s: number; a: number; v: number } {
  const ta = Math.min(Ta, T / 2)
  const vmax = L / (T - ta)
  const sAcc = (u: number) => vmax * (u / 2 - (ta / (2 * Math.PI)) * Math.sin((Math.PI * u) / ta))
  if (t <= 0) return { s: 0, a: 0, v: 0 }
  if (t >= T) return { s: L, a: 0, v: 0 }
  if (t < ta) return { s: sAcc(t), a: ((vmax * Math.PI) / (2 * ta)) * Math.sin((Math.PI * t) / ta), v: (vmax * (1 - Math.cos((Math.PI * t) / ta))) / 2 }
  if (t > T - ta) {
    const r = T - t
    return { s: L - sAcc(r), a: -((vmax * Math.PI) / (2 * ta)) * Math.sin((Math.PI * r) / ta), v: (vmax * (1 - Math.cos((Math.PI * r) / ta))) / 2 }
  }
  return { s: sAcc(ta) + vmax * (t - ta), a: 0, v: vmax }
}

/* ------------------------------------------------------------------ the scenario, a pure function of time */

/* scenario seconds, from the third press */
const T_WALK0 = 1.4 /* the first customer reaches the counter */
const T_DEPART = 2.0 /* the truck pulls away: the first request */
const T_OUT = 5.2
const T_LOAD = 1.6
const T_BACK = 5.6
const T_DOCK = T_DEPART + T_OUT
const T_PARK = T_DOCK + T_LOAD + T_BACK
const T_UNLOAD = T_PARK + 0.25
const SERVE0 = T_UNLOAD + 1.5
const AT_COUNTER = 2.0 /* a hit: the customer stands at the counter this long */
const WALK_V = 1.55 /* m/s */

/* the queue: slot 0 at the counter, slots 1-3 along the pavement, 4 off stage */
const SLOT: THREE.Vector3[] = [new THREE.Vector3(-1.0, 0, 0.85), new THREE.Vector3(-2.35, 0, 1.55), new THREE.Vector3(-3.65, 0, 2.15), new THREE.Vector3(-4.95, 0, 2.75), new THREE.Vector3(-9.6, 0, 3.9)]
/* leaving with the bag: away from the queue, forward past the shop's door side and out of the picture */
const EXIT: THREE.Vector3[] = [new THREE.Vector3(-1.0, 0, 0.85), new THREE.Vector3(0.0, 0, 2.3), new THREE.Vector3(1.1, 0, 5.0), new THREE.Vector3(1.9, 0, 9.5)]

/** d_i: when customer i leaves the counter with the bag. */
const departAt = (i: number) => (i === 0 ? SERVE0 + 0.9 : SERVE0 + 0.9 + i * (1.55 + AT_COUNTER))
/** w_i: when customer i starts toward the counter (the queue advances behind them). */
const walkAt = (i: number) => (i <= 0 ? 0 : departAt(i - 1) + 0.05)
const serveAt = (i: number) => (i === 0 ? SERVE0 : walkAt(i) + 1.25 + 0.35)

type Move = { t0: number; pts: THREE.Vector3[] }
const plen = (p: THREE.Vector3[]) => p.slice(1).reduce((a, q, k) => a + q.distanceTo(p[k]), 0)
function along(p: THREE.Vector3[], s: number): THREE.Vector3 {
  let rest = s
  for (let k = 1; k < p.length; k++) {
    const d = p[k].distanceTo(p[k - 1])
    if (rest <= d) return p[k - 1].clone().lerp(p[k], d ? rest / d : 0)
    rest -= d
  }
  return p[p.length - 1].clone()
}

/** The moves customer i makes, in time order. */
function movesOf(i: number): Move[] {
  const m: Move[] = []
  for (let j = Math.max(0, i - 3); j <= i; j++) {
    const from = i - j + 1
    m.push({ t0: walkAt(j) + 0.22 * (i - j), pts: [SLOT[from], SLOT[from - 1]] })
  }
  m.push({ t0: departAt(i), pts: EXIT })
  return m
}

type Cust = { i: number; pos: THREE.Vector3; walk: number; dist: number; dir: number; served: number; visible: boolean; at: number }
/** Customer i at scenario time t (t < 0: the queue as it stands before the scenario). */
function custAt(i: number, t: number): Cust {
  const moves = movesOf(i)
  let pos = SLOT[Math.min(4, i + 1)].clone()
  let walk = 0
  let dist = 0
  let dir = 0
  let odo = 0
  for (const mv of moves) {
    const L = plen(mv.pts)
    const T = L / WALK_V + 0.5
    if (t < mv.t0) break
    const r = trip(L, T, 0.45, t - mv.t0)
    pos = along(mv.pts, r.s)
    dist = odo + r.s
    odo += L
    walk = r.v / (L / (T - 0.45))
    const a = along(mv.pts, Math.max(0, r.s - 0.05))
    const b = along(mv.pts, Math.min(L, r.s + 0.05))
    dir = b.x - a.x + (b.z - a.z) * 0.35
  }
  const served = serveAt(i)
  const gone = t > departAt(i) + plen(EXIT) / WALK_V + 0.6
  const visible = !gone && !(pos.x < -9.5)
  return { i, pos, walk: clamp01(walk), dist, dir, served, visible, at: t }
}

/* ------------------------------------------------------------------ textures */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
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

/** A seeded random, so every build draws the same speckle. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, base: string, n: number, amp: number, seed: number, size = 2) {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  const r = rng(seed)
  for (let k = 0; k < n; k++) {
    const v = r()
    g.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * amp})` : `rgba(20,30,50,${(0.5 - v) * amp})`
    g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()))
  }
}

function makeTextures() {
  const plaster = canvasTex(256, 256, (g) => speckle(g, 256, 256, PAL.wall, 2600, 0.16, 3), [2, 2])
  const plasterUp = canvasTex(256, 256, (g) => speckle(g, 256, 256, PAL.wallUp, 2600, 0.14, 5), [2, 2])
  const pavers = canvasTex(
    256,
    256,
    (g) => {
      speckle(g, 256, 256, PAL.paver, 1800, 0.12, 7)
      g.strokeStyle = shade(ISO.steel, 0.25)
      g.lineWidth = 2
      for (let y = 0; y <= 256; y += 32) {
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(256, y)
        g.stroke()
        for (let x = (y / 32) % 2 ? 0 : 32; x <= 256; x += 64) {
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x, y + 32)
          g.stroke()
        }
      }
    },
    [6, 6],
  )
  const asphalt = canvasTex(
    256,
    512,
    (g) => {
      speckle(g, 256, 512, PAL.road, 9000, 0.22, 11, 1.6)
      /* edge lines and the dashed centre line (the texture spans the road's width) */
      g.fillStyle = shade(PAL.lane, -0.05)
      g.fillRect(10, 0, 6, 512)
      g.fillRect(240, 0, 6, 512)
      g.fillStyle = shade(ISO.gold, 0.15)
      g.fillRect(124, 40, 8, 200)
      g.fillRect(124, 296, 8, 200)
    },
    [1, 10],
  )
  const grass = canvasTex(256, 256, (g) => speckle(g, 256, 256, PAL.grass, 7000, 0.28, 13, 2.2), [40, 40])
  const corrugated = canvasTex(
    128,
    128,
    (g) => {
      const grd = g.createLinearGradient(0, 0, 16, 0)
      grd.addColorStop(0, shade(PAL.facWall, -0.12))
      grd.addColorStop(0.5, shade(PAL.facWall, 0.18))
      grd.addColorStop(1, shade(PAL.facWall, -0.12))
      g.fillStyle = grd
      for (let x = 0; x < 128; x += 16) {
        g.save()
        g.translate(x, 0)
        g.fillRect(0, 0, 16, 128)
        g.restore()
      }
    },
    [14, 2],
  )
  const shutter = canvasTex(
    64,
    128,
    (g) => {
      g.fillStyle = shade(ISO.steel, 0.3)
      g.fillRect(0, 0, 64, 128)
      for (let y = 0; y < 128; y += 6) {
        g.fillStyle = shade(ISO.steel, -0.05)
        g.fillRect(0, y, 64, 1.5)
      }
    },
  )
  const stripes = canvasTex(256, 64, (g) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? PAL.awningB : PAL.awningA
      g.fillRect(k * 32, 0, 32, 64)
    }
  })
  /* the awning's valance: the stripes with a scalloped lower edge, on alpha */
  const valance = canvasTex(256, 48, (g) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? PAL.awningB : PAL.awningA
      g.beginPath()
      g.moveTo(k * 32, 0)
      g.lineTo(k * 32 + 32, 0)
      g.lineTo(k * 32 + 32, 26)
      g.quadraticCurveTo(k * 32 + 16, 50, k * 32, 26)
      g.closePath()
      g.fill()
    }
  })
  /* the signboard: a shopping-basket pictogram on the brand board (no words: labels are DOM) */
  const sign = canvasTex(512, 96, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 96)
    grd.addColorStop(0, shade(PAL.sign, 0.12))
    grd.addColorStop(1, shade(PAL.sign, -0.12))
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 96)
    g.strokeStyle = shade(PAL.sign, 0.35)
    g.lineWidth = 4
    g.strokeRect(6, 6, 500, 84)
    const basket = (cx: number) => {
      g.save()
      g.translate(cx, 50)
      g.strokeStyle = colors.white
      g.fillStyle = colors.white
      g.lineWidth = 5
      g.lineJoin = 'round'
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(-24, -6)
      g.lineTo(24, -6)
      g.lineTo(17, 22)
      g.lineTo(-17, 22)
      g.closePath()
      g.stroke()
      g.beginPath()
      g.moveTo(-14, -6)
      g.lineTo(-6, -26)
      g.moveTo(14, -6)
      g.lineTo(6, -26)
      g.moveTo(-8, 2)
      g.lineTo(-6, 16)
      g.moveTo(0, 2)
      g.lineTo(0, 16)
      g.moveTo(8, 2)
      g.lineTo(6, 16)
      g.stroke()
      g.restore()
    }
    basket(256)
    g.fillStyle = shade(ISO.gold, 0.1)
    for (const x of [150, 362]) {
      g.beginPath()
      g.arc(x, 48, 7, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = shade(PAL.sign, 0.3)
    g.fillRect(40, 44, 80, 8)
    g.fillRect(392, 44, 80, 8)
  })
  const livery = canvasTex(256, 128, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 128)
    grd.addColorStop(0, colors.white)
    grd.addColorStop(1, shade(ISO.steel, 0.78))
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 128)
    g.fillStyle = colors.brand
    g.fillRect(0, 86, 256, 14)
    g.fillStyle = ISO.gold
    g.fillRect(0, 102, 256, 5)
    /* a carton pictogram */
    g.save()
    g.translate(128, 46)
    g.fillStyle = colors.brand
    g.beginPath()
    g.moveTo(0, -22)
    g.lineTo(24, -10)
    g.lineTo(24, 16)
    g.lineTo(0, 28)
    g.lineTo(-24, 16)
    g.lineTo(-24, -10)
    g.closePath()
    g.fill()
    g.strokeStyle = colors.white
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(-24, -10)
    g.lineTo(0, 2)
    g.lineTo(24, -10)
    g.moveTo(0, 2)
    g.lineTo(0, 28)
    g.stroke()
    g.restore()
  })
  const carton = canvasTex(64, 64, (g) => {
    speckle(g, 64, 64, PAL.carton, 300, 0.1, 17, 1.5)
    g.fillStyle = shade(PAL.carton, -0.2)
    g.fillRect(28, 0, 8, 64)
  })
  const chimney = canvasTex(32, 256, (g) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? colors.white : PAL.chimney
      g.fillRect(0, k * 32, 32, 32)
    }
  })
  const blob = canvasTex(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62)
    grd.addColorStop(0, 'rgba(20,32,58,0.55)')
    grd.addColorStop(0.55, 'rgba(20,32,58,0.22)')
    grd.addColorStop(1, 'rgba(20,32,58,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
  })
  /* the sky, in screen space: deep at the top, paling to the haze at the horizon (a third of the way down),
     with a few soft fair-weather clouds */
  const sky = canvasTex(512, 512, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 512)
    grd.addColorStop(0, PAL.sky)
    grd.addColorStop(0.22, shade(PAL.sky, 0.35))
    grd.addColorStop(0.34, PAL.haze)
    grd.addColorStop(1, PAL.haze)
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 512)
    const cr = rng(41)
    const cloud = (cx: number, cy: number, w: number) => {
      for (let k = 0; k < 14; k++) {
        const x = cx + (cr() - 0.5) * w
        const y = cy + (cr() - 0.5) * w * 0.14 - Math.abs(x - cx) * -0.05
        const r = w * (0.1 + cr() * 0.12)
        const rg = g.createRadialGradient(x, y, 0, x, y, r)
        rg.addColorStop(0, 'rgba(255,255,255,0.55)')
        rg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = rg
        g.fillRect(x - r, y - r, r * 2, r * 2)
      }
    }
    cloud(70, 92, 150)
    cloud(300, 60, 190)
    cloud(470, 120, 120)
  })
  return { plaster, plasterUp, pavers, asphalt, grass, corrugated, shutter, stripes, valance, sign, livery, carton, chimney, blob, sky }
}

/* ------------------------------------------------------------------ the scene */

type Built = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  truck: THREE.Group
  wheels: THREE.Object3D[]
  truckBody: THREE.Object3D
  goods: THREE.Object3D[]
  delivered: THREE.Object3D[]
  loaded: THREE.Object3D[]
  shadows: THREE.Mesh[]
  pathOut: THREE.CatmullRomCurve3
  pathBack: THREE.CatmullRomCurve3
  dispose: () => void
}

function std(color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o })
}

const V = (x: number, z: number, y = 0) => new THREE.Vector3(x, y, z)
const ROAD = new THREE.CatmullRomCurve3(
  ROAD_PTS.map(([x, z]) => V(x, z)),
  false,
  'centripetal',
)
/** A point on the road at fraction u (0 near the camera, 1 at the factory yard), `off` metres to the right of
    the outbound direction. */
function roadAt(u: number, off = 0): THREE.Vector3 {
  const p = ROAD.getPointAt(u)
  const t = ROAD.getTangentAt(u)
  return p.add(new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(off))
}
/** The road fraction nearest to a z (the road runs monotonically away from the camera). */
function roadU(z: number): number {
  let lo = 0
  let hi = 1
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2
    if (ROAD.getPointAt(m).z > z) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/** A flat ribbon along the road curve, `w` wide, centred `off` right of the line, its texture running along it. */
function ribbon(w: number, off: number, y: number, u0 = 0, u1 = 1, perM = 9): THREE.BufferGeometry {
  const n = 120
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const len = ROAD.getLength() * (u1 - u0)
  for (let k = 0; k <= n; k++) {
    const u = u0 + ((u1 - u0) * k) / n
    const a = roadAt(u, off - w / 2)
    const b = roadAt(u, off + w / 2)
    pos.push(a.x, y, a.z, b.x, y, b.z)
    const v = (len * k) / n / perM
    uv.push(0, v, 1, v)
    if (k < n) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  /* the winding faces down; flip the normals up */
  const nr = g.getAttribute('normal')
  for (let k = 0; k < nr.count; k++) nr.setXYZ(k, 0, 1, 0)
  return g
}

function buildScene(): Built {
  const tex = makeTextures()
  const scene = new THREE.Scene()
  scene.background = tex.sky
  scene.fog = new THREE.Fog(PAL.haze, 30, 210)
  const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 600)
  camera.position.copy(CAM_POS)
  camera.lookAt(CAM_AIM)
  camera.updateMatrixWorld()

  /* light: a warm afternoon sun from the front left (shadows fall back and to the right) and a sky fill */
  const hemi = new THREE.HemisphereLight(shade(colors.brand, 0.8), shade(ISO.grass, 0.15), 1.35)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(shade(ISO.gold, 0.84), 2.7)
  sun.position.set(-26, 34, 26)
  sun.target.position.set(10, 0, -12)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  const sc = sun.shadow.camera
  sc.left = -40
  sc.right = 40
  sc.top = 42
  sc.bottom = -30
  sc.near = 5
  sc.far = 130
  sun.shadow.bias = -0.0003
  sun.shadow.normalBias = 0.03
  sun.shadow.radius = 3
  scene.add(sun, sun.target)

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene, cast = true, receive = true) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = cast
    m.receiveShadow = receive
    parent.add(m)
    return m
  }
  /* a box standing on y (its base), centred on x and z */
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene, cast = true) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, parent, cast)
  const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y + h / 2, z, parent)
  const flat = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat)
    m.receiveShadow = true
    scene.add(m)
    return m
  }

  /* ---------------- ground: grass, the paved forecourt of the shop, the road and its pavements */
  const ground = mesh(new THREE.PlaneGeometry(700, 700), std(PAL.grass, { map: tex.grass, roughness: 0.95 }), 0, 0, -150, scene, false)
  ground.rotation.x = -Math.PI / 2
  const paverMat = std(PAL.paver, { map: tex.pavers, roughness: 0.9 })
  const plaza = mesh(new THREE.PlaneGeometry(22, 18), paverMat, -6.5, 0.02, 3.5, scene, false)
  plaza.rotation.x = -Math.PI / 2
  /* the path behind the shop's left, to the neighbours */
  const asph = std(PAL.road, { map: tex.asphalt, roughness: 0.92 })
  flat(ribbon(ROAD_W, 0, 0.03), asph)
  const sideTex = tex.pavers.clone()
  sideTex.repeat.set(1, 1)
  sideTex.needsUpdate = true
  const sideMat = std(PAL.paver, { map: sideTex, roughness: 0.9 })
  flat(ribbon(2.4, -ROAD_W / 2 - 1.2, 0.05, 0, 1, 2.4), sideMat)
  flat(ribbon(2.4, ROAD_W / 2 + 1.2, 0.05, 0, 1, 2.4), sideMat)
  /* kerbs: a raised edge each side, from short boxes laid along the curve */
  const kerbMat = std(PAL.kerb, { roughness: 0.7 })
  for (const off of [-ROAD_W / 2 - 0.08, ROAD_W / 2 + 0.08]) {
    for (let k = 0; k < 60; k++) {
      const u0 = k / 60
      const u1 = (k + 1) / 60
      const a = roadAt(u0, off)
      const b = roadAt(u1, off)
      const m = box(0.16, 0.14, a.distanceTo(b) + 0.02, kerbMat, (a.x + b.x) / 2, 0, (a.z + b.z) / 2, scene, false)
      m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z)
    }
  }
  /* the factory yard where the road ends */
  const yardTex = tex.asphalt.clone()
  yardTex.repeat.set(3, 2)
  yardTex.needsUpdate = true
  const yard = mesh(new THREE.PlaneGeometry(30, 13), std(shade(ISO.slate, -0.32), { map: yardTex, roughness: 0.92 }), FAC.cx, 0.035, FAC.z + FAC.d / 2 + 6, scene, false)
  yard.rotation.x = -Math.PI / 2

  /* ---------------- the neighbourhood shop */
  const shop = new THREE.Group()
  scene.add(shop)
  const wallMat = std(PAL.wall, { map: tex.plaster })
  const trimMat = std(PAL.trim, { roughness: 0.6 })
  const insideMat = std(PAL.inside, { roughness: 0.9 })
  const woodMat = std(PAL.shelf, { roughness: 0.7 })
  const counterMat = std(PAL.counter, { roughness: 0.65 })
  const glassMat = new THREE.MeshPhysicalMaterial({ color: PAL.glass, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.5, clearcoat: 1 })
  const { x0, x1, d, h1 } = SHOP
  const cx = (x0 + x1) / 2
  const W0 = x1 - x0
  /* the shell: side walls, back wall, floor, the roof slab */
  box(0.25, h1, d, wallMat, x0 + 0.125, 0, -d / 2, shop)
  box(0.25, h1, d, wallMat, x1 - 0.125, 0, -d / 2, shop)
  box(W0, h1, 0.25, insideMat, cx, 0, -d + 0.125, shop)
  box(W0, 0.08, d, std(shade(PAL.paver, -0.08)), cx, 0, -d / 2, shop, false)
  box(W0 + 0.3, 0.25, d + 0.3, trimMat, cx, h1, -d / 2, shop)
  /* the front: a left pillar, a pillar between the counter opening and the door, the door bay, the header */
  box(0.38, h1, 0.32, wallMat, x0 + 0.19, 0, -0.16, shop)
  box(0.42, h1, 0.32, wallMat, 0.62, 0, -0.16, shop)
  box(x1 - 1.95, h1, 0.32, wallMat, (1.95 + x1) / 2, 0, -0.16, shop)
  box(W0, h1 - 2.75, 0.32, wallMat, cx, 2.75, -0.16, shop)
  /* a dark plinth along the base */
  box(W0 + 0.06, 0.26, 0.36, std(PAL.plinth, { roughness: 0.8 }), cx, 0, -0.16, shop)
  /* the door: frame, glass, handle, a step */
  const door = new THREE.Group()
  door.position.set(1.37, 0, -0.1)
  shop.add(door)
  box(0.95, 2.4, 0.08, std(colors.brandDeep, { roughness: 0.5 }), 0, 0.26, 0, door)
  box(0.75, 1.95, 0.1, glassMat, 0, 0.45, 0.005, door, false)
  box(0.05, 0.32, 0.06, std(ISO.gold, { metalness: 0.7, roughness: 0.3 }), -0.28, 1.2, 0.08, door)
  box(1.15, 0.12, 0.5, std(shade(PAL.paver, -0.15)), 0, 0, 0.32, door)
  /* inside: a warm lamp, shelves of stock on the back wall and the left wall */
  const lamp = new THREE.PointLight(shade(ISO.gold, 0.6), 9, 7, 1.5)
  lamp.position.set(-1, 3.0, -1.6)
  shop.add(lamp)
  const sx0 = x0 + 0.3
  const sx1 = x1 - 0.3
  for (const y of [0.35, 0.95, 1.55, 2.15, 2.75]) box(sx1 - sx0, 0.05, 0.5, woodMat, (sx0 + sx1) / 2, y, -d + 0.5, shop)
  for (const xx of [sx0, (sx0 + sx1) / 2, sx1]) box(0.07, 3.1, 0.5, woodMat, xx, 0, -d + 0.5, shop)
  for (const y of [0.95, 1.55, 2.15]) box(0.45, 0.05, 2.4, woodMat, x0 + 0.5, y, -2.0, shop)
  /* the counter at the open front, a glass display at its face, a scale and a till on its top */
  const cw = COUNTER.x1 - COUNTER.x0
  const ccx = (COUNTER.x0 + COUNTER.x1) / 2
  const ccz = (COUNTER.z0 + COUNTER.z1) / 2
  box(cw, COUNTER.h - 0.06, COUNTER.z1 - COUNTER.z0, counterMat, ccx, 0, ccz, shop)
  box(cw + 0.12, 0.06, COUNTER.z1 - COUNTER.z0 + 0.12, std(PAL.counterTop, { roughness: 0.3 }), ccx, COUNTER.h - 0.06, ccz, shop)
  box(cw - 0.3, 0.46, 0.03, std(shade(PAL.glass, 0.3), { roughness: 0.1 }), ccx, 0.38, COUNTER.z1 + 0.012, shop, false)
  for (let k = 0; k < 6; k++) {
    const jar = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 14), new THREE.MeshPhysicalMaterial({ color: shade(PAL.glass, 0.4), roughness: 0.05, transparent: true, opacity: 0.6 }), COUNTER.x0 + 0.35 + k * 0.36, 0.53, COUNTER.z1 - 0.12, shop, false)
    const sweets = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12), std([ISO.red, ISO.gold, colors.accent, ISO.green, colors.teal, colors.brand][k], { roughness: 0.5 }), 0, -0.04, 0, jar, false)
    sweets.castShadow = false
  }
  box(0.38, 0.1, 0.3, std(colors.white, { roughness: 0.4 }), -0.3, COUNTER.h, -0.42, shop)
  mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 20), std(shade(ISO.steel, 0.3), { metalness: 0.7, roughness: 0.3 }), -0.3, COUNTER.h + 0.14, -0.42, shop)
  rbox(0.42, 0.26, 0.34, 0.04, std(shade(ISO.ink, 0.25), { roughness: 0.4 }), -1.7, COUNTER.h, -0.45, shop)

  /* the stock: boxes, tins and bottles on every shelf (they fill in on the first press) */
  const goods: THREE.Object3D[] = []
  const r = rng(29)
  const stockCols = [colors.brand, colors.accent, ISO.gold, ISO.red, ISO.green, colors.teal, colors.white, ISO.customer]
  const putGoods = (a0: number, a1: number, y: number, depth: number, along: 'x' | 'z') => {
    let p = a0
    while (p < a1 - 0.12) {
      const kind = r()
      const col = stockCols[Math.floor(r() * stockCols.length)]
      const g = new THREE.Group()
      let w = 0.16
      if (kind < 0.5) {
        w = 0.15 + r() * 0.12
        const h = 0.24 + r() * 0.22
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2 + r() * 0.12), std(col, { roughness: 0.6 }))
        b.position.y = h / 2
        b.castShadow = true
        g.add(b)
      } else if (kind < 0.78) {
        w = 0.12
        const h = 0.15 + r() * 0.06
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, h, 14), std(col, { roughness: 0.35, metalness: 0.35 }))
        c.position.y = h / 2
        g.add(c)
        if (r() > 0.4) {
          const c2 = c.clone()
          c2.position.y = h * 1.5 + 0.005
          g.add(c2)
        }
      } else {
        w = 0.1
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 12), std(col, { roughness: 0.15, metalness: 0.1 }))
        b.position.y = 0.16
        g.add(b)
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 10), std(colors.white))
        cap.position.y = 0.35
        g.add(cap)
      }
      if (along === 'x') g.position.set(p + w / 2, y + 0.025, depth + (r() - 0.5) * 0.08)
      else {
        g.position.set(depth + (r() - 0.5) * 0.06, y + 0.025, -(p + w / 2))
        g.rotation.y = Math.PI / 2
      }
      shop.add(g)
      goods.push(g)
      p += w + 0.025
    }
  }
  for (const y of [0.35, 0.95, 1.55, 2.15, 2.75]) putGoods(sx0 + 0.06, sx1 - 0.02, y, -d + 0.5, 'x')
  for (const y of [0.95, 1.55, 2.15]) putGoods(0.85, 3.15, y, x0 + 0.5, 'z')
  /* produce crates on a stand under the awning, left of the counter: the popular items, out on show */
  const crate = (x: number, z: number, fruit: string) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    box(0.62, 0.66, 0.5, woodMat, 0, 0, 0, g)
    const c = new THREE.Group()
    c.position.set(0, 0.66, 0)
    c.rotation.x = 0.22
    g.add(c)
    box(0.6, 0.15, 0.48, std(shade(PAL.shelf, 0.35)), 0, 0, 0, c)
    const fr = rng(Math.floor(x * 100 + z * 10 + 50))
    for (let k = 0; k < 15; k++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.075 + fr() * 0.02, 12, 10), std(shade(fruit, (fr() - 0.5) * 0.25), { roughness: 0.45 }))
      sp.position.set(-0.22 + (k % 5) * 0.11, 0.17 + (fr() - 0.5) * 0.03, -0.16 + Math.floor(k / 5) * 0.16)
      sp.castShadow = true
      c.add(sp)
    }
    shop.add(g)
    goods.push(g)
  }
  crate(-2.25, 0.45, ISO.red)
  crate(-1.6, 0.5, colors.accent)
  crate(2.25, 0.5, ISO.green)

  /* a potted plant by the door */
  for (const px of [0.62]) {
    mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.42, 16), std(shade(ISO.customer, -0.4), { roughness: 0.6 }), px, 0.21, 0.42, shop)
    for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(0.17, 1), std(k % 2 ? PAL.leaf : PAL.leaf2, { roughness: 0.85, flatShading: true }), px + (k - 1.5) * 0.08, 0.55 + (k % 2) * 0.12, 0.42 + ((k * 7) % 3 - 1) * 0.06, shop)
  }
  /* the awning over the counter, striped, with a scalloped valance on aluminium arms */
  const awn = new THREE.Group()
  awn.position.set(-0.85, 2.72, 0.02)
  shop.add(awn)
  const awW = 3.6
  const awD = 1.45
  const slope = 0.45
  const awMid = (k: number) => [-Math.sin(slope) * awD * k, Math.cos(slope) * awD * k] as const
  const aw = mesh(new THREE.PlaneGeometry(awW, awD), std(colors.white, { map: tex.stripes, side: THREE.DoubleSide, roughness: 0.85 }), 0, awMid(0.5)[0], awMid(0.5)[1], awn)
  aw.rotation.x = -Math.PI / 2 + slope
  const val = mesh(new THREE.PlaneGeometry(awW, 0.3), std(colors.white, { map: tex.valance, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }), 0, awMid(1)[0] - 0.15, awMid(1)[1] + 0.005, awn)
  val.castShadow = true
  for (const ax of [-awW / 2 + 0.05, awW / 2 - 0.05]) {
    const arm = mesh(new THREE.CylinderGeometry(0.02, 0.02, awD, 6), std(shade(ISO.steel, -0.1), { metalness: 0.6 }), ax, awMid(0.5)[0], awMid(0.5)[1], awn)
    arm.rotation.x = Math.PI / 2 + slope
  }
  /* the signboard across the front, above the awning */
  box(W0 + 0.16, 0.66, 0.12, std(colors.white, { map: tex.sign, roughness: 0.5 }), cx, h1 - 0.78, 0.07, shop)
  /* the parapet: a low wall round the roof, a water tank and a dish */
  box(W0 + 0.3, 0.45, 0.15, trimMat, cx, h1 + 0.25, 0.08, shop)
  box(0.15, 0.45, d + 0.3, trimMat, x0 - 0.08, h1 + 0.25, -d / 2, shop)
  box(0.15, 0.45, d + 0.3, trimMat, x1 + 0.08, h1 + 0.25, -d / 2, shop)
  mesh(new THREE.CylinderGeometry(0.6, 0.65, 1.2, 24), std(shade(ISO.ink, -0.05), { roughness: 0.6 }), 1.5, h1 + 0.25 + 0.6, -2.6, shop)
  mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), std(shade(ISO.ink, 0.15)), 1.5, h1 + 0.25 + 1.26, -2.6, shop)
  const dish = mesh(new THREE.SphereGeometry(0.35, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), std(colors.white, { side: THREE.DoubleSide, roughness: 0.4 }), -1.6, h1 + 0.9, -2.2, shop)
  dish.rotation.x = -1.1
  /* the left side wall: a window with grille and sill, a drainpipe, an AC box */
  box(0.06, 1.1, 1.3, std(colors.brandDeep), x0 - 0.02, 1.0, -2.3, shop, false)
  box(0.08, 0.95, 1.15, glassMat, x0 - 0.035, 1.07, -2.3, shop, false)
  for (let k = 0; k < 4; k++) box(0.04, 0.95, 0.03, std(shade(ISO.ink, 0.2)), x0 - 0.08, 1.07, -2.75 + k * 0.3, shop, false)
  box(0.18, 0.06, 1.45, trimMat, x0 - 0.07, 0.95, -2.3, shop)
  mesh(new THREE.CylinderGeometry(0.055, 0.055, h1 + 0.4, 10), std(shade(ISO.steel, 0.1)), x0 - 0.08, (h1 + 0.4) / 2, -0.35, shop)
  box(0.32, 0.55, 0.8, std(shade(ISO.steel, 0.7), { roughness: 0.5 }), x0 - 0.18, 2.4, -1.3, shop)

  /* ---------------- street details: lamps along the road, trees, bollards, a bench, a bin, a scooter */
  const poleMat = std(shade(ISO.ink, 0.15), { metalness: 0.5, roughness: 0.4 })
  const lampPost = (p: THREE.Vector3, face: number) => {
    const g = new THREE.Group()
    g.position.copy(p)
    g.rotation.y = face
    scene.add(g)
    mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.4, 10), poleMat, 0, 2.7, 0, g)
    const arm = mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 8), poleMat, 0.62, 5.35, 0, g)
    arm.rotation.z = Math.PI / 2
    rbox(0.55, 0.14, 0.26, 0.05, poleMat, 1.25, 5.18, 0, g)
    mesh(new THREE.BoxGeometry(0.42, 0.03, 0.18), std(colors.white, { emissive: shade(ISO.gold, 0.6), emissiveIntensity: 0.25 }), 1.25, 5.17, 0, g, false)
    return g
  }
  const tree = (p: THREE.Vector3, s = 1, seed = 1) => {
    const g = new THREE.Group()
    g.position.copy(p)
    g.scale.setScalar(s)
    scene.add(g)
    mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.3, 8), std(PAL.trunk), 0, 1.15, 0, g)
    const tr = rng(seed)
    for (let k = 0; k < 7; k++) {
      mesh(new THREE.IcosahedronGeometry(0.75 + tr() * 0.4, 1), std(k % 3 ? PAL.leaf : PAL.leaf2, { roughness: 0.9, flatShading: true }), (tr() - 0.5) * 1.3, 2.6 + tr() * 1.2, (tr() - 0.5) * 1.3, g)
    }
    return g
  }
  /* lamps on the far pavement, facing the road */
  for (let k = 0; k < 4; k++) {
    const u = 0.27 + k * 0.11
    const t = ROAD.getTangentAt(u)
    lampPost(roadAt(u, ROAD_W / 2 + 0.7), Math.atan2(t.x, t.z) + Math.PI / 2)
  }
  /* trees along both sides beyond the shop, then the far tree line */
  for (let k = 0; k < 10; k++) {
    const u = 0.36 + k * 0.065
    if (u < 0.6) tree(roadAt(u, -ROAD_W / 2 - 3.6), 1.0 + ((k * 37) % 5) * 0.06, k + 3)
    if (k % 2 === 0 && u < 0.7) tree(roadAt(Math.min(0.97, u + 0.03), ROAD_W / 2 + 4.2), 0.95 + ((k * 53) % 5) * 0.05, k + 41)
  }
  tree(V(-4.6, -6.5), 1.3, 77)
  tree(V(-0.6, -8.5), 1.25, 78)
  tree(V(3.4, -7.2), 1.15, 79)
  tree(V(-11.5, -7), 1.35, 80)
  /* the neighbours: two houses to the left, set back */
  const house = (x: number, z: number, w: number, h: number, col: string, roofCol: string) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    scene.add(g)
    box(w, h, 6, std(col, { map: tex.plaster }), 0, 0, 0, g)
    box(w + 0.2, 0.3, 6.2, std(roofCol), 0, h, 0, g)
    const rows = h > 4.5 ? [1.0, 3.9] : [1.0]
    for (let k = 0; k < Math.floor(w / 1.7); k++) {
      for (const yy of rows) {
        box(0.85, 1.05, 0.06, std(colors.brandDeep), -w / 2 + 1 + k * 1.7, yy, 3.01, g, false)
        box(0.7, 0.9, 0.07, std(shade(ISO.glass, -0.15), { roughness: 0.1, metalness: 0.2 }), -w / 2 + 1 + k * 1.7, yy + 0.07, 3.02, g, false)
      }
    }
    box(1.0, 2.2, 0.08, std(shade(ISO.customer, -0.45)), w / 2 - 1.1, 0, 3.02, g, false)
    return g
  }
  house(-9.5, -11, 5.6, 5.6, shade(ISO.glass, 0.45), shade(ISO.slate, 0.2))
  house(-16.5, -12.5, 6.5, 4.0, shade(ISO.grass, 0.6), shade(ISO.red, 0.1))
  /* bollards along the forecourt's road edge */
  for (let k = 0; k < 3; k++) {
    const p = roadAt(roadU(6 + k * 2.2), -ROAD_W / 2 - 0.45)
    mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.8, 12), std(shade(ISO.ink, 0.2), { metalness: 0.4 }), p.x, 0.4, p.z)
  }
  /* a bench and a bin by the shop's left corner, a parked scooter at the kerb */
  const bench = new THREE.Group()
  bench.position.set(-4.2, 0, -0.7)
  scene.add(bench)
  for (const k of [0, 1, 2]) box(1.6, 0.05, 0.12, woodMat, 0, 0.45, -0.14 + k * 0.14, bench)
  box(1.6, 0.32, 0.05, woodMat, 0, 0.58, -0.26, bench)
  for (const bx of [-0.7, 0.7]) box(0.06, 0.45, 0.42, poleMat, bx, 0, 0, bench)
  mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.8, 16), std(shade(ISO.green, -0.15), { roughness: 0.5 }), -5.2, 0.4, -0.5)
  const scooter = new THREE.Group()
  scooter.position.set(-6.4, 0, 0.4)
  scooter.rotation.y = 1.35
  scene.add(scooter)
  for (const sz of [-0.55, 0.55]) {
    const wh = mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 20), std(PAL.tyre), 0, 0.29, sz, scooter)
    wh.rotation.y = Math.PI / 2
  }
  rbox(0.4, 0.35, 1.05, 0.12, std(colors.accent, { roughness: 0.35, metalness: 0.2 }), 0, 0.35, 0, scooter)
  rbox(0.34, 0.12, 0.6, 0.05, std(shade(ISO.ink, 0.1)), 0, 0.72, -0.15, scooter)
  rbox(0.36, 0.7, 0.16, 0.05, std(colors.accent, { roughness: 0.35, metalness: 0.2 }), 0, 0.4, 0.5, scooter)
  const hb = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), poleMat, 0, 1.12, 0.55, scooter)
  hb.rotation.z = Math.PI / 2

  /* ---------------- the distant factory: hall, saw-tooth roof, chimney, silos, loading bay, office, fence */
  const fac = new THREE.Group()
  fac.position.set(FAC.cx, 0, FAC.z)
  scene.add(fac)
  const facMat = std(PAL.facWall, { map: tex.corrugated, roughness: 0.6, metalness: 0.25 })
  const facDark = std(PAL.facDark, { roughness: 0.6 })
  box(FAC.w, FAC.h, FAC.d, facMat, 0, 0, 0, fac)
  const teeth = 5
  const tw = FAC.w / teeth
  for (let k = 0; k < teeth; k++) {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(tw, 0)
    shape.lineTo(tw, 2.0)
    shape.closePath()
    mesh(new THREE.ExtrudeGeometry(shape, { depth: FAC.d, bevelEnabled: false }), std(PAL.facRoof, { roughness: 0.55, metalness: 0.3 }), -FAC.w / 2 + k * tw, FAC.h, -FAC.d / 2, fac)
    box(0.06, 1.8, FAC.d - 0.2, new THREE.MeshPhysicalMaterial({ color: ISO.glass, roughness: 0.1, metalness: 0.3 }), -FAC.w / 2 + (k + 1) * tw - 0.04, FAC.h, 0, fac, false)
  }
  /* a brand-blue band under the eaves, and windows high on the front wall */
  box(FAC.w + 0.04, 0.5, FAC.d + 0.04, std(colors.brand, { roughness: 0.5 }), 0, FAC.h - 0.7, 0, fac, false)
  for (let k = 0; k < 6; k++) box(1.6, 0.9, 0.06, std(shade(ISO.glass, -0.2), { roughness: 0.1, metalness: 0.3 }), -FAC.w / 2 + 1.6 + k * 2.4, 5.6, FAC.d / 2 + 0.02, fac, false)
  /* the loading bay: a raised dock, two roller shutters, a canopy, yellow bumpers */
  const shutterMat = std(colors.white, { map: tex.shutter, roughness: 0.5, metalness: 0.3 })
  box(8, 1.2, 2.2, std(shade(ISO.steel, 0.15)), DOCK_X, 0, FAC.d / 2 + 1.1, fac)
  for (const k of [-2.2, 2.2]) {
    box(3.4, 3.6, 0.1, shutterMat, DOCK_X + k, 1.2, FAC.d / 2 + 0.05, fac)
    box(0.25, 1.0, 0.3, std(ISO.gold), DOCK_X + k, 0.1, FAC.d / 2 + 2.25, fac)
  }
  box(9, 0.22, 3.0, facDark, DOCK_X, 5.2, FAC.d / 2 + 1.5, fac)
  const cartonMat = std(colors.white, { map: tex.carton, roughness: 0.85 })
  for (let k = 0; k < 3; k++) box(0.8, 0.7, 0.8, cartonMat, DOCK_X - 3.2 + k * 0.9, 1.2, FAC.d / 2 + 0.7, fac)
  /* the office block, front right */
  box(5, 5, 4, std(shade(ISO.steel, 0.65), { map: tex.plaster }), FAC.w / 2 - 2.5, 0, FAC.d / 2 + 2, fac)
  for (const yy of [1.2, 3.2]) box(4.4, 1.0, 0.06, std(shade(ISO.glass, -0.25), { roughness: 0.1, metalness: 0.3 }), FAC.w / 2 - 2.5, yy, FAC.d / 2 + 4.02, fac, false)
  box(5.2, 0.25, 4.2, trimMat, FAC.w / 2 - 2.5, 5, FAC.d / 2 + 2, fac)
  /* the chimney, red and white, behind the hall's right end, and two silos to the right */
  mesh(new THREE.CylinderGeometry(0.75, 1.05, 19, 24), std(colors.white, { map: tex.chimney, roughness: 0.7 }), 5.6, 9.5, -2.5, fac)
  mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 24), facDark, 5.6, 19.1, -2.5, fac)
  for (const sx of [FAC.w / 2 + 2.6, FAC.w / 2 + 6.2]) {
    mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 24), std(PAL.tank, { roughness: 0.35, metalness: 0.55 }), sx, 5.2, -1, fac)
    mesh(new THREE.ConeGeometry(1.5, 1.2, 24), std(PAL.tank, { roughness: 0.35, metalness: 0.55 }), sx, 9.8, -1, fac)
    for (const lx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 8), facDark, sx + lx, 0.65, -1 + lx * 0.4, fac)
  }
  /* the yard fence, open where the road comes in */
  const fenceMat = std(shade(ISO.steel, -0.05), { metalness: 0.5, roughness: 0.4 })
  const gate = roadAt(roadU(FAC.z + FAC.d / 2 + 12.5), 0)
  for (let k = 0; k < 13; k++) {
    const fx = FAC.cx - FAC.w / 2 - 6 + k * 2.6
    if (Math.abs(fx + 1.3 - gate.x) < 5) continue
    box(0.08, 1.8, 0.08, fenceMat, fx, 0, FAC.z + FAC.d / 2 + 12.5, scene, false)
    box(2.6, 0.05, 0.05, fenceMat, fx + 1.3, 1.7, FAC.z + FAC.d / 2 + 12.5, scene, false)
    box(2.6, 0.05, 0.05, fenceMat, fx + 1.3, 0.85, FAC.z + FAC.d / 2 + 12.5, scene, false)
  }
  /* far hills and a tree line behind the factory: atmosphere, washed out by the fog */
  const hillMat = new THREE.MeshStandardMaterial({ color: mix(PAL.haze, shade(ISO.grass, -0.25), 0.32), roughness: 1, fog: false })
  for (const [hx, hz, hs, hh] of [
    [-60, -260, 90, 18],
    [40, -280, 110, 26],
    [150, -250, 80, 16],
    [-150, -240, 70, 14],
  ] as const) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16), hillMat)
    m.position.set(hx, -2, hz)
    m.scale.set(hs, hh, hs * 0.35)
    scene.add(m)
  }
  for (let k = 0; k < 18; k++) tree(V(FAC.cx - 34 + k * 4.4, FAC.z - 12 - (k % 3) * 2.5), 1.5, 100 + k)

  /* ---------------- the delivery truck (forward is +z in its own frame) */
  const truck = new THREE.Group()
  /* a neighbourhood mini-truck: modelled at full scale, drawn at 0.68 (about 4.3 m long, 2.4 m tall) */
  truck.scale.setScalar(TRUCK_K)
  scene.add(truck)
  const body = new THREE.Group()
  truck.add(body)
  const cabMat = std(PAL.cab, { roughness: 0.35, metalness: 0.25 })
  const darkGlass = new THREE.MeshPhysicalMaterial({ color: shade(ISO.ink, 0.25), roughness: 0.05, metalness: 0.4, clearcoat: 1 })
  const chrome = std(shade(ISO.steel, 0.5), { metalness: 0.9, roughness: 0.25 })
  rbox(2.2, 0.5, 6.2, 0.06, std(shade(ISO.ink, 0.1), { roughness: 0.6 }), 0, 0.55, 0, body)
  const cargo = rbox(2.4, 2.5, 4.3, 0.08, std(colors.white, { map: tex.livery, roughness: 0.45 }), 0, 1.05, -0.95, body)
  cargo.castShadow = true
  rbox(2.3, 1.85, 1.75, 0.22, cabMat, 0, 0.75, 2.25, body)
  rbox(2.32, 0.38, 1.0, 0.16, cabMat, 0, 2.52, 2.05, body)
  const ws = mesh(new THREE.PlaneGeometry(2.0, 0.8), darkGlass, 0, 2.15, 3.13, body, false)
  ws.rotation.x = -0.12
  for (const sx of [-1.16, 1.16]) {
    const sw2 = mesh(new THREE.PlaneGeometry(0.9, 0.7), darkGlass, sx, 2.15, 2.3, body, false)
    sw2.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2
  }
  rbox(2.4, 0.32, 0.25, 0.08, chrome, 0, 0.45, 3.15, body)
  box(1.3, 0.45, 0.04, std(shade(ISO.ink, 0.2)), 0, 0.95, 3.14, body, false)
  for (const sx of [-0.85, 0.85]) {
    const hl = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16), std(colors.white, { emissive: shade(ISO.gold, 0.7), emissiveIntensity: 0.6 }), sx, 1.0, 3.13, body, false)
    hl.rotation.x = Math.PI / 2
    box(0.08, 0.32, 0.18, cabMat, sx * 1.42, 1.85, 2.9, body)
  }
  for (const sx of [-0.95, 0.95]) box(0.25, 0.18, 0.04, std(ISO.red, { emissive: ISO.red, emissiveIntensity: 0.4 }), sx, 0.75, -3.12, body, false)
  const wheels: THREE.Object3D[] = []
  for (const [wx, wz] of [
    [-1.1, 2.1],
    [1.1, 2.1],
    [-1.1, -1.5],
    [1.1, -1.5],
    [-1.1, -2.45],
    [1.1, -2.45],
  ]) {
    const w = new THREE.Group()
    w.position.set(wx, 0.5, wz)
    truck.add(w)
    const t = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.36, 24), std(PAL.tyre, { roughness: 0.9 }), 0, 0, 0, w)
    t.rotation.z = Math.PI / 2
    const rim = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.38, 10), chrome, 0, 0, 0, w, false)
    rim.rotation.z = Math.PI / 2
    /* a hub bar, so the turning shows */
    box(0.39, 0.08, 0.42, std(shade(ISO.steel, -0.25)), 0, -0.04, 0, w, false)
    wheels.push(w)
  }
  const tshadow = mesh(new THREE.PlaneGeometry(3.2, 7.4), new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.6 }), 0, 0.07, 0, truck, false, false)
  tshadow.rotation.x = -Math.PI / 2

  /* the truck's two journeys: out along the shop-side lane, into the yard and along the dock; then round the
     yard, back down the far lane, over to the kerb by the shop, nose to the camera */
  const uPark = roadU(1.0)
  const lane = (u: number, side: number) => roadAt(u, side * LANE)
  const outPts = [lane(uPark, -1)]
  for (let k = 1; k <= 8; k++) outPts.push(lane(uPark + ((0.985 - uPark) * k) / 8, -1))
  outPts.push(DOCK_STOP.clone().add(V(-2.4, 0.3)), DOCK_STOP.clone())
  const pathOut = new THREE.CatmullRomCurve3(outPts, false, 'centripetal')
  const backPts = [DOCK_STOP.clone(), DOCK_STOP.clone().add(V(2.8, 0.45)), DOCK_STOP.clone().add(V(4.1, 2.35)), DOCK_STOP.clone().add(V(2.8, 4.55)), DOCK_STOP.clone().add(V(-1.0, 5.55))]
  const uTurnIn = roadU(-7)
  for (let k = 0; k <= 8; k++) backPts.push(lane(0.985 - ((0.985 - uTurnIn) * k) / 8, 1))
  backPts.push(roadAt(roadU(-3.2), 0.1), roadAt(roadU(-1.0), -LANE * 0.85), roadAt(uPark, -LANE))
  const pathBack = new THREE.CatmullRomCurve3(backPts, false, 'centripetal')

  /* the cartons the truck brings back (the first request's goods), stacked on the pavement right of the door */
  const delivered: THREE.Object3D[] = []
  for (const [hx, hy, hz] of [
    [2.95, 0, 1.25],
    [3.75, 0, 1.35],
    [3.3, 0.62, 1.3],
  ] as const) {
    const c = box(0.7, 0.62, 0.7, cartonMat, 0, 0, 0)
    c.userData.home = new THREE.Vector3(hx, hy + 0.31, hz)
    c.position.copy(c.userData.home)
    delivered.push(c)
  }

  /* three cartons waiting at the dock's edge, carried into the truck while it stands there */
  const loaded: THREE.Object3D[] = []
  for (let k = 0; k < 3; k++) {
    const c = box(0.8, 0.7, 0.8, cartonMat, 0, 0, 0)
    c.userData.home = new THREE.Vector3(FAC.cx + DOCK_X + 0.6 + k * 0.9, 1.2 + 0.35, FAC.z + FAC.d / 2 + 1.5)
    c.position.copy(c.userData.home)
    loaded.push(c)
  }

  /* contact shadows for the people (moved every frame) */
  const shadows: THREE.Mesh[] = []
  for (let k = 0; k < 9; k++) {
    const m = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.9 }), 0, 0.07, 0, scene, false, false)
    m.rotation.x = -Math.PI / 2
    m.visible = false
    shadows.push(m)
  }

  const dispose = () => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else if (mat) mat.dispose()
    })
    Object.values(tex).forEach((t) => t.dispose())
    sideTex.dispose()
    yardTex.dispose()
  }
  return { scene, camera, truck, wheels, truckBody: body, goods, delivered, loaded, shadows, pathOut, pathBack, dispose }
}

/* ------------------------------------------------------------------ the frame: the world at time t */

type Frame = {
  /** the build presses */
  step: number
  /** seconds since the slide opened (idle life) */
  now: number
  /** scenario seconds since the third press, or -1 before it */
  sim: number
  /** 0..1, the stock filling the shelves (first press) */
  stock: number
}

const TRUCK_K = 0.68
const OUT_LEN = { v: 0 }
const BACK_LEN = { v: 0 }

function placeTruck(b: Built, sim: number) {
  const out = OUT_LEN.v || (OUT_LEN.v = b.pathOut.getLength())
  const back = BACK_LEN.v || (BACK_LEN.v = b.pathBack.getLength())
  let curve = b.pathOut
  let u = 0
  let a = 0
  let odo = 0
  if (sim < T_DOCK) {
    const r = trip(out, T_OUT, 1.3, sim - T_DEPART)
    u = r.s / out
    a = r.a
    odo = r.s
  } else if (sim < T_DOCK + T_LOAD) {
    u = 1
    odo = out
  } else {
    const r = trip(back, T_BACK, 1.4, sim - T_DOCK - T_LOAD)
    curve = b.pathBack
    u = r.s / back
    a = r.a
    odo = out + r.s
  }
  const p = curve.getPointAt(clamp01(u))
  const tg = curve.getTangentAt(clamp01(u))
  b.truck.position.copy(p)
  b.truck.rotation.y = Math.atan2(tg.x, tg.z)
  /* the body pitches back as it pulls away and dips as it brakes; the wheels roll with the distance */
  b.truckBody.rotation.x = THREE.MathUtils.clamp(-a * 0.012, -0.03, 0.03)
  for (const w of b.wheels) w.rotation.x = odo / (0.5 * TRUCK_K)
}

function placeGoods(b: Built, f: Frame) {
  const n = b.goods.length
  b.goods.forEach((g, k) => {
    const s = smooth((f.stock * (n + 10) - k * 0.6) / 6)
    g.scale.setScalar(Math.max(0.001, s))
    g.visible = s > 0.002
  })
  /* at the dock, the waiting cartons arc into the truck one after another */
  b.loaded.forEach((c, k) => {
    const home = c.userData.home as THREE.Vector3
    const t0 = T_DOCK + 0.2 + k * 0.4
    const u = f.sim < 0 ? 0 : clamp01((f.sim - t0) / 0.5)
    const e = smooth(u)
    const into = DOCK_STOP.clone().add(new THREE.Vector3(-0.6, 1.2, 0))
    c.position.lerpVectors(home, into, e)
    c.position.y += Math.sin(Math.PI * e) * 0.5
    c.visible = u < 1
  })
  /* the delivered cartons arc from the truck's side to the stack, one after another */
  const from = b.pathBack.getPointAt(1).clone()
  from.y = 1.6
  b.delivered.forEach((c, k) => {
    const home = c.userData.home as THREE.Vector3
    const t0 = T_UNLOAD + k * 0.4
    const u = f.sim < 0 ? 0 : clamp01((f.sim - t0) / 0.55)
    c.visible = f.sim >= t0
    const e = smooth(u)
    c.position.lerpVectors(from, home, e)
    c.position.y += Math.sin(Math.PI * e) * 0.6
    c.rotation.y = (1 - e) * 0.6
  })
}

/* ------------------------------------------------------------------ people */

const SHOPKEEPER: CharacterConfig = {
  ...PRESETS.rohan,
  name: 'Shopkeeper',
  outfit: { ...PRESETS.rohan.outfit, top: 'shirt', topColor: colors.white },
}
const CUSTOMERS: CharacterConfig[] = [PRESETS.kabir, PRESETS.meera, PRESETS.dev, PRESETS.ananya, PRESETS.riya, PRESETS.arjun]

/** The shopkeeper's apron, body space (shoulders y 205, hips y 360): the shop's blue. */
const APRON = (
  <g data-part="apron">
    <path d="M 170 236 H 230 V 270 C 246 276 250 300 248 330 L 246 420 H 154 L 152 330 C 150 300 154 276 170 270 Z" fill={colors.brand} stroke={colors.brandDark} strokeWidth={3} />
    <path d="M 170 236 C 168 220 160 212 152 208 M 230 236 C 232 220 240 212 248 208" stroke={colors.brandDark} strokeWidth={3} fill="none" />
    <rect x={178} y={318} width={44} height={30} rx={6} fill="none" stroke={colors.white} strokeWidth={2.5} opacity={0.8} />
  </g>
)

const IDLE = { breath: true, blink: true, saccades: true, sway: false, liveliness: 0.6 }

/** The walk: knees and weight swapping with the distance walked, a small bob, the arms swinging a little. */
function addWalk(p: Pose, dist: number, w: number) {
  if (w <= 0.001) return
  const ph = (dist / 1.25) * Math.PI * 2
  const s = Math.sin(ph)
  const c = Math.cos(ph)
  p.kneeL += Math.max(0, s) * 0.42 * w
  p.kneeR += Math.max(0, -s) * 0.42 * w
  p.stance += s * 0.35 * w
  p.bodyY += -Math.abs(c) * 3.2 * w
  p.shoulderL += s * 5 * w
  p.shoulderR += -s * 5 * w
  p.elbowL += 6 * w
  p.elbowR += 6 * w
}

function clip(name: string, start: number, gesture = true) {
  const action = gesture ? ACTIONS[name] : EXPRESSIONS[name]
  return action ? { action, start } : undefined
}

/** A shopping bag held at the hanging hand (viewBox 0 0 400 600). */
const BAG = (
  <g>
    <path d="M 268 392 C 268 370 296 370 296 392" fill="none" stroke={shade(ISO.customer, -0.5)} strokeWidth={4} />
    <path d="M 254 392 L 310 392 L 314 466 L 250 466 Z" fill={shade(ISO.customer, 0.35)} stroke={shade(ISO.customer, -0.25)} strokeWidth={2.5} />
    <path d="M 254 392 L 310 392 L 311 404 L 253 404 Z" fill={shade(ISO.customer, 0.1)} />
    <circle cx={282} cy={430} r={9} fill={colors.brand} />
  </g>
)

type Person = { key: string; skin: Skin; pose: Pose; x: number; y: number; s: number; depth: number; flip: boolean; bag: boolean; clipY?: number[] ; on: boolean }

/* ------------------------------------------------------------------ tags */

function Tag({ x, y, on = true, tone = 'plain', children }: { x: number; y: number; on?: boolean; tone?: LabelTone; children: ReactNode }) {
  const instant = useInstant()
  const tr = (p: string) => (instant ? 'none' : `${p} 520ms ${EASE}`)
  return (
    <At x={x} y={y} cx style={{ zIndex: 3 }}>
      <span className="block" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}` }}>
        <Label size={14} strong tone={tone} raised>
          {children}
        </Label>
      </span>
    </At>
  )
}

/* ------------------------------------------------------------------ the figure */

/* the frame `?still` holds: the truck back at the kerb, the cartons stacked, a later customer at the counter
   being handed the bag, the one before walking off with theirs, two in the queue and one more arriving */
const SIM_STILL = walkAt(3) + 2.2
const NOW_STILL = 2.2

function useWorld(step: number) {
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  const [f, setF] = useState<Frame>(() => ({ step, now: NOW_STILL, sim: step >= 3 ? (held ? SIM_STILL : 0) : -1, stock: step >= 1 ? 1 : 0 }))
  const marks = useRef({ open: 0, stock: -1, sim: -1 })
  useEffect(() => {
    if (held) {
      setF({ step, now: NOW_STILL, sim: step >= 3 ? SIM_STILL : -1, stock: step >= 1 ? 1 : 0 })
      return
    }
    const m = marks.current
    const t0 = performance.now()
    if (!m.open) m.open = t0
    m.stock = step >= 1 ? (m.stock < 0 ? t0 : m.stock) : -1
    m.sim = step >= 3 ? (m.sim < 0 ? t0 : m.sim) : -1
    let raf = 0
    const tick = (nowMs: number) => {
      setF({
        step,
        now: (nowMs - m.open) / 1000 + NOW_STILL,
        sim: m.sim < 0 ? -1 : (nowMs - m.sim) / 1000,
        stock: m.stock < 0 ? 0 : clamp01((nowMs - m.stock) / 1400),
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, step])
  return { f, held }
}

function T20Everyday3D({ step }: { step: number }) {
  const host = useRef<HTMLDivElement>(null)
  const world = useRef<{ b: Built; r: THREE.WebGLRenderer } | null>(null)
  const { f, held } = useWorld(step)
  const skins = useMemo(() => {
    const sk = buildSkin(SHOPKEEPER)
    return {
      keeper: { ...sk, top: (<>{sk.top}{APRON}</>) } as Skin,
      cust: CUSTOMERS.map((c) => buildSkin(c)),
    }
  }, [])

  /* the renderer: made once, drawn whenever the frame changes */
  useEffect(() => {
    const el = host.current
    if (!el) return
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    r.setPixelRatio(2)
    r.setSize(W, H, false)
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFShadowMap
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.outputColorSpace = THREE.SRGBColorSpace
    r.domElement.style.width = `${W}px`
    r.domElement.style.height = `${H}px`
    r.domElement.style.display = 'block'
    el.appendChild(r.domElement)
    const b = buildScene()
    world.current = { b, r }
    return () => {
      world.current = null
      b.dispose()
      r.dispose()
      r.forceContextLoss()
      r.domElement.remove()
    }
  }, [])

  /* the people this frame, and the 3D state */
  const cam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 600)
    c.position.copy(CAM_POS)
    c.lookAt(CAM_AIM)
    c.updateMatrixWorld()
    c.updateProjectionMatrix()
    return c
  }, [])
  const project = (p: THREE.Vector3) => {
    const v = p.clone().project(cam)
    return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H, v.z] as const
  }
  const sizeAt = (p: THREE.Vector3, tall = 1.72) => {
    const a = project(p)
    const b2 = project(p.clone().add(new THREE.Vector3(0, tall, 0)))
    return a[1] - b2[1]
  }

  const people: Person[] = []
  const shadowSpots: { p: THREE.Vector3; s: number; on: boolean }[] = []
  /* the shopkeeper, behind the counter; he points down the road as the truck leaves, and hands each bag over */
  {
    const p = new THREE.Vector3(-1.0, 0, -1.25)
    const [x, y, z] = project(p)
    const s = sizeAt(p, 1.74) / 525
    const tl: Timeline = { seed: 7, idle: IDLE, life: 0, expression: clip('happy', 0, false) }
    if (f.sim >= 0) {
      let g: Timeline['gesture']
      if (f.sim >= T_DEPART - 0.6 && f.sim < T_DEPART + 2.2) g = clip('presentRight', T_DEPART - 0.6)
      for (let i = 0; i < 40; i++) {
        const st = serveAt(i) - 0.55
        if (f.sim >= st && f.sim < st + 2.0) g = clip('presentLeft', st)
      }
      tl.gesture = g
    }
    const pose = poseAt(tl, f.now)
    /* the counter hides him below the counter top: clip on its projected front edge */
    const e0 = project(new THREE.Vector3(COUNTER.x0 - 0.06, COUNTER.h, COUNTER.z1 + 0.05))
    const e1 = project(new THREE.Vector3(COUNTER.x1 + 0.06, COUNTER.h, COUNTER.z1 + 0.05))
    people.push({ key: 'keeper', skin: skins.keeper, pose, x, y, s, depth: z, flip: false, bag: false, clipY: [e0[0], e0[1], e1[0], e1[1]], on: true })
  }
  /* the customers: before the third press the queue stands still; after it, the stream */
  const sim = f.sim
  const lo = sim < 0 ? 0 : Math.max(0, Math.floor((sim - SERVE0) / (1.55 + AT_COUNTER)) - 2)
  for (let i = lo; i < lo + 7; i++) {
    const c = custAt(i, sim < 0 ? -1 : sim)
    if (!c.visible) continue
    if (sim < 0 && i > 2) continue
    const [x, y, z] = project(c.pos)
    const cfg = CUSTOMERS[i % CUSTOMERS.length]
    const s = (sizeAt(c.pos, 1.72 * cfg.build.height) / 525) * cfg.build.height
    const servedAt = c.served + 0.3
    const hasBag = sim >= servedAt
    const tl: Timeline = { seed: 11 + i * 5, idle: IDLE, life: 0 }
    if (i === 0 && sim >= T_WALK0 && sim < servedAt) tl.expression = clip('thinking', T_WALK0, false)
    else if (hasBag) tl.expression = clip('happy', servedAt, false)
    else tl.expression = clip('happy', 0, false)
    if (hasBag && sim < servedAt + 1.2) tl.gesture = clip('nod', servedAt)
    const pose = poseAt(tl, f.now + i * 1.7)
    addWalk(pose, c.dist, c.walk)
    if (c.walk > 0.05) {
      pose.headTurn = THREE.MathUtils.clamp(c.dir * 0.4, -0.35, 0.35) * c.walk
    }
    people.push({ key: `c${i}`, skin: skins.cust[i % CUSTOMERS.length], pose, x, y, s, depth: z, flip: c.dir < -0.05 && c.walk > 0.05, bag: hasBag, on: step >= 2 })
    shadowSpots.push({ p: c.pos, s: 0.75, on: step >= 2 })
  }
  people.sort((a, b2) => b2.depth - a.depth)

  /* draw the 3D frame */
  useEffect(() => {
    const w = world.current
    if (!w) return
    const { b, r } = w
    placeTruck(b, f.sim < 0 ? 0 : f.sim)
    placeGoods(b, f)
    b.shadows.forEach((m, k) => {
      const sp = shadowSpots[k]
      m.visible = !!sp && sp.on
      if (sp) {
        m.position.set(sp.p.x + 0.12, 0.07, sp.p.z - 0.1)
        m.scale.set(sp.s, sp.s * 0.75, 1)
      }
    })
    r.render(b.scene, b.camera)
  })

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ width: W, height: H }}>
      <div ref={host} className="absolute inset-0" aria-hidden />
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }} aria-hidden>
        {people.map((p) => {
          const w = 400 * p.s
          const h = 600 * p.s
          const clipPath = p.clipY
            ? (() => {
                const [ax, ay, bx, by] = p.clipY
                const k = (by - ay) / (bx - ax)
                const yAt = (x: number) => ay + (x - ax) * k
                const left = p.x - w / 2
                const top = p.y - 580 * p.s
                return `polygon(0px 0px, ${w}px 0px, ${w}px ${yAt(left + w) - top}px, 0px ${yAt(left) - top}px)`
              })()
            : undefined
          return (
            <div
              key={p.key}
              className="absolute"
              style={{ left: p.x - w / 2, top: p.y - 580 * p.s, width: w, height: h, opacity: p.on ? 1 : 0, transition: held ? 'none' : `opacity 520ms ${EASE}`, clipPath, transform: p.flip ? 'scaleX(-1)' : undefined }}
            >
              <Character pose={p.pose} skin={p.skin} width={w} />
              {p.bag && (
                <svg className="absolute inset-0" width={w} height={h} viewBox="0 0 400 600">
                  {BAG}
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function T20Everyday({ step }: { step: number }) {
  return (
    <div className="relative" style={{ width: W, height: H }}>
      <T20Everyday3D step={step} />
      <Tag x={212} y={12} on={step >= 3} tone="bad">
        Need Not Travel To A Distant Factory Every Time
      </Tag>
      <Tag x={306} y={58}>
        A Distant Factory
      </Tag>
      <Tag x={204} y={96} on={step >= 1} tone="brand">
        Stocks Popular Items
      </Tag>
      <Tag x={204} y={128}>
        A Neighbourhood Shop
      </Tag>
      <Tag x={56} y={232} on={step >= 2}>
        Customers
      </Tag>
    </div>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  F_T20Everyday: T20Everyday,
}

export const slides = {}

export const css = ``
