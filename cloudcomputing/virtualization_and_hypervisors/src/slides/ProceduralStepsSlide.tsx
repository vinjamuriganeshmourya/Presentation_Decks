import { SlideBase, ZonedFrame, StepList } from '@/ui'
import type { ProceduralStepsSlideProps } from './types'
import { SLIDE_FAMILY } from '@/motion/continuity'

/**
 * PROCEDURAL STEPS — a numbered how-to on a light stage. The header sets the
 * scene, then <StepList> draws its connecting rail and staggers each step in.
 */
export function ProceduralStepsSlide({
  kicker,
  title,
  lead,
  steps,
  tone = 'brand',
  /**
   * Tighten the step spacing and drop the detail text a size.
   *
   * WHY THIS IS A PROP NOW, AND NOT JUST A STEP COUNT.
   *
   * It was `steps.length > 4` and nothing else, on the theory that a step count
   * predicts height. It does not: what fills the well is the number of LINES,
   * and a four-step list whose details each wrap to two lines is taller than a
   * five-step list of one-liners. Session 7's `hello-jenkins` slide is exactly
   * that shape, and after the lead moved out of the header it ended 4px inside
   * the control bar with no lever available in the deck — the copy was fine, the
   * step count was fine, and the automatic threshold said "not dense".
   *
   * So the count still decides by default, and a deck that knows better can say
   * so. Lowering the threshold to `> 3` instead was the other option and it was
   * worse: it would have re-spaced every four-step slide in every session to fix
   * one slide, which is a whole-repo visual change bought with no argument.
   */
  dense: denseProp,
  lesson,
}: ProceduralStepsSlideProps) {
  const dense = denseProp ?? steps.length > 4

  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      {/* ZONED (content rule 32). This used to centre the HEADER with the steps,
          so the kicker and title sat at a different height from every other
          content slide. The header now stays in its zone and only the steps
          centre. */}
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        <StepList
          steps={steps}
          tone={tone}
          className={`max-w-4xl ${dense ? '[&_ol]:space-y-3 [&_p]:text-body-sm' : ''}`}
        />
      </ZonedFrame>
    </SlideBase>
  )
}

/*
  Part of the light content family: these layouts can flow into one another
  inside a concept, so `SlideHeader` holds an unchanged kicker still instead of
  replaying its entrance. See `src/motion/continuity.ts`.
*/
ProceduralStepsSlide.family = SLIDE_FAMILY.content
