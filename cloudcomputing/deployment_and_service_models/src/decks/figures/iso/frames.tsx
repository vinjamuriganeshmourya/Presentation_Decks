import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { DataTable, type TableColumn, type TableRow } from '@/ui'
import { Arrow, BOX_W, Card, Label, LeadLines, Rail, Stage } from '../scene'
import { TILE_SKIN } from '../card'

/**
 * THE SLIDE FRAMES of this deck, every content slide is one of these. All sit
 * on session 1's `Card` (the kit header, the lead and the body as one centred
 * block: the user's "gap on top of the content" point), with a 1110px body.
 *
 *   PointsFigure   the TR's bullets on the left (18px rail, 452px), the figure
 *                  on the right (a 634px stage); the shape of most TR slides
 *   FigureOnly     one stage across the body, for a TR diagram with no bullets
 *   IsoAnalogy     the everyday scene, SAME IDEA, the cloud scene, the claim
 *   Tiles          three or four raised tiles, a scene on each, title and line
 *   TableCard      the kit table, the TR's heads and cells
 */

export const POINTS_W = 452
export const GAP = 24
export const FIG_W = BOX_W - POINTS_W - GAP
export const FIG_H = 380

/** A lead with one or two sentences, one line each (content rule 36). */
export function lead(s: string | string[]): ReactNode {
  return Array.isArray(s) ? <LeadLines lines={s} /> : s
}

/** The TR's bullets as session 1's rail: every row shown, none lit as current. */
export function Points({ items, width = POINTS_W, size = 18, gap = 10 }: { items: ReactNode[]; width?: number; size?: number; gap?: number }) {
  return <Rail items={items.map((text) => ({ text, at: 0 }))} beat={99} width={width} size={size} gap={gap} />
}

export function PointsFigure({ id, kicker, title, lead: l, lesson, points, figure, figH = FIG_H, pointsW = POINTS_W, pointSize = 18 }: { id: string; kicker: string; title: string; lead?: string | string[]; lesson: string; points: ReactNode[]; figure: ReactNode; figH?: number; pointsW?: number; pointSize?: number }) {
  const figW = BOX_W - pointsW - GAP
  return (
    <Card id={id} kicker={kicker} title={title} lead={l ? lead(l) : undefined} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: GAP }}>
        <Points items={points} width={pointsW} size={pointSize} />
        <Stage w={figW} h={figH} active={false}>
          {figure}
        </Stage>
      </div>
    </Card>
  )
}

export function FigureOnly({ id, kicker, title, lead: l, lesson, figure, children, h = 380, w = BOX_W }: { id: string; kicker: string; title: string; lead?: string | string[]; lesson: string; figure?: ReactNode; children?: ReactNode; h?: number; w?: number }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={l ? lead(l) : undefined} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <Stage w={w} h={h} active={false}>
          {figure ?? children}
        </Stage>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ the analogy frame */

export const AN_W = 470
export const AN_H = 300
export const AN_MID = BOX_W - AN_W * 2

/**
 * The reference's analogy grammar, redesigned (the user, 2026-10-23): two
 * isometric stages, the everyday scene and the cloud scene, each a short
 * self-running loop whose motion is the analogy; `SAME IDEA` between them;
 * the two labels under; the claim in a pill. Every string is the reference's.
 * `text` (2026-10-27, the TR comparison): the TR's own analogy sentence as the
 * lead, the spaced dash turned into a comma (content rule 1); a slide that
 * carries it drops the invented claim pill.
 */
export function IsoAnalogy({ id, kicker, lesson, title = 'Analogy', text, everyday, cloud, claim }: { id: string; kicker: string; lesson: string; title?: string; text?: string; everyday: { label: string; scene: ReactNode }; cloud: { label: string; scene: ReactNode }; claim?: string }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={text} lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W }}>
        <div className="flex flex-col items-center gap-2.5" style={{ width: AN_W }}>
          <Stage w={AN_W} h={AN_H} active={false}>
            <div role="img" aria-label={everyday.label} className="absolute inset-0">
              {everyday.scene}
            </div>
          </Stage>
          <Label strong size={16}>
            {everyday.label}
          </Label>
        </div>
        <div className="relative flex flex-col items-center justify-center" style={{ width: AN_MID, height: AN_H }}>
          <span className="font-heading text-[14px] font-semibold tracking-[0.08em]" style={{ color: colors.brandDark }}>
            SAME IDEA
          </span>
          <div className="relative mt-2" style={{ width: 120, height: 20 }}>
            <Arrow x1={10} y1={10} x2={110} y2={10} on dashed />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5" style={{ width: AN_W }}>
          <Stage w={AN_W} h={AN_H} active={false}>
            <div role="img" aria-label={cloud.label} className="absolute inset-0">
              {cloud.scene}
            </div>
          </Stage>
          <Label strong size={16} tone="brand">
            {cloud.label}
          </Label>
        </div>
      </div>
      {claim && (
        <div className="mx-auto mt-3 w-fit rounded-pill px-6 py-2 font-heading text-[20px] font-semibold" style={{ background: colors.brand, color: colors.white, boxShadow: `0 10px 24px -14px ${colors.brand}` }}>
          {claim}
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ tiles and tables */

/** A row of raised tiles: a scene on top of each, a title and one line under it. */
export function Tiles({ id, kicker, title, lead: l, lesson, tiles, sceneH = 150, h = 300 }: { id: string; kicker: string; title: string; lead?: string | string[]; lesson: string; tiles: { title: string; sub: string; scene: ReactNode }[]; sceneH?: number; h?: number }) {
  const gap = 20
  const w = Math.floor((BOX_W - gap * (tiles.length - 1)) / tiles.length)
  return (
    <Card id={id} kicker={kicker} title={title} lead={l ? lead(l) : undefined} lesson={lesson}>
      <div className="flex items-stretch" style={{ width: BOX_W, gap }}>
        {tiles.map((t) => (
          <Stage key={t.title} w={w} h={h} active={false}>
            <div className="absolute inset-x-0 top-0" style={{ height: sceneH }}>
              {t.scene}
            </div>
            <div className="absolute inset-x-0 flex flex-col items-center gap-1.5 px-5 text-center" style={{ top: sceneH + 6 }}>
              <span className="font-heading text-[19px] font-semibold leading-tight" style={{ color: colors.ink }}>
                {t.title}
              </span>
              <span className="text-[16px] leading-snug" style={{ color: colors.muted }}>
                {t.sub}
              </span>
            </div>
          </Stage>
        ))}
      </div>
    </Card>
  )
}

/** The kit table on a content slide, the TR's heads and cells; `above` for a row of marks over it. */
export function TableCard({ id, kicker, title, lead: l, lesson, columns, rows, above, compact = false }: { id: string; kicker: string; title: string; lead?: string | string[]; lesson: string; columns: TableColumn[]; rows: TableRow[]; above?: ReactNode; compact?: boolean }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={l ? lead(l) : undefined} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        {above && <div className="mb-4">{above}</div>}
        <DataTable columns={columns} rows={rows} compact={compact} />
      </div>
    </Card>
  )
}

/** A word in a cell, as a small pill in the owner's colour (the TR table's `Customer` / `Provider`). */
export function Owner({ who, tint }: { who: 'Customer' | 'Provider'; tint?: number }) {
  const bg = who === 'Provider' ? `rgba(45,99,251,${0.14 + (tint ?? 0) * 0.14})` : 'rgba(245,166,35,0.18)'
  const fg = who === 'Provider' ? colors.brandDark : '#9A5B00'
  return (
    <span className="inline-block rounded-md px-2 py-0.5 font-heading text-[15px] font-semibold" style={{ background: bg, color: fg }}>
      {who}
    </span>
  )
}

/** A shade dot before a cell's words: pale to deep along a scale (slide 16's `Owned by`). */
export function Dot({ k, children }: { k: number; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: colors.brand, opacity: 0.25 + k * 0.75 }} />
      <span>{children}</span>
    </span>
  )
}

/** A provider's mark (an `<img>`), at a height, with a keyword under it when given. */
export function Mark({ src, alt, h = 28, keyword, style }: { src: string; alt: string; h?: number; keyword?: string; style?: CSSProperties }) {
  return (
    <span className="inline-flex flex-col items-center gap-1.5" style={style}>
      <img src={src} alt={alt} draggable={false} className="w-auto select-none" style={{ height: h }} />
      {keyword && (
        <span className="font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>
          {keyword}
        </span>
      )}
    </span>
  )
}

export const MARKS = {
  aws: { src: '/assets/companies/aws.png', alt: 'AWS' },
  azure: { src: '/assets/companies/azure.png', alt: 'Azure' },
  gcp: { src: '/assets/companies/google-cloud.png', alt: 'Google Cloud' },
} as const

/** A small raised chip row inside a stage (a legend, a keyword row). */
export function Chips({ items, style }: { items: { text: string; color?: string }[]; style?: CSSProperties }) {
  return (
    <div className="flex items-center gap-3" style={style}>
      {items.map((it) => (
        <span key={it.text} className="inline-flex items-center gap-2 rounded-pill px-3 py-1 text-[15px] font-medium" style={{ ...TILE_SKIN, color: colors.ink }}>
          {it.color && <span aria-hidden className="inline-block h-3 w-3 rounded-[3px]" style={{ background: it.color }} />}
          {it.text}
        </span>
      ))}
    </div>
  )
}
