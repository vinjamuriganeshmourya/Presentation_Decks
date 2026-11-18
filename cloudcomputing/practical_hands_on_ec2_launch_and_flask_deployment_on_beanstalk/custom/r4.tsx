import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { motionHeld } from '@/motion/tokens'

/**
 * ROUND 4 SHARED HELPERS (user, 2026-11-10, Session 9 round 4: "Global changes").
 *
 * A4 looping highlight: an orange sequential highlight never stops on the last item. While the build is still
 * running, the highlight follows the step; once the build is complete (`done`), `useCycle` walks the items
 * first → last → first, one item every `periodMs`, forever. Held frames (?still, reduced motion, thumbnails)
 * return -1: nothing highlighted, nothing moving, the complete diagram shows.
 *
 *   const cyc = useCycle(5, step >= 5)
 *   const hot = (i) => cyc >= 0 ? cyc === i : step === i + 1   // during the build: follow the step
 *
 * A1 icon tag: a short, single-word Title Case tag under or beside an icon that would otherwise carry no text.
 */
export const CYCLE_MS = 1400

export function useCycle(n: number, done: boolean, periodMs = CYCLE_MS): number {
  const held = motionHeld(useInstant())
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), periodMs)
    return () => window.clearInterval(id)
  }, [n, done, held, periodMs])
  return done && !held ? i : -1
}

export const TAG_STYLE: CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 600,
  fontSize: 12,
  lineHeight: 1.15,
  letterSpacing: 0.1,
  color: colors.brandDeep,
  whiteSpace: 'nowrap',
  textAlign: 'center',
  pointerEvents: 'none',
}

/** a one-word tag, placed by the caller (absolute or in flow) */
export function IconTag({ children, style, size = 12, color }: { children: ReactNode; style?: CSSProperties; size?: number; color?: string }) {
  return <span style={{ ...TAG_STYLE, fontSize: size, ...(color ? { color } : null), ...style }}>{children}</span>
}

/** an icon with its tag beneath, centred on one column */
export function Tagged({ children, tag, gap = 4, size = 12, style }: { children: ReactNode; tag: ReactNode; gap?: number; size?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap, ...style }}>
      {children}
      <IconTag size={size}>{tag}</IconTag>
    </span>
  )
}
