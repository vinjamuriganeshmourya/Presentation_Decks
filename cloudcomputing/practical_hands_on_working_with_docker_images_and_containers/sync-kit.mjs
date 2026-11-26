#!/usr/bin/env node
/**
 * sync-kit.mjs — apply this template's kit to a session, or report the drift.
 *
 *   node sync-kit.mjs --check  ../../django_deployement_course/deployement_session_1_v2
 *   node sync-kit.mjs --apply  ../../django_deployement_course/deployement_session_1_v2
 *   node sync-kit.mjs --check  ../../django_deployement_course/deployement_session_1_v2 ../../django_deployement_course/deployement_session_2
 *
 * WHY A SCRIPT AND NOT A SHARED PACKAGE
 *
 * Each session is a standalone Vite app that must keep building on its own,
 * years after it was recorded, and `npm run build:html` has to emit ONE
 * self-contained file. A workspace package that every session imports would give
 * automatic propagation, and that is exactly the problem: an archived session's
 * rendered output would change underneath it whenever the kit moved. Sessions
 * are deliverables, not consumers. So propagation is a deliberate command, and
 * `--check` exists so nobody has to remember which sessions are behind.
 *
 * WHAT IS KIT AND WHAT IS THE SESSION'S OWN
 *
 * `KIT` below is the shared rendering layer: components, tokens, motion, the
 * player, the harnesses and the build config. `--apply` OVERWRITES those in the
 * target. Anything not matched by KIT is never read and never written, which is
 * how a session keeps its content:
 *
 *     src/decks/           the deck itself, and activeDeck.ts pointing at it
 *     src/export/revealSteps.ts   generated per deck
 *     src/export/deckCss.ts       generated per deck
 *     deck.config.json     name, title, slide count
 *     public/shots/        that session's real screenshots
 *     workflow/            plans, captures, previews, sign-offs
 *     package.json  CLAUDE.md  README.md  dist*  node_modules
 *
 * `--check` is read-only and exits 1 when anything is behind, so it works in a
 * pre-flight. `--apply` prints every file it writes and backs up nothing: the
 * repo is the backup, so run it on a clean tree.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * The kit, as explicit paths and directory roots. Directories are walked
 * recursively; `except` names files inside them that the session owns.
 *
 * Listing this rather than deriving it ("everything but src/decks") is
 * deliberate: a new session-owned file must be added here consciously, and a new
 * kit file that nobody listed is caught by `--check` reporting it as untracked
 * rather than being silently forgotten.
 */
const KIT = {
  dirs: [
    { path: 'src/design' },
    { path: 'src/motion' },
    { path: 'src/deck' },
    { path: 'src/ui' },
    { path: 'src/slides' },
    { path: 'src/export', except: ['revealSteps.ts', 'deckCss.ts'] },
    { path: 'scripts' },
    /*
      The BUILD half of the review app. The app itself is independent and lives at
      the repo root in `review-app/`, because a reviewer picks a course and a
      session before there is a session folder to be inside of.

      What has to live in the session is only what the session's own toolchain
      needs in order to produce a reviewable build: this babel plugin, plus
      `vite.review.config.ts` beside it. Sessions deliberately do not share a
      package, so each one builds its own deck with its own React and its own vite
      — the app shells out to `npx vite build -c vite.review.config.ts` here.
    */
    { path: 'review' },
    { path: 'workflow/export' },
  ],
  files: [
    /*
      The component GALLERY, not session content. It is the one file under
      `src/decks/` that is kit: it exercises every slide type and every figure, so
      it has to track a component API change the same way the components do. It
      was byte-identical in every session, and when `QuizSlide` was retired from
      the kit each session's private copy broke on its own.
    */
    'src/decks/sampleDeck.tsx',
    'src/App.tsx',
    'src/main.tsx',
    'src/index.css',
    'src/vite-env.d.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'vite.config.ts',
    'vite.singlefile.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'index.html',
    'qa.mjs',
    'video-safe.mjs',
    'preview.mjs',
    'chrome-check.mjs',
    'continuity-check.mjs',
    'align-check.mjs',
    'fit-check.mjs',
    /* Session 31's checks, folded into the kit on 2026-10-14 (content rules 38
       to 43 and 47, the gestures and phone rules, the box-overflow rule): a deck
       built from the kit is held to the same list a Python-course deck was. */
    'agenda-check.mjs',
    'autohide-check.mjs',
    'autoplay-check.mjs',
    'box-overflow-check.mjs',
    'controls-clear-check.mjs',
    'feedback-check.mjs',
    'gesture-check.mjs',
    'ligature-check.mjs',
    'mixed-align-check.mjs',
    'nav-stress-check.mjs',
    'overlap-check.mjs',
    'phone-nav-check.mjs',
    /* The marker's own harness. It drives a real pointer over the BUILT html, so
       it is the only check here that can catch the marker breaking, and a session
       that is behind on it is a session whose marker nobody has tested. */
    'marker-check.mjs',
    'scan-fonts.mjs',
    'vite.review.config.ts',
    'deck.config.mjs',
  ],
  /** Written only when absent — a session's own values live in them. */
  scaffold: ['deck.config.json'],
  /**
   * RETIRED kit files, DELETED from the target.
   *
   * Copying files forward cannot express "this layout is no longer how we do
   * things". `QuizSlide` rendered a question with four lettered options; quizzes
   * are delivered by an external component, so a deck's only quiz frame is the
   * announcement one and having the other in the kit meant decks kept being
   * written the wrong way. It is removed rather than left orphaned, because an
   * orphaned slide type with no barrel export is a trap: it still imports and
   * still compiles.
   *
   * A session that still REFERENCES a retired file will fail its own typecheck
   * after the sync, which is the intended outcome: the reference has to be
   * removed by hand, since it lives in session-owned deck content.
   */
  remove: ['src/slides/QuizSlide.tsx'],
}

const walk = (root, base = root) => {
  if (!existsSync(root)) return []
  return readdirSync(root).flatMap((entry) => {
    const abs = join(root, entry)
    return statSync(abs).isDirectory() ? walk(abs, base) : [relative(base, abs)]
  })
}

/** Every kit path, relative to a project root. */
function kitPaths() {
  const out = [...KIT.files]
  for (const { path: dir, except = [] } of KIT.dirs) {
    for (const rel of walk(join(HERE, dir))) {
      if (!except.includes(rel)) out.push(`${dir}/${rel}`)
    }
  }
  return out.sort()
}

const read = (p) => (existsSync(p) ? readFileSync(p) : null)

function compare(target) {
  const rows = []
  for (const rel of kitPaths()) {
    const src = read(join(HERE, rel))
    const dst = read(join(target, rel))
    if (src === null) continue // a kit path the template itself no longer has
    if (dst === null) rows.push({ rel, state: 'missing' })
    else if (!src.equals(dst)) rows.push({ rel, state: 'behind' })
  }
  for (const rel of KIT.scaffold) {
    if (!existsSync(join(target, rel))) rows.push({ rel, state: 'scaffold' })
  }
  for (const rel of KIT.remove) {
    if (existsSync(join(target, rel))) rows.push({ rel, state: 'retired' })
  }
  return rows
}

function apply(target, rows) {
  for (const { rel, state } of rows) {
    const dst = join(target, rel)
    if (state === 'retired') {
      rmSync(dst)
      console.log(`  removed ${rel}`)
      continue
    }
    mkdirSync(dirname(dst), { recursive: true })
    writeFileSync(dst, readFileSync(join(HERE, rel)))
    console.log(`  ${state === 'missing' ? 'added  ' : 'updated'} ${rel}`)
  }
}

/* ── cli ──────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2)
const mode = args.find((a) => a === '--check' || a === '--apply')
const targets = args.filter((a) => !a.startsWith('--')).map((a) => resolve(a))

if (!mode || targets.length === 0) {
  console.error('usage: node sync-kit.mjs (--check|--apply) <sessionDir> [<sessionDir>...]')
  process.exit(2)
}

let behind = 0
for (const target of targets) {
  if (!existsSync(join(target, 'src'))) {
    console.error(`not a session directory: ${target}`)
    process.exit(2)
  }

  /*
    PREFLIGHT: the seam must exist before the kit lands on top of it.

    `src/App.tsx` and `src/export/slideModule.tsx` are kit, and both import
    `{ deck, meta }` from `@/decks/activeDeck`. That file is session-owned, so
    sync will not create it — and a session that does not have one yet is left
    with a kit that cannot compile. Refuse rather than break it, and print the
    exact two lines to write.
  */
  const seam = join(target, 'src/decks/activeDeck.ts')
  if (!existsSync(seam)) {
    const decks = existsSync(join(target, 'src/decks'))
      ? readdirSync(join(target, 'src/decks')).filter((f) => f.endsWith('.tsx'))
      : []
    console.error(`\n${target}\n  MISSING src/decks/activeDeck.ts`)
    console.error('\n  The kit imports the live deck through that file. Create it first:\n')
    const guess = decks.find((f) => !f.startsWith('sample')) ?? '<yourDeck>.tsx'
    const base = guess.replace(/\.tsx$/, '')
    console.error(`      export { ${base} as deck, ${base.replace(/Deck$/, '')}Meta as meta } from './${base}'`)
    console.error(`\n  (decks found: ${decks.join(', ') || 'none'} — check the exported names)\n`)
    process.exit(2)
  }
  const rows = compare(target)
  const label = relative(resolve(HERE, '..'), target) || target
  if (rows.length === 0) {
    console.log(`\n${label}: up to date (${kitPaths().length} kit files)`)
    continue
  }
  behind += rows.length
  console.log(`\n${label}: ${rows.length} of ${kitPaths().length} kit files differ`)
  if (mode === '--apply') apply(target, rows)
  else for (const { rel, state } of rows) console.log(`  ${state.padEnd(8)} ${rel}`)
}

if (mode === '--check' && behind > 0) {
  console.log(`\n${behind} file(s) behind the template. Run with --apply to update.`)
  process.exit(1)
}
if (mode === '--apply') {
  console.log(
    '\nDone. Now, in each session: npx tsc -b --noEmit && npm run build:html,' +
      '\nthen re-run video-safe.mjs and qa.mjs before trusting the result.',
  )
}
