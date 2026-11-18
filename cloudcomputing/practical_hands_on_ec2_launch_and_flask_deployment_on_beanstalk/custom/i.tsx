import { useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { colors } from '@/design/tokens'
import { Label } from '@/decks/figures/scene'
import { ThreeStage, lightRig, mesh, mat, castSprite, castClip, CAST_IDLE, CAST_PRESETS, type Pose, type StageKit, type Timeline } from './three-stage'

/**
 * BUILDER D · SESSION 9 ROUND 4 (user, 2026-11-10: "Replace the analogy with ..."), real-time 3D through the deck's
 * one shared renderer (`three-stage.tsx`), standing corrections 13-14: Character Lab people, no text except one small
 * tag above a visual, loops that run straight back into their start.
 *
 * Slide 21 (T09-AN): "A GPU is like a toll plaza with hundreds of open booths letting cars through at the same time,
 * instead of a single booth clearing vehicles one by one — just as thousands of GPU cores process data in parallel,
 * instead of a few CPU cores working through tasks largely in sequence."
 *   Everyday: a wide toll plaza (six booths in view, the plaza running on out of the card) where every barrier lifts
 *   together and every waiting car drives through at once; beside it a single booth with a queue that creeps forward
 *   one car per cycle. A Character Lab attendant in every booth: smiling and waving cars through on the plaza,
 *   worried and reaching for each payment at the single booth.
 *   Concept: a GPU board of 8 x 8 cores, a batch of data blocks landing on every core at once; a CPU chip of four
 *   cores fed one block at a time from a queue. Tags `GPU` / `CPU` above them (unchanged from round 3).
 * Slide 25 (T12-AN, concept card; the everyday card is in i2.tsx): "A vCPU is like a student working at a study table
 * and memory is the size of that table ..." Two server boards like the two study tables: on the left one memory stick
 * (two blocks) beside a hard disk: the vCPU works through the two, runs out, waits (orange) while the next block comes
 * up the cable from the spinning disk, then works again; on the right four sticks holding eight blocks, the vCPU
 * pulls one after another and never waits.
 *
 * Build (the analogy layout's one track): press 1 the first half (the plaza / GPU; the small memory), press 2 the
 * second (the single booth / CPU; the big memory), press 3 both. Held frames draw one frame with everything revealed.
 */

const SW = 470
const SH = 390

/* ------------------------------------------------------------------ shared helpers */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

const tiles = (a: string, b: string) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = a
      g.fillRect(0, 0, 128, 128)
      g.fillStyle = b
      g.fillRect(0, 0, 64, 64)
      g.fillRect(64, 64, 64, 64)
      g.fillStyle = 'rgba(0,0,0,0.06)'
      g.fillRect(0, 63, 128, 2)
      g.fillRect(63, 0, 2, 128)
    },
    [20, 20],
  )

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/**
 * Everything that never moves is built into a group and baked: one merged mesh per material, so a scene of desks,
 * shelves and racks costs a handful of draw calls instead of hundreds (smooth frame rate).
 */
function bake(g: THREE.Group): THREE.Group {
  g.updateMatrixWorld(true)
  const byMat = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean }>()
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    let geo = m.geometry.clone().applyMatrix4(m.matrixWorld)
    if (geo.index) geo = geo.toNonIndexed()
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k)
    const mt = m.material as THREE.Material
    const e = byMat.get(mt) ?? { geos: [], cast: false }
    e.geos.push(geo)
    e.cast = e.cast || m.castShadow
    byMat.set(mt, e)
  })
  const out = new THREE.Group()
  for (const [mt, e] of byMat) {
    const merged = mergeGeometries(e.geos, false)
    if (!merged) continue
    const mm = new THREE.Mesh(merged, mt)
    mm.castShadow = e.cast
    mm.receiveShadow = true
    out.add(mm)
  }
  return out
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}

/** a white room shell: floor, back wall, left wall */
function room(scene: THREE.Object3D, o: { w: number; d: number; h: number; floor: THREE.Material; wall?: string }) {
  const wall = mat(o.wall ?? '#F1F4FA', { roughness: 0.95 })
  /* the floor runs on past the camera's near edge and both sides, so no background shows under the room */
  const f = mesh(new THREE.BoxGeometry(o.w + 8, 0.1, o.d + 10), o.floor, [4, -0.05, 5])
  f.castShadow = false
  scene.add(f)
  const back = mesh(new THREE.BoxGeometry(o.w, o.h, 0.12), wall, [0, o.h / 2, -o.d / 2])
  back.castShadow = false
  scene.add(back)
  const left = mesh(new THREE.BoxGeometry(0.12, o.h, o.d), wall, [-o.w / 2, o.h / 2, 0])
  left.castShadow = false
  scene.add(left)
  /* skirting */
  const sk = mat('#C9D3E6')
  scene.add(box(o.w, 0.12, 0.04, sk, [0, 0.06, -o.d / 2 + 0.08]), box(0.04, 0.12, o.d, sk, [-o.w / 2 + 0.08, 0.06, 0]))
}

/** the per-slide stage: the canvas centred in its card, plus optional small tags above parts */
type Setup = Parameters<typeof ThreeStage>[0]['setup']
/** a small tag pinned above a 3D point: its screen position is projected through the scene's own camera */
type Pin = { text: string; at: [number, number, number] }
function Stage({ w = SW, h = SH, step, setup, holdT, pins = [] }: { w?: number; h?: number; step: number; setup: Setup; holdT?: number; pins?: Pin[] }) {
  const [xy, setXy] = useState<[number, number][]>([])
  const wrapped = useMemo<Setup>(
    () => (kit) => {
      const u = setup(kit)
      kit.camera.aspect = kit.w / kit.h
      kit.camera.updateProjectionMatrix()
      kit.camera.updateMatrixWorld()
      const pts = pins.map((p) => {
        const v = new THREE.Vector3(...p.at).project(kit.camera)
        return [((v.x + 1) / 2) * kit.w, ((1 - v.y) / 2) * kit.h] as [number, number]
      })
      queueMicrotask(() => setXy(pts))
      return u
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setup],
  )
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <ThreeStage w={w} h={h} step={step} setup={wrapped} holdT={holdT} />
      {pins.map((p, i) => (xy[i] ? <Tag key={p.text} x={xy[i][0]} y={xy[i][1]}>{p.text}</Tag> : null))}
    </div>
  )
}

/** a small tag above a visual (the only text the user allows on slide 21) */
const Tag = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
    <Label tone="brand" strong raised>
      {children}
    </Label>
  </div>
)

const P = CAST_PRESETS

/* ================================================================== SLIDE 21 · EVERYDAY: the toll plaza */

/* one toll cycle (s): barriers lift, every waiting car drives through, the next car rolls up; seamless */
const TOLL = 2.2
/* the booth line, and where a car waits: its nose 0.1 short of the barrier arm (the arm never comes down on it) */
const ZB = -0.6
const STOP = ZB + 1.0
/* the wide plaza's lanes (the leftmost runs out of the card: the plaza goes on) and the single booth's lane */
const WIDE = [-4.25, -3.4, -2.55, -1.7, -0.85, 0]
const ONE_X = 1.55
const LANE = 0.85
/* conveyor slots in driving order (z): off-card near the camera ... at the barrier ... behind the hedge */
const WIDE_SLOTS = [6.5, STOP, ZB - 1.7, -4.9]
const ONE_SLOTS = [6.5, STOP + 3.3, STOP + 2.2, STOP + 1.1, STOP, ZB - 1.7, -4.9]
const CAR_COLORS = ['#2D63FB', '#E5732A', '#16A34A', '#E2E8F5', '#7C5CFF', '#EF4444', '#F2A33A', '#0E9AA7', '#1F2E63', '#C2410C']

/** a small hatchback seen from behind: body, cabin with glass, wheels, tail lights; its front faces -z */
function car(color: string, glass: THREE.Material, tyre: THREE.Material, tail: THREE.Material) {
  const g = new THREE.Group()
  const paint = mat(color, { roughness: 0.35, metalness: 0.25 })
  g.add(box(0.56, 0.22, 1.0, paint, [0, 0.2, 0], 0.07))
  g.add(box(0.48, 0.2, 0.56, paint, [0, 0.4, 0.06], 0.08))
  g.add(box(0.5, 0.15, 0.5, glass, [0, 0.41, 0.06], 0.06))
  for (const [x, z] of [[-0.25, -0.32], [0.25, -0.32], [-0.25, 0.32], [0.25, 0.32]] as const) {
    const w = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), tyre, [x, 0.1, z])
    w.rotation.z = Math.PI / 2
    g.add(w)
  }
  g.add(box(0.12, 0.05, 0.02, tail, [-0.19, 0.26, 0.5]), box(0.12, 0.05, 0.02, tail, [0.19, 0.26, 0.5]))
  return g
}

/** a position along a conveyor of slots: integer = at a slot; the wrap from the last slot to the first is hidden */
function along(slots: number[], s: number) {
  const n = slots.length
  const k = ((s % n) + n) % n
  const i = Math.floor(k)
  if (i >= n - 1) return slots[n - 1]
  return mix(slots[i], slots[i + 1], k - i)
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k

/** a toll attendant's loop: a nod and a smile at the open plaza; a worried face and a reach at the single booth */
function attendantTimeline(seed: number, busy: boolean) {
  return (): Timeline => ({
    seed,
    idle: { ...CAST_IDLE, saccades: false },
    life: 0,
    expression: castClip(busy ? 'worried' : seed % 2 ? 'happy' : 'grin', -10, false),
    gesture: busy ? undefined : castClip('nod', 0.15 * TOLL),
  })
}
function attendantPose(busy: boolean, side: 1 | -1) {
  return (p: Pose, t: number) => {
    const ph = (t % TOLL) / TOLL
    if (busy) {
      /* takes the payment through the window, hands the change back, then the next car */
      const r = Math.sin(clamp01(ph / 0.3) * Math.PI)
      if (side < 0) {
        p.shoulderL = 18 + r * 62
        p.elbowL = 40 - r * 20
      } else {
        p.shoulderR = 18 + r * 62
        p.elbowR = 40 - r * 20
      }
      p.headTurn = -0.25 * side * r
      p.lookX = -0.6 * side * r
      p.browInnerL = 0.4
      p.browInnerR = 0.4
    } else {
      /* waves the car through as the barrier lifts */
      const r = Math.sin(clamp01((ph - 0.12) / 0.4) * Math.PI)
      if (side < 0) {
        p.shoulderL = 14 + r * 48
        p.elbowL = 20 + r * 30
      } else {
        p.shoulderR = 14 + r * 48
        p.elbowR = 20 + r * 30
      }
    }
  }
}

function setupToll(kit: StageKit) {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#D9E8FF')
  camera.fov = 40
  camera.position.set(-0.55, 3.7, 5.3)
  camera.lookAt(-0.55, 0.3, -0.75)
  lightRig(scene, [-1, 0, -1])
  const St = new THREE.Group()
  /* ground: grass all round, asphalt under the plaza and the single booth's road, a grass median between them */
  const grass = mat('#9DCB7C', { roughness: 0.95 })
  const asphalt = mat('#59606E', { roughness: 0.9 })
  const g0 = mesh(new THREE.BoxGeometry(30, 0.1, 30), grass, [0, -0.06, -2])
  g0.castShadow = false
  St.add(g0)
  const wideL = WIDE[0] - LANE / 2 - 1.2
  const wideR = WIDE[WIDE.length - 1] + LANE / 2
  St.add(box(wideR - wideL, 0.02, 14, asphalt, [(wideL + wideR) / 2, 0.0, -1.5]))
  St.add(box(LANE + 0.2, 0.02, 14, asphalt, [ONE_X, 0.0, -1.5]))
  /* lane lines: dashed white between the plaza's lanes, solid edges */
  const white = mat('#F4F6FA', { roughness: 0.6 })
  const yellow = mat('#F2C230', { roughness: 0.6 })
  for (let i = 0; i < WIDE.length; i++) {
    const x = WIDE[i] - LANE / 2
    for (let z = 3.2; z > -4.6; z -= 0.7) if (z > ZB + 0.6 || z < ZB - 0.6) St.add(box(0.04, 0.012, 0.36, white, [x, 0.017, z]))
  }
  St.add(box(0.05, 0.012, 14, yellow, [wideR - 0.04, 0.017, -1.5]), box(0.05, 0.012, 14, yellow, [ONE_X - LANE / 2 + 0.04, 0.017, -1.5]), box(0.05, 0.012, 14, yellow, [ONE_X + LANE / 2 - 0.04, 0.017, -1.5]))
  /* far side: a hedge and trees the cars drive away behind */
  const hedge = mat('#5E9E52', { roughness: 0.95 })
  St.add(box(22, 0.8, 0.5, hedge, [-1, 0.4, -4.3], 0.15))
  const trunk = mat('#8A6440')
  const leaf = mat('#4E8F48', { roughness: 0.9 })
  for (const x of [-6.2, -4.4, -2.6, -0.8, 1.0, 2.8, 4.6]) {
    St.add(box(0.12, 0.6, 0.12, trunk, [x, 0.3, -5.2]))
    St.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), leaf, [x, 1.05, -5.2]))
  }

  /* booths: a kiosk on each island (lower wall, glass, roof), a canopy over the whole plaza */
  const kioskM = mat('#F7F9FC', { roughness: 0.5 })
  const trim = mat(colors.brand, { roughness: 0.5 })
  const glassM = new THREE.MeshStandardMaterial({ color: '#CFE3FF', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false })
  const kerb = mat('#C9CFD9', { roughness: 0.8 })
  const islands = [...WIDE.map((x) => x + LANE / 2), ONE_X + LANE / 2 + 0.05]
  for (const x of islands) {
    St.add(box(0.36, 0.08, 1.3, kerb, [x, 0.04, ZB], 0.03))
    St.add(box(0.32, 0.42, 0.62, kioskM, [x, 0.29, ZB], 0.03))
    St.add(box(0.33, 0.04, 0.63, trim, [x, 0.5, ZB]))
    St.add(box(0.4, 0.05, 0.72, kioskM, [x, 1.02, ZB], 0.02))
    for (const [dx, dz] of [[-0.15, -0.29], [0.15, -0.29], [-0.15, 0.29], [0.15, 0.29]] as const) St.add(box(0.03, 0.5, 0.03, kioskM, [x + dx, 0.76, ZB + dz]))
  }
  /* glass panes stay separate (transparent, drawn after the people) */
  for (const x of islands) {
    scene.add(box(0.3, 0.48, 0.02, glassM, [x, 0.76, ZB + 0.3]))
    scene.add(box(0.02, 0.48, 0.58, glassM, [x - 0.155, 0.76, ZB]), box(0.02, 0.48, 0.58, glassM, [x + 0.155, 0.76, ZB]))
  }
  /* canopies on posts: one long one over the plaza, one short one over the single booth */
  const canopy = (x0: number, x1: number) => {
    St.add(box(x1 - x0, 0.1, 1.5, kioskM, [(x0 + x1) / 2, 1.58, ZB], 0.03))
    St.add(box(x1 - x0, 0.12, 0.03, trim, [(x0 + x1) / 2, 1.58, ZB + 0.76]))
  }
  canopy(wideL, wideR + 0.25)
  canopy(ONE_X - LANE / 2 - 0.1, ONE_X + LANE / 2 + 0.35)
  for (const x of islands) St.add(box(0.07, 0.55, 0.07, kioskM, [x, 1.3, ZB - 0.25]))
  scene.add(bake(St))

  /* barriers: a striped arm per lane, hinged at the island on the lane's right */
  const stripes = canvasTex(64, 8, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#FFFFFF' : '#E5383B'
      g.fillRect(i * 8, 0, 8, 8)
    }
  })
  const armM = mat('#ffffff', { map: stripes, roughness: 0.5 })
  const arm = (x: number) => {
    const pivot = new THREE.Group()
    pivot.position.set(x + LANE / 2 - 0.2, 0.46, ZB + 0.4)
    pivot.add(box(0.72, 0.045, 0.045, armM, [-0.36, 0, 0]))
    scene.add(pivot)
    return pivot
  }
  const wideArms = WIDE.map(arm)
  const oneArm = arm(ONE_X)

  /* cars: four per plaza lane (one waiting at each barrier), seven on the single booth's road (a queue) */
  const glass = mat('#22324F', { roughness: 0.15, metalness: 0.3 })
  const tyre = mat('#1B1F2E', { roughness: 0.8 })
  const tail = mat('#FF4D4D', { emissive: new THREE.Color('#FF2A2A'), emissiveIntensity: 0.9 })
  let ci = 0
  const wideCars = WIDE.flatMap((x, li) =>
    WIDE_SLOTS.map((_, j) => {
      const c = car(CAR_COLORS[(ci++ * 7 + li) % CAR_COLORS.length], glass, tyre, tail)
      c.position.x = x
      scene.add(c)
      return { c, j }
    }),
  )
  const oneCars = ONE_SLOTS.map((_, j) => {
    const c = car(CAR_COLORS[(j * 3 + 2) % CAR_COLORS.length], glass, tyre, tail)
    c.position.x = ONE_X
    scene.add(c)
    return { c, j }
  })

  /* attendants: a different Character Lab person in every booth, standing behind the glass (waist-high wall) */
  const crew = [P.arjun, P.riya, P.kabir, P.meera, P.dev, P.ananya]
  const people = islands.map((x, i) => {
    const busy = i === islands.length - 1
    const c = castSprite({
      config: busy ? P.rohan : crew[i],
      loop: TOLL,
      frames: busy ? 22 : 12,
      px: 180,
      height: 0.82,
      flip: !busy,
      onReady: kit.redraw,
      timeline: attendantTimeline(30 + i * 3, busy),
      pose: attendantPose(busy, busy ? -1 : 1),
    })
    c.object.position.set(x, 0.08, ZB - 0.05)
    scene.add(c.object)
    return { c, busy }
  })

  return (t: number, step: number) => {
    const wideOn = step === 1 || step >= 3
    const oneOn = step >= 2
    /* one toll cycle: barrier up 0.10-0.25, the cars roll one slot 0.22-0.82, barrier down 0.80-0.95 */
    const cyc = (on: boolean) => {
      const tt = on ? t : 0.05 * TOLL
      const n = Math.floor(tt / TOLL)
      const ph = tt / TOLL - n
      const lift = ease((ph - 0.08) / 0.14) * (1 - ease((ph - 0.8) / 0.14))
      return { n, move: ease((ph - 0.22) / 0.6), lift, tt }
    }
    const w = cyc(wideOn)
    const o = cyc(oneOn)
    /* the whole plaza at once: every lane's barrier lifts together and every waiting car drives through together */
    for (const a of wideArms) a.rotation.z = -w.lift * 1.35
    oneArm.rotation.z = -o.lift * 1.35
    for (const { c, j } of wideCars) c.position.z = along(WIDE_SLOTS, j + w.n + w.move)
    /* the single booth: one car through per cycle, the queue behind it creeps up one place */
    for (const { c, j } of oneCars) c.position.z = along(ONE_SLOTS, j + o.n + o.move)
    for (const p of people) p.c.update(p.busy ? o.tt : w.tt, camera)
  }
}

function F_T09Everyday({ step }: { step: number }) {
  return <Stage step={step} setup={setupToll} holdT={1.1} />
}

/* ================================================================== SLIDE 21 · CONCEPT: GPU board vs CPU chip */

function setupChips({ scene, camera }: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }) {
  scene.background = new THREE.Color('#EEF3FB')
  camera.fov = 34
  camera.position.set(0.35, 7.6, 9.4)
  camera.lookAt(0.35, 0.3, 0.75)
  lightRig(scene)
  /* a workbench mat in a server room: racks along the back */
  const floor = mat('#ffffff', { map: tiles('#DCE4F2', '#D2DCEE'), roughness: 0.85 })
  const St = new THREE.Group()
  room(St, { w: 10, d: 8, h: 2.8, floor, wall: '#E7EEFB' })
  const rackM = mat('#1F2E63', { roughness: 0.5, metalness: 0.3 })
  const led = mat('#7FD3FF', { emissive: new THREE.Color('#5BC0FF'), emissiveIntensity: 1.2 })
  for (const x of [-3.6, -2.6, 2.8, 3.8]) {
    St.add(box(0.9, 2.3, 0.7, rackM, [x, 1.15, -3.4], 0.04))
    for (let k = 0; k < 6; k++) St.add(box(0.5, 0.03, 0.02, led, [x - 0.1, 0.45 + k * 0.32, -3.04]))
  }
  /* the motherboard on a low bench */
  St.add(box(6.6, 0.5, 3.6, mat('#C9D3E6'), [0.2, 0.25, 0], 0.05))
  St.add(box(6.2, 0.06, 3.2, mat('#1F6B4F', { roughness: 0.6 }), [0.2, 0.53, 0], 0.02))

  /* GPU card: a dark board with 8 x 8 cores */
  const G = 8
  const gx = -1.0
  const gz = -0.05
  St.add(box(3.1, 0.12, 2.6, mat('#1B2246', { metalness: 0.4, roughness: 0.4 }), [gx, 0.62, gz], 0.04))
  const core = new THREE.InstancedMesh(new RoundedBoxGeometry(0.26, 0.08, 0.22, 2, 0.02), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2 }), G * G)
  core.castShadow = true
  const blocks = new THREE.InstancedMesh(new RoundedBoxGeometry(0.16, 0.16, 0.16, 2, 0.03), new THREE.MeshStandardMaterial({ color: '#FFB347', roughness: 0.35, emissive: new THREE.Color('#FF8A3D'), emissiveIntensity: 0.25 }), G * G)
  blocks.castShadow = true
  const cpos: [number, number][] = []
  const M = new THREE.Matrix4()
  for (let r = 0; r < G; r++)
    for (let c = 0; c < G; c++) {
      const x = gx - 1.26 + c * 0.36
      const z = gz - 1.05 + r * 0.3
      cpos.push([x, z])
      M.makeTranslation(x, 0.72, z)
      core.setMatrixAt(r * G + c, M)
    }
  scene.add(core, blocks)

  /* CPU chip: a socket with four big cores, a queue of blocks on a feed rail */
  const cx = 2.4
  const cz = 0.2
  St.add(box(1.5, 0.1, 1.5, mat('#C0C7D6', { metalness: 0.6, roughness: 0.3 }), [cx, 0.6, cz], 0.03))
  St.add(box(1.2, 0.08, 1.2, mat('#2B355C', { metalness: 0.4, roughness: 0.4 }), [cx, 0.69, cz], 0.03))
  const cpuCores: THREE.Mesh[] = []
  const cpuMat: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < 4; i++) {
    const m = new THREE.MeshStandardMaterial({ color: '#3B4A7E', roughness: 0.35, metalness: 0.2 })
    cpuMat.push(m)
    const c = box(0.46, 0.08, 0.46, m, [cx - 0.26 + (i % 2) * 0.52, 0.77, cz - 0.26 + Math.floor(i / 2) * 0.52], 0.03)
    cpuCores.push(c)
    scene.add(c)
  }
  /* the feed rail and its queue */
  St.add(box(0.36, 0.04, 2.6, mat('#9AA6BF', { metalness: 0.5 }), [cx, 0.58, cz + 1.95]))
  scene.add(bake(St))
  const Q = 6
  const queue: THREE.Mesh[] = []
  const qMat = new THREE.MeshStandardMaterial({ color: '#FFB347', roughness: 0.35, emissive: new THREE.Color('#FF8A3D'), emissiveIntensity: 0.25 })
  for (let i = 0; i < Q + 1; i++) {
    const b = box(0.2, 0.2, 0.2, qMat, [cx, 0.7, cz + 1.0 + i * 0.4], 0.03)
    queue.push(b)
    scene.add(b)
  }

  const idle = new THREE.Color('#3B4A7E')
  const hot = new THREE.Color('#5FD0FF')
  const tmp = new THREE.Color()
  const BATCH = 2.4
  const ONE = 0.9

  return (t: number, step: number) => {
    const gpuOn = step >= 1
    const cpuOn = step >= 2
    /* GPU: the whole batch drops onto every core at once, all cores light together, the results lift away */
    const ph = gpuOn ? (t % BATCH) / BATCH : 0.5
    const drop = ease(ph / 0.35)
    const lit = ph < 0.35 ? 0 : ph < 0.45 ? (ph - 0.35) / 0.1 : ph < 0.75 ? 1 : 1 - (ph - 0.75) / 0.2
    const rise = ph < 0.75 ? 0 : ease((ph - 0.75) / 0.25)
    for (let i = 0; i < G * G; i++) {
      const [x, z] = cpos[i]
      const y = ph < 0.75 ? 1.9 - drop * 1.06 : 0.84 + rise * 1.2
      const s = ph < 0.75 ? (ph < 0.45 ? 1 : 1 - clamp01((ph - 0.45) / 0.3) * 0.25) : (1 - rise) * 0.75
      M.makeScale(s, s, s).setPosition(x, y, z)
      blocks.setMatrixAt(i, M)
      tmp.copy(idle).lerp(hot, clamp01(lit))
      core.setColorAt(i, tmp)
    }
    blocks.visible = gpuOn
    blocks.instanceMatrix.needsUpdate = true
    if (core.instanceColor) core.instanceColor.needsUpdate = true

    /* CPU: one block at a time slides off the queue into a core, which lights, then the next */
    const beat = cpuOn ? t / ONE : 0.6
    const k = Math.floor(beat)
    const f = beat - k
    const active = k % 4
    for (let i = 0; i < 4; i++) cpuMat[i].color.copy(idle).lerp(hot, i === active && cpuOn ? (f < 0.5 ? ease(f / 0.2) : 1 - ease((f - 0.5) / 0.4)) : 0)
    for (let i = 0; i < Q + 1; i++) {
      const q = queue[i]
      if (i === 0) {
        /* the head block rides into the active core */
        const [tx, tz] = [cx - 0.26 + (active % 2) * 0.52, cz - 0.26 + Math.floor(active / 2) * 0.52]
        const g = ease(clamp01(f / 0.45))
        q.position.set(cx + (tx - cx) * g, 0.7 + Math.sin(g * Math.PI) * 0.25 + (g > 0.95 ? 0.12 : 0), cz + 1.0 + (tz - cz - 1.0) * g)
        const s = f < 0.5 ? 1 : 1 - ease((f - 0.5) / 0.3)
        q.scale.setScalar(Math.max(0.001, s))
        q.visible = cpuOn
      } else {
        /* the rest of the queue shuffles forward by one place each beat */
        q.position.set(cx, 0.7, cz + 1.0 + (i - ease(clamp01((f - 0.5) / 0.4))) * 0.4)
        q.visible = cpuOn || i < Q
        q.scale.setScalar(i === Q ? Math.max(0.001, ease(clamp01((f - 0.5) / 0.4))) : 1)
      }
    }
  }
}

function F_T09Concept({ step }: { step: number }) {
  return (
    <Stage
      step={step}
      setup={setupChips}
      holdT={5.6}
      pins={[
        { text: 'GPU', at: [-1.0, 0.75, -1.75] },
        { text: 'CPU', at: [2.4, 0.75, -0.95] },
      ]}
    />
  )
}

/* ================================================================== SLIDE 25 · CONCEPT: vCPU, memory and disk */

/* one fetch cycle (s), the same length as the student's trip to the shelf on the left card */
const FETCH = 4.5

/** a hard disk with its lid off: aluminium case, a platter that spins while it is read, an actuator arm */
function hardDisk(St: THREE.Group, scene: THREE.Scene, x: number, z: number) {
  const alu = mat('#C3CAD6', { metalness: 0.7, roughness: 0.35 })
  St.add(box(0.95, 0.14, 1.2, alu, [x, 0.07, z], 0.04))
  St.add(box(0.87, 0.02, 1.12, mat('#9AA4B5', { metalness: 0.6, roughness: 0.4 }), [x, 0.145, z]))
  const platter = new THREE.Group()
  platter.position.set(x, 0.17, z - 0.12)
  const disc = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.025, 48), mat('#D5DCE8', { metalness: 0.35, roughness: 0.22 }))
  const hub = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24), mat('#8C96A8', { metalness: 0.8, roughness: 0.3 }), [0, 0.02, 0])
  const mark = box(0.3, 0.01, 0.03, mat('#B5BECC', { metalness: 0.9, roughness: 0.2 }), [0.18, 0.016, 0])
  platter.add(disc, hub, mark)
  scene.add(platter)
  const armPivot = new THREE.Group()
  armPivot.position.set(x + 0.31, 0.2, z + 0.38)
  armPivot.add(box(0.06, 0.03, 0.5, mat('#3B4A7E', { metalness: 0.5 }), [0, 0, -0.24]))
  scene.add(armPivot)
  return { platter, armPivot }
}

function setupMemory({ scene, camera }: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }) {
  scene.background = new THREE.Color('#EEF3FB')
  camera.fov = 40
  camera.position.set(0.17, 4.9, 5.1)
  camera.lookAt(0.17, 0.2, 1.22)
  lightRig(scene)
  const St = new THREE.Group()
  room(St, { w: 10, d: 7, h: 2.8, floor: mat('#ffffff', { map: tiles('#DCE4F2', '#D2DCEE'), roughness: 0.85 }), wall: '#E7EEFB' })
  const pcb = mat('#16513C', { roughness: 0.6 })
  const socket = mat('#C0C7D6', { metalness: 0.6, roughness: 0.3 })
  const dimm = mat('#3DBB7A', { roughness: 0.45 })
  const dimmChip = mat('#1B1F2E', { roughness: 0.4 })
  const goldM = mat('#E0B84E', { metalness: 0.8, roughness: 0.3 })
  const blockM = new THREE.MeshStandardMaterial({ color: '#FFB347', roughness: 0.35, emissive: new THREE.Color('#FF8A3D'), emissiveIntensity: 0.25 })

  /** a server board: tray, PCB, one vCPU chip at the back, `sticks` memory sticks in front, each holding two blocks */
  function board(x0: number, w: number, sticks: number) {
    St.add(box(w, 0.22, 2.5, mat('#C9D3E6', { metalness: 0.3 }), [x0, 0.11, 0.2], 0.04))
    St.add(box(w - 0.2, 0.05, 2.3, pcb, [x0, 0.25, 0.2], 0.02))
    St.add(box(0.72, 0.06, 0.72, socket, [x0, 0.31, -0.45], 0.02))
    const chipM = new THREE.MeshStandardMaterial({ color: '#3B4A7E', roughness: 0.35, metalness: 0.3, emissive: new THREE.Color('#000000') })
    scene.add(box(0.56, 0.08, 0.56, chipM, [x0, 0.38, -0.45], 0.03))
    /* memory sticks lie across the board in a row; each has two block seats along its top */
    const seats: [number, number][] = []
    for (let i = 0; i < sticks; i++) {
      const x = sticks === 1 ? x0 : x0 - (w - 0.9) / 2 + i * ((w - 0.9) / (sticks - 1))
      const s = new THREE.Group()
      s.add(box(0.12, 0.32, 1.1, dimm, [0, 0.16, 0]))
      for (let k = 0; k < 3; k++) s.add(box(0.13, 0.1, 0.22, dimmChip, [0, 0.18, -0.36 + k * 0.36]))
      s.add(box(0.125, 0.04, 1.06, goldM, [0, 0.02, 0]))
      s.position.set(x, 0.27, 0.75)
      St.add(s)
      seats.push([x, 0.5], [x, 1.0])
    }
    return { chipM, seats, cx: x0, cz: -0.45 }
  }
  /* small memory on the left (beside the disk), big memory on the right: as the small and the big study table */
  const A = board(-1.12, 1.5, 1)
  const B = board(1.18, 2.3, 4)
  const disk = hardDisk(St, scene, -1.12, 2.4)
  /* the cable from the disk to the small board */
  St.add(box(0.16, 0.03, 0.4, mat('#2B355C'), [-1.12, 0.06, 1.62]))
  scene.add(bake(St))

  const mk = () => {
    const b = box(0.2, 0.2, 0.2, blockM, [0, 0, 0], 0.03)
    scene.add(b)
    return b
  }
  /* A: two blocks fit in its one stick; a third has to come from the disk */
  const aSeat = A.seats.map(([x, z]) => new THREE.Vector3(x, 0.72, z + 0.75 - 0.75))
  const aBlocks = [mk(), mk()]
  const traveller = mk()
  /* B: eight blocks ready in memory, the chip takes them one after another */
  const bSeat = B.seats.map(([x, z]) => new THREE.Vector3(x, 0.72, z))
  const bBlocks = bSeat.map(() => mk())
  const diskP = new THREE.Vector3(-1.12, 0.32, 2.28)
  const idle = new THREE.Color('#3B4A7E')
  const hot = new THREE.Color('#5FD0FF')
  const wait = new THREE.Color(colors.accent)
  const cpuA = new THREE.Vector3(A.cx, 0.6, A.cz)
  const cpuB = new THREE.Vector3(B.cx, 0.6, B.cz)
  const hop = (a: THREE.Vector3, b: THREE.Vector3, k: number, o: THREE.Object3D, h = 0.5) => {
    o.position.copy(a).lerp(b, k)
    o.position.y += Math.sin(k * Math.PI) * h
  }

  return (t: number, step: number) => {
    const aOn = step === 1 || step >= 3
    const bOn = step >= 2
    /* A, one fetch cycle (mirrors the trip to the shelf): works on what memory holds, runs out, waits while a block
       comes up from the disk (the platter spins, the arm sweeps), then works again */
    const ua = aOn ? (t % FETCH) / FETCH : 0.15
    const working = ua < 0.3 || ua > 0.86
    const fetchK = ease((ua - 0.36) / 0.44)
    A.chipM.color.copy(idle).lerp(working ? hot : wait, working ? 0.55 + 0.45 * Math.sin(t * 6) : 0.5 + 0.5 * Math.abs(Math.sin(t * 5)))
    /* the two blocks in memory take turns in the chip while it works */
    aBlocks.forEach((b, i) => {
      const k = working ? Math.sin(clamp01((((ua + (ua > 0.86 ? -0.86 : 0.14)) * 3.4 + i * 0.5) % 1)) * Math.PI) : 0
      hop(aSeat[i], cpuA, k * 0.9, b, 0.35)
    })
    /* the third block: from the disk, along the cable, into the stick's seat, then into the chip */
    if (ua < 0.36) {
      traveller.visible = false
    } else {
      traveller.visible = true
      const mid = new THREE.Vector3(-1.12, 0.62, 1.35)
      if (fetchK < 0.55) hop(diskP, mid, fetchK / 0.55, traveller, 0.35)
      else if (ua < 0.86) hop(mid, cpuA, (fetchK - 0.55) / 0.45, traveller, 0.4)
      else traveller.visible = false
    }
    disk.platter.rotation.y = aOn ? -t * (ua > 0.32 && ua < 0.84 ? 9 : 1.5) : 0.4
    disk.armPivot.rotation.y = ua > 0.32 && ua < 0.84 ? Math.sin(t * 7) * 0.35 + 0.2 : 0.05

    /* B: every block is already in memory; the chip pulls them one after another, never waiting */
    const ub = bOn ? t / (FETCH / 6) : 0.3
    const k = Math.floor(ub)
    const f = ub - k
    const cur = k % bSeat.length
    B.chipM.color.copy(idle).lerp(hot, bOn ? 0.6 + 0.4 * Math.sin(t * 6) : 0.3)
    bBlocks.forEach((b, i) => {
      if (bOn && i === cur) hop(bSeat[i], cpuB, Math.sin(f * Math.PI) * 0.92, b, 0.45)
      else b.position.copy(bSeat[i])
    })
  }
}

function F_T12Concept({ step }: { step: number }) {
  return <Stage step={step} setup={setupMemory} holdT={2.1} />
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  F_T09Everyday: F_T09Everyday as unknown as (p: Record<string, unknown>) => ReactNode,
  F_T09Concept: F_T09Concept as unknown as (p: Record<string, unknown>) => ReactNode,
  F_T12Concept: F_T12Concept as unknown as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}
export const css = ''
