import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * The browser-tab title, from `deck.config.json`.
 *
 * `index.html` is a KIT file, so it cannot carry a session's name: whatever it
 * said would be overwritten in every other session by the next `sync-kit`. It
 * used to say "NIAT · Web Slides", which meant the tab of a finished deck, and
 * the tab of the self-contained HTML people are handed, named the template
 * instead of the session.
 *
 * So the title is a placeholder that this plugin fills from the one file a
 * session owns. Session name now lives in exactly one place per session.
 */
function deckTitle() {
  const { title } = JSON.parse(
    readFileSync(fileURLToPath(new URL('./deck.config.json', import.meta.url)), 'utf8'),
  )
  return {
    name: 'deck-title',
    transformIndexHtml: (html: string) => html.replace(/%DECK_TITLE%/g, title),
  }
}


// Standalone build: inlines all JS/CSS into one index.html so the deck
// opens directly from the filesystem (file://) without a dev server.
export default defineConfig({
  plugins: [react(), viteSingleFile(), deckTitle()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-single',
    /*
      CSS MINIFICATION IS OFF, AND THAT IS A BUG FIX, NOT A PREFERENCE.

      esbuild's CSS minifier rewrites

        @media (hover: hover) and (pointer: fine) { ... }

      as

        @media(hover:hover)and(pointer:fine) { ... }

      dropping the space before `and`, which is not valid CSS. It warns about its
      own output -- `Expected "{" but found "and("` -- and then ships it. A
      browser cannot parse the query, so it discards the whole block, and
      `src/index.css` has two of them: the flowchart node hover lift and the
      bare-node shadow handoff simply do not work in the deliverable.

      This is the S8 class of bug all over again: it works in `npm run dev`, it
      works in `npm run build`, and it is broken in the one build that ships,
      silently. It was found by reading a build warning that had been scrolling
      past for several sessions.

      The trade is nothing. A deck is 3 to 4 MB of inlined woff2 and base64
      images; the CSS is a few tens of KB and unminified costs single-digit KB
      after gzip, on a file that is opened from the filesystem anyway. Correctness
      at that price is not a decision.

      JS minification is untouched -- this only turns off the CSS pass.
    */
    cssMinify: false,
  },
})
