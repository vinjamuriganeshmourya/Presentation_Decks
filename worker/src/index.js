/**
 * presentation-decks-live: the temporary shared edit layer.
 *
 *   GET  /api/state?deck=<id>      public: pending (not yet deployed) edits for a deck
 *   POST /api/auth                 editor password check
 *   POST /api/save                 commit per-slide patches to the repo, then publish them to D1
 *   GET  /api/status?sha=<sha>     is that commit in the live build yet?
 *   POST /api/deployed             called by the Pages workflow after a deploy (Bearer DEPLOY_HOOK_TOKEN)
 *   POST /api/purge-history        ADMIN password: start .github/workflows/purge-deck-history.yml, which
 *                                  deletes one deck folder's version history and keeps its current files
 *   cron                           same deploy sync + 24h expiry, as a safety net
 *
 * Rows in D1 are keyed (deck, slide, field): two editors saving different
 * slides, or different fields of one slide, never overwrite each other. The
 * repo file is merged the same way: re-read, apply only this save's patches,
 * write with the file's sha, and retry on a conflict.
 */

const DAY = 24 * 60 * 60 * 1000
const SYNC_EVERY = 20 * 1000
const STATUSES = new Set(['visible', 'skipped', 'deleted'])
const FIELDS = new Set(['status', 'comment'])
const DECK_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[a-z0-9-]+$/
const SLIDE_RE = /^[^\s/\\]{1,120}$/
const SHA_RE = /^[0-9a-f]{40}$/

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    const cors = corsHeaders(req, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    try {
      let res
      if (url.pathname === '/api/state' && req.method === 'GET') res = await getState(url, env, ctx)
      else if (url.pathname === '/api/auth' && req.method === 'POST') res = await auth(req, env)
      else if (url.pathname === '/api/save' && req.method === 'POST') res = await save(req, env)
      else if (url.pathname === '/api/comment' && req.method === 'POST') res = await comment(req, env)
      else if (url.pathname === '/api/status' && req.method === 'GET') res = await status(url, env)
      else if (url.pathname === '/api/deployed' && req.method === 'POST') res = await deployed(req, env)
      else if (url.pathname === '/api/purge-history' && req.method === 'POST') res = await purgeHistory(req, env)
      else if (url.pathname === '/' || url.pathname === '/api/health') res = json({ ok: true, service: 'presentation-decks-live' })
      else res = json({ error: 'not found' }, 404)
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
      return res
    } catch (e) {
      const res = json({ error: e.expose ? e.message : 'internal error' }, e.status || 500)
      if (!e.expose) console.error(e?.stack || String(e))
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
      return res
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncDeployed(env, { force: true }))
  },
}

/* ------------------------------------------------------------------ helpers */

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

function httpError(status, message) {
  const e = new Error(message)
  e.status = status
  e.expose = true
  return e
}

function corsHeaders(req, env) {
  const origin = req.headers.get('origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim())
  const h = {
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-editor-password, x-admin-password, authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
  if (allowed.includes(origin)) h['access-control-allow-origin'] = origin
  return h
}

async function safeEqual(a, b) {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ])
  const x = new Uint8Array(ha)
  const y = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

async function requireEditor(req, env) {
  const pw = req.headers.get('x-editor-password') || ''
  if (!env.EDITOR_PASSWORD) throw httpError(503, 'editor password not configured')
  if (!pw || !(await safeEqual(pw, env.EDITOR_PASSWORD))) throw httpError(401, 'wrong editor password')
}

/** A separate secret (ADMIN_PASSWORD) for repo-level actions; the shared editor password never unlocks them. */
async function requireAdmin(req, env) {
  const pw = req.headers.get('x-admin-password') || ''
  if (!env.ADMIN_PASSWORD) throw httpError(503, 'admin password not configured on the edit service')
  if (!pw || !(await safeEqual(pw, env.ADMIN_PASSWORD))) throw httpError(401, 'wrong admin password')
}

async function getMeta(env, k) {
  const r = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind(k).first()
  return r ? r.v : null
}

function setMeta(env, k, v) {
  return env.DB.prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, String(v))
}

async function gh(env, path, init = {}) {
  if (!env.GH_TOKEN) throw httpError(503, 'GitHub token not configured on the Worker')
  const res = await fetch(`https://api.github.com/repos/${env.REPO}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'presentation-decks-live',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  })
  return res
}

const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const b64decode = (b64) => {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/* ------------------------------------------------------------------ deploy sync + cleanup */

/** Is commit `sha` contained in commit `head`? */
const containsCache = new Map()
async function contains(env, sha, head) {
  if (sha === head) return true
  const key = `${sha}:${head}`
  if (containsCache.has(key)) return containsCache.get(key)
  const res = await gh(env, `/compare/${sha}...${head}`)
  if (!res.ok) return false
  const body = await res.json()
  const ok = body.status === 'ahead' || body.status === 'identical'
  if (containsCache.size > 500) containsCache.clear()
  containsCache.set(key, ok)
  return ok
}

/** Delete rows the deployed build already carries, and rows older than 24h. */
async function cleanup(env, deployedSha) {
  await env.DB.prepare('DELETE FROM pending WHERE updated_at < ?').bind(Date.now() - DAY).run()
  if (!deployedSha || !SHA_RE.test(deployedSha)) return { removed: 0 }
  const { results } = await env.DB.prepare('SELECT DISTINCT sha FROM pending').all()
  let removed = 0
  for (const { sha } of results) {
    if (await contains(env, sha, deployedSha)) {
      const r = await env.DB.prepare('DELETE FROM pending WHERE sha = ?').bind(sha).run()
      removed += r.meta?.changes || 0
    }
  }
  return { removed }
}

/** Read the live site's build.json; when the deployed commit moved, clean up. Throttled. */
async function syncDeployed(env, { force = false } = {}) {
  const now = Date.now()
  if (!force) {
    const last = Number((await getMeta(env, 'last_sync')) || 0)
    if (now - last < SYNC_EVERY) return getMeta(env, 'deployed_sha')
  }
  await setMeta(env, 'last_sync', now).run()
  let sha = null
  try {
    const res = await fetch(`${env.SITE_URL}build.json?t=${now}`, { cf: { cacheTtl: 0 }, headers: { 'cache-control': 'no-cache' } })
    if (res.ok) sha = (await res.json()).sha
  } catch {
    /* site unreachable: keep what we knew */
  }
  const known = await getMeta(env, 'deployed_sha')
  /* only ever move forward: a stale CDN copy of build.json must not roll the deployed commit back */
  if (sha && SHA_RE.test(sha) && sha !== known && (!known || (await contains(env, known, sha)))) {
    await setMeta(env, 'deployed_sha', sha).run()
    await cleanup(env, sha)
    return sha
  }
  if (force) await cleanup(env, known)
  return known
}

/* ------------------------------------------------------------------ routes */

async function getState(url, env, ctx) {
  const deck = url.searchParams.get('deck') || ''
  if (!DECK_RE.test(deck)) throw httpError(400, 'bad deck id')
  ctx.waitUntil(syncDeployed(env).catch((e) => console.error('sync', e)))
  const { results } = await env.DB.prepare(
    'SELECT slide, field, value, sha, editor, updated_at FROM pending WHERE deck = ? AND updated_at >= ?',
  )
    .bind(deck, Date.now() - DAY)
    .all()
  const rows = results.map((r) => ({ slide: r.slide, field: r.field, value: JSON.parse(r.value), sha: r.sha, editor: r.editor, updatedAt: r.updated_at }))
  return json({ deck, rows, deployedSha: await getMeta(env, 'deployed_sha') })
}

async function auth(req, env) {
  await requireEditor(req, env)
  return json({ ok: true })
}

function validatePatches(patches) {
  if (!patches || typeof patches !== 'object' || Array.isArray(patches)) throw httpError(400, 'patches must be an object')
  const out = []
  const ids = Object.keys(patches)
  if (!ids.length) throw httpError(400, 'nothing to save')
  if (ids.length > 500) throw httpError(400, 'too many slides in one save')
  for (const id of ids) {
    if (!SLIDE_RE.test(id) || id.startsWith(THREAD_PREFIX)) throw httpError(400, `bad slide id: ${id}`)
    const p = patches[id]
    if (!p || typeof p !== 'object') throw httpError(400, `bad patch for ${id}`)
    for (const [field, value] of Object.entries(p)) {
      if (!FIELDS.has(field)) throw httpError(400, `bad field ${field}`)
      if (field === 'status' && !STATUSES.has(value)) throw httpError(400, `bad status for ${id}`)
      if (field === 'comment' && (typeof value !== 'string' || value.length > 4000)) throw httpError(400, `bad comment for ${id}`)
      out.push({ slide: id, field, value: field === 'comment' ? value.replace(/\r\n/g, '\n') : value })
    }
  }
  return out
}

function summarize(changes) {
  const n = { deleted: 0, skipped: 0, visible: 0, comment: 0 }
  for (const c of changes) {
    if (c.field === 'status') n[c.value]++
    else n.comment++
  }
  const parts = []
  if (n.deleted) parts.push(`delete ${n.deleted}`)
  if (n.skipped) parts.push(`skip ${n.skipped}`)
  if (n.visible) parts.push(`restore ${n.visible}`)
  if (n.comment) parts.push(`comment ${n.comment}`)
  return parts.join(', ') || 'no-op'
}

async function save(req, env) {
  await requireEditor(req, env)
  let body
  try {
    body = await req.json()
  } catch {
    throw httpError(400, 'bad json')
  }
  const deck = String(body.deck || '')
  if (!DECK_RE.test(deck)) throw httpError(400, 'bad deck id')
  const editor = cleanName(body.editor)
  const changes = validatePatches(body.patches)
  const r = await commitAndPublish(env, deck, changes, editor, (session, slug) => `deck-edit(${session}/${slug}): ${summarize(changes)}`)
  return json(r)
}

const cleanName = (v) => String(v || '').slice(0, 60).replace(/[^\p{L}\p{N} ._@'-]/gu, '').trim() || null
const ID_RE = /^[a-z0-9]{6,32}$/
const THREAD_PREFIX = '@t:'

/** Apply one change row to the repo document. Thread rows: slide `@t:<id>`, field `root` | `resolved` | `r:<replyId>`. */
function applyChange(doc, c) {
  if (c.slide.startsWith(THREAD_PREFIX)) {
    const tid = c.slide.slice(THREAD_PREFIX.length)
    doc.threads ||= {}
    const t = doc.threads[tid]
    if (c.field === 'root') {
      if (c.value === null) delete doc.threads[tid]
      else doc.threads[tid] = { replies: {}, resolved: false, ...(t || {}), ...c.value }
    } else if (!t) {
      /* a reply/resolve for a thread someone deleted meanwhile: dropped */
    } else if (c.field === 'resolved') {
      t.resolved = !!c.value
    } else if (c.field.startsWith('r:')) {
      const rid = c.field.slice(2)
      t.replies ||= {}
      if (c.value === null) delete t.replies[rid]
      else t.replies[rid] = { ...(t.replies[rid] || {}), ...c.value }
    }
    return
  }
  const s = (doc.slides[c.slide] ||= {})
  if (c.field === 'comment' && !c.value.trim()) delete s.comment
  else s[c.field] = c.value
  if (!Object.keys(s).length) delete doc.slides[c.slide]
}

/** The value a D1 row carries: the FULL merged value from the document, so a viewer never sees half a thread. */
function rowValue(doc, c) {
  if (!c.slide.startsWith(THREAD_PREFIX)) return c.value
  const t = doc.threads?.[c.slide.slice(THREAD_PREFIX.length)]
  if (c.field === 'root') {
    if (!t) return null
    const { replies, resolved, ...root } = t
    return root
  }
  if (!t) return null
  if (c.field === 'resolved') return !!t.resolved
  return t.replies?.[c.field.slice(2)] ?? null
}

/** Re-read the deck's edits file, merge these changes, commit (retrying on a race), then publish them to D1. */
async function commitAndPublish(env, deck, changes, editor, describe) {
  const [course, session, slug] = deck.split('/')
  const path = `${course}/${session}/edits/${slug}.json`
  let commitSha = null
  let noop = false
  let doc
  for (let attempt = 0; attempt < 6 && !commitSha && !noop; attempt++) {
    const getRes = await gh(env, `/contents/${encodeURI(path)}?ref=${env.BRANCH}`)
    doc = { deck, slides: {} }
    let fileSha
    if (getRes.ok) {
      const file = await getRes.json()
      fileSha = file.sha
      try {
        doc = JSON.parse(b64decode(file.content))
      } catch {
        doc = { deck, slides: {} }
      }
      doc.slides ||= {}
    } else if (getRes.status !== 404) {
      throw httpError(502, `GitHub read failed (${getRes.status})`)
    }
    const before = JSON.stringify(doc)
    for (const c of changes) applyChange(doc, c)
    doc.deck = deck
    doc.slides = Object.fromEntries(Object.entries(doc.slides).sort(([a], [b]) => a.localeCompare(b)))
    if (doc.threads && !Object.keys(doc.threads).length) delete doc.threads
    if (JSON.stringify(doc) === before) {
      noop = true
      break
    }
    const message = `${describe(session, slug)}${editor ? ` [by ${editor}]` : ''}`
    const putRes = await gh(env, `/contents/${encodeURI(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ message, content: b64encode(JSON.stringify(doc, null, 2) + '\n'), branch: env.BRANCH, ...(fileSha ? { sha: fileSha } : {}) }),
    })
    if (putRes.ok) {
      commitSha = (await putRes.json()).commit.sha
    } else if (putRes.status === 409 || putRes.status === 422) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 700))
    } else {
      const t = await putRes.text()
      console.error('github put', putRes.status, t)
      throw httpError(502, `GitHub write failed (${putRes.status})`)
    }
  }
  if (noop) return { ok: true, noop: true, sha: (await getMeta(env, 'deployed_sha')) || null }
  if (!commitSha) throw httpError(409, 'could not merge with concurrent saves, try again')

  const now = Date.now()
  const stmt = env.DB.prepare(
    `INSERT INTO pending (deck, slide, field, value, sha, editor, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(deck, slide, field) DO UPDATE SET value = excluded.value, sha = excluded.sha, editor = excluded.editor, updated_at = excluded.updated_at
     WHERE excluded.updated_at >= pending.updated_at`,
  )
  await env.DB.batch(changes.map((c) => stmt.bind(deck, c.slide, c.field, JSON.stringify(rowValue(doc, c)), commitSha, editor, now)))
  return { ok: true, sha: commitSha, path, changes: changes.length }
}

/** One comment action, published at once: add | reply | edit | resolve | delete. */
async function comment(req, env) {
  await requireEditor(req, env)
  let body
  try {
    body = await req.json()
  } catch {
    throw httpError(400, 'bad json')
  }
  const deck = String(body.deck || '')
  if (!DECK_RE.test(deck)) throw httpError(400, 'bad deck id')
  const author = cleanName(body.author) || 'Editor'
  const op = String(body.op || '')
  const tid = String(body.thread || '')
  const rid = body.reply == null ? null : String(body.reply)
  if (!ID_RE.test(tid)) throw httpError(400, 'bad thread id')
  if (rid !== null && !ID_RE.test(rid)) throw httpError(400, 'bad reply id')
  const text = typeof body.text === 'string' ? body.text.replace(/\r\n/g, '\n').trim() : ''
  const needText = op === 'add' || op === 'reply' || op === 'edit'
  if (needText && (!text || text.length > 4000)) throw httpError(400, 'comment text must be 1-4000 characters')
  const T = THREAD_PREFIX + tid
  const now = Date.now()
  let changes
  let what
  if (op === 'add') {
    const slide = String(body.slide || '')
    if (!SLIDE_RE.test(slide) || slide.startsWith(THREAD_PREFIX)) throw httpError(400, 'bad slide id')
    changes = [{ slide: T, field: 'root', value: { slide, author, text, at: now } }]
    what = `comment on ${slide}`
  } else if (op === 'reply') {
    if (!rid) throw httpError(400, 'reply id required')
    changes = [
      { slide: T, field: `r:${rid}`, value: { author, text, at: now } },
      { slide: T, field: 'resolved', value: false },
    ]
    what = 'reply'
  } else if (op === 'edit') {
    changes = [{ slide: T, field: rid ? `r:${rid}` : 'root', value: { text, edited: now } }]
    what = 'edit comment'
  } else if (op === 'resolve') {
    changes = [{ slide: T, field: 'resolved', value: !!body.resolved }]
    what = body.resolved ? 'resolve thread' : 'reopen thread'
  } else if (op === 'delete') {
    changes = [{ slide: T, field: rid ? `r:${rid}` : 'root', value: null }]
    what = rid ? 'delete reply' : 'delete thread'
  } else throw httpError(400, 'bad op')
  const r = await commitAndPublish(env, deck, changes, author, (session, slug) => `deck-comment(${session}/${slug}): ${what}`)
  return json(r)
}

async function status(url, env) {
  const sha = url.searchParams.get('sha') || ''
  if (!SHA_RE.test(sha)) throw httpError(400, 'bad sha')
  const deployedSha = await syncDeployed(env)
  const live = deployedSha ? await contains(env, sha, deployedSha) : false
  const pending = await env.DB.prepare('SELECT COUNT(*) AS n FROM pending WHERE sha = ?').bind(sha).first()
  return json({ sha, deployedSha, live, pendingRows: pending?.n || 0 })
}

async function deployed(req, env) {
  const authz = req.headers.get('authorization') || ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!env.DEPLOY_HOOK_TOKEN || !token || !(await safeEqual(token, env.DEPLOY_HOOK_TOKEN))) throw httpError(401, 'unauthorized')
  const { sha } = await req.json().catch(() => ({}))
  if (!SHA_RE.test(sha || '')) throw httpError(400, 'bad sha')
  await env.DB.batch([setMeta(env, 'deployed_sha', sha), setMeta(env, 'last_sync', Date.now())])
  const r = await cleanup(env, sha)
  return json({ ok: true, deployedSha: sha, ...r })
}

/**
 * Delete one deck folder's version history (admin only). The rewrite needs a real git checkout, so this only
 * validates the request and starts .github/workflows/purge-deck-history.yml (repository_dispatch, which the
 * Worker's token can already do with Contents: write). Body: { deck, confirm, author }.
 */
async function purgeHistory(req, env) {
  await requireAdmin(req, env)
  let body
  try {
    body = await req.json()
  } catch {
    throw httpError(400, 'bad json')
  }
  const deck = String(body.deck || '')
  if (!DECK_RE.test(deck)) throw httpError(400, 'bad deck id')
  const [course, session] = deck.split('/')
  if (String(body.confirm || '').trim() !== session) throw httpError(400, `type ${session} to confirm`)
  const folder = `${course}/${session}`
  const check = await gh(env, `/contents/${encodeURIComponent(course)}/${encodeURIComponent(session)}/dist-single?ref=${encodeURIComponent(env.BRANCH || 'main')}`)
  if (check.status === 404) throw httpError(404, `no deck folder ${folder} on ${env.BRANCH || 'main'}`)
  if (!check.ok) throw httpError(502, `GitHub read failed (${check.status})`)
  const by = cleanName(body.author) || 'Admin'
  const res = await gh(env, '/dispatches', {
    method: 'POST',
    body: JSON.stringify({ event_type: 'purge-deck-history', client_payload: { folder, by } }),
  })
  if (res.status !== 204) throw httpError(502, `could not start the GitHub Action (${res.status})`)
  return json({ ok: true, folder, actions: `https://github.com/${env.REPO}/actions/workflows/purge-deck-history.yml` })
}

