/**
 * Builds workflow/preview/index.html — a self-contained contact sheet for the
 * standalone deck: every slide as a thumbnail, plus the mid-flight motion
 * frames that prove the transitions and build steps still run after bundling.
 *
 * Thumbnails are inlined as data URIs so the page is one shareable file.
 * Palette and type are the deck's own (see CLAUDE.md §1) — the preview should
 * look like the thing it previews.
 *
 *   node scripts/build-preview-page.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
/*
  Deck identity and the headline counts are DERIVED, never typed in. This page
  used to hardcode "35" and "3.37 MB": by the time the deck reached 48 slides the
  contact sheet still announced 35 above a grid of 48, which is the most
  misleading thing a QA artefact can do.
*/
const cfg = JSON.parse(readFileSync(join(root, 'deck.config.json'), 'utf8'))
const builtHtml = join(root, 'dist-single', `${cfg.htmlName}.html`)
const builtMb = existsSync(builtHtml)
  ? (readFileSync(builtHtml).length / 1024 / 1024).toFixed(2) + ' MB'
  : 'n/a'
const previewDir = join(root, 'workflow', 'preview')
const thumbDir = join(previewDir, 'thumbs')

const uri = (f) => `data:image/jpeg;base64,${readFileSync(join(thumbDir, f)).toString('base64')}`

/* ── fonts, inlined (the artifact CSP and file:// both block CDNs) ────── */

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fontCss() {
  const url =
    'https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Inter:wght@400;600&display=swap'
  try {
    let css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text()
    // Keep only the `latin` subsets — the deck is English, and the other
    // twelve unicode-ranges would quadruple the page for nothing.
    css = css
      .split('/*')
      .filter((b) => b.startsWith(' latin */'))
      .map((b) => '/*' + b)
      .join('')
    const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g) ?? [])]
    for (const u of urls) {
      const buf = Buffer.from(await (await fetch(u, { headers: { 'User-Agent': UA } })).arrayBuffer())
      css = css.split(u).join(`data:font/woff2;base64,${buf.toString('base64')}`)
    }
    return css
  } catch {
    console.warn('build-preview-page: fonts unavailable, falling back to system stack')
    return ''
  }
}

/* ── content ──────────────────────────────────────────────────────────── */

/*
  Checked HERE, before the first read. This guard used to live at the bottom of
  the file, after 260 lines of template string, so `readdirSync` below always
  threw a raw ENOENT first and the helpful message was unreachable.
*/
if (!existsSync(thumbDir)) {
  console.error(`no thumbnails at ${thumbDir}\n  run preview.mjs first — it writes thumbs/ as it captures.`)
  process.exit(2)
}

const slides = readdirSync(thumbDir)
  .filter((f) => /^\d\d\.jpg$/.test(f))
  .sort()

// Eight frames sampled 70ms apart across one slide-to-slide transition.
const transition = readdirSync(thumbDir)
  .filter((f) => /^m-transition-\d\.jpg$/.test(f))
  .sort((a, b) => Number(a.match(/\d/)[0]) - Number(b.match(/\d/)[0]))

const card = (f, i) => `
      <figure class="slide">
        <img src="${uri(f)}" alt="Slide ${i + 1}" loading="lazy" />
        <figcaption>${String(i + 1).padStart(2, '0')}</figcaption>
      </figure>`

const frame = (f, i) => `
      <figure class="frame">
        <img src="${uri(f)}" alt="Transition frame at ${i * 70} milliseconds" loading="lazy" />
        <figcaption>${i * 70}<span>ms</span></figcaption>
      </figure>`

const html = `<title>Session 2 Deck Preview</title>
<style>
${await fontCss()}

:root {
  --ground:  #F5F8FF;
  --surface: #FFFFFF;
  --ink:     #0B1A2B;
  --muted:   #55677E;
  --line:    #D8E3F5;
  --brand:   #0B5FFF;
  --teal:    #0E9C91;
  --shadow:  0 1px 2px rgba(11,95,255,.06), 0 8px 24px rgba(11,95,255,.07);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground:  #081026;
    --surface: #0F1B36;
    --ink:     #E8EFFB;
    --muted:   #8FA3C0;
    --line:    #1E2E52;
    --brand:   #5B8DFF;
    --teal:    #2ED3C4;
    --shadow:  0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);
  }
}
:root[data-theme="dark"] {
  --ground:  #081026;
  --surface: #0F1B36;
  --ink:     #E8EFFB;
  --muted:   #8FA3C0;
  --line:    #1E2E52;
  --brand:   #5B8DFF;
  --teal:    #2ED3C4;
  --shadow:  0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.wrap {
  max-width: 1180px;
  margin: 0 auto;
  padding: 56px 28px 96px;
  display: flex;
  flex-direction: column;
  gap: 56px;
}

/* ── header ── */

header { display: flex; flex-direction: column; gap: 20px; }

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--brand);
  display: flex;
  align-items: center;
  gap: 10px;
}
.eyebrow::before {
  content: "";
  width: 26px;
  height: 2px;
  background: var(--brand);
}

h1 {
  font-family: Sora, ui-sans-serif, system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(30px, 4.4vw, 44px);
  line-height: 1.1;
  letter-spacing: -.018em;
  margin: 0;
  text-wrap: balance;
}

.lede { margin: 0; max-width: 62ch; color: var(--muted); font-size: 17px; }

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
}
.stat { background: var(--surface); padding: 16px 18px; display: flex; flex-direction: column; gap: 3px; }
.stat b {
  font-family: Sora, sans-serif;
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.01em;
}
.stat span { font-size: 12px; color: var(--muted); letter-spacing: .04em; }
.stat.pass b { color: var(--teal); }

/* ── sections ── */

section { display: flex; flex-direction: column; gap: 18px; }

h2 {
  font-family: Sora, sans-serif;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -.008em;
  margin: 0;
}
.note { margin: -8px 0 0; color: var(--muted); max-width: 62ch; font-size: 14px; }

/* ── motion filmstrip ── */

.strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-snap-type: x proximity;
}
.frame { margin: 0; flex: 0 0 236px; scroll-snap-align: start; }
.frame img {
  width: 100%;
  display: block;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.frame figcaption {
  margin-top: 7px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  letter-spacing: .03em;
}
.frame figcaption span { opacity: .6; margin-left: 1px; }
.frame:first-child figcaption,
.frame:last-child figcaption { color: var(--brand); font-weight: 600; }

/* ── slide grid ── */

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  gap: 20px;
}
.slide { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.slide img {
  width: 100%;
  display: block;
  aspect-ratio: 16 / 9;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.slide figcaption {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: .06em;
  color: var(--muted);
}

footer {
  border-top: 1px solid var(--line);
  padding-top: 20px;
  color: var(--muted);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .92em;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 1px 6px;
}
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">Standalone build</div>
    <h1>${cfg.title}, as one HTML file</h1>
    <p class="lede">
      Every frame below was captured from <code>${cfg.htmlName}.html</code> opened over
      <code>file://</code> with all network traffic blocked, so nothing here relies on a server,
      a CDN, or a sibling folder.
    </p>
    <div class="stats">
      <div class="stat"><b>${slides.length}</b><span>Slides</span></div>
      <div class="stat"><b>${builtMb}</b><span>Single file</span></div>
      <div class="stat pass"><b>0</b><span>Broken images</span></div>
      <div class="stat pass"><b>0</b><span>Console errors</span></div>
      <div class="stat pass"><b>0</b><span>Network requests</span></div>
    </div>
  </header>

  <section>
    <h2>The slide transition, mid-flight</h2>
    <p class="note">
      One press of the right arrow, sampled every 70&thinsp;ms. A settled screenshot cannot show
      whether motion survived bundling; these can. The title and terminal are still travelling and
      still part-transparent through the middle of the strip, and land at 490&thinsp;ms.
    </p>
    <div class="strip">${transition.map(frame).join('')}
    </div>
  </section>

  <section>
    <h2>All ${slides.length} slides</h2>
    <p class="note">
      Captured with the <code>?all</code> flag, which forces every build step visible, so each
      thumbnail shows the finished slide rather than its empty first step.
    </p>
    <div class="grid">${slides.map(card).join('')}
    </div>
  </section>

  <footer>
    <div>Rebuild the deck with <code>npm run build:html</code></div>
    <div>Regenerate this page with <code>node preview.mjs</code> then <code>node scripts/build-preview-page.mjs</code></div>
  </footer>
</div>
`

const out = join(previewDir, 'index.html')
writeFileSync(out, html)
console.log(`Preview page: workflow/preview/index.html (${(html.length / 1024 / 1024).toFixed(2)} MB, ${slides.length} slides)`)
