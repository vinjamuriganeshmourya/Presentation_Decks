import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'

/**
 * A specimen of code set large, in the mono face, on its own badge.
 *
 * For a value, an expression or a literal the slide is ABOUT: `"Cricket"`,
 * `5 * 2 + 3 * 4`, `(5 * 2) + (3 * 4)`. Not a file (`CodeBlock`), not a run
 * (`CodeOutput`), not a grammar (`SyntaxBreakdown`): one thing, shown big.
 *
 * THE PADDING IS ON THE WRAPPER, NOT ON THE TEXT.
 *
 * `align-check.mjs` divides a text element's height by its line-height to spot
 * a token that wrapped. A `Chip` with `py-3` and 24px type measures as two lines
 * for the single character `2`, and fourteen slides across Python sessions 3
 * and 4 were reported WRAPPED for exactly that. The text here sits in an inner
 * span that hugs its own line, so the check sees one line.
 */
export function MonoBadge({
  children,
  size = 'md',
  solid = false,
  className = '',
}: {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Brand-filled, white type: the answer, the result, the one that matters. */
  solid?: boolean
  className?: string
}) {
  const text = { sm: 'text-[20px]', md: 'text-[24px]', lg: 'text-[30px]' }[size]
  const pad = { sm: 'px-4 py-2', md: 'px-5 py-2.5', lg: 'px-7 py-3' }[size]
  return (
    <span
      className={`inline-flex items-center rounded-card shadow-card-soft ${pad} ${
        solid ? '' : 'border border-line bg-white'
      } ${className}`}
      style={solid ? { background: colors.brand } : undefined}
    >
      <span className={`font-mono font-semibold leading-none ${text}`} style={{ color: solid ? colors.white : colors.ink }}>
        {children}
      </span>
    </span>
  )
}
