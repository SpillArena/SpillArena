/**
 * Hele profilen på tvers av spillene — det forsiden viser fram.
 *
 * GET /api/profile → 200 { username, createdAt, games: { <spill>: { progress, updatedAt } } }
 *
 * Ett kall i stedet for ett per spill. Forsiden vet ikke hva som står inni
 * hvert dokument — det gjør bare spillet selv — men den vet hvilke spill kontoen
 * har spilt og når, og det er nok til en profilside.
 */

import { json, requireUser } from '../../../shared/account-server.js'

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  try {
    const [account, progress] = await Promise.all([
      env.DB.prepare(
        `SELECT username, created_at AS createdAt, last_seen AS lastSeen FROM players WHERE username = ?`,
      )
        .bind(auth.username)
        .first(),
      env.DB.prepare(
        `SELECT game, data, updated_at AS updatedAt FROM player_progress WHERE username = ?`,
      )
        .bind(auth.username)
        .all(),
    ])

    /*
     * Et gyldig tegn til en konto som ikke finnes betyr at kontoen er slettet
     * mens tegnet fortsatt var i live. 401 gjør at klienten kaster økten sin i
     * stedet for å vise en tom profil den tror den kan skrive til.
     */
    if (!account) return json({ error: 'unauthorized' }, 401)

    const games = {}
    for (const row of progress.results ?? []) {
      games[row.game] = { progress: JSON.parse(row.data), updatedAt: row.updatedAt }
    }

    return json({
      username: account.username,
      createdAt: account.createdAt,
      lastSeen: account.lastSeen,
      games,
    })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
