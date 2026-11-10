import { useEffect, useState, useSyncExternalStore } from 'react'
import { fileSaveStatus, retrySave } from './fileSave'

/**
 * Whether the open file holds the presenter's changes (`fileSave.ts`). Presenter view of a built file
 * in Chrome or Edge only. "Saved" shows briefly and goes; a save that needs the file, or failed, stays
 * with a button, because a click is what lets the browser open the dialog.
 */
export function FileSaveBadge() {
  const s = useSyncExternalStore(fileSaveStatus.subscribe, fileSaveStatus.get, fileSaveStatus.get)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (s.kind === 'idle') return setShown(false)
    setShown(true)
    if (s.kind !== 'saved') return
    const t = window.setTimeout(() => setShown(false), 2500)
    return () => window.clearTimeout(t)
  }, [s])
  if (!shown || s.kind === 'idle') return null

  const text =
    s.kind === 'saving' ? 'Saving into the file…'
    : s.kind === 'saved' ? `Saved in ${s.name}`
    : s.kind === 'needs-file' ? 'Your changes are not in the file yet'
    : 'Could not save into the file'
  const action = s.kind === 'needs-file' ? 'Save into this file' : s.kind === 'failed' ? 'Try again' : null

  return (
    <div
      role="status"
      data-file-save=""
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-3 rounded-pill bg-white px-4 py-2 text-[14px] text-ink shadow-card-soft"
    >
      <span>{text}</span>
      {action && (
        <button type="button" onClick={retrySave} className="rounded-pill bg-brand px-3 py-1 text-[13px] font-semibold text-white">
          {action}
        </button>
      )}
    </div>
  )
}
