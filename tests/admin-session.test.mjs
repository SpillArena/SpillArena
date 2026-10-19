import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { ADMIN_TOKEN_TTL_MS, MAX_FAILED, hashPin, issueAdminToken, issueToken, newSalt } from '../shared/account-server.js'
import { onRequestDelete, onRequestPost } from '../functions/api/admin/session.js'
import { onRequestGet as overview } from '../functions/api/admin/index.js'
import { onRequestGet as profile } from '../functions/api/profile/index.js'

/*
 * The admin panel's own token: the PIN again, fifteen minutes, and the
 * 30-day session token alone no longer opens /api/admin/*.
 */

const secret = 'admin-session-local-test-secret'

async function database() {
  const sql = new DatabaseSync(':memory:')
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'))
  for (const [username, admin] of [['Emil', 1], ['Kari', 0]]) {
    const salt = newSalt()
    sql.prepare('INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen, admin) VALUES (?, ?, ?, ?, ?, ?)')
      .run(username, await hashPin('1234', salt), salt, new Date().toISOString(), new Date().toISOString(), admin)
  }
  const statement = (query, values = []) => {
    const prepared = sql.prepare(query)
    return {
      bind: (...next) => statement(query, next),
      first: async () => prepared.get(...values) ?? null,
      all: async () => ({ results: prepared.all(...values) }),
      run: async () => ({ meta: { changes: prepared.run(...values).changes } }),
    }
  }
  const DB = {
    prepare: query => statement(query),
    batch: async statements => {
      sql.exec('BEGIN')
      try {
        const results = []
        for (const item of statements) results.push(await item.run())
        sql.exec('COMMIT')
        return results
      } catch (error) {
        sql.exec('ROLLBACK')
        throw error
      }
    },
  }
  return { sql, env: { AUTH_SECRET: secret, DB } }
}

const request = (path, token, init = {}) =>
  new Request(`https://spillarena.no${path}`, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
  })
const unlock = (env, token, pin) =>
  onRequestPost({ env, request: request('/api/admin/session', token, { method: 'POST', body: JSON.stringify({ pin }) }) })
const openOverview = (env, token) => overview({ env, request: request('/api/admin', token) })

test('the 30-day session token alone no longer opens the admin API', async () => {
  const { env } = await database()
  const response = await openOverview(env, await issueToken(secret, 'Emil'))
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'pin_required' })
})

test("a non-admin is told forbidden, with or without the PIN, so the answer reveals nothing new", async () => {
  const { env } = await database()
  const kari = await issueToken(secret, 'Kari')
  assert.deepEqual(await (await openOverview(env, kari)).json(), { error: 'forbidden' })
  const unlocked = await unlock(env, kari, '1234')
  assert.equal(unlocked.status, 403)
  assert.deepEqual(await unlocked.json(), { error: 'forbidden' })
  // and a forged admin scope on a non-admin account gets no further
  assert.deepEqual(await (await openOverview(env, await issueAdminToken(secret, 'Kari'))).json(), { error: 'forbidden' })
})

test('the right PIN gives a fifteen-minute admin token that opens the panel, and is logged', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-19T10:00:00Z') })
  const { env, sql } = await database()
  const response = await unlock(env, await issueToken(secret, 'Emil'), '1234')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  const { token, expiresAt } = await response.json()
  assert.equal(expiresAt, Date.now() + ADMIN_TOKEN_TTL_MS)
  assert.equal((await openOverview(env, token)).status, 200)
  const log = sql.prepare('SELECT admin, action, target FROM admin_log').all()
  assert.deepEqual(log.map(row => ({ ...row })), [{ admin: 'Emil', action: 'open-panel', target: 'Emil' }])

  t.mock.timers.tick(ADMIN_TOKEN_TTL_MS + 1)
  assert.equal((await openOverview(env, token)).status, 401, 'expired after fifteen minutes')
})

test('wrong PINs count towards the same lockout as signing in, without signing the admin out', async () => {
  const { env, sql } = await database()
  const session = await issueToken(secret, 'Emil')
  const wrong = await unlock(env, session, '9999')
  assert.equal(wrong.status, 401)
  assert.deepEqual(await wrong.json(), { error: 'bad_credentials' })
  assert.equal(sql.prepare("SELECT failed FROM players WHERE username = 'Emil'").get().failed, 1)

  for (let attempt = 2; attempt <= MAX_FAILED; attempt++) await unlock(env, session, '9999')
  const locked = await unlock(env, session, '1234')
  assert.equal(locked.status, 429)
  assert.equal((await locked.json()).error, 'locked')
  assert.ok(sql.prepare("SELECT locked_until FROM players WHERE username = 'Emil'").get().locked_until)
  // the session itself still works for the rest of the site
  assert.equal((await profile({ env, request: request('/api/profile', session) })).status, 200)
})

test('a malformed PIN or body is refused before any hashing', async () => {
  const { env } = await database()
  const session = await issueToken(secret, 'Emil')
  assert.deepEqual(await (await unlock(env, session, '12')).json(), { error: 'bad_pin' })
  const broken = await onRequestPost({ env, request: request('/api/admin/session', session, { method: 'POST', body: '{' }) })
  assert.deepEqual(await broken.json(), { error: 'bad_body' })
  assert.equal((await unlock(env, null, '1234')).status, 401)
})

test('closing the panel revokes the admin token, but never the session token', async () => {
  const { env } = await database()
  const session = await issueToken(secret, 'Emil')
  const { token } = await (await unlock(env, session, '1234')).json()
  const close = await onRequestDelete({ env, request: request('/api/admin/session', token, { method: 'DELETE' }) })
  assert.deepEqual(await close.json(), { signedOut: true })
  assert.equal((await openOverview(env, token)).status, 401)

  await onRequestDelete({ env, request: request('/api/admin/session', session, { method: 'DELETE' }) })
  assert.equal((await profile({ env, request: request('/api/profile', session) })).status, 200)
})
