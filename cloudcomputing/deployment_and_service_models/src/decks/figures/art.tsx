import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { mo, type MotionKind } from './motion'
import { R, usePrefix, Shadow, BlurDef, GlowDef, Lin } from './depth'

/**
 * THE OBJECTS EVERY SCENE IS DRAWN FROM (plan decision 3).
 *
 * Flat, in the character lab's style (CONTRACTS.md "Art direction"): flat
 * fills, one shade a step darker where a form turns away, no outlines on big
 * forms, rounded corners. Every colour is a token (content rule 37) except an
 * object's own colour, which is marked where it is used (a taxi is yellow, a
 * cash note is green). Each object is one `<svg>` sized by `w`; its labels are
 * never drawn inside it (content rule 17): a scene puts its labels beside it
 * as DOM.
 *
 * Every state change eases on the house curve and stands still during an
 * instant jump (`useEase`).
 *
 * THE RENDER FINISH (user, 2026-10-16, "slide 5 for image style, same style
 * for all"): every object reads like the reference render's: a solid with a
 * graded front, a lit top face and a shaded side, a thin white edge along
 * its top, a specular on its upper left, a glow on every light, and a soft
 * blurred cool ground shadow under anything that stands (`depth.tsx`: the
 * render's palette `R` and the gradient, glow and shadow helpers, with
 * per-instance ids from `usePrefix`). A graded fill cannot ease, so a state
 * that recolours a part cross-fades two stacked layers on `useEase`. The
 * motion-layer classes stay exactly where they were.
 */

/** Mix a hex colour toward white (t > 0) or black (t < 0): the lit top and the shaded side of a given tone. */
export function tint(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16)
  const to = t > 0 ? 255 : 0
  const k = Math.abs(t)
  const m = (c: number) => Math.round(c + (to - c) * k)
  return `#${[m((n >> 16) & 255), m((n >> 8) & 255), m(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** The deck's cloud outline, shared by every cloud drawn here. */
const CLOUD_D = 'M 30 70 C 12 70 2 58 4 46 C 6 34 16 28 28 29 C 30 14 44 4 60 6 C 74 7 84 16 87 27 C 102 25 116 36 116 50 C 116 62 106 70 94 70 Z'


const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** The transition every drawn state change uses: explanatory tier, none during a jump. */
export function useEase(ms = 520): string {
  return useInstant() ? 'none' : `all ${ms}ms ${HOUSE}`
}

/**
 * THE MOTION LAYER ON THE OBJECTS (user, 2026-10-16): every object carries
 * the loop that says what it is (`motion.ts`). An idle (float, hover) goes
 * on the object's own `<svg>`, so the per-part clay rims are untouched and
 * no state-driven inline transform is overridden; a semantic loop (a
 * blinking light, a typing line, a lifting shackle) goes on that part. Each
 * instance takes its own phase from `useSeed`, so two of the same object
 * never move in step.
 */
function useSeed(): number {
  const id = useId()
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 97
  return h
}

/** The idle for an object's own svg: class and phase. */
function useIdle(kind: MotionKind, dur?: number) {
  const seed = useSeed()
  return { seed, ...mo(kind, seed, dur ? { dur } : {}) }
}

type SvgBox = { w: number; className?: string; style?: CSSProperties }

/**
 * THE CLAY FINISH (review 2026-10-16: every visual in the Character Lab style).
 * The Lab's Library look has no outlines and turns every form by its own
 * shading: a soft darker band on the edge away from the lamp (upper left, in
 * front), a lighter band toward it, shadows deepened in a cool violet-grey
 * multiply so a colour stays its own hue. `ClayDefs` is the Lab's
 * `ClayFilter` (`characters-lab/src/rig/lighting.tsx`) at object scale,
 * mounted once by the deck (`mountClayDefs`); `CLAY` on an `<svg>` puts it
 * on every top-level part, so each part reads as one soft rounded form. A
 * part that must stay flat (a thin line, a text bar) carries `data-flat`.
 */
export const CLAY = 'cc-clay'
const CLAY_FILTERS = [
  // id, blur, offset, shadow, light: the Lab's limb/body steps, scaled to a 120-unit object
  ['cc-clay', 2.6, 2.2, 0.42, 0.34],
  ['cc-clay-lg', 5, 4, 0.4, 0.3],
] as const
const CLAY_DEFS = CLAY_FILTERS.map(
  ([id, blur, off, shadow, light]) => `
  <filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>
    <feOffset in="b" dx="${-off}" dy="${-off * 1.2}" result="bs"/>
    <feComposite in="SourceAlpha" in2="bs" operator="out" result="rimS"/>
    <feFlood flood-color="#2F3F86" flood-opacity="${shadow * 0.8}"/>
    <feComposite in2="rimS" operator="in" result="sh"/>
    <feBlend in="sh" in2="SourceGraphic" mode="multiply" result="shaded"/>
    <feOffset in="b" dx="${off}" dy="${off * 1.2}" result="bh"/>
    <feComposite in="SourceAlpha" in2="bh" operator="out" result="rimH"/>
    <feFlood flood-color="#FFFFFF" flood-opacity="${light * 0.8}"/>
    <feComposite in2="rimH" operator="in" result="hi"/>
    <feMerge><feMergeNode in="shaded"/><feMergeNode in="hi"/></feMerge>
  </filter>`,
).join('')

/** Mount the clay filters once, in a zero-size svg at the end of the body. */
export function mountClayDefs() {
  if (typeof document === 'undefined' || document.getElementById('cc-clay-defs')) return
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  host.id = 'cc-clay-defs'
  host.setAttribute('width', '0')
  host.setAttribute('height', '0')
  host.setAttribute('aria-hidden', 'true')
  host.style.position = 'absolute'
  host.innerHTML = `<defs>${CLAY_DEFS}</defs>`
  document.body.appendChild(host)
}

/** Any svg drawn in a scene: the same viewBox box as the objects here, with the clay finish. */
export function ClaySvg(p: SvgBox & { vw: number; vh: number; large?: boolean; children: ReactNode }) {
  return <Svg {...p} />
}

function Svg({ w, vw, vh, className, style, children, large }: SvgBox & { vw: number; vh: number; large?: boolean; children: ReactNode }) {
  return (
    <svg width={w} height={(w * vh) / vw} viewBox={`0 0 ${vw} ${vh}`} className={`${CLAY}${large ? ' cc-clay-lg' : ''} ${className ?? ''}`} style={{ display: 'block', overflow: 'visible', ...style }} aria-hidden>
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ servers */

/** One server unit's state: running (green light), idle (paid for, nothing on it), off (not there), alarm. */
export type UnitState = 'run' | 'idle' | 'off' | 'hot'

/**
 * A server rack: a tall cabinet holding `units.length` server units, top to
 * bottom. A running unit carries a green light and two lit bars; an idle unit
 * is greyed with its light dark; an `off` unit is an empty slot.
 */
export function Rack({ w, units, locked = false }: { w: number; units: UnitState[]; locked?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  const n = units.length
  const H = 30 + n * 34
  /* the render's view: a pale side face and a lit top, back and up to the left of the graded front */
  const FX = 20
  const FW = 94
  const DX = -12
  const DY = -6
  const top = 12
  const bot = H - 8
  const xr = FX + FW
  return (
    <Svg w={w} vw={120} vh={H} large>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-chassis`} from={R.chassisTop} to={R.chassisBot} />
        <Lin id={`${id}-side`} from={R.sideTop} to={R.sideBot} />
        <Lin id={`${id}-drawer`} from={R.drawerTop} to={R.drawerBot} />
        <Lin id={`${id}-gold`} from={R.goldHi} to={R.goldSide} />
        <GlowDef id={`${id}-gg`} tone={R.ledGreen} />
        <GlowDef id={`${id}-gr`} tone={colors.danger} />
      </defs>
      <Shadow id={id} cx={62} cy={H - 3} rx={54} ry={4} />
      <g>
        <path d={`M ${FX} ${top} L ${FX + DX} ${top + DY} L ${FX + DX} ${bot + DY} L ${FX} ${bot} Z`} fill={`url(#${id}-side)`} />
        <path d={`M ${FX} ${top} L ${FX + DX} ${top + DY} L ${xr + DX} ${top + DY} L ${xr} ${top} Z`} fill={R.topFace} />
        <rect x={FX} y={top} width={FW} height={bot - top} rx={7} fill={`url(#${id}-chassis)`} />
        <rect x={FX} y={top} width={FW} height={2} fill="#FFFFFF" opacity={0.18} />
      </g>
      {units.map((u, i) => {
        const y = 22 + i * 34
        const live = u === 'run' || u === 'hot'
        const lx = xr - 14
        const ly = y + 14
        return (
          <g key={i} className={mo('pulse', seed + i * 3).className} style={{ transition: ease, opacity: u === 'off' ? 0.3 : 1, ...mo('pulse', seed + i * 3).style }}>
            <rect x={FX + 8} y={y} width={FW - 16} height={28} rx={4} fill={`url(#${id}-drawer)`} />
            <rect x={FX + 8} y={y} width={FW - 16} height={28} rx={4} fill={R.drawerIdle} opacity={live ? 0 : 0.85} style={{ transition: ease }} />
            <rect x={FX + 8} y={y} width={FW - 16} height={1.5} fill="#FFFFFF" opacity={0.14} />
            {u !== 'off' && (
              <>
                <rect x={FX + 18} y={y + 8} width={36} height={4} rx={2} fill={live ? R.barA : R.barIdle} style={{ transition: ease }} />
                <rect x={FX + 18} y={y + 16} width={24} height={4} rx={2} fill={live ? R.barB : R.barIdle} opacity={live ? 1 : 0.7} style={{ transition: ease }} />
                <circle cx={lx} cy={ly} r={10} fill={`url(#${id}-${u === 'hot' ? 'gr' : 'gg'})`} opacity={live ? 1 : 0} style={{ transition: ease }} />
                {/* a running light blinks at its own interval */}
                <circle cx={lx} cy={ly} r={5} fill={u === 'hot' ? colors.danger : live ? R.ledGreen : R.ledOff} className={live ? mo('blink', seed + i * 5).className : undefined} style={{ transition: ease, ...(live ? mo('blink', seed + i * 5).style : {}) }} />
                <circle cx={lx - 1.5} cy={ly - 1.5} r={1.4} fill="#FFFFFF" opacity={live ? 0.8 : 0.15} style={{ transition: ease }} />
              </>
            )}
          </g>
        )
      })}
      {locked && (
        <g transform={`translate(${FX + FW / 2} ${H - 14})`}>
          <rect x={-11} y={-6} width={22} height={16} rx={3} fill={`url(#${id}-gold)`} />
          <path d="M -6 -6 V -11 A 6 6 0 0 1 6 -11 V -6" fill="none" stroke={R.goldSide} strokeWidth={3} />
        </g>
      )}
    </Svg>
  )
}

/** One server, drawn as a flat unit, for tiles and pools. */
export function ServerUnit({ w, state = 'run' }: { w: number; state?: UnitState }) {
  const ease = useEase()
  const live = state === 'run' || state === 'hot'
  const idle = useIdle('pulse')
  const id = usePrefix()
  return (
    <Svg w={w} vw={80} vh={30} className={idle.className} style={idle.style}>
      <defs>
        <Lin id={`${id}-front`} from={R.chassisTop} to={R.drawerBot} />
        <GlowDef id={`${id}-gg`} tone={state === 'hot' ? colors.danger : R.ledGreen} />
      </defs>
      {/* the frosted slab (there, not in use) and the navy slab (running) are stacked and cross-fade: a graded fill cannot ease */}
      <g style={{ opacity: live ? 0 : state === 'off' ? 0.45 : 0.9, transition: ease }}>
        <path d="M 73 6 L 79 1 L 79 23 L 73 29 Z" fill={R.frostSide} />
        <path d="M 1 6 L 7 1 L 79 1 L 73 6 Z" fill={R.frostTop} />
        <rect x={1} y={6} width={72} height={23} rx={5} fill={R.frostFront} />
        <rect x={10} y={12} width={30} height={4} rx={2} fill="#FFFFFF" opacity={0.9} />
        <rect x={10} y={19} width={20} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
        <circle cx={64} cy={17} r={4} fill={R.ledFrost} />
      </g>
      <g style={{ opacity: live ? 1 : 0, transition: ease }}>
        <path d="M 73 6 L 79 1 L 79 23 L 73 29 Z" fill={R.drawerBot} />
        <path d="M 1 6 L 7 1 L 79 1 L 73 6 Z" fill={R.sideBot} />
        <rect x={1} y={6} width={72} height={23} rx={5} fill={`url(#${id}-front)`} />
        <rect x={1} y={6} width={72} height={1.5} fill="#FFFFFF" opacity={0.16} />
        <rect x={10} y={12} width={30} height={4} rx={2} fill={R.barA} />
        <rect x={10} y={19} width={20} height={4} rx={2} fill={R.barB} />
        <circle cx={64} cy={17} r={9} fill={`url(#${id}-gg)`} />
        <circle cx={64} cy={17} r={4} fill={state === 'hot' ? colors.danger : R.ledGreen} className={mo('blink', idle.seed + 11).className} style={mo('blink', idle.seed + 11).style} />
        <circle cx={62.8} cy={15.8} r={1.2} fill="#FFFFFF" opacity={0.8} />
      </g>
    </Svg>
  )
}

/* ------------------------------------------------------------------ devices */

/** A laptop, its screen holding whatever the scene puts there (DOM, laid over by the caller). */
export function Laptop({ w, screen = colors.surface2, glow = false }: { w: number; screen?: string; glow?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  return (
    <Svg w={w} vw={160} vh={104} large>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-lid`} from={R.chassisTop} to={R.drawerBot} />
        <Lin id={`${id}-base`} from={R.sideTop} to={R.sideBot} />
        <Lin id={`${id}-glow`} from={R.cloudTop} to={R.cloudBot} />
      </defs>
      <Shadow id={id} cx={80} cy={101} rx={70} ry={3.5} />
      <g>
        <rect x={18} y={4} width={124} height={80} rx={8} fill={`url(#${id}-lid)`} />
        <rect x={18} y={4} width={124} height={2} fill="#FFFFFF" opacity={0.2} />
        <rect x={25} y={11} width={110} height={66} rx={4} fill={screen} style={{ transition: ease }} />
        <rect x={25} y={11} width={110} height={66} rx={4} fill={`url(#${id}-glow)`} opacity={glow ? 1 : 0} style={{ transition: ease }} />
        {/* the screen's sheen types on from the left (motion layer: a screen shimmers in sequence) */}
        <rect x={25} y={11} width={110} height={66} rx={4} fill={colors.white} fillOpacity={0.14} data-flat {...mo('type', seed)} />
        <rect x={25} y={11} width={110} height={1.5} fill="#FFFFFF" opacity={0.25} />
      </g>
      <g>
        <path d="M 4 88 H 156 L 148 100 H 12 Z" fill={`url(#${id}-base)`} />
        <path d="M 4 88 H 156 L 154 91 H 6 Z" fill="#FFFFFF" opacity={0.35} />
        <rect x={66} y={88} width={28} height={4} rx={2} fill={R.chassisBot} opacity={0.5} />
      </g>
    </Svg>
  )
}

/** A desktop computer: monitor on a stand, a small tower beside it. */
export function Desktop({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  return (
    <Svg w={w} vw={150} vh={110}>
      <rect x={4} y={6} width={104} height={70} rx={7} fill={colors.brandDeep} />
      <rect x={11} y={13} width={90} height={56} rx={3} fill={lit ? colors.brand : colors.surface2} style={{ transition: ease }} />
      <rect x={11} y={13} width={90} height={56} rx={3} fill={colors.white} fillOpacity={0.14} data-flat {...mo('type', seed)} />
      <rect x={50} y={76} width={12} height={16} fill={colors.muted} />
      <rect x={34} y={92} width={44} height={8} rx={3} fill={colors.muted} />
      <rect x={116} y={30} width={30} height={70} rx={5} fill={colors.night3} />
      <circle cx={131} cy={44} r={4} fill={lit ? colors.success : colors.muted} className={lit ? mo('blink', seed + 2).className : undefined} style={{ transition: ease, ...(lit ? mo('blink', seed + 2).style : {}) }} />
    </Svg>
  )
}

/** A phone at real proportions (1 : 2.06, generate-slides 2b item 13). */
export function MiniPhone({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  return (
    <Svg w={w} vw={50} vh={103}>
      <rect x={1} y={1} width={48} height={101} rx={9} fill={colors.brandDeep} />
      <rect x={4.5} y={7} width={41} height={88} rx={5} fill={lit ? colors.brand : colors.surface2} style={{ transition: ease }} />
      <rect x={4.5} y={7} width={41} height={88} rx={5} fill={colors.white} fillOpacity={0.14} data-flat {...mo('type', seed)} />
      <rect x={19} y={3} width={12} height={2.4} rx={1.2} fill={colors.night3} />
    </Svg>
  )
}

/** A terminal at a desk: a boxy screen with green text lines, a keyboard below. */
export function Terminal({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  return (
    <Svg w={w} vw={100} vh={90}>
      <rect x={8} y={4} width={84} height={60} rx={8} fill={colors.muted} />
      <rect x={15} y={10} width={70} height={46} rx={4} fill={colors.night} />
      {/* a lit terminal types its lines one after another, then its caret blinks; an unlit one keeps its dim lines */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={21} y={18 + i * 10} width={i === 1 ? 30 : 44} height={4} rx={2} fill={colors.success} opacity={lit ? 1 : 0.25} className={lit ? 'mo mo-type mo-left' : undefined} style={{ transition: ease, ...(lit ? { '--mo-delay': `${(seed % 5) * 0.3 + i * 0.45}s` } : {}) } as CSSProperties} />
      ))}
      {lit && <rect x={21} y={46} width={3} height={5} rx={1} fill={colors.success} {...mo('cursor', seed)} />}
      <path d="M 4 70 H 96 L 90 86 H 10 Z" fill={colors.line} />
    </Svg>
  )
}

/** The mainframe: a row of tall cabinets with two tape reels and a light panel. */
export function Mainframe({ w, busy = false }: { w: number; busy?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  return (
    <Svg w={w} vw={200} vh={150} large>
      <defs>
        <BlurDef id={id} sd={4} />
        <Lin id={`${id}-chassis`} from={R.chassisTop} to={R.chassisBot} />
        <Lin id={`${id}-cab`} from={R.drawerTop} to={R.drawerBot} />
        <Lin id={`${id}-reel`} from={R.frostTop} to={R.frostSide} />
        <GlowDef id={`${id}-gg`} tone={R.ledGreen} />
        <GlowDef id={`${id}-gy`} tone={colors.warning} />
      </defs>
      <Shadow id={id} cx={100} cy={147} rx={92} ry={4} />
      <g>
        <rect x={4} y={10} width={192} height={134} rx={10} fill={`url(#${id}-chassis)`} />
        <rect x={4} y={10} width={192} height={2} fill="#FFFFFF" opacity={0.2} />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={14 + i * 62} y={20} width={54} height={114} rx={6} fill={`url(#${id}-cab)`} />
          <rect x={14 + i * 62} y={20} width={54} height={1.5} fill="#FFFFFF" opacity={0.14} />
        </g>
      ))}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${41 + i * 62} 52)`}>
          {/* the tape reels turn slowly (motion layer); the busy state's quarter-turn eases on top of it */}
          <g {...mo(i === 0 ? 'spin' : 'spin-ccw', seed + i)}>
            <circle r={18} fill={`url(#${id}-reel)`} />
            <circle r={6} fill={R.drawerBot} />
            <circle cx={-6} cy={-7} r={4} fill="#FFFFFF" opacity={0.5} />
            <circle r={12} fill="none" stroke={R.sideBot} strokeWidth={2} strokeDasharray="4 5" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: busy ? 'rotate(120deg)' : 'none', transition: ease }} />
          </g>
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <circle cx={148 + (i % 3) * 12} cy={40 + Math.floor(i / 3) * 14} r={8} fill={`url(#${id}-${i % 2 === 0 ? 'gg' : 'gy'})`} opacity={busy ? 1 : 0} style={{ transition: ease }} />
          <circle cx={148 + (i % 3) * 12} cy={40 + Math.floor(i / 3) * 14} r={4} fill={busy && i % 2 === 0 ? R.ledGreen : busy ? colors.warning : R.ledOff} className={mo('blink', seed + i * 7).className} style={{ transition: ease, ...mo('blink', seed + i * 7).style }} />
        </g>
      ))}
      <rect x={140} y={80} width={40} height={6} rx={3} fill={R.barB} opacity={0.8} className="mo mo-type mo-left" style={{ '--mo-delay': `${(seed % 5) * 0.3}s` } as CSSProperties} />
      <rect x={140} y={94} width={30} height={6} rx={3} fill={R.barA} opacity={0.8} className="mo mo-type mo-left" style={{ '--mo-delay': `${(seed % 5) * 0.3 + 0.45}s` } as CSSProperties} />
    </Svg>
  )
}

/* ------------------------------------------------------------------ places */

/** The cloud mark: a soft cloud shape. `tone` fills it. */
export function CloudShape({ w, fill = colors.brand, shade = colors.brandDark }: { w: number; fill?: string; shade?: string }) {
  const idle = useIdle('levitate')
  const id = usePrefix()
  /* the render's azure for the deck's own cloud; any other tone is graded the same way from itself */
  const own = fill === colors.brand
  const top = own ? R.cloudTop : tint(fill, 0.35)
  const mid = own ? R.cloudMid : fill
  const bot = own ? R.cloudBot : tint(fill, -0.18)
  const under = own ? R.cloudUnder : shade
  return (
    <Svg w={w} vw={120} vh={74} large className={idle.className} style={idle.style}>
      <defs>
        <Lin id={`${id}-body`} from={top} to={bot}>
          <stop offset="0.55" stopColor={mid} />
        </Lin>
        <radialGradient id={`${id}-bloom`} cx="36%" cy="28%" r="45%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={CLOUD_D} />
        </clipPath>
      </defs>
      <g>
        <path d={CLOUD_D} fill={`url(#${id}-body)`} />
        <path d="M 30 70 C 18 70 9 63 6 54 C 20 60 90 62 115 52 C 114 63 105 70 94 70 Z" fill={under} opacity={0.6} />
        <rect x={0} y={0} width={120} height={74} fill={`url(#${id}-bloom)`} clipPath={`url(#${id}-clip)`} />
        <ellipse cx={46} cy={20} rx={16} ry={6} fill="#FFFFFF" opacity={0.28} />
      </g>
    </Svg>
  )
}

/** The provider's data centre: a long low building with a cloud on its roof and lit windows. */
export function ProviderBuilding({ w, lit = 0 }: { w: number; lit?: number }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  return (
    <Svg w={w} vw={220} vh={150} large>
      <defs>
        <BlurDef id={id} sd={4} />
        <Lin id={`${id}-cloud`} from={R.cloudTop} to={R.cloudBot}>
          <stop offset="0.55" stopColor={R.cloudMid} />
        </Lin>
        <Lin id={`${id}-body`} from={R.plinthTop} to={R.plinthFront} />
        <Lin id={`${id}-band`} from={R.tileHi} to={R.tileLo} />
        <Lin id={`${id}-win`} from={R.cloudTop} to={R.cloudMid} />
        <GlowDef id={`${id}-gb`} tone={R.ledBlue} />
      </defs>
      <Shadow id={id} cx={110} cy={147} rx={100} ry={4} />
      <g {...mo('levitate', seed, { dur: 7 })}>
        <path d="M 62 44 C 52 44 46 37 47 30 C 48 23 54 20 60 20 C 62 11 70 6 79 7 C 87 8 92 13 94 19 C 102 18 110 24 110 32 C 110 39 104 44 97 44 Z" fill={`url(#${id}-cloud)`} />
        <ellipse cx={70} cy={17} rx={9} ry={4} fill="#FFFFFF" opacity={0.3} />
      </g>
      <g>
        <rect x={10} y={52} width={200} height={92} rx={10} fill={`url(#${id}-body)`} />
        <rect x={10} y={52} width={200} height={16} rx={8} fill={`url(#${id}-band)`} />
        <rect x={14} y={53} width={192} height={1.5} fill="#FFFFFF" opacity={0.4} />
        <rect x={98} y={118} width={24} height={26} rx={3} fill={R.tileUnder} />
      </g>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 24 + (i % 6) * 31
        const y = 78 + Math.floor(i / 6) * 28
        const on = i < lit
        return (
          <g key={i}>
            <rect x={x - 4} y={y - 4} width={30} height={26} rx={6} fill={`url(#${id}-gb)`} opacity={on ? 1 : 0} style={{ transition: ease }} />
            <rect x={x} y={y} width={22} height={18} rx={3} fill={R.frostFront} />
            <rect x={x} y={y} width={22} height={18} rx={3} fill={`url(#${id}-win)`} opacity={on ? 1 : 0} className={on ? mo('blink', seed + i * 5).className : undefined} style={{ transition: ease, ...(on ? mo('blink', seed + i * 5).style : {}) }} />
            <rect x={x + 2} y={y + 1.5} width={18} height={1.5} fill="#FFFFFF" opacity={0.5} />
          </g>
        )
      })}
    </Svg>
  )
}

/** Ravi's locked server room: a closed door with a padlock and a rack window. */
export function ServerRoom({ w, locked = true }: { w: number; locked?: boolean }) {
  const seed = useSeed()
  return (
    <Svg w={w} vw={180} vh={150}>
      <rect x={6} y={20} width={168} height={124} rx={10} fill={colors.line} />
      <path d="M 0 26 L 90 2 L 180 26 Z" fill={colors.muted} />
      <rect x={22} y={44} width={64} height={52} rx={5} fill={colors.brandDeep} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={30} y={52 + i * 14} width={48} height={8} rx={2} fill={colors.brand} opacity={0.75} className="mo mo-type mo-left" style={{ '--mo-delay': `${(seed % 5) * 0.3 + i * 0.45}s` } as CSSProperties} />
      ))}
      <rect x={104} y={60} width={52} height={84} rx={4} fill={colors.brandDark} />
      <circle cx={146} cy={102} r={3} fill={colors.white} {...mo('blink', seed + 3)} />
      {locked && (
        <g transform="translate(130 92)">
          <rect x={-11} y={-4} width={22} height={18} rx={3} fill={colors.warning} />
          <path d="M -6 -4 V -9 A 6 6 0 0 1 6 -9 V -4" fill="none" stroke={colors.warning} strokeWidth={3} {...mo('shackle', seed + 4)} />
        </g>
      )}
    </Svg>
  )
}

/** A world-ish ground: a soft rounded panel with faint latitude lines, not a coastline (reference note: no invented geography). */
export function MapGround({ w, h }: { w: number; h: number }) {
  const id = usePrefix()
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden>
      <defs>
        <Lin id={`${id}-g`} from={R.plinthTop} to={R.plinthTop2} />
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={16} fill={`url(#${id}-g)`} />
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={15} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.8} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={14} x2={w - 14} y1={h * f} y2={h * f} stroke={R.cable} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.7} />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <line key={f} y1={14} y2={h - 14} x1={w * f} x2={w * f} stroke={R.cable} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.7} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ money and time */

/** A stack of coins, `n` high. */
export function Coins({ w, n }: { w: number; n: number }) {
  const ease = useEase()
  const H = 12 + 10 * 12
  const idle = useIdle('hover')
  const id = usePrefix()
  return (
    <Svg w={w} vw={60} vh={H} className={idle.className} style={idle.style}>
      <defs>
        <Lin id={`${id}-side`} from={R.goldSide} to={R.goldSideDark} />
        <radialGradient id={`${id}-top`} cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor={R.goldHi} />
          <stop offset="1" stopColor={R.gold} />
        </radialGradient>
      </defs>
      {Array.from({ length: 10 }, (_, i) => {
        const cy = H - 10 - i * 12
        return (
          <g key={i} style={{ opacity: i < n ? 1 : 0, transform: i < n ? 'none' : 'translateY(-14px)', transition: ease, transitionDelay: `${i * 40}ms` }}>
            <ellipse cx={30} cy={cy + 2} rx={26} ry={8} fill={R.goldSideDark} />
            <rect x={4} y={cy - 4} width={52} height={6} fill={`url(#${id}-side)`} />
            <ellipse cx={30} cy={cy - 4} rx={26} ry={8} fill={`url(#${id}-top)`} />
            <ellipse cx={30} cy={cy - 4} rx={18} ry={5} fill="none" stroke={R.goldSide} strokeWidth={1} opacity={0.5} />
            <ellipse cx={22} cy={cy - 7} rx={9} ry={2.6} fill={R.goldShine} opacity={0.75} />
          </g>
        )
      })}
    </Svg>
  )
}

/** One coin with the rupee mark. */
export function Coin({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={40} vh={40} className={idle.className} style={idle.style}>
      <circle cx={20} cy={20} r={18} fill={colors.warning} />
      <circle cx={20} cy={20} r={13} fill="none" stroke={colors.accentDark} strokeWidth={2} />
      <path d="M 14 13 H 26 M 14 18 H 26 M 16 13 C 24 13 24 23 16 23 L 25 30" fill="none" stroke={colors.accentDark} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/**
 * A meter dial: a needle swept by `value` (0 to 1) and a number wheel under
 * it. `spin` turns the little wheel, the sign that something is being counted.
 */
export function MeterDial({ w, value, spin = false, tone = colors.brand }: { w: number; value: number; spin?: boolean; tone?: string }) {
  /* 300ms, not 700 (user, 2026-10-22 and 23: slide 44's meters quicker) */
  const ease = useEase(300)
  const a = -120 + Math.max(0, Math.min(1, value)) * 240
  const idle = useIdle('hover')
  const id = usePrefix()
  return (
    <Svg w={w} vw={100} vh={100} large className={idle.className} style={idle.style}>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-tile`} from={R.tileHi} to={R.tileLo} x2={1} y2={1} />
        <radialGradient id={`${id}-dial`} cx="50%" cy="46%" r="52%">
          <stop offset="0.78" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={R.dialEdge} />
        </radialGradient>
      </defs>
      <Shadow id={id} cx={50} cy={97} rx={38} ry={4} />
      {/* the render's meter: a cobalt tile with its underside showing, a gloss band, a white dial with a shaded rim */}
      <g>
        <rect x={6} y={10} width={88} height={82} rx={20} fill={R.tileUnder} />
        <rect x={6} y={4} width={88} height={82} rx={20} fill={`url(#${id}-tile)`} />
        <rect x={13} y={8} width={74} height={28} rx={14} fill="#FFFFFF" opacity={0.16} />
        <rect x={8} y={6} width={84} height={2} rx={1} fill="#FFFFFF" opacity={0.3} />
      </g>
      <g>
        <circle cx={50} cy={46} r={31} fill={`url(#${id}-dial)`} />
        <path d="M 29.5 60.5 A 25 25 0 1 1 70.5 60.5" fill="none" stroke={R.arcGrey} strokeWidth={7} strokeLinecap="round" />
        <path d="M 29.5 60.5 A 25 25 0 1 1 70.5 60.5" fill="none" stroke={tone} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 - Math.max(0, Math.min(1, value)), transition: ease }} />
        <g style={{ transformBox: 'view-box', transformOrigin: '50px 46px', transform: `rotate(${a}deg)`, transition: ease }}>
          <path d="M 50 46 L 47.6 30 L 50 22 L 52.4 30 Z" fill={R.needle} />
        </g>
        <circle cx={50} cy={46} r={5} fill={R.needle} />
        <circle cx={49} cy={45} r={1.8} fill="#FFFFFF" opacity={0.8} />
      </g>
      <g transform="translate(50 82)">
        <rect x={-14} y={-6} width={28} height={12} rx={3} fill={R.drawerBot} />
        <circle r={3.5} fill="none" stroke={spin ? R.ledGreen : R.sideBot} strokeWidth={2} strokeDasharray="3 3" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: spin ? 'cc-spin 1.2s linear infinite' : undefined }} />
      </g>
    </Svg>
  )
}

/** A wall calendar with a page that tears: `page` is the number shown. */
export function Calendar({ w, page, label = 'WEEK' }: { w: number; page: number | string; label?: string }) {
  const idle = useIdle('hover')
  return (
    <div className={`relative ${idle.className}`} style={{ width: w, height: w * 1.05, ...idle.style }}>
      <Svg w={w} vw={80} vh={84}>
        <rect x={2} y={8} width={76} height={74} rx={8} fill={colors.white} />
        <rect x={2} y={8} width={76} height={20} rx={8} fill={colors.danger} />
        <rect x={2} y={20} width={76} height={8} fill={colors.danger} />
        <rect x={18} y={2} width={6} height={14} rx={3} fill={colors.muted} />
        <rect x={56} y={2} width={6} height={14} rx={3} fill={colors.muted} />
        <rect x={2} y={8} width={76} height={74} rx={8} fill="none" stroke={colors.line} strokeWidth={2} />
      </Svg>
      {w >= 110 && (
        <span className="absolute inset-x-0 text-center font-heading font-semibold leading-none text-white" style={{ top: w * 0.13, fontSize: w * 0.13 }}>
          {label}
        </span>
      )}
      <span className="absolute inset-x-0 text-center font-heading font-semibold leading-none" style={{ top: w * 0.45, fontSize: w * 0.34, color: colors.ink }}>
        {page}
      </span>
    </div>
  )
}

/** A stopwatch whose hand sits at `turn` (0 to 1 of a lap). */
export function Stopwatch({ w, turn, tone = colors.success }: { w: number; turn: number; tone?: string }) {
  const ease = useEase(700)
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={80} vh={92} className={idle.className} style={idle.style}>
      <rect x={33} y={2} width={14} height={10} rx={3} fill={colors.muted} />
      <circle cx={40} cy={52} r={36} fill={colors.white} />
      <circle cx={40} cy={52} r={36} fill="none" stroke={tone} strokeWidth={5} />
      <path d="M 40 52 L 40 52" />
      <path d={`M 40 52 L 40 22`} stroke={colors.ink} strokeWidth={3.5} strokeLinecap="round" style={{ transformBox: 'view-box', transformOrigin: '40px 52px', transform: `rotate(${turn * 360}deg)`, transition: ease }} />
      <circle cx={40} cy={52} r={4} fill={colors.ink} />
    </Svg>
  )
}

/** A clock face with its hand at `turn` (0 to 1), for scheduled turns. */
export function ClockFace({ w, turn }: { w: number; turn: number }) {
  const ease = useEase(700)
  const seed = useSeed()
  return (
    <Svg w={w} vw={60} vh={60}>
      <circle cx={30} cy={30} r={27} fill={colors.white} stroke={colors.brand} strokeWidth={4} />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={30 + 20 * Math.sin((i * Math.PI) / 6)} cy={30 - 20 * Math.cos((i * Math.PI) / 6)} r={1.6} fill={colors.muted} />
      ))}
      {/* the minute hand ticks round by itself (motion layer: a clock's hands tick); the scene's hand above it keeps its turn */}
      <g style={{ transformBox: 'view-box', transformOrigin: '30px 30px' }} className={mo('tick', seed).className}>
        <path d="M 30 30 L 30 15" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
      </g>
      <path d="M 30 30 L 30 11" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" style={{ transformBox: 'view-box', transformOrigin: '30px 30px', transform: `rotate(${turn * 360}deg)`, transition: ease }} />
      <circle cx={30} cy={30} r={3} fill={colors.ink} />
    </Svg>
  )
}

/** A procurement ticket: a slip with lines and a stamp slot. `struck` crosses it out. */
export function Ticket({ w, struck = false }: { w: number; struck?: boolean }) {
  const ease = useEase()
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={90} vh={60} className={idle.className} style={idle.style}>
      <path d="M 4 6 H 86 V 22 A 8 8 0 0 0 86 38 V 54 H 4 V 38 A 8 8 0 0 0 4 22 Z" fill={colors.white} stroke={colors.line} strokeWidth={2} />
      <rect x={14} y={14} width={44} height={5} rx={2.5} fill={colors.muted} />
      <rect x={14} y={26} width={58} height={4} rx={2} fill={colors.line} />
      <rect x={14} y={35} width={50} height={4} rx={2} fill={colors.line} />
      <rect x={62} y={10} width={18} height={14} rx={3} fill="none" stroke={colors.warning} strokeWidth={2} strokeDasharray="3 2" />
      <path d="M 6 52 L 84 8" stroke={colors.danger} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: struck ? 0 : 1, transition: ease }} />
    </Svg>
  )
}

/** A padlock, open or shut. */
export function Padlock({ w, open = false, tone = colors.warning }: { w: number; open?: boolean; tone?: string }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  const own = tone === colors.warning
  const hi = own ? R.goldHi : tint(tone, 0.4)
  const mid = own ? R.gold : tone
  const lo = own ? R.goldSideDark : tint(tone, -0.25)
  return (
    <Svg w={w} vw={40} vh={48} large>
      <defs>
        <BlurDef id={id} sd={2.5} />
        <Lin id={`${id}-body`} from={hi} to={lo}>
          <stop offset="0.45" stopColor={mid} />
        </Lin>
        <Lin id={`${id}-shackle`} from={hi} to={lo} x2={1} y2={0} />
      </defs>
      <Shadow id={id} cx={20} cy={47} rx={15} ry={2.5} />
      <g {...mo('shackle', seed)}>
        {/* ICON SHAPE (user, 2026-10-22): a thicker shackle and a larger keyhole, so the lock reads as a lock at small sizes */}
        <path d="M 11 22 V 13 A 9 9 0 0 1 29 13 V 22" fill="none" stroke={`url(#${id}-shackle)`} strokeWidth={6.5} strokeLinecap="round" style={{ transformBox: 'fill-box', transformOrigin: '29px 22px', transform: open ? 'translateY(-6px) rotate(25deg)' : 'none', transition: ease }} />
      </g>
      <g>
        <rect x={4} y={21} width={32} height={25} rx={5} fill={`url(#${id}-body)`} />
        <rect x={6} y={22} width={28} height={1.5} fill="#FFFFFF" opacity={0.45} />
        <ellipse cx={11} cy={27} rx={4} ry={2} fill="#FFFFFF" opacity={0.35} />
        <circle cx={20} cy={31.5} r={4.2} fill={R.drawerBot} />
        <rect x={18} y={33} width={4} height={8} rx={2} fill={R.drawerBot} />
      </g>
    </Svg>
  )
}

/** A key. */
export function KeyIcon({ w, tone = colors.warning }: { w: number; tone?: string }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={60} vh={30} className={idle.className} style={idle.style}>
      <circle cx={14} cy={15} r={11} fill={tone} />
      <circle cx={14} cy={15} r={4.5} fill={colors.white} />
      <rect x={22} y={12} width={34} height={6} rx={3} fill={tone} />
      <rect x={44} y={16} width={5} height={9} rx={2} fill={tone} />
      <rect x={51} y={16} width={5} height={7} rx={2} fill={tone} />
    </Svg>
  )
}

/** A toolbox, for in-house maintenance. */
export function Toolbox({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={70} vh={50} className={idle.className} style={idle.style}>
      <path d="M 24 14 V 8 H 46 V 14" fill="none" stroke={colors.muted} strokeWidth={4} />
      <rect x={4} y={14} width={62} height={32} rx={5} fill={colors.danger} />
      <rect x={4} y={24} width={62} height={5} fill={colors.ink} opacity={0.25} />
      <rect x={30} y={22} width={10} height={9} rx={2} fill={colors.warning} />
    </Svg>
  )
}

/** A bill: a sheet with item rows, the last row the total. */
export function Bill({ w, rows = 4, alarm = false }: { w: number; rows?: number; alarm?: boolean }) {
  const ease = useEase()
  const idle = useIdle(alarm ? 'shake' : 'hover')
  const id = usePrefix()
  return (
    <Svg w={w} vw={70} vh={90} className={idle.className} style={idle.style}>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-sheet`} from="#FFFFFF" to={R.plinthTop2} />
        <Lin id={`${id}-head`} from={R.tileHi} to={R.tileLo} x2={1} y2={0} />
      </defs>
      <Shadow id={id} cx={35} cy={87} rx={28} ry={3} />
      <g>
        <path d="M 4 4 H 66 V 84 L 58 78 L 50 84 L 42 78 L 34 84 L 26 78 L 18 84 L 10 78 L 4 84 Z" fill={`url(#${id}-sheet)`} />
        <path d="M 4 4 H 66 V 84 L 58 78 L 50 84 L 42 78 L 34 84 L 26 78 L 18 84 L 10 78 L 4 84 Z" fill="none" stroke={alarm ? colors.danger : R.frostSide} strokeWidth={1.5} style={{ transition: ease }} />
        <rect x={5} y={5} width={60} height={1.5} fill="#FFFFFF" />
        <rect x={12} y={12} width={30} height={5} rx={2.5} fill={`url(#${id}-head)`} />
        {Array.from({ length: rows }, (_, i) => (
          <g key={i}>
            <rect x={12} y={26 + i * 10} width={28} height={4} rx={2} fill={R.frostSide} />
            <rect x={46} y={26 + i * 10} width={12} height={4} rx={2} fill={R.sideBot} />
          </g>
        ))}
        <rect x={12} y={30 + rows * 10} width={46} height={5} rx={2.5} fill={alarm ? colors.danger : R.drawerBot} style={{ transition: ease }} />
      </g>
    </Svg>
  )
}

/** A bell, for an alarm. `ringing` tilts it. */
export function Bell({ w, ringing = false, tone = colors.danger }: { w: number; ringing?: boolean; tone?: string }) {
  const idle = useIdle('shake')
  const ease = useEase()
  const id = usePrefix()
  return (
    <Svg w={w} vw={40} vh={44} large className={ringing ? undefined : idle.className} style={ringing ? undefined : idle.style}>
      <defs>
        <Lin id={`${id}-gold`} from={R.goldHi} to={R.goldSideDark}>
          <stop offset="0.5" stopColor={R.gold} />
        </Lin>
        <Lin id={`${id}-ring`} from={tint(tone, 0.35)} to={tint(tone, -0.2)}>
          <stop offset="0.5" stopColor={tone} />
        </Lin>
      </defs>
      <g style={{ transformBox: 'view-box', transformOrigin: '20px 4px', animation: ringing ? 'cc-ring 0.5s ease-in-out infinite alternate' : undefined }}>
        <path d="M 20 4 C 10 4 7 13 7 22 C 7 28 4 31 3 34 H 37 C 36 31 33 28 33 22 C 33 13 30 4 20 4 Z" fill={`url(#${id}-gold)`} />
        {/* ringing recolours the bell: a graded fill cannot ease, so the alarm colour cross-fades over the gold */}
        <path d="M 20 4 C 10 4 7 13 7 22 C 7 28 4 31 3 34 H 37 C 36 31 33 28 33 22 C 33 13 30 4 20 4 Z" fill={`url(#${id}-ring)`} opacity={ringing ? 1 : 0} style={{ transition: ease }} />
        <ellipse cx={14} cy={12} rx={3.5} ry={6} fill="#FFFFFF" opacity={0.4} />
        <rect x={3} y={32} width={34} height={2} rx={1} fill="#FFFFFF" opacity={0.3} />
        <circle cx={20} cy={38} r={4} fill={ringing ? tone : R.goldSideDark} style={{ transition: ease }} />
      </g>
    </Svg>
  )
}

/* ------------------------------------------------------------------ everyday objects */

/** A suitcase or a travel bag. */
export function Bag({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={50} vh={50} className={idle.className} style={idle.style}>
      <path d="M 17 12 V 7 H 33 V 12" fill="none" stroke={colors.brandDeep} strokeWidth={3.5} />
      <rect x={4} y={12} width={42} height={34} rx={6} fill={colors.accent} />
      <rect x={4} y={24} width={42} height={4} fill={colors.accentDark} />
    </Svg>
  )
}

/** A bed, seen from the side. */
export function Bed({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={120} vh={60} className={idle.className} style={idle.style}>
      <rect x={4} y={10} width={10} height={46} rx={3} fill={colors.brandDark} />
      <rect x={12} y={28} width={104} height={18} rx={5} fill={colors.surface2} />
      <rect x={12} y={38} width={104} height={10} rx={3} fill={colors.brand} />
      <rect x={18} y={20} width={26} height={12} rx={6} fill={colors.white} stroke={colors.line} strokeWidth={1.5} />
      <rect x={110} y={34} width={8} height={22} rx={3} fill={colors.brandDark} />
    </Svg>
  )
}

/** A sofa. */
export function Sofa({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={110} vh={60} className={idle.className} style={idle.style}>
      <rect x={10} y={8} width={90} height={30} rx={10} fill={colors.teal} />
      <rect x={2} y={24} width={20} height={28} rx={8} fill={colors.tealDark} />
      <rect x={88} y={24} width={20} height={28} rx={8} fill={colors.tealDark} />
      <rect x={18} y={32} width={74} height={18} rx={6} fill={colors.teal} />
      <rect x={14} y={50} width={6} height={8} fill={colors.brandDeep} />
      <rect x={90} y={50} width={6} height={8} fill={colors.brandDeep} />
    </Svg>
  )
}

/** A fridge. */
export function Fridge({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={50} vh={90} className={idle.className} style={idle.style}>
      <rect x={2} y={2} width={46} height={86} rx={6} fill={colors.white} stroke={colors.line} strokeWidth={2} />
      <line x1={2} x2={48} y1={32} y2={32} stroke={colors.line} strokeWidth={2} />
      <rect x={38} y={12} width={4} height={14} rx={2} fill={colors.muted} />
      <rect x={38} y={40} width={4} height={20} rx={2} fill={colors.muted} />
    </Svg>
  )
}

/** A floor lamp. */
export function Lamp({ w, on = true }: { w: number; on?: boolean }) {
  const seed = useSeed()
  return (
    <Svg w={w} vw={40} vh={90}>
      {on && <ellipse cx={20} cy={30} rx={18} ry={12} fill={colors.warning} fillOpacity={0.25} data-flat {...mo('glow', seed)} />}
      <path d="M 8 24 L 14 4 H 26 L 32 24 Z" fill={on ? colors.warning : colors.muted} />
      <rect x={18.5} y={24} width={3} height={58} fill={colors.brandDeep} />
      <rect x={8} y={82} width={24} height={6} rx={3} fill={colors.brandDeep} />
    </Svg>
  )
}

/** Bricks and a cement bag: what you would build with, and do not have to. */
export function Bricks({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={80} vh={50} className={idle.className} style={idle.style}>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={4 + c * 24 + (r % 2) * 10} y={34 - r * 14} width={22} height={12} rx={2} fill={colors.danger} opacity={0.8} />),
      )}
    </Svg>
  )
}

/** One thick reference book. */
export function Book({ w, tone = colors.brand }: { w: number; tone?: string }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={50} vh={40} className={idle.className} style={idle.style}>
      <rect x={4} y={6} width={42} height={30} rx={3} fill={tone} />
      <rect x={8} y={6} width={4} height={30} fill={colors.brandDeep} opacity={0.35} />
      <rect x={18} y={14} width={20} height={4} rx={2} fill={colors.white} opacity={0.85} />
      <rect x={18} y={22} width={14} height={3} rx={1.5} fill={colors.white} opacity={0.6} />
    </Svg>
  )
}

/** A long table top. */
export function TableTop({ w }: { w: number }) {
  return (
    <svg width={w} height={30} viewBox={`0 0 ${w} 30`} style={{ display: 'block' }} aria-hidden>
      <rect x={0} y={0} width={w} height={12} rx={6} fill={colors.brandDark} opacity={0.75} />
      <rect x={18} y={12} width={8} height={18} fill={colors.brandDeep} opacity={0.6} />
      <rect x={w - 26} y={12} width={8} height={18} fill={colors.brandDeep} opacity={0.6} />
    </svg>
  )
}

/** A building cut away into `n` flats side by side, each with its own door and lock. */
export function Flats({ w, n = 3, locked = true }: { w: number; n?: number; locked?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const fw = 64
  const W = 16 + n * fw
  return (
    <Svg w={w} vw={W} vh={110}>
      <path d={`M 0 30 L ${W / 2} 4 L ${W} 30 Z`} fill={colors.danger} opacity={0.75} />
      <rect x={4} y={30} width={W - 8} height={76} rx={4} fill={colors.line} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={10 + i * fw} y={38} width={fw - 8} height={64} rx={3} fill={colors.white} />
          {i > 0 && <rect x={6 + i * fw} y={34} width={4} height={72} fill={colors.brandDeep} />}
          <rect x={10 + i * fw + (fw - 8) / 2 - 10} y={62} width={20} height={40} rx={2} fill={colors.brand} opacity={0.75} />
          <g transform={`translate(${10 + i * fw + (fw - 8) / 2} 80)`} style={{ opacity: locked ? 1 : 0, transition: ease }}>
            <rect x={-6} y={-2} width={12} height={10} rx={2} fill={colors.warning} />
            <path d="M -3.5 -2 V -5 A 3.5 3.5 0 0 1 3.5 -5 V -2" fill="none" stroke={colors.warning} strokeWidth={2} {...mo('shackle', seed + i * 3)} />
          </g>
        </g>
      ))}
    </Svg>
  )
}

/** A delivery truck, with up to three parcels in its open back. `tones` colours them. */
export function Truck({ w, parcels = [] }: { w: number; parcels?: string[] }) {
  const ease = useEase()
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={170} vh={90} className={idle.className} style={idle.style}>
      <rect x={4} y={10} width={110} height={58} rx={6} fill={colors.surface2} stroke={colors.line} strokeWidth={2} />
      {parcels.map((t, i) => (
        <rect key={i} x={14 + i * 32} y={32} width={28} height={30} rx={3} fill={t} style={{ transition: ease }} />
      ))}
      <path d="M 116 26 H 146 L 164 46 V 68 H 116 Z" fill={colors.brand} />
      <path d="M 124 32 H 143 L 155 46 H 124 Z" fill={colors.white} opacity={0.8} />
      <circle cx={34} cy={74} r={12} fill={colors.brandDeep} />
      <circle cx={34} cy={74} r={5} fill={colors.muted} />
      <circle cx={140} cy={74} r={12} fill={colors.brandDeep} />
      <circle cx={140} cy={74} r={5} fill={colors.muted} />
    </Svg>
  )
}

/** A parcel, in the sender's colour. */
export function Parcel({ w, tone }: { w: number; tone: string }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={40} vh={40} className={idle.className} style={idle.style}>
      <rect x={3} y={6} width={34} height={30} rx={4} fill={tone} />
      <rect x={17} y={6} width={6} height={30} fill={colors.white} opacity={0.45} />
    </Svg>
  )
}

/** A weighing scale with a needle at `value` (0 to 1). */
export function WeighScale({ w, value }: { w: number; value: number }) {
  const ease = useEase()
  const idle = useIdle('pulse')
  return (
    <Svg w={w} vw={70} vh={60} className={idle.className} style={idle.style}>
      <rect x={6} y={8} width={58} height={6} rx={3} fill={colors.muted} />
      <rect x={30} y={14} width={10} height={10} fill={colors.muted} />
      <rect x={4} y={24} width={62} height={32} rx={8} fill={colors.brandDeep} />
      <path d="M 18 48 A 17 17 0 0 1 52 48" fill="none" stroke={colors.white} strokeWidth={2} />
      <path d="M 35 48 L 35 34" stroke={colors.warning} strokeWidth={3} strokeLinecap="round" style={{ transformBox: 'view-box', transformOrigin: '35px 48px', transform: `rotate(${-80 + value * 160}deg)`, transition: ease }} />
    </Svg>
  )
}

/** An ATM set into a wall: the screen, keypad, card slot and cash slot. */
export function Atm({ w, card = false, cash = false, screen = colors.surface2 }: { w: number; card?: boolean; cash?: boolean; screen?: string }) {
  const ease = useEase()
  const seed = useSeed()
  return (
    <Svg w={w} vw={110} vh={150}>
      <rect x={0} y={0} width={110} height={150} rx={10} fill={colors.line} />
      <rect x={12} y={10} width={86} height={134} rx={8} fill={colors.brandDeep} />
      <rect x={22} y={20} width={66} height={44} rx={4} fill={screen} style={{ transition: ease }} />
      <rect x={22} y={20} width={66} height={44} rx={4} fill={colors.white} fillOpacity={0.14} data-flat {...mo('type', seed)} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={26 + (i % 3) * 14} y={74 + Math.floor(i / 3) * 12} width={10} height={8} rx={2} fill={colors.muted} />
      ))}
      <rect x={72} y={76} width={18} height={4} rx={2} fill={colors.night} />
      <rect x={75} y={card ? 70 : 76} width={12} height={card ? 8 : 0} rx={1.5} fill={colors.warning} style={{ transition: ease }} />
      <rect x={30} y={118} width={50} height={6} rx={3} fill={colors.night} />
      {/* the cash note's own green */}
      <rect x={35} y={cash ? 122 : 118} width={40} height={cash ? 18 : 0} rx={2} fill="#3BAA5C" style={{ transition: ease }} />
    </Svg>
  )
}

/** A bank counter with a teller window. */
export function Counter({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={130} vh={80} className={idle.className} style={idle.style}>
      <rect x={2} y={4} width={126} height={40} rx={6} fill={colors.surface2} />
      <rect x={20} y={10} width={90} height={30} rx={4} fill={colors.white} stroke={colors.line} strokeWidth={2} />
      <rect x={2} y={44} width={126} height={34} rx={4} fill={colors.brandDark} />
      <rect x={2} y={44} width={126} height={6} fill={colors.brandDeep} />
    </Svg>
  )
}

/** A serving counter with three shared trays and a ladle. */
export function MessCounter({ w, served = 0 }: { w: number; served?: number }) {
  const ease = useEase()
  const seed = useSeed()
  const food = [colors.warning, colors.success, colors.accent]
  return (
    <Svg w={w} vw={220} vh={90}>
      <rect x={2} y={40} width={216} height={46} rx={6} fill={colors.muted} />
      <rect x={2} y={36} width={216} height={10} rx={4} fill={colors.line} />
      {food.map((t, i) => (
        <g key={i}>
          <rect x={16 + i * 68} y={20} width={56} height={22} rx={4} fill={colors.white} stroke={colors.line} strokeWidth={2} />
          <ellipse cx={44 + i * 68} cy={26} rx={22} ry={6} fill={t} style={{ opacity: 1 - served * 0.08, transition: ease }} />
        </g>
      ))}
      <path d="M 196 8 V 28 M 190 30 A 6 6 0 0 0 202 30" fill="none" stroke={colors.brandDeep} strokeWidth={3} strokeLinecap="round" {...mo('hover', seed)} />
    </Svg>
  )
}

/** A steel plate with up to three portions. */
export function Plate({ w, portions = 0 }: { w: number; portions?: number }) {
  const ease = useEase()
  const food = [colors.warning, colors.success, colors.accent]
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={50} vh={30} className={idle.className} style={idle.style}>
      <ellipse cx={25} cy={18} rx={23} ry={10} fill={colors.line} />
      <ellipse cx={25} cy={16} rx={19} ry={8} fill={colors.surface} />
      {food.map((t, i) => (
        <ellipse key={i} cx={14 + i * 11} cy={16} rx={5.5} ry={3.5} fill={t} style={{ opacity: i < portions ? 1 : 0, transition: ease, transitionDelay: `${i * 120}ms` }} />
      ))}
    </Svg>
  )
}

/** A gas stove, the dedicated thing pooling replaces. */
export function Stove({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={60} vh={40} className={idle.className} style={idle.style}>
      <rect x={2} y={14} width={56} height={22} rx={4} fill={colors.muted} />
      <circle cx={18} cy={14} r={8} fill="none" stroke={colors.brandDeep} strokeWidth={3} />
      <circle cx={42} cy={14} r={8} fill="none" stroke={colors.brandDeep} strokeWidth={3} />
    </Svg>
  )
}

/** A rubber band stretched by `stretch` (0 at rest to 1 fully stretched), between two pegs. */
export function RubberBand({ w, stretch }: { w: number; stretch: number }) {
  const ease = useEase(640)
  const spread = 30 + stretch * 70
  const left = 110 - spread
  const right = 110 + spread
  return (
    <Svg w={w} vw={220} vh={80}>
      <path
        d={`M ${left} 40 C ${left} ${22 - stretch * 6} ${right} ${22 - stretch * 6} ${right} 40 C ${right} ${58 + stretch * 6} ${left} ${58 + stretch * 6} ${left} 40 Z`}
        fill="none"
        stroke={colors.accent}
        strokeWidth={7 - stretch * 2.5}
        style={{ transition: ease }}
      />
      <circle cx={left} cy={40} r={7} fill={colors.brandDeep} style={{ transition: ease }} />
      <circle cx={right} cy={40} r={7} fill={colors.brandDeep} style={{ transition: ease }} />
    </Svg>
  )
}

/** A taxi with its meter on the roof (the taxi's own yellow is the object's colour). */
export function Taxi({ w, meterOn = false }: { w: number; meterOn?: boolean }) {
  const ease = useEase()
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={170} vh={80} className={idle.className} style={idle.style}>
      <rect x={66} y={4} width={36} height={12} rx={3} fill={meterOn ? colors.success : colors.muted} className={meterOn ? mo('blink', idle.seed + 9).className : undefined} style={{ transition: ease, ...(meterOn ? mo('blink', idle.seed + 9).style : {}) }} />
      <path d="M 20 40 L 40 18 H 124 L 146 40 H 160 A 6 6 0 0 1 166 46 V 60 H 4 V 46 A 6 6 0 0 1 10 40 Z" fill="#F5C518" />
      <path d="M 46 22 H 80 V 40 H 30 Z M 86 22 H 120 L 138 40 H 86 Z" fill={colors.white} opacity={0.8} />
      <rect x={4} y={46} width={162} height={4} fill={colors.ink} opacity={0.2} />
      <circle cx={42} cy={62} r={13} fill={colors.brandDeep} />
      <circle cx={42} cy={62} r={5} fill={colors.muted} />
      <circle cx={130} cy={62} r={13} fill={colors.brandDeep} />
      <circle cx={130} cy={62} r={5} fill={colors.muted} />
    </Svg>
  )
}

/** A parked car with a cover of dust: owned, idle. */
export function ParkedCar({ w }: { w: number }) {
  return (
    <Svg w={w} vw={170} vh={80}>
      <path d="M 20 40 L 40 18 H 124 L 146 40 H 160 A 6 6 0 0 1 166 46 V 60 H 4 V 46 A 6 6 0 0 1 10 40 Z" fill={colors.muted} />
      <path d="M 46 22 H 80 V 40 H 30 Z M 86 22 H 120 L 138 40 H 86 Z" fill={colors.white} opacity={0.5} />
      <circle cx={42} cy={62} r={13} fill={colors.brandDeep} />
      <circle cx={130} cy={62} r={13} fill={colors.brandDeep} />
    </Svg>
  )
}

/** A house front. */
export function House({ w }: { w: number }) {
  const seed = useSeed()
  return (
    <Svg w={w} vw={90} vh={80}>
      <path d="M 4 36 L 45 4 L 86 36 Z" fill={colors.danger} opacity={0.8} />
      <rect x={12} y={34} width={66} height={44} rx={3} fill={colors.surface2} />
      <rect x={38} y={50} width={16} height={28} rx={2} fill={colors.brandDark} />
      <rect x={20} y={44} width={12} height={12} rx={2} fill={colors.warning} fillOpacity={0.8} {...mo('glow', seed)} />
      <rect x={60} y={44} width={12} height={12} rx={2} fill={colors.warning} fillOpacity={0.8} {...mo('glow', seed + 1)} />
    </Svg>
  )
}

/** A table fan whose blades turn while `on`. */
export function Fan({ w, on }: { w: number; on: boolean }) {
  return (
    <Svg w={w} vw={60} vh={80}>
      <circle cx={30} cy={28} r={26} fill={colors.white} stroke={colors.line} strokeWidth={2} />
      <g style={{ transformBox: 'view-box', transformOrigin: '30px 28px', animation: on ? 'cc-spin 0.6s linear infinite' : undefined }}>
        {[0, 120, 240].map((a) => (
          <ellipse key={a} cx={30} cy={15} rx={6} ry={12} fill={on ? colors.brand : colors.muted} transform={`rotate(${a} 30 28)`} />
        ))}
      </g>
      <circle cx={30} cy={28} r={4} fill={colors.brandDeep} />
      <rect x={27} y={54} width={6} height={18} fill={colors.muted} />
      <rect x={14} y={72} width={32} height={6} rx={3} fill={colors.muted} />
    </Svg>
  )
}

/** A light bulb, lit or not. */
export function Bulb({ w, on }: { w: number; on: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const id = usePrefix()
  return (
    <Svg w={w} vw={40} vh={60} large>
      <defs>
        <radialGradient id={`${id}-glass`} cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor={R.goldHi} />
          <stop offset="0.7" stopColor={R.gold} />
          <stop offset="1" stopColor={R.goldSide} />
        </radialGradient>
        <radialGradient id={`${id}-off`} cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={R.frostSide} />
        </radialGradient>
        <Lin id={`${id}-base`} from={R.sideTop} to={R.sideBot} />
      </defs>
      {on && <circle cx={20} cy={20} r={19} fill={colors.warning} fillOpacity={0.25} data-flat {...mo('glow', seed)} />}
      <g>
        <path d="M 20 4 C 9 4 4 12 4 20 C 4 28 11 32 12 40 H 28 C 29 32 36 28 36 20 C 36 12 31 4 20 4 Z" fill={`url(#${id}-off)`} />
        <path d="M 20 4 C 9 4 4 12 4 20 C 4 28 11 32 12 40 H 28 C 29 32 36 28 36 20 C 36 12 31 4 20 4 Z" fill={`url(#${id}-glass)`} opacity={on ? 1 : 0} style={{ transition: ease }} />
        <ellipse cx={13} cy={14} rx={3.5} ry={6} fill="#FFFFFF" opacity={0.55} />
      </g>
      <g>
        <rect x={12} y={42} width={16} height={5} rx={2} fill={`url(#${id}-base)`} />
        <rect x={13} y={49} width={14} height={5} rx={2} fill={`url(#${id}-base)`} />
        <rect x={13} y={42.5} width={14} height={1} fill="#FFFFFF" opacity={0.4} />
      </g>
    </Svg>
  )
}

/** A row of fitted kitchen cupboards along a wall, each drawer with its label slot. */
export function Cupboards({ w, labels = false }: { w: number; labels?: boolean }) {
  const ease = useEase()
  return (
    <Svg w={w} vw={220} vh={100}>
      <rect x={2} y={2} width={216} height={10} rx={3} fill={colors.warning} opacity={0.75} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={6 + i * 53} y={14} width={49} height={82} rx={4} fill={colors.white} stroke={colors.line} strokeWidth={2} />
          <line x1={6 + i * 53} x2={55 + i * 53} y1={42} y2={42} stroke={colors.line} strokeWidth={2} />
          <line x1={6 + i * 53} x2={55 + i * 53} y1={68} y2={68} stroke={colors.line} strokeWidth={2} />
          {[0, 1, 2].map((r) => (
            <rect key={r} x={20 + i * 53} y={24 + r * 26} width={22} height={5} rx={2.5} fill={labels ? colors.brand : colors.muted} style={{ transition: ease }} />
          ))}
        </g>
      ))}
    </Svg>
  )
}

/** A wall: the fixing the cupboards are screwed to. */
export function Wall({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden>
      <rect width={w} height={h} rx={8} fill={colors.surface2} />
      {Array.from({ length: Math.floor(h / 18) }, (_, i) => (
        <line key={i} x1={0} x2={w} y1={9 + i * 18} y2={9 + i * 18} stroke={colors.line} strokeWidth={1.5} />
      ))}
    </svg>
  )
}

/** A world map pin. */
export function Pin({ w, tone = colors.brand }: { w: number; tone?: string }) {
  const idle = useIdle('hover')
  const id = usePrefix()
  const own = tone === colors.brand
  return (
    <Svg w={w} vw={30} vh={40} className={idle.className} style={idle.style}>
      <defs>
        <BlurDef id={id} sd={2} />
        <Lin id={`${id}-pin`} from={own ? R.cloudTop : tint(tone, 0.35)} to={own ? R.cloudBot : tint(tone, -0.2)}>
          <stop offset="0.5" stopColor={own ? R.cloudMid : tone} />
        </Lin>
      </defs>
      <Shadow id={id} cx={15} cy={38.5} rx={6} ry={1.6} />
      <g>
        <path d="M 15 2 C 7 2 2 8 2 15 C 2 25 15 38 15 38 C 15 38 28 25 28 15 C 28 8 23 2 15 2 Z" fill={`url(#${id}-pin)`} />
        <ellipse cx={10} cy={8} rx={3} ry={2} fill="#FFFFFF" opacity={0.45} />
        <circle cx={15} cy={15} r={5} fill="#FFFFFF" />
        <circle cx={15} cy={15} r={5} fill={R.dialEdge} opacity={0.5} />
        <circle cx={14} cy={14} r={2.2} fill="#FFFFFF" />
      </g>
    </Svg>
  )
}

/** A rocket, for speed to market. */
export function Rocket({ w }: { w: number }) {
  const idle = useIdle('hover')
  const id = usePrefix()
  return (
    <Svg w={w} vw={40} vh={60} large className={idle.className} style={idle.style}>
      <defs>
        <Lin id={`${id}-body`} from={R.cloudTop} to={R.cloudBot} x2={1} y2={0.3}>
          <stop offset="0.45" stopColor={R.cloudMid} />
        </Lin>
        <Lin id={`${id}-flame`} from={R.goldHi} to={colors.accent} />
      </defs>
      <g>
        <path d="M 20 2 C 30 12 32 26 30 40 H 10 C 8 26 10 12 20 2 Z" fill={`url(#${id}-body)`} />
        <path d="M 20 2 C 15 7 12.5 14 11.5 22 C 13 16 16 10 20 6 Z" fill="#FFFFFF" opacity={0.35} />
        <circle cx={20} cy={20} r={5.5} fill={R.tileUnder} />
        <circle cx={20} cy={20} r={4} fill="#FFFFFF" />
        <circle cx={19} cy={19} r={1.6} fill={R.cloudTop} />
        <path d="M 10 30 L 2 44 L 10 40 Z M 30 30 L 38 44 L 30 40 Z" fill={R.tileUnder} />
        <rect x={10} y={38} width={20} height={3} fill={R.tileUnder} opacity={0.7} />
      </g>
      <path d="M 14 42 L 20 56 L 26 42 Z" fill={`url(#${id}-flame)`} {...mo('flicker', idle.seed)} />
    </Svg>
  )
}

/** A light idea bulb with a spark: Meera's idea. */
export function Idea({ w }: { w: number }) {
  return <Bulb w={w} on />
}

/** A storefront, for a provider opening its doors in a launch year. `open` lifts its shutter. */
export function Storefront({ w, open, children }: { w: number; open: boolean; children?: ReactNode }) {
  const ease = useEase(640)
  const idle = useIdle('hover')
  const id = usePrefix()
  return (
    <div className={`relative ${idle.className}`} style={{ width: w, height: w * 0.78, ...idle.style }}>
      <Svg w={w} vw={100} vh={78} large>
        <defs>
          <BlurDef id={id} sd={3} />
          <Lin id={`${id}-body`} from={R.plinthTop} to={R.plinthFront} />
          <Lin id={`${id}-awning`} from={R.tileHi} to={R.tileLo} />
          <Lin id={`${id}-shutter`} from={R.sideTop} to={R.sideBot} />
        </defs>
        <Shadow id={id} cx={50} cy={77} rx={44} ry={3} />
        <g>
          <rect x={2} y={14} width={96} height={62} rx={6} fill={`url(#${id}-body)`} />
          <rect x={12} y={26} width={76} height={46} rx={3} fill="#FFFFFF" />
          <rect x={12} y={26} width={76} height={open ? 6 : 46} rx={3} fill={`url(#${id}-shutter)`} style={{ transition: ease }} />
          {Array.from({ length: open ? 1 : 6 }, (_, i) => (
            <line key={i} x1={14} x2={86} y1={30 + i * 7} y2={30 + i * 7} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.45} style={{ transition: ease }} />
          ))}
        </g>
        <g>
          <path d="M 0 16 L 10 2 H 90 L 100 16 Z" fill={`url(#${id}-awning)`} />
          <path d="M 10 2 H 90 L 92 4.5 H 8 Z" fill="#FFFFFF" opacity={0.35} />
        </g>
      </Svg>
      {children && (
        <div className="absolute inset-x-0 grid place-items-center" style={{ top: w * 0.34, height: w * 0.4, opacity: open ? 1 : 0, transition: ease }}>
          {children}
        </div>
      )}
    </div>
  )
}

/** A balance scale; `tilt` in degrees, positive drops the right pan. Pans carry DOM content laid over by the caller. */
export function Balance({ w, tilt = 0 }: { w: number; tilt?: number }) {
  const ease = useEase(700)
  const id = usePrefix()
  return (
    <Svg w={w} vw={220} vh={120} large>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-post`} from={R.chassisTop} to={R.drawerBot} />
        <Lin id={`${id}-beam`} from={R.tileHi} to={R.tileLo} />
        <Lin id={`${id}-left`} from={R.cloudTop} to={R.cloudBot} />
        <Lin id={`${id}-right`} from={tint(colors.danger, 0.3)} to={tint(colors.danger, -0.2)} />
        <Lin id={`${id}-gold`} from={R.goldHi} to={R.goldSide} />
      </defs>
      <Shadow id={id} cx={110} cy={117} rx={40} ry={2.5} />
      <g>
        <rect x={106} y={30} width={8} height={80} fill={`url(#${id}-post)`} />
        <rect x={76} y={108} width={68} height={8} rx={4} fill={`url(#${id}-post)`} />
        <rect x={78} y={109} width={64} height={1.5} fill="#FFFFFF" opacity={0.3} />
      </g>
      <g style={{ transformBox: 'view-box', transformOrigin: '110px 30px', transform: `rotate(${tilt}deg)`, transition: ease }}>
        <rect x={14} y={26} width={192} height={8} rx={4} fill={`url(#${id}-beam)`} />
        <rect x={18} y={27} width={184} height={1.5} fill="#FFFFFF" opacity={0.4} />
        <path d="M 30 34 L 14 70 M 30 34 L 46 70" stroke={R.sideBot} strokeWidth={2} />
        <path d="M 190 34 L 174 70 M 190 34 L 206 70" stroke={R.sideBot} strokeWidth={2} />
        <path d="M 6 70 H 54 A 24 10 0 0 1 6 70 Z" fill={`url(#${id}-left)`} />
        <path d="M 8 70 H 52 A 22 2 0 0 1 8 70 Z" fill="#FFFFFF" opacity={0.3} />
        <path d="M 166 70 H 214 A 24 10 0 0 1 166 70 Z" fill={`url(#${id}-right)`} />
        <path d="M 168 70 H 212 A 22 2 0 0 1 168 70 Z" fill="#FFFFFF" opacity={0.3} />
      </g>
      <g>
        <circle cx={110} cy={30} r={7} fill={`url(#${id}-gold)`} />
        <circle cx={108} cy={28} r={2} fill="#FFFFFF" opacity={0.6} />
      </g>
    </Svg>
  )
}

/** A roaming phone: a phone with a plane over it and a signal arc. */
export function RoamingPhone({ w, on }: { w: number; on: boolean }) {
  const ease = useEase()
  const idle = useIdle('hover')
  return (
    <div className="relative" style={{ width: w, height: w * 2.06 }}>
      <MiniPhone w={w} />
      <div className="absolute inset-0 grid place-items-center">
        <Svg w={w * 0.6} vw={40} vh={40} className={idle.className} style={idle.style}>
          <path d="M 4 22 L 36 10 L 30 16 L 34 30 L 28 28 L 22 18 L 14 22 L 12 28 L 8 26 Z" fill={on ? colors.brand : colors.muted} style={{ transition: ease }} />
        </Svg>
      </div>
    </div>
  )
}

/** A moon, for "overnight". */
export function Moon({ w }: { w: number }) {
  const idle = useIdle('hover')
  return (
    <Svg w={w} vw={40} vh={40} className={idle.className} style={idle.style}>
      <path d="M 26 4 A 17 17 0 1 0 36 28 A 13 13 0 1 1 26 4 Z" fill={colors.warning} />
    </Svg>
  )
}

/** The keyframes the objects above use, mounted once by the deck. */
export const ART_CSS = `
@keyframes cc-spin { to { transform: rotate(360deg) } }
@keyframes cc-ring { from { transform: rotate(-12deg) } to { transform: rotate(12deg) } }
@keyframes cc-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
@keyframes cc-dash { to { stroke-dashoffset: -24 } }
/* COLOURS (user, 2026-10-22: "visuals look washed out", the reference render's palette): every drawn object is lifted to the render's saturation and contrast; the clay rim shade below is a cool navy multiply, not the Lab's violet-grey, so a shadow deepens a hue instead of greying it */
svg.cc-clay { filter: saturate(1.18) contrast(1.04) }
svg.cc-clay > :not(defs):not([data-flat]) { filter: url(#cc-clay) }
svg.cc-clay.cc-clay-lg > :not(defs):not([data-flat]) { filter: url(#cc-clay-lg) }
`
