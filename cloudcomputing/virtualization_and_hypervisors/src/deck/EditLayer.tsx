import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * INLINE TEXT EDITING (presenter view, Cloud Computing Fundamentals,
 * 2026-10-22; session-local kit change).
 *
 * While the bar's Edit button is on, every text element of the slide on
 * screen is `contenteditable`, and what the presenter types is remembered per
 * slide (`presenter.ts`) and put back whenever that slide mounts again, in
 * the presenter view and in the student file alike.
 *
 * WHAT COUNTS AS A TEXT ELEMENT: an HTML element with at least one direct
 * text node that is not whitespace, found in document order, descending no
 * further once one is found (a `<p>` with a `<strong>` inside is ONE editing
 * host, which is also how the browser treats nested `contenteditable`). svg
 * subtrees, `script`/`style` and anything inside a dialog are skipped. The
 * key is the element's ORIGINAL WORDS (whitespace folded; ` @2` on the second
 * element with the same words), so an edit stays on its text when the slide
 * around it changes: a position key (`t12`, before 2026-10-27) put an edit on
 * the wrong element as soon as one was added or removed above it. Old `t<n>`
 * keys are renamed to words the first time their slide mounts.
 *
 * HOW AN EDIT IS PUT BACK. React still owns the nodes it rendered, and an
 * `innerHTML` swap would hand it detached nodes to update later. So when the
 * edited markup has the same shape as the live one (the common case: words
 * changed, nothing added or removed), only the text nodes' values are
 * written and React's references stay valid. Only a changed shape (an Enter,
 * a deleted span) falls back to `innerHTML`, through a sanitiser.
 *
 * WHY EDITS USED TO COME BACK UNDONE. They were applied once, when the slide
 * mounted. A figure that re-renders on its clock, or remounts a child, put
 * React's words back and nothing put the edit back again. A MutationObserver
 * on the slide now re-applies after every change React makes. A live number
 * the figure re-renders every tick still wins over an edit of that number:
 * new words from React are a new original, which is the right answer for a
 * number.
 *
 * It is a component rather than a hook so it can sit LAST inside the slide's
 * keyed motion element: its layout effect then runs after the slide's own
 * DOM is committed and before the first paint, so an edited slide never
 * flashes its original words.
 */

/* per element: the words React gave it, and the words last put there by an edit or typed */
const ORIG = new WeakMap<Element, string>()
const SHOWN = new WeakMap<Element, string>()
const KEY = new WeakMap<Element, string>()

const SKIP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'])
const CSS_ID = 'deck-edit-css'
const CSS = `
[data-edit-key] { outline: 1.5px dashed rgba(45,99,251,0.38); outline-offset: 3px; border-radius: 4px; cursor: text; }
[data-edit-key]:hover { outline-color: rgba(45,99,251,0.85); }
[data-edit-key]:focus { outline: 2px solid #2D63FB; outline-offset: 3px; background: rgba(45,99,251,0.06); }
`

function hasOwnText(el: Element): boolean {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent && n.textContent.trim()) return true
  return false
}

/** The slide's editing hosts, in document order. The same walk keys an edit and applies it. */
export function editableElements(root: Element): HTMLElement[] {
  const out: HTMLElement[] = []
  const walk = (el: Element) => {
    if (el instanceof SVGElement) return
    if (SKIP.has(el.tagName)) return
    if (el.getAttribute('role') === 'dialog' || el.hasAttribute('data-edit-layer')) return
    /* an editing host stays one even after an edit left it with no text of its own (`<b>x</b>`) */
    if (hasOwnText(el) || ORIG.has(el)) {
      out.push(el as HTMLElement)
      return
    }
    for (const c of el.children) walk(c)
  }
  for (const c of root.children) walk(c)
  return out
}

function sanitise(html: string): DocumentFragment {
  const t = document.createElement('template')
  t.innerHTML = html
  for (const bad of t.content.querySelectorAll('script,style,iframe,object,embed,link,meta,base')) bad.remove()
  for (const el of t.content.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name)
      else if ((a.name === 'href' || a.name === 'src' || a.name === 'xlink:href') && /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name)
    }
  }
  return t.content
}

/** Every element and text node under `root`, in order. */
function nodesOf(root: Node): Node[] {
  const out: Node[] = []
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n)
  return out
}

function sameShape(a: Node[], b: Node[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].nodeType !== b[i].nodeType) return false
    if (a[i].nodeType === 1 && (a[i] as Element).tagName !== (b[i] as Element).tagName) return false
  }
  return true
}

function applyHtml(host: HTMLElement, html: string) {
  const clean = sanitise(html)
  const live = nodesOf(host)
  const next = nodesOf(clean)
  if (sameShape(live, next)) {
    for (let i = 0; i < live.length; i++) if (live[i].nodeType === 3) live[i].nodeValue = next[i].nodeValue
    return
  }
  host.replaceChildren(clean)
}

function wordsOf(html: string): string {
  const t = document.createElement('template')
  t.innerHTML = html
  return (t.content.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const LEGACY = /^t\d+$/

/** Each editing host with its key and original markup. React's new words for an element are its new original. */
function keyed(root: Element): { el: HTMLElement; key: string; orig: string }[] {
  const seen = new Map<string, number>()
  return editableElements(root).map((el) => {
    const now = el.innerHTML
    let orig = ORIG.get(el)
    if (orig === undefined || (now !== orig && now !== SHOWN.get(el))) {
      orig = now
      ORIG.set(el, orig)
      SHOWN.delete(el)
    }
    const words = wordsOf(orig)
    const n = (seen.get(words) ?? 0) + 1
    seen.set(words, n)
    const key = n > 1 ? `${words} @${n}` : words
    KEY.set(el, key)
    return { el, key, orig }
  })
}

/**
 * Make the slide show `map`: an edited key gets its edit, any other host its original. `skip` is the
 * host being typed into, left alone on a re-apply caused by the typing itself.
 */
function sync(root: Element, map: Record<string, string>, skip: Element | null) {
  for (const { el, key, orig } of keyed(root)) {
    if (el === skip) continue
    const want = map[key] ?? orig
    if (el.innerHTML === want) continue
    applyHtml(el, want)
    SHOWN.set(el, el.innerHTML)
  }
}

function focusedHost(root: Element): HTMLElement | null {
  const a = document.activeElement
  const host = a && root.contains(a) ? (a.closest('[data-edit-key]') as HTMLElement | null) : null
  return host
}

function caretToEnd(el: HTMLElement) {
  const sel = window.getSelection()
  if (!sel) return
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(false)
  sel.removeAllRanges()
  sel.addRange(r)
}

/** Every finite animation inside `root` jumps to its end: nothing may still be waiting on an entrance delay while the presenter is trying to click it. */
function finishAnimations(root: Element) {
  for (const a of document.getAnimations()) {
    const target = (a.effect as KeyframeEffect | null)?.target
    if (!target || !root.contains(target)) continue
    const t = a.effect?.getComputedTiming()
    if (!t || !Number.isFinite(t.endTime as number)) continue
    try {
      a.finish()
    } catch {
      /* a paused or reversed animation cannot be finished; it is left as it is */
    }
  }
}

function installCss() {
  if (document.getElementById(CSS_ID)) return
  const el = document.createElement('style')
  el.id = CSS_ID
  el.textContent = CSS
  document.head.appendChild(el)
}

export function EditLayer({
  slideId,
  edits,
  editing,
  onEdit,
  onRename,
}: {
  slideId: string
  edits: Record<string, Record<string, string>>
  /** true while the bar's Edit button is on (presenter view only) */
  editing: boolean
  onEdit: (slideId: string, key: string, html: string | null) => void
  onRename: (slideId: string, from: string, to: string) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const map = edits[slideId] ?? NONE
  const mapRef = useRef(map)
  mapRef.current = map
  const onEditRef = useRef(onEdit)
  onEditRef.current = onEdit
  const editingRef = useRef(editing)
  editingRef.current = editing

  /* the slide's root: its `<section>`, or the keyed wrapper for a slide type without one */
  const rootOf = () => {
    const parent = ref.current?.parentElement
    return parent?.querySelector('section') ?? parent ?? null
  }

  const mark = (root: Element) => {
    if (!editingRef.current) return
    for (const { el } of keyed(root)) {
      if (el.getAttribute('contenteditable') === 'true') continue
      el.setAttribute('contenteditable', 'true')
      el.setAttribute('spellcheck', 'false')
      el.setAttribute('data-edit-key', '')
    }
  }

  /* before the first paint of this mount: old position keys renamed, then the remembered words put back */
  useLayoutEffect(() => {
    const root = rootOf()
    if (!root) return
    const m = mapRef.current
    const legacy = Object.keys(m).filter((k) => LEGACY.test(k))
    if (legacy.length) {
      const els = keyed(root)
      for (const k of legacy) {
        const hit = els[Number(k.slice(1))]
        if (hit) onRename(slideId, k, hit.key)
      }
      const renamed: Record<string, string> = {}
      for (const [k, v] of Object.entries(m)) {
        const hit = LEGACY.test(k) ? els[Number(k.slice(1))] : null
        if (!LEGACY.test(k)) renamed[k] = v
        else if (hit && !(hit.key in m)) renamed[hit.key] = v
      }
      sync(root, renamed, null)
      return
    }
    sync(root, m, null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId])

  /* an undo, a redo or a reset: the slide on screen follows the edits, the host being typed in too */
  useLayoutEffect(() => {
    const root = rootOf()
    if (!root) return
    const host = focusedHost(root)
    const before = host?.innerHTML
    sync(root, map, null)
    if (host && host.innerHTML !== before) caretToEnd(host)
    mark(root)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  /* whatever React changes later (a clock, a remounted child), the edits go back on top, after it */
  useEffect(() => {
    const root = rootOf()
    if (!root) return
    let raf = 0
    const mo = new MutationObserver(() => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        sync(root, mapRef.current, focusedHost(root))
        mark(root)
      })
    })
    mo.observe(root, { subtree: true, childList: true, characterData: true })
    return () => {
      mo.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId])

  useEffect(() => {
    if (!editing) return
    const root = rootOf()
    if (!root) return
    installCss()
    finishAnimations(root)
    mark(root)
    const onInput = (e: Event) => {
      const host = (e.target as Element | null)?.closest?.('[data-edit-key]') as HTMLElement | null
      if (!host) return
      if (!KEY.has(host)) keyed(root)
      const key = KEY.get(host)
      if (key === undefined) return
      const html = host.innerHTML
      SHOWN.set(host, html)
      onEditRef.current(slideId, key, ORIG.get(host) === html ? null : html)
    }
    /* pasted text arrives as plain text: a slide takes no outside markup */
    const onPaste = (e: ClipboardEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-edit-key]')) return
      e.preventDefault()
      const text = e.clipboardData?.getData('text/plain') ?? ''
      document.execCommand('insertText', false, text)
    }
    root.addEventListener('input', onInput)
    root.addEventListener('paste', onPaste)
    return () => {
      root.removeEventListener('input', onInput)
      root.removeEventListener('paste', onPaste)
      for (const el of root.querySelectorAll('[data-edit-key]')) {
        el.removeAttribute('contenteditable')
        el.removeAttribute('spellcheck')
        el.removeAttribute('data-edit-key')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, slideId])

  return <span ref={ref} data-edit-layer="" style={{ display: 'none' }} aria-hidden />
}

const NONE: Record<string, string> = {}
