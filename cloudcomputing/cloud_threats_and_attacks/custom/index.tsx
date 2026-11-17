/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import { icons3dCss } from '@/engine/icons3d'
import { figkitCss } from '@/engine/figkit'
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as d from './d'
import * as h from './h'
import * as i from './i'
import * as j from './j'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...d.figures, ...h.figures, ...i.figures, ...j.figures }
export const css = [icons3dCss, figkitCss, a.css ?? '', b.css ?? '', c.css ?? '', d.css ?? '', h.css ?? '', i.css ?? '', j.css ?? ''].join('\n')
/** No whole-slide components in this deck. */
export const slides = {}
