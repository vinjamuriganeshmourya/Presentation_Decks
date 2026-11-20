import type { ReactNode } from 'react'
/** Placeholders so the deck renders while a builder's figure is missing. Every name here is replaced by a/b/c/d/e/h/i/j. */
const Stub = (name: string) => () => (
  <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', border: '2px dashed #c9d3e6', borderRadius: 14, color: '#8a97b3', fontSize: 14 }}>{name}</div>
)
export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  A_T01: Stub('A_T01'),
  A_T02B: Stub('A_T02B'),
  A_T03: Stub('A_T03'),
  A_T04: Stub('A_T04'),
  A_T05: Stub('A_T05'),
  A_T06: Stub('A_T06'),
  B_T08: Stub('B_T08'),
  B_T09: Stub('B_T09'),
  B_T10: Stub('B_T10'),
  B_T11: Stub('B_T11'),
  C_T13: Stub('C_T13'),
  C_T14B: Stub('C_T14B'),
  C_T15: Stub('C_T15'),
  D_T16: Stub('D_T16'),
  D_T17: Stub('D_T17'),
  D_T19: Stub('D_T19'),
  D_T20: Stub('D_T20'),
  D_T21: Stub('D_T21'),
  H_T04Concept: Stub('H_T04Concept'),
  H_T04Everyday: Stub('H_T04Everyday'),
  H_T05Concept: Stub('H_T05Concept'),
  H_T05Everyday: Stub('H_T05Everyday'),
  I_T11Concept: Stub('I_T11Concept'),
  I_T11Everyday: Stub('I_T11Everyday'),
  I_T13Concept: Stub('I_T13Concept'),
  I_T13Everyday: Stub('I_T13Everyday'),
  J_T17Concept: Stub('J_T17Concept'),
  J_T17Everyday: Stub('J_T17Everyday'),
  J_T19Concept: Stub('J_T19Concept'),
  J_T19Everyday: Stub('J_T19Everyday'),
}
