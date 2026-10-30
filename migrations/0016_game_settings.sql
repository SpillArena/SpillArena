CREATE TABLE game_settings (
  game TEXT PRIMARY KEY,
  availability TEXT NOT NULL CHECK (availability IN ('available', 'coming_soon', 'unavailable')),
  beta INTEGER NOT NULL DEFAULT 0 CHECK (beta IN (0, 1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

INSERT INTO game_settings (game, availability, beta, updated_at, updated_by) VALUES
  ('fleetbot', 'available', 0, datetime('now'), 'migration'),
  ('hangbot', 'available', 0, datetime('now'), 'migration'),
  ('scribblebot', 'available', 0, datetime('now'), 'migration'),
  ('atlasmaster', 'available', 0, datetime('now'), 'migration'),
  ('proportionpanic', 'available', 0, datetime('now'), 'migration'),
  ('pixelpanic', 'available', 0, datetime('now'), 'migration'),
  ('erashuffle', 'available', 1, datetime('now'), 'migration'),
  ('melodyrush', 'available', 0, datetime('now'), 'migration'),
  ('hitline', 'coming_soon', 1, datetime('now'), 'migration'),
  ('sipzone', 'available', 1, datetime('now'), 'migration'),
  ('cracked', 'coming_soon', 0, datetime('now'), 'migration');
