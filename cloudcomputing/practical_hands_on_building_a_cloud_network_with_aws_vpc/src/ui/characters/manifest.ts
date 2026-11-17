import type { IllustrationName } from './Illustration'

/**
 * Override map for AI-generated character assets.
 *
 * By default the deck uses the built-in vector characters. If you generate
 * assets with `scripts/generate_character_svgs.py` (or the raster
 * `generate_characters.py` with a billing-enabled key), add entries here
 * pointing at the produced files, e.g.:
 *
 *   export const AI_CHARACTER_ASSETS = {
 *     'nova-wave': '/assets/characters/nova-wave.svg',
 *     'quiz':      '/assets/characters/nova-quiz.svg',
 *   }
 *
 * <Illustration> then renders the asset instead of the built-in — no slide
 * code changes required.
 */
export const AI_CHARACTER_ASSETS: Partial<Record<IllustrationName, string>> = {}
