import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors } from '@/design/tokens'

/**
 * SYNTAX BREAKDOWN — one specimen line, its parts named underneath.
 *
 * WHERE THIS SHAPE COMES FROM
 *
 * It is not invented. Three sessions hand-rolled this same figure before it
 * reached the kit, and this is the last and best of them generalised:
 *
 *   - session 4, `PortPublish` and `ExecAnatomy` — an SVG with rules dropping
 *     from each token to a caption
 *   - session 5, `TargetAnatomy` — the same anatomy rebuilt out of DOM elements
 *
 * Session 5 rebuilt it for a reason worth repeating here, because it is the
 * single most important constraint on this file. From `TargetAnatomy`'s own
 * header: *"two SVG figures shipped in session 4 with their `<text>` labels
 * overlapping, and all three harnesses reported clean, because an `<svg>` is one
 * DOM rectangle to them."* That is content rule 17.
 *
 * **So this figure is DOM, never SVG, and it must stay that way.** Every label is
 * a real element in a real grid, the browser's layout engine keeps them apart,
 * and `align-check.mjs` can actually see them. Any figure whose content is mostly
 * labels should be built this way.
 *
 * The visual language is `TargetAnatomy`'s: a white panel, the tokens as tinted
 * chips, and the captions as a row of cards with a coloured left rail. It differs
 * in one respect, and only one: the numbered badges. `TargetAnatomy` has exactly
 * three parts of similar width, so a three-column caption grid sits under its
 * tokens closely enough to read. This is general, and at four or five parts of
 * unequal width the columns no longer line up with the tokens they describe. The
 * badge on the chip and the same badge on the card make that mapping explicit,
 * and unlike colour it survives a projector and greyscale.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT
 *
 * "Here is the SHAPE of the thing you are about to type." A `def` line, a
 * `docker run` invocation, a `pip install` with two flags: the learner has to
 * learn the slots, not the one filled-in example.
 *
 * It is NOT `CodeBlock`, which is a FILE view with traffic lights, a filename and
 * line numbers, and it is NOT `Terminal`, which is a real transcript of a real
 * session with a real prompt path (hard rule 3). A one-line "file" with a
 * filename bar reads as a file the learner should create; a one-line "terminal"
 * with no output reads as a command that printed nothing. A grammar diagram is a
 * third thing, so it is drawn as a third thing.
 *
 * WHY THE SPECIMEN IS BUILT FROM THE PARTS
 *
 * `parts` is the only source of truth. The line the room reads is assembled by
 * joining the tokens, so the specimen and the captions under it cannot disagree.
 * The first draft took a `command` string AND a `parts` array and they drifted
 * within one session: the slide explained a flag the specimen no longer carried.
 */

export interface SyntaxPart {
  /** The token exactly as it is typed. Joined in order to build the specimen. */
  token: string
  /** What this slot is called: "flag", "image name", "the target's name". */
  label: string
  /** What it does, in a caption card's worth of words. Two short lines, not a paragraph. */
  body?: ReactNode
  /**
   * `placeholder` means the learner substitutes their own value here;
   * `literal` (the default) means they type it exactly as shown.
   *
   * The chip gets a dashed outline instead of a solid fill. "Which of these do I
   * change?" is the first question every learner asks of a syntax line, and
   * answering it in the figure saves saying it out loud five times.
   */
  fill?: 'literal' | 'placeholder'
  /**
   * Literal text printed between this token and the next, and NOT treated as a
   * part: the `(`, `):` and `,` that hold a signature together. Defaults to a
   * single space, which is what a shell command wants between every token.
   */
  after?: string
}

/**
 * The ramp, in order.
 *
 * The DARK variants (`tealDark`, `accentDark`) rather than the base hues, which
 * is what `TargetAnatomy` uses and for the same reason: these colours are read
 * as text on a pale tint of themselves, and base teal on 12% teal does not carry
 * to the back of a room. `brand` is already dark enough to serve as its own ink.
 *
 * The fourth entry is `brandDeep` (the style guide's navy) and NOT `brandDark`.
 * `brandDark` is #0146C7 against `brand`'s #2D63FB: two blues that are plainly
 * distinct in isolation and, sitting in the same row of caption cards four
 * columns apart, read as the same colour used twice. Whatever else the ramp is,
 * every entry has to be tellable from every other one at a glance, because the
 * colour is half of what maps a caption to its token.
 */
const RAMP = [colors.brand, colors.tealDark, colors.accentDark, colors.brandDeep, colors.success]

export function SyntaxBreakdown({
  parts,
  /**
   * `command` prefixes the specimen with a `$` and labels the panel "command".
   * `code` labels it with the language. That prompt glyph is the one cue saying
   * "typed at a shell" rather than "typed into a file".
   */
  mode = 'code',
  /** The language chip, `code` mode only. */
  language = 'python',
  /**
   * Click-gate the caption cards so the line is read whole before it is taken
   * apart. The grid columns are fixed, so an unrevealed card holds its cell and
   * nothing reflows as the steps land.
   *
   * The specimen itself is always immediate: the room cannot be asked to look at
   * a shape that is not on screen yet.
   */
  stepped = true,
  className = '',
}: {
  parts: SyntaxPart[]
  mode?: 'code' | 'command'
  language?: string
  stepped?: boolean
  className?: string
}) {
  const Card = stepped ? Step : Reveal
  return (
    <RevealGroup className={`mx-auto w-full max-w-[900px] ${className}`} stagger={0.12}>
      {/* THE SPECIMEN, as it sits in the file or at the prompt. */}
      <Reveal dir="up">
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="rounded-pill px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide"
              style={{ background: `${colors.brand}14`, color: colors.brand }}
            >
              {mode === 'command' ? 'command' : language}
            </span>
            <span className="text-body-sm text-muted">
              {mode === 'command' ? 'type this at the prompt' : 'the shape, not one example'}
            </span>
          </div>

          {/* Each token in its OWN chip, so a caption can point at one without the
              eye taking its neighbour with it. `TargetAnatomy` does the same, and
              it is what makes the parts legible as parts rather than as one
              string that happens to be multi-coloured. */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-[24px] font-bold leading-none">
            {mode === 'command' && (
              <span className="select-none pr-1.5" style={{ color: colors.muted }}>
                $
              </span>
            )}
            {parts.map((part, i) => {
              const paint = RAMP[i % RAMP.length]
              const after = part.after ?? ' '
              const placeholder = part.fill === 'placeholder'
              return (
                <span key={i} className="flex items-center">
                  <span
                    className={`flex items-center rounded-md px-2.5 py-1.5 ${
                      placeholder ? 'border-2 border-dashed' : ''
                    }`}
                    style={{
                      background: `${paint}1f`,
                      color: paint,
                      ...(placeholder ? { borderColor: paint, paddingTop: 4, paddingBottom: 4 } : {}),
                    }}
                  >
                    {/*
                      The token sits in its OWN tight-leading span rather than
                      directly in the padded chip.

                      `align-check.mjs` infers wrapped text by comparing an
                      element's height to its line-height, and a chip whose
                      padding makes it taller than one line looks exactly like a
                      token that wrapped over two. It reported precisely that on
                      every token here. Session 5's `TargetAnatomy` hit the same
                      false positive and solved it the same way: the padded box
                      carries no direct text, so the harness measures this span
                      instead.
                    */}
                    <span className="leading-none">{part.token}</span>
                  </span>
                  {after && (
                    <span className="whitespace-pre" style={{ color: colors.muted }}>
                      {after}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      </Reveal>

      {/*
        THE CAPTIONS, in ONE grid so no caption can land on top of another
        however wide the font renders. `TargetAnatomy` hardcodes three columns;
        this takes the count from the parts, which is the only change needed to
        generalise it.
      */}
      <div
        className="mt-6 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))` }}
      >
        {parts.map((part, i) => {
          const paint = RAMP[i % RAMP.length]
          return (
            <Card
              key={i}
              dir="up"
              className="rounded-card border-l-[3px] bg-surface px-4 py-3"
              style={{ borderColor: paint }}
            >
              <p
                className="flex items-center gap-2 font-heading text-body-sm font-bold"
                style={{ color: paint }}
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full font-body text-[12px] font-bold text-white"
                  style={{ background: paint }}
                >
                  {i + 1}
                </span>
                {part.label}
              </p>
              {part.body && (
                <p className="mt-1 text-body-sm font-medium" style={{ color: colors.body }}>
                  {part.body}
                </p>
              )}
              {part.fill === 'placeholder' && (
                <p className="mt-1.5 text-[13px] font-bold uppercase tracking-wide" style={{ color: paint }}>
                  You replace this
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </RevealGroup>
  )
}
