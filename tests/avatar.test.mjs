import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { issueAdminToken, issueToken } from '../shared/account-server.js'
import { onRequestPut } from '../functions/api/account/avatar.js'
import { onRequestGet } from '../functions/api/profile/index.js'
import { readAvatar, validAvatar } from '../shared/avatar.js'
import { AVATAR_CUSTOMIZATION } from '../shared/avatar-options.js'
import { Avatar, Style } from '@dicebear/core'
import { onRequestGet as playerList } from '../functions/api/admin/players.js'
import { onRequestGet as playerDetail } from '../functions/api/admin/player.js'

const secret = 'avatar-local-test-secret'
const picture = { style: 'bottts', seed: 'test-picture-123' }

function database() {
  const sql = new DatabaseSync(':memory:')
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'))
  for (const username of ['Alice', 'Bob']) {
    sql.prepare('INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
      .run(username, 'test-hash', 'test-salt', new Date().toISOString(), new Date().toISOString())
  }
  const DB = { prepare(query) {
    return { bind(...values) {
      const statement = sql.prepare(query)
      return { first: async () => statement.get(...values) ?? null, all: async () => ({ results: statement.all(...values) }), run: async () => ({ meta: { changes: statement.run(...values).changes } }) }
    } }
  } }
  return { sql, env: { AUTH_SECRET: secret, DB } }
}

async function request(body, username = 'Alice', method = 'PUT') {
  const token = username ? await issueToken(secret, username) : null
  return new Request(`https://spillarena.no/api/${method === 'GET' ? 'profile' : 'account/avatar'}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  })
}

test('avatar accepts only supported styles and bounded seeds; corrupt storage falls back', () => {
  assert.equal(validAvatar(picture), true)
  for (const value of [null, [], {}, { style: 'unknown', seed: 'a' }, { ...picture, seed: '<script>' }, { ...picture, seed: 'a'.repeat(65) }, { ...picture, url: 'https://outside.example' }]) assert.equal(validAvatar(value), false)
  assert.equal(readAvatar('bad-json'), null)
  assert.equal(readAvatar(null), null)
})

test('admin list and player detail return validated saved portraits without credentials', async () => {
  const { env, sql } = database()
  try {
    sql.prepare('UPDATE players SET admin = 1 WHERE username = ?').run('Alice')
    const avatar = { ...picture, options: { eyesVariant: 'happy', backgroundColor: '#123456' } }
    sql.prepare('UPDATE players SET avatar = ? WHERE username = ?').run(JSON.stringify(avatar), 'Bob')
    const headers = { Authorization: `Bearer ${await issueAdminToken(secret, 'Alice')}` }
    const list = await playerList({ env, request: new Request('https://spillarena.no/api/admin/players?sort=name', { headers }) })
    assert.equal(list.status, 200)
    assert.equal(list.headers.get('Cache-Control'), 'no-store')
    const page = await list.json()
    assert.equal(page.players[0].username, 'Alice')
    assert.equal(page.players[0].avatar, null)
    assert.deepEqual(page.players[1].avatar, avatar)
    const detail = await playerDetail({ env, request: new Request('https://spillarena.no/api/admin/player?u=Bob', { headers }) })
    assert.equal(detail.status, 200)
    assert.equal(detail.headers.get('Cache-Control'), 'no-store')
    const body = await detail.json()
    assert.deepEqual(body.account.avatar, avatar)
    for (const account of [...page.players, body.account]) {
      for (const field of ['pin_hash', 'pin_salt', 'recovery_hash', 'recovery_salt', 'reset_hash', 'reset_salt']) assert.equal(Object.hasOwn(account, field), false)
    }
    for (const raw of ['not-json', '{"style":"unknown","seed":"x"}', null]) {
      sql.prepare('UPDATE players SET avatar = ? WHERE username = ?').run(raw, 'Bob')
      const page = await (await playerList({ env, request: new Request('https://spillarena.no/api/admin/players?q=Bob', { headers }) })).json()
      assert.equal(page.players[0].avatar, null)
      const body = await (await playerDetail({ env, request: new Request('https://spillarena.no/api/admin/player?u=Bob', { headers }) })).json()
      assert.equal(body.account.avatar, null)
    }
  } finally { sql.close() }
})

test('admin player portraits require the separate admin session', async () => {
  const { env, sql } = database()
  try {
    sql.prepare('UPDATE players SET admin = 1 WHERE username = ?').run('Alice')
    for (const token of [null, await issueToken(secret, 'Alice'), await issueAdminToken(secret, 'Bob')]) {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      for (const [handler, path] of [[playerList, 'players'], [playerDetail, 'player?u=Bob']]) {
        const response = await handler({ env, request: new Request(`https://spillarena.no/api/admin/${path}`, { headers }) })
        assert.ok([401, 403].includes(response.status))
        assert.equal(Object.hasOwn(await response.json(), 'avatar'), false)
      }
    }
  } finally { sql.close() }
})

test('actual migrations: avatar persists for its owner, survives rename, and can be removed', async () => {
  const { sql, env } = database()
  try {
    const response = await onRequestPut({ env, request: await request({ avatar: picture, username: 'Bob' }) })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.deepEqual(await response.json(), { avatar: picture })
    assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Bob').avatar, null)
    let profile = await onRequestGet({ env, request: await request(null, 'Alice', 'GET') })
    assert.deepEqual((await profile.json()).avatar, picture)
    sql.prepare('UPDATE players SET username = ? WHERE username = ?').run('Alicia', 'Alice')
    profile = await onRequestGet({ env, request: await request(null, 'Alicia', 'GET') })
    assert.deepEqual((await profile.json()).avatar, picture)
    assert.equal((await onRequestPut({ env, request: await request({ avatar: null }, 'Alicia') })).status, 200)
    assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alicia').avatar, null)
  } finally { sql.close() }
})

test('unauthenticated, banned and revoked sessions cannot change account pictures', async () => {
  const { sql, env } = database()
  try {
    assert.equal((await onRequestPut({ env, request: await request({ avatar: picture }, null) })).status, 401)
    sql.prepare('UPDATE players SET banned_at = ? WHERE username = ?').run(new Date().toISOString(), 'Alice')
    assert.equal((await onRequestPut({ env, request: await request({ avatar: picture }) })).status, 401)
    sql.prepare('UPDATE players SET banned_at = NULL, tokens_valid_from = ? WHERE username = ?').run(new Date(Date.now() + 10000).toISOString(), 'Alice')
    assert.equal((await onRequestPut({ env, request: await request({ avatar: picture }) })).status, 401)
    assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alice').avatar, null)
  } finally { sql.close() }
})

test('bad JSON, missing avatar, unsupported styles and oversized bodies are rejected', async () => {
  const { sql, env } = database()
  try {
    for (const body of ['bad-json', '{}', 'null', { avatar: { style: 'outside', seed: 'a' } }, { avatar: { ...picture, seed: '' } }, 'x'.repeat(1025), JSON.stringify({ avatar: picture, ignored: 'ø'.repeat(600) })]) {
      assert.equal((await onRequestPut({ env, request: await request(body) })).status, 400)
    }
    assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alice').avatar, null)
  } finally { sql.close() }
})

test('customization allowlist matches installed artwork and every choice affects its rendering', async () => {
  for (const [name, { variants, colors }] of Object.entries(AVATAR_CUSTOMIZATION)) {
    const { default: definition } = await import(`@dicebear/styles/${name}.json`, { with: { type: 'json' } })
    const style = new Style(definition)
    const render = options => new Avatar(style, { seed: picture.seed, idRandomization: false, ...options }).toString()
    for (const [key, values] of Object.entries(variants)) {
      assert.deepEqual(values, Object.keys(definition.components[key.replace(/Variant$/, '')].variants))
      // A selected feature must be reflected in the image, not just saved as metadata.
      assert.notEqual(render({ [key]: values[0] }), render({ [key]: values[1] }), `${name}: ${key}`)
    }
    for (const color of colors) {
      assert.notEqual(render({ [color]: '#112233' }), render({ [color]: '#abcdef' }), `${name}: ${color}`)
    }
  }
})

test('customized pictures persist through the account API for every supported style', async () => {
  const { sql, env } = database()
  try {
    for (const [style, { variants, colors }] of Object.entries(AVATAR_CUSTOMIZATION)) {
      const customized = {
        style, seed: picture.seed,
        options: { ...Object.fromEntries(Object.entries(variants).map(([key, values]) => [key, values[1]])), ...Object.fromEntries(colors.map(key => [key, '#12abEF'])) },
      }
      const saved = await onRequestPut({ env, request: await request({ avatar: customized, username: 'Bob' }) })
      assert.equal(saved.status, 200)
      assert.deepEqual(await saved.json(), { avatar: customized })
      const profile = await onRequestGet({ env, request: await request(null, 'Alice', 'GET') })
      assert.deepEqual((await profile.json()).avatar, customized)
      assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Bob').avatar, null)
    }
    // Saving an old-style avatar clears all customization and remains compatible.
    await onRequestPut({ env, request: await request({ avatar: picture }) })
    assert.deepEqual(readAvatar(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alice').avatar), picture)
    await onRequestPut({ env, request: await request({ avatar: null }) })
    assert.equal(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alice').avatar, null)
  } finally { sql.close() }
})

test('invalid or cross-style customization is rejected without changing a saved picture', async () => {
  const { sql, env } = database()
  try {
    await onRequestPut({ env, request: await request({ avatar: picture }) })
    for (const options of [null, [], 'oops', { backgroundColor: '#fff' }, { backgroundColor: 'url(https://example.com)' }, { backgroundColor: 123 }, { eyesVariant: ['happy'] }, { eyesVariant: 'wink' }, { hairVariant: 'long01' }, { url: 'https://outside.example' }, { size: 4096 }, { __proto__: null, constructor: 'happy' }]) {
      const avatar = { ...picture, options }
      assert.equal(validAvatar(avatar), false)
      assert.equal((await onRequestPut({ env, request: await request({ avatar }) })).status, 400)
      assert.deepEqual(readAvatar(sql.prepare('SELECT avatar FROM players WHERE username = ?').get('Alice').avatar), picture)
    }
    assert.equal(validAvatar({ ...picture, options: {} }), true)
  } finally { sql.close() }
})

test('avatar image endpoint renders valid choices as SVG and rejects everything else', async () => {
  const { onRequestGet: render } = await import('../functions/api/avatar.js')
  const get = query => render({ request: new Request(`https://spillarena.no/api/avatar?${query}`) })
  const ok = await get('style=bottts&seed=test-picture-123&o=' + encodeURIComponent('{"eyesVariant":"happy"}'))
  assert.equal(ok.status, 200)
  assert.equal(ok.headers.get('Content-Type'), 'image/svg+xml')
  assert.match(await ok.text(), /^<svg/)
  for (const query of ['style=nope&seed=a', 'style=bottts&seed=%3Cscript%3E', 'style=bottts', 'style=bottts&seed=a&o=%7Bbad', 'style=bottts&seed=a&o=' + encodeURIComponent('{"url":"x"}')]) {
    assert.equal((await get(query)).status, 400, query)
  }
})

test('GET /account/avatar returns the signed-in avatar only', async () => {
  const { onRequestGet: read } = await import('../functions/api/account/avatar.js')
  const { sql, env } = database()
  try {
    await onRequestPut({ env, request: await request({ avatar: picture }) })
    const response = await read({ env, request: new Request('https://spillarena.no/api/account/avatar', { headers: { Authorization: `Bearer ${await issueToken(secret, 'Alice')}` } }) })
    assert.deepEqual((await response.json()).avatar, picture)
    assert.equal((await read({ env, request: new Request('https://spillarena.no/api/account/avatar') })).status, 401)
  } finally { sql.close() }
})

test('avatar image by username: only players who chose one, and only valid names', async () => {
  const { onRequestGet: render } = await import('../functions/api/avatar.js')
  const { sql, env } = database()
  try {
    await onRequestPut({ env, request: await request({ avatar: picture }) })
    const get = u => render({ env, request: new Request(`https://spillarena.no/api/avatar?u=${encodeURIComponent(u)}`) })
    const hit = await get('Alice')
    assert.equal(hit.status, 200)
    assert.match(await hit.text(), /^<svg/)
    assert.equal((await get('Bob')).status, 404)
    assert.equal((await get('Nobody')).status, 404)
    assert.equal((await get('<script>')).status, 404)
  } finally { sql.close() }
})
