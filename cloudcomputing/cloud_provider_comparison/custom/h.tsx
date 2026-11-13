import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, lightRig, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { Character } from '@/decks/figures/cast/rig/Character'
import type { Skin } from '@/decks/figures/cast/skins/types'
import awsUrl from '../images/aws.png'
import azureUrl from '../images/azure.svg'
import gcpUrl from '../images/google-cloud.svg'
/* the official IBM Cloud logo with its white margin trimmed (nothing redrawn), so the mark fills its tile */
import ibmUrl from './h-ibm-cloud.png'
import oracleUrl from '../images/oracle.svg'

/**
 * BUILDER H · SESSION 11 (Cloud Provider Comparison) ANALOGIES ON SLIDES 11 (TR 3, general physician and cardiologist ↔
 * hyperscalers and enterprise specialists) AND 16 (TR 7, one recharge from three telecom kiosks ↔ one virtual machine
 * from three providers). Built to the Session 9 / 10 review rules from the first draft (generate-slides standing
 * corrections 13-16, cloud course R10-R13):
 *  - real-time 3D on the engine's ONE shared renderer (`@/engine/three-stage`), perspective camera, a real place;
 *    never isometric, never clay;
 *  - people are Character Lab characters (rig frames pre-rendered onto depth-tested planes, `rigSprite` below with a
 *    `dress` hook for role clothing: the doctors' white coats and stethoscopes, the patients' sling and ice pack, the
 *    kiosk staff's lanyards), each an individual, expressions synced to the action, minimal joints for standing roles;
 *  - no text, digits or labels on either card; provider marks (images) only on the concept cards, on white tiles,
 *    never moving; the concept card mirrors the everyday card position for position;
 *  - every loop is wall-clock driven, plays the whole action and ends on its first frame (no rest beat);
 *  - both cards loop from the moment the slide opens (the analogy slide has no presses); held frames (`?still`,
 *    thumbnails, reduced motion) draw the key moment at the HOLD time with nothing moving.
 *
 *   S11 everyday  a clinic: on the left a general physician sees a stream of patients, each with a different everyday
 *                 ailment (an arm in a sling, a cough, a fever with an ice pack), who walk in, are examined and leave in
 *                 turn; on the right, under a heart sign and a wall-mounted ECG monitor tracing a heartbeat, a
 *                 cardiologist examines one patient holding his chest. Each doctor holds the stethoscope in front of
 *                 themself: no limb crosses another person, one body-width between every two people.
 *   S11 concept   a data hall, same places: three hyperscaler racks (AWS, Azure, Google Cloud marks) serve a stream of
 *                 different workloads (web, mobile, data) arriving in turn; on the right two specialist racks (IBM
 *                 Cloud, Oracle marks, the same tile size) each hold one enterprise workload (a bank's mainframe, an
 *                 Oracle database) in an open bay on a steady pulse, a wall-mounted status screen tracing the beat.
 *   S16 everyday  a street with three telecom kiosks in three colours, each with its own plan board on the roof; a
 *                 customer with a phone stands at each (nobody walks, so no one ever passes in front of anyone); in
 *                 turn each attendant hands over the same recharge card, it goes into that customer's phone and the
 *                 data and call bars fill the same way; all three phones show full together, then run down.
 *   S16 concept   the same street with three provider kiosks (AWS, Azure, Google Cloud marks on the roof boards), a
 *                 server rack inside each where the attendant stood, a user with an open laptop at each; in turn each
 *                 rack hands out the same virtual machine block, which lands in the laptop and fills the same bars.
 */

const W = 470
const H = 390

const C = {
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandSoft: '#DCE6FF',
  navy: '#1F2E63',
  ink: '#00254B',
  white: '#FFFFFF',
  steel: '#C9D3E6',
  wood: '#C99A6A',
  orange: '#FF8A3D',
  gold: '#F2C14E',
  green: '#16A34A',
  red: '#E5484D',
  teal: '#14B8A6',
  purple: '#8B5CF6',
  coral: '#F97354',
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
const lerp3 = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple, k: number): THREE.Vector3Tuple => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]
const arc = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple, k: number, lift: number): THREE.Vector3Tuple => {
  const p = lerp3(a, b, k)
  p[1] += Math.sin(k * Math.PI) * lift
  return p
}
const mod = (t: number, l: number) => ((t % l) + l) % l

/* drawn textures are rasterised at TEX_SS x their logical size so they stay crisp on a 4K screen (correction 15) */
const TEX_SS = 3
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w * TEX_SS
  c.height = h * TEX_SS
  const g = c.getContext('2d')!
  g.scale(TEX_SS, TEX_SS)
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}
/** a texture that a scene redraws (a monitor trace, a phone screen); `paint` draws in logical px */
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

/**
 * An official mark drawn into a canvas texture, contained (aspect kept, rule R8.5) in a w x h box with padding. An SVG
 * with only a viewBox gets explicit width / height first, so every browser rasterises it at full size.
 */
function markTex(url: string, aspect: number, onLoad: () => void, pad = 0.12): THREE.CanvasTexture {
  const H0 = 512
  const W0 = Math.round(H0 * aspect)
  const c = document.createElement('canvas')
  c.width = W0
  c.height = H0
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const place = (im: HTMLImageElement) => {
    const iw = im.naturalWidth || 300
    const ih = im.naturalHeight || 150
    const bw = W0 * (1 - 2 * pad)
    const bh = H0 * (1 - 2 * pad)
    const k = Math.min(bw / iw, bh / ih)
    const g = c.getContext('2d')!
    g.clearRect(0, 0, W0, H0)
    g.imageSmoothingQuality = 'high'
    g.drawImage(im, (W0 - iw * k) / 2, (H0 - ih * k) / 2, iw * k, ih * k)
    t.needsUpdate = true
    onLoad()
  }
  const load = (src: string) => {
    const im = new Image()
    im.onload = () => place(im)
    im.src = src
  }
  const isSvg = /\.svg($|\?)/.test(url) || url.startsWith('data:image/svg')
  if (!isSvg) load(url)
  else
    void fetch(url)
      .then((r) => r.text())
      .then((txt) => {
        const vb = /viewBox=["']([-\d.\s]+)["']/.exec(txt)?.[1].trim().split(/\s+/).map(Number)
        let s = txt.replace(/<svg([^>]*?)\swidth=["'][^"']*["']/, '<svg$1').replace(/<svg([^>]*?)\sheight=["'][^"']*["']/, '<svg$1')
        if (vb && vb.length === 4) {
          const k = 1024 / Math.max(vb[2], vb[3])
          s = s.replace('<svg', `<svg width="${Math.round(vb[2] * k)}" height="${Math.round(vb[3] * k)}"`)
        }
        load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s))
      })
      .catch(() => load(url))
  return t
}

const box = (w: number, h: number, d: number, m: THREE.Material, pos: THREE.Vector3Tuple, r = 0) =>
  mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m, pos)

/** a white rounded tile carrying an official mark (rule 54); w x h scene units, the mark contained inside */
function markTile(url: string, w: number, h: number, redraw: () => void, pad = 0.14): THREE.Group {
  const g = new THREE.Group()
  g.add(box(w, h, 0.05, mat(C.white, { roughness: 0.4, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.45 }), [0, 0, 0], Math.min(w, h) * 0.08))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: markTex(url, w / h, redraw, pad), transparent: true, toneMapped: false }))
  face.position.z = 0.027
  g.add(face)
  return g
}

const glowMat = (color: string, base = C.white, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })

/** a flat picture on a wall (a sign, a poster): a thin box with the texture on its face */
function plaque(w: number, h: number, tex: THREE.Texture, pos: THREE.Vector3Tuple): THREE.Mesh {
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
  const edge = mat('#E6ECF6')
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), [edge, edge, edge, edge, face, face])
  m.position.set(...pos)
  m.castShadow = true
  return m
}

/** floor and back wall (shadow receivers) */
function room(scene: THREE.Scene, floor: THREE.Material, wall: THREE.Material, backZ: number) {
  const f = mesh(new THREE.PlaneGeometry(14, 10), floor, [0, 0, 0])
  f.rotation.x = -Math.PI / 2
  f.castShadow = false
  const b = mesh(new THREE.PlaneGeometry(14, 6), wall, [0, 3, backZ])
  b.castShadow = false
  const wm = wall as THREE.MeshStandardMaterial
  if (wm.emissive) {
    wm.emissive = wm.color.clone()
    wm.emissiveIntensity = 0.55
  }
  scene.add(f, b)
}

const tileTex = (base: string, line: string, n: number, repeat: [number, number]) =>
  canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = base
      g.fillRect(0, 0, 128, 128)
      g.strokeStyle = line
      g.lineWidth = 2
      const s = 128 / n
      for (let i = 0; i <= n; i++) {
        g.beginPath()
        g.moveTo(0, i * s)
        g.lineTo(128, i * s)
        g.moveTo(i * s, 0)
        g.lineTo(i * s, 128)
        g.stroke()
      }
    },
    repeat,
  )

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; plane: THREE.Mesh; update: (t: number, camera: THREE.Camera) => void }
/**
 * The engine's `castSprite` with a `dress` hook (role clothing drawn in the rig's own frames, so it moves with it), as
 * in Session 10's h.tsx: the rig loop is pre-rendered into `frames` images, on demand, onto a depth-tested,
 * camera-facing plane (a desk or a counter in front hides it). `px` is the texture width: sized to the person's
 * on-screen height (about 135 CSS px here, ~400 device px on a 4K screen, so 320 px wide = 480 tall).
 */
function rigSprite(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; timeline: (t: number) => Timeline; pose?: (p: Pose, t: number) => void; loop: number; frames: number; height: number; px?: number; wide?: number; onReady?: () => void }): Sprite {
  /* The engine's sprite since 2026-11-13 (low-end pass): the same frames, built by the engine's queue a little per
     animation frame, soonest-shown first, stopped when the slide leaves, each uploaded and its canvas freed at once.
     This function used to build every frame itself, back to back, and went on after the slide had gone. */
  return castSprite({ ...o, px: o.px ?? 320 })
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

/** an open white lab coat over a shirt and tie: lapels, side pockets, hem at the knee */
const LAB_COAT = (shirt: string, tie?: string) => (
  <g data-part="labcoat">
    <path d="M 186 203 L 214 203 L 200 292 Z" fill={shirt} />
    {tie && <path d="M 196 210 L 204 210 L 206 262 L 200 274 L 194 262 Z" fill={tie} />}
    <path d="M 134 214 C 140 206 168 202 186 202 L 198 300 L 198 478 L 132 478 C 130 400 128 300 134 214 Z" fill="#FFFFFF" stroke="#D4DDEC" strokeWidth={2.5} />
    <path d="M 266 214 C 260 206 232 202 214 202 L 202 300 L 202 478 L 268 478 C 270 400 272 300 266 214 Z" fill="#FFFFFF" stroke="#D4DDEC" strokeWidth={2.5} />
    <path d="M 186 202 L 172 240 L 192 262 Z" fill="#F1F5FB" stroke="#D4DDEC" strokeWidth={2} />
    <path d="M 214 202 L 228 240 L 208 262 Z" fill="#F1F5FB" stroke="#D4DDEC" strokeWidth={2} />
    <rect x={146} y={378} width={34} height={28} rx={4} fill="none" stroke="#D4DDEC" strokeWidth={2.5} />
    <rect x={220} y={378} width={34} height={28} rx={4} fill="none" stroke="#D4DDEC" strokeWidth={2.5} />
    <rect x={226} y={250} width={22} height={18} rx={3} fill="none" stroke="#D4DDEC" strokeWidth={2} />
    <rect x={232} y={244} width={3} height={14} rx={1.5} fill={C.brand} />
  </g>
)
/** the cardiologist's heart pin on her coat pocket */
const HEART_PIN = <path data-part="heartpin" d="M 237 246 C 232 240 226 244 230 250 L 237 257 L 244 250 C 248 244 242 240 237 246 Z" fill="#E5484D" />
/** a stethoscope hanging round the neck (body space, drawn after the head) */
const STETHOSCOPE = (
  <g data-part="stethoscope" fill="none" strokeLinecap="round">
    <path d="M 184 204 C 170 236 170 278 186 304" stroke="#33415F" strokeWidth={5} />
    <path d="M 216 204 C 230 232 232 256 226 272" stroke="#33415F" strokeWidth={5} />
    <circle cx={190} cy={314} r={10} fill="#C9D3E6" stroke="#33415F" strokeWidth={4} />
    <circle cx={226} cy={278} r={4} fill="#33415F" />
  </g>
)
/** an arm sling: the strap over the neck and the cradle across the waist, in a soft blue cloth */
const SLING = (
  <g data-part="sling">
    <path d="M 182 204 L 196 204 L 262 306 L 248 312 Z" fill="#7FA6FF" />
    <path d="M 150 292 C 186 284 236 286 262 300 L 258 334 C 226 346 178 344 150 330 Z" fill="#9DB9FF" stroke="#6E92F0" strokeWidth={2.5} />
  </g>
)
/** an ice pack held on the head (head-local, skull centre 0,0) */
const ICE_PACK = (
  <g data-part="icepack">
    <ellipse cx={22} cy={-92} rx={46} ry={22} fill="#8FD3FF" stroke="#4AA8E8" strokeWidth={3} />
    <rect x={56} y={-104} width={18} height={22} rx={5} fill="#2D63FB" />
    <path d="M -6 -98 Q 8 -106 22 -98 Q 36 -90 50 -98" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.8} />
  </g>
)
/** a kiosk attendant's lanyard and card in the kiosk's colour */
const LANYARD = (color: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 196 290 M 214 206 L 204 290" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={186} y={288} width={28} height={34} rx={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
    <rect x={192} y={295} width={16} height={11} rx={2} fill={color} opacity={0.6} />
  </g>
)

/* ================================================================== S10 · the clinic (TR 3) */

/* one cycle is one consultation: every person's loop is a whole number of cycles, so all loops line up */
const CY = 2.6
const L3 = CY * 3
const HOLD3 = CY * 0 + 1.25
/* the consultation inside a cycle: walk in, examined, walk out (no two patients ever on screen together) */
const CYC = { inA: 0, inB: 0.62, exA: 0.7, exB: 1.95, outA: 1.98, outB: 2.6 }
/* places shared by both cards (position for position). User review (2026-11-11): two clearly separate rooms side by
   side, a solid wall between them; left the general physician's clinic room (examination bed between patient and
   doctor, medicine cabinet, BP gauge, first-aid cross), right the cardiology room (heart symbols dominant). One
   body-width (>= 0.9) between every two people; every prop in its own column, so nothing overlaps from the camera. */
const P3 = {
  enter: -3.1,
  spot: [-1.42, 0, -0.3] as THREE.Vector3Tuple,
  bedX: -0.86,
  gp: [-0.3, 0, -0.72] as THREE.Vector3Tuple,
  cabinetX: 0.14,
  wallX: 0.47,
  heartPt: [1.04, 0, -0.36] as THREE.Vector3Tuple,
  cardio: [1.96, 0, -0.72] as THREE.Vector3Tuple,
  /* the wall-mounted ECG monitor: centre x, y */
  screen: [1.74, 2.04] as [number, number],
  heartSignX: 0.98,
  /* the heart model on its pedestal, right of the cardiologist, clear of her */
  pedestal: [2.45, 0, -0.32] as THREE.Vector3Tuple,
  backZ: -1.45,
}
/* framed on both rooms: patient spot (-1.7) to the cardiologist / the Oracle database (2.6), floor to the wall signs */
function frame3(camera: THREE.PerspectiveCamera) {
  camera.fov = 33
  camera.position.set(0.48, 1.48, 6.05)
  camera.lookAt(0.48, 1.0, -0.6)
}
/**
 * Two rooms side by side: each its own floor tone and back wall, a solid dividing wall with a door-frame trim facing
 * the camera. Returns nothing; every surface receives shadows.
 */
function twoRooms(scene: THREE.Scene, L: { floor: string; line: string; wall: string; band: string }, R: { floor: THREE.Material; wall: THREE.Material; band?: string }) {
  const x0 = P3.wallX
  const fl = mesh(new THREE.PlaneGeometry(8, 10), mat('#ffffff', { map: tileTex(L.floor, L.line, 4, [6, 7]), roughness: 0.8 }), [x0 - 4, 0, 0])
  fl.rotation.x = -Math.PI / 2
  fl.castShadow = false
  const fr = mesh(new THREE.PlaneGeometry(8, 10), R.floor, [x0 + 4, 0.001, 0])
  fr.rotation.x = -Math.PI / 2
  fr.castShadow = false
  const wallL = mat(L.wall, { roughness: 0.95, emissive: new THREE.Color(L.wall), emissiveIntensity: 0.55 })
  const wl = mesh(new THREE.PlaneGeometry(8, 6), wallL, [x0 - 4, 3, P3.backZ])
  wl.castShadow = false
  const wr = mesh(new THREE.PlaneGeometry(8, 6), R.wall, [x0 + 4, 3, P3.backZ])
  wr.castShadow = false
  scene.add(fl, fr, wl, wr)
  scene.add(box(8, 0.24, 0.03, mat(L.band, { roughness: 0.8 }), [x0 - 4, 1.2, P3.backZ + 0.02]))
  if (R.band) scene.add(box(8, 0.24, 0.03, mat(R.band, { roughness: 0.8 }), [x0 + 4, 1.2, P3.backZ + 0.02]))
  /* the dividing wall, from the back wall to the front of the rooms, with a white door-frame trim on its front edge */
  const zb = P3.backZ
  const zf = -0.18
  scene.add(box(0.14, 3.2, zf - zb, mat('#E3E8F0', { roughness: 0.7 }), [x0, 1.6, (zb + zf) / 2]))
  scene.add(box(0.18, 3.2, 0.05, mat('#FFFFFF', { roughness: 0.5 }), [x0, 1.6, zf + 0.025]))
}
/** the patient's x along the walk in / out of the current cycle (off frame at the left edge) */
const walkX = (k: number) => (k < CYC.exA ? lerp(P3.enter, P3.spot[0], seg(k, CYC.inA, CYC.inB)) : lerp(P3.spot[0], P3.enter, seg(k, CYC.outA, CYC.outB)))
const walking = (k: number) => (k < CYC.inB + 0.02 && k > CYC.inA) || (k > CYC.outA && k < CYC.outB)
const bob = (k: number) => (walking(k) ? Math.abs(Math.sin(k * Math.PI * 4.6)) * 0.045 : 0)

/** the ECG trace: a scrolling heartbeat line on a dark monitor, three beats per cycle */
function ecgPainter() {
  const lt = liveTex(240, 160)
  const beat = (u: number) => {
    /* one PQRST complex over u in 0..1 */
    const g = (c: number, w: number, a: number) => a * Math.exp(-((u - c) * (u - c)) / (2 * w * w))
    return g(0.18, 0.03, 0.12) - g(0.36, 0.012, 0.18) + g(0.4, 0.014, 1.0) - g(0.44, 0.014, 0.32) + g(0.66, 0.05, 0.22)
  }
  return {
    tex: lt.tex,
    paint(c: number, color: string) {
      lt.paint((g) => {
        g.fillStyle = '#0E1A33'
        g.fillRect(0, 0, 240, 160)
        g.strokeStyle = 'rgba(120,160,255,0.12)'
        g.lineWidth = 1
        for (let x = 0; x <= 240; x += 20) {
          g.beginPath()
          g.moveTo(x, 0)
          g.lineTo(x, 160)
          g.stroke()
        }
        for (let y = 0; y <= 160; y += 20) {
          g.beginPath()
          g.moveTo(0, y)
          g.lineTo(240, y)
          g.stroke()
        }
        /* three beats per cycle; the sweep head moves left to right, the trace behind it fades */
        const per = CY / 3
        const head = (mod(c, per) / per) * 240
        g.lineWidth = 3
        g.lineCap = 'round'
        g.lineJoin = 'round'
        for (let x = 0; x < 240; x += 2) {
          const age = mod(head - x, 240) / 240
          const a = 1 - age
          if (a <= 0.02) continue
          const y0 = 96 - beat(x / 240) * 70
          const y1 = 96 - beat((x + 2) / 240) * 70
          g.strokeStyle = color
          g.globalAlpha = a
          g.beginPath()
          g.moveTo(x, y0)
          g.lineTo(x + 2, y1)
          g.stroke()
        }
        g.globalAlpha = 1
        g.fillStyle = '#FFFFFF'
        g.beginPath()
        g.arc(head, 96 - beat(head / 240) * 70, 4, 0, Math.PI * 2)
        g.fill()
      })
    },
  }
}

/** a heart shape (extruded) for the heart model */
function heartShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(-0.15, -0.35, -0.6, -0.1, -0.6, 0.22)
  s.bezierCurveTo(-0.6, 0.5, -0.25, 0.62, 0, 0.36)
  s.bezierCurveTo(0.25, 0.62, 0.6, 0.5, 0.6, 0.22)
  s.bezierCurveTo(0.6, -0.1, 0.15, -0.35, 0, -0.5)
  return s
}
const crossSign = () =>
  canvasTex(96, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 96, 96)
    g.fillStyle = C.green
    g.fillRect(36, 16, 24, 64)
    g.fillRect(16, 36, 64, 24)
  })
const heartSign = () =>
  canvasTex(96, 96, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 96, 96)
    g.fillStyle = C.red
    g.beginPath()
    g.moveTo(48, 78)
    g.bezierCurveTo(36, 66, 14, 54, 14, 34)
    g.bezierCurveTo(14, 18, 34, 12, 48, 28)
    g.bezierCurveTo(62, 12, 82, 18, 82, 34)
    g.bezierCurveTo(82, 54, 60, 66, 48, 78)
    g.fill()
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 5
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(22, 46)
    g.lineTo(38, 46)
    g.lineTo(44, 34)
    g.lineTo(52, 58)
    g.lineTo(58, 46)
    g.lineTo(74, 46)
    g.stroke()
  })


/** a dark screen on a wall bracket at P3.screen (the ECG monitor, the status screen): nothing floats */
function wallScreen(scene: THREE.Scene, tex: THREE.Texture) {
  const [x, y] = P3.screen
  const g = new THREE.Group()
  g.position.set(x, y, P3.backZ + 0.16)
  g.add(box(0.82, 0.54, 0.07, mat('#2A3558', { roughness: 0.4 }), [0, 0, 0], 0.03))
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.44), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))
  scr.position.z = 0.04
  g.add(scr)
  scene.add(g)
  /* the bracket: a wall plate and an arm into the screen's back */
  scene.add(box(0.22, 0.16, 0.02, mat('#AFC0DE', { roughness: 0.4 }), [x, y, P3.backZ + 0.01]))
  scene.add(box(0.06, 0.06, 0.14, mat('#AFC0DE', { roughness: 0.4 }), [x, y, P3.backZ + 0.08]))
  return g
}

function setupT03E(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EEF3FB')
  frame3(camera)
  lightRig(scene, [0, 0.6, -0.5])
  /* left: the clinic room, cool mint and blue-grey; right: the cardiology room, warm rose */
  twoRooms(
    scene,
    { floor: '#E9F1F8', line: '#D5E1EE', wall: '#EAF6F1', band: '#A9DCC6' },
    { floor: mat('#ffffff', { map: tileTex('#F9E6EA', '#EFD0D7', 4, [6, 7]), roughness: 0.8 }), wall: mat('#FBE1E7', { roughness: 0.95, emissive: new THREE.Color('#FBE1E7'), emissiveIntensity: 0.45 }), band: '#EE9DAE' },
  )

  /* THE CLINIC ROOM: the examination bed (seen end on, paper roll at its head) between patient and doctor */
  const white = mat('#FFFFFF', { roughness: 0.45 })
  const steel = mat('#B7C3D6', { roughness: 0.4, metalness: 0.3 })
  const bed = new THREE.Group()
  bed.position.set(P3.bedX, 0, -0.95)
  for (const dx of [-0.19, 0.19]) for (const dz of [-0.42, 0.42]) bed.add(box(0.04, 0.52, 0.04, steel, [dx, 0.26, dz]))
  bed.add(box(0.46, 0.06, 0.96, white, [0, 0.54, 0], 0.02))
  bed.add(box(0.44, 0.08, 0.94, mat('#9EC3E6', { roughness: 0.6 }), [0, 0.61, 0], 0.03))
  bed.add(box(0.36, 0.006, 0.8, mat('#FFFFFF', { roughness: 0.9 }), [0, 0.656, 0.04]))
  const headrest = box(0.44, 0.08, 0.34, mat('#9EC3E6', { roughness: 0.6 }), [0, 0.74, -0.42], 0.03)
  headrest.rotation.x = 0.55
  bed.add(headrest)
  const roll = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 20), mat('#FFFFFF', { roughness: 0.8 }), [0, 0.86, -0.56])
  roll.rotation.z = Math.PI / 2
  bed.add(roll)
  scene.add(bed)
  /* the medicine cabinet: white body, glass doors, coloured boxes on three shelves */
  const cab = new THREE.Group()
  cab.position.set(P3.cabinetX, 0, P3.backZ + 0.18)
  cab.add(box(0.3, 1.1, 0.3, white, [0, 0.55, 0], 0.02))
  const boxCols = ['#F2C14E', '#5B8CFF', '#16A34A', '#E5484D', '#7FD1C2', '#FF8A3D']
  for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) cab.add(box(0.09, 0.14, 0.12, mat(boxCols[(r * 2 + i) % 6], { roughness: 0.6 }), [-0.06 + i * 0.12, 0.42 + r * 0.24, 0.04]))
  for (let r = 0; r < 3; r++) cab.add(box(0.26, 0.015, 0.26, white, [0, 0.34 + r * 0.24, 0]))
  cab.add(box(0.26, 0.82, 0.01, new THREE.MeshStandardMaterial({ color: '#CFE0F2', transparent: true, opacity: 0.35, roughness: 0.1 }), [0, 0.66, 0.152]))
  scene.add(cab)
  /* the blood-pressure gauge on the wall above the cabinet: dial, needle, cuff and tube */
  const bp = new THREE.Group()
  bp.position.set(P3.cabinetX, 1.5, P3.backZ + 0.05)
  const dial = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 32), white, [0, 0, 0])
  dial.rotation.x = Math.PI / 2
  bp.add(dial)
  const rim = mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), steel, [0, 0, 0.02])
  bp.add(rim)
  const needle = box(0.008, 0.08, 0.01, mat(C.red), [0, 0, 0.03])
  needle.geometry.translate(0, 0.035, 0)
  bp.add(needle)
  bp.add(box(0.12, 0.2, 0.04, mat('#2E3A55', { roughness: 0.8 }), [0.0, -0.26, 0.0], 0.02))
  const tube = mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 24, Math.PI * 1.4), mat('#2E3A55'), [0.08, -0.13, 0.02])
  bp.add(tube)
  scene.add(bp)
  scene.add(plaque(0.44, 0.44, crossSign(), [P3.bedX, 2.02, P3.backZ + 0.04]))

  /* THE CARDIOLOGY ROOM: a large heart sign, the wall-mounted ECG monitor tracing a heartbeat, a beating heart model on
     a pedestal */
  scene.add(plaque(0.6, 0.6, heartSign(), [P3.heartSignX, 2.02, P3.backZ + 0.04]))
  const ecg = ecgPainter()
  wallScreen(scene, ecg.tex)
  const [px, , pz] = P3.pedestal
  scene.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.86, 28), white, [px, 0.43, pz]))
  scene.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 28), white, [px, 0.88, pz]))
  const heartM = new THREE.MeshStandardMaterial({ color: '#E04B5A', roughness: 0.35, emissive: new THREE.Color('#E04B5A'), emissiveIntensity: 0.1 })
  const heartGeo = new THREE.ExtrudeGeometry(heartShape(), { depth: 0.28, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 6, curveSegments: 24 })
  heartGeo.center()
  const heart = mesh(heartGeo, heartM, [px, 1.07, pz])
  heart.scale.setScalar(0.22)
  heart.rotation.y = -0.25
  scene.add(heart)

  /* people. The general physician: a young man (quiff, no glasses, deep skin), white coat over a teal scrub top and
     scrub trousers, stethoscope: nothing like the cardiologist */
  const gpCfg = who(CAST_PRESETS.arjun, { skinTone: 'dusky', hair: { style: 'quiff', color: 'black' }, outfit: { topColor: '#F7F9FC', bottom: 'trousers', bottomColor: '#2B7FA3', shoeColor: '#FFFFFF' }, accessories: { glasses: 'none', beard: 'none', belt: false, watch: true }, build: { height: 1.02, shoulders: 1 } })
  /* the cardiologist: bun, round glasses, coat over a teal blouse */
  const cdCfg = who(CAST_PRESETS.riya, { hair: { style: 'bun', color: 'black' }, outfit: { top: 'blouse', topColor: '#F7F9FC', bottom: 'trousers', bottomColor: '#2E3A55', shoeColor: '#2A2A30' }, accessories: { glasses: 'round', earrings: true } })
  /* the three GP patients and the heart patient, each their own look */
  const p1Cfg = who(CAST_PRESETS.kabir, { outfit: { topColor: '#FCC82B' } })
  const p2Cfg = who(CAST_PRESETS.meera, { hair: { style: 'ponytail' }, outfit: { top: 'kurta', topColor: '#1E9E8F', bottom: 'salwar', bottomColor: '#F2E6D0', shoeColor: '#5A3A2A' }, accessories: { earrings: true } })
  const p3Cfg = who(CAST_PRESETS.rohan, { outfit: { top: 'hoodie', topColor: '#7C5CE0', bottom: 'jeans', bottomColor: '#2C3C81' } })
  const hpCfg = who(CAST_PRESETS.dev, { hair: { style: 'short', color: 'grey' }, outfit: { top: 'shirt', topColor: '#E8C9A0', bottom: 'trousers', bottomColor: '#5B4A3A' }, accessories: { glasses: 'none', beard: 'stubble', watch: true }, build: { height: 0.98, shoulders: 1.04 } })

  /* the GP examines whoever stands at the spot: turns to them, listens with the stethoscope's chest piece raised,
     nods; between patients he looks down at his notes (one cycle) */
  const gp = rigSprite({
    config: gpCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{LAB_COAT('#2BA3B8')}</>, neckExtras: <>{k.neckExtras}{STETHOSCOPE}</> }),
    loop: CY,
    frames: 40,
    height: 1.74,
    onReady: redraw,
    timeline: (k) => ({ seed: 31, idle: CAST_IDLE, ...faceAt(k, [[0, 'neutral'], [CYC.inB - 0.1, 'listening'], [CYC.exA + 0.45, 'thinking'], [CYC.exB - 0.35, 'happy'], [CYC.outB - 0.25, 'neutral']], CY) }),
    pose: (p, k) => {
      const look = win(k, CYC.inA + 0.2, CYC.outA + 0.3, 0.25)
      to(p, 'headTurn', -0.45, look)
      to(p, 'lookX', -0.8, look)
      /* raises the stethoscope's chest piece in front of himself toward the patient: the arm stays on his own side */
      const ex = win(k, CYC.exA + 0.05, CYC.exB - 0.4, 0.25)
      to(p, 'shoulderL', 30, ex)
      to(p, 'elbowL', 78, ex)
      to(p, 'headNod', 0.18, win(k, CYC.exB - 0.45, CYC.exB, 0.15))
      /* notes between patients */
      const notes = win(k, CYC.outA + 0.15, CYC.outB, 0.2)
      to(p, 'lookY', 0.7, notes)
      to(p, 'headNod', 0.28, notes)
    },
  })
  gp.object.position.set(...P3.gp)

  /* the three patients: each visible only in its own cycle, same walk and examination, different ailment */
  type Ail = 'sling' | 'cough' | 'fever'
  const patient = (cfg: CharacterConfig, ail: Ail, seed: number, h: number) =>
    rigSprite({
      config: cfg,
      dress: (k) =>
        ail === 'sling' ? { ...k, neckExtras: <>{k.neckExtras}{SLING}</> } : ail === 'fever' ? { ...k, hairFront: <>{k.hairFront}{ICE_PACK}</> } : k,
      loop: CY,
      frames: 36,
      height: h,
      onReady: redraw,
      timeline: (k) => ({
        seed,
        idle: CAST_IDLE,
        ...faceAt(k, ail === 'sling' ? [[0, 'worried'], [CYC.exB - 0.4, 'happy'], [CYC.outB - 0.15, 'worried']] : ail === 'cough' ? [[0, 'sad'], [CYC.exA + 0.2, 'worried'], [CYC.exB - 0.4, 'happy'], [CYC.outB - 0.15, 'sad']] : [[0, 'sad'], [CYC.exB - 0.4, 'happy'], [CYC.outB - 0.15, 'sad']], CY),
      }),
      pose: (p, k) => {
        /* faces the doctor (screen-right) */
        to(p, 'headTurn', 0.4, 1)
        to(p, 'lookX', 0.75, 1)
        if (ail === 'sling') {
          /* the screen-right forearm rests across the waist in the sling */
          to(p, 'shoulderR', 6, 1)
          to(p, 'elbowR', 100, 1)
        } else if (ail === 'cough') {
          /* a hand to the mouth, the head dips with each cough (twice, while examined) */
          to(p, 'shoulderL', 14, 1)
          to(p, 'elbowL', 148, 1)
          const cough = Math.max(win(k, CYC.exA + 0.15, CYC.exA + 0.35, 0.08), win(k, CYC.exA + 0.6, CYC.exA + 0.8, 0.08))
          to(p, 'headNod', 0.35, cough)
          to(p, 'squint', 0.8, cough)
        } else {
          /* holds the ice pack on her head */
          to(p, 'shoulderR', 132, 1)
          to(p, 'elbowR', 128, 1)
          to(p, 'headTilt', -4, 1)
        }
      },
    })
  const pats = [patient(p1Cfg, 'sling', 32, 1.62), patient(p2Cfg, 'cough', 33, 1.6), patient(p3Cfg, 'fever', 34, 1.68)]
  for (const pt of pats) scene.add(pt.object)

  /* the cardiologist listens to the heart patient's chest; he holds his chest, worried, then calmer as she nods */
  const cd = rigSprite({
    config: cdCfg,
    dress: (k) => ({ ...k, top: <>{k.top}{LAB_COAT('#F3A3B5')}{HEART_PIN}</>, neckExtras: <>{k.neckExtras}{STETHOSCOPE}</> }),
    loop: CY,
    frames: 36,
    height: 1.64,
    onReady: redraw,
    timeline: (k) => ({ seed: 35, idle: CAST_IDLE, ...faceAt(k, [[0, 'listening'], [1.15, 'thinking'], [1.9, 'happy']], CY) }),
    pose: (p, k) => {
      to(p, 'headTurn', -0.45, 1)
      to(p, 'lookX', -0.85, 1)
      /* the chest piece held out to the patient, then a glance at the monitor behind her and a nod */
      const listen = win(k, 0.0, 1.25, 0.3)
      to(p, 'shoulderL', 30, listen)
      to(p, 'elbowL', 78, listen)
      /* glances up at the wall monitor behind the patient */
      const mon = win(k, 1.35, 1.85, 0.2)
      to(p, 'headTurn', -0.3, mon)
      to(p, 'lookX', -0.6, mon)
      to(p, 'lookY', -0.6, mon)
      to(p, 'headNod', 0.16, win(k, 1.95, 2.35, 0.15))
    },
  })
  cd.object.position.set(...P3.cardio)
  const hp = rigSprite({
    config: hpCfg,
    loop: CY,
    frames: 30,
    height: 1.7,
    onReady: redraw,
    timeline: (k) => ({ seed: 36, idle: CAST_IDLE, ...faceAt(k, [[0, 'worried'], [1.9, 'neutral'], [2.45, 'worried']], CY) }),
    pose: (p, k) => {
      to(p, 'headTurn', 0.4, 1)
      to(p, 'lookX', 0.7, 1)
      /* a hand pressed to his chest; the breath is heavier */
      to(p, 'shoulderL', 10, 1)
      to(p, 'elbowL', 118, 1)
      p.breathe = (p.breathe ?? 0) * 1.6
      to(p, 'browInnerL', 0.6, 1 - win(k, 1.9, 2.4, 0.2))
      to(p, 'browInnerR', 0.6, 1 - win(k, 1.9, 2.4, 0.2))
    },
  })
  hp.object.position.set(...P3.heartPt)
  scene.add(gp.object, cd.object, hp.object)

  return (t) => {
    const c = mod(t, L3)
    const n = Math.floor(c / CY) % 3
    const k = c - n * CY
    pats.forEach((pt, i) => {
      const on = i === n
      pt.object.visible = on
      if (on) {
        pt.object.position.set(walkX(k), bob(k), P3.spot[2])
        pt.update(k, camera)
      }
    })
    gp.update(k, camera)
    cd.update(k, camera)
    hp.update(k, camera)
    /* three beats per cycle, in step with the trace: the heart model swells on each */
    const per = CY / 3
    const u = mod(c, per) / per
    const pump = Math.exp(-((u - 0.42) * (u - 0.42)) / 0.004) * 0.16 + Math.exp(-((u - 0.62) * (u - 0.62)) / 0.006) * 0.06
    heart.scale.setScalar(0.22 * (1 + pump))
    heartM.emissiveIntensity = 0.1 + pump * 2.2
    ecg.paint(c, '#4BE38A')
  }
}

/* ---- the concept card: the data hall */

/** the mark tile every provider rack carries, one size for all five (fix round 1: IBM Cloud / Oracle as legible as
    the others) */
const TILE = { w: 0.4, h: 0.3 }
/**
 * A server rack (navy, blinking LEDs) with, optionally, a provider mark tile across its front top (TILE, the same for
 * every provider) and an open bay holding one workload block (a specialist's dedicated workload).
 */
function rack(scene: THREE.Scene, at: THREE.Vector3Tuple, o: { w?: number; h?: number; url?: string; pad?: number; bay?: boolean; redraw: () => void; leds: THREE.MeshStandardMaterial[]; glow?: THREE.MeshStandardMaterial }) {
  const w = o.w ?? 0.5
  const h = o.h ?? 1.7
  const g = new THREE.Group()
  g.position.set(...at)
  g.add(box(w, h, 0.5, o.glow ?? mat('#2A3558', { roughness: 0.5, metalness: 0.2 }), [0, h / 2, 0], 0.03))
  /* server units up to the mark tile (or the top), each with a blinking LED; the bay replaces two of them */
  const top = o.url ? h - 0.08 - TILE.h : h - 0.1
  const units = Math.floor((top - 0.12) / 0.2)
  for (let r = 0; r < units; r++) {
    const y = 0.18 + r * 0.2
    if (o.bay && y > 0.5 && y < 1.05) continue
    g.add(box(w - 0.1, 0.15, 0.02, mat('#38456E', { roughness: 0.6 }), [0, y, 0.255]))
    const lm = glowMat(r % 3 === 0 ? C.green : '#5B8CFF', '#0F1A33')
    o.leds.push(lm)
    g.add(box(0.04, 0.04, 0.02, lm, [w / 2 - 0.1, y, 0.268]))
  }
  if (o.bay) g.add(box(w - 0.08, 0.46, 0.04, mat('#121A33', { roughness: 0.7 }), [0, 0.78, 0.24]))
  if (o.url) {
    const tile = markTile(o.url, TILE.w, TILE.h, o.redraw, o.pad ?? 0.14)
    tile.position.set(0, h - 0.04 - TILE.h / 2, 0.28)
    g.add(tile)
  }
  scene.add(g)
  return g
}

/** a workload block: a white rounded block with an icon face (drawn, no text) */
function workloadTex(kind: 'web' | 'mobile' | 'data' | 'bank' | 'db') {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 128, 128)
    g.strokeStyle = C.brand
    g.fillStyle = C.brand
    g.lineWidth = 7
    g.lineCap = 'round'
    g.lineJoin = 'round'
    if (kind === 'web') {
      g.beginPath()
      g.arc(64, 64, 38, 0, Math.PI * 2)
      g.stroke()
      g.beginPath()
      g.ellipse(64, 64, 16, 38, 0, 0, Math.PI * 2)
      g.stroke()
      g.beginPath()
      g.moveTo(26, 64)
      g.lineTo(102, 64)
      g.stroke()
    } else if (kind === 'mobile') {
      g.strokeRect(42, 20, 44, 88)
      g.beginPath()
      g.arc(64, 96, 4, 0, Math.PI * 2)
      g.fill()
      g.fillRect(52, 30, 24, 4)
    } else if (kind === 'data') {
      g.fillRect(28, 72, 16, 32)
      g.fillRect(56, 48, 16, 56)
      g.fillRect(84, 28, 16, 76)
    } else if (kind === 'bank') {
      g.beginPath()
      g.moveTo(20, 46)
      g.lineTo(64, 20)
      g.lineTo(108, 46)
      g.closePath()
      g.fill()
      for (const x of [30, 52, 74, 96]) g.fillRect(x - 5, 52, 10, 40)
      g.fillRect(20, 96, 88, 10)
    } else {
      g.beginPath()
      g.ellipse(64, 34, 34, 12, 0, 0, Math.PI * 2)
      g.stroke()
      g.beginPath()
      g.moveTo(30, 34)
      g.lineTo(30, 94)
      g.ellipse(64, 94, 34, 12, 0, Math.PI, 0, true)
      g.lineTo(98, 34)
      g.stroke()
      g.beginPath()
      g.ellipse(64, 64, 34, 12, 0, 0, Math.PI)
      g.stroke()
    }
  })
}
function workload(kind: 'web' | 'mobile' | 'data' | 'bank' | 'db', size = 0.5): { g: THREE.Group; m: THREE.MeshStandardMaterial } {
  const g = new THREE.Group()
  const m = glowMat('#7FA6FF', '#F4F7FF', { roughness: 0.4 })
  g.add(box(size, size, size, m, [0, size / 2, 0], size * 0.12))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.8, size * 0.8), new THREE.MeshBasicMaterial({ map: workloadTex(kind), toneMapped: false }))
  face.position.set(0, size / 2, size / 2 + 0.003)
  g.add(face)
  return { g, m }
}


/** the enterprise room's back wall: a corporate glass curtain wall, tall panes between slim mullions, distant towers */
const glassWallTex = () => {
  const t = canvasTex(256, 192, (g) => {
    g.fillStyle = '#1F2E63'
    g.fillRect(0, 0, 256, 192)
    const panes = 4
    const pw = 256 / panes
    for (let i = 0; i < panes; i++) {
      const gr = g.createLinearGradient(0, 0, 0, 192)
      gr.addColorStop(0, '#D6E4FB')
      gr.addColorStop(1, '#A9C3EE')
      g.fillStyle = gr
      g.fillRect(i * pw + 3, 0, pw - 6, 192)
    }
    /* the city beyond the glass: a row of low office towers along the bottom */
    g.fillStyle = 'rgba(70, 98, 160, 0.4)'
    const towers = [
      [6, 150, 20],
      [30, 136, 16],
      [50, 158, 24],
      [80, 128, 18],
      [104, 146, 26],
      [136, 132, 18],
      [160, 154, 22],
      [188, 140, 18],
      [212, 150, 26],
      [240, 138, 14],
    ]
    for (const [x, y, w] of towers) g.fillRect(x, y, w, 192 - y)
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(4, 1)
  return t
}
/** a bank building model: steps, four columns, a pediment (the bank's mainframe workload beside IBM Cloud) */
function bankModel(): { g: THREE.Group; m: THREE.MeshStandardMaterial } {
  const g = new THREE.Group()
  const stone = new THREE.MeshStandardMaterial({ color: '#F4F6FB', roughness: 0.5, emissive: new THREE.Color('#5B8CFF'), emissiveIntensity: 0 })
  g.add(box(0.42, 0.05, 0.3, stone, [0, 0.025, 0], 0.01))
  g.add(box(0.38, 0.04, 0.26, stone, [0, 0.07, 0], 0.01))
  for (const x of [-0.13, -0.045, 0.045, 0.13]) g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 14), stone, [x, 0.22, 0.06]))
  g.add(box(0.36, 0.2, 0.16, mat('#C9D6EE', { roughness: 0.6 }), [0, 0.19, -0.05]))
  g.add(box(0.4, 0.04, 0.28, stone, [0, 0.37, 0], 0.01))
  const ped = new THREE.Shape()
  ped.moveTo(-0.2, 0)
  ped.lineTo(0.2, 0)
  ped.lineTo(0, 0.12)
  ped.closePath()
  const pg = new THREE.ExtrudeGeometry(ped, { depth: 0.26, bevelEnabled: false })
  pg.translate(0, 0, -0.13)
  g.add(mesh(pg, mat('#2D63FB', { roughness: 0.45 }), [0, 0.39, 0]))
  return { g, m: stone }
}
/** an Oracle database: three stacked discs in Oracle red and white, beside a small ERP office tower */
function dbModel(): THREE.Group {
  const g = new THREE.Group()
  const red = mat('#C74634', { roughness: 0.4 })
  const wht = mat('#FFFFFF', { roughness: 0.4 })
  for (let i = 0; i < 3; i++) {
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 32), i % 2 ? wht : red, [-0.06, 0.06 + i * 0.115, 0]))
  }
  /* the ERP office tower: a slim glass tower with floor bands */
  const tower = new THREE.Group()
  tower.position.set(0.17, 0, -0.06)
  tower.add(box(0.12, 0.62, 0.12, mat('#9DB9F5', { roughness: 0.2, metalness: 0.2 }), [0, 0.31, 0], 0.01))
  for (let i = 0; i < 6; i++) tower.add(box(0.125, 0.012, 0.125, mat('#FFFFFF'), [0, 0.08 + i * 0.1, 0]))
  g.add(tower)
  return g
}

function setupT03C(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDF2FB')
  frame3(camera)
  lightRig(scene, [0, 0.6, -0.5])
  /* left: the hyperscalers' general-purpose hall (cool blue tiles); right: a separate enterprise room, a corporate
     glass curtain wall and a soft carpet */
  const glassTex = glassWallTex()
  twoRooms(
    scene,
    { floor: '#E8EEF7', line: '#D3DCEA', wall: '#F0F4FB', band: '#C9DAFB' },
    { floor: mat('#E6E3EF', { roughness: 0.95 }), wall: new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.25, metalness: 0.1, emissive: new THREE.Color('#FFFFFF'), emissiveMap: glassTex, emissiveIntensity: 0.35 }) },
  )
  /* a slow light sweep across the glass (a soft band drifting left to right, 6.5 s, never blinking) */
  const sheenTex = canvasTex(128, 32, (g) => {
    const gr = g.createLinearGradient(0, 0, 128, 0)
    gr.addColorStop(0, 'rgba(255,255,255,0)')
    gr.addColorStop(0.5, 'rgba(255,255,255,0.55)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 32)
  })
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2), new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, depthWrite: false, toneMapped: false }))
  sheen.rotation.z = -0.25
  scene.add(sheen)
  const leds: THREE.MeshStandardMaterial[] = []

  /* THE HYPERSCALERS where the general physician's room was: three racks (AWS, Azure, Google Cloud) taking a stream of
     different workloads (web, mobile, data) one per cycle, as the patients came */
  const hyperGlow = [0, 1, 2].map(() => glowMat('#5B8CFF', '#2A3558', { roughness: 0.5, metalness: 0.2 }))
  const hx = [-0.86, -0.38, 0.1]
  const marks = [awsUrl, azureUrl, gcpUrl]
  hx.forEach((x, i) => rack(scene, [x, 0, -1.0], { w: 0.42, h: 1.75, url: marks[i], redraw, leds, glow: hyperGlow[i] }))
  const wl = [workload('web', 0.42), workload('mobile', 0.42), workload('data', 0.42)]
  for (const w of wl) scene.add(w.g)

  /* THE ENTERPRISE SPECIALISTS where the cardiology room was: the IBM Cloud rack with a bank (its mainframe workload)
     beside it, the Oracle rack with an Oracle database and an ERP office tower beside it. Steady LEDs, no blinking. */
  const steady: THREE.MeshStandardMaterial[] = []
  const SPEC = [1.04, 1.99]
  SPEC.forEach((x, i) => {
    rack(scene, [x, 0, -1.0], { w: 0.42, h: 1.75, url: i === 0 ? ibmUrl : oracleUrl, pad: i === 0 ? 0.04 : 0.05, redraw, leds: steady, glow: mat('#33406B', { roughness: 0.5, metalness: 0.2 }) })
  })
  steady.forEach((m) => (m.emissiveIntensity = 0.75))
  const bank = bankModel()
  bank.g.position.set(1.48, 0, -0.55)
  bank.g.rotation.y = -0.15
  scene.add(bank.g)
  const db = dbModel()
  db.position.set(2.42, 0, -0.55)
  db.rotation.y = -0.2
  scene.add(db)
  /* a floor conduit from each workload into the foot of its own rack, a slow steady stream of data along it */
  const conduit = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple) => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const len = va.distanceTo(vb)
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, len), mat('#C9D3E6', { roughness: 0.5 }))
    strip.position.copy(va.clone().add(vb).multiplyScalar(0.5))
    strip.lookAt(vb.x, strip.position.y, vb.z)
    strip.receiveShadow = true
    scene.add(strip)
    const dots = [0, 1, 2].map(() => {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.045), new THREE.MeshStandardMaterial({ color: '#7FA6FF', emissive: new THREE.Color('#7FA6FF'), emissiveIntensity: 0.8 }))
      scene.add(d)
      return d
    })
    return (t: number) => dots.forEach((d, i) => d.position.copy(va.clone().lerp(vb, mod(t / 2.6 + i / 3, 1))).setY(0.02))
  }
  const c1 = conduit([1.36, 0.006, -0.42], [1.18, 0.006, -0.74])
  const c2 = conduit([2.27, 0.006, -0.42], [2.13, 0.006, -0.74])

  return (t) => {
    const c = mod(t, L3)
    const n = Math.floor(c / CY) % 3
    const k = c - n * CY
    leds.forEach((m, i) => (m.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * (2.2 + (i % 5) * 0.7) + i))))
    wl.forEach((w, i) => {
      const on = i === n
      w.g.visible = on
      if (!on) return
      /* glides in, hovers while served, glides out (a soft float) */
      w.g.position.set(walkX(k), 0.04 + Math.sin(k * 3) * 0.03, P3.spot[2])
      w.m.emissiveIntensity = win(k, CYC.exA, CYC.exB, 0.2) * 0.5
    })
    const served = win(k, CYC.exA, CYC.exB, 0.25)
    hyperGlow.forEach((m, i) => (m.emissiveIntensity = served * (0.35 + 0.2 * Math.sin(k * 6 + i * 1.3))))
    /* the enterprise side: slow and steady (L3 = three 2.6 s cycles, so every motion here closes on the loop) */
    const u = mod(c, L3) / L3
    sheen.position.set(lerp(P3.wallX + 0.45, 2.9, u), 1.6, P3.backZ + 0.02)
    ;(sheen.material as THREE.MeshBasicMaterial).opacity = Math.sin(u * Math.PI)
    bank.m.emissiveIntensity = 0.08 + 0.06 * Math.sin((c / L3) * Math.PI * 2)
    c1(c)
    c2(c + 1.3)
  }
}

/* ================================================================== S15 · three kiosks, one recharge (TR 7) */

const L7 = 7.2
const HOLD7 = 6.35
const KX = [-1.9, 0, 1.9]
const KZ = -1.0
const WALKZ = -0.12
/* the attendant (or the rack) stands left of the kiosk's centre, its customer right of it: one body-width between
   them, and nobody walks, so no two people ever overlap from the camera */
const STAFF_DX = -0.36
const STOP_DX = 0.36
const SX = KX.map((x) => x + STOP_DX)
/* the three hand-overs, one kiosk after the other; all three devices then show full together (6.0-6.75 s) and run
   down (DRAIN) just before the loop restarts */
const V = [
  [0, 2.0],
  [2.0, 4.0],
  [4.0, 6.0],
] as const
const DRAIN = [6.75, 7.15]
/* inside a hand-over (2 s): the card handed across, its flight into the device, the bars filling, a happy beat */
const VT = { hand: [0.1, 0.45], fly: [0.45, 1.05], fill: [1.0, 1.65], happy: [1.1, 2.0] }
/** kiosk i's state at loop time c: its local time in its own hand-over (or -1 before it), its bars' fill */
const kioskAt = (i: number, c: number) => {
  const k = c - V[i][0]
  const fill = c < V[i][0] ? 0 : seg(k, VT.fill[0], VT.fill[1]) * (1 - seg(c, DRAIN[0], DRAIN[1]))
  return { k: c < V[i][0] || c > V[i][1] ? -1 : k, fill, done: c >= V[i][0] + VT.fill[1] && c < DRAIN[0] }
}
/* framed on the three kiosks (x -2.6 to 2.6) and their roof signs, floor to sign top */
function frame7(camera: THREE.PerspectiveCamera) {
  camera.fov = 33
  camera.position.set(0, 1.72, 7.6)
  camera.lookAt(0, 1.56, -0.7)
}

/** the street: pavement, a kerb, a building front with tall windows */
function street(scene: THREE.Scene, concept: boolean) {
  room(scene, mat('#ffffff', { map: tileTex(concept ? '#DDE4F0' : '#E7E3DC', concept ? '#CCD5E5' : '#D6D0C6', 3, [12, 8]), roughness: 0.85 }), mat(concept ? '#EEF2FA' : '#F4EFE8', { roughness: 0.95 }), -1.75)
  /* the building's plinth along the back of the pavement */
  scene.add(box(14, 0.42, 0.04, mat(concept ? '#DCE4F2' : '#E6DED2', { roughness: 0.9 }), [0, 0.21, -1.72]))
}

/** a kiosk: back cabin, counter, side posts, striped canopy, the plan board above the counter */
function kiosk(scene: THREE.Scene, x: number, color: string, board: THREE.Object3D, boardGlow: THREE.MeshStandardMaterial) {
  const g = new THREE.Group()
  g.position.set(x, 0, KZ)
  const body = mat('#FFFFFF', { roughness: 0.5 })
  const col = mat(color, { roughness: 0.5 })
  /* the cabin's back wall, softly lit from inside so the attendant reads */
  g.add(box(1.5, 2.2, 0.06, mat('#FFFFFF', { roughness: 0.6, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.35 }), [0, 1.1, -0.45]))
  g.add(box(0.06, 2.2, 0.9, col, [-0.72, 1.1, 0]))
  g.add(box(0.06, 2.2, 0.9, col, [0.72, 1.1, 0]))
  g.add(box(1.5, 1.0, 0.12, col, [0, 0.5, 0.42], 0.03))
  g.add(box(1.56, 0.06, 0.3, mat('#FFFFFF', { roughness: 0.4 }), [0, 1.02, 0.38], 0.02))
  /* canopy: alternating stripes, sloped toward the street */
  const can = new THREE.Group()
  can.position.set(0, 2.3, 0.18)
  can.rotation.x = 0.32
  for (let i = 0; i < 6; i++) can.add(box(0.27, 0.05, 0.9, i % 2 ? body : col, [-0.675 + i * 0.27, 0, 0]))
  g.add(can)
  g.add(box(1.5, 0.22, 0.06, col, [0, 2.3, -0.42]))
  /* the plan board stands on the roof as the kiosk's sign, on two short posts, clear of the attendant */
  board.position.set(0, 2.86, 0.02)
  g.add(board)
  for (const dx of [-0.42, 0.42]) g.add(box(0.05, 0.3, 0.05, mat('#AFC0DE'), [dx, 2.5, 0.0]))
  void boardGlow
  scene.add(g)
  return g
}
/** an everyday plan board: the kiosk's colour with its own abstract plan graphic (no text, no digits) */
function planBoard(color: string, motif: 0 | 1 | 2): { o: THREE.Mesh; glow: THREE.MeshStandardMaterial } {
  const tex = canvasTex(160, 100, (g) => {
    g.fillStyle = color
    g.fillRect(0, 0, 160, 100)
    g.fillStyle = 'rgba(255,255,255,0.92)'
    if (motif === 0) {
      g.beginPath()
      g.arc(40, 50, 26, 0, Math.PI * 2)
      g.fill()
      for (let i = 0; i < 3; i++) g.fillRect(80, 28 + i * 18, 60 - i * 12, 9)
    } else if (motif === 1) {
      g.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        const r = i % 2 ? 12 : 28
        g.lineTo(40 + Math.cos(a) * r, 50 + Math.sin(a) * r)
      }
      g.closePath()
      g.fill()
      for (let i = 0; i < 2; i++) g.fillRect(80, 36 + i * 22, 58 - i * 18, 11)
    } else {
      g.beginPath()
      g.moveTo(40, 22)
      g.lineTo(66, 76)
      g.lineTo(14, 76)
      g.closePath()
      g.fill()
      for (let i = 0; i < 4; i++) {
        g.beginPath()
        g.arc(86 + i * 16, 50, 6, 0, Math.PI * 2)
        g.fill()
      }
    }
  })
  const glow = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0, emissiveMap: tex })
  const edge = mat('#FFFFFF')
  const o = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.62, 0.04), [edge, edge, edge, edge, glow, glow])
  o.castShadow = true
  return { o, glow }
}
/** the recharge card: the same white card with a data glyph and a call glyph, at every kiosk */
const cardTex = () =>
  canvasTex(128, 80, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 128, 80)
    g.fillStyle = C.brand
    g.fillRect(0, 0, 128, 14)
    g.strokeStyle = C.brand
    g.lineWidth = 6
    g.lineCap = 'round'
    g.lineJoin = 'round'
    /* data: an up and a down arrow */
    g.beginPath()
    g.moveTo(26, 64)
    g.lineTo(26, 30)
    g.moveTo(16, 40)
    g.lineTo(26, 28)
    g.lineTo(36, 40)
    g.moveTo(46, 28)
    g.lineTo(46, 62)
    g.moveTo(36, 52)
    g.lineTo(46, 64)
    g.lineTo(56, 52)
    g.stroke()
    /* calls: a handset */
    g.fillStyle = C.green
    g.beginPath()
    g.moveTo(78, 30)
    g.quadraticCurveTo(72, 34, 76, 46)
    g.quadraticCurveTo(84, 62, 100, 66)
    g.quadraticCurveTo(110, 66, 110, 58)
    g.lineTo(100, 52)
    g.lineTo(94, 56)
    g.quadraticCurveTo(86, 50, 84, 42)
    g.lineTo(88, 36)
    g.lineTo(84, 28)
    g.closePath()
    g.fill()
  })
/** a device screen: a data icon row with five bars filling (0..1), the call glyph lit when full */
function screenPainter(w: number, h: number, kind: 'phone' | 'laptop') {
  const lt = liveTex(w, h)
  let last = -1
  return {
    tex: lt.tex,
    paint(fill: number, flash: number) {
      const q = Math.round(fill * 60) + Math.round(flash * 10) * 100
      if (q === last) return
      last = q
      lt.paint((g) => {
        g.fillStyle = '#0E1A33'
        g.fillRect(0, 0, w, h)
        g.fillStyle = `rgba(91,140,255,${0.18 + flash * 0.5})`
        g.fillRect(0, 0, w, h)
        const n = 5
        const bw = (w * 0.62) / n
        const gap = bw * 0.35
        const x0 = (w - (n * bw + (n - 1) * gap * 0.5)) / 2
        const base = kind === 'phone' ? h * 0.72 : h * 0.8
        const top = kind === 'phone' ? h * 0.3 : h * 0.34
        for (let i = 0; i < n; i++) {
          const full = (base - top) * ((i + 1) / n)
          const x = x0 + i * (bw + gap * 0.5)
          g.fillStyle = 'rgba(255,255,255,0.14)'
          g.fillRect(x, base - full, bw * 0.8, full)
          const k = clamp01(fill * n - i)
          g.fillStyle = fill > 0.98 ? '#4BE38A' : '#7FA6FF'
          g.fillRect(x, base - full * k, bw * 0.8, full * k)
        }
        if (kind === 'laptop') {
          /* the VM glyph: a server block with two slots */
          g.strokeStyle = fill > 0.98 ? '#4BE38A' : 'rgba(255,255,255,0.5)'
          g.lineWidth = 3
          g.strokeRect(w * 0.08, h * 0.12, w * 0.16, h * 0.16)
          g.beginPath()
          g.moveTo(w * 0.11, h * 0.17)
          g.lineTo(w * 0.21, h * 0.17)
          g.moveTo(w * 0.11, h * 0.23)
          g.lineTo(w * 0.21, h * 0.23)
          g.stroke()
        } else {
          g.fillStyle = fill > 0.98 ? '#4BE38A' : 'rgba(255,255,255,0.4)'
          g.beginPath()
          g.arc(w / 2, h * 0.86, w * 0.08, 0, Math.PI * 2)
          g.fill()
        }
      })
    },
  }
}
/** the VM block: the identical small server every provider hands out */
function vmBlock(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.36, 0.24, 0.24, mat(C.brand, { roughness: 0.35 }), [0, 0, 0], 0.04))
  for (const y of [0.05, -0.05]) {
    g.add(box(0.26, 0.04, 0.01, mat('#FFFFFF', { roughness: 0.4 }), [-0.02, y, 0.125]))
    g.add(box(0.03, 0.03, 0.01, new THREE.MeshStandardMaterial({ color: '#4BE38A', emissive: new THREE.Color('#4BE38A'), emissiveIntensity: 1 }), [0.14, y, 0.126]))
  }
  return g
}

const KCOL = [C.teal, C.coral, C.purple]

function setupT07E(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#F4F7FC')
  frame7(camera)
  lightRig(scene, [0, 0.6, -0.5])
  street(scene, false)
  const boards = [planBoard(KCOL[0], 0), planBoard(KCOL[1], 1), planBoard(KCOL[2], 2)]
  KX.forEach((x, i) => kiosk(scene, x, KCOL[i], boards[i].o, boards[i].glow))

  /* the attendants, each their own look, in a lanyard of their kiosk's colour */
  const aCfg = [
    who(CAST_PRESETS.ananya, { hair: { style: 'bob' }, outfit: { top: 'polo', topColor: '#E7F8F5', bottom: 'trousers', bottomColor: '#2E3A55' } }),
    who(CAST_PRESETS.arjun, { hair: { style: 'curly', color: 'black' }, outfit: { top: 'polo', topColor: '#FFF1EC', bottomColor: '#2E3A55' }, accessories: { beard: 'short' } }),
    who(CAST_PRESETS.rohan, { outfit: { top: 'polo', topColor: '#F1ECFF', bottom: 'trousers', bottomColor: '#2E3A55' }, accessories: { glasses: 'round' } }),
  ]
  const attend = aCfg.map((cfg, i) =>
    rigSprite({
      config: cfg,
      dress: (k) => ({ ...k, top: <>{k.top}{LANYARD(KCOL[i])}</> }),
      loop: L7,
      frames: 44,
      height: i === 0 ? 1.6 : 1.72,
      px: 300,
      onReady: redraw,
      timeline: (c) => {
        const { k } = kioskAt(i, c)
        return { seed: 70 + i, idle: CAST_IDLE, ...(k < 0 ? faceAt(0, [[0, 'neutral']], 1) : faceAt(k, [[0, 'happy'], [VT.happy[1] - 0.1, 'neutral']], 2)) }
      },
      pose: (p, c) => {
        /* faces their own customer (screen-right) and hands the card across the counter at their turn */
        to(p, 'headTurn', 0.3, 1)
        to(p, 'lookX', 0.55, 1)
        const { k } = kioskAt(i, c)
        if (k >= 0) {
          const hand = win(k, VT.hand[0], VT.fly[0] + 0.15, 0.2)
          to(p, 'shoulderR', 46, hand)
          to(p, 'elbowR', 34, hand)
          to(p, 'lookY', 0.25, hand)
        }
      },
    }),
  )
  attend.forEach((a, i) => {
    a.object.position.set(KX[i] + STAFF_DX, 0, KZ - 0.15)
    scene.add(a.object)
  })

  /* the three customers, each their own look, each with a phone held up in the screen-right hand */
  const cCfg = [
    who(CAST_PRESETS.meera, { hair: { style: 'long', color: 'black' }, outfit: { top: 'kurta', topColor: '#F6C531', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#5A3A2A' }, accessories: { earrings: true, bindi: true } }),
    who(CAST_PRESETS.dev, { hair: { style: 'short', color: 'darkBrown' }, outfit: { top: 'tshirt', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2E3A55' }, accessories: { glasses: 'rect', watch: true } }),
    who(CAST_PRESETS.riya, { hair: { style: 'ponytail', color: 'brown' }, outfit: { top: 'blouse', topColor: '#E8F0FF', bottom: 'jeans', bottomColor: '#1F4FD8', shoeColor: '#FFFFFF' }, accessories: { earrings: true } }),
  ]
  const cust = cCfg.map((cfg, i) =>
    rigSprite({
      config: cfg,
      loop: L7,
      frames: 44,
      height: i === 1 ? 1.72 : 1.6,
      px: 300,
      onReady: redraw,
      timeline: (c) => {
        const { k, done } = kioskAt(i, c)
        const face = k >= 0 ? faceAt(k, [[0, 'listening'], [VT.happy[0], 'happy']], 2) : done ? faceAt(0, [[0, 'happy']], 1) : faceAt(0, [[0, 'neutral']], 1)
        return { seed: 74 + i, idle: CAST_IDLE, ...face }
      },
      pose: (p, c) => {
        /* the phone held up in front; looks to the attendant at the hand-over, at the phone as it fills */
        to(p, 'shoulderR', 18, 1)
        to(p, 'elbowR', 112, 1)
        const { k } = kioskAt(i, c)
        const toStaff = k >= 0 ? win(k, 0, VT.fly[0], 0.15) : 0
        to(p, 'headTurn', -0.35, toStaff)
        to(p, 'lookX', -0.7, toStaff)
        const atPhone = k >= 0 ? win(k, VT.fly[1] - 0.1, VT.fill[1], 0.15) : 0
        to(p, 'lookY', 0.55, atPhone)
        to(p, 'headNod', 0.14, atPhone)
      },
    }),
  )
  cust.forEach((cu, i) => {
    cu.object.position.set(SX[i], 0, WALKZ)
    scene.add(cu.object)
  })
  /* the phones (real handsets, slightly enlarged so their bars read): identical, filling the same way */
  const phones = SX.map((x) => {
    const phone = new THREE.Group()
    phone.add(box(0.2, 0.36, 0.03, mat('#1B2140', { roughness: 0.3 }), [0, 0, 0], 0.025))
    const ps = screenPainter(64, 116, 'phone')
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.31), new THREE.MeshBasicMaterial({ map: ps.tex, toneMapped: false }))
    scr.position.z = 0.017
    phone.add(scr)
    phone.position.set(x + 0.12, 1.08, WALKZ + 0.16)
    phone.rotation.set(-0.12, 0.08, 0)
    scene.add(phone)
    return ps
  })
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.19, 0.012), [mat('#EEF2FA'), mat('#EEF2FA'), mat('#EEF2FA'), mat('#EEF2FA'), new THREE.MeshStandardMaterial({ map: cardTex(), roughness: 0.5 }), mat('#FFFFFF')])
  card.castShadow = true
  scene.add(card)

  return (t) => {
    const c = mod(t, L7)
    card.visible = false
    for (let i = 0; i < 3; i++) {
      const { k, fill } = kioskAt(i, c)
      const flash = k >= 0 ? win(k, VT.fly[1] - 0.1, VT.fill[1], 0.15) : 0
      phones[i].paint(fill, flash)
      boards[i].glow.emissiveIntensity = k >= 0 ? 0.25 * win(k, 0, 2.0, 0.3) : 0
      if (k >= 0 && k > VT.hand[0] && k < VT.fly[1] + 0.05) {
        const fly = seg(k, VT.fly[0], VT.fly[1])
        const from: THREE.Vector3Tuple = [KX[i] + STAFF_DX + 0.24, 1.2, KZ + 0.4]
        const to3: THREE.Vector3Tuple = [SX[i] + 0.12, 1.13, WALKZ + 0.2]
        card.visible = true
        card.position.set(...arc(from, to3, fly, 0.3))
        card.rotation.set(-0.2 * (1 - fly), 0.3 * (1 - fly), 0.15 * Math.sin(fly * Math.PI))
        card.scale.setScalar(lerp(1, 0.35, seg(k, VT.fly[1] - 0.25, VT.fly[1])))
      }
    }
    attend.forEach((a) => a.update(c, camera))
    cust.forEach((cu) => cu.update(c, camera))
  }
}

function setupT07C(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDF2FB')
  frame7(camera)
  lightRig(scene, [0, 0.6, -0.5])
  street(scene, true)
  /* the provider kiosks: canopy in each provider's colour, the plan board is the provider's mark on a white tile */
  const PCOL = ['#FF9900', '#0078D4', '#34A853']
  const urls = [awsUrl, azureUrl, gcpUrl]
  KX.forEach((x, i) => {
    const tile = markTile(urls[i], 1.2, 0.62, redraw, 0.14)
    kiosk(scene, x, PCOL[i], tile, new THREE.MeshStandardMaterial())
  })
  /* THE SERVER RACKS where the attendants stood */
  const leds: THREE.MeshStandardMaterial[] = []
  const rackGlow = KX.map(() => glowMat('#5B8CFF', '#2A3558', { roughness: 0.5, metalness: 0.2 }))
  KX.forEach((x, i) => rack(scene, [x + STAFF_DX, 0, KZ - 0.15], { w: 0.5, h: 1.78, redraw, leds, glow: rackGlow[i] }))

  /* THE USERS where the customers stood, each with an open laptop held in front */
  const uCfg = [
    who(CAST_PRESETS.kabir, { outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#2C3C81' } }),
    who(CAST_PRESETS.ananya, { hair: { style: 'braid' }, outfit: { top: 'kurta', topColor: '#FC963C', bottom: 'trousers', bottomColor: '#3E3D45' }, accessories: { earrings: true } }),
    who(CAST_PRESETS.rohan, { hair: { style: 'buzz' }, outfit: { top: 'shirt', topColor: '#95C2FB', bottom: 'trousers', bottomColor: '#1F2A4A' }, accessories: { beard: 'stubble', watch: true } }),
  ]
  const users = uCfg.map((cfg, i) =>
    rigSprite({
      config: cfg,
      loop: L7,
      frames: 44,
      height: i === 1 ? 1.6 : 1.72,
      px: 300,
      onReady: redraw,
      timeline: (c) => {
        const { k, done } = kioskAt(i, c)
        const face = k >= 0 ? faceAt(k, [[0, 'listening'], [VT.happy[0], 'happy']], 2) : done ? faceAt(0, [[0, 'happy']], 1) : faceAt(0, [[0, 'neutral']], 1)
        return { seed: 80 + i, idle: CAST_IDLE, ...face }
      },
      pose: (p, c) => {
        to(p, 'shoulderL', 16, 1)
        to(p, 'elbowL', 96, 1)
        to(p, 'shoulderR', 16, 1)
        to(p, 'elbowR', 96, 1)
        const { k } = kioskAt(i, c)
        const toRack = k >= 0 ? win(k, 0, VT.fly[0], 0.15) : 0
        to(p, 'headTurn', -0.35, toRack)
        to(p, 'lookX', -0.7, toRack)
        const atLap = k >= 0 ? win(k, VT.fly[1] - 0.1, VT.fill[1], 0.15) : 0
        to(p, 'lookY', 0.55, atLap)
        to(p, 'headNod', 0.12, atLap)
      },
    }),
  )
  users.forEach((u, i) => {
    u.object.position.set(SX[i], 0, WALKZ)
    scene.add(u.object)
  })
  const laps = SX.map((x) => {
    const laptop = new THREE.Group()
    laptop.add(box(0.5, 0.025, 0.32, mat('#C9D3E6', { roughness: 0.35, metalness: 0.3 }), [0, 0, 0], 0.01))
    const lid = new THREE.Group()
    lid.position.set(0, 0.012, -0.15)
    lid.rotation.x = -0.28
    lid.add(box(0.5, 0.33, 0.02, mat('#C9D3E6', { roughness: 0.35, metalness: 0.3 }), [0, 0.165, 0], 0.01))
    const ls = screenPainter(150, 96, 'laptop')
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.29), new THREE.MeshBasicMaterial({ map: ls.tex, toneMapped: false }))
    scr.position.set(0, 0.165, 0.011)
    lid.add(scr)
    laptop.add(lid)
    laptop.position.set(x, 0.96, WALKZ + 0.26)
    laptop.rotation.set(0.12, 0, 0)
    scene.add(laptop)
    return ls
  })
  const vm = vmBlock()
  scene.add(vm)

  return (t) => {
    const c = mod(t, L7)
    leds.forEach((m, i) => (m.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * (2.2 + (i % 5) * 0.7) + i))))
    vm.visible = false
    for (let i = 0; i < 3; i++) {
      const { k, fill } = kioskAt(i, c)
      const flash = k >= 0 ? win(k, VT.fly[1] - 0.1, VT.fill[1], 0.15) : 0
      laps[i].paint(fill, flash)
      rackGlow[i].emissiveIntensity = k >= 0 ? 0.45 * win(k, 0, VT.fly[1], 0.25) : 0
      if (k >= 0 && k > VT.hand[0] && k < VT.fly[1] + 0.05) {
        /* the VM slides out of the rack over the counter and into the laptop */
        const fly = seg(k, VT.fly[0], VT.fly[1])
        const out = seg(k, VT.hand[0], VT.fly[0])
        const from: THREE.Vector3Tuple = [KX[i] + STAFF_DX + 0.1, 1.22, KZ + 0.36]
        const lap: THREE.Vector3Tuple = [SX[i], 0.96, WALKZ + 0.26]
        vm.visible = true
        vm.position.set(...(k < VT.fly[0] ? lerp3([KX[i] + STAFF_DX, 1.22, KZ + 0.05], from, out) : arc(from, [lap[0], lap[1] + 0.22, lap[2] - 0.1], fly, 0.35)))
        vm.rotation.set(0, 0.6 * Math.sin(fly * Math.PI), 0)
        vm.scale.setScalar(lerp(1, 0.3, seg(k, VT.fly[1] - 0.25, VT.fly[1])))
      }
    }
    users.forEach((u) => u.update(c, camera))
  }
}

/* ------------------------------------------------------------------ stage + exports */

type Fig = { step?: number }
const Stage = ({ step, setup, holdT }: { step: number; setup: (k: StageKit) => Update; holdT: number }): ReactNode => (
  <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
    <ThreeStage w={W} h={H} step={step} setup={setup} holdT={holdT} />
  </div>
)

const T03Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT03E} holdT={HOLD3} />
const T03Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT03C} holdT={HOLD3} />
const T07Everyday = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT07E} holdT={HOLD7} />
const T07Concept = ({ step = 0 }: Fig) => <Stage step={step} setup={setupT07C} holdT={HOLD7} />

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  H_T03Everyday: T03Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T03Concept: T03Concept as (p: Record<string, unknown>) => ReactNode,
  H_T07Everyday: T07Everyday as (p: Record<string, unknown>) => ReactNode,
  H_T07Concept: T07Concept as (p: Record<string, unknown>) => ReactNode,
}
export const css = ''
