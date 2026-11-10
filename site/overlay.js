/*
 * Deck site overlay: loaded at the top of every published deck.
 *
 * VIEWER: merges the edits baked into the build (state.json) with the Worker's
 * temporary layer (saved but not yet rebuilt), hands the result to the deck as
 * window.__DECK_STATE__ (the deck's own read-only "student" view), then boots
 * the deck's held-back module. Polls for changes and reloads in place when the
 * set of visible slides changes. `#slide-N` opens slide N.
 *
 * EDITOR (?edit=1): password gate, then a side panel to skip / delete / comment
 * on slides with undo/redo. Changes stay in this browser until Save.
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
  var POLL_STATUS = 5000
  var LS = {
    draft: 'deck-editor:draft:' + DECK,
    pending: 'deck-editor:pending:' + DECK,
    name: 'deck-editor:name',
    pw: 'deck-editor:pw',
    goto: 'deck-site:goto:' + DECK,
    reloads: 'deck-site:reloads:' + DECK,
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

  /* ------------------------------------------------------------ state model */

  /** baked slides + live rows -> { id: { status, comment } } (only non-default fields) */
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
      .slice()
      .sort(function (a, b) { return (a.updatedAt || 0) - (b.updatedAt || 0) })
      .forEach(function (r) {
        var s = (out[r.slide] = out[r.slide] || {})
        s[r.field] = r.value
      })
    return out
  }
  function statusOf(st, id) {
    return (st[id] && st[id].status) || 'visible'
  }
  function commentOf(st, id) {
    return (st[id] && st[id].comment) || ''
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
  /** Go to a slide by its number in the deck's ACTIVE list. */
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

  Promise.all([fetchBaked(BOOT_TIMEOUT), fetchLive(BOOT_TIMEOUT)]).then(function (res) {
    var baked = res[0]
    var live = res[1]
    var bakedSlides = baked && baked.slides ? baked.slides : SITE.slides
    if (baked && baked.sha) boot.bakedSha = baked.sha
    boot.contentHash = baked && baked.contentHash ? baked.contentHash : null
    boot.baked = bakedSlides
    boot.rows = (live && live.rows) || []
    boot.state = mergeState(bakedSlides, boot.rows)
    var hidden = hiddenOf(boot.state)
    boot.hiddenSig = hidden.join('\n')
    window.__DECK_STATE__ = { view: 'student', hidden: EDIT ? [] : hidden, edits: SITE.textEdits || {} }
    return domReady().then(function () {
      startDeck()
      return whenDeck()
    })
  }).then(function (d) {
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
    if (EDIT) startEditor(d)
    else startViewerPolling()
  })

  /* ------------------------------------------------------------ viewer: live updates */

  function reloadKeepingSlide() {
    var log = jget(LS.reloads, 'session', []).filter(function (t) { return Date.now() - t < 60000 })
    if (log.length >= 3) return /* never loop */
    log.push(Date.now())
    sset(LS.reloads, JSON.stringify(log), 'session')
    var id = currentId()
    if (id) sset(LS.goto, id, 'session')
    location.replace(location.pathname + location.search)
  }

  function startViewerPolling() {
    function poll() {
      if (document.hidden) return
      Promise.all([fetchBaked(8000), fetchLive(8000)]).then(function (res) {
        var baked = res[0]
        var live = res[1]
        if (!baked && !live) return
        /* the deck itself was re-published with new content: take it */
        if (baked && baked.contentHash && boot.contentHash && baked.contentHash !== boot.contentHash) return reloadKeepingSlide()
        var st = mergeState(baked && baked.slides ? baked.slides : boot.baked, live ? live.rows : boot.rows)
        if (hiddenOf(st).join('\n') !== boot.hiddenSig) reloadKeepingSlide()
      })
    }
    setInterval(poll, POLL_VIEW)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) poll()
    })
  }

  /* ------------------------------------------------------------ editor */

  function startEditor(deck) {
    var ed = {
      deck: deck,
      base: boot.state,
      baked: boot.baked,
      rows: boot.rows,
      local: jget(LS.draft, 'local', {}) || {},
      undo: [],
      redo: [],
      pending: jget(LS.pending, 'local', null),
      saving: false,
      current: null,
      collapsed: false,
      filter: 'all',
      msg: '',
      msgKind: '',
      commentSnap: false,
    }

    /* --- shadow DOM UI, isolated from the deck's styles --- */
    var host = document.createElement('div')
    host.id = 'deck-editor-host'
    host.setAttribute('data-edit-layer', '')
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;'
    document.body.appendChild(host)
    var root = host.attachShadow({ mode: 'open' })
    root.innerHTML =
      '<style>' + EDITOR_CSS + '</style>' +
      '<div class="badge" hidden></div>' +
      '<aside class="panel" part="panel">' +
      '  <header><div class="ttl"><span class="pill">Edit mode</span><span class="deck"></span></div>' +
      '    <button class="icon collapse" title="Collapse panel">⟩</button></header>' +
      '  <section class="cur">' +
      '    <div class="cur-h"><span class="cur-n"></span><span class="cur-id"></span></div>' +
      '    <div class="cur-label"></div>' +
      '    <div class="seg" role="group" aria-label="Slide status">' +
      '      <button data-status="visible">Visible</button><button data-status="skipped">Skip</button><button data-status="deleted">Delete</button>' +
      '    </div>' +
      '    <label class="lbl" for="cmt">Comment</label>' +
      '    <textarea id="cmt" rows="3" placeholder="Note for this slide (visible to editors)"></textarea>' +
      '    <div class="row"><button class="ghost copy-slide">Copy slide link</button><span class="hint"></span></div>' +
      '  </section>' +
      '  <section class="tools">' +
      '    <button class="ghost undo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="ghost redo" title="Redo (Ctrl+Shift+Z)">↷ Redo</button>' +
      '    <button class="primary save">Save</button>' +
      '  </section>' +
      '  <div class="msg" role="status" aria-live="polite"></div>' +
      '  <section class="list-wrap">' +
      '    <div class="list-h"><span>Slides</span><select class="filter"><option value="all">All</option><option value="changed">Unsaved changes</option><option value="hidden">Skipped / deleted</option><option value="comment">With comments</option></select></div>' +
      '    <ol class="list"></ol>' +
      '  </section>' +
      '</aside>' +
      '<button class="tab" hidden title="Open edit panel">✎ Edit</button>' +
      '<div class="gate" hidden><form class="gate-box"><h2>Editor sign-in</h2><p>Enter the editor password to edit <b class="gdeck"></b>.</p>' +
      '<input type="password" class="gpw" autocomplete="current-password" placeholder="Editor password" required>' +
      '<input type="text" class="gname" autocomplete="nickname" placeholder="Your name (shown in commit messages)" maxlength="60">' +
      '<div class="gerr"></div><div class="row"><a class="ghost exit" href="#">View only</a><button class="primary" type="submit">Unlock</button></div></form></div>'

    var $ = function (sel) { return root.querySelector(sel) }
    var panel = $('.panel')
    var badge = $('.badge')
    var tab = $('.tab')
    var ta = $('#cmt')
    var saveBtn = $('.save')
    var undoBtn = $('.undo')
    var redoBtn = $('.redo')
    var list = $('.list')
    var msgEl = $('.msg')
    $('.deck').textContent = SITE.title
    $('.gdeck').textContent = SITE.title

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
        if (mod && !isField(e) && (k === 'z' || k === 'y')) {
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

    /* --- model --- */
    function eff(id) {
      var l = ed.local[id] || {}
      return {
        status: l.status !== undefined ? l.status : statusOf(ed.base, id),
        comment: l.comment !== undefined ? l.comment : commentOf(ed.base, id),
      }
    }
    function prune() {
      for (var id in ed.local) {
        var l = ed.local[id]
        if (l.status !== undefined && l.status === statusOf(ed.base, id)) delete l.status
        if (l.comment !== undefined && l.comment === commentOf(ed.base, id)) delete l.comment
        if (l.status === undefined && l.comment === undefined) delete ed.local[id]
      }
    }
    function changeCount() {
      var n = 0
      for (var id in ed.local) n += Object.keys(ed.local[id]).length
      return n
    }
    function persistDraft() {
      sset(LS.draft, changeCount() ? JSON.stringify(ed.local) : null, 'local')
    }
    function snapshot() {
      return JSON.stringify(ed.local)
    }
    function mutate(fn, opts) {
      if (!opts || !opts.noHistory) {
        ed.undo.push(snapshot())
        if (ed.undo.length > 200) ed.undo.shift()
        ed.redo = []
      }
      fn()
      prune()
      persistDraft()
      render()
    }
    function doUndo() {
      if (!ed.undo.length) return
      ed.redo.push(snapshot())
      ed.local = JSON.parse(ed.undo.pop())
      ed.commentSnap = false
      prune()
      persistDraft()
      render(true)
    }
    function doRedo() {
      if (!ed.redo.length) return
      ed.undo.push(snapshot())
      ed.local = JSON.parse(ed.redo.pop())
      ed.commentSnap = false
      prune()
      persistDraft()
      render(true)
    }
    function setStatus(id, status) {
      mutate(function () {
        ;(ed.local[id] = ed.local[id] || {}).status = status
      })
    }

    /* viewer numbering of a slide (what #slide-N means), or null if hidden */
    function viewerNumber(id) {
      var n = 0
      for (var i = 0; i < ed.deck.all.length; i++) {
        var s = ed.deck.all[i]
        if (statusOf(ed.base, s.id) === 'visible') n++
        if (s.id === id) return statusOf(ed.base, s.id) === 'visible' ? n : null
      }
      return null
    }

    function flash(text, kind) {
      ed.msg = text
      ed.msgKind = kind || ''
      msgEl.textContent = text
      msgEl.className = 'msg ' + (kind || '')
      clearTimeout(flash.t)
      if (kind !== 'sticky') flash.t = setTimeout(function () { msgEl.textContent = ''; msgEl.className = 'msg' }, 6000)
    }

    /* --- render --- */
    var lastListSig = ''
    function render(forceComment) {
      var d = deckApi() || ed.deck
      ed.deck = d
      var cid = currentId()
      var cur = null
      for (var i = 0; i < d.all.length; i++) if (d.all[i].id === cid) cur = d.all[i]
      var e = cid ? eff(cid) : { status: 'visible', comment: '' }
      $('.cur-n').textContent = cur ? 'Slide ' + cur.n + ' / ' + d.all.length : ''
      $('.cur-id').textContent = cid || ''
      $('.cur-label').textContent = cur ? cur.label || cur.section || '' : ''
      root.querySelectorAll('.seg button').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-status') === e.status)
        var dirty = cid && ed.local[cid] && ed.local[cid].status !== undefined
        b.classList.toggle('dirty', !!dirty && b.getAttribute('data-status') === e.status)
      })
      if (forceComment || root.activeElement !== ta || ed.current !== cid) {
        ta.value = e.comment
        if (ed.current !== cid) ed.commentSnap = false
      }
      ta.setAttribute('data-slide', cid || '')
      ta.classList.toggle('dirty', !!(cid && ed.local[cid] && ed.local[cid].comment !== undefined))
      var vn = cid ? viewerNumber(cid) : null
      $('.copy-slide').disabled = !vn
      $('.hint').textContent = vn ? '#slide-' + vn : 'hidden from viewers'
      if (e.status !== 'visible' || e.comment) {
        badge.hidden = false
        badge.className = 'badge ' + e.status
        badge.textContent =
          (e.status === 'deleted' ? 'Deleted · hidden from viewers' : e.status === 'skipped' ? 'Skipped · hidden from viewers' : '') +
          (e.comment ? (e.status !== 'visible' ? '  ·  ' : '') + '💬 ' + (e.comment.length > 80 ? e.comment.slice(0, 80) + '…' : e.comment) : '')
      } else badge.hidden = true
      ed.current = cid

      var n = changeCount()
      undoBtn.disabled = !ed.undo.length
      redoBtn.disabled = !ed.redo.length
      if (ed.saving || ed.pending) {
        saveBtn.disabled = true
        saveBtn.textContent = ed.saving ? 'Building…' : 'Building…'
        saveBtn.title = ed.pending ? 'Waiting for the live build to include commit ' + ed.pending.sha.slice(0, 7) : ''
      } else {
        saveBtn.disabled = n === 0
        saveBtn.textContent = n ? 'Save (' + n + ')' : 'Save'
        saveBtn.title = n ? 'Commit your changes and publish them to every viewer' : 'No unsaved changes'
      }

      /* the slide list, only rebuilt when something in it changed */
      var sig = JSON.stringify([d.all.length, cid, ed.filter, ed.local, ed.base])
      if (sig === lastListSig) return
      lastListSig = sig
      var html = ''
      d.all.forEach(function (s) {
        var x = eff(s.id)
        var dirty = !!ed.local[s.id]
        if (ed.filter === 'changed' && !dirty) return
        if (ed.filter === 'hidden' && x.status === 'visible') return
        if (ed.filter === 'comment' && !x.comment) return
        html +=
          '<li data-id="' + esc(s.id) + '" class="' + (s.id === cid ? 'here ' : '') + x.status + (dirty ? ' dirty' : '') + '">' +
          '<span class="n">' + s.n + '</span><span class="nm">' + esc(s.label || s.id) + '</span>' +
          (x.status !== 'visible' ? '<span class="st">' + (x.status === 'deleted' ? 'DEL' : 'SKIP') + '</span>' : '') +
          (x.comment ? '<span class="cm" title="' + esc(x.comment) + '">💬</span>' : '') +
          (dirty ? '<span class="dot" title="Unsaved change"></span>' : '') +
          '</li>'
      })
      list.innerHTML = html || '<li class="empty">Nothing here</li>'
      var curLi = list.querySelector('li.here')
      if (curLi && curLi.scrollIntoView && !render.userScrolled) curLi.scrollIntoView({ block: 'nearest' })
    }
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] })
    }

    /* --- events --- */
    root.querySelectorAll('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = currentId()
        if (id) setStatus(id, b.getAttribute('data-status'))
      })
    })
    ta.addEventListener('focus', function () { ed.commentSnap = false })
    ta.addEventListener('input', function () {
      /* the slide whose comment the box is showing, never whatever slide is on screen right now */
      var id = ta.getAttribute('data-slide')
      if (!id) return
      /* one undo step per stretch of typing */
      mutate(
        function () {
          ;(ed.local[id] = ed.local[id] || {}).comment = ta.value
        },
        { noHistory: ed.commentSnap },
      )
      ed.commentSnap = true
    })
    ta.addEventListener('blur', function () { ed.commentSnap = false })
    undoBtn.addEventListener('click', doUndo)
    redoBtn.addEventListener('click', doRedo)
    saveBtn.addEventListener('click', doSave)
    $('.filter').addEventListener('change', function (e) {
      ed.filter = e.target.value
      render()
    })
    list.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-id]')
      if (li) gotoId(li.getAttribute('data-id'))
    })
    $('.copy-slide').addEventListener('click', function () {
      var id = currentId()
      var vn = id && viewerNumber(id)
      if (!vn) return
      var url = location.origin + location.pathname + '#slide-' + vn
      copyText(url).then(function () { flash('Copied ' + url, 'ok') })
    })
    $('.collapse').addEventListener('click', function () {
      ed.collapsed = true
      panel.classList.add('hide')
      tab.hidden = false
    })
    tab.addEventListener('click', function () {
      ed.collapsed = false
      panel.classList.remove('hide')
      tab.hidden = true
    })

    /* --- auth gate --- */
    function password() {
      return sget(LS.pw, 'session')
    }
    function showGate(err) {
      var g = $('.gate')
      g.hidden = false
      $('.gerr').textContent = err || ''
      $('.gname').value = sget(LS.name, 'local') || ''
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
          panel.classList.add('ready')
          render()
        })
        .catch(function (err) {
          $('.gerr').textContent = err.status === 401 ? 'Wrong password.' : 'Could not reach the edit service (' + err.message + ').'
        })
    })
    $('.exit').addEventListener('click', function (e) {
      e.preventDefault()
      var p = new URLSearchParams(location.search)
      p.delete('edit')
      var q = p.toString()
      location.href = location.pathname + (q ? '?' + q : '') + location.hash
    })

    /* --- save --- */
    function doSave() {
      if (ed.saving || ed.pending || !changeCount()) return
      ed.saving = true
      saveBtn.disabled = true
      saveBtn.textContent = 'Building…'
      var patches = JSON.parse(JSON.stringify(ed.local))
      fetchJson(
        WORKER + '/api/save',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-editor-password': password() || '' },
          body: JSON.stringify({ deck: DECK, patches: patches, editor: sget(LS.name, 'local') || '' }),
        },
        30000,
      )
        .then(function (r) {
          ed.saving = false
          /* what was saved becomes the base; anything typed since stays local */
          var now = Date.now()
          for (var id in patches) {
            for (var f in patches[id]) {
              ed.rows.push({ slide: id, field: f, value: patches[id][f], sha: r.sha, updatedAt: now })
              if (ed.local[id] && ed.local[id][f] === patches[id][f]) delete ed.local[id][f]
            }
          }
          ed.base = mergeState(ed.baked, ed.rows)
          ed.undo = []
          ed.redo = []
          prune()
          persistDraft()
          if (r.noop || !r.sha) {
            flash('Nothing new to save: the repo already has these values.', 'ok')
          } else {
            ed.pending = { sha: r.sha, at: now }
            sset(LS.pending, JSON.stringify(ed.pending), 'local')
            flash('Saved as ' + r.sha.slice(0, 7) + '. Every viewer sees it now; rebuilding the site…', 'sticky')
            watchPending()
          }
          render(true)
        })
        .catch(function (err) {
          ed.saving = false
          if (err.status === 401) {
            sset(LS.pw, null, 'session')
            showGate('Password rejected, sign in again. Your changes are kept.')
          } else flash('Save failed: ' + err.message + '. Your changes are kept.', 'err')
          render()
        })
    }

    function watchPending() {
      if (!ed.pending || watchPending.on) return
      watchPending.on = true
      ;(function tick() {
        if (!ed.pending) {
          watchPending.on = false
          return
        }
        fetchJson(WORKER + '/api/status?sha=' + ed.pending.sha, {}, 15000)
          .then(function (s) {
            if (s.live) {
              ed.pending = null
              sset(LS.pending, null, 'local')
              watchPending.on = false
              flash('Live build now includes your save (' + s.sha.slice(0, 7) + ').', 'ok')
              refresh()
              render()
              return
            }
            setTimeout(tick, POLL_STATUS)
          })
          .catch(function () {
            setTimeout(tick, POLL_STATUS * 2)
          })
      })()
    }

    /* --- keep the base in step with other editors and with rebuilds --- */
    function refresh() {
      return Promise.all([fetchBaked(10000), fetchLive(10000)]).then(function (res) {
        if (res[0] && res[0].slides) ed.baked = res[0].slides
        if (res[1] && res[1].rows) ed.rows = res[1].rows
        if (!res[0] && !res[1]) return
        ed.base = mergeState(ed.baked, ed.rows)
        prune()
        persistDraft()
        render()
      })
    }

    /* --- go --- */
    setInterval(render, 120)
    window.addEventListener('hashchange', function () { setTimeout(render, 0) })
    setInterval(function () { if (!document.hidden) refresh() }, POLL_EDIT)
    list.addEventListener('scroll', function () {
      render.userScrolled = true
      clearTimeout(render.st)
      render.st = setTimeout(function () { render.userScrolled = false }, 2500)
    })
    if (ed.pending && Date.now() - ed.pending.at > 24 * 3600 * 1000) {
      ed.pending = null
      sset(LS.pending, null, 'local')
    }
    if (ed.pending) {
      flash('Waiting for the live build to include ' + ed.pending.sha.slice(0, 7) + '…', 'sticky')
      watchPending()
    }
    prune()
    if (changeCount()) flash('Restored ' + changeCount() + ' unsaved change(s) from this browser.', 'ok')
    render()
    if (password()) panel.classList.add('ready')
    else showGate()
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

  var EDITOR_CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.panel{pointer-events:auto;position:fixed;top:12px;right:12px;bottom:12px;width:340px;max-width:calc(100vw - 24px);display:flex;flex-direction:column;gap:10px;',
    'background:rgba(255,255,255,.97);color:#111827;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 18px 50px rgba(15,23,42,.28);padding:14px;font-size:13px;transition:transform .2s ease,opacity .2s ease}',
    '.panel:not(.ready){opacity:.35;pointer-events:none}',
    '.panel.hide{transform:translateX(calc(100% + 24px));opacity:0;pointer-events:none}',
    'header{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.ttl{display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.pill{align-self:flex-start;background:#2d63fb;color:#fff;font-weight:700;font-size:11px;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px}',
    '.deck{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#111827;padding:6px 10px}',
    'button:disabled{opacity:.45;cursor:not-allowed}',
    'button:focus-visible,textarea:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #2d63fb;outline-offset:1px}',
    '.icon{border:none;background:transparent;font-size:18px;padding:2px 8px}',
    '.cur{display:flex;flex-direction:column;gap:7px;border:1px solid #eef0f3;border-radius:10px;padding:10px;background:#f9fafb}',
    '.cur-h{display:flex;justify-content:space-between;gap:8px;font-weight:700}',
    '.cur-id{font-family:ui-monospace,Menlo,monospace;font-weight:500;color:#6b7280;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%}',
    '.cur-label{color:#4b5563;min-height:1em}',
    '.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
    '.seg button.on[data-status=visible]{background:#ecfdf5;border-color:#10b981;color:#065f46;font-weight:700}',
    '.seg button.on[data-status=skipped]{background:#fffbeb;border-color:#f59e0b;color:#92400e;font-weight:700}',
    '.seg button.on[data-status=deleted]{background:#fef2f2;border-color:#ef4444;color:#991b1b;font-weight:700}',
    '.seg button.dirty{box-shadow:0 0 0 2px rgba(45,99,251,.35)}',
    '.lbl{font-weight:600;color:#374151}',
    'textarea{width:100%;resize:vertical;min-height:60px;border:1px solid #d1d5db;border-radius:8px;padding:7px;font-size:13px;color:#111827;background:#fff}',
    'textarea.dirty{border-color:#2d63fb}',
    '.row{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.hint{color:#6b7280;font-family:ui-monospace,Menlo,monospace;font-size:11px}',
    '.ghost{background:#fff}',
    '.tools{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:6px}',
    '.primary{background:#2d63fb;border-color:#2d63fb;color:#fff;font-weight:700}',
    '.primary:disabled{background:#93a9e8;border-color:#93a9e8;opacity:1}',
    '.msg{min-height:16px;font-size:12px;color:#374151}.msg.ok{color:#047857}.msg.err{color:#b91c1c}.msg.sticky{color:#1d4ed8}',
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
    '.dot{width:8px;height:8px;border-radius:50%;background:#2d63fb;flex:none}',
    '.tab{pointer-events:auto;position:fixed;right:12px;top:12px;background:#2d63fb;color:#fff;border:none;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.25)}',
    '.badge{pointer-events:none;position:fixed;top:12px;left:50%;transform:translateX(-50%);max-width:min(640px,calc(100vw - 400px));padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;',
    'background:rgba(17,24,39,.88);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 18px rgba(0,0,0,.25)}',
    '.badge.deleted{background:rgba(185,28,28,.92)}.badge.skipped{background:rgba(180,83,9,.92)}',
    '.gate{pointer-events:auto;position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}',
    '.gate-box{background:#fff;color:#111827;border-radius:14px;padding:20px;width:min(380px,100%);display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.35)}',
    '.gate-box h2{margin:0;font-size:18px}.gate-box p{margin:0;color:#4b5563;font-size:13px}',
    '.gate-box input{font:inherit;font-size:14px;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px}',
    '.gerr{min-height:16px;color:#b91c1c;font-size:12px}',
    '.exit{color:#374151;text-decoration:none;border:1px solid #d1d5db;border-radius:8px;padding:6px 10px;font-size:13px}',
    '[hidden]{display:none!important}',
    '@media (max-width:700px){.panel{top:auto;height:55vh;left:8px;right:8px;bottom:8px;width:auto}.badge{max-width:calc(100vw - 24px)}}',
  ].join('\n')
})()
