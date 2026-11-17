import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { StatusList } from '@/ui/StatusList'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { SLIDE_FAMILY } from '@/motion/continuity'
import type { StatusPointsSlideProps } from './types'

/**
 * STATUS POINTS — a list where every row carries a verdict.
 *
 * The slide for "these three work, this one does not", for a do/don't pair, and
 * for the set of states a command can leave you in. The verdict is the content:
 * if every row would come out `success`, this is a `ContentSlide` and the colour
 * is decoration (hard rule 8's spirit, applied to colour rather than to
 * illustration).
 *
 * ROWS ARE BUILD STEPS BY DEFAULT, EXCEPT WHEN THERE IS A FIGURE
 *
 * Walking the room through "this one fails, and here is why" one verdict at a
 * time is the whole reason to use this layout, so `stepped` defaults on. But
 * hard rule 6 says text and its supporting visual arrive together, so the moment
 * the slide carries `children` the rows switch to a staggered entrance and
 * `stepped` is ignored. That is enforced here rather than left to the author,
 * because the failure is silent: the figure simply never appears until the last
 * row has been clicked, and it looks like two slides stuck together.
 *
 * THE HEIGHT BUDGET
 *
 * Each row is about 84px with a `detail` line, 66px without. The well runs
 * y=220..656 with a lead-less header. Four rows with details, or five without.
 * A sixth is a second slide.
 */
export function StatusPointsSlide({
  kicker,
  title,
  lead,
  items,
  tone = 'brand',
  children,
  stepped = true,
  lesson,
}: StatusPointsSlideProps) {
  /* No lead-less guard any more: the zoned body box starts at y=221, the
     instructor-video rectangle's floor, so a wide figure cannot reach into it. */
  const immediate = Boolean(children) || !stepped
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        {children ? (
          /* The list takes the wider column, matching `ContentSlide`: a
             wrapped row in a narrow column reads as though it were set larger
             than its neighbours even though every row is the same size. */
          <div className="grid grid-cols-[1.4fr_1fr] items-center gap-10">
            <StatusList items={items} immediate />
            <RevealGroup>
              <Reveal dir="up">{children}</Reveal>
            </RevealGroup>
          </div>
        ) : (
          <StatusList items={items} immediate={immediate} />
        )}
      </ZonedFrame>
    </SlideBase>
  )
}

StatusPointsSlide.family = SLIDE_FAMILY.content
