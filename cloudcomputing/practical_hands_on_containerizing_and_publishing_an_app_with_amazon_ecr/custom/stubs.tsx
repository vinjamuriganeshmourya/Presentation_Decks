import type { ReactNode } from 'react'
/** Placeholders so the deck renders while a builder's figure is missing. Every name here is replaced by a builder file. */
const Stub = (name: string) => () => (
  <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', border: '2px dashed #c9d3e6', borderRadius: 14, color: '#8a97b3', fontSize: 14 }}>{name}</div>
)
export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  K_P26: Stub('K_P26'),
  K_P27: Stub('K_P27'),
  K_P30: Stub('K_P30'),
}
