import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { colors } from '@/design/tokens'
import { Label } from '@/decks/figures/scene'
import { ThreeStage, lightRig, mat, mesh, person, castSprite, castClip, CAST_IDLE, CAST_PRESETS, type Person, type StageKit } from './three-stage'
import ec2Url from '../images/aws-ec2.svg'

/**
 * BUILDER H · SESSION 9 ANALOGIES ON SLIDES 7 AND 17, REBUILT AS REAL-TIME 3D (user, 2026-11-10: standing correction
 * 13 / cloud course R10: real 3D scenes, no isometric or clay, no text, loops that perform the analogy's action).
 *
 * Slide 7 (TR 1): "Similar to drawing electricity from a utility grid, compute capacity is used on demand and billed
 * only for the time it is consumed, just as an instance incurs compute charges only while it is running."
 *   Everyday: a house on the utility grid: transmission pylons, the street pole with its transformer, the service
 *   wire into the house, an electricity meter on the front wall, and inside, through the window, the homeowner
 *   switching a lamp on and off. While it is on, power flows from the pylons to the house and the meter's dial turns;
 *   switched off, the flow stops and the dial stops.
 *   Concept: a data-centre aisle on the same power: the overhead busway feeds one server unit carrying the official
 *   EC2 mark (the instance). It powers up (amber → green lights, fans turning), the same meter turns only while it
 *   runs, and stops with it. Both cards run on ONE clock (`CYCLE`), so the two meters start and stop together.
 *
 * Slide 17 (TR 6): "A general-purpose instance is like a family sedan car, not the fastest, not the biggest boot, but
 *   balanced for most everyday trips, just as it balances CPU and memory instead of maximising either."
 *   Everyday: an everyday road trip seen from behind: the family sedan (two adults and a child inside) holds the
 *   middle lane, a sports car (the fastest) keeps overtaking it, a big-boot van loaded with luggage keeps pace beside.
 *   Concept: three server cabinets on the same left-middle-right places: memory maximised (tall Memory column), the
 *   balanced general-purpose instance (equal columns, a level beam), CPU maximised (tall CPU column). Work pulses run
 *   up the columns; the side beams rock, the middle one stays level. Only two tags: Memory and CPU (user).
 *
 * All drawing goes through the deck's ONE shared WebGL renderer (`three-stage.tsx`). Held frames (`?still`,
 * thumbnails, reduced motion) draw one frame at `holdT`, chosen inside the "on" part of the cycle.
 */

const W = 470
const H = 390

/* ------------------------------------------------------------------ the shared clock of slide 7 */

/**
 * one on/off cycle (s): reach, switch on at ON, run, reach, switch off at OFF, then the loop restarts almost at once
 * (user, 2026-11-10 round 3: "make the pause between the end of one loop and the start of the next very short"): the
 * appliance is off only for the 0.35 s fade, a 0.25 s beat that shows the meter stopped, and the next reach.
 */
const ON = 0.95
const OFF = ON + 4.8
const CYCLE = OFF + 0.35 + 0.25
/** 0..1 how "on" the appliance / instance is at time t (eased 0.35 s edges) */
function onAmt(t: number) {
  const c = ((t % CYCLE) + CYCLE) % CYCLE
  const e = 0.35
  if (c < ON) return 0
  if (c < ON + e) return (c - ON) / e
  if (c < OFF) return 1
  if (c < OFF + e) return 1 - (c - OFF) / e
  return 0
}
/** how far a meter dial has turned by time t: it advances only while on (integral of onAmt) */
function meterAngle(t: number) {
  const runPerCycle = OFF - ON
  const k = Math.floor(t / CYCLE)
  const c = t - k * CYCLE
  const within = c < ON ? 0 : c < OFF ? c - ON : runPerCycle
  return (k * runPerCycle + within) * 2.4
}

/* ------------------------------------------------------------------ modelling helpers */

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

function speckle(g: CanvasRenderingContext2D, w: number, h: number, base: string, n: number, amp: number, seed = 1) {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < n; i++) {
    const v = (rnd() - 0.5) * amp
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`
    g.fillRect(rnd() * w, rnd() * h, 2, 2)
  }
}

const rbox = (w: number, h: number, d: number, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2))

/** a cylinder rod between two points */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  const o = mesh(new THREE.CylinderGeometry(r, r, len, 8), m)
  o.position.copy(a).addScaledVector(dir, 0.5)
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return o
}

/** a sagging wire between two points */
function wireCurve(a: THREE.Vector3, b: THREE.Vector3, sag: number) {
  const m = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  m.y -= sag
  const q1 = new THREE.Vector3().lerpVectors(a, m, 0.5)
  q1.y -= sag * 0.35
  const q2 = new THREE.Vector3().lerpVectors(m, b, 0.5)
  q2.y -= sag * 0.35
  return new THREE.CatmullRomCurve3([a, q1, m, q2, b])
}
const WIRE = () => mat('#2A3142', { roughness: 0.5 })
function wire(c: THREE.Curve<THREE.Vector3>, r = 0.022) {
  const o = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 6, false), WIRE())
  o.castShadow = true
  return o
}

/** glowing power pulses riding a path while `amt` > 0 */
/** a path through several curves, sampled once into a polyline with arc-length lookup (robust at the ends) */
function polyPath(curves: THREE.Curve<THREE.Vector3>[]) {
  const pts: THREE.Vector3[] = []
  for (const c of curves) {
    const p = c.getPoints(40)
    if (pts.length && pts[pts.length - 1].distanceTo(p[0]) < 1e-6) p.shift()
    pts.push(...p)
  }
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + pts[i].distanceTo(pts[i - 1]))
  const total = acc[acc.length - 1]
  return {
    at(u: number, out: THREE.Vector3) {
      const d = Math.min(Math.max(u, 0), 1) * total
      let lo = 0
      let hi = acc.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (acc[mid] < d) lo = mid
        else hi = mid
      }
      const k = (d - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo])
      return out.lerpVectors(pts[lo], pts[hi], k)
    },
  }
}
function pulses(scene: THREE.Scene, path: ReturnType<typeof polyPath>, n: number, r = 0.07, color = '#FFC93C') {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true })
  const list = Array.from({ length: n }, () => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), m)
    scene.add(s)
    return s
  })
  return (t: number, amt: number, speed = 0.18) => {
    m.opacity = amt
    list.forEach((s, i) => {
      const u = (t * speed + i / n) % 1
      path.at(u, s.position)
      s.visible = amt > 0.02
    })
  }
}

/** the electricity meter used on BOTH cards of slide 7: a grey box, a round white dial, a red pointer that turns */
function meter() {
  const g = new THREE.Group()
  g.add(mesh(rbox(0.46, 0.62, 0.2, 0.05), mat('#C9D2DF', { roughness: 0.45, metalness: 0.2 })))
  const face = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), mat('#FFFFFF', { roughness: 0.3 }), [0, 0.07, 0.11])
  face.rotation.x = Math.PI / 2
  g.add(face)
  /* the dial's tick ring */
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const tick = mesh(new THREE.BoxGeometry(0.012, 0.035, 0.01), mat('#5B6F8A'), [Math.sin(a) * 0.14, 0.07 + Math.cos(a) * 0.14, 0.13])
    tick.rotation.z = -a
    g.add(tick)
  }
  const glass = mesh(new THREE.SphereGeometry(0.19, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#DDEBFF', transparent: true, opacity: 0.22, roughness: 0.05 }), [0, 0.07, 0.11])
  glass.rotation.x = Math.PI / 2
  glass.scale.set(1, 0.35, 1)
  g.add(glass)
  const pointer = new THREE.Group()
  pointer.position.set(0, 0.07, 0.135)
  pointer.add(mesh(new THREE.BoxGeometry(0.022, 0.13, 0.012), mat('#E8655A', { emissive: '#E8655A', emissiveIntensity: 0.25 }), [0, 0.06, 0]))
  pointer.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), mat('#22346E'), [0, 0, 0]).rotateX(Math.PI / 2))
  g.add(pointer)
  /* a little window of the counter drum below the dial: a turning cylinder */
  const drum = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16), mat('#22346E'), [0, -0.17, 0.08])
  drum.rotation.z = Math.PI / 2
  g.add(drum)
  return { group: g, pointer, drum }
}

/** the official EC2 mark, rasterised once into a canvas texture (the SVG file, not a redraw) */
let ec2Tex: THREE.Texture | null = null
const ec2Wait: (() => void)[] = []
function loadEc2() {
  if (ec2Tex || typeof window === 'undefined') return
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    c.getContext('2d')!.drawImage(img, 0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    ec2Tex = t
    ec2Wait.splice(0).forEach((f) => f())
  }
  img.src = ec2Url
}
function useEc2Ready() {
  const [ok, setOk] = useState(!!ec2Tex)
  useEffect(() => {
    if (ec2Tex) return setOk(true)
    loadEc2()
    const f = () => setOk(true)
    ec2Wait.push(f)
    return () => {
      const i = ec2Wait.indexOf(f)
      if (i >= 0) ec2Wait.splice(i, 1)
    }
  }, [])
  return ok
}
/** a material using the EC2 mark; the texture is shared, so this material never disposes it */
function ec2Plate(size: number) {
  const m = new THREE.MeshBasicMaterial({ color: ec2Tex ? '#FFFFFF' : '#ED7100' })
  if (ec2Tex) m.map = ec2Tex
  /* keep the shared texture alive across mounts: the stage's dispose walks material values, so hide it there */
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m)
  plate.onBeforeRender = () => {
    if (ec2Tex && m.map !== ec2Tex) {
      m.map = ec2Tex
      m.color.set('#FFFFFF')
      m.needsUpdate = true
    }
  }
  return plate
}

/** a positioned tag (DOM text) at a projected 3D point of a fixed camera */
function projectTo(cam: { pos: [number, number, number]; look: [number, number, number]; fov: number }, p: [number, number, number]) {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.1, 200)
  c.position.set(...cam.pos)
  c.lookAt(...cam.look)
  c.updateMatrixWorld()
  c.updateProjectionMatrix()
  const v = new THREE.Vector3(...p).project(c)
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H] as const
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', borderRadius: 14 }}>
      {children}
    </div>
  )
}

/* ================================================================== SLIDE 7 · EVERYDAY: the house on the grid */

/** the rig gesture that reaches toward the lamp (the lamp stands to her right on screen, so the rig's presentRight) */
const OWNER_GESTURE = 'presentRight'
const CAM7E = { pos: [5.6, 5.0, 15.6] as [number, number, number], look: [-1.7, 3.0, 0] as [number, number, number], fov: 36 }

function setupT01Everyday({ scene, camera, redraw }: StageKit) {
  camera.fov = CAM7E.fov
  camera.position.set(...CAM7E.pos)
  camera.lookAt(...CAM7E.look)
  scene.background = new THREE.Color('#DCE9FB')
  scene.fog = new THREE.Fog('#DCE9FB', 26, 60)
  lightRig(scene, [0, 1, 0])
  scene.add(new THREE.AmbientLight('#FFFFFF', 0.45))

  /* ground: lawn, a pavement and the street in front */
  const grass = canvasTex(256, 256, (g) => speckle(g, 256, 256, '#9CCB8E', 2600, 0.16, 3), [10, 10])
  const ground = mesh(new THREE.PlaneGeometry(80, 80), mat('#FFFFFF', { map: grass, roughness: 0.95 }))
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)
  const asphalt = canvasTex(256, 256, (g) => speckle(g, 256, 256, '#5B6575', 3000, 0.18, 7), [12, 1])
  const road = mesh(new THREE.PlaneGeometry(60, 3.4), mat('#FFFFFF', { map: asphalt, roughness: 0.9 }), [0, 0.01, 5.2])
  road.rotation.x = -Math.PI / 2
  scene.add(road)
  const pave = mesh(new THREE.BoxGeometry(60, 0.08, 1.3), mat('#D7DDE6', { roughness: 0.9 }), [0, 0.04, 2.9])
  scene.add(pave)
  for (let i = -8; i < 8; i++) scene.add(mesh(new THREE.BoxGeometry(1.4, 0.012, 0.12), mat('#FFFFFF'), [i * 3.2, 0.02, 5.2]))
  /* the garden path from the pavement to the door */
  scene.add(mesh(new THREE.BoxGeometry(0.9, 0.05, 1.2), mat('#E4D6C2'), [0.85, 0.03, 2.0]))

  /* ---- the house (front faces +z): walls with a window opening and a door, a gable roof ---- */
  const siding = canvasTex(256, 256, (g) => {
    g.fillStyle = '#F6EFE4'
    g.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 256; y += 16) {
      g.fillStyle = 'rgba(120,96,70,0.13)'
      g.fillRect(0, y, 256, 2)
    }
  }, [2, 2])
  const wallM = mat('#FFFFFF', { map: siding, roughness: 0.85 })
  const house = new THREE.Group()
  const HW = 4.4
  const HH = 2.7
  const HD = 3.4
  const t = 0.12
  const wx0 = -1.75
  const wx1 = 0.15
  const wy0 = 0.85
  const wy1 = 2.15
  /* front wall in four pieces around the window */
  const fz = HD / 2
  const piece = (x0: number, x1: number, y0: number, y1: number) => mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, t), wallM, [(x0 + x1) / 2, (y0 + y1) / 2, fz])
  house.add(piece(-HW / 2, wx0, 0, HH), piece(wx1, HW / 2, 0, HH), piece(wx0, wx1, 0, wy0), piece(wx0, wx1, wy1, HH))
  /* the other walls and the floor */
  house.add(mesh(new THREE.BoxGeometry(HW, HH, t), wallM, [0, HH / 2, -fz]))
  house.add(mesh(new THREE.BoxGeometry(t, HH, HD), wallM, [-HW / 2, HH / 2, 0]))
  house.add(mesh(new THREE.BoxGeometry(t, HH, HD), wallM, [HW / 2, HH / 2, 0]))
  house.add(mesh(new THREE.BoxGeometry(HW, 0.1, HD), mat('#C99A62', { roughness: 0.7 }), [0, 0.05, 0]))
  house.add(mesh(new THREE.BoxGeometry(HW + 0.2, 0.22, HD + 0.2), mat('#BFC7D3', { roughness: 0.9 }), [0, 0.11, 0]))
  /* the inner back wall: it glows warm with the lamp */
  const innerM = mat('#BDB3A4', { roughness: 0.9, emissive: '#FFB347', emissiveIntensity: 0 })
  house.add(mesh(new THREE.PlaneGeometry(HW - 0.3, HH - 0.1), innerM, [0, HH / 2, -fz + 0.07]))
  /* window: frame and glass */
  const frameM = mat('#FFFFFF', { roughness: 0.4 })
  const ww = wx1 - wx0
  const wh = wy1 - wy0
  const wcx = (wx0 + wx1) / 2
  const wcy = (wy0 + wy1) / 2
  house.add(mesh(new THREE.BoxGeometry(ww + 0.12, 0.08, 0.2), frameM, [wcx, wy0, fz + 0.03]))
  house.add(mesh(new THREE.BoxGeometry(ww + 0.12, 0.08, 0.2), frameM, [wcx, wy1, fz + 0.03]))
  house.add(mesh(new THREE.BoxGeometry(0.08, wh, 0.2), frameM, [wx0, wcy, fz + 0.03]))
  house.add(mesh(new THREE.BoxGeometry(0.08, wh, 0.2), frameM, [wx1, wcy, fz + 0.03]))
  house.add(mesh(new THREE.BoxGeometry(0.05, wh, 0.12), frameM, [wcx, wcy, fz + 0.03]))
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshStandardMaterial({ color: '#CFE0FF', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 }))
  glass.position.set(wcx, wcy, fz + 0.02)
  house.add(glass)
  /* the door and its step */
  house.add(mesh(rbox(0.82, 1.95, 0.08, 0.03), mat('#2D63FB', { roughness: 0.5 }), [0.85, 1.0, fz + 0.06]))
  house.add(mesh(new THREE.SphereGeometry(0.04, 12, 12), mat('#F2C14E', { metalness: 0.6, roughness: 0.3 }), [1.13, 1.0, fz + 0.13]))
  /* the electricity meter on the front wall, right of the door */
  const m1 = meter()
  m1.group.position.set(1.72, 1.45, fz + 0.12)
  house.add(m1.group)
  /* gable roof along x */
  const roofM = mat('#22346E', { roughness: 0.7 })
  const ridge = 1.2
  const eave = HD / 2 + 0.3
  const slab = Math.hypot(eave, ridge)
  const ang = Math.atan2(ridge, eave)
  for (const s of [1, -1]) {
    const r = mesh(new THREE.BoxGeometry(HW + 0.5, 0.14, slab + 0.1), roofM, [0, HH + ridge / 2 - 0.05, (s * eave) / 2])
    r.rotation.x = s * ang
    house.add(r)
  }
  const gable = new THREE.Shape()
  gable.moveTo(-HD / 2, 0)
  gable.lineTo(HD / 2, 0)
  gable.lineTo(0, ridge)
  gable.closePath()
  for (const s of [1, -1]) {
    const gm = mesh(new THREE.ExtrudeGeometry(gable, { depth: t, bevelEnabled: false }), wallM)
    gm.rotation.y = Math.PI / 2
    gm.position.set(s * HW / 2 - t / 2, HH, 0)
    house.add(gm)
  }
  /* a chimney */
  house.add(mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat('#C46A4F', { roughness: 0.8 }), [1.3, HH + 1.0, -0.6]))
  house.position.set(0.4, 0, 0)
  scene.add(house)

  /* ---- inside, seen through the window: a floor lamp and the homeowner ---- */
  const lamp = new THREE.Group()
  lamp.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 20), mat('#22346E'), [0, 0.13, 0]))
  lamp.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.65, 10), mat('#22346E'), [0, 0.95, 0]))
  const shadeM = mat('#FFF4DC', { emissive: '#FFC56B', emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide })
  lamp.add(mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.36, 24, 1, true), shadeM, [0, 1.85, 0]))
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({ color: '#FFF1C9' }))
  bulb.position.set(0, 1.78, 0)
  lamp.add(bulb)
  /* the switch on the lamp pole */
  lamp.add(mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), mat('#F2C14E'), [0.05, 1.22, 0.03]))
  lamp.position.set(house.position.x - 0.35, 0.05, 1.05)
  scene.add(lamp)
  const lampLight = new THREE.PointLight('#FFC56B', 0, 6, 1.6)
  lampLight.position.set(lamp.position.x, 1.75, lamp.position.z + 0.2)
  scene.add(lampLight)
  /* a sofa behind */
  scene.add(mesh(rbox(1.6, 0.5, 0.7, 0.12), mat('#12B5A8', { roughness: 0.8 }), [house.position.x - 0.9, 0.35, -1.0]))
  scene.add(mesh(rbox(1.6, 0.6, 0.2, 0.08), mat('#0E9285', { roughness: 0.8 }), [house.position.x - 0.9, 0.7, -1.3]))
  /* the homeowner: a Character Lab character (round 3), happy, reaching to the lamp switch just before each switch */
  const owner = castSprite({
    config: CAST_PRESETS.meera,
    loop: CYCLE,
    frames: 40,
    height: 1.66,
    onReady: redraw,
    timeline: (t) => ({
      seed: 5,
      idle: CAST_IDLE,
      expression: castClip('happy', 0, false),
      gesture: castClip(OWNER_GESTURE, t >= OFF - 1.1 ? OFF - 1.1 : ON - 0.95),
    }),
  })
  owner.object.position.set(house.position.x - 1.15, 0.1, 0.95)
  scene.add(owner.object)

  /* ---- the street pole, its transformer, the service wire ---- */
  const poleM = mat('#8A6A4F', { roughness: 0.85 })
  const PX = -4.6
  const PZ = 3.2
  scene.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 7.2, 12), poleM, [PX, 3.6, PZ]))
  scene.add(mesh(new THREE.BoxGeometry(0.12, 0.12, 1.6), poleM, [PX, 6.8, PZ]))
  const tr = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 20), mat('#9AA6B8', { metalness: 0.3, roughness: 0.4 }), [PX + 0.38, 5.6, PZ])
  scene.add(tr)
  for (const dz of [-0.65, 0, 0.65]) scene.add(mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8), mat('#E9EEF5'), [PX, 6.94, PZ + dz]))
  const poleTop = new THREE.Vector3(PX, 7.0, PZ)
  const houseIn = new THREE.Vector3(house.position.x - HW / 2 - 0.05, HH + 0.35, 0.9)
  const service = wireCurve(new THREE.Vector3(PX + 0.38, 5.9, PZ), houseIn, 0.45)
  scene.add(wire(service))
  /* the bracket where the wire meets the house */
  scene.add(mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), mat('#9AA6B8'), [houseIn.x + 0.06, houseIn.y, houseIn.z]))

  /* ---- the transmission pylons of the grid, far back ---- */
  const steel = mat('#8FA3BF', { metalness: 0.4, roughness: 0.45 })
  const pylon = (x: number, z: number, hgt: number) => {
    const g = new THREE.Group()
    const base = 0.9
    const top = 0.22
    const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const P = (cx: number, cz: number, y: number) => {
      const k = y / hgt
      const s = base + (top - base) * k
      return new THREE.Vector3(cx * s, y, cz * s)
    }
    corners.forEach(([cx, cz]) => g.add(rod(P(cx, cz, 0), P(cx, cz, hgt), 0.05, steel)))
    for (let y = 0; y < hgt - 0.5; y += hgt / 6) {
      corners.forEach(([cx, cz], i) => {
        const [nx, nz] = corners[(i + 1) % 4]
        g.add(rod(P(cx, cz, y), P(nx, nz, y + hgt / 6), 0.025, steel))
      })
    }
    for (const yy of [hgt * 0.78, hgt * 0.95]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 2.6), steel, [0, yy, 0]))
    g.position.set(x, 0, z)
    scene.add(g)
    return g
  }
  pylon(-9.5, -9, 8.5)
  pylon(-20, -20, 8.5)
  const pyA = new THREE.Vector3(-9.5, 8.5 * 0.95, -9 + 1.2)
  const pyA2 = new THREE.Vector3(-9.5, 8.5 * 0.95, -9 - 1.2)
  const pyB = new THREE.Vector3(-20, 8.5 * 0.95, -20 + 1.2)
  const pyB2 = new THREE.Vector3(-20, 8.5 * 0.95, -20 - 1.2)
  scene.add(wire(wireCurve(pyB, pyA, 1.2), 0.03), wire(wireCurve(pyB2, pyA2, 1.2), 0.03))
  const gridToPole = wireCurve(pyA, poleTop.clone().add(new THREE.Vector3(0, 0, 0.65)), 1.0)
  scene.add(wire(gridToPole, 0.028), wire(wireCurve(pyA2, poleTop.clone().add(new THREE.Vector3(0, 0, -0.65)), 1.0), 0.028))
  /* pole top to the transformer */
  const toTr = new THREE.LineCurve3(poleTop.clone().add(new THREE.Vector3(0, 0, 0.65)), new THREE.Vector3(PX + 0.38, 5.9, PZ))
  scene.add(wire(toTr, 0.02))
  /* the path the power travels: pylon → pole → transformer → house → meter */
  const path = polyPath([
    wireCurve(pyB, pyA, 1.2),
    gridToPole,
    toTr,
    service,
    new THREE.LineCurve3(houseIn, new THREE.Vector3(house.position.x + 1.72, 1.6, HD / 2 + 0.25)),
  ])
  const flow = pulses(scene, path, 14, 0.085)

  /* trees and a fence for a real street */
  const tree = (x: number, z: number, s = 1) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 1.2 * s, 8), mat('#8A6A4F'), [x, 0.6 * s, z]))
    scene.add(mesh(new THREE.SphereGeometry(0.75 * s, 16, 12), mat('#5DBB7A', { roughness: 0.9 }), [x, 1.6 * s, z]))
    scene.add(mesh(new THREE.SphereGeometry(0.55 * s, 16, 12), mat('#4FA86A', { roughness: 0.9 }), [x + 0.35 * s, 1.95 * s, z - 0.2]))
  }
  tree(4.4, -0.6, 1.25)
  tree(-2.6, -4.5, 1.1)
  tree(7.5, -5, 1.2)
  for (let i = 0; i < 10; i++) scene.add(mesh(new THREE.BoxGeometry(0.08, 0.6, 0.06), mat('#FFFFFF'), [2.9 + i * 0.32, 0.3, 2.3]))
  scene.add(mesh(new THREE.BoxGeometry(3.0, 0.06, 0.05), mat('#FFFFFF'), [4.35, 0.5, 2.3]))

  return (time: number) => {
    const c = ((time % CYCLE) + CYCLE) % CYCLE
    const on = onAmt(time)
    shadeM.emissiveIntensity = 2.2 * on
    ;(bulb.material as THREE.MeshBasicMaterial).color.setStyle(on > 0.5 ? '#FFF1C9' : '#D9D4C8')
    lampLight.intensity = 9 * on
    innerM.emissiveIntensity = 0.75 * on
    m1.pointer.rotation.z = -meterAngle(time)
    m1.drum.rotation.x = meterAngle(time) * 0.3
    flow(time, on)
    /* the homeowner's rig loop (reach, switch, smile) runs on the same clock as the lamp */
    owner.update(c, camera)
  }
}

/* ================================================================== SLIDE 7 · CONCEPT: the instance on the busway */

const CAM7C = { pos: [2.4, 2.7, 7.4] as [number, number, number], look: [-0.5, 1.45, 0] as [number, number, number], fov: 38 }

function setupT01Concept({ scene, camera }: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }) {
  camera.fov = CAM7C.fov
  camera.position.set(...CAM7C.pos)
  camera.lookAt(...CAM7C.look)
  scene.background = new THREE.Color('#E6EDF8')
  scene.fog = new THREE.Fog('#E6EDF8', 14, 34)
  lightRig(scene, [0, 1, 0])
  scene.add(new THREE.AmbientLight('#FFFFFF', 0.45))

  /* raised floor tiles */
  const tiles = canvasTex(256, 256, (g) => {
    g.fillStyle = '#E3E9F4'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(91,111,138,0.25)'
    g.lineWidth = 3
    g.strokeRect(1, 1, 254, 254)
    g.fillStyle = 'rgba(91,111,138,0.18)'
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) g.fillRect(40 + i * 35, 40 + j * 35, 6, 6)
  }, [16, 16])
  const floor = mesh(new THREE.PlaneGeometry(40, 40), mat('#FFFFFF', { map: tiles, roughness: 0.8 }))
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  /* back wall */
  scene.add(mesh(new THREE.BoxGeometry(40, 6, 0.2), mat('#EEF3FB', { roughness: 0.9 }), [0, 3, -6]))

  /* racks: a front row and a back row */
  const rackM = mat('#1F2E63', { roughness: 0.55, metalness: 0.25 })
  const unitM = mat('#2B3B74', { roughness: 0.5, metalness: 0.2 })
  const ledM = (c: string) => new THREE.MeshBasicMaterial({ color: c })
  const blinkers: { m: THREE.MeshBasicMaterial; ph: number }[] = []
  const rack = (x: number, z: number, units: number, skip = -1) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.BoxGeometry(0.78, 2.3, 1.1), rackM, [0, 1.15, 0]))
    for (let i = 0; i < units; i++) {
      if (i === skip || i === skip + 1 || i === skip + 2) continue
      const y = 0.35 + i * 0.2
      g.add(mesh(new THREE.BoxGeometry(0.66, 0.16, 0.06), unitM, [0, y, 0.56]))
      const m = ledM('#3DBB7A')
      blinkers.push({ m, ph: Math.random() * 6 })
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.01), m).translateX(0.24).translateY(y).translateZ(0.595))
    }
    g.position.set(x, 0, z)
    scene.add(g)
    return g
  }
  rack(-2.6, 0, 9)
  rack(-1.75, 0, 9)
  const main = rack(-0.9, 0, 9, 3)
  rack(-0.05, 0, 9)
  rack(0.8, 0, 9)
  for (let i = 0; i < 7; i++) rack(-4.6 + i * 0.85, -4.6, 0)

  /* THE INSTANCE: a 3-unit server in the middle rack, the EC2 mark on its face, lights and fans */
  const inst = new THREE.Group()
  inst.add(mesh(rbox(0.7, 0.56, 0.3, 0.03), mat('#F5F8FF', { roughness: 0.35, metalness: 0.15 }), [0, 0, 0]))
  const plate = ec2Plate(0.34)
  plate.position.set(-0.16, 0, 0.155)
  inst.add(plate)
  const ledA = new THREE.MeshBasicMaterial({ color: '#5B6F8A' })
  const ledB = new THREE.MeshBasicMaterial({ color: '#5B6F8A' })
  inst.add(new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), ledA).translateX(0.12).translateY(0.17).translateZ(0.156))
  inst.add(new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), ledB).translateX(0.22).translateY(0.17).translateZ(0.156))
  const fans: THREE.Group[] = []
  for (const fx of [0.12, 0.25]) {
    const f = new THREE.Group()
    f.position.set(fx, -0.07, 0.157)
    f.add(new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ color: '#22346E' })))
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.1), new THREE.MeshBasicMaterial({ color: '#8FA3BF' }))
      blade.position.z = 0.002
      blade.rotation.z = (b * Math.PI) / 2
      f.add(blade)
    }
    inst.add(f)
    fans.push(f)
  }
  inst.position.set(main.position.x, 0.35 + 3 * 0.2 + 0.2, 0.62)
  scene.add(inst)
  /* its glow ring while running */
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.72), new THREE.MeshBasicMaterial({ color: '#3DBB7A', transparent: true, opacity: 0 }))
  halo.position.set(inst.position.x, inst.position.y, inst.position.z - 0.14)
  scene.add(halo)

  /* the overhead busway (the data centre's own grid) and the drop cable into the rack */
  const bus = mesh(new THREE.BoxGeometry(9, 0.16, 0.3), mat('#9AA6B8', { metalness: 0.4, roughness: 0.4 }), [-0.9, 3.05, 0.2])
  scene.add(bus)
  for (const x of [-4, -0.9, 2.4]) scene.add(mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), mat('#9AA6B8'), [x, 3.5, 0.2]))
  const tap = mesh(new THREE.BoxGeometry(0.22, 0.24, 0.3), mat('#F2C14E', { roughness: 0.5 }), [main.position.x, 2.85, 0.2])
  scene.add(tap)
  const drop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(main.position.x, 2.72, 0.25),
    new THREE.Vector3(main.position.x + 0.05, 2.45, 0.45),
    new THREE.Vector3(main.position.x + 0.35, 1.6, 0.66),
    new THREE.Vector3(inst.position.x + 0.36, inst.position.y + 0.05, 0.62),
  ])
  scene.add(wire(drop, 0.025))
  const busPath = polyPath([
    new THREE.LineCurve3(new THREE.Vector3(-5.2, 3.05, 0.38), new THREE.Vector3(main.position.x, 3.05, 0.38)),
    new THREE.LineCurve3(new THREE.Vector3(main.position.x, 3.05, 0.38), new THREE.Vector3(main.position.x, 2.72, 0.25)),
    drop,
  ])
  const flow = pulses(scene, busPath, 10, 0.06)

  /* the same meter, on a post beside the rack: it turns only while the instance runs */
  const m2 = meter()
  m2.group.position.set(1.85, 1.55, 0.9)
  m2.group.rotation.y = -0.35
  scene.add(m2.group)
  scene.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.25, 10), mat('#8FA3BF', { metalness: 0.3 }), [1.85, 0.62, 0.85]))
  scene.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.06, 20), mat('#8FA3BF'), [1.85, 0.03, 0.85]))
  /* a meter cable from the drop to the meter */
  scene.add(wire(new THREE.CatmullRomCurve3([new THREE.Vector3(main.position.x + 0.4, 0.5, 0.6), new THREE.Vector3(0.6, 0.06, 0.95), new THREE.Vector3(1.6, 0.06, 0.95), new THREE.Vector3(1.85, 0.4, 0.85)]), 0.02))

  return (time: number) => {
    const c = ((time % CYCLE) + CYCLE) % CYCLE
    const on = onAmt(time)
    /* pending (amber blink) just before ON, running green, stopped grey */
    const pending = c > ON - 0.7 && c < ON + 0.35
    const col = on > 0.5 ? '#3DBB7A' : pending ? (Math.floor(time * 6) % 2 ? '#F5A623' : '#5B6F8A') : '#5B6F8A'
    ledA.color.setStyle(col)
    ledB.color.setStyle(on > 0.5 ? (Math.floor(time * 5) % 3 ? '#3DBB7A' : '#9BE3B8') : '#5B6F8A')
    fans.forEach((f) => (f.rotation.z = -meterAngle(time) * 6))
    ;(halo.material as THREE.MeshBasicMaterial).opacity = 0.32 * on
    m2.pointer.rotation.z = -meterAngle(time)
    m2.drum.rotation.x = meterAngle(time) * 0.3
    flow(time, on, 0.22)
    blinkers.forEach((b) => b.m.color.setStyle(Math.sin(time * 3 + b.ph) > 0.6 ? '#9BE3B8' : '#3DBB7A'))
  }
}

/* ================================================================== SLIDE 17 · EVERYDAY: the road trip */

function car(kind: 'sedan' | 'sports' | 'van', color: string) {
  const g = new THREE.Group()
  const paint = mat(color, { roughness: 0.32, metalness: 0.35 })
  const glassM = new THREE.MeshStandardMaterial({ color: '#BFD6F5', transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.3 })
  const tyreM = mat('#1B1F2E', { roughness: 0.8 })
  const rimM = mat('#C9D2DF', { metalness: 0.6, roughness: 0.3 })
  const red = new THREE.MeshStandardMaterial({ color: '#E8433A', emissive: '#E8433A', emissiveIntensity: 0.7 })
  const wheels: THREE.Group[] = []
  const dims = kind === 'van' ? { L: 5.0, Wd: 2.0, bh: 0.95, wy: 0.4, cl: 0, ch: 0 } : kind === 'sports' ? { L: 4.3, Wd: 1.9, bh: 0.5, wy: 0.34, cl: 1.6, ch: 0.42 } : { L: 4.5, Wd: 1.82, bh: 0.62, wy: 0.36, cl: 2.3, ch: 0.58 }
  const { L, Wd, bh, wy } = dims
  if (kind === 'van') {
    /* a tall body; the rear doors' glass shows the luggage stacked in the big boot */
    /* lower body (full length), then a hollow upper box: two sides, roof, front; the rear is a big glazed door */
    g.add(mesh(rbox(Wd, 0.75, L, 0.14), paint, [0, wy + 0.42, 0]))
    const UH = 1.15
    const uy = wy + 0.78 + UH / 2
    g.add(mesh(new THREE.BoxGeometry(0.07, UH, L - 0.1), paint, [-Wd / 2 + 0.035, uy, -0.05]))
    g.add(mesh(new THREE.BoxGeometry(0.07, UH, L - 0.1), paint, [Wd / 2 - 0.035, uy, -0.05]))
    g.add(mesh(rbox(Wd, 0.09, L - 0.05, 0.04), paint, [0, wy + 0.78 + UH, -0.02]))
    g.add(mesh(new THREE.BoxGeometry(Wd, UH, 0.07), paint, [0, uy, -L / 2 + 0.6]))
    g.add(mesh(rbox(Wd * 0.92, 0.6, 0.9, 0.08), glassM, [0, wy + 1.25, -L / 2 + 0.35]))
    const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.14, UH - 0.12), glassM)
    rearGlass.position.set(0, uy, L / 2 - 0.08)
    g.add(rearGlass)
    g.add(mesh(new THREE.BoxGeometry(0.05, UH, 0.04), paint, [0, uy, L / 2 - 0.07]))
    g.add(mesh(new THREE.BoxGeometry(Wd, 0.06, 0.06), paint, [0, wy + 0.78 + 0.03, L / 2 - 0.07]))
    /* the big boot, full of luggage */
    const bags = ['#FF8A3D', '#12B5A8', '#F2C14E', '#E8655A', '#2D63FB', '#8FA3BF']
    bags.forEach((c, i) => g.add(mesh(rbox(0.52, 0.42, 0.62, 0.06), mat(c), [-0.56 + (i % 3) * 0.56, wy + 1.04 + Math.floor(i / 3) * 0.43, L / 2 - 0.5])))
    g.add(mesh(new THREE.BoxGeometry(Wd * 0.96, 0.12, 0.16), mat('#1B1F2E'), [0, wy + 0.15, L / 2 + 0.02]))
  } else {
    g.add(mesh(rbox(Wd, bh, L, 0.16), paint, [0, wy + bh / 2, 0]))
    const cab = mesh(rbox(Wd * 0.86, dims.ch, dims.cl, 0.14), glassM, [0, wy + bh + dims.ch / 2 - 0.02, kind === 'sports' ? -0.1 : -0.05])
    g.add(cab)
    g.add(mesh(rbox(Wd * 0.88, 0.06, dims.cl * 0.9, 0.03), paint, [0, wy + bh + dims.ch - 0.02, kind === 'sports' ? -0.1 : -0.05]))
    if (kind === 'sports') {
      g.add(mesh(new THREE.BoxGeometry(Wd * 0.9, 0.05, 0.3), paint, [0, wy + bh + 0.22, L / 2 - 0.2]))
      for (const s of [-0.6, 0.6]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.22, 0.08), paint, [s, wy + bh + 0.1, L / 2 - 0.2]))
    }
    g.add(mesh(new THREE.BoxGeometry(Wd * 0.96, 0.12, 0.16), mat('#1B1F2E'), [0, wy + 0.1, L / 2 + 0.02]))
  }
  for (const s of [-1, 1]) g.add(mesh(rbox(0.36, 0.14, 0.06, 0.03), red, [s * (Wd / 2 - 0.3), wy + (kind === 'van' ? 0.55 : bh * 0.72), L / 2 + 0.01]))
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const w = new THREE.Group()
      const tyre = mesh(new THREE.CylinderGeometry(wy, wy, 0.28, 20), tyreM)
      tyre.rotation.z = Math.PI / 2
      w.add(tyre)
      const rim = mesh(new THREE.CylinderGeometry(wy * 0.55, wy * 0.55, 0.3, 6), rimM)
      rim.rotation.z = Math.PI / 2
      w.add(rim)
      w.position.set(sx * (Wd / 2 - 0.08), wy, sz * (L / 2 - 0.85))
      g.add(w)
      wheels.push(w)
    }
  }
  return { group: g, wheels, top: wy + bh }
}

const CAM17E = { pos: [1.2, 5.0, 12.4] as [number, number, number], look: [-0.6, 0.6, -4] as [number, number, number], fov: 40 }

function setupT06Everyday({ scene, camera }: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }) {
  camera.fov = CAM17E.fov
  camera.position.set(...CAM17E.pos)
  camera.lookAt(...CAM17E.look)
  scene.background = new THREE.Color('#DCE9FB')
  scene.fog = new THREE.Fog('#DCE9FB', 22, 52)
  lightRig(scene, [0, 0, -2])
  scene.add(new THREE.AmbientLight('#FFFFFF', 0.35))

  const grass = canvasTex(256, 256, (g) => speckle(g, 256, 256, '#9CCB8E', 2600, 0.16, 5), [14, 14])
  const ground = mesh(new THREE.PlaneGeometry(120, 120), mat('#FFFFFF', { map: grass, roughness: 0.95 }))
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)
  /* a three-lane road running away from the camera */
  const asphalt = canvasTex(256, 256, (g) => speckle(g, 256, 256, '#5B6575', 3200, 0.18, 9), [3, 24])
  const road = mesh(new THREE.PlaneGeometry(10.4, 120), mat('#FFFFFF', { map: asphalt, roughness: 0.9 }), [0, 0.01, -30])
  road.rotation.x = -Math.PI / 2
  scene.add(road)
  for (const x of [-5.25, 5.25]) scene.add(mesh(new THREE.BoxGeometry(0.2, 0.12, 120), mat('#D7DDE6'), [x, 0.06, -30]))
  /* moving parts of the world: lane dashes, trees, lamp posts, houses, all scrolling toward the camera */
  const movers: { o: THREE.Object3D; z0: number; span: number }[] = []
  const SPAN = 64
  const dashM = mat('#FFFFFF', { roughness: 0.6 })
  for (const x of [-1.73, 1.73]) {
    for (let i = 0; i < 16; i++) {
      const d = mesh(new THREE.BoxGeometry(0.14, 0.015, 1.6), dashM, [x, 0.02, 0])
      scene.add(d)
      movers.push({ o: d, z0: 14 - i * 4, span: SPAN })
    }
  }
  for (const x of [-5.15, 5.15]) for (let i = 0; i < 16; i++) {
    const d = mesh(new THREE.BoxGeometry(0.1, 0.015, 2.2), dashM, [x, 0.13, 0])
    d.visible = false
    scene.add(d)
  }
  const tree = (x: number) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), mat('#8A6A4F'), [0, 0.7, 0]))
    g.add(mesh(new THREE.SphereGeometry(0.9, 16, 12), mat('#5DBB7A', { roughness: 0.9 }), [0, 1.9, 0]))
    g.add(mesh(new THREE.SphereGeometry(0.62, 14, 10), mat('#4FA86A', { roughness: 0.9 }), [0.4, 2.3, -0.2]))
    g.position.x = x
    return g
  }
  const lampPost = (x: number) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 4, 10), mat('#5B6F8A', { metalness: 0.3 }), [0, 2, 0]))
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.08, 0.14), mat('#5B6F8A'), [x > 0 ? -0.4 : 0.4, 3.95, 0]))
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), mat('#F5F8FF', { emissive: '#FFF1C9', emissiveIntensity: 0.3 }), [x > 0 ? -0.75 : 0.75, 3.88, 0]))
    g.position.x = x
    return g
  }
  const houseAt = (x: number, color: string) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.BoxGeometry(2.6, 2, 2.4), mat(color, { roughness: 0.85 }), [0, 1, 0]))
    const roof = mesh(new THREE.ConeGeometry(2.1, 1.1, 4), mat('#22346E', { roughness: 0.7 }), [0, 2.55, 0])
    roof.rotation.y = Math.PI / 4
    g.add(roof)
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.6, 0.05), mat('#CFE0FF', { roughness: 0.1 }), [x > 0 ? -1.31 : 1.31, 1.2, 0]).rotateY(Math.PI / 2))
    g.position.x = x
    return g
  }
  for (let i = 0; i < 8; i++) {
    const tl = tree(-7.2 - (i % 2) * 1.6)
    const tr2 = tree(7.4 + ((i + 1) % 2) * 1.4)
    scene.add(tl, tr2)
    movers.push({ o: tl, z0: 10 - i * 8, span: SPAN }, { o: tr2, z0: 6 - i * 8, span: SPAN })
  }
  for (let i = 0; i < 4; i++) {
    const a = lampPost(-5.8)
    const b = lampPost(5.8)
    scene.add(a, b)
    movers.push({ o: a, z0: 12 - i * 16, span: SPAN }, { o: b, z0: 4 - i * 16, span: SPAN })
  }
  const hc = ['#F6EFE4', '#FDE7CF', '#E3ECFB', '#F3E6D2']
  for (let i = 0; i < 4; i++) {
    const a = houseAt(-11.5, hc[i])
    const b = houseAt(12, hc[(i + 2) % 4])
    scene.add(a, b)
    movers.push({ o: a, z0: 2 - i * 16, span: SPAN }, { o: b, z0: -6 - i * 16, span: SPAN })
  }

  /* the three vehicles: the big-boot van (left lane), the family sedan (middle), the sports car (right lane) */
  const van = car('van', '#E3E9F4')
  van.group.position.set(-3.46, 0, -1.2)
  scene.add(van.group)
  const sedan = car('sedan', colors.brand)
  sedan.group.position.set(0, 0, -2.6)
  scene.add(sedan.group)
  const sports = car('sports', '#E8433A')
  sports.group.position.set(3.46, 0, 0)
  scene.add(sports.group)
  /* the family inside the sedan: two adults in front, a child behind */
  const fam: Person[] = []
  /* round 3 (user): the heads stuck out above the roof. The cabin runs from the body top (sedan.top) to the roof at
     sedan.top + 0.56; a head (radius 0.17, hair to 0.19) is centred at headY so its crown stays 0.08 under the roof */
  const ROOF = sedan.top + 0.56
  const seat = (x: number, z: number, o: Parameters<typeof person>[0], s = 1) => {
    const p = person({ ...o, scale: s })
    p.legL.visible = p.legR.visible = false
    const headY = ROOF - 0.08 - 0.19 * s - (s < 1 ? 0.06 : 0)
    p.root.position.set(x, headY - 1.62 * s, z)
    p.root.rotation.y = Math.PI
    sedan.group.add(p.root)
    fam.push(p)
  }
  seat(-0.4, -0.35, { skin: '#E9B48F', hair: '#3A2A22', top: '#22346E' })
  seat(0.4, -0.35, { skin: '#C98F6A', hair: '#1B1F2E', top: '#FF8A3D', long: true })
  seat(0.35, 0.65, { skin: '#E9B48F', hair: '#8A5A3C', top: '#12B5A8' }, 0.72)
  /* a weekend bag on the sedan's parcel shelf: a modest boot */
  sedan.group.add(mesh(rbox(0.5, 0.26, 0.4, 0.05), mat('#F2C14E'), [-0.3, sedan.top + 0.14, 1.2]))

  return (t: number) => {
    const speed = 7
    for (const m of movers) {
      const z = m.z0 + ((t * speed) % m.span)
      m.o.position.z = z > 16 ? z - m.span : z
    }
    /* the sports car is the fastest: it keeps overtaking, coming from behind the camera and vanishing far ahead */
    const sp = ((t * 5.5) % 40)
    sports.group.position.z = 7.5 - sp
    sports.group.position.y = 0.01 * Math.sin(t * 9)
    /* the van keeps pace, a gentle sway under its load; the sedan steady and balanced */
    van.group.position.z = -1.2 + 0.5 * Math.sin(t * 0.5)
    van.group.rotation.z = 0.012 * Math.sin(t * 2.1)
    sedan.group.position.y = 0.012 * Math.sin(t * 3.3)
    const rot = t * speed * 2.6
    for (const w of [...van.wheels, ...sedan.wheels]) w.rotation.x = -rot
    for (const w of sports.wheels) w.rotation.x = -rot * 1.7
    fam[2].head.rotation.y = 0.5 * Math.sin(t * 0.8)
    fam[1].head.rotation.y = 0.25 * Math.sin(t * 0.6 + 1)
  }
}

/* ================================================================== SLIDE 17 · CONCEPT: three instances */

const CAM17C = { pos: [1.4, 3.0, 9.8] as [number, number, number], look: [0, 1.2, 0] as [number, number, number], fov: 34 }
const CPU_C = colors.brand
const MEM_C = colors.teal
/** columns per cabinet: [cpu units, memory units], left to right: memory maximised, balanced, CPU maximised */
const CABS: [number, number][] = [[2, 7], [4, 4], [7, 2]]
const CAB_X = [-2.05, 0, 2.05]
const UNIT_H = 0.24

function setupT06Concept({ scene, camera }: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }) {
  camera.fov = CAM17C.fov
  camera.position.set(...CAM17C.pos)
  camera.lookAt(...CAM17C.look)
  scene.background = new THREE.Color('#E6EDF8')
  scene.fog = new THREE.Fog('#E6EDF8', 16, 34)
  lightRig(scene, [0, 1, 0])
  scene.add(new THREE.AmbientLight('#FFFFFF', 0.45))
  const tiles = canvasTex(256, 256, (g) => {
    g.fillStyle = '#E3E9F4'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(91,111,138,0.22)'
    g.lineWidth = 3
    g.strokeRect(1, 1, 254, 254)
  }, [18, 18])
  const floor = mesh(new THREE.PlaneGeometry(40, 40), mat('#FFFFFF', { map: tiles, roughness: 0.8 }))
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  scene.add(mesh(new THREE.BoxGeometry(40, 6, 0.2), mat('#EEF3FB', { roughness: 0.9 }), [0, 3, -5]))
  /* back-row racks for the room */
  for (let i = 0; i < 9; i++) scene.add(mesh(new THREE.BoxGeometry(0.78, 2.3, 1.0), mat('#1F2E63', { roughness: 0.55, metalness: 0.25 }), [-4 + i * 0.95, 1.15, -3.4]))

  const frameM = mat('#1F2E63', { roughness: 0.5, metalness: 0.3 })
  const backM = mat('#3A4C8A', { roughness: 0.6 })
  const units: { m: THREE.MeshStandardMaterial; col: 0 | 1; i: number; cab: number; n: number }[] = []
  const beams: THREE.Mesh[] = []
  CABS.forEach(([cpu, memN], ci) => {
    const g = new THREE.Group()
    const CW = 1.5
    const CH = 2.55
    const CD = 0.95
    /* the open cabinet: sides, top, plinth, back panel */
    g.add(mesh(new THREE.BoxGeometry(0.08, CH, CD), frameM, [-CW / 2, CH / 2, 0]))
    g.add(mesh(new THREE.BoxGeometry(0.08, CH, CD), frameM, [CW / 2, CH / 2, 0]))
    g.add(mesh(new THREE.BoxGeometry(CW + 0.08, 0.08, CD), frameM, [0, CH, 0]))
    g.add(mesh(new THREE.BoxGeometry(CW + 0.08, 0.14, CD), frameM, [0, 0.07, 0]))
    g.add(mesh(new THREE.BoxGeometry(CW, CH, 0.05), backM, [0, CH / 2, -CD / 2]))
    /* the two columns: CPU chips (left), memory sticks (right) */
    const col = (n: number, x: number, kind: 0 | 1) => {
      /* a pivot post under the beam's centre */
      for (let i = 0; i < n; i++) {
        const y = 0.24 + i * UNIT_H
        const color = kind === 0 ? CPU_C : MEM_C
        const m = mat(color, { roughness: 0.4, metalness: 0.2, emissive: color, emissiveIntensity: 0.05 })
        if (kind === 0) {
          /* a CPU: a square package with a lid */
          g.add(mesh(rbox(0.56, 0.16, 0.56, 0.03), m, [x, y, 0.05]))
          g.add(mesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), mat('#C9D2DF', { metalness: 0.7, roughness: 0.25 }), [x, y + 0.09, 0.05]))
        } else {
          /* a memory stick: a long thin board with chips and gold contacts */
          g.add(mesh(new THREE.BoxGeometry(0.62, 0.16, 0.06), m, [x, y, 0.2]))
          for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.1, 0.09, 0.03), mat('#1B1F2E'), [x - 0.22 + k * 0.145, y + 0.01, 0.24]))
          g.add(mesh(new THREE.BoxGeometry(0.6, 0.03, 0.065), mat('#F2C14E', { metalness: 0.7, roughness: 0.3 }), [x, y - 0.075, 0.2]))
        }
        units.push({ m, col: kind, i, cab: ci, n })
      }
    }
    col(cpu, -0.36, 0)
    col(memN, 0.38, 1)
    /* the beam across the column tops: level only on the balanced instance */
    const topC = 0.24 + (cpu - 1) * UNIT_H + 0.16
    const topM = 0.24 + (memN - 1) * UNIT_H + 0.16
    const span = Math.hypot(0.74, topM - topC) + 0.36
    const beam = mesh(rbox(span, 0.06, 0.12, 0.03), mat(ci === 1 ? '#3DBB7A' : '#8FA3BF', { emissive: ci === 1 ? '#3DBB7A' : '#000000', emissiveIntensity: ci === 1 ? 0.35 : 0 }), [0.01, (topC + topM) / 2 + 0.06, 0.12])
    beam.rotation.z = Math.atan2(topM - topC, 0.74)
    g.add(beam)
    beams.push(beam)
    /* round 3 (user): the two grey beams on the lopsided cabinets stuck out past the columns and said nothing the
       column heights do not already say: only the balanced instance keeps its (green, level) beam */
    beam.visible = ci === 1
    g.position.set(CAB_X[ci], 0, 0)
    scene.add(g)
  })

  return (t: number) => {
    /* work pulses climb each column; the balanced cabinet's two columns climb together */
    for (const u of units) {
      /* one climb per column, then the next climb starts at once (round 3: near-instant loop restart) */
      const period = u.n * 0.45 + 0.75
      const ph = (((t * 1.6 - u.i * 0.45 + u.cab * 0.7 + u.col * (u.cab === 1 ? 0 : 1.3)) % period) + period) % period
      const k = ph > 0 && ph < 0.6 ? Math.sin((ph / 0.6) * Math.PI) : 0
      u.m.emissiveIntensity = 0.05 + 0.55 * k
    }
    /* the side beams rock under their lopsided load; the middle one holds level */
    beams.forEach((b, i) => {
      if (i === 1) return
      const base = i === 0 ? Math.atan2((7 - 2) * UNIT_H, 0.74) : -Math.atan2((7 - 2) * UNIT_H, 0.74)
      b.rotation.z = base + 0.05 * Math.sin(t * 1.4 + i)
    })
  }
}

/* ================================================================== the figures */

function T01Everyday({ step }: { step: number }) {
  return (
    <Frame>
      <ThreeStage w={W} h={H} step={step} setup={setupT01Everyday} holdT={3.2} />
    </Frame>
  )
}
function T01Concept({ step }: { step: number }) {
  const ready = useEc2Ready()
  return (
    <Frame>
      <ThreeStage key={ready ? 'r' : 'w'} w={W} h={H} step={step} setup={setupT01Concept} holdT={3.2} />
    </Frame>
  )
}
function T06Everyday({ step }: { step: number }) {
  return (
    <Frame>
      <ThreeStage w={W} h={H} step={step} setup={setupT06Everyday} holdT={2.2} />
    </Frame>
  )
}

/** the two tags the user allowed (Memory, CPU), above the tall columns of the two maximised instances */
function T06Concept({ step }: { step: number }) {
  const memTop = projectTo(CAM17C, [CAB_X[0] + 0.38, 0.24 + 6 * UNIT_H + 0.62, 0.2])
  const cpuTop = projectTo(CAM17C, [CAB_X[2] - 0.36, 0.24 + 6 * UNIT_H + 0.62, 0.05])
  const tag = (p: readonly [number, number], text: string) => (
    <div style={{ position: 'absolute', left: p[0], top: p[1], transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
      <Label tone="brand" size={14} strong raised>
        {text}
      </Label>
    </div>
  )
  return (
    <Frame>
      <ThreeStage w={W} h={H} step={step} setup={setupT06Concept} holdT={1.5} />
      {tag(memTop, 'Memory')}
      {tag(cpuTop, 'CPU')}
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  F_T01Everyday: T01Everyday as unknown as (p: Record<string, unknown>) => ReactNode,
  F_T01Concept: T01Concept as unknown as (p: Record<string, unknown>) => ReactNode,
  F_T06Everyday: T06Everyday as unknown as (p: Record<string, unknown>) => ReactNode,
  F_T06Concept: T06Concept as unknown as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}
export const css = ''
