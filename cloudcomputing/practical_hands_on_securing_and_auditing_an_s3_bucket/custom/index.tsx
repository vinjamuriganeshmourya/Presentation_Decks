/** The practical's one-off figures (E_P22 the seven-part plan, E_P27C the cleanup), split from Security Practices & Compliance on 2026-11-20. */
import { icons3dCss } from '@/engine/icons3d'
import { figkitCss } from '@/engine/figkit'
import * as e from './e'

export const figures = { ...e.figures }
export const css = [icons3dCss, figkitCss, e.css ?? ''].join('\n')
/** No whole-slide components in this deck. */
export const slides = {}
