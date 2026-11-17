import { useEffect, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Num, STILL, useBuild } from '@/decks/figures/scene'
import { StepLabel } from '@/decks/figures/net/frames'
import { Icon, Rich } from '@/engine/icon'
import { dims } from 'virtual:deck'

/**
 * THE PRACTICAL (TR 24-29), built from Session 6's lab frames (its `E_BrowserTest` capture + caption pair and
 * its `E_Steps` zig-zag timeline), so the two sessions' labs read alike:
 *   L_Shot   one capture (R7.9: one sharp enlarged image, its orange rings lit one per press) with the TR's
 *            caption in an explanation box level with the capture's TOP edge (standing correction 7). A TR lab
 *            slide holds two captures, so it is two L_Shot frames with the same kicker and title; the TR's
 *            lead sits on the first. `leadSide` moves a lead into the caption column so a tall capture keeps
 *            its height.
 *   L_Steps  numbered lab steps as the vertical zig-zag timeline (standing correction 8), with an optional lead.
 */

const SHADOW = '0 12px 30px -18px rgba(16,32,58,0.45)'
const CARD = '0 6px 18px -14px rgba(16,32,58,0.35)'

/** a lead with "\n" between its sentences: one line each (rule 36) */
const Lines = ({ text }: { text: string }) => (
  <>
    {text.split('\n').map((l, i) => (
      <span key={i} className="block">
        <Rich text={l} />
      </span>
    ))}
  </>
)

type ShotProps = {
  id: string
  kicker: string
  title: string
  lead?: string
  leadSide?: boolean
  step: string
  icon?: string
  image: string
  rings?: [number, number, number, number][]
  caption: string
  /** the capture's widest width; the height cap comes from the space left under the header */
  maxW?: number
  /** the caption under a very wide capture (full width), not beside it */
  below?: boolean
  lesson: string
}

function L_Shot({ id, kicker, title, lead, leadSide, step, icon, image, rings = [], caption, maxW = 760, below, lesson }: ShotProps) {
  const lit = useBuild(rings.length + 1)
  const shown = STILL ? rings.length : lit
  const [nw, nh] = (dims as Record<string, [number, number]>)[image] ?? [1600, 900]
  /* the frame's body starts at y 221 (ZONE.band.top), or at 162 under a header lead (~33 px a line + its gap), and
     must end by 640 (the safe bottom over the player bar); the step label and its gap take ~46 */
  const leadLines = lead && !leadSide ? lead.split('\n').reduce((a, l) => a + Math.ceil(l.length / 78), 0) : 0
  const capLines = below ? caption.split('\n').reduce((a, l) => a + Math.ceil(l.length / 110), 0) : 0
  const maxH = 640 - (leadLines ? 162 + leadLines * 33 + 28 : 221) - 46 - (below ? capLines * 26 + 40 : 0)
  const k = Math.min((below ? BOX_W : maxW) / nw, maxH / nh)
  const w = Math.round(nw * k)
  const h = Math.round(nh * k)
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead && !leadSide ? <Lines text={lead} /> : undefined} lesson={lesson}>
      <div className="flex flex-col gap-3" style={{ width: BOX_W }}>
        <StepLabel>
          <span className="inline-flex items-center gap-2">
            <Icon name={icon ?? 'Camera'} size={18} />
            <Rich text={step} />
          </span>
        </StepLabel>
        <div className={below ? 'flex flex-col items-center gap-3' : 'flex items-start gap-6'}>
          <div className="l-shot relative shrink-0" style={{ width: w, height: h }}>
            <div className="overflow-hidden rounded-[10px] border border-line bg-white" style={{ width: w, height: h, boxShadow: SHADOW }}>
              <img src={image} alt="" draggable={false} className="block select-none" style={{ width: w - 2, height: h - 2 }} />
            </div>
            {rings.map(([x, y, rw, rh], i) => (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute rounded-[6px]"
                style={{ left: x * k - 4, top: y * k - 4, width: rw * k + 8, height: rh * k + 8, boxShadow: `0 0 0 3px ${colors.accent}`, opacity: i < shown ? 1 : 0, transition: 'opacity 320ms cubic-bezier(0.22,1,0.36,1)' }}
              />
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3" style={below ? { width: BOX_W } : undefined}>
            {lead && leadSide && (
              <p className="l-nw text-[18px] leading-snug" style={{ color: colors.ink }}>
                <Lines text={lead} />
              </p>
            )}
            <div className="flex items-start gap-3 rounded-[14px] border border-line bg-white px-4 py-3" style={{ boxShadow: CARD }}>
              <span className="mt-[2px] shrink-0" style={{ color: colors.brand }}>
                <Icon name="Info" size={20} />
              </span>
              <span className="l-nw text-[17px] leading-snug" style={{ color: colors.ink }}>
                <Lines text={caption} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ numbered lab steps, a zig-zag timeline */

const ROW = 52
const SPINE = 56
const TOP = 36
const FOOT = 60

function L_Steps({ id, kicker, title, lead, steps, lesson }: { id: string; kicker: string; title: string; lead?: string; steps: { text: string; icon?: string }[]; lesson: string }) {
  const half = (BOX_W - SPINE) / 2
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <Lines text={lead} /> : undefined} lesson={lesson}>
      <div className="relative" style={{ width: BOX_W, height: TOP + (steps.length - 1) * ROW + FOOT }}>
        <span aria-hidden className="absolute rounded-full" style={{ left: BOX_W / 2 - 1.5, top: TOP, width: 3, height: (steps.length - 1) * ROW, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.line} 100%)` }} />
        {steps.map((p, i) => {
          const left = i % 2 === 0
          const cy = TOP + i * ROW
          const reach = SPINE / 2 + 22
          return (
            <div
              key={i}
              className="absolute flex items-center"
              style={{ left: left ? 0 : half + SPINE - reach, top: cy, width: half + reach, transform: 'translateY(-50%)', flexDirection: left ? 'row' : 'row-reverse', boxShadow: '0 0 0 0 transparent' }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-2.5" style={{ boxShadow: '0 10px 24px -16px rgba(16,32,58,0.4)' }}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: colors.surface2, color: colors.brand }}>
                  <Icon name={p.icon} size={19} />
                </span>
                <span className="l-nw text-[16px] leading-snug" style={{ color: colors.ink }}>
                  <Rich text={p.text} />
                </span>
              </div>
              <span aria-hidden className="shrink-0" style={{ width: SPINE / 2 - 20, height: 2, background: colors.line }} />
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

/* ================================================================== L_Table */

/**
 * L_Table (2026-11-17): the comparison tables of T03, T14-B, T21 and T21-B, drawn as the reference build draws
 * them, for this deck only (the shared engine's table is left as it is). Each cell stretches to its row's height,
 * so a cell's text sits at the top; `headIcon` sizes the column icons and grows the header tile and padding to fit.
 * Rows arrive one per press; the arriving row is tinted and swept once, then only `highlight` rows stay marked.
 */
type TCol = { label: string; icon?: string; weight?: number }
type TRow = { icon?: string; cells: string[] }
type TSpec = { size?: number; headIcon?: number; highlight?: number[]; highlightCols?: number[]; columns: TCol[]; rows: TRow[] }
const T_EASE = 'cubic-bezier(0.22,1,0.36,1)'

function RefTable({ t }: { t: TSpec }) {
  const { columns, rows } = t
  const size = t.size ?? 16
  const hi = t.highlight ?? []
  const hc = t.highlightCols ?? []
  const head = t.headIcon ?? 16
  const shown = useBuild(rows.length + 1, 560)
  const [fresh, setFresh] = useState(-1)
  useEffect(() => {
    if (STILL || shown <= 0) return setFresh(-1)
    setFresh(shown - 1)
    const id = window.setTimeout(() => setFresh(-1), 1100)
    return () => window.clearTimeout(id)
  }, [shown])
  const grid = columns.map((c) => `${c.weight ?? 1}fr`).join(' ')
  const pad = 'px-4 py-3'
  const B = colors.brand
  const headPad = Math.max(4, (28 + 24 - (head + 12)) / 2)
  return (
    <div
      className="overflow-hidden rounded-card border border-line"
      style={{
        background: 'radial-gradient(120% 90% at 10% 0%, #FFFFFF 0%, #FFFFFF 52%, #F6F9FE 100%)',
        boxShadow: [`0 10px 28px -16px ${B}66`, `0 2px 6px -4px ${colors.brandDeep}1f`, 'inset 0 1px 0 0 #FFFFFF'].join(', '),
      }}
    >
      <div
        className="grid items-center gap-x-2"
        style={{
          gridTemplateColumns: grid,
          background: ['radial-gradient(120% 140% at 12% 0%, #FFFFFFb3 0%, #FFFFFF00 64%)', `linear-gradient(135deg, ${B}0a 0%, ${B}14 100%)`].join(', '),
          boxShadow: `inset 0 -1px 0 0 ${B}29`,
        }}
      >
        {columns.map((c, i) => (
          <div
            key={i}
            className={`${pad} flex items-center gap-2 self-stretch font-heading font-bold`}
            style={{ color: B, fontSize: size, ...(head > 16 ? { paddingTop: headPad, paddingBottom: headPad } : {}), background: hc.includes(i) ? `${B}24` : undefined, boxShadow: hc.includes(i) ? `inset 0 3px 0 0 ${B}` : undefined }}
          >
            {c.icon && (
              <span aria-hidden className="grid shrink-0 place-items-center [&>svg]:h-[16px] [&>svg]:w-[16px]" style={{ width: head + 12, height: head + 12, borderRadius: head > 16 ? 10 : 8, background: colors.white, boxShadow: `inset 0 0 0 1.5px ${B}40` }}>
                <Icon name={c.icon} size={head} />
              </span>
            )}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <div className="block">
        {rows.map((row, r) => {
          const on = r < shown
          const isFresh = on && r === fresh
          return (
            <div
              key={r}
              className="relative grid items-center gap-x-2 overflow-hidden border-t border-line"
              style={{
                gridTemplateColumns: grid,
                background: hi.includes(r) ? 'linear-gradient(135deg, #FFF4E6 0%, #FFE6CC 100%)' : isFresh ? `linear-gradient(135deg, ${B}0c 0%, ${B}1c 100%)` : r % 2 ? '#FBFDFF' : undefined,
                boxShadow: isFresh || hi.includes(r) ? `inset 4px 0 0 0 ${colors.accent}` : undefined,
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateX(-18px)',
                transition: `opacity 300ms ${T_EASE}, transform 340ms ${T_EASE}, background 420ms ${T_EASE}, box-shadow 420ms ${T_EASE}`,
              }}
            >
              {isFresh && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[30%] cvx-sheen" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)' }} />}
              {row.cells.map((cell, c) => (
                <div
                  key={c}
                  className={`${pad} self-stretch leading-snug ${c === 0 || hc.includes(c) ? 'font-semibold' : ''}`}
                  style={{ fontSize: size, color: c === 0 ? colors.ink : hc.includes(c) ? colors.brandDark : colors.body, background: hc.includes(c) ? `${B}12` : undefined, display: hc.includes(c) ? 'flex' : undefined, alignItems: 'center' }}
                >
                  {c === 0 && row.icon ? (
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[9px] [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ background: isFresh ? colors.brand : colors.surface2, color: isFresh ? colors.white : colors.brand, transition: `all 420ms ${T_EASE}` }}>
                        <Icon name={row.icon} size={18} />
                      </span>
                      <span className="min-w-0">
                        <Rich text={cell} />
                      </span>
                    </span>
                  ) : (
                    <Rich text={cell} />
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function L_Table({ id, kicker, title, lead, table, lesson }: { id: string; kicker: string; title: string; lead?: string; table: TSpec; lesson: string }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <Rich text={lead} /> : undefined} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <RefTable t={table} />
      </div>
    </Card>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {}

export const slides = {
  L_Shot: L_Shot as unknown as (p: Record<string, unknown>) => ReactNode,
  L_Steps: L_Steps as unknown as (p: Record<string, unknown>) => ReactNode,
  L_Table: L_Table as unknown as (p: Record<string, unknown>) => ReactNode,
}

export const css = `.l-shot img { image-rendering: auto; } .l-nw code { white-space: nowrap; }`
