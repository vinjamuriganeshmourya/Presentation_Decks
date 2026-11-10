import { STILL } from './scene'
import { getAutoAnim } from '@/deck/autoAnim'
import { isFull, localStep, registerTrack, stepGen, subscribeSteps } from '@/deck/animSteps'

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
 * THE KIT'S OWN ENTRANCES ARE HELD TO THE SAME 1.0s. The agenda's items, the
 * section divider's number and the quiz frame stagger in for up to 2.05s. Two
 * frames after a slide mounts (when those have started), any finite animation
 * inside it that would end past 1.5s is played faster, by exactly the factor
 * that makes it end on time. Its curve and its order are unchanged.
 */

/*
  FAST, AND A BOX NEVER LOOKS EMPTY (user, 2026-10-30, G4: "speed up the
  appearance of inner elements, so that containers never look empty while
  content loads; use a fast, clean entry animation throughout"): the units
  enter in 420ms, the first at 150ms, the last done by 1000ms, and a unit
  that sits INSIDE a top-level unit (a label in a box, a resource in a
  subnet on a stage) starts INSIDE_GAP ms after that top-level unit, whatever
  its depth or place in the reading order, so a box and everything in it
  read as one arrival.
*/
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DUR = 420
const RISE = 18
const FIRST = 150
const LAST_END = 1000
const MAX_STEP = 45
const INSIDE_GAP = 40

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

/**
 * STEP-BY-STEP (auto animation OFF, user 2026-11-03): the units are gathered into BLOCKS, a block being
 * a unit no other unit contains (the lead, one point of a rail, a whole stage or table with everything
 * in it), in reading order; one press brings in one block. The figure inside a stage then builds on the
 * presses after (`useCycle`), so a slide walks: lead, points, picture, then the picture's own steps.
 * Each unit gets a paused entrance, played forward when its block's press arrives and backward on Back.
 */
function enterStepped(section: Element, units: Element[]) {
  const blocks: Element[][] = []
  for (const el of units) {
    const owner = blocks.find((b) => b[0] !== el && b[0].contains(el))
    if (owner) owner.push(el)
    else blocks.push([el])
  }
  /* side by side, the left column first: a block beside a taller one (a point beside the stage) comes before it */
  const rect = new Map(blocks.map((b) => [b, b[0].getBoundingClientRect()]))
  blocks.sort((a, b) => {
    const ra = rect.get(a)!
    const rb = rect.get(b)!
    const overlap = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
    if (overlap > 8 && (ra.right <= rb.left + 4 || rb.right <= ra.left + 4)) return ra.left - rb.left
    return ra.top - rb.top || ra.left - rb.left
  })
  const anims: Animation[][] = blocks.map((b) =>
    b.flatMap((el) => {
      const cs = getComputedStyle(el)
      const own = parseFloat(cs.opacity)
      if (!(own > 0)) return []
      const move = cs.translate === 'none' || cs.translate === '' || cs.translate === '0px'
      /*
        ONLY THE START KEYFRAME (2026-11-04, session 5): the end is implicit, the element's own live opacity and
        translate. With an explicit `{ opacity: own }` end and fill 'both', a shown block was pinned at the opacity
        it had at mount, so a figure's later fade (a pair lit, the rest dimmed: G4) never reached the screen.
      */
      const frames: Keyframe[] = move ? [{ opacity: 0, translate: `0 ${RISE}px`, offset: 0 }] : [{ opacity: 0, offset: 0 }]
      const a = el.animate(frames, { duration: DUR, easing: EASE, fill: 'both' })
      a.pause()
      a.currentTime = 0
      return [a]
    }),
  )
  const mine = stepGen()
  registerTrack('entrance', blocks.length, mine)
  let shown = -1
  const sync = () => {
    if (!section.isConnected) {
      off()
      anims.flat().forEach((a) => a.cancel())
      return
    }
    /* the deck moved on: this slide is leaving, it keeps what it shows (no reverse play while it fades out) */
    if (stepGen() !== mine) return
    const n = isFull() ? blocks.length : localStep('entrance')
    if (n === shown) return
    const instant = shown < 0
    anims.forEach((group, i) =>
      group.forEach((a) => {
        const want = i < n
        if (instant) {
          a.currentTime = want ? DUR : 0
          return
        }
        /*
          ONLY A BLOCK THAT IS NOT ALREADY WHERE IT SHOULD BE MOVES (round 2, change 5: "all content
          appears at once, then appears again one step at a time"). `play()` on a FINISHED animation
          auto-rewinds it: a shown block (at its end, rate 1) restarted from opacity 0 and came back,
          and a hidden one (at 0, rate -1) jumped to its END, fully visible, then faded out again.
          Every press did that to every block of the slide. A block already at its target is left alone.
        */
        const t = Number(a.currentTime ?? 0)
        a.playbackRate = want ? 1 : -1
        if (want ? t >= DUR : t <= 0) {
          /* already there: hold it, never `play()` (that would rewind it) */
          a.pause()
          a.currentTime = want ? DUR : 0
          return
        }
        a.play()
      }),
    )
    shown = n
  }
  const off = subscribeSteps(sync)
  sync()
}

function enter(section: Element) {
  if (!getAutoAnim()) {
    const content = section.querySelector(':scope > div.z-10') ?? section
    enterStepped(section, collect(content))
    return
  }
  const t0 = performance.now()
  requestAnimationFrame(() => requestAnimationFrame(() => holdToBudget(section, t0)))
  const content = section.querySelector(':scope > div.z-10') ?? section
  const units = collect(content)
  if (!units.length) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  /* the top-level units (those inside no other unit) set the pace; a unit inside a box follows its box */
  const set = new Set(units)
  const boxOf = (el: Element): Element | null => {
    let p = el.parentElement
    while (p && p !== content) {
      if (set.has(p)) return p
      p = p.parentElement
    }
    return null
  }
  const top = units.filter((u) => !boxOf(u))
  const step = Math.min(MAX_STEP, (LAST_END - DUR - FIRST) / Math.max(1, top.length - 1))
  const delays = new Map<Element, number>()
  top.forEach((el, i) => delays.set(el, FIRST + i * step))
  /* a unit inside a top-level unit follows THAT unit, whatever its depth: a stage and everything on it arrive as one */
  const delayOf = (el: Element): number => {
    const d = delays.get(el)
    if (d !== undefined) return d
    let box = boxOf(el)
    let root = box
    while (box) {
      root = box
      box = boxOf(box)
    }
    const v = root ? (delays.get(root) ?? FIRST) + INSIDE_GAP : FIRST
    delays.set(el, v)
    return v
  }
  units.forEach((el) => {
    const cs = getComputedStyle(el)
    const own = parseFloat(cs.opacity)
    if (!(own > 0)) return
    const move = !reduce && (cs.translate === 'none' || cs.translate === '' || cs.translate === '0px')
    const frames: Keyframe[] = move
      ? [{ opacity: 0, translate: `0 ${RISE}px` }, { opacity: own, translate: '0 0' }]
      : [{ opacity: 0 }, { opacity: own }]
    const delay = delayOf(el)
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
