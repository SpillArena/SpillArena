import { json, serviceFailed } from '../../shared/account-server.js'
import { readGameSettings } from '../../shared/game-settings.js'

export async function onRequestGet({ env }) {
  try {
    return json({ games: await readGameSettings(env) })
  } catch (error) {
    return serviceFailed(error)
  }
}
