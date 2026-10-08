-- Utlogging på tjeneren.
--
-- Et tegn er signert, ikke lagret, så å slette det i nettleseren gjør det ikke
-- ugyldig: en kopi virker i tretti dager til. POST /api/auth { action: 'logout' }
-- legger en hash av tegnet her, og requireUser i shared/account-server.js
-- avviser det fra da av.
--
-- Bare en hash, aldri tegnet selv: tabellen skal ikke kunne gi et brukbart tegn
-- til den som får lese den.
--
-- `expires_at` er når tegnet ville gått ut uansett. Etter det er raden
-- unødvendig — signaturen avvises på utløpet — og logout rydder bort slike rader
-- hver gang den kjører.
--
-- Spillene verifiserer tegn uten oppslag og ser ikke denne tabellen.
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens (expires_at);
