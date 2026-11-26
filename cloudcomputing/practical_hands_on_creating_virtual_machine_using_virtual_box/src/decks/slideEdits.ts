/**
 * THE PRESENTER'S TEXT EDITS, SAVED TO SOURCE. Written by the dev server's `/__deck/edits` endpoint
 * (`vite.config.ts`) every time the Edit button changes a word; read by `deck/presenter.ts`, so the
 * build bakes them into the HTML that is shared. Per slide id, per original text, the edited innerHTML.
 * Edit it by hand only with the dev server stopped: a running deck rewrites this whole file.
 */
import type { SlideEdits } from '../deck/presenter'

/* carried over 2026-11-26 from the shared student-view file the deck was split from: the presenter's saved text edits, now in source */
export const SLIDE_EDITS: SlideEdits = {
  "wizard-1": {
    "Screens from creating an Ubuntu 26.04.1 LTS VM, shown here for reference — trainer walks through each live rather than reading the captions below.": "<br>"
  },
  "boot-1": {
    "The created VM boots to its own Ubuntu desktop, confirming the walkthrough above worked end to end.": "The created VM boots to its own Ubuntu desktop, confirming the walkthrough worked end to end."
  }
}
