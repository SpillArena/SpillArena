import type { Game } from '../data/games'

/** Reject incomplete/stale data and choose the highest-ranked playable game. */
export function selectPopularGame(payload: unknown, candidates: Game[], now = Date.now()): Game | null {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as Record<string, unknown>
  if (data.available !== true || data.source !== 'cloudflare-document-requests' || data.windowHours !== 24
    || typeof data.checkedAt !== 'string' || !Array.isArray(data.games)) return null
  const age = now - Date.parse(data.checkedAt)
  if (!Number.isFinite(age) || age < -60000 || age > 360000) return null
  const eligible = new Map(candidates.filter(game => !game.disabled && game.liveUrl)
    .map(game => [new URL(game.liveUrl).pathname.replace(/^\/|\/$/g, ''), game]))
  const seen = new Set<string>()
  let winner: Game | null = null
  let highest = 0
  for (const row of data.games) {
    if (!row || typeof row.game !== 'string' || typeof row.requests !== 'number'
      || !Number.isFinite(row.requests) || row.requests < 0 || seen.has(row.game)) return null
    seen.add(row.game)
    const game = eligible.get(row.game)
    if (game && row.requests > highest) { winner = game; highest = row.requests }
  }
  return winner
}
