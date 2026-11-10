/** The session's one-off figures and slides, merged from each section's file. */
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as d from './d'
import * as e from './e'
import * as f from './f'
import * as h from './h'
import * as g from './g'

export const figures = { ...a.figures, ...b.figures, ...c.figures, ...d.figures, ...e.figures, ...f.figures, ...h.figures, ...g.figures }
export const slides = { ...(a.slides ?? {}), ...(b.slides ?? {}), ...(c.slides ?? {}), ...(d.slides ?? {}), ...(e.slides ?? {}), ...(f.slides ?? {}), ...(h.slides ?? {}), ...(g.slides ?? {}) }
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', d.css ?? '', e.css ?? '', f.css ?? '', h.css ?? '', g.css ?? ''].join('\n')
