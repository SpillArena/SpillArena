-- FleetBot sin ledertavle, flyttet hit fra databasen `fleetbot`.
--
-- FleetBot var det siste spillet med egen database. Grunnen stod i
-- wrangler.toml: flerspillerrommene ble pollet hvert halve sekund fra D1, og den
-- trafikken hørte ikke hjemme ved siden av kontoene. Rommene bor nå i Durable
-- Objects i Workeren `fleetbot-rooms` (FleetBot/battleship-frontend/workers/rooms),
-- med egen SQLite-lagring per rom. Det som er igjen for D1 er tavla — én skriving
-- per ferdig spill — og den hører hjemme her sammen med de andre.
--
-- SKRIVES AV WORKEREN, ALDRI AV NETTLESEREN. Et spill mot boten spilles på
-- serveren når spilleren er innlogget: botens flåte forlater aldri Workeren, og
-- poengene regnes ut der (shared/scoring.ts i FleetBot). Det finnes ikke lenger
-- noe POST-endepunkt for poeng. Som gjest spilles det i nettleseren, og det
-- havner aldri her.
--
-- Én rad per spiller, den beste vinner — samme regel som 0006 innførte for de
-- andre flate tavlene. Nøkkelen er brukernavnet alene: tavla leses flatt, og
-- vanskelighetsgrad og brettstørrelse er allerede bakt inn i poengene.
--
-- COLLATE NOCASE står på KOLONNEN, ikke bare på indeksen. Da treffer
-- `ON CONFLICT (username)` den unike indeksen uten at skrivinga må gjenta
-- collation, og «Kari» og «kari» er én rad, slik de er én konto i `players`.
--
-- `scoring_version` er 2 for alt som står her: radene som flyttes fra den gamle
-- databasen regnes om med den nye formelen av
-- FleetBot/battleship-frontend/scripts/migrate-leaderboard.mjs før de settes inn.
CREATE TABLE IF NOT EXISTS fleetbot_leaderboard (
  id              TEXT PRIMARY KEY,
  username        TEXT NOT NULL COLLATE NOCASE,
  score           INTEGER NOT NULL,
  result          TEXT NOT NULL CHECK (result IN ('won', 'lost')),
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  grid_size       INTEGER NOT NULL,
  shots           INTEGER NOT NULL,
  hits            INTEGER NOT NULL,
  timestamp       TEXT NOT NULL,
  scoring_version INTEGER NOT NULL DEFAULT 2
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fleetbot_player
  ON fleetbot_leaderboard (username);

-- Tavla leses som «best først»: høyest poeng, så færrest skudd, så eldst.
CREATE INDEX IF NOT EXISTS idx_fleetbot_score
  ON fleetbot_leaderboard (score DESC, shots ASC, timestamp ASC);
