/** The session's one-off figures and slides, merged from each builder's file. */
import * as a from './a'
import * as b from './b'
import * as f from './f'
import * as g from './g'
import * as h from './h'
import { K_CSS } from './k'

export const figures = { ...a.figures, ...b.figures, ...f.figures, ...g.figures }
export const slides = { ...(a.slides ?? {}), ...(b.slides ?? {}), ...(f.slides ?? {}), ...h.slides }
export const css = [K_CSS, a.css ?? '', b.css ?? '', f.css ?? '', h.css].join('\n')
