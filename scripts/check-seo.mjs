// Verify the real production artifacts in dist/: every public document has its own
// metadata and structured data, the sitemap matches the pages, and the 404 is noindex.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '../dist')
const read = path => readFileSync(join(dist, path), 'utf8')
const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const sitemap = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname)
// Playable URLs (/fleetbot/ ...) belong to the game projects; only documents are checked here.
const documents = sitemap.filter(path => path === '/' || /^\/(about|privacy|terms|faq|contact|games)\//.test(path))
assert.ok(documents.length >= 17, `expected the home page, info pages and every guide, got ${documents.length}`)
const titles = new Set()

for (const path of [...documents, '/404.html']) {
  const html = read(path === '/' ? 'index.html' : path.endsWith('.html') ? path.slice(1) : `${path.slice(1)}index.html`)
  const notFound = path === '/404.html'
  assert.match(html, /<html lang="no">/, `${path}: document language`)
  assert.equal((html.match(/<title>/g) ?? []).length, 1, `${path}: one title`)
  const title = decode(html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '')
  assert.ok(!titles.has(title), `${path}: distinct title`)
  titles.add(title)
  if (notFound) { assert.match(html, /<meta name="robots" content="noindex/, '404: noindex'); continue }
  assert.ok(title.includes('SpillArena'), `${path}: title names the site`)
  assert.equal((html.match(/name="description"/g) ?? []).length, 1, `${path}: one description`)
  const description = decode(html.match(/<meta name="description"\s+content="([^"]+)"/)?.[1] ?? '')
  assert.ok(description.length >= 30, `${path}: useful description`)
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  assert.equal(canonical, `https://spillarena.no${path}`, `${path}: canonical`)
  assert.equal(html.match(/<meta property="og:url" content="([^"]+)"/)?.[1], canonical, `${path}: og:url`)
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path}: one primary heading`)
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html), `${path}: indexable`)
  assert.ok(!/class="arena-loader is-boot"/.test(html) || path === '/', `${path}: readable text must not sit under the boot loader`)
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]))
  assert.ok(scripts.length > 0, `${path}: structured data`)
  if (path === '/') continue
  const graph = scripts.flatMap(script => script['@graph'] ?? [script])
  const page = graph.find(item => item['@id'] === `${canonical}#webpage`)
  assert.ok(page, `${path}: page node`)
  assert.equal(page.url, canonical, `${path}: schema url`)
  assert.equal(page.description, description, `${path}: schema description agrees with HTML`)
  assert.ok(graph.some(item => item['@type'] === 'BreadcrumbList' && item['@id'] === page.breadcrumb['@id']), `${path}: breadcrumb`)
  if (path.startsWith('/games/') && path !== '/games/') {
    assert.ok(graph.some(item => item['@type'] === 'VideoGame'), `${path}: game identity`)
    assert.ok(graph.some(item => item['@type'] === 'FAQPage'), `${path}: FAQ schema`)
    assert.ok(html.includes('guide-faq'), `${path}: FAQ is visible, not only in schema`)
  }
}
assert.match(read('robots.txt'), /Sitemap: https:\/\/spillarena\.no\/sitemap\.xml/)
assert.ok(read('llms.txt').includes('https://spillarena.no/games/'), 'llms.txt is published')
console.log(`SEO checks passed: ${documents.length} documents, metadata, structured data, sitemap and 404.`)
