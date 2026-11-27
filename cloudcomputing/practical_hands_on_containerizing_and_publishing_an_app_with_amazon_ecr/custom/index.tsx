/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import { icons3dCss } from '@/engine/icons3d'
import { figkitCss } from '@/engine/figkit'
import * as stubs from './stubs'
import * as k from './k'

const parts: { figures: Record<string, unknown>; css?: string }[] = [k]
export const figures = Object.assign({}, stubs.figures, ...parts.map((p) => p.figures))
export const css = [icons3dCss, figkitCss, ...parts.map((p) => p.css ?? '')].join('\n')
/** No whole-slide components in this deck. */
export const slides = {}
