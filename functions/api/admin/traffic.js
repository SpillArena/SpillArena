import { json } from '../../../shared/account-server.js'
import { requireAdmin } from '../../../shared/admin-server.js'
import { normalizeTraffic, trafficPeriod, TRAFFIC_QUERY } from '../../../shared/traffic-server.js'

export async function onRequestGet({ env, request }) {
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  const days = Number(new URL(request.url).searchParams.get('days') ?? 7)
  if (![1, 7, 30].includes(days)) return json({ error: 'bad_period' }, 400)
  if (!env.CLOUDFLARE_ANALYTICS_TOKEN || !env.CLOUDFLARE_ZONE_ID) {
    return json({ configured: false })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 7000)
  try {
    const now = new Date()
    const period = trafficPeriod(days, now)
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: TRAFFIC_QUERY, variables: {
        zone: env.CLOUDFLARE_ZONE_ID, from: period.from, to: period.to, limit: days,
      } }),
      signal: controller.signal,
    })
    if (response.status === 401 || response.status === 403) return json({ error: 'analytics_denied' }, 502)
    if (response.status === 429) return json({ error: 'analytics_rate_limited' }, 503)
    if (!response.ok) return json({ error: 'analytics_failed' }, 502)
    const body = await response.json()
    // GraphQL may report errors with HTTP 200. Never turn partial data into zeros.
    if (body.errors?.length) return json({ error: 'analytics_failed' }, 502)
    const zone = body.data?.viewer?.zones?.[0]
    if (!zone) return json({ error: 'analytics_denied' }, 502)
    return json(normalizeTraffic(zone, days, period, now))
  } catch {
    // Provider errors must not expose credentials or Cloudflare response details.
    return json({ error: 'analytics_failed' }, 502)
  } finally {
    clearTimeout(timer)
  }
}
