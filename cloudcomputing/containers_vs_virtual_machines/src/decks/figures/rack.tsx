import { ClaySvg, useEase, type UnitState } from './art'
import { usePrefix, Shadow, BlurDef, GlowDef, Lin } from './depth'

/**
 * THE ON-PREMISE CLUSTER of slide 5 (user, 2026-10-16, from the reference
 * render): the rack, its coins and their plinth, drawn with the render's
 * detail, depth and colours. Palette and helpers in `depth.tsx`; the rack's
 * own colours (its slabs, panels, lights, gold) are below.
 */

/** The render's rack colours. */
const K = {
  frontTop: '#2F3B60',
  frontBot: '#1E2744',
  sideTop: '#414E78',
  sideBot: '#2E3A60',
  topBack: '#5A689E',
  topFront: '#3F4C79',
  edgeLight: '#7D8ABA',
  panelTop: '#CBD3EE',
  panelBot: '#A1ACD8',
  panelEdge: '#76839F',
  panelDim: '#8F9AC4',
  barLong: '#2D6BFF',
  barShort: '#4A86FF',
  barHi: '#8AB2FF',
  barIdle: '#8B97C2',
  ledHi: '#79B5FF',
  ledBlue: '#2F7BFF',
  ledEdge: '#1A52D9',
  ledCore: '#5CF2C8',
  ledHot: '#FF5A4E',
  ledHotEdge: '#C8281E',
  ledOff: '#3A4260',
  vent: '#6F7BA9',
  plinthTop: '#F3F6FC',
  plinthTop2: '#DDE4F5',
  plinthFront: '#C6CFE9',
  plinthFrontBot: '#B3BEE0',
  goldHi: '#FFD95E',
  gold: '#F7AF24',
  bandTop: '#F2A21B',
  bandBot: '#CF840C',
  ring: '#E89C1A',
  shine: '#FFF5C8',
}

/* the view: from the left and above; depth steps back, up and to the left */
const DX = -38
const DY = -16
const FX = 54 // the slabs' front-left edge
const FW = 112 // their front width
const XR = FX + FW
const MOD = 25 // one slab's height
const GAP = 4 // the lit strip between slabs
const PITCH = MOD + GAP
const CAB_TOP = 20
const COIN_CX = 202
const COIN_RX = 31
const COIN_RY = 11
const COIN_BAND = 14
const COIN_PITCH = 16

/**
 * The on-premise rack as the render draws it: `units.length` navy slabs
 * stacked on a plinth, each a solid with a lit top, a side face on the left
 * and a periwinkle panel inset in its front carrying two blue bars, three
 * vents and a glowing light; a stack of `coins` fat gold coins beside it,
 * slightly offset coin to coin; one skewed plinth under both, with a
 * contact shadow where each meets it and a soft ground shadow beneath. A
 * running slab's bars and light are lit; an idle one's panel is dimmed, its
 * bars grey and its light dark; a hot one's light is red; `off` fades the
 * slab (the states of `art.tsx` `Rack`). Gradients cannot ease, so the lit
 * parts cross-fade over the unlit ones on `useEase()`.
 */
export function IsoRack({ w, units, coins = 0 }: { w: number; units: UnitState[]; coins?: number }) {
  const ease = useEase()
  const id = usePrefix()
  const n = units.length
  const cabBot = CAB_TOP + n * PITCH - GAP
  const plinthTop = cabBot - 8
  const plinthBot = plinthTop + 32
  const bandBot = plinthBot + 12
  const coinBase = plinthBot - 6
  const VH = bandBot + 18
  const skew = Math.tan((25 * Math.PI) / 180)
  return (
    <ClaySvg w={w} vw={270} vh={VH} large>
      <defs>
        <BlurDef id={id} sd={6} />
        <BlurDef id={`${id}c`} sd={3} />
        <Lin id={`${id}-front`} from={K.frontTop} to={K.frontBot} />
        <Lin id={`${id}-side`} from={K.sideTop} to={K.sideBot} />
        <Lin id={`${id}-top`} from={K.topBack} to={K.topFront} />
        <Lin id={`${id}-panel`} from={K.panelTop} to={K.panelBot} x2={0.25} y2={1} />
        <Lin id={`${id}-plinth`} from={K.plinthTop} to={K.plinthTop2} />
        <Lin id={`${id}-plinthfront`} from={K.plinthFront} to={K.plinthFrontBot} />
        <Lin id={`${id}-band`} from={K.bandTop} to={K.bandBot} />
        <radialGradient id={`${id}-cointop`} cx="36%" cy="30%" r="72%">
          <stop offset="0" stopColor={K.goldHi} />
          <stop offset="0.7" stopColor={K.gold} />
          <stop offset="1" stopColor={K.bandTop} />
        </radialGradient>
        <radialGradient id={`${id}-led`} cx="38%" cy="32%" r="68%">
          <stop offset="0" stopColor={K.ledHi} />
          <stop offset="0.5" stopColor={K.ledBlue} />
          <stop offset="1" stopColor={K.ledEdge} />
        </radialGradient>
        <radialGradient id={`${id}-ledhot`} cx="38%" cy="32%" r="68%">
          <stop offset="0" stopColor="#FFA39B" />
          <stop offset="0.5" stopColor={K.ledHot} />
          <stop offset="1" stopColor={K.ledHotEdge} />
        </radialGradient>
        <GlowDef id={`${id}-glow`} tone={K.ledBlue} />
        <GlowDef id={`${id}-glowhot`} tone={K.ledHot} />
      </defs>

      {/* the ground shadow, then the plinth: its front edge, then its skewed top face */}
      <Shadow id={id} cx={141} cy={bandBot + 2} rx={128} ry={9} o={0.24} />
      <g>
        <rect x={14} y={plinthBot - 8} width={254} height={bandBot - plinthBot + 8} rx={12} fill={`url(#${id}-plinthfront)`} />
        <rect x={14} y={plinthTop} width={254} height={plinthBot - plinthTop} rx={14} fill={`url(#${id}-plinth)`} transform={`translate(${-skew * plinthBot} 0) skewX(25)`} />
        <path d={`M ${14 + 14} ${plinthBot} H ${268 - 14}`} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.5} />
      </g>
      {/* contact shadows: where the cabinet and the coins meet the plinth */}
      <Shadow id={`${id}c`} cx={(FX + XR) / 2 + DX / 2} cy={cabBot + 3} rx={72} ry={6} o={0.26} />
      <Shadow id={`${id}c`} cx={COIN_CX} cy={coinBase + 2} rx={34} ry={5} o={0.22} />

      {/* the slabs, bottom first so each covers the lit top of the one below, leaving the strip in the gap */}
      {units
        .map((u, i) => ({ u, i }))
        .reverse()
        .map(({ u, i }) => {
          const y = CAB_TOP + i * PITCH
          const live = u === 'run' || u === 'hot'
          const hot = u === 'hot'
          const ledX = XR - 16
          const ledY = y + 12.5
          return (
            <g key={i} style={{ opacity: u === 'off' ? 0.3 : 1, transition: ease }}>
              {/* the solid: side, top, front */}
              <path d={`M ${FX} ${y} L ${FX + DX} ${y + DY} L ${FX + DX} ${y + MOD + DY} L ${FX} ${y + MOD} Z`} fill={`url(#${id}-side)`} />
              <path d={`M ${FX} ${y} L ${FX + DX} ${y + DY} L ${XR + DX} ${y + DY} L ${XR} ${y} Z`} fill={`url(#${id}-top)`} />
              <rect x={FX} y={y} width={FW} height={MOD} rx={5} fill={`url(#${id}-front)`} />
              <path d={`M ${FX + 4} ${y} H ${XR - 4}`} stroke={K.edgeLight} strokeWidth={1.2} opacity={0.55} />
              <path d={`M ${FX} ${y + 1} L ${FX + DX} ${y + DY + 1}`} stroke={K.edgeLight} strokeWidth={1} opacity={0.35} />
              {/* the inset panel, with its edge */}
              <rect x={FX + 6} y={y + 3.5} width={FW - 12} height={MOD - 7} rx={4.5} fill={K.panelEdge} />
              <rect x={FX + 7} y={y + 4.5} width={FW - 14} height={MOD - 9} rx={4} fill={`url(#${id}-panel)`} />
              <rect x={FX + 7} y={y + 4.5} width={FW - 14} height={MOD - 9} rx={4} fill={K.panelDim} opacity={live ? 0 : 0.42} style={{ transition: ease }} />
              {/* the bars: a long one and a short one, with a sheen along their tops */}
              <rect x={FX + 15} y={y + 8} width={40} height={4.5} rx={2.25} fill={live ? K.barLong : K.barIdle} style={{ transition: ease }} />
              <rect x={FX + 15} y={y + 8} width={40} height={1.5} rx={0.75} fill={K.barHi} opacity={live ? 0.8 : 0} style={{ transition: ease }} />
              <rect x={FX + 15} y={y + 14.5} width={25} height={3.5} rx={1.75} fill={live ? K.barShort : K.barIdle} opacity={live ? 1 : 0.8} style={{ transition: ease }} />
              {/* three vents */}
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={XR - 38 + k * 4.5} cy={y + 12.5} r={1.1} fill={K.vent} opacity={0.9} />
              ))}
              {/* the light: a dark bead, and over it the lit sphere, its core and its glow */}
              <circle cx={ledX} cy={ledY} r={5.5} fill={K.ledOff} />
              <circle cx={ledX} cy={ledY} r={11} fill={`url(#${id}-${hot ? 'glowhot' : 'glow'})`} opacity={live ? 1 : 0} style={{ transition: ease }} />
              <circle cx={ledX} cy={ledY} r={5.5} fill={`url(#${id}-${hot ? 'ledhot' : 'led'})`} opacity={live ? 1 : 0} style={{ transition: ease }} />
              <circle cx={ledX - 0.6} cy={ledY - 0.4} r={2.3} fill={hot ? '#FFD7D2' : K.ledCore} opacity={live ? 0.95 : 0} style={{ transition: ease }} />
              <circle cx={ledX - 2} cy={ledY - 2.2} r={1.2} fill="#FFFFFF" opacity={live ? 0.9 : 0.2} style={{ transition: ease }} />
            </g>
          )
        })}

      {/* the coins: each a solid, rising onto the stack, each a little off the one below */}
      {Array.from({ length: 8 }, (_, i) => {
        const cy = coinBase - i * COIN_PITCH
        const cx = COIN_CX + (i % 2 ? 2 : -1.5)
        return (
          <g key={i} style={{ opacity: i < coins ? 1 : 0, transform: i < coins ? 'none' : 'translateY(-14px)', transition: ease, transitionDelay: `${i * 40}ms` }}>
            <path d={`M ${cx - COIN_RX} ${cy - COIN_BAND} V ${cy} A ${COIN_RX} ${COIN_RY} 0 0 0 ${cx + COIN_RX} ${cy} V ${cy - COIN_BAND} Z`} fill={`url(#${id}-band)`} />
            <path d={`M ${cx - COIN_RX} ${cy - COIN_BAND} V ${cy} A ${COIN_RX} ${COIN_RY} 0 0 0 ${cx + COIN_RX} ${cy} V ${cy - COIN_BAND} Z`} fill="#000000" opacity={0.08} />
            <ellipse cx={cx} cy={cy - COIN_BAND} rx={COIN_RX} ry={COIN_RY} fill={`url(#${id}-cointop)`} />
            <ellipse cx={cx} cy={cy - COIN_BAND} rx={COIN_RX - 7} ry={COIN_RY - 2.6} fill="none" stroke={K.ring} strokeWidth={1.3} opacity={0.55} />
            <ellipse cx={cx - 9} cy={cy - COIN_BAND - 3.4} rx={11} ry={3} fill={K.shine} opacity={0.85} />
            <path d={`M ${cx - COIN_RX + 3} ${cy - COIN_BAND + 2.5} Q ${cx - COIN_RX * 0.5} ${cy - COIN_BAND + COIN_RY + 2.5} ${cx + COIN_RX * 0.3} ${cy - COIN_BAND + COIN_RY + 0.5}`} stroke="#FFFFFF" strokeWidth={1} fill="none" opacity={0.28} />
            <path d={`M ${cx - COIN_RX + 2} ${cy - COIN_BAND + 4} Q ${cx - COIN_RX + 1} ${cy - 3} ${cx - COIN_RX + 6} ${cy - 1}`} stroke={K.shine} strokeWidth={1.4} fill="none" opacity={0.35} />
          </g>
        )
      })}
    </ClaySvg>
  )
}
