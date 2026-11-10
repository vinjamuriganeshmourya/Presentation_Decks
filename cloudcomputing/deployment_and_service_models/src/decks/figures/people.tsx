import type { CharacterConfig } from './cast/skins/config'
import { PRESETS } from './cast/skins/config'

/**
 * THE CAST OF "CLOUD COMPUTING FUNDAMENTALS". Every person is a Character Lab
 * preset in the Library look (`shading: 'clay'`, big lidded eyes, sculpted
 * hair; `slide-kit/characters-lab/CONTRACTS.md`, "Art direction"), drawn by
 * the rig vendored in `./cast`. Review 2026-10-16: no bearded character
 * anywhere (so no `rohan`), and most scenes carry no people at all; the few
 * that remain (the reading room, the mess kitchen, the tenants) use these.
 *
 *   MEERA     the lab's Meera
 *   RAVI      the lab's Dev (glasses, side part)
 *   ARJUN     the lab's Arjun, the white-shirt teacher
 *   ANITA     the lab's Ananya
 *   OPERATOR  the lab's Arjun (kept for old imports; no slide shows him)
 *   TENANTS   four faces: Kabir, Riya, Dev, Ananya
 */
export const MEERA: CharacterConfig = PRESETS.meera
export const RAVI: CharacterConfig = PRESETS.dev
export const ARJUN: CharacterConfig = PRESETS.arjun
export const ANITA: CharacterConfig = PRESETS.ananya
export const OPERATOR: CharacterConfig = PRESETS.arjun

/** Four faces, in a fixed order: tenants A, B, C and a fourth reader or sender. */
export const TENANTS: CharacterConfig[] = [PRESETS.kabir, PRESETS.riya, PRESETS.dev, PRESETS.ananya]
