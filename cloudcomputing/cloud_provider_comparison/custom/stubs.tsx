import type { ReactNode } from 'react'
/** Placeholders so the deck renders while a builder's figure is missing. Every name here is replaced by a/b/c/h/i/j. */
const Stub = (name: string) => () => (
  <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', border: '2px dashed #c9d3e6', borderRadius: 14, color: '#8a97b3', fontSize: 14 }}>{name}</div>
)
export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  A_T01: Stub('A_T01'),
  A_T01D: Stub('A_T01D'),
  A_T02B: Stub('A_T02B'),
  A_T03: Stub('A_T03'),
  H_T03Everyday: Stub('H_T03Everyday'),
  H_T03Concept: Stub('H_T03Concept'),
  A_T05: Stub('A_T05'),
  A_T06: Stub('A_T06'),
  A_T07: Stub('A_T07'),
  H_T07Everyday: Stub('H_T07Everyday'),
  H_T07Concept: Stub('H_T07Concept'),
  A_T10B: Stub('A_T10B'),
  B_T13: Stub('B_T13'),
  J_T13Everyday: Stub('J_T13Everyday'),
  J_T13Concept: Stub('J_T13Concept'),
  B_T15B: Stub('B_T15B'),
  B_T16: Stub('B_T16'),
  C_T17: Stub('C_T17'),
  C_T18: Stub('C_T18'),
  C_T21: Stub('C_T21'),
  C_T22: Stub('C_T22'),
  C_T23: Stub('C_T23'),
  C_T23B: Stub('C_T23B'),
}
