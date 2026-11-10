import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useInstant } from '@/motion/instant'
import type { CodeLineState } from '@/ui'

/**
 * The Python course's code pane, the evolved form of `src/ui/CodeBlock.tsx` for
 * trace-style slides. Carried from session to session and folded into the kit
 * from session 31 on 2026-10-14.
 * Copied from PF 24 (2026-10-08) into PF 25 with its blank threshold at three underscores;
 * PF 31 adds `marks` (the import cards' one picture) and `dense`.
 *
 * Only the part `CodePane` uses: the Python panel with pinned rows and per-line
 * trace states, drawn exactly as the kit draws it. Three changes (user review,
 * 2026-10-08, rules G1 and G4):
 *
 *   1. A run of three or more underscores in the code is a FILL-IN BLANK: a
 *      dashed amber slot with a pencil, breathing softly, vertically centred
 *      on the code line. One look across the deck.
 *   2. A line whose text changes after the panel is on screen (a blank that
 *      fills, a case that drops into line 2, a program that changes one line)
 *      fades up into place on the house curve instead of swapping.
 *   3. Line tints (now, ran, mark, dead) move on the house curve at 420ms,
 *      not the kit's linear 200ms.
 *
 * PF 31 (spec note 5, the import cards' one picture): `marks` underlines a
 * named token on a line. The name line 1 brings in is underlined in a colour,
 * and the name line 2 uses is underlined too: the same name in the same colour
 * runs, a different name turns red (`bad`) and the program stops there. The
 * underline draws itself in (a 3px bar growing left to right on the house
 * curve); a `bad` mark also paints the token in the danger tone.
 */

const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE = [0.22, 1, 0.36, 1] as const

const KEYWORDS = new Set([
  'def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for',
  'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'with',
  'try', 'except', 'raise', 'lambda', 'yield', 'pass', 'async', 'await',
])

const COLORS = {
  comment: '#6B87A8',
  string: '#7FE3D8',
  number: '#FFB055',
  keyword: '#7FA6FF',
  func: '#4C80FF',
}

/** The colours a mark may take: the brand blue (the name brought in and used), the teal (a second name), the danger tone (a name that is not there). */
export const MARK_COLORS = {
  a: '#7FA6FF',
  b: '#7FE3D8',
  c: '#FFB055',
  bad: '#FF6B6B',
} as const
export type MarkTone = keyof typeof MARK_COLORS

/** One underlined token on a line: the `nth` occurrence of `text` (1-based, default 1). */
export interface Mark {
  text: string
  tone: MarkTone
  nth?: number
}

/* the kit's tokenizer, unchanged */
const TOKEN = /(#[^\n]*|(?<=^|\s)\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([^A-Za-z0-9_$#"'`/]+|.)/g

function Marked({ tone, children }: { tone: MarkTone; children: ReactNode }) {
  const instant = useInstant()
  const color = MARK_COLORS[tone]
  return (
    <span className="relative inline-block" style={{ color: tone === 'bad' ? color : undefined, fontWeight: 700, transition: instant ? 'none' : `color 420ms ${HOUSE}` }}>
      {children}
      <motion.span
        aria-hidden
        className="absolute left-0 right-0 block rounded-full"
        style={{ bottom: -3, height: 3, background: color, transformOrigin: '0 50%' }}
        initial={instant ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.52, ease: EASE, delay: instant ? 0 : 0.12 }}
      />
    </span>
  )
}

function highlight(line: string, base: number, marks: Mark[] = []) {
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  let key = base
  const seen: Record<string, number> = {}
  while ((m = TOKEN.exec(line)) !== null) {
    const [full, comment, str, num, ident] = m
    if (comment) out.push(<span key={key++} style={{ color: COLORS.comment, fontStyle: 'italic' }}>{comment}</span>)
    else if (str) out.push(<span key={key++} style={{ color: COLORS.string }}>{str}</span>)
    else if (num) out.push(<span key={key++} style={{ color: COLORS.number }}>{num}</span>)
    else if (ident) {
      seen[ident] = (seen[ident] ?? 0) + 1
      const mark = marks.find((k) => k.text === ident && (k.nth ?? 1) === seen[ident])
      let node: ReactNode
      if (KEYWORDS.has(ident)) node = <span style={{ color: COLORS.keyword, fontWeight: 600 }}>{ident}</span>
      else if (line[TOKEN.lastIndex] === '(') node = <span style={{ color: COLORS.func }}>{ident}</span>
      else node = ident
      out.push(mark ? <Marked key={`${key++}-${mark.tone}`} tone={mark.tone}>{node}</Marked> : <Fragment key={key++}>{node}</Fragment>)
    } else out.push(<Fragment key={key++}>{full}</Fragment>)
  }
  return out
}

/** The marker a card writes into its code for a blank: `________`. */
export const BLANK = '________'
/* PF 25: three underscores is a blank too (X1's `insert(___, ...)`); no Python name in these decks has three in a row */
const BLANK_RE = /(_{3,})/

/**
 * THE FILL-IN BLANK (rule G4). A dashed amber slot, as wide as the marker,
 * with a small pencil at its right: the room reads it as "you write this".
 * Its tint breathes on a slow ease-in-out loop, so the eye finds it without
 * anything jumping. Inline-flex and middle-aligned, so it sits on the code
 * line's centre like a token.
 */
export function Blank({ chars = 8 }: { chars?: number }) {
  return (
    <span
      aria-label="blank to fill in"
      className="cb-blank"
      style={{ width: `${Math.max(chars, 3) + 1.5}ch` }}
    >
      <svg width="0.8em" height="0.8em" viewBox="0 0 16 16" aria-hidden className="cb-pencil">
        <path d="M11.2 2.3a1.6 1.6 0 0 1 2.3 0l.2.2a1.6 1.6 0 0 1 0 2.3L6 12.5l-3.3.8.8-3.3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.6 3.9l2.5 2.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </span>
  )
}

const CSS = `
.cb-blank {
  display: inline-flex; align-items: center; justify-content: flex-end;
  height: 1.3em; vertical-align: middle; position: relative; top: -0.06em;
  padding: 0 0.35em; box-sizing: border-box;
  border-radius: 7px; border: 1.5px dashed rgba(255,176,85,0.9);
  background: rgba(255,176,85,0.12); color: #FFB055;
  animation: cb-breathe 2.6s ease-in-out infinite;
}
.cb-pencil { opacity: 0.85; }
@keyframes cb-breathe {
  0%, 100% { background-color: rgba(255,176,85,0.10); box-shadow: 0 0 0 0 rgba(255,176,85,0); }
  50% { background-color: rgba(255,176,85,0.22); box-shadow: 0 0 0 3px rgba(255,176,85,0.12); }
}
@media (prefers-reduced-motion: reduce) { .cb-blank { animation: none; } }
`
if (typeof document !== 'undefined' && !document.querySelector('style[data-cb-blank]')) {
  const el = document.createElement('style')
  el.dataset.cbBlank = ''
  el.textContent = CSS
  document.head.appendChild(el)
}

function renderLine(line: string, marks?: Mark[]): ReactNode {
  if (!line) return ' '
  if (!BLANK_RE.test(line)) return highlight(line, 0, marks)
  return line.split(BLANK_RE).map((seg, i) => (/^_{3,}$/.test(seg) ? <Blank key={`b${i}`} chars={seg.length} /> : <Fragment key={`s${i}`}>{highlight(seg, i * 1000, marks)}</Fragment>))
}

const LINE_STATE: Record<CodeLineState, { background?: string; boxShadow?: string; opacity?: number }> = {
  mark: { background: 'rgba(11,95,255,0.26)', boxShadow: 'inset 3px 0 0 #7FA6FF' },
  now: { background: 'rgba(11,95,255,0.34)', boxShadow: 'inset 3px 0 0 #7FA6FF' },
  ran: { background: 'rgba(255,255,255,0.06)' },
  dead: { opacity: 0.3 },
  warn: { background: 'rgba(255,176,85,0.2)', boxShadow: 'inset 3px 0 0 #FFB055' },
  error: { background: 'rgba(239,68,68,0.22)', boxShadow: 'inset 3px 0 0 #EF4444' },
}
const REST = { background: 'rgba(11,95,255,0)', boxShadow: 'inset 0 0 0 #7FA6FF00', opacity: 1 }

export function Code({
  code,
  filename = 'Python',
  lines: lineStates = {},
  rows,
  fontSize = 15,
  marks = {},
  dense = false,
}: {
  code: string
  filename?: string
  lines?: Record<number, CodeLineState>
  rows?: number
  fontSize?: number
  /** PF 31: underlined names, per line number (1-based) */
  marks?: Record<number, Mark[]>
  /** PF 31: tighter rows (line height 1.4, 12px padding) for an eleven-line program beside a phone */
  dense?: boolean
}) {
  const instant = useInstant()
  const lines = code.replace(/\n$/, '').split('\n')
  const rowH = Math.round(fontSize * (dense ? 1.4 : 1.55))
  const PAD = dense ? 12 : 16
  const floor = (rows ?? lines.length) * rowH + PAD * 2
  /* a line animates only when it changes after the panel has mounted */
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  const fresh = mounted.current && !instant
  return (
    <div className="overflow-hidden rounded-card bg-night-2 shadow-card">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-body-sm text-white/60">{filename}</span>
      </div>
      <pre className="relative overflow-hidden px-4 font-mono" style={{ paddingTop: PAD, paddingBottom: PAD, minHeight: floor, fontSize, lineHeight: dense ? 1.4 : 1.55, transition: instant ? 'none' : `min-height 520ms ${HOUSE}` }}>
        <code className="grid">
          {lines.map((line, i) => {
            const state = lineStates[i + 1]
            const look = state ? { ...REST, ...LINE_STATE[state] } : REST
            const lm = marks[i + 1]
            return (
              <span
                key={i}
                className="-mx-4 grid grid-cols-[auto_1fr] gap-4 px-5"
                style={{
                  height: rowH,
                  alignItems: 'center',
                  transition: instant ? 'none' : `background-color 420ms ${HOUSE}, opacity 420ms ${HOUSE}, box-shadow 420ms ${HOUSE}`,
                  ...look,
                }}
              >
                <span className="select-none text-right text-white/25">{i + 1}</span>
                <motion.span
                  key={line}
                  className="whitespace-pre text-white/90"
                  initial={fresh ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, ease: EASE }}
                >
                  {renderLine(line, lm)}
                </motion.span>
              </span>
            )
          })}
        </code>
      </pre>
    </div>
  )
}
