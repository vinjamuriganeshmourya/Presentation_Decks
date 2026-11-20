import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { World } from './w3'

/**
 * THE SESSION'S REAL-WORLD PROP LIBRARY (user, 2026-11-10: "use realistic, real-time interactions and real-world
 * environments; avoid abstract structures or conceptual representations; only realistic 3D visualizations").
 *
 * Everything here is a physical thing a learner has seen: rooms with walls, skirting, windows and floors; a bank vault
 * with gold and cash, an ATM, a photocopier, a courier van, notice boards, a wardrobe, a loft, a bank building, record
 * shelves, a shredder, a shop counter; and on the cloud side the real kit of a data centre: server racks with status
 * LEDs, a tape library with its robot picker, fibre cables that carry light pulses, laptops and monitors whose screens
 * change. Surfaces are canvas-drawn textures (wood grain, floor tiles, perforated rack doors, screen UIs). No text is
 * drawn anywhere: every screen is shapes only.
 */

/* ------------------------------------------------------------------ textures */

let SEED = 7
const rnd = () => (SEED = (SEED * 16807) % 2147483647) / 2147483647

const TEX = new Map<string, THREE.CanvasTexture>()
export function ctex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, rep: [number, number] = [1, 1]): THREE.CanvasTexture {
  const k = `${key}@${rep[0].toFixed(2)}x${rep[1].toFixed(2)}`
  let t = TEX.get(k)
  if (!t) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    SEED = 7
    draw(c.getContext('2d')!, w, h)
    t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rep[0], rep[1])
    t.anisotropy = 8
    TEX.set(k, t)
  }
  return t
}

const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, dark = true) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = dark ? `rgba(0,0,0,${a * rnd()})` : `rgba(255,255,255,${a * rnd()})`
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2)
  }
}

/** wooden planks, 1 m square: four planks with grain */
const drawWood = (base: string) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  const n = 4
  for (let i = 0; i < n; i++) {
    const y = (i * h) / n
    const tone = 0.88 + rnd() * 0.24
    g.fillStyle = base
    g.fillRect(0, y, w, h / n)
    g.fillStyle = `rgba(${tone > 1 ? 255 : 0},${tone > 1 ? 230 : 0},${tone > 1 ? 200 : 0},${Math.abs(1 - tone) * 0.9})`
    g.fillRect(0, y, w, h / n)
    for (let k = 0; k < 22; k++) {
      g.strokeStyle = `rgba(90,50,20,${0.06 + rnd() * 0.12})`
      g.lineWidth = 0.6 + rnd() * 1.4
      g.beginPath()
      const yy = y + rnd() * (h / n)
      g.moveTo(0, yy)
      for (let x = 0; x <= w; x += 16) g.lineTo(x, yy + Math.sin(x * 0.02 + k) * 2.2)
      g.stroke()
    }
    g.fillStyle = 'rgba(60,30,10,0.45)'
    g.fillRect(0, y, w, 2)
    const cut = rnd() * w
    g.fillRect(cut, y, 2, h / n)
  }
}
/** floor tiles, 1 m square: 2 x 2 tiles with grout */
const drawTiles = (base: string, grout: string, marble = false) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  if (marble)
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(150,140,130,${0.08 + rnd() * 0.12})`
      g.lineWidth = 1 + rnd() * 2
      g.beginPath()
      let x = rnd() * w
      let y = 0
      g.moveTo(x, y)
      while (y < h) {
        x += (rnd() - 0.5) * 30
        y += 10 + rnd() * 20
        g.lineTo(x, y)
      }
      g.stroke()
    }
  noise(g, w, h, 1400, 0.05)
  g.strokeStyle = grout
  g.lineWidth = 3
  for (const v of [0, w / 2, w]) {
    g.beginPath()
    g.moveTo(v, 0)
    g.lineTo(v, h)
    g.stroke()
    g.beginPath()
    g.moveTo(0, v)
    g.lineTo(w, v)
    g.stroke()
  }
}
/** a data centre's raised floor: 60 cm tiles, every other one perforated */
const drawDc = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#D9DEE6'
  g.fillRect(0, 0, w, h)
  const s = w / 2
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      if ((i + j) % 2 === 0) {
        g.fillStyle = '#B9C1CD'
        for (let a = 10; a < s - 6; a += 9) for (let b = 10; b < s - 6; b += 9) g.fillRect(i * s + a, j * s + b, 3, 3)
      }
      g.strokeStyle = '#9EA8B6'
      g.lineWidth = 3
      g.strokeRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3)
    }
}
const drawWall = (base: string) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  noise(g, w, h, 2400, 0.035)
  noise(g, w, h, 1200, 0.05, false)
}
const drawGrass = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#8FC271'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(60,120,40,0.28)' : 'rgba(200,240,160,0.25)'
    g.fillRect(rnd() * w, rnd() * h, 1.5, 3 + rnd() * 3)
  }
}
const drawRoad = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#5E6673'
  g.fillRect(0, 0, w, h)
  noise(g, w, h, 3000, 0.12)
  noise(g, w, h, 1500, 0.08, false)
  g.fillStyle = '#F4F1E6'
  for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 3, y + 8, 6, 34)
  g.fillStyle = '#C9CED6'
  g.fillRect(0, 0, 6, h)
  g.fillRect(w - 6, 0, 6, h)
}
const drawRack = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#1D232D'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#323B49'
  for (let y = 6; y < h; y += 7) for (let x = 6 + ((y / 7) % 2) * 3.5; x < w - 4; x += 7) g.beginPath(), g.arc(x, y, 1.8, 0, Math.PI * 2), g.fill()
}
const drawCork = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#C79A64'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(110,70,30,0.35)' : 'rgba(240,210,160,0.35)'
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2)
  }
}
const drawFacade = (wall: string, glass: string, cols: number, rows: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = wall
  g.fillRect(0, 0, w, h)
  noise(g, w, h, 900, 0.05)
  const cw = w / cols
  const rh = h / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const gr = g.createLinearGradient(0, j * rh, 0, (j + 1) * rh)
      gr.addColorStop(0, glass)
      gr.addColorStop(1, '#2B4D7E')
      g.fillStyle = gr
      g.fillRect(i * cw + cw * 0.18, j * rh + rh * 0.2, cw * 0.64, rh * 0.6)
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.fillRect(i * cw + cw * 0.2, j * rh + rh * 0.22, cw * 0.18, rh * 0.56)
    }
}
const drawHazard = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#F2C230'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#20242B'
  for (let x = -h; x < w; x += 24) {
    g.beginPath()
    g.moveTo(x, h)
    g.lineTo(x + 12, h)
    g.lineTo(x + 12 + h, 0)
    g.lineTo(x + h, 0)
    g.fill()
  }
}

/* screens: shapes only, never text */
export type ScreenKind = 'list' | 'listNew' | 'ok' | 'err' | 'off' | 'pos' | 'atm' | 'dash' | 'dashErr' | 'boot' | 'blank'
const SCREEN: Record<ScreenKind, (g: CanvasRenderingContext2D, w: number, h: number) => void> = {
  blank: (g, w, h) => {
    g.fillStyle = '#EAF1FF'
    g.fillRect(0, 0, w, h)
  },
  off: (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h)
    gr.addColorStop(0, '#20252E')
    gr.addColorStop(1, '#0B0E13')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,0.06)'
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(w * 0.45, 0)
    g.lineTo(w * 0.2, h)
    g.lineTo(0, h)
    g.fill()
  },
  list: (g, w, h) => listUi(g, w, h, false),
  listNew: (g, w, h) => listUi(g, w, h, true),
  ok: (g, w, h) => {
    g.fillStyle = '#EAF8EF'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#2DB36F'
    g.fillRect(0, 0, w, h * 0.12)
    g.beginPath()
    g.arc(w / 2, h * 0.56, h * 0.26, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = h * 0.07
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(w / 2 - h * 0.12, h * 0.57)
    g.lineTo(w / 2 - h * 0.02, h * 0.67)
    g.lineTo(w / 2 + h * 0.14, h * 0.46)
    g.stroke()
  },
  err: (g, w, h) => {
    g.fillStyle = '#FDECEC'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#E04848'
    g.fillRect(0, 0, w, h * 0.12)
    g.beginPath()
    g.arc(w / 2, h * 0.56, h * 0.26, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = h * 0.07
    g.lineCap = 'round'
    const d = h * 0.1
    g.beginPath()
    g.moveTo(w / 2 - d, h * 0.56 - d)
    g.lineTo(w / 2 + d, h * 0.56 + d)
    g.moveTo(w / 2 + d, h * 0.56 - d)
    g.lineTo(w / 2 - d, h * 0.56 + d)
    g.stroke()
  },
  pos: (g, w, h) => {
    g.fillStyle = '#F4F7FC'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#2D63FB'
    g.fillRect(0, 0, w, h * 0.13)
    for (let i = 0; i < 5; i++) {
      g.fillStyle = '#C9D3E4'
      g.fillRect(w * 0.06, h * (0.22 + i * 0.11), w * 0.5, h * 0.05)
      g.fillStyle = '#8FA0BC'
      g.fillRect(w * 0.7, h * (0.22 + i * 0.11), w * 0.2, h * 0.05)
    }
    g.fillStyle = '#2DB36F'
    g.fillRect(w * 0.06, h * 0.8, w * 0.88, h * 0.12)
  },
  atm: (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h)
    gr.addColorStop(0, '#2D63FB')
    gr.addColorStop(1, '#173E9E')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 3; i++) {
      g.fillRect(w * 0.06, h * (0.3 + i * 0.2), w * 0.3, h * 0.12)
      g.fillRect(w * 0.64, h * (0.3 + i * 0.2), w * 0.3, h * 0.12)
    }
  },
  dash: (g, w, h) => dashUi(g, w, h, false),
  dashErr: (g, w, h) => dashUi(g, w, h, true),
  boot: (g, w, h) => {
    g.fillStyle = '#0E1420'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#5B86FF'
    g.lineWidth = h * 0.05
    g.beginPath()
    g.arc(w / 2, h * 0.42, h * 0.14, -Math.PI / 2, Math.PI)
    g.stroke()
    g.fillStyle = '#2A3346'
    g.fillRect(w * 0.2, h * 0.72, w * 0.6, h * 0.06)
  },
}
function listUi(g: CanvasRenderingContext2D, w: number, h: number, fresh: boolean) {
  g.fillStyle = '#F6F8FC'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#2D63FB'
  g.fillRect(0, 0, w, h * 0.13)
  const rows = 5
  for (let i = 0; i < rows; i++) {
    const y = h * (0.2 + i * 0.15)
    const hi = fresh && i === 0
    g.fillStyle = hi ? '#FFE27A' : '#FFFFFF'
    g.fillRect(w * 0.05, y, w * 0.9, h * 0.12)
    g.fillStyle = hi ? '#F2A100' : '#B8C4D8'
    g.fillRect(w * 0.08, y + h * 0.025, h * 0.07, h * 0.07)
    g.fillStyle = hi ? '#C77F00' : '#D3DBE8'
    g.fillRect(w * 0.2, y + h * 0.04, w * (0.45 - (i % 2) * 0.12), h * 0.04)
  }
}
function dashUi(g: CanvasRenderingContext2D, w: number, h: number, bad: boolean) {
  g.fillStyle = '#101826'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 4; i++) {
    g.fillStyle = bad && i === 0 ? '#E04848' : '#1E2A3E'
    g.fillRect(w * (0.05 + i * 0.235), h * 0.08, w * 0.2, h * 0.22)
    g.fillStyle = bad ? (i === 0 ? '#FFFFFF' : '#E0A848') : '#3DD68C'
    g.fillRect(w * (0.08 + i * 0.235), h * 0.18, w * 0.12, h * 0.05)
  }
  g.strokeStyle = bad ? '#E04848' : '#5B86FF'
  g.lineWidth = 3
  g.beginPath()
  for (let x = 0; x <= 40; x++) {
    const px = w * 0.05 + (x / 40) * w * 0.9
    const py = h * 0.7 - Math.sin(x * 0.5) * h * 0.08 - (bad && x > 28 ? -h * 0.18 : 0)
    if (x === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.stroke()
}
export function screenTex(k: ScreenKind): THREE.CanvasTexture {
  return ctex(`screen-${k}`, 256, 160, SCREEN[k])
}
/** a screen material of its own (it changes): unlit, bright */
export function screenMat(k: ScreenKind): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ map: screenTex(k), toneMapped: false })
}
export function setScreen(o: THREE.Object3D | undefined, k: ScreenKind) {
  const s = o?.getObjectByName('screen') as THREE.Mesh | undefined
  const m = s?.material as THREE.MeshBasicMaterial | undefined
  if (m && m.map !== screenTex(k)) m.map = screenTex(k)
}

/* ------------------------------------------------------------------ materials and primitives */

const MAT = new Map<string, THREE.MeshStandardMaterial>()
export function std(color: string, o: { map?: THREE.Texture; rough?: number; metal?: number; key?: string } = {}): THREE.MeshStandardMaterial {
  const k = [color, o.key ?? '', o.rough ?? 0.6, o.metal ?? 0].join('|')
  let m = MAT.get(k)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), map: o.map ?? null, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0 })
    MAT.set(k, m)
  }
  return m
}
/** a light of its own (it blinks): emissive */
export function lamp(color: string, strength = 1.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color), emissiveIntensity: strength, roughness: 0.3 })
}
export function setLamp(m: THREE.Object3D | THREE.Material | undefined, color: string, strength: number) {
  const mat = (m && 'isMaterial' in m ? m : (m as THREE.Mesh | undefined)?.material) as THREE.MeshStandardMaterial | undefined
  if (!mat) return
  mat.color.set(color)
  mat.emissive.set(color)
  mat.emissiveIntensity = strength
}

export const M = {
  steel: () => std('#B8C0CC', { rough: 0.35, metal: 0.65 }),
  darkSteel: () => std('#3A4352', { rough: 0.4, metal: 0.6 }),
  black: () => std('#1C2028', { rough: 0.5 }),
  white: () => std('#F7F8FA', { rough: 0.55 }),
  plastic: (c: string) => std(c, { rough: 0.45 }),
  wood: (c = '#B47A47') => std('#FFFFFF', { map: ctex(`wood-${c}`, 256, 256, drawWood(c)), key: `wood-${c}`, rough: 0.55 }),
  gold: () => std('#E7B53C', { rough: 0.25, metal: 0.9 }),
  glass: () => {
    const k = 'glass'
    let m = MAT.get(k)
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: new THREE.Color('#BFD9F2'), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32 })
      MAT.set(k, m)
    }
    return m
  },
}

function shadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true
      c.receiveShadow = true
    }
  })
  return o
}
/** a box standing on (x, y, z): y is its base */
export function bx(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.015): THREE.Mesh {
  const m = new THREE.Mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)) : new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y + h / 2, z)
  return shadow(m)
}
/** an upright cylinder standing on (x, y, z) */
export function cy(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 28): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
  m.position.set(x, y + h / 2, z)
  return shadow(m)
}
/** a flat face looking +z, centred on (x, y, z) */
export function face(w: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  m.position.set(x, y, z)
  m.receiveShadow = true
  return m
}
export function grp(...o: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group()
  o.forEach((c) => g.add(c))
  return g
}
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z)
  o.rotation.y = ry
  return o
}

/* ------------------------------------------------------------------ the room */

export type FloorKind = 'wood' | 'tile' | 'marble' | 'dc' | 'shop'
function floorMat(k: FloorKind, rx: number, rz: number): THREE.MeshStandardMaterial {
  const map =
    k === 'wood'
      ? ctex('fl-wood', 256, 256, drawWood('#B98756'), [rx, rz])
      : k === 'dc'
        ? ctex('fl-dc', 256, 256, drawDc, [rx / 1.2, rz / 1.2])
        : k === 'marble'
          ? ctex('fl-marble', 256, 256, drawTiles('#EFEBE4', '#CFC8BC', true), [rx / 1.2, rz / 1.2])
          : k === 'shop'
            ? ctex('fl-shop', 256, 256, drawTiles('#E7E1D6', '#C4BBAA'), [rx / 0.8, rz / 0.8])
            : ctex('fl-tile', 256, 256, drawTiles('#E8EBF0', '#C5CCD7'), [rx / 1.0, rz / 1.0])
  return std('#FFFFFF', { map, key: `floor-${k}-${rx}-${rz}`, rough: k === 'marble' ? 0.25 : 0.6 })
}

export const ROOM = { x0: -3.15, x1: 3.15, z0: -2.12, z1: 2.2, h: 2.45 }

/**
 * The room: a textured floor; a back wall and a left wall with skirting; optionally an outdoor strip at the right
 * (grass, with the room's back wall stopping at `outdoor`).
 */
export function room(w: World, o: { floor: FloorKind; wall?: string; outdoor?: number; leftDepth?: number; noLeft?: boolean }) {
  const R = ROOM
  const xin = o.outdoor ?? R.x1
  const fw = xin - R.x0
  const fd = R.z1 - R.z0
  const fl = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.03, fd), floorMat(o.floor, fw, fd))
  fl.position.set(R.x0 + fw / 2, 0.0, R.z0 + fd / 2)
  fl.receiveShadow = true
  w.scene.add(fl)
  if (o.outdoor !== undefined) {
    const gw = R.x1 - xin
    const gm = std('#FFFFFF', { map: ctex('grass', 256, 256, drawGrass, [gw, fd]), key: `grass-${gw}` })
    const gr = new THREE.Mesh(new THREE.BoxGeometry(gw, 0.03, fd), gm)
    gr.position.set(xin + gw / 2, 0.0, R.z0 + fd / 2)
    gr.receiveShadow = true
    w.scene.add(gr)
  }
  const wallM = std('#FFFFFF', { map: ctex(`wall-${o.wall ?? '#EEF1F5'}`, 256, 256, drawWall(o.wall ?? '#EEF1F5'), [2, 1]), key: `wall-${o.wall}` })
  const skirt = std('#FFFFFF', { rough: 0.4 })
  const bw = xin - R.x0
  w.scene.add(bx(bw, R.h, 0.12, wallM, R.x0 + bw / 2, 0, R.z0 - 0.06, 0))
  w.scene.add(bx(bw, 0.1, 0.03, skirt, R.x0 + bw / 2, 0.015, R.z0 + 0.015, 0))
  if (!o.noLeft) {
    const ld = o.leftDepth ?? 3.0
    w.scene.add(bx(0.12, R.h, ld, wallM, R.x0 - 0.06, 0, R.z0 + ld / 2 - 0.12, 0))
    w.scene.add(bx(0.03, 0.1, ld - 0.12, skirt, R.x0 + 0.015, 0.015, R.z0 + ld / 2 - 0.06, 0))
  }
}

/** a window in the back wall: frame, sill, sky glass (its own material, so the sky can change) */
export function windowPane(wd: number, ht: number): THREE.Group {
  const g = new THREE.Group()
  const frame = M.white()
  g.add(bx(wd + 0.1, 0.06, 0.08, frame, 0, -ht / 2 - 0.06, 0.02, 0.01))
  g.add(bx(wd + 0.16, 0.04, 0.16, frame, 0, -ht / 2 - 0.1, 0.06, 0.01))
  g.add(bx(wd + 0.1, 0.06, 0.08, frame, 0, ht / 2, 0.02, 0.01))
  for (const s of [-1, 1]) g.add(bx(0.06, ht + 0.06, 0.08, frame, (s * (wd + 0.04)) / 2, -ht / 2 - 0.03, 0.02, 0.01))
  g.add(bx(0.03, ht, 0.06, frame, 0, -ht / 2, 0.025, 0.005))
  const sky = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9CC8FF'), toneMapped: false })
  const glass = face(wd, ht, sky, 0, 0, 0.0)
  glass.name = 'sky'
  g.add(glass)
  /* a far skyline in the window */
  for (let i = 0; i < 6; i++) {
    const bh = ht * (0.18 + ((i * 37) % 10) / 30)
    const b = face(wd / 7, bh, new THREE.MeshBasicMaterial({ color: new THREE.Color('#7E97BE'), toneMapped: false }), -wd / 2 + (i + 0.8) * (wd / 6.4), -ht / 2 + bh / 2, 0.004)
    b.name = 'city'
    g.add(b)
  }
  const sun = new THREE.Mesh(new THREE.CircleGeometry(ht * 0.11, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE07A'), toneMapped: false }))
  sun.name = 'sun'
  sun.position.set(0, 0, 0.002)
  g.add(sun)
  return g
}

export function plant(h = 0.9): THREE.Group {
  const g = new THREE.Group()
  g.add(cy(0.17, 0.13, 0.32, std('#C8734A', { rough: 0.7 }), 0, 0, 0))
  g.add(cy(0.16, 0.16, 0.02, std('#4A3424'), 0, 0.3, 0))
  const leaf = std('#3E9B57', { rough: 0.55 })
  const leaf2 = std('#5BB86E', { rough: 0.55 })
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), i % 2 ? leaf : leaf2)
    m.scale.set(0.55, 1.5, 0.25)
    m.position.set(Math.cos(a) * 0.1, 0.32 + (h - 0.32) * (0.45 + (i % 3) * 0.18), Math.sin(a) * 0.1)
    m.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5)
    g.add(m)
  }
  return shadow(g)
}

/* ------------------------------------------------------------------ furniture */

export function desk(wd = 1.4, dp = 0.7, ht = 0.75, top: THREE.Material = M.wood()): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(wd, 0.05, dp, top, 0, ht - 0.05, 0, 0.012))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(0.045, ht - 0.05, 0.045, M.darkSteel(), sx * (wd / 2 - 0.06), 0, sz * (dp / 2 - 0.06), 0.01))
  g.add(bx(wd - 0.15, 0.25, 0.02, M.darkSteel(), 0, ht - 0.33, -dp / 2 + 0.07, 0.005))
  return g
}
/** a counter with a front panel and a darker top (a bank, an office, a shop) */
export function counter(wd: number, dp: number, ht: number, body: THREE.Material, topM: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(wd, ht - 0.05, dp, body, 0, 0, 0, 0.02))
  g.add(bx(wd + 0.08, 0.05, dp + 0.1, topM, 0, ht - 0.05, 0.02, 0.012))
  g.add(bx(wd - 0.1, 0.06, 0.02, M.darkSteel(), 0, 0.04, dp / 2 + 0.005, 0.005))
  return g
}
export function monitorR(kind: ScreenKind, sw = 0.62): THREE.Group {
  const g = new THREE.Group()
  const sh = sw * 0.6
  g.add(bx(0.22, 0.02, 0.16, M.black(), 0, 0, 0, 0.01))
  g.add(bx(0.04, 0.2, 0.04, M.black(), 0, 0.02, -0.02, 0.01))
  g.add(bx(sw + 0.04, sh + 0.04, 0.035, M.black(), 0, 0.2, 0, 0.01))
  const s = face(sw, sh, screenMat(kind), 0, 0.22 + sh / 2, 0.019)
  s.name = 'screen'
  g.add(s)
  return g
}
export function laptop(kind: ScreenKind): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.42, 0.02, 0.3, M.steel(), 0, 0, 0, 0.01))
  g.add(face(0.36, 0.16, std('#2A2F38'), 0, 0.021, 0.02).rotateX(-Math.PI / 2))
  const lid = new THREE.Group()
  lid.add(bx(0.42, 0.28, 0.015, M.steel(), 0, 0, 0, 0.008))
  const s = face(0.37, 0.24, screenMat(kind), 0, 0.14, 0.009)
  s.name = 'screen'
  lid.add(s)
  lid.position.set(0, 0.02, -0.15)
  lid.rotation.x = -0.28
  g.add(lid)
  return shadow(g)
}
export function pcTower(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.2, 0.42, 0.42, M.black(), 0, 0, 0, 0.015))
  const l = face(0.02, 0.02, lamp('#3DD68C'), 0.05, 0.36, 0.212)
  l.name = 'led'
  g.add(l)
  g.add(face(0.14, 0.008, std('#4D5666'), 0, 0.3, 0.211))
  return g
}

/* ------------------------------------------------------------------ data centre kit */

/**
 * A 42U-style rack: a cabinet, a perforated glass door, servers with drive bays and a row of status LEDs each
 * (`userData.leds`, blinked by the scene). `fill` = how many servers are installed (from the bottom).
 */
export function rack(o: { units?: number; fill?: number; tone?: 'ssd' | 'hdd' | 'std' } = {}): THREE.Group {
  const n = o.units ?? 8
  const fill = o.fill ?? n
  const g = new THREE.Group()
  const W = 0.64
  const H = 2.0
  const D = 0.9
  g.add(bx(W, H, D, std('#232A35', { rough: 0.45, metal: 0.4 }), 0, 0, 0, 0.02))
  g.add(bx(W - 0.08, 0.08, 0.04, M.darkSteel(), 0, H - 0.1, D / 2 + 0.01, 0.005))
  const leds: THREE.Mesh[] = []
  const units: THREE.Group[] = []
  const uh = (H - 0.3) / n
  for (let i = 0; i < n; i++) {
    const u = new THREE.Group()
    const y = 0.12 + i * uh
    const face0 = o.tone === 'hdd' ? '#4A5466' : o.tone === 'ssd' ? '#2F3B52' : '#3B4558'
    u.add(bx(W - 0.08, uh - 0.025, 0.05, std(face0, { rough: 0.4, metal: 0.5 }), 0, y, D / 2 - 0.02, 0.006))
    const bays = o.tone === 'hdd' ? 4 : 8
    for (let b = 0; b < bays; b++) u.add(face((W - 0.22) / bays - 0.01, uh * 0.5, std(o.tone === 'hdd' ? '#7D879A' : '#59647A', { rough: 0.35, metal: 0.5 }), -W / 2 + 0.11 + ((b + 0.5) * (W - 0.22)) / bays, y + uh * 0.48, D / 2 + 0.006))
    for (let k = 0; k < 3; k++) {
      const led = face(0.022, 0.022, lamp(k === 2 ? '#5B9BFF' : '#3DD68C', 1.2), W / 2 - 0.13 + k * 0.035, y + uh * 0.5, D / 2 + 0.008)
      leds.push(led)
      u.add(led)
    }
    u.visible = i < fill
    u.name = `unit${i}`
    units.push(u)
    g.add(u)
  }
  /* the glass door, slightly ajar so the servers read through it */
  const door = face(W - 0.04, H - 0.06, new THREE.MeshStandardMaterial({ map: ctex('rack-door', 128, 256, drawRack), transparent: true, opacity: 0.38, roughness: 0.3 }), 0, H / 2, D / 2 + 0.04)
  g.add(door)
  const top = face(0.1, 0.05, lamp('#3DD68C', 1.4), 0, H - 0.06, D / 2 + 0.042)
  top.name = 'beacon'
  g.add(top)
  g.userData.leds = leds
  g.userData.units = units
  return shadow(g)
}
/** blink a rack's LEDs: `mode` ok (green flicker), busy (amber), down (red) */
export function blinkRack(r: THREE.Object3D | undefined, t: number, mode: 'ok' | 'busy' | 'down' | 'off' = 'ok') {
  if (!r) return
  const leds = r.userData.leds as THREE.Mesh[] | undefined
  leds?.forEach((l, i) => {
    const ph = Math.sin(t * 40 + i * 2.3) > (i % 3 === 2 ? -0.2 : 0.35)
    if (mode === 'off') setLamp(l, '#2A303A', 0)
    else if (mode === 'down') setLamp(l, '#FF4D4D', ph ? 1.6 : 0.4)
    else if (mode === 'busy') setLamp(l, i % 3 === 2 ? '#5B9BFF' : '#FFB020', ph ? 1.5 : 0.3)
    else setLamp(l, i % 3 === 2 ? '#5B9BFF' : '#3DD68C', ph ? 1.4 : 0.35)
  })
  const b = r.getObjectByName('beacon')
  if (b) setLamp(b, mode === 'down' ? '#FF4D4D' : mode === 'busy' ? '#FFB020' : mode === 'off' ? '#2A303A' : '#3DD68C', mode === 'off' ? 0 : 1.5)
}

/** a tape library: a wide cabinet, a glass front, walls of cartridges, the robot picker ('picker') on its rails */
export function tapeLibrary(): THREE.Group {
  const g = new THREE.Group()
  const W = 1.6
  const H = 1.9
  const D = 0.8
  const body = std('#2B323E', { rough: 0.45, metal: 0.35 })
  /* the cabinet as five panels, open at the front so the inside reads */
  g.add(bx(W, H, 0.04, body, 0, 0, -D / 2, 0.005))
  g.add(bx(0.06, H, D, body, -W / 2, 0, 0, 0.005))
  g.add(bx(0.06, H, D, body, W / 2, 0, 0, 0.005))
  g.add(bx(W, 0.08, D, body, 0, H - 0.08, 0, 0.005))
  g.add(bx(W, 0.1, D, body, 0, 0, 0, 0.005))
  const tints = ['#2D63FB', '#E8655A', '#3DBB7A', '#F2C14E', '#8A5CF6', '#EAEFF7']
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 12; c++) g.add(bx(0.1, 0.17, 0.12, std(tints[(r * 5 + c * 3) % tints.length], { rough: 0.45 }), -W / 2 + 0.14 + c * 0.112, 0.2 + r * 0.22, -D / 2 + 0.1, 0.01))
  /* the drive bays at the left side */
  for (let k = 0; k < 2; k++) {
    g.add(bx(0.22, 0.12, 0.3, std('#141920'), -W / 2 + 0.17, 0.3 + k * 0.22, 0.05, 0.01))
    const l = face(0.02, 0.02, lamp('#3DD68C'), -W / 2 + 0.25, 0.36 + k * 0.22, 0.201)
    l.name = `drive${k}`
    g.add(l)
  }
  /* rails and the picker */
  g.add(bx(W - 0.1, 0.03, 0.03, M.steel(), 0, H - 0.2, 0.12, 0.005))
  g.add(bx(W - 0.1, 0.03, 0.03, M.steel(), 0, 0.12, 0.12, 0.005))
  const picker = new THREE.Group()
  picker.add(bx(0.04, H - 0.32, 0.04, M.steel(), 0, 0.14, 0.12, 0.005))
  const hand = new THREE.Group()
  hand.add(bx(0.2, 0.12, 0.22, std('#F2A100', { rough: 0.4 }), 0, -0.06, 0.02, 0.01))
  const held = bx(0.1, 0.17, 0.12, std('#2D63FB'), 0, -0.04, -0.04, 0.01)
  held.name = 'carried'
  held.visible = false
  hand.add(held)
  hand.name = 'hand'
  hand.position.y = 1.0
  picker.add(hand)
  picker.name = 'picker'
  g.add(picker)
  g.add(face(W - 0.06, H - 0.16, M.glass(), 0, H / 2, D / 2))
  const bc = face(0.12, 0.05, lamp('#3DD68C'), W / 2 - 0.15, H - 0.04, D / 2 + 0.002)
  bc.name = 'beacon'
  g.add(bc)
  return shadow(g)
}
/** move the picker: u = 0..1 across, v = 0..1 up */
export function pick(lib: THREE.Object3D | undefined, u: number, v: number, carrying: boolean) {
  const p = lib?.getObjectByName('picker')
  const h = lib?.getObjectByName('hand')
  const c = lib?.getObjectByName('carried')
  if (p) p.position.x = -0.62 + u * 1.24
  if (h) h.position.y = 0.3 + v * 1.35
  if (c) c.visible = carrying
}

/** a fibre / power cable along the floor through the given points, its own pulses riding it */
export function cable(points: [number, number, number][], color = '#2B3442', r = 0.022): { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3 } {
  const curve = new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(...q)), false, 'catmullrom', 0.2)
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, r, 8, false), std(color, { rough: 0.5 }))
  mesh.castShadow = true
  return { mesh, curve }
}
/** a light pulse in a fibre (a small bright bead with a soft glow) */
export function pulse(color: string): THREE.Group {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), toneMapped: false })))
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false }))
  g.add(halo)
  g.visible = false
  return g
}
export function ride(p: THREE.Object3D | undefined, c: THREE.CatmullRomCurve3 | undefined, k: number, on: boolean) {
  if (!p || !c) return
  p.visible = on && k >= 0 && k <= 1
  if (p.visible) p.position.copy(c.getPointAt(Math.min(1, Math.max(0, k)))).add(new THREE.Vector3(0, 0.03, 0))
}
export function tint(p: THREE.Object3D | undefined, color: string) {
  p?.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (m && 'color' in m) m.color.set(color)
  })
}

/** a low, wide data centre building with roof chillers (the far region) */
export function dataCentre(): THREE.Group {
  const g = new THREE.Group()
  const fac = std('#FFFFFF', { map: ctex('dc-fac', 256, 128, drawFacade('#D6DCE5', '#9EB6D8', 6, 2)), key: 'dc-fac' })
  g.add(bx(1.6, 0.9, 1.0, fac, 0, 0, 0, 0.02))
  for (let i = 0; i < 3; i++) {
    g.add(bx(0.32, 0.16, 0.32, M.steel(), -0.5 + i * 0.5, 0.9, -0.1, 0.02))
    g.add(cy(0.11, 0.11, 0.02, std('#2A303A'), -0.5 + i * 0.5, 1.06, -0.1))
  }
  g.add(bx(0.32, 0.5, 0.04, std('#2A303A'), 0.45, 0, 0.5, 0.005))
  const l = face(0.08, 0.04, lamp('#3DD68C'), 0.45, 0.6, 0.53)
  l.name = 'beacon'
  g.add(l)
  return shadow(g)
}
/** an office building (a branch) */
export function officeBlock(wd = 1.1, ht = 1.9, dp = 0.9, wall = '#C9D3E2'): THREE.Group {
  const g = new THREE.Group()
  const fac = std('#FFFFFF', { map: ctex(`fac-${wall}`, 256, 256, drawFacade(wall, '#A9C4EA', 4, 6)), key: `fac-${wall}` })
  g.add(bx(wd, ht, dp, fac, 0, 0, 0, 0.02))
  g.add(bx(wd + 0.06, 0.06, dp + 0.06, std('#8E99AB'), 0, ht, 0, 0.01))
  g.add(bx(0.3, 0.42, 0.04, std('#3A4352'), 0, 0, dp / 2 + 0.005, 0.005))
  g.add(bx(0.5, 0.04, 0.2, std('#8E99AB'), 0, 0.46, dp / 2 + 0.08, 0.005))
  return shadow(g)
}
/** a bank: steps, four columns, a pediment; a wall of steel lockers behind the columns */
export function bankBuilding(): THREE.Group {
  const g = new THREE.Group()
  const stone = std('#EFE9DC', { rough: 0.7 })
  g.add(bx(1.7, 0.08, 1.3, stone, 0, 0, 0.05, 0.01))
  g.add(bx(1.6, 0.06, 1.2, stone, 0, 0.08, 0.05, 0.01))
  g.add(bx(1.5, 1.35, 0.9, std('#E4DCCB', { rough: 0.7 }), 0, 0.14, -0.15, 0.01))
  /* lockers on the front wall */
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      g.add(bx(0.17, 0.17, 0.02, M.steel(), -0.36 + c * 0.18, 0.4 + r * 0.19, 0.31, 0.008))
      g.add(cy(0.012, 0.012, 0.01, M.gold(), -0.36 + c * 0.18 + 0.05, 0.48 + r * 0.19, 0.325))
    }
  for (let i = 0; i < 4; i++) g.add(cy(0.06, 0.07, 1.3, std('#FBF8F1', { rough: 0.5 }), -0.6 + i * 0.4, 0.14, 0.52, 20))
  g.add(bx(1.6, 0.1, 1.25, stone, 0, 1.44, 0.05, 0.01))
  const ped = new THREE.Shape()
  ped.moveTo(-0.82, 0)
  ped.lineTo(0.82, 0)
  ped.lineTo(0, 0.38)
  ped.closePath()
  const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(ped, { depth: 1.2, bevelEnabled: false }), stone)
  pm.position.set(0, 1.54, -0.55)
  g.add(pm)
  return shadow(g)
}

/* ------------------------------------------------------------------ everyday kit */

/** a bank vault set in the back wall: a steel frame, the opening with shelves of gold and cash, the round door open */
export function vault(): THREE.Group {
  const g = new THREE.Group()
  const steel = M.steel()
  const inside = std('#4A5262', { rough: 0.5, metal: 0.4 })
  g.add(bx(1.5, 1.55, 0.06, inside, 0, 0.05, -0.55, 0.005))
  g.add(bx(0.06, 1.55, 0.6, inside, -0.72, 0.05, -0.27, 0.005))
  g.add(bx(0.06, 1.55, 0.6, inside, 0.72, 0.05, -0.27, 0.005))
  g.add(bx(1.5, 0.06, 0.6, inside, 0, 1.55, -0.27, 0.005))
  g.add(bx(1.5, 0.06, 0.6, inside, 0, 0.05, -0.27, 0.005))
  /* the frame */
  g.add(bx(1.7, 0.12, 0.14, steel, 0, 1.6, 0.03, 0.01))
  g.add(bx(1.7, 0.12, 0.14, steel, 0, 0.0, 0.03, 0.01))
  for (const s of [-1, 1]) g.add(bx(0.12, 1.72, 0.14, steel, s * 0.79, 0, 0.03, 0.01))
  /* shelves: gold bars above, cash bundles below */
  for (const y of [0.55, 1.05]) g.add(bx(1.38, 0.04, 0.5, M.darkSteel(), 0, y, -0.28, 0.005))
  const gold = M.gold()
  for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) g.add(bx(0.17, 0.07, 0.09, gold, -0.5 + i * 0.2, 1.09 + k * 0.07, -0.3 + (k ? 0.05 : -0.05), 0.01))
  const cash = std('#5FA36A', { rough: 0.7 })
  const band = std('#F4EFE0', { rough: 0.6 })
  for (let i = 0; i < 5; i++)
    for (let k = 0; k < 3; k++) {
      g.add(bx(0.2, 0.06, 0.1, cash, -0.48 + i * 0.24, 0.59 + k * 0.062, -0.3, 0.008))
      g.add(bx(0.04, 0.062, 0.102, band, -0.48 + i * 0.24, 0.59 + k * 0.062, -0.3, 0.004))
    }
  for (let i = 0; i < 4; i++) g.add(bx(0.24, 0.2, 0.3, std('#7A6450', { rough: 0.8 }), -0.45 + i * 0.3, 0.09, -0.3, 0.02))
  /* the inside light */
  const glowP = face(1.3, 0.04, lamp('#FFF2C7', 1.2), 0, 1.5, -0.2)
  glowP.rotation.x = Math.PI / 2
  glowP.name = 'light'
  g.add(glowP)
  /* the round door, open on its hinge at the right */
  const door = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.2, 48), steel)
  disc.rotation.x = Math.PI / 2
  door.add(disc)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 10, 48), M.darkSteel())
  ring.position.z = 0.105
  door.add(ring)
  const wheel = new THREE.Group()
  for (let k = 0; k < 3; k++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10), M.darkSteel())
    s.rotation.z = (k * Math.PI) / 3
    wheel.add(s)
  }
  wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20).rotateX(Math.PI / 2), M.darkSteel()))
  wheel.position.z = 0.16
  wheel.name = 'wheel'
  door.add(wheel)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12).rotateX(Math.PI / 2), M.steel())
    b.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.12)
    door.add(b)
  }
  door.traverse((c) => {
    c.castShadow = true
  })
  const hinge = new THREE.Group()
  door.position.set(-0.78, 0, 0)
  hinge.add(door)
  hinge.position.set(0.86, 0.82, 0.12)
  hinge.rotation.y = 1.85
  hinge.name = 'door'
  g.add(hinge)
  return shadow(g)
}
/** a stack of cash bundles (the money arriving) */
export function cashBundle(): THREE.Group {
  return grp(bx(0.2, 0.06, 0.1, std('#5FA36A', { rough: 0.7 }), 0, 0, 0, 0.008), bx(0.04, 0.062, 0.102, std('#F4EFE0'), 0, 0, 0, 0.004))
}
/** an ATM kiosk: a coloured header, the screen, a keypad, card and cash slots, a lamp on top */
export function atm(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.78, 1.55, 0.62, std('#C9D1DC', { rough: 0.35, metal: 0.5 }), 0, 0, 0, 0.03))
  g.add(bx(0.8, 0.28, 0.66, std('#2D63FB', { rough: 0.35 }), 0, 1.55, 0.02, 0.03))
  g.add(bx(0.62, 0.48, 0.12, std('#30394A', { rough: 0.4 }), 0, 0.98, 0.3, 0.02))
  const s = face(0.46, 0.32, screenMat('atm'), 0, 1.22, 0.362)
  s.name = 'screen'
  g.add(s)
  const shelf = bx(0.62, 0.04, 0.24, std('#30394A'), 0, 0.88, 0.38, 0.01)
  g.add(shelf)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.add(bx(0.06, 0.012, 0.045, std(r === 3 ? ['#E8655A', '#F2C14E', '#3DBB7A'][c] : '#E3E8EF'), -0.1 + c * 0.08, 0.92, 0.33 + r * 0.055, 0.005))
  g.add(bx(0.14, 0.02, 0.02, std('#0E1116'), 0.22, 0.98, 0.42, 0.003))
  g.add(bx(0.4, 0.035, 0.03, std('#0E1116'), 0, 0.62, 0.315, 0.004))
  const l = cy(0.06, 0.06, 0.1, lamp('#3DD68C', 1.0), 0.28, 1.83, 0.1, 20)
  l.name = 'lamp'
  g.add(l)
  return shadow(g)
}
/** a queue post with a belt (a bank lobby) */
export function stanchions(n: number, gap: number): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    g.add(cy(0.12, 0.12, 0.03, M.steel(), i * gap, 0, 0))
    g.add(cy(0.025, 0.025, 0.9, M.steel(), i * gap, 0, 0, 12))
    if (i < n - 1) g.add(bx(gap, 0.05, 0.01, std('#B03A3A'), i * gap + gap / 2, 0.8, 0, 0))
  }
  return g
}

/** a photocopier: body, paper trays, a lid, a control panel; the scan light ('scan') under the lid */
export function photocopier(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.8, 0.85, 0.65, std('#E9ECF1', { rough: 0.45 }), 0, 0, 0, 0.03))
  for (let i = 0; i < 2; i++) g.add(bx(0.7, 0.02, 0.02, std('#9AA4B4'), 0, 0.2 + i * 0.22, 0.33, 0.005))
  g.add(bx(0.7, 0.04, 0.5, std('#2A303A'), 0, 0.85, 0.0, 0.01))
  const scan = face(0.66, 0.06, lamp('#BFE3FF', 0.3), 0, 0.893, 0)
  scan.rotation.x = -Math.PI / 2
  scan.name = 'scan'
  g.add(scan)
  g.add(bx(0.76, 0.06, 0.58, std('#D5DAE3', { rough: 0.45 }), 0, 0.9, 0.0, 0.02))
  const panel = bx(0.32, 0.03, 0.16, std('#2A303A'), 0.22, 0.97, 0.26, 0.01)
  panel.rotation.x = 0.3
  g.add(panel)
  g.add(face(0.12, 0.07, lamp('#7FB2FF', 0.6), 0.2, 0.99, 0.35).rotateX(-1.27))
  g.add(bx(0.36, 0.02, 0.3, std('#D5DAE3'), -0.52, 0.58, 0, 0.005))
  return shadow(g)
}
/** a courier van, nose along +x */
export function van(): THREE.Group {
  const g = new THREE.Group()
  const paint = std('#F4F6FA', { rough: 0.35, metal: 0.2 })
  g.add(bx(0.7, 0.44, 0.4, paint, -0.08, 0.1, 0, 0.05))
  g.add(bx(0.28, 0.3, 0.38, paint, 0.36, 0.1, 0, 0.05))
  g.add(bx(0.7, 0.07, 0.402, std('#E57A1E', { rough: 0.4 }), -0.08, 0.3, 0, 0.005))
  const glassM = std('#5D7FA8', { rough: 0.1, metal: 0.3 })
  g.add(face(0.2, 0.15, glassM, 0.501, 0.32, 0).rotateY(Math.PI / 2))
  for (const s of [-1, 1]) {
    const f = face(0.17, 0.13, glassM, 0.37, 0.32, s * 0.191)
    if (s < 0) f.rotateY(Math.PI)
    g.add(f)
  }
  for (const [x, z] of [[-0.26, 0.19], [-0.26, -0.19], [0.34, 0.19], [0.34, -0.19]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 20).rotateX(Math.PI / 2), std('#1B1F26'))
    wh.position.set(x, 0.09, z)
    g.add(wh)
  }
  g.add(face(0.05, 0.04, lamp('#FFF3C2', 1), 0.501, 0.17, 0.13).rotateY(Math.PI / 2))
  g.add(face(0.05, 0.04, lamp('#FFF3C2', 1), 0.501, 0.17, -0.13).rotateY(Math.PI / 2))
  return shadow(g)
}
export function roadStrip(len: number, wd = 0.55): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.02, len), std('#FFFFFF', { map: ctex('road', 128, 256, drawRoad, [1, len / 1.2]), key: `road-${len}` }))
  m.receiveShadow = true
  return m
}

/** a notice board: cork in a frame; papers named note0..note(n-1) */
export function noticeBoard(wd: number, ht: number, n: number, fresh = '#FFE27A'): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(wd + 0.08, ht + 0.08, 0.04, M.wood('#8A5A32'), 0, -0.04, -0.02, 0.01))
  g.add(face(wd, ht, std('#FFFFFF', { map: ctex('cork', 128, 128, drawCork, [wd, ht]), key: `cork-${wd}` }), 0, ht / 2, 0.002))
  const cols = n
  for (let i = 0; i < n; i++) {
    const last = i === n - 1
    const p = new THREE.Group()
    p.add(face(wd / (cols + 1.2), ht * 0.62, std(last ? fresh : '#FFFFFF', { rough: 0.8 }), 0, 0, 0))
    for (let k = 0; k < 4; k++) p.add(face(wd / (cols + 1.2) * 0.7, 0.012, std('#9AA6B8'), 0, ht * 0.2 - k * 0.07, 0.001))
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), std('#D84040'))
    pin.position.set(0, ht * 0.28, 0.01)
    p.add(pin)
    p.position.set(-wd / 2 + ((i + 0.6) * wd) / (cols + 0.2), ht / 2, 0.006)
    p.rotation.z = ((i * 7) % 5 - 2) * 0.02
    p.name = `note${i}`
    g.add(p)
  }
  return g
}
export function wallClock(r = 0.2): THREE.Group {
  const clock = new THREE.Group()
  const faceM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 40).rotateX(Math.PI / 2), std('#FFFFFF', { rough: 0.4 }))
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.11, 12, 40), std('#2A303A', { rough: 0.4, metal: 0.5 }))
  const hh = new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 0.55, 0.01).translate(0, r * 0.25, 0), std('#1F2D44'))
  hh.name = 'hour'
  const mh = new THREE.Mesh(new THREE.BoxGeometry(r * 0.07, r * 0.82, 0.01).translate(0, r * 0.38, 0), std('#1F2D44'))
  mh.name = 'min'
  const sh = new THREE.Mesh(new THREE.BoxGeometry(r * 0.03, r * 0.85, 0.01).translate(0, r * 0.35, 0), std('#D84040'))
  sh.name = 'sec'
  hh.position.z = 0.03
  mh.position.z = 0.035
  sh.position.z = 0.04
  clock.add(faceM, rim, hh, mh, sh)
  for (let i = 0; i < 12; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.012, i % 3 ? 0.025 : 0.045, 0.005), std('#1F2D44'))
    const a = (i / 12) * Math.PI * 2
    tk.position.set(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.03)
    tk.rotation.z = -a
    clock.add(tk)
  }
  return shadow(clock)
}
export function spinClock(c: THREE.Object3D | undefined, k: number) {
  if (!c) return
  const set = (n: string, v: number) => {
    const o = c.getObjectByName(n)
    if (o) o.rotation.z = v
  }
  set('hour', -k * Math.PI * 2 * 0.25 - 1.1)
  set('min', -k * Math.PI * 2 * 3)
  set('sec', -k * Math.PI * 2 * 30)
}
/** a wall calendar: a coloured header with rings, a page of day squares; the page ('page') flips about its top */
export function calendar(tint0: string): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.56, 0.66, 0.03, std('#FFFFFF', { rough: 0.8 }), 0, -0.66, 0, 0.01))
  g.add(bx(0.56, 0.13, 0.04, std(tint0, { rough: 0.5 }), 0, -0.13, 0.005, 0.01))
  for (let i = 0; i < 4; i++) g.add(cy(0.012, 0.012, 0.06, M.steel(), -0.18 + i * 0.12, -0.04, 0.03, 10))
  const page = new THREE.Group()
  page.name = 'page'
  page.add(face(0.5, 0.48, std('#FFFFFF', { rough: 0.8 }), 0, -0.24, 0))
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) page.add(face(0.07, 0.07, std(r === 3 && c === 4 ? tint0 : '#DCE4F2'), -0.18 + c * 0.09, -0.08 - r * 0.1, 0.002))
  page.position.set(0, -0.14, 0.03)
  g.add(page)
  return g
}

export function wardrobe(): THREE.Group {
  const g = new THREE.Group()
  const wood = M.wood('#A9733F')
  const inner = std('#E9DCC8', { rough: 0.8 })
  /* 2026-11-10 (user, slide 28: daily-use clothes inside the cupboard): a hollow carcass, so what hangs inside shows
     when the door swings: back, sides, base, top, a rail with the everyday shirts, a shelf of folded clothes */
  g.add(bx(1.1, 2.0, 0.03, wood, 0, 0, -0.285, 0.005))
  g.add(bx(1.06, 1.94, 0.01, inner, 0, 0.03, -0.265, 0))
  for (const s of [-1, 1]) g.add(bx(0.04, 2.0, 0.6, wood, s * 0.53, 0, 0, 0.005))
  g.add(bx(1.1, 0.06, 0.6, wood, 0, 0, 0, 0.005))
  g.add(bx(1.1, 0.04, 0.6, wood, 0, 1.96, 0, 0.005))
  g.add(bx(0.03, 1.9, 0.56, wood, 0.0, 0.05, 0, 0.005))
  g.add(bx(1.14, 0.06, 0.64, M.wood('#8A5A32'), 0, 2.0, 0, 0.01))
  /* left half: the rail and the shirts on hangers */
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 10).rotateZ(Math.PI / 2), M.steel())
  rail.position.set(-0.27, 1.72, 0)
  g.add(rail)
  const tints = ['#2D63FB', '#E8655A', '#F4F1E6', '#3DBB7A', '#F2C14E', '#5B86FF']
  for (let i = 0; i < 6; i++) {
    const x = -0.47 + i * 0.075
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 12, Math.PI * 1.4), M.steel())
    hook.position.set(x, 1.735, 0)
    hook.rotation.y = Math.PI / 2
    g.add(hook)
    g.add(bx(0.012, 0.03, 0.3, M.darkSteel(), x, 1.67, 0, 0.004))
    g.add(bx(0.045, 0.62, 0.36, std(tints[i], { rough: 0.9 }), x, 1.03, 0, 0.02))
    g.add(bx(0.047, 0.08, 0.08, std(tints[i], { rough: 0.9 }), x, 1.6, 0.0, 0.02))
  }
  /* right half: shelves of folded clothes */
  for (const y of [0.55, 1.05, 1.5]) {
    g.add(bx(0.5, 0.025, 0.52, wood, 0.27, y, 0, 0.004))
    for (let k = 0; k < 3; k++) g.add(bx(0.38, 0.07, 0.34, std(tints[(k + y * 10) % 6 | 0], { rough: 0.9 }), 0.27, y + 0.025 + k * 0.072, 0, 0.02))
  }
  g.add(bx(0.24, 0.3, 0.36, std('#3A4352', { rough: 0.6 }), -0.36, 0.06, 0, 0.03))
  g.add(bx(0.2, 0.3, 0.36, std('#8E3B46', { rough: 0.6 }), -0.12, 0.06, 0, 0.03))
  const doorL = new THREE.Group()
  doorL.add(bx(0.53, 1.9, 0.03, M.wood('#B57E48'), 0.265, 0, 0, 0.01))
  doorL.add(cy(0.015, 0.015, 0.16, M.gold(), 0.48, 0.92, 0.03, 10))
  doorL.position.set(-0.54, 0.05, 0.31)
  doorL.name = 'doorL'
  g.add(doorL)
  const doorR = new THREE.Group()
  doorR.add(bx(0.53, 1.9, 0.03, M.wood('#B57E48'), -0.265, 0, 0, 0.01))
  doorR.add(cy(0.015, 0.015, 0.16, M.gold(), -0.48, 0.92, 0.03, 10))
  doorR.position.set(0.54, 0.05, 0.31)
  g.add(doorR)
  return shadow(g)
}
/**
 * A storage box for winter clothes (slide 28): a ribbed body with handles, knitted sweaters folded inside, a lid
 * ('lid') hinged at the back edge that the scene opens.
 */
export function winterBox(): THREE.Group {
  const g = new THREE.Group()
  const body = std('#5B86FF', { rough: 0.4 })
  const W = 0.78
  const H = 0.32
  const D = 0.5
  g.add(bx(W, 0.03, D, body, 0, 0, 0, 0.01))
  for (const s of [-1, 1]) {
    g.add(bx(W, H, 0.03, body, 0, 0, (s * (D - 0.03)) / 2, 0.01))
    g.add(bx(0.03, H, D, body, (s * (W - 0.03)) / 2, 0, 0, 0.01))
    g.add(bx(0.12, 0.04, 0.02, std('#2A3A6A'), s * 0.22, H - 0.1, D / 2 + 0.006, 0.01))
  }
  for (let k = 0; k < 3; k++) g.add(bx(W + 0.004, 0.012, D + 0.004, std('#4A73E8', { rough: 0.4 }), 0, 0.07 + k * 0.08, 0, 0.004))
  /* the sweaters inside: thick knit colours, folded */
  const knit = ['#C8453C', '#F1E6D2', '#2F6E57']
  for (let k = 0; k < 3; k++) g.add(bx(0.34, 0.08, 0.38, std(knit[k], { rough: 1 }), k === 2 ? 0.17 : -0.17, 0.03 + (k === 2 ? 0 : k * 0.085), 0, 0.03))
  g.add(bx(0.34, 0.08, 0.38, std(knit[0], { rough: 1 }), 0.17, 0.115, 0, 0.03))
  const lid = new THREE.Group()
  lid.add(bx(W + 0.04, 0.05, D + 0.04, std('#2D63FB', { rough: 0.35 }), 0, 0, D / 2 + 0.02, 0.015))
  lid.position.set(0, H, -D / 2 - 0.02)
  lid.name = 'lid'
  g.add(lid)
  return shadow(g)
}
/** a small wooden step stool */
export function stool(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.42, 0.04, 0.32, M.wood('#B47A47'), 0, 0.36, 0, 0.01))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(0.04, 0.36, 0.04, M.wood('#8A5A32'), sx * 0.17, 0, sz * 0.12, 0.005))
  g.add(bx(0.36, 0.03, 0.04, M.wood('#8A5A32'), 0, 0.15, 0.12, 0.005))
  return shadow(g)
}
export function suitcase(color = '#E57A1E'): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.8, 0.4, 0.42, std(color, { rough: 0.35 }), 0, 0, 0, 0.07))
  for (const s of [-1, 1]) g.add(bx(0.03, 0.41, 0.43, std('#5A2E10'), s * 0.22, 0, 0, 0.005))
  g.add(bx(0.24, 0.05, 0.05, std('#2A303A'), 0, 0.42, 0, 0.02))
  return shadow(g)
}
export function ladder(ht: number): THREE.Group {
  const g = new THREE.Group()
  const m = M.steel()
  for (const s of [-0.22, 0.22]) g.add(bx(0.04, ht, 0.05, m, s, 0, 0, 0.01))
  for (let i = 0; i < Math.floor(ht / 0.3); i++) g.add(bx(0.44, 0.03, 0.05, m, 0, 0.25 + i * 0.3, 0, 0.005))
  return shadow(g)
}
export function bed(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(1.0, 0.3, 1.8, M.wood('#9B6A3C'), 0, 0, 0, 0.03))
  g.add(bx(0.96, 0.18, 1.74, std('#F4F2EE', { rough: 0.9 }), 0, 0.3, 0, 0.06))
  g.add(bx(0.98, 0.1, 1.1, std('#5B86FF', { rough: 0.9 }), 0, 0.45, 0.32, 0.05))
  g.add(bx(0.6, 0.12, 0.3, std('#FFFFFF', { rough: 0.9 }), 0, 0.48, -0.66, 0.06))
  g.add(bx(1.0, 0.75, 0.06, M.wood('#8A5A32'), 0, 0, -0.9, 0.02))
  return shadow(g)
}
export function rug(wd: number, dp: number, color: string): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(wd, 0.012, dp, 2, 0.005), std(color, { rough: 0.95 }))
  m.receiveShadow = true
  return m
}
/** a record-room shelving unit: steel uprights, four shelves of box files and binders */
export function shelving(wd = 2.2, ht = 1.95): THREE.Group {
  const g = new THREE.Group()
  const m = std('#7D8798', { rough: 0.4, metal: 0.6 })
  for (const s of [-1, 1]) g.add(bx(0.04, ht, 0.45, m, (s * wd) / 2, 0, 0, 0.005))
  const tints = ['#2D63FB', '#E8655A', '#3DBB7A', '#F2C14E', '#8A5CF6', '#F4F1E6', '#5B86FF']
  for (let r = 0; r < 4; r++) {
    const y = 0.08 + r * 0.47
    g.add(bx(wd, 0.03, 0.45, m, 0, y, 0, 0.005))
    let x = -wd / 2 + 0.06
    let i = 0
    while (x < wd / 2 - 0.12) {
      const bw = 0.07 + ((i * 13 + r * 7) % 5) * 0.012
      const bh = 0.3 + ((i * 7 + r) % 4) * 0.025
      g.add(bx(bw, bh, 0.32, std(tints[(i + r * 3) % tints.length], { rough: 0.6 }), x + bw / 2, y + 0.03, 0.02, 0.008))
      x += bw + 0.012
      i++
    }
  }
  return shadow(g)
}
/** a document stack on a desk */
export function papers(n = 5): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) g.add(bx(0.32, 0.018, 0.42, std(i % 2 ? '#FFFFFF' : '#F3EEDC', { rough: 0.9 }), (i % 3) * 0.006, i * 0.019, (i % 2) * 0.008, 0.003))
  return g
}
export function folder(color = '#F2C14E'): THREE.Group {
  return grp(bx(0.3, 0.035, 0.4, std(color, { rough: 0.7 }), 0, 0, 0, 0.006), bx(0.28, 0.01, 0.38, std('#FFFFFF'), 0, 0.03, 0, 0.002))
}
/** an office shredder on its bin, the slot at the top ('slot' light) */
export function shredder(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.62, 0.7, 0.42, std('#2F3743', { rough: 0.45 }), 0, 0, 0, 0.03))
  g.add(face(0.5, 0.42, M.glass(), 0, 0.3, 0.212))
  for (let i = 0; i < 10; i++) g.add(bx(0.012, 0.2 + (i % 4) * 0.04, 0.01, std('#FFFFFF', { rough: 0.9 }), -0.2 + i * 0.045, 0.1, 0.12, 0.002))
  g.add(bx(0.66, 0.16, 0.46, std('#1F252E', { rough: 0.4 }), 0, 0.7, 0, 0.03))
  g.add(bx(0.42, 0.012, 0.03, std('#05070A'), 0, 0.86, 0, 0.002))
  const l = face(0.03, 0.03, lamp('#3DD68C'), 0.24, 0.79, 0.232)
  l.name = 'slot'
  g.add(l)
  return shadow(g)
}
/** an industrial media shredder for drives and tapes: hazard stripes, a feed throat, a status lamp */
export function mediaShredder(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.8, 0.95, 0.7, std('#5C6677', { rough: 0.4, metal: 0.5 }), 0, 0, 0, 0.03))
  g.add(face(0.8, 0.12, std('#FFFFFF', { map: ctex('hazard', 256, 32, drawHazard), key: 'hazard' }), 0, 0.12, 0.352))
  g.add(bx(0.5, 0.25, 0.4, std('#3A4352', { rough: 0.4, metal: 0.5 }), 0, 0.95, 0, 0.02))
  g.add(bx(0.32, 0.02, 0.1, std('#05070A'), 0, 1.2, 0, 0.003))
  g.add(bx(0.4, 0.3, 0.3, std('#2B323E'), 0, 0, 0.5, 0.02))
  const l = cy(0.05, 0.05, 0.08, lamp('#FF7A1A', 0.4), 0.3, 0.95, 0.25, 16)
  l.name = 'lamp'
  g.add(l)
  return shadow(g)
}
/** a backup appliance: a short cabinet of drive sleds with LEDs (userData.leds) */
export function backupBox(): THREE.Group {
  const r = rack({ units: 4, tone: 'hdd' })
  r.scale.set(1, 0.55, 0.9)
  return r
}
/** a cash register */
export function register(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.42, 0.12, 0.42, std('#2A303A'), 0, 0, 0, 0.02))
  g.add(bx(0.38, 0.1, 0.18, std('#3A4352'), 0, 0.12, 0.06, 0.02))
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.add(bx(0.05, 0.015, 0.04, std('#E3E8EF'), -0.12 + c * 0.075, 0.22, 0.02 + r * 0.05, 0.004))
  return shadow(g)
}
export function notebook(): THREE.Group {
  const g = new THREE.Group()
  g.add(bx(0.52, 0.03, 0.36, std('#FFF6DD', { rough: 0.9 }), 0, 0, 0, 0.006))
  g.add(bx(0.02, 0.035, 0.36, std('#C26A1E'), 0, 0, 0, 0.003))
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) g.add(face(0.18, 0.006, std('#9DB0CF'), s * 0.13, 0.031, -0.12 + i * 0.05).rotateX(-Math.PI / 2))
  const pen = bx(0.015, 0.015, 0.2, std('#2D63FB'), 0.12, 0.035, 0, 0.006)
  pen.rotation.y = 0.6
  pen.name = 'pen'
  g.add(pen)
  return g
}
export function productShelf(wd = 1.4): THREE.Group {
  const g = new THREE.Group()
  const m = M.wood('#B98756')
  for (const s of [-1, 1]) g.add(bx(0.04, 1.7, 0.35, m, (s * wd) / 2, 0, 0, 0.005))
  const tints = ['#E8655A', '#F2C14E', '#3DBB7A', '#2D63FB', '#F4F1E6', '#8A5CF6']
  for (let r = 0; r < 4; r++) {
    g.add(bx(wd, 0.03, 0.35, m, 0, 0.1 + r * 0.42, 0, 0.005))
    const per = Math.floor((wd - 0.08) / 0.19)
    for (let i = 0; i < per; i++) {
      const tall = 0.14 + ((i * 3 + r) % 4) * 0.04
      g.add(i % 2 ? cy(0.06, 0.06, tall, std(tints[(i + r) % 6], { rough: 0.4 }), -wd / 2 + 0.13 + i * 0.19, 0.13 + r * 0.42, 0.02, 16) : bx(0.14, tall, 0.16, std(tints[(i + r * 2) % 6], { rough: 0.6 }), -wd / 2 + 0.13 + i * 0.19, 0.13 + r * 0.42, 0.02, 0.01))
    }
  }
  return shadow(g)
}
export function cardboardBox(s = 0.35): THREE.Group {
  return grp(bx(s, s * 0.8, s, std('#C79A64', { rough: 0.85 }), 0, 0, 0, 0.01), bx(s * 0.12, s * 0.802, s * 1.002, std('#E8D3A8', { rough: 0.8 }), 0, 0, 0, 0.002))
}
/** smoke: puffs named puff0..puff(n-1) */
export function smoke(n = 6): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: new THREE.Color('#6D7380'), transparent: true, opacity: 0.0, roughness: 1, depthWrite: false }))
    m.name = `puff${i}`
    g.add(m)
  }
  return g
}
export function puff(s: THREE.Object3D | undefined, t: number, on: boolean) {
  if (!s) return
  s.children.forEach((c, i) => {
    const k = (t * 1.6 + i / s.children.length) % 1
    const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
    c.visible = on
    c.position.set(Math.sin(i * 2.1 + k * 3) * 0.08 * (1 + k), k * 0.7, Math.cos(i * 1.3) * 0.05)
    c.scale.setScalar(0.6 + k * 1.6)
    m.opacity = on ? 0.55 * (1 - k) : 0
  })
}
/** a gold coin stack, n coins */
export function coins(n: number): THREE.Group {
  const g = new THREE.Group()
  const gm = std('#F4C447', { rough: 0.3, metal: 0.25 })
  const rim = std('#D9A21E', { rough: 0.35, metal: 0.25 })
  for (let i = 0; i < n; i++) {
    g.add(cy(0.13, 0.13, 0.045, i % 2 ? rim : gm, (i % 3) * 0.008, i * 0.046, (i % 2) * 0.006, 28))
  }
  return g
}
/** a folded garment / an envelope / a sheet that travels */
export function garment(color = '#2D63FB'): THREE.Mesh {
  return bx(0.34, 0.07, 0.26, std(color, { rough: 0.9 }), 0, -0.035, 0, 0.03)
}
export function envelope(): THREE.Group {
  return grp(bx(0.3, 0.02, 0.2, std('#F3E2B8', { rough: 0.85 }), 0, 0, 0, 0.004), bx(0.06, 0.022, 0.06, std('#B03A3A'), 0, 0, 0.03, 0.01))
}
export function paperSheet(color = '#FFFFFF'): THREE.Mesh {
  return bx(0.28, 0.008, 0.36, std(color, { rough: 0.9 }), 0, 0, 0, 0.002)
}
export function cartridge(color = '#2D63FB'): THREE.Mesh {
  return bx(0.12, 0.17, 0.12, std(color, { rough: 0.45 }), 0, -0.085, 0, 0.012)
}
export function strips(n = 8, color = '#FFFFFF'): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    const m = bx(0.03, 0.16, 0.006, std(color, { rough: 0.9 }), 0, -0.08, 0, 0.002)
    m.name = `strip${i}`
    g.add(m)
  }
  g.visible = false
  return g
}
export function spray(s: THREE.Object3D | undefined, k: number, on: boolean, up = true) {
  if (!s) return
  s.visible = on && k > 0 && k < 1
  s.children.forEach((c, i) => {
    const sp = (i - (s.children.length - 1) / 2) * 0.06
    c.position.set(sp * (0.5 + k), (up ? 1 : -1) * Math.sin(k * Math.PI) * (0.3 + (i % 3) * 0.08), (i % 2 ? 0.04 : -0.04) * k)
    c.rotation.z = i * 0.7 + k * 3
  })
}
