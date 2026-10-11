import { useEffect, useState } from 'react'
import { games, type Game } from '../data/games'
import { selectPopularGame } from '../lib/popularity'

export function usePopularGame(): Game | null {
  const [popular, setPopular] = useState<Game | null>(null)
  useEffect(() => {
    let disposed = false
    let controller: AbortController | null = null
    const refresh = async () => {
      if (document.hidden || controller) return
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 10000)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/popular-games`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Popularity unavailable')
        const payload: unknown = await response.json()
        if (!disposed) setPopular(selectPopularGame(payload, games))
      } catch {
        if (!disposed) setPopular(null)
      } finally {
        window.clearTimeout(timeout)
        controller = null
      }
    }
    void refresh()
    // The endpoint caches provider results for five minutes. Recheck on return to the tab too.
    const interval = window.setInterval(() => { void refresh() }, 60000)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      disposed = true
      controller?.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return popular
}
