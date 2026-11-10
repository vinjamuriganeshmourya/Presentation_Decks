// Post-build step for the single-file bundle: replaces the Google Fonts <link>
// in dist-single/index.html with a <style> block whose @font-face rules carry
// base64 woff2 payloads, so the deck renders in Poppins / Inter / JetBrains Mono
// with no network at all.
//
// Run AFTER inline-assets.mjs. Requires network access at build time only.
// If the fetch fails the CDN <link> is left in place and the build still
// succeeds — the deck then needs a connection for correct typography.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const cfg = JSON.parse(readFileSync(join(root, 'deck.config.json'), 'utf8'))
const htmlPath = join(root, 'dist-single', 'index.html')
let html = readFileSync(htmlPath, 'utf8')

// Pull the exact family spec out of the built HTML so this script never drifts
// from index.html. One source of truth: the <link> itself.
const linkRe = /<link\s+[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"[^>]*\/?>/
const m = html.match(linkRe)
if (!m) {
  console.log('inline-fonts: no Google Fonts <link> found, nothing to do.')
  process.exit(0)
}

// Chrome UA so Google serves woff2 (an unknown UA gets legacy ttf, ~4x larger).
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Google's endpoints intermittently drop a connection mid-build; three tries
// with a short backoff turns a failed build into a slower one.
async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r
    } catch (err) {
      if (i >= tries) throw new Error(`${url.slice(0, 60)}… → ${err.message}`)
      await new Promise((ok) => setTimeout(ok, 400 * i))
    }
  }
}

async function main() {
  const cssUrl = m[1].replace(/&amp;/g, '&')
  let css = await (await get(cssUrl)).text()

  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g) ?? [])]
  let bytes = 0
  const fetched = await Promise.all(
    urls.map(async (u) => {
      const buf = Buffer.from(await (await get(u)).arrayBuffer())
      bytes += buf.length
      return [u, `data:font/woff2;base64,${buf.toString('base64')}`]
    }),
  )
  for (const [u, dataUri] of fetched) css = css.split(u).join(dataUri)

  // Drop the <link> plus the two preconnect hints it no longer needs.
  html = html
    .replace(linkRe, `<style>\n${css}\n</style>`)
    .replace(/<link\s+rel="preconnect"[^>]*fonts\.(googleapis|gstatic)\.com"[^>]*\/?>\s*/g, '')

  writeFileSync(htmlPath, html)
  console.log(
    `inline-fonts: embedded ${fetched.length} woff2 files ` +
      `(${(bytes / 1024).toFixed(0)} KB raw). Output: ${(html.length / 1024 / 1024).toFixed(2)} MB`,
  )
  finish(html)
}

// A double-clickable copy with a name that says what it is. index.html is kept
// so the folder also works as-is on a static host.
function finish(out) {
  /* The double-clickable name comes from deck.config.json, so this script is kit
     and every session's build:html still emits a file named after that deck. */
  const rel = `dist-single/${cfg.htmlName}.html`
  writeFileSync(join(root, rel), out)
  console.log(`\n  Deck ready:  ${rel}  (${(out.length / 1024 / 1024).toFixed(2)} MB, self-contained)\n`)
}

main().catch((err) => {
  console.warn(`inline-fonts: SKIPPED (${err.message}). Deck will need a network for fonts.`)
  finish(readFileSync(htmlPath, 'utf8'))
})
