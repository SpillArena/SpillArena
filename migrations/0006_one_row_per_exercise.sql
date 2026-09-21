-- Én rad per spiller på hver tavle. Den beste vinner.
--
-- Tavlene samlet opp én rad per RUNDE. Spilte du ti ganger, lå du der ti
-- ganger, og de du konkurrerte mot ble skjøvet ned av dine egne dårligere
-- forsøk. AtlasMaster skjulte det i lesinga med et ROW_NUMBER-vindu, FleetBot
-- slettet duplikatene på nytt ved hver eneste lesing, ScribbleBot og HangBot
-- gjorde ingen av delene. Fire tavler, fire svar, tre av dem feil.
--
-- Regelen hører hjemme i skjemaet. En unik indeks kan ikke glemmes av neste
-- endepunkt som skriver til tabellen, og den overlever to samtidige
-- innsendinger som begge består en sjekk gjort i forkant.
--
-- NØKKELEN FØLGER HVA TAVLA FAKTISK VISER. Det er forskjellen mellom spillene,
-- og den er ikke vilkårlig:
--
--   AtlasMaster leses alltid filtrert — region, kategori, modus og tempo er
--   spørringsledd, og hver kombinasjon er sin egen tavle. Nøkkelen er derfor
--   (username, region, category, mode, pace): innenfor én visning står en
--   spiller én gang, som er poenget.
--
--   ScribbleBot og HangBot leses FLATT. Én liste, alle runder mot hverandre.
--   Da er (username) hele nøkkelen. En finere nøkkel ville vært riktig på
--   papiret og likevel gitt samme navn fire ganger nedover lista.
--
-- Prisen for den flate nøkkelen er ekte og verdt å skrive ned: en spillers
-- nest beste resultat i en ANNEN vanskelighetsgrad finnes ikke lenger. Etter
-- denne migrasjonen viser ScribbleBot sitt vanskelighetsfilter bare spillere
-- hvis beste runde tilfeldigvis var på den graden. Det er valgt med vilje —
-- tavla er en rangering, ikke et arkiv.
--
-- COLLATE NOCASE på brukernavnet følger `players`, der «Kari» og «kari» er én
-- konto. ScribbleBot har `username_key` fra før — den ER det små-skrivne
-- navnet — så der trengs ingen collation.
--
-- REKKEFØLGE VED UTRULLING: denne migrasjonen må gå FØR koden som skriver med
-- ON CONFLICT, og de to bør følge tett. En unik indeks uten den koden gjør at
-- et nytt resultat fra en spiller som alt står på tavla, feiler på constraint
-- i stedet for å oppdatere raden.

-- ── AtlasMaster ────────────────────────────────────────────────────────────
--
-- Rangeringa speiler vinduet som stod i functions/api/leaderboard/index.js:
-- høyest score vinner, likt score avgjøres av nyeste tidsstempel, likt
-- tidsstempel av høyest id.
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
-- Likt score avgjøres av ELDST innsending, slik tavla alt sorterer
-- (ORDER BY score DESC, created_at ASC).
DELETE FROM scribblebot_leaderboard
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY username_key
             ORDER BY score DESC, created_at ASC, id DESC
           ) AS rank_in_group
    FROM scribblebot_leaderboard
  )
  WHERE rank_in_group > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scribblebot_player
  ON scribblebot_leaderboard (username_key);

-- ── HangBot ────────────────────────────────────────────────────────────────
--
-- Færrest bom bryter likt score, slik idx_hangbot_score alt sorterer. Dette er
-- samme regel som `normalizeEntries` i functions/api/leaderboard.js gjorde i
-- JavaScript etter å ha lest hele tabellen — nå står den i skjemaet i stedet,
-- der den også gjelder for skrivinga.
DELETE FROM hangbot_leaderboard
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY lower(username)
             ORDER BY score DESC, wrong_guesses ASC, timestamp DESC, id DESC
           ) AS rank_in_group
    FROM hangbot_leaderboard
  )
  WHERE rank_in_group > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hangbot_player
  ON hangbot_leaderboard (username COLLATE NOCASE);
