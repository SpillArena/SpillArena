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
      assert.ok(guide.sections.length >= 5 && guide.faq.length >= 4, `${slug}: ${language} structure`)
      const words = [guide.intro, ...guide.sections.flatMap(s => s.p), ...guide.faq.map(f => f.a)].join(' ').split(/\s+/).length
      assert.ok(words >= 450, `${slug}: ${language} has ${words} words`)
      for (const value of [guide.title, guide.intro, ...guide.sections.map(s => s.h), ...guide.sections.flatMap(s => s.p), ...guide.faq.flatMap(f => [f.q, f.a])]) {
        assert.ok(value.length > 0)
        // HTML escapes punctuation; content comes from the same shared object.
        assert.ok(html.includes(value.slice(0, 20).replaceAll('&', '&amp;').replaceAll('"', '&quot;')), `${slug}: ${language}: ${value.slice(0, 20)}`)
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
    assert.ok(html.includes(guideFor(slug, 'no').sections[0].p[0].slice(0, 30)), slug)
    assert.ok(html.includes(`rel="canonical" href="https://spillarena.no${guidePath(slug)}"`), slug)
  }
})

test('guide back link returns to the guide index, other pages to the lobby', () => {
  const guide = renderToStaticMarkup(createElement(EditorialArticle, { slug: GUIDE_SLUGS[0], language: 'no' }))
  assert.match(guide, /class="back-link" href="\/games\/"/)
  const page = renderToStaticMarkup(createElement(EditorialArticle, { page: 'about', language: 'no' }))
  assert.match(page, /class="back-link" href="\/"/)
})

test('guide index is a poster grid with one linked card per game, and posters ship with the build', async () => {
  const html = renderToStaticMarkup(createElement(EditorialArticle, { page: 'guides', language: 'no' }))
  assert.equal(html.match(/class="guide-card"/g).length, GUIDE_SLUGS.length)
  for (const slug of GUIDE_SLUGS) assert.ok(html.includes(`href="${guidePath(slug)}"`), slug)
  for (const src of html.match(/\/art\/games\/[A-Za-z]+\.no\.svg/g)) await readFile(`dist${src}`, 'utf8')
})
