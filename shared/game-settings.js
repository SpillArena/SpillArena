/** Public catalogue of release settings; independent of account/profile permissions. */
export const GAME_DEFAULTS = [
  ['fleetbot', 'FleetBot', 'available', false],
  ['hangbot', 'HangBot', 'available', false],
  ['scribblebot', 'ScribbleBot', 'available', false],
  ['atlasmaster', 'AtlasMaster', 'available', false],
  ['proportionpanic', 'Proportion Panic', 'available', false],
  ['pixelpanic', 'Pixel Panic', 'available', false],
  ['erashuffle', 'EraShuffle', 'available', true],
  ['melodyrush', 'MelodyRush', 'available', false],
  ['hitline', 'Hitline', 'coming_soon', true],
  ['sipzone', 'SipZone', 'available', true],
  ['cracked', 'Cracked', 'coming_soon', false],
].map(([game, title, availability, beta]) => ({ game, title, availability, beta }))

export const AVAILABILITIES = ['available', 'coming_soon', 'unavailable']

export function isGameSetting(value) {
  return value !== null && typeof value === 'object'
    && GAME_DEFAULTS.some(item => item.game === value.game)
    && AVAILABILITIES.includes(value.availability) && typeof value.beta === 'boolean'
}

export async function readGameSettings(env) {
  const { results } = await env.DB.prepare('SELECT game, availability, beta FROM game_settings').all()
  const rows = new Map((results ?? []).map(row => [row.game, row]))
  return GAME_DEFAULTS.map(item => {
    const row = rows.get(item.game)
    return row ? { ...item, availability: row.availability, beta: Boolean(row.beta) } : { ...item }
  })
}
