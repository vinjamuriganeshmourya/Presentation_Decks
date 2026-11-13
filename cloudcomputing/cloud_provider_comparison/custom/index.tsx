/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as h from './h'
import * as d from './d'
import * as j from './j'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...h.figures, ...d.figures, ...j.figures }
export const slides = {}
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', h.css ?? '', d.css ?? '', j.css ?? ''].join('\n')
