# The base template

The shared rendering layer for every NxtWave session deck, plus a content-free
**base deck** that shows each chrome slide once.

Change a slide type or a colour **here**, then push it out with `sync-kit.mjs`.

---

## Why a template and a sync command, rather than a shared package

A session is a **deliverable**, not a consumer. Each one is a standalone Vite app
that has to keep building on its own long after it was recorded, and
`npm run build:html` has to emit one self-contained file that works from a
double-click with no server and no network.

A workspace package that every session imported would propagate changes
automatically, and that is precisely the problem: an archived, signed-off
session's rendered output would change underneath it whenever someone touched the
kit. So propagation is a deliberate command per session, and `--check` exists so
nobody has to remember which sessions are behind.

---

## What is kit and what is the session's own

`sync-kit.mjs` **overwrites** the kit list in the target. Everything else it never
reads and never writes.

| Kit (synced) | Session's own (never touched) |
|---|---|
| `src/design/` tokens and the three grounds | `src/decks/` the deck itself |
| `src/motion/` Reveal, Stepper, instant | `src/decks/activeDeck.ts` which deck is live |
| `src/deck/` the player | `src/export/revealSteps.ts` and `deckCss.ts`, generated per deck |
| `src/ui/` primitives and figures | `deck.config.json` name, title, slide count |
| `src/slides/` slide types | `public/shots/` that session's real screenshots |
| `src/App.tsx`, `src/index.css` | `workflow/` plans, captures, sign-offs |
| `tailwind.config.ts`, `vite*.config.ts`, `index.html` | `package.json`, `CLAUDE.md`, `README.md` |
| `qa.mjs`, `video-safe.mjs`, `preview.mjs` | `dist/`, `dist-single/`, `node_modules/` |
| `align-check.mjs`, `fit-check.mjs`, `marker-check.mjs` | |
| the twelve checks from session 31: `agenda-`, `autohide-`, `autoplay-`, `box-overflow-`, `controls-clear-`, `feedback-`, `gesture-`, `ligature-`, `mixed-align-`, `nav-stress-`, `overlap-`, `phone-nav-check.mjs` | `spec-check.mjs` and `scripts/build-spec-data.mjs`, which read that session's spec |
| `src/ui/foundations/` the Python course's shared figures | |
| `scripts/`, `workflow/export/` | `workflow/review/` the review build's output |
| `review/markComponents.mjs`, `vite.review.config.ts` | |

The last row is the BUILD half of the review app, and all of it that a session
holds. The app itself is not in the kit: it lives at the repo root in
`review-app/`, because a reviewer picks a course and a session before there is a
session folder to be inside of. A session only needs the two files its own
toolchain uses to produce a reviewable deck — the app shells out to `npx vite
build -c vite.review.config.ts` here. (`vite*.config.ts` in the row above already
matches `vite.review.config.ts`; it is named again because a session that predates
the review app has to be told what it is missing.)

### The one seam: `src/decks/activeDeck.ts`

`src/App.tsx` and `src/export/slideModule.tsx` both need to know which deck to
render. They used to import it by its own name:

```ts
import { dockerFileCreationDeck, dockerFileCreationMeta } from '@/decks/dockerFileCreationDeck'
```

which made two otherwise-identical files differ in every session over nothing but
an identifier. They now import `{ deck, meta }` from `activeDeck.ts`, and each
session re-exports its own deck under those names. **Two lines, and it is the only
file under `src/` outside `decks/` that a session owns.**

```ts
export { dockerFileCreationDeck as deck, dockerFileCreationMeta as meta } from './dockerFileCreationDeck'
```

### `deck.config.json`

The three harnesses used to hardcode per-session values, and that was the *only*
reason they differed between sessions: one carried `TOTAL ?? 44` and another
`?? 48`, one defaulted to `deployment-session-1.html` and another to `-2`, and
`qa.mjs` had an absolute `/tmp/claude-1000/<a-dead-session-id>/scratchpad/shots`
baked in as its output directory. Those values live here now:

```json
{ "name": "…", "title": "…", "htmlName": "…", "slideCount": 15, "devPort": 5211 }
```

**Keep `slideCount` current when slides are added or removed** — every harness
reads it, and a stale count means the sweep silently skips the tail of the deck.

---

## Commands

```bash
# in slide-template/
npm run dev                                            # the base deck
node sync-kit.mjs --check ../../django_deployement_course/deployement_session_1_v2   # read-only, exits 1 if behind
node sync-kit.mjs --apply ../../django_deployement_course/deployement_session_1_v2 ../../django_deployement_course/deployement_session_2

# then in each session that was synced
npx tsc -b --noEmit && npm run build:html
export CHROME_PATH=/opt/google/chrome/chrome
node video-safe.mjs      # must print CLEAN
node qa.mjs              # only slide 1 should be flagged
node align-check.mjs     # header datum drift
node fit-check.mjs       # must print CENTRED and LAYOUT STABLE
node preview.mjs && node scripts/build-preview-page.mjs
```

**A SESSION SYNCED PAST 2026-09-22 GAINS THE STAGE FIX AND MUST BE RE-MEASURED.**
`SlideStage` now fits the canvas with CSS `zoom` instead of `transform: scale()`,
which is what stopped the deck rendering soft on a projector, and it brings
`text-rendering: geometricPrecision` with it so the layout stays identical at
every size. Unrounded glyph advances are slightly wider than hinted ones: the
mono face measures 8.4px a character rather than 8.0, which is 5%. **Any figure
whose geometry was computed from a character count has to be checked**, and
`fit-check.mjs` plus that figure's own measurement harness is how. It has already
moved one constant: `questions-lab`'s subject panel went from a 466px cap to 488
or a 54-character line would have scrolled.

`--check` is read-only and exits non-zero when anything is behind, so it works as
a pre-flight. `--apply` backs up nothing: the repo is the backup, so run it on a
clean tree.

---

## Starting a new session from this template

1. Copy the directory, minus `node_modules`, `dist`, `dist-single` and
   `workflow/preview`.
2. Edit `deck.config.json`: `name`, `title`, `htmlName`, `devPort`.
3. Copy `src/decks/baseDeck.tsx` to `src/decks/<yourSession>Deck.tsx` and replace
   the placeholder copy.
4. Point `src/decks/activeDeck.ts` at it.
5. `npm install`, then `npm run dev`.
6. Once the slide count is final, update `deck.config.json` and regenerate
   `src/export/revealSteps.ts`:
   `node workflow/export/build-reveal-steps.mjs http://localhost:<port> <count>`

`typecheck`, `build` and `build:html` first run `npm run gen`
(`workflow/export/build-deck-css.mjs`), which writes `src/export/deckCss.ts` and,
only if it is missing, a placeholder `revealSteps.ts`. Both are gitignored and
per deck. Without it a fresh copy failed its own type check, because nothing
generated `deckCss.ts`.

---

## The two decks in `src/decks/`

- **`baseDeck.tsx`** — one instance of each chrome slide, placeholder copy. Open
  this when the **theme** looks wrong: every frame a colour change touches is on
  one screen.
- **`sampleDeck.tsx`** — the exhaustive component gallery: every slide type, every
  `src/ui` figure, every callout kind. Open this when a **layout** looks wrong.
  **It is what `activeDeck.ts` points at in the template**, because the gallery is
  what this directory is for; a session points at its own deck.

Point `activeDeck.ts` at either one to view it. It is two lines, and it is
session-owned, so switching it here never propagates.

### The gallery is not optional, and it is checkable

`sampleDeck.tsx` must render **every** type exported from `src/slides/index.ts`.
It is the only discovery mechanism there is: the generate-slides skill sends
every author to it first, so a type missing from it is a type the next deck
rebuilds by hand. `BrandSlide`, `CodeBuildSlide` and `QuizTimeSlide` were each
exported and missing for several sessions.

```bash
diff <(grep -oP "\b[A-Z]\w*Slide\b" src/slides/index.ts | sort -u) \
     <(grep -oP "<\K[A-Z]\w*Slide\b" src/decks/sampleDeck.tsx | sort -u)
```

Left-only lines are the failure: exported, but not in the gallery.

Every entry carries a `notes` string saying what the type is FOR, what it must
not carry, and which type it is confusable with. The notes are the documentation;
the slide is only the proof it renders.

Because `sampleDeck.tsx` is **kit-owned**, a type added to the gallery reaches
every session on the next `sync-kit.mjs --apply`, which is the point.

---

## Never add a session figure to `src/ui/index.ts`. Import it by path

`src/ui/index.ts` is the `@/ui` barrel and it is **kit-owned**, so
`sync-kit.mjs --apply` overwrites it wholesale. A session figure re-exported from
its tail is deleted by the next sync, the figure file itself is left sitting
untouched beside the deck, and the deck stops compiling with
`Module '@/ui' has no exported member 'X'`.

So a session-owned figure is imported **by path**:

```tsx
import { TargetAnatomy } from '@/ui/TargetAnatomy'   // survives every sync
import { TargetAnatomy } from '@/ui'                 // deleted by the next one
```

This is what the kit already does for its own figure families
(`@/ui/points/...`, `@/ui/flowchart/...`), and a path import names a file that no
sync touches.

**It has now cost four decks.** Session 4 hit it first and recorded it in its
deck header; the 2026-09-03 kit sync then broke session 5 twice
(`AutomationLadder`, `TargetAnatomy`) and session 6 twice (`ImageNameAnatomy`,
`TagPointers`), all four with the same error, because the convention of appending
to the barrel's tail looks harmless and cannot survive.

The alternative worth considering, if this recurs: have the kit's `index.ts`
re-export a session-owned `src/ui/session.ts` that `sync-kit.mjs` never touches,
so a session has a barrel of its own. Not done yet, because a path import is one
line and needs no kit machinery.

---

## Capture timing, if a screenshot looks broken

`?all` forces every click-gated build step open, but it does **not** fast-forward
entrances that play themselves on mount. The harnesses settle for 2600ms because
of the two slowest:

| Slide | Settles at | Why |
|---|---|---|
| `AgendaSlide` | ~2.38s | items are cued off the curve drawing itself |
| `DataTable` | ~1.5s | rows are timed off the header, not staggered by a parent |

At the old 1100ms every agenda was captured two items in with a third at 30%
opacity, and it shipped that way in a signed-off preview. If a new slide type
animates itself for longer, raise `SETTLE` in `preview.mjs` and the matching value
in `qa.mjs`, and say what forced it.
