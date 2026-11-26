
/**
 * A terminal, in one of two window chromes.
 *
 * The kit's `CodeBlock` is a *file* view (traffic lights, a filename, line
 * numbers), which is wrong for commands: students run these in a terminal, and
 * the thing they actually have to recognise is the window plus the prompt path
 * telling them *which folder* they are in. So this renders real chrome, and each
 * command carries its real `PS <path>>` prompt.
 *
 * One `Terminal` is one terminal. Two terminals means two of these side by
 * side, never two prompts inside one panel.
 *
 * TWO CHROMES, BECAUSE THE WINDOW IS PART OF THE INSTRUCTION.
 *
 * `vscode` (the default) draws the integrated panel, tab strip and all. It is
 * right for the 95% of commands this course runs from inside the editor.
 *
 * `powershell` draws a STANDALONE Windows PowerShell window with a title bar.
 * Session 5 needed it and the review caught the difference: a slide that says
 * "run this in an Administrator PowerShell" while drawing VS Code's panel is
 * telling the room two different things, and the one that matters is the one it
 * draws. A learner who runs an elevated search inside the editor's terminal gets
 * no results.
 */

export interface TerminalLine {
  text: string
  /**
   * `cmd` gets the prompt prefix; `out` is program output; `ok` is a success
   * line; `err` is an error, in red.
   *
   * `err` exists because a console error IS red, and rendering it in the same
   * grey as ordinary output loses the one cue a learner scans for. Session 5's
   * `make is not recognized` slide is the case: the review asked for the red
   * from the real capture.
   */
  kind?: 'cmd' | 'out' | 'ok' | 'err'
}

const TABS = ['PROBLEMS', 'OUTPUT', 'TERMINAL']

/*
  THE TWO GROUNDS.

  VS Code's integrated terminal is #1E1E1E; a PowerShell window is #0C0C0C,
  which is nearly black and is what makes the standalone window read as a
  different application rather than as the same panel restyled.
*/
const GROUND = { vscode: '#1E1E1E', powershell: '#0C0C0C' } as const

/*
  `#F14C4C`, NOT PURE RED.

  The captures show a saturated console red, and pure #FF0000 on a near-black
  ground vibrates badly on a projector and reads as a rendering fault. This is
  VS Code's own bright-ANSI red: the same hue, legible from the back of a room.
*/
const ERR = '#F14C4C'

/* Amber, the same "look here" as `Shot`'s highlight box, and a colour no
   terminal `kind` already uses: green means success and red means error, so
   neither can double as emphasis. Applied to the line box rather than the text,
   so a wrapped line marks as one block. */
const MARK = (on: boolean) =>
  on
    ? { background: 'rgba(245,158,11,0.20)', boxShadow: '0 0 0 1.5px rgba(245,158,11,0.75)', borderRadius: 4 }
    : undefined

export function Terminal({
  /** The folder the prompt sits in, e.g. `C:\ecommerce\backend`. */
  path,
  lines,
  /** Caption under the panel saying what this terminal is for. */
  caption,
  fontSize = 15,
  /**
   * Which window to draw. `vscode` is the integrated panel and the default;
   * `powershell` is a standalone Windows PowerShell window.
   *
   * Pick the one the slide is actually telling the room to open.
   */
  chrome = 'vscode',
  /** The `powershell` window's title bar text. Ignored by `vscode`. */
  title = 'Windows PowerShell',
  /**
   * Line numbers to mark, 1-based over `lines`, the same shape and the same
   * 1-based counting as `CodeBlock`'s `highlight`.
   *
   * For the one line in a transcript that the room has to DO something with: a
   * value to copy, the line that carries the verdict. `kind: 'ok'` already
   * colours a success line green, and green among grey is not enough when the
   * task is "copy exactly this".
   *
   * Keep it to one line. A panel with three marked lines has none.
   */
  highlight,
  className = '',
}: {
  path: string
  lines: TerminalLine[]
  caption?: string
  fontSize?: number
  chrome?: 'vscode' | 'powershell'
  title?: string
  highlight?: number[]
  className?: string
}) {
  const marked = new Set(highlight ?? [])
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-card shadow-card" style={{ background: GROUND[chrome] }}>
        {chrome === 'powershell' ? (
          /* A STANDALONE WINDOW: title bar, icon, and the three window buttons.
             Those three glyphs are most of what makes it read as its own window
             rather than as a panel inside something else, so they are drawn even
             though nothing on a slide can click them. */
          <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#2B2B2B' }}>
            <span
              className="grid h-4 w-4 shrink-0 place-items-center rounded-[3px] font-mono text-[9px] font-bold"
              style={{ background: '#012456', color: '#E7E7E7' }}
            >
              {'>'}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: '#E7E7E7' }}>
              {title}
            </span>
            <span className="ml-auto flex items-center gap-3 text-[11px]" style={{ color: '#9A9A9A' }}>
              <span>&#8722;</span>
              <span>&#9633;</span>
              <span>&#10005;</span>
            </span>
          </div>
        ) : (
          /* Panel tab strip */
          <div className="flex items-center gap-4 px-4" style={{ background: '#252526' }}>
            {TABS.map((t) => {
              const active = t === 'TERMINAL'
              return (
                <span
                  key={t}
                  className="font-term py-2 text-[11px] font-semibold tracking-wider"
                  style={{
                    color: active ? '#E7E7E7' : '#8A8A8A',
                    borderBottom: `1.5px solid ${active ? '#0B5FFF' : 'transparent'}`,
                  }}
                >
                  {t}
                </span>
              )
            })}
            <span className="ml-auto font-term py-2 text-[11px]" style={{ color: '#8A8A8A' }}>
              powershell
            </span>
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-3.5 font-mono" style={{ fontSize, lineHeight: 1.65 }}>
          {lines.map((l, i) => {
            const kind = l.kind ?? 'out'
            if (kind === 'cmd') {
              return (
                <div key={i} className="whitespace-pre-wrap break-words" style={MARK(marked.has(i + 1))}>
                  <span style={{ color: '#5A9BD5' }}>{`PS ${path}> `}</span>
                  <span style={{ color: '#F2F2F2' }}>{l.text}</span>
                </div>
              )
            }
            return (
              <div
                key={i}
                className="whitespace-pre-wrap break-words"
                style={{ color: kind === 'ok' ? '#4EC9A0' : kind === 'err' ? ERR : '#B9B9B9', ...MARK(marked.has(i + 1)) }}
              >
                {l.text || '\u00A0'}
              </div>
            )
          })}
        </div>
      </div>
      {caption && (
        <p className="mt-2 text-center text-body-sm font-semibold text-ink">{caption}</p>
      )}
    </div>
  )
}
