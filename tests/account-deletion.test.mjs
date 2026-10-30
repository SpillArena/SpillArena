import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { hashPin, issueToken, MAX_FAILED, newSalt, requireUser, tokenHash } from '../shared/account-server.js'
import { BOARDS } from '../shared/admin-server.js'
import { onRequestDelete } from '../functions/api/account/index.js'

const secret = 'account-deletion-test-secret'

async function database(t) {
  const sql = new DatabaseSync(':memory:')
  t.after(() => sql.close())
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
    sql.exec(readFileSync(new URL(file, migrations), 'utf8'))
  }
  for (const username of ['Alice', 'Bob']) {
    const salt = newSalt()
    sql.prepare('INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen, avatar, recovery_hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(username, await hashPin('1234', salt), salt, new Date().toISOString(), new Date().toISOString(), '{"style":"bottts","seed":"test"}', 'recovery-hash')
    sql.prepare('INSERT INTO player_progress VALUES (?, ?, ?, ?)').run(username, 'hangbot', '{"xp":500}', '2026-10-30')
    sql.prepare('INSERT INTO contact_messages (created_at, topic, email, message, username, account_info) VALUES (?, ?, ?, ?, ?, ?)')
      .run('2026-10-30', 'other', 'test@example.com', 'Message', username.toLowerCase(), JSON.stringify({ username }))
    sql.prepare('INSERT INTO admin_log (at, admin, action, target, details) VALUES (?, ?, ?, ?, ?)')
      .run('2026-10-30', username.toLowerCase(), 'rename', username.toLowerCase(), JSON.stringify({ from: username, to: username }))
    for (const board of BOARDS) {
      // Populate every real migrated leaderboard, including all required fields.
      const columns = sql.prepare(`PRAGMA table_info(${board.table})`).all().filter(column => column.pk !== 1 || column.type !== 'INTEGER')
      const values = columns.map(({ name, type }) => {
        if (name === 'username' || name === 'nickname') return username.toLowerCase()
        if (name === 'username_key') return username.toLowerCase()
        if (name === 'client_id') return `account:${username.toLowerCase()}`
        if (name === 'id') return `${board.game}-${username}`
        if (name === 'difficulty') return 'easy'
        if (name === 'result') return 'won'
        return type === 'INTEGER' ? 1 : 'test'
      })
      sql.prepare(`INSERT INTO ${board.table} (${columns.map(column => column.name).join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...values)
    }
  }
  const statement = (query, values = []) => ({
    bind: (...next) => statement(query, next),
    first: async () => sql.prepare(query).get(...values) ?? null,
    all: async () => ({ results: sql.prepare(query).all(...values) }),
    run: async () => ({ meta: { changes: sql.prepare(query).run(...values).changes } }),
  })
  const DB = {
    prepare: query => statement(query),
    batch: async statements => {
      sql.exec('BEGIN')
      try {
        const results = []
        for (const item of statements) results.push(await item.run())
        sql.exec('COMMIT')
        return results
      } catch (error) { sql.exec('ROLLBACK'); throw error }
    },
  }
  return { sql, env: { DB, AUTH_SECRET: secret }, token: await issueToken(secret, 'Alice') }
}

function request(token, body = { pin: '1234' }) {
  return new Request('https://spillarena.no/api/account?u=Bob', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
const remove = (env, token, body) => onRequestDelete({ env, request: request(token, body) })

test('deletes only the authenticated account and all linked shared-database data', async t => {
  const { env, sql, token } = await database(t)
  sql.prepare('UPDATE players SET banned_by = ? WHERE username = ?').run('alice', 'Bob')
  const response = await remove(env, token, { pin: '1234', username: 'Bob' })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(await response.json(), { deleted: true })
  for (const table of ['players', 'player_progress', 'contact_messages', 'admin_log', ...BOARDS.map(board => board.table)]) {
    const rows = sql.prepare(`SELECT * FROM ${table}`).all()
    assert.equal(rows.length, 1, `${table}: only Bob remains`)
    assert.match(JSON.stringify(rows[0]), /bob/i)
    assert.doesNotMatch(JSON.stringify(rows[0]), /alice/i)
  }
  assert.equal((await requireUser(env, request(token))).response.status, 401)
})

test('wrong PIN, malformed bodies and missing authentication leave data in place', async t => {
  const { env, sql, token } = await database(t)
  for (const [body, status] of [[{ pin: '9999' }, 401], [{}, 400], [null, 400], ['bad-json', 400], [{ pin: '12' }, 400]]) {
    assert.equal((await remove(env, token, body)).status, status)
  }
  assert.equal((await remove(env, null)).status, 401)
  assert.equal(sql.prepare('SELECT count(*) AS n FROM players').get().n, 2)
  assert.equal(sql.prepare('SELECT count(*) AS n FROM player_progress').get().n, 2)
})

test('guest daily scores with the same nickname are not deleted', async t => {
  const { env, sql, token } = await database(t)
  for (const table of ['proportionpanic_daily_scores', 'pixelpanic_daily_scores']) {
    sql.prepare(`INSERT INTO ${table} (date, client_id, nickname, total_score, rounds_json) VALUES (?, ?, ?, ?, ?)`)
      .run('2026-10-30', 'guest:unrelated-device', 'Alice', 123, '[]')
  }
  assert.equal((await remove(env, token)).status, 200)
  for (const table of ['proportionpanic_daily_scores', 'pixelpanic_daily_scores']) {
    assert.equal(sql.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 2)
    assert.equal(sql.prepare(`SELECT nickname FROM ${table} WHERE client_id = ?`).get('guest:unrelated-device').nickname, 'Alice')
  }
})

test('repeated incorrect PINs lock deletion; a correct PIN cannot bypass lockout', async t => {
  const { env, sql, token } = await database(t)
  for (let attempt = 0; attempt < MAX_FAILED; attempt++) await remove(env, token, { pin: '9999' })
  const locked = await remove(env, token)
  assert.equal(locked.status, 429)
  assert.ok((await locked.json()).retryAfter > 0)
  assert.equal(sql.prepare('SELECT count(*) AS n FROM players').get().n, 2)
})

test('banned and revoked sessions cannot delete data', async t => {
  const { env, sql, token } = await database(t)
  sql.prepare('UPDATE players SET banned_at = ? WHERE username = ?').run(new Date().toISOString(), 'Alice')
  assert.equal((await remove(env, token)).status, 401)
  sql.prepare('UPDATE players SET banned_at = NULL WHERE username = ?').run('Alice')
  sql.prepare('INSERT INTO revoked_tokens VALUES (?, ?)').run(await tokenHash(token), new Date(Date.now() + 10000).toISOString())
  assert.equal((await remove(env, token)).status, 401)
  assert.equal(sql.prepare('SELECT count(*) AS n FROM players').get().n, 2)
})

test('a failed database write rolls back account, progress, boards and messages together', async t => {
  const { env, sql, token } = await database(t)
  sql.exec("CREATE TRIGGER fail_delete BEFORE DELETE ON players BEGIN SELECT RAISE(ABORT, 'test failure'); END")
  t.mock.method(console, 'error', () => {})
  const response = await remove(env, token)
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'service_failed' })
  for (const table of ['players', 'player_progress', 'contact_messages', 'admin_log', ...BOARDS.map(board => board.table)]) {
    assert.equal(sql.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 2, `${table}: no partial deletion`)
  }
})

test('a deleted account session cannot access a new account using the same username', async t => {
  const { env, sql, token } = await database(t)
  assert.equal((await remove(env, token)).status, 200)
  const createdAt = Date.now() + 1
  sql.prepare('INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
    .run('Alice', 'new-hash', 'new-salt', new Date(createdAt).toISOString(), new Date(createdAt).toISOString())
  assert.equal((await requireUser(env, request(token))).response.status, 401)
  assert.equal((await requireUser(env, request(await issueToken(secret, 'Alice', createdAt)))).username, 'Alice')
})
