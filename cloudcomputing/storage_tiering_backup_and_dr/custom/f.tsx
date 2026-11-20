import type { ReactNode } from 'react'
import { useHeld, useLap } from './k'
import { H3, Stage3D, THREE, W3, makeWorld, person, type World } from './w3'
import {
  ROOM, at, atm, coins, lamp, stool, winterBox, backupBox, bankBuilding, bed, blinkRack, bx, cable, calendar, cardboardBox, cartridge, cashBundle, counter, cy, dataCentre, desk, envelope, face, folder,
  garment, ladder, laptop, mediaShredder, monitorR, noticeBoard, notebook, officeBlock, paperSheet, papers, pcTower, photocopier, pick, plant, productShelf, puff,
  pulse, rack, register, ride, roadStrip, room, rug, setLamp, setScreen, shelving, shredder, smoke, spinClock, spray, std, strips, suitcase, tapeLibrary, tint, M,
  van, vault, wallClock, wardrobe, windowPane, type ScreenKind,
} from './r3'
import pMan from './ppl/man.png'
import pMansuit from './ppl/mansuit.png'
import pReception from './ppl/reception.png'
import pWoman from './ppl/woman.png'
import pBag from './ppl/bag.png'
import pBoy from './ppl/boy.png'
import pTabwoman from './ppl/tabwoman.png'
import pSuit from './ppl/suit.png'
import pGirl from './ppl/girl.png'

/**
 * BUILDER F · THE SIX ANALOGY SLIDES OF "STORAGE TIERING, BACKUP & DR", AS REAL PLACES IN REAL-TIME 3D.
 *
 * History: isometric (2026-11-06) → three.js clay scenes (2026-11-07) → tags removed (2026-11-09) → 2026-11-10, the
 * user: "use realistic, real-time interactions and real-world environments; avoid abstract structures or conceptual
 * representations; only realistic 3D visualizations that clearly demonstrate the concepts; no text or labels".
 *
 * So every stage is a room someone has stood in, built from the prop library in `r3.tsx`: the everyday side is the
 * TR's own scene (a bank lobby, an office counter with the street outside, a school corridor, a bedroom with the bank
 * down the road, an office's records, a shop); the concept side is the same story in a data centre, with real kit
 * (server racks and their LEDs, a tape library and its robot picker, fibre cables carrying light pulses, laptops and
 * monitors whose screens change). No floating logos, badges, rings or words: every state is shown in the world
 * (a red ATM lamp, a dark monitor, smoke, a ticked laptop screen, a clock that runs).
 *
 * The build is unchanged: the same press reveals the same part of the story on both stages; after the build the
 * motion loops without pausing (R8.1); `?still`, thumbnails and reduced motion hold a composed final frame.
 */

/* ------------------------------------------------------------------ shared */

/** one camera for every picture: three-quarter view from the front right, a little above head height */
const CAM = { pos: [3.1, 8.1, 14.9] as [number, number, number], aim: [-0.2, 0.75, -0.4] as [number, number, number], fov: 23.5 }

type V3 = [number, number, number]
const sm = (k: number) => {
  const c = Math.min(1, Math.max(0, k))
  return c * c * (3 - 2 * c)
}
/** local progress of t inside [a, b] */
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
function arc(a: V3, b: V3, k: number, lift = 0.5): V3 {
  const e = sm(k)
  const p = lerp3(a, b, e)
  p[1] += Math.sin(e * Math.PI) * lift
  return p
}
function fly(o: THREE.Object3D | undefined, on: boolean, p: V3, spin = 0) {
  if (!o) return
  o.visible = on
  if (on) {
    o.position.set(...p)
    o.rotation.y = spin
  }
}
function put(w: World, key: string, o: THREE.Object3D, x?: number, y = 0, z = 0, ry = 0) {
  if (x !== undefined) at(o, x, y, z, ry)
  w.parts[key] = o
  w.scene.add(o)
  return o
}
function place(w: World, o: THREE.Object3D, x?: number, y = 0, z = 0, ry = 0) {
  if (x !== undefined) at(o, x, y, z, ry)
  w.scene.add(o)
  return o
}
function tree(): THREE.Group {
  const g = new THREE.Group()
  g.add(cy(0.05, 0.07, 0.6, std('#7A5234', { rough: 0.9 })))
  const leaf = std('#4E9E52', { rough: 0.8 })
  const leaf2 = std('#69B65F', { rough: 0.8 })
  for (const [x, y, z, r, m] of [[0, 0.85, 0, 0.32, leaf], [0.15, 1.05, 0.05, 0.24, leaf2], [-0.14, 1.0, -0.06, 0.22, leaf2]] as [number, number, number, number, THREE.Material][]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m)
    s.position.set(x, y, z)
    s.castShadow = true
    g.add(s)
  }
  return g
}
/** a low partition with glass above (a shopfront, a house front), along z at x */
function glassWall(w: World, x: number, z0: number, z1: number, frameC = '#C9D1DC') {
  const d = z1 - z0
  place(w, bx(0.12, 0.85, d, std(frameC, { rough: 0.5 }), x, 0, z0 + d / 2, 0.01))
  const g = face(d, 1.45, M.glass(), 0, 0, 0)
  g.rotation.y = Math.PI / 2
  g.position.set(x, 0.85 + 0.72, z0 + d / 2)
  w.scene.add(g)
  place(w, bx(0.1, 0.06, d, std('#8E99AB'), x, ROOM.h - 0.06, z0 + d / 2, 0.005))
  place(w, bx(0.08, ROOM.h, 0.08, std('#8E99AB'), x, 0, z1, 0.005))
}
type WithCurves = World & { curves?: Record<string, THREE.CatmullRomCurve3> }
function cableIn(w: World, key: string, pts: V3[], color = '#F2A100') {
  const c = cable(pts, color)
  w.scene.add(c.mesh)
  w.parts[key] = c.mesh
  const ww = w as WithCurves
  ww.curves = ww.curves ?? {}
  ww.curves[key] = c.curve
}
const curveOf = (w: World, key: string) => (w as WithCurves).curves?.[key]
const screen = (o: THREE.Object3D | undefined, k: ScreenKind) => setScreen(o, k)
const P0 = (w: World) => w.parts
/**
 * A clock that only ever turns clockwise: the second hand ticks with real seconds; the minute hand advances at real
 * speed plus `extra` turns per second (kept in the clock's own state, so it never jumps back); the hour hand follows
 * the minute hand. Held frames show 10:10:30.
 */
function naturalClock(c: THREE.Object3D | undefined, extra: number, held: boolean) {
  if (!c) return
  const set = (n: string, turns: number) => {
    const o = c.getObjectByName(n)
    if (o) o.rotation.z = -turns * Math.PI * 2
  }
  if (held) {
    set('sec', 0.5)
    set('min', 10 / 60)
    set('hour', (10 + 10 / 60) / 12)
    return
  }
  const u = c.userData as { last?: number; hours?: number }
  const now = performance.now()
  if (u.last === undefined || u.hours === undefined) {
    const d = new Date()
    u.hours = (d.getHours() % 12) + d.getMinutes() / 60
    u.last = now
  }
  const dt = Math.min(0.25, Math.max(0, (now - u.last) / 1000))
  u.last = now
  u.hours += dt * (1 / 3600 + extra)
  set('sec', new Date().getSeconds() / 60)
  set('min', u.hours % 1)
  set('hour', (u.hours % 12) / 12)
}
/** a wall clock keeping real time: the second hand ticks once a second; held frames show 10:10:30 */
function realClock(c: THREE.Object3D | undefined, held: boolean) {
  if (!c) return
  const d = new Date()
  const s = held ? 30 : d.getSeconds()
  const m = held ? 10 : d.getMinutes() + s / 60
  const h = held ? 10 + 10 / 60 : (d.getHours() % 12) + m / 60
  const set = (n: string, turns: number) => {
    const o = c.getObjectByName(n)
    if (o) o.rotation.z = -turns * Math.PI * 2
  }
  set('sec', s / 60)
  set('min', m / 60)
  set('hour', h / 12)
}

/** the wrapper every picture shares */
function Pic({ build, update }: { build: () => World; update: (w: World) => void }) {
  return (
    <div style={{ position: 'relative', width: W3, height: H3 }}>
      <Stage3D build={build} update={update} />
    </div>
  )
}

/* ================================================================== T01 · a bank account and an ATM */

/*
 * TR 1: "Your money in a bank account stays safe even when the nearby ATM is out of service. The money not being
 * lost is durability; the ATM working right now to give you cash is availability. In the same way, a storage
 * service can keep data perfectly safe while being briefly unreachable."
 * Everyday: a bank lobby. The vault in the back wall, its round door open on gold and cash; the ATM at the right.
 *   1 deposits keep going into the vault (the money is safe); 2 the ATM's lamp turns red, its screen shows the
 *   error, the customer walks up, finds it dead, steps back; 3 both at once: the vault still fills while the ATM is down.
 * Concept: a data hall. Storage racks along the back wall, blinking green; the network cabinet that answers users;
 *   a user's laptop on a desk. 1 writes ride the fibre into the racks; 2 the cabinet's beacon turns red and a request
 *   from the laptop comes back refused (the screen shows the error); 3 both at once.
 */
const T01_RACKS = [-2.55, -1.85, -1.15]
function buildT01(concept: boolean): World {
  const w = makeWorld(CAM)
  if (!concept) {
    room(w, { floor: 'marble', wall: '#F1ECE3', leftDepth: 2.8 })
    put(w, 'vault', vault(), -1.65, 0, -1.5)
    put(w, 'atm', atm(), 1.55, 0, -1.72)
    place(w, plant(1.1), 2.75, 0, -1.8)
    place(w, plant(0.9), -2.85, 0, 0.35)
    place(w, bx(1.0, 0.42, 0.42, M.wood('#8A5A32'), 0.15, 0, -1.85, 0.03))
    place(w, rug(1.6, 1.0, '#8E3B46'), 0.6, 0.02, 0.55)
    put(w, 'who', person(pMan, 1.75, 0.45, 0.85))
    put(w, 'cash', cashBundle())
  } else {
    room(w, { floor: 'dc', wall: '#E3E8EE', leftDepth: 2.8 })
    T01_RACKS.forEach((x, i) => put(w, `rack${i}`, rack({ tone: 'std' }), x, 0, -1.62))
    const gw = rack({ units: 4, tone: 'std' })
    gw.scale.set(0.9, 0.62, 0.8)
    put(w, 'gw', gw, 0.3, 0, -1.7)
    place(w, bx(3.6, 0.05, 0.3, std('#F2C230', { rough: 0.5 }), -1.2, 2.12, -1.75, 0.005))
    place(w, cy(0.09, 0.09, 0.5, std('#D63B3B', { rough: 0.35 }), 1.0, 0, -1.95))
    put(w, 'desk', desk(1.2, 0.62, 0.75), 1.65, 0, 0.35)
    put(w, 'laptop', laptop('list'), 1.5, 0.75, 0.4, -0.35)
    put(w, 'who', person(pTabwoman, 1.7, 2.45, 0.6, true))
    cableIn(w, 'store', [[0.3, 0.03, -1.25], [-0.4, 0.03, -0.95], [-1.15, 0.03, -1.05], [-1.85, 0.03, -1.05], [-2.55, 0.03, -1.12]])
    cableIn(w, 'user', [[1.45, 0.75, 0.25], [1.2, 0.4, 0.12], [1.0, 0.03, 0.0], [0.6, 0.03, -0.6], [0.3, 0.03, -1.25]])
    put(w, 'write', pulse('#7FD8FF'))
    put(w, 'req', pulse('#7FD8FF'))
  }
  return w
}
function T01Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const safe = step >= 1
  const down = step >= 2
  const t = useLap(down, 3600, 0.95)
  const tc = useLap(safe, 2400, 0.99)
  const idle = useLap(true, 12000, 0.3)
  const update = (w: World) => {
    const P = w.parts
    if (!concept) {
      /* 1 the deposit: a bundle from the customer's hand onto the vault's shelf */
      fly(P.cash, safe && !held && tc < 0.85, arc([0.35, 1.15, 0.75], [-1.6, 0.8, -1.75], tc / 0.85, 0.8), tc * 4)
      const light = P.vault?.getObjectByName('light')
      if (light) setLamp(light, '#FFF2C7', safe ? 1.2 + 0.5 * Math.sin(idle * Math.PI * 30) : 0.8)
      const wheel = P.vault?.getObjectByName('wheel')
      if (wheel) wheel.rotation.z = idle * Math.PI * 2
      /* 2 the ATM out of service; the customer walks up and back */
      screen(P.atm, down ? 'err' : 'atm')
      const lampM = P.atm?.getObjectByName('lamp')
      if (lampM) setLamp(lampM, down ? '#FF4040' : '#3DD68C', down ? (held ? 1.6 : Math.sin(idle * Math.PI * 60) > 0 ? 1.8 : 0.3) : 1.0)
      if (P.who) {
        const k = down && !held ? Math.sin(Math.PI * seg(t, 0, 0.8)) : 0
        P.who.position.set(0.45 + (1.3 - 0.45) * k, 0, 0.85 + (-0.25 - 0.85) * k)
      }
    } else {
      T01_RACKS.forEach((_, i) => blinkRack(P[`rack${i}`], idle + i * 0.13, 'ok'))
      blinkRack(P.gw, idle, down ? 'down' : 'ok')
      /* 1 writes ride the fibre from the network cabinet into the racks */
      ride(P.write, curveOf(w, 'store'), tc, safe && !held)
      /* 2 a request goes out from the laptop and comes straight back refused */
      const k = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.45
      ride(P.req, curveOf(w, 'user'), k, down && !held && t < 0.9)
      tint(P.req, t < 0.45 ? '#7FD8FF' : '#FF5A5A')
      screen(P.laptop, down ? 'err' : 'list')
    }
  }
  return <Pic build={() => buildT01(concept)} update={update} />
}

/* ================================================================== T07 · a form at an office */

/*
 * TR 7: "When you submit an important form at an office, the clerk may make a photocopy right there before giving
 * you the receipt (synchronous), or give you the receipt first and courier a copy to another city branch later
 * (asynchronous). In the same way, synchronous replication copies data before confirming the write, while
 * asynchronous replication confirms first and copies it afterwards."
 * Everyday: the office counter, the clerk, the visitor, the photocopier; through the shopfront the street, the road
 *   and the other city branch. 1 the form goes to the copier, the scan light sweeps, only then the receipt comes
 *   back; 2 the receipt comes back at once, then the courier van drives a copy to the branch.
 * Concept: a data hall (primary and standby racks side by side), the engineer's laptop; outside, the fibre to another
 *   region's data centre. 1 the write reaches the primary, is copied to the standby, then the laptop shows the tick;
 *   2 the tick comes back at once, then the copy travels the long fibre to the far data centre.
 */
const T07_VAN_A: V3 = [1.35, 0.02, 1.5]
const T07_VAN_B: V3 = [2.2, 0.02, -0.7]
function buildT07(concept: boolean): World {
  const w = makeWorld(CAM)
  room(w, { floor: concept ? 'dc' : 'wood', wall: concept ? '#E3E8EE' : '#EEF0F4', outdoor: 0.95, leftDepth: 2.8 })
  glassWall(w, 0.95, ROOM.z0, 0.25)
  place(w, tree(), 2.85, 0, 1.0)
  place(w, tree(), 1.35, 0, -1.75)
  if (!concept) {
    const dx = T07_VAN_B[0] - T07_VAN_A[0]
    const dz = T07_VAN_B[2] - T07_VAN_A[2]
    const len = Math.hypot(dx, dz) + 0.7
    place(w, roadStrip(len), (T07_VAN_A[0] + T07_VAN_B[0]) / 2, 0.01, (T07_VAN_A[2] + T07_VAN_B[2]) / 2, Math.atan2(dx, dz))
    place(w, officeBlock(1.0, 1.8, 0.85), 2.45, 0, -1.5)
    place(w, counter(2.2, 0.6, 0.95, M.wood('#9B6A3C'), std('#E9E4DA', { rough: 0.3 })), -0.75, 0, 0.05)
    put(w, 'copier', photocopier(), -2.3, 0, -1.4, 0.35)
    put(w, 'clerk', person(pReception, 1.65, -0.8, -0.55))
    put(w, 'who', person(pMan, 1.75, -0.3, 0.95))
    place(w, plant(1.0), -2.85, 0, 0.0)
    place(w, wallClock(0.17), -0.9, 1.95, ROOM.z0 + 0.03)
    place(w, papers(4), -1.4, 0.95, 0.05)
    put(w, 'form', paperSheet())
    put(w, 'receipt', paperSheet('#DFF5E6'))
    put(w, 'copy', paperSheet())
    put(w, 'van', van())
  } else {
    put(w, 'standby', rack({ tone: 'std' }), -2.1, 0, -1.62)
    put(w, 'primary', rack({ tone: 'std' }), -1.35, 0, -1.62)
    place(w, bx(1.6, 0.05, 0.3, std('#F2C230', { rough: 0.5 }), -1.7, 2.12, -1.75, 0.005))
    put(w, 'far', dataCentre(), 2.35, 0, -1.45)
    place(w, desk(1.1, 0.6, 0.75), -0.2, 0, 0.65)
    put(w, 'laptop', laptop('list'), -0.25, 0.75, 0.7, 0.15)
    put(w, 'who', person(pTabwoman, 1.7, 0.45, 0.95, true))
    cableIn(w, 'in', [[-0.25, 0.75, 0.55], [-0.4, 0.4, 0.4], [-0.5, 0.03, 0.2], [-1.0, 0.03, -0.6], [-1.35, 0.03, -1.15]])
    cableIn(w, 'sync', [[-1.35, 0.03, -1.15], [-1.72, 0.03, -0.98], [-2.1, 0.03, -1.15]])
    cableIn(w, 'async', [[-1.35, 0.03, -1.15], [-0.4, 0.03, -0.95], [0.95, 0.03, -0.55], [1.6, 0.03, -0.35], [2.2, 0.03, -0.88]])
    put(w, 'p1', pulse('#7FD8FF'))
    put(w, 'p2', pulse('#7FD8FF'))
    put(w, 'ack', pulse('#5BFF9A'))
  }
  return w
}
function T07Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const sync = step >= 1
  const async = step >= 2
  const t = useLap(sync, async ? 5200 : 4400, 0.97)
  const idle = useLap(true, 10000, 0.3)
  const mv = !held
  const update = (w: World) => {
    const P = w.parts
    if (!concept) {
      const desk0: V3 = [-0.45, 1.0, 0.05]
      const glass: V3 = [-2.3, 0.97, -1.4]
      const hand: V3 = [-0.3, 1.15, 0.8]
      const scan = P.copier?.getObjectByName('scan')
      if (!async) {
        /* 1 form → copier → the scan light sweeps → the copy comes out → only then the receipt */
        fly(P.form, sync && mv && t < 0.3, arc(desk0, glass, t / 0.3, 0.5), 0.35)
        const sk = seg(t, 0.3, 0.55)
        if (scan) {
          setLamp(scan, '#BFE3FF', sync && mv && sk > 0 && sk < 1 ? 2.2 : 0.25)
          scan.position.z = sync && mv ? -0.2 + 0.4 * sk : 0
        }
        fly(P.copy, sync && mv && t > 0.5 && t < 0.62, [-2.78, 0.62, -1.22], 0.35)
        fly(P.receipt, sync && (held || (t > 0.62 && t < 0.97)), held ? hand : arc(desk0, hand, seg(t, 0.62, 0.9), 0.35))
        fly(P.van, false, T07_VAN_A)
      } else {
        /* 2 the receipt at once; then the courier van drives a copy to the branch */
        fly(P.form, false, desk0)
        if (scan) setLamp(scan, '#BFE3FF', 0.25)
        fly(P.copy, false, desk0)
        fly(P.receipt, held || t < 0.97, held ? hand : arc(desk0, hand, seg(t, 0, 0.25), 0.35))
        const k = held ? 1 : sm(seg(t, 0.32, 0.92))
        fly(P.van, true, lerp3(T07_VAN_A, T07_VAN_B, k), Math.atan2(T07_VAN_A[2] - T07_VAN_B[2], T07_VAN_B[0] - T07_VAN_A[0]))
      }
    } else {
      blinkRack(P.primary, idle, 'ok')
      const iC = curveOf(w, 'in')
      const sC = curveOf(w, 'sync')
      const aC = curveOf(w, 'async')
      const b = P.far?.getObjectByName('beacon')
      if (!async) {
        /* 1 write → primary → standby → only then the tick */
        ride(P.p1, iC, seg(t, 0, 0.25), sync && mv && t < 0.25)
        ride(P.p2, sC, seg(t, 0.27, 0.47), sync && mv && t > 0.27 && t < 0.47)
        blinkRack(P.standby, idle + 0.2, sync && mv && t > 0.45 && t < 0.6 ? 'busy' : 'ok')
        ride(P.ack, iC, 1 - seg(t, 0.52, 0.75), sync && mv && t > 0.52 && t < 0.75)
        screen(P.laptop, sync && (held || t > 0.75) ? 'ok' : 'list')
        if (b) setLamp(b, '#3DD68C', 1)
      } else {
        /* 2 write → primary → the tick at once → then the copy rides the long fibre to the far data centre */
        ride(P.p1, iC, seg(t, 0, 0.22), mv && t < 0.22)
        ride(P.ack, iC, 1 - seg(t, 0.24, 0.44), mv && t > 0.24 && t < 0.44)
        screen(P.laptop, held || t > 0.44 ? 'ok' : 'list')
        ride(P.p2, aC, seg(t, 0.48, 0.92), mv && t > 0.48 && t < 0.92)
        blinkRack(P.standby, idle + 0.2, 'ok')
        if (b) setLamp(b, mv && t > 0.9 ? '#FFB020' : '#3DD68C', mv && t > 0.9 ? 2 : 1)
      }
    }
  }
  return <Pic build={() => buildT07(concept)} update={update} />
}

/* ================================================================== T08 · a principal's notice */

/*
 * TR 8: "A school principal's notice appears instantly on the office board, but photocopies pinned on each wing's
 * board take a few minutes to catch up — just as eventual consistency lets distant copies lag briefly before matching
 * the original."
 * Everyday: a school corridor. The office board on the left wall with the principal; the two wing boards on the back
 *   wall with a student at each; a wall clock between them. 1 the new notice pops onto the office board at once;
 *   2 the photocopies travel to the wing boards one after the other while the clock runs, then are pinned.
 * Concept: an office. The main desk (the original record) with its monitor; two distant desks with their monitors; the
 *   clock. 1 a new row lights up on the main monitor at once; 2 the change rides the cables and the far monitors show
 *   it one after the other, the clock running meanwhile.
 */
const T08_WINGS = [0.55, 2.15]
function buildT08(concept: boolean): World {
  const w = makeWorld(CAM)
  room(w, { floor: 'tile', wall: concept ? '#EEF1F5' : '#F2EDE4', leftDepth: 3.6 })
  put(w, 'clock', wallClock(0.2), 1.35, 1.95, ROOM.z0 + 0.03)
  if (!concept) {
    put(w, 'office', noticeBoard(1.3, 0.8, 3), ROOM.x0 + 0.03, 1.0, -0.75, Math.PI / 2)
    T08_WINGS.forEach((x, i) => put(w, `wing${i}`, noticeBoard(1.0, 0.62, 3), x, 0.95, ROOM.z0 + 0.03))
    /* a classroom door and a bench */
    place(w, bx(0.9, 2.0, 0.05, M.wood('#9B6A3C'), -1.35, 0, ROOM.z0 + 0.03, 0.01))
    place(w, bx(0.05, 0.05, 0.05, M.gold(), -1.02, 0.95, ROOM.z0 + 0.08, 0.02))
    place(w, bx(1.1, 0.42, 0.36, M.wood('#B47A47'), -1.0, 0, 0.95, 0.02))
    put(w, 'principal', person(pMansuit, 1.75, -2.35, -0.05, true))
    put(w, 'girl', person(pBag, 1.35, T08_WINGS[0], -1.05))
    put(w, 'boy', person(pBoy, 1.3, T08_WINGS[1], -1.05))
    place(w, plant(0.9), 2.85, 0, -1.85)
    put(w, 'c0', paperSheet('#FFE27A'))
    put(w, 'c1', paperSheet('#FFE27A'))
  } else {
    place(w, desk(1.2, 0.62, 0.75), -2.1, 0, -0.85, 0.35)
    put(w, 'main', monitorR('list', 0.66), -2.15, 0.75, -0.95, 0.35)
    place(w, pcTower(), -2.7, 0, -0.75, 0.35)
    put(w, 'who', person(pTabwoman, 1.7, -1.25, -0.15, true))
    T08_WINGS.forEach((x, i) => {
      place(w, desk(1.0, 0.55, 0.75), x, 0, -1.6)
      put(w, `mon${i}`, monitorR('list', 0.56), x, 0.75, -1.65)
    })
    put(w, 'worker', person(pSuit, 1.75, 2.85, -0.9, true))
    place(w, plant(0.9), -0.6, 0, -1.85)
    cableIn(w, 'r0', [[-2.15, 0.03, -0.7], [-1.2, 0.03, -0.6], [0.0, 0.03, -1.0], [0.55, 0.03, -1.35]])
    cableIn(w, 'r1', [[-2.15, 0.03, -0.7], [-0.9, 0.03, -0.3], [1.0, 0.03, -0.75], [2.15, 0.03, -1.35]])
    put(w, 'q0', pulse('#FFD34D'))
    put(w, 'q1', pulse('#FFD34D'))
  }
  return w
}
function T08Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const first = step >= 1
  const wings = step >= 2
  const t = useLap(wings, 5200, 0.97)
  const pop = useLap(first, 2600, 0.99)
  const mv = !held
  /* each copy's own arrival: the second wing a little later than the first */
  const arr = [0.55, 0.85]
  const update = (w: World) => {
    const P = w.parts
    spinClock(P.clock, wings ? (held ? 0.12 : t * 0.25) : 0)
    if (!concept) {
      const notes = (g: THREE.Object3D | undefined, n: number) =>
        g?.children.forEach((c) => {
          if (c.name.startsWith('note')) c.visible = Number(c.name.slice(4)) < n
        })
      notes(P.office, first ? 3 : 2)
      const n2 = P.office?.getObjectByName('note2')
      if (n2) n2.scale.setScalar(first && mv ? 1 + 0.18 * Math.max(0, Math.sin(Math.PI * Math.min(1, pop / 0.25))) : 1)
      T08_WINGS.forEach((x, i) => {
        const a0 = i * 0.3
        const done = wings && (held || t > arr[i])
        notes(P[`wing${i}`], done ? 3 : 2)
        fly(P[`c${i}`], wings && mv && t > a0 && t < arr[i], arc([ROOM.x0 + 0.25, 1.45, -0.75], [x, 1.25, ROOM.z0 + 0.15], seg(t, a0, arr[i]), 0.6), t * 6)
      })
    } else {
      screen(P.main, first ? 'listNew' : 'list')
      const s = P.main?.getObjectByName('screen')
      if (s) s.scale.setScalar(first && mv ? 1 + 0.04 * Math.max(0, Math.sin(Math.PI * Math.min(1, pop / 0.2))) : 1)
      T08_WINGS.forEach((_, i) => {
        const a0 = i * 0.3
        ride(P[`q${i}`], curveOf(w, `r${i}`), seg(t, a0, arr[i]), wings && mv && t > a0 && t < arr[i])
        screen(P[`mon${i}`], wings && (held || t > arr[i]) ? 'listNew' : 'list')
      })
    }
  }
  return <Pic build={() => buildT08(concept)} update={update} />
}

/* ================================================================== T11 · clothes and documents at home */

/*
 * TR 11: "At home, daily-wear clothes stay in the wardrobe for instant use, winter clothes go into a suitcase in the
 * loft that takes a few minutes to bring down, and old documents go into a bank locker that needs a trip to fetch.
 * In the same way, hot, cool and archive tiers trade instant access for lower storage cost."
 * Everyday: a bedroom (the cupboard with the daily clothes inside, the winter box on its top, a stool, the bed);
 *   outside, the road to the bank. (2026-11-10: the loft suitcase became the box on top of the cupboard.)
 *   1 the cupboard opens and a shirt is in hand at once; 2 the box comes down, opens, a sweater comes out, the box goes
 *   back on top of the cupboard; 3 she walks
 *   all the way to the bank and comes back with the envelope.
 * Concept: a data hall: a flash (SSD) rack, a disk (HDD) rack, a tape library with its robot. 1 data comes off the
 *   flash rack at once; 2 the disks spin up (amber), then the data comes; 3 the robot finds the tape, carries it to
 *   the drive, the drive reads it, and only then the data comes.
 */
const T11_BOX_TOP: V3 = [-2.45, 2.06, -1.75]
const T11_BOX_EDGE: V3 = [-2.4, 2.06, -1.2]
const T11_BOX_FLOOR: V3 = [-2.05, 0.02, -0.5]
const T11_WARD: V3 = [-1.25, 0, -0.8]
const T11_HOME: V3 = [-0.75, 0, 0.75]
const T11_BANK: V3 = [1.85, 0, -0.35]
function buildT11(concept: boolean): World {
  const w = makeWorld(CAM)
  if (!concept) {
    room(w, { floor: 'wood', wall: '#EDE6F0', outdoor: 0.95, leftDepth: 2.8 })
    glassWall(w, 0.95, ROOM.z0, 0.3, '#E4DCCB')
    put(w, 'wardrobe', wardrobe(), -2.45, 0, -1.75)
    place(w, bed(), -2.5, 0, 0.75)
    place(w, rug(1.5, 1.0, '#7FA6E8'), -0.8, 0.02, 0.45)
    /* 2026-11-10 (user): the winter clothes live in a storage box on top of the cupboard; a step stool beside it */
    put(w, 'box', winterBox(), ...T11_BOX_TOP)
    place(w, stool(), -1.55, 0, -1.55, 0.3)
    const dx = T11_BANK[0] - 1.25
    const dz = T11_BANK[2] - 1.5
    place(w, roadStrip(Math.hypot(dx, dz) + 0.9, 0.5), (1.25 + T11_BANK[0]) / 2, 0.01, (1.5 + T11_BANK[2]) / 2 + 0.2, Math.atan2(dx, dz))
    place(w, bankBuilding(), 2.3, 0, -1.35, -0.15)
    place(w, tree(), 2.9, 0, 1.1)
    put(w, 'who', person(pWoman, 1.7, T11_HOME[0], T11_HOME[2], true))
    /* the daily shirt as she holds it up: a shirt-sized piece with its sleeves, easy to see in her hands */
    const shirt = new THREE.Group()
    shirt.add(bx(0.34, 0.46, 0.04, std('#2D63FB', { rough: 0.9 }), 0, -0.23, 0, 0.03))
    for (const sx of [-1, 1]) {
      const sl = bx(0.1, 0.26, 0.04, std('#2D63FB', { rough: 0.9 }), sx * 0.21, -0.2, 0, 0.03)
      sl.rotation.z = sx * 0.35
      shirt.add(sl)
    }
    shirt.add(bx(0.12, 0.05, 0.045, std('#F4F1E6', { rough: 0.9 }), 0, -0.04, 0.002, 0.02))
    put(w, 'shirt', shirt)
    put(w, 'sweater', garment('#C8453C'))
    w.parts.sweater.scale.setScalar(1.5)
    put(w, 'env', envelope())
  } else {
    room(w, { floor: 'dc', wall: '#E3E8EE', leftDepth: 2.8 })
    put(w, 'ssd', rack({ tone: 'ssd' }), -2.5, 0, -1.62)
    put(w, 'hdd', rack({ tone: 'hdd' }), -1.65, 0, -1.62)
    put(w, 'tape', tapeLibrary(), 0.55, 0, -1.67)
    /* 2026-11-10 (user: "doesn't accurately explain the content"): the trade-off itself, in things of the room. Above
       each store a wall clock that runs while that store is fetching (a moment, minutes, hours); in front of each a
       stack of gold coins, its storage cost (tall for flash, short for tape) */
    ;[-2.5, -1.65, 0.55].forEach((x, i) => {
      put(w, `clk${i}`, wallClock(0.19), x, 2.23, ROOM.z0 + 0.03)
      put(w, `coin${i}`, coins([9, 5, 2][i]), x + (i === 2 ? -0.5 : 0.05), 0.02, i === 2 ? -0.95 : -0.82)
    })
    place(w, desk(1.2, 0.62, 0.75), 1.9, 0, 0.45)
    put(w, 'laptop', laptop('list'), 1.75, 0.75, 0.5, -0.3)
    put(w, 'who', person(pTabwoman, 1.7, 2.7, 0.7, true))
    const end: V3 = [1.7, 0.75, 0.35]
    const mid: V3 = [1.25, 0.03, 0.05]
    cableIn(w, 'c0', [[-2.5, 0.03, -1.12], [-1.8, 0.03, -0.6], [0.0, 0.03, -0.3], mid, [1.5, 0.4, 0.25], end])
    cableIn(w, 'c1', [[-1.65, 0.03, -1.12], [-1.1, 0.03, -0.75], [0.1, 0.03, -0.45], mid, [1.5, 0.4, 0.25], end])
    cableIn(w, 'c2', [[0.0, 0.03, -1.22], [0.4, 0.03, -0.8], [0.9, 0.03, -0.35], mid, [1.5, 0.4, 0.25], end])
    put(w, 'q', pulse('#7FD8FF'))
  }
  return w
}
function T11Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const lit = Math.min(3, step)
  const ms = [1800, 2000, 4200, 8200][lit]
  const t0 = useLap(step >= 1, ms, 0.99)
  const idle = useLap(true, 10000, 0.3)
  const mv = !held && step >= 1
  /* the everyday story keeps its own, slower clock (2026-11-10: the cupboard sequence must read step by step) */
  const te0 = useLap(step >= 1, [1800, 6000, 10000, 8200][lit], 0.99)
  /*
   * 2026-11-10 (user: "every animation step clearly visible, in sequence; do not skip any"): the analogy layout
   * reveals its three steps ~0.4 s apart when the deck plays itself, so acts 1 and 2 used to flash past and only the
   * bank trip looped. Once the build is complete, the story now plays as ONE sequence on a single clock: the
   * cupboard (6 s), then the winter box (10 s), then the trip to the bank (8.2 s), and round again; the concept side
   * follows the same acts. Pressed step by step (auto animation off), each press still plays its own act.
   */
  const ACT = [6000, 10000, 8200]
  const story = useLap(step >= 3, ACT[0] + ACT[1] + ACT[2], 0.999)
  const sms = story * (ACT[0] + ACT[1] + ACT[2])
  const storyOn = step >= 3 && !held
  const actE = !storyOn ? lit : sms < ACT[0] ? 1 : sms < ACT[0] + ACT[1] ? 2 : 3
  const actT = !storyOn ? te0 : actE === 1 ? sms / ACT[0] : actE === 2 ? (sms - ACT[0]) / ACT[1] : (sms - ACT[0] - ACT[1]) / ACT[2]
  const update = (w: World) => {
    const P = w.parts
    const lit = actE
    const t = storyOn ? actT : t0
    if (!concept) {
      const t = actT
      const door = P.wardrobe?.getObjectByName('doorL')
      let wx = T11_HOME
      const handAt = (p: V3): V3 => [p[0] + 0.25, 1.02, p[2] + 0.12]
      /* 1 instant (2026-11-10, user): she steps to the cupboard and opens it, takes the daily clothes out, puts them
         back neatly on the rail, closes the cupboard and steps back */
      let open = 0
      if (lit === 1 && mv) {
        wx = t < 0.12 ? lerp3(T11_HOME, T11_WARD, sm(t / 0.12)) : t < 0.8 ? T11_WARD : lerp3(T11_WARD, T11_HOME, sm(seg(t, 0.8, 0.95)))
        open = t < 0.12 ? 0 : t < 0.22 ? sm(seg(t, 0.12, 0.22)) : t < 0.68 ? 1 : 1 - sm(seg(t, 0.68, 0.78))
      }
      if (door) door.rotation.y = -1.75 * open
      const shirtOn = lit === 1 && mv && t > 0.24 && t < 0.66
      const held0: V3 = [T11_WARD[0] + 0.2, 1.42, T11_WARD[2] + 0.22]
      const railTop: V3 = [-2.65, 1.72, -1.6]
      fly(P.shirt, shirtOn, t < 0.38 ? arc(railTop, held0, seg(t, 0.24, 0.38), 0.15) : t < 0.52 ? held0 : arc(held0, railTop, seg(t, 0.52, 0.66), 0.15), 0.35)
      /* 2 a few minutes (2026-11-10, user): she brings the winter clothes to the cupboard, lifts the storage box down
         from its top, opens it, places the winter clothes inside, closes it and puts the box back on top of the
         cupboard, then walks back */
      const box = P.box
      const lid = box?.getObjectByName('lid')
      let bp: V3 = T11_BOX_TOP
      let lidA = 0
      if (lit === 2 && mv) {
        wx = t < 0.1 ? lerp3(T11_HOME, T11_WARD, sm(t / 0.1)) : t < 0.84 ? T11_WARD : lerp3(T11_WARD, T11_HOME, sm(seg(t, 0.84, 0.97)))
        if (t >= 0.1 && t < 0.18) bp = lerp3(T11_BOX_TOP, T11_BOX_EDGE, sm(seg(t, 0.1, 0.18)))
        else if (t >= 0.18 && t < 0.32) bp = arc(T11_BOX_EDGE, T11_BOX_FLOOR, seg(t, 0.18, 0.32), 0.15)
        else if (t >= 0.32 && t < 0.58) bp = T11_BOX_FLOOR
        else if (t >= 0.58 && t < 0.72) bp = arc(T11_BOX_FLOOR, T11_BOX_EDGE, seg(t, 0.58, 0.72), 0.15)
        else if (t >= 0.72 && t < 0.8) bp = lerp3(T11_BOX_EDGE, T11_BOX_TOP, sm(seg(t, 0.72, 0.8)))
        lidA = t < 0.34 ? 0 : t < 0.4 ? sm(seg(t, 0.34, 0.4)) : t < 0.5 ? 1 : 1 - sm(seg(t, 0.5, 0.56))
      }
      if (box) box.position.set(...bp)
      if (lid) lid.rotation.x = -1.9 * lidA
      const sweaterOn = lit === 2 && mv && t < 0.5
      fly(P.sweater, sweaterOn, t < 0.41 ? handAt(wx) : arc(handAt(T11_WARD), [T11_BOX_FLOOR[0], 0.3, T11_BOX_FLOOR[2]], seg(t, 0.41, 0.5), 0.3), 0.2)
      /* 3 a trip: she walks to the bank and back with the envelope */
      let carry = false
      if (lit === 3 && mv) {
        const go = seg(t, 0, 0.4)
        const back = seg(t, 0.52, 0.92)
        wx = t < 0.4 ? lerp3(T11_HOME, T11_BANK, sm(go)) : t < 0.52 ? T11_BANK : lerp3(T11_BANK, T11_HOME, sm(back))
        carry = t > 0.46
      }
      if (P.who) P.who.position.set(wx[0], 0, wx[2])
      fly(P.env, carry && t < 0.97, [wx[0] + 0.28, 0.95, wx[2] + 0.1], 0.3)
    } else {
      blinkRack(P.ssd, idle, lit === 1 && mv && t < 0.5 ? 'busy' : 'ok')
      blinkRack(P.hdd, idle + 0.3, lit === 2 && mv && t < 0.45 ? 'busy' : 'ok')
      let u = 0.5
      let v = 0.6
      let carrying = false
      let k = -1
      let c = 'c0'
      if (lit === 1) k = seg(t, 0.1, 0.55)
      if (lit === 2) {
        k = seg(t, 0.45, 0.9)
        c = 'c1'
      }
      if (lit === 3) {
        c = 'c2'
        /* the robot travels to the tape, takes it, carries it to the drive */
        if (t < 0.25) {
          u = 0.5 + (0.85 - 0.5) * sm(t / 0.25)
          v = 0.6 + (0.75 - 0.6) * sm(t / 0.25)
        } else if (t < 0.32) {
          u = 0.85
          v = 0.75
          carrying = t > 0.29
        } else if (t < 0.58) {
          const q = sm((t - 0.32) / 0.26)
          u = 0.85 + (0.03 - 0.85) * q
          v = 0.75 + (0.1 - 0.75) * q
          carrying = true
        } else {
          u = 0.03
          v = 0.1
        }
        k = seg(t, 0.68, 0.96)
      }
      if (held) {
        u = 0.5
        v = 0.6
      }
      pick(P.tape, u, v, carrying && mv)
      const d0 = P.tape?.getObjectByName('drive0')
      const reading = lit === 3 && mv && t > 0.58 && t < 0.7
      if (d0) setLamp(d0, reading ? '#FFB020' : '#3DD68C', reading ? 2 : 1)
      ride(P.q, curveOf(w, c), k, mv && k > 0 && k < 1)
      screen(P.laptop, step >= 1 && (held || k >= 1) ? 'ok' : 'list')
      /* each clock turns clockwise only, like a real clock (2026-11-10): the second hand ticks once a second; the minute
         hand creeps on at its own pace and hurries a little while its store is fetching (minutes for disk, hours for
         tape); it never runs back */
      const extra = [0, 0.008, 0.05]
      ;[0, 1, 2].forEach((i) => naturalClock(P[`clk${i}`], lit === i + 1 && mv ? extra[i] : 0, held))
      /* the coins of the store being used shine */
      ;[0, 1, 2].forEach((i) => {
        const c0 = P[`coin${i}`]
        if (c0) c0.position.y = 0.02 + (lit === i + 1 && mv ? 0.04 * Math.abs(Math.sin(idle * 60)) : 0)
      })
    }
  }
  return <Pic build={() => buildT11(concept)} update={update} />
}

/* ================================================================== T15 · files in an office */

/*
 * TR 15: "In an office, active files stay on the desk, files older than six months are moved to the record room, and
 * files older than seven years are shredded as per company policy, without anyone deciding each time. In the same
 * way, a lifecycle policy automatically moves objects to cheaper tiers and deletes them once they reach a set age."
 * Everyday: an office with nobody in it (nobody decides): the desk with its active files, the record-room shelving,
 *   the shredder, the wall calendar. 1 new files land on the desk; 2 the calendar's page turns and a file moves on
 *   its own from the desk to the shelves; 3 the page turns again and the oldest file goes into the shredder.
 * Concept: a data hall with nobody in it: the flash rack (the active tier), the tape library (the cheaper tier), the
 *   media shredder, the calendar. 1 new objects ride the fibre into the flash rack; 2 the calendar turns, the data
 *   moves to the library and the robot shelves a tape; 3 the calendar turns, the robot takes the old tape out and the
 *   shredder destroys it.
 */
function buildT15(concept: boolean): World {
  const w = makeWorld(CAM)
  room(w, { floor: concept ? 'dc' : 'wood', wall: concept ? '#E3E8EE' : '#EEF0F4', leftDepth: 2.8 })
  put(w, 'cal', calendar(concept ? '#2D63FB' : '#D84040'), 1.55, 2.15, ROOM.z0 + 0.03)
  if (!concept) {
    place(w, desk(1.4, 0.75, 0.75), -2.2, 0, -0.35)
    place(w, papers(6), -2.55, 0.75, -0.4)
    place(w, folder('#F2C14E'), -2.1, 0.75, -0.3)
    place(w, folder('#5B86FF'), -2.1, 0.785, -0.32)
    place(w, monitorR('blank', 0.5), -1.75, 0.75, -0.55, -0.2)
    place(w, bx(0.5, 0.45, 0.5, std('#2A303A', { rough: 0.6 }), -2.2, 0, 0.3, 0.05))
    put(w, 'shelf', shelving(2.2, 1.95), -0.1, 0, -1.85)
    put(w, 'shred', shredder(), 2.1, 0, -1.1, -0.25)
    place(w, plant(1.0), 2.85, 0, -1.85)
    place(w, rug(1.6, 1.0, '#C9B48F'), 0.1, 0.02, 0.6)
    put(w, 'file', folder('#E8655A'))
    put(w, 'newf', folder('#3DBB7A'))
    put(w, 'bits', strips(9, '#FFFFFF'))
  } else {
    put(w, 'ssd', rack({ tone: 'ssd' }), -2.45, 0, -1.62)
    put(w, 'tape', tapeLibrary(), -0.15, 0, -1.67)
    put(w, 'shred', mediaShredder(), 2.05, 0, -1.05, -0.3)
    place(w, bx(3.4, 0.05, 0.3, std('#F2C230', { rough: 0.5 }), -1.2, 2.12, -1.75, 0.005))
    place(w, cy(0.09, 0.09, 0.5, std('#D63B3B', { rough: 0.35 }), 0.95, 0, -1.95))
    cableIn(w, 'in', [[ROOM.x0 + 0.05, 0.03, 0.6], [-2.6, 0.03, -0.3], [-2.45, 0.03, -1.12]])
    cableIn(w, 'tier', [[-2.45, 0.03, -1.12], [-1.6, 0.03, -0.85], [-0.8, 0.03, -1.0], [-0.7, 0.03, -1.22]])
    put(w, 'q', pulse('#7FD8FF'))
    put(w, 'tp', cartridge('#E8655A'))
    put(w, 'bits', strips(9, '#3A3F48'))
  }
  return w
}
function T15Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const lit = Math.min(3, step)
  const t = useLap(step >= 1, [2000, 2400, 4200, 6400][lit], 0.99)
  const idle = useLap(true, 10000, 0.3)
  const mv = !held && step >= 1
  const update = (w: World) => {
    const P = w.parts
    /* the calendar turns its page each time an age is reached */
    const pg = P.cal?.getObjectByName('page')
    const flip = (q: number) => (q > 0 && q < 0.14 ? Math.sin((q / 0.14) * Math.PI) : 0)
    if (pg) pg.rotation.x = mv && lit >= 2 ? -1.4 * Math.max(flip(t), lit === 3 ? flip(t - 0.5) : 0) : 0
    if (!concept) {
      const deskP: V3 = [-2.1, 0.86, -0.3]
      const shelfP: V3 = [0.25, 1.12, -1.75]
      const slot: V3 = [2.1, 0.92, -1.1]
      /* 1 new files land on the desk */
      fly(P.newf, lit === 1 && mv && t < 0.8, arc([-1.4, 1.2, 0.6], deskP, seg(t, 0, 0.7), 0.4))
      /* 2 desk → shelves; 3 desk → shelves → shredder, then the strips */
      if (lit === 2) fly(P.file, mv && t > 0.1 && t < 0.9, arc(deskP, shelfP, seg(t, 0.12, 0.8), 0.7), 0)
      else if (lit === 3) fly(P.file, mv && t > 0.06 && t < 0.82, t < 0.45 ? arc(deskP, shelfP, seg(t, 0.06, 0.4), 0.7) : arc(shelfP, slot, seg(t, 0.55, 0.8), 0.7), 0)
      else fly(P.file, false, deskP)
      const sk = seg(t, 0.8, 0.98)
      if (P.bits) P.bits.position.set(...slot)
      spray(P.bits, sk, lit === 3 && mv)
      const l = P.shred?.getObjectByName('slot')
      const cutting = lit === 3 && mv && sk > 0 && sk < 1
      if (l) setLamp(l, cutting ? '#FF4040' : '#3DD68C', cutting ? 2 : 1)
    } else {
      blinkRack(P.ssd, idle, 'ok')
      const inC = curveOf(w, 'in')
      const tierC = curveOf(w, 'tier')
      let u = 0.5
      let v = 0.6
      let carrying = false
      if (lit === 1) ride(P.q, inC, seg(t, 0.05, 0.85), mv && t < 0.85)
      else if (lit === 2) {
        ride(P.q, tierC, seg(t, 0.12, 0.45), mv && t > 0.12 && t < 0.45)
        /* the robot takes the tape from the drive and shelves it */
        const q = sm(seg(t, 0.5, 0.85))
        u = 0.03 + (0.7 - 0.03) * q
        v = 0.1 + (0.5 - 0.1) * q
        carrying = mv && t > 0.48 && t < 0.86
      } else if (lit === 3) {
        ride(P.q, tierC, seg(t, 0.08, 0.3), mv && t > 0.08 && t < 0.3)
        const q = sm(seg(t, 0.5, 0.7))
        u = 0.6 + (0.97 - 0.6) * q
        v = 0.65 + (0.25 - 0.65) * q
        carrying = mv && t > 0.48 && t < 0.72
      } else ride(P.q, inC, 0, false)
      if (held) {
        u = 0.5
        v = 0.6
        carrying = false
      }
      pick(P.tape, u, v, carrying)
      /* 3 the old tape leaves the library and goes into the shredder */
      const throat: V3 = [2.05, 1.28, -1.05]
      fly(P.tp, lit === 3 && mv && t > 0.72 && t < 0.86, arc([0.75, 0.6, -1.15], throat, seg(t, 0.72, 0.86), 0.6), t * 4)
      const sk = seg(t, 0.86, 0.99)
      if (P.bits) P.bits.position.set(...throat)
      spray(P.bits, sk, lit === 3 && mv)
      const l = P.shred?.getObjectByName('lamp')
      if (l) setLamp(l, '#FF7A1A', lit === 3 && mv && t > 0.84 ? (Math.sin(idle * 300) > 0 ? 2.2 : 0.5) : 0.4)
    }
  }
  return <Pic build={() => buildT15(concept)} update={update} />
}

/* ================================================================== T20 · a shop owner's notebook */

/*
 * TR 20: "A shop owner copies the day's sales into a notebook every evening. If the billing computer crashes, at most
 * one day of sales records is lost (RPO), and the time taken to set up a new computer and start billing again is the
 * downtime (RTO). In the same way, RPO limits how much data can be lost and RTO limits how long the system stays
 * down."
 * Everyday: a shop: the counter with the billing computer, the till and the notebook; shelves of goods; the window.
 *   1 the day passes in the window; at evening the day's sales go into the notebook; 2 the billing computer dies
 *   (its screen goes dark, smoke rises); 3 a new computer is unboxed and boots while the clock runs, then billing
 *   shows again.
 * Concept: a server room: the production rack, the backup appliance, the operator's dashboard, an empty spare rack,
 *   the clock. 1 at the scheduled hour the data rides into the backup; 2 the production rack fails (red, smoke, the
 *   dashboard alarms); 3 the spare rack fills with servers and the backup is restored into it while the clock runs.
 */
function buildT20(concept: boolean): World {
  const w = makeWorld(CAM)
  if (!concept) {
    room(w, { floor: 'shop', wall: '#F2EDE4', leftDepth: 2.8 })
    put(w, 'win', windowPane(1.25, 0.8), 0.35, 1.55, ROOM.z0 + 0.02)
    place(w, productShelf(1.5), -2.2, 0, -1.9)
    place(w, productShelf(1.0), 2.55, 0, -1.9)
    place(w, counter(2.4, 0.65, 0.95, M.wood('#9B6A3C'), std('#E9E4DA', { rough: 0.3 })), -0.65, 0, 0.3)
    put(w, 'pos', monitorR('pos', 0.5), -1.4, 0.95, 0.2, 0.3)
    put(w, 'pc', pcTower(), -1.45, 0, -0.35)
    place(w, register(), -0.6, 0.95, 0.25)
    put(w, 'book', notebook(), 0.2, 0.95, 0.32, -0.15)
    put(w, 'who', person(pMan, 1.75, -0.65, -0.45))
    place(w, desk(1.0, 0.6, 0.75), 2.05, 0, -0.55)
    put(w, 'new', monitorR('off', 0.5), 1.95, 0.75, -0.6, -0.15)
    place(w, cardboardBox(0.42), 2.55, 0, 0.25, 0.4)
    place(w, cardboardBox(0.3), 2.85, 0, -0.25, -0.2)
    put(w, 'clock', wallClock(0.22), 1.9, 1.78, ROOM.z0 + 0.03)
    put(w, 'smoke', smoke(9), -1.45, 0.45, -0.35)
    P0(w).smoke.scale.setScalar(2.2)
    put(w, 'slip', paperSheet('#FFFFFF'))
    /* 2026-11-10 (user: clearly visible animations): a customer comes in and pays during the day */
    put(w, 'cust', person(pGirl, 1.6, 1.0, 1.5, true))
    put(w, 'note', cashBundle())
    /* the notebook's page lights as the day is written into it */
    const glowPage = face(0.5, 0.34, lamp('#FFE9A8', 0), 0, 0.034, 0)
    glowPage.rotation.x = -Math.PI / 2
    glowPage.name = 'page'
    P0(w).book.add(glowPage)
    /* the new computer's boot bar */
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.035).translate(0.18, 0, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5B86FF'), toneMapped: false }))
    bar.position.set(-0.18, 0.28, 0.021)
    bar.name = 'bar'
    P0(w).new.add(bar)
  } else {
    room(w, { floor: 'dc', wall: '#E3E8EE', leftDepth: 2.8 })
    put(w, 'prod', rack({ tone: 'std' }), -1.3, 0, -1.62)
    put(w, 'bak', backupBox(), -2.5, 0, -1.7)
    put(w, 'spare', rack({ tone: 'std', fill: 0 }), 1.55, 0, -1.62)
    place(w, bx(4.4, 0.05, 0.3, std('#F2C230', { rough: 0.5 }), -0.6, 2.12, -1.75, 0.005))
    put(w, 'clock', wallClock(0.24), 0.15, 1.85, ROOM.z0 + 0.03)
    place(w, desk(1.2, 0.62, 0.75), 0.15, 0, 0.6)
    put(w, 'dash', monitorR('dash', 0.62), 0.1, 0.75, 0.55, 0.1)
    put(w, 'who', person(pTabwoman, 1.7, 0.95, 0.8, true))
    place(w, cardboardBox(0.4), 2.6, 0, -0.6, 0.3)
    put(w, 'smoke', smoke(9), -1.3, 2.0, -1.45)
    P0(w).smoke.scale.setScalar(2.2)
    cableIn(w, 'b', [[-1.3, 0.03, -1.12], [-1.9, 0.03, -0.9], [-2.5, 0.03, -1.2]])
    cableIn(w, 'r', [[-2.5, 0.03, -1.2], [-1.8, 0.03, -0.6], [0.3, 0.03, -0.5], [1.55, 0.03, -1.12]])
    put(w, 'q', pulse('#7FD8FF'))
    put(w, 'q2', pulse('#7FD8FF'))
    put(w, 'q3', pulse('#7FD8FF'))
  }
  return w
}
function T20Scene({ step, concept }: { step: number; concept: boolean }) {
  const held = useHeld()
  const copy = step >= 1
  const crash = step >= 2
  const fresh = step >= 3
  /* 2026-11-10 (user: "too fast"): every loop about half as fast, so the day, the crash and the rebuild read in order */
  const t = useLap(copy, 12000, 0.9)
  const tr = useLap(fresh, 12000, 0.99)
  const idle = useLap(true, 18000, 0.3)
  const mv = !held
  const update = (w: World) => {
    const P = w.parts
    /* the clock: the day's hours while copying; it races while the system is rebuilt */
    /* 2026-11-10 (user: "rotate at a normal, realistic speed"): the clocks keep real time, the second hand ticking
       once a second, the minute and hour hands at their true rates; held frames show ten past ten */
    realClock(P.clock, held)
    if (!concept) {
      /* 1 the day in the window, then evening; at evening the sales go into the notebook */
      const day = held ? 0.9 : copy ? t : 0.2
      const eve = sm(seg(day, 0.55, 0.75))
      const sky = P.win?.getObjectByName('sky') as THREE.Mesh | undefined
      if (sky) (sky.material as THREE.MeshBasicMaterial).color.copy(new THREE.Color('#9CC8FF').lerp(new THREE.Color('#F08A4B'), eve).lerp(new THREE.Color('#2A3566'), sm(seg(day, 0.8, 0.98))))
      const sun = P.win?.getObjectByName('sun')
      if (sun) {
        sun.position.x = -0.45 + 0.9 * Math.min(1, day / 0.8)
        sun.position.y = 0.15 * Math.sin(Math.min(1, day / 0.8) * Math.PI) - 0.35 * eve
        sun.visible = sun.position.y > -0.3
      }
      P.win?.traverse((c) => {
        if (c.name === 'city') ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(eve > 0.6 ? '#4A5A82' : '#7E97BE')
      })
      fly(P.slip, copy && !crash && mv && t > 0.6 && t < 0.85, arc([-1.3, 1.25, 0.25], [0.2, 1.0, 0.32], seg(t, 0.6, 0.84), 0.35))
      /* the day's customer: walks up, pays, walks away */
      const shop = copy && !crash && mv
      const ck = shop ? (t < 0.25 ? sm(t / 0.25) : t < 0.38 ? 1 : 1 - sm((t - 0.38) / 0.17)) : 0
      if (P.cust) {
        P.cust.visible = shop ? t < 0.56 : !copy
        P.cust.position.set(1.0 + (0.25 - 1.0) * ck, 0, 1.5 + (0.95 - 1.5) * ck)
      }
      fly(P.note, shop && t > 0.26 && t < 0.37, arc([0.3, 1.15, 0.85], [-0.6, 1.12, 0.25], seg(t, 0.26, 0.36), 0.25), 0.4)
      const page = P.book?.getObjectByName('page')
      if (page) setLamp(page, '#FFE9A8', shop && t > 0.82 && t < 0.98 ? 1.3 : 0)
      const pen = P.book?.getObjectByName('pen')
      if (pen) pen.position.x = 0.12 + (copy && !crash && mv && t > 0.84 ? Math.sin(t * 90) * 0.06 : 0)
      /* 2 the crash: dark screen, red light, smoke */
      screen(P.pos, crash ? (!fresh && mv && Math.sin(idle * 160) > 0.55 ? 'err' : 'off') : 'pos')
      const led = P.pc?.getObjectByName('led')
      if (led) setLamp(led, crash ? '#FF4040' : '#3DD68C', crash ? (Math.sin(idle * 110) > 0 ? 2 : 0.3) : 1.2)
      puff(P.smoke, idle * 7, crash && !fresh && mv)
      /* 3 the new computer boots, then billing again */
      screen(P.new, !fresh ? 'off' : held || tr > 0.65 ? 'pos' : 'boot')
      const bar = P.new?.getObjectByName('bar')
      if (bar) {
        bar.visible = fresh && mv && tr <= 0.65
        bar.scale.x = Math.max(0.02, Math.min(1, tr / 0.62))
      }
    } else {
      blinkRack(P.prod, idle, crash ? 'down' : 'ok')
      const bc = P.prod?.getObjectByName('beacon')
      if (bc && crash && mv) setLamp(bc, '#FF4D4D', Math.sin(idle * 110) > 0 ? 2.6 : 0.2)
      blinkRack(P.bak, idle + 0.4, copy && !crash && mv && t > 0.6 && t < 0.9 ? 'busy' : 'ok')
      /* 1 the scheduled backup */
      ride(P.q, curveOf(w, 'b'), seg(t, 0.6, 0.88), copy && !crash && mv && t > 0.6 && t < 0.88)
      /* 2 the failure */
      puff(P.smoke, idle * 7, crash && !fresh && mv)
      const alarm = crash && !(fresh && (held || tr > 0.8))
      screen(P.dash, alarm ? (mv && Math.sin(idle * 110) > 0.3 ? 'dashErr' : 'off') : 'dash')
      /* 3 the spare rack fills and the backup is restored into it */
      const units = (P.spare?.userData.units as THREE.Group[] | undefined) ?? []
      /* the servers slide into the spare rack one by one */
      const f = fresh ? (held ? units.length : units.length * Math.min(1, tr / 0.7)) : 0
      const n = Math.floor(f + 0.001)
      units.forEach((u, i) => {
        u.visible = i < n || (i === n && f > n)
        u.position.z = i === n && f > n ? 0.7 * (1 - sm((f - n) / 0.9)) : 0
      })
      blinkRack(P.spare, idle + 0.2, fresh ? 'ok' : 'off')
      if (fresh) ['q', 'q2', 'q3'].forEach((key, j) => ride(P[key], curveOf(w, 'r'), (tr * 2 + j / 3) % 1, mv && tr < 0.95))
      else ['q2', 'q3'].forEach((key) => ride(P[key], curveOf(w, 'r'), 0, false))
    }
  }
  return <Pic build={() => buildT20(concept)} update={update} />
}

/* ------------------------------------------------------------------ export */

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  F_T01Everyday: (p) => <T01Scene step={p.step as number} concept={false} />,
  F_T01Concept: (p) => <T01Scene step={p.step as number} concept />,
  F_T07Everyday: (p) => <T07Scene step={p.step as number} concept={false} />,
  F_T07Concept: (p) => <T07Scene step={p.step as number} concept />,
  F_T08Everyday: (p) => <T08Scene step={p.step as number} concept={false} />,
  F_T08Concept: (p) => <T08Scene step={p.step as number} concept />,
  F_T11Everyday: (p) => <T11Scene step={p.step as number} concept={false} />,
  F_T11Concept: (p) => <T11Scene step={p.step as number} concept />,
  F_T15Everyday: (p) => <T15Scene step={p.step as number} concept={false} />,
  F_T15Concept: (p) => <T15Scene step={p.step as number} concept />,
  F_T20Everyday: (p) => <T20Scene step={p.step as number} concept={false} />,
  F_T20Concept: (p) => <T20Scene step={p.step as number} concept />,
}
export const slides = {}
export const css = ''
