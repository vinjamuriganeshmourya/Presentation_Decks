import type { ReactNode } from 'react'
import { Info, TriangleAlert } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { BOX_W, STILL, useBuild } from '../scene'
import { Bullet, fx } from './fx'
import { SHOT_SIZE, shot, type Rect } from './frames'

/**
 * THE LAB'S SCREENSHOT SLIDE (T25-1 to T28-3). Round 2 (the FS team's review,
 * 2026-11-04, course rule R7.9) replaced Session 4's capture-plus-zoom pair
 * with ONE enlarged capture:
 *
 *   StepHead     the step's glyph, the step label (the card's caption, its
 *                words unchanged), the rule under it
 *   ShotOne      the FULL TR capture (never cropped, never redrawn), as large
 *                as the body allows, centred, its orange rings on it (rule 51);
 *                no zoom copies, no number badges
 *   ExplainBox   the card's other words in a box under it: an info box for a
 *                line, the orange note box for a caution
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/** A ring's box in view pixels (2px outside the marked region), clamped to the capture so no edge is cropped. */
function ringBox([hx, hy, hw, hh]: Rect, x: number, y: number, s: number, vw: number, vh: number): Rect {
  const l = Math.max(0, (hx - x) * s - 2)
  const t = Math.max(0, (hy - y) * s - 2)
  const r = Math.min(vw, (hx - x + hw) * s + 2)
  const b = Math.min(vh, (hy - y + hh) * s + 2)
  return [l, t, r - l, b - t]
}

/** A TR capture drawn as a background (the element IS the visible window), with its rings. */
function ShotView({ name, crop, scale: s, rings, on, cur = -1, alt, ringW = 2.5 }: { name: string; crop?: Rect; scale: number; rings: Rect[]; on: boolean[]; cur?: number; alt: string; ringW?: number }) {
  const instant = useInstant()
  const [W, H] = SHOT_SIZE[name]
  const [x, y, w, h] = crop ?? [0, 0, W, H]
  const vw = Math.round(w * s)
  const vh = Math.round(h * s)
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: vw, height: vh, boxShadow: '0 18px 36px -22px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)', background: colors.white }}>
      <div role="img" aria-label={alt} className="absolute inset-0 select-none" style={{ backgroundImage: `url(${shot(name)})`, backgroundSize: `${W * s}px ${H * s}px`, backgroundPosition: `${-x * s}px ${-y * s}px`, backgroundRepeat: 'no-repeat' }} />
      {rings.map((r, i) => {
        const [l, t, rw, rh] = ringBox(r, x, y, s, vw, vh)
        const now = cur === -1 || cur === i
        return (
          <span
            key={i}
            aria-hidden
            className={`absolute rounded-md ${on[i] && !STILL && now ? 'net-ring' : ''}`}
            style={{
              left: l, top: t, width: rw, height: rh,
              border: `${ringW}px solid ${colors.accent}`, boxShadow: `0 0 0 4px ${colors.accent}30`,
              opacity: on[i] ? (now ? 1 : 0.45) : 0,
              transform: on[i] ? 'scale(1)' : 'scale(1.18)',
              transition: instant ? 'none' : `opacity 360ms ${EASE}, transform 460ms cubic-bezier(0.34,1.56,0.64,1)`,
            }}
          />
        )
      })}
    </div>
  )
}

/** The step label with the rule under it (G9): the step's glyph in a raised tile, the label, the rule drawing in. */
export function StepHead({ glyph, children }: { glyph?: ReactNode; children: ReactNode }) {
  /* the clear ring makes the head ONE block for the step-by-step entrance (glyph, label and rule in one press) */
  return (
    <div className="flex flex-col gap-2.5" style={{ boxShadow: '0 0 0 0 transparent' }}>
      <div className="flex items-center gap-3">
        {glyph && (
          <span aria-hidden className={`grid shrink-0 place-items-center rounded-[12px] ${fx('lift', 0, 3.2).className}`} style={{ ...fx('lift', 0, 3.2).style, width: 42, height: 42, background: 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)', boxShadow: 'inset 0 0 0 1px #CFDCF5, 0 10px 20px -14px rgba(31,64,140,0.5)' }}>
            {glyph}
          </span>
        )}
        <span className="font-heading text-[22px] font-bold leading-tight" style={{ color: colors.brandDark }}>
          {children}
        </span>
      </div>
      <span aria-hidden className="block h-px w-full" style={{ background: `linear-gradient(90deg, ${colors.brand}66 0%, ${colors.line} 40%)` }} />
    </div>
  )
}

/**
 * The words under a screenshot, in a box led by an icon (Session 4's
 * `ExplainBox`): `info` the brand box, `note` the orange caution box (the
 * deck's `NoteBox` skin). The icon is centred on the first line (G7).
 */
export function ExplainBox({ children, tone = 'info', icon, width = BOX_W, strong }: { children: ReactNode; tone?: 'info' | 'note'; icon?: ReactNode; width?: number; strong?: boolean }) {
  const note = tone === 'note'
  const bold = strong ?? !note
  const ink = note ? colors.accent : colors.brand
  return (
    <div
      className="flex items-start gap-3.5 rounded-2xl px-5 py-3"
      style={{
        width,
        background: note ? 'linear-gradient(135deg, #FFF7EC 0%, #FFEBD4 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%)',
        boxShadow: note ? `inset 5px 0 0 0 ${ink}, inset 0 0 0 1px #F8D9B4, 0 12px 24px -18px rgba(229,115,42,0.45)` : `inset 0 0 0 1px ${colors.line}, inset 4px 0 0 0 ${ink}, 0 10px 24px -18px rgba(16,32,58,0.5)`,
      }}
    >
      <Bullet kind="icon" size={17} lineH={1.45} tone={ink}>
        <span className="grid h-full w-full place-items-center rounded-[6px] [&>svg]:h-[13px] [&>svg]:w-[13px]" style={{ background: ink, color: colors.white }}>
          {icon ?? (note ? <TriangleAlert /> : <Info />)}
        </span>
      </Bullet>
      <div className={`min-w-0 text-[17px] leading-[1.45] ${bold ? 'font-semibold' : ''}`} style={{ color: colors.ink }}>
        {children}
      </div>
    </div>
  )
}

/**
 * ONE CAPTURE (course rule R7.9, the FS team's review 2026-11-04: "remove the
 * zoomed-out screenshot versions completely, remove the numbering, keep only
 * the highlighted rings, vertically center the screenshot and enlarge it"):
 * the full TR capture at the largest size that fits `maxW` x `maxH`, centred
 * in the body, its orange rings on it. Steps (useBuild, one per press with
 * auto animation off): each ring in turn; the newest ring pulses, the others
 * stay on. Harness URLs hold every ring on.
 */
export function ShotOne({ name, highlight, alt, maxW = BOX_W, maxH }: { name: string; highlight: Rect[]; alt: string; maxW?: number; maxH: number }) {
  const [W, H] = SHOT_SIZE[name]
  const s = Math.min(maxW / W, maxH / H)
  const b = useBuild(highlight.length + 1, 700)
  const on = highlight.map((_, i) => b >= i + 1)
  return (
    <div className="flex justify-center" style={{ width: BOX_W }}>
      <ShotView name={name} scale={s} rings={highlight} on={on} cur={-1} alt={alt} ringW={3} />
    </div>
  )
}
