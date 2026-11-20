import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
/* three is the engine's dependency, reached the way Session 6's g.tsx reaches it */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * THE SESSION'S 3D STAGE (user, 2026-11-07: "convert all analogy-based visualizations currently in an isometric
 * style into proper 3D visualizations").
 *
 * A real three.js scene per picture: a perspective camera, a warm key light with soft shadow maps, a sky/ground
 * hemisphere fill, glossy "clay" materials (the reference illustration style: rounded forms, royal blue on white,
 * small warm accents). People are the library's 3D renders as camera-facing sprites standing in the scene (so a
 * counter in front hides their legs), each with a soft contact shadow. Labels, official AWS marks and status marks
 * stay DOM (rules 17, 54), placed at the screen point of a 3D anchor through `proj`.
 *
 * ONE WebGL renderer serves every scene of the deck: each scene renders into it and copies the frame into its own
 * 2D canvas. Twelve analogy scenes, thumbnails and the picker never exhaust the browser's WebGL contexts.
 */

export const W3 = 470
export const H3 = 430

let SHARED: THREE.WebGLRenderer | null = null
function renderer(): THREE.WebGLRenderer {
  if (!SHARED) {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    r.setPixelRatio(2)
    r.setSize(W3, H3, false)
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFSoftShadowMap
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.12
    r.outputColorSpace = THREE.SRGBColorSpace
    r.setClearColor(0x000000, 0)
    SHARED = r
  }
  return SHARED
}

/* ------------------------------------------------------------------ materials and parts */

const MATS = new Map<string, THREE.MeshPhysicalMaterial>()
/** glossy clay: soft roughness, a clear coat, no metal */
export function clay(color: string, gloss = 0.55): THREE.MeshPhysicalMaterial {
  const k = `${color}|${gloss}`
  let m = MATS.get(k)
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), roughness: 0.48, metalness: 0, clearcoat: gloss, clearcoatRoughness: 0.32 })
    MATS.set(k, m)
  }
  return m
}
/** a material that glows (a screen, a status light) */
export function glow(color: string, strength = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color), emissiveIntensity: strength, roughness: 0.3 })
}

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true
      c.receiveShadow = true
    }
  })
  return o
}

/** a rounded block standing on (x, y, z): `y` is its BASE */
export function block(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.06): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), mat)
  m.position.set(x, y + h / 2, z)
  return shadowed(m)
}
/** an upright cylinder standing on (x, y, z) */
export function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 40): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
  m.position.set(x, y + h / 2, z)
  return shadowed(m)
}
/** a flat panel facing +z (a screen, a board, a door), centred on (x, y, z) */
export function panel(w: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  m.position.set(x, y, z)
  m.receiveShadow = true
  return m
}
/** a sheet of paper (a form, a receipt, a copy) */
export function sheet(color = '#FFFFFF'): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.02, 0.44, 2, 0.01), clay(color, 0.2))
  return shadowed(m)
}
/** a glowing ring on the floor that marks the part a press is about; `set(on, t)` breathes it */
export function floorHalo(r: number, color: string, x: number, z: number): { mesh: THREE.Mesh; set: (on: boolean, t: number) => void } {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0, depthWrite: false })
  const mesh = new THREE.Mesh(new THREE.RingGeometry(r * 0.82, r, 64), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, 0.015, z)
  return {
    mesh,
    set: (on, t) => {
      mat.opacity = on ? 0.35 + 0.25 * Math.sin(t * Math.PI * 2) : 0
      const k = on ? 1 + 0.05 * Math.sin(t * Math.PI * 2) : 1
      mesh.scale.set(k, k, k)
    },
  }
}

/** every mounted stage re-renders when any texture arrives */
const LOADED = new Set<() => void>()
const loaded = () => LOADED.forEach((f) => f())

let BLOB: THREE.Texture | null = null
function blobTex(): THREE.Texture {
  if (!BLOB) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62)
    grd.addColorStop(0, 'rgba(16,32,58,0.42)')
    grd.addColorStop(1, 'rgba(16,32,58,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    BLOB = new THREE.CanvasTexture(c)
  }
  return BLOB
}

/**
 * A person (or any library render) standing at (x, z): a camera-facing sprite, its feet on the floor, `h` metres
 * tall, mirrored with `flip` so it faces the main visual (rule 58); a soft contact shadow under the feet.
 */
export function person(url: string, h: number, x: number, z: number, flip = false, y = 0): THREE.Group {
  const g = new THREE.Group()
  const tex = new THREE.TextureLoader().load(url, (t) => {
    const img = t.image as HTMLImageElement
    const ar = img.width / img.height
    spr.scale.set(h * ar, h, 1)
    shadow.scale.set(h * ar * 0.75, h * ar * 0.28, 1)
    loaded()
  })
  tex.colorSpace = THREE.SRGBColorSpace
  /* a sprite ignores a negative scale: mirror the texture itself so the person faces the main visual (rule 58) */
  if (flip) {
    tex.wrapS = THREE.RepeatWrapping
    tex.repeat.x = -1
    tex.offset.x = 1
  }
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.04 }))
  spr.center.set(0.5, 0)
  spr.scale.set(h * 0.6, h, 1)
  spr.position.set(0, y, 0)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, y + 0.012, 0.02)
  shadow.scale.set(h * 0.45, h * 0.16, 1)
  g.add(shadow, spr)
  g.position.set(x, 0, z)
  return g
}

/* ------------------------------------------------------------------ the world */

export type World = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; parts: Record<string, THREE.Object3D>; halos: Record<string, ReturnType<typeof floorHalo>> }

/** the room every picture stands in: a rounded floor plate, the key light, the fill */
export function makeWorld(cam: { pos: [number, number, number]; aim: [number, number, number]; fov?: number }, floor: { w: number; d: number; color?: string } = { w: 6.5, d: 4.6 }): World {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(cam.fov ?? 30, W3 / H3, 0.1, 100)
  camera.position.set(...cam.pos)
  camera.lookAt(new THREE.Vector3(...cam.aim))
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfdaf2, 1.5))
  const key = new THREE.DirectionalLight(0xfff6ea, 2.3)
  key.position.set(4.5, 9, 6.5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.camera.near = 1
  key.shadow.camera.far = 30
  key.shadow.bias = -0.0006
  key.shadow.radius = 6
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.6)
  rim.position.set(-6, 5, -4)
  scene.add(rim)
  const plate = new THREE.Mesh(new RoundedBoxGeometry(floor.w, 0.22, floor.d, 6, 0.1), clay(floor.color ?? '#F1F5FD', 0.25))
  plate.position.set(0, -0.11, 0)
  plate.receiveShadow = true
  scene.add(plate)
  return { scene, camera, parts: {}, halos: {} }
}

export function add(w: World, key: string, o: THREE.Object3D): THREE.Object3D {
  w.parts[key] = o
  w.scene.add(o)
  return o
}
export function halo(w: World, key: string, r: number, color: string, x: number, z: number) {
  const h = floorHalo(r, color, x, z)
  w.halos[key] = h
  w.scene.add(h.mesh)
}

/** world point → stage px */
export function project(w: World, x: number, y: number, z: number): [number, number] {
  const v = new THREE.Vector3(x, y, z).project(w.camera)
  return [((v.x + 1) / 2) * W3, ((1 - v.y) / 2) * H3]
}

/**
 * The scene on the stage. `build` makes the world once; `update` moves its parts for this render; `overlay`
 * places the DOM layer (tags, marks) with the world's projection. It renders whenever React renders it (the
 * scene's own lap drives that), and once more whenever a texture arrives.
 */
export function Stage3D({ build, update, overlay }: { build: () => World; update: (w: World) => void; overlay?: (p: (x: number, y: number, z: number) => [number, number]) => ReactNode }) {
  const world = useMemo(build, [])
  const canvas = useRef<HTMLCanvasElement>(null)
  const [, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((n) => n + 1)
    LOADED.add(bump)
    const late = [120, 500, 1200].map((ms) => window.setTimeout(bump, ms))
    return () => {
      LOADED.delete(bump)
      late.forEach((t) => window.clearTimeout(t))
      world.scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (mat && !Array.isArray(mat) && (mat as THREE.SpriteMaterial).map) (mat as THREE.SpriteMaterial).map?.dispose()
      })
    }
  }, [world])
  useEffect(() => {
    update(world)
    const r = renderer()
    r.render(world.scene, world.camera)
    const c = canvas.current
    const g = c?.getContext('2d')
    if (c && g) {
      g.clearRect(0, 0, c.width, c.height)
      g.drawImage(r.domElement, 0, 0, c.width, c.height)
    }
  })
  const p = (x: number, y: number, z: number) => project(world, x, y, z)
  return (
    <div style={{ position: 'absolute', inset: 0, width: W3, height: H3 }}>
      <canvas ref={canvas} width={W3 * 2} height={H3 * 2} style={{ position: 'absolute', inset: 0, width: W3, height: H3, display: 'block' }} aria-hidden />
      {overlay?.(p)}
    </div>
  )
}

export { THREE }
