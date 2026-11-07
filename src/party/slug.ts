import type { Game } from '../data/games'

/** The path segment the router uses (spillarena.no/<slug>), and the id the party protocol speaks. */
export const gameSlug = (game: Game): string => new URL(game.liveUrl).pathname.split('/')[1]
