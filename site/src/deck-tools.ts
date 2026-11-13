/*
 * Shared browser tools for the deck site, loaded on the gallery and on every deck page
 * (compiled by `npm run build:ts` to site/gen/deck-tools.js, published as site-assets/deck-tools.js).
 *
 *   window.DeckGate      the editor sign-in: ONE modal, ONE check (POST <worker>/api/auth),
 *                        ONE session unlock (sessionStorage "deck-editor:pw"). overlay.js's edit
 *                        mode and comments use it, and so do the git buttons below.
 *   window.DeckGit       "Copy Git Command" / "Copy Push Command", built from site/config.json `git`
 *                        and the deck's folder, behind DeckGate.
 *   window.DeckActivity  the gallery's "Last push by …" line, from activity.json (written in CI).
 *
 * A plain script (no imports/exports): it runs before overlay.js and gallery.js, which use the globals.
 */

interface GitConfig {
  repoUrl: string
  branch?: string
  /** folder that holds the course folders, relative to the repo root ("" = the repo root) */
  decksRoot?: string
  /** folders every sparse checkout also needs (site build, scripts, hooks) */
  sharedPaths?: string[]
}

/** A deck's folder: <decksRoot>/<course>/<session>. */
interface DeckRef {
  course: string
  session: string
  title?: string
}

interface GateOptions {
  worker: string
  why?: string
  cancelLabel?: string
  /** Defaults below are the editor sign-in. A protected action (e.g. delete history) overrides them: */
  title?: string
  submitLabel?: string
  placeholder?: string
  /** red submit button */
  danger?: boolean
  /** the user must type exactly this to enable the submit button */
  confirmText?: string
  /** replaces the editor check (POST /api/auth): run the protected request itself with the typed password */
  check?: (password: string, name: string) => Promise<unknown>
  /** store the password as the session unlock (default true; false for one-off admin actions) */
  remember?: boolean
}

interface GateResult {
  password: string
  name: string
  /** what `check` resolved with */
  data?: unknown
}

interface ActivityEntry {
  author: string
  date: string
  message: string
  sha: string
}

/** The gallery's last-push block: who, when (its own line), what. */
interface ActivityParts {
  who: string
  when: string
  iso: string
  message: string
}

interface CopyOptions {
  config: GitConfig | null | undefined
  deck: DeckRef
  worker: string
  toast: (text: string) => void
}

interface DeckGateApi {
  password(): string | null
  name(): string
  open(opts: GateOptions): Promise<GateResult>
  unlock(opts: GateOptions): Promise<GateResult>
}

interface DeckGitApi {
  NOTE: string
  deckName(deck: DeckRef): string
  cloneCommand(config: GitConfig, deck: DeckRef): string
  pushCommand(config: GitConfig, deck: DeckRef): string
  copy(kind: 'clone' | 'push', opts: CopyOptions): Promise<boolean>
}

interface DeckActivityApi {
  load(base: string, version?: string): Promise<Record<string, ActivityEntry>>
  line(entry: ActivityEntry | null | undefined, now?: number): string
  parts(entry: ActivityEntry | null | undefined, now?: number): ActivityParts | null
  relative(iso: string, now?: number): string
}

interface Window {
  DeckGate: DeckGateApi
  DeckGit: DeckGitApi
  DeckActivity: DeckActivityApi
}

;(function () {
  if (window.DeckGate) return

  /* keep in step with LS in overlay.js */
  const KEY_PW = 'deck-editor:pw'
  const KEY_NAME = 'deck-editor:name'

  function storage(kind: 'session' | 'local'): Storage | null {
    try {
      return kind === 'session' ? window.sessionStorage : window.localStorage
    } catch {
      return null
    }
  }
  function sget(key: string, kind: 'session' | 'local'): string | null {
    try {
      const s = storage(kind)
      return s ? s.getItem(key) : null
    } catch {
      return null
    }
  }
  function sset(key: string, val: string | null, kind: 'session' | 'local'): void {
    try {
      const s = storage(kind)
      if (!s) return
      if (val == null) s.removeItem(key)
      else s.setItem(key, val)
    } catch {
      /* storage blocked: the unlock lasts until reload */
    }
  }

  /* ------------------------------------------------------------------ DeckGate */

  const GATE_CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.gate{pointer-events:auto;position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-size:13px}',
    '.gate-box{background:#fff;color:#111827;border-radius:14px;padding:20px;width:min(380px,100%);display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.35)}',
    '.gate-box h2{margin:0;font-size:18px}.gate-box p{margin:0;color:#4b5563;font-size:13px}',
    '.gate-box input{font:inherit;font-size:14px;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;color:#111827;background:#fff}',
    '.gerr{min-height:16px;color:#b91c1c;font-size:12px}',
    '.row{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    'button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#111827;padding:6px 10px}',
    'button:disabled{opacity:.45;cursor:not-allowed}',
    'button:focus-visible,input:focus-visible{outline:2px solid #2d63fb;outline-offset:1px}',
    '.primary{background:#2d63fb;border-color:#2d63fb;color:#fff;font-weight:700}',
    '.primary.danger{background:#dc2626;border-color:#dc2626}',
    '.gconfirm-l{color:#4b5563;font-size:12px;margin:2px 0 -4px}.gconfirm-l b{font-family:ui-monospace,Menlo,monospace;color:#111827}',
    '[hidden]{display:none!important}',
  ].join('\n')

  let host: HTMLDivElement | null = null
  let root: ShadowRoot | null = null
  let pending: {
    promise: Promise<GateResult>
    resolve: (r: GateResult) => void
    reject: (e: Error) => void
    opts: GateOptions
  } | null = null

  const q = <T extends Element>(sel: string): T => (root as ShadowRoot).querySelector(sel) as T
  const inGate = (e: Event): boolean => !!host && (e.composedPath ? e.composedPath() : []).indexOf(host) >= 0

  /* keys typed in the modal never reach the deck's own navigation (registered before the deck boots) */
  ;['keydown', 'keyup', 'keypress'].forEach((type) => {
    window.addEventListener(
      type,
      (e) => {
        if (!inGate(e)) return
        e.stopImmediatePropagation()
        if (type === 'keydown' && (e as KeyboardEvent).key === 'Escape') cancel()
      },
      true,
    )
  })

  function mount(): void {
    if (host) return
    host = document.createElement('div')
    host.id = 'deck-gate-host'
    host.setAttribute('data-edit-layer', '')
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483600;'
    ;['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'wheel', 'click', 'dblclick'].forEach((t) => {
      ;(host as HTMLDivElement).addEventListener(t, (e) => e.stopPropagation())
    })
    document.body.appendChild(host)
    root = host.attachShadow({ mode: 'open' })
    root.innerHTML =
      '<style>' + GATE_CSS + '</style>' +
      '<div class="gate" hidden><form class="gate-box" role="dialog" aria-modal="true" aria-labelledby="gate-h"><h2 id="gate-h">Editor sign-in</h2><p class="gwhy"></p>' +
      '<input type="password" class="gpw" autocomplete="current-password" placeholder="Editor password" aria-label="Editor password" required>' +
      '<input type="text" class="gname" autocomplete="nickname" placeholder="Your name (shown on comments and commits)" aria-label="Your name" maxlength="60">' +
      '<p class="gconfirm-l" hidden></p><input type="text" class="gconfirm" autocomplete="off" spellcheck="false" aria-label="Confirmation" hidden>' +
      '<div class="gerr" role="alert"></div><div class="row"><button type="button" class="ghost gcancel">Cancel</button><button class="primary gsubmit" type="submit">Sign in</button></div></form></div>'
    q<HTMLFormElement>('.gate-box').addEventListener('submit', submit)
    q<HTMLInputElement>('.gconfirm').addEventListener('input', syncConfirm)
    q<HTMLButtonElement>('.gcancel').addEventListener('click', cancel)
  }

  function close(): void {
    if (!root) return
    q<HTMLElement>('.gate').hidden = true
    q<HTMLInputElement>('.gpw').value = ''
    q<HTMLInputElement>('.gconfirm').value = ''
  }

  /** the submit button stays disabled until the confirmation text matches exactly */
  function syncConfirm(): void {
    const want = pending && pending.opts.confirmText
    q<HTMLButtonElement>('.gsubmit').disabled = !!want && q<HTMLInputElement>('.gconfirm').value.trim() !== want
  }

  /** fill the modal for this request: the editor sign-in, or a protected action */
  function configure(o: GateOptions): void {
    q<HTMLElement>('#gate-h').textContent = o.title || 'Editor sign-in'
    q<HTMLElement>('.gwhy').textContent = o.why || 'Enter the editor password.'
    q<HTMLButtonElement>('.gcancel').textContent = o.cancelLabel || 'Cancel'
    const pw = q<HTMLInputElement>('.gpw')
    pw.placeholder = o.placeholder || 'Editor password'
    pw.setAttribute('aria-label', pw.placeholder)
    const submitBtn = q<HTMLButtonElement>('.gsubmit')
    submitBtn.textContent = o.submitLabel || 'Sign in'
    submitBtn.classList.toggle('danger', !!o.danger)
    const label = q<HTMLElement>('.gconfirm-l')
    const box = q<HTMLInputElement>('.gconfirm')
    label.hidden = box.hidden = !o.confirmText
    box.required = !!o.confirmText
    box.placeholder = o.confirmText || ''
    label.innerHTML = ''
    if (o.confirmText) {
      label.appendChild(document.createTextNode('Type '))
      label.appendChild(document.createElement('b')).textContent = o.confirmText
      label.appendChild(document.createTextNode(' to confirm'))
    }
    q<HTMLElement>('.gerr').textContent = ''
  }

  function cancel(): void {
    if (!pending) return
    const p = pending
    pending = null
    close()
    p.reject(new Error('cancelled'))
  }

  function checkPassword(worker: string, pw: string): Promise<void> {
    if (!worker) return Promise.reject(Object.assign(new Error('no edit service configured'), { status: 0 }))
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 10000) : null
    return fetch(worker.replace(/\/+$/, '') + '/api/auth', {
      method: 'POST',
      headers: { 'x-editor-password': pw },
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then((r) =>
        r
          .json()
          .catch(() => ({}))
          .then((body: { error?: string }) => {
            if (!r.ok) throw Object.assign(new Error(body && body.error ? body.error : 'HTTP ' + r.status), { status: r.status })
          }),
      )
      .finally(() => {
        if (timer) clearTimeout(timer)
      })
  }

  function submit(e: Event): void {
    e.preventDefault()
    if (!pending) return
    const p = pending
    const o = p.opts
    const pw = q<HTMLInputElement>('.gpw').value
    const name = q<HTMLInputElement>('.gname').value.trim()
    const err = q<HTMLElement>('.gerr')
    const submitBtn = q<HTMLButtonElement>('.gsubmit')
    if (o.confirmText && q<HTMLInputElement>('.gconfirm').value.trim() !== o.confirmText) {
      err.textContent = 'Type ' + o.confirmText + ' exactly to confirm.'
      return
    }
    err.textContent = o.check ? 'Working…' : 'Checking…'
    submitBtn.disabled = true
    const run: Promise<unknown> = o.check ? o.check(pw, name) : checkPassword(o.worker, pw)
    run
      .then((data) => {
        if (o.remember !== false) sset(KEY_PW, pw, 'session')
        sset(KEY_NAME, name || null, 'local')
        if (pending === p) pending = null
        close()
        p.resolve({ password: pw, name, data })
      })
      .catch((x: Error & { status?: number }) => {
        err.textContent =
          x.status === 401 ? 'Wrong password.' : x.status ? x.message : 'Could not reach the edit service (' + x.message + ').'
      })
      .then(() => {
        submitBtn.disabled = false
        syncConfirm()
      })
  }

  const DeckGate: DeckGateApi = {
    password: () => sget(KEY_PW, 'session'),
    name: () => sget(KEY_NAME, 'local') || '',
    /** Show the sign-in. Resolves once the password is accepted; rejects ("cancelled") on Cancel / Esc. */
    open(opts) {
      mount()
      /* a protected action never shares a sign-in that is already open for something else */
      if (pending && (opts.check || pending.opts.check)) cancel()
      if (!pending) {
        q<HTMLInputElement>('.gname').value = DeckGate.name()
        let resolve!: (r: GateResult) => void
        let reject!: (e: Error) => void
        const promise = new Promise<GateResult>((res, rej) => {
          resolve = res
          reject = rej
        })
        pending = { promise, resolve, reject, opts }
      } else pending.opts = { ...opts, worker: opts.worker || pending.opts.worker }
      configure(pending.opts)
      syncConfirm()
      q<HTMLElement>('.gate').hidden = false
      setTimeout(() => q<HTMLInputElement>('.gpw').focus(), 30)
      return pending.promise
    },
    /** Already signed in this browser session: resolves at once. Otherwise shows the sign-in. */
    unlock(opts) {
      const pw = DeckGate.password()
      if (pw) return Promise.resolve({ password: pw, name: DeckGate.name() })
      return DeckGate.open(opts)
    },
  }

  /* ------------------------------------------------------------------ DeckGit */

  const NOTE = 'Push requires GitHub Write access.'
  const SAFE = /^[A-Za-z0-9_./:@%+=,-]+$/
  const sh = (s: string): string => (SAFE.test(s) ? s : "'" + s.replace(/'/g, "'\\''") + "'")
  const joinPath = (...parts: string[]): string =>
    parts
      .map((p) => String(p || '').replace(/^\/+|\/+$/g, ''))
      .filter((p) => p && p !== '.')
      .join('/')

  function repoName(url: string): string {
    const last = url.replace(/[?#].*$/, '').replace(/\/+$/, '').split(/[/:]/).pop() || 'repo'
    return last.replace(/\.git$/, '') || 'repo'
  }
  function branchOf(c: GitConfig): string {
    return c.branch || 'main'
  }
  function deckName(deck: DeckRef): string {
    return joinPath(deck.course, deck.session)
  }
  function deckPath(c: GitConfig, deck: DeckRef): string {
    return joinPath(c.decksRoot || '', deckName(deck))
  }
  function cloneCommand(c: GitConfig, deck: DeckRef): string {
    const sparse = [deckPath(c, deck)].concat((c.sharedPaths || []).map((p) => joinPath(p)).filter(Boolean))
    return [
      'git clone --filter=blob:none --no-checkout ' + sh(c.repoUrl),
      'cd ' + sh(repoName(c.repoUrl)),
      'git sparse-checkout set ' + sparse.map(sh).join(' '),
      'git checkout ' + sh(branchOf(c)),
    ].join('\n')
  }
  function pushCommand(c: GitConfig, deck: DeckRef): string {
    const b = sh(branchOf(c))
    return [
      /* --autostash: the deck's edits are still uncommitted at this point, and a plain rebase pull refuses to run */
      'git pull --rebase --autostash origin ' + b,
      'git add ' + sh(deckPath(c, deck)),
      'git commit -m "Update ' + deckName(deck).replace(/["\\$`]/g, '\\$&') + ': <what changed>"',
      'git push origin ' + b,
    ].join('\n')
  }

  function writeClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
    return legacyCopy(text)
  }
  function legacyCopy(text: string): Promise<void> {
    const a = document.createElement('textarea')
    a.value = text
    a.setAttribute('readonly', '')
    a.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(a)
    a.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    a.remove()
    return ok ? Promise.resolve() : Promise.reject(new Error('copy blocked'))
  }

  const DeckGit: DeckGitApi = {
    NOTE,
    deckName,
    cloneCommand,
    pushCommand,
    /** Sign in (same gate as edit mode) if needed, then copy the command. Resolves true when copied. */
    copy(kind, opts) {
      const c = opts.config
      if (!c || !c.repoUrl) {
        opts.toast('Git commands are not configured (site/config.json "git").')
        return Promise.resolve(false)
      }
      const label = kind === 'push' ? 'push command' : 'git command'
      return DeckGate.unlock({
        worker: opts.worker,
        why: 'Enter the editor password to copy the ' + label + ' for ' + (opts.deck.title || deckName(opts.deck)) + '.',
      }).then(
        () => {
          const text = kind === 'push' ? pushCommand(c, opts.deck) : cloneCommand(c, opts.deck)
          return writeClipboard(text).then(
            () => {
              opts.toast(kind === 'push' ? 'Copied ✓  ' + NOTE : 'Copied ✓')
              return true
            },
            () => {
              opts.toast('Could not copy. Press the button again.')
              return false
            },
          )
        },
        () => false,
      )
    },
  }

  /* ------------------------------------------------------------------ DeckActivity */

  const isEntry = (v: unknown): v is ActivityEntry => {
    const o = v as ActivityEntry
    return !!o && typeof o.author === 'string' && typeof o.date === 'string' && typeof o.message === 'string' && !isNaN(Date.parse(o.date))
  }

  function relative(iso: string, now?: number): string {
    const s = Math.round((Date.parse(iso) - (now == null ? Date.now() : now)) / 1000)
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [
      ['second', 60],
      ['minute', 60],
      ['hour', 24],
      ['day', 7],
      ['week', 4.35],
      ['month', 12],
      ['year', Infinity],
    ]
    if (Math.abs(s) < 45) return 'just now'
    let v = s
    for (const [unit, size] of steps) {
      if (Math.abs(v) < size) {
        try {
          return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(v), unit)
        } catch {
          return new Date(iso).toLocaleDateString()
        }
      }
      v /= size
    }
    return new Date(iso).toLocaleDateString()
  }

  const DeckActivity: DeckActivityApi = {
    /** activity.json at the site root, as { "<course>/<session>": entry }; {} when missing or malformed. */
    load(base, version) {
      return fetch(base.replace(/\/?$/, '/') + 'activity.json' + (version ? '?v=' + encodeURIComponent(version) : ''), { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : {}))
        .then((raw: { decks?: Record<string, unknown> }) => {
          const out: Record<string, ActivityEntry> = {}
          const decks = raw && typeof raw.decks === 'object' && raw.decks ? raw.decks : {}
          for (const k of Object.keys(decks)) if (isEntry(decks[k])) out[k] = decks[k] as ActivityEntry
          return out
        })
        .catch(() => ({}))
    },
    parts(entry, now) {
      if (!isEntry(entry) || !entry.author.trim()) return null
      const d = new Date(entry.date)
      let stamp: string
      try {
        stamp = d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      } catch {
        stamp = d.toISOString()
      }
      return {
        who: 'Last push by ' + entry.author.trim(),
        when: stamp + ' · ' + relative(entry.date, now),
        iso: entry.date,
        message: entry.message.trim(),
      }
    },
    line(entry, now) {
      if (!isEntry(entry) || !entry.author.trim()) return ''
      return 'Last push by ' + entry.author.trim() + ' · ' + relative(entry.date, now) + (entry.message.trim() ? ' · ' + entry.message.trim() : '')
    },
    relative,
  }

  window.DeckGate = DeckGate
  window.DeckGit = DeckGit
  window.DeckActivity = DeckActivity
})()
