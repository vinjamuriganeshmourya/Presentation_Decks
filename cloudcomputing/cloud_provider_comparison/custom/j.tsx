import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'

/**
 * BUILDER J · SESSION 11 (Cloud Provider Comparison) ANALOGY ON SLIDE 23 (TR 13): a ready-made shirt off the rack is a
 * pre-built AI API; a tailor who takes measurements and stitches to order is the managed ML platform.
 *
 * Built to Sessions 9 and 10's review rules from the first draft (generate-slides standing corrections 13-16, cloud
 * course R10-R13): real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera, a
 * real place, never isometric or clay; people are Character Lab characters (rig frames pre-rendered onto depth-tested,
 * camera-facing planes, `rigSprite` below with a `dress` hook for role clothing), each an individual, expressions synced
 * to the action, minimal joint movement for standing roles; no text, digits or labels on either card; the concept card
 * mirrors the everyday card position for position; one 8 s wall-clock loop that plays the whole action and ends on its
 * first frame; held frames (`?still`, thumbnails, reduced motion) draw the key moment at `HOLD`, nothing moving.
 *
 *   everyday  a tailor's shop. Left: a customer takes a shirt off the rack, holds it up (ready at once) and drops it
 *             into his shopping bag. Right: the tailor measures a customer with a tape, stitches the fabric on the
 *             sewing machine (fabric, measurements, time), shows the finished shirt and hands it over; she holds it up.
 *   concept   the same places. Left (rack ↔ pre-built API): a user sends a photo from his laptop into the API box and a
 *             label comes straight back. Right (tailor ↔ ML platform): a user sends her data blocks to the platform's
 *             bench, the training rig consumes them while its progress ring fills (training), a dial turns (tuning),
 *             then a custom model rises from the rig and is delivered to her.
 */

const W = 470
const H = 390
const L = 8
const HOLD = 1.9

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandSoft: '#DCE6FF',
  sky: '#95C2FB',
  navy: '#1F2E63',
  ink: '#00254B',
  steel: '#C9D3E6',
  white: '#FFFFFF',
  paper: '#FBFCFF',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#16A34A',
  wood: '#C99A6A',
  woodDark: '#9C6E45',
}

/* the shared timeline (seconds of the 8 s loop); the concept card runs the same marks, part for part */
const T = {
  /* left: the ready-made shirt ↔ the pre-built API */
  reach: [0.25, 0.85],
  fly: [0.62, 1.22],
  hold: [1.22, 2.45],
  bag: [2.45, 3.05],
  /* right: the tailor ↔ the platform */
  tapeOut: [0.45, 0.95],
  tapeIn: [1.75, 2.15],
  turn: [2.1, 2.45],
  stitch: [2.45, 5.35],
  form: [5.35, 5.95],
  show: [5.55, 6.25],
  deliver: [6.25, 6.85],
  /* everything put back for the next loop */
  reset: [7.6, 7.98],
}

/* ------------------------------------------------------------------ helpers (as Session 10's h.tsx) */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
const win = (t: number, a: number, b: number, e = 0.2) => seg(t, a - e, a) * (1 - seg(t, b, b + e))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
type V3 = THREE.Vector3Tuple
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]
const arc = (a: V3, b: V3, k: number, lift: number): V3 => {
  const p = lerp3(a, b, k)
  p[1] += Math.sin(k * Math.PI) * lift
  return p
}
const segOf = (c: number, r: number[]) => seg(c, r[0], r[1])
const loopT = (t: number) => ((t % L) + L) % L

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

const box = (w: number, h: number, d: number, m: THREE.Material, pos: V3, r = 0) => mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** a room: floor, back wall and left wall, all receiving shadows */
function room(scene: THREE.Scene, o: { floor: THREE.Material; back: THREE.Material; side: THREE.Material; w?: number; d?: number; h?: number }) {
  const w = o.w ?? 10
  const d = o.d ?? 7
  const h = o.h ?? 3.8
  const floor = mesh(new THREE.PlaneGeometry(w, d), o.floor, [0, 0, 0])
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false
  for (const m of [o.back, o.side] as THREE.MeshStandardMaterial[])
    if (m.emissive) {
      m.emissive = m.color.clone()
      m.emissiveIntensity = 0.3
    }
  const back = mesh(new THREE.PlaneGeometry(w, h), o.back, [0, h / 2, -1.75])
  back.castShadow = false
  const side = mesh(new THREE.PlaneGeometry(d, h), o.side, [-w / 2, h / 2, 0])
  side.rotation.y = Math.PI / 2
  side.castShadow = false
  scene.add(floor, back, side)
}

const fadeable = (m: THREE.Material) => {
  m.transparent = true
  return m
}
/** set the opacity of every material under an object (each fading object owns its materials) */
function setOpacity(o: THREE.Object3D, a: number) {
  o.visible = a > 0.01
  o.traverse((n) => {
    const m = (n as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    for (const x of Array.isArray(m) ? m : m ? [m] : []) {
      x.transparent = true
      x.opacity = a
    }
  })
}

/** a thin box from a to b (a tape, a wire) whose length follows k */
function stretch(o: THREE.Object3D, a: V3, b: V3, k: number) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const end = va.clone().lerp(vb, Math.max(0.001, k))
  const len = va.distanceTo(end)
  o.position.copy(va.clone().add(end).multiplyScalar(0.5))
  o.scale.set(1, 1, Math.max(0.001, len))
  o.lookAt(end)
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
/**
 * The engine's `castSprite` with Session 9 j.tsx's `dress` hook (role clothing drawn in the rig's own frames, so it
 * moves with it). Frames are rasterised on demand: a held frame draws only the one it shows; a live loop fills in the
 * rest ahead of the play head.
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; wide?: number; onReady?: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 400 })
}

/** the expression at loop time c from [start, name] keys, crossfading from the key before (wrapping) */
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
const who = (base: CharacterConfig, o: { hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})

/* role clothing in the rig's body frame (400 x 600): the tailor's measuring tape round the neck, a pin cushion on the wrist
   is left out (no job); a waistcoat over the shirt */
const TAPE = (
  <g data-part="tape">
    <path d="M 172 212 C 166 250 166 300 170 352" stroke="#F2C14E" strokeWidth={11} fill="none" strokeLinecap="butt" />
    <path d="M 228 212 C 234 250 234 300 230 352" stroke="#F2C14E" strokeWidth={11} fill="none" strokeLinecap="butt" />
    {[226, 244, 262, 280, 298, 316, 334].map((y) => (
      <g key={y}>
        <path d={`M ${166 + (y > 300 ? 1 : 0)} ${y} h 5`} stroke="#7A5A10" strokeWidth={1.6} />
        <path d={`M ${229 - (y > 300 ? 1 : 0)} ${y} h 5`} stroke="#7A5A10" strokeWidth={1.6} />
      </g>
    ))}
  </g>
)
const WAISTCOAT = (
  <g data-part="waistcoat">
    <path d="M 152 222 C 150 270 150 330 154 392 L 196 404 L 196 262 C 184 246 172 232 166 214 Z" fill="#1F2E63" />
    <path d="M 248 222 C 250 270 250 330 246 392 L 204 404 L 204 262 C 216 246 228 232 234 214 Z" fill="#1F2E63" />
    {[290, 322, 354].map((y) => (
      <circle key={y} cx={209} cy={y} r={3.6} fill="#F2C14E" />
    ))}
  </g>
)

/* ------------------------------------------------------------------ shared props */

/** a shirt silhouette (collar, short sleeves, body), hanging from its top edge at y 0 */
function shirtGeo(s = 1): THREE.ExtrudeGeometry {
  const sh = new THREE.Shape()
  const P: [number, number][] = [
    [-0.06, 0],
    [-0.16, -0.025],
    [-0.27, -0.12],
    [-0.215, -0.205],
    [-0.155, -0.165],
    [-0.15, -0.5],
    [0.15, -0.5],
    [0.155, -0.165],
    [0.215, -0.205],
    [0.27, -0.12],
    [0.16, -0.025],
    [0.06, 0],
    [0, -0.075],
  ]
  sh.moveTo(P[0][0] * s, P[0][1] * s)
  for (const [x, y] of P.slice(1)) sh.lineTo(x * s, y * s)
  sh.closePath()
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.026 * s, bevelEnabled: true, bevelThickness: 0.008 * s, bevelSize: 0.008 * s, bevelSegments: 2, curveSegments: 4 })
  g.translate(0, 0, -0.013 * s)
  return g
}
/** a whole shirt: body, a collar in a lighter tone, a placket with buttons */
function shirt(color: string, s = 1, collar = '#FFFFFF'): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(shirtGeo(s), mat(color, { roughness: 0.75 })))
  const cm = mat(collar, { roughness: 0.6 })
  const left = box(0.07 * s, 0.035 * s, 0.012 * s, cm, [-0.035 * s, -0.035 * s, 0.026 * s])
  left.rotation.z = -0.55
  const right = box(0.07 * s, 0.035 * s, 0.012 * s, cm, [0.035 * s, -0.035 * s, 0.026 * s])
  right.rotation.z = 0.55
  g.add(left, right)
  g.add(box(0.016 * s, 0.4 * s, 0.006 * s, mat(collar, { roughness: 0.6 }), [0, -0.29 * s, 0.026 * s]))
  for (const y of [-0.15, -0.25, -0.35, -0.45]) g.add(mesh(new THREE.SphereGeometry(0.009 * s, 10, 10), mat(C.navy), [0, y * s, 0.032 * s]))
  return g
}
/** a wooden hanger whose hook goes over a rail at y 0 */
function hanger(): THREE.Group {
  const g = new THREE.Group()
  const wood = mat(C.wood, { roughness: 0.5 })
  const bar = box(0.36, 0.022, 0.022, wood, [0, -0.07, 0])
  g.add(bar)
  const hook = mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI * 1.3), mat('#B8C2D6', { metalness: 0.7, roughness: 0.3 }), [0, 0.0, 0])
  hook.rotation.z = -0.2
  g.add(hook)
  g.add(box(0.008, 0.05, 0.008, mat('#B8C2D6', { metalness: 0.7, roughness: 0.3 }), [0, -0.04, 0]))
  return g
}

/** a laptop held open in front of a person: lid at the front edge, its back to the camera (the screen faces the person) */
function laptop(redraw?: () => void): { g: THREE.Group; glow: THREE.MeshStandardMaterial } {
  void redraw
  const g = new THREE.Group()
  const shell = mat('#D9DFEA', { metalness: 0.55, roughness: 0.32 })
  g.add(box(0.38, 0.018, 0.25, shell, [0, 0, 0], 0.006))
  const lid = new THREE.Group()
  lid.position.set(0, 0.009, 0.12)
  const lidMesh = box(0.38, 0.25, 0.012, shell, [0, 0.125, 0], 0.006)
  lid.add(lidMesh)
  const glow = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color(C.brand), emissiveIntensity: 0.35, roughness: 0.4 })
  const emblem = mesh(new THREE.CircleGeometry(0.026, 24), glow, [0, 0.13, 0.0075])
  lid.add(emblem)
  lid.rotation.x = 0.22
  g.add(lid)
  return { g, glow }
}

/* ------------------------------------------------------------------ positions (shared by both cards, so they mirror) */

const P = {
  rack: [-1.62, 0, -0.95] as V3,
  /* customer / user A stands in front-right of the rack, customer / user B at the right end of the table */
  a: [-0.42, 0, 0.3] as V3,
  table: [0.7, 0, -0.42] as V3,
  tailor: [0.66, 0, -1.08] as V3,
  b: [1.64, 0, 0.26] as V3,
}
const TABLE = { w: 1.1, d: 0.7, h: 0.8 }

function frame(camera: THREE.PerspectiveCamera) {
  camera.fov = 32
  camera.position.set(0, 1.95, 6.0)
  camera.lookAt(0, 0.9, -0.25)
}

/* the people (five individuals across the slide, none repeated) */
const cfgA = who(CAST_PRESETS.kabir, { outfit: { topColor: '#FCC82B' } })
const cfgB = who(CAST_PRESETS.meera, { outfit: { topColor: '#FC963C' } })
const cfgTailor = who(CAST_PRESETS.rohan, { outfit: { top: 'shirt', topColor: '#F3F6FC', bottomColor: '#1F2E63' }, accessories: { glasses: 'rect' } })
const cfgUA = who(CAST_PRESETS.dev, {})
const cfgUB = who(CAST_PRESETS.ananya, { outfit: { topColor: '#829983' } })

const FR = 80 /* frames per loop per person: 10 per second */
const PX = 360 /* texture px per 400 rig units: ~170 CSS px tall people stay sharp at 4K */

/** person A: reaches to the rack (screen left), holds the shirt up, drops it into the bag (screen-right hand) */
function personA(config: CharacterConfig, seed: number, redraw: () => void, laptopHeld: boolean): Sprite {
  return rigSprite({
    config,
    loop: L,
    frames: FR,
    px: PX,
    height: 1.68,
    onReady: redraw,
    timeline: (c) => ({ seed, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T.reach[0], 'listening'], [T.fly[1] - 0.15, 'excited'], [T.hold[1], 'happy'], [T.bag[1] + 0.4, 'proud'], [T.reset[0], 'neutral']], L) }),
    pose: (p, c) => {
      /* looks at the rack / the API box while reaching, then at what he holds */
      const look = win(c, T.reach[0] - 0.1, T.fly[1], 0.2)
      to(p, 'headTurn', -0.45, look)
      to(p, 'lookX', -0.85, look)
      to(p, 'lookY', 0.25, win(c, T.fly[1], T.bag[1], 0.2))
      to(p, 'headNod', 0.12, win(c, T.fly[1], T.bag[1], 0.2))
      if (laptopHeld) {
        /* both forearms forward under the laptop, the whole loop */
        to(p, 'shoulderL', 14, 1)
        to(p, 'elbowL', 86, 1)
        to(p, 'shoulderR', 14, 1)
        to(p, 'elbowR', 86, 1)
        /* a quick tap on the keys to send the photo */
        to(p, 'elbowR', 96 + 6 * Math.sin(c * 30), win(c, T.reach[0], T.reach[0] + 0.35, 0.1))
        return
      }
      /* screen-left arm (his right) reaches out to the rack, then both hands hold the shirt up */
      const reach = win(c, T.reach[0], T.fly[0] + 0.1, 0.18)
      to(p, 'shoulderL', 68, reach)
      to(p, 'elbowL', 18, reach)
      const hold = win(c, T.fly[1] - 0.1, T.bag[0] + 0.15, 0.2)
      to(p, 'shoulderL', 22, hold)
      to(p, 'elbowL', 118, hold)
      to(p, 'shoulderR', 22, hold)
      to(p, 'elbowR', 118, hold)
      /* the bag hangs from the screen-right hand: that arm out a little the whole loop */
      to(p, 'shoulderR', 16, 1 - hold)
      to(p, 'elbowR', 10, 1 - hold)
    },
  })
}
/** person B: listens while measured (or while her data goes up), waits, then lights up and holds the result */
function personB(config: CharacterConfig, seed: number, redraw: () => void, laptopHeld: boolean): Sprite {
  return rigSprite({
    config,
    loop: L,
    frames: FR,
    px: PX,
    height: 1.64,
    onReady: redraw,
    timeline: (c) => ({ seed, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T.tapeOut[0], 'listening'], [T.stitch[0] + 0.3, 'bored'], [T.form[0] + 0.2, 'surprised'], [T.deliver[0] + 0.2, 'excited'], [T.deliver[1] + 0.3, 'happy'], [T.reset[0] + 0.1, 'neutral']], L) }),
    pose: (p, c) => {
      /* faces the table / the bench (screen left) */
      to(p, 'headTurn', -0.4, 1)
      to(p, 'lookX', -0.7, 1)
      /* waits: weight foot to foot, glances at the machine / the rig */
      const wait = win(c, T.stitch[0] + 0.3, T.form[0], 0.3)
      p.stance = lerp(p.stance, Math.sin(c * 2.2) * 0.6, wait)
      to(p, 'lookY', 0.3, wait)
      if (laptopHeld) {
        to(p, 'shoulderL', 14, 1)
        to(p, 'elbowL', 86, 1)
        to(p, 'shoulderR', 14, 1)
        to(p, 'elbowR', 86, 1)
        to(p, 'elbowL', 96 + 6 * Math.sin(c * 26), win(c, T.tapeOut[0], T.tapeOut[0] + 0.3, 0.1))
        return
      }
      /* stands still for the tape: arms a little out from the body */
      const meas = win(c, T.tapeOut[0], T.tapeIn[1], 0.2)
      to(p, 'shoulderL', 24, meas)
      to(p, 'shoulderR', 24, meas)
      /* holds the finished shirt up */
      const hold = win(c, T.deliver[0] + 0.2, T.reset[0] + 0.15, 0.2)
      to(p, 'shoulderL', 22, hold)
      to(p, 'elbowL', 118, hold)
      to(p, 'shoulderR', 22, hold)
      to(p, 'elbowR', 118, hold)
    },
  })
}

/* ------------------------------------------------------------------ EVERYDAY: the tailor's shop */

function setupE(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F4EEE6')
  frame(camera)
  lightRig(scene, [0.2, 0.8, -0.3])
  const planks = canvasTex(256, 256, (g) => {
    g.fillStyle = '#D9B98F'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#D3B185' : '#DDBF97'
      g.fillRect(0, i * 32, 256, 30)
      g.fillStyle = '#C49E72'
      g.fillRect(0, i * 32 + 30, 256, 2)
      g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 30)
    }
  }, [5, 4])
  room(scene, { floor: mat('#ffffff', { map: planks, roughness: 0.8 }), back: mat('#F3E7D8', { roughness: 0.95 }), side: mat('#EFE2D0', { roughness: 0.95 }) })
  /* a wainscot rail on the back wall */
  scene.add(box(10, 0.06, 0.04, mat('#E2D2BC'), [0, 1.0, -1.72]))

  /* the rack: two chrome uprights on feet, a rail, three shirts on hangers */
  const chrome = mat('#C9D3E6', { metalness: 0.75, roughness: 0.28 })
  const rack = new THREE.Group()
  rack.position.set(...P.rack)
  for (const x of [-0.56, 0.56]) {
    rack.add(box(0.035, 1.72, 0.035, chrome, [x, 0.86, 0]))
    rack.add(box(0.04, 0.035, 0.46, chrome, [x, 0.03, 0]))
  }
  const rail = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.2, 16), chrome, [0, 1.7, 0])
  rail.rotation.z = Math.PI / 2
  rack.add(rail)
  const slotX = [-0.36, 0, 0.36]
  const colors = [C.sky, '#F3F6FC', C.brand]
  for (let i = 0; i < 3; i++) {
    const hg = hanger()
    hg.position.set(slotX[i], 1.7, 0.02)
    rack.add(hg)
    if (i === 2) continue
    const s = shirt(colors[i], 0.78, i === 1 ? C.sky : '#FFFFFF')
    s.position.set(slotX[i], 1.63, 0.02)
    rack.add(s)
  }
  scene.add(rack)
  /* the shirt he takes (the rack's third), on its own so it can travel; and its twin that returns to the rail at the
     loop's end (the rack is restocked) */
  const taken = shirt(C.brand, 0.78, '#FFFFFF')
  const restock = shirt(C.brand, 0.78, '#FFFFFF')
  setOpacity(restock, 0)
  scene.add(taken, restock)
  const slot: V3 = [P.rack[0] + slotX[2], 1.64, P.rack[2] + 0.02]

  /* the shopping bag in his screen-right hand, a folded shirt peeking out once it is in */
  const bag = new THREE.Group()
  const bagM = mat(C.brand, { roughness: 0.7 })
  bag.add(box(0.3, 0.34, 0.12, bagM, [0, -0.17, 0], 0.01))
  bag.add(box(0.3, 0.035, 0.122, mat('#FFFFFF'), [0, -0.03, 0]))
  const handle = mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 24, Math.PI), mat('#FFFFFF'), [0, 0, 0.04])
  bag.add(handle)
  const peek = box(0.22, 0.06, 0.08, fadeable(mat(C.brand, { roughness: 0.75 })), [0, 0.0, 0])
  ;((peek.material as THREE.MeshStandardMaterial).color as THREE.Color).set('#3D73FF')
  bag.add(peek)
  scene.add(bag)

  /* the work table, the fabric bolt, the sewing machine, the fabric piece under the needle */
  const table = new THREE.Group()
  table.position.set(...P.table)
  const wood = mat(C.wood, { roughness: 0.55 })
  table.add(box(TABLE.w, 0.06, TABLE.d, wood, [0, TABLE.h - 0.03, 0], 0.01))
  table.add(box(TABLE.w - 0.06, TABLE.h - 0.06, TABLE.d - 0.08, mat(C.woodDark, { roughness: 0.7 }), [0, (TABLE.h - 0.06) / 2, 0], 0.01))
  table.add(box(TABLE.w - 0.2, 0.16, 0.02, mat('#B58658', { roughness: 0.6 }), [0, TABLE.h - 0.2, TABLE.d / 2 - 0.035]))
  scene.add(table)
  const top = P.table[1] + TABLE.h
  /* the fabric bolt at the table's left end */
  const bolt = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 28), mat('#3D73FF', { roughness: 0.8 }), [P.table[0] - 0.42, top + 0.075, P.table[2] - 0.05])
  bolt.rotation.x = Math.PI / 2
  scene.add(bolt)
  scene.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.54, 12), mat('#E2D2BC'), [P.table[0] - 0.42, top + 0.075, P.table[2] - 0.05]).rotateX(Math.PI / 2))

  /* the sewing machine (cream body, blue trim): base, pillar, arm, head with the needle, handwheel, spool */
  const mc = new THREE.Group()
  mc.position.set(P.table[0] + 0.12, top, P.table[2] - 0.08)
  const body = mat('#F7F4EE', { roughness: 0.35 })
  const trim = mat(C.brand, { roughness: 0.45 })
  mc.add(box(0.56, 0.06, 0.26, body, [0, 0.03, 0], 0.015))
  mc.add(box(0.12, 0.3, 0.19, body, [0.2, 0.21, 0], 0.02))
  mc.add(box(0.5, 0.11, 0.17, body, [-0.01, 0.36, 0], 0.025))
  mc.add(box(0.5, 0.025, 0.172, trim, [-0.01, 0.32, 0]))
  mc.add(box(0.1, 0.13, 0.16, body, [-0.2, 0.27, 0], 0.02))
  const needle = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), mat('#9AA6BD', { metalness: 0.8, roughness: 0.25 }), [-0.2, 0.17, 0.02])
  mc.add(needle)
  const lamp = new THREE.MeshStandardMaterial({ color: '#FFF6D6', emissive: new THREE.Color('#FFD873'), emissiveIntensity: 0, roughness: 0.4 })
  mc.add(mesh(new THREE.BoxGeometry(0.06, 0.012, 0.06), lamp, [-0.2, 0.2, 0.06]))
  const wheel = new THREE.Group()
  wheel.position.set(0.29, 0.34, 0)
  const wm = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 28), trim, [0, 0, 0])
  wm.rotation.z = Math.PI / 2
  wheel.add(wm)
  const spoke = box(0.04, 0.13, 0.02, body, [0.02, 0, 0])
  wheel.add(spoke)
  mc.add(wheel)
  const spool = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 18), mat(C.orange, { roughness: 0.7 }), [0.06, 0.45, 0])
  mc.add(spool)
  scene.add(mc)
  const needleX = mc.position.x - 0.2
  /* the fabric piece: slides under the needle while stitched; a row of stitches appears behind the needle */
  const fabric = new THREE.Group()
  const fabM = fadeable(mat('#3D73FF', { roughness: 0.85 }))
  fabric.add(box(0.5, 0.012, 0.3, fabM, [0, 0, 0]))
  const stitches: THREE.Mesh[] = []
  for (let i = 0; i < 12; i++) {
    const s = box(0.024, 0.005, 0.008, fadeable(mat('#FFFFFF')), [-0.22 + i * 0.04, 0.009, 0.06])
    fabric.add(s)
    stitches.push(s)
  }
  scene.add(fabric)
  /* the finished, fitted shirt (navy with a white collar), which forms from the fabric and travels to her */
  const made = shirt('#2350D8', 1, '#FFFFFF')
  scene.add(made)

  /* the tape the tailor stretches to her shoulder (a yellow ribbon with tick marks) */
  const tapeTex = canvasTex(32, 256, (g) => {
    g.fillStyle = C.gold
    g.fillRect(0, 0, 32, 256)
    g.fillStyle = '#7A5A10'
    for (let y = 0; y < 256; y += 16) g.fillRect(0, y, y % 64 ? 8 : 16, 2)
  }, [1, 3])
  const tape = mesh(new THREE.BoxGeometry(0.006, 0.042, 1), new THREE.MeshStandardMaterial({ map: tapeTex, roughness: 0.6 }))
  tape.castShadow = false
  scene.add(tape)

  /* the people */
  const a = personA(cfgA, 1301, redraw, false)
  a.object.position.set(...P.a)
  const b = personB(cfgB, 1302, redraw, false)
  b.object.position.set(...P.b)
  const tailor = rigSprite({
    config: cfgTailor,
    dress: (k) => ({ ...k, top: <>{k.top}{WAISTCOAT}{TAPE}</> }),
    loop: L,
    frames: FR,
    px: PX,
    height: 1.74,
    onReady: redraw,
    timeline: (c) => ({ seed: 1303, idle: CAST_IDLE, ...faceAt(c, [[0, 'neutral'], [T.tapeOut[0], 'thinking'], [T.stitch[0], 'thinking'], [T.show[0], 'proud'], [T.deliver[1], 'happy'], [T.reset[0], 'neutral']], L) }),
    pose: (p, c) => {
      /* measures: the screen-right arm stretches the tape toward her shoulder, eyes on the tape */
      const meas = win(c, T.tapeOut[0], T.tapeIn[1], 0.2)
      to(p, 'shoulderR', 62, meas)
      to(p, 'elbowR', 22, meas)
      to(p, 'headTurn', 0.5, meas)
      to(p, 'lookX', 0.85, meas)
      /* stitches: both hands forward on the fabric, looking down at the needle (screen right of him) */
      const work = win(c, T.turn[0], T.form[0], 0.25)
      to(p, 'shoulderL', 20 + 2 * Math.sin(c * 5), work)
      to(p, 'elbowL', 70, work)
      to(p, 'shoulderR', 20 + 2 * Math.sin(c * 5 + 1), work)
      to(p, 'elbowR', 70, work)
      to(p, 'lookY', 0.75, work)
      to(p, 'headNod', 0.3, work)
      to(p, 'lookX', -0.25, work)
      /* shows the finished shirt, then hands it toward her */
      const show = win(c, T.show[0], T.deliver[1], 0.2)
      to(p, 'shoulderL', 26, show)
      to(p, 'elbowL', 112, show)
      to(p, 'shoulderR', 26, show)
      to(p, 'elbowR', 112, show)
      to(p, 'headTurn', 0.35, win(c, T.deliver[0], T.reset[0], 0.25))
      to(p, 'lookX', 0.7, win(c, T.deliver[0], T.reset[0], 0.25))
    },
  })
  tailor.object.position.set(...P.tailor)
  scene.add(a.object, b.object, tailor.object)

  /* where things are held (in front of each person's chest) */
  const heldA: V3 = [P.a[0], 1.16, P.a[2] + 0.2]
  const heldB: V3 = [P.b[0], 1.13, P.b[2] + 0.2]
  const bagAt: V3 = [P.a[0] + 0.29, 0.86, P.a[2] + 0.12]
  const showAt: V3 = [P.tailor[0], 1.36, P.table[2] + TABLE.d / 2 - 0.05]
  const fabricFrom: V3 = [needleX + 0.2, top + 0.006, mc.position.z + 0.12]
  const fabricTo: V3 = [needleX - 0.2, top + 0.006, mc.position.z + 0.12]
  const tapeFrom: V3 = [P.tailor[0] + 0.42, 1.22, P.tailor[2] + 0.2]
  const tapeTo: V3 = [P.b[0] - 0.2, 1.3, P.b[2] + 0.04]

  return (t) => {
    const c = loopT(t)
    /* left: the shirt leaves the rack, is held up, folds into the bag; a restocked twin fades onto the rail */
    const fly = segOf(c, T.fly)
    const into = segOf(c, T.bag)
    let pos: V3 = slot
    if (c >= T.fly[0]) pos = arc(slot, heldA, fly, -0.08)
    if (c >= T.bag[0]) pos = lerp3(heldA, [bagAt[0], bagAt[1] + 0.02, bagAt[2]], into)
    taken.position.set(...pos)
    const k = 1 - 0.75 * into
    taken.scale.set(k, k * (1 - 0.3 * into), 1)
    taken.visible = c < T.bag[1] - 0.02
    const rs = segOf(c, T.reset)
    setOpacity(restock, rs)
    restock.position.set(...slot)
    /* the bag swings gently from the hand; the folded shirt peeks out from the moment it goes in until the reset */
    bag.position.set(bagAt[0], bagAt[1] + 0.02 * Math.sin(c * Math.PI * 0.75), bagAt[2])
    bag.rotation.z = 0.05 * Math.sin((c / L) * Math.PI * 6)
    setOpacity(peek, seg(c, T.bag[1] - 0.15, T.bag[1]) * (1 - rs))
    /* right: the tape runs out to her shoulder and back */
    const tk = segOf(c, T.tapeOut) * (1 - segOf(c, T.tapeIn))
    tape.visible = tk > 0.01
    stretch(tape, tapeFrom, tapeTo, tk)
    tape.position.y += 0.004 * Math.sin(c * 9)
    /* the machine runs while stitching: needle bobs, handwheel turns, lamp on, fabric slides, stitches appear */
    const run = win(c, T.stitch[0], T.stitch[1], 0.12)
    const sp = segOf(c, T.stitch)
    needle.position.y = 0.17 - 0.028 * run * (0.5 + 0.5 * Math.sin(c * 42))
    wheel.rotation.x = -c * 9 * run - sp * 6
    lamp.emissiveIntensity = 1.1 * run
    const formK = segOf(c, T.form)
    fabric.position.set(...lerp3(fabricFrom, fabricTo, sp))
    stitches.forEach((s, i) => (s.visible = sp > (11 - i) / 12 - 0.02 && c > T.stitch[0]))
    /* the fabric becomes the shirt: fabric fades as the shirt rises and grows; back on the table at the reset */
    setOpacity(fabric, (1 - formK) * (c < T.reset[0] ? 1 : 0) + rs * (c >= T.reset[0] ? 1 : 0))
    if (c >= T.reset[0]) fabric.position.set(...fabricFrom)
    const show = segOf(c, T.show)
    const del = segOf(c, T.deliver)
    let mp: V3 = lerp3([fabricTo[0], top + 0.08, fabricTo[2]], showAt, show)
    if (c >= T.deliver[0]) mp = arc(showAt, heldB, del, 0.16)
    made.position.set(...mp)
    const ms = Math.max(0.05, formK)
    made.scale.set(ms, ms, 1)
    made.rotation.y = c < T.deliver[0] ? (1 - show) * Math.PI * 0.5 : 0
    setOpacity(made, formK * (1 - rs))
    a.update(c, camera)
    b.update(c, camera)
    tailor.update(c, camera)
  }
}

/* ------------------------------------------------------------------ CONCEPT: the same places, cloud side */

/** a photo card (sky, sun, hills: no text) */
const photoTex = () =>
  canvasTex(160, 120, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 120)
    grd.addColorStop(0, '#9EC5FF')
    grd.addColorStop(1, '#E6F0FF')
    g.fillStyle = grd
    g.fillRect(0, 0, 160, 120)
    g.fillStyle = '#FFC94A'
    g.beginPath()
    g.arc(118, 34, 15, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#2D63FB'
    g.beginPath()
    g.moveTo(0, 120)
    g.lineTo(52, 54)
    g.lineTo(96, 120)
    g.fill()
    g.fillStyle = '#16A34A'
    g.beginPath()
    g.moveTo(54, 120)
    g.lineTo(108, 70)
    g.lineTo(160, 120)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 8
    g.strokeRect(0, 0, 160, 120)
  })
/** a label tag: a check disc and two skeleton lines (no words) */
const tagTex = () =>
  canvasTex(160, 90, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 160, 90)
    g.fillStyle = C.green
    g.beginPath()
    g.arc(36, 45, 22, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 6
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(26, 46)
    g.lineTo(34, 54)
    g.lineTo(48, 37)
    g.stroke()
    g.fillStyle = '#C9D3E6'
    g.fillRect(70, 32, 70, 9)
    g.fillRect(70, 50, 48, 9)
    g.strokeStyle = C.brand
    g.lineWidth = 6
    g.strokeRect(3, 3, 154, 84)
  })

function setupC(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF2FA')
  frame(camera)
  lightRig(scene, [0.2, 0.8, -0.3])
  const tiles = canvasTex(256, 256, (g) => {
    g.fillStyle = '#E3E9F3'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = '#D3DBE9'
    g.lineWidth = 3
    for (let i = 0; i <= 4; i++) {
      g.beginPath()
      g.moveTo(0, i * 64)
      g.lineTo(256, i * 64)
      g.moveTo(i * 64, 0)
      g.lineTo(i * 64, 256)
      g.stroke()
    }
  }, [6, 4])
  room(scene, { floor: mat('#ffffff', { map: tiles, roughness: 0.85 }), back: mat('#EAF0FA', { roughness: 0.95 }), side: mat('#E4EBF7', { roughness: 0.95 }) })
  scene.add(box(10, 0.06, 0.04, mat('#D5DEEE'), [0, 1.0, -1.72]))

  /* LEFT (the rack's place): the pre-built API box: a ready model behind an intake slot and an output tray */
  const api = new THREE.Group()
  api.position.set(P.rack[0], 0, P.rack[2])
  api.add(box(0.88, 0.12, 0.62, mat('#D5DEEE', { roughness: 0.5 }), [0, 0.06, 0], 0.02))
  const shell = mat(C.brand, { roughness: 0.38, metalness: 0.1 })
  api.add(box(0.8, 1.36, 0.56, shell, [0, 0.8, 0], 0.06))
  api.add(box(0.64, 1.12, 0.02, mat('#FFFFFF', { roughness: 0.35 }), [0, 0.82, 0.285], 0.012))
  /* the intake slot near the top, the output tray near the bottom */
  api.add(box(0.4, 0.05, 0.04, mat(C.navy, { roughness: 0.5 }), [0, 1.24, 0.29]))
  api.add(box(0.4, 0.04, 0.16, mat('#C9D3E6', { roughness: 0.4 }), [0, 0.36, 0.36], 0.01))
  /* the model's lens: a ready, trained eye that looks at what comes in */
  const lensRing = mesh(new THREE.TorusGeometry(0.17, 0.025, 16, 40), mat('#C9D3E6', { metalness: 0.6, roughness: 0.25 }), [0, 0.82, 0.3])
  api.add(lensRing)
  api.add(mesh(new THREE.CircleGeometry(0.16, 40), mat('#FFFFFF'), [0, 0.82, 0.296]))
  const irisM = new THREE.MeshStandardMaterial({ color: C.brand, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25, roughness: 0.3 })
  const iris = mesh(new THREE.CircleGeometry(0.095, 40), irisM, [0, 0.82, 0.299])
  api.add(iris)
  const pupil = mesh(new THREE.CircleGeometry(0.045, 32), mat(C.navy, { roughness: 0.2 }), [0, 0.82, 0.302])
  api.add(pupil)
  api.add(mesh(new THREE.CircleGeometry(0.016, 16), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), [0.03, 0.85, 0.304]))
  /* a status light strip that turns green as the answer comes out */
  const ledM = new THREE.MeshStandardMaterial({ color: '#E3E9F3', emissive: new THREE.Color(C.green), emissiveIntensity: 0, roughness: 0.4 })
  api.add(box(0.5, 0.03, 0.02, ledM, [0, 0.52, 0.296], 0.008))
  scene.add(api)
  const slotIn: V3 = [P.rack[0], 1.25, P.rack[2] + 0.34]
  const trayOut: V3 = [P.rack[0], 0.45, P.rack[2] + 0.42]

  const photo = mesh(new THREE.BoxGeometry(0.3, 0.225, 0.01), [mat('#FFFFFF'), mat('#FFFFFF'), mat('#FFFFFF'), mat('#FFFFFF'), new THREE.MeshStandardMaterial({ map: photoTex(), roughness: 0.5 }), mat('#FFFFFF')].map(fadeable) as THREE.Material[])
  const tag = mesh(new THREE.BoxGeometry(0.28, 0.16, 0.012), [mat('#FFFFFF'), mat('#FFFFFF'), mat('#FFFFFF'), mat('#FFFFFF'), new THREE.MeshStandardMaterial({ map: tagTex(), roughness: 0.45 }), mat('#FFFFFF')].map(fadeable) as THREE.Material[])
  scene.add(photo, tag)

  /* RIGHT (the tailor's table): the ML platform's bench: a data tray, the training rig with its progress ring, a
     tuning dial; the custom model rises from the rig and goes to her */
  const desk = new THREE.Group()
  desk.position.set(...P.table)
  desk.add(box(TABLE.w, 0.05, TABLE.d, mat('#FFFFFF', { roughness: 0.35 }), [0, TABLE.h - 0.025, 0], 0.01))
  for (const x of [-TABLE.w / 2 + 0.06, TABLE.w / 2 - 0.06]) for (const z of [-TABLE.d / 2 + 0.06, TABLE.d / 2 - 0.06]) desk.add(box(0.04, TABLE.h - 0.05, 0.04, mat('#9AA6BD', { metalness: 0.6, roughness: 0.3 }), [x, (TABLE.h - 0.05) / 2, z]))
  desk.add(box(TABLE.w - 0.12, 0.1, 0.03, mat(C.brandSoft, { roughness: 0.5 }), [0, TABLE.h - 0.1, TABLE.d / 2 - 0.05]))
  scene.add(desk)
  const top = TABLE.h
  /* the data tray (the bolt's place) */
  const trayC: V3 = [P.table[0] - 0.38, top, P.table[2] + 0.02]
  scene.add(box(0.32, 0.04, 0.32, mat('#C9D3E6', { roughness: 0.4 }), [trayC[0], top + 0.02, trayC[2]], 0.01))
  /* the training rig (the sewing machine's place): a tower with two fans and a progress ring */
  const rigX = P.table[0] + 0.12
  const rigZ = P.table[2] - 0.08
  const rig = new THREE.Group()
  rig.position.set(rigX, top, rigZ)
  rig.add(box(0.46, 0.62, 0.34, mat(C.navy, { roughness: 0.4, metalness: 0.2 }), [0, 0.31, 0], 0.03))
  rig.add(box(0.4, 0.56, 0.01, mat('#2A3A76', { roughness: 0.35 }), [0, 0.31, 0.172], 0.01))
  const fans: THREE.Group[] = []
  for (const y of [0.17, 0.39]) {
    const f = new THREE.Group()
    f.position.set(-0.08, y, 0.18)
    f.add(mesh(new THREE.TorusGeometry(0.075, 0.01, 10, 32), mat('#9AA6BD', { metalness: 0.6, roughness: 0.3 })))
    for (let i = 0; i < 5; i++) {
      const blade = box(0.06, 0.022, 0.006, mat(C.sky, { roughness: 0.4 }), [0.035, 0, 0])
      const piv = new THREE.Group()
      piv.rotation.z = (i / 5) * Math.PI * 2
      blade.rotation.x = 0.4
      piv.add(blade)
      f.add(piv)
    }
    f.add(mesh(new THREE.CircleGeometry(0.018, 16), mat('#FFFFFF')))
    rig.add(f)
    fans.push(f)
  }
  /* the progress ring (training): fills while the data is consumed */
  const ringBack = mesh(new THREE.RingGeometry(0.075, 0.1, 48), mat('#3B4C8C', { roughness: 0.5 }), [0.11, 0.42, 0.178])
  rig.add(ringBack)
  const ringGeo = new THREE.RingGeometry(0.075, 0.1, 64, 1, Math.PI / 2, Math.PI * 2)
  const ringM = new THREE.MeshStandardMaterial({ color: C.green, emissive: new THREE.Color(C.green), emissiveIntensity: 0.6, roughness: 0.4, side: THREE.DoubleSide })
  const ring = mesh(ringGeo, ringM, [0.11, 0.42, 0.18])
  ring.scale.x = -1
  rig.add(ring)
  const ringTotal = ringGeo.index!.count
  /* the rig's mouth: data blocks enter it from the top */
  rig.add(box(0.2, 0.02, 0.12, mat('#11193A'), [0, 0.625, 0]))
  scene.add(rig)
  /* the tuning dial (right end of the bench): a knob on a ring of ticks, and a small meter whose bars rise */
  const dial = new THREE.Group()
  dial.position.set(P.table[0] + 0.4, top, P.table[2] + 0.14)
  dial.scale.setScalar(1.45)
  dial.add(mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 32), mat('#FFFFFF', { roughness: 0.4 }), [0, 0.015, 0]))
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.75 + (i / 8) * Math.PI * 1.5
    dial.add(box(0.008, 0.006, 0.026, mat(C.steel), [Math.sin(a) * 0.095, 0.033, -Math.cos(a) * 0.095]).rotateY(-a))
  }
  const knob = new THREE.Group()
  knob.position.y = 0.03
  knob.add(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 28), mat(C.brand, { roughness: 0.35 }), [0, 0.03, 0]))
  knob.add(box(0.012, 0.012, 0.05, mat('#FFFFFF'), [0, 0.065, -0.025]))
  dial.add(knob)
  scene.add(dial)

  /* her data blocks (measurements ↔ data): four cubes that leave her laptop for the tray, then go into the rig */
  const cubeCols = [C.brand, C.sky, '#5B8CFF', C.orange]
  const cubes = cubeCols.map((col) => {
    const m = box(0.1, 0.1, 0.1, fadeable(mat(col, { roughness: 0.35 })), [0, 0, 0], 0.015)
    scene.add(m)
    return m
  })
  const trayAt = (i: number): V3 => [trayC[0] + (i % 2 ? 0.065 : -0.065), top + 0.1, trayC[2] + (i < 2 ? -0.065 : 0.065)]
  /* the custom model: a faceted crystal that rises from the rig and is delivered */
  const model = new THREE.Group()
  const gemM = fadeable(new THREE.MeshStandardMaterial({ color: '#4C7BFF', emissive: new THREE.Color(C.brand), emissiveIntensity: 0.35, roughness: 0.18, metalness: 0.1, flatShading: true }))
  model.add(mesh(new THREE.IcosahedronGeometry(0.11, 0), gemM))
  const halo = mesh(new THREE.TorusGeometry(0.16, 0.008, 8, 48), fadeable(new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color(C.sky), emissiveIntensity: 0.8 })))
  model.add(halo)
  scene.add(model)

  /* the people, each with a laptop held open */
  const ua = personA(cfgUA, 1311, redraw, true)
  ua.object.position.set(...P.a)
  const ub = personB(cfgUB, 1312, redraw, true)
  ub.object.position.set(...P.b)
  scene.add(ua.object, ub.object)
  const lapA = laptop()
  lapA.g.position.set(P.a[0], 0.86, P.a[2] + 0.22)
  const lapB = laptop()
  lapB.g.position.set(P.b[0], 0.84, P.b[2] + 0.22)
  scene.add(lapA.g, lapB.g)
  const fromA: V3 = [P.a[0], 1.12, P.a[2] + 0.36]
  const heldA: V3 = [P.a[0], 1.17, P.a[2] + 0.38]
  const fromB: V3 = [P.b[0], 1.1, P.b[2] + 0.36]
  const heldB: V3 = [P.b[0], 1.16, P.b[2] + 0.4]
  const rigTop: V3 = [rigX, top + 0.66, rigZ]

  return (t) => {
    const c = loopT(t)
    const rs = segOf(c, T.reset)
    /* left: the photo rises from his laptop and flies into the slot; the box looks, lights green, the tag comes out
       of the tray to him; he holds it up, then it goes into his laptop */
    const send = seg(c, T.reach[0], T.fly[1] - 0.12)
    photo.visible = c > T.reach[0] && c < T.fly[1] - 0.1
    photo.position.set(...arc(fromA, slotIn, send, 0.3))
    photo.scale.setScalar(1 - 0.35 * seg(c, T.fly[1] - 0.3, T.fly[1] - 0.12))
    const look = win(c, T.fly[0], T.hold[0] + 0.1, 0.15)
    iris.position.x = 0.025 * Math.sin(c * 9) * look
    pupil.position.x = iris.position.x
    irisM.emissiveIntensity = 0.25 + 0.6 * look
    const out = seg(c, T.fly[1] - 0.1, T.hold[0] + 0.25)
    ledM.emissiveIntensity = 1.1 * win(c, T.fly[1] - 0.1, T.bag[1], 0.2)
    let tp: V3 = arc(trayOut, heldA, out, 0.18)
    if (c >= T.bag[0]) tp = lerp3(heldA, [fromA[0], fromA[1] - 0.06, fromA[2] - 0.05], segOf(c, T.bag))
    tag.position.set(...tp)
    tag.position.y += c > T.hold[0] + 0.25 && c < T.bag[0] ? 0.012 * Math.sin(c * 5) : 0
    tag.scale.setScalar(Math.max(0.05, Math.min(1, out * 1.5) * (1 - 0.8 * segOf(c, T.bag))))
    tag.visible = c > T.fly[1] - 0.1 && c < T.bag[1] - 0.02
    lapA.glow.emissiveIntensity = 0.35 + 0.8 * (win(c, T.reach[0], T.reach[0] + 0.3, 0.1) + win(c, T.bag[1] - 0.2, T.bag[1] + 0.2, 0.1))
    /* right: the four cubes go up from her laptop onto the tray (measurements), then one by one into the rig */
    cubes.forEach((m, i) => {
      const o0 = T.tapeOut[0] + i * 0.32
      const up = seg(c, o0, o0 + 0.55)
      const i0 = T.stitch[0] + i * 0.62
      const inn = seg(c, i0, i0 + 0.55)
      let p: V3 = fromB
      if (c >= o0) p = arc(fromB, trayAt(i), up, 0.32)
      if (c >= i0) p = arc(trayAt(i), rigTop, inn, 0.28)
      m.position.set(...p)
      m.rotation.set(c * 1.3 + i, c * 1.7 + i * 0.5, 0)
      const vis = seg(c, o0, o0 + 0.15) * (1 - seg(c, i0 + 0.4, i0 + 0.55))
      setOpacity(m, vis)
    })
    lapB.glow.emissiveIntensity = 0.35 + 0.8 * win(c, T.tapeOut[0], T.tapeIn[0], 0.15)
    /* training: fans spin, the ring fills; it empties at the reset */
    const run = win(c, T.stitch[0], T.stitch[1], 0.15)
    fans.forEach((f, i) => (f.rotation.z = -(c * (6 + 16 * run)) - i))
    const fill = segOf(c, T.stitch) * (1 - rs)
    ringGeo.setDrawRange(0, (ringTotal / 64) * Math.round(fill * 64))
    ringM.emissiveIntensity = 0.5 + 0.4 * run * (0.5 + 0.5 * Math.sin(c * 6))
    /* tuning: the knob turns one way and back, settling */
    const tune = win(c, T.form[0], T.show[1], 0.15)
    knob.rotation.y = tune * 0.9 * Math.sin((c - T.form[0]) * 7) * Math.exp(-(c - T.form[0]) * 1.6)
    /* the model rises from the rig, spins, then is delivered to her */
    const rise = segOf(c, T.show)
    const del = segOf(c, T.deliver)
    let mp: V3 = lerp3([rigTop[0], rigTop[1] - 0.05, rigTop[2]], [rigTop[0], rigTop[1] + 0.32, rigTop[2] + 0.18], rise)
    if (c >= T.deliver[0]) mp = arc([rigTop[0], rigTop[1] + 0.32, rigTop[2] + 0.18], heldB, del, 0.06)
    model.position.set(...mp)
    model.position.y += c > T.deliver[1] ? 0.015 * Math.sin(c * 4) : 0
    model.rotation.y = c * 1.6
    halo.rotation.x = Math.PI / 2 + 0.3 * Math.sin(c * 2)
    const vis = seg(c, T.show[0], T.show[0] + 0.25) * (1 - rs)
    setOpacity(model, vis)
    model.scale.setScalar(Math.max(0.05, vis))
    ua.update(c, camera)
    ub.update(c, camera)
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
/* the analogy plays from the moment the slide shows (props.steps 0): both cards on one clock, so each part of the
   everyday scene moves with its counterpart */
const Stage = ({ setup }: { setup: (k: StageKit) => Update }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={1} setup={setup} holdT={HOLD} />
  </div>
)
const T13Everyday = (_: Fig) => <Stage setup={setupE} />
const T13Concept = (_: Fig) => <Stage setup={setupC} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  J_T13Everyday: T13Everyday as (p: Record<string, unknown>) => ReactNode,
  J_T13Concept: T13Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
