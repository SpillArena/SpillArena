-- PixelPanic får én tabell, med samme form som ProportionPanic sin.
--
-- 0007 laget tre: runder, dagens brett og tavla. Det var tre steder å holde i
-- sync for én spillers dag. Nå bor alt i én rad per spiller per dag:
--
--   `rounds_json`  spillerens fire bilder, og for hver runde hvor skarpt bilde
--                  som er delt ut, feil svar, når runden startet og resultatet.
--                  Serveren regner poengene ut fra dette, ikke fra klienten —
--                  se server/daily.ts i PixelPanic.
--   `nickname`     tom til resultatet er postet. Tavla leser bare rader med
--                  navn, så en dag som pågår står ikke på den.
--   `total_score`  summen av rundene som er ferdige.
--
-- `client_id` er `account:<navn>` med gyldig tegn og `guest:<id>` ellers,
-- samme regel som ProportionPanic.
--
-- Tabellene fra 0007 hadde bare testrader da dette ble skrevet, så de kastes
-- i stedet for å flyttes.
DROP TABLE IF EXISTS pixelpanic_daily_rounds;
DROP TABLE IF EXISTS pixelpanic_daily_boards;
DROP TABLE IF EXISTS pixelpanic_daily_scores;

CREATE TABLE IF NOT EXISTS pixelpanic_daily_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  client_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rounds_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (date, client_id)
);

-- Hver lesing av tavla er «i dag, best først».
CREATE INDEX IF NOT EXISTS idx_pixelpanic_daily_scores_date_score
  ON pixelpanic_daily_scores (date, total_score DESC);
