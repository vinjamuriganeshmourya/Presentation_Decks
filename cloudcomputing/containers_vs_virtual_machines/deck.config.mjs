/**
 * Per-session values, read by every harness — SESSION-OWNED.
 *
 * The harnesses used to hardcode these, which is the only reason `qa.mjs`,
 * `video-safe.mjs` and `preview.mjs` differed between sessions at all: one
 * carried `TOTAL ?? 44` and another `?? 48`, one defaulted its output to
 * `dist-single/deployment-session-1.html` and another to `-2`, and `qa.mjs` had
 * an absolute `/tmp/claude-1000/<a-dead-session-id>/scratchpad/shots` baked in
 * as its default output directory.
 *
 * With the numbers here, the three harnesses are pure kit and sync cleanly. Keep
 * `slideCount` current when slides are added or removed — every harness reads it
 * and a stale count means the sweep silently skips the tail of the deck.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(readFileSync(resolve(here, 'deck.config.json'), 'utf8'))

export const NAME = cfg.name
export const TITLE = cfg.title
export const SLIDE_COUNT = cfg.slideCount
export const DEV_PORT = cfg.devPort ?? 5173
export const HTML_FILE = `dist-single/${cfg.htmlName}.html`
export default cfg
