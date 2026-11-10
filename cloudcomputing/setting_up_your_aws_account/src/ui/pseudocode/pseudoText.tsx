import { Fragment, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import type { PseudoLineKind } from './pseudoFigure'

/**
 * ONE HIGHLIGHTER, ONE DARK GROUND, FOR EVERY VARIANT IN THIS LAB.
 *
 * WHY IT EXISTS
 *
 * Every variant here was rendering a pseudocode line as ONE span of `colors.ink`
 * on a white card. Two things were wrong with that, and both were reported from
 * the room rather than found in review:
 *
 *   1. **Nothing was coloured.** `IF`, `FOR EACH` and `SET` are the only words on
 *      a pseudocode line that carry structure, and they looked exactly like the
 *      prose around them. Every editor the learner has ever opened colours them,
 *      so an uncoloured block reads as a quotation rather than as code.
 *   2. **The ground was white.** Code in this course is dark everywhere else:
 *      `CodeBlock`, `Terminal`, and the learner's own editor. A white pseudocode
 *      panel beside a dark code panel says the two are different KINDS of thing,
 *      which is the one claim this lab exists to avoid making.
 *
 * So the ground is `night-2` and the tokens are coloured, in one module, imported
 * by all three variants. Three private copies of a palette is how the sibling lab
 * ended up with padding that differed per variant: the comparison then measures
 * the drift instead of the design.
 *
 * THE PALETTE IS THE KIT'S OWN, PLUS TWO ADDITIONS
 *
 * `keyword`, `string`, `number`, `func` and `comment` are lifted verbatim from
 * `slide-kit/slide-template/src/ui/CodeBlock.tsx`, which is what every real code
 * panel in every shipped deck already uses on this same `night-2` ground. A
 * pseudocode panel that invented its own blue would clash with the Python panel
 * on the very next slide.
 *
 * Two values are added, both from VS Code's Dark+ theme, because the kit's panel
 * had no need of them and this lab does:
 *
 *   - `control` (mauve) separates CONTROL FLOW from everything else. Dark+ does
 *     exactly this, and on pseudocode it is the most useful split available:
 *     `IF`, `FOR EACH`, `END FOR` are the algorithm's shape, while `SET`, `INPUT`
 *     and `OUTPUT` are its work. One hue for both would colour the line without
 *     explaining it.
 *   - `ident` (light blue) is Dark+'s variable colour, and it is only reachable
 *     because the contract carries `vars`. A pseudocode line is half prose, so
 *     "SET largest TO first item of numbers" has three variables and four words
 *     of English in it. Colouring the DECLARED variables and leaving the prose
 *     plain is the one thing a generic highlighter cannot do here, and it is the
 *     difference between a coloured line and an explained one.
 *
 * These are the only colour literals in the lab, for the same reason `CodeBlock`
 * holds the only ones in the kit: a syntax palette is a tuned set, and pulling
 * four of its seven values from `tokens.ts` would leave a set that no longer
 * balances on the ground it sits on.
 */
export const SYNTAX = {
  /** Declarations and operators. `CodeBlock`'s keyword blue. */
  keyword: '#7FA6FF',
  /** Control flow. VS Code Dark+ mauve. */
  control: '#C99BE0',
  /** A name the author declared in `vars`. VS Code Dark+ variable blue. */
  ident: '#9CDCFE',
  /** Something being called. `CodeBlock`'s function blue, lifted for the ground. */
  func: '#DCDCAA',
  /** `CodeBlock`. */
  string: '#7FE3D8',
  /** `CodeBlock`. */
  number: '#FFB055',
  /** `CodeBlock`. */
  comment: '#6B87A8',
  /** Prose, punctuation, and anything unclassified. */
  plain: '#D8E3F5',
} as const

/**
 * THE DARK PANEL'S CHROME.
 *
 * `night-2` and not `night`: the deepest tone is the section-divider ground, and
 * a figure sitting on a light content slide wants the panel one step up from it,
 * the same step `CodeBlock` takes.
 */
export const CODE_BG = colors.night2
export const CODE_BORDER = `${colors.white}1f`
export const CODE_GUTTER = `${colors.white}52`
export const CODE_TITLE = colors.white
/** The pill on a dark header. Tinted white, because a brand wash disappears. */
export const CODE_CHIP_BG = `${colors.white}14`
export const CODE_CHIP_FG = `${colors.white}b8`

/**
 * WHAT A LINE DOES, IN PAINT, ON A DARK GROUND.
 *
 * The light ramp each variant used to hold privately reached for `brand`,
 * `tealDark` and `brandDark`, and all three are chosen to carry ink-weight
 * contrast against white. On `night-2` they are the three least legible values in
 * `tokens.ts`: an 11px gutter digit in `#2D63FB` on `#0C1A3A` is a smudge.
 *
 * So the ramp is re-picked for the ground, and picked for SEPARATION rather than
 * for meaning, because the kinds that matter sit next to each other in the
 * fixture. Lines 3 and 4 are the loop and the branch, so those two are the pair
 * that must never be confusable on a projector: green and orange. Lines 1 and 8
 * are io, lines 2 and 5 assign, and those two are cool hues a full step apart.
 *
 * It is exported so the three variants cannot drift, which is the whole reason
 * this module exists.
 */
export const KIND_DARK: Record<PseudoLineKind, string> = {
  io: colors.info,
  assign: colors.teal,
  branch: colors.accent,
  loop: colors.success,
  call: colors.line,
  return: colors.warning,
  plain: colors.muted,
}

/**
 * THE SAME RAMP, ONE STEP DOWN, FOR THE PARTS THAT STAY LIGHT.
 *
 * A trace table is a TABLE and not code, so it keeps its white ground, and the
 * `TraceTable` figure therefore has both grounds on one slide. The kind hue has
 * to survive the crossing: a step whose line number is teal in the table must
 * point at a line whose rule is teal in the panel, or the colour has stopped
 * being a way to identify the kind and become decoration.
 *
 * So this is not a second palette. It is the same four hue FAMILIES, sky, teal,
 * orange and green, at the darker end of each, because `#12B5A8` on white is a
 * pale 12px digit and `#0E9285` is a readable one.
 */
export const KIND_LIGHT: Record<PseudoLineKind, string> = {
  io: colors.info,
  assign: colors.tealDark,
  branch: colors.accentDark,
  loop: colors.success,
  call: colors.brandDark,
  return: colors.warning,
  plain: colors.muted,
}

/**
 * PSEUDOCODE KEYWORDS, SPLIT THE WAY VS CODE SPLITS THEM.
 *
 * Matched as whole uppercase words, never as substrings, and never
 * case-insensitively: pseudocode convention puts keywords in capitals, so `IN`
 * the keyword and the `in` of "first item in the list" are different words and
 * must not be given the same colour. The two-word forms need no special handling,
 * because both halves of `FOR EACH` and `END IF` are control words on their own.
 */
const CONTROL = new Set([
  'IF', 'THEN', 'ELSE', 'ELSEIF', 'END', 'ENDIF', 'ENDFOR', 'ENDWHILE',
  'FOR', 'EACH', 'WHILE', 'REPEAT', 'UNTIL', 'DO', 'LOOP',
  'BREAK', 'CONTINUE', 'RETURN', 'CASE', 'SWITCH', 'OTHERWISE',
])

const DECLARE = new Set([
  'SET', 'TO', 'INPUT', 'OUTPUT', 'PRINT', 'READ', 'WRITE', 'DISPLAY',
  'DECLARE', 'DEFINE', 'CALL', 'PROCEDURE', 'FUNCTION',
  'AND', 'OR', 'NOT', 'IN', 'OF', 'BY', 'STEP', 'FROM',
  'TRUE', 'FALSE', 'NULL', 'LENGTH', 'ADD', 'SWAP', 'INCREMENT', 'DECREMENT',
])

/** Python, for the variant that shows the real implementation beside the sketch. */
const PY_CONTROL = new Set([
  'if', 'elif', 'else', 'for', 'while', 'return', 'break', 'continue', 'try',
  'except', 'finally', 'raise', 'with', 'yield', 'pass', 'in', 'not', 'and',
  'or', 'is', 'assert', 'del',
])

const PY_DECLARE = new Set([
  'def', 'class', 'import', 'from', 'as', 'lambda', 'global', 'nonlocal',
  'async', 'await', 'True', 'False', 'None', 'self',
])

const PY_BUILTIN = new Set([
  'print', 'len', 'range', 'input', 'int', 'str', 'float', 'bool', 'list',
  'dict', 'set', 'tuple', 'sum', 'max', 'min', 'abs', 'sorted', 'enumerate',
  'zip', 'append',
])

/*
  ONE TOKENIZER, AND IT NEVER MANGLES THE LINE.

  String, number, word, or a single character of anything else. The last
  alternative is what makes it safe: every character the earlier branches do not
  claim is emitted verbatim, so the rendered text is byte-for-byte the input and
  the width arithmetic in every variant still holds. `CodeBlock` takes the same
  precaution for the same reason.

  Declared inside the function rather than at module scope: a global regex carries
  `lastIndex`, and a shared one would have every second line start highlighting
  from wherever the previous line stopped.
*/
const makeToken = () => /("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g

function paint(kind: keyof typeof SYNTAX, weight?: number): { color: string; fontWeight?: number } {
  return weight ? { color: SYNTAX[kind], fontWeight: weight } : { color: SYNTAX[kind] }
}

/**
 * A pseudocode line, coloured.
 *
 * `vars` is the author's declared variable list from the contract, so a name the
 * algorithm actually holds is coloured as a variable and the surrounding English
 * stays plain. Pass it: without it the line still colours its keywords, but
 * "largest" reads as prose, which on the one line that assigns it is the word the
 * room most needs to find.
 */
export function PseudoText({
  text,
  vars = [],
  /** Quieter, for a line the build has not reached. Hues are kept, not replaced. */
  dim = false,
  bold = false,
}: {
  text: string
  vars?: string[]
  dim?: boolean
  bold?: boolean
}): ReactNode {
  const re = makeToken()
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    const [full, str, num, word] = m
    if (str) out.push(<span key={k++} style={paint('string')}>{str}</span>)
    else if (num) out.push(<span key={k++} style={paint('number')}>{num}</span>)
    else if (word) {
      if (CONTROL.has(word)) out.push(<span key={k++} style={paint('control', 700)}>{word}</span>)
      else if (DECLARE.has(word)) out.push(<span key={k++} style={paint('keyword', 700)}>{word}</span>)
      else if (vars.includes(word)) out.push(<span key={k++} style={paint('ident')}>{word}</span>)
      /* An uppercase word this module has not been taught is still a keyword by
         convention, and colouring it is more honest than leaving the one word the
         author capitalised for emphasis looking like prose. */
      else if (/^[A-Z][A-Z_]{1,}$/.test(word)) out.push(<span key={k++} style={paint('keyword', 700)}>{word}</span>)
      else out.push(<Fragment key={k++}>{word}</Fragment>)
    } else out.push(<Fragment key={k++}>{full}</Fragment>)
  }
  return (
    <span
      className="whitespace-pre"
      style={{ color: SYNTAX.plain, opacity: dim ? 0.55 : 1, fontWeight: bold ? 700 : 500 }}
    >
      {out}
    </span>
  )
}

/**
 * A real code line, coloured the way VS Code colours it.
 *
 * Control flow in mauve, declarations in blue, a name followed by `(` in function
 * yellow, strings and numbers in the kit's own two values. Only Python is taught
 * here, and a `language` this module does not know falls through to plain text
 * rather than colouring another language's keywords by accident.
 */
export function RealText({
  text,
  language = 'python',
  dim = false,
  bold = false,
}: {
  text: string
  language?: string
  dim?: boolean
  bold?: boolean
}): ReactNode {
  const known = /^py(thon)?$/i.test(language)
  const re = makeToken()
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    const [full, str, num, word] = m
    if (str) out.push(<span key={k++} style={paint('string')}>{str}</span>)
    else if (num) out.push(<span key={k++} style={paint('number')}>{num}</span>)
    else if (word) {
      const called = text[re.lastIndex] === '('
      if (!known) out.push(<Fragment key={k++}>{word}</Fragment>)
      else if (PY_CONTROL.has(word)) out.push(<span key={k++} style={paint('control', 700)}>{word}</span>)
      else if (PY_DECLARE.has(word)) out.push(<span key={k++} style={paint('keyword', 700)}>{word}</span>)
      else if (called || PY_BUILTIN.has(word)) out.push(<span key={k++} style={paint('func')}>{word}</span>)
      else out.push(<span key={k++} style={paint('ident')}>{word}</span>)
    } else out.push(<Fragment key={k++}>{full}</Fragment>)
  }
  return (
    <span
      className="whitespace-pre"
      style={{ color: SYNTAX.plain, opacity: dim ? 0.55 : 1, fontWeight: bold ? 700 : 500 }}
    >
      {out}
    </span>
  )
}
