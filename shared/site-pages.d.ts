import type { GameSetting } from './game-settings.js'
export const INFO_PATHS: { about: '/about/'; privacy: '/privacy/'; terms: '/terms/'; faq: '/faq/'; contact: '/contact/'; guides: '/games/' }
export function guidePath(slug: string): string
export function renderSitemap(games: GameSetting[]): string
