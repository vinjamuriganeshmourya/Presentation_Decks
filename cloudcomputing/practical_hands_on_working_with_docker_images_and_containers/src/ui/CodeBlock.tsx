import { Fragment } from 'react'
import { colors } from '@/design/tokens'

/**
 * Lightweight, dependency-free code panel with a title bar and a conservative
 * syntax highlighter (comments, strings, numbers, and a keyword set). It never
 * mangles code: unmatched text is rendered verbatim and HTML is escaped.
 */

const KEYWORDS = new Set([
  // python
  'def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for',
  'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'with',
  'try', 'except', 'raise', 'lambda', 'yield', 'pass', 'async', 'await',
  // js/ts
  'const', 'let', 'var', 'function', 'export', 'default', 'new', 'this',
  'typeof', 'interface', 'type', 'extends', 'implements', 'public', 'private',
  'null', 'undefined', 'true', 'false',
  /*
   * dockerfile instructions.
   *
   * Uppercase, so they can never collide with the python/js keywords above —
   * the set is case-sensitive, and `from` (python) stays a separate entry from
   * `FROM` (dockerfile).
   *
   * This deck renders a Dockerfile as the main exhibit on eleven slides, and on
   * most of them the instruction word IS the lesson. Without these the whole
   * file rendered as undifferentiated plain text and the one token the eye
   * needed to find was the only one with no colour.
   */
  'FROM', 'WORKDIR', 'COPY', 'RUN', 'CMD', 'ENV', 'EXPOSE', 'ENTRYPOINT',
  'ADD', 'ARG', 'LABEL', 'VOLUME', 'USER',
  // The placeholder on the instruction-anatomy slide, which is not a real
  // instruction but is read as one.
  'INSTRUCTION',
])

const COLORS = {
  comment: '#6B87A8',
  string: '#7FE3D8',
  number: '#FFB055',
  keyword: '#7FA6FF',
  func: '#4C80FF',
}

// One tokenizer regex: comment | string | number | identifier | other.
//
// Two details keep `//` comments working. The "other" class excludes `/`, or a
// run of spaces before `//` swallows the slashes as one plain token and the
// comment branch is never tried: the words inside the comment then tokenize as
// keywords, which is how a Groovy line's `// replace with ...` printed `with`
// in keyword blue. And `//` only opens a comment after whitespace or at line
// start, so `http://` in a bash line stays plain text.
const TOKEN = /(#[^\n]*|(?<=^|\s)\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([^A-Za-z0-9_$#"'`/]+|.)/g

function highlightLine(line: string) {
  const out: React.ReactNode[] = []
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  let key = 0
  while ((m = TOKEN.exec(line)) !== null) {
    const [full, comment, str, num, ident] = m
    if (comment) out.push(<span key={key++} style={{ color: COLORS.comment, fontStyle: 'italic' }}>{comment}</span>)
    else if (str) out.push(<span key={key++} style={{ color: COLORS.string }}>{str}</span>)
    else if (num) out.push(<span key={key++} style={{ color: COLORS.number }}>{num}</span>)
    else if (ident) {
      if (KEYWORDS.has(ident)) out.push(<span key={key++} style={{ color: COLORS.keyword, fontWeight: 600 }}>{ident}</span>)
      else {
        // function call? peek next char
        const next = line[TOKEN.lastIndex]
        if (next === '(') out.push(<span key={key++} style={{ color: COLORS.func }}>{ident}</span>)
        else out.push(<Fragment key={key++}>{ident}</Fragment>)
      }
    } else out.push(<Fragment key={key++}>{full}</Fragment>)
  }
  return out
}

/*
 * YAML mode.
 *
 * The generic tokenizer above is wrong for YAML in the one way that matters:
 * a key is not a keyword from a fixed set, it is "the identifier before the
 * first colon on the line". Session 3 renders a docker-compose.yml as its main
 * exhibit on eight slides, and on most of them the KEY is the lesson
 * (`services`, `build`, `depends_on`, `environment`, `volumes`). Left to the
 * generic path the whole file rendered as flat plain text, exactly the problem
 * that added the Dockerfile instructions to the keyword set in Session 2.
 *
 * Deliberately small: indent, an optional list dash, a key, and the rest of the
 * line as a value. Anything that does not match that shape (a bare list item, a
 * comment, a blank line) falls through to plain text, so this can never mangle
 * a file it does not understand.
 */
const YAML_LINE = /^(\s*)(-\s+)?([A-Za-z_][\w.-]*)(:)(.*)$/

function highlightYamlLine(line: string) {
  const hash = line.indexOf('#')
  const code = hash >= 0 ? line.slice(0, hash) : line
  const comment = hash >= 0 ? line.slice(hash) : ''
  const tail = comment ? (
    <span key="c" style={{ color: COLORS.comment, fontStyle: 'italic' }}>{comment}</span>
  ) : null

  const m = YAML_LINE.exec(code)
  if (!m) {
    // A bare list item (`- db_data:/app/data` has no key, `- backend` has none
    // either): colour just the dash so the eye can still find the list.
    const dash = /^(\s*)(-\s+)(.*)$/.exec(code)
    if (dash) {
      return [
        <Fragment key="i">{dash[1]}</Fragment>,
        <span key="d" style={{ color: COLORS.number }}>{dash[2]}</span>,
        <span key="v" style={{ color: COLORS.string }}>{dash[3]}</span>,
        tail,
      ]
    }
    return [<Fragment key="p">{code}</Fragment>, tail]
  }

  const [, indent, dash, key, colon, value] = m
  return [
    <Fragment key="i">{indent}</Fragment>,
    dash ? <span key="d" style={{ color: COLORS.number }}>{dash}</span> : null,
    <span key="k" style={{ color: COLORS.keyword, fontWeight: 600 }}>{key}</span>,
    <Fragment key="c2">{colon}</Fragment>,
    value ? <span key="v" style={{ color: COLORS.string }}>{value}</span> : null,
    tail,
  ]
}

/**
 * What one line of a code box is doing, on a TEACHING slide.
 *
 * `highlight` could only say "look here". A trace needs more: the line running
 * now, the lines already run, a line the program never reaches, a line that is
 * wrong and a line that is suspicious. PF 14 "For Loop" drew all six by hand in
 * one deck, on a white slab, and the colours did not survive the move to the
 * kit's dark ground. These are picked for `night-2`.
 */
export type CodeLineState = 'mark' | 'now' | 'ran' | 'dead' | 'warn' | 'error'

const LINE_STATE: Record<CodeLineState, { background?: string; boxShadow?: string; opacity?: number }> = {
  mark: { background: 'rgba(11,95,255,0.26)', boxShadow: 'inset 3px 0 0 #7FA6FF' },
  now: { background: 'rgba(11,95,255,0.34)', boxShadow: 'inset 3px 0 0 #7FA6FF' },
  ran: { background: 'rgba(255,255,255,0.06)' },
  dead: { opacity: 0.3 },
  warn: { background: 'rgba(255,176,85,0.2)', boxShadow: 'inset 3px 0 0 #FFB055' },
  error: { background: 'rgba(239,68,68,0.22)', boxShadow: 'inset 3px 0 0 #EF4444' },
}

/** The loop-back arrow's colour: the kit's accent, the one warm hue on the dark ground. */
const LOOP = '#FF8A3D'
/** Row labels sit on the light slide beside the box, in the brand's dark blue. */
const LABEL = '#0146C7'

export function CodeBlock({
  code,
  filename,
  language = 'python',
  chip = true,
  highlight = [],
  lines: lineStates,
  loop,
  labels,
  rows,
  showLineNumbers = true,
  className = '',
  maxHeight = 470,
  minHeight,
  fontSize,
}: {
  code: string
  /**
   * The word in the title bar. Content rule 31: the LANGUAGE ("Python"), never
   * an invented file name, unless the file itself is the lesson (a Dockerfile).
   */
  filename?: string
  language?: string
  /**
   * The language pill on the right of the title bar. Turn it off when
   * `filename` already names the language, so the word appears once (rule 31).
   */
  chip?: boolean
  /** 1-based line numbers to emphasize */
  highlight?: number[]
  /** Per-line state for a trace: `{ 3: 'now', 1: 'ran', 2: 'ran' }`. Wins over `highlight`. */
  lines?: Record<number, CodeLineState>
  /** A loop-back arrow in the gutter from the first line to the last, both 1-based. */
  loop?: [number, number]
  /** Labels pinned to the right of the box, one per 1-based line: `{ 3: 'Initialization' }`. */
  labels?: Record<number, string>
  /**
   * Floor, in ROWS, for the code area. The same box on consecutive slides: a run
   * of code slides passes one `rows` so a shorter file sits in the same box and
   * nothing jumps as the deck advances (user, PF 14, 2026-09-29).
   */
  rows?: number
  showLineNumbers?: boolean
  className?: string
  /**
   * Hard cap (px) on the scrollable code area so a long snippet can never
   * push its slide out of the 1280×720 frame — it scrolls inside instead.
   */
  maxHeight?: number
  /**
   * Override the 17px `text-code` step, in px.
   *
   * Exists for ONE reason: a panel that scrolls is a panel whose learner cannot
   * see the whole file, and `qa.mjs` reports the un-clipped content rect as a
   * frame overflow, so a scrolling panel is a QA failure as well as a teaching
   * one. Session 3's finished `docker-compose.yml` is eighteen lines, which does
   * not fit at 17px beside anything else, and splitting one file across two
   * panels would undo the entire point of the section.
   *
   * `Terminal` already takes the same prop for the same reason. Use it to make a
   * long file fit, never to squeeze a second idea onto a slide.
   */
  fontSize?: number
  /**
   * Floor for the scrollable code area, in px.
   *
   * For a BUILD SEQUENCE, where the same file is rendered across several slides
   * with one more key each time. Without a floor the panel is only as tall as the
   * file so far, so the first step leaves ~300px of dead space under it and the
   * last leaves none: six slides that are supposed to be one file look like six
   * different slides. Setting it equal to `maxHeight` makes the panel one fixed
   * box that the file grows inside, which is what the sequence is claiming.
   */
  minHeight?: number
}) {
  const lines = code.replace(/\n$/, '').split('\n')
  const hl = new Set(highlight)
  // `language` is also the chip label, so match case-insensitively.
  const isYaml = /^ya?ml$/i.test(language)
  /* One row's height, which the loop arrow and the labels are placed on. The
     code area's line-height is 1.55 when `fontSize` is set and `text-code`'s 1.6
     otherwise; every row is pinned to it so a trace tint cannot change it. */
  const fs = fontSize ?? 17
  const rowH = Math.round(fs * (fontSize ? 1.55 : 1.6))
  const PAD = 16 // py-4
  const floor = rows ? rows * rowH + PAD * 2 : minHeight
  const rowMid = (n: number) => PAD + (n - 1) * rowH + rowH / 2
  /* Only a panel that uses the trace features gets pinned rows: every other
     session's panels keep their natural line boxes, unchanged by a sync. */
  const pin = Boolean(rows || loop || labels || lineStates)

  const box = (
    <div className={`overflow-hidden rounded-card bg-night-2 shadow-card ${labels ? '' : className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        {filename && (
          <span className="ml-2 font-term text-body-sm text-white/60">{filename}</span>
        )}
        {chip && (
          <span className="ml-auto rounded-pill bg-white/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white/50">
            {language}
          </span>
        )}
      </div>
      <pre
        className="relative overflow-auto px-4 py-4 font-mono text-code leading-relaxed"
        style={{
          maxHeight,
          ...(floor ? { minHeight: floor } : {}),
          ...(fontSize ? { fontSize, lineHeight: 1.55 } : {}),
        }}
      >
        {loop && (
          /* the loop-back arrow: dashed, in the left padding, arrowhead into the
             loop's first line. A filled triangle, not a CSS border trick, so it
             sits centred on its shaft at every size. */
          <span
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: 3,
              top: rowMid(loop[0]),
              width: 10,
              height: rowMid(loop[1]) - rowMid(loop[0]),
              border: `2px dashed ${LOOP}`,
              borderRight: 0,
              borderRadius: '6px 0 0 6px',
            }}
          >
            <span
              className="absolute"
              style={{
                right: -8,
                top: -6,
                width: 9,
                height: 10,
                background: LOOP,
                clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              }}
            />
          </span>
        )}
        <code className="grid">
          {lines.map((line, i) => {
            const state = lineStates?.[i + 1] ?? (hl.has(i + 1) ? 'mark' : undefined)
            const look = state ? LINE_STATE[state] : undefined
            return (
              <span
                key={i}
                className={pin ? '-mx-4 grid grid-cols-[auto_1fr] gap-4 px-5' : 'grid grid-cols-[auto_1fr] gap-4 rounded px-1'}
                style={{
                  ...(pin ? { height: rowH, alignItems: 'center' } : {}),
                  transition: 'background-color 200ms, opacity 200ms, box-shadow 200ms',
                  ...(look ?? {}),
                  ...(state === 'mark' && !lineStates ? { background: 'rgba(11,95,255,0.18)', boxShadow: 'none' } : {}),
                }}
              >
                {showLineNumbers && (
                  <span className="select-none text-right text-white/25">{i + 1}</span>
                )}
                <span className="text-white/90">
                  {line ? (isYaml ? highlightYamlLine(line) : highlightLine(line)) : ' '}
                </span>
              </span>
            )
          })}
        </code>
      </pre>
    </div>
  )

  if (!labels) return box
  /* Labels need to sit OUTSIDE the rounded, overflow-hidden box, so the box gets
     a relative wrapper and the labels are placed on the same row grid. The title
     bar is 44px (py-2.5 around a 24px line). */
  const BAR = 45
  return (
    <div className={`relative ${className}`}>
      {box}
      {Object.entries(labels).map(([n, text]) => (
        <span
          key={n}
          className="pointer-events-none absolute left-full flex items-center whitespace-nowrap font-semibold text-body-lg"
          style={{ top: BAR + rowMid(+n) - 16, height: 32, paddingLeft: 14, gap: 12, color: LABEL }}
        >
          <span className="relative block" style={{ width: 30, height: 2, background: colors.brand }}>
            <span
              className="absolute"
              style={{
                right: -8,
                top: -5,
                width: 10,
                height: 12,
                background: colors.brand,
                clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              }}
            />
          </span>
          <span style={{ marginLeft: 6 }}>{text}</span>
        </span>
      ))}
    </div>
  )
}
