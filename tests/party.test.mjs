import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_MEMBERS, apply, createParty, disconnect, join, kick, leave, parseClientMessage, selectGame, transferLeader, viewFor } from '../shared/party.js'
import { onRequest } from '../functions/api/party/[code].js'

const start = () => createParty('ABCD', 'Anna', 1)
const withBob = () => join(start(), 'Bob', 2).party

test('creator is leader and the only member', () => {
  const party = start()
  assert.equal(party.leader, 'Anna')
  assert.equal(party.game, null)
  assert.deepEqual(viewFor(party).members, [{ name: 'Anna', online: true }])
})

test('join is case-insensitive and re-uses the existing seat', () => {
  const party = withBob()
  const again = join(party, 'bob', 3).party
  assert.equal(again.members.length, 2)
  assert.ok(again.members.every(member => member.online))
})

test('party is capped', () => {
  let party = start()
  for (let i = 1; i < MAX_MEMBERS; i++) party = join(party, `P${i}`, i).party
  assert.deepEqual(join(party, 'Extra', 99), { error: 'party_full' })
})

test('only the leader selects a known game', () => {
  const party = withBob()
  assert.deepEqual(selectGame(party, 'Bob', 'fleetbot'), { error: 'not_leader' })
  assert.deepEqual(selectGame(party, 'Anna', 'nope'), { error: 'unknown_game' })
  assert.equal(selectGame(party, 'Anna', 'fleetbot').party.game, 'fleetbot')
  assert.equal(selectGame(selectGame(party, 'Anna', 'fleetbot').party, 'Anna', null).party.game, null)
})

test('leader leaving promotes the oldest member; last leave ends the party', () => {
  const party = join(withBob(), 'Cleo', 3).party
  const after = leave(party, 'Anna').party
  assert.equal(after.leader, 'Bob')
  assert.equal(leave(leave(after, 'Bob').party, 'Cleo').party, null)
})

test('offline leader hands over to an online member, offline-only party keeps its leader', () => {
  const party = withBob()
  assert.equal(disconnect(party, 'Anna').party.leader, 'Bob')
  const alone = disconnect(disconnect(party, 'Bob').party, 'Anna').party
  assert.equal(alone.leader, 'Anna')
  assert.ok(alone.members.every(member => !member.online))
})

test('rejoining after a drop keeps the seat and the selected game', () => {
  const picked = selectGame(withBob(), 'Anna', 'hangbot').party
  const back = join(disconnect(picked, 'Bob').party, 'Bob', 9).party
  assert.equal(back.game, 'hangbot')
  assert.equal(back.members.find(member => member.name === 'Bob').online, true)
})

test('kick and transfer are leader only and validate the target', () => {
  const party = withBob()
  assert.deepEqual(kick(party, 'Bob', 'Anna'), { error: 'not_leader' })
  assert.deepEqual(kick(party, 'Anna', 'Anna'), { error: 'bad_target' })
  assert.deepEqual(kick(party, 'Anna', 'Zed'), { error: 'not_member' })
  assert.equal(kick(party, 'Anna', 'Bob').party.members.length, 1)
  assert.deepEqual(transferLeader(party, 'Bob', 'Bob'), { error: 'not_leader' })
  assert.equal(transferLeader(party, 'Anna', 'Bob').party.leader, 'Bob')
})

test('transitions do not mutate their input', () => {
  const party = withBob()
  const snapshot = structuredClone(party)
  selectGame(party, 'Anna', 'fleetbot'); kick(party, 'Anna', 'Bob'); leave(party, 'Anna'); disconnect(party, 'Anna')
  assert.deepEqual(party, snapshot)
})

test('client messages outside the protocol are dropped', () => {
  assert.deepEqual(parseClientMessage({ t: 'select_game', game: 'fleetbot' }), { t: 'select_game', game: 'fleetbot' })
  assert.equal(parseClientMessage({ t: 'select_game', game: '<script>' }), null)
  assert.equal(parseClientMessage({ t: 'kick', name: '' }), null)
  assert.equal(parseClientMessage({ t: 'nope' }), null)
  assert.equal(parseClientMessage('x'), null)
  assert.deepEqual(apply(start(), 'Anna', { t: 'leave' }), { error: 'bad_message' })
})

test('party endpoint rejects bad codes, plain requests and unbound deployments', async () => {
  const upgrade = new Request('https://spillarena.no/api/party/ABCD', { headers: { Upgrade: 'websocket' } })
  assert.equal(onRequest({ request: upgrade, params: { code: 'AB1D' }, env: {} }).status, 400)
  assert.equal(onRequest({ request: new Request('https://spillarena.no/api/party/ABCD'), params: { code: 'ABCD' }, env: {} }).status, 426)
  assert.equal(onRequest({ request: upgrade, params: { code: 'ABCD' }, env: {} }).status, 503)
  let used = null
  const env = { PARTIES: { idFromName: name => name, get: id => ({ fetch: () => { used = id; return new Response('ok') } }) } }
  assert.equal(onRequest({ request: upgrade, params: { code: 'abcd' }, env }).status, 200)
  assert.equal(used, 'ABCD')
})

test('a game must have a multiplayer room and fit the party', () => {
  const alone = start()
  assert.deepEqual(selectGame(alone, 'Anna', 'hangbot'), { error: 'too_few_players' })
  const pair = withBob()
  assert.deepEqual(selectGame(pair, 'Anna', 'atlasmaster'), { error: 'not_party_game' })
  assert.equal(selectGame(pair, 'Anna', 'hangbot').party.game, 'hangbot')
  // An offline member does not count towards the minimum.
  assert.deepEqual(selectGame(disconnect(pair, 'Bob').party, 'Anna', 'hangbot'), { error: 'too_few_players' })
  let nine = pair
  for (let i = 0; i < 6; i++) nine = join(nine, `P${i}`, 10 + i).party
  assert.equal(selectGame(nine, 'Anna', 'hangbot').party.game, 'hangbot')
  nine = join(nine, 'P9', 99).party
  assert.deepEqual(selectGame(nine, 'Anna', 'hangbot'), { error: 'too_many_players' })
  assert.deepEqual(selectGame(join(pair, 'Cleo', 3).party, 'Anna', 'fleetbot'), { error: 'too_many_players' })
  assert.equal(selectGame(nine, 'Anna', null).party.game, null)
})

test('picking a game makes the picker host and starts a new round', () => {
  const first = selectGame(withBob(), 'Anna', 'hangbot').party
  assert.deepEqual([first.host, first.round], ['Anna', 1])
  const swapped = transferLeader(first, 'Anna', 'Bob').party
  assert.equal(swapped.host, 'Anna')
  assert.deepEqual([viewFor(swapped).host, viewFor(swapped).round], ['Anna', 1])
  const again = selectGame(swapped, 'Bob', 'hangbot').party
  assert.deepEqual([again.host, again.round], ['Bob', 2])
  assert.equal(selectGame(again, 'Bob', null).party.host, null)
})

test('a late joiner is turned away when the open game is full', () => {
  const duel = selectGame(withBob(), 'Anna', 'fleetbot').party
  assert.deepEqual(join(duel, 'Cleo', 3), { error: 'game_full' })
  assert.equal(join(disconnect(duel, 'Bob').party, 'Bob', 4).party.members.length, 2)
})
