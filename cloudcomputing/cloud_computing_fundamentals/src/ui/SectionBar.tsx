import { useContext, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { DeckContext } from '@/deck/DeckContext'
import { InstantContext } from '@/motion/instant'
import { colors, SLIDE_WIDTH, SLIDE_HEIGHT } from '@/design/tokens'

/**
 * THE SECTION BAR (user, 2026-10-22 as a segmented progress bar; reworked on
 * the user's word 2026-10-23: "no progress bar below, just the sections with
 * equal width, a hover effect that shows the section breaker preview in
 * small, the bar height reduced, and clicking navigates to that section
 * breaker"). The blue band at the foot of every light slide is one segment
 * per agenda point, the boundaries read from the deck's section breaker
 * slides by `Deck` (`segments` on the deck context). EVERY SEGMENT IS THE
 * SAME WIDTH, whatever its slide count, with a thin gap between them, and
 * nothing fills: the band says where the sections are, not how far along
 * the deck is (the counter does that). The current section reads a touch
 * stronger, opacity only.
 *
 * Hovering (or focusing) a segment shows a small live preview of that
 * section's breaker slide above it, the slide's own element rendered at
 * 1280x720 under `InstantContext` and scaled into a 240x135 card, with the
 * section name under it; on touch the preview shows for a moment after the
 * tap. Pressing a segment jumps to the breaker (the opening segment, the
 * slides before the first breaker, jumps to slide 1). The preview is NOT in
 * the DOM at rest, nor on harness URLs, so the checks that measure every
 * slide never see it, and it is mounted only while shown, so the entrance
 * layer never animates it.
 *
 * Outside a deck (the review app, a lab) there is no context, and the band
 * is the plain bar it always was. The band keeps its place and its blue; its
 * height is 4px (6 on 2026-10-22, 8 before). Every drawn piece of the band
 * is under 16px tall, so the entrance layer never takes it for a unit.
 */
const H = 4
const GAP = 3
/** the pointer target, in SCREEN pixels: the slide is zoomed to fit the window, so the strip is scaled back up on a phone */
const HIT = 28
/** the preview card: the slide's 16:9 at a size that reads */
const PREVIEW_W = 240
const PREVIEW_H = Math.round((PREVIEW_W * SLIDE_HEIGHT) / SLIDE_WIDTH)
/** harness URLs measure the still deck; a pointer that happens to rest on the band must not open a preview there */
const STILL = typeof window !== 'undefined' && /[?&](all|noauto|still)(=|&|$)/.test(window.location.search)

export function SectionBar() {
  const deck = useContext(DeckContext)
  const [lit, setLitState] = useState<number | null>(null)
  const setLit = (v: number | null | ((p: number | null) => number | null)) => {
    if (!STILL) setLitState(v)
  }
  const tapTimer = useRef<number | undefined>(undefined)
  const bar = useRef<HTMLDivElement>(null)
  const [hit, setHit] = useState(HIT)
  useEffect(() => () => window.clearTimeout(tapTimer.current), [])
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const fit = () => {
      const sec = el.closest('section')
      const scale = sec ? sec.getBoundingClientRect().width / 1280 : 1
      setHit(Math.round(HIT / Math.max(0.1, scale || 1)))
    }
    /* the stage sets its zoom in an effect after this one, and a zoom change is not a resize to an observer: measure again next frame and on every window resize */
    fit()
    const raf = requestAnimationFrame(fit)
    const later = window.setTimeout(fit, 300)
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(later)
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])
  if (!deck || !deck.segments || deck.segments.length === 0 || !deck.jump) {
    return <div className="slide-footer-bar" style={{ background: colors.nwBlue, height: H }} />
  }
  const { segments, index } = deck
  const jump = deck.jump
  const tap = (k: number) => {
    setLit(k)
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => setLit((v) => (v === k ? null : v)), 1200)
  }
  const n = segments.length
  return (
    <div ref={bar} className="absolute inset-x-0 bottom-0 z-20 flex" style={{ height: H, gap: GAP }} aria-label="Sections" role="group">
      {segments.map((seg, k) => {
        const on = lit === k
        const here = index >= seg.start && index <= seg.end
        return (
          <div
            key={`${seg.name}-${k}`}
            role="button"
            tabIndex={0}
            data-section-bar=""
            aria-label={`Go to ${seg.name}`}
            className="relative flex-1 cursor-pointer outline-none"
            style={{ height: H }}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setLit(k)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setLit((v) => (v === k ? null : v))}
            onFocus={() => setLit(k)}
            onBlur={() => setLit((v) => (v === k ? null : v))}
            onClick={() => {
              tap(k)
              jump(seg.target)
            }}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                jump(seg.target)
              }
            }}
          >
            {/* the hit strip: a thumb-sized target above the band, nothing drawn */}
            <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: hit }} />
            {/* the segment: the template's blue, a touch stronger for the section on screen and under the pointer */}
            <span aria-hidden className="absolute inset-0" style={{ background: colors.nwBlue, opacity: on ? 1 : here ? 0.92 : 0.55, transition: 'opacity 150ms ease-out' }} />
          </div>
        )
      })}
      {/* the preview, mounted only while a segment is lit: one card, centred on its segment and kept inside the slide */}
      {lit !== null && segments[lit] && (
        <SegmentPreview seg={segments[lit]} left={Math.max(PREVIEW_W / 2 + 8, Math.min(SLIDE_WIDTH - PREVIEW_W / 2 - 8, ((lit + 0.5) * SLIDE_WIDTH) / n))} />
      )}
    </div>
  )
}

/** The breaker slide, live and small, with the section's name under it. `inert` and `aria-hidden`: a picture, not a second slide. */
function SegmentPreview({ seg, left }: { seg: { name: string; element?: React.ReactNode }; left: number }) {
  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center"
      style={{ left, bottom: H + 60, transform: 'translateX(-50%)', width: PREVIEW_W }}
      aria-hidden
    >
      {/* the name sits OVER the card: under it, it met the player's control bar at the foot of the first segments */}
      <span
        className="mb-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-heading text-[14px] font-semibold"
        style={{ background: colors.nwNavy, color: colors.white, boxShadow: '0 6px 16px -8px rgba(0,37,75,0.5)' }}
      >
        {seg.name}
      </span>
      <div
        className="relative overflow-hidden rounded-[10px] bg-[#f4f6fb]"
        style={{ width: PREVIEW_W, height: PREVIEW_H, boxShadow: '0 12px 28px -10px rgba(0,37,75,0.55), 0 0 0 1.5px rgba(255,255,255,0.9)' }}
      >
        {seg.element && (
          <div
            inert
            className="deck-thumb pointer-events-none absolute left-0 top-0 origin-top-left"
            style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${PREVIEW_W / SLIDE_WIDTH})` }}
          >
            <InstantContext.Provider value={true}>{seg.element}</InstantContext.Provider>
          </div>
        )}
      </div>
    </div>
  )
}
