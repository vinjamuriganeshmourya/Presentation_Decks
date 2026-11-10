import { SlideBase, ZonedFrame, ScenarioCard } from '@/ui'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import type { ScenarioSlideProps } from './types'
import { SLIDE_FAMILY } from '@/motion/continuity'

/**
 * SCENARIO EXPLANATION — a compact header over a ScenarioCard that walks
 * through a situation and its narrative beats (e.g. Situation → Action → Result).
 */
export function ScenarioSlide({
  kicker = 'Scenario',
  title,
  situation,
  persona,
  beats,
  lesson,
}: ScenarioSlideProps) {
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title}>
        <RevealGroup>
          <Reveal dir="up" delay={0.05}>
            <ScenarioCard situation={situation} persona={persona} beats={beats} />
          </Reveal>
        </RevealGroup>
      </ZonedFrame>
    </SlideBase>
  )
}

/*
  Part of the light content family: these layouts can flow into one another
  inside a concept, so `SlideHeader` holds an unchanged kicker still instead of
  replaying its entrance. See `src/motion/continuity.ts`.
*/
ScenarioSlide.family = SLIDE_FAMILY.content
