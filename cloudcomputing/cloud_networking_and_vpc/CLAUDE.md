# Cloud Computing · "Cloud Networking & VPC" (session 5)

The session deck for Cloud Networking & VPC. Read this before editing it. The kit rules are in `KIT.md` and
`../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Plan:** `../session_plans/cloud_networking_and_vpc/plan.md` (signed off on the user's word, 2026-10-29: the
  request is the spec).
- **Source:** `../../cloud_computing/session_plans/session_5/` (note: `cloud_computing`, not this course folder):
  `spec.json` (60 cards, its viewer `spec.html`), `tr.docx` and `tr.json`. CONTENT ONLY, verbatim (no rewording,
  shortening, summarising, reordering, correcting, nothing added), in the TR's order. The spec's strings are the
  TR's apart from its documented edits (spaced dash to colon/comma, final full stop dropped, `Vpc` to `VPC`,
  three typos, one split sentence).
- **Deck file:** `src/decks/netDeck.tsx`, 77 slides (78 until 2026-11-05, when `T15-1c` merged into `T15-1`) (the title frame `S-TITLE` added as slide 2, course R9): the spec's 60 cards, the 2026-10-30 split halves
  (`T04-1b`, `T07-1b`, `T08-1b`, `T11-1b`, `T13-1b`, `T14-1b`, `T16-1b`, `T17-1b`, `T20-1b`, `T20-1c`, `T23-1b`), the
  2026-11-04 splits `T15-1c`, then `T01-1b`, `T06-1b`, `T21-1b`, `T29-1b` (FS review), then `T02-1b` (5.md); no feedback slide (rule 41 retired). Slide ids are the spec card ids (`T01-1` …), stamped as `data-spec`. Port 5275
  (`npx vite --port 5275 --strictPort`).
- **Copied from `containers_vs_virtual_machines`** (course rule R2): the cloud player (no builds, smooth
  transitions, hidden step/slide switch, presenter and student views, comments, saves into its own file).
  `figures/closing.tsx` (`Takeaways`, `art`) and `iso/frames.tsx` (`PointsFigure`, `FigureOnly`, `TableCard`,
  `IsoAnalogy bare`) are reused. Earlier sessions' figure files (`cv/`, `vh/`, `aws/`, `iso/*.tsx` sections)
  came with the copy and are not imported; they stay on disk.

## Figures (`src/decks/figures/net/`)

- `frames.tsx`: `MARK`/`Logo` (AWS, Azure, Google Cloud, imported so the single file inlines them), `Mono`
  (every CIDR, address, zone and resource name), `Crop`/`ShotCard` (the six lab screenshots from `spec.json`
  in `shots/`, served sharp from `shots-hd/`, cropped in source pixels, never redrawn), `NoteBox` (the TR's
  Important Note), the network palette `NET`, the pieces (`Boundary`, `SubnetBox`, `Gateway`, `RouteChip`,
  `MiniRouteTable`, `LockBadge`, `Resource`, `InternetCloud`, `NoMark`) and `VpcScene` + `G`, THE ONE VPC
  DRAWING the spec's design note 1 asks every section to reuse, with its geometry exported so arrows are
  computed from the same numbers as the boxes.
- One file per section, built by parallel workers from one brief: `overview.tsx` (T01-1 to T02-3),
  `vpc.tsx` (T03-1 to T06-1), `subnets.tsx` (T07-1 to T11-1), `routing.tsx` (T13-1 to T18-2),
  `security.tsx` (T19-1 to T23-1), `lab.tsx` (T24-1 to T29-1).
- `routing.tsx` was a stub when the 2026-10-29 session ended (its worker never delivered) and was built on
  2026-10-30. Its `RoutingMap` draws the one VPC drawing at `G`'s numbers as a tree whose boxes hold their own
  lines (the private subnet's line to the NAT is two segments: between the subnets, then inside the public
  subnet to the NAT's rim), with the local line at y 180 and the NAT at y 240 so the two keep clear; T13-1 and
  T18-2 share it. T15-1 redraws the TR's slide 15 image (the gateway on the VPC's right border, the flow
  table → gateway → internet, the zone labels dropped, both subnets kept). T16-1 puts the subnet names at the
  foot of each box so the NAT's lines run clear, and shows the private subnet's route entry as a chip stack
  (`0.0.0.0/0` → `nat-gateway-id`) because `MiniRouteTable` cannot fit `nat-gateway-id` in the column beside
  the drawing. T17-1 shows each side's route entry as a chip stack too (the spec's play: "without a full
  table"). T17-2 carries the AWS mark on the VPC's corner (`AWS side`, content rule 12) because the point names
  AWS. T18-1 rings the NAT cost cell on the cell's own words (rule 43), not the row.

## Decisions

1. **Recap, agenda, breakers and Key Takeaways carry the five titles only** (course rule R5): the words
   before the TR's colon. The sub lines stay in the source.
2. **Analogies (course rule R3; the user, 2026-10-29: "make sure analogies are represented exactly"):**
   `IsoAnalogy bare`, two pictures, the familiar scene left and the concept scene right, every clause of the
   TR's analogy a tag inside the picture it describes, in the TR's words, matched parts lined up.
3. **No speaker notes from the TR** (spec build contract).
4. **Motion is the course's, not the spec's press counts:** auto entrances in reading order, one loop per
   figure; the spec's press order is the entrance and loop order.
5. `S-WELCOME` is the brand frame (`BrandSlide "Welcome!"`): the spec forbids the topic on it.
6. **D-LAB**, the practical's divider, is the breaker frame rendered through `LabBreaker` (a wrapper) so the
   section bar keeps one segment per agenda point; the lab belongs to section 5.
7. **Standard closing frames only** (quiz `ClassroomQuiz`, Takeaways, Next Session, the kit `FeedbackSlide`,
   Thank You, All the Best). Session 4's second layouts (`figures/variants.tsx`) are on disk if wanted.
8. **Visual pass (user, 2026-11-04, `dist-single/session-5-deck-prompt.md`: "build Session 5 with Session 4's design
   system, layout, animation and controls"; no content invented, changed or deleted).** Session 4's mistakes list is
   taken to be its corrections G1-G12 (`~/Downloads/slides-5-56-corrections.md`; the prompt's list was left empty).
   - **Ported from Session 4:** `src/deck/autoAnim.ts`, `animSteps.ts`, `Deck.tsx`, `DeckControls.tsx`,
     `useKeyboardNav.ts` (the auto animation toggle beside Replay, key `P`, ON presenter / OFF student / ON phone);
     the stepping in `figures/scene.tsx` (`useBuild` keeps THIS deck's 0..n-1 signature, `useCycle`, `useLoop({ beats })`,
     G8 `Arrow`); `entrance.ts` stepped blocks (this deck's faster timing and `INSIDE_GAP` kept); `net/fx.tsx` and
     `net/vtable.tsx` (from `cv/`; `CvIcon` takes any `net/icons/` name); `auto-anim-check.mjs`, `auto-off-flash-check.mjs`.
   - **Fix not in Session 4:** the stepped entrance's keyframes are the START frame only (`offset: 0`), so a shown
     block follows its own live opacity; with an explicit end and fill 'both' a figure's later dim (G4) froze.
     Session 4's `entrance.ts` still has the old form.
   - **Sections rebuilt by six parallel workers, one per section file** (shared brief, shared pieces done first):
     new files `net/overview-{motion,school}.tsx`, `vpc-society.tsx`, `subnets-{parts,sizing,split,zones}.tsx`,
     `routing-{art,analogies}.tsx`, `security-analogy.tsx`, `lab-{figs,shots}.tsx`; one `<SECTION>_CSS` per file,
     wired in `netDeck.tsx`. Points are `LitFigure`/`LitPoints` (icon per point, the acted point lit); every table is
     `VisualTable` (16, 23, 25, 31, 43, 54, 64); analogies (6, 13, 33, 38, 42, 47) are concrete scenes, one pair lit
     per step, the rest faded; screenshot slides (60-63, 65, 66) are Session 4's ShotPair with `ZoomBadge`.
   - **T15-1 split** into `T15-1` (lead, points 1-2) and `T15-1c` (points 3-5, same figure): 72 slides.
   - Some baseline strings were hidden DOM on a slide (slide 21's /28 strings, 29's gateway labels, 55's four chips);
     they stay hidden, inside their stage, so the text check holds.
   - Harness state: video-safe CLEAN, box-overflow NO OVERFLOW, controls-clear CLEAR, mixed-align 0, AUTO ANIMATION
     OK (547 presses), AUTO-OFF FLASH CLEAN (slide 6 door fixed after the first full run), gestures pass, FILE SAVE OK; qa flags only the brand/closing frames plus the 16px type-floor
     warning on figure labels (as Session 4). Text check vs the pre-pass dump: nothing missing on any slide.
9. **FS team review (user, 2026-11-04, `dist-single/fs-team-ppt-session-5-review-prompt.md`; slide numbers there are
   the 72-slide deck).** Its Part 1 is course rule R7. The user: point wording stays the TR's, "if it needed split
   it" — every split point is the TR line cut at its own clause boundary (58/59 keep their TR step lines, not the
   review's shortened ones). Seven parallel workers (routing split into content and analogies).
   - Splits wired: `T01-1b` (`Boundary1b`), `T06-1b` (`VpcToSubnets2`), `T21-1b` (`NetworkAcl2`), `T29-1b`
     (`ExploreSecurity2`, Security Group half first as in the TR): 76 slides.
   - People are the 3D library renders (`assets/icons/Icons`) copied trimmed into `net/icons/{overview,vpc,routing,
     security}-*.png`, moving as whole images; the AWS mark's smile is static (`fx.tsx`), no logo moves.
   - Screenshot slides (63-66, 68, 69 now) are ONE enlarged capture with orange rings; zoom copies and `ZoomBadge`
     numbers removed (R7.9 replaces session 4's G9 pair here).
   - Dashed rims 1.5px deck-wide in the section files (local wrappers; `frames.tsx` `Boundary` untouched).
   - Beyond the review's list, under Part 1 (density, two-line points, paired slides): T16-1b, T20-1, T20-1b,
     T20-1c, T20-2, T23-1 and T23-1b were refitted; slide 44's map moved with the NAT fix in `routing.tsx`.
   - Text check vs the pre-round dump: nothing missing except what the review removed (the 1-6 strips on T24-1/2,
     the zoom badge digits).
   - Harness after the round: video-safe CLEAN, box-overflow NO OVERFLOW, controls-clear CLEAR, mixed-align 0,
     AUTO ANIMATION OK (558 presses), AUTO-OFF FLASH CLEAN (T21-1b's back step fixed after the full run), gestures
     pass, FILE SAVE OK; qa flags only the brand/closing frames.
10. **Review `dist-single/5.md` (user, 2026-11-04; slide numbers there are the 76-slide deck).** Its global rules are
    course rule R8. Shared fixes by the lead: `VisualTable` lights an arriving row for ~1.1s only (no table keeps its
    last row marked); `Traveller` loops with no `repeatDelay`; `frames.tsx` defaults `Route Table` / `Internet`
    (`local` stays: the AWS route target); the six analogy titles in Title Case. Workers: Title Case on every chip,
    label, tag, header and row label, a capital on every point and split piece (identifiers, CIDRs and route-target
    keywords untouched), loop rest beats removed, `T02-1b` split (77 slides). Verify items: T05-1 "Default on Signup",
    T22-1 State/Rule Type, T28-1 `0.0.0.0/0` and T18-1's NAT cost cell are KEPT (spec.json's visual guidance names
    each); T13-1b and T18-2 gained a two-way gateway-internet arrow; T16-1/T16-1b keep one-way arrows (where a
    connection may start) with the packet now making the round trip. **T20-1b is the user's case reference and is not
    edited**, though its "while a new group..." piece and "Security group 1/2" chips do not meet R8.4.
11. **Correction list (user, 2026-11-05; slide numbers there are the 78-slide deck).** Its three global rules are
    content rules 36 (widened to every final punctuation mark), 52 (a wordmark logo takes no duplicate label) and 53
    (sensitive data in a screenshot is blurred). Four parallel workers, one per section.
    - `T15-1c` merged into `T15-1` (the user's lead and four points, one figure, `useWalk(4)`): 77 slides.
    - T03-2's VPC drawing replaced by the presenter render `net/icons/vpc-explainer.png` (library `Male Presenter/
      Explanation Icon-1.png`). T07-1b, T14-1b and T20-1c are figure-on-top with the points beneath (T14-1b's third
      point centred on row 2). T23-1/T23-1b funnel: ACL Rules on top, Security Group Rules below, each with its icon,
      connector and chips; the funnel's slope is gentler so the long chip fits.
    - T16-1/T16-1b: the red inbound path is Internet → IGW → NAT with the ✖ on the NAT; T16-1 gained the private → NAT
      arrow. T17-2: gateway labels under their discs, `On-Premises Network` above the roof, `AWS Side` → `Side` (rule 52).
    - T21-1/T21-1b tables: one Allow/Deny pill per row; the Port column removed on both (it never held a port; T21-1b's
      match ticks sit in the Allow cell).
    - Lab captures: account and resource IDs blurred in `shots/` and `shots-hd/` (script `blur.py` reads the
      originals in `../workflow/captures/session5-originals-2026-11-05/`). T25-1's status line removed.
    - Harness after the round: video-safe CLEAN, box-overflow NO OVERFLOW, controls-clear CLEAR, mixed-align 0, no
      line-final punctuation on any slide.

