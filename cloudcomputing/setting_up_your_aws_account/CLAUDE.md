# Cloud Computing · "Setting Up Your AWS Account" (session 3)

The session deck for the third cloud computing session. Read this before editing it. The kit rules
are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Plan:** `../session_plans/setting_up_your_aws_account/plan.md` (signed off on the user's word,
  2026-10-26: the request is the spec).
- **Source:** `Reference ppt's/setting-up-your-aws-account 1.html`, a kit-built deck of 34 frames with no
  source project anywhere in the repo. Its content and order, verbatim. It was rendered and dumped
  first: every frame's text, and for each of the 18 screenshot walkthroughs, the screenshot itself
  (extracted from the CSS background) and each step's crop and ring (scratchpad `ref3/` of that day).
- **Deck file:** `src/decks/awsDeck.tsx`, 31 slides (34 until 2026-10-27). Port 5272 (`npx vite --port 5272 --strictPort`).
- **Copied from session 2** (course rule R2), so it carries the cloud player (no builds, smooth
  transitions, hidden step/slide switch, presenter and student views, the comments trial). Session 2's
  figure files came with the copy and are NOT imported by this deck; they stay on disk.

## Figures

- `src/decks/figures/aws/walk.tsx`: `WalkSlide`, the browser card (dots, URL, screenshot) beside the step
  chip, the numbered steps, the step callouts (stacked, the current one amber) and the tip (`Callout`).
  The states run on a clock (`useCycle`, 3.2s each, held on the LAST state on harness URLs); the zoom is
  one transform on the screenshot (0.9s, house curve), the rings cross-fade. Modes: `walk`, `full` (whole
  screenshot, only the ring moves), `static` (first state only).
- `src/decks/figures/aws/walks.ts`: GENERATED from the reference dump; every string verbatim, every crop
  and ring the reference's own numbers. The user's per-slide changes (9, 14, 17, 18, 22) are applied in
  the generator, not by hand: regenerate rather than edit if the reference changes.
- `src/decks/figures/aws/before.tsx`: slides 5 (What You Need), 6 (two tables), 25 (StatusList).
- `src/decks/figures/aws/img/`: the 18 screenshots, imported so the single-file build inlines them.

## The user's changes (2026-10-26)

1. No Autoplay or Next button anywhere; every slide plays by itself; subtle motion; removals reflow.
2. Slide 6: the one table is two side by side, equal width and height. Regrouped 2026-10-27: Aadhaar +
   PAN (the ID proofs) and UPI + Card (the payment methods).
3. Slide 9: the "Continue" callout and the "Use your own email" tip removed.
4. Slide 14: the first state only (whole screenshot, three steps), static, no later callouts.
5. Slides 17, 18: the whole screenshot throughout; the ring moves between fields, no pan or zoom.
6. Slide 22: the "Credit or debit card / Your bank sends an OTP" callout removed.

## The user's changes (2026-10-27)

1. **Text edits are saved to source.** The Edit button kept edits in `localStorage` only (one origin's
   memory, keyed by element position), so the built file, another port or machine never saw them and a
   re-rendering figure put React's words back. Now: `src/decks/slideEdits.ts` holds them, keyed by the
   element's original words; under `npm run dev` every change is written there through the
   `/__deck/edits` endpoint in `vite.config.ts`, and `npm run build:html` bakes them in. A
   MutationObserver in `EditLayer.tsx` re-applies them after any re-render. Ctrl+Z, Ctrl+Y /
   Ctrl+Shift+Z undo and redo edits (`presenter.ts`). A built file cannot write its source: edits made
   there stay in that browser and go out through Download. Session-local kit files: `vite.config.ts`,
   `src/deck/presenter.ts`, `src/deck/EditLayer.tsx`, `src/deck/Deck.tsx`.
2. The Quiz, Next Session and Feedback slides deleted, on the user's word (content rule 41 overridden for this
   deck; `feedback-check.mjs` will say so).
3. Slide 6's tables regrouped, see item 2 above.

4. **The built HTML saves into itself** (Chrome, Edge): `src/deck/fileSave.ts` (File System Access
   API, the handle kept in IndexedDB per file path), `FileSaveBadge.tsx` (the "Saved in …" pill), and
   `presenterHtml` in `presenter.ts` (the page with a `<script id="deck-state">` presenter state). The
   first change asks once for the file; every later edit, skip and delete rewrites it. Firefox and
   Safari cannot. Check: `node file-save-check.mjs` after `npm run build:html` (FILE SAVE OK). This is
   now generate-slides section 2d, for every deck; this session is the working copy.
5. The Quiz slide deleted too (31 slides).
