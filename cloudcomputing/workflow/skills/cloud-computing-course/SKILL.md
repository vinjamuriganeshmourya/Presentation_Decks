---
name: cloud-computing-course
description: Build rules and the running feedback log for every session of the Cloud Computing course (Outputs/cloudcomputing/). Use whenever planning, generating, editing, reviewing or QA-ing a cloud computing session's plan (Outputs/cloudcomputing/session_plans/<session>/plan.md), deck source (Outputs/cloudcomputing/<session>/src/decks/*.tsx) or player settings, and whenever the user gives feedback on a cloud computing deck, so the feedback is recorded here before it is applied.
---
<!-- cSpell:ignore NxtWave -->

# Cloud Computing course · deck rules

| | |
|---|---|
| Course | `Outputs/cloudcomputing/`, one folder per session |
| Sessions | `cloud_computing_fundamentals` (session 1, port 5270), `deployment_and_service_models` (session 2, port 5271), `setting_up_your_aws_account` (session 3, port 5272), `virtualization_and_hypervisors` (port 5273), `containers_vs_virtual_machines` (session 4, port 5274) |
| Plans | `Outputs/cloudcomputing/session_plans/<session>/plan.md` |
| Start a new session from | the latest cloud computing session, not the kit: the player options below live in session-local kit files |

## R1. The step/slide switch is hidden in every cloud computing deck

**Feedback, 2026-10-23, on session 1:** *"remove the step wise and slide switch
... just hide it don't remove ... because it is autoanimation going on there is
[no] reason to keep the switch ... for every cloud computing you need to follow
this."*

- Every cloud computing deck sets `hideModeSwitch: true` in its
  `DeckMeta.player` (`src/decks/<session>Deck.tsx`).
- The option is `DeckPlayerOptions.hideModeSwitch` in `src/deck/types.ts`,
  read by `src/deck/Deck.tsx` (mode pinned to `slides`, the toggle a no-op,
  the browser's saved choice ignored), `src/deck/DeckControls.tsx` (the button
  is `null`, so all three bar layouts drop it) and `src/deck/useKeyboardNav.ts`
  (`initialArrowMode(remembered)`). These are session-local changes to kit
  files; the kit template does not have the option yet. A session copied from
  the kit instead of from a cloud computing session must carry these four
  files over.
- **Hide, never remove.** The button, the `S` binding and the `?nav=steps` URL
  flag stay in the code: the harnesses (`nav-stress-check.mjs`,
  `controls-clear-check.mjs`, `box-overflow-check.mjs`, `overlap-check.mjs`)
  drive the deck with `?nav=steps`, and a later deck with real build steps
  turns the switch back on by leaving the option out.

Why: these decks animate themselves. Every slide reports 0 build steps
(`revealEveryStep`, session 1's "No builds" decision) and the entrances run
on their own clock, so "step" and "slide" were two names for the same move,
and a presenter who pressed the switch saw its label change and nothing else
happen.

## R2. A new session starts from the latest session, and the reference is rendered first

> **Superseded for new sessions (user, 2026-11-04):** a new session is a data folder built by `deck-engine/`
> (`node deck.mjs new|build|check <folder>`, see `deck-engine/CLAUDE.md`), not a copy of the latest session. The
> engine carries session 5's player, figures and every rule R1-R9 below. The text that follows describes how
> sessions 1-5 were made and still applies when one of them is edited.

**Standing practice, from session 2 (2026-10-23).** The course's sessions
carry session-local kit changes (the player options, the quiz frame, the
takeaways frame, the section bar, the presenter and student views, the
entrance layer). A new session is a copy of the latest session minus `dist`,
`dist-single`, `node_modules/.vite`, `workflow/preview`, `workflow/qa-shots`
and `public/shots`, with `deck.config.json` (`name`, `title`, `htmlName`,
`devPort`, `slideCount`), `src/decks/activeDeck.ts` and a new deck file.
Session 2's `devPort` is 5271; take the next free one.

The reference deck for a session is a built React deck in `Reference ppt's/`.
Render it frame by frame (`?all#/N`) with Playwright and dump each frame's
text, its `notes` (which quote the TR's speaker notes and Visual Guidance)
and a screenshot BEFORE writing the plan; the on-slide strings are the
reference's verbatim, and the Visual Guidance is the spec for every figure.
Session 2's dump scripts are in that day's scratchpad (`ref2/dump.mjs`,
`ref2/notes.mjs`); re-create them from the description above if gone.

## R3. Analogy slides carry no text about the picture

**Feedback, 2026-10-28, on session 4 (Containers vs Virtual Machines):** *"Remove any text that describes or
explains the visual. Keep only the visual and the tags inside it."*

- An analogy slide is the kicker, the title and the two pictures. No analogy sentence as a lead, no caption
  pill under either stage, no `SAME IDEA` words (the arrow between the stages stays).
- `IsoAnalogy` takes `bare` for exactly this, and `h` for a taller stage so the pictures use the freed space.

Why: the sentence and captions described what the pictures already show, and the room read instead of looking.

**Lighter labels (user, 2026-11-06, Session 7 Block, File & Object Storage review; asked and confirmed as a standing
rule):** an analogy stage is a full scene (a real room or place) that reads on its own, so it carries few labels.
- No tags along the TOP of either stage. A tag is kept only where the part it names would not read without it.
- Kept tags pair up across the two stages with the same number badge and a thin leader to the part; number the
  remaining pairs from 1. A stage may carry no tags at all (Session 7 slides 19 and 36).
- Where the review asks, a small `Technical` tag at the foot of the concept stage, or one TR sentence (verbatim,
  sentence case, no final stop) in a rounded box under the concept visual (Session 7 slide 27).
- This narrows lesson 2 below ("every analogy clause gets a label") and standing correction 9's "every clause a
  Title Case tag": the TR's full analogy sentence still goes in the slide's `notes`.

Why: Session 7's rebuilt analogy rooms carried a tag for every clause plus top-row tags, and the user removed them on
all five analogy slides (7, 19, 27, 34, 36): the scene explains itself, the tags crowded it.

## R4. Screenshot highlights are orange, and screenshots are served sharp

**Feedback, 2026-10-28, on session 4:** *"Change all red highlights to orange and increase screenshot clarity
(higher resolution, sharper rendering)."*

- The highlight ring on a screenshot is the template orange (`colors.accent`), never red.
- A screenshot is served from a 2x Lanczos upscale with a light unsharp mask (session 4's `figures/cv/shots-hd/`),
  so the browser never blur-scales a small source. Crops stay in source pixels.

Why: red read as an error on a step that had gone right, and the small TR captures looked soft once enlarged.

**Second arrival, 2026-10-30, on Virtualization & Hypervisors (slides 42, 47 to 51):** *"wherever in the
screenshot is highlighted with red turn that into orange ... remember this rule for the further sessions, just
orange."* That deck was built on 2026-10-27, the day before R4, and still shipped the red ring. Two additions:

- The rule now covers red **inside** the capture too: the TR author's drawn boxes, and the red accent frames a
  Windows machine with a red accent paints on default buttons, checked boxes, the selected VM row, a focused
  field and a progress bar. They are shifted to the template orange in the PNG (hue 24, saturation and value kept); the untouched
  originals stay in `../captures/`. Red that carries data (a chart series, a slider's warning zone) stays.
- It is content rule 51 now, so every course gets it, not only this one.

## R5. Recap, agenda and Key Takeaways show the main points only

**Feedback, 2026-10-28, on session 4:** the recap, the agenda and the takeaways lost their sub-text; *"keep
only the points, consistent with Sessions 1, 2, and the earlier sessions."* This holds even when a request says
"use the text verbatim": the sub lines stay in the source, not on these frames (it confirms lesson 4 below).

Why: session 4 was first built with the TR's full lines on these frames because the request said "do not
shorten", and the user asked for them back to titles only.

## R6. The recap frame shows the presenter illustration

**Feedback, 2026-10-30, on Virtualization & Hypervisors:** *"replace the current illustration with this one, I am
giving session 2 as reference, use the image of recap, and remember that rule: use this illustration from now on
for all the future sessions' recap slide."* The reference is session 2's shared file
`deployment_and_service_models/dist-single/Session 1deployment-and-service-models 1.html`, slide 3.

- The recap frame (`Takeaways` with `kicker="Recap"`, `figures/closing.tsx`) takes
  `art="/assets/takeaways/presenter.png"`: the presenter with the pointer and books, 2:3, in the same box the
  student illustration fills on Key Takeaways. The file is `public/assets/takeaways/presenter.png`, the same
  bytes in session 2, session 4 and this deck.
- Key Takeaways keeps the student (`art` default). Only the recap changes.

Why: session 2 and session 4 already showed the presenter on the recap (the user's 2026-10-28 request on session
2); this deck was built from the older reference and still showed the student, so the user asked a second time.

## R7. The FS team's review standard (every slide, every session)

**Feedback, 2026-11-04, on session 5 (Cloud Networking & VPC), the FS team's review
(`cloud_networking_and_vpc/dist-single/fs-team-ppt-session-5-review-prompt.md`, Part 1):** *"The global rules in
Part 1 apply to every slide in this session and to all subsequent sessions."*

1. **Human figures are realistic.** No abstract or flat 2D people: use the detailed 3D library renders
   (`assets/icons/Icons`: `Boy with a laptop`, `Student along with a bag`, `Male Professional/*`,
   `Female Professional/*`, the teachers and presenters), the same source on every slide of a deck, analogies above all.
2. **Nothing overlaps:** icons, chips, arrows, illustrations, borders and parent boxes all keep clear, with padding.
3. **Every arrow is checked:** the head renders, faces the right way and lands on its target. Broken or misaligned
   heads are the most repeated defect; check every arrow, every session.
4. **Few, thin dotted lines.** Prefer a thin solid line or a tint where a dashed border adds nothing.
5. **Split for density:** split a slide or a point rather than crowd it.
6. **Balance:** left points and right picture in proportion; no large empty areas, no crowded stage.
7. **Explain with the picture:** icons, elements and connections, not text, carry a technical visual.
8. **Motion with purpose; logos never move.** A visual keeps a quiet loop after its build so it never looks frozen.
9. **Configuration screenshots:** one sharp, enlarged capture with the highlight rings on it; no zoomed copies,
   no number badges, no blurred copies. (This replaces session 4's two-picture zoom pattern from G9 for these decks.)
   Sensitive fields inside the capture (account IDs, resource IDs, emails, keys) ARE blurred: content rule 53
   (user, 2026-11-05).
10. **One visual language** across the deck: spacing, illustration quality, technical drawing.

Point wording on a split stays the TR's (user, 2026-11-04: "keep only in tr doc but if it needed split it"): a long
point is cut at the TR's own clause boundaries, never reworded.

Why: the FS team's review of session 5 found abstract people, overlapping chips, broken arrowheads, heavy dotted
boxes, empty stages and zoomed screenshot pairs across the deck, after two visual passes.

## R8. Loops, colour, table highlights, capitals, logos (every slide, every session)

**Feedback, 2026-11-04, on session 5 (`cloud_networking_and_vpc/dist-single/5.md`, "Global Rules ... Apply to This
Session and All Upcoming Sessions"; items 3, 4, 7 and 8 are checks on every slide, not only the listed ones).**

1. **Loops restart at once:** no rest beat or delay between cycles (`Traveller` has `repeatDelay: 0`; a `useCycle`
   or `useLoop` scene keeps no long still beat at the end).
2. **Balanced colour:** orange is for one meaning on a slide (the highlight), never the dominant colour.
3. **Table highlights only for meaning:** never the last row by default (`VisualTable` lights an arriving row for
   about a second, then clears it); a `highlight` row only when the content says that row matters.
4. **Capitals:** every sentence, point, chip, label and subtext starts with a capital; multiword chips and labels
   are Title Case by the kicker rule in `slide-content-rules` (articles and short prepositions lowercase, prepositions
   of four or more letters capitalised, after a colon capitalised). Identifiers, code, CIDRs and resource names
   (`s5-demo-sg`, `igw-id`, `ap-south-1a`) keep their own form. This overrides "verbatim" for letter case only.
5. **Logos keep their aspect ratio:** set one dimension, never both; shrink rather than squeeze.
6. **Arrows match the concept:** every direction (one-way, two-way, return traffic) checked against the networking
   fact before it ships.
7. **Padding everywhere:** no overlap, overflow or clipping between icons, chips, labels, arrows and boxes.
8. **Quiet continuous loops** on relevant icons and technical parts, never distracting.

Why: the session 5 review after two visual passes still found loops with a pause, orange-heavy slides, last-row
bars on every table, lowercase chips and points, and a squeezed Google Cloud logo.

## R9. Every session has its title slide right after the welcome slide

**Feedback, 2026-11-04, on session 5 (Cloud Networking & VPC):** *"why it has missed the title slide after welcome
slide, mandate that for every session title slide is must."*

- Slide 2 of every deck is the session title frame: `{ id: 'S-TITLE', section: 'Opening', label: 'Session name',
  transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} /> }`, directly after the
  `BrandSlide "Welcome!"` and before the recap.
- This holds even when the source spec has no title card. A spec's "no topic on the welcome frame" means the brand
  frame stays topic-free; the title frame after it still carries the session name.

Why: sessions 1, 2, 3 and Virtualization & Hypervisors have it. Session 4 was built from `spec.json`, whose card list
starts welcome, recap, agenda with no title card, and session 5 was copied from session 4 (R2), so both shipped
without it.

## Lessons carried from session 1's reviews (so they are not repeated)

Recorded from `../reviews/cloud_computing_fundamentals.tr-comparison*.md`
and the user's words on session 2 ("make sure you are not repeating the
mistakes from session 1"):

1. **Never paraphrase the TR.** Session 1's leads on three slides carried a
   review's rewording for days. Every string is the reference's; only rule
   36 moves a full stop.
2. **Every analogy clause gets a label.** Session 1 drew "one encyclopedia
   set" and "unaware of its neighbours" but labelled neither. A clause the
   TR wrote is a label on the scene or a line under the claim.
3. **Draw the TR's Visual Guidance, not a nicer picture.** The user's 2026-10-23
   list on the session 2 reference was mostly "the visual is different from
   the visual given in the TR doc". When the reference's notes quote the
   Visual Guidance, the figure draws exactly those elements.
4. **Section breakers carry the title only; agenda and takeaways carry the
   five titles only.**
5. **The lead and the body are one block** (`Card` in `scene.tsx`): a figure
   never floats away from its lead, and a points column sits directly under
   the lead.
6. **No feedback slide** (content rule 41 as retired on 2026-10-30, on Virtualization &
   Hypervisors): the kit's slide is version 0 and is gone from every deck edited since; the
   user will specify version 1. Session 4's `FeedbackCard` was a review candidate, not it.
7. **Labels are DOM text**, never svg `<text>`: the harnesses, the text audit
   and the presenter's edit mode all read DOM text.
8. **Check the port before trusting a screenshot.** A stale dev server from a
   scratch copy served session 1 on 5271 for six hours; `ss -ltnp` first.
