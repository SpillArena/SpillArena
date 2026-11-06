import { readGameSettings } from '../shared/game-settings.js'
import { renderSitemap } from '../shared/site-pages.js'

export async function onRequestGet({ env }) {
  try {
    return new Response(renderSitemap(await readGameSettings(env)), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch {
    // Do not publish a successful, stale sitemap when availability cannot be read.
    console.error('sitemap: unable to read game availability')
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } })
  }
}
