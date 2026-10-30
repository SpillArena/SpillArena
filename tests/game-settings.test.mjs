import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { issueAdminToken, issueToken } from '../shared/account-server.js'
import { onRequestGet, onRequestPut } from '../functions/api/admin/games.js'
import { onRequestGet as publicSettings } from '../functions/api/game-settings.js'
import { GAME_DEFAULTS } from '../shared/game-settings.js'

const secret = 'game-settings-test-secret'
async function fixture() {
  const sql = new DatabaseSync(':memory:')
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'))
  for (const [username, admin] of [['Emil', 1], ['Kari', 0]]) {
    sql.prepare('INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen, admin) VALUES (?, ?, ?, ?, ?, ?)').run(username, 'unused', 'unused', new Date().toISOString(), new Date().toISOString(), admin)
  }
  function statement(query, values = []) {
    const prepared = sql.prepare(query)
    return {
      bind: (...next) => statement(query, next),
      first: async () => prepared.get(...values) ?? null,
      all: async () => ({ results: prepared.all(...values) }),
      run: async () => prepared.run(...values),
    }
  }
  const DB = {
    prepare: query => statement(query),
    batch: async statements => {
      sql.exec('BEGIN')
      try { const result = []; for (const item of statements) result.push(await item.run()); sql.exec('COMMIT'); return result }
      catch (error) { sql.exec('ROLLBACK'); throw error }
    },
  }
  const token = await issueAdminToken(secret, 'Emil')
  const env = { DB, AUTH_SECRET: secret }
  const request = (body, override = token) => new Request('https://spillarena.no/api/admin/games', {
    method: body === undefined ? 'GET' : 'PUT',
    headers: { Authorization: `Bearer ${override}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { sql, env, request, token }
}

test('migration preserves release defaults and public response contains only catalogue settings', async () => {
  const { env } = await fixture()
  const response = await publicSettings({ env })
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual((await response.json()).games, GAME_DEFAULTS)
  assert.equal(GAME_DEFAULTS.find(item => item.game === 'hitline').availability, 'coming_soon')
  assert.equal(GAME_DEFAULTS.find(item => item.game === 'cracked').availability, 'coming_soon')
})

test('read and write require the PIN-issued admin token, including current admin flag', async () => {
  const { env, request, sql, token } = await fixture()
  const edit = { game: 'hitline', availability: 'available', beta: false }
  for (const badToken of ['', await issueToken(secret, 'Emil'), await issueAdminToken(secret, 'Kari')]) {
    assert.ok([401, 403].includes((await onRequestGet({ env, request: request(undefined, badToken) })).status))
    assert.ok([401, 403].includes((await onRequestPut({ env, request: request(edit, badToken) })).status))
  }
  assert.equal((await onRequestGet({ env, request: request() })).status, 200)
  sql.exec("UPDATE players SET admin = 0 WHERE username = 'Emil'")
  assert.equal((await onRequestPut({ env, request: request(edit, token) })).status, 403)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM admin_log').get().n, 0)
})

test('status and beta persist independently, update one game, and log together', async () => {
  const { env, request, sql } = await fixture()
  for (const [availability, beta] of [['available', true], ['unavailable', true], ['coming_soon', false]]) {
    assert.equal((await onRequestPut({ env, request: request({ game: 'hitline', availability, beta }) })).status, 200)
    const games = (await (await publicSettings({ env })).json()).games
    assert.deepEqual(games.find(item => item.game === 'hitline'), { game: 'hitline', title: 'Hitline', availability, beta })
    assert.deepEqual(games.find(item => item.game === 'sipzone'), GAME_DEFAULTS.find(item => item.game === 'sipzone'))
  }
  const log = sql.prepare('SELECT admin, action, target, details FROM admin_log ORDER BY id').all()
  assert.equal(log.length, 3)
  assert.equal(log[0].admin, 'Emil'); assert.equal(log[0].action, 'game-settings'); assert.equal(log[0].target, 'hitline')
  assert.deepEqual(JSON.parse(log[0].details), { availability: 'available', beta: true })
})

test('unknown games, malformed values, oversized and invalid JSON are rejected', async () => {
  const { env, request, sql, token } = await fixture()
  for (const body of [null, {}, { game: 'unknown', availability: 'available', beta: false }, { game: 'hitline', availability: 'hidden', beta: false }, { game: 'hitline', availability: 'available', beta: 1 }]) {
    assert.equal((await onRequestPut({ env, request: request(body) })).status, 400)
  }
  for (const body of ['{', ' '.repeat(2049)]) {
    const req = new Request('https://spillarena.no/api/admin/games', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body })
    assert.equal((await onRequestPut({ env, request: req })).status, 400)
  }
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM admin_log').get().n, 0)
})

test('audit failure rolls back the status edit', async () => {
  const { env, request, sql } = await fixture()
  sql.exec("CREATE TRIGGER reject_game_log BEFORE INSERT ON admin_log BEGIN SELECT RAISE(ABORT, 'audit failed'); END")
  const original = console.error; console.error = () => {}
  try {
    assert.equal((await onRequestPut({ env, request: request({ game: 'hitline', availability: 'available', beta: false }) })).status, 500)
    assert.equal(sql.prepare("SELECT availability FROM game_settings WHERE game = 'hitline'").get().availability, 'coming_soon')
  } finally { console.error = original }
})
