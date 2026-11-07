import { PARTY_CODE } from '../../../shared/party.js'

/** Hands the WebSocket upgrade to that party's Durable Object (see workers/parties). The object checks the account token. */
export function onRequest({ request, params, env }) {
  const code = String(params.code).toUpperCase()
  if (!PARTY_CODE.test(code)) return new Response('Bad party code', { status: 400 })
  if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 })
  // Until the parties Worker is deployed and bound, say so instead of throwing.
  if (!env.PARTIES) return new Response('Party mode is not set up on this deployment', { status: 503 })
  return env.PARTIES.get(env.PARTIES.idFromName(code)).fetch(request)
}
