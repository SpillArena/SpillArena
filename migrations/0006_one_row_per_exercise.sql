-- Én rad per spiller per øvelse. Den beste vinner.
--
-- Tavlene samlet opp én rad per RUNDE. Spilte du samme øvelse ti ganger, lå du
-- der ti ganger. AtlasMaster skjulte det i lesinga med et ROW_NUMBER-vindu, og
-- FleetBot slettet duplikatene på nytt ved hver eneste lesing; ScribbleBot og
-- HangBot gjorde ingen av delene. Tre ulike svar på samme spørsmål, og to av
-- dem skjulte problemet i stedet for å hindre det.
--
-- Regelen hører hjemme her, ikke i spørringene. En unik indeks kan ikke
-- glemmes av et nytt endepunkt, og den overlever en klient som sender samme
-- runde to ganger.
--
-- HVA EN ØVELSE ER, er spillets eget svar, og det er allerede gitt: det er
-- kolonnene spillet selv grupperer og rangerer på i dag.
--
--   AtlasMaster  (username, region, category, mode, pace)
--   ScribbleBot  (username_key, difficulty, rounds)
--   HangBot      (username, difficulty)
--
-- COLLATE NOCASE på brukernavnet følger `players`, der «Kari» og «kari» er én
-- konto. ScribbleBot har `username_key` fra før — den ER det små-skrivne
-- navnet — så der trengs ingen collation.
--
-- REKKEFØLGE VED UTRULLING: denne migrasjonen må gå SAMMEN med koden som
-- skriver med ON CONFLICT. En unik indeks uten den koden gjør at et nytt
-- resultat i en øvelse spilleren alt har, feiler på constraint i stedet for å
-- oppdatere raden.

-- ── AtlasMaster ────────────────────────────────────────────────────────────
--
-- Rangeringa speiler vinduet i functions/api/leaderboard/index.js: høyest
-- score vinner, likt score avgjøres av nyeste tidsstempel, likt tidsstempel av
-- høyest id. Alt som ikke er best i gruppa si, slettes.
DELETE FROM atlasmaster_leaderboard
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY lower(username), region, category, mode, pace
             ORDER BY score DESC, timestamp DESC, id DESC
           ) AS rank_in_group
    FROM atlasmaster_leaderboard
  )
  WHERE rank_in_group > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_atlasmaster_exercise
  ON atlasmaster_leaderboard (username COLLATE NOCASE, region, category, mode, pace);

-- ── ScribbleBot ────────────────────────────────────────────────────────────
--
-- Øvelsen er vanskelighetsgrad OG rundetall, fordi begge endrer hva en score
-- kan bli — se `runKey` i src/lib/progress.ts og `maxGameScore` i
-- lib/scoring.ts. En hard runde på ti og en lett på tre er ikke samme rekord.
-- Likt score avgjøres av ELDST innsending, slik tavla alt sorterer.
DELETE FROM scribblebot_leaderboard
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY username_key, difficulty, rounds
             ORDER BY score DESC, created_at ASC, id DESC
           ) AS rank_in_group
    FROM scribblebot_leaderboard
  )
  WHERE rank_in_group > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scribblebot_exercise
  ON scribblebot_leaderboard (username_key, difficulty, rounds);

-- ── HangBot ────────────────────────────────────────────────────────────────
--
-- Øvelsen er vanskelighetsgraden. Den avgjør både poengmultiplikatoren og hvor
-- mange bom som er lov (constants/gameConfig.js), så en lett og en umulig
-- runde kan ikke rangeres mot hverandre.
--
-- Dette er en OPPMYKING av det tavla gjorde før: `normalizeEntries` i
-- functions/api/leaderboard.js beholdt én rad per SPILLER på tvers av alle
-- vanskelighetsgrader, så en god umulig-runde skjulte spillerens egen
-- lett-runde. Nå kan samme spiller stå én gang per grad, og ikke mer.
--
-- Færrest bom bryter likt score, slik idx_hangbot_score alt sorterer.
DELETE FROM hangbot_leaderboard
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY lower(username), difficulty
             ORDER BY score DESC, wrong_guesses ASC, timestamp DESC, id DESC
           ) AS rank_in_group
    FROM hangbot_leaderboard
  )
  WHERE rank_in_group > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hangbot_exercise
  ON hangbot_leaderboard (username COLLATE NOCASE, difficulty);
