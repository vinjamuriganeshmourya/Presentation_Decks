import { SlideBase } from '@/ui'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { glassPill } from '@/design/ground'
import { fonts } from '@/design/tokens'
import type { NextSessionSlideProps } from './types'

/**
 * NEXT SESSION — the signpost before the close.
 *
 * THE UPDATED TEMPLATE'S SIGNPOST (user, 2026-10-12; the base template since
 * 2026-10-14; sits after the takeaways, before the close). The frame is the template's next-session slide
 * (`updated_template/src/slides/NextSessionSlide.tsx`, measured off
 * `slidestraining/nextsession/`), every number there ÷ 1.5 for this canvas:
 * the welcome mesh with its two rings; a glass chip "Next Session »" centred
 * with its top at y=205 (307 on the 1920 frame), 79px tall (119), 45px of
 * chip before the label and 35px after the chevrons (67 / 53), 25px between
 * them (38), the label DM Sans Medium 51px (77); the next session's name
 * under it in Sora SemiBold 84px (126) on a 109px line pitch (163), centred
 * in a 920px measure (1380). The reference puts the chip's top at y=205 (307)
 * and the name's line box at y=298 (447); on the user's word the two are
 * instead ONE BLOCK CENTRED BOTH WAYS in the slide, keeping that 14px gap.
 * The mark is in the corner, the kit's footer mark. The chip and the name
 * reveal the kit's way.
 */
const CHIP = { height: 79, padLeft: 45, padRight: 35, gap: 25, fontSize: 51 } as const
const NAME = { width: 920, fontSize: 84, lineHeight: 163 / 126 } as const
/** chip bottom to the name's line box: 284 → 298 on the reference positions. */
const GAP = 14

/** The double chevron in the chip: 54x46 at 1920 (36x31 here), two 9-unit strokes. */
function Chevrons() {
  return (
    <svg width={36} height={31} viewBox="0 0 54 46" fill="none" aria-hidden>
      <path d="M5 5 L23 23 L5 41" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 5 L49 23 L31 41" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NextSessionSlide({ label = 'Next Session', title, lesson }: NextSessionSlideProps) {
  return (
    <SlideBase variant="night" ground="mesh" lesson={lesson} footer padded={false}>
      {/* The chip and the name are one block, centred both ways in the slide
          (user, 2026-10-12), with the reference's 14px between them. The wrapper
          stops 8px short of the frame's sides and 12px short of its top and bottom,
          which leaves the centre where it is and keeps `qa.mjs` from reporting a
          full-bleed box as overflow. */}
      <RevealGroup className="absolute inset-x-2 inset-y-3 flex flex-col items-center justify-center" style={{ gap: GAP }} stagger={0.12}>
        <Reveal dir="up">
          <div style={{ ...glassPill, height: CHIP.height, padding: `0 ${CHIP.padRight}px 0 ${CHIP.padLeft}px`, gap: CHIP.gap }}>
            <span
              className="whitespace-nowrap text-white"
              style={{ fontFamily: fonts.tplBody, fontWeight: 500, fontSize: CHIP.fontSize, lineHeight: 1 }}
            >
              {label}
            </span>
            <Chevrons />
          </div>
        </Reveal>

        <Reveal dir="up" className="text-center" style={{ width: NAME.width }}>
          <h1
            className="m-0 text-white"
            style={{ fontFamily: fonts.tplTitle, fontWeight: 600, fontSize: NAME.fontSize, lineHeight: NAME.lineHeight }}
          >
            {title}
          </h1>
        </Reveal>
      </RevealGroup>
    </SlideBase>
  )
}
