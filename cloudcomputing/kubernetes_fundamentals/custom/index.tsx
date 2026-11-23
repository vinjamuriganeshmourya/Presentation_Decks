/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import { icons3dCss } from '@/engine/icons3d'
import { figkitCss } from '@/engine/figkit'
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as d from './d'
import * as e from './e'
import * as h from './h'
import * as i from './i'
import * as j from './j'
import { FeedbackCard } from '@/decks/figures/variants'

const parts: { figures: Record<string, unknown>; css?: string }[] = [a, b, c, d, e, h, i, j]
export const figures = Object.assign({}, stubs.figures, ...parts.map((p) => p.figures))
export const css = [icons3dCss, figkitCss, ...parts.map((p) => p.css ?? '')].join('\n')
/** The feedback frame (user, 2026-11-23): the engine's feedback title card, placed after the takeaways. */
export const slides = { FeedbackCard }
