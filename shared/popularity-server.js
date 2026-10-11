import { GAMES } from './games-registry.js'

export const POPULARITY_QUERY = `query Popularity($zone: string, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject) {
  viewer { zones(filter: {zoneTag: $zone}) {
    games: httpRequestsAdaptiveGroups(limit: 100, filter: $filter) {
      count
      dimensions { clientRequestPath }
    }
  } }
}`

export function popularityFilter(now = new Date()) {
  return {
    datetime_geq: new Date(now.getTime() - 86400000).toISOString(),
    datetime_lt: now.toISOString(),
    clientRequestHTTPHost: 'spillarena.no',
    clientRequestHTTPMethodName: 'GET',
    clientRequestPath_in: GAMES.flatMap(game => [`/${game}`, `/${game}/`]),
    edgeResponseStatus_in: [200, 304],
    requestSource: 'eyeball',
  }
}

/** Only aggregate game document loads; assets, APIs and redirects cannot inflate the ranking. */
export function normalizePopularity(zone, filter, now = new Date()) {
  if (!Array.isArray(zone?.games)) throw new Error('Missing popularity dataset')
  const totals = new Map(GAMES.map(game => [game, 0]))
  const seen = new Set()
  for (const row of zone.games) {
    const path = row.dimensions?.clientRequestPath
    const game = typeof path === 'string' ? path.match(/^\/([a-z]+)\/?$/)?.[1] : null
    if (!totals.has(game) || seen.has(path) || !Number.isFinite(row.count) || row.count < 0) {
      throw new Error('Invalid popularity metric')
    }
    seen.add(path)
    totals.set(game, totals.get(game) + row.count)
  }
  return {
    available: true,
    source: 'cloudflare-document-requests',
    windowHours: 24,
    from: filter.datetime_geq,
    to: filter.datetime_lt,
    checkedAt: now.toISOString(),
    games: [...totals].map(([game, requests]) => ({ game, requests }))
      .filter(row => row.requests > 0)
      .sort((a, b) => b.requests - a.requests || a.game.localeCompare(b.game)),
  }
}
