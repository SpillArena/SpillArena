-- Adminpanelet: hvem som er admin, utestengte kontoer og en logg over hva
-- adminene gjør.
--
-- ADMIN LIGGER PÅ RADEN, IKKE I TEGNET. Tegnet lever i tretti dager og kan
-- ikke trekkes tilbake (se functions/api/account/). Stod det i tegnet, ville en
-- som ble fratatt admin fortsatt vært admin til tegnet gikk ut. Hvert admin-kall
-- slår derfor opp raden — det er få av dem, og de er verdt det.
--
-- SQLite har ingen boolsk type; 0 er nei og 1 er ja, og CHECK holder det slik.
--
-- Flagget følger raden ved navnebytte, og forsvinner med raden når kontoen
-- slettes. Registrerer noen seg senere under et navn som en gang var admin,
-- får de ikke flagget med på kjøpet.
ALTER TABLE players ADD COLUMN admin INTEGER NOT NULL DEFAULT 0
  CHECK (admin IN (0, 1));

-- Utestengt: satt betyr stengt. Raden blir stående med vilje — navnet forblir
-- opptatt, så en utestengt spiller kan ikke bare registrere seg på nytt under
-- det samme navnet.
ALTER TABLE players ADD COLUMN banned_at TEXT;
ALTER TABLE players ADD COLUMN ban_reason TEXT;
ALTER TABLE players ADD COLUMN banned_by TEXT;

-- Hva som ble gjort, av hvem, mot hvem. Navnene er tekst og ikke fremmednøkler:
-- loggen skal overleve at kontoen den handler om blir omdøpt eller slettet.
CREATE TABLE IF NOT EXISTS admin_log (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  at      TEXT NOT NULL,
  admin   TEXT NOT NULL,
  action  TEXT NOT NULL,
  target  TEXT,
  -- JSON: grunn for utestenging, gammelt og nytt navn, antall rader fjernet …
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_log_target ON admin_log (target COLLATE NOCASE, id DESC);

-- Den første adminen. Primærnøkkelen er COLLATE NOCASE, så «emil» treffer også.
-- Finnes ikke kontoen når migrasjonen kjører, skjer ingenting — lag kontoen og
-- kjør setningen for hånd.
UPDATE players SET admin = 1 WHERE username = 'Emil';
