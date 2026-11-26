/**
 * AUTO-OFF FLASH CHECK (user, 2026-11-03, round 2 change 5: "with auto OFF, all content appears
 * at once, then appears again one step at a time").
 *
 * On EVERY animation frame it takes the SET of content leaves of the slide on screen that are
 * visible (a text leaf, an img, an svg shape; effective opacity over 0.5 measured up to the
 * slide's <section>, so the deck's own crossfade cannot hide a flash; the header is not counted).
 * A FLASH is a leaf seen on some frame that belongs to neither the settled state before the press
 * nor the settled state after it: content shown before its step, or shown and taken away again.
 *
 *   OFF  (`?view=student`, auto animation off), walking the deck with the plain right arrow:
 *        ARRIVE  the press that changes slide lands at step 0 and no frame shows anything the
 *                settled pre-step-1 state does not;
 *        STEP    each press moves `__DECK_STEPS__.at` by exactly one on the same slide, with no
 *                flash between the two settled states;
 *        BACK    once per slide (half-way), a left-arrow press moves `at` back by one and settles
 *                on the same set as that step did going forward (two leaves of slack), then the
 *                right arrow goes forward again.
 *   ON   (presenter view, auto animation on), arriving with the right arrow: nothing visible on
 *        the first frame is hidden again in the next 400ms (the entrance hid it before paint).
 *
 * One row per slide, then AUTO-OFF FLASH CLEAN or the failure count.
 *
 *   node auto-off-flash-check.mjs [baseUrl|-] [from] [to]
 *   baseUrl  default http://localhost:<devPort>/ ; the built file's file:// URL works too
 *   CHROME_PATH  the browser (default /usr/bin/brave-browser); FLASH_DEBUG=1 lists every flashing leaf with its markup
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const cfg = JSON.parse(readFileSync(new URL('./deck.config.json', import.meta.url), 'utf8'))
const BASE = (process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : `http://localhost:${cfg.devPort}/`).replace(/#.*$/, '')
const sep = BASE.includes('?') ? '&' : '?'
const FROM = Math.max(1, Number(process.argv[3] ?? 1))
const TO_ARG = process.argv[4] ? Number(process.argv[4]) : 0
const ARRIVE_MS = 900
const STEP_MS = 700
const SLACK = 2

/* ---- in-page recorder ---- */
const RECORDER = () => {
  const SHAPES = 'path,rect,circle,ellipse,line,polyline,polygon,text,image,use'
  /* a leaf is known by its PLACE in the slide (its index among same-tag siblings at every level, so a
     transient sibling such as a row's sheen does not renumber it; tag; text), not by its node:
     a figure that remounts a span (a React key flip) is the same leaf, not a new one */
  const ids = new WeakMap()
  const idOf = (el) => {
    if (ids.has(el)) return ids.get(el)
    const parts = []
    for (let e = el; e && e.tagName !== 'SECTION'; e = e.parentElement) parts.push(e.parentElement ? e.tagName[0] + [...e.parentElement.children].filter((c) => c.tagName === e.tagName).indexOf(e) : 0)
    const id = `${parts.reverse().join('.')}|${el.tagName}|${(el.textContent || '').trim().slice(0, 16)}`
    ids.set(el, id)
    /* and by what it IS (tag, text, drawing attributes), wherever it sits: a badge whose icon gains or loses
       a wrapper as it turns on or off is the same leaf fading, not a new one */
    looks.set(id, `${el.tagName}|${(el.textContent || '').trim().slice(0, 24)}|${['d', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'points', 'src'].map((a) => (el.getAttribute(a) ?? '').slice(0, 60)).join(',')}`)
    return id
  }
  const looks = new Map()
  const desc = new Map()
  const live = () => [...document.querySelectorAll('section')].filter((s) => !s.closest('[role="dialog"]') && !s.closest('.deck-thumb'))
  const visible = (s, withLoops = false) => {
    const out = new Set()
    if (!s) return out
    const op = new Map()
    /* AMBIENT LOOPS ARE NOT STEPS: a leaf under an infinite CSS/WAAPI animation (a typing cursor, a blink,
       a ripple) cycles on its own clock, so it is left out of the sets */
    const ambient = new Set()
    for (const a of s.getAnimations({ subtree: true })) {
      const t = a.effect?.getComputedTiming?.()
      if (t && t.iterations === Infinity && a.effect.target) ambient.add(a.effect.target)
    }
    const looping = (el) => {
      for (let e = el; e && e !== s; e = e.parentElement) if (ambient.has(e)) return true
      return false
    }
    const eff = (el) => {
      if (el === s || !el) return 1
      if (op.has(el)) return op.get(el)
      const cs = getComputedStyle(el)
      const v = cs.display === 'none' || cs.visibility === 'hidden' ? 0 : parseFloat(cs.opacity) * eff(el.parentElement)
      op.set(el, v)
      return v
    }
    for (const el of s.querySelectorAll('*')) {
      if (el.closest('[data-zone="header"]')) continue
      const tag = el.tagName.toLowerCase()
      const leaf = (el.childElementCount === 0 && el.textContent.trim() && !(el instanceof SVGElement)) || tag === 'img' || (el instanceof SVGElement && el.matches(SHAPES))
      if (!leaf) continue
      const r = el.getBoundingClientRect()
      if (!(r.width > 0 || r.height > 0)) continue
      if (eff(el) > 0.5 && (withLoops || !looping(el))) {
        const id = idOf(el)
        out.add(id)
        if (!desc.has(id)) desc.set(id, `${tag}${el.textContent.trim() ? ` "${el.textContent.trim().slice(0, 24)}"` : ''}${window.__FLASH_DEBUG__ ? ` <${[...el.attributes].map((a) => a.name + '=' + a.value.slice(0, 30)).join(' ')}> in ${(el.parentElement?.outerHTML ?? '').slice(0, 160)}` : ''}`)
      }
    }
    return out
  }
  let target = null
  let frames = []
  window.__FLASH__ = {
    /* `follow`: the recorder watches the NEXT section to mount (a slide change); else the one on screen */
    start(ms, follow) {
      const old = new Set(live())
      target = follow ? null : live().pop()
      frames = []
      const t0 = performance.now()
      return new Promise((done) => {
        const tick = () => {
          if (follow) target = live().find((s) => !old.has(s)) ?? null
          frames.push(target ? visible(target) : new Set())
          if (performance.now() - t0 < ms) requestAnimationFrame(tick)
          else done(frames.length)
        }
        requestAnimationFrame(tick)
      })
    },
    /* the set on screen once it has held for 600ms (at most 2500ms: a figure's staggered exits run up to ~1.6s) */
    settle() {
      const s = live().pop()
      return new Promise((done) => {
        let last = ''
        let since = performance.now()
        const t0 = since
        const tick = () => {
          const v = [...visible(s)].sort()
          const sig = v.join(',')
          if (sig !== last) {
            last = sig
            since = performance.now()
          }
          if (performance.now() - since > 600 || performance.now() - t0 > 2500) {
            window.__FLASH__.last = v
            /* with the looping leaves too: a leaf that stops looping on this step was on screen all along */
            window.__FLASH__.lastAll = [...visible(s, true)]
            done(v.length)
          } else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    },
    last: [],
    lastAll: [],
    /* leaves in the recorded frames that are in neither `a` nor `b` (arrays of ids) */
    flashes(a, b) {
      const ok = new Set([...a, ...b])
      const okLook = new Set([...ok].map((id) => looks.get(id)))
      const bad = new Set()
      for (const f of frames) for (const id of f) if (!ok.has(id) && !okLook.has(looks.get(id))) bad.add(id)
      return [...bad].map((id) => desc.get(id))
    },
    /* ON mode: leaves on the first frame that a later frame no longer shows */
    dropped() {
      if (!frames.length) return []
      const first = frames.find((f) => f.size) ?? new Set()
      const out = new Set()
      for (const f of frames.slice(frames.indexOf(first) + 1)) for (const id of first) if (!f.has(id)) out.add(id)
      return [...out].map((id) => desc.get(id))
    },
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/brave-browser' })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await ctx.addInitScript(RECORDER)
if (process.env.FLASH_DEBUG) await ctx.addInitScript(() => { window.__FLASH_DEBUG__ = true })
const errors = []
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(e.message))
const deck = () => page.evaluate(() => ({ cur: window.__DECK__?.current, total: window.__DECK__?.total, st: window.__DECK_STEPS__ ?? { at: 0, total: 0 } }))
const settle = async () => {
  await page.evaluate(() => window.__FLASH__.settle())
  return page.evaluate(() => window.__FLASH__.last)
}
const settleAll = () => page.evaluate(() => window.__FLASH__.lastAll)
async function press(key, ms, follow) {
  const rec = page.evaluate(([m, f]) => window.__FLASH__.start(m, f), [ms, follow])
  await page.keyboard.press(key)
  await rec
  const set = await settle()
  return { set, all: await settleAll(), d: await deck() }
}
const flashes = (a, b) => page.evaluate(([x, y]) => window.__FLASH__.flashes(x, y), [a, b])
const sameish = (a, b) => {
  const A = new Set(a)
  const B = new Set(b)
  return [...A].filter((x) => !B.has(x)).length + [...B].filter((x) => !A.has(x)).length <= SLACK
}
const label = () => page.evaluate(() => document.querySelector('[aria-label^="Auto animation"]')?.getAttribute('aria-label') ?? '')
const list = (xs) => (process.env.FLASH_DEBUG ? '\n      ' + xs.join('\n      ') : [...new Set(xs)].slice(0, 3).join(', ') + (xs.length > 3 ? ` +${xs.length - 3}` : ''))

let bad = 0

/* ---------- OFF: the student view, one continuous walk ---------- */
await page.goto(`${BASE}${sep}view=student&flash=${Date.now()}#/${Math.max(1, FROM - 1)}`, { waitUntil: 'load' })
await page.waitForTimeout(1500)
const TOTAL = (await deck()).total
const TO = Math.min(TO_ARG || TOTAL, TOTAL)
if (!(await label()).startsWith('Auto animation is off')) {
  console.log('the student view opened with auto animation ON; this check needs it OFF')
  process.exit(1)
}
const off = new Map()
const walkSteps = async (n, base, baseAll, problems) => {
  const total = (await deck()).st.total
  const sets = [base]
  const alls = [baseAll]
  for (let k = 1; k <= total; k++) {
    const r = await press('ArrowRight', STEP_MS, false)
    if (r.d.cur !== n) {
      problems.push(`press ${k}/${total} changed slide to ${r.d.cur}`)
      return total
    }
    if (r.d.st.at !== k) problems.push(`press ${k}: step ${r.d.st.at}, expected ${k}`)
    sets[k] = r.set
    alls[k] = r.all
    const f = await flashes(alls[k - 1], r.all)
    if (f.length) problems.push(`press ${k}: flash of ${f.length} (${list(f)})`)
    if (total >= 2 && k === Math.ceil(total / 2)) {
      const b = await press('ArrowLeft', STEP_MS, false)
      if (b.d.cur !== n || b.d.st.at !== k - 1) problems.push(`back at ${k}: slide ${b.d.cur} step ${b.d.st.at}, expected step ${k - 1}`)
      else {
        if (!sameish(b.set, sets[k - 1])) problems.push(`back at ${k}: settles on ${b.set.length} leaves, step ${k - 1} had ${sets[k - 1].length}`)
        const fb = await flashes(alls[k], b.all)
        if (fb.length) problems.push(`back at ${k}: flash of ${fb.length} (${list(fb)})`)
      }
      const again = await press('ArrowRight', STEP_MS, false)
      if (again.d.st.at !== k) problems.push(`re-press at ${k}: step ${again.d.st.at}`)
      sets[k] = again.set
      alls[k] = again.all
    }
  }
  return total
}
let n = (await deck()).cur
if (n === FROM) {
  /* the first slide of the range is a fresh load: its steps are still walked */
  const problems = []
  const base = await settle()
  const baseAll = await settleAll()
  if ((await deck()).st.at !== 0) problems.push('fresh load not at step 0')
  const steps = await walkSteps(n, base, baseAll, problems)
  off.set(n, { steps, base: base.length, problems })
  if (problems.length) bad++
}
while (n < TO) {
  /* finish whatever is left on this slide */
  for (let i = 0; i < 80; i++) {
    const { st } = await deck()
    if (st.at >= st.total) break
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(700)
  const arrive = await press('ArrowRight', ARRIVE_MS, true)
  if (arrive.d.cur !== n + 1) {
    off.set(n + 1, { steps: '-', base: '-', problems: [`arrival press went ${n} -> ${arrive.d.cur}`] })
    bad++
    if (arrive.d.cur <= n) break
    n = arrive.d.cur
    continue
  }
  n = arrive.d.cur
  const problems = []
  if (arrive.d.st.at !== 0) problems.push(`landed at step ${arrive.d.st.at}, not 0`)
  const f = await flashes(arrive.all, [])
  if (f.length) problems.push(`arrival flash of ${f.length} before step 1 (${list(f)})`)
  const steps = await walkSteps(n, arrive.set, arrive.all, problems)
  off.set(n, { steps, base: arrive.set.length, problems })
  if (problems.length) bad++
}

/* ---------- ON: the presenter view, arrive on each slide ---------- */
const on = new Map()
await page.goto(`${BASE}${sep}flash=${Date.now()}#/${Math.max(1, FROM - 1)}`, { waitUntil: 'load' })
await page.waitForTimeout(1500)
if (!(await label()).startsWith('Auto animation is on')) {
  console.log('the presenter view opened with auto animation OFF; this check needs it ON')
  process.exit(1)
}
for (let m = (await deck()).cur; m < TO; ) {
  const rec = page.evaluate(() => window.__FLASH__.start(400, true))
  await page.keyboard.press('ArrowRight')
  await rec
  const d = await deck()
  if (d.cur !== m + 1) {
    on.set(m + 1, [`arrival went ${m} -> ${d.cur}`])
    bad++
    if (d.cur <= m) break
    m = d.cur
    continue
  }
  m = d.cur
  const drop = await page.evaluate(() => window.__FLASH__.dropped())
  const problems = drop.length ? [`flash: ${drop.length} leaves on the first frame then hidden (${list(drop)})`] : []
  on.set(m, problems)
  if (problems.length) bad++
  await page.waitForTimeout(300)
}

await browser.close()

console.log('slide | OFF steps | pre-step leaves | OFF (auto off)  | ON (auto on)')
for (let s = FROM; s <= TO; s++) {
  const o = off.get(s)
  const a = on.get(s)
  const or = !o ? 'not reached' : o.problems.length ? 'FAIL ' + o.problems.join('; ') : 'ok'
  const ar = a === undefined ? (s === FROM ? 'start (not arrived)' : 'not reached') : a.length ? 'FAIL ' + a.join('; ') : 'ok'
  console.log(`${String(s).padStart(5)} | ${String(o?.steps ?? '-').padStart(9)} | ${String(o?.base ?? '-').padStart(15)} | ${or} | ${ar}`)
}
if (errors.length) {
  bad++
  console.log('page errors: ' + [...new Set(errors)].join(' | '))
}
console.log(bad ? `${bad} FAILURE(S)` : 'AUTO-OFF FLASH CLEAN')
process.exit(bad ? 1 : 0)
