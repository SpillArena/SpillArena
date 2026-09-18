#!/usr/bin/env node
/**
 * Flytter kontoene fra AtlasMaster til den globale kontodatabasen.
 *
 *   node scripts/migrate-atlasmaster-accounts.mjs            # skriv SQL-fila
 *   node scripts/migrate-atlasmaster-accounts.mjs --apply    # og kjør den
 *
 * AtlasMaster hadde kontoer i drift før forsiden fikk dem. PIN-hashene kopieres
 * ORDRETT — samme salt, samme antall runder — så en spiller som har logget inn
 * på AtlasMaster logger inn på spillarena.no med nøyaktig samme PIN og merker
 * ingenting. Det er hele grunnen til at PBKDF2_ROUNDS i
 * shared/account-server.js ikke kan endres.
 *
 * `player_progress` fra AtlasMaster blir profilen til spillet 'atlasmaster';
 * de andre spillene har ingenting å flytte.
 *
 * SKRIVER INGENTING OVER. Alt er INSERT OR IGNORE, så en konto som alt finnes
 * på forsiden vinner over den fra AtlasMaster. Skriptet kan kjøres på nytt.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ATLAS_DIR = resolve(here, '../../AtlasMaster')
const SOURCE_DB = 'atlasmaster-leaderboard'
const TARGET_DB = 'spillarena-accounts'
const OUT = resolve(here, '../migrations/data/atlasmaster-accounts.sql')

const apply = process.argv.includes('--apply')

/** Kjører en spørring mot en ekstern D1 og gir radene tilbake. */
function query(cwd, database, sql) {
  const raw = execFileSync(
    'npx',
    ['--yes', 'wrangler', 'd1', 'execute', database, '--remote', '--json', '--command', sql],
    { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )
  // wrangler skriver av og til banner-linjer før JSON-en
  const start = raw.indexOf('[')
  const parsed = JSON.parse(start >= 0 ? raw.slice(start) : raw)
  return parsed[0]?.results ?? []
}

/** SQL-streng. Enkeltfnutter dobles; null blir NULL. */
const lit = (value) => (value == null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`)
const num = (value) => String(Number(value) || 0)

console.log(`Leser kontoer fra ${SOURCE_DB} …`)
const players = query(
  ATLAS_DIR,
  SOURCE_DB,
  'SELECT username, pin_hash, pin_salt, failed, locked_until, created_at, last_seen FROM players',
)

let progress = []
try {
  progress = query(
    ATLAS_DIR,
    SOURCE_DB,
    'SELECT username, data, updated_at FROM player_progress',
  )
} catch {
  // 0006 er kanskje ikke kjørt på den gamle databasen — da er det ingen profiler å flytte
  console.log('  (ingen player_progress-tabell — hopper over profilene)')
}

console.log(`  ${players.length} kontoer, ${progress.length} profiler`)

const lines = [
  '-- Generert av scripts/migrate-atlasmaster-accounts.mjs. Ikke rediger for hånd.',
  `-- Kilde: ${SOURCE_DB} (${new Date().toISOString()})`,
  '',
  ...players.map(
    (p) =>
      `INSERT OR IGNORE INTO players (username, pin_hash, pin_salt, failed, locked_until, created_at, last_seen) VALUES (${lit(p.username)}, ${lit(p.pin_hash)}, ${lit(p.pin_salt)}, ${num(p.failed)}, ${lit(p.locked_until)}, ${lit(p.created_at)}, ${lit(p.last_seen)});`,
  ),
  '',
  ...progress.map(
    (r) =>
      `INSERT OR IGNORE INTO player_progress (username, game, data, updated_at) VALUES (${lit(r.username)}, 'atlasmaster', ${lit(r.data)}, ${lit(r.updated_at)});`,
  ),
  '',
]

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, lines.join('\n'), 'utf8')
console.log(`Skrev ${OUT}`)

if (!apply) {
  console.log(`\nKjør den med:\n  npx wrangler d1 execute ${TARGET_DB} --remote --file=${OUT}`)
  process.exit(0)
}

console.log(`Kjører mot ${TARGET_DB} …`)
execFileSync('npx', ['--yes', 'wrangler', 'd1', 'execute', TARGET_DB, '--remote', '--file', OUT], {
  cwd: resolve(here, '..'),
  stdio: 'inherit',
})
console.log('Ferdig.')
