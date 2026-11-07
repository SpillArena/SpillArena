import type { Game } from '../data/games'

/** The path segment the router uses (spillarena.no/<slug>), and the id the party protocol speaks. */
export const gameSlug = (game: Game): string => new URL(game.liveUrl).pathname.split('/')[1]

/**
 * Where a party member enters a game. The party code is the room code: the member who picked the game (`host`) opens
 * the room with it on load, everyone else joins it, so nobody creates or types a room in the game. `round` tells the
 * game that this is a new pick, not a reload. See docs/OPERATIONS.md, "Party mode", for what a game does with these.
 */
export const partyGameUrl = (slug: string, code: string, round: number, host: boolean): string =>
  `/${slug}/?party=${code}&partyRole=${host ? 'host' : 'guest'}&partyRound=${round}`
