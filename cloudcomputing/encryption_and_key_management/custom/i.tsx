import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { castSprite, ThreeStage, mat, mesh, CAST_IDLE, CAST_PRESETS, castClip, type CharacterConfig, type Pose, type StageKit, type Timeline, type Update } from '@/engine/three-stage'
import { buildSkin } from '@/decks/figures/cast/skins/config'
import type { Skin } from '@/decks/figures/cast/skins/types'
import { colors } from '@/design/tokens'
import elbUrl from '../images/aws-elastic-load-balancing.svg'
import serverUrl from '../images/res-server.svg'
import kmsUrl from '../images/aws-kms.svg'

/**
 * BUILDER I · SESSION 15 (Encryption & Key Management) ANALOGIES, real-time 3D on the engine's `@/engine/three-stage`,
 * to the Sessions 14 / 16 standard: a perspective camera and a real place; people are Character Lab characters from the
 * engine's `castSprite` (role clothing by `dress`, frames at the size they are drawn by `adaptive`), each an individual
 * with expressions keyed to the action; NO TEXT on either card; one wall-clock loop per slide shared by both cards beat
 * for beat and place for place, each loop ending in the state it starts in; held frames (`?still`, thumbnails) draw the
 * telling moment at HOLD. Nobody walks toward or away from the camera: people step sideways.
 *
 * SLIDE 20 · T10-AN (TR 10): "A security guard at an office gate opens a sealed parcel, checks it, then seals it in a
 * fresh envelope before sending it inside: just as re-encryption decrypts traffic at the load balancer and encrypts it
 * again before the backend."
 *
 *   place (x)      everyday: an office gate                         concept: a re-encrypting load balancer
 *   -1.0           the courier, on the street side                   the client (a laptop)
 *   -0.62 .. 0.62  the guard's check counter, the gatehouse          the load balancer block (Elastic Load Balancing)
 *   -0.2           the sealed parcel (gold seal) on the counter      the packet under its gold padlock
 *    0.12          the guard's scanner light on the item             the check arch's light on the packet
 *    0.42          the stand of fresh envelopes                      the dock of new padlocks (blue)
 *    1.05          a staff member inside the gate                    the backend server
 *
 *   0.15 - 1.15    the courier hands the parcel over                 the packet rides from the client to the block
 *   1.2 - 1.8      the seal is peeled, the flaps open                the gold padlock opens and drops away
 *   1.85 - 3.1     the item is lifted and checked: the light green   the packet is scanned: the light green
 *   3.1 - 4.1      into a fresh envelope, the flap folds, blue seal  a new blue padlock closes on it
 *   4.4 - 5.35     the envelope is passed to the staff member        the packet rides on to the backend
 *   5.45 - 7.8     she takes it inside and comes back               the server works on it
 *   6.8 - 8.0      the next courier arrives with a sealed parcel     the next packet leaves the client
 *
 * SLIDE 36 · T21-AN (TR 21): "A bank keeps every locker's key inside its own guarded room, letting a customer use it
 * without ever walking out with the actual key: just as KMS uses a key internally without ever releasing the raw key
 * material to the application."
 *
 *   place (x)      everyday: a bank's locker room                   concept: the application and KMS
 *   -1.45          the customer                                     the application (a laptop)
 *   -0.84          her locker, in the locker wall                   her data block, on its dock
 *    0.62 .. 2.6   the guarded key room: bars, a sliding barred     the KMS vault (KMS mark), a round window onto
 *                  door, the key cabinet                            the key inside
 *    1.17          her locker's key on its hook                     the key on its cradle (it never moves out)
 *    1.72          the bank officer, by the key room                (the vault does the work itself)
 *
 *   0.0 - 0.8      she asks for her locker                          the application asks for its data
 *   0.6 - 3.45     the officer takes the key out of the guarded     the locked block rides into the vault, the key
 *                  room and unlocks her locker                      unlocks it there, it rides back unlocked
 *   3.8 - 5.0      she uses her locker (the key never in her hand)  the application uses the data (no key with it)
 *   5.0 - 5.75     the locker is shut and locked again              the block rides in and is locked again inside
 *   5.75 - 8.1     the key goes back into the guarded room           the locked block rides back; the key stays in
 */

const W = 470
const H = 390
/* dev only: `?it=<seconds>` (with `?still`) holds a chosen loop time, to check every phase from a screenshot */
const devHold = (d: number) => {
  if (typeof window === 'undefined') return d
  const v = Number(new URLSearchParams(window.location.search).get('it'))
  return Number.isFinite(v) && v > 0 ? v : d
}

type V3 = [number, number, number]
const C = {
  brand: colors.brand,
  brandDark: colors.brandDark,
  navy: colors.nwNavy,
  orange: colors.accent,
  green: colors.success,
  teal: colors.teal,
  white: colors.white,
  gold: '#F2C14E',
  goldDark: '#C8962A',
  steel: '#C9D1DE',
}

/* ------------------------------------------------------------------ small maths */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sm = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a))
/** 1 between b and c, easing up from a and down to d */
const hold = (t: number, a: number, b: number, c: number, d: number) => seg(t, a, b) * (1 - seg(t, c, d))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const mod = (t: number, l: number) => ((t % l) + l) % l
const TAU = Math.PI * 2
const DEG = Math.PI / 180
const v3 = (p: V3) => new THREE.Vector3(...p)

/* ------------------------------------------------------------------ textures (TEX_SS x logical size, 4K-sharp) */

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
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) => {
  g.fillStyle = fill
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
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
/** an official mark (svg url) rasterised on a white rounded tile (rule 54) */
function markTex(url: string, redraw: () => void, px = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const img = new Image()
  img.onload = () => {
    const g = c.getContext('2d')!
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(0, 0, px, px, px * 0.16)
    g.fill()
    const pad = px * 0.14
    g.drawImage(img, pad, pad, px - 2 * pad, px - 2 * pad)
    t.needsUpdate = true
    redraw()
  }
  img.src = url
  return t
}
/** a soft skyline far behind the street */
function skylineTex() {
  return canvasTex(400, 140, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 140)
    sky.addColorStop(0, '#CFE3FA')
    sky.addColorStop(1, '#E8F2FD')
    g.fillStyle = sky
    g.fillRect(0, 0, 400, 140)
    g.fillStyle = '#BFD0E6'
    const blocks = [[0, 70, 38], [36, 44, 30], [64, 80, 40], [100, 56, 26], [124, 32, 34], [156, 68, 44], [198, 50, 30], [226, 76, 40], [264, 40, 34], [296, 62, 30], [324, 48, 42], [364, 72, 36]]
    for (const [x, y, w] of blocks) g.fillRect(x, y, w, 140 - y)
    g.fillStyle = '#D6E2F2'
    for (const [x, y, w] of blocks) for (let yy = y + 8; yy < 130; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 9) g.fillRect(xx, yy, 4, 5)
  })
}
/** the office building's front: two storeys of windows over a glass entrance (no words) */
function officeFrontTex() {
  return canvasTex(260, 320, (g) => {
    g.fillStyle = '#EEF2F8'
    g.fillRect(0, 0, 260, 320)
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) {
        const x = 14 + i * 62
        const y = 16 + r * 74
        rr(g, x - 3, y - 3, 52, 58, 4, '#5E6B86')
        const sky = g.createLinearGradient(0, y, 0, y + 52)
        sky.addColorStop(0, '#9CC9F5')
        sky.addColorStop(1, '#E3F1FF')
        g.fillStyle = sky
        g.fillRect(x, y, 46, 52)
        g.fillStyle = 'rgba(255,255,255,0.5)'
        g.beginPath()
        g.moveTo(x + 6, y + 52)
        g.lineTo(x + 22, y)
        g.lineTo(x + 30, y)
        g.lineTo(x + 14, y + 52)
        g.fill()
      }
    /* the canopy band and the glass entrance */
    rr(g, 0, 170, 260, 14, 0, '#1F2E63')
    rr(g, 30, 192, 200, 128, 4, '#5E6B86')
    const gl = g.createLinearGradient(0, 196, 0, 320)
    gl.addColorStop(0, '#A9D3FF')
    gl.addColorStop(1, '#DCEBFF')
    g.fillStyle = gl
    g.fillRect(34, 196, 192, 124)
    g.fillStyle = '#5E6B86'
    g.fillRect(128, 196, 4, 124)
    g.fillRect(80, 196, 3, 124)
    g.fillRect(177, 196, 3, 124)
    rr(g, 118, 250, 4, 26, 2, '#D7DEE9')
    rr(g, 138, 250, 4, 26, 2, '#D7DEE9')
  })
}
/** the company emblem: a white rounded square with a blue building mark (no words) */
function emblemTex() {
  return canvasTex(80, 80, (g) => {
    rr(g, 2, 2, 76, 76, 16, '#FFFFFF')
    g.fillStyle = C.brand
    g.beginPath()
    g.moveTo(40, 13)
    g.lineTo(66, 28)
    g.lineTo(14, 28)
    g.closePath()
    g.fill()
    for (const x of [19, 31, 43, 55]) rr(g, x, 32, 6, 24, 1.5, C.brand)
    rr(g, 14, 58, 52, 8, 2, C.brand)
  })
}
/** a road seen beyond the kerb: asphalt with a dashed centre line */
function roadTex() {
  return canvasTex(
    256,
    128,
    (g) => {
      g.fillStyle = '#6B7280'
      g.fillRect(0, 0, 256, 128)
      g.fillStyle = '#F3F4F6'
      for (let x = 8; x < 256; x += 64) g.fillRect(x, 60, 34, 7)
    },
    [3, 1],
  )
}
/** a document: a white sheet with lines and a blue header block (no words) */
function docTex() {
  return canvasTex(100, 128, (g) => {
    rr(g, 1, 1, 98, 126, 6, '#FFFFFF')
    rr(g, 10, 12, 34, 10, 3, C.brand)
    for (let i = 0; i < 6; i++) rr(g, 10, 34 + i * 13, i % 3 === 2 ? 50 : 78, 5, 2.5, '#C3CCDD')
    rr(g, 62, 102, 28, 14, 3, '#DCE6F7')
  })
}
/** an envelope's front: a soft blue paper with an address block (bars only) */
function envelopeTex() {
  return canvasTex(150, 104, (g) => {
    rr(g, 0, 0, 150, 104, 6, '#EAF1FD')
    g.strokeStyle = '#C9D7F0'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(4, 100)
    g.lineTo(75, 54)
    g.lineTo(146, 100)
    g.stroke()
    rr(g, 52, 60, 46, 5, 2.5, '#9FB3D6')
    rr(g, 52, 70, 34, 5, 2.5, '#BFCDE6')
  })
}
/** a data packet's face: rows of bits, blue on white (no words) */
function dataTex() {
  return canvasTex(96, 96, (g) => {
    rr(g, 0, 0, 96, 96, 14, '#FFFFFF')
    const rows = [
      [1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1],
      [1, 1, 0, 1, 0],
      [0, 1, 0, 1, 1],
    ]
    rows.forEach((row, j) =>
      row.forEach((b, i) => {
        if (b) rr(g, 14 + i * 14.5, 16 + j * 17, 10, 10, 3, C.brand)
        else {
          g.strokeStyle = C.brand
          g.lineWidth = 2.6
          g.beginPath()
          g.arc(19 + i * 14.5, 21 + j * 17, 4, 0, TAU)
          g.stroke()
        }
      }),
    )
  })
}
/** a laptop's screen: an app window with a header and three tiles (no words) */
function screenTex() {
  return canvasTex(160, 104, (g) => {
    rr(g, 0, 0, 160, 104, 4, '#0F1B3D')
    rr(g, 6, 6, 148, 92, 4, '#F4F7FD')
    rr(g, 6, 6, 148, 14, 4, C.brand)
    for (const x of [12, 20, 28]) {
      g.fillStyle = '#FFFFFF'
      g.beginPath()
      g.arc(x, 13, 2.4, 0, TAU)
      g.fill()
    }
    rr(g, 14, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 60, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 106, 28, 40, 30, 5, '#DCE6F7')
    rr(g, 22, 36, 24, 14, 3, C.brand)
    rr(g, 68, 36, 24, 14, 3, C.teal)
    rr(g, 114, 36, 24, 14, 3, '#7C9CF5')
    rr(g, 14, 66, 132, 6, 3, '#C3CCDD')
    rr(g, 14, 78, 96, 6, 3, '#DCE2EE')
  })
}
/** server sleds for a rack's front (vents, no words) */
function rackTex() {
  return canvasTex(120, 220, (g) => {
    rr(g, 0, 0, 120, 220, 8, '#26324F')
    for (let i = 0; i < 7; i++) {
      const y = 12 + i * 29
      rr(g, 8, y, 104, 23, 4, '#3A4A70')
      for (let k = 0; k < 7; k++) rr(g, 14 + k * 8, y + 7, 4, 10, 2, '#22304F')
      rr(g, 76, y + 8, 28, 7, 3, '#4D5F8A')
    }
  })
}

/* ------------------------------------------------------------------ modelling helpers */

const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], pos: V3, r = 0) => {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)
  const o = new THREE.Mesh(geo, m)
  o.position.set(...pos)
  o.castShadow = true
  o.receiveShadow = true
  return o
}
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, pos: V3, segs = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, segs), m, pos)
/** a white that reads white under the scene's light */
const WHITE_M = () => mat('#FFFFFF', { roughness: 0.35, emissive: new THREE.Color('#F2F6FD'), emissiveIntensity: 0.32 })
const glowM = (color: string, base = '#FFFFFF', o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.45, ...o })
const noShadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((n) => ((n as THREE.Mesh).castShadow = false))
  return o
}
const basic = (map: THREE.Texture, o: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, ...o })
/** a picture: a plane facing +z */
function picture(tex: THREE.Texture, w: number, h: number, pos: V3, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(tex, o))
  m.position.set(...pos)
  return m
}
function floorPlane(w: number, d: number, m: THREE.Material, pos: V3) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
  p.rotation.x = -Math.PI / 2
  p.position.set(...pos)
  p.receiveShadow = true
  return p
}
const haloTex = () =>
  canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
function halo(color: string, size: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: haloTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
  m.renderOrder = 4
  return m
}
const setOp = (m: THREE.Mesh, o: number) => ((m.material as THREE.MeshBasicMaterial).opacity = o)
function lights(scene: THREE.Scene, target: V3, key = 2.0) {
  scene.add(new THREE.HemisphereLight(0xeaf1ff, 0xd9cbb5, 0.95))
  const k = new THREE.DirectionalLight(0xfff3e2, key)
  k.position.set(target[0] + 3, target[1] + 9, target[2] + 8)
  k.target.position.set(...target)
  k.castShadow = true
  k.shadow.mapSize.set(2048, 2048)
  k.shadow.camera.left = -6
  k.shadow.camera.right = 6
  k.shadow.camera.top = 6
  k.shadow.camera.bottom = -6
  k.shadow.bias = -0.0005
  k.shadow.radius = 4
  scene.add(k, k.target)
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0.55)
  rim.position.set(target[0] - 7, target[1] + 5, target[2] - 6)
  scene.add(rim)
}
function setCam(camera: THREE.PerspectiveCamera, pos: V3, at: V3, fov: number) {
  camera.fov = fov
  camera.position.set(...pos)
  camera.lookAt(...at)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

/** a padlock: a glossy body with a keyhole and a steel shackle that lifts to open (`open` 0..1) */
function makePadlock(body: string, s = 1) {
  const g = new THREE.Group()
  const bodyM = mat(body, { roughness: 0.25, metalness: 0.45, emissive: new THREE.Color(body), emissiveIntensity: 0.12 })
  g.add(box(0.1 * s, 0.082 * s, 0.042 * s, bodyM, [0, 0, 0], 0.014 * s))
  const holeM = mat('#1A2235', { roughness: 0.6 })
  g.add(cyl(0.011 * s, 0.011 * s, 0.01 * s, holeM, [0, 0.008 * s, 0.021 * s]).rotateX(Math.PI / 2))
  g.add(box(0.008 * s, 0.022 * s, 0.008 * s, holeM, [0, -0.01 * s, 0.019 * s]))
  const steel = mat('#D5DCE7', { metalness: 0.85, roughness: 0.22 })
  const shackle = new THREE.Group()
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.031 * s, 0.0085 * s, 10, 24, Math.PI), steel)
  arc.position.y = 0.062 * s
  arc.castShadow = true
  shackle.add(arc)
  for (const x of [-0.031, 0.031]) shackle.add(cyl(0.0085 * s, 0.0085 * s, 0.03 * s, steel, [x * s, 0.047 * s, 0], 12))
  g.add(shackle)
  return {
    g,
    bodyM,
    setOpen: (k: number) => {
      shackle.position.y = 0.032 * s * k
    },
  }
}
/** a data packet: a white rounded cube with its bits on the front */
function makePacket(size = 0.2) {
  const g = new THREE.Group()
  const bodyM = mat('#FFFFFF', { roughness: 0.3, metalness: 0.05, emissive: new THREE.Color('#7FB0FF'), emissiveIntensity: 0 })
  g.add(box(size, size, size, bodyM, [0, 0, 0], size * 0.16))
  const face = picture(dataTex(), size * 0.8, size * 0.8, [0, 0, size / 2 + 0.002])
  g.add(face)
  return { g, bodyM }
}

/* ------------------------------------------------------------------ Character Lab people */

type Sprite = { object: THREE.Object3D; update: (t: number, camera: THREE.Camera) => void }
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
const who = (base: CharacterConfig, o: { name: string; gender?: CharacterConfig['gender']; hair?: Partial<CharacterConfig['hair']>; face?: Partial<CharacterConfig['face']>; outfit?: Partial<CharacterConfig['outfit']>; accessories?: Partial<CharacterConfig['accessories']>; build?: Partial<CharacterConfig['build']>; skinTone?: CharacterConfig['skinTone'] }): CharacterConfig => ({
  ...base,
  name: o.name,
  gender: o.gender ?? base.gender,
  skinTone: o.skinTone ?? base.skinTone,
  hair: { ...base.hair, ...o.hair },
  face: { ...base.face, ...o.face },
  outfit: { ...base.outfit, ...o.outfit },
  accessories: { ...base.accessories, ...o.accessories },
  build: { ...base.build, ...o.build },
})
function person(o: { config: CharacterConfig; dress?: (s: Skin) => Skin; seed: number; faces: [number, string][]; pose: (p: Pose, c: number) => void; loop: number; height: number; frames: number; redraw: () => void; holdT?: number }): Sprite {
  /* no blink in the half second around the held moment, so a ?still frame never shows closed eyes */
  const quiet = (c: number) => o.holdT !== undefined && Math.abs(c - o.holdT) < 0.35
  return castSprite({
    config: o.config,
    dress: o.dress,
    loop: o.loop,
    frames: o.frames,
    height: o.height,
    wide: 60,
    adaptive: true,
    shadow: 0.2,
    onReady: o.redraw,
    timeline: (c) => ({ seed: o.seed, idle: { ...CAST_IDLE, saccades: false, sway: false, blink: !quiet(c) }, life: 0, ...faceAt(c, o.faces, o.loop) }),
    pose: o.pose,
  })
}

/* role clothing (rig body frame 400 x 600; head-local skull centre 0,0) */
const BLAZER = (color: string, edge: string) => (
  <g data-part="blazer">
    <path d="M 150 212 L 186 210 L 200 300 L 172 360 L 150 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 250 212 L 214 210 L 200 300 L 228 360 L 250 360 Z" fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
    <path d="M 186 210 L 176 246 L 192 258 Z M 214 210 L 224 246 L 208 258 Z" fill={edge} opacity={0.55} />
    <circle cx={204} cy={318} r={3.2} fill={edge} />
    <circle cx={204} cy={338} r={3.2} fill={edge} />
  </g>
)
const LANYARD = (strap: string, card: string) => (
  <g data-part="lanyard">
    <path d="M 186 206 L 194 266 M 214 206 L 206 266" stroke={strap} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={185} y={264} width={30} height={38} rx={4} fill="#FFFFFF" stroke={strap} strokeWidth={2.5} />
    <rect x={191} y={270} width={18} height={13} rx={2} fill={card} opacity={0.75} />
    <rect x={191} y={287} width={18} height={3} rx={1.5} fill={card} opacity={0.45} />
    <rect x={191} y={293} width={12} height={3} rx={1.5} fill={card} opacity={0.45} />
  </g>
)
const GUARD_CAP = (crown: string, band: string) => (
  <g data-part="guard-cap">
    <path d="M -64 -50 C -70 -104 70 -104 64 -50 Z" fill={crown} />
    <path d="M -50 -88 C -20 -100 20 -100 50 -88" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-65} y={-62} width={130} height={15} rx={4} fill={band} />
    <path d="M -10 -86 L 0 -94 L 10 -86 L 7 -74 L -7 -74 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <path d="M -60 -48 Q 0 -26 60 -48 L 56 -54 Q 0 -38 -56 -54 Z" fill="#141B2E" />
  </g>
)
const GUARD_UNIFORM = (trim: string) => (
  <g data-part="uniform">
    <path d="M 140 212 L 178 206 L 180 218 L 142 224 Z" fill={trim} />
    <path d="M 260 212 L 222 206 L 220 218 L 258 224 Z" fill={trim} />
    <path d="M 226 246 L 231 236 L 236 246 L 247 247 L 239 254 L 241 265 L 231 259 L 221 265 L 223 254 L 215 247 Z" fill={C.gold} stroke="#B98A1C" strokeWidth={1.5} />
    <rect x={150} y={250} width={30} height={22} rx={3} fill="none" stroke={trim} strokeWidth={2.5} />
  </g>
)
/** a courier's cap, head-local: brown crown, a yellow band */
const COURIER_CAP = (
  <g data-part="courier-cap">
    <path d="M -60 -42 C -62 -98 62 -98 60 -42 Z" fill="#6E4424" />
    <path d="M -46 -84 C -20 -96 20 -96 46 -84" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={6} fill="none" />
    <rect x={-61} y={-52} width={122} height={12} rx={4} fill="#F2C14E" />
    <path d="M -58 -42 Q 0 -22 58 -42 L 54 -48 Q 0 -34 -54 -48 Z" fill="#4A2D17" />
  </g>
)
/** a courier's satchel on a strap across the chest */
const COURIER_BAG = (
  <g data-part="courier-bag">
    <path d="M 232 210 L 160 372" stroke="#4A2D17" strokeWidth={9} strokeLinecap="round" fill="none" />
    <rect x={124} y={352} width={60} height={46} rx={7} fill="#6E4424" />
    <rect x={124} y={352} width={60} height={16} rx={6} fill="#5A361C" />
    <rect x={148} y={364} width={12} height={8} rx={2} fill="#F2C14E" />
  </g>
)
const withNeck = (part: ReactNode) => (k: Skin): Skin => ({ ...k, neckExtras: <>{k.neckExtras}{part}</> })
const withTop = (part: ReactNode) => (k: Skin): Skin => ({ ...k, top: <>{k.top}{part}</> })
const withHat = (part: ReactNode) => (k: Skin): Skin => ({ ...k, hairFront: <>{k.hairFront}{part}</> })

/* ---- hands: forward kinematics in the rig's 400 x 600 frame (pivot 6 px inside the shoulder tip at y 205, upper arm
   95, forearm 85 + 14 to the grip; an angle is measured from hanging straight down, positive lifts away from the body,
   the forearm at shoulder minus elbow) and the inverse, so a hand lands on the thing it reaches for ---- */

type Pt = { x: number; y: number }
type Arm = { s: number; e: number }
const UA = 95
const FA = 99
function handPt(side: 'L' | 'R', sh: number, a: Arm): Pt {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  const s = a.s * DEG
  const f = (a.s - a.e) * DEG
  return { x: px + sg * (Math.sin(s) * UA + Math.sin(f) * FA), y: 205 + Math.cos(s) * UA + Math.cos(f) * FA }
}
/** the arm angles that put this hand at rig point p: of the two elbow solutions, the one with the LOWER elbow (an
 *  arm holding something up in front), so a near target never lifts the elbow across the face */
function ik(side: 'L' | 'R', sh: number, p: Pt, _down = false): Arm {
  const a = ik2(side, sh, p, false)
  const b = ik2(side, sh, p, true)
  return Math.cos(a.s * DEG) >= Math.cos(b.s * DEG) ? a : b
}
function ik2(side: 'L' | 'R', sh: number, p: Pt, down: boolean): Arm {
  const sg = side === 'L' ? -1 : 1
  const px = 200 + sg * (sh - 6)
  let dx = (p.x - px) * sg
  let dy = p.y - 205
  let d = Math.hypot(dx, dy)
  const max = UA + FA - 3
  if (d > max) {
    dx *= max / d
    dy *= max / d
    d = max
  }
  d = Math.max(d, 8)
  const phi = Math.atan2(dx, dy)
  const a = Math.acos(Math.min(1, Math.max(-1, (UA * UA + d * d - FA * FA) / (2 * UA * d))))
  const s = down ? phi - a : phi + a
  const f = Math.atan2(dx - Math.sin(s) * UA, dy - Math.cos(s) * UA)
  return { s: s / DEG, e: (s - f) / DEG }
}
const mixArm = (a: Arm, b: Arm, k: number): Arm => ({ s: lerp(a.s, b.s, k), e: lerp(a.e, b.e, k) })
/** a world point, seen from `cam`, carried onto the plane of a person standing at root (h tall): rig coordinates */
function rigTarget(T: THREE.Vector3, root: THREE.Vector3, h: number, cam: V3): Pt {
  const k = (root.z + 0.08 - cam[2]) / (T.z - cam[2])
  const px = cam[0] + (T.x - cam[0]) * k
  const py = cam[1] + (T.y - cam[1]) * k
  const u = h / 0.93 / 600
  return { x: 200 + (px - root.x) / u, y: 600 - (py - root.y) / u }
}
function rigToWorld(p: Pt, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const u = h / 0.93 / 600
  const cam = camera.position
  const phi = Math.atan2(cam.x - root.x, cam.z - root.z)
  const lx = (p.x - 200) * u
  out.set(root.x + Math.cos(phi) * lx, root.y + (600 - p.y) * u, root.z - Math.sin(phi) * lx)
  return out
}
function towardCamera(p: THREE.Vector3, camera: THREE.Camera, d: number) {
  const v = camera.position.clone().sub(p).normalize()
  return p.addScaledVector(v, d)
}
/** the hand of the frame the sprite is showing, in the world (a prop in that hand goes here) */
function handWorld(side: 'L' | 'R', sh: number, arm: Arm, h: number, root: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  rigToWorld(handPt(side, sh, arm), h, root, camera, out)
  return towardCamera(out, camera, 0.08)
}
/** the loop time of the frame a sprite of F frames is showing at c (props in a hand follow the drawn frame) */
const frameT = (c: number, L: number, F: number) => (Math.floor((mod(c, L) / L) * F) % F) * (L / F)

function walkLegs(p: Pose, c: number, w: number, dir: number) {
  if (w <= 0) return
  const stride = Math.sin(c * Math.PI * 4.4)
  to(p, 'kneeL', Math.max(0, stride) * 0.55, w)
  to(p, 'kneeR', Math.max(0, -stride) * 0.55, w)
  to(p, 'headTurn', 0.4 * dir, w)
  to(p, 'lookX', 0.8 * dir, w)
}
const swing = (c: number, w: number) => w * 10 * Math.sin(c * Math.PI * 4.4)
const bob = (w: number, c: number) => w * Math.abs(Math.sin(c * Math.PI * 4.4)) * 0.03
/** a place on a path of [t0, t1, xTo] keys (eased between keys); x and how much the person is walking */
function along(c: number, keys: [number, number, number][]): { x: number; walking: number; dir: number } {
  let x = keys[0][2]
  for (const [a, b, xt] of keys) {
    if (c < a) break
    if (b > a && c <= b) {
      const k = seg(c, a, b)
      const walking = hold(c, a, a + 0.08, b - 0.08, b)
      return { x: lerp(x, xt, k), walking, dir: Math.sign(xt - x) }
    }
    x = xt
  }
  return { x, walking: 0, dir: 0 }
}
/** an arm built from spans: each [a, b, c, d] eases from the arm so far to `target(c)` (IK) and back */
type Span = [number, number, number, number, (c: number) => Arm]
function armFrom(c: number, base: Arm, spans: Span[]): Arm {
  let a = base
  for (const [t0, t1, t2, t3, f] of spans) {
    const w = hold(c, t0, t1, t2, t3)
    if (w > 0) a = mixArm(a, f(c), w)
  }
  return a
}

/* ================================================================== T10 · the gate guard and the parcel */

const L10 = 8
const F10 = 120
const HOLD10 = 2.75 /* the item held up under the green scanner light, the parcel open, the fresh envelopes waiting */
const CAM10: V3 = [0, 1.5, 4.1]
const AT10: V3 = [0, 1.12, -0.5]
const CAM10C: V3 = [0, 1.3, 3.35]
const AT10C: V3 = [0, 0.98, -0.5]
const TOP10 = 0.92 /* the counter's top */
const P10 = {
  cour: -1.0,
  staff: 1.05,
  z: -0.2,
  guard: [0, 0, -0.72] as V3,
  hC: 1.68,
  hG: 1.74,
  hS: 1.62,
  inP: [-0.5, 1.08, -0.34] as V3, // the handover point over the counter's left end
  home: [-0.2, TOP10 + 0.09, -0.36] as V3, // the parcel on the counter
  chk: [0.18, 1.1, -0.44] as V3, // the item held up to be checked
  wandRest: [-0.42, TOP10 + 0.018, -0.5] as V3,
  wandUp: [-0.12, 1.08, -0.46] as V3,
  stand: [0.42, TOP10, -0.4] as V3, // the envelope stand's base
  outP: [0.6, 1.1, -0.32] as V3,
  off: 2.6,
}
const PARCEL = { w: 0.28, h: 0.18, d: 0.22 }
const ENV = { w: 0.3, h: 0.21, t: 0.012 }
const ENV_Y = TOP10 + 0.03 + ENV.h / 2
const T10 = {
  give: [0.15, 0.5] as const, // the courier's arm out with the parcel
  take: [0.55, 0.75] as const, // from his hand to the guard's
  place: [0.8, 1.12] as const,
  seal: [1.2, 1.45] as const,
  flaps: [1.4, 1.8] as const,
  lift: [1.85, 2.3] as const,
  wand: [1.95, 2.22, 3.05, 3.35] as const,
  scan: [2.35, 3.05] as const,
  over: [3.1, 3.4] as const,
  down: [3.4, 3.7] as const,
  fold: [3.72, 3.95] as const,
  stamp: [3.95, 4.1] as const,
  away: [4.15, 4.5] as const, // the empty box slid back under the counter
  hand: [4.4, 4.85] as const, // the envelope out to the staff member
  pass: [4.85, 5.05] as const,
  chest: [5.05, 5.35] as const,
  restock: [6.6, 7.0] as const,
}
const COUR10: [number, number, number][] = [
  [0, 0, P10.cour],
  [3.7, 4.9, -P10.off],
  [6.8, 8.0, P10.cour],
]
const STAFF10: [number, number, number][] = [
  [0, 0, P10.staff],
  [5.45, 6.55, P10.off],
  [6.65, 7.8, P10.staff],
]
const cour10 = (c: number) => along(c, COUR10)
const staff10 = (c: number) => along(c, STAFF10)
/** the parcel's flap opening 0..1 and the seal's presence 0..1 */
const flaps10 = (c: number) => seg(c, T10.flaps[0], T10.flaps[1]) * (c < 6.0 ? 1 : 0)
const seal10 = (c: number) => (c > 6.0 ? 1 : 1 - seg(c, T10.seal[0], T10.seal[1]))

/** a carried thing at a person's chest: the rig point between the two hands */
const CHEST_PT: Pt = { x: 200, y: 322 }

/** where the parcel is (world), at loop time c (with the courier's root for the carried phases) */
function parcelAt10(c: number, courRoot: THREE.Vector3, camera: THREE.Camera, out: THREE.Vector3) {
  const home = v3(P10.home)
  const inP = v3(P10.inP)
  if (c >= 6.6 || c < T10.give[0]) {
    rigToWorld(CHEST_PT, P10.hC, courRoot, camera, out)
    return towardCamera(out, camera, 0.14)
  }
  if (c < T10.take[0]) {
    const chest = towardCamera(rigToWorld(CHEST_PT, P10.hC, courRoot, camera, new THREE.Vector3()), camera, 0.14)
    return out.copy(chest).lerp(inP, seg(c, T10.give[0], T10.give[1]))
  }
  if (c < T10.away[0]) return out.copy(inP).lerp(home, seg(c, T10.place[0], T10.place[1]))
  const k = seg(c, T10.away[0], T10.away[1])
  return out.set(home.x, home.y - 0.32 * k, home.z - 0.34 * k)
}
/** the document inside the parcel */
function itemAt10(c: number, out: THREE.Vector3) {
  const home = v3(P10.home)
  const chk = v3(P10.chk)
  const top = new THREE.Vector3(P10.stand[0], ENV_Y + ENV.h / 2 + 0.11, P10.stand[2] - 0.001)
  const inside = new THREE.Vector3(P10.stand[0], ENV_Y - 0.01, P10.stand[2] - 0.001)
  if (c < T10.lift[0]) return out.copy(home)
  if (c < T10.over[0]) {
    out.copy(home).lerp(chk, seg(c, T10.lift[0], T10.lift[1]))
    out.y += 0.012 * Math.sin((c - T10.lift[1]) * TAU * 1.2) * seg(c, T10.lift[1], T10.lift[1] + 0.2)
    return out
  }
  if (c < T10.down[0]) return out.copy(chk).lerp(top, seg(c, T10.over[0], T10.over[1]))
  return out.copy(top).lerp(inside, seg(c, T10.down[0], T10.down[1]))
}
const STAFF_CHEST: Pt = { x: 186, y: 318 }
/** the fresh envelope: in its stand, then handed over, then carried inside; a new one back in the stand */
function envAt10(c: number, staffChest: THREE.Vector3, out: THREE.Vector3) {
  const stand = new THREE.Vector3(P10.stand[0], ENV_Y, P10.stand[2])
  const outP = v3(P10.outP)
  if (c < T10.hand[0] || c >= T10.restock[0]) return out.copy(stand)
  if (c < T10.pass[1]) return out.copy(stand).lerp(outP, seg(c, T10.hand[0], T10.hand[1]))
  return out.copy(outP).lerp(staffChest, seg(c, T10.chest[0], T10.chest[1]))
}
function wandAt10(c: number, out: THREE.Vector3) {
  const rest = v3(P10.wandRest)
  const up = v3(P10.wandUp)
  const k = hold(c, T10.wand[0], T10.wand[1], T10.wand[2], T10.wand[3])
  out.copy(rest).lerp(up, k)
  out.y += 0.06 * Math.sin((c - T10.scan[0]) * TAU * 1.4) * hold(c, T10.scan[0], T10.scan[0] + 0.15, T10.scan[1] - 0.15, T10.scan[1])
  return out
}

function courierPose10(sh: number, camera: () => THREE.Camera) {
  const chestL = ik('L', sh, { x: 160, y: 334 })
  const chestR = ik('R', sh, { x: 240, y: 334 })
  const rest: Arm = { s: 8, e: 10 }
  const carrying = (c: number) => (c >= 6.6 ? 1 : 0) + (c < T10.give[0] + 0.25 ? 1 - seg(c, T10.give[0], T10.give[0] + 0.25) : 0)
  const R = (c: number): Arm => {
    const w = cour10(c).walking
    let a: Arm = { s: rest.s - swing(c, w), e: rest.e }
    a = mixArm(a, chestR, clamp01(carrying(c)))
    const out = hold(c, T10.give[0], T10.give[0] + 0.01, T10.take[1], T10.take[1] + 0.3)
    if (out > 0) {
      const r = new THREE.Vector3(P10.cour, 0, P10.z)
      const pAt = parcelAt10(c, r, camera(), new THREE.Vector3())
      pAt.x += PARCEL.w / 2 - 0.03
      pAt.y -= PARCEL.h / 2 - 0.01
      const tgt = ik('R', sh, rigTarget(pAt, r, P10.hC, CAM10), true)
      a = mixArm(a, tgt, c < T10.give[0] + 0.01 ? 1 : out)
    }
    return a
  }
  const L = (c: number): Arm => {
    const w = cour10(c).walking
    const a: Arm = { s: rest.s + swing(c, w), e: rest.e }
    return mixArm(a, chestL, clamp01(carrying(c)))
  }
  return {
    R,
    L,
    pose: (p: Pose, c: number) => {
      const r = R(c)
      const l = L(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = l.s
      p.elbowL = l.e
      const at = cour10(c)
      walkLegs(p, c, at.walking, at.dir)
      /* at the counter he watches the guard and the parcel */
      const watch = hold(c, -0.1, 0.05, 3.55, 3.75)
      to(p, 'headTurn', 0.38, watch)
      to(p, 'lookX', 0.85, watch)
      to(p, 'lookY', 0.25, hold(c, 1.1, 1.3, 2.1, 2.3))
      to(p, 'headNod', 0.12, hold(c, 1.1, 1.3, 2.1, 2.3))
      /* the last steps in, he already looks at the guard */
      to(p, 'headTurn', 0.4, seg(c, 7.6, 7.9))
      to(p, 'lookX', 0.85, seg(c, 7.6, 7.9))
    },
  }
}

/* ------------------------------------------------------------------ T10 everyday: the office gate */

function setupT10Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#DCEBFB')
  setCam(camera, CAM10, AT10, 40)
  lights(scene, [0, 1.0, -0.5])

  /* the street (left): pavement, kerb, road, skyline */
  const pave = mat('#ffffff', { map: tileTex('#DAD7D0', '#C6C1B7', 4, [5, 8]), roughness: 0.85 })
  scene.add(floorPlane(3.6, 4.2, pave, [-0.62 - 1.8, 0, 0.3 - 0.9]))
  scene.add(floorPlane(3.6, 2.0, mat('#ffffff', { map: roadTex(), roughness: 0.9 }), [-0.62 - 1.8, -0.002, -3.4]))
  scene.add(noShadow(box(3.6, 0.07, 0.12, mat('#C9CED8', { roughness: 0.7 }), [-0.62 - 1.8, 0.035, -2.4])))
  scene.add(picture(skylineTex(), 9, 3.2, [0, 1.5, -4.6], { transparent: false }))
  /* the compound (right): stone tiles */
  const stone = mat('#ffffff', { map: tileTex('#F1E8DA', '#DED1BD', 2, [4, 6]), roughness: 0.6 })
  scene.add(floorPlane(3.4, 4.2, stone, [-0.62 + 1.7, 0.001, 0.3 - 0.9]))

  /* the office building inside the gate: its front with the glass entrance */
  const wallM = mat('#EEF2F8', { roughness: 0.8 })
  const front = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.0, 0.12), [wallM, wallM, wallM, wallM, mat('#ffffff', { map: officeFrontTex(), roughness: 0.8 }), wallM])
  front.position.set(0.74 + 1.2, 1.5, -1.42)
  front.receiveShadow = true
  scene.add(front)

  /* the gatehouse: two pillars and a beam with the company emblem over the guard's booth */
  const pillarM = mat('#E9E2D6', { roughness: 0.7 })
  for (const x of [-0.75, 0.75]) {
    scene.add(box(0.24, 2.7, 0.26, pillarM, [x, 1.35, -1.05], 0.02))
    scene.add(box(0.3, 0.08, 0.32, mat('#CDBFA8', { roughness: 0.6 }), [x, 2.74, -1.05], 0.02))
  }
  const beam = box(1.62, 0.3, 0.3, mat(C.navy, { roughness: 0.45 }), [0, 2.6, -1.05], 0.03)
  scene.add(beam)
  scene.add(picture(emblemTex(), 0.24, 0.24, [0, 2.6, -0.895]))
  /* the booth: plaster walls, a wide window behind the guard */
  const boothM = mat('#F6F2EA', { roughness: 0.75 })
  scene.add(box(1.24, 2.45, 0.6, boothM, [0, 1.225, -1.45]))
  scene.add(box(0.98, 0.86, 0.02, mat('#5E6B86', { roughness: 0.4, metalness: 0.4 }), [0, 1.7, -1.14]))
  const glassM = new THREE.MeshStandardMaterial({ color: '#BFDDFB', roughness: 0.08, metalness: 0.25, emissive: new THREE.Color('#9CC9F5'), emissiveIntensity: 0.25 })
  scene.add(box(0.92, 0.8, 0.02, glassM, [0, 1.7, -1.13]))
  scene.add(noShadow(box(0.02, 0.8, 0.025, mat('#5E6B86'), [0, 1.7, -1.12])))

  /* the check counter */
  const wood = mat('#B98A5C', { roughness: 0.65 })
  scene.add(box(1.24, TOP10 - 0.04, 0.42, wood, [0, (TOP10 - 0.04) / 2, -0.38], 0.015))
  scene.add(box(1.3, 0.04, 0.48, mat('#F4EDE2', { roughness: 0.45 }), [0, TOP10 - 0.02, -0.38], 0.01))
  scene.add(noShadow(box(1.0, 0.36, 0.02, mat(C.navy, { roughness: 0.5 }), [0, 0.56, -0.165])))
  scene.add(picture(emblemTex(), 0.2, 0.2, [0, 0.56, -0.153]))

  /* the parcel: a taped carton with two lid flaps and a gold seal across the front seam */
  const parcel = new THREE.Group()
  const card = mat('#C8955E', { roughness: 0.85 })
  parcel.add(box(PARCEL.w, PARCEL.h, PARCEL.d, card, [0, 0, 0], 0.012))
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(PARCEL.w - 0.02, PARCEL.d - 0.02), mat('#5E3E22', { roughness: 1 }))
  inner.rotation.x = -Math.PI / 2
  inner.position.y = PARCEL.h / 2 + 0.001
  parcel.add(inner)
  const flapM = mat('#D2A26C', { roughness: 0.85, side: THREE.DoubleSide })
  const flapF = new THREE.Group()
  flapF.position.set(0, PARCEL.h / 2 + 0.004, PARCEL.d / 2)
  flapF.add(box(PARCEL.w - 0.004, 0.006, PARCEL.d / 2, flapM, [0, 0, -PARCEL.d / 4]))
  const flapB = new THREE.Group()
  flapB.position.set(0, PARCEL.h / 2 + 0.004, -PARCEL.d / 2)
  flapB.add(box(PARCEL.w - 0.004, 0.006, PARCEL.d / 2, flapM, [0, 0, PARCEL.d / 4]))
  parcel.add(flapF, flapB)
  const tapeM = mat('#E7CB97', { roughness: 0.5, transparent: true })
  const tape = new THREE.Group()
  tape.add(noShadow(box(0.06, 0.004, PARCEL.d + 0.004, tapeM, [0, PARCEL.h / 2 + 0.009, 0])))
  tape.add(noShadow(box(0.06, 0.07, 0.004, tapeM, [0, PARCEL.h / 2 - 0.03, PARCEL.d / 2 + 0.002])))
  parcel.add(tape)
  const oldSeal = new THREE.Group()
  oldSeal.add(noShadow(cyl(0.032, 0.032, 0.006, mat(C.gold, { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color(C.gold), emissiveIntensity: 0.2 }), [0, 0, 0], 28).rotateX(Math.PI / 2)))
  oldSeal.add(noShadow(cyl(0.02, 0.02, 0.008, mat(C.goldDark, { roughness: 0.4 }), [0, 0, 0.001], 24).rotateX(Math.PI / 2)))
  oldSeal.position.set(0, PARCEL.h / 2 - 0.02, PARCEL.d / 2 + 0.006)
  parcel.add(oldSeal)
  scene.add(parcel)

  /* the document inside */
  const item = picture(docTex(), 0.17, 0.22, [0, 0, 0], { side: THREE.DoubleSide })
  item.renderOrder = 2
  scene.add(item)
  const itemGlow = halo('#5BE08A', 0.5)
  scene.add(itemGlow)

  /* the stand of fresh envelopes, the front one is the one he fills */
  const [sx, , sz] = P10.stand
  scene.add(box(0.36, 0.03, 0.12, mat('#3A4560', { roughness: 0.4, metalness: 0.3 }), [sx, TOP10 + 0.015, sz - 0.03], 0.008))
  scene.add(noShadow(box(0.36, 0.1, 0.012, mat('#3A4560', { roughness: 0.4, metalness: 0.3 }), [sx, TOP10 + 0.06, sz - 0.09])))
  const envFrontM = [mat('#E3EAF7'), mat('#E3EAF7'), mat('#E3EAF7'), mat('#E3EAF7'), mat('#ffffff', { map: envelopeTex(), roughness: 0.7, transparent: true }), mat('#E3EAF7')]
  for (const dz of [-0.06, -0.035]) scene.add(box(ENV.w, ENV.h, ENV.t, envFrontM, [sx, ENV_Y, sz + dz]))
  const env = new THREE.Group()
  const envBodyMats = envFrontM.map((m) => m.clone()) as THREE.MeshStandardMaterial[]
  env.add(box(ENV.w, ENV.h, ENV.t, envBodyMats, [0, 0, 0]))
  const flapShape = new THREE.Shape()
  flapShape.moveTo(-ENV.w / 2, 0)
  flapShape.lineTo(ENV.w / 2, 0)
  flapShape.lineTo(0.02, 0.115)
  flapShape.quadraticCurveTo(0, 0.125, -0.02, 0.115)
  flapShape.closePath()
  const envFlapM = mat('#D9E3F5', { roughness: 0.7, side: THREE.DoubleSide, transparent: true })
  const envFlap = new THREE.Group()
  envFlap.position.set(0, ENV.h / 2, ENV.t / 2 + 0.002)
  const flapMesh = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), envFlapM)
  envFlap.add(flapMesh)
  const newSeal = noShadow(cyl(0.03, 0.03, 0.006, mat(C.brand, { roughness: 0.3, metalness: 0.2, emissive: new THREE.Color(C.brand), emissiveIntensity: 0.25 }), [0, 0.095, 0.004], 28).rotateX(Math.PI / 2))
  envFlap.add(newSeal)
  env.add(envFlap)
  scene.add(env)

  /* the guard's scanner wand: a dark handle with a lens that lights green */
  const wand = new THREE.Group()
  wand.add(cyl(0.016, 0.018, 0.16, mat('#1E2638', { roughness: 0.4 }), [-0.04, 0, 0], 16).rotateZ(Math.PI / 2))
  wand.add(box(0.06, 0.04, 0.034, mat('#2B3550', { roughness: 0.35, metalness: 0.3 }), [0.06, 0, 0], 0.008))
  const lensM = glowM(C.green, '#7DE3A2', { emissiveIntensity: 0.15 })
  wand.add(noShadow(box(0.012, 0.03, 0.026, lensM, [0.092, 0, 0], 0.004)))
  scene.add(wand)
  /* its beam: a fan of green light from the lens to the item */
  const beamM = new THREE.MeshBasicMaterial({ color: '#5BE08A', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })
  const beamGeo = new THREE.BufferGeometry()
  beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
  const beam10 = new THREE.Mesh(beamGeo, beamM)
  beam10.renderOrder = 5
  beam10.frustumCulled = false
  scene.add(beam10)

  /* people */
  const cCfg = who(CAST_PRESETS.rohan, { name: 'Courier', skinTone: 'dusky', hair: { style: 'short', color: 'black' }, outfit: { top: 'polo', topColor: '#8A5A33', bottom: 'trousers', bottomColor: '#3B3F4A', shoeColor: '#2A2A30' }, accessories: { beard: 'stubble', watch: true, glasses: 'none' } })
  const gCfg = who(CAST_PRESETS.dev, { name: 'Guard', skinTone: 'medium', hair: { style: 'short', color: 'black' }, outfit: { top: 'shirt', topColor: '#43557F', bottom: 'trousers', bottomColor: '#26304D', shoeColor: '#1E1E24' }, accessories: { beard: 'short', glasses: 'none', watch: true } })
  const sCfg = who(CAST_PRESETS.meera, { name: 'Staff', skinTone: 'fair', hair: { style: 'bob', color: 'darkBrown' }, outfit: { top: 'blouse', topColor: '#F3F6FC', bottom: 'trousers', bottomColor: '#26304A', shoeColor: '#2A2A30' }, accessories: { earrings: true, glasses: 'round' } })
  const shC = buildSkin(cCfg).shoulderHalf
  const shG = buildSkin(gCfg).shoulderHalf
  const shS = buildSkin(sCfg).shoulderHalf
  const gRoot = v3(P10.guard)
  const cp = courierPose10(shC, () => camera)

  /* the guard: left hand takes the parcel, steadies it, works the wand, slides the box away; right hand peels the
     seal, opens the flaps, lifts and checks the item, puts it in the envelope, folds and seals it, hands it on */
  const restG: Arm = { s: 10, e: 14 }
  const at = (fn: (c: number) => THREE.Vector3, side: 'L' | 'R', dx: number, dy: number) => (c: number): Arm => {
    const p = fn(c)
    p.x += dx
    p.y += dy
    return ik(side, shG, rigTarget(p, gRoot, P10.hG, CAM10), true)
  }
  const pAt = (c: number) => parcelAt10(c, new THREE.Vector3(P10.cour, 0, P10.z), camera, new THREE.Vector3())
  const iAt = (c: number) => itemAt10(c, new THREE.Vector3())
  const wAt = (c: number) => wandAt10(c, new THREE.Vector3())
  const sealPt = (c: number) => {
    const p = v3(P10.home)
    p.y += PARCEL.h / 2 - 0.02 + 0.06 * seg(c, T10.seal[0], T10.seal[1])
    p.z += PARCEL.d / 2
    return p
  }
  const flapPt = (c: number) => {
    const k = flaps10(c)
    const p = v3(P10.home)
    p.y += PARCEL.h / 2 + Math.sin(k * 2.2) * PARCEL.d * 0.5
    p.z += PARCEL.d / 2 - Math.cos(k * 2.2) * PARCEL.d * 0.5
    return p
  }
  const envTip = (c: number) => {
    const k = seg(c, T10.fold[0], T10.fold[1])
    const p = new THREE.Vector3(P10.stand[0], ENV_Y + ENV.h / 2, P10.stand[2] + ENV.t / 2)
    p.y += Math.cos(k * Math.PI) * 0.11
    p.z += Math.sin(k * Math.PI) * 0.11
    return p
  }
  const envPt = (c: number) => envAt10(c, new THREE.Vector3(P10.staff, 1.1, P10.z), new THREE.Vector3())
  const gL = (c: number) =>
    armFrom(c, restG, [
      [0.35, 0.6, T10.place[1], T10.place[1] + 0.15, at(pAt, 'L', -PARCEL.w / 2 + 0.01, -0.02)],
      [T10.place[1], T10.place[1] + 0.12, 1.75, 1.95, at(() => v3(P10.home), 'L', -PARCEL.w / 2 + 0.005, 0.0)],
      [1.9, T10.wand[1], T10.wand[3], T10.wand[3] + 0.2, at(wAt, 'L', -0.07, -0.015)],
      [3.95, T10.away[0], T10.away[1] - 0.05, T10.away[1] + 0.2, at(pAt, 'L', -PARCEL.w / 2 + 0.01, 0.0)],
    ])
  const gR = (c: number) =>
    armFrom(c, restG, [
      [1.05, T10.seal[0], T10.seal[1], T10.seal[1] + 0.05, at(sealPt, 'R', 0.02, -0.02)],
      [T10.seal[1], T10.flaps[0] + 0.05, T10.flaps[1], T10.flaps[1] + 0.08, at(flapPt, 'R', 0.05, 0.0)],
      [T10.flaps[1], T10.lift[0], T10.down[1], T10.fold[0], at(iAt, 'R', 0.075, -0.06)],
      [T10.down[1], T10.fold[0], T10.stamp[1], T10.stamp[1] + 0.2, at(envTip, 'R', 0.03, 0.0)],
      [T10.stamp[1], T10.hand[0], T10.pass[1], T10.pass[1] + 0.3, at(envPt, 'R', -ENV.w / 2 + 0.01, -0.02)],
    ])
  const guard = person({
    config: gCfg,
    dress: (k) => withHat(GUARD_CAP('#2A3550', '#141B2E'))(withTop(GUARD_UNIFORM('#141B2E'))(k)),
    seed: 151,
    faces: [
      [0, 'listening'],
      [0.6, 'happy'],
      [1.2, 'thinking'],
      [2.85, 'happy'],
      [3.6, 'neutral'],
      [4.5, 'happy'],
      [5.5, 'neutral'],
      [7.3, 'listening'],
    ],
    pose: (p, c) => {
      const l = gL(c)
      const r = gR(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      p.shoulderR = r.s
      p.elbowR = r.e
      /* the courier (left), the parcel (down), the item (ahead), the envelope (right, down), the staff member (right) */
      const toC = Math.max(hold(c, -0.2, 0, 0.85, 1.05), hold(c, 7.0, 7.3, 8.2, 8.4))
      to(p, 'headTurn', -0.42, toC)
      to(p, 'lookX', -0.9, toC)
      const down = hold(c, 0.95, 1.15, 1.9, 2.1)
      to(p, 'headNod', 0.3, down)
      to(p, 'lookY', 0.75, down)
      const chk = hold(c, 2.05, 2.25, 3.05, 3.2)
      to(p, 'headTurn', 0.12, chk)
      to(p, 'lookX', 0.3, chk)
      to(p, 'lookY', 0.25, chk)
      const env = hold(c, 3.1, 3.3, 4.25, 4.4)
      to(p, 'headTurn', 0.3, env)
      to(p, 'lookX', 0.7, env)
      to(p, 'headNod', 0.22, env)
      to(p, 'lookY', 0.55, env)
      const toS = hold(c, 4.35, 4.55, 5.4, 5.7)
      to(p, 'headTurn', 0.45, toS)
      to(p, 'lookX', 0.9, toS)
      to(p, 'headNod', 0.15, hold(c, 2.75, 2.85, 2.95, 3.05))
    },
    loop: L10,
    height: P10.hG,
    frames: F10,
    redraw,
    holdT: devHold(HOLD10),
  })
  guard.object.position.copy(gRoot)

  const courier = person({
    config: cCfg,
    dress: (k) => withHat(COURIER_CAP)(withNeck(COURIER_BAG)(k)),
    seed: 152,
    faces: [
      [0, 'happy'],
      [1.0, 'listening'],
      [2.2, 'thinking'],
      [2.9, 'happy'],
      [3.8, 'neutral'],
      [7.6, 'happy'],
    ],
    pose: cp.pose,
    loop: L10,
    height: P10.hC,
    frames: F10,
    redraw,
    holdT: devHold(HOLD10),
  })

  /* the staff member: reaches for the envelope, holds it at her chest, takes it inside */
  const restS: Arm = { s: 8, e: 12 }
  const sChestL = ik('L', shS, STAFF_CHEST)
  const sL = (c: number): Arm => {
    const w = staff10(c).walking
    let a: Arm = { s: restS.s + swing(c, w) * 0.3, e: restS.e }
    const reach = hold(c, 4.6, T10.pass[0], T10.pass[1], T10.chest[1])
    if (reach > 0) {
      const p = envPt(c)
      p.x += ENV.w / 2 - 0.01
      p.y -= 0.02
      a = mixArm(a, ik('L', shS, rigTarget(p, new THREE.Vector3(P10.staff, 0, P10.z), P10.hS, CAM10), true), reach)
    }
    a = mixArm(a, sChestL, hold(c, T10.pass[1], T10.chest[1], 6.55, 6.6))
    return a
  }
  const staff = person({
    config: sCfg,
    dress: (k) => withNeck(LANYARD(C.brand, C.brand))(withTop(BLAZER('#2E3A5C', '#1A2340'))(k)),
    seed: 153,
    faces: [
      [0, 'neutral'],
      [2.9, 'listening'],
      [4.5, 'happy'],
      [5.6, 'neutral'],
      [7.7, 'neutral'],
    ],
    pose: (p, c) => {
      const l = sL(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      const w = staff10(c).walking
      p.shoulderR = 8 - swing(c, w)
      p.elbowR = 12
      const at = staff10(c)
      walkLegs(p, c, at.walking, at.dir)
      const watch = Math.max(hold(c, -0.2, 0, 5.3, 5.5), hold(c, 7.6, 7.8, 8.2, 8.4))
      to(p, 'headTurn', -0.42, watch)
      to(p, 'lookX', -0.9, watch)
      to(p, 'lookY', 0.3, hold(c, 3.0, 3.2, 4.3, 4.5))
    },
    loop: L10,
    height: P10.hS,
    frames: F10,
    redraw,
    holdT: devHold(HOLD10),
  })
  scene.add(guard.object, courier.object, staff.object)

  const cRoot = new THREE.Vector3()
  const sRoot = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const tmp2 = new THREE.Vector3()
  const lensP = new THREE.Vector3()
  const pos = beamGeo.getAttribute('position') as THREE.BufferAttribute
  return (t: number) => {
    const c = mod(t, L10)
    const cq = frameT(c, L10, F10)
    const ca = cour10(c)
    cRoot.set(ca.x, bob(ca.walking, c), P10.z)
    courier.object.position.copy(cRoot)
    const sa = staff10(c)
    sRoot.set(sa.x, bob(sa.walking, c), P10.z)
    staff.object.position.copy(sRoot)
    guard.update(c, camera)
    courier.update(c, camera)
    staff.update(c, camera)

    /* the parcel follows the drawn hands while carried, then lies on the counter */
    const caq = cour10(cq)
    const cRootQ = new THREE.Vector3(caq.x, bob(caq.walking, cq), P10.z)
    parcelAt10(c >= T10.place[1] ? c : cq, cRootQ, camera, tmp)
    parcel.position.copy(tmp)
    parcel.visible = c < T10.away[1] || c >= 6.6
    const fk = flaps10(c)
    flapF.rotation.x = 2.2 * fk
    flapB.rotation.x = -2.2 * fk
    const sk = seal10(c)
    oldSeal.visible = sk > 0.02
    oldSeal.scale.setScalar(Math.max(0.001, sk))
    oldSeal.position.y = PARCEL.h / 2 - 0.02 + 0.05 * (1 - sk)
    tape.visible = sk > 0.5

    /* the item: out of the box, under the light, into the envelope */
    itemAt10(c, tmp)
    item.position.copy(tmp)
    item.visible = c > T10.lift[0] && c < T10.down[1] + 0.05
    const scan = hold(c, T10.scan[0], T10.scan[0] + 0.12, T10.scan[1], T10.scan[1] + 0.15)
    itemGlow.position.copy(tmp).add(new THREE.Vector3(0, 0, -0.02))
    setOp(itemGlow, 0.55 * hold(c, T10.scan[0] + 0.3, T10.scan[0] + 0.45, T10.scan[1], T10.scan[1] + 0.2))

    /* the wand and its beam */
    wandAt10(c >= T10.wand[0] && c <= T10.wand[3] + 0.05 ? cq : c, tmp2)
    wand.position.copy(tmp2)
    wand.rotation.z = 0.12 * hold(c, T10.wand[0], T10.wand[1], T10.wand[2], T10.wand[3])
    lensM.emissiveIntensity = 0.15 + 2.2 * scan
    lensM.color.set('#7DE3A2')
    wand.updateMatrixWorld()
    lensP.set(0.1, 0, 0).applyMatrix4(wand.matrixWorld)
    pos.setXYZ(0, lensP.x, lensP.y, lensP.z)
    pos.setXYZ(1, tmp.x - 0.075, tmp.y + 0.11, tmp.z + 0.004)
    pos.setXYZ(2, tmp.x - 0.075, tmp.y - 0.11, tmp.z + 0.004)
    pos.needsUpdate = true
    beamM.opacity = 0.6 * scan * (0.8 + 0.2 * Math.sin(c * TAU * 3))

    /* the envelope: flap folds, the blue seal goes on, handed over, carried in; a fresh one in the stand */
    const fold = seg(c, T10.fold[0], T10.fold[1])
    const fresh = c >= T10.restock[0] || c < T10.fold[0]
    envFlap.rotation.x = fresh ? 0 : Math.PI * fold
    const st = fresh ? 0 : seg(c, T10.stamp[0], T10.stamp[1])
    newSeal.visible = st > 0.02
    newSeal.scale.setScalar(Math.max(0.001, st))
    const staffChest = towardCamera(rigToWorld(STAFF_CHEST, P10.hS, new THREE.Vector3(staff10(cq).x, bob(staff10(cq).walking, cq), P10.z), camera, new THREE.Vector3()), camera, 0.1)
    envAt10(c >= T10.hand[0] && c < T10.restock[0] ? cq : c, staffChest, tmp)
    env.position.copy(tmp)
    const inStand = c < T10.hand[0] || c >= T10.restock[0]
    env.rotation.z = inStand ? 0 : -0.12 * seg(c, T10.hand[0], T10.hand[1])
    const fadeIn = c >= T10.restock[0] ? seg(c, T10.restock[0], T10.restock[1]) : 1
    envBodyMats.forEach((m) => {
      m.transparent = fadeIn < 1
      m.opacity = fadeIn
    })
    envFlapM.opacity = fadeIn
    env.visible = !(c > 6.5 && c < T10.restock[0])
  }
}

/* ------------------------------------------------------------------ T10 concept: the re-encrypting load balancer */

function setupT10Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E3EDFC')
  setCam(camera, CAM10C, AT10C, 40)
  lights(scene, [0, 1.0, -0.5], 2.3)
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex('#F2F6FD', '#DCE5F5', 2, [8, 6]), roughness: 0.6, emissive: new THREE.Color('#EEF3FC'), emissiveIntensity: 0.2 }), [0, 0, -0.5]))
  /* the back wall, softly lit, and a skirting */
  scene.add(box(9, 3.6, 0.1, mat('#DCE7FA', { roughness: 0.8, emissive: new THREE.Color('#DCE7FA'), emissiveIntensity: 0.55 }), [0, 1.8, -1.9]))
  scene.add(noShadow(box(9, 0.1, 0.04, mat('#C9D5EC'), [0, 0.05, -1.84])))

  /* the client: a laptop on a white pedestal where the courier stands */
  const cx = -1.15
  scene.add(box(0.5, 0.86, 0.42, WHITE_M(), [cx, 0.43, -0.4], 0.03))
  scene.add(noShadow(box(0.5, 0.03, 0.42, mat(C.brand, { roughness: 0.3 }), [cx, 0.875, -0.4], 0.01)))
  const laptop = new THREE.Group()
  laptop.position.set(cx - 0.03, 0.89, -0.42)
  laptop.rotation.y = 0.32
  laptop.add(box(0.4, 0.018, 0.27, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.009, 0], 0.008))
  const lid = new THREE.Group()
  lid.position.set(0, 0.018, -0.13)
  lid.rotation.x = -0.18
  lid.add(box(0.4, 0.27, 0.014, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.135, -0.007], 0.008))
  const scr = picture(screenTex(), 0.37, 0.24, [0, 0.135, 0.002])
  lid.add(scr)
  laptop.add(lid)
  scene.add(laptop)

  /* the rails: client -> load balancer -> server */
  const railM = mat('#AFC3E6', { roughness: 0.3, metalness: 0.5 })
  const railY = TOP10
  const rail = (x0: number, x1: number) => {
    for (const dz of [-0.06, 0.06]) scene.add(noShadow(cyl(0.008, 0.008, x1 - x0, railM, [(x0 + x1) / 2, railY - 0.008, -0.36 + dz], 10).rotateZ(Math.PI / 2)))
    scene.add(noShadow(box(x1 - x0, 0.012, 0.11, new THREE.MeshStandardMaterial({ color: '#CFE0FF', transparent: true, opacity: 0.5, roughness: 0.1 }), [(x0 + x1) / 2, railY - 0.014, -0.36])))
    for (const x of [x0 + 0.04, x1 - 0.04]) scene.add(cyl(0.012, 0.014, railY - 0.02, mat('#C9D5EC', { metalness: 0.5, roughness: 0.3 }), [x, (railY - 0.02) / 2, -0.36], 12))
  }
  rail(-0.9, -0.62)
  rail(0.62, 0.9)

  /* the load balancer: a white block with its mark, its platform on top, the check arch, the dock of new padlocks */
  scene.add(box(1.24, TOP10 - 0.04, 0.46, WHITE_M(), [0, (TOP10 - 0.04) / 2, -0.38], 0.03))
  scene.add(box(1.28, 0.04, 0.5, mat('#1F2E63', { roughness: 0.4, metalness: 0.2 }), [0, TOP10 - 0.02, -0.38], 0.01))
  const elb = picture(markTex(elbUrl, redraw), 0.3, 0.3, [0, 0.56, -0.148])
  scene.add(elb)
  const leds: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < 4; i++) {
    const m = glowM('#7FB0FF', '#C9D5EC', { emissiveIntensity: 0.4 })
    leds.push(m)
    scene.add(noShadow(box(0.05, 0.016, 0.01, m, [-0.45 + i * 0.07, 0.86, -0.148], 0.004)))
  }
  /* the arch over the check spot */
  const archM = mat('#3A4A70', { roughness: 0.35, metalness: 0.4 })
  const ax0 = -0.08
  const ax1 = 0.32
  for (const x of [ax0, ax1]) scene.add(box(0.04, 0.6, 0.06, archM, [x, TOP10 + 0.3, -0.5], 0.01))
  scene.add(box(ax1 - ax0 + 0.04, 0.05, 0.08, archM, [(ax0 + ax1) / 2, TOP10 + 0.6, -0.5], 0.01))
  const archLamp = glowM(C.green, '#E6ECF5', { emissiveIntensity: 0.2 })
  scene.add(noShadow(box(ax1 - ax0 - 0.06, 0.016, 0.05, archLamp, [(ax0 + ax1) / 2, TOP10 + 0.57, -0.47], 0.005)))
  const scanM = new THREE.MeshBasicMaterial({ color: '#2FBF63', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(ax1 - ax0 - 0.04, 0.04), scanM)
  scanPlane.renderOrder = 5
  scene.add(scanPlane)
  /* the light curtain under the lamp, fading toward the platform */
  const curtainTex = canvasTex(16, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 64)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 16, 64)
  })
  const coneM = new THREE.MeshBasicMaterial({ map: curtainTex, color: '#3CCB6E', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
  const cone = new THREE.Mesh(new THREE.PlaneGeometry(ax1 - ax0 - 0.06, 0.55), coneM)
  cone.position.set((ax0 + ax1) / 2, TOP10 + 0.29, -0.49)
  cone.renderOrder = 5
  scene.add(cone)
  /* the slot the old padlock drops into */
  scene.add(noShadow(box(0.14, 0.006, 0.05, mat('#0F1B3D'), [-0.2, TOP10 + 0.001, -0.22])))
  /* the dock of new padlocks */
  const [dx] = P10.stand
  scene.add(box(0.28, 0.05, 0.14, mat('#3A4A70', { roughness: 0.35, metalness: 0.3 }), [dx + 0.01, TOP10 + 0.025, -0.4], 0.01))
  const spare = makePadlock(C.brand, 1)
  spare.g.position.set(dx + 0.08, TOP10 + 0.09, -0.44)
  spare.g.scale.setScalar(1.0)
  spare.setOpen(1)
  scene.add(spare.g)

  /* the backend server: a rack with its mark, an intake slot on its left side, lights that work */
  const rx = 1.2
  scene.add(box(0.6, 1.72, 0.6, mat('#3A4C78', { roughness: 0.4, metalness: 0.2 }), [rx, 0.86, -0.62], 0.02))
  scene.add(picture(rackTex(), 0.52, 0.95, [rx, 0.72, -0.315]))
  scene.add(picture(markTex(serverUrl, redraw), 0.26, 0.26, [rx, 1.47, -0.315]))
  scene.add(noShadow(box(0.02, 0.26, 0.2, mat('#0F1B3D'), [rx - 0.305, TOP10 + 0.11, -0.4])))
  const rackLeds: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < 7; i++) {
    const m = glowM('#5BE08A', '#3A4A70', { emissiveIntensity: 0.3 })
    rackLeds.push(m)
    scene.add(noShadow(box(0.03, 0.02, 0.01, m, [rx + 0.18, 0.37 + i * 0.124, -0.31], 0.004)))
  }

  /* the packet and its two padlocks */
  const pk = makePacket(0.2)
  scene.add(pk.g)
  const glow = halo('#5BE08A', 0.55)
  scene.add(glow)
  const oldLock = makePadlock(C.gold, 1.15)
  scene.add(oldLock.g)
  const newLock = makePadlock(C.brand, 1.15)
  scene.add(newLock.g)

  const PY = TOP10 + 0.105
  const PZ = -0.36
  const xChk = (ax0 + ax1) / 2
  const xHome = -0.2
  const xStart = -0.8
  /* the packet's path, beat for beat with the parcel */
  const packetX = (c: number) => {
    if (c >= 7.0) return xStart
    if (c < T10.place[1]) return lerp(xStart, xHome, seg(c, T10.give[0], T10.place[1]))
    if (c < T10.lift[0]) return xHome
    if (c < T10.hand[0]) return lerp(xHome, xChk, seg(c, T10.lift[0], T10.lift[1]))
    return lerp(xChk, rx - 0.2, seg(c, T10.hand[0], T10.chest[1] + 0.1))
  }
  const lockFront = 0.1 + 0.03
  return (t: number) => {
    const c = mod(t, L10)
    const x = packetX(c)
    const appear = c >= 7.0 ? seg(c, 7.0, 7.4) : 1
    const inServer = c > T10.chest[1] + 0.1 && c < 7.0
    pk.g.position.set(x, PY, PZ)
    pk.g.scale.setScalar(Math.max(0.001, appear))
    pk.g.visible = !inServer
    /* the gold padlock: on the packet, opens, drops into the slot */
    const open = seg(c, T10.seal[0], T10.seal[1])
    const drop = seg(c, T10.flaps[0], T10.flaps[1])
    const oldOn = c >= 7.0 || c < T10.flaps[1] + 0.02
    oldLock.g.visible = oldOn && !(c >= 7.0 && appear < 0.05)
    oldLock.setOpen(c >= 7.0 ? 0 : open)
    if (c >= 7.0 || c < T10.flaps[0]) oldLock.g.position.set(x, PY - 0.02, PZ + lockFront)
    else oldLock.g.position.set(lerp(x, -0.2, drop), PY - 0.02 - 0.2 * drop * drop, PZ + lockFront + 0.1 * drop)
    oldLock.g.scale.setScalar(1.15 * Math.max(0.001, c >= 7.0 ? appear : 1 - drop * drop))
    /* the check: the arch lights green, a scan plane sweeps down over the packet */
    const scan = hold(c, T10.scan[0] - 0.1, T10.scan[0] + 0.1, T10.scan[1], T10.scan[1] + 0.15)
    archLamp.emissiveIntensity = 0.2 + 2.0 * scan
    coneM.opacity = 0.42 * scan
    const sweep = mod((c - T10.scan[0]) / 0.35, 1)
    scanPlane.position.set(xChk, TOP10 + 0.5 - 0.42 * sweep, -0.32)
    scanM.opacity = 0.6 * scan * Math.sin(sweep * Math.PI)
    glow.position.set(x, PY, PZ - 0.05)
    setOp(glow, 0.6 * hold(c, T10.scan[0] + 0.3, T10.scan[0] + 0.45, T10.scan[1], T10.scan[1] + 0.2))
    pk.bodyM.emissiveIntensity = 0.35 * scan
    /* the new blue padlock: from the dock onto the packet, the shackle snaps shut, rides on with it */
    const fly = seg(c, T10.over[0], T10.down[1])
    const shut = seg(c, T10.fold[0], T10.fold[1])
    newLock.g.visible = !(c > T10.chest[1] + 0.1 && c < 6.0)
    if (c >= 6.0) {
      /* a new one rises into the dock while the server works */
      newLock.g.position.set(dx - 0.06, TOP10 + 0.095 - 0.1 * (1 - seg(c, T10.restock[0], T10.restock[1])), -0.38)
      newLock.g.scale.setScalar(0.98 * Math.max(0.001, seg(c, T10.restock[0], T10.restock[1])))
      newLock.setOpen(1)
    } else {
      const dock = new THREE.Vector3(dx - 0.06, TOP10 + 0.095, -0.38)
      const on = new THREE.Vector3(x, PY - 0.02, PZ + lockFront)
      if (c < T10.down[1]) {
        newLock.g.position.copy(dock).lerp(on, fly)
        newLock.g.position.y += Math.sin(fly * Math.PI) * 0.16
      } else newLock.g.position.copy(on)
      newLock.g.scale.setScalar(1.15)
      newLock.setOpen(1 - shut)
      newLock.bodyM.emissiveIntensity = 0.12 + 0.8 * hold(c, T10.fold[1] - 0.05, T10.stamp[0], T10.stamp[1], T10.stamp[1] + 0.3)
    }
    /* the block's lights breathe; the rack's lights work while the packet is inside */
    leds.forEach((m, i) => (m.emissiveIntensity = 0.5 + 0.5 * Math.sin(c * TAU * 0.5 + i * 0.9)))
    const work = hold(c, T10.chest[1] + 0.05, T10.chest[1] + 0.25, 7.0, 7.4)
    rackLeds.forEach((m, i) => (m.emissiveIntensity = 0.3 + work * (1.4 + 1.2 * Math.sin(c * TAU * 2.2 + i * 1.7))))
    /* the client's screen brightens as the next packet leaves it */
    ;(scr.material as THREE.MeshBasicMaterial).color.setScalar(0.92 + 0.08 * hold(c, 7.0, 7.3, 7.9, 8.0))
  }
}

/* ================================================================== T21 · the bank's guarded key room */

const L21 = 8.5
const F21 = 128
const HOLD21 = 4.45 /* she reads her document from the open locker; the officer holds the key; its hook is empty */
const CAM21: V3 = [0.12, 1.5, 4.3]
const AT21: V3 = [0.12, 1.12, -0.6]
const P21 = {
  cust: -1.45,
  offHome: 1.72,
  offLock: -0.14,
  z: -0.25,
  hC: 1.6,
  hO: 1.74,
  wallZ: -1.0,
  colX: (i: number) => 0.3 - i * 0.38, // locker columns, right to left
  rowY: (j: number) => 0.42 + j * 0.34,
  myCol: 3,
  myRow: 2,
  doorW: 0.35,
  doorH: 0.31,
  room: { x0: 0.62, x1: 2.7, front: -0.45 },
  gate: { x0: 0.88, x1: 1.44 },
  hookX: [1.02, 1.17, 1.32],
  hookY: [1.58, 1.38, 1.18],
  cabZ: -0.95,
}
const LOCK21 = new THREE.Vector3(P21.colX(P21.myCol) + P21.doorW / 2 - 0.045, P21.rowY(P21.myRow), P21.wallZ + 0.13)
const HOOK21 = new THREE.Vector3(P21.hookX[1], P21.hookY[1] - 0.05, P21.cabZ + 0.05)
const T21 = {
  ask: [0.05, 0.3, 0.6, 0.85] as const,
  gateOpen: [0.6, 0.95] as const,
  take: [0.95, 1.2, 1.35, 1.5] as const, // reach, at the hook, key in hand, arm back
  gateClose: [1.55, 1.85] as const,
  carry: [1.7, 3.0] as const,
  unlock: [3.0, 3.15, 3.35, 3.5] as const, // to the lock, turn, out
  doorOpen: [3.45, 3.8] as const,
  use: [3.8, 4.05, 4.35, 4.8, 5.05] as const, // reach in, out to her chest, read, back in
  doorClose: [5.05, 5.3] as const,
  lock: [5.3, 5.42, 5.6, 5.72] as const,
  back: [5.75, 7.05] as const,
  gateOpen2: [7.0, 7.3] as const,
  put: [7.15, 7.4, 7.55, 7.8] as const,
  gateClose2: [7.8, 8.1] as const,
}
const OFF21: [number, number, number][] = [
  [0, 0, P21.offHome],
  [T21.carry[0], T21.carry[1], P21.offLock],
  [T21.back[0], T21.back[1], P21.offHome],
]
const off21 = (c: number) => along(c, OFF21)
const gate21 = (c: number) => Math.max(hold(c, T21.gateOpen[0], T21.gateOpen[1], T21.gateClose[0], T21.gateClose[1]), hold(c, T21.gateOpen2[0], T21.gateOpen2[1], T21.gateClose2[0], T21.gateClose2[1]))
const door21 = (c: number) => hold(c, T21.doorOpen[0], T21.doorOpen[1], T21.doorClose[0], T21.doorClose[1])
/** the key's turn in the lock, 0..1 */
const turn21 = (c: number) => Math.max(hold(c, T21.unlock[1], T21.unlock[1] + 0.12, T21.unlock[2] - 0.02, T21.unlock[2] + 0.05), hold(c, T21.lock[1], T21.lock[1] + 0.1, T21.lock[2] - 0.02, T21.lock[2] + 0.05))
/** the document: in her locker, out to her chest, read, back in */
const DOC_IN = new THREE.Vector3(P21.colX(P21.myCol), P21.rowY(P21.myRow) - 0.02, P21.wallZ + 0.0)
const DOC_HELD = new THREE.Vector3(P21.cust + 0.21, 0.93, -0.1)
function docAt21(c: number, out: THREE.Vector3) {
  const [, b, cc, d, e] = T21.use
  if (c < b || c > e) return out.copy(DOC_IN)
  if (c < cc) return out.copy(DOC_IN).lerp(DOC_HELD, seg(c, b, cc))
  if (c < d) return out.copy(DOC_HELD).setY(DOC_HELD.y + 0.01 * Math.sin((c - cc) * TAU))
  return out.copy(DOC_HELD).lerp(DOC_IN, seg(c, d, e))
}
/** the locker door's free edge (where her hand pushes it shut) */
function doorEdge21(c: number, out: THREE.Vector3) {
  const a = -100 * DEG * door21(c)
  const hx = P21.colX(P21.myCol) - P21.doorW / 2
  out.set(hx + Math.cos(a) * P21.doorW, P21.rowY(P21.myRow), P21.wallZ + 0.1 - Math.sin(a) * P21.doorW)
  return out
}

/** the locker room's walls, floor and ceiling band, shared by both cards in shape */
function lockerRoom21(scene: THREE.Scene, o: { wall: string; floor: [string, string]; band: string; glow?: number }) {
  scene.add(floorPlane(9, 6, mat('#ffffff', { map: tileTex(o.floor[0], o.floor[1], 2, [9, 6]), roughness: 0.5, emissive: new THREE.Color(o.floor[0]), emissiveIntensity: (o.glow ?? 0.2) * 0.4 }), [0, 0, 0.5]))
  scene.add(box(9, 3.4, 0.1, mat(o.wall, { roughness: 0.8, emissive: new THREE.Color(o.wall), emissiveIntensity: o.glow ?? 0.2 }), [0, 1.7, P21.wallZ - 0.12]))
  scene.add(noShadow(box(9, 0.1, 0.04, mat(o.band, { roughness: 0.6 }), [0, 0.05, P21.wallZ - 0.05])))
}

/* ------------------------------------------------------------------ T21 everyday: the bank's locker room */

function setupT21Everyday(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#EDE6DA')
  setCam(camera, CAM21, AT21, 42)
  lights(scene, [0.2, 1.0, -0.6])
  lockerRoom21(scene, { wall: '#EFE7DA', floor: ['#E7DCCB', '#D3C4AD'], band: '#8C6A48' })

  /* the locker wall: a steel cabinet of small doors; hers is hinged and opens */
  const { wallZ, doorW, doorH } = P21
  const x0 = P21.colX(7) - 0.19
  const x1 = P21.colX(0) + 0.19
  const ytop = P21.rowY(5) + 0.17
  scene.add(box(x1 - x0 + 0.06, ytop - 0.22, 0.14, mat('#8E99AD', { roughness: 0.4, metalness: 0.55 }), [(x0 + x1) / 2, (ytop + 0.22) / 2, wallZ + 0.0]))
  scene.add(box(x1 - x0 + 0.12, 0.08, 0.2, mat('#6E7A92', { roughness: 0.4, metalness: 0.5 }), [(x0 + x1) / 2, ytop + 0.04, wallZ + 0.02]))
  scene.add(box(x1 - x0 + 0.12, 0.22, 0.2, mat('#6E7A92', { roughness: 0.4, metalness: 0.5 }), [(x0 + x1) / 2, 0.11, wallZ + 0.02]))
  const doorM = mat('#C3CBD8', { roughness: 0.28, metalness: 0.7 })
  const plateM = mat('#E9D9A8', { roughness: 0.3, metalness: 0.6 })
  const holeM = mat('#1A2235', { roughness: 0.6 })
  const doorFace = (g: THREE.Group, cx: number) => {
    g.add(box(doorW, doorH, 0.016, doorM, [cx, 0, 0], 0.006))
    g.add(noShadow(box(0.07, 0.03, 0.006, plateM, [cx - doorW / 2 + 0.07, doorH / 2 - 0.05, 0.011], 0.003)))
    g.add(noShadow(cyl(0.016, 0.016, 0.01, mat('#D9BF6A', { metalness: 0.8, roughness: 0.25 }), [cx + doorW / 2 - 0.045, 0, 0.011], 18).rotateX(Math.PI / 2)))
    g.add(noShadow(box(0.006, 0.018, 0.006, holeM, [cx + doorW / 2 - 0.045, 0, 0.017])))
  }
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 6; j++) {
      if (i === P21.myCol && j === P21.myRow) continue
      const g = new THREE.Group()
      g.position.set(P21.colX(i), P21.rowY(j), wallZ + 0.078)
      doorFace(g, 0)
      scene.add(g)
    }
  /* her locker: a dark cavity behind a door hinged on the left */
  const mx = P21.colX(P21.myCol)
  const my = P21.rowY(P21.myRow)
  scene.add(noShadow(box(doorW - 0.01, doorH - 0.01, 0.01, mat('#2A3142', { roughness: 0.9 }), [mx, my, wallZ + 0.071])))
  const hinge = new THREE.Group()
  hinge.position.set(mx - doorW / 2, my, wallZ + 0.086)
  const dg = new THREE.Group()
  dg.position.x = doorW / 2
  doorFace(dg, 0)
  hinge.add(dg)
  scene.add(hinge)
  /* her document inside */
  const doc = picture(docTex(), 0.15, 0.19, [0, 0, 0], { side: THREE.DoubleSide })
  scene.add(doc)

  /* the guarded key room: a side wall, a barred front with a sliding barred gate, a header with a camera */
  const { room, gate } = P21
  const plaster = mat('#E3D6C2', { roughness: 0.85 })
  scene.add(box(0.08, 2.5, wallZ - room.front + 0.1, plaster, [room.x0, 1.25, (wallZ + room.front) / 2]))
  scene.add(box(room.x1 - room.x0, 0.36, 0.1, plaster, [(room.x0 + room.x1) / 2, 2.32, room.front]))
  scene.add(floorPlane(room.x1 - room.x0, wallZ - room.front, mat('#B9A68E', { roughness: 0.7 }), [(room.x0 + room.x1) / 2, 0.003, (wallZ + room.front) / 2]))
  scene.add(box(room.x1 - room.x0, 2.5, 0.04, mat('#5B6E8F', { roughness: 0.75, emissive: new THREE.Color('#5B6E8F'), emissiveIntensity: 0.12 }), [(room.x0 + room.x1) / 2, 1.25, wallZ - 0.02]))
  const barM = mat('#3B4458', { roughness: 0.35, metalness: 0.75 })
  const bars = (xa: number, xb: number, z: number, g?: THREE.Group, ox = 0) => {
    const tgt = g ?? scene
    for (let x = xa + 0.03; x <= xb - 0.02; x += 0.09) tgt.add(cyl(0.012, 0.012, 2.1, barM, [x - ox, 1.07, z], 10))
    for (const y of [0.08, 1.05, 2.1]) tgt.add(box(xb - xa, 0.035, 0.03, barM, [(xa + xb) / 2 - ox, y, z]))
  }
  bars(room.x0 + 0.04, gate.x0 - 0.02, room.front - 0.02)
  bars(gate.x1 + 0.02, room.x1, room.front - 0.02)
  const gateG = new THREE.Group()
  bars(gate.x0, gate.x1, 0, gateG, 0)
  gateG.add(box(0.035, 2.1, 0.035, barM, [gate.x0, 1.07, 0]))
  gateG.add(box(0.035, 2.1, 0.035, barM, [gate.x1, 1.07, 0]))
  gateG.add(box(0.05, 0.12, 0.04, mat('#C9A245', { metalness: 0.8, roughness: 0.3 }), [gate.x1 - 0.05, 1.05, 0.03]))
  gateG.position.z = room.front + 0.05
  scene.add(gateG)
  /* the gate's lamp, green while it stands open */
  const gateLamp = glowM(C.green, '#C9D1DE')
  scene.add(noShadow(box(0.12, 0.03, 0.04, gateLamp, [(gate.x0 + gate.x1) / 2, 2.17, room.front + 0.06], 0.008)))
  /* the security camera watching the gate */
  const cam = new THREE.Group()
  cam.position.set(room.x0 + 0.16, 2.08, room.front + 0.1)
  cam.add(box(0.05, 0.08, 0.05, mat('#E6EAF0', { roughness: 0.4 }), [0, 0.06, 0]))
  const camHead = new THREE.Group()
  camHead.add(box(0.18, 0.08, 0.09, mat('#F4F6F9', { roughness: 0.35 }), [0.06, 0, 0], 0.02))
  camHead.add(noShadow(cyl(0.025, 0.025, 0.02, mat('#1A2235'), [0.155, 0, 0], 16).rotateZ(Math.PI / 2)))
  const camLed = glowM('#7FB0FF', '#9AA5B8')
  camHead.add(noShadow(box(0.012, 0.012, 0.01, camLed, [0.03, 0.02, 0.046])))
  camHead.rotation.z = -0.35
  cam.add(camHead)
  scene.add(cam)
  /* the key cabinet: a board of hooks, a small brass key on each, hers in the middle */
  scene.add(box(0.56, 0.62, 0.05, mat('#7A5638', { roughness: 0.6 }), [(P21.hookX[0] + P21.hookX[2]) / 2, (P21.hookY[0] + P21.hookY[2]) / 2, P21.cabZ - 0.02], 0.02))
  scene.add(box(0.5, 0.56, 0.01, mat('#9B7350', { roughness: 0.7 }), [(P21.hookX[0] + P21.hookX[2]) / 2, (P21.hookY[0] + P21.hookY[2]) / 2, P21.cabZ + 0.008]))
  const brass = mat('#D9B04A', { roughness: 0.25, metalness: 0.85, emissive: new THREE.Color('#D9B04A'), emissiveIntensity: 0.12 })
  const makeKey = (s = 1) => {
    const k = new THREE.Group()
    k.add(new THREE.Mesh(new THREE.TorusGeometry(0.02 * s, 0.007 * s, 8, 20), brass))
    k.add(box(0.008 * s, 0.07 * s, 0.006 * s, brass, [0, -0.052 * s, 0]))
    k.add(box(0.018 * s, 0.008 * s, 0.006 * s, brass, [0.009 * s, -0.072 * s, 0]))
    k.add(box(0.014 * s, 0.008 * s, 0.006 * s, brass, [0.007 * s, -0.058 * s, 0]))
    return k
  }
  for (const hx of P21.hookX)
    for (const hy of P21.hookY) {
      scene.add(noShadow(cyl(0.006, 0.006, 0.03, mat('#C9D1DE', { metalness: 0.8 }), [hx, hy, P21.cabZ + 0.025], 8).rotateX(Math.PI / 2)))
      if (hx === HOOK21.x && hy === P21.hookY[1]) continue
      const k = makeKey(1)
      k.position.set(hx, hy - 0.022, P21.cabZ + 0.03)
      scene.add(k)
    }
  const key = makeKey(1.7)
  scene.add(key)
  const keyGlow = halo('#FFE7A0', 0.22)
  scene.add(keyGlow)
  /* a warm lamp inside the key room */
  const lamp = new THREE.PointLight(0xffe2b0, 0.6, 3)
  lamp.position.set(1.4, 2.0, -0.7)
  scene.add(lamp)

  /* people */
  const cuCfg = who(CAST_PRESETS.riya, { name: 'Customer', skinTone: 'wheatish', hair: { style: 'braid', color: 'black' }, outfit: { top: 'kurta', topColor: '#B6487A', bottom: 'salwar', bottomColor: '#F1E3C8', shoeColor: '#7A4A2A' }, accessories: { earrings: true, bindi: true, glasses: 'none', watch: true } })
  const oCfg = who(CAST_PRESETS.dev, { name: 'Bank Officer', skinTone: 'fair', hair: { style: 'sidePart', color: 'grey' }, outfit: { top: 'shirtTie', topColor: '#F2F5FA', bottom: 'trousers', bottomColor: '#2C3545', shoeColor: '#1E1E24', accentColor: '#7A2E3A' }, accessories: { glasses: 'rect', beard: 'none', watch: true } })
  const shC = buildSkin(cuCfg).shoulderHalf
  const shO = buildSkin(oCfg).shoulderHalf
  const cuRoot = new THREE.Vector3(P21.cust, 0, P21.z)
  const offLockRoot = new THREE.Vector3(P21.offLock, 0, P21.z)
  const offHomeRoot = new THREE.Vector3(P21.offHome, 0, P21.z)

  /* the officer: his left hand takes the key, carries it, works the lock, hangs it back */
  const restO: Arm = { s: 9, e: 12 }
  const carryL = ik('L', shO, { x: 168, y: 330 })
  const hookArm = ik('L', shO, rigTarget(HOOK21.clone().add(new THREE.Vector3(-0.01, 0.01, 0)), offHomeRoot, P21.hO, CAM21), true)
  const lockArm = ik('L', shO, rigTarget(LOCK21.clone().add(new THREE.Vector3(0.03, -0.01, 0)), offLockRoot, P21.hO, CAM21), true)
  const lockTurn: Arm = { s: lockArm.s + 4, e: lockArm.e - 10 }
  const oL = (c: number): Arm => {
    const w = off21(c).walking
    let a: Arm = { s: restO.s + swing(c, w), e: restO.e }
    a = mixArm(a, carryL, hold(c, T21.take[2], T21.take[3], T21.put[0], T21.put[1]))
    a = mixArm(a, hookArm, hold(c, T21.take[0], T21.take[1], T21.take[2], T21.take[3]))
    a = mixArm(a, mixArm(lockArm, lockTurn, turn21(c)), Math.max(hold(c, T21.unlock[0], T21.unlock[1], T21.unlock[2], T21.unlock[3]), hold(c, T21.lock[0], T21.lock[1], T21.lock[2], T21.lock[3])))
    a = mixArm(a, hookArm, hold(c, T21.put[0], T21.put[1], T21.put[2], T21.put[3]))
    return a
  }
  const officer = person({
    config: oCfg,
    dress: (k) => withNeck(LANYARD('#7A2E3A', C.brand))(withTop(BLAZER('#1F2E63', '#121B3D'))(k)),
    seed: 211,
    faces: [
      [0, 'listening'],
      [0.45, 'happy'],
      [1.0, 'neutral'],
      [2.9, 'thinking'],
      [3.5, 'happy'],
      [5.25, 'thinking'],
      [5.8, 'neutral'],
      [7.45, 'proud'],
      [8.1, 'listening'],
    ],
    pose: (p, c) => {
      const l = oL(c)
      p.shoulderL = l.s
      p.elbowL = l.e
      p.wristL = 25 * turn21(c)
      const at = off21(c)
      p.shoulderR = 9 - swing(c, at.walking)
      p.elbowR = 12
      walkLegs(p, c, at.walking, at.dir)
      /* to the customer as she asks, a nod; to the cabinet; to the lock and the customer; to the cabinet again */
      const toCu = Math.max(hold(c, -0.2, 0, 0.75, 0.9), hold(c, 8.1, 8.3, 8.6, 8.8))
      to(p, 'headTurn', -0.5, toCu)
      to(p, 'lookX', -0.95, toCu)
      to(p, 'headNod', 0.16, hold(c, 0.45, 0.55, 0.62, 0.75))
      const cab = Math.max(hold(c, 0.85, 1.0, 1.5, 1.7), hold(c, 7.05, 7.2, 7.8, 8.0))
      to(p, 'headTurn', 0.45, cab)
      to(p, 'lookX', 0.9, cab)
      const lk = hold(c, 2.95, 3.1, 5.7, 5.8)
      to(p, 'headTurn', -0.4, lk)
      to(p, 'lookX', -0.9, lk)
      to(p, 'lookY', 0.35, hold(c, 3.0, 3.1, 3.4, 3.5) + hold(c, 5.25, 5.35, 5.65, 5.75))
    },
    loop: L21,
    height: P21.hO,
    frames: F21,
    redraw,
    holdT: devHold(HOLD21),
  })

  /* the customer: asks, reaches into her locker, reads her document, puts it back, pushes the door shut */
  const restC: Arm = { s: 8, e: 14 }
  const askR: Arm = { s: 44, e: 30 }
  const cR = (c: number): Arm => {
    let a = mixArm(restC, askR, hold(c, T21.ask[0], T21.ask[1], T21.ask[2], T21.ask[3]))
    const reach = hold(c, T21.use[0], T21.use[1], T21.use[4] - 0.05, T21.use[4] + 0.05)
    if (reach > 0) {
      const p = docAt21(c, new THREE.Vector3())
      p.x += 0.0
      p.y -= 0.085
      a = mixArm(a, ik('R', shC, rigTarget(p, cuRoot, P21.hC, CAM21), true), reach)
    }
    const push = hold(c, T21.doorClose[0] - 0.05, T21.doorClose[0] + 0.05, T21.doorClose[1], T21.doorClose[1] + 0.15)
    if (push > 0) {
      const p = doorEdge21(c, new THREE.Vector3())
      a = mixArm(a, ik('R', shC, rigTarget(p, cuRoot, P21.hC, CAM21), true), push)
    }
    return a
  }
  const cL = (c: number): Arm => {
    const read = 0
    if (read <= 0) return restC
    const p = docAt21(c, new THREE.Vector3())
    p.x -= 0.07
    p.y -= 0.06
    return mixArm(restC, ik('L', shC, rigTarget(p, cuRoot, P21.hC, CAM21), true), read)
  }
  const customer = person({
    config: cuCfg,
    seed: 212,
    faces: [
      [0, 'happy'],
      [0.9, 'listening'],
      [3.45, 'happy'],
      [4.35, 'proud'],
      [5.05, 'happy'],
      [5.8, 'neutral'],
      [7.6, 'happy'],
    ],
    pose: (p, c) => {
      const r = cR(c)
      const l = cL(c)
      p.shoulderR = r.s
      p.elbowR = r.e
      p.shoulderL = l.s
      p.elbowL = l.e
      /* she watches the officer, her locker, her document */
      to(p, 'headTurn', 0.45, 1)
      to(p, 'lookX', 0.9, 1)
      const loc = hold(c, 3.0, 3.2, 3.95, 4.1) + hold(c, 4.95, 5.05, 5.3, 5.45)
      to(p, 'headTurn', 0.32, loc)
      to(p, 'lookX', 0.7, loc)
      to(p, 'lookY', 0.15, loc)
      const rd = hold(c, 4.25, 4.4, 4.8, 4.95)
      to(p, 'headTurn', 0.18, rd)
      to(p, 'headNod', 0.3, rd)
      to(p, 'lookY', 0.7, rd)
      to(p, 'lookX', 0.4, rd)
      to(p, 'headTilt', 4, hold(c, T21.ask[0], T21.ask[1], T21.ask[2], T21.ask[3]))
    },
    loop: L21,
    height: P21.hC,
    frames: F21,
    redraw,
    holdT: devHold(HOLD21),
  })
  customer.object.position.copy(cuRoot)
  scene.add(officer.object, customer.object)

  const oRoot = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const hand = new THREE.Vector3()
  return (t: number) => {
    const c = mod(t, L21)
    const cq = frameT(c, L21, F21)
    const at = off21(c)
    oRoot.set(at.x, bob(at.walking, c), P21.z)
    officer.object.position.copy(oRoot)
    officer.update(c, camera)
    customer.update(c, camera)
    gateG.position.x = (gate.x1 - gate.x0 + 0.04) * gate21(c)
    gateLamp.emissiveIntensity = 2.0 * gate21(c)
    camLed.emissiveIntensity = 0.8 + 0.8 * Math.sin(c * TAU * 1.2)
    camHead.rotation.y = 0.12 * Math.sin((c / L21) * TAU)
    hinge.rotation.y = -100 * DEG * door21(c)
    /* the key: on its hook, in his hand, in the lock, back on its hook */
    const aq = off21(cq)
    const rq = new THREE.Vector3(aq.x, bob(aq.walking, cq), P21.z)
    handWorld('L', shO, oL(cq), P21.hO, rq, camera, hand)
    const onHook = HOOK21.clone()
    const inHand = c > T21.take[1] + 0.05 && c < T21.put[2]
    if (!inHand) key.position.copy(onHook)
    else key.position.copy(hand).add(new THREE.Vector3(0, 0.05, 0.01))
    const toHand = seg(c, T21.take[1], T21.take[1] + 0.1)
    if (c > T21.take[1] && c < T21.take[1] + 0.1) key.position.copy(onHook).lerp(hand, toHand)
    if (c > T21.put[1] && c < T21.put[2]) key.position.copy(hand).lerp(onHook, seg(c, T21.put[1], T21.put[2]))
    key.quaternion.copy(camera.quaternion)
    key.rotateZ(inHand ? -0.6 - 1.2 * turn21(c) : 0)
    keyGlow.position.copy(key.position).add(new THREE.Vector3(0, -0.04, -0.01))
    keyGlow.quaternion.copy(camera.quaternion)
    setOp(keyGlow, 0.35 + 0.15 * Math.sin(c * TAU * 1.1))
    /* her document */
    docAt21(c > T21.use[0] && c < T21.use[4] ? cq : c, tmp)
    doc.position.copy(tmp)
    doc.quaternion.copy(camera.quaternion)
    doc.rotateZ(c > T21.use[1] && c < T21.use[4] ? -0.12 : 0)
    doc.visible = door21(c) > 0.05 || (c > T21.use[1] && c < T21.use[4])
  }
}

/* ------------------------------------------------------------------ T21 concept: the application and the KMS vault */

function setupT21Concept(kit: StageKit): Update {
  const { scene, camera, redraw } = kit
  scene.background = new THREE.Color('#E3EDFC')
  setCam(camera, [0.25, 1.3, 3.35], [0.25, 1.02, -0.6], 45)
  lights(scene, [0.2, 1.0, -0.6], 2.3)
  lockerRoom21(scene, { wall: '#DCE7FA', floor: ['#F2F6FD', '#DCE5F5'], band: '#C9D5EC', glow: 0.55 })

  /* the application: a laptop on a white pedestal where the customer stands */
  const ax = P21.cust + 0.25
  scene.add(box(0.5, 0.86, 0.42, WHITE_M(), [ax, 0.43, -0.45], 0.03))
  scene.add(noShadow(box(0.5, 0.03, 0.42, mat(C.brand, { roughness: 0.3 }), [ax, 0.875, -0.45], 0.01)))
  const laptop = new THREE.Group()
  laptop.position.set(ax, 0.89, -0.47)
  laptop.rotation.y = 0.32
  laptop.add(box(0.4, 0.018, 0.27, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.009, 0], 0.008))
  const lid = new THREE.Group()
  lid.position.set(0, 0.018, -0.13)
  lid.rotation.x = -0.18
  lid.add(box(0.4, 0.27, 0.014, mat('#B7C1D2', { roughness: 0.3, metalness: 0.6 }), [0, 0.135, -0.007], 0.008))
  const scr = picture(screenTex(), 0.37, 0.24, [0, 0.135, 0.002])
  lid.add(scr)
  const scrGlow = halo('#7FB0FF', 0.6)
  scrGlow.position.set(0, 0.135, 0.01)
  lid.add(scrGlow)
  laptop.add(lid)
  scene.add(laptop)

  /* the block's dock where her locker is, and the rail into the vault */
  const mx = P21.colX(P21.myCol) + 0.1
  const dockTop = 0.99
  const PZ = -0.55
  scene.add(box(0.3, dockTop - 0.02, 0.3, WHITE_M(), [mx, (dockTop - 0.02) / 2, PZ], 0.03))
  const dockM = glowM('#7FB0FF', '#DCE6F7', { emissiveIntensity: 0.4 })
  scene.add(noShadow(cyl(0.13, 0.13, 0.02, dockM, [mx, dockTop - 0.01, PZ], 32)))
  const railM = mat('#AFC3E6', { roughness: 0.3, metalness: 0.5 })
  const rx0 = mx + 0.15
  const rx1 = 0.7
  for (const dz of [-0.06, 0.06]) scene.add(noShadow(cyl(0.008, 0.008, rx1 - rx0, railM, [(rx0 + rx1) / 2, dockTop - 0.008, PZ + dz], 10).rotateZ(Math.PI / 2)))
  scene.add(noShadow(box(rx1 - rx0, 0.012, 0.11, new THREE.MeshStandardMaterial({ color: '#CFE0FF', transparent: true, opacity: 0.5, roughness: 0.1 }), [(rx0 + rx1) / 2, dockTop - 0.014, PZ])))
  for (const x of [rx0 + 0.25, rx1 - 0.12]) scene.add(cyl(0.012, 0.014, dockTop - 0.02, mat('#C9D5EC', { metalness: 0.5, roughness: 0.3 }), [x, (dockTop - 0.02) / 2, PZ], 12))

  /* the KMS vault: a steel body where the key room is; a round window onto the key inside; its mark above */
  const vx0 = 0.7
  const vx1 = 1.9
  const vy0 = 0.15
  const vy1 = 1.95
  const vz0 = -1.0
  const vz1 = -0.3
  const wc = new THREE.Vector2(1.17, 1.13)
  const wr = 0.34
  const steelM = mat('#C9D2E0', { roughness: 0.32, metalness: 0.35, emissive: new THREE.Color('#C9D2E0'), emissiveIntensity: 0.12 })
  const darkSteel = mat('#6E7A92', { roughness: 0.35, metalness: 0.4 })
  scene.add(box(vx1 - vx0 + 0.1, vy0, vz1 - vz0 + 0.1, darkSteel, [(vx0 + vx1) / 2, vy0 / 2, (vz0 + vz1) / 2]))
  /* the front plate with its round window cut out */
  const shape = new THREE.Shape()
  shape.moveTo(vx0, vy0)
  shape.lineTo(vx1, vy0)
  shape.lineTo(vx1, vy1)
  shape.lineTo(vx0, vy1)
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(wc.x, wc.y, wr, 0, TAU, true)
  shape.holes.push(hole)
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 48 }), steelM)
  front.position.z = vz1 - 0.08
  front.castShadow = front.receiveShadow = true
  scene.add(front)
  /* the body behind the plate: sides, top, back */
  scene.add(box(0.06, vy1 - vy0, vz1 - vz0 - 0.08, steelM, [vx0 + 0.03, (vy0 + vy1) / 2, (vz0 + vz1 - 0.08) / 2]))
  scene.add(box(0.06, vy1 - vy0, vz1 - vz0 - 0.08, steelM, [vx1 - 0.03, (vy0 + vy1) / 2, (vz0 + vz1 - 0.08) / 2]))
  scene.add(box(vx1 - vx0, 0.06, vz1 - vz0 - 0.08, steelM, [(vx0 + vx1) / 2, vy1 - 0.03, (vz0 + vz1 - 0.08) / 2]))
  /* the chamber behind the window: a dark blue drum, softly lit */
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.5, 48, 1, true), mat('#1F2E63', { side: THREE.BackSide, roughness: 0.6, emissive: new THREE.Color('#1F2E63'), emissiveIntensity: 0.35 }))
  drum.rotation.x = Math.PI / 2
  drum.position.set(wc.x, wc.y, vz1 - 0.33)
  scene.add(drum)
  scene.add(mesh(new THREE.CircleGeometry(wr, 48), mat('#18244F', { roughness: 0.7, emissive: new THREE.Color('#2D63FB'), emissiveIntensity: 0.18 }), [wc.x, wc.y, vz1 - 0.58]))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(wr + 0.02, 0.03, 16, 64), mat('#D5DCE7', { roughness: 0.22, metalness: 0.85 }))
  ring.position.set(wc.x, wc.y, vz1 + 0.02)
  scene.add(ring)
  const glass = new THREE.Mesh(new THREE.CircleGeometry(wr, 48), new THREE.MeshStandardMaterial({ color: '#CFE6FF', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false }))
  glass.position.set(wc.x, wc.y, vz1 + 0.01)
  scene.add(glass)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    scene.add(noShadow(cyl(0.016, 0.016, 0.02, mat('#8E99AD', { metalness: 0.8, roughness: 0.3 }), [wc.x + Math.cos(a) * (wr + 0.08), wc.y + Math.sin(a) * (wr + 0.08), vz1 + 0.02], 12).rotateX(Math.PI / 2)))
  }
  /* the locking wheel on the right of the door */
  const wheel = new THREE.Group()
  wheel.position.set(1.68, 1.13, vz1 + 0.04)
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 12, 40), mat('#D5DCE7', { metalness: 0.85, roughness: 0.22 })))
  for (let i = 0; i < 3; i++) {
    const s = box(0.22, 0.016, 0.016, mat('#D5DCE7', { metalness: 0.85, roughness: 0.22 }), [0, 0, 0])
    s.rotation.z = (i / 3) * Math.PI
    wheel.add(s)
  }
  wheel.add(cyl(0.03, 0.03, 0.03, mat('#8E99AD', { metalness: 0.8 }), [0, 0, 0], 16).rotateX(Math.PI / 2))
  scene.add(wheel)
  scene.add(picture(markTex(kmsUrl, redraw), 0.3, 0.3, [wc.x, 1.7, vz1 + 0.03]))
  /* the slot in the vault's left side where the rail goes in */
  scene.add(noShadow(box(0.012, 0.26, 0.2, mat('#0F1B3D'), [vx0 - 0.001, dockTop + 0.11, PZ])))

  /* the key inside, on its cradle; it glows and turns when it works, and never leaves */
  const keyG = new THREE.Group()
  const gold = mat('#F2C14E', { roughness: 0.22, metalness: 0.75, emissive: new THREE.Color('#F2C14E'), emissiveIntensity: 0.35 })
  keyG.add(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.016, 12, 28), gold))
  keyG.add(box(0.15, 0.022, 0.018, gold, [0.115, 0, 0]))
  keyG.add(box(0.022, 0.04, 0.018, gold, [0.165, -0.025, 0]))
  keyG.add(box(0.018, 0.03, 0.018, gold, [0.13, -0.02, 0]))
  const kx = 1.24
  const ky = 1.24
  const kz = vz1 - 0.3
  keyG.position.set(kx, ky, kz)
  scene.add(keyG)
  scene.add(noShadow(box(0.2, 0.025, 0.08, mat('#3A4A70', { metalness: 0.5, roughness: 0.3 }), [kx + 0.08, ky - 0.065, kz])))
  const keyGlow = halo('#FFD873', 0.45)
  keyGlow.position.set(kx + 0.06, ky, kz + 0.05)
  scene.add(keyGlow)
  const beamM = new THREE.MeshBasicMaterial({ color: '#FFD873', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 10), beamM)
  beam.renderOrder = 5
  scene.add(beam)
  /* the padlock's rest inside the vault, under the key */
  scene.add(noShadow(box(0.16, 0.02, 0.08, mat('#3A4A70', { metalness: 0.5, roughness: 0.3 }), [kx + 0.08, 0.93, kz])))

  /* the data block and its padlock */
  const pk = makePacket(0.2)
  scene.add(pk.g)
  const useGlow = halo('#7FB0FF', 0.6)
  scene.add(useGlow)
  const lock = makePadlock(C.brand, 1.15)
  scene.add(lock.g)

  const PY = dockTop + 0.105
  const xIn = 1.08
  const T = {
    ask: [0.0, 0.8] as const,
    in1: [1.1, 2.15] as const,
    unlock: [2.25, 2.45, 2.62, 2.9] as const, // key works, shackle up, padlock to its rest
    out1: [2.95, 3.8] as const,
    use: [3.8, 5.0] as const,
    in2: [5.0, 5.85] as const,
    lock: [5.95, 6.25, 6.45, 6.6] as const, // key works, padlock up onto the block, shackle shut
    out2: [6.65, 7.5] as const,
  }
  const blockX = (c: number) => {
    if (c < T.in1[0]) return mx
    if (c < T.out1[0]) return lerp(mx, xIn, seg(c, T.in1[0], T.in1[1]))
    if (c < T.in2[0]) return lerp(xIn, mx, seg(c, T.out1[0], T.out1[1]))
    if (c < T.out2[0]) return lerp(mx, xIn, seg(c, T.in2[0], T.in2[1]))
    return lerp(xIn, mx, seg(c, T.out2[0], T.out2[1]))
  }
  const rest = new THREE.Vector3(kx + 0.06, 0.99, kz + 0.02)
  return (t: number) => {
    const c = mod(t, L21)
    const x = blockX(c)
    const lift = 0.03 * hold(c, 0.2, 0.5, 0.8, 1.1)
    pk.g.position.set(x, PY + lift, PZ)
    /* the application asks, then uses the data (its screen and the block glow), never holding the key */
    const ask = hold(c, T.ask[0], 0.2, 0.6, T.ask[1])
    const use = hold(c, T.use[0], T.use[0] + 0.2, T.use[1] - 0.2, T.use[1])
    setOp(scrGlow, 0.45 * ask + 0.6 * use)
    ;(scr.material as THREE.MeshBasicMaterial).color.setScalar(0.9 + 0.1 * Math.max(ask, use))
    pk.bodyM.emissiveIntensity = 0.45 * use
    useGlow.position.set(x, PY, PZ - 0.06)
    setOp(useGlow, 0.5 * use)
    dockM.emissiveIntensity = 0.4 + 0.5 * use + 0.3 * ask
    /* the key works: glows, turns a quarter, a beam to the padlock */
    const work = Math.max(hold(c, T.unlock[0], T.unlock[1], T.unlock[2], T.unlock[3]), hold(c, T.lock[0], T.lock[1], T.lock[2], T.lock[3]))
    gold.emissiveIntensity = 0.35 + 0.9 * work
    setOp(keyGlow, 0.45 + 0.12 * Math.sin(c * TAU * 0.8) + 0.4 * work)
    keyG.rotation.x = 0.85 * work
    keyG.rotation.z = -0.3 * work
    keyG.position.y = ky + 0.008 * Math.sin(c * TAU * 0.6)
    /* the padlock: on the block (closed), opened inside, waits at its rest, comes back on and shuts */
    let lp: THREE.Vector3
    let open = 0
    if (c < T.unlock[1] || c >= T.lock[3]) {
      lp = new THREE.Vector3(x, PY - 0.02, PZ + 0.13)
      open = c >= T.lock[3] ? 1 - seg(c, T.lock[2], T.lock[3]) : 0
    } else if (c < T.unlock[3]) {
      open = seg(c, T.unlock[1], T.unlock[2])
      lp = new THREE.Vector3(x, PY - 0.02, PZ + 0.13).lerp(rest, seg(c, T.unlock[2], T.unlock[3]))
    } else if (c < T.lock[1]) {
      open = 1
      lp = rest.clone()
    } else {
      open = 1 - seg(c, T.lock[2], T.lock[3])
      lp = rest.clone().lerp(new THREE.Vector3(x, PY - 0.02, PZ + 0.13), seg(c, T.lock[1], T.lock[2]))
    }
    lock.g.position.copy(lp)
    lock.setOpen(open)
    lock.bodyM.emissiveIntensity = 0.12 + 0.7 * work
    const a = new THREE.Vector3(kx + 0.12, ky - 0.02, kz + 0.02)
    const b = lp.clone()
    beam.position.copy(a).add(b).multiplyScalar(0.5)
    beam.scale.y = Math.max(0.001, a.distanceTo(b))
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    beamM.opacity = 0.55 * work
    wheel.rotation.z = 0.25 * Math.sin((c / L21) * TAU)
  }
}

/* ------------------------------------------------------------------ exports */

type Fig = { step?: number }
const card = (setup: (k: StageKit) => Update, holdT: number) => {
  const F = ({ step = 0 }: Fig) => (
    <div style={{ width: W, height: H, display: 'grid', placeItems: 'center' }}>
      <ThreeStage w={W} h={H} step={step} holdT={holdT} setup={setup} />
    </div>
  )
  return F as unknown as (p: Record<string, unknown>) => ReactNode
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  I_T10Everyday: card(setupT10Everyday, devHold(HOLD10)),
  I_T10Concept: card(setupT10Concept, devHold(HOLD10)),
  I_T21Everyday: card(setupT21Everyday, devHold(HOLD21)),
  I_T21Concept: card(setupT21Concept, devHold(HOLD21)),
}
export const css = ''
