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
 * key is the element's position in that order, `t12`, so an edit survives a
 * reload without the deck having to name its elements.
 *
 * HOW AN EDIT IS PUT BACK. React still owns the nodes it rendered, and an
 * `innerHTML` swap would hand it detached nodes to update later. So when the
 * edited markup has the same shape as the live one (the common case: words
 * changed, nothing added or removed), only the text nodes' values are
 * written and React's references stay valid. Only a changed shape (an Enter,
 * a deleted span) falls back to `innerHTML`, through a sanitiser. A live
 * number the figure re-renders every tick wins over an edit of that number,
 * which is the right answer for a number.
 *
 * It is a component rather than a hook so it can sit LAST inside the slide's
 * keyed motion element: its layout effect then runs after the slide's own
 * DOM is committed and before the first paint, so an edited slide never
 * flashes its original words.
 */

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
    if (hasOwnText(el)) {
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

export function applyEdits(root: Element, map: Record<string, string>) {
  const els = editableElements(root)
  for (const [k, html] of Object.entries(map)) {
    const el = els[Number(k.slice(1))]
    if (el) applyHtml(el, html)
  }
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

/* The words a slide opened with, per slide and key, for this page load: typing them back deletes the edit. */
const ORIGINALS = new Map<string, Map<string, string>>()

export function EditLayer({
  slideId,
  edits,
  editing,
  onEdit,
}: {
  slideId: string
  edits: Record<string, Record<string, string>>
  /** true while the bar's Edit button is on (presenter view only) */
  editing: boolean
  onEdit: (slideId: string, key: string, html: string | null) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const editsRef = useRef(edits)
  editsRef.current = edits
  const onEditRef = useRef(onEdit)
  onEditRef.current = onEdit

  /* the slide's root: its `<section>`, or the keyed wrapper for a slide type without one */
  const rootOf = () => {
    const parent = ref.current?.parentElement
    return parent?.querySelector('section') ?? parent ?? null
  }

  /* put the remembered words back, before the first paint of this mount */
  useLayoutEffect(() => {
    const root = rootOf()
    const map = editsRef.current[slideId]
    if (root && map && Object.keys(map).length) applyEdits(root, map)
  }, [slideId])

  useEffect(() => {
    if (!editing) return
    const root = rootOf()
    if (!root) return
    installCss()
    finishAnimations(root)
    const els = editableElements(root)
    const originals = ORIGINALS.get(slideId) ?? new Map<string, string>()
    ORIGINALS.set(slideId, originals)
    const stored = editsRef.current[slideId] ?? {}
    els.forEach((el, i) => {
      const key = `t${i}`
      /* the first time a key is seen with no stored edit, what is on screen IS the original */
      if (!originals.has(key) && !(key in stored)) originals.set(key, el.innerHTML)
      el.setAttribute('contenteditable', 'true')
      el.setAttribute('spellcheck', 'false')
      el.setAttribute('data-edit-key', key)
    })
    const onInput = (e: Event) => {
      const host = (e.target as Element | null)?.closest?.('[data-edit-key]') as HTMLElement | null
      if (!host) return
      const key = host.getAttribute('data-edit-key')!
      const html = host.innerHTML
      onEditRef.current(slideId, key, originals.has(key) && originals.get(key) === html ? null : html)
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
      for (const el of els) {
        el.removeAttribute('contenteditable')
        el.removeAttribute('spellcheck')
        el.removeAttribute('data-edit-key')
      }
    }
  }, [editing, slideId])

  return <span ref={ref} data-edit-layer="" style={{ display: 'none' }} aria-hidden />
}
