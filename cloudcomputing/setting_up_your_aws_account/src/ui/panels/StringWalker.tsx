import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { CodeBlock, type CodeLineState } from '@/ui/CodeBlock'
import { OutputPanel } from '@/ui/CodeOutput'
import { useInstant } from '@/motion/instant'
import { PanelButton } from './beats'
import { SeqBoxes, TraceCaption, TraceKey, VarTrail } from './tracePieces'

/**
 * A FOR LOOP OVER A STRING, WALKED ONE STATEMENT AT A TIME.
 *
 * From PF 14 "For Loop". Two moves on one slide. First the string is split:
 * "Python" is one thing on screen until a press turns it into the characters the
 * loop will walk, which is the idea the session rests on. Then the room picks a
 * word, says what it thinks will print, and only then is Play pressed.
 *
 * The steps are COMPUTED from the word, never typed in, so a second walk with a
 * different word is not a lie. With the empty word the loop body is never
 * reached and line 3 stays "never reached" after the run: that is the finding.
 *
 * The panel owns its controls, so they are local state, not deck build steps:
 * the deck's arrow keys still move to the next slide.
 *
 * Layout (user, PF 14): code, word picker, key and controls in the left column
 * under the code box; the characters, `ch` and the output on the right, each at
 * a fixed height, so a step never pushes anything up or down.
 */
type Step = { line: number; take?: number; ch?: string; print?: string; drained?: boolean; cap: ReactNode }

function plan(word: string): Step[] {
  const p: Step[] = [{ line: 1, cap: <><b>Line 1.</b> word now holds this sequence.</> }]
  for (let i = 0; i < word.length; i++) {
    p.push({ line: 2, take: i, ch: word[i], cap: <><b>Line 2.</b> The loop takes the next item. ch is {word[i]}.</> })
    p.push({ line: 3, print: word[i], cap: <><b>Line 3.</b> It prints whatever ch is holding right now.</> })
  }
  p.push({
    line: 2,
    drained: true,
    cap: word.length ? (
      <><b>Line 2.</b> Nothing left in the sequence, so the loop ends.</>
    ) : (
      <><b>Line 2.</b> The sequence is empty, so line 3 never runs at all.</>
    ),
  })
  p.push({ line: 4, print: 'Done', cap: <><b>Line 4.</b> This is outside the loop, so it runs once.</> })
  return p
}

export function StringWalker({
  words = ['Python', 'Go', ''],
  rows = 4,
  outputHeight = 214,
}: {
  /** The picker's words, first one selected. `''` is shown as "nothing". */
  words?: string[]
  /** The code box's height in rows, shared with the slides around it. */
  rows?: number
  outputHeight?: number
}) {
  const instant = useInstant()
  const [word, setWord] = useState(words[0])
  const [at, setAt] = useState(0)
  const [split, setSplit] = useState(false)
  const [playing, setPlaying] = useState(false)
  const steps = useMemo(() => plan(word), [word])
  const timer = useRef<number | null>(null)

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    setPlaying(false)
  }
  useEffect(() => stop, [])
  useEffect(() => {
    if (playing && at >= steps.length) stop()
  }, [playing, at, steps.length])

  /* A new word, or Reset, goes back to the whole string: the room sees it split
     every time, not only the first. */
  const reset = (w: string) => {
    stop()
    setWord(w)
    setAt(0)
    setSplit(false)
  }
  const doSplit = () => setSplit(true)
  const one = () => {
    doSplit()
    setAt((a) => Math.min(a + 1, steps.length))
  }
  const play = () => {
    doSplit()
    if (timer.current) return stop()
    setPlaying(true)
    timer.current = window.setInterval(() => setAt((a) => Math.min(a + 1, steps.length)), instant ? 120 : 950)
  }

  /* everything on screen is derived from `at` */
  const ran = new Set<number>()
  const hist: string[] = []
  const out: string[] = []
  const taken = new Set<number>()
  let now = 0
  let cur: number | undefined
  let drained = false
  for (let k = 0; k < at; k++) {
    const s = steps[k]
    ran.add(s.line)
    now = s.line
    if (s.take !== undefined) {
      taken.add(s.take)
      cur = s.take
    }
    if (s.drained) {
      drained = true
      cur = undefined
    }
    if (s.ch !== undefined && hist[hist.length - 1] !== s.ch) hist.push(s.ch)
    if (s.print !== undefined) out.push(s.print)
  }
  const lines: Record<number, CodeLineState> = {}
  for (let l = 1; l <= 4; l++) {
    if (at > 0 && l === now) lines[l] = 'now'
    else if (ran.has(l)) lines[l] = 'ran'
    else if (at >= steps.length) lines[l] = 'dead'
  }

  const code = [`word = "${word}"`, 'for ch in word:', '    print(ch)', 'print("Done")'].join('\n')

  let caption: ReactNode
  if (at > 0) caption = steps[at - 1].cap
  else if (split)
    caption = word.length ? (
      <><b>Six characters, not one word.</b> That is the sequence the loop walks. Write down how many lines it prints, then press Play.</>
    ) : (
      <><b>Nothing came out.</b> An empty string has no characters in it at all.</>
    )
  else
    caption = word.length ? (
      <><b>One string, or {word.length} characters?</b> Say which, then press <b>Split it</b>.</>
    ) : (
      <><b>Nothing between the quote marks.</b> How many characters is that? Say it, then press <b>Split it</b>.</>
    )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-10">
        {/* LEFT: the code, then what drives it */}
        <div className="flex w-[560px] shrink-0 flex-col gap-3">
          <CodeBlock code={code} filename="Python" chip={false} fontSize={20} rows={rows} lines={lines} maxHeight={600} />
          <div className="mt-1 flex items-center gap-2">
            <span className="mr-1 font-mono text-[17px]" style={{ color: colors.muted }}>word</span>
            {words.map((w) => (
              <button
                key={w || 'nothing'}
                type="button"
                aria-pressed={w === word}
                onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
                onClick={() => reset(w)}
                className="rounded-pill px-4 py-1.5 font-mono text-[17px] font-semibold"
                style={
                  w === word
                    ? { background: colors.brandDark, color: colors.white }
                    : { background: colors.white, color: colors.body, boxShadow: `inset 0 0 0 1px ${colors.line}` }
                }
              >
                {w || 'nothing'}
              </button>
            ))}
          </div>
          <TraceKey
            items={[
              { swatch: 'ran', label: 'already run' },
              { swatch: 'now', label: 'running now' },
              { swatch: 'dead', label: 'never reached, and it stays grey' },
            ]}
          />
          <div className="flex items-center gap-2">
            <PanelButton onClick={play} disabled={at >= steps.length}>{playing ? 'Pause' : 'Play'}</PanelButton>
            <PanelButton onClick={one} disabled={at >= steps.length}>One step</PanelButton>
            <PanelButton ghost onClick={() => reset(word)}>Reset</PanelButton>
            <span className="ml-auto text-[16px] tabular-nums" style={{ color: colors.muted }}>
              {at} / {steps.length} steps
            </span>
          </div>
        </div>

        {/* RIGHT: the sequence, ch, the output. Fixed heights, top-down. */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="relative h-[64px]">
            <div
              className="absolute inset-0 flex items-center gap-3"
              style={{ opacity: split ? 0 : 1, pointerEvents: split ? 'none' : 'auto', transition: 'opacity 260ms' }}
            >
              <span
                className="rounded-xl bg-white px-4 py-1.5 font-mono text-[28px] font-semibold"
                style={{ color: colors.tealDark, boxShadow: `inset 0 0 0 2px ${colors.teal}` }}
              >
                "{word}"
              </span>
              <PanelButton onClick={doSplit}>Split it</PanelButton>
            </div>
            <div className="pointer-events-none absolute inset-0">
              <SeqBoxes items={[...word]} taken={taken} current={cur} shown={split} drained={split && (drained || word.length === 0)} />
            </div>
          </div>
          <VarTrail name="ch" values={hist} />
          <OutputPanel output={out.join('\n')} fontSize={16} lineHeight={1.35} height={outputHeight} />
        </div>
      </div>
      <TraceCaption>{caption}</TraceCaption>
    </div>
  )
}
