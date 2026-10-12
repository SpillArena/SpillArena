/**
 * Meldingene fra kontaktskjemaet, for adminpanelet.
 *
 * GET    /api/admin/messages          → 200 { messages: [...], open }
 * POST   /api/admin/messages          { id, status: 'new' | 'done' } → 200 { ok: true }
 * DELETE /api/admin/messages?id=<n>   → 200 { ok: true }
 *
 * Alt går gjennom requireAdmin, som slår opp kontoen på hvert kall.
 */

import { json, serviceFailed } from '../../../shared/account-server.js'
import { requireAdmin } from '../../../shared/admin-server.js'

const LIMIT = 200

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response
  try {
    const [rows, open] = await Promise.all([
      env.DB.prepare(
        `SELECT id, created_at AS createdAt, topic, name, email, message, lang, username, status
         FROM contact_messages ORDER BY id DESC LIMIT ?`,
      )
        .bind(LIMIT)
        .all(),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'`).first(),
    ])
    return json({ messages: rows.results ?? [], open: open?.n ?? 0 })
  } catch (error) {
    return serviceFailed(error)
  }
}

export async function onRequestPost(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_body' }, 400)
  }
  if (!Number.isInteger(body?.id) || !['new', 'done'].includes(body?.status)) {
    return json({ error: 'bad_body' }, 400)
  }
  try {
    const result = await env.DB.prepare(`UPDATE contact_messages SET status = ? WHERE id = ?`)
      .bind(body.status, body.id)
      .run()
    if (!result.meta?.changes) return json({ error: 'not_found' }, 404)
    return json({ ok: true })
  } catch (error) {
    return serviceFailed(error)
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id < 1) return json({ error: 'bad_body' }, 400)
  try {
    const result = await env.DB.prepare(`DELETE FROM contact_messages WHERE id = ?`).bind(id).run()
    if (!result.meta?.changes) return json({ error: 'not_found' }, 404)
    return json({ ok: true })
  } catch (error) {
    return serviceFailed(error)
  }
}
