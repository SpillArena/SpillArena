/**
 * Kontaktskjemaet.
 *
 * POST /api/contact { topic, name?, email, message, lang, website, t }
 *   → 200 { sent: true }
 *   → 400 { error: 'bad_body' | 'bad_topic' | 'bad_name' | 'bad_email' | 'message_short' | 'message_long' }
 *   → 413 { error: 'too_large' }
 *   → 429 { error: 'rate_limited' }   (Retry-After i sekunder)
 *
 * Åpent for alle, innlogget eller ikke. En innlogget avsender verifiseres mot
 * konto og tilbakekalte økter. Kontoopplysningene hentes fra databasen.
 *
 * `website` er en honningfelle (skjult for mennesker) og `t` er millisekunder
 * siden skjemaet ble vist. Slår en av dem ut, svarer vi 200 uten å lagre.
 */

import { json, serviceFailed } from '../../shared/account-server.js'
import {
  HOUR_MS,
  MAX_BODY_BYTES,
  MAX_PER_HOUR,
  RETENTION_MS,
  contactAccount,
  mailConfigured,
  notifyStoredContact,
  senderHash,
  validateContact,
} from '../../shared/contact-server.js'

export async function onRequestPost(context) {
  const { env, request } = context

  const declared = Number(request.headers.get('Content-Length') ?? 0)
  if (declared > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413)

  let body
  try {
    const reader = request.body?.getReader()
    if (!reader) return json({ error: 'bad_body' }, 400)
    const decoder = new TextDecoder()
    let text = ''
    let bytes = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel()
        return json({ error: 'too_large' }, 413)
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    body = JSON.parse(text)
  } catch {
    return json({ error: 'bad_body' }, 400)
  }

  const checked = validateContact(body)
  if (checked.spam) return json({ sent: true })
  if (checked.error) return json({ error: checked.error }, 400)

  try {
    const now = new Date()
    const hash = await senderHash(env.AUTH_SECRET, request.headers.get('CF-Connecting-IP'), now)
    const hourAgo = new Date(now.getTime() - HOUR_MS).toISOString()

    const recent = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM contact_messages WHERE ip_hash = ? AND created_at > ?`,
    )
      .bind(hash, hourAgo)
      .first()
    if ((recent?.n ?? 0) >= MAX_PER_HOUR) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '600' },
      })
    }

    const identity = await contactAccount(env, request)
    if (identity.response) return identity.response
    const account = identity.account
    const username = account?.username ?? null
    const message = { ...checked.value, username, account }

    const [stored] = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO contact_messages (created_at, topic, name, email, message, lang, username, ip_hash, account_info, notification_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        now.toISOString(),
        message.topic,
        message.name || null,
        message.email,
        message.message,
        message.lang,
        username,
        hash,
        account ? JSON.stringify(account) : null,
        mailConfigured(env) ? 'pending' : 'not_configured',
      ),
      env.DB.prepare(`DELETE FROM contact_messages WHERE created_at < ?`).bind(
        new Date(now.getTime() - RETENTION_MS).toISOString(),
      ),
    ])

    if (mailConfigured(env)) {
      const mail = notifyStoredContact(env, { ...message, id: stored.meta.last_row_id })
      if (context.waitUntil) context.waitUntil(mail)
      else await mail
    }

    return json({ sent: true })
  } catch (error) {
    return serviceFailed(error)
  }
}
