/**
 * THE PRESENTER'S TEXT EDITS, SAVED TO SOURCE. Written by the dev server's `/__deck/edits` endpoint
 * (`vite.config.ts`) every time the Edit button changes a word; read by `deck/presenter.ts`, so the
 * build bakes them into the HTML that is shared. Per slide id, per original text, the edited innerHTML.
 * Edit it by hand only with the dev server stopped: a running deck rewrites this whole file.
 */
import type { SlideEdits } from '../deck/presenter'

/* carried over 2026-11-26 from the shared student-view file the deck was split from: the presenter's saved text edits, now in source */
export const SLIDE_EDITS: SlideEdits = {
  "T11-2": {
    "write index.html with the page content above": "write <code class=\"rounded-[6px] px-1.5 py-[1px] font-mono\" style=\"font-size: 0.9em; background: rgb(234, 240, 253); color: rgb(1, 70, 199); font-variant-ligatures: none;\">index.html</code> with the page content"
  }
}
