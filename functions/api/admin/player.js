/**
 * Én spiller i adminpanelet: se alt, og gjøre noe med det.
 *
 * GET    /api/admin/player?u=<navn>  → 200 { account, games, boards, log }
 * POST   /api/admin/player?u=<navn>  { action, ... }  → 200 { ok: true, ... }
 * DELETE /api/admin/player?u=<navn>  { scores?: boolean } → 200 { deleted: true }
 *
 * Handlinger (POST):
 *   ban          { reason? }        steng kontoen ute
 *   unban                           slipp den inn igjen
 *   unlock                          nullstill feilforsøk og sperren etter dem
 *   reset-pin    { pin }            ny PIN — for en spiller som har glemt sin
 *   rename       { newUsername }    for et navn filteret ikke fanget
 *   make-admin                      gi kontoen admin — se under om å ta det bort
 *   clear-scores { game }           fjern kontoens rader fra én tavle, eller 'all'
 *
 * Navnet står i `?u=` og ikke i stien — se targetOf i shared/admin-server.js.
 *
 * GRENSENE.
 *
 * En admin kan ikke utestenge, døpe om, gi ny PIN til eller slette seg selv:
 * det første låser panelet for godt, og resten har kontomenyen, som krever
 * PIN-en.
 *
 * En annen admin kan ikke utestenges, få ny PIN, døpes om eller slettes — ny
 * PIN på en annen admin er å overta kontoen deres.
 *
 * ADMIN KAN GIS HER, MEN IKKE TAS. Alle admins er likestilte, så en knapp for å
 * ta det bort ville latt hvilken som helst admin fjerne alle de andre og sitte
 * igjen alene med panelet. Å ta det bort gjøres i databasen:
 *
 *   UPDATE players SET admin = 0 WHERE username = '<navn>';
 *
 * Hver endring skrives til admin_log i SAMME batch som endringen selv.
 */

import {
  PIN_RE,
  hashPin,
  json,
  toBase64Url,
  validateUsername,
} from '../../../shared/account-server.js'
import {
  BOARDS,
  boardSummary,
  clearBoardStatements,
  existingBoards,
  logStatement,
  readLog,
  requireAdmin,
  targetOf,
} from '../../../shared/admin-server.js'

const MAX_REASON = 200
const LOG_LIMIT = 30

/** Handlinger som ikke kan rettes mot en selv — se toppen av fila. */
const NOT_ON_SELF = new Set(['ban', 'rename', 'reset-pin'])
/** Handlinger som ikke kan rettes mot en annen admin før rollen er borte. */
const NOT_ON_ADMIN = new Set(['ban', 'rename', 'reset-pin'])

/** Kontoraden bak `?u=`, eller et ferdig 400/404-svar. */
async function loadTarget(env, request) {
  const name = targetOf(request)
  if (!name) return { response: json({ error: 'bad_target' }, 400) }
  const account = await env.DB.prepare(
    `SELECT username, admin, created_at AS createdAt, last_seen AS lastSeen, failed,
            locked_until AS lockedUntil,
            COALESCE(locked_until > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 0) AS locked,
            banned_at AS bannedAt, ban_reason AS banReason, banned_by AS bannedBy
     FROM players WHERE username = ?`,
  )
    .bind(name)
    .first()
  if (!account) return { response: json({ error: 'not_found' }, 404) }
  return { account: { ...account, admin: account.admin === 1, locked: Boolean(account.locked) } }
}

const isSelf = (auth, account) => auth.username.toLowerCase() === account.username.toLowerCase()

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  try {
    const target = await loadTarget(env, request)
    if (target.response) return target.response
    const { account } = target

    const [progress, boards, log] = await Promise.all([
      env.DB.prepare(
        `SELECT game, data, updated_at AS updatedAt FROM player_progress WHERE username = ?`,
      )
        .bind(account.username)
        .all(),
      boardSummary(env, account.username),
      // loggen er nøklet på navn, og et navn kan ha tilhørt en slettet konto
      // før denne — det som skjedde før kontoen ble laget, handler ikke om den
      env.DB.prepare(
        `SELECT id, at, admin, action, target, details FROM admin_log
         WHERE target = ? COLLATE NOCASE AND at >= ? ORDER BY id DESC LIMIT ?`,
      )
        .bind(account.username, account.createdAt, LOG_LIMIT)
        .all(),
    ])

    const games = {}
    for (const row of progress.results ?? []) {
      let parsed = null
      try {
        parsed = JSON.parse(row.data)
      } catch {
        // vises som «ikke lesbar» i stedet for å felle hele profilen
      }
      games[row.game] = { progress: parsed, updatedAt: row.updatedAt }
    }

    return json({ account, games, boards, log: readLog(log.results) })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
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
  if (typeof body !== 'object' || body === null) return json({ error: 'bad_body' }, 400)

  try {
    const target = await loadTarget(env, request)
    if (target.response) return target.response
    const { account } = target
    const name = account.username
    const log = (action, details) => logStatement(env, auth.username, action, name, details)

    if (NOT_ON_SELF.has(body.action) && isSelf(auth, account)) {
      return json({ error: 'self_action' }, 400)
    }
    if (NOT_ON_ADMIN.has(body.action) && account.admin) {
      return json({ error: 'target_is_admin' }, 400)
    }

    switch (body.action) {
      case 'ban': {
        const reason =
          typeof body.reason === 'string' ? body.reason.trim().slice(0, MAX_REASON) || null : null
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE players SET banned_at = ?, ban_reason = ?, banned_by = ? WHERE username = ?`,
          ).bind(new Date().toISOString(), reason, auth.username, name),
          log('ban', reason ? { reason } : null),
        ])
        return json({ ok: true })
      }

      case 'unban': {
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE players SET banned_at = NULL, ban_reason = NULL, banned_by = NULL WHERE username = ?`,
          ).bind(name),
          log('unban'),
        ])
        return json({ ok: true })
      }

      case 'unlock': {
        await env.DB.batch([
          env.DB.prepare(`UPDATE players SET failed = 0, locked_until = NULL WHERE username = ?`).bind(
            name,
          ),
          log('unlock'),
        ])
        return json({ ok: true })
      }

      case 'reset-pin': {
        if (typeof body.pin !== 'string' || !PIN_RE.test(body.pin)) {
          return json({ error: 'bad_pin' }, 400)
        }
        /*
         * Tegnene spilleren alt har, gjelder fortsatt — signaturen dekker ikke
         * PIN-en (se functions/api/account/). Dette er for den som har glemt
         * PIN-en, ikke for å kaste noen ut; til det er utestenging.
         */
        const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE players SET pin_hash = ?, pin_salt = ?, failed = 0, locked_until = NULL
             WHERE username = ?`,
          ).bind(await hashPin(body.pin, salt), salt, name),
          // PIN-en selv havner aldri i loggen
          log('reset-pin'),
        ])
        return json({ ok: true })
      }

      case 'rename': {
        const invalid = validateUsername(body.newUsername)
        if (invalid) return json({ error: invalid }, 400)
        const newName = body.newUsername.trim()
        if (newName === name) return json({ ok: true, username: name })

        const sameRow = newName.toLowerCase() === name.toLowerCase()
        if (!sameRow) {
          const taken = await env.DB.prepare(`SELECT username FROM players WHERE username = ?`)
            .bind(newName)
            .first()
          if (taken) return json({ error: 'name_taken' }, 409)
        }

        /*
         * Samme to setninger som når spilleren bytter navn selv (se
         * functions/api/account/), i én batch. Forskjellen er at spilleren
         * ikke får et nytt tegn: det gamle peker på et navn som ikke finnes
         * lenger, så neste kall logger dem ut, og de logger inn med det nye.
         */
        try {
          await env.DB.batch([
            env.DB.prepare(`UPDATE player_progress SET username = ? WHERE username = ?`).bind(
              newName,
              name,
            ),
            env.DB.prepare(`UPDATE players SET username = ? WHERE username = ?`).bind(newName, name),
            logStatement(env, auth.username, 'rename', newName, { from: name, to: newName }),
          ])
        } catch (error) {
          if (String(error).includes('UNIQUE') || String(error).includes('PRIMARY KEY')) {
            return json({ error: 'name_taken' }, 409)
          }
          throw error
        }
        return json({ ok: true, username: newName })
      }

      case 'make-admin': {
        if (account.bannedAt) return json({ error: 'target_banned' }, 400)
        if (account.admin) return json({ ok: true })
        await env.DB.batch([
          env.DB.prepare(`UPDATE players SET admin = 1 WHERE username = ?`).bind(name),
          log('make-admin'),
        ])
        return json({ ok: true })
      }

      case 'clear-scores': {
        const game = body.game
        if (game !== 'all' && !BOARDS.some((board) => board.game === game)) {
          return json({ error: 'unknown_game' }, 400)
        }
        const boards = (await existingBoards(env)).filter(
          (board) => game === 'all' || board.game === game,
        )
        if (boards.length === 0) return json({ ok: true, removed: 0 })
        const results = await env.DB.batch([
          ...clearBoardStatements(env, boards, name),
          log('clear-scores', { game }),
        ])
        const removed = results
          .slice(0, boards.length)
          .reduce((sum, result) => sum + (result.meta?.changes ?? 0), 0)
        return json({ ok: true, removed })
      }

      default:
        return json({ error: 'bad_action' }, 400)
    }
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}

/**
 * Sletter kontoen og profilene, og — når `scores` er satt — radene på tavlene.
 *
 * Uten `scores` blir tavleradene stående under navnet, som når spilleren
 * sletter seg selv. Med det blir de borte i samme batch som kontoen.
 */
export async function onRequestDelete(context) {
  const { env, request } = context
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response

  // kroppen er valgfri; uten den slettes bare kontoen
  const body = await request.json().catch(() => ({}))
  const withScores = body?.scores === true

  try {
    const target = await loadTarget(env, request)
    if (target.response) return target.response
    const { account } = target
    if (isSelf(auth, account)) return json({ error: 'self_action' }, 400)
    if (account.admin) return json({ error: 'target_is_admin' }, 400)

    const name = account.username
    const boards = withScores ? await existingBoards(env) : []
    await env.DB.batch([
      ...clearBoardStatements(env, boards, name),
      env.DB.prepare(`DELETE FROM player_progress WHERE username = ?`).bind(name),
      env.DB.prepare(`DELETE FROM players WHERE username = ?`).bind(name),
      logStatement(env, auth.username, 'delete', name, { scores: withScores }),
    ])
    return json({ deleted: true })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
