import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { EditorialArticle, GUIDE_SLUGS, INFO_PATHS, guideFor, guidePath, pageMetadata } from '../src/content/pages.ts'
import { currentPage, legacyInfoPath } from '../src/lib/pages.ts'
import { GAME_DEFAULTS } from '../shared/game-settings.js'
import { onRequestGet } from '../functions/sitemap.xml.js'

test('real document routes and old shared information links resolve correctly', () => {
  for (const [page, path] of Object.entries(INFO_PATHS)) {
    assert.equal(currentPage(`https://spillarena.no${path}`), page)
    assert.equal(currentPage(`https://spillarena.no${path.replace(/\/$/, '')}`), page)
    assert.equal(legacyInfoPath(`https://spillarena.no/#${page}`), path)
  }
  for (const slug of GUIDE_SLUGS) assert.equal(currentPage(`https://spillarena.no${guidePath(slug)}`), 'guide')
  assert.equal(currentPage('https://spillarena.no/#profile'), 'profile')
  assert.equal(currentPage('https://spillarena.no/?recover=1'), 'recover')
  assert.equal(legacyInfoPath('https://spillarena.no/#profile'), undefined)
})

test('all game guides contain rules, examples and tips in both supported languages', () => {
  assert.deepEqual([...GUIDE_SLUGS].sort(), GAME_DEFAULTS.map(g => g.game).sort())
  for (const language of ['no', 'en']) {
    for (const slug of GUIDE_SLUGS) {
      const guide = guideFor(slug, language)
      const html = renderToStaticMarkup(createElement(EditorialArticle, { slug, language }))
      for (const value of [guide.title, guide.intro, guide.rules, guide.example, guide.tip]) {
        assert.ok(value.length > 20)
        // HTML escapes punctuation; content comes from the same shared object.
        assert.ok(html.includes(value.slice(0, 20)), `${slug}: ${language}`)
      }
      assert.equal(pageMetadata(language, undefined, slug).path, guidePath(slug))
    }
  }
})

test('live sitemap follows availability, includes newly released games, and does not fabricate lastmod', async () => {
  let rows = [{ game: 'hitline', availability: 'unavailable', beta: 1 }, { game: 'cracked', availability: 'available', beta: 1 }]
  const env = { DB: { prepare: () => ({ all: async () => ({ results: rows }) }) } }
  let response = await onRequestGet({ env })
  let xml = await response.text()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('Content-Type'), /application\/xml/)
  assert.ok(xml.includes('https://spillarena.no/cracked/</loc>'))
  assert.ok(!xml.includes('https://spillarena.no/hitline/</loc>'))
  assert.ok(xml.includes('https://spillarena.no/games/hitline/</loc>'))
  assert.ok(xml.includes('https://spillarena.no/privacy/</loc>'))
  assert.ok(!xml.includes('<lastmod>'))
  rows = [{ game: 'cracked', availability: 'unavailable', beta: 1 }]
  response = await onRequestGet({ env })
  xml = await response.text()
  assert.ok(!xml.includes('https://spillarena.no/cracked/</loc>'))
})

test('sitemap returns a retryable error when availability cannot be read', async t => {
  t.mock.method(console, 'error', () => {})
  const response = await onRequestGet({ env: { DB: { prepare: () => { throw new Error('offline') } } } })
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('built information documents have their own HTML, canonical and metadata without JS', async () => {
  for (const [page, path] of Object.entries(INFO_PATHS)) {
    const html = await readFile(`dist${path}index.html`, 'utf8')
    const { title } = pageMetadata('no', page)
    assert.ok(html.includes(`<h1>${title}</h1>`), page)
    assert.ok(html.includes(`rel="canonical" href="https://spillarena.no${path}"`), page)
    assert.ok(!html.includes('class="arena-loader is-boot"'), page)
    assert.ok(!html.includes('adsbygoogle.js'), page)
  }
  for (const slug of GUIDE_SLUGS) {
    const html = await readFile(`dist${guidePath(slug)}index.html`, 'utf8')
    assert.ok(html.includes(guideFor(slug, 'no').rules.slice(0, 30)), slug)
    assert.ok(html.includes(`rel="canonical" href="https://spillarena.no${guidePath(slug)}"`), slug)
  }
})
