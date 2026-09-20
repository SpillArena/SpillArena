-- AtlasMaster sin ledertavle, flyttet fra databasen `atlasmaster-leaderboard`.
--
-- Tabellen het `leaderboard_entries` der. Det navnet kan den ikke beholde her:
-- FleetBot har en tabell med nøyaktig samme navn og helt andre kolonner, og
-- selv om FleetBot blir liggende i sin egen database, er et navn som bare
-- tilfeldigvis er ledig et navn som slutter å være det. Hvert spill sin tavle
-- heter <spill>_leaderboard. Det samme gjelder indeksene — `idx_leaderboard_
-- score_timestamp` fantes i to databaser med to ulike definisjoner.
--
-- KOLONNEREKKEFØLGEN ER IKKE TILFELDIG. `region` og `scoring_version` ligger
-- sist fordi de ble lagt til med ALTER TABLE (migrasjon 0002 og 0003 i
-- AtlasMaster), og SQLite føyer nye kolonner til på slutten. Radene kopieres
-- inn med INSERT-setninger fra `wrangler d1 export`, som ikke lister opp
-- kolonnenavn — stokker man om på rekkefølgen her, havner regionen i feil
-- kolonne uten at noe klager.
--
-- Dette er sluttilstanden etter AtlasMaster sine migrasjoner 0001 til 0004,
-- skrevet ut som én tabell i stedet for fire steg. Migrasjon 0004 droppet
-- `idx_leaderboard_category_score`; den er derfor ikke med.
CREATE TABLE IF NOT EXISTS atlasmaster_leaderboard (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    username TEXT NOT NULL,
    category TEXT NOT NULL,
    mode TEXT NOT NULL,
    pace TEXT NOT NULL,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    total INTEGER NOT NULL,
    mistakes INTEGER NOT NULL,
    best_streak INTEGER NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    region TEXT NOT NULL DEFAULT 'norway',
    scoring_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_atlasmaster_score_timestamp
    ON atlasmaster_leaderboard (score DESC, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_atlasmaster_region_score
    ON atlasmaster_leaderboard (region, score DESC, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_atlasmaster_region_category_score
    ON atlasmaster_leaderboard (region, category, score DESC, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_atlasmaster_region_category_mode_score
    ON atlasmaster_leaderboard (region, category, mode, score DESC, timestamp DESC);

-- Den ene indeksen fetchTop() faktisk står og faller med: vinduet i
-- functions/api/leaderboard/index.js grupperer på (username, region, category,
-- mode, pace) og tar den beste raden i hver gruppe.
CREATE INDEX IF NOT EXISTS idx_atlasmaster_group_best
    ON atlasmaster_leaderboard (username, region, category, mode, pace, score DESC);

CREATE INDEX IF NOT EXISTS idx_atlasmaster_region_category_mode_pace
    ON atlasmaster_leaderboard (region, category, mode, pace, score DESC, timestamp DESC);
