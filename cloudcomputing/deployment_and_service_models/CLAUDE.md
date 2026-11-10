# Cloud Computing · "Deployment & Service Models" (session 2)

The session deck for the second cloud computing session. Read this before
editing it. The kit rules are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`;
the course's own rules in `../workflow/skills/cloud-computing-course/SKILL.md`.

- **Plan:** `../session_plans/deployment_and_service_models/plan.md` (signed off
  on the user's standing word, 2026-10-23: plan and execute in one run).
- **Source:** `Reference ppt's/deployment-and-service-models 2.html`, a built
  deck of 59 frames, content only. Every on-slide string is the reference's;
  its TR speaker notes and TR analogy lines are the notes. The frames were
  rendered and dumped (`?all#/N`, text, notes, screenshots) before a line was
  written; the TR's Visual Guidance per slide is quoted in the reference's
  notes and is the spec for every figure.
- **Deck file:** `src/decks/deployDeck.tsx`, 60 slides (the reference's 59;
  Thank You and All the Best are two frames). Port 5271
  (`npx vite --port 5271 --strictPort`).
- **Figures:** `src/decks/figures/iso/`: `iso.tsx` (THE ENGINE), `objects.tsx`
  (the catalogue), `frames.tsx` (the slide frames), then one file per section:
  `deploy.tsx` (1), `multi.tsx` (2), `service.tsx` (3), `beyond.tsx` (4),
  `econ.tsx` (5). Reused from session 1: `scene.tsx` (`Card`, `Stage`, `Rail`,
  `Label`, `At`, `Arrow`, the loop clocks), `card.tsx` (the plate skins),
  `entrance.ts`, `motion.ts`, `closing.tsx` (the takeaways frame, now with
  `kicker`/`title`/`id` props for the recap). Session 1's other figure files
  (`analogy.tsx`, `art.tsx`, `clay-*.tsx`, `basics.tsx`, `history.tsx`,
  `traits*.tsx`, `benefits.tsx`, `why.tsx`, `people.tsx`, `cast/`) came with
  the copy and are NOT imported by this deck; they stay on disk (the user:
  delete nothing during a build).

## The style: isometric, from the user's skill repos

The user (2026-10-23): "ignore the illustration style that is currently used
in session 1 and make sure you are taking the reference and recreating or
enhancing the visuals ... refer these repos and create engaging visuals ...
add relevant animations." Thirteen repos were cloned read-only and digested
(`scratchpad/repos/DIGEST-iso.md`, `DIGEST-diagrams.md`,
`DIGEST-explainers.md` of that session; the digests are summarised at the top
of `iso.tsx`). What was taken:

- **Projection** (system-atlas, ai-iso-skill, iso-topology): true isometric,
  the 2:1 pixel ratio; one grid unit is `U` px of half tile (28 by default, a
  scene may set `u` 24 to 34); `P(x, y, z) = [(x - y) u, (x + y) u/2 - z u]`;
  painter's order by `x + y`. A face's local frame is an svg `matrix` so
  detail is drawn flat and laid on the face (`faceTransform`), in px, with
  `vector-effect: non-scaling-stroke`.
- **Solids** (anatomy): three flat faces from one colour, top lightest, left
  mid, right darkest (`faces()`), fine outlines in a darker tone of the same
  hue, a flat shadow quad under the base. No gradients, no filters, no clay.
- **The data palette** (explainer-pack, iso-topology): few hues, fixed
  meanings: `ISO.provider` (brand blue) for what the provider owns or manages,
  `ISO.customer` (amber, the reference's) for what the customer brings, steel
  for neutral hardware, one accent per scene. Chrome colours stay the template's.
- **Motion** (live-panel, visual-explainer, SeeCode, Archscribe): every scene
  is one loop, state a pure function of one clock (`useLoop` / `useCycle` from
  `scene.tsx`, held at a chosen `still` phase on harness URLs and in
  thumbnails); packets travel on links (`Packet`, a dot with a short trail,
  entering and leaving objects); discrete changes ease on the house curve;
  nothing decorative loops; nothing changes layout. Entrances are session 1's
  reading-order layer, 1.5s (the timing the user asked to keep).
- **Labels are HTML** (`Label` in `IsoAt`), never svg text: the harnesses
  measure DOM text, the presenter's edit mode edits it, the text audit reads it.

## Decisions

1. **Every word is the reference's** (plan decision 1). Only rule 36 moves a
   full stop. The reference's own notes carry the TR speaker notes; where it
   quoted a TR analogy sentence, `analogy()` carries it.
2. **The user's thirteen points** (plan decision 2): breakers title only;
   the twelve analogies redesigned as `IsoAnalogy` (two isometric stages, one
   clock); 9 and 12 drawn to the TR (a fenced site, one linked system);
   `Card` keeps the lead and body as one centred block (the "gap on top of the
   content" point); 19 two labelled strategies with every mark named; 25
   carries the `Stack layer` heading and the TR table's cell words in its
   slabs; 26 draws its own sentence (any service model on any deployment
   model) instead of repeating the table; 27, 29, 31 to the TR's cloud-with-
   connectors diagrams; 35's points under its lead with a figure beside; 45
   as two columns.
3. **The TR's Visual Guidance is the figure spec** (plan decision 3). Slide
   54 draws no map outline (a contested border, no geography at this size).
4. **No builds, no Next, no Autoplay** (`revealEveryStep`), the step/slide
   switch hidden (`player.hideModeSwitch`, course rule R1), every move a
   transition (`player.smooth`), picker thumbnails on.
5. **Fixed frames from the kit and session 1**: brand, welcome (minimal),
   agenda (titles only, static), five breakers, two `ClassroomQuiz` frames,
   `Takeaways` (the five agenda titles) and the same layout for the recap of
   session 1 (kicker `Recap`, title `Cloud Computing Fundamentals`), next
   session, the feedback slide (content rule 41 applies again: session 1's
   deletion was for that deck only), two thank-you frames.
6. **Logos**: AWS (`assets/tech/aws.png` and the square `companies/aws.png`),
   Azure and Google Cloud (`companies/azure.png`, `google-cloud.png`), the
   reference's own embedded files, placed in `slide-kit/assets/companies/`
   first (rule 13). No Indian provider mark is drawn; they are named in text.
7. **Section files were built one per worker** after the engine, the frames
   and section 1 were finished and reviewed, each worker owning one file and
   reading the rest; no two workers touched one file (generate-slides 6e:
   the shared layer had one author).
8. **`FigureOnly` takes `figure` or `children`**; `PointsFigure` is a 452px
   rail at 18px (16 or 17 when five bullets or long ones) beside a 634x380
   stage; analogy stages are 470x300 each with a 170px `SAME IDEA` gap.
9. **Port 5271 was held by a stale dev server** from an earlier Claude
   session's scratch copy of session 1 (a `frozen2/deck` folder); it was
   stopped on 2026-10-23. If a dev server on this port shows 68 slides, that
   is what happened again.

## Checks, and the numbers this deck passes them with

```bash
export CHROME_PATH=/usr/bin/brave-browser
U="http://127.0.0.1:5271/?all"
node qa.mjs "$U" 56; node video-safe.mjs "$U" 56; node align-check.mjs "$U" 56; node mixed-align-check.mjs "$U" 56
node box-overflow-check.mjs http://127.0.0.1:5271 56; node controls-clear-check.mjs http://127.0.0.1:5271 56; node .text-audit.mjs 1 56
node workflow/export/build-reveal-steps.mjs "http://127.0.0.1:5271/?nav=slide&x=" 56
AGENDA_SLIDE=4 node agenda-check.mjs; node ligature-check.mjs; node overlap-check.mjs; node feedback-check.mjs
CONTENT_SLIDE=7 node gesture-check.mjs; CONTENT_SLIDE=7 node phone-nav-check.mjs
CONTENT_SLIDE=7 PLAIN_SLIDE=2 node autohide-check.mjs
node nav-stress-check.mjs $PWD/dist-single/deployment-and-service-models.html chromium
```

The results of the first full sweep are recorded at the end of this file
once the deck is complete.

## First full sweep (2026-10-23)

Every check clean on 60 slides: qa (the three hero frames NO LOGO, plus 14px
figure-label warnings, accepted as in session 1), video-safe, align,
mixed-align, box-overflow, controls-clear, overlap, agenda, ligature,
gesture, phone-nav, autohide, nav-stress; 0 reveal steps on every slide.
Two known exceptions: `.text-audit.mjs` flags the feedback slide's link
`forms.gle/...` (a URL, kit slide, correct as is); `feedback-check.mjs`
reports a single difference from the kit's built gallery, the footer mark's
class `h-[18px]` against `h-9`, because `slide-kit/slide-template/dist-single/`
was built before content rule 50. It passes once the kit is rebuilt with the
rule-50 change.

## 2026-10-26: visuals rebuilt in session 1's 3D style (the isometric look retired)

The user: the isometric figures came out flat and clay-like; rebuild ONLY the visuals in session 1's
true-3D illustration style, with the asset library (`assets/icons/Icons` at the repo root) as the
source of truth; text, layout, frames, clocks, navigation and slide order unchanged.

- **The kit:** `src/decks/figures/d3/kit.tsx`: `Icon3D` (a library render, trimmed and resized to
  360px in `public/assets/icons3d/`, on a soft ground shadow) and session 1's drawn objects
  (`clay-b/c/d`) re-exported. `deployDeck.tsx` now mounts `ART_CSS` and `mountClayDefs()` as session 1 does.
- **Rebuilt (40 slides):** 6-9, 11-15, 18-22, 25-32, 34-40, 43-50, 52-54. Section files keep their names
  under `figures/iso/` but no longer draw with the isometric engine (`iso.tsx`/`objects.tsx` stay on
  disk; `pulse`/`within` maths helpers are still imported). Local drawings in session 1's finish where
  nothing existed: oven, pizza, counter, tablet (service), gauge, oven (deploy), shield-with-tick
  (multi), plates/bolt/step slabs (beyond), Block/Stack/PriceTag/Train/Pedestal (econ).
- **Unchanged:** 1-5, 10, 16, 17, 23, 24, 33, 41, 42, 51, 55-60 (kit frames, tables, characters, quiz art).
- **Changed still phases:** 8 (0.62 -> 0.68), 45 (0.78 -> 0.9), 46 (0.56 -> 0.95), so the held frame shows the idea.
- **Check:** a stage checker (scratchpad `d3-check.mjs`: PAD >= 20px, CLIP, OVER between placed blocks)
  printed ALL CLEAN on the 40 rebuilt slides; 43 and 53 have no full-width stage and were checked by eye.

## 2026-10-26: slide comments (presenter view, a trial)

The user: comments on individual slides, Google Slides style, presenter view only, on the right of the
slide, hidden in fullscreen, delete and resolve. Built in THIS session only, as a trial; if it holds, the
user will ask for it to become a rule for every deck. Session-local kit change (`sync-kit --apply` would
overwrite `Deck.tsx` and `DeckControls.tsx`; the two new files would survive).

- `src/deck/comments.ts`: threads (first message + replies), resolve/reopen, edit, delete; own
  `localStorage` key `nxtwave.deck.<slug>.comments`, NOT in `PresenterState`, so the student download
  cannot carry them; harness URLs read and write nothing.
- `src/deck/CommentsPanel.tsx`: 340px panel BESIDE the stage (the slide fits the room left): This slide /
  All slides (slide chips jump), Show resolved (n), + Comment (name field, Ctrl+Enter posts, Esc cancels),
  thread card with tick (resolve) and ⋮ (Edit, Delete with confirm), click a card to reply, Reopen.
  Under 900px wide it lies over the slide instead. Ctrl+Alt+M opens it with a new comment.
- `Deck.tsx`: the stage area is a row (stage + panel); the panel renders only when presenter, open and
  not fullscreen. `DeckControls.tsx`: a speech-bubble button beside Edit, with the open count on the slide.
- Verified 2026-10-26: 20 browser checks on the dev server and 3 on the built file (post, reply, resolve,
  show resolved, reopen, all slides + jump, delete, reload, fullscreen hide/return, student view and
  student download carry nothing, harness URLs never open it).

## 2026-10-27: TR-doc comparison pass (56 slides)

The user compared the deck against the TR doc (`Reference ppt's/2. Deployment & Service Models.pdf`,
24 TR slides, diagrams on pages 2-5, 7, 10-12) and asked for a fix list. Applied:

- **Leads to the TR:** 6 (the TR's three sentences), 7 (the TR definition), 19 (the TR slide 7
  definition over the multi-vs-hybrid diagram; it had no text).
- **Every analogy slide carries the TR's analogy sentence as its lead** (`IsoAnalogy` `text` prop,
  spaced dash turned into a comma, content rule 1) and the invented claim pill is dropped:
  8, 11, 14, 20, 28, 30, 32, 37, 40, 46, 48, 50. Scenes redrawn to the sentence on 11, 14, 28, 30,
  32, 37, 40, 50.
- **Redrawn to the TR's own diagrams:** 9 (img on p3), 12 (p4), 15 (p5), 31 (p12); 47 to the TR
  Visual Guidance (layered bar, `True TCO` bracket).
- 18 plain bullets, no figure; 25 relaid as a clean grid; 26 an illustration (layers render fanning
  out to the four deployment clouds); 27 network icon -> AWS VPC/subnet diagram (official icons in
  `figures/d3/aws/`); 43 book -> drawn wallet with banknotes.
- **Deleted:** 58 feedback, 52 pricing bars, 39 AI/ML flow, 36 FaaS timeline (the user's word; the
  functions stay in the section files, unused). `slideCount` 56, reveal steps rebuilt.

Sweep on 56: qa (three hero frames NO LOGO, 14-15px figure labels as before), video-safe, align,
mixed-align, text-audit, controls-clear, agenda, ligature, gesture, phone-nav, autohide, nav-stress
all clean. overlap-check: the pre-existing rule-42 findings on 11, 13, 14, 35 and next session,
plus one 16x16 on 31 (a connector tip at the phone's badge). box-overflow: empty positioning
wrappers below the stage on 27, 28, 30, 31, 32 (no text clipped; the class was in the baseline).

## 2026-10-28: review pairs, recap art, chef (61 slides)

- **Review pairs, both kept until the user picks one** (`figures/variants.tsx`): agenda1
  `AgendaColumns` (5, beside agenda0 at 4), quiz1 `QuizCard` (25 and 55, each beside its
  `ClassroomQuiz`), feedback1 `FeedbackCard` (59, beside the restored kit `FeedbackSlide` at 58).
  Designs in `slidestraining/agendaslides|quizslide|Feedbackslide`. Art in
  `public/assets/quiz/quiz-cube.png`, `public/assets/feedback/feedback-rating.png`.
  `feedback-check.mjs` FAILS while the pair stands (feedback0 must be followed only by the two
  thank-you frames); it passes again once one of the two is deleted.
- **Recap art**: `Takeaways` takes `art`; the recap shows `public/assets/takeaways/presenter.png`
  (from `slidestraining/Presentation Icon.png`, 2:3 like the student) in the same 270x405 box.
- **Chef (30, 32)**: `presentRight` at `amplitude={0.3}`, crop `x1` 360 -> 400 (the hand clipped);
  the recipe-card chips above the counter removed.

## 2026-10-28: feedback slides removed, save-into-file ported (59 slides)

- Both feedback frames (the kit `FeedbackSlide` and `FeedbackCard`) removed on the user's word;
  `FeedbackCard` stays unused in `figures/variants.tsx`.
- The deck now saves edits, skips and deletes INTO the shared HTML (generate-slides 2d): `src/deck/`
  `Deck.tsx`, `EditLayer.tsx`, `presenter.ts`, `fileSave.ts`, `FileSaveBadge.tsx`, `vite.config.ts`,
  `src/decks/slideEdits.ts` and `file-save-check.mjs` copied from `setting_up_your_aws_account`
  (this deck's copies were older versions of the same files, nothing session-only lost).
  `node file-save-check.mjs` printed FILE SAVE OK. Chrome and Edge only.

## 2026-10-29: eight corrections to the shared file `dist-single/Session 1deployment-and-service-models 1.html`

The user handed a list of slide-specific corrections for THAT file (57 slides on screen). Its source is
NOT this folder's `src/`: the 2026-10-28 session built it from a scratchpad copy of this deck in which the
review pairs (`agenda-columns`, `quiz-mid-card`, `quiz-close-card`) were dropped, slide 6 was split into
`deploy-intro` + the map, 11 carried pictures over its table (`PrivateHeads`), the houses on 12 and the
PaaS diagram on 30 were redrawn to the TR, and `IsoAnalogy` stopped drawing the TR sentence. None of that
was ported here. This pass therefore worked on a copy of THAT source, rebuilt it, and wrote the result over
the same file name; `src/` here is untouched. **The source of the shipped file is the zip**
`../versions/deployment_and_service_models-2026-10-29-session1-corrections.zip` (unzip, symlink
`node_modules` to this folder's, `npm run build:html`). The pre-pass file is in that zip's sibling scratchpad
backup only; the file itself is the deliverable.

What changed, by the on-screen number: 11 the pictures over the table removed, the table re-centred by `Card`
(nothing added); 15 the kitchen and the banquet hall drawn as rooms (`figures/iso/rooms.tsx`: `Room`,
`RealOven` with knob panel, bar handle, glass door, rack and tray, `SteelCounter`, `UtensilRail`,
`RoundTable`, `Chandelier`, `BuffetTable`); 29 an empty shell with meter, wiring, socket, pipe and tap,
the owner with a clipboard, equipment dropping in, two staff hired, food cooked (`ShellScene`); 30 code
file -> PaaS cloud over the `OS, Runtime, Scaling, Patching` box -> browser window (`CodeFile`,
`BrowserWindow`); 31 a fully equipped kitchen, the chef holding a recipe card (`EquippedKitchenScene`);
33 a dining room, the diner with the menu, the chef in the pass, the waiter serving the plate
(`DiningScene`); 35 the stair reordered IaaS, PaaS, FaaS, AI/ML, SaaS from the bottom (`X0` 160 -> 170 so
the long FaaS label clears the axis label); 39 the supplied picture, white border cropped, 1000px wide,
imported so the build inlines it (`figures/img/hospital-specialist.png`). The captions under 29, 31 and
33 were reworded to match the new scenes (the old ones named dough and a pizza box). The replaced
drawings (`Oven`, `PrivateHeads`, `ClayOven`, `ClayCounter`, `Kitchen`, `ConsultScene`) stay exported, unused.

Two things the harnesses taught: a figure placed with `At` + an inner `translateY(-100%)` keeps its layout
box below the stage and box-overflow reports the group (use `Stand`, the transform on the anchor itself);
and a room with an inset ring is a "box" to overlap-check, which then reports every drawn object inside it
as an arrow over it (`Room` draws its rim inside its own svg). Sweep on the shipped file: qa (the three
hero frames NO LOGO), video-safe, align, mixed-align, controls-clear, gesture, phone-nav, autohide,
agenda, ligature, nav-stress, file-save all clean; box-overflow and overlap report only the pre-existing
findings on 28, 32, 36, 52 and the cloud side of 15 (identical to the file before this pass).

### 2026-10-29, later: the review pairs added to the shared file (60 slides)

The user: add agenda1 beside agenda0 and quiz1 beside each quiz0 in the same shared file, nothing else.
`agenda-columns` (`AgendaColumns`, the five titles only, no TR lines under them, on the user's word) is
slide 5; `quiz-mid-card` and `quiz-close-card` (`QuizCard`) are 26 and 56. Every slide from the old 5
moves +1, from the old 25 moves +2, from the old 54 moves +3 (the eight corrected slides are now 12, 16,
31, 32, 33, 35, 37, 41). `slideCount` 60 in the zip's `deck.config.json`; the zip above was refreshed.
One build in this pass came out without the fonts (`inline-fonts` printed SKIPPED, the Google Fonts fetch
failed once): always read that line, a 7.25 MB build is one that needs a network. Sweep on the shipped
60-slide file: every check clean as before, box-overflow and overlap only the pre-existing findings
(now on 30, 34 and 13, 15, 16, 34, 38, 54), none on the three new frames.
