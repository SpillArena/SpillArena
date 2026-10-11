import assert from 'node:assert/strict'
import { test } from 'node:test'
import { issueToken } from '../shared/account-server.js'
import { onRequestGet } from '../functions/api/admin/traffic.js'
import { normalizeTraffic, trafficPeriod } from '../shared/traffic-server.js'

const now = new Date('2026-01-02T12:00:00Z')
const period = trafficPeriod(7, now)
const zone = {
  totals: [{ sum: {
    requests: 20, bytes: 1000, cachedRequests: 5, pageViews: 8, threats: 2,
    countryMap: [{ clientCountryName: 'NO', requests: 15 }, { clientCountryName: 'US', requests: 5 }],
    responseStatusMap: [{ edgeResponseStatus: 200, requests: 16 }, { edgeResponseStatus: 404, requests: 3 }, { edgeResponseStatus: 503, requests: 1 }],
  }, uniq: { uniques: 4 } }],
  daily: [
    { dimensions: { date: '2026-01-01' }, sum: { requests: 10 }, uniq: { uniques: 3 } },
    { dimensions: { date: '2026-01-02' }, sum: { requests: 10 }, uniq: { uniques: 3 } },
  ],
}

async function context({ admin = 1, banned = false, revoked = false, configured = true, days = '7', token = true } = {}) {
  const secret = 'local-unit-test-secret'
  const signed = await issueToken(secret, 'TestAdmin')
  return {
    env: {
      AUTH_SECRET: secret,
      ...(configured ? { CLOUDFLARE_ZONE_ID: 'test-zone', CLOUDFLARE_ANALYTICS_TOKEN: 'test-provider-token' } : {}),
      DB: { prepare: () => ({ bind: () => ({ first: async () => ({ username: 'TestAdmin', admin, banned_at: banned ? now.toISOString() : null, _revoked: revoked }) }) }) },
    },
    request: new Request(`https://spillarena.no/api/admin/traffic?days=${days}`, { headers: token ? { Authorization: `Bearer ${signed}` } : {} }),
  }
}

async function withProvider(handler, callback) {
  const original = globalThis.fetch
  globalThis.fetch = handler
  try { await callback() } finally { globalThis.fetch = original }
}

test('UTC dates cross year boundaries and include today', () => {
  assert.equal(period.from, '2025-12-27')
  assert.equal(period.to, '2026-01-02')
  assert.equal(trafficPeriod(1, now).from, '2026-01-02')
})

test('period visitors are deduplicated; absent days are filled; HTTP errors are separated', () => {
  const data = normalizeTraffic(zone, 7, period, now)
  assert.equal(data.totals.visitors, 4)
  assert.equal(data.daily.reduce((n, row) => n + row.visitors, 0), 6)
  assert.equal(data.daily.length, 7)
  assert.equal(data.daily[0].requests, 0)
  assert.equal(data.daily.at(-1).date, '2026-01-02')
  assert.equal(data.totals.clientErrors, 3)
  assert.equal(data.totals.serverErrors, 1)
})

test('empty datasets produce an empty report; malformed metrics do not become zero', () => {
  assert.equal(normalizeTraffic({ totals: [], daily: [] }, 7, period).totals.requests, 0)
  assert.throws(() => normalizeTraffic({}, 7, period))
  assert.throws(() => normalizeTraffic({ ...zone, totals: [{ ...zone.totals[0], uniq: {} }] }, 7, period))
})

test('unauthenticated, non-admin, banned and revoked accounts cannot query the provider', async () => {
  await withProvider(() => { throw new Error('Provider must not be called') }, async () => {
    for (const [options, expected] of [[{ token: false }, 401], [{ admin: 0 }, 403], [{ banned: true }, 401], [{ revoked: true }, 401]]) {
      assert.equal((await onRequestGet(await context(options))).status, expected)
    }
  })
})

test('missing configuration and unsupported periods never query the provider', async () => {
  await withProvider(() => { throw new Error('Provider must not be called') }, async () => {
    assert.deepEqual(await (await onRequestGet(await context({ configured: false }))).json(), { configured: false })
    for (const days of ['0', '2', '31', 'NaN', '-1']) assert.equal((await onRequestGet(await context({ days }))).status, 400)
  })
})

test('provider query has fixed scope and returns no secrets with no-store headers', async () => {
  await withProvider(async (url, init) => {
    assert.equal(url, 'https://api.cloudflare.com/client/v4/graphql')
    assert.equal(init.headers.Authorization, 'Bearer test-provider-token')
    assert.equal(JSON.parse(init.body).variables.zone, 'test-zone')
    assert.equal(JSON.parse(init.body).variables.limit, 7)
    assert.ok(init.signal instanceof AbortSignal)
    return Response.json({ data: { viewer: { zones: [zone] } }, errors: null })
  }, async () => {
    const response = await onRequestGet(await context())
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    const body = await response.text()
    assert.equal(JSON.parse(body).totals.requests, 20)
    assert.ok(!body.includes('test-provider-token'))
  })
})

test('HTTP 200 GraphQL errors and inaccessible zones do not produce successful reports', async () => {
  for (const body of [{ errors: [{ message: 'private provider detail' }], data: { viewer: { zones: [zone] } } }, { data: { viewer: { zones: [] } } }, { data: {} }]) {
    await withProvider(async () => Response.json(body), async () => {
      const response = await onRequestGet(await context())
      assert.equal(response.status, 502)
      assert.ok(!(await response.text()).includes('private provider detail'))
    })
  }
})

test('provider authentication, rate limiting, invalid JSON and network failures stay explicit', async () => {
  for (const [status, error] of [[401, 'analytics_denied'], [403, 'analytics_denied'], [429, 'analytics_rate_limited'], [500, 'analytics_failed']]) {
    await withProvider(async () => new Response('', { status }), async () => {
      assert.deepEqual(await (await onRequestGet(await context())).json(), { error })
    })
  }
  for (const handler of [async () => new Response('bad-json'), async () => { throw new Error('private credential detail') }]) {
    await withProvider(handler, async () => {
      assert.deepEqual(await (await onRequestGet(await context())).json(), { error: 'analytics_failed' })
    })
  }
})
