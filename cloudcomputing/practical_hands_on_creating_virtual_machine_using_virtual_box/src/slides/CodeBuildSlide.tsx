import { Callout, CodeBlock } from '@/ui'
import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import type { CodeBuildSlideProps } from './types'

/**
 * The slide type for a file being built one key at a time.
 *
 * Session 3 writes a `docker-compose.yml` across six slides, adding one key per
 * slide, and every one of those slides is the same shape: the file so far on the
 * left with the new lines lit, and one annotation card on the right saying what
 * the new key does. Six slides sharing a shape is what earns a type; writing them
 * as six bespoke `ContentSlide` children guarantees they drift apart.
 *
 * Two things are load-bearing:
 *
 *  1. The code panel is the SAME WIDTH and in the SAME POSITION on all six
 *     slides, and earlier lines are never re-flowed. The learner is watching one
 *     file grow, and any horizontal movement breaks that illusion.
 *
 *  2. The panel and the annotation reveal TOGETHER on entry (content rule 6):
 *     they are one idea. `Step` is not used here at all. The only optional beat is
 *     the callout, and it defaults to arriving with everything else.
 */
export function CodeBuildSlide({
  kicker,
  title,
  lead,
  code,
  filename,
  highlight,
  annotation,
  note,
  lesson,
}: CodeBuildSlideProps) {
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      {/* ZONED (content rule 32), pinned at the top of the body box rather than
          centred: the code panel is a fixed box that must not move between the
          steps of one file, and centring would shift it whenever the annotation
          beside it changed height. */}
      <ZonedFrame kicker={kicker} title={title} lead={lead} mode="top">
      <RevealGroup stagger={0.08} className="flex items-start gap-6">
        <Reveal dir="up" className="w-[600px] shrink-0">
          <CodeBlock
            code={code}
            filename={filename}
            language="YAML"
            highlight={highlight}
            /*
              13.5px, not the 17px default, and 400px of room. By the last step
              the file is eighteen lines; at the default size the panel scrolls,
              which hides the service-level `volumes:` key from the bottom-level
              `volumes:` block that declares it. Those two are the whole lesson of
              that slide and have to be on screen together.
            */
            fontSize={13.5}
            /*
              A FIXED BOX, not a box that grows.

              `minHeight` equal to `maxHeight` is deliberate. The panel is
              top-anchored so the file grows downward from a fixed origin, and
              without a floor the first step (`services`, four lines) left almost
              300px of dead space beneath it while the last step filled the panel.
              Six slides that are meant to read as ONE FILE looked like six
              unrelated slides. Now the box never moves and never resizes; only
              its contents change.
            */
            maxHeight={400}
            minHeight={400}
          />
        </Reveal>

        <Reveal dir="up" className="flex-1 space-y-3">
          {/* The annotation is the lesson of THIS slide, so it is a card rather
              than a bullet list: one claim, given room. */}
          <div className="rounded-card border-2 border-brand/25 bg-white p-4 shadow-card-soft">
            <div className="font-mono text-body-sm font-bold text-brand-700">{annotation.key}</div>
            <p className="mt-1.5 text-body-sm leading-relaxed text-body">{annotation.body}</p>
            {annotation.replaces && (
              <p className="mt-2 border-t border-line pt-2 text-xs font-semibold text-muted">
                Replaces: {annotation.replaces}
              </p>
            )}
          </div>

          {note && (
            <Callout kind={note.kind ?? 'note'} title={note.title} asStep={false}>
              {note.body}
            </Callout>
          )}
        </Reveal>
      </RevealGroup>
      </ZonedFrame>
    </SlideBase>
  )
}
