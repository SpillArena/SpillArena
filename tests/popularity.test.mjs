import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GAMES } from '../shared/games-registry.js'
import { normalizePopularity, popularityFilter } from '../shared/popularity-server.js'
import { onRequestGet } from '../functions/api/popular-games.js'
import { selectPopularGame } from '../src/lib/popularity.ts'

const now = new Date('2026-10-12T00:30:00Z')
const filter = popularityFilter(now)
const row = (path, count) => ({ count, dimensions: { clientRequestPath: path } })
const zone = { games: [row('/hangbot', 12), row('/hangbot/', 2), row('/atlasmaster', 7), row('/hitline/', 42)] }
const candidates = GAMES.map((game, id) => ({ id, title: game, category: 'words', descriptionKey: game, icon: 'Type', color: 'lime', githubUrl: '', liveUrl: `https://spillarena.no/${game}/` }))
const normalized = () => normalizePopularity(zone, filter, now)

async function withProvider(provider, callback) {
  const previous = globalThis.fetch
  globalThis.fetch = provider
  try { await callback() } finally { globalThis.fetch = previous }
}
const context = (extra = {}) => ({
  env: { CLOUDFLARE_ZONE_ID: 'test-zone', CLOUDFLARE_ANALYTICS_TOKEN: 'private-test-token' },
  request: new Request('https://spillarena.no/api/popular-games?game=atlasmaster&days=999'),
  ...extra,
})

test('rolling 24 hours includes only successful game documents on the production hostname', () => {
  assert.equal(filter.datetime_geq, '2026-10-11T00:30:00.000Z')
  assert.equal(filter.datetime_lt, now.toISOString())
  assert.equal(filter.clientRequestHTTPHost, 'spillarena.no')
  assert.equal(filter.clientRequestHTTPMethodName, 'GET')
  assert.equal(filter.requestSource, 'eyeball')
  assert.deepEqual(filter.edgeResponseStatus_in, [200, 304])
  assert.deepEqual(filter.clientRequestPath_in, GAMES.flatMap(game => [`/${game}`, `/${game}/`]))
})

test('slash variants are combined; rankings use recent page loads with deterministic ties', () => {
  assert.deepEqual(normalized().games, [{ game: 'hitline', requests: 42 }, { game: 'hangbot', requests: 14 }, { game: 'atlasmaster', requests: 7 }])
  assert.equal(selectPopularGame(normalized(), candidates, now.getTime()).title, 'hitline')
  const tie = normalizePopularity({ games: [row('/hitline', 2), row('/hangbot', 2)] }, filter, now)
  assert.equal(tie.games[0].game, 'hangbot')
})

test('SipZone document visits merge both slash variants and can feature the new beta game', () => {
  const ranking = normalizePopularity({ games: [row('/sipzone', 11), row('/sipzone/', 9), row('/hitline/', 15)] }, filter, now)
  assert.deepEqual(ranking.games[0], { game: 'sipzone', requests: 20 })
  assert.ok(filter.clientRequestPath_in.includes('/sipzone'))
  assert.ok(filter.clientRequestPath_in.includes('/sipzone/'))
  assert.equal(selectPopularGame(ranking, candidates, now.getTime()).title, 'sipzone')
})

test('empty, stale, future, malformed and unsupported rankings cannot claim a popular game', () => {
  assert.equal(selectPopularGame(normalizePopularity({ games: [] }, filter, now), candidates, now.getTime()), null)
  for (const payload of [null, { available: false }, { ...normalized(), games: [{ game: 'hitline', requests: -1 }] },
    { ...normalized(), games: [{ game: 'hitline', requests: 42 }, { game: 'hitline', requests: 42 }] },
    { ...normalized(), windowHours: 168 }, { ...normalized(), source: 'lifetime-xp' }]) {
    assert.equal(selectPopularGame(payload, candidates, now.getTime()), null)
  }
  assert.equal(selectPopularGame(normalized(), candidates, now.getTime() + 360001), null)
  assert.equal(selectPopularGame(normalized(), candidates, now.getTime() - 60001), null)
  const disabled = candidates.map(game => ({ ...game, disabled: game.title === 'hitline' }))
  assert.equal(selectPopularGame(normalized(), disabled, now.getTime()).title, 'hangbot')
})

test('assets, duplicate paths, missing datasets and invalid provider metrics are rejected', () => {
  for (const input of [{}, { games: [row('/hangbot/assets/app.js', 100)] }, { games: [row('/hangbot', 1), row('/hangbot', 2)] },
    { games: [row('/hangbot', null)] }, { games: [row('/hangbot', '10')] }, { games: [row('/hangbot', -1)] }]) {
    assert.throws(() => normalizePopularity(input, filter, now))
  }
})

test('public endpoint has fixed scope, exposes no credentials and does not need an account', async () => {
  await withProvider(async (url, init) => {
    assert.equal(url, 'https://api.cloudflare.com/client/v4/graphql')
    const { variables } = JSON.parse(init.body)
    assert.equal(variables.zone, 'test-zone')
    assert.equal(variables.filter.clientRequestPath_in.length, GAMES.length * 2)
    assert.equal(Date.parse(variables.filter.datetime_lt) - Date.parse(variables.filter.datetime_geq), 86400000)
    assert.ok(init.signal instanceof AbortSignal)
    return Response.json({ data: { viewer: { zones: [zone] } }, errors: null })
  }, async () => {
    const response = await onRequestGet(context())
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=300')
    const body = await response.text()
    assert.equal(JSON.parse(body).games[0].game, 'hitline')
    assert.ok(!body.includes('private-test-token'))
    assert.ok(!body.includes('username'))
  })
})

test('missing configuration never queries the provider', async () => {
  await withProvider(() => { throw new Error('Must not fetch') }, async () => {
    const response = await onRequestGet(context({ env: {} }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { available: false })
  })
})

test('provider failures and partial GraphQL data stay unavailable and are not cached', async () => {
  for (const provider of [
    async () => new Response('', { status: 429 }),
    async () => Response.json({ errors: [{ message: 'private-test-token' }], data: { viewer: { zones: [zone] } } }),
    async () => Response.json({ data: { viewer: { zones: [] } } }),
    async () => new Response('invalid JSON'),
    async () => { throw new Error('private-test-token') },
  ]) {
    await withProvider(provider, async () => {
      const response = await onRequestGet(context())
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
      assert.deepEqual(await response.json(), { available: false })
    })
  }
})

test('edge cache shares the ranking across public requests without querying Cloudflare again', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches')
  let cached, calls = 0
  const pending = []
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: {
    match: async key => { assert.equal(key.url, 'https://spillarena.no/api/popular-games'); return cached?.clone() },
    put: async (_key, response) => { cached = response },
  } } })
  try {
    await withProvider(async () => { calls++; return Response.json({ data: { viewer: { zones: [zone] } } }) }, async () => {
      await onRequestGet(context({ waitUntil: promise => pending.push(promise) }))
      await Promise.all(pending)
      const response = await onRequestGet(context())
      assert.equal(calls, 1)
      assert.equal((await response.json()).games[0].game, 'hitline')
    })
  } finally {
    if (previous) Object.defineProperty(globalThis, 'caches', previous)
    else delete globalThis.caches
  }
})
