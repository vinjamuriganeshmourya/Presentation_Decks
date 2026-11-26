import { useId, type CSSProperties, type ReactElement } from 'react'
import { GRADIENT_GROUND, MESH_GROUND } from './grounds'

/**
 * THE UPDATED TEMPLATE'S GROUNDS, ON THE KIT'S 1280x720 CANVAS.
 *
 * Ported 2026-10-12 from `updated_template/src/ui/shared.tsx` and its
 * `src/design/grounds.ts` (the fitted gradient stacks, copied verbatim into
 * `./grounds.ts`) for `new-template-slide-generation/`, and made the base
 * template on the user's word on 2026-10-14. `SlideBase` paints one of them
 * under every slide. Every number there is a px on a 1920x1080 stage, measured
 * off the reference renders, so nothing is re-measured here: the ground is
 * drawn on a 1920x1080 box and scaled by 2/3 onto this canvas. Rings are
 * divs, as the kit's were, so the video-box sweep skips them.
 *
 *   paper     the agenda ground: off-white, the azure corner wash, two rings
 *   mesh      the welcome / next-session mesh, with its grain
 *   gradient  the closing gradient (thank you, section breaker), with its grain
 */
export type TemplateGroundName = 'paper' | 'mesh' | 'gradient'

const W = 1920
const H = 1080
const SCALE = 1280 / W

const DEEP = '#0146C7'
const WHITE = '#FFFFFF'
const PAPER = '#F0F3FC'

const WASH_CURVE: Array<[stop: number, alpha: number]> = [
  [0, 1], [7, 0.98], [18, 0.87], [28, 0.73], [38, 0.56], [48, 0.36],
  [58, 0.21], [69, 0.11], [85, 0.02], [100, 0],
]
const PAPER_GROUND = [
  `radial-gradient(980px 900px at 100% 0%, ${WASH_CURVE.map(([s, a]) => `rgba(41,137,253,${a}) ${s}%`).join(', ')})`,
  PAPER,
].join(', ')

const GROUND: Record<TemplateGroundName, string> = {
  paper: PAPER_GROUND,
  mesh: MESH_GROUND,
  gradient: GRADIENT_GROUND,
}

/** The base colour under each ground, for the frame itself. */
export const GROUND_BASE: Record<TemplateGroundName, string> = {
  paper: PAPER,
  mesh: '#0000C5',
  gradient: '#1F27EE',
}

/** Grain, tuned in the template to the references' noise statistics. The paper has none. */
const GRAIN: Record<TemplateGroundName, { amount: number; frequency: number }> = {
  mesh: { amount: 0.115, frequency: 0.35 },
  gradient: { amount: 0.057, frequency: 0.5 },
  paper: { amount: 0, frequency: 0 },
}

const ARC_RADIUS = 790
const ARC_STROKE = 3

function Arc({ cx, cy, color, opacity = 1, mask }: { cx: number; cy: number; color: string; opacity?: number; mask?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: 'absolute',
        left: cx - ARC_RADIUS,
        top: cy - ARC_RADIUS,
        width: ARC_RADIUS * 2,
        height: ARC_RADIUS * 2,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: `${ARC_STROKE}px solid ${color}`,
        opacity,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  )
}

/** The agenda ground's two rings. */
function PaperRings() {
  return (
    <>
      <Arc cx={1159} cy={753} color={DEEP} opacity={0.26} mask="linear-gradient(90deg, transparent 0%, transparent 52%, #000 72%)" />
      <Arc cx={2428} cy={36} color={DEEP} opacity={0.27} />
    </>
  )
}

/** The welcome / next-session rings. */
function MeshRings() {
  return (
    <>
      <Arc
        cx={850}
        cy={931}
        color={DEEP}
        mask={
          'conic-gradient(from 0deg, rgba(0,0,0,.30) 0deg, rgba(0,0,0,.35) 10deg, rgba(0,0,0,.39) 20deg, ' +
          'rgba(0,0,0,.42) 30deg, rgba(0,0,0,.46) 40deg, rgba(0,0,0,.51) 50deg, rgba(0,0,0,.53) 60deg, ' +
          'rgba(0,0,0,.54) 70deg, rgba(0,0,0,.53) 80deg, rgba(0,0,0,.52) 90deg, rgba(0,0,0,.48) 100deg, ' +
          'rgba(0,0,0,.40) 110deg, transparent 120deg, transparent 300deg, rgba(0,0,0,.07) 310deg, ' +
          'rgba(0,0,0,.10) 320deg, rgba(0,0,0,.14) 330deg, rgba(0,0,0,.21) 340deg, rgba(0,0,0,.25) 350deg, ' +
          'rgba(0,0,0,.30) 360deg)'
        }
      />
      <Arc
        cx={2220}
        cy={196}
        color={DEEP}
        mask={'conic-gradient(from 0deg, transparent 195deg, rgba(0,0,0,.6) 202deg, rgba(0,0,0,.9) 210deg, #000 220deg, #000 360deg)'}
      />
    </>
  )
}

/** The closing frames' rings (thank you, section breaker). */
function ClosingRings() {
  return (
    <>
      <Arc
        cx={850}
        cy={1014}
        color={WHITE}
        opacity={0.16}
        mask={
          'conic-gradient(from 0deg, rgba(0,0,0,.94) 0deg, rgba(0,0,0,.88) 10deg, rgba(0,0,0,.75) 20deg, ' +
          'rgba(0,0,0,.56) 30deg, rgba(0,0,0,.31) 40deg, rgba(0,0,0,.12) 50deg, transparent 60deg, ' +
          'transparent 270deg, rgba(0,0,0,.12) 280deg, rgba(0,0,0,.19) 290deg, rgba(0,0,0,.75) 300deg, ' +
          'rgba(0,0,0,.88) 310deg, rgba(0,0,0,.94) 320deg, #000 330deg, #000 350deg, rgba(0,0,0,.94) 360deg)'
        }
      />
      <Arc
        cx={2122}
        cy={214}
        color={DEEP}
        mask={'conic-gradient(from 0deg, transparent 190deg, rgba(0,0,0,.57) 200deg, rgba(0,0,0,.9) 210deg, #000 220deg, #000 360deg)'}
      />
    </>
  )
}

const RINGS: Record<TemplateGroundName, () => ReactElement> = {
  paper: PaperRings,
  mesh: MeshRings,
  gradient: ClosingRings,
}

/**
 * The ground and its rings, behind a slide's content. `rings={false}` keeps
 * the wash and drops the rings, for a slide that asked the kit for no decor.
 */
export function TemplateStage({ ground, rings = true }: { ground: TemplateGroundName; rings?: boolean }) {
  const filterId = `tpl-grain-${useId().replace(/:/g, '')}`
  const grain = GRAIN[ground]
  const Rings = RINGS[ground]
  const box: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W,
    height: H,
    transform: `scale(${SCALE})`,
    transformOrigin: '0 0',
    overflow: 'hidden',
  }
  return (
    <div aria-hidden className="pointer-events-none" style={box}>
      {grain.amount > 0 && (
        <svg width={0} height={0} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
          <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={grain.frequency} numOctaves={1} seed={7} stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="mono" />
            <feComposite in="SourceGraphic" in2="mono" operator="arithmetic" k1={0} k2={1} k3={grain.amount} k4={-grain.amount / 2} />
          </filter>
        </svg>
      )}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          background: GROUND[ground],
          filter: grain.amount > 0 ? `url(#${filterId})` : undefined,
        }}
      />
      {rings && <Rings />}
    </div>
  )
}

/**
 * The template's glass pill: white at 10% over the ground blurred 24px (16px
 * here), a 1px rim at 33% white, a short dark shadow under the bottom edge.
 * Measured on the 1920 frame; the blur and shadow are scaled to this canvas.
 */
export const glassPill: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.10)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.33), 0 2px 6px rgba(0,8,50,0.35)',
}

/** The slab behind a hero word, sized off its font: height 1.2·fs, side padding 0.62·fs. */
export function heroSlab(fontSize: number): CSSProperties {
  return { height: Math.round(fontSize * 1.2), padding: `0 ${Math.round(fontSize * 0.62)}px` }
}

/** The template's hero type, scaled 2/3: welcome 192 → 128, closing 150 → 100, section title 101 → 67. */
export const TPL = {
  heroWelcome: 128,
  heroClosing: 100,
  sectionTitle: 67,
  /** the centred mark on the welcome / closing frames: 332px wide at 1920 */
  heroLogoWidth: 221,
  /** mark top: welcome 266, closing 307; slab centre line: welcome 687, closing 667 */
  welcomeLogoTop: 177,
  welcomeSlabCenter: 458,
  closingLogoTop: 205,
  closingSlabCenter: 445,
} as const
