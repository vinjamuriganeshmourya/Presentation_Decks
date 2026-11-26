/**
 * THE FOUNDATIONS FIGURE SET: the shared pieces every Python-course deck from
 * session 16 to 31 carried in its own `src/decks/figures/` and copied forward,
 * folded into the kit from session 31 on the user's word (2026-10-14) so a new
 * deck starts with them instead of copying the previous deck. Sessions 16 to 31
 * keep their own copies untouched.
 *
 *   common        Panel, Boxes, the lead and narration lines, Group / Focus
 *   controls      PanelButton, StepControls, useVoteKeys (the step-wise buttons)
 *   motion        Press, Glow, Confetti
 *   keys          the spec's keys: ?nav=steps on first open, F, A, End
 *   autoplay      the per-slide autoplay switch's state
 *   pieces        the tiles and rows the trace pictures are built from
 *   Code          the code pane with blanks, marks and per-line trace states
 *   Phone         the phone mock
 *   ClassroomQuiz the deck's standard quiz frame (Python 21, LP card 17)
 *
 * Import by path (`@/ui/foundations/common`), the way the sessions did with
 * `./figures/common`; nothing here is re-exported from `@/ui`, so the names
 * cannot collide with the kit's own `Panel`, `Card` or `CodeBlock`. This
 * barrel is a convenience for the modules whose names do not overlap.
 */
export * from './common'
export * from './controls'
export * from './motion'
export * from './keys'
export * from './autoplay'
/* `pieces` re-exports names from `common`, so it is imported by path only. */
export * from './Code'
export * from './Phone'
export * from './ClassroomQuiz'
