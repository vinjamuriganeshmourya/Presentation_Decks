;(function () {
  'use strict'
  var M = window.__MANIFEST__ || { courses: [] }
  var base = M.siteBase || '/'
  var origin = location.origin
  var $ = function (id) { return document.getElementById(id) }
  var q = $('q')

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function hl(text, terms) {
    var out = esc(text)
    terms.forEach(function (t) {
      if (!t) return
      var re = new RegExp('(' + esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig')
      out = out.replace(re, '<mark>$1</mark>')
    })
    return out
  }
  function deckUrl(d) {
    return origin + base + d.path
  }

  var total = 0
  M.courses.forEach(function (c) {
    c.sessions.forEach(function (s) { total += s.decks.length })
  })
  $('summary').textContent =
    total + ' deck' + (total === 1 ? '' : 's') + ' · ' + M.courses.length + ' course' + (M.courses.length === 1 ? '' : 's')
  if (M.sha) $('build').textContent = 'Build ' + String(M.sha).slice(0, 7) + ' · ' + new Date(M.builtAt).toLocaleString()

  function render() {
    var raw = q.value.trim().toLowerCase()
    var terms = raw.split(/\s+/).filter(Boolean)
    var html = ''
    var shown = 0
    M.courses.forEach(function (c) {
      var shtml = ''
      var cCount = 0
      c.sessions.forEach(function (s) {
        var dhtml = ''
        s.decks.forEach(function (d) {
          var hay = [c.title, c.id, s.id, 'session ' + s.number, d.title, d.slug].join(' ').toLowerCase()
          if (!terms.every(function (t) { return hay.indexOf(t) >= 0 })) return
          shown++
          cCount++
          var url = deckUrl(d)
          dhtml +=
            '<div class="deck">' +
            '<h3><a href="' + esc(url) + '">' + hl(d.title, terms) + '</a></h3>' +
            '<div class="actions">' +
            '<a class="btn primary" href="' + esc(url) + '">Open</a>' +
            '<button class="btn" data-copy="' + esc(url) + '">Copy link</button>' +
            '<a class="btn edit" href="' + esc(url) + '?edit=1" title="Open this deck in edit mode">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/></svg>Edit</a>' +
            '<button class="btn icon-btn" data-download="' + esc(url) + '" title="Download the student view: one offline HTML file, skipped and deleted slides left out, no comments or editing">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>Download</button>' +
            '</div>' +
            '<div class="actions">' +
            '<label class="slide-link">Slide <input type="number" min="1" step="1" value="1" inputmode="numeric" aria-label="Slide number for ' + esc(d.title) + '"></label>' +
            '<button class="btn small" data-slide="' + esc(url) + '">Copy slide link</button>' +
            '</div>' +
            '</div>'
        })
        if (!dhtml) return
        shtml +=
          '<article class="session">' +
          '<div class="session-h"><div class="num">' + s.number + '</div><div class="meta">' +
          '<div class="eyebrow">Session ' + s.number + '</div>' +
          '<div class="folder" title="' + esc(c.id + '/' + s.id) + '">' + hl(s.id, terms) + '</div>' +
          '</div></div>' + dhtml + '</article>'
      })
      if (!shtml) return
      html +=
        '<section class="course"><h2>' + hl(c.title, terms) + '<span class="count">' + cCount + ' deck' + (cCount === 1 ? '' : 's') + '</span></h2>' +
        '<div class="course-path">' + esc(c.id) + '/</div><div class="sessions">' + shtml + '</div></section>'
    })
    $('gallery').innerHTML = html
    $('empty').hidden = shown > 0
    $('qe').textContent = q.value
  }

  function toast(msg) {
    var t = $('toast')
    t.textContent = msg
    t.classList.add('on')
    clearTimeout(toast.h)
    toast.h = setTimeout(function () { t.classList.remove('on') }, 2200)
  }
  function copy(text) {
    var done = function () { toast('Copied ' + text) }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(done, fallback)
    fallback()
    function fallback() {
      var a = document.createElement('textarea')
      a.value = text
      a.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(a)
      a.select()
      try { document.execCommand('copy') } catch (e) {}
      a.remove()
      done()
    }
  }

  function download(b) {
    if (b.disabled) return
    if (!window.DeckStudent) return toast('Download is not available. Reload the page and try again.')
    var label = b.lastChild
    b.disabled = true
    label.textContent = 'Preparing…'
    window.DeckStudent.fromUrl(b.getAttribute('data-download'), M.workerUrl)
      .then(function (r) { toast('Downloaded ' + r.name) })
      .catch(function (err) { toast('Download failed: ' + ((err && err.message) || 'unknown error')) })
      .then(function () {
        b.disabled = false
        label.textContent = 'Download'
      })
  }

  document.addEventListener('click', function (e) {
    var dl = e.target.closest('[data-download]')
    if (dl) return download(dl)
    var b = e.target.closest('[data-copy],[data-slide]')
    if (!b) return
    if (b.hasAttribute('data-copy')) return copy(b.getAttribute('data-copy'))
    var input = b.parentNode.querySelector('input')
    var n = Math.max(1, parseInt(input && input.value, 10) || 1)
    copy(b.getAttribute('data-slide') + '#slide-' + n)
  })
  q.addEventListener('input', function () {
    render()
    try { history.replaceState(null, '', q.value ? '?q=' + encodeURIComponent(q.value) : location.pathname) } catch (e) {}
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q) {
      e.preventDefault()
      q.focus()
    } else if (e.key === 'Escape' && document.activeElement === q) {
      q.value = ''
      render()
    }
  })
  var initial = new URLSearchParams(location.search).get('q')
  if (initial) q.value = initial
  render()
})()
