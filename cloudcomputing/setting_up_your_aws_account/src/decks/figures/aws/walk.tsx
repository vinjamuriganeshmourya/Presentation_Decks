import { colors } from '@/design/tokens'
import { Callout } from '@/ui'
import { useEffect, useState } from 'react'
import { useInstant } from '@/motion/instant'
import { BOX_W, Card, STILL } from '../scene'

/**
 * THE SCREENSHOT WALKTHROUGH (session 3, 2026-10-26), the frame of 18 of this deck's slides.
 *
 * The reference stepped through each screenshot on Next: an overview of the whole page, then a zoom to
 * each field with an amber ring and that field's callout. The user: no Next, no Autoplay, every slide
 * plays by itself, motion subtle. So the same states run on a clock (`useCycle`, held on the last
 * state on harness URLs and in thumbnails), the zoom is one transform on the screenshot (0.9s on the
 * house curve), and the rings cross-fade.
 *
 * The step callouts are STACKED, all visible, the one for the state on screen in amber and the rest
 * muted, instead of the reference's one slot that swapped: a callout the user removed (slides 9, 22)
 * then leaves no empty slot behind (global rule 4).
 *
 *   mode 'walk'    the reference's zooms
 *   mode 'full'    the whole screenshot throughout; only the ring moves (slides 17, 18)
 *   mode 'static'  the first state only, nothing moves (slide 14)
 */

export interface WalkState {
  /** [scale, x, y]: the screenshot's scale and offset in the viewport's px (the reference's background crop) */
  zoom: [number, number, number]
  ring: { x: number; y: number; w: number; h: number; dim: boolean } | null
  /** index into `focus` of the callout for this state */
  callout: number | null
}

export interface Walk {
  img: string
  id: string
  label: string
  section: string
  kicker: string
  title: string
  url: string
  cardW: number
  vp: [number, number]
  chip: string
  items: string[]
  extra: string[]
  focus: { title: string; body: string; mono: boolean }[]
  tips: { kind: 'warning' | 'tip' | 'info'; title: string; body: string }[]
  states: WalkState[]
  mode: 'walk' | 'full' | 'static'
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const AMBER = '#F59E0B'
/* review 2026-10-26: a quicker zoom that eases in AND out (the house curve starts at full speed, which
   read as a snap on a large screenshot), then the highlight draws itself once the zoom has settled */
const GLIDE = 'cubic-bezier(0.45, 0, 0.2, 1)'
const ZOOM_MS = 700
const DRAW_MS = 650
/** each state holds this long: time to read the callout, then the next field */
const HOLD = 3200
/* review 2026-10-26: the opening whole-page state was too long; it holds half as long as a highlighted one */
const FIRST_HOLD = HOLD / 2

/**
 * The walkthrough's clock: state 0 (the whole page) for FIRST_HOLD, every highlighted state for HOLD, then
 * round again. Held on `still` on harness URLs, under InstantContext (a picker thumbnail) and for reduced
 * motion, as `useTicker` is.
 */
function useWalkClock(n: number, still: number): number {
  const instant = useInstant()
  const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const held = STILL || instant || reduced || n < 2
  const [k, setK] = useState(0)
  useEffect(() => {
    if (held) return
    const t = window.setTimeout(() => setK((v) => (v + 1) % n), k === 0 ? FIRST_HOLD : HOLD)
    return () => window.clearTimeout(t)
  }, [k, n, held])
  return held ? still : k
}

export function WalkSlide({ w, lesson }: { w: Walk; lesson: string }) {
  const n = w.states.length
  const k = useWalkClock(n, n - 1)
  const st = w.states[k]
  const [vw, vh] = w.vp
  const [z, x, y] = st.zoom
  return (
    <Card id={w.id} kicker={w.kicker} title={w.title} lesson={lesson}>
      <div className="flex items-center gap-9" style={{ width: BOX_W }}>
        {/* the browser: three dots, the address, the page */}
        <div className="shrink-0 overflow-hidden rounded-card bg-white shadow-card ring-1 ring-black/10" style={{ width: w.cardW }}>
          <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3" style={{ height: 34 }}>
            <span className="flex shrink-0 gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-full bg-line" />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate whitespace-nowrap rounded-pill border border-line bg-white px-3 py-0.5 font-mono text-[13px] text-ink">{w.url}</span>
          </div>
          <div className="relative overflow-hidden" style={{ width: vw, height: vh }}>
            {/* clipped by its viewport, so a zoomed screenshot's box overhangs the card while nothing visible does;
                pointer-events none (it is a picture, never a target), which is how the harnesses read decoration */}
            <img
              src={w.img}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 block max-w-none select-none"
              style={{ width: vw, height: vh, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${z})`, transition: `transform ${ZOOM_MS}ms ${GLIDE}` }}
            />
            {/* the highlight DRAWS ITSELF around the field (review 2026-10-26: it faded in while the zoom was still
                moving, so the frame appeared to snap into place). It waits until the zoom has settled, the dim
                comes up, then the amber stroke runs once round the field; leaving, it fades and resets. */}
            {w.states.map((s, i) => {
              if (!s.ring) return null
              const on = i === k
              const wait = w.mode === 'full' ? 120 : ZOOM_MS - 80
              const r = s.ring
              return (
                <div key={i} aria-hidden className="pointer-events-none absolute inset-0">
                  {r.dim && (
                    <span
                      className="absolute"
                      style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 6, boxShadow: '0 0 0 9999px rgba(0, 37, 75, 0.18)', opacity: on ? 1 : 0, transition: `opacity ${on ? 420 : 260}ms ${GLIDE} ${on ? wait : 0}ms` }}
                    />
                  )}
                  <svg className="absolute overflow-visible" style={{ left: r.x, top: r.y }} width={r.w} height={r.h}>
                    <rect
                      x={1.5}
                      y={1.5}
                      width={Math.max(0, r.w - 3)}
                      height={Math.max(0, r.h - 3)}
                      rx={6}
                      fill="none"
                      stroke={AMBER}
                      strokeWidth={3}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1 1"
                      style={{
                        strokeDashoffset: on ? 0 : 1,
                        opacity: on ? 1 : 0,
                        transition: on
                          ? `stroke-dashoffset ${DRAW_MS}ms ${GLIDE} ${wait}ms, opacity 120ms linear ${wait}ms`
                          : `opacity 260ms ${GLIDE}, stroke-dashoffset 0ms linear 260ms`,
                      }}
                    />
                  </svg>
                </div>
              )
            })}
          </div>
        </div>

        {/* the steps, then the callouts */}
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div>
            <span className="inline-flex rounded-pill bg-brand/10 px-3 py-1 font-heading text-[16px] font-semibold text-brand">{w.chip}</span>
          </div>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {w.items.map((it, i) => (
              <li key={it} className="flex items-start gap-3 text-[21px] leading-snug text-ink">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand font-heading text-[16px] font-semibold text-white">{i + 1}</span>
                <span>{it}</span>
              </li>
            ))}
          </ol>
          {w.extra.map((e) => (
            <p key={e} className="m-0 text-[17px] leading-snug text-ink/75">
              {e}
            </p>
          ))}
          {w.focus.map((f, i) => {
            const on = st.callout === i
            return (
              <div
                key={f.title}
                className="rounded-card border-l-[5px] bg-white px-4 py-3 shadow-card-soft"
                style={{ borderColor: on ? AMBER : colors.line, opacity: on ? 1 : 0.6, transition: `opacity 520ms ${EASE}, border-color 520ms ${EASE}` }}
              >
                <p className="m-0 font-heading text-[16px] font-semibold" style={{ color: '#92400E' }}>
                  {f.title}
                </p>
                <p className={`m-0 mt-1 leading-snug text-ink ${f.mono ? 'font-mono text-[17px]' : 'text-[18px]'}`}>{f.body}</p>
              </div>
            )
          })}
          {w.tips.map((t) => (
            <Callout key={t.title} kind={t.kind} title={t.title} asStep={false} className="!p-3.5 [&_p]:text-[16px] [&>div>div]:text-[16px]">
              {t.body}
            </Callout>
          ))}
        </div>
      </div>
    </Card>
  )
}
