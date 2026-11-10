import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { accentByTone, type Tone } from '@/design/tokens'
import { iconByName, type IconName } from './icons'

/* ------------------------------------------------------------------ */
/* BulletList — staggered, iconed list                                 */
/* ------------------------------------------------------------------ */

export interface BulletItem {
  text: ReactNode
  sub?: ReactNode
  icon?: IconName
  tone?: Tone
}

export function BulletList({
  items,
  tone = 'brand',
  marker = 'check',
  className = '',
  onDark = false,
  immediate = false,
}: {
  items: (BulletItem | string)[]
  tone?: Tone
  marker?: IconName
  className?: string
  onDark?: boolean
  /**
   * Stagger the items in on slide entry instead of gating each one behind a
   * click.
   *
   * Needed whenever the list sits beside a supporting visual: with click-gated
   * items the text consumed every build step and the visual could only appear
   * *after* the last bullet, which reads as two sequential slides. In
   * `immediate` mode the list and the visual animate at the same time, so the
   * pair lands together.
   */
  immediate?: boolean
}) {
  const Item = immediate ? Reveal : Step
  const Wrapper = immediate ? RevealGroup : 'ul'
  return (
    <Wrapper
      {...(immediate ? ({ as: 'ul', stagger: 0.08 } as const) : {})}
      className={`space-y-4 ${className}`}
    >
      {items.map((raw, i) => {
        const item: BulletItem = typeof raw === 'string' ? { text: raw } : raw
        const t = item.tone ?? tone
        const color = accentByTone[t]
        const Icon = iconByName[item.icon ?? marker]
        return (
          <Item as="li" dir="up" key={i} className="flex items-start gap-4">
            {/*
              MARKER CHIP.

              On a dark ground the marker goes white on a white wash, not the
              tone colour on a tone wash. A brand-blue icon at 10% blue behind it
              is legible on a white slide and nearly invisible on the navy stage,
              which is what happened the moment the practice slide's markers
              moved off the old orange: orange only worked there by accident, by
              being the one hue that was NOT the background.
            */}
            <span
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
              style={
                onDark
                  ? { background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }
                  : { background: `${color}1a`, color }
              }
            >
              <Icon width={18} height={18} />
            </span>
            <span className="pt-0.5">
              <span
                className={`block text-body-lg font-medium ${onDark ? 'text-white' : 'text-ink'}`}
              >
                {item.text}
              </span>
              {item.sub && (
                <span className={`mt-0.5 block text-body-sm ${onDark ? 'text-white/70' : 'text-body'}`}>
                  {item.sub}
                </span>
              )}
            </span>
          </Item>
        )
      })}
    </Wrapper>
  )
}

/* ------------------------------------------------------------------ */
/* Card — surface tile with optional icon/title                        */
/* ------------------------------------------------------------------ */

export function Card({
  icon,
  title,
  children,
  tone = 'brand',
  className = '',
}: {
  icon?: IconName
  title?: ReactNode
  children?: ReactNode
  tone?: Tone
  className?: string
}) {
  const color = accentByTone[tone]
  const Icon = icon ? iconByName[icon] : null
  return (
    <div
      className={`rounded-card border border-line bg-white p-6 shadow-card-soft ${className}`}
    >
      {Icon && (
        <span
          className="mb-4 grid h-12 w-12 place-items-center rounded-2xl"
          style={{ background: `${color}14`, color }}
        >
          <Icon width={24} height={24} />
        </span>
      )}
      {title && <h3 className="mb-1.5 font-heading text-xl font-bold text-ink">{title}</h3>}
      {children && <div className="text-body">{children}</div>}
    </div>
  )
}

/** Grid of cards that reveals with stagger. */
export function CardGrid({
  cols = 3,
  className = '',
  children,
}: {
  cols?: 2 | 3 | 4
  className?: string
  children: ReactNode
}) {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols]
  // Cards in a row must be the SAME height. CSS Grid stretches the row's items,
  // but each card here sits inside a `Step` wrapper, so without `h-full` on both
  // the wrapper and the card the wrapper stretches while the card shrinks to its
  // own text. That is what makes a two-card row look lopsided when one card has
  // an extra line. `items-stretch` is the grid default and is stated explicitly
  // so it does not get lost in a future edit.
  return (
    <div className={`grid ${gridCols} items-stretch gap-5 ${className}`}>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <Step dir="up" key={i} className="h-full [&>*]:h-full">
              {c}
            </Step>
          ))
        : children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* StatTile — big metric                                               */
/* ------------------------------------------------------------------ */

export function StatTile({
  value,
  label,
  tone = 'brand',
}: {
  value: ReactNode
  label: ReactNode
  tone?: Tone
}) {
  const color = accentByTone[tone]
  return (
    <div className="rounded-card border border-line bg-white p-6 text-center shadow-card-soft">
      <div className="font-heading text-5xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-body-sm font-medium text-body">{label}</div>
    </div>
  )
}
