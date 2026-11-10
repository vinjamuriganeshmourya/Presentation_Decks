# Cloud Computing · "Cloud Computing Fundamentals"

The session deck for the first cloud computing session. Read this before
editing it. The kit rules are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`.

- **Plan:** `../session_plans/cloud_computing_fundamentals/plan.md` (signed off on
  the user's word, 2026-10-14).
- **Source:** `Reference ppt's/cloud-computing-fundamentals 1.html`, content only.
  Every on-slide string is the reference's; its TR speaker notes are the notes.
- **Deck file:** `src/decks/cloudDeck.tsx`, 68 slides (53 until the 2026-10-15 review split eleven; 64 until the 2026-10-16 review split five more; 69 until the feedback slide was deleted on 2026-10-22). Port 5270
  (`npx vite --port 5270 --strictPort`; the kit's vite.config says 5173).
- **Figures:** `src/decks/figures/`. `scene.tsx` (Card, Stage, Rail, Label,
  Arrow, Slider, useLoop, useCycle), `why.tsx` (slide 5), `art.tsx` (every drawn object), `people.tsx` (the
  cast), `analogy.tsx` (the eleven analogy scenes), one file per section
  (`basics`, `history`, `traits1`, `traits2`, `benefits`), `closing.tsx`
  (takeaways). `cast/` is the character lab's rig, vendored unchanged from
  Python 31, with `Cast.tsx` (Idling, Posed, crops).

## Decisions

1. Eight "continued" pairs from the reference are one slide each.
2. Every figure body is one 1110px box on the left edge (content rule 38).
   Scenes inside it are absolutely placed on fixed stages, so a step never
   moves what is already there.
3. Labels, notes, controls and badges never render under 14px (`scene.tsx`
   floors them). qa still warns about the 16px floor on figure labels; the
   rail bullets and every heading are 16px or more.
4. Arrow svgs are sized to the line and its heads only, because
   `overlap-check.mjs` reads an arrow by its svg box.
5. No autoplay: `AUTOPLAY_ON_BY_DEFAULT` is emptied at the bottom of
   `cloudDeck.tsx` (it ships holding Python 31's numbers).
6. Key Takeaways is `figures/closing.tsx`, not the kit's slide: the kit's ran
   the fifth item under the player bar.
7. Live loops (`useTicker`, CSS spins) hold still on `?all`, `?noauto` and
   `?still`, or harness screenshots stall.
8. No drag-to-move content. Since the 2026-10-16 review spec there are no live
   controls at all: every scene that had a button or a slider runs itself
   (`useLoop`, `useCycle`, `Slider auto`), and `Control` in `scene.tsx` is unused.
9. The step/slide switch is hidden (`player.hideModeSwitch`, course rule R1 in
   `../workflow/skills/cloud-computing-course/SKILL.md`, 2026-10-23): the deck
   animates itself and reports 0 build steps, so the switch had nothing to
   choose. Hidden, never removed: `S` is a no-op, the browser's saved mode is
   ignored, `?nav=steps` on the URL still works for the harnesses.

## Checks, and the numbers this deck passes them with

```bash
export CHROME_PATH=/usr/bin/brave-browser
U="http://127.0.0.1:5270/?all"
node qa.mjs "$U" 68; node video-safe.mjs "$U" 68; node align-check.mjs "$U" 68; node mixed-align-check.mjs "$U" 68
node box-overflow-check.mjs http://127.0.0.1:5270 68; node controls-clear-check.mjs http://127.0.0.1:5270 68; node .text-audit.mjs 1 68
node workflow/export/build-reveal-steps.mjs "http://127.0.0.1:5270/?nav=slide&x=" 68
AGENDA_SLIDE=3 node agenda-check.mjs; node ligature-check.mjs; node overlap-check.mjs   # feedback-check.mjs no longer applies: the feedback slide was deleted on the user's word (2026-10-22)
CONTENT_SLIDE=5 node gesture-check.mjs; CONTENT_SLIDE=5 node phone-nav-check.mjs
CONTENT_SLIDE=5 PLAIN_SLIDE=2 node autohide-check.mjs   # no slide has an in-slide button since the 2026-10-16 spec; the tap-on-a-button step reports itself skipped
node nav-stress-check.mjs $PWD/dist-single/cloud-computing-fundamentals.html chromium
```

## 2026-10-15 review: splits, no builds, transitions, picker thumbnails

- **Splits.** A slide whose lead/definition crowded its points and picture is two
  slides: the statement alone in `Statement` (`scene.tsx`, one 1110px box,
  highlighted phrases, a small static picture), then the points and the picture
  with no lead. Slides 6, 18, 21, 24, 38, 39, 41, 42, 44, 46 (old numbers);
  34 splits as chart, then table. Slide 11 and 16 copy is the review's, word for
  word. Slide 47 lost its balances (they repeated the table's six strings); slide
  38's balance lost the pair labels under its pans for the same reason, and
  slide 21 lost the "what cloud inherited" panel (it repeated Cloud Legacy).
- **No builds.** `revealEveryStep()` (kit `Stepper`, session-local change) shows
  every beat on mount and reports 0 steps, so every press is a slide. `Card`
  renders no Next and no Autoplay. `isNow()` in `scene.tsx` returns false, so no
  bullet or row is lit as "the current beat".
- **Transitions.** `player.smooth` (kit `Deck`/`types`, session-local): every
  move, including the plain arrows and the picker, plays the deck's one `slide`
  transition (fade + 120px, 0.6s, `[0.22,1,0.36,1]`, the reference's numbers);
  no held-header cuts; `prefers-reduced-motion` turns it into a plain fade.
- **Element entrances.** `figures/entrance.ts`: on each slide mount (a
  MutationObserver, before first paint) every text block, drawn box and picture
  under the header gets opacity + `translate` 26px, 0.55s, same curve, from
  0.25s, step <= 60ms shrinking with the unit count so the last ends by 1.5s;
  text and boxes before pictures. Kit entrances (agenda, divider number, quiz)
  are sped to end by 1.5s too. Off on `?all/?noauto/?still`.
- **Picker thumbnails.** `player.thumbnails` (kit `SlidePicker`, session-local):
  each card renders its slide live at 1280x720 under InstantContext, scaled,
  lazily (IntersectionObserver, 3 mounts per frame), kept mounted while open.
  Cards are `div role=button` (a slide's own buttons cannot sit in a button).
  `useTicker` and `Idling` hold still under InstantContext, or 64 live rigs drop
  the picker to 12fps.
- **KIT FILES WITH SESSION-LOCAL CHANGES:** `src/motion/Stepper.tsx`,
  `src/deck/Deck.tsx`, `src/deck/types.ts`, `src/deck/SlidePicker.tsx`.
  `sync-kit.mjs --apply` overwrites them; the deck then fails to typecheck on
  `revealEveryStep`, which is the signal. Re-apply from git before shipping.
- **Checks.** autoplay-check no longer applies (nothing autoplays); every slide
  reports 0 reveal steps. Analogy scenes still run their live loops, so a
  `?still` frame and a live frame differ on 30, 37, 47 by design.

## 2026-10-16 review: Character Lab style, no people, no underlines, glide

- **Splits** (old numbers 15, 17, 29, 32, 46): `mainframes-2`, `virtualization-2`,
  `self-service-2`, `pooling-2`, `capex-points-2`, each right after its parent.
- **Clay finish.** `art.tsx` `CLAY`/`ClaySvg`/`mountClayDefs`: the Lab's
  `ClayFilter` at object scale (rim shade away from an upper-left lamp, rim light
  toward it), on every top-level part of every object svg; `data-flat` opts a part
  out. New drawings: `clay-a.tsx` (basics), `clay-b.tsx` (history), `clay-c.tsx`
  (traits), `clay-d.tsx` (benefits), one per section, all on `ClaySvg`.
- **People.** `cast/` re-copied from the Lab's clay restyle (2026-10-16);
  `people.tsx` is the Lab presets (no `rohan`: no beard anywhere; `BAKER` beardless).
  Faces were removed everywhere the review asked; people remain only in the
  reading room (17) and the mess kitchen chef and students (37). Every rig holds
  one frame (`Idling` is always still: no animation unrelated to content).
- **No underlines** (content rule 49): Statement highlights are brand colour,
  semibold; the feedback link underline is off in `src/slides/FeedbackSlide.tsx`
  (kit, session-local). The kicker's gradient divider STAYS (user, same day: part
  of the template, a must on every slide).
- **Sentence case** on every label; `.text-audit.mjs` checks it and underlines.
- **Agenda:** five titles only, no sub lines.
- **Entrances in reading order** (`entrance.ts`): top to bottom, left to right
  within an 18px row; an svg path with `data-draw` draws itself on in its slot
  (the NIST tree's connectors, slide 8).
- **Glide transition** (`src/motion/presets.ts` 'glide', used by `Deck` when
  `player.smooth`): opacity + a literal `transform: translateX(±60px)`, 0.6s,
  `[0.22,1,0.36,1]`, so framer hands both to the compositor (WAAPI) and a heavy
  slide's mount frame cannot jerk it. Reduced motion: fade.
- **KIT FILES WITH SESSION-LOCAL CHANGES** now also: `src/motion/presets.ts`,
  `src/slides/FeedbackSlide.tsx`.

## 2026-10-16 slide 5: the reference render's own illustration

The user supplied a rendered reference for slide 5 ("Cloud Computing: From
Guesswork to Scale.png", a 3D-render infographic of the same content) and,
after two redrawn passes (clay solids, then the render's gradients and glows)
asked for the exact illustration, proportionate to the slide, with the
render's graphics used on the cards. So the cards ARE the render's cards.

- **Pipeline** (PIL, recorded here because the images are derived): the
  render's text (two card titles and notes, the two left chips, the billed
  pill and its stub) is wiped by a horizontal gradient fill across each text
  block; each card is cut six pixels inside its border (714x386 and 756x386)
  and one lit and one frosted tile is cut per column (80x39, cells at x 84,
  189, 294 and y 243, 287, 331 of the right cut). Output in
  `src/decks/figures/img/`, imported as modules so the single-file build
  inlines them. The deck's DOM text sits where the render's did (rule 17).
- **Layout** (`figures/why.tsx`): two stages 522x284 and 558x284 (the cuts'
  proportions, 1% off), each `background: url() / 100% 100%` over the card
  skin's shadow; chips from x=246 on the left (clear of the coins at 231),
  the billed chip centred under the meter at x=414; the crate and calendar
  (clay, the render has none) appear on the left card's lower right when
  short.
- **What moves** (review 2026-10-16 global rule 3): `useLoop` ping-pong, one
  lap every 8s, drives `<Slider auto fill>` (no hand can move it) and the
  picture follows: chip numbers, and nine tile overlays, each the render's
  own lit or frosted cut, cross-faded where a cell's state differs from the
  base (top row lit in the render). Held at demand 0.25 on harness URLs, the
  render's own numbers (2 billed, 4 paid idle). The meter needle and the
  rack's lights are the render's pixels and do not move.
- **Earlier passes kept on disk, unused by the slide:** `depth.tsx`
  (palette and helpers), `rack.tsx` (`IsoRack`), `cloud.tsx` (`GlossCloud`,
  `Cables`, `ServerTile`, `MeterTile`); `card.tsx` (`CARD_SKIN`, the layered
  CSS card: white bloom, blurred brand hill, pale base, inset rim, three
  shadows) is still what `Stage raised` spreads and what slide 5's shadow
  comes from.
- **Scene-kit opt-ins, all off by default:** `Label` `icon`, `iconRound`,
  `raised`, tones `solid` and `lift`; `Slider fill` and `Slider auto`;
  `useLoop` and `useCycle` (every loop holds still on harness URLs and under
  InstantContext).

## 2026-10-16 review spec: title slides, no clipping, loops not hands

The pasted spec ("ROLE / GLOBAL RULES / SLIDE-SPECIFIC CHANGES"): title
slides show only the title (the five section dividers lost their subtitle
in `cloudDeck.tsx`); nothing clipped anywhere; every manual interaction is an
automatic seamless loop (`useLoop`, `useCycle`, `Slider auto` in
`scene.tsx`); motion only where it explains the content; one easing and one
set of durations (state 520ms, arrow draw 860ms, entrance 0.55s, loop lap
8s, step 2400ms). Applied by five parallel agents, one per figure file; their
per-slide changes are listed in the review report given to the user.

- **Per-file hooks the agents added** (candidates for `scene.tsx` if a third
  file wants them): `useDrawn(delay)` in history.tsx and analogy.tsx (true once
  entrances settle, so an `Arrow` draws on mount; true at once on harness
  URLs), `useGo(ms)` in traits1.tsx (the same idea, imported by traits2.tsx),
  `useGrown()` in benefits.tsx (a graph grows along time on open).
- **Cast.tsx** gained `Posed alive` / `Idling alive` (blinks, glances, a
  degree of joint drift, `presentHold` for the chef), still on harness URLs
  and under InstantContext, and `FACE_WHOLE` (a crop that keeps hair). Slide
  37's chef hand and the students' heads were the two clipping defects found
  across the deck; nothing else was clipped.
- **Live-frame screenshots.** Playwright's `page.screenshot` waits on
  `document.fonts.ready`, which never settles on a slide that mutates svg
  attributes every frame (or an `alive` rig); the harness URLs hold every
  loop still so the checks are unaffected, and a live frame is taken through
  CDP (`scratchpad/an/shotcdp.mjs` of that day) or after moving per-frame
  motion onto transforms (slide 40).

## 2026-10-16 motion layer: every visual says what it is

The pasted "Motion & micro-animation layer" spec: on top of the design, every
visual element loops subtly with motion that expresses its meaning (the
catalog: screens type, clouds levitate, LEDs blink, toggles throw, gears
spin, arrows flow, signals ripple, locks lift, ticks pop, alerts shake,
bulbs glow, charts breathe, clocks tick, rockets hover, characters breathe),
and anything without a semantic match gets the default float. Text is never
animated beyond its entrance. This supersedes the earlier review spec's
"nothing decorative" for idle motion; it does not reopen anything the user
asked to keep static (slide 1's background, the logo).

- **The layer** is `figures/motion.ts`: `MOTION_CSS` (keyframes and one class
  per kind, mounted by the deck after `ART_CSS` and `SCENE_CSS`) and
  `mo(kind, seed, { dur, base, knob })`, which returns the class list and a
  per-element negative delay from a golden-ratio seed so a group is never in
  step. Transform, opacity and stroke properties only; `.mo` sets
  `transform-box: fill-box` for svg parts.
- **Off switches** are in the CSS itself: `.cc-still .mo` (harness URLs),
  `.deck-thumb .mo` (picker thumbnails) and `prefers-reduced-motion` all set
  `animation: none`. Inactive slides are unmounted by the deck and a hidden
  tab paints nothing, so nothing else pauses them. Every harness frame is
  therefore the still design; a live frame pair 0.8s apart shows the motion.
- **Placement rule.** A motion class goes on an inner `<g>` or a wrapper,
  never on an element whose inline `transform` or `transition` a state change
  drives (a Fade, a needle, a growing bar), or the loop replaces that
  transform. Where a float's 6px travel has no clearance, `hover` (3px) or
  `pulse` (scale 1.03) is used, so no footprint grows.
- **Arrows** (`scene.tsx` `Arrow`): a lighter dash rides every solid arrow from
  source to target (`mo-dash`), and a dashed arrow's own dash moves.
- **Slide 5** is the reference render's pixels: its rack, cloud and meter
  cannot carry inner motion, and a photographed card floating would read as a
  loose plate, so the two cards stay still (the slider and its chips and
  tiles already loop). Flagged to the user as the one exception.
- Applied by five parallel agents, one file group each; the per-visual list
  of assigned motion is in the report given to the user.

## 2026-10-16 same style for all: slide 5's cards and pictures are the standard

The user: "you have slide 5 for image style reference and boxes reference,
apply that to all slides, same style for all." So:

- **Boxes.** `Stage` is `raised` by default (`CARD_SKIN`, card.tsx): every
  scene card, statement card and analogy card is the same plate as slide 5's.
  Row boxes and inner tiles take `TILE_SKIN` (card.tsx: the same base, rim
  and top highlight, a shorter shadow, no hill): the kit `Rail` rows in
  scene.tsx, and every locally styled point row, era card, device tile,
  table frame and map frame in the section files. A `Stage` nested inside
  another is `raised={false}` with `TILE_SKIN`, so plates never stack.
- **Pictures.** Slide 5's pictures are the render's pixels; no render exists
  for the other slides, so their drawings are restyled to the same look with
  the depth system (`depth.tsx`: palette `R`, `Lin` gradients, `GlowDef`,
  `Shadow` + `BlurDef`): a front face, a lit top, a darker side, a specular
  on the upper left, glows on lights, a blurred cool ground shadow; frosted
  glass for inactive things; gold with a radial highlight. `rack.tsx` and
  `cloud.tsx` are the worked examples. The motion-layer classes, state
  behaviour, props, footprints and DOM labels are untouched by the restyle.
- Applied by five parallel agents, one file group each (art, clay-a+b,
  clay-c+d, analogy, section scene files), after the shared Stage/Rail
  change.

## 2026-10-22 review: TR comparison, slides 22/30/57, colours, feedback slide, 2 to 4 s cadence, two views

The user's pasted brief (Parts A, B, C). Part A is a report, no edits:
`../workflow/reviews/cloud_computing_fundamentals.tr-comparison.md` (the deck
against `Reference ppt's/1. Cloud Computing Fundamentals.pdf`, wording changes
on every slide, missing content after slide 34, deck content with no TR
counterpart). Its headline: the PDF is a LATER revision than the deck's source
build, so seven point slides (22, 31, 50, 54, 56, 59, 62) carry older bullets
and slide 34 carries none of TR slide 13's four bullets; nothing was changed
for it.

- **Feedback slide deleted** (user: "Feedback slide: Delete it"). 69 → 68
  slides. Content rule 41 is overridden for this deck only; `feedback-check.mjs`
  no longer applies.
- **Slide 22** (`GridScene`, history.tsx): bullets 16 → 20px in a 452px column
  that stretches to the stage's 392px (`justify-between`); picture one size
  smaller (institutions 70, cloud 156, meter 84) on a 642px stage; the four
  notes 17px, two columns, wrapping.
- **Slide 30** (`TraitRing`, traits1.tsx): ring on a 480x396 stage (rx 165, ry
  134, boxes 138x48, centre tile 150x104); rail 614px at 20px.
- **Slide 57** (`CupboardAnalogy`, analogy.tsx): redesigned as two self-running
  clay scenes (kitchen with bolted cupboards, a doorway and the moving box,
  free things leave and the cupboards strain and snap back; the application
  plugged by cables into one provider's cloud, lifting toward another and
  pulled back, a padlock clicking shut). Local helpers `Kitchen`, `Lamp`,
  `Plant`, `AppMark`, `MovingDay`, `PluggedIn` in analogy.tsx. One new chip,
  "Bolted on".
- **Colours** (user: "visuals look washed out, apply the reference's palette,
  increase saturation and contrast"): the reference is the slide 5 render.
  `art.tsx` `ART_CSS`: `svg.cc-clay { filter: saturate(1.28) contrast(1.06) }`
  on every drawn object, and the clay rim shade is a cool navy (#2F3F86)
  multiply instead of the Lab's violet-grey; `clay-b`/`clay-c` `LAB` pastels on
  the render's hues (sky #6DAAFF, lavender #D3E1FB, paper #EDF3FD, sage, green,
  steel, cash); `card.tsx` deeper card foot and hill, rim #C4D4F2, firmer
  shadows; `scene.tsx` plain/lift chips white-to-blue with a #B4C8EE ring;
  `basics.tsx` `WELL` bluer; `tokens.ts` + `tailwind.config.ts` (kit,
  session-local) `muted` #6B7F95 and `line` #C4D4F2.
- **Cadence** (user: "delay between element appearances 2-4 seconds, shorter
  for small elements, longer for large or complex ones, consistently"):
  `entrance.ts` rewritten. A unit is what the room reads as one element
  (`collect`: a text block, a picture, a tile with its dot and text, an icon
  with its label, a table ROW, an agenda line, a stacked ring-and-disc; a
  card or stage is a container that enters first); the gap before a unit is
  2s (small), 3s (medium: a card, a table row, a picture of many parts), 4s
  (a stage-filling picture), by area and part count (`tier`); containers 2s.
  `Arrow` svgs (`data-cc-arrow`) come last, 0.6s apart, and each draws only
  once on screen (`cc:entered` event, read in scene.tsx `Arrow`). The kit's
  own framer entrances (agenda lines, divider number, quiz, captions, the
  brand greeting's letters as one word) are re-timed into the same sequence
  two frames after mount and again at 260ms (`merge`). The header (kicker,
  title, lead) keeps the kit's 0.12s/0.09s arrival. Result: content slides
  take 15 to 58s to fully appear (`scratchpad` cadence summary of that day:
  analogy scenes longest). `holdToBudget` and the 1.5s budget are gone.
- **Presenter and student views** (kit files, session-local; the Part C
  agent's work): `src/deck/presenter.ts` (view detection, state
  `{skipped, deleted, edits}` in localStorage key
  `nxtwave.deck.cloud-computing-fundamentals.presenter`, student HTML
  builder, download), `src/deck/pristine.ts` (captures the built page's HTML
  before React runs; imported first by `main.tsx`), `src/deck/SlideMenu.tsx`
  (the list behind the counter, both views), `src/deck/EditLayer.tsx`
  (text hosts keyed `t<n>` in document order; edits applied on mount; edit
  mode finishes the entrances and makes hosts contenteditable). `Deck.tsx`
  navigates the ACTIVE list (slides minus deleted minus skipped), tracks the
  current slide by id, wires menu/edit/download; `DeckControls.tsx` counter
  is the menu toggle, Edit text and Download buttons presenter-only;
  `SlidePicker.tsx` Skip/Unskip/Delete/Reset text per card, SKIPPED/EDITED
  badges, "N deleted · Restore all". Student view = `__DECK_STATE__.view` in
  the downloaded file (`<title>-student-view.html`: pristine page + injected
  `{view:'student', hidden, edits}`) or `?view=student`; it reads no
  localStorage. Harness flags (`?all/?noauto/?still`) force presenter with no
  stored state, so every check sees the full deck. `align-check.mjs` CHROME
  rect widened to x2 480 for the two extra buttons.
- **KIT FILES WITH SESSION-LOCAL CHANGES** now also: `src/deck/DeckControls.tsx`,
  `src/main.tsx`, `src/design/tokens.ts`, `tailwind.config.ts`, plus the four
  new `src/deck/*` files above, and `align-check.mjs`.
- **Checks under the cadence:** `box-overflow-check.mjs` and
  `controls-clear-check.mjs` open `?nav=steps&still&v=N` now (session-local
  edit): without `still` they measured units mid-entrance (held 26px low)
  and reported 42 false overflows. Every other check already runs under
  `?all`, `?noauto` or `?still`, where entrances are off. `nav-stress-check.mjs`
  settles 800ms (not 350) after a single press: every move plays the 600ms
  glide, so at 350ms the departing layer is mid-exit by design (it unmounts
  by 2.3s; verified with a bisect script, not a stacking defect).

## 2026-10-22 second pass: cadence by context, PDF re-sync, softer colours

- **Cadence** (user: "the maximum reveal time is 4 sec, no minimum, by
  context"): `entrance.ts` gaps are 0.6s (chip, bullet, icon with label),
  1.5s (card, table row, picture of many parts), 3s (stage-filling picture),
  4s (stage-sized picture of very many parts, the cap); a container plate
  1s; a connector 0.4s. Order is the figure's document order (a left column
  finishes before the right starts); only a stage's absolutely placed parts
  go in reading order, and a stage's arrows draw right after its last part.
- **Colours softened**: `saturate(1.18) contrast(1.04)`, clay shade at 0.8 of
  its opacity, rims and `line` #CFDCF5, chip rings #C3D3F0.
- **Re-synced to the TR PDF** (the PDF is the later revision): 6 (exact
  SP 800-145 definition), 11 (Front end / Back end), 12 (TR bullets in the
  three cards), 18 (TR's four bullets), 19 (Clients / Servers definitions),
  22, 31, 34 (TR's four bullets beside a 700px device stage), 48 (sentence
  case heads), 50 (five rows, Reserved Instances its own), 54 (Business
  value added), 56 (IaC), 59, 62 (Latency label back, GDPR gone); analogy
  clauses added on 37, 45, 52, 60. 30's ring is larger (520px stage).

## 2026-10-22, last word on timing: restored to the 2026-10-16 entrances

Both 2026-10-22 cadences (2-4s gaps, then "max 4s by context") were built and
then reverted on the user's word: "restore to before today timings, it is
perfect; I will say which slide needs some speed up". `entrance.ts` is the
committed version again (0.25s first unit, step <= 60ms, everything by
1.5s), and `Arrow` no longer waits for a `cc:entered` event. Change timing
only for the slides the user names. The two cadence sections above are
history, not the current behaviour.

## 2026-10-22 motion pass: purposeful motion only, finished visuals, 60fps

The user's pasted brief (hard rules: visuals only, never the header; do not
strip visuals of motion; idle loops off unless they mean something;
transform and opacity only; eased; rAF; no stepped motion).

- **Idle policy** in `motion.ts`: float, hover, levitate, shadow, pulse,
  breathe, scan, shake, pop, shackle and breath are no-op classes now (the
  `mo()` calls stay so nothing had to be rewritten); blink (LED running),
  dash (flow), spin (gear, fan), tick (clock, now a smooth sweep instead of
  `steps(12)`), wave, type and cursor (screen activity; the caret fades
  instead of `steps(1)`), knob and track (a toggle throwing), flicker and
  glow (a light on, amplitude 0.72 to 1) stay. The `alive` rigs on 37 stay.
- **Speed-ups:** 14 (timeline lap 8s to 6s), 16 (turn 2400 to 1800ms, job
  dot 0.9s), 17 (turn 1800ms, fades 500ms). Header untouched.
- **Slide 23:** `RollingTruck` local to analogy.tsx: body and wheels in one
  svg, the truck drives out and back on a transform keyframe and each wheel's
  angle is a function of the distance travelled, so they stop together.
- **Slide 62:** bullets 19px in a 452px stretched column, map stage 642px.
- **Incomplete visuals completed:** 6 (laptop wire now reaches the cloud),
  8 (branch boxes one height), 11 (laptop tied to Client Infrastructure;
  back-end building rebuilt with plinth, roof units, door), 18 (hypervisor
  stack fitted to its well), 54 (chart axis and baseline).
- **Layout-property tweens converted to transforms:** 14 timeline fill,
  17 book slide, 39 vertical-scaling block, 41 rubber band (rebuilt in three
  parts), 33 ATM card and note, 51 bars (translateY in a clipping well), 54
  production fill, 59 bill (two bills cross-faded instead of a path morph),
  slide 5 slider fill (scene.tsx `Slider fill`, a scaled bar under the input).
- Forward-only clock hands on 15 and 16; 32's arrow drawn once.

## 2026-10-22 polish pass: 44, point sizes, icons, 14, 23, centring, 47/49/58 motion, 51, 59

- **Visual centring** (`scene.tsx` `Card`): once per mount, the content column
  under the header (`[data-zone="space1"]`'s first child: the lead block AND the
  body, as one) is moved down by `translateY(slack / 2)` when more than 24px of
  room sits between its foot and y=640 (above the player bar). Kicker, divider
  and title never move. Measured with the transform cleared and only once: a
  first version re-measured the already-moved body every render and the content
  rocked up and down; a second moved the body but not the lead, which the user
  called out ("the text needs to be associated with the content").
- **Slide 44**: meter step 2400 to 1500ms, state ease 360ms, `MeterDial` needle
  ease 700 to 450ms (`art.tsx`); points 18px in a 452px `PointColumn`
  (traits1.tsx, level with the stage); stage 642, dials 54.
- **Point sizes up one step everywhere** (rails 16 to 18 on 34, 40, 44, 54, 56,
  59 via `PointColumn`/`StretchRail`; 39 card lines 16; 10 table 16; 12, 11, 8
  bodies 16; 65 titles 18 and lines 16; every 14px chip on the analogy slides
  15; 16, 19, 22, 24 labels up one). Where 17 or 16 would not fit, the report
  of that day says which stayed.
- **Icons**: padlocks redrawn in all five drawings (clay-b `ClayPadlock`, clay-c
  `ClayLockIcon` on 36, clay-d `ClayPadlock`, art.tsx `Padlock`, analogy.tsx's
  local `Padlock` on 57): a thick rounded shackle on a body with a keyhole,
  never under 18px. 65's balance is clay-d's `ClayBalance`.
- **Slide 14**: lap 4.8s, reveals 420ms, link draw 680ms.
- **Slide 23**: the truck is parked; each wheel rotates in place, 1.6s a turn
  (the earlier drive-and-return read as jitter).
- **Slide 47** the balance tilts (useLoop 6s), **49** the meter sweeps (6s),
  **58** the bell rings in bursts (4.2s), all transform-only; **51** bars grow
  once and Reserved Instances switches on once at 3.2s (the 2.4s toggle was
  the "glitch"); **59** points 18px, the visual a size smaller.
- **Slide 11 arrow** (user's one-time fix, and the pattern rule): the pill has a
  fixed width (`PILL_W`), the laptop is placed with its centre on the pill's
  centre line (`LINE_Y`), and the dashed arrow runs horizontally from the
  laptop's right edge to the pill's left edge, all from the same constants, so
  a regeneration cannot drift. Any arrow-to-label pair is built the same way.

## 2026-10-22 four permanent rules (generate-slides SKILL.md section 2c, RULES.md)

- **Quiz slide** = reference slide 25 of `Reference ppt's/virtualization-and-hypervisors 2.html`,
  rebuilt in `src/ui/foundations/ClassroomQuiz.tsx` (session-local kit copy):
  pill, `Quiz Time!`, bar, the four layered pictures; a clock glyph + `mm:ss`
  timer where the yellow dot stood (the reference has no timer; built to the
  user's words), held at 00:00 on harness URLs and in thumbnails. Slides 27
  and 64. The three instruction lines live in the slide notes.
- **Key Takeaways** = `slidestraining/Untitled` (reference only), rebuilt in
  `closing.tsx`: check discs + bold head and rest, the cheerful student at the
  lower right; assets copied to `public/assets/takeaways/`.
- **Segmented progress bar**: `src/ui/SectionBar.tsx` (new) in `SlideBase.tsx`
  where the plain foot band was; `Deck.tsx` derives `segments` from the
  `SectionBreakerSlide` elements over the ACTIVE list and exposes `jump`;
  `DeckContext.ts` carries both; `index.css` band 8 to 6px. One segment per
  agenda point, proportional widths, 3px gaps, own-section fill by scaleX,
  click/tap jumps to the breaker, hover/tap label never in the DOM at rest or
  on harness URLs.
- **Arrow to label** built from the label's fixed width and centre line (slide 11).
- Kit template (`slide-kit/slide-template`) NOT updated: the rules name this
  session's files as the reference implementation; a kit PR is pending the
  user's word, as for the other session-local kit changes.
- **KIT FILES WITH SESSION-LOCAL CHANGES** now also: `src/ui/SlideBase.tsx`,
  `src/ui/SectionBar.tsx` (new), `src/ui/foundations/ClassroomQuiz.tsx`,
  `src/index.css`, `src/deck/DeckContext.ts`.

## 2026-10-23: bar without progress, quiz timer per slide, takeaways = agenda titles, blue lock

- **Section bar** (`src/ui/SectionBar.tsx`): six EQUAL segments, no progress
  fill, 4px tall (`index.css`), 3px gaps; opacity only (0.55 rest, 0.92 the
  current section, 1 hovered); hover/focus/tap mounts a 240x135 preview of the
  breaker slide (its element live under InstantContext in `.deck-thumb`, `inert`)
  with the section name, never in the DOM at rest or on harness URLs; click,
  tap, Enter jump to the breaker. `DeckSegment.element` added.
- **Slide 64**: `ClassroomQuiz timer={false}` (clock glyph + YOUR TURN only);
  27 keeps the count.
- **Slide 65**: the five agenda titles only, 24px; the student's picture foot
  on y 720 so the foot band crosses her shins (the reference's relation),
  right edge 1160, body box fixed-height so the centring rule has no slack.
- **Slide 55**: `ClayPadlock` (clay-d) redrawn as a finished blue clay lock
  (cloud blues, steel-blue shackle entering the body, navy keyhole); `open`
  and `tone` still work for 56.
- Rules: generate-slides SKILL.md §2c updated (bar subsection replaced, quiz
  and takeaways addenda); RULES.md row updated.

## 2026-10-23, second pass: 17, 33, 37, 44, 51, and a fresh TR comparison

- **Slide 51**: the bar is ONE block growing by `scaleY` with a rounded top; the
  separate translated cap read as a slab floating before the bar reached it
  (it was not an entrance unit, so it showed while the bar faded in). Gone.
- **Slide 44**: step 1000ms, state ease 240ms, `MeterDial` needle 300ms.
- **Slides 33, 37**: scene steps and eases quickened (analogy.tsx); **17**: the
  book no longer slides (a filtered clay svg moved by a transition re-rasterises
  its filter every frame and stutters); the turn is shown by a state change in
  place.
- Fresh comparison report:
  `../workflow/reviews/cloud_computing_fundamentals.tr-comparison-2026-10-23.md`.

## 2026-10-23, third pass: Firefox smoothness, quiz pill everywhere, 51 static

- **Firefox** (user: "I am using Firefox, it needs to render the same in every
  browser"): Playwright's HEADLESS Firefox (software rendering) measured the
  entrance at 33 to 48fps with 150ms frames and 27 to 35fps at 1080p, and a
  long bisect (shadows, filters, gradients, rounded clips, WAAPI vs CSS, zoom)
  only ever reached 58 by stripping shadows. Then a HEADED Firefox on this
  machine's Intel GPU (`scratchpad/fpsheaded.mjs`, `DISPLAY=:0`) measured 57
  to 62fps at 1080p and 60 at 720p with the deck AS IT IS, shadows held or
  not. So: the headless numbers were the software renderer, not the deck;
  nothing in the deck was changed for Firefox (a `will-change` on clay svgs
  and a shadow-hold during entrances were both tried and reverted). The one
  real Firefox defect was slide 17's book moving under its clay filter, fixed
  above. Measure Firefox HEADED from now on.
- **Quiz**: `ClassroomQuiz` `timer` defaults to false (slide 64's design on
  27 too); SKILL.md §2c addendum updated.
- **Slide 51**: bars grow once and stay; the Reserved Instances rate is a chip
  (`Reserved Instances: a lower rate`), no second motion on the bars.

## 2026-10-23, fourth pass: slide 18 loses its third point

- **Slide 18** (`HypervisorScene`, history.tsx): the third of the TR PDF's four
  bullets, "Each virtual machine runs its own OS, isolated from others", and its
  OS-window picture were removed on the user's word ("remove the 3rd point
  entirely from the slide 18"). Three rows remain; the Card's centring rule
  takes up the slack. The lead sentence still carries "each with its own OS".

## 2026-10-23: the step/slide switch is hidden

The user: hide the step wise / slide switch, do not remove it, in every cloud
computing session, because the deck auto-animates. `player.hideModeSwitch: true`
in `cloudMeta`; the option is `DeckPlayerOptions.hideModeSwitch` (`types.ts`),
honoured by `Deck.tsx` (mode pinned to `slides`, the toggle a no-op, the
browser's saved choice skipped), `DeckControls.tsx` (`mode` is `null`, so all
three bar layouts drop it) and `useKeyboardNav.ts` (`initialArrowMode(remembered)`;
the URL's `?nav=` is still read because the harnesses drive the deck with it).
Verified on the built file: no "Plain arrow keys" button at 1280x720 or 390x844,
`S` writes nothing to `localStorage`, `nav-stress-check.mjs` clean in both modes.
Course rule R1 in `../workflow/skills/cloud-computing-course/SKILL.md`.
- **KIT FILES WITH SESSION-LOCAL CHANGES** now also: `src/deck/useKeyboardNav.ts`
  (`Deck.tsx`, `DeckControls.tsx` and `types.ts` were already listed).

## 2026-10-23: the book slides on 17, the footer mark is half size

- **Slide 17 (`mainframes-analogy`, `ReadingRoom` in `figures/analogy.tsx`),
  this session only.** The user: the book must be animated and slide across
  the readers to the one the blue glow highlights. The book now rides a wrapper
  `div` whose `transform: translateX(seats[turn] - seats[0])` follows the same
  `turn` as the glow (`useCycle(4, 1800, 1)`, 500ms ease, `will-change:
  transform`). A literal transform, never `left`: the first attempt moved
  `left` and the clay filter re-rasterised every frame. Verified on the built
  file: 0, 103, 206, 309px then back, glow opacity following, overlap-check
  clean. Held at seat 2 on harness URLs.
- **Footer mark at 50 percent, every deck (content rule 50).** `src/ui/SlideBase.tsx`
  draws `<Logo className="h-[18px]" />`, 18px for the old 36px (`h-9`). The
  same edit is in the kit template's `SlideBase.tsx`, which must go out as a
  kit PR on its own branch, not with this session's branch. Measured 18px on
  the built file; qa still finds the mark on every frame but the hero frames.
- **KIT FILES WITH SESSION-LOCAL CHANGES** now also: `src/ui/SlideBase.tsx`
  (already listed under the 2026-10-22 section; the footer line changed again).

## 2026-10-26: fixes to the supplied `dist-single/cloud-computing-fundamentals 2(2).html`

The user supplied an older build (before 2026-10-23's slide 15 row removal, the
book slide on 17 and the half-size footer mark) and asked that only five things
change in it, so that file was patched in its own bundled code, not rebuilt.
The same fixes were mirrored here so the next build carries them:

- **Slide 12** (`Drivers`, basics.tsx): the Cost card's cloud well is
  `PayGoMeter` (clay-a.tsx, a usage meter and a rupee coin) instead of the
  `PayMeter` dial the user read as a clock. In every card the wells now start
  right under that card's own text (142 under two points, 96 under one); the
  picture is centred above a bottom-aligned label.
- **Slide 22** (`GridScene`): the four note tiles under the picture are gone.
- **Slide 32** (`SelfServicePicture`, traits1.tsx): the top box (desks and
  ticket) is gone; the remaining box is centred in the 416px the pair filled.
- Slides 17 (the book) and 18 (the third point) were already done here on
  2026-10-23; only the supplied file needed them.

## 2026-10-30: agenda1 and quiz1 added beside agenda0 and quiz0 (shared file, 71 slides)

The user: add agenda1 and quiz1 as the first version of the Agenda and Quiz
slides, next to the existing agenda0 and quiz0, in the shared
`dist-single/1__Cloud Computing Fundamentals.html`, "just add the slides, don't
build it from scratch". That file is the hand-patched student download (it got
the presenter runtime by a splice on 2026-10-29 and is never rebuilt from
`src/`), so the pair went in the same way:

- **What was added.** `agenda-columns` (`AgendaColumns`, the five TR titles
  only, as agenda0 shows them) right after `agenda`; `quiz-mid-card` and
  `quiz-close-card` (`QuizCard`, the yellow cube over `Quiz Time`) right after
  `quiz-mid` and `quiz-close`. Labels `Agenda (layout 1)` and `Quiz time
  (layout 1)`; notes say REVIEW PAIR, keep one and delete the other. With the
  file's two deletions the deck shows 69; the harness (`?all`) sees 71, the new
  frames at 4, 29 and 67. agenda0, quiz0 and every other slide are untouched
  (text of all 68 compared slide by slide: identical).
- **How.** The two components (deployment's `figures/variants.tsx`, cube PNG
  inlined) compiled with esbuild as a cjs chunk with `react`, `react/jsx-runtime`,
  `framer-motion`, SlideBase, tokens and Card left external; wrapped as
  `window.__deckVariants(libs)` in a classic `<script>` right after the runtime
  one; a lazy bridge `NX_V` in the module (React `F`, jsx `t`, `motion` `Ft`,
  `SlideBase` `Ci`, `Card` `Wt`, `BOX_W` `Pt`, token literals) resolved at
  render time, so it needs no ordering inside the bundle; the three entries use
  `t.jsx(NX_A1|NX_Q1, …)`. Every Tailwind class the pair needs was already in
  the bundle. The pre-splice file is kept at
  `../versions/1__Cloud Computing Fundamentals.2026-10-30-before-agenda1-quiz1.html`.
- **Verified in Chrome** on the shipped file: order, picker (69 Skip buttons,
  three `layout 1` tiles), no page errors, `?view=student` carries the pair,
  save-into-file keeps the chunk and the entries, the saved copy reopens with
  them. The frames match the deployment build's pixel for pixel but for this
  deck's own 36px footer mark.
- **Repo source mirrored, not built:** `src/decks/figures/variants.tsx`
  (agenda1 + quiz1 only; feedback1 left out because this deck's feedback slide
  was deleted on 2026-10-22), the three entries in `cloudDeck.tsx`,
  `public/assets/quiz/quiz-cube.png`, `slideCount` 71. Typecheck clean.
  `AGENDA_SLIDE=3` for agenda-check is still right (agenda0 did not move).
- **Known, pre-existing:** `?view=student` on this presenter file shows all 71
  because the query form reads `hidden` and the file holds `deleted`; the
  Download button still writes `hidden` correctly.

**2026-10-30, later: the user picked layout 1.** Slides 3, 28 and 66 of the
full order (`agenda`, `quiz-mid`, `quiz-close`: agenda0 and both quiz0 frames)
removed from the shared file's bundle on the user's word, no checks run (the
user asked for the one change only). The file lists 68 slides, 66 shown with
its two deletions; `agenda-columns` is now 3, `quiz-mid-card` 27,
`quiz-close-card` 64. The repo `src/` still carries both frames of each pair;
mirror the deletion there before any build. The file before this edit is in the
scratchpad only.
