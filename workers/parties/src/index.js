import { DurableObject } from 'cloudflare:workers'
import { verifyToken } from '../../../shared/account-server.js'
import { MAX_MESSAGE_BYTES, PARTY_CODE, PROTOCOL, apply, createParty, disconnect, join, leave, parseClientMessage, viewFor } from '../../../shared/party.js'

const IDLE_CLEANUP_MS = 10 * 60 * 1000
const TTL_MS = 24 * 60 * 60 * 1000
const nameOf = ws => ws.deserializeAttachment()?.name

/**
 * One party. The party is a JSON document (see shared/party.js) in this object's own SQLite storage; sockets use the
 * hibernation API, so an idle party costs nothing. Leader hand-over and membership live in the shared state machine.
 */
export class PartyRoom extends DurableObject {
  party = null

  constructor(ctx, env) {
    super(ctx, env)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
    void ctx.blockConcurrencyWhile(async () => { this.party = (await ctx.storage.get('party')) ?? null })
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 })
    const url = new URL(request.url)
    const code = (url.pathname.split('/').pop() ?? '').toUpperCase()
    if (!PARTY_CODE.test(code)) return new Response('Bad party code', { status: 400 })
    const offered = (request.headers.get('Sec-WebSocket-Protocol') ?? '').split(',').map(value => value.trim())
    const name = offered.includes(PROTOCOL) ? await verifyToken(this.env.AUTH_SECRET, offered.find(value => value !== PROTOCOL)) : null
    if (!name) return new Response('Unauthorized', { status: 401 })

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    const creating = url.searchParams.get('mode') === 'create'
    let error = null
    if (creating && this.party) error = 'exists'
    else if (!creating && !this.party) error = 'not_found'
    if (!error) {
      const now = Date.now()
      const joined = creating ? { party: createParty(code, name, now) } : join(this.party, name, now)
      if ('error' in joined) error = joined.error
      else {
        const member = joined.party.members.find(entry => entry.name.toLowerCase() === name.toLowerCase())
        server.serializeAttachment({ name: member.name })
        // One seat per account: a second tab replaces the first.
        for (const other of this.ctx.getWebSockets()) if (other !== server && nameOf(other)?.toLowerCase() === member.name.toLowerCase()) other.close(4002, 'replaced')
        // Someone is connected again, so the idle timer stops.
        delete joined.party.idleUntil
        await this.save(joined.party)
        await this.schedule()
        this.broadcast()
      }
    }
    if (error) {
      this.send(server, { t: 'error', code: error })
      server.close(4000, error)
    }
    return new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Protocol': PROTOCOL } })
  }

  async webSocketMessage(ws, message) {
    const name = nameOf(ws)
    if (!name || !this.party || typeof message !== 'string' || message.length > MAX_MESSAGE_BYTES) return
    let parsed = null
    try { parsed = parseClientMessage(JSON.parse(message)) } catch { /* answered below */ }
    if (!parsed) return this.send(ws, { t: 'error', code: 'bad_message' })
    if (parsed.t === 'leave') {
      await this.remove(name)
      try { ws.close(1000, 'left') } catch { /* already closed */ }
      return
    }
    const result = apply(this.party, name, parsed)
    if ('error' in result) return this.send(ws, { t: 'error', code: result.error })
    await this.save(result.party)
    // A removed member's socket is closed so the lobby shows them the party is gone.
    if (parsed.t === 'kick') for (const other of this.ctx.getWebSockets()) if (nameOf(other)?.toLowerCase() === parsed.name.toLowerCase()) { this.send(other, { t: 'kicked' }); other.close(4003, 'kicked') }
    this.broadcast()
  }

  async webSocketClose(ws) { await this.dropped(ws); try { ws.close() } catch { /* already closed */ } }
  async webSocketError(ws) { await this.dropped(ws) }

  async alarm() {
    const now = Date.now()
    const party = this.party
    if (party && now < party.created + TTL_MS && !(party.idleUntil && now >= party.idleUntil)) {
      await this.schedule()
      return
    }
    for (const ws of this.ctx.getWebSockets()) ws.close(1000, 'expired')
    await this.ctx.storage.deleteAll()
    this.party = null
  }

  async dropped(ws) {
    const name = nameOf(ws)
    if (!name || !this.party) return
    // A second tab replaced this socket: the seat is still in use.
    if (this.ctx.getWebSockets().some(other => other !== ws && nameOf(other)?.toLowerCase() === name.toLowerCase())) return
    const { party } = disconnect(this.party, name)
    if (!this.ctx.getWebSockets().some(other => other !== ws)) party.idleUntil = Date.now() + IDLE_CLEANUP_MS
    await this.save(party)
    await this.schedule()
    this.broadcast()
  }

  async remove(name) {
    const { party } = leave(this.party, name)
    if (!party) {
      await this.ctx.storage.deleteAll()
      this.party = null
      return
    }
    await this.save(party)
    this.broadcast()
  }

  async schedule() {
    if (!this.party) return
    await this.ctx.storage.setAlarm(Math.min(this.party.created + TTL_MS, this.party.idleUntil ?? Infinity))
  }

  async save(party) {
    this.party = party
    await this.ctx.storage.put('party', party)
  }

  send(ws, message) { try { ws.send(JSON.stringify(message)) } catch { /* the socket is gone */ } }

  broadcast() {
    if (!this.party) return
    const view = viewFor(this.party)
    for (const ws of this.ctx.getWebSockets()) if (nameOf(ws)) this.send(ws, { t: 'state', view })
  }
}

// Only the Pages Function reaches this Worker (through the PARTIES binding there). The route lets `wrangler dev` work without Pages.
export default {
  async fetch(request, env) {
    const match = new URL(request.url).pathname.match(/\/api\/party\/([A-Za-z]{4})$/)
    if (!match) return new Response('Not found', { status: 404 })
    const code = match[1].toUpperCase()
    if (!PARTY_CODE.test(code)) return new Response('Bad party code', { status: 400 })
    return env.PARTIES.get(env.PARTIES.idFromName(code)).fetch(request)
  },
}
