import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Num, STILL, useBuild } from '@/decks/figures/scene'
import { StepLabel } from '@/decks/figures/net/frames'
import { Icon, Rich } from '@/engine/icon'
import { MOTION, motionHeld } from '@/motion/tokens'
import { useInstant } from '@/motion/instant'
import { dims } from 'virtual:deck'

/**
 * THE PRACTICAL (Session 10, TR 24-28), copied from Session 9 (itself from Session 7), built from Session 6's lab frames (its `E_BrowserTest` capture + caption pair and
 * its `E_Steps` zig-zag timeline), so the two sessions' labs read alike:
 *   L_Shot   one capture (R7.9: one sharp enlarged image, its orange rings lit one per press) with the TR's
 *            caption in an explanation box level with the capture's TOP edge (standing correction 7). A TR lab
 *            slide holds two captures, so it is two L_Shot frames with the same kicker and title; the TR's
 *            lead sits on the first. `leadSide` moves a lead into the caption column so a tall capture keeps
 *            its height.
 *   L_Steps  numbered lab steps as the vertical zig-zag timeline (standing correction 8), with an optional lead.
 */

const SHADOW = '0 12px 30px -18px rgba(16,32,58,0.45)'
const CARD = '0 6px 18px -14px rgba(16,32,58,0.35)'

/** a lead with "\n" between its sentences: one line each (rule 36) */
const Lines = ({ text }: { text: string }) => (
  <>
    {text.split('\n').map((l, i) => (
      <span key={i} className="block">
        <Rich text={l} />
      </span>
    ))}
  </>
)

type ShotProps = {
  id: string
  kicker: string
  title: string
  lead?: string
  leadSide?: boolean
  /** the capture's heading; left out where the caption already names the capture (the split P04 pair) */
  step?: string
  icon?: string
  image: string
  rings?: [number, number, number, number][]
  caption: string
  /** a very wide capture: the step and caption sit in one row ABOVE it, so it takes the full width */
  below?: boolean
  /** the TR's closing lines for the capture, in a box under the caption (side frame only) */
  note?: string
  /** kept for older entries: every ring is now drawn inside its box (see below) */
  ringInset?: boolean
  lesson: string
}

/*
  THE WHOLE CAPTURE, NEVER CROPPED (Session 10 review, standing correction 15 / FIG-35): every TR screenshot is shown
  entire at its own aspect ratio, as large as the frame allows. The step label is the heading INSIDE the caption box,
  so the box's top stays level with the capture's top (correction 7) and no row is spent above the capture. A ring is
  the target's box in the image's own pixels, drawn INSIDE that box and clamped to the image, so it never leaves the
  screenshot or reaches the next line.
*/
const COL = 300 // the caption column's least width beside a capture
const GAP = 24
const RING = 2.5
/* the reserved instructor-video box on the 1280 canvas: x >= VID_X, y < 220; the body box's left edge is LEFT */
const VID_X = 913
const LEFT = (1280 - BOX_W) / 2

export function ShotImage({ image, w, h, k, rings, shown, held }: { image: string; w: number; h: number; k: number; rings: [number, number, number, number][]; shown: number; held: boolean }) {
  return (
    <div className="l-shot relative shrink-0" style={{ width: w, height: h }}>
      <div className="relative overflow-hidden rounded-[4px] bg-white" style={{ width: w, height: h, boxShadow: SHADOW }}>
        <img src={image} alt="" draggable={false} className="block max-w-none select-none" style={{ width: w, height: h }} />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[4px]" style={{ boxShadow: `inset 0 0 0 1px ${colors.line}` }} />
      </div>
      {rings.map(([x, y, rw, rh], i) => {
        const l = Math.max(0, x * k)
        const t = Math.max(0, y * k)
        const r = Math.min(w, (x + rw) * k)
        const b = Math.min(h, (y + rh) * k)
        return (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute"
            style={{ left: l, top: t, width: r - l, height: b - t, borderRadius: 4, boxShadow: `inset 0 0 0 ${RING}px ${colors.accent}`, opacity: i < shown ? 1 : 0, transform: i < shown ? 'none' : 'scale(1.04)', transition: held ? 'none' : `opacity ${MOTION.ring}ms ${MOTION.ease}, transform ${MOTION.ring}ms ${MOTION.ease}` }}
          />
        )
      })}
    </div>
  )
}

function CaptionBox({ step, icon, lead = 'Info', caption, className = '' }: { step?: string; icon?: string; /** the icon before the caption's words */ lead?: string; caption: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 rounded-[14px] border border-line bg-white px-4 py-3 ${className}`} style={{ boxShadow: CARD }}>
      {step && (
        <span className="flex items-center gap-2 font-heading text-[18px] font-bold leading-tight" style={{ color: colors.brand }}>
          <Icon name={icon ?? 'Camera'} size={18} />
          <Rich text={step} />
        </span>
      )}
      <span className="flex items-start gap-2.5">
        <span className="mt-[2px] shrink-0" style={{ color: colors.brand }}>
          <Icon name={lead} size={19} />
        </span>
        <span className="l-nw text-[17px] leading-snug" style={{ color: colors.ink }}>
          <Lines text={caption} />
        </span>
      </span>
    </div>
  )
}

function L_Shot({ id, kicker, title, lead, leadSide, step, icon, image, rings = [], caption, below, note, lesson }: ShotProps) {
  const lit = useBuild(rings.length + 1, MOTION.build, MOTION.buildLead)
  const held = motionHeld(useInstant())
  const shown = STILL ? rings.length : lit
  const [nw, nh] = (dims as Record<string, [number, number]>)[image] ?? [1600, 900]
  /* the body starts at y 221 (ZONE.band.top), or under a header lead (162 + ~33 px a line + its gap), and must end
     by 640 (the safe bottom over the player bar) */
  const leadLines = lead && !leadSide ? lead.split('\n').reduce((a, l) => a + Math.ceil(l.length / 78), 0) : 0
  /* no header lead: the body is pulled up to where a lead would start (162), so the capture uses the band a lead
     would fill instead of leaving it empty under the title (coordinator, slide 52) */
  /* no header lead: the body is pulled up to where a lead would start (162), so the capture uses the band a lead
     would fill instead of leaving it empty under the title (coordinator, slide 52). The instructor-video box
     (x >= 913, y < 220, checks/video-safe.mjs) stays empty: only a wide capture's frame rises to 162, its step row
     ending left of 913; a side frame (caption column beside) stays at 221 */
  const top = leadLines ? 162 + leadLines * 33 + 28 : 162
  const lifted = !leadLines
  const lift = lifted ? { marginTop: -(221 - 162) } : undefined
  if (below) {
    /* one row above: the step label, then the caption box beside it */
    const ROW = 50 + 12
    const k = Math.min(BOX_W / nw, (640 - top - ROW) / nh)
    const w = Math.round(nw * k)
    const h = Math.round(nh * k)
    return (
      <Card id={id} kicker={kicker} title={title} lead={lead && !leadSide ? <Lines text={lead} /> : undefined} lesson={lesson}>
        <div className="flex flex-col items-center gap-3" style={{ width: BOX_W, ...lift }}>
          <div className="flex items-center gap-5" style={{ width: w }}>
            <div className="flex items-center gap-5" style={{ maxWidth: lifted ? VID_X - 6 - (LEFT + (BOX_W - w) / 2) : w }}>
            {step && (
            <StepLabel>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Icon name={icon ?? 'Camera'} size={18} />
                <Rich text={step} />
              </span>
            </StepLabel>
            )}
            <CaptionBox caption={caption} lead={step ? undefined : icon} className="min-w-0" />
            </div>
          </div>
          <ShotImage image={image} w={w} h={h} k={k} rings={rings} shown={shown} held={held} />
        </div>
      </Card>
    )
  }
  /* beside a capture the caption box stays level with the capture's top (standing correction 7 wins over size), and
     the column may not rise into the video box, so a side frame keeps the band top (221) when there is no lead */
  const sideTop = leadLines ? top : 221
  const k = Math.min((BOX_W - GAP - COL) / nw, (640 - sideTop) / nh)
  const w = Math.round(nw * k)
  const h = Math.round(nh * k)
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead && !leadSide ? <Lines text={lead} /> : undefined} lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W, gap: GAP }}>
        <ShotImage image={image} w={w} h={h} k={k} rings={rings} shown={shown} held={held} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <CaptionBox step={step} icon={icon} lead={step ? undefined : icon} caption={caption} />
          {note && <CaptionBox lead="Calculator" caption={note} />}
          {lead && leadSide && (
            <p className="l-nw px-1 text-[18px] leading-snug" style={{ color: colors.ink }}>
              <Lines text={lead} />
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ numbered lab steps, a zig-zag timeline */

const ROW = 52
const SPINE = 56
const TOP = 36
const FOOT = 60

function L_Steps({ id, kicker, title, lead, steps, lesson }: { id: string; kicker: string; title: string; lead?: string; steps: { text: string; icon?: string }[]; lesson: string }) {
  const half = (BOX_W - SPINE) / 2
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <Lines text={lead} /> : undefined} lesson={lesson}>
      <div className="relative" style={{ width: BOX_W, height: TOP + (steps.length - 1) * ROW + FOOT }}>
        <span aria-hidden className="absolute rounded-full" style={{ left: BOX_W / 2 - 1.5, top: TOP, width: 3, height: (steps.length - 1) * ROW, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.line} 100%)` }} />
        {steps.map((p, i) => {
          const left = i % 2 === 0
          const cy = TOP + i * ROW
          const reach = SPINE / 2 + 22
          return (
            <div
              key={i}
              className="absolute flex items-center"
              style={{ left: left ? 0 : half + SPINE - reach, top: cy, width: half + reach, transform: 'translateY(-50%)', flexDirection: left ? 'row' : 'row-reverse', boxShadow: '0 0 0 0 transparent' }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-2.5" style={{ boxShadow: '0 10px 24px -16px rgba(16,32,58,0.4)' }}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: colors.surface2, color: colors.brand }}>
                  <Icon name={p.icon} size={19} />
                </span>
                <span className="l-nw text-[16px] leading-snug" style={{ color: colors.ink }}>
                  <Rich text={p.text} />
                </span>
              </div>
              <span aria-hidden className="shrink-0" style={{ width: SPINE / 2 - 20, height: 2, background: colors.line }} />
              <span className="shrink-0" style={{ borderRadius: 999, boxShadow: `0 0 0 5px ${colors.surface}, 0 8px 18px -10px rgba(45,99,251,0.6)` }}>
                <Num n={i + 1} size={40} />
              </span>
              <span aria-hidden className="shrink-0" style={{ width: 2 }} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {}

export const slides = {
  L_Shot: L_Shot as unknown as (p: Record<string, unknown>) => ReactNode,
  L_Steps: L_Steps as unknown as (p: Record<string, unknown>) => ReactNode,
}

export const css = `.l-shot img { image-rendering: auto; } .l-nw code { white-space: nowrap; }`
