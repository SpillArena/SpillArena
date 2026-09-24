/**
 * Oversikten øverst i adminpanelet.
 *
 * GET /api/admin → 200 { stats, games: [{ game, players, lastAt }], log: [...] }
 *                → 403 { error: 'forbidden' } for alle som ikke er admin
 *
 * Tallene regnes ut på stedet. Tabellene er små nok til at det er billigere
 * enn å holde tellere i sync.
 */

import { json } from '../../../shared/account-server.js'
import { readLog, requireAdmin } from '../../../shared/admin-server.js'
import { GAMES } from '../../../shared/games-registry.js'

const DAY_MS = 24 * 60 * 60 * 1000
const LOG_LIMIT = 50

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  const now = Date.now()
  // ISO-8601 sorterer som tekst, så «etter i går» er en vanlig sammenligning
  const dayAgo = new Date(now - DAY_MS).toISOString()
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString()
  const nowIso = new Date(now).toISOString()

  try {
    const [totals, perGame, log] = await Promise.all([
      env.DB.prepare(
        `SELECT COUNT(*) AS players,
                COALESCE(SUM(last_seen >= ?1), 0)           AS activeDay,
                COALESCE(SUM(last_seen >= ?2), 0)           AS activeWeek,
                COALESCE(SUM(created_at >= ?2), 0)          AS newWeek,
                COALESCE(SUM(banned_at IS NOT NULL), 0)     AS banned,
                COALESCE(SUM(admin = 1), 0)                 AS admins,
                COALESCE(SUM(locked_until > ?3), 0)         AS locked
         FROM players`,
      )
        .bind(dayAgo, weekAgo, nowIso)
        .first(),
      env.DB.prepare(
        `SELECT game, COUNT(*) AS players, MAX(updated_at) AS lastAt
         FROM player_progress GROUP BY game`,
      ).all(),
      env.DB.prepare(
        `SELECT id, at, admin, action, target, details FROM admin_log ORDER BY id DESC LIMIT ?`,
      )
        .bind(LOG_LIMIT)
        .all(),
    ])

    // hvert spill er med, også de ingen har spilt ennå — et hull i lista ser
    // ut som en feil, en null ser ut som en null
    const byGame = new Map((perGame.results ?? []).map((row) => [row.game, row]))
    const games = GAMES.map((game) => ({
      game,
      players: byGame.get(game)?.players ?? 0,
      lastAt: byGame.get(game)?.lastAt ?? null,
    }))

    return json({ stats: totals, games, log: readLog(log.results) })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
