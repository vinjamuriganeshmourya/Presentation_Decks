/**
 * SAVE INTO THE OPEN FILE (the user, 2026-10-27; every deck from now on).
 *
 * The built deck is one HTML file opened by double-click. An edit, a skip or a
 * delete made in it used to live in that browser's `localStorage` only, so the
 * file that was shared afterwards showed none of it. In Chrome and Edge the
 * File System Access API lets the page write itself: the first change asks
 * once for the file (a save dialog, named after the open file), the handle is
 * kept in IndexedDB per file path, and every later change rewrites that file
 * with the state injected (`withState`). Whoever opens the shared file gets
 * the deck as it was left, with every control still there.
 *
 * Only on `file:` pages: under `npm run dev` the edits go to source instead
 * (`vite.config.ts`). Firefox, Safari and Brave (unless its flag is on) have no
 * such API; there the deck keeps working as before, remembering per browser.
 */

export type FileSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; name: string }
  | { kind: 'needs-file' }
  | { kind: 'failed'; message: string }

interface FileHandle {
  name: string
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>
}

declare global {
  interface Window {
    showSaveFilePicker?: (o: {
      suggestedName?: string
      types?: { description: string; accept: Record<string, string[]> }[]
    }) => Promise<FileHandle>
  }
}

export function canSaveFile(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:' && typeof window.showSaveFilePicker === 'function'
}

export function openFileName(): string {
  try {
    return decodeURIComponent(window.location.pathname.split('/').pop() || 'deck.html')
  } catch {
    return 'deck.html'
  }
}

/* ------------------------------------------------------------- the handle, per file path */

const DB = 'nxtwave-deck-files'
const STORE = 'handles'

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const d = await db()
    return await new Promise<T | undefined>((resolve, reject) => {
      const req = run(d.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return undefined
  }
}

const handleKey = () => window.location.pathname

async function storedHandle(ask: boolean): Promise<FileHandle | null> {
  const h = await idb<FileHandle>('readonly', (s) => s.get(handleKey()))
  if (!h) return null
  const q = (await h.queryPermission?.({ mode: 'readwrite' })) ?? 'granted'
  if (q === 'granted') return h
  if (!ask) return null
  try {
    return (await h.requestPermission?.({ mode: 'readwrite' })) === 'granted' ? h : null
  } catch {
    return null
  }
}

/* ---------------------------------------------------------------------- status store */

let status: FileSaveStatus = { kind: 'idle' }
const listeners = new Set<() => void>()
function set(s: FileSaveStatus) {
  status = s
  for (const l of listeners) l()
}
export const fileSaveStatus = {
  get: () => status,
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

/* --------------------------------------------------------------------------- saving */

let latest: (() => string) | null = null
let running = false
let again = false

/**
 * Write `html()` into the open file. `ask` is true when the call comes straight from a click or a key
 * (it may open the dialog); a save that cannot get the file without asking reports `needs-file`, and the
 * status pill's button calls this again with `ask`.
 */
export async function saveIntoFile(html: () => string, ask: boolean): Promise<boolean> {
  latest = html
  if (running) {
    again = true
    return false
  }
  running = true
  try {
    let h = await storedHandle(ask)
    if (!h && ask) {
      try {
        h = await window.showSaveFilePicker!({
          suggestedName: openFileName(),
          types: [{ description: 'Deck (HTML)', accept: { 'text/html': ['.html'] } }],
        })
        await idb('readwrite', (s) => s.put(h, handleKey()))
      } catch (e) {
        /* cancelled, or no user gesture left: the pill offers the button */
        if ((e as Error)?.name !== 'AbortError') console.warn('[deck] file picker', e)
        set({ kind: 'needs-file' })
        return false
      }
    }
    if (!h) {
      set({ kind: 'needs-file' })
      return false
    }
    set({ kind: 'saving' })
    do {
      again = false
      const w = await h.createWritable()
      await w.write(latest())
      await w.close()
    } while (again)
    set({ kind: 'saved', name: h.name })
    return true
  } catch (e) {
    set({ kind: 'failed', message: (e as Error)?.message ?? String(e) })
    return false
  } finally {
    running = false
  }
}

/** The pill's button: a real click, so the dialog or the permission prompt may open. */
export function retrySave(): void {
  if (latest) void saveIntoFile(latest, true)
}
