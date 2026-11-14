import { PARTY_CODE, PROTOCOL } from '../../../shared/party.js'
import { verifyToken } from '../../../shared/account-server.js'

/**
 * Hands the WebSocket upgrade to that party's Durable Object (see workers/parties).
 * The account token is checked here first, so a request without a valid account never wakes a Durable Object;
 * the object checks it again, because it is the one that trusts the name.
 */
export async function onRequest({ request, params, env }) {
  const code = String(params.code).toUpperCase()
  if (!PARTY_CODE.test(code)) return new Response('Bad party code', { status: 400 })
  if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 })
  // Until the parties Worker is deployed and bound, say so instead of throwing.
  if (!env.PARTIES) return new Response('Party mode is not set up on this deployment', { status: 503 })
  const offered = (request.headers.get('Sec-WebSocket-Protocol') ?? '').split(',').map(value => value.trim())
  const name = offered.includes(PROTOCOL) ? await verifyToken(env.AUTH_SECRET, offered.find(value => value !== PROTOCOL)) : null
  if (!name) return new Response('Unauthorized', { status: 401 })
  return env.PARTIES.get(env.PARTIES.idFromName(code)).fetch(request)
}
