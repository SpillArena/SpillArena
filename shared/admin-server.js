/**
 * Delt kode for adminpanelet under functions/api/admin/.
 *
 * Ligger utenfor functions/ av samme grunn som account-server.js: alt som
 * ligger der blir en rute.
 */

import { json, requireUser } from './account-server.js'

/**
 * Admin bak forespørselen, eller et ferdig 401/403-svar.
 *
 * `players.admin` leses fra raden på hvert kall (se requireUser), ikke fra
 * tegnet. En som mister flagget mister panelet på neste klikk, ikke om tretti
 * dager.
 */
export async function requireAdmin(env, request) {
  const auth = await requireUser(env, request)
  if (auth.response) return auth
  if (!auth.admin) return { response: json({ error: 'forbidden' }, 403) }
  return auth
}

/**
 * Én rad i admin_log, som en setning — ikke et kall.
 *
 * Den skal inn i SAMME `batch` som handlingen den beskriver. Da er loggen og
 * endringen én transaksjon: det finnes ingen utestenging uten en loggrad, og
 * ingen loggrad for en utestenging som feilet.
 */
export function logStatement(env, admin, action, target, details = null) {
  return env.DB.prepare(
    `INSERT INTO admin_log (at, admin, action, target, details) VALUES (?, ?, ?, ?, ?)`,
  ).bind(new Date().toISOString(), admin, action, target, details ? JSON.stringify(details) : null)
}

/** Loggrader slik klienten vil ha dem: `details` som objekt, ikke som tekst. */
export function readLog(rows) {
  return (rows ?? []).map((row) => {
    let details = null
    try {
      details = row.details ? JSON.parse(row.details) : null
    } catch {
      // en rad skrevet for hånd er ikke verdt å felle hele loggen for
    }
    return { ...row, details }
  })
}

/**
 * Brukernavnet i `?u=`, eller null.
 *
 * Spørreledd og ikke en sti med vilje. Navneregelen slipper gjennom «..» og
 * «.», og i en sti er det ikke et navn men et steg opp: nettleseren gjør
 * `/api/admin/player/..` om til `/api/admin/` før kallet går, også når
 * punktumene er prosent-kodet. I et spørreledd er de bare tegn.
 */
export function targetOf(request) {
  const value = new URL(request.url).searchParams.get('u')
  return value && value.trim() ? value.trim() : null
}

/**
 * Ledertavlene som ligger i denne databasen, og hvordan en konto kjennes igjen
 * i hver av dem.
 *
 * FleetBot er ikke med: den har sin egen database (se wrangler.toml), og
 * herfra kan den verken leses eller ryddes.
 *
 * `match` tar kontonavnet som ?1. De tre første tavlene har navnet i en
 * kolonne; de to daglige har `account:<navn>` i client_id, mens en gjest har
 * en tilfeldig id der og aldri kan forveksles med en konto. Alt sammenlignes
 * uten hensyn til store og små bokstaver, som kontotabellen selv.
 *
 * Merk for de daglige: raden for I DAG er også det som hindrer spilleren i å
 * spille dagens runde på nytt. Slettes den, kan dagen spilles om.
 */
export const BOARDS = [
  {
    game: 'atlasmaster',
    table: 'atlasmaster_leaderboard',
    match: 'username = ?1 COLLATE NOCASE',
    score: 'score',
    at: 'timestamp',
  },
  {
    game: 'scribblebot',
    table: 'scribblebot_leaderboard',
    match: 'username = ?1 COLLATE NOCASE',
    score: 'score',
    at: 'created_at',
  },
  {
    game: 'hangbot',
    table: 'hangbot_leaderboard',
    match: 'username = ?1 COLLATE NOCASE',
    score: 'score',
    at: 'timestamp',
  },
  {
    game: 'proportionpanic',
    table: 'proportionpanic_daily_scores',
    match: `client_id = ('account:' || ?1) COLLATE NOCASE`,
    score: 'total_score',
    at: 'created_at',
  },
  {
    game: 'pixelpanic',
    table: 'pixelpanic_daily_scores',
    match: `client_id = ('account:' || ?1) COLLATE NOCASE`,
    score: 'total_score',
    at: 'created_at',
  },
]

/**
 * Tavlene som faktisk finnes i databasen det kjøres mot.
 *
 * Lokalt er det vanlig å ha kjørt bare noen av migrasjonene. En `batch` med en
 * DELETE mot en tabell som ikke finnes feiler i sin helhet — også slettingen av
 * selve kontoen den skulle følge — så tavlene siles her først.
 */
export async function existingBoards(env) {
  const { results } = await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${BOARDS.map(() => '?').join(', ')})`,
  )
    .bind(...BOARDS.map((board) => board.table))
    .all()
  const present = new Set((results ?? []).map((row) => row.name))
  return BOARDS.filter((board) => present.has(board.table))
}

/** Per tavle: hvor mange rader kontoen har, beste resultat og det siste. */
export async function boardSummary(env, username) {
  const boards = await existingBoards(env)
  return Promise.all(
    boards.map(async (board) => {
      const row = await env.DB.prepare(
        `SELECT COUNT(*) AS entries, MAX(${board.score}) AS best, MAX(${board.at}) AS lastAt
         FROM ${board.table} WHERE ${board.match}`,
      )
        .bind(username)
        .first()
      return {
        game: board.game,
        entries: row?.entries ?? 0,
        best: row?.best ?? null,
        lastAt: row?.lastAt ?? null,
      }
    }),
  )
}

/** DELETE-setninger for kontoens rader på de valgte tavlene, klare for en `batch`. */
export function clearBoardStatements(env, boards, username) {
  return boards.map((board) =>
    env.DB.prepare(`DELETE FROM ${board.table} WHERE ${board.match}`).bind(username),
  )
}
