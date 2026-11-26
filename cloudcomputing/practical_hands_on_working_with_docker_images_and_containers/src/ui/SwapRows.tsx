import { RevealGroup, Reveal } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import type { CompareFigureProps } from './compareFigure'

/**
 * SWAP ROWS — one pairing is one object, not two boxes and an arrow.
 *
 * WHERE THIS CAME FROM. `slide-kit/comparison-lab`, where it beat three other
 * candidates on the same fixture. That lab's `CLAUDE.md` records what each
 * runner-up was worse at; read it before changing this.
 *
 * WHAT IT REPLACES, AND WHY. `AnalogyMap` draws two bordered boxes per row with a
 * 20px arrow glyph between them. Session 5's review rejected the rendered slide
 * outright, and the diagnosis that won was that the fault is the GRAMMAR rather
 * than the styling: two boxes and a glyph are THREE objects, so the eye counts
 * three things and then has to be told they are one.
 *
 * So a pairing is a single rounded object, divided internally. The familiar side
 * is a WELL -- recessed, with a dark hairline on its top edge and a white one on
 * its bottom, which is the standard way a surface reads as cut into a panel. The
 * new side is a LID sitting on top of it. No arrow is needed, because there is no
 * gap to cross, and the whole row reads as the sentence "this stands in for
 * that".
 *
 * The recessed-to-raised inversion is the argument, which means it is also the
 * constraint: this figure asserts a DIRECTION. Two things being weighed against
 * each other as alternatives have none, and drawing them this way claims
 * something untrue (content rule 8). `compareFigure.ts` says what to use instead.
 *
 * WORST AT: more than four pairings. Each row is a drawn object rather than a
 * line of text, so five rows overflow the well on a slide that also carries a
 * lead. Also at a pairing where the left side runs long, since the columns are
 * fixed at 0.85fr and 1.15fr on the assumption that the familiar side is the
 * shorter one.
 *
 * EVERY ROW HAS THE SAME WEIGHT. There is no emphasis flag; see
 * `compareFigure.ts` for why it was removed rather than kept and ignored.
 *
 * WHY IT IS NOT AN SVG. Content rule 17. This figure is mostly labels, and two
 * SVG figures shipped in session 4 with their `<text>` labels overlapping while
 * all three harnesses reported clean, because an `<svg>` is one DOM rectangle to
 * them. Every cell here is a real element in a real grid.
 */
export function SwapRows({
  leftLabel,
  rightLabel,
  pairs,
  caption,
  className = '',
}: CompareFigureProps) {
  /* The familiar side is the shorter one by convention, so it gets less width.
     Both halves share one grid definition, declared once, because the column
     headings above have to line up with the cells below them. */
  const cols = 'grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'
  return (
    <div className={`mx-auto w-full max-w-[1020px] ${className}`}>
      <div className={`${cols} mb-2.5 px-1`}>
        <p className="font-heading text-body-sm font-bold uppercase tracking-wider text-body">
          {leftLabel}
        </p>
        <p
          className="pl-5 font-heading text-body-sm font-bold uppercase tracking-wider"
          style={{ color: colors.brand }}
        >
          {rightLabel}
        </p>
      </div>

      <RevealGroup className="flex flex-col gap-2.5" stagger={0.09}>
        {pairs.map((p, i) => (
          <Reveal key={i} dir="up">
            <div
              /* ONE OBJECT. The border, the radius and the shadow belong to the
                 ROW, not to either half. That is the whole point: there are no
                 two boxes here for the eye to relate to each other. */
              className="overflow-hidden rounded-card border-2"
              style={{
                borderColor: colors.line,
                boxShadow: `0 2px 10px -8px ${colors.brandDeep}59, inset 0 1px 0 0 #FFFFFF`,
              }}
            >
              <div className={`${cols} items-stretch`}>
                {/* THE WELL: recessed. A dark hairline along the top edge and a
                    white one along the bottom is what reads as "cut into" rather
                    than "sitting on". */}
                <div
                  className={`flex items-center px-4 py-3.5 leading-snug ${
                    p.code ? 'font-mono text-[17px]' : 'text-body-lg'
                  }`}
                  style={{
                    background: 'linear-gradient(180deg, #EDF2F9 0%, #F4F7FC 100%)',
                    boxShadow: [
                      `inset 0 2px 5px -2px ${colors.brandDeep}1f`,
                      'inset 0 -1px 0 0 #FFFFFF',
                    ].join(', '),
                    color: colors.body,
                  }}
                >
                  {p.from}
                </div>

                {/* THE LID: raised out of the same object. The inset left rule is
                    the join, and it is the only line between the two halves. */}
                <div
                  className={`flex flex-col justify-center px-5 py-3.5 leading-snug ${
                    p.code ? 'font-mono text-[17px]' : 'text-body-lg'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 62%, #FAFCFF 100%)',
                    boxShadow: `inset 3px 0 0 0 ${colors.line}, inset 0 1px 0 0 #FFFFFF`,
                    color: colors.ink,
                    fontWeight: 500,
                  }}
                >
                  <span>{p.to}</span>
                  {p.note && (
                    <span className="mt-0.5 text-body-sm font-normal" style={{ color: colors.muted }}>
                      {p.note}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </RevealGroup>

      {caption && (
        <Reveal dir="up">
          <p className="mt-4 text-center text-body-sm leading-snug" style={{ color: colors.body }}>
            {caption}
          </p>
        </Reveal>
      )}
    </div>
  )
}
