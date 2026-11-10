import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Num, STILL, Stage, useBuild } from '@/decks/figures/scene'
import { NoteBox, StepLabel } from '@/decks/figures/net/frames'
import { VisualTable } from '@/decks/figures/net/vtable'
import { Diagram } from '@/engine/Diagram'
import { Icon, Rich } from '@/engine/icon'
import type { DiagramSpec, TableFigure } from '@/engine/types'
import { dims } from 'virtual:deck'

/**
 * BUILDER E · the practical (TR 24-27). Two engine gaps filled here, both as
 * whole slides that reuse the engine's own frames (Card, Stage, Diagram,
 * VisualTable, NoteBox, StepLabel) so they read as the `lead` and `table`
 * layouts do:
 *   E_LeadNote   the `lead` layout plus a note under the figure (the layout has no `note`)
 *   E_TableNote  the `table` layout plus a note under the table (the layout has no `note`)
 *   E_BrowserTest two browser captures, each with its rings and its caption (one capture per
 *                screenshot slide is all the `screenshot` layout takes)
 */

/**
 * `Rich`, but the plain runs are bare text nodes of ONE parent span, so the entrance walker
 * (`figures/entrance.ts`) treats the whole line as one unit: with auto animation off a lead holding
 * backtick code arrives on one press, not one press per run.
 */
function RichOne({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <span className={`e-nw ${className}`}>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code key={i} className="rounded-[6px] px-1.5 py-[1px] font-mono text-[0.92em]" style={{ background: '#EEF3FF', color: '#1D3FD6' }}>
            {p.slice(1, -1)}
          </code>
        ) : (
          p
        ),
      )}
    </span>
  )
}

type Note = { text: string; tone?: 'info' | 'warn' }
const noteTone = (n: Note) => (n.tone === 'info' ? colors.brand : colors.accent)

function NoteLine({ note }: { note: Note }) {
  return (
    <NoteBox tone={noteTone(note)}>
      <span className="flex items-start gap-3">
        <span className="mt-[2px] shrink-0" style={{ color: note.tone === 'info' ? colors.brand : colors.accentDark }}>
          <Icon name={note.tone === 'info' ? 'Info' : 'TriangleAlert'} size={20} />
        </span>
        <span>
          <Rich text={note.text} />
        </span>
      </span>
    </NoteBox>
  )
}

/** the `lead` layout (centred lead, one diagram on a stage) with a note under the stage */
function E_LeadNote({ id, kicker, title, lead, note, side, figure, figW, figH, flip, lesson }: { id: string; kicker: string; title: string; lead?: string; note?: Note; side?: boolean; figure: DiagramSpec; figW?: number; figH?: number; flip?: string[]; lesson: string }) {
  const n = figure.steps?.length ?? 0
  const step = useBuild(n + 1)
  const w = figW ?? figure.w
  const h = figH ?? figure.h
  /* `flip`: diagram nodes whose picture is mirrored (a library person turned to face the figure); the
     mirror is on the img alone, so the node's label, loop and arrow geometry are untouched */
  const stage = (
    <Stage w={w} h={h}>
      {flip && flip.length > 0 && <style>{flip.map((f) => `[data-e-flip="${id}"] [data-diagram-node="${f}"] img { transform: scaleX(-1); }`).join('\n')}</style>}
      <div data-e-flip={id} className="h-full w-full">
        <Diagram spec={figure} step={step} />
      </div>
    </Stage>
  )
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <RichOne text={lead} /> : undefined} lesson={lesson}>
      <div className="flex flex-col items-center gap-4" style={{ width: BOX_W }}>
        {note && side ? (
          /* the note as a side card beside the stage, so the stage keeps its height */
          <div className="flex items-center justify-between gap-5" style={{ width: BOX_W }}>
            {stage}
            <SideNote note={note} w={BOX_W - w - 20} />
          </div>
        ) : (
          stage
        )}
        {note && !side && <NoteLine note={note} />}
      </div>
    </Card>
  )
}

function SideNote({ note, w }: { note: Note; w: number }) {
  return (
    <NoteBox tone={noteTone(note)} w={w} size={18}>
      <span className="flex flex-col gap-3 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: note.tone === 'info' ? colors.brand : colors.accent, color: colors.white }}>
          <Icon name={note.tone === 'info' ? 'Info' : 'TriangleAlert'} size={20} />
        </span>
        <span className="leading-snug">
          <Rich text={note.text} />
        </span>
      </span>
    </NoteBox>
  )
}

/** the `table` layout with a note under the table */
function E_TableNote({ id, kicker, title, lead, table, note, lesson }: { id: string; kicker: string; title: string; lead?: string; table: TableFigure; note?: Note; lesson: string }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <RichOne text={lead} /> : undefined} lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <VisualTable
          size={table.size ?? 16}
          compact
          highlight={table.highlight ?? []}
          columns={table.columns.map((c) => ({ label: c.label, weight: c.weight, icon: c.icon ? <Icon name={c.icon} size={16} /> : undefined }))}
          rows={table.rows.map((r) => ({ icon: r.icon ? <Icon name={r.icon} size={18} /> : undefined, cells: r.cells.map((c, i) => <Rich key={i} text={c} />) }))}
        />
        {note && <NoteLine note={note} />}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ the browser test */

type Shot = { image: string; rings: [number, number, number, number][]; caption: string; icon?: string }

/** one capture at width `w`, its rings lit from `from` on (one per press) */
function Capture({ s, w, shown }: { s: Shot; w: number; shown: number }) {
  const [nw, nh] = (dims as Record<string, [number, number]>)[s.image] ?? [1400, 200]
  const k = w / nw
  const h = Math.round(nh * k)
  return (
    <div className="e-shot relative shrink-0" style={{ width: w, height: h }}>
      <div className="overflow-hidden rounded-[10px] border border-line bg-white" style={{ width: w, height: h, boxShadow: '0 12px 30px -18px rgba(16,32,58,0.45)' }}>
        <img src={s.image} alt="" draggable={false} className="block select-none" style={{ width: w - 2, height: h - 2 }} />
      </div>
      {s.rings.map(([x, y, rw, rh], i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-[6px]"
          style={{ left: x * k - 4, top: y * k - 4, width: rw * k + 8, height: rh * k + 8, boxShadow: `0 0 0 3px ${colors.accent}`, opacity: i < shown ? 1 : 0, transition: 'opacity 320ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      ))}
    </div>
  )
}

function E_BrowserTest({ id, kicker, title, step, icon, shots, lesson }: { id: string; kicker: string; title: string; step: string; icon?: string; shots: Shot[]; lesson: string }) {
  /* one press per ring, in order across the two captures */
  const total = shots.reduce((a, s) => a + s.rings.length, 0)
  const lit = useBuild(total + 1)
  const shown = STILL ? total : lit
  let before = 0
  const W = 740
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <StepLabel>
          <span className="inline-flex items-center gap-2">
            <Icon name={icon} size={18} />
            <Rich text={step} />
          </span>
        </StepLabel>
        {shots.map((s, i) => {
          const from = before
          before += s.rings.length
          const on = Math.max(0, Math.min(s.rings.length, shown - from))
          return (
            /* the explanation box sits level with the TOP edge of its capture (user, 2026-11-06), both pairs alike */
            <div key={i} className="flex items-start gap-6">
              <Capture s={s} w={W} shown={on} />
              <div className="flex min-w-0 flex-1 items-start gap-3 rounded-[14px] border border-line bg-white px-4 py-3" style={{ boxShadow: '0 6px 18px -14px rgba(16,32,58,0.35)' }}>
                <span className="mt-[2px] shrink-0" style={{ color: colors.brand }}>
                  <Icon name={s.icon ?? 'Globe'} size={20} />
                </span>
                <span className="e-nw text-[18px] leading-snug" style={{ color: colors.ink }}>
                  <Rich text={s.caption} />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ numbered lab steps, a zig-zag timeline */

/**
 * THE LAB STEPS AS A VERTICAL ZIG-ZAG TIMELINE (user, 2026-11-06: "redesign for visual engagement"; the
 * pattern of the 7-step vertical zig-zag / journey layouts on presentationgo.com and slidemodel.com).
 * A numbered spine runs down the middle; the steps alternate left and right of it, each card joined to
 * its number by a short tick, so the order reads top to bottom while every card keeps a wide, short
 * line length. Each step (card, tick and number) is one unit the entrance walker brings in, in step order.
 */
const E_ROW = 52 // the spacing of the numbers; two cards on one side sit two rows apart
const E_SPINE = 56 // the middle column that holds the numbers
const E_TOP = 36 // the first number's centre, so the first card's top meets the frame's top
const E_FOOT = 60 // room under the last number for the last (longest) card
function E_Steps({ id, kicker, title, steps, lesson }: { id: string; kicker: string; title: string; steps: { text: string; icon?: string }[]; lesson: string }) {
  const half = (BOX_W - E_SPINE) / 2
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <div className="relative" style={{ width: BOX_W, height: E_TOP + (steps.length - 1) * E_ROW + E_FOOT }}>
        {/* the spine, from the first number to the last */}
        <span aria-hidden className="absolute rounded-full" style={{ left: BOX_W / 2 - 1.5, top: E_TOP, width: 3, height: (steps.length - 1) * E_ROW, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.line} 100%)` }} />
        {steps.map((p, i) => {
          const left = i % 2 === 0
          const cy = E_TOP + i * E_ROW
          /*
            ONE STEP = ONE UNIT, numbered card and all. The wrapper holds the card, its tick and its number, and
            reaches past the spine, so the left and right wrappers overlap in x: the step-by-step walker then
            orders them by their tops (1, 2, 3 ...) instead of reading the left column first. Its ring is
            transparent; it only makes the wrapper a drawn box, so the walker takes the whole step as one block.
          */
          const reach = E_SPINE / 2 + 22 // card edge to just past the number's far side
          return (
            <div
              key={i}
              className="absolute flex items-center"
              style={{ left: left ? 0 : half + E_SPINE - reach, top: cy, width: half + reach, transform: 'translateY(-50%)', flexDirection: left ? 'row' : 'row-reverse', boxShadow: '0 0 0 0 transparent' }}
            >
              <div className="e-step flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-2.5" style={{ boxShadow: '0 10px 24px -16px rgba(16,32,58,0.4)' }}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: colors.surface2, color: colors.brand }}>
                  <Icon name={p.icon} size={19} />
                </span>
                <span className="e-nw text-[16px] leading-snug" style={{ color: colors.ink }}>
                  <Rich text={p.text} />
                </span>
              </div>
              <span aria-hidden className="shrink-0" style={{ width: E_SPINE / 2 - 20, height: 2, background: colors.line }} />
              <span className="shrink-0" style={{ borderRadius: 999, boxShadow: `0 0 0 5px ${colors.surface}, 0 8px 18px -10px rgba(45,99,251,0.6)` }}>
                <Num n={i + 1} size={40} />
              </span>
              <span aria-hidden className="shrink-0" style={{ width: 2 }} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {}

export const slides = {
  E_LeadNote,
  E_TableNote,
  E_BrowserTest,
  E_Steps,
}

export const css = `.e-shot img { image-rendering: auto; } .e-nw code { white-space: nowrap; }`
