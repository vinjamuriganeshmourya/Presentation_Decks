/*
 * Deck site overlay: loaded at the top of every published deck.
 *
 * VIEWER: merges the edits baked into the build (state.json) with the Worker's
 * temporary layer (saved but not yet rebuilt), hands the result to the deck as
 * window.__DECK_STATE__ (the deck's own read-only "student" view), then boots
 * the deck's held-back module. Polls for changes and reloads in place when the
 * set of visible slides changes. `#slide-N` opens slide N.
 *
 * COMMENTS (both modes): shared threads per slide (comment, reply, edit,
 * resolve, delete). Everyone can read them; posting needs the editor password.
 * Each action is published at once through the Worker and committed to the repo.
 *
 * EDITOR (?edit=1): password gate, then a panel to skip / delete slides with
 * undo/redo; those changes stay in this browser until Save.
 *
 * Every panel DOCKS beside the deck (right, or bottom on a phone): the deck is
 * resized to the space left, never covered.
 */
;(function () {
  'use strict'
  var SITE = window.__DECK_SITE__
  if (!SITE || window.__DECK_OVERLAY__) return
  window.__DECK_OVERLAY__ = true

  var params = new URLSearchParams(location.search)
  var EDIT = params.get('edit') === '1'
  var WORKER = String(SITE.worker || '').replace(/\/+$/, '')
  var DECK = SITE.id
  var BOOT_TIMEOUT = 2500
  var POLL_VIEW = 12000
  var POLL_EDIT = 6000
  var POLL_COMMENTS = 4000
  var POLL_STATUS = 5000
  var DOCK_W = 380
  var THREAD = '@t:'
  var LS = {
    draft: 'deck-editor:draft:' + DECK,
    pending: 'deck-editor:pending:' + DECK,
    name: 'deck-editor:name',
    pw: 'deck-editor:pw',
    goto: 'deck-site:goto:' + DECK,
    reloads: 'deck-site:reloads:' + DECK,
    panel: 'deck-site:comments-open',
  }

  /* ------------------------------------------------------------ storage + fetch helpers */

  function store(kind) {
    try {
      return kind === 'session' ? window.sessionStorage : window.localStorage
    } catch (e) {
      return null
    }
  }
  function sget(key, kind) {
    try {
      var s = store(kind)
      return s ? s.getItem(key) : null
    } catch (e) {
      return null
    }
  }
  function sset(key, val, kind) {
    try {
      var s = store(kind)
      if (!s) return
      if (val == null) s.removeItem(key)
      else s.setItem(key, val)
    } catch (e) {}
  }
  function jget(key, kind, dflt) {
    try {
      var v = sget(key, kind)
      return v ? JSON.parse(v) : dflt
    } catch (e) {
      return dflt
    }
  }

  function fetchJson(url, opts, timeout) {
    opts = opts || {}
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    var timer = ctrl && timeout ? setTimeout(function () { ctrl.abort() }, timeout) : null
    if (ctrl) opts.signal = ctrl.signal
    opts.cache = 'no-store'
    return fetch(url, opts)
      .then(function (r) {
        return r
          .json()
          .catch(function () { return {} })
          .then(function (body) {
            if (!r.ok) {
              var e = new Error(body && body.error ? body.error : 'HTTP ' + r.status)
              e.status = r.status
              throw e
            }
            return body
          })
      })
      .finally(function () {
        if (timer) clearTimeout(timer)
      })
  }

  function fetchBaked(timeout) {
    return fetchJson('state.json?t=' + Date.now(), {}, timeout).catch(function () { return null })
  }
  function fetchLive(timeout) {
    if (!WORKER) return Promise.resolve(null)
    return fetchJson(WORKER + '/api/state?deck=' + encodeURIComponent(DECK), {}, timeout).catch(function () { return null })
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function when(at) {
    var s = Math.max(0, Math.round((Date.now() - at) / 1000))
    if (s < 45) return 'just now'
    var m = Math.round(s / 60)
    if (m < 60) return m + ' min ago'
    var h = Math.round(m / 60)
    if (h < 24) return h + ' hour' + (h === 1 ? '' : 's') + ' ago'
    var d = new Date(at)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  /* ------------------------------------------------------------ state model */

  function isThreadRow(r) {
    return String(r.slide).indexOf(THREAD) === 0
  }
  function byTime(a, b) {
    return (a.updatedAt || 0) - (b.updatedAt || 0)
  }

  /** baked slides + live rows -> { id: { status, comment } } */
  function mergeState(baked, rows) {
    var out = {}
    var id
    baked = baked || {}
    for (id in baked) {
      if (!Object.prototype.hasOwnProperty.call(baked, id)) continue
      out[id] = {}
      if (baked[id].status) out[id].status = baked[id].status
      if (baked[id].comment) out[id].comment = baked[id].comment
    }
    ;(rows || [])
      .filter(function (r) { return !isThreadRow(r) })
      .sort(byTime)
      .forEach(function (r) {
        var s = (out[r.slide] = out[r.slide] || {})
        s[r.field] = r.value
      })
    return out
  }

  /** baked threads + live rows -> { threadId: thread } */
  function mergeThreads(baked, rows) {
    var out = JSON.parse(JSON.stringify(baked || {}))
    ;(rows || [])
      .filter(isThreadRow)
      .sort(byTime)
      .forEach(function (r) {
        var tid = r.slide.slice(THREAD.length)
        if (r.field === 'root') {
          if (r.value === null) out[tid] = null
          else {
            var prev = out[tid] || { replies: {}, resolved: false }
            var next = Object.assign({}, prev, r.value)
            next.replies = prev.replies || {}
            out[tid] = next
          }
        } else if (out[tid]) {
          if (r.field === 'resolved') out[tid].resolved = !!r.value
          else if (r.field.indexOf('r:') === 0) {
            var rid = r.field.slice(2)
            out[tid].replies = out[tid].replies || {}
            if (r.value === null) delete out[tid].replies[rid]
            else out[tid].replies[rid] = r.value
          }
        }
      })
    for (var k in out) if (!out[k]) delete out[k]
    return out
  }

  function statusOf(st, id) {
    return (st[id] && st[id].status) || 'visible'
  }
  function hiddenOf(st) {
    var out = []
    for (var id in st) if (statusOf(st, id) !== 'visible') out.push(id)
    return out.sort()
  }

  /* ------------------------------------------------------------ boot */

  var boot = { state: null, hiddenSig: '', bakedSha: SITE.sha, contentHash: null }
  var wantSlide = null
  var hm = /^#slide-(\d+)$/.exec(location.hash)
  if (hm) {
    wantSlide = parseInt(hm[1], 10)
    /* viewer numbering is the deck's own numbering: hand it straight over */
    if (!EDIT) history.replaceState(null, '', location.pathname + location.search + '#/' + wantSlide)
  }

  function domReady() {
    return new Promise(function (res) {
      if (document.readyState !== 'loading') res()
      else document.addEventListener('DOMContentLoaded', function () { res() }, { once: true })
    })
  }

  function startDeck() {
    var held = document.getElementById('deck-main')
    if (!held) return
    var s = document.createElement('script')
    s.type = 'module'
    s.textContent = held.textContent
    held.parentNode.removeChild(held)
    document.body.appendChild(s)
  }

  function deckApi() {
    return window.__DECK__
  }
  function whenDeck(timeoutMs) {
    return new Promise(function (res) {
      var t0 = Date.now()
      ;(function tick() {
        var d = deckApi()
        if (d && d.all && d.all.length) return res(d)
        if (Date.now() - t0 > (timeoutMs || 30000)) return res(null)
        setTimeout(tick, 60)
      })()
    })
  }
  function gotoActive(n) {
    location.hash = '#/' + n
  }
  function gotoId(id) {
    var d = deckApi()
    if (!d) return false
    for (var i = 0; i < d.slides.length; i++) {
      if (d.slides[i].id === id) {
        if (d.current !== i + 1) gotoActive(i + 1)
        return true
      }
    }
    return false
  }
  function currentId() {
    var d = deckApi()
    if (!d || !d.slides) return null
    var s = d.slides[(d.current || 1) - 1]
    return s ? s.id : null
  }
  function slideInfo(id) {
    var d = deckApi()
    if (!d) return null
    for (var i = 0; i < d.all.length; i++) if (d.all[i].id === id) return d.all[i]
    return null
  }

  Promise.all([fetchBaked(BOOT_TIMEOUT), fetchLive(BOOT_TIMEOUT)])
    .then(function (res) {
      var baked = res[0]
      var live = res[1]
      boot.baked = baked && baked.slides ? baked.slides : SITE.slides
      boot.bakedThreads = baked && baked.threads ? baked.threads : SITE.threads || {}
      if (baked && baked.sha) boot.bakedSha = baked.sha
      boot.contentHash = baked && baked.contentHash ? baked.contentHash : null
      boot.rows = (live && live.rows) || []
      boot.state = mergeState(boot.baked, boot.rows)
      var hidden = hiddenOf(boot.state)
      boot.hiddenSig = hidden.join('\n')
      window.__DECK_STATE__ = { view: 'student', hidden: EDIT ? [] : hidden, edits: SITE.textEdits || {} }
      return domReady().then(function () {
        startDeck()
        return whenDeck()
      })
    })
    .then(function (d) {
      if (!d) return
      var gotoAfterReload = sget(LS.goto, 'session')
      if (gotoAfterReload) {
        sset(LS.goto, null, 'session')
        gotoId(gotoAfterReload)
      } else if (EDIT && wantSlide) {
        /* #slide-N counts viewer-visible slides; the editor shows every slide */
        var visible = d.all.filter(function (s) { return statusOf(boot.state, s.id) === 'visible' })
        var target = visible[wantSlide - 1]
        if (target) gotoId(target.id)
      }
      startUi(d)
    })

  function reloadKeepingSlide() {
    var log = jget(LS.reloads, 'session', []).filter(function (t) { return Date.now() - t < 60000 })
    if (log.length >= 3) return /* never loop */
    log.push(Date.now())
    sset(LS.reloads, JSON.stringify(log), 'session')
    var id = currentId()
    if (id) sset(LS.goto, id, 'session')
    location.replace(location.pathname + location.search)
  }

  /* ------------------------------------------------------------ UI (both modes) */

  /* ------------------------------------------------------------ deck navigation (home, previous / next session, session menu) */

  var NAV = SITE.nav || null
  function navIndex() {
    if (!NAV || !NAV.decks) return -1
    for (var i = 0; i < NAV.decks.length; i++) if (NAV.decks[i].id === DECK) return i
    return -1
  }
  function navUrl(d) {
    return d.url + (EDIT ? '?edit=1' : '')
  }
  function navHtml() {
    if (!NAV) return ''
    var i = navIndex()
    var list = NAV.decks || []
    var prev = i > 0 ? list[i - 1] : null
    var next = i >= 0 && i < list.length - 1 ? list[i + 1] : null
    var homeHref = NAV.home + (NAV.homeAnchor ? '#' + NAV.homeAnchor : '')
    var ICON_HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>'
    var ICON_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6"/></svg>'
    var ICON_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>'
    var ICON_D = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
    var arrow = function (d, cls, icon, word) {
      return d
        ? '<a class="tn-btn ' + cls + '" href="' + esc(navUrl(d)) + '" title="' + word + ' session: ' + esc(d.title) + '" aria-label="' + word + ' session: ' + esc(d.title) + '">' + icon + '</a>'
        : '<span class="tn-btn ' + cls + ' off" aria-hidden="true">' + icon + '</span>'
    }
    var items = list
      .map(function (d, k) {
        return (
          '<a role="menuitem" class="tn-item' + (k === i ? ' here' : '') + '" href="' + esc(navUrl(d)) + '"' + (k === i ? ' aria-current="page"' : '') + '>' +
          '<span class="tn-num">' + d.session + '</span><span class="tn-t">' + esc(d.title) + '</span></a>'
        )
      })
      .join('')
    return (
      '<nav class="topnav" aria-label="Deck navigation">' +
      '<a class="tn-btn tn-home" href="' + esc(homeHref) + '" title="All decks" aria-label="All decks (home)">' + ICON_HOME + '<span>All decks</span></a>' +
      '<span class="tn-sep" aria-hidden="true"></span>' +
      arrow(prev, 'tn-prev', ICON_L, 'Previous') +
      '<button class="tn-btn tn-cur" aria-haspopup="menu" aria-expanded="false" title="' + esc(NAV.course) + ': all sessions">' +
      '<span class="tn-cur-t">' + (i >= 0 ? 'Session ' + list[i].session + ' of ' + list.length : esc(NAV.course)) + '</span>' + ICON_D + '</button>' +
      arrow(next, 'tn-next', ICON_R, 'Next') +
      '<div class="tn-menu" role="menu" hidden><div class="tn-h">' + esc(NAV.course) + '</div>' + items + '</div>' +
      '</nav>'
    )
  }
  /* shown on any pointer / key / touch activity, faded after a few idle seconds (like the deck's own controls) */
  function wireNav(root) {
    var nav = root.querySelector('.topnav')
    if (!nav) return
    var menu = nav.querySelector('.tn-menu')
    var cur = nav.querySelector('.tn-cur')
    var idleT = null
    var hovering = false
    function wake() {
      nav.classList.remove('idle')
      clearTimeout(idleT)
      idleT = setTimeout(function () {
        if (!hovering && menu.hidden && !nav.contains(root.activeElement)) nav.classList.add('idle')
      }, 3000)
    }
    function setMenu(open) {
      menu.hidden = !open
      cur.setAttribute('aria-expanded', open ? 'true' : 'false')
      if (open) {
        var here = menu.querySelector('.here')
        if (here) here.scrollIntoView({ block: 'nearest' })
      }
      wake()
    }
    ;['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (t) {
      window.addEventListener(t, wake, { passive: true, capture: true })
    })
    nav.addEventListener('pointerenter', function () { hovering = true; wake() })
    nav.addEventListener('pointerleave', function () { hovering = false; wake() })
    cur.addEventListener('click', function () { setMenu(menu.hidden) })
    window.addEventListener('pointerdown', function (e) {
      if (!menu.hidden && e.composedPath().indexOf(nav) < 0) setMenu(false)
    }, true)
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        e.preventDefault()
        setMenu(false)
        cur.focus()
      }
    })
    wake()
  }

  function startUi(deck) {
    var ui = {
      deck: deck,
      baked: boot.baked,
      bakedThreads: boot.bakedThreads,
      rows: boot.rows,
      base: boot.state,
      threads: mergeThreads(boot.bakedThreads, boot.rows),
      local: EDIT ? jget(LS.draft, 'local', {}) || {} : {},
      undo: [],
      redo: [],
      pending: EDIT ? jget(LS.pending, 'local', null) : null,
      saving: false,
      open: EDIT ? false : sget(LS.panel, 'local') === '1',
      tab: 'comments',
      filter: 'all',
      showResolved: false,
      replyTo: null,
      editing: null,
      busy: false,
      current: null,
    }

    /* --- docking: the deck gets the space the panel does not use --- */
    var dockCss = document.createElement('style')
    dockCss.id = 'deck-dock-css'
    dockCss.textContent =
      'html.deck-dock-r .deck-viewport{width:calc(100% - ' + DOCK_W + 'px)!important;transition:width .2s ease}' +
      'html.deck-dock-b .deck-viewport{height:52dvh!important;height:52vh!important}' +
      '@supports (height:1dvh){html.deck-dock-b .deck-viewport{height:52dvh!important}}'
    document.head.appendChild(dockCss)
    var phone = window.matchMedia('(max-width: 760px)')
    function applyDock() {
      var full = !!document.fullscreenElement
      var docked = ui.open && !full
      document.documentElement.classList.toggle('deck-dock-r', docked && !phone.matches)
      document.documentElement.classList.toggle('deck-dock-b', docked && phone.matches)
      window.dispatchEvent(new Event('resize'))
    }
    document.addEventListener('fullscreenchange', applyDock)
    if (phone.addEventListener) phone.addEventListener('change', applyDock)

    /* --- shadow DOM UI, isolated from the deck's styles --- */
    var host = document.createElement('div')
    host.id = 'deck-editor-host'
    host.setAttribute('data-edit-layer', '')
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;'
    document.body.appendChild(host)
    var root = host.attachShadow({ mode: 'open' })
    root.innerHTML =
      '<style>' + CSS + '</style>' +
      navHtml() +
      '<div class="badge" hidden></div>' +
      '<div class="fabs">' +
      '<button class="fab dl" hidden title="Download the student view (one offline HTML file, no comments or editing)" aria-label="Download the student view"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg></button>' +
      '<button class="fab cmt" hidden title="Comments"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span class="fab-n"></span></button>' +
      '</div>' +
      '<div class="toast" role="status" aria-live="polite"></div>' +
      '<aside class="panel ' + (EDIT ? 'edit' : 'view') + '" aria-label="' + (EDIT ? 'Edit panel' : 'Comments') + '">' +
      '  <header><div class="ttl"><span class="pill">' + (EDIT ? 'Edit mode' : 'Comments') + '</span><span class="deck"></span></div>' +
      '    <div class="hbtns"><button class="ghost dl-h" title="Download the student view: ' + (EDIT ? 'the deck as set in this panel, unsaved changes included,' : 'the deck as it is shown here,') + ' as one offline HTML file without comments or editing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>Download</button>' +
      '    <button class="icon close" title="' + (EDIT ? 'Collapse panel' : 'Close comments') + '">✕</button></div></header>' +
      '  <section class="cur">' +
      '    <div class="cur-h"><span class="cur-n"></span><span class="cur-id"></span></div>' +
      '    <div class="cur-label"></div>' +
      (EDIT
        ? '    <div class="seg" role="group" aria-label="Slide status">' +
          '      <button data-status="visible">Visible</button><button data-status="skipped">Skip</button><button data-status="deleted">Delete</button>' +
          '    </div>' +
          '    <div class="row"><button class="ghost copy-slide">Copy slide link</button><span class="hint"></span></div>'
        : '') +
      '  </section>' +
      (EDIT
        ? '  <section class="tools">' +
          '    <button class="ghost undo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="ghost redo" title="Redo (Ctrl+Shift+Z)">↷ Redo</button>' +
          '    <button class="primary save">Save</button>' +
          '  </section>' +
          '  <div class="msg" role="status" aria-live="polite"></div>' +
          '  <nav class="tabs"><button data-tab="comments" class="on">Comments <span class="tab-n"></span></button><button data-tab="slides">Slides</button></nav>'
        : '  <div class="msg" role="status" aria-live="polite"></div>') +
      '  <section class="comments">' +
      '    <div class="threads"></div>' +
      '    <label class="resolved-toggle"><input type="checkbox" class="show-resolved"> Show resolved <span class="res-n"></span></label>' +
      '    <div class="composer"></div>' +
      '  </section>' +
      (EDIT
        ? '  <section class="list-wrap" hidden>' +
          '    <div class="list-h"><span>Slides</span><select class="filter"><option value="all">All</option><option value="changed">Unsaved changes</option><option value="hidden">Skipped / deleted</option><option value="comment">With comments</option></select></div>' +
          '    <ol class="list"></ol>' +
          '  </section>'
        : '') +
      '</aside>' +
      '<button class="tab-open" hidden title="Open edit panel">✎ Edit</button>' +
      '<div class="gate" hidden><form class="gate-box"><h2>Editor sign-in</h2><p class="gwhy"></p>' +
      '<input type="password" class="gpw" autocomplete="current-password" placeholder="Editor password" required>' +
      '<input type="text" class="gname" autocomplete="nickname" placeholder="Your name (shown on comments and commits)" maxlength="60">' +
      '<div class="gerr"></div><div class="row"><button type="button" class="ghost gcancel">' + (EDIT ? 'View only' : 'Cancel') + '</button><button class="primary" type="submit">Sign in</button></div></form></div>'

    var $ = function (sel) { return root.querySelector(sel) }
    wireNav(root)
    var panel = $('.panel')
    var badge = $('.badge')
    var fab = $('.fab.cmt')
    var dlFab = $('.fab.dl')
    var toastEl = $('.toast')
    var msgEl = $('.msg')
    var threadsEl = $('.threads')
    var composer = $('.composer')
    var saveBtn = $('.save')
    var undoBtn = $('.undo')
    var redoBtn = $('.redo')
    var list = $('.list')
    $('.deck').textContent = SITE.title

    /* keys typed in the panel never reach the deck's (window, capture) navigation */
    var inPanel = function (e) {
      var p = e.composedPath ? e.composedPath() : []
      return p.indexOf(host) >= 0
    }
    var isField = function (e) {
      var t = e.composedPath ? e.composedPath()[0] : e.target
      return t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT')
    }
    window.addEventListener(
      'keydown',
      function (e) {
        var mod = e.ctrlKey || e.metaKey
        var k = (e.key || '').toLowerCase()
        if (EDIT && mod && !isField(e) && (k === 'z' || k === 'y')) {
          e.preventDefault()
          e.stopImmediatePropagation()
          if (k === 'y' || e.shiftKey) doRedo()
          else doUndo()
          return
        }
        if (inPanel(e)) e.stopImmediatePropagation()
      },
      true,
    )
    ;['keyup', 'keypress'].forEach(function (t) {
      window.addEventListener(t, function (e) { if (inPanel(e)) e.stopImmediatePropagation() }, true)
    })
    ;['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'wheel', 'click', 'dblclick'].forEach(function (t) {
      host.addEventListener(t, function (e) { e.stopPropagation() })
    })

    function password() {
      return sget(LS.pw, 'session')
    }
    function myName() {
      return sget(LS.name, 'local') || ''
    }
    function flash(text, kind) {
      msgEl.textContent = text
      msgEl.className = 'msg ' + (kind || '')
      clearTimeout(flash.t)
      if (kind !== 'sticky') flash.t = setTimeout(function () { msgEl.textContent = ''; msgEl.className = 'msg' }, 6000)
      if (EDIT && !ui.open && text) toast(text)
    }

    /* --- panel open / close --- */
    function setOpen(open) {
      ui.open = open
      panel.classList.toggle('hide', !open)
      if (EDIT) $('.tab-open').hidden = open || deckUi.mounted
      else sset(LS.panel, open ? '1' : null, 'local')
      applyDock()
      render()
      if (open && pollNow) pollNow()
    }
    $('.close').addEventListener('click', function () { setOpen(false) })
    $('.tab-open').addEventListener('click', function () { setOpen(true) })
    fab.addEventListener('click', function () { setOpen(!ui.open) })

    /* --- edit model (status only; comments publish immediately) --- */
    function eff(id) {
      var l = ui.local[id] || {}
      return { status: l.status !== undefined ? l.status : statusOf(ui.base, id) }
    }
    function prune() {
      for (var id in ui.local) {
        var l = ui.local[id]
        if (l.status !== undefined && l.status === statusOf(ui.base, id)) delete l.status
        delete l.comment
        if (l.status === undefined) delete ui.local[id]
      }
    }
    function changeCount() {
      return Object.keys(ui.local).length
    }
    function persistDraft() {
      if (EDIT) sset(LS.draft, changeCount() ? JSON.stringify(ui.local) : null, 'local')
    }
    function mutate(fn) {
      ui.undo.push(JSON.stringify(ui.local))
      if (ui.undo.length > 200) ui.undo.shift()
      ui.redo = []
      fn()
      prune()
      persistDraft()
      render()
    }
    function doUndo() {
      if (!ui.undo.length) return
      ui.redo.push(JSON.stringify(ui.local))
      ui.local = JSON.parse(ui.undo.pop())
      prune()
      persistDraft()
      render()
    }
    function doRedo() {
      if (!ui.redo.length) return
      ui.undo.push(JSON.stringify(ui.local))
      ui.local = JSON.parse(ui.redo.pop())
      prune()
      persistDraft()
      render()
    }
    function viewerNumber(id) {
      var n = 0
      var all = (deckApi() || ui.deck).all
      for (var i = 0; i < all.length; i++) {
        var vis = statusOf(ui.base, all[i].id) === 'visible'
        if (vis) n++
        if (all[i].id === id) return vis ? n : null
      }
      return null
    }

    /* --- comments --- */
    function threadsFor(id) {
      var out = []
      for (var k in ui.threads) {
        var t = ui.threads[k]
        if (t && t.slide === id) out.push(Object.assign({ id: k }, t))
      }
      return out.sort(function (a, b) { return a.at - b.at })
    }
    function openCount(id) {
      return threadsFor(id).filter(function (t) { return !t.resolved }).length
    }
    function repliesOf(t) {
      var out = []
      for (var k in t.replies || {}) out.push(Object.assign({ id: k }, t.replies[k]))
      return out.sort(function (a, b) { return a.at - b.at })
    }

    function commentAction(body, okMsg) {
      if (!password()) {
        showGate('Sign in with the editor password to comment.')
        return Promise.resolve(false)
      }
      ui.busy = true
      renderComments(true)
      body.deck = DECK
      body.author = myName() || 'Editor'
      return fetchJson(
        WORKER + '/api/comment',
        { method: 'POST', headers: { 'content-type': 'application/json', 'x-editor-password': password() }, body: JSON.stringify(body) },
        30000,
      )
        .then(function () {
          ui.busy = false
          if (okMsg) flash(okMsg, 'ok')
          return refresh().then(function () { return true })
        })
        .catch(function (err) {
          ui.busy = false
          if (err.status === 401) {
            sset(LS.pw, null, 'session')
            showGate('Password rejected. Sign in again; your text is kept.')
          } else flash('Could not post: ' + err.message, 'err')
          renderComments(true)
          return false
        })
    }

    var lastCommentsSig = ''
    function renderComments(force) {
      var cid = currentId()
      var signed = !!password()
      var all = threadsFor(cid)
      var open = all.filter(function (t) { return !t.resolved })
      var resolved = all.length - open.length
      var sig = JSON.stringify([cid, ui.threads, ui.showResolved, ui.replyTo, ui.editing, signed, ui.busy])
      if (!force && sig === lastCommentsSig) return
      /* never wipe text someone is typing */
      var active = root.activeElement
      if (!force && active && active.tagName === 'TEXTAREA' && threadsEl.contains(active)) return
      lastCommentsSig = sig
      var shown = ui.showResolved ? all : open
      var html = ''
      shown.forEach(function (t) {
        html += '<article class="thread' + (t.resolved ? ' resolved' : '') + '" data-t="' + t.id + '">' + msgHtml(t, t.id, null, signed)
        repliesOf(t).forEach(function (r) {
          html += '<div class="reply">' + msgHtml(r, t.id, r.id, signed) + '</div>'
        })
        if (signed) {
          if (ui.replyTo === t.id)
            html +=
              '<div class="reply-box"><textarea class="reply-text" rows="2" placeholder="Reply…"></textarea>' +
              '<div class="row"><button class="ghost act" data-act="cancel-reply">Cancel</button><button class="primary act" data-act="post-reply" data-t="' + t.id + '"' + (ui.busy ? ' disabled' : '') + '>Reply</button></div></div>'
          else
            html +=
              '<div class="t-actions"><button class="link act" data-act="reply" data-t="' + t.id + '">Reply</button>' +
              '<button class="link act" data-act="' + (t.resolved ? 'reopen' : 'resolve') + '" data-t="' + t.id + '">' + (t.resolved ? 'Reopen' : 'Resolve') + '</button></div>'
        }
        html += '</article>'
      })
      if (!shown.length) html = '<p class="empty">' + (resolved && !ui.showResolved ? 'No open comments on this slide.' : 'No comments on this slide yet.') + '</p>'
      threadsEl.innerHTML = html
      $('.resolved-toggle').hidden = !resolved
      $('.res-n').textContent = resolved ? '(' + resolved + ')' : ''
      if (signed) {
        if (!composer.querySelector('.new-text'))
          composer.innerHTML =
            '<textarea class="new-text" rows="3" placeholder="Add a comment on this slide…"></textarea>' +
            '<div class="row"><span class="as"></span><button class="primary act" data-act="post">Comment</button></div>'
        composer.querySelector('.as').textContent = 'as ' + (myName() || 'Editor')
        composer.querySelector('[data-act=post]').disabled = ui.busy
        composer.querySelector('[data-act=post]').textContent = ui.busy ? 'Posting…' : 'Comment'
      } else {
        composer.innerHTML = '<button class="ghost wide act" data-act="signin">Sign in to comment</button>'
      }
      var rt = threadsEl.querySelector('.reply-text')
      if (rt && ui.replyDraft) rt.value = ui.replyDraft
      var et = threadsEl.querySelector('.edit-text')
      if (et && ui.editDraft != null) et.value = ui.editDraft
    }
    function msgHtml(m, tid, rid, signed) {
      var key = tid + ':' + (rid || '')
      var editing = ui.editing === key
      var body = editing
        ? '<textarea class="edit-text" rows="3">' + esc(m.text) + '</textarea><div class="row"><button class="ghost act" data-act="cancel-edit">Cancel</button>' +
          '<button class="primary act" data-act="save-edit" data-t="' + tid + '" data-r="' + (rid || '') + '"' + (ui.busy ? ' disabled' : '') + '>Save</button></div>'
        : '<div class="text">' + esc(m.text) + '</div>'
      return (
        '<div class="m-h"><span class="avatar">' + esc((m.author || '?').trim().charAt(0).toUpperCase() || '?') + '</span>' +
        '<span class="who">' + esc(m.author || 'Editor') + '</span><span class="when" title="' + esc(new Date(m.at).toLocaleString()) + '">' + when(m.at) + (m.edited ? ' · edited' : '') + '</span>' +
        (signed && !editing
          ? '<span class="m-tools"><button class="link act" data-act="edit" data-t="' + tid + '" data-r="' + (rid || '') + '" title="Edit">Edit</button>' +
            '<button class="link act danger" data-act="delete" data-t="' + tid + '" data-r="' + (rid || '') + '" title="Delete">Delete</button></span>'
          : '') +
        '</div>' + body
      )
    }

    root.addEventListener('input', function (e) {
      var t = e.composedPath()[0]
      if (t.classList && t.classList.contains('reply-text')) ui.replyDraft = t.value
      if (t.classList && t.classList.contains('edit-text')) ui.editDraft = t.value
    })
    root.addEventListener('click', function (e) {
      var b = e.composedPath()[0].closest && e.composedPath()[0].closest('.act')
      if (!b) return
      var act = b.getAttribute('data-act')
      var tid = b.getAttribute('data-t')
      var rid = b.getAttribute('data-r') || null
      var cid = currentId()
      if (act === 'signin') return showGate('Sign in with the editor password to comment.')
      if (act === 'post') {
        var ta = composer.querySelector('.new-text')
        var text = ta.value.trim()
        if (!text || !cid) return
        commentAction({ op: 'add', thread: uid(), slide: cid, text: text }, 'Comment posted. Everyone can see it.').then(function (ok) {
          if (ok) ta.value = ''
        })
      } else if (act === 'reply') {
        ui.replyTo = tid
        ui.replyDraft = ''
        renderComments(true)
        var r = threadsEl.querySelector('.reply-text')
        if (r) r.focus()
      } else if (act === 'cancel-reply') {
        ui.replyTo = null
        renderComments(true)
      } else if (act === 'post-reply') {
        var rtext = (ui.replyDraft || '').trim()
        if (!rtext) return
        commentAction({ op: 'reply', thread: tid, reply: uid(), text: rtext }).then(function (ok) {
          if (ok) {
            ui.replyTo = null
            ui.replyDraft = ''
            renderComments(true)
          }
        })
      } else if (act === 'resolve' || act === 'reopen') {
        commentAction({ op: 'resolve', thread: tid, resolved: act === 'resolve' }, act === 'resolve' ? 'Thread resolved.' : 'Thread reopened.')
      } else if (act === 'edit') {
        ui.editing = tid + ':' + (rid || '')
        ui.editDraft = null
        renderComments(true)
        var et = threadsEl.querySelector('.edit-text')
        if (et) et.focus()
      } else if (act === 'cancel-edit') {
        ui.editing = null
        renderComments(true)
      } else if (act === 'save-edit') {
        var etext = threadsEl.querySelector('.edit-text').value.trim()
        if (!etext) return
        commentAction({ op: 'edit', thread: tid, reply: rid, text: etext }).then(function (ok) {
          if (ok) {
            ui.editing = null
            ui.editDraft = null
            renderComments(true)
          }
        })
      } else if (act === 'delete') {
        if (!window.confirm(rid ? 'Delete this reply?' : 'Delete this comment thread and its replies?')) return
        commentAction({ op: 'delete', thread: tid, reply: rid }, rid ? 'Reply deleted.' : 'Thread deleted.')
      }
    })
    $('.show-resolved').addEventListener('change', function (e) {
      ui.showResolved = e.target.checked
      renderComments(true)
    })

    /* --- render --- */
    var lastListSig = ''
    function render() {
      var d = deckApi() || ui.deck
      ui.deck = d
      var cid = currentId()
      var cur = slideInfo(cid)
      if (ui.current !== cid) {
        ui.replyTo = null
        ui.editing = null
        ui.current = cid
      }
      var n = cur ? (EDIT ? cur.n : (d.current || cur.n)) : 0
      $('.cur-n').textContent = cur ? 'Slide ' + n + ' / ' + (EDIT ? d.all.length : d.total) : ''
      $('.cur-id').textContent = EDIT ? cid || '' : ''
      $('.cur-label').textContent = cur ? cur.label || cur.section || '' : ''

      var oc = cid ? openCount(cid) : 0
      fab.hidden = EDIT || ui.open || !!document.fullscreenElement
      dlFab.hidden = fab.hidden
      fab.classList.toggle('has', oc > 0)
      root.querySelector('.fab-n').textContent = oc ? String(oc) : ''
      fab.title = oc ? oc + ' comment' + (oc === 1 ? '' : 's') + ' on this slide' : 'Comments'

      if (EDIT) {
        var e = cid ? eff(cid) : { status: 'visible' }
        root.querySelectorAll('.seg button').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-status') === e.status)
          var dirty = cid && ui.local[cid] && ui.local[cid].status !== undefined
          b.classList.toggle('dirty', !!dirty && b.getAttribute('data-status') === e.status)
        })
        var vn = cid ? viewerNumber(cid) : null
        $('.copy-slide').disabled = !vn
        $('.hint').textContent = vn ? '#slide-' + vn : 'hidden from viewers'
        if (e.status !== 'visible') {
          badge.hidden = false
          badge.className = 'badge ' + e.status
          badge.textContent = e.status === 'deleted' ? 'Deleted · hidden from viewers' : 'Skipped · hidden from viewers'
        } else badge.hidden = true
        $('.tab-n').textContent = oc ? '(' + oc + ')' : ''

        var nc = changeCount()
        undoBtn.disabled = !ui.undo.length
        redoBtn.disabled = !ui.redo.length
        if (ui.saving || ui.pending) {
          saveBtn.disabled = true
          saveBtn.textContent = 'Building…'
          saveBtn.title = ui.pending ? 'Waiting for the live build to include commit ' + ui.pending.sha.slice(0, 7) : ''
        } else {
          saveBtn.disabled = nc === 0
          saveBtn.textContent = nc ? 'Save (' + nc + ')' : 'Save'
          saveBtn.title = nc ? 'Commit your changes and publish them to every viewer' : 'No unsaved changes'
        }
        renderList(d, cid)
        syncDeckUi(d, cid, oc, nc)
      }
      if (ui.open && (!EDIT || ui.tab === 'comments')) renderComments(false)
    }
    function renderList(d, cid) {
      if (ui.tab !== 'slides') return
      var sig = JSON.stringify([d.all.length, cid, ui.filter, ui.local, ui.base, ui.threads])
      if (sig === lastListSig) return
      lastListSig = sig
      var html = ''
      d.all.forEach(function (s) {
        var x = eff(s.id)
        var dirty = !!ui.local[s.id]
        var c = openCount(s.id)
        if (ui.filter === 'changed' && !dirty) return
        if (ui.filter === 'hidden' && x.status === 'visible') return
        if (ui.filter === 'comment' && !c) return
        html +=
          '<li data-id="' + esc(s.id) + '" class="' + (s.id === cid ? 'here ' : '') + x.status + (dirty ? ' dirty' : '') + '">' +
          '<span class="n">' + s.n + '</span><span class="nm">' + esc(s.label || s.id) + '</span>' +
          (x.status !== 'visible' ? '<span class="st">' + (x.status === 'deleted' ? 'DEL' : 'SKIP') + '</span>' : '') +
          (c ? '<span class="cm" title="' + c + ' open comment(s)">💬' + c + '</span>' : '') +
          (dirty ? '<span class="dot" title="Unsaved change"></span>' : '') +
          '</li>'
      })
      list.innerHTML = html || '<li class="empty">Nothing here</li>'
      var curLi = list.querySelector('li.here')
      if (curLi && curLi.scrollIntoView && !render.userScrolled) curLi.scrollIntoView({ block: 'nearest' })
    }

    /* --- edit-mode events --- */
    if (EDIT) {
      root.querySelectorAll('.seg button').forEach(function (b) {
        b.addEventListener('click', function () {
          setStatus(currentId(), b.getAttribute('data-status'))
        })
      })
      undoBtn.addEventListener('click', doUndo)
      redoBtn.addEventListener('click', doRedo)
      saveBtn.addEventListener('click', doSave)
      root.querySelectorAll('.tabs button').forEach(function (b) {
        b.addEventListener('click', function () {
          ui.tab = b.getAttribute('data-tab')
          root.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b) })
          $('.comments').hidden = ui.tab !== 'comments'
          $('.list-wrap').hidden = ui.tab !== 'slides'
          lastListSig = ''
          lastCommentsSig = ''
          render()
          if (ui.tab === 'comments') pollNow()
        })
      })
      $('.filter').addEventListener('change', function (e) {
        ui.filter = e.target.value
        render()
      })
      list.addEventListener('click', function (e) {
        var li = e.target.closest('li[data-id]')
        if (li) gotoId(li.getAttribute('data-id'))
      })
      list.addEventListener('scroll', function () {
        render.userScrolled = true
        clearTimeout(render.st)
        render.st = setTimeout(function () { render.userScrolled = false }, 2500)
      })
      $('.copy-slide').addEventListener('click', function () {
        var id = currentId()
        var vn = id && viewerNumber(id)
        if (!vn) return
        var url = location.origin + location.pathname + '#slide-' + vn
        copyText(url).then(function () { flash('Copied ' + url, 'ok') })
      })
    }


    /* --- EDIT MODE, DECK-NATIVE CONTROLS (UI only) ---
       Undo / Redo / Save and a Comments button live in the deck's own toolbar, Skip / Delete on the
       grid's cards, and the panel wears the toolbar's look. Every one of them calls what the panel's
       own buttons call (the toolbar buttons literally click them), so behaviour is unchanged. */
    function setStatus(id, status) {
      if (!id) return
      mutate(function () {
        ;(ui.local[id] = ui.local[id] || {}).status = status
      })
    }
    var deckUi = { mounted: false, group: null, btn: {}, theme: null }
    function svgIcon(paths) {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
    }
    var TB_ICON = {
      comments: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
      undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
      redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
      save: '<path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/>',
    }
    /* the deck's own colours and fonts, read from its stylesheet so the edit UI matches every deck */
    function deckTheme() {
      var probe = document.createElement('div')
      probe.setAttribute('aria-hidden', 'true')
      probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none'
      probe.innerHTML = '<span class="font-body text-ink">a</span><span class="font-heading text-muted">a</span><span class="bg-brand"></span><span class="bg-warning"></span><span class="bg-danger"></span>'
      document.body.appendChild(probe)
      var c = probe.children
      var cs = function (i) { return getComputedStyle(c[i]) }
      var t = { body: cs(0).fontFamily, ink: cs(0).color, heading: cs(1).fontFamily, muted: cs(1).color, brand: cs(2).backgroundColor, warning: cs(3).backgroundColor, danger: cs(4).backgroundColor }
      probe.remove()
      var unset = function (v) { return !v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent' }
      var rgb = function (v, dflt) { var m = /rgba?\(([^)]+)\)/.exec(v || ''); return m ? m[1].split(',').slice(0, 3).map(function (x) { return x.trim() }).join(',') : dflt }
      var muted = rgb(t.muted, '107,127,149')
      return {
        font: t.body || 'inherit',
        heading: t.heading || t.body || 'inherit',
        ink: t.ink || '#0f172a',
        muted: 'rgb(' + muted + ')',
        line: 'rgba(' + muted + ',.2)',
        hover: 'rgba(' + muted + ',.1)',
        brand: unset(t.brand) ? '#2D63FB' : t.brand,
        warning: unset(t.warning) ? '#f59e0b' : t.warning,
        danger: unset(t.danger) ? '#ef4444' : t.danger,
      }
    }
    function applyTheme() {
      var th = (deckUi.theme = deckTheme())
      var map = { font: '--d-font', heading: '--d-heading', ink: '--d-ink', muted: '--d-muted', line: '--d-line', hover: '--d-hover', brand: '--d-brand', warning: '--d-warning', danger: '--d-danger' }
      for (var k in map) {
        host.style.setProperty(map[k], th[k])
        document.documentElement.style.setProperty(map[k].replace('--d-', '--deck-site-'), th[k])
      }
      var css = document.createElement('style')
      css.id = 'deck-site-edit-css'
      css.textContent = EDIT_LIGHT_CSS
      document.head.appendChild(css)
    }
    function findFullscreen() {
      var all = document.querySelectorAll('button[aria-label]')
      var pick = null
      for (var i = 0; i < all.length; i++) {
        var b = all[i]
        if (b.closest('[data-site-tb-group]') || !/fullscreen/i.test(b.getAttribute('aria-label'))) continue
        if (b.offsetParent !== null) return b
        pick = pick || b
      }
      return pick
    }
    function buildGroup(fs) {
      var btnCls = fs.className
      var prev = fs.previousElementSibling
      var sepCls = prev && prev.tagName === 'SPAN' && prev.getAttribute('aria-hidden') === 'true' ? prev.className : 'mx-0.5 h-5 w-px shrink-0 bg-muted/25'
      var sep = '<span aria-hidden="true" class="' + sepCls + '"></span>'
      var b = function (key, label, extra) {
        return '<button type="button" data-site-tb="' + key + '" class="' + (key === 'save' ? btnCls.replace(/\bw-8\b/, '') : btnCls) + '" aria-label="' + label + '" title="' + label + '">' + svgIcon(TB_ICON[key]) + (extra || '') + '</button>'
      }
      var g = document.createElement('span')
      g.setAttribute('data-site-tb-group', '')
      g.style.display = 'contents' /* the buttons join the toolbar's own flex row, gap and all */
      g.innerHTML =
        b('comments', 'Comments', '<span data-site-n hidden></span>') + sep +
        b('undo', 'Undo (Ctrl+Z)') + b('redo', 'Redo (Ctrl+Shift+Z)') +
        b('save', 'Save', '<span data-site-lbl></span><span data-site-dot hidden></span>') + sep
      ;['comments', 'undo', 'redo', 'save'].forEach(function (k) {
        var el = g.querySelector('[data-site-tb="' + k + '"]')
        deckUi.btn[k] = el
        el.addEventListener('click', function (e) {
          e.stopPropagation()
          if (k === 'comments') openComments()
          else if (k === 'undo') undoBtn.click()
          else if (k === 'redo') redoBtn.click()
          else saveBtn.click()
        })
      })
      return g
    }
    function mountToolbar() {
      var fs = findFullscreen()
      if (!fs) return false
      if (!deckUi.group) deckUi.group = buildGroup(fs)
      if (deckUi.group.nextElementSibling !== fs || !deckUi.group.isConnected) {
        fs.parentNode.insertBefore(deckUi.group, fs)
        fitToolbar()
      }
      return true
    }
    /* a narrow toolbar (the deck's phone layout) must not overflow: the added buttons get narrower and lose their dividers */
    function fitToolbar() {
      var g = deckUi.group
      if (!g || !g.parentElement) return
      var row = g.parentElement
      g.removeAttribute('data-compact')
      if (row.scrollWidth > row.clientWidth + 1) g.setAttribute('data-compact', '')
    }
    window.addEventListener('resize', function () { setTimeout(fitToolbar, 50) })
    function openComments() {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {})
      if (ui.open && ui.tab === 'comments') return setOpen(false)
      if (ui.tab !== 'comments') $('.tabs button[data-tab="comments"]').click()
      if (!ui.open) setOpen(true)
    }

    /* the deck's slide grid ("Jump to a slide"): Skip / Delete and the slide's state on every card */
    function gridCards() {
      var out = []
      var cards = document.querySelectorAll('div[role="button"][tabindex="0"]')
      for (var i = 0; i < cards.length; i++) {
        var num = cards[i].querySelector(':scope > span > span.font-mono')
        if (num && /^\d{1,3}$/.test(num.textContent.trim())) out.push({ el: cards[i], num: num })
      }
      return out
    }
    var ST_LABEL = { visible: 'visible', skipped: 'skipped', deleted: 'deleted' }
    function syncGrid(d) {
      var cards = gridCards()
      var gridOpen = cards.length > 0 || !!document.querySelector('input[placeholder*="or number"]')
      var nav = root.querySelector('.topnav')
      if (nav) nav.classList.toggle('under-grid', gridOpen) /* the bar would cover the grid's search */
      cards.forEach(function (c) {
        var s = d.slides[parseInt(c.num.textContent, 10) - 1]
        if (!s) return
        var id = s.id
        var card = c.el
        var x = eff(id).status
        var dirty = !!(ui.local[id] && ui.local[id].status !== undefined)
        if (card.getAttribute('data-site-id') !== id) card.setAttribute('data-site-id', id)
        if (card.getAttribute('data-site-status') !== x) card.setAttribute('data-site-status', x)
        var pill = c.num.parentNode.querySelector('[data-site-st]')
        if (!pill) {
          pill = document.createElement('span')
          pill.setAttribute('data-site-st', '')
          c.num.parentNode.appendChild(pill)
        }
        var ptext = ST_LABEL[x] + (dirty ? ' · unsaved' : '')
        if (pill.textContent !== ptext) pill.textContent = ptext
        if (pill.getAttribute('data-st') !== x) pill.setAttribute('data-st', x)
        var row = card.querySelector(':scope > [data-site-ctl]')
        if (!row) {
          row = document.createElement('span')
          row.setAttribute('data-site-ctl', '')
          row.className = 'mt-2 flex items-center gap-1.5'
          row.innerHTML =
            '<button type="button" data-act="skip" class="rounded-pill border border-white/20 px-2 py-0.5 font-heading text-[11px] font-semibold text-white/85 transition-colors hover:bg-white/15"></button>' +
            '<button type="button" data-act="delete" class="rounded-pill border border-white/20 px-2 py-0.5 font-heading text-[11px] font-semibold text-white/85 transition-colors hover:border-danger/70 hover:bg-danger/25"></button>'
          row.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-act]')
            e.stopPropagation() /* a press on a control must not also jump to the slide */
            e.preventDefault()
            if (!btn) return
            var sid = card.getAttribute('data-site-id')
            var cur = eff(sid).status
            if (btn.getAttribute('data-act') === 'skip') setStatus(sid, cur === 'skipped' ? 'visible' : 'skipped')
            else setStatus(sid, cur === 'deleted' ? 'visible' : 'deleted')
          })
          /* Enter / Space press the control, not the card under it; every other key (Esc, arrows) still reaches the grid */
          row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
          })
          card.appendChild(row)
        }
        var sk = row.firstChild
        var dl = row.lastChild
        var skT = x === 'skipped' ? 'Unskip' : 'Skip'
        var dlT = x === 'deleted' ? 'Restore' : 'Delete'
        if (sk.textContent !== skT) {
          sk.textContent = skT
          sk.setAttribute('aria-label', x === 'skipped' ? 'Unskip this slide' : 'Skip this slide')
        }
        if (dl.textContent !== dlT) {
          dl.textContent = dlT
          dl.setAttribute('aria-label', x === 'deleted' ? 'Restore this slide' : 'Delete this slide')
        }
      })
    }

    function syncDeckUi(d, cid, oc, nc) {
      deckUi.mounted = mountToolbar()
      $('.tab-open').hidden = ui.open || deckUi.mounted
      badge.style.left = ui.open && !phone.matches ? '' : '50%'
      if (deckUi.mounted) {
        var B = deckUi.btn
        var cn = B.comments.querySelector('[data-site-n]')
        cn.hidden = !oc
        cn.textContent = oc ? String(oc) : ''
        var ct = oc ? 'Comments (' + oc + ' on this slide)' : 'Comments'
        if (B.comments.title !== ct) {
          B.comments.title = ct
          B.comments.setAttribute('aria-label', ct)
        }
        B.comments.toggleAttribute('data-on', ui.open && ui.tab === 'comments')
        B.undo.disabled = undoBtn.disabled
        B.redo.disabled = redoBtn.disabled
        var building = !!(ui.saving || ui.pending)
        B.save.disabled = saveBtn.disabled
        B.save.toggleAttribute('data-building', building)
        var lbl = B.save.querySelector('[data-site-lbl]')
        var lt = building ? 'Building…' : ''
        if (lbl.textContent !== lt) lbl.textContent = lt
        B.save.querySelector('[data-site-dot]').hidden = !(nc > 0 && !building)
        var st = saveBtn.textContent + (saveBtn.title ? ' · ' + saveBtn.title : '')
        if (B.save.title !== st) {
          B.save.title = st
          B.save.setAttribute('aria-label', st)
        }
      }
      syncGrid(d)
    }
    if (EDIT) applyTheme()

    /* --- auth gate (shared) --- */
    function showGate(why) {
      $('.gate').hidden = false
      $('.gwhy').textContent = why || 'Enter the editor password for ' + SITE.title + '.'
      $('.gerr').textContent = ''
      $('.gname').value = myName()
      setTimeout(function () { $('.gpw').focus() }, 30)
    }
    $('.gate-box').addEventListener('submit', function (e) {
      e.preventDefault()
      var pw = $('.gpw').value
      var name = $('.gname').value.trim()
      $('.gerr').textContent = 'Checking…'
      fetchJson(WORKER + '/api/auth', { method: 'POST', headers: { 'x-editor-password': pw } }, 10000)
        .then(function () {
          sset(LS.pw, pw, 'session')
          sset(LS.name, name || null, 'local')
          $('.gate').hidden = true
          $('.gpw').value = ''
          panel.classList.add('ready')
          lastCommentsSig = ''
          render()
        })
        .catch(function (err) {
          $('.gerr').textContent = err.status === 401 ? 'Wrong password.' : 'Could not reach the edit service (' + err.message + ').'
        })
    })
    $('.gcancel').addEventListener('click', function () {
      if (!EDIT) {
        $('.gate').hidden = true
        return
      }
      var p = new URLSearchParams(location.search)
      p.delete('edit')
      var q = p.toString()
      location.href = location.pathname + (q ? '?' + q : '') + location.hash
    })

    /* --- save (edit mode, slide status) --- */
    /* --- student download: the deck without the site layer, as one offline file --- */
    function toast(text, sticky) {
      toastEl.textContent = text
      toastEl.classList.add('on')
      clearTimeout(toast.t)
      if (!sticky) toast.t = setTimeout(function () { toastEl.classList.remove('on') }, 4500)
    }
    function doDownload() {
      var btns = [dlFab, $('.dl-h')]
      if (doDownload.busy) return
      if (!window.DeckStudent) return toast('Download is not available on this page yet. Reload and try again.')
      doDownload.busy = true
      btns.forEach(function (b) { b.disabled = true })
      toast('Preparing the student view…', true)
      var all = (ui.deck && ui.deck.all) || []
      var unsaved = EDIT ? changeCount() : 0
      var job = EDIT
        ? /* what this panel shows, unsaved changes included */
          window.DeckStudent.fromState(
            { hidden: all.map(function (s) { return s.id }).filter(function (id) { return eff(id).status !== 'visible' }), edits: SITE.textEdits || {} },
            { title: SITE.title }
          )
        : /* what every viewer sees right now, fetched fresh */
          window.DeckStudent.fromUrl(location.pathname, WORKER)
      job
        .then(function (r) {
          var shown = all.length ? all.length - r.hidden : 0
          toast(
            'Downloaded ' + r.name + (shown ? ' · ' + shown + ' slide' + (shown === 1 ? '' : 's') : '') +
              (unsaved ? ' · includes ' + unsaved + ' unsaved change' + (unsaved === 1 ? '' : 's') : '')
          )
        })
        .catch(function (err) {
          toast('Download failed: ' + ((err && err.message) || 'unknown error'))
        })
        .then(function () {
          doDownload.busy = false
          btns.forEach(function (b) { b.disabled = false })
        })
    }
    dlFab.addEventListener('click', doDownload)
    $('.dl-h').addEventListener('click', doDownload)

    function doSave() {
      if (ui.saving || ui.pending || !changeCount()) return
      ui.saving = true
      saveBtn.disabled = true
      saveBtn.textContent = 'Building…'
      var patches = JSON.parse(JSON.stringify(ui.local))
      fetchJson(
        WORKER + '/api/save',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-editor-password': password() || '' },
          body: JSON.stringify({ deck: DECK, patches: patches, editor: myName() }),
        },
        30000,
      )
        .then(function (r) {
          ui.saving = false
          var now = Date.now()
          for (var id in patches) {
            for (var f in patches[id]) {
              ui.rows.push({ slide: id, field: f, value: patches[id][f], sha: r.sha, updatedAt: now })
              if (ui.local[id] && ui.local[id][f] === patches[id][f]) delete ui.local[id][f]
            }
          }
          ui.base = mergeState(ui.baked, ui.rows)
          ui.undo = []
          ui.redo = []
          prune()
          persistDraft()
          if (r.noop || !r.sha) {
            flash('Nothing new to save: the repo already has these values.', 'ok')
          } else {
            ui.pending = { sha: r.sha, at: now }
            sset(LS.pending, JSON.stringify(ui.pending), 'local')
            flash('Saved as ' + r.sha.slice(0, 7) + '. Every viewer sees it now; rebuilding the site…', 'sticky')
            watchPending()
          }
          render()
        })
        .catch(function (err) {
          ui.saving = false
          if (err.status === 401) {
            sset(LS.pw, null, 'session')
            showGate('Password rejected, sign in again. Your changes are kept.')
          } else flash('Save failed: ' + err.message + '. Your changes are kept.', 'err')
          render()
        })
    }
    function watchPending() {
      if (!ui.pending || watchPending.on) return
      watchPending.on = true
      ;(function tick() {
        if (!ui.pending) {
          watchPending.on = false
          return
        }
        fetchJson(WORKER + '/api/status?sha=' + ui.pending.sha, {}, 15000)
          .then(function (s) {
            if (s.live) {
              ui.pending = null
              sset(LS.pending, null, 'local')
              watchPending.on = false
              flash('Live build now includes your save (' + s.sha.slice(0, 7) + ').', 'ok')
              refresh()
              render()
              return
            }
            setTimeout(tick, POLL_STATUS)
          })
          .catch(function () { setTimeout(tick, POLL_STATUS * 2) })
      })()
    }

    /* --- keep in step with other editors, comments and rebuilds --- */
    function refresh() {
      return Promise.all([fetchBaked(10000), fetchLive(10000)]).then(function (res) {
        var baked = res[0]
        var live = res[1]
        if (!baked && !live) return
        if (!EDIT && baked && baked.contentHash && boot.contentHash && baked.contentHash !== boot.contentHash) return reloadKeepingSlide()
        if (baked && baked.slides) ui.baked = baked.slides
        if (baked && baked.threads) ui.bakedThreads = baked.threads
        if (live && live.rows) ui.rows = live.rows
        ui.base = mergeState(ui.baked, ui.rows)
        ui.threads = mergeThreads(ui.bakedThreads, ui.rows)
        if (!EDIT && hiddenOf(ui.base).join('\n') !== boot.hiddenSig) return reloadKeepingSlide()
        prune()
        persistDraft()
        render()
      })
    }
    /* one poll loop; opening the comments (or switching tabs) re-arms it at the faster rate right away */
    var pollTimer = null
    function loop() {
      clearTimeout(pollTimer)
      var wait = ui.open && (!EDIT || ui.tab === 'comments') ? POLL_COMMENTS : EDIT ? POLL_EDIT : POLL_VIEW
      pollTimer = setTimeout(function () {
        ;(document.hidden ? Promise.resolve() : refresh().catch(function () {})).then(loop)
      }, wait)
    }
    function pollNow() {
      clearTimeout(pollTimer)
      refresh().catch(function () {}).then(loop)
    }
    loop()
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refresh()
    })

    /* --- go --- */
    setInterval(render, 150)
    window.addEventListener('hashchange', function () { setTimeout(render, 0) })
    if (EDIT) {
      if (ui.pending && Date.now() - ui.pending.at > 24 * 3600 * 1000) {
        ui.pending = null
        sset(LS.pending, null, 'local')
      }
      if (ui.pending) {
        flash('Waiting for the live build to include ' + ui.pending.sha.slice(0, 7) + '…', 'sticky')
        watchPending()
      }
      prune()
      if (changeCount()) flash('Restored ' + changeCount() + ' unsaved change(s) from this browser.', 'ok')
      if (password()) panel.classList.add('ready')
      else showGate('Enter the editor password to edit ' + SITE.title + '.')
    } else {
      panel.classList.add('ready')
    }
    setOpen(ui.open)
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(function () { return fallback() })
    return Promise.resolve(fallback())
    function fallback() {
      var a = document.createElement('textarea')
      a.value = t
      a.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(a)
      a.select()
      try { document.execCommand('copy') } catch (e) {}
      a.remove()
    }
  }

  /* light-DOM styles for the controls placed INSIDE the deck (edit mode only); colours come from the deck */
  var EDIT_LIGHT_CSS = [
    '[data-site-tb]{position:relative}',
    '[data-site-tb][data-on]{background:var(--deck-site-hover);color:var(--deck-site-ink)}',
    '[data-site-tb-group][data-compact] [data-site-tb]{width:36px!important;min-width:36px!important;padding:0!important}',
    '[data-site-tb-group][data-compact] [data-site-lbl]{display:none}',
    '[data-site-tb-group][data-compact]>span[aria-hidden]{display:none}',
    '[data-site-tb="save"]{min-width:32px;padding:0 8px;gap:6px}',
    '[data-site-tb="save"][data-building]{opacity:.8!important}',
    '[data-site-lbl]{font-size:11.5px;font-weight:600;line-height:1;white-space:nowrap}',
    '[data-site-lbl]:empty{display:none}',
    '[data-site-dot]{position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:var(--deck-site-brand);box-shadow:0 0 0 2px #fff}',
    '[data-site-n]{position:absolute;top:1px;right:0;min-width:14px;height:14px;padding:0 3px;border-radius:999px;background:var(--deck-site-brand);color:#fff;font-size:9.5px;font-weight:700;line-height:14px;text-align:center}',
    '[data-site-dot][hidden],[data-site-n][hidden]{display:none}',
    /* grid cards: the state pill in the kit's badge style, and the card dimmed like the kit's own skipped card */
    '[data-site-st]{border-radius:999px;padding:2px 6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}',
    '[data-site-st][data-st="skipped"]{background:var(--deck-site-warning);color:#0b1020}',
    '[data-site-st][data-st="deleted"]{background:var(--deck-site-danger);color:#fff}',
    '[data-site-status="skipped"]>span.block:first-child{opacity:.4}',
    '[data-site-status="deleted"]>span.block:first-child{opacity:.25;filter:grayscale(1)}',
    '[data-site-status="skipped"]>span.truncate,[data-site-status="deleted"]>span.truncate{text-decoration:line-through;color:rgba(255,255,255,.45)}',
    /* the kit classes may be missing from a deck stylesheet: the same values, spelled out */
    '[data-site-ctl]{display:flex;align-items:center;gap:6px;margin-top:8px}',
    '[data-site-ctl] button{border-radius:999px;border:1px solid rgba(255,255,255,.2);padding:2px 8px;font-family:var(--deck-site-heading);font-size:11px;font-weight:600;color:rgba(255,255,255,.85);background:transparent;cursor:pointer;transition:background-color .15s,border-color .15s}',
    '[data-site-ctl] button:hover{background:rgba(255,255,255,.15)}',
    '[data-site-ctl] button[data-act="delete"]:hover{border-color:var(--deck-site-danger);background:rgba(239,68,68,.25)}',
  ].join('\n')

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    /* the panel is docked: it owns a strip of the window and the deck is resized beside it */
    '.panel{pointer-events:auto;position:fixed;top:0;right:0;bottom:0;width:' + DOCK_W + 'px;display:flex;flex-direction:column;gap:10px;',
    'background:#fff;color:#111827;border-left:1px solid #e5e7eb;box-shadow:-8px 0 24px rgba(15,23,42,.12);padding:14px;font-size:13px;transition:transform .2s ease}',
    '.panel:not(.ready){opacity:.35;pointer-events:none}',
    '.panel.hide{transform:translateX(100%);box-shadow:none;pointer-events:none;visibility:hidden}',
    '.topnav{pointer-events:auto;position:fixed;left:12px;top:12px;display:flex;align-items:center;gap:2px;padding:4px;border-radius:12px;',
    'background:rgba(17,24,39,.62);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.22);',
    'color:#fff;font-size:13px;transition:opacity .35s ease,transform .35s ease}',
    '.topnav.idle{opacity:0;transform:translateY(-6px);pointer-events:none}',
    '.tn-btn{display:inline-flex;align-items:center;gap:6px;height:32px;min-width:32px;justify-content:center;padding:0 8px;border-radius:8px;border:0;background:transparent;color:#fff;',
    'text-decoration:none;font:inherit;font-weight:600;cursor:pointer;white-space:nowrap}',
    '.tn-btn:hover{background:rgba(255,255,255,.14)}',
    '.tn-btn.off{opacity:.3;cursor:default}.tn-btn.off:hover{background:transparent}',
    '.tn-btn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.tn-cur svg{width:15px;height:15px;opacity:.8}',
    '.tn-sep{width:1px;height:20px;background:rgba(255,255,255,.22);margin:0 4px}',
    '.tn-menu{position:absolute;left:0;top:calc(100% + 8px);min-width:300px;max-width:min(380px,calc(100vw - 24px));max-height:min(70vh,520px);overflow:auto;',
    'background:#fff;color:#111827;border-radius:12px;padding:6px;box-shadow:0 18px 50px rgba(0,0,0,.3);border:1px solid #e5e7eb}',
    '.tn-h{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;padding:8px 10px 6px}',
    '.tn-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;color:inherit;text-decoration:none;font-weight:500;line-height:1.3}',
    '.tn-item:hover{background:#f3f4f6}',
    '.tn-item.here{background:#eaf0ff;color:#1d4ed8;font-weight:700}',
    '.tn-num{width:26px;height:26px;border-radius:7px;flex:none;display:grid;place-items:center;background:#f1f3f8;color:#2d63fb;font-weight:800;font-size:12px}',
    '.tn-item.here .tn-num{background:#2d63fb;color:#fff}',
    '.tn-btn:focus-visible,.tn-item:focus-visible{outline:2px solid #8fb0ff;outline-offset:1px}',
    '@media (max-width:560px){.tn-home span{display:none}.tn-cur-t{max-width:120px;overflow:hidden;text-overflow:ellipsis}}',
    /* phones: the deck's control bar fills the bottom edge, so the round buttons sit top-right beside the navigation */
    '@media (max-width:760px){.fabs{top:12px;bottom:auto;right:12px}.toast{bottom:auto;top:64px}}',
    'header{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.hbtns{display:flex;align-items:center;gap:4px;flex:none}',
    '.dl-h{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;font-weight:600}',
    '.dl-h svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.toast{pointer-events:none;position:fixed;left:16px;bottom:68px;max-width:calc(100vw - 32px);background:#111827;color:#fff;padding:8px 14px;border-radius:10px;font-size:13px;',
    'box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:0;transform:translateY(6px);transition:opacity .2s,transform .2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.toast.on{opacity:1;transform:none}',
    '.ttl{display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.pill{align-self:flex-start;background:#2d63fb;color:#fff;font-weight:700;font-size:11px;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px}',
    '.deck{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#111827;padding:6px 10px}',
    'button:disabled{opacity:.45;cursor:not-allowed}',
    'button:focus-visible,textarea:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #2d63fb;outline-offset:1px}',
    '.icon{border:none;background:transparent;font-size:16px;padding:4px 8px;color:#6b7280}',
    '.cur{display:flex;flex-direction:column;gap:7px;border:1px solid #eef0f3;border-radius:10px;padding:10px;background:#f9fafb}',
    '.cur-h{display:flex;justify-content:space-between;gap:8px;font-weight:700}',
    '.cur-id{font-family:ui-monospace,Menlo,monospace;font-weight:500;color:#6b7280;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%}',
    '.cur-label{color:#4b5563;min-height:1em}',
    '.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
    '.seg button.on[data-status=visible]{background:#ecfdf5;border-color:#10b981;color:#065f46;font-weight:700}',
    '.seg button.on[data-status=skipped]{background:#fffbeb;border-color:#f59e0b;color:#92400e;font-weight:700}',
    '.seg button.on[data-status=deleted]{background:#fef2f2;border-color:#ef4444;color:#991b1b;font-weight:700}',
    '.seg button.dirty{box-shadow:0 0 0 2px rgba(45,99,251,.35)}',
    'textarea{width:100%;resize:vertical;min-height:54px;border:1px solid #d1d5db;border-radius:8px;padding:7px;font-size:13px;color:#111827;background:#fff;line-height:1.4}',
    '.row{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.hint{color:#6b7280;font-family:ui-monospace,Menlo,monospace;font-size:11px}',
    '.tools{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:6px}',
    '.primary{background:#2d63fb;border-color:#2d63fb;color:#fff;font-weight:700}',
    '.primary:disabled{background:#93a9e8;border-color:#93a9e8;opacity:1}',
    '.wide{width:100%}',
    '.msg{min-height:16px;font-size:12px;color:#374151}.msg:empty{display:none}.msg.ok{color:#047857}.msg.err{color:#b91c1c}.msg.sticky{color:#1d4ed8}',
    '.tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:10px;padding:3px;gap:3px;background:#f3f4f6}',
    '.tabs button{border:none;background:transparent;font-weight:600;color:#4b5563;padding:6px}',
    '.tabs button.on{background:#fff;color:#111827;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
    '.comments{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}',
    '.threads{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px}',
    '.thread{border:1px solid #e5e7eb;border-radius:10px;padding:9px 10px;display:flex;flex-direction:column;gap:6px;background:#fff}',
    '.thread.resolved{background:#f9fafb;opacity:.75}',
    '.reply{border-top:1px solid #f3f4f6;padding-top:6px;margin-left:10px}',
    '.m-h{display:flex;align-items:center;gap:6px;min-width:0}',
    '.avatar{width:22px;height:22px;border-radius:50%;background:#e0e7ff;color:#3730a3;display:grid;place-items:center;font-weight:700;font-size:11px;flex:none}',
    '.who{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.when{color:#6b7280;font-size:11px;white-space:nowrap}',
    '.m-tools{margin-left:auto;display:flex;gap:2px}',
    '.text{white-space:pre-wrap;word-wrap:break-word;color:#1f2937;line-height:1.45}',
    '.link{border:none;background:none;padding:2px 4px;color:#2d63fb;font-weight:600;font-size:12px}',
    '.link.danger{color:#b91c1c}',
    '.m-tools .link{color:#6b7280;font-weight:500;font-size:11px}',
    '.t-actions{display:flex;gap:6px}',
    '.reply-box{display:flex;flex-direction:column;gap:6px}',
    '.empty{color:#6b7280;margin:6px 2px}',
    '.resolved-toggle{display:flex;align-items:center;gap:6px;color:#4b5563;font-size:12px}',
    '.composer{display:flex;flex-direction:column;gap:6px;border-top:1px solid #eef0f3;padding-top:8px}',
    '.as{color:#6b7280;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.list-wrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px}',
    '.list-h{display:flex;justify-content:space-between;align-items:center;font-weight:700}',
    'select{font:inherit;border:1px solid #d1d5db;border-radius:6px;padding:3px 6px;background:#fff;color:#111827}',
    '.list{list-style:none;margin:0;padding:0;overflow:auto;flex:1;border:1px solid #eef0f3;border-radius:10px}',
    '.list li{display:flex;align-items:center;gap:8px;padding:6px 9px;border-bottom:1px solid #f3f4f6;cursor:pointer}',
    '.list li:hover{background:#f3f4f6}',
    '.list li.here{background:#eef2ff;box-shadow:inset 3px 0 0 #2d63fb}',
    '.list li.deleted .nm{text-decoration:line-through;color:#9ca3af}',
    '.list li.skipped .nm{color:#92400e}',
    '.list li.empty{color:#9ca3af;cursor:default}',
    '.n{width:24px;text-align:right;color:#9ca3af;font-variant-numeric:tabular-nums;font-size:11px}',
    '.nm{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.st{font-size:10px;font-weight:800;padding:1px 5px;border-radius:4px;background:#fee2e2;color:#991b1b}',
    '.skipped .st{background:#fef3c7;color:#92400e}',
    '.cm{font-size:11px;color:#4b5563}',
    '.dot{width:8px;height:8px;border-radius:50%;background:#2d63fb;flex:none}',
    '.tab-open{pointer-events:auto;position:fixed;right:12px;top:12px;background:#2d63fb;color:#fff;border:none;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.25)}',
    '.fabs{pointer-events:none;position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;align-items:flex-end}',
    '.fab{pointer-events:auto;height:40px;min-width:40px;padding:0 11px;border-radius:999px;border:1px solid rgba(255,255,255,.25);',
    'background:rgba(17,24,39,.55);color:#fff;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;backdrop-filter:blur(6px);opacity:.75;transition:opacity .15s}',
    '.fab:hover,.fab.has{opacity:1}.fab.has{background:#2d63fb;border-color:#2d63fb}',
    '.fab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}',
    '.fab[hidden]{display:none}.fab:disabled{opacity:.5;cursor:progress}',
    '.fab-n:empty{display:none}',
    '.badge{pointer-events:none;position:fixed;top:12px;left:calc((100% - ' + DOCK_W + 'px) / 2);transform:translateX(-50%);max-width:min(560px,calc(100vw - ' + (DOCK_W + 40) + 'px));padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;',
    'color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 18px rgba(0,0,0,.25)}',
    '.badge.deleted{background:rgba(185,28,28,.92)}.badge.skipped{background:rgba(180,83,9,.92)}',
    /* EDIT MODE: the panel wears the deck toolbar's look (translucent white, blur, the deck's ring, fonts and colours) */
    '.panel.edit{top:12px;right:12px;bottom:12px;width:' + (DOCK_W - 24) + 'px;border-radius:22px;border:1px solid var(--d-line);background:rgba(255,255,255,.85);',
    'backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);box-shadow:0 12px 36px rgba(15,23,42,.16);color:var(--d-ink);transition:transform .2s ease-out,opacity .2s ease-out}',
    '.panel.edit,.panel.edit *{font-family:var(--d-font)}',
    '.panel.edit .deck,.panel.edit .cur-h,.panel.edit .tabs button,.panel.edit .list-h,.panel.edit .who{font-family:var(--d-heading)}',
    '.panel.edit .cur-id,.panel.edit .hint{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
    '.panel.edit.hide{transform:translateX(calc(100% + 24px));opacity:0}',
    '.panel.edit .pill{background:var(--d-brand)}',
    '.panel.edit button{border-radius:999px;transition:background-color .15s,color .15s,border-color .15s}',
    '.panel.edit button:not(.primary):not(.icon):not(.link){border-color:var(--d-line);background:rgba(255,255,255,.7);color:var(--d-ink)}',
    '.panel.edit button:not(.primary):not(.icon):not(.link):hover:not(:disabled){background:var(--d-hover)}',
    '.panel.edit .icon{color:var(--d-muted);border-radius:999px}.panel.edit .icon:hover{background:var(--d-hover);color:var(--d-ink)}',
    '.panel.edit .primary{background:var(--d-brand);border-color:var(--d-brand);color:#fff}',
    '.panel.edit .primary:disabled{opacity:.45}',
    '.panel.edit .cur{border-color:var(--d-line);border-radius:16px;background:rgba(255,255,255,.6)}',
    '.panel.edit .cur-label,.panel.edit .hint,.panel.edit .when,.panel.edit .as,.panel.edit .empty,.panel.edit .resolved-toggle,.panel.edit .cur-id{color:var(--d-muted)}',
    '.panel.edit .tabs{border-color:var(--d-line);border-radius:999px;background:var(--d-hover)}',
    '.panel.edit .tabs button:not(.primary):not(.icon):not(.link){border:none;background:transparent;color:var(--d-muted)}',
    '.panel.edit .tabs button.on:not(.primary):not(.icon):not(.link){background:#fff;color:var(--d-ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}',
    /* the slide's status keeps its meaning colours (same as before) */
    '.panel.edit .seg button.on[data-status=visible]:not(.primary){background:#ecfdf5;border-color:#10b981;color:#065f46;font-weight:700}',
    '.panel.edit .seg button.on[data-status=skipped]:not(.primary){background:#fffbeb;border-color:#f59e0b;color:#92400e;font-weight:700}',
    '.panel.edit .seg button.on[data-status=deleted]:not(.primary){background:#fef2f2;border-color:#ef4444;color:#991b1b;font-weight:700}',
    '.panel.edit .thread,.panel.edit .list{border-color:var(--d-line);border-radius:14px;background:rgba(255,255,255,.7)}',
    '.panel.edit textarea,.panel.edit select{border-color:var(--d-line);border-radius:12px;background:rgba(255,255,255,.8);color:var(--d-ink)}',
    '.panel.edit .composer{border-top-color:var(--d-line)}',
    '.panel.edit .link{color:var(--d-brand)}.panel.edit .m-tools .link{color:var(--d-muted)}',
    '.panel.edit .msg.sticky{color:var(--d-brand)}',
    '.panel.edit .list li{border-bottom-color:var(--d-line)}.panel.edit .list li:hover{background:var(--d-hover)}',
    '.panel.edit .list li.here{background:var(--d-hover);box-shadow:inset 3px 0 0 var(--d-brand)}',
    '.panel.edit .dot{background:var(--d-brand)}',
    '.panel.edit .avatar{background:var(--d-hover);color:var(--d-ink)}',
    '.topnav.under-grid{display:none}',
    '.gate{pointer-events:auto;position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}',
    '.gate-box{background:#fff;color:#111827;border-radius:14px;padding:20px;width:min(380px,100%);display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.35)}',
    '.gate-box h2{margin:0;font-size:18px}.gate-box p{margin:0;color:#4b5563;font-size:13px}',
    '.gate-box input{font:inherit;font-size:14px;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px}',
    '.gerr{min-height:16px;color:#b91c1c;font-size:12px}',
    '[hidden]{display:none!important}',
    /* phone: the panel docks along the bottom and the deck takes the top half */
    '@media (max-width:760px){.panel{top:auto;left:0;width:auto;height:48dvh;border-left:none;border-top:1px solid #e5e7eb;box-shadow:0 -8px 24px rgba(15,23,42,.12)}',
    '.panel.hide{transform:translateY(100%)}.badge{left:50%;max-width:calc(100vw - 24px)}',
    '.panel.edit{top:auto;left:8px;right:8px;bottom:8px;width:auto;height:calc(48dvh - 8px);border-radius:20px;border:1px solid var(--d-line)}',
    '.panel.edit.hide{transform:translateY(calc(100% + 16px))}}',
  ].join('\n')
})()
