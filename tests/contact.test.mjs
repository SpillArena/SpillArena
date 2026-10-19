import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import nodemailer from 'nodemailer'
import { matchFaq } from '../src/lib/faqMatch.ts'
import { validateContact, senderHash, MAX_PER_HOUR, notifySupport, supportMail, smtpOptions } from '../shared/contact-server.js'
import { onRequestPost } from '../functions/api/contact.js'
import { onRequestGet as getMessages } from '../functions/api/admin/messages.js'
import { issueAdminToken, issueToken, tokenHash } from '../shared/account-server.js'

const faqOf = (lang) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}.json`, import.meta.url))).legal.faq.items
const en = faqOf('en')
const no = faqOf('no')
const top = (text, items) => matchFaq(text, items)[0]?.item.q

test('FAQ matcher finds the right entry in English', () => {
  assert.match(top('I forgot my PIN code and cannot log in', en), /forgot my PIN/i)
  assert.match(top('how do I delete my account?', en), /delete my account/i)
  assert.match(top('does this cost anything or have ads', en), /free/i)
  assert.match(top('my account is locked after too many tries', en), /locked/i)
})

test('FAQ matcher finds the right entry in Norwegian, with inflections and æøå', () => {
  assert.match(top('Jeg har glemt passordet mitt', no), /glemt PIN/i)
  assert.match(top('hvordan sletter jeg kontoen min', no), /sletter jeg kontoen/i)
  assert.match(top('koster det noe å spille?', no), /gratis/i)
  assert.match(top('fungerer spillene på telefonen min', no), /mobilen/i)
})

test('FAQ matcher understands the other language through synonyms', () => {
  assert.match(top('glemt passord', en), /forgot my PIN/i)
  assert.match(top('remove my account', no), /sletter jeg kontoen/i)
})

test('FAQ matcher stays quiet when nothing fits', () => {
  assert.deepEqual(matchFaq('', en), [])
  assert.deepEqual(matchFaq('the of and', en), [])
  assert.deepEqual(matchFaq('zxqv blorp wibble', en), [])
})

test('FAQ matcher returns at most three, best first', () => {
  const found = matchFaq('account pin username delete locked free', en)
  assert.ok(found.length <= 3)
  for (let i = 1; i < found.length; i++) assert.ok(found[i - 1].score >= found[i].score)
})

const good = { topic: 'question', name: 'Ola', email: 'ola@example.no', message: 'Hvordan fungerer det?', lang: 'no', website: '', t: 9000 }

test('validateContact accepts a good message and normalises it', () => {
  const { value } = validateContact({ ...good, name: '  Ola \u0000', message: ' Hei  \u0007 du på der ' })
  assert.equal(value.name, 'Ola')
  assert.equal(value.message, 'Hei   du på der')
})

test('validateContact rejects each bad field with its own code', () => {
  assert.equal(validateContact(null).error, 'bad_body')
  assert.equal(validateContact({ ...good, topic: 'x' }).error, 'bad_topic')
  assert.equal(validateContact({ ...good, email: 'nope' }).error, 'bad_email')
  assert.equal(validateContact({ ...good, email: 'a b@c.no' }).error, 'bad_email')
  assert.equal(validateContact({ ...good, message: 'kort' }).error, 'message_short')
  assert.equal(validateContact({ ...good, message: 'x'.repeat(2001) }).error, 'message_long')
  assert.equal(validateContact({ ...good, name: 'x'.repeat(61) }).error, 'bad_name')
  assert.equal(validateContact({ ...good, name: 5 }).error, 'bad_name')
  for (const name of [undefined, null, '', '   ', '\u0000']) {
    assert.equal(validateContact({ ...good, name }).error, 'bad_name')
  }
})

test('validateContact flags bots: filled honeypot or an instant submit', () => {
  assert.equal(validateContact({ ...good, website: 'http://spam' }).spam, true)
  assert.equal(validateContact({ ...good, t: 100 }).spam, true)
  assert.equal(validateContact({ ...good, t: undefined }).spam, undefined)
})

test('senderHash changes with the day and never contains the address', async () => {
  const a = await senderHash('s', '1.2.3.4', new Date('2026-10-12T10:00:00Z'))
  const b = await senderHash('s', '1.2.3.4', new Date('2026-10-13T10:00:00Z'))
  const c = await senderHash('s', '1.2.3.5', new Date('2026-10-12T10:00:00Z'))
  assert.notEqual(a, b)
  assert.notEqual(a, c)
  assert.ok(!a.includes('1.2.3.4'))
})

/** A tiny stand-in for D1 that records what the endpoint asks of it. */
function fakeDb({ recent = 0 } = {}) {
  const calls = []
  const stmt = (sql) => ({
    bind: (...args) => ({
      sql, args,
      first: async () => sql.includes('FROM players') ? { username: 'Kari', createdAt: '2026-01-01T00:00:00Z', lastSeen: '2026-10-12T00:00:00Z' } : { n: recent },
      run: async () => ({ meta: { changes: 1 } }),
    }),
  })
  return {
    calls,
    prepare: (sql) => stmt(sql),
    batch: async (statements) => { calls.push(...statements); return [{ meta: { last_row_id: 1 } }] },
  }
}

const post = (body, headers = {}) => new Request('https://spillarena.no/api/contact', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
})
const run = (request, env) => onRequestPost({ request, env, waitUntil: () => {} })

test('POST /api/contact stores a valid message and takes the username from the token only', async () => {
  const db = fakeDb()
  const env = { DB: db, AUTH_SECRET: 'secret' }
  const token = await issueToken('secret', 'Kari')
  const response = await run(post({ ...good, username: 'Admin' }, { Authorization: `Bearer ${token}`, 'CF-Connecting-IP': '9.9.9.9' }), env)
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.sent, true)
  assert.deepEqual(result.receipt, {
    id: 1,
    to: 'support@spillarena.no',
    subject: `[SpillArena] ${good.topic}: ${good.message.slice(0, 60)}`,
    name: good.name,
    email: good.email,
    topic: good.topic,
    message: good.message,
    lang: 'no',
    username: 'Kari',
    account: { createdAt: '2026-01-01T00:00:00Z', lastSeen: '2026-10-12T00:00:00Z' },
  })
  const insert = db.calls.find((c) => c.sql.includes('INSERT INTO contact_messages'))
  assert.ok(insert.args.includes('Kari'))
  assert.ok(!insert.args.includes('Admin'))
  assert.ok(!insert.args.includes('9.9.9.9'))
})

test('POST /api/contact silently drops honeypot hits without touching the database', async () => {
  const db = fakeDb()
  const response = await run(post({ ...good, website: 'x' }), { DB: db })
  assert.equal(response.status, 200)
  assert.equal(db.calls.length, 0)
})

test('POST /api/contact rate limits a sender', async () => {
  const response = await run(post(good), { DB: fakeDb({ recent: MAX_PER_HOUR }), AUTH_SECRET: 's' })
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '600')
})

test('POST /api/contact answers bad input with 400 and a code, and oversize with 413', async () => {
  const bad = await run(post({ ...good, email: 'x' }), { DB: fakeDb() })
  assert.equal(bad.status, 400)
  assert.equal((await bad.json()).error, 'bad_email')
  const big = await run(post({ ...good, message: 'x'.repeat(9000) }), { DB: fakeDb() })
  assert.equal(big.status, 413)
  const notJson = await run(new Request('https://x/api/contact', { method: 'POST', body: '{nope' }), { DB: fakeDb() })
  assert.equal(notJson.status, 400)
})

test('POST /api/contact does not leak database errors', async () => {
  const db = { prepare: () => ({ bind: () => ({ first: async () => { throw new Error('no such table: secret_name') } }) }) }
  const response = await run(post(good), { DB: db })
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'service_failed' })
})

/** Real migration SQL and SQL execution, behind the small D1 API used here. */
function sqliteDb(t) {
  const sql = new DatabaseSync(':memory:')
  t.after(() => sql.close())
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
    sql.exec(readFileSync(new URL(file, migrations), 'utf8'))
  }
  const prepare = (query) => {
    const statement = (args = []) => ({
      bind: (...values) => statement(values),
      first: async () => sql.prepare(query).get(...args) ?? null,
      all: async () => ({ results: sql.prepare(query).all(...args) }),
      run: async () => {
        const result = sql.prepare(query).run(...args)
        return { success: true, meta: { changes: result.changes, last_row_id: Number(result.lastInsertRowid) } }
      },
    })
    return statement()
  }
  const db = { sql, prepare, batch: async statements => {
    sql.exec('BEGIN')
    try {
      const result = []
      for (const statement of statements) result.push(await statement.run())
      sql.exec('COMMIT')
      return result
    } catch (error) { sql.exec('ROLLBACK'); throw error }
  } }
  sql.prepare(`INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen, admin)
    VALUES (?, ?, ?, ?, ?, 1)`).run('Kari', 'never-mail-this-hash', 'never-mail-this-salt', '2026-01-01T00:00:00Z', '2026-10-12T10:00:00Z')
  return db
}

async function submitAndWait(request, env) {
  const tasks = []
  const response = await onRequestPost({ request, env, waitUntil: task => tasks.push(task) })
  await Promise.all(tasks)
  return response
}

test('real schema: guest is stored with notification disabled and no forged account', async t => {
  const db = sqliteDb(t)
  const response = await submitAndWait(post({ ...good, username: 'Admin', account: { username: 'Admin' } }), { DB: db })
  assert.equal(response.status, 200)
  const row = db.sql.prepare('SELECT * FROM contact_messages').get()
  assert.equal(row.username, null)
  assert.equal(row.account_info, null)
  assert.equal(row.notification_status, 'not_configured')
})

test('real schema: signed-in message and admin inbox contain only verified account details', async t => {
  const db = sqliteDb(t)
  const env = { DB: db, AUTH_SECRET: 'test-secret' }
  const token = await issueToken(env.AUTH_SECRET, 'kari')
  const headers = { Authorization: `Bearer ${token}` }
  const response = await submitAndWait(post({ ...good, account: { username: 'Admin', createdAt: 'forged' } }, headers), env)
  assert.equal(response.status, 200)
  // the inbox is admin-only, and admin calls take the panel's own token
  const adminHeaders = { Authorization: `Bearer ${await issueAdminToken(env.AUTH_SECRET, 'kari')}` }
  const inbox = await getMessages({ env, request: new Request('https://spillarena.no/api/admin/messages', { headers: adminHeaders }) })
  assert.equal(inbox.status, 200)
  const body = await inbox.json()
  assert.equal(body.messages.length, 1)
  assert.deepEqual(body.messages[0].account, { username: 'Kari', createdAt: '2026-01-01T00:00:00Z', lastSeen: '2026-10-12T10:00:00Z' })
  assert.equal(body.messages[0].notificationStatus, 'not_configured')
  assert.doesNotMatch(JSON.stringify(body), /never-mail|pin_hash|pin_salt|test-secret|forged/)
})

test('real schema: revoked, deleted and invalid sessions cannot attach an account', async t => {
  const db = sqliteDb(t)
  const env = { DB: db, AUTH_SECRET: 'test-secret' }
  const token = await issueToken(env.AUTH_SECRET, 'Kari')
  db.sql.prepare('INSERT INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)')
    .run(await tokenHash(token), new Date(Date.now() + 86400000).toISOString())
  for (const value of [token, 'invalid', await issueToken(env.AUTH_SECRET, 'DeletedUser')]) {
    const response = await submitAndWait(post(good, { Authorization: `Bearer ${value}` }), env)
    assert.equal(response.status, 401)
  }
  assert.equal(db.sql.prepare('SELECT count(*) AS n FROM contact_messages').get().n, 0)
})

test('notification failure leaves the request successful and records failed status', async t => {
  const db = sqliteDb(t)
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }))
  t.mock.method(console, 'error', () => {})
  const response = await submitAndWait(post(good), { DB: db, RESEND_API_KEY: 'test-key' })
  assert.equal(response.status, 200)
  assert.equal(db.sql.prepare('SELECT notification_status FROM contact_messages').get().notification_status, 'failed')
})

test('Resend request uses fixed recipient, Reply-To and stable idempotency key', async t => {
  let sent
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://api.resend.com/emails')
    assert.equal(init.headers['Idempotency-Key'], 'contact/42')
    sent = JSON.parse(init.body)
    return Response.json({ id: 'provider-id' })
  })
  const status = await notifySupport({ RESEND_API_KEY: 'test-key' }, { ...good, id: 42, username: 'Kari', account: { createdAt: '2026-01-01', lastSeen: '2026-10-12' } })
  assert.equal(status, 'sent')
  assert.deepEqual(sent.to, ['support@spillarena.no'])
  assert.equal(sent.reply_to, good.email)
  assert.match(sent.text, /Konto: Kari/)
  assert.match(sent.text, /Konto opprettet: 2026-01-01/)
  assert.match(sent.html, /https:\/\/spillarena\.no\/logo\.png/)
  assert.match(sent.html, /Konto opprettet/)
  assert.match(sent.html, /Svar på meldingen/)
})

test('SMTP uses implicit TLS and passes only the intended message fields', async t => {
  const env = { SMTP_HOST: 'ymirsgren.domene.no', SMTP_USER: 'support@spillarena.no', SMTP_PASSWORD: 'test-password' }
  const db = sqliteDb(t)
  let sent
  let closed = false
  t.mock.method(nodemailer, 'createTransport', options => {
    assert.deepEqual(options, smtpOptions(env))
    assert.equal(options.secure, true)
    assert.equal(options.port, 465)
    assert.equal(options.debug, false)
    return { sendMail: async mail => { sent = mail; return { accepted: ['support@spillarena.no'] } }, close: () => { closed = true } }
  })
  const response = await submitAndWait(post(good), { ...env, DB: db })
  assert.equal(response.status, 200)
  assert.equal(db.sql.prepare('SELECT notification_status FROM contact_messages').get().notification_status, 'sent')
  assert.equal(sent.from, 'SpillArena <support@spillarena.no>')
  assert.equal(sent.replyTo, good.email)
  assert.equal(sent.messageId, '<contact-1@spillarena.no>')
  assert.match(sent.text, /Konto: \(ikke innlogget\)/)
  assert.match(sent.html, /Konto/)
  assert.ok(closed)
  assert.doesNotMatch(JSON.stringify(sent), /test-password/)
})

test('signed-in SMTP messages include verified account details', async t => {
  const env = { DB: sqliteDb(t), AUTH_SECRET: 'test-secret', SMTP_HOST: 'mail.test', SMTP_USER: 'support@spillarena.no', SMTP_PASSWORD: 'test-password' }
  const token = await issueToken(env.AUTH_SECRET, 'Kari')
  let sent
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async mail => { sent = mail; return { accepted: ['support@spillarena.no'] } }, close: () => {},
  }))
  const response = await submitAndWait(post({ ...good, username: 'forged', account: { createdAt: 'forged' } }, { Authorization: `Bearer ${token}` }), env)
  assert.equal(response.status, 200)
  assert.match(sent.text, /Konto: Kari/)
  assert.match(sent.text, /Konto opprettet: 2026-01-01T00:00:00Z/)
  assert.match(sent.text, /Sist aktiv: 2026-10-12T10:00:00Z/)
  assert.match(sent.html, /Sist aktiv/)
  assert.match(sent.html, /Konto opprettet/)
  assert.doesNotMatch(JSON.stringify(sent), /forged|never-mail-this|test-password/)
  assert.ok(!sent.text.includes(token))
})

test('SMTP authentication errors are contained and never logged with credentials', async t => {
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => { throw new Error('credentials: test-password') }, close: () => {},
  }))
  assert.equal(await notifySupport({ SMTP_HOST: 'mail.test', SMTP_USER: 'user', SMTP_PASSWORD: 'test-password' }, { ...good, id: 7 }), 'failed')
  assert.doesNotMatch(JSON.stringify(logs), /test-password/)
})

test('body limit counts UTF-8 bytes even without Content-Length', async () => {
  const response = await run(post({ ...good, message: '界'.repeat(3000) }), { DB: fakeDb() })
  assert.equal(response.status, 413)
})

test('mail composition keeps multiline user content in the body', () => {
  const mail = supportMail({}, { ...good, id: 5, message: 'Hello\r\nBcc: outsider@example.com\r\n.more content' })
  assert.doesNotMatch(mail.subject, /[\r\n]/)
  assert.equal(mail.bcc, undefined)
  assert.deepEqual(mail.to, ['support@spillarena.no'])
  assert.match(mail.html, /Hello<br>Bcc: outsider@example\.com<br>\.more content/)
})

test('HTML email escapes user-controlled names, addresses and message content', () => {
  const mail = supportMail({}, { ...good, id: 6, name: '<img src=x>', email: 'emil@example.com', message: '<script>alert(1)</script>' })
  assert.match(mail.html, /&lt;img src=x&gt;/)
  assert.match(mail.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(mail.html, /<script>|<img src=x>/)
})

test('English contact emails use English labels in both formats', () => {
  const mail = supportMail({}, { ...good, id: 7, lang: 'en' })
  assert.match(mail.text, /From:/)
  assert.match(mail.html, /Account/)
  assert.match(mail.html, /Reply to the message/)
  assert.match(mail.html, /English/)
})
