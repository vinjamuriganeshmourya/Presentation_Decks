import { STILL } from './scene'

/**
 * EVERY ELEMENT ON EVERY SLIDE ENTERS (user, 2026-10-15).
 *
 * The kit's header already arrives through `RevealGroup` (kicker, then title,
 * then lead: 26px rise, 0.55s, `[0.22, 1, 0.36, 1]`, 0.12s in and 0.09s apart,
 * the same numbers as the reference deck's element reveal). This does the same
 * for everything under the header, on every slide type, without touching a
 * figure: when a slide's `<section>` is mounted, its content is walked in
 * reading order and each unit gets a Web Animations entrance.
 *
 *   units      every text block, picture (svg, img, canvas, iframe) and drawn
 *              box (a card, a stage, a row with a ground or a ring), in
 *              READING order: top to bottom, and left to right within a row
 *              (review 2026-10-16, A6; it was text first, then pictures,
 *              which brought a slide's lower text in before the picture
 *              above it). An svg connector whose path carries `data-draw`
 *              also draws itself on in its slot.
 *   motion     opacity 0 to the element's OWN opacity, and the `translate`
 *              property 0 26px to 0. `translate` composes with the transform an
 *              element already has (`At`'s centring), and the end value is the
 *              element's own, so nothing jumps when the animation is removed.
 *   timing     0.55s each on `[0.22, 1, 0.36, 1]`; the first unit at 0.25s,
 *              after the title, and the step between units shrinks with their
 *              number so the LAST one finishes by 1.5s.
 *   reduced    under `prefers-reduced-motion` the units fade, all together,
 *              with no movement.
 *
 * An element that is hidden in the slide's final state (own opacity 0) is left
 * alone, so the entrance never flashes something the slide does not show.
 * `fill: 'backwards'` holds a unit at its start until its delay, then the
 * animation is removed and the element is exactly as React rendered it.
 *
 * It runs from a MutationObserver, so it lands in the same task as React's
 * commit, before the first paint: no frame of the finished slide shows first.
 * Thumbnails in the slide picker (inside the dialog) are skipped, as are the
 * harness URLs that hold every loop still.
 *
 * THE KIT'S OWN ENTRANCES ARE HELD TO THE SAME 1.5s. The agenda's items, the
 * section divider's number and the quiz frame stagger in for up to 2.05s. Two
 * frames after a slide mounts (when those have started), any finite animation
 * inside it that would end past 1.5s is played faster, by exactly the factor
 * that makes it end on time. Its curve and its order are unchanged.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DUR = 550
const RISE = 26
const FIRST = 250
const LAST_END = 1500
const MAX_STEP = 60

const PICTURE = new Set(['svg', 'img', 'canvas', 'iframe', 'video'])

function hasOwnText(el: Element): boolean {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent && n.textContent.trim()) return true
  return false
}

function drawnBox(cs: CSSStyleDeclaration): boolean {
  const bg = cs.backgroundColor
  const hasBg = !!bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)
  const hasRing = cs.boxShadow && cs.boxShadow !== 'none'
  const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none'
  return hasBg || !!hasRing || hasBorder || cs.backgroundImage !== 'none'
}

function collect(root: Element) {
  const text: HTMLElement[] = []
  const pictures: Element[] = []
  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase()
    if (el.matches('[data-zone="header"]')) return
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0 && tag !== 'svg') {
      for (const c of el.children) walk(c)
      return
    }
    if (PICTURE.has(tag)) {
      pictures.push(el)
      return
    }
    if (hasOwnText(el)) {
      text.push(el as HTMLElement)
      return
    }
    if (r.width >= 24 && r.height >= 16 && drawnBox(cs)) text.push(el as HTMLElement)
    for (const c of el.children) walk(c)
  }
  for (const c of root.children) walk(c)
  return readingOrder([...text, ...pictures])
}

/**
 * READING ORDER (review 2026-10-16, A6): top to bottom, then left to right,
 * whatever the unit is. Units whose tops sit within ROW px of a row's first
 * unit are one row and enter left to right; a box comes before what is
 * inside it because its top is above its contents'.
 */
const ROW = 18
function readingOrder(units: Element[]): Element[] {
  const boxes = units.map((el) => ({ el, r: el.getBoundingClientRect() }))
  boxes.sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
  const out: Element[] = []
  let row: typeof boxes = []
  const flush = () => {
    row.sort((a, b) => a.r.left - b.r.left || a.r.top - b.r.top)
    for (const u of row) out.push(u.el)
    row = []
  }
  for (const u of boxes) {
    if (row.length && u.r.top - row[0].r.top > ROW) flush()
    row.push(u)
  }
  flush()
  return out
}

/** A connector marked `data-draw` draws itself on, from its start, in its slot of the order. */
function drawOn(el: Element, delay: number, reduce: boolean) {
  for (const path of el.querySelectorAll<SVGGeometryElement>('[data-draw]')) {
    const len = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0
    if (!(len > 0)) continue
    path.animate(
      [
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: `${len}` },
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: '0' },
      ],
      { duration: reduce ? 1 : DUR, delay: reduce ? 0 : delay, easing: EASE, fill: 'backwards' },
    )
  }
}

function holdToBudget(section: Element, t0: number) {
  for (const a of document.getAnimations()) {
    const target = (a.effect as KeyframeEffect | null)?.target
    if (!target || !section.contains(target)) continue
    const t = a.effect!.getComputedTiming()
    if (!Number.isFinite(t.endTime as number)) continue
    const left = (t.endTime as number) - Number(a.currentTime ?? 0)
    const budget = LAST_END - (performance.now() - t0)
    if (budget > 0 && left > budget) a.playbackRate = left / budget
  }
}

function enter(section: Element) {
  const t0 = performance.now()
  requestAnimationFrame(() => requestAnimationFrame(() => holdToBudget(section, t0)))
  const content = section.querySelector(':scope > div.z-10') ?? section
  const units = collect(content)
  if (!units.length) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = Math.min(MAX_STEP, (LAST_END - DUR - FIRST) / Math.max(1, units.length - 1))
  units.forEach((el, i) => {
    const cs = getComputedStyle(el)
    const own = parseFloat(cs.opacity)
    if (!(own > 0)) return
    const move = !reduce && (cs.translate === 'none' || cs.translate === '' || cs.translate === '0px')
    const frames: Keyframe[] = move
      ? [{ opacity: 0, translate: `0 ${RISE}px` }, { opacity: own, translate: '0 0' }]
      : [{ opacity: 0 }, { opacity: own }]
    const delay = FIRST + i * step
    el.animate(frames, {
      duration: reduce ? 400 : DUR,
      delay: reduce ? 0 : delay,
      easing: EASE,
      fill: 'backwards',
    })
    if (el.tagName.toLowerCase() === 'svg') drawOn(el, delay, reduce)
  })
}

let installed = false

/** Called once by the deck file. */
export function installEntrances() {
  if (installed || typeof window === 'undefined' || STILL) return
  installed = true
  const mo = new MutationObserver((records) => {
    for (const rec of records)
      for (const n of rec.addedNodes) {
        if (!(n instanceof Element)) continue
        const sections = n.tagName === 'SECTION' ? [n] : [...n.querySelectorAll('section')]
        for (const s of sections) if (!s.closest('[role="dialog"]')) enter(s)
      }
  })
  const start = () => mo.observe(document.body, { childList: true, subtree: true })
  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start)
}
