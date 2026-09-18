/**
 * Profilen ett spill lagrer på kontoen.
 *
 * GET    /api/profile/<spill>  → 200 { game, progress: object | null, updatedAt: string | null }
 * POST   /api/profile/<spill>  { ...vilkårlig JSON }  → 200 { game, updatedAt }
 * DELETE /api/profile/<spill>  → 200 { game, deleted: boolean }
 *
 * Alt et spill lagrer her lever på enheten fra før, og spillet virker uten
 * dette endepunktet akkurat som det alltid har gjort. Det dette gjør er å
 * speile det samme dokumentet til kontoen, slik at det overlever enhetsbytte og
 * nettleserrydding — og slik at det følger spilleren til et annet spill uten en
 * ny innlogging.
 *
 * FORMEN PÅ `progress` EIES AV SPILLET. Tjeneren her sjekker bare at dokumentet
 * ikke kan sprenge raden (se validateDocument i shared/games-registry.js).
 * Grunnen er at formen endrer seg oftere enn en utrulling av forsiden er verdt,
 * og at feil vei å bomme alltid er å avvise for mye: en profil som ikke kan
 * lagres er tapt, en profil med et felt tjeneren ikke kjenner er bare et felt
 * til.
 *
 * Brukernavnet kommer fra det signerte tegnet, aldri fra kroppen eller fra et
 * spørringsledd. Se shared/account-server.js.
 */

import { json, requireUser } from '../../../shared/account-server.js'
import { MAX_BODY_BYTES, isGame, validateDocument } from '../../../shared/games-registry.js'

/** Spillet i ruta, eller et ferdig 404-svar. Ukjent navn er ikke en tom profil. */
function resolveGame(params) {
  const game = typeof params.game === 'string' ? params.game.toLowerCase() : ''
  return isGame(game) ? { game } : { response: json({ error: 'unknown_game' }, 404) }
}

export async function onRequestGet(context) {
  const { env, request, params } = context
  const target = resolveGame(params)
  if (target.response) return target.response

  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  try {
    const row = await env.DB.prepare(
      `SELECT data, updated_at AS updatedAt FROM player_progress WHERE username = ? AND game = ?`,
    )
      .bind(auth.username, target.game)
      .first()
    if (!row) return json({ game: target.game, progress: null, updatedAt: null })
    return json({ game: target.game, progress: JSON.parse(row.data), updatedAt: row.updatedAt })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}

export async function onRequestPost(context) {
  const { env, request, params } = context
  const target = resolveGame(params)
  if (target.response) return target.response

  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'body_too_large' }, 413)

  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: 'bad_body' }, 400)
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return json({ error: 'bad_body' }, 400)
  }

  const invalid = validateDocument(body)
  if (invalid) return json({ error: invalid }, 400)

  const updatedAt = new Date().toISOString()
  try {
    await env.DB.prepare(
      `INSERT INTO player_progress (username, game, data, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(username, game)
       DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
      .bind(auth.username, target.game, JSON.stringify(body), updatedAt)
      .run()
    return json({ game: target.game, updatedAt })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}

/** Nullstiller profilen for ett spill. Kontoen og de andre spillene blir stående. */
export async function onRequestDelete(context) {
  const { env, request, params } = context
  const target = resolveGame(params)
  if (target.response) return target.response

  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  try {
    const result = await env.DB.prepare(
      `DELETE FROM player_progress WHERE username = ? AND game = ?`,
    )
      .bind(auth.username, target.game)
      .run()
    return json({ game: target.game, deleted: (result.meta?.changes ?? 0) > 0 })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
