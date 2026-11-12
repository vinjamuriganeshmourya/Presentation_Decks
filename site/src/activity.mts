/**
 * Last push per deck folder, for the gallery ("Last push by …"). No backend: CI runs this
 * before the site build (it needs the full history, so checkout uses fetch-depth: 0).
 *
 *   npm run activity            -> public/activity.json
 *
 * Output: { generatedAt, decks: { "<course>/<session>": { author, date, message, sha } } }
 * A deck folder with no commits is left out. Deck discovery mirrors site/build.mjs.
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

interface Entry {
  author: string
  date: string
  message: string
  sha: string
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = path.join(ROOT, 'public', 'activity.json')
const SKIP_DIRS = new Set(['site', 'worker', 'node_modules', '_site', 'tests', 'public', 'scripts', 'review'])

const isDir = (p: string): boolean => {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

/** Every <course>/<session> folder that publishes a deck (has dist-single/*.html), as repo-relative paths. */
function deckFolders(): string[] {
  const out: string[] = []
  for (const c of fs.readdirSync(ROOT).sort()) {
    if (c.startsWith('.') || c.startsWith('_') || SKIP_DIRS.has(c) || !isDir(path.join(ROOT, c))) continue
    for (const s of fs.readdirSync(path.join(ROOT, c)).sort()) {
      const dist = path.join(ROOT, c, s, 'dist-single')
      if (s.startsWith('.') || !isDir(dist)) continue
      if (fs.readdirSync(dist).some((f) => /\.html?$/i.test(f))) out.push(`${c}/${s}`)
    }
  }
  return out
}

const git = (args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()

function lastCommit(folder: string): Entry | null {
  const raw = git(['log', '-1', '--format=%an%x1f%aI%x1f%s%x1f%h', '--', folder])
  if (!raw) return null
  const [author, date, message, sha] = raw.split('\x1f')
  return { author, date, message, sha }
}

try {
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
    console.warn('activity: warning: shallow clone, last-push data may be wrong (use fetch-depth: 0)')
  }
} catch {
  /* not a git checkout: every folder is skipped below */
}

const decks: Record<string, Entry> = {}
for (const folder of deckFolders()) {
  let e: Entry | null = null
  try {
    e = lastCommit(folder)
  } catch {
    e = null
  }
  if (!e) {
    console.log(`activity  ${folder}  (no commits, skipped)`)
    continue
  }
  decks[folder] = e
  console.log(`activity  ${folder}  ${e.sha} ${e.date} ${e.author}: ${e.message}`)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), decks }, null, 1) + '\n')
console.log(`wrote ${path.relative(ROOT, OUT)} (${Object.keys(decks).length} decks)`)
