import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, loopCls, loopVars, type Pt } from '@/engine/figkit'
import { TILE_SKIN } from '@/decks/figures/card'
import ecrMark from '../images/aws-ecr.svg'
import pgMark from '../images/tech-postgresql.svg'

/*
 * SESSION 19 · SECTION 5 (Multi-Container Apps & Registries) technical figures, builder F.
 * Built to generate-slides standing corrections 13-18 and cloud course R7-R15: 3D icons on plinth tiles, official marks
 * on white tiles (the marks never move), >= 20 px equal padding, orthogonal wires computed from the same constants as
 * the boxes, a flow dot on every live wire, the lit item walking (starting on the LAST item) after the build. Loops are
 * transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing moving.
 * Class prefix `s19f-`.
 *
 *   slide 42 F_T18   566 x 380  three-box map: Compose file -> web, db (1); laptop <-> Amazon ECR, push and pull (2);
 *                               an image with its tag `v1` locked by a padlock (3)
 *   slide 43 F_T19   526 x 380  compose.yaml branching into `web` and `db` inside one dashed Application outline: web
 *                               names a build context, db an image (1); the compose.yaml file itself (2)
 *   slide 44 F_T19B  526 x 380  the same, a terminal beside it: `docker compose up -d` starts both services together (1);
 *                               `docker compose down` stops and removes the whole group (2)
 *   slide 46 F_T20   566 x 380  `web` and `db` in one dashed Default Network oval (1); web reaches db at `db:5432` (2)
 *   slide 47 F_T20B  566 x 380  the same network: depends_on starts db first, web waits for it to be healthy (1); a
 *                               custom network isolates another service, the path into it blocked (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19f')
const BLUE = colors.brand
const GREEN = colors.success
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.34)'

const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size: number, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap' })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period = 2200) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const st = Number(p.step ?? 0)
  const step = held ? cnt : st
  const raw = useHot(cnt, st, period)
  const hot = raw >= 0 && st >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && st >= cnt }
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or an official mark) on its plinth, the TILE centred on (x, y), an optional tag under it */
function Node({ x, y, label, labelMono = false, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, delay = 0, z = 3 }: { x: number; y: number; label?: string; labelMono?: boolean; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; delay?: number; z?: number }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
  )
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{tile}</div>
      {label && <span style={{ ...(labelMono ? mono(tagSize) : tag(tagSize)), marginTop: 6 }}>{label}</span>}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) */
function Disc({ x, y, on = true, size = 28, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {cross ? <OrangeCross size={size - 4} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class; nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer (z 2), under the tiles (z 3) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a white card at (x, y, w, h) that rings orange while lit; children placed in FRAME coordinates */
function Card({ x, y, w, h, lit = false, on = true, delay = 0, children }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; delay?: number; children?: ReactNode }) {
  const instant = useInstant()
  return (
    <>
      <Show on={on} delay={delay} style={{ ...box(x, y, w, h), zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, ...TILE_SKIN, boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 12px 26px -14px rgba(255,138,61,0.6)` : (TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      </Show>
      {children}
    </>
  )
}

/** a dashed outline (an application group or a network) as a root svg; stroke rings orange while lit */
function Outline({ x, y, w, h, r, lit = false, on = true, color = '#9DB6EE' }: { x: number; y: number; w: number; h: number; r: number; lit?: boolean; on?: boolean; color?: string }) {
  const instant = useInstant()
  return (
    <svg aria-hidden width={w + 4} height={h + 4} style={{ position: 'absolute', left: x - 2, top: y - 2, zIndex: 0, overflow: 'visible', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
      <rect x={2} y={2} width={w} height={h} rx={r} fill="rgba(232,240,255,0.55)" stroke={lit ? ORANGE : color} strokeWidth={lit ? 2.6 : 1.8} strokeDasharray="7 6" style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
    </svg>
  )
}

/** a status light (grey, green when `on`); `blink` a quiet opacity loop on the green dot */
function Light({ x, y, on, blink = true, cls }: { x: number; y: number; on: boolean; blink?: boolean; cls?: string }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - 7, top: y - 7, width: 14, height: 14, zIndex: 6 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#C9D3E6', boxShadow: 'inset 0 0 0 1.5px #FFFFFF, 0 2px 5px -2px rgba(31,64,140,0.5)' }} />
      <span style={{ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <span className={cls ?? (blink ? loopCls('glow') : undefined)} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: GREEN, boxShadow: `inset 0 0 0 1.5px #FFFFFF, 0 0 0 4px ${GREEN}2e`, ...loopVars(0, 2.2) }} />
      </span>
    </span>
  )
}

/* ================================================================== slide 42 · F_T18 · the three-box map */

/*
 * 566 x 380. Three cards, one per point, 162 x 340 at x 20 / 202 / 384 (gaps 20, padding 20). Every card: a header
 * (y 58), its subject tile (cy 135), and what the point adds (cy 270).
 *   Compose: the compose file (doc) branching at a junction (y 205) into `web` (webpage) and `db` (PostgreSQL), web -> db.
 *   Registry: the Amazon ECR mark over the laptop; push rides up the left lane (upload), pull down the right (download).
 *   Tagging: an image tile and, hanging from it, the tag `v1` locked by a padlock badge.
 */
const M = { W: 566, H: 380, CW: 162, CY: 20, CH: 340, HY: 58, TY: 135, BY: 270, TS: 56, SS: 48, JY: 205, PER: 3.4 }
const M_X = [20, 202, 384]
const M_CX = M_X.map((x) => x + M.CW / 2) // 101, 283, 465
/* card 1: compose -> web, db */
const C1 = { web: M_X[0] + 20 + M.SS / 2, db: M_X[0] + M.CW - 20 - M.SS / 2 } // 64, 138
const M_BR: Pt[][] = [
  [[M_CX[0], M.TY + M.TS / 2], [M_CX[0], M.JY], [C1.web, M.JY], [C1.web, M.BY - M.SS / 2]],
  [[M_CX[0], M.TY + M.TS / 2], [M_CX[0], M.JY], [C1.db, M.JY], [C1.db, M.BY - M.SS / 2]],
]
const M_LINK: Pt[] = [[C1.web + M.SS / 2, M.BY], [C1.db - M.SS / 2, M.BY]]
/* card 2: laptop <-> registry, two lanes */
const LANE = 16
const M_PUSH: Pt[] = [[M_CX[1] - LANE, M.BY - M.TS / 2], [M_CX[1] - LANE, M.TY + M.TS / 2]]
const M_PULL: Pt[] = [[M_CX[1] + LANE, M.TY + M.TS / 2], [M_CX[1] + LANE, M.BY - M.TS / 2]]
/* card 3: image -> tag string */
const TAG_S = 60
const M_STR: Pt[] = [[M_CX[2], M.TY + M.TS / 2 + 30], [M_CX[2], M.BY - TAG_S / 2]]
const M_R = {
  br: M_BR.map((pts, i) => K.ride(`m-br${i}`, pts, 0.1 + i * 0.25, 1.4 + i * 0.25, M.PER)),
  link: K.ride('m-link', M_LINK, 1.8, 2.6, M.PER),
  push: K.ride('m-push', M_PUSH, 0.1, 1.5, M.PER),
  pull: K.ride('m-pull', M_PULL, 1.8, 3.2, M.PER),
}

const F_T18: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const head = (i: number, text: string) => (
    <Show on={s(i + 1)} style={{ ...box(M_X[i], M.HY, M.CW, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
      <span style={heading(16, colors.brandDeep)}>{text}</span>
    </Show>
  )
  return (
    <Frame w={M.W} h={M.H}>
      {M_X.map((x, i) => <Card key={i} x={x} y={M.CY} w={M.CW} h={M.CH} on={s(i + 1)} lit={hot === i} />)}
      {/* 1 · Docker Compose: one file defining several linked services */}
      {head(0, 'Compose')}
      <Node x={M_CX[0]} y={M.TY} icon="doc" size={M.TS} on={s(1)} lit={hot === 0} loop="bob" />
      {M_BR.map((pts, i) => <W key={i} pts={pts} head={9} on={s(1)} lit={hot === 0} delay={200 + i * 140} />)}
      <Junction x={M_CX[0]} y={M.JY} on={s(1)} lit={hot === 0} />
      <Node x={C1.web} y={M.BY} icon="webpage" size={M.SS} label="web" labelMono w={70} on={s(1)} delay={300} loop="float" d={0.4} />
      <Node x={C1.db} y={M.BY} mark={pgMark} size={M.SS} label="db" labelMono w={70} on={s(1)} delay={420} />
      <W pts={M_LINK} head={8} on={s(1)} lit={hot === 0} delay={700} />
      {M_R.br.map((c, i) => <Token key={i} cls={c} size={9} on={s(1)} />)}
      <Token cls={M_R.link} size={8} on={s(1)} />
      {/* 2 · Push and pull: moving an image to and from a registry */}
      {head(1, 'Registry')}
      <Node x={M_CX[1]} y={M.TY} mark={ecrMark} size={M.TS} on={s(2)} lit={hot === 1} />
      <Node x={M_CX[1]} y={M.BY} icon="laptop" size={M.TS} label="Laptop" on={s(2)} lit={hot === 1} loop="bob" d={0.6} />
      <W pts={M_PUSH} head={9} on={s(2)} lit={hot === 1} delay={200} />
      <W pts={M_PULL} head={9} on={s(2)} lit={hot === 1} delay={360} />
      <Rider cls={M_R.push} icon="upload" size={24} on={s(2)} />
      <Rider cls={M_R.pull} icon="download" size={24} on={s(2)} />
      {/* 3 · Tagging strategy: naming versions so the right build is found */}
      {head(2, 'Tagging')}
      <Node x={M_CX[2]} y={M.TY} icon="image" size={M.TS} label="Image" on={s(3)} lit={hot === 2} loop="float" d={0.2} />
      <W pts={M_STR} head={0} width={2} on={s(3)} lit={hot === 2} delay={200} />
      <Node x={M_CX[2]} y={M.BY} icon="tag" size={TAG_S} k={0.72} badge="lock" label="v1" labelMono w={80} on={s(3)} lit={hot === 2} loop="swing" t={3} delay={260} />
    </Frame>
  )
}

/* ================================================================== slides 43-44 · F_T19 / F_T19B · compose.yaml -> web, db */

/*
 * 526 x 380. The dashed Application outline x 20..506, y 120..360 (tag `Application` top left inside it), two cards
 * inside, 213 x 180 at y 160 (web x 40, db x 273). Each card: its service name (mono, y +20), the service's own tile
 * (left, cx - 52) and what it is made from (right, cx + 52): `web` a build-context folder (Build), `db` an image (Image).
 * The compose.yaml tile at the top (cy 48), wires to both cards through a junction at y 104.
 *   T19:  compose.yaml with its name centred as a group (tile x 203).
 *   T19B: compose.yaml at x 70, a terminal at the top right (x 262..506) with the two Compose commands; both cards carry
 *         a status light. Up: both lights green, tokens ride; down: the whole group fades out together.
 */
const C = { W: 526, H: 380, OX: 20, OY: 120, OW: 486, OH: 240, CY: 160, CW: 213, CH: 180, TS: 56, IS: 60, JY: 104, PER: 3.2 }
const C_X = [40, 273]
const C_CX = C_X.map((x) => x + C.CW / 2) // 146.5, 379.5
const C_IY = C.CY + 102 // tiles' centre, 262
const C_WIRES = (cx: number): Pt[][] => [
  [[cx, 76], [cx, C.JY], [C_CX[0], C.JY], [C_CX[0], C.CY]],
  [[cx, 76], [cx, C.JY], [C_CX[1], C.JY], [C_CX[1], C.CY]],
]
const C_W19 = C_WIRES(203)
const C_W19B = C_WIRES(70)
const C_R19 = C_W19.map((pts, i) => K.ride(`c19-${i}`, pts, 0.1 + i * 0.3, 1.6 + i * 0.3, C.PER))
const C_R19B = C_W19B.map((pts, i) => K.ride(`c19b-${i}`, pts, 0.1 + i * 0.3, 1.6 + i * 0.3, C.PER))

function ComposeTile({ x, lit, glow = false }: { x: number; lit: boolean; glow?: boolean }) {
  return (
    <div style={{ ...box(x - C.TS / 2, 20, 260, C.TS), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Plinth size={C.TS} lit={lit}><Ico3D name="doc" size={Math.round(C.TS * 0.74)} loop={glow ? 'pulse' : 'bob'} t={2.6} /></Plinth>
      <span style={mono(15)}>compose.yaml</span>
    </div>
  )
}

function Services({ sub, hotSub = false, lights, stopped = false }: { sub: boolean; hotSub?: boolean; lights?: boolean; stopped?: boolean }) {
  const instant = useInstant()
  const svc = [
    { name: 'web', main: <Plinth size={C.IS}><Ico3D name="webpage" size={Math.round(C.IS * 0.74)} loop="float" d={0.3} /></Plinth>, icon: 'folder' as Ico3DName, label: 'Build' },
    { name: 'db', main: <MarkTile src={pgMark} size={C.IS} />, icon: 'image' as Ico3DName, label: 'Image' },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: stopped ? 0.32 : 1, transition: instant ? 'none' : `opacity 620ms ${EASE}` }}>
      <Outline x={C.OX} y={C.OY} w={C.OW} h={C.OH} r={22} />
      <span style={{ ...tag(14, colors.brandDark), position: 'absolute', left: C.OX + 20, top: C.OY + 10, zIndex: 3 }}>Application</span>
      {svc.map((v, i) => (
        <div key={v.name}>
          <Card x={C_X[i]} y={C.CY} w={C.CW} h={C.CH} />
          <span style={{ ...mono(18), position: 'absolute', left: C_X[i], width: C.CW, top: C.CY + 20, textAlign: 'center', zIndex: 3 }}>{v.name}</span>
          <div style={{ ...box(C_CX[i] - 52 - C.IS / 2, C_IY - C.IS / 2, C.IS, C.IS), zIndex: 3, display: 'grid', placeItems: 'center' }}>{v.main}</div>
          <Node x={C_CX[i] + 52} y={C_IY} icon={v.icon} size={C.IS} label={v.label} w={90} on={sub} lit={hotSub} loop="bob" d={0.5 + i * 0.4} delay={i * 160} />
          {lights !== undefined && <Light x={C_X[i] + C.CW - 22} y={C.CY + 22} on={lights} cls={lights ? `s19f-glow${i}` : undefined} />}
        </div>
      ))}
    </div>
  )
}

const F_T19: Fig = (p) => {
  const { hot, s } = useBuild(p)
  return (
    <Frame w={C.W} h={C.H}>
      <Services sub={s(1)} hotSub={hot === 0} />
      <ComposeTile x={203} lit={hot === 1} glow={s(2)} />
      {C_W19.map((pts, i) => <W key={i} pts={pts} head={9} lit={hot === 1} />)}
      <Junction x={203} y={C.JY} lit={hot === 1} />
      {C_R19.map((c, i) => <Token key={i} cls={c} size={9} on={s(2)} />)}
    </Frame>
  )
}

/** the terminal with the two Compose commands; a line arrives with its press and rings while lit */
function Terminal({ x, y, w, lines }: { x: number; y: number; w: number; lines: { text: string; icon: Ico3DName; on: boolean; lit: boolean }[] }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(x, y, w, 72), zIndex: 3, borderRadius: 14, background: 'linear-gradient(180deg, #16264A 0%, #0E1A36 100%)', boxShadow: '0 14px 26px -16px rgba(8,16,38,0.8), inset 0 0 0 1.5px #2A3F6E', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((l) => (
        <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, borderRadius: 8, padding: '0 8px', opacity: l.on ? 1 : 0, transform: l.on ? 'none' : 'translateY(4px)', boxShadow: l.lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 2px rgba(255,138,61,0)', transition: instant ? 'none' : `opacity 520ms ${EASE}, transform 520ms ${EASE}, box-shadow 420ms ${EASE}` }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, background: '#FFFFFF', flexShrink: 0 }}><Ico3D name={l.icon} size={19} loop="pulse" t={2.4} /></span>
          <span style={mono(14, '#E6EEFF')}><span style={{ color: '#7FA3FF' }}>$ </span>{l.text}</span>
        </div>
      ))}
    </div>
  )
}

const F_T19B: Fig = (p) => {
  const { hot, s, held } = useBuild(p, 2600)
  const stopped = !held && hot === 1
  const running = s(1) && !stopped
  return (
    <Frame w={C.W} h={C.H}>
      <Services sub lights={running} stopped={stopped} />
      <ComposeTile x={70} lit={false} glow={running} />
      {C_W19B.map((pts, i) => <W key={i} pts={pts} head={9} opacity={stopped ? 0.35 : 1} />)}
      <Junction x={C_CX[0]} y={C.JY} />
      {C_R19B.map((c, i) => <Token key={i} cls={c} size={9} on={running} />)}
      <Terminal x={236} y={20} w={270} lines={[
        { text: 'docker compose up -d', icon: 'play', on: s(1), lit: hot === 0 },
        { text: 'docker compose down', icon: 'stop', on: s(2), lit: hot === 1 },
      ]} />
    </Frame>
  )
}

/* ================================================================== slides 46-47 · F_T20 / F_T20B · one network, service names */

/*
 * F_T20 566 x 380: the Default Network oval x 20..546, y 40..340 (dashed, r 70), its tag row at the top (link icon +
 * `Default Network`, y 60). `web` (x 70) and `db` (x 336) cards 160 x 170 at y 128; web -> db on y 205 (request),
 * db -> web on y 240 (answer), `db:5432` with a globe over the request wire.
 * F_T20B 566 x 380: the same network narrowed to x 20..376 (cards 130 x 130 at y 106, web x 40, db x 226) so a Custom
 * Network (x 396..546) fits beside it. depends_on: a wire from db's foot round to web's foot (db starts first), its
 * tag under it; status lights come on db first, web after; a heartbeat on db (service_healthy). The custom network holds
 * one service (container), the path into it from db dashed and crossed.
 */
const N = { W: 566, H: 380, PER: 3.0 }
const N1 = { OX: 20, OY: 40, OW: 526, OH: 300, CW: 160, CH: 170, CY: 128, WX: 70, DX: 336, IS: 68, RQ: 205, RS: 240 }
const N1_REQ: Pt[] = [[N1.WX + N1.CW, N1.RQ], [N1.DX, N1.RQ]]
const N1_RES: Pt[] = [[N1.DX, N1.RS], [N1.WX + N1.CW, N1.RS]]
const N1_R = [K.ride('n1-q', N1_REQ, 0.1, 1.2, N.PER), K.ride('n1-a', N1_RES, 1.5, 2.6, N.PER)]

const N2 = { OX: 20, OY: 40, OW: 356, OH: 300, CW: 130, CH: 130, CY: 106, WX: 40, DX: 226, IS: 56, RQ: 160, RS: 186, DY: 268, NX: 396, NY: 90, NW: 150, NH: 200 }
const N2_REQ: Pt[] = [[N2.WX + N2.CW, N2.RQ], [N2.DX, N2.RQ]]
const N2_RES: Pt[] = [[N2.DX, N2.RS], [N2.WX + N2.CW, N2.RS]]
const N2_DEP: Pt[] = [[N2.DX + N2.CW / 2, N2.CY + N2.CH], [N2.DX + N2.CW / 2, N2.DY], [N2.WX + N2.CW / 2, N2.DY], [N2.WX + N2.CW / 2, N2.CY + N2.CH]]
const N2_BLOCK: Pt[] = [[N2.DX + N2.CW, 171], [N2.NX, 171]]
const N2_R = [K.ride('n2-q', N2_REQ, 0.1, 1.0, N.PER), K.ride('n2-a', N2_RES, 1.3, 2.2, N.PER)]
const N2_RD = K.ride('n2-dep', N2_DEP, 0.2, 1.8, 3.6)

function SvcCard({ x, y, w, h, name, main, lit = false, light, lightCls }: { x: number; y: number; w: number; h: number; name: string; main: ReactNode; lit?: boolean; light?: boolean; lightCls?: string }) {
  return (
    <>
      <Card x={x} y={y} w={w} h={h} lit={lit} />
      <span style={{ ...mono(17), position: 'absolute', left: x, width: w, top: y + 20, textAlign: 'center', zIndex: 3 }}>{name}</span>
      <div style={{ ...box(x, y + 50, w, h - 70), zIndex: 3, display: 'grid', placeItems: 'center' }}>{main}</div>
      {light !== undefined && <Light x={x + w - 20} y={y + 20} on={light} cls={lightCls} />}
    </>
  )
}

function NetTag({ cx, y, label, icon, on = true, lit = false }: { cx: number; y: number; label: string; icon: Ico3DName; on?: boolean; lit?: boolean }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: cx - 120, width: 240, top: y, zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Plinth size={32} lit={lit}><Ico3D name={icon} size={24} loop="pulse" t={2.8} /></Plinth>
      <span style={tag(15, colors.brandDark)}>{label}</span>
    </Show>
  )
}

const webMain = (size: number) => <Plinth size={size}><Ico3D name="webpage" size={Math.round(size * 0.74)} loop="float" d={0.3} /></Plinth>
const dbMain = (size: number) => <MarkTile src={pgMark} size={size} />

const F_T20: Fig = (p) => {
  const { hot, s } = useBuild(p)
  return (
    <Frame w={N.W} h={N.H}>
      {/* 1 · the default network every service joins */}
      <Outline x={N1.OX} y={N1.OY} w={N1.OW} h={N1.OH} r={70} on={s(1)} lit={hot === 0} />
      <NetTag cx={N.W / 2} y={N1.OY + 18} label="Default Network" icon="link" on={s(1)} lit={hot === 0} />
      <SvcCard x={N1.WX} y={N1.CY} w={N1.CW} h={N1.CH} name="web" main={webMain(N1.IS)} />
      <SvcCard x={N1.DX} y={N1.CY} w={N1.CW} h={N1.CH} name="db" main={dbMain(N1.IS)} />
      {/* 2 · the service name is the host name: web reaches db at db:5432 */}
      <Show on={s(2)} style={{ position: 'absolute', left: N1.WX + N1.CW, width: N1.DX - N1.WX - N1.CW, top: N1.RQ - 46, height: 30, zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: '#FFFFFF', boxShadow: hot === 1 ? `inset 0 0 0 2px ${ORANGE}` : RIM }}><Ico3D name="globe" size={22} loop="spin" t={6} /></span>
        <span style={mono(15)}>db:5432</span>
      </Show>
      <W pts={N1_REQ} head={9} on={s(2)} lit={hot === 1} />
      <W pts={N1_RES} head={9} on={s(2)} lit={hot === 1} delay={200} opacity={0.6} />
      <Token cls={N1_R[0]} size={10} on={s(2)} />
      <Token cls={N1_R[1]} size={9} tone={colors.teal} on={s(2)} />
    </Frame>
  )
}

const F_T20B: Fig = (p) => {
  const { hot, s, held } = useBuild(p)
  const order = s(1) && !held
  return (
    <Frame w={N.W} h={N.H}>
      <Outline x={N2.OX} y={N2.OY} w={N2.OW} h={N2.OH} r={60} />
      <NetTag cx={N2.OX + N2.OW / 2} y={N2.OY + 16} label="Default Network" icon="link" />
      <SvcCard x={N2.WX} y={N2.CY} w={N2.CW} h={N2.CH} name="web" main={webMain(N2.IS)} light={s(1)} lightCls={order ? 's19f-seq1' : undefined} />
      <SvcCard x={N2.DX} y={N2.CY} w={N2.CW} h={N2.CH} name="db" main={dbMain(N2.IS)} light={s(1)} lightCls={order ? 's19f-seq0' : undefined} />
      <W pts={N2_REQ} head={8} />
      <W pts={N2_RES} head={8} delay={200} opacity={0.6} />
      <Token cls={N2_R[0]} size={9} />
      <Token cls={N2_R[1]} size={8} tone={colors.teal} />
      {/* 1 · depends_on: db starts first; service_healthy waits for it to be ready */}
      <W pts={N2_DEP} head={9} on={s(1)} lit={hot === 0} />
      <Rider cls={N2_RD} icon="power" size={22} on={s(1)} />
      <Disc x={N2.DX + 18} y={N2.CY + 18} icon="heartbeat" size={28} on={s(1)} loop="beat" t={1.4} />
      <Show on={s(1)} style={{ position: 'absolute', left: N2.OX, width: N2.OW, top: N2.DY + 12, height: 34, zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <Plinth size={32} lit={hot === 0}><Ico3D name="hourglass" size={24} loop="tilt" t={3} /></Plinth>
        <span style={mono(15)}>depends_on</span>
      </Show>
      {/* 2 · a custom network isolates a group of services from the rest */}
      <Outline x={N2.NX} y={N2.NY} w={N2.NW} h={N2.NH} r={36} on={s(2)} lit={hot === 1} color="#8FCFC8" />
      <Show on={s(2)} style={{ position: 'absolute', left: N2.NX, width: N2.NW, top: N2.NY + 16, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Plinth size={32} lit={hot === 1}><Ico3D name="shield" size={24} loop="pulse" t={2.8} /></Plinth>
        <span style={tag(14, colors.tealDark)}>Custom Network</span>
      </Show>
      <Node x={N2.NX + N2.NW / 2} y={N2.NY + 128} icon="container" size={52} label="Service" on={s(2)} delay={160} loop="bob" d={0.4} />
      <W pts={N2_BLOCK} head={8} dash="5 5" on={s(2)} opacity={0.55} color={colors.muted} />
      <Disc x={N2.NX - 4} y={171} cross size={26} on={s(2)} z={7} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ loops: opacity / transform on HTML elements only */
const LOCAL_CSS = `
@keyframes s19f-glow { 0%, 100% { opacity: 1 } 50% { opacity: 0.7 } }
.s19f-glow0 { animation: s19f-glow 2.2s ease-in-out infinite; }
.s19f-glow1 { animation: s19f-glow 2.2s ease-in-out infinite; animation-delay: -0.6s; }
@keyframes s19f-seq0 { 0%, 6% { opacity: 0 } 14%, 92% { opacity: 1 } 98%, 100% { opacity: 0 } }
@keyframes s19f-seq1 { 0%, 40% { opacity: 0 } 48%, 92% { opacity: 1 } 98%, 100% { opacity: 0 } }
.s19f-seq0 { animation: s19f-seq0 3.6s ease-in-out infinite; }
.s19f-seq1 { animation: s19f-seq1 3.6s ease-in-out infinite; }
.cc-still .s19f-glow0, .cc-still .s19f-glow1, .cc-still .s19f-seq0, .cc-still .s19f-seq1,
.deck-thumb .s19f-glow0, .deck-thumb .s19f-glow1, .deck-thumb .s19f-seq0, .deck-thumb .s19f-seq1 { animation: none !important; opacity: 1 !important; }
@media (prefers-reduced-motion: reduce) { .s19f-glow0, .s19f-glow1, .s19f-seq0, .s19f-seq1 { animation: none !important; } }
`

export const figures: Record<string, Fig> = { F_T18, F_T19, F_T19B, F_T20, F_T20B }
export const css = K.css() + LOCAL_CSS
