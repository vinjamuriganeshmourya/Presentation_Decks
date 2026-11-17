/**
 * THE PAGE AS IT WAS BUILT, kept for the Download button (presenter view,
 * Cloud Computing Fundamentals, 2026-10-22; session-local kit change).
 *
 * The student file is this same page with one `<script>` injected, so the
 * player needs the page's own source. A `file://` page cannot fetch itself,
 * and shipping a second copy inside the build would double a 5 MB deck, so
 * the DOM is serialised ONCE, here, before anything has touched it.
 *
 * This module has no imports and `main.tsx` imports it FIRST: module
 * evaluation runs in import order, and the deck file's module appends the
 * figure CSS and the clay filter defs to the document while it evaluates.
 * Captured any later, those would ride along into every student file and be
 * mounted twice when it opens. `outerHTML` drops the doctype, and without it
 * the student file would open in quirks mode, so it is put back.
 */
declare global {
  interface Window {
    __DECK_HTML__?: string
  }
}

if (typeof document !== 'undefined' && !window.__DECK_HTML__) {
  window.__DECK_HTML__ = '<!doctype html>\n' + document.documentElement.outerHTML
}

export {}
