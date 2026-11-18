import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'
import boyLaptopUrl from './i-boy-laptop.png'
import lambdaUrl from './i-aws-lambda.svg'
import ec2Url from './i-aws-ec2.svg'
import dynamoUrl from './i-aws-dynamodb.svg'
import cognitoUrl from './i-aws-cognito.svg'
import s3Url from './i-aws-s3.svg'

/**
 * BUILDER I · SESSION 10 ANALOGIES ON SLIDES 7 (TR 1, taxi), 35 (TR 17, hotel room), 39 (TR 19, power grid) AND 43
 * (TR 21, daily commuter), as real-time 3D scenes (standing corrections 13-14, cloud course R10-R11): perspective
 * camera on the deck's ONE shared WebGL renderer (`@/engine/three-stage`), Character Lab people on depth-tested planes,
 * no text or digits on either card, each loop performing the analogy's action, wall-clock driven, restarting within
 * 0.3 s with its first frame matching its last.
 *
 *   S7  everyday  a city kerb: a passenger walks up, hails a taxi, gets in; the street slides past while the dashboard
 *                 meter glows; she pays the driver, steps out and walks off, the taxi leaves. She owns no car.
 *   S7  concept   the provider's server room: the user (boy with a laptop) sends a request, a Lambda function block
 *                 rises on the floor, runs while its meter ring fills, sends the response back, is paid for and is gone.
 *   S35 everyday  a hotel room: a guest arrives and unpacks, checks out with his suitcase; housekeeping clears the room
 *                 (bed made, clothes, cups and bin gone); the room is empty for the next guest (a different one each loop).
 *   S35 concept   an execution environment with its /tmp folder: a request arrives, files land in the folder, the
 *                 request leaves; the platform's recycle ring sweeps it, the files vanish, a fresh environment rebuilds empty.
 *   S39 everyday  a house (walls, pitched roof, chimney, door, window) drawing grid power: pulses run over the line; the lamp, the TV and
 *                 the kettle come on; the generator shed next door stays dark and unused.
 *   S39 concept   an application window calling DynamoDB, Cognito and S3 over glowing API lines; its data, login and file
 *                 panels light up; the server plinth beside it stays empty and dark.
 *   S43 everyday  ONE car split at the B-pillar: the Rented half (taxi, meter running) and the Owned half (her own car, she
 *                 drives); the fares pile up under Rented, two a day; Owned is paid once on day one and never grows.
 *   S43 concept   requests every round into a Lambda function (coins pile up per invocation) beside an always-on EC2
 *                 server (one flat stack).
 */

const W = 470
const H = 390

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  navy: '#1F2E63',
  ink: '#00254B',
  steel: '#C9D3E6',
  steelDark: '#8E9BB5',
  floor: '#E3E9F4',
  wall: '#F3F6FC',
  wood: '#D9B48A',
  woodDark: '#A97C52',
  gold: '#F2C14E',
  taxi: '#F7C531',
  lambda: '#ED7100',
  white: '#FFFFFF',
  green: '#16A34A',
  glass: '#CFE3FF',
  grass: '#9FD38F',
  road: '#596277',
  kerb: '#D5DCE8',
}

/* ------------------------------------------------------------------ helpers */

/** the engine's light rig with a 2048 shadow map, so contact shadows keep their edge on a 4K screen (FIG-35) */
function rig(scene: THREE.Scene, target: [number, number, number]) {
  lightRig(scene, target)
  scene.traverse((o) => {
    const l = o as THREE.DirectionalLight
    if (l.isDirectionalLight && l.castShadow) l.shadow.mapSize.set(2048, 2048)
  })
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
/** 0 → 1 over [a, b], eased in and out */
const seg = (t: number, a: number, b: number) => {
  const k = clamp((t - a) / (b - a))
  return k * k * (3 - 2 * k)
}
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** 0 → 1 → 0 over [a, b] (a bump) */
const bump = (t: number, a: number, b: number) => Math.sin(Math.PI * lin(t, a, b))
const rbox = (w: number, h: number, d: number, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))

function frame(camera: THREE.PerspectiveCamera, cx: number, cz: number, lookY = 0.9, dist = 12.4, height = 5.6) {
  camera.fov = 30
  camera.position.set(cx + 0.8, height, cz + dist)
  camera.lookAt(cx, lookY, cz - 0.1)
}

/** TEX_S: drawn textures are rasterised at 4x their authored size so they stay sharp on a 4K screen (FIG-35) */
const TEX_S = 4
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas')
  c.width = w * TEX_S
  c.height = h * TEX_S
  const g = c.getContext('2d')!
  g.scale(TEX_S, TEX_S)
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** an official AWS mark (svg) drawn onto a texture; redraws a held frame once it has loaded */
function markTex(url: string, redraw: () => void, px = 1024) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    c.getContext('2d')!.drawImage(img, 0, 0, px, px)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}

/** a cube with a texture on its front (+z) and top faces */
function markBox(s: number, tex: THREE.Texture, side: string, glow = 0) {
  const sideM = mat(side, { roughness: 0.42 })
  const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: glow })
  const o = new THREE.Mesh(rbox(s, s, s, 0.06), [sideM, sideM, faceM, sideM, faceM, sideM])
  o.castShadow = o.receiveShadow = true
  return { o, faceM }
}

/** a soft-tiled floor slab (no hard grid lines, rule 59) */
function floorSlab(scene: THREE.Scene, x0: number, z0: number, w: number, d: number, base: string, seam: string, rep: [number, number] = [4, 3]) {
  const tex = canvasTex(256, 256, (g) => {
    g.fillStyle = base
    g.fillRect(0, 0, 256, 256)
    g.fillStyle = seam
    g.fillRect(0, 126, 256, 3)
    g.fillRect(126, 0, 3, 256)
  }, rep)
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
  const edge = mat('#AFBDD8', { roughness: 0.7 })
  const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), [edge, edge, top, edge, edge, edge])
  f.position.set(x0 + w / 2, -0.11, z0 + d / 2)
  f.receiveShadow = true
  scene.add(f)
  return f
}

function walls(scene: THREE.Scene, x0: number, z0: number, w: number, d: number, h: number, color: string, left = true) {
  const wm = mat(color, { roughness: 0.92, emissive: color, emissiveIntensity: 0.22 })
  const back = mesh(new THREE.BoxGeometry(w, h, 0.1), wm, [x0 + w / 2, h / 2, z0 - 0.05])
  back.castShadow = false
  scene.add(back)
  if (left) {
    const l = mesh(new THREE.BoxGeometry(0.1, h, d), wm, [x0 - 0.05, h / 2, z0 + d / 2])
    l.castShadow = false
    scene.add(l)
  }
  const sk = mat('#C9D3E6')
  scene.add(mesh(new THREE.BoxGeometry(w, 0.1, 0.04), sk, [x0 + w / 2, 0.05, z0 + 0.02]))
}

/** a server rack with blinking LEDs */
function rack(h = 1.9) {
  const g = new THREE.Group()
  g.add(mesh(rbox(0.66, h, 0.6, 0.03), mat(C.navy, { roughness: 0.5 }), [0, h / 2, 0]))
  const leds: THREE.Mesh[] = []
  for (let i = 0; i < 7; i++) {
    const y = 0.25 + i * ((h - 0.4) / 7)
    g.add(mesh(new THREE.BoxGeometry(0.54, 0.12, 0.02), mat('#2B3E7E', { roughness: 0.4 }), [0, y, 0.305]))
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshStandardMaterial({ color: '#7CF0B8', emissive: '#3BE59A', emissiveIntensity: 1.2 }))
    led.position.set(0.2, y, 0.32)
    g.add(led)
    leds.push(led)
  }
  return { g, leds }
}
const blink = (leds: THREE.Mesh[], t: number, k = 1.7) =>
  leds.forEach((l, i) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3.2 + i * k))))

const coinM = () => mat('#F6C944', { metalness: 0.35, roughness: 0.3, emissive: '#B07A00', emissiveIntensity: 0.35 })
function coin(m: THREE.Material) {
  const c = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24), m)
  return c
}
/** a stack of `n` coins (built up to `max`, shown by count) */
function coinStack(max: number, m: THREE.Material) {
  const g = new THREE.Group()
  const coins: THREE.Mesh[] = []
  for (let i = 0; i < max; i++) {
    const c = coin(m)
    c.position.set(((i * 37) % 5) * 0.006 - 0.012, 0.03 + i * 0.056, ((i * 53) % 7) * 0.005 - 0.015)
    c.rotation.y = i * 0.7
    g.add(c)
    coins.push(c)
  }
  return { g, coins }
}

/** a glowing packet (a request or a response) */
function packet(color: string, r = 0.13) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, roughness: 0.3 })
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), m)
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.8, 20, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }))
  o.add(halo)
  return o
}

/** sparkles that pop where something is cleared away */
function sparkles(n = 6) {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#BFD4FF', emissiveIntensity: 1.4, transparent: true, opacity: 0 })
  const parts: THREE.Mesh[] = []
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), m)
    s.userData.a = (i / n) * Math.PI * 2
    g.add(s)
    parts.push(s)
  }
  return {
    g,
    set(k: number) {
      /* k: 0 → 1 burst progress */
      m.opacity = Math.sin(Math.PI * clamp(k)) * 0.95
      parts.forEach((s) => {
        const r = 0.08 + 0.32 * k
        s.position.set(Math.cos(s.userData.a) * r, 0.1 + 0.25 * k, Math.sin(s.userData.a) * r * 0.6)
        s.rotation.y = k * 4
        s.scale.setScalar(0.6 + 0.6 * Math.sin(Math.PI * clamp(k)))
      })
      g.visible = k > 0 && k < 1
    },
  }
}

/** show an object scaled from 0 by k (hidden at 0) */
const pop = (o: THREE.Object3D, k: number, base = 1) => {
  const s = Math.max(0.0001, k) * base
  o.scale.setScalar(s)
  o.visible = k > 0.005
}

/* ------------------------------------------------------------------ Character Lab people */

/**
 * The engine's `castSprite` contract with a `dress` hook (Session 9 j.tsx's `rigSprite`): role clothing drawn in the
 * rig's own frames. The loop is pre-rendered once into `frames` images on a depth-tested, camera-facing plane, cycled
 * by loop time; frame textures are freed by ThreeStage on unmount (`userData.textures`).
 */
type Sprite = { object: THREE.Object3D; plane: THREE.Mesh; update: (t: number, camera: THREE.Camera) => void }
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; flip?: boolean; onReady?: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 480 })
}

/** an expression clip crossfading from the previous one */
const face = (name: string, start: number, prev?: string, prevStart = 0): Pick<Timeline, 'expression' | 'prevExpression'> => ({
  expression: castClip(name, start, false),
  prevExpression: prev ? castClip(prev, prevStart, false) : undefined,
})

/* the people of these four scenes, each an individual (own hair, skin, clothes, accessories) */
const PASSENGER: CharacterConfig = { ...CAST_PRESETS.meera, name: 'Passenger', outfit: { ...CAST_PRESETS.meera.outfit, topColor: '#2D63FB', bottomColor: '#1F2A4A' } }
const DRIVER: CharacterConfig = { ...CAST_PRESETS.rohan, name: 'Driver', outfit: { ...CAST_PRESETS.rohan.outfit, top: 'shirt', topColor: '#E8EEF8' } }
const GUEST_A: CharacterConfig = { ...CAST_PRESETS.dev, name: 'Guest A', outfit: { ...CAST_PRESETS.dev.outfit, top: 'shirtTie', topColor: '#F2F5FB' } }
const GUEST_B: CharacterConfig = { ...CAST_PRESETS.riya, name: 'Guest B', outfit: { ...CAST_PRESETS.riya.outfit, top: 'blouse', topColor: '#8C6BE8' } }
const HOUSEKEEPER: CharacterConfig = { ...CAST_PRESETS.ananya, name: 'Housekeeper', outfit: { ...CAST_PRESETS.ananya.outfit, top: 'tshirt', topColor: '#2B6E8F', bottom: 'trousers', bottomColor: '#24324F', shoeColor: '#1F2430' } }
const RESIDENT: CharacterConfig = { ...CAST_PRESETS.riya, name: 'Resident', hair: { ...CAST_PRESETS.riya.hair, style: 'wavy' }, outfit: { ...CAST_PRESETS.riya.outfit, top: 'kurta', topColor: '#E86B5C', bottom: 'salwar', bottomColor: '#F3E6D8' }, accessories: { earrings: true, bindi: true } }
const COMMUTER_A: CharacterConfig = { ...CAST_PRESETS.kabir, name: 'Commuter A', outfit: { ...CAST_PRESETS.kabir.outfit, top: 'shirt', topColor: '#FCC82B' } }
const COMMUTER_B: CharacterConfig = { ...CAST_PRESETS.ananya, name: 'Commuter B', outfit: { ...CAST_PRESETS.ananya.outfit, top: 'blouse', topColor: '#2D63FB', bottom: 'trousers', bottomColor: '#3E3D45' }, accessories: { glasses: 'rect' } }

/** housekeeping apron over the tunic (body frame, the rig's 400 x 600 box) */
const HK_APRON = (
  <g data-part="hk-apron">
    <path d="M 172 246 H 228 V 274 C 244 282 248 304 246 330 L 244 404 H 156 L 154 330 C 152 304 156 282 172 274 Z" fill="#FFFFFF" stroke="#C9D6EE" strokeWidth={3} />
    <path d="M 172 246 C 170 230 162 216 154 210 M 228 246 C 230 230 238 216 246 210" stroke="#C9D6EE" strokeWidth={3} fill="none" />
    <rect x={180} y={330} width={40} height={26} rx={6} fill="none" stroke="#2B6E8F" strokeWidth={2.5} />
  </g>
)
/** a driver's flat cap, head-local (skull centre 0,0) */
const DRIVER_CAP = (
  <g data-part="cap">
    <path d="M -58 -44 C -58 -96 58 -96 58 -44 Z" fill="#1F2E63" />
    <path d="M -4 -48 C 30 -50 66 -44 82 -34 C 60 -30 20 -34 -4 -38 Z" fill="#16224A" />
  </g>
)

/** the user: the project's boy-with-a-laptop illustration on a camera-facing plane (he breathes) */
function boyWithLaptop(scene: THREE.Scene, camera: THREE.PerspectiveCamera, redraw: () => void, pos: [number, number, number], h = 1.05) {
  const w = h * (252 / 342)
  const root = new THREE.Group()
  root.position.set(...pos)
  const tex = new THREE.TextureLoader().load(boyLaptopUrl, () => redraw())
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const geo = new THREE.PlaneGeometry(w, h)
  geo.translate(0, h / 2, 0)
  const plane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false }))
  root.add(plane)
  scene.add(root)
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0x0b1530, transparent: true, opacity: 0.16, depthWrite: false }))
  sh.rotation.x = -Math.PI / 2
  sh.position.set(pos[0], 0.005, pos[2])
  scene.add(sh)
  const camW = new THREE.Vector3()
  camera.updateMatrixWorld()
  camera.getWorldPosition(camW)
  plane.rotation.y = Math.atan2(camW.x - pos[0], camW.z - pos[2])
  root.updateMatrixWorld(true)
  /* his laptop on the picture: 62 % across, 58 % down */
  const laptop = plane.localToWorld(new THREE.Vector3((0.62 - 0.5) * w, (1 - 0.58) * h, 0.04))
  return { plane, laptop, breathe: (t: number) => (plane.scale.y = 1 + Math.sin(t * 2.1) * 0.006) }
}

/* ------------------------------------------------------------------ the car (one model: the taxi of S7 and S43, the own car of S43) */

type Car = { g: THREE.Group; wheels: THREE.Group[]; meter: THREE.MeshStandardMaterial | null; roofLight: THREE.MeshStandardMaterial | null; body: THREE.Group; /** the near-side rear door, hinged at its front edge: rotation.y > 0 swings it open */ door: THREE.Group; opening: THREE.Mesh }
/** a cabin box whose top is narrower than its base: sloped windscreen and rear window */
function taperBox(w: number, h: number, d: number, topW: number, shift: number) {
  const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setX(i, pos.getX(i) * (topW / w) + shift)
  geo.computeVertexNormals()
  return geo
}
function car(color: string, taxi: boolean): Car {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)
  const paint = mat(color, { roughness: 0.3, metalness: 0.2 })
  const dark = mat('#2A2F3D', { roughness: 0.6 })
  /* lower body: 2.4 long (x, nose at +x), 1.0 wide (z), sill 0.2, belt line 0.72; a lower bonnet and boot */
  body.add(mesh(rbox(2.4, 0.5, 1.0, 0.16), paint, [0, 0.47, 0]))
  body.add(mesh(new THREE.BoxGeometry(2.42, 0.08, 1.02), dark, [0, 0.24, 0]))
  body.add(mesh(new THREE.BoxGeometry(2.0, 0.22, 0.86), dark, [0, 0.13, 0]))
  if (taxi) body.add(mesh(new THREE.BoxGeometry(1.4, 0.06, 1.012), mat('#1F2E63'), [-0.1, 0.56, 0]))
  /* cabin: tinted glass, tapered (sloped windscreen at the front, rear window at the back), roof plate on top */
  const glass = new THREE.MeshStandardMaterial({ color: '#A9C6FF', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false })
  const cab = new THREE.Mesh(taperBox(1.5, 0.48, 0.9, 1.0, -0.06), glass)
  cab.position.set(-0.18, 0.96, 0)
  cab.renderOrder = 2
  body.add(cab)
  body.add(mesh(rbox(1.06, 0.06, 0.94, 0.03), paint, [-0.24, 1.21, 0]))
  /* the window frames on both sides: A-pillar (windscreen), B-pillar (between the doors), C-pillar (rear window),
     roof rail and belt trim, so the cabin reads as a closed car body round the people in it */
  for (const z of [-0.445, 0.445]) {
    body.add(mesh(new THREE.BoxGeometry(0.07, 0.48, 0.03), paint, [-0.2, 0.96, z]))
    body.add(beam(new THREE.Vector3(0.55, 0.72, z), new THREE.Vector3(0.25, 1.2, z), 0.03, paint))
    body.add(beam(new THREE.Vector3(-0.91, 0.72, z), new THREE.Vector3(-0.73, 1.2, z), 0.035, paint))
    body.add(mesh(new THREE.BoxGeometry(1.02, 0.04, 0.03), paint, [-0.24, 1.19, z]))
    body.add(mesh(new THREE.BoxGeometry(1.5, 0.035, 0.035), dark, [-0.18, 0.735, z]))
  }
  /* seats with headrests, front and rear, seen through the side windows behind the people in them */
  const seat = mat('#3A4A78', { roughness: 0.8 })
  body.add(mesh(rbox(0.1, 0.32, 0.8, 0.04), seat, [-0.8, 0.84, 0]), mesh(rbox(0.1, 0.3, 0.8, 0.04), seat, [-0.08, 0.82, 0]))
  for (const z of [-0.22, 0.22]) body.add(mesh(rbox(0.09, 0.13, 0.22, 0.04), seat, [-0.82, 1.06, z]), mesh(rbox(0.09, 0.13, 0.22, 0.04), seat, [-0.1, 1.03, z]))
  /* the near-side rear door, hinged at its front edge (B-pillar); the dark opening behind it shows when it swings */
  const opening = mesh(new THREE.BoxGeometry(0.66, 0.42, 0.01), mat('#26304A', { roughness: 0.9 }), [-0.56, 0.5, 0.503])
  opening.visible = false
  body.add(opening)
  const door = new THREE.Group()
  door.position.set(-0.22, 0, 0.512)
  door.add(mesh(rbox(0.7, 0.46, 0.035, 0.03), paint, [-0.35, 0.49, 0]))
  door.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.02), mat('#C9D3E6', { metalness: 0.7, roughness: 0.3 }), [-0.14, 0.62, 0.025]))
  if (taxi) door.add(mesh(new THREE.BoxGeometry(0.7, 0.06, 0.012), mat('#1F2E63'), [-0.35, 0.56, 0.02]))
  body.add(door)
  const head = new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFE9A8', emissiveIntensity: 0.8 })
  const tail = new THREE.MeshStandardMaterial({ color: '#E2473B', emissive: '#E2473B', emissiveIntensity: 0.5 })
  for (const z of [-0.32, 0.32]) body.add(mesh(new THREE.BoxGeometry(0.04, 0.1, 0.2), head, [1.2, 0.56, z]), mesh(new THREE.BoxGeometry(0.04, 0.1, 0.2), tail, [-1.2, 0.56, z]))
  for (const x of [-0.62, 0.22]) body.add(mesh(new THREE.BoxGeometry(0.015, 0.4, 1.006), dark, [x, 0.48, 0]))
  let meter: THREE.MeshStandardMaterial | null = null
  let roofLight: THREE.MeshStandardMaterial | null = null
  if (taxi) {
    meter = new THREE.MeshStandardMaterial({ color: '#2A2F3D', emissive: '#3BE59A', emissiveIntensity: 0, roughness: 0.4 })
    body.add(mesh(rbox(0.16, 0.1, 0.24, 0.02), meter, [0.42, 0.79, 0.12]))
    roofLight = new THREE.MeshStandardMaterial({ color: '#FFE08A', emissive: '#FFB020', emissiveIntensity: 0.9, roughness: 0.3 })
    body.add(mesh(rbox(0.4, 0.13, 0.24, 0.04), roofLight, [-0.24, 1.3, 0]))
  }
  const wheels: THREE.Group[] = []
  const tyre = mat('#1E2230', { roughness: 0.85 })
  const hub = mat('#C9D3E6', { metalness: 0.7, roughness: 0.3 })
  for (const x of [-0.74, 0.74]) for (const z of [-0.47, 0.47]) {
    const w = new THREE.Group()
    w.position.set(x, 0.25, z)
    const t = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 24), tyre)
    t.rotation.x = Math.PI / 2
    w.add(t)
    const hb = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.19, 6), hub)
    hb.rotation.x = Math.PI / 2
    w.add(hb)
    g.add(w)
    wheels.push(w)
  }
  return { g, wheels, meter, roofLight, body, door, opening }
}
/* seats inside the car (car-local x): rear passenger, front driver; seated sprites drop so the crown sits at 1.1, under the roof */
const REAR_X = -0.5
const FRONT_X = 0.2
const spin = (c: Car, dist: number) => c.wheels.forEach((w) => (w.rotation.z = -dist / 0.25))

/* ================================================================== S7 · EVERYDAY: the taxi ride */

const P7 = 8.65
const STREET_L = 12

function building(h: number, color: string, win: string) {
  const g = new THREE.Group()
  g.add(mesh(rbox(1.5, h, 0.8, 0.03), mat(color, { roughness: 0.85 }), [0, h / 2, 0]))
  const wm = new THREE.MeshStandardMaterial({ color: win, roughness: 0.2, metalness: 0.2, emissive: '#9CC2FF', emissiveIntensity: 0.12 })
  for (let y = 0.5; y < h - 0.3; y += 0.55) for (const x of [-0.42, 0, 0.42]) g.add(mesh(new THREE.BoxGeometry(0.26, 0.3, 0.03), wm, [x, y, 0.41]))
  return g
}
function lamp() {
  const g = new THREE.Group()
  const pole = mat('#5A6378', { metalness: 0.5, roughness: 0.4 })
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.1, 10), pole, [0, 1.05, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.05, 0.06), pole, [0.18, 2.08, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFE08A', emissiveIntensity: 0.5 }), [0.34, 2.04, 0]))
  return g
}
function tree() {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 10), mat(C.woodDark), [0, 0.35, 0]))
  g.add(mesh(new THREE.SphereGeometry(0.38, 16, 14), mat('#5DBB7A', { roughness: 0.75 }), [0, 0.95, 0]))
  return g
}

function setupTaxi({ scene, camera, redraw }: StageKit) {
  frame(camera, 0, -0.1, 0.75, 9.6, 4.3)
  rig(scene, [0, 0.5, -0.4])
  /* road (front) and kerb (back), the city behind it */
  const road = mesh(new THREE.BoxGeometry(14, 0.2, 2.6), mat(C.road, { roughness: 0.9 }), [0, -0.1, 0.55])
  road.castShadow = false
  scene.add(road)
  const dash = mat('#E8EEF8')
  const dashes: THREE.Mesh[] = []
  for (let i = 0; i < 12; i++) {
    const d = mesh(new THREE.BoxGeometry(0.5, 0.01, 0.07), dash, [0, 0.005, 0.0])
    d.castShadow = false
    scene.add(d)
    dashes.push(d)
  }
  const kerb = mesh(new THREE.BoxGeometry(14, 0.16, 2.2), mat(C.kerb, { roughness: 0.85 }), [0, -0.02, -1.85])
  kerb.castShadow = false
  scene.add(kerb)
  scene.add(mesh(new THREE.BoxGeometry(14, 0.1, 0.08), mat('#AEB8CC'), [0, 0.03, -0.76]))
  const nearSide = mesh(new THREE.BoxGeometry(14, 0.16, 2.4), mat(C.kerb, { roughness: 0.85 }), [0, -0.02, 3.05])
  nearSide.castShadow = false
  scene.add(nearSide)
  scene.add(mesh(new THREE.BoxGeometry(14, 0.1, 0.08), mat('#AEB8CC'), [0, 0.03, 1.86]))
  /* the scrolling street: buildings, lamps and trees placed round a 12-unit ring so a 12-unit ride returns them home */
  const street: { o: THREE.Object3D; x0: number }[] = []
  const bcol = ['#DCE5F7', '#C9D8F5', '#E8EEF8', '#D3DFF6', '#BFD0F2', '#E1E8F6', '#CAD7F2', '#DDE6F8']
  for (let i = 0; i < 8; i++) {
    const b = building(1.7 + ((i * 7) % 4) * 0.45, bcol[i], i % 2 ? '#BFD6FF' : '#A9C6FF')
    b.position.z = -2.55
    scene.add(b)
    street.push({ o: b, x0: -6 + i * 1.5 })
  }
  for (let i = 0; i < 4; i++) {
    const l = lamp()
    l.position.z = -1.0
    scene.add(l)
    street.push({ o: l, x0: -6 + i * 3 + 0.9 })
    const tr = tree()
    tr.position.z = -1.3
    scene.add(tr)
    street.push({ o: tr, x0: -6 + i * 3 + 2.3 })
  }
  dashes.forEach((d, i) => street.push({ o: d, x0: -6 + i }))

  /*
    THE PASSENGER SITS INSIDE THE CAR (Session 10 review, slide 7): the taxi pulls up at the NEAR kerb, its near-side rear
    door swings open, she steps in and sits by the near rear window (seat, headrest, door and window frame round her),
    the door closes; at the end it opens again and she steps out. The car is 1.25x (people at real scale beside it).
  */
  const S7 = 1.25
  const LANE_Z = 1.0
  const taxi = car(C.taxi, true)
  taxi.g.scale.setScalar(S7)
  taxi.g.position.z = LANE_Z
  scene.add(taxi.g)

  /* the driver: far-side front seat, head and shoulders above the door line; he smiles, minimal motion (car units) */
  const driver = rigSprite({
    config: DRIVER,
    dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{DRIVER_CAP}</> }),
    timeline: () => ({ seed: 5, idle: CAST_IDLE, life: 0, expression: castClip('happy', 0, false) }),
    loop: 4,
    frames: 10,
    height: 1.66 / S7,
    onReady: redraw,
  })
  driver.object.position.set(FRONT_X, 1.1 - 1.66 / S7, -0.2)
  taxi.body.add(driver.object)

  /* the passenger: walks up, hails (wave), smiles, rides, pays (presentRight toward the driver), walks off */
  const pas = rigSprite({
    config: PASSENGER,
    loop: P7,
    frames: 48,
    height: 1.66,
    onReady: redraw,
    timeline: (t) => ({
      seed: 11,
      idle: CAST_IDLE,
      life: 0,
      ...(t < 1.3 ? face('neutral', 0) : t < 6.05 ? face('happy', 1.3, 'neutral', 0) : face('grin', 6.05, 'happy', 1.3)),
      gesture: t >= 1.3 && t < 2.3 ? castClip('wave', 1.3) : t >= 6.05 && t < 6.9 ? castClip('presentRight', 6.05) : undefined,
    }),
  })
  scene.add(pas.object)
  /* the fare: a coin passed from the back seat to the driver */
  const cm = coinM()
  const fare = coin(cm)
  fare.rotation.x = Math.PI / 2
  scene.add(fare)

  /* where she waits (behind the opened door's rear edge) and where she sits (near rear seat), in world units */
  const WAIT_X = -1.9
  const WAIT_Z = 2.15
  const SEAT_X = REAR_X * S7
  const SEAT_Z = LANE_Z + 0.2 * S7
  const SEAT_Y = 1.1 * S7 - 1.66
  const FRONT_W = FRONT_X * S7
  return (t: number) => {
    const u = t % P7
    /* the taxi: in from the left, waits, the ride (street slides past), waits, off to the right */
    const inK = seg(u, 0, 1.3)
    const outK = lin(u, 7.7, 8.64) ** 1.6
    const tx = lerp(-7.6, 0, inK) + outK * 7.6
    taxi.g.position.x = tx
    const ride = seg(u, 3.2, 6.0)
    const scroll = ride * STREET_L
    for (const s of street) s.o.position.x = (((s.x0 - scroll + 6) % STREET_L) + STREET_L) % STREET_L - 6
    spin(taxi, (tx + scroll) / S7)
    const moving = u < 1.3 || (u > 3.2 && u < 6.0) || u > 7.7
    const bob = moving ? Math.sin(u * 22) * 0.008 : 0
    taxi.body.position.y = bob / S7
    const hired = u > 2.9 && u < 7.5
    taxi.roofLight!.emissiveIntensity = hired ? 0.05 : 0.9
    taxi.meter!.emissiveIntensity = hired ? 0.9 + 0.5 * Math.sin(u * 9) : 0
    /* the near rear door: open to let her in, closed for the ride, open to let her out */
    const open = seg(u, 2.3, 2.55) * (1 - seg(u, 2.95, 3.2)) + seg(u, 6.9, 7.1) * (1 - seg(u, 7.4, 7.6))
    taxi.door.rotation.y = open * 1.2
    taxi.opening.visible = open > 0.02
    driver.update(t, camera)

    /* the passenger */
    let px = WAIT_X
    let pz = WAIT_Z
    let py = 0.06
    const inside = seg(u, 2.55, 2.95) * (1 - seg(u, 7.05, 7.4))
    if (u < 2.1) px = lerp(-5.2, WAIT_X, seg(u, 1.0, 2.1))
    else if (u > 7.5) px = lerp(WAIT_X, -5.2, seg(u, 7.5, 8.6))
    else {
      px = lerp(WAIT_X, SEAT_X, inside)
      pz = lerp(WAIT_Z, SEAT_Z, inside)
      py = lerp(0.06, SEAT_Y, seg(inside, 0.25, 1)) + bob * inside
    }
    const walking = (u > 1.0 && u < 2.1) || u > 7.5
    pas.object.position.set(px, py + (walking ? Math.abs(Math.sin(u * 7)) * 0.03 : 0), pz)
    pas.update(u, camera)
    /* the fare */
    const f = lin(u, 6.15, 6.65)
    fare.visible = f > 0 && f < 1
    fare.position.set(lerp(SEAT_X + 0.15, FRONT_W - 0.1, f), 1.3 + Math.sin(Math.PI * f) * 0.14, lerp(SEAT_Z - 0.1, LANE_Z - 0.1, f))
    fare.rotation.z = f * 6
  }
}

/* ================================================================== S7 · CONCEPT: a request runs a function, then it is gone */

const P7C = 6.9

function setupFunctionRun({ scene, camera, redraw }: StageKit) {
  frame(camera, 0, -0.1, 0.75, 9.6, 4.3)
  rig(scene, [0, 0.5, -0.4])
  floorSlab(scene, -4.5, -2.4, 9, 6.6, '#E3E9F5', '#D3DCEC')
  walls(scene, -4.5, -2.4, 9, 4.6, 2.6, '#EEF2FB', false)
  /* the provider's racks along the back, where the kerb's city stood */
  const leds: THREE.Mesh[] = []
  for (const x of [-3.1, -2.35, -1.6, 1.0, 1.75, 2.5, 3.25]) {
    const r = rack(1.9)
    r.g.position.set(x, 0, -1.85)
    scene.add(r.g)
    leds.push(...r.leds)
  }
  /* the floor pad where a function appears (the taxi's place) */
  const padM = new THREE.MeshStandardMaterial({ color: '#C9D8F5', emissive: C.brand, emissiveIntensity: 0, roughness: 0.4 })
  const pad = mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.06, 40), padM, [0.2, 0.03, 0.65])
  scene.add(pad)
  const lam = markTex(lambdaUrl, redraw)
  const fn = markBox(0.95, lam, '#C8511B', 0.25)
  const fnG = new THREE.Group()
  fnG.position.set(0.2, 0.06, 0.65)
  fn.o.position.y = 0.5
  fnG.add(fn.o)
  /* a running ring round the function */
  const ringM = new THREE.MeshStandardMaterial({ color: '#FFB15C', emissive: '#FF9900', emissiveIntensity: 1, transparent: true, opacity: 0.85 })
  const ring = mesh(new THREE.TorusGeometry(0.78, 0.025, 10, 60), ringM, [0, 0.5, 0])
  ring.rotation.x = Math.PI / 2
  fnG.add(ring)
  scene.add(fnG)
  /* the meter: a post with a ring of segments that fill while the function runs */
  const meter = new THREE.Group()
  meter.position.set(1.55, 0, 0.05)
  meter.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.05, 12), mat('#5A6378', { metalness: 0.5, roughness: 0.4 }), [0, 0.52, 0]))
  meter.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32), mat(C.navy), [0, 1.2, 0]))
  meter.children[1].rotation.x = Math.PI / 2
  const segs: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < 12; i++) {
    const a = Math.PI / 2 - (i / 12) * Math.PI * 2
    const m = new THREE.MeshStandardMaterial({ color: '#33456F', emissive: '#3BE59A', emissiveIntensity: 0 })
    const s = mesh(new THREE.BoxGeometry(0.07, 0.11, 0.03), m, [Math.cos(a) * 0.22, 1.2 + Math.sin(a) * 0.22, 0.05])
    s.rotation.z = a - Math.PI / 2
    meter.add(s)
    segs.push(m)
  }
  scene.add(meter)
  /* the user, at the kerb's place: owns only a laptop, no server */
  const boy = boyWithLaptop(scene, camera, redraw, [-2.2, 0.01, 0.95], 1.15)
  const req = packet('#5B8CFF')
  const res = packet('#3BD18A')
  const cm = coinM()
  const fee = coin(cm)
  scene.add(req, res, fee)
  const fnPos = new THREE.Vector3(0.2, 0.75, 0.65)
  const meterPos = new THREE.Vector3(1.55, 1.2, 0.1)
  const arc = (a: THREE.Vector3, b: THREE.Vector3, h: number) => new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + h, (a.z + b.z) / 2), b)
  const toFn = arc(boy.laptop, fnPos, 0.9)
  const back = arc(fnPos, boy.laptop, 0.9)
  const pay = arc(boy.laptop, meterPos, 1.0)

  return (t: number) => {
    const u = t % P7C
    const kq = lin(u, 0.15, 1.0)
    req.visible = kq > 0 && kq < 1
    req.position.copy(toFn.getPoint(kq))
    /* the function rises from the pad, runs, sinks away */
    const up = seg(u, 0.9, 1.5) * (1 - seg(u, 6.0, 6.75))
    pop(fnG, up)
    fnG.position.y = 0.06 + (1 - up) * -0.2
    const run = u > 1.5 && u < 4.6
    fn.o.position.y = 0.5 + (run ? Math.sin(u * 5) * 0.03 : 0)
    fn.o.rotation.y = run ? Math.sin(u * 2.2) * 0.12 : 0
    fn.faceM.emissiveIntensity = 0.2 + (run ? 0.35 + 0.25 * Math.sin(u * 8) : 0)
    ring.visible = run
    ring.rotation.z = u * 3
    ring.position.y = 0.5 + Math.sin(u * 4) * 0.25
    padM.emissiveIntensity = up * 0.35
    /* the meter fills only while it runs, and resets once it is paid */
    const fill = lin(u, 1.5, 4.6) * (1 - seg(u, 5.6, 5.9))
    segs.forEach((m, i) => (m.emissiveIntensity = fill * 12 > i ? 1.1 : 0))
    const kr = lin(u, 4.6, 5.3)
    res.visible = kr > 0 && kr < 1
    res.position.copy(back.getPoint(kr))
    const kp = lin(u, 5.0, 5.7)
    fee.visible = kp > 0 && kp < 1
    fee.position.copy(pay.getPoint(kp))
    fee.rotation.x = Math.PI / 2
    fee.rotation.z = kp * 8
    blink(leds, t)
    boy.breathe(t)
  }
}

/* ================================================================== S35 · EVERYDAY: the hotel room */

const P35 = 7.7

function setupHotel({ scene, camera, redraw }: StageKit) {
  frame(camera, -0.1, -0.75, 0.85, 8.7, 4.6)
  rig(scene, [0, 0.5, -0.5])
  floorSlab(scene, -3.1, -2.1, 6.4, 5.8, '#E9DCC8', '#DCCDB5', [5, 3])
  walls(scene, -3.1, -2.1, 6.4, 4.3, 2.7, '#F2EEF8')
  /* a rug, a window with curtains on the back wall */
  const rug = mesh(new THREE.BoxGeometry(2.4, 0.015, 1.4), mat('#C9D8F5', { roughness: 0.95 }), [-0.6, 0.008, 0.55])
  rug.castShadow = false
  scene.add(rug)
  scene.add(mesh(new THREE.BoxGeometry(1.2, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: '#BFD8FF', emissive: '#CFE3FF', emissiveIntensity: 0.4 }), [1.4, 1.65, -2.07]))
  scene.add(mesh(new THREE.BoxGeometry(0.3, 1.2, 0.05), mat('#8C6BE8', { roughness: 0.9 }), [0.75, 1.6, -2.03]), mesh(new THREE.BoxGeometry(0.3, 1.2, 0.05), mat('#8C6BE8', { roughness: 0.9 }), [2.05, 1.6, -2.03]))
  /* the bed: frame, mattress, headboard, pillows; a neat blanket (made) and a rumpled one (used) */
  const bed = new THREE.Group()
  bed.position.set(-1.0, 0, -0.9)
  bed.add(mesh(rbox(1.7, 0.32, 2.1, 0.05), mat(C.woodDark), [0, 0.16, 0]))
  bed.add(mesh(rbox(1.62, 0.22, 2.0, 0.08), mat('#FFFFFF', { roughness: 0.9 }), [0, 0.42, 0]))
  bed.add(mesh(rbox(1.7, 0.9, 0.1, 0.04), mat(C.woodDark), [0, 0.6, -1.05]))
  for (const x of [-0.42, 0.42]) bed.add(mesh(rbox(0.6, 0.14, 0.34, 0.06), mat('#F4F7FD', { roughness: 0.9 }), [x, 0.6, -0.78]))
  const neat = mesh(rbox(1.66, 0.06, 1.3, 0.03), mat(C.brand, { roughness: 0.85 }), [0, 0.56, 0.32])
  bed.add(neat)
  const rumple = new THREE.Group()
  const rm = mat('#4F7DF0', { roughness: 0.9 })
  ;[
    [-0.3, 0.6, 0.2, 0.5, 0.18, 0.7, 0.3],
    [0.35, 0.62, 0.45, 0.6, 0.2, 0.6, -0.4],
    [0.0, 0.58, 0.75, 0.9, 0.12, 0.5, 0.2],
  ].forEach(([x, y, z, w, h, d, r]) => {
    const b = mesh(rbox(w, h, d, 0.06), rm, [x, y, z])
    b.rotation.y = r
    rumple.add(b)
  })
  bed.add(rumple)
  scene.add(bed)
  /* the guest's things: clothes on the bed, a towel, cups on the table, paper in the bin */
  const things: { o: THREE.Object3D; s: ReturnType<typeof sparkles> }[] = []
  const add = (o: THREE.Object3D, at: [number, number, number]) => {
    o.position.set(...at)
    scene.add(o)
    const s = sparkles()
    s.g.position.set(at[0], at[1], at[2])
    scene.add(s.g)
    things.push({ o, s })
  }
  const shirt = mesh(rbox(0.5, 0.06, 0.36, 0.03), mat('#F07E2A', { roughness: 0.9 }))
  shirt.rotation.y = 0.5
  add(shirt, [-1.25, 0.68, -0.55])
  const towel = new THREE.Group()
  const tw = mat('#FFFFFF', { roughness: 0.95 })
  ;[[0, 0, 0, 0.4, 0.06, 0.26, 0.3], [0.08, 0.05, 0.05, 0.3, 0.06, 0.2, -0.5]].forEach(([x, y, z, w, h, d, r]) => {
    const b = mesh(rbox(w, h, d, 0.03), tw, [x, y, z])
    b.rotation.y = r
    towel.add(b)
  })
  add(towel, [-0.55, 0.66, -0.2])
  /* nightstand + lamp (left), table (front right) with cups, bin */
  scene.add(mesh(rbox(0.5, 0.5, 0.45, 0.03), mat(C.wood), [-2.2, 0.25, -1.65]))
  scene.add(mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.32, 10), mat('#C9D3E6'), [-2.2, 0.66, -1.65]))
  scene.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.2, 18), new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFE08A', emissiveIntensity: 0.45 }), [-2.2, 0.88, -1.65]))
  const table = new THREE.Group()
  table.position.set(0.95, 0, 0.75)
  table.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 28), mat(C.wood), [0, 0.62, 0]))
  table.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 10), mat(C.woodDark), [0, 0.3, 0]))
  table.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), mat(C.woodDark), [0, 0.015, 0]))
  scene.add(table)
  const cups = new THREE.Group()
  for (const [x, z] of [[-0.12, 0.05], [0.14, -0.06]]) {
    cups.add(mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.13, 16), mat('#FFFFFF', { roughness: 0.4 }), [x, 0, z]))
    cups.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), mat('#7A4A26'), [x, 0.062, z]))
  }
  add(cups, [0.95, 0.71, 0.75])
  scene.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.34, 18, 1, true), mat('#8E9BB5', { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.4 }), [0.2, 0.17, -1.6]))
  const paper = new THREE.Group()
  for (const [x, y, z] of [[-0.04, 0, 0], [0.05, 0.04, 0.03], [0, 0.08, -0.04]]) paper.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), mat('#FFFFFF', { roughness: 0.9 }), [x, y, z]))
  add(paper, [0.2, 0.3, -1.6])
  scene.add(mesh(rbox(0.9, 2.0, 0.55, 0.03), mat('#E8DCCB'), [2.55, 1.0, -1.75]))
  scene.add(mesh(new THREE.BoxGeometry(0.02, 1.9, 0.02), mat('#BFAE96'), [2.55, 1.0, -1.47]))

  /* the suitcase: rolls beside the guest */
  const suit = new THREE.Group()
  suit.add(mesh(rbox(0.42, 0.56, 0.24, 0.05), mat('#1F2E63', { roughness: 0.5 }), [0, 0.34, 0]))
  suit.add(mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), mat('#8E9BB5', { metalness: 0.7 }), [-0.12, 0.78, 0]), mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), mat('#8E9BB5', { metalness: 0.7 }), [0.12, 0.78, 0]))
  suit.add(mesh(new THREE.BoxGeometry(0.28, 0.03, 0.04), mat('#8E9BB5', { metalness: 0.7 }), [0, 0.95, 0]))
  scene.add(suit)

  /* two guests (one per loop, alternating: "the next guest"), and housekeeping */
  const guestTl = (seed: number) => (t: number): Timeline => ({
    seed,
    idle: CAST_IDLE,
    life: 0,
    ...(t < 2.2 ? face('happy', 0) : face('grin', 2.2, 'happy', 0)),
    gesture: t >= 1.2 && t < 2.2 ? castClip('presentLeft', 1.2) : undefined,
  })
  const gA = rigSprite({ config: GUEST_A, timeline: guestTl(3), loop: P35, frames: 30, height: 1.74, onReady: redraw })
  const gB = rigSprite({ config: GUEST_B, timeline: guestTl(8), loop: P35, frames: 30, height: 1.66, onReady: redraw })
  scene.add(gA.object, gB.object)
  const hk = rigSprite({
    config: HOUSEKEEPER,
    dress: (k) => ({ ...k, top: <>{k.top}{HK_APRON}</> }),
    loop: P35,
    frames: 34,
    height: 1.62,
    onReady: redraw,
    timeline: (t) => ({
      seed: 17,
      idle: CAST_IDLE,
      life: 0,
      ...(t < 4.3 ? face('neutral', 0) : t < 6.4 ? face('thinking', 4.3, 'neutral', 0) : face('proud', 6.4, 'thinking', 4.3)),
      gesture: t >= 4.4 && t < 6.2 ? castClip('presentLeft', 4.4) : undefined,
    }),
  })
  scene.add(hk.object)

  /* item order of arrival (unpack) and of clearing; the bed is made first */
  const unpack = [1.25, 1.45, 1.7, 1.95]
  const clear = [4.85, 5.3, 5.75, 6.15]
  const GX = 0.05
  const GZ = -0.15
  return (t: number) => {
    const u = t % P35
    const odd = Math.floor(t / P35) % 2 === 1
    const guest = odd ? gB : gA
    ;(odd ? gA : gB).object.visible = false
    guest.object.visible = true
    /* the guest: in from the right, unpacks, checks out with the suitcase */
    const gin = seg(u, 0, 1.1)
    const gout = seg(u, 2.2, 3.4)
    const gx = lerp(lerp(3.9, GX, gin), 3.9, gout)
    const gw = (u < 1.2) || (u > 2.2 && u < 3.4)
    guest.object.position.set(gx, gw ? Math.abs(Math.sin(u * 7)) * 0.03 : 0, GZ)
    guest.update(u, camera)
    suit.position.set(gx + 0.5, 0, GZ + 0.05)
    suit.rotation.z = gw ? -0.25 : 0
    /* housekeeping: in, clears each thing, out */
    const hin = seg(u, 3.35, 4.3)
    const hout = seg(u, 6.5, 7.55)
    const hx = lerp(lerp(3.9, 0.15, hin), 3.9, hout)
    const hw = (u > 3.35 && u < 4.3) || (u > 6.5 && u < 7.55)
    hk.object.position.set(hx, hw ? Math.abs(Math.sin(u * 7)) * 0.03 : 0, GZ)
    hk.object.visible = u > 3.3 && u < 7.6
    hk.update(u, camera)
    /* the bed: rumpled from the stay until housekeeping makes it */
    const used = seg(u, 1.0, 1.3) * (1 - seg(u, 4.45, 4.8))
    pop(rumple, used)
    neat.scale.set(1, 1, Math.max(0.0001, 1 - used))
    neat.visible = used < 0.98
    things.forEach((th, i) => {
      const k = seg(u, unpack[i], unpack[i] + 0.25) * (1 - seg(u, clear[i], clear[i] + 0.3))
      pop(th.o, k)
      th.s.set(lin(u, clear[i], clear[i] + 0.55))
    })
  }
}

/* ================================================================== S35 · CONCEPT: an execution environment's /tmp */

function folder3d() {
  const g = new THREE.Group()
  const back = mat('#2D63FB', { roughness: 0.45 })
  const front = mat('#5B8CFF', { roughness: 0.45 })
  g.add(mesh(rbox(1.1, 0.78, 0.06, 0.03), back, [0, 0.39, -0.1]))
  g.add(mesh(rbox(0.42, 0.14, 0.06, 0.03), back, [-0.32, 0.82, -0.1]))
  const fr = mesh(rbox(1.1, 0.62, 0.06, 0.03), front, [0, 0.31, 0.1])
  fr.rotation.x = -0.18
  g.add(fr)
  return g
}
function sheet(i: number) {
  const tex = canvasTex(128, 160, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 128, 160)
    g.fillStyle = ['#2D63FB', '#F07E2A', '#16A34A', '#8C6BE8'][i % 4]
    g.fillRect(14, 16, 60, 12)
    g.fillStyle = '#C9D3E6'
    for (let y = 44; y < 146; y += 18) g.fillRect(14, y, 100 - ((y * 7) % 30), 8)
  })
  const o = mesh(new THREE.BoxGeometry(0.5, 0.62, 0.012), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }))
  return o
}

function setupTmp({ scene, camera, redraw }: StageKit) {
  frame(camera, -0.1, -0.75, 0.85, 8.7, 4.6)
  rig(scene, [0, 0.5, -0.5])
  floorSlab(scene, -3.1, -2.1, 6.4, 5.8, '#E3E9F5', '#D3DCEC', [5, 3])
  walls(scene, -3.1, -2.1, 6.4, 4.3, 2.7, '#EEF2FB')
  /* the execution environment where the room was: a glass enclosure on a base with the Lambda mark */
  const env = new THREE.Group()
  env.position.set(-0.75, 0, -0.75)
  const baseM = mat(C.navy, { roughness: 0.5 })
  env.add(mesh(rbox(2.8, 0.18, 2.0, 0.05), baseM, [0, 0.09, 0]))
  const glassM = new THREE.MeshStandardMaterial({ color: '#BFD4FF', emissive: C.brand, emissiveIntensity: 0.08, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false })
  const glass = new THREE.Mesh(rbox(2.7, 1.6, 1.9, 0.08), glassM)
  glass.position.y = 0.98
  glass.renderOrder = 2
  env.add(glass)
  const edgeM = new THREE.LineBasicMaterial({ color: '#5B8CFF', transparent: true, opacity: 0.9 })
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.7, 1.6, 1.9)), edgeM)
  edges.position.y = 0.98
  env.add(edges)
  const lam = markTex(lambdaUrl, redraw)
  const tag = mesh(new THREE.BoxGeometry(0.34, 0.34, 0.02), new THREE.MeshStandardMaterial({ map: lam, roughness: 0.4 }), [-1.1, 0.09, 1.02])
  env.add(tag)
  /* the /tmp folder inside, where the bed stood */
  const fold = folder3d()
  fold.position.set(-0.35, 0.18, -0.25)
  fold.scale.setScalar(1.25)
  env.add(fold)
  scene.add(env)
  /* files: land in the folder during the invocation, vanish when the environment is recycled */
  const files: { o: THREE.Mesh; s: ReturnType<typeof sparkles> }[] = []
  for (let i = 0; i < 4; i++) {
    const o = sheet(i)
    scene.add(o)
    const s = sparkles()
    s.g.position.set(-1.1 + i * 0.12, 0.9, -1.0)
    scene.add(s.g)
    files.push({ o, s })
  }
  /* the request (the guest) and the platform's recycle sweep (housekeeping) */
  const req = packet('#5B8CFF', 0.16)
  scene.add(req)
  const sweepM = new THREE.MeshStandardMaterial({ color: '#7CF0B8', emissive: '#3BE59A', emissiveIntensity: 1.2, transparent: true, opacity: 0.85 })
  const sweep = mesh(new THREE.TorusGeometry(1.75, 0.04, 10, 80), sweepM)
  sweep.rotation.x = Math.PI / 2
  sweep.scale.set(1.12, 0.82, 1)
  sweep.position.set(-0.75, 0, -0.75)
  scene.add(sweep)
  /* the recycler: a pair of arrows turning above the sweep */
  const rec = new THREE.Group()
  for (let k = 0; k < 2; k++) {
    const a = mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 30, Math.PI * 0.8), sweepM)
    a.rotation.z = k * Math.PI
    const head = mesh(new THREE.ConeGeometry(0.08, 0.16, 12), sweepM, [Math.cos(Math.PI * 0.8) * 0.22, Math.sin(Math.PI * 0.8) * 0.22, 0])
    head.rotation.z = Math.PI * 0.8 + Math.PI
    const arm = new THREE.Group()
    arm.add(a, head)
    arm.rotation.z = k * Math.PI
    rec.add(arm)
  }
  scene.add(rec)
  const fileHome = (i: number) => new THREE.Vector3(-1.2 + i * 0.15, 1.08 + i * 0.03, -1.05 + i * 0.02)
  return (t: number) => {
    const u = t % P35
    /* request in from the right (0 → 1.2), files land (1.2 → 2.2), request out (2.2 → 3.4) */
    const rin = seg(u, 0, 1.1)
    const rout = seg(u, 2.2, 3.4)
    req.visible = u < 3.4
    req.position.set(lerp(lerp(3.9, 0.75, rin), 3.9, rout), 0.55 + Math.sin(u * 6) * 0.04, 0.35)
    /* the environment is recycled (5.4 → 5.9 gone) and rebuilt fresh (5.9 → 6.6) */
    const gone = seg(u, 5.35, 5.85) * (1 - seg(u, 5.95, 6.6))
    const s = (1 - gone) * 1.15
    env.scale.set(Math.max(0.0001, s), Math.max(0.0001, s), Math.max(0.0001, s))
    env.visible = s > 0.01
    glassM.emissiveIntensity = 0.08 + (u > 1.2 && u < 3.4 ? 0.12 + 0.06 * Math.sin(u * 8) : 0) + bump(u, 5.95, 6.9) * 0.3
    edgeM.opacity = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.4))
    files.forEach((f, i) => {
      const a = 1.25 + i * 0.22
      const land = seg(u, a, a + 0.45)
      const off = seg(u, 4.6 + i * 0.18, 4.9 + i * 0.18)
      const home = fileHome(i)
      f.o.position.set(lerp(0.6, home.x, land), lerp(1.9, home.y, land), lerp(0.35, home.z, land))
      f.o.rotation.set(-0.15, 0.1 * i, (1 - land) * 1.2)
      pop(f.o, land * (1 - off))
      f.s.g.position.copy(home)
      f.s.set(lin(u, 4.6 + i * 0.18, 5.15 + i * 0.18))
    })
    /* the sweep descends round the environment, rises away */
    const sin_ = seg(u, 3.4, 4.3)
    const sout = seg(u, 6.5, 7.55)
    sweep.visible = u > 3.35 && u < 7.6
    sweep.position.y = lerp(lerp(3.2, 0.9, sin_), 3.4, sout) + Math.sin(u * 5) * 0.05
    sweepM.opacity = 0.85 * (1 - sout)
    rec.visible = sweep.visible
    rec.position.set(-0.75, sweep.position.y + 0.55, -0.35)
    rec.rotation.z = -u * 3
    ;(rec.children as THREE.Object3D[]).forEach((c) => c.scale.setScalar(1))
  }
}

/* ================================================================== S39 · EVERYDAY: the house on the power grid */

const P39 = 6.45

/** a beam between two points */
function beam(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) {
  const len = a.distanceTo(b)
  const o = mesh(new THREE.CylinderGeometry(r, r, len, 6), m)
  o.position.copy(a).add(b).multiplyScalar(0.5)
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return o
}
/** a lattice transmission tower: four legs tapering to the top, X-braced, two cross-arms with insulators */
function pylon(h = 2.9) {
  const g = new THREE.Group()
  const m = mat('#8E9BB5', { metalness: 0.6, roughness: 0.35 })
  const half = (y: number) => lerp(0.42, 0.1, y / h)
  const corner = (y: number, sx: number, sz: number) => new THREE.Vector3(sx * half(y), y, sz * half(y))
  const C4: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (const [sx, sz] of C4) g.add(beam(corner(0, sx, sz), corner(h, sx, sz), 0.028, m))
  const levels = [0, 0.7, 1.35, 1.95, 2.5, h]
  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i]
    const y1 = levels[i + 1]
    for (let k = 0; k < 4; k++) {
      const [ax, az] = C4[k]
      const [bx, bz] = C4[(k + 1) % 4]
      g.add(beam(corner(y1, ax, az), corner(y1, bx, bz), 0.014, m))
      g.add(beam(corner(y0, ax, az), corner(y1, bx, bz), 0.01, m))
      g.add(beam(corner(y0, bx, bz), corner(y1, ax, az), 0.01, m))
    }
  }
  for (const y of [h - 0.15, h - 0.6]) {
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), m, [0, y, 0]))
    for (const x of [-0.55, 0.55]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), mat('#6E86C9'), [x, y - 0.1, 0]))
  }
  return g
}

/** a flat wall in the x-y plane with rectangular openings, `t` thick, its outer face at z = 0 (extruded toward -z) */
function holedWall(w: number, h: number, t: number, holes: [number, number, number, number][], m: THREE.Material) {
  const sh = new THREE.Shape()
  sh.moveTo(-w / 2, 0)
  sh.lineTo(w / 2, 0)
  sh.lineTo(w / 2, h)
  sh.lineTo(-w / 2, h)
  sh.closePath()
  for (const [x0, y0, x1, y1] of holes) {
    const hp = new THREE.Path()
    hp.moveTo(x0, y0)
    hp.lineTo(x0, y1)
    hp.lineTo(x1, y1)
    hp.lineTo(x1, y0)
    hp.closePath()
    sh.holes.push(hp)
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false })
  geo.translate(0, 0, -t)
  const o = new THREE.Mesh(geo, m)
  o.castShadow = o.receiveShadow = true
  return o
}

/*
  THE HOUSE READS AS A HOUSE (Session 10 review, slide 39): four walls, a pitched tiled roof with a ridge, a brick
  chimney, a front door (open, the resident in the doorway) and a big front window with white frames. The lamp, the TV
  and the kettle stand inside behind the window and come on in turn as the grid's current flows in over the line; the
  window glows warm while they draw. The generator shed next door stays dark and unused.
*/
function setupGrid({ scene, camera, redraw }: StageKit) {
  frame(camera, -0.2, -0.5, 1.2, 10.0, 4.1)
  rig(scene, [0, 0.6, -0.4])
  const grass = mesh(new THREE.BoxGeometry(11.4, 0.2, 7.4), mat(C.grass, { roughness: 0.95 }), [0, -0.1, 1.0])
  grass.castShadow = false
  scene.add(grass)
  /* the pylon on the left, its line to the house */
  const PX = -2.85
  const PZ = -1.3
  const py = pylon(2.9)
  py.position.set(PX, 0, PZ)
  scene.add(py)

  /* ---- the house: 2.7 wide (x), 2.0 deep (z), walls 1.75 high on a plinth, gable roof along x */
  const HX = -0.15
  const HZ = -0.55
  const HW = 2.7
  const HD = 2.0
  const WH = 1.75
  const BASE = 0.12
  const RIDGE = 0.78
  const house = new THREE.Group()
  house.position.set(HX, 0, HZ)
  scene.add(house)
  house.add(mesh(rbox(HW + 0.2, BASE, HD + 0.2, 0.03), mat('#CFC3B0', { roughness: 0.9 }), [0, BASE / 2, 0]))
  house.add(mesh(new THREE.BoxGeometry(HW - 0.2, 0.01, HD - 0.2), mat('#E9DCC8', { roughness: 0.85 }), [0, BASE + 0.005, 0]))
  const wallM = mat('#FFF1DC', { roughness: 0.85 })
  const trimM = mat('#FFFFFF', { roughness: 0.5 })
  /* front wall: the big window (left) and the door (right) */
  const WIN: [number, number, number, number] = [-1.12, 0.62, 0.28, 1.45]
  const DOOR: [number, number, number, number] = [0.55, 0.02, 1.12, 1.64]
  const front = holedWall(HW, WH, 0.1, [WIN, DOOR], wallM)
  front.position.set(0, BASE, HD / 2)
  house.add(front)
  /* back wall, and the two gable walls (pentagons rising to the ridge) */
  house.add(mesh(new THREE.BoxGeometry(HW, WH, 0.1), wallM, [0, BASE + WH / 2, -HD / 2 + 0.05]))
  const gable = new THREE.Shape()
  gable.moveTo(-HD / 2, 0)
  gable.lineTo(HD / 2, 0)
  gable.lineTo(HD / 2, WH)
  gable.lineTo(0, WH + RIDGE)
  gable.lineTo(-HD / 2, WH)
  gable.closePath()
  for (const sx of [-1, 1]) {
    const g = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.1, bevelEnabled: false }), wallM)
    g.castShadow = g.receiveShadow = true
    g.rotation.y = Math.PI / 2
    g.position.set(sx < 0 ? -HW / 2 : HW / 2 - 0.1, BASE, 0)
    house.add(g)
  }
  /* the roof: two tiled slabs meeting at a ridge cap, an overhang all round */
  const tiles = canvasTex(128, 128, (g) => {
    g.fillStyle = '#2F5BD8'
    g.fillRect(0, 0, 128, 128)
    for (let r = 0; r < 8; r++) {
      g.fillStyle = r % 2 ? '#2A52C6' : '#3463E3'
      g.fillRect(0, r * 16, 128, 14)
      g.fillStyle = '#1E3FA3'
      for (let c = 0; c < 6; c++) g.fillRect(((c * 24 + (r % 2) * 12) % 128), r * 16, 2, 14)
    }
  }, [2, 1])
  const roofM = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6 })
  const theta = Math.atan2(RIDGE, HD / 2)
  const slope = Math.hypot(RIDGE, HD / 2)
  const SL = slope + 0.24
  for (const sz of [1, -1]) {
    const r = mesh(new THREE.BoxGeometry(HW + 0.36, 0.08, SL), roofM)
    r.rotation.x = sz * theta
    const nz = Math.sin(theta) * 0.04
    const ny = Math.cos(theta) * 0.04
    r.position.set(0, BASE + WH + RIDGE / 2 + ny - Math.sin(theta) * 0.1, sz * (HD / 4 + nz + Math.cos(theta) * 0.1))
    house.add(r)
  }
  const ridge = mesh(new THREE.CylinderGeometry(0.06, 0.06, HW + 0.4, 14), mat('#1E3FA3', { roughness: 0.5 }), [0, BASE + WH + RIDGE + 0.04, 0])
  ridge.rotation.z = Math.PI / 2
  house.add(ridge)
  /* the chimney: brick, through the front slope, with a cap */
  const bricks = canvasTex(64, 64, (g) => {
    g.fillStyle = '#B9472F'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#D9654A'
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) g.fillRect(c * 16 + (r % 2) * 8 + 1, r * 8 + 1, 14, 6)
  })
  const chimM = new THREE.MeshStandardMaterial({ map: bricks, roughness: 0.85 })
  const CHX = 0.78
  const CHZ = 0.3
  const roofAt = BASE + WH + RIDGE * (1 - CHZ / (HD / 2))
  house.add(mesh(new THREE.BoxGeometry(0.3, 0.75, 0.3), chimM, [CHX, roofAt + 0.2, CHZ]))
  house.add(mesh(rbox(0.38, 0.07, 0.38, 0.02), mat('#5A6378'), [CHX, roofAt + 0.6, CHZ]))
  /* the window: white frame, a cross of mullions, a sill, glass that glows warm while the house draws power */
  const [wx0, wy0, wx1, wy1] = WIN
  const wcx = (wx0 + wx1) / 2
  const wcy = BASE + (wy0 + wy1) / 2
  const ww = wx1 - wx0
  const wh = wy1 - wy0
  const FZ = HD / 2 + 0.01
  house.add(mesh(new THREE.BoxGeometry(ww + 0.1, 0.05, 0.05), trimM, [wcx, BASE + wy1 + 0.02, FZ]), mesh(new THREE.BoxGeometry(ww + 0.1, 0.05, 0.05), trimM, [wcx, BASE + wy0 - 0.02, FZ]))
  house.add(mesh(new THREE.BoxGeometry(0.05, wh + 0.08, 0.05), trimM, [wx0 - 0.02, wcy, FZ]), mesh(new THREE.BoxGeometry(0.05, wh + 0.08, 0.05), trimM, [wx1 + 0.02, wcy, FZ]))
  house.add(mesh(new THREE.BoxGeometry(0.035, wh, 0.035), trimM, [wcx, wcy, FZ - 0.01]), mesh(new THREE.BoxGeometry(ww, 0.035, 0.035), trimM, [wcx, wcy, FZ - 0.01]))
  house.add(mesh(rbox(ww + 0.22, 0.05, 0.14, 0.015), trimM, [wcx, BASE + wy0 - 0.05, FZ + 0.04]))
  const glassM = new THREE.MeshStandardMaterial({ color: '#CFE3FF', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, emissive: '#FFD98A', emissiveIntensity: 0, depthWrite: false })
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassM)
  glass.position.set(wcx, wcy, HD / 2 - 0.05)
  glass.renderOrder = 3
  house.add(glass)
  /* the door: swung open INTO the house on its right-hand hinge (it never covers the resident), a frame, a step */
  const [dx0, , dx1, dy1] = DOOR
  const dcx = (dx0 + dx1) / 2
  const doorW = dx1 - dx0
  house.add(mesh(new THREE.BoxGeometry(doorW + 0.1, 0.05, 0.05), trimM, [dcx, BASE + dy1 + 0.02, FZ]))
  house.add(mesh(new THREE.BoxGeometry(0.05, dy1, 0.05), trimM, [dx0 - 0.02, BASE + dy1 / 2, FZ]), mesh(new THREE.BoxGeometry(0.05, dy1, 0.05), trimM, [dx1 + 0.02, BASE + dy1 / 2, FZ]))
  const doorG = new THREE.Group()
  doorG.position.set(dx1, BASE, HD / 2 - 0.1)
  doorG.rotation.y = -1.25
  const doorM = mat('#B0744A', { roughness: 0.6 })
  doorG.add(mesh(rbox(doorW - 0.02, dy1 - 0.04, 0.05, 0.02), doorM, [-(doorW - 0.02) / 2, (dy1 - 0.04) / 2 + 0.02, 0]))
  doorG.add(mesh(new THREE.SphereGeometry(0.03, 10, 8), mat('#F2C14E', { metalness: 0.7, roughness: 0.3 }), [-(doorW - 0.1), 0.85, 0.04]))
  house.add(doorG)
  house.add(mesh(rbox(doorW + 0.3, 0.06, 0.3, 0.02), mat('#BFB4A2'), [dcx, 0.03, HD / 2 + 0.2]))
  /* the room inside: a soft warm fill so the things behind the window read; the lamp adds its own light */
  const fill = new THREE.PointLight('#FFF1D6', 0.7, 1.7)
  fill.position.set(-0.4, 1.2, 0.1)
  house.add(fill)

  /* lamp on a side table (left), TV on its stand (centre), kettle on a counter (right): all behind the window */
  const IZ = 0.42
  const lampShadeM = new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFD66B', emissiveIntensity: 0, roughness: 0.6 })
  house.add(mesh(rbox(0.34, 0.5, 0.34, 0.03), mat(C.woodDark), [-0.92, BASE + 0.25, IZ]))
  house.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 10), mat('#5A6378'), [-0.92, BASE + 0.65, IZ]))
  house.add(mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 20, 1, true), lampShadeM, [-0.92, BASE + 0.86, IZ]))
  const lampLight = new THREE.PointLight('#FFD66B', 0, 1.3)
  lampLight.position.set(-0.92, BASE + 0.85, IZ)
  house.add(lampLight)
  house.add(mesh(rbox(0.62, 0.3, 0.32, 0.03), mat(C.woodDark), [-0.38, BASE + 0.15, IZ - 0.05]))
  house.add(mesh(rbox(0.6, 0.38, 0.05, 0.02), mat('#1F2430'), [-0.38, BASE + 0.62, IZ - 0.1]))
  const tvTex = canvasTex(128, 80, (g) => {
    const gr = g.createLinearGradient(0, 0, 128, 80)
    gr.addColorStop(0, '#5B8CFF')
    gr.addColorStop(1, '#9CE0FF')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 80)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.arc(40, 50, 18, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#F2C14E'
    g.fillRect(70, 20, 40, 40)
  })
  tvTex.wrapS = THREE.RepeatWrapping
  const tvM = new THREE.MeshStandardMaterial({ color: '#0E1424', emissive: '#FFFFFF', emissiveMap: tvTex, emissiveIntensity: 0, roughness: 0.3, map: tvTex })
  house.add(mesh(new THREE.PlaneGeometry(0.54, 0.32), tvM, [-0.38, BASE + 0.62, IZ - 0.073]))
  house.add(mesh(rbox(0.3, 0.52, 0.34, 0.03), mat('#E8EEF8'), [0.12, BASE + 0.26, IZ]))
  const ket = new THREE.Group()
  ket.position.set(0.12, BASE + 0.52, IZ)
  ket.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 20), mat('#C9D3E6', { metalness: 0.6, roughness: 0.25 }), [0, 0.09, 0]))
  ket.add(mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 16, Math.PI), mat('#2A2F3D'), [0, 0.2, 0]))
  const ketLedM = new THREE.MeshStandardMaterial({ color: '#5A2A20', emissive: '#FF7A3D', emissiveIntensity: 0 })
  ket.add(mesh(new THREE.SphereGeometry(0.018, 10, 10), ketLedM, [0, 0.04, 0.1]))
  house.add(ket)
  const steam: THREE.Mesh[] = []
  const steamM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, roughness: 1 })
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), steamM.clone())
    house.add(s)
    steam.push(s)
  }

  /* the service entry on the left gable: an insulator bracket where the line arrives */
  const entryL = new THREE.Vector3(-HW / 2 - 0.12, BASE + WH - 0.12, 0.25)
  house.add(mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mat('#5A6378'), [entryL.x + 0.07, entryL.y, entryL.z]))
  house.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), mat('#6E86C9'), [entryL.x, entryL.y - 0.05, entryL.z]))
  const entryW = entryL.clone().add(house.position)
  /* the line: pylon cross-arm to the house entry, a sagging curve; one more span leaving the card to the left */
  const a = new THREE.Vector3(PX + 0.55, 2.62, PZ)
  const line = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + entryW.x) / 2, Math.min(a.y, entryW.y) - 0.3, (a.z + entryW.z) / 2), entryW)
  scene.add(mesh(new THREE.TubeGeometry(line, 40, 0.014, 6, false), mat('#3A4256')))
  const a2 = new THREE.Vector3(PX - 0.55, 2.62, PZ)
  scene.add(mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a2, new THREE.Vector3(PX - 1.2, 2.15, PZ), new THREE.Vector3(PX - 1.9, 2.35, PZ)), 20, 0.014, 6, false), mat('#3A4256')))
  /* current pulses on the line into the house */
  const pm = new THREE.MeshStandardMaterial({ color: '#FFE08A', emissive: '#FFC93D', emissiveIntensity: 1.6 })
  const pulses = Array.from({ length: 5 }, () => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), pm)
    scene.add(p)
    return p
  })

  /* the generator shed on the right: closed off, dark, unused */
  const shed = new THREE.Group()
  shed.position.set(2.3, 0, -0.75)
  shed.add(mesh(rbox(1.15, 0.08, 1.2, 0.02), mat('#9AA4B8'), [0, 0.04, 0]))
  const shedM = mat('#7C8598', { roughness: 0.85 })
  shed.add(mesh(new THREE.BoxGeometry(1.15, 1.2, 0.06), shedM, [0, 0.64, -0.57]))
  shed.add(mesh(new THREE.BoxGeometry(0.06, 1.2, 1.2), shedM, [0.55, 0.64, 0]))
  const sroof = mesh(new THREE.BoxGeometry(1.3, 0.08, 1.35), mat('#5A6378'), [0, 1.28, 0])
  sroof.rotation.z = 0.08
  shed.add(sroof)
  const gen = new THREE.Group()
  gen.position.set(-0.05, 0.08, -0.05)
  gen.add(mesh(rbox(0.7, 0.46, 0.5, 0.04), mat('#4E5668', { roughness: 0.7 }), [0, 0.29, 0]))
  gen.add(mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), mat('#3A4256'), [0, 0.06, 0.2]), mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), mat('#3A4256'), [0, 0.06, -0.2]))
  gen.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), mat('#3A4256'), [0.24, 0.62, -0.1]))
  gen.add(mesh(new THREE.BoxGeometry(0.3, 0.14, 0.02), mat('#2A2F3D'), [-0.12, 0.36, 0.26]))
  shed.add(gen)
  scene.add(shed)

  /* the resident: in her open doorway, she switches things on (presentLeft toward the window), pleased */
  const res = rigSprite({
    config: RESIDENT,
    loop: P39,
    frames: 26,
    height: 1.5,
    onReady: redraw,
    timeline: (t) => ({
      seed: 23,
      idle: CAST_IDLE,
      life: 0,
      ...(t < 0.5 ? face('neutral', 0) : face('happy', 0.5, 'neutral', 0)),
      gesture: t >= 0.05 && t < 1.35 ? castClip('presentLeft', 0.05) : undefined,
    }),
  })
  res.object.position.set(HX + dcx, BASE, HZ + HD / 2 + 0.06)
  scene.add(res.object)

  const lampOn = (u: number) => seg(u, 0.2, 0.45) * (1 - seg(u, 5.95, 6.2))
  const tvOn = (u: number) => seg(u, 0.85, 1.1) * (1 - seg(u, 6.0, 6.25))
  const ketOn = (u: number) => seg(u, 1.5, 1.75) * (1 - seg(u, 6.05, 6.3))
  return (t: number) => {
    const u = t % P39
    const on = [lampOn(u), tvOn(u), ketOn(u)]
    const draw = (on[0] + on[1] + on[2]) / 3
    /* the grid always carries current; it flows into the house as fast as the appliances draw */
    pulses.forEach((p, i) => {
      const k = ((t * 0.55 + i / pulses.length) % 1 + 1) % 1
      p.position.copy(line.getPoint(k))
      p.scale.setScalar(0.7 + 0.6 * draw)
    })
    lampShadeM.emissiveIntensity = on[0] * 1.2
    lampLight.intensity = on[0] * 1.8
    tvM.emissiveIntensity = on[1] * 0.95
    tvTex.offset.x = (t * 0.08) % 1
    ketLedM.emissiveIntensity = on[2] * 1.8
    glassM.emissiveIntensity = draw * 0.35
    steam.forEach((s, i) => {
      const k = (((t * 0.7 + i / steam.length) % 1) + 1) % 1
      const sm = s.material as THREE.MeshStandardMaterial
      sm.opacity = seg(u, 2.3, 2.7) * (1 - seg(u, 5.85, 6.25)) * Math.sin(Math.PI * k) * 0.7
      s.position.set(0.12 + Math.sin(k * 6 + i) * 0.03, BASE + 0.78 + k * 0.4, IZ)
      s.scale.setScalar(0.6 + k * 1.0)
    })
    res.update(u, camera)
  }
}

/* ================================================================== S39 · CONCEPT: an application calling managed services */

function setupBaaS({ scene, camera, redraw }: StageKit) {
  frame(camera, -0.2, -0.3, 1.05, 10.0, 4.4)
  rig(scene, [0, 0.6, -0.4])
  floorSlab(scene, -5.3, -2.5, 10.6, 7.0, '#E3E9F5', '#D3DCEC', [5, 3])
  /* the managed services on the left, where the pylon stood: three marks on a cloud platform */
  const cloud = new THREE.Group()
  cloud.position.set(-2.7, 0, -1.1)
  const cm = mat('#FFFFFF', { roughness: 0.9 })
  ;[
    [0, 0.18, 0, 0.62],
    [-0.5, 0.14, 0.15, 0.45],
    [0.5, 0.14, 0.1, 0.48],
    [0, 0.12, 0.45, 0.42],
  ].forEach(([x, y, z, r]) => {
    const s = mesh(new THREE.SphereGeometry(r, 24, 18), cm, [x, y, z])
    s.scale.y = 0.45
    cloud.add(s)
  })
  scene.add(cloud)
  const urls = [dynamoUrl, cognitoUrl, s3Url]
  const sides = ['#C925D1', '#DD344C', '#7AA116']
  const svc = urls.map((url, i) => {
    const b = markBox(0.62, markTex(url, redraw), sides[i], 0.15)
    const g = new THREE.Group()
    g.position.set(-2.7, 0, -1.1)
    const off = [[0, 1.9, -0.1], [-0.5, 1.05, 0.25], [0.55, 1.05, 0.2]][i]
    b.o.position.set(off[0], off[1], off[2])
    g.add(b.o)
    scene.add(g)
    return { b, at: new THREE.Vector3(-2.7 + off[0] + 0.3, off[1], -1.1 + off[2] + 0.2) }
  })
  /* the application where the house stood: a big monitor on a desk with three panels (data, login, file) */
  const app = new THREE.Group()
  app.position.set(-0.4, 0, -0.4)
  app.add(mesh(rbox(2.6, 0.08, 1.2, 0.03), mat(C.wood), [0, 0.78, -0.3]))
  for (const x of [-1.2, 1.2]) for (const z of [-0.8, 0.2]) app.add(mesh(new THREE.BoxGeometry(0.06, 0.76, 0.06), mat(C.woodDark), [x, 0.38, z]))
  app.add(mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), mat('#5A6378'), [0, 1.0, -0.55]))
  app.add(mesh(rbox(2.3, 1.3, 0.08, 0.04), mat('#1F2430'), [0, 1.85, -0.6]))
  const panelTex = (kind: number) =>
    canvasTex(160, 200, (g) => {
      g.fillStyle = '#FFFFFF'
      g.fillRect(0, 0, 160, 200)
      g.fillStyle = sides[kind]
      g.fillRect(0, 0, 160, 18)
      if (kind === 0) {
        for (let r = 0; r < 6; r++) {
          g.fillStyle = r % 2 ? '#E3E9F5' : '#F4F7FD'
          g.fillRect(14, 34 + r * 26, 132, 22)
          g.fillStyle = '#9AA8C6'
          g.fillRect(20, 42 + r * 26, 40, 6)
          g.fillRect(70, 42 + r * 26, 60, 6)
        }
      } else if (kind === 1) {
        g.fillStyle = '#C9D3E6'
        g.beginPath()
        g.arc(80, 70, 28, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.arc(80, 130, 44, Math.PI, 0)
        g.fill()
        g.fillStyle = '#BE0917'
        g.fillRect(56, 150, 48, 34)
        g.strokeStyle = '#BE0917'
        g.lineWidth = 7
        g.beginPath()
        g.arc(80, 150, 15, Math.PI, 0)
        g.stroke()
      } else {
        g.fillStyle = '#E3F2E0'
        g.fillRect(20, 34, 120, 92)
        g.fillStyle = '#7AA116'
        g.beginPath()
        g.moveTo(26, 120)
        g.lineTo(70, 70)
        g.lineTo(100, 104)
        g.lineTo(118, 86)
        g.lineTo(136, 120)
        g.fill()
        g.fillStyle = '#F2C14E'
        g.beginPath()
        g.arc(116, 56, 11, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#C9D3E6'
        g.fillRect(20, 140, 120, 10)
        g.fillRect(20, 160, 80, 10)
      }
    })
  const panels = [0, 1, 2].map((k) => {
    const m = new THREE.MeshStandardMaterial({ map: panelTex(k), emissive: '#FFFFFF', emissiveMap: panelTex(k), emissiveIntensity: 0, roughness: 0.4, color: '#20283A' })
    const p = mesh(new THREE.PlaneGeometry(0.66, 0.92), m, [-0.73 + k * 0.73, 1.85, -0.555])
    app.add(p)
    return m
  })
  scene.add(app)
  /* the app's API lines up to each service, with request pulses up and responses back */
  const appAt = [0, 1, 2].map((k) => new THREE.Vector3(-0.4 - 0.73 + k * 0.73, 2.35, -0.95))
  const lines = svc.map((s, i) => {
    const a = appAt[i]
    const c = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + s.at.x) / 2, Math.max(a.y, s.at.y) + 0.55 - i * 0.1, (a.z + s.at.z) / 2), s.at)
    const lm = new THREE.MeshStandardMaterial({ color: '#9CC2FF', emissive: C.brand, emissiveIntensity: 0, transparent: true, opacity: 0.85 })
    scene.add(mesh(new THREE.TubeGeometry(c, 40, 0.018, 6, false), lm))
    const up = packet('#5B8CFF', 0.06)
    const down = packet('#3BD18A', 0.06)
    scene.add(up, down)
    return { c, lm, up, down }
  })
  /* the empty server plinth on the right, where the generator shed stood: a frame with nothing in it, dark */
  const plinth = new THREE.Group()
  plinth.position.set(2.2, 0, -0.75)
  plinth.add(mesh(rbox(1.25, 0.08, 1.2, 0.02), mat('#9AA4B8'), [0, 0.04, 0]))
  const fm = mat('#4E5668', { metalness: 0.4, roughness: 0.5 })
  for (const x of [-0.42, 0.42]) for (const z of [-0.35, 0.35]) plinth.add(mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), fm, [x, 0.83, z]))
  for (const y of [0.1, 1.58]) {
    plinth.add(mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), fm, [0, y, -0.35]), mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), fm, [0, y, 0.35]))
    plinth.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 0.76), fm, [-0.42, y, 0]), mesh(new THREE.BoxGeometry(0.06, 0.06, 0.76), fm, [0.42, y, 0]))
  }
  for (let y = 0.4; y < 1.5; y += 0.3) plinth.add(mesh(new THREE.BoxGeometry(0.04, 0.02, 0.7), mat('#3A4256'), [0.38, y, 0]))
  scene.add(plinth)

  const on = (u: number, a: number, b: number) => seg(u, a, a + 0.25) * (1 - seg(u, b, b + 0.25))
  return (t: number) => {
    const u = t % P39
    const ons = [on(u, 0.2, 5.95), on(u, 0.85, 6.0), on(u, 1.5, 6.05)]
    lines.forEach((l, i) => {
      l.lm.emissiveIntensity = 0.15 + ons[i] * (0.7 + 0.3 * Math.sin(t * 6 + i))
      const k = (((t * 0.6 + i * 0.33) % 1) + 1) % 1
      l.up.visible = l.down.visible = ons[i] > 0.5
      l.up.position.copy(l.c.getPoint(k))
      l.down.position.copy(l.c.getPoint(1 - (((k + 0.5) % 1))))
      panels[i].emissiveIntensity = ons[i] * 0.85
      panels[i].color.set(ons[i] > 0.5 ? '#FFFFFF' : '#20283A')
      svc[i].b.faceM.emissiveIntensity = 0.12 + ons[i] * 0.25 * (0.5 + 0.5 * Math.sin(t * 5 + i))
      svc[i].b.o.position.y += 0
    })
    svc.forEach((s, i) => (s.b.o.rotation.y = Math.sin(t * 1.4 + i) * 0.12))
  }
}

/* ================================================================== S43 · EVERYDAY: the daily commuters, side by side */

/* Left: commuter A in the back of the taxi, his fares stacking two coins a day in front of it. Right: commuter B at the
   wheel of her own car, one flat stack (and her key) that never grows. Both cars drive the same route each day (the road
   slides under them, wheels turning) while the sun crosses once per day. Three days a loop, then the fares clear. */
const DAY = 2.5
const P43 = DAY * 3 + 0.2
const AX = -1.45
const BX = 1.45
const COIN_R = 0.25
const COIN_H = 0.13

function bigCoins(n: number, m: THREE.Material) {
  const g = new THREE.Group()
  const coins: THREE.Mesh[] = []
  for (let i = 0; i < n; i++) {
    const c = mesh(new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_H, 32), m)
    c.position.set(((i * 37) % 5) * 0.008 - 0.016, COIN_H / 2 + i * (COIN_H + 0.012), ((i * 53) % 7) * 0.006 - 0.018)
    g.add(c)
    coins.push(c)
  }
  return { g, coins }
}
const coinTop = (i: number) => COIN_H / 2 + i * (COIN_H + 0.012)
/** both S43 cards: the per-use pile's coins land at these times (two a day), from a short drop just above the pile */
const landAt = (i: number) => Math.floor(i / 2) * DAY + (i % 2 ? 1.95 : 0.95)
const PILE_S = 0.7
/** the drop, in pile units: 0.2 scene units at PILE_S, short enough to stay below the road line in camera space */
const COIN_DROP = 0.32
const DROP_H = 0.2 / PILE_S
function dropPile(coins: THREE.Mesh[], u: number, period: number) {
  const clear = seg(u, DAY * 3, period - 0.02)
  coins.forEach((c, i) => {
    const k = lin(u, landAt(i) - COIN_DROP, landAt(i))
    c.visible = k > 0 && clear < 0.999
    c.position.y = coinTop(i) + (1 - k * k) * DROP_H
    c.scale.setScalar(Math.max(0.0001, (0.7 + 0.3 * Math.min(1, k * 3)) * (1 - clear)))
  })
}

/** the day marker: a sun crossing the sky once per day, faded in and out at the ends of its arc */
function sun(scene: THREE.Scene, y = 1.75, z = -1.9) {
  const m = new THREE.MeshStandardMaterial({ color: '#FFD66B', emissive: '#FFC93D', emissiveIntensity: 1.2, transparent: true })
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), m)
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), new THREE.MeshBasicMaterial({ color: '#FFE9A8', transparent: true, opacity: 0.3, depthWrite: false }))
  o.add(halo)
  scene.add(o)
  return (d: number) => {
    const k = d / DAY
    o.position.set(lerp(-2.0, 2.0, k), y + Math.sin(Math.PI * k) * 0.3, z)
    const f = Math.min(seg(d, 0, 0.35), 1 - seg(d, DAY - 0.35, DAY))
    m.opacity = f
    ;(halo.material as THREE.MeshBasicMaterial).opacity = 0.3 * f
  }
}

function lanes(scene: THREE.Scene, roadColor: string, edge: string) {
  const strips: { o: THREE.Mesh; x0: number; cx: number }[] = []
  for (const cx of [AX, BX]) {
    const road = mesh(new THREE.BoxGeometry(2.45, 0.06, 1.3), mat(roadColor, { roughness: 0.9 }), [cx, 0.03, 0])
    road.castShadow = false
    scene.add(road)
    for (let i = 0; i < 5; i++) {
      const d = mesh(new THREE.BoxGeometry(0.26, 0.012, 0.06), mat(edge), [cx, 0.066, 0.56])
      d.castShadow = false
      scene.add(d)
      strips.push({ o: d, x0: i * 0.5, cx })
    }
  }
  /* the road slides under the cars: dashes move left, wrapped inside each strip */
  return (dist: number) => strips.forEach((s) => (s.o.position.x = s.cx - 1.08 + ((((s.x0 - dist) % 2.5) + 2.5) % 2.5) - 0.12 * 0))
}

/*
  TWO LANES, RENTED ABOVE AND OWNED BELOW (Session 10 review round 2, slide 43: "two different cars, above and below,
  Rented and Owned, complete cars and environment, and the difference in cost clearly shown"). TR 21: a daily commuter
  paying per taxi ride spends more than someone owning a car for the same fixed route.
  Each lane is its own complete street with the same fixed route: a home at the left, an office at the right. Both cars
  do the same round trip in sync, four days running (a sun crosses each lane's sky once a day): to the office in the
  near lane, a U-turn, home in the far lane, a U-turn. TOP: the yellow taxi (its driver, the commuter in the back), its
  meter ticking while it moves; each ride drops a fare coin onto its pile at the lane's end, two a day, 0 -> 8.
  BOTTOM: her own red hatchback (a different model), the commuter at the wheel; its cost is one flat pile of four coins,
  there from the first frame, never growing. Rented starts below Owned, overtakes it on day three, ends at 8 against 4.
  Coins appear just above their own pile and drop a short way; piles stand clear of the road, the cars and the labels.
*/
const LW = 470
const LH = 188
const LANE_GAP = H - 2 * LH
const DAY_L = 2.2
const P43L = DAY_L * 4
/** the car holds its place in the near lane, always heading +x; the WORLD scrolls past it (a treadmill road) */
const CAR_X = -0.9
const CAR_Z = 0.15
const CAR_L = 0.84
/** the roadside ring: one day's stretch (home, then the office) recycles every RING units, so one ring per day */
const RING = 16
const SPEED = RING / DAY_L
/** the far background layer (hills), slower: its ring passes once every DAY_L * 2, which divides the loop */
const RING_FAR = 20
const SPEED_FAR = RING_FAR / (DAY_L * 2)
const ROAD_HALF = 0.6
const PILE_X = 3.2
const PILE_Z = 1.78
const PILE_SC = 0.58
const L_COIN_DROP = 0.3
/** the sun's path in lane px: a 10 px sun whose lowest edge (y <= 12) stays clear of every roadside top, roofs and chimneys included */
const SUN_X0 = 320
const SUN_X1 = 430
const SUN_Y0 = 7
const SUN_RISE = 2
/** home passes the car at d = 0.15 each day, the office at d = 1.0: two fares land as the office is reached */
const HOME_AT = 0.15
const OFFICE_AT = 1.0
const fareAt = (i: number) => Math.floor(i / 2) * DAY_L + OFFICE_AT + (i % 2) * 0.22
/** x of a ring item at loop time u: wraps in [-RING/2, RING/2), beyond both card edges */
const ringX = (s: number, u: number, ring: number, speed: number) => ((((s - speed * u) % ring) + ring) % ring) - ring / 2

/** a box whose top face spans [tx0, tx1] while its base spans [bx0, bx1] (a cabin with sloped glass), d deep */
function prism(bx0: number, bx1: number, tx0: number, tx1: number, y0: number, y1: number, d: number) {
  const geo = new THREE.BoxGeometry(1, y1 - y0, d)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const top = pos.getY(i) > 0
    const left = pos.getX(i) < 0
    pos.setX(i, top ? (left ? tx0 : tx1) : left ? bx0 : bx1)
  }
  geo.computeVertexNormals()
  geo.translate(0, (y0 + y1) / 2, 0)
  return geo
}
/** her own car: a hatchback, a different model from the taxi (taller, boxier cabin, roof rails, rear hatch) */
function hatchback(color: string): Car {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)
  const paint = mat(color, { roughness: 0.28, metalness: 0.25 })
  const dark = mat('#2A2F3D', { roughness: 0.6 })
  body.add(mesh(rbox(2.2, 0.56, 1.04, 0.2), paint, [0.05, 0.52, 0]))
  body.add(mesh(new THREE.BoxGeometry(2.2, 0.08, 1.06), dark, [0.05, 0.26, 0]))
  body.add(mesh(new THREE.BoxGeometry(1.8, 0.22, 0.9), dark, [0.05, 0.14, 0]))
  const glass = new THREE.MeshStandardMaterial({ color: '#A9C6FF', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false })
  const cab = new THREE.Mesh(prism(-1.02, 0.55, -0.98, 0.2, 0.8, 1.32, 0.94), glass)
  cab.renderOrder = 2
  body.add(cab)
  body.add(mesh(rbox(1.24, 0.07, 0.98, 0.03), paint, [-0.39, 1.34, 0]))
  for (const z of [-0.36, 0.36]) body.add(mesh(new THREE.BoxGeometry(1.0, 0.04, 0.04), mat('#C9D3E6', { metalness: 0.6, roughness: 0.3 }), [-0.4, 1.4, z]))
  for (const z of [-0.465, 0.465]) {
    body.add(beam(new THREE.Vector3(0.55, 0.8, z), new THREE.Vector3(0.2, 1.32, z), 0.032, paint))
    body.add(beam(new THREE.Vector3(-1.02, 0.8, z), new THREE.Vector3(-0.98, 1.32, z), 0.05, paint))
    body.add(mesh(new THREE.BoxGeometry(0.07, 0.52, 0.03), paint, [-0.3, 1.06, z]))
    body.add(mesh(new THREE.BoxGeometry(1.57, 0.035, 0.035), dark, [-0.24, 0.815, z]))
  }
  const seat = mat('#3A4A78', { roughness: 0.8 })
  body.add(mesh(rbox(0.1, 0.34, 0.8, 0.04), seat, [-0.2, 0.92, 0]))
  for (const z of [-0.22, 0.22]) body.add(mesh(rbox(0.09, 0.13, 0.22, 0.04), seat, [-0.22, 1.15, z]))
  const sw = mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 24), dark, [0.3, 0.98, 0.2])
  sw.rotation.y = Math.PI / 2
  sw.rotation.x = 0.4
  body.add(sw)
  const head = new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFE9A8', emissiveIntensity: 0.8 })
  const tail = new THREE.MeshStandardMaterial({ color: '#E2473B', emissive: '#E2473B', emissiveIntensity: 0.5 })
  for (const z of [-0.32, 0.32]) body.add(mesh(new THREE.BoxGeometry(0.04, 0.1, 0.2), head, [1.151, 0.62, z]), mesh(new THREE.BoxGeometry(0.04, 0.14, 0.16), tail, [-1.051, 0.66, z]))
  for (const x of [-0.3, 0.42]) body.add(mesh(new THREE.BoxGeometry(0.015, 0.44, 1.046), dark, [x, 0.52, 0]))
  const wheels: THREE.Group[] = []
  const tyre = mat('#1E2230', { roughness: 0.85 })
  const hub = mat('#E8EEF8', { metalness: 0.7, roughness: 0.3 })
  for (const x of [-0.66, 0.72]) for (const z of [-0.49, 0.49]) {
    const w = new THREE.Group()
    w.position.set(x, 0.27, z)
    const t = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 24), tyre)
    t.rotation.x = Math.PI / 2
    w.add(t)
    const hb = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.21, 10), hub)
    hb.rotation.x = Math.PI / 2
    w.add(hb)
    g.add(w)
    wheels.push(w)
  }
  const door = new THREE.Group()
  const opening = mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), dark)
  opening.visible = false
  return { g, wheels, meter: null, roofLight: null, body, door, opening }
}

/** a small house at the route's start: walls, gable roof, door, two windows */
function homeHouse() {
  const g = new THREE.Group()
  const wall = mat('#FFF1DC', { roughness: 0.85 })
  g.add(mesh(new THREE.BoxGeometry(1.25, 0.9, 0.9), wall, [0, 0.45, 0]))
  const gable = new THREE.Shape()
  gable.moveTo(-0.45, 0)
  gable.lineTo(0.45, 0)
  gable.lineTo(0, 0.42)
  gable.closePath()
  for (const sx of [-1, 1]) {
    const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.02, bevelEnabled: false }), wall)
    gm.rotation.y = Math.PI / 2
    gm.position.set(sx * 0.62 - (sx > 0 ? 0.02 : 0), 0.9, 0)
    g.add(gm)
  }
  const roofM = mat('#2F5BD8', { roughness: 0.55 })
  const th = Math.atan2(0.42, 0.45)
  const sl = Math.hypot(0.42, 0.45) + 0.14
  for (const sz of [1, -1]) {
    const r = mesh(new THREE.BoxGeometry(1.42, 0.06, sl), roofM)
    r.rotation.x = sz * th
    r.position.set(0, 0.9 + 0.21 - 0.03, sz * 0.24)
    g.add(r)
  }
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), mat('#B9472F'), [0.36, 1.2, -0.05]))
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.5, 0.03), mat('#B0744A'), [0.3, 0.25, 0.46]))
  const win = new THREE.MeshStandardMaterial({ color: '#BFD6FF', emissive: '#FFE7A3', emissiveIntensity: 0.15, roughness: 0.2 })
  g.add(mesh(new THREE.BoxGeometry(0.32, 0.26, 0.03), win, [-0.22, 0.52, 0.46]))
  g.add(mesh(new THREE.BoxGeometry(0.38, 0.04, 0.05), mat('#FFFFFF'), [-0.22, 0.37, 0.47]))
  return g
}
/** the office at the route's end: a glass-fronted block with a canopy */
function officeBlock() {
  const g = new THREE.Group()
  g.add(mesh(rbox(1.3, 1.7, 0.9, 0.04), mat('#DCE5F7', { roughness: 0.7 }), [0, 0.85, 0]))
  const wm = new THREE.MeshStandardMaterial({ color: '#8FB2F5', roughness: 0.15, metalness: 0.3, emissive: '#9CC2FF', emissiveIntensity: 0.15 })
  for (let y = 0.55; y < 1.6; y += 0.32) for (const x of [-0.38, 0, 0.38]) g.add(mesh(new THREE.BoxGeometry(0.28, 0.2, 0.03), wm, [x, y, 0.46]))
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.34, 0.03), mat('#3A4A78'), [0, 0.17, 0.46]))
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.04, 0.22), mat('#2D63FB'), [0, 0.38, 0.55]))
  return g
}

function setupLane({ scene, camera, redraw }: StageKit, rented: boolean, sunEl?: RefObject<HTMLDivElement | null>) {
  /*
    EVERY CANVAS ON THIS SLIDE THE SAME SIZE (60 fps at 4K): the deck's one shared renderer resizes itself whenever it
    draws a canvas of a different size, and the concept card's canvas is 470 x 390. So each lane draws into a 470 x 390
    canvas shown at 470 x 188: the camera renders only the lane-shaped middle band of its frustum (setViewOffset) with a
    vertical field of view widened to match, so the lane keeps its true 26 degree view and proportions, supersampled.
  */
  camera.fov = (2 * Math.atan(Math.tan((26 / 2) * (Math.PI / 180)) * (H / LH)) * 180) / Math.PI
  camera.setViewOffset(LW, H, 0, (H - LH) / 2, LW, LH)
  camera.position.set(0.3, 6.4, 6.8)
  camera.lookAt(0.3, 0.1, -0.7)
  rig(scene, [0, 0.4, 0])
  scene.traverse((o) => { const l = o as THREE.DirectionalLight; if (l.isDirectionalLight && l.castShadow) { l.shadow.mapSize.set(1024, 1024); l.shadow.camera.left = -9; l.shadow.camera.right = 9; l.shadow.camera.top = 9; l.shadow.camera.bottom = -9 } })
  /* the ground ends behind the roadside row, so a band of sky shows at the top; the road runs off both card edges */
  const grass = mesh(new THREE.BoxGeometry(40, 0.2, 8.2), mat(C.grass, { roughness: 0.95 }), [0, -0.12, 1.1])
  grass.castShadow = false
  scene.add(grass)
  const road = mesh(new THREE.BoxGeometry(40, 0.06, ROAD_HALF * 2), mat(C.road, { roughness: 0.9 }), [0, 0.0, 0])
  road.castShadow = false
  scene.add(road)
  for (const z of [-ROAD_HALF - 0.04, ROAD_HALF + 0.04]) {
    const k = mesh(new THREE.BoxGeometry(40, 0.08, 0.08), mat('#AEB8CC'), [0, 0.04, z])
    k.castShadow = false
    scene.add(k)
  }
  /* the plot where the cost pile stands, on the near verge, clear of the road (nothing scrolls across it) */
  const plot = mesh(rbox(0.78, 0.05, 0.78, 0.04), mat('#E3E9F4', { roughness: 0.85 }), [PILE_X, 0.025, PILE_Z])
  plot.castShadow = false
  scene.add(plot)

  /* the scrolling world: centre-line dashes, the roadside row (home, trees, lamps, the office), the far hills */
  type Item = { o: THREE.Object3D; s: number; ring: number; speed: number }
  const items: Item[] = []
  const dashM = mat('#E8EEF8')
  for (let i = 0; i < RING; i++) {
    const d = mesh(new THREE.BoxGeometry(0.5, 0.01, 0.05), dashM, [0, 0.035, -0.02])
    d.castShadow = false
    scene.add(d)
    items.push({ o: d, s: i, ring: RING, speed: SPEED })
  }
  const ROW_Z = -2.5
  /* ring positions relative to the home; the office is reached (OFFICE_AT - HOME_AT) * SPEED later */
  const S_HOME = CAR_X + RING / 2 + SPEED * HOME_AT
  const S_OFF = S_HOME + SPEED * (OFFICE_AT - HOME_AT)
  const home = homeHouse()
  home.scale.setScalar(0.8)
  home.position.z = ROW_Z
  scene.add(home)
  items.push({ o: home, s: S_HOME, ring: RING, speed: SPEED })
  const off = officeBlock()
  off.scale.set(0.85, 0.62, 0.85)
  off.position.z = ROW_Z - 0.05
  scene.add(off)
  items.push({ o: off, s: S_OFF, ring: RING, speed: SPEED })
  const between = (k: number) => S_HOME + ((S_OFF - S_HOME) * k)
  const after = (k: number) => S_OFF + ((RING - (S_OFF - S_HOME)) * k)
  const props: [() => THREE.Object3D, number, number][] = [
    [tree, between(0.28), 0.75],
    [lamp, between(0.5), 0.5],
    [tree, between(0.72), 0.75],
    [tree, after(0.2), 0.75],
    [lamp, after(0.35), 0.5],
    [tree, after(0.5), 0.75],
    [lamp, after(0.65), 0.5],
    [tree, after(0.8), 0.75],
  ]
  for (const [make, sPos, sc] of props) {
    const o = make()
    o.scale.setScalar(sc)
    o.position.z = ROW_Z + 0.1
    scene.add(o)
    items.push({ o, s: sPos, ring: RING, speed: SPEED })
  }
  const hillM = mat('#8CCB86', { roughness: 0.95 })
  for (let i = 0; i < 6; i++) {
    const r = 0.9 + ((i * 7) % 3) * 0.25
    const h = mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillM)
    h.scale.set(1.7, 0.2, 0.5)
    h.position.set(0, -0.05, -3.25)
    h.castShadow = false
    scene.add(h)
    items.push({ o: h, s: i * (RING_FAR / 6) + 1.1, ring: RING_FAR, speed: SPEED_FAR })
  }

  /* the day marker, the same in both lanes and in sync: a sun (DOM, crisp) rising at the right, arcing and setting */
  const sunTick = (d: number) => {
    const el = sunEl?.current
    if (!el) return
    const k = d / DAY_L
    el.style.transform = `translate(${lerp(SUN_X0, SUN_X1, k)}px, ${SUN_Y0 - Math.sin(Math.PI * k) * SUN_RISE}px)`
    el.style.opacity = String(Math.min(seg(k, 0, 0.12), 1 - seg(k, 0.88, 1)))
  }

  /* the car and its people (car units: people 1.33 tall, crowns at 1.1, under the roof) */
  let meter: THREE.MeshStandardMaterial | null = null
  const sprites: Sprite[] = []
  let theCar: Car
  if (rented) {
    theCar = car(C.taxi, true)
    meter = theCar.meter
    theCar.roofLight!.emissiveIntensity = 0.05
    const drv = rigSprite({
      config: DRIVER,
      dress: (k) => ({ ...k, hairFront: <>{k.hairFront}{DRIVER_CAP}</> }),
      timeline: () => ({ seed: 5, idle: CAST_IDLE, life: 0, expression: castClip('happy', 0, false) }),
      loop: 4,
      frames: 10,
      height: 1.33,
      onReady: redraw,
    })
    drv.object.position.set(FRONT_X, 1.1 - 1.33, -0.12)
    const pas = rigSprite({
      config: COMMUTER_A,
      timeline: (t) => ({ seed: 31, idle: CAST_IDLE, life: 0, ...(t < DAY_L * 2.2 ? face('neutral', 0) : face('worried', DAY_L * 2.2, 'neutral', 0)) }),
      loop: P43L,
      frames: 24,
      height: 1.33,
      onReady: redraw,
    })
    pas.object.position.set(REAR_X, 1.1 - 1.33, 0.12)
    theCar.body.add(drv.object, pas.object)
    sprites.push(drv, pas)
  } else {
    theCar = hatchback('#D9433B')
    const me = rigSprite({
      config: COMMUTER_B,
      timeline: () => ({ seed: 41, idle: CAST_IDLE, life: 0, expression: castClip('happy', 0, false) }),
      loop: 4,
      frames: 10,
      height: 1.33,
      onReady: redraw,
    })
    me.object.position.set(0.12, 1.24 - 1.33, 0.1)
    theCar.body.add(me.object)
    sprites.push(me)
  }
  /* slide 43 only (this instance, the shared model untouched): a glass roof with a painted frame, so the people inside
     read from this high camera */
  const roofGlass = new THREE.MeshStandardMaterial({ color: '#A9C6FF', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.3, depthWrite: false })
  for (const o of [...theCar.body.children]) {
    const m = o as THREE.Mesh
    if (!m.isMesh || !(m.geometry instanceof RoundedBoxGeometry)) continue
    const bb = new THREE.Box3().setFromObject(m)
    const sz = bb.getSize(new THREE.Vector3())
    if (sz.y < 0.09 && sz.x > 0.9 && sz.z > 0.9 && bb.min.y > 1.1) {
      const paintM = m.material as THREE.Material
      m.material = roofGlass
      m.renderOrder = 3
      const c = bb.getCenter(new THREE.Vector3())
      const top = bb.max.y
      for (const z of [-sz.z / 2 + 0.04, sz.z / 2 - 0.04]) theCar.body.add(mesh(new THREE.BoxGeometry(sz.x, 0.05, 0.08), paintM, [c.x, top - 0.02, z]))
      for (const x of [c.x - sz.x / 2 + 0.04, c.x + sz.x / 2 - 0.04]) theCar.body.add(mesh(new THREE.BoxGeometry(0.08, 0.05, sz.z), paintM, [x, top - 0.02, c.z]))
    }
  }
  theCar.g.scale.setScalar(CAR_L)
  theCar.g.position.set(CAR_X, 0.035, CAR_Z)
  scene.add(theCar.g)

  /* the cost pile on its plot */
  const pile = bigCoins(rented ? 8 : 4, coinM())
  pile.g.position.set(PILE_X, 0.05, PILE_Z)
  pile.g.scale.setScalar(PILE_SC)
  scene.add(pile.g)
  const dropH = L_COIN_DROP / PILE_SC

  return (t: number) => {
    const u = ((t % P43L) + P43L) % P43L
    const d = u - Math.floor(u / DAY_L) * DAY_L
    /* the world goes by; the car holds its lane, wheels turning at road speed, a light suspension bob */
    for (const it of items) it.o.position.x = ringX(it.s, u, it.ring, it.speed)
    theCar.wheels.forEach((w) => (w.rotation.z = (-SPEED * u) / CAR_L / 0.27))
    theCar.body.position.y = Math.sin(t * 19) * 0.007 + Math.sin(t * 7.3) * 0.004
    sunTick(d)
    sprites.forEach((sp) => sp.update(u, camera))
    if (rented) {
      /* the meter ticks all ride long and flashes as each fare is charged at the office */
      const charge = Math.max(...Array.from({ length: 8 }, (_, i) => bump(u, fareAt(i) - L_COIN_DROP, fareAt(i) + 0.15)))
      meter!.emissiveIntensity = 0.6 + 0.4 * (Math.sin(t * 14) > 0 ? 1 : 0) + charge * 1.2
      const clear = seg(u, P43L - 0.24, P43L - 0.02)
      pile.coins.forEach((c, i) => {
        const k = lin(u, fareAt(i) - L_COIN_DROP, fareAt(i))
        c.visible = k > 0 && clear < 0.999
        c.position.y = coinTop(i) + (1 - k * k) * dropH
        c.scale.setScalar(Math.max(0.0001, (0.7 + 0.3 * Math.min(1, k * 3)) * (1 - clear)))
      })
    }
    pile.g.rotation.y = Math.sin(t * 0.8 + (rented ? 0 : 1)) * 0.06
  }
}

/* ================================================================== S43 · CONCEPT: per-invocation billing vs a flat server */

function setupCommuteConcept({ scene, camera, redraw }: StageKit) {
  frame(camera, 0, 0.1, 0.55, 8.0, 4.8)
  rig(scene, [0, 0.5, 0])
  floorSlab(scene, -4.5, -2.6, 9, 6.6, '#E3E9F5', '#D3DCEC', [5, 3])
  walls(scene, -4.5, -2.6, 9, 6.6, 1.6, '#EEF2FB', false)
  const slide = lanes(scene, '#C9D8F5', '#5B8CFF')
  /* the day marker, mirrored: the same sun crossing behind */
  const daySun = sun(scene)

  /* A's side: the Lambda function where the taxi stood, fed by the boy's requests; coins per invocation */
  const lam = markBox(0.78, markTex(lambdaUrl, redraw), '#C8511B', 0.2)
  lam.o.position.set(AX, 0.48, 0)
  scene.add(lam.o)
  const ringM = new THREE.MeshStandardMaterial({ color: '#FFB15C', emissive: '#FF9900', emissiveIntensity: 1, transparent: true, opacity: 0 })
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.03, 10, 60), ringM, [AX, 0.48, 0])
  ring.rotation.x = Math.PI / 2
  scene.add(ring)
  const boy = boyWithLaptop(scene, camera, redraw, [-0.05, 0.01, -1.45], 1.0)
  const lamIn = new THREE.Vector3(AX + 0.25, 0.7, -0.15)
  const reqPath = new THREE.QuadraticBezierCurve3(boy.laptop, new THREE.Vector3((boy.laptop.x + lamIn.x) / 2, 1.45, -0.9), lamIn)
  const reqs = [packet('#5B8CFF', 0.12), packet('#5B8CFF', 0.12)]
  reqs.forEach((r) => scene.add(r))

  /* B's side: the always-on EC2 server where her car stood, LEDs and power lamp on the whole time */
  const r = rack(1.25)
  r.g.position.set(BX, 0.06, 0)
  r.g.scale.set(1.2, 1, 1.2)
  scene.add(r.g)
  const ecM = new THREE.MeshStandardMaterial({ map: markTex(ec2Url, redraw), roughness: 0.4, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.2 })
  ecM.emissiveMap = ecM.map
  scene.add(mesh(new THREE.BoxGeometry(0.46, 0.46, 0.02), ecM, [BX, 0.8, 0.375]))
  const onM = new THREE.MeshStandardMaterial({ color: '#7CF0B8', emissive: '#3BE59A', emissiveIntensity: 1.4 })
  scene.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), onM, [BX + 0.3, 1.14, 0.375]))

  /* the same rule as the left card: piles at 0.7 scale, set forward so a coin's short drop never crosses the function,
     the server or the lane plates (projections: pile top ~288 px, drop start ~271 px, lane plates' front 249 px) */
  const CPZ = 2.3
  const pileA = bigCoins(6, coinM())
  pileA.g.position.set(AX, 0, CPZ)
  pileA.g.scale.setScalar(PILE_S)
  scene.add(pileA.g)
  const pileB = bigCoins(4, coinM())
  pileB.g.position.set(BX, 0, CPZ)
  pileB.g.scale.setScalar(PILE_S)
  scene.add(pileB.g)

  return (t: number) => {
    const u = t % P43
    const day = Math.min(2, Math.floor(u / DAY))
    const d = u - day * DAY
    const on = u < DAY * 3
    slide(t * 2.2)
    daySun(on ? d : 0)
    /* two requests a day: each arrives, the function runs (ring, glow), and its invocation is billed (one coin) */
    let run = 0
    reqs.forEach((q, i) => {
      const a = i ? 1.05 : 0.05
      const k = lin(d, a, a + 0.55)
      q.visible = on && k > 0 && k < 1
      q.position.copy(reqPath.getPoint(k))
      run = Math.max(run, on ? bump(d, a + 0.5, a + 0.95) : 0)
    })
    ringM.opacity = run * 0.9
    ring.position.y = 0.48 + run * 0.2
    ring.rotation.z = t * 3
    lam.faceM.emissiveIntensity = 0.15 + run * 0.6
    lam.o.position.y = 0.48 + run * 0.05
    /* each invocation is billed: its coin appears just above the Lambda pile and drops onto it */
    dropPile(pileA.coins, u, P43)
    /* the server: on the whole time, busy or idle */
    ecM.emissiveIntensity = 0.25 + 0.1 * Math.sin(t * 3)
    onM.emissiveIntensity = 1.1 + 0.4 * Math.sin(t * 4)
    blink(r.leds, t)
    boy.breathe(t)
    /* the always-on server's flat cost, like the owned car's price: four coins from the first frame, never more */
    pileA.g.rotation.y = Math.sin(t * 0.8) * 0.06
    pileB.g.rotation.y = Math.sin(t * 0.8 + 1) * 0.06
  }
}

/* ------------------------------------------------------------------ the stages */

const Stage = ({ step, setup, holdT }: { step: number; setup: (s: StageKit) => (t: number, step: number) => void; holdT: number }) => (
  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={holdT} />
  </div>
)

const I_T01Everyday = ({ step }: { step: number }) => <Stage step={step} setup={setupTaxi} holdT={4.4} />
const I_T01Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupFunctionRun} holdT={3.0} />
const I_T17Everyday = ({ step }: { step: number }) => <Stage step={step} setup={setupHotel} holdT={5.3} />
const I_T17Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupTmp} holdT={4.75} />
const I_T19Everyday = ({ step }: { step: number }) => <Stage step={step} setup={setupGrid} holdT={4.0} />
const I_T19Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupBaaS} holdT={4.0} />
/* S43's left card: two lane stages (the shared renderer draws both), a divider, and the user's two labels as DOM text */
const I_T21Everyday = ({ step }: { step: number }) => {
  const sunA = useRef<HTMLDivElement>(null)
  const sunB = useRef<HTMLDivElement>(null)
  const sunSt: CSSProperties = { position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: 999, background: 'radial-gradient(circle, #FFE07A 0 55%, #FFD66B 56%, rgba(255,214,107,0.35) 62%, rgba(255,214,107,0) 100%)', opacity: 0, pointerEvents: 'none' }
  const lab = 'absolute left-[14px] bottom-[10px] font-heading text-[15px] font-bold leading-none whitespace-nowrap'
  const st: CSSProperties = { color: '#00254B', textShadow: '0 1px 0 #fff, 0 0 6px #fff' }
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'relative', width: LW, height: H }}>
        <div style={{ position: 'relative', width: LW, height: LH }}>
          <ThreeStage w={LW} h={H} step={step} setup={(k) => setupLane(k, true, sunA)} holdT={8.15} style={{ height: LH }} />
          <div ref={sunA} style={sunSt} />
          <div className={lab} style={st}>Rented</div>
        </div>
        <div style={{ height: LANE_GAP, display: 'flex', alignItems: 'center' }}>
          <div style={{ height: 2, width: '100%', background: '#C9D6EE' }} />
        </div>
        <div style={{ position: 'relative', width: LW, height: LH }}>
          <ThreeStage w={LW} h={H} step={step} setup={(k) => setupLane(k, false, sunB)} holdT={8.15} style={{ height: LH }} />
          <div ref={sunB} style={sunSt} />
          <div className={lab} style={st}>Owned</div>
        </div>
      </div>
    </div>
  )
}
const I_T21Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupCommuteConcept} holdT={7.2} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T01Everyday: I_T01Everyday as never,
  I_T01Concept: I_T01Concept as never,
  I_T17Everyday: I_T17Everyday as never,
  I_T17Concept: I_T17Concept as never,
  I_T19Everyday: I_T19Everyday as never,
  I_T19Concept: I_T19Concept as never,
  I_T21Everyday: I_T21Everyday as never,
  I_T21Concept: I_T21Concept as never,
}
export const slides = {}
export const css = ''
