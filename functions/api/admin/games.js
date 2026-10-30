import { json, serviceFailed } from '../../../shared/account-server.js'
import { requireAdmin, logStatement } from '../../../shared/admin-server.js'
import { isGameSetting, readGameSettings } from '../../../shared/game-settings.js'

export async function onRequestGet({ env, request }) {
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response
  try {
    return json({ games: await readGameSettings(env) })
  } catch (error) {
    return serviceFailed(error)
  }
}

export async function onRequestPut({ env, request }) {
  const auth = await requireAdmin(env, request)
  if (auth.response) return auth.response
  // A settings edit is tiny. Bound the streamed body as well as Content-Length.
  let body = ''
  if (request.body) {
    const reader = request.body.getReader()
    const decoder = new TextDecoder()
    let bytes = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > 2048) {
          await reader.cancel()
          return json({ error: 'bad_body' }, 400)
        }
        body += decoder.decode(value, { stream: true })
      }
      body += decoder.decode()
    } catch {
      return json({ error: 'bad_body' }, 400)
    }
  }
  let setting
  try { setting = JSON.parse(body) } catch { return json({ error: 'bad_body' }, 400) }
  if (!isGameSetting(setting)) return json({ error: 'bad_body' }, 400)
  const { game, availability, beta } = setting
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO game_settings (game, availability, beta, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?) ON CONFLICT(game) DO UPDATE SET
        availability = excluded.availability, beta = excluded.beta,
        updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
        .bind(game, availability, Number(beta), new Date().toISOString(), auth.username),
      logStatement(env, auth.username, 'game-settings', game, { availability, beta }),
    ])
    return json({ ok: true })
  } catch (error) {
    return serviceFailed(error)
  }
}
