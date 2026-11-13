import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ThreeStage, lightRig, mesh, mat, castSprite, castClip, CAST_IDLE, CAST_PRESETS, type Pose, type Timeline, type StageKit } from './three-stage'

/**
 * SLIDE 25 LEFT CARD, round 4 (user, 2026-11-10: "Replace the analogy with: A vCPU is like a student working at a study
 * table and memory is the size of that table — just as a bigger table lets students keep more books open without
 * running back to the shelf, more memory lets the vCPUs keep more data ready without slowing down to fetch it from
 * disk."). Overrides i.tsx's `F_T12Everyday`; the right card (`F_T12Concept`) is in i.tsx.
 *
 * A study room in real-time 3D (standing corrections 13-14): a bookcase, a SMALL study table with room for two open
 * books and a BIG study table with six. Two Character Lab students:
 *  - small table: reads (thinking), runs out of room, closes a book, looks at the shelf (worried), stands, walks to the
 *    bookcase with the book held at the chest, shelves it and pulls the next one, walks back, sits, opens it. Two trips
 *    per loop (book X out and Y in, then Y out and X in), so the shelf and the table end exactly as they started;
 *  - big table: stays seated with six books open, glances from book to book and turns pages (happy, proud).
 * No text on the card. One seamless 9 s loop (the big table's 4.5 s twice): it runs straight back into its start.
 * Build: press 1 the small table runs, press 2 the big table, press 3 both.
 */

const SW = 470
const SH = 390
/** one trip to the shelf (s); the small table's loop is two trips, the big table's loop is one trip length */
const TRIP = 4.5
const LOOP = TRIP * 2

/* ------------------------------------------------------------------ helpers */

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

const woodFloor = () =>
  canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = '#D8B48A'
      g.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#CFA97C' : '#DDBB93'
        g.fillRect(0, i * 32, 256, 31)
        g.fillStyle = 'rgba(90,60,30,0.18)'
        g.fillRect(0, i * 32 + 31, 256, 1)
        g.fillRect(((i * 97) % 256) | 0, i * 32, 1, 32)
      }
    },
    [10, 10],
  )

const box = (w: number, h: number, d: number, m: THREE.Material, pos: [number, number, number], r = 0) =>
  mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** static parts merged into one mesh per material (few draw calls) */
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

function room(scene: THREE.Object3D, o: { w: number; d: number; h: number; floor: THREE.Material; wall?: string }) {
  const wall = mat(o.wall ?? '#F1F4FA', { roughness: 0.95, emissive: new THREE.Color(o.wall ?? '#F1F4FA'), emissiveIntensity: 0.35 })
  const f = mesh(new THREE.BoxGeometry(o.w + 8, 0.1, o.d + 10), o.floor, [0, -0.05, 5])
  f.castShadow = false
  scene.add(f)
  const back = mesh(new THREE.BoxGeometry(o.w, o.h, 0.12), wall, [0, o.h / 2, -o.d / 2])
  back.castShadow = false
  scene.add(back)
  const left = mesh(new THREE.BoxGeometry(0.12, o.h, o.d), wall, [-o.w / 2, o.h / 2, 0])
  left.castShadow = false
  scene.add(left)
  const sk = mat('#C9D3E6')
  scene.add(box(o.w, 0.12, 0.04, sk, [0, 0.06, -o.d / 2 + 0.08]), box(0.04, 0.12, o.d, sk, [-o.w / 2 + 0.08, 0.06, 0]))
}

function windows(scene: THREE.Object3D, x: number, zs: number[], y = 1.75) {
  const frame = mat('#FFFFFF')
  const glass = mat('#BFD8FF', { roughness: 0.15, metalness: 0.1, emissive: new THREE.Color('#CFE2FF'), emissiveIntensity: 0.35 })
  for (const z of zs) {
    scene.add(box(0.06, 1.1, 1.0, frame, [x + 0.05, y, z]))
    scene.add(box(0.07, 0.96, 0.86, glass, [x + 0.07, y, z]))
    scene.add(box(0.08, 0.04, 0.86, frame, [x + 0.08, y, z]))
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const TAU = Math.PI * 2

/** a study table with a modesty panel at the front (it hides a seated student's legs) */
function studyTable(g: THREE.Group, x: number, z: number, w: number, d: number, top: THREE.Material, leg: THREE.Material) {
  const h = 0.74
  g.add(box(w, 0.06, d, top, [x, h, z], 0.02))
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) g.add(box(0.06, h, 0.06, leg, [x + (sx * (w - 0.12)) / 2, h / 2, z + (sz * (d - 0.12)) / 2]))
  g.add(box(w - 0.12, 0.62, 0.03, top, [x, 0.4, z + d / 2 - 0.05]))
}

/** a chair facing the camera: seat, backrest behind the student, four legs */
function chair(g: THREE.Group, x: number, z: number, m: THREE.Material, leg: THREE.Material) {
  g.add(box(0.46, 0.05, 0.44, m, [x, 0.46, z], 0.02))
  g.add(box(0.46, 0.5, 0.05, m, [x, 0.74, z - 0.22], 0.02))
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) g.add(box(0.04, 0.46, 0.04, leg, [x + sx * 0.2, 0.23, z + sz * 0.19]))
}

/** an open book lying on a table: two halves hinged on the spine (along z); `right` folds over to close it */
function openBook(cover: THREE.Material, page: THREE.Material) {
  const g = new THREE.Group()
  const left = new THREE.Group()
  const right = new THREE.Group()
  left.add(box(0.2, 0.012, 0.28, cover, [-0.1, 0, 0]), box(0.185, 0.02, 0.26, page, [-0.097, 0.016, 0]))
  right.add(box(0.2, 0.012, 0.28, cover, [0.1, 0, 0]), box(0.185, 0.02, 0.26, page, [0.097, 0.016, 0]))
  left.rotation.z = -0.06
  right.rotation.z = 0.06
  g.add(left, right)
  /* a single page that turns over the spine */
  const leaf = new THREE.Group()
  leaf.position.y = 0.029
  leaf.add(box(0.18, 0.004, 0.25, page, [0.092, 0, 0]))
  g.add(leaf)
  return { g, left, right, leaf }
}

/* ------------------------------------------------------------------ the students */

/** expression segments over one trip: [start (0..1 of a trip), expression] */
function faceAt(seed: number, segs: [number, string][], len: number) {
  return (t: number): Timeline => {
    const base = Math.floor(t / len) * len
    const u = (t - base) / len
    let i = 0
    for (let k = 0; k < segs.length; k++) if (u >= segs[k][0]) i = k
    const prev = segs[(i - 1 + segs.length) % segs.length]
    return {
      seed,
      idle: { ...CAST_IDLE, saccades: false },
      life: 0,
      expression: castClip(segs[i][1], base + segs[i][0] * len, false),
      prevExpression: castClip(prev[1], base + prev[0] * len - len * 0.1, false),
    }
  }
}

/* the small-table student's trip, as fractions of TRIP */
const U = { close: 0.3, stand: 0.36, walk: 0.42, shelf: 0.56, back: 0.7, sit: 0.82, open: 0.88 }

/** where the small-table student is during a trip: x, z, and the seat drop (0 standing, 1 seated) */
function tripPlace(u: number, seat: [number, number], shelf: [number, number]) {
  const go = ease((u - U.walk) / (U.shelf - U.walk))
  const ret = ease((u - U.back) / (U.sit - U.back))
  const k = u < U.back ? go : 1 - ret
  const up = u < U.stand ? 0 : u < U.walk ? ease((u - U.stand) / (U.walk - U.stand)) : u < U.sit ? 1 : 1 - ease((u - U.sit) / (U.open - U.sit))
  return { x: mix(seat[0], shelf[0], k), z: mix(seat[1], shelf[1], k), sit: 1 - up, walking: (u > U.walk && u < U.shelf) || (u > U.back && u < U.sit) }
}

/** reading at the table: head down over the book, both forearms on the table */
function readPose(p: Pose, flick = 0) {
  p.headNod = Math.max(p.headNod, 0.34)
  p.lookY = 0.65
  p.bow = Math.max(p.bow, 0.1)
  p.shoulderL = 26
  p.elbowL = 80
  p.shoulderR = 26 + flick * 14
  p.elbowR = 80 - flick * 22
  p.wristR = flick * 16
}

/** the small-table student: one pose per moment of the trip */
function smallPose(p: Pose, t: number) {
  const u = (t % TRIP) / TRIP
  if (u < U.close || u >= U.open) {
    /* reading, a page turned once in the middle */
    readPose(p, u < U.close ? Math.sin(clamp01((u - 0.12) / 0.08) * Math.PI) : 0)
    if (u >= U.open) {
      /* opening the next book: both hands spread the covers */
      const o = Math.sin(clamp01((u - U.open) / (1 - U.open)) * Math.PI)
      p.shoulderL = 26 + o * 10
      p.shoulderR = 26 + o * 10
    }
    return
  }
  if (u < U.stand) {
    /* closing the book, then a worried look at the shelf */
    const k = clamp01((u - U.close) / (U.stand - U.close))
    readPose(p)
    p.shoulderR = 34
    p.elbowR = 62
    p.headNod = 0.34 * (1 - k)
    p.lookY = 0.65 * (1 - k)
    p.headTurn = -0.4 * k
    p.lookX = -0.8 * k
    return
  }
  /* standing, walking, at the shelf: the book held at the chest with both hands */
  p.shoulderL = 20
  p.elbowL = 118
  p.shoulderR = 20
  p.elbowR = 118
  p.headTurn = u < U.back ? -0.38 : 0.3
  p.lookX = u < U.back ? -0.8 : 0.6
  if ((u > U.walk && u < U.shelf) || (u > U.back && u < U.sit)) {
    const w = t * TAU * 1.9
    p.kneeL = Math.max(0, Math.sin(w)) * 0.55
    p.kneeR = Math.max(0, -Math.sin(w)) * 0.55
    p.bodyY = -Math.abs(Math.sin(w)) * 7
    p.stance = Math.sin(w) * 0.5
  }
  if (u >= U.shelf && u < U.back) {
    /* the reach: the arm nearest the shelf goes up to the shelf (book in), comes down, goes up again (next book out) */
    const r = Math.sin(clamp01((u - U.shelf) / (U.back - U.shelf)) * TAU - Math.PI / 2) * 0.5 + 0.5
    p.shoulderL = 20 + r * 140
    p.elbowL = 118 - r * 108
    p.headNod = -0.25
    p.lookY = -0.7
    p.headTurn = -0.3
  }
}

function bigPose(p: Pose, t: number) {
  const u = (t % TRIP) / TRIP
  readPose(p)
  /* glances from book to book across the big table */
  p.headTurn = Math.sin(u * TAU) * 0.38
  p.lookX = Math.sin(u * TAU) * 0.8
  p.headNod = 0.3
  /* turns a page on the book at its side, then back to reading */
  const r = Math.sin(clamp01((u - 0.42) / 0.2) * Math.PI)
  p.shoulderL = 26 + r * 24
  p.elbowL = 80 - r * 34
}

/* ------------------------------------------------------------------ the scene */

function setupStudy(kit: StageKit) {
  const { scene, camera } = kit
  scene.background = new THREE.Color('#EEF3FB')
  camera.fov = 42
  camera.position.set(0.1, 2.2, 3.5)
  camera.lookAt(0.1, 0.92, -0.45)
  lightRig(scene, [0, 0, 0])
  const St = new THREE.Group()
  room(St, { w: 10, d: 6.4, h: 3.6, floor: mat('#ffffff', { map: woodFloor(), roughness: 0.8 }), wall: '#FBF6EC' })
  windows(St, -5, [-1.3, 1.3])

  const wood = mat('#B98A5C', { roughness: 0.7 })
  const woodDark = mat('#8C6440', { roughness: 0.7 })
  const leg = mat('#5E6B86', { metalness: 0.3 })
  const page = mat('#FFFDF6', { roughness: 0.9 })
  const covers = ['#2D63FB', '#E5732A', '#16A34A', '#7C5CFF', '#E11D74', '#0E9AA7', '#F2A33A', '#1F2E63'].map((c) => mat(c, { roughness: 0.55 }))

  /* the bookcase: four shelves of books; slots A and B (top-right, nearest the small table) hold the two books that
     travel to the table and back */
  const BC = { x: -1.8, z: -1.3, w: 1.1, h: 2.15, d: 0.42 }
  St.add(box(BC.w, BC.h, 0.04, woodDark, [BC.x, BC.h / 2, BC.z - BC.d / 2]))
  St.add(box(0.05, BC.h, BC.d, wood, [BC.x - BC.w / 2, BC.h / 2, BC.z]), box(0.05, BC.h, BC.d, wood, [BC.x + BC.w / 2, BC.h / 2, BC.z]))
  const shelfY = [0.08, 0.6, 1.1, 1.6, 2.12]
  for (const y of shelfY) St.add(box(BC.w, 0.05, BC.d, wood, [BC.x, y, BC.z]))
  const SLOT_A = { x: BC.x + 0.43, y: 1.6 + 0.025 + 0.16 }
  const SLOT_B = { x: BC.x + 0.51, y: 1.6 + 0.025 + 0.16 }
  for (let s = 0; s < 4; s++) {
    const y0 = shelfY[s] + 0.025
    let x = BC.x - BC.w / 2 + 0.07
    let n = 0
    while (x < BC.x + BC.w / 2 - 0.08) {
      const th = 0.06 + ((n * 37 + s * 11) % 4) * 0.008
      const hh = 0.26 + ((n * 13 + s * 7) % 5) * 0.025
      /* leave the two travelling books' slots free (they are separate meshes) */
      if (!(s === 3 && x > SLOT_A.x - 0.05 && x < SLOT_B.x + 0.05)) St.add(box(th, hh, 0.28, covers[(n + s * 3) % covers.length], [x + th / 2, y0 + hh / 2, BC.z + 0.02]))
      x += th + 0.008
      n++
    }
  }

  /* the SMALL study table: room for two open books */
  const SM = { x: -0.78, z: 0.05, w: 0.86, d: 0.62 }
  studyTable(St, SM.x, SM.z, SM.w, SM.d, wood, leg)
  chair(St, SM.x, SM.z - 0.5, mat('#2D63FB', { roughness: 0.55 }), leg)
  /* the BIG study table: room for six */
  const BG = { x: 0.84, z: 0.05, w: 1.64, d: 0.98 }
  studyTable(St, BG.x, BG.z, BG.w, BG.d, wood, leg)
  chair(St, BG.x, BG.z - 0.66, mat('#2D63FB', { roughness: 0.55 }), leg)
  scene.add(bake(St))

  const TOP = 0.78
  /* small table: the left book stays open; the right one is the one that goes back to the shelf */
  const fixed = openBook(covers[3], page)
  fixed.g.position.set(SM.x - 0.2, TOP, SM.z + 0.06)
  fixed.g.rotation.y = 0.08
  scene.add(fixed.g)
  const travelling = [covers[0], covers[1]].map((c) => {
    const ob = openBook(c, page)
    ob.g.position.set(SM.x + 0.2, TOP, SM.z + 0.05)
    ob.g.rotation.y = -0.06
    scene.add(ob.g)
    const closed = box(0.05, 0.3, 0.24, c, [0, 0, 0], 0.01)
    scene.add(closed)
    return { ob, closed }
  })
  /* big table: six open books, each turning a page at its own moment */
  const big: ReturnType<typeof openBook>[] = []
  const spots: [number, number, number][] = [
    [-0.6, -0.17, 0.1],
    [0.0, -0.2, 0],
    [0.6, -0.17, -0.1],
    [-0.56, 0.22, 0.05],
    [0.0, 0.24, 0],
    [0.56, 0.22, -0.05],
  ]
  spots.forEach(([dx, dz, ry], i) => {
    const ob = openBook(covers[(i + 2) % covers.length], page)
    ob.g.position.set(BG.x + dx, TOP, BG.z + dz)
    ob.g.rotation.y = ry
    scene.add(ob.g)
    big.push(ob)
  })

  /* the students: Character Lab, standing figures seated by dropping them behind the table's modesty panel */
  const SEAT_DROP = 0.22
  const seatA: [number, number] = [SM.x, SM.z - 0.4]
  const shelfA: [number, number] = [BC.x + 0.36, BC.z + 0.6]
  const small = castSprite({
    config: CAST_PRESETS.arjun,
    loop: LOOP,
    frames: 72,
    px: 220,
    height: 1.62,
    onReady: kit.redraw,
    timeline: faceAt(
      11,
      [
        [0, 'thinking'],
        [U.close, 'worried'],
        [U.shelf, 'thinking'],
        [U.back, 'bored'],
        [U.open, 'thinking'],
      ],
      TRIP,
    ),
    pose: smallPose,
  })
  scene.add(small.object)
  const bigS = castSprite({
    config: CAST_PRESETS.riya,
    loop: TRIP,
    frames: 36,
    px: 220,
    height: 1.56,
    onReady: kit.redraw,
    timeline: faceAt(
      12,
      [
        [0, 'happy'],
        [0.42, 'proud'],
        [0.75, 'happy'],
      ],
      TRIP,
    ),
    pose: bigPose,
  })
  bigS.object.position.set(BG.x, -SEAT_DROP, BG.z - 0.45)
  scene.add(bigS.object)

  /** the travelling book's place over a trip: open on the table, closed in the hands, in its shelf slot */
  const placeBook = (b: (typeof travelling)[number], role: 'out' | 'in' | 'shelf' | 'table', u: number, px: number, pz: number, py: number) => {
    const { ob, closed } = b
    const slot = b === travelling[0] ? SLOT_A : SLOT_B
    const hand = new THREE.Vector3(px, py + 0.88, pz + 0.18)
    const shelfP = new THREE.Vector3(slot.x, slot.y, BC.z + 0.02)
    if (role === 'shelf') {
      ob.g.visible = false
      closed.visible = true
      closed.position.copy(shelfP)
      closed.rotation.set(0, 0, 0)
      return
    }
    if (role === 'table') {
      ob.g.visible = true
      closed.visible = false
      ob.right.rotation.z = 0.06
      return
    }
    /* 'out': open on the table, closes, carried to the shelf, slid in. 'in': pulled out, carried, laid down, opened */
    const r = Math.sin(clamp01((u - U.shelf) / (U.back - U.shelf)) * TAU - Math.PI / 2) * 0.5 + 0.5
    const mid = (U.shelf + U.back) / 2
    if (role === 'out') {
      if (u < U.stand) {
        ob.g.visible = true
        closed.visible = false
        ob.right.rotation.z = 0.06 + ease((u - U.close) / (U.stand - U.close)) * (Math.PI - 0.1)
        return
      }
      ob.g.visible = false
      closed.visible = true
      closed.rotation.set(0, 0, u < U.shelf ? 0.25 : 0)
      if (u < U.shelf) closed.position.copy(hand)
      else if (u < mid) closed.position.copy(hand).lerp(shelfP, ease(r * 1.05))
      else closed.position.copy(shelfP)
      return
    }
    /* role 'in' */
    if (u < mid) {
      ob.g.visible = false
      closed.visible = true
      closed.position.copy(shelfP)
      closed.rotation.set(0, 0, 0)
      return
    }
    if (u < U.sit) {
      ob.g.visible = false
      closed.visible = true
      closed.rotation.set(0, 0, u < U.back ? 0 : 0.25)
      if (u < U.back) closed.position.copy(shelfP).lerp(hand, ease(1 - r))
      else closed.position.copy(hand)
      return
    }
    ob.g.visible = true
    closed.visible = false
    ob.right.rotation.z = 0.06 + (1 - ease((u - U.sit) / (1 - U.sit))) * (Math.PI - 0.1)
  }

  return (t: number, step: number) => {
    const smallOn = step === 1 || step >= 3
    const bigOn = step >= 2
    /* small table: two trips per loop; trip 0 takes book 0 to the shelf and brings book 1, trip 1 the reverse */
    const ts = smallOn ? t % LOOP : 0.5
    const trip = Math.floor(ts / TRIP)
    const u = (ts % TRIP) / TRIP
    const pl = tripPlace(u, seatA, shelfA)
    small.object.position.set(pl.x, -SEAT_DROP * pl.sit, pl.z)
    small.update(ts, camera)
    const out = travelling[trip]
    const inn = travelling[1 - trip]
    placeBook(out, 'out', u, pl.x, pl.z, -SEAT_DROP * pl.sit)
    placeBook(inn, 'in', u, pl.x, pl.z, -SEAT_DROP * pl.sit)
    /* the open book on the table turns a page while it is read */
    fixed.leaf.rotation.z = smallOn && u < U.close ? ease((u - 0.12) / 0.1) * Math.PI : 0

    /* big table: reads on, a page turned on every book in turn */
    const tb = bigOn ? t % TRIP : 1.2
    bigS.update(tb, camera)
    const ub = tb / TRIP
    big.forEach((b, i) => {
      const at = i / big.length
      const f = (((ub - at) % 1) + 1) % 1
      b.leaf.rotation.z = bigOn && f < 0.3 ? ease(f / 0.16) * Math.PI : 0
    })
  }
}

function F_T12Everyday({ step }: { step: number }) {
  return <ThreeStage w={SW} h={SH} step={step} setup={setupStudy} holdT={0.77} />
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  F_T12Everyday: F_T12Everyday as unknown as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}
export const css = ''
