/**
 * FIT CHECK — does scaling the stage change the layout?
 *
 * `SlideStage` fits the 1280x720 canvas to the viewport with CSS `zoom`, which
 * is a LAYOUT operation: the browser re-lays the slide out at the scaled size
 * instead of stretching a texture. That is what makes the deck sharp at any
 * size in any engine, and it is also the one thing that could go wrong, because
 * glyph advances at 66px are not exactly 1.5x the advances at 44px. A line that
 * just fits at 1x could wrap at 1.5x, and several figures in this repo have
 * their line counts measured and written into a doc comment.
 *
 * So this measures it rather than assuming it. For every slide it reads every
 * text element's box and line count at zoom 1, 1.5 and 2, divides the boxes by
 * the zoom, and compares them against the zoom-1 baseline.
 *
 *   node fit-check.mjs [url] [count]
 *
 * A LINE COUNT THAT CHANGES IS A FAILURE. A box that moves by more than a pixel
 * after normalising is a failure. Everything else is sub-pixel rounding and is
 * reported as the worst drift seen, so a slow creep is visible before it becomes
 * a wrap.
 *
 * IT ALSO CHECKS THAT THE SLIDE IS CENTRED, AND THAT HALF IS HERE BECAUSE IT
 * SHIPPED BROKEN. The first `zoom` version used `place-items-center`, on the
 * reasonable-sounding grounds that a zoomed box really is 1280*z by 720*z and
 * grid has something true to centre. Both engines disagreed: grid sizes and
 * aligns the item by its UNZOOMED box, so the slide was pinned to the top-left
 * with the entire letterbox on the right and the bottom, 578px of it at
 * 2000x800.
 *
 * It got through the first round of checks because they all ran at 1920x1080,
 * where the scale fits both axes exactly and there is no letterbox to get wrong.
 * So the centring pass runs at five aspect ratios, none of which is 16:9, and it
 * runs both fit modes: a fallback that letterboxes differently from the default
 * is its own bug.
 *
 * It runs in Chromium and, when it is installed, Firefox. The two engines round
 * glyph advances differently, so a layout that is stable in one is not
 * automatically stable in the other; this bug was browser-dependent in the first
 * place, and a browser-dependent check is the only honest kind.
 *
 * WHY NOT MEASURE SHARPNESS DIRECTLY. Because it cannot be done headlessly: a
 * headless browser rasterises on the CPU and re-rasterises at the effective
 * scale, so the old `transform` path screenshots perfectly sharp here and is
 * soft on a real GPU-composited one. Layout, unlike rasterisation, is identical
 * headless and headed, so this measures the thing that CAN be measured and the
 * sharpness follows from the mechanism.
 */
import { chromium, firefox } from 'playwright'
import { SLIDE_COUNT, DEV_PORT } from './deck.config.mjs'

const URL = process.argv[2] ?? `http://localhost:${DEV_PORT}/?all`
const TOTAL = Number(process.argv[3] ?? SLIDE_COUNT)

/* 1x, 1.5x and 2x of the 1280x720 stage. 1.5 is a 1080p projector, which is the
   case that actually ships; 2 is there because a rounding error that is invisible
   at 1.5 is usually obvious at 2. */
const VIEWPORTS = [
  { z: 1, width: 1280, height: 720 },
  { z: 1.5, width: 1920, height: 1080 },
  { z: 2, width: 2560, height: 1440 },
]

/** Boxes are compared after dividing by the zoom, so this is in slide pixels. */
const TOLERANCE = 1.5

/**
 * THE LINE COUNT IS COUNTED, NOT DIVIDED, AND THE FIRST VERSION GOT THIS WRONG.
 *
 * It derived lines as `rect.height / getComputedStyle().lineHeight`, which is
 * the obvious way and is engine-dependent under `zoom`: Chromium reports both
 * the rect and the line height in zoomed pixels, and **Firefox reports the rect
 * zoomed and the line height unzoomed**. Every element on the slide then came
 * back with exactly `lines * zoom` lines in Firefox, and the check reported 148
 * failures against a layout that was in fact identical. A one-word heading
 * "growing" to two lines at 1.5x was the tell: that is not a wrap, that is
 * arithmetic.
 *
 * `Range.getClientRects()` returns one rect per LINE BOX, so counting the
 * distinct tops counts lines directly, with no length to be interpreted in
 * anybody's coordinate space. It is the same technique `measure.mjs` in
 * `questions-lab` uses, and for the same reason.
 *
 * THE SCALE IS MEASURED OFF THE DOM RATHER THAN ASSUMED FROM THE VIEWPORT, for
 * the same class of reason: the stage picks its own scale from its own box, and
 * a check that computes what that scale OUGHT to be is checking its own
 * arithmetic instead of the browser's.
 */
const probe = () => {
  const stage = document.querySelector('[data-fit] > div')
  const scale = stage ? stage.getBoundingClientRect().width / 1280 : 1
  const out = []
  /*
    Only elements that hold text DIRECTLY. A wrapper's box is decided by its
    children, so measuring both would report every drift twice and hide which
    element actually moved.
  */
  /*
    THE KEY CARRIES A DOCUMENT-ORDER INDEX, AND IT HAS TO.

    It was `tag + first 28 characters of text`, which is unique right up until a
    slide says the same short thing twice. The OOP deck says it three times on one
    frame: two `ObjectState` rows whose value is `true`, and a `State` term under
    a `STATE` kicker. The map then kept one element under the key and compared a
    DIFFERENT element against it, which reported drifts of 300px and more.

    The tell was that the number barely moved between 1.5x and 2x: 335.92 and
    335.91. A real layout drift scales with the zoom. A constant is two different
    boxes being subtracted from each other.

    The counter runs over every element visited, not over the ones that survive
    the filters, so a skipped element does not shift the indices of the ones after
    it. Document order is stable across viewports because this deck has no
    breakpoints and nothing renders conditionally on size.
  */
  let seq = 0
  document.querySelectorAll('section *').forEach((el) => {
    const n = seq++
    /*
      THE RANGE COVERS THIS ELEMENT'S OWN TEXT NODES, NOT ITS CONTENTS.

      `selectNodeContents` was the first version and it counts a child element's
      box as a line. The kicker is the case that exposed it: an inline-flex row
      holding a 3px rule, a label, a middle dot and an ordinal, whose rects sit
      at three different tops at 1x and two at 1.5x purely because of where the
      rule's 3px box lands. Three "lines" for a one-line row, changing with the
      zoom, is the check inventing a failure.

      A text node's client rects are one per line box and nothing else, which is
      the definition of "does this text wrap".
    */
    const texts = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    if (!texts.length) return
    const rects = []
    for (const t of texts) {
      const r = document.createRange()
      r.selectNode(t)
      rects.push(...[...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1))
    }
    if (!rects.length) return
    /* Bucket in SLIDE pixels, so the grouping does not change with the zoom. */
    const tops = new Set(rects.map((r) => Math.round(r.top / scale / 4)))
    const b = {
      x: Math.min(...rects.map((r) => r.left)),
      y: Math.min(...rects.map((r) => r.top)),
      width: Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left)),
      height: Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top)),
    }
    out.push({
      key: `${n}:${el.tagName}:${(el.textContent ?? '').trim().slice(0, 28)}`,
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height,
      lines: tops.size,
    })
  })
  return { scale, rows: out }
}

const engines = [['chromium', chromium]]
try {
  await (await firefox.launch()).close()
  engines.push(['firefox', firefox])
} catch {
  console.log('firefox not installed, checking chromium only')
}

let failures = 0
let worstDrift = 0
let worstWhere = ''

for (const [engineName, engine] of engines) {
  const browser = await engine.launch()
  for (let i = 1; i <= TOTAL; i++) {
    const baseline = new Map()
    let mode = ''
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      })
      /*
        `load`, not `networkidle`. This harness opens a page per slide per
        viewport per engine, which is 24 navigations on a five-slide deck, and
        the dev server holds an HMR websocket open for the life of the page, so
        `networkidle` waits for a socket that is never going to go quiet and
        times out somewhere in the middle of the run. The settle below is what
        actually decides when the page is ready.
      */
      await page.goto(`${URL}#/${i}`, { waitUntil: 'load' })
      /* Same settle the other harnesses use: `?all` opens every click-gated step
         but does not fast-forward an entrance that plays on mount, and a box
         measured mid-entrance is a box mid-transform. */
      await page.waitForTimeout(2600)
      if (!mode) mode = await page.evaluate(() => document.querySelector('[data-fit]')?.dataset.fit ?? '?')
      const { scale, rows } = await page.evaluate(probe)
      await page.close()

      /* The stage's own scale, read off its box. If it is not the ratio the
         viewport implies, that is itself the finding. */
      if (Math.abs(scale - vp.z) > 0.01) {
        failures++
        console.log(`FAIL ${engineName} slide ${i} @${vp.z}x  stage scaled ${scale.toFixed(3)}, expected ${vp.z}`)
      }

      if (vp.z === 1) {
        rows.forEach((r) => baseline.set(r.key, r))
        continue
      }
      for (const r of rows) {
        const b = baseline.get(r.key)
        if (!b) continue
        if (r.lines !== b.lines) {
          failures++
          console.log(
            `FAIL ${engineName} slide ${i} @${vp.z}x  ${r.key}  lines ${b.lines} -> ${r.lines}`,
          )
          continue
        }
        const drift = Math.max(
          Math.abs(r.x / scale - b.x),
          Math.abs(r.y / scale - b.y),
          Math.abs(r.w / scale - b.w),
          Math.abs(r.h / scale - b.h),
        )
        if (drift > worstDrift) {
          worstDrift = drift
          worstWhere = `${engineName} slide ${i} @${vp.z}x ${r.key}`
        }
        if (drift > TOLERANCE) {
          failures++
          console.log(
            `FAIL ${engineName} slide ${i} @${vp.z}x  ${r.key}  drifts ${drift.toFixed(2)}px`,
          )
        }
      }
    }
    if (i === 1) console.log(`${engineName}: stage is using fit="${mode}"`)
  }
  await browser.close()
}

console.log(
  `worst drift ${worstDrift.toFixed(2)}px (tolerance ${TOLERANCE}) at ${worstWhere || 'nothing measured'}`,
)

/* ------------------------------------------------------------------ */
/* Centring: is the letterbox even on both sides?                      */
/* ------------------------------------------------------------------ */

/**
 * None of these is 16:9, deliberately. A stage that fits both axes exactly has
 * no letterbox, so it cannot be off-centre, which is exactly how the bug this
 * pass exists for got through. Two are taller than 16:9 and want a band top and
 * bottom, one is wider and wants one on each side, and one is smaller than the
 * canvas in both axes, which is the case the old `transform` path had its own
 * separate bug in.
 */
const SHAPES = [
  { w: 1440, h: 900, note: '16:10, bands top and bottom' },
  { w: 1280, h: 1024, note: '5:4, bands top and bottom' },
  { w: 2000, h: 800, note: 'wide, bands left and right' },
  { w: 1000, h: 700, note: 'smaller than the canvas' },
  { w: 900, h: 1200, note: 'portrait' },
]

let centreFailures = 0
for (const [engineName, engine] of engines) {
  const browser = await engine.launch()
  /* Both modes, because `?fit=transform` is what a Firefox older than 126 gets
     and a fallback that letterboxes differently is its own bug. */
  for (const fit of ['zoom', 'transform']) {
    for (const shape of SHAPES) {
      const page = await browser.newPage({
        viewport: { width: shape.w, height: shape.h },
        deviceScaleFactor: 1,
      })
      const sep = URL.includes('?') ? '&' : '?'
      await page.goto(`${URL}${sep}fit=${fit}#/1`, { waitUntil: 'load' })
      await page.waitForTimeout(1200)
      const g = await page.evaluate(() => {
        const wrap = document.querySelector('[data-fit]')?.getBoundingClientRect()
        const sec = document.querySelector('section')?.getBoundingClientRect()
        if (!wrap || !sec) return null
        return {
          l: sec.left - wrap.left,
          r: wrap.right - sec.right,
          t: sec.top - wrap.top,
          b: wrap.bottom - sec.bottom,
        }
      })
      await page.close()
      if (!g) continue
      /* One pixel, because an odd number of leftover pixels cannot be split
         evenly and the browser has to give one side the extra. */
      const off = Math.max(Math.abs(g.l - g.r), Math.abs(g.t - g.b))
      if (off > 1) {
        centreFailures++
        console.log(
          `FAIL ${engineName} fit=${fit} ${shape.w}x${shape.h} (${shape.note})  ` +
            `L${Math.round(g.l)} R${Math.round(g.r)} T${Math.round(g.t)} B${Math.round(g.b)}  ` +
            `off-centre by ${Math.round(off)}px`,
        )
      }
    }
  }
  await browser.close()
}

failures += centreFailures
console.log(
  centreFailures === 0
    ? `CENTRED at ${SHAPES.length} aspect ratios, both fit modes`
    : `${centreFailures} centring failure(s)`,
)
console.log(failures === 0 ? `LAYOUT STABLE across 1x, 1.5x and 2x` : `${failures} failure(s)`)
process.exitCode = failures === 0 ? 0 : 1
