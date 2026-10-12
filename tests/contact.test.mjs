import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { matchFaq } from '../src/lib/faqMatch.ts'
import { validateContact, senderHash, MAX_PER_HOUR } from '../shared/contact-server.js'
import { onRequestPost } from '../functions/api/contact.js'
import { issueToken } from '../shared/account-server.js'

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
      first: async () => ({ n: recent }),
      run: async () => ({ meta: { changes: 1 } }),
    }),
  })
  return {
    calls,
    prepare: (sql) => stmt(sql),
    batch: async (statements) => { calls.push(...statements); return [] },
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
  assert.deepEqual(await response.json(), { sent: true })
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
