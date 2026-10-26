import { useEffect } from 'react'
import { hideLoader, showLoader } from './loader'

/** Keep the shared loading screen tied to the lifetime of a pending action. */
export function useGlobalLoader(active: boolean, label: string): void {
  useEffect(() => {
    if (!active) return
    const root = document.getElementById('root')
    const wasInert = root?.inert ?? false
    const wasBusy = root?.getAttribute('aria-busy') ?? null
    const focused = document.activeElement
    showLoader(label)
    if (root) {
      root.inert = true
      root.setAttribute('aria-busy', 'true')
    }
    return () => {
      hideLoader()
      if (root) {
        root.inert = wasInert
        if (wasBusy === null) root.removeAttribute('aria-busy')
        else root.setAttribute('aria-busy', wasBusy)
      }
      if (focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true })
    }
  }, [active, label])
}
