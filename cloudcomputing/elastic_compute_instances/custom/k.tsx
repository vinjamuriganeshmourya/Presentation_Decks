import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { ThreeStage, lightRig, mat, mesh, castSprite, castClip, CAST_IDLE, CAST_PRESETS, type CharacterConfig, type StageKit } from './three-stage'
import boyLaptopUrl from './k-boy-laptop.png'

/**
 * BUILDER K · SESSION 9 ANALOGIES ON SLIDES 39 (key pair ↔ a lock and its key, round 4) AND 49 (TR 25, launch template ↔
 * builder's standard house plan), REBUILT AS REAL-TIME 3D SCENES (user, 2026-11-10: standing correction 13 / cloud
 * course R10: perspective 3D, no text, loop animation performing the analogy's action). Round 3 (2026-11-10): the people
 * are Character Lab characters (`castSprite`) with minimal joint movement, the seated boy is the project's own
 * illustration, and each loop restarts within ~0.25 s of its end.
 *
 * Every stage is a `ThreeStage` on the deck's ONE shared WebGL renderer (custom/three-stage.tsx). The four scenes
 * keep these exported names so index.tsx's spread replaces Builder G's isometric rooms without touching deck.json.
 *
 *   S39 everyday  (round 4, the user's analogy: "A key pair is like a lock and its key — the lock (public key) stays on
 *                 the instance, and only the person holding the matching key (private key) can open it.") A storeroom
 *                 door with a blue padlock. A visitor (Arjun) tries his grey key: it jiggles, will not turn, the lock
 *                 flashes red, he is puzzled. The owner (Kabir) turns his gold key, the shackle lifts, the door swings in
 *                 on the lit storeroom; he closes and locks it and walks away. Loop.
 *   S39 concept   a server room: the EC2 instance carries the public key, the same blue padlock. The visitor's key leaves
 *                 his laptop, cannot turn, the lock flashes red, it goes back. The owner (boy with a laptop) sends his
 *                 private key: it turns, the shackle opens, the instance's face lights. Loop.
 *   S49 everyday  a housing site: the builder in hard hat and vest holds the standard house plan; three houses rise
 *                 one after another on their plots with the same layout and the same door lock. Loop.
 *   S49 concept   a data-centre floor: the launch template (a blueprint board carrying the AMI, the instance type and
 *                 the security-group shield) stamps three identical instances one after another on their plinths,
 *                 each with the same AMI tile, the same size and the same shield. Loop.
 *
 * No text, no numbers, no chips on any stage. Held frames (`?still`, thumbnails, reduced motion) draw one frame at
 * `holdT`: the locker open with the key turned, the session open, every house and every instance standing.
 */

const W = 470
const H = 390

/* palette: engine tokens (royal blue on white, small warm accents) and the AWS service colours for the marks */
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
  ec2: '#ED7100',
  sg: '#DD344C',
  grass: '#8CCB7E',
  grassDark: '#6DB463',
  road: '#5A6378',
  white: '#FFFFFF',
  green: '#16A34A',
  glass: '#CFE3FF',
}

/* ------------------------------------------------------------------ helpers */

/** the one camera of every stage: a 3/4 view from the front-right, far enough that the whole diorama sits inside
    the card with a margin, aimed at its centre so it is centred both ways */
function frame(camera: THREE.PerspectiveCamera, cx: number, cz: number, lookY = 1.05, dist = 12.6, height = 5.9) {
  camera.fov = 30
  camera.position.set(cx + 0.9, height, cz + dist)
  camera.lookAt(cx, lookY, cz - 0.1)
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
/** 0 → 1 over [a, b], eased in and out */
const seg = (t: number, a: number, b: number) => {
  const k = clamp((t - a) / (b - a))
  return k * k * (3 - 2 * k)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** floor tiles: soft squares, no hard grid lines (rule 59) */
const tileTex = (base: string, seam: string) =>
  canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 256, 256)
      g.fillStyle = seam
      g.fillRect(0, 126, 256, 4)
      g.fillRect(126, 0, 4, 256)
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`
        g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
      }
    },
    [4, 3],
  )

const rbox = (w: number, h: number, d: number, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, r)

/** a key: bow ring, shaft, bit teeth; lies along +x from the bow */
function key3d(color: string, s = 1) {
  const g = new THREE.Group()
  const m = mat(color, { metalness: 0.75, roughness: 0.28 })
  const bow = mesh(new THREE.TorusGeometry(0.07, 0.025, 12, 24), m)
  g.add(bow)
  const shaft = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12), m, [0.17, 0, 0])
  shaft.rotation.z = Math.PI / 2
  g.add(shaft)
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.05, 0.02), m, [0.24, -0.035, 0]), mesh(new THREE.BoxGeometry(0.025, 0.035, 0.02), m, [0.19, -0.028, 0]))
  g.scale.setScalar(s)
  return g
}

/** a padlock: body and a shackle that lifts open (`shackle.position.y`) */
function padlock(body: string, s = 1) {
  const g = new THREE.Group()
  const b = mesh(rbox(0.3, 0.26, 0.12, 0.04), mat(body, { metalness: 0.4, roughness: 0.35 }), [0, 0, 0])
  g.add(b)
  const hole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), mat(C.ink), [0, -0.02, 0.062])
  hole.rotation.x = Math.PI / 2
  g.add(hole)
  const shackle = new THREE.Group()
  const sh = mesh(new THREE.TorusGeometry(0.1, 0.022, 10, 24, Math.PI), mat('#C7CEDB', { metalness: 0.85, roughness: 0.25 }), [0, 0.13, 0])
  shackle.add(sh)
  shackle.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 10), sh.material as THREE.Material, [-0.1, 0.1, 0]))
  shackle.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 10), sh.material as THREE.Material, [0.1, 0.1, 0]))
  g.add(shackle)
  g.scale.setScalar(s)
  return { g, shackle, body: b }
}

/** the EC2 instance face: the AWS orange with the white chip glyph (the official mark's drawing, no letters) */
const chipTex = (lit = false) =>
  canvasTex(256, 256, (g) => {
    const grd = g.createLinearGradient(0, 256, 256, 0)
    grd.addColorStop(0, '#C8511B')
    grd.addColorStop(1, '#FF9900')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 10
    g.strokeRect(78, 78, 100, 100)
    g.lineWidth = 8
    for (let i = 0; i < 4; i++) {
      const p = 96 + i * 21
      ;[
        [p, 78, p, 50],
        [p, 178, p, 206],
        [78, p, 50, p],
        [178, p, 206, p],
      ].forEach(([a, b, c, d]) => {
        g.beginPath()
        g.moveTo(a, b)
        g.lineTo(c, d)
        g.stroke()
      })
    }
    if (lit) {
      g.fillStyle = 'rgba(255,255,255,0.9)'
      g.fillRect(104, 104, 48, 48)
    }
  })

/** the AMI mark's drawing: orange tile with a 3 x 2 grid of white squares */
const amiTex = () =>
  canvasTex(256, 256, (g) => {
    const grd = g.createLinearGradient(0, 256, 256, 0)
    grd.addColorStop(0, '#C8511B')
    grd.addColorStop(1, '#FF9900')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 9
    g.strokeRect(54, 70, 148, 116)
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) g.strokeRect(70 + c * 42, 86 + r * 44, 32, 32)
  })

/** a cube whose front face carries a texture, other faces a plain colour */
function faceBox(w: number, h: number, d: number, front: THREE.Texture, side: string, emissive = false) {
  const sideM = mat(side, { roughness: 0.45 })
  const frontM = new THREE.MeshStandardMaterial({ map: front, roughness: 0.45, emissive: emissive ? new THREE.Color('#ffffff') : new THREE.Color('#000000'), emissiveMap: emissive ? front : null, emissiveIntensity: emissive ? 0.35 : 0 })
  const o = new THREE.Mesh(rbox(w, h, d, 0.03), [sideM, sideM, sideM, sideM, frontM, sideM])
  o.castShadow = true
  o.receiveShadow = true
  return o
}

/** the security-group shield: an extruded shield outline in the SG red, white rim */
function shield(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, 0.5)
  sh.quadraticCurveTo(0.22, 0.42, 0.4, 0.42)
  sh.lineTo(0.4, 0.05)
  sh.quadraticCurveTo(0.38, -0.32, 0, -0.5)
  sh.quadraticCurveTo(-0.38, -0.32, -0.4, 0.05)
  sh.lineTo(-0.4, 0.42)
  sh.quadraticCurveTo(-0.22, 0.42, 0, 0.5)
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 })
  geo.center()
  const o = mesh(geo, mat(C.sg, { roughness: 0.35 }))
  const tick = new THREE.Group()
  const tm = mat(C.white)
  const a = mesh(new THREE.BoxGeometry(0.08, 0.26, 0.05), tm, [-0.08, -0.04, 0.09])
  a.rotation.z = 0.7
  const b = mesh(new THREE.BoxGeometry(0.08, 0.44, 0.05), tm, [0.08, 0.04, 0.09])
  b.rotation.z = -0.6
  tick.add(a, b)
  const g = new THREE.Group()
  g.add(o, tick)
  g.scale.setScalar(s)
  return g
}

/** a server rack: navy body, front panel slots, a strip of LEDs that blink (returned for animation) */
function rack(h = 2.0) {
  const g = new THREE.Group()
  g.add(mesh(rbox(0.7, h, 0.6, 0.03), mat(C.navy, { roughness: 0.5 }), [0, h / 2, 0]))
  const leds: THREE.Mesh[] = []
  for (let i = 0; i < 7; i++) {
    const y = 0.25 + i * ((h - 0.4) / 7)
    g.add(mesh(new THREE.BoxGeometry(0.58, 0.12, 0.02), mat('#2B3E7E', { roughness: 0.4 }), [0, y, 0.305]))
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshStandardMaterial({ color: '#7CF0B8', emissive: '#3BE59A', emissiveIntensity: 1.2 }))
    led.position.set(0.22, y, 0.32)
    g.add(led)
    leds.push(led)
  }
  return { g, leds }
}

/** room shell: tiled floor + back and left walls with a skirting */
function room(scene: THREE.Scene, o: { w: number; d: number; h: number; x0: number; z0: number; floor: string; seam: string; wall: string }) {
  const top = new THREE.MeshStandardMaterial({ map: tileTex(o.floor, o.seam), roughness: 0.8 })
  const edge = mat('#AFBDD8', { roughness: 0.7 })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(o.w, 0.22, o.d), [edge, edge, top, edge, edge, edge])
  floor.position.set(o.x0 + o.w / 2, -0.11, o.z0 + o.d / 2)
  floor.receiveShadow = true
  floor.castShadow = false
  scene.add(floor)
  const wm = mat(o.wall, { roughness: 0.9 })
  const back = mesh(new THREE.BoxGeometry(o.w, o.h, 0.1), wm, [o.x0 + o.w / 2, o.h / 2, o.z0 - 0.05])
  const left = mesh(new THREE.BoxGeometry(0.1, o.h, o.d), wm, [o.x0 - 0.05, o.h / 2, o.z0 + o.d / 2])
  back.castShadow = left.castShadow = false
  scene.add(back, left)
  const sk = mat('#C9D3E6')
  scene.add(mesh(new THREE.BoxGeometry(o.w, 0.12, 0.04), sk, [o.x0 + o.w / 2, 0.06, o.z0 + 0.02]), mesh(new THREE.BoxGeometry(0.04, 0.12, o.d), sk, [o.x0 + 0.02, 0.06, o.z0 + o.d / 2]))
}

/* ================================================================== S39 · EVERYDAY: a lock and its key (round 4) */

/* Round 4 (user, 2026-11-10): "A key pair is like a lock and its key: the lock (public key) stays on the instance, and
   only the person holding the matching key (private key) can open it." A storeroom door with a padlock on its hasp.
   A visitor (Arjun) tries his key: it will not turn, the lock flashes red, he is puzzled and steps back. The owner
   (Kabir) turns his matching key, the shackle lifts, the door swings in on the lit storeroom; he closes it, locks it
   and walks away. Minimal joint movement: glides, one reach each, faces. Loop 10.2 s; the owner is home at 10.0 s. */
const P39 = 10.2
const DOOR = { x0: -0.15, w: 0.9, h: 2.0, z: -1.6 }
const LOCK_Y = 1.3
const KEY_YAW = 0.9 // radians: the key enters the lock turned toward the camera

function setupLockDoor({ scene, camera, redraw }: StageKit) {
  camera.fov = 32
  camera.position.set(0.55, 2.45, 5.0)
  camera.lookAt(0.3, 1.0, -0.8)
  camera.updateMatrixWorld()
  lightRig(scene, [0.3, 0.6, -0.8])

  /* floor and the left wall (room shell), then the back wall built round the door opening */
  const top = new THREE.MeshStandardMaterial({ map: tileTex('#E6ECF6', '#D3DCEC'), roughness: 0.8 })
  const edge = mat('#AFBDD8', { roughness: 0.7 })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.22, 4.6), [edge, edge, top, edge, edge, edge])
  floor.position.set(0.3, -0.11, 0.7)
  floor.receiveShadow = true
  scene.add(floor)
  const wm = mat('#F1E7D8', { roughness: 0.9 })
  const WZ = DOOR.z - 0.05
  const xr = DOOR.x0 + DOOR.w
  const wallL = mesh(new THREE.BoxGeometry(DOOR.x0 + 3.0, 2.8, 0.1), wm, [(-3.0 + DOOR.x0) / 2, 1.4, WZ])
  const wallR = mesh(new THREE.BoxGeometry(3.6 - xr, 2.8, 0.1), wm, [(3.6 + xr) / 2, 1.4, WZ])
  const wallT = mesh(new THREE.BoxGeometry(DOOR.w, 0.8, 0.1), wm, [DOOR.x0 + DOOR.w / 2, 2.4, WZ])
  for (const w of [wallL, wallR, wallT]) {
    w.castShadow = false
    scene.add(w)
  }
  const side = mesh(new THREE.BoxGeometry(0.1, 2.8, 4.6), mat('#E8DCCB', { roughness: 0.9 }), [-3.05, 1.4, 0.7])
  side.castShadow = false
  scene.add(side)
  scene.add(mesh(new THREE.BoxGeometry(6.6, 0.12, 0.04), mat('#C9B79C'), [0.3, 0.06, DOOR.z + 0.02]))
  /* the door frame */
  const frameM = mat('#7A5230', { roughness: 0.6 })
  scene.add(mesh(new THREE.BoxGeometry(0.08, DOOR.h + 0.08, 0.16), frameM, [DOOR.x0 - 0.04, DOOR.h / 2, DOOR.z]))
  scene.add(mesh(new THREE.BoxGeometry(0.08, DOOR.h + 0.08, 0.16), frameM, [xr + 0.04, DOOR.h / 2, DOOR.z]))
  scene.add(mesh(new THREE.BoxGeometry(DOOR.w + 0.16, 0.08, 0.16), frameM, [DOOR.x0 + DOOR.w / 2, DOOR.h + 0.04, DOOR.z]))

  /* the storeroom behind the door: what the lock protects (shelves of the owner's boxes), lit when the door opens */
  const inner = mat('#F6E9D2', { roughness: 0.95, side: THREE.BackSide })
  const closet = mesh(new THREE.BoxGeometry(DOOR.w + 0.6, DOOR.h + 0.2, 1.2), inner, [DOOR.x0 + DOOR.w / 2, (DOOR.h + 0.2) / 2, DOOR.z - 0.66])
  closet.castShadow = false
  scene.add(closet)
  for (const y of [0.55, 1.2]) {
    scene.add(mesh(new THREE.BoxGeometry(DOOR.w + 0.4, 0.04, 0.5), mat(C.woodDark), [DOOR.x0 + DOOR.w / 2, y, DOOR.z - 0.9]))
    scene.add(mesh(rbox(0.3, 0.24, 0.32, 0.03), mat('#D9A35F', { roughness: 0.8 }), [DOOR.x0 + 0.3, y + 0.14, DOOR.z - 0.9]))
    scene.add(mesh(rbox(0.26, 0.3, 0.3, 0.03), mat('#2D63FB', { roughness: 0.6 }), [DOOR.x0 + 0.65, y + 0.17, DOOR.z - 0.9]))
  }
  const roomLight = new THREE.PointLight('#FFD9A0', 0, 2.6)
  roomLight.position.set(DOOR.x0 + DOOR.w / 2, 1.7, DOOR.z - 0.6)
  scene.add(roomLight)

  /* THE DOOR: hinged on its left edge, opens inward; plank face, a handle and the hasp plate near the free edge */
  const door = new THREE.Group()
  door.position.set(DOOR.x0, 0, DOOR.z)
  const doorFace = canvasTex(128, 256, (g) => {
    g.fillStyle = '#B57E4C'
    g.fillRect(0, 0, 128, 256)
    g.strokeStyle = 'rgba(80,45,15,0.35)'
    g.lineWidth = 3
    for (let x = 32; x < 128; x += 32) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, 256)
      g.stroke()
    }
  })
  const doorM = new THREE.MeshStandardMaterial({ map: doorFace, roughness: 0.6 })
  door.add(mesh(new THREE.BoxGeometry(DOOR.w - 0.02, DOOR.h - 0.02, 0.06), doorM, [DOOR.w / 2, DOOR.h / 2, 0]))
  door.traverse((o) => (o.receiveShadow = false))
  for (const y of [0.35, 1.0, 1.65]) door.add(mesh(new THREE.BoxGeometry(DOOR.w - 0.1, 0.1, 0.03), mat('#9A673A', { roughness: 0.6 }), [DOOR.w / 2, y, 0.045]))
  const steel = mat('#8C96A8', { metalness: 0.75, roughness: 0.3 })
  door.add(mesh(new THREE.BoxGeometry(0.26, 0.07, 0.02), steel, [DOOR.w - 0.18, LOCK_Y + 0.17, 0.04]))
  const pad = padlock('#2D63FB', 0.85)
  pad.g.position.set(DOOR.w - 0.08, LOCK_Y, 0.12)
  door.add(pad.g)
  scene.add(door)
  /* the staple on the frame the shackle passes through */
  scene.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16, Math.PI), steel, [xr + 0.04, LOCK_Y + 0.16, DOOR.z + 0.09]))

  /* the keys: the owner's gold key (matches) and the visitor's grey key (does not) */
  const keyhole = () => pad.g.localToWorld(new THREE.Vector3(0, -0.02, 0.062))
  const mkKey = (color: string) => {
    const k = key3d(color, 1.05)
    k.rotation.order = 'YXZ'
    k.visible = false
    scene.add(k)
    return k
  }
  const goodKey = mkKey(C.gold)
  const badKey = mkKey('#9AA7B8')
  const padBody = pad.body.material as THREE.MeshStandardMaterial
  const padBlue = new THREE.Color('#2D63FB')
  const padRed = new THREE.Color('#E5484D')

  /* THE PEOPLE (Character Lab): the visitor on the left, the owner on the right */
  const ZP = -0.8
  const visitor = castSprite({
    config: CAST_PRESETS.arjun,
    timeline: (t) => ({
      seed: 39,
      idle: CAST_IDLE,
      life: 0,
      expression: t >= 2.2 && t < 4.4 ? castClip('confused', 2.2, false) : t >= 6.3 && t < 7.8 ? castClip('surprised', 6.3, false) : castClip('neutral', 0, false),
      gesture: t >= 1.65 && t < 1.65 + 1.7 ? castClip('presentRight', 1.65) : undefined,
    }),
    loop: P39,
    frames: 52,
    height: 1.7,
    onReady: redraw,
  })
  const owner = castSprite({
    config: CAST_PRESETS.kabir,
    timeline: (t) => ({
      seed: 40,
      idle: CAST_IDLE,
      life: 0,
      expression: t >= 5.9 && t < 8.7 ? castClip('happy', 5.9, false) : castClip('neutral', 0, false),
      gesture: t >= 5.15 && t < 5.15 + 1.7 ? castClip('presentLeft', 5.15) : undefined,
    }),
    loop: P39,
    frames: 52,
    height: 1.72,
    onReady: redraw,
  })
  scene.add(visitor.object, owner.object)
  const VX = [-1.35, 0.0]
  const OX = [1.95, 1.38]
  const place = (s: { object: THREE.Object3D }, x: number, walking: boolean, u: number) => s.object.position.set(x, walking ? Math.abs(Math.sin(u * 7)) * 0.035 : 0, ZP)

  /* the key sits in the keyhole at an angle (KEY_YAW), so its bow reads from the camera rather than edge-on */
  const seat = (k: THREE.Group, turn: number) => {
    const h = keyhole()
    const L = 0.26 * 1.05
    k.position.set(h.x - Math.cos(KEY_YAW) * L, h.y, h.z + Math.sin(KEY_YAW) * L)
    k.rotation.set(turn, KEY_YAW, 0)
  }

  return (t: number) => {
    const u = t % P39
    /* the visitor: in, tries, back */
    const vIn = seg(u, 0.2, 1.6)
    const vOut = seg(u, 3.4, 4.9)
    place(visitor, lerp(lerp(VX[0], VX[1], vIn), VX[0], vOut), (u > 0.2 && u < 1.6) || (u > 3.4 && u < 4.9), u)
    visitor.update(u, camera)
    /* the owner: in, unlocks, opens, closes, locks, away */
    const oIn = seg(u, 3.6, 5.1)
    const oOut = seg(u, 8.7, 10.0)
    place(owner, lerp(lerp(OX[0], OX[1], oIn), OX[0], oOut), (u > 3.6 && u < 5.1) || (u > 8.7 && u < 10.0), u)
    owner.update(u, camera)

    /* the door swings in once the shackle is up, and closes again */
    const open = seg(u, 6.3, 7.1) * (1 - seg(u, 7.5, 8.1))
    door.rotation.y = open * 1.35
    door.updateMatrixWorld(true)
    roomLight.intensity = open * 3.2
    const shackle = seg(u, 5.95, 6.25) * (1 - seg(u, 8.1, 8.3))
    pad.shackle.position.y = shackle * 0.09
    pad.shackle.rotation.y = shackle * 0.9

    /* the wrong key: in, jiggles, will not turn; the lock flashes red */
    badKey.visible = u > 1.95 && u < 3.15
    const jig = seg(u, 2.05, 2.2) * (1 - seg(u, 2.95, 3.1))
    if (badKey.visible) seat(badKey, Math.sin((u - 2.05) * 20) * 0.22 * jig)
    const flash = jig * (0.85 + 0.15 * Math.sin((u - 2.05) * 14))
    padBody.color.copy(padBlue).lerp(padRed, flash)
    pad.g.position.x = DOOR.w - 0.08 + Math.sin(u * 40) * 0.006 * jig
    /* the matching key: in, turns, stays while the door is open, turns back, out */
    goodKey.visible = u > 5.4 && u < 8.55
    if (goodKey.visible) seat(goodKey, (seg(u, 5.55, 5.95) * (1 - seg(u, 8.25, 8.5)) * Math.PI) / 2)
  }
}

/* ================================================================== S39 · CONCEPT: the instance, its public key and the private key */

/* Round 4: the server room. The EC2 instance carries the public key, a padlock on its face. A visitor (Arjun, the same
   person as on the everyday card) at a stand-up desk sends his key from his laptop: it reaches the padlock, will not
   turn, the lock flashes red and the key goes back; he is puzzled. Then the owner (the boy with his laptop) sends his
   private key: it turns, the shackle lifts, the instance's face lights and the session glows open; the key comes home.
   Loop 10.2 s; the gold key is home at 10.0 s. */
const P39C = 10.2

function setupKeyRoom({ scene, camera, redraw }: StageKit) {
  camera.fov = 30
  camera.position.set(0.95, 3.2, 7.6)
  camera.lookAt(0.62, 0.95, -0.4)
  camera.updateMatrixWorld()
  lightRig(scene, [0.4, 0.5, -0.4])
  room(scene, { w: 6.6, d: 4.6, h: 3.8, x0: -2.85, z0: -1.9, floor: '#DCE5F5', seam: '#C9D6EE', wall: '#E9EFFB' })

  /* the row of racks along the back wall, the instance among them */
  const leds: THREE.Mesh[] = []
  for (const x of [-2.3, -1.5, -0.7, 0.1, 2.15, 2.95]) {
    const r = rack(1.95)
    r.g.position.set(x, 0, -1.5)
    scene.add(r.g)
    leds.push(...r.leds)
  }
  const inst = new THREE.Group()
  inst.position.set(1.12, 0, -1.4)
  inst.add(mesh(rbox(0.95, 0.35, 0.7, 0.03), mat(C.navy), [0, 0.18, 0]))
  const face = faceBox(0.9, 0.9, 0.7, chipTex(), '#C8511B')
  face.position.set(0, 0.82, 0)
  const faceLit = faceBox(0.9, 0.9, 0.7, chipTex(true), '#C8511B', true)
  faceLit.position.set(0, 0.82, 0)
  faceLit.visible = false
  inst.add(face, faceLit)
  /* the public key: a padlock fixed on the instance's face */
  const lock = padlock('#2D63FB', 1.7)
  lock.g.position.set(0, 1.56, 0.2)
  inst.add(lock.g)
  const glow = new THREE.PointLight('#7CF0B8', 0, 3)
  glow.position.set(0, 1.0, 0.8)
  inst.add(glow)
  scene.add(inst)
  inst.updateMatrixWorld(true)
  const hole = lock.g.localToWorld(new THREE.Vector3(0, -0.02, 0.062))
  const lockBody = lock.body.material as THREE.MeshStandardMaterial
  const blue = new THREE.Color('#2D63FB')
  const red = new THREE.Color('#E5484D')

  /* the owner: the boy with his laptop, sitting on the floor (the project's own illustration, round 3) */
  const BOY_H = 1.12
  const BOY_W = BOY_H * (252 / 342)
  const boyRoot = new THREE.Group()
  boyRoot.position.set(-0.75, 0.03, 0.55)
  const boyTex = new THREE.TextureLoader().load(boyLaptopUrl, () => redraw())
  boyTex.colorSpace = THREE.SRGBColorSpace
  const boyGeo = new THREE.PlaneGeometry(BOY_W, BOY_H)
  boyGeo.translate(0, BOY_H / 2, 0)
  const boyPlane = new THREE.Mesh(boyGeo, new THREE.MeshBasicMaterial({ map: boyTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false }))
  boyRoot.add(boyPlane)
  scene.add(boyRoot)
  boyPlane.userData.textures = [boyTex]
  scene.add(mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.05, 32), mat('#C9D6EE', { roughness: 0.9 }), [-0.75, 0.0, 0.55]))
  const camW = new THREE.Vector3()
  camera.getWorldPosition(camW)
  boyPlane.rotation.y = Math.atan2(camW.x - boyRoot.position.x, camW.z - boyRoot.position.z)
  boyRoot.updateMatrixWorld(true)
  const boyLaptop = boyPlane.localToWorld(new THREE.Vector3((0.62 - 0.5) * BOY_W, (1 - 0.58) * BOY_H, 0.04))

  /* the visitor (Character Lab, Arjun) behind a stand-up desk with his laptop */
  const desk = new THREE.Group()
  desk.position.set(2.25, 0, 0.72)
  desk.add(mesh(rbox(0.86, 0.05, 0.5, 0.02), mat(C.wood), [0, 1.0, 0]))
  desk.add(mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), mat(C.steelDark, { metalness: 0.6 }), [0, 0.5, 0]))
  desk.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(C.steelDark, { metalness: 0.6 }), [0, 0.02, 0]))
  desk.add(mesh(new THREE.BoxGeometry(0.86, 0.32, 0.03), mat('#E8EEF8', { roughness: 0.8 }), [0, 0.82, 0.24]))
  /* his laptop: the screen at the far side, facing him */
  desk.add(mesh(rbox(0.38, 0.02, 0.26, 0.01), mat('#9AA7B8', { metalness: 0.5 }), [0, 1.035, -0.02]))
  const lid = mesh(rbox(0.38, 0.26, 0.015, 0.01), mat('#9AA7B8', { metalness: 0.5 }), [0, 1.16, 0.11])
  lid.rotation.x = 0.18
  desk.add(lid)
  scene.add(desk)
  const visitor = castSprite({
    config: CAST_PRESETS.arjun,
    timeline: (t) => ({
      seed: 41,
      idle: CAST_IDLE,
      life: 0,
      expression: t >= 1.8 && t < 4.4 ? castClip('confused', 1.8, false) : t >= 6.4 && t < 8.0 ? castClip('surprised', 6.4, false) : castClip('neutral', 0, false),
    }),
    loop: P39C,
    frames: 34,
    height: 1.7,
    onReady: redraw,
  })
  visitor.object.position.set(2.25, 0, 0.3)
  scene.add(visitor.object)
  const visitorLaptop = new THREE.Vector3(2.25, 1.3, 0.72)

  /* the two keys and their paths: each leaves its laptop, arrives in the keyhole shaft-first */
  const mk = (color: string) => {
    const k = key3d(color, 2.1)
    k.rotation.order = 'YXZ'
    scene.add(k)
    return k
  }
  const goodKey = mk(C.gold)
  const badKey = mk('#9AA7B8')
  const L = 0.26 * 1.75
  const seatAt = new THREE.Vector3(hole.x - Math.cos(KEY_YAW) * L, hole.y, hole.z + Math.sin(KEY_YAW) * L)
  const path = (from: THREE.Vector3, peak: THREE.Vector3) => new THREE.QuadraticBezierCurve3(from, peak, seatAt)
  const goodPath = path(boyLaptop, new THREE.Vector3(0.2, 2.35, 0.2))
  const badPath = path(visitorLaptop, new THREE.Vector3(1.95, 2.4, 0.1))
  /* depthWrite off: an invisible trail must never cut a line through a person behind it */
  const trailMat = (c: string) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })
  const goodTrail = new THREE.Mesh(new THREE.TubeGeometry(goodPath, 40, 0.012, 6, false), trailMat('#F2C14E'))
  const badTrail = new THREE.Mesh(new THREE.TubeGeometry(badPath, 40, 0.012, 6, false), trailMat('#9AA7B8'))
  scene.add(goodTrail, badTrail)

  const fly = (k: THREE.Group, trail: THREE.Mesh, curve: THREE.QuadraticBezierCurve3, f: number, turn: number) => {
    k.visible = f > 0.001
    k.position.copy(curve.getPoint(f))
    k.rotation.set(turn, KEY_YAW * seg(f, 0.55, 1), 0)
    k.scale.setScalar(2.1 - 0.35 * f)
    const op = 0.35 * Math.sin(Math.PI * clamp(f))
    ;(trail.material as THREE.MeshBasicMaterial).opacity = op
    trail.visible = op > 0.01
  }

  return (t: number) => {
    const u = t % P39C
    /* the visitor's key: out, jiggles, will not turn, back */
    const bf = seg(u, 0.1, 1.5) * (1 - seg(u, 2.8, 4.0))
    const jig = seg(u, 1.6, 1.75) * (1 - seg(u, 2.65, 2.8))
    fly(badKey, badTrail, badPath, bf, Math.sin((u - 1.6) * 20) * 0.22 * jig)
    const flash = jig * (0.85 + 0.15 * Math.sin((u - 1.6) * 14))
    lockBody.color.copy(blue).lerp(red, flash)
    lock.g.position.x = Math.sin(u * 40) * 0.008 * jig
    /* the owner's private key: out, turns, the session opens, closes, home */
    const gf = seg(u, 4.1, 5.7) * (1 - seg(u, 8.6, 10.0))
    const turn = (seg(u, 5.85, 6.25) * (1 - seg(u, 8.35, 8.65)) * Math.PI) / 2
    fly(goodKey, goodTrail, goodPath, gf, turn)
    const open = seg(u, 6.25, 6.65) * (1 - seg(u, 8.0, 8.4))
    lock.shackle.position.y = open * 0.09
    lock.shackle.rotation.y = open * 0.9
    face.visible = open < 0.5
    faceLit.visible = open >= 0.5
    glow.intensity = open * 2.2
    leds.forEach((l, i) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.8 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))))
    boyPlane.scale.y = 1 + Math.sin(t * 2.1) * 0.006
    visitor.update(u, camera)
  }
}

/* ================================================================== S49 · EVERYDAY: the housing site */

/* one loop: the plots clear by 9.6 s and the first house starts rising at 0.1 s of the next loop (round 3) */
const P49 = 9.75
const PLOTS = [-0.55, 1.15, 2.85]

/** one house from the standard plan: walls, gable roof, door with its lock, windows; parts animated by `rise` */
function house() {
  const g = new THREE.Group()
  const walls = new THREE.Group()
  walls.add(mesh(rbox(1.15, 0.85, 1.0, 0.02), mat('#FFF6E8', { roughness: 0.8 }), [0, 0.425, 0]))
  walls.add(mesh(new THREE.BoxGeometry(0.26, 0.5, 0.03), mat(C.woodDark), [-0.22, 0.25, 0.51]))
  walls.add(mesh(new THREE.SphereGeometry(0.03, 10, 10), mat(C.gold, { metalness: 0.8, roughness: 0.25 }), [-0.13, 0.27, 0.535]))
  walls.add(mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), mat(C.gold, { metalness: 0.8, roughness: 0.25 }), [-0.13, 0.19, 0.53]))
  const win = mat(C.glass, { roughness: 0.15, metalness: 0.2, emissive: '#9CC2FF', emissiveIntensity: 0.15 })
  walls.add(mesh(new THREE.BoxGeometry(0.28, 0.24, 0.03), win, [0.24, 0.5, 0.51]))
  walls.add(mesh(new THREE.BoxGeometry(0.03, 0.24, 0.6), win, [0.585, 0.5, 0]))
  g.add(walls)
  const roofShape = new THREE.Shape()
  roofShape.moveTo(-0.7, 0)
  roofShape.lineTo(0.7, 0)
  roofShape.lineTo(0, 0.55)
  roofShape.closePath()
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.15, bevelEnabled: false })
  roofGeo.translate(0, 0, -0.575)
  const roof = mesh(roofGeo, mat(C.brand, { roughness: 0.55 }))
  roof.rotation.y = Math.PI / 2
  g.add(roof)
  const chimney = mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), mat('#C9D3E6'), [0.25, 1.15, -0.2])
  g.add(chimney)
  return { g, walls, roof, chimney }
}

function setupHousingSite({ scene, camera, redraw }: StageKit) {
  frame(camera, 0.3, 0.2, 0.4)
  lightRig(scene, [0.5, 0.3, -0.3])
  /* ground: grass, the street, a pavement, three prepared plots */
  const grassTex = canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = C.grass
      g.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 900; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(80,150,70,0.25)' : 'rgba(200,240,190,0.25)'
        g.fillRect(Math.random() * 256, Math.random() * 256, 2, 3)
      }
    },
    [5, 4],
  )
  const soil = mat('#9C7A58', { roughness: 0.9 })
  const ground = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.24, 4.2), [soil, soil, new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 }), soil, soil, soil])
  ground.position.set(0.4, -0.12, 0.1)
  ground.receiveShadow = true
  ground.castShadow = false
  scene.add(ground)
  const road = mesh(new THREE.BoxGeometry(7.2, 0.02, 0.85), mat(C.road, { roughness: 0.9 }), [0.4, 0.01, 1.35])
  road.castShadow = false
  scene.add(road)
  for (let i = 0; i < 8; i++) scene.add(mesh(new THREE.BoxGeometry(0.4, 0.005, 0.06), mat(C.white), [-2.6 + i * 0.85, 0.025, 1.35]))
  scene.add(mesh(new THREE.BoxGeometry(7.2, 0.05, 0.3), mat('#D7DEEA'), [0.4, 0.025, 0.78]))
  const plotM = mat('#C9A27A', { roughness: 0.95 })
  const houses = PLOTS.map((x) => {
    scene.add(mesh(new THREE.BoxGeometry(1.45, 0.04, 1.3), plotM, [x, 0.02, -0.6]))
    scene.add(mesh(new THREE.BoxGeometry(0.3, 0.03, 0.7), mat('#D7DEEA'), [x - 0.22, 0.02, 0.3]))
    const h = house()
    h.g.position.set(x, 0.04, -0.65)
    scene.add(h.g)
    return h
  })
  /* trees and a stack of building material */
  for (const [x, z] of [
    [-2.65, -1.7],
    [3.75, -1.5],
    [3.6, 0.3],
  ]) {
    scene.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 10), mat('#8A5A35'), [x, 0.25, z]))
    scene.add(mesh(new THREE.SphereGeometry(0.34, 18, 16), mat('#5DBB7A', { roughness: 0.75 }), [x, 0.72, z]))
  }
  for (let i = 0; i < 3; i++) scene.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), mat('#E07B5A', { roughness: 0.85 }), [-2.3, 0.06 + i * 0.12, 0.35]))

  /* the builder (Character Lab, Dev in an orange hi-vis polo; round 3): he holds the standard house plan at his chest
     and looks up at each house as it rises (a nod, a look up), his body still. His hard hat is a 3D prop set on his
     head, a hair toward the camera so it sits over his hair. */
  const BUILDER: CharacterConfig = { ...CAST_PRESETS.dev, name: 'Builder', outfit: { ...CAST_PRESETS.dev.outfit, top: 'polo', topColor: '#F07E2A', bottom: 'trousers', bottomColor: '#2B3445' } }
  const builder = castSprite({
    config: BUILDER,
    timeline: (t) => ({
      seed: 31,
      idle: CAST_IDLE,
      life: 0,
      expression: castClip(t > 4.6 ? 'happy' : 'thinking', t > 4.6 ? 4.6 : 0, false),
      gesture: t > 1.0 && t < 1.0 + 1.6 ? castClip('nod', 1.0) : t > 2.7 && t < 2.7 + 1.6 ? castClip('nod', 2.7) : t > 4.4 && t < 4.4 + 2.2 ? castClip('lookUpThink', 4.4) : undefined,
    }),
    loop: P49,
    frames: 39,
    height: 1.72,
    onReady: redraw,
  })
  const BPOS = new THREE.Vector3(-1.95, 0, -0.35)
  builder.object.position.copy(BPOS)
  scene.add(builder.object)
  const camB = new THREE.Vector3()
  camera.updateMatrixWorld()
  camera.getWorldPosition(camB)
  const toCam = camB.clone().sub(BPOS).setY(0).normalize()
  /* rig box: the head's centre is 20 % down the 600-unit box, the crown ~10 %; box height = 1.72 / 0.93 */
  const BOXH = 1.72 / 0.93
  const hat = new THREE.Group()
  hat.add(mesh(new THREE.SphereGeometry(0.195, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat('#F2C14E', { roughness: 0.4 })))
  hat.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 28), mat('#F2C14E', { roughness: 0.4 }), [0, 0.005, 0]))
  hat.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.42), mat('#E2AE2E', { roughness: 0.4 }), [0, 0.13, 0]))
  hat.position.copy(BPOS).add(new THREE.Vector3(0, BOXH * 0.91, 0)).addScaledVector(toCam, 0.12)
  hat.rotation.y = Math.atan2(toCam.x, toCam.z)
  scene.add(hat)
  /* the plan, held at his chest, in front of him toward the camera */
  const planTex = canvasTex(256, 180, (g) => {
    g.fillStyle = '#1F5AD6'
    g.fillRect(0, 0, 256, 180)
    g.strokeStyle = 'rgba(255,255,255,0.9)'
    g.lineWidth = 5
    g.strokeRect(78, 82, 100, 72)
    g.beginPath()
    g.moveTo(66, 84)
    g.lineTo(128, 34)
    g.lineTo(190, 84)
    g.stroke()
    g.strokeRect(96, 110, 22, 44)
    g.strokeRect(138, 104, 26, 22)
    g.lineWidth = 2
    g.strokeStyle = 'rgba(255,255,255,0.5)'
    g.strokeRect(10, 10, 236, 160)
  })
  const plan = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.01), [mat('#1F5AD6'), mat('#1F5AD6'), mat('#1F5AD6'), mat('#1F5AD6'), new THREE.MeshStandardMaterial({ map: planTex, roughness: 0.6 }), mat('#E8F0FF')])
  plan.castShadow = true
  plan.position.copy(BPOS).add(new THREE.Vector3(0, BOXH * 0.5, 0)).addScaledVector(toCam, 0.26)
  plan.rotation.order = 'YXZ'
  plan.rotation.set(-0.3, Math.atan2(toCam.x, toCam.z), 0)
  scene.add(plan)

  return (t: number) => {
    const u = t % P49
    houses.forEach((h, i) => {
      const a = 0.1 + i * 1.7
      const up = seg(u, a, a + 1.0) * (1 - seg(u, 8.6, 9.6))
      const roofK = seg(u, a + 0.8, a + 1.4) * (1 - seg(u, 8.6, 9.6))
      h.walls.scale.y = Math.max(0.001, up)
      h.walls.visible = up > 0.01
      /* the roof is set down from just above the walls, solid, settling with a small bounce */
      h.roof.position.y = 0.85 + (1 - roofK) * 0.45
      h.roof.scale.setScalar(Math.max(0.001, Math.min(1, roofK * 1.08)))
      h.roof.visible = roofK > 0.01
      h.chimney.visible = roofK > 0.95
    })
    /* the builder checks the plan, looks up at the house going up, back to the plan */
    builder.update(u, camera)
    plan.rotation.x = -0.3 + Math.sin(t * 1.7) * 0.03
  }
}

/* ================================================================== S49 · CONCEPT: the launch template stamping instances */

function setupTemplateFloor({ scene, camera }: StageKit) {
  frame(camera, 0.3, 0.3, 1.0, 13.0, 6.0)
  lightRig(scene, [0.5, 0.3, -0.3])
  room(scene, { w: 7.0, d: 4.8, h: 2.5, x0: -2.95, z0: -2.0, floor: '#DCE5F5', seam: '#C9D6EE', wall: '#E9EFFB' })
  const leds: THREE.Mesh[] = []
  for (const x of [-0.2, 0.6, 1.4, 2.2, 3.0]) {
    const r = rack(1.8)
    r.g.position.set(x, 0, -1.6)
    scene.add(r.g)
    leds.push(...r.leds)
  }

  /* the launch template: a blueprint board on a stand, carrying the AMI, the instance type and the shield */
  const tpl = new THREE.Group()
  tpl.position.set(-1.95, 0, -0.35)
  tpl.rotation.y = 0.55
  tpl.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 10), mat(C.steelDark, { metalness: 0.6 }), [0, 0.5, -0.05]))
  tpl.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.05, 24), mat(C.steelDark, { metalness: 0.6 }), [0, 0.025, -0.05]))
  const bpTex = canvasTex(256, 200, (g) => {
    g.fillStyle = '#1F5AD6'
    g.fillRect(0, 0, 256, 200)
    g.strokeStyle = 'rgba(255,255,255,0.35)'
    g.lineWidth = 2
    for (let i = 1; i < 4; i++) {
      g.beginPath()
      g.moveTo(16, i * 50)
      g.lineTo(240, i * 50)
      g.stroke()
    }
    g.strokeStyle = 'rgba(255,255,255,0.8)'
    g.lineWidth = 4
    g.strokeRect(8, 8, 240, 184)
  })
  const board = new THREE.Mesh(rbox(0.95, 0.75, 0.05, 0.02), [mat('#1F5AD6'), mat('#1F5AD6'), mat('#1F5AD6'), mat('#1F5AD6'), new THREE.MeshStandardMaterial({ map: bpTex, roughness: 0.5 }), mat('#1F5AD6')])
  board.position.set(0, 1.35, 0)
  board.rotation.x = -0.12
  board.castShadow = true
  tpl.add(board)
  const tAmi = faceBox(0.24, 0.24, 0.06, amiTex(), '#C8511B')
  tAmi.position.set(-0.27, 1.38, 0.07)
  const tType = faceBox(0.24, 0.24, 0.06, chipTex(), '#C8511B')
  tType.position.set(0.0, 1.38, 0.07)
  const tSg = shield(0.3)
  tSg.position.set(0.27, 1.38, 0.08)
  tpl.add(tAmi, tType, tSg)
  scene.add(tpl)

  /* the stamp: a ring of light that flies from the template to each plinth */
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 10, 40), new THREE.MeshStandardMaterial({ color: C.brand, emissive: C.brand, emissiveIntensity: 0.9, transparent: true }))
  ring.rotation.x = Math.PI / 2
  scene.add(ring)
  const from = new THREE.Vector3(-1.95, 1.4, -0.3)

  /* three plinths and the identical instances that rise on them */
  const SLOTS = [-0.35, 1.05, 2.45]
  const insts = SLOTS.map((x) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 32), mat('#C9D6EE', { roughness: 0.6 }), [x, 0.06, -0.35]))
    const g = new THREE.Group()
    g.position.set(x, 0.12, -0.35)
    const box = faceBox(0.62, 0.62, 0.62, chipTex(), '#C8511B')
    box.position.y = 0.31
    const ami = faceBox(0.24, 0.24, 0.05, amiTex(), '#C8511B')
    ami.position.set(-0.17, 0.78, 0.12)
    ami.rotation.x = -0.25
    const sg = shield(0.28)
    sg.position.set(0.26, 0.82, 0.12)
    g.add(box, ami, sg)
    scene.add(g)
    return { g, box, ami, sg, x }
  })

  /* one loop: cleared by 9.7 s, the first stamp leaves at 0.1 s of the next loop (round 3) */
  const P = 9.85
  return (t: number) => {
    const u = t % P
    let ringOn = false
    insts.forEach((it, i) => {
      const a = 0.1 + i * 1.9
      const fly = seg(u, a, a + 0.9)
      if (u >= a && u < a + 1.05) {
        ringOn = true
        const to = new THREE.Vector3(it.x, 0.2, -0.35)
        ring.position.lerpVectors(from, to, fly)
        ring.position.y += Math.sin(Math.PI * fly) * 0.8
        ring.scale.setScalar(0.6 + fly * 0.9)
        ;(ring.material as THREE.MeshStandardMaterial).opacity = 1 - seg(u, a + 0.85, a + 1.05)
      }
      const up = seg(u, a + 0.8, a + 1.5) * (1 - seg(u, 8.8, 9.7))
      it.g.scale.set(Math.max(0.001, up), Math.max(0.001, up), Math.max(0.001, up))
      it.g.visible = up > 0.01
      const badge = seg(u, a + 1.3, a + 1.7) * (1 - seg(u, 8.8, 9.3))
      it.ami.scale.setScalar(Math.max(0.001, badge))
      it.sg.scale.setScalar(Math.max(0.001, badge * 0.28))
      it.g.position.y = 0.12 + Math.sin(t * 1.6 + i) * 0.015 * up
    })
    ring.visible = ringOn
    /* the template's three parts pulse as each stamp leaves */
    const pulse = insts.reduce((m, _, i) => Math.max(m, 1 - Math.abs(u - (0.1 + i * 1.9)) * 3), 0)
    const s = 1 + clamp(pulse) * 0.12
    tAmi.scale.setScalar(s)
    tType.scale.setScalar(s)
    tSg.scale.setScalar(0.3 * s)
    leds.forEach((l, i) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.8 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.3))))
  }
}

/* ------------------------------------------------------------------ the four stages */

const Stage = ({ step, setup, holdT }: { step: number; setup: (s: StageKit) => (t: number, step: number) => void; holdT: number }) => (
  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={holdT} />
  </div>
)

const G_T21Everyday = ({ step }: { step: number }) => <Stage step={step} setup={setupLockDoor} holdT={6.9} />
const G_T21Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupKeyRoom} holdT={7.0} />
const G_T25Everyday = ({ step }: { step: number }) => <Stage step={step} setup={setupHousingSite} holdT={7.2} />
const G_T25Concept = ({ step }: { step: number }) => <Stage step={step} setup={setupTemplateFloor} holdT={7.3} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  G_T21Everyday: G_T21Everyday as never,
  G_T21Concept: G_T21Concept as never,
  G_T25Everyday: G_T25Everyday as never,
  G_T25Concept: G_T25Concept as never,
}
export const slides = {}
export const css = ''
