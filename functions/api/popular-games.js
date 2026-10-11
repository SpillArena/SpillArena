import { normalizePopularity, popularityFilter, POPULARITY_QUERY } from '../../shared/popularity-server.js'

const reply = (body, status = 200, ttl = 0) => Response.json(body, {
  status,
  headers: { 'Cache-Control': ttl ? `public, max-age=${ttl}` : 'no-store' },
})

/** Public, aggregated ranking. No account, visitor identity or provider credential is returned. */
export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.CLOUDFLARE_ANALYTICS_TOKEN || !env.CLOUDFLARE_ZONE_ID) return reply({ available: false }, 200, 60)

  const cache = globalThis.caches?.default
  const key = new Request(new URL('/api/popular-games', request.url))
  if (cache) {
    try {
      const hit = await cache.match(key)
      if (hit) return hit
    } catch { /* Cache failures still allow a fresh provider query. */ }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 7000)
  try {
    const now = new Date()
    const filter = popularityFilter(now)
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: POPULARITY_QUERY, variables: { zone: env.CLOUDFLARE_ZONE_ID, filter } }),
      signal: controller.signal,
    })
    if (!response.ok) return reply({ available: false }, 503)
    const body = await response.json()
    // HTTP 200 can contain GraphQL errors. Never rank partial or missing data.
    if (body.errors?.length) return reply({ available: false }, 503)
    const result = reply(normalizePopularity(body.data?.viewer?.zones?.[0], filter, now), 200, 300)
    if (cache && waitUntil) waitUntil(cache.put(key, result.clone()).catch(() => {}))
    return result
  } catch {
    return reply({ available: false }, 503)
  } finally {
    clearTimeout(timer)
  }
}
