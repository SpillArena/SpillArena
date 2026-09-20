-- ProportionPanic sin dagstavle, flyttet fra databasen `proportion-panic`.
--
-- UNIQUE (date, client_id) er regelen hele tavla hviler på: én rad per spiller
-- per dag, slik at et nytt forsøk oppdaterer det første i stedet for å legge
-- seg ved siden av. Uten den gjør ON CONFLICT-setningen i
-- worker/src/index.ts ingenting, og en spiller kan fylle dagens tavle alene.
--
-- `client_id` er en tilfeldig streng per enhet for en gjest, og
-- `account:<navn>` for en innlogget spiller. Det er det som gjør at dagens
-- runde følger spilleren mellom enheter og likevel faller sammen til én rad.
--
-- `id` er INTEGER PRIMARY KEY AUTOINCREMENT, som betyr at denne tabellen tar
-- med seg en rad i sqlite_sequence. Det er greit — den er allerede delt, og
-- teller per tabellnavn.
CREATE TABLE IF NOT EXISTS proportionpanic_daily_scores (
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
CREATE INDEX IF NOT EXISTS idx_proportionpanic_daily_scores_date_score
  ON proportionpanic_daily_scores (date, total_score DESC);
