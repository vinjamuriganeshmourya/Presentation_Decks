import presenterUrl from '../images/presenter-instructor.png'

/**
 * SLIDE 9 (T02-B). Round 4: the duplicate stage list was replaced with a presenter pointing at the points.
 * Round 5 (user, 2026-11-10): "remove current right side visual entirely, use the illustration from the assets like
 * human illustration"; the Character Lab presenter is gone, the figure is the asset illustration.
 *
 * The point icons' micro-animation (round 4) is CSS below, scoped to this slide through the `data-z-pointer` marker.
 */
/* the project's own illustration (assets/icons/Icons/Female Teacher/Instructor Icon.png, 212 x 336, user round 5d;
   served as a 4x copy, 848 x 1344, so a 4K screen (x3 zoom) never stretches it; shown 360 px tall, user round 5e),
   enlarged to 440 px tall and placed at the slide's bottom right (user, round 5c), pointing toward the points. It is
   drawn as a pseudo-element of the slide's own 1280 x 720 content layer (slide coordinates), NOT inside the figure:
   the points layout's Fit shrinks any figure whose content overflows the stage, and check-deck flags a stage whose
   content runs past it. Feet 30 px above the progress bar, right edge
   15 px left of the NxtWave mark. A gentle float, held on ?still. */
const IH = 360
const IW = Math.round((IH * 212) / 336)
const IL = 1195 - IW
const IT = 690 - IH

function Z_T02BPointer({ w = 456, h = 400 }: { step: number; w?: number; h?: number }) {
  return <div data-z-pointer style={{ width: w, height: h }} />
}

export const figures = { Z_T02BPointer }

export const css = `
/* round 5b (user): no background box behind the illustration on this slide, only the illustration */
div.flex.items-center > div.overflow-hidden:has([data-z-pointer]) {
  background: none !important; box-shadow: none !important; border: 0 !important; backdrop-filter: none !important;
}
div.flex.items-center > div.overflow-hidden:has([data-z-pointer])::before { display: none !important }
@keyframes z-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
div.relative.z-10.h-full:has([data-z-pointer])::after {
  content: ''; position: absolute; left: ${IL}px; top: ${IT}px; width: ${IW}px; height: ${IH}px; z-index: 2;
  background: url("${presenterUrl}") center / contain no-repeat; filter: drop-shadow(0 14px 18px rgba(0,37,75,0.16));
  pointer-events: none; animation: z-float 3.6s cubic-bezier(0.45,0,0.55,1) infinite; will-change: transform;
}
.cc-still div.relative.z-10.h-full:has([data-z-pointer])::after, .deck-thumb div.relative.z-10.h-full:has([data-z-pointer])::after { animation: none }
@media (prefers-reduced-motion: reduce) { div.relative.z-10.h-full:has([data-z-pointer])::after { animation: none } }
@keyframes z-picon { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2px) scale(1.1) } }
div.flex.items-center:has([data-z-pointer]) > div.flex-col > div > span[aria-hidden] > svg {
  animation: z-picon 3.2s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 50%; will-change: transform;
}
div.flex.items-center:has([data-z-pointer]) > div.flex-col > div:nth-child(2) > span[aria-hidden] > svg { animation-delay: -0.64s }
div.flex.items-center:has([data-z-pointer]) > div.flex-col > div:nth-child(3) > span[aria-hidden] > svg { animation-delay: -1.28s }
div.flex.items-center:has([data-z-pointer]) > div.flex-col > div:nth-child(4) > span[aria-hidden] > svg { animation-delay: -1.92s }
div.flex.items-center:has([data-z-pointer]) > div.flex-col > div:nth-child(5) > span[aria-hidden] > svg { animation-delay: -2.56s }
.cc-still div.flex.items-center:has([data-z-pointer]) > div.flex-col > div > span[aria-hidden] > svg,
.deck-thumb div.flex.items-center:has([data-z-pointer]) > div.flex-col > div > span[aria-hidden] > svg { animation: none }
@media (prefers-reduced-motion: reduce) { div.flex.items-center:has([data-z-pointer]) > div.flex-col > div > span[aria-hidden] > svg { animation: none } }
`
