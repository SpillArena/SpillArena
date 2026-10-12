import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { issueToken } from '../shared/account-server.js'
import { onRequestPut } from '../functions/api/account/avatar.js'
import { onRequestGet } from '../functions/api/profile/index.js'
import { readAvatar, validAvatar } from '../shared/avatar.js'

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
