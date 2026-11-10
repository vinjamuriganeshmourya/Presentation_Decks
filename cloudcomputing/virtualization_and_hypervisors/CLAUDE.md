# Cloud Computing · "Virtualization & Hypervisors"

The session deck for the Virtualization & Hypervisors session. Read this before editing it. The kit rules
are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Plan:** `../session_plans/virtualization_and_hypervisors/plan.md` (signed off on the user's word,
  2026-10-27: the request is the spec).
- **Source:** `Reference ppt's/virtualization-and-hypervisors 2.html`, a kit-built deck of 62 frames. CONTENT
  ONLY, verbatim (the user: no phrase changed, no sentence shortened, no word replaced, nothing added). Its own
  notes are the speaker notes (`src/decks/vhNotes.ts`, generated; they quote the TR speaker notes and Visual
  Guidance). The reference names its 18 VirtualBox captures but does not carry them: they are the TR PDF's own
  images (pages 17-26), in `src/decks/figures/vh/shots/` and the full set in `../workflow/captures/virtualbox/`.
  Capture 1 is cropped to the CPU details panel, as the reference describes.
- **TR doc:** `Reference ppt's/3. Virtualization & Hypervisors.pdf`, comparison only. The gap list is
  `../workflow/reviews/virtualization_and_hypervisors.tr-comparison.md`.
- **Deck file:** `src/decks/vhDeck.tsx`, 63 slides (Thank you and All the Best are two frames). Port 5273
  (`npx vite --port 5273 --strictPort`).
- **Copied from the AWS deck** (course rule R2): the cloud player (no builds, smooth transitions, hidden
  step/slide switch, presenter and student views) and the slide comments exactly as there (`src/deck/comments.ts`,
  `CommentsPanel.tsx`, `Deck.tsx`, `DeckControls.tsx`, unchanged; storage key `nxtwave.deck.<slug>.comments`).
  Earlier sessions' figure files came with the copy and are not imported; they stay on disk.
- **Saves into its own file** (generate-slides §2d, the user's rule of 2026-10-27, which came after the
  copy): `src/deck/` and `vite.config.ts` re-copied from the AWS deck the same day (`fileSave.ts`,
  `FileSaveBadge.tsx`, edits keyed by original words, undo/redo, `/__deck/edits` → `src/decks/slideEdits.ts`,
  empty here). Check: `node file-save-check.mjs` → FILE SAVE OK.

## Figures (`src/decks/figures/vh/`)

Session 2's current style (session 1's 3D finish): `Card`, `PointsFigure`/`FigureOnly`/`TableCard`/`Tiles`
(`../iso/frames.tsx`), `Icon3D` and the clay objects (`../d3/kit.tsx`), one self-running loop per figure.

- `frames.tsx`: `MARK`/`Logo` (the reference's embedded vendor and AWS marks, imported so the single file inlines
  them; also filed in `slide-kit/assets/companies/` and `slide-kit/assets/aws/`), `PairAnalogy` + `Marker` (the
  reference's analogy grammar, three pairs lit in turn on one clock the scenes read), `Shot`/`Shots`/`ImportantNote`.
- One file per section, built by one worker each after the shared layer: `basics-a.tsx` (6-10), `basics-b.tsx`
  (11-17), `hyper.tsx` (19-24), `tech.tsx` (27-35), `anatomy.tsx` (37-41), `walk.tsx` (42-51), `life.tsx` (53-57).

## Decisions

1. Agenda, Key Takeaways and the recap show the five titles only (course lesson 4); the TR's sub-lines are in
   the gap list.
2. Breakers carry the title only. Two quiz frames where the reference has them. The feedback slide was
   removed on 2026-10-30 (content rule 41 retired: version 0, the user will specify version 1); 62 slides,
   closing on Next Session, Thank You, All the Best. `feedback-check.mjs` reports no slide, as expected.
3. **Agenda and quiz are the version 1 frames (user, 2026-10-30):** agenda1 `AgendaColumns` (4, titles only)
   and quiz1 `QuizCard "Quiz Time!"` (25, 58), from session 4's `figures/variants.tsx` with
   `public/assets/quiz/quiz-cube.png`. They were first built beside the version 0 frames (the kit `AgendaSlide`,
   `ClassroomQuiz` twice) as review pairs; later the same day the user had the version 0 frames deleted
   (`agenda`, `quiz-mid`, `quiz-close`). 63 slides. `agenda-check.mjs` (AGENDA_SLIDE=4) now meets the column
   layout, not the kit agenda.
4. **The recap shows the presenter** (course rule R6, 2026-10-30): `Takeaways art="/assets/takeaways/presenter.png"`
   on `recap`, the file from session 2; the `art` prop ported into `figures/closing.tsx` for it.
