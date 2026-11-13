/** The session's one-off figures, merged from each builder's file (stubs first, so a missing figure shows a placeholder). */
import * as stubs from './stubs'
import * as a from './a'
import * as b from './b'
import * as c from './c'
import * as h from './h'
import * as i from './i'
import * as j from './j'
import { FeedbackCard } from '@/decks/figures/variants'

export const figures = { ...stubs.figures, ...a.figures, ...b.figures, ...c.figures, ...h.figures, ...i.figures, ...j.figures }
/** The feedback frame (user, 2026-11-13): the engine's feedback title card, placed after the takeaways. */
export const slides = { FeedbackCard }
export const css = [a.css ?? '', b.css ?? '', c.css ?? '', h.css ?? '', i.css ?? '', j.css ?? ''].join('\n')
