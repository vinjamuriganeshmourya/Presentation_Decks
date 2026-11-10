/*
 * Student download: the deck as viewers see it right now, as ONE offline HTML
 * file with none of the site's layer (no comments, no edit / skip / delete).
 *
 * It is the same file the decks' own Download button writes (presenter.ts
 * `studentHtml`): the page as built, with
 *   <script>window.__DECK_STATE__={view:'student',hidden:[...],edits:{...}}</script>
 * put in front of its first script. Skipped and deleted slides are both in
 * `hidden`, so they are gone from the file; the deck's student view draws no
 * presenter controls.
 *
 * The published deck page is that built page plus the site layer, which the
 * build fences with <!--deck-site--> ... <!--/deck-site--> and whose module
 * it holds back as text/x-deck-module (site/build.mjs). Both are undone here.
 *
 * Used by the deck pages (overlay.js) and the gallery (gallery.js).
 */
;(function () {
  'use strict'
  if (window.DeckStudent) return

  var SITE_START = '<!--deck-site-->'
  var SITE_END = '<!--/deck-site-->'
  var HELD_MODULE = '<script type="text/x-deck-module" id="deck-main">'
  var SITE_JSON = 'window.__DECK_SITE__='
  var THREAD = '@t:'
  var LINE_SEPS = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g')

  function slug(title) {
    return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'deck'
  }

  /** the __DECK_SITE__ boot object written into a published deck page */
  function siteOf(page) {
    var a = page.indexOf(SITE_JSON)
    if (a < 0) return null
    a += SITE_JSON.length
    var b = page.indexOf('</script>', a)
    try {
      return JSON.parse(page.slice(a, b))
    } catch (e) {
      return null
    }
  }

  /** a published deck page -> the deck page as it was built */
  function pristine(page) {
    var a = page.indexOf(SITE_START)
    var b = page.indexOf(SITE_END)
    if (a < 0 || b < a) throw new Error('This page is not a published deck.')
    var html = page.slice(0, a) + page.slice(b + SITE_END.length)
    var m = html.indexOf(HELD_MODULE)
    if (m < 0) throw new Error('The deck script was not found.')
    return html.slice(0, m) + '<script type="module" crossorigin>' + html.slice(m + HELD_MODULE.length)
  }

  /** baked slide states + the Worker's live rows -> ids of every skipped or deleted slide */
  function hiddenFrom(baked, rows) {
    var st = {}
    var id
    baked = baked || {}
    for (id in baked) if (Object.prototype.hasOwnProperty.call(baked, id) && baked[id] && baked[id].status) st[id] = baked[id].status
    ;(rows || [])
      .filter(function (r) { return r && r.field === 'status' && String(r.slide).indexOf(THREAD) !== 0 })
      .sort(function (x, y) { return (x.updatedAt || 0) - (y.updatedAt || 0) })
      .forEach(function (r) { st[r.slide] = r.value })
    var out = []
    for (id in st) if (st[id] && st[id] !== 'visible') out.push(id)
    return out.sort()
  }

  /** the built page + the finalised state -> the student file (presenter.ts studentHtml) */
  function studentHtml(html, state) {
    var json = JSON.stringify({ view: 'student', hidden: state.hidden || [], edits: state.edits || {} })
      .replace(/</g, '\\u003c')
      .replace(LINE_SEPS, function (c) { return '\\u' + c.charCodeAt(0).toString(16) })
    var tag = '<script>window.__DECK_STATE__=' + json + '</script>'
    var at = html.search(/<script[\s>]/i)
    if (at >= 0) return html.slice(0, at) + tag + html.slice(at)
    var head = html.indexOf('</head>')
    return head >= 0 ? html.slice(0, head) + tag + html.slice(head) : tag + html
  }

  function fileName(title) {
    return slug(title) + '-student-view.html'
  }

  function save(html, name) {
    var blob = new Blob([html], { type: 'text/html' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(function () { URL.revokeObjectURL(url) }, 4000)
  }

  function getText(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load the deck (HTTP ' + r.status + ').')
      return r.text()
    })
  }
  function getJson(url, timeout) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null
    var t = ctrl ? setTimeout(function () { ctrl.abort() }, timeout || 8000) : null
    return fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null })
      .catch(function () { return null })
      .finally(function () { clearTimeout(t) })
  }

  /**
   * From a deck's page, with a known state (the deck page itself: it already
   * holds the merged state, and an editor's unsaved draft if they choose).
   * `page` defaults to the deck page this script runs on.
   */
  function fromState(state, opts) {
    opts = opts || {}
    var url = opts.pageUrl || location.pathname
    return getText(url).then(function (page) {
      var site = siteOf(page) || {}
      var html = studentHtml(pristine(page), { hidden: state.hidden, edits: state.edits || site.textEdits || {} })
      var name = fileName(opts.title || site.title)
      save(html, name)
      return { name: name, bytes: html.length, hidden: (state.hidden || []).length }
    })
  }

  /**
   * From a deck's URL alone (the gallery): the built page, its baked state
   * and the Worker's not-yet-rebuilt rows, merged the way viewers see them.
   */
  function fromUrl(deckUrl, workerUrl) {
    var base = deckUrl.replace(/[?#].*$/, '').replace(/\/?$/, '/')
    return getText(base).then(function (page) {
      var site = siteOf(page) || {}
      var worker = String(workerUrl || site.worker || '').replace(/\/+$/, '')
      return Promise.all([
        getJson(base + 'state.json?t=' + Date.now()),
        worker && site.id ? getJson(worker + '/api/state?deck=' + encodeURIComponent(site.id)) : Promise.resolve(null),
      ]).then(function (res) {
        var baked = res[0] && res[0].slides ? res[0].slides : site.slides || {}
        var rows = res[1] && res[1].rows ? res[1].rows : []
        var hidden = hiddenFrom(baked, rows)
        var html = studentHtml(pristine(page), { hidden: hidden, edits: site.textEdits || {} })
        var name = fileName(site.title)
        save(html, name)
        return { name: name, bytes: html.length, hidden: hidden.length, live: !!res[1] }
      })
    })
  }

  window.DeckStudent = {
    slug: slug,
    siteOf: siteOf,
    pristine: pristine,
    hiddenFrom: hiddenFrom,
    studentHtml: studentHtml,
    fileName: fileName,
    save: save,
    fromState: fromState,
    fromUrl: fromUrl,
  }
})()
