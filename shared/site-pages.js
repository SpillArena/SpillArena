/** Public document routes, shared by build output and the live sitemap. */
export const INFO_PATHS = {
  about: '/about/', privacy: '/privacy/', terms: '/terms/', faq: '/faq/', contact: '/contact/', guides: '/games/',
}
export const guidePath = slug => `/games/${slug}/`

/** Only published games appear as playable URLs. Guides stay available even
 * during maintenance, so players can still read the rules and get help. */
export function renderSitemap(games) {
  const paths = ['/', ...Object.values(INFO_PATHS), ...games.map(game => guidePath(game.game)),
    ...games.filter(game => game.availability === 'available').map(game => `/${game.game}/`)]
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + paths.map(path => `  <url><loc>https://spillarena.no${path}</loc></url>`).join('\n') + '\n</urlset>\n'
}
