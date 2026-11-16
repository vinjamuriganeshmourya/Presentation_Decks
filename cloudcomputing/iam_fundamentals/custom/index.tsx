/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as c2 from './c2'
import * as i3 from './icons3d'
import * as h from './h'
import * as i from './i'
import * as j from './j'
import * as d from './d'
import * as k from './k'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...h.figures, ...i.figures, ...j.figures, ...d.figures, ...k.figures, ...c2.figures }
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', c2.css ?? '', i3.css, h.css ?? '', i.css ?? '', j.css ?? '', d.css ?? '', k.css ?? ''].join('\n')
/** No whole-slide components in this deck. */
export const slides = {}
