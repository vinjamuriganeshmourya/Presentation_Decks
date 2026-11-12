;(function () {
  'use strict'
  var M = window.__MANIFEST__ || { courses: [] }
  var base = M.siteBase || '/'
  var origin = location.origin
  var ver = String(M.sha || '').slice(0, 7)
  var $ = function (id) { return document.getElementById(id) }
  var q = $('q')
  var meta = {} /* deck id -> { slides, thumb } from deck-meta.json (thumbs.mjs); optional */
  var activity = {} /* "<course>/<session>" -> last commit, from activity.json (CI); optional */

  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
    git: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="5.5" r="2.2"/><circle cx="6" cy="18.5" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.7v8.6"/><path d="M18 10.2c0 4.3-5 4.6-10.4 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>',
  }

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
  function pad(n) {
    return n < 10 ? '0' + n : String(n)
  }
  function deckUrl(d) {
    return origin + base + d.path
  }
  function plural(n, w) {
    return n + ' ' + w + (n === 1 ? '' : 's')
  }
  function sessionAnchor(c, s) {
    return c.id + '/' + s.id
  }

  /* every deck once, in order, with its course and session */
  var all = []
  M.courses.forEach(function (c) {
    c.sessions.forEach(function (s) {
      s.decks.forEach(function (d, k) {
        all.push({ c: c, s: s, d: d, first: k === 0 })
      })
    })
  })

  if (M.sha) $('build').textContent = 'Build ' + ver + ' · updated ' + new Date(M.builtAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  /* ------------------------------------------------------------------ sidebar (built once; search only dims) */
  function renderSide() {
    var html = ''
    M.courses.forEach(function (c) {
      html += '<div class="side-course"><div class="side-h">Course</div>' +
        '<a class="side-course-t" href="#' + esc(c.id) + '">' + esc(c.title) + '</a><ul class="side-list">'
      c.sessions.forEach(function (s) {
        var title = (s.decks[0] && s.decks[0].title) || s.id
        html += '<li><a href="#' + esc(sessionAnchor(c, s)) + '" data-anchor="' + esc(sessionAnchor(c, s)) + '">' +
          '<span class="side-n">' + s.number + '</span><span>' + esc(title) + '</span></a></li>'
      })
      html += '</ul></div>'
    })
    $('side-nav').innerHTML = html
  }

  /* ------------------------------------------------------------------ main */
  function card(x, terms) {
    var c = x.c, s = x.s, d = x.d
    var url = deckUrl(d)
    var m = meta[d.id] || {}
    var thumb = url + 'thumb.jpg' + (ver ? '?v=' + ver : '')
    return (
      '<article class="card" data-deck="' + esc(d.id) + '"' + (x.first ? ' id="' + esc(sessionAnchor(c, s)) + '"' : '') + '>' +
      '<a class="thumb" href="' + esc(url) + '" aria-label="Present ' + esc(d.title) + '">' +
      '<div class="ph" aria-hidden="true"><span class="ph-n">' + pad(s.number) + '</span><span class="ph-t">' + esc(d.title) + '</span></div>' +
      '<img src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async" onload="this.classList.add(\'ok\')" onerror="this.remove()">' +
      '<span class="play" aria-hidden="true"><span>' + ICON.play + 'Present</span></span>' +
      '</a>' +
      '<div class="card-body">' +
      '<div class="eyebrow">Session ' + s.number + (c.sessions.length ? ' of ' + c.sessions.length : '') + '</div>' +
      '<h3><a href="' + esc(url) + '">' + hl(d.title, terms) + '</a></h3>' +
      '<div class="meta"><span class="slides" data-slides="' + esc(d.id) + '">' + (m.slides ? plural(m.slides, 'slide') : '') + '</span><span class="dot">·</span>' +
      '<span class="mono" title="' + esc(c.id + '/' + s.id) + '">' + hl(s.id, terms) + '</span></div>' +
      '<div class="actions">' +
      '<a class="btn primary" href="' + esc(url) + '">' + ICON.play + 'Present</a>' +
      '<a class="btn" href="' + esc(url) + '?edit=1" title="Open in edit mode (skip, delete, comment)">' + ICON.edit + 'Edit</a>' +
      '<button class="btn icon" type="button" data-download="' + esc(url) + '" title="Download the student view: one offline HTML file, skipped and deleted slides left out, no comments or editing" aria-label="Download student view of ' + esc(d.title) + '">' + ICON.download + '</button>' +
      '<button class="btn icon" type="button" data-share="' + esc(url) + '" data-title="' + esc(d.title) + '" aria-haspopup="dialog" aria-expanded="false" title="Share a link to this deck or a slide" aria-label="Share ' + esc(d.title) + '">' + ICON.share + '</button>' +
      '</div></div>' +
      '<div class="card-foot">' +
      '<span class="activity" data-activity="' + esc(c.id + '/' + s.id) + '"></span>' +
      '<button class="git-btn" type="button" data-git="' + esc(d.id) + '" data-course="' + esc(c.id) + '" data-session="' + esc(s.id) + '" data-title="' + esc(d.title) + '" aria-haspopup="dialog" aria-expanded="false" title="Git commands: sparse-clone this deck, or push your changes (editor password)" aria-label="Git commands for ' + esc(d.title) + '">' + ICON.git + 'Git</button>' +
      '</div></article>'
    )
  }

  function render() {
    var raw = q.value.trim().toLowerCase()
    var terms = raw.split(/\s+/).filter(Boolean)
    var shown = 0
    var html = ''
    var match = {}
    M.courses.forEach(function (c) {
      var items = all.filter(function (x) {
        if (x.c !== c) return false
        var hay = [c.title, c.id, x.s.id, 'session ' + x.s.number, x.d.title, x.d.slug].join(' ').toLowerCase()
        return terms.every(function (t) { return hay.indexOf(t) >= 0 })
      })
      if (!items.length) return
      shown += items.length
      items.forEach(function (x) { match[sessionAnchor(x.c, x.s)] = true })
      var decks = all.filter(function (x) { return x.c === c }).length
      html +=
        '<section class="course" id="' + esc(c.id) + '" aria-labelledby="h-' + esc(c.id) + '">' +
        '<div class="course-head"><div>' +
        '<div class="crumbs"><a href="' + esc(base) + '">All courses</a>' + ICON.chev + '<span>' + esc(c.title) + '</span></div>' +
        '<h1 id="h-' + esc(c.id) + '">' + hl(c.title, terms) + '</h1></div>' +
        '<div class="stats"><span class="stat"><b>' + c.sessions.length + '</b> sessions</span>' +
        (decks !== c.sessions.length ? '<span class="stat"><b>' + decks + '</b> decks</span>' : '') +
        '<span class="stat" data-course-slides="' + esc(c.id) + '" hidden></span></div>' +
        '</div>' +
        '<nav class="jump" aria-label="Sessions in ' + esc(c.title) + '">' +
        c.sessions
          .filter(function (s) { return match[sessionAnchor(c, s)] })
          .map(function (s) {
            return '<a href="#' + esc(sessionAnchor(c, s)) + '"><span class="side-n">' + s.number + '</span>' + esc((s.decks[0] && s.decks[0].title) || s.id) + '</a>'
          })
          .join('') +
        '</nav>' +
        '<div class="grid">' + items.map(function (x) { return card(x, terms) }).join('') + '</div></section>'
    })
    $('gallery').innerHTML = html
    $('empty').hidden = shown > 0
    $('qe').textContent = q.value
    document.querySelectorAll('#side-nav [data-anchor]').forEach(function (a) {
      a.classList.toggle('dim', !match[a.getAttribute('data-anchor')])
    })
    fillCounts()
    fillActivity()
    spy()
  }

  /* slide counts arrive after the first paint */
  function fillCounts() {
    document.querySelectorAll('[data-slides]').forEach(function (el) {
      var m = meta[el.getAttribute('data-slides')]
      el.textContent = m && m.slides ? plural(m.slides, 'slide') : ''
    })
    M.courses.forEach(function (c) {
      var el = document.querySelector('[data-course-slides="' + c.id + '"]')
      if (!el) return
      var n = 0
      all.forEach(function (x) { if (x.c === c && meta[x.d.id]) n += meta[x.d.id].slides || 0 })
      el.hidden = !n
      el.innerHTML = '<b>' + n + '</b> slides'
    })
  }
  /* "Last push by …" under each card; nothing when activity.json is missing or has no entry */
  function fillActivity() {
    document.querySelectorAll('[data-activity]').forEach(function (el) {
      var line = window.DeckActivity ? window.DeckActivity.line(activity[el.getAttribute('data-activity')]) : ''
      el.textContent = line
      el.title = line
    })
  }
  if (window.DeckActivity) {
    window.DeckActivity.load(base, ver).then(function (a) {
      activity = a || {}
      fillActivity()
    })
  }

  fetch(base + 'deck-meta.json' + (ver ? '?v=' + ver : ''))
    .then(function (r) { return r.ok ? r.json() : {} })
    .then(function (m) {
      meta = m || {}
      fillCounts()
    })
    .catch(function () {})

  /* ------------------------------------------------------------------ scroll spy: the session in view is lit in the sidebar */
  var io = null
  var spyLock = 0 /* after a jump, the jumped-to session stays lit until the scroll settles */
  function light(id) {
    document.querySelectorAll('#side-nav [data-anchor]').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('data-anchor') === id)
    })
  }
  function spy() {
    if (io) io.disconnect()
    if (!('IntersectionObserver' in window)) return
    var visible = {}
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting })
        var first = null
        document.querySelectorAll('.card[id]').forEach(function (el) {
          if (!first && visible[el.id]) first = el.id
        })
        if (!first || Date.now() < spyLock) return
        light(first)
      },
      { rootMargin: '-80px 0px -35% 0px' },
    )
    document.querySelectorAll('.card[id]').forEach(function (el) { io.observe(el) })
  }

  /* ------------------------------------------------------------------ deep links: #course/session scrolls to and lights the card */
  function goHash(smooth) {
    var id = decodeURIComponent(location.hash.slice(1))
    if (!id) return
    var el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: el.classList.contains('card') ? 'center' : 'start' })
    if (el.classList.contains('card')) {
      light(id)
      spyLock = Date.now() + 1500
      el.classList.add('flash')
      setTimeout(function () { el.classList.remove('flash') }, 1800)
    }
  }
  window.addEventListener('hashchange', function () { goHash(true) })

  /* ------------------------------------------------------------------ toast, copy */
  function toast(msg) {
    var t = $('toast')
    t.textContent = msg
    t.classList.add('on')
    clearTimeout(toast.h)
    toast.h = setTimeout(function () { t.classList.remove('on') }, 2400)
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

  /* ------------------------------------------------------------------ share popover */
  var pop = $('share-pop')
  var popFor = null
  function openShare(btn) {
    if (popFor === btn && !pop.hidden) return closeShare()
    if (popFor) popFor.setAttribute('aria-expanded', 'false')
    popFor = btn
    $('share-title').textContent = btn.getAttribute('data-title')
    $('share-n').value = 1
    pop.hidden = false
    var r = btn.getBoundingClientRect()
    var w = pop.offsetWidth
    var left = Math.min(Math.max(12, r.right - w), document.documentElement.clientWidth - w - 12)
    var top = r.bottom + 8
    if (top + pop.offsetHeight > window.innerHeight - 12) top = r.top - pop.offsetHeight - 8
    pop.style.left = left + window.scrollX + 'px'
    pop.style.top = top + window.scrollY + 'px'
    btn.setAttribute('aria-expanded', 'true')
    pop.querySelector('[data-act=copy-deck]').focus()
  }
  function closeShare() {
    if (popFor) popFor.setAttribute('aria-expanded', 'false')
    pop.hidden = true
    popFor = null
  }
  pop.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]')
    if (!b || !popFor) return
    var url = popFor.getAttribute('data-share')
    if (b.getAttribute('data-act') === 'copy-deck') copy(url)
    else copy(url + '#slide-' + Math.max(1, parseInt($('share-n').value, 10) || 1))
    closeShare()
  })
  $('share-n').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') pop.querySelector('[data-act=copy-slide]').click()
  })

  /* ------------------------------------------------------------------ git popover: clone / push commands behind the editor sign-in */
  var gitPop = $('git-pop')
  var gitFor = null
  $('git-note').textContent = window.DeckGit ? window.DeckGit.NOTE : ''
  function placePop(p, btn) {
    var r = btn.getBoundingClientRect()
    var w = p.offsetWidth
    var left = Math.min(Math.max(12, r.right - w), document.documentElement.clientWidth - w - 12)
    var top = r.bottom + 8
    if (top + p.offsetHeight > window.innerHeight - 12) top = r.top - p.offsetHeight - 8
    p.style.left = left + window.scrollX + 'px'
    p.style.top = top + window.scrollY + 'px'
  }
  function openGit(btn) {
    if (gitFor === btn && !gitPop.hidden) return closeGit()
    closeShare()
    if (gitFor) gitFor.setAttribute('aria-expanded', 'false')
    gitFor = btn
    $('git-title').textContent = btn.getAttribute('data-title')
    gitPop.hidden = false
    placePop(gitPop, btn)
    btn.setAttribute('aria-expanded', 'true')
    gitPop.querySelector('[data-git-act]').focus()
  }
  function closeGit() {
    if (gitFor) gitFor.setAttribute('aria-expanded', 'false')
    gitPop.hidden = true
    gitFor = null
  }
  gitPop.addEventListener('click', function (e) {
    var b = e.target.closest('[data-git-act]')
    if (!b || !gitFor) return
    var deck = { course: gitFor.getAttribute('data-course'), session: gitFor.getAttribute('data-session'), title: gitFor.getAttribute('data-title') }
    closeGit()
    if (!window.DeckGit) return toast('Git commands are not available. Reload the page and try again.')
    window.DeckGit.copy(b.getAttribute('data-git-act'), { config: M.git, deck: deck, worker: M.workerUrl, toast: toast })
  })

  /* ------------------------------------------------------------------ download */
  function download(b) {
    if (b.disabled) return
    if (!window.DeckStudent) return toast('Download is not available. Reload the page and try again.')
    b.disabled = true
    toast('Preparing the student view…')
    window.DeckStudent.fromUrl(b.getAttribute('data-download'), M.workerUrl)
      .then(function (r) { toast('Downloaded ' + r.name) })
      .catch(function (err) { toast('Download failed: ' + ((err && err.message) || 'unknown error')) })
      .then(function () { b.disabled = false })
  }

  /* ------------------------------------------------------------------ events */
  document.addEventListener('click', function (e) {
    var dl = e.target.closest('[data-download]')
    if (dl) return download(dl)
    var sh = e.target.closest('[data-share]')
    if (sh) {
      closeGit()
      return openShare(sh)
    }
    var gb = e.target.closest('[data-git]')
    if (gb) return openGit(gb)
    if (!pop.hidden && !e.target.closest('#share-pop')) closeShare()
    if (!gitPop.hidden && !e.target.closest('#git-pop')) closeGit()
  })
  window.addEventListener('resize', function () {
    closeShare()
    closeGit()
  })
  q.addEventListener('input', function () {
    closeShare()
    closeGit()
    render()
    try { history.replaceState(null, '', q.value ? '?q=' + encodeURIComponent(q.value) : location.pathname) } catch (e) {}
  })
  $('clear-q').addEventListener('click', function () {
    q.value = ''
    q.dispatchEvent(new Event('input'))
    q.focus()
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !pop.hidden) {
      var b = popFor
      closeShare()
      if (b) b.focus()
    } else if (e.key === 'Escape' && !gitPop.hidden) {
      var g = gitFor
      closeGit()
      if (g) g.focus()
    } else if (e.key === '/' && document.activeElement !== q && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault()
      q.focus()
    } else if (e.key === 'Escape' && document.activeElement === q && q.value) {
      q.value = ''
      q.dispatchEvent(new Event('input'))
    }
  })

  var initial = new URLSearchParams(location.search).get('q')
  if (initial) q.value = initial
  renderSide()
  render()
  if (location.hash) requestAnimationFrame(function () { goHash(false) })
})()
