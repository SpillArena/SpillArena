/** Cloudflare zone analytics. No beacon or extra visitor tracking is needed. */
export const TRAFFIC_QUERY = `query Traffic($zone: string, $from: string, $to: string, $limit: int) {
  viewer { zones(filter: {zoneTag: $zone}) {
    totals: httpRequests1dGroups(limit: 1, filter: {date_geq: $from, date_leq: $to}) {
      sum { requests bytes cachedRequests pageViews threats
        countryMap { clientCountryName requests }
        responseStatusMap { edgeResponseStatus requests }
      }
      uniq { uniques }
    }
    daily: httpRequests1dGroups(limit: $limit, filter: {date_geq: $from, date_leq: $to}, orderBy: [date_ASC]) {
      dimensions { date }
      sum { requests bytes pageViews }
      uniq { uniques }
    }
  } }
}`

const DAY_MS = 86400000

export function trafficPeriod(days, now = new Date()) {
  const to = now.toISOString().slice(0, 10)
  const start = Date.parse(`${to}T00:00:00Z`) - (days - 1) * DAY_MS
  return { from: new Date(start).toISOString().slice(0, 10), to, start }
}

function number(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid analytics metric')
  return value
}

/** Uniques must come from the period aggregate, never by adding daily uniques. */
export function normalizeTraffic(zone, days, period, now = new Date()) {
  if (!Array.isArray(zone?.totals) || !Array.isArray(zone?.daily)) throw new Error('Missing analytics dataset')
  const total = zone.totals[0]
  if (!total && zone.daily.length) throw new Error('Missing analytics totals')
  const sum = total?.sum
  const requests = total ? number(sum?.requests) : 0
  const statuses = total ? sum.responseStatusMap : []
  const countries = total ? sum.countryMap : []
  if (!Array.isArray(statuses) || !Array.isArray(countries)) throw new Error('Missing analytics breakdown')
  const statusRows = statuses.map(row => ({ status: number(row.edgeResponseStatus), requests: number(row.requests) }))
  const byDate = new Map(zone.daily.map(row => [row.dimensions?.date, row]))
  return {
    configured: true,
    source: 'cloudflare-zone',
    days,
    from: period.from,
    to: period.to,
    fetchedAt: now.toISOString(),
    totals: {
      requests,
      visitors: total ? number(total.uniq?.uniques) : 0,
      pageViews: total ? number(sum.pageViews) : 0,
      bytes: total ? number(sum.bytes) : 0,
      cachedRequests: total ? number(sum.cachedRequests) : 0,
      threats: total ? number(sum.threats) : 0,
      clientErrors: statusRows.filter(row => row.status >= 400 && row.status < 500).reduce((n, row) => n + row.requests, 0),
      serverErrors: statusRows.filter(row => row.status >= 500 && row.status < 600).reduce((n, row) => n + row.requests, 0),
    },
    daily: Array.from({ length: days }, (_, i) => {
      const date = new Date(period.start + i * DAY_MS).toISOString().slice(0, 10)
      const row = byDate.get(date)
      return { date, requests: row ? number(row.sum?.requests) : 0, visitors: row ? number(row.uniq?.uniques) : 0 }
    }),
    countries: countries.map(row => ({ country: String(row.clientCountryName), requests: number(row.requests) }))
      .sort((a, b) => b.requests - a.requests).slice(0, 10),
    statuses: statusRows.sort((a, b) => b.requests - a.requests),
  }
}
