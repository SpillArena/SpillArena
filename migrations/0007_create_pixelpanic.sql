-- PixelPanic: dagens fire bilder, og tavla.
--
-- To tabeller, fordi spillet må huske to forskjellige ting.
--
-- `pixelpanic_daily_rounds` er hva hver spiller har SETT. Poengene i
-- PixelPanic avhenger av hvor skarpt bildet var da svaret kom, og det kan ikke
-- klienten melde inn selv — da ville alle svart på nivå 0. Derfor skriver
-- serveren ned hvert bilde den deler ut (`level`), hvor mange feil svar som er
-- gitt (`wrong`), og når runden startet (`started_at`, millisekunder). Et
-- riktig svar betales etter det høyeste av de tre. Se server/daily.ts i
-- PixelPanic.
--
-- `closed` gjør runden ferdig for godt: én sjanse per bilde per dag, som i
-- Wordle. Skrivingene i server/daily.ts har `WHERE closed = 0` i ON CONFLICT,
-- og det er denne kolonnen som gjør at en lukket runde ikke kan åpnes igjen.
--
-- `player` er `account:<navn>` med gyldig tegn og `guest:<id>` ellers, samme
-- regel som ProportionPanic sin `client_id`.
CREATE TABLE IF NOT EXISTS pixelpanic_daily_rounds (
  date TEXT NOT NULL,
  player TEXT NOT NULL,
  round INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  closed INTEGER NOT NULL DEFAULT 0,
  solved_level INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (date, player, round)
);

-- Tavla. Én rad per spiller per dag — summen kan ikke endre seg, siden
-- rundene ikke kan spilles om, så en ny innsending bare bytter navnet.
CREATE TABLE IF NOT EXISTS pixelpanic_daily_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  player TEXT NOT NULL,
  nickname TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rounds_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (date, player)
);

-- Dagens fire bilder, låst første gang noen åpner dagen. Utvalget regnes ut
-- fra hvor mange bilder hver kategori har, så uten denne tabellen ville en
-- utrulling med nye bilder byttet ut dagens brett midt på dagen — også for
-- spillere som allerede har sett svarene. Se server/boards.ts i PixelPanic.
CREATE TABLE IF NOT EXISTS pixelpanic_daily_boards (
  date TEXT PRIMARY KEY,
  puzzle_ids TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pixelpanic_daily_scores_date_score
  ON pixelpanic_daily_scores (date, total_score DESC);
