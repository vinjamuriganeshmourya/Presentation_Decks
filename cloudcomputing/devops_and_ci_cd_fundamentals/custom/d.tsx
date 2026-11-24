import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import gitMark from '../images/tech-git.png'
import ghMark from '../images/tech-github.png'
import glMark from '../images/tech-gitlab.svg'
import bbMark from '../images/tech-bitbucket.svg'

/*
 * SESSION 22 · SECTION 3 (Version Control & Git Workflows) technical figures, builder D.
 * Generate-slides standing corrections 13-17: 3D icons and official marks on white plinth tiles, >= 20 px equal padding,
 * orthogonal wires from the same constants as the dots, a flow dot on every live line, the lit item walking
 * first -> last -> first after the build (S21 `useBuild`). Loops: transform / opacity on HTML elements only.
 * Held (?still): the full picture, nothing lit, nothing moving. Class prefix `s22d-`.
 *
 * ONE Git-graph language for all five: `main` a blue line with blue commit dots, a feature line teal with teal dots,
 * branch names and HEAD as monospace pointer pills (identifiers keep their form), a merge commit a diamond. Orange is
 * only the lit part (and T13's conflict, the slide's one warning).
 *
 *   slide 26 D_T11   560 x 380  repository card (Git mark, history) holding main + feature; hosting marks row (2)
 *   slide 27 D_T11B  560 x 380  the same: commits flash as snapshots | the pull request merges feature into main (2)
 *   slide 28 D_T12   540 x 380  commit timeline: HEAD pointer | main lit | a new branch is only a pointer (3)
 *   slide 30 D_T13   540 x 380  fast-forward card over a three-way merge card: pointer slides | conflict | diamond (3)
 *   slide 34 D_T15B  560 x 400  trunk-based card over feature-branch card: feature flag | late merge conflict | short-lived branch (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22d')
const BLUE = colors.brand
const TEAL = colors.teal
const MONO = "'Fira Code', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const EZ = 'cubic-bezier(0.45,0,0.55,1)'
const KF: string[] = []
const LINE_W = 4

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period = 1700) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a CSS loop class (keyframes pushed once at module level), held by `.s22d-a` */
function loop(name: string, body: string, period: number, extra = '') {
  const cls = `s22d-${name}`
  KF.push(`@keyframes ${cls} { ${body} }\n.${cls} { animation: ${cls} ${period}s ${EZ} infinite ${extra}; }`)
  return `${cls} s22d-a`
}

/* ------------------------------------------------------------------ pieces */

/** a wire on its own layer above the cards (a Panel is z 2) */
const W = (props: Parameters<typeof Wire>[0] & { cls?: string; z?: number }) => {
  const { cls, z = 3, ...rest } = props
  return (
    <div className={cls} style={{ position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none' }}>
      <Wire head={0} width={LINE_W} {...rest} />
    </div>
  )
}

/** a glossy commit dot centred on (x, y) in its branch colour; `lit` rings it orange */
function Dot({ x, y, c, on = true, lit = false, size = 18, delay = 0, cls, d = 0 }: { x: number; y: number; c: string; on?: boolean; lit?: boolean; size?: number; delay?: number; cls?: string; d?: number }) {
  const instant = useInstant()
  const hi = c === BLUE ? '#8DB0FF' : '#7FE3D9'
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 5, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.5)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms` }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, ${hi} 0%, ${c} 55%, ${c} 100%)`, boxShadow: lit ? `0 0 0 3px #FFFFFF, 0 0 0 5.5px ${ORANGE}, 0 4px 10px -3px ${ORANGE}` : `0 0 0 3px #FFFFFF, 0 4px 9px -3px ${c}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, ...(cls ? loopVars(d) : {}) }} />
    </span>
  )
}

/** the merge commit: a glossy diamond centred on (x, y) */
function Diamond({ x, y, on = true, lit = false, size = 22 }: { x: number; y: number; on?: boolean; lit?: boolean; size?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, opacity: on ? 1 : 0, transform: on ? 'rotate(45deg) scale(1)' : 'rotate(45deg) scale(0.4)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 620ms ${EASE}` }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 5, background: `linear-gradient(135deg, #8DB0FF 0%, ${BLUE} 55%, #1640C8 100%)`, boxShadow: lit ? `0 0 0 3px #FFFFFF, 0 0 0 5.5px ${ORANGE}` : `0 0 0 3px #FFFFFF, 0 4px 10px -3px ${BLUE}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
    </span>
  )
}

/** a branch name or HEAD: a monospace pointer pill centred on (x, y); `caret` draws a small pointer under it */
function Pill({ x, y, text, c, on = true, lit = false, w, caret = false, icon, delay = 0, cls }: { x: number; y: number; text: string; c: string; on?: boolean; lit?: boolean; w?: number; caret?: boolean; icon?: Ico3DName; delay?: number; cls?: string }) {
  const instant = useInstant()
  const pw = w ?? text.length * 9 + 24 + (icon ? 20 : 0)
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - pw / 2, top: y - 13, width: pw, height: 26, zIndex: 7 }}>
      <div className={cls} style={{ position: 'absolute', inset: 0 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 9, background: '#FFFFFF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 6px 14px -8px rgba(255,138,61,0.8)` : `inset 0 0 0 2px ${c}, 0 6px 14px -9px rgba(31,64,140,0.6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          {icon && <Ico3D name={icon} size={18} loop="none" />}
          <span style={{ fontFamily: MONO, ...NOLIG, fontWeight: 600, fontSize: 13.5, lineHeight: 1, color: c === TEAL ? colors.tealDark : colors.brandDark, whiteSpace: 'nowrap' }}>{text}</span>
        </span>
        {caret && <span aria-hidden style={{ position: 'absolute', left: pw / 2 - 5, bottom: -6, width: 10, height: 10, transform: 'rotate(45deg)', background: '#FFFFFF', boxShadow: lit ? `2.5px 2.5px 0 0 ${ORANGE}` : `2px 2px 0 0 ${c}`, borderRadius: 2 }} />}
      </div>
    </Show>
  )
}

/** a 3D icon on its plinth centred on (x, y) */
function Tile({ x, y, icon, size = 34, on = true, lit = false, loop: lp = 'bob', d = 0, t, z = 6, delay = 0 }: { x: number; y: number; icon: Ico3DName; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; z?: number; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z }}>
      <Plinth size={size} lit={lit}><Ico3D name={icon} size={Math.round(size * 0.74)} loop={lp} d={d} t={t} /></Plinth>
    </Show>
  )
}

/** a card heading: a 3D icon tile and its words, left edge at x, centred on y */
function CardHead({ x, y, icon, mark, text, size = 30, lit = false, loop: lp = 'bob' }: { x: number; y: number; icon?: Ico3DName; mark?: string; text: string; size?: number; lit?: boolean; loop?: Loop }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 6 }}>
      {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.76)} loop={lp} /></Plinth>}
      <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/** the short hash under a commit, drawn as a tag shape with blank bars (no invented hash text) */
const HashTag = ({ x, y }: { x: number; y: number }) => (
  <span aria-hidden style={{ position: 'absolute', left: x - 15, top: y - 6, width: 30, height: 12, borderRadius: 4, background: '#EEF3FF', boxShadow: 'inset 0 0 0 1px #D3DEF6', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
    <span style={{ width: 9, height: 3, borderRadius: 2, background: '#B3C3E6' }} />
    <span style={{ width: 9, height: 3, borderRadius: 2, background: '#B3C3E6' }} />
  </span>
)

/* ================================================================== T11 / T11-B: the repository */

const R = { x: 20, y: 20, w: 520, h: 246 } // the repository card
const R_HEAD_Y = R.y + 40
const MAIN_Y = 196
const FEAT_Y = 132
const PILL_L = 40 + 30 // left edge of the name pills + half width
const MAIN_DOTS = [150, 220, 300, 420, 480]
const FEAT_FORK = MAIN_DOTS[1]
const FEAT_DOTS = [276, 346]
const PR_X = MAIN_DOTS[3] // the pull request lands on this main commit
const DOT = 18
const HOSTS: { src: string; name: string }[] = [
  { src: ghMark, name: 'GitHub' },
  { src: glMark, name: 'GitLab' },
  { src: bbMark, name: 'Bitbucket' },
]
const mainPts: Pt[] = [[104, MAIN_Y], [500, MAIN_Y]]
const featPts: Pt[] = [[FEAT_FORK, MAIN_Y - DOT / 2], [FEAT_FORK, FEAT_Y], [FEAT_DOTS[1] + 26, FEAT_Y]]
const prPts: Pt[] = [[FEAT_DOTS[1] + DOT / 2, FEAT_Y], [PR_X, FEAT_Y], [PR_X, MAIN_Y - DOT / 2 - 3]]
const RIDE_MAIN = K.ride('t11-main', mainPts, 0, 3.2, 4.2)
const RIDE_FEAT = K.ride('t11-feat', featPts, 0.6, 3.0, 4.2)
const RIDE_PR = K.ride('t11-pr', [[FEAT_FORK, MAIN_Y - DOT / 2], [FEAT_FORK, FEAT_Y], [PR_X, FEAT_Y], [PR_X, MAIN_Y - DOT / 2]], 0.2, 3.6, 4.4)
/* snapshot flashes: one halo per commit, walking left to right */
const FLASH_N = MAIN_DOTS.length + FEAT_DOTS.length
const FLASH = Array.from({ length: FLASH_N }, (_, i) => {
  const a = (i / FLASH_N) * 100
  const b = a + 6
  return loop(`flash${i}`, `0%, ${a.toFixed(1)}% { opacity: 0; transform: scale(0.6) } ${(a + 2).toFixed(1)}% { opacity: 1; transform: scale(1.05) } ${b.toFixed(1)}%, 100% { opacity: 0; transform: scale(1.4) }`, 4.9)
})

function Repo({ p, b }: { p: Record<string, unknown>; b: 'A' | 'B' }) {
  const { s, hot, held } = useBuild(p)
  const isB = b === 'B'
  const histOn = isB || s(1)
  const featOn = isB || s(2)
  const prOn = isB && s(2)
  const flashOn = isB && s(1)
  const litRepo = !isB && hot === 0
  const litFeat = !isB && hot === 1
  const litPr = isB && hot === 1
  const litDots = isB && hot === 0
  /* cameras above the feature dots, below the main dots (clear of the pull request's drop onto main) */
  const camY = (y: number) => (y === MAIN_Y ? y + 32 : y - 31)
  return (
    <Frame w={560} h={380}>
      <Panel x={R.x} y={R.y} w={R.w} h={R.h} lit={litRepo} />
      <CardHead x={R.x + 20} y={R_HEAD_Y} mark={gitMark} text="Repository" size={40} />
      {/* the change history: folder + clock, top right of the card */}
      <Show on={histOn} style={{ position: 'absolute', left: R.x + R.w - 20 - 168, top: R_HEAD_Y - 17, width: 168, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, zIndex: 6 }}>
        <span style={tag(14)}>History</span>
        <Plinth size={34} lit={litRepo}><Ico3D name="folder" size={25} loop="bob" /></Plinth>
        <Plinth size={34} lit={litRepo}><Ico3D name="clock" size={25} loop="spin" t={6} /></Plinth>
      </Show>
      {/* main */}
      <Pill x={PILL_L} y={MAIN_Y} text="main" c={BLUE} w={60} />
      <W pts={mainPts} color={BLUE} />
      {MAIN_DOTS.map((x, i) => <Dot key={x} x={x} y={MAIN_Y} c={BLUE} lit={litDots || (litPr && x === PR_X)} cls={loopCls('glow')} d={i * 0.4} />)}
      {/* feature */}
      <Pill x={FEAT_FORK - 52} y={FEAT_Y} text="feature" c={TEAL} w={82} on={featOn} lit={litFeat} />
      <W pts={featPts} color={TEAL} on={featOn} lit={litFeat} />
      {FEAT_DOTS.map((x, i) => <Dot key={x} x={x} y={FEAT_Y} c={TEAL} on={featOn} lit={litDots} delay={400 + i * 160} cls={loopCls('glow')} d={i * 0.5 + 0.2} />)}
      {/* T11-B: every commit a snapshot (a camera over each dot, a flash walking along) */}
      {[...MAIN_DOTS.map((x) => [x, MAIN_Y] as Pt), ...FEAT_DOTS.map((x) => [x, FEAT_Y] as Pt)].map(([x, y], i) => (
        <Show key={`c${i}`} on={flashOn} delay={i * 90} style={{ position: 'absolute', left: x - 12, top: camY(y) - 12, width: 24, height: 24, zIndex: 6 }}>
          {!held && <span aria-hidden className={FLASH[i]} style={{ position: 'absolute', inset: -7, borderRadius: 99, background: 'radial-gradient(closest-side, rgba(255,255,255,1), rgba(255,214,120,0.55), rgba(255,214,120,0))', opacity: 0 }} />}
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Ico3D name="photo" size={24} loop="none" /></span>
        </Show>
      ))}
      {/* T11-B: the pull request merges feature back into main */}
      {isB && <W pts={prPts} color={TEAL} on={prOn} lit={litPr} head={11} width={LINE_W} />}
      {isB && <Tile x={(FEAT_DOTS[1] + PR_X) / 2 + 4} y={FEAT_Y} icon="merge" size={34} on={prOn} lit={litPr} loop="pulse" delay={500} z={7} />}
      {/* flow dots */}
      <Token cls={RIDE_MAIN} tone={BLUE} />
      {featOn && !prOn && <Token cls={RIDE_FEAT} tone={TEAL} />}
      {prOn && <Token cls={RIDE_PR} tone={TEAL} />}
      {/* hosting services under the card */}
      <div style={{ position: 'absolute', left: 20, top: R.y + R.h + 24, width: 520, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', zIndex: 4 }}>
        {HOSTS.map((hst) => (
          <div key={hst.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MarkTile src={hst.src} size={46} />
            <span style={{ ...tag(15) }}>{hst.name}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}
const D_T11: Fig = (p) => <Repo p={p} b="A" />
const D_T11B: Fig = (p) => <Repo p={p} b="B" />

/* ================================================================== T12: commits and branches */

const T12_MAIN_Y = 250
const T12_FEAT_Y = 126
const T12_MAIN = [64, 160, 276, 392, 472]
const T12_FORK = T12_MAIN[1]
const T12_JOIN = T12_MAIN[3]
const T12_FEAT = [232, 320]
const t12Main: Pt[] = [[36, T12_MAIN_Y], [504, T12_MAIN_Y]]
const t12Feat: Pt[] = [[T12_FORK, T12_MAIN_Y - DOT / 2], [T12_FORK, T12_FEAT_Y], [T12_JOIN, T12_FEAT_Y], [T12_JOIN, T12_MAIN_Y - DOT / 2]]
const RIDE12_M = K.ride('t12-main', t12Main, 0, 3.4, 4.4)
const RIDE12_F = K.ride('t12-feat', t12Feat, 0.5, 3.6, 4.4)
/* HEAD sits over the main tip (x 452), then switches to the feature tip (x 300) and back: a 6 s walk */
const HEAD_MAIN: Pt = [T12_MAIN[4], T12_MAIN_Y - 84]
const HEAD_FEAT: Pt = [T12_FEAT[1], T12_FEAT_Y - 84]
const HEAD_WALK = loop('head', `0%, 36% { transform: translate(0px, 0px) } 48%, 84% { transform: translate(${HEAD_FEAT[0] - HEAD_MAIN[0]}px, ${HEAD_FEAT[1] - HEAD_MAIN[1]}px) } 96%, 100% { transform: translate(0px, 0px) }`, 6)
const D_T12: Fig = (p) => {
  const { s, hot } = useBuild(p)
  const litMain = hot === 1
  return (
    <Frame w={540} h={380}>
      <W pts={t12Main} color={BLUE} lit={litMain} />
      <W pts={t12Feat} color={TEAL} />
      {T12_MAIN.map((x, i) => <Dot key={x} x={x} y={T12_MAIN_Y} c={BLUE} lit={litMain} cls={loopCls('glow')} d={i * 0.4} />)}
      {T12_FEAT.map((x, i) => <Dot key={x} x={x} y={T12_FEAT_Y} c={TEAL} cls={loopCls('glow')} d={i * 0.5 + 0.2} />)}
      {T12_MAIN.map((x) => <HashTag key={`h${x}`} x={x} y={T12_MAIN_Y + 26} />)}
      {T12_FEAT.map((x) => <HashTag key={`h${x}`} x={x} y={T12_FEAT_Y + 26} />)}
      {/* point 2: main, the pointer to the stable line's tip */}
      <Pill x={T12_MAIN[4]} y={T12_MAIN_Y - 40} text="main" c={BLUE} w={60} caret on={s(2)} lit={litMain} />
      {/* point 3: a new branch is only a pointer (instant) */}
      <Pill x={T12_FEAT[1]} y={T12_FEAT_Y - 40} text="feature" c={TEAL} w={82} caret on={s(3)} lit={hot === 2} />
      <Tile x={T12_FEAT[1] + 41 + 12 + 17} y={T12_FEAT_Y - 40} icon="bolt" size={34} on={s(3)} lit={hot === 2} loop="pulse" delay={200} />
      {/* point 1: HEAD, walking between the two tips once the build is done */}
      <Show on={s(1)} style={{ position: 'absolute', left: HEAD_MAIN[0] - 44, top: HEAD_MAIN[1] - 15, width: 88, height: 30, zIndex: 8 }}>
        <div className={s(3) && hot >= 0 ? HEAD_WALK : undefined} style={{ position: 'absolute', inset: 0 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF1E6 100%)', boxShadow: hot === 0 ? `inset 0 0 0 2.5px ${ORANGE}, 0 6px 14px -8px rgba(255,138,61,0.8)` : 'inset 0 0 0 2px #FFD2B0, 0 6px 14px -9px rgba(31,64,140,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Ico3D name="pin" size={20} loop="bob" />
            <span style={{ fontFamily: MONO, ...NOLIG, fontWeight: 700, fontSize: 14, lineHeight: 1, color: colors.brandDeep }}>HEAD</span>
          </span>
          <span aria-hidden style={{ position: 'absolute', left: 39, bottom: -6, width: 10, height: 10, transform: 'rotate(45deg)', background: '#FFF1E6', boxShadow: hot === 0 ? `2.5px 2.5px 0 0 ${ORANGE}` : '2px 2px 0 0 #FFD2B0', borderRadius: 2 }} />
        </div>
      </Show>
      <Token cls={RIDE12_M} tone={BLUE} />
      <Token cls={RIDE12_F} tone={TEAL} />
    </Frame>
  )
}

/* ================================================================== T13: merging */

const FF = { x: 20, y: 20, w: 500, h: 160 }
const TW = { x: 20, y: 200, w: 500, h: 160 }
const FF_Y = 132
const FF_MAIN = [90, 190]
const FF_FEAT = [300, 410]
const FF_SLIDE = FF_FEAT[1] - FF_MAIN[1]
const MAIN_SLIDE = loop('ff', `0%, 18% { transform: translateX(0px) } 52%, 86% { transform: translateX(${FF_SLIDE}px) } 96%, 100% { transform: translateX(0px) }`, 5)
const TW_F = 270 // feature line y
const TW_M = 330 // main line y
const TW_FORK = 110
const TW_MAIN = [70, 110, 220, 300]
const TW_FEAT = [190, 270]
const DIA_X = 420
const twMain: Pt[] = [[52, TW_M], [DIA_X - 13, TW_M]]
const twFeat: Pt[] = [[TW_FORK, TW_M - DOT / 2], [TW_FORK, TW_F], [TW_FEAT[1] + 30, TW_F]]
const twMerge: Pt[] = [[TW_FEAT[1] + DOT / 2, TW_F], [DIA_X, TW_F], [DIA_X, TW_M - 16]]
const ffLine: Pt[] = [[60, FF_Y], [FF_FEAT[1] + 30, FF_Y]]
const RIDE13_FF = K.ride('t13-ff', ffLine, 0, 3, 4.2)
const RIDE13_TW = K.ride('t13-tw', [[TW_FORK, TW_M - DOT / 2], [TW_FORK, TW_F], [DIA_X, TW_F], [DIA_X, TW_M - 16]], 0.3, 3.4, 4.2)
const RIDE13_M = K.ride('t13-m', [[52, TW_M], [DIA_X - 14, TW_M]], 0.3, 3.4, 4.2)
const D_T13: Fig = (p) => {
  const { s, hot, held } = useBuild(p)
  const conflict = s(2)
  const merged = s(3)
  return (
    <Frame w={540} h={380}>
      {/* fast-forward: main had no new commits, so its pointer just slides forward */}
      <Panel x={FF.x} y={FF.y} w={FF.w} h={FF.h} lit={hot === 0} />
      <CardHead x={FF.x + 20} y={FF.y + 36} icon="play" text="Fast-Forward" lit={hot === 0} />
      <W pts={[[60, FF_Y], [FF_MAIN[1], FF_Y]]} color={BLUE} />
      <W pts={[[FF_MAIN[1], FF_Y], [FF_FEAT[1] + 30, FF_Y]]} color={TEAL} />
      {FF_MAIN.map((x, i) => <Dot key={x} x={x} y={FF_Y} c={BLUE} cls={loopCls('glow')} d={i * 0.4} />)}
      {FF_FEAT.map((x, i) => <Dot key={x} x={x} y={FF_Y} c={TEAL} cls={loopCls('glow')} d={i * 0.4 + 0.3} />)}
      <Pill x={FF_MAIN[1] + (held && s(1) ? FF_SLIDE : 0)} y={FF_Y - 40} text="main" c={BLUE} w={60} caret lit={hot === 0} cls={s(1) && !held ? MAIN_SLIDE : undefined} />
      <Token cls={RIDE13_FF} tone={TEAL} />
      {/* three-way: both lines moved on; a new diamond commit joins them */}
      <Panel x={TW.x} y={TW.y} w={TW.w} h={TW.h} lit={hot === 2} />
      <CardHead x={TW.x + 20} y={TW.y + 36} icon="merge" text="Three-Way Merge" lit={hot === 2} loop="pulse" />
      <W pts={twMain} color={BLUE} />
      <W pts={twFeat} color={TEAL} />
      {TW_MAIN.map((x, i) => <Dot key={x} x={x} y={TW_M} c={BLUE} lit={conflict && hot === 1 && x === TW_MAIN[3]} cls={loopCls('glow')} d={i * 0.4} />)}
      {TW_FEAT.map((x, i) => <Dot key={x} x={x} y={TW_F} c={TEAL} lit={conflict && hot === 1 && x === TW_FEAT[1]} cls={loopCls('glow')} d={i * 0.4 + 0.2} />)}
      {/* point 2: the same lines changed differently: a conflict a person resolves */}
      <Tile x={348} y={(TW_F + TW_M) / 2} icon="alert" size={34} on={conflict} lit={hot === 1} loop="pulse" />
      <Tile x={348 + 34 + 8} y={(TW_F + TW_M) / 2} icon="user" size={34} on={conflict} lit={hot === 1} loop="bob" delay={200} />
      {/* point 3: the merge commit */}
      <W pts={twMerge} color={TEAL} on={merged} lit={hot === 2} head={11} />
      <Diamond x={DIA_X} y={TW_M} on={merged} lit={hot === 2} />
      <W pts={[[DIA_X + 13, TW_M], [470, TW_M]]} color={BLUE} on={merged} />
      <Token cls={RIDE13_M} tone={BLUE} />
      {merged && <Token cls={RIDE13_TW} tone={TEAL} />}
    </Frame>
  )
}

/* ================================================================== T15-B: two branching workflows */

const TB = { x: 20, y: 20, w: 520, h: 150 } // trunk-based card
const FB = { x: 20, y: 190, w: 520, h: 190 } // feature-branch card
const SD = 14 // the smaller commit dot
const TB_M = 136 // main y
const TB_UP = 96 // short branch y
const BUMPS = [[86, 150], [184, 248], [282, 346]] as const // fork x, join x
const FLAG_FORK = 400
const FLAG_END = 452
const BUMP_POP = BUMPS.map((_, i) => {
  const a = i * 22
  return loop(`bump${i}`, `0%, ${a}% { opacity: 0.45 } ${a + 6}%, ${a + 60}% { opacity: 1 } ${a + 70}%, 100% { opacity: 0.45 }`, 6)
})
const FB_LONG = 256 // the long branch y
const FB_M = 304 // main y
const FB_FORK = 80
const FB_JOIN = 440
const FB_LONG_DOTS = [150, 220, 290, 360]
const FB_MAIN_DOTS = [80, 170, 370, 440]
const SHORT = [[226, 300]] as const
const SHORT_Y = 340
const LONG_GROW = FB_LONG_DOTS.map((_, i) => loop(`grow${i}`, `0%, ${i * 18}% { opacity: 0.3; transform: scale(0.8) } ${i * 18 + 8}%, 88% { opacity: 1; transform: scale(1) } 96%, 100% { opacity: 0.3; transform: scale(0.8) }`, 6))
const CONFLICT = loop('conflict', `0%, 100% { transform: scale(0.88) } 50% { transform: scale(1.12) }`, 2.4)
const tbMain: Pt[] = [[52, TB_M], [498, TB_M]]
const fbMain: Pt[] = [[52, FB_M], [498, FB_M]]
const fbLong: Pt[] = [[FB_FORK, FB_M - SD / 2], [FB_FORK, FB_LONG], [FB_JOIN, FB_LONG], [FB_JOIN, FB_M - SD / 2 - 3]]
const RIDE15_T = K.ride('t15-t', tbMain, 0, 3.6, 4.6)
const RIDE15_F = K.ride('t15-f', fbLong, 0.4, 4.2, 5)
const bumpPts = (a: number, b: number): Pt[] => [[a, TB_M - SD / 2], [a, TB_UP], [b, TB_UP], [b, TB_M - SD / 2]]
const D_T15B: Fig = (p) => {
  const { s, hot, held } = useBuild(p)
  return (
    <Frame w={560} h={400}>
      {/* trunk-based: many short branches merged into main almost daily */}
      <Panel x={TB.x} y={TB.y} w={TB.w} h={TB.h} lit={hot === 0} />
      <CardHead x={TB.x + 20} y={TB.y + 35} icon="branch" text="Trunk-Based" size={30} />
      <W pts={tbMain} color={BLUE} />
      {BUMPS.map(([a, b], i) => (
        <div key={a} className={held ? undefined : BUMP_POP[i]} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <W pts={bumpPts(a, b)} color={TEAL} width={3.4} />
          <Dot x={(a + b) / 2} y={TB_UP} c={TEAL} size={SD} />
        </div>
      ))}
      {[...BUMPS.flat(), FLAG_FORK, 490].map((x, i) => <Dot key={`m${i}`} x={x} y={TB_M} c={BLUE} size={SD} />)}
      {/* point 1: an unfinished short branch, its work hidden behind a feature flag */}
      <W pts={[[FLAG_FORK, TB_M - SD / 2], [FLAG_FORK, TB_UP], [FLAG_END - 22, TB_UP]]} color={TEAL} width={3.4} on={s(1)} lit={hot === 0} dash={undefined} />
      <Dot x={FLAG_FORK + 22} y={TB_UP} c={TEAL} size={SD} on={s(1)} />
      <Tile x={FLAG_END + 8} y={TB_UP} icon="toggle" size={34} on={s(1)} lit={hot === 0} loop="pulse" delay={300} />
      <Token cls={RIDE15_T} tone={BLUE} size={9} />
      {/* feature-branch: one long branch, merged once at the end */}
      <Panel x={FB.x} y={FB.y} w={FB.w} h={FB.h} lit={hot === 1 || hot === 2} />
      <CardHead x={FB.x + 20} y={FB.y + 34} icon="merge" text="Feature-Branch" size={30} loop="pulse" />
      <W pts={fbMain} color={BLUE} />
      <W pts={fbLong} color={TEAL} head={s(2) ? 10 : 0} lit={hot === 1} />
      {FB_MAIN_DOTS.map((x) => <Dot key={x} x={x} y={FB_M} c={BLUE} size={SD} lit={hot === 1 && x === FB_JOIN} />)}
      {FB_LONG_DOTS.map((x, i) => (
        <Dot key={x} x={x} y={FB_LONG} c={TEAL} size={SD} cls={held || !s(2) ? undefined : LONG_GROW[i]} />
      ))}
      {/* point 2: the late merge brings a large conflict, growing with the branch's age */}
      <Show on={s(2)} style={{ position: 'absolute', left: FB_JOIN + 22, top: (FB_LONG + FB_M) / 2 - 17 - 4, width: 34, height: 34, zIndex: 6 }}>
        <div className={held ? undefined : CONFLICT} style={{ position: 'absolute', inset: 0 }}>
          <Plinth size={34} lit={hot === 1}><Ico3D name="hourglass" size={25} loop="none" /></Plinth>
        </div>
      </Show>
      {/* point 3: a short-lived feature branch on the same line (below main) */}
      {SHORT.map(([a, b]) => (
        <div key={a} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <W pts={[[a, FB_M + SD / 2], [a, SHORT_Y], [b, SHORT_Y], [b, FB_M + SD / 2 + 2]]} color={TEAL} width={3.4} on={s(3)} lit={hot === 2} head={9} />
          <Dot x={(a + b) / 2} y={SHORT_Y} c={TEAL} size={SD} on={s(3)} lit={hot === 2} delay={500} />
          <Dot x={a} y={FB_M} c={BLUE} size={SD} on={s(3)} />
          <Dot x={b} y={FB_M} c={BLUE} size={SD} on={s(3)} />
          <Tile x={b + 44} y={SHORT_Y} icon="branch" size={30} on={s(3)} lit={hot === 2} delay={600} />
        </div>
      ))}
      {s(2) && <Token cls={RIDE15_F} tone={TEAL} size={9} />}
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures: Record<string, Fig> = { D_T11, D_T11B, D_T12, D_T13, D_T15B }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s22d-a, .deck-thumb .s22d-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22d-a { animation: none !important; } }',
].join('\n')
