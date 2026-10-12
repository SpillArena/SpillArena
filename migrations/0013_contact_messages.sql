-- Meldinger fra kontaktskjemaet (src/components/main/ContactForm.tsx).
--
-- `ip_hash` er en enveis-hash av IP-adressen og dagens dato, saltet med
-- AUTH_SECRET. Den skifter hver dag, kan ikke snus tilbake til en adresse, og
-- er der bare for å begrense hvor mange meldinger én avsender kan sende i
-- timen. Selve adressen lagres aldri.
--
-- Rader eldre enn ett år slettes av POST /api/contact hver gang den kjører.
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  topic      TEXT NOT NULL,
  name       TEXT,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  lang       TEXT,
  username   TEXT,
  ip_hash    TEXT,
  status     TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip ON contact_messages (ip_hash, created_at);
