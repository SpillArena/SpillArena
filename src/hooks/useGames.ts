import { useSyncExternalStore } from 'react'
import { games as catalogue } from '../data/games'
import { GAME_DEFAULTS, isGameSetting, type GameSetting } from '../../shared/game-settings.js'

let settings = GAME_DEFAULTS
let snapshot = catalogue
let generation = 0
const listeners = new Set<() => void>()

function publish(next: GameSetting[]) {
  settings = next
  snapshot = catalogue.map(game => {
    const setting = settings.find(item => item.game === new URL(game.liveUrl).pathname.split('/')[1])
    return setting ? { ...game, beta: setting.beta, availability: setting.availability, disabled: setting.availability !== 'available' } : game
  })
  listeners.forEach(listener => listener())
}

export function applyGameSetting(setting: GameSetting) {
  generation++ // Discard any public read started before this successful edit.
  publish(settings.map(item => item.game === setting.game ? setting : item))
}

async function refresh() {
  if (document.hidden) return
  const version = ++generation
  try {
    const response = await fetch('/api/game-settings', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (!response.ok) return
    const body = await response.json()
    if (version !== generation || !Array.isArray(body.games) || body.games.length !== GAME_DEFAULTS.length
      || !body.games.every(isGameSetting) || new Set(body.games.map((item: GameSetting) => item.game)).size !== GAME_DEFAULTS.length) return
    publish(body.games)
  } catch { /* Keep the last known settings; the router enforces access separately. */ }
}

let stop: (() => void) | undefined
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refresh()
    const interval = window.setInterval(() => { void refresh() }, 30000)
    const visible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', visible)
    stop = () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', visible)
      generation++
    }
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) stop?.()
  }
}

export function useGames() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
