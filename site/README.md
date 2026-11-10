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

1. Open a deck with `?edit=1` (or the gallery's **Edit** link) and enter the editor password.
2. Per slide: **Visible / Skip / Delete**, a **Comment**, **Undo / Redo** (Ctrl+Z, Ctrl+Shift+Z). Changes stay in your browser until you save.
3. **Save** commits to `<course>/<session>/edits/<slug>.json` and publishes immediately to every viewer. The button reads *Building…* until the live site has been rebuilt with that commit.

Skipped and deleted slides are both hidden from viewers; deleted ones are struck through in the editor and can be restored at any time.
`#slide-N` counts the slides viewers see.

## Operations

- Secrets: `EDITOR_PASSWORD`, `DEPLOY_HOOK_TOKEN`, `GH_TOKEN` on the Worker (`npx wrangler secret put …` in `worker/`); `DEPLOY_HOOK_TOKEN` also as a GitHub Actions secret. Local copies of the generated ones: `.local-secrets.txt` (gitignored).
- Rotate the editor password: generate one (`openssl rand -base64 24`), replace the `EDITOR_PASSWORD=` line in `.local-secrets.txt`, and pipe it to `npx wrangler secret put EDITOR_PASSWORD` from `worker/`.
- Redeploy the Worker: `cd worker && npx wrangler deploy`.
- Local preview: `node site/build.mjs` then serve the parent of `_site` so it is reachable at `/Presentation_Decks/`.
