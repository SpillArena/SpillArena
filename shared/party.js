/**
 * Party mode: pure state machine shared by the Durable Object (workers/parties) and the tests.
 *
 * A party is a plain JSON document. Nothing here does I/O or reads the clock; callers pass `now`.
 * Every transition returns `{ party }` or `{ error }` and never mutates its input.
 */
import { isGame, partyLimits } from './games-registry.js'

/** Second WebSocket subprotocol slot carries the account token, browsers cannot set headers. */
export const PROTOCOL = 'spillarena-party'
/** No I, L, O or U, so a code read aloud or off a screen is not misread. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ'
export const PARTY_CODE = /^[ABCDEFGHJKMNPQRSTVWXYZ]{4}$/
export const MAX_MEMBERS = 12
export const MAX_MESSAGE_BYTES = 512

const same = (a, b) => a.toLowerCase() === b.toLowerCase()
const find = (party, name) => party.members.find(member => same(member.name, name))

/** A new party with its creator as leader. */
export function createParty(code, name, now) {
  return { code, leader: name, game: null, host: null, round: 0, created: now, members: [{ name, joined: now, online: true }] }
}

/** Oldest online member, else oldest member. Used whenever the leader goes away. */
function successor(members) {
  return members.find(member => member.online) ?? members[0] ?? null
}

/** A member joins, or comes back after a dropped connection. */
export function join(party, name, now) {
  const existing = find(party, name)
  if (existing) {
    const members = party.members.map(member => (member === existing ? { ...member, online: true } : member))
    return { party: { ...party, members, leader: party.leader } }
  }
  if (party.members.length >= MAX_MEMBERS) return { error: 'party_full' }
  // The open game's room is full: a late joiner waits on the party screen instead of being refused by the game.
  const limits = party.game ? partyLimits(party.game) : null
  if (limits && party.members.length >= limits.max) return { error: 'game_full' }
  return { party: { ...party, members: [...party.members, { name, joined: now, online: true }] } }
}

/** The socket dropped but the member stays, so a page reload keeps its seat. A leader that is offline hands over. */
export function disconnect(party, name) {
  const members = party.members.map(member => (same(member.name, name) ? { ...member, online: false } : member))
  const next = { ...party, members }
  if (same(party.leader, name)) {
    const heir = successor(members.filter(member => !same(member.name, name)))
    if (heir && heir.online) next.leader = heir.name
  }
  return { party: next }
}

/** The member leaves for good. Returns `{ party: null }` when nobody is left. */
export function leave(party, name) {
  const members = party.members.filter(member => !same(member.name, name))
  if (!members.length) return { party: null }
  const next = { ...party, members }
  if (same(party.leader, name)) next.leader = successor(members).name
  return { party: next }
}

/**
 * Only the leader picks, and only a game this site knows that has a multiplayer room and takes the party as it stands:
 * at least `min` members online, at most `max` seats taken. Availability is enforced by the router when the game loads.
 * Picking a game makes the picker the room's host and starts a new round, so the same game picked twice is a fresh room.
 */
export function selectGame(party, name, slug) {
  if (!same(party.leader, name)) return { error: 'not_leader' }
  if (slug === null) return { party: { ...party, game: null, host: null } }
  if (!isGame(slug)) return { error: 'unknown_game' }
  const limits = partyLimits(slug)
  if (!limits) return { error: 'not_party_game' }
  if (party.members.filter(member => member.online).length < limits.min) return { error: 'too_few_players' }
  if (party.members.length > limits.max) return { error: 'too_many_players' }
  return { party: { ...party, game: slug, host: party.leader, round: (party.round ?? 0) + 1 } }
}

export function kick(party, name, target) {
  if (!same(party.leader, name)) return { error: 'not_leader' }
  const member = find(party, target)
  if (!member) return { error: 'not_member' }
  if (same(member.name, name)) return { error: 'bad_target' }
  return { party: { ...party, members: party.members.filter(entry => entry !== member) } }
}

export function transferLeader(party, name, target) {
  if (!same(party.leader, name)) return { error: 'not_leader' }
  const member = find(party, target)
  if (!member) return { error: 'not_member' }
  return { party: { ...party, leader: member.name } }
}

/** Applies one validated client message. `leave` is handled by the caller (it also closes the socket). */
export function apply(party, name, message) {
  switch (message.t) {
    case 'select_game': return selectGame(party, name, message.game)
    case 'kick': return kick(party, name, message.name)
    case 'transfer': return transferLeader(party, name, message.name)
    default: return { error: 'bad_message' }
  }
}

/** Anything not in the protocol is dropped here, so the room never sees free-form client text. */
export function parseClientMessage(value) {
  if (value === null || typeof value !== 'object') return null
  switch (value.t) {
    case 'leave': return { t: 'leave' }
    case 'select_game':
      return value.game === null || isGame(value.game) ? { t: 'select_game', game: value.game } : null
    case 'kick':
    case 'transfer':
      return typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 64 ? { t: value.t, name: value.name } : null
    default: return null
  }
}

/** What clients see. Joined time stays on the server. */
export function viewFor(party) {
  return {
    code: party.code,
    leader: party.leader,
    game: party.game,
    host: party.host ?? null,
    round: party.round ?? 0,
    members: party.members.map(({ name, online }) => ({ name, online })),
  }
}
