-- ScribbleBot sin ledertavle, flyttet fra databasen `scribblebot-leaderboard`.
--
-- Tabellen het `leaderboard` der. HangBot sin tabell het også `leaderboard`,
-- med andre kolonner, så begge måtte få et navn som sier hvilket spill det er.
-- Indeksene måtte det samme: `idx_leaderboard_score` og
-- `idx_leaderboard_username` fantes i begge databasene og betydde to ulike
-- ting.
--
-- `username_key` er det normaliserte brukernavnet tavla slår opp på, og
-- `username` er det som vises. De to er ikke det samme og skal ikke slås
-- sammen — se functions/api/leaderboard.ts.
CREATE TABLE IF NOT EXISTS scribblebot_leaderboard (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  rounds INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  correct_rounds INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scribblebot_score
  ON scribblebot_leaderboard (score DESC);

CREATE INDEX IF NOT EXISTS idx_scribblebot_difficulty
  ON scribblebot_leaderboard (difficulty, score DESC);

CREATE INDEX IF NOT EXISTS idx_scribblebot_username
  ON scribblebot_leaderboard (username_key);
