-- HangBot sin ledertavle, flyttet fra databasen `hangbot`.
--
-- HangBot hadde aldri noen migrasjonsmappe. Tabellen ble laget av
-- `createTableSql` i functions/api/leaderboard.js, som kjørte CREATE TABLE IF
-- NOT EXISTS ved hvert kall. DEN KONSTANTEN ER IKKE HELE SANNHETEN: databasen
-- har i tillegg to indekser som ikke står noe sted i koden, og som ville blitt
-- borte uten et ord hvis denne filen var skrevet av fra konstanten alene.
-- DDL-en under er hentet fra `wrangler d1 export` av den levende databasen,
-- ikke fra kildekoden.
--
-- Etter flyttingen eier denne filen formen, og kallet til createTableSql er
-- fjernet fra leaderboard.js. Et spill som lager sine egne tabeller ved
-- oppstart er greit så lenge det har en database for seg selv; i en delt
-- database er det et spill som kan finne på å lage en tabell i et annet spill
-- sin database.
CREATE TABLE IF NOT EXISTS hangbot_leaderboard (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  outcome TEXT NOT NULL,
  score INTEGER NOT NULL,
  wrong_guesses INTEGER NOT NULL,
  max_wrong_guesses INTEGER NOT NULL,
  word_length INTEGER NOT NULL,
  guessed_letters INTEGER NOT NULL,
  word TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Færrest bomgjetninger avgjør ved likt poeng — derfor ASC på den andre
-- kolonnen, ikke DESC.
CREATE INDEX IF NOT EXISTS idx_hangbot_score
  ON hangbot_leaderboard (score DESC, wrong_guesses ASC);

CREATE INDEX IF NOT EXISTS idx_hangbot_username
  ON hangbot_leaderboard (username);
