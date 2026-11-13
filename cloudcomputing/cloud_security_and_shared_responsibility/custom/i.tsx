import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'

/**
 * BUILDER I · SESSION 12 (Cloud Security & Shared Responsibility) ANALOGY ON SLIDE 29 (TR 16, Defense in Depth):
 * "Like an airport: a security check at the entrance, a boarding-pass check at the gate, locked cockpit doors, and
 * CCTV across the terminal. Passing one check doesn't get anyone everywhere, just as cloud security layers independent
 * controls so breaching one layer does not expose the whole system."
 *
 * Built to the Session 9-11 review rules from the first draft (generate-slides standing corrections 13-16, cloud
 * course R10-R13): real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera, a
 * real place, never isometric or clay; people are Character Lab characters on depth-tested planes (`rigSprite`, the
 * engine's castSprite with a `dress` hook for role clothing), each an individual with an expression synced to the
 * action and minimal joint movement (standing roles); no text, digits or labels on either card; every loop wall-clock
 * driven, 6.6 s, ending on its first frame; held frames (`?still`, thumbnails, reduced motion) draw HOLD with nothing
 * moving. Both cards are the same 470 x 390 canvas, so the shared renderer never resizes between them.
 *
 * THE TWO CARDS SHARE ONE LAYOUT, POSITION FOR POSITION, AND ONE CLOCK (three 2.2 s beats):
 *   left        entrance security check: a passenger stands in the scanner arch while   ↔  NETWORK: a firewall gate
 *               her bag rides the X-ray belt; the beam sweeps, the arch light turns          (brick pillars, a force
 *               green, the officer in his hi-vis vest nods (beat 1)                          field); a request packet
 *                                                                                            is scanned and let through,
 *                                                                                            a malformed one bounces off
 *   middle      boarding-pass check: a second passenger's pass lies on the gate podium   ↔  IDENTITY: a badge reader;
 *               scanner, the beam crosses it, the light turns green, the gate agent         the request shows its ID
 *               smiles and waves her on (beat 2)                                             card, the light turns green
 *   right       the locked cockpit door: a cutaway of the aircraft's front cabin, the    ↔  APPLICATION + DATA: an
 *               reinforced door shut, its keypad pulsing, the padlock glowing; the pilot     application block with a
 *               is seen through the door's small window, focused (beat 3)                   shield, its data vault
 *                                                                                            locked; the request goes in
 *                                                                                            but the vault stays shut
 *   overhead    two CCTV cameras panning across the terminal (all beats)               ↔  MONITORING: the same two
 *                                                                                            cameras panning the hall
 */

const W = 470
const H = 390
const L = 6.6
const BEAT = 2.2
const HOLD = 4.0

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandSoft: '#DCE6FF',
  navy: '#1F2E63',
  ink: '#00254B',
  white: '#FFFFFF',
  steel: '#C9D3E6',
  green: '#22C55E',
  red: '#E5484D',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  hivis: '#D7F23A',
}

/* ------------------------------------------------------------------ helpers */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
const win = (t: number, a: number, b: number, e = 0.2) => seg(t, a - e, a) * (1 - seg(t, b, b + e))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l

/* drawn textures are rasterised at TEX_SS x their logical size so they stay crisp on a 4K screen (correction 15) */
const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  g.scale(TEX_SS, TEX_SS)
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function liveTex(w: number, h: number): { tex: THREE.CanvasTexture; paint: (draw: (g: CanvasRenderingContext2D) => void) => void } {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return {
    tex,
    paint(draw) {
      g.setTransform(TEX_SS, 0, 0, TEX_SS, 0, 0)
      draw(g)
      tex.needsUpdate = true
    },
  }
}
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)
const glow = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.4, ...o })
/** a flat picture: a thin plane with the texture, unlit so its colours read true */
function picture(w: number, h: number, tex: THREE.Texture, pos: THREE.Vector3Tuple): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))
  m.position.set(...pos)
  return m
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
/**
 * The engine's `castSprite` with a `dress` hook (role clothing drawn in the rig's own frames, so it moves with it), as
 * in Session 11's h.tsx: frames are rendered on demand (the held frame first), onto a depth-tested camera-facing plane,
 * so the podium and the door hide what stands behind them. `px` 300 wide (450 tall) suits a ~145 CSS px person at 4K.
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; onReady?: () => void; shadow?: boolean }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 300, shadow: o.shadow === false ? false : 0.2 })
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

/* ------------------------------------------------------------------ role clothing (rig body frame 400 x 600) */

/** the security officer's hi-vis vest over his navy shirt: two front panels, reflective bands, a radio clip */
const HIVIS_VEST = (
  <g data-part="hivis">
    <path d="M 140 216 C 150 206 170 203 186 203 L 194 262 L 196 410 L 140 410 C 136 340 134 270 140 216 Z" fill={C.hivis} stroke="#B9D21F" strokeWidth={2.5} />
    <path d="M 260 216 C 250 206 230 203 214 203 L 206 262 L 204 410 L 260 410 C 264 340 266 270 260 216 Z" fill={C.hivis} stroke="#B9D21F" strokeWidth={2.5} />
    <rect x={139} y={330} width={57} height={14} fill="#E6ECF4" />
    <rect x={204} y={330} width={57} height={14} fill="#E6ECF4" />
    <rect x={139} y={366} width={57} height={14} fill="#E6ECF4" />
    <rect x={204} y={366} width={57} height={14} fill="#E6ECF4" />
    <rect x={226} y={238} width={16} height={34} rx={4} fill="#2A2F3A" />
    <rect x={232} y={226} width={4} height={14} rx={2} fill="#2A2F3A" />
  </g>
)
/** the pilot's shoulder boards (four gold bars) and a wing badge on the chest */
const PILOT_RANK = (
  <g data-part="pilotrank">
    <rect x={142} y={208} width={36} height={14} rx={3} fill="#1B2A55" transform="rotate(-14 160 215)" />
    <rect x={222} y={208} width={36} height={14} rx={3} fill="#1B2A55" transform="rotate(14 240 215)" />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={146 + i * 8} y={210} width={4} height={10} fill={C.gold} transform="rotate(-14 160 215)" />
        <rect x={226 + i * 8} y={210} width={4} height={10} fill={C.gold} transform="rotate(14 240 215)" />
      </g>
    ))}
    <path d="M 222 252 L 252 248 L 248 254 L 222 258 Z M 222 252 L 216 255 L 222 258 Z" fill={C.gold} />
  </g>
)
/** the pilot's peaked cap (head-local, skull centre 0,0) */
const PILOT_CAP = (
  <g data-part="pilotcap">
    <path d="M -86 -66 C -88 -112 -50 -138 0 -140 C 50 -138 92 -112 90 -66 Z" fill="#1B2A55" />
    <rect x={-88} y={-76} width={178} height={16} rx={6} fill="#14204A" />
    <path d="M -70 -62 C -40 -48 40 -48 74 -62 L 70 -52 C 40 -40 -40 -40 -66 -52 Z" fill="#0E1736" />
    <rect x={-60} y={-80} width={122} height={6} rx={3} fill={C.gold} />
    <circle cx={2} cy={-104} r={13} fill={C.gold} />
    <circle cx={2} cy={-104} r={6} fill="#1B2A55" />
  </g>
)
/** the gate agent's neck scarf in the airline's orange */
const SCARF = (
  <g data-part="scarf">
    <path d="M 178 204 C 190 216 210 216 222 204 L 226 214 C 210 230 190 230 174 214 Z" fill={C.orange} />
    <path d="M 206 220 L 232 262 L 214 266 L 198 226 Z" fill="#F07A2C" />
  </g>
)
/** the gate agent's name badge (a plain bar, no words) */
const BADGE = <rect data-part="badge" x={226} y={250} width={26} height={9} rx={2} fill={C.gold} />
/** the first passenger's cross-body bag (it goes through the check with her) */
const SLING_BAG = (
  <g data-part="slingbag">
    <path d="M 176 206 C 196 260 222 316 246 352" stroke="#8A4B2A" strokeWidth={8} fill="none" strokeLinecap="round" />
    <rect x={226} y={346} width={58} height={44} rx={10} fill="#B5643A" stroke="#8A4B2A" strokeWidth={3} />
    <path d="M 228 362 L 282 362" stroke="#8A4B2A" strokeWidth={3} />
    <rect x={250} y={366} width={10} height={8} rx={2} fill="#F2C14E" />
  </g>
)

/* ------------------------------------------------------------------ shared places (both cards, position for position) */

const P = {
  /* THREE SEPARATED STATIONS, left to right, clear floor between them (merged-build review 2026-11-11: no two people
     shoulder to shoulder, nothing running into the cockpit cutaway; standing corrections 14-15).
     left: the officer on the arch's far side, facing it; the scanner arch / firewall gate with the first passenger */
  archX: -1.48,
  officer: [-2.56, 0, -0.25] as THREE.Vector3Tuple,
  /* middle: the second passenger, the podium / badge reader, the agent behind it */
  pod: [0.32, 0, -0.26] as THREE.Vector3Tuple,
  pax2: [-0.42, 0, 0.12] as THREE.Vector3Tuple,
  agent: [0.36, 0, -0.82] as THREE.Vector3Tuple,
  /* right: the aircraft's front cabin / the application block, its left edge ~0.5 clear of the podium */
  cabX: 2.02,
  backZ: -1.7,
  /* overhead cameras over the two gaps */
  cams: [
    [-0.95, 2.95],
    [0.95, 2.95],
  ] as [number, number][],
}
const CAM: THREE.Vector3Tuple = [0.06, 2.15, 9.2]
/** x on the camera's line of sight through (x0, z 0): a packet approaching along it stays inside the gate opening on screen */
const rayX = (x0: number, z: number) => CAM[0] + ((x0 - CAM[0]) * (CAM[2] - z)) / CAM[2]
function frame(camera: THREE.PerspectiveCamera) {
  /* a little above eye height, looking down on the walkway: the stations fill the card, the runner leads the eye */
  camera.fov = 31
  camera.position.set(...CAM)
  camera.lookAt(0.06, 1.3, -0.5)
}

/** a CCTV camera on a wall bracket; returns the pan group (rotate .y) and its status LED material */
function cctv(scene: THREE.Scene, x: number, y: number, z: number, body = '#F4F6FA') {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  scene.add(g)
  g.add(box(0.12, 0.08, 0.05, mat('#9AA6BD'), [0, 0, 0.02]))
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 12), mat('#9AA6BD'), [0, -0.02, 0.12]))
  ;(g.children[1] as THREE.Mesh).rotation.x = Math.PI / 2
  const pan = new THREE.Group()
  pan.position.set(0, -0.06, 0.22)
  g.add(pan)
  pan.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 10), mat('#9AA6BD'), [0, 0.02, 0]))
  const tilt = new THREE.Group()
  tilt.rotation.x = 0.32
  pan.add(tilt)
  tilt.add(box(0.15, 0.13, 0.32, mat(body, { roughness: 0.35 }), [0, -0.05, 0.08], 0.04))
  tilt.add(box(0.19, 0.03, 0.36, mat(body, { roughness: 0.35 }), [0, 0.03, 0.08], 0.012))
  const lens = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20), mat('#141A2B', { roughness: 0.15, metalness: 0.4 }), [0, -0.05, 0.25])
  lens.rotation.x = Math.PI / 2
  tilt.add(lens)
  const led = glow(C.red, '#7A1C1F')
  tilt.add(mesh(new THREE.SphereGeometry(0.014, 10, 10), led, [0.05, 0.0, 0.245]))
  return { pan, led }
}

/** floor, back wall, a terminal window band with sky and a parked tail fin (where the place is) */
function hall(scene: THREE.Scene, floorCol: string, wallCol: string, sky: boolean) {
  const f = mesh(new THREE.PlaneGeometry(16, 12), mat(floorCol, { roughness: 0.55, metalness: 0.05 }), [0, 0, 0])
  f.rotation.x = -Math.PI / 2
  f.castShadow = false
  const wm = mat(wallCol, { roughness: 0.95, emissive: new THREE.Color(wallCol), emissiveIntensity: 0.72 })
  const b = mesh(new THREE.PlaneGeometry(16, 7), wm, [0, 3.5, P.backZ])
  b.castShadow = false
  scene.add(f, b)
  /* the ceiling with long light strips: the cameras hang under it */
  const ceil = mesh(new THREE.PlaneGeometry(16, 5), mat('#F7F9FC', { roughness: 0.9, emissive: new THREE.Color('#F7F9FC'), emissiveIntensity: 0.55 }), [0, 3.32, P.backZ + 2.5])
  ceil.rotation.x = Math.PI / 2
  ceil.castShadow = false
  scene.add(ceil)
  for (const z of [-1.2, -0.2, 0.8, 1.8]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.12), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }))
    strip.rotation.x = Math.PI / 2
    strip.position.set(0.2, 3.31, z)
    scene.add(strip)
  }
  scene.add(box(16, 0.08, 0.06, mat('#E3E9F2'), [0, 3.28, P.backZ + 0.04]))
  if (sky) {
    const tex = canvasTex(300, 80, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 80)
      gr.addColorStop(0, '#9CC8FF')
      gr.addColorStop(1, '#DCEBFF')
      g.fillStyle = gr
      g.fillRect(0, 0, 300, 80)
      g.fillStyle = '#B9C4D2'
      g.fillRect(0, 66, 300, 14)
      /* a parked aircraft's tail fin and fuselage line on the apron, far away */
      g.fillStyle = '#FFFFFF'
      rr(g, 40, 58, 150, 9, 4.5)
      g.fill()
      g.fillStyle = C.brand
      g.beginPath()
      g.moveTo(160, 58)
      g.lineTo(178, 28)
      g.lineTo(190, 28)
      g.lineTo(186, 58)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.55)'
      g.beginPath()
      g.ellipse(250, 22, 26, 7, 0, 0, Math.PI * 2)
      g.ellipse(270, 18, 16, 6, 0, 0, Math.PI * 2)
      g.fill()
    })
    scene.add(picture(3.7, 1.04, tex, [-1.05, 1.95, P.backZ + 0.01]))
    const frameM = mat('#E3E9F2', { roughness: 0.5 })
    for (const x of [-2.9, -1.67, -0.43, 0.8]) scene.add(box(0.05, 1.12, 0.04, frameM, [x, 1.95, P.backZ + 0.03]))
    scene.add(box(3.76, 0.05, 0.04, frameM, [-1.05, 2.49, P.backZ + 0.03]))
    scene.add(box(3.76, 0.05, 0.04, frameM, [-1.05, 1.41, P.backZ + 0.03]))
  }
}

/* ================================================================== everyday: the airport */

function setupEveryday({ scene, camera, redraw }: StageKit): Update {
  frame(camera)
  scene.background = null
  lightRig(scene, [0, 1, 0])
  hall(scene, '#E8ECF2', '#F3F6FB', true)
  /* the boarding walkway: a blue runner from the entrance, through the arch, past the podium, to the aircraft */
  const run = mesh(new THREE.PlaneGeometry(4.6, 0.62), mat('#5577D6', { roughness: 0.9 }), [-0.95, 0.005, 0.12])
  run.rotation.x = -Math.PI / 2
  run.castShadow = false
  scene.add(run)
  /* the entrance leg: passengers come in from the front of the hall straight to the scanner arch */
  const leg = mesh(new THREE.PlaneGeometry(0.62, 4.2), mat('#5577D6', { roughness: 0.9 }), [P.archX, 0.005, 2.5])
  leg.rotation.x = -Math.PI / 2
  leg.castShadow = false
  scene.add(leg)

  /* LEFT · the entrance security check: a walk-through scanner arch, its light on the top beam */
  const ax = P.archX
  const archM = mat('#D9DFEA', { roughness: 0.4 })
  scene.add(box(0.16, 2.14, 0.36, archM, [ax - 0.45, 1.07, 0], 0.04))
  scene.add(box(0.16, 2.14, 0.36, archM, [ax + 0.45, 1.07, 0], 0.04))
  scene.add(box(1.06, 0.2, 0.38, archM, [ax, 2.24, 0], 0.05))
  const archLight = glow(C.red, '#F7D9D9')
  scene.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), archLight, [ax, 2.37, 0.05]))
  /* the scan beam: a thin light bar between the posts that sweeps down and up */
  const beamM = new THREE.MeshBasicMaterial({ color: '#7FB2FF', transparent: true, opacity: 0, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.025, 0.3), beamM)
  scene.add(beam)

  /* MIDDLE · the gate podium with its scanner pad and the boarding pass on it */
  const [qx, , qz] = P.pod
  scene.add(box(0.66, 1.0, 0.44, mat('#2E3F7A', { roughness: 0.5 }), [qx, 0.5, qz], 0.04))
  scene.add(box(0.72, 0.05, 0.5, mat('#F4F6FA', { roughness: 0.4 }), [qx, 1.02, qz], 0.02))
  scene.add(box(0.6, 0.08, 0.02, mat(C.orange, { roughness: 0.5 }), [qx, 0.78, qz + 0.225]))
  const padM = glow(C.green, '#1F2433', { roughness: 0.2 })
  scene.add(box(0.3, 0.02, 0.22, padM, [qx - 0.12, 1.055, qz + 0.05], 0.008))
  const passTex = canvasTex(120, 60, (g) => {
    g.fillStyle = '#FFFFFF'
    rr(g, 0, 0, 120, 60, 6)
    g.fill()
    g.fillStyle = C.brand
    rr(g, 0, 0, 120, 16, 6)
    g.fill()
    g.fillStyle = '#C9D3E6'
    for (const [x, y, w] of [[10, 26, 50], [10, 38, 36], [10, 48, 44]]) rr(g, x, y, w, 5, 2.5), g.fill()
    g.strokeStyle = '#7C89A3'
    g.setLineDash([2, 3])
    g.beginPath()
    g.moveTo(84, 18)
    g.lineTo(84, 60)
    g.stroke()
    g.fillStyle = '#1F2433'
    for (let i = 0; i < 10; i++) g.fillRect(92 + i * 2.4, 26, i % 3 ? 1.2 : 1.8, 26)
  })
  const pass = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshStandardMaterial({ map: passTex, roughness: 0.5 }))
  pass.rotation.x = -Math.PI / 2 + 0.25
  pass.position.set(qx - 0.12, 1.075, qz + 0.05)
  scene.add(pass)
  const scanM = new THREE.MeshBasicMaterial({ color: '#8EF0B0', transparent: true, opacity: 0, toneMapped: false })
  const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.18), scanM)
  scene.add(scanBar)
  /* the agent's screen on the podium, facing her (its back to the camera) */
  scene.add(box(0.3, 0.2, 0.03, mat('#2A2F3A'), [qx + 0.16, 1.17, qz - 0.12], 0.015))

  /* RIGHT · the aircraft's front cabin, cut away: fuselage shell, cabin floor, a seat pair each side, overhead bins,
     the bulkhead with the reinforced cockpit door (padlock, keypad), and behind it the cockpit with the pilot and the
     windshield's sky, seen through the door's small window */
  const cx = P.cabX
  const R = 0.8
  const cy = R + 0.02
  const zf = -0.2
  const zBulk = -0.95
  const zEnd = -1.65
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.07, R + 0.07, zf - zEnd, 56, 1, true), mat('#FFFFFF', { roughness: 0.35, side: THREE.FrontSide }))
  shell.rotation.x = Math.PI / 2
  shell.position.set(cx, cy, (zf + zEnd) / 2)
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R, R, zf - zEnd, 56, 1, true), mat('#EEF1F6', { roughness: 0.8, side: THREE.BackSide }))
  inner.rotation.x = Math.PI / 2
  inner.position.copy(shell.position)
  inner.receiveShadow = true
  scene.add(shell, inner)
  const lip = new THREE.Mesh(new THREE.RingGeometry(R, R + 0.09, 64), mat('#FFFFFF', { roughness: 0.35, side: THREE.DoubleSide }))
  lip.position.set(cx, cy, zf + 0.001)
  scene.add(lip)
  const stripe = new THREE.Mesh(new THREE.RingGeometry(R + 0.09, R + 0.12, 64, 1, Math.PI * 0.9, Math.PI * 1.2), mat(C.brand, { side: THREE.DoubleSide }))
  stripe.position.set(cx, cy, zf + 0.002)
  scene.add(stripe)
  const floorY = 0.2
  scene.add(box(1.42, 0.06, zf - zEnd, mat('#9BA7BD', { roughness: 0.9 }), [cx, floorY - 0.03, (zf + zEnd) / 2]))
  scene.add(box(0.42, 0.02, zf - zBulk, mat('#3F5BA8', { roughness: 0.9 }), [cx, floorY + 0.01, (zf + zBulk) / 2]))
  /* seat pairs facing the cockpit (we see their backs), each side of the aisle */
  const seatM = mat('#3352B8', { roughness: 0.7 })
  for (const sx of [cx - 0.5, cx + 0.5]) {
    scene.add(box(0.28, 0.1, 0.3, seatM, [sx, floorY + 0.32, -0.55], 0.035))
    scene.add(box(0.28, 0.52, 0.09, seatM, [sx, floorY + 0.56, -0.39], 0.035))
    scene.add(box(0.22, 0.08, 0.1, mat('#F4F6FA'), [sx, floorY + 0.77, -0.38], 0.025))
  }
  /* the bulkhead with a door-shaped opening */
  const DW = 0.5
  const DH = 1.3
  const bulk = new THREE.Shape()
  bulk.absarc(0, 0, R, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.moveTo(-DW / 2, floorY - cy)
  hole.lineTo(DW / 2, floorY - cy)
  hole.lineTo(DW / 2, floorY - cy + DH)
  hole.lineTo(-DW / 2, floorY - cy + DH)
  hole.lineTo(-DW / 2, floorY - cy)
  bulk.holes.push(hole)
  const bulkM = mesh(new THREE.ShapeGeometry(bulk, 64), mat('#E2E7EF', { roughness: 0.8 }), [cx, cy, zBulk])
  scene.add(bulkM)
  /* the reinforced cockpit door with its small window */
  const door = new THREE.Shape()
  door.moveTo(-DW / 2, 0)
  door.lineTo(DW / 2, 0)
  door.lineTo(DW / 2, DH)
  door.lineTo(-DW / 2, DH)
  door.lineTo(-DW / 2, 0)
  const wy0 = 0.94
  const wy1 = 1.16
  const wnd = new THREE.Path()
  wnd.moveTo(-0.11, wy0)
  wnd.lineTo(0.11, wy0)
  wnd.lineTo(0.11, wy1)
  wnd.lineTo(-0.11, wy1)
  wnd.lineTo(-0.11, wy0)
  door.holes.push(wnd)
  const doorGeo = new THREE.ExtrudeGeometry(door, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 })
  const doorMesh = mesh(doorGeo, mat('#5C6B8A', { roughness: 0.45, metalness: 0.2 }), [cx, floorY, zBulk - 0.03])
  scene.add(doorMesh)
  /* the window glass, faintly blue */
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshStandardMaterial({ color: '#BFD8FF', transparent: true, opacity: 0.18, roughness: 0.05 }))
  glass.position.set(cx, floorY + (wy0 + wy1) / 2, zBulk + 0.035)
  scene.add(glass)
  /* the padlock on the door and the keypad on the bulkhead */
  const lockM = glow(C.orange, '#E7B53C', { metalness: 0.5, roughness: 0.3 })
  const lock = new THREE.Group()
  lock.position.set(cx, floorY + 0.68, zBulk + 0.06)
  lock.add(box(0.14, 0.115, 0.05, lockM, [0, 0, 0], 0.02))
  const shackle = mesh(new THREE.TorusGeometry(0.052, 0.014, 10, 24, Math.PI), mat('#B9C2D3', { metalness: 0.7, roughness: 0.25 }), [0, 0.065, 0])
  lock.add(shackle)
  lock.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 12), mat('#3A3F57'), [0, -0.005, 0.03]))
  ;(lock.children[2] as THREE.Mesh).rotation.x = Math.PI / 2
  scene.add(lock)
  scene.add(box(0.12, 0.18, 0.03, mat('#2A2F3A', { roughness: 0.4 }), [cx + 0.36, floorY + 0.82, zBulk + 0.03], 0.015))
  const keyLed = glow(C.red, '#6B1C1F')
  scene.add(mesh(new THREE.SphereGeometry(0.018, 10, 10), keyLed, [cx + 0.36, floorY + 0.88, zBulk + 0.05]))
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) scene.add(box(0.022, 0.018, 0.01, mat('#C9D3E6'), [cx + 0.33 + c * 0.03, floorY + 0.79 - r * 0.028, zBulk + 0.05]))
  /* the cockpit behind the door: windshield sky, instrument glow; dark enough that the window frames the pilot */
  const cockpitSky = canvasTex(100, 60, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 60)
    gr.addColorStop(0, '#6FA8FF')
    gr.addColorStop(1, '#CFE3FF')
    g.fillStyle = gr
    g.fillRect(0, 0, 100, 60)
  })
  scene.add(picture(0.9, 0.42, cockpitSky, [cx, floorY + 1.05, zEnd + 0.02]))
  scene.add(box(1.1, 0.36, 0.2, mat('#2A3247', { roughness: 0.6 }), [cx, floorY + 0.66, zEnd + 0.14]))

  /* PEOPLE */
  const officerCfg = who(CAST_PRESETS.rohan, { skinTone: 'dusky', hair: { style: 'buzz', color: 'black' }, outfit: { top: 'shirt', topColor: '#26365F', bottom: 'trousers', bottomColor: '#1E2740', shoeColor: '#15181F' }, accessories: { glasses: 'none', beard: 'short', belt: true, watch: true }, build: { height: 1.03, shoulders: 1.06 } })
  const paxACfg = who(CAST_PRESETS.meera, { hair: { style: 'long', color: 'darkBrown' }, outfit: { top: 'kurta', topColor: '#1E9E8F', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#5A3A2A' }, accessories: { earrings: true } })
  const paxBCfg = who(CAST_PRESETS.kabir, { hair: { style: 'curly', color: 'black' }, outfit: { top: 'hoodie', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81' }, accessories: { glasses: 'rect' } })
  const agentCfg = who(CAST_PRESETS.riya, { hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#22346E', bottom: 'skirt', bottomColor: '#22346E', shoeColor: '#2A2A30' }, accessories: { glasses: 'none', earrings: true } })
  const pilotCfg = who(CAST_PRESETS.dev, { hair: { style: 'short', color: 'grey' }, outfit: { top: 'shirtTie', topColor: '#F7F9FC', bottom: 'trousers', bottomColor: '#1B2A55' }, accessories: { glasses: 'none', beard: 'stubble', watch: true } })

  /* beat 1: the passenger in the arch, arms a little out, still while the beam sweeps; a relieved smile on green */
  const paxA = rigSprite({
    config: paxACfg,
    dress: (k) => ({ ...k, neckExtras: <>{k.neckExtras}{SLING_BAG}</> }),
    loop: L,
    frames: 44,
    height: 1.6,
    onReady: redraw,
    timeline: (k) => ({ seed: 41, idle: CAST_IDLE, ...faceAt(k, [[0, 'neutral'], [0.3, 'thinking'], [1.45, 'happy'], [2.6, 'neutral']], L) }),
    pose: (p, k) => {
      const scan = win(k, 0.15, 1.5, 0.25)
      to(p, 'shoulderL', 34, scan)
      to(p, 'shoulderR', 34, scan)
      to(p, 'elbowL', 20, scan)
      to(p, 'elbowR', 20, scan)
      to(p, 'lookY', -0.5, win(k, 0.3, 1.3, 0.2))
      /* looks over to the gate after her check */
      to(p, 'headTurn', 0.3, win(k, 2.0, 5.6, 0.4))
      to(p, 'lookX', 0.6, win(k, 2.0, 5.6, 0.4))
    },
  })
  paxA.object.position.set(ax, 0, 0.0)
  /* the officer watches the passenger in the arch, nods when it turns green; then glances at the X-ray screen */
  const officer = rigSprite({
    config: officerCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{HIVIS_VEST}</> }),
    loop: L,
    frames: 44,
    height: 1.74,
    onReady: redraw,
    timeline: (k) => ({ seed: 42, idle: CAST_IDLE, ...faceAt(k, [[0, 'skeptical'], [1.45, 'happy'], [2.6, 'neutral'], [5.0, 'listening']], L) }),
    pose: (p, k) => {
      to(p, 'headTurn', 0.45, 1)
      to(p, 'lookX', 0.85, 1)
      to(p, 'headNod', 0.2, win(k, 1.5, 1.9, 0.15))
      /* an approving hand raised in front of his chest on green, elbow in, clear of the arch post */
      const ok = win(k, 1.55, 2.4, 0.25)
      to(p, 'shoulderR', 10, ok)
      to(p, 'elbowR', 118, ok)
    },
  })
  officer.object.position.set(...P.officer)
  /* beat 2: the second passenger at the podium, a hand resting by the scanner; pleased when it goes green */
  const paxB = rigSprite({
    config: paxBCfg,
    loop: L,
    frames: 44,
    height: 1.7,
    onReady: redraw,
    timeline: (k) => ({ seed: 43, idle: CAST_IDLE, ...faceAt(k, [[0, 'neutral'], [2.3, 'listening'], [3.55, 'excited'], [4.6, 'happy'], [6.2, 'neutral']], L) }),
    pose: (p, k) => {
      to(p, 'headTurn', 0.4, 1)
      to(p, 'lookX', 0.7, 1)
      to(p, 'lookY', 0.5, win(k, 2.3, 3.4, 0.2))
      /* reaches toward the pad while it scans, then lowers his hand */
      const reach = win(k, 2.25, 3.5, 0.3)
      to(p, 'shoulderR', 30, reach)
      to(p, 'elbowR', 34, reach)
    },
  })
  paxB.object.position.set(...P.pax2)
  /* the gate agent behind the podium: reads her screen, then smiles and gestures him on (toward the aircraft) */
  const agent = rigSprite({
    config: agentCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{BADGE}</>, neckExtras: <>{k.neckExtras}{SCARF}</> }),
    loop: L,
    frames: 44,
    height: 1.64,
    onReady: redraw,
    timeline: (k) => ({ seed: 44, idle: CAST_IDLE, ...faceAt(k, [[0, 'neutral'], [2.4, 'thinking'], [3.55, 'happy'], [5.2, 'neutral']], L) }),
    pose: (p, k) => {
      const read = win(k, 2.35, 3.45, 0.2)
      to(p, 'lookY', 0.8, read)
      to(p, 'headNod', 0.22, read)
      to(p, 'headTurn', -0.35, 1 - read)
      to(p, 'lookX', -0.6, 1 - read)
      /* a small open palm toward the aircraft (screen-right), kept at her chest so it stays clear of the cabin */
      const on = win(k, 3.6, 4.7, 0.3)
      to(p, 'shoulderR', 26, on)
      to(p, 'elbowR', 74, on)
      to(p, 'palmR', 1, on)
    },
  })
  agent.object.position.set(...P.agent)
  /* beat 3: the pilot behind the locked door, focused on the instruments, a glance to the door when the keypad pulses */
  const pilot = rigSprite({
    config: pilotCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{PILOT_RANK}</>, hairFront: <>{k.hairFront}{PILOT_CAP}</> }),
    loop: L,
    frames: 30,
    height: 1.24,
    shadow: false,
    onReady: redraw,
    timeline: (k) => ({ seed: 45, idle: CAST_IDLE, ...faceAt(k, [[0, 'thinking'], [4.5, 'listening'], [5.9, 'thinking']], L) }),
    pose: (p, k) => {
      to(p, 'lookY', 0.45, 1 - win(k, 4.5, 5.8, 0.25))
      to(p, 'lookX', -0.3, 1 - win(k, 4.5, 5.8, 0.25))
    },
  })
  pilot.object.position.set(cx, floorY, -1.28)
  scene.add(paxA.object, officer.object, paxB.object, agent.object, pilot.object)

  /* CCTV across the terminal */
  const cams = P.cams.map(([x, y]) => cctv(scene, x, y, P.backZ))

  return (t) => {
    const c = mod(t, L)
    /* the arch: beam sweeps down and back up, the light turns green */
    const sweep = seg(c, 0.25, 0.85) - seg(c, 0.85, 1.4)
    beamM.opacity = 0.75 * win(c, 0.25, 1.4, 0.12)
    beam.position.set(ax, lerp(2.0, 0.25, sweep), 0)
    const archOk = win(c, 1.4, 2.2, 0.15)
    archLight.color.set(archOk > 0.5 ? '#CFF5DC' : '#F7D9D9')
    archLight.emissive.set(archOk > 0.5 ? C.green : C.red)
    archLight.emissiveIntensity = archOk > 0.5 ? 0.9 * archOk + 0.1 : 0.35
    /* the podium: the scan line crosses the pass, the pad glows green */
    const pk = seg(c, 2.4, 3.4)
    scanM.opacity = 0.9 * win(c, 2.35, 3.45, 0.1)
    scanBar.position.set(qx - 0.24 + pk * 0.24, 1.09, qz + 0.05)
    padM.emissiveIntensity = 0.9 * win(c, 3.45, 4.3, 0.15)
    /* the locked door: the keypad pulses red twice, the padlock glows */
    const pulse = win(c, 4.45, 6.45, 0.2) * (0.5 + 0.5 * Math.sin(((c - 4.45) / 1.0) * Math.PI * 2 - Math.PI / 2))
    keyLed.emissiveIntensity = 0.25 + 1.4 * pulse
    lockM.emissiveIntensity = 0.55 * pulse
    lock.scale.setScalar(1 + 0.08 * pulse)
    /* CCTV pans, each with its own phase, one full sweep per loop; LEDs blink */
    cams.forEach((cm, i) => {
      cm.pan.rotation.y = 0.55 * Math.sin((c / L) * Math.PI * 2 + i * 2.1)
      cm.led.emissiveIntensity = mod(c + i * 0.4, 1.1) < 0.18 ? 1.6 : 0.2
    })
    paxA.update(c, camera)
    officer.update(c, camera)
    paxB.update(c, camera)
    agent.update(c, camera)
    pilot.update(c, camera)
  }
}

/* ================================================================== concept: the layered cloud */

/** a rounded request packet: a glowing cube with a lighter core */
function packet(color: string, emissive: number) {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.1, emissive: new THREE.Color(color), emissiveIntensity: emissive, transparent: true })
  g.add(box(0.24, 0.24, 0.24, m, [0, 0, 0], 0.06))
  return { g, m }
}

function brickTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#E3E8F0'
    g.fillRect(0, 0, 64, 64)
    for (let r = 0; r < 4; r++)
      for (let c = -1; c < 3; c++) {
        const x = c * 32 + (r % 2 ? 16 : 0) + 1.5
        g.fillStyle = (r + c) % 3 ? '#E8744A' : '#D9643D'
        rr(g, x, r * 16 + 1.5, 29, 13, 2.5)
        g.fill()
      }
  })
}

function setupConcept({ scene, camera, redraw }: StageKit): Update {
  frame(camera)
  scene.background = null
  lightRig(scene, [0, 1, 0])
  hall(scene, '#E3E9F4', '#EEF2FA', false)
  void redraw

  /* the request path along the floor, from the left edge into the application block */
  const pathM = new THREE.MeshStandardMaterial({ color: '#5577D6', emissive: new THREE.Color(C.brand), emissiveIntensity: 0.12, roughness: 0.6 })
  const path = mesh(new THREE.PlaneGeometry(4.6, 0.62), pathM, [-0.95, 0.006, 0.12])
  path.rotation.x = -Math.PI / 2
  path.castShadow = false
  scene.add(path)
  /* the entrance leg: requests arrive from the front, straight into the firewall gate */
  const leg = mesh(new THREE.PlaneGeometry(0.62, 4.2), pathM, [P.archX, 0.006, 2.5])
  leg.rotation.x = -Math.PI / 2
  leg.castShadow = false
  scene.add(leg)

  /* LEFT · NETWORK: the firewall gate, brick pillars and beam, a shield field across the opening */
  const ax = P.archX
  const bt = brickTex()
  const brickM = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8 })
  scene.add(box(0.26, 2.14, 0.4, brickM, [ax - 0.48, 1.07, 0]))
  scene.add(box(0.26, 2.14, 0.4, brickM, [ax + 0.48, 1.07, 0]))
  scene.add(box(1.22, 0.26, 0.42, brickM, [ax, 2.27, 0]))
  /* the firewall's own flame mark on top of the beam: a small 3D flame */
  const flameShape = new THREE.Shape()
  flameShape.moveTo(0, 0)
  flameShape.bezierCurveTo(0.12, 0, 0.14, 0.1, 0.1, 0.18)
  flameShape.bezierCurveTo(0.08, 0.24, 0.02, 0.26, 0.0, 0.34)
  flameShape.bezierCurveTo(-0.04, 0.24, -0.14, 0.2, -0.12, 0.1)
  flameShape.bezierCurveTo(-0.11, 0.03, -0.06, 0, 0, 0)
  const flameGeo = new THREE.ExtrudeGeometry(flameShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 })
  flameGeo.translate(0, 0, -0.03)
  const flameM = glow(C.orange, '#FF8A3D')
  const flame = mesh(flameGeo, flameM, [ax, 2.4, 0.05])
  flame.scale.set(1.15, 1.25, 1)
  scene.add(flame)
  const coreGeo = flameGeo.clone()
  const core = mesh(coreGeo, glow('#FFD24A', '#FFD24A'), [ax, 2.42, 0.1])
  core.scale.set(0.55, 0.6, 1)
  scene.add(core)
  const fieldM = new THREE.MeshBasicMaterial({ color: '#7FB2FF', transparent: true, opacity: 0.12, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })
  const field = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.0), fieldM)
  field.position.set(ax, 1.08, 0)
  scene.add(field)
  const beamM = new THREE.MeshBasicMaterial({ color: '#7FB2FF', transparent: true, opacity: 0, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.32), beamM)
  scene.add(beam)
  const gateLight = glow(C.red, '#F7D9D9')
  /* the gate light sits at the beam's front edge, below the flame */
  scene.add(mesh(new THREE.SphereGeometry(0.05, 14, 10), gateLight, [ax, 2.27, 0.24]))

  /* where the X-ray belt was: the incoming traffic lane; a malformed request (orange, spiked) arrives in beat 2 and is
     bounced back off the gate's shield */
  const bad = packet(C.orange, 0.25)
  const spikeM = new THREE.MeshStandardMaterial({ color: '#E56A2B', roughness: 0.4 })
  for (const [x, y, z] of [[0.14, 0.06, 0], [-0.14, -0.04, 0], [0, 0.14, 0.04], [0.02, -0.14, -0.03], [0.05, 0.02, 0.14]] as THREE.Vector3Tuple[]) {
    const sp = mesh(new THREE.ConeGeometry(0.04, 0.1, 8), spikeM, [x, y, z])
    sp.lookAt(x * 4, y * 4, z * 4)
    sp.rotateX(Math.PI / 2)
    bad.g.add(sp)
  }
  scene.add(bad.g)

  /* MIDDLE · IDENTITY: a badge reader pillar where the podium stood, its pad lights green */
  const [qx, , qz] = P.pod
  scene.add(box(0.5, 1.0, 0.4, mat('#2E3F7A', { roughness: 0.5 }), [qx, 0.5, qz], 0.05))
  scene.add(box(0.56, 0.05, 0.46, mat('#F4F6FA', { roughness: 0.4 }), [qx, 1.02, qz], 0.02))
  const readerM = glow(C.green, '#1F2433', { roughness: 0.2 })
  const reader = box(0.3, 0.36, 0.06, mat('#F4F6FA', { roughness: 0.35 }), [qx - 0.04, 1.26, qz + 0.06], 0.03)
  reader.rotation.x = -0.25
  scene.add(reader)
  const readerPad = box(0.22, 0.2, 0.02, readerM, [qx - 0.04, 1.27, qz + 0.1], 0.01)
  readerPad.rotation.x = -0.25
  scene.add(readerPad)
  const readerLed = glow(C.red, '#6B1C1F')
  scene.add(mesh(new THREE.SphereGeometry(0.02, 10, 10), readerLed, [qx - 0.04, 1.42, qz + 0.07]))
  /* the request's ID card: a white card with a portrait circle and two lines (no words) */
  const idTex = canvasTex(90, 60, (g) => {
    g.fillStyle = '#FFFFFF'
    rr(g, 0, 0, 90, 60, 7)
    g.fill()
    g.fillStyle = C.brand
    rr(g, 0, 0, 90, 12, 6)
    g.fill()
    g.fillStyle = '#DCE6FF'
    g.beginPath()
    g.arc(24, 36, 13, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = C.brand
    g.beginPath()
    g.arc(24, 32, 5, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.ellipse(24, 44, 8, 5, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = '#C9D3E6'
    rr(g, 44, 28, 36, 5, 2.5)
    g.fill()
    rr(g, 44, 40, 26, 5, 2.5)
    g.fill()
  })
  const idCard = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ map: idTex, transparent: true, toneMapped: false, side: THREE.DoubleSide }))
  scene.add(idCard)

  /* the good request */
  const good = packet(C.brand, 0.35)
  scene.add(good.g)

  /* RIGHT · APPLICATION + DATA: the application block (where the cabin stood) with a shield on its face, an intake
     on its left side, and the data vault's round door below the shield, locked */
  const cx = P.cabX
  const appM = mat('#F7F9FD', { roughness: 0.4 })
  scene.add(box(1.62, 1.8, 1.2, appM, [cx, 0.9, -0.95], 0.12))
  scene.add(box(1.66, 0.12, 1.24, mat(C.brand, { roughness: 0.45 }), [cx, 1.78, -0.95], 0.05))
  /* the intake: a lit doorway on the block's front-left where requests enter */
  const intakeM = glow('#7FB2FF', '#1D2C5E', { roughness: 0.3 })
  scene.add(box(0.4, 0.46, 0.03, mat('#DCE6FF', { roughness: 0.4 }), [cx - 0.52, 1.08, -0.345], 0.05))
  scene.add(box(0.3, 0.36, 0.03, intakeM, [cx - 0.52, 1.08, -0.33], 0.04))
  /* the shield */
  const sh = new THREE.Shape()
  sh.moveTo(0, 0.3)
  sh.bezierCurveTo(0.1, 0.24, 0.2, 0.24, 0.24, 0.24)
  sh.bezierCurveTo(0.24, 0.0, 0.18, -0.18, 0, -0.3)
  sh.bezierCurveTo(-0.18, -0.18, -0.24, 0.0, -0.24, 0.24)
  sh.bezierCurveTo(-0.2, 0.24, -0.1, 0.24, 0, 0.3)
  const shGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 4 })
  const shieldM = glow(C.brand, C.brand, { roughness: 0.3, metalness: 0.15 })
  const shield = mesh(shGeo, shieldM, [cx + 0.14, 1.38, -0.36])
  scene.add(shield)
  const tick = new THREE.Shape()
  tick.moveTo(-0.1, 0.0)
  tick.lineTo(-0.03, -0.08)
  tick.lineTo(0.11, 0.08)
  tick.lineTo(0.08, 0.11)
  tick.lineTo(-0.03, -0.02)
  tick.lineTo(-0.07, 0.03)
  tick.lineTo(-0.1, 0.0)
  scene.add(mesh(new THREE.ExtrudeGeometry(tick, { depth: 0.02, bevelEnabled: false }), mat('#FFFFFF'), [cx + 0.14, 1.38, -0.27]))
  /* the vault: a round steel door with a handle wheel and a padlock, set into the block's face */
  const vault = new THREE.Group()
  vault.position.set(cx + 0.2, 0.6, -0.33)
  scene.add(vault)
  const ring = mesh(new THREE.TorusGeometry(0.36, 0.045, 14, 48), mat('#A9B4C8', { metalness: 0.6, roughness: 0.3 }), [0, 0, 0])
  vault.add(ring)
  const vdoor = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 48), mat('#C7D0DE', { metalness: 0.55, roughness: 0.3 }), [0, 0, 0])
  vdoor.rotation.x = Math.PI / 2
  vault.add(vdoor)
  const wheel = new THREE.Group()
  wheel.position.z = 0.06
  vault.add(wheel)
  wheel.add(mesh(new THREE.TorusGeometry(0.17, 0.018, 10, 32), mat('#5C6B8A', { metalness: 0.6, roughness: 0.3 })))
  for (let i = 0; i < 3; i++) {
    const sp = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8), mat('#5C6B8A', { metalness: 0.6 }))
    sp.rotation.z = (i * Math.PI) / 3
    wheel.add(sp)
  }
  wheel.add(mesh(new THREE.SphereGeometry(0.04, 12, 12), mat('#5C6B8A', { metalness: 0.6 })))
  const vlockM = glow(C.orange, '#E7B53C', { metalness: 0.5, roughness: 0.3 })
  const vlock = new THREE.Group()
  vlock.position.set(0.27, -0.23, 0.08)
  vlock.add(box(0.14, 0.11, 0.05, vlockM, [0, 0, 0], 0.02))
  vlock.add(mesh(new THREE.TorusGeometry(0.045, 0.012, 10, 24, Math.PI), mat('#B9C2D3', { metalness: 0.7, roughness: 0.25 }), [0, 0.055, 0]))
  vault.add(vlock)
  /* the data the vault keeps: three stacked disks beside it, on the block's face, behind glass */
  /* the data itself, seen in a glass niche beside the vault: a glowing database stack */
  scene.add(box(0.44, 0.56, 0.06, mat('#1D2C5E', { roughness: 0.6 }), [cx - 0.5, 0.46, -0.34], 0.04))
  const dataM = glow(C.brand, '#7FA6FF', { roughness: 0.35 })
  for (let i = 0; i < 3; i++) scene.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 32), dataM, [cx - 0.5, 0.29 + i * 0.13, -0.24]))
  scene.add(mesh(new THREE.PlaneGeometry(0.4, 0.52), new THREE.MeshStandardMaterial({ color: '#CFE0FF', transparent: true, opacity: 0.16, roughness: 0.05 }), [cx - 0.5, 0.46, -0.12]))

  /* MONITORING: the same two cameras over the hall */
  const cams = P.cams.map(([x, y]) => cctv(scene, x, y, P.backZ))

  return (t) => {
    const c = mod(t, L)
    /* the good request: in from the left edge, scanned in the gate (beat 1), on to the reader (beat 2), then into the
       application's intake (beat 3); hidden inside the block until the loop restarts with the next one off frame */
    const y0 = 1.08
    /* it arrives up the walkway from the front (from below the frame), straight into the gate's opening */
    const arrive = seg(c, -0.05, 0.32)
    let gx: number
    if (c < 0.32) gx = rayX(ax, lerp(4.6, 0.0, arrive))
    else if (c < 1.55) gx = ax
    else if (c < 2.35) gx = lerp(ax, P.pax2[0], seg(c, 1.55, 2.3))
    else if (c < 4.4) gx = P.pax2[0]
    else gx = lerp(P.pax2[0], cx - 0.52, seg(c, 4.4, 5.15))
    const into = seg(c, 5.0, 5.3)
    /* the last leg arcs over the badge reader, never in front of it */
    const hop = c >= 4.4 ? Math.sin(Math.PI * seg(c, 4.4, 5.15)) * 0.62 : 0
    const gz = c < 0.32 ? lerp(4.6, 0.0, arrive) : c < 2.35 ? lerp(0.0, 0.12, seg(c, 1.55, 2.3)) : lerp(0.12, -0.3, into)
    good.g.position.set(gx, lerp(0.55, y0, arrive) + 0.04 * Math.sin(c * 5) + hop, gz)
    /* a packet nearer the camera is shrunk by its depth, so on screen it never looks bigger than the gate opening */
    const persp = (CAM[2] - gz) / CAM[2]
    good.g.scale.setScalar(lerp(1, 0.3, into) * persp)
    good.g.visible = c < 5.3
    good.g.rotation.y = c * 0.9
    /* gate scan and light */
    const sweep = seg(c, 0.3, 0.85) - seg(c, 0.85, 1.4)
    beamM.opacity = 0.75 * win(c, 0.3, 1.4, 0.12)
    beam.position.set(ax, lerp(2.0, 0.25, sweep), 0)
    const ok = win(c, 1.4, 2.2, 0.15)
    gateLight.color.set(ok > 0.5 ? '#CFF5DC' : '#F7D9D9')
    gateLight.emissive.set(ok > 0.5 ? C.green : C.red)
    gateLight.emissiveIntensity = ok > 0.5 ? 0.9 * ok + 0.1 : 0.35
    /* the malformed request: arrives in beat 2, hits the shield and is pushed back off the frame */
    const bk = c - 2.3
    if (bk > 0 && bk < 1.6) {
      const hit = 0.9
      const back = clamp01((bk - hit) / 0.7)
      /* up the walkway from the front into the shield field, then knocked back toward the front and down */
      const bz = bk < hit ? lerp(4.6, 0.3, sm(bk / hit)) : lerp(0.3, 1.3, sm(back))
      const bx = rayX(ax, bz)
      const by = bk < hit ? lerp(0.55, y0 + 0.1, sm(bk / hit)) : y0 + 0.1 + 0.25 * Math.sin(back * Math.PI) - 0.9 * back * back
      bad.g.visible = true
      bad.g.position.set(bx, Math.max(0.12, by), bz)
      bad.g.rotation.set(bk * 1.6, bk * 2.2, 0)
      bad.g.scale.setScalar(Math.max(0.01, (1 - sm(back)) * ((CAM[2] - bz) / (CAM[2] - 0.3))))
    } else bad.g.visible = false
    const flash = win(c, 3.15, 3.45, 0.12)
    fieldM.opacity = 0.12 + 0.4 * flash
    flameM.emissiveIntensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin((c / L) * Math.PI * 6))
    flame.scale.set(1, 1 + 0.06 * Math.sin((c / L) * Math.PI * 12), 1)
    /* the ID check */
    const show = win(c, 2.35, 4.3, 0.2)
    idCard.visible = show > 0.01
    idCard.position.set(P.pax2[0] + 0.24, y0 + 0.3 + 0.06 * show, 0.12)
    idCard.scale.setScalar(Math.max(0.01, show))
    idCard.rotation.y = -0.35
    const idOk = win(c, 3.45, 4.3, 0.15)
    readerM.emissiveIntensity = 0.9 * idOk
    readerLed.emissive.set(idOk > 0.5 ? C.green : C.red)
    readerLed.emissiveIntensity = idOk > 0.5 ? 1.2 : 0.4
    /* the application: the intake glows as the request goes in; the vault stays locked, its padlock pulsing */
    intakeM.emissiveIntensity = 0.15 + 0.85 * win(c, 4.9, 5.5, 0.2)
    const pulse = win(c, 4.45, 6.45, 0.2) * (0.5 + 0.5 * Math.sin(((c - 4.45) / 1.0) * Math.PI * 2 - Math.PI / 2))
    vlockM.emissiveIntensity = 0.55 * pulse
    vlock.scale.setScalar(1 + 0.1 * pulse)
    /* the wheel tries a quarter turn and is stopped by the lock, then settles back */
    wheel.rotation.z = 0.35 * Math.sin(Math.PI * seg(c, 5.3, 6.3))
    shieldM.emissiveIntensity = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin((c / L) * Math.PI * 2))
    dataM.emissiveIntensity = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin((c / L) * Math.PI * 4))
    cams.forEach((cm, i) => {
      cm.pan.rotation.y = 0.55 * Math.sin((c / L) * Math.PI * 2 + i * 2.1)
      cm.led.emissiveIntensity = mod(c + i * 0.4, 1.1) < 0.18 ? 1.6 : 0.2
    })
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
const Stage = ({ step, setup }: { step: number; setup: (k: StageKit) => Update }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={HOLD} />
  </div>
)
const T16Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupEveryday} />
const T16Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupConcept} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T16Everyday: T16Everyday as (p: Record<string, unknown>) => ReactNode,
  I_T16Concept: T16Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
