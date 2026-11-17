import type { ReactNode } from 'react'

/**
 * THE CONTRACT FOR A COMPARISON FIGURE.
 *
 * Chosen in `slide-kit/comparison-lab`, where four candidates rendered the same
 * fixture and `SwapRows` won. That lab's `CLAUDE.md` records what the other three
 * were worse at, which is the part to read before changing the winner.
 *
 * WHAT A COMPARISON FIGURE IS FOR. Two systems that do the same job, where the
 * point is that one stands in for the other: a phone's speed dial and a
 * Makefile's targets, a Python function and a Makefile, a manual ritual and an
 * automated one.
 *
 * WHAT IT IS NOT FOR. A general table of differences. `DataTable` draws that, and
 * draws it better, because a table's rows are independent facts. Here every row
 * is a PAIRING, and the figure's whole job is to make the pairing legible as one
 * thing rather than as two cells that happen to be adjacent.
 *
 * NOR for two things that are PEERS. `SwapRows` draws the left side recessed and
 * the right side raised, which asserts that the right one stands in for the left.
 * Two alternatives being weighed against each other have no such direction, and
 * the figure would be claiming something untrue (content rule 8). Use `DataTable`
 * with identical row labels for that.
 */

export interface ComparePair {
  /** The familiar side, the thing the room already has. */
  from: ReactNode
  /** The thing being explained by it. */
  to: ReactNode
  /**
   * Renders both cells in monospace.
   *
   * `make_coffee()` and `make "up"` are things you type, and set as prose they
   * read as the names of ideas. `AnalogyMap` has no notion of this, which was one
   * of the four faults the lab existed to fix.
   */
  code?: boolean
  /** A short gloss under the pairing, where one earns its place. */
  note?: ReactNode
}

/**
 * NO EMPHASIS FIELD, AND THAT IS DELIBERATE.
 *
 * The lab's winning candidate carried a `key` flag that lit one pairing as "the
 * point", on the argument that there is always one and `AnalogyMap` made it look
 * like the first three. On the first deck to render it the instruction was the
 * opposite -- *"dont highlight any of the part"* -- so the flag is gone rather
 * than kept and ignored.
 *
 * That is `SlideHeader`'s lesson applied here: a prop still declared but no
 * longer honoured is one the next author passes in good faith, and it vanishes
 * with no error. If a deck ever needs one pairing emphasised, add it back
 * deliberately, and add it to the registry row at the same time.
 */
export interface CompareFigureProps {
  /** The familiar system. */
  leftLabel: string
  /** The system being explained. */
  rightLabel: string
  pairs: ComparePair[]
  /**
   * The claim the comparison makes, carried in the figure rather than only in
   * the slide's lead.
   *
   * `AnalogyMap` shows two column headings and no claim, so its argument lived
   * entirely in a lead the eye has already moved on from by the time it reaches
   * the rows.
   */
  caption?: ReactNode
  className?: string
}
