# Deck site

Live: https://vinjamuriganeshmourya.github.io/Presentation_Decks/
Edit service (Cloudflare Worker + D1): https://presentation-decks-live.presentation-decks.workers.dev

## How it fits together

| Piece | Where | What it does |
| --- | --- | --- |
| Build | `site/build.mjs` (runs in `.github/workflows/deploy.yml`) | Assembles every `<course>/<session>/dist-single/*.html` deck into `_site/`, bakes in `edits/<deck>.json`, writes the gallery, `decks.json`, `build.json`. Output is never committed. |
| Loader | `site/overlay.js` | Injected at the top of each deck. Merges the baked edits with the Worker's pending ones, hands them to the deck as `window.__DECK_STATE__` (the deck's own read-only view), then boots the deck. Handles `#slide-N`, live updates and edit mode. |
| Gallery | `site/gallery.*` | Course › session › deck, search, Open, Copy link, Copy slide link. |
| Worker | `worker/` | `/api/save` commits per-slide patches to the repo and writes them to D1 so every viewer sees them on the next poll (≈10 s). After the rebuild that contains the commit is live, the rows are deleted (deploy hook + cron, 24 h expiry). |

## Add a new deck

1. Put the session folder under its course: `<course>/<session_folder>/dist-single/<name>.html`
   (the single-file build from the deck kit; `deck.config.json` `htmlName` picks the file if there are several).
2. Optional: `<course>/course.json` lists `sessions` in order (unlisted ones go last, alphabetically);
   `<session>/deck.site.json` picks the file(s) explicitly: `{ "decks": [{ "file": "dist-single/x.html", "slug": "x" }] }`.
3. Commit and push to `main`. The deck appears at `/<course>/<session>/<slug>/` in a minute or two.

## Edit and save

1. Open a deck with `?edit=1` (or the gallery's **Edit** button) and enter the editor password.
2. The deck's own toolbar gains, just before fullscreen: a **comments** icon (opens the edit panel on its Comments tab), then **Undo**, **Redo** and **Save** (Ctrl+Z / Ctrl+Shift+Z still work). A dot on Save means unsaved changes; while a save is building it reads *Building…*.
3. In the deck's grid (**Jump to a slide**, `G`), every card shows the slide's state (visible / skipped / deleted, "· unsaved" until saved) and has **Skip / Unskip** and **Delete / Restore**.
4. The edit panel (closed by default, opened from the comments icon) keeps every control: Download, Visible / Skip / Delete for the current slide, Copy slide link, Undo / Redo / Save, the Comments and Slides tabs. It takes the deck toolbar's look (colours and fonts are read from the deck).
5. Changes stay in your browser until **Save**, which commits to `<course>/<session>/edits/<slug>.json` and publishes immediately to every viewer. Save reads *Building…* until the live site has been rebuilt with that commit.

The toolbar and grid controls are placed into the deck's own DOM by `overlay.js` and call exactly what the panel's buttons call; viewer mode (no `?edit=1`) gets none of them.
Skipped and deleted slides are both hidden from viewers; deleted ones can be restored at any time.
`#slide-N` counts the slides viewers see.

## Gallery and navigation

- The gallery (`site/gallery.*`) has a sidebar of sessions, search (`/`), and a card per deck. Each card has a slide thumbnail, a slide count, and **Present**, **Edit**, **Download** and **Share** (deck link or a link to slide N).
- `#<course>/<session>` on the gallery URL scrolls to that session's card and highlights it.
- Every deck page has a bar at the top left: **All decks** (back to the gallery, at this session), previous and next session, and a menu of all the course's sessions. It fades after 3 seconds without activity while presenting and returns on any mouse, touch or key. In edit mode, previous and next stay in edit mode.
- Thumbnails and slide counts come from `node site/thumbs.mjs` (headless Chrome, run by CI after the build). It captures each deck's session-title slide (else its agenda) as `thumb.jpg` and writes `deck-meta.json`. If it fails, the cards show a designed placeholder and the site still deploys.

## Student download

Every deck can be downloaded as one offline HTML file in the deck's own student
view: the Download button on its gallery card, the ⬇ button above 💬 on the deck,
or Download in the comments / edit panel. Skipped and deleted slides are left
out and saved text edits are kept. The file has no comments, edit, skip or
delete controls. From the gallery or a normal view it is the deck as every
viewer sees it now, including saves that are still building. From edit mode it
is the deck as set in the panel, unsaved changes included.

`site/student.js` builds it in the browser. The build fences the site layer in
each deck page with `<!--deck-site-->` … `<!--/deck-site-->` and holds back the
deck's module. student.js cuts the fence out, restores the module and injects
`window.__DECK_STATE__ = {view:'student', hidden, edits}` before the first
script, which is the same file the decks' own presenter Download button writes.

## Review comments locally

The site commits every comment to `<course>/<session>/edits/<deck>.json`. To read them inside the deck after `git pull`:

- **Set up once per clone:** `npm run setup-hooks`. From then on every `git pull`, including `git pull --rebase`, refreshes the review copies. The hooks are `.githooks/post-merge` and `.githooks/post-rewrite`, and they never block a pull: on a problem they print one warning line.
- **Run by hand:** `npm run review` shows open comments; `npm run review -- --all` includes resolved ones. It prints how many decks and open comments there are, and the folder to open.
- **Open** `review/<course>/<session>/<deck>.html` (gitignored) straight from disk: no server or network is needed. The deck opens in its presenter view. The toolbar comment icon shows the reviewers' comments in the deck's own comment panel, labelled *Review comment · read-only*, with author and time. Skipped and deleted slides stay in the deck and carry a small tag, on the slide and on their grid card. Comments whose slide id the deck no longer has (for example after a regeneration) are listed under *Comments not matched to a slide*.
- The copy is the published HTML plus one inline script; the original in `dist-single/` is only read. The copy keeps its own browser storage (`nxtwave.review.*`), so it never changes the original deck's local skips, edits or comments. Review comments are never stored, and comments you add in the copy stay in the copy.

## Operations

- Secrets: `EDITOR_PASSWORD`, `DEPLOY_HOOK_TOKEN`, `GH_TOKEN` on the Worker (`npx wrangler secret put …` in `worker/`); `DEPLOY_HOOK_TOKEN` also as a GitHub Actions secret. Local copies of the generated ones: `.local-secrets.txt` (gitignored).
- Rotate the editor password: generate one (`openssl rand -base64 24`), replace the `EDITOR_PASSWORD=` line in `.local-secrets.txt`, and pipe it to `npx wrangler secret put EDITOR_PASSWORD` from `worker/`.
- Redeploy the Worker: `cd worker && npx wrangler deploy`.
- Local preview: `node site/build.mjs` then serve the parent of `_site` so it is reachable at `/Presentation_Decks/`.

## Git commands and last push

- `npm run build` compiles `site/src/*.ts` (to `site/gen/`, not committed) and then runs `site/build.mjs`. CI runs `npm ci`, then `npm run activity`, then `npm run build`.
- `site/src/deck-tools.ts` holds the editor sign-in (`DeckGate`). Edit mode, comments and the git buttons all use it, so it is one modal, one `/api/auth` check and one session unlock.
- **Git** (gallery card footer, and the deck toolbar just before fullscreen) opens a menu with **Copy Git Command** (sparse clone of just this deck) and **Copy Push Command**. Both ask for the editor password first. The commands are built from `config.json` → `git` (`repoUrl`, `branch`, `decksRoot`, `sharedPaths`) plus the deck's `<course>/<session>` folder. Pushing requires GitHub write access.
- `npm run activity` writes `public/activity.json` (gitignored): the latest commit (author, ISO date, message, short sha) for each deck folder. The build publishes it at the site root, and the gallery shows "Last push by …" under each card; a deck with no entry shows nothing. CI checks out with `fetch-depth: 0` so this history is complete.
