/**
 * Kontaktskjemaet.
 *
 * POST /api/contact { topic, name?, email, message, lang, website, t }
 *   → 200 { sent: true }
 *   → 400 { error: 'bad_body' | 'bad_topic' | 'bad_name' | 'bad_email' | 'message_short' | 'message_long' }
 *   → 413 { error: 'too_large' }
 *   → 429 { error: 'rate_limited' }   (Retry-After i sekunder)
 *
 * Åpent for alle, innlogget eller ikke. Er tegnet gyldig, lagres brukernavnet
 * med meldingen — og det kommer ALLTID fra tegnet, aldri fra kroppen.
 *
 * `website` er en honningfelle (skjult for mennesker) og `t` er millisekunder
 * siden skjemaet ble vist. Slår en av dem ut, svarer vi 200 uten å lagre.
 */

import { bearer, json, serviceFailed, verifyToken } from '../../shared/account-server.js'
import {
  HOUR_MS,
  MAX_BODY_BYTES,
  MAX_PER_HOUR,
  RETENTION_MS,
  notifySupport,
  senderHash,
  validateContact,
} from '../../shared/contact-server.js'

export async function onRequestPost(context) {
  const { env, request } = context

  const declared = Number(request.headers.get('Content-Length') ?? 0)
  if (declared > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413)

  let body
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413)
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

    const username = env.AUTH_SECRET ? await verifyToken(env.AUTH_SECRET, bearer(request)) : null
    const message = { ...checked.value, username }

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO contact_messages (created_at, topic, name, email, message, lang, username, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        now.toISOString(),
        message.topic,
        message.name || null,
        message.email,
        message.message,
        message.lang,
        username,
        hash,
      ),
      env.DB.prepare(`DELETE FROM contact_messages WHERE created_at < ?`).bind(
        new Date(now.getTime() - RETENTION_MS).toISOString(),
      ),
    ])

    const mail = notifySupport(env, message)
    if (context.waitUntil) context.waitUntil(mail)
    else await mail

    return json({ sent: true })
  } catch (error) {
    return serviceFailed(error)
  }
}
