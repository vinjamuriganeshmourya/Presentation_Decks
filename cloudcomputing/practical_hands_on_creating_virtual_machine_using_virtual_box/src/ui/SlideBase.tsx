import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { SectionBar } from './SectionBar'
import { GROUND_BASE, TemplateStage, type TemplateGroundName } from '@/design/ground'

export type SlideVariant = 'light' | 'plain' | 'brand' | 'night'

/**
 * THE GROUNDS (the updated template, the base template since 2026-10-14).
 *
 * Every slide sits on one of the three grounds in `src/design/ground.tsx`:
 *
 *   paper     every light slide: off-white, the azure wash in the top-right
 *             corner, two thin deep-blue rings
 *   gradient  every dark slide unless it asks otherwise: the closing blue
 *             gradient with its grain and two rings (section breakers, the
 *             session name, practice, feedback, thank you, all the best)
 *   mesh      the welcome and next-session frames, which pass `ground="mesh"`
 *
 * These replaced the kit's own furniture: the pale wash and the two measured
 * hairline arcs on the light family, and the two orbs and the dot grid on the
 * dark family. The design was first proved on `new-template-slide-generation/`
 * (Python session 20 re-dressed in `updated_template/`, 2026-10-12) and made
 * the base template on the user's word on 2026-10-14. The old furniture is
 * deleted, not switched off: a frame that carries two grounds is a frame whose
 * look depends on stacking order, which the `BG` note below records happening
 * once already.
 *
 * `decor={false}` keeps the ground and drops its rings, for a slide that wants
 * the quieter frame (the quiz announcement).
 */

/**
 * THE FOUR STAGES.
 *
 * `night` is the deck's ONE dark stage. Every dark chrome slide (welcome,
 * session name, section dividers, practice, feedback, thank you) sits on it, so
 * the deck opens and closes on one ground instead of jumping between two.
 *
 * Two things were wrong here before, and they compounded:
 *
 *   1. `night` was the Evolve near-black (`bg-night-gradient`, #081026) and
 *      `brand` was the Evolve blue-into-teal (`bg-brand-gradient`) — neither is
 *      in the style guide. So every dark slide overrode this map by passing
 *      `className="bg-nw-gradient"` on top.
 *   2. That override sets the SAME CSS property as the class here, so which one
 *      won was decided by Tailwind's output order — the order of keys in
 *      `backgroundImage` in tailwind.config.ts — not by intent. Reordering that
 *      config object silently recoloured every dark slide in the deck.
 *
 * Both are fixed by naming the real grounds here and passing NO background in
 * `className` from a slide. If a slide needs a different ground, it gets a
 * variant, not an override. The class here sets the text colour and a fallback;
 * the painted ground is `GROUND_BASE` plus `TemplateStage`, below.
 */
const BG: Record<SlideVariant, string> = {
  light: 'bg-brand-soft text-ink',
  plain: 'bg-white text-ink',
  /* The bright style-guide gradient. Kept nameable, but no slide type uses it:
     the chrome all sits on `night` so the deck reads as one theme. */
  brand: 'bg-nw-gradient text-white',
  night: 'bg-nw-night text-white',
}

/**
 * The frame every slide sits in: a 1280×720 canvas with a background
 * variant, one of the three grounds, and an optional footer carrying
 * the NxtWave mark. Content slides use `light`/`plain`; section & hero
 * slides use `brand`/`night`.
 */
export function SlideBase({
  variant = 'light',
  children,
  className = '',
  decor = true,
  /**
   * Which ground a DARK slide sits on: the closing gradient by default, the
   * welcome mesh when a slide asks. Light slides always sit on the paper ground.
   */
  ground,
  footer = true,
  footerLogo = true,
  /**
   * Session name. Accepted for API compatibility (every slide type forwards it)
   * but no longer rendered: see the footer note below.
   */
  lesson: _lesson,
  padded = true,
}: {
  variant?: SlideVariant
  children: ReactNode
  className?: string
  decor?: boolean
  footer?: boolean
  /** Hide the footer logo while keeping the lesson text (brand slide: logo hero already on stage). */
  footerLogo?: boolean
  lesson?: string
  padded?: boolean
  ground?: TemplateGroundName
}) {
  const dark = variant === 'brand' || variant === 'night'
  const stage: TemplateGroundName = dark ? (ground ?? 'gradient') : 'paper'
  return (
    <section
      className={`absolute inset-0 overflow-hidden font-body ${BG[variant]} ${className}`}
      style={{ width: 1280, height: 720, background: GROUND_BASE[stage] }}
    >
      {/* The ground and its rings, under everything. */}
      <TemplateStage ground={stage} rings={decor} />
      {/*
        VIDEO BOX RESERVATION
        The top-right 367x220 of this 1280x720 canvas (equivalently 550x330 on a
        1920x1080 canvas) is kept clear for an instructor video composited in
        later. The box is deliberately NOT drawn here: slides simply do not place
        anything in x 913..1280, y 0..220. Run `node video-safe.mjs <url> <count>`
        to assert that. The ground's rings are `pointer-events-none` divs, which
        that sweep skips, the same as the kit's old arcs were.
      */}

      {/* Content region */}
      <div className={`relative z-10 flex h-full flex-col ${padded ? 'px-16 pb-16 pt-12' : ''}`}>
        {children}
      </div>

      {/*
        Footer: the NxtWave mark only, bottom-RIGHT.

        The mark and the deck's control cluster swapped corners: the mark is the
        signature and belongs where the eye finishes, and the controls are the
        presenter's tools rather than the room's. See `DeckControls`, which now
        pins itself bottom-left; the two must stay on opposite sides or they
        collide.

        The session name is deliberately NOT repeated here. It used to sit in
        this corner, under what was then the control cluster, so it collided with
        the slide counter. The session name is already on stage via each slide's kicker, so
        the footer copy was duplication as well as a collision.

        `lesson` is still accepted (it is part of the kit's API and `sampleDeck`
        passes it) but is no longer rendered.

        HALF SIZE since 2026-10-23 (content rule 50): 18px tall, where it was
        36px (`h-9`). The user, on Cloud Computing Fundamentals: reduce the mark
        at the bottom of every slide by 50 percent, in every deck from now on.
        Same corner, same reverse-to-white on a dark ground; only the size.
      */}
      {footer && (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-end px-8 pb-4">
          {footerLogo && <Logo className="h-[18px]" onDark={dark} />}
        </footer>
      )}
      {/* The bar is the template's flat brand blue, not the old navy-to-blue run; since 2026-10-22 it is
          segmented per section and pressable (`SectionBar`), and the plain bar outside a deck. */}
      {footer && !dark && <SectionBar />}
    </section>
  )
}
