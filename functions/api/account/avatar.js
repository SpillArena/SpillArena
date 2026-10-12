import { json, requireUser, serviceFailed } from '../../../shared/account-server.js'
import { readAvatar, validAvatar } from '../../../shared/avatar.js'

/** The signed-in player's picture choice — what the games draw next to the name. */
export async function onRequestGet({ env, request }) {
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response
  try {
    const row = await env.DB.prepare('SELECT avatar FROM players WHERE username = ?').bind(auth.username).first()
    return json({ avatar: readAvatar(row?.avatar) })
  } catch (error) { return serviceFailed(error) }
}

export async function onRequestPut({ env, request }) {
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response
  try {
    if (Number(request.headers.get('Content-Length')) > 1024) return json({ error: 'bad_body' }, 400)
    const reader = request.body?.getReader()
    if (!reader) return json({ error: 'bad_body' }, 400)
    const decoder = new TextDecoder()
    let raw = ''
    let bytes = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 1024) { await reader.cancel(); return json({ error: 'bad_body' }, 400) }
      raw += decoder.decode(value, { stream: true })
    }
    raw += decoder.decode()
    let body
    try { body = JSON.parse(raw) } catch { return json({ error: 'bad_body' }, 400) }
    if (!body || !Object.hasOwn(body, 'avatar') || (body.avatar !== null && !validAvatar(body.avatar))) {
      return json({ error: 'bad_body' }, 400)
    }
    const avatar = body.avatar === null ? null : {
      style: body.avatar.style, seed: body.avatar.seed,
      ...(body.avatar.options ? { options: { ...body.avatar.options } } : {}),
    }
    await env.DB.prepare('UPDATE players SET avatar = ? WHERE username = ?')
      .bind(avatar === null ? null : JSON.stringify(avatar), auth.username).run()
    return json({ avatar })
  } catch (error) { return serviceFailed(error) }
}
