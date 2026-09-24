/**
 * Spillerlista i adminpanelet.
 *
 * GET /api/admin/players?q=<søk>&filter=<filter>&sort=<rekkefølge>&offset=<n>
 *   → 200 { players: [...], total, offset, limit }
 *
 * filter: all | banned | admins | locked
 * sort:   seen | created | name | xp
 *
 * XP er summen av `xp` i hvert spill sitt profildokument. Formen på dokumentet
 * eies av spillet, men `xp` er felles for alle (se src/account/progress.ts), og
 * det er det eneste feltet som leses her.
 */

import { json } from '../../../shared/account-server.js'
import { requireAdmin } from '../../../shared/admin-server.js'

const PAGE = 50
const MAX_QUERY = 40

/** Nå, som ISO-8601 med millisekunder — samme form som `toISOString()` skriver. */
const NOW_SQL = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`

/*
 * Hvitelister, ikke strenger fra klienten rett inn i SQL. Alt som ikke står
 * her faller tilbake på standarden.
 */
const FILTERS = {
  all: '1 = 1',
  banned: 'p.banned_at IS NOT NULL',
  admins: 'p.admin = 1',
  locked: `p.locked_until > ${NOW_SQL}`,
}

const SORTS = {
  seen: 'p.last_seen DESC',
  created: 'p.created_at DESC',
  name: 'p.username COLLATE NOCASE ASC',
  xp: 'xp DESC, p.last_seen DESC',
}

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  const params = new URL(request.url).searchParams
  const query = (params.get('q') ?? '').trim().slice(0, MAX_QUERY)
  const filter = FILTERS[params.get('filter')] ?? FILTERS.all
  const sort = SORTS[params.get('sort')] ?? SORTS.seen
  const offset = Math.max(0, Number.parseInt(params.get('offset') ?? '0', 10) || 0)

  // % og _ er jokertegn i LIKE; et navn med understrek skal søkes som seg selv
  const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`

  try {
    const [page, count] = await Promise.all([
      env.DB.prepare(
        `SELECT p.username,
                p.admin,
                p.created_at   AS createdAt,
                p.last_seen    AS lastSeen,
                p.banned_at    AS bannedAt,
                p.locked_until > ${NOW_SQL} AS locked,
                COUNT(pp.game) AS games,
                COALESCE(SUM(CASE WHEN json_valid(pp.data) THEN json_extract(pp.data, '$.xp') END), 0) AS xp
         FROM players p
         LEFT JOIN player_progress pp ON pp.username = p.username
         WHERE p.username LIKE ?1 ESCAPE '\\' AND ${filter}
         GROUP BY p.username
         ORDER BY ${sort}
         LIMIT ?2 OFFSET ?3`,
      )
        .bind(pattern, PAGE, offset)
        .all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total FROM players p WHERE p.username LIKE ?1 ESCAPE '\\' AND ${filter}`,
      )
        .bind(pattern)
        .first(),
    ])

    const players = (page.results ?? []).map((row) => ({
      ...row,
      admin: row.admin === 1,
      locked: Boolean(row.locked),
      xp: Math.max(0, Math.round(Number(row.xp) || 0)),
    }))

    return json({ players, total: count?.total ?? 0, offset, limit: PAGE })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
