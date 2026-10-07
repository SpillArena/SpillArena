-- Glemt PIN: spilleren nullstiller den selv, med en kode.
--
-- Det finnes ingen e-post eller telefon på en konto, og det skal det heller
-- ikke: spillerne er ofte barn, og en adresse å sende en lenke til er en
-- personopplysning vi ellers slipper å ha. I stedet finnes to slags koder, og
-- begge brukes i POST /api/auth { action: 'recover' }:
--
--   GJENOPPRETTINGSKODE — 12 tegn, laget av tjeneren og vist spilleren ÉN gang.
--   Varer til den brukes; da byttes den ut med en ny.
--
--   ENGANGSKODE — 8 tegn, laget av en admin for en spiller som ikke har (eller
--   har mistet) sin. Varer i et døgn og kan brukes én gang. Admin ser aldri
--   PIN-en — spilleren velger den selv.
--
-- Bare hashen ligger her. Kodene er tilfeldige og lange nok til at SHA-256 med
-- salt holder (se shared/account-server.js); PBKDF2 er for PIN-en, som er kort.
ALTER TABLE players ADD COLUMN recovery_hash TEXT;
ALTER TABLE players ADD COLUMN recovery_salt TEXT;

ALTER TABLE players ADD COLUMN reset_hash TEXT;
ALTER TABLE players ADD COLUMN reset_salt TEXT;
ALTER TABLE players ADD COLUMN reset_expires TEXT;

-- Feil koder telles for seg, IKKE i `failed`. Den vanligste veien inn hit er en
-- spiller som har gjettet feil PIN til kontoen ble sperret; deler de teller,
-- stenger PIN-sperren også døra ut.
ALTER TABLE players ADD COLUMN recover_failed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN recover_locked_until TEXT;

-- Tegn utstedt FØR dette tidspunktet godtas ikke lenger av /api/*. Settes når
-- PIN-en byttes, slik at en som har fått tak i kontoen blir kastet ut når
-- eieren tar den tilbake. NULL betyr at alle tegn som ellers er gyldige, gjelder.
ALTER TABLE players ADD COLUMN tokens_valid_from TEXT;
