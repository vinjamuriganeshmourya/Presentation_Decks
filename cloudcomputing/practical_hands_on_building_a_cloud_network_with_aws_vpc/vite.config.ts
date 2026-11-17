import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'

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

/**
 * TEXT EDITS GO TO SOURCE (session-local, 2026-10-27). The Edit button used to keep what the
 * presenter typed in `localStorage` only: one origin's memory, so the built HTML, another port or
 * another machine never saw it and the words "reverted". Under `npm run dev` the deck now PUTs its
 * edits here and this writes them to `src/decks/slideEdits.ts`, which the build bakes in.
 * The file is written atomically and its HMR is swallowed: the page that saved it already shows it.
 */
function deckEdits() {
  const file = fileURLToPath(new URL('./src/decks/slideEdits.ts', import.meta.url))
  const valid = (v: unknown): v is Record<string, Record<string, string>> =>
    !!v && typeof v === 'object' && !Array.isArray(v) &&
    Object.values(v).every((m) => !!m && typeof m === 'object' && !Array.isArray(m) && Object.values(m).every((h) => typeof h === 'string'))
  const source = (edits: Record<string, Record<string, string>>) =>
    readFileSync(file, 'utf8').replace(/export const SLIDE_EDITS: SlideEdits = [\s\S]*$/, `export const SLIDE_EDITS: SlideEdits = ${JSON.stringify(edits, null, 2)}\n`)
  return {
    name: 'deck-edits',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__deck/edits', (req, res) => {
        if (req.method !== 'PUT' && req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const edits = JSON.parse(body)
            if (!valid(edits)) throw new Error('not a slide-edits map')
            const tmp = `${file}.tmp`
            writeFileSync(tmp, source(edits))
            renameSync(tmp, file)
            res.setHeader('content-type', 'application/json')
            res.end('{"ok":true}')
          } catch (e) {
            res.statusCode = 400
            res.end(String(e))
          }
        })
      })
    },
    handleHotUpdate(ctx: { file: string }) {
      if (ctx.file === file) return []
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deckTitle(), deckEdits()],
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
