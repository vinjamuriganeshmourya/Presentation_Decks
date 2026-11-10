import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
// @ts-expect-error — a plain .mjs babel plugin, deliberately untyped.
import markComponents from './review/markComponents.mjs'

/**
 * THE REVIEW BUILD. Not a deliverable.
 *
 * `node review.mjs` serves this output inside an iframe so a reviewer can click a
 * component on a slide and comment on it by name. The only difference from
 * `vite.config.ts` is `markComponents`, which stamps `data-ui` / `data-ui-loc`
 * onto every DOM element — see that file's header for why the marking happens
 * here rather than in the components.
 *
 * NOT a single-file build, and that is on purpose. `vite.singlefile.config.ts`
 * exists because the deliverable has to open from `file://` with no server; the
 * review app IS a server, so images and fonts can just be requested. Skipping the
 * inlining makes this build several times faster, which matters when the reviewer
 * is rebuilding between rounds of fixes.
 */
function deckTitle() {
  const { title } = JSON.parse(
    readFileSync(fileURLToPath(new URL('./deck.config.json', import.meta.url)), 'utf8'),
  )
  return {
    name: 'deck-title',
    transformIndexHtml: (html: string) => html.replace(/%DECK_TITLE%/g, `${title} · review`),
  }
}

/**
 * ROOT-ABSOLUTE ASSET PATHS, MADE RELATIVE.
 *
 * Slides reference the asset library by absolute path — `/assets/tech/docker.svg`,
 * `/shots/*.png` — which is correct for the dev server and for `npm run dev`, and
 * wrong for every other way the deck is ever served. The single-file build already
 * has to solve this: `scripts/inline-assets.mjs` rewrites the same paths to data
 * URIs, and its own comment records that "the bundled JS carries root-absolute
 * /assets/…".
 *
 * The review app serves this build from `/deck/<course>/<session>/`, so a
 * root-absolute path resolves against the APP's root and 404s. Every technology
 * logo and every screenshot would silently be missing, and a reviewer would file
 * comments about missing images that are present in the real deck. That is worse
 * than a broken build: it manufactures false feedback.
 *
 * `base: './'` below only fixes the paths VITE emits. This fixes the ones the
 * source wrote by hand, in the bundle, after minification, which is the only point
 * at which all of them are in one place.
 */
function relativizeAssetPaths() {
  // Quote, paren or backtick, then `/assets/` or `/shots/`. Anchoring on the
  // opening delimiter is what keeps it from touching a longer path that merely
  // contains the word, and matches how `inline-assets.mjs` finds the same refs.
  const fix = (code: string) => code.replace(/(["'`(])\/((?:assets|shots)\/)/g, '$1./$2')
  return {
    name: 'relativize-asset-paths',
    apply: 'build' as const,
    generateBundle(_options: unknown, bundle: Record<string, { type: string; code?: string; source?: unknown }>) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && typeof file.code === 'string') file.code = fix(file.code)
        else if (typeof file.source === 'string') file.source = fix(file.source)
      }
    },
  }
}

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [[markComponents, { root }]] } }),
    deckTitle(),
    relativizeAssetPaths(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  /*
    Served from `/deck/` by the review server, so asset URLs must be relative:
    an absolute `/assets/...` would be looked up at the review app's own root.
  */
  base: './',
  build: {
    outDir: 'workflow/review/deck',
    emptyOutDir: true,
    // The reviewer reads component names off the DOM, never off the JS bundle,
    // so there is nothing to gain from a sourcemap and 20 MB to lose.
    sourcemap: false,
  },
})
