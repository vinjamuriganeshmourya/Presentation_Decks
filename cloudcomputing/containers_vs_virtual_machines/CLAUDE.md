# Cloud Computing · "Containers vs Virtual Machines" (session 4)

The session deck for Containers vs Virtual Machines. Read this before editing it. The kit rules are in
`KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Plan:** `../session_plans/containers_vs_virtual_machines/plan.md` (signed off on the user's word,
  2026-10-28: the request is the spec).
- **Source:** `../../cloud_computing/session_plans/session_4/` (note: `cloud_computing`, not this course
  folder): `spec.json` (68 cards, its viewer `spec.html`), `tr.docx` and `tr.json`. CONTENT ONLY, verbatim (the
  user: no rewording, shortening, summarising, reordering, correcting, nothing added). The spec's strings are the
  TR's apart from its two documented edits (spaced dash to colon/comma, final full stop dropped).
- **Deck file:** `src/decks/cvDeck.tsx`, 74 slides after the 2026-10-30 correction pass (below): the spec's 68 cards
  less the library analogy, plus the split halves `T05-S8b` and `T07-1b`, and the kept agenda1 (titles only), quiz1
  and feedback1 frames. Slide ids are the spec card ids (`T01-1` …), stamped as `data-spec`. Port 5274
  (`npx vite --port 5274 --strictPort`).
- **Copied from `virtualization_and_hypervisors`** (course rule R2): the cloud player (no builds, smooth
  transitions, hidden step/slide switch, presenter and student views, comments, saves into its own file).
  Session 2's `figures/variants.tsx`, `iso/frames.tsx` (`IsoAnalogy` with the TR sentence as lead) and
  `closing.tsx` (`art`) were taken over. Earlier sessions' figure files came with the copy and are not
  imported; they stay on disk.

## Figures (`src/decks/figures/cv/`)

- `frames.tsx`: `MARK`/`Logo` (logos imported so the single file inlines them; Podman, containerd and Ubuntu
  fetched into `slide-kit/assets/tech/` first), `Mono`, `Crop`/`ShotCard` (the TR screenshots from `spec.json`
  in `shots/`, never redrawn; since 2026-10-30 every one is the FULL capture, `crop` unused, with the part the
  caption names ringed), and the ONE container picture (`ContainerHost`,
  `VmHost`) and ONE layer stack (`LayerStack`) the spec's design notes ask every section to reuse.
- One file per section, built by parallel workers from one brief: `fundamentals.tsx` (6-10), `install.tsx`
  (12-21), `docker.tsx` (22-31), `build.tsx` (32-39), `compare.tsx` (41-47), `choose.tsx` (49-53),
  `tooling.tsx` (55-64).

## Decisions

1. **Review pairs (user, 2026-10-28), resolved 2026-10-30:** the user kept agenda1 titles only (`AgendaColumns`,
   slide 3), quiz1 (`QuizCard "Quiz Time!"`, 69) and feedback1 (`FeedbackCard`, 72) and had agenda0, the full-line
   agenda1, quiz0 and feedback0 deleted. `agenda-check.mjs` runs with `AGENDA_SLIDE=3`.
2. **Agenda, recap and Key Takeaways carry the TR's full lines** (the user asked for no shortening), title bold
   and the rest after the TR's colon (`Takeaways full`); agenda0's sub lines are set at 15px in a 560px column
   so the kit arc holds five. This departs from course lesson 4 (titles only) for this deck.
3. **No speaker notes from the TR** (spec build contract); notes carry only the review-pair instructions.
4. **Motion is the course's, not the spec's press counts:** auto entrances in reading order, one loop per
   figure; the spec's press order is the entrance and loop order.
5. `S-WELCOME` is the brand frame (`BrandSlide "Welcome!"`): the spec forbids the topic on it.
6. **Correction pass (user, 2026-10-30, the pasted list; only those changes):** T01-1 apps named App 1/2/3 and the
   containers stand on the Container Engine with no gap; T01-AN's familiar side redrawn with the isometric engine
   (`../iso/iso`: a three-storey block, a door and padlock per flat, one foundation slab, one cable and one water
   pipe up the wall); every screenshot full, not cropped; T05-S8 split (the step and the output / the two commands,
   their lines and the Linux note); T07-1's client-to-registry arrow removed, the dashed daemon-to-registry arrow
   carries `docker pull`, the card split (the two commands / socket, cache, repeat run); T09-2's flow strip removed;
   T11-2's code panel and "Lines 6-7" note removed; T11-3's "Step 3: write…" line removed; a step line no longer
   repeats its heading's `Step N:` (T11-1b, T11-5, T11-6, T11-7); T11-6's enlarged PORTS image removed; T23-AN's
   passenger is a Character Lab figure (`../Cast`, `Posed` with `alive`, no gesture loop); T25-AN deleted.
7. **Visual pass (user, 2026-11-03; visuals only, every string unchanged, audited against `spec.json`):**
   - **Auto animation on/off** (`src/deck/autoAnim.ts`, `src/deck/animSteps.ts`, session-local kit change): a
     Play/Pause button beside Replay on the bar, key `P` (`A` was taken). ON by default in the presenter view,
     OFF in the student view (`?view=student`, the download). OFF, every right-arrow press (key, bar, swipe,
     PageDown) plays one step: the entrance blocks in reading order, left column first, then each figure's
     `useCycle` / `useLoop({ beats })` / `useBuild` build; the press after the last step changes slide. Harness
     URLs are always ON. `SPEED` 0.85 shortens every auto timing. `window.__DECK_STEPS__` publishes the state;
     `node auto-anim-check.mjs` must print AUTO ANIMATION OK.
   - **New pieces:** `figures/cv/fx.tsx` (library icons in `cv/icons/`, `LitPoints`/`LitFigure`, `Badge`,
     `Ripple`, `AwsMark` with the moving smile, `FX_CSS` transform/opacity loops), `figures/cv/vtable.tsx`
     (`VisualTable`: every table slide, 7, 12, 45, 47, 57, 61, 65, built row by row with header and row icons).
   - **Slides rebuilt:** 5 (TR diagram built layer by layer, feature badges), 46, 48 to 52, 54 to 58, 64 (left
     side: detailed depot, bus, auto-rickshaw with turning wheels), 68 (side card plus a four-stop path).
   - **Harness state after the pass:** video-safe CLEAN, box-overflow NO OVERFLOW, controls-clear CLEAR,
     mixed-align 0, gestures pass, FILE SAVE OK; qa flags 2/69/70/72 (files untouched); overlap-check 14
     (badges inside slide 51's blast circles read as arrows); nav-stress clean on Chromium and on Firefox up to 1080p, Firefox 4k catches the crossfade mid-way (the untouched VH deck fails it the same way on this machine); WebKit cannot launch here.
8. **Corrections pass (user, 2026-11-03, `dist-single/slides-5-56-corrections.md`, rules G1-G12; visuals only,
   strings unchanged):** six parallel workers, one per section file. Shared: `Arrow` draws line then head, exits
   head then line (G8); `NeedleGauge` (only the needle turns: slides 5, 47, 50); `Bullet`/`BulletLine` (G7);
   `VisualTable` 560ms rows (G6); auto animation ON on any phone/tablet whatever the view (G12, `autoAnim.ts`);
   one `<SECTION>_CSS` export per section file wired in `cvDeck.tsx`. Slide changes: T09-1 split into `T09-1`
   (-d, --name) and `T09-1b` (-p, image); T11-5 and T11-6 merged into `PartB5` (`PartB6` is a stand-in, not in
   the deck): still 74 slides. G9 screenshot slides (13-19 `ShotPair` in install.tsx, 34-36 `BuildPair` in
   build.tsx): the TR has ONE capture per step, so the second picture is a zoom of the ringed part of the same
   capture. Human illustrations from `assets/icons/Icons` (`cv/icons/build-boy-laptop.png`, `compare-pointing.png`).
   Harness after the pass: video-safe CLEAN, box-overflow NO OVERFLOW, AUTO ANIMATION OK (617 presses),
   controls-clear CLEAR, mixed-align 0; qa only the brand frames (1/2/69/70/72/73/74) plus the 16px type-floor
   warning on figure labels (33 slides, untouched 60-67 included).
9. **Round 2 (user, 2026-11-03, five changes):** (1) screenshot zooms paired by number, not pointer lines: `ZoomBadge`
   (`cv/fx.tsx`, orange disc, white number) on each ring and its zoom, restarting at 1 per capture, in zoom order
   (13-20 `ShotPair` in install.tsx, 35-37 and 40 `BadgedCrop` in build.tsx; 30 and 39 have rings but no zooms);
   (2) T09-1 and T09-1b merged back into one slide (`RunCommand`; `RunCommand2` is a stand-in, not in the deck):
   **73 slides**; (3) T10-AN builds house floors, the dashed arrow, then FROM, line, COPY, line, EXPOSE, the rebuild
   (local frame, `IsoAnalogy` always shows its arrow); (4) T03-2 order: layers, writable layer, One view, merge
   arrows, copy-on-write arrow, copy, change; (5) THE AUTO-OFF FLASH: `entrance.ts` called `play()` on every
   block on every press, and a finished Web Animation rewinds on `play()`, so every block replayed (shown ones from
   0, hidden ones jumping to full then fading). Now a block already at its target is held; and `animSteps.ts`
   stamps each registry with a generation so a slide crossfading out neither rewinds nor registers into the next
   slide. `node auto-off-flash-check.mjs` (per-frame, both modes) must print AUTO-OFF FLASH CLEAN; it reports at
   the end only (~30 min for the deck) and the first run after an edit can fail on a cold dev server.
10. **Round 3 (user, 2026-11-04, scoped list; nothing else touched):** 13-19 (`ShotPair`) and 34-36 (`BuildPair`)
    lost every orange ring and numbered badge, on the capture and on its zoom; the zooms stay, one per press.
    28 (T09-1) lost the Nginx note. 30 (T10-1) lead replaced with the user's sentence verbatim (its full stop
    kept, as written). 38 split again: `PartB5` = Step 6 (T11-5), `PartB6` = Step 7 (T11-6, back in the deck),
    **74 slides**, so every slide from the old 39 on moved up one. Old 53, now 54 (T17-1): the fork's eight tags
    are icons only (`aria-label` keeps the words), left column unchanged. Checked on those slides only: typecheck,
    build:html, step walk in the student view, box-overflow NO OVERFLOW.
11. **Round 4 (user, 2026-11-04):** slide 40 (T11-7) lost its rings and badges (`BadgedCrop` deleted, plain `Crop`;
    steps strip, capture, zoom, caption). T05-S8 lost its caption box (the slide recentres, its rings stay), then
    T05-S8 and T05-S8b swapped: **20 = T05-S8b, 21 = T05-S8**. Checked on 20, 21, 40 only.
12. **Round 5 (user, 2026-11-04, screenshot groups A-D):** 13-19 (`ShotPair`) and 34-36 (`BuildPair`): no zoom copy,
    the capture whole with its orange rings back (no numbers), the step / capture / explanation one group centred on
    the slide (`SHOT_MID`, `frames.tsx`), sized to fit 221-648 (16px above the player bar at 664), explanation box at
    least 960 wide, scale never above 1. 40: zoom gone, capture whole with both rings, 124 -> 144 tall. 21: 286 -> 360
    tall. Every screenshot frame (`Crop`, `ShotView`) square-cornered, nothing clipped. `shots-hd/` regenerated from
    `shots/` for the 15 captures the deck uses: 4x Lanczos, unsharp (r4 200%, then r1.5 110%), back to 2x; the TR docx
    and PDF hold the same pixel sizes as `shots/`, so no sharper source exists. 38's capture is soft in the TR itself.
