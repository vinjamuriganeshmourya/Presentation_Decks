/** The session's one-off figures and slides, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as e from './e'
import * as h from './h'
import * as i from './i'
import * as i2 from './i2'
import * as j from './j'
import * as k from './k'; import * as z from './z'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...e.figures, ...h.figures, ...i.figures, ...i2.figures, ...j.figures, ...k.figures, ...z.figures }
export const slides = { ...(a.slides ?? {}), ...(b.slides ?? {}), ...(c.slides ?? {}), ...(e.slides ?? {}) }
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', e.css ?? '', h.css ?? '', i.css ?? '', i2.css ?? '', j.css ?? '', k.css ?? '', z.css ?? ''].join('\n')
