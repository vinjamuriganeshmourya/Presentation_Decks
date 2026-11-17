import { useEffect, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { STILL, useBuild } from '../scene'

/**
 * THE TABLE, AS A VISUAL BUILD (user, 2026-11-03: "convert text-only tables into
 * visual builds with icons and micro-animations, keeping all table data
 * unchanged"; it applies to every table slide).
 *
 * The kit table's look (`DataTable`: the lit panel, the tinted header, the
 * banded rows) with three things added and nothing taken away:
 *
 *   header icons   a column names a side (a VM, a container, a tool); its icon
 *                  sits before the head, the head's words unchanged
 *   row icons      each row's subject drawn in a tile before its first cell, the
 *                  icon carrying a micro-animation that says what the row is
 *                  about (a gauge needle sweeps on a measure, a gear turns on a
 *                  process, a lock closes on isolation)
 *   the build      the header lands with the frame, then the rows arrive one at
 *                  a time, every column of a row together (the spec's "a row
 *                  reveals all its columns together"); the row that just arrived
 *                  is lit with an accent edge and a sheen that crosses it once.
 *                  Auto animation off, one row per press.
 *
 * Cells are passed in as they were: the words are the spec's.
 */

export type VCol = { label: ReactNode; icon?: ReactNode; weight?: number }
export type VRow = { icon?: ReactNode; cells: ReactNode[] }

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

export function VisualTable({ columns, rows, compact = false, ms = 560, className = '', size = 16, shown: given, highlight = [] }: { columns: VCol[]; rows: VRow[]; compact?: boolean; ms?: number; className?: string; size?: number; /** rows shown, when the slide drives the build itself (a figure beside the table follows the same press) */ shown?: number; /** rows (0-based) the card marks in the template's orange, whatever the build */ highlight?: number[] }) {
  const own = useBuild(given === undefined ? rows.length + 1 : 0, ms)
  const shown = given ?? own
  /*
    THE ARRIVING ROW IS LIT ONLY WHILE IT ARRIVES (user, 2026-11-04, 5.md global rule 3: "never highlight the last
    row automatically"): the tint, the orange bar and the sheen used to stay on whichever row came in last, so every
    finished table kept its last row marked. Now they clear ~1.1s after the row lands; only `highlight` rows stay.
  */
  const [fresh, setFresh] = useState(-1)
  useEffect(() => {
    if (STILL || shown <= 0) return setFresh(-1)
    setFresh(shown - 1)
    const t = window.setTimeout(() => setFresh(-1), 1100)
    return () => window.clearTimeout(t)
  }, [shown])
  const grid = columns.map((c) => `${c.weight ?? 1}fr`).join(' ')
  const pad = compact ? 'px-4 py-2' : 'px-4 py-3'
  const color = colors.brand
  return (
    <div
      className={`overflow-hidden rounded-card border border-line ${className}`}
      style={{
        background: 'radial-gradient(120% 90% at 10% 0%, #FFFFFF 0%, #FFFFFF 52%, #F6F9FE 100%)',
        boxShadow: [`0 10px 28px -16px ${color}66`, `0 2px 6px -4px ${colors.brandDeep}1f`, 'inset 0 1px 0 0 #FFFFFF'].join(', '),
      }}
    >
      <div
        className="grid items-center gap-x-2"
        style={{
          gridTemplateColumns: grid,
          background: ['radial-gradient(120% 140% at 12% 0%, #FFFFFFb3 0%, #FFFFFF00 64%)', `linear-gradient(135deg, ${color}0a 0%, ${color}14 100%)`].join(', '),
          boxShadow: `inset 0 -1px 0 0 ${color}29`,
        }}
      >
        {columns.map((c, i) => (
          <div key={i} className={`${pad} flex items-center gap-2 font-heading font-bold`} style={{ color, fontSize: size }}>
            {c.icon && (
              <span aria-hidden className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-[8px] [&>svg]:h-[16px] [&>svg]:w-[16px]" style={{ background: colors.white, boxShadow: `inset 0 0 0 1.5px ${color}40` }}>
                {c.icon}
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
                background: highlight.includes(r) ? 'linear-gradient(135deg, #FFF4E6 0%, #FFE6CC 100%)' : isFresh ? `linear-gradient(135deg, ${color}0c 0%, ${color}1c 100%)` : r % 2 ? '#FBFDFF' : undefined,
                boxShadow: isFresh || highlight.includes(r) ? `inset 4px 0 0 0 ${colors.accent}` : undefined,
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateX(-18px)',
                transition: `opacity 300ms ${EASE}, transform 340ms ${EASE}, background 420ms ${EASE}, box-shadow 420ms ${EASE}`,
              }}
            >
              {/* the sheen: a soft band that crosses the row once as it arrives */}
              {isFresh && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-[30%] cvx-sheen"
                  style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)' }}
                />
              )}
              {row.cells.map((cell, c) => (
                <div key={c} className={`${pad} leading-snug ${c === 0 ? 'font-semibold' : ''}`} style={{ fontSize: size, color: c === 0 ? colors.ink : colors.body }}>
                  {c === 0 && row.icon ? (
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[9px] [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ background: isFresh ? colors.brand : colors.surface2, color: isFresh ? colors.white : colors.brand, transition: `all 420ms ${EASE}` }}>
                        {row.icon}
                      </span>
                      <span className="min-w-0">{cell}</span>
                    </span>
                  ) : (
                    cell
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

/** The sheen's one crossing, appended to the deck's CSS with the rest of `FX_CSS`. */
export const VTABLE_CSS = `
@keyframes cvx-sheen { 0% { transform: translateX(-110%); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateX(380%); opacity: 0 } }
.cvx-sheen { animation: cvx-sheen 1.1s cubic-bezier(0.45,0,0.55,1) 1 both; }
.cc-still .cvx-sheen, .deck-thumb .cvx-sheen { display: none; }
@media (prefers-reduced-motion: reduce) { .cvx-sheen { display: none; } }
`
