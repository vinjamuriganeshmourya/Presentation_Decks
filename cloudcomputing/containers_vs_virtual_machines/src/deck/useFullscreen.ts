import { useCallback, useEffect, useState } from 'react'

/** Small wrapper around the Fullscreen API scoped to a target element. */
export function useFullscreen(target?: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    const el = target?.current ?? document.documentElement
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [target])

  return { isFullscreen, toggle }
}
