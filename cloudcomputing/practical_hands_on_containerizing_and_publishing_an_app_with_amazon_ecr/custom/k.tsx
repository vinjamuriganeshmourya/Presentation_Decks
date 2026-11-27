import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { Frame, Plinth, MarkTile, Panel, Wire, Token, Show, keyframes, tag, useHot, useHeld, FONT, PAD, EASE, ORANGE, type Pt } from '@/engine/figkit'
import { useInstant } from '@/motion/instant'
import ec2Mark from '../images/aws-ec2.svg'
import ecrMark from '../images/aws-ecr.svg'
import dockerMark from '../images/tech-docker.svg'
import flaskMark from '../images/tech-flask.svg'
import vscodeMark from '../images/tech-vscode.svg'
import awsMark from '../images/tech-aws.png'

/*
 * SESSION 19 · PRACTICAL (Containerizing and Publishing an App with Amazon ECR) · builder K (file k)
 * Built to generate-slides standing corrections 8, 13-18 and cloud course R7-R15: 3D icons and official marks on white
 * tiles (marks never move), >= 20 px equal padding inside every card, orthogonal wires from the box constants with a
 * flow dot after the build, the lit item walking last -> first -> ... after the build, held frames complete with nothing
 * lit and nothing moving. Loops are transform / opacity on HTML elements only. Class prefix `s19k-`.
 *
 *   slide 3  K_P26  1000 x 300  build EC2 instance (Flask app -> image) (1), push to the Amazon ECR repository, tag v1
 *                               locked (2), pull onto the run EC2 instance, the same image running as a container (3);
 *                               under the row the three prerequisites (AWS account, VS Code Remote-SSH, Docker)
 *   slide 4  K_P27  1100 x 440  TR steps 1-6 on a horizontal spine with numbered nodes, cards zig-zagging above (odd
 *                               steps) and below (even), the spine filling left to right, one step per press
 *   slide 10 K_P30  1100 x 440  the same timeline for TR steps 7-11 (wider cards, the same size on the slide)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
type Item = { text: string; icon?: string }
const K = keyframes('s19k')
const INK = colors.ink

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const raw0 = Number(p.step ?? 0)
  const held = useHeld()
  const step = held ? cnt : raw0
  const raw = useHot(cnt, raw0, period)
  const hot = raw >= 0 && raw0 >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && raw0 >= cnt }
}

/* an item's icon ref (`img:images/<file>` or `i3d:<name>`) -> its tile */
const MARKS: Record<string, string> = {
  'aws-ec2.svg': ec2Mark, 'aws-ecr.svg': ecrMark, 'tech-docker.svg': dockerMark, 'tech-flask.svg': flaskMark,
  'tech-vscode.svg': vscodeMark, 'tech-aws.png': awsMark,
}
const LOOPS: Loop[] = ['bob', 'float', 'tilt', 'pulse', 'bob', 'float']
function ItemTile({ icon, size, d, lit = false }: { icon?: string; size: number; d: number; lit?: boolean }) {
  if (icon?.startsWith('img:')) {
    /* the engine may hand over the deck path (`images/aws-ec2.svg`) or an already resolved URL: match by file name */
    const ref = icon.slice(4)
    const key = Object.keys(MARKS).find((k) => ref.endsWith(k) || ref.includes(k.replace(/\.[a-z]+$/, '')))
    return <MarkTile src={key ? MARKS[key] : ref} size={size} lit={lit} />
  }
  const name = (icon?.startsWith('i3d:') ? icon.slice(4) : 'doc') as Ico3DName
  return (
    <Plinth size={size} lit={lit}>
      <Ico3D name={name} size={Math.round(size * 0.72)} loop={LOOPS[Math.round(d) % LOOPS.length]} d={d * 0.45} />
    </Plinth>
  )
}

/** a tile with its tag under it, the TILE centred on (x, y) */
function Node({ x, y, label, children, w = 120, size }: { x: number; y: number; label: string; children: ReactNode; w?: number; size: number }) {
  return (
    <div style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
      {children}
      <span style={{ ...tag(14), marginTop: 6 }}>{label}</span>
    </div>
  )
}

/* ================================================================== slide 3 · K_P26 · the two-instance workflow */

/*
 * 1000 x 300. Three cards on one row, y 20..216: the build instance (x 20..330), the registry (x 400..600), the run
 * instance (x 670..980); wires card edge to card edge at the row's centre line (y 118). Inside each instance card two
 * tiles joined by a short wire: Flask App -> Image (build), Image -> Container (run). Under the row (y 236..280) the
 * prerequisites as three marks with their tags beside them, shown from the start (they are the lead's second line).
 */
const W = { W: 1000, H: 300, Y: PAD, CH: 196, BX: PAD, BW: 310, RX: 400, RW: 200, UX: 670, UW: 310 }
const W_CY = W.Y + W.CH / 2 // 118
const W_TS = 64
/* tile centres inside the instance cards (absolute): the tag row sits above the tiles */
const W_TY = W.Y + 112
const W_B = [W.BX + 80, W.BX + W.BW - 80] // flask, image
const W_U = [W.UX + 80, W.UX + W.UW - 80] // image, container
const W_WIRES: Pt[][] = [
  [[W.BX + W.BW, W_CY], [W.RX, W_CY]],
  [[W.RX + W.RW, W_CY], [W.UX, W_CY]],
]
const W_IN: Pt[][] = [
  [[W_B[0] + W_TS / 2 + 4, W_TY], [W_B[1] - W_TS / 2 - 4, W_TY]],
  [[W_U[0] + W_TS / 2 + 4, W_TY], [W_U[1] - W_TS / 2 - 4, W_TY]],
]
const W_T = 4.8
const W_RIDE = [
  K.ride('p26-a', [W_IN[0][0], [W_IN[0][1][0] - 8, W_TY]], 0.1, 0.7, W_T),
  K.ride('p26-b', [W_WIRES[0][0], [W_WIRES[0][1][0] - 10, W_CY]], 0.9, 1.6, W_T),
  K.ride('p26-c', [W_WIRES[1][0], [W_WIRES[1][1][0] - 10, W_CY]], 1.9, 2.6, W_T),
  K.ride('p26-d', [W_IN[1][0], [W_IN[1][1][0] - 8, W_TY]], 2.8, 3.4, W_T),
]

function CardHead({ mark, label }: { mark: string; label: string }) {
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, top: 20, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <MarkTile src={mark} size={40} />
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: INK, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

const K_P26: Fig = (p) => {
  const { hot, s, done } = useBuild(p, 1800)
  const prereq = [
    { src: awsMark, label: 'AWS Account' },
    { src: vscodeMark, label: 'VS Code Remote-SSH' },
    { src: dockerMark, label: 'Docker' },
  ]
  return (
    <Frame w={W.W} h={W.H}>
      {/* the build instance */}
      <Panel x={W.BX} y={W.Y} w={W.BW} h={W.CH} on={s(1)} lit={hot === 0}>
        <CardHead mark={ec2Mark} label="Build Instance" />
      </Panel>
      <Show on={s(1)} delay={150} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <Node x={W_B[0]} y={W_TY} label="Flask App" size={W_TS}><MarkTile src={flaskMark} size={W_TS} /></Node>
          <Node x={W_B[1]} y={W_TY} label="Image" size={W_TS}><Plinth size={W_TS}><Ico3D name="layers" size={46} loop="bob" /></Plinth></Node>
          <Wire pts={W_IN[0]} head={9} />
      </Show>

      {/* the registry */}
      <Wire pts={W_WIRES[0]} head={10} on={s(2)} lit={hot === 1} delay={100} />
      <Panel x={W.RX} y={W.Y} w={W.RW} h={W.CH} on={s(2)} lit={hot === 1} delay={150}>
        <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <MarkTile src={ecrMark} size={64} />
            <span style={tag(14)}>Amazon ECR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plinth size={40}><Ico3D name="tag" size={28} loop="swing" badge="lock" /></Plinth>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantLigatures: 'none', fontWeight: 700, fontSize: 16, color: INK }}>v1</span>
          </div>
        </div>
      </Panel>

      {/* the run instance */}
      <Wire pts={W_WIRES[1]} head={10} on={s(3)} lit={hot === 2} delay={100} />
      <Panel x={W.UX} y={W.Y} w={W.UW} h={W.CH} on={s(3)} lit={hot === 2} delay={150}>
        <CardHead mark={ec2Mark} label="Run Instance" />
      </Panel>
      <Show on={s(3)} delay={150} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <Node x={W_U[0]} y={W_TY} label="Image" size={W_TS}><Plinth size={W_TS}><Ico3D name="layers" size={46} loop="bob" d={0.8} /></Plinth></Node>
          <Node x={W_U[1]} y={W_TY} label="Container" size={W_TS}><Plinth size={W_TS}><Ico3D name="container" size={46} loop="pulse" d={0.4} /></Plinth></Node>
          <Wire pts={W_IN[1]} head={9} />
      </Show>
      {W_RIDE.map((cls) => <Token key={cls} cls={cls} on={done} />)}

      {/* what is needed before starting */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 244, height: 40, display: 'flex', justifyContent: 'center', gap: 44 }}>
        {prereq.map((q) => (
          <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MarkTile src={q.src} size={40} />
            <span style={tag(15)}>{q.label}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

/* ================================================================== slides 4 and 10 · the lab step timeline */

/*
 * 1100 x 440 (user review 2026-11-27: a horizontal spine with numbered nodes, cards zig-zagging above and below).
 * The spine runs across the middle (y 220) from the first node to the last; one white numbered node per step on it
 * (the TR's numbers, `start` .. start + n - 1). Odd steps' cards sit above the spine, even steps' below, joined to their
 * node by a short stub; every card on a slide the same size. Card centres are evenly spaced so the first and last
 * cards keep PAD from the frame edge, and same-side neighbours (two columns apart) keep a gap of >= 24 px:
 * centre_i = PAD + CW / 2 + i * (W - 2 PAD - CW) / (n - 1). Six steps: CW 280 (pitch 156, same-side gap 32); five
 * steps: CW 320 (pitch 185, gap 50). Card heights: PAD to the stub top above, the stub foot to H - PAD below.
 * Each press: the spine's colour fills to that step's node, the node fills, its card arrives. After the build a dot
 * rides the filled spine and the lit node + card walk last -> first. Held: everything shown, spine full, nothing lit.
 * The fill is a scaleX transform on an HTML bar (compositor only).
 */
const T = { W: 1100, H: 440, SY: 220, NODE: 48, STUB: 14, TS: 48 }
const T_TOP = T.SY - T.NODE / 2 - T.STUB // the card edge nearest the spine, above
const T_BOT = T.SY + T.NODE / 2 + T.STUB
const T_CH = T_TOP - PAD // 162
function tLayout(n: number) {
  const cw = n > 5 ? 280 : 320
  const pitch = (T.W - PAD * 2 - cw) / (n - 1)
  const cx = Array.from({ length: n }, (_, i) => PAD + cw / 2 + i * pitch)
  const ride = K.ride(`spine${n}`, [[cx[0], T.SY], [cx[n - 1], T.SY]], 0.1, 0.7 * n, 0.7 * n + 0.5)
  return { n, cw, cx, ride, font: n > 5 ? 15 : 16 }
}
const T6 = tLayout(6)
const T5 = tLayout(5)

function Timeline({ p, L: lay }: { p: Record<string, unknown>; L: ReturnType<typeof tLayout> }) {
  const items = (p.items as Item[] | undefined) ?? []
  const start = Number(p.start ?? 1)
  const { step, hot, s, done, held } = useBuild(p, 1700)
  const instant = useInstant()
  const { n, cw, cx } = lay
  const x0 = cx[0]
  const len = cx[n - 1] - x0
  const fill = held ? 1 : step <= 1 ? 0 : (cx[Math.min(step, n) - 1] - x0) / len
  const tr = instant ? 'none' : `transform 700ms ${EASE}`
  return (
    <Frame w={T.W} h={T.H}>
      {/* the spine: a pale track and the blue fill growing from the left */}
      <div style={{ position: 'absolute', left: x0, top: T.SY - 3, width: len, height: 6, borderRadius: 3, background: '#D9E3F7' }} />
      <div style={{ position: 'absolute', left: x0, top: T.SY - 3, width: len, height: 6, borderRadius: 3, background: colors.brand, transformOrigin: '0 50%', transform: `scaleX(${fill})`, transition: tr }} />
      <Token cls={lay.ride} on={done} />

      {cx.map((x, i) => {
        const up = i % 2 === 0
        const on = s(i + 1)
        const lit = hot === i
        const y = up ? PAD : T_BOT
        const stubY = up ? T_TOP : T.SY + T.NODE / 2
        return (
          <div key={i}>
            {/* the stub, node edge to card edge */}
            <Show on={on} lift={0} style={{ position: 'absolute', left: x - 1.5, top: stubY, width: 3, height: T.STUB, zIndex: 1 }}>
              <div style={{ width: 3, height: T.STUB, borderRadius: 2, background: lit ? ORANGE : colors.brand, transition: instant ? 'none' : `background-color 420ms ${EASE}` }} />
            </Show>
            {/* the numbered node */}
            <div style={{ position: 'absolute', left: x - T.NODE / 2, top: T.SY - T.NODE / 2, width: T.NODE, height: T.NODE, zIndex: 4, borderRadius: 99, display: 'grid', placeItems: 'center', background: '#FFFFFF',
              boxShadow: `inset 0 0 0 ${lit ? 3 : 2.5}px ${lit ? ORANGE : on ? colors.brand : '#C9D6F0'}, 0 8px 18px -10px rgba(31,64,140,0.55)`,
              transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, lineHeight: 1, color: on ? colors.brand : colors.muted, transition: instant ? 'none' : `color 420ms ${EASE}` }}>{start + i}</span>
            </div>
            {/* the card */}
            <Panel x={x - cw / 2} y={y} w={cw} h={T_CH} on={on} lit={lit} radius={18} delay={120}>
              <div style={{ position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                <ItemTile icon={items[i]?.icon} size={T.TS} d={i} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: lay.font, lineHeight: 1.42, color: INK, textAlign: 'left', minWidth: 0 }}>{items[i]?.text ?? ''}</span>
              </div>
            </Panel>
          </div>
        )
      })}
    </Frame>
  )
}

const K_P27: Fig = (p) => <Timeline p={p} L={T6} />
const K_P30: Fig = (p) => <Timeline p={p} L={T5} />

export const figures: Record<string, Fig> = { K_P26, K_P27, K_P30 }
export const css = K.css()
