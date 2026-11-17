/**
 * Build the WHOLE PROJECT as one HTML file.
 *
 *   node workflow/export/build-project-html.mjs
 *
 * Output: `workflow/export/deck.html` — double-click it. This is the real deck,
 * not a re-implementation: the actual React components, the framer-motion
 * animations, the deck's own player (arrow keys, buttons, fullscreen, hash
 * routing). Everything is inside the file — React, framer-motion, the compiled
 * Tailwind, the webfonts and every image.
 *
 * TWO COMPATIBILITY RULES LEARNED THE HARD WAY
 *
 * 1. A CLASSIC script, never `<script type="module">`. Module scripts are
 *    fetched under CORS rules, and several browsers and preview panes refuse to
 *    run them from `file://` — which shows up as a blank page with nothing in
 *    the console. esbuild's `iife` format avoids the module system entirely.
 *
 * 2. No dynamic `import()` of a data: URL. Chrome allows it; Firefox and Safari
 *    do not, and they fail silently. Everything here is bundled statically.
 *
 * And one asset rule: large PNGs are re-encoded to WebP but ALWAYS as RGBA.
 * Converting to RGB fills transparent pixels black, which turns the NxtWave mark
 * in the footer into a black rectangle on every light slide.
 */
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const TMP = path.join(ROOT, 'node_modules', '.deck-export')
const OUT = path.join(HERE, 'deck.html')
const FONTS = [
  path.join(HERE, 'fonts.css'),
  '/home/nxtwave/.claude/jobs/d0d1a407/tmp/fonts.css',
].find((p) => fs.existsSync(p))

fs.mkdirSync(TMP, { recursive: true })

/* ── 1. entry: mount the real App and give it the viewport ─────────────── */
const entry = path.join(TMP, 'project.jsx')
fs.writeFileSync(entry, `
import { createRoot } from 'react-dom/client'
import { App } from '${path.join(ROOT, 'src/App.tsx').replace(/\\/g, '/')}'

function mount() {
  let el = document.getElementById('root')
  if (!el) { el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el) }
  createRoot(el).render(<App />)
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()
`)

/* ── 2. the stylesheet, with the webfonts folded in ────────────────────── */
console.log('compiling css…')
const cssOut = path.join(TMP, 'project.css')
execSync(`npx tailwindcss -i "${path.join(ROOT, 'src/index.css')}" -o "${cssOut}" --minify`, {
  cwd: ROOT,
  stdio: 'pipe',
})
let css = fs.readFileSync(cssOut, 'utf8')
if (FONTS) {
  css = fs.readFileSync(FONTS, 'utf8') + '\n' + css
  console.log(`  fonts embedded from ${FONTS}`)
} else {
  console.log('  NOTE: no fonts.css found — the file will fall back to system fonts')
}
console.log(`  ${Math.round(css.length / 1024)} KB`)

/* ── 3. bundle everything as a classic script ──────────────────────────── */
console.log('bundling…')
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2019'],
  minify: true,
  jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: { '@': path.join(ROOT, 'src') },
  outfile: path.join(TMP, 'project.js'),
  absWorkingDir: ROOT,
})
let js = fs.readFileSync(path.join(TMP, 'project.js'), 'utf8')

/* ── 4. embed every image the bundle references ────────────────────────── */
const pub = path.join(ROOT, 'public')
const refs = [...new Set(js.match(/"\/(?:assets|shots)\/[^"]+?\.(?:png|svg|jpg|webp)"/g) || [])]
let embedded = 0
for (const quoted of refs) {
  const file = path.join(pub, quoted.slice(1, -1))
  if (!fs.existsSync(file)) {
    console.log('  MISSING', quoted)
    continue
  }
  let bytes = fs.readFileSync(file)
  let mime = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' }[
    path.extname(file).toLowerCase()
  ]
  if (mime === 'image/png' && bytes.length > 120_000) {
    const tmp = path.join(TMP, path.basename(file) + '.webp')
    execSync(
      `python3 -c "from PIL import Image;im=Image.open(r'${file}').convert('RGBA');` +
        `im.thumbnail((1600,1600), Image.LANCZOS);im.save(r'${tmp}', format='WEBP', quality=92, method=6)"`,
      { stdio: 'pipe' },
    )
    bytes = fs.readFileSync(tmp)
    mime = 'image/webp'
  }
  js = js.split(quoted).join(JSON.stringify(`data:${mime};base64,${bytes.toString('base64')}`))
  embedded += bytes.length
  console.log(`  ${quoted.slice(1, -1).padEnd(40)} ${Math.round(bytes.length / 1024)} KB`)
}

/* ── 5. one file ───────────────────────────────────────────────────────── */
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Introduction to Docker</title>
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<noscript>This deck needs JavaScript enabled.</noscript>
<script>
${js}
</script>
</body>
</html>
`
fs.writeFileSync(OUT, html)
console.log(`\nwrote ${OUT}  (${Math.round(fs.statSync(OUT).size / 1024)} KB, ${Math.round(embedded / 1024)} KB of it images)`)
console.log('  arrows step a whole slide, ctrl+arrows step the build, f for fullscreen')
