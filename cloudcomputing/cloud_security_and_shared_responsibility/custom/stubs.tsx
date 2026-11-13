import type { ReactNode } from 'react'
/** Placeholders so the deck renders while a builder's figure is missing. Every name here is replaced by a/b/c/h/i/j. */
const Stub = (name: string) => () => (
  <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', border: '2px dashed #c9d3e6', borderRadius: 14, color: '#8a97b3', fontSize: 14 }}>{name}</div>
)
export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  A_T01: Stub('A_T01'),
  A_T03: Stub('A_T03'),
  A_T04: Stub('A_T04'),
  A_T05: Stub('A_T05'),
  A_T05B: Stub('A_T05B'),
  A_T06: Stub('A_T06'),
  B_STACK: Stub('B_STACK'),
  B_T07: Stub('B_T07'),
  B_T12: Stub('B_T12'),
  B_T14: Stub('B_T14'),
  B_T15: Stub('B_T15'),
  C_T16: Stub('C_T16'),
  C_T17: Stub('C_T17'),
  C_T18: Stub('C_T18'),
  C_T19: Stub('C_T19'),
  C_T21: Stub('C_T21'),
  H_T01Concept: Stub('H_T01Concept'),
  H_T01Everyday: Stub('H_T01Everyday'),
  J_T04Concept: Stub('J_T04Concept'),
  J_T04Everyday: Stub('J_T04Everyday'),
  I_T16Concept: Stub('I_T16Concept'),
  I_T16Everyday: Stub('I_T16Everyday'),
}
