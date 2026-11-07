import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { EditorialArticle, HomeIntroduction, GUIDE_SLUGS, INFO_PATHS, guideFor, guidePath, copyFor, pageMetadata, posterPath, type InfoPage, type GuideSlug } from '../src/content/pages.ts'
import { GAME_DEFAULTS } from '../shared/game-settings.js'
import { renderSitemap } from '../shared/site-pages.js'

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const CONTENT = /<!--app-content-->[\s\S]*?<!--\/app-content-->/

export function staticDocumentBody(page?: InfoPage, slug?: GuideSlug): string {
  const copy = copyFor('no')
  const body = page || slug ? h(EditorialArticle, { page, slug, language: 'no' }) : h('div', null,
    h('h1', null, 'SpillArena: gratis nettleserspill på norsk'), h(HomeIntroduction, { language: 'no' }),
    h('section', { className: 'legal-page', id: 'games' }, h('h2', null, copy.content.guidesTitle),
      ...GUIDE_SLUGS.map(key => h('section', { key }, h('h3', null, h('a', { href: guidePath(key) }, guideFor(key, 'no').title)),
        h('p', null, guideFor(key, 'no').intro))))
  )
  return renderToStaticMarkup(h('div', { className: 'lobby-app' },
    h('header', { className: 'site-header arena-container' }, h('a', { className: 'brand', href: '/' }, 'SpillArena.')),
    h('main', { className: 'arena-container lobby-content', id: 'main-content' }, body),
    h('footer', { className: 'site-footer arena-container' }, h('nav', { className: 'footer-links', 'aria-label': copy.lobby.footerNavigation },
      ...Object.entries(INFO_PATHS).map(([key, path]) => h('a', { key, href: path }, key === 'about' ? copy.content.aboutLink : key === 'guides' ? copy.content.guidesLink : key === 'contact' ? copy.contact.title : copy.legal[key as 'privacy' | 'terms' | 'faq'].title)))))
  )
}


/** One connected JSON-LD graph per static page, as on the home page: Organization and
 * WebSite share @ids with index.html, the page points at its breadcrumb, and
 * FAQPage / VideoGame are only emitted where the visible text holds the same content. */
function pageSchema(url: string, title: string, description: string, page?: InfoPage, slug?: GuideSlug) {
  const site = 'https://spillarena.no'
  const organization = `${site}/#organization`
  const website = `${site}/#website`
  const trail = [{ name: 'SpillArena', url: `${site}/` }]
  if (slug) trail.push({ name: copyFor('no').content.guidesLink, url: `${site}${INFO_PATHS.guides}` })
  trail.push({ name: title, url })
  const faq = slug ? guideFor(slug, 'no').faq : page === 'faq' ? copyFor('no').legal.faq.items : []
  const type = page === 'about' ? 'AboutPage' : page === 'contact' ? 'ContactPage' : page === 'guides' ? 'CollectionPage' : 'WebPage'
  const graph: object[] = [
    { '@type': 'Organization', '@id': organization, name: 'SpillArena', url: `${site}/`, logo: `${site}/logo.png`, sameAs: ['https://github.com/SpillArena'] },
    { '@type': 'WebSite', '@id': website, name: 'SpillArena', alternateName: ['Spill Arena', 'SpillArena.no'], url: `${site}/`, inLanguage: ['nb', 'en'], publisher: { '@id': organization } },
    { '@type': type, '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'nb', isPartOf: { '@id': website }, breadcrumb: { '@id': `${url}#breadcrumb` },
      ...(slug ? { mainEntity: { '@id': `${url}#game` } } : {}) },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) },
  ]
  if (faq.length) graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) })
  if (slug) graph.push({ '@type': 'VideoGame', '@id': `${url}#game`, name: title.split(': ')[0], description, url, image: `${site}${posterPath(slug, 'no')}`,
    inLanguage: ['nb', 'en'], applicationCategory: 'Game', operatingSystem: 'Any', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' }, publisher: { '@id': organization } })
  return { '@context': 'https://schema.org', '@graph': graph }
}

/** Information is shipped in HTML as well as React; there is no crawler-only
 * version and no API/network dependency during a production build. */
export function contentPages(): Plugin {
  let outDir = ''
  let artDir = ''
  return {
    name: 'spillarena-content-pages',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); artDir = resolve(config.root, 'src/assets/games') },
    configureServer(server) {
      // Dev: serve the posters from the generated art folder, as the build copies them to /art/games/.
      server.middlewares.use('/art/games', async (request, response, next) => {
        const name = decodeURIComponent((request.url ?? '').split('?')[0].slice(1))
        if (!/^[A-Za-z]+\.(no|en)\.svg$/.test(name)) return next()
        try { response.setHeader('Content-Type', 'image/svg+xml'); response.end(await readFile(resolve(artDir, name))) } catch { next() }
      })
    },
    transformIndexHtml(html) {
      const list = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: GUIDE_SLUGS.map((slug, index) => ({ '@type': 'ListItem', position: index + 1,
          url: `https://spillarena.no${guidePath(slug)}`, name: guideFor(slug, 'no').title })) })
      return html.replace(CONTENT, `<!--app-content-->${staticDocumentBody()}<!--/app-content-->`)
        .replace(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*?"@type": "ItemList"[\s\S]*?<\/script>/, `<script type="application/ld+json">${list}</script>`)
    },
    async writeBundle() {
      const template = await readFile(resolve(outDir, 'index.html'), 'utf8')
      if (!CONTENT.test(template)) throw new Error('Missing app content markers in built index.html')
      const pages = [
        ...Object.entries(INFO_PATHS).map(([page, path]) => ({ page: page as InfoPage, path, slug: undefined })),
        ...GUIDE_SLUGS.map(slug => ({ page: undefined, path: guidePath(slug), slug })),
      ]
      for (const { page, path, slug } of pages) {
        const { title, description } = pageMetadata('no', page, slug)
        const url = `https://spillarena.no${path}`
        let html = template.replace(CONTENT, `<!--app-content-->${staticDocumentBody(page, slug)}<!--/app-content-->`)
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)} · SpillArena</title>`)
          .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(description)}" />`)
          .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escape(title)}" />`)
          .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escape(description)}" />`)
          .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
          .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escape(title)}" />`)
          .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escape(description)}" />`)
          .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
          // The text is the page here and is already readable, so the boot loader must not sit on top of it. It stays in
          // the DOM, hidden, because "Play" on a guide shows it through showLoader() while the game loads.
          .replace('class="arena-loader is-boot"', 'class="arena-loader is-hidden"')
        const schema = JSON.stringify(pageSchema(url, title, description, page, slug)).replaceAll('<', '\\u003c')
        html = html.replace('</head>', `<script type="application/ld+json">${schema}</script>\n</head>`)
        const directory = resolve(outDir, path.slice(1))
        await mkdir(directory, { recursive: true })
        await writeFile(resolve(directory, 'index.html'), html)
      }
      const posters = (await readdir(artDir)).filter(file => /^[A-Za-z]+\.(no|en)\.svg$/.test(file))
      await mkdir(resolve(outDir, 'art/games'), { recursive: true })
      await Promise.all(posters.map(file => cp(resolve(artDir, file), resolve(outDir, 'art/games', file))))
      // Static preview fallback; Pages serves the D1-backed function in production.
      await writeFile(resolve(outDir, 'sitemap.xml'), renderSitemap(GAME_DEFAULTS))
    },
  }
}
