/** The session's one-off figures and slides, merged from each builder's file. */
import * as a from './a'
import * as b from './b'
import * as e from './e'
import * as f from './f'

export const figures = { ...a.figures, ...b.figures, ...e.figures, ...f.figures }
export const slides = { ...(a.slides ?? {}), ...(b.slides ?? {}), ...(e.slides ?? {}), ...(f.slides ?? {}) }
export const css = [a.css ?? '', b.css ?? '', e.css ?? '', f.css ?? ''].join('\n')
