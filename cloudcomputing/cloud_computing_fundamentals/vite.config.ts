import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deckTitle()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
