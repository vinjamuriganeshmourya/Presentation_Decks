import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, Wire, Junction, Token, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'

/*
 * SESSION 19 · SECTION 2 (Layers & Caching), builder B.
 * Standing corrections 13-18: glossy 3D icons on white plinth tiles, >= 20 px equal padding (each frame sits 22 px inside
 * the slide's white figure card), orthogonal wires from the same constants as the boxes, a flow dot on every live wire,
 * the lit item walking after the build starting on the LAST item. Layers are drawn in Dockerfile order, first
 * instruction on top, so the cache cascade runs DOWN the stack as TR 5 and TR 6 say. Failure / rebuild is the template
 * orange, cache hits green ticks. Loops are transform / opacity on HTML elements only. Held (?still): the full final
 * picture, nothing lit, nothing moving. Class prefix `s19b-`.
 *
 *   slide 14 B_T05   446 x 380  one shared FROM base layer with Image A's layers under it (1: COPY and RUN are solid
 *                               layers, ENV / EXPOSE / CMD only a thin metadata strip), then Image B built on the same
 *                               stored base (2: the shared link)
 *   slide 15 B_T05B  446 x 380  one stack: three thin RUN layers combine into one and the stack gets shorter (1); ticks
 *                               on the unchanged layers taken from the cache, an orange break, the layers after it
 *                               rebuilt (2)
 *   slide 16 B_T06   546 x 380  Instruction -> Checksum -> Compare <- Stored; Match -> Reuse (1); Mismatch -> Rebuild,
 *                               the build-context folder behind `COPY . .` with a file changing (2)
 *   slide 17 B_T06B  546 x 380  a four-layer stack beside a build log: the changed COPY layer and every layer after it
 *                               rebuild down the cascade (1); the log marks the reused layers CACHED (2)
 *   slide 18 B_T07   526 x 380  code-first vs manifest-first orderings with a slow / fast timer: the manifest copied
 *                               before the source (1); the install layer stays cached (2); loop: a code edit rebuilds
 *                               from COPY . . down in each column
 *   slide 19 B_T07B  526 x 380  the same two columns: only the code layer, copied last, rebuilds (1); `--no-cache`
 *                               rebuilds every layer (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19b')
const KF: string[] = []
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const GREEN = colors.success

/** the build of a figure: the step, the lit item, held (the walk after the build starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period = 1700) {
  const cnt = Number(p.steps ?? 1)
  const raw0 = Number(p.step ?? 0)
  const held = useHeld()
  const step = held ? cnt : raw0
  const raw = useHot(cnt, raw0, period)
  const hot = raw >= 0 && raw0 >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a looping keyframe class on opacity (or a transform), held on ?still because loop elements are not rendered then */
function loop(name: string, period: number, frames: string) {
  const cls = `s19b-${name}`
  KF.push(`@keyframes ${cls} { ${frames} }\n.${cls} { animation: ${cls} ${period}s ease-in-out infinite; }`)
  return cls
}
/** opacity 0 outside [t0, t1] seconds of a period, 1 inside, soft edges */
const pc = (t: number, P: number) => `${Math.max(0, Math.min(100, (t / P) * 100)).toFixed(2)}%`
function flash(name: string, t0: number, t1: number, P: number) {
  return loop(name, P, `0%, ${pc(t0, P)} { opacity: 0 } ${pc(t0 + 0.25, P)}, ${pc(t1, P)} { opacity: 1 } ${pc(t1 + 0.35, P)}, 100% { opacity: 0 }`)
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon on its plinth, the TILE centred on (x, y), its tag under, above or beside it */
function Node({ x, y, label, icon, size = 52, on = true, lit = false, loop: lp = 'bob', d = 0, t, w = 110, tagSize = 14, delay = 0, at = 'below', mono = false, children }: { x: number; y: number; label?: string; icon: Ico3DName; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; delay?: number; at?: 'below' | 'above' | 'right' | 'left'; mono?: boolean; children?: ReactNode }) {
  const tile = (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Plinth size={size} lit={lit}><Ico3D name={icon} size={Math.round(size * 0.74)} loop={lp} d={d} t={t} /></Plinth>
      {children}
    </div>
  )
  const tg = label ? <span style={{ ...tag(tagSize), ...(mono ? { fontFamily: MONO, fontVariantLigatures: 'none', fontSize: tagSize - 1 } : {}) }}>{label}</span> : null
  if (at === 'right' || at === 'left') {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: 4, display: 'flex', flexDirection: at === 'right' ? 'row' : 'row-reverse', alignItems: 'center', gap: 8, ...(at === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
        {tile}
        {tg}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: at === 'above' ? y - size / 2 - 24 : y - size / 2, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {at === 'above' && tg}
      {tile}
      {at === 'below' && tg}
    </Show>
  )
}

/** a small 3D icon in a white disc (a status mark inside a layer) */
function Mark({ icon, size = 24, on = true, loop: lp = 'pulse', d = 0 }: { icon: Ico3DName; size?: number; on?: boolean; loop?: Loop; d?: number }) {
  const instant = useInstant()
  return (
    <span style={{ width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 3px 8px -4px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 420ms ${EASE}` }}>
      <Ico3D name={icon} size={size - 6} loop={lp} d={d} t={2.4} />
    </span>
  )
}

type SlabProps = { x: number; y: number; w: number; h?: number; label: string; icon?: Ico3DName; on?: boolean; lit?: boolean; ghost?: boolean; warm?: boolean; status?: ReactNode; delay?: number; size?: number; d?: number; fade?: number }
/** one image layer: a white slab with a blue edge, its instruction in code type; `ghost` = metadata only (dashed) */
function Slab({ x, y, w, h = 36, label, icon, on = true, lit = false, ghost = false, warm = false, status, delay = 0, size = 14, d = 0, fade = 1 }: SlabProps) {
  const instant = useInstant()
  const tr = instant ? 'none' : `opacity 520ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms, top 640ms ${EASE}, height 640ms ${EASE}, box-shadow 420ms ${EASE}, background 420ms ${EASE}`
  const shadow = lit
    ? `inset 0 0 0 2.5px ${ORANGE}, 0 4px 0 -1px #FFD2B0, 0 10px 20px -12px rgba(255,138,61,0.65)`
    : ghost
      ? 'none'
      : warm
        ? 'inset 0 0 0 1.5px #FFC9A3, 0 4px 0 -1px #FFDCC3, 0 10px 18px -12px rgba(31,64,140,0.42)'
        : 'inset 0 0 0 1.5px #BCD0F8, 0 4px 0 -1px #C9D8F8, 0 10px 18px -12px rgba(31,64,140,0.42)'
  const st: CSSProperties = {
    position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 3, boxSizing: 'border-box', borderRadius: 10,
    display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', overflow: 'hidden',
    background: ghost ? 'rgba(255,255,255,0.6)' : warm ? 'linear-gradient(180deg, #FFFFFF 0%, #FFEBDC 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #E4ECFF 100%)',
    border: ghost ? `1.5px dashed ${lit ? ORANGE : '#9DB6EE'}` : undefined,
    boxShadow: ghost && lit ? `0 0 0 1px ${ORANGE}` : shadow,
    opacity: on ? fade : 0, transform: on ? 'none' : 'translateY(-6px)', transition: tr,
  }
  return (
    <div style={st}>
      {icon && <Ico3D name={icon} size={Math.min(24, h - 10)} loop="bob" d={d} />}
      <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: size, color: colors.brandDeep, whiteSpace: 'nowrap', lineHeight: 1 }}>{label}</span>
      <span style={{ flex: 1 }} />
      {status}
    </div>
  )
}

/** a wire on its own layer above the cards */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a small 3D icon carried by a `ride` class; nothing on held frames */
function Rider({ cls, icon, size = 26, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a warm rebuild glow over a layer, driven by a loop class; nothing on held frames */
function Glow({ x, y, w, h, cls, on = true }: { x: number; y: number; w: number; h: number; cls: string; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return <span aria-hidden className={cls} style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 10, background: 'linear-gradient(180deg, rgba(255,138,61,0.10) 0%, rgba(255,138,61,0.26) 100%)', opacity: 0, zIndex: 5, pointerEvents: 'none' }} />
}

/** a vertical bracket grouping rows, as a root svg */
function Bracket({ x, y0, y1, color, on = true }: { x: number; y0: number; y1: number; color: string; on?: boolean }) {
  const instant = useInstant()
  return (
    <svg aria-hidden width={14} height={y1 - y0} style={{ position: 'absolute', left: x, top: y0, overflow: 'visible', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 200ms, top 640ms ${EASE}`, zIndex: 2 }}>
      <path d={`M 0 1 L 8 1 L 8 ${y1 - y0 - 1} L 0 ${y1 - y0 - 1}`} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ================================================================== T05 · LAYERS CREATED AND SHARED (402 x 336) */

const F5 = { w: 402, h: 336 }
const B5 = { x: 0, y: 24, w: 402, h: 42 } // the shared FROM base
const C5 = [{ x: 0, w: 152 }, { x: 250, w: 152 }] // Image A, Image B columns
const R5 = { copy: 92, run: 136, meta: 180, h: 36, mh: 26 }
const IMG5 = { y: 272, s: 52 }
const LINK5 = { x: 201, y: 142, s: 46 }
const cx5 = (i: number) => C5[i].x + C5[i].w / 2
const W5 = {
  join: [0, 1].map((i) => [[cx5(i), B5.y + B5.h], [cx5(i), R5.copy]] as Pt[]),
  out: [0, 1].map((i) => [[cx5(i), R5.meta + R5.mh], [cx5(i), IMG5.y - IMG5.s / 2]] as Pt[]),
  link: [[LINK5.x, LINK5.y - LINK5.s / 2], [LINK5.x, B5.y + B5.h]] as Pt[],
}
const P5 = 4.2
const RD5 = {
  join: [0, 1].map((i) => K.ride(`t5j${i}`, W5.join[i], 0.2 + i * 2.1, 0.8 + i * 2.1, P5)),
  out: [0, 1].map((i) => K.ride(`t5o${i}`, W5.out[i], 1.0 + i * 2.1, 1.8 + i * 2.1, P5)),
  link: K.ride('t5l', W5.link, 0.4, 1.4, P5 / 2),
}

const B_T05: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const col = (i: number, on: boolean, lit: boolean) => (
    <>
      <Slab x={C5[i].x} y={R5.copy} w={C5[i].w} h={R5.h} label="COPY" icon="replica" on={on} lit={lit} d={i * 0.5} />
      <Slab x={C5[i].x} y={R5.run} w={C5[i].w} h={R5.h} label="RUN" icon="terminal" on={on} lit={lit} delay={140} d={0.3 + i * 0.5} />
      <Slab x={C5[i].x} y={R5.meta} w={C5[i].w} h={R5.mh} label="ENV EXPOSE CMD" ghost size={12} on={on} lit={lit} delay={280} />
      <W pts={W5.join[i]} on={on} head={8} />
      <W pts={W5.out[i]} on={on} delay={300} head={9} />
      <Node x={cx5(i)} y={IMG5.y} size={IMG5.s} icon="layers" label={i === 0 ? 'Image A' : 'Image B'} on={on} delay={420} lit={lit} d={i * 0.7} w={130} />
    </>
  )
  return (
    <Frame w={F5.w} h={F5.h}>
      <Slab x={B5.x} y={B5.y} w={B5.w} h={B5.h} label="FROM" icon="cube" lit={hot === 1} />
      {col(0, s(1), hot === 0)}
      {col(1, s(2), false)}
      <W pts={W5.link} on={s(2)} head={9} delay={200} />
      <Node x={LINK5.x} y={LINK5.y} size={LINK5.s} icon="link" label="Shared" on={s(2)} lit={hot === 1} loop="pulse" w={90} delay={150} />
      {[0, 1].map((i) => <Token key={`j${i}`} cls={RD5.join[i]} on={s(i + 1)} size={9} />)}
      {[0, 1].map((i) => <Token key={`o${i}`} cls={RD5.out[i]} on={s(i + 1)} size={9} />)}
      <Token cls={RD5.link} on={s(2)} size={9} />
    </Frame>
  )
}

/* ================================================================== T05B · FEWER LAYERS, CACHE REUSE (402 x 336) */

const F5B = { w: 402, h: 336 }
const S5B = { x: 116, w: 196 }
/* rows before the merge (three thin RUN layers) and after it */
const Y5B = {
  pre: { from: 84, run: [130, 158, 186], copy: 222, meta: 268 },
  post: { from: 84, run: [130, 130, 130], copy: 178, meta: 224 },
  h: 36, thin: 22, mh: 26,
}
const MINUS5 = { x: 46, y: 148, s: 48 }
const BREAK5 = 172 // between RUN (ends 166) and COPY (starts 178)
const BR5 = { x: S5B.x + S5B.w + 12 }

const B_T05B: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const instant = useInstant()
  const merged = s(1)
  const Y = merged ? Y5B.post : Y5B.pre
  const cached = s(2)
  return (
    <Frame w={F5B.w} h={F5B.h}>
      <Slab x={S5B.x} y={Y.from} w={S5B.w} label="FROM" icon="cube" lit={hot === 1} status={<Mark icon="check" on={cached} />} />
      {[0, 1, 2].map((k) => (
        <Slab key={k} x={S5B.x} y={Y.run[k]} w={S5B.w} h={merged ? Y5B.h : Y5B.thin} size={merged ? 14 : 12} label="RUN" icon="terminal"
          fade={merged && k > 0 ? 0 : 1} lit={k === 0 && (hot === 0 || hot === 1)} status={k === 0 ? <Mark icon="check" on={cached} d={0.4} /> : undefined} />
      ))}
      <Slab x={S5B.x} y={Y.copy} w={S5B.w} label="COPY" icon="replica" warm={cached} status={<Mark icon="refresh" on={cached} loop="spin" />} />
      <Slab x={S5B.x} y={Y.meta} w={S5B.w} h={Y5B.mh} label="CMD" ghost size={12} warm={cached} />
      {/* point 1: related commands combined into one RUN */}
      <Node x={MINUS5.x} y={MINUS5.y} size={MINUS5.s} icon="minus" label="Combine" on={s(1)} lit={hot === 0} loop="pulse" w={92} />
      {/* point 2: the cache break, unchanged layers reused above it, the rest rebuilt */}
      <svg aria-hidden width={S5B.w + 36} height={4} style={{ position: 'absolute', left: S5B.x - 18, top: BREAK5 - 2, overflow: 'visible', zIndex: 6, opacity: cached ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 300ms` }}>
        <line x1={0} y1={2} x2={S5B.w + 36} y2={2} stroke={ORANGE} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
      </svg>
      <Bracket x={BR5.x} y0={Y5B.post.from} y1={Y5B.post.run[0] + Y5B.h} color={GREEN} on={cached} />
      <Bracket x={BR5.x} y0={Y5B.post.copy} y1={Y5B.post.meta + Y5B.mh} color={ORANGE} on={cached} />
      <Show on={cached} delay={300} style={{ position: 'absolute', left: BR5.x + 18, top: (Y5B.post.from + Y5B.post.run[0] + Y5B.h) / 2 - 9, zIndex: 3 }}><span style={tag(14, colors.success)}>Cached</span></Show>
      <Show on={cached} delay={300} style={{ position: 'absolute', left: BR5.x + 18, top: (Y5B.post.copy + Y5B.post.meta + Y5B.mh) / 2 - 9, zIndex: 3 }}><span style={tag(14, colors.accentDark)}>Rebuilt</span></Show>
    </Frame>
  )
}

/* ================================================================== T06 · CHECKSUM, COMPARE, MATCH OR MISMATCH (502 x 336) */

const F6 = { w: 502, h: 336 }
const T6 = 54 // tile
const Y6 = { row: 84, low: 252, split: 168 }
const X6 = { ins: 52, sum: 184, cmp: 316, sto: 446, match: 252, miss: 380, dir: 52 }
const W6 = {
  insSum: [[X6.ins + T6 / 2, Y6.row], [X6.sum - T6 / 2, Y6.row]] as Pt[],
  sumCmp: [[X6.sum + T6 / 2, Y6.row], [X6.cmp - T6 / 2, Y6.row]] as Pt[],
  stoCmp: [[X6.sto - T6 / 2, Y6.row], [X6.cmp + T6 / 2, Y6.row]] as Pt[],
  match: [[X6.cmp, Y6.row + T6 / 2], [X6.cmp, Y6.split], [X6.match, Y6.split], [X6.match, Y6.low - T6 / 2]] as Pt[],
  miss: [[X6.cmp, Y6.row + T6 / 2], [X6.cmp, Y6.split], [X6.miss, Y6.split], [X6.miss, Y6.low - T6 / 2]] as Pt[],
  dir: [[X6.dir, Y6.low - T6 / 2], [X6.dir, Y6.row + T6 / 2]] as Pt[],
}
const P6 = 6
const TRUNK6: Pt[] = [...W6.insSum, ...W6.sumCmp.slice(1)]
const RD6 = {
  m: K.ride('t6m', [...TRUNK6, ...W6.match.slice(1)], 0.2, 2.6, P6),
  x: K.ride('t6x', [...TRUNK6, ...W6.miss.slice(1)], 3.2, 5.6, P6),
  sto: K.ride('t6s', W6.stoCmp, 1.0, 1.7, P6 / 2),
  dir: K.ride('t6d', W6.dir, 2.4, 3.2, P6),
}
const CHG6 = loop('chg6', 2.4, `0%, 100% { transform: scale(0.9) } 50% { transform: scale(1.12) }`)

const B_T06: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const held = useHeld()
  return (
    <Frame w={F6.w} h={F6.h}>
      <W pts={W6.insSum} />
      <W pts={W6.sumCmp} />
      <W pts={W6.stoCmp} />
      <Node x={X6.ins} y={Y6.row} size={T6} icon="code" label="Instruction" at="above" />
      <Node x={X6.sum} y={Y6.row} size={T6} icon="hash" label="Checksum" at="above" lit={hot === 0} d={0.4} />
      <Node x={X6.cmp} y={Y6.row} size={T6} icon="scale" label="Compare" at="above" loop="tilt" />
      <Node x={X6.sto} y={Y6.row} size={T6} icon="layers" label="Stored" at="above" d={0.8} />
      {/* point 1: matching checksums reuse the stored layer */}
      <W pts={W6.match} on={s(1)} lit={hot === 0} />
      <Junction x={X6.cmp} y={Y6.split} on={s(1)} />
      <Node x={X6.match} y={Y6.low} size={T6} icon="check" label="Reuse" on={s(1)} lit={hot === 0} loop="pulse" delay={500} />
      {/* point 2: any mismatch rebuilds; COPY . . changes with any file in the context */}
      <W pts={W6.miss} on={s(2)} lit={hot === 1} />
      <Node x={X6.miss} y={Y6.low} size={T6} icon="refresh" label="Rebuild" on={s(2)} lit={hot === 1} loop="spin" delay={500} />
      <W pts={W6.dir} on={s(2)} />
      <Node x={X6.dir} y={Y6.low} size={T6} icon="folder" label="COPY . ." mono on={s(2)} lit={hot === 1} w={100}>
        {!held && s(2) && (
          <span aria-hidden className={CHG6} style={{ position: 'absolute', right: -10, top: -10, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${ORANGE}, 0 4px 10px -4px rgba(255,138,61,0.7)`, display: 'grid', placeItems: 'center' }}>
            <Ico3D name="doc" size={18} loop="none" />
          </span>
        )}
      </Node>
      <Token cls={RD6.m} on={s(1)} />
      <Token cls={RD6.x} on={s(2)} tone={ORANGE} />
      <Token cls={RD6.sto} size={9} />
      <Token cls={RD6.dir} on={s(2)} size={9} tone={ORANGE} />
    </Frame>
  )
}

/* ================================================================== T06B · THE CASCADE AND THE LOG (502 x 336) */

const F6B = { w: 502, h: 336 }
const S6B = { x: 0, w: 214, h: 44, ys: [86, 146, 206, 266] }
const LOG6 = { x: 268, y: 22, w: 234, h: 314, head: 50 }
const LAB6 = ['FROM', 'WORKDIR', 'COPY . .', 'RUN']
const ICO6: Ico3DName[] = ['cube', 'folder', 'replica', 'terminal']
const CAS6: Pt[] = [[S6B.x + S6B.w, S6B.ys[2] + S6B.h / 2], [S6B.x + S6B.w + 24, S6B.ys[2] + S6B.h / 2], [S6B.x + S6B.w + 24, S6B.ys[3] + S6B.h / 2], [S6B.x + S6B.w + 2, S6B.ys[3] + S6B.h / 2]]
const RD6B = K.ride('t6bc', CAS6, 0.3, 1.5, 2.6)
const BAR6 = loop('bar6', 2.6, `0% { transform: scaleX(0.08) } 70%, 100% { transform: scaleX(1) }`)

const B_T06B: Fig = (p) => {
  const { hot, s, held } = useBuild(p)
  const rebuilt = (k: number) => k >= 2
  return (
    <Frame w={F6B.w} h={F6B.h}>
      <Node x={24} y={40} size={44} icon="layers" label="Layers" at="right" lit={hot === 0} />
      {LAB6.map((l, k) => (
        <Slab key={k} x={S6B.x} y={S6B.ys[k]} w={S6B.w} h={S6B.h} label={l} icon={ICO6[k]} d={k * 0.3}
          warm={s(1) && rebuilt(k)} lit={hot === 0 && rebuilt(k)}
          status={rebuilt(k) ? <Mark icon="refresh" on={s(1)} loop="spin" /> : <Mark icon="check" on={s(2)} d={k * 0.4} />} />
      ))}
      {/* point 1: the changed layer and every layer after it rebuild, down the cascade */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire pts={CAS6} on={s(1)} color={ORANGE} head={9} /></div>
      <Token cls={RD6B} on={s(1)} tone={ORANGE} size={9} />
      {/* point 2: the build log marks the reused layers CACHED */}
      <div style={{ position: 'absolute', left: LOG6.x, top: LOG6.y, width: LOG6.w, height: LOG6.h, borderRadius: 16, background: 'linear-gradient(180deg, #13244A 0%, #0C1A3A 100%)', boxShadow: hot === 1 ? `inset 0 0 0 2.5px ${ORANGE}, 0 14px 26px -16px rgba(255,138,61,0.7)` : '0 14px 26px -16px rgba(8,16,38,0.7), inset 0 0 0 1.5px #2A3F73', zIndex: 3 }}>
        <div style={{ height: LOG6.head, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #2A3F73' }}>
          <Plinth size={34}><Ico3D name="terminal" size={24} loop="bob" /></Plinth>
          <span style={tag(14, '#E6EEFF')}>Build Log</span>
        </div>
      </div>
      {LAB6.map((_, k) => {
        const cy = S6B.ys[k] + S6B.h / 2
        return (
          <div key={k} style={{ position: 'absolute', left: LOG6.x + 18, width: LOG6.w - 36, top: cy - 11, height: 22, display: 'flex', alignItems: 'center', gap: 10, zIndex: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: rebuilt(k) ? ORANGE : '#5B7BC4', flexShrink: 0 }} />
            {rebuilt(k) ? (
              <span style={{ flex: 1, height: 8, borderRadius: 99, background: '#24396B', overflow: 'hidden', position: 'relative' }}>
                <span className={held || !s(1) ? undefined : BAR6} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: ORANGE, transformOrigin: '0 50%', transform: held ? 'none' : s(1) ? undefined : 'scaleX(0)', opacity: s(1) ? 1 : 0 }} />
              </span>
            ) : (
              <>
                <Show on={s(2)} lift={0}><span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 700, fontSize: 15, color: '#4ADE80', letterSpacing: 0.4 }}>CACHED</span></Show>
                <span style={{ flex: 1, height: 8, borderRadius: 99, background: '#24396B' }} />
              </>
            )}
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== T07 · ORDERING: CODE FIRST VS MANIFEST FIRST (482 x 336) */

const F7 = { w: 482, h: 336 }
const C7 = [{ x: 0, w: 196 }, { x: 222, w: 260 }] // before (code first), after (manifest first)
const ROWS7 = [110, 154, 198, 242, 286]
const H7 = 36
type Row7 = { label: string; icon?: Ico3DName; ghost?: boolean; size?: number }
const BEFORE: Row7[] = [{ label: 'FROM', icon: 'cube' }, { label: 'COPY . .', icon: 'code' }, { label: 'RUN', icon: 'package' }, { label: 'CMD', ghost: true, size: 12 }]
const AFTER: Row7[] = [{ label: 'FROM', icon: 'cube' }, { label: 'COPY requirements.txt', icon: 'doc', size: 13 }, { label: 'RUN', icon: 'package' }, { label: 'COPY . .', icon: 'code' }, { label: 'CMD', ghost: true, size: 12 }]
const HEAD7 = 40 // header row centre
const BAR7 = 80 // timer bar top
const P7 = 6.4
/* the loop: a code edit lands on COPY . . in both columns, then the layers from there down rebuild, one after another */
const EDIT7 = [0, 1].map((i) => K.ride(`t7e${i}`, [[C7[i].x + C7[i].w - 26, 16], [C7[i].x + C7[i].w - 26, ROWS7[i === 0 ? 1 : 3] + H7 / 2]], 0.2, 1.0, P7, 0.9))
const SWEEP7 = {
  before: [1, 2, 3].map((r, k) => flash(`t7b${r}`, 1.1 + k * 1.1, 1.1 + k * 1.1 + 0.9, P7)),
  after: [3, 4].map((r, k) => flash(`t7a${r}`, 1.1 + k * 0.5, 1.1 + k * 0.5 + 0.45, P7)),
  all: [0, 1].map((i) => (i === 0 ? [0, 1, 2, 3] : [0, 1, 2, 3, 4]).map((r) => flash(`t7n${i}${r}`, 0.3 + r * 0.9, 0.3 + r * 0.9 + 0.8, P7))),
}
const TIME7 = {
  slow: loop('t7slow', P7, `0%, ${pc(1.1, P7)} { transform: scaleX(0) } ${pc(4.4, P7)}, ${pc(6.0, P7)} { transform: scaleX(1) } 100% { transform: scaleX(0) }`),
  fast: loop('t7fast', P7, `0%, ${pc(1.1, P7)} { transform: scaleX(0) } ${pc(2.2, P7)}, ${pc(6.0, P7)} { transform: scaleX(0.34) } 100% { transform: scaleX(0) }`),
  slowAll: loop('t7slowall', P7, `0%, ${pc(0.3, P7)} { transform: scaleX(0) } ${pc(4.6, P7)}, ${pc(6.0, P7)} { transform: scaleX(1) } 100% { transform: scaleX(0) }`),
}

function TimerBar({ i, cls, still }: { i: number; cls?: string; still: number }) {
  const held = useHeld()
  return (
    <div style={{ position: 'absolute', left: C7[i].x, top: BAR7, width: C7[i].w, height: 8, borderRadius: 99, background: '#DCE6FB', overflow: 'hidden', zIndex: 3 }}>
      <span className={held || !cls ? undefined : cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `linear-gradient(90deg, ${colors.brand}, #6E95FF)`, transformOrigin: '0 50%', transform: held || !cls ? `scaleX(${still})` : undefined }} />
    </div>
  )
}

function Columns7({ p, nocache }: { p: Record<string, unknown>; nocache: boolean }) {
  const { hot, s } = useBuild(p)
  const t07b = p.variant === 'B'
  const showAfter = t07b || s(1)
  const all = t07b && s(2)
  const cachedRun = t07b || s(2)
  const lit = (i: number, r: number) => {
    if (!t07b) return (hot === 0 && i === 1 && r === 1) || (hot === 1 && i === 1 && r === 2)
    if (hot === 0) return i === 1 && r === 3
    if (hot === 1) return true
    return false
  }
  const statusOf = (i: number, r: number): ReactNode => {
    if (all) return <Mark icon="refresh" loop="spin" d={r * 0.2} />
    if (i === 1 && r === 2) return <Mark icon="check" on={cachedRun} />
    if (i === 0 && r === 2) return <Mark icon="refresh" loop="spin" on={cachedRun} />
    if (t07b && i === 1 && r === 3) return <Mark icon="refresh" loop="spin" on={s(1)} />
    return undefined
  }
  const sweep = (i: number, r: number) => {
    if (all) return SWEEP7.all[i][r]
    if (i === 0) return r >= 1 ? SWEEP7.before[r - 1] : undefined
    return r >= 3 ? SWEEP7.after[r - 3] : undefined
  }
  const loopOn = t07b ? true : s(2)
  return (
    <>
      <Node x={22} y={HEAD7} size={44} icon="stopwatch" label="Slow" at="right" loop="pulse" />
      <Node x={C7[1].x + C7[1].w - 22} y={HEAD7} size={44} icon="stopwatch" label="Fast" at="left" loop="pulse" d={0.6} on={showAfter} />
      <TimerBar i={0} cls={loopOn ? (all ? TIME7.slowAll : TIME7.slow) : undefined} still={1} />
      <Show on={showAfter}><TimerBar i={1} cls={loopOn ? (all ? TIME7.slowAll : TIME7.fast) : undefined} still={all ? 1 : 0.34} /></Show>
      {[BEFORE, AFTER].map((rows, i) =>
        rows.map((r, k) => {
          const on = i === 0 || showAfter
          const cls = loopOn ? sweep(i, k) : undefined
          return (
            <div key={`${i}-${k}`}>
              <Slab x={C7[i].x} y={ROWS7[k]} w={C7[i].w} h={H7} label={r.label} icon={r.icon} ghost={r.ghost} size={r.size ?? 14} d={k * 0.3 + i * 0.5}
                on={on} delay={i === 1 ? k * 110 : 0} lit={lit(i, k)} warm={all} status={statusOf(i, k)} />
              {cls && on && <Glow x={C7[i].x} y={ROWS7[k]} w={C7[i].w} h={H7} cls={cls} />}
            </div>
          )
        }),
      )}
      {loopOn && [0, 1].map((i) => <Rider key={i} cls={EDIT7[i]} icon="code" size={24} on={!all && (i === 0 || showAfter)} />)}
      {/* T07B point 2: --no-cache, every layer rebuilds */}
      {t07b && <Node x={C7[0].x + C7[0].w + 13 - 2} y={HEAD7} size={40} icon="refresh" loop="spin" label="--no-cache" mono at="right" on={nocache} lit={hot === 1} />}
    </>
  )
}

const B_T07: Fig = (p) => (
  <Frame w={F7.w} h={F7.h}>
    <Columns7 p={p} nocache={false} />
  </Frame>
)
const B_T07B: Fig = (p) => {
  const { s } = useBuild(p)
  return (
    <Frame w={F7.w} h={F7.h}>
      <Columns7 p={{ ...p, variant: 'B' }} nocache={s(2)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { B_T05, B_T05B, B_T06, B_T06B, B_T07, B_T07B }
export const css = K.css() + '\n' + KF.join('\n')
