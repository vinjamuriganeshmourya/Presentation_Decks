/** The session's one-off figures and slides, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as e from './e'
import * as h from './h'
import * as i from './i'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...e.figures, ...h.figures, ...i.figures }
export const slides = { ...(a.slides ?? {}), ...(b.slides ?? {}), ...(c.slides ?? {}), ...(e.slides ?? {}) }
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', e.css ?? '', h.css ?? '', i.css ?? ''].join('\n')
