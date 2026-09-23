/**
 * Hvilke spill som får ha en profil på kontoen, og hvor stor den får være.
 *
 * Listen er en hviteliste, ikke dokumentasjon: uten den kunne en klient med en
 * feil — eller en ondsinnet kropp — skrevet ubegrenset mange rader på én konto
 * ved å finne på nye spillnavn. Nytt spill: legg det til her, ellers svarer
 * /api/profile/<navn> med 404.
 *
 * Navnet er det samme segmentet som routeren bruker i spillarena.no/<navn>.
 */
export const GAMES = ['atlasmaster', 'scribblebot', 'hangbot', 'proportionpanic', 'pixelpanic', 'fleetbot']

export const isGame = (id) => typeof id === 'string' && GAMES.includes(id)

/*
 * Grensene under er ikke satt mot juks. Profilen er privat for kontoen selv, og
 * det finnes ingen tavle å jukse på her — poengsummer går til spillet sin egen
 * ledertavle, som verifiserer tegnet for seg. Grensene er mot en rad som vokser
 * i det uendelige.
 */
export const MAX_BODY_BYTES = 200_000
const MAX_KEYS = 2000
const MAX_KEY_LEN = 64
const MAX_ARRAY_LEN = 2000
const MAX_DEPTH = 8
const MAX_STRING_LEN = 512

/**
 * En strukturell grense, ikke en form.
 *
 * Tjeneren her kan ikke kjenne formen på hvert spill sin profil — den endrer
 * seg oftere enn en utrulling av forsiden er verdt, og feil vei å bomme er
 * alltid å avvise for mye. Det spillet mener er en gyldig profil, avgjør
 * spillet selv når det leser den tilbake. Det denne sjekken svarer på er bare:
 * kan dette dokumentet sprenge raden?
 *
 * Returnerer en feilkode, eller null når dokumentet er innenfor.
 */
export function validateDocument(value, depth = 0) {
  if (depth > MAX_DEPTH) return 'too_deep'

  if (value === null) return null
  switch (typeof value) {
    case 'boolean':
      return null
    case 'number':
      return Number.isFinite(value) ? null : 'bad_number'
    case 'string':
      return value.length <= MAX_STRING_LEN ? null : 'string_too_long'
    case 'object':
      break
    default:
      // undefined, function, symbol, bigint — kan uansett ikke komme ut av JSON.parse
      return 'bad_value'
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LEN) return 'array_too_long'
    for (const item of value) {
      const invalid = validateDocument(item, depth + 1)
      if (invalid) return invalid
    }
    return null
  }

  const keys = Object.keys(value)
  if (keys.length > MAX_KEYS) return 'too_many_keys'
  for (const key of keys) {
    if (key.length > MAX_KEY_LEN) return 'key_too_long'
    const invalid = validateDocument(value[key], depth + 1)
    if (invalid) return invalid
  }
  return null
}
