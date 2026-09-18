-- Én konto for hele SpillArena.
--
-- Før dette hadde AtlasMaster kontoer (brukernavn + PIN), mens ScribbleBot,
-- HangBot og ProportionPanic identifiserte en spiller med en streng fra et
-- tekstfelt. Hvem som helst kunne sende inn et resultat under hvilket navn som
-- helst, og siden tavlene holder én rad per brukernavn, ville en høyere falsk
-- poengsum ERSTATTE raden til den virkelige spilleren.
--
-- Radene her er flyttet fra AtlasMaster (players) med
-- scripts/migrate-atlasmaster-accounts.mjs; PIN-hashene er de samme, så
-- eksisterende innlogginger virker uendret.
--
-- COLLATE NOCASE på primærnøkkelen hindrer at «Kari» og «kari» blir to kontoer.
CREATE TABLE IF NOT EXISTS players (
  username     TEXT PRIMARY KEY COLLATE NOCASE,
  pin_hash     TEXT NOT NULL,
  pin_salt     TEXT NOT NULL,
  -- hvor mange ganger PIN-en er gjettet feil siden sist riktig innlogging
  failed       INTEGER NOT NULL DEFAULT 0,
  -- ISO-8601; satt når kontoen er midlertidig stengt etter for mange forsøk
  locked_until TEXT,
  created_at   TEXT NOT NULL,
  last_seen    TEXT NOT NULL
);

-- Profilen per spill: ett JSON-dokument per (konto, spill).
--
-- Dette er AtlasMaster sin player_progress med én kolonne til. Grunnen til at
-- det er JSON og ikke kolonner er den samme som den gang: formen endrer seg
-- oftere enn en D1-migrasjon er verdt. Hvert spill eier sitt eget dokument og
-- trenger ikke vite noe om de andre — det er `game` som holder dem fra
-- hverandre, ikke en tabell per spill.
--
-- Hva som faktisk godtas i `data` avgjøres av spillet sin egen validering i
-- functions/api/profile/[game].js.
CREATE TABLE IF NOT EXISTS player_progress (
  username   TEXT NOT NULL COLLATE NOCASE,
  game       TEXT NOT NULL,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (username, game)
);

-- Profilsiden på forsiden henter alle spillene til én konto på en gang.
CREATE INDEX IF NOT EXISTS idx_progress_username ON player_progress (username);
